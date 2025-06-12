const express = require('express');
const ConversationAnalysisService = require('../service/ConversationAnalysisService');
const serviceManager = require('../Manager/ServiceManager');


module.exports = () => {
    const router = express.Router();
    
    router.get('/conversation-analysis/results', async (req, res) => {
        try {
            const profile_id = req.query.profile_id;
            if (!profile_id) {
                return res.status(400).json({ error: 'profile_id is required' });
            }
            
            const results = await ConversationAnalysisService.getAnalysisResults(profile_id);
            res.json({ status: 'success', results });
        } catch (error) {
            console.error('获取分析结果失败:', error);
            res.status(500).json({ error: error.message });
        }
    });
    
    // 发送文本消息的便捷接口
    router.post('/send-text', async (req, res) => {
        try {
            const { text, conversationId, profileId, guest_nickname, guest } = req.body;
            
            if (!text) {
                return res.status(400).json({ error: '文本内容不能为空' });
            }
            
            if (!guest_nickname) {
                return res.status(400).json({ error: '回复对象名称不能为空' });
            }
            const service = serviceManager.getService(profileId);
            const taskScheduleService = service.taskScheduleService;
            taskScheduleService.addTask(async () => {
                await service.seleniumService.sendDirectMessage(guest_nickname, text);
            });
            res.json({ status: 'success'});
        } catch (error) {
            console.error('发送文本消息失败:', error);
            res.status(500).json({ error: error.message });
        }
    });
    
    return router;
}


