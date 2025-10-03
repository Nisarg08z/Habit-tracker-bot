"""
Authentication routes for user registration and login
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash
from database import create_user, get_user_by_username, get_user_by_email, get_user_by_id

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/test-auth', methods=['GET'])
@jwt_required()
def test_auth():
    try:
        user_id = get_jwt_identity()
        print(f"DEBUG: JWT test - User ID: {user_id}")
        return jsonify({'message': f'Auth working! User ID: {user_id}'})
    except Exception as e:
        print(f"DEBUG: JWT test error: {str(e)}")
        return jsonify({'error': f'JWT error: {str(e)}'}), 401

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if get_user_by_username(data['username']):
        return jsonify({'error': 'Username already exists'}), 400
    
    if get_user_by_email(data['email']):
        return jsonify({'error': 'Email already exists'}), 400
    
    user = create_user(data['username'], data['email'], data['password'])
    
    access_token = create_access_token(identity=str(user['_id']))
    return jsonify({
        'message': 'User created successfully',
        'access_token': access_token,
        'user': {
            'id': str(user['_id']),
            'username': user['username'],
            'email': user['email']
        }
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Missing username or password'}), 400
    
    user = get_user_by_username(data['username'])
    
    if user and check_password_hash(user['password_hash'], data['password']):
        access_token = create_access_token(identity=str(user['_id']))
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': str(user['_id']),
                'username': user['username'],
                'email': user['email']
            }
        })
    
    return jsonify({'error': 'Invalid credentials'}), 401
