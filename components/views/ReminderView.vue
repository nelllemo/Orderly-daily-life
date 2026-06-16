<template>
  <scroll-view class="scroll-container" scroll-y>
    <view class="reminder-view">
      <!-- 每日温馨提醒 -->
      <view class="daily-tip-card">
        <view class="tip-glow"></view>
        <view class="tip-body">
          <view class="tip-row-top">
            <text class="tip-greeting">{{ greetingMessage }}</text>
          </view>
          <view class="tip-stats">
            <view class="stat-block">
              <text class="stat-num">{{ todayPendingCount }}</text>
              <text class="stat-label">今日待办</text>
            </view>
            <view class="stat-sep"></view>
            <view class="stat-block">
              <text class="stat-num">{{ upcomingCount }}</text>
              <text class="stat-label">未来 7 天</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 晨间推送设置横幅 -->
      <view class="morning-banner">
        <view class="banner-left">
          <text class="icon-bell">🔔</text>
          <text class="banner-text">
            晨间推送:
            <picker mode="time" :value="settings.morningPushTime" @change="onMorningPushTimeChange">
              <text class="text-blue">每天 {{ settings.morningPushTime }}</text>
            </picker>
          </text>
        </view>
        <view class="switch-ui" :class="{'active-toggle': settings.morningPushEnabled}" @click="emit('toggle-morning-push')">
          <view class="switch-knob" :class="{'knob-off': !settings.morningPushEnabled}"></view>
        </view>
      </view>

      <!-- 时间轴容器 -->
      <view class="timeline-container">

        <!-- 今日剩余待办 -->
        <view class="timeline-section">
          <view class="timeline-node node-blue"></view>
          <text class="section-title">今日剩余</text>
          <view class="task-list-timeline">
            <view class="task-card" :class="{ 'card-completed': task.completed }" v-for="task in todayTasks" :key="task.id">
              <text class="task-time-left">{{ task.time }}</text>
              <view class="task-card-content">
                <view class="task-info" @click="emit('open-edit-modal', task)">
                  <text class="task-title" :class="{ 'text-red': task.priority === 3, 'line-through': task.completed }">{{ task.title }}</text>
                  <view class="task-tag" :style="{ color: task.color, backgroundColor: task.color + '20' }">
                    {{ task.categoryName }}
                  </view>
                </view>
                <view class="task-actions">
                  <view class="circle-check" @click.stop="emit('toggle-task', task)"></view>
                  <text class="action-btn" @click.stop="emit('open-edit-modal', task)">编辑</text>
                  <text class="action-btn text-red" @click.stop="emit('remove-schedule', task.id)">删除</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 未来待办 -->
        <view class="timeline-section">
          <view class="timeline-node node-green"></view>
          <text class="section-title">未来待办</text>
          <view class="task-list-timeline">
            <view class="task-card" v-for="task in futureTasks" :key="task.id">
              <text class="task-date-left">{{ task.date.slice(5) }}</text>
              <view class="task-card-content">
                <view class="task-info" @click="emit('open-edit-modal', task)">
                  <text class="task-title text-gray">{{ task.title }}</text>
                  <text class="task-desc">{{ task.time }}</text>
                </view>
                <view class="task-actions">
                  <text class="action-btn" @click.stop="emit('open-edit-modal', task)">编辑</text>
                  <text class="action-btn text-red" @click.stop="emit('remove-schedule', task.id)">删除</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 已过期任务 (置灰) -->
        <view class="timeline-section">
          <view class="timeline-node node-gray"></view>
          <text class="section-title text-light-gray">已过期任务</text>
          <view class="task-list-timeline">
            <view class="task-card card-expired" v-for="task in pastTasks" :key="task.id">
              <text class="task-date-left text-light-gray">{{ task.date.slice(5) }}</text>
              <view class="task-card-content">
                <view class="task-info" @click="emit('open-edit-modal', task)">
                  <text class="task-title line-through">{{ task.title }}</text>
                </view>
                <view class="task-actions">
                  <text class="action-btn" @click.stop="emit('open-edit-modal', task)">编辑</text>
                  <text class="action-btn text-red" @click.stop="emit('remove-schedule', task.id)">删除</text>
                </view>
              </view>
            </view>
          </view>
        </view>

      </view>
    </view>
  </scroll-view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  schedules: { type: Array, default: () => [] },
  categories: { type: Array, default: () => [] },
  settings: { type: Object, default: () => ({ morningPushEnabled: true, morningPushTime: '08:00' }) },
  todayKey: { type: String, required: true }
})

