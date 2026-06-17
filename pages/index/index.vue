<template>
  <view class="app-container">
    <!-- 顶部状态栏自适应占位区 -->
    <view class="status-bar"></view>

    <!-- 主内容区：通过 activeTab 决定显示哪个版块 -->
    <view class="main-content">
      <Transition name="tab" mode="out-in">

      <!-- 1. 日历视图 -->
      <CalendarView
        v-if="activeTab === 'calendar'"
        :key="'calendar'"
        :schedules="schedules"
        :categories="categories"
        :todayKey="todayKey"
        @open-add-modal="openAddModal"
        @open-edit-modal="openEditModal"
        @open-ai-modal="openAIModal"
        @toggle-task="toggleTask"
        @remove-schedule="removeSchedule"
      />

      <!-- 2. 提醒中心视图 -->
      <ReminderView
        v-else-if="activeTab === 'reminders'"
        :key="'reminders'"
        :schedules="schedules"
        :categories="categories"
        :settings="settings"
        :todayKey="todayKey"
        @open-edit-modal="openEditModal"
        @toggle-task="toggleTask"
        @remove-schedule="removeSchedule"
        @toggle-morning-push="toggleMorningPush"
        @set-morning-push-time="setMorningPushTime"
      />

      <!-- 3. 生活动态视图 -->
      <DynamicsView
        v-else-if="activeTab === 'dynamics'"
        :key="'dynamics'"
        :moments="moments"
        :schedules="schedules"
        :userNickname="session.nickname"
        :userAvatar="session.avatar"
        @open-publish-modal="openPublishModal"
      />

      <!-- 4. 个人中心视图 -->
      <ProfileView
        v-else-if="activeTab === 'profile'"
        :key="'profile'"
        :session="session"
        :schedules="schedules"
        :momentsCount="moments.length"
        @open-auth-modal="openAuthModal"
        @open-profile-modal="openProfileModal"
        @open-about-modal="showAboutModal = true"
        @delete-account="handleDeleteAccount"
        @logout="handleLogout"
      />

      </Transition>
    </view>

    <!-- ========================================================================== -->
    <!-- 底部固定大导航栏 (公共) -->
    <!-- ========================================================================== -->
    <view class="tab-bar">
      <view class="tab-item" :class="{'tab-active': activeTab === 'calendar'}" @click="activeTab = 'calendar'">
        <text class="tab-icon">📅</text>
        <text class="tab-text">日历</text>
      </view>
      <view class="tab-item" :class="{'tab-active': activeTab === 'reminders'}" @click="activeTab = 'reminders'">
        <text class="tab-icon">🔔</text>
        <text class="tab-text">提醒</text>
      </view>
      <view class="tab-item" :class="{'tab-active': activeTab === 'dynamics'}" @click="activeTab = 'dynamics'">
        <text class="tab-icon">📖</text>
        <text class="tab-text">动态</text>
      </view>
      <view class="tab-item" :class="{'tab-active': activeTab === 'profile'}" @click="activeTab = 'profile'">
        <text class="tab-icon">👤</text>
        <text class="tab-text">我的</text>
      </view>
    </view>

    <!-- ========================================================================== -->
    <!-- 模态弹窗组 -->
    <!-- ========================================================================== -->

    <!-- A. 全局 AI 智能日程对话弹窗 -->
    <Transition name="modal">
    <view v-if="showAIModal" class="modal-mask" @click="showAIModal = false">
      <Transition name="slide-up">
      <view class="modal-content ai-chat-modal" @click.stop>
        <view class="ai-chat-header">
          <text class="ai-chat-title">✨ 小日 · 日程助手</text>
          <text class="close-btn" @click="showAIModal = false">×</text>
        </view>

        <!-- 对话消息列表 -->
        <scroll-view class="ai-chat-body" scroll-y :scroll-into-view="'ai-msg-' + (aiMessages.length - 1)">
          <view v-for="(msg, idx) in aiMessages" :key="idx" :id="'ai-msg-' + idx" class="ai-msg-wrapper">
            <!-- AI 消息 -->
            <view v-if="msg.role === 'assistant'" class="ai-msg ai-msg-assistant">
              <view class="ai-msg-avatar">🤖</view>
              <view class="ai-msg-bubble">
                <text class="ai-msg-text">{{ msg.content }}</text>
                <!-- 日程提案卡片 -->
                <view v-if="msg.proposal" class="ai-proposal-card">
                  <view class="proposal-header">📋 日程提案</view>
                  <view class="proposal-field">
                    <text class="proposal-label">标题</text>
                    <input v-model="msg.proposal.title" class="proposal-input" />
                  </view>
                  <view class="proposal-row">
                    <view class="proposal-field flex-1">
                      <text class="proposal-label">日期</text>
                      <input type="date" v-model="msg.proposal.date" class="native-picker" readonly @click="showPicker" />
                    </view>
                    <view class="proposal-field flex-1">
                      <text class="proposal-label">时间</text>
                      <input type="time" v-model="msg.proposal.time" class="native-picker" readonly @click="showPicker" />
                    </view>
                  </view>
                  <view class="proposal-field">
                    <text class="proposal-label">地点</text>
                    <input v-model="msg.proposal.location" class="proposal-input" placeholder="选填" />
                  </view>
                  <view class="proposal-row">
                    <view class="proposal-field flex-1">
                      <text class="proposal-label">优先级</text>
                      <view class="priority-options">
                        <text class="p-opt" :class="{'p-active': msg.proposal.priority === 1}" @click="msg.proposal.priority = 1">低</text>
                        <text class="p-opt" :class="{'p-active': msg.proposal.priority === 2}" @click="msg.proposal.priority = 2">中</text>
                        <text class="p-opt" :class="{'p-active': msg.proposal.priority === 3}" @click="msg.proposal.priority = 3">高</text>
                      </view>
                    </view>
                  </view>
                  <view style="display:flex; gap:8px; margin-top:10px;">
                    <button class="proposal-btn proposal-btn-add" @click="acceptProposal(idx)">✓ 添加到日历</button>
                    <button class="proposal-btn proposal-btn-ignore" @click="dismissProposal(idx)">忽略</button>
                  </view>
                </view>
              </view>
            </view>
            <!-- 用户消息 -->
            <view v-else class="ai-msg ai-msg-user">
              <view class="ai-msg-bubble user-bubble">
                <text class="ai-msg-text user-text">{{ msg.content }}</text>
              </view>
            </view>
          </view>

          <!-- 输入中提示 -->
          <view v-if="aiLoading" class="ai-msg ai-msg-assistant">
            <view class="ai-msg-avatar">🤖</view>
            <view class="ai-msg-bubble ai-typing">
              <text class="ai-dot">●</text><text class="ai-dot">●</text><text class="ai-dot">●</text>
            </view>
          </view>
        </scroll-view>

        <!-- 底部输入区 -->
        <view class="ai-chat-footer">
          <view class="ai-chat-input-row">
            <view class="ai-chat-mic" :class="{'mic-recording': isRecording}" @click="simulateVoiceInput">
              <text>{{ isRecording ? '🔴' : '🎤' }}</text>
            </view>
            <input
              v-model="aiInput"
              class="ai-chat-input"
              placeholder="说说你的日程安排..."
              :disabled="aiLoading"
              @confirm="sendAiMessage"
            />
            <view class="ai-chat-send" :class="{'send-active': aiInput.trim() && !aiLoading}" @click="sendAiMessage">
              <text>↑</text>
            </view>
          </view>
        </view>
      </view>
      </Transition>
    </view>
    </Transition>

    <!-- B. 全局常规新建日程弹窗 -->
    <Transition name="modal">
    <view v-if="showAddModal" class="modal-mask" @click="showAddModal = false">
      <Transition name="slide-up">
      <view class="modal-content add-modal" @click.stop>
        <view class="add-header">
          <text class="btn-cancel" @click="showAddModal = false">取消</text>
          <text class="add-modal-title">{{ isEditingSchedule ? '编辑日程' : '新建日程' }}</text>
          <text class="btn-save" @click="saveGeneralSchedule">保存</text>
        </view>
        <view class="add-form">
          <input type="text" placeholder="准备做什么？" class="input-title" v-model="newScheduleTitle" />
          <view class="form-row">
            <text class="row-icon">📅</text>
            <input type="date" v-model="newScheduleDate" class="native-picker" readonly @click="showPicker" />
            <input type="time" v-model="newScheduleTime" class="native-picker" readonly @click="showPicker" />
          </view>
          <view class="form-row">
            <text class="row-icon">📁</text>
            <view class="category-options">
              <text
                class="opt-badge"
                v-for="category in categories"
                :key="category.id"
                :class="{'opt-active': newScheduleCategoryId === category.id}"
                @click="newScheduleCategoryId = category.id"
              >{{ category.name }}</text>
            </view>
          </view>
          <view class="form-row">
            <text class="row-icon">⭐</text>
            <view class="category-options">
              <text class="opt-badge" :class="{'opt-active': newSchedulePriority === 1}" @click="newSchedulePriority = 1">低</text>
              <text class="opt-badge" :class="{'opt-active': newSchedulePriority === 2}" @click="newSchedulePriority = 2">中</text>
              <text class="opt-badge" :class="{'opt-active': newSchedulePriority === 3}" @click="newSchedulePriority = 3">高</text>
            </view>
          </view>
          <view class="form-row">
            <text class="row-icon">⏰</text>
            <input type="time" v-model="newScheduleRemindTime" class="native-picker" readonly @click="showPicker" />
          </view>
          <view class="form-row">
            <text class="row-icon">📍</text>
            <input type="text" placeholder="地点（可选）" class="row-text" v-model="newScheduleLocation" />
          </view>
          <textarea placeholder="添加备注..." class="form-textarea" v-model="newScheduleRemark"></textarea>
          <view v-if="isEditingSchedule" class="modal-btn-group">
            <button class="btn-secondary" @click="removeSchedule(editingScheduleId); showAddModal = false">删除</button>
          </view>
        </view>
      </view>
      </Transition>
    </view>
    </Transition>

    <!-- C. 发布生活动态弹窗 -->
    <Transition name="modal">
    <view v-if="showPublishModal" class="modal-mask" @click="showPublishModal = false">
      <Transition name="slide-up">
      <view class="modal-content add-modal" @click.stop>
        <view class="add-header">
          <text class="btn-cancel" @click="showPublishModal = false">取消</text>
          <text class="add-modal-title">写动态</text>
          <text class="btn-save" @click="saveNewDynamic">发布</text>
        </view>
        <view class="add-form">
          <textarea placeholder="记录今天的生活碎片吧..." class="form-textarea" v-model="newDynamicText" style="height: 160px;"></textarea>

          <!-- 日期选择 -->
          <view class="form-row">
            <text class="row-icon">📅</text>
            <input type="date" v-model="newDynamicDate" class="native-picker" readonly @click="showPicker" />
          </view>

          <!-- 图片选择区 -->
          <view class="image-picker-area">
            <view class="image-preview-grid">
              <view class="image-preview-item" v-for="(img, idx) in newDynamicImages" :key="idx">
                <image :src="img" mode="aspectFill" class="preview-img" @error="(e) => { e.target.style.display = 'none'; }" />
                <view class="img-remove-btn" @click="removeDynamicImage(idx)">×</view>
              </view>
              <view v-if="newDynamicImages.length < 9" class="image-add-btn" @click="chooseDynamicImages">
                <text class="add-icon">📷</text>
                <text class="add-text">{{ newDynamicImages.length }}/9</text>
              </view>
            </view>
          </view>

          <!-- 日程挂载选项 -->
          <view class="form-row">
            <text class="row-icon">📎</text>
            <view class="schedule-selector" @click="toggleSelectRelation">
              <text class="row-text" v-if="!relatedScheduleSelected">关联{{ newDynamicDate === todayKey ? '今日' : '当天' }}日程</text>
              <text class="row-text text-blue" v-else>已关联: {{ scheduleTitleById[relatedScheduleSelected] || '已删除日程' }}</text>
            </view>
          </view>
          <view class="schedule-list" v-if="publishDateTasks.length">
            <view
              class="schedule-item"
              v-for="task in publishDateTasks"
              :key="task.id"
              :class="{'schedule-item-active': relatedScheduleSelected === task.id}"
              @click="relatedScheduleSelected = relatedScheduleSelected === task.id ? '' : task.id"
            >
              <text class="schedule-item-title">{{ task.title }}</text>
              <text class="schedule-item-time">{{ task.time }}</text>
            </view>
          </view>
          <view v-else-if="newDynamicDate" style="padding:8px 0;">
            <text style="font-size:12px; color:#9ca3af;">{{ newDynamicDate === todayKey ? '今' : '当' }}天暂无日程</text>
          </view>
        </view>
      </view>
    </Transition>
    </view>
    </Transition>

    <!-- D. 登录/注册弹窗 -->
    <Transition name="modal">
    <view v-if="showAuthModal" class="modal-mask" @click="showAuthModal = false">
      <Transition name="slide-up">
      <view class="modal-content add-modal" @click.stop>
        <view class="add-header">
          <text class="btn-cancel" @click="showAuthModal = false">取消</text>
          <text class="add-modal-title">{{ authMode === 'register' ? '注册' : '登录' }}</text>
          <text class="btn-save" @click="submitAuth">{{ authLoading ? '处理中...' : '提交' }}</text>
        </view>
        <view class="add-form">
          <view class="auth-form">
            <input type="text" v-model="authEmail" placeholder="请输入邮箱" class="input-title" style="font-size:16px; height:44px;" />
            <input type="password" v-model="authPassword" placeholder="请输入密码（至少6位）" class="input-title" style="font-size:16px; height:44px; margin-top:12px;" />
            <input v-if="authMode === 'register'" type="text" v-model="authNickname" placeholder="昵称（选填，默认为邮箱前缀）" class="input-title" style="font-size:16px; height:44px; margin-top:12px;" />
            <template v-if="authMode === 'register'">
              <textarea v-model="authBio" placeholder="个人简介（选填，如：一名热爱生活的大学生）" style="width:100%;height:60px;margin-top:12px;background:var(--color-bg-input);border-radius:var(--radius-md);padding:10px;font-size:14px;box-sizing:border-box;" />
              <textarea v-model="authGoals" placeholder="近期目标（选填，如：通过英语六级, 完成毕业设计）" style="width:100%;height:60px;margin-top:8px;background:var(--color-bg-input);border-radius:var(--radius-md);padding:10px;font-size:14px;box-sizing:border-box;" />
              <input type="text" v-model="authSkills" placeholder="技能标签（选填，如：Python, 摄影, 日语）" class="input-title" style="font-size:14px; height:40px; margin-top:8px;" />
              <input type="text" v-model="authInterests" placeholder="兴趣爱好（选填，如：跑步, 阅读, 音乐）" class="input-title" style="font-size:14px; height:40px; margin-top:8px;" />
            </template>
            <view v-if="authError" style="margin-top:12px; padding:10px; background:#FEF2F2; border-radius:8px; border:1px solid #FCA5A5;">
              <text style="color:#DC2626; font-size:13px;">{{ authError }}</text>
            </view>
            <view style="margin-top:20px;">
              <button class="btn-primary" style="width:100%;" @click="submitAuth">{{ authLoading ? '处理中...' : (authMode === 'register' ? '注册' : '登录') }}</button>
            </view>
            <view style="margin-top:16px; text-align:center;">
              <text style="color:#3B82F6; font-size:14px;" @click="authMode = authMode === 'login' ? 'register' : 'login'">
                {{ authMode === 'login' ? '没有账号？去注册' : '已有账号？去登录' }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </Transition>
    </view>
    </Transition>

    <!-- E. 编辑个人资料弹窗 -->
    <Transition name="modal">
    <view v-if="showProfileModal" class="modal-mask" @click="showProfileModal = false">
      <Transition name="slide-up">
      <view class="modal-content add-modal" @click.stop>
        <view class="add-header">
          <text class="btn-cancel" @click="showProfileModal = false">取消</text>
          <text class="add-modal-title">编辑个人资料</text>
          <text class="btn-save" @click="saveProfile">{{ profileLoading ? '保存中...' : '保存' }}</text>
        </view>
        <view class="add-form" style="align-items:center;">
          <!-- 头像编辑 -->
          <view class="profile-avatar-edit" @click="chooseAvatar">
            <image v-if="editAvatar" :src="editAvatar" mode="aspectFill" class="profile-avatar-img" @error="(e) => { e.target.style.display = 'none'; }" />
            <text v-else class="profile-avatar-placeholder">{{ editNickname ? editNickname.charAt(0) : '👤' }}</text>
            <view class="profile-avatar-overlay">
              <text>更换头像</text>
            </view>
          </view>
          <!-- 昵称编辑 -->
          <view style="width:100%; margin-top:20px;">
            <text style="font-size:13px; color:#64748b;">昵称</text>
            <input type="text" v-model="editNickname" placeholder="请输入昵称" class="input-title" style="font-size:16px; height:44px; margin-top:6px;" />
          </view>
          <view style="width:100%; margin-top:16px;">
            <text style="font-size:13px; color:#64748b;">个人简介</text>
            <textarea v-model="editBio" placeholder="介绍一下自己吧" style="width:100%;height:60px;margin-top:6px;background:var(--color-bg-input);border-radius:var(--radius-md);padding:10px;font-size:14px;box-sizing:border-box;" />
          </view>
          <view style="width:100%; margin-top:16px;">
            <text style="font-size:13px; color:#64748b;">近期目标</text>
            <textarea v-model="editGoals" placeholder="如：通过英语六级, 完成毕业设计" style="width:100%;height:60px;margin-top:6px;background:var(--color-bg-input);border-radius:var(--radius-md);padding:10px;font-size:14px;box-sizing:border-box;" />
          </view>
          <view style="width:100%; margin-top:16px;">
            <text style="font-size:13px; color:#64748b;">技能标签</text>
            <input type="text" v-model="editSkills" placeholder="如：Python, 摄影, 日语" class="input-title" style="font-size:14px; height:40px; margin-top:6px;" />
          </view>
          <view style="width:100%; margin-top:16px;">
            <text style="font-size:13px; color:#64748b;">兴趣爱好</text>
            <input type="text" v-model="editInterests" placeholder="如：跑步, 阅读, 音乐" class="input-title" style="font-size:14px; height:40px; margin-top:6px;" />
          </view>
        </view>
      </view>
      </Transition>
    </view>
    </Transition>

    <!-- F. 关于弹窗 -->
    <Transition name="modal">
    <view v-if="showAboutModal" class="modal-mask" @click="showAboutModal = false">
      <Transition name="slide-up">
      <view class="modal-content add-modal" @click.stop>
        <view class="add-header">
          <text class="btn-cancel" @click="showAboutModal = false">关闭</text>
          <text class="add-modal-title">关于有序日常</text>
          <text></text>
        </view>
        <view style="padding:24px;text-align:center;">
          <text style="font-size:48px;display:block;margin-bottom:12px;">📋</text>
          <text style="font-size:20px;font-weight:700;color:#1f2937;display:block;margin-bottom:4px;">有序日常 v2.2</text>
          <text style="font-size:13px;color:#9ca3af;display:block;margin-bottom:20px;">Orderly Daily Life</text>
          <view style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:12px;">
            <text style="font-size:14px;color:#4b5563;line-height:1.8;">
              集智能日程管理、定时提醒、私密生活记录、AI智能辅助于一体的轻量化综合生活管理工具。
            </text>
          </view>
          <text style="font-size:12px;color:#9ca3af;">© 2026 有序日常 · 个人开发团队</text>
        </view>
      </view>
      </Transition>
    </view>
    </Transition>

    <!-- G. 新用户引导弹窗 -->
    <Transition name="modal">
    <view v-if="showOnboarding" class="modal-mask" @click="showOnboarding = false">
      <view class="modal-content add-modal" @click.stop style="overflow-y:auto;">
        <view class="add-header">
          <text class="add-modal-title">🎉 欢迎加入有序日常</text>
          <text class="btn-save" @click="showOnboarding = false">开始使用</text>
        </view>
        <view style="padding:0 4px 20px;">
          <view class="onboarding-card">
            <text class="onboarding-emoji">📅</text>
            <view class="onboarding-text">
              <text class="onboarding-title">日历管理</text>
              <text class="onboarding-desc">在日历标签页查看日程，点击任意日期快速添加新任务，支持天/周/月三种视图自由切换</text>
            </view>
          </view>
          <view class="onboarding-card">
            <text class="onboarding-emoji">🔔</text>
            <view class="onboarding-text">
              <text class="onboarding-title">智能提醒</text>
              <text class="onboarding-desc">为重要日程设置提醒时间，每日早晨推送当日待办清单，时间轴展示让你不再遗漏任何事</text>
            </view>
          </view>
          <view class="onboarding-card">
            <text class="onboarding-emoji">✍️</text>
            <view class="onboarding-text">
              <text class="onboarding-title">生活动态</text>
              <text class="onboarding-desc">记录学习和生活的点滴成长，支持图文发布、日程关联，仅自己可见的私密空间</text>
            </view>
          </view>
          <view class="onboarding-card">
            <text class="onboarding-emoji">🤖</text>
            <view class="onboarding-text">
              <text class="onboarding-title">AI 小助手</text>
              <text class="onboarding-desc">日历页右下角蓝色FAB按钮唤醒AI，用自然语言描述即可自动生成日程。比如"明天下午3点去图书馆复习"</text>
            </view>
          </view>
          <view class="onboarding-card">
            <text class="onboarding-emoji">📋</text>
            <view class="onboarding-text">
              <text class="onboarding-title">成长简历</text>
              <text class="onboarding-desc">在"我的"页面查看AI为你生成的个人成长档案，记录技能积累和成就亮点。先完善个人资料效果更好哦～</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    </Transition>

  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { toDateKey, addDays } from '../../services/date'
import {
  getState,
  addSchedule,
  updateSchedule as updateScheduleLocal,
  deleteSchedule as deleteScheduleLocal,
  toggleScheduleCompleted,
  addMoment as addMomentLocal,
  updateSettings,
  updateState,
  setSession as setSessionLocal,
  clearSession
} from '../../services/storage'
import * as api from '../../services/api'
import CalendarView from '../../components/views/CalendarView.vue'
import ReminderView from '../../components/views/ReminderView.vue'
import DynamicsView from '../../components/views/DynamicsView.vue'
import ProfileView from '../../components/views/ProfileView.vue'

const appState = ref(getState())

const refreshState = () => {
  appState.value = getState()
}

const session = computed(() => appState.value.session)
const categories = computed(() => appState.value.categories)
const schedules = computed(() => appState.value.schedules)
const moments = computed(() => {
  const arr = [...appState.value.moments]
  arr.sort((a, b) => {
    const da = `${a.date}T${a.time || '00:00'}`
    const db = `${b.date}T${b.time || '00:00'}`
    return db.localeCompare(da) // 降序：最新在前
  })
  return arr
})
const settings = computed(() => appState.value.settings)

const todayKey = toDateKey(new Date())

const isLoggedIn = () => !session.value.isGuest && session.value.token

const loadServerData = async (isNewUser = false) => {
  if (session.value.isGuest || !session.value.token) return
  try {
    // Sync profile
    api.fetchProfile().then(profile => {
      if (profile) {
        updateState(state => {
          state.session.nickname = profile.nickname || state.session.nickname || ''
          state.session.avatar = profile.avatar || state.session.avatar || ''
          state.session.bio = profile.bio || state.session.bio || ''
          state.session.goals = profile.goals || state.session.goals || ''
          state.session.skills = profile.skills || state.session.skills || ''
          state.session.interests = profile.interests || state.session.interests || ''
          return state
        })
        refreshState()
      }
    }).catch(() => {})

    const [serverSchedules, serverMoments] = await Promise.all([
      api.fetchSchedules(),
      api.fetchMoments()
    ])

    if (isNewUser) {
      // New registration: server is empty, clear local seed data entirely
      updateState(state => {
        state.schedules = []
        state.moments = []
        return state
      })
    } else {
      // Existing user login: merge server + local-only data
      if (serverSchedules) {
        const serverMapped = serverSchedules.map(s => ({
          id: String(s.id),
          title: s.title,
          date: s.date,
          time: s.time,
          categoryId: s.categoryId,
          priority: s.priority,
          remark: s.remark || '',
          location: s.location || '',
          completed: Boolean(s.completed),
          remindAt: s.remindAt || null
        }))
        updateState(state => {
          const serverIds = new Set(serverMapped.map(s => s.id))
          const localOnly = state.schedules.filter(s => !serverIds.has(s.id))
          state.schedules = [...serverMapped, ...localOnly].sort((a, b) => {
            const da = `${a.date}T${a.time || '00:00'}`
            const db = `${b.date}T${b.time || '00:00'}`
            return db.localeCompare(da)
          })
          return state
        })
      }
      if (serverMoments) {
        const serverMapped = serverMoments.map(m => ({
          id: String(m.id),
          content: m.content,
          date: m.date,
          time: m.time,
          relatedScheduleId: m.relatedScheduleId ? String(m.relatedScheduleId) : null,
          imageUrls: m.imageUrls || []
        }))
        updateState(state => {
          const serverIds = new Set(serverMapped.map(m => m.id))
          const localOnly = state.moments.filter(m => !serverIds.has(m.id))
          state.moments = [...serverMapped, ...localOnly].sort((a, b) => {
            const da = `${a.date}T${a.time || '00:00'}`
            const db = `${b.date}T${b.time || '00:00'}`
            return db.localeCompare(da)
          })
          return state
        })
      }
    }
    refreshState()
  } catch (e) {
    console.error('Failed to load server data:', e)
  }
}

// Tab 切换
const activeTab = ref('calendar')

// 弹窗状态
const showAIModal = ref(false)
const showAddModal = ref(false)
const showPublishModal = ref(false)
const showAuthModal = ref(false)
const showProfileModal = ref(false)
const showAboutModal = ref(false)
const showOnboarding = ref(false)

// AI 对话状态
const aiMessages = ref([])
const aiInput = ref('')
const aiLoading = ref(false)
const isRecording = ref(false)

// 日程表单状态
const editingScheduleId = ref(null)
const newScheduleTitle = ref('')
const newScheduleDate = ref(todayKey)
const newScheduleTime = ref('09:00')
const newScheduleCategoryId = ref(null)
const newSchedulePriority = ref(1)
const newScheduleRemark = ref('')
const newScheduleLocation = ref('')
const newScheduleRemindTime = ref('')

// 动态表单状态
const newDynamicText = ref('')
const newDynamicImages = ref([])
const newDynamicDate = ref(todayKey)
const relatedScheduleSelected = ref('')

// 登录状态
const authMode = ref('login')
const authLoading = ref(false)
const authEmail = ref('')
const authPassword = ref('')
const authNickname = ref('')
const authBio = ref('')
const authGoals = ref('')
const authSkills = ref('')
const authInterests = ref('')
const authError = ref('')

// 个人资料编辑状态
const editNickname = ref('')
const editAvatar = ref('')
const editBio = ref('')
const editGoals = ref('')
const editSkills = ref('')
const editInterests = ref('')
const profileLoading = ref(false)

const isEditingSchedule = computed(() => Boolean(editingScheduleId.value))

const todayTasks = computed(() =>
  schedules.value.filter((t) => t.date === todayKey)
)

const publishDateTasks = computed(() =>
  schedules.value.filter((t) => t.date === newDynamicDate.value)
)

const scheduleTitleById = computed(() => {
  const map = {}
  schedules.value.forEach((schedule) => {
    map[schedule.id] = schedule.title
  })
  return map
})

// 弹窗控制方法
const resetScheduleForm = (dateKey = todayKey) => {
  newScheduleTitle.value = ''
  newScheduleDate.value = dateKey
  newScheduleTime.value = '09:00'
  newScheduleCategoryId.value = categories.value[0]?.id || null
  newSchedulePriority.value = 1
  newScheduleRemark.value = ''
  newScheduleLocation.value = ''
  newScheduleRemindTime.value = ''
}

const showPicker = (e) => {
  e.target.showPicker?.()
}

const openAIModal = () => {
  aiMessages.value = []
  aiInput.value = ''
  showAIModal.value = true
  // AI initiates the conversation
  sendAiMessage(true)
}

const openAddModal = (dateKey) => {
  editingScheduleId.value = null
  resetScheduleForm(dateKey || todayKey)
  showAddModal.value = true
}

const openEditModal = (schedule) => {
  editingScheduleId.value = schedule.id
  newScheduleTitle.value = schedule.title
  newScheduleDate.value = schedule.date
  newScheduleTime.value = schedule.time
  newScheduleCategoryId.value = schedule.categoryId
  newSchedulePriority.value = schedule.priority
  newScheduleRemark.value = schedule.remark || ''
  newScheduleLocation.value = schedule.location || ''
  newScheduleRemindTime.value = schedule.remindAt || ''
  showAddModal.value = true
}

const openPublishModal = () => {
  newDynamicText.value = ''
  newDynamicImages.value = []
  newDynamicDate.value = todayKey
  relatedScheduleSelected.value = ''
  showPublishModal.value = true
}

const chooseDynamicImages = () => {
  const remain = 9 - newDynamicImages.value.length
  if (remain <= 0) return
  uni.chooseImage({
    count: remain,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      newDynamicImages.value = [...newDynamicImages.value, ...res.tempFilePaths]
    }
  })
}

