const path = require('path');

// 错误处理中间件
function errorHandler(error, req, res, next) {
    console.error('服务器错误:', error);
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    });
}

// 404处理中间件
function notFoundHandler(req, res) {
    if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json({
            success: false,
            message: 'API接口不存在'
        });
    } else {
        res.status(404).sendFile(path.join(__dirname, '../../public', '404.html'));
    }
}

module.exports = {
    errorHandler,
    notFoundHandler
};