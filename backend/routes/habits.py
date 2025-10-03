"""
Habit management routes
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from database import (
    get_user_habits, create_habit, get_habit_by_id, update_habit, delete_habit,
    create_habit_completion, get_habit_completions_today, get_habit_completions_period,
    get_habit_completions_yesterday, record_user_daily_activity, update_user_stats,
    get_user_daily_activities, get_or_create_user_stats, get_collections
)
from bson import ObjectId

habits_bp = Blueprint('habits', __name__)

@habits_bp.route('/', methods=['GET'])
@jwt_required()
def get_habits():
    try:
        user_id = get_jwt_identity()
        habits = get_user_habits(user_id)
        
        habits_data = []
        now = datetime.utcnow()
        today = now.date()
        
        for habit in habits:
            today_completions = get_habit_completions_today(habit['_id'])
            
            # Determine period window based on frequency
            period_start = None
            period_end = None
            if habit['frequency'] == 'daily':
                period_start = datetime.combine(today, datetime.min.time())
                period_end = period_start + timedelta(days=1)
            elif habit['frequency'] == 'weekly':
                # ISO week: Monday start
                weekday = today.weekday()  # Monday=0
                week_start_date = today - timedelta(days=weekday)
                period_start = datetime.combine(week_start_date, datetime.min.time())
                period_end = period_start + timedelta(days=7)
            elif habit['frequency'] == 'monthly':
                month_start_date = today.replace(day=1)
                if month_start_date.month == 12:
                    next_month_start = month_start_date.replace(year=month_start_date.year + 1, month=1)
                else:
                    next_month_start = month_start_date.replace(month=month_start_date.month + 1)
                period_start = datetime.combine(month_start_date, datetime.min.time())
                period_end = datetime.combine(next_month_start, datetime.min.time())
            else:
                # Default to daily if unknown
                period_start = datetime.combine(today, datetime.min.time())
                period_end = period_start + timedelta(days=1)

            period_completions = get_habit_completions_period(habit['_id'], period_start, period_end)
            
            habits_data.append({
                'id': str(habit['_id']),
                'title': habit['title'],
                'description': habit['description'],
                'frequency': habit['frequency'],
                'target_count': habit['target_count'],
                'current_streak': habit['current_streak'],
                'longest_streak': habit['longest_streak'],
                'created_at': habit['created_at'].isoformat(),
                'today_completions': today_completions,
                'is_completed_today': today_completions >= habit['target_count'],
                'period_completions': period_completions,
                'is_completed_period': period_completions >= habit['target_count']
            })
        
        return jsonify(habits_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@habits_bp.route('/', methods=['POST'])
@jwt_required()
def create_habit_route():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400
    
    habit = create_habit(
        user_id,
        data['title'],
        data.get('description', ''),
        data.get('frequency', 'daily'),
        data.get('target_count', 1)
    )
    
    # Update stats: increment total habits ever created by 1 (never decreases)
    update_user_stats(user_id, {'total_habits_created': 1})
    
    return jsonify({
        'id': str(habit['_id']),
        'title': habit['title'],
        'description': habit['description'],
        'frequency': habit['frequency'],
        'target_count': habit['target_count'],
        'current_streak': habit['current_streak'],
        'longest_streak': habit['longest_streak'],
        'created_at': habit['created_at'].isoformat()
    }), 201

@habits_bp.route('/<habit_id>', methods=['PUT'])
@jwt_required()
def update_habit_route(habit_id):
    user_id = get_jwt_identity()
    habit = get_habit_by_id(habit_id, user_id)
    
    if not habit:
        return jsonify({'error': 'Habit not found'}), 404
    
    data = request.get_json()
    updates = {}
    
    if data.get('title'):
        updates['title'] = data['title']
    if data.get('description') is not None:
        updates['description'] = data['description']
    if data.get('frequency'):
        updates['frequency'] = data['frequency']
    if data.get('target_count') is not None:
        updates['target_count'] = data['target_count']
    
    if updates:
        update_habit(habit_id, user_id, updates)
        # Get updated habit
        habit = get_habit_by_id(habit_id, user_id)
    
    return jsonify({
        'id': str(habit['_id']),
        'title': habit['title'],
        'description': habit['description'],
        'frequency': habit['frequency'],
        'target_count': habit['target_count'],
        'current_streak': habit['current_streak'],
        'longest_streak': habit['longest_streak']
    })

@habits_bp.route('/<habit_id>', methods=['DELETE'])
@jwt_required()
def delete_habit_route(habit_id):
    user_id = get_jwt_identity()
    
    if not get_habit_by_id(habit_id, user_id):
        return jsonify({'error': 'Habit not found'}), 404
    
    if delete_habit(habit_id, user_id):
        return jsonify({'message': 'Habit deleted successfully'})
    else:
        return jsonify({'error': 'Failed to delete habit'}), 500

@habits_bp.route('/<habit_id>/complete', methods=['POST'])
@jwt_required()
def complete_habit(habit_id):
    user_id = get_jwt_identity()
    habit = get_habit_by_id(habit_id, user_id)
    
    if not habit:
        return jsonify({'error': 'Habit not found'}), 404
    
    data = request.get_json() or {}
    today = datetime.utcnow().date()
    
    # Check current completions before adding new one
    current_completions = get_habit_completions_today(habit_id)
    
    # Don't allow more completions than target
    if current_completions >= habit['target_count']:
        return jsonify({'error': 'Habit already completed for today'}), 400
    
    # Create one completion record regardless of target_count; totals increment by 1
    create_habit_completion(habit_id, data.get('notes', ''))
    
    # Get updated completion count
    new_completions = current_completions + 1
    
    # Update streak only if habit is fully completed
    current_streak = habit['current_streak']
    longest_streak = habit['longest_streak']
    
    if new_completions >= habit['target_count']:
        # Check if habit was completed yesterday for streak calculation
        yesterday_completion = get_habit_completions_yesterday(habit_id)
        
        if yesterday_completion:
            current_streak += 1
        else:
            current_streak = 1
        
        longest_streak = max(current_streak, longest_streak)
        
        # Update habit streaks
        update_habit(habit_id, user_id, {
            'current_streak': current_streak,
            'longest_streak': longest_streak
        })

        # Record user-wide daily activity for streaks (idempotent per day)
        record_user_daily_activity(user_id, today)

        # Update stats: increment total completions by 1 (never decreases)
        update_user_stats(user_id, {'total_completions': 1})

        # Calculate current daily streak and update longest if needed
        activity_rows = get_user_daily_activities(user_id)
        completed_dates = {row['activity_date'].date() if hasattr(row['activity_date'], 'date') else row['activity_date'] for row in activity_rows}
        
        # Calculate current daily streak
        current_daily_streak = 0
        if today in completed_dates:
            anchor = today
            d = anchor
            while d in completed_dates:
                current_daily_streak += 1
                d = d - timedelta(days=1)
        
        # Update longest streak only if current streak is higher
        stats = get_or_create_user_stats(user_id)
        if current_daily_streak > stats['longest_daily_streak']:
            collections = get_collections()
            collections['user_stats'].update_one(
                {'user_id': ObjectId(user_id)},
                {'$set': {'longest_daily_streak': current_daily_streak}}
            )
    
    # Return updated habit data
    updated_habit = get_habit_by_id(habit_id, user_id)
    today_completions = get_habit_completions_today(habit_id)
    
    return jsonify({
        'message': 'Habit completed successfully',
        'habit': {
            'id': str(updated_habit['_id']),
            'current_streak': updated_habit['current_streak'],
            'longest_streak': updated_habit['longest_streak'],
            'today_completions': today_completions,
            'is_completed_today': today_completions >= updated_habit['target_count']
        }
    })
