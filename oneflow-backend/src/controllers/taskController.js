const pool = require("../config/database");

const getAllTasks = async (req, res) => {
  try {
    const { project_id, assigned_to, status, priority } = req.query;
    let query = "SELECT * FROM tasks WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (project_id) {
      query += ` AND project_id = $${paramCount}`;
      params.push(project_id);
      paramCount++;
    }

    if (assigned_to) {
      query += ` AND assigned_to = $${paramCount}`;
      params.push(assigned_to);
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (priority) {
      query += ` AND priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get all tasks error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tasks WHERE assigned_to = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get my tasks error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const taskResult = await pool.query("SELECT * FROM tasks WHERE id = $1", [
      id,
    ]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = taskResult.rows[0];

    // Get timesheets
    const timesheetsResult = await pool.query(
      "SELECT * FROM timesheets WHERE task_id = $1 ORDER BY work_date DESC",
      [id]
    );

    // Get comments
    const commentsResult = await pool.query(
      "SELECT tc.*, u.full_name, u.email FROM task_comments tc JOIN users u ON tc.user_id = u.id WHERE tc.task_id = $1 ORDER BY tc.created_at ASC",
      [id]
    );

    // Get attachments
    const attachmentsResult = await pool.query(
      "SELECT * FROM task_attachments WHERE task_id = $1 ORDER BY uploaded_at DESC",
      [id]
    );

    task.timesheets = timesheetsResult.rows;
    task.comments = commentsResult.rows;
    task.attachments = attachmentsResult.rows;

    res.json(task);
  } catch (error) {
    console.error("Get task by id error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const createTask = async (req, res) => {
  try {
    const {
      project_id,
      title,
      description,
      assigned_to,
      status,
      priority,
      due_date,
      estimated_hours,
    } = req.body;

    if (!project_id) {
      return res
        .status(400)
        .json({ error: "Project ID is required" });
    }

    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ error: "Task title is required" });
    }

    // Convert to proper types
    const projectId = parseInt(project_id);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: "Invalid project ID" });
    }

    const assignedTo = assigned_to && assigned_to !== '' ? parseInt(assigned_to) : null;
    if (assigned_to && assigned_to !== '' && isNaN(parseInt(assigned_to))) {
      return res.status(400).json({ error: "Invalid assigned user ID" });
    }

    const estimatedHours = estimated_hours !== null && estimated_hours !== undefined && estimated_hours !== '' 
      ? parseFloat(estimated_hours) 
      : null;
    if (estimatedHours !== null && (isNaN(estimatedHours) || estimatedHours < 0)) {
      return res.status(400).json({ error: "Estimated hours must be a valid positive number" });
    }

    const result = await pool.query(
      "INSERT INTO tasks (project_id, title, description, assigned_to, status, priority, due_date, estimated_hours, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [
        projectId,
        title.trim(),
        description && description.trim() ? description.trim() : null,
        assignedTo,
        status || "New",
        priority || "Medium",
        due_date && due_date !== '' ? due_date : null,
        estimatedHours,
        req.user.id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create task error:", error);
    
    // Handle database constraint errors
    if (error.code === '23503') {
      return res.status(400).json({ error: "Invalid project or user reference" });
    }
    
    if (error.code === '23505') {
      return res.status(400).json({ error: "Task already exists" });
    }
    
    res.status(500).json({ 
      error: "Server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      assigned_to,
      status,
      priority,
      due_date,
      estimated_hours,
    } = req.body;

    const result = await pool.query(
      "UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), assigned_to = COALESCE($3, assigned_to), status = COALESCE($4, status), priority = COALESCE($5, priority), due_date = COALESCE($6, due_date), estimated_hours = COALESCE($7, estimated_hours), updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *",
      [
        title,
        description,
        assigned_to,
        status,
        priority,
        due_date,
        estimated_hours,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ error: "Comment is required" });
    }

    const result = await pool.query(
      "INSERT INTO task_comments (task_id, user_id, comment) VALUES ($1, $2, $3) RETURNING *",
      [id, req.user.id, comment]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT tc.*, u.full_name, u.email FROM task_comments tc JOIN users u ON tc.user_id = u.id WHERE tc.task_id = $1 ORDER BY tc.created_at ASC",
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const uploadAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const file_url = `/uploads/${req.file.filename}`;

    const result = await pool.query(
      "INSERT INTO task_attachments (task_id, file_name, file_url, uploaded_by) VALUES ($1, $2, $3, $4) RETURNING *",
      [id, req.file.originalname, file_url, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Upload attachment error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getAllTasks,
  getMyTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  getComments,
  uploadAttachment,
};
