const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'xiaohongshu-novel-secret-key-2024';

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 数据文件路径
const dataPath = path.join(__dirname, 'data', 'novels.json');
const usersPath = path.join(__dirname, 'data', 'users.json');

// 读取用户数据的工具函数
function readUsersData() {
    try {
        const data = fs.readFileSync(usersPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取用户数据失败:', error);
        return { users: [], sessions: [] };
    }
}

// 写入用户数据的工具函数
function writeUsersData(data) {
    try {
        fs.writeFileSync(usersPath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('写入用户数据失败:', error);
        return false;
    }
}

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

    jwt.verify(token, JWT_SECRET, (err, user) => {
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

// 读取小说数据的工具函数
function readNovelsData() {
    try {
        const data = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取小说数据失败:', error);
        return { novels: [] };
    }
}

// 写入小说数据的工具函数
function writeNovelsData(data) {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('写入小说数据失败:', error);
        return false;
    }
}

// API 路由

// =============== 用户认证相关API ===============

// 用户注册
app.post('/api/auth/register', async (req, res) => {
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
        
        const userData = readUsersData();
        
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
        
        // 生成新用户ID
        const newId = Math.max(...userData.users.map(u => u.id), 0) + 1;
        
        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 创建新用户
        const newUser = {
            id: newId,
            username,
            email,
            password: hashedPassword,
            avatar: 'default.png',
            registerTime: new Date().toISOString(),
            lastLogin: null,
            lastActivity: new Date().toISOString(),
            isOnline: false,
            favorites: [],
            likes: [],
            profile: {
                bio: '这个人很懒，什么都没写',
                location: '',
                website: ''
            }
        };
        
        userData.users.push(newUser);
        
        if (writeUsersData(userData)) {
            // 返回用户信息（不包含密码）
            const { password: _, ...userInfo } = newUser;
            res.json({
                success: true,
                data: userInfo,
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
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码都是必填项'
            });
        }
        
        const userData = readUsersData();
        
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
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // 保存会话信息
        const session = {
            id: Date.now(),
            userId: user.id,
            token,
            loginTime: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            userAgent: req.headers['user-agent'] || 'Unknown',
            ip: req.ip || req.connection.remoteAddress
        };
        
        userData.sessions.push(session);
        
        // 清理过期会话（保留最近50个）
        if (userData.sessions.length > 50) {
            userData.sessions = userData.sessions.slice(-50);
        }
        
        writeUsersData(userData);
        
        // 返回登录信息（不包含密码）
        const { password: _, ...userInfo } = user;
        
        res.json({
            success: true,
            data: {
                user: userInfo,
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
app.get('/api/auth/profile', authenticateToken, (req, res) => {
    try {
        const userData = readUsersData();
        const user = userData.users.find(u => u.id === req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        // 更新活动时间
        user.lastActivity = new Date().toISOString();
        writeUsersData(userData);
        
        // 返回用户信息（不包含密码）
        const { password: _, ...userInfo } = user;
        
        res.json({
            success: true,
            data: userInfo
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
app.post('/api/auth/logout', authenticateToken, (req, res) => {
    try {
        const userData = readUsersData();
        const user = userData.users.find(u => u.id === req.user.userId);
        
        if (user) {
            user.isOnline = false;
            user.lastActivity = new Date().toISOString();
        }
        
        // 移除对应的会话
        userData.sessions = userData.sessions.filter(s => s.userId !== req.user.userId);
        
        writeUsersData(userData);
        
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

// 获取用户列表（管理员功能）
app.get('/api/admin/users', (req, res) => {
    try {
        const userData = readUsersData();
        const { page = 1, limit = 20, search = '' } = req.query;
        
        let users = userData.users.map(u => {
            const { password, ...userInfo } = u;
            return userInfo;
        });
        
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
app.get('/api/admin/users/:id', (req, res) => {
    try {
        const userData = readUsersData();
        const userId = parseInt(req.params.id);
        const user = userData.users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        // 返回用户详细信息（不包含密码）
        const { password, ...userInfo } = user;
        
        res.json({
            success: true,
            data: userInfo
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
app.put('/api/admin/users/:id', (req, res) => {
    try {
        const userData = readUsersData();
        const userId = parseInt(req.params.id);
        const userIndex = userData.users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        const allowedFields = ['username', 'email', 'profile', 'isEnabled', 'role'];
        const updateData = {};
        
        // 只允许更新特定字段
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
        userData.users[userIndex] = {
            ...userData.users[userIndex],
            ...updateData,
            lastActivity: new Date().toISOString()
        };
        
        if (writeUsersData(userData)) {
            const { password, ...userInfo } = userData.users[userIndex];
            res.json({
                success: true,
                data: userInfo,
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

// 切换用户启用/禁用状态
app.patch('/api/admin/users/:id/toggle-status', (req, res) => {
    try {
        const userData = readUsersData();
        const userId = parseInt(req.params.id);
        const user = userData.users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        // 切换用户状态
        user.isEnabled = !user.isEnabled;
        user.lastActivity = new Date().toISOString();
        
        // 如果禁用用户，同时设置为离线
        if (!user.isEnabled) {
            user.isOnline = false;
        }
        
        if (writeUsersData(userData)) {
            res.json({
                success: true,
                data: {
                    userId: userId,
                    isEnabled: user.isEnabled,
                    isOnline: user.isOnline
                },
                message: `用户已${user.isEnabled ? '启用' : '禁用'}`
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

// 获取用户活动日志
app.get('/api/admin/users/:id/activity', (req, res) => {
    try {
        const userData = readUsersData();
        const userId = parseInt(req.params.id);
        const user = userData.users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        const { limit = 50, offset = 0 } = req.query;
        const limitNum = parseInt(limit);
        const offsetNum = parseInt(offset);
        const activityLog = user.activityLog || [];
        
        // 按时间倒序排列活动日志
        const sortedLog = activityLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const paginatedLog = sortedLog.slice(offsetNum, offsetNum + limitNum);
        
        res.json({
            success: true,
            data: {
                userId: userId,
                activities: paginatedLog,
                total: activityLog.length,
                hasMore: offsetNum + limitNum < activityLog.length
            }
        });
    } catch (error) {
        console.error('获取用户活动日志失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取在线用户统计
app.get('/api/admin/online-stats', (req, res) => {
    try {
        const userData = readUsersData();
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        
        // 更新在线状态（5分钟内有活动的用户视为在线）
        userData.users.forEach(user => {
            if (user.lastActivity) {
                const lastActivity = new Date(user.lastActivity);
                user.isOnline = lastActivity > fiveMinutesAgo;
            } else {
                user.isOnline = false;
            }
        });
        
        writeUsersData(userData);
        
        const onlineUsers = userData.users.filter(u => u.isOnline);
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

// =============== 小说相关API ===============

// 获取所有小说列表
app.get('/api/novels', (req, res) => {
    try {
        const data = readNovelsData();
        const { tag, search, limit, offset } = req.query;
        
        let novels = data.novels || [];
        
        // 标签筛选
        if (tag && tag !== '全部') {
            novels = novels.filter(novel => 
                novel.tags && novel.tags.includes(tag)
            );
        }
        
        // 搜索功能
        if (search) {
            const searchTerm = search.toLowerCase();
            novels = novels.filter(novel => 
                novel.title.toLowerCase().includes(searchTerm) ||
                novel.summary.toLowerCase().includes(searchTerm) ||
                (novel.tags && novel.tags.some(tag => 
                    tag.toLowerCase().includes(searchTerm)
                ))
            );
        }
        
        // 分页
        const limitNum = parseInt(limit) || novels.length;
        const offsetNum = parseInt(offset) || 0;
        const paginatedNovels = novels.slice(offsetNum, offsetNum + limitNum);
        
        // 只返回列表需要的字段，不包含完整内容
        const novelList = paginatedNovels.map(novel => ({
            id: novel.id,
            title: novel.title,
            summary: novel.summary,
            tags: novel.tags,
            coverType: novel.coverType,
            coverData: novel.coverData,
            views: novel.views,
            likes: novel.likes || 0,
            favorites: novel.favorites || 0,
            publishTime: novel.publishTime,
            status: novel.status
        }));
        
        res.json({
            success: true,
            novels: novelList,
            total: novels.length,
            hasMore: offsetNum + limitNum < novels.length
        });
    } catch (error) {
        console.error('获取小说列表失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取单个小说详情
app.get('/api/novels/:id', (req, res) => {
    try {
        const data = readNovelsData();
        const novelId = parseInt(req.params.id);
        
        const novel = data.novels.find(n => n.id === novelId);
        
        if (!novel) {
            return res.status(404).json({
                success: false,
                message: '小说不存在'
            });
        }
        
        // 增加阅读量
        novel.views = (novel.views || 0) + 1;
        writeNovelsData(data);
        
        res.json({
            success: true,
            data: novel
        });
    } catch (error) {
        console.error('获取小说详情失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取所有标签
app.get('/api/tags', (req, res) => {
    try {
        const data = readNovelsData();
        const allTags = new Set();
        
        data.novels.forEach(novel => {
            if (novel.tags) {
                novel.tags.forEach(tag => allTags.add(tag));
            }
        });
        
        res.json({
            success: true,
            data: Array.from(allTags).sort()
        });
    } catch (error) {
        console.error('获取标签失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 创建新小说（管理功能）
app.post('/api/novels', (req, res) => {
    try {
        const data = readNovelsData();
        const { title, summary, content, tags, coverType, coverData } = req.body;
        
        // 生成新的ID
        const newId = Math.max(...data.novels.map(n => n.id), 0) + 1;
        
        const newNovel = {
            id: newId,
            title,
            summary,
            content,
            tags,
            coverType,
            coverData,
            views: 0,
            publishTime: new Date().toISOString().split('T')[0],
            status: 'published'
        };
        
        data.novels.push(newNovel);
        
        if (writeNovelsData(data)) {
            res.json({
                success: true,
                data: newNovel,
                message: '小说创建成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('创建小说失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 更新小说
app.put('/api/novels/:id', (req, res) => {
    try {
        const data = readNovelsData();
        const novelId = parseInt(req.params.id);
        const novelIndex = data.novels.findIndex(n => n.id === novelId);
        
        if (novelIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '小说不存在'
            });
        }
        
        // 更新小说信息
        const updatedNovel = {
            ...data.novels[novelIndex],
            ...req.body,
            id: novelId, // 确保ID不变
            updated_at: new Date().toISOString()
        };
        
        data.novels[novelIndex] = updatedNovel;
        
        if (writeNovelsData(data)) {
            res.json({
                success: true,
                data: updatedNovel,
                message: '小说更新成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('更新小说失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 删除小说
app.delete('/api/novels/:id', (req, res) => {
    try {
        const data = readNovelsData();
        const novelId = parseInt(req.params.id);
        const novelIndex = data.novels.findIndex(n => n.id === novelId);
        
        if (novelIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '小说不存在'
            });
        }
        
        data.novels.splice(novelIndex, 1);
        
        if (writeNovelsData(data)) {
            res.json({
                success: true,
                message: '小说删除成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('删除小说失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取网站统计信息
app.get('/api/stats', (req, res) => {
    try {
        const data = readNovelsData();
        const novels = data.novels || [];
        
        const stats = {
            totalNovels: novels.length,
            totalViews: novels.reduce((sum, novel) => sum + (novel.views || 0), 0),
            publishedNovels: novels.filter(n => n.status === 'published').length,
            draftNovels: novels.filter(n => n.status === 'draft').length,
            recentNovels: novels
                .sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime))
                .slice(0, 5)
                .map(n => ({ id: n.id, title: n.title, views: n.views }))
        };
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('获取统计信息失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 草稿管理相关API

// 获取草稿列表（这里暂时返回空，因为草稿存储在客户端）
app.get('/api/drafts', (req, res) => {
    res.json({
        success: true,
        message: '草稿存储在客户端localStorage中',
        data: []
    });
});

// 保存草稿到服务器（可选功能）
app.post('/api/drafts', (req, res) => {
    // 这里可以实现服务器端草稿存储
    // 目前草稿存储在客户端localStorage中
    res.json({
        success: true,
        message: '草稿功能使用localStorage存储'
    });
});

// 点赞相关API
// 点赞小说 (无需登录的简化版本)
app.post('/api/novels/:id/like', (req, res) => {
    try {
        const data = readNovelsData();
        const novelId = parseInt(req.params.id);
        const novel = data.novels.find(n => n.id === novelId);
        
        if (!novel) {
            return res.status(404).json({
                success: false,
                message: '小说不存在'
            });
        }
        
        // 增加点赞数
        novel.likes = (novel.likes || 0) + 1;
        
        if (writeNovelsData(data)) {
            res.json({
                success: true,
                data: {
                    novelId: novelId,
                    likes: novel.likes
                },
                message: '点赞成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('点赞失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 取消点赞小说
app.delete('/api/novels/:id/like', (req, res) => {
    try {
        const data = readNovelsData();
        const novelId = parseInt(req.params.id);
        const novel = data.novels.find(n => n.id === novelId);
        
        if (!novel) {
            return res.status(404).json({
                success: false,
                message: '小说不存在'
            });
        }
        
        // 减少点赞数，最少为0
        novel.likes = Math.max((novel.likes || 0) - 1, 0);
        
        if (writeNovelsData(data)) {
            res.json({
                success: true,
                data: {
                    novelId: novelId,
                    likes: novel.likes
                },
                message: '取消点赞成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('取消点赞失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 收藏相关API
// 收藏小说 (无需登录的简化版本)
app.post('/api/novels/:id/favorite', (req, res) => {
    try {
        const data = readNovelsData();
        const novelId = parseInt(req.params.id);
        const novel = data.novels.find(n => n.id === novelId);
        
        if (!novel) {
            return res.status(404).json({
                success: false,
                message: '小说不存在'
            });
        }
        
        // 增加收藏数
        novel.favorites = (novel.favorites || 0) + 1;
        
        if (writeNovelsData(data)) {
            res.json({
                success: true,
                data: {
                    novelId: novelId,
                    favorites: novel.favorites
                },
                message: '收藏成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('收藏失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 取消收藏小说
app.delete('/api/novels/:id/favorite', (req, res) => {
    try {
        const data = readNovelsData();
        const novelId = parseInt(req.params.id);
        const novel = data.novels.find(n => n.id === novelId);
        
        if (!novel) {
            return res.status(404).json({
                success: false,
                message: '小说不存在'
            });
        }
        
        // 减少收藏数，最少为0
        novel.favorites = Math.max((novel.favorites || 0) - 1, 0);
        
        if (writeNovelsData(data)) {
            res.json({
                success: true,
                data: {
                    novelId: novelId,
                    favorites: novel.favorites
                },
                message: '取消收藏成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('取消收藏失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取小说的点赞收藏信息
app.get('/api/novels/:id/interactions', (req, res) => {
    try {
        const data = readNovelsData();
        const novelId = parseInt(req.params.id);
        const novel = data.novels.find(n => n.id === novelId);
        
        if (!novel) {
            return res.status(404).json({
                success: false,
                message: '小说不存在'
            });
        }
        
        res.json({
            success: true,
            data: {
                novelId: novelId,
                likes: novel.likes || 0,
                favorites: novel.favorites || 0,
                views: novel.views || 0
            }
        });
    } catch (error) {
        console.error('获取互动信息失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 图片上传API（用于封面图片）
const multer = require('multer');
const uploadDir = path.join(__dirname, 'public', 'assets', 'uploads');

// 确保上传目录存在
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cover-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB限制
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('不支持的文件类型'));
        }
    }
});

app.post('/api/upload/cover', upload.single('cover'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '没有上传文件'
            });
        }

        const fileUrl = `/assets/uploads/${req.file.filename}`;
        
        res.json({
            success: true,
            data: {
                url: fileUrl,
                filename: req.file.filename
            },
            message: '封面上传成功'
        });
    } catch (error) {
        console.error('上传封面失败:', error);
        res.status(500).json({
            success: false,
            message: '上传失败'
        });
    }
});

// 健康检查接口
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '服务运行正常',
        timestamp: new Date().toISOString()
    });
});

// 首页路由 - 重定向到静态文件
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 阅读页面路由
app.get('/read', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'read.html'));
});

// 404 处理
app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json({
            success: false,
            message: 'API接口不存在'
        });
    } else {
        res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
    }
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`
🚀 小红书风格小说网站服务器启动成功！
📍 端口: ${PORT}
🌐 本地访问: http://localhost:${PORT}
📡 API接口: http://localhost:${PORT}/api
⏰ 启动时间: ${new Date().toLocaleString()}
    `);
});

module.exports = app;