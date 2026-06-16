<template>
  <scroll-view class="scroll-container" scroll-y>
    <view class="calendar-view">
      <!-- 顶部月份控制区 -->
      <view class="header-control">
        <view class="month-title">
          <text class="icon-left" @click="goToPrevMonth"><</text>
          <text class="title-text">{{ monthLabel }}</text>
          <text class="icon-right" @click="goToNextMonth">></text>
        </view>
        <view class="view-switch">
          <text class="switch-btn" :class="{'active-switch': activeView === 'week'}" @click="activeView = 'week'">周</text>
          <text class="switch-btn" :class="{'active-switch': activeView === 'month'}" @click="activeView = 'month'">月</text>
        </view>
      </view>

      <!-- 日历月视图网格 -->
      <view class="calendar-grid">
        <view class="week-days">
          <text class="day-label" v-for="d in days" :key="d">{{d}}</text>
        </view>
        <view class="dates-grid">
          <template v-if="activeView === 'month'">
            <view class="empty-cell" v-for="e in leadingEmptyCount" :key="'e'+e"></view>
            <view
              class="date-cell"
              :class="{'is-today': getDateKeyForDay(date) === todayKey}"
              v-for="date in monthDates"
              :key="date"
              @click="selectDate(date); emit('open-add-modal', getDateKeyForDay(date))"
            >
              <text class="date-num" :class="{'today-num': getDateKeyForDay(date) === todayKey}">{{date}}</text>
              <view class="tags-row">
                <view
                  v-for="color in getTagsForDate(date).slice(0, 3)"
                  :key="color"
                  class="tag-line"
                  :style="{ backgroundColor: color }"
                ></view>
              </view>
            </view>
          </template>
          <template v-else-if="activeView === 'week'">
            <view class="week-grid">
              <view class="date-cell" v-for="key in weekDatesKeys" :key="key" @click="selectDateByKey(key); emit('open-add-modal', key)">
                <text class="date-num" :class="{'today-num': key === todayKey}">{{ key.slice(8) }}</text>
                <view class="tags-row">
                  <view
                    v-for="color in scheduleTagsByDate[key] ? scheduleTagsByDate[key].slice(0,3) : []"
                    :key="color"
                    class="tag-line"
                    :style="{ backgroundColor: color }"
                  ></view>
                </view>
              </view>
            </view>
          </template>
        </view>
      </view>

      <view class="gray-divider"></view>

      <!-- 今日待办列表区域 -->
      <view class="today-section">
        <view class="section-header">
          <text class="section-title">{{ todayLabel }} 今日待办</text>
          <text class="section-sub">{{ todayTasksCount }}项任务</text>
        </view>

        <view class="task-list">
          <view class="task-item" v-for="task in todayTasks" :key="task.id">
            <view class="task-check-box" @click="emit('toggle-task', task)">
              <text v-if="task.completed" class="icon-checked">✓</text>
              <view v-else class="icon-unchecked"></view>
            </view>
            <view class="task-body" @click="emit('open-edit-modal', task)">
              <text class="task-item-title" :class="{'line-through': task.completed}">{{ task.title }}</text>
              <view class="task-meta">
                <text class="task-time-tag">{{ task.time }}</text>
                <text class="category-badge" :style="{ color: task.color, backgroundColor: task.color + '20' }">{{ task.categoryName }}</text>
              </view>
            </view>
            <text class="menu-text text-red" @click="emit('remove-schedule', task.id)">删除</text>
            <view v-if="task.priority === 3" class="priority-line"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 日历页专属的双悬浮按钮组 -->
    <view class="fab-group">
      <view class="fab-ai" @click="emit('open-ai-modal')">
        <text class="fab-ai-icon">✨</text>
      </view>
      <view class="fab-add" @click="emit('open-add-modal')">
        <view class="fab-add-ring"></view>
        <text class="fab-add-icon">+</text>
      </view>
    </view>
  </scroll-view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { toDateKey, toMonthLabel } from '../../services/date'

const props = defineProps({
  schedules: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
  todayKey: { type: String, required: true }
})

const emit = defineEmits([
  'open-add-modal',
  'open-edit-modal',
  'open-ai-modal',
  'toggle-task',
  'remove-schedule'
])

const activeView = ref('month')
const currentMonth = ref(new Date())
const selectedDate = ref(props.todayKey)

const days = ['日', '一', '二', '三', '四', '五', '六']

const todayLabel = computed(() => `${props.todayKey.slice(5, 7)}月${props.todayKey.slice(8)}日`)

