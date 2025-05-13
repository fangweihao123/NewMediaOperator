<template>
  <div class="auth-success">
    <el-result
      icon="success"
      title="授权成功"
      sub-title="您的抖音账号已成功绑定"
    >
      <template #extra>
        <el-button type="primary" @click="saveCodeAndState">存储授权信息</el-button>
        <el-button type="primary" @click="goToHome">返回首页</el-button>
      </template>
    </el-result>
  </div>
</template>

<script>
import api from '../api/config'

export default {
  name: 'AuthSuccess',
  data() {
    return {
      code: '',
      state: ''
    }
  },
  methods: {
    goToHome() {
      this.$router.push('/')
    },
    async saveCodeAndState() {
      const response = await api.post('/auth/callback', {
        code: this.code,
        state: this.state
      })
      console.log('response', response)
    }
  },
  created() {
    // 获取 URL 中的 sec_uid 参数
    const sec_uid = this.$route.query.sec_uid
    // 给后端传去code信息
    this.code = this.$route.query.code
    this.state = this.$route.query.state
    if (this.code && this.state) {
      console.log('code:', this.code)
      console.log('state:', this.state)
    }
  }
}
</script>

<style scoped>
.auth-success {
  max-width: 600px;
  margin: 100px auto;
}
</style> 