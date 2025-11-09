import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/common/Card";
import BadgeDisplay from "../components/gamification/BadgeDisplay";
import ProjectModal from "../components/projects/ProjectModal";
import TaskModal from "../components/tasks/TaskModal";
import ExpenseModal from "../components/financial/ExpenseModal";
import ErrorMessage from "../components/common/ErrorMessage";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { getUserAchievements, getUserStats } from "../utils/gamification";
import {
  FolderKanban,
  AlertCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Plus,
  CheckCircle2,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { hasRole, user } = useAuth();
  const [stats, setStats] = useState({
    active_projects: 0,
    delayed_tasks: 0,
    hours_logged: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentTasks();
  }, []);

  useEffect(() => {
    fetchGamification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchGamification = async () => {
    try {
      if (!user?.id) return;
      const [ach, stats] = await Promise.all([
        getUserAchievements(user.id),
        getUserStats(user.id),
      ]);
      setAchievements(Array.isArray(ach) ? ach : []);
      setUserStats(stats);
    } catch (e) {
      setAchievements([]);
      setUserStats(null);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/analytics/dashboard");
      const data = response.data || {};
      setStats({
        active_projects: data.active_projects || 0,
        delayed_tasks: data.delayed_tasks || 0,
        total_hours_logged: data.total_hours_logged || 0,
        total_revenue: data.total_revenue || 0,
        total_projects: data.total_projects || 0,
        completed_projects: data.completed_projects || 0,
        billable_hours: data.billable_hours || 0,
        non_billable_hours: data.non_billable_hours || 0,
        total_costs: data.total_costs || 0,
        total_profit: data.total_profit || 0,
      });
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setStats({
        active_projects: 0,
        delayed_tasks: 0,
        total_hours_logged: 0,
        total_revenue: 0,
      });
      setError(error.response?.data?.error || "Failed to load dashboard data");
      setLoading(false);
    }
  };

  const fetchRecentTasks = async () => {
    try {
      const response = await api.get("/tasks");
      const completedTasks = Array.isArray(response.data) 
        ? response.data.filter(task => task.status === "Done")
        : [];
      setTasks(completedTasks.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent tasks:", error);
      setTasks([]);
    }
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen page-transition">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening with your projects.
        </p>
      </div>
      
      {/* My Badges */}
      {user && (
        <div className="mb-8">
          <Card hover glass>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">My Badges</h2>
              {userStats && (
                <p className="text-sm text-gray-600">Level {userStats.level} • {userStats.total_points?.toLocaleString?.() || userStats.total_points || 0} points • 🔥 {userStats.streak_days || 0} day streak</p>
              )}
            </div>
            <BadgeDisplay achievements={achievements} userStats={userStats} />
          </Card>
        </div>
      )}
      
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => {
            setError(null);
            fetchDashboardData();
          }} 
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card hover glass className="animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Active Projects
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.active_projects}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FolderKanban className="text-blue-600" size={28} />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Delayed Tasks
              </p>
              <p className="text-3xl font-bold text-red-600">
                {stats.delayed_tasks}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="text-red-600" size={28} />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Hours Logged
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.total_hours_logged?.toFixed(1) || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="text-green-600" size={28} />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total Revenue
              </p>
              <p className="text-3xl font-bold text-gray-900">
                ${(stats.total_revenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={28} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card hover glass className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Activity
            </h2>
          </div>
          <div className="space-y-3">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle2 className="text-green-600" size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        Task completed
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(task.updated_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">
                  No recent activity
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card hover glass className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Quick Actions
            </h2>
          </div>
          <div className="space-y-2">
            {hasRole(["Admin", "Project Manager"]) && (
              <button
                onClick={() => setShowProjectModal(true)}
                className="w-full text-left px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-300 flex items-center space-x-3 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus size={18} />
                <span>Create New Project</span>
              </button>
            )}
            <button
              onClick={() => setShowTaskModal(true)}
              className="w-full text-left px-4 py-3 bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-xl transition-all duration-300 flex items-center space-x-3 shadow-sm hover:shadow-md transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <Plus size={18} />
              <span>Create Task</span>
            </button>
            <button
              onClick={() => navigate("/tasks")}
              className="w-full text-left px-4 py-3 bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-xl transition-all duration-300 flex items-center space-x-3 shadow-sm hover:shadow-md transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <Clock size={18} />
              <span>Log Hours</span>
            </button>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="w-full text-left px-4 py-3 bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-xl transition-all duration-300 flex items-center space-x-3 shadow-sm hover:shadow-md transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <Plus size={18} />
              <span>Submit Expense</span>
            </button>
          </div>
        </Card>
      </div>

      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSave={() => {
          fetchDashboardData();
          setShowProjectModal(false);
        }}
      />

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSave={() => {
          fetchRecentTasks();
          setShowTaskModal(false);
        }}
      />

      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSave={() => {
          fetchDashboardData();
          setShowExpenseModal(false);
        }}
      />
    </div>
  );
};

export default Dashboard;
