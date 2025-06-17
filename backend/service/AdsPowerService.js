const { Builder} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const CDP = require('chrome-remote-interface');
const dbManager = require('../Manager/DataBaseManager')
const ProtoParseService = require('./ProtoParseService');


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

            chromeOptions.addArguments('--disk-cache-size=0');
            chromeOptions.addArguments('--media-cache-size=0');
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

    async parseVideoList(responseData){
        let jsonData;
        if(responseData.base64Encoded) {
            const decodedBody = Buffer.from(responseData.body, 'base64').toString('utf-8');
            jsonData = JSON.parse(decodedBody);
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
                        }
                    });

                    if (!existingVideo) {
                        await models.VideoListInfo.create(videoData);
                    }
                    await models.VideoListInfo.sync();
                }
            }
        }else{
            jsonData = JSON.parse(responseData.body);
            console.log('normal ', jsonData);
        }
    }

    async parseMessageList(responseData){
        if(responseData.base64Encoded) {
            const decodedBuffer = Buffer.from(responseData.body, 'base64');
            const protoParseService = new ProtoParseService();
            const parsedMessage = await protoParseService.parseProtobufMessage(decodedBuffer);
            const messageLists = parsedMessage.body.messageByInit.messagesList;
            for (const message of messageLists) {
                const conversationInfo = message.conversations;
                const firstpageParticipant = conversationInfo.firstpageparticipant;
                const guest = firstpageParticipant.participantsList[0].userId;
                const owner = firstpageParticipant.participantsList[1].userId;
                const messageListContent = message.messagesList;
                let cnt = 1;
                let conversation = '';
                for (let i = 0; i <= messageListContent.length - 1; i++) {
                    try {
                        const messageContent = JSON.parse(messageListContent[i].content);
                        if (messageContent.aweType === 700 || messageContent.aweType === 0) {
                            if(cnt <= 3 && messageContent.text && messageContent.text.trim()){
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

                    if(conversation.length > 0){
                        if (existingConversation) {
                            existingConversation.conversation = conversation;
                            await existingConversation.save();
                        } else {
                            const conversationData = {
                                conversation_id: conversationInfo.conversationId,
                                owner: owner,
                                guest: guest,
                                conversation: conversation
                            };
                            await models.ConversationInfo.create(conversationData);
                        }
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

    async parseIMUserInfo(responseData){
        if(responseData.base64Encoded) {
            const decodedBuffer = Buffer.from(responseData.body, 'base64');
            const jsonData = JSON.parse(decodedBuffer);
            for(const accountInfo of jsonData.data){
                const uid = BigInt(accountInfo.uid);
                const nickname = accountInfo.nickname;
                const models = await dbManager.getModels(this.profileId);
                await models.IMUserInfo.sync();
                const existingUser = await models.IMUserInfo.findOne({
                    where: {
                        user_id: uid
                    }
                });
                if(!existingUser){
                    await models.IMUserInfo.create({
                        user_id: uid,
                        nickname: nickname
                    });
                }else{
                    existingUser.nickname = nickname;
                    await existingUser.save();
                }
            }
        }
        
    }

    async bindHookToFetchRequest(){
        try{
            const cdpConnection = await this.driver.createCDPConnection('page');
            await this.driver.onLogEvent(cdpConnection);
            const cdpProtocal = await CDP({ port: this.debugPort });
            const { Runtime, Network, Fetch } = cdpProtocal;
            await Network.setCacheDisabled({ cacheDisabled: true });
            Fetch.requestPaused(async ({requestId, request, frameId, resourseType}) => {
                try{
                    if (request.url.includes('https://creator.douyin.com/janus/douyin/creator/pc/work_list')) {
                        console.log('parse video list');
                        const responseData = await Fetch.getResponseBody({requestId});
                        await this.parseVideoList(responseData);
                    }
                    if (request.url.includes('https://www.douyin.com/aweme/v1/web/im/user/info')) {
                        const responseData = await Fetch.getResponseBody({requestId});
                        await this.parseIMUserInfo(responseData);
                    }
                    if (request.url.includes('https://imapi.douyin.com/v1/message/get_message_by_init')) {
                        console.log('parse init message');
                        const responseData = await Fetch.getResponseBody({requestId});
                        if(request.headers.Accept.includes('protobuf')) {
                            await this.parseMessageList(responseData);
                        }
                    }
                    //console.log('requestId', requestId);
                    Fetch.continueRequest({requestId});
                }catch(error){
                    console.error('bindHookToFetchRequest failed:');
                }
            });
            Fetch.enable({
                patterns: [{urlPattern: 'https://creator.douyin.com/janus/douyin/creator/pc/work_list*', requestStage:'Response'},
                            {urlPattern: 'https://www.douyin.com/aweme/v1/web/im/user/info*', requestStage:'Response'},
                            {urlPattern: 'https://imapi.douyin.com/v1/message/get_message_by_init*', requestStage:'Response'}
                ]
            });
            this.isHookBound = true;
        }catch(error){
            console.error('bindHookToFetchRequest failed:', error);
        }
    }
}
module.exports = AdsPowerService; 