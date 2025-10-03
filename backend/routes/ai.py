"""
AI-powered features including suggestions, habit generation, chat, and insights
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import google.generativeai as genai
import os
from database import (
    get_user_habits, create_ai_chat_message, get_ai_chat_history,
    get_collections
)

ai_bp = Blueprint('ai', __name__)

# Configure Gemini AI
gemini_api_key = os.getenv('GEMINI_API_KEY')

@ai_bp.route('/suggestions', methods=['POST'])
@jwt_required()
def get_ai_suggestions():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('query'):
        return jsonify({'error': 'Query is required'}), 400
    
    if not gemini_api_key or gemini_api_key == 'your_gemini_api_key_here':
        return jsonify({'error': 'AI features are not configured. Please set up your Gemini API key.'}), 503
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        habits = get_user_habits(user_id)
        habit_titles = [habit['title'] for habit in habits]
        
        prompt = f"""
        User's current habits: {', '.join(habit_titles)}
        
        User query: {data['query']}
        
        Please provide helpful suggestions for habit tracking, improvement, or new habits.
        Keep the response concise and actionable.
        """
        
        response = model.generate_content(prompt)
        
        return jsonify({
            'suggestion': response.text
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to generate AI suggestion'}), 500

@ai_bp.route('/generate-habits', methods=['POST'])
@jwt_required()
def generate_habits():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('query'):
        return jsonify({'error': 'Query is required'}), 400
    
    query = data['query'].strip()
    
    # Baseline habits for when AI is not available
    baseline_habits = [
        {
            'id': 'baseline-1',
            'title': 'Drink Water',
            'description': 'Stay hydrated throughout the day',
            'frequency': 'daily',
            'target_count': 8
        },
        {
            'id': 'baseline-2', 
            'title': 'Exercise',
            'description': 'Get your body moving with physical activity',
            'frequency': 'daily',
            'target_count': 1
        },
        {
            'id': 'baseline-3',
            'title': 'Read',
            'description': 'Spend time reading books or articles',
            'frequency': 'daily',
            'target_count': 1
        }
    ]
    
    if not gemini_api_key or gemini_api_key == 'your_gemini_api_key_here':
        return jsonify({'habits': baseline_habits})
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Get user's existing habits for context
        existing_habits = get_user_habits(user_id)
        existing_titles = [h['title'] for h in existing_habits]
        
        prompt = f"""
        Generate 3-5 specific, actionable habits based on this request: "{query}"
        
        User's existing habits: {', '.join(existing_titles) if existing_titles else 'None'}
        
        Return ONLY a valid JSON array with this exact format:
        [
          {{
            "id": "habit-1",
            "title": "Short habit name (max 50 chars)",
            "description": "Brief description (max 100 chars)", 
            "frequency": "daily",
            "target_count": 1
          }}
        ]
        
        Rules:
        - Make habits specific and measurable
        - Avoid duplicating existing habits
        - Use realistic target_count (1-10)
        - Keep titles and descriptions concise
        - Only use "daily" frequency
        - Return valid JSON only, no extra text
        """
        
        response = model.generate_content(prompt)
        ai_text = response.text.strip()
        
        # Try to parse JSON response
        import json
        try:
            # Clean up the response (remove markdown code blocks if present)
            if '```json' in ai_text:
                ai_text = ai_text.split('```json')[1].split('```')[0].strip()
            elif '```' in ai_text:
                ai_text = ai_text.split('```')[1].strip()
            
            habits = json.loads(ai_text)
            
            # Validate the structure
            if isinstance(habits, list) and len(habits) > 0:
                valid_habits = []
                for i, habit in enumerate(habits[:5]):  # Max 5 habits
                    if isinstance(habit, dict) and all(k in habit for k in ['title', 'description', 'frequency', 'target_count']):
                        valid_habits.append({
                            'id': f'ai-{i+1}',
                            'title': str(habit['title'])[:50],
                            'description': str(habit['description'])[:100],
                            'frequency': 'daily',  # Force daily
                            'target_count': max(1, min(10, int(habit.get('target_count', 1))))
                        })
                
                if valid_habits:
                    return jsonify({'habits': valid_habits})
        
        except (json.JSONDecodeError, ValueError, KeyError):
            pass
        
        # Fallback to baseline if AI response is invalid
        return jsonify({'habits': baseline_habits})
        
    except Exception:
        return jsonify({'habits': baseline_habits})

@ai_bp.route('/chat/history', methods=['GET'])
@jwt_required()
def get_ai_chat_history_route():
    user_id = get_jwt_identity()
    messages = get_ai_chat_history(user_id)
    return jsonify([
        {
            'id': str(m['_id']),
            'role': m['role'],
            'text': m['text'],
            'created_at': m['created_at'].isoformat()
        }
        for m in messages
    ])

@ai_bp.route('/chat', methods=['POST'])
@jwt_required()
def ai_chat():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    user_message = (data.get('message') or '').strip()
    if not user_message:
        return jsonify({'error': 'Message is required'}), 400

    # Save user message
    user_msg = create_ai_chat_message(user_id, 'user', user_message)

    # Prepare baseline reply
    baseline_reply = (
        "Thanks for sharing! Here's a quick suggestion: pick one small, high-impact habit "
        "you can complete today to build momentum. If you'd like, ask me for a "
        "personalized plan based on your habits."
    )

    # If no AI configured, return baseline reply and store it
    if not gemini_api_key or gemini_api_key == 'your_gemini_api_key_here':
        assistant_msg = create_ai_chat_message(user_id, 'assistant', baseline_reply)
        return jsonify({'assistant': {
            'id': str(assistant_msg['_id']),
            'role': 'assistant',
            'text': assistant_msg['text'],
            'created_at': assistant_msg['created_at'].isoformat()
        }})

    # Try AI response; on failure, fall back to baseline
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        habits = get_user_habits(user_id)
        habit_titles = [h['title'] for h in habits]
        prompt = (
            f"User's current habits: {', '.join(habit_titles)}\n"
            f"User message: {user_message}\n"
            "Respond as a concise, encouraging habit coach. Keep it under 120 words."
        )
        response = model.generate_content(prompt)
        ai_text = (response.text or baseline_reply).strip()
    except Exception:
        ai_text = baseline_reply

    assistant_msg = create_ai_chat_message(user_id, 'assistant', ai_text)

    return jsonify({'assistant': {
        'id': str(assistant_msg['_id']),
        'role': 'assistant',
        'text': assistant_msg['text'],
        'created_at': assistant_msg['created_at'].isoformat()
    }})

@ai_bp.route('/insights', methods=['GET'])
@jwt_required()
def get_ai_insights():
    user_id = get_jwt_identity()
    
    # Always compute a safe, non-AI baseline insight
    habits = get_user_habits(user_id)
    if not habits:
        baseline_insight = 'Start by creating your first habit to get personalized insights!'
        return jsonify({'insight': baseline_insight})

    total_habits = len(habits)
    total_streak = sum(h['current_streak'] for h in habits)
    longest_streak = max((h['longest_streak'] for h in habits), default=0)
    daily_count = sum(1 for h in habits if h['frequency'] == 'daily')
    weekly_count = sum(1 for h in habits if h['frequency'] == 'weekly')
    monthly_count = sum(1 for h in habits if h['frequency'] == 'monthly')

    baseline_insight = (
        f"You are tracking {total_habits} habits. Your combined current streaks total {total_streak} "
        f"with a longest streak of {longest_streak}. Mix: {daily_count} daily, {weekly_count} weekly, {monthly_count} monthly.\n\n"
        "Suggestions: Focus on keeping streaks alive by completing at least one small daily habit. "
        "Consider reducing rarely-completed habits or simplifying them. Celebrate your longest streak and try to beat it!"
    )

    # If AI not configured, return baseline without error
    if not gemini_api_key or gemini_api_key == 'your_gemini_api_key_here':
        return jsonify({'insight': baseline_insight})

    # Try AI enrichment, but fall back to baseline on any error
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        habit_data = []
        collections = get_collections()
        for habit in habits:
            completions_count = collections['habit_completions'].count_documents({'habit_id': habit['_id']})
            habit_data.append({
                'title': habit['title'],
                'current_streak': habit['current_streak'],
                'longest_streak': habit['longest_streak'],
                'total_completions': completions_count,
                'frequency': habit['frequency']
            })

        prompt = f"""
        Analyze this user's habit tracking data and provide personalized insights:
        Habits: {habit_data}
        Please provide a short, encouraging paragraph with strengths and 2-3 actionable suggestions.
        Keep it under 120 words.
        """

        response = model.generate_content(prompt)
        ai_text = (response.text or '').strip()
        if not ai_text:
            return jsonify({'insight': baseline_insight})
        return jsonify({'insight': ai_text})
    except Exception:
        return jsonify({'insight': baseline_insight})
