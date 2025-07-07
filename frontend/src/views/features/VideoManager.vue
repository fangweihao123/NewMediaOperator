<template>
    <div class="video-manager">
        <!-- 视频上传选择区域 -->
        <el-card class="box-card upload-selection-card">
          <template #header>
            <div class="card-header">
              <span>视频上传</span>
              <div class="upload-actions">
                <el-button 
                  type="success" 
                  @click="showAIVideoDialog"
                  size="large"
                >
                  <el-icon><UploadFilled /></el-icon>
                  AI生成视频
                </el-button>
              </div>
            </div>
          </template>
          
          <div class="upload-selection-area">
            <div class="upload-buttons">
              <el-button 
                type="primary" 
                @click="showUploadDialog"
                :disabled="!selectedMaterial"
                size="large"
              >
                <el-icon><UploadFilled /></el-icon>
                使用素材上传视频
              </el-button>
            </div>
          </div>

          <!-- 已选择素材提示 -->
          <div v-if="selectedMaterial" class="selected-material-info">
            <el-alert
              :title="`已选择素材: ${selectedMaterial.name}`"
              type="success"
              :closable="false"
              show-icon
            >
              <template #default>
                <el-button size="small" @click="clearSelectedMaterial">取消选择</el-button>
              </template>
            </el-alert>
          </div>
        </el-card>

        <!-- 素材库区域 -->
        <el-card class="box-card material-card">
          <template #header>
            <div class="card-header">
              <span>素材库</span>
              <div class="material-actions">
                <el-button type="primary" @click="showUploadMaterialDialog">
                  上传本地素材
                </el-button>
                <el-button type="primary" @click="showUploadMaterialUrlDialog">
                  上传链接素材
                </el-button>
              </div>
            </div>
          </template>
          
          <div v-if="materials.length > 0" class="material-grid">
            <div 
              v-for="material in materials" 
              :key="material.id" 
              class="material-item"
              :class="{ 
                'selected': selectedMaterial?.id === material.id,
                'loaded': material.loaded,
                'error': material.error
              }"
              :data-material-id="material.id"
              @click="selectMaterial(material)"
            >
              <div class="material-preview">
                <video 
                  v-if="material.type === 'video'" 
                  :src="getMaterialUrl(material.url)" 
                  preload="metadata"
                  class="material-video"
                  @loadedmetadata="onVideoLoaded"
                  @error="onVideoError"
                  muted
                ></video>
                <img 
                  v-else-if="material.type === 'image'" 
                  :src="getMaterialUrl(material.url)" 
                  class="material-image"
                  alt="素材预览"
                  @load="onImageLoaded"
                  @error="onImageError"
                />
                <div v-else class="material-placeholder">
                  <el-icon><Document /></el-icon>
                  <div class="material-placeholder-text">{{ material.name }}</div>
                </div>
                <div v-if="material.loading" class="material-loading">
                  <el-icon class="is-loading"><Loading /></el-icon>
                </div>
              </div>
              <div class="material-info">
                <div class="material-name">{{ material.name }}</div>
                <div class="material-meta">
                  <span class="material-type">{{ getMaterialTypeText(material.type) }}</span>
                  <span class="material-size">{{ formatFileSize(material.size) }}</span>
                </div>
              </div>
              <div class="material-actions-overlay">
                <el-button 
                  size="small" 
                  type="danger" 
                  @click.stop="deleteMaterial(material.id)"
                  circle
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
          <div v-else class="empty-tip">
            <p>暂无素材，请先上传素材</p>
          </div>  
        </el-card>

        <!-- 视频列表区域 -->
        <el-card class="box-card video-card">
          <template #header>
            <div class="card-header">
              <span>视频列表</span>
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

        <!-- 上传本地素材对话框 -->
        <el-dialog
          v-model="uploadMaterialDialogVisible"
          title="上传本地素材"
          width="600px"
        >
          <el-form :model="uploadMaterialForm" label-width="120px">
            <el-form-item label="素材文件">
              <el-upload
                ref="materialUpload"
                :auto-upload="false"
                :on-change="handleMaterialFileChange"
                :file-list="materialFileList"
                :limit="1"
                accept="video/*,image/*"
                drag
              >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                  将文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    支持视频和图片格式，文件大小不超过500MB
                  </div>
                </template>
              </el-upload>
            </el-form-item>
            <el-form-item label="素材名称">
              <el-input v-model="uploadMaterialForm.name" placeholder="请输入素材名称"></el-input>
            </el-form-item>
            <el-form-item label="素材描述">
              <el-input 
                v-model="uploadMaterialForm.description" 
                type="textarea" 
                :rows="3"
                placeholder="请输入素材描述">
              </el-input>
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="uploadMaterialDialogVisible = false">取消</el-button>
              <el-button 
                type="primary" 
                @click="handleUploadMaterial"
                :disabled="isUploadingMaterial || !uploadMaterialForm.file">
                上传素材
              </el-button>
            </span>
          </template>
        </el-dialog>

        <!-- 上传链接素材对话框 -->
        <el-dialog
          v-model="uploadMaterialUrlDialogVisible"
          title="上传链接素材"
          width="600px"
        >
          <el-form :model="uploadMaterialUrlForm" label-width="120px">
            <el-form-item label="素材链接">
              <el-input 
                v-model="uploadMaterialUrlForm.url" 
                placeholder="请输入素材链接">
              </el-input>
            </el-form-item>
            <el-form-item label="素材名称">
              <el-input v-model="uploadMaterialUrlForm.name" placeholder="请输入素材名称"></el-input>
            </el-form-item>
            <el-form-item label="素材描述">
              <el-input 
                v-model="uploadMaterialUrlForm.description" 
                type="textarea" 
                :rows="3"
                placeholder="请输入素材描述">
              </el-input>
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="uploadMaterialUrlDialogVisible = false">取消</el-button>
              <el-button 
                type="primary" 
                @click="handleUploadMaterialUrl"
                :disabled="isUploadingMaterialUrl || !uploadMaterialUrlForm.url">
                上传素材
              </el-button>
            </span>
          </template>
        </el-dialog>

        <!-- 使用素材上传视频对话框 -->
        <el-dialog
          v-model="uploadDialogVisible"
          title="使用素材库视频"
          width="700px"
        >
          <el-form :model="uploadForm" label-width="120px">
            <!-- 素材库视频的表单字段 -->
            <el-form-item label="选择的素材">
              <div class="selected-material-display">
                <div class="material-preview-small">
                  <video 
                    v-if="selectedMaterial?.type === 'video'" 
                    :src="getMaterialUrl(selectedMaterial.url)" 
                    preload="metadata"
                    class="material-video-small"
                    muted
                  ></video>
                  <img 
                    v-else-if="selectedMaterial?.type === 'image'" 
                    :src="getMaterialUrl(selectedMaterial.url)" 
                    class="material-image-small"
                    alt="素材预览"
                  />
                  <div v-else class="material-placeholder-small">
                    <el-icon><Document /></el-icon>
                  </div>
                </div>
                <div class="material-info-small">
                  <div class="material-name-small">{{ selectedMaterial?.name }}</div>
                  <div class="material-type-small">{{ getMaterialTypeText(selectedMaterial?.type) }}</div>
                </div>
              </div>
            </el-form-item>

            <!-- 通用表单字段 -->
            <el-form-item label="视频标题">
              <el-input v-model="uploadForm.title" placeholder="请输入视频标题"></el-input>
            </el-form-item>
            <el-form-item label="视频描述">
              <el-input v-model="uploadForm.description" placeholder="请输入视频描述"></el-input>
            </el-form-item>
            <el-form-item label="首评内容">
              <el-input v-model="uploadForm.comment_content" placeholder="请输入首评内容"></el-input>
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
              <el-button 
                type="primary" 
                @click="handleUpload"
                :disabled="isUploading">
                {{ getUploadButtonText() }}
              </el-button>
            </span>
          </template>
        </el-dialog>

        <!-- AI生成视频对话框 -->
        <el-dialog
          v-model="aiVideoDialogVisible"
          title="AI生成视频"
          width="700px"
        >
          <el-form :model="aiVideoForm" label-width="120px">
            <!-- AI生成视频的表单字段 -->
            <el-form-item label="背景音乐关键词">
              <el-input v-model="aiVideoForm.bgm" placeholder="请输入背景音乐关键词"></el-input>
            </el-form-item>
            <el-form-item label="视频背景字幕">
              <el-input 
                v-model="aiVideoForm.subtitle" 
                type="textarea" 
                :rows="4"
                placeholder="请输入背景字幕，支持多行输入"
                resize="vertical">
              </el-input>
            </el-form-item>
            <el-form-item label="AI生成视频关键词">
              <el-input v-model="aiVideoForm.video_prompt" placeholder="请输入AI生成视频关键词"></el-input>
            </el-form-item>

            <!-- 通用表单字段 -->
            <el-form-item label="视频标题">
              <el-input v-model="aiVideoForm.title" placeholder="请输入视频标题"></el-input>
            </el-form-item>
            <el-form-item label="视频描述">
              <el-input v-model="aiVideoForm.description" placeholder="请输入视频描述"></el-input>
            </el-form-item>
            <el-form-item label="首评内容">
              <el-input v-model="aiVideoForm.comment_content" placeholder="请输入首评内容"></el-input>
            </el-form-item>  

            <el-form-item label="定时发布">
              <el-switch v-model="aiVideoForm.scheduled" active-text="开启定时" inactive-text="立即发布"></el-switch>
            </el-form-item>
            <el-form-item v-if="aiVideoForm.scheduled" label="发布时间">
              <el-date-picker
                v-model="aiVideoForm.scheduledTime"
                type="datetime"
                placeholder="选择发布时间"
                :disabled-date="disabledDate"
                :disabled-hours="disabledHours"
                :disabled-minutes="disabledMinutes"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item v-if="aiVideoForm.scheduled" label="时间模板">
              <el-select v-model="aiVideoForm.timeTemplate" placeholder="选择时间模板" @change="applyAITimeTemplate" style="width: 100%">
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
              <el-button @click="aiVideoDialogVisible = false">取消</el-button>
              <el-button 
                type="primary" 
                @click="handleAIVideoUpload"
                :disabled="isUploadingAI">
                {{ getAIUploadButtonText() }}
              </el-button>
            </span>
          </template>
        </el-dialog>
    </div>
    