const removeDynamicImage = (idx) => {
  newDynamicImages.value = newDynamicImages.value.filter((_, i) => i !== idx)
}

const openAuthModal = (mode) => {
  authMode.value = mode || 'login'
  authEmail.value = ''
  authPassword.value = ''
  authNickname.value = ''
  authBio.value = ''
  authGoals.value = ''
  authSkills.value = ''
  authInterests.value = ''
  authError.value = ''
  showAuthModal.value = true
}

const openProfileModal = () => {
  editNickname.value = session.value.nickname || ''
  editAvatar.value = session.value.avatar || ''
  editBio.value = session.value.bio || ''
  editGoals.value = session.value.goals || ''
  editSkills.value = session.value.skills || ''
  editInterests.value = session.value.interests || ''
  showProfileModal.value = true
}

const chooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const filePath = res.tempFilePaths[0]
      // In H5, blob URLs expire on refresh — convert to base64 for persistence
      let persistentUrl = filePath
      if (filePath.startsWith('blob:')) {
        persistentUrl = await api.blobToBase64(filePath)
      }

      // Try to upload to server if logged in
      if (isLoggedIn()) {
        try {
          const result = await api.uploadImage(filePath)
          editAvatar.value = result.url
          return
        } catch (e) {}
      }
      editAvatar.value = persistentUrl
    }
  })
}

