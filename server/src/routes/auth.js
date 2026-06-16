const express = require('express')
const axios = require('axios')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const db = require('../db')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

const signToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'dev-secret'
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, nickname, bio, goals, skills, interests } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format.' })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' })
    }

    const existing = await db.query('SELECT id FROM user WHERE email = ?', [email])
    if (existing.length) {
      return res.status(409).json({ message: 'Email already registered.' })
    }

    const hash = await bcrypt.hash(password, 10)
    const displayName = nickname || email.split('@')[0]
    const userBio = bio || ''
    const userGoals = goals || ''
    const userSkills = skills || ''
    const userInterests = interests || ''
    const result = await db.query(
      'INSERT INTO user (email, password_hash, nickname, avatar, bio, goals, skills, interests) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [email, hash, displayName, '', userBio, userGoals, userSkills, userInterests]
    )

    const userId = result.insertId
    const token = signToken({ userId, email, nickname: displayName })
    return res.status(201).json({
      token,
      user: { id: userId, email, nickname: displayName, avatar: '', bio: userBio, goals: userGoals, skills: userSkills, interests: userInterests }
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const rows = await db.query('SELECT id, email, password_hash, nickname, avatar, bio, goals, skills, interests FROM user WHERE email = ?', [email])
    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const user = rows[0]
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const token = signToken({ userId: user.id, email: user.email, nickname: user.nickname })
    return res.json({
      token,
      user: { id: user.id, email: user.email, nickname: user.nickname || '', avatar: user.avatar || '', bio: user.bio || '', goals: user.goals || '', skills: user.skills || '', interests: user.interests || '' }
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/wechat (微信登录保留兼容)
router.post('/wechat', async (req, res, next) => {
  const { code } = req.body || {}
  if (!code) return res.status(400).json({ message: 'code required' })

  const appid = process.env.WECHAT_APPID
  const secret = process.env.WECHAT_APPSECRET
  if (!appid || !secret) return res.status(500).json({ message: 'WeChat credentials not configured' })

  try {
    const url = 'https://api.weixin.qq.com/sns/jscode2session'
    const r = await axios.get(url, { params: { appid, secret, js_code: code, grant_type: 'authorization_code' } })
    const data = r.data
    if (data.errcode) {
      console.error('[WeChat API Error]', data.errcode, data.errmsg)
      return res.status(502).json({ message: 'WeChat login failed. Please try again.' })
    }

    const openid = data.openid
    const rows = await db.query('SELECT id, email, nickname, avatar FROM user WHERE openid = ?', [openid])
    let user
    if (rows.length) {
      user = rows[0]
    } else {
      const result = await db.query('INSERT INTO user (openid, nickname, avatar) VALUES (?, ?, ?)', [openid, '', ''])
      user = { id: result.insertId, email: null, nickname: '', avatar: '' }
    }

    const token = signToken({ userId: user.id, openid, email: user.email, nickname: user.nickname })
    return res.json({ token, user: { id: user.id, email: user.email, nickname: user.nickname || '', avatar: user.avatar || '' } })
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/profile
router.get('/profile', authMiddleware, async (req, res, next) => {
  try {
    const rows = await db.query('SELECT id, email, nickname, avatar, bio, goals, skills, interests FROM user WHERE id = ?', [req.user.userId])
    if (!rows.length) return res.status(404).json({ message: 'User not found.' })
    return res.json(rows[0])
  } catch (err) {
    next(err)
  }
})

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req, res, next) => {
  try {
    const { nickname, avatar, bio, goals, skills, interests } = req.body || {}
    const fields = []
    const values = []
    if (nickname !== undefined) { fields.push('nickname = ?'); values.push(nickname) }
    if (avatar !== undefined) { fields.push('avatar = ?'); values.push(avatar) }
    if (bio !== undefined) { fields.push('bio = ?'); values.push(bio) }
    if (goals !== undefined) { fields.push('goals = ?'); values.push(goals) }
    if (skills !== undefined) { fields.push('skills = ?'); values.push(skills) }
    if (interests !== undefined) { fields.push('interests = ?'); values.push(interests) }
    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update.' })
    }
    values.push(req.user.userId)
    await db.query(`UPDATE user SET ${fields.join(', ')} WHERE id = ?`, values)
    return res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/auth/account — permanently delete user and all their data
router.delete('/account', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.userId
    // Cascade deletes handle: schedule (fk_schedule_user), moment (fk_moment_user)
    // But we also need to clean up any orphaned data. The FK constraints with
    // ON DELETE CASCADE will handle child rows automatically.
    await db.query('DELETE FROM user WHERE id = ?', [userId])
    return res.json({ ok: true, message: 'Account deleted.' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
