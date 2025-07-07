const axios = require('axios');

async function testForceDelete() {
    try {
        console.log('开始测试强制删除功能...');
        
        // 首先获取环境列表
        const listResponse = await axios.get('http://localhost:3000/adsPower/browsers');
        
        if (listResponse.data.code === 0) {
            const environments = listResponse.data.data.list || [];
            console.log(`找到 ${environments.length} 个环境`);
            
            if (environments.length === 0) {
                console.log('没有找到环境，无法测试删除功能');
                return;
            }
            
            // 选择第一个环境进行测试
            const testEnvironment = environments[0];
            console.log(`测试环境: ID=${testEnvironment.user_id}, 名称=${testEnvironment.name}`);
            
            // 测试强制删除
            console.log('开始强制删除测试...');
            const deleteResponse = await axios.post('http://localhost:3000/adsPower/force-delete-environment', {
                user_ids: [testEnvironment.user_id]
            });
            
            console.log('强制删除响应:', deleteResponse.data);
            
            if (deleteResponse.data.code === 0) {
                console.log('强制删除测试成功！');
                console.log('删除消息:', deleteResponse.data.data.message);
            } else {
                console.log('强制删除测试失败:', deleteResponse.data.msg);
            }
            
        } else {
            console.log('获取环境列表失败:', listResponse.data.msg);
        }
        
    } catch (error) {
        console.error('测试失败:', error.message);
        if (error.response) {
            console.error('错误响应:', error.response.data);
        }
    }
}

// 运行测试
if (require.main === module) {
    testForceDelete();
}

module.exports = { testForceDelete }; 