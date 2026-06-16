<template>
  <view class="full-component-container">
    <view class="moments-view">
      <!-- 顶部标题栏 -->
      <view class="moments-top-bar">
        <text class="moments-title">生活动态</text>
      </view>

      <!-- 动态时间线列表 -->
      <scroll-view class="moments-scroll" scroll-y>
        <view class="moments-list">

          <view class="moment-card" v-for="dyn in moments" :key="dyn.id">
            <!-- 左侧日期栏 -->
            <view class="moment-date-col">
              <text class="moment-date-day">{{ dyn.date.slice(5) }}</text>
              <text class="moment-date-weekday">{{ weekdayLabel(dyn.date) }}</text>
            </view>

            <!-- 右侧内容区 -->
            <view class="moment-main">
              <!-- 头部：头像 + 昵称 + 时间 -->
              <view class="moment-header">
                <view class="moment-avatar">
                  <image v-if="userAvatar" :src="userAvatar" mode="aspectFill" class="moment-avatar-img" />
                  <text v-else class="moment-avatar-text">{{ (userNickname || '我').charAt(0) }}</text>
                </view>
                <view class="moment-header-info">
                  <text class="moment-nickname">{{ userNickname || '我' }}</text>
                  <text class="moment-time">{{ relativeTime(dyn.date, dyn.time) }}</text>
                </view>
              </view>

              <!-- 正文内容 -->
              <view class="moment-body">
                <text
                  class="moment-content"
                  :class="{ 'moment-content-folded': dyn.content && dyn.content.length > 140 && !expandedMoments[dyn.id] }"
                >{{ dyn.content }}</text>
                <text
                  v-if="dyn.content && dyn.content.length > 140"
                  class="moment-expand-btn"
                  @click="toggleExpand(dyn.id)"
                >{{ expandedMoments[dyn.id] ? '收起' : '全文' }}</text>
              </view>

              <!-- 图片九宫格 -->
              <view v-if="safeImageUrls(dyn.imageUrls).length" :class="['moment-images-grid', 'grid-col-' + Math.min(safeImageUrls(dyn.imageUrls).length > 1 ? (safeImageUrls(dyn.imageUrls).length === 4 ? 2 : 3) : 1, 3)]">
                <view
                  class="moment-image-wrap"
                  :class="{ 'moment-image-single': safeImageUrls(dyn.imageUrls).length === 1 }"
                  v-for="(img, idx) in safeImageUrls(dyn.imageUrls).slice(0,9)"
                  :key="idx"
                  @click="previewImages(safeImageUrls(dyn.imageUrls), img)"
                >
                  <image :src="img" mode="aspectFill" class="moment-image" @error="(e) => { e.target.style.display = 'none'; e.target.parentElement.style.display = 'none'; }" />
                </view>
              </view>

              <!-- 关联日程 -->
              <view v-if="dyn.relatedScheduleId" class="moment-schedule-link">
                <text class="moment-link-icon">📎</text>
                <text class="moment-link-text">{{ scheduleTitleById[dyn.relatedScheduleId] || '已删除日程' }}</text>
              </view>

            </view>
          </view>

          <!-- 空状态 -->
          <view v-if="moments.length === 0" class="moments-empty">
            <text class="empty-icon">📝</text>
            <text class="empty-text">还没有动态，记录点什么吧</text>
          </view>
        </view>
      </scroll-view>

      <!-- 发布悬浮按钮 -->
      <view class="moments-fab" @click="emit('open-publish-modal')">
        <text class="moments-fab-icon">✏️</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  moments: { type: Array, default: () => [] },
  schedules: { type: Array, default: () => [] },
  userNickname: { type: String, default: '' },
  userAvatar: { type: String, default: '' }
})

const emit = defineEmits(['open-publish-modal'])

const expandedMoments = ref({})

// Filter out blob URLs (expired) and other invalid image URLs
const safeImageUrls = (urls) => {
  if (!urls || !urls.length) return []
  return urls.filter(url => {
    if (!url || typeof url !== 'string') return false
    if (url.startsWith('blob:')) return false
    return true
  })
}

const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const weekdayLabel = (dateStr) => {
  const d = new Date(dateStr)
  return weekDayNames[d.getDay()]
}

