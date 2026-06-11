const express = require('express')
const db = require('../db')

const router = express.Router()

router.get('/', async (req, res) => {
  const userId = req.user.userId
  const rows = await db.query(
    'SELECT id, content, date, time, related_schedule_id AS relatedScheduleId, image_urls AS imageUrls FROM moment WHERE user_id = ? ORDER BY date DESC, time DESC',
    [userId]
  )

  const mapped = rows.map((row) => ({
    ...row,
    imageUrls: row.imageUrls ? JSON.parse(row.imageUrls) : []
  }))

  return res.json(mapped)
})

router.post('/', async (req, res) => {
  const userId = req.user.userId
  const {
    content,
    date,
    time,
    relatedScheduleId = null,
    imageUrls = []
  } = req.body || {}

  if (!content || !date || !time) {
    return res.status(400).json({ message: 'Content, date, and time are required.' })
  }

  const result = await db.query(
    'INSERT INTO moment (user_id, content, date, time, related_schedule_id, image_urls) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, content, date, time, relatedScheduleId, JSON.stringify(imageUrls)]
  )

  return res.status(201).json({ id: result.insertId })
})

router.put('/:id', async (req, res) => {
  const userId = req.user.userId
  const momentId = Number(req.params.id)
  const {
    content,
    date,
    time,
    relatedScheduleId,
    imageUrls
  } = req.body || {}

  await db.query(
    'UPDATE moment SET content = ?, date = ?, time = ?, related_schedule_id = ?, image_urls = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [content, date, time, relatedScheduleId, JSON.stringify(imageUrls || []), momentId, userId]
  )

  return res.json({ ok: true })
})

router.delete('/:id', async (req, res) => {
  const userId = req.user.userId
  const momentId = Number(req.params.id)
  await db.query('DELETE FROM moment WHERE id = ? AND user_id = ?', [momentId, userId])
  return res.json({ ok: true })
})

module.exports = router
