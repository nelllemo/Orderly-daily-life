const express = require('express')
const db = require('../db')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.userId
    const rows = await db.query(
      'SELECT id, content, date, time, related_schedule_id AS relatedScheduleId, image_urls AS imageUrls FROM moment WHERE user_id = ? ORDER BY date DESC, time DESC',
      [userId]
    )

    const mapped = rows.map((row) => {
      // mysql2 returns DATE as JS Date or string depending on config; normalize
      const date = row.date instanceof Date
        ? `${row.date.getFullYear()}-${String(row.date.getMonth()+1).padStart(2,'0')}-${String(row.date.getDate()).padStart(2,'0')}`
        : String(row.date).slice(0, 10)
      const time = String(row.time).slice(0, 5)
      // imageUrls may be already parsed by mysql2 (JSON type) or still a string
      let imageUrls = []
      if (Array.isArray(row.imageUrls)) {
        imageUrls = row.imageUrls
      } else if (typeof row.imageUrls === 'string' && row.imageUrls) {
        try { imageUrls = JSON.parse(row.imageUrls) } catch (e) { imageUrls = [] }
      }
      return {
        ...row,
        date,
        time,
        imageUrls
      }
    })

    return res.json(mapped)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.userId
    const {
      content,
      date,
      time,
      imageUrls = []
    } = req.body || {}

    // Sanitize: relatedScheduleId must be a valid integer (local IDs like "sch-123" are not valid)
    let relatedScheduleId = req.body?.relatedScheduleId ?? null
    if (relatedScheduleId !== null && relatedScheduleId !== undefined) {
      const num = Number(relatedScheduleId)
      relatedScheduleId = Number.isFinite(num) && num > 0 ? num : null
    }

    if ((!content && (!imageUrls || !imageUrls.length)) || !date || !time) {
      return res.status(400).json({ message: 'Content or at least one image, date, and time are required.' })
    }

    const result = await db.query(
      'INSERT INTO moment (user_id, content, date, time, related_schedule_id, image_urls) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, content, date, time, relatedScheduleId, JSON.stringify(imageUrls)]
    )

    return res.status(201).json({ id: result.insertId })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.user.userId
    const momentId = Number(req.params.id)

    const fields = []
    const values = []

    if (req.body.content !== undefined) { fields.push('content = ?'); values.push(req.body.content) }
    if (req.body.date !== undefined) { fields.push('date = ?'); values.push(req.body.date) }
    if (req.body.time !== undefined) { fields.push('time = ?'); values.push(req.body.time) }
    if (req.body.relatedScheduleId !== undefined) {
      const num = Number(req.body.relatedScheduleId)
      const safeId = Number.isFinite(num) && num > 0 ? num : null
      fields.push('related_schedule_id = ?'); values.push(safeId)
    }
    if (req.body.imageUrls !== undefined) { fields.push('image_urls = ?'); values.push(JSON.stringify(req.body.imageUrls)) }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update.' })
    }

    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(momentId, userId)

    await db.query(
      `UPDATE moment SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    )

    return res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.userId
    const momentId = Number(req.params.id)
    await db.query('DELETE FROM moment WHERE id = ? AND user_id = ?', [momentId, userId])
    return res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
