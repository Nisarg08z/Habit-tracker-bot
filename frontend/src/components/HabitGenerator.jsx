import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Brain, RefreshCw, Plus, X, Target, Calendar, Hash } from 'lucide-react';

const HabitGenerator = ({ onHabitAdded }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [addingHabits, setAddingHabits] = useState(new Set());
  const token = localStorage.getItem('token');

  const generateHabits = async () => {
    if (!query.trim()) {
      toast.error('Please describe what habits you want');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:5000/api/ai/generate-habits',
        { query: query.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuggestions(response.data.habits || []);
      if (response.data.habits?.length === 0) {
        toast.info('No habits generated. Try a different description.');
      }
    } catch (error) {
      toast.error('Failed to generate habits');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const addHabit = async (habit) => {
    setAddingHabits(prev => new Set([...prev, habit.id]));
    
    try {
      await axios.post(
        'http://localhost:5000/api/habits',
        {
          title: habit.title,
          description: habit.description,
          frequency: habit.frequency,
          target_count: habit.target_count
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Added "${habit.title}" to your habits!`);
      onHabitAdded?.();
      
      // Remove from suggestions after adding
      setSuggestions(prev => prev.filter(h => h.id !== habit.id));
    } catch (error) {
      toast.error('Failed to add habit');
    } finally {
      setAddingHabits(prev => {
        const newSet = new Set(prev);
        newSet.delete(habit.id);
        return newSet;
      });
    }
  };

  const clearAll = () => {
    setSuggestions([]);
    setQuery('');
  };

  const refresh = () => {
    if (query.trim()) {
      generateHabits();
    }
  };

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-4">
        <Brain className="h-5 w-5 text-primary-600" />
        <h3 className="font-medium text-gray-900">AI Habit Generator</h3>
      </div>

      <div className="space-y-4">
        {/* Input Section */}
        <div className="space-y-2">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe the habits you want... (e.g., 'daily health habits', 'morning routine', 'fitness goals')"
            className="input-field min-h-[80px] resize-y"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={generateHabits}
              disabled={loading || !query.trim()}
              className="btn-primary flex items-center space-x-2 flex-1"
            >
              <Brain className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
              <span>{loading ? 'Generating...' : 'Generate Habits'}</span>
            </button>
            {suggestions.length > 0 && (
              <>
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="btn-secondary flex items-center space-x-2"
                  title="Refresh suggestions"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={clearAll}
                  className="btn-secondary flex items-center space-x-2"
                  title="Clear all"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && !loading && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">
              AI Generated Habits ({suggestions.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {suggestions.map((habit) => (
                <div
                  key={habit.id}
                  className="p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 text-sm break-words line-clamp-1">
                        {habit.title}
                      </h5>
                      {habit.description && (
                        <p className="text-xs text-gray-600 mt-1 break-words line-clamp-2">
                          {habit.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {habit.frequency}
                        </span>
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {habit.target_count}x per day
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => addHabit(habit)}
                      disabled={addingHabits.has(habit.id)}
                      className="btn-primary text-xs px-2 py-1 flex items-center space-x-1 flex-shrink-0"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{addingHabits.has(habit.id) ? 'Adding...' : 'Add'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitGenerator;

