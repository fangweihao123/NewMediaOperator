const express = require('express');
const AdsPowerService = require('../service/AdsPowerService');
const serviceManager = require('../Manager/ServiceManager');
const axios = require('axios');

module.exports = () => {
    const router = express.Router();
    
    // 连接到AdsPower浏览器 开启新的service
    router.post('/connect', async (req, res) => {
        try {
            const { profileId } = req.body;
            serviceManager.InitService(profileId);
            const service = serviceManager.getService(profileId);
            service.adsPowerService.connectToAdsPower();
            service.seleniumService.fetchVideoInfoTimer(service.taskScheduleService);
            res.json({ status: 'success', message: '连接成功' });
        } catch (error) {
            console.error('连接失败:', error);
            res.status(500).json({ error: error.message });
        }
    });


    // 关闭浏览器
    router.post('/close', async (req, res) => {
        try {
            await seleniumService.closeBrowser();
            res.json({ status: 'success', message: '浏览器已关闭' });
        } catch (error) {
            console.error('关闭浏览器失败:', error);
            res.status(500).json({ error: error.message });
        }
    });

    
    router.get('/userList', async (req, res) => {
        const response = await AdsPowerService.getOpenBrowserList();
        res.json({  status: 'success', message: response });
    });

    // AdsPower API配置
    const ADSPOWER_API_BASE = 'http://local.adspower.net:50325';
    
    // 创建浏览器环境
    router.post('/create-browser', async (req, res) => {
        try {
            const requestData = req.body;
            
            // 如果没有指定group_id或group_id为100，尝试创建默认分组
            if (!requestData.group_id || requestData.group_id === '100') {
                try {
                    // 先尝试创建默认分组
                    await axios.post(`${ADSPOWER_API_BASE}/api/v1/group/create`, {
                        group_name: '默认分组'
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    });
                    
                    // 获取分组列表以找到刚创建的分组ID
                    const groupResponse = await axios.get(`${ADSPOWER_API_BASE}/api/v1/group/list`, {
                        timeout: 10000
                    });
                    
                    if (groupResponse.data.code === 0 && groupResponse.data.data.list) {
                        const defaultGroup = groupResponse.data.data.list.find(group => group.group_name === '默认分组');
                        if (defaultGroup) {
                            requestData.group_id = defaultGroup.group_id;
                        }
                    }
                } catch (groupError) {
                    console.log('创建默认分组失败，使用group_id=1:', groupError.message);
                    requestData.group_id = '1'; // 使用group_id=1作为备选
                }
            }
            
            // 调用AdsPower API创建浏览器环境
            const createResponse = await axios.post(`${ADSPOWER_API_BASE}/api/v1/user/create`, requestData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30秒超时
            });

            if (createResponse.data.code === 0) {
                const userId = createResponse.data.data.id;
                
                // 立即返回创建成功的结果
                res.json({
                    code: 0,
                    data: {
                        id: userId,
                        status: 'created',
                        message: '环境创建成功，正在后台启动浏览器...'
                    },
                    msg: 'Success'
                });
                
                // 在后台异步处理后续步骤
                setTimeout(async () => {
                    try {
                        // 更新环境信息
                        const updateRequestData = {
                            user_id: userId,
                            domain_name: 'douyin.com',
                            open_urls: ['https://www.douyin.com/user/self?from_tab_name=main'],
                            remark: '抖音运营助手创建的环境'
                        };

                        await axios.post(`${ADSPOWER_API_BASE}/api/v1/user/update`, updateRequestData, {
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            timeout: 30000
                        });
                        
                        console.log('环境信息更新成功');
                        
                        // 启动浏览器
                        const startResponse = await axios.get(`${ADSPOWER_API_BASE}/api/v1/browser/start`, {
                            params: {
                                user_id: userId
                            },
                            timeout: 30000
                        });
                        
                        if (startResponse.data.code === 0) {
                            console.log('浏览器启动成功');
                            
                            // 使用AdsPowerService启动浏览器并打开抖音页面
                            try {
                                const AdsPowerService = require('../service/AdsPowerService');
                                const serviceManager = require('../Manager/ServiceManager');
                                
                                // 使用新的方法启动浏览器并打开抖音页面
                                const { driver, debugPort } = await AdsPowerService.startBrowserAndOpenDouyin(userId);
                                
                                // 确保服务正确设置
                                await AdsPowerService.ensureServiceSetup(userId, driver, debugPort, serviceManager);
                                
                                console.log('抖音页面打开成功，服务设置完成');
                            } catch (seleniumError) {
                                console.error('使用Selenium打开抖音页面失败:', seleniumError.message);
                            }
                        }
                    } catch (error) {
                        console.error('后台处理失败:', error.message);
                    }
                }, 1000);
                
            } else {
                // 创建环境失败
                res.json(createResponse.data);
            }
        } catch (error) {
            console.error('AdsPower API调用失败:', error);
            
            if (error.response) {
                // AdsPower API返回了错误响应
                res.status(error.response.status).json({
                    code: -1,
                    data: {},
                    msg: error.response.data?.msg || 'AdsPower API调用失败'
                });
            } else if (error.code === 'ECONNREFUSED') {
                // 连接被拒绝，可能是AdsPower没有运行
                res.status(500).json({
                    code: -1,
                    data: {},
                    msg: '无法连接到AdsPower，请确保AdsPower正在运行'
                });
            } else {
                // 其他错误
                res.status(500).json({
                    code: -1,
                    data: {},
                    msg: error.message || '创建浏览器环境失败'
                });
            }
        }
    });

    // 获取浏览器环境列表
    router.get('/browsers', async (req, res) => {
        try {
            const response = await axios.get(`${ADSPOWER_API_BASE}/api/v1/user/list`, {
                timeout: 10000
            });
            
            res.json(response.data);
        } catch (error) {
            console.error('获取浏览器列表失败:', error);
            res.status(500).json({
                code: -1,
                data: {},
                msg: '获取浏览器列表失败'
            });
        }
    });

    // 启动浏览器
    router.get('/start-browser', async (req, res) => {
        try {
            const { user_id } = req.query;
            
            if (!user_id) {
                return res.status(400).json({
                    code: -1,
                    data: {},
                    msg: 'user_id is required'
                });
            }

            const response = await axios.get(`${ADSPOWER_API_BASE}/api/v1/browser/start`, {
                params: {
                    user_id: user_id
                },
                timeout: 30000
            });

            res.json(response.data);
        } catch (error) {
            console.error('启动浏览器失败:', error);
            res.status(500).json({
                code: -1,
                data: {},
                msg: '启动浏览器失败'
            });
        }
    });

    // 停止浏览器
    router.post('/stop-browser', async (req, res) => {
        try {
            const { user_id } = req.body;
            
            if (!user_id) {
                return res.status(400).json({
                    code: -1,
                    data: {},
                    msg: 'user_id is required'
                });
            }

            const response = await axios.post(`${ADSPOWER_API_BASE}/api/v1/browser/stop`, {
                user_id: user_id
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            res.json(response.data);
        } catch (error) {
            console.error('停止浏览器失败:', error);
            res.status(500).json({
                code: -1,
                data: {},
                msg: '停止浏览器失败'
            });
        }
    });



    // 更新环境信息
    router.post('/update-environment', async (req, res) => {
        try {
            const { user_id, updateData } = req.body;
            
            if (!user_id) {
                return res.status(400).json({
                    code: -1,
                    data: {},
                    msg: 'user_id is required'
                });
            }

            // 准备更新数据
            const updateRequestData = {
                user_id: user_id,
                domain_name: 'douyin.com',
                open_urls: ['https://www.douyin.com/user/self?from_tab_name=main'],
                remark: '抖音运营助手创建的环境'
            };

            // 合并传入的更新数据
            if (updateData) {
                Object.assign(updateRequestData, updateData);
            }

            // 调用AdsPower API更新环境信息
            const response = await axios.post(`${ADSPOWER_API_BASE}/api/v1/user/update`, updateRequestData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            res.json(response.data);
        } catch (error) {
            console.error('更新环境信息失败:', error);
            
            if (error.response) {
                res.status(error.response.status).json({
                    code: -1,
                    data: {},
                    msg: error.response.data?.msg || '更新环境信息失败'
                });
            } else {
                res.status(500).json({
                    code: -1,
                    data: {},
                    msg: error.message || '更新环境信息失败'
                });
            }
        }
    });

    // 获取截图
    router.get('/screenshot/:user_id', async (req, res) => {
        try {
            const { user_id } = req.params;
            
            if (!user_id) {
                return res.status(400).json({
                    code: -1,
                    data: {},
                    msg: 'user_id is required'
                });
            }

            // 使用AdsPower的API获取截图
            const response = await axios.get(`${ADSPOWER_API_BASE}/api/v1/browser/screenshot`, {
                params: {
                    user_id: user_id
                },
                timeout: 10000
            });

            res.json(response.data);
        } catch (error) {
            console.error('获取截图失败:', error);
            res.status(500).json({
                code: -1,
                data: {},
                msg: '获取截图失败'
            });
        }
    });

    // 获取分组列表
    router.get('/groups', async (req, res) => {
        try {
            const response = await axios.get(`${ADSPOWER_API_BASE}/api/v1/group/list`, {
                timeout: 10000
            });
            
            res.json(response.data);
        } catch (error) {
            console.error('获取分组列表失败:', error);
            res.status(500).json({
                code: -1,
                data: {},
                msg: '获取分组列表失败'
            });
        }
    });

    // 创建分组
    router.post('/create-group', async (req, res) => {
        try {
            const { group_name } = req.body;
            
            if (!group_name) {
                return res.status(400).json({
                    code: -1,
                    data: {},
                    msg: 'group_name is required'
                });
            }

            const response = await axios.post(`${ADSPOWER_API_BASE}/api/v1/group/create`, {
                group_name: group_name
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            res.json(response.data);
        } catch (error) {
            console.error('创建分组失败:', error);
            res.status(500).json({
                code: -1,
                data: {},
                msg: '创建分组失败'
            });
        }
    });

    // 获取Selenium截图
    router.get('/selenium-screenshot/:user_id', async (req, res) => {
        try {
            const { user_id } = req.params;
            
            if (!user_id) {
                return res.status(400).json({
                    code: -1,
                    data: {},
                    msg: 'user_id is required'
                });
            }

            // 使用现有的AdsPowerService来获取截图
            const AdsPowerService = require('../service/AdsPowerService');
            const serviceManager = require('../Manager/ServiceManager');
            
            // 获取或创建服务
            let service = serviceManager.getService(user_id);
            if (!service) {
                // 如果服务不存在，尝试连接
                try {
                    const { driver, debugPort } = await AdsPowerService.connectToAdsPower(user_id);
                    service = serviceManager.getService(user_id);
                    if (service) {
                        service.adsPowerService.driver = driver;
                        service.adsPowerService.debugPort = debugPort;
                    }
                } catch (connectError) {
                    console.error('连接AdsPower失败:', connectError);
                    return res.status(500).json({
                        code: -1,
                        data: {},
                        msg: '连接AdsPower失败'
                    });
                }
            }

            if (service && service.adsPowerService.driver) {
                // 设置窗口大小以获得更大的截图
                await service.adsPowerService.driver.manage().window().setRect({
                    width: 1920,
                    height: 1080
                });
                
                // 等待窗口调整完成
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // 使用Selenium获取高分辨率截图
                const screenshot = await service.adsPowerService.driver.takeScreenshot();
                
                res.json({
                    code: 0,
                    data: {
                        screenshot: screenshot,
                        status: 'success'
                    },
                    msg: 'Success'
                });
            } else {
                res.status(500).json({
                    code: -1,
                    data: {},
                    msg: '浏览器未启动或连接失败'
                });
            }
        } catch (error) {
            console.error('获取Selenium截图失败:', error);
            res.status(500).json({
                code: -1,
                data: {},
                msg: '获取截图失败'
            });
        }
    });

    // 删除环境
    router.post('/delete-environment', async (req, res) => {
        try {
            const { user_ids } = req.body;
            
            if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
                return res.status(400).json({
                    code: -1,
                    data: {},
                    msg: 'user_ids is required and must be a non-empty array'
                });
            }

            // 检查删除数量限制（不能超过100个）
            if (user_ids.length > 100) {
                return res.status(400).json({
                    code: -1,
                    data: {},
                    msg: 'Cannot delete more than 100 environments at once'
                });
            }

            // 调用AdsPower API删除环境
            const response = await axios.post(`${ADSPOWER_API_BASE}/api/v1/user/delete`, {
                user_ids: user_ids
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            // 如果删除失败，尝试获取更详细的错误信息
            if (response.data.code !== 0) {
                console.error('AdsPower删除环境失败:', response.data);
                
                // 检查是否是"正在使用"的错误
                if (response.data.msg && response.data.msg.includes('is being used')) {
                    return res.json({
                        code: -1,
                        data: {
                            error_type: 'in_use',
                            user_ids: user_ids,
                            message: '选中的环境正在被使用，无法删除。请先关闭相关浏览器窗口。'
                        },
                        msg: response.data.msg
                    });
                }
            }

            res.json(response.data);
        } catch (error) {
            console.error('删除环境失败:', error);
            
            if (error.response) {
                res.status(error.response.status).json({
                    code: -1,
                    data: {},
                    msg: error.response.data?.msg || '删除环境失败'
                });
            } else {
                res.status(500).json({
                    code: -1,
                    data: {},
                    msg: error.message || '删除环境失败'
                });
            }
        }
    });

    // 检查环境状态
    router.get('/check-environment-status', async (req, res) => {
        try {
            // 获取所有环境列表
            const response = await axios.get(`${ADSPOWER_API_BASE}/api/v1/user/list`, {
                params: {
                    page_size: 1000
                },
                timeout: 10000
            });

            if (response.data.code === 0) {
                const environments = response.data.data.list || [];
                
                // 分析环境状态
                const statusAnalysis = {
                    total: environments.length,
                    in_use: [],
                    available: [],
                    details: environments.map(env => ({
                        user_id: env.user_id,
                        name: env.name,
                        status: env.status || 'unknown',
                        is_in_use: env.status === 'running' || env.status === 'active'
                    }))
                };

                // 分类环境
                environments.forEach(env => {
                    if (env.status === 'running' || env.status === 'active') {
                        statusAnalysis.in_use.push(env.user_id);
                    } else {
                        statusAnalysis.available.push(env.user_id);
                    }
                });

                res.json({
                    code: 0,
                    data: statusAnalysis,
                    msg: 'Success'
                });
            } else {
                res.json(response.data);
            }
        } catch (error) {
            console.error('检查环境状态失败:', error);
            res.status(500).json({
                code: -1,
                data: {},
                msg: '检查环境状态失败'
            });
        }
    });

    return router;
}