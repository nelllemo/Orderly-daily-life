<template>
  <scroll-view class="scroll-container" scroll-y>
    <view class="profile-view">
      <!-- 顶部用户信息 (带底部弧度) -->
      <view class="profile-header">
        <view class="user-info">
          <view class="avatar-box" @click="emit('open-profile-modal')">
            <image v-if="session.avatar" :src="session.avatar" mode="aspectFill" class="avatar-img" @error="(e) => { e.target.style.display = 'none'; }" />
            <text v-else class="avatar-icon">{{ displayInitial }}</text>
          </view>
          <view class="text-info">
            <text class="user-name">{{ displayName }}</text>
            <text class="user-sub">{{ session.isGuest ? '请登录以查看成长简历' : '个人成长档案' }}</text>
          </view>
        </view>
        <view class="edit-profile-btn" @click="emit('open-profile-modal')">
          <text class="edit-profile-text">编辑资料</text>
        </view>
      </view>

      <view class="profile-content">
        <!-- 数据面板 -->
        <view class="stats-panel">
          <view class="stat-item">
            <text class="stat-num">{{ completedTasksCount }}</text>
            <text class="stat-label">完成日程</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-num">{{ momentsCount }}</text>
            <text class="stat-label">发布动态</text>
          </view>
        </view>

        <!-- Guest prompt -->
        <view v-if="session.isGuest" class="guest-prompt-card">
          <text class="guest-prompt-icon">🌟</text>
          <text class="guest-prompt-title">登录后解锁个人成长简历</text>
          <text class="guest-prompt-desc">AI 会根据你的日程完成记录和动态，生成专属的个人成长档案，包括技能积累、活动亮点、成长洞察等。</text>
          <view class="guest-prompt-btn" @click="emit('open-auth-modal', 'login')">
            <text>登录 / 注册</text>
          </view>
        </view>

        <!-- AI Resume Section (logged in only) -->
        <template v-if="!session.isGuest">
          <!-- Loading skeleton -->
          <view v-if="loading" class="resume-section">
            <view class="skeleton-card" v-for="i in 4" :key="i">
              <view class="skeleton-line skeleton-line-short"></view>
              <view class="skeleton-line"></view>
              <view class="skeleton-line skeleton-line-long"></view>
            </view>
          </view>

          <!-- Resume cards -->
          <view v-else-if="resumeData" class="resume-section">

            <!-- Personal Summary -->
            <view class="resume-card resume-card-summary">
              <view class="resume-card-header">
                <text class="resume-card-icon">📝</text>
                <text class="resume-card-title">关于我</text>
              </view>
              <text class="resume-summary-text">{{ resumeData.personalSummary }}</text>
            </view>

            <!-- Skill Tags -->
            <view v-if="resumeData.skillTags && resumeData.skillTags.length" class="resume-card">
              <view class="resume-card-header">
                <text class="resume-card-icon">🛠️</text>
                <text class="resume-card-title">技能标签</text>
              </view>
              <view class="skill-tags-cloud">
                <text class="skill-tag" v-for="tag in resumeData.skillTags" :key="tag">{{ tag }}</text>
              </view>
            </view>

            <!-- Activity Highlights -->
            <view v-if="resumeData.activityHighlights && resumeData.activityHighlights.length" class="resume-card">
              <view class="resume-card-header">
                <text class="resume-card-icon">🏆</text>
                <text class="resume-card-title">亮点时刻</text>
              </view>
              <view class="highlights-list">
                <view class="highlight-item" v-for="(item, idx) in resumeData.activityHighlights" :key="idx">
                  <view class="highlight-dot"></view>
                  <view class="highlight-content">
                    <view class="highlight-title-row">
                      <text class="highlight-title">{{ item.title }}</text>
                      <text class="highlight-date">{{ item.date }}</text>
                    </view>
                    <text class="highlight-desc">{{ item.description }}</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- Growth Insight -->
            <view v-if="resumeData.growthInsight" class="resume-card resume-card-insight">
              <view class="resume-card-header">
                <text class="resume-card-icon">💡</text>
                <text class="resume-card-title">成长洞察</text>
              </view>
              <text class="resume-insight-text">{{ resumeData.growthInsight }}</text>
            </view>

            <!-- Suggested Next Steps -->
            <view v-if="resumeData.suggestedNextSteps && resumeData.suggestedNextSteps.length" class="resume-card">
              <view class="resume-card-header">
                <text class="resume-card-icon">🎯</text>
                <text class="resume-card-title">下一步建议</text>
              </view>
              <view class="next-steps-list">
                <view class="next-step-item" v-for="(step, idx) in resumeData.suggestedNextSteps" :key="idx">
                  <text class="next-step-num">{{ idx + 1 }}</text>
                  <text class="next-step-text">{{ step }}</text>
                </view>
              </view>
            </view>

            <!-- Regenerate button -->
            <view class="regenerate-btn" @click="loadResume">
              <text class="regenerate-text">{{ loading ? '生成中...' : '🔄 重新生成' }}</text>
            </view>
          </view>

          <!-- Error state -->
          <view v-else class="guest-prompt-card">
            <text class="guest-prompt-icon">⚠️</text>
            <text class="guest-prompt-title">简历生成失败</text>
            <text class="guest-prompt-desc">请检查网络连接后重试</text>
            <view class="guest-prompt-btn" @click="loadResume">
              <text>重试</text>
            </view>
          </view>
        </template>

        <!-- Footer actions: login/logout -->
        <view class="footer-actions">
          <view v-if="session.isGuest" class="footer-action-row" @click="emit('open-auth-modal', 'login')">
            <text class="footer-action-icon">🔑</text>
            <text class="footer-action-text">登录 / 注册</text>
            <text class="footer-action-arrow">></text>
          </view>
          <view class="footer-action-row" @click="emit('open-auth-modal', 'login')">
            <text class="footer-action-icon">ℹ️</text>
            <text class="footer-action-text">关于有序日常</text>
            <text class="footer-action-arrow">></text>
          </view>
          <view v-if="!session.isGuest" class="footer-action-row footer-logout" @click="emit('logout')">
            <text class="footer-action-icon">🚪</text>
            <text class="footer-action-text text-red">退出登录</text>
          </view>
        </view>
      </view>
    </view>
  </scroll-view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import * as api from '../../services/api'

