<template>
    <div class="message-manager">
        <!-- 自动回复设置卡片 -->
        <el-card class="box-card" style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <span>自动回复设置</span>
              <el-button type="primary" size="small" @click="showReplySettingDialog">
                编辑回复信息
              </el-button>
            </div>
          </template>
          <div class="reply-info">
            <p><strong>当前回复信息:</strong></p>
            <p class="reply-text">{{ currentReplyMessage || '留下你的行业和电话号码' }}</p>
          </div>
        </el-card>

        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>私信列表</span>
              <div class="header-actions">
                <el-button type="primary" size="small" @click="getStrangerMessages">
                  刷新私信列表  
                </el-button>
              </div>
            </div>
          </template> 
            <div v-if="messages.length > 0">
              <el-collapse>
                <el-collapse-item 
                  v-for="(message, index) in messages" 
                  :key="message.conversation_id" 
                  :title="getMessageTitle(message)"
                >
                  <div class="message-content">
                    <!-- 只有当guest_nickname存在时才显示会话信息 -->
                    <div v-if="message.guest_nickname" class="message-id">
                      昵称: {{ message.guest_nickname }}
                    </div>
                    <div class="message-text" v-if="message.conversation">
                      <div v-for="(msg, idx) in getFormattedMessageLines(message)" :key="idx" class="message-line">
                        {{ msg }}
                      </div>
                    </div>
                    
                    <!-- 回复区域 -->
                    <div class="reply-section">
                      <div class="reply-input-row">
                        <el-input
                          v-model="replyInputs[message.conversation_id]"
                          placeholder="输入回复内容..."
                          :disabled="replySending[message.conversation_id]"
                          @keydown.enter="sendReply(message.conversation_id, message.guest_nickname, message.guest)"
                          class="reply-input"
                        ></el-input>
                        <el-button 
                          type="primary" 
                          size="small"
                          :loading="replySending[message.conversation_id]"
                          :disabled="!replyInputs[message.conversation_id] || replyInputs[message.conversation_id].trim() === ''"
                          @click="sendReply(message.conversation_id, message.guest_nickname, message.guest)"
                          class="reply-button"
                        >
                          {{ replySending[message.conversation_id] ? '发送中' : '回复' }}
                        </el-button>
                      </div>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
            <div v-else class="empty-tip">
              <p>暂无私信数据</p>
              <el-button type="primary" @click="getStrangerMessages">获取私信列表</el-button>
            </div>
        </el-card>

        <!-- 回复信息设置对话框 -->
        <el-dialog
          v-model="replySettingDialogVisible"
          title="设置自动回复信息"
          width="500px"
        >
          <el-form :model="replyForm" label-width="120px">
            <el-form-item label="回复信息">
              <el-input 
                v-model="replyForm.message" 
                type="textarea" 
                :rows="4"
                placeholder="请输入自动回复信息"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="replySettingDialogVisible = false">取消</el-button>
              <el-button 
                type="primary" 
                @click="handleReplySettingUpdate"
                :loading="isUpdatingReply">
                确定
              </el-button>
            </span>
          </template>
        </el-dialog>
    </div>
</template>

<script>
import api from '../../api/config'
import { inject, reactive } from 'vue'

