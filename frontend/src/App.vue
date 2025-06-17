<template>
  <div id="app">
    <el-container>
      <el-header>
        <h1>抖音运营助手</h1>
        <el-dropdown v-if="isBound" trigger="click">
          <div class="account-dropdown">
            <span>{{ accountInfo.user_id }} - {{ accountInfo.name }}</span>
            <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="account in accountList" 
                              :key="account.user_id"
                              @click="switchAccount(account)">
                {{ account.user_id }} - {{ account.name }}
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
import {reactive, provide } from 'vue'


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
  setup() {
    const accountState = reactive({
      account_info: {},
      is_loading: false
    })
    provide('accountState', accountState)

    return {
      accountState
    }
  },

  watch:{
    accountInfo: {
      handler(newAccountInfo) {
        console.log("newAccountInfo", newAccountInfo);
        this.accountState.account_info = newAccountInfo;
      }
    }
  },
  
  methods: {
    async getActiveAccount() {
      const response = await api.get('/adsPower/userList');
      this.accountList = response.data.message;
      console.log(this.accountList);
      if(this.accountList.length > 0) {
        this.isBound = true;
        this.accountInfo = this.accountList[0];
        for (const account of this.accountList) {
          try {
            await api.post('/adsPower/connect', {
              profileId: account.user_id
            });
            await new Promise(resolve => setTimeout(resolve, 3000));
          } catch (error) {
            console.error(`Failed to connect account ${account.user_id}:`, error);
          }
        }
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
    this.getActiveAccount();
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