</template> 

<script>
import api from '../../api/config'
import { UploadFilled, InfoFilled, Document, Delete, Loading } from '@element-plus/icons-vue'
import { inject} from 'vue'

export default {
  name: 'VideoManager',
  components: {
    UploadFilled,
    InfoFilled,
    Document,
    Delete,
    Loading
  },
  data() {
    return {
      videos: [],
      materials: [],
      selectedMaterial: null,
      checkInterval: null,
      uploadDialogVisible: false,
      aiVideoDialogVisible: false,
      uploadUrlDialogVisible: false,
      uploadMaterialDialogVisible: false,
      uploadMaterialUrlDialogVisible: false,
      isUploading: false,
      isUploadingAI: false,
      isUploadingUrls: false,
      isUploadingMaterial: false,
      isUploadingMaterialUrl: false,
      uploadForm: {
        title: '',
        description: '',
        path: '',
        scheduled: false,
        scheduledTime: null,
        timeTemplate: '',
        comment_content: '',
      },
      aiVideoForm: {
        title: '',
        description: '',
        scheduled: false,
        scheduledTime: null,
        timeTemplate: '',
        comment_content: '',
        bgm: '',
        subtitle: '',
        video_prompt: '',
      },
      uploadUrlForm: {
        videoUrls: '',
        batchTitle: '',
        description: '',
        comment_content: '',
        scheduled: false,
        scheduledTime: null,
      },
      uploadMaterialForm: {
        file: null,
        name: '',
        description: '',
      },
      uploadMaterialUrlForm: {
        url: '',
        name: '',
        description: '',
      },
      materialFileList: [],
      uploadUrlList: [],
      uploadProgress: [],
      uploadMode: 'ai',
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
        this.getMaterials();
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
      console.log("bind again");
    },

    async getMaterials() {
      try {
        const response = await api.get('/materials');
        this.materials = response.data.materials || [];
        console.log('获取到的素材列表:', this.materials);
        
        // 为每个素材添加加载状态
        this.materials.forEach(material => {
          material.loading = false;
          material.loaded = false;
          material.error = false;
        });
      } catch (error) {
        console.error('获取素材列表失败:', error);
      }
    },

    selectMaterial(material) {
      this.selectedMaterial = material;
    },

    clearSelectedMaterial() {
      this.selectedMaterial = null;
    },

    showUploadMaterialDialog() {
      this.uploadMaterialDialogVisible = true;
      this.uploadMaterialForm = {
        file: null,
        name: '',
        description: '',
      };
      this.materialFileList = [];
    },

    showUploadMaterialUrlDialog() {
      this.uploadMaterialUrlDialogVisible = true;
      this.uploadMaterialUrlForm = {
        url: '',
        name: '',
        description: '',
      };
    },

    handleMaterialFileChange(file) {
      this.uploadMaterialForm.file = file.raw;
      this.uploadMaterialForm.name = file.name;
      this.materialFileList = [file];
    },

    async handleUploadMaterial() {
      if (!this.uploadMaterialForm.file) {
        this.$message.warning('请选择素材文件');
        return;
      }

      if (!this.uploadMaterialForm.name) {
        this.$message.warning('请输入素材名称');
        return;
      }

      this.isUploadingMaterial = true;
      try {
        const formData = new FormData();
        formData.append('file', this.uploadMaterialForm.file);
        formData.append('name', this.uploadMaterialForm.name);
        formData.append('description', this.uploadMaterialForm.description);


        await api.post('/materials/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        this.$message.success('素材上传成功');
        this.uploadMaterialDialogVisible = false;
        this.getMaterials();
      } catch (error) {
        this.$message.error('素材上传失败: ' + error.message);
      } finally {
        this.isUploadingMaterial = false;
      }
    },

    async handleUploadMaterialUrl() {
      if (!this.uploadMaterialUrlForm.url) {
        this.$message.warning('请输入素材链接');
        return;
      }

      if (!this.uploadMaterialUrlForm.name) {
        this.$message.warning('请输入素材名称');
        return;
      }

      this.isUploadingMaterialUrl = true;
      try {
        const uploadData = {
          url: this.uploadMaterialUrlForm.url,
          name: this.uploadMaterialUrlForm.name,
          description: this.uploadMaterialUrlForm.description,
        };

        await api.post('/materials/uploadUrl', uploadData);

        this.$message.success('素材上传成功');
        this.uploadMaterialUrlDialogVisible = false;
        this.getMaterials();
      } catch (error) {
        this.$message.error('素材上传失败: ' + error.message);
      } finally {
        this.isUploadingMaterialUrl = false;
      }
    },

    async deleteMaterial(materialId) {
      try {
        await api.delete(`/materials/${materialId}`);
        this.$message.success('素材删除成功');
        this.getMaterials();
        
        // 如果删除的是当前选中的素材，清除选择
        if (this.selectedMaterial?.id === materialId) {
          this.selectedMaterial = null;
        }
      } catch (error) {
        this.$message.error('素材删除失败: ' + error.message);
      }
    },

    showUploadUrlVideo() {
      this.uploadUrlDialogVisible = true;
      this.uploadUrlForm = {
        videoUrls: '',
        batchTitle: '',
        description: '',
        comment_content: '',
        scheduled: false,
        scheduledTime: null,
      };
      this.uploadUrlList = [];
      this.uploadProgress = [];
    },
    showUploadDialog() {
      this.uploadDialogVisible = true;
      this.uploadForm = {
        title: '只投资不管理',
        description: '#资本',
        comment_content: '点我头像',
        path: '',
        scheduled: false,
        scheduledTime: null,
        timeTemplate: '',
      };
    },

    showAIVideoDialog() {
      this.aiVideoDialogVisible = true;
      this.aiVideoForm = {
        title: '只投资不管理',
        description: '#资本',
        comment_content: '点我头像',
        scheduled: false,
        scheduledTime: null,
        timeTemplate: '',
        bgm: '轻快',
        subtitle: '讲讲你的项目\n只出资不参与管理\n100W起投\n敢不敢接受？\n(已投上百项目)\n不靠谱的勿扰',
        video_prompt: '一个被森林包围的池塘',
      };
    },

    // 解析视频链接
    parseVideoUrls() {
      const urls = this.uploadUrlForm.videoUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
      this.uploadUrlList = urls;
    },

    // 验证URL是否有效
    isValidUrl(url) {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },

    // 检查是否有有效链接
    hasValidUrls() {
      return this.uploadUrlList.some(url => this.isValidUrl(url));
    },

    // 处理视频链接上传
    async handleUploadUrls() {
      if (this.isUploadingUrls) {
        this.$message.warning('正在处理中，请稍后再试');
        return;
      }

      if (this.uploadUrlList.length === 0) {
        this.$message.warning('请输入视频链接');
        return;
      }

      if (!this.hasValidUrls()) {
        this.$message.warning('请至少输入一个有效的视频链接');
        return;
      }

      if (!this.uploadUrlForm.batchTitle) {
        this.$message.warning('请输入批量标题');
        return;
      }

      if (this.uploadUrlForm.scheduled && !this.uploadUrlForm.scheduledTime) {
        this.$message.warning('请选择发布时间');
        return;
      }

      this.isUploadingUrls = true;
      
      // 过滤有效链接
      const validUrls = this.uploadUrlList.filter(url => this.isValidUrl(url));

      // 初始化进度
      this.uploadProgress = validUrls.map((url, index) => ({
        url,
        title: this.uploadUrlForm.batchTitle + (validUrls.length > 1 ? ` (${index + 1})` : ''),
        status: 'pending',
        percentage: 0,
        message: '等待上传...',
        error: null
      }));

      try {
        // 并发上传视频链接
        const uploadPromises = validUrls.map((url, index) => 
          this.uploadSingleVideoUrl(url, index)
        );

        await Promise.all(uploadPromises);
        
        this.$message.success(`成功添加 ${validUrls.length} 个视频上传任务`);
        this.uploadUrlDialogVisible = false;
        this.getVideosFromAdsPower(this.currentUserId);
      } catch (error) {
        this.$message.error('上传失败: ' + error.message);
      } finally {
        this.isUploadingUrls = false;
      }
    },

    // 上传单个视频链接
    async uploadSingleVideoUrl(videoUrl, index) {
      const progress = this.uploadProgress[index];
      
      try {
        // 更新进度状态
        progress.status = 'downloading';
        progress.percentage = 10;
        progress.message = '正在下载视频...';

        const uploadData = {
          profileId: this.currentUserId,
          title: progress.title,
          description: this.uploadUrlForm.description,
          comment_content: this.uploadUrlForm.comment_content,
          videoUrl: videoUrl,
          materialId: this.selectedMaterial?.id, // 使用选中的素材
          scheduled: this.uploadUrlForm.scheduled,
          scheduledTime: this.uploadUrlForm.scheduledTime,
        };

        // 更新进度
        progress.percentage = 30;
        progress.message = '正在处理视频...';

        // 调用后端API
        await api.post('/videos/uploadUrl', uploadData);

        // 更新进度为成功
        progress.status = 'success';
        progress.percentage = 100;
        progress.message = '上传任务已添加';

      } catch (error) {
        // 更新进度为失败
        progress.status = 'error';
        progress.percentage = 0;
        progress.message = '上传失败';
        progress.error = error.response?.data?.error || error.message;
        throw error;
      }
    },

    async handleUpload() {
      if (!this.uploadForm.title || !this.uploadForm.description) {
        this.$message.error('请填写视频标题和描述');
        return;
      }

      if (!this.selectedMaterial) {
        this.$message.error('请先选择素材');
        return;
      }

      this.isUploading = true;
      try {
        const response = await api.post('/videos/upload-material', {
          profileId: this.currentUserId,
          title: this.uploadForm.title,
          description: this.uploadForm.description,
          materialId: this.selectedMaterial.id,
          comment_content: this.uploadForm.comment_content,
          scheduled: this.uploadForm.scheduled,
          scheduledTime: this.uploadForm.scheduledTime ? this.uploadForm.scheduledTime.toISOString() : null
        });

        this.$message.success('视频上传任务已添加');
        this.uploadDialogVisible = false;
        this.resetUploadForm();
        this.getVideosFromAdsPower(this.currentUserId);
      } catch (error) {
        console.error('上传失败:', error);
        this.$message.error('上传失败: ' + (error.response?.data?.error || error.message));
      } finally {
        this.isUploading = false;
      }
    },

    async handleAIVideoUpload() {
      if (!this.aiVideoForm.title || !this.aiVideoForm.description) {
        this.$message.error('请填写视频标题和描述');
        return;
      }

      this.isUploadingAI = true;
      try {
        const response = await api.post('/video/upload', {
          profileId: this.currentUserId,
          title: this.aiVideoForm.title,
          description: this.aiVideoForm.description,
          bgm: this.aiVideoForm.bgm,
          subtitle: this.aiVideoForm.subtitle,
          video_prompt: this.aiVideoForm.video_prompt,
          comment_content: this.aiVideoForm.comment_content,
          scheduled: this.aiVideoForm.scheduled,
          scheduledTime: this.aiVideoForm.scheduledTime ? this.aiVideoForm.scheduledTime.toISOString() : null
        });

        this.$message.success('AI视频生成任务已添加');
        this.aiVideoDialogVisible = false;
        this.resetAIVideoForm();
        this.getVideosFromAdsPower(this.currentUserId);
      } catch (error) {
        console.error('AI视频生成失败:', error);
        this.$message.error('AI视频生成失败: ' + (error.response?.data?.error || error.message));
      } finally {
        this.isUploadingAI = false;
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
    },

    applyAITimeTemplate(value) {
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
      
      this.aiVideoForm.scheduledTime = targetTime;
    },
    getUploadButtonText() {
      if (this.isUploading) {
        return '上传中...';
      }
      return '使用素材视频';
    },

    getAIUploadButtonText() {
      if (this.isUploadingAI) {
        return '生成中...';
      }
      return 'AI生成视频';
    },
    getUploadUrlButtonText() {
      if (this.uploadUrlForm.scheduled) {
        return '定时上传';
      } else {
        return '立即上传';
      }
    },
    getStatusText(status) {
      const statusMap = {
        'pending': '等待中',
        'downloading': '下载中',
        'processing': '处理中',
        'success': '成功',
        'error': '失败'
      };
      return statusMap[status] || status;
    },
    getProgressStatus(status) {
      if (status === 'error') return 'exception';
      if (status === 'success') return 'success';
      return '';
    },
    getMaterialTypeText(type) {
      const typeMap = {
        'video': '视频',
        'image': '图片',
        'audio': '音频',
        'document': '文档'
      };
      return typeMap[type] || '未知';
    },
    formatFileSize(bytes) {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    getMaterialUrl(url) {
      // 如果URL已经是完整路径，直接返回
      if (url.startsWith('http')) {
        return url;
      }
      // 否则添加API基础路径
      const fullUrl = `/api${url}`;
      console.log('素材URL:', url, '完整URL:', fullUrl);
      return fullUrl;
    },
    onVideoLoaded(event) {
      // 视频加载完成
      const video = event.target;
      const materialId = this.getMaterialIdFromElement(video);
      const material = this.materials.find(m => m.id === materialId);
      
      if (material) {
        material.loading = false;
        material.loaded = true;
        material.error = false;
      }
      
      console.log('视频加载完成:', video.src);
    },
    onVideoError(event) {
      // 视频加载失败，显示占位符
      const video = event.target;
      const materialId = this.getMaterialIdFromElement(video);
      const material = this.materials.find(m => m.id === materialId);
      
      if (material) {
        material.loading = false;
        material.loaded = false;
        material.error = true;
      }
      
      console.error('视频加载失败:', video.src);
      video.style.display = 'none';
      const placeholder = video.parentElement.querySelector('.material-placeholder');
      if (placeholder) {
        placeholder.style.display = 'flex';
      }
    },
    onImageLoaded(event) {
      // 图片加载完成
      const img = event.target;
      const materialId = this.getMaterialIdFromElement(img);
      const material = this.materials.find(m => m.id === materialId);
      
      if (material) {
        material.loading = false;
        material.loaded = true;
        material.error = false;
      }
      
      console.log('图片加载完成:', img.src);
    },
    onImageError(event) {
      // 图片加载失败，显示占位符
      const img = event.target;
      const materialId = this.getMaterialIdFromElement(img);
      const material = this.materials.find(m => m.id === materialId);
      
      if (material) {
        material.loading = false;
        material.loaded = false;
        material.error = true;
      }
      
      console.error('图片加载失败:', img.src);
      img.style.display = 'none';
      const placeholder = img.parentElement.querySelector('.material-placeholder');
      if (placeholder) {
        placeholder.style.display = 'flex';
      }
    },
    getMaterialIdFromElement(element) {
      // 从DOM元素获取素材ID
      const materialItem = element.closest('.material-item');
      if (materialItem) {
        const materialId = materialItem.getAttribute('data-material-id');
        return materialId;
      }
      return null;
    },
    resetUploadForm() {
      this.uploadForm = {
        title: '',
        description: '',
        comment_content: '',
        scheduled: false,
        scheduledTime: null,
        timeTemplate: ''
      };
    },

    resetAIVideoForm() {
      this.aiVideoForm = {
        title: '',
        description: '',
        comment_content: '',
        scheduled: false,
        scheduledTime: null,
        timeTemplate: '',
        bgm: '',
        subtitle: '',
        video_prompt: '',
      };
    },
  },
  created() {
    this.getVideosFromAdsPower(this.currentUserId);
    this.getMaterials();
  },
  beforeUnmount() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
  }
}
</script>

<style scoped>
.video-manager {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-selection-card {
  margin-bottom: 20px;
}

.material-card {
  margin-bottom: 20px;
}

.video-card {
  flex: 1;
}

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

.material-actions, .video-actions, .upload-actions {
  display: flex;
  gap: 10px;
}

.selected-material-info {
  margin-bottom: 15px;
}

.material-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.material-item {
  border: 2px solid #ebeef5;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  background: white;
}

.material-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.material-item.selected {
  border-color: #67c23a;
  background-color: #f0f9ff;
}

.material-item.loaded {
  border-color: #67c23a;
}

.material-item.error {
  border-color: #f56c6c;
}

.material-preview {
  width: 100%;
  height: 120px;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  position: relative;
}

.material-video, .material-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.material-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #909399;
  font-size: 24px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.material-placeholder-text {
  font-size: 12px;
  margin-top: 8px;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 8px;
}

.material-info {
  text-align: center;
}

.material-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.material-actions-overlay {
  position: absolute;
  top: 5px;
  right: 5px;
  opacity: 0;
  transition: opacity 0.3s;
}

.material-item:hover .material-actions-overlay {
  opacity: 1;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.url-count {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.url-preview {
  margin-top: 20px;
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.url-preview h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.url-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
  background-color: #fafafa;
}

.url-item {
  display: flex;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid #f0f0f0;
}

.url-item:last-child {
  border-bottom: none;
}

.url-item.invalid {
  background-color: #fef0f0;
}

.url-index {
  font-weight: 500;
  color: #409eff;
  margin-right: 8px;
  min-width: 30px;
}

.url-text {
  flex: 1;
  font-family: monospace;
  font-size: 12px;
  color: #606266;
  word-break: break-all;
}

.url-error {
  color: #f56c6c;
  font-size: 12px;
  margin-left: 10px;
}

.upload-progress {
  margin-top: 20px;
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.upload-progress h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.progress-item {
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.video-title {
  font-weight: 500;
  color: #303133;
}

.progress-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.progress-status.pending {
  background-color: #e6a23c;
  color: #fff;
}

.progress-status.downloading {
  background-color: #409eff;
  color: #fff;
}

.progress-status.processing {
  background-color: #67c23a;
  color: #fff;
}

.progress-status.success {
  background-color: #67c23a;
  color: #fff;
}

.progress-status.error {
  background-color: #f56c6c;
  color: #fff;
}

.progress-detail {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
}

.error-message {
  color: #f56c6c;
  margin-left: 10px;
}

.material-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.material-loading .el-icon {
  font-size: 24px;
  color: #409eff;
}

.material-item.error .material-preview {
  border: 2px solid #f56c6c;
}

.material-item.loaded .material-preview {
  border: 2px solid #67c23a;
}

.container {
  padding: 20px;
}

.box-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.material-actions {
  display: flex;
  gap: 10px;
}

.upload-selection-area {
  padding: 20px 0;
}

.upload-mode-selector {
  margin-bottom: 15px;
}

.upload-buttons {
  display: flex;
  justify-content: center;
}

.selected-material-info {
  margin-bottom: 20px;
}

.material-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.material-item {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background: white;
}

.material-item:hover {
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.material-item.selected {
  border-color: #67c23a;
  background: #f0f9ff;
}

.material-item.loaded {
  border-color: #67c23a;
}

.material-item.error {
  border-color: #f56c6c;
}

.material-preview {
  position: relative;
  height: 120px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.material-video,
.material-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.material-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 24px;
}

.material-placeholder-text {
  font-size: 12px;
  margin-top: 5px;
  text-align: center;
  padding: 0 10px;
}

.material-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #409eff;
  font-size: 20px;
}

.material-info {
  padding: 10px;
}

.material-name {
  font-weight: 500;
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.material-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.material-actions-overlay {
  position: absolute;
  top: 5px;
  right: 5px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.material-item:hover .material-actions-overlay {
  opacity: 1;
}

.empty-tip {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

/* 上传对话框中的素材显示样式 */
.selected-material-display {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.material-preview-small {
  width: 80px;
  height: 60px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.material-video-small,
.material-image-small {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.material-placeholder-small {
  color: #909399;
  font-size: 20px;
}

.material-info-small {
  flex: 1;
}

.material-name-small {
  font-weight: 500;
  margin-bottom: 5px;
}

.material-type-small {
  font-size: 12px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .material-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }
  
  .upload-selection-area {
    padding: 15px 0;
  }
  
  .material-actions {
    flex-direction: column;
    gap: 5px;
  }
}
</style> 