const props = defineProps({
  session: { type: Object, default: () => ({ userId: null, token: null, email: null, nickname: '', avatar: '', isGuest: true }) },
  schedules: { type: Array, default: () => [] },
  momentsCount: { type: Number, default: 0 }
})

const emit = defineEmits(['open-auth-modal', 'logout', 'open-profile-modal'])

const completedTasksCount = computed(() =>
  props.schedules.filter((t) => t.completed).length
)

const displayName = computed(() => {
  if (props.session.nickname) return props.session.nickname
  if (props.session.email) return props.session.email.split('@')[0]
  return '游客'
})

const displayInitial = computed(() => {
  const name = displayName.value
  return name.charAt(0).toUpperCase() || '👤'
})

const loading = ref(false)
const resumeData = ref(null)

const loadResume = async () => {
  if (props.session.isGuest) return
  loading.value = true
  resumeData.value = null
  try {
    const data = await api.generateResume()
    resumeData.value = data
  } catch (e) {
    console.error('Failed to load resume:', e)
    resumeData.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!props.session.isGuest) {
    loadResume()
  }
})

// Reload resume when session changes (e.g., after login)
watch(() => props.session.isGuest, (isGuest) => {
  if (!isGuest) {
    loadResume()
  } else {
    resumeData.value = null
  }
})
</script>

