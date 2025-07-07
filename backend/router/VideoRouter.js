const express = require('express');
const serviceManager = require('../Manager/ServiceManager');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pLimit = require('p-limit');

// 确保临时目录存在
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

module.exports = () => {
    const router = express.Router();
    const generateAIVideoLimit = pLimit(2);
    
    // AI视频生成函数
    const generateAIVideo = async (bgm, subtitle, video_prompt) => {
        try {
            console.log('开始生成AI视频...', { bgm, subtitle, video_prompt });
            const generateAIVideoData = {
                "parameters": {
                    "bgm": bgm,
                    "subtitle": subtitle,
                    "videoprompt": video_prompt
                },
                "workflow_id": "7513593541714673705"
            };
            
            const response = await axios.post('https://api.coze.cn/v1/workflow/run', generateAIVideoData, {
                headers: {
                    'Authorization': 'Bearer pat_a6b6pXlv8V7ypbsArQF3DAxCmsZ7EYvNPwqSQZU7kUfxqhZeGgEzcz0vzm7qO1rA',
                    'Content-Type': 'application/json'
                }
            });
            
            const data = JSON.parse(response.data.data);
            const video_url = data.output;
            console.log('AI视频生成成功，URL:', video_url);
            
            return video_url;
        } catch (error) {
            console.error('AI视频生成失败:', error);
            throw new Error('AI视频生成失败: ' + error.message);
        }
    };
    
    // 下载视频到本地
    const downloadVideo = async (videoUrl) => {
        try {
            console.log('开始下载视频...', videoUrl);
            
            const response = await axios({
                url: videoUrl,
                method: 'GET',
                responseType: 'stream'
            });
            
            const filename = `ai_video_${crypto.randomUUID()}.mp4`;
            const localPath = path.join(tempDir, filename);
            
            const writer = fs.createWriteStream(localPath);
            response.data.pipe(writer);
            
            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    console.log('视频下载完成:', localPath);
                    resolve(localPath);
                });
                writer.on('error', reject);
            });
        } catch (error) {
            console.error('视频下载失败:', error);
            throw new Error('视频下载失败: ' + error.message);
        }
    };
    
    // 清理临时文件
    const cleanupTempFile = (filePath) => {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('临时文件清理完成:', filePath);
            }
        } catch (error) {
            console.error('清理临时文件失败:', error);
        }
    };
    
    router.post('/upload', async (req, res) => {
        let { 
            profileId, 
            title, 
            description, 
            video, 
            comment_content, 
            scheduled, 
            scheduledTime,
            bgm,
            subtitle,
            video_prompt,
            materialId 
        } = req.body;

        res.json({ 
            success: true,
            message: 'AI视频生成和上传任务已添加'
        });

        // ✅ 异步处理视频生成，完全不阻塞响应
        processVideoAsync(req.body).catch(error => {
            console.error('后台视频处理失败:', error);
        });
        
    });

    async function processVideoUrlAsync(requestData) {
        const { 
            profileId, 
            title, 
            description, 
            videoUrl, 
            comment_content, 
            scheduled, 
            scheduledTime,
            materialId 
        } = requestData;
        
        let tempFilePath = null;
        
        try {
            console.log(`[${profileId}] 开始处理视频链接...`, videoUrl);
            
            const service = serviceManager.getService(profileId);
            const taskScheduleService = service.taskScheduleService;
            
            // 下载视频链接
            tempFilePath = await downloadVideoFromUrl(videoUrl);
            console.log(`[${profileId}] 视频链接下载完成，添加到上传队列...`);
            
            // 创建上传任务
            const uploadTask = async () => {
                try {
                    // 如果有素材ID，使用素材文件
                    let uploadFilePath = tempFilePath;
                    if (materialId) {
                        const materialPath = path.join(__dirname, '../materials', materialId);
                        if (fs.existsSync(materialPath)) {
                            uploadFilePath = materialPath;
                            console.log(`[${profileId}] 使用素材文件: ${materialPath}`);
                        }
                    }
                    
                    await service.seleniumService.uploadVideo(title, description, uploadFilePath);
                    console.log(`[${profileId}] 视频上传完成: ${title}`);
                    
                    if (comment_content) {
                        taskScheduleService.addDelayedTask(async () => {
                            await service.seleniumService.commentVideo(title, description, comment_content);
                        }, 60000);
                    }
                    
                    // 清理临时文件（如果不是素材文件）
                    if (uploadFilePath === tempFilePath) {
                        setTimeout(() => {
                            cleanupTempFile(tempFilePath);
                        }, 5000);
                    }
                    
                } catch (error) {
                    console.error(`[${profileId}] 视频上传失败:`, error);
                    if (tempFilePath && tempFilePath !== uploadFilePath) {
                        cleanupTempFile(tempFilePath);
                    }
                    throw error;
                }
            };
            
            // 添加到任务队列
            if (scheduled && scheduledTime) {
                taskScheduleService.addScheduledTask(uploadTask, scheduledTime);
            } else {
                taskScheduleService.addTask(uploadTask);
            }
            
        } catch (error) {
            console.error(`[${profileId}] 后台视频链接处理失败:`, error);
            if (tempFilePath) {
                cleanupTempFile(tempFilePath);
            }
            // 这里可以添加失败通知机制
        }
    }
    
    async function processVideoAsync(requestData) {
        const { 
            profileId, 
            title, 
            description, 
            bgm, 
            subtitle, 
            video_prompt, 
            comment_content, 
            scheduled, 
            scheduledTime,
            materialId 
        } = requestData;
        
        let tempFilePath = null;
        
        try {
            console.log(`[${profileId}] 开始后台AI视频生成...`);
            
            const service = serviceManager.getService(profileId);
            const taskScheduleService = service.taskScheduleService;
            const finalVideoPrompt = video_prompt + ' --rt 9:16 --dur 10 --rs 480p';
            
            // 生成AI视频
            const videoUrl = await generateAIVideo(bgm, subtitle, finalVideoPrompt);
            console.log(`[${profileId}] AI视频生成完成，开始下载...`);
            
            // 下载视频
            tempFilePath = await downloadVideo(videoUrl);
            console.log(`[${profileId}] 视频下载完成，添加到上传队列...`);
            
            // 创建上传任务
            const uploadTask = async () => {
                try {
                    // 如果有素材ID，使用素材文件
                    let uploadFilePath = tempFilePath;
                    if (materialId) {
                        const materialPath = path.join(__dirname, '../materials', materialId);
                        if (fs.existsSync(materialPath)) {
                            uploadFilePath = materialPath;
                            console.log(`[${profileId}] 使用素材文件: ${materialPath}`);
                        }
                    }
                    
                    await service.seleniumService.uploadVideo(title, description, uploadFilePath);
                    console.log(`[${profileId}] 视频上传完成: ${title}`);
                    
                    if (comment_content) {
                        taskScheduleService.addDelayedTask(async () => {
                            await service.seleniumService.commentVideo(title, description, comment_content);
                        }, 60000);
                    }
                    
                    // 清理临时文件（如果不是素材文件）
                    if (uploadFilePath === tempFilePath) {
                        setTimeout(() => {
                            cleanupTempFile(tempFilePath);
                        }, 5000);
                    }
                    
                } catch (error) {
                    console.error(`[${profileId}] 视频上传失败:`, error);
                    if (tempFilePath && tempFilePath !== uploadFilePath) {
                        cleanupTempFile(tempFilePath);
                    }
                    throw error;
                }
            };
            
            // 添加到任务队列
            if (scheduled && scheduledTime) {
                taskScheduleService.addScheduledTask(uploadTask, scheduledTime);
            } else {
                taskScheduleService.addTask(uploadTask);
            }
            
        } catch (error) {
            console.error(`[${profileId}] 后台视频处理失败:`, error);
            if (tempFilePath) {
                cleanupTempFile(tempFilePath);
            }
            // 这里可以添加失败通知机制
        }
    }
    
    router.post('/delete', async (req, res) => {
        const { profileId, title } = req.body;
        const service = serviceManager.getService(profileId);
        const taskScheduleService = service.taskScheduleService;
        taskScheduleService.addDelayedTask(async () => {
            await service.seleniumService.deleteVideo(title, service.taskScheduleService);
        }, 5000);
        res.json({ message: 'Video delete successfully' });
    });
    
    // 获取回复信息
    router.get('/getReply', async (req, res) => {
        try {
            const { profileId } = req.query;
            if (!profileId) {
                return res.status(400).json({ error: 'profileId is required' });
            }
            
            const service = serviceManager.getService(profileId);
            const replyMessage = service.seleniumService.getReplyMessage();
            
            res.json({ 
                success: true,
                message: replyMessage 
            });
        } catch (error) {
            console.error('获取回复信息失败:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // 更新回复信息
    router.post('/updateReply', async (req, res) => {
        try {
            const { profileId, message } = req.body;
            if (!profileId) {
                return res.status(400).json({ error: 'profileId is required' });
            }
            if (!message) {
                return res.status(400).json({ error: 'message is required' });
            }
            
            const service = serviceManager.getService(profileId);
            service.seleniumService.setReplyMessage(message);
            
            res.json({ 
                success: true,
                message: '回复信息更新成功' 
            });
        } catch (error) {
            console.error('更新回复信息失败:', error);
            res.status(500).json({ error: error.message });
        }
    });
    
    // 新增：处理视频链接上传
    router.post('/uploadUrl', async (req, res) => {
        let { 
            profileId, 
            title, 
            description, 
            videoUrl, 
            comment_content, 
            scheduled, 
            scheduledTime,
            materialId 
        } = req.body;

        res.json({ 
            success: true,
            message: '视频链接上传任务已添加'
        });

        // ✅ 异步处理视频链接下载和上传，完全不阻塞响应
        processVideoUrlAsync(req.body).catch(error => {
            console.error('后台视频链接处理失败:', error);
        });
        
    });
    
    // 新增：处理素材库视频上传
    router.post('/upload-material', async (req, res) => {
        let { 
            profileId, 
            title, 
            description, 
            materialId, 
            comment_content, 
            scheduled, 
            scheduledTime
        } = req.body;

        res.json({ 
            success: true,
            message: '素材库视频上传任务已添加'
        });

        // ✅ 异步处理素材库视频上传，完全不阻塞响应
        processMaterialVideoAsync(req.body).catch(error => {
            console.error('后台素材库视频处理失败:', error);
        });
        
    });

    async function processMaterialVideoAsync(requestData) {
        const { 
            profileId, 
            title, 
            description, 
            materialId, 
            comment_content, 
            scheduled, 
            scheduledTime
        } = requestData;
        
        try {
            console.log(`[${profileId}] 开始处理素材库视频...`, { materialId, title });
            
            const service = serviceManager.getService(profileId);
            const taskScheduleService = service.taskScheduleService;
            
            // 验证素材是否存在
            const materialPath = path.join(__dirname, '../materials', materialId);
            if (!fs.existsSync(materialPath)) {
                throw new Error(`素材文件不存在: ${materialId}`);
            }
            
            console.log(`[${profileId}] 素材文件验证通过，添加到上传队列...`);
            
            // 创建上传任务
            const uploadTask = async () => {
                try {
                    await service.seleniumService.uploadVideo(title, description, materialPath);
                    console.log(`[${profileId}] 素材库视频上传完成: ${title}`);
                    
                    if (comment_content) {
                        taskScheduleService.addDelayedTask(async () => {
                            await service.seleniumService.commentVideo(title, description, comment_content);
                        }, 60000);
                    }
                    
                } catch (error) {
                    console.error(`[${profileId}] 素材库视频上传失败:`, error);
                    throw error;
                }
            };
            
            // 添加到任务队列
            if (scheduled && scheduledTime) {
                taskScheduleService.addScheduledTask(uploadTask, scheduledTime);
            } else {
                taskScheduleService.addTask(uploadTask);
            }
            
        } catch (error) {
            console.error(`[${profileId}] 后台素材库视频处理失败:`, error);
            // 这里可以添加失败通知机制
        }
    }
    
    return router;
}