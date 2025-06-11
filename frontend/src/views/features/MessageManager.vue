<template>
    <div class="message-manager">
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
                    <div class="message-id">会话ID: {{ message.conversation_id }}</div>
                    <div class="message-text" v-if="message.conversation">
                      <div v-for="(msg, idx) in getMessageLines(message.conversation)" :key="idx" class="message-line">
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
                          @keydown.enter="sendReply(message.conversation_id)"
                          class="reply-input"
                        ></el-input>
                        <el-button 
                          type="primary" 
                          size="small"
                          :loading="replySending[message.conversation_id]"
                          :disabled="!replyInputs[message.conversation_id] || replyInputs[message.conversation_id].trim() === ''"
                          @click="sendReply(message.conversation_id)"
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
      replySending: reactive({}) // 使用 reactive 包装
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
    getMessageTitle(message) {
      if (!message.conversation) return `私信 ${message.conversation_id}`;
      
      // 获取最新的一条消息
      const messages = this.getMessageLines(message.conversation);
      if (messages.length === 0) return `私信 ${message.conversation_id}`;
      
      const lastMessage = messages[messages.length - 1];
      
      // 如果消息太长，截取前30个字符
      const preview = lastMessage.length > 30 ? lastMessage.substring(0, 30) + '...' : lastMessage;
      
      return `${message.conversation_id} - ${preview}`;
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
    
    // 发送回复
    async sendReply(conversationId) {
      const replyContent = this.replyInputs[conversationId];
      if (!replyContent || replyContent.trim() === '') {
        this.$message.warning('请输入回复内容');
        return;
      }
      
      this.replySending[conversationId] = true;
      
      try {
        const response = await api.post('/messages/send-text', {
          text: replyContent,
          conversationId: conversationId,
          authHeaders: {
            'User-Agent': 'DouYin-App/1.0',
            'X-Profile-ID': this.currentUserId
          }
        });
        
        if (response.data.status === 'success') {
          this.$message.success(`回复发送成功`);
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
    }
  },
  created() {
    this.getStrangerMessages(this.currentUserId);
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
</style> 