const saveProfile = async () => {
  profileLoading.value = true
  try {
    if (isLoggedIn()) {
      await api.updateProfile({
        nickname: editNickname.value,
        avatar: editAvatar.value,
        bio: editBio.value,
        goals: editGoals.value,
        skills: editSkills.value,
        interests: editInterests.value
      })
    }
    updateState(state => {
      state.session.nickname = editNickname.value
      state.session.avatar = editAvatar.value
      state.session.bio = editBio.value
      state.session.goals = editGoals.value
      state.session.skills = editSkills.value
      state.session.interests = editInterests.value
      return state
    })
    refreshState()
    showProfileModal.value = false
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (err) {
    uni.showToast({ title: err.message || '保存失败', icon: 'none' })
  } finally {
    profileLoading.value = false
  }
}

// 业务操作方法
const toggleTask = async (task) => {
  try {
    if (isLoggedIn()) {
      await api.updateSchedule(task.id, { completed: !task.completed })
    }
    toggleScheduleCompleted(task.id)
    refreshState()
    uni.showToast({
      title: task.completed ? '已重置事项' : '已完成事项',
      icon: 'none'
    })
  } catch (err) {
    uni.showToast({ title: err.message || '操作失败', icon: 'none' })
  }
}

const sendAiMessage = async (isInit = false) => {
  // When called from @click event, the first argument is the Event object, not a boolean
  if (typeof isInit !== 'boolean') isInit = false
  const text = isInit ? '' : aiInput.value.trim()
  if (!isInit && !text) return

  if (!isInit) {
    aiMessages.value.push({ role: 'user', content: text })
    aiInput.value = ''
  }

  aiLoading.value = true

  const apiMessages = aiMessages.value.map(m => ({ role: m.role, content: m.content }))

  try {
    const data = await api.aiChat({
      messages: apiMessages,
      schedules: schedules.value.map(s => ({
        date: s.date,
        time: s.time,
        title: s.title,
        location: s.location || '',
        completed: s.completed
      }))
    })

    const aiMsg = { role: 'assistant', content: data.reply, proposal: data.proposal || null }
    aiMessages.value.push(aiMsg)
  } catch (err) {
    const errMsg = err?.message || '网络似乎有问题'
    aiMessages.value.push({
      role: 'assistant',
      content: `抱歉，${errMsg}，请稍后再试～`,
      proposal: null
    })
  } finally {
    aiLoading.value = false
  }
}

const acceptProposal = async (msgIdx) => {
  const msg = aiMessages.value[msgIdx]
  if (!msg || !msg.proposal) return

  const p = msg.proposal
  const payload = {
    title: p.title || '新日程',
    date: p.date || todayKey,
    time: p.time || '09:00',
    priority: p.priority || 2,
    remark: p.remark || '',
    location: p.location || ''
  }

  try {
    if (isLoggedIn()) {
      const result = await api.createSchedule(payload)
      payload.id = String(result.id)
      addSchedule({ ...payload, completed: false, categoryId: null })
    } else {
      addSchedule(payload)
    }
    refreshState()
    msg.proposal = null
    aiMessages.value.push({
      role: 'assistant',
      content: '已添加「' + p.title + '」到日历 📅 你可以在日历页查看～还有其他安排吗？',
      proposal: null
    })
  } catch (err) {
    uni.showToast({ title: err.message || '添加失败', icon: 'none' })
  }
}

const dismissProposal = (msgIdx) => {
  aiMessages.value[msgIdx].proposal = null
}

const simulateVoiceInput = () => {
  // #ifdef H5
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (SpeechRecognition) {
    if (isRecording.value) {
      isRecording.value = false
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.interimResults = false
    recognition.continuous = false

    isRecording.value = true
    uni.showToast({ title: '正在聆听...', icon: 'none', duration: 3000 })

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      aiInput.value = (aiInput.value ? aiInput.value + ' ' : '') + transcript
      isRecording.value = false
      uni.showToast({ title: '已识别', icon: 'success' })
      // Auto-send after voice input
      setTimeout(() => sendAiMessage(), 300)
    }

    recognition.onerror = (event) => {
      isRecording.value = false
      console.error('Speech error:', event.error)
      uni.showToast({ title: '语音识别失败，请手动输入', icon: 'none' })
    }

    recognition.onend = () => {
      isRecording.value = false
    }

    recognition.start()
    return
  }
  // #endif
  uni.showToast({ title: '语音功能需在H5环境使用', icon: 'none' })
}

const saveGeneralSchedule = async () => {
  if (!newScheduleTitle.value.trim()) {
    uni.showToast({ title: '请输入日程标题', icon: 'none' })
    return
  }

  const payload = {
    title: newScheduleTitle.value,
    date: newScheduleDate.value,
    time: newScheduleTime.value,
    categoryId: newScheduleCategoryId.value,
    priority: newSchedulePriority.value,
    remark: newScheduleRemark.value,
    location: newScheduleLocation.value,
    remindAt: newScheduleRemindTime.value || null
  }

  try {
    if (isEditingSchedule.value) {
      if (isLoggedIn()) {
        await api.updateSchedule(editingScheduleId.value, { ...payload, completed: false })
      }
      updateScheduleLocal(editingScheduleId.value, payload)
    } else {
      if (isLoggedIn()) {
        const result = await api.createSchedule(payload)
        payload.id = String(result.id)
        addSchedule({ ...payload, completed: false })
      } else {
        addSchedule(payload)
      }
    }
    refreshState()
    showAddModal.value = false
    editingScheduleId.value = null
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (err) {
    uni.showToast({ title: err.message || '保存失败', icon: 'none' })
  }
}

const removeSchedule = async (scheduleId) => {
  try {
    if (isLoggedIn()) {
      await api.deleteSchedule(scheduleId)
    }
    deleteScheduleLocal(scheduleId)
    refreshState()
    uni.showToast({ title: '已删除日程', icon: 'none' })
  } catch (err) {
    uni.showToast({ title: err.message || '删除失败', icon: 'none' })
  }
}

const saveNewDynamic = async () => {
  if (!newDynamicText.value.trim() && !newDynamicImages.value.length) {
    uni.showToast({ title: '请输入动态内容或添加图片', icon: 'none' })
    return
  }

  uni.showLoading({ title: '发布中...' })

  // Convert blob URLs to base64 first (blob URLs expire on refresh)
  let imageUrls = []
  try {
    const converted = await Promise.all(
      newDynamicImages.value.map(async (img) => {
        if (img.startsWith('blob:')) return await api.blobToBase64(img)
        return img
      })
    )

    // If logged in, upload to server for cross-device sync
    if (isLoggedIn() && converted.length) {
      const uploads = await Promise.all(
        converted.map(async (img) => {
          if (img.startsWith('data:') || img.startsWith('blob:')) {
            try {
              const result = await api.uploadImage(img)
              return result.url
            } catch (e) { return img }
          }
          return img
        })
      )
      imageUrls = uploads
    } else {
      imageUrls = converted
    }
  } catch (e) {
    imageUrls = [...newDynamicImages.value]
  }

  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  const payload = {
    content: newDynamicText.value,
    date: newDynamicDate.value,
    time: timeStr,
    relatedScheduleId: (() => { const id = relatedScheduleSelected.value; if (!id) return null; const num = Number(id); return Number.isFinite(num) && num > 0 ? num : null; })(),
    imageUrls
  }
  try {
    if (isLoggedIn()) {
      const result = await api.createMoment(payload)
      payload.id = String(result.id)
      addMomentLocal(payload)
    } else {
      addMomentLocal(payload)
    }
    refreshState()
    showPublishModal.value = false
    uni.showToast({ title: '发布成功', icon: 'success' })
  } catch (err) {
    uni.showToast({ title: err.message || '发布失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const toggleSelectRelation = () => {
  if (relatedScheduleSelected.value) {
    relatedScheduleSelected.value = ''
  } else {
    relatedScheduleSelected.value = todayTasks.value[0]?.id || ''
  }
}

const toggleMorningPush = () => {
  const willEnable = !settings.value.morningPushEnabled
  updateSettings({ morningPushEnabled: willEnable })
  refreshState()
  uni.showToast({
    title: willEnable ? '晨间推送已开启' : '晨间推送已关闭',
    icon: 'none'
  })
}

const setMorningPushTime = (value) => {
  updateSettings({ morningPushTime: value })
  refreshState()
  uni.showToast({ title: `已设置为 ${value}`, icon: 'none' })
}

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        clearSession()
        refreshState()
        uni.showToast({ title: '已退出登录', icon: 'none' })
      }
    }
  })
}

