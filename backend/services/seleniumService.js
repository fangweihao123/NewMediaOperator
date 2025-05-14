const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

class SeleniumService {
    constructor() {
        this.driver = null;
        this.adsPowerUrl = 'http://local.adspower.net:50325';
        
    }

    // 连接到AdsPower浏览器
    async connectToAdsPower(profileId) {
        try {
            const response = await fetch(`${this.adsPowerUrl}/api/v2/browser-profile/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    profile_id: profileId
                })
            });
            
            console.log(response);
            const seleniumURL = response.data.ws.selenium;
            const debugPort = response.data.ws.debug_port;
            const seleniumWebDriver = response.data.webdriver;
            console.log(seleniumURL, debugPort, seleniumWebDriver);
            return true;
        } catch (error) {
            console.error('连接AdsPower失败:', error);
            throw error;
        }
    }

    // 获取视频信息
    async getVideoInfo() {
        try {
            // 等待视频列表加载
            await this.driver.wait(until.elementLocated(By.className('video-feed-item')), 10000);

            // 获取视频列表
            const videoElements = await this.driver.findElements(By.className('video-feed-item'));
            const videos = [];

            for (const video of videoElements) {
                try {
                    const videoInfo = {
                        title: await video.findElement(By.className('title')).getText(),
                        author: await video.findElement(By.className('author')).getText(),
                        likes: await video.findElement(By.className('like-count')).getText(),
                        comments: await video.findElement(By.className('comment-count')).getText(),
                        shares: await video.findElement(By.className('share-count')).getText(),
                        url: await video.findElement(By.tagName('a')).getAttribute('href')
                    };
                    videos.push(videoInfo);
                } catch (error) {
                    console.error('获取单个视频信息失败:', error);
                    continue;
                }
            }

            return videos;
        } catch (error) {
            console.error('获取视频信息失败:', error);
            throw error;
        }
    }

    // 关闭浏览器
    async closeBrowser() {
        if (this.driver) {
            await this.driver.quit();
            this.driver = null;
        }
    }
}

module.exports = new SeleniumService(); 