const categoryById = computed(() => {
  const map = {}
  props.categories.forEach((category) => {
    map[category.id] = category
  })
  return map
})

const scheduleToTask = (schedule) => {
  const category = categoryById.value[schedule.categoryId] || { name: '未分类', color: '#94a3b8' }
  return {
    ...schedule,
    categoryName: category.name,
    color: category.color
  }
}

const todayTasks = computed(() =>
  props.schedules
    .filter((t) => t.date === props.todayKey)
    .map(scheduleToTask)
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      return (a.priority || 1) - (b.priority || 1)
    })
)
const todayTasksCount = computed(() => todayTasks.value.length)

const monthLabel = computed(() => toMonthLabel(currentMonth.value))
const leadingEmptyCount = computed(() => {
  const firstDay = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), 1)
  return firstDay.getDay()
})
const monthDateCount = computed(() => {
  return new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 0).getDate()
})
const monthDates = computed(() => Array.from({ length: monthDateCount.value }, (_, i) => i + 1))

const getDateKeyForDay = (day) => {
  const date = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), day)
  return toDateKey(date)
}

const weekDatesKeys = computed(() => {
  try {
    const parts = selectedDate.value.split('-')
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    const start = new Date(d)
    start.setDate(d.getDate() - d.getDay())
    const arr = []
    for (let i = 0; i < 7; i += 1) {
      const dt = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
      arr.push(toDateKey(dt))
    }
    return arr
  } catch (e) {
    return [selectedDate.value]
  }
})

const scheduleTagsByDate = computed(() => {
  const map = {}
  props.schedules.forEach((schedule) => {
    const color = categoryById.value[schedule.categoryId]?.color || '#94a3b8'
    if (!map[schedule.date]) {
      map[schedule.date] = []
    }
    if (!map[schedule.date].includes(color)) {
      map[schedule.date].push(color)
    }
  })
  return map
})

const getTagsForDate = (day) => scheduleTagsByDate.value[getDateKeyForDay(day)] || []

const selectDate = (day) => {
  selectedDate.value = getDateKeyForDay(day)
}

const selectDateByKey = (dateKey) => {
  selectedDate.value = dateKey
  const parts = dateKey.split('-')
  currentMonth.value = new Date(Number(parts[0]), Number(parts[1]) - 1, 1)
}

const goToNextMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
}

const goToPrevMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1)
}
</script>

<style scoped>
.calendar-view { display: flex; flex-direction: column; background: var(--glass-bg-card); margin: var(--space-sm); border-radius: var(--radius-xl); box-shadow: var(--shadow-glass-card); }
.header-control {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--space-md) var(--space-lg);
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: var(--glass-blur-sm) var(--glass-saturate);
  -webkit-backdrop-filter: var(--glass-blur-sm) var(--glass-saturate);
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.5);
}
.title-text { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
.view-switch { display: flex; background: rgba(0, 0, 0, 0.04); padding: 3px; border-radius: var(--radius-sm); }
.switch-btn {
  padding: 6px 16px; font-size: var(--font-size-sm);
  color: var(--color-text-secondary); border-radius: var(--radius-xs);
  cursor: pointer; transition: all var(--transition-fast);
}
.active-switch {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold); box-shadow: var(--shadow-glass-card);
}

.calendar-grid { padding: 0 var(--space-sm) var(--space-md); }
.week-days { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 6px; }
.day-label {
  text-align: center; font-size: var(--font-size-sm);
  color: var(--color-text-muted); font-weight: var(--font-weight-medium);
}
.dates-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.date-cell {
  height: 56px; border: 0.5px solid rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.32);
  display: flex; flex-direction: column; align-items: center; position: relative;
  cursor: pointer; transition: all var(--transition-fast);
}
.date-cell:active { transform: scale(0.93); background: rgba(74, 158, 255, 0.12); }
.empty-cell { height: 56px; }
.is-today { background: rgba(74, 158, 255, 0.08); border-color: rgba(74, 158, 255, 0.20); }
.date-num { font-size: var(--font-size-sm); color: var(--color-text-primary); margin-top: 4px; font-weight: var(--font-weight-medium); }
.today-num {
  width: 30px; height: 30px;
  background: var(--color-primary-gradient);
  color: var(--color-text-inverse); border-radius: var(--radius-full);
  text-align: center; line-height: 30px;
  font-weight: var(--font-weight-bold); font-size: var(--font-size-sm);
  box-shadow: var(--shadow-primary);
}

