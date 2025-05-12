FROM python:3.9-alpine

WORKDIR /app

# 安装Chrome和ChromeDriver依赖
RUN apk add --no-cache \
    wget \
    gnupg \
    unzip \
    xvfb \
    chromium \
    chromium-chromedriver

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["python", "app.py"] 