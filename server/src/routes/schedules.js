const express = require('express')
const db = require('../db')

const router = express.Router()

router.get('/', async (req, res) => {
  const userId = req.user.userId
  const rows = await db.query(
    'SELECT id, title, date, time, category_id AS categoryId, priority, remark, location, completed, remind_at AS remindAt FROM schedule WHERE user_id = ? ORDER BY date DESC, time DESC',
    [userId]
  )
  return res.json(rows)
})

router.post('/', async (req, res) => {
  const userId = req.user.userId
  const {
    title,
    date,
    time,
    categoryId,
    priority = 1,
    remark = '',
    location = '',
    completed = false,
    remindAt = null
  } = req.body || {}

  if (!title || !date || !time) {
    return res.status(400).json({ message: 'Title, date, and time are required.' })
  }

  const result = await db.query(
    'INSERT INTO schedule (user_id, title, date, time, category_id, priority, remark, location, completed, remind_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [userId, title, date, time, categoryId || null, priority, remark, location, completed ? 1 : 0, remindAt]
  )

  return res.status(201).json({ id: result.insertId })
})

router.put('/:id', async (req, res) => {
  const userId = req.user.userId
  const scheduleId = Number(req.params.id)
  const {
    title,
    date,
    time,
    categoryId,
    priority,
    remark,
    location,
    completed,
    remindAt
  } = req.body || {}

  await db.query(
    'UPDATE schedule SET title = ?, date = ?, time = ?, category_id = ?, priority = ?, remark = ?, location = ?, completed = ?, remind_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [
      title,
      date,
      time,
      categoryId || null,
      priority,
      remark,
      location,
      completed ? 1 : 0,
      remindAt,
      scheduleId,
      userId
    ]
  )

  return res.json({ ok: true })
})

router.delete('/:id', async (req, res) => {
  const userId = req.user.userId
  const scheduleId = Number(req.params.id)
  await db.query('DELETE FROM schedule WHERE id = ? AND user_id = ?', [scheduleId, userId])
  return res.json({ ok: true })
})

module.exports = router
