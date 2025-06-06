const { Builder} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const CDP = require('chrome-remote-interface');
const dbManager = require('../Manager/DataBaseManager')
const ProtoParseService = require('./protoParseService');


class AdsPowerService {
    constructor(profileId) {
        this.driver = null;
        this.adsPowerUrl = 'http://local.adspower.net:50325';
        this.debugPort = null;
        this.requestId = null;
        this.profileId = profileId;
    }

    async connectToAdsPower() {
        try {
            const response = await fetch(`${this.adsPowerUrl}/api/v1/browser/start?user_id=${this.profileId}`, {
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
            await this.bindHookToFetchRequest();
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


    async bindHookToFetchRequest(){
        const cdpConnection = await this.driver.createCDPConnection('page');
        await this.driver.onLogEvent(cdpConnection);
        const protocol = await CDP({ port: this.debugPort });
        const { Runtime, Network, Fetch } = protocol;
        Fetch.requestPaused(async ({requestId, request, frameId, resourseType}) => {
            if (request.url.includes('https://creator.douyin.com/janus/douyin/creator/pc/work_list')) {
                const responseData = await Fetch.getResponseBody({requestId});
                let jsonData;
                if(responseData.base64Encoded) {
                    const decodedBody = Buffer.from(responseData.body, 'base64').toString('utf-8');
                    jsonData = JSON.parse(decodedBody);
                    console.log('视频列表 base64 ', jsonData);
                    if (jsonData.aweme_list) {
                        for (const video of jsonData.aweme_list) {
                            const videoData = {
                                title: video.item_title,
                                description: video.desc
                            };
                            const models = await dbManager.getModels(this.profileId);
                            await models.VideoListInfo.sync();
                            const existingVideo = await models.VideoListInfo.findOne({
                                where: {
                                    title: videoData.title,
                                    description: videoData.description
                                }
                            });

                            if (!existingVideo) {
                                await models.VideoListInfo.create(videoData);
                                console.log('Saved new video:', videoData.title);
                            }
                        }
                    }
                }else{
                    jsonData = JSON.parse(responseData.body);
                    console.log('normal ', jsonData);
                }
            }
            if (request.url.includes('https://imapi.douyin.com/v1/message/get_message_by_init')) {
                const responseData = await Fetch.getResponseBody({requestId});
                if(request.headers.Accept.includes('protobuf')) {
                    if(responseData.base64Encoded) {
                        const decodedBuffer = Buffer.from(responseData.body, 'base64');
                        const protoParseService = new ProtoParseService();
                        const parsedMessage = await protoParseService.parseProtobufMessage(decodedBuffer);
                        console.log('初始聊天列表:', parsedMessage);
                        const messageLists = parsedMessage.body.messageByInit.messagesList;
                        for (const message of messageLists) {
                            const conversationInfo = message.conversations;
                            const messageListContent = message.messagesList;
                            let cnt = 1;
                            let conversation = '';
                            for (let i = messageListContent.length - 1; i >= 0; i--) {
                                try {
                                    const messageContent = JSON.parse(messageListContent[i].content);
                                    if (messageContent.aweType === 700) {
                                        if(cnt <= 3 && messageContent.text){
                                            conversation += messageContent.text;
                                            conversation += '\n';
                                            cnt++;
                                        }
                                    }
                                } catch (error) {
                                    // If content is not valid JSON, skip it
                                    continue;
                                }
                            }
                            // 保存会话信息到数据库
                            try {
                                const models = await dbManager.getModels(this.profileId);
                                const existingConversation = await models.ConversationInfo.findOne({
                                    where: {
                                        conversation_id: conversationInfo.conversationId
                                    }
                                });

                                if (existingConversation) {
                                    existingConversation.conversation = conversation;
                                    await existingConversation.save();
                                } else {
                                    const conversationData = {
                                        conversation_id: conversationInfo.conversationId,
                                        conversation: conversation
                                    };
                                    await models.ConversationInfo.create(conversationData);
                                }
                            } catch (error) {
                                console.error('保存会话信息失败:', error);
                            }
                        }
                    } else {
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
    }
}
module.exports = AdsPowerService; 