const AdsPowerService = require('../service/AdsPowerService');
const SeleniumService = require('../service/SeleniumService');

async function testLoginStatus() {
    try {
        console.log('开始测试登录状态检查功能...');
        
        // 获取已打开的浏览器列表
        const browserList = await AdsPowerService.getOpenBrowserList();
        console.log(`找到 ${browserList.length} 个已打开的浏览器`);
        
        if (browserList.length === 0) {
            console.log('没有找到已打开的浏览器，请先创建并启动一个浏览器环境');
            return;
        }
        
        // 使用第一个浏览器进行测试
        const testAccount = browserList[0];
        console.log(`使用账户 ${testAccount.user_id} 进行测试`);
        
        // 连接浏览器
        const { driver, debugPort } = await AdsPowerService.connectToAdsPower(testAccount.user_id);
        
        // 创建AdsPowerService实例
        const adsPowerService = new AdsPowerService(testAccount.user_id);
        adsPowerService.driver = driver;
        adsPowerService.debugPort = debugPort;
        
        // 创建SeleniumService实例
        const seleniumService = new SeleniumService(adsPowerService);
        
        // 测试登录状态检查
        console.log('检查登录状态...');
        const isLoggedIn = await seleniumService.checkLoginStatus();
        console.log(`登录状态: ${isLoggedIn ? '已登录' : '未登录'}`);
        
        if (!isLoggedIn) {
            console.log('检测到未登录状态，开始等待登录...');
            const loginResult = await seleniumService.waitForLogin();
            console.log(`登录结果: ${loginResult ? '成功' : '失败'}`);
        }
        
        // 关闭浏览器
        await adsPowerService.closeBrowser();
        console.log('测试完成');
        
    } catch (error) {
        console.error('测试失败:', error);
    }
}

// 运行测试
if (require.main === module) {
    testLoginStatus();
}

module.exports = { testLoginStatus }; 