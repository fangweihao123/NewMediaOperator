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
            video_prompt 
        } = req.body;
        
        console.log('收到上传请求:', { profileId, title });
        
        const service = serviceManager.getService(profileId);
        const taskScheduleService = service.taskScheduleService;
        video_prompt += ' --rt 9:16 --dur 10 --rs 480p'
        let videoPath = video;
        let tempFilePath = null;
        
        // 创建AI视频生成和上传的Promise
        const processVideo = new Promise(async (resolve, reject) => {
            try {
                console.log('开始AI视频生成流程...');
                const videoUrl = await generateAIVideo(bgm, subtitle, video_prompt);
                tempFilePath = await downloadVideo(videoUrl);
                videoPath = tempFilePath;
                console.log('AI视频处理完成，本地路径:', videoPath);
                resolve();
            } catch (error) {
                console.error('AI视频生成失败:', error);
                reject(new Error('AI视频生成失败: ' + error.message));
            }
        });


        processVideo.then(() => {
            console.log('AI视频处理完成，本地路径:', videoPath);
        });
        
        // 上传任务函数
        const uploadTask = async () => {
            try {
                await service.seleniumService.uploadVideo(title, description, videoPath);
                
                if (comment_content) {
                    taskScheduleService.addDelayedTask(async () => {
                        await service.seleniumService.commentVideo(title, description, comment_content);
                    }, 60000);
                }
                
                // 如果是AI生成的视频，上传完成后清理临时文件
                if (tempFilePath) {
                    // 延迟清理，确保上传完成
                    setTimeout(() => {
                        cleanupTempFile(tempFilePath);
                    }, 5000);
                }
            } catch (error) {
                console.error('视频上传失败:', error);
                // 上传失败时也要清理临时文件
                if (tempFilePath) {
                    cleanupTempFile(tempFilePath);
                }
                throw error;
            }
        };
        
        // 处理视频生成和任务调度
        processVideo.then(() => {
            if (scheduled) {
                taskScheduleService.addScheduledTask(uploadTask, scheduledTime);
            } else {
                taskScheduleService.addTask(uploadTask);
            }
        }).catch((error) => {
            console.error('视频处理失败:', error);
            return res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        });
        res.json({ 
            success: true,
            message: 'AI视频生成和上传任务已添加'
        });
    });
    
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
    
    return router;
}