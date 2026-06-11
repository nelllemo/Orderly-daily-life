部署说明（快速参考）

前提
- 在云服务器上已安装 Node.js (>=14) 与 MySQL
- 将本仓库上传到服务器并进入 `server` 目录
- 在服务器上生成或上传自签名证书（小程序要求 HTTPS）

1) 配置环境变量
复制 `.env.example` 为 `.env` 并填写：
- `DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`
- `WECHAT_APPID`、`WECHAT_APPSECRET`
- `JWT_SECRET`（设置为随机长字符串）
- `SSL_KEY_PATH`、`SSL_CERT_PATH`（自签名证书完整路径）
- `HTTPS_PORT`（默认 8443）

示例：

```
PORT=5080
JWT_SECRET=replace-with-strong-secret
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=you
DB_PASSWORD=secret
DB_NAME=youxurichang
WECHAT_APPID=wxxxxx
WECHAT_APPSECRET=yyyyyy
SSL_KEY_PATH=/etc/ssl/private/orderly.key
SSL_CERT_PATH=/etc/ssl/certs/orderly.crt
HTTPS_PORT=8443
```

2) 安装依赖并初始化数据库

```bash
cd server
npm install
# 创建数据库并运行 schema
node scripts/init_db.js
```

3) 生成自签名证书（示例，线上请使用真实证书）

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout orderly.key -out orderly.crt -subj "/CN=106.14.59.166"
# 将 orderly.key 和 orderly.crt 放到服务器上你在 .env 中配置的路径
```

4) 启动服务（使用 pm2）

```bash
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 logs
```

5) 小程序端注意事项
- 小程序域名必须为 HTTPS 的域名或 IP（在测试环境使用自签名证书并信任证书）
- 客户端改为调用 `https://<IP>:<HTTPS_PORT>/api`，并在登录时调用 `uni.login()` 获取 `code` 然后 POST 到 `/api/auth/wechat` 获取 JWT

常见问题
- MySQL 连接失败：检查 `DB_HOST`/`DB_USER`/`DB_PASSWORD`，并确保防火墙放行本地端口
- 证书被拒绝：在测试设备上手动信任自签名证书，或使用真实 CA 证书

如需我：
- 生成适用于 Windows/WSL 的 OpenSSL 命令或证书打包脚本
- 生成 systemd 服务文件而非 PM2
- 或直接帮你在服务器上运行初始化（需要你提供 SSH / 远程权限）
