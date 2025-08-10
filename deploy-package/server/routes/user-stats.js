const express = require('express');
const router = express.Router();
const { DataHandler } = require('../utils');
const { authenticateToken } = require('../middleware');

// 获取用户阅读统计
router.get('/reading-stats', authenticateToken, (req, res) => {
    try {
        const userData = DataHandler.readUsersData();
        const novelsData = DataHandler.readNovelsData();
        const user = userData.users.find(u => u.id === req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 计算阅读统计
        const stats = calculateReadingStats(user, novelsData.novels);
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        console.error('获取阅读统计失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取用户作品
router.get('/works', authenticateToken, (req, res) => {
    try {
        const novelsData = DataHandler.readNovelsData();
        const userWorks = novelsData.novels.filter(novel => novel.authorId === req.user.userId);
        
        const worksWithStats = userWorks.map(work => ({
            id: work.id,
            title: work.title,
            summary: work.summary,
            category: work.category,
            tags: work.tags,
            views: work.views || 0,
            likes: work.likes || 0,
            favorites: work.favorites || 0,
            publishTime: work.publishTime,
            updateTime: work.updateTime || work.publishTime,
            status: work.status,
            accessLevel: work.accessLevel
        }));

        res.json({
            success: true,
            data: worksWithStats
        });
        
    } catch (error) {
        console.error('获取用户作品失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取互动历史
router.get('/interactions', authenticateToken, (req, res) => {
    try {
        const userData = DataHandler.readUsersData();
        const novelsData = DataHandler.readNovelsData();
        const user = userData.users.find(u => u.id === req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const interactions = buildInteractionHistory(user, novelsData.novels);
        
        res.json({
            success: true,
            data: interactions
        });
        
    } catch (error) {
        console.error('获取互动历史失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取成就系统
router.get('/achievements', authenticateToken, (req, res) => {
    try {
        const userData = DataHandler.readUsersData();
        const novelsData = DataHandler.readNovelsData();
        const user = userData.users.find(u => u.id === req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const achievements = calculateAchievements(user, novelsData.novels);
        
        res.json({
            success: true,
            data: achievements
        });
        
    } catch (error) {
        console.error('获取成就数据失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 更新阅读进度（用于追踪阅读时间）
router.post('/reading-progress', authenticateToken, (req, res) => {
    try {
        const { novelId, readingTime, progress } = req.body;
        const userData = DataHandler.readUsersData();
        const user = userData.users.find(u => u.id === req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 更新用户阅读时间
        if (!user.stats) user.stats = {};
        user.stats.readingTime = (user.stats.readingTime || 0) + (readingTime || 0);
        
        // 记录阅读活动
        if (!user.readingHistory) user.readingHistory = [];
        
        const existingRecord = user.readingHistory.find(r => r.novelId === novelId);
        if (existingRecord) {
            existingRecord.lastReadTime = new Date().toISOString();
            existingRecord.progress = progress || existingRecord.progress;
            existingRecord.totalReadingTime = (existingRecord.totalReadingTime || 0) + (readingTime || 0);
        } else {
            user.readingHistory.push({
                novelId,
                lastReadTime: new Date().toISOString(),
                progress: progress || 0,
                totalReadingTime: readingTime || 0
            });
        }

        // 添加活动日志
        if (!user.activityLog) user.activityLog = [];
        user.activityLog.push({
            action: 'read',
            timestamp: new Date().toISOString(),
            details: `阅读小说ID: ${novelId}，时长: ${readingTime}分钟`,
            novelId
        });

        DataHandler.writeUsersData(userData);
        
        res.json({
            success: true,
            message: '阅读进度已更新'
        });
        
    } catch (error) {
        console.error('更新阅读进度失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 计算阅读统计的辅助函数
function calculateReadingStats(user, novels) {
    const readingHistory = user.readingHistory || [];
    const stats = user.stats || {};
    
    // 基础统计
    const totalReadingTime = Math.floor((stats.readingTime || 0) / 60); // 转换为小时
    const booksRead = readingHistory.filter(r => r.progress >= 100).length;
    
    // 计算连续阅读天数
    const readingStreak = calculateReadingStreak(user.activityLog || []);
    
    // 分析阅读偏好
    const preferences = analyzeReadingPreferences(user, novels);
    
    // 获取最近阅读记录
    const recentReading = getRecentReadingRecords(readingHistory, novels);
    
    return {
        totalReadingTime: `${totalReadingTime}小时`,
        booksRead: `${booksRead}本`,
        readingStreak: `${readingStreak}天`,
        preferences,
        recentReading
    };
}

function calculateReadingStreak(activityLog) {
    const readActivities = activityLog
        .filter(log => log.action === 'read')
        .map(log => new Date(log.timestamp).toDateString())
        .filter((date, index, self) => self.indexOf(date) === index)
        .sort((a, b) => new Date(b) - new Date(a));
    
    if (readActivities.length === 0) return 0;
    
    let streak = 1;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    // 检查是否今天或昨天有阅读记录
    if (readActivities[0] !== today && readActivities[0] !== yesterday) {
        return 0;
    }
    
    // 计算连续天数
    for (let i = 1; i < readActivities.length; i++) {
        const currentDate = new Date(readActivities[i]);
        const previousDate = new Date(readActivities[i - 1]);
        const diffDays = Math.floor((previousDate - currentDate) / (24 * 60 * 60 * 1000));
        
        if (diffDays === 1) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

function analyzeReadingPreferences(user, novels) {
    const readingHistory = user.readingHistory || [];
    const preferences = {};
    
    readingHistory.forEach(record => {
        const novel = novels.find(n => n.id === record.novelId);
        if (novel && novel.category) {
            preferences[novel.category] = (preferences[novel.category] || 0) + 1;
        }
    });
    
    const total = Object.values(preferences).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
        return { '言情': 45, '现代': 30, '古代': 15, '玄幻': 10 };
    }
    
    const percentages = {};
    Object.entries(preferences).forEach(([category, count]) => {
        percentages[category] = Math.round((count / total) * 100);
    });
    
    return percentages;
}

function getRecentReadingRecords(readingHistory, novels) {
    return readingHistory
        .sort((a, b) => new Date(b.lastReadTime) - new Date(a.lastReadTime))
        .slice(0, 5)
        .map(record => {
            const novel = novels.find(n => n.id === record.novelId);
            return {
                title: novel ? novel.title : '未知作品',
                progress: record.progress || 0,
                lastRead: new Date(record.lastReadTime).toLocaleDateString()
            };
        });
}

function buildInteractionHistory(user, novels) {
    const activityLog = user.activityLog || [];
    
    // 点赞记录
    const likes = activityLog
        .filter(log => log.action === 'like')
        .map(log => {
            const novel = novels.find(n => n.id === log.novelId);
            return {
                title: novel ? novel.title : '未知作品',
                date: new Date(log.timestamp).toLocaleDateString(),
                novelId: log.novelId
            };
        });
    
    // 收藏列表
    const favorites = (user.favorites || []).map(novelId => {
        const novel = novels.find(n => n.id === novelId);
        const favoriteLog = activityLog.find(log => 
            log.action === 'favorite' && log.novelId === novelId
        );
        
        return {
            title: novel ? novel.title : '未知作品',
            author: novel ? novel.author : '未知作者',
            date: favoriteLog ? new Date(favoriteLog.timestamp).toLocaleDateString() : '未知',
            novelId
        };
    });
    
    // 评论历史（这里假设评论存储在小说的评论系统中）
    const comments = activityLog
        .filter(log => log.action === 'comment')
        .map(log => {
            const novel = novels.find(n => n.id === log.novelId);
            return {
                novelTitle: novel ? novel.title : '未知作品',
                content: log.details,
                date: new Date(log.timestamp).toLocaleDateString(),
                novelId: log.novelId
            };
        });
    
    return { likes, favorites, comments };
}

function calculateAchievements(user, novels) {
    const stats = user.stats || {};
    const activityLog = user.activityLog || [];
    const readingHistory = user.readingHistory || [];
    
    const achievements = [
        {
            id: 1,
            name: '新手上路',
            description: '完成第一次登录',
            icon: '🎉',
            unlocked: true,
            unlockedAt: user.registerTime ? new Date(user.registerTime).toLocaleDateString() : '未知'
        },
        {
            id: 2,
            name: '阅读新手',
            description: '累计阅读1小时',
            icon: '📚',
            unlocked: (stats.readingTime || 0) >= 60,
            unlockedAt: (stats.readingTime || 0) >= 60 ? getAchievementUnlockDate(activityLog, 'read') : null
        },
        {
            id: 3,
            name: '阅读达人',
            description: '累计阅读10小时',
            icon: '📖',
            unlocked: (stats.readingTime || 0) >= 600,
            unlockedAt: (stats.readingTime || 0) >= 600 ? getAchievementUnlockDate(activityLog, 'read') : null
        },
        {
            id: 4,
            name: '书虫',
            description: '阅读完成5本小说',
            icon: '🐛',
            unlocked: readingHistory.filter(r => r.progress >= 100).length >= 5,
            unlockedAt: readingHistory.filter(r => r.progress >= 100).length >= 5 ? '最近' : null
        },
        {
            id: 5,
            name: '点赞之星',
            description: '累计点赞50次',
            icon: '⭐',
            unlocked: activityLog.filter(log => log.action === 'like').length >= 50,
            unlockedAt: activityLog.filter(log => log.action === 'like').length >= 50 ? '最近' : null
        },
        {
            id: 6,
            name: '收藏家',
            description: '收藏20部作品',
            icon: '💎',
            unlocked: (user.favorites || []).length >= 20,
            unlockedAt: (user.favorites || []).length >= 20 ? '最近' : null
        },
        {
            id: 7,
            name: '忠实读者',
            description: '连续阅读7天',
            icon: '🔥',
            unlocked: calculateReadingStreak(activityLog) >= 7,
            unlockedAt: calculateReadingStreak(activityLog) >= 7 ? '最近' : null
        },
        {
            id: 8,
            name: '会员用户',
            description: '开通会员服务',
            icon: '👑',
            unlocked: user.membership && user.membership.type !== 'free',
            unlockedAt: user.membership && user.membership.type !== 'free' ? 
                new Date(user.membership.startDate).toLocaleDateString() : null
        }
    ];
    
    return achievements;
}

function getAchievementUnlockDate(activityLog, action) {
    const activities = activityLog.filter(log => log.action === action);
    return activities.length > 0 ? 
        new Date(activities[0].timestamp).toLocaleDateString() : '最近';
}

// 保存用户设置
router.put('/settings', authenticateToken, (req, res) => {
    try {
        const userData = DataHandler.readUsersData();
        const user = userData.users.find(u => u.id === req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 更新用户设置
        const settings = req.body;
        
        // 验证设置数据
        if (!validateUserSettings(settings)) {
            return res.status(400).json({
                success: false,
                message: '设置数据格式错误'
            });
        }

        // 保存设置
        user.settings = {
            ...user.settings,
            ...settings,
            lastUpdated: new Date().toISOString()
        };

        DataHandler.writeUsersData(userData);
        
        res.json({
            success: true,
            message: '设置保存成功',
            data: user.settings
        });
        
    } catch (error) {
        console.error('保存用户设置失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取用户详细统计
router.get('/detailed-stats', authenticateToken, (req, res) => {
    try {
        const userData = DataHandler.readUsersData();
        const novelsData = DataHandler.readNovelsData();
        const user = userData.users.find(u => u.id === req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const detailedStats = calculateDetailedStats(user, novelsData.novels);
        
        res.json({
            success: true,
            data: detailedStats
        });
        
    } catch (error) {
        console.error('获取详细统计失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取阅读热力图数据
router.get('/reading-heatmap', authenticateToken, (req, res) => {
    try {
        const userData = DataHandler.readUsersData();
        const user = userData.users.find(u => u.id === req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const heatmapData = generateReadingHeatmap(user.activityLog || []);
        
        res.json({
            success: true,
            data: heatmapData
        });
        
    } catch (error) {
        console.error('获取阅读热力图失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取个性化推荐
router.get('/recommendations', authenticateToken, (req, res) => {
    try {
        const userData = DataHandler.readUsersData();
        const novelsData = DataHandler.readNovelsData();
        const user = userData.users.find(u => u.id === req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const recommendations = generatePersonalizedRecommendations(user, novelsData.novels);
        
        res.json({
            success: true,
            data: recommendations
        });
        
    } catch (error) {
        console.error('获取推荐失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 删除阅读记录
router.delete('/reading-history/:novelId', authenticateToken, (req, res) => {
    try {
        const userData = DataHandler.readUsersData();
        const user = userData.users.find(u => u.id === req.user.userId);
        const novelId = parseInt(req.params.novelId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 删除阅读历史记录
        if (user.readingHistory) {
            user.readingHistory = user.readingHistory.filter(r => r.novelId !== novelId);
        }

        // 删除相关活动记录
        if (user.activityLog) {
            user.activityLog = user.activityLog.filter(log => log.novelId !== novelId);
        }

        DataHandler.writeUsersData(userData);
        
        res.json({
            success: true,
            message: '阅读记录删除成功'
        });
        
    } catch (error) {
        console.error('删除阅读记录失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 验证用户设置数据
function validateUserSettings(settings) {
    // 基本验证
    if (typeof settings !== 'object') return false;
    
    // 验证特定字段
    if (settings.fontSize && !['small', 'medium', 'large', 'extra-large'].includes(settings.fontSize)) {
        return false;
    }
    
    if (settings.themeColor && !/^#[0-9A-F]{6}$/i.test(settings.themeColor)) {
        return false;
    }
    
    return true;
}

// 计算详细统计
function calculateDetailedStats(user, novels) {
    const readingHistory = user.readingHistory || [];
    const activityLog = user.activityLog || [];
    const stats = user.stats || {};
    
    // 基础统计
    const totalReadingTime = stats.readingTime || 0;
    const totalBooks = readingHistory.length;
    const completedBooks = readingHistory.filter(r => r.progress >= 100).length;
    const inProgressBooks = readingHistory.filter(r => r.progress > 0 && r.progress < 100).length;
    
    // 阅读习惯分析
    const readingPatterns = analyzeReadingPatterns(activityLog);
    
    // 阅读速度统计
    const readingSpeed = calculateReadingSpeed(readingHistory, novels);
    
    // 偏好分析
    const preferences = analyzeDetailedPreferences(readingHistory, novels);
    
    // 成就进度
    const achievements = calculateAchievementProgress(user, novels);
    
    return {
        overview: {
            totalReadingTime: Math.floor(totalReadingTime / 60), // 转换为小时
            totalBooks,
            completedBooks,
            inProgressBooks,
            completionRate: totalBooks > 0 ? Math.round((completedBooks / totalBooks) * 100) : 0
        },
        patterns: readingPatterns,
        speed: readingSpeed,
        preferences: preferences,
        achievements: achievements
    };
}

function analyzeReadingPatterns(activityLog) {
    const readActivities = activityLog.filter(log => log.action === 'read');
    
    if (readActivities.length === 0) {
        return {
            peakHours: [],
            activeWeekdays: [],
            readingStreak: 0,
            averageSessionTime: 0
        };
    }

    // 分析阅读时间分布
    const hourCounts = {};
    const weekdayCounts = {};
    
    readActivities.forEach(activity => {
        const date = new Date(activity.timestamp);
        const hour = date.getHours();
        const weekday = date.getDay();
        
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        weekdayCounts[weekday] = (weekdayCounts[weekday] || 0) + 1;
    });

    // 找出峰值时间
    const sortedHours = Object.entries(hourCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));

    // 找出活跃工作日
    const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const activeWeekdays = Object.entries(weekdayCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([day]) => weekdayNames[parseInt(day)]);

    return {
        peakHours: sortedHours.map(hour => `${hour}:00-${hour + 1}:00`),
        activeWeekdays,
        readingStreak: calculateReadingStreak(activityLog),
        averageSessionTime: Math.round(readActivities.length > 0 ? 
            readActivities.reduce((sum, activity) => sum + (activity.duration || 30), 0) / readActivities.length : 0)
    };
}

function calculateReadingSpeed(readingHistory, novels) {
    const completedBooks = readingHistory.filter(r => r.progress >= 100);
    
    if (completedBooks.length === 0) {
        return {
            averageTime: 0,
            booksPerMonth: 0,
            efficiency: 'normal'
        };
    }

    // 计算平均完成时间
    const totalTime = completedBooks.reduce((sum, book) => {
        const novel = novels.find(n => n.id === book.novelId);
        return sum + (book.totalReadingTime || 0);
    }, 0);

    const averageTime = Math.round(totalTime / completedBooks.length);
    
    // 计算月阅读量
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentBooks = completedBooks.filter(book => 
        new Date(book.lastReadTime) >= thirtyDaysAgo
    );
    const booksPerMonth = recentBooks.length;

    // 判断效率
    let efficiency = 'normal';
    if (averageTime < 300) efficiency = 'fast'; // 小于5小时
    else if (averageTime > 900) efficiency = 'slow'; // 大于15小时

    return {
        averageTime,
        booksPerMonth,
        efficiency
    };
}

function analyzeDetailedPreferences(readingHistory, novels) {
    const preferences = {
        genres: {},
        authors: {},
        lengths: { short: 0, medium: 0, long: 0 },
        themes: {}
    };

    readingHistory.forEach(record => {
        const novel = novels.find(n => n.id === record.novelId);
        if (!novel) return;

        // 类型偏好
        if (novel.category) {
            preferences.genres[novel.category] = (preferences.genres[novel.category] || 0) + 1;
        }

        // 作者偏好
        if (novel.author) {
            preferences.authors[novel.author] = (preferences.authors[novel.author] || 0) + 1;
        }

        // 长度偏好
        const length = novel.content ? novel.content.length : 0;
        if (length < 50000) preferences.lengths.short++;
        else if (length < 200000) preferences.lengths.medium++;
        else preferences.lengths.long++;

        // 标签偏好
        if (novel.tags) {
            novel.tags.forEach(tag => {
                preferences.themes[tag] = (preferences.themes[tag] || 0) + 1;
            });
        }
    });

    return preferences;
}

function calculateAchievementProgress(user, novels) {
    const stats = user.stats || {};
    const activityLog = user.activityLog || [];
    const readingHistory = user.readingHistory || [];

    const achievements = [
        {
            id: 'first_book',
            name: '初次阅读',
            description: '完成第一本小说',
            progress: readingHistory.filter(r => r.progress >= 100).length,
            target: 1,
            completed: readingHistory.filter(r => r.progress >= 100).length >= 1
        },
        {
            id: 'reading_time',
            name: '时间达人',
            description: '累计阅读100小时',
            progress: Math.floor((stats.readingTime || 0) / 60),
            target: 100,
            completed: (stats.readingTime || 0) >= 6000
        },
        {
            id: 'book_lover',
            name: '书虫',
            description: '完成20本小说',
            progress: readingHistory.filter(r => r.progress >= 100).length,
            target: 20,
            completed: readingHistory.filter(r => r.progress >= 100).length >= 20
        },
        {
            id: 'daily_reader',
            name: '每日阅读',
            description: '连续阅读30天',
            progress: calculateReadingStreak(activityLog),
            target: 30,
            completed: calculateReadingStreak(activityLog) >= 30
        }
    ];

    return achievements;
}

function generateReadingHeatmap(activityLog) {
    const readActivities = activityLog.filter(log => log.action === 'read');
    const heatmapData = {};
    
    // 生成过去一年的热力图数据
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    // 初始化数据
    for (let date = new Date(oneYearAgo); date <= now; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        heatmapData[dateStr] = 0;
    }
    
    // 填充实际数据
    readActivities.forEach(activity => {
        const dateStr = new Date(activity.timestamp).toISOString().split('T')[0];
        if (heatmapData.hasOwnProperty(dateStr)) {
            heatmapData[dateStr]++;
        }
    });
    
    return heatmapData;
}

function generatePersonalizedRecommendations(user, novels) {
    const readingHistory = user.readingHistory || [];
    const preferences = analyzeReadingPreferences(user, novels);
    
    // 获取用户已读的小说ID
    const readNovelIds = readingHistory.map(r => r.novelId);
    
    // 过滤掉已读的小说
    const unreadNovels = novels.filter(novel => !readNovelIds.includes(novel.id));
    
    // 基于偏好进行评分和排序
    const scoredNovels = unreadNovels.map(novel => {
        let score = 0;
        
        // 类型匹配加分
        if (novel.category && preferences[novel.category]) {
            score += preferences[novel.category] * 0.4;
        }
        
        // 标签匹配加分
        if (novel.tags) {
            novel.tags.forEach(tag => {
                if (preferences[tag]) {
                    score += preferences[tag] * 0.2;
                }
            });
        }
        
        // 热度加分
        score += (novel.views || 0) * 0.0001;
        score += (novel.likes || 0) * 0.001;
        
        return {
            ...novel,
            recommendationScore: score
        };
    });
    
    // 排序并返回前10个推荐
    return scoredNovels
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 10)
        .map(novel => ({
            id: novel.id,
            title: novel.title,
            author: novel.author,
            category: novel.category,
            summary: novel.summary,
            tags: novel.tags,
            score: Math.round(novel.recommendationScore * 100) / 100,
            reason: generateRecommendationReason(novel, preferences)
        }));
}

module.exports = router;