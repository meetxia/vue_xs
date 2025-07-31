const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'xiaohongshu-novel-secret-key-2024';

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 文件上传配置
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
        // 根据请求路径决定文件名前缀
        const prefix = req.route && req.route.path.includes('avatar') ? 'avatar-' : 'cover-';
        cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
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

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 数据文件路径
const dataPath = path.join(__dirname, 'data', 'novels.json');
const usersPath = path.join(__dirname, 'data', 'users.json');
const commentsPath = path.join(__dirname, 'data', 'comments.json');
const categoriesPath = path.join(__dirname, 'data', 'categories.json');

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

// 会员权限工具函数
function getUserMembershipStatus(user) {
    if (!user || !user.membership) {
        return { type: 'free', status: 'active', isValid: true };
    }
    
    const membership = user.membership;
    const now = new Date();
    
    // 检查会员是否过期
    if (membership.endDate && new Date(membership.endDate) < now) {
        return {
            type: membership.type,
            status: 'expired',
            isValid: false,
            endDate: membership.endDate
        };
    }
    
    return {
        type: membership.type,
        status: membership.status,
        isValid: membership.status === 'active',
        endDate: membership.endDate
    };
}

// 检查用户是否有访问特定内容的权限
function checkContentAccess(userMembership, contentAccessLevel) {
    if (!contentAccessLevel || contentAccessLevel === 'free') {
        return true;
    }
    
    if (!userMembership || !userMembership.isValid) {
        return false;
    }
    
    const membershipHierarchy = {
        'free': 0,
        'premium': 1,
        'vip': 2
    };
    
    const userLevel = membershipHierarchy[userMembership.type] || 0;
    const requiredLevel = membershipHierarchy[contentAccessLevel] || 0;
    
    return userLevel >= requiredLevel;
}

// 可选的认证中间件（用于获取用户信息但不强制登录）
function optionalAuthenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null;
        } else {
            req.user = user;
        }
        next();
    });
}

