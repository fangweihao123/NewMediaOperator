<template>
  <div id="app">
    <el-container>
      <el-header>
        <h1>抖音运营助手</h1>
        <el-dropdown v-if="isBound" trigger="click">
          <div class="account-dropdown">
            <el-avatar :size="32" :src="accountInfo.avatar"></el-avatar>
            <span class="nickname">{{ accountInfo.nickname }}</span>
            <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="account in accountList" 
                              :key="account.open_id"
                              @click="switchAccount(account)">
                <div class="account-item">
                  <el-avatar :size="24" :src="account.avatar"></el-avatar>
                  <span>{{ account.nickname }}</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item divided>
                <div class="add-account" @click="RedirectTODouyinAuthPage">
                  <el-icon><Plus /></el-icon>
                  <span>添加新账号</span>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { ArrowDown, Plus } from '@element-plus/icons-vue'
import api from './api/config'

export default {
  name: 'App',
  components: {
    ArrowDown,
    Plus
  },
  data() {
    return {
      isBound: false,
      accountInfo: {},
      accountList: []
    }
  },
  methods: {
    async GetAuthUserInfo() {
      try {
        console.log('get user info');
        const response = await api.get('/userinfo');
        if(response.data.length > 0) {
          this.accountList = response.data;
          this.accountInfo = response.data[0];
          this.isBound = true;
          console.log('successfully get user info', this.accountInfo.nickname);
        } else {
          console.log('no user info');
        }
      } catch(error) {
        console.error('Error fetching user info:', error);
      }
    },
    async RedirectTODouyinAuthPage() {
      try {
        const response = await api.get('/auth')
        window.location.href = response.data.authUrl;
      } catch (error) {
        this.$message.error('跳转失败', error);
      }
    },
    switchAccount(account) {
      this.accountInfo = account;
    },
    addNewAccount() {
      this.$router.push('/bind-account');
    }
  },
  created() {
    this.GetAuthUserInfo();
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.el-header {
  background-color: #409EFF;
  color: white;
  line-height: 60px;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h1 {
  margin: 0;
}

.account-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: white;
}

.nickname {
  margin: 0 8px;
}

.account-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.add-account {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409EFF;
  cursor: pointer;
}

.el-dropdown-menu {
  min-width: 200px;
}

.el-main {
  padding: 20px;
}
</style> 