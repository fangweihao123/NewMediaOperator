const { default: Client, OauthAccessTokenRequest } = require('@open-dy/open_api_sdk');
const { default: CredentialClient } = require('@open-dy/open_api_credential');
const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const QRCode = require('qrcode');
const winston = require('winston');
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
const DOUYIN_REDIRECT_URI = 'http://localhost:5000/api/callback';

// 数据库配置
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'douyin.db',
    logging: false
});

// 定义 AuthInfo 模型
const AuthInfo = sequelize.define('AuthInfo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING(100)
    }
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

// 获取授权URL
app.get('/api/auth', (req, res) => {
    try {
        const authUrl = `https://open.douyin.com/platform/oauth/connect?client_key=aw48uuo6r8xm48xb&response_type=code&scope=trial.whitelist&redirect_uri=https://756d-116-148-240-41.ngrok-free.app/auth-success`;
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
            console.log('Success receive access token', messageRes.data.access_token);
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Starting Express application...`);
    logger.info(`Server is running on port ${PORT}`);
}); 