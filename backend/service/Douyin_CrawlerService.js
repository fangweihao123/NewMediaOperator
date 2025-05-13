const { chromium } = require('playwright');

class Douyin_CrawlerService {
    constructor() {
        this.browser = null;
        this.context = null;
    }

    async initialize() {
        // 启动浏览器
        this.browser = await chromium.launch({
            headless: false, // 开发时设为 false 以便调试
        });
        
        // 创建上下文
        this.context = await this.browser.newContext({
            viewport: { width: 1280, height: 800 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
    }

    async login() {
        const page = await this.context.newPage();
        await page.goto('https://www.douyin.com');
        
        // 等待用户手动登录
        await page.waitForSelector('.account-avatar', { timeout: 300000 }); // 5分钟超时
        
        // 保存登录状态
        await this.context.storageState({ path: 'douyin-storage-state.json' });
    }

    async getVideos(secUid) {
        const page = await this.context.newPage();
        await page.goto(`https://www.douyin.com/user/${secUid}`);

        // 等待视频列表加载
        await page.waitForSelector('.video-list-item');

        // 获取视频信息
        const videos = await page.evaluate(() => {
            const items = document.querySelectorAll('.video-list-item');
            return Array.from(items).map(item => ({
                title: item.querySelector('.video-title')?.textContent?.trim(),
                desc: item.querySelector('.video-desc')?.textContent?.trim(),
                likes: item.querySelector('.like-count')?.textContent?.trim(),
                comments: item.querySelector('.comment-count')?.textContent?.trim(),
                shares: item.querySelector('.share-count')?.textContent?.trim(),
                url: item.querySelector('a')?.href
            }));
        });

        return videos;
    }

    async getMessages() {
        const page = await this.context.newPage();
        await page.goto('https://www.douyin.com/message');

        // 等待消息列表加载
        await page.waitForSelector('.message-list-item');

        // 获取消息列表
        const messages = await page.evaluate(() => {
            const items = document.querySelectorAll('.message-list-item');
            return Array.from(items).map(item => ({
                sender: item.querySelector('.sender-name')?.textContent?.trim(),
                lastMessage: item.querySelector('.last-message')?.textContent?.trim(),
                time: item.querySelector('.message-time')?.textContent?.trim()
            }));
        });

        return messages;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

module.exports = new Douyin_CrawlerService(); 