const pool = require("../config/database");

const getAllProjects = async (req, res) => {
  try {
    const { status, project_manager_id } = req.query;
    let query = "SELECT * FROM projects WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (project_manager_id) {
      query += ` AND project_manager_id = $${paramCount}`;
      params.push(project_manager_id);
      paramCount++;
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get all projects error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const projectResult = await pool.query(
      "SELECT * FROM projects WHERE id = $1",
      [id]
    );
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projectResult.rows[0];

    // Get members
    const membersResult = await pool.query(
      "SELECT u.id, u.full_name, u.email, u.role FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = $1",
      [id]
    );

    // Get tasks count
    const tasksResult = await pool.query(
      "SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'Done' THEN 1 END) as completed FROM tasks WHERE project_id = $1",
      [id]
    );

    project.members = membersResult.rows;
    project.tasks_count = parseInt(tasksResult.rows[0].total);
    project.completed_tasks = parseInt(tasksResult.rows[0].completed);

    res.json(project);
  } catch (error) {
    console.error("Get project by id error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      status,
      start_date,
      end_date,
      budget,
      project_manager_id,
      member_ids,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const result = await pool.query(
      "INSERT INTO projects (name, description, status, start_date, end_date, budget, project_manager_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        name,
        description,
        status || "Planned",
        start_date,
        end_date,
        budget,
        project_manager_id,
      ]
    );

    const project = result.rows[0];

    // Add members if provided
    if (member_ids && Array.isArray(member_ids)) {
      for (const userId of member_ids) {
        await pool.query(
          "INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [project.id, userId]
        );
      }
    }

    res.status(201).json(project);
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      status,
      start_date,
      end_date,
      budget,
      project_manager_id,
    } = req.body;

    const result = await pool.query(
      "UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description), status = COALESCE($3, status), start_date = COALESCE($4, start_date), end_date = COALESCE($5, end_date), budget = COALESCE($6, budget), project_manager_id = COALESCE($7, project_manager_id), updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *",
      [
        name,
        description,
        status,
        start_date,
        end_date,
        budget,
        project_manager_id,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM projects WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    await pool.query(
      "INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [id, user_id]
    );

    res.json({ message: "Member added successfully" });
  } catch (error) {
    console.error("Add member error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    await pool.query(
      "DELETE FROM project_members WHERE project_id = $1 AND user_id = $2",
      [id, userId]
    );

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getFinancialSummary = async (req, res) => {
  try {
    const { id } = req.params;

    // Get revenue (paid invoices)
    const revenueResult = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM customer_invoices WHERE project_id = $1 AND status = 'Paid'",
      [id]
    );

    // Get vendor bills
    const billsResult = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM vendor_bills WHERE project_id = $1 AND status = 'Paid'",
      [id]
    );

    // Get expenses
    const expensesResult = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE project_id = $1 AND status = 'Approved'",
      [id]
    );

    // Get timesheet costs
    const timesheetsResult = await pool.query(
      `SELECT COALESCE(SUM(t.hours_worked * u.hourly_rate), 0) as total 
       FROM timesheets t 
       JOIN tasks tk ON t.task_id = tk.id 
       JOIN users u ON t.user_id = u.id 
       WHERE tk.project_id = $1`,
      [id]
    );

    // Get project budget
    const projectResult = await pool.query(
      "SELECT budget FROM projects WHERE id = $1",
      [id]
    );
    const budget = projectResult.rows[0]?.budget || 0;

    const total_revenue = parseFloat(revenueResult.rows[0].total);
    const total_costs =
      parseFloat(billsResult.rows[0].total) +
      parseFloat(expensesResult.rows[0].total) +
      parseFloat(timesheetsResult.rows[0].total);
    const profit = total_revenue - total_costs;
    const budget_usage = budget > 0 ? (total_costs / budget) * 100 : 0;

    res.json({
      total_revenue,
      total_costs,
      profit,
      budget_usage: parseFloat(budget_usage.toFixed(2)),
      budget,
    });
  } catch (error) {
    console.error("Get financial summary error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getFinancialSummary,
};
