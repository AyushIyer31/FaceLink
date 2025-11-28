from flask import Blueprint, request, jsonify
from models import db, TimelineEvent, Person
from utils.helpers import format_response
from datetime import datetime, timedelta
from sqlalchemy import and_

timeline_bp = Blueprint('timeline', __name__)

# Mock user ID for hackathon (single user system)
MOCK_USER_ID = 1

@timeline_bp.route('/api/timeline/today', methods=['GET'])
def get_today_timeline():
    """Get today's timeline events"""
    try:
        today = datetime.utcnow().date()
        start_of_day = datetime.combine(today, datetime.min.time())
        end_of_day = datetime.combine(today, datetime.max.time())
        
        events = TimelineEvent.query.filter(
            and_(
                TimelineEvent.user_id == MOCK_USER_ID,
                TimelineEvent.timestamp >= start_of_day,
                TimelineEvent.timestamp <= end_of_day
            )
        ).order_by(TimelineEvent.timestamp.desc()).all()
        
        return jsonify(format_response(
            success=True,
            data={'events': [e.to_dict() for e in events]}
        )), 200
        
    except Exception as e:
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500


@timeline_bp.route('/api/timeline', methods=['GET'])
def get_timeline():
    """
    Get timeline events with optional filtering
    Query params:
        - date: ISO date string (YYYY-MM-DD)
        - range: 'day' or 'week'
    """
    try:
        date_str = request.args.get('date')
        range_type = request.args.get('range', 'day')
        
        if date_str:
            try:
                target_date = datetime.fromisoformat(date_str).date()
            except ValueError:
                return jsonify(format_response(
                    success=False,
                    error='Invalid date format. Use YYYY-MM-DD'
                )), 400
        else:
            target_date = datetime.utcnow().date()
        
        # Calculate date range
        if range_type == 'week':
            # Start of week (Monday)
            start_date = target_date - timedelta(days=target_date.weekday())
            end_date = start_date + timedelta(days=6)
        else:  # day
            start_date = target_date
            end_date = target_date
        
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        events = TimelineEvent.query.filter(
            and_(
                TimelineEvent.user_id == MOCK_USER_ID,
                TimelineEvent.timestamp >= start_datetime,
                TimelineEvent.timestamp <= end_datetime
            )
        ).order_by(TimelineEvent.timestamp.desc()).all()
        
        return jsonify(format_response(
            success=True,
            data={
                'events': [e.to_dict() for e in events],
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'range': range_type
            }
        )), 200
        
    except Exception as e:
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500
