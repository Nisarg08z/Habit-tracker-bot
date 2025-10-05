"""
Main Flask application - modular version
"""

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required
from datetime import timedelta
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Import database module
from database import init_db, create_indexes, migrate_user_stats

# Import route blueprints
from routes.auth import auth_bp
from routes.habits import habits_bp
from routes.ai import ai_bp
from routes.stats import stats_bp

# Load environment variables
load_dotenv()

def create_app():
    """Application factory function"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['MONGO_URI'] = os.getenv('MONGO_URI', 'mongodb://localhost:27017/habit_tracker')
    app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
    app.config['JWT_ALGORITHM'] = 'HS256'

    # Initialize extensions
    init_db(app)
    jwt = JWTManager(app)
    # Configure CORS for frontend origin with credentials and preflight support
    
    # near CORS config
    frontend_origin = os.getenv('FRONTEND_ORIGIN', 'http://localhost:3000')
    CORS(
        app,
        resources={r"/api/*": {"origins": [frontend_origin, "http://localhost:3000"]}},
        supports_credentials=True,
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["Content-Type"],
    )

    # Avoid automatic 308 redirects between trailing and non-trailing slash
    app.url_map.strict_slashes = False

    # Configure Gemini AI
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    if gemini_api_key and gemini_api_key != 'your_gemini_api_key_here':
        genai.configure(api_key=gemini_api_key)
    else:
        print("Warning: GEMINI_API_KEY not set. AI features will be disabled.")

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(habits_bp, url_prefix='/api/habits')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(stats_bp, url_prefix='/api/stats')

    # Alias for /api/streak to match frontend calls (maps to stats endpoint)
    @app.route('/api/streak', methods=['GET'])
    @jwt_required()
    def streak_alias():
        # Reuse the stats blueprint handler
        from routes.stats import get_global_streak as _get_global_streak
        return _get_global_streak()

    # Basic routes
    @app.route('/api/test', methods=['GET'])
    def test():
        return jsonify({'message': 'Backend is working!'})

    @app.route('/api/jwt-config', methods=['GET'])
    def jwt_config():
        return jsonify({
            'jwt_secret_set': bool(app.config.get('JWT_SECRET_KEY')),
            'jwt_algorithm': app.config.get('JWT_ALGORITHM', 'HS256'),
            'secret_key_length': len(app.config.get('SECRET_KEY', ''))
        })

    return app

# Create the app instance
app = create_app()

if __name__ == '__main__':
    with app.app_context():
        # Initialize database
        create_indexes()
        migrate_user_stats()
        
    print("Starting modular habit tracker application...")
    app.run(debug=True, port=5000)
