const fs = require('fs');
const config = require('../config');

class DataHandler {
    // 读取小说数据
    static readNovelsData() {
        try {
            console.log('正在读取小说数据文件:', config.dataPath.novels);

            // 检查文件是否存在
            if (!fs.existsSync(config.dataPath.novels)) {
                console.log('小说数据文件不存在，创建默认数据');
                const defaultData = { novels: [] };
                this.writeNovelsData(defaultData);
                return defaultData;
            }

            const data = fs.readFileSync(config.dataPath.novels, 'utf8');
            const parsedData = JSON.parse(data);

            // 确保数据结构正确
            if (!parsedData.novels || !Array.isArray(parsedData.novels)) {
                console.log('数据结构异常，修复为默认结构');
                parsedData.novels = [];
            }

            console.log(`成功读取小说数据，共 ${parsedData.novels.length} 部小说`);
            return parsedData;
        } catch (error) {
            console.error('读取小说数据失败:', error);
            console.error('错误详情:', error.message);
            return { novels: [] };
        }
    }

    // 写入小说数据
    static writeNovelsData(data) {
        try {
            console.log('正在写入小说数据到文件:', config.dataPath.novels);

            // 验证数据结构
            if (!data || typeof data !== 'object') {
                throw new Error('数据格式无效');
            }

            if (!data.novels || !Array.isArray(data.novels)) {
                throw new Error('novels字段必须是数组');
            }

            // 确保目录存在
            const dir = require('path').dirname(config.dataPath.novels);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log('创建数据目录:', dir);
            }

            // 写入文件
            fs.writeFileSync(config.dataPath.novels, JSON.stringify(data, null, 2), 'utf8');
            console.log(`成功写入小说数据，共 ${data.novels.length} 部小说`);
            return true;
        } catch (error) {
            console.error('写入小说数据失败:', error);
            console.error('错误详情:', error.message);
            console.error('数据路径:', config.dataPath.novels);
            return false;
        }
    }

    // 读取用户数据
    static readUsersData() {
        try {
            const data = fs.readFileSync(config.dataPath.users, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('读取用户数据失败:', error);
            return { users: [], sessions: [] };
        }
    }

    // 写入用户数据
    static writeUsersData(data) {
        try {
            fs.writeFileSync(config.dataPath.users, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('写入用户数据失败:', error);
            return false;
        }
    }

    // 读取评论数据
    static readCommentsData() {
        try {
            const data = fs.readFileSync(config.dataPath.comments, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('读取评论数据失败:', error);
            return { comments: [] };
        }
    }

    // 写入评论数据  
    static writeCommentsData(data) {
        try {
            fs.writeFileSync(config.dataPath.comments, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('写入评论数据失败:', error);
            return false;
        }
    }

    // 读取分类数据
    static readCategoriesData() {
        try {
            const data = fs.readFileSync(config.dataPath.categories, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('读取分类数据失败:', error);
            return { categories: [], commonTags: [] };
        }
    }

    // 写入分类数据
    static writeCategoriesData(data) {
        try {
            fs.writeFileSync(config.dataPath.categories, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('写入分类数据失败:', error);
            return false;
        }
    }
}

module.exports = DataHandler;