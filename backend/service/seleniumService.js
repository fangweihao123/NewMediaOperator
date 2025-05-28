const { Builder, By, ServiceBuilder, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const CDP = require('chrome-remote-interface');

class SeleniumService {
    constructor(videoListInfo, StrangerConversationInfo, protoParseService) {
        this.driver = null;
        this.adsPowerUrl = 'http://local.adspower.net:50325';
        this.debugPort = null;
        this.requestId = null;
        this.videoListInfo = videoListInfo;
        this.StrangerConversationInfo = StrangerConversationInfo;
        this.protoParseService = protoParseService;
    }

    async bindHookToFetchRequest(){
        const cdpConnection = await this.driver.createCDPConnection('page');
        await this.driver.onLogEvent(cdpConnection);
        const protocol = await CDP({ port: this.debugPort });
        const { Runtime, Network, Fetch } = protocol;
        Fetch.requestPaused(async ({requestId, request, frameId, resourseType}) => {
            if (request.url.includes('https://www-hj.douyin.com/aweme/v1/web/aweme/post')) {
                const responseData = await Fetch.getResponseBody({requestId});
                let jsonData;
                if(request.headers.Accept.includes('text')) {
                    if(responseData.base64Encoded) {
                        const decodedBody = Buffer.from(responseData.body, 'base64').toString('utf-8');
                        jsonData = JSON.parse(decodedBody);
                        console.log('base64 ', jsonData);
                    }else{
                        jsonData = JSON.parse(responseData.body);
                        console.log('normal ', jsonData);
                    }
                }
            }
            Fetch.continueRequest({requestId});
        });
        Fetch.enable({
            patterns: [{requestStage:'Response'}]
        });
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
            const webDriverPath = data.data.webdriver;
            console.log(seleniumURL, debugPort, seleniumWebDriver);
            const fullSeleniumURL = seleniumURL.startsWith('http') 
                ? seleniumURL 
                : `http://${seleniumURL}`;
            const chromeOptions = new chrome.Options();
            chromeOptions.debuggerAddress(seleniumURL);
            chromeOptions.addArguments('--no-sandbox');
            chromeOptions.addArguments('--disable-dev-shm-usage');
            chromeOptions.addArguments('--disable-gpu');
            const service = new chrome.ServiceBuilder(webDriverPath);
            console.log('Using Selenium URL:', fullSeleniumURL);  
            console.log('building drive instance');
            this.driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(chromeOptions)
                .setChromeService(service)
                .build();
            this.debugPort = debugPort;
            this.driver.get('https://www.douyin.com/user/self?from_tab_name=main&showTab=post');
            console.log('open douyin page');
            return true;
        } catch (error) {
            console.error('连接AdsPower失败:', error);
            throw error;
        }
    }

    // 获取视频信息
    async getVideoInfo() {
        try {

        } catch (error) {
            console.error('获取视频信息失败:', error);
            throw error;
        }
    }


    async replyMessages(message) {
        try {
            const cdpConnection = await this.driver.createCDPConnection('page');
            await this.driver.onLogEvent(cdpConnection);
            const protocol = await CDP({ port: this.debugPort });
            const { Runtime, Network, Fetch } = protocol;
            Fetch.requestPaused(async ({requestId, request, frameId, resourseType}) => {
                if (request.url.includes('https://imapi.douyin.com/v1/conversation/list')) {
                    console.log(requestId);
                    console.log(request.headers);
                    console.log(resourseType);
                    const responseData = await Fetch.getResponseBody({requestId});
                    if(request.headers.Accept.includes('protobuf')) {
                        // 处理proto数据
                        // TODO: 需要添加proto解析逻辑
                        console.log('data ', responseData.body);
                        if(responseData.base64Encoded) {
                            // 解码base64数据
                            const decodedBuffer = Buffer.from(responseData.body, 'base64');
                            const parsedMessage = this.protoParseService.handleConversationList(decodedBuffer);
                            console.log('解析后的会话列表:', parsedMessage);
                        } else {
                            // 直接转换为十六进制
                            const jsonData = JSON.parse(responseData.body);
                            console.log('normal ', jsonData);
                        }
                    }
                }
                Fetch.continueRequest({requestId});
            });
            Fetch.enable({
                patterns: [{requestStage:'Response'}]
            });
            return;
        }catch(error) {
            console.error('获取私信失败', error);
            return error;
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
module.exports = SeleniumService; 