const { default: Client, OauthAccessTokenRequest } = require('@open-dy/open_api_sdk');
const { default: CredentialClient } = require('@open-dy/open_api_credential');
const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const QRCode = require('qrcode');
const winston = require('winston');
const Douyin_UserService = require('./service/Douyin_UserService');
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

const app = express();
app.use(cors());
app.use(express.json());

// 抖音开放平台配置
const DOUYIN_CLIENT_KEY = process.env.DOUYIN_CLIENT_KEY || 'aw48uuo6r8xm48xb';
const DOUYIN_CLIENT_SECRET = process.env.DOUYIN_CLIENT_SECRET || '7ef22bcf82420090464ee81c7f1e0651';
const DOUYIN_REDIRECT_URI = 'https://cd04-240e-391-cda-6bf0-c9de-59a0-c469-b5cb.ngrok-free.app/auth-success';
// 抖音是支持投稿能力，但是需要申请，等布局确定之后可以显示
const DOUYIN_SCOPES = 'trial.whitelist,user_info,video.list.bind';

// 数据库配置
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'douyin.db',
    logging: false
});

// 定义 AuthInfo 模型
const AuthInfo = sequelize.define('AuthInfo', {
    open_id: {
        type: DataTypes.STRING(100),
        primaryKey: true
    },
    code: {
        type: DataTypes.STRING(100)
    },
    accessToken: {
        type: DataTypes.STRING(100)
    },
});

// 初始化数据库
(async () => {
    try {
        await sequelize.sync();
        logger.info("Database tables created successfully");
    } catch (error) {
        logger.error(`Error creating database tables: ${error.message}`);
        throw error;
    }
})();

app.get('/api/userinfo', async (req, res) => {
    const userInfos = await Douyin_UserService.GetAuthUserInfo();
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
            const { access_token, open_id } = messageRes.data;
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

// 启动服务器
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Starting Express application...`);
    logger.info(`Server is running on port ${PORT}`);
}); 