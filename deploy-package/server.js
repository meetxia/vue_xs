const express = require('express');
const path = require('path');

// 导入配置和模块
const config = require('./server/config');
const { setupMiddleware, errorHandler, notFoundHandler, setupGlobalErrorHandlers } = require('./server/middleware');
const routes = require('./server/routes');
const { HTTPSConfig } = require('./server/config/https');

const app = express();

// 暂时注释掉全局错误处理器
// setupGlobalErrorHandlers();

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
if (process.env.ENABLE_HTTPS === 'true') {
    // 仅在明确启用HTTPS时使用HTTPS模式
    const httpsConfig = new HTTPSConfig(app, config);

    if (httpsConfig.loadSSLCertificates()) {
        httpsConfig.startServer();
    } else {
        console.error('❗ SSL证书加载失败，回退到HTTP模式');
        startHTTPServer();
    }
} else {
    // HTTP模式（默认）
    startHTTPServer();
}

function startHTTPServer() {
    app.listen(config.PORT, () => {
        const startupMessage = `
🚀 小红书风格小说网站服务器启动成功！
📍 端口: ${config.PORT}
🌐 本地访问: http://localhost:${config.PORT}
📡 API接口: http://localhost:${config.PORT}/api
⏰ 启动时间: ${new Date().toLocaleString()}
🔒 环境: ${process.env.NODE_ENV || 'development'}
📝 日志级别: ${config.logging.level}
        `;

        // 生产环境只显示关键信息
        if (process.env.NODE_ENV === 'production') {
            console.log(`服务器启动成功 - 端口:${config.PORT} - 时间:${new Date().toLocaleString()}`);
        } else {
            console.log(startupMessage);
        }
    });
}

module.exports = app;