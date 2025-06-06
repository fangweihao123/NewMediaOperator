<template>
  <div class="analysis-results">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>对话分析结果</span>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="exportToExcel">
              导出Excel
            </el-button>
            <el-button type="primary" size="small" @click="refreshResults">
              刷新数据
            </el-button>
          </div>
        </div>
      </template>
      
      <div v-if="results.length > 0">
        <el-table :data="results" style="width: 100%">
          <el-table-column prop="conversation_id" label="对话ID" width="180" />
          <el-table-column label="称呼" min-width="200">
            <template #default="scope">
              <div v-for="(nickname, index) in scope.row.nicknames" :key="index">
                {{ nickname }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="联系方式" min-width="200">
            <template #default="scope">
              <div v-for="(contact, index) in scope.row.contacts" :key="index">
                {{ contact }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="analyzed_at" label="分析时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.analyzed_at) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else class="empty-tip">
        <p>暂无分析结果</p>
      </div>
    </el-card>
  </div>
</template>

<script>
import api from '../../api/config'
import { inject } from 'vue'

export default {
  name: 'AnalysisResults',
  data() {
    return {
      results: []
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

  methods: {
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString();
    },

    async refreshResults() {
      try {
        const response = await api.get('/api/conversation-analysis/results', {
          params: {
            profile_id: this.currentUserId
          }
        });
        this.results = response.data.results;
      } catch (error) {
        this.$message.error('获取分析结果失败: ' + error.message);
      }
    },

    exportToExcel() {
      try {
        // 准备数据
        const data = [];
        this.results.forEach(result => {
          result.nicknames.forEach((nickname, index) => {
            data.push({
              '对话ID': result.conversation_id,
              '称呼': nickname,
              '联系方式': result.contacts[index] || '',
              '分析时间': this.formatDate(result.analyzed_at)
            });
          });
        });

        // 转换为CSV格式
        const headers = ['对话ID', '称呼', '联系方式', '分析时间'];
        const csvContent = [
          headers.join(','),
          ...data.map(row => [
            `"${row['对话ID']}"`,
            `"${row['称呼'].replace(/"/g, '""')}"`,
            `"${row['联系方式'].replace(/"/g, '""')}"`,
            `"${row['分析时间']}"`
          ].join(','))
        ].join('\n');

        // 创建Blob对象
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // 创建下载链接
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `对话分析结果_${new Date().toLocaleString()}.csv`);
        link.style.visibility = 'hidden';
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.$message.success('分析结果导出成功');
      } catch (error) {
        console.error('导出失败:', error);
        this.$message.error('导出失败: ' + error.message);
      }
    }
  },

  created() {
    this.refreshResults();
  }
}
</script>

<style scoped>
.analysis-results {
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

.empty-tip {
  text-align: center;
  padding: 20px;
  color: #909399;
}

:deep(.el-table .cell) {
  white-space: pre-line;
}
</style> 