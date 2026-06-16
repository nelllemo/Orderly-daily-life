# 有序日常 (Orderly Daily Life)

基于 uni-app (Vue 3) 的日常计划与生活记录应用，支持 H5、微信小程序及 App 多端运行。后端采用 Express + MySQL，提供用户认证、日程管理、动态发布、AI 助手及文件上传等完整 API。

## 功能模块

### 日历视图 (CalendarView)
- 月视图日期网格，展示每日待办事项
- 分类标签与优先级标记（高/中/低）
- 点击日期查看当日详情，快速添加日程

### 提醒中心 (ReminderView)
- 时间轴布局，分段展示今日剩余、未来待办与已过期任务
- 一目了然的倒计时与过期高亮

### 生活动态 (DynamicsView)
- 按日期筛选的动态时间线
- 支持发布文字动态并关联日程
- 竖版左侧日期布局

### 个人中心 (ProfileView)
- 完成率统计与动态数量统计
- 个人资料扩展（头像、昵称、简介等）
- 账号注册/登录/注销
- AI 成长简历
- 新用户引导

### AI 日程助手
- 输入口语化描述，自动解析为结构化日程
- 支持自然语言时间表达（如"明天下午3点开会"）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | uni-app (Vue 3) + Vite |
| 后端框架 | Express.js |
| 数据库 | MySQL |
| 认证 | JWT + bcryptjs |
| 文件上传 | multer |
| 进程管理 | PM2 |
| AI 集成 | 可配置的 AI API 端点 |

## 项目结构

```
├── pages/                  # uni-app 页面
│   └── index/index.vue     # 主入口页面（单页应用）
├── components/views/       # 四大模块视图组件
│   ├── CalendarView.vue    # 日历视图
│   ├── ReminderView.vue    # 提醒中心
│   ├── DynamicsView.vue    # 生活动态
│   └── ProfileView.vue     # 个人中心
├── services/               # 前端服务层
│   ├── api.js              # API 请求封装
│   ├── storage.js          # 本地存储管理
│   └── date.js             # 日期工具函数
├── server/                 # 后端服务
│   ├── src/
│   │   ├── index.js        # Express 服务入口
│   │   ├── db.js           # 数据库连接池
│   │   ├── schema.sql      # 数据库表结构
│   │   ├── middleware/      # JWT 认证中间件
│   │   └── routes/          # API 路由 (auth, ai, schedules, moments, upload)
│   ├── scripts/
│   │   └── init_db.js      # 数据库初始化脚本
│   └── uploads/            # 上传文件存储
├── static/                 # 静态资源
├── manifest.json           # uni-app 应用配置
├── pages.json              # 页面路由配置
├── vite.config.js          # Vite 构建配置
└── DEPLOY.md               # 云服务器部署指南
```

## 快速开始

### 前端开发

1. 使用 [HBuilderX](https://www.dcloud.io/hbuilderx.html) 打开项目
2. 通过菜单栏「运行 → 运行到浏览器」进行本地预览
3. 构建 H5 版本：「发行 → 网站-H5手机版」，产物输出至 `unpackage/dist/build/h5/`

### 后端开发

```bash
cd server
cp .env.example .env     # 编辑 .env 配置数据库与 JWT 等信息
npm install
node scripts/init_db.js  # 初始化数据库表
npm run dev               # 启动服务（默认端口 5080）
```

API 健康检查：`GET /api/health`

### API 端点

| 路径 | 说明 | 认证 |
|------|------|------|
| `GET /api/health` | 健康检查 | 无 |
| `/api/auth` | 注册、登录、注销 | 无 |
| `/api/ai` | AI 日程解析 | 无 |
| `/api/schedules` | 日程 CRUD | JWT |
| `/api/moments` | 动态 CRUD | JWT |
| `/api/upload` | 文件上传 | 无 |

## 部署

完整的云服务器部署指南（包括 MySQL 配置、PM2 进程守护、HTTPS 等）见 [DEPLOY.md](./DEPLOY.md)。

支持在本地构建 H5 后部署到服务器，或通过微信小程序 IDE 发布为小程序。

## License

Private — 个人项目
