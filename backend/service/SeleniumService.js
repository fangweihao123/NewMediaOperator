const { By, until} = require('selenium-webdriver');
const { Key } = require('selenium-webdriver');

class SeleniumService {
    constructor(adsPowerService) {
        this.videoInfoRefreshHandler = null;
        this.adsPowerService = adsPowerService;
        this.replayMessage = '按这个填写\n姓名：\n 联系方式：  \n一句话简单说下你的行业（项目简介）： \n要多少资金： \n用途是什么：\n（请您按要求留下资料，符合条件的优先联系）\n'
    }

    // 获取回复信息
    getReplyMessage() {
        return this.replayMessage;
    }

    // 设置回复信息
    setReplyMessage(message) {
        this.replayMessage = message;
        console.log('回复信息已更新为:', message);
    }

    // 获取视频信息
    async fetchVideoInfoTimer(taskManager) {
        try {
            //这个需要不断加入到TaskManager
            this.videoInfoRefreshHandler = setInterval(async () => {
                taskManager.addTask(async () => {
                    if (this.adsPowerService.driver) {
                        // 首先检查登录状态
                        const isLoggedIn = await this.checkLoginStatus();
                        if (!isLoggedIn) {
                            console.log('检测到未登录状态，等待用户扫码登录...');
                            await this.waitForLogin();
                        }
                        
                        await this.adsPowerService.driver.get('https://creator.douyin.com/creator-micro/content/manage?enter_from=publish');
                    }
                    console.log('Successfully fetched video info');
                    await new Promise(resolve => setTimeout(resolve, 30000));
                    await this.adsPowerService.driver.get('https://www.douyin.com/user/self?from_tab_name=main');
                    // Find and click the element using the specified xpath
                    const element = await this.adsPowerService.driver.wait(
                        until.elementLocated(By.xpath('/html/body/div[2]/div[1]/div[4]/div[1]/div[1]/header/div/div/div[2]/div/pace-island/div/ul[2]/div/li/div/div/div[1]/p')),
                        10000
                    );
                    await element.click();
                    //点击私信箱之后 需要回复每一个人的私信
                    await new Promise(resolve => setTimeout(resolve, 60000));
                    // 获取所有消息元素
                    const messageElements = await this.adsPowerService.driver.findElements(
                        By.xpath('/html/body/div[2]/div[1]/div[4]/div[1]/div[1]/header/div/div/div[2]/div/pace-island/div/ul[2]/div/li/div/div/div[3]/div/div/div[1]/div/div[2]/div[1]/div')
                    );
                    console.log(`私信箱找到 ${messageElements.length} 条消息`);
                    // 遍历所有消息元素
                    for (const messageElement of messageElements) {
                        try {
                            // 获取消息内容
                            const nickname = await messageElement.getText();
                            if(nickname.includes('陌生人消息')){
                                await messageElement.click();
                                // 等待输入框加载
                                await new Promise(resolve => setTimeout(resolve, 5000));
                                const strangerElements = await this.adsPowerService.driver.findElements(
                                    By.xpath('/html/body/div[2]/div[1]/div[4]/div[1]/div[1]/header/div/div/div[2]/div/pace-island/div/ul[2]/div/li/div/div/div[3]/div/div/div[1]/div/div[2]/div[1]/div')
                                );
                                // 遍历所有消息元素
                                for (const strangerElement of strangerElements) {
                                    await strangerElement.click();
                                    await new Promise(resolve => setTimeout(resolve, 5000));

                                    const inputBox = await this.adsPowerService.driver.wait(
                                        until.elementLocated(By.xpath('/html/body/div[2]/div[1]/div[4]/div[1]/div[1]/header/div/div/div[2]/div/pace-island/div/ul[2]/div/li/div/div/div[3]/div/div/div[2]/div/div[3]/div/div/div[1]/div[1]/div/div/div[2]/div/div/div/div')),
                                        10000
                                    );
                                    
                                    // 输入消息内容
                                    const messageLines = this.replayMessage.split('\n');
                                    for (const line of messageLines) {
                                        await inputBox.sendKeys(line);
                                        await inputBox.sendKeys(Key.CONTROL, Key.RETURN);
                                        await new Promise(resolve => setTimeout(resolve, 100));
                                    }
                                    
                                    // 等待一下确保消息输入完成
                                    await new Promise(resolve => setTimeout(resolve, 5000));
                                    
                                    // 模拟按下回车键发送消息
                                    await inputBox.sendKeys(Key.RETURN);
                                    
                                    // 等待消息发送完成
                                    await new Promise(resolve => setTimeout(resolve, 5000));
                                }
                                break;
                            }
                        }catch(error){
                            console.error('获取消息内容失败:', error);
                        }
                    }
                });
            }, 600000); // Fetch every 120 seconds

        } catch (error) {
            console.error('获取视频信息失败:', error);
            throw error;
        }
    }

