"""
MongoDB database operations and helper functions
"""

from flask_pymongo import PyMongo
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

# Global mongo instance (will be initialized in main app)
mongo = None

def init_db(app):
    """Initialize the database with the Flask app"""
    global mongo
    mongo = PyMongo(app)
    return mongo

# Database Collections (initialized after mongo)
def get_collections():
    """Get all database collections"""
    return {
        'users': mongo.db.users,
        'habits': mongo.db.habits,
        'habit_completions': mongo.db.habit_completions,
        'user_daily_activity': mongo.db.user_daily_activity,
        'ai_chat_messages': mongo.db.ai_chat_messages,
        'user_stats': mongo.db.user_stats
    }

# User Operations
def create_user(username, email, password):
    """Create a new user document"""
    collections = get_collections()
    user_doc = {
        'username': username,
        'email': email,
        'password_hash': generate_password_hash(password),
        'created_at': datetime.utcnow()
    }
    result = collections['users'].insert_one(user_doc)
    user_doc['_id'] = result.inserted_id
    return user_doc

def get_user_by_username(username):
    """Get user by username"""
    collections = get_collections()
    return collections['users'].find_one({'username': username})

def get_user_by_email(email):
    """Get user by email"""
    collections = get_collections()
    return collections['users'].find_one({'email': email})

def get_user_by_id(user_id):
    """Get user by ID"""
    collections = get_collections()
    try:
        return collections['users'].find_one({'_id': ObjectId(user_id)})
    except InvalidId:
        return None

# Habit Operations
def create_habit(user_id, title, description, frequency, target_count):
    """Create a new habit document"""
    collections = get_collections()
    habit_doc = {
        'title': title,
        'description': description,
        'frequency': frequency,
        'target_count': target_count,
        'current_streak': 0,
        'longest_streak': 0,
        'created_at': datetime.utcnow(),
        'user_id': ObjectId(user_id)
    }
    result = collections['habits'].insert_one(habit_doc)
    habit_doc['_id'] = result.inserted_id
    return habit_doc

def get_user_habits(user_id):
    """Get all habits for a user"""
    collections = get_collections()
    try:
        return list(collections['habits'].find({'user_id': ObjectId(user_id)}))
    except InvalidId:
        return []

def get_habit_by_id(habit_id, user_id):
    """Get habit by ID and user ID"""
    collections = get_collections()
    try:
        return collections['habits'].find_one({
            '_id': ObjectId(habit_id),
            'user_id': ObjectId(user_id)
        })
    except InvalidId:
        return None

def update_habit(habit_id, user_id, updates):
    """Update a habit document"""
    collections = get_collections()
    try:
        result = collections['habits'].update_one(
            {'_id': ObjectId(habit_id), 'user_id': ObjectId(user_id)},
            {'$set': updates}
        )
        return result.modified_count > 0
    except InvalidId:
        return False

def delete_habit(habit_id, user_id):
    """Delete a habit and its completions"""
    collections = get_collections()
    try:
        # Delete habit completions first
        collections['habit_completions'].delete_many({'habit_id': ObjectId(habit_id)})
        # Delete habit
        result = collections['habits'].delete_one({
            '_id': ObjectId(habit_id),
            'user_id': ObjectId(user_id)
        })
        return result.deleted_count > 0
    except InvalidId:
        return False

# Habit Completion Operations
def create_habit_completion(habit_id, notes):
    """Create a habit completion document"""
    collections = get_collections()
    completion_doc = {
        'habit_id': ObjectId(habit_id),
        'completed_at': datetime.utcnow(),
        'notes': notes
    }
    result = collections['habit_completions'].insert_one(completion_doc)
    return result.inserted_id

def get_habit_completions_today(habit_id):
    """Get habit completions for today"""
    collections = get_collections()
    today = datetime.utcnow().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())
    
    return collections['habit_completions'].count_documents({
        'habit_id': ObjectId(habit_id),
        'completed_at': {'$gte': start_of_day, '$lte': end_of_day}
    })

def get_habit_completions_period(habit_id, start_date, end_date):
    """Get habit completions for a period"""
    collections = get_collections()
    return collections['habit_completions'].count_documents({
        'habit_id': ObjectId(habit_id),
        'completed_at': {'$gte': start_date, '$lt': end_date}
    })

def get_habit_completions_yesterday(habit_id):
    """Check if habit was completed yesterday"""
    collections = get_collections()
    yesterday = datetime.utcnow().date() - timedelta(days=1)
    start_of_day = datetime.combine(yesterday, datetime.min.time())
    end_of_day = datetime.combine(yesterday, datetime.max.time())
    
    return collections['habit_completions'].find_one({
        'habit_id': ObjectId(habit_id),
        'completed_at': {'$gte': start_of_day, '$lte': end_of_day}
    })

