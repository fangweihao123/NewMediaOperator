from flask import Flask, request, jsonify, redirect, url_for
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import qrcode
import io
import base64
import requests
import json
import time
import logging
import os

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 抖音开放平台配置
DOUYIN_CLIENT_KEY = os.getenv('DOUYIN_CLIENT_KEY', 'your_client_key')
DOUYIN_CLIENT_SECRET = os.getenv('DOUYIN_CLIENT_SECRET', 'your_client_secret')
DOUYIN_REDIRECT_URI = 'http://localhost:5000/api/callback'  # 回调地址

# 数据库配置
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///douyin.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# 数据模型
class DouyinAccount(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sec_uid = db.Column(db.String(100), unique=True, nullable=False)
    nickname = db.Column(db.String(100))
    avatar = db.Column(db.String(500))
    signature = db.Column(db.String(500))
    access_token = db.Column(db.String(500))  # 添加 access_token 字段
    refresh_token = db.Column(db.String(500))  # 添加 refresh_token 字段
    token_expires = db.Column(db.DateTime)  # 添加 token 过期时间
    create_time = db.Column(db.DateTime, default=datetime.utcnow)
    videos = db.relationship('Video', backref='account', lazy=True)

class Video(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    video_id = db.Column(db.String(100), unique=True, nullable=False)
    des c = db.Column(db.String(500))
    cover_url = db.Column(db.String(500))
    video_url = db.Column(db.String(500))
    create_time = db.Column(db.DateTime, default=datetime.utcnow)
    account_id = db.Column(db.Integer, db.ForeignKey('douyin_account.id'), nullable=False)

# 创建数据库表
try:
    with app.app_context():
        db.create_all()
        logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Error creating database tables: {str(e)}")
    raise

# 生成二维码
@app.route('/api/qrcode', methods=['GET'])
def generate_qrcode():
    try:
        # 生成抖音授权链接
        auth_url = f'https://open.douyin.com/platform/oauth/connect/?client_key={DOUYIN_CLIENT_KEY}&response_type=code&scope=user_info,video.list&redirect_uri={DOUYIN_REDIRECT_URI}&state={int(time.time())}'
        
        # 创建二维码
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(auth_url)
        qr.make(fit=True)
        
        # 创建图片
        img = qr.make_image(fill_color="black", back_color="white")
        
        # 将图片转换为base64
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        logger.info("QR code generated successfully")
        return jsonify({
            'qrcode': img_str,
            'auth_url': auth_url
        })
    except Exception as e:
        logger.error(f"Error generating QR code: {str(e)}")
        return jsonify({'error': str(e)}), 500

# 抖音授权回调
@app.route('/api/callback', methods=['GET'])
def douyin_callback():
    try:
        code = request.args.get('code')
        if not code:
            return jsonify({'error': 'No code provided'}), 400

        # 获取访问令牌
        token_url = 'https://open.douyin.com/oauth/client_token/'
        token_data = {
            'client_key': DOUYIN_CLIENT_KEY,
            'client_secret': DOUYIN_CLIENT_SECRET,
            'grant_type': 'authorization_code',
            'code': code
        }
        
        response = requests.post(token_url, data=token_data)
        token_info = response.json()
        
        if 'error_code' in token_info:
            return jsonify({'error': token_info['description']}), 400

        # 获取用户信息
        user_info_url = 'https://open.douyin.com/oauth/userinfo/'
        headers = {'access-token': token_info['access_token']}
        user_response = requests.get(user_info_url, headers=headers)
        user_info = user_response.json()

        if 'error_code' in user_info:
            return jsonify({'error': user_info['description']}), 400

        # 保存或更新用户信息
        account = DouyinAccount.query.filter_by(sec_uid=user_info['open_id']).first()
        if not account:
            account = DouyinAccount(sec_uid=user_info['open_id'])
        
        account.nickname = user_info.get('nickname')
        account.avatar = user_info.get('avatar')
        account.signature = user_info.get('signature')
        account.access_token = token_info['access_token']
        account.refresh_token = token_info.get('refresh_token')
        account.token_expires = datetime.utcnow() + datetime.timedelta(seconds=token_info['expires_in'])
        
        db.session.add(account)
        db.session.commit()

        # 重定向到前端页面
        return redirect(f'http://localhost:8080/#/auth-success?sec_uid={user_info["open_id"]}')
    except Exception as e:
        logger.error(f"Error in callback: {str(e)}")
        return jsonify({'error': str(e)}), 500

# 检查二维码状态
@app.route('/api/qrcode/status/<qr_id>', methods=['GET'])
def check_qrcode_status(qr_id):
    try:
        # 这里应该实现实际的二维码状态检查逻辑
        # 目前返回模拟数据
        logger.info(f"Checking QR code status for ID: {qr_id}")
        return jsonify({
            'status': 'pending',
            'message': '等待扫码'
        })
    except Exception as e:
        logger.error(f"Error checking QR code status: {str(e)}")
        return jsonify({'error': str(e)}), 500

# 获取账号信息
@app.route('/api/account/<sec_uid>', methods=['GET'])
def get_account_info(sec_uid):
    try:
        account = DouyinAccount.query.filter_by(sec_uid=sec_uid).first()
        if account:
            logger.info(f"Account info retrieved for sec_uid: {sec_uid}")
            return jsonify({
                'id': account.id,
                'sec_uid': account.sec_uid,
                'nickname': account.nickname,
                'avatar': account.avatar,
                'signature': account.signature,
                'create_time': account.create_time.isoformat()
            })
        logger.warning(f"Account not found for sec_uid: {sec_uid}")
        return jsonify({'error': 'Account not found'}), 404
    except Exception as e:
        logger.error(f"Error getting account info: {str(e)}")
        return jsonify({'error': str(e)}), 500

# 获取视频列表
@app.route('/api/videos/<sec_uid>', methods=['GET'])
def get_videos(sec_uid):
    try:
        account = DouyinAccount.query.filter_by(sec_uid=sec_uid).first()
        if not account:
            logger.warning(f"Account not found for sec_uid: {sec_uid}")
            return jsonify({'error': 'Account not found'}), 404
        
        videos = Video.query.filter_by(account_id=account.id).all()
        logger.info(f"Retrieved {len(videos)} videos for account: {sec_uid}")
        return jsonify([{
            'id': video.id,
            'video_id': video.video_id,
            'desc': video.desc,
            'cover_url': video.cover_url,
            'video_url': video.video_url,
            'create_time': video.create_time.isoformat()
        } for video in videos])
    except Exception as e:
        logger.error(f"Error getting videos: {str(e)}")
        return jsonify({'error': str(e)}), 500

# 更新视频列表
@app.route('/api/videos/update/<sec_uid>', methods=['POST'])
def update_videos(sec_uid):
    try:
        account = DouyinAccount.query.filter_by(sec_uid=sec_uid).first()
        if not account:
            logger.warning(f"Account not found for sec_uid: {sec_uid}")
            return jsonify({'error': 'Account not found'}), 404
        
        # 这里应该实现实际的视频爬取逻辑
        # 目前返回模拟数据
        logger.info(f"Video list updated for account: {sec_uid}")
        return jsonify({
            'message': 'Videos updated successfully',
            'count': 0
        })
    except Exception as e:
        logger.error(f"Error updating videos: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    try:
        print("Starting Flask application...")
        logger.info("Starting Flask application...")
        app.run(debug=True, port=5000, host='0.0.0.0')
    except Exception as e:
        print(f"Error starting Flask application: {str(e)}")
        logger.error(f"Error starting Flask application: {str(e)}")
        raise 