export default {
  name: 'MessageManager',
  data() {
    return {
      messages: [],
      replyInputs: reactive({}), // 使用 reactive 包装
      replySending: reactive({}), // 使用 reactive 包装
      replySettingDialogVisible: false,
      replyForm: {
        message: ''
      },
      currentReplyMessage: '',
      isUpdatingReply: false
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
      return this.accountState.account_info?.user_id;
    }
  },
  watch: {
    currentUserId: {
      handler(newUserId) {
        this.getStrangerMessages(newUserId);
      }
    },
    messages: {
      handler(newMessages) {
        // 当消息列表更新时，初始化回复输入框和状态
        newMessages.forEach(message => {
          if (!this.replyInputs[message.conversation_id]) {
            this.replyInputs[message.conversation_id] = '';
          }
          if (!this.replySending[message.conversation_id]) {
            this.replySending[message.conversation_id] = false;
          }
        });
      },
      deep: true
    }
  },
  methods: {
    getMessageLines(conversation) {
      if (!conversation) return [];
      return conversation.split('\n').filter(line => line.trim());
    },
    
    // 格式化消息行，在每行前面加上guest_nickname
    getFormattedMessageLines(message) {
      if (!message.conversation) return [];
      
      const lines = this.getMessageLines(message.conversation);
      
      // 如果有guest_nickname，在每行消息前加上名称标识
      if (message.guest_nickname && lines.length > 0) {
        return lines.map(line => `${message.guest_nickname}: ${line}`);
      }
      
      return lines;
    },
    
    getMessageTitle(message) {
      // 优先使用guest_nickname作为标题前缀，如果没有则使用"私信"
      console.log('message', message);
      const titlePrefix = message.guest_nickname ? message.guest_nickname : '私信';
      
      if (!message.conversation) {
        return titlePrefix;
      }
      
      // 获取最新的一条消息
      const messages = this.getMessageLines(message.conversation);
      if (messages.length === 0) {
        return titlePrefix;
      }
      
      const lastMessage = messages[messages.length - 1];
      
      // 如果消息太长，截取前30个字符
      const preview = lastMessage.length > 30 ? lastMessage.substring(0, 30) + '...' : lastMessage;
      
      // 如果有guest_nickname，在预览文本前也加上名称
      const formattedPreview = message.guest_nickname ? `${message.guest_nickname}: ${preview}` : preview;
      
      return `${titlePrefix} - ${formattedPreview}`;
    },
    
    async getStrangerMessages(profile_id) {
      try {
        const response = await api.get('/selenium/messages',{
          params: {
            profile_id: profile_id || this.currentUserId
          }
        });
        this.messages = response.data.messages;
        console.log('获取到的消息数据:', this.messages);
        this.$message.success(`获取到 ${this.messages.length} 条私信`);
      }catch(error){
        this.$message.error('获取私信信息失败: ' + error.message);
      }
    },
    
    // 发送回复 - 添加guest_nickname和guest参数
    async sendReply(conversationId, guestNickname = null, guest = null) {
      const replyContent = this.replyInputs[conversationId];
      if (!replyContent || replyContent.trim() === '') {
        this.$message.warning('请输入回复内容');
        return;
      }
      
      this.replySending[conversationId] = true;
      
      try {
        // 构建请求数据，包含guest相关信息和profileId
        const requestData = {
          text: replyContent,
          conversationId: conversationId,
          profileId: this.currentUserId,
        };
        
        // 如果有guest信息，添加到请求中
        if (guestNickname) {
          requestData.guest_nickname = guestNickname;
        }
        if (guest) {
          requestData.guest = guest;
        }
        
        console.log('发送回复请求数据:', requestData);
        
        const response = await api.post('/messages/send-text', requestData);
        
        if (response.data.status === 'success') {
          const successMessage = guestNickname 
            ? `回复 ${guestNickname} 发送成功` 
            : '回复发送成功';
          this.$message.success(successMessage);
          // 清空输入框
          this.replyInputs[conversationId] = '';
        } else {
          throw new Error(response.data.message || '发送失败');
        }
      } catch (error) {
        console.error('发送回复失败:', error);
        this.$message.error(`回复发送失败: ${error.response?.data?.error || error.message}`);
      } finally {
        this.replySending[conversationId] = false;
      }
    },
    async getCurrentReplyMessage() {
      try {
        const response = await api.get('/videos/getReply', {
          params: {
            profileId: this.currentUserId
          }
        });
        this.currentReplyMessage = response.data.message;
        this.replyForm.message = response.data.message;
      } catch (error) {
        console.error('获取回复信息失败:', error);
      }
    },
    showReplySettingDialog() {
      this.replyForm.message = this.currentReplyMessage;
      this.replySettingDialogVisible = true;
    },
    async handleReplySettingUpdate() {
      if (this.isUpdatingReply) {
        this.$message.warning('正在更新中，请稍后再试');
        return;
      }

      this.isUpdatingReply = true;
      try {
        const response = await api.post('/videos/updateReply', {
          profileId: this.currentUserId,
          message: this.replyForm.message,
        });
        this.currentReplyMessage = this.replyForm.message;
        this.$message.success('自动回复信息更新成功');
        this.replySettingDialogVisible = false;
      } catch (error) {
        this.$message.error('更新自动回复信息失败: ' + error.message);
      } finally {
        this.isUpdatingReply = false;
      }
    }
  },
  created() {
    this.getStrangerMessages(this.currentUserId);
    this.getCurrentReplyMessage();
  }
}
</script>

<style scoped>
.message-manager {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.box-card {
  margin-bottom: 20px;
}

.message-content {
  padding: 10px 0;
}

.message-id {
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
  font-size: 14px;
}

.message-text {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
  border-left: 3px solid #409EFF;
}

.message-line {
  margin-bottom: 5px;
  line-height: 1.5;
  color: #303133;
}

.reply-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.reply-input-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.reply-input {
  flex: 1;
}

.reply-button {
  min-width: 80px;
  height: 32px;
}

.empty-tip {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-tip p {
  margin-bottom: 20px;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reply-input-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .reply-button {
    width: 100%;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}

/* 优化折叠面板样式 */
:deep(.el-collapse-item__header) {
  font-size: 14px;
  color: #303133;
  padding: 15px 20px;
}

:deep(.el-collapse-item__content) {
  padding: 0 20px 20px;
}

.reply-info {
  padding: 10px;
}

.reply-text {
  margin-top: 10px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
  color: #303133;
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 