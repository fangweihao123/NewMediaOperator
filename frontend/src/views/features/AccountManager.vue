 <template>
    <div class="account-manager">
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
         </div>
        </el-card>
    </div>
 </template>

<script>
import api from '../../api/config'

export default {
  name: 'AccountManager',
  data() {
    return {
      isBound: false,
      accountInfo: {},
      checkInterval: null,
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
.empty-tip {
  text-align: center;
  padding: 20px;
  color: #909399;
}
</style> 