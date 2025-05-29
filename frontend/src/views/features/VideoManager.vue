<template>
    <div class="video-manager">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>视频列表</span>
              <el-button type="primary" @click="showUploadDialog">
                上传视频
              </el-button>
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

        <!-- 上传视频对话框 -->
        <el-dialog
          v-model="uploadDialogVisible"
          title="上传视频"
          width="500px"
        >
          <el-form :model="uploadForm" label-width="100px">
            <el-form-item label="视频标题">
              <el-input v-model="uploadForm.title" placeholder="请输入视频标题"></el-input>
            </el-form-item>
            <el-form-item label="视频路径">
              <el-input v-model="uploadForm.path" placeholder="请输入视频路径"></el-input>
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="uploadDialogVisible = false">取消</el-button>
              <el-button type="primary" @click="handleUpload">
                上传
              </el-button>
            </span>
          </template>
        </el-dialog>
    </div>
    
</template> 

<script>
import api from '../../api/config'
import { UploadFilled } from '@element-plus/icons-vue'

export default {
  name: 'VideoManager',
  components: {
    UploadFilled
  },
  data() {
    return {
      videos: [],
      checkInterval: null,
      uploadDialogVisible: false,
      uploadForm: {
        title: '',
        path: ''
      }
    }
  },
  methods: {
    async getVideosFromAdsPower() {
      try {
        const response = await api.get('/selenium/videos');
        this.$message.success('获取视频信息成功');
      } catch (error) {
        this.$message.error('获取视频信息失败: ' + error.message);
      }
    },
    showUploadDialog() {
      this.uploadDialogVisible = true;
      this.uploadForm = {
        title: '',
        path: '/Users/leon/Documents/游戏UP主/短视频揭秘第一期/双人成行短视频揭秘.mp4'
      };
    },
    handleFileChange(file) {
      this.uploadForm.path = file.raw.path;
      console.log(file);
    },
    async handleUpload() {
      if (!this.uploadForm.title) {
        this.$message.warning('请输入视频标题');
        return;
      }
      if (!this.uploadForm.path) {
        this.$message.warning('请选择视频文件');
        return;
      }

      try {
        await api.post('/videos/upload', {
          title: this.uploadForm.title,
          video: this.uploadForm.path
        });
        this.uploadDialogVisible = false;
      } catch (error) {
        this.$message.error('视频上传失败: ' + error.message);
      }
    }
  },
  mounted() {
    this.getVideosFromAdsPower();
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
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 