const pool = require('../config/database');

const calculateCompletedWorkValue = async (req, res) => {
  try {
    const { project_id } = req.params;

    // Get all completed tasks (status = 'Done')
    const completedTasksResult = await pool.query(
      `SELECT t.id, t.title, t.estimated_hours, t.assigned_to, u.hourly_rate
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.project_id = $1 AND t.status = 'Done'`,
      [project_id]
    );

    // Calculate value from completed tasks (estimated hours * hourly rate)
    let tasksValue = 0;
    const taskBreakdown = completedTasksResult.rows.map(task => {
      const hours = parseFloat(task.estimated_hours || 0);
      const rate = parseFloat(task.hourly_rate || 0);
      const value = hours * rate;
      tasksValue += value;
      return {
        task_id: task.id,
        task_title: task.title,
        estimated_hours: hours,
        hourly_rate: rate,
        value: value,
      };
    });

    // Get actual logged hours for completed tasks (billable only)
    const timesheetsResult = await pool.query(
      `SELECT t.task_id, SUM(t.hours_worked) as total_hours, u.hourly_rate
       FROM timesheets t
       JOIN tasks tk ON t.task_id = tk.id
       JOIN users u ON t.user_id = u.id
       WHERE tk.project_id = $1 AND tk.status = 'Done' AND t.is_billable = true
       GROUP BY t.task_id, u.hourly_rate`,
      [project_id]
    );

    let timesheetsValue = 0;
    const timesheetBreakdown = timesheetsResult.rows.map(ts => {
      const hours = parseFloat(ts.total_hours || 0);
      const rate = parseFloat(ts.hourly_rate || 0);
      const value = hours * rate;
      timesheetsValue += value;
      return {
        task_id: ts.task_id,
        hours_logged: hours,
        hourly_rate: rate,
        value: value,
      };
    });

    // Get approved billable expenses
    const expensesResult = await pool.query(
      `SELECT id, expense_type, amount, description
       FROM expenses
       WHERE project_id = $1 AND status = 'Approved' AND is_billable = true`,
      [project_id]
    );

    const expensesValue = expensesResult.rows.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const expensesBreakdown = expensesResult.rows.map(exp => ({
      expense_id: exp.id,
      type: exp.expense_type,
      amount: parseFloat(exp.amount),
      description: exp.description,
    }));

    // Use the higher of estimated or actual (timesheets)
    const laborValue = Math.max(tasksValue, timesheetsValue);
    const totalValue = laborValue + expensesValue;

    // Get project info for customer name
    const projectResult = await pool.query(
      'SELECT name FROM projects WHERE id = $1',
      [project_id]
    );

    // Get existing sales orders for this project
    const salesOrdersResult = await pool.query(
      'SELECT id, so_number FROM sales_orders WHERE project_id = $1 ORDER BY created_at DESC',
      [project_id]
    );

    res.json({
      project_id: parseInt(project_id),
      project_name: projectResult.rows[0]?.name || '',
      total_value: parseFloat(totalValue.toFixed(2)),
      breakdown: {
        labor_value: parseFloat(laborValue.toFixed(2)),
        expenses_value: parseFloat(expensesValue.toFixed(2)),
        tasks_breakdown: taskBreakdown,
        timesheets_breakdown: timesheetBreakdown,
        expenses_breakdown: expensesBreakdown,
      },
      sales_orders: salesOrdersResult.rows,
      can_generate: totalValue > 0,
    });
  } catch (error) {
    console.error('Calculate completed work value error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  calculateCompletedWorkValue,
};

