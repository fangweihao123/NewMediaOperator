const { Builder, By, ServiceBuilder, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const CDP = require('chrome-remote-interface');

class AdsPowerService {
    constructor() {
        this.driver = null;
        this.adsPowerUrl = 'http://local.adspower.net:50325';
        this.debugPort = null;
    }

    // 连接到AdsPower浏览器
    async connectToAdsPower(profileId) {
        try {
            const response = await fetch(`${this.adsPowerUrl}/api/v1/browser/start?user_id=${profileId}`, {
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
            return true;
        } catch (error) {
            console.error('连接AdsPower失败:', error);
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

    async getOpenBrowserList(){
        const response = await fetch(`${this.adsPowerUrl}/api/v1/user/list?page_size=100`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const responseBody = await response.body.getReader().read();
        const data = JSON.parse(new TextDecoder().decode(responseBody.value));
        console.log(data);
        const browserList = data.data.list;
        return browserList;
    }
}
module.exports = AdsPowerService; 