.tags-row { display: flex; gap: 2px; margin-top: 6px; width: 100%; justify-content: center; padding: 0 4px; box-sizing: border-box; }
.tag-line { width: 8px; height: 8px; border-radius: var(--radius-full); display: inline-block; margin: 0 3px; box-shadow: var(--shadow-xs); }

.today-section { padding: var(--space-lg); background: transparent; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.section-title { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-text-primary); }
.section-sub { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.task-list { display: flex; flex-direction: column; gap: var(--space-md); }
.task-item {
  display: flex; align-items: center;
  padding: var(--space-lg);
  background: var(--glass-bg-medium);
  backdrop-filter: var(--glass-blur-sm) var(--glass-saturate);
  -webkit-backdrop-filter: var(--glass-blur-sm) var(--glass-saturate);
  border: none;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-glass-card);
  position: relative; overflow: hidden;
  transition: all var(--transition-fast);
  cursor: pointer;
}
.task-item:active { transform: scale(0.98); box-shadow: var(--shadow-glass-card-raised); }
.task-check-box { margin-right: var(--space-md); display: flex; align-items: center; justify-content: center; }
.icon-unchecked { width: 22px; height: 22px; border: 2px solid var(--color-border-strong); border-radius: var(--radius-full); }
.icon-checked {
  width: 22px; height: 22px; background: var(--color-success);
  color: var(--color-text-inverse); border-radius: var(--radius-full);
  text-align: center; line-height: 22px; font-size: var(--font-size-xs); font-weight: var(--font-weight-bold);
}
.task-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.task-item-title { font-size: var(--font-size-md); font-weight: var(--font-weight-medium); color: var(--color-text-primary); }
.task-meta { display: flex; align-items: center; gap: var(--space-sm); }
.task-time-tag {
  font-size: var(--font-size-xs); padding: 2px 6px;
  background: var(--color-bg-hover); color: var(--color-text-secondary);
  border-radius: var(--radius-xs);
}
.category-badge { font-size: var(--font-size-xs); padding: 2px 6px; border-radius: var(--radius-xs); font-weight: var(--font-weight-medium); }
.priority-line { position: absolute; right: 0; top: 0; bottom: 0; width: 5px; background: var(--color-warning); }
.line-through { text-decoration: line-through; color: var(--color-text-muted) !important; }
.text-red { color: var(--color-danger); }

.scroll-container { width: 100%; height: 100%; padding-bottom: 68px; box-sizing: border-box; }
.gray-divider { height: 8px; background: rgba(230, 236, 246, 0.55); width: 100%; }

.week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: var(--space-sm); }
.week-grid .date-cell {
  padding: 10px; background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border-radius: var(--radius-md); border: 0.5px solid rgba(255, 255, 255, 0.6);
  display: flex; flex-direction: column; align-items: center;
  box-shadow: var(--shadow-glass-card);
}

.fab-group {
  position: fixed; right: var(--space-lg); bottom: 84px;
  display: flex; flex-direction: column; gap: var(--space-md);
  z-index: var(--z-fab);
}
.fab-ai {
  width: 48px; height: 48px; border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.70);
  backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  -webkit-backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  display: flex; justify-content: center; align-items: center;
  box-shadow: var(--shadow-glass-card);
  border: 0.5px solid rgba(255, 255, 255, 0.7);
  transition: all var(--transition-spring);
  cursor: pointer;
  animation: fabFloatIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
}
.fab-ai-icon { font-size: 22px; line-height: 1; }
.fab-ai:active { transform: scale(0.88); background: var(--color-primary-bg); }
.fab-add {
  width: 60px; height: 60px; border-radius: var(--radius-full);
  background: var(--color-primary-gradient);
  color: var(--color-text-inverse);
  display: flex; justify-content: center; align-items: center;
  box-shadow: var(--shadow-primary);
  transition: all var(--transition-spring);
  cursor: pointer;
  position: relative;
  animation: fabFloatIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.fab-add-icon {
  font-size: 34px; font-weight: 200; line-height: 1;
  position: relative; z-index: 1;
}
.fab-add-ring {
  position: absolute; inset: -4px; border-radius: var(--radius-full);
  border: 2px solid rgba(74, 158, 255, 0.20);
  animation: fabPulse 2.4s ease-in-out infinite;
  pointer-events: none;
}
.fab-add:active { transform: scale(0.9); box-shadow: var(--shadow-primary-sm); }
.fab-add:active .fab-add-ring { animation: none; }
</style>
