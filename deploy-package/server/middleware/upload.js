const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// 确保上传目录存在
if (!fs.existsSync(config.upload.uploadDir)) {
    fs.mkdirSync(config.upload.uploadDir, { recursive: true });
}

// 图片上传配置
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.upload.uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const prefix = req.route && req.route.path.includes('avatar') ? 'avatar-' : 'cover-';
        cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
    }
});

const imageUpload = multer({
    storage: imageStorage,
    limits: {
        fileSize: config.upload.maxFileSize
    },
    fileFilter: (req, file, cb) => {
        if (config.upload.allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('不支持的文件类型'));
        }
    }
});

// TXT文件上传配置
const txtUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: config.upload.maxTxtFileSize,
        files: config.upload.maxFiles
    },
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.txt'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (config.upload.allowedTxtTypes.includes(file.mimetype) || 
            allowedExtensions.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error('只支持TXT格式的文件'));
        }
    }
});

module.exports = {
    imageUpload,
    txtUpload
};