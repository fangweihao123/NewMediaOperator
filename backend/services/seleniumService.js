const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const CDP = require('chrome-remote-interface');

class SeleniumService {
    constructor() {
        this.driver = null;
        this.adsPowerUrl = 'http://local.adspower.net:50325';
        this.debugPort = null;
        this.requestId = null;

    }

    // 连接到AdsPower浏览器
    async connectToAdsPower(profileId) {
        try {
            const response = await fetch(`${this.adsPowerUrl}/api/v1/browser/start?user_id=ky0cw6s`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const responseBody = await response.body.getReader().read();
            const data = JSON.parse(new TextDecoder().decode(responseBody.value));
            console.log(data);
            const seleniumURL = data.data.ws.selenium;
            const debugPort = data.data.debug_port;
            const seleniumWebDriver = data.data.webdriver;
            console.log(seleniumURL, debugPort, seleniumWebDriver);
            const fullSeleniumURL = seleniumURL.startsWith('http') 
                ? seleniumURL 
                : `http://${seleniumURL}`;
            const chromeOptions = new chrome.Options();
            chromeOptions.debuggerAddress(seleniumURL);
                
            console.log('Using Selenium URL:', fullSeleniumURL);  
            this.driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(chromeOptions)
                .build();
            this.debugPort = debugPort;
            
            return true;
        } catch (error) {
            console.error('连接AdsPower失败:', error);
            throw error;
        }
    }

    // 获取视频信息
    async getVideoInfo() {
        try {
            const cdpConnection = await this.driver.createCDPConnection('page');
            await this.driver.onLogEvent(cdpConnection);
            const protocol = await CDP({ port: this.debugPort });
            const { Runtime, Network, Fetch } = protocol;
            Fetch.requestPaused(async ({requestId, request, frameId, resourseType, responseErrorReason, responseStatusCode, responseStatusText}) => {
                if (request.url.includes('https://www-hj.douyin.com/aweme/v1/web/aweme/post')) {
                    console.log(requestId);
                    console.log(request.headers);
                    console.log(resourseType);
                    //console.log(responseStatusCode);
                    //console.log(responseStatusText);
                    //console.log(request.url);
                    const responseData = await Fetch.getResponseBody({requestId});
                    let jsonData;
                    if(responseData.body.length > 10) {
                        if(responseData.base64Encoded) {
                            const decodedBody = Buffer.from(responseData.body, 'base64').toString('utf-8');
                            jsonData = JSON.parse(decodedBody);
                        }else{
                            jsonData = JSON.parse(responseData.body);
                        }
                    }
                    console.log(jsonData);
                }
                Fetch.continueRequest({requestId});
            });
            Fetch.enable({
                patterns: [{requestStage:'Response'}]
            });
            await this.driver.get('https://www.douyin.com/user/self?from_tab_name=main&showTab=post');
            // Wait for network requests
            await Network.enable();
            /*Network.responseReceived(async ({ requestId, loaderId, timestamp, type, response, hasExtraInfo, frameId}) => {
                if (response.url.includes('https://www-hj.douyin.com/aweme/v1/web/aweme/post/')) {
                    console.log(response);
                }
            });
            
            Network.responseReceivedExtraInfo(async ({ requestId, blockedCookies, headers, resourceIPAddressSpace, statusCode, hasExtraInfo, frameId}) => {
                if (response.url.includes('https://www-hj.douyin.com/aweme/v1/web/aweme/post/')) {
                    console.log(response);
                }
            });*/
            Network.responseReceived(async ({ requestId, loaderId, timestamp, type, response, hasExtraInfo, frameId}) => {
                if (response.url.includes('https://www-hj.douyin.com/aweme/v1/web/aweme/post/')) {
                    //const responseData = Fetch.getResponseBody({requestId});
                    //console.log(responseData.body);
                }
            });
            
            // Enable network interception
            return true;
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