<template>
  <div id="app">
    <el-container>
      <el-header>
        <h1>抖音运营助手</h1>
        <div class="header-actions">
          <el-button 
            type="primary" 
            @click="showCreateAccountDialog"
            size="large"
          >
            <el-icon><Plus /></el-icon>
            添加账号
          </el-button>
          <el-dropdown v-if="isBound" trigger="click">
            <div class="account-dropdown">
              <span>{{ accountInfo.user_id }} - {{ accountInfo.name }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="account in accountList" 
                                :key="account.user_id"
                                @click="switchAccount(account)">
                  {{ account.user_id }} - {{ account.name }}
                </el-dropdown-item>
                <el-dropdown-item divided @click="showDeleteAccountDialog">
                  <el-icon><Delete /></el-icon>
                  删除账号
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>

    <!-- 创建账号对话框 -->
    <el-dialog
      v-model="createAccountDialogVisible"
      title="创建新账号"
      width="500px"
    >
      <el-form :model="createAccountForm" label-width="120px" :rules="createAccountRules" ref="createAccountFormRef">
        <el-form-item label="账号名称" prop="name">
          <el-input v-model="createAccountForm.name" placeholder="请输入账号名称"></el-input>
        </el-form-item>
        <el-form-item label="分组ID" prop="group_id">
          <el-input v-model="createAccountForm.group_id" placeholder="分组ID，默认为100" disabled></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createAccountDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleCreateAccount"
            :disabled="isCreatingAccount">
            {{ getCreateAccountButtonText() }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 截图显示对话框 -->
    <el-dialog
      v-model="screenshotDialogVisible"
      title="账号环境预览"
      width="90%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="screenshot-container">
        <div class="screenshot-info">
          <p><strong>环境ID:</strong> {{ currentEnvironmentId }}</p>
          <p><strong>状态:</strong> {{ screenshotStatus }}</p>
        </div>
        <div class="screenshot-display">
          <img 
            v-if="currentScreenshot" 
            :src="currentScreenshot" 
            alt="页面截图"
            class="screenshot-image"
          />
          <div v-else class="screenshot-placeholder">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <p>正在加载截图...</p>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="stopScreenshotPolling">停止轮询</el-button>
          <el-button @click="screenshotDialogVisible = false">关闭</el-button>
          <el-button 
            type="primary" 
            @click="confirmAddAccount">
            确认添加
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除账号对话框 -->
    <el-dialog
      v-model="deleteAccountDialogVisible"
      title="删除账号"
      width="500px"
    >
              <div class="delete-account-content">
          <div class="delete-header">
            <p>请选择要删除的账号：</p>
            <el-button 
              type="info" 
              size="small" 
              @click="checkEnvironmentStatus"
              :loading="isCheckingStatus">
              检查环境状态
            </el-button>
          </div>
          <el-table
            :data="accountList"
            @selection-change="handleSelectionChange"
            style="width: 100%"
          >
            <el-table-column type="selection" width="55"></el-table-column>
            <el-table-column prop="user_id" label="环境ID" width="120"></el-table-column>
            <el-table-column prop="name" label="账号名称"></el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag 
                  :type="scope.row.status === 'running' || scope.row.status === 'active' ? 'danger' : 'success'"
                  size="small">
                  {{ scope.row.status === 'running' || scope.row.status === 'active' ? '使用中' : '可用' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        <div class="delete-warning" v-if="selectedAccounts.length > 0">
          <el-alert
            title="警告"
            type="warning"
            :closable="false"
            show-icon
          >
            <template #default>
              即将删除 {{ selectedAccounts.length }} 个账号，此操作不可恢复！
            </template>
          </el-alert>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteAccountDialogVisible = false">取消</el-button>
          <el-button 
            type="danger" 
            @click="handleDeleteAccounts"
            :disabled="selectedAccounts.length === 0 || isDeletingAccounts">
            {{ getDeleteButtonText() }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ArrowDown, Plus, Loading, Delete } from '@element-plus/icons-vue'
import api from './api/config'
import {reactive, provide } from 'vue'


export default {
  name: 'App',
  components: {
    ArrowDown,
    Plus,
    Loading,
    Delete
  },
  data() {
    return {
      isBound: false,
      accountInfo: {},
      accountList: [],
      createAccountDialogVisible: false,
      isCreatingAccount: false,
      createAccountForm: {
        name: '',
        group_id: '100',
      },
      createAccountRules: {
        name: [
          { required: true, message: '请输入账号名称', trigger: 'blur' },
          { max: 100, message: '账号名称不能超过100个字符', trigger: 'blur' }
        ],
        group_id: [
          { required: true, message: '请输入分组ID', trigger: 'blur' }
        ]
      },
      screenshotDialogVisible: false,
      currentEnvironmentId: '',
      screenshotStatus: '准备中...',
      currentScreenshot: null,
      screenshotInterval: null,
      deleteAccountDialogVisible: false,
      selectedAccounts: [],
      isDeletingAccounts: false,
      isCheckingStatus: false
    }
  },
  setup() {
    const accountState = reactive({
      account_info: {},
      is_loading: false
    })
    provide('accountState', accountState)

    return {
      accountState
    }
  },

  watch:{
    accountInfo: {
      handler(newAccountInfo) {
        console.log("newAccountInfo", newAccountInfo);
        this.accountState.account_info = newAccountInfo;
      }
    }
  },
  
  methods: {
    async getActiveAccount() {
      const response = await api.get('/adsPower/userList');
      this.accountList = response.data.message;
      console.log(this.accountList);
      if(this.accountList.length > 0) {
        this.isBound = true;
        this.accountInfo = this.accountList[0];
      }
    },
    switchAccount(account) {
      this.accountInfo = account;
    },
    addNewAccount() {
      this.$router.push('/bind-account');
    },
    showCreateAccountDialog() {
      this.createAccountDialogVisible = true;
      this.createAccountForm = {
        name: '',
        group_id: '0',
      };
    },
    async handleCreateAccount() {
      try {
        // 表单验证
        await this.$refs.createAccountFormRef.validate();
        
        this.isCreatingAccount = true;
        
        // 准备请求数据
        const requestData = {
          name: this.createAccountForm.name,
          group_id: this.createAccountForm.group_id || '0',
          user_proxy_config: {
            proxy_soft: "no_proxy"
          },
          fingerprint_config: {
            automatic_timezone: "1",
            timezone: "",
            webrtc: "disabled",
            location: "ask",
            location_switch: "1",
            longitude: "",
            latitude: "",
            accuracy: "1000",
            language: ["en-US", "en"],
            language_switch: "1",
            page_language_switch: "1",
            page_language: "native",
            ua: "",
            flash: "block",
            fonts: ["all"],
            screen_resolution: "1920_1080",
            color_depth: "24",
            platform: "Win32",
            timezone_switch: "1",
            webgl_vendor: "Google Inc. (Intel)",
            webgl_renderer: "ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)",
            canvas: "1",
            webgl: "1",
            client_rects: "1",
            device_name_switch: "1",
            random_ua: {
              ua_browser: ["chrome"],
              ua_version: ["99"],
              ua_system_version: ["Windows 10"]
            },
            speech_switch: "1",
            mac_address_config: {
              model: "1",
              address: ""
            },
            browser_kernel_config: {
              version: "ua_auto",
              type: "chrome"
            },
            gpu: "0",
            tls_switch: "0",
            tls: ""
          }
        };

        // 调用AdsPower API创建浏览器环境
        const response = await api.post('/adsPower/create-browser', requestData);

        if (response.data.code === 0) {
          this.currentEnvironmentId = response.data.data.id;
          this.createAccountDialogVisible = false;
          this.screenshotDialogVisible = true;
          this.screenshotStatus = response.data.data.message;
          
          this.$message.success('账号创建成功！');
          
          // 开始轮询截图
          this.startScreenshotPolling(response.data.data.id);
        } else {
          this.$message.error(`创建失败: ${response.data.msg}`);
        }
      } catch (error) {
        console.error('创建账号失败:', error);
        this.$message.error('创建账号失败: ' + (error.response?.data?.error || error.message));
      } finally {
        this.isCreatingAccount = false;
      }
    },
    resetCreateAccountForm() {
      this.createAccountForm = {
        name: '',
        group_id: '100',
      };
    },
    getCreateAccountButtonText() {
      if (this.isCreatingAccount) {
        return '创建中...';
      }
      return '创建账号';
    },

    
    startScreenshotPolling(userId) {
      // 清除之前的定时器
      if (this.screenshotInterval) {
        clearInterval(this.screenshotInterval);
      }
      
      // 设置3秒间隔的截图轮询
      this.screenshotInterval = setInterval(async () => {
        try {
          const response = await api.get(`/adsPower/selenium-screenshot/${userId}`);
          
          if (response.data.code === 0 && response.data.data.screenshot) {
            this.currentScreenshot = `data:image/png;base64,${response.data.data.screenshot}`;
            this.screenshotStatus = '浏览器已启动，抖音页面已打开';
          } else {
            this.screenshotStatus = '正在启动浏览器，请稍候...';
          }
        } catch (error) {
          console.error('截图轮询失败:', error);
          this.screenshotStatus = '正在启动浏览器，请稍候...';
        }
      }, 3000);
    },
    
    stopScreenshotPolling() {
      if (this.screenshotInterval) {
        clearInterval(this.screenshotInterval);
        this.screenshotInterval = null;
      }
      this.screenshotStatus = '已停止轮询';
    },
    
    async confirmAddAccount() {
      // 停止截图轮询
      if (this.screenshotInterval) {
        clearInterval(this.screenshotInterval);
        this.screenshotInterval = null;
      }
      
      // 关闭截图对话框
      this.screenshotDialogVisible = false;
      
      // 重置表单
      this.resetCreateAccountForm();
      
      // 刷新账号列表
      await this.getActiveAccount();
      
      this.$message.success('账号添加成功！');
    },
    
    showDeleteAccountDialog() {
      this.deleteAccountDialogVisible = true;
      this.selectedAccounts = [];
    },
    
    handleSelectionChange(selection) {
      this.selectedAccounts = selection;
    },
    
    async handleDeleteAccounts() {
      if (this.selectedAccounts.length === 0) {
        this.$message.warning('请选择要删除的账号');
        return;
      }
      
      try {
        this.isDeletingAccounts = true;
        
        const user_ids = this.selectedAccounts.map(account => account.user_id);
        
        const response = await api.post('/adsPower/delete-environment', {
          user_ids: user_ids
        });
        
        if (response.data.code === 0) {
          this.$message.success(`成功删除 ${this.selectedAccounts.length} 个账号`);
          this.deleteAccountDialogVisible = false;
          this.selectedAccounts = [];
          
          // 刷新账号列表
          await this.getActiveAccount();
        } else {
          // 处理特殊错误类型
          if (response.data.data && response.data.data.error_type === 'in_use') {
            this.$message.error(response.data.data.message);
            
            // 显示详细错误信息对话框
            this.$alert(
              `删除失败：${response.data.data.message}\n\n` +
              `无法删除的环境ID：${response.data.data.user_ids.join(', ')}\n\n` +
              `解决方案：\n` +
              `1. 关闭相关浏览器窗口\n` +
              `2. 确保没有其他程序正在使用这些环境\n` +
              `3. 重新尝试删除`,
              '删除失败',
              {
                confirmButtonText: '确定',
                type: 'error',
                dangerouslyUseHTMLString: false
              }
            );
          } else {
            this.$message.error(`删除失败: ${response.data.msg}`);
          }
        }
      } catch (error) {
        console.error('删除账号失败:', error);
        this.$message.error('删除账号失败: ' + (error.response?.data?.error || error.message));
      } finally {
        this.isDeletingAccounts = false;
      }
    },
    
    getDeleteButtonText() {
      if (this.isDeletingAccounts) {
        return '删除中...';
      }
      return `删除选中账号 (${this.selectedAccounts.length})`;
    },
    
    async checkEnvironmentStatus() {
      try {
        this.isCheckingStatus = true;
        
        const response = await api.get('/adsPower/check-environment-status');
        
        if (response.data.code === 0) {
          const statusData = response.data.data;
          
          // 更新账号列表中的状态信息
          this.accountList = this.accountList.map(account => {
            const statusInfo = statusData.details.find(detail => detail.user_id === account.user_id);
            return {
              ...account,
              status: statusInfo ? statusInfo.status : 'unknown'
            };
          });
          
          // 显示状态统计信息
          this.$alert(
            `环境状态统计：\n\n` +
            `总环境数：${statusData.total}\n` +
            `使用中：${statusData.in_use.length}\n` +
            `可用：${statusData.available.length}\n\n` +
            `使用中的环境ID：${statusData.in_use.length > 0 ? statusData.in_use.join(', ') : '无'}`,
            '环境状态',
            {
              confirmButtonText: '确定',
              type: 'info'
            }
          );
        } else {
          this.$message.error('检查环境状态失败');
        }
      } catch (error) {
        console.error('检查环境状态失败:', error);
        this.$message.error('检查环境状态失败: ' + error.message);
      } finally {
        this.isCheckingStatus = false;
      }
    }
  },
  created() {
    this.getActiveAccount();
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.el-header {
  background-color: #409EFF;
  color: white;
  line-height: 60px;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

h1 {
  margin: 0;
}

.account-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: white;
}

.nickname {
  margin: 0 8px;
}

.account-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.add-account {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409EFF;
  cursor: pointer;
}

.el-dropdown-menu {
  min-width: 200px;
}

.el-main {
  padding: 20px;
}

.screenshot-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.screenshot-info {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.screenshot-info p {
  margin: 5px 0;
  font-size: 14px;
}

.screenshot-display {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 600px;
  max-height: 800px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border: 2px dashed #dcdfe6;
  overflow: auto;
}

.screenshot-image {
  max-width: 100%;
  max-height: 800px;
  width: auto;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.screenshot-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  color: #909399;
}

.loading-icon {
  font-size: 48px;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.delete-account-content {
  padding: 10px 0;
}

.delete-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.delete-header p {
  margin: 0;
  font-weight: 500;
}

.delete-account-content p {
  margin-bottom: 15px;
  font-weight: 500;
}

.delete-warning {
  margin-top: 15px;
}
</style> 