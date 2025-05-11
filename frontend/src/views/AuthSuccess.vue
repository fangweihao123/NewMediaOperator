<template>
  <div class="auth-success">
    <el-result
      icon="success"
      title="授权成功"
      sub-title="您的抖音账号已成功绑定"
    >
      <template #extra>
        <el-button type="primary" @click="goToHome">返回首页</el-button>
      </template>
    </el-result>
  </div>
</template>

<script>
export default {
  name: 'AuthSuccess',
  methods: {
    goToHome() {
      this.$router.push('/')
    }
  },
  created() {
    // 获取 URL 中的 sec_uid 参数
    const sec_uid = this.$route.query.sec_uid
    if (sec_uid) {
      // 触发父组件更新账号信息
      this.$emit('auth-success', sec_uid)
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