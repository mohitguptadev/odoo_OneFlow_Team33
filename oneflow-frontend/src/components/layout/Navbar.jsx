import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LogOut, User, Trophy } from "lucide-react";
import Leaderboard from "../gamification/Leaderboard";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-40 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4 md:space-x-8">
            <Link to="/dashboard" className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              OneFlow
            </Link>
            {user && (
              <div className="hidden md:flex space-x-1">
                <Link
                  to="/dashboard"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Dashboard
                </Link>
                <Link
                  to="/projects"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Projects
                </Link>
                <Link
                  to="/tasks"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Tasks
                </Link>
                <Link
                  to="/analytics"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Analytics
                </Link>
              </div>
            )}
          </div>
          {user && (
            <div className="flex items-center space-x-3 md:space-x-4">
              <button
                onClick={() => setShowLeaderboard(true)}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-100 transition-colors"
                title="Leaderboard"
              >
                <Trophy size={18} />
                <span className="hidden md:inline">Leaderboard</span>
              </button>
              <div className="hidden md:flex items-center space-x-2 text-sm px-3 py-2 rounded-lg bg-gray-100">
                <User size={18} className="text-gray-600" />
                <span className="font-medium text-gray-700">{user.full_name}</span>
                <span className="text-gray-500 text-xs">({user.role})</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <LogOut size={18} />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <Leaderboard isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </nav>
  );
};

export default Navbar;
