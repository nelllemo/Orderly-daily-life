export const pad2 = (value) => String(value).padStart(2, '0')

export const toDateKey = (date) => {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export const toTimeKey = (date) => {
  const d = date instanceof Date ? date : new Date(date)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export const toMonthLabel = (date) => {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}年 ${pad2(d.getMonth() + 1)}月`
}

export const addDays = (date, days) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export const startOfDay = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export const endOfDay = (date) => {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}
