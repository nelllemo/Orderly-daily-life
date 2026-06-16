# 有序日常 — 云服务器部署指南

> 适用环境：腾讯云 / 阿里云轻量应用服务器，CentOS 7+ / Ubuntu 20.04+
> 目标：部署后在手机浏览器通过 `http://服务器IP:5080` 访问完整项目

---

## 一、准备工作

### 1.1 购买云服务器
- 推荐：腾讯云轻量应用服务器（2核2G以上，系统选 CentOS 7.9 或 Ubuntu 20.04）
- 获取服务器公网 IP（例如 `106.14.59.166`）

### 1.2 开放防火墙端口
在云服务器控制台的「防火墙/安全组」中添加规则：

| 端口 | 协议 | 说明 |
|------|------|------|
| 5080 | TCP | HTTP 服务端口（后端+前端） |
| 3306 | TCP | MySQL（可选，仅本机访问可不开） |
| 22   | TCP | SSH 远程登录 |

### 1.3 连接到服务器
```bash
ssh root@你的服务器IP
```

---

## 二、安装运行环境

### 2.1 安装 Node.js（推荐 18.x LTS）
**CentOS：**
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
yum install -y nodejs
```

**Ubuntu：**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
apt install -y nodejs
```

验证安装：
```bash
node -v   # 应显示 v18.x
npm -v    # 应显示 9.x+
```

### 2.2 安装 MySQL
**CentOS：**
```bash
yum install -y mysql-server
systemctl start mysqld
systemctl enable mysqld
```

**Ubuntu：**
```bash
apt update
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql
```

### 2.3 配置 MySQL
```bash
# 登录 MySQL（CentOS 首次需查临时密码: grep 'temporary password' /var/log/mysqld.log）
mysql -u root -p
```

在 MySQL 命令行中执行：
```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS youxurichang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建专用用户（替换 your_password 为强密码）
CREATE USER 'yxrc'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON youxurichang.* TO 'yxrc'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 三、部署项目

### 3.1 上传代码到服务器

**方式一：Git 克隆（推荐）**
```bash
cd /home
git clone https://github.com/nelllemo/Orderly-daily-life.git
cd Orderly-daily-life
```

**方式二：手动上传**
在本地将项目文件夹压缩为 zip，通过 `scp` 上传后解压。

### 3.2 构建前端 H5 版本
在 **本地 HBuilderX** 中构建 H5 版本：

1. 打开 HBuilderX，载入项目
2. 菜单栏 → 发行 → 网站-H5手机版
3. 构建完成后，产物在 `unpackage/dist/build/h5/` 目录
4. 将整个 `h5` 目录内容上传到服务器的 `dist/` 目录

**上传 dist 到服务器：**
```bash
# 在本地执行（替换为你的服务器IP）
scp -r unpackage/dist/build/h5/* root@你的服务器IP:/home/Orderly-daily-life/dist/
```

在服务器上创建 dist 目录（如果不存在）：
```bash
mkdir -p /home/Orderly-daily-life/dist
```

### 3.3 配置环境变量
```bash
cd /home/Orderly-daily-life/server
cp .env.example .env
```

编辑 `.env` 文件：
```bash
vi .env
```

修改以下内容（按实际情况填写）：
```env
PORT=5080
JWT_SECRET=替换为一个随机字符串(至少32位)
AI_ENDPOINT=https://你的AI接口地址
AI_API_KEY=你的AI接口密钥

STATIC_DIR=../../dist

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=yxrc
DB_PASSWORD=你设置的数据库密码
DB_NAME=youxurichang

# 微信小程序（可选，H5端暂不使用可留空）
WECHAT_APPID=
WECHAT_APPSECRET=

# HTTPS（可选，仅HTTP访问时留空即可）
SSL_KEY_PATH=
SSL_CERT_PATH=
```

生成随机 JWT_SECRET（复制输出结果填入）：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.4 初始化数据库表
```bash
cd /home/Orderly-daily-life/server
npm install
node scripts/init_db.js
```

看到 `Schema applied successfully.` 即成功。

### 3.5 启动服务
```bash
cd /home/Orderly-daily-life/server
node src/index.js
```

看到输出：
```
Serving static files from: /home/Orderly-daily-life/dist
HTTP server listening on 5080
```

### 3.6 验证部署
在手机浏览器访问：
```
http://你的服务器IP:5080
```

应能看到"有序日常"主页面，说明部署成功。

测试 API 健康检查：
```
http://你的服务器IP:5080/api/health
```
返回 `{"status":"ok","timestamp":"..."}` 即正常。

---

## 四、后台运行（保持服务常驻）

### 4.1 使用 PM2（推荐）
```bash
npm install -g pm2
cd /home/Orderly-daily-life/server
pm2 start src/index.js --name "yxrc"
pm2 save
pm2 startup   # 设置开机自启（按提示执行输出的命令）
```

常用 PM2 命令：
```bash
pm2 status          # 查看运行状态
pm2 logs yxrc       # 查看日志
pm2 restart yxrc    # 重启服务
pm2 stop yxrc       # 停止服务
```

### 4.2 使用 nohup（简单备用方案）
```bash
nohup node src/index.js > /home/Orderly-daily-life/server/app.log 2>&1 &
```

---

## 五、手机端使用

1. 打开手机浏览器（Chrome / Safari）
2. 地址栏输入 `http://你的服务器IP:5080`
3. 首次加载后，可将页面添加到手机主屏幕（浏览器菜单 → 添加到主屏幕）
4. 游客模式下可直接使用基本功能（数据存手机本地）
5. 登录后数据自动同步到云端数据库

---

## 六、常见问题

### Q: 手机访问不了怎么办？
1. 确认服务器防火墙/安全组已开放 5080 端口
2. 在服务器上执行 `curl http://localhost:5080/api/health` 确认服务已启动
3. 检查手机和服务器网络是否可达

### Q: 数据库连接失败？
```bash
# 测试数据库连接
mysql -u yxrc -p -h 127.0.0.1 youxurichang
# 确认 .env 中密码正确
```

### Q: 页面打开是空白？
1. 确认 `dist/` 目录下有 `index.html`
2. 查看服务器终端日志是否有报错
3. 检查 `STATIC_DIR` 路径是否正确（相对 server/src 目录的路径）

### Q: 如何更新代码？
```bash
cd /home/Orderly-daily-life
git pull
cd server
npm install           # 如有依赖更新
pm2 restart yxrc      # 重启服务
# 如前端有更新，重新构建 H5 并上传 dist 目录
```

---

## 七、项目结构速览

```
Orderly-daily-life/
├── dist/                 # ★ H5前端构建产物（需手动上传）
├── pages/                # uni-app 页面源码
├── components/           # uni-app 组件源码
├── services/             # 前端服务层（API、本地存储）
├── server/               # ★ 后端服务
│   ├── src/
│   │   ├── index.js      # 服务入口（Express）
│   │   ├── db.js         # 数据库连接池
│   │   ├── schema.sql    # 数据库表结构
│   │   ├── middleware/   # JWT 认证中间件
│   │   └── routes/       # API 路由
│   ├── scripts/
│   │   └── init_db.js    # 数据库初始化脚本
│   ├── .env              # ★ 环境变量配置
│   └── package.json
└── 需求说明.txt           # 需求文档
```
