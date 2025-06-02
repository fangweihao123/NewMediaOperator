const WebSocket = require('ws');
const { Request } = require('../Proto/Request/Request_pb');
const { RequestBody } = require('../Proto/Request/RequestBody_pb');
const { MessagePerUserRequestBody } = require('../Proto/Request/MessagePerUserRequestBody_pb');
const { MessageByInit } = require('../Proto/Request/MessageByInit_pb');
const { Response } = require('../Proto/Response/Response_pb');
const { MessagePerUserResponseBody } = require('../Proto/Response/MessagePerUserResponseBody_pb');

class WebSocketService {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.heartbeatInterval = null;
        const baseUrl = 'wss://frontier-im.douyin.com/ws/v2';
        this.devicePlatform = 'web';
        this.versionCode = 'fws_1.0.0';
        this.accessKey = '2dd9a1c26fc280f9be16340822f7fd57';
        this.token = 'hash.mqeJs91M3pCNE7siTuISPidtVo8hxvO6zdYlWlTZXHQ=';
        this.fpid = '9';
        this.aid = '6383';
        this.deviceId = '3756376555520414';
        this.xsack = '0';
        this.xaack = '0';
        this.xsqos = '0';
        this.qosSdkVersion = '2';
        this.wsUrl = `${baseUrl}?` + 
            `device_platform=${this.devicePlatform}&` +
            `version_code=${this.versionCode}&` +
            `token=${this.token}&` +
            `access_key=${this.accessKey}&` +
            `fpid=${this.fpid}&` +
            `aid=${this.aid}&` +
            `device_id=${this.deviceId}&` +
            `xs_ack=${this.xsack}&` +
            `xa_ack=${this.xaack}&` +
            `xs_qos=${this.xsqos}&` +
            `qos_sdk_version=${this.qosSdkVersion}`;