<style scoped>
.scroll-container { width: 100%; height: 100%; padding-bottom: 68px; box-sizing: border-box; }
.profile-view { min-height: 100%; background: transparent; }
.profile-header {
  background: linear-gradient(160deg, rgba(74, 158, 255, 0.92) 0%, rgba(60, 130, 235, 0.88) 40%, rgba(40, 100, 200, 0.90) 100%);
  backdrop-filter: var(--glass-blur-sm);
  -webkit-backdrop-filter: var(--glass-blur-sm);
  padding: 28px var(--space-2xl) 32px;
  border-radius: 0 0 var(--radius-2xl) var(--radius-2xl);
  box-shadow: var(--shadow-glass-primary);
  position: relative;
  overflow: hidden;
}
.profile-header::before {
  content: ''; position: absolute; top: -40px; right: -30px;
  width: 120px; height: 120px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.06);
}
.profile-header::after {
  content: ''; position: absolute; bottom: -50px; left: -20px;
  width: 100px; height: 100px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.04);
}
.user-info { display: flex; align-items: center; gap: var(--space-lg); position: relative; z-index: 1; }
.avatar-box {
  width: 72px; height: 72px; border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.15);
  border: 3px solid rgba(255, 255, 255, 0.4);
  display: flex; justify-content: center; align-items: center;
  overflow: hidden;
  transition: transform var(--transition-normal);
}
.avatar-box:active { transform: scale(0.95); }
.avatar-img { width: 100%; height: 100%; border-radius: var(--radius-full); }
.avatar-icon { font-size: 36px; }
.text-info { display: flex; flex-direction: column; gap: 4px; position: relative; z-index: 1; }
.user-name { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text-inverse); }
.user-sub { font-size: var(--font-size-base); color: rgba(255, 255, 255, 0.7); }
.edit-profile-btn {
  position: absolute; right: var(--space-2xl); top: 50%; transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: var(--glass-blur-sm);
  -webkit-backdrop-filter: var(--glass-blur-sm);
  padding: 8px 16px; border-radius: var(--radius-xl);
  border: 0.5px solid rgba(255, 255, 255, 0.3);
  box-shadow: inset 0 0.5px 0 rgba(255, 255, 255, 0.3);
  transition: all var(--transition-fast);
  cursor: pointer; z-index: 1;
}
.edit-profile-btn:active { background: rgba(255, 255, 255, 0.25); transform: translateY(-50%) scale(0.95); }
.edit-profile-text { font-size: var(--font-size-sm); color: var(--color-text-inverse); }

.profile-content { padding: 0 var(--space-lg); margin-top: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-lg); padding-bottom: 100px; }

/* Stats Panel */
.stats-panel {
  background: var(--glass-bg-medium);
  backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  -webkit-backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  display: flex; justify-content: space-around; align-items: center;
  box-shadow: var(--shadow-glass-card);
}
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stat-num { font-size: var(--font-size-3xl); font-weight: var(--font-weight-590); color: var(--color-text-primary); letter-spacing: var(--letter-spacing-numerals); font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; }
.stat-label { font-size: var(--font-size-sm); color: var(--color-text-muted); font-weight: var(--font-weight-medium); }
.stat-divider { width: 1px; height: 40px; background: var(--color-border-light); }

/* Guest Prompt Card */
.guest-prompt-card {
  background: var(--glass-bg-medium);
  backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  -webkit-backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  border-radius: var(--radius-lg);
  padding: var(--space-2xl) var(--space-xl);
  display: flex; flex-direction: column; align-items: center;
  box-shadow: var(--shadow-glass-card);
  text-align: center;
}
.guest-prompt-icon { font-size: 48px; margin-bottom: var(--space-md); }
.guest-prompt-title { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin-bottom: var(--space-sm); }
.guest-prompt-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.5; margin-bottom: var(--space-xl); }
.guest-prompt-btn {
  background: var(--color-primary-gradient);
  padding: 10px 32px; border-radius: var(--radius-xl);
  box-shadow: var(--shadow-glass-primary);
  transition: all var(--transition-fast); cursor: pointer;
}
.guest-prompt-btn:active { transform: scale(0.95); }
.guest-prompt-btn text { color: var(--color-text-inverse); font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); }

/* Resume Section */
.resume-section { display: flex; flex-direction: column; gap: var(--space-md); }

