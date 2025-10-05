import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import toast from 'react-hot-toast';
import HabitGenerator from './HabitGenerator';
import {
  Plus,
  LogOut,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle,
  Circle,
  Edit,
  Trash2,
  BarChart3
} from 'lucide-react';

const Dashboard = () => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalStreak, setGlobalStreak] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    testConnection();
    fetchHabits();
    fetchGlobalStreak();
  }, []);

  const testConnection = async () => {
    try {
      await api.get('/api/test');
    } catch (error) {
      console.error('Backend connection failed:', error);
    }
  };

  const fetchHabits = async () => {
    try {
      const response = await api.get('/api/habits');
      setHabits(response.data);
    } catch (error) {
      toast.error('Failed to fetch habits');
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalStreak = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/streak', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGlobalStreak(response.data.current_streak || 0);
    } catch (error) {
      // Fail silently; keep 0
    }
  };

  const completeHabit = async (habitId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(
        `/api/habits/${habitId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update the specific habit in state immediately for better UX
      if (response.data.habit) {
        setHabits(prevHabits =>
          prevHabits.map(habit =>
            habit.id === habitId
              ? {
                ...habit,
                current_streak: response.data.habit.current_streak,
                longest_streak: response.data.habit.longest_streak,
                today_completions: response.data.habit.today_completions,
                is_completed_today: response.data.habit.is_completed_today
              }
              : habit
          )
        );
      }

      toast.success('Habit completed! 🎉');

      // Refresh data to ensure consistency
      setTimeout(() => {
        fetchHabits();
        fetchGlobalStreak();
      }, 100);

    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to complete habit';
      toast.error(errorMessage);
    }
  };

  const requestDeleteHabit = (habitId) => {
    setHabitToDelete(habitId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteHabit = async () => {
    if (!habitToDelete) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(
        `/api/habits/${habitToDelete}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Habit deleted');
      setShowDeleteConfirm(false);
      setHabitToDelete(null);
      fetchHabits();
      fetchGlobalStreak();
    } catch {
      toast.error('Failed to delete habit');
    }
  };

  const cancelDeleteHabit = () => {
    setShowDeleteConfirm(false);
    setHabitToDelete(null);
  };

  const totalHabits = habits.length;
  const pendingToday = habits.filter(h => {
    if (h.frequency === 'monthly') {
      return !h.is_completed_period; // monthly tracks completion within the month
    }
    return !h.is_completed_today;
  }).length;
  const completedToday = habits.filter(h => {
    if (h.frequency === 'monthly') {
      return h.is_completed_period; // monthly tracks completion within the month
    }
    return h.is_completed_today;
  }).length;
  const totalStreak = habits.reduce((sum, h) => sum + h.current_streak, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-3">
            <div className="flex items-center space-x-3">
              <Target className="h-7 w-7 text-primary-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Habit Tracker</h1>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link to="/ai" className="btn-secondary flex items-center space-x-2">
                <span>AI Assistant</span>
              </Link>
              <Link to="/insights" className="btn-secondary flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Insights</span>
              </Link>
              <button onClick={logout} className="btn-secondary flex items-center space-x-2">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="card flex items-center">
            <Target className="h-7 w-7 text-orange-600 flex-shrink-0" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Habits Pending Today</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">{pendingToday}</p>
            </div>
          </div>

          <div className="card flex items-center">
            <CheckCircle className="h-7 w-7 text-success-600 flex-shrink-0" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Completed Today</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">{completedToday}</p>
            </div>
          </div>

          <div className="card flex items-center">
            <TrendingUp className="h-7 w-7 text-primary-600 flex-shrink-0" />
            <div className="ml-4">
              <p className="text-sm text-gray-500">Daily Streak</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">{globalStreak}</p>
            </div>
          </div>
        </div>

        {/* Habits + Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Habits List */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Your Habits</h2>
              <Link to="/habits/new" className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span>Add Habit</span>
              </Link>
            </div>

            {habits.length === 0 ? (
              <div className="card text-center py-10 sm:py-12">
                <Target className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No habits yet</h3>
                <p className="text-gray-500 mb-4 text-sm">Start building better habits today!</p>
                <Link to="/habits/new" className="btn-primary w-full sm:w-auto">Create Your First Habit</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {habits
                  .sort((a, b) => {
                    // Sort by completion status: uncompleted first, completed last
                    const aCompleted = a.frequency === 'monthly' ? a.is_completed_period : a.is_completed_today;
                    const bCompleted = b.frequency === 'monthly' ? b.is_completed_period : b.is_completed_today;

                    if (aCompleted === bCompleted) return 0; // Same status, keep original order
                    return aCompleted ? 1 : -1; // Uncompleted (-1) comes before completed (1)
                  })
                  .map((habit) => (
                    <div key={habit.id} className={`habit-card ${habit.is_completed_today ? 'completed' : ''}`}>
                      <div className="relative flex flex-col sm:flex-row sm:justify-between gap-3">
                        {/* Left - Habit Details */}
                        <div className="flex items-start sm:items-start gap-3 w-full">
                          <button
                            onClick={() => !habit.is_completed_today && completeHabit(habit.id)}
                            className="flex-shrink-0"
                            disabled={habit.is_completed_today}
                          >
                            {habit.is_completed_today ? (
                              <CheckCircle className="h-6 w-6 text-success-600" />
                            ) : (
                              <Circle className="h-6 w-6 text-gray-400 hover:text-success-600" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1 overflow-hidden pr-16">
                            <h3 className="font-medium text-gray-900 break-words line-clamp-2">{habit.title}</h3>
                            {habit.description && (
                              <p className="text-sm text-gray-500 break-words line-clamp-2 mr-10">
                                {habit.description}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-3 mt-2 text-xs sm:text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {habit.frequency}
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4" />
                                {habit.current_streak} day streak
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="font-medium text-gray-700">Today:</span>
                                <span>{habit.today_completions || 0} / {habit.target_count}</span>
                              </span>
                            </div>

                            {habit.target_count > 1 && (
                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                {Array.from({ length: habit.target_count }).map((_, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      if ((habit.today_completions || 0) <= idx) {
                                        completeHabit(habit.id);
                                      }
                                    }}
                                    disabled={(habit.today_completions || 0) > idx}
                                    className={`h-4 w-4 rounded-full border transition-colors ${idx < (habit.today_completions || 0)
                                      ? 'bg-primary-600 border-primary-600'
                                      : (habit.today_completions || 0) >= habit.target_count
                                        ? 'bg-white border-gray-300 cursor-not-allowed'
                                        : 'bg-white border-gray-300 hover:bg-primary-50 cursor-pointer'
                                      }`}
                                    title={
                                      idx < (habit.today_completions || 0)
                                        ? 'Completed'
                                        : (habit.today_completions || 0) >= habit.target_count
                                          ? 'All completions done'
                                          : 'Mark as complete'
                                    }
                                  />
                                ))}
                                <span className="text-sm text-gray-500 ml-2">
                                  {habit.today_completions || 0} / {habit.target_count}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right - Buttons */}
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                          <Link to={`/habits/${habit.id}/edit`} className="p-2 text-gray-400 hover:text-primary-600">
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => requestDeleteHabit(habit.id)}
                            className="p-2 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* Widgets Placeholder */}
          {/* AI Habit Generator */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <HabitGenerator onHabitAdded={() => {
              fetchHabits();
              fetchGlobalStreak();
            }} />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={cancelDeleteHabit}></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto animate-scaleIn">
            <div className="px-6 py-5 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Habit</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700">Are you sure you want to delete this habit? All progress will be permanently removed.</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button onClick={cancelDeleteHabit} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={confirmDeleteHabit} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
