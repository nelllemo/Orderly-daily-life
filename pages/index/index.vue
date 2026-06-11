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
                  @click="selectDate(date); openAddModal(date)"
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
                  <view class="date-cell" v-for="key in weekDatesKeys" :key="key" @click="selectDateByKey(key); openAddModal()">
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
                <view class="task-check-box" @click="toggleTask(task)">
                  <text v-if="task.completed" class="icon-checked">✓</text>
                  <view v-else class="icon-unchecked"></view>
                </view>
                <view class="task-body" @click="openEditModal(task)">
                  <text class="task-item-title" :class="{'line-through': task.completed}">{{ task.title }}</text>
                  <view class="task-meta">
                    <text class="task-time-tag">{{ task.time }}</text>
                    <text class="category-badge" :style="{ color: task.color, backgroundColor: task.color + '20' }">{{ task.categoryName }}</text>
                  </view>
                </view>
                <text class="menu-text text-red" @click="removeSchedule(task.id)">删除</text>
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
              <text class="banner-text">
                晨间推送:
                <picker mode="time" :value="settings.morningPushTime" @change="setMorningPushTime">
                  <text class="text-blue">每天 {{ settings.morningPushTime }}</text>
                </picker>
              </text>
            </view>
            <view class="switch-ui" :class="{'active-toggle': morningPushEnabled}" @click="toggleMorningPush">
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
                <view class="task-card" :class="{ 'card-completed': task.completed }" v-for="task in todayTasks" :key="task.id">
                  <text class="task-time-left">{{ task.time }}</text>
                  <view class="task-card-content">
                    <view class="task-info" @click="openEditModal(task)">
                      <text class="task-title" :class="{ 'text-red': task.priority === 3, 'line-through': task.completed }">{{ task.title }}</text>
                      <view class="task-tag" :style="{ color: task.color, backgroundColor: task.color + '20' }">
                        {{ task.categoryName }}
                      </view>
                    </view>
                    <view class="task-actions">
                      <view class="circle-check" @click.stop="toggleTask(task)"></view>
                      <text class="action-btn" @click.stop="openEditModal(task)">编辑</text>
                      <text class="action-btn text-red" @click.stop="removeSchedule(task.id)">删除</text>
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
                    <view class="task-info" @click="openEditModal(task)">
                      <text class="task-title text-gray">{{ task.title }}</text>
                      <text class="task-desc">{{ task.time }}</text>
                    </view>
                    <view class="task-actions">
                      <text class="action-btn" @click.stop="openEditModal(task)">编辑</text>
                      <text class="action-btn text-red" @click.stop="removeSchedule(task.id)">删除</text>
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
                    <view class="task-info" @click="openEditModal(task)">
                      <text class="task-title line-through">{{ task.title }}</text>
                    </view>
                    <view class="task-actions">
                      <text class="action-btn" @click.stop="openEditModal(task)">编辑</text>
                      <text class="action-btn text-red" @click.stop="removeSchedule(task.id)">删除</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>

          </view>
        </view>
      </scroll-view>

      <!-- ========================================================================== -->
      <!-- 3. 版块：生活动态视图 (仿微信朋友圈竖版左侧日期) -->
      <!-- ========================================================================== -->
      <view v-else-if="activeTab === 'dynamics'" class="full-component-container">
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
                      <text class="moment-avatar-text">👤</text>
                    </view>
                    <view class="moment-header-info">
                      <text class="moment-nickname">{{ session.email ? session.email.split('@')[0] : '我' }}</text>
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
                  <view v-if="dyn.imageUrls && dyn.imageUrls.length" :class="['moment-images-grid', 'grid-col-' + Math.min(dyn.imageUrls.length > 1 ? (dyn.imageUrls.length === 4 ? 2 : 3) : 1, 3)]">
                    <view
                      class="moment-image-wrap"
                      :class="{ 'moment-image-single': dyn.imageUrls.length === 1 }"
                      v-for="(img, idx) in dyn.imageUrls.slice(0,9)"
                      :key="idx"
                      @click="previewImages(dyn.imageUrls, img)"
                    >
                      <image :src="img" mode="aspectFill" class="moment-image" />
                    </view>
                  </view>

                  <!-- 关联日程 -->
                  <view v-if="dyn.relatedScheduleId" class="moment-schedule-link">
                    <text class="moment-link-icon">📎</text>
                    <text class="moment-link-text">{{ scheduleTitleById[dyn.relatedScheduleId] || '已删除日程' }}</text>
                  </view>

                  <!-- 底部操作栏 -->
                  <view class="moment-actions">
                    <view class="moment-action-item">
                      <text class="moment-action-text">赞</text>
                    </view>
                    <view class="moment-action-item">
                      <text class="moment-action-text">评论</text>
                    </view>
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
          <view class="moments-fab" @click="openPublishModal">
            <text class="moments-fab-icon">📷</text>
          </view>
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
                  <text class="user-name">{{ session.email || '游客' }}</text>
                  <text class="user-sub">{{ session.isGuest ? '请登录以同步数据' : '欢迎回来' }}</text>
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
                <text class="stat-num">{{ moments.length }}</text>
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
                  <text class="menu-icon" style="color: #3B82F6;">🔔</text>
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
              <view class="menu-row" v-if="session.isGuest">
                <view class="menu-left">
                  <text class="menu-icon" style="color: #3B82F6;">🔑</text>
                  <text class="menu-text">登录/注册</text>
                </view>
                <text class="icon-right" @click="openAuthModal('login')">></text>
              </view>
              <view class="menu-row">
                <view class="menu-left">
                  <text class="menu-icon" style="color: #9ca3af;">ℹ️</text>
                  <text class="menu-text">关于有序日常</text>
                </view>
                <text class="icon-right">></text>
              </view>
              <view class="menu-row no-border" v-if="!session.isGuest" @click="handleLogout">
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
        
        <view v-if="!aiCandidates.length" class="ai-input-workflow">
          <text class="ai-tips">输入口语化生活安排，智能助手将为您自动生成标准的结构化日历提醒：</text>
          <view class="ai-input-area">
            <textarea v-model="aiText" placeholder="例如：明天下午3点去图书馆写网络大作业..." class="ai-textarea"></textarea>
            <view class="ai-actions">
              <view class="mic-btn" @click="simulateVoiceInput">🎤</view>
              <view class="send-btn" :class="{'send-active': aiText.length > 0}" @click="generateSchedule">↑</view>
            </view>
          </view>
        </view>

        <!-- AI 生成后的候选列表与编辑 -->
        <view v-else class="ai-result-workflow">
          <view class="ai-candidates-list">
            <view
              class="ai-candidate"
              v-for="(c, idx) in aiCandidates"
              :key="idx"
              :class="{ 'candidate-selected': aiSelectedIndex === idx }"
              @click="aiSelectedIndex = idx"
            >
              <text class="result-card-title">{{ c.title }}</text>
              <text class="result-line">📅 {{ c.date || c.time || '' }}</text>
            </view>
          </view>

          <view v-if="aiCandidates.length" class="ai-result-edit">
            <view class="ai-result-card">
              <input type="text" v-model="aiCandidates[aiSelectedIndex].title" class="input-title" />
              <view class="result-card-body">
                <picker mode="date" :value="aiCandidates[aiSelectedIndex].date || new Date().toISOString().slice(0,10)" @change="(e) => aiCandidates[aiSelectedIndex].date = e.detail.value">
                  <text class="result-line">📅 时间：{{ aiCandidates[aiSelectedIndex].date || '选择日期' }}</text>
                </picker>
                <picker mode="time" :value="aiCandidates[aiSelectedIndex].time || '09:00'" @change="(e) => aiCandidates[aiSelectedIndex].time = e.detail.value">
                  <text class="result-line">⏰ 时刻：{{ aiCandidates[aiSelectedIndex].time || '选择时间' }}</text>
                </picker>
                <view class="form-row">
                  <text class="row-icon">⭐</text>
                  <view class="category-options">
                    <text class="opt-badge" :class="{'opt-active': aiCandidates[aiSelectedIndex].priority === 1}" @click="aiCandidates[aiSelectedIndex].priority = 1">低</text>
                    <text class="opt-badge" :class="{'opt-active': aiCandidates[aiSelectedIndex].priority === 2}" @click="aiCandidates[aiSelectedIndex].priority = 2">中</text>
                    <text class="opt-badge" :class="{'opt-active': aiCandidates[aiSelectedIndex].priority === 3}" @click="aiCandidates[aiSelectedIndex].priority = 3">高</text>
                  </view>
                </view>
              </view>
            </view>
            <view class="modal-btn-group">
              <button class="btn-secondary" @click="aiCandidates = []; aiText = ''; showAIModal = false">关闭</button>
              <button class="btn-primary" @click="confirmAISchedule">添加到日历</button>
            </view>
          </view>
          <view v-else class="ai-result-workflow">
            <text>没有生成候选，请重试或修改描述。</text>
          </view>
        </view>
      </view>
    </view>

    <!-- B. 全局常规新建日程弹窗 -->
    <view v-if="showAddModal" class="modal-mask" @click="showAddModal = false">
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
            <picker mode="date" :value="newScheduleDate" @change="newScheduleDate = $event.detail.value">
              <text class="row-text">{{ newScheduleDate }}</text>
            </picker>
            <picker mode="time" :value="newScheduleTime" @change="newScheduleTime = $event.detail.value">
              <text class="row-text">{{ newScheduleTime }}</text>
            </picker>
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
            <picker mode="time" :value="newScheduleRemindTime" @change="newScheduleRemindTime = $event.detail.value">
              <text class="row-text">提醒时间 {{ newScheduleRemindTime || '未设置' }}</text>
            </picker>
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
              <text class="row-text text-blue" v-else>已关联: {{ scheduleTitleById[relatedScheduleSelected] || '已删除日程' }}</text>
            </view>
          </view>
          <view class="schedule-list" v-if="todayTasks.length">
            <view
              class="schedule-item"
              v-for="task in todayTasks"
              :key="task.id"
              :class="{'schedule-item-active': relatedScheduleSelected === task.id}"
              @click="relatedScheduleSelected = relatedScheduleSelected === task.id ? '' : task.id"
            >
              <text class="schedule-item-title">{{ task.title }}</text>
              <text class="schedule-item-time">{{ task.time }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- D. 登录/注册弹窗 -->
    <view v-if="showAuthModal" class="modal-mask" @click="showAuthModal = false">
      <view class="modal-content add-modal" @click.stop>
        <view class="add-header">
          <text class="btn-cancel" @click="showAuthModal = false">取消</text>
          <text class="add-modal-title">{{ authMode === 'register' ? '注册' : '登录' }}</text>
          <text class="btn-save" @click="submitAuth">{{ authLoading ? '处理中...' : '提交' }}</text>
        </view>
        <view class="add-form">
          <view style="padding: 12px 0;">
            <text>使用微信一键登录以同步数据到云端，首次登录会自动创建账户。</text>
          </view>
          <view style="margin-top: 12px; display:flex; justify-content:center;">
            <button class="wechat-login-btn" @click="submitAuth">{{ authLoading ? '登录中...' : '使用微信登录' }}</button>
          </view>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { toDateKey, toMonthLabel, addDays } from '../../services/date'
import {
  getState,
  addSchedule,
  updateSchedule as updateScheduleLocal,
  deleteSchedule as deleteScheduleLocal,
  toggleScheduleCompleted,
  addMoment as addMomentLocal,
  updateMoment as updateMomentLocal,
  deleteMoment as deleteMomentLocal,
  updateSettings,
  updateState,
  setSession as setSessionLocal,
  clearSession
} from '../../services/storage'
import * as api from '../../services/api'

const appState = ref(getState())

const refreshState = () => {
  appState.value = getState()
}

const loadServerData = async () => {
  if (session.value.isGuest || !session.value.token) return
  try {
    const [serverSchedules, serverMoments] = await Promise.all([
      api.fetchSchedules(),
      api.fetchMoments()
    ])
    if (serverSchedules && serverSchedules.length) {
      const merged = serverSchedules.map(s => ({
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
      updateState(state => { state.schedules = merged; return state })
    }
    if (serverMoments && serverMoments.length) {
      const merged = serverMoments.map(m => ({
        id: String(m.id),
        content: m.content,
        date: m.date,
        time: m.time,
        relatedScheduleId: m.relatedScheduleId ? String(m.relatedScheduleId) : null,
        imageUrls: m.imageUrls || []
      }))
      updateState(state => { state.moments = merged; return state })
    }
    refreshState()
  } catch (e) {
    console.error('Failed to load server data:', e)
  }
}

const isLoggedIn = () => !session.value.isGuest && session.value.token

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

const expandedMoments = ref({})
const toggleExpand = (id) => {
  expandedMoments.value[id] = !expandedMoments.value[id]
}

const previewImages = (urls, current) => {
  uni.previewImage({ urls, current })
}

const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const weekdayLabel = (dateStr) => {
  const d = new Date(dateStr)
  return weekDayNames[d.getDay()]
}

const activeTab = ref('calendar')
const activeView = ref('month')

const showAIModal = ref(false)
const showAddModal = ref(false)
const showPublishModal = ref(false)

const aiText = ref('')
const aiCandidates = ref([])
const aiSelectedIndex = ref(0)

const editingScheduleId = ref(null)

const showAuthModal = ref(false)
const authMode = ref('login')
const authEmail = ref('')
const authPassword = ref('')
const authLoading = ref(false)

const newScheduleTitle = ref('')
const newScheduleDate = ref(toDateKey(new Date()))
const newScheduleTime = ref('09:00')
const newScheduleCategoryId = ref(null)
const newSchedulePriority = ref(1)
const newScheduleRemark = ref('')
const newScheduleLocation = ref('')
const newScheduleRemindTime = ref('')

const newDynamicText = ref('')
const relatedScheduleSelected = ref('')

const days = ['日', '一', '二', '三', '四', '五', '六']

const currentMonth = ref(new Date())
const selectedDate = ref(toDateKey(new Date()))
const todayKey = toDateKey(new Date())
const todayLabel = computed(() => `${todayKey.slice(5, 7)}月${todayKey.slice(8)}日`)

const categories = computed(() => appState.value.categories)
const schedules = computed(() => appState.value.schedules)
const moments = computed(() => appState.value.moments)
const settings = computed(() => appState.value.settings)
const session = computed(() => appState.value.session)
const morningPushEnabled = computed(() => settings.value.morningPushEnabled)

const categoryById = computed(() => {
  const map = {}
  categories.value.forEach((category) => {
    map[category.id] = category
  })
  return map
})

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

// 计算选中日期所在周的日期键（从周日开始，7 天）
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

const selectDateByKey = (dateKey) => {
  selectedDate.value = dateKey
  const parts = dateKey.split('-')
  currentMonth.value = new Date(Number(parts[0]), Number(parts[1]) - 1, 1)
}

const scheduleTagsByDate = computed(() => {
  const map = {}
  schedules.value.forEach((schedule) => {
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

const scheduleToTask = (schedule) => {
  const category = categoryById.value[schedule.categoryId] || { name: '未分类', color: '#94a3b8' }
  return {
    ...schedule,
    categoryName: category.name,
    color: category.color
  }
}

const todayTasks = computed(() => schedules.value.filter((t) => t.date === todayKey).map(scheduleToTask))
const todayTasksCount = computed(() => todayTasks.value.length)
const todayRemainingTasks = computed(() => todayTasks.value.filter((t) => !t.completed))
const futureTasks = computed(() => schedules.value.filter((t) => t.date > todayKey).map(scheduleToTask))
const pastTasks = computed(() => schedules.value.filter((t) => t.date < todayKey).map(scheduleToTask))
const completedTasksCount = computed(() => schedules.value.filter((t) => t.completed).length)

const activeDate = ref(todayKey)
const dynamicsDates = computed(() => {
  const list = []
  for (let offset = 0; offset < 7; offset += 1) {
    const dateKey = toDateKey(addDays(new Date(), -offset))
    list.push({ dateKey, label: dateKey.slice(5), isToday: dateKey === todayKey })
  }
  return list
})

const scheduleTitleById = computed(() => {
  const map = {}
  schedules.value.forEach((schedule) => {
    map[schedule.id] = schedule.title
  })
  return map
})

const filteredDynamics = computed(() => moments.value.filter((m) => m.date === activeDate.value))

const isEditingSchedule = computed(() => Boolean(editingScheduleId.value))

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

const openAIModal = () => {
  aiCandidates.value = []
  aiSelectedIndex.value = 0
  aiText.value = ''
  showAIModal.value = true
}

const openAddModal = (day) => {
  editingScheduleId.value = null
  const dateKey = day ? getDateKeyForDay(day) : selectedDate.value
  resetScheduleForm(dateKey)
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
  relatedScheduleSelected.value = ''
  showPublishModal.value = true
}

const goToNextMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
}

const goToPrevMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1)
}

const selectDate = (day) => {
  selectedDate.value = getDateKeyForDay(day)
}

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

const generateSchedule = () => {
  if (!aiText.value.trim()) return
  uni.showLoading({ title: '豆包AI正在解析...' })
  api.requestAISchedule(aiText.value.trim())
    .then((data) => {
      // data may be { candidates: [...] } or simulated shape
      if (data && data.candidates && Array.isArray(data.candidates)) {
        // normalize minimal fields
        aiCandidates.value = data.candidates.map((c) => ({
          title: c.title || c.text || c[0] || aiText.value.slice(0, 60),
          date: c.date || c.date || new Date().toISOString().slice(0, 10),
          time: c.time || c.time || null,
          priority: c.priority || 2,
          category: c.category || c.category || null,
          remark: c.remark || c.raw || ''
        }))
      } else if (data && data.simulated && data.candidates) {
        aiCandidates.value = data.candidates
      } else {
        // fallback single candidate
        aiCandidates.value = [{ title: aiText.value.slice(0, 60), date: new Date().toISOString().slice(0,10), time: null, priority: 2, category: null, remark: '' }]
      }
      aiSelectedIndex.value = 0
    })
    .catch(() => {
      aiCandidates.value = [{ title: '去图书馆写网络大作业', date: new Date().toISOString().slice(0,10), time: '15:00', priority: 2, category: '学习', remark: '' }]
      aiSelectedIndex.value = 0
    })
    .finally(() => {
      uni.hideLoading()
    })
}

const simulateVoiceInput = () => {
  aiText.value = '下周六下午2点去奶茶店兼职'
  uni.showToast({
    title: '已识别语音内容',
    icon: 'none'
  })
}

const confirmAISchedule = async () => {
  const sel = aiCandidates.value[aiSelectedIndex.value]
  if (!sel) return uni.showToast({ title: '请选择要添加的候选', icon: 'none' })

  const payload = {
    title: sel.title,
    date: sel.date || toDateKey(addDays(new Date(), 0)),
    time: sel.time || '09:00',
    categoryId: categories.value.find((c) => c.name === sel.category)?.id || null,
    priority: sel.priority || 2,
    remark: sel.remark || ''
  }

  try {
    if (isLoggedIn()) {
      const result = await api.createSchedule(payload)
      payload.id = String(result.id)
      addSchedule({ ...payload, completed: false })
    } else {
      addSchedule(payload)
    }
    refreshState()
    showAIModal.value = false
    aiCandidates.value = []
    uni.showToast({ title: '已添加到日历', icon: 'success' })
  } catch (err) {
    uni.showToast({ title: err.message || '保存失败', icon: 'none' })
  }
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
  if (!newDynamicText.value.trim()) {
    uni.showToast({ title: '请输入动态内容', icon: 'none' })
    return
  }
  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  const payload = {
    content: newDynamicText.value,
    date: todayKey,
    time: timeStr,
    relatedScheduleId: relatedScheduleSelected.value || null,
    imageUrls: []
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
  updateSettings({ morningPushEnabled: !settings.value.morningPushEnabled })
  refreshState()
  uni.showToast({
    title: settings.value.morningPushEnabled ? '晨间推送已关闭' : '晨间推送已开启',
    icon: 'none'
  })
}

const setMorningPushTime = (event) => {
  const value = event.detail.value
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

const openAuthModal = (mode) => {
  authMode.value = mode
  authEmail.value = ''
  authPassword.value = ''
  showAuthModal.value = true
}

const submitAuth = async () => {
  authLoading.value = true
  try {
    const code = await new Promise((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: (res) => {
          if (res && res.code) resolve(res.code)
          else reject(new Error('微信登录失败，未返回 code'))
        },
        fail: (err) => reject(err)
      })
    })

    const response = await api.wechatLogin(code)
    setSessionLocal({ userId: response.user.id, token: response.token, email: response.user.email || null })
    refreshState()
    showAuthModal.value = false
    uni.showToast({ title: '登录成功', icon: 'success' })
    // Sync data from server after login
    loadServerData()
  } catch (err) {
    uni.showToast({ title: err.message || '请求失败', icon: 'none' })
  } finally {
    authLoading.value = false
  }
}

onMounted(() => {
  loadServerData()
})
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
.active-switch { background-color: #ffffff; color: #3B82F6; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }

.calendar-grid { padding: 0 8px 12px 8px; }
.week-days { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 6px; }
.day-label { text-align: center; font-size: 12px; color: #94a3b8; font-weight: 500; }
.dates-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.date-cell { height: 56px; border: 1px solid #f8fafc; border-radius: 8px; display: flex; flex-direction: column; align-items: center; position: relative; }
.empty-cell { height: 56px; }
.is-today { background-color: rgba(74, 144, 226, 0.08); }
.date-num { font-size: 13px; color: #334155; margin-top: 4px; font-weight: 500; }
.today-num { width: 28px; height: 28px; background: linear-gradient(135deg, #4A90E2 0%, #3B82F6 100%); color: #ffffff; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 700; font-size: 13px; box-shadow: 0 6px 18px rgba(59,130,246,0.18); }

.tags-row { display: flex; gap: 2px; margin-top: 6px; width: 100%; justify-content: center; padding: 0 4px; box-sizing: border-box; }
.tag-line { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin: 0 3px; box-shadow: 0 1px 2px rgba(16,24,40,0.06); }
.bg-main { background-color: #3B82F6; }
.bg-orange { background-color: #FFA500; }
.bg-green { background-color: #50C878; }

.today-section { padding: 16px; background-color: #ffffff; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-title { font-size: 16px; font-weight: bold; color: #1e293b; }
.section-sub { font-size: 12px; color: #94a3b8; }
.task-list { display: flex; flex-direction: column; gap: 12px; }
.task-item { display: flex; align-items: center; padding: 14px 16px; background-color: #ffffff; border: 1px solid #eef2f6; border-radius: 16px; box-shadow: 0 8px 24px rgba(16,24,40,0.06); position: relative; overflow: hidden; transition: transform 0.14s ease; }
.task-item:hover { transform: translateY(-4px); }
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
.text-blue { color: #3B82F6; }
.switch-ui { width: 40px; height: 20px; border-radius: 10px; background: #e5e7eb; position: relative; transition: background-color 0.2s; }
.active-toggle { background: #3B82F6; }
.switch-knob { width: 16px; height: 16px; background: #fff; border-radius: 50%; position: absolute; right: 2px; top: 2px; box-shadow: 0 1px 2px rgba(0,0,0,0.2); transition: all 0.2s; }
.knob-off { right: 22px !important; }

.timeline-container { border-left: 2px solid #E5E5E5; margin-left: 8px; padding-bottom: 20px; }
.timeline-section { position: relative; padding-left: 24px; margin-bottom: 28px; }
.timeline-node { position: absolute; border-radius: 50%; }
.node-blue { width: 8px; height: 8px; background: #3B82F6; left: -6px; top: 6px; }
.node-green { width: 6px; height: 6px; background: #50C878; left: -5px; top: 6px; }
.node-gray { width: 6px; height: 6px; background: #999999; left: -5px; top: 6px; }
.section-title { font-size: 14px; font-weight: bold; color: #333; margin-bottom: 12px; display: block; }
.text-light-gray { color: #9ca3af; }

.task-list-timeline { display: flex; flex-direction: column; gap: 12px; }
.task-card { background: #fff; border: 1px solid #f3f4f6; padding: 12px; border-radius: 14px; box-shadow: 0 8px 20px rgba(16,24,40,0.04); position: relative; }
.task-time-left, .task-date-left { position: absolute; left: -56px; top: 12px; font-size: 12px; color: #333; font-weight: 500; width: 48px; text-align: right; }
.task-date-left { color: #6b7280; }
.task-card-content { display: flex; justify-content: space-between; align-items: flex-start; }
.task-info { display: flex; flex-direction: column; align-items: flex-start; }
.task-actions { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.action-btn { font-size: 11px; color: #64748b; }
.task-title { font-size: 14px; font-weight: 500; color: #374151; }
.text-red { color: #ef4444; }
.text-gray { color: #4b5563; }
.task-desc { font-size: 12px; color: #9ca3af; margin-top: 4px; display: block; }
.task-tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 6px; }
.circle-check { width: 20px; height: 20px; border: 2px solid #cbd5e1; border-radius: 50%; }
.card-expired { background: #f9fafb; opacity: 0.7; }

/* completed task dimming */
.card-completed { opacity: 0.6; }

/* week grid */
.week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
.week-grid .date-cell { padding: 10px; background: #fff; border-radius: 10px; border: 1px solid #f3f4f6; display: flex; flex-direction: column; align-items: center; }

/* ==========================================================================
   板块样式 3：生活动态 (竖版左侧日期布局)
   ========================================================================== */
.moments-view { flex: 1; display: flex; flex-direction: column; height: 100%; background: #ededed; overflow: hidden; }

/* 顶部标题栏 */
.moments-top-bar { padding: 16px 20px 12px; background: #ededed; flex-shrink: 0; }
.moments-title { font-size: 18px; font-weight: 700; color: #1a1a1a; display: block; }

.moments-scroll { flex: 1; overflow-y: auto; }
.moments-list { padding: 0 12px 80px 12px; }

/* 卡片 - 左侧日期 + 右侧内容 */
.moment-card {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  background: #fff;
  margin-bottom: 8px;
  border-radius: 4px;
  padding: 14px 0;
}

/* 左侧日期栏 */
.moment-date-col {
  width: 52px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 2px;
}
.moment-date-day {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  line-height: 1.2;
}
.moment-date-weekday {
  font-size: 11px;
  color: #999;
  margin-top: 1px;
}

/* 右侧主内容 */
.moment-main {
  flex: 1;
  min-width: 0;
  padding-right: 12px;
}

/* 头部：头像 + 昵称 + 时间 */
.moment-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 6px;
}
.moment-avatar {
  width: 38px;
  height: 38px;
  border-radius: 4px;
  background: #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 8px;
}
.moment-avatar-text { font-size: 20px; }
.moment-header-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 38px;
}
.moment-nickname {
  font-size: 14px;
  font-weight: 600;
  color: #576b95;
  margin-bottom: 1px;
  line-height: 1.3;
}
.moment-time {
  font-size: 11px;
  color: #9a9a9a;
  line-height: 1.3;
}

/* 正文 */
.moment-body {
  margin-left: 46px;
  margin-bottom: 6px;
}
.moment-content {
  font-size: 15px;
  color: #1f1f1f;
  line-height: 1.55;
  word-break: break-all;
  white-space: pre-wrap;
  display: block;
}
.moment-content-folded {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 6;
  overflow: hidden;
}
.moment-expand-btn {
  font-size: 14px;
  color: #576b95;
  display: inline-block;
  margin-top: 2px;
}

/* 图片九宫格 */
.moment-images-grid {
  margin-left: 46px;
  margin-bottom: 6px;
  display: grid;
  gap: 2px;
  max-width: 220px;
}
.grid-col-1 { grid-template-columns: 1fr; max-width: 170px; }
.grid-col-2 { grid-template-columns: repeat(2, 1fr); max-width: 190px; }
.grid-col-3 { grid-template-columns: repeat(3, 1fr); max-width: 220px; }

.moment-image-wrap {
  width: 100%;
  padding-top: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 2px;
  background: #f0f0f0;
}
.moment-image-single {
  padding-top: 75%;
  max-width: 170px;
}
.moment-image {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

/* 关联日程 */
.moment-schedule-link {
  margin-left: 46px;
  margin-bottom: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 5px 8px;
  max-width: 230px;
}
.moment-link-icon { font-size: 12px; }
.moment-link-text {
  font-size: 12px;
  color: #576b95;
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

/* 底部操作栏 */
.moment-actions {
  margin-left: 46px;
  margin-top: 2px;
  padding-top: 8px;
  display: flex;
  gap: 20px;
  position: relative;
}
.moment-actions::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 16px;
  height: 0.5px;
  background: #e5e5e5;
}
.moment-action-item { display: flex; align-items: center; }
.moment-action-text { font-size: 13px; color: #999; }

/* 空状态 */
.moments-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  background: #fff;
  border-radius: 4px;
}
.empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.4; }
.empty-text { font-size: 14px; color: #999; }

/* FAB 发布按钮 */
.moments-fab { position: fixed; right: 18px; bottom: 84px; width: 50px; height: 50px; border-radius: 50%; background: #07c160; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 12px rgba(7,193,96,0.3); z-index: 10; }
.moments-fab-icon { color: #fff; font-size: 22px; }

/* ==========================================================================
   板块样式 4：个人中心
   ========================================================================== */
.profile-view { min-height: 100%; background: #f8fafc; }
.profile-header { background: #3B82F6; padding: 40px 24px 32px; border-radius: 0 0 32px 32px; box-shadow: 0 6px 18px rgba(59,130,246,0.18); }
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
.icon-left { font-size: 14px; color: #d1d5db; font-family: monospace; margin-right: 8px; }

/* ==========================================================================
   全局通用导航栏
   ========================================================================== */
.tab-bar { position: fixed; bottom: 0; left: 0; width: 100%; height: 70px; background-color: rgba(255,255,255,0.88); backdrop-filter: blur(8px); display: flex; justify-content: space-around; align-items: center; border-top: 1px solid rgba(230,236,246,0.9); padding-bottom: env(safe-area-inset-bottom); z-index: 99; box-shadow: 0 -6px 24px rgba(16,24,40,0.04); }
.tab-item { display: flex; flex-direction: column; align-items: center; color: #94a3b8; width: 60px; }
.tab-active { color: #3B82F6; }
.tab-icon { font-size: 22px; margin-bottom: 2px; }
.tab-text { font-size: 10px; font-weight: 600; }

/* ==========================================================================
   右下角悬浮按钮组(FAB)
   ========================================================================== */
.fab-group { position: fixed; right: 16px; bottom: 84px; display: flex; flex-direction: column; gap: 12px; z-index: 99; }
.fab-ai { width: 44px; height: 44px; border-radius: 50%; background-color: #ffffff; color: #3B82F6; display: flex; justify-content: center; align-items: center; box-shadow: 0 6px 18px rgba(16,24,40,0.06); border: 1px solid rgba(59,130,246,0.12); font-size: 18px; }
.fab-add { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg,#4A90E2 0%, #3B82F6 100%); color: #ffffff; display: flex; justify-content: center; align-items: center; box-shadow: 0 14px 36px rgba(59,130,246,0.28); font-size: 30px; }

/* ==========================================================================
   全局弹窗机制样式
   ========================================================================== */
.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.4); z-index: 999; display: flex; flex-direction: column; justify-content: flex-end; }
.modal-content { background-color: #ffffff; border-radius: 24px 24px 0 0; padding: 20px; box-sizing: border-box; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.ai-modal { min-height: 320px; }
.ai-title { color: #3B82F6; font-weight: bold; font-size: 17px; }
.close-btn { background-color: #f1f5f9; width: 24px; height: 24px; text-align: center; border-radius: 50%; line-height: 22px; color: #64748b; font-size: 16px; }

.ai-tips { font-size: 13px; color: #64748b; margin-bottom: 12px; display: block; line-height: 1.4; }
.ai-input-area { position: relative; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px; }
.ai-textarea { width: 100%; height: 100px; font-size: 15px; color: #334155; line-height: 1.5; }
.ai-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.mic-btn { width: 32px; height: 32px; background-color: #ffffff; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-size: 16px; }
.send-btn { width: 32px; height: 32px; background-color: #e2e8f0; color: #94a3b8; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 16px; transition: all 0.2s; }
.send-active { background-color: #3B82F6; color: #ffffff; box-shadow: 0 6px 18px rgba(59,130,246,0.18); }

/* AI 结果确认卡片 */
.ai-result-card { background-color: #f0f7ff; border: 1px solid #e0f2fe; border-radius: 14px; padding: 16px; margin-bottom: 20px; }
.result-card-title { font-size: 17px; font-weight: bold; color: #1e293b; margin-bottom: 10px; display: block; }
.result-line { font-size: 14px; color: #475569; display: block; margin-bottom: 6px; }
.text-blue { color: #3B82F6; font-weight: bold; }
.modal-btn-group { display: flex; gap: 12px; }
.btn-secondary { flex: 1; height: 44px; line-height: 44px; background-color: #f1f5f9; color: #475569; font-size: 15px; font-weight: 500; border-radius: 12px; border: none; text-align: center; }
.btn-primary { flex: 1; height: 44px; line-height: 44px; background-color: #3B82F6; color: #ffffff; font-size: 15px; font-weight: 500; border-radius: 12px; box-shadow: 0 8px 22px rgba(59,130,246,0.16); border: none; text-align: center; }

/* 常规添加日程 / 动态弹窗表单样式 */
.add-modal { height: 85vh; display: flex; flex-direction: column; }
.add-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
.btn-cancel { color: #94a3b8; font-size: 15px; }
.btn-save { color: #3B82F6; font-size: 15px; font-weight: bold; }
.add-modal-title { font-size: 16px; font-weight: bold; color: #333333; }
.add-form { padding-top: 20px; display: flex; flex-direction: column; gap: 20px; }
.input-title { width: 100%; font-size: 20px; font-weight: bold; color: #333333; height: 40px; }
.form-row { display: flex; align-items: center; gap: 12px; }
.row-icon { font-size: 18px; width: 24px; text-align: center; }
.row-text { font-size: 15px; color: #334155; }
.schedule-selector { display: flex; align-items: center; gap: 8px; }
.schedule-list { display: flex; flex-direction: column; gap: 8px; }
.schedule-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; }
.schedule-item-active { border-color: #3B82F6; background-color: #f0f7ff; }
.schedule-item-title { font-size: 13px; color: #1f2937; }
.schedule-item-time { font-size: 12px; color: #64748b; }
.category-options { display: flex; gap: 8px; }
.opt-badge { padding: 4px 14px; font-size: 12px; background-color: #f1f5f9; color: #64748b; border-radius: 20px; }
.opt-active { background-color: #3B82F6; color: #ffffff; font-weight: 500; }
.form-textarea { width: 100%; height: 120px; background-color: #f8fafc; border-radius: 12px; padding: 12px; box-sizing: border-box; font-size: 14px; }
</style>