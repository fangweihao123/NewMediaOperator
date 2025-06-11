const express = require('express');
const router = express.Router();
const ConversationAnalysisService = require('../service/ConversationAnalysisService');
const MessageService = require('../service/MessageService');

// 创建MessageService实例
const messageService = new MessageService();

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

// 批量发送消息接口
router.post('/send-batch', async (req, res) => {
    try {
        const { messages, authHeaders } = req.body;
        
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: '消息数组不能为空' });
        }

        // 验证消息格式
        for (const msg of messages) {
            if (!msg.content || !msg.conversationId) {
                return res.status(400).json({ 
                    error: '每条消息必须包含 content 和 conversationId' 
                });
            }
        }

        if (authHeaders) {
            messageService.setAuthHeaders(authHeaders);
        }

        const results = await messageService.sendMultipleMessages(messages);
        
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;
        
        res.json({
            status: 'completed',
            message: `批量发送完成: ${successCount} 成功, ${failureCount} 失败`,
            data: {
                total: results.length,
                success: successCount,
                failure: failureCount,
                results: results,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('批量发送消息失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// 发送带提及用户的消息接口
router.post('/send-mention', async (req, res) => {
    try {
        const { text, conversationId, mentionedUsers, authHeaders } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: '文本内容不能为空' });
        }
        
        if (!conversationId) {
            return res.status(400).json({ error: '对话ID不能为空' });
        }

        if (!mentionedUsers || !Array.isArray(mentionedUsers)) {
            return res.status(400).json({ error: '提及用户列表必须是数组' });
        }

        if (authHeaders) {
            messageService.setAuthHeaders(authHeaders);
        }

        const result = await messageService.sendMentionMessage(text, conversationId, mentionedUsers);
        
        if (result.success) {
            res.json({
                status: 'success',
                message: '提及消息发送成功',
                data: {
                    conversationId,
                    text,
                    mentionedUsers,
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
        console.error('发送提及消息失败:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;