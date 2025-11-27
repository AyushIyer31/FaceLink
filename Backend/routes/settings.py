from flask import Blueprint, request, jsonify
from models import db, Settings, Caregiver
from utils.helpers import format_response

settings_bp = Blueprint('settings', __name__)

# Mock user ID for hackathon (single user system)
MOCK_USER_ID = 1

@settings_bp.route('/api/settings', methods=['GET'])
def get_settings():
    """Get user settings including caregivers"""
    try:
        settings = Settings.query.filter_by(user_id=MOCK_USER_ID).first()
        
        if not settings:
            # Create default settings if none exist
            settings = Settings(
                home_address="742 Maple Street, Seattle, WA 98102",
                home_label="home",
                reassurance_message="You are at home. Everything is okay.",
                map_latitude=47.6280,
                map_longitude=-122.3270,
                user_id=MOCK_USER_ID
            )
            db.session.add(settings)
            db.session.commit()
        
        return jsonify(format_response(
            success=True,
            data={'settings': settings.to_dict()}
        )), 200
        
    except Exception as e:
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500


@settings_bp.route('/api/settings', methods=['PUT'])
def update_settings():
    """Update settings"""
    try:
        settings = Settings.query.filter_by(user_id=MOCK_USER_ID).first()
        
        if not settings:
            return jsonify(format_response(
                success=False,
                error='Settings not found'
            )), 404
        
        data = request.get_json()
        
        # Update fields
        if 'home_address' in data:
            settings.home_address = data['home_address']
        if 'home_label' in data:
            settings.home_label = data['home_label']
        if 'reassurance_message' in data:
            settings.reassurance_message = data['reassurance_message']
        if 'map_latitude' in data:
            settings.map_latitude = float(data['map_latitude'])
        if 'map_longitude' in data:
            settings.map_longitude = float(data['map_longitude'])
        
        db.session.commit()
        
        return jsonify(format_response(
            success=True,
            data={'settings': settings.to_dict()},
            message='Settings updated successfully'
        )), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500


@settings_bp.route('/api/settings/caregivers', methods=['POST'])
def add_caregiver():
    """Add caregiver contact"""
    try:
        settings = Settings.query.filter_by(user_id=MOCK_USER_ID).first()
        
        if not settings:
            return jsonify(format_response(
                success=False,
                error='Settings not found'
            )), 404
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name') or not data.get('relationship') or not data.get('phone_number'):
            return jsonify(format_response(
                success=False,
                error='Name, relationship, and phone_number are required'
            )), 400
        
        # Create caregiver
        caregiver = Caregiver(
            name=data['name'],
            relationship=data['relationship'],
            phone_number=data['phone_number'],
            email=data.get('email'),
            is_primary=data.get('is_primary', False),
            settings_id=settings.id
        )
        
        db.session.add(caregiver)
        db.session.commit()
        
        return jsonify(format_response(
            success=True,
            data={'caregiver': caregiver.to_dict()},
            message=f'Caregiver "{caregiver.name}" added successfully'
        )), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500


@settings_bp.route('/api/settings/caregivers/<int:caregiver_id>', methods=['PUT'])
def update_caregiver(caregiver_id):
    """Update caregiver"""
    try:
        caregiver = Caregiver.query.get(caregiver_id)
        
        if not caregiver:
            return jsonify(format_response(
                success=False,
                error='Caregiver not found'
            )), 404
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            caregiver.name = data['name']
        if 'relationship' in data:
            caregiver.relationship = data['relationship']
        if 'phone_number' in data:
            caregiver.phone_number = data['phone_number']
        if 'email' in data:
            caregiver.email = data['email']
        if 'is_primary' in data:
            caregiver.is_primary = data['is_primary']
        
        db.session.commit()
        
        return jsonify(format_response(
            success=True,
            data={'caregiver': caregiver.to_dict()},
            message=f'Caregiver "{caregiver.name}" updated successfully'
        )), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500


@settings_bp.route('/api/settings/caregivers/<int:caregiver_id>', methods=['DELETE'])
def delete_caregiver(caregiver_id):
    """Delete caregiver"""
    try:
        caregiver = Caregiver.query.get(caregiver_id)
        
        if not caregiver:
            return jsonify(format_response(
                success=False,
                error='Caregiver not found'
            )), 404
        
        caregiver_name = caregiver.name
        db.session.delete(caregiver)
        db.session.commit()
        
        return jsonify(format_response(
            success=True,
            message=f'Caregiver "{caregiver_name}" deleted successfully'
        )), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500
