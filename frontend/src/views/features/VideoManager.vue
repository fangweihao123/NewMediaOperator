<template>
    <div class="video-manager">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>视频列表</span>
              <el-button type="primary" @click="showGenerateAIVideoDialog">
                生成AI视频
              </el-button>
              <el-button type="primary" @click="showUploadDialog">
                上传视频
              </el-button>
            </div>
          </template>
          <div v-if="videos.length > 0">
            <el-table :data="videos" style="width: 100%">
              <el-table-column prop="title" label="标题" />
              <el-table-column prop="description" label="描述" />
              <el-table-column label="删除">
                <template #default="scope">
                  <el-button 
                    size="small" 
                    type="primary" @click="deleteVideo(scope.row.description)">
                    删除视频
                  </el-button>
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
          width="600px"
        >
          <el-form :model="uploadForm" label-width="100px">
            <el-form-item label="视频标题">
              <el-input v-model="uploadForm.title" placeholder="请输入视频标题"></el-input>
            </el-form-item>
            <el-form-item label="视频描述">
              <el-input v-model="uploadForm.description" placeholder="请输入视频描述"></el-input>
            </el-form-item>
            <el-form-item label="首评内容">
              <el-input v-model="uploadForm.comment_content" placeholder="请输入首评内容"></el-input>
            </el-form-item>
            <el-form-item label="视频路径">
              <el-input 
                v-model="uploadForm.path" 
                placeholder="请输入视频文件完整路径 (例如: E:\Videos\example.mp4)"
                clearable
              >
                <template #suffix>
                  <el-tooltip content="支持格式: mp4, avi, mov, wmv, flv, mkv" placement="top">
                    <el-icon><InfoFilled /></el-icon>
                  </el-tooltip>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="定时发布">
              <el-switch v-model="uploadForm.scheduled" active-text="开启定时" inactive-text="立即发布"></el-switch>
            </el-form-item>
            <el-form-item v-if="uploadForm.scheduled" label="发布时间">
              <el-date-picker
                v-model="uploadForm.scheduledTime"
                type="datetime"
                placeholder="选择发布时间"
                :disabled-date="disabledDate"
                :disabled-hours="disabledHours"
                :disabled-minutes="disabledMinutes"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item v-if="uploadForm.scheduled" label="时间模板">
              <el-select v-model="uploadForm.timeTemplate" placeholder="选择时间模板" @change="applyTimeTemplate" style="width: 100%">
                <el-option label="1小时后" value="1hour"></el-option>
                <el-option label="2小时后" value="2hours"></el-option>
                <el-option label="明天上午9点" value="tomorrow_9am"></el-option>
                <el-option label="明天下午2点" value="tomorrow_2pm"></el-option>
                <el-option label="明天晚上8点" value="tomorrow_8pm"></el-option>
                <el-option label="后天上午10点" value="day_after_10am"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="uploadDialogVisible = false">取消</el-button>
              <el-button type="primary" @click="handleUpload">
                {{ uploadForm.scheduled ? '定时上传' : '立即上传' }}
              </el-button>
            </span>
          </template>
        </el-dialog>
        <!-- 生成视频对话框 -->
        <el-dialog
          v-model="generateAIVideoDialogVisible"
          title="生成AI视频"
          width="600px"
        >
          <el-form :model="generateAIVideoForm" label-width="100px">
            <el-form-item label="背景音乐关键词">
              <el-input v-model="generateAIVideoForm.bgm" placeholder="请输入背景音乐关键词"></el-input>
            </el-form-item>
            <el-form-item label="视频背景字幕">
              <el-input v-model="generateAIVideoForm.subtitle" placeholder="请输入背景字幕"></el-input>
            </el-form-item>
            <el-form-item label="AI生成视频关键词">
              <el-input v-model="generateAIVideoForm.video_prompt" placeholder="请输入AI生成视频关键词"></el-input>
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="generateAIVideoDialogVisible = false">取消</el-button>
              <el-button 
                type="primary" 
                @click="handleGenerateAIVideo"
                :disabled="isGeneratingAIVideo">
                {{ isGeneratingAIVideo ? '生成中(约2分钟)...' : '立即生成' }}
              </el-button>
            </span>
          </template>
        </el-dialog>
    </div>
    
</template> 

<script>
import api from '../../api/config'
import { UploadFilled, InfoFilled } from '@element-plus/icons-vue'
import { inject} from 'vue'
import axios from 'axios';

