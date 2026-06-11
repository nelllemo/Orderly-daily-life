const express = require('express')
const axios = require('axios')

const router = express.Router()

// Try to extract JSON block from a textual response
const extractJsonFromText = (text) => {
  if (!text || typeof text !== 'string') return null
  // first try to find {...} or [...] blocks
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/) 
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch (e) {
      return null
    }
  }
  return null
}

// Parse common Chinese date/time phrases into concrete date/time
const parseChineseDateTime = (text) => {
  const now = new Date()

  // helper: next weekday (0=Sun..6=Sat)
  const nextWeekday = (weekday) => {
    const today = new Date()
    const todayW = today.getDay()
    let target = weekday
    let delta = (target - todayW + 7) % 7
    if (delta === 0) delta = 7 // next week same day
    const d = new Date(today)
    d.setDate(today.getDate() + delta)
    return d
  }

  // date patterns
  const ymd = text.match(/(\d{4}-\d{1,2}-\d{1,2})/)
  if (ymd) return { date: ymd[0] }

  const cnMonthDay = text.match(/(\d{1,2})月(\d{1,2})日/)
  if (cnMonthDay) {
    const mm = Number(cnMonthDay[1])
    const dd = Number(cnMonthDay[2])
    const year = now.getFullYear()
    const d = new Date(year, mm - 1, dd)
    return { date: d.toISOString().slice(0, 10) }
  }

  if (/今天/.test(text)) return { date: now.toISOString().slice(0, 10) }
  if (/明天/.test(text)) {
    const d = new Date(now); d.setDate(now.getDate() + 1); return { date: d.toISOString().slice(0, 10) }
  }
  if (/后天/.test(text)) {
    const d = new Date(now); d.setDate(now.getDate() + 2); return { date: d.toISOString().slice(0, 10) }
  }

  // weekdays: 周一..周日 或 星期一..星期日
  const wk = text.match(/(?:下?周|周|星期)([一二三四五六日天])/)
  if (wk) {
    const map = { 一:1, 二:2, 三:3, 四:4, 五:5, 六:6, 日:0, 天:0 }
    const w = map[wk[1]]
    const d = nextWeekday(w)
    return { date: d.toISOString().slice(0,10) }
  }

  return null
}

// Parse time like 14:30, 2点, 下午3点半, 上午9点
const parseChineseTime = (text) => {
  const hm = text.match(/(\d{1,2}:\d{2})/)
  if (hm) return { time: hm[0] }

  const hOnly = text.match(/(上午|下午|中午|傍晚)?\s*(\d{1,2})点(?:半|30)?/)
  if (hOnly) {
    let hour = Number(hOnly[2])
    const period = hOnly[1]
    if (period === '下午' || period === '傍晚') hour = (hour % 12) + 12
    const minute = /半|30/.test(hOnly[0]) ? '30' : '00'
    return { time: `${String(hour).padStart(2,'0')}:${minute}` }
  }

  return null
}

// Try to split plain text into candidate lines and extract date/time/title
const parseTextToCandidates = (text, prompt) => {
  if (!text || !text.trim()) return []
  // split by newline or Chinese punctuation
  const parts = text.split(/\n|；|;|。|\.|\uFF1B/).map(s => s.trim()).filter(Boolean)
  const candidates = []
  for (const part of parts) {
    // try to find date/time in the part
    const dt = parseChineseDateTime(part) || parseChineseDateTime(prompt) || {}
    const tm = parseChineseTime(part) || parseChineseTime(prompt) || {}
    // title: remove date/time phrases heuristically
    let title = part.replace(/\d{4}-\d{1,2}-\d{1,2}/g, '').replace(/\d{1,2}月\d{1,2}日/g, '')
    title = title.replace(/(?:下?周|周|星期)[一二三四五六日天]/g, '').replace(/(?:明天|后天|今天)/g, '')
    title = title.replace(/(?:上午|下午|中午|傍晚)?\s*\d{1,2}点(?:半|30)?/g, '').trim()
    if (!title) title = prompt.slice(0, 80)

    const candidate = {
      title: title.slice(0, 200),
      date: dt.date || null,
      time: tm.time || null,
      priority: 2,
      remark: '',
      raw: part
    }
    candidates.push(candidate)
  }
  return candidates
}

