#!/bin/bash

# 启动后端服务
cd backend
npm install
npm start &

# 启动前端服务
cd ../frontend
npm install
npm run serve 