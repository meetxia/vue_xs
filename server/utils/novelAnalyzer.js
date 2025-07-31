const path = require('path');
const DataHandler = require('./dataHandler');

class NovelAnalyzer {
    constructor() {
        this.categoriesData = DataHandler.readCategoriesData();
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

module.exports = NovelAnalyzer;