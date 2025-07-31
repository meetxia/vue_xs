const express = require('express');
const path = require('path');

// 导入配置和模块
const config = require('./server/config');
const { setupMiddleware, errorHandler, notFoundHandler } = require('./server/middleware');
const routes = require('./server/routes');

const app = express();

// 设置基础中间件
setupMiddleware(app);

// 注册API路由
app.use('/api', routes);

// 页面路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/read', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'read.html'));
});

app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 404和错误处理
app.use('*', notFoundHandler);
app.use(errorHandler);

// 启动服务器
app.listen(config.PORT, () => {
    console.log(`
🚀 小红书风格小说网站服务器启动成功！
📍 端口: ${config.PORT}
🌐 本地访问: http://localhost:${config.PORT}
📡 API接口: http://localhost:${config.PORT}/api
⏰ 启动时间: ${new Date().toLocaleString()}
    `);
});

module.exports = app;