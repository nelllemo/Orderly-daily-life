const express = require('express')
const axios = require('axios')
const db = require('../db')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

// POST /api/ai/chat
// body: { messages: [{role,content},...], schedules: [...] }
// Returns: { reply: string, proposal: null | { title, date, time, priority, remark, location } }
router.post('/chat', async (req, res, next) => {
  const { messages = [], schedules = [] } = req.body || {}
  if (!messages.length) {
    const today = new Date()
    const todayStr = `${today.getFullYear()}年${today.getMonth()+1}月${today.getDate()}日`
    const reply = buildLocalReply([], [], todayStr)
    return res.json({ reply, proposal: null })
  }

  const endpoint = process.env.AI_ENDPOINT
  const apiKey = process.env.AI_API_KEY
  const model = process.env.AI_MODEL || 'qwen-plus'

  const today = new Date()
  const todayStr = `${today.getFullYear()}年${today.getMonth()+1}月${today.getDate()}日`
  const weekDay = ['周日','周一','周二','周三','周四','周五','周六'][today.getDay()]

  // Build existing schedule summary for AI context
  const scheduleSummary = schedules.length
    ? schedules.map(s => `- [${s.date}] ${s.time} ${s.title}${s.location ? ' @'+s.location : ''}（${s.completed ? '已完成' : '未完成'}）`).join('\n')
    : '（暂无日程）'

  const systemPrompt = `你是一个贴心的日程助手，名字叫"小日"。今天是${todayStr} ${weekDay}。

你的工作流程：
1. 主动询问用户最近有没有新的日程安排
2. 用户描述后，先检查下面的「用户现有日程」是否已存在相同或冲突的安排
3. 如果日程信息不完整（缺少时间、地点等），友好地追问用户
4. 确认所有必要信息后，帮用户整理好日程

用户现有日程：
${scheduleSummary}

重要规则：
- 语气温暖、简洁，不要长篇大论
- 识别用户的日期表达（明天、下周五、6月20日等），结合今天是${todayStr}来计算具体日期
- 当你确认可以添加日程时，在回复末尾附上一个 JSON 代码块，格式：
\`\`\`schedule
{"title":"日程标题","date":"YYYY-MM-DD","time":"HH:mm","priority":2,"remark":"备注","location":"地点"}
\`\`\`
- priority: 1低 2中 3高
- 只在确认信息完整时才输出 schedule 代码块
- 如果用户说的日程已存在，告诉用户并询问是否要修改`

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ]

  // If no AI config, use local fallback
  if (!endpoint || !apiKey) {
    const reply = buildLocalReply(messages, schedules, todayStr)
    const proposal = extractProposal(reply)
    return res.json({ reply, proposal })
  }

  try {
    const apiUrl = endpoint.endsWith('/v1') ? `${endpoint}/chat/completions` : endpoint

    const r = await axios.post(apiUrl, {
      model,
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 1000
    }, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 45000
    })

    const choice = r.data?.choices?.[0]
    const msg = choice?.message
    const reply = (typeof msg === 'string') ? msg : (msg?.content || '抱歉，我没有理解，请再说一遍～')

    const proposal = extractProposal(reply)
    return res.json({ reply, proposal })

  } catch (err) {
    console.error('AI chat error:', err.response?.status, err.message, err.response?.data ? JSON.stringify(err.response.data).slice(0, 200) : '')
    const reply = buildLocalReply(messages, schedules, todayStr)
    const proposal = extractProposal(reply)
    return res.json({ reply, proposal, fallback: true })
  }
})

// Extract schedule JSON block from AI reply
const extractProposal = (text) => {
  if (!text || typeof text !== 'string') return null
  const match = text.match(/```schedule\s*([\s\S]*?)```/)
  if (!match) return null
  try {
    return JSON.parse(match[1].trim())
  } catch (e) {
    return null
  }
}

// Local fallback when AI is unavailable
const parseRelativeDate = (text, today) => {
  const y = today.getFullYear()
  const m = today.getMonth() + 1
  const d = today.getDate()
  const dayOfWeek = today.getDay() // 0=Sun

  // Explicit date: 2026-06-16 or 6月20日
  let match = text.match(/(\d{4})[年-](\d{1,2})[月-](\d{1,2})/)
  if (match) {
    return `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`
  }
  match = text.match(/(\d{1,2})月(\d{1,2})/)
  if (match) {
    return `${y}-${String(match[1]).padStart(2, '0')}-${String(match[2]).padStart(2, '0')}`
  }

  if (/今天/.test(text)) return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  if (/明天/.test(text)) {
    const tm = new Date(today); tm.setDate(tm.getDate() + 1)
    return `${tm.getFullYear()}-${String(tm.getMonth()+1).padStart(2, '0')}-${String(tm.getDate()).padStart(2, '0')}`
  }
  if (/后天/.test(text)) {
    const tm = new Date(today); tm.setDate(tm.getDate() + 2)
    return `${tm.getFullYear()}-${String(tm.getMonth()+1).padStart(2, '0')}-${String(tm.getDate()).padStart(2, '0')}`
  }

  // Weekday: 下周一, 下周三, 周五 (this week or next)
  const weekMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '天': 0, '日': 0 }
  match = text.match(/下周([一二三四五六日天])/)
  if (match) {
    const target = weekMap[match[1]]
    const delta = (target - dayOfWeek + 7) % 7 + 7 // next week
    const tm = new Date(today); tm.setDate(tm.getDate() + delta)
    return `${tm.getFullYear()}-${String(tm.getMonth()+1).padStart(2, '0')}-${String(tm.getDate()).padStart(2, '0')}`
  }
  match = text.match(/周([一二三四五六日天])/)
  if (match) {
    const target = weekMap[match[1]]
    const delta = (target - dayOfWeek + 7) % 7
    const tm = new Date(today); tm.setDate(tm.getDate() + (delta === 0 ? 0 : delta))
    return `${tm.getFullYear()}-${String(tm.getMonth()+1).padStart(2, '0')}-${String(tm.getDate()).padStart(2, '0')}`
  }

  return null
}

