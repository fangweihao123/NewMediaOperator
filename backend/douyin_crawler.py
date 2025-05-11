from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time
import json
import re

class DouyinCrawler:
    def __init__(self):
        self.setup_driver()

    def setup_driver(self):
        chrome_options = Options()
        chrome_options.add_argument('--headless')  # 无头模式
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)

    def get_account_info(self, sec_uid):
        """获取账号信息"""
        url = f"https://www.douyin.com/user/{sec_uid}"
        self.driver.get(url)
        
        # 等待页面加载
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "account-name"))
        )
        
        # 获取账号信息
        nickname = self.driver.find_element(By.CLASS_NAME, "account-name").text
        signature = self.driver.find_element(By.CLASS_NAME, "signature").text
        avatar = self.driver.find_element(By.CLASS_NAME, "avatar").get_attribute("src")
        
        return {
            "sec_uid": sec_uid,
            "nickname": nickname,
            "signature": signature,
            "avatar": avatar
        }

    def get_videos(self, sec_uid, max_count=50):
        """获取视频列表"""
        url = f"https://www.douyin.com/user/{sec_uid}"
        self.driver.get(url)
        
        videos = []
        last_height = self.driver.execute_script("return document.body.scrollHeight")
        
        while len(videos) < max_count:
            # 滚动到底部
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)
            
            # 获取视频列表
            video_elements = self.driver.find_elements(By.CLASS_NAME, "video-card")
            
            for element in video_elements:
                if len(videos) >= max_count:
                    break
                    
                try:
                    video_id = element.get_attribute("data-id")
                    desc = element.find_element(By.CLASS_NAME, "desc").text
                    cover_url = element.find_element(By.TAG_NAME, "img").get_attribute("src")
                    video_url = element.find_element(By.TAG_NAME, "a").get_attribute("href")
                    
                    if video_id not in [v["video_id"] for v in videos]:
                        videos.append({
                            "video_id": video_id,
                            "desc": desc,
                            "cover_url": cover_url,
                            "video_url": video_url
                        })
                except:
                    continue
            
            # 检查是否到达底部
            new_height = self.driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height
        
        return videos

    def close(self):
        """关闭浏览器"""
        self.driver.quit() 