const { Builder, By, ServiceBuilder, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const CDP = require('chrome-remote-interface');

class SeleniumService {
    constructor(videoListInfo, ConversationInfo, protoParseService, adsPowerService) {
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
    async fetchVideoInfoTimer() {
        try {
            this.videoInfoRefreshHandler = setInterval(async () => {
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
            }, 20000); // Fetch every 60 seconds

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
}
module.exports = SeleniumService; 