<template>
    <div class="message-manager">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>私信列表</span>
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
                    <div class="message-id">ID: {{ message.conversation_id }}</div>
                    <div class="message-text" v-if="message.conversation">
                      <div v-for="(msg, idx) in getMessageLines(message.conversation)" :key="idx" class="message-line">
                        {{ msg }}
                      </div>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
            <div v-else class="empty-tip">
              <p>暂无私信数据</p>
            </div>
        </el-card>
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>私信功能</span>
            </div>
          </template> 
          <el-input
              v-model="replyMessage"
              type="textarea"
              :rows="2"
              placeholder="请输入要回复的消息内容"
              style="margin-bottom: 10px;"
            ></el-input>
              <el-button type="primary" @click="replayStrangerMessages">
                回复陌生人消息  
              </el-button>
              <el-button type="primary" @click="getStrangerMessages">
                获取私信列表  
              </el-button>
        </el-card>
    </div>
</template>

<script>
import api from '../../api/config'
import { inject, computed} from 'vue'

export default {
  name: 'MessageManager',
  data() {
    return {
      checkInterval: null,
      replyMessage: '',
      messages: []
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
            profile_id: profile_id
          }
        });
        this.messages = response.data.messages;
        console.log('获取到的消息数据:', this.messages); // 添加日志
      }catch(error){
        this.$message.error('获取私信信息失败: ' + error.message);
      }
    },
    async replayStrangerMessages() {
      try {
        this.$message.success('回复私信成功');
      } catch (error) {
        this.$message.error('回复私信失败: ' + error.message);
      }
    }
  },
  created() {
    this.getStrangerMessages(this.currentUserId);
  }
}
</script>

<style scoped>
.empty-tip {
  text-align: center;
  padding: 20px;
  color: #909399;
}

.message-content {
  padding: 10px;
}

.message-id {
  color: #909399;
  font-size: 12px;
  margin-bottom: 8px;
}

.message-text {
  white-space: pre-line;
  word-break: break-word;
}

.message-line {
  margin-bottom: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
}

.message-line:last-child {
  border-bottom: none;
}

.el-collapse-item {
  margin-bottom: 10px;
}

:deep(.el-collapse-item__header) {
  font-size: 14px;
  color: #303133;
}
</style> 