        /*const baseUrl = 'wss://frontier-im.douyin.com/ws/v2';
        this.versionCode = 'fws_1.0.0';
        this.token = 'hash.mqeJs91M3pCNE7siTuISPidtVo8hxvO6zdYlWlTZXHQ=';
        this.accessKey = '2dd9a1c26fc280f9be16340822f7fd57';
        this.aid = '6383';
        this.fpid = '9';
        this.deviceId = '7489095018427860518';
        this.accessKey = 'a368a7733aaa2738f9095d64a9dd1604';
        this.devicePlatform = 'douyin_pc';
        this.xsack = '0';
        this.xaack = '0';
        this.xsqos = '0';

        this.wsUrl = `${baseUrl}?` +
            `token=${this.token}&` +
            `aid=${this.aid}&` +
            `fpid=${this.fpid}&` +
            `device_id=${this.deviceId}&` +
            `access_key=${this.accessKey}&` +
            `device_platform=${this.devicePlatform}` +
            `xs_ack=${this.xsack}&` +
            `xa_ack=${this.xaack}&` +
            `xs_qos=${this.xsqos}&` +
            `qos_sdk_version=${this.qosSdkVersion}`;*/
        this.messageHandlers = new Set();
    }

    connect() {
        try {
            this.ws = new WebSocket(this.wsUrl);
            
            this.ws.on('open', () => {
                console.log('WebSocket 连接已建立');
                this.isConnected = true;
                this.startHeartbeat();
            });

            this.ws.on('message', (data) => {
                try {
                    console.log('收到消息:', data.toString());
                    const decodedBuffer = Buffer.from(data.toString(), 'base64');
                    // this.handleProtobufMessage(decodedBuffer);
                } catch (error) {
                    console.error('消息解析错误:', error);
                }
            });

            this.ws.on('error', (error) => {
                console.error('WebSocket 错误:', error);
                this.isConnected = false;
            });

            this.ws.on('close', () => {
                console.log('WebSocket 连接已关闭');
                this.isConnected = false;
                this.reconnect();
            });

        } catch (error) {
            console.error('WebSocket 连接失败:', error);
        }
    }

    requestMessagePerUser(cursor = 0, limit = 20) {
        try {
            console.log('构建 MessagePerUserRequest, cursor:', cursor, 'limit:', limit);
            
            // 1. 创建 MessagePerUserRequestBody
            const messagePerUserBody = new MessagePerUserRequestBody();
            messagePerUserBody.setCursor(cursor);
            messagePerUserBody.setLimit(limit);

            const messageByInit = new MessageByInit();
            messageByInit.setPage(0);
            
            // 2. 创建 RequestBody
            const requestBody = new RequestBody();
            requestBody.setMessageByInit(messageByInit);
            
            // 3. 创建主 Request
            const request = new Request();
            request.setCmd(2043); // MessagePerUser 命令
            request.setSequenceId(10056);
            request.setSdkVersion('1.1.3');
            request.setToken(this.token);
            request.setRefer(3);
            request.setInboxType(1);
            request.setBuildNumber('8aa2dcb:Detached: 8aa2dcb88b41538885168e4afbbd2b6bac8aefb2');
            request.setBody(requestBody);
            //request.setDeviceId(this.deviceId);
            request.setDeviceId('0');
            const headers = {
                'app_name': 'douyin_pc',
                'browser_language': 'zh-CN', 
                'browser_name': 'Mozilla',
                'browser_online': 'true',
                'browser_platform': 'Win32',
                'browser_version': '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
                'cookie_enabled': 'true',
                'deviceId': '0',
                'fp': 'verify_m91gimia_NSbK3b9f_kZTm_4TFo_BiCf_MS4EyBxL3WcI',
                'priority_region': 'cn',
                'referer': '',
                'screen_height': '1440',
                'screen_width': '2560',
                'session_aid': '6383',
                'session_did': '0',
                'timezone_name': 'Asia/Hong_Kong',
                'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
                'webid': '7489095018427860518'
            };
            const headersMap = request.getHeadersMap();
            Object.entries(headers).forEach(([key, value]) => {
                headersMap.set(key, value);
            });
            request.setDevicePlatform("douyin_pc");

            request.setVersionCode(this.versionCode);
            request.setAuthType(4);
            request.setAccess('web_sdk');
            
            // 可以尝试为base64编码
            // 4. 序列化为二进制数据
            // Convert request to base64
            const binaryBuffer = request.serializeBinary();
            const base64Data = Buffer.from(binaryBuffer).toString('base64');
            
            console.log('发送 MessagePerUserRequest:');
            console.log('- 命令:', request.getCmd());
            console.log('- 序列号:', request.getSequenceId());
            console.log('- cursor:', cursor);
            console.log('- limit:', limit);
            console.log('- 二进制数据长度:', binaryBuffer.length);
            
            // 5. 发送二进制数据
            this.sendBinaryMessage(base64Data);
            
        } catch (error) {
            console.error('构建 MessagePerUserRequest 失败:', error);
        }
    }

    // 处理 protobuf 消息
    handleProtobufMessage(data) {
        try {
            // 解析 Response
            const response = Response.deserializeBinary(data);
            
            console.log('解析到 Response:');
            console.log('- 命令:', response.getCmd());
            console.log('- 序列号:', response.getSequenceId());
            console.log('- 状态码:', response.getStatusCode());
            console.log('- 错误描述:', response.getErrorDesc());
            
            const body = response.getBody();
            if (body) {
                // 根据命令类型处理不同的响应
                switch (response.getCmd()) {
                    case 200:
                        this.handleMessagePerUserResponse(body);
                        break;
                    case 2006:
                        break;
                    default:
                        console.log('未处理的命令类型:', response.getCmd());
                }
            }
            
        } catch (error) {
            console.error('protobuf 消息处理失败:', error);
            console.error('原始数据长度:', data.length);
            console.error('前50字节:', data.slice(0, Math.min(50, data.length)).toString('hex'));
        }
    }

    // 处理 MessagePerUser 响应
    handleMessagePerUserResponse(responseBody) {
        try {
            const msgPerUserBody = responseBody.getMsgperuserbody();
            if (msgPerUserBody) {
                const messages = msgPerUserBody.getMessagesList();
                console.log('- 消息数量:', messages.length);
                
                // 处理每条消息
                messages.forEach((messageBody, index) => {
                    const content = messageBody.getContent();
                    console.log(`消息 ${index + 1} 内容:`, content);
                });
            }
        } catch (error) {
            console.error('处理 MessagePerUser 响应失败:', error);
        }
    }

    sendBinaryMessage(binaryData) {
        if (this.ws && this.isConnected) {
            this.ws.send(binaryData);
            console.log('已发送二进制消息, 长度:', binaryData.length);
        } else {
            throw new Error('WebSocket 未连接');
        }
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                const pingData = new Uint8Array([0x01, 0x00, 0x00, 0x00]);
                this.sendBinaryMessage(pingData);
                console.log('发送心跳');
            }
        }, 30000); // 每30秒发送一次心跳
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    handleMessage(message) {
        // 通知所有注册的消息处理器
        this.messageHandlers.forEach(handler => {
            try {
                handler(message);
            } catch (error) {
                console.error('消息处理错误:', error);
            }
        });
    }

    addMessageHandler(handler) {
        this.messageHandlers.add(handler);
    }

    removeMessageHandler(handler) {
        this.messageHandlers.delete(handler);
    }



    reconnect() {
        if (!this.isConnected) {
            console.log('尝试重新连接...');
            setTimeout(() => {
                this.connect();
            }, 3000);
        }
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

module.exports = WebSocketService;