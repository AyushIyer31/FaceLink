from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config
from models import db
import os

def create_app(config_class=Config):
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    
    # CORS configuration - Allow all origins in development
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",  # Allow all origins in development
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        },
        r"/health": {
            "origins": "*"
        }
    })
    
    # Initialize config
    Config.init_app(app)
    
    # Register blueprints
    from routes.people import people_bp
    from routes.recognize import recognize_bp
    from routes.timeline import timeline_bp
    from routes.tasks import tasks_bp
    from routes.settings import settings_bp
    from routes.help import help_bp
    from routes.locations import locations_bp
    
    app.register_blueprint(people_bp)
    app.register_blueprint(recognize_bp)
    app.register_blueprint(timeline_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(help_bp)
    app.register_blueprint(locations_bp)
    
    # Serve uploaded images
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        """Serve uploaded images"""
        uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
        return send_from_directory(uploads_dir, filename)
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return {'status': 'healthy', 'message': 'FaceLink backend is running'}, 200
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        return {
            'message': 'FaceLink API',
            'version': '1.0.0',
            'endpoints': {
                'health': '/health',
                'people': '/api/people',
                'recognize': '/api/recognize',
                'timeline': '/api/timeline',
                'tasks': '/api/tasks',
                'settings': '/api/settings',
                'help': '/api/help'
            }
        }, 200
    
    # Create database tables
    with app.app_context():
        db.create_all()
        
        # Auto-create default user if not exists
        from models import User, Location
        if not User.query.filter_by(id=1).first():
            default_user = User(id=1, email='patient@facelink.app', name='Patient')
            db.session.add(default_user)
            db.session.commit()
            print("✅ Default user created")
        
        # Seed locations if none exist
        if Location.query.count() == 0:
            sample_locations = [
                Location(label="Home", address="123 Main Street", latitude=37.7749, longitude=-122.4194, place_type="home", user_id=1),
                Location(label="Doctor's Office", address="456 Health Ave", latitude=37.7849, longitude=-122.4094, place_type="medical", user_id=1),
                Location(label="Pharmacy", address="789 Care Blvd", latitude=37.7649, longitude=-122.4294, place_type="pharmacy", user_id=1),
                Location(label="Park", address="Central Park", latitude=37.7549, longitude=-122.4394, place_type="recreation", user_id=1),
                Location(label="Grocery Store", address="321 Market St", latitude=37.7949, longitude=-122.3994, place_type="shopping", user_id=1),
            ]
            db.session.add_all(sample_locations)
            db.session.commit()
            print("✅ Sample locations seeded")
        
        print("✅ Database tables created successfully")
    
    return app


if __name__ == '__main__':
    app = create_app()
    port = app.config['PORT']
    host = app.config['HOST']
    debug = app.config['DEBUG']
    
    # Debug: show the actual database path
    import os
    db_uri = app.config['SQLALCHEMY_DATABASE_URI']
    print(f"\n🚀 FaceLink Backend Starting...")
    print(f"📍 Server: http://{host if host != '0.0.0.0' else 'localhost'}:{port}")
    print(f"🔧 Environment: {app.config['FLASK_ENV']}")
    print(f"💾 Database URI: {db_uri}")
    print(f"💾 Instance Path: {app.instance_path}")
    print(f"🌐 CORS Origins: {app.config['CORS_ORIGINS']}\n")
    
    app.run(host=host, port=port, debug=debug)
