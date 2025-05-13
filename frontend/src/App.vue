<template>
  <div id="app">
    <el-container>
      <el-header>
        <h1>抖音运营助手</h1>
        <div class="account-info" v-if="isBound">
            <div class="account-dropdown">
              <el-avatar :size="32" :src="accountInfo.avatar"></el-avatar>
              <span class="nickname">{{ accountInfo.nickname }}</span>
              <el-icon><arrow-down /></el-icon>
            </div>
        </div>
      </el-header>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script>
export default {
  name: 'App',
  data(){
    return {
      isBound: false,
      accountInfo: {}
    }
  },
  methods:{
    async GetAuthUserInfo(){
      try{
        const response = await axios.get('/api/userinfo');
        this.accountInfo = response.data[0];
        this.isBound = true;
      }catch(error){
        console.error('Error fetching user info:', error);
      }
    },
    created(){
      this.GetAuthUserInfo();
    }
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
  text-align: center;
}

.el-main {
  padding: 20px;
}
</style> 