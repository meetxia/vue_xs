const express = require('express');
const path = require('path');
const router = express.Router();

// 导入所有路由模块
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const novelRoutes = require('./novels');
const membershipRoutes = require('./membership');
const commentRoutes = require('./comments');
const tagsRoutes = require('./tags');

const { DataHandler, NovelAnalyzer, AIService } = require('../utils');
const { imageUpload, txtUpload } = require('../middleware');

// 注册各个路由模块
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/novels', novelRoutes);
router.use('/membership', membershipRoutes);
router.use('/tags', tagsRoutes);

// 评论路由需要特殊处理，因为它包含在novels路由中
// router.use('/comments', commentRoutes);

// 其他API路由

// 获取所有标签
router.get('/tags', (req, res) => {
    try {
        const data = DataHandler.readNovelsData();
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

// 获取分类列表
router.get('/categories', (req, res) => {
    try {
        const data = DataHandler.readCategoriesData();
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

// 获取网站统计信息
router.get('/stats', (req, res) => {
    try {
        const data = DataHandler.readNovelsData();
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

// 批量上传TXT文件并解析
router.post('/novels/batch-upload', txtUpload.array('novels', 20), (req, res) => {
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
                const content = file.buffer.toString('utf8');
                
                if (!content || content.trim().length === 0) {
                    results.push({
                        filename: file.originalname,
                        success: false,
                        error: '文件内容为空'
                    });
                    continue;
                }

                let title = analyzer.extractTitleFromContent(content) || 
                           analyzer.extractTitleFromFilename(file.originalname);

                const analysis = analyzer.analyzeContent(content);

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
router.post('/novels/batch-import', (req, res) => {
    try {
        console.log('开始批量导入小说，请求体:', req.body);

        const { novels } = req.body;

        // 验证请求数据
        if (!novels || !Array.isArray(novels) || novels.length === 0) {
            console.log('批量导入失败：没有有效的小说数据');
            return res.status(400).json({
                success: false,
                message: '没有有效的小说数据'
            });
        }

        console.log(`准备导入 ${novels.length} 部小说`);

        // 读取现有数据
        const data = DataHandler.readNovelsData();
        console.log('当前数据库中的小说数量:', data.novels ? data.novels.length : 0);

        const results = [];

        // 安全地获取最大ID
        let maxId = 0;
        if (data.novels && data.novels.length > 0) {
            maxId = Math.max(...data.novels.map(n => n.id || 0));
        }
        console.log('当前最大ID:', maxId);

        // 处理每部小说
        for (let i = 0; i < novels.length; i++) {
            const novelData = novels[i];
            console.log(`处理第 ${i + 1} 部小说:`, novelData.title);

            try {
                // 数据验证
                if (!novelData || typeof novelData !== 'object') {
                    console.log('小说数据格式错误:', novelData);
                    results.push({
                        title: '未知标题',
                        success: false,
                        error: '小说数据格式错误'
                    });
                    continue;
                }

                if (!novelData.title || typeof novelData.title !== 'string' || novelData.title.trim() === '') {
                    console.log('小说标题无效:', novelData.title);
                    results.push({
                        title: novelData.title || '未知标题',
                        success: false,
                        error: '标题不能为空'
                    });
                    continue;
                }

                if (!novelData.content || typeof novelData.content !== 'string' || novelData.content.trim() === '') {
                    console.log('小说内容无效:', novelData.title);
                    results.push({
                        title: novelData.title,
                        success: false,
                        error: '内容不能为空'
                    });
                    continue;
                }

                // 检查标题是否已存在
                const existingNovel = data.novels && data.novels.find(n => n.title === novelData.title);
                if (existingNovel) {
                    console.log('标题已存在:', novelData.title);
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
                    title: novelData.title.trim(),
                    summary: (novelData.summary && typeof novelData.summary === 'string') ?
                             novelData.summary.trim() : '暂无简介',
                    content: novelData.content.trim(),
                    tags: Array.isArray(novelData.tags) ? novelData.tags : [],
                    category: (novelData.category && typeof novelData.category === 'string') ?
                              novelData.category : '其他',
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
                        originalFileName: novelData.originalFileName || '未知文件',
                        importTime: new Date().toISOString(),
                        importMethod: 'batch',
                        confidence: novelData.analysis || {}
                    }
                };

                console.log('创建新小说对象成功:', newNovel.title, 'ID:', newNovel.id);

                // 确保novels数组存在
                if (!data.novels) {
                    data.novels = [];
                }

                data.novels.push(newNovel);

                results.push({
                    title: novelData.title,
                    success: true,
                    id: newNovel.id
                });

                console.log(`小说 "${novelData.title}" 导入成功，ID: ${newNovel.id}`);

            } catch (error) {
                console.error('导入单个小说失败:', novelData.title || '未知标题', error);
                console.error('错误堆栈:', error.stack);
                results.push({
                    title: novelData.title || '未知标题',
                    success: false,
                    error: `导入失败: ${error.message || '未知错误'}`
                });
            }
        }

        // 保存数据到文件
        console.log('开始保存数据到文件...');
        const saveResult = DataHandler.writeNovelsData(data);

        if (saveResult) {
            const successCount = results.filter(r => r.success).length;
            const failCount = results.filter(r => !r.success).length;

            console.log(`批量导入完成：成功 ${successCount} 部，失败 ${failCount} 部`);

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
            console.error('保存数据到文件失败');
            res.status(500).json({
                success: false,
                message: '保存数据失败，请检查文件权限'
            });
        }

    } catch (error) {
        console.error('批量导入过程中发生错误:', error);
        console.error('错误堆栈:', error.stack);
        res.status(500).json({
            success: false,
            message: `批量导入失败: ${error.message || '服务器内部错误'}`
        });
    }
});

// 封面图片上传API
router.post('/upload/cover', imageUpload.single('cover'), (req, res) => {
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
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: '服务运行正常',
        timestamp: new Date().toISOString()
    });
});

// 页面路由
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public', 'index.html'));
});

router.get('/read', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public', 'read.html'));
});

module.exports = router;