const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('../config');
const { authenticateToken, optionalAuthenticateToken } = require('./auth');
const { imageUpload, txtUpload } = require('./upload');
const { errorHandler, notFoundHandler, setupGlobalErrorHandlers } = require('./error');
// 暂时注释掉安全中间件，因为缺少依赖
// const {
//     securityHeaders,
//     generalLimiter,
//     apiLimiter,
//     loginLimiter,
//     uploadLimiter,
//     speedLimiter,
//     validateInput,
//     fieldValidators,
//     requestLogger
// } = require('./security');

function setupMiddleware(app) {
    // 暂时注释掉高级安全功能
    // setupGlobalErrorHandlers();
    // app.use(requestLogger);
    // securityHeaders(app);

    // 信任代理设置（生产环境反向代理）
    if (process.env.NODE_ENV === 'production') {
        app.set('trust proxy', 1);
    }

    // 基础CORS配置
    app.use(cors());

    // 暂时注释掉请求限制
    // app.use(generalLimiter);
    // app.use(speedLimiter);
    // app.use(validateInput);
    
    // JSON和URL编码体解析
    app.use(bodyParser.json({ 
        limit: config.requestLimits.json,
        verify: (req, res, buf) => {
            // 验证JSON payload大小和格式
            if (buf && buf.length > 0) {
                req.rawBody = buf;
            }
        }
    }));
    
    app.use(bodyParser.urlencoded({ 
        extended: true, 
        limit: config.requestLimits.urlencoded 
    }));

    // 静态文件服务（带缓存头）
    const staticOptions = {
        maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
        etag: true,
        lastModified: true,
        setHeaders: (res, path) => {
            // 为不同类型的静态资源设置不同的缓存策略
            if (path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
                res.setHeader('Cache-Control', 'public, max-age=86400'); // 1天
            } else if (path.match(/\.(woff|woff2|ttf|eot)$/)) {
                res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30天
            }
        }
    };
    
    app.use(express.static(path.join(__dirname, '../../public'), staticOptions));
}

// 导出基础中间件
module.exports = {
    setupMiddleware,
    authenticateToken,
    optionalAuthenticateToken,
    imageUpload,
    txtUpload,
    errorHandler,
    notFoundHandler
    // 暂时注释掉安全中间件
    // apiLimiter,
    // loginLimiter,
    // uploadLimiter,
    // fieldValidators
};