// 读取分类数据的工具函数
function readCategoriesData() {
    try {
        const data = fs.readFileSync(categoriesPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取分类数据失败:', error);
        return { categories: [], commonTags: [] };
    }
}

// 写入分类数据的工具函数
function writeCategoriesData(data) {
    try {
        fs.writeFileSync(categoriesPath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('写入分类数据失败:', error);
        return false;
    }
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

// 读取评论数据的工具函数
function readCommentsData() {
    try {
        const data = fs.readFileSync(commentsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取评论数据失败:', error);
        return { comments: [] };
    }
}

// 写入评论数据的工具函数
function writeCommentsData(data) {
    try {
        fs.writeFileSync(commentsPath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('写入评论数据失败:', error);
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
            },
            membership: {
                type: 'free',
                status: 'active',
                startDate: new Date().toISOString(),
                endDate: null,
                autoRenew: false,
                paymentHistory: []
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

// 管理员登录
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '用户名和密码都是必填项'
            });
        }
        
        // 简单的管理员账号验证（实际项目中应该使用数据库）
        const adminCredentials = {
            username: 'admin',
            password: '123456'
        };
        
        if (username === adminCredentials.username && password === adminCredentials.password) {
            // 生成管理员token
            const token = jwt.sign(
                { 
                    isAdmin: true,
                    username: username
                },
                JWT_SECRET,
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

// 上传用户头像
app.post('/api/auth/upload-avatar', authenticateToken, upload.single('avatar'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '没有上传文件'
            });
        }

        const userData = readUsersData();
        const user = userData.users.find(u => u.id === req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 删除旧头像文件（如果不是默认头像）
        if (user.avatar && user.avatar !== 'default.png') {
            const oldAvatarPath = path.join(uploadDir, user.avatar);
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
        
        if (writeUsersData(userData)) {
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
app.put('/api/auth/update-profile', authenticateToken, (req, res) => {
    try {
        const userData = readUsersData();
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

        if (writeUsersData(userData)) {
            // 返回更新后的用户信息（不包含密码）
            const { password: _, ...userInfo } = user;
            res.json({
                success: true,
                data: userInfo,
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
app.get('/api/novels', optionalAuthenticateToken, (req, res) => {
    try {
        const data = readNovelsData();
        const { tag, search, limit, offset } = req.query;
        
        let novels = data.novels || [];
        
        // 获取用户会员状态
        let userMembership = { type: 'free', status: 'active', isValid: true };
        if (req.user) {
            const userData = readUsersData();
            const currentUser = userData.users.find(u => u.id === req.user.userId);
            if (currentUser) {
                userMembership = getUserMembershipStatus(currentUser);
            }
        }
        
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
        
        // 只返回列表需要的字段，并添加权限信息
        const novelList = paginatedNovels.map(novel => {
            const hasAccess = checkContentAccess(userMembership, novel.accessLevel);
            return {
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
                status: novel.status,
                accessLevel: novel.accessLevel || 'free',
                hasAccess: hasAccess,
                requiresLogin: !req.user && novel.accessLevel !== 'free'
            };
        });
        
        res.json({
            success: true,
            novels: novelList,
            total: novels.length,
            hasMore: offsetNum + limitNum < novels.length,
            userMembership: userMembership
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
app.get('/api/novels/:id', optionalAuthenticateToken, (req, res) => {
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
        
        // 获取用户会员状态
        let userMembership = { type: 'free', status: 'active', isValid: true };
        if (req.user) {
            const userData = readUsersData();
            const currentUser = userData.users.find(u => u.id === req.user.userId);
            if (currentUser) {
                userMembership = getUserMembershipStatus(currentUser);
            }
        }
        
        // 检查用户是否有权限访问此内容
        const hasAccess = checkContentAccess(userMembership, novel.accessLevel);
        
        if (!hasAccess) {
            // 如果没有权限，返回限制的内容
            const restrictedNovel = {
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
                status: novel.status,
                accessLevel: novel.accessLevel || 'free',
                hasAccess: false,
                requiresLogin: !req.user,
                requiredMembership: novel.accessLevel,
                content: null // 不返回完整内容
            };
            
            return res.json({
                success: true,
                data: restrictedNovel,
                message: req.user ? 
                    `此内容需要${novel.accessLevel === 'premium' ? '高级' : 'VIP'}会员权限` : 
                    '此内容需要登录并开通会员'
            });
        }
        
        // 有权限访问，增加阅读量并返回完整内容
        novel.views = (novel.views || 0) + 1;
        writeNovelsData(data);
        
        res.json({
            success: true,
            data: {
                ...novel,
                hasAccess: true,
                accessLevel: novel.accessLevel || 'free'
            }
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

// 更新单个小说的访问权限
app.put('/api/novels/:id/access', (req, res) => {
    try {
        const data = readNovelsData();
        const novelId = parseInt(req.params.id);
        const { accessLevel } = req.body;
        
        // 验证访问级别
        const validLevels = ['free', 'premium', 'vip'];
        if (!validLevels.includes(accessLevel)) {
            return res.status(400).json({
                success: false,
                message: '无效的访问权限级别'
            });
        }
        
        const novelIndex = data.novels.findIndex(n => n.id === novelId);
        
        if (novelIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '小说不存在'
            });
        }
        
        // 更新访问权限
        data.novels[novelIndex].accessLevel = accessLevel;
        data.novels[novelIndex].updated_at = new Date().toISOString();
        
        if (writeNovelsData(data)) {
            res.json({
                success: true,
                data: {
                    novelId: novelId,
                    accessLevel: accessLevel
                },
                message: '权限设置更新成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('更新小说权限失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 批量更新小说访问权限
app.put('/api/novels/batch-access', (req, res) => {
    try {
        const data = readNovelsData();
        const { novelIds, accessLevel } = req.body;
        
        // 验证输入
        if (!Array.isArray(novelIds) || novelIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供有效的小说ID列表'
            });
        }
        
        const validLevels = ['free', 'premium', 'vip'];
        if (!validLevels.includes(accessLevel)) {
            return res.status(400).json({
                success: false,
                message: '无效的访问权限级别'
            });
        }
        
        let updatedCount = 0;
        const notFoundIds = [];
        const currentTime = new Date().toISOString();
        
        // 批量更新
        for (const novelId of novelIds) {
            const novelIndex = data.novels.findIndex(n => n.id === parseInt(novelId));
            
            if (novelIndex !== -1) {
                data.novels[novelIndex].accessLevel = accessLevel;
                data.novels[novelIndex].updated_at = currentTime;
                updatedCount++;
            } else {
                notFoundIds.push(novelId);
            }
        }
        
        if (writeNovelsData(data)) {
            const result = {
                success: true,
                data: {
                    updatedCount: updatedCount,
                    totalRequested: novelIds.length,
                    accessLevel: accessLevel,
                    notFoundIds: notFoundIds
                },
                message: `成功更新 ${updatedCount} 部作品的权限设置`
            };
            
            if (notFoundIds.length > 0) {
                result.message += `，${notFoundIds.length} 部作品未找到`;
            }
            
            res.json(result);
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('批量更新小说权限失败:', error);
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

// =============== 会员权限相关API ===============

// 获取用户会员状态
app.get('/api/membership/status', authenticateToken, (req, res) => {
    try {
        const userData = readUsersData();
        const user = userData.users.find(u => u.id === req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        const membershipStatus = getUserMembershipStatus(user);
        
        res.json({
            success: true,
            data: {
                ...membershipStatus,
                startDate: user.membership?.startDate,
                autoRenew: user.membership?.autoRenew || false,
                paymentHistory: user.membership?.paymentHistory || []
            }
        });
    } catch (error) {
        console.error('获取会员状态失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 开通/升级会员
app.post('/api/membership/upgrade', authenticateToken, (req, res) => {
    try {
        const { membershipType, duration, paymentMethod } = req.body;
        
        // 验证输入
        if (!['premium', 'vip'].includes(membershipType)) {
            return res.status(400).json({
                success: false,
                message: '无效的会员类型'
            });
        }
        
        if (!duration || duration <= 0) {
            return res.status(400).json({
                success: false,
                message: '无效的时长'
            });
        }
        
        const userData = readUsersData();
        const user = userData.users.find(u => u.id === req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        // 计算价格（示例价格）
        const prices = {
            premium: { 1: 19.9, 3: 49.9, 6: 89.9, 12: 149.9 },
            vip: { 1: 39.9, 3: 99.9, 6: 179.9, 12: 299.9 }
        };
        
        const price = prices[membershipType][duration];
        if (!price) {
            return res.status(400).json({
                success: false,
                message: '无效的时长选择'
            });
        }
        
        // 计算会员结束时间
        const now = new Date();
        const currentMembership = getUserMembershipStatus(user);
        
        let startDate = now;
        if (currentMembership.isValid && currentMembership.endDate) {
            // 如果当前会员还有效，从结束时间开始计算
            startDate = new Date(currentMembership.endDate);
        }
        
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + duration);
        
        // 更新用户会员信息
        if (!user.membership) {
            user.membership = {
                paymentHistory: []
            };
        }
        
        user.membership.type = membershipType;
        user.membership.status = 'active';
        user.membership.startDate = startDate.toISOString();
        user.membership.endDate = endDate.toISOString();
        user.membership.autoRenew = false;
        
        // 添加支付记录
        const paymentRecord = {
            id: Date.now(),
            amount: price,
            type: membershipType,
            duration: duration,
            paymentTime: now.toISOString(),
            paymentMethod: paymentMethod || 'unknown',
            status: 'completed'
        };
        
        user.membership.paymentHistory.push(paymentRecord);
        
        // 更新用户活动时间
        user.lastActivity = now.toISOString();
        
        if (writeUsersData(userData)) {
            res.json({
                success: true,
                data: {
                    membershipType: membershipType,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    amount: price,
                    paymentRecord: paymentRecord
                },
                message: `${membershipType === 'premium' ? '高级' : 'VIP'}会员开通成功`
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('开通会员失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取会员价格套餐
app.get('/api/membership/plans', (req, res) => {
    try {
        const plans = {
            premium: {
                name: '高级会员',
                description: '解锁大部分精选内容',
                benefits: ['无广告阅读', '高级内容访问', '离线下载', '优先客服'],
                prices: [
                    { duration: 1, price: 19.9, label: '1个月' },
                    { duration: 3, price: 49.9, label: '3个月', discount: '17%' },
                    { duration: 6, price: 89.9, label: '6个月', discount: '25%' },
                    { duration: 12, price: 149.9, label: '12个月', discount: '38%' }
                ]
            },
            vip: {
                name: 'VIP会员',
                description: '解锁所有内容，享受最高级服务',
                benefits: ['无广告阅读', '全部内容访问', '离线下载', '专属客服', 'VIP专区', '优先更新'],
                prices: [
                    { duration: 1, price: 39.9, label: '1个月' },
                    { duration: 3, price: 99.9, label: '3个月', discount: '17%' },
                    { duration: 6, price: 179.9, label: '6个月', discount: '25%' },
                    { duration: 12, price: 299.9, label: '12个月', discount: '38%' }
                ]
            }
        };
        
        res.json({
            success: true,
            data: plans
        });
    } catch (error) {
        console.error('获取会员套餐失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 配置TXT文件上传的multer实例
const txtUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB限制
        files: 20 // 最多20个文件
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['text/plain', 'application/octet-stream'];
        const allowedExtensions = ['.txt'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error('只支持TXT格式的文件'));
        }
    }
});

// 文本分析工具类
class NovelAnalyzer {
    constructor() {
        this.categoriesData = readCategoriesData();
    }

    // 从文件名提取标题
    extractTitleFromFilename(filename) {
        let title = path.parse(filename).name;
        title = title.replace(/^\d+[.-_]/, '');
        title = title.replace(/[【\[].*?[】\]]/g, '');
        title = title.replace(/[（\(].*?[）\)]/g, '');
        title = title.replace(/[-_]+/g, ' ');
        title = title.trim();
        return title || filename;
    }

    // 从内容中提取标题
    extractTitleFromContent(content) {
        const lines = content.split('\n').slice(0, 10);
        for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.length > 0 && cleanLine.length <= 50) {
                if (this.isTitleLine(cleanLine)) {
                    return cleanLine;
                }
            }
        }
        return null;
    }

    // 判断是否为标题行
    isTitleLine(line) {
        const titlePatterns = [
            /^第?\d+[章节回]/,
            /^[《〈][^》〉]+[》〉]$/,
            /^[第序]?[一二三四五六七八九十\d]+[章节回部卷]/,
        ];
        
        if (titlePatterns.some(pattern => pattern.test(line))) {
            return false;
        }
        
        return line.length >= 2 && line.length <= 30 && 
               !line.includes('第') && !line.includes('章') && 
               !line.includes('节') && !line.includes('回');
    }

    // 分析文本内容
    analyzeContent(content) {
        const analysis = {
            category: null,
            categoryConfidence: 0,
            tags: [],
            tagConfidences: {},
            summary: this.generateSummary(content)
        };

        const categories = this.categoriesData.categories;
        let maxScore = 0;
        let bestCategory = null;

        for (const category of categories) {
            const score = this.calculateCategoryScore(content, category);
            if (score > maxScore) {
                maxScore = score;
                bestCategory = category;
            }
        }

        if (bestCategory && maxScore > 0.3) {
            analysis.category = bestCategory.name;
            analysis.categoryConfidence = Math.min(maxScore, 1.0);
            
            const relatedTags = this.extractTags(content, bestCategory);
            analysis.tags = relatedTags.map(tag => tag.name);
            relatedTags.forEach(tag => {
                analysis.tagConfidences[tag.name] = tag.confidence;
            });
        }

        return analysis;
    }

    // 计算分类匹配分数
    calculateCategoryScore(content, category) {
        const text = content.toLowerCase().substring(0, 5000);
        let score = 0;
        let totalKeywords = category.keywords.length;

        for (const keyword of category.keywords) {
            const regex = new RegExp(keyword, 'gi');
            const matches = text.match(regex);
            if (matches) {
                score += matches.length * (1 / totalKeywords);
            }
        }

        return score;
    }

    // 提取标签
    extractTags(content, category) {
        const tags = [];
        const text = content.toLowerCase().substring(0, 3000);

        for (const tag of category.tags) {
            const cleanTag = tag.replace('#', '');
            if (text.includes(cleanTag.toLowerCase())) {
                tags.push({
                    name: tag,
                    confidence: 0.8
                });
            }
        }

        const commonTags = this.categoriesData.commonTags;
        for (const tag of commonTags) {
            const cleanTag = tag.replace('#', '').toLowerCase();
            if (text.includes(cleanTag)) {
                tags.push({
                    name: tag,
                    confidence: 0.6
                });
            }
        }

        const uniqueTags = [];
        const seenTags = new Set();
        
        for (const tag of tags) {
            if (!seenTags.has(tag.name)) {
                uniqueTags.push(tag);
                seenTags.add(tag.name);
            }
        }

        return uniqueTags.sort((a, b) => b.confidence - a.confidence).slice(0, 6);
    }

    // 生成摘要
    generateSummary(content) {
        const maxLength = 200;
        if (content.length <= maxLength) {
            return content.trim();
        }

        let summary = content.substring(0, maxLength);
        const lastSentenceEnd = Math.max(
            summary.lastIndexOf('。'),
            summary.lastIndexOf('！'),
            summary.lastIndexOf('？')
        );

        if (lastSentenceEnd > maxLength * 0.5) {
            summary = summary.substring(0, lastSentenceEnd + 1);
        } else {
            summary += '...';
        }

        return summary.trim();
    }
}

// =============== 批量导入相关API ===============

// 获取分类列表
app.get('/api/categories', (req, res) => {
    try {
        const data = readCategoriesData();
        res.json({
            success: true,
            data: {
                categories: data.categories,
                commonTags: data.commonTags
            }
        });
    } catch (error) {
        console.error('获取分类列表失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 批量上传TXT文件并解析
app.post('/api/novels/batch-upload', txtUpload.array('novels', 20), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有上传文件'
            });
        }

        const analyzer = new NovelAnalyzer();
        const results = [];

        for (const file of req.files) {
            try {
                // 读取文件内容
                const content = file.buffer.toString('utf8');
                
                if (!content || content.trim().length === 0) {
                    results.push({
                        filename: file.originalname,
                        success: false,
                        error: '文件内容为空'
                    });
                    continue;
                }

                // 提取标题
                let title = analyzer.extractTitleFromContent(content) || 
                           analyzer.extractTitleFromFilename(file.originalname);

                // 分析内容
                const analysis = analyzer.analyzeContent(content);

                // 构建结果数据
                const novelData = {
                    originalFileName: file.originalname,
                    title: title,
                    content: content,
                    summary: analysis.summary,
                    category: analysis.category,
                    tags: analysis.tags,
                    analysis: {
                        titleSource: analyzer.extractTitleFromContent(content) ? 'content' : 'filename',
                        categoryConfidence: analysis.categoryConfidence,
                        tagConfidences: analysis.tagConfidences
                    },
                    // 默认封面设置
                    coverType: 'text',
                    coverData: {
                        backgroundColor: '#E6F3FF',
                        textColor: '#4169E1'
                    }
                };

                results.push({
                    filename: file.originalname,
                    success: true,
                    data: novelData
                });

            } catch (error) {
                console.error('处理文件失败:', file.originalname, error);
                results.push({
                    filename: file.originalname,
                    success: false,
                    error: error.message || '文件处理失败'
                });
            }
        }

        res.json({
            success: true,
            data: {
                totalFiles: req.files.length,
                successCount: results.filter(r => r.success).length,
                failCount: results.filter(r => !r.success).length,
                results: results
            },
            message: `成功解析 ${results.filter(r => r.success).length} 个文件`
        });

    } catch (error) {
        console.error('批量上传失败:', error);
        res.status(500).json({
            success: false,
            message: '批量上传失败: ' + error.message
        });
    }
});

// 批量导入小说到数据库
app.post('/api/novels/batch-import', (req, res) => {
    try {
        const { novels } = req.body;
        
        if (!novels || !Array.isArray(novels) || novels.length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有有效的小说数据'
            });
        }

        const data = readNovelsData();
        const results = [];

        // 获取当前最大ID
        let maxId = Math.max(...data.novels.map(n => n.id), 0);

        for (const novelData of novels) {
            try {
                // 验证必要字段
                if (!novelData.title || !novelData.content) {
                    results.push({
                        title: novelData.title || '未知标题',
                        success: false,
                        error: '标题或内容不能为空'
                    });
                    continue;
                }

                // 检查标题是否重复
                const existingNovel = data.novels.find(n => n.title === novelData.title);
                if (existingNovel) {
                    results.push({
                        title: novelData.title,
                        success: false,
                        error: '标题已存在'
                    });
                    continue;
                }

                // 创建新小说对象
                const newNovel = {
                    id: ++maxId,
                    title: novelData.title,
                    summary: novelData.summary || '暂无简介',
                    content: novelData.content,
                    tags: novelData.tags || [],
                    category: novelData.category || '其他',
                    coverType: novelData.coverType || 'text',
                    coverData: novelData.coverData || {
                        backgroundColor: '#E6F3FF',
                        textColor: '#4169E1'
                    },
                    views: 0,
                    likes: 0,
                    favorites: 0,
                    publishTime: new Date().toISOString(),
                    status: 'published',
                    accessLevel: 'free',
                    importInfo: {
                        originalFileName: novelData.originalFileName,
                        importTime: new Date().toISOString(),
                        importMethod: 'manual',
                        confidence: novelData.analysis || {}
                    }
                };

                data.novels.push(newNovel);

                results.push({
                    title: novelData.title,
                    success: true,
                    id: newNovel.id
                });

            } catch (error) {
                console.error('导入小说失败:', novelData.title, error);
                results.push({
                    title: novelData.title || '未知标题',
                    success: false,
                    error: error.message || '导入失败'
                });
            }
        }

        // 保存数据
        if (writeNovelsData(data)) {
            const successCount = results.filter(r => r.success).length;
            const failCount = results.filter(r => !r.success).length;

            res.json({
                success: true,
                data: {
                    totalNovels: novels.length,
                    successCount: successCount,
                    failCount: failCount,
                    results: results
                },
                message: `成功导入 ${successCount} 部小说${failCount > 0 ? `，失败 ${failCount} 部` : ''}`
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存数据失败'
            });
        }

    } catch (error) {
        console.error('批量导入失败:', error);
        res.status(500).json({
            success: false,
            message: '批量导入失败: ' + error.message
        });
    }
});

// AI服务集成类（可选功能）
class AIService {
    constructor() {
        // 这里可以配置不同的AI服务
        this.services = {
            deepseek: {
                name: 'DeepSeek',
                apiKey: process.env.DEEPSEEK_API_KEY,
                endpoint: 'https://api.deepseek.com/v1/chat/completions'
            },
            tongyi: {
                name: '通义千问',
                apiKey: process.env.TONGYI_API_KEY,
                endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
            }
        };
        this.enabled = false; // 默认禁用AI服务，需要配置API密钥后启用
    }

    async analyzeNovel(content, title) {
        if (!this.enabled) {
            return null;
        }

        try {
            // 构建分析提示
            const prompt = this.buildAnalysisPrompt(content, title);
            
            // 这里可以根据配置选择不同的AI服务
            const result = await this.callAIService(prompt);
            
            return this.parseAIResponse(result);
        } catch (error) {
            console.error('AI分析失败:', error);
            return null;
        }
    }

    buildAnalysisPrompt(content, title) {
        const categories = readCategoriesData();
        const categoryNames = categories.categories.map(c => c.name).join('、');
        
        return `请分析以下小说内容，提供分类和标签建议：

标题：${title}

内容摘录：${content.substring(0, 1000)}...

请按以下JSON格式返回分析结果：
{
  "category": "分类名称（从以下选择：${categoryNames}）",
  "confidence": 0.8,
  "tags": ["#标签1", "#标签2", "#标签3"],
  "summary": "简洁的内容摘要（150字以内）",
  "reasoning": "分析理由"
}

注意：
1. 分类必须从提供的选项中选择
2. 标签要以#开头，贴合内容特点
3. 摘要要简洁明了，突出主要情节
4. 置信度范围0-1`;
    }

    async callAIService(prompt) {
        // 这里是示例实现，实际使用时需要根据具体AI服务的API进行调用
        // 由于API密钥和具体实现会因服务而异，这里只提供框架
        
        // 示例：DeepSeek API调用
        if (this.services.deepseek.apiKey) {
            const response = await fetch(this.services.deepseek.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.services.deepseek.apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                throw new Error(`AI服务请求失败: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        }

        return null;
    }

    parseAIResponse(response) {
        try {
            // 提取JSON内容（可能包含在代码块中）
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                             response.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const jsonStr = jsonMatch[1] || jsonMatch[0];
                return JSON.parse(jsonStr);
            }
            
            return null;
        } catch (error) {
            console.error('解析AI响应失败:', error);
            return null;
        }
    }

    enableService(serviceName, apiKey) {
        if (this.services[serviceName]) {
            this.services[serviceName].apiKey = apiKey;
            this.enabled = true;
            console.log(`AI服务 ${this.services[serviceName].name} 已启用`);
        }
    }
}

// AI增强的批量上传API
app.post('/api/novels/batch-upload-ai', txtUpload.array('novels', 20), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有上传文件'
            });
        }

        const analyzer = new NovelAnalyzer();
        const aiService = new AIService();
        const results = [];

        for (const file of req.files) {
            try {
                const content = file.buffer.toString('utf8');
                
                if (!content || content.trim().length === 0) {
                    results.push({
                        filename: file.originalname,
                        success: false,
                        error: '文件内容为空'
                    });
                    continue;
                }

                // 基础分析
                let title = analyzer.extractTitleFromContent(content) || 
                           analyzer.extractTitleFromFilename(file.originalname);
                let analysis = analyzer.analyzeContent(content);

                // 如果基础分析置信度较低，尝试使用AI分析
                if (analysis.categoryConfidence < 0.7) {
                    const aiAnalysis = await aiService.analyzeNovel(content, title);
                    
                    if (aiAnalysis && aiAnalysis.confidence > analysis.categoryConfidence) {
                        // 使用AI分析结果
                        analysis.category = aiAnalysis.category;
                        analysis.categoryConfidence = aiAnalysis.confidence;
                        analysis.tags = aiAnalysis.tags || analysis.tags;
                        analysis.summary = aiAnalysis.summary || analysis.summary;
                        analysis.aiEnhanced = true;
                        analysis.aiReasoning = aiAnalysis.reasoning;
                    }
                }

                const novelData = {
                    originalFileName: file.originalname,
                    title: title,
                    content: content,
                    summary: analysis.summary,
                    category: analysis.category,
                    tags: analysis.tags,
                    analysis: {
                        titleSource: analyzer.extractTitleFromContent(content) ? 'content' : 'filename',
                        categoryConfidence: analysis.categoryConfidence,
                        tagConfidences: analysis.tagConfidences,
                        aiEnhanced: analysis.aiEnhanced || false,
                        aiReasoning: analysis.aiReasoning
                    },
                    coverType: 'text',
                    coverData: {
                        backgroundColor: '#E6F3FF',
                        textColor: '#4169E1'
                    }
                };

                results.push({
                    filename: file.originalname,
                    success: true,
                    data: novelData
                });

            } catch (error) {
                console.error('处理文件失败:', file.originalname, error);
                results.push({
                    filename: file.originalname,
                    success: false,
                    error: error.message || '文件处理失败'
                });
            }
        }

        res.json({
            success: true,
            data: {
                totalFiles: req.files.length,
                successCount: results.filter(r => r.success).length,
                failCount: results.filter(r => !r.success).length,
                results: results,
                aiEnhanced: results.some(r => r.success && r.data.analysis.aiEnhanced)
            },
            message: `成功解析 ${results.filter(r => r.success).length} 个文件`
        });

    } catch (error) {
        console.error('AI增强批量上传失败:', error);
        res.status(500).json({
            success: false,
            message: 'AI增强批量上传失败: ' + error.message
        });
    }
});

// 封面图片上传API
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

// =============== 评论系统相关API ===============

// 获取某个小说的评论列表
app.get('/api/novels/:id/comments', (req, res) => {
    try {
        const commentsData = readCommentsData();
        const novelId = parseInt(req.params.id);
        const { sort = 'time', page = 1, limit = 20 } = req.query;
        
        // 筛选出该小说的评论
        let novelComments = commentsData.comments.filter(comment => comment.novelId === novelId);
        
        // 排序
        switch (sort) {
            case 'time':
                novelComments.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
                break;
            case 'likes':
                novelComments.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                break;
            case 'replies':
                novelComments.sort((a, b) => (b.replies?.length || 0) - (a.replies?.length || 0));
                break;
        }
        
        // 分页
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedComments = novelComments.slice(startIndex, endIndex);
        
        // 获取用户信息
        const usersData = readUsersData();
        const commentsWithUserInfo = paginatedComments.map(comment => {
            const user = usersData.users.find(u => u.id === comment.userId);
            return {
                ...comment,
                user: user ? {
                    id: user.id,
                    username: user.username,
                    avatar: user.avatar
                } : null
            };
        });
        
        res.json({
            success: true,
            data: {
                comments: commentsWithUserInfo,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: novelComments.length,
                    totalPages: Math.ceil(novelComments.length / limitNum)
                },
                stats: {
                    totalComments: novelComments.length,
                    totalReplies: novelComments.reduce((sum, c) => sum + (c.replies?.length || 0), 0)
                }
            }
        });
    } catch (error) {
        console.error('获取评论列表失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 发布新评论
app.post('/api/novels/:id/comments', authenticateToken, (req, res) => {
    try {
        const commentsData = readCommentsData();
        const novelId = parseInt(req.params.id);
        const { content, parentId = null } = req.body;
        
        // 验证输入
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '评论内容不能为空'
            });
        }
        
        if (content.length > 1000) {
            return res.status(400).json({
                success: false,
                message: '评论内容不能超过1000字'
            });
        }
        
        // 验证小说是否存在
        const novelsData = readNovelsData();
        const novel = novelsData.novels.find(n => n.id === novelId);
        if (!novel) {
            return res.status(404).json({
                success: false,
                message: '小说不存在'
            });
        }
        
        // 如果是回复，验证父评论是否存在，并检查嵌套层级
        let level = 0;
        if (parentId) {
            const parentComment = commentsData.comments.find(c => c.id === parentId && c.novelId === novelId);
            if (!parentComment) {
                return res.status(404).json({
                    success: false,
                    message: '父评论不存在'
                });
            }
            
            // 计算嵌套层级（最多3级）
            level = parentComment.level + 1;
            if (level > 2) { // 0, 1, 2 三级
                return res.status(400).json({
                    success: false,
                    message: '评论嵌套层级不能超过3级'
                });
            }
        }
        
        // 生成新评论ID
        const newId = Math.max(...commentsData.comments.map(c => c.id), 0) + 1;
        
        // 创建新评论
        const newComment = {
            id: newId,
            novelId: novelId,
            userId: req.user.userId,
            parentId: parentId,
            level: level,
            content: content.trim(),
            likes: 0,
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString(),
            replies: [],
            isDeleted: false
        };
        
        commentsData.comments.push(newComment);
        
        // 如果是回复，更新父评论的replies数组
        if (parentId) {
            const parentComment = commentsData.comments.find(c => c.id === parentId);
            if (parentComment) {
                if (!parentComment.replies) {
                    parentComment.replies = [];
                }
                parentComment.replies.push(newId);
            }
        }
        
        if (writeCommentsData(commentsData)) {
            // 获取用户信息返回
            const usersData = readUsersData();
            const user = usersData.users.find(u => u.id === req.user.userId);
            
            res.json({
                success: true,
                data: {
                    ...newComment,
                    user: user ? {
                        id: user.id,
                        username: user.username,
                        avatar: user.avatar
                    } : null
                },
                message: '评论发布成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('发布评论失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 更新评论
app.put('/api/comments/:id', authenticateToken, (req, res) => {
    try {
        const commentsData = readCommentsData();
        const commentId = parseInt(req.params.id);
        const { content } = req.body;
        
        const comment = commentsData.comments.find(c => c.id === commentId);
        
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: '评论不存在'
            });
        }
        
        // 验证权限（只能编辑自己的评论）
        if (comment.userId !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: '无权限编辑此评论'
            });
        }
        
        // 验证输入
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '评论内容不能为空'
            });
        }
        
        if (content.length > 1000) {
            return res.status(400).json({
                success: false,
                message: '评论内容不能超过1000字'
            });
        }
        
        // 更新评论
        comment.content = content.trim();
        comment.updateTime = new Date().toISOString();
        
        if (writeCommentsData(commentsData)) {
            res.json({
                success: true,
                data: comment,
                message: '评论更新成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('更新评论失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 删除评论
app.delete('/api/comments/:id', authenticateToken, (req, res) => {
    try {
        const commentsData = readCommentsData();
        const commentId = parseInt(req.params.id);
        
        const comment = commentsData.comments.find(c => c.id === commentId);
        
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: '评论不存在'
            });
        }
        
        // 验证权限（只能删除自己的评论）
        if (comment.userId !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: '无权限删除此评论'
            });
        }
        
        // 软删除（保留数据结构）
        comment.isDeleted = true;
        comment.content = '[该评论已被删除]';
        comment.updateTime = new Date().toISOString();
        
        if (writeCommentsData(commentsData)) {
            res.json({
                success: true,
                message: '评论删除成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('删除评论失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 点赞/取消点赞评论  
app.post('/api/comments/:id/like', authenticateToken, (req, res) => {
    try {
        const commentsData = readCommentsData();
        const commentId = parseInt(req.params.id);
        
        const comment = commentsData.comments.find(c => c.id === commentId);
        
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: '评论不存在'
            });
        }
        
        // 初始化点赞用户列表
        if (!comment.likedUsers) {
            comment.likedUsers = [];
        }
        
        const userId = req.user.userId;
        const isLiked = comment.likedUsers.includes(userId);
        
        if (isLiked) {
            // 取消点赞
            comment.likedUsers = comment.likedUsers.filter(id => id !== userId);
            comment.likes = (comment.likes || 0) - 1;
        } else {
            // 点赞
            comment.likedUsers.push(userId);
            comment.likes = (comment.likes || 0) + 1;
        }
        
        if (writeCommentsData(commentsData)) {
            res.json({
                success: true,
                data: {
                    commentId: commentId,
                    likes: comment.likes,
                    isLiked: !isLiked
                },
                message: isLiked ? '取消点赞成功' : '点赞成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('点赞评论失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取评论详情（包含回复）
app.get('/api/comments/:id', (req, res) => {
    try {
        const commentsData = readCommentsData();
        const commentId = parseInt(req.params.id);
        
        const comment = commentsData.comments.find(c => c.id === commentId);
        
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: '评论不存在'
            });
        }
        
        // 获取回复列表
        const replies = comment.replies ? 
            commentsData.comments.filter(c => comment.replies.includes(c.id)) : [];
        
        // 获取用户信息
        const usersData = readUsersData();
        const user = usersData.users.find(u => u.id === comment.userId);
        
        const repliesWithUserInfo = replies.map(reply => {
            const replyUser = usersData.users.find(u => u.id === reply.userId);
            return {
                ...reply,
                user: replyUser ? {
                    id: replyUser.id,
                    username: replyUser.username,
                    avatar: replyUser.avatar
                } : null
            };
        });
        
        res.json({
            success: true,
            data: {
                ...comment,
                user: user ? {
                    id: user.id,
                    username: user.username,
                    avatar: user.avatar
                } : null,
                repliesData: repliesWithUserInfo
            }
        });
    } catch (error) {
        console.error('获取评论详情失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
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

// 管理员登录页面路由
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// 管理后台页面路由
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
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