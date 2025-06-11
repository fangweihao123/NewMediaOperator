const { Builder, By, ServiceBuilder, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const CDP = require('chrome-remote-interface');

class SeleniumService {
    constructor(adsPowerService) {
        this.videoInfoRefreshHandler = null;
        this.adsPowerService = adsPowerService;
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
    async fetchVideoInfoTimer(taskManager) {
        try {
            //这个需要不断加入到TaskManager
            this.videoInfoRefreshHandler = setInterval(async () => {
                taskManager.addTask(async () => {
                    if (this.adsPowerService.driver) {
                        await this.adsPowerService.driver.get('https://creator.douyin.com/creator-micro/content/manage?enter_from=publish');
                    }
                    console.log('Successfully fetched video info');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    await this.adsPowerService.driver.get('https://www.douyin.com/user/self?from_tab_name=main');
                    // Find and click the element using the specified xpath
                    const element = await this.adsPowerService.driver.wait(
                        until.elementLocated(By.xpath('/html/body/div[2]/div[1]/div[4]/div[1]/div[1]/header/div/div/div[2]/div/pace-island/div/ul[2]/div/li/div/div/div[1]/p')),
                        10000
                    );
                    await element.click();
                });
            }, 60000); // Fetch every 60 seconds

        } catch (error) {
            console.error('获取视频信息失败:', error);
            throw error;
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
            if (this.adsPowerService.driver) {
                await this.adsPowerService.driver.get('https://creator.douyin.com/creator-micro/content/manage?enter_from=publish');
                // Wait for page to load
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Find all video cards
                const videoCards = await this.adsPowerService.driver.findElements(By.xpath("//*[@id='root']/DIV[1]/DIV[1]/DIV[2]/DIV[2]/DIV[1]/DIV"));

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

            // 等待页面加载完成
            await this.adsPowerService.driver.wait(
                until.elementLocated(By.id('island_b69f5')), 
                10000
            );

            // 获取所有对话项的基础xpath
            const conversationListXpath = '//div[@id="island_b69f5"]/div[1]/ul[2]/div[1]/li';
            
            // 查找所有对话项
            const conversationElements = await this.adsPowerService.driver.findElements(
                By.xpath(conversationListXpath)
            );

            console.log(`找到 ${conversationElements.length} 个对话项`);

            let targetConversationIndex = -1;
            let matchedUserName = '';

            // 遍历所有对话项，查找匹配的用户名
            for (let i = 0; i < conversationElements.length; i++) {
                try {
                    // 构建当前对话项的用户名xpath
                    const userNameXpath = `${conversationListXpath}[${i + 1}]/div[1]/div[1]/div[3]/div[1]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[1]/span[1]`;
                    
                    const userNameElement = await this.adsPowerService.driver.findElement(
                        By.xpath(userNameXpath)
                    );
                    
                    const userName = await userNameElement.getText();
                    console.log(`检查用户名: ${userName}`);

                    // 检查是否匹配conversationId (支持部分匹配)
                    if (userName && (userName.includes(conversationId) || conversationId.includes(userName))) {
                        targetConversationIndex = i + 1; // xpath是从1开始计数
                        matchedUserName = userName;
                        console.log(`找到匹配用户: ${userName} (索引: ${targetConversationIndex})`);
                        break;
                    }
                } catch (err) {
                    console.log(`获取第${i + 1}个对话项用户名失败:`, err.message);
                }
            }

            if (targetConversationIndex === -1) {
                throw new Error(`未找到匹配的用户: ${conversationId}`);
            }

            // 构建对应的输入框xpath
            const inputXpath = `//div[@id="island_b69f5"]/div[1]/ul[2]/div[1]/li[${targetConversationIndex}]/div[1]/div[1]/div[3]/div[1]/div[1]/div[2]/div[1]/div[3]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]`;

            // 尝试多个可能的输入框xpath模式
            const inputXpaths = [
                inputXpath,
                `//div[@id="island_b69f5"]/div[1]/ul[2]/div[1]/li[${targetConversationIndex}]//input`,
                `//div[@id="island_b69f5"]/div[1]/ul[2]/div[1]/li[${targetConversationIndex}]//textarea`,
                `//div[@id="island_b69f5"]/div[1]/ul[2]/div[1]/li[${targetConversationIndex}]//div[contains(@contenteditable, "true")]`,
                `//div[@id="island_b69f5"]/div[1]/ul[2]/div[1]/li[${targetConversationIndex}]//div[@role="textbox"]`
            ];

            let inputElement = null;

            // 尝试找到输入框
            for (const xpath of inputXpaths) {
                try {
                    inputElement = await this.adsPowerService.driver.findElement(By.xpath(xpath));
                    if (inputElement) {
                        console.log(`找到输入框，使用xpath: ${xpath}`);
                        break;
                    }
                } catch (err) {
                    console.log(`尝试输入框xpath失败: ${xpath}`);
                }
            }

            if (!inputElement) {
                throw new Error('未找到输入框元素');
            }

            // 滚动到输入框位置
            await this.adsPowerService.driver.executeScript(
                "arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", 
                inputElement
            );

            // 等待一下确保滚动完成
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 点击输入框以确保焦点
            await inputElement.click();

            // 清空并输入消息内容
            await inputElement.clear();
            await inputElement.sendKeys(messageContent);

            console.log(`消息已输入到输入框`);

            // 等待一下确保输入完成
            await new Promise(resolve => setTimeout(resolve, 500));

            // 构建发送按钮xpath
            const sendButtonXpath = `//div[@id="island_b69f5"]/div[1]/ul[2]/div[1]/li[${targetConversationIndex}]/div[1]/div[1]/div[3]/div[1]/div[1]/div[2]/div[1]/div[3]/div[1]/div[2]/div[1]/div[2]/div[1]/span[3]/svg[1]/path[1]`;

            // 尝试多个可能的发送按钮xpath
            const sendButtonXpaths = [
                sendButtonXpath,
                `//div[@id="island_b69f5"]/div[1]/ul[2]/div[1]/li[${targetConversationIndex}]//span[3]/svg[1]`,
                `//div[@id="island_b69f5"]/div[1]/ul[2]/div[1]/li[${targetConversationIndex}]//span[3]`,
                `//div[@id="island_b69f5"]/div[1]/ul[2]/div[1]/li[${targetConversationIndex}]//button[contains(@aria-label, "发送")]`,
                `//div[@id="island_b69f5"]/div[1]/ul[2]/div[1]/li[${targetConversationIndex}]//svg`,
                `//div[@id="island_b69f5"]/div[1]/ul[2]/div[1]/li[${targetConversationIndex}]//path[contains(@d, "M")]`
            ];

            let sendButton = null;

            // 尝试找到发送按钮
            for (const xpath of sendButtonXpaths) {
                try {
                    sendButton = await this.adsPowerService.driver.findElement(By.xpath(xpath));
                    if (sendButton) {
                        console.log(`找到发送按钮，使用xpath: ${xpath}`);
                        break;
                    }
                } catch (err) {
                    console.log(`尝试发送按钮xpath失败: ${xpath}`);
                }
            }

            if (!sendButton) {
                throw new Error('未找到发送按钮');
            }

            // 滚动到发送按钮位置
            await this.adsPowerService.driver.executeScript(
                "arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", 
                sendButton
            );

            // 等待一下确保滚动完成
            await new Promise(resolve => setTimeout(resolve, 500));

            // 点击发送按钮
            await sendButton.click();

            console.log(`消息发送成功给用户: ${matchedUserName}`);

            // 等待发送完成
            await new Promise(resolve => setTimeout(resolve, 2000));

            return {
                success: true,
                message: '消息发送成功',
                targetUser: matchedUserName,
                messageContent: messageContent,
                conversationIndex: targetConversationIndex,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('发送私信失败:', error);
            return {
                success: false,
                error: error.message,
                messageContent: messageContent,
                conversationId: conversationId,
                timestamp: new Date().toISOString()
            };
        }
    }
}
module.exports = SeleniumService; 