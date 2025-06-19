const { default: Client, OauthAccessTokenRequest } = require('@open-dy/open_api_sdk');
const express = require('express');
const cors = require('cors');
const winston = require('winston');
const ConversationAnalysisService = require('./service/ConversationAnalysisService');
const AdsPowerRouter = require('./router/AdsPowerRouter');
const VideoRouter = require('./router/VideoRouter');
const MessageRouter = require('./router/MessageRouter');
const dbManager = require('./Manager/DataBaseManager');
const serviceManager = require('./Manager/ServiceManager');
require('dotenv').config();

// 配置日志
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// 抖音开放平台配置
const DOUYIN_CLIENT_KEY = process.env.DOUYIN_CLIENT_KEY || 'aw48uuo6r8xm48xb';
const DOUYIN_CLIENT_SECRET = process.env.DOUYIN_CLIENT_SECRET || '7ef22bcf82420090464ee81c7f1e0651';
const DOUYIN_REDIRECT_URI = 'https://418e-116-148-240-41.ngrok-free.app/auth-success';
const DOUYIN_SCOPES = 'trial.whitelist,user_info,video.list.bind';

const app = express();
app.use(cors());
app.use(express.json());

// 设置middleware来注入seleniumService到messageRouter
app.use('/api/messages', (req, res, next) => {
    // 从请求中获取profile_id（如果有的话）
    const profile_id = req.body.profileId || req.query.profile_id || req.headers['x-profile-id'];
    
    if (profile_id) {
        try {
            // 获取对应的seleniumService
            const service = serviceManager.getService(profile_id);
            if (service && service.seleniumService) {
                console.log(`为messageRouter设置SeleniumService，profileId: ${profile_id}`);
                messageRouter.setSeleniumService(service.seleniumService);
            }
        } catch (error) {
            console.log(`设置SeleniumService失败，profileId: ${profile_id}`, error.message);
        }
    }
    
    next();
});

app.use('/api/adsPower', AdsPowerRouter());
app.use('/api/videos', VideoRouter());
app.use('/api/messages', MessageRouter());

app.get('/api/userinfo', async (req, res) => {
    const userInfos = await douyinUserService.GetAuthUserInfo();
    res.json(userInfos);
});

