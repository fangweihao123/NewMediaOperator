const dbManager = require('../Manager/DataBaseManager');
const axios = require('axios');
const { Op } = require('sequelize');

class ConversationAnalysisService {
    constructor() {
        this.isRunning = false;
        this.checkInterval = null;
        this.arkApiKey = process.env.ARK_API_KEY || '55c9eede-6fda-4c34-827c-e33152a22b94';
        this.apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
        this.intervalMs = 30000; // 30秒检查一次
        this.processedConversations = new Set(); // 记录已处理的对话ID
    }

    // 启动持续检测服务
    async start() {
        if (this.isRunning) {
            console.log('ConversationAnalysisService is already running');
            return;
        }

        this.isRunning = true;
        console.log('ConversationAnalysisService started');

        // 立即执行一次检测
        await this.checkAllConversations();

        // 设置定时检测
        this.checkInterval = setInterval(async () => {
            try {
                await this.checkAllConversations();
            } catch (error) {
                console.error('Error in conversation analysis interval:', error);
            }
        }, this.intervalMs);
    }

    // 停止检测服务
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.isRunning = false;
        console.log('ConversationAnalysisService stopped');
    }

    // 检查所有对话信息
    async checkAllConversations() {
        try {
            // 获取所有连接ID（profile_id）
            const connectionIds = Array.from(dbManager.connections.keys());
            
            for (const profileId of connectionIds) {
                await this.checkConversationsForProfile(profileId);
            }
        } catch (error) {
            console.error('Error checking all conversations:', error);
        }
    }

    // 检查特定profile的对话信息
    async checkConversationsForProfile(profileId) {
        try {
            const models = await dbManager.getModels(profileId);
            
            // 获取所有对话信息
            const conversations = await models.ConversationInfo.findAll();
            
            for (const conversationRecord of conversations) {
                const conversationKey = `${profileId}_${conversationRecord.conversation_id}`;
                
                // 跳过已处理的对话
                if (this.processedConversations.has(conversationKey)) {
                    continue;
                }

                // 检查是否有对话内容
                if (!conversationRecord.conversation || conversationRecord.conversation.trim() === '') {
                    continue;
                }

                // 分析对话内容
                const analysisResult = await this.analyzeConversation(conversationRecord.conversation);
                
                if (analysisResult.status === 200) {
                    console.log(`Found contact info in conversation ${conversationKey}:`, analysisResult.data);
                    
                    // 这里可以添加保存分析结果的逻辑
                    await this.saveAnalysisResult(profileId, conversationRecord.conversation_id, analysisResult.data);
                }

                // 标记为已处理
                this.processedConversations.add(conversationKey);
            }
        } catch (error) {
            console.error(`Error checking conversations for profile ${profileId}:`, error);
        }
    }

    // 调用豆包API分析对话内容
    async analyzeConversation(conversationText) {
        try {
            const systemPrompt = `你是一个专业的对话分析助手。请分析用户提供的对话内容，提取其中的称呼和联系方式信息。

请按照以下格式返回结果：
- 如果找到称呼或联系方式信息，返回JSON格式：{"nicknames": ["称呼1", "称呼2"], "contacts": ["联系方式1", "联系方式2"]}
- 如果没有找到任何称呼或联系方式信息，返回：NO_INFO

联系方式包括但不限于：手机号、微信号、QQ号、邮箱地址、社交媒体账号等。
称呼包括但不限于：昵称、姓名、网名等个人标识。`;

            const response = await axios.post(this.apiUrl, {
                model: "doubao-pro-32k-241215",
                messages: [
                    {"role": "system", "content": systemPrompt},
                    {"role": "user", "content": `请分析以下对话内容：\n${conversationText}`}
                ]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.arkApiKey}`
                },
                timeout: 30000 // 30秒超时
            });

            const aiResponse = response.data.choices[0].message.content.trim();

            // 解析AI响应
            if (aiResponse === 'NO_INFO') {
                return { status: 404, message: '未找到称呼或联系方式信息' };
            }

            try {
                const parsedData = JSON.parse(aiResponse);
                
                // 验证是否真的找到了信息
                const hasNicknames = parsedData.nicknames && parsedData.nicknames.length > 0;
                const hasContacts = parsedData.contacts && parsedData.contacts.length > 0;
                
                if (hasNicknames && hasContacts) {
                    return { 
                        status: 200, 
                        data: parsedData,
                        message: '成功提取称呼或联系方式信息'
                    };
                } else {
                    return { status: 404, message: '未找到有效的称呼或联系方式信息' };
                }
            } catch (parseError) {
                console.error('Failed to parse AI response as JSON:', parseError);
                return { status: 404, message: 'AI响应格式错误' };
            }

        } catch (error) {
            console.error('Error calling Doubao API:', error);
            
            if (error.response) {
                return { 
                    status: error.response.status, 
                    message: `API调用失败: ${error.response.data?.error?.message || error.message}` 
                };
            }
            
            return { status: 500, message: `服务错误: ${error.message}` };
        }
    }

    // 保存分析结果（可扩展为保存到数据库）
    async saveAnalysisResult(profileId, conversationId, analysisData) {
        try {
            const models = await dbManager.getModels(profileId);
            
            // 检查是否存在AnalysisResult表，如果不存在则创建
            if (!models.AnalysisResult) {
                await models.AnalysisResult.sync();
            }

            // 检查是否已存在相同conversation_id的记录
            const existingResult = await models.AnalysisResult.findOne({
                where: {
                    conversation_id: conversationId
                }
            });

            if (existingResult) {
                // 如果存在则更新
                await existingResult.update({
                    nicknames: JSON.stringify(analysisData.nicknames || []),
                    contacts: JSON.stringify(analysisData.contacts || []),
                    analyzed_at: new Date()
                });
            } else {
                // 如果不存在则创建新记录
                await models.AnalysisResult.create({
                    conversation_id: conversationId,
                    nicknames: JSON.stringify(analysisData.nicknames || []),
                    contacts: JSON.stringify(analysisData.contacts || []),
                    analyzed_at: new Date()
                });
            }

            console.log(`Analysis result saved for conversation ${conversationId}`);
        } catch (error) {
            console.error('Error saving analysis result:', error);
        }
    }

    // 获取分析结果
    async getAnalysisResults(profileId) {
        try {
            const models = await dbManager.getModels(profileId);
            
            if (!models.AnalysisResult) {
                return [];
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const results = await models.AnalysisResult.findAll(
                {
                    where: {
                        analyzed_at: {
                            [Op.between]:[today, tomorrow]
                        }
                    },
                    order: [['analyzed_at', 'DESC']]
                }
            );

            return results.map(result => ({
                id: result.id,
                conversation_id: result.conversation_id,
                nicknames: JSON.parse(result.nicknames || '[]'),
                contacts: JSON.parse(result.contacts || '[]'),
                analyzed_at: result.analyzed_at
            }));
        } catch (error) {
            console.error('Error getting analysis results:', error);
            return [];
        }
    }

    // 清除已处理记录（用于重新分析）
    clearProcessedRecords() {
        this.processedConversations.clear();
        console.log('Cleared processed conversation records');
    }

    // 设置检查间隔
    setCheckInterval(intervalMs) {
        this.intervalMs = intervalMs;
        
        // 如果服务正在运行，重新启动以应用新的间隔
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }
}

// 创建单例实例
const conversationAnalysisService = new ConversationAnalysisService();
module.exports = conversationAnalysisService; 