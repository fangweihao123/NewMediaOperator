<template>
  <div class="home">
    <el-row :gutter="20">
      <!-- 账号绑定部分 -->
      <el-col :span="12">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>账号绑定</span>
            </div>
          </template>
          <div class="qrcode-container" v-if="!isBound">
            <img :src="'data:image/png;base64,' + qrcode" v-if="qrcode" />
            <p>请使用抖音APP扫描二维码绑定账号</p>
            <el-button type="primary" @click="RedirectTODouyinAuthPage">
              跳转到抖音登录页面
            </el-button>
            <el-button type="primary" @click="connectToAdsPower">
              打开AdsPower页面
            </el-button>
            <el-button type="primary" @click="getVideosFromAdsPower">
              获取视频列表
            </el-button>
            
          </div>
        </el-card>
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>私信功能</span>
            </div>
          </template> 
          <el-input
              v-model="replyMessage"
              type="textarea"
              :rows="2"
              placeholder="请输入要回复的消息内容"
              style="margin-bottom: 10px;"
            ></el-input>
              <el-button type="primary" @click="replayStrangerMessages">
                回复陌生人消息  
              </el-button>
              <el-button type="primary" @click="getStrangerMessages">
                获取私信列表  
              </el-button>
        </el-card>
      </el-col>

      <!-- 视频列表部分 -->
      <el-col :span="12">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>视频列表</span>
            </div>
          </template>
          <div v-if="videos.length > 0">
            <el-table :data="videos" style="width: 100%">
              <el-table-column prop="desc" label="描述" />
              <el-table-column label="封面">
                <template #default="scope">
                  <a :href="scope.row.cover_url" target="_blank">
                    <el-image 
                      style="width: 100px; height: 100px"
                      :src="scope.row.cover_url"
                      :preview-src-list="[scope.row.cover_url]">
                    </el-image>
                  </a>
                </template>
              </el-table-column>
              <el-table-column label="操作">
                <template #default="scope">
                  <a :href="scope.row.video_url" target="_blank">
                    <el-button 
                      size="small" 
                      type="primary">
                      查看视频
                    </el-button>
                  </a>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-else class="empty-tip">
            <p>暂无视频数据</p>
          </div>  
        </el-card>
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>私信列表</span>
            </div>
          </template> 
            <div v-if="messages.length > 0">
              <el-table :data="messages" style="width: 100%">
              <el-table-column prop="text" label="信息" />
              
              </el-table>
            </div>
            <div v-else class="empty-tip">
              <p>暂无私信数据</p>
            </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import api from '../api/config'

export default {
  name: 'Home',
  data() {
    return {
      qrcode: '',
      qrId: '',
      isBound: false,
      accountInfo: {},
      videos: [],
      checkInterval: null,
      replyMessage: '',
      messages: []
    }
  },
  methods: {
    async RedirectTODouyinAuthPage() {
      try {
        const response = await api.get('/auth')
        window.location.href = response.data.authUrl;
      } catch (error) {
        this.$message.error('跳转失败', error);
      }
    },
    async connectToAdsPower() {
      try {
        const response = await api.post('/selenium/connect', {
          profileId: this.accountInfo.nickname
        });
        this.$message.success('连接成功');
      } catch (error) {
        this.$message.error('连接失败: ' + error.message);
      }
    },
    async getVideosFromAdsPower() {
      try {
        const response = await api.get('/selenium/videos');
        this.videos = response.data.videos;
        this.$message.success('获取视频信息成功');
      } catch (error) {
        this.$message.error('获取视频信息失败: ' + error.message);
      }
    },
    async getStrangerMessages() {
      try {
        const response = await api.get('/selenium/messages');
        this.messages = response.data.messages;
      }catch(error){
        this.$message.error('获取私信信息失败: ' + error.message);
      }
    },
    async replayStrangerMessages() {
      try {
        const response = await api.post('/selenium/replymessages',{
          msg: this.replyMessage
        });
        this.$message.success('获取消息成功');
      } catch (error) {
        this.$message.error('获取消息失败: ' + error.message);
      }
    },
    async closeAdsPower() {
      try {
        await api.post('/selenium/close');
        this.$message.success('浏览器已关闭');
      } catch (error) {
        this.$message.error('关闭浏览器失败: ' + error.message);
      }
    }
  },
  beforeUnmount() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
  }
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.qrcode-container {
  text-align: center;
  padding: 20px;
}

.qrcode-container img {
  max-width: 200px;
  margin-bottom: 20px;
}

.account-info {
  text-align: center;
  padding: 20px;
}

.account-info h3 {
  margin: 10px 0;
}

.empty-tip {
  text-align: center;
  padding: 20px;
  color: #909399;
}
</style> 