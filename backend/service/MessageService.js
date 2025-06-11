const axios = require('axios');
const SendMessageRequestBody = require('../Proto/Request/SendMessageRequestBody_pb');
const RequestBody = require('../Proto/Request/RequestBody_pb');
const Request = require('../Proto/Request/Request_pb');
const Response = require('../Proto/Response/Response_pb');

class MessageService {
    constructor(authHeaders = {}) {
        this.apiUrl = 'https://imapi.douyin.com/v1/message/send';
        this.authHeaders = authHeaders; // 可以传入认证头信息
    }

    /**
     * 发送消息到抖音API
     * @param {string} messageContent - 要发送的消息内容
     * @param {string} conversationId - 对话ID
     * @param {Object} options - 可选参数
     * @returns {Promise<Object>} - 返回响应结果
     */
    async sendMessage(messageContent, conversationId, options = {}) {
        try {
            // 创建 SendMessageRequestBody
            const sendMessageRequest = new SendMessageRequestBody.SendMessageRequestBody();
            
            // 设置必要的字段
            sendMessageRequest.setConversationId(conversationId);
            sendMessageRequest.setContent(messageContent);
            
            // 设置可选字段，使用默认值或传入的值
            sendMessageRequest.setConversationType(options.conversationType || 1); // 默认为1
            sendMessageRequest.setConversationShortId(options.conversationShortId || 0);
            sendMessageRequest.setMessageType(options.messageType || 1); // 默认为文本消息
            sendMessageRequest.setTicket(options.ticket || '');
            sendMessageRequest.setClientMessageId(
                options.clientMessageId || this.generateClientMessageId()
            );
            sendMessageRequest.setIgnoreBadgeCount(options.ignoreBadgeCount || false);
            
            // 设置扩展字段
            if (options.ext) {
                const extMap = sendMessageRequest.getExtMap();
                Object.keys(options.ext).forEach(key => {
                    extMap.set(key, options.ext[key]);
                });
            }
            
            // 设置提及用户列表
            if (options.mentionedUsers && Array.isArray(options.mentionedUsers)) {
                sendMessageRequest.setMentionedUsersList(options.mentionedUsers);
            }

            // 创建 RequestBody 并设置 SendMessageRequestBody
            const requestBody = new RequestBody.RequestBody();
            requestBody.setSendmessagerequestbody(sendMessageRequest);

            // 创建 Request 对象
            const request = new Request.Request();
            request.setCmd(100); // 发送消息的命令号
            request.setSequenceId(Date.now()); // 使用时间戳作为序列号
            request.setSdkVersion('1.0.0');
            request.setInboxType(1);
            request.setBuildNumber('1.0.0');
            request.setBody(requestBody);
            request.setDeviceId(options.deviceId || 'web_device');
            request.setChannel(options.channel || 'web');
            request.setDevicePlatform(options.devicePlatform || 'web');
            request.setDeviceType(options.deviceType || 'web');
            request.setOsVersion(options.osVersion || '1.0');
            request.setVersionCode(options.versionCode || '1.0.0');
            request.setTimestamp(Date.now());

            // 序列化为二进制数据
            const binaryData = request.serializeBinary();

            console.log('发送消息请求:', {
                conversationId,
                messageContent,
                options,
                binaryDataLength: binaryData.length,
                cmd: 100,
                sequenceId: request.getSequenceId()
            });

            // 发送POST请求
            const response = await axios.post(this.apiUrl, binaryData, {
                headers: {
                    'Content-Type': 'application/x-protobuf',
                    'Accept': 'application/x-protobuf',
                    ...this.authHeaders
                },
                responseType: 'arraybuffer', // 接收二进制响应
                timeout: 30000 // 30秒超时
            });

            // 解析二进制响应数据
            const responseBuffer = Buffer.from(response.data);
            
            try {
                // 尝试解析 Response
                const responseProto = Response.Response.deserializeBinary(responseBuffer);
                
                console.log('响应解析成功:', {
                    cmd: responseProto.getCmd(),
                    sequenceId: responseProto.getSequenceId(),
                    statusCode: responseProto.getStatusCode(),
                    errorDesc: responseProto.getErrorDesc(),
                    logId: responseProto.getLogId()
                });

                // 检查响应状态
                if (responseProto.getStatusCode() !== 0) {
                    throw new Error(`发送消息失败: ${responseProto.getErrorDesc() || '未知错误'}`);
                }

                // 获取响应体
                const responseBody = responseProto.getBody();
                let sendMessageResponse = null;
                
                if (responseBody) {
                    sendMessageResponse = responseBody.getSendMessageBody();
                    
                    if (sendMessageResponse) {
                        console.log('发送消息响应详情:', {
                            messageId: sendMessageResponse.getMessageId ? sendMessageResponse.getMessageId() : null,
                            conversationId: sendMessageResponse.getConversationId ? sendMessageResponse.getConversationId() : null
                        });
                    }
                }

                return {
                    success: true,
                    status: response.status,
                    data: {
                        cmd: responseProto.getCmd(),
                        sequenceId: responseProto.getSequenceId(),
                        statusCode: responseProto.getStatusCode(),
                        logId: responseProto.getLogId(),
                        sendMessageResponse: sendMessageResponse
                    },
                    message: '消息发送成功'
                };

            } catch (parseError) {
                console.error('响应解析失败:', parseError);
                console.log('原始响应数据长度:', responseBuffer.length);
                console.log('前100字节:', responseBuffer.slice(0, 100).toString('hex'));
                
                // 如果解析失败，返回原始响应
                return {
                    success: true,
                    status: response.status,
                    data: responseBuffer,
                    message: '消息可能发送成功，但响应解析失败',
                    warning: '无法解析响应格式'
                };
            }

        } catch (error) {
            console.error('发送消息失败:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                conversationId,
                messageContent
            });

            return {
                success: false,
                error: error.message,
                status: error.response?.status,
                message: '消息发送失败'
            };
        }
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