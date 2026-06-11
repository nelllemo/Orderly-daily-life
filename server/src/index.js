const express = require('express')
const cors = require('cors')
const path = require('path')
const dotenv = require('dotenv')
const fs = require('fs')
const https = require('https')

const authRoutes = require('./routes/auth')
const aiRoutes = require('./routes/ai')
const scheduleRoutes = require('./routes/schedules')
const momentRoutes = require('./routes/moments')
const authMiddleware = require('./middleware/auth')

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json({ limit: '1mb' }))

// Static file serving for H5 frontend
const staticDir = path.resolve(__dirname, process.env.STATIC_DIR || '../../dist')
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir, {
    maxAge: '7d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache')
      }
    }
  }))
  console.log(`Serving static files from: ${staticDir}`)
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/ai', authMiddleware, aiRoutes)
app.use('/api/schedules', authMiddleware, scheduleRoutes)
app.use('/api/moments', authMiddleware, momentRoutes)

// SPA fallback - all non-API routes serve index.html
if (fs.existsSync(staticDir)) {
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return
    res.sendFile(path.join(staticDir, 'index.html'))
  })
}

const httpsPort = Number(process.env.HTTPS_PORT || 8443)
const keyPath = process.env.SSL_KEY_PATH
const certPath = process.env.SSL_CERT_PATH

if (keyPath && certPath) {
  const key = fs.readFileSync(keyPath)
  const cert = fs.readFileSync(certPath)
  https.createServer({ key, cert }, app).listen(httpsPort, () => {
    console.log(`HTTPS server listening on ${httpsPort}`)
  })
} else {
  const port = Number(process.env.PORT || 5080)
  app.listen(port, () => {
    console.log(`HTTP server listening on ${port}`)
  })
}
