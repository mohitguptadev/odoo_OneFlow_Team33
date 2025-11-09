const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

const register = async (req, res) => {
  try {
    const {
      email,
      password,
      full_name,
      role,
      security_question,
      security_answer,
    } = req.body;

    // Validation
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Security question validation
    if (!security_question || security_question.trim() === "") {
      return res.status(400).json({ error: "Security question is required" });
    }

    if (!security_answer || security_answer.trim() === "") {
      return res.status(400).json({ error: "Security answer is required" });
    }

    if (security_answer.trim().length < 3) {
      return res
        .status(400)
        .json({ error: "Security answer must be at least 3 characters" });
    }

    if (
      !["Admin", "Project Manager", "Team Member", "Sales/Finance"].includes(
        role
      )
    ) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Password length validation
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Hash security answer
    const security_answer_hash = await bcrypt.hash(
      security_answer.trim().toLowerCase(),
      salt
    );

    // Insert user
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, full_name, role, security_question, security_answer_hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, full_name, role, hourly_rate, created_at",
      [
        email,
        password_hash,
        full_name,
        role,
        security_question,
        security_answer_hash,
      ]
    );

    const user = result.rows[0];

    // Generate JWT token (include email for convenience)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        hourly_rate: user.hourly_rate,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Provide more specific error messages
    if (error.code === "ECONNREFUSED") {
      return res.status(500).json({
        error:
          "Database connection failed. Please check if PostgreSQL is running.",
      });
    }
    if (error.code === "28P01") {
      return res.status(500).json({
        error:
          "Database authentication failed. Please check your database password in .env file.",
      });
    }
    if (error.code === "3D000") {
      return res.status(500).json({
        error:
          "Database does not exist. Please run the database setup script first.",
      });
    }
    if (error.code === "42P01") {
      return res.status(500).json({
        error:
          "Database tables not found. Please run the database setup script to create tables.",
      });
    }

    // Handle PostgreSQL specific errors
    if (error.code === "23505") {
      // Unique constraint violation
      return res.status(400).json({
        error: "User with this email already exists",
      });
    }

    if (error.code === "42703") {
      // Column does not exist
      return res.status(500).json({
        error:
          "Database schema error. Please run the migration script to add security question columns.",
      });
    }

    res.status(500).json({
      error: "Server error during registration",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, remember_me } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const result = await pool.query(
      "SELECT id, email, password_hash, full_name, role, hourly_rate FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Wrong password" });
    }

    // Generate JWT token with different expiration based on remember_me
    const expiresIn = remember_me ? "30d" : "7d";
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        hourly_rate: user.hourly_rate,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    // Provide more specific error messages
    if (error.code === "ECONNREFUSED") {
      return res.status(500).json({
        error:
          "Database connection failed. Please check if PostgreSQL is running.",
      });
    }
    if (error.code === "28P01") {
      return res.status(500).json({
        error:
          "Database authentication failed. Please check your database password in .env file.",
      });
    }
    if (error.code === "3D000") {
      return res.status(500).json({
        error:
          "Database does not exist. Please run the database setup script first.",
      });
    }
    if (error.code === "42P01") {
      return res.status(500).json({
        error:
          "Database tables not found. Please run the database setup script to create tables.",
      });
    }

    res.status(500).json({
      error: "Server error during login",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        full_name: req.user.full_name,
        role: req.user.role,
        hourly_rate: req.user.hourly_rate,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getSecurityQuestion = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await pool.query(
      "SELECT security_question FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!result.rows[0].security_question) {
      return res
        .status(400)
        .json({ error: "Security question not set for this account" });
    }

    res.json({ security_question: result.rows[0].security_question });
  } catch (error) {
    console.error("Get security question error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const verifySecurityAnswer = async (req, res) => {
  try {
    const { email, security_answer } = req.body;

    if (!email || !security_answer) {
      return res
        .status(400)
        .json({ error: "Email and security answer are required" });
    }

    const result = await pool.query(
      "SELECT id, security_answer_hash FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    if (!user.security_answer_hash) {
      return res
        .status(400)
        .json({ error: "Security question not set for this account" });
    }

    const isMatch = await bcrypt.compare(
      security_answer.trim().toLowerCase(),
      user.security_answer_hash
    );

    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect security answer" });
    }

    // Generate temporary reset token (valid for 15 minutes)
    const resetToken = jwt.sign(
      { userId: user.id, email, type: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ reset_token: resetToken });
  } catch (error) {
    console.error("Verify security answer error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { reset_token, new_password } = req.body;

    if (!reset_token || !new_password) {
      return res
        .status(400)
        .json({ error: "Reset token and new password are required" });
    }

    if (new_password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(reset_token, process.env.JWT_SECRET);
      if (decoded.type !== "password_reset") {
        return res.status(401).json({ error: "Invalid reset token" });
      }
    } catch (error) {
      return res.status(401).json({ error: "Invalid or expired reset token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    // Update password
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [password_hash, decoded.userId]
    );

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  getSecurityQuestion,
  verifySecurityAnswer,
  resetPassword,
};
