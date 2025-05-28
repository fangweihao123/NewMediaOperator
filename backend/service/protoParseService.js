
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
            
            // 3. 提取关键信息
            const result = {
                code: messageObj.code,
                statusCode: messageObj.statusCode,
                message: messageObj.message,
                container: messageObj.container,
                timestamp1: messageObj.timestamp1,
                timestamp2: messageObj.timestamp2,
                userId: messageObj.userId
            };

            // 4. 如果有消息容器，解析具体消息内容
            if (messageObj.container && messageObj.container.messagesList) {
                const messages = [];
                messageObj.container.messagesList.forEach((msg) => {
                    messages.push({
                        userId: msg.userId,
                        type: msg.type,
                        status: msg.status,
                        content: msg.content,
                        secUid: msg.secUid
                    });
                });
                result.messages = messages;
            }

            // 5. 如果有用户信息，解析用户信息
            if (messageObj.container && messageObj.container.userInfo) {
                const userInfo = messageObj.container.userInfo;
                result.userInfo = {
                    userId: userInfo.userId,
                    type: userInfo.type,
                    content: userInfo.content,
                    secUid: userInfo.secUid
                };
            }

            // 6. 如果有群组信息，解析群组信息
            if (messageObj.container && messageObj.container.groupInfo) {
                const groupInfo = messageObj.container.groupInfo;
                result.groupInfo = {
                    groupId: groupInfo.groupId,
                    type: groupInfo.type,
                    createTime: groupInfo.createTime,
                    name: groupInfo.name,
                    description: groupInfo.description,
                    avatarUrl: groupInfo.avatarUrl,
                    ownerId: groupInfo.ownerId,
                    ownerSecUid: groupInfo.ownerSecUid,
                    createTimestamp: groupInfo.createTimestamp,
                    attributes: groupInfo.attributesList
                };
            }

            // 7. 如果有群组设置，解析群组设置
            if (messageObj.container && messageObj.container.groupSettings) {
                const groupSettings = messageObj.container.groupSettings;
                result.groupSettings = {
                    groupId: groupSettings.groupId,
                    groupIdLong: groupSettings.groupIdLong,
                    type: groupSettings.type,
                    timestamp: groupSettings.timestamp,
                    settings: groupSettings.settingsList
                };
            }

            return result;
        } catch (error) {
            console.error('解析conversationlist消息失败:', error);
            throw error;
        }
    }
}

module.exports = ProtoParse_Service;