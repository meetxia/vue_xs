const express = require('express');
const router = express.Router();

const { DataHandler, UserUtils } = require('../utils');
const { optionalAuthenticateToken, authenticateToken } = require('../middleware');

// 获取所有小说列表
router.get('/', optionalAuthenticateToken, (req, res) => {
    try {
        const data = DataHandler.readNovelsData();
        const { tag, search, limit, offset } = req.query;
        
        let novels = data.novels || [];
        
        // 获取用户会员状态
        let userMembership = { type: 'free', status: 'active', isValid: true };
        if (req.user) {
            const userData = DataHandler.readUsersData();
            const currentUser = userData.users.find(u => u.id === req.user.userId);
            if (currentUser) {
                userMembership = UserUtils.getUserMembershipStatus(currentUser);
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
            const hasAccess = UserUtils.checkContentAccess(userMembership, novel.accessLevel);
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
router.get('/:id', optionalAuthenticateToken, (req, res) => {
    try {
        const data = DataHandler.readNovelsData();
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
            const userData = DataHandler.readUsersData();
            const currentUser = userData.users.find(u => u.id === req.user.userId);
            if (currentUser) {
                userMembership = UserUtils.getUserMembershipStatus(currentUser);
            }
        }
        
        // 检查用户是否有权限访问此内容
        const hasAccess = UserUtils.checkContentAccess(userMembership, novel.accessLevel);
        
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
                content: null
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
        DataHandler.writeNovelsData(data);
        
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

// 创建新小说（管理功能）
router.post('/', (req, res) => {
    try {
        const data = DataHandler.readNovelsData();
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
        
        if (DataHandler.writeNovelsData(data)) {
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
router.put('/:id', (req, res) => {
    try {
        const data = DataHandler.readNovelsData();
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
            id: novelId,
            updated_at: new Date().toISOString()
        };
        
        data.novels[novelIndex] = updatedNovel;
        
        if (DataHandler.writeNovelsData(data)) {
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
router.delete('/:id', (req, res) => {
    try {
        const data = DataHandler.readNovelsData();
        const novelId = parseInt(req.params.id);
        const novelIndex = data.novels.findIndex(n => n.id === novelId);
        
        if (novelIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '小说不存在'
            });
        }
        
        data.novels.splice(novelIndex, 1);
        
        if (DataHandler.writeNovelsData(data)) {
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

// 点赞小说
router.post('/:id/like', (req, res) => {
    try {
        const data = DataHandler.readNovelsData();
        const novelId = parseInt(req.params.id);
        const novel = data.novels.find(n => n.id === novelId);
        
        if (!novel) {
            return res.status(404).json({
                success: false,
                message: '小说不存在'
            });
        }
        
        novel.likes = (novel.likes || 0) + 1;
        
        if (DataHandler.writeNovelsData(data)) {
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

// 收藏小说
router.post('/:id/favorite', (req, res) => {
    try {
        const data = DataHandler.readNovelsData();
        const novelId = parseInt(req.params.id);
        const novel = data.novels.find(n => n.id === novelId);
        
        if (!novel) {
            return res.status(404).json({
                success: false,
                message: '小说不存在'
            });
        }
        
        novel.favorites = (novel.favorites || 0) + 1;
        
        if (DataHandler.writeNovelsData(data)) {
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

// 获取某个小说的评论列表
router.get('/:id/comments', (req, res) => {
    try {
        const commentsData = DataHandler.readCommentsData();
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
        const usersData = DataHandler.readUsersData();
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
router.post('/:id/comments', authenticateToken, (req, res) => {
    try {
        const commentsData = DataHandler.readCommentsData();
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
        const novelsData = DataHandler.readNovelsData();
        const novel = novelsData.novels.find(n => n.id === novelId);
        if (!novel) {
            return res.status(404).json({
                success: false,
                message: '小说不存在'
            });
        }
        
        // 如果是回复，验证父评论是否存在
        let level = 0;
        if (parentId) {
            const parentComment = commentsData.comments.find(c => c.id === parentId && c.novelId === novelId);
            if (!parentComment) {
                return res.status(404).json({
                    success: false,
                    message: '父评论不存在'
                });
            }
            
            level = parentComment.level + 1;
            if (level > 2) {
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
        
        if (DataHandler.writeCommentsData(commentsData)) {
            // 获取用户信息返回
            const usersData = DataHandler.readUsersData();
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

// 批量删除小说
router.post('/batch-delete', (req, res) => {
    try {
        const { novelIds } = req.body;
        
        if (!novelIds || !Array.isArray(novelIds) || novelIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供要删除的作品ID列表'
            });
        }
        
        const data = DataHandler.readNovelsData();
        let deletedCount = 0;
        
        // 删除指定的小说
        novelIds.forEach(novelId => {
            const novelIndex = data.novels.findIndex(n => n.id === parseInt(novelId));
            if (novelIndex !== -1) {
                data.novels.splice(novelIndex, 1);
                deletedCount++;
            }
        });
        
        if (DataHandler.writeNovelsData(data)) {
            res.json({
                success: true,
                message: `成功删除 ${deletedCount} 部作品`,
                deletedCount
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('批量删除小说失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 批量修改小说状态
router.post('/batch-status', (req, res) => {
    try {
        const { novelIds, status } = req.body;
        
        if (!novelIds || !Array.isArray(novelIds) || novelIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供要修改的作品ID列表'
            });
        }
        
        if (!status || !['published', 'draft', 'archived'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: '请提供有效的状态值'
            });
        }
        
        const data = DataHandler.readNovelsData();
        let updatedCount = 0;
        
        // 更新指定小说的状态
        novelIds.forEach(novelId => {
            const novel = data.novels.find(n => n.id === parseInt(novelId));
            if (novel) {
                novel.status = status;
                novel.updated_at = new Date().toISOString();
                updatedCount++;
            }
        });
        
        if (DataHandler.writeNovelsData(data)) {
            res.json({
                success: true,
                message: `成功修改 ${updatedCount} 部作品状态`,
                updatedCount
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('批量修改状态失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 批量修改小说访问权限
router.post('/batch-access', (req, res) => {
    try {
        const { novelIds, accessLevel } = req.body;
        
        if (!novelIds || !Array.isArray(novelIds) || novelIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供要修改的作品ID列表'
            });
        }
        
        if (!accessLevel || !['free', 'premium', 'vip'].includes(accessLevel)) {
            return res.status(400).json({
                success: false,
                message: '请提供有效的访问权限级别'
            });
        }
        
        const data = DataHandler.readNovelsData();
        let updatedCount = 0;
        
        // 更新指定小说的访问权限
        novelIds.forEach(novelId => {
            const novel = data.novels.find(n => n.id === parseInt(novelId));
            if (novel) {
                novel.accessLevel = accessLevel;
                novel.updated_at = new Date().toISOString();
                updatedCount++;
            }
        });
        
        if (DataHandler.writeNovelsData(data)) {
            res.json({
                success: true,
                message: `成功修改 ${updatedCount} 部作品权限`,
                updatedCount
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('批量修改访问权限失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

module.exports = router;