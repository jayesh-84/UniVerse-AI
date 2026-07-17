import os
import time
import secrets
from functools import wraps
from flask import request, jsonify
import jwt

SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
if not SECRET_KEY:
    # Use a stable key in development/debug mode, but generate a secure random key in production
    if os.environ.get("FLASK_ENV") == "development" or os.environ.get("FLASK_DEBUG") == "1":
        SECRET_KEY = "universe_smart_secret_token_1882"
    else:
        SECRET_KEY = secrets.token_hex(32)

def generate_jwt(payload, expires_in=3600):
    payload = payload.copy()
    payload["exp"] = int(time.time()) + expires_in
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def verify_jwt(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except Exception:
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        # Fallback to check secure remember_token cookie session
        if not token:
            token = request.cookies.get('remember_token')
        
        if not token:
            return jsonify({'success': False, 'message': 'Authorization token is missing.'}), 401
            
        user_info = verify_jwt(token)
        if not user_info:
            return jsonify({'success': False, 'message': 'Token is invalid or has expired.'}), 401
            
        request.user = user_info
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.user.get('role') != 'Admin':
            return jsonify({'success': False, 'message': 'Admin privileges required.'}), 403
        return f(*args, **kwargs)
    return decorated