const relativeTime = (dateStr, timeStr) => {
  const target = new Date(`${dateStr}T${timeStr}`)
  const now = new Date()
  const diff = now - target
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`) return '昨天'
  if (hours < 48) return '昨天'
  return `${dateStr.slice(5)} ${timeStr.slice(0,5)}`
}

const scheduleTitleById = computed(() => {
  const map = {}
  props.schedules.forEach((schedule) => {
    map[schedule.id] = schedule.title
  })
  return map
})

const toggleExpand = (id) => {
  expandedMoments.value[id] = !expandedMoments.value[id]
}

const previewImages = (urls, current) => {
  uni.previewImage({ urls, current })
}
</script>

<style scoped>
.full-component-container { width: 100%; height: 100%; padding-bottom: 68px; box-sizing: border-box; display: flex; flex-direction: column; }
.moments-view { flex: 1; display: flex; flex-direction: column; height: 100%; background: transparent; }

.moments-top-bar {
  padding: var(--space-sm) var(--space-xl) var(--space-md);
  background: var(--glass-bg-heavy);
  backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  -webkit-backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  flex-shrink: 0;
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.5);
  box-shadow: var(--shadow-glass-tab);
}
.moments-title {
  font-size: var(--font-size-lg); font-weight: var(--font-weight-bold);
  color: var(--color-text-primary); display: block;
}

.moments-scroll { flex: 1; overflow-y: auto; }
.moments-list { padding: 0 var(--space-md) 80px; }

.moment-card {
  display: flex; flex-direction: row; align-items: flex-start;
  background: var(--glass-bg-card);
  backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  -webkit-backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  margin-bottom: var(--space-sm);
  border-radius: var(--radius-lg);
  padding: var(--space-lg) 0;
  box-shadow: var(--shadow-glass-card);
  transition: all var(--transition-fast);
}
.moment-card:active { transform: scale(0.99); box-shadow: var(--shadow-glass-card-raised); }

.moment-date-col {
  width: 52px; flex-shrink: 0;
  display: flex; flex-direction: column; align-items: center;
  padding-top: 2px;
}
.moment-date-day {
  font-size: var(--font-size-md); font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary); line-height: 1.2;
}
.moment-date-weekday {
  font-size: var(--font-size-xs); color: var(--color-text-muted);
  margin-top: 1px;
}

.moment-main { flex: 1; min-width: 0; padding-right: var(--space-md); }

.moment-header { display: flex; align-items: flex-start; margin-bottom: 6px; }
.moment-avatar {
  width: 40px; height: 40px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-bg);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-right: var(--space-sm);
}
.moment-avatar-text { font-size: var(--font-size-2xl); }
.moment-avatar-img { width: 100%; height: 100%; border-radius: var(--radius-sm); }
.moment-header-info {
  display: flex; flex-direction: column; justify-content: center;
  min-height: 38px;
}
.moment-nickname {
  font-size: var(--font-size-base); font-weight: var(--font-weight-semibold);
  color: var(--color-primary); margin-bottom: 1px; line-height: 1.3;
}
.moment-time {
  font-size: var(--font-size-xs); color: var(--color-text-muted);
  line-height: 1.3;
}

.moment-body { margin-left: 48px; margin-bottom: 6px; }
.moment-content {
  font-size: var(--font-size-md); color: var(--color-text-primary);
  line-height: 1.6; word-break: break-all;
  white-space: pre-wrap; display: block;
}
.moment-content-folded {
  display: -webkit-box; -webkit-box-orient: vertical;
  -webkit-line-clamp: 6; overflow: hidden;
}
.moment-expand-btn {
  font-size: var(--font-size-base); color: var(--color-primary);
  display: inline-block; margin-top: 2px;
}

.moment-images-grid {
  margin-left: 48px; margin-bottom: 6px;
  display: grid; gap: 2px; max-width: 220px;
}
.grid-col-1 { grid-template-columns: 1fr; max-width: 170px; }
.grid-col-2 { grid-template-columns: repeat(2, 1fr); max-width: 190px; }
.grid-col-3 { grid-template-columns: repeat(3, 1fr); max-width: 220px; }

.moment-image-wrap {
  width: 100%; padding-top: 100%; position: relative;
  overflow: hidden; border-radius: var(--radius-xs);
  background: var(--color-bg-hover);
}
.moment-image-single { padding-top: 75%; max-width: 170px; }
.moment-image { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }

.moment-schedule-link {
  margin-left: 48px; margin-bottom: 6px;
  display: inline-flex; align-items: center; gap: 4px;
  background: var(--color-primary-bg);
  border-radius: var(--radius-sm);
  padding: 6px 10px; max-width: 230px;
  border: 1px solid rgba(59, 130, 246, 0.12);
}
.moment-link-icon { font-size: var(--font-size-sm); }
.moment-link-text {
  font-size: var(--font-size-sm); color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; flex: 1;
}

.moments-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 100px var(--space-xl);
  background: var(--glass-bg-medium);
  backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  -webkit-backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-glass-card);
  margin: var(--space-lg);
}
.empty-icon { font-size: 56px; margin-bottom: var(--space-lg); opacity: 0.5; }
.empty-text { font-size: var(--font-size-base); color: var(--color-text-muted); }

.moments-fab {
  position: fixed; right: var(--space-lg); bottom: 84px;
  width: 60px; height: 60px; border-radius: var(--radius-full);
  background: var(--color-white);
  border: 2.5px solid var(--color-primary);
  display: flex; justify-content: center; align-items: center;
  box-shadow: 0 4px 18px rgba(74, 158, 255, 0.18);
  z-index: var(--z-fab);
  transition: all var(--transition-spring);
  cursor: pointer;
  animation: fabFloatIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
}
.moments-fab:active { transform: scale(0.9); box-shadow: 0 2px 8px rgba(74, 158, 255, 0.12); }
.moments-fab-icon { color: var(--color-primary); font-size: 26px; line-height: 1; }
</style>
