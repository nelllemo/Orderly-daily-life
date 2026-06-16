const DEFAULT_BASE = '/api'

const getBaseUrl = () => uni.getStorageSync('orderlyDailyLife:apiBase') || DEFAULT_BASE

const getAuthHeader = () => {
  const token = uni.getStorageSync('orderlyDailyLife:token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const request = (path, options = {}) => new Promise((resolve, reject) => {
  const headers = Object.assign({}, getAuthHeader(), options.header || {})
  uni.request({
    url: `${getBaseUrl()}${path}`,
    method: options.method || 'GET',
    data: options.data || {},
    header: headers,
    timeout: options.timeout || 15000,
    success: (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve(res.data)
      } else {
        reject(res.data || { message: 'Request failed.' })
      }
    },
    fail: (err) => reject(err)
  })
})

// Auth
export const register = (payload) => request('/auth/register', { method: 'POST', data: payload })

export const login = (payload) => request('/auth/login', { method: 'POST', data: payload })

export const wechatLogin = (code) => request('/auth/wechat', { method: 'POST', data: { code } })

export const fetchProfile = () => request('/auth/profile')

export const updateProfile = (payload) => request('/auth/profile', { method: 'PUT', data: payload })

// Account deletion
export const deleteAccount = () => request('/auth/account', { method: 'DELETE' })

// AI Chat
export const aiChat = (payload) => request('/ai/chat', { method: 'POST', data: payload, timeout: 60000 })

// Schedules CRUD
export const fetchSchedules = () => request('/schedules')
export const createSchedule = (payload) => request('/schedules', { method: 'POST', data: payload })
export const updateSchedule = (id, payload) => request(`/schedules/${id}`, { method: 'PUT', data: payload })
export const deleteSchedule = (id) => request(`/schedules/${id}`, { method: 'DELETE' })

// Moments CRUD
export const fetchMoments = () => request('/moments')
export const createMoment = (payload) => request('/moments', { method: 'POST', data: payload })
export const updateMoment = (id, payload) => request(`/moments/${id}`, { method: 'PUT', data: payload })
export const deleteMoment = (id) => request(`/moments/${id}`, { method: 'DELETE' })

// AI resume generation
export const generateResume = () => request('/ai/resume', { method: 'POST', data: {}, header: { 'Content-Type': 'application/json' }, timeout: 30000 })

// Image upload - returns { url: '/uploads/xxx.jpg' }
export const uploadImage = (filePath) => new Promise((resolve, reject) => {
  const token = uni.getStorageSync('orderlyDailyLife:token')
  // In H5 mode, blob URLs need to be handled specially
  const isBlobUrl = typeof filePath === 'string' && filePath.startsWith('blob:')
  if (isBlobUrl) {
    blobToBase64(filePath).then(dataUrl => {
      // Upload base64 data via request
      request('/upload', { method: 'POST', data: { file: dataUrl, filename: 'image.jpg' } })
        .then(resolve)
        .catch(reject)
    }).catch(reject)
    return
  }
  uni.uploadFile({
    url: `${getBaseUrl()}/upload`,
    filePath,
    name: 'file',
    header: token ? { Authorization: `Bearer ${token}` } : {},
    success: (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const data = JSON.parse(res.data)
        resolve(data)
      } else {
        try {
          reject(JSON.parse(res.data) || { message: 'Upload failed.' })
        } catch (e) {
          reject({ message: 'Upload failed.' })
        }
      }
    },
    fail: (err) => reject(err)
  })
})

// Convert a blob URL to a base64 data URL (uses runtime check for H5 support)
export const blobToBase64 = (blobUrl) => {
  if (typeof fetch !== 'function' || typeof FileReader === 'undefined') {
    return Promise.resolve(blobUrl)
  }
  return fetch(blobUrl)
    .then(res => res.blob())
    .then(blob => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    }))
}
