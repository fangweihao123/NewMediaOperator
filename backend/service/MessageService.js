const axios = require('axios');
const SendMessageRequestBody = require('../Proto/Request/SendMessageRequestBody_pb');
const RequestBody = require('../Proto/Request/RequestBody_pb');
const Request = require('../Proto/Request/Request_pb');
const Response = require('../Proto/Response/Response_pb');

class MessageService {
    constructor(authHeaders = {}, seleniumService = null) {
        this.apiUrl = 'https://imapi.douyin.com/v1/message/send';
        this.authHeaders = authHeaders; // 可以传入认证头信息
        this.seleniumService = seleniumService; // selenium服务实例
    }

    /**
     * 发送消息到抖音API
     * @param {string} messageContent - 要发送的消息内容
     * @param {string} conversationId - 对话ID (这里作为用户名称匹配)
     * @param {Object} options - 可选参数
     * @returns {Promise<Object>} - 返回响应结果
     */
    async sendMessage(messageContent, conversationId, options = {}) {
        try {
            console.log(`MessageService发送消息: ${messageContent} 给 ${conversationId}`);
            
            // 如果有seleniumService，使用selenium方式发送
            if (this.seleniumService) {
                console.log('使用Selenium方式发送消息');
                return await this.seleniumService.sendDirectMessage(conversationId, messageContent);
            }
            
            // 否则使用原来的protobuf API方式（保留作为备用）
            console.log('使用API方式发送消息');
            return await this.sendMessageViaAPI(messageContent, conversationId, options);
            
        } catch (error) {
            console.error('发送消息失败:', error);
            return {
                success: false,
                error: error.message,
                messageContent: messageContent,
                conversationId: conversationId,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 通过API发送消息（protobuf方式）
     * @param {string} messageContent - 消息内容
     * @param {string} conversationId - 对话ID
     * @param {Object} options - 可选参数
     * @returns {Promise<Object>} - 返回响应结果
     */
    async sendMessageViaAPI(messageContent, conversationId, options = {}) {
        try {
            // 创建SendMessageRequestBody
            const sendMessageBody = new SendMessageRequestBody();
            sendMessageBody.setText(messageContent);
            sendMessageBody.setConversationId(conversationId);
            sendMessageBody.setClientMessageId(this.generateClientMessageId());
            sendMessageBody.setMessageType(options.messageType || 1); // 默认文本消息
            sendMessageBody.setConversationType(options.conversationType || 1); // 默认私聊

            // 如果有提及用户
            if (options.mentionedUsers && Array.isArray(options.mentionedUsers)) {
                sendMessageBody.setMentionedUsersList(options.mentionedUsers);
            }

            // 包装到RequestBody
            const requestBody = new RequestBody();
            requestBody.setSendMessage(sendMessageBody);

            // 包装到Request
            const request = new Request();
            request.setCmd(100); // 发送消息命令
            request.setSequenceId(Date.now());
            request.setSdkVersion('1.0.0');
            request.setDevice('web');
            request.setOs('web');
            request.setTimestamp(Date.now());
            request.setRequestBody(requestBody);

            // 序列化请求
            const serializedData = request.serializeBinary();

            // 发送请求
            const response = await axios.post(this.apiUrl, serializedData, {
                headers: {
                    'Content-Type': 'application/x-protobuf',
                    ...this.authHeaders
                },
                responseType: 'arraybuffer'
            });

            // 解析响应
            const responseData = new Uint8Array(response.data);
            const responseProto = Response.Response.deserializeBinary(responseData);

            // 检查响应状态
            if (responseProto.getStatusCode() === 0) {
                const sendMessageResponse = responseProto.getResponseBody().getSendMessage();
                return {
                    success: true,
                    message: '消息发送成功',
                    messageId: sendMessageResponse ? sendMessageResponse.getMessageId() : null,
                    timestamp: new Date().toISOString()
                };
            } else {
                throw new Error(`API返回错误: ${responseProto.getMessage()}`);
            }

        } catch (error) {
            console.error('API发送消息失败:', error);
            throw error;
        }
    }

    /**
     * 设置selenium服务实例
     * @param {Object} seleniumService - selenium服务实例
     */
    setSeleniumService(seleniumService) {
        this.seleniumService = seleniumService;
    }

    /**
     * 批量发送消息
     * @param {Array} messages - 消息数组，每个元素包含 {content, conversationId, options}
     * @returns {Promise<Array>} - 返回发送结果数组
     */
    async sendMultipleMessages(messages) {
        const results = [];
        
        for (const msg of messages) {
            try {
                const result = await this.sendMessage(
                    msg.content, 
                    msg.conversationId, 
                    msg.options || {}
                );
                results.push({
                    ...result,
                    originalMessage: msg
                });
                
                // 添加延迟避免频率限制
                await this.delay(1000); // 1秒延迟
            } catch (error) {
                results.push({
                    success: false,
                    error: error.message,
                    originalMessage: msg
                });
            }
        }
        
        return results;
    }

    /**
     * 生成客户端消息ID
     * @returns {string} - 唯一的客户端消息ID
     */
    generateClientMessageId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `${timestamp}_${random}`;
    }

    /**
     * 延迟函数
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise} - Promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 设置认证头信息
     * @param {Object} headers - 认证头信息
     */
    setAuthHeaders(headers) {
        this.authHeaders = { ...this.authHeaders, ...headers };
    }

    /**
     * 发送文本消息的便捷方法
     * @param {string} text - 文本内容
     * @param {string} conversationId - 对话ID
     * @returns {Promise<Object>} - 返回响应结果
     */
    async sendTextMessage(text, conversationId) {
        return this.sendMessage(text, conversationId, {
            messageType: 1, // 文本消息类型
            conversationType: 1 // 私聊类型
        });
    }

    /**
     * 发送带提及用户的消息
     * @param {string} text - 文本内容
     * @param {string} conversationId - 对话ID
     * @param {Array<number>} mentionedUsers - 提及的用户ID列表
     * @returns {Promise<Object>} - 返回响应结果
     */
    async sendMentionMessage(text, conversationId, mentionedUsers) {
        return this.sendMessage(text, conversationId, {
            messageType: 1,
            conversationType: 1,
            mentionedUsers: mentionedUsers
        });
    }
}

module.exports = MessageService; 