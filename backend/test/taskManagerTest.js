const TaskManager = require('../service/TaskScheduleService');

// 测试延时任务的执行
async function testDelayedTasks() {
    console.log('=== 测试延时任务执行 ===');
    
    // 创建TaskManager实例（使用智能调度）
    const taskManager = new TaskManager({ 
        useSmartScheduling: true,
        checkInterval: 500 // 0.5秒检查一次
    });

    console.log('添加延时任务...');

    // 添加3个延时任务
    const task1 = taskManager.addDelayedTask(async () => {
        console.log('✅ 任务1执行 - 2秒延时');
    }, 2000, '2秒延时任务');

    const task2 = taskManager.addDelayedTask(async () => {
        console.log('✅ 任务2执行 - 5秒延时');
    }, 5000, '5秒延时任务');

    const task3 = taskManager.addDelayedTask(async () => {
        console.log('✅ 任务3执行 - 1秒延时');
    }, 1000, '1秒延时任务');

    console.log('当前调度器状态:', taskManager.getSchedulerStatus());
    console.log('待执行任务:', taskManager.getPendingTasks());

    // 等待所有任务完成
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    console.log('最终状态:', taskManager.getSchedulerStatus());
    taskManager.cleanup();
}

// 测试只有延时任务的场景
async function testOnlyDelayedTasks() {
    console.log('\n=== 测试只有延时任务的场景 ===');
    
    const taskManager = new TaskManager({ useSmartScheduling: true });

    // 只添加延时任务，不添加立即任务
    taskManager.addDelayedTask(async () => {
        console.log('✅ 延时任务执行成功！');
    }, 3000, '3秒后执行的任务');

    console.log('添加延时任务后的状态:', taskManager.getSchedulerStatus());
    
    // 等待任务执行
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    console.log('任务执行后的状态:', taskManager.getSchedulerStatus());
    taskManager.cleanup();
}

// 测试周期性调度模式
async function testPeriodicScheduling() {
    console.log('\n=== 测试周期性调度模式 ===');
    
    const taskManager = new TaskManager({ 
        useSmartScheduling: false, // 使用周期性调度
        checkInterval: 1000 // 1秒检查一次
    });

    // 添加延时任务
    taskManager.addDelayedTask(async () => {
        console.log('✅ 周期性调度 - 任务执行成功！');
    }, 2500, '周期性调度测试任务');

    console.log('周期性调度状态:', taskManager.getSchedulerStatus());
    
    // 等待任务执行
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    taskManager.cleanup();
}

// 测试混合任务（立即任务 + 延时任务）
async function testMixedTasks() {
    console.log('\n=== 测试混合任务 ===');
    
    const taskManager = new TaskManager({ useSmartScheduling: true });

    // 添加立即任务
    taskManager.addTask(async () => {
        console.log('✅ 立即任务执行');
    }, '立即任务');

    // 添加延时任务
    taskManager.addDelayedTask(async () => {
        console.log('✅ 延时任务执行');
    }, 2000, '延时任务');

    // 再添加一个立即任务
    setTimeout(() => {
        taskManager.addTask(async () => {
            console.log('✅ 后添加的立即任务执行');
        }, '后添加的立即任务');
    }, 1000);

    console.log('混合任务状态:', taskManager.getSchedulerStatus());
    
    // 等待所有任务完成
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    taskManager.cleanup();
}

// 测试任务取消
async function testTaskCancellation() {
    console.log('\n=== 测试任务取消 ===');
    
    const taskManager = new TaskManager({ useSmartScheduling: true });

    // 添加一个延时任务
    const taskId = taskManager.addDelayedTask(async () => {
        console.log('❌ 这个任务不应该执行（已被取消）');
    }, 3000, '将被取消的任务');

    console.log('添加任务后:', taskManager.getSchedulerStatus());
    
    // 1秒后取消任务
    setTimeout(() => {
        const cancelled = taskManager.cancelTask(taskId);
        console.log('任务取消结果:', cancelled);
        console.log('取消后状态:', taskManager.getSchedulerStatus());
    }, 1000);

    // 等待原定的任务执行时间
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    taskManager.cleanup();
}

// 运行所有测试
async function runAllTests() {
    try {
        await testDelayedTasks();
        await testOnlyDelayedTasks();
        await testPeriodicScheduling();
        await testMixedTasks();
        await testTaskCancellation();
        
        console.log('\n🎉 所有测试完成！');
    } catch (error) {
        console.error('测试失败:', error);
    }
}

// 如果直接运行此文件
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testDelayedTasks,
    testOnlyDelayedTasks,
    testPeriodicScheduling,
    testMixedTasks,
    testTaskCancellation
}; 