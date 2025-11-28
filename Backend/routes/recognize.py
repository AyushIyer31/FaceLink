from flask import Blueprint, request, jsonify
from models import db, Person, TimelineEvent, RecognitionCooldown
from services.face_service import FaceRecognitionService
from utils.helpers import format_response
from datetime import datetime, timedelta
from config import Config
import numpy as np

recognize_bp = Blueprint('recognize', __name__)

# Mock user ID for hackathon (single user system)
MOCK_USER_ID = 1

@recognize_bp.route('/api/recognize', methods=['POST'])
def recognize_face():
    """
    Recognize face from image with cooldown logic.
    
    Body: { image: "base64_string" }
    
    Returns: { 
        success: bool,
        person: {...} or null,
        confidence: float,
        timeline_event: {...},
        message: string,
        should_announce: bool  # For Visitor Mode - true if past cooldown
    }
    """
    try:
        data = request.get_json()
        image_base64 = data.get('image')
        
        if not image_base64:
            return jsonify(format_response(
                success=False,
                error='No image provided'
            )), 400
        
        # Step 1: Extract face encoding from uploaded image
        unknown_encoding = FaceRecognitionService.extract_encoding_from_base64(image_base64)
        
        if unknown_encoding is None:
            return jsonify(format_response(
                success=False,
                error='No face detected in image',
                message='Please make sure a face is clearly visible in the camera'
            )), 400
        
        # Step 2: Get all known people and their encodings
        people = Person.query.filter_by(user_id=MOCK_USER_ID).all()
        
        # Filter people with encodings
        people_with_encodings = [p for p in people if p.face_encoding]
        
        if len(people_with_encodings) == 0:
            # Create timeline event for unknown face
            timeline_event = TimelineEvent(
                event_type='unknown_face',
                notes='No known people in database yet',
                user_id=MOCK_USER_ID
            )
            db.session.add(timeline_event)
            db.session.commit()
            
            return jsonify(format_response(
                success=True,
                data={
                    'recognized': False,
                    'person': None,
                    'confidence': 0.0,
                    'timeline_event': timeline_event.to_dict(),
                    'should_announce': False
                },
                message='No familiar faces have been added yet'
            )), 200
        
        # Prepare encodings and IDs for comparison
        known_encodings = []
        known_ids = []
        
        for person in people_with_encodings:
            encoding = person.get_face_encoding_array()
            if encoding:
                known_encodings.append(np.array(encoding))
                known_ids.append(person.id)
        
        # Step 3: Compare and find best match
        person_id, confidence = FaceRecognitionService.compare_faces(
            unknown_encoding, 
            known_encodings, 
            known_ids
        )
        
        # Step 4: Handle recognition result
        if person_id:
            # Match found!
            person = Person.query.get(person_id)
            
            # Check cooldown
            cooldown = RecognitionCooldown.query.filter_by(person_id=person_id).first()
            cooldown_minutes = Config.RECOGNITION_COOLDOWN_MINUTES
            should_announce = True
            
            if cooldown:
                time_since_last = datetime.utcnow() - cooldown.last_recognized_at
                if time_since_last < timedelta(minutes=cooldown_minutes):
                    should_announce = False
                    # Update last_recognized but don't announce
                    cooldown.last_recognized_at = datetime.utcnow()
                else:
                    # Past cooldown, update time
                    cooldown.last_recognized_at = datetime.utcnow()
                    should_announce = True
            else:
                # First recognition, create cooldown entry
                cooldown = RecognitionCooldown(
                    person_id=person_id,
                    last_recognized_at=datetime.utcnow()
                )
                db.session.add(cooldown)
                should_announce = True
            
            # Create timeline event
            timeline_event = TimelineEvent(
                event_type='recognition',
                person_id=person_id,
                confidence=confidence,
                notes=f"Recognized with {confidence*100:.1f}% confidence",
                user_id=MOCK_USER_ID
            )
            db.session.add(timeline_event)
            db.session.commit()
            
            return jsonify(format_response(
                success=True,
                data={
                    'recognized': True,
                    'person': person.to_dict(),
                    'confidence': round(confidence, 3),
                    'timeline_event': timeline_event.to_dict(),
                    'should_announce': should_announce
                },
                message=f"It looks like {person.name} is here."
            )), 200
        else:
            # No match found
            timeline_event = TimelineEvent(
                event_type='unknown_face',
                notes="Face detected but not recognized",
                user_id=MOCK_USER_ID
            )
            db.session.add(timeline_event)
            db.session.commit()
            
            return jsonify(format_response(
                success=True,
                data={
                    'recognized': False,
                    'person': None,
                    'confidence': 0.0,
                    'timeline_event': timeline_event.to_dict(),
                    'should_announce': False
                },
                message="I don't recognize this person"
            )), 200
            
    except Exception as e:
        db.session.rollback()
        print(f"❌ Recognition error: {e}")
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500
