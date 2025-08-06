const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('../config');
const { authenticateToken, optionalAuthenticateToken } = require('./auth');
const { imageUpload, txtUpload } = require('./upload');
const { errorHandler, notFoundHandler } = require('./error');

function setupMiddleware(app) {
    // 基础中间件
    app.use(cors());
    // 增加JSON请求体大小限制，支持批量导入大量小说数据
    app.use(bodyParser.json({ limit: config.requestLimits.json }));
    app.use(bodyParser.urlencoded({ extended: true, limit: config.requestLimits.urlencoded }));

    // 静态文件服务
    app.use(express.static(path.join(__dirname, '../../public')));
}

module.exports = {
    setupMiddleware,
    authenticateToken,
    optionalAuthenticateToken,
    imageUpload,
    txtUpload,
    errorHandler,
    notFoundHandler
};