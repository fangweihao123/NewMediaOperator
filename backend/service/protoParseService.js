const proto = require('../Proto/Response/Response_pb');
class ProtoParse_Service{
    constructor(){

    }

    async parseProtobufMessage(buffer) {
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