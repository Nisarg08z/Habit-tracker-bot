# Habit Tracker Bot

A modern habit tracking application with AI-powered insights using React + Tailwind CSS for the frontend and Python Flask (with MongoDB) for the backend, plus optional Gemini AI.

## Features

- 🎯 **Habit Management**: Create, edit, and delete habits
- 📊 **Progress Tracking**: Track daily completions and streaks
- 🤖 **AI-Powered Insights**: Get personalized suggestions using Gemini AI
- 📱 **Responsive Design**: Beautiful UI with Tailwind CSS
- 🔐 **User Authentication**: Secure login and registration
- 📈 **Analytics Dashboard**: View your progress and statistics

## Tech Stack

### Frontend
- React 18
- Tailwind CSS
- React Router
- Axios
- React Hot Toast
- Lucide React Icons

### Backend
- Python Flask
- Flask-JWT-Extended
- Flask-CORS
- Flask-PyMongo (MongoDB)
- Google Generative AI (Gemini) [optional]

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8 or higher
- Gemini API key from Google AI Studio

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows:
     ```bash
     venv\\Scripts\\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file in `backend/` with:
   ```env
   SECRET_KEY=dev-secret-key-change-in-production
   MONGO_URI=mongodb://localhost:27017/habit_tracker
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

6. Run the backend server:
   ```bash
   python app.py
   ```

   Backend runs at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

   Frontend runs at `http://localhost:3000`

## Getting Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add it to your `.env` file in the backend directory

## Usage

1. **Register/Login**: Create an account or sign in to your existing account
2. **Create Habits**: Add new habits you want to track
3. **Track Progress**: Mark habits as completed daily
4. **View Insights**: Get AI-powered insights about your progress
5. **Monitor Streaks**: Keep track of your habit streaks

## API Endpoints (key routes)

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user

### Habits
- `GET /api/habits` - Get all user habits
- `POST /api/habits` - Create a new habit
- `PUT /api/habits/<id>` - Update a habit
- `DELETE /api/habits/<id>` - Delete a habit
- `POST /api/habits/<id>/complete` - Mark habit as completed

### Stats
- `GET /api/stats` - Get cumulative totals and longest streak
- `GET /api/streak` - Get current daily streak

### AI Features
- `POST /api/ai/generate-habits` - Generate habit ideas
- `GET /api/ai/insights` - Get personalized insights

All protected routes require `Authorization: Bearer <JWT>`.

## Project Structure

```
Habit tracker bot/
├── backend/
│   ├── app.py                 # Flask app factory + boot
│   ├── database.py            # MongoDB helpers
│   ├── requirements.txt       # Python deps
│   └── routes/                # Blueprints (auth, habits, stats, ai)
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── contexts/          # React contexts
│   │   ├── App.jsx            # Main App component
│   │   ├── index.js           # Entry point
│   │   └── index.css          # Tailwind CSS
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## CORS and JWT Notes
- Frontend origin `http://localhost:3000` is allowed.
- Send JWT in the `Authorization: Bearer <token>` header.
- Cookies aren’t required unless you add cookie-based auth.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
"# Habit-tracker-bot" 