// POST /ai/schedule
// body: { prompt }
// Returns structured schedule candidates or fallback text/raw response
router.post('/schedule', async (req, res) => {
  const { prompt } = req.body || {}
  if (!prompt) return res.status(400).json({ message: 'Prompt is required.' })

  const endpoint = process.env.AI_ENDPOINT
  const apiKey = process.env.AI_API_KEY
  const model = process.env.AI_MODEL || 'glm-5'

  // If not configured, return a simulated candidate to allow frontend testing
  if (!endpoint || !apiKey) {
    // simulated structured result
    const simulated = [
      {
        title: '示例：下午完成项目报告',
        date: new Date().toISOString().slice(0, 10),
        time: '15:00',
        priority: 2,
        remark: '根据输入示例生成的日程样本',
        repeat: null
      }
    ]
    return res.status(200).json({ simulated: true, candidates: simulated })
  }

  try {
    const payload = {
      model,
      // many compatible-mode endpoints accept `input` or `messages`; include both in case
      input: prompt,
      prompt
    }

    const r = await axios.post(endpoint, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    })

    const data = r.data

    // Try multiple known shapes: data.choices[0].text, data.output, data.result, data
    let text = null
    if (data == null) {
      return res.status(502).json({ message: 'Empty response from AI provider.' })
    }

    if (typeof data === 'string') text = data
    else if (data.choices && data.choices[0] && (data.choices[0].text || data.choices[0].message)) {
      text = data.choices[0].text || data.choices[0].message
    } else if (data.output) {
      // some providers return { output: [{ content: '...' }] }
      if (Array.isArray(data.output)) text = data.output.map(o => (o.content || o)).join('\n')
      else text = data.output.content || JSON.stringify(data.output)
    } else if (data.result) text = data.result
    else if (data.data && data.data[0] && data.data[0].text) text = data.data[0].text
    else text = typeof data === 'object' ? JSON.stringify(data) : String(data)

    // attempt to extract structured JSON from the returned text
    const maybeJson = extractJsonFromText(text)
    if (maybeJson) {
      // if it's an object, normalize to array of candidates
      const candidates = Array.isArray(maybeJson) ? maybeJson : [maybeJson]
      return res.json({ candidates })
    }

    // if not JSON, try to parse plain text into structured candidates
    const parsed = parseTextToCandidates(text, prompt)
    if (parsed && parsed.length) return res.json({ candidates: parsed })

    // fallback: simple single candidate using lightweight heuristics
    const timeMatch = text.match(/(\d{1,2}:\d{2})/)
    const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/)
    const title = text.split('\n').slice(0, 2).join(' ').slice(0, 200)

    const candidate = {
      title: title || prompt,
      date: dateMatch ? dateMatch[0] : new Date().toISOString().slice(0, 10),
      time: timeMatch ? timeMatch[0] : null,
      priority: 2,
      remark: text.slice(0, 200),
      raw: text
    }

    return res.json({ candidates: [candidate] })
  } catch (err) {
    // If provider error, return simulated fallback along with error info
    const simulated = [
      {
        title: '示例：下午完成项目报告',
        date: new Date().toISOString().slice(0, 10),
        time: '15:00',
        priority: 2,
        remark: 'AI 服务调用失败，返回模拟结果',
        repeat: null
      }
    ]
    console.error('AI proxy error:', err.message || err)
    return res.status(502).json({ message: 'AI provider error', error: err.message, simulated: true, candidates: simulated })
  }
})

module.exports = router
