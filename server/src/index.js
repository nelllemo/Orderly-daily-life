const dotenv = require('dotenv')
const path = require('path')
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const express = require('express')
const cors = require('cors')
const fs = require('fs')
const https = require('https')

const authRoutes = require('./routes/auth')
const aiRoutes = require('./routes/ai')
const scheduleRoutes = require('./routes/schedules')
const momentRoutes = require('./routes/moments')
const authMiddleware = require('./middleware/auth')
const db = require('./db')

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'replace-with-strong-secret') {
  if (process.env.NODE_ENV === 'production') {
    console.error('[FATAL] JWT_SECRET must be configured for production. Set a strong secret in .env')
    process.exit(1)
  }
  console.warn('[WARN] JWT_SECRET is not configured or using default value. Set a strong secret in .env for production.')
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
}

// Log DB config on startup (without password) for debugging
const dbUser = process.env.DB_USER || '(not set)'
const dbHost = process.env.DB_HOST || '(not set)'
const dbName = process.env.DB_NAME || '(not set)'
console.log(`[DB Config] host=${dbHost}, user=${dbUser}, database=${dbName}`)

const app = express()

// Trust first proxy for correct client IP behind Nginx
app.set('trust proxy', 1)

app.use(cors())
app.use(express.json({ limit: '10mb' }))

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
app.use('/api/ai', aiRoutes)
app.use('/api/schedules', authMiddleware, scheduleRoutes)
app.use('/api/moments', authMiddleware, momentRoutes)
app.use('/api/upload', require('./routes/upload'))

// Serve uploaded files
const uploadsDir = path.resolve(__dirname, '../uploads')
if (fs.existsSync(uploadsDir)) {
  app.use('/uploads', express.static(uploadsDir, { maxAge: '30d' }))
}

// SPA fallback - only for page routes, not static assets
if (fs.existsSync(staticDir)) {
  const staticExts = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|json)$/i
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/') || staticExts.test(req.path)) return
    res.sendFile(path.join(staticDir, 'index.html'))
  })
}

// Global error handler — prevents unhandled errors from crashing the process
app.use((err, req, res, _next) => {
  console.error('[Server Error]', err.message || err)
  if (err.code) console.error('  Code:', err.code)
  if (!res.headersSent) {
    res.status(500).json({ message: 'Internal server error', error: err.message })
  }
})

// Verify database connection before accepting requests
db.query('SELECT 1')
  .then(() => console.log('[DB] Connection verified'))
  .catch(err => {
    console.error('[FATAL] Database connection failed:', err.message)
    process.exit(1)
  })

const httpsPort = Number(process.env.HTTPS_PORT || 8443)
const keyPath = process.env.SSL_KEY_PATH
const certPath = process.env.SSL_CERT_PATH

if (keyPath && certPath && fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  const key = fs.readFileSync(keyPath)
  const cert = fs.readFileSync(certPath)
  const server = https.createServer({ key, cert }, app)
  server.listen(httpsPort, () => {
    console.log(`HTTPS server listening on ${httpsPort}`)
  })
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[FATAL] Port ${httpsPort} is already in use. Please stop the other process or change HTTPS_PORT in .env`)
    } else {
      console.error('[FATAL] Server error:', err.message)
    }
    process.exit(1)
  })
} else if (keyPath || certPath) {
  console.warn('[WARN] SSL cert paths configured but files not found. Falling back to HTTP.')
} else {
  const port = Number(process.env.PORT || 5080)
  const server = app.listen(port, () => {
    console.log(`HTTP server listening on ${port}`)
  })
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[FATAL] Port ${port} is already in use. Please stop the other process or change PORT in .env`)
    } else {
      console.error('[FATAL] Server error:', err.message)
    }
    process.exit(1)
  })
}
