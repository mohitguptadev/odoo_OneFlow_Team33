const express = require("express");
const router = express.Router();
const {
  getUserAchievements,
  getUserStats,
  checkAchievements,
  getLeaderboard,
} = require("../controllers/gamificationController");
const auth = require("../middleware/auth");

// All routes require authentication
router.use(auth);

// Get user achievements
router.get("/achievements/:userId", getUserAchievements);

// Get user stats
router.get("/user-stats/:userId", getUserStats);

// Check and award achievements
router.post("/check-achievements", checkAchievements);

// Get leaderboard
router.get("/leaderboard", getLeaderboard);

module.exports = router;

