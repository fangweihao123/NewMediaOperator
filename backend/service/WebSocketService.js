const WebSocket = require('ws');

class WebSocketService {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.wsUrl = 'wss://frontier-im.douyin.com/ws/v2';
        this.devicePlatform = 'web';
        this.versionCode = 'fws_1.0.0';
        this.accessKey = '2dd9a1c26fc280f9be16340822f7fd57';
        this.fpid = '9';
        this.aid = '6383';
        this.deviceId = '3756376555520414';
        this.xsack = '0';
        this.xaack = '0';
        this.xsqos = '0';
        this.qosSdkVersion = '2';
        this.messageHandlers = new Set();
    }

    connect() {
        try {
            this.ws = new WebSocket(this.wsUrl);
            
            this.ws.on('open', () => {
                console.log('WebSocket 连接已建立');
                this.isConnected = true;
            });

            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleMessage(message);
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

    sendMessage(message) {
        if (this.ws && this.isConnected) {
            this.ws.send(JSON.stringify(message));
        } else {
            throw new Error('WebSocket 未连接');
        }
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