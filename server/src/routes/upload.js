const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const router = express.Router()

const uploadDir = path.resolve(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const generateFilename = (ext) => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext || '.jpg'}`
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, generateFilename(ext))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|bmp)$/i
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, allowed.test(ext))
  }
})

// POST /api/upload - multipart file upload (guest allowed)
router.post('/', upload.single('file'), (req, res, next) => {
  if (req.file) {
    const url = `/uploads/${req.file.filename}`
    return res.json({ url })
  }
  // Fall through to base64 handler if no file in multipart
  next()
})

// POST /api/upload - base64 data URL upload (H5 blob conversion)
router.post('/', (req, res) => {
  const { file, filename } = req.body || {}
  if (!file || typeof file !== 'string') {
    return res.status(400).json({ message: 'No file data provided.' })
  }

  // Handle data:image/...;base64,...
  const matches = file.match(/^data:image\/([\w+]+);base64,(.+)$/)
  if (!matches) {
    return res.status(400).json({ message: 'Invalid data URL format.' })
  }

  const ext = matches[1] === 'jpeg' ? '.jpg' : `.${matches[1]}`
  const data = Buffer.from(matches[2], 'base64')
  const name = generateFilename(ext)
  const filepath = path.join(uploadDir, name)

  fs.writeFile(filepath, data, (err) => {
    if (err) {
      console.error('[Upload] Failed to write file:', err.message)
      return res.status(500).json({ message: 'Failed to save image.' })
    }
    return res.json({ url: `/uploads/${name}` })
  })
})

module.exports = router
