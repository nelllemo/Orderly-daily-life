const express = require('express')
const axios = require('axios')
const jwt = require('jsonwebtoken')
const db = require('../db')

const router = express.Router()

const signToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'dev-secret'
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

// POST /api/auth/wechat
// body: { code }
// exchanges code for openid, upserts user, returns token
router.post('/wechat', async (req, res) => {
  const { code } = req.body || {}
  if (!code) return res.status(400).json({ message: 'code required' })

  const appid = process.env.WECHAT_APPID
  const secret = process.env.WECHAT_APPSECRET
  if (!appid || !secret) return res.status(500).json({ message: 'WeChat credentials not configured' })

  try {
    const url = 'https://api.weixin.qq.com/sns/jscode2session'
    const r = await axios.get(url, { params: { appid, secret, js_code: code, grant_type: 'authorization_code' } })
    const data = r.data
    if (data.errcode) return res.status(502).json({ message: data.errmsg })

    const openid = data.openid

    // upsert user by openid
    const rows = await db.query('SELECT id FROM user WHERE openid = ?', [openid])
    let userId
    if (rows.length) {
      userId = rows[0].id
    } else {
      const result = await db.query('INSERT INTO user (openid) VALUES (?)', [openid])
      userId = result.insertId
    }

    const token = signToken({ userId, openid })
    return res.json({ token, user: { id: userId, openid } })
  } catch (err) {
    return res.status(500).json({ message: 'WeChat exchange failed', error: err.message })
  }
})

module.exports = router
