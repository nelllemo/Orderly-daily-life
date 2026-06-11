const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({ message: 'Missing token.' })
  }

  try {
    const secret = process.env.JWT_SECRET || 'dev-secret'
    const payload = jwt.verify(token, secret)
    req.user = payload
    return next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token.' })
  }
}

module.exports = authMiddleware
