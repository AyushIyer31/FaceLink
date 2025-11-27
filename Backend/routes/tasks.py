from flask import Blueprint, request, jsonify
from models import db, Task
from utils.helpers import format_response
from datetime import datetime, timedelta
from sqlalchemy import and_

tasks_bp = Blueprint('tasks', __name__)

# Mock user ID for hackathon (single user system)
MOCK_USER_ID = 1

@tasks_bp.route('/api/tasks', methods=['GET'])
def get_tasks():
    """
    Get tasks, optionally filtered by date
    Query params:
        - date: ISO date string (YYYY-MM-DD), defaults to today
    """
    try:
        date_str = request.args.get('date')
        
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
        
        tasks = Task.query.filter_by(
            user_id=MOCK_USER_ID,
            date=target_date
        ).order_by(Task.time).all()
        
        return jsonify(format_response(
            success=True,
            data={
                'tasks': [t.to_dict() for t in tasks],
                'date': target_date.isoformat()
            }
        )), 200
        
    except Exception as e:
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500


@tasks_bp.route('/api/tasks/upcoming', methods=['GET'])
def get_upcoming_tasks():
    """
    Get upcoming tasks (today and future)
    Query params:
        - limit: max number of tasks (default 10)
    """
    try:
        limit = int(request.args.get('limit', 10))
        today = datetime.utcnow().date()
        
        tasks = Task.query.filter(
            and_(
                Task.user_id == MOCK_USER_ID,
                Task.date >= today,
                Task.completed == False
            )
        ).order_by(Task.date, Task.time).limit(limit).all()
        
        return jsonify(format_response(
            success=True,
            data={'tasks': [t.to_dict() for t in tasks]}
        )), 200
        
    except Exception as e:
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500


@tasks_bp.route('/api/tasks', methods=['POST'])
def create_task():
    """Create new task"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('title') or not data.get('time') or not data.get('date'):
            return jsonify(format_response(
                success=False,
                error='Title, time, and date are required'
            )), 400
        
        # Parse date
        try:
            task_date = datetime.fromisoformat(data['date']).date()
        except ValueError:
            return jsonify(format_response(
                success=False,
                error='Invalid date format. Use YYYY-MM-DD'
            )), 400
        
        # Create new task
        task = Task(
            title=data['title'],
            description=data.get('description', ''),
            time=data['time'],
            date=task_date,
            reminder=data.get('reminder', False),
            user_id=MOCK_USER_ID
        )
        
        db.session.add(task)
        db.session.commit()
        
        return jsonify(format_response(
            success=True,
            data={'task': task.to_dict()},
            message=f'Task "{task.title}" created successfully'
        )), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500


@tasks_bp.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update task"""
    try:
        task = Task.query.filter_by(id=task_id, user_id=MOCK_USER_ID).first()
        
        if not task:
            return jsonify(format_response(
                success=False,
                error='Task not found'
            )), 404
        
        data = request.get_json()
        
        # Update fields
        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'time' in data:
            task.time = data['time']
        if 'date' in data:
            try:
                task.date = datetime.fromisoformat(data['date']).date()
            except ValueError:
                return jsonify(format_response(
                    success=False,
                    error='Invalid date format'
                )), 400
        if 'completed' in data:
            task.completed = data['completed']
        if 'reminder' in data:
            task.reminder = data['reminder']
        
        db.session.commit()
        
        return jsonify(format_response(
            success=True,
            data={'task': task.to_dict()},
            message=f'Task "{task.title}" updated successfully'
        )), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500


@tasks_bp.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete task"""
    try:
        task = Task.query.filter_by(id=task_id, user_id=MOCK_USER_ID).first()
        
        if not task:
            return jsonify(format_response(
                success=False,
                error='Task not found'
            )), 404
        
        task_title = task.title
        db.session.delete(task)
        db.session.commit()
        
        return jsonify(format_response(
            success=True,
            message=f'Task "{task_title}" deleted successfully'
        )), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify(format_response(
            success=False,
            error=str(e)
        )), 500
