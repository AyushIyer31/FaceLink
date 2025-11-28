from flask import Blueprint, request, jsonify
from models import db, Settings, TimelineEvent
from utils.helpers import format_response

help_bp = Blueprint('help', __name__)

# Mock user ID for hackathon (single user system)
MOCK_USER_ID = 1

@help_bp.route('/api/help', methods=['POST'])
def trigger_help():
    """
    Handle help button press - log confused event and return reassurance data
    
    Body: { notes?: string }
    
    Returns reassurance message, home info, and caregiver contacts
    """
    try:
        data = request.get_json() or {}
        notes = data.get('notes', 'User pressed help button')
        
        # Get settings
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
        
        # Log confused/help event
        timeline_event = TimelineEvent(
            event_type='confused',
            notes=notes,
            user_id=MOCK_USER_ID
        )
        db.session.add(timeline_event)
        db.session.commit()
        
        # Return reassurance data
        return jsonify(format_response(
            success=True,
            data={
                'reassurance_message': settings.reassurance_message,
                'home_address': settings.home_address,
                'home_label': settings.home_label,
                'location': {
                    'latitude': settings.map_latitude,
                    'longitude': settings.map_longitude
                },
                'caregivers': [c.to_dict() for c in settings.caregivers],
                'timeline_event': timeline_event.to_dict()
            },
            message=f"You are at {settings.home_label}. {settings.reassurance_message}"
        )), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500
