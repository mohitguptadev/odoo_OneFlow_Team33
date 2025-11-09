const db = require("../config/database");

// Achievement definitions
const ACHIEVEMENTS = {
  FIRST_STEPS: {
    badge_type: "first_steps",
    badge_name: "First Steps",
    badge_description: "Complete your first task",
    points: 10,
  },
  EARLY_BIRD: {
    badge_type: "early_bird",
    badge_name: "Early Bird",
    badge_description: "Log hours before 9 AM",
    points: 20,
  },
  NIGHT_OWL: {
    badge_type: "night_owl",
    badge_name: "Night Owl",
    badge_description: "Log hours after 8 PM",
    points: 20,
  },
  SPEED_DEMON: {
    badge_type: "speed_demon",
    badge_name: "Speed Demon",
    badge_description: "Complete 5 tasks in one day",
    points: 50,
  },
  MARATHON_RUNNER: {
    badge_type: "marathon_runner",
    badge_name: "Marathon Runner",
    badge_description: "7-day streak of logging hours",
    points: 100,
  },
  TEAM_PLAYER: {
    badge_type: "team_player",
    badge_name: "Team Player",
    badge_description: "Work on 3+ projects simultaneously",
    points: 30,
  },
  PROFIT_MAKER: {
    badge_type: "profit_maker",
    badge_name: "Profit Maker",
    badge_description: "Complete project with >30% profit",
    points: 150,
  },
  ON_TIME_HERO: {
    badge_type: "on_time_hero",
    badge_name: "On Time Hero",
    badge_description: "Complete all tasks before deadline",
    points: 40,
  },
  BIG_SPENDER: {
    badge_type: "big_spender",
    badge_name: "Big Spender",
    badge_description: "Approve 10+ expenses",
    points: 60,
  },
  MONEY_MAKER: {
    badge_type: "money_maker",
    badge_name: "Money Maker",
    badge_description: "Generate ₹1,00,000+ revenue",
    points: 200,
  },
};

// Get user achievements
const getUserAchievements = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await db.query(
      "SELECT * FROM achievements WHERE user_id = $1 ORDER BY earned_at DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
};

// Get user stats
const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await db.query(
      "SELECT * FROM user_stats WHERE user_id = $1",
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Initialize stats if not exists
      await db.query(
        "INSERT INTO user_stats (user_id) VALUES ($1)",
        [userId]
      );
      const newResult = await db.query(
        "SELECT * FROM user_stats WHERE user_id = $1",
        [userId]
      );
      return res.json(newResult.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ error: "Failed to fetch user stats" });
  }
};

