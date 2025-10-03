import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Brain,
  RefreshCw,
  TrendingUp,
  Target,
  Calendar,
} from "lucide-react";

const AIInsights = () => {
  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHabits: 0,
    totalCompleted: 0,
    totalStreak: 0,
    longestStreak: 0,
  });
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    fetchInsights();
    fetchStats();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/ai/insights", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInsights(response.data.insight);
    } catch (error) {
      toast.error("Failed to fetch AI insights");
      setInsights(
        "AI insights are currently unavailable. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [statsRes, streakRes] = await Promise.all([
        axios.get("http://localhost:5000/api/stats", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:5000/api/streak", { headers: { Authorization: `Bearer ${token}` } }),
      ]);


      const { total_habits_created = 0, total_completions = 0, longest_daily_streak = 0 } = statsRes.data || {};
      const { current_streak = 0 } = streakRes.data || {};

      setStats({
        totalHabits: total_habits_created,
        totalCompleted: total_completions,
        totalStreak: current_streak,
        longestStreak: longest_daily_streak,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      toast.error("Failed to load statistics");
    }
  };

  const refreshInsights = () => {
    setLoading(true);
    fetchInsights();
  };

  

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">AI Insights</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Grid */}
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Your Statistics</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-primary-600 flex-shrink-0" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Habits</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalHabits}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-success-600 flex-shrink-0" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalCompleted}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-success-600 flex-shrink-0" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Current Streak</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalStreak}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-amber-600 flex-shrink-0" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Longest Streak
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.longestStreak}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Personalized Insights
              </h2>
            </div>
            <button
              onClick={refreshInsights}
              disabled={loading}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="prose max-w-none">
              <div className="bg-primary-50 rounded-lg p-4 sm:p-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line break-words text-sm sm:text-base">
                  {insights ||
                    "No insights available. Start tracking habits to get personalized analysis!"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="card mt-8">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            💡 Tips for Better Habit Tracking
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "Start small and build momentum with achievable daily goals.",
              "Track your habits consistently to build strong streaks.",
              "Use the AI assistant for personalized suggestions and motivation.",
              "Review your progress regularly to stay motivated.",
            ].map((tip, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 text-sm font-medium">
                    {idx + 1}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIInsights;
