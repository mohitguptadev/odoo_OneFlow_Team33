const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/roleCheck");

router.get("/", authenticate, projectController.getAllProjects);
router.get("/:id", authenticate, projectController.getProjectById);
router.post(
  "/",
  authenticate,
  requireRole(["Admin", "Project Manager"]),
  projectController.createProject
);
router.put(
  "/:id",
  authenticate,
  requireRole(["Admin", "Project Manager"]),
  projectController.updateProject
);
router.delete(
  "/:id",
  authenticate,
  requireRole(["Admin"]),
  projectController.deleteProject
);
router.post(
  "/:id/members",
  authenticate,
  requireRole(["Admin", "Project Manager"]),
  projectController.addMember
);
router.delete(
  "/:id/members/:userId",
  authenticate,
  requireRole(["Admin", "Project Manager"]),
  projectController.removeMember
);
router.get(
  "/:id/financial-summary",
  authenticate,
  projectController.getFinancialSummary
);

module.exports = router;