const emit = defineEmits([
  'open-edit-modal',
  'toggle-task',
  'remove-schedule',
  'toggle-morning-push',
  'set-morning-push-time'
])

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
      return (a.time || '').localeCompare(b.time || '')
    })
)
const futureTasks = computed(() =>
  props.schedules.filter((t) => t.date > props.todayKey).map(scheduleToTask)
)
const pastTasks = computed(() =>
  props.schedules.filter((t) => t.date < props.todayKey).map(scheduleToTask)
)

const todayPendingCount = computed(() =>
  props.schedules.filter((t) => t.date === props.todayKey && !t.completed).length
)

const upcomingCount = computed(() => {
  const today = new Date(props.todayKey)
  const end = new Date(today)
  end.setDate(end.getDate() + 7)
  const endKey = `${end.getFullYear()}-${String(end.getMonth()+1).padStart(2,'0')}-${String(end.getDate()).padStart(2,'0')}`
  return props.schedules.filter((t) => t.date > props.todayKey && t.date <= endKey).length
})

const greetingMessages = [
  '新的一天，从最重要的事开始 ✨',
  '慢慢来，比较快 🌿',
  '专注当下，一件一件来 🎯',
  '你的努力，时间看得见 ⏳',
  '有条不紊，从容前行 🧘',
  '每天进步一点点，就是最好的成长 🌱',
  '生活要有序，也要有温度 ☕',
  '你已经很棒了，继续保持 💫',
]

const greetingMessage = computed(() => {
  if (todayPendingCount.value === 0) return '今日全部完成，享受你的时光吧 🎉'
  const today = new Date()
  const idx = (today.getFullYear() * 365 + today.getMonth() * 31 + today.getDate()) % greetingMessages.length
  return greetingMessages[idx]
})

const onMorningPushTimeChange = (event) => {
  emit('set-morning-push-time', event.detail.value)
}
</script>

<style scoped>
.scroll-container { width: 100%; height: 100%; padding-bottom: 68px; box-sizing: border-box; }
.reminder-view { padding: var(--space-sm) var(--space-lg); min-height: 100%; background: transparent; }

.daily-tip-card {
  position: relative;
  margin: 0 var(--space-sm) var(--space-md);
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--glass-bg-medium);
  backdrop-filter: var(--glass-blur-lg) var(--glass-saturate);
  -webkit-backdrop-filter: var(--glass-blur-lg) var(--glass-saturate);
  box-shadow: var(--shadow-glass-card-raised);
}
.tip-glow {
  position: absolute; top: -40px; left: 50%; transform: translateX(-50%);
  width: 200px; height: 90px;
  background: var(--glass-light-orb-primary);
  pointer-events: none;
  animation: glow-breathe 5s ease-in-out infinite;
}
.tip-body {
  position: relative; z-index: 1;
  padding: 18px 20px 16px;
}
.tip-row-top {
  margin-bottom: 14px;
}
.tip-greeting {
  display: block; text-align: center;
  font-size: 13px; font-weight: 500;
  color: rgba(30,41,59,0.55);
  letter-spacing: 0.2px;
}
.tip-stats {
  display: flex; align-items: center; justify-content: center;
  gap: 28px;
}
.stat-block {
  display: flex; flex-direction: column; align-items: center;
  min-width: 56px;
}
.stat-num {
  font-size: 42px;
  font-weight: 590;
  color: #121926;
  line-height: 1;
  letter-spacing: var(--letter-spacing-numerals);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}