// 获取授权URL
app.get('/api/auth', (req, res) => {
    try {
        const authUrl = `https://open.douyin.com/platform/oauth/connect?client_key=aw48uuo6r8xm48xb&response_type=code&scope=${DOUYIN_SCOPES}&redirect_uri=${DOUYIN_REDIRECT_URI}`;
        res.json({ authUrl });
    } catch (error) {
        logger.error(`Error Get AuthUrl: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// 抖音授权回调
app.post('/api/auth/callback', async (req, res) => {
    try {
        const { code, state } = req.body;
        logger.info(`receive code: ${code}, state: ${state}`);
        const client = new Client({clientKey:DOUYIN_CLIENT_KEY, clientSecret:DOUYIN_CLIENT_SECRET});
        const params = new OauthAccessTokenRequest({
            clientKey: DOUYIN_CLIENT_KEY,
            clientSecret: DOUYIN_CLIENT_SECRET,
            code:code,
            grantType:'authorization_code'
        });
        const messageRes = await client.oauthAccessToken(params);
        if(messageRes.message === 'success'){
            const access_token = messageRes.data.accessToken;
            const open_id = messageRes.data.openId;
            await AuthInfo.create({
                open_id: open_id,
                code: code,
                accessToken: access_token
            });
            console.log('Success receive access token', messageRes.data);
        }else{
            console.log('Error response from douyin', messageRes.data);
        }
        res.json({
            status: 'success',
            code,
            state
        });
    } catch (error) {
        logger.error(`Error in callback: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});


// 获取视频信息
app.get('/api/selenium/videos', async (req, res) => {
    try {
        const profile_id = req.query.profile_id;
        const models =  await dbManager.getModels(profile_id);
        const videoModel = models.VideoListInfo;
        const videos = await videoModel.findAll();
        res.json({ status: 'success', videos });
    } catch (error) {
        console.error('获取视频信息失败:', error);
        res.status(500).json({ error: error.message });
    }
});


// 获取私信信息
app.get('/api/selenium/messages', async (req, res) => {
    try {
        const profile_id = req.query.profile_id;
        const models = await dbManager.getModels(profile_id);
        const messages = await models.ConversationInfo.findAll();
        for(let message of messages){
            const guest = message.guest;
            const owner = message.owner;
            const models = await dbManager.getModels(profile_id);
            const imOwnerUserInfo = await models.IMUserInfo.findOne({
                where: {
                    user_id: owner
                }
            });
            if(imOwnerUserInfo){
                message.dataValues.owner_nickname = imOwnerUserInfo.nickname;
            }
            const imGuestUserInfo = await models.IMUserInfo.findOne({
                where: {
                    user_id: guest
                }
            });
            if(imGuestUserInfo){
                message.dataValues.guest_nickname = imGuestUserInfo.nickname;
            }
        }
        res.json({ status: 'success', messages });
    } catch (error) {
        console.error('获取私信信息失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// 对话分析服务相关API
// 启动对话分析服务
app.post('/api/conversation-analysis/start', async (req, res) => {
    try {
        await ConversationAnalysisService.start();
        res.json({ status: 'success', message: '对话分析服务已启动' });
    } catch (error) {
        console.error('启动对话分析服务失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// 停止对话分析服务
app.post('/api/conversation-analysis/stop', async (req, res) => {
    try {
        ConversationAnalysisService.stop();
        res.json({ status: 'success', message: '对话分析服务已停止' });
    } catch (error) {
        console.error('停止对话分析服务失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// 获取分析结果
app.get('/api/conversation-analysis/results', async (req, res) => {
    try {
        const profile_id = req.query.profile_id;
        if (!profile_id) {
            return res.status(400).json({ error: 'profile_id is required' });
        }
        
        const results = await ConversationAnalysisService.getAnalysisResults(profile_id);
        res.json({ status: 'success', results });
    } catch (error) {
        console.error('获取分析结果失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// 手动触发单个对话分析
app.post('/api/conversation-analysis/analyze', async (req, res) => {
    try {
        const { conversation_text } = req.body;
        if (!conversation_text) {
            return res.status(400).json({ error: '对话内容不能为空' });
        }
        
        const result = await ConversationAnalysisService.analyzeConversation(conversation_text);
        res.status(result.status === 200 ? 200 : 404).json(result);
    } catch (error) {
        console.error('分析对话失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// 清除已处理记录
app.post('/api/conversation-analysis/clear-processed', async (req, res) => {
    try {
        ConversationAnalysisService.clearProcessedRecords();
        res.json({ status: 'success', message: '已清除处理记录' });
    } catch (error) {
        console.error('清除处理记录失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// 设置检查间隔
app.post('/api/conversation-analysis/set-interval', async (req, res) => {
    try {
        const { interval } = req.body;
        if (!interval || interval < 5000) {
            return res.status(400).json({ error: '间隔时间不能少于5秒' });
        }
        
        ConversationAnalysisService.setCheckInterval(interval);
        res.json({ status: 'success', message: `检查间隔已设置为${interval}ms` });
    } catch (error) {
        console.error('设置检查间隔失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// 全局异常处理 - 防止程序崩溃
process.on('uncaughtException', (error) => {
    console.error('💥 未捕获的异常:', error);
    console.error('Stack trace:', error.stack);
    // 记录错误但不退出程序
    console.log('⚠️ 程序继续运行...');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚫 未处理的Promise rejection:', reason);
    console.error('Promise:', promise);
    // 记录错误但不退出程序
    console.log('⚠️ 程序继续运行...');
});

// CDP相关的特殊错误处理
process.on('warning', (warning) => {
    if (warning.name === 'DeprecationWarning' || warning.message.includes('CDP')) {
        console.warn('⚠️ CDP警告:', warning.message);
    }
});

// 启动服务器
const PORT = process.env.PORT || 5001;
try{
    app.listen(PORT, '0.0.0.0', async () => {
        console.log(`Starting Express application...`);
        logger.info(`Server is running on port ${PORT}`);
        // 自动启动对话分析服务
        try {
            await ConversationAnalysisService.start();
            console.log('ConversationAnalysisService started automatically');
        } catch (error) {
            console.error('Failed to start ConversationAnalysisService:', error);
        }
    }); 
}catch(error){
    console.error('Failed to start server:', error);
}