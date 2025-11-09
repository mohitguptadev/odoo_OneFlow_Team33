const pool = require("../config/database");

const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, full_name, role, hourly_rate, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, email, full_name, role, hourly_rate, created_at FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get user by id error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, hourly_rate } = req.body;

    // Users can only update their own profile unless they're Admin
    if (req.user.id !== parseInt(id) && req.user.role !== "Admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = await pool.query(
      "UPDATE users SET full_name = COALESCE($1, full_name), role = COALESCE($2, role), hourly_rate = COALESCE($3, hourly_rate), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, email, full_name, role, hourly_rate",
      [full_name, role, hourly_rate, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
