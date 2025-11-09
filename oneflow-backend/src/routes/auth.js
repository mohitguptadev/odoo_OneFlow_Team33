const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticate = require("../middleware/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authenticate, authController.getCurrentUser);
router.post("/forgot-password/question", authController.getSecurityQuestion);
router.post("/forgot-password/verify", authController.verifySecurityAnswer);
router.post("/forgot-password/reset", authController.resetPassword);

module.exports = router;
