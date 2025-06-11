const MessageService = require('../service/MessageService');

// 使用示例
async function examples() {
    // 创建MessageService实例，可以传入认证头信息
    const messageService = new MessageService({
        'Authorization': 'Bearer your-token-here',
        'User-Agent': 'YourApp/1.0',
        'X-Custom-Header': 'custom-value'
    });

    try {
        console.log('=== MessageService 使用示例 ===\n');

        // 示例1: 发送简单文本消息
        console.log('1. 发送简单文本消息:');
        const result1 = await messageService.sendTextMessage(
            '你好，这是一条测试消息', 
            'conversation_id_123'
        );
        console.log('结果:', result1);
        console.log('');

        // 示例2: 发送带选项的消息
        console.log('2. 发送带选项的消息:');
        const result2 = await messageService.sendMessage(
            '这是一条复杂消息',
            'conversation_id_456',
            {
                conversationType: 1,           // 私聊类型
                messageType: 1,               // 文本消息
                ticket: 'optional_ticket',     // 可选票据
                ext: {                        // 扩展字段
                    'custom_key': 'custom_value',
                    'priority': 'high'
                },
                ignoreBadgeCount: true        // 忽略徽章计数
            }
        );
        console.log('结果:', result2);
        console.log('');

        // 示例3: 发送带提及用户的消息
        console.log('3. 发送带提及用户的消息:');
        const result3 = await messageService.sendMentionMessage(
            '@用户1 @用户2 大家好！',
            'conversation_id_789',
            [12345, 67890] // 提及的用户ID列表
        );
        console.log('结果:', result3);
        console.log('');

        // 示例4: 批量发送消息
        console.log('4. 批量发送消息:');
        const messages = [
            {
                content: '消息1',
                conversationId: 'conv_1',
                options: { messageType: 1 }
            },
            {
                content: '消息2',
                conversationId: 'conv_2',
                options: { 
                    messageType: 1,
                    ext: { 'batch': 'true' }
                }
            },
            {
                content: '消息3',
                conversationId: 'conv_3',
                options: { messageType: 1 }
            }
        ];

        const result4 = await messageService.sendMultipleMessages(messages);
        console.log('批量发送结果:', result4);
        console.log('');

        // 示例5: 动态设置认证头
        console.log('5. 动态设置认证头:');
        messageService.setAuthHeaders({
            'New-Auth-Token': 'new-token-value',
            'Session-ID': 'session-123'
        });

        const result5 = await messageService.sendTextMessage(
            '使用新认证头的消息',
            'conversation_id_new'
        );
        console.log('结果:', result5);

    } catch (error) {
        console.error('示例执行失败:', error);
    }
}

// API调用示例
function apiCallExamples() {
    console.log('\n=== API 调用示例 ===\n');

    console.log('1. 发送单条消息 POST /api/messages/send');
    console.log(`
curl -X POST http://localhost:5001/api/messages/send \\
  -H "Content-Type: application/json" \\
  -d '{
    "messageContent": "你好，这是一条测试消息",
    "conversationId": "conversation_id_123",
    "options": {
      "messageType": 1,
      "conversationType": 1
    },
    "authHeaders": {
      "Authorization": "Bearer your-token-here"
    }
  }'
    `);

    console.log('2. 发送文本消息 POST /api/messages/send-text');
    console.log(`
curl -X POST http://localhost:5001/api/messages/send-text \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "简单文本消息",
    "conversationId": "conversation_id_456",
    "authHeaders": {
      "Authorization": "Bearer your-token-here"
    }
  }'
    `);

    console.log('3. 批量发送消息 POST /api/messages/send-batch');
    console.log(`
curl -X POST http://localhost:5001/api/messages/send-batch \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {
        "content": "消息1",
        "conversationId": "conv_1"
      },
      {
        "content": "消息2", 
        "conversationId": "conv_2"
      }
    ],
    "authHeaders": {
      "Authorization": "Bearer your-token-here"
    }
  }'
    `);

    console.log('4. 发送提及消息 POST /api/messages/send-mention');
    console.log(`
curl -X POST http://localhost:5001/api/messages/send-mention \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "@用户1 @用户2 大家好！",
    "conversationId": "conversation_id_789",
    "mentionedUsers": [12345, 67890],
    "authHeaders": {
      "Authorization": "Bearer your-token-here"
    }
  }'
    `);
}

// 运行示例
if (require.main === module) {
    console.log('开始运行MessageService示例...\n');
    
    // 显示API调用示例
    apiCallExamples();
    
    // 运行代码示例（需要真实的API认证）
    // examples();
}

module.exports = {
    examples,
    apiCallExamples
}; 