const parseRelativeTime = (text) => {
  // Explicit: 15:00, 9:30
  let match = text.match(/(\d{1,2}):(\d{2})/)
  if (match) {
    return `${String(match[1]).padStart(2, '0')}:${match[2]}`
  }
  // 下午3点, 上午10点, 晚上8点
  match = text.match(/(上午|下午|晚上|中午|早上)(\d{1,2})点/)
  if (match) {
    let h = parseInt(match[2])
    const period = match[1]
    if (period === '下午' && h < 12) h += 12
    if (period === '晚上' && h < 12) h += 12
    if (period === '中午' && h < 12) h += 12  // 中午12点 = 12:00
    return `${String(h).padStart(2, '0')}:00`
  }
  // Just: 3点 (ambiguous, default to afternoon if < 6, else morning)
  match = text.match(/(\d{1,2})点/)
  if (match) {
    let h = parseInt(match[1])
    if (h < 6) h += 12 // assume afternoon/evening for 1-5点
    return `${String(h).padStart(2, '0')}:00`
  }
  // Just period: 下午, 上午
  if (/上午/.test(text)) return '09:00'
  if (/下午/.test(text)) return '15:00'
  if (/晚上/.test(text)) return '19:00'
  if (/中午/.test(text)) return '12:00'
  return null
}

const extractTitle = (text) => {
  return text
    .replace(/今天|明天|后天|下周[一二三四五六日天]|周[一二三四五六日天]/g, '')
    .replace(/\d{4}[年-]\d{1,2}[月-]\d{1,2}[日号]/g, '')
    .replace(/\d{1,2}月\d{1,2}[日号]/g, '')
    .replace(/上午\d{1,2}点|下午\d{1,2}点|晚上\d{1,2}点|早上\d{1,2}点|中午\d{1,2}点|\d{1,2}点半?/g, '')
    .replace(/\d{1,2}:\d{2}/g, '')
    .replace(/在|去|到/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60) || '新日程'
}

const buildLocalReply = (messages, schedules, todayStr) => {
  const lastUser = [...messages].reverse().find(m => m.role === 'user')
  const userText = lastUser?.content || ''

  if (!userText) {
    return `你好呀！我是你的日程助手小日 🌟\n\n今天是${todayStr}，最近有什么新的日程安排吗？可以告诉我你想做什么、什么时候、在哪里，我帮你整理到日历中～`
  }

  const today = new Date()
  const hasDate = /今天|明天|后天|下周|周[一二三四五六日天]|\d+月\d+日|\d+\.\d+|\d{4}-\d{2}-\d{2}/.test(userText)
  const hasTime = /\d+点|\d+:\d+|上午|下午|晚上|早上|中午/.test(userText)
  const hasPlace = /在|去|到|图书馆|教室|办公室|家|餐厅|咖啡|店|超市|商场|医院|学校/.test(userText)

  if (!hasTime && !hasDate) {
    return `好的，我记下了你想做的事情～不过我还想知道：你打算什么时候做呢？比如"明天下午3点"这样告诉我～`
  }

  if (!hasPlace && /开会|见面|聚餐|吃饭|学习/.test(userText)) {
    return `收到！不过这个活动有具体的地点吗？比如"在图书馆"、"在会议室"这样，方便我帮你记录得更加完整～`
  }

  if (hasDate || hasTime) {
    const date = parseRelativeDate(userText, today) || `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
    const time = parseRelativeTime(userText) || '09:00'
    const title = extractTitle(userText)

    return `好的，我帮你整理好了这个日程：\n\n📅 ${title}\n🕐 ${date} ${time}\n\n确认无误的话，点击下方按钮添加到日历吧～\n\`\`\`schedule\n{"title":"${title}","date":"${date}","time":"${time}","priority":2,"remark":"","location":""}\n\`\`\``
  }

  return `明白了！不过我还有些信息需要确认，能再详细说说时间或地点吗？😊`
}

