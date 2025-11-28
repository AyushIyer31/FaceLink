import os
from dotenv import load_dotenv

# Get the directory where this config file lives (Backend/)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv()

class Config:
    """Configuration class for Flask application"""
    
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = FLASK_ENV == 'development'
    
    # Server
    PORT = int(os.getenv('PORT', 3001))
    HOST = '0.0.0.0'
    
    # Database - Use absolute path to ensure consistent location
    DB_PATH = os.path.join(BASE_DIR, 'instance', 'facelink.db')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', f'sqlite:///{DB_PATH}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = DEBUG  # Log SQL queries in development
    
    # CORS
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    CORS_ORIGINS = [FRONTEND_URL]
    
    # Face Recognition
    RECOGNITION_COOLDOWN_MINUTES = int(os.getenv('RECOGNITION_COOLDOWN_MINUTES', 5))
    FACE_DISTANCE_THRESHOLD = 0.6  # Lower = stricter matching
    
    # File Upload
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    @staticmethod
    def init_app(app):
        """Initialize application with config"""
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(os.path.join(Config.UPLOAD_FOLDER, 'people'), exist_ok=True)
