const express = require('express');
const router = express.Router();
const ConversationAnalysisService = require('../service/ConversationAnalysisService');

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

// 发送单条消息接口
router.post('/send', async (req, res) => {
    try {
        const { messageContent, conversationId, options, authHeaders } = req.body;
        
        if (!messageContent) {
            return res.status(400).json({ error: '消息内容不能为空' });
        }
        
        if (!conversationId) {
            return res.status(400).json({ error: '对话ID不能为空' });
        }

        // 如果传入了认证头信息，设置到服务中
        if (authHeaders) {
            messageService.setAuthHeaders(authHeaders);
        }

        const result = await messageService.sendMessage(messageContent, conversationId, options);
        
        if (result.success) {
            res.json({
                status: 'success',
                message: '消息发送成功',
                data: {
                    conversationId,
                    messageContent,
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: result.message,
                error: result.error
            });
        }
    } catch (error) {
        console.error('发送消息失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// 发送文本消息的便捷接口
router.post('/send-text', async (req, res) => {
    try {
        const { text, conversationId, authHeaders } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: '文本内容不能为空' });
        }
        
        if (!conversationId) {
            return res.status(400).json({ error: '对话ID不能为空' });
        }

        if (authHeaders) {
            messageService.setAuthHeaders(authHeaders);
        }

        const result = await messageService.sendTextMessage(text, conversationId);
        
        if (result.success) {
            res.json({
                status: 'success',
                message: '文本消息发送成功',
                data: {
                    conversationId,
                    text,
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: result.message,
                error: result.error
            });
        }
    } catch (error) {
        console.error('发送文本消息失败:', error);
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;