const express = require('express');

module.exports = (seleniumService) => {
    const router = express.Router();
    router.post('/upload', async (req, res) => {
        const { title, description, video } = req.body;
        console.log(title, description, video);
        await seleniumService.uploadVideo(title, description, video);
        res.json({ message: 'Video uploaded successfully' });
    });
    router.post('/delete', async (req, res) => {
        const { title } = req.body;
        await seleniumService.deleteVideo(title);
        res.json({ message: 'Video delete successfully' });
    });
    return router;
}