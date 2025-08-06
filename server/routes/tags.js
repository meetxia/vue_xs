const express = require('express');
const router = express.Router();
const { DataHandler } = require('../utils');
const { requireAdmin } = require('../middleware/auth');

// 获取所有分类和标签
router.get('/categories', (req, res) => {
    try {
        const categoriesData = DataHandler.readCategoriesData();
        res.json({
            success: true,
            data: categoriesData
        });
    } catch (error) {
        console.error('获取分类失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 管理员：添加新分类
router.post('/categories', requireAdmin, (req, res) => {
    try {
        const { name, description, keywords, tags } = req.body;
        
        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: '分类名称和描述都是必填项'
            });
        }
        
        const categoriesData = DataHandler.readCategoriesData();
        
        // 检查分类是否已存在
        const existingCategory = categoriesData.categories.find(cat => cat.name === name);
        if (existingCategory) {
            return res.status(409).json({
                success: false,
                message: '分类名称已存在'
            });
        }
        
        // 生成新ID
        const maxId = Math.max(...categoriesData.categories.map(cat => cat.id), 0);
        const newCategory = {
            id: maxId + 1,
            name,
            description,
            keywords: keywords || [],
            tags: tags || []
        };
        
        categoriesData.categories.push(newCategory);
        
        if (DataHandler.writeCategoriesData(categoriesData)) {
            res.json({
                success: true,
                data: newCategory,
                message: '分类创建成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('添加分类失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 管理员：更新分类
router.put('/categories/:id', requireAdmin, (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        const { name, description, keywords, tags } = req.body;
        
        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: '分类名称和描述都是必填项'
            });
        }
        
        const categoriesData = DataHandler.readCategoriesData();
        const categoryIndex = categoriesData.categories.findIndex(cat => cat.id === categoryId);
        
        if (categoryIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '分类不存在'
            });
        }
        
        // 检查名称冲突
        const existingCategory = categoriesData.categories.find(cat => 
            cat.name === name && cat.id !== categoryId
        );
        if (existingCategory) {
            return res.status(409).json({
                success: false,
                message: '分类名称已存在'
            });
        }
        
        // 更新分类
        categoriesData.categories[categoryIndex] = {
            ...categoriesData.categories[categoryIndex],
            name,
            description,
            keywords: keywords || [],
            tags: tags || []
        };
        
        if (DataHandler.writeCategoriesData(categoriesData)) {
            res.json({
                success: true,
                data: categoriesData.categories[categoryIndex],
                message: '分类更新成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('更新分类失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 管理员：删除分类
router.delete('/categories/:id', requireAdmin, (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        
        const categoriesData = DataHandler.readCategoriesData();
        const categoryIndex = categoriesData.categories.findIndex(cat => cat.id === categoryId);
        
        if (categoryIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '分类不存在'
            });
        }
        
        const categoryName = categoriesData.categories[categoryIndex].name;
        
        // 检查是否有小说使用此分类
        const novelsData = DataHandler.readNovelsData();
        const novelsUsingCategory = novelsData.novels.filter(novel => novel.category === categoryName);
        
        if (novelsUsingCategory.length > 0) {
            return res.status(409).json({
                success: false,
                message: `无法删除：有 ${novelsUsingCategory.length} 部作品正在使用此分类`,
                data: {
                    affectedNovels: novelsUsingCategory.length
                }
            });
        }
        
        // 删除分类
        categoriesData.categories.splice(categoryIndex, 1);
        
        if (DataHandler.writeCategoriesData(categoriesData)) {
            res.json({
                success: true,
                message: '分类删除成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('删除分类失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 管理员：添加通用标签
router.post('/common-tags', requireAdmin, (req, res) => {
    try {
        const { tag } = req.body;
        
        if (!tag || typeof tag !== 'string' || !tag.trim()) {
            return res.status(400).json({
                success: false,
                message: '标签内容不能为空'
            });
        }
        
        const cleanTag = tag.trim();
        if (!cleanTag.startsWith('#')) {
            return res.status(400).json({
                success: false,
                message: '标签必须以#开头'
            });
        }
        
        const categoriesData = DataHandler.readCategoriesData();
        
        // 检查标签是否已存在
        if (categoriesData.commonTags.includes(cleanTag)) {
            return res.status(409).json({
                success: false,
                message: '标签已存在'
            });
        }
        
        categoriesData.commonTags.push(cleanTag);
        
        if (DataHandler.writeCategoriesData(categoriesData)) {
            res.json({
                success: true,
                data: { tag: cleanTag },
                message: '标签添加成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('添加标签失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 管理员：删除通用标签
router.delete('/common-tags', requireAdmin, (req, res) => {
    try {
        const { tag } = req.body;
        
        if (!tag) {
            return res.status(400).json({
                success: false,
                message: '标签参数缺失'
            });
        }
        
        const categoriesData = DataHandler.readCategoriesData();
        const tagIndex = categoriesData.commonTags.indexOf(tag);
        
        if (tagIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '标签不存在'
            });
        }
        
        // 检查是否有小说使用此标签
        const novelsData = DataHandler.readNovelsData();
        const novelsUsingTag = novelsData.novels.filter(novel => 
            novel.tags && novel.tags.includes(tag)
        );
        
        if (novelsUsingTag.length > 0) {
            return res.status(409).json({
                success: false,
                message: `无法删除：有 ${novelsUsingTag.length} 部作品正在使用此标签`,
                data: {
                    affectedNovels: novelsUsingTag.length,
                    sampleTitles: novelsUsingTag.slice(0, 3).map(n => n.title)
                }
            });
        }
        
        // 删除标签
        categoriesData.commonTags.splice(tagIndex, 1);
        
        if (DataHandler.writeCategoriesData(categoriesData)) {
            res.json({
                success: true,
                message: '标签删除成功'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '保存失败'
            });
        }
    } catch (error) {
        console.error('删除标签失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 获取标签使用统计
router.get('/statistics', requireAdmin, (req, res) => {
    try {
        const categoriesData = DataHandler.readCategoriesData();
        const novelsData = DataHandler.readNovelsData();
        
        // 统计分类使用情况
        const categoryStats = categoriesData.categories.map(category => {
            const count = novelsData.novels.filter(novel => novel.category === category.name).length;
            return {
                id: category.id,
                name: category.name,
                count,
                percentage: novelsData.novels.length > 0 ? ((count / novelsData.novels.length) * 100).toFixed(1) : 0
            };
        });
        
        // 统计标签使用情况
        const tagStats = {};
        novelsData.novels.forEach(novel => {
            if (novel.tags) {
                novel.tags.forEach(tag => {
                    tagStats[tag] = (tagStats[tag] || 0) + 1;
                });
            }
        });
        
        // 按使用频率排序
        const sortedTagStats = Object.entries(tagStats)
            .sort((a, b) => b[1] - a[1])
            .map(([tag, count]) => ({
                tag,
                count,
                percentage: novelsData.novels.length > 0 ? ((count / novelsData.novels.length) * 100).toFixed(1) : 0
            }));
        
        res.json({
            success: true,
            data: {
                totalCategories: categoriesData.categories.length,
                totalCommonTags: categoriesData.commonTags.length,
                totalNovels: novelsData.novels.length,
                categoryUsage: categoryStats,
                tagUsage: sortedTagStats.slice(0, 20), // 只返回前20个最常用标签
                unusedCommonTags: categoriesData.commonTags.filter(tag => !tagStats[tag])
            }
        });
    } catch (error) {
        console.error('获取标签统计失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

module.exports = router;