const express = require('express');
const serviceManager = require('../Manager/ServiceManager');

module.exports = () => {
    const router = express.Router();
    router.post('/upload', async (req, res) => {
        const { title, description, video } = req.body;
        console.log(title, description, video);
        res.json({ message: 'Video uploaded successfully' });
    });
    router.post('/delete', async (req, res) => {
        const { profileId, title } = req.body;
        const service = serviceManager.getService(profileId);
        await service.seleniumService.deleteVideo(title, service.taskScheduleService);
        res.json({ message: 'Video delete successfully' });
    });
    return router;
}