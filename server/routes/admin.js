const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const config = require('../config');
const { DataHandler, UserUtils } = require('../utils');
const { requireAdmin } = require('../middleware/auth');

// 管理员登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码都是必填项'
            });
        }
        
        if (username === config.admin.username && password === config.admin.password) {
            const token = jwt.sign(
                { 
                    isAdmin: true,
                    username: username
                },
                config.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            res.json({
                success: true,
                data: {
                    token,
                    username,
                    expiresIn: '24h'
                },
                message: '管理员登录成功'
            });
        } else {
            return res.status(401).json({
                success: false,
                message: '管理员用户名或密码错误'
            });
        }
    } catch (error) {
        console.error('管理员登录失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取用户列表
router.get('/users', requireAdmin, (req, res) => {
    try {
        const userData = DataHandler.readUsersData();
        const { page = 1, limit = 20, search = '' } = req.query;
        
        let users = userData.users.map(u => UserUtils.sanitizeUser(u));
        
        // 搜索过滤
        if (search) {
            const searchTerm = search.toLowerCase();
            users = users.filter(u => 
                u.username.toLowerCase().includes(searchTerm) ||
                u.email.toLowerCase().includes(searchTerm)
            );
        }
        
        // 分页
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        
        const paginatedUsers = users.slice(startIndex, endIndex);
        
        // 统计信息
        const stats = {
            totalUsers: users.length,
            onlineUsers: users.filter(u => u.isOnline).length,
            enabledUsers: users.filter(u => u.isEnabled !== false).length,
            newUsersToday: users.filter(u => {
                const today = new Date().toDateString();
                const registerDate = new Date(u.registerTime).toDateString();
                return today === registerDate;
            }).length
        };
        
        res.json({
            success: true,
            data: {
                users: paginatedUsers,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: users.length,
                    totalPages: Math.ceil(users.length / limitNum)
                },
                stats
            }
        });
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取单个用户详细信息
router.get('/users/:id', requireAdmin, (req, res) => {
    try {
        const userData = DataHandler.readUsersData();
        const userId = parseInt(req.params.id);
        const user = userData.users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        res.json({
            success: true,
            data: UserUtils.sanitizeUser(user)
        });
    } catch (error) {
        console.error('获取用户详情失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 更新用户信息
router.put('/users/:id', requireAdmin, (req, res) => {
    try {
        const userData = DataHandler.readUsersData();
        const userId = parseInt(req.params.id);
        const userIndex = userData.users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        const allowedFields = ['username', 'email', 'profile', 'isEnabled', 'role', 'membership'];
        const updateData = {};
        
        allowedFields.forEach(field => {
            if (field in req.body) {
                updateData[field] = req.body[field];
            }
        });
        
        // 检查用户名和邮箱唯一性
        if (updateData.username || updateData.email) {
            const existingUser = userData.users.find(u => 
                u.id !== userId && (
                    (updateData.username && u.username === updateData.username) ||
                    (updateData.email && u.email === updateData.email)
                )
            );
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: existingUser.username === updateData.username ? '用户名已存在' : '邮箱已被使用'
                });
            }
        }
        
        // 更新用户信息
        const oldUser = {...userData.users[userIndex]};
        userData.users[userIndex] = {
            ...userData.users[userIndex],
            ...updateData,
            lastActivity: new Date().toISOString()
        };
        
        // 记录会员状态变更日志
        if (updateData.membership) {
            if (!userData.users[userIndex].activityLog) {
                userData.users[userIndex].activityLog = [];
            }

            const oldMembership = oldUser.membership || { type: 'free', status: 'active' };
            const newMembership = updateData.membership;

            // 检查会员类型变更
            if (newMembership.type !== oldMembership.type) {
                const operationNote = req.body.operationNote || '';
                const details = `管理员将会员类型从 "${oldMembership.type}" 更改为 "${newMembership.type}"` +
                               (operationNote ? ` (备注: ${operationNote})` : '');

                userData.users[userIndex].activityLog.unshift({
                    action: 'membership_changed',
                    timestamp: new Date().toISOString(),
                    details: details,
                    operator: 'admin'
                });
            }

            // 检查会员状态变更
            if (newMembership.status !== oldMembership.status) {
                const operationNote = req.body.operationNote || '';
                const details = `管理员将会员状态从 "${oldMembership.status}" 更改为 "${newMembership.status}"` +
                               (operationNote ? ` (备注: ${operationNote})` : '');

                userData.users[userIndex].activityLog.unshift({
                    action: 'membership_status_changed',
                    timestamp: new Date().toISOString(),
                    details: details,
                    operator: 'admin'
                });
            }

            // 检查到期时间变更
            if (newMembership.endDate !== oldMembership.endDate) {
                const operationNote = req.body.operationNote || '';
                const oldEndDate = oldMembership.endDate ? new Date(oldMembership.endDate).toLocaleDateString('zh-CN') : '永久';
                const newEndDate = newMembership.endDate ? new Date(newMembership.endDate).toLocaleDateString('zh-CN') : '永久';
                const details = `管理员将会员到期时间从 "${oldEndDate}" 更改为 "${newEndDate}"` +
                               (operationNote ? ` (备注: ${operationNote})` : '');

                userData.users[userIndex].activityLog.unshift({
                    action: 'membership_expiry_changed',
                    timestamp: new Date().toISOString(),
                    details: details,
                    operator: 'admin'
                });
            }
        }
        
        if (DataHandler.writeUsersData(userData)) {
            res.json({
                success: true,
                data: UserUtils.sanitizeUser(userData.users[userIndex]),
                message: '用户信息更新成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('更新用户信息失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取在线用户统计
router.get('/online-stats', requireAdmin, (req, res) => {
    try {
        const userData = DataHandler.readUsersData();
        UserUtils.updateOnlineStatus(userData.users);
        DataHandler.writeUsersData(userData);
        
        const onlineUsers = userData.users.filter(u => u.isOnline);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentSessions = userData.sessions.filter(s => {
            const sessionTime = new Date(s.lastActivity || s.loginTime);
            return sessionTime > fiveMinutesAgo;
        });
        
        res.json({
            success: true,
            data: {
                onlineCount: onlineUsers.length,
                totalUsers: userData.users.length,
                recentSessions: recentSessions.length,
                onlineUsers: onlineUsers.map(u => ({
                    id: u.id,
                    username: u.username,
                    lastActivity: u.lastActivity,
                    avatar: u.avatar
                }))
            }
        });
    } catch (error) {
        console.error('获取在线统计失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 修改用户密码
router.patch('/users/:id/password', requireAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;
        const userId = parseInt(req.params.id);

        // 验证新密码
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: '密码长度至少6位字符'
            });
        }

        const userData = DataHandler.readUsersData();
        const userIndex = userData.users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const user = userData.users[userIndex];

        // 加密新密码
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 更新密码
        userData.users[userIndex] = {
            ...user,
            password: hashedPassword,
            lastActivity: new Date().toISOString()
        };

        // 记录操作日志
        if (!userData.users[userIndex].activityLog) {
            userData.users[userIndex].activityLog = [];
        }

        userData.users[userIndex].activityLog.unshift({
            action: 'password_reset',
            timestamp: new Date().toISOString(),
            details: '管理员重置了密码',
            operator: 'admin'
        });

        // 清除用户的现有会话（强制重新登录）
        if (userData.sessions) {
            userData.sessions = userData.sessions.filter(session => session.userId !== userId);
        }

        if (DataHandler.writeUsersData(userData)) {
            res.json({
                success: true,
                data: {
                    userId: userId,
                    username: user.username
                },
                message: '密码修改成功，用户需要重新登录'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('修改密码失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 切换用户状态（启用/禁用）
router.patch('/users/:id/toggle-status', requireAdmin, (req, res) => {
    try {
        const userData = DataHandler.readUsersData();
        const userId = parseInt(req.params.id);
        const userIndex = userData.users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        const user = userData.users[userIndex];
        const newStatus = user.isEnabled === false ? true : false;
        
        userData.users[userIndex] = {
            ...user,
            isEnabled: newStatus,
            lastActivity: new Date().toISOString()
        };
        
        // 记录操作日志
        if (!userData.users[userIndex].activityLog) {
            userData.users[userIndex].activityLog = [];
        }
        userData.users[userIndex].activityLog.unshift({
            action: newStatus ? 'enabled' : 'disabled',
            timestamp: new Date().toISOString(),
            details: `管理员${newStatus ? '启用' : '禁用'}了账户`,
            operator: 'admin'
        });
        
        if (DataHandler.writeUsersData(userData)) {
            res.json({
                success: true,
                data: { isEnabled: newStatus },
                message: `用户已${newStatus ? '启用' : '禁用'}`
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('切换用户状态失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取用户活动记录
router.get('/users/:id/activity', requireAdmin, (req, res) => {
    try {
        const userData = DataHandler.readUsersData();
        const userId = parseInt(req.params.id);
        const user = userData.users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        const { limit = 20 } = req.query;
        const activities = user.activityLog || [];
        const limitedActivities = activities.slice(0, parseInt(limit));
        
        res.json({
            success: true,
            data: {
                activities: limitedActivities,
                total: activities.length
            }
        });
    } catch (error) {
        console.error('获取用户活动记录失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取系统设置
router.get('/settings', requireAdmin, (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const settingsPath = path.join(__dirname, '../../data/settings.json');

        // 检查设置文件是否存在
        if (!fs.existsSync(settingsPath)) {
            // 如果不存在，创建默认设置
            const defaultSettings = {
                website: {
                    name: "MOMO炒饭店",
                    description: "小红书风格个人小说发布网站，提供优质的阅读体验",
                    keywords: "小说,阅读,小红书,文学,创作"
                },
                contact: {
                    wechat: "novel-service",
                    email: "service@novel-site.com",
                    qq: "",
                    phone: "",
                    workingHours: "9:00-21:00",
                    address: "点击右下角客服图标",
                    supportNote: "为了确保账户安全和服务质量，我们采用人工开通方式。"
                },
                admin: {
                    name: "MOMO",
                    email: "admin@novel-site.com",
                    bio: "网站管理员，致力于为用户提供优质的阅读体验"
                }
            };

            fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));

            return res.json({
                success: true,
                data: defaultSettings,
                message: '获取系统设置成功'
            });
        }

        const settingsData = fs.readFileSync(settingsPath, 'utf8');
        const settings = JSON.parse(settingsData);

        res.json({
            success: true,
            data: settings,
            message: '获取系统设置成功'
        });
    } catch (error) {
        console.error('获取系统设置失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 更新系统设置
router.post('/settings', requireAdmin, (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const settingsPath = path.join(__dirname, '../../data/settings.json');

        const { website, contact, admin, membership, system, notifications, security } = req.body;

        // 验证必填字段（只在提供了相应数据时验证）
        if (website && website.name !== undefined && !website.name.trim()) {
            return res.status(400).json({
                success: false,
                message: '网站名称不能为空'
            });
        }

        if (contact && contact.email !== undefined) {
            if (!contact.email.trim()) {
                return res.status(400).json({
                    success: false,
                    message: '联系邮箱不能为空'
                });
            }

            // 验证邮箱格式
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(contact.email)) {
                return res.status(400).json({
                    success: false,
                    message: '邮箱格式不正确'
                });
            }
        }

        if (contact && contact.wechat !== undefined && !contact.wechat.trim()) {
            return res.status(400).json({
                success: false,
                message: '微信号不能为空'
            });
        }

        // 读取现有设置
        let currentSettings = {};
        if (fs.existsSync(settingsPath)) {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            currentSettings = JSON.parse(settingsData);
        }

        // 合并设置
        const updatedSettings = {
            ...currentSettings,
            website: { ...currentSettings.website, ...website },
            contact: { ...currentSettings.contact, ...contact },
            admin: { ...currentSettings.admin, ...admin },
            membership: { ...currentSettings.membership, ...membership },
            system: { ...currentSettings.system, ...system },
            notifications: { ...currentSettings.notifications, ...notifications },
            security: { ...currentSettings.security, ...security },
            meta: {
                ...currentSettings.meta,
                lastUpdated: new Date().toISOString(),
                updatedBy: 'admin'
            }
        };

        // 保存设置
        fs.writeFileSync(settingsPath, JSON.stringify(updatedSettings, null, 2));

        res.json({
            success: true,
            data: updatedSettings,
            message: '系统设置更新成功'
        });
    } catch (error) {
        console.error('更新系统设置失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

module.exports = router;