const { Builder, By, ServiceBuilder, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const CDP = require('chrome-remote-interface');

class SeleniumService {
    constructor(videoListInfo, ConversationInfo, protoParseService) {
        this.driver = null;
        this.adsPowerUrl = 'http://local.adspower.net:50325';
        this.debugPort = null;
        this.requestId = null;
        this.videoListInfo = videoListInfo;
        this.ConversationInfoDB = ConversationInfo;
        this.protoParseService = protoParseService;
        this.videoInfoRefreshHandler = null;
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
                            // Ensure the VideoListInfo table exists
                            await this.videoListInfo.sync();
                            // Check if video already exists before inserting
                            const existingVideo = await this.videoListInfo.findOne({
                                where: {
                                    title: videoData.title,
                                    description: videoData.description
                                }
                            });

                            if (!existingVideo) {
                                await this.videoListInfo.create(videoData);
                                console.log('Saved new video:', videoData.title);
                            }
                        }
                    }
                }else{
                    jsonData = JSON.parse(responseData.body);
                    console.log('normal ', jsonData);
                }
            }
            if (request.url.includes('https://imapi.douyin.com/v1/conversation/list')) {
                const responseData = await Fetch.getResponseBody({requestId});
                if(request.headers.Accept.includes('protobuf')) {
                    if(responseData.base64Encoded) {
                        // 解码base64数据
                        const decodedBuffer = Buffer.from(responseData.body, 'base64');
                        const parsedMessage = await this.protoParseService.parseProtobufMessage(decodedBuffer);
                        console.log('聊天列表:', parsedMessage);
                    } else {
                        // 直接转换为十六进制
                        const jsonData = JSON.parse(responseData.body);
                        console.log('normal ', jsonData);
                    }
                }
            }
            if (request.url.includes('https://imapi.douyin.com/v1/message/get_message_by_init')) {
                const responseData = await Fetch.getResponseBody({requestId});
                if(request.headers.Accept.includes('protobuf')) {
                    if(responseData.base64Encoded) {
                        // 解码base64数据
                        const decodedBuffer = Buffer.from(responseData.body, 'base64');
                        const parsedMessage = await this.protoParseService.parseProtobufMessage(decodedBuffer);
                        console.log('初始聊天列表:', parsedMessage);
                        // 获取message_by_init对象
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
                                const existingConversation = await this.ConversationInfoDB.findOne({
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
                                    await this.ConversationInfoDB.create(conversationData);
                                }
                            } catch (error) {
                                console.error('保存会话信息失败:', error);
                            }
                        }
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
            this.bindHookToFetchRequest();
            //this.fetchVideoInfoTimer();
            // Set up periodic video info fetching
            console.log('open douyin page');
            return true;
        } catch (error) {
            console.error('连接AdsPower失败:', error);
            throw error;
        }
    }
    
    async getVideoList() {
        try {
            const result = await this.videoListInfo.findAll();
            return result;
        } catch (error) {
            console.error('获取视频列表失败:', error);
            throw error;
        }
    }

    // 获取视频信息
    async fetchVideoInfoTimer() {
        try {
            this.videoInfoRefreshHandler = setInterval(async () => {
                if (this.driver) {
                    await this.driver.get('https://creator.douyin.com/creator-micro/content/manage?enter_from=publish');
                }
                console.log('Successfully fetched video info');
            }, 6000); // Fetch every 60 seconds
        } catch (error) {
            console.error('获取视频信息失败:', error);
            throw error;
        }
    }

    async uploadVideo(title, description, filepath) {
        try {
            if(this.driver){
                await this.driver.get('https://creator.douyin.com/creator-micro/content/upload');
                // Wait for 2 seconds
                await new Promise(resolve => setTimeout(resolve, 3000));
                //await this.driver.wait(until.urlIs('https://creator.douyin.com/creator-micro/content/upload'));
                const fileInput = await this.driver.findElement(By.css("div[class^='container'] input"));
                await fileInput.sendKeys(filepath);
                
                await new Promise(resolve => setTimeout(resolve, 3000));
                // Wait for title input to be visible and interactable
                const titleInput = await this.driver.wait(
                    until.elementLocated(By.xpath("//*[@id='DCPF']/div[1]/div[1]/div[1]/div[1]/div[2]/div[1]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/input[1]")),
                    10000
                );
                await titleInput.clear();
                await titleInput.sendKeys(title);
                const descriptionInput = await this.driver.wait(
                    until.elementLocated(By.xpath("//*[@id='DCPF']/DIV[1]/DIV[1]/DIV[1]/DIV[1]/DIV[2]/DIV[1]/DIV[1]/DIV[2]/DIV[1]/DIV[1]/DIV[1]/DIV[1]/DIV[2]/DIV[1]")),
                    10000
                );
                await descriptionInput.clear();
                await descriptionInput.sendKeys(description);
                await new Promise(resolve => setTimeout(resolve, 30000));
                // Click the publish button
                const publishButton = await this.driver.wait(
                    until.elementLocated(By.xpath("//*[@id='DCPF']/div[1]/div[1]/div[1]/div[5]/div[1]/div[1]/div[1]/div[1]/div[1]/button[1]")),
                    10000
                );
                await publishButton.click();
            } 
        } catch (error) {
            console.error('上传视频失败:', error);
            throw error;
        }
    }

    async deleteVideo(title) {
        try {
            if (this.driver) {
                await this.driver.get('https://creator.douyin.com/creator-micro/content/manage?enter_from=publish');
                // Wait for page to load
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Find all video cards
                const videoCards = await this.driver.findElements(By.xpath("//*[@id='root']/DIV[1]/DIV[1]/DIV[2]/DIV[2]/DIV[1]/DIV"));

                // Loop through cards to find matching title
                for (const card of videoCards) {
                    const titleElement = await card.findElement(By.xpath("DIV[1]/DIV[2]/DIV[1]/DIV[1]/DIV[1]"));
                    const cardTitle = await titleElement.getText();
                    
                    if (cardTitle === title) {
                        // Find and click delete button within this card
                        const deleteButton = await card.findElement(By.xpath("DIV[2]/DIV[1]/DIV[2]/DIV[1]/DIV[1]/DIV[2]/DIV[1]/DIV[4]/SPAN[1]"));
                        await deleteButton.click();
                        // Wait for confirmation dialog and click confirm
                        break;
                    }
            }
        }
        } catch (error) {
            console.error('删除视频失败:', error);
            throw error;
        }
    }


    async replyMessages(message) {
        try {
            const cdpConnection = await this.driver.createCDPConnection('page');
            await this.driver.onLogEvent(cdpConnection);
            const protocol = await CDP({ port: this.debugPort });
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