const express = require('express');
const router = express.Router();

const { DataHandler } = require('../utils');
const { authenticateToken } = require('../middleware');

// 获取某个小说的评论列表  
router.get('/novels/:id/comments', (req, res) => {
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
router.post('/novels/:id/comments', authenticateToken, (req, res) => {
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

// 更新评论
router.put('/:id', authenticateToken, (req, res) => {
    try {
        const commentsData = DataHandler.readCommentsData();
        const commentId = parseInt(req.params.id);
        const { content } = req.body;
        
        const comment = commentsData.comments.find(c => c.id === commentId);
        
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: '评论不存在'
            });
        }
        
        // 验证权限
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
        
        if (DataHandler.writeCommentsData(commentsData)) {
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
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const commentsData = DataHandler.readCommentsData();
        const commentId = parseInt(req.params.id);
        
        const comment = commentsData.comments.find(c => c.id === commentId);
        
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: '评论不存在'
            });
        }
        
        // 验证权限
        if (comment.userId !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: '无权限删除此评论'
            });
        }
        
        // 软删除
        comment.isDeleted = true;
        comment.content = '[该评论已被删除]';
        comment.updateTime = new Date().toISOString();
        
        if (DataHandler.writeCommentsData(commentsData)) {
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
router.post('/:id/like', authenticateToken, (req, res) => {
    try {
        const commentsData = DataHandler.readCommentsData();
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
        
        if (DataHandler.writeCommentsData(commentsData)) {
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

module.exports = router;