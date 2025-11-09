const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const authenticate = require("../middleware/auth");

router.get("/dashboard", authenticate, analyticsController.getDashboardStats);
router.get("/projects", authenticate, analyticsController.getProjectAnalytics);
router.get(
  "/resource-utilization",
  authenticate,
  analyticsController.getResourceUtilization
);
router.get(
  "/projects/:id/cost-breakdown",
  authenticate,
  analyticsController.getProjectCostBreakdown
);
router.get(
  "/time-tracking",
  authenticate,
  analyticsController.getTimeTrackingAnalytics
);

module.exports = router;
