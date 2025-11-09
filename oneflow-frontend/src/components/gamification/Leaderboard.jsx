import React, { useState, useEffect } from "react";
import { Trophy, Medal, Award, X } from "lucide-react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import Modal from "../common/Modal";

const Leaderboard = ({ isOpen, onClose }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, period]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/gamification/leaderboard?period=${period}`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="text-yellow-500" size={24} />;
    if (rank === 2) return <Medal className="text-gray-400" size={24} />;
    if (rank === 3) return <Award className="text-orange-600" size={24} />;
    return <span className="text-gray-600 font-bold">{rank}</span>;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600";
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-500";
    if (rank === 3) return "bg-gradient-to-r from-orange-400 to-orange-600";
    return "bg-gray-100";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="Leaderboard">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setPeriod("week")}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                period === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                period === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriod("all")}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                period === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No leaderboard data available
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = user && entry.id === user.id;

              return (
                <div
                  key={entry.id}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    isCurrentUser
                      ? "bg-blue-50 border-blue-300 shadow-md"
                      : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankColor(rank)}`}>
                        {getRankIcon(rank)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className={`font-semibold ${isCurrentUser ? "text-blue-900" : "text-gray-900"}`}>
                            {entry.full_name}
                          </p>
                          {isCurrentUser && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Level {entry.level} • {entry.badge_count} badges • 🔥 {entry.streak_days} day streak
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${isCurrentUser ? "text-blue-900" : "text-gray-900"}`}>
                        {entry.total_points.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">points</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default Leaderboard;

