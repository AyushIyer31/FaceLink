from flask import Blueprint, request, jsonify
from models import db, Person, User
from services.face_service import FaceRecognitionService
from utils.helpers import save_base64_image, delete_image, format_response
import numpy as np

people_bp = Blueprint('people', __name__)

# Mock user ID for hackathon (single user system)
MOCK_USER_ID = 1

@people_bp.route('/api/people', methods=['GET'])
def get_all_people():
    """Get all people"""
    try:
        people = Person.query.filter_by(user_id=MOCK_USER_ID).all()
        return jsonify(format_response(
            success=True,
            data={'people': [p.to_dict() for p in people]}
        )), 200
    except Exception as e:
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500


@people_bp.route('/api/people/<int:person_id>', methods=['GET'])
def get_person(person_id):
    """Get specific person by ID"""
    try:
        person = Person.query.filter_by(id=person_id, user_id=MOCK_USER_ID).first()
        
        if not person:
            return jsonify(format_response(
                success=False,
                error='Person not found'
            )), 404
        
        return jsonify(format_response(
            success=True,
            data={'person': person.to_dict()}
        )), 200
    except Exception as e:
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500


@people_bp.route('/api/people', methods=['POST'])
def create_person():
    """Create new person"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name') or not data.get('relationship'):
            return jsonify(format_response(
                success=False,
                error='Name and relationship are required'
            )), 400
        
        # Create new person
        person = Person(
            name=data['name'],
            relationship=data['relationship'],
            reminder=data.get('reminder', ''),
            user_id=MOCK_USER_ID
        )
        
        db.session.add(person)
        db.session.commit()
        
        return jsonify(format_response(
            success=True,
            data={'person': person.to_dict()},
            message=f'Person "{person.name}" created successfully'
        )), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500


@people_bp.route('/api/people/<int:person_id>', methods=['PUT'])
def update_person(person_id):
    """Update person"""
    try:
        person = Person.query.filter_by(id=person_id, user_id=MOCK_USER_ID).first()
        
        if not person:
            return jsonify(format_response(
                success=False,
                error='Person not found'
            )), 404
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            person.name = data['name']
        if 'relationship' in data:
            person.relationship = data['relationship']
        if 'reminder' in data:
            person.reminder = data['reminder']
        
        db.session.commit()
        
        return jsonify(format_response(
            success=True,
            data={'person': person.to_dict()},
            message=f'Person "{person.name}" updated successfully'
        )), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500


@people_bp.route('/api/people/<int:person_id>', methods=['DELETE'])
def delete_person(person_id):
    """Delete person"""
    try:
        person = Person.query.filter_by(id=person_id, user_id=MOCK_USER_ID).first()
        
        if not person:
            return jsonify(format_response(
                success=False,
                error='Person not found'
            )), 404
        
        # Delete associated photo
        if person.photo_url:
            delete_image(person.photo_url)
        
        person_name = person.name
        db.session.delete(person)
        db.session.commit()
        
        return jsonify(format_response(
            success=True,
            message=f'Person "{person_name}" deleted successfully'
        )), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500


@people_bp.route('/api/people/<int:person_id>/upload-photo', methods=['POST'])
def upload_person_photo(person_id):
    """Upload photo and extract face encoding"""
    try:
        person = Person.query.filter_by(id=person_id, user_id=MOCK_USER_ID).first()
        
        if not person:
            return jsonify(format_response(
                success=False,
                error='Person not found'
            )), 404
        
        data = request.get_json()
        image_base64 = data.get('image')
        
        if not image_base64:
            return jsonify(format_response(
                success=False,
                error='No image provided'
            )), 400
        
        # Extract face encoding
        face_encoding = FaceRecognitionService.extract_encoding_from_base64(image_base64)
        
        if face_encoding is None:
            return jsonify(format_response(
                success=False,
                error='No face detected in uploaded photo. Please upload a clear photo with a visible face.'
            )), 400
        
        # Delete old photo if exists
        if person.photo_url:
            delete_image(person.photo_url)
        
        # Save new photo
        photo_url = save_base64_image(image_base64, person_id)
        
        if not photo_url:
            return jsonify(format_response(
                success=False,
                error='Failed to save image'
            )), 500
        
        # Update person with new photo and encoding
        person.photo_url = photo_url
        person.set_face_encoding_array(face_encoding.tolist())
        
        db.session.commit()
        
        return jsonify(format_response(
            success=True,
            data={'person': person.to_dict()},
            message=f'Photo uploaded and face encoded successfully for {person.name}'
        )), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500


@people_bp.route('/api/people/descriptors', methods=['GET'])
def get_people_descriptors():
    """Get all people with face encodings (for frontend matching)"""
    try:
        people = Person.query.filter_by(user_id=MOCK_USER_ID).filter(Person.face_encoding != None).all()
        
        descriptors = []
        for person in people:
            encoding = person.get_face_encoding_array()
            if encoding:
                descriptors.append({
                    'id': str(person.id),
                    'name': person.name,
                    'relationship': person.relationship,
                    'face_encoding': encoding
                })
        
        return jsonify(format_response(
            success=True,
            data={'people': descriptors}
        )), 200
        
    except Exception as e:
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500
