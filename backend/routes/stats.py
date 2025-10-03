"""
Statistics and analytics routes
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from database import (
    get_user_daily_activities, get_collections, get_or_create_user_stats
)
from bson import ObjectId

stats_bp = Blueprint('stats', __name__)

@stats_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_stats():
    try:
        user_id = get_jwt_identity()
        # Return cumulative stats as stored; do not recompute or decrease
        stats = get_or_create_user_stats(user_id)
        return jsonify({
            'total_habits_created': stats.get('total_habits_created', 0),
            'total_completions': stats.get('total_completions', 0),
            'longest_daily_streak': stats.get('longest_daily_streak', 0)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@stats_bp.route('/streak', methods=['GET'])
@jwt_required()
def get_global_streak():
    try:
        user_id = get_jwt_identity()
        today = datetime.utcnow().date()
        
        # Get activity dates for this user
        activity_rows = get_user_daily_activities(user_id)
        completed_dates = {row['activity_date'].date() if hasattr(row['activity_date'], 'date') else row['activity_date'] for row in activity_rows}

        if not completed_dates:
            return jsonify({'current_streak': 0})

        # Anchor at today if completed, else at yesterday if completed, else 0
        anchor = None
        if today in completed_dates:
            anchor = today
        elif (today - timedelta(days=1)) in completed_dates:
            anchor = today - timedelta(days=1)
        else:
            return jsonify({'current_streak': 0})

        # Count consecutive days backwards from anchor
        current_streak = 0
        d = anchor
        while d in completed_dates:
            current_streak += 1
            d = d - timedelta(days=1)

        # Also ensure longest_daily_streak in stored stats never decreases
        collections = get_collections()
        existing = collections['user_stats'].find_one({'user_id': ObjectId(user_id)}) or {}
        longest_existing = existing.get('longest_daily_streak', 0)
        if current_streak > longest_existing:
            collections['user_stats'].update_one(
                {'user_id': ObjectId(user_id)},
                {'$set': {'longest_daily_streak': current_streak}},
                upsert=True
            )

        return jsonify({'current_streak': current_streak})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
