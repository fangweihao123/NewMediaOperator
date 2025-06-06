const AdsPowerService = require('../service/AdsPowerService');
const TaskScheduleService = require('../service/TaskScheduleService');
const SeleniumService = require('../service/seleniumService');

class ServiceManager {
    constructor() {
        this.serviceMap = new Map();
        this.defaultTaskManagerOptions = {
            useSmartScheduling: true,
            checkInterval: 1000,
            maxCheckInterval: 60000
        };
    }

    // 初始化指定profileId的服务
    InitService(profileId, options = {}){
        console.log(`初始化服务，profileId: ${profileId}`);
        
        const adsPowerService = new AdsPowerService(profileId);
        
        // 合并TaskManager配置选项
        const taskManagerOptions = { ...this.defaultTaskManagerOptions, ...options.taskManager };
        const taskScheduleService = new TaskScheduleService(taskManagerOptions);
        
        const seleniumService = new SeleniumService(adsPowerService);

        const Service = {
            adsPowerService: adsPowerService,
            taskScheduleService: taskScheduleService,
            seleniumService: seleniumService,
            profileId: profileId,
            createdAt: Date.now()
        }
        
        this.serviceMap.set(profileId, Service);
        console.log(`服务初始化完成，profileId: ${profileId}`);
        
        return Service;
    }

    // 获取指定profileId的服务
    getService(profileId){
        if (!this.serviceMap.has(profileId)) {
            console.log(`服务不存在，自动初始化，profileId: ${profileId}`);
            return this.InitService(profileId);
        }
        return this.serviceMap.get(profileId);
    }

    // 获取指定profileId的TaskManager
    getTaskManager(profileId) {
        const service = this.getService(profileId);
        return service.taskScheduleService;
    }

    // 为指定profileId添加立即任务
    addTask(profileId, taskFunction, taskName = '') {
        const taskManager = this.getTaskManager(profileId);
        return taskManager.addTask(taskFunction, `[${profileId}] ${taskName}`);
    }

    // 为指定profileId添加延时任务
    addDelayedTask(profileId, taskFunction, delayMs, taskName = '') {
        const taskManager = this.getTaskManager(profileId);
        return taskManager.addDelayedTask(taskFunction, delayMs, `[${profileId}] ${taskName}`);
    }

    // 为指定profileId添加定时任务
    addScheduledTask(profileId, taskFunction, scheduledTime, taskName = '') {
        const taskManager = this.getTaskManager(profileId);
        return taskManager.addScheduledTask(taskFunction, scheduledTime, `[${profileId}] ${taskName}`);
    }

    // 获取指定profileId的任务状态
    getTaskStatus(profileId) {
        const taskManager = this.getTaskManager(profileId);
        return {
            pendingTasks: taskManager.getPendingTasks(),
            schedulerStatus: taskManager.getSchedulerStatus(),
            detailedStats: taskManager.getDetailedStats()
        };
    }

    // 取消指定profileId的任务
    cancelTask(profileId, taskId) {
        const taskManager = this.getTaskManager(profileId);
        return taskManager.cancelTask(taskId);
    }

    // 强制执行指定profileId的到期任务
    async forceExecuteOverdueTasks(profileId) {
        const taskManager = this.getTaskManager(profileId);
        return await taskManager.forceExecuteOverdueTasks();
    }

    // 切换指定profileId的调度模式
    switchSchedulingMode(profileId, useSmartScheduling = true) {
        const taskManager = this.getTaskManager(profileId);
        return taskManager.switchSchedulingMode(useSmartScheduling);
    }

    // 获取所有活跃的profileId
    getActiveProfiles() {
        return Array.from(this.serviceMap.keys());
    }

