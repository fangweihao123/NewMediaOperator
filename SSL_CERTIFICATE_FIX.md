# SSL证书问题修复说明

## 问题描述

在上传素材时遇到 `certificate has expired` 错误，这是因为某些HTTPS链接的SSL证书已过期，导致axios无法验证证书的有效性。

## 解决方案

### 1. 修改axios配置

在所有使用axios下载文件的函数中添加了SSL证书验证忽略配置：

```javascript
const response = await axios({
    url: url,
    method: 'GET',
    responseType: 'stream',
    timeout: 300000, // 5分钟超时
    maxContentLength: 500 * 1024 * 1024, // 500MB限制
    httpsAgent: new https.Agent({
        rejectUnauthorized: false // 忽略SSL证书验证
    })
});
```

### 2. 修改的文件

#### backend/router/MaterialRouter.js
- 添加了 `createAxiosConfig` 函数来统一管理axios配置
- 修改了单个链接上传和批量链接上传的axios调用
- 添加了 `https` 模块导入

#### backend/router/VideoRouter.js
- 添加了 `https` 模块导入
- 修改了 `downloadVideo` 函数的axios配置
- 添加了 `downloadVideoFromUrl` 函数（之前缺失）

### 3. 修复的函数

1. **MaterialRouter.js**:
   - `router.post('/uploadUrl')` - 单个链接上传
   - `router.post('/uploadUrls')` - 批量链接上传

2. **VideoRouter.js**:
   - `downloadVideo()` - AI视频下载
   - `downloadVideoFromUrl()` - 视频链接下载（新增）

## 安全考虑

虽然忽略SSL证书验证可以解决证书过期的问题，但这会降低安全性。在生产环境中，建议：

1. 使用有效的SSL证书
2. 定期更新证书
3. 考虑使用代理服务器来处理证书问题
4. 对敏感数据进行额外的安全验证

## 测试

修复后，应该能够正常上传以下类型的链接：
- HTTPS链接（即使证书过期）
- HTTP链接
- 各种文件格式的链接

## 注意事项

1. 这个修复只影响文件下载功能，不会影响其他HTTPS请求
2. 如果遇到其他SSL相关错误，可能需要进一步调整配置
3. 建议在生产环境中使用更安全的解决方案 