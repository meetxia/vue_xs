const jwt = require('jsonwebtoken');
const config = require('../config');

// JWT认证中间件
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '需要登录'
        });
    }

    jwt.verify(token, config.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: '登录已过期，请重新登录'
            });
        }
        req.user = user;
        next();
    });
}

// 可选的认证中间件（用于获取用户信息但不强制登录）
function optionalAuthenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, config.JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null;
        } else {
            req.user = user;
        }
        next();
    });
}

// 管理员权限验证中间件
function requireAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '需要管理员权限'
        });
    }

    jwt.verify(token, config.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: '登录已过期，请重新登录'
            });
        }
        
        if (!user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: '权限不足，需要管理员权限'
            });
        }
        
        req.user = user;
        next();
    });
}

module.exports = {
    authenticateToken,
    optionalAuthenticateToken,
    requireAdmin
};