const handleDeleteAccount = async () => {
  if (!isLoggedIn()) return
  uni.showModal({
    title: '最后确认',
    content: '此操作不可撤销！输入"确认注销"以继续删除账号及所有数据。',
    editable: true,
    placeholderText: '请输入确认注销',
    success: async (res) => {
      if (res.confirm && res.content === '确认注销') {
        try {
          await api.deleteAccount()
          clearSession()
          refreshState()
          uni.showToast({ title: '账号已注销', icon: 'none' })
        } catch (err) {
          uni.showToast({ title: err.message || '注销失败', icon: 'none' })
        }
      } else if (res.confirm) {
        uni.showToast({ title: '输入不匹配，已取消注销', icon: 'none' })
      }
    }
  })
}

const submitAuth = async () => {
  if (!authEmail.value.trim()) {
    uni.showToast({ title: '请输入邮箱', icon: 'none' })
    return
  }
  if (!authPassword.value || authPassword.value.length < 6) {
    uni.showToast({ title: '密码至少6位', icon: 'none' })
    return
  }

  authError.value = ''
  authLoading.value = true
  try {
    const isRegister = authMode.value === 'register'
    const payload = { email: authEmail.value.trim(), password: authPassword.value }
    if (isRegister && authNickname.value.trim()) {
      payload.nickname = authNickname.value.trim()
    }

    const fn = isRegister ? api.register : api.login
    if (isRegister) {
      payload.bio = authBio.value.trim()
      payload.goals = authGoals.value.trim()
      payload.skills = authSkills.value.trim()
      payload.interests = authInterests.value.trim()
    }
    const response = await fn(payload)
    setSessionLocal({
      userId: response.user.id,
      token: response.token,
      email: response.user.email,
      nickname: response.user.nickname || '',
      avatar: response.user.avatar || '',
      bio: response.user.bio || '',
      goals: response.user.goals || '',
      skills: response.user.skills || '',
      interests: response.user.interests || ''
    })
    refreshState()
    showAuthModal.value = false
    uni.showToast({ title: isRegister ? '注册成功，欢迎加入有序日常！' : '登录成功', icon: 'success' })
    if (isRegister) {
      showOnboarding.value = true
      loadServerData(true)
    } else {
      loadServerData(false)
    }
  } catch (err) {
    const msg = typeof err === 'string' ? err : (err.message || JSON.stringify(err) || '请求失败')
    authError.value = msg
    uni.showToast({ title: msg, icon: 'none', duration: 4000 })
  } finally {
    authLoading.value = false
  }
}

