const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const config = require('../config');
const { DataHandler, UserUtils } = require('../utils');
const { authenticateToken, imageUpload } = require('../middleware');

// 用户注册
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // 验证输入
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名、邮箱和密码都是必填项'
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: '密码长度至少6位'
            });
        }
        
        const userData = DataHandler.readUsersData();
        
        // 检查用户名和邮箱是否已存在
        const existingUser = userData.users.find(u => 
            u.username === username || u.email === email
        );
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.username === username ? '用户名已存在' : '邮箱已被注册'
            });
        }
        
        // 生成新用户ID和加密密码
        const newId = UserUtils.generateNewUserId(userData.users);
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 创建新用户
        const newUser = UserUtils.createUserData(newId, username, email, hashedPassword);
        userData.users.push(newUser);
        
        if (DataHandler.writeUsersData(userData)) {
            res.json({
                success: true,
                data: UserUtils.sanitizeUser(newUser),
                message: '注册成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '注册失败，请稍后重试'
            });
        }
    } catch (error) {
        console.error('用户注册失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码都是必填项'
            });
        }
        
        const userData = DataHandler.readUsersData();
        
        // 查找用户（支持用户名或邮箱登录）
        const user = userData.users.find(u => 
            u.username === username || u.email === username
        );
        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        // 验证密码
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            return res.status(400).json({
                success: false,
                message: '密码错误'
            });
        }
        
        // 更新用户登录信息
        user.lastLogin = new Date().toISOString();
        user.lastActivity = new Date().toISOString();
        user.isOnline = true;
        
        // 生成JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username,
                email: user.email
            },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // 保存会话信息
        const session = UserUtils.createSession(user.id, token, req);
        userData.sessions.push(session);
        userData.sessions = UserUtils.cleanupSessions(userData.sessions);
        
        DataHandler.writeUsersData(userData);
        
        res.json({
            success: true,
            data: {
                user: UserUtils.sanitizeUser(user),
                token,
                expiresIn: '24h'
            },
            message: '登录成功'
        });
    } catch (error) {
        console.error('用户登录失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取用户信息
router.get('/profile', authenticateToken, (req, res) => {
    try {
        const userData = DataHandler.readUsersData();
        const user = userData.users.find(u => u.id === req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        // 更新活动时间
        user.lastActivity = new Date().toISOString();
        DataHandler.writeUsersData(userData);
        
        res.json({
            success: true,
            data: UserUtils.sanitizeUser(user)
        });
    } catch (error) {
        console.error('获取用户信息失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 用户退出登录
router.post('/logout', authenticateToken, (req, res) => {
    try {
        const userData = DataHandler.readUsersData();
        const user = userData.users.find(u => u.id === req.user.userId);
        
        if (user) {
            user.isOnline = false;
            user.lastActivity = new Date().toISOString();
        }
        
        // 移除对应的会话
        userData.sessions = userData.sessions.filter(s => s.userId !== req.user.userId);
        
        DataHandler.writeUsersData(userData);
        
        res.json({
            success: true,
            message: '退出登录成功'
        });
    } catch (error) {
        console.error('退出登录失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 上传用户头像
router.post('/upload-avatar', authenticateToken, imageUpload.single('avatar'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '没有上传文件'
            });
        }

        const userData = DataHandler.readUsersData();
        const user = userData.users.find(u => u.id === req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 删除旧头像文件（如果不是默认头像）
        if (user.avatar && user.avatar !== 'default.png') {
            const oldAvatarPath = path.join(config.upload.uploadDir, user.avatar);
            if (fs.existsSync(oldAvatarPath)) {
                try {
                    fs.unlinkSync(oldAvatarPath);
                } catch (deleteError) {
                    console.warn('删除旧头像失败:', deleteError);
                }
            }
        }

        // 更新用户头像
        user.avatar = req.file.filename;
        user.lastActivity = new Date().toISOString();
        
        if (DataHandler.writeUsersData(userData)) {
            res.json({
                success: true,
                data: {
                    filename: req.file.filename,
                    url: `/assets/uploads/${req.file.filename}`
                },
                message: '头像上传成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('上传头像失败:', error);
        res.status(500).json({
            success: false,
            message: '上传失败'
        });
    }
});

// 更新用户资料
router.put('/update-profile', authenticateToken, (req, res) => {
    try {
        const userData = DataHandler.readUsersData();
        const user = userData.users.find(u => u.id === req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const { username, email, bio, interests } = req.body;
        
        // 验证输入
        if (username && username.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '用户名不能为空'
            });
        }
        
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: '邮箱格式无效'
            });
        }

        // 检查用户名和邮箱唯一性
        if (username || email) {
            const existingUser = userData.users.find(u => 
                u.id !== req.user.userId && (
                    (username && u.username === username) ||
                    (email && u.email === email)
                )
            );
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: existingUser.username === username ? '用户名已存在' : '邮箱已被使用'
                });
            }
        }

        // 更新用户信息
        if (username) user.username = username;
        if (email) user.email = email;
        if (bio !== undefined) user.bio = bio;
        if (interests !== undefined) user.interests = interests;
        user.lastActivity = new Date().toISOString();

        if (DataHandler.writeUsersData(userData)) {
            res.json({
                success: true,
                data: UserUtils.sanitizeUser(user),
                message: '资料更新成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('更新用户资料失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

module.exports = router;