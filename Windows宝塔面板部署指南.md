# 🚀 小红书风格小说网站 - Windows宝塔面板部署指南

## 📋 目录
- [部署前准备](#部署前准备)
- [宝塔面板基础配置](#宝塔面板基础配置)
- [Node.js环境安装](#nodejs环境安装)
- [项目文件上传](#项目文件上传)
- [环境变量配置](#环境变量配置)
- [PM2进程管理](#pm2进程管理)
- [Nginx反向代理](#nginx反向代理)
- [SSL证书配置](#ssl证书配置)
- [防火墙设置](#防火墙设置)
- [部署测试](#部署测试)
- [常见问题](#常见问题)

---

## 📝 部署前准备

### 🔍 环境检查清单

在开始部署前，请确保您的服务器满足以下要求：

#### ✅ **服务器要求**
- [ ] Windows Server 2016 或更高版本
- [ ] 至少 2GB RAM（推荐 4GB+）
- [ ] 至少 20GB 可用磁盘空间
- [ ] 稳定的网络连接

#### ✅ **宝塔面板要求**
- [ ] 宝塔Windows面板 7.0+ 版本
- [ ] 管理员权限访问
- [ ] 面板正常运行状态

#### ✅ **域名和SSL（可选）**
- [ ] 已备案的域名（如需公网访问）
- [ ] SSL证书文件（如需HTTPS）

### 📦 **需要准备的文件**
1. 项目源代码压缩包
2. `.env` 环境配置文件
3. SSL证书文件（可选）

---

## 🎛️ 宝塔面板基础配置

### 1. 登录宝塔面板

1. 打开浏览器，访问您的宝塔面板地址
   ```
   http://您的服务器IP:8888
   ```

2. 输入用户名和密码登录

3. 首次登录后，建议立即修改默认密码

### 2. 安装必要软件

在宝塔面板首页，点击"软件商店"，安装以下软件：

#### ✅ **必须安装**
- **Nginx** 1.20+ （Web服务器）
- **PM2管理器** 4.0+ （Node.js进程管理）

#### 📸 **操作截图说明**
```
软件商店 → 搜索"Nginx" → 点击"安装"
软件商店 → 搜索"PM2" → 点击"安装"
```

⚠️ **注意事项**：
- 安装过程可能需要几分钟，请耐心等待
- 确保安装完成后状态显示为"运行中"

---

## 🟢 Node.js环境安装

### 1. 安装Node.js版本管理器

1. 在宝塔面板中，点击"软件商店"
2. 搜索"Node.js版本管理器"
3. 点击"安装"

### 2. 安装Node.js

1. 安装完成后，点击"设置"
2. 选择Node.js版本（推荐 16.x 或 18.x）
3. 点击"安装选定版本"

### 3. 验证安装

在宝塔面板的"终端"中执行：

```bash
node --version
npm --version
```

✅ **预期结果**：
```
v18.17.0
9.6.7
```

⚠️ **常见问题**：
- 如果命令不存在，请重启宝塔面板
- 确保Node.js版本在16.0以上

---

## 📁 项目文件上传

### 1. 创建网站目录

1. 在宝塔面板中，点击"网站"
2. 点击"添加站点"
3. 填写以下信息：
   - **域名**：您的域名或服务器IP
   - **根目录**：`/www/wwwroot/novel-site`
   - **PHP版本**：选择"纯静态"

### 2. 上传项目文件

#### 方法一：通过宝塔文件管理器

1. 点击"文件"进入文件管理器
2. 导航到 `/www/wwwroot/novel-site`
3. 点击"上传"，选择您的项目压缩包
4. 上传完成后，右键点击压缩包选择"解压"

#### 方法二：通过FTP工具

1. 使用FileZilla等FTP工具
2. 连接信息在宝塔面板"FTP"中查看
3. 上传项目文件到指定目录

### 3. 设置目录权限

1. 在文件管理器中，右键点击项目根目录
2. 选择"权限"
3. 设置权限为 `755`
4. 勾选"应用到子目录"

### 4. 验证文件结构

确保目录结构如下：
```
/www/wwwroot/novel-site/
├── server.js
├── package.json
├── .env.example
├── public/
├── server/
├── data/
└── node_modules/ (稍后安装)
```

---

## ⚙️ 环境变量配置

### 1. 创建.env文件

1. 在项目根目录中，创建 `.env` 文件
2. 复制 `.env.example` 的内容
3. 根据您的服务器环境修改配置

### 2. 配置示例

```bash
# 生产环境配置
NODE_ENV=production
PORT=3000

# 安全配置
JWT_SECRET=your_super_secure_jwt_secret_key_here_at_least_32_characters
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_strong_admin_password_here

# 文件上传配置
UPLOAD_MAX_SIZE=5242880
MAX_TXT_FILE_SIZE=52428800
MAX_FILES=20

# HTTPS配置（可选）
ENABLE_HTTPS=false
HTTPS_PORT=3443

# 日志配置
LOG_LEVEL=error
LOG_FILE=./logs/app.log
```

### 3. 重要配置说明

#### 🔐 **安全配置**
- `JWT_SECRET`：必须修改为32位以上的随机字符串
- `ADMIN_PASSWORD`：管理员密码，建议使用强密码

#### 🌐 **网络配置**
- `PORT`：应用端口，默认3000
- `ENABLE_HTTPS`：是否启用HTTPS

⚠️ **安全提醒**：
- 绝不要将 `.env` 文件上传到公开仓库
- 定期更换JWT密钥和管理员密码

---

## 🔄 PM2进程管理

### 1. 安装项目依赖

在宝塔终端中，进入项目目录：

```bash
cd /www/wwwroot/novel-site
npm install
```

### 2. 配置PM2

1. 在宝塔面板中，点击"软件商店"
2. 找到"PM2管理器"，点击"设置"
3. 点击"添加项目"

### 3. PM2项目配置

填写以下信息：
- **项目名称**：`novel-site`
- **运行目录**：`/www/wwwroot/novel-site`
- **启动文件**：`server.js`
- **运行模式**：`fork`

### 4. 高级配置（可选）

创建 `ecosystem.config.js` 文件：

```javascript
module.exports = {
  apps: [{
    name: 'novel-site',
    script: 'server.js',
    cwd: '/www/wwwroot/novel-site',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    restart_delay: 1000,
    max_restarts: 10
  }]
}
```

### 5. 启动应用

在PM2管理器中：
1. 找到您的项目
2. 点击"启动"
3. 确认状态显示为"运行中"

✅ **验证方法**：
```bash
# 在终端中检查
pm2 list
pm2 logs novel-site
```

---

## 🌐 Nginx反向代理

### 1. 配置网站

1. 在宝塔面板"网站"中，找到您的站点
2. 点击"设置"
3. 选择"反向代理"标签

### 2. 添加反向代理

点击"添加反向代理"，填写：
- **代理名称**：`novel-site`
- **目标URL**：`http://127.0.0.1:3000`
- **发送域名**：`$host`

### 3. 高级配置

在"配置文件"中添加以下配置：

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # 支持WebSocket（如果需要）
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # 超时设置
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# 静态文件缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    proxy_pass http://127.0.0.1:3000;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 4. 重载Nginx配置

1. 保存配置文件
2. 在"软件商店"中找到Nginx
3. 点击"重载配置"

---

## 🔒 SSL证书配置

### 1. 申请SSL证书（免费）

1. 在网站设置中，点击"SSL"标签
2. 选择"Let's Encrypt"
3. 填写邮箱地址
4. 点击"申请"

### 2. 上传自有证书

如果您有自己的SSL证书：
1. 点击"其他证书"
2. 将证书内容粘贴到对应框中
3. 点击"保存"

### 3. 强制HTTPS

1. 开启"强制HTTPS"选项
2. 这将自动重定向HTTP到HTTPS

### 4. 配置应用支持HTTPS

在 `.env` 文件中：
```bash
ENABLE_HTTPS=true
HTTPS_PORT=3443
```

⚠️ **注意事项**：
- 确保域名已正确解析到服务器
- Let's Encrypt证书有效期90天，宝塔会自动续期

---

## 🛡️ 防火墙设置

### 1. 宝塔面板防火墙

1. 在宝塔面板中，点击"安全"
2. 在"防火墙"中添加规则：
   - **端口**：`3000`
   - **协议**：`TCP`
   - **策略**：`放行`
   - **备注**：`Node.js应用端口`

### 2. Windows防火墙

1. 打开Windows防火墙设置
2. 点击"高级设置"
3. 添加入站规则：
   - 端口：3000, 80, 443
   - 协议：TCP
   - 操作：允许连接

### 3. 云服务器安全组

如果使用云服务器，还需要在云控制台配置安全组：
- 开放端口：80, 443, 3000
- 协议：TCP
- 来源：0.0.0.0/0

---

## ✅ 部署测试

### 1. 基础功能测试

#### 🌐 **网站访问测试**
1. 打开浏览器访问：`http://您的域名`
2. 确认网站正常加载
3. 检查页面样式和功能

#### 🔐 **管理后台测试**
1. 访问：`http://您的域名/admin-login.html`
2. 使用配置的管理员账号登录
3. 测试管理功能

#### 📱 **移动端测试**
1. 使用手机浏览器访问
2. 检查响应式布局
3. 测试触摸操作

### 2. 性能测试

#### 📊 **服务器状态检查**
在宝塔面板"监控"中查看：
- CPU使用率 < 50%
- 内存使用率 < 70%
- 磁盘使用率 < 80%

#### ⚡ **页面加载速度**
- 首页加载时间 < 3秒
- 静态资源加载正常
- 图片显示正常

### 3. 安全测试

#### 🔒 **HTTPS测试**（如已配置）
1. 访问：`https://您的域名`
2. 检查浏览器地址栏显示安全锁图标
3. 确认证书有效

#### 🛡️ **安全功能测试**
1. 测试登录功能
2. 验证文件上传限制
3. 检查XSS防护

---

## ❓ 常见问题

### 🚨 **问题1：网站无法访问**

**症状**：浏览器显示"无法访问此网站"

**解决方案**：
1. 检查PM2进程是否运行：
   ```bash
   pm2 list
   ```
2. 检查端口是否被占用：
   ```bash
   netstat -an | findstr :3000
   ```
3. 检查防火墙设置
4. 重启Nginx服务

### 🚨 **问题2：500内部服务器错误**

**症状**：网页显示500错误

**解决方案**：
1. 查看PM2日志：
   ```bash
   pm2 logs novel-site
   ```
2. 检查 `.env` 文件配置
3. 确认文件权限正确
4. 重启应用：
   ```bash
   pm2 restart novel-site
   ```

### 🚨 **问题3：静态文件无法加载**

**症状**：CSS/JS文件404错误

**解决方案**：
1. 检查Nginx配置中的静态文件路径
2. 确认 `public` 目录存在且有正确权限
3. 重载Nginx配置

### 🚨 **问题4：SSL证书问题**

**症状**：HTTPS访问显示不安全

**解决方案**：
1. 检查证书是否过期
2. 确认域名与证书匹配
3. 重新申请Let's Encrypt证书
4. 检查证书链完整性

### 🚨 **问题5：上传功能异常**

**症状**：文件上传失败

**解决方案**：
1. 检查 `uploads` 目录权限
2. 确认文件大小限制配置
3. 查看应用日志排查错误
4. 检查磁盘空间是否充足

---

## 📞 技术支持

### 🔧 **日志查看命令**
```bash
# PM2日志
pm2 logs novel-site

# Nginx错误日志
tail -f /www/server/nginx/logs/error.log

# 应用日志
tail -f /www/wwwroot/novel-site/logs/app.log
```

### 📊 **性能监控**
```bash
# 查看进程状态
pm2 monit

# 查看系统资源
htop
```

### 🆘 **紧急重启**
```bash
# 重启应用
pm2 restart novel-site

# 重启Nginx
systemctl restart nginx

# 重启宝塔面板
bt restart
```

---

## 🎉 部署完成

恭喜！您已经成功将小红书风格小说网站部署到Windows服务器上。

### 📋 **部署后检查清单**
- [ ] 网站可以正常访问
- [ ] 管理后台功能正常
- [ ] 用户注册登录正常
- [ ] 文件上传功能正常
- [ ] 移动端显示正常
- [ ] HTTPS配置正确（如适用）
- [ ] 监控和日志正常

### 🚀 **下一步建议**
1. 设置定期备份
2. 配置监控告警
3. 优化性能设置
4. 定期更新依赖

**祝您的小说网站运营成功！** 📚✨
