const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const https = require('https');
const serviceManager = require('../Manager/ServiceManager');

// 创建忽略SSL证书验证的axios配置
const createAxiosConfig = (url) => ({
    url: url,
    method: 'GET',
    responseType: 'stream',
    timeout: 300000, // 5分钟超时
    maxContentLength: 500 * 1024 * 1024, // 500MB限制
    httpsAgent: new https.Agent({
        rejectUnauthorized: false // 忽略SSL证书验证
    })
});

// 确保素材目录存在
const materialDir = path.join(__dirname, '../materials');
if (!fs.existsSync(materialDir)) {
    fs.mkdirSync(materialDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, materialDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = crypto.randomUUID();
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB限制
    },
    fileFilter: function (req, file, cb) {
        // 只允许视频和图片文件
        const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|wmv|flv|webm/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只支持视频和图片文件格式'));
        }
    }
});

module.exports = () => {
    const router = express.Router();

    // 获取素材列表
    router.get('/', async (req, res) => {
        try {
            // 使用统一的素材目录，所有账号公用
            const materialsPath = materialDir;
            
            if (!fs.existsSync(materialsPath)) {
                return res.json({ materials: [] });
            }

            const files = fs.readdirSync(materialsPath);
            const materials = [];

            for (const file of files) {
                // 跳过.json文件，只处理实际素材文件
                if (file.endsWith('.json')) {
                    continue;
                }

                const filePath = path.join(materialsPath, file);
                const stats = fs.statSync(filePath);
                
                // 读取素材信息文件
                const infoPath = filePath + '.json';
                let materialInfo = {
                    id: file,
                    name: file,
                    description: '',
                    type: 'video',
                    size: stats.size,
                    url: `/materials/${file}`,
                    createdAt: stats.birthtime
                };

                if (fs.existsSync(infoPath)) {
                    try {
                        const infoContent = fs.readFileSync(infoPath, 'utf8');
                        const savedInfo = JSON.parse(infoContent);
                        materialInfo = { ...materialInfo, ...savedInfo };
                    } catch (error) {
                        console.error('读取素材信息失败:', error);
                    }
                }

                materials.push(materialInfo);
            }

            // 按创建时间倒序排列
            materials.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            res.json({ materials });
        } catch (error) {
            console.error('获取素材列表失败:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 上传本地素材
    router.post('/upload', upload.single('file'), async (req, res) => {
        try {
            const { name, description } = req.body;
            
            if (!req.file) {
                return res.status(400).json({ error: '请选择文件' });
            }

            // 使用统一的素材目录
            const newFilePath = path.join(materialDir, req.file.filename);
            fs.renameSync(req.file.path, newFilePath);

            // 确定文件类型
            const ext = path.extname(req.file.originalname).toLowerCase();
            const isVideo = /\.(mp4|avi|mov|wmv|flv|webm)$/.test(ext);
            const isImage = /\.(jpeg|jpg|png|gif)$/.test(ext);
            
            const materialType = isVideo ? 'video' : isImage ? 'image' : 'document';

            // 保存素材信息
            const materialInfo = {
                id: req.file.filename,
                name: name || req.file.originalname,
                description: description || '',
                type: materialType,
                size: req.file.size,
                url: `/materials/${req.file.filename}`,
                createdAt: new Date().toISOString()
            };

            const infoPath = newFilePath + '.json';
            fs.writeFileSync(infoPath, JSON.stringify(materialInfo, null, 2));

            res.json({ 
                success: true, 
                message: '素材上传成功',
                material: materialInfo
            });
        } catch (error) {
            console.error('上传素材失败:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 上传链接素材
    router.post('/uploadUrl', async (req, res) => {
        try {
            const { url, name, description } = req.body;

            if (!url) {
                return res.status(400).json({ error: '请提供素材链接' });
            }

            // 下载文件
            const response = await axios(createAxiosConfig(url));

            const filename = crypto.randomUUID() + path.extname(url) || '.mp4';
            const filePath = path.join(materialDir, filename);
            
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // 获取文件信息
            const stats = fs.statSync(filePath);
            
            // 确定文件类型
            const ext = path.extname(url).toLowerCase();
            const isVideo = /\.(mp4|avi|mov|wmv|flv|webm)$/.test(ext);
            const isImage = /\.(jpeg|jpg|png|gif)$/.test(ext);
            
            const materialType = isVideo ? 'video' : isImage ? 'image' : 'document';

            // 保存素材信息
            const materialInfo = {
                id: filename,
                name: name || path.basename(url),
                description: description || '',
                type: materialType,
                size: stats.size,
                url: `/materials/${filename}`,
                createdAt: new Date().toISOString()
            };

            const infoPath = filePath + '.json';
            fs.writeFileSync(infoPath, JSON.stringify(materialInfo, null, 2));

            res.json({ 
                success: true, 
                message: '素材上传成功',
                material: materialInfo
            });
        } catch (error) {
            console.error('上传链接素材失败:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 批量上传链接素材
    router.post('/uploadUrls', async (req, res) => {
        try {
            const { urls, namePrefix, description } = req.body;

            if (!urls || !Array.isArray(urls) || urls.length === 0) {
                return res.status(400).json({ error: '请提供素材链接数组' });
            }

            const results = [];
            const errors = [];

            // 并发处理所有链接
            const uploadPromises = urls.map(async (url, index) => {
                try {
                    // 下载文件
                    const response = await axios(createAxiosConfig(url));

                    const filename = crypto.randomUUID() + path.extname(url) || '.mp4';
                    const filePath = path.join(materialDir, filename);
                    
                    const writer = fs.createWriteStream(filePath);
                    response.data.pipe(writer);

                    await new Promise((resolve, reject) => {
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });

                    // 获取文件信息
                    const stats = fs.statSync(filePath);
                    
                    // 确定文件类型
                    const ext = path.extname(url).toLowerCase();
                    const isVideo = /\.(mp4|avi|mov|wmv|flv|webm)$/.test(ext);
                    const isImage = /\.(jpeg|jpg|png|gif)$/.test(ext);
                    
                    const materialType = isVideo ? 'video' : isImage ? 'image' : 'document';

                    // 生成素材名称
                    const materialName = namePrefix ? 
                        `${namePrefix}${urls.length > 1 ? ` (${index + 1})` : ''}` : 
                        path.basename(url);

                    // 保存素材信息
                    const materialInfo = {
                        id: filename,
                        name: materialName,
                        description: description || '',
                        type: materialType,
                        size: stats.size,
                        url: `/materials/${filename}`,
                        createdAt: new Date().toISOString()
                    };

                    const infoPath = filePath + '.json';
                    fs.writeFileSync(infoPath, JSON.stringify(materialInfo, null, 2));

                    results.push(materialInfo);
                } catch (error) {
                    console.error(`上传素材链接失败 [${url}]:`, error);
                    errors.push({
                        url: url,
                        error: error.message
                    });
                }
            });

            await Promise.all(uploadPromises);

            res.json({ 
                success: true, 
                message: `成功上传 ${results.length} 个素材${errors.length > 0 ? `，${errors.length} 个失败` : ''}`,
                materials: results,
                errors: errors
            });
        } catch (error) {
            console.error('批量上传链接素材失败:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 删除素材
    router.delete('/:materialId', async (req, res) => {
        try {
            const { materialId } = req.params;

            const filePath = path.join(materialDir, materialId);
            const infoPath = filePath + '.json';

            // 删除文件和信息文件
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            if (fs.existsSync(infoPath)) {
                fs.unlinkSync(infoPath);
            }

            res.json({ success: true, message: '素材删除成功' });
        } catch (error) {
            console.error('删除素材失败:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 提供素材文件访问
    router.get('/:filename', (req, res) => {
        try {
            const { filename } = req.params;
            const filePath = path.join(materialDir, filename);
            
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: '文件不存在' });
            }

            res.sendFile(filePath);
        } catch (error) {
            console.error('访问素材文件失败:', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}; 