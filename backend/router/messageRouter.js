const express = require('express');

module.exports = (websocketServicev) => {
    const router = express.Router();
    router.post('/message/send', async (req, res) => {
        const { message } = req.body;
        await websocketService.sendMessage(message);
        res.json({ message: 'Msg send successfully' });
    });
    return router;
}