onMounted(() => {
  loadServerData()
})
</script>

<style scoped>
.app-container {
  height: 100vh; display: flex; flex-direction: column;
  background: var(--glass-bg-page);
  font-family: var(--font-family);
}
.status-bar { height: 8px; width: 100%; background: rgba(255, 255, 255, 0.45); backdrop-filter: var(--glass-blur-xs) var(--glass-saturate); -webkit-backdrop-filter: var(--glass-blur-xs) var(--glass-saturate); }
.main-content { flex: 1; position: relative; display: flex; flex-direction: column; }

/* ==========================================================================
   Bottom Tab Bar — Glass-morphism
   ========================================================================== */
.tab-bar {
  position: fixed; bottom: 0; left: 0; width: 100%; height: 78px;
  background: var(--glass-bg-tab);
  backdrop-filter: var(--glass-blur-lg) var(--glass-saturate);
  -webkit-backdrop-filter: var(--glass-blur-lg) var(--glass-saturate);
  display: flex; justify-content: space-around; align-items: center;
  padding: 0 var(--space-lg) env(safe-area-inset-bottom);
  z-index: var(--z-tab-bar);
  box-shadow: var(--shadow-glass-tab);
}
.tab-item {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 3px; width: 64px; height: 56px;
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
  position: relative;
  transition: all var(--transition-fast);
  cursor: pointer;
}
.tab-item:active { transform: scale(0.92); background: var(--color-bg-hover); }
.tab-active { color: var(--color-primary); }
.tab-active::after {
  content: '';
  position: absolute; bottom: 3px;
  width: 22px; height: 3.5px;
  background: var(--color-primary-gradient);
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(74, 158, 255, 0.40);
}
.tab-icon { font-size: 24px; line-height: 1; transition: transform var(--transition-spring); }
.tab-active .tab-icon { transform: scale(1.1); }
.tab-text {
  font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold);
  letter-spacing: 0.3px;
}

