<template>
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
          <text class="stat-num">42</text>
          <text class="stat-label">完成日程</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-num">15</text>
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
        <view class="menu-row no-border">
          <view class="menu-left">
            <text class="menu-icon" style="color: #ef4444;">🚪</text>
            <text class="menu-text text-red">退出登录</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
// Profile View 无复杂交互逻辑，主要为页面跳转，暂不需要核心状态
</script>

<style scoped>
.profile-view { min-height: 100%; background: #f8fafc; }
.profile-header { background: #4A90E2; padding: 40px 24px 32px; border-radius: 0 0 32px 32px; box-shadow: 0 4px 6px rgba(74, 144, 226, 0.2); }
.user-info { display: flex; align-items: center; gap: 16px; }
.avatar-box { width: 64px; height: 64px; border-radius: 50%; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.5); display: flex; justify-content: center; align-items: center; font-size: 32px; }
.text-info { display: flex; flex-direction: column; gap: 4px; }
.user-name { font-size: 20px; font-weight: bold; color: #fff; }
.user-sub { font-size: 14px; color: #dbeafe; }

.profile-content { padding: 0 16px; margin-top: 24px; display: flex; flex-direction: column; gap: 16px; }
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
</style>