from flask import Blueprint, request, jsonify
from models import db, Location
from utils.helpers import format_response
from datetime import datetime

locations_bp = Blueprint('locations', __name__)

# Mock user id
MOCK_USER_ID = 1


@locations_bp.route('/api/locations', methods=['GET'])
def get_locations():
    try:
        locs = Location.query.filter_by(user_id=MOCK_USER_ID).all()
        return jsonify(format_response(success=True, data={'locations': [l.to_dict() for l in locs]})), 200
    except Exception as e:
        return jsonify(format_response(success=False, error=str(e))), 500


@locations_bp.route('/api/locations', methods=['POST'])
def create_location():
    try:
        data = request.get_json()
        if not data.get('label'):
            return jsonify(format_response(success=False, error='Label is required')), 400

        loc = Location(
            label=data.get('label'),
            address=data.get('address'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            place_type=data.get('place_type'),
            user_id=MOCK_USER_ID
        )

        db.session.add(loc)
        db.session.commit()

        return jsonify(format_response(success=True, data={'location': loc.to_dict()})), 201
    except Exception as e:
        db.session.rollback()
        return jsonify(format_response(success=False, error=str(e))), 500


@locations_bp.route('/api/locations/<int:loc_id>', methods=['PUT'])
def update_location(loc_id):
    try:
        loc = Location.query.filter_by(id=loc_id, user_id=MOCK_USER_ID).first()
        if not loc:
            return jsonify(format_response(success=False, error='Location not found')), 404

        data = request.get_json()
        if 'label' in data:
            loc.label = data['label']
        if 'address' in data:
            loc.address = data['address']
        if 'latitude' in data:
            loc.latitude = data['latitude']
        if 'longitude' in data:
            loc.longitude = data['longitude']
        if 'place_type' in data:
            loc.place_type = data['place_type']

        db.session.commit()

        return jsonify(format_response(success=True, data={'location': loc.to_dict()})), 200
    except Exception as e:
        db.session.rollback()
        return jsonify(format_response(success=False, error=str(e))), 500


@locations_bp.route('/api/locations/<int:loc_id>', methods=['DELETE'])
def delete_location(loc_id):
    try:
        loc = Location.query.filter_by(id=loc_id, user_id=MOCK_USER_ID).first()
        if not loc:
            return jsonify(format_response(success=False, error='Location not found')), 404

        db.session.delete(loc)
        db.session.commit()
        return jsonify(format_response(success=True, message='Location deleted')), 200
    except Exception as e:
        db.session.rollback()
        return jsonify(format_response(success=False, error=str(e))), 500