/* ==========================================================================
   Modal System — slide-up animation
   ========================================================================== */
.modal-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(12, 30, 62, 0.48);
  z-index: var(--z-modal);
  display: flex; flex-direction: column; justify-content: flex-end;
}
.modal-content {
  pointer-events: auto;
}
.modal-content {
  background: var(--glass-bg-modal);
  backdrop-filter: var(--glass-blur-xl) var(--glass-saturate);
  -webkit-backdrop-filter: var(--glass-blur-xl) var(--glass-saturate);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  padding: var(--space-xl);
  box-sizing: border-box;
  max-height: 88vh;
  overflow: hidden;
  box-shadow: var(--shadow-glass-modal);
}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }

.close-btn {
  width: 32px; height: 32px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-text-secondary);
  font-size: 18px; font-weight: var(--font-weight-medium);
  display: flex; align-items: center; justify-content: center;
  transition: all var(--transition-fast);
  cursor: pointer;
}
.close-btn:active { background: var(--color-border); transform: scale(0.9); }

.text-blue { color: var(--color-primary); font-weight: var(--font-weight-bold); }
.modal-btn-group { display: flex; gap: var(--space-md); }
.btn-secondary {
  flex: 1; height: 46px; line-height: 46px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: inset 0 0.5px 0 rgba(255, 255, 255, 0.5);
  color: var(--color-text-secondary);
  font-size: var(--font-size-md); font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-md); border: none; text-align: center;
  transition: all var(--transition-fast);
}
.btn-secondary:active { background: rgba(0, 0, 0, 0.08); transform: scale(0.97); }
.btn-primary {
  flex: 1; height: 46px; line-height: 46px;
  background: var(--color-primary-gradient);
  color: var(--color-text-inverse);
  font-size: var(--font-size-md); font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-md); border: none; text-align: center;
  box-shadow: var(--shadow-glass-primary);
  transition: all var(--transition-fast);
}
.btn-primary:active { transform: scale(0.97); box-shadow: 0 2px 6px rgba(74, 158, 255, 0.15); }