export default {
  name: 'VideoManager',
  components: {
    UploadFilled,
    InfoFilled
  },
  data() {
    return {
      videos: [],
      checkInterval: null,
      uploadDialogVisible: false,
      generateAIVideoDialogVisible: false,
      isGeneratingAIVideo: false,
      uploadForm: {
        title: '',
        description: '',
        path: '',
        scheduled: false,
        scheduledTime: null,
        timeTemplate: '',
        comment_content: ''
      },
      generateAIVideoForm: {
        bgm: '',
        subtitle: '',
        video_prompt: '',
      },
    }
  },
  setup() {
    const accountState = inject('accountState')
    return {
      accountState
    }
  },
  computed: {
    currentUserId() {
      console.log("currentUserId", this.accountState.account_info);
      return this.accountState.account_info?.user_id;
    }
  },
  watch: {
    currentUserId: {
      handler(newUserId) {
        console.log("newUserId", newUserId);
        this.getVideosFromAdsPower(newUserId);
      }
    }
  },
  methods: {
    async getVideosFromAdsPower(user_id) {
      try {
        console.log("user_id", user_id);
        const response = await api.get('/selenium/videos', {
          params: {
            profile_id: user_id
          }
        });
        this.videos = response.data.videos;
        console.log("videos", this.videos);
      } catch (error) {
        this.$message.error('获取视频信息失败: ' + error.message);
      }
    },
    showGenerateAIVideoDialog() {
      this.generateAIVideoDialogVisible = true;
      this.generateAIVideoForm = {
        bgm: '',
        subtitle: '',
        video_prompt: '',
      };
    },

    async handleGenerateAIVideo() {
      if (this.isGeneratingAIVideo) {
        this.$message.warning('正在生成视频，请稍后再试');
        return;
      }
      this.isGeneratingAIVideo = true;
      if (!this.generateAIVideoForm.bgm) {
        this.$message.warning('请输入bgm关键词');
        return;
      }
      if (!this.generateAIVideoForm.subtitle) {
        this.$message.warning('请输入字幕');
        return;
      }
      if (!this.generateAIVideoForm.video_prompt) {
        this.$message.warning('请输入视频关键词');
        return;
      }

      try {
        //console.log("data", JSON.stringify(data));
        const generateAIVideoData = {
          "parameters": {
            "bgm": this.generateAIVideoForm.bgm,
            "subtitle": this.generateAIVideoForm.subtitle,
            "videoprompt": this.generateAIVideoForm.video_prompt
          },
          "workflow_id": "7513593541714673705"
        };
        const response = await axios.post('https://api.coze.cn/v1/workflow/run', generateAIVideoData, {
          headers: {
            'Authorization': 'Bearer pat_a6b6pXlv8V7ypbsArQF3DAxCmsZ7EYvNPwqSQZU7kUfxqhZeGgEzcz0vzm7qO1rA',
            'Content-Type': 'application/json'
          }
        });
        const data = JSON.parse(response.data.data);
        const video_url = data.output;
        console.log("response", video_url);
        try {
          const response = await axios({
            url: video_url,
            method: 'GET',
            responseType: 'blob'
          });
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.download = `ai_video_${Date.now()}.mp4`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('下载视频失败:', error);
          this.$message.error('下载视频失败');
        }
        this.$message.success('AI视频生成完成');
        this.generateAIVideoDialogVisible = false;
        this.isGeneratingAIVideo = false;
      } catch (error) {
        this.isGeneratingAIVideo = false;
        this.$message.error('视频上传失败: ' + error.message);
      }
    },

    showUploadDialog() {
      this.uploadDialogVisible = true;
      this.uploadForm = {
        title: '',
        description: '',
        comment_content: '',
        path: '',
        scheduled: false,
        scheduledTime: null,
        timeTemplate: ''
      };
    },

    async handleUpload() {
      if (!this.uploadForm.title) {
        this.$message.warning('请输入视频标题');
        return;
      }
      if (!this.uploadForm.path) {
        this.$message.warning('请输入视频文件路径');
        return;
      }
      if (this.uploadForm.scheduled && !this.uploadForm.scheduledTime) {
        this.$message.warning('请选择发布时间');
        return;
      }

      try {
        const uploadData = {
          profileId: this.currentUserId,
          title: this.uploadForm.title,
          description: this.uploadForm.description,
          comment_content: this.uploadForm.comment_content,
          video: this.uploadForm.path,
          scheduled: this.uploadForm.scheduled,
          scheduledTime: this.uploadForm.scheduledTime
        };

        await api.post('/videos/upload', uploadData);
        this.$message.success(this.uploadForm.scheduled ? '定时上传设置成功' : '视频上传成功');
        this.uploadDialogVisible = false;
      } catch (error) {
        this.$message.error('视频上传失败: ' + error.message);
      }
    },
    async deleteVideo(description) {
      try {
        await api.post('/videos/delete', {
          profileId: this.currentUserId,
          title: description
        });
        this.$message.success('删除视频成功');
      } catch (error) {
        this.$message.error('删除视频失败: ' + error.message);
      }
    },
    disabledDate(date) {
      // 禁用过去的日期
      return date.getTime() < Date.now() - 24 * 60 * 60 * 1000;
    },
    disabledHours() {
      // 不禁用任何小时
      return [];
    },
    disabledMinutes() {
      // 不禁用任何分钟
      return [];
    },
    applyTimeTemplate(value) {
      const now = new Date();
      let targetTime = new Date();
      
      switch (value) {
        case '1hour':
          targetTime = new Date(now.getTime() + 60 * 60 * 1000);
          break;
        case '2hours':
          targetTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
          break;
        case 'tomorrow_9am':
          targetTime = new Date(now);
          targetTime.setDate(now.getDate() + 1);
          targetTime.setHours(9, 0, 0, 0);
          break;
        case 'tomorrow_2pm':
          targetTime = new Date(now);
          targetTime.setDate(now.getDate() + 1);
          targetTime.setHours(14, 0, 0, 0);
          break;
        case 'tomorrow_8pm':
          targetTime = new Date(now);
          targetTime.setDate(now.getDate() + 1);
          targetTime.setHours(20, 0, 0, 0);
          break;
        case 'day_after_10am':
          targetTime = new Date(now);
          targetTime.setDate(now.getDate() + 2);
          targetTime.setHours(10, 0, 0, 0);
          break;
        default:
          return;
      }
      
      this.uploadForm.scheduledTime = targetTime;
    }
  },
  created() {
    this.getVideosFromAdsPower(this.currentUserId);
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