/* Resume Card */
.resume-card {
  background: var(--glass-bg-card);
  backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  -webkit-backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  border-radius: var(--radius-lg);
  padding: var(--space-lg) var(--space-xl);
  box-shadow: var(--shadow-glass-card);
}
.resume-card-header {
  display: flex; align-items: center; gap: var(--space-sm);
  margin-bottom: var(--space-md);
}
.resume-card-icon { font-size: 18px; }
.resume-card-title {
  font-size: var(--font-size-md); font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

/* Personal Summary */
.resume-card-summary { border-left: 3px solid #FF9500; }
.resume-summary-text {
  font-size: var(--font-size-base); color: var(--color-text-primary);
  line-height: 1.7;
}

/* Skill Tags */
.skill-tags-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
.skill-tag {
  display: inline-flex; align-items: center;
  padding: 6px 14px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-size: var(--font-size-sm); font-weight: var(--font-weight-medium);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(74, 158, 255, 0.12);
}

/* Activity Highlights */
.highlights-list { display: flex; flex-direction: column; }
.highlight-item { display: flex; gap: var(--space-md); padding: var(--space-md) 0; }
.highlight-item:not(:last-child) { border-bottom: 0.5px solid rgba(255, 255, 255, 0.45); }
.highlight-dot {
  width: 10px; height: 10px; border-radius: var(--radius-full);
  background: var(--color-primary-gradient);
  margin-top: 5px; flex-shrink: 0;
  box-shadow: 0 0 6px rgba(74, 158, 255, 0.35);
}
.highlight-content { flex: 1; min-width: 0; }
.highlight-title-row { display: flex; justify-content: space-between; align-items: baseline; gap: var(--space-sm); flex-wrap: wrap; }
.highlight-title { font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); }
.highlight-date { font-size: var(--font-size-xs); color: var(--color-text-muted); white-space: nowrap; }
.highlight-desc { font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: 2px; line-height: 1.4; }

/* Growth Insight */
.resume-card-insight { border-left: 3px solid #34D399; }
.resume-insight-text {
  font-size: var(--font-size-base); color: var(--color-text-primary);
  line-height: 1.7; font-style: italic;
}

/* Suggested Next Steps */
.next-steps-list { display: flex; flex-direction: column; gap: var(--space-sm); }
.next-step-item { display: flex; align-items: center; gap: var(--space-md); }
.next-step-num {
  width: 24px; height: 24px; border-radius: var(--radius-full);
  background: var(--color-primary-bg); color: var(--color-primary);
  font-size: var(--font-size-xs); font-weight: var(--font-weight-bold);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.next-step-text { font-size: var(--font-size-base); color: var(--color-text-primary); }

/* Regenerate Button */
.regenerate-btn {
  display: flex; justify-content: center; align-items: center;
  padding: var(--space-md);
  background: var(--glass-bg-light);
  backdrop-filter: var(--glass-blur-xs) var(--glass-saturate);
  -webkit-backdrop-filter: var(--glass-blur-xs) var(--glass-saturate);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(74, 158, 255, 0.1);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.regenerate-btn:active { background: var(--color-bg-hover); transform: scale(0.97); }
.regenerate-text { font-size: var(--font-size-sm); color: var(--color-primary); font-weight: var(--font-weight-medium); }

/* Skeleton Loading */
.skeleton-card {
  background: var(--glass-bg-card);
  backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  -webkit-backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-glass-card);
}
.skeleton-line {
  height: 14px; border-radius: 7px;
  background: linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-bottom: 10px;
}
.skeleton-line-short { width: 40%; }
.skeleton-line-long { width: 80%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Footer Actions */
.footer-actions {
  background: var(--glass-bg-medium);
  backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  -webkit-backdrop-filter: var(--glass-blur-md) var(--glass-saturate);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-glass-card);
  overflow: hidden;
}
.footer-action-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--space-lg);
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.45);
  transition: background var(--transition-fast);
  cursor: pointer;
}
.footer-action-row:last-child { border-bottom: none; }
.footer-action-row:active { background: var(--color-bg-hover); }
.footer-action-icon { font-size: 18px; width: 28px; text-align: center; }
.footer-action-text { font-size: var(--font-size-md); color: var(--color-text-primary); flex: 1; margin-left: var(--space-sm); }
.footer-action-arrow { font-size: 14px; color: var(--color-border-strong); font-family: monospace; }
.footer-logout { border-bottom: none; }
.text-red { color: var(--color-danger); }
</style>
