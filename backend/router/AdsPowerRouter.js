const express = require('express');
const AdsPowerService = require('../service/AdsPowerService');
const serviceManager = require('../Manager/ServiceManager');

module.exports = () => {
    const router = express.Router();
    
    // 连接到AdsPower浏览器 开启新的service
    router.post('/connect', async (req, res) => {
        try {
            const { profileId } = req.body;
            serviceManager.InitService(profileId);
            const service = serviceManager.getService(profileId);
            service.adsPowerService.connectToAdsPower();
            service.seleniumService.fetchVideoInfoTimer(service.taskScheduleService);
            res.json({ status: 'success', message: '连接成功' });
        } catch (error) {
            console.error('连接失败:', error);
            res.status(500).json({ error: error.message });
        }
    });


    // 关闭浏览器
    router.post('/close', async (req, res) => {
        try {
            await seleniumService.closeBrowser();
            res.json({ status: 'success', message: '浏览器已关闭' });
        } catch (error) {
            console.error('关闭浏览器失败:', error);
            res.status(500).json({ error: error.message });
        }
    });

    
    router.get('/userList', async (req, res) => {
        const response = await AdsPowerService.getOpenBrowserList();
        res.json({  status: 'success', message: response });
    });
    return router;
}