# Habit Tracker Bot

A modern habit tracking application with AI-powered insights using React + Tailwind CSS for the frontend and Python Flask with Gemini AI for the backend.

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
- SQLAlchemy
- Flask-JWT-Extended
- Google Generative AI (Gemini)
- SQLite Database

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

5. Set up environment variables:
   - Run `setup_env.bat` to create the `.env` file
   - Edit `backend/.env` and add your Gemini API key:
     ```
     GEMINI_API_KEY=your_actual_gemini_api_key_here
     SECRET_KEY=dev-secret-key-change-in-production
     DATABASE_URL=sqlite:///habits.db
     ```

6. Run the backend server:
   ```bash
   python app.py
   ```

   The backend will be available at `http://localhost:5000`

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

   The frontend will be available at `http://localhost:3000`

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

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user

### Habits
- `GET /api/habits` - Get all user habits
- `POST /api/habits` - Create a new habit
- `PUT /api/habits/<id>` - Update a habit
- `DELETE /api/habits/<id>` - Delete a habit
- `POST /api/habits/<id>/complete` - Mark habit as completed

### AI Features
- `POST /api/ai/suggestions` - Get AI suggestions
- `GET /api/ai/insights` - Get personalized insights

## Project Structure

```
habit-tracker-bot/
├── backend/
│   ├── app.py                 # Flask application
│   ├── requirements.txt       # Python dependencies
│   └── env_example.txt        # Environment variables example
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── contexts/         # React contexts
│   │   ├── App.js           # Main App component
│   │   ├── index.js         # Entry point
│   │   └── index.css        # Tailwind CSS
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

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
