const pool = require('../config/database');

const getDashboardStats = async (req, res) => {
  try {
    
    const totalProjects = await pool.query('SELECT COUNT(*) as count FROM projects');
    const activeProjects = await pool.query("SELECT COUNT(*) as count FROM projects WHERE status = 'In Progress'");
    const completedProjects = await pool.query("SELECT COUNT(*) as count FROM projects WHERE status = 'Completed'");
    const delayedTasks = await pool.query("SELECT COUNT(*) as count FROM tasks WHERE due_date < CURRENT_DATE AND status != 'Done'");
    const totalHours = await pool.query('SELECT COALESCE(SUM(hours_worked), 0) as total FROM timesheets');
    const billableHours = await pool.query("SELECT COALESCE(SUM(hours_worked), 0) as total FROM timesheets WHERE is_billable = true");
    const nonBillableHours = await pool.query("SELECT COALESCE(SUM(hours_worked), 0) as total FROM timesheets WHERE is_billable = false");
    const totalRevenue = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM customer_invoices WHERE status = 'Paid'");
    
    // Calculate total costs
    const vendorBills = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM vendor_bills WHERE status = 'Paid'");
    const expenses = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status = 'Approved'");
    const timesheetCosts = await pool.query(`
      SELECT COALESCE(SUM(t.hours_worked * u.hourly_rate), 0) as total 
      FROM timesheets t 
      JOIN users u ON t.user_id = u.id
    `);
    
    const totalCosts = parseFloat(vendorBills.rows[0].total) + parseFloat(expenses.rows[0].total) + parseFloat(timesheetCosts.rows[0].total);
    const totalProfit = parseFloat(totalRevenue.rows[0].total) - totalCosts;

    res.json({
      total_projects: parseInt(totalProjects.rows[0].count),
      active_projects: parseInt(activeProjects.rows[0].count),
      completed_projects: parseInt(completedProjects.rows[0].count),
      delayed_tasks: parseInt(delayedTasks.rows[0].count),
      total_hours_logged: parseFloat(totalHours.rows[0].total),
      billable_hours: parseFloat(billableHours.rows[0].total),
      non_billable_hours: parseFloat(nonBillableHours.rows[0].total),
      total_revenue: parseFloat(totalRevenue.rows[0].total),
      total_costs: totalCosts,
      total_profit: totalProfit,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getProjectAnalytics = async (req, res) => {
  try {
    const projects = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    const projectsWithStats = await Promise.all(
      projects.rows.map(async (project) => {
        // Get task stats
        const tasksResult = await pool.query(
          'SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'Done\' THEN 1 END) as done, COUNT(CASE WHEN status = \'New\' THEN 1 END) as new, COUNT(CASE WHEN status = \'In Progress\' THEN 1 END) as in_progress, COUNT(CASE WHEN status = \'Blocked\' THEN 1 END) as blocked FROM tasks WHERE project_id = $1',
          [project.id]
        );

        // Get team size
        const teamSizeResult = await pool.query(
          'SELECT COUNT(*) as count FROM project_members WHERE project_id = $1',
          [project.id]
        );

        // Get financial data
        const revenueResult = await pool.query(
          'SELECT COALESCE(SUM(total_amount), 0) as total FROM customer_invoices WHERE project_id = $1 AND status = \'Paid\'',
          [project.id]
        );
        const billsResult = await pool.query(
          'SELECT COALESCE(SUM(total_amount), 0) as total FROM vendor_bills WHERE project_id = $1 AND status = \'Paid\'',
          [project.id]
        );
        const expensesResult = await pool.query(
          'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE project_id = $1 AND status = \'Approved\'',
          [project.id]
        );
        const timesheetCostsResult = await pool.query(
          `SELECT COALESCE(SUM(t.hours_worked * u.hourly_rate), 0) as total 
           FROM timesheets t 
           JOIN tasks tk ON t.task_id = tk.id 
           JOIN users u ON t.user_id = u.id 
           WHERE tk.project_id = $1`,
          [project.id]
        );

        const taskStats = tasksResult.rows[0];
        const totalTasks = parseInt(taskStats.total);
        const completedTasks = parseInt(taskStats.done);
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        const revenue = parseFloat(revenueResult.rows[0].total);
        const costs = parseFloat(billsResult.rows[0].total) + parseFloat(expensesResult.rows[0].total) + parseFloat(timesheetCostsResult.rows[0].total);
        const profit = revenue - costs;
        const budgetUsage = project.budget > 0 ? (costs / project.budget) * 100 : 0;

        return {
          ...project,
          progress_percentage: parseFloat(progress.toFixed(2)),
          budget_usage: parseFloat(budgetUsage.toFixed(2)),
          revenue,
          costs,
          profit,
          team_size: parseInt(teamSizeResult.rows[0].count),
          task_stats: {
            total: totalTasks,
            new: parseInt(taskStats.new),
            in_progress: parseInt(taskStats.in_progress),
            blocked: parseInt(taskStats.blocked),
            done: completedTasks,
          },
        };
      })
    );

    res.json(projectsWithStats);
  } catch (error) {
    console.error('Get project analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getResourceUtilization = async (req, res) => {
  try {
    const users = await pool.query('SELECT id, full_name, email, role, hourly_rate FROM users');
    const usersWithStats = await Promise.all(
      users.rows.map(async (user) => {
        // Get hours logged in last 30 days
        const hoursResult = await pool.query(
          'SELECT COALESCE(SUM(hours_worked), 0) as total FROM timesheets WHERE user_id = $1 AND work_date >= CURRENT_DATE - INTERVAL \'30 days\'',
          [user.id]
        );

        // Get projects count
        const projectsResult = await pool.query(
          'SELECT COUNT(*) as count FROM project_members WHERE user_id = $1',
          [user.id]
        );

        // Get tasks count
        const tasksResult = await pool.query(
          'SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'Done\' THEN 1 END) as completed FROM tasks WHERE assigned_to = $1',
          [user.id]
        );

        const totalTasks = parseInt(tasksResult.rows[0].total);
        const completedTasks = parseInt(tasksResult.rows[0].completed);
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
          ...user,
          total_hours_logged: parseFloat(hoursResult.rows[0].total),
          projects_count: parseInt(projectsResult.rows[0].count),
          tasks_count: totalTasks,
          tasks_completed: completedTasks,
          completion_rate: parseFloat(completionRate.toFixed(2)),
        };
      })
    );

    res.json(usersWithStats);
  } catch (error) {
    console.error('Get resource utilization error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getProjectCostBreakdown = async (req, res) => {
  try {
    const { id } = req.params;

    // Get vendor bills
    const billsResult = await pool.query(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM vendor_bills WHERE project_id = $1',
      [id]
    );

    // Get expenses
    const expensesResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE project_id = $1 AND status = \'Approved\'',
      [id]
    );

    // Get timesheet costs by team member
    const timesheetCostsResult = await pool.query(
      `SELECT u.id, u.full_name, COALESCE(SUM(t.hours_worked * u.hourly_rate), 0) as total 
       FROM timesheets t 
       JOIN tasks tk ON t.task_id = tk.id 
       JOIN users u ON t.user_id = u.id 
       WHERE tk.project_id = $1
       GROUP BY u.id, u.full_name`,
      [id]
    );

    const vendorBillsTotal = parseFloat(billsResult.rows[0].total);
    const expensesTotal = parseFloat(expensesResult.rows[0].total);
    const timesheetCostsTotal = timesheetCostsResult.rows.reduce((sum, row) => sum + parseFloat(row.total), 0);
    const totalCosts = vendorBillsTotal + expensesTotal + timesheetCostsTotal;

    // Get project budget
    const projectResult = await pool.query('SELECT budget FROM projects WHERE id = $1', [id]);
    const budget = projectResult.rows[0]?.budget || 0;
    const budgetRemaining = budget - totalCosts;

    res.json({
      vendor_bills_total: vendorBillsTotal,
      expenses_total: expensesTotal,
      timesheet_costs_total: timesheetCostsTotal,
      timesheet_costs_by_member: timesheetCostsResult.rows.map(row => ({
        user_id: row.id,
        user_name: row.full_name,
        cost: parseFloat(row.total),
      })),
      total_costs: totalCosts,
      budget,
      budget_remaining: budgetRemaining,
    });
  } catch (error) {
    console.error('Get project cost breakdown error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getTimeTrackingAnalytics = async (req, res) => {
  try {
    // Hours logged per day (last 7 days)
    const hoursPerDayResult = await pool.query(
      `SELECT work_date, COALESCE(SUM(hours_worked), 0) as hours 
       FROM timesheets 
       WHERE work_date >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY work_date 
       ORDER BY work_date ASC`
    );

    // Hours by project (top 5)
    const hoursByProjectResult = await pool.query(
      `SELECT p.id, p.name, COALESCE(SUM(t.hours_worked), 0) as hours 
       FROM timesheets t 
       JOIN tasks tk ON t.task_id = tk.id 
       JOIN projects p ON tk.project_id = p.id 
       GROUP BY p.id, p.name 
       ORDER BY hours DESC 
       LIMIT 5`
    );

    // Billable vs non-billable
    const billableResult = await pool.query(
      "SELECT COALESCE(SUM(hours_worked), 0) as total FROM timesheets WHERE is_billable = true"
    );
    const nonBillableResult = await pool.query(
      "SELECT COALESCE(SUM(hours_worked), 0) as total FROM timesheets WHERE is_billable = false"
    );

    res.json({
      hours_per_day: hoursPerDayResult.rows.map(row => ({
        date: row.work_date,
        hours: parseFloat(row.hours),
      })),
      hours_by_project: hoursByProjectResult.rows.map(row => ({
        project_id: row.id,
        project_name: row.name,
        hours: parseFloat(row.hours),
      })),
      billable_hours: parseFloat(billableResult.rows[0].total),
      non_billable_hours: parseFloat(nonBillableResult.rows[0].total),
    });
  } catch (error) {
    console.error('Get time tracking analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getProjectAnalytics,
  getResourceUtilization,
  getProjectCostBreakdown,
  getTimeTrackingAnalytics,
};

