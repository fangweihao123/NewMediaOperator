<template>
    <div class="message-manager">
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
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>私信列表</span>
            </div>
          </template> 
            <div v-if="messages.length > 0">
              <el-table :data="messages" style="width: 100%">
              <el-table-column prop="conversation_id" label="ID" />
              <el-table-column prop="conversation" label="信息">
                <template #default="scope">
                  <span v-if="scope.row.conversation && scope.row.conversation.length > 0" style="white-space: pre-line">{{ scope.row.conversation }}</span>
                </template>
              </el-table-column>
              
              </el-table>
            </div>
            <div v-else class="empty-tip">
              <p>暂无私信数据</p>
            </div>
        </el-card>
    </div>
</template>

<script>
import api from '../../api/config'

export default {
  name: 'MessageManager',
  data() {
    return {
      checkInterval: null,
      replyMessage: '',
      messages: []
    }
  },
  methods: {
    async getStrangerMessages() {
      try {
        const response = await api.get('/selenium/messages');
        this.messages = response.data.messages;
      }catch(error){
        this.$message.error('获取私信信息失败: ' + error.message);
      }
    },
    async replayStrangerMessages() {
      try {
        const response = await api.post('/selenium/replymessages',{
          msg: this.replyMessage
        });
        this.$message.success('获取消息成功');
      } catch (error) {
        this.$message.error('获取消息失败: ' + error.message);
      }
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