    // 检查登录状态
    async checkLoginStatus() {
        try {
            if (!this.adsPowerService.driver) {
                return false;
            }

            // 访问抖音个人页面
            await this.adsPowerService.driver.get('https://www.douyin.com/user/self?from_tab_name=main');
            await new Promise(resolve => setTimeout(resolve, 3000));

            // 检查是否存在登录相关的元素
            const loginElements = await this.adsPowerService.driver.findElements(By.xpath("//*[contains(text(), '登录') or contains(text(), '扫码登录')]"));
            const userInfoElements = await this.adsPowerService.driver.findElements(By.xpath("//*[contains(@class, 'user-info') or contains(@class, 'avatar')]"));

            // 如果找到登录元素且没有用户信息元素，说明未登录
            if (loginElements.length > 0 && userInfoElements.length === 0) {
                return false;
            }

            // 检查URL是否包含登录相关参数
            const currentUrl = await this.adsPowerService.driver.getCurrentUrl();
            if (currentUrl.includes('login') || currentUrl.includes('auth')) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('检查登录状态失败:', error);
            return false;
        }
    }

    // 等待用户登录
    async waitForLogin() {
        try {
            console.log('等待用户扫码登录...');
            
            // 访问登录页面
            await this.adsPowerService.driver.get('https://www.douyin.com/');
            await new Promise(resolve => setTimeout(resolve, 3000));

            // 等待登录完成，最多等待5分钟
            const maxWaitTime = 5 * 60 * 1000; // 5分钟
            const checkInterval = 10000; // 每10秒检查一次
            let elapsedTime = 0;

            while (elapsedTime < maxWaitTime) {
                const isLoggedIn = await this.checkLoginStatus();
                if (isLoggedIn) {
                    console.log('用户登录成功！');
                    return true;
                }

                await new Promise(resolve => setTimeout(resolve, checkInterval));
                elapsedTime += checkInterval;
                console.log(`等待登录中... (${Math.floor(elapsedTime / 1000)}秒)`);
            }

            console.log('等待登录超时，请手动登录');
            return false;
        } catch (error) {
            console.error('等待登录失败:', error);
            return false;
        }
    }

