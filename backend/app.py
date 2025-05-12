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

class AuthInfo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(100))

# 创建数据库表
try:
    with app.app_context():
        db.create_all()
        logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Error creating database tables: {str(e)}")
    raise

@app.route('/api/auth', methods=['GET'])
def GetAuthCode():
    try:
        authUrl = f'https://open.douyin.com/platform/oauth/connect?client_key=aw48uuo6r8xm48xb&response_type=code&scope=trial.whitelist&redirect_uri=https://5001-116-148-240-41.ngrok-free.app/auth-success'
        return jsonify({
            'authUrl': authUrl
        })
    except Exception as e:
        logger.error(f"Error Get AuthUrl:{str(e)}")
        return jsonify({'error': str(e)}), 500

# 抖音授权回调
@app.route('/api/auth/callback', methods=['POST'])
def douyin_code_callback():
    try:
        data = request.get_json()
        code = data.get('code')
        state = data.get('state')
        logger.info(f"receive code: {code}, state: {state}")
        return jsonify({
            'status': 'success',
            'code': code,
            'state': state
        })
    except Exception as e:
        logger.error(f"Error in callback: {str(e)}")
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