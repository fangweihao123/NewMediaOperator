const express = require('express');

module.exports = (seleniumService) => {
    const router = express.Router();
    router.post('/upload', async (req, res) => {
        const { title, video } = req.body;
        console.log(title, video);
        await seleniumService.uploadVideo(title, video);
        res.json({ message: 'Video uploaded successfully' });
    });
    return router;
}