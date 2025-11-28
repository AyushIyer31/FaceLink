"""
Initialize the database with tables
"""
from app import create_app
from models import db

if __name__ == '__main__':
    app = create_app()
    
    with app.app_context():
        print("🔨 Creating database tables...")
        db.create_all()
        print("✅ Database tables created successfully!")
        print(f"📍 Database location: {app.config['SQLALCHEMY_DATABASE_URI']}")