# Daily Activity Operations
def record_user_daily_activity(user_id, activity_date):
    """Record user daily activity (idempotent)"""
    collections = get_collections()
    try:
        # Convert date to datetime for MongoDB storage
        if hasattr(activity_date, 'date'):  # It's already a datetime
            activity_datetime = activity_date
        else:  # It's a date object
            activity_datetime = datetime.combine(activity_date, datetime.min.time())
            
        collections['user_daily_activity'].update_one(
            {'user_id': ObjectId(user_id), 'activity_date': activity_datetime},
            {
                '$set': {
                    'user_id': ObjectId(user_id),
                    'activity_date': activity_datetime,
                    'created_at': datetime.utcnow()
                }
            },
            upsert=True
        )
    except Exception as e:
        print(f"Error recording daily activity: {e}")
        pass

def get_user_daily_activities(user_id):
    """Get all user daily activities"""
    collections = get_collections()
    try:
        return list(collections['user_daily_activity'].find({'user_id': ObjectId(user_id)}))
    except InvalidId:
        return []

# User Stats Operations
def get_or_create_user_stats(user_id):
    """Get or create user stats document"""
    collections = get_collections()
    try:
        stats = collections['user_stats'].find_one({'user_id': ObjectId(user_id)})
        if not stats:
            stats_doc = {
                'user_id': ObjectId(user_id),
                'total_habits_created': 0,
                'total_completions': 0,
                'longest_daily_streak': 0
            }
            result = collections['user_stats'].insert_one(stats_doc)
            stats_doc['_id'] = result.inserted_id
            return stats_doc
        return stats
    except InvalidId:
        return None

def update_user_stats(user_id, updates):
    """Update user stats"""
    collections = get_collections()
    try:
        collections['user_stats'].update_one(
            {'user_id': ObjectId(user_id)},
            {'$inc': updates},
            upsert=True
        )
    except InvalidId:
        pass

# AI Chat Operations
def create_ai_chat_message(user_id, role, text):
    """Create an AI chat message"""
    collections = get_collections()
    message_doc = {
        'user_id': ObjectId(user_id),
        'role': role,
        'text': text,
        'created_at': datetime.utcnow()
    }
    result = collections['ai_chat_messages'].insert_one(message_doc)
    message_doc['_id'] = result.inserted_id
    return message_doc

def get_ai_chat_history(user_id):
    """Get AI chat history for a user"""
    collections = get_collections()
    try:
        return list(collections['ai_chat_messages'].find(
            {'user_id': ObjectId(user_id)}
        ).sort('created_at', 1))
    except InvalidId:
        return []

# Database Indexes and Migration
def create_indexes():
    """Create database indexes for better performance"""
    collections = get_collections()
    try:
        collections['users'].create_index('username', unique=True)
        collections['users'].create_index('email', unique=True)
        collections['habits'].create_index('user_id')
        collections['habit_completions'].create_index('habit_id')
        collections['habit_completions'].create_index('completed_at')
        collections['user_daily_activity'].create_index([('user_id', 1), ('activity_date', 1)], unique=True)
        collections['ai_chat_messages'].create_index('user_id')
        collections['user_stats'].create_index('user_id', unique=True)
        print("Database indexes created successfully")
    except Exception as e:
        print(f"Index creation warning: {e}")

def migrate_user_stats():
    """Populate UserStats with existing data"""
    collections = get_collections()
    users = list(collections['users'].find())
    for user in users:
        user_id = user['_id']
        existing_stats = collections['user_stats'].find_one({'user_id': user_id})
        if existing_stats:
            continue  # Skip if already exists
            
        # Count total habits ever created by this user
        total_habits = collections['habits'].count_documents({'user_id': user_id})
        
        # Count total completions by this user
        user_habits = list(collections['habits'].find({'user_id': user_id}))
        total_completions = 0
        for habit in user_habits:
            total_completions += collections['habit_completions'].count_documents({'habit_id': habit['_id']})
        
        # Calculate longest daily streak from UserDailyActivity
        activity_rows = list(collections['user_daily_activity'].find({'user_id': user_id}))
        completed_dates = [row['activity_date'] for row in activity_rows]
        longest_streak = 0
        
        if completed_dates:
            # Find the longest consecutive sequence
            sorted_dates = sorted(completed_dates)
            current_streak = 1
            max_streak = 1
            
            for i in range(1, len(sorted_dates)):
                if (sorted_dates[i] - sorted_dates[i-1]).days == 1:
                    current_streak += 1
                    max_streak = max(max_streak, current_streak)
                else:
                    current_streak = 1
            longest_streak = max_streak
        
        # Create UserStats record
        stats = {
            'user_id': user_id,
            'total_habits_created': total_habits,
            'total_completions': total_completions,
            'longest_daily_streak': longest_streak
        }
        collections['user_stats'].insert_one(stats)
    
    print(f"Migrated stats for {len(users)} users")
