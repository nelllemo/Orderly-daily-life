<template>
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
            v-for="item in dates" 
            :key="item.date"
            @click="activeDate = item.date"
          >
            <text class="date-text">{{ item.isToday ? '今日' : item.date }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 动态时间线列表 -->
    <view class="dynamics-list">
      <view class="dynamic-card" v-for="dyn in dynamics" :key="dyn.id">
        <view class="dyn-header">
          <text class="dyn-time">{{ dyn.date }} · {{ dyn.time }}</text>
        </view>
        <text class="dyn-content">{{ dyn.text }}</text>
        
        <!-- 模拟图片占位 -->
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

    <!-- 发布悬浮按钮 -->
    <view class="fab-publish">+</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const activeDate = ref('05-15')
const dates = ref([
  { date: '05-15', isToday: true }, { date: '05-14' }, { date: '05-13' },
  { date: '05-12' }, { date: '05-11' }, { date: '05-10' }
])

const dynamics = ref([
  { id: 1, text: '今天终于把网络大作业搞定了，框架报错调了整整三个小时！好在最后跑通了，给自己加个鸡腿 🍗', date: '05-15', time: '15:30', relatedSchedule: '计算机网络大作业提交', hasImage: false },
  { id: 2, text: '阳光正好，在操场跑了5公里，感觉一整天的疲惫都消失了。', date: '05-14', time: '21:00', relatedSchedule: null, hasImage: true }
])
</script>

<style scoped>
.dynamics-view { min-height: 100%; background: #f8fafc; position: relative; }
.sticky-header { position: sticky; top: 0; background: #fff; z-index: 10; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
.page-header { padding: 12px 16px; }
.page-title { font-size: 20px; font-weight: bold; color: #333; }

.date-filter-scroll { height: 52px; white-space: nowrap; padding-bottom: 8px; }
.date-filter-container { display: flex; padding: 0 16px; gap: 8px; align-items: center; height: 100%; }
.date-btn { width: 44px; height: 32px; background: #f3f4f6; border-radius: 8px; display: inline-flex; justify-content: center; align-items: center; flex-shrink: 0; }
.date-text { font-size: 12px; color: #666; font-weight: 500; }
.date-active { background: #4A90E2; }
.date-active .date-text { color: #fff; }
.date-today { border: 1.5px solid #FFA500; }

.dynamics-list { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
.dynamic-card { background: #fff; padding: 16px; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); border: 1px solid #f3f4f6; }
.dyn-header { margin-bottom: 12px; }
.dyn-time { font-size: 12px; color: #9ca3af; font-weight: 500; }
.dyn-content { font-size: 15px; color: #333; line-height: 1.5; margin-bottom: 12px; display: block; word-break: break-all; }
.dyn-image-placeholder { width: 100%; height: 120px; background: #f3f4f6; border: 1px dashed #d1d5db; border-radius: 8px; display: flex; justify-content: center; align-items: center; margin-bottom: 12px; font-size: 32px; }
.dyn-schedule-link { display: inline-flex; align-items: center; gap: 4px; background: #f0f7ff; border: 1px solid #e0f2fe; padding: 6px 10px; border-radius: 6px; }
.link-icon { font-size: 12px; }
.link-text { font-size: 11px; color: #4A90E2; font-weight: 500; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.fab-publish { position: fixed; right: 16px; bottom: 84px; width: 56px; height: 56px; border-radius: 50%; background: #4A90E2; color: #fff; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4); font-size: 28px; z-index: 10; }
</style>