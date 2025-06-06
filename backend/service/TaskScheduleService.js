class TaskManager{
    constructor(){
        this.tasks = [];
        this.isProcessing = false;
        this.schedulerTimer = null;
        this.checkInterval = 10000;
        this.startPeriodicScheduler();
    }

    startPeriodicScheduler() {
        this.schedulerTimer = setInterval(() => {
            const hasOverdueTasks = this.tasks.some(task => 
                task.scheduledTime && task.scheduledTime <= Date.now()
            );
            
            if (hasOverdueTasks && !this.isProcessing) {
                this.processQueue(); // 自动执行到期任务
            }
        }, this.checkInterval);
    }

    // 添加立即执行的任务
    addTask(taskFunction, taskName = '') {
        const task = {
            func: taskFunction,
            name: taskName,
            scheduledTime: null, // 立即执行
            id: Date.now() + Math.random()
        };
        
        this.tasks.push(task);
        if(!this.isProcessing){
            this.processQueue();
        }
        return task.id;
    }

    // 添加定时任务
    addScheduledTask(taskFunction, scheduledTime, taskName = '') {
        const task = {
            func: taskFunction,
            name: taskName,
            scheduledTime: scheduledTime, // 预定执行时间
            id: Date.now() + Math.random()
        };
        
        this.tasks.push(task);
        console.log(`添加定时任务: ${taskName}, 预定时间: ${new Date(scheduledTime).toLocaleString()}`);
        
        if(!this.isProcessing){
            this.processQueue();
        }
        return task.id;
    }

    // 添加延迟任务（多少毫秒后执行）
    addDelayedTask(taskFunction, delayMs, taskName = '') {
        const scheduledTime = Date.now() + delayMs;
        console.log('添加延时任务，目前时间', Date.now(), ' 延时任务时间 ', scheduledTime);
        return this.addScheduledTask(taskFunction, scheduledTime, taskName);
    }

    async processQueue(){
        this.isProcessing = true;
        while(this.tasks.length > 0){
            // 找出最早的到期定时任务
            let nextScheduledTaskIndex = this.tasks.findIndex(t => 
                t.scheduledTime && t.scheduledTime <= Date.now()
            );
            
            let task;
            if (nextScheduledTaskIndex >= 0) {
                // 有到期的定时任务，优先执行
                task = this.tasks.splice(nextScheduledTaskIndex, 1)[0];
                console.log(`执行定时任务: ${task.name}, 当前时间: ${Date.now()}, 预定时间: ${task.scheduledTime}`);
            } else {
                // 如果没有到期的定时任务，检查下一个任务是否为定时任务
                const nextTask = this.tasks[0];
                if (nextTask && nextTask.scheduledTime) {
                    // 如果是定时任务且未到执行时间，暂停处理队列
                    break;
                }
                task = this.tasks.shift();
            }

            try {
                console.log('开始执行任务:', task.name || task.id);
                await task.func();
                console.log('任务执行完成:', task.name || task.id); 
            } catch(error) {
                console.error('任务执行失败:', task.name || task.id, error);
            }
        }
        this.isProcessing = false;
    }

    // 获取待执行任务列表
    getPendingTasks() {
        return this.tasks.map(task => ({
            id: task.id,
            name: task.name,
            scheduledTime: task.scheduledTime ? new Date(task.scheduledTime).toLocaleString() : '立即执行',
            isReady: !task.scheduledTime || task.scheduledTime <= Date.now()
        }));
    }

    // 取消任务
    cancelTask(taskId) {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index >= 0) {
            const task = this.tasks.splice(index, 1)[0];
            console.log(`取消任务: ${task.name || task.id}`);
            return true;
        }
        return false;
    }
}

module.exports = TaskManager;