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
            <el-button type="primary" @click="generateQRCode" v-if="!qrcode">
              生成二维码
            </el-button>
          </div>
          <div v-else class="account-info">
            <el-avatar :size="64" :src="accountInfo.avatar"></el-avatar>
            <h3>{{ accountInfo.nickname }}</h3>
            <p>{{ accountInfo.signature }}</p>
            <el-button type="primary" @click="updateVideos">
              更新视频列表
            </el-button>
          </div>
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
                  <el-image 
                    style="width: 100px; height: 100px"
                    :src="scope.row.cover_url"
                    :preview-src-list="[scope.row.cover_url]">
                  </el-image>
                </template>
              </el-table-column>
              <el-table-column label="操作">
                <template #default="scope">
                  <el-button 
                    size="small" 
                    type="primary"
                    @click="openVideo(scope.row.video_url)">
                    查看视频
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-else class="empty-tip">
            <p>暂无视频数据</p>
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
      checkInterval: null
    }
  },
  methods: {
    async generateQRCode() {
      try {
        const response = await api.get('/qrcode')
        this.qrcode = response.data.qrcode
        this.qrId = response.data.qr_id
        this.startCheckingQRCode()
      } catch (error) {
        this.$message.error('生成二维码失败')
      }
    },
    startCheckingQRCode() {
      this.checkInterval = setInterval(async () => {
        try {
          const response = await api.get(`/qrcode/status/${this.qrId}`)
          if (response.data.status === 'success') {
            clearInterval(this.checkInterval)
            this.isBound = true
            this.getAccountInfo(response.data.sec_uid)
          }
        } catch (error) {
          console.error('检查二维码状态失败', error)
        }
      }, 2000)
    },
    async getAccountInfo(sec_uid) {
      try {
        const response = await api.get(`/account/${sec_uid}`)
        this.accountInfo = response.data
        this.getVideos(sec_uid)
      } catch (error) {
        this.$message.error('获取账号信息失败')
      }
    },
    async getVideos(sec_uid) {
      try {
        const response = await api.get(`/videos/${sec_uid}`)
        this.videos = response.data
      } catch (error) {
        this.$message.error('获取视频列表失败')
      }
    },
    async updateVideos() {
      try {
        const response = await api.post(`/videos/update/${this.accountInfo.sec_uid}`)
        this.$message.success('更新成功')
        this.getVideos(this.accountInfo.sec_uid)
      } catch (error) {
        this.$message.error('更新视频列表失败')
      }
    },
    openVideo(url) {
      window.open(url, '_blank')
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