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

export const register = (payload) => request('/auth/register', { method: 'POST', data: payload })

export const login = (payload) => request('/auth/login', { method: 'POST', data: payload })

export const wechatLogin = (code) => request('/auth/wechat', { method: 'POST', data: { code } })

export const requestAISchedule = (prompt) => request('/ai/schedule', { method: 'POST', data: { prompt } })

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