// Check and award achievements
const checkAchievements = async (req, res) => {
  try {
    const { userId, action, metadata } = req.body;
    const newAchievements = [];

    // Get user stats
    let statsResult = await db.query(
      "SELECT * FROM user_stats WHERE user_id = $1",
      [userId]
    );
    
    if (statsResult.rows.length === 0) {
      await db.query(
        "INSERT INTO user_stats (user_id) VALUES ($1)",
        [userId]
      );
      statsResult = await db.query(
        "SELECT * FROM user_stats WHERE user_id = $1",
        [userId]
      );
    }
    
    const stats = statsResult.rows[0];
    const existingAchievements = await db.query(
      "SELECT badge_type FROM achievements WHERE user_id = $1",
      [userId]
    );
    const earnedTypes = new Set(existingAchievements.rows.map(a => a.badge_type));

    // Check First Steps
    if (action === "task_completed" && !earnedTypes.has("first_steps")) {
      const achievement = ACHIEVEMENTS.FIRST_STEPS;
      await awardAchievement(userId, achievement);
      newAchievements.push(achievement);
      await updateUserStats(userId, achievement.points);
    }

    // Check Early Bird / Night Owl
    if (action === "hours_logged" && metadata?.hour !== undefined) {
      const hour = metadata.hour;
      if (hour < 9 && !earnedTypes.has("early_bird")) {
        const achievement = ACHIEVEMENTS.EARLY_BIRD;
        await awardAchievement(userId, achievement);
        newAchievements.push(achievement);
        await updateUserStats(userId, achievement.points);
      }
      if (hour >= 20 && !earnedTypes.has("night_owl")) {
        const achievement = ACHIEVEMENTS.NIGHT_OWL;
        await awardAchievement(userId, achievement);
        newAchievements.push(achievement);
        await updateUserStats(userId, achievement.points);
      }
    }

    // Check Speed Demon
    if (action === "task_completed") {
      const today = new Date().toISOString().split("T")[0];
      const todayTasks = await db.query(
        `SELECT COUNT(*) as count FROM tasks 
         WHERE assigned_to = $1 AND status = 'Done' 
         AND DATE(updated_at) = $2`,
        [userId, today]
      );
      if (parseInt(todayTasks.rows[0].count) >= 5 && !earnedTypes.has("speed_demon")) {
        const achievement = ACHIEVEMENTS.SPEED_DEMON;
        await awardAchievement(userId, achievement);
        newAchievements.push(achievement);
        await updateUserStats(userId, achievement.points);
      }
    }

    // Check Marathon Runner (7-day streak)
    if (action === "hours_logged") {
      const today = new Date().toISOString().split("T")[0];
      const lastActivity = stats.last_activity_date 
        ? new Date(stats.last_activity_date).toISOString().split("T")[0]
        : null;
      
      let newStreak = stats.streak_days || 0;
      if (lastActivity === today) {
        // Already logged today, no change
      } else if (lastActivity && 
                 new Date(today) - new Date(lastActivity) === 86400000) {
        // Consecutive day
        newStreak += 1;
      } else {
        // New streak
        newStreak = 1;
      }

      await db.query(
        `UPDATE user_stats 
         SET streak_days = $1, last_activity_date = $2 
         WHERE user_id = $3`,
        [newStreak, today, userId]
      );

      if (newStreak >= 7 && !earnedTypes.has("marathon_runner")) {
        const achievement = ACHIEVEMENTS.MARATHON_RUNNER;
        await awardAchievement(userId, achievement);
        newAchievements.push(achievement);
        await updateUserStats(userId, achievement.points);
      }
    }

    // Check Team Player
    if (action === "project_assigned") {
      const projectCount = await db.query(
        `SELECT COUNT(DISTINCT project_id) as count 
         FROM project_members WHERE user_id = $1`,
        [userId]
      );
      if (parseInt(projectCount.rows[0].count) >= 3 && !earnedTypes.has("team_player")) {
        const achievement = ACHIEVEMENTS.TEAM_PLAYER;
        await awardAchievement(userId, achievement);
        newAchievements.push(achievement);
        await updateUserStats(userId, achievement.points);
      }
    }

    // Check Profit Maker
    if (action === "project_completed" && metadata?.projectId) {
      const projectData = await db.query(
        `SELECT p.budget, 
         COALESCE(SUM(ci.total_amount), 0) as revenue,
         COALESCE(SUM(vb.total_amount), 0) + COALESCE(SUM(e.amount), 0) as costs
         FROM projects p
         LEFT JOIN customer_invoices ci ON ci.project_id = p.id
         LEFT JOIN vendor_bills vb ON vb.project_id = p.id
         LEFT JOIN expenses e ON e.project_id = p.id AND e.status = 'Approved'
         WHERE p.id = $1
         GROUP BY p.id, p.budget`,
        [metadata.projectId]
      );
      
      if (projectData.rows.length > 0) {
        const { revenue, costs, budget } = projectData.rows[0];
        const profit = parseFloat(revenue) - parseFloat(costs);
        const profitMargin = budget > 0 ? (profit / parseFloat(budget)) * 100 : 0;
        
        if (profitMargin > 30 && !earnedTypes.has("profit_maker")) {
          const achievement = ACHIEVEMENTS.PROFIT_MAKER;
          await awardAchievement(userId, achievement);
          newAchievements.push(achievement);
          await updateUserStats(userId, achievement.points);
        }
      }
    }

    // Check On Time Hero
    if (action === "project_completed" && metadata?.projectId) {
      const overdueTasks = await db.query(
        `SELECT COUNT(*) as count FROM tasks 
         WHERE project_id = $1 AND status = 'Done' 
         AND due_date < updated_at`,
        [metadata.projectId]
      );
      if (parseInt(overdueTasks.rows[0].count) === 0 && !earnedTypes.has("on_time_hero")) {
        const achievement = ACHIEVEMENTS.ON_TIME_HERO;
        await awardAchievement(userId, achievement);
        newAchievements.push(achievement);
        await updateUserStats(userId, achievement.points);
      }
    }

    // Check Big Spender
    if (action === "expense_approved") {
      const approvedCount = await db.query(
        `SELECT COUNT(*) as count FROM expenses 
         WHERE approved_by = $1 AND status = 'Approved'`,
        [userId]
      );
      if (parseInt(approvedCount.rows[0].count) >= 10 && !earnedTypes.has("big_spender")) {
        const achievement = ACHIEVEMENTS.BIG_SPENDER;
        await awardAchievement(userId, achievement);
        newAchievements.push(achievement);
        await updateUserStats(userId, achievement.points);
      }
    }

    // Check Money Maker
    if (action === "invoice_created") {
      const totalRevenue = await db.query(
        `SELECT COALESCE(SUM(total_amount), 0) as total 
         FROM customer_invoices WHERE created_by = $1 AND status = 'Paid'`,
        [userId]
      );
      if (parseFloat(totalRevenue.rows[0].total) >= 100000 && !earnedTypes.has("money_maker")) {
        const achievement = ACHIEVEMENTS.MONEY_MAKER;
        await awardAchievement(userId, achievement);
        newAchievements.push(achievement);
        await updateUserStats(userId, achievement.points);
      }
    }

    // Update tasks_completed and hours_logged stats
    if (action === "task_completed") {
      await db.query(
        `UPDATE user_stats SET tasks_completed = tasks_completed + 1 WHERE user_id = $1`,
        [userId]
      );
    }
    if (action === "hours_logged" && metadata?.hours) {
      await db.query(
        `UPDATE user_stats SET hours_logged = hours_logged + $1 WHERE user_id = $2`,
        [metadata.hours, userId]
      );
    }

    res.json({ newAchievements });
  } catch (error) {
    console.error("Error checking achievements:", error);
    res.status(500).json({ error: "Failed to check achievements" });
  }
};

