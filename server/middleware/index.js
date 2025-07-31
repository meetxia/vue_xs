const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { authenticateToken, optionalAuthenticateToken } = require('./auth');
const { imageUpload, txtUpload } = require('./upload');
const { errorHandler, notFoundHandler } = require('./error');

function setupMiddleware(app) {
    // 基础中间件
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    
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