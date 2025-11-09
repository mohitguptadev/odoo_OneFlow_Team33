const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/roleCheck");

router.get(
  "/",
  authenticate,
  requireRole(["Admin"]),
  userController.getAllUsers
);
router.get("/:id", authenticate, userController.getUserById);
router.put("/:id", authenticate, userController.updateUser);
router.delete(
  "/:id",
  authenticate,
  requireRole(["Admin"]),
  userController.deleteUser
);

module.exports = router;
