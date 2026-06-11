import { toDateKey } from './date'

const STORAGE_KEY = 'orderlyDailyLife:state'

const createDefaultState = () => {
  const today = new Date()
  const todayKey = toDateKey(today)
  const tomorrowKey = toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1))
  const yesterdayKey = toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2))

  return {
    users: [],
    session: {
      userId: null,
      token: null,
      email: null,
      isGuest: true
    },
    categories: [
      { id: 'cat-study', name: '学习', color: '#4A90E2' },
      { id: 'cat-work', name: '工作', color: '#FFA500' },
      { id: 'cat-life', name: '生活', color: '#50C878' }
    ],
    schedules: [
      {
        id: 'sch-1',
        title: '计算机网络大作业提交',
        date: todayKey,
        time: '14:00',
        categoryId: 'cat-study',
        priority: 3,
        remark: '',
        location: '',
        completed: false,
        remindAt: null
      },
      {
        id: 'sch-2',
        title: '社团例会',
        date: todayKey,
        time: '19:00',
        categoryId: 'cat-life',
        priority: 2,
        remark: '',
        location: '',
        completed: false,
        remindAt: null
      },
      {
        id: 'sch-3',
        title: '奶茶店兼职',
        date: tomorrowKey,
        time: '14:00',
        categoryId: 'cat-work',
        priority: 2,
        remark: '',
        location: '',
        completed: false,
        remindAt: null
      },
      {
        id: 'sch-4',
        title: '公众号推文排版',
        date: yesterdayKey,
        time: '20:00',
        categoryId: 'cat-work',
        priority: 1,
        remark: '',
        location: '',
        completed: false,
        remindAt: null
      }
    ],
    moments: [
      {
        id: 'mom-1',
        content: '今天终于把网络大作业搞定了，框架报错调了整整三个小时！好在最后跑通了，给自己加个鸡腿 🍗',
        date: todayKey,
        time: '15:30',
        relatedScheduleId: 'sch-1',
        imageUrls: []
      },
      {
        id: 'mom-2',
        content: '阳光正好，在操场跑了5公里，感觉一整天的疲惫都消失了。',
        date: toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)),
        time: '21:00',
        relatedScheduleId: null,
        imageUrls: ['placeholder']
      }
    ],
    settings: {
      morningPushEnabled: true,
      morningPushTime: '08:00'
    }
  }
}

const loadState = () => {
  const raw = uni.getStorageSync(STORAGE_KEY)
  if (!raw) {
    const initial = createDefaultState()
    uni.setStorageSync(STORAGE_KEY, initial)
    return initial
  }
  return raw
}

const saveState = (state) => {
  uni.setStorageSync(STORAGE_KEY, state)
  return state
}

const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const getState = () => loadState()

export const updateState = (updater) => {
  const current = loadState()
  const next = updater({ ...current }) || current
  return saveState(next)
}

export const listCategories = () => loadState().categories

export const listSchedules = () => loadState().schedules

export const addSchedule = (payload) => updateState((state) => {
  const schedule = {
    id: generateId('sch'),
    title: payload.title || '',
    date: payload.date,
    time: payload.time || '09:00',
    categoryId: payload.categoryId || null,
    priority: payload.priority ?? 1,
    remark: payload.remark || '',
    location: payload.location || '',
    completed: false,
    remindAt: payload.remindAt || null
  }
  state.schedules = [schedule, ...state.schedules]
  return state
})

export const updateSchedule = (id, changes) => updateState((state) => {
  state.schedules = state.schedules.map((item) => (item.id === id ? { ...item, ...changes } : item))
  return state
})

export const deleteSchedule = (id) => updateState((state) => {
  state.schedules = state.schedules.filter((item) => item.id !== id)
  state.moments = state.moments.map((moment) => ({
    ...moment,
    relatedScheduleId: moment.relatedScheduleId === id ? null : moment.relatedScheduleId
  }))
  return state
})

export const toggleScheduleCompleted = (id) => updateState((state) => {
  state.schedules = state.schedules.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
  return state
})

export const listMoments = () => loadState().moments

export const addMoment = (payload) => updateState((state) => {
  const moment = {
    id: generateId('mom'),
    content: payload.content || '',
    date: payload.date,
    time: payload.time || '08:00',
    relatedScheduleId: payload.relatedScheduleId || null,
    imageUrls: payload.imageUrls || []
  }
  state.moments = [moment, ...state.moments]
  return state
})

export const updateMoment = (id, changes) => updateState((state) => {
  state.moments = state.moments.map((item) => (item.id === id ? { ...item, ...changes } : item))
  return state
})

export const deleteMoment = (id) => updateState((state) => {
  state.moments = state.moments.filter((item) => item.id !== id)
  return state
})

export const getSettings = () => loadState().settings

export const updateSettings = (changes) => updateState((state) => {
  state.settings = { ...state.settings, ...changes }
  return state
})

export const setSession = (payload) => updateState((state) => {
  state.session = {
    userId: payload.userId,
    token: payload.token,
    email: payload.email,
    isGuest: false
  }
  // also save token for quick access by API helper
  if (payload.token) uni.setStorageSync('orderlyDailyLife:token', payload.token)
  return state
})

export const clearSession = () => updateState((state) => {
  state.session = {
    userId: null,
    token: null,
    email: null,
    isGuest: true
  }
  uni.removeStorageSync('orderlyDailyLife:token')
  return state
})
