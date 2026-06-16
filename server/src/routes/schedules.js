const express = require('express')
const db = require('../db')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.userId
    const rows = await db.query(
      'SELECT id, title, date, time, category_id AS categoryId, priority, remark, location, completed, remind_at AS remindAt FROM schedule WHERE user_id = ? ORDER BY date DESC, time DESC',
      [userId]
    )
    const mapped = rows.map((row) => {
      const date = row.date instanceof Date
        ? `${row.date.getFullYear()}-${String(row.date.getMonth()+1).padStart(2,'0')}-${String(row.date.getDate()).padStart(2,'0')}`
        : String(row.date).slice(0, 10)
      const time = typeof row.time === 'string' ? row.time.slice(0, 5) : row.time
      return { ...row, date, time, completed: Boolean(row.completed) }
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
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.user.userId
    const scheduleId = Number(req.params.id)

    const fields = []
    const values = []

    if (req.body.title !== undefined) { fields.push('title = ?'); values.push(req.body.title) }
    if (req.body.date !== undefined) { fields.push('date = ?'); values.push(req.body.date) }
    if (req.body.time !== undefined) { fields.push('time = ?'); values.push(req.body.time) }
    if (req.body.categoryId !== undefined) { fields.push('category_id = ?'); values.push(req.body.categoryId || null) }
    if (req.body.priority !== undefined) { fields.push('priority = ?'); values.push(req.body.priority) }
    if (req.body.remark !== undefined) { fields.push('remark = ?'); values.push(req.body.remark) }
    if (req.body.location !== undefined) { fields.push('location = ?'); values.push(req.body.location) }
    if (req.body.completed !== undefined) { fields.push('completed = ?'); values.push(req.body.completed ? 1 : 0) }
    if (req.body.remindAt !== undefined) { fields.push('remind_at = ?'); values.push(req.body.remindAt) }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update.' })
    }

    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(scheduleId, userId)

    await db.query(
      `UPDATE schedule SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
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
    const scheduleId = Number(req.params.id)
    await db.query('DELETE FROM schedule WHERE id = ? AND user_id = ?', [scheduleId, userId])
    return res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