    async uploadVideo(title, description, filepath) {
        try {
            if(this.adsPowerService.driver){
                await this.adsPowerService.driver.get('https://creator.douyin.com/creator-micro/content/upload');
                // Wait for 2 seconds
                await new Promise(resolve => setTimeout(resolve, 3000));
                //await this.adsPowerService.driver.wait(until.urlIs('https://creator.douyin.com/creator-micro/content/upload'));
                const fileInput = await this.adsPowerService.driver.findElement(By.css("div[class^='container'] input"));
                await fileInput.sendKeys(filepath);
                
                await new Promise(resolve => setTimeout(resolve, 3000));
                // Wait for title input to be visible and interactable
                const titleInput = await this.adsPowerService.driver.wait(
                    until.elementLocated(By.xpath("//*[@id='DCPF']/div[1]/div[1]/div[1]/div[1]/div[2]/div[1]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/input[1]")),
                    10000
                );
                await titleInput.clear();
                await titleInput.sendKeys(title);
                const descriptionInput = await this.adsPowerService.driver.wait(
                    until.elementLocated(By.xpath("//*[@id='DCPF']/DIV[1]/DIV[1]/DIV[1]/DIV[1]/DIV[2]/DIV[1]/DIV[1]/DIV[2]/DIV[1]/DIV[1]/DIV[1]/DIV[1]/DIV[2]/DIV[1]")),
                    10000
                );
                await descriptionInput.clear();
                await descriptionInput.sendKeys(description);
                await new Promise(resolve => setTimeout(resolve, 30000));
                // Click the publish button
                const publishButton = await this.adsPowerService.driver.wait(
                    until.elementLocated(By.xpath("/html/body/div[1]/div[1]/div/div[2]/div/div/div/div[2]/div/div/div/div/div[1]/div/div[5]/div/div/div/div/div/span/button")),
                    30000
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
            if (this.adsPowerService.driver) {
                await this.adsPowerService.driver.get('https://creator.douyin.com/creator-micro/content/manage?enter_from=publish');
                // Wait for page to load
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Find all video cards
                const videoCards = await this.adsPowerService.driver.findElements(By.xpath("/html/body/div[1]/div[1]/div/div[2]/div/div/div/div[2]/div/div/div/div[2]/div[2]/div[1]/div"));

                // Loop through cards to find matching title
                for (const card of videoCards) {
                    const titleElement = await card.findElement(By.xpath("DIV[1]/DIV[2]/DIV[1]/DIV[1]/DIV[1]"));
                    const cardTitle = await titleElement.getText();
                    
                    if (cardTitle === title) {
                        // Find and click delete button within this card
                        const deleteButton = await card.findElement(By.xpath("DIV[1]/DIV[2]/DIV[1]/DIV[1]/DIV[2]/DIV[1]/DIV[4]/SPAN[1]"));
                        await deleteButton.click();
                        const deleteConfirmButton = await this.adsPowerService.driver.wait(
                            until.elementLocated(By.xpath("//*[@id='dialog-0']/DIV[1]/DIV[1]/DIV[1]/DIV[3]/BUTTON[2]")),
                            10000
                        );
                        await deleteConfirmButton.click();
                    }
                }
            }
        } catch (error) {
            console.error('删除视频失败:', error);
            throw error;
        }
    }

    async commentVideo(title, description, comment_content){
        try{
            if(this.adsPowerService.driver){
                await this.adsPowerService.driver.get('https://www.douyin.com/user/self?from_tab_name=main');
                // Wait for page to load
                await new Promise(resolve => setTimeout(resolve, 3000));
                const videoElements = await this.adsPowerService.driver.findElements(
                    By.xpath('/html/body/div[2]/div[1]/div[4]/div[2]/div/div/div/div[3]/div/div/div[2]/div/div[2]/ul/li')
                );
                console.log('找到视频作品数量', videoElements.length);
                // 遍历所有消息元素
                /*for (const videoElement of videoElements) {
                    // 获取消息内容
                    const videoname = await videoElement.getText();
                    if(videoname.includes(title) && videoname.includes(description)){
                        await videoElement.click();
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        const xpath = '/html/body/div[2]/div[1]/div[4]/div[4]/div/div[3]/div[1]/div[1]/div/div[*]/div/div[1]/div/div/div[1]/div/div[3]/div[1]/div[2]';
                        const elements = await this.adsPowerService.driver.findElements(By.xpath(xpath));
                        //定位到评论区
                        for (const element of elements) {
                            await element.click();
                            await new Promise(resolve => setTimeout(resolve, 3000));
                        }
                        const commentInput = await this.adsPowerService.driver.wait(
                            until.elementLocated(By.xpath('/html/body/div[2]/div[1]/div[4]/div[4]/div/div[3]/div[1]/div[1]/div/div[1]/div/div[2]/div/div/div[3]/div/div/div[4]/div[2]/div/div[1]/span')),
                            10000
                        );
                        await commentInput.click();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        const actualCommentInput = await this.adsPowerService.driver.wait(
                            until.elementLocated(By.xpath('/html/body/div[2]/div[1]/div[4]/div[4]/div/div[3]/div[1]/div[1]/div/div[1]/div/div[2]/div/div/div[3]/div/div/div[4]/div[2]/div/div[1]/div/div/div[2]/div/div/div/div')),
                            10000
                        );
                        
                        await actualCommentInput.sendKeys(comment_content);
                        // 模拟按下回车键发送消息
                        await actualCommentInput.sendKeys(Key.RETURN);
                        
                        // 等待消息发送完成
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        break;
                    }
                }*/
            }
        }catch(error){
            console.error('评论视频失败:', error);
            throw error;
        }
    }

    /**
     * 发送私信消息
     * @param {string} conversationId - 对话ID（用户名称）
     * @param {string} messageContent - 消息内容
     * @returns {Promise<Object>} - 返回发送结果
     */
    async sendDirectMessage(conversationId, messageContent) {
        try {
            console.log(`开始发送私信给: ${conversationId}`);
            console.log(`消息内容: ${messageContent}`);
            if (!this.adsPowerService.driver) {
                throw new Error('Selenium driver未初始化');
            }
            await this.adsPowerService.driver.get('https://www.douyin.com/user/self?from_tab_name=main');
            // Find and click the element using the specified xpath
            const element = await this.adsPowerService.driver.wait(
                until.elementLocated(By.xpath('/html/body/div[2]/div[1]/div[4]/div[1]/div[1]/header/div/div/div[2]/div/pace-island/div/ul[2]/div/li/div/div/div[1]/p')),
                10000
            );
            await element.click();
            // 等待消息列表加载
            await new Promise(resolve => setTimeout(resolve, 2000));
            // 获取所有消息元素
            const messageElements = await this.adsPowerService.driver.findElements(
                By.xpath('/html/body/div[2]/div[1]/div[4]/div[1]/div[1]/header/div/div/div[2]/div/pace-island/div/ul[2]/div/li/div/div/div[3]/div/div/div[1]/div/div[2]/div[1]/div')
            );
            console.log(`找到 ${messageElements.length} 条消息`);
            // 遍历所有消息元素
            for (const messageElement of messageElements) {
                try {
                    // 获取消息内容
                    const nickname = await messageElement.getText();
                    if(nickname.includes(conversationId)){
                        console.log('找到用户:', conversationId);
                        await messageElement.click();
                        // 等待输入框加载
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        // 定位并点击输入框
                        const inputBox = await this.adsPowerService.driver.wait(
                            until.elementLocated(By.xpath('/html/body/div[2]/div[1]/div[4]/div[1]/div[1]/header/div/div/div[2]/div/pace-island/div/ul[2]/div/li/div/div/div[3]/div/div/div[2]/div/div[3]/div/div[2]/div[1]/div[1]/div/div/div[2]/div/div/div/div')),
                            10000
                        );
                        
                        // 输入消息内容
                        await inputBox.sendKeys(messageContent);
                        
                        // 等待一下确保消息输入完成
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        
                        // 模拟按下回车键发送消息
                        await inputBox.sendKeys(Key.RETURN);
                        
                        // 等待消息发送完成
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        break;
                    }
                } catch (err) {
                    console.error('获取消息内容失败:', err.message);
                }
            }
        } catch (error) {
            console.error('发送私信失败:', error);
        }
    }
}
module.exports = SeleniumService; 