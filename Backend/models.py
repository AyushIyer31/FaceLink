from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model):
    """User model - represents the dementia patient"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    people = db.relationship('Person', backref='user', lazy=True, cascade='all, delete-orphan')
    timeline_events = db.relationship('TimelineEvent', backref='user', lazy=True, cascade='all, delete-orphan')
    tasks = db.relationship('Task', backref='user', lazy=True, cascade='all, delete-orphan')
    settings = db.relationship('Settings', backref='user', uselist=False, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Person(db.Model):
    """Person model - known people with face encodings"""
    __tablename__ = 'people'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    relationship = db.Column(db.String(100), nullable=False)
    reminder = db.Column(db.Text, nullable=True)
    photo_url = db.Column(db.String(500), nullable=True)
    face_encoding = db.Column(db.Text, nullable=True)  # JSON string of 128-D array
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    recognition_events = db.relationship('TimelineEvent', backref='person', lazy=True)
    
    def to_dict(self, include_encoding=False):
        data = {
            'id': str(self.id),
            'name': self.name,
            'relationship': self.relationship,
            'reminder': self.reminder,
            'photo_url': self.photo_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_encoding and self.face_encoding:
            data['face_encoding'] = json.loads(self.face_encoding)
        return data
    
    def get_face_encoding_array(self):
        """Return face encoding as list of floats"""
        if self.face_encoding:
            return json.loads(self.face_encoding)
        return None
    
    def set_face_encoding_array(self, encoding_array):
        """Set face encoding from list/array"""
        if encoding_array is not None:
            self.face_encoding = json.dumps(encoding_array)
        else:
            self.face_encoding = None


class TimelineEvent(db.Model):
    """Timeline event model - logs recognition and help events"""
    __tablename__ = 'timeline_events'
    
    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(50), nullable=False)  # 'recognition', 'confused', 'unknown_face'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    confidence = db.Column(db.Float, nullable=True)  # Recognition confidence score
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    person_id = db.Column(db.Integer, db.ForeignKey('people.id'), nullable=True)
    
    def to_dict(self):
        data = {
            'id': str(self.id),
            'event_type': self.event_type,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'notes': self.notes,
            'confidence': self.confidence
        }
        if self.person:
            data['person_name'] = self.person.name
            data['person_relationship'] = self.person.relationship
            data['person_id'] = str(self.person_id)
        return data


class Task(db.Model):
    """Task model - calendar items and daily schedule"""
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    time = db.Column(db.String(20), nullable=False)  # e.g., "9:00 AM", "3:00 PM"
    date = db.Column(db.Date, nullable=False)
    completed = db.Column(db.Boolean, default=False)
    reminder = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'title': self.title,
            'description': self.description,
            'time': self.time,
            'date': self.date.isoformat() if self.date else None,
            'completed': self.completed,
            'reminder': self.reminder,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Settings(db.Model):
    """Settings model - home address, reassurance, and location info"""
    __tablename__ = 'settings'
    
    id = db.Column(db.Integer, primary_key=True)
    home_address = db.Column(db.String(500), nullable=False)
    home_label = db.Column(db.String(100), default='home')
    reassurance_message = db.Column(db.Text, nullable=False)
    map_latitude = db.Column(db.Float, nullable=True)
    map_longitude = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # Relationships
    caregivers = db.relationship('Caregiver', backref='settings', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'home_address': self.home_address,
            'home_label': self.home_label,
            'reassurance_message': self.reassurance_message,
            'map_latitude': self.map_latitude,
            'map_longitude': self.map_longitude,
            'caregivers': [c.to_dict() for c in self.caregivers],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Caregiver(db.Model):
    """Caregiver model - emergency contacts"""
    __tablename__ = 'caregivers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    relationship = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), nullable=True)
    is_primary = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    settings_id = db.Column(db.Integer, db.ForeignKey('settings.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'relationship': self.relationship,
            'phone_number': self.phone_number,
            'email': self.email,
            'is_primary': self.is_primary,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class RecognitionCooldown(db.Model):
    """Track last recognition time for each person to implement cooldown"""
    __tablename__ = 'recognition_cooldowns'
    
    id = db.Column(db.Integer, primary_key=True)
    person_id = db.Column(db.Integer, db.ForeignKey('people.id'), nullable=False, unique=True)
    last_recognized_at = db.Column(db.DateTime, nullable=False)
    
    person = db.relationship('Person', backref='cooldown', uselist=False)
    
    def to_dict(self):
        return {
            'person_id': str(self.person_id),
            'last_recognized_at': self.last_recognized_at.isoformat() if self.last_recognized_at else None
        }


class Location(db.Model):
    """Location model - safe places for the patient"""
    __tablename__ = 'locations'
    
    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String(200), nullable=False)
    address = db.Column(db.String(500), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    place_type = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'label': self.label,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'place_type': self.place_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
