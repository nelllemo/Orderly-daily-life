<template>
  <view class="app-container">
    <!-- 顶部状态栏自适应占位区 -->
    <view class="status-bar"></view>

    <!-- 主内容区：通过 activeTab 决定显示哪个版块 -->
    <view class="main-content">
      
      <!-- ========================================================================== -->
      <!-- 1. 版块：日历视图 -->
      <!-- ========================================================================== -->
      <scroll-view v-if="activeTab === 'calendar'" class="scroll-container" scroll-y>
        <view class="calendar-view">
          <!-- 顶部月份控制区 -->
          <view class="header-control">
            <view class="month-title">
              <text class="title-text">2026年 5月</text>
              <text class="icon-right">></text>
            </view>
            <view class="view-switch">
              <text class="switch-btn">周</text>
              <text class="switch-btn active-switch">月</text>
            </view>
          </view>

          <!-- 日历月视图网格 -->
          <view class="calendar-grid">
            <view class="week-days">
              <text class="day-label" v-for="d in days" :key="d">{{d}}</text>
            </view>
            <view class="dates-grid">
              <!-- 模拟5月前的空白格子 -->
              <view class="empty-cell" v-for="e in 5" :key="'e'+e"></view>
              <!-- 31天日期格子 -->
              <view 
                class="date-cell" 
                :class="{'is-today': date === 15}" 
                v-for="date in dates" 
                :key="date"
                @click="openAddModal"
              >
                <text class="date-num" :class="{'today-num': date === 15}">{{date}}</text>
                <!-- 分类圆角色彩标识展示 -->
                <view class="tags-row">
                  <view v-if="date === 14 || date === 15" class="tag-line bg-main"></view>
                  <view v-if="date === 13 || date === 16" class="tag-line bg-orange"></view>
                  <view v-if="date === 15" class="tag-line bg-green"></view>
                </view>
              </view>
            </view>
          </view>

          <view class="gray-divider"></view>

          <!-- 今日待办列表区域 -->
          <view class="today-section">
            <view class="section-header">
              <text class="section-title">5月15日 今日待办</text>
              <text class="section-sub">{{ todayTasksCount }}项任务</text>
            </view>
            
            <view class="task-list">
              <view class="task-item" v-for="task in todayTasks" :key="task.id">
                <view class="task-check-box" @click="toggleTask(task)">
                  <text v-if="task.completed" class="icon-checked">✓</text>
                  <view v-else class="icon-unchecked"></view>
                </view>
                <view class="task-body">
                  <text class="task-item-title" :class="{'line-through': task.completed}">{{ task.title }}</text>
                  <view class="task-meta">
                    <text class="task-time-tag">{{ task.time }}</text>
                    <text class="category-badge" :style="{ color: task.color, backgroundColor: task.color + '20' }">{{ task.category }}</text>
                  </view>
                </view>
                <view v-if="task.priority === 3" class="priority-line"></view>
              </view>
            </view>
          </view>
        </view>

        <!-- 日历页专属的双悬浮按钮组 -->
        <view class="fab-group">
          <view class="fab-ai" @click="openAIModal">✨</view>
          <view class="fab-add" @click="openAddModal">+</view>
        </view>
      </scroll-view>

      <!-- ========================================================================== -->
      <!-- 2. 版块：提醒中心视图 (原 ReminderView.vue 整合) -->
      <!-- ========================================================================== -->
      <scroll-view v-else-if="activeTab === 'reminders'" class="scroll-container" scroll-y>
        <view class="reminder-view">
          <view class="page-header">
            <text class="page-title">提醒中心</text>
          </view>

          <!-- 晨间推送设置横幅 -->
          <view class="morning-banner">
            <view class="banner-left">
              <text class="icon-bell">🔔</text>
              <text class="banner-text">晨间推送: <text class="text-blue">每天 08:00</text></text>
            </view>
            <view class="switch-ui active-switch" @click="toggleMorningPush">
              <view class="switch-knob" :class="{'knob-off': !morningPushEnabled}"></view>
            </view>
          </view>

          <!-- 时间轴容器 -->
          <view class="timeline-container">
            
            <!-- 今日剩余待办 -->
            <view class="timeline-section">
              <view class="timeline-node node-blue"></view>
              <text class="section-title">今日剩余</text>
              <view class="task-list-timeline">
                <view class="task-card" v-for="task in todayRemainingTasks" :key="task.id">
                  <text class="task-time-left">{{ task.time }}</text>
                  <view class="task-card-content">
                    <view class="task-info">
                      <text class="task-title" :class="{'text-red': task.priority === 3}">{{ task.title }}</text>
                      <view class="task-tag" :style="{ color: task.color, backgroundColor: task.color + '20' }">
                        {{ task.category }}
                      </view>
                    </view>
                    <view class="circle-check" @click="toggleTask(task)"></view>
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
                  <text class="task-date-left">{{ task.date }}</text>
                  <view class="task-card-content">
                    <view class="task-info">
                      <text class="task-title text-gray">{{ task.title }}</text>
                      <text class="task-desc">{{ task.time }}</text>
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
                  <text class="task-date-left text-light-gray">{{ task.date }}</text>
                  <text class="task-title line-through">{{ task.title }}</text>
                </view>
              </view>
            </view>

          </view>
        </view>
      </scroll-view>

      <!-- ========================================================================== -->
      <!-- 3. 版块：生活动态视图 (原 DynamicsView.vue 整合) -->
      <!-- ========================================================================== -->
      <view v-else-if="activeTab === 'dynamics'" class="full-component-container">
        <view class="dynamics-view">
          <!-- 吸顶头部与日期筛选器 -->
          <view class="sticky-header">
            <view class="page-header">
              <text class="page-title">生活动态</text>
            </view>
            
            <!-- 日期横向筛选器 -->
            <scroll-view scroll-x class="date-filter-scroll" :show-scrollbar="false">
              <view class="date-filter-container">
                <view 
                  class="date-btn" 
                  :class="{ 'date-active': activeDate === item.date, 'date-today': item.isToday }"
                  v-for="item in dynamicsDates" 
                  :key="item.date"
                  @click="activeDate = item.date"
                >
                  <text class="date-text">{{ item.isToday ? '今日' : item.date }}</text>
                </view>
              </view>
            </scroll-view>
          </view>

          <!-- 动态时间线列表 -->
          <scroll-view class="dynamics-scroll-area" scroll-y>
            <view class="dynamics-list">
              <view class="dynamic-card" v-for="dyn in filteredDynamics" :key="dyn.id">
                <view class="dyn-header">
                  <text class="dyn-time">{{ dyn.date }} · {{ dyn.time }}</text>
                </view>
                <text class="dyn-content">{{ dyn.text }}</text>
                
                <!-- 图片占位 -->
                <view v-if="dyn.hasImage" class="dyn-image-placeholder">
                  <text class="icon-image">🖼️</text>
                </view>

                <!-- 日程挂载UI -->
                <view v-if="dyn.relatedSchedule" class="dyn-schedule-link">
                  <text class="link-icon">📎</text>
                  <text class="link-text">关联: {{ dyn.relatedSchedule }}</text>
                </view>
              </view>
            </view>
          </scroll-view>

          <!-- 发布悬浮按钮 -->
          <view class="fab-publish" @click="openPublishModal">+</view>
        </view>
      </view>

      <!-- ========================================================================== -->
      <!-- 4. 版块：个人中心视图 (原 ProfileView.vue 整合) -->
      <!-- ========================================================================== -->
      <scroll-view v-else-if="activeTab === 'profile'" class="scroll-container" scroll-y>
        <view class="profile-view">
          <!-- 顶部用户信息 (带底部弧度) -->
          <view class="profile-header">
            <view class="user-info">
              <view class="avatar-box">
                <text class="avatar-icon">👤</text>
              </view>
              <view class="text-info">
                <text class="user-name">林同学</text>
                <text class="user-sub">记录生活的第 12 天</text>
              </view>
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
                <text class="stat-num">{{ dynamics.length }}</text>
                <text class="stat-label">发布动态</text>
              </view>
            </view>

            <!-- 菜单列表组 1 -->
            <view class="menu-group">
              <view class="menu-row">
                <view class="menu-left">
                  <text class="menu-icon" style="color: #FFA500;">📁</text>
                  <text class="menu-text">分类管理</text>
                </view>
                <text class="icon-right">></text>
              </view>
              <view class="menu-row">
                <view class="menu-left">
                  <text class="menu-icon" style="color: #4A90E2;">🔔</text>
                  <text class="menu-text">提醒与推送设置</text>
                </view>
                <text class="icon-right">></text>
              </view>
              <view class="menu-row">
                <view class="menu-left">
                  <text class="menu-icon" style="color: #50C878;">🔄</text>
                  <text class="menu-text">数据同步</text>
                </view>
                <view class="menu-right">
                  <text class="menu-value">自动</text>
                  <text class="icon-right">></text>
                </view>
              </view>
              <view class="menu-row no-border">
                <view class="menu-left">
                  <text class="menu-icon" style="color: #9ca3af;">⚙️</text>
                  <text class="menu-text">通用设置</text>
                </view>
                <text class="icon-right">></text>
              </view>
            </view>

            <!-- 菜单列表组 2 -->
            <view class="menu-group">
              <view class="menu-row">
                <view class="menu-left">
                  <text class="menu-icon" style="color: #9ca3af;">ℹ️</text>
                  <text class="menu-text">关于有序日常</text>
                </view>
                <text class="icon-right">></text>
              </view>
              <view class="menu-row no-border" @click="handleLogout">
                <view class="menu-left">
                  <text class="menu-icon" style="color: #ef4444;">🚪</text>
                  <text class="menu-text text-red">退出登录</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
      
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
    <view v-if="showAIModal" class="modal-mask" @click="showAIModal = false">
      <view class="modal-content ai-modal" @click.stop>
        <view class="modal-header">
          <text class="ai-title">✨ AI 智能日程助手</text>
          <text class="close-btn" @click="showAIModal = false">×</text>
        </view>
        
        <view v-if="!aiResult" class="ai-input-workflow">
          <text class="ai-tips">输入口语化生活安排，智能助手将为您自动生成标准的结构化日历提醒：</text>
          <view class="ai-input-area">
            <textarea v-model="aiText" placeholder="例如：明天下午3点去图书馆写网络大作业..." class="ai-textarea"></textarea>
            <view class="ai-actions">
              <view class="mic-btn" @click="simulateVoiceInput">🎤</view>
              <view class="send-btn" :class="{'send-active': aiText.length > 0}" @click="generateSchedule">↑</view>
            </view>
          </view>
        </view>

        <!-- AI 生成后的确认预览结果卡片 -->
        <view v-else class="ai-result-workflow">
          <view class="ai-result-card">
            <text class="result-card-title">{{ aiResult.title }}</text>
            <view class="result-card-body">
              <text class="result-line">📅 时间：{{ aiResult.time }}</text>
              <text class="result-line">📁 分类：<text class="text-blue">{{ aiResult.category }}</text></text>
            </view>
          </view>
          <view class="modal-btn-group">
            <button class="btn-secondary" @click="aiResult = null">修改</button>
            <button class="btn-primary" @click="confirmAISchedule">添加到日历</button>
          </view>
        </view>
      </view>
    </view>

    <!-- B. 全局常规新建日程弹窗 -->
    <view v-if="showAddModal" class="modal-mask" @click="showAddModal = false">
      <view class="modal-content add-modal" @click.stop>
        <view class="add-header">
          <text class="btn-cancel" @click="showAddModal = false">取消</text>
          <text class="add-modal-title">新建日程</text>
          <text class="btn-save" @click="saveGeneralSchedule">保存</text>
        </view>
        <view class="add-form">
          <input type="text" placeholder="准备做什么？" class="input-title" v-model="newScheduleTitle" />
          <view class="form-row">
            <text class="row-icon">📅</text>
            <text class="row-text">2026年5月15日 (今天) 14:00</text>
          </view>
          <view class="form-row">
            <text class="row-icon">📁</text>
            <view class="category-options">
              <text 
                class="opt-badge" 
                :class="{'opt-active': newScheduleCategory === '学习'}" 
                @click="newScheduleCategory = '学习'"
              >学习</text>
              <text 
                class="opt-badge" 
                :class="{'opt-active': newScheduleCategory === '工作'}" 
                @click="newScheduleCategory = '工作'"
              >工作</text>
              <text 
                class="opt-badge" 
                :class="{'opt-active': newScheduleCategory === '生活'}" 
                @click="newScheduleCategory = '生活'"
              >生活</text>
            </view>
          </view>
          <textarea placeholder="添加备注..." class="form-textarea" v-model="newScheduleRemark"></textarea>
        </view>
      </view>
    </view>

    <!-- C. 发布生活动态弹窗 -->
    <view v-if="showPublishModal" class="modal-mask" @click="showPublishModal = false">
      <view class="modal-content add-modal" @click.stop>
        <view class="add-header">
          <text class="btn-cancel" @click="showPublishModal = false">取消</text>
          <text class="add-modal-title">写动态</text>
          <text class="btn-save" @click="saveNewDynamic">发布</text>
        </view>
        <view class="add-form">
          <textarea placeholder="记录今天的生活碎片吧..." class="form-textarea" v-model="newDynamicText" style="height: 180px;"></textarea>
          
          <!-- 日程挂载选项 -->
          <view class="form-row">
            <text class="row-icon">📎</text>
            <view class="schedule-selector" @click="toggleSelectRelation">
              <text class="row-text" v-if="!relatedScheduleSelected">关联今日日程</text>
              <text class="row-text text-blue" v-else>已关联: {{ relatedScheduleSelected }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

// 基础状态：控制当前选中的 Tab 页
const activeTab = ref('calendar')

// ==========================================================================
// 模拟全局状态数据 (整合原各组件的状态)
// ==========================================================================
const morningPushEnabled = ref(true)
const activeDate = ref('05-15')

// 日历矩阵基础配置（对应2026年5月）
const days = ['日', '一', '二', '三', '四', '五', '六']
const dates = Array.from({ length: 31 }, (_, i) => i + 1)

// 动态筛选器所需要的日期列表
const dynamicsDates = ref([
  { date: '05-15', isToday: true }, 
  { date: '05-14', isToday: false }, 
  { date: '05-13', isToday: false },
  { date: '05-12', isToday: false }, 
  { date: '05-11', isToday: false }, 
  { date: '05-10', isToday: false }
])

// 模态弹窗状态控制器
const showAIModal = ref(false)
const showAddModal = ref(false)
const showPublishModal = ref(false)

// 数据双向绑定变量
const aiText = ref('')
const aiResult = ref(null)

// 常规日程新增绑定变量
const newScheduleTitle = ref('')
const newScheduleCategory = ref('学习')
const newScheduleRemark = ref('')

// 新增动态绑定变量
const newDynamicText = ref('')
const relatedScheduleSelected = ref('')

// 全局日程列表（今日待办、时间轴组件共享状态）
const tasksList = ref([
  { id: 1, title: '计算机网络大作业提交', time: '14:00', date: '05-15', category: '学习', priority: 3, color: '#4A90E2', completed: false, type: 'today' },
  { id: 2, title: '社团例会', time: '19:00', date: '05-15', category: '生活', priority: 2, color: '#50C878', completed: false, type: 'today' },
  { id: 3, title: '奶茶店兼职', time: '14:00', date: '05-16', category: '工作', priority: 2, color: '#FFA500', completed: false, type: 'future' },
  { id: 4, title: '公众号推文排版', time: '20:00', date: '05-13', category: '工作', priority: 1, color: '#FFA500', completed: false, type: 'past' }
])

// 全局生活动态数据列表
const dynamics = ref([
  { id: 1, text: '今天终于把网络大作业搞定了，框架报错调了整整三个小时！好在最后跑通了，给自己加个鸡腿 🍗', date: '05-15', time: '15:30', relatedSchedule: '计算机网络大作业提交', hasImage: false },
  { id: 2, text: '阳光正好，在操场跑了5公里，感觉一整天的疲惫都消失了。', date: '05-14', time: '21:00', relatedSchedule: null, hasImage: true }
])

// ==========================================================================
// 计算属性与工具函数
// ==========================================================================
const todayTasks = computed(() => {
  return tasksList.value.filter(t => t.type === 'today')
})

const todayTasksCount = computed(() => todayTasks.value.length)

const todayRemainingTasks = computed(() => {
  return tasksList.value.filter(t => t.type === 'today' && !t.completed)
})

const futureTasks = computed(() => {
  return tasksList.value.filter(t => t.type === 'future')
})

const pastTasks = computed(() => {
  return tasksList.value.filter(t => t.type === 'past')
})

const completedTasksCount = computed(() => {
  return tasksList.value.filter(t => t.completed).length
})

const filteredDynamics = computed(() => {
  return dynamics.value.filter(d => d.date === activeDate.value)
})

// ==========================================================================
// 逻辑处理事件方法
// ==========================================================================

// 打开对应弹窗事件
const openAIModal = () => {
  aiResult.value = null
  aiText.value = ''
  showAIModal.value = true
}
const openAddModal = () => {
  newScheduleTitle.value = ''
  newScheduleCategory.value = '学习'
  newScheduleRemark.value = ''
  showAddModal.value = true
}
const openPublishModal = () => {
  newDynamicText.value = ''
  relatedScheduleSelected.value = ''
  showPublishModal.value = true
}

// 模拟待办状态勾选切换
const toggleTask = (task) => {
  task.completed = !task.completed
  uni.showToast({
    title: task.completed ? '已完成事项' : '已重置事项',
    icon: 'none'
  })
}

// 触发 AI 解析流程
const generateSchedule = () => {
  if (!aiText.value.trim()) return
  uni.showLoading({ title: '豆包AI正在解析...' })
  
  // 模拟底层大模型API解析流程
  setTimeout(() => {
    uni.hideLoading()
    aiResult.value = {
      title: '去图书馆写网络大作业',
      time: '明天下午 15:00',
      category: '学习'
    }
  }, 1200)
}

// 模拟语音输入快捷操作
const simulateVoiceInput = () => {
  aiText.value = '下周六下午2点去奶茶店兼职'
  uni.showToast({
    title: '已识别语音内容',
    icon: 'none'
  })
}

// 确认 AI 生成日程并导入
const confirmAISchedule = () => {
  tasksList.value.push({
    id: Date.now(),
    title: aiResult.value.title,
    time: '15:00',
    date: '05-16',
    category: aiResult.value.category,
    priority: 2,
    color: '#4A90E2',
    completed: false,
    type: 'future'
  })
  showAIModal.value = false
  uni.showToast({ title: '已添加到日历', icon: 'success' })
}

// 保存常规手动创建的日程
const saveGeneralSchedule = () => {
  if (!newScheduleTitle.value.trim()) {
    uni.showToast({ title: '请输入日程标题', icon: 'none' })
    return
  }
  tasksList.value.push({
    id: Date.now(),
    title: newScheduleTitle.value,
    time: '14:00',
    date: '05-15',
    category: newScheduleCategory.value,
    priority: 1,
    color: newScheduleCategory.value === '学习' ? '#4A90E2' : (newScheduleCategory.value === '工作' ? '#FFA500' : '#50C878'),
    completed: false,
    type: 'today'
  })
  showAddModal.value = false
  uni.showToast({ title: '保存成功', icon: 'success' })
}

// 发布新动态
const saveNewDynamic = () => {
  if (!newDynamicText.value.trim()) {
    uni.showToast({ title: '请输入动态内容', icon: 'none' })
    return
  }
  dynamics.value.unshift({
    id: Date.now(),
    text: newDynamicText.value,
    date: '05-15',
    time: '08:00',
    relatedSchedule: relatedScheduleSelected.value || null,
    hasImage: false
  })
  showPublishModal.value = false
  activeDate.value = '05-15' // 强制定位到今天方便看到发布结果
  uni.showToast({ title: '发布成功', icon: 'success' })
}

// 模拟在动态中关联今日任务
const toggleSelectRelation = () => {
  if (relatedScheduleSelected.value) {
    relatedScheduleSelected.value = ''
  } else {
    relatedScheduleSelected.value = '计算机网络大作业提交'
  }
}

// 切换晨间推送开关
const toggleMorningPush = () => {
  morningPushEnabled.value = !morningPushEnabled.value
  uni.showToast({
    title: morningPushEnabled.value ? '晨间推送已开启' : '晨间推送已关闭',
    icon: 'none'
  })
}

// 模拟退出登录
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '已退出登录', icon: 'none' })
      }
    }
  })
}
</script>

