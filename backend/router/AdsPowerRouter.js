const express = require('express');

module.exports = (adsPowerService) => {
    const router = express.Router();

    // 连接到AdsPower浏览器
    router.post('/connect', async (req, res) => {
        try {
            const { profileId } = req.body;
            await adsPowerService.connectToAdsPower(profileId);
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
        const response = await adsPowerService.getOpenBrowserList();
        res.json({  status: 'success', message: response });
    });
    return router;
}