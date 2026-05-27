<template>
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
      <view class="switch-ui active-switch">
        <view class="switch-knob"></view>
      </view>
    </view>

    <!-- 时间轴容器 -->
    <view class="timeline-container">
      
      <!-- 今日剩余待办 -->
      <view class="timeline-section">
        <view class="timeline-node node-blue"></view>
        <text class="section-title">今日剩余</text>
        <view class="task-list">
          <view class="task-card" v-for="task in todayTasks" :key="task.id">
            <text class="task-time-left">{{ task.time }}</text>
            <view class="task-content">
              <view class="task-info">
                <!-- 高优先级标红 -->
                <text class="task-title" :class="{'text-red': task.priority === 3}">{{ task.title }}</text>
                <view class="task-tag" :style="{ color: task.color, backgroundColor: task.color + '20' }">
                  {{ task.category }}
                </view>
              </view>
              <view class="circle-check"></view>
            </view>
          </view>
        </view>
      </view>

      <!-- 未来待办 -->
      <view class="timeline-section">
        <view class="timeline-node node-green"></view>
        <text class="section-title">未来待办</text>
        <view class="task-list">
          <view class="task-card" v-for="task in futureTasks" :key="task.id">
            <text class="task-date-left">{{ task.date }}</text>
            <view class="task-content">
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
        <view class="task-list">
          <view class="task-card card-expired" v-for="task in pastTasks" :key="task.id">
            <text class="task-date-left text-light-gray">{{ task.date }}</text>
            <text class="task-title line-through">{{ task.title }}</text>
          </view>
        </view>
      </view>

    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

// Mock数据，模拟后端返回的分类提醒数据
const todayTasks = ref([
  { id: 1, title: '计算机网络大作业提交', time: '14:00', category: '学习', priority: 3, color: '#4A90E2' },
  { id: 2, title: '社团例会', time: '19:00', category: '生活', priority: 2, color: '#50C878' }
])
const futureTasks = ref([
  { id: 3, title: '奶茶店兼职', time: '14:00', date: '05-16', category: '工作', color: '#FFA500' }
])
const pastTasks = ref([
  { id: 4, title: '公众号推文排版', time: '20:00', date: '05-13' }
])
</script>

<style scoped>
.reminder-view { padding: 16px; min-height: 100%; background: #fff; }
.page-title { font-size: 20px; font-weight: bold; color: #333; margin-bottom: 20px; display: block; }
.morning-banner { background: #f0f7ff; border: 1px solid #e0f2fe; border-radius: 12px; padding: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.banner-left { display: flex; align-items: center; gap: 8px; }
.banner-text { font-size: 14px; color: #374151; font-weight: 500; }
.text-blue { color: #4A90E2; }
.switch-ui { width: 40px; height: 20px; border-radius: 10px; background: #e5e7eb; position: relative; }
.active-switch { background: #4A90E2; }
.switch-knob { width: 16px; height: 16px; background: #fff; border-radius: 50%; position: absolute; right: 2px; top: 2px; box-shadow: 0 1px 2px rgba(0,0,0,0.2); }

.timeline-container { border-left: 2px solid #E5E5E5; margin-left: 8px; padding-bottom: 20px; }
.timeline-section { position: relative; padding-left: 24px; margin-bottom: 28px; }
.timeline-node { position: absolute; border-radius: 50%; }
.node-blue { width: 10px; height: 10px; background: #4A90E2; left: -6px; top: 4px; }
.node-green { width: 8px; height: 8px; background: #50C878; left: -5px; top: 4px; }
.node-gray { width: 8px; height: 8px; background: #d1d5db; left: -5px; top: 4px; }
.section-title { font-size: 14px; font-weight: bold; color: #333; margin-bottom: 12px; display: block; }
.text-light-gray { color: #9ca3af; }

.task-list { display: flex; flex-direction: column; gap: 12px; }
.task-card { background: #fff; border: 1px solid #f3f4f6; padding: 12px; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.02); position: relative; }
.task-time-left, .task-date-left { position: absolute; left: -56px; top: 12px; font-size: 12px; color: #333; font-weight: 500; width: 48px; text-align: right; }
.task-date-left { color: #6b7280; }
.task-content { display: flex; justify-content: space-between; align-items: flex-start; }
.task-title { font-size: 14px; font-weight: 500; color: #374151; }
.text-red { color: #ef4444; }
.text-gray { color: #4b5563; }
.task-desc { font-size: 12px; color: #9ca3af; margin-top: 4px; display: block; }
.task-tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 6px; }
.circle-check { width: 20px; height: 20px; border: 2px solid #d1d5db; border-radius: 50%; }

.card-expired { background: #f9fafb; opacity: 0.7; }
.line-through { text-decoration: line-through; color: #9ca3af; }
</style>