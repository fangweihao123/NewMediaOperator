<template>
    <div class="video-manager">
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
    </div>
    
</template> 

<script>
import api from '../../api/config'

export default {
  name: 'VideoManager',
  data() {
    return {
      videos: [],
      checkInterval: null,
    }
  },
  methods: {
    async getVideosFromAdsPower() {
      try {
        const response = await api.get('/selenium/videos');
        this.videos = response.data.videos;
        this.$message.success('获取视频信息成功');
      } catch (error) {
        this.$message.error('获取视频信息失败: ' + error.message);
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