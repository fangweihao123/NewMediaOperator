<template>
  <div class="home">
    <el-container>
      <el-aside width="200px">
        <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        @select="handleSelect"
        >
          <el-menu-item index="video">
            <span>视频管理</span>
          </el-menu-item>
          <el-menu-item index="message">
            <span>私信管理</span>
          </el-menu-item>
          <el-menu-item index="analysis">
            <span>对话分析</span>
          </el-menu-item>
          <el-menu-item index="account">
            <span>账号管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main>
        <component :is="currentComponent"></component>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import {ArrowDown, Plus, User, VideoCamera, Message} from '@element-plus/icons-vue'
import api from '../api/config'
import AccountManager from './features/AccountManager.vue'
import VideoManager from './features/VideoManager.vue'
import MessageManager from './features/MessageManager.vue'
import AnalysisResults from './features/AnalysisResults.vue'

export default {
  name: 'Home',
  components:{
    User,
    VideoCamera,
    Message,
    AccountManager,
    VideoManager,
    MessageManager,
    AnalysisResults
  },
  data() {
    return {
      activeMenu: 'video',
      currentComponent: 'VideoManager'
    }
  },
  methods: {
    handleSelect(key) {
      this.activeMenu = key;
      switch (key) {
        case 'account':
          this.currentComponent = 'AccountManager';
          break;
        case 'video':
          this.currentComponent = 'VideoManager';
          break;
        case 'message':
          this.currentComponent = 'MessageManager';
          break;
        case 'analysis':
          this.currentComponent = 'AnalysisResults';
          break;
        default:
          this.currentComponent = 'AccountManager';
          break;
      }
    }
  }
}

</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.el-menu-vertical {
  border-right: none;
}
</style> 