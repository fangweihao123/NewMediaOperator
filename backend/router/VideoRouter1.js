const express = require('express');
const serviceManager = require('../Manager/ServiceManager');

module.exports = () => {
    const router = express.Router();
    router.post('/upload', async (req, res) => {
        const { profileId, title, description, video, scheduled, scheduledTime} = req.body;
        console.log(profileId, title, description, video);
        const service = serviceManager.getService(profileId);
        const taskScheduleService = service.taskScheduleService;
        if(scheduled){
            taskScheduleService.addScheduledTask(async () => {
                await service.seleniumService.uploadVideo(title, description, video);
            }, scheduledTime);
        }else{
            taskScheduleService.addTask(async () => {
                await service.seleniumService.uploadVideo(title, description, video);
            });
        }
        res.json({ message: 'Video uploaded successfully' });
    });
    router.post('/delete', async (req, res) => {
        const { profileId, title } = req.body;
        const service = serviceManager.getService(profileId);
        const taskScheduleService = service.taskScheduleService;
        taskScheduleService.addDelayedTask(async () => {
            await service.seleniumService.deleteVideo(title, service.taskScheduleService);
        }, 5000);
        res.json({ message: 'Video delete successfully' });
    });
    return router;
}