/* ==========================================================================
   AI Chat Modal
   ========================================================================== */
.ai-chat-modal { height: 85vh; display: flex; flex-direction: column; }
.ai-chat-header {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: var(--space-md); border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}
.ai-chat-title {
  font-size: var(--font-size-xl); font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.ai-chat-body { flex: 1; overflow-y: auto; padding: var(--space-md) 0; }
.ai-msg-wrapper { margin-bottom: var(--space-md); }
.ai-msg { display: flex; gap: var(--space-sm); max-width: 88%; }
.ai-msg-assistant { align-self: flex-start; }
.ai-msg-user { align-self: flex-end; margin-left: auto; flex-direction: row-reverse; }
.ai-msg-avatar {
  width: 34px; height: 34px; border-radius: var(--radius-full);
  background: var(--color-primary-bg);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
}
.ai-msg-bubble {
  background: rgba(240, 245, 252, 0.70);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-xs);
  padding: var(--space-md) var(--space-lg);
  max-width: 280px;
  box-shadow: var(--shadow-glass-card);
}
.user-bubble {
  background: linear-gradient(135deg, #7DBAFF 0%, #4A9EFF 100%);
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-xs) var(--radius-lg);
  box-shadow: var(--shadow-glass-primary);
}
.ai-msg-text {
  font-size: var(--font-size-base); color: var(--color-text-primary);
  line-height: var(--line-height-relaxed); white-space: pre-wrap; word-break: break-word;
}
.user-text { color: var(--color-text-inverse); }

/* Typing indicator */
.ai-typing {
  display: flex; gap: 5px; align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-xs);
  background: var(--color-bg-hover);
}
.ai-dot {
  width: 7px; height: 7px; border-radius: var(--radius-full);
  background: var(--color-text-muted);
  animation: dotBounce 1.4s ease-in-out infinite;
}
.ai-dot:nth-child(2) { animation-delay: 0.16s; }
.ai-dot:nth-child(3) { animation-delay: 0.32s; }

/* AI Proposal Card */
.ai-proposal-card {
  background: var(--glass-bg-medium);
  backdrop-filter: var(--glass-blur-xs) var(--glass-saturate);
  -webkit-backdrop-filter: var(--glass-blur-xs) var(--glass-saturate);
  border: 1px solid rgba(74, 158, 255, 0.12);
  box-shadow: var(--shadow-glass-card);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-top: var(--space-sm);
}
.proposal-header {
  font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold);
  color: var(--color-primary); margin-bottom: var(--space-sm);
}
.proposal-field { margin-bottom: 6px; }
.proposal-label {
  font-size: var(--font-size-xs); color: var(--color-text-muted);
  display: block; margin-bottom: 2px;
}
.proposal-input {
  font-size: var(--font-size-base); color: var(--color-text-primary);
  height: 32px; border-bottom: 1.5px solid var(--color-border); width: 100%;
}
.proposal-value { font-size: var(--font-size-base); color: var(--color-text-primary); line-height: 32px; }
.proposal-row { display: flex; gap: var(--space-md); }
.flex-1 { flex: 1; }
.priority-options { display: flex; gap: 6px; }
.p-opt {
  padding: 3px 12px; font-size: var(--font-size-sm);
  border-radius: var(--radius-xl); background: var(--color-bg-hover);
  color: var(--color-text-secondary); cursor: pointer;
  transition: all var(--transition-fast);
}
.p-active { background: var(--color-primary); color: var(--color-text-inverse); }
.proposal-btn {
  flex: 1; height: 36px; line-height: 36px;
  font-size: var(--font-size-sm); font-weight: var(--font-weight-medium);
  border-radius: var(--radius-sm); border: none; text-align: center;
  transition: all var(--transition-fast);
}
.proposal-btn:active { transform: scale(0.96); }
.proposal-btn-add { background: var(--color-primary-gradient); color: var(--color-text-inverse); }
.proposal-btn-ignore { background: var(--color-bg-hover); color: var(--color-text-muted); }

