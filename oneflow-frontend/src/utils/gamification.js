import api from "./api";

// Check achievements after an action
export const checkAchievements = async (userId, action, metadata = {}) => {
  try {
    const response = await api.post("/gamification/check-achievements", {
      userId,
      action,
      metadata,
    });
    return response.data.newAchievements || [];
  } catch (error) {
    console.error("Error checking achievements:", error);
    return [];
  }
};

// Get user achievements
export const getUserAchievements = async (userId) => {
  try {
    const response = await api.get(`/gamification/achievements/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return [];
  }
};

// Get user stats
export const getUserStats = async (userId) => {
  try {
    const response = await api.get(`/gamification/user-stats/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return null;
  }
};

