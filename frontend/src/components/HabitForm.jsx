import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowLeft, Save } from "lucide-react";

const HabitForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    frequency: "daily",
    target_count: 1,
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      fetchHabit();
    }
  }, [id]);

  const fetchHabit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/habits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const habit = response.data.find((h) => h.id === id);
      if (habit) {
        setFormData({
          title: habit.title,
          description: habit.description || "",
          frequency: habit.frequency,
          target_count: habit.target_count,
        });
      } else {
        toast.error("Habit not found");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error("Failed to fetch habit");
      navigate("/dashboard");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "target_count" ? parseInt(value) || 1 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
        ...formData,
        description: (formData.description || '').trim().slice(0, 160),
      };
      
      if (isEditing) {
        await axios.put(
          `http://localhost:5000/api/habits/${id}`,
          payload,
          { headers }
        );
        toast.success("Habit updated successfully!");
      } else {
        await axios.post("http://localhost:5000/api/habits", payload, { headers });
        toast.success("Habit created successfully!");
      }
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save habit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-6 sm:p-8 rounded-xl shadow-md bg-white">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? "Edit Habit" : "Create New Habit"}
            </h1>
            <p className="mt-2 text-gray-600">
              {isEditing
                ? "Update your habit details"
                : "Set up a new habit to track"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Habit Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Drink 8 glasses of water"
                className="input-field mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:outline-none px-3 py-2"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Optional description of your habit..."
                maxLength={160}
                className="input-field mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:outline-none px-3 py-2"
              />
              <div className="mt-1 text-xs text-gray-400">{formData.description.length}/160</div>
            </div>

            {/* Frequency */}
            <div>
              <label
                htmlFor="frequency"
                className="block text-sm font-medium text-gray-700"
              >
                Frequency *
              </label>
              <select
                id="frequency"
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                required
                className="input-field mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:outline-none px-3 py-2"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {/* Target Count */}
            <div>
              <label
                htmlFor="target_count"
                className="block text-sm font-medium text-gray-700"
              >
                Target Count *
              </label>
              <input
                type="number"
                id="target_count"
                name="target_count"
                min="1"
                value={formData.target_count}
                onChange={handleChange}
                required
                className="input-field mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:outline-none px-3 py-2"
              />
              <p className="mt-1 text-sm text-gray-500">
                How many times you want to complete this habit per{" "}
                {formData.frequency}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{isEditing ? "Update Habit" : "Create Habit"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HabitForm;