<style scoped>
/* ==========================================================================
   全局框架与布局结构
   ========================================================================== */
.app-container { height: 100vh; display: flex; flex-direction: column; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
.status-bar { height: 44px; width: 100%; background-color: #ffffff; }
.main-content { flex: 1; overflow: hidden; position: relative; display: flex; flex-direction: column; }
.scroll-container { width: 100%; height: 100%; padding-bottom: 68px; box-sizing: border-box; }
.full-component-container { width: 100%; height: 100%; padding-bottom: 68px; box-sizing: border-box; display: flex; flex-direction: column; }
.gray-divider { height: 8px; background-color: #f8fafc; width: 100%; }

/* ==========================================================================
   板块样式 1：日历事务管理
   ========================================================================== */
.calendar-view { display: flex; flex-direction: column; background-color: #ffffff; }
.header-control { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background-color: #ffffff; }
.title-text { font-size: 20px; font-weight: bold; color: #333333; }
.view-switch { display: flex; background-color: #f1f5f9; padding: 3px; border-radius: 8px; }
.switch-btn { padding: 4px 14px; font-size: 13px; color: #64748b; border-radius: 6px; }
.active-switch { background-color: #ffffff; color: #4A90E2; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }

.calendar-grid { padding: 0 8px 12px 8px; }
.week-days { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 6px; }
.day-label { text-align: center; font-size: 12px; color: #94a3b8; font-weight: 500; }
.dates-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.date-cell { height: 56px; border: 1px solid #f8fafc; border-radius: 8px; display: flex; flex-direction: column; align-items: center; position: relative; }
.is-today { background-color: rgba(74, 144, 226, 0.08); }
.date-num { font-size: 13px; color: #334155; margin-top: 4px; font-weight: 500; }
.today-num { width: 22px; height: 22px; background-color: #4A90E2; color: #ffffff; border-radius: 50%; text-align: center; line-height: 22px; font-weight: bold; font-size: 12px; }

.tags-row { display: flex; gap: 2px; margin-top: 6px; width: 100%; justify-content: center; padding: 0 4px; box-sizing: border-box; }
.tag-line { height: 4px; border-radius: 2px; flex: 1; max-width: 12px; }
.bg-main { background-color: #4A90E2; }
.bg-orange { background-color: #FFA500; }
.bg-green { background-color: #50C878; }

.today-section { padding: 16px; background-color: #ffffff; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-title { font-size: 16px; font-weight: bold; color: #1e293b; }
.section-sub { font-size: 12px; color: #94a3b8; }
.task-list { display: flex; flex-direction: column; gap: 12px; }
.task-item { display: flex; align-items: center; padding: 12px 14px; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.01); position: relative; overflow: hidden; }
.task-check-box { margin-right: 12px; display: flex; align-items: center; justify-content: center; }
.icon-unchecked { width: 20px; height: 20px; border: 2px solid #cbd5e1; border-radius: 50%; }
.icon-checked { width: 20px; height: 20px; background-color: #cbd5e1; color: #ffffff; border-radius: 50%; text-align: center; line-height: 20px; font-size: 11px; font-weight: bold; }
.task-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.task-item-title { font-size: 15px; font-weight: 500; color: #334155; }
.task-meta { display: flex; align-items: center; gap: 8px; }
.task-time-tag { font-size: 11px; padding: 2px 6px; background-color: #f1f5f9; color: #64748b; border-radius: 4px; }
.category-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 500; }
.priority-line { position: absolute; right: 0; top: 0; bottom: 0; width: 5px; background-color: #FFA500; }
.line-through { text-decoration: line-through; color: #94a3b8 !important; }

/* ==========================================================================
   板块样式 2：提醒中心 (时间轴)
   ========================================================================== */
.reminder-view { padding: 16px; min-height: 100%; background: #ffffff; }
.page-title { font-size: 20px; font-weight: bold; color: #333; margin-bottom: 20px; display: block; }
.morning-banner { background: #f0f7ff; border: 1px solid #e0f2fe; border-radius: 12px; padding: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.banner-left { display: flex; align-items: center; gap: 8px; }
.banner-text { font-size: 14px; color: #374151; font-weight: 500; }
.text-blue { color: #4A90E2; }
.switch-ui { width: 40px; height: 20px; border-radius: 10px; background: #e5e7eb; position: relative; transition: background-color 0.2s; }
.active-switch { background: #4A90E2; }
.switch-knob { width: 16px; height: 16px; background: #fff; border-radius: 50%; position: absolute; right: 2px; top: 2px; box-shadow: 0 1px 2px rgba(0,0,0,0.2); transition: all 0.2s; }
.knob-off { right: 22px !important; }

.timeline-container { border-left: 2px solid #E5E5E5; margin-left: 8px; padding-bottom: 20px; }
.timeline-section { position: relative; padding-left: 24px; margin-bottom: 28px; }
.timeline-node { position: absolute; border-radius: 50%; }
.node-blue { width: 10px; height: 10px; background: #4A90E2; left: -6px; top: 4px; }
.node-green { width: 8px; height: 8px; background: #50C878; left: -5px; top: 4px; }
.node-gray { width: 8px; height: 8px; background: #d1d5db; left: -5px; top: 4px; }
.section-title { font-size: 14px; font-weight: bold; color: #333; margin-bottom: 12px; display: block; }
.text-light-gray { color: #9ca3af; }

.task-list-timeline { display: flex; flex-direction: column; gap: 12px; }
.task-card { background: #fff; border: 1px solid #f3f4f6; padding: 12px; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); position: relative; }
.task-time-left, .task-date-left { position: absolute; left: -56px; top: 12px; font-size: 12px; color: #333; font-weight: 500; width: 48px; text-align: right; }
.task-date-left { color: #6b7280; }
.task-card-content { display: flex; justify-content: space-between; align-items: flex-start; }
.task-info { display: flex; flex-direction: column; align-items: flex-start; }
.task-title { font-size: 14px; font-weight: 500; color: #374151; }
.text-red { color: #ef4444; }
.text-gray { color: #4b5563; }
.task-desc { font-size: 12px; color: #9ca3af; margin-top: 4px; display: block; }
.task-tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 6px; }
.circle-check { width: 20px; height: 20px; border: 2px solid #cbd5e1; border-radius: 50%; }
.card-expired { background: #f9fafb; opacity: 0.7; }

/* ==========================================================================
   板块样式 3：生活动态
   ========================================================================== */
.dynamics-view { flex: 1; display: flex; flex-direction: column; height: 100%; background: #f8fafc; overflow: hidden; }
.sticky-header { background: #fff; z-index: 10; box-shadow: 0 1px 2px rgba(0,0,0,0.02); flex-shrink: 0; }
.date-filter-scroll { height: 52px; white-space: nowrap; padding-bottom: 8px; }
.date-filter-container { display: flex; padding: 0 16px; gap: 8px; align-items: center; height: 100%; }
.date-btn { width: 44px; height: 32px; background: #f3f4f6; border-radius: 8px; display: inline-flex; justify-content: center; align-items: center; flex-shrink: 0; }
.date-text { font-size: 12px; color: #666; font-weight: 500; }
.date-active { background: #4A90E2; }
.date-active .date-text { color: #fff; }
.date-today { border: 1.5px solid #FFA500; }

.dynamics-scroll-area { flex: 1; overflow-y: auto; }
.dynamics-list { padding: 16px; display: flex; flex-direction: column; gap: 16px; padding-bottom: 80px; }
.dynamic-card { background: #fff; padding: 16px; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); border: 1px solid #f3f4f6; }
.dyn-header { margin-bottom: 12px; }
.dyn-time { font-size: 12px; color: #9ca3af; font-weight: 500; }
.dyn-content { font-size: 15px; color: #333; line-height: 1.5; margin-bottom: 12px; display: block; word-break: break-all; }
.dyn-image-placeholder { width: 100%; height: 120px; background: #f3f4f6; border: 1px dashed #d1d5db; border-radius: 8px; display: flex; justify-content: center; align-items: center; margin-bottom: 12px; font-size: 32px; }
.dyn-schedule-link { display: inline-flex; align-items: center; gap: 4px; background: #f0f7ff; border: 1px solid #e0f2fe; padding: 6px 10px; border-radius: 6px; }
.link-icon { font-size: 12px; }
.link-text { font-size: 11px; color: #4A90E2; font-weight: 500; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fab-publish { position: fixed; right: 16px; bottom: 84px; width: 56px; height: 56px; border-radius: 50%; background: #4A90E2; color: #fff; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4); font-size: 28px; z-index: 10; }

/* ==========================================================================
   板块样式 4：个人中心
   ========================================================================== */
.profile-view { min-height: 100%; background: #f8fafc; }
.profile-header { background: #4A90E2; padding: 40px 24px 32px; border-radius: 0 0 32px 32px; box-shadow: 0 4px 6px rgba(74, 144, 226, 0.2); }
.user-info { display: flex; align-items: center; gap: 16px; }
.avatar-box { width: 64px; height: 64px; border-radius: 50%; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.5); display: flex; justify-content: center; align-items: center; font-size: 32px; }
.text-info { display: flex; flex-direction: column; gap: 4px; }
.user-name { font-size: 20px; font-weight: bold; color: #fff; }
.user-sub { font-size: 14px; color: #dbeafe; }

.profile-content { padding: 0 16px; margin-top: 24px; display: flex; flex-direction: column; gap: 16px; padding-bottom: 100px; }
.stats-panel { background: #fff; border-radius: 16px; padding: 16px; display: flex; justify-content: space-around; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02); border: 1px solid #f3f4f6; }
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stat-num { font-size: 24px; font-weight: bold; color: #333; }
.stat-label { font-size: 12px; color: #9ca3af; }
.stat-divider { width: 1px; height: 40px; background: #f3f4f6; }

.menu-group { background: #fff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); border: 1px solid #f3f4f6; overflow: hidden; }
.menu-row { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid #f9fafb; }
.no-border { border-bottom: none; }
.menu-left { display: flex; align-items: center; gap: 12px; }
.menu-icon { font-size: 18px; }
.menu-text { font-size: 15px; color: #374151; }
.text-red { color: #ef4444; }
.menu-right { display: flex; align-items: center; gap: 8px; }
.menu-value { font-size: 14px; color: #9ca3af; }
.icon-right { font-size: 14px; color: #d1d5db; font-family: monospace; }

/* ==========================================================================
   全局通用导航栏
   ========================================================================== */
.tab-bar { position: fixed; bottom: 0; left: 0; width: 100%; height: 64px; background-color: #ffffff; display: flex; justify-content: space-around; align-items: center; border-top: 1px solid #f1f5f9; padding-bottom: env(safe-area-inset-bottom); z-index: 99; }
.tab-item { display: flex; flex-direction: column; align-items: center; color: #94a3b8; width: 60px; }
.tab-active { color: #4A90E2; }
.tab-icon { font-size: 22px; margin-bottom: 2px; }
.tab-text { font-size: 10px; font-weight: 600; }

/* ==========================================================================
   右下角悬浮按钮组(FAB)
   ========================================================================== */
.fab-group { position: fixed; right: 16px; bottom: 84px; display: flex; flex-direction: column; gap: 12px; z-index: 99; }
.fab-ai { width: 42px; height: 42px; border-radius: 50%; background-color: #ffffff; color: #4A90E2; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e0f2fe; font-size: 18px; }
.fab-add { width: 56px; height: 56px; border-radius: 50%; background-color: #4A90E2; color: #ffffff; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 14px rgba(74, 144, 226, 0.4); font-size: 28px; }

/* ==========================================================================
   全局弹窗机制样式
   ========================================================================== */
.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.4); z-index: 999; display: flex; flex-direction: column; justify-content: flex-end; }
.modal-content { background-color: #ffffff; border-radius: 24px 24px 0 0; padding: 20px; box-sizing: border-box; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.ai-modal { min-height: 320px; }
.ai-title { color: #4A90E2; font-weight: bold; font-size: 17px; }
.close-btn { background-color: #f1f5f9; width: 24px; height: 24px; text-align: center; border-radius: 50%; line-height: 22px; color: #64748b; font-size: 16px; }

.ai-tips { font-size: 13px; color: #64748b; margin-bottom: 12px; display: block; line-height: 1.4; }
.ai-input-area { position: relative; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px; }
.ai-textarea { width: 100%; height: 100px; font-size: 15px; color: #334155; line-height: 1.5; }
.ai-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.mic-btn { width: 32px; height: 32px; background-color: #ffffff; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-size: 16px; }
.send-btn { width: 32px; height: 32px; background-color: #e2e8f0; color: #94a3b8; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 16px; transition: all 0.2s; }
.send-active { background-color: #4A90E2; color: #ffffff; box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3); }

/* AI 结果确认卡片 */
.ai-result-card { background-color: #f0f7ff; border: 1px solid #e0f2fe; border-radius: 14px; padding: 16px; margin-bottom: 20px; }
.result-card-title { font-size: 17px; font-weight: bold; color: #1e293b; margin-bottom: 10px; display: block; }
.result-line { font-size: 14px; color: #475569; display: block; margin-bottom: 6px; }
.text-blue { color: #4A90E2; font-weight: bold; }
.modal-btn-group { display: flex; gap: 12px; }
.btn-secondary { flex: 1; height: 44px; line-height: 44px; background-color: #f1f5f9; color: #475569; font-size: 15px; font-weight: 500; border-radius: 12px; border: none; text-align: center; }
.btn-primary { flex: 1; height: 44px; line-height: 44px; background-color: #4A90E2; color: #ffffff; font-size: 15px; font-weight: 500; border-radius: 12px; box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3); border: none; text-align: center; }

/* 常规添加日程 / 动态弹窗表单样式 */
.add-modal { height: 85vh; display: flex; flex-direction: column; }
.add-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
.btn-cancel { color: #94a3b8; font-size: 15px; }
.btn-save { color: #4A90E2; font-size: 15px; font-weight: bold; }
.add-modal-title { font-size: 16px; font-weight: bold; color: #333333; }
.add-form { padding-top: 20px; display: flex; flex-direction: column; gap: 20px; }
.input-title { width: 100%; font-size: 20px; font-weight: bold; color: #333333; height: 40px; }
.form-row { display: flex; align-items: center; gap: 12px; }
.row-icon { font-size: 18px; width: 24px; text-align: center; }
.row-text { font-size: 15px; color: #334155; }
.category-options { display: flex; gap: 8px; }
.opt-badge { padding: 4px 14px; font-size: 12px; background-color: #f1f5f9; color: #64748b; border-radius: 20px; }
.opt-active { background-color: #4A90E2; color: #ffffff; font-weight: 500; }
.form-textarea { width: 100%; height: 120px; background-color: #f8fafc; border-radius: 12px; padding: 12px; box-sizing: border-box; font-size: 14px; }
</style>