const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const CDP = require('chrome-remote-interface');
const proto = require('../Proto/conversationmsg_pb');

class SeleniumService {
    constructor(videoListInfo) {
        this.driver = null;
        this.adsPowerUrl = 'http://local.adspower.net:50325';
        this.debugPort = null;
        this.requestId = null;
        this.videoListInfo = videoListInfo;

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
            await this.driver.get('https://www.douyin.com/user/self?from_tab_name=main&showTab=post');
            return true;
        } catch (error) {
            console.error('连接AdsPower失败:', error);
            throw error;
        }
    }

    // 获取视频信息
    async getVideoInfo() {
        try {
            // Get videos from database
            /*const videos = await this.videoListInfo.findAll({
                attributes: ['video_desc', 'video_share_url'],
                raw: true
            });

            // Transform video data
            const formattedVideos = videos.map(video => ({
                desc: video.video_desc,
                video_url: video.video_share_url,
                cover_url: '' // Since cover URL is not stored in DB
            }));

            return formattedVideos;*/
            const cdpConnection = await this.driver.createCDPConnection('page');
            await this.driver.onLogEvent(cdpConnection);
            const protocol = await CDP({ port: this.debugPort });
            const { Runtime, Network, Fetch } = protocol;
            Fetch.requestPaused(async ({requestId, request, frameId, resourseType}) => {
                if (request.url.includes('https://www-hj.douyin.com/aweme/v1/web/aweme/post')) {
                    console.log(requestId);
                    console.log(request.headers);
                    console.log(resourseType);
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
                        /*for (const video of jsonData.aweme_list) {
                            await this.videoListInfo.create({
                                video_desc: video.desc,
                                video_share_url: video.share_url
                            });
                        }*/
                    }
                }
                Fetch.continueRequest({requestId});
            });
            Fetch.enable({
                patterns: [{requestStage:'Response'}]
            });
            
            // 等待视频列表加载
        } catch (error) {
            console.error('获取视频信息失败:', error);
            throw error;
        }
    }

    parseProtobufMessage(buffer) {
        try {
            // 1. 创建Response对象并解析二进制数据
            const response = proto.Response.deserializeBinary(buffer);
            
            // 2. 转换为普通JavaScript对象
            const messageObj = response.toObject();
            
            // 3. 提取关键信息
            const result = {
                code: messageObj.code,
                statusCode: messageObj.statusCode,
                message: messageObj.message,
                container: messageObj.container,
                serverTime: messageObj.serverTime,
                clientTime: messageObj.clientTime,
                userId: messageObj.userId
            };

            // 4. 如果有消息容器，解析具体消息内容
            if (messageObj.container && messageObj.container.messagesMap) {
                const messages = [];
                messageObj.container.messagesMap.forEach((msgData) => {
                    if (msgData.message && msgData.message.content) {
                        const content = msgData.message.content;
                        messages.push({
                            conversationId: content.conversationId,
                            messageType: content.messageType,
                            content: content.content,
                            senderId: content.senderId,
                            createTime: content.createTime,
                            extInfo: content.extInfoList
                        });
                    }
                });
                result.messages = messages;
            }

            return result;
        } catch (error) {
            console.error('解析protobuf消息失败:', error);
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
                if (request.url.includes('https://imapi.douyin.com/v1/stranger/get_conversation_list')) {
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
                            const parsedMessage = this.parseProtobufMessage(decodedBuffer);
                            console.log('解析后的消息:', parsedMessage);
                            
                            // 处理具体的消息内容
                            if (parsedMessage.messages) {
                                parsedMessage.messages.forEach(msg => {
                                    console.log('消息内容:', {
                                        发送者: msg.senderId,
                                        会话ID: msg.conversationId,
                                        消息类型: msg.messageType,
                                        内容: msg.content,
                                        发送时间: new Date(msg.createTime).toLocaleString()
                                    });
                                });
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
            
            return;
            // 使用JavaScript执行点击事件
            const MessageBoxSelector = '/html/body/div[2]/div[1]/div[4]/div[1]/div[1]/header/div/div/div[2]/div/pace-island/div/ul[2]/div/li/div/div/div[1]/p';
            const StrangerChatSelector = '/html/body/div[2]/div[1]/div[4]/div[1]/div[1]/header/div/div/div[2]/div/pace-island/div/ul[2]/div/li/div/div/div[3]/div/div/div[1]/div/div[2]/div[1]/div[2]/div/div/div[2]/div[1]/div';
            const FirstStrangerChatSelector = '/html/body/div[2]/div[1]/div[4]/div[1]/div[1]/header/div/div/div[2]/div/pace-island/div/ul[2]/div/li/div/div/div[3]/div/div/div[1]/div/div[2]/div[1]/div/div/div/div[2]/div[1]';
            const replaySelector = '/html/body/div[2]/div[1]/div[4]/div[1]/div[1]/header/div/div/div[2]/div/pace-island/div/ul[2]/div/li/div/div/div[3]/div/div/div[2]/div/div[3]/div/div/div[1]/div[1]/div/div/div[2]/div/div/div/div';

            await this.driver.findElement(By.xpath(MessageBoxSelector)).click();
            await this.driver.sleep(2000); // 等待2秒
            await this.driver.findElement(By.xpath(StrangerChatSelector)).click();
            await this.driver.sleep(2000); // 等待2秒 
            await this.driver.findElement(By.xpath(FirstStrangerChatSelector)).click();
            await this.driver.sleep(2000); // 等待2秒 
            await this.driver.findElement(By.xpath(replaySelector)).click();
            await this.driver.sleep(2000); // 等待2秒
            // 使用 Actions 模拟键盘输入消息
            // 获取指定路径的HTML内容
            const actions = this.driver.actions();
            await actions.sendKeys(message).perform();
            await this.driver.sleep(1000); // 等待输入完成
            
            // 模拟按下回车键发送消息
            //await actions.sendKeys(Key.RETURN).perform();
            //await this.driver.sleep(2000); // 等待消息发送完成
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