/* AI Chat Footer */
.ai-chat-footer { flex-shrink: 0; border-top: 1px solid var(--color-border-light); padding-top: var(--space-sm); }
.ai-chat-input-row { display: flex; align-items: center; gap: var(--space-sm); }
.ai-chat-mic {
  width: 38px; height: 38px; border-radius: var(--radius-full);
  background: var(--color-bg-hover);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
  transition: all var(--transition-fast);
  cursor: pointer;
}
.ai-chat-mic:active { transform: scale(0.9); }
.mic-recording {
  background: var(--color-danger-bg);
  box-shadow: 0 0 0 3px rgba(239,68,68,0.25);
  animation: pulse-ring 1.2s infinite;
}
.ai-chat-input {
  flex: 1; height: 38px;
  background: rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 0.5px solid rgba(255, 255, 255, 0.5);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.04);
  border-radius: 19px; padding: 0 var(--space-lg);
  font-size: var(--font-size-base); color: var(--color-text-primary);
}
.ai-chat-send {
  width: 38px; height: 38px; border-radius: var(--radius-full);
  background: var(--color-border);
  color: var(--color-text-muted);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: var(--font-weight-bold);
  flex-shrink: 0;
  transition: all var(--transition-spring);
  cursor: pointer;
}
.send-active {
  background: var(--color-primary-gradient);
  color: var(--color-text-inverse);
  box-shadow: var(--shadow-primary);
  transform: scale(1.05);
}

/* ==========================================================================
   Add / Edit / Publish Modals
   ========================================================================== */
.add-modal { height: 85vh; display: flex; flex-direction: column; }
.add-header {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: var(--space-lg); border-bottom: 1px solid var(--color-border-light);
}
.btn-cancel { color: var(--color-text-muted); font-size: var(--font-size-md); }
.btn-save { color: var(--color-primary); font-size: var(--font-size-md); font-weight: var(--font-weight-bold); }
.add-modal-title {
  font-size: var(--font-size-lg); font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
.add-form { padding-top: var(--space-xl); display: flex; flex-direction: column; gap: var(--space-xl); }
.input-title {
  width: 100%; font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold);
  color: var(--color-text-primary); height: 40px;
}
.form-row { display: flex; align-items: center; gap: var(--space-md); }
.row-icon { font-size: 18px; width: 24px; text-align: center; }
.row-text { font-size: var(--font-size-md); color: var(--color-text-primary); }
.native-picker {
  padding: 10px 14px;
  background: var(--color-bg-input);
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border);
  flex: 1;
  min-width: 0;
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  height: 44px;
  box-sizing: border-box;
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
}
.native-picker::-webkit-calendar-picker-indicator {
  opacity: 0.6;
  cursor: pointer;
}
.native-picker:focus { border-color: var(--color-primary); }
.native-picker[readonly] {
  user-select: none;
  color: var(--color-text-primary);
  background: var(--color-bg-input);
}

.schedule-selector { display: flex; align-items: center; gap: var(--space-sm); }
.schedule-list { display: flex; flex-direction: column; gap: var(--space-sm); }
.schedule-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md); background: var(--color-bg-input);
  border: 1.5px solid var(--color-border);
  transition: all var(--transition-fast);
}
.schedule-item-active { border-color: var(--color-primary); background: var(--color-primary-bg); }
.schedule-item-title { font-size: var(--font-size-sm); color: var(--color-text-primary); font-weight: var(--font-weight-medium); }
.schedule-item-time { font-size: var(--font-size-sm); color: var(--color-text-secondary); }

.category-options { display: flex; gap: var(--space-sm); flex-wrap: wrap; }
.opt-badge {
  padding: 6px 16px; font-size: var(--font-size-sm);
  background: var(--color-bg-hover); color: var(--color-text-secondary);
  border-radius: var(--radius-xl); border: 1.5px solid transparent;
  transition: all var(--transition-fast); cursor: pointer;
  font-weight: var(--font-weight-medium);
}
.opt-active {
  background: var(--color-primary-bg); color: var(--color-primary);
  border-color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.form-textarea {
  width: 100%; height: 120px;
  background: var(--color-bg-input); border-radius: var(--radius-md);
  padding: var(--space-md); box-sizing: border-box;
  font-size: var(--font-size-base); color: var(--color-text-primary);
}

/* Image Picker */
.image-picker-area { margin-top: var(--space-xs); }
.image-preview-grid { display: flex; flex-wrap: wrap; gap: var(--space-sm); }
.image-preview-item {
  width: 72px; height: 72px; border-radius: var(--radius-sm);
  overflow: hidden; position: relative;
}
.preview-img { width: 100%; height: 100%; }
.img-remove-btn {
  position: absolute; top: 2px; right: 2px;
  width: 20px; height: 20px; background: rgba(0,0,0,0.5);
  color: var(--color-text-inverse); border-radius: var(--radius-full);
  text-align: center; line-height: 20px; font-size: 14px;
}
.image-add-btn {
  width: 72px; height: 72px; border-radius: var(--radius-sm);
  border: 1.5px dashed var(--color-border-strong);
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  background: var(--color-bg-hover);
  transition: all var(--transition-fast);
}
.image-add-btn:active { background: var(--color-border-light); }
.add-icon { font-size: 20px; color: var(--color-text-muted); }
.add-text { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 2px; }

/* Auth Form */
.auth-form { width: 100%; }

/* Profile Edit */
.profile-avatar-edit {
  width: 88px; height: 88px; border-radius: var(--radius-full);
  background: var(--color-bg-hover);
  display: flex; justify-content: center; align-items: center;
  position: relative; overflow: hidden;
  cursor: pointer; transition: transform var(--transition-normal);
}
.profile-avatar-edit:active { transform: scale(0.95); }
.profile-avatar-img { width: 100%; height: 100%; border-radius: var(--radius-full); }
.profile-avatar-placeholder { font-size: 40px; }
.profile-avatar-overlay {
  position: absolute; bottom: 0; left: 0; right: 0; height: 28px;
  background: rgba(0,0,0,0.5);
  display: flex; justify-content: center; align-items: center;
}
.profile-avatar-overlay text { color: var(--color-text-inverse); font-size: var(--font-size-sm); }

/* Onboarding Guide */
.onboarding-card {
  display: flex; gap: 14px; align-items: flex-start;
  padding: 16px 0;
  border-bottom: 0.5px solid rgba(0,0,0,0.06);
}
.onboarding-card:last-child { border-bottom: none; }
.onboarding-emoji { font-size: 32px; flex-shrink: 0; width: 40px; text-align: center; }
.onboarding-text { flex: 1; min-width: 0; }
.onboarding-title { font-size: 15px; font-weight: 700; color: #1f2937; display: block; margin-bottom: 4px; }
.onboarding-desc { font-size: 13px; color: #6b7280; line-height: 1.6; }
</style>