// POST /api/ai/resume — generate personal growth resume from user data
router.post('/resume', authMiddleware, async (req, res, next) => {
  const t0 = Date.now()
  console.log('[resume] request received for user', req.user?.userId)
  try {
    const userId = req.user.userId

    // Fetch user profile with new fields
    const t1 = Date.now()
    const users = await db.query(
      'SELECT id, email, nickname, avatar, bio, goals, skills, interests FROM user WHERE id = ?',
      [userId]
    )
    console.log(`[resume] profile query: ${Date.now() - t1}ms`)
    if (!users.length) return res.status(404).json({ message: 'User not found.' })
    const profile = users[0]

    // Fetch completed schedules
    const t2 = Date.now()
    const schedules = await db.query(
      'SELECT title, date, time, remark, location FROM schedule WHERE user_id = ? AND completed = 1 ORDER BY date DESC LIMIT 20',
      [userId]
    )
    console.log(`[resume] schedules query: ${Date.now() - t2}ms, rows=${schedules.length}`)

    // Fetch recent moments
    const t3 = Date.now()
    const moments = await db.query(
      'SELECT content, date FROM moment WHERE user_id = ? ORDER BY date DESC LIMIT 10',
      [userId]
    )
    console.log(`[resume] moments query: ${Date.now() - t3}ms, rows=${moments.length}`)

    const result = buildLocalResume(profile, schedules, moments)
    console.log(`[resume] total: ${Date.now() - t0}ms`)
    return res.json(result)
  } catch (err) {
    console.error('[resume] error:', err.message, 'total:', Date.now() - t0, 'ms')
    next(err)
  }
})

// Local fallback resume generator
const buildLocalResume = (profile, schedules, moments) => {
  // Build skill tags from profile skills + extract keywords from schedule titles
  const skillTags = []
  if (profile.skills) {
    profile.skills.split(/[,，、\s]+/).filter(Boolean).forEach(s => {
      if (s && !skillTags.includes(s)) skillTags.push(s)
    })
  }
  // Extract keywords from completed schedule titles
  const keywordMap = {
    '学习': '学习', '考试': '考试', '复习': '复习', '课程': '课程',
    '项目': '项目管理', '答辩': '答辩', '论文': '论文写作', '报告': '报告',
    '运动': '运动', '跑步': '跑步', '健身': '健身', '游泳': '游泳',
    '编程': '编程', '代码': '编程', '开发': '开发', '设计': '设计',
    '兼职': '兼职', '实习': '实习', '工作': '工作',
    '阅读': '阅读', '读书': '阅读', '写作': '写作',
    '社团': '社团活动', '志愿': '志愿服务', '公益': '公益',
    '比赛': '竞赛', '奖': '获奖', '面试': '面试'
  }
  schedules.forEach(s => {
    for (const [k, v] of Object.entries(keywordMap)) {
      if (s.title.includes(k) && !skillTags.includes(v)) {
        skillTags.push(v)
        break
      }
    }
  })
  if (skillTags.length === 0) skillTags.push('日程管理')

  // Activity highlights from completed schedules
  const activityHighlights = schedules.slice(0, 5).map(s => ({
    title: s.title,
    date: s.date,
    description: s.remark || `于 ${s.date} 完成${s.location ? '，地点：' + s.location : ''}`
  }))

  // Personal summary
  const name = profile.nickname || '用户'
  let personalSummary = profile.bio
    ? `${name}，${profile.bio}`
    : `${name}是一位正在有序成长的用户，通过合理安排日程，逐步实现自己的目标。`
  if (profile.goals) {
    personalSummary += ` 近期正在努力：${profile.goals}`
  }

  // Growth insight
  const completedCount = schedules.length
  const momentCount = moments.length
  let growthInsight = ''
  if (completedCount >= 10) {
    growthInsight = `已完成 ${completedCount} 项日程，执行力令人印象深刻！持续的坚持正在塑造更好的自己。`
  } else if (completedCount >= 5) {
    growthInsight = `已完成 ${completedCount} 项日程，每天的行动积累正在让目标变得更近。继续保持！`
  } else if (completedCount > 0) {
    growthInsight = `已踏出第一步，完成了 ${completedCount} 项日程。每一步都算数，坚持下去会看到更大的改变。`
  } else {
    growthInsight = `还没有已完成的日程记录。不妨从现在开始，设定一个小目标并完成它～`
  }

  // Suggested next steps
  const suggestedNextSteps = []
  if (profile.goals) {
    const goalList = profile.goals.split(/[,，、；;]/).filter(Boolean)
    goalList.slice(0, 3).forEach(g => {
      suggestedNextSteps.push(`朝着「${g.trim()}」的目标再迈一步`)
    })
  }
  if (suggestedNextSteps.length === 0) {
    suggestedNextSteps.push('设定一个本周的小目标，把它添加到日历中')
    suggestedNextSteps.push('记录一次生活动态，分享你的小成就')
  }
  if (completedCount > 0 && suggestedNextSteps.length < 4) {
    suggestedNextSteps.push('回顾已完成的事项，给自己一个小小的奖励')
  }

  return {
    personalSummary,
    skillTags: skillTags.slice(0, 8),
    activityHighlights,
    growthInsight,
    suggestedNextSteps: suggestedNextSteps.slice(0, 4)
  }
}

module.exports = router