    // 获取所有服务的概览
    getAllServicesOverview() {
        const overview = {};
        
        for (const [profileId, service] of this.serviceMap) {
            const taskStatus = this.getTaskStatus(profileId);
            overview[profileId] = {
                profileId,
                createdAt: new Date(service.createdAt).toLocaleString(),
                hasAdsPowerService: !!service.adsPowerService,
                hasSeleniumService: !!service.seleniumService,
                taskManager: {
                    isRunning: taskStatus.schedulerStatus.isRunning,
                    isProcessing: taskStatus.schedulerStatus.isProcessing,
                    totalTasks: taskStatus.schedulerStatus.totalTasks,
                    useSmartScheduling: taskStatus.schedulerStatus.useSmartScheduling
                }
            };
        }
        
        return overview;
    }

    // 关闭指定profileId的服务
    async closeService(profileId) {
        if (!this.serviceMap.has(profileId)) {
            return false;
        }

        try {
            const service = this.serviceMap.get(profileId);
            
            // 清理TaskManager
            if (service.taskScheduleService) {
                const taskCount = service.taskScheduleService.cleanup();
                console.log(`TaskManager已清理，profileId: ${profileId}, 任务数: ${taskCount}`);
            }

            // 关闭AdsPowerService
            if (service.adsPowerService) {
                await service.adsPowerService.closeBrowser();
                console.log(`AdsPowerService已关闭，profileId: ${profileId}`);
            }

            // 删除服务记录
            this.serviceMap.delete(profileId);
            console.log(`服务已删除，profileId: ${profileId}`);
            
            return true;
        } catch (error) {
            console.error(`关闭服务失败，profileId: ${profileId}`, error);
            throw error;
        }
    }

    // 关闭所有服务
    async closeAllServices() {
        const profiles = this.getActiveProfiles();
        const results = {};
        
        for (const profileId of profiles) {
            try {
                results[profileId] = await this.closeService(profileId);
            } catch (error) {
                results[profileId] = { error: error.message };
            }
        }
        
        return results;
    }

    // 重新初始化服务
    async reinitializeService(profileId, options = {}) {
        console.log(`重新初始化服务，profileId: ${profileId}`);
        
        // 先关闭现有服务
        await this.closeService(profileId);
        
        // 重新初始化
        return this.InitService(profileId, options);
    }

    // 检查服务健康状态
    checkServiceHealth(profileId) {
        if (!this.serviceMap.has(profileId)) {
            return { healthy: false, reason: '服务不存在' };
        }

        const service = this.serviceMap.get(profileId);
        const taskStatus = this.getTaskStatus(profileId);
        
        return {
            healthy: true,
            profileId,
            adsPowerService: {
                exists: !!service.adsPowerService,
                hasDriver: !!(service.adsPowerService && service.adsPowerService.driver)
            },
            seleniumService: {
                exists: !!service.seleniumService
            },
            taskManager: {
                isRunning: taskStatus.schedulerStatus.isRunning,
                isProcessing: taskStatus.schedulerStatus.isProcessing,
                totalTasks: taskStatus.schedulerStatus.totalTasks,
                overdueTasks: taskStatus.schedulerStatus.overdueTasks
            }
        };
    }

    // 批量添加任务
    addBatchTasks(profileId, tasks) {
        const taskIds = [];
        const taskManager = this.getTaskManager(profileId);
        
        tasks.forEach((task, index) => {
            const { type, func, delay = 0, scheduledTime, name } = task;
            const taskName = name || `批量任务${index + 1}`;
            
            let taskId;
            if (type === 'immediate') {
                taskId = taskManager.addTask(func, `[${profileId}] ${taskName}`);
            } else if (type === 'delayed') {
                taskId = taskManager.addDelayedTask(func, delay, `[${profileId}] ${taskName}`);
            } else if (type === 'scheduled') {
                taskId = taskManager.addScheduledTask(func, scheduledTime, `[${profileId}] ${taskName}`);
            }
            
            if (taskId) {
                taskIds.push({ index, taskId, name: taskName });
            }
        });
        
        return taskIds;
    }
}

const serviceManager = new ServiceManager();
module.exports = serviceManager;