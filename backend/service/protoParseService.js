const proto = require('../Proto/Response/Response_pb');
class ProtoParse_Service{
    constructor(){

    }

    parseProtobufMessage(buffer) {
        try {
            // 1. 创建Response对象并解析二进制数据
            const response = proto.Response.deserializeBinary(buffer);
            
            // 2. 转换为普通JavaScript对象
            const messageObj = response.toObject();
            
            // 3. 提取关键信息
            const result = {
                code: messageObj.code,
                statusCode: messageObj.statusCode,
                message: messageObj.message,
                container: messageObj.container,
                serverTime: messageObj.serverTime,
                clientTime: messageObj.clientTime,
                userId: messageObj.userId
            };

            // 4. 如果有消息容器，解析具体消息内容
            if (messageObj.container && messageObj.container.messagesList) {
                const messages = [];
                messageObj.container.messagesList.forEach((msgData) => {
                    if (msgData.message && msgData.message.content) {
                        const content = msgData.message.content;
                        messages.push({
                            conversationId: content.conversationId,
                            messageType: content.messageType,
                            content: content.content,
                            senderId: content.senderId,
                            createTime: content.createTime,
                            extInfo: content.extInfoList
                        });
                    }
                });
                result.messages = messages;
            }

            return result;
        } catch (error) {
            console.error('解析protobuf消息失败:', error);
            throw error;
        }
    }

    async handleConversationList(buffer) {
        try {
            // 1. 创建Response对象并解析二进制数据
            const response = proto.Response.deserializeBinary(buffer);
            
            // 2. 转换为普通JavaScript对象
            const messageObj = response.toObject();

            return messageObj;
        } catch (error) {
            console.error('解析conversationlist消息失败:', error);
            throw error;
        }
    }
}

module.exports = ProtoParse_Service;