.stat-label {
  font-size: 11px;
  color: rgba(30,41,59,0.40);
  font-weight: 500;
  margin-top: 4px;
  letter-spacing: 0.6px;
}
.stat-sep {
  width: 0.5px; height: 32px;
  background: rgba(0,0,0,0.08);
  border-radius: 1px;
}
.morning-banner {
  margin: 0 var(--space-sm) var(--space-lg);
  background: var(--glass-bg-light);
  backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  -webkit-backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex; justify-content: space-between; align-items: center;
  box-shadow: var(--shadow-glass-card);
}
.banner-left { display: flex; align-items: center; gap: var(--space-sm); }
.banner-text { font-size: var(--font-size-base); color: var(--color-text-primary); font-weight: var(--font-weight-medium); }
.text-blue { color: var(--color-primary); }
.switch-ui {
  width: 48px; height: 26px; border-radius: 13px;
  background: var(--color-border);
  position: relative;
  transition: background var(--transition-normal);
  cursor: pointer;
}
.active-toggle { background: var(--color-primary); }
.switch-knob {
  width: 22px; height: 22px; background: var(--color-white);
  border-radius: var(--radius-full);
  position: absolute; right: 2px; top: 2px;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-spring);
}
.knob-off { right: 24px !important; }

.timeline-container { border-left: 2px solid rgba(0, 0, 0, 0.05); margin-left: var(--space-sm); padding-bottom: var(--space-xl); }
.timeline-section { position: relative; padding-left: var(--space-2xl); margin-bottom: 32px; }
.timeline-node { position: absolute; border-radius: var(--radius-full); }
.node-blue {
  width: 12px; height: 12px; background: var(--color-primary-gradient);
  left: -7px; top: 4px;
  box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.15), 0 0 0 7px rgba(74, 158, 255, 0.05);
}
.node-green {
  width: 10px; height: 10px; background: var(--color-success);
  left: -6px; top: 6px;
  box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.15), 0 0 0 7px rgba(52, 211, 153, 0.05);
}
.node-gray {
  width: 10px; height: 10px; background: var(--color-text-muted);
  left: -6px; top: 6px;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.04);
}
.section-title { font-size: var(--font-size-base); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin-bottom: var(--space-md); display: block; }
.text-light-gray { color: var(--color-text-muted); }

.task-list-timeline { display: flex; flex-direction: column; gap: var(--space-md); }
.task-card {
  background: var(--glass-bg-medium);
  backdrop-filter: var(--glass-blur-sm) var(--glass-saturate);
  -webkit-backdrop-filter: var(--glass-blur-sm) var(--glass-saturate);
  border: none;
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-glass-card);
  position: relative;
  transition: all var(--transition-fast);
}
.task-card:active { transform: scale(0.98); }
.task-time-left, .task-date-left {
  position: absolute; left: -56px; top: 12px;
  font-size: var(--font-size-sm); color: var(--color-text-primary);
  font-weight: var(--font-weight-medium); width: 48px; text-align: right;
}
.task-date-left { color: var(--color-text-secondary); }
.task-card-content { display: flex; justify-content: space-between; align-items: flex-start; }
.task-info { display: flex; flex-direction: column; align-items: flex-start; }
.task-actions { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.action-btn {
  font-size: var(--font-size-xs); color: var(--color-text-secondary);
  padding: var(--space-xs) var(--space-sm); border-radius: var(--radius-xs);
  transition: all var(--transition-fast);
}
.action-btn:active { background: var(--color-bg-hover); }
.task-title { font-size: var(--font-size-base); font-weight: var(--font-weight-medium); color: var(--color-text-primary); }
.text-red { color: var(--color-danger); }
.text-gray { color: var(--color-text-secondary); }
.task-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: 4px; display: block; }
.task-tag { font-size: var(--font-size-xs); padding: 2px 6px; border-radius: var(--radius-xs); display: inline-block; margin-top: 6px; }
.circle-check { width: 22px; height: 22px; border: 2px solid var(--color-border-strong); border-radius: var(--radius-full); }
.card-expired { background: var(--color-bg-page); opacity: 0.65; }
.card-completed { opacity: 0.55; background: var(--color-bg-page); }
.line-through { text-decoration: line-through; color: var(--color-text-muted) !important; }
</style>