// Helper function to award achievement
const awardAchievement = async (userId, achievement) => {
  await db.query(
    `INSERT INTO achievements (user_id, badge_type, badge_name, badge_description, points)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, badge_type) DO NOTHING`,
    [
      userId,
      achievement.badge_type,
      achievement.badge_name,
      achievement.badge_description,
      achievement.points,
    ]
  );
};

// Helper function to update user stats
const updateUserStats = async (userId, points) => {
  const statsResult = await db.query(
    "SELECT total_points FROM user_stats WHERE user_id = $1",
    [userId]
  );
  const newTotal = (statsResult.rows[0]?.total_points || 0) + points;
  const newLevel = Math.floor(newTotal / 100) + 1;
  
  await db.query(
    `UPDATE user_stats 
     SET total_points = $1, level = $2, updated_at = CURRENT_TIMESTAMP 
     WHERE user_id = $3`,
    [newTotal, newLevel, userId]
  );
};

// Get leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const { period = "all" } = req.query;
    let dateFilter = "";
    
    if (period === "week") {
      dateFilter = "AND a.earned_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (period === "month") {
      dateFilter = "AND a.earned_at >= CURRENT_DATE - INTERVAL '30 days'";
    }
    
    // Fix SQL for PostgreSQL
    const dateFilterSQL = period === "week" 
      ? "AND a.earned_at >= CURRENT_DATE - INTERVAL '7 days'"
      : period === "month"
      ? "AND a.earned_at >= CURRENT_DATE - INTERVAL '30 days'"
      : "";

    const result = await db.query(
      `SELECT 
        u.id,
        u.full_name,
        u.email,
        COALESCE(us.total_points, 0) as total_points,
        COALESCE(us.level, 1) as level,
        COALESCE(us.streak_days, 0) as streak_days,
        COUNT(DISTINCT a.id) as badge_count
       FROM users u
       LEFT JOIN user_stats us ON us.user_id = u.id
       LEFT JOIN achievements a ON a.user_id = u.id ${dateFilterSQL}
       GROUP BY u.id, u.full_name, u.email, us.total_points, us.level, us.streak_days
       ORDER BY total_points DESC, badge_count DESC
       LIMIT 10`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};

module.exports = {
  getUserAchievements,
  getUserStats,
  checkAchievements,
  getLeaderboard,
};

