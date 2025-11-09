const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'oneflow_db',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function upsertUser({ email, password, full_name, role, hourly_rate = 0, security_question, security_answer }) {
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);
  const security_answer_hash = await bcrypt.hash((security_answer || '').toLowerCase(), salt);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role, hourly_rate, security_question, security_answer_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       full_name = EXCLUDED.full_name,
       role = EXCLUDED.role,
       hourly_rate = COALESCE(EXCLUDED.hourly_rate, users.hourly_rate),
       security_question = EXCLUDED.security_question,
       security_answer_hash = EXCLUDED.security_answer_hash
     RETURNING id, email`,
    [email, password_hash, full_name, role, hourly_rate, security_question, security_answer_hash]
  );
  return rows[0];
}

async function ensureProject({ name, description, status = 'Planned', start_date = null, end_date = null, budget = null, project_manager_id = null }) {
  const existing = await pool.query('SELECT id FROM projects WHERE name = $1', [name]);
  if (existing.rows.length) return existing.rows[0];
  const { rows } = await pool.query(
    `INSERT INTO projects (name, description, status, start_date, end_date, budget, project_manager_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [name, description, status, start_date, end_date, budget, project_manager_id]
  );
  return rows[0];
}

async function ensureProjectMember(project_id, user_id) {
  await pool.query(
    `INSERT INTO project_members (project_id, user_id)
     VALUES ($1,$2)
     ON CONFLICT DO NOTHING`,
    [project_id, user_id]
  );
}

async function ensureTask({ project_id, title, description = null, assigned_to = null, status = 'New', priority = 'Medium', due_date = null, estimated_hours = null, created_by = null }) {
  const existing = await pool.query('SELECT id FROM tasks WHERE project_id = $1 AND title = $2', [project_id, title]);
  if (existing.rows.length) return existing.rows[0];
  const { rows } = await pool.query(
    `INSERT INTO tasks (project_id, title, description, assigned_to, status, priority, due_date, estimated_hours, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [project_id, title, description, assigned_to, status, priority, due_date, estimated_hours, created_by]
  );
  return rows[0];
}

async function ensureTimesheet({ task_id, user_id, hours_worked, work_date, description = null, is_billable = true }) {
  const existing = await pool.query(
    'SELECT id FROM timesheets WHERE task_id = $1 AND user_id = $2 AND work_date = $3',
    [task_id, user_id, work_date]
  );
  if (existing.rows.length) return existing.rows[0];
  const { rows } = await pool.query(
    `INSERT INTO timesheets (task_id, user_id, hours_worked, work_date, description, is_billable)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [task_id, user_id, hours_worked, work_date, description, is_billable]
  );
  return rows[0];
}

async function ensureSalesOrder({ so_number, project_id = null, customer_name, customer_email = null, total_amount, status = 'Draft', order_date, created_by }) {
  const existing = await pool.query('SELECT id FROM sales_orders WHERE so_number = $1', [so_number]);
  if (existing.rows.length) return existing.rows[0];
  const { rows } = await pool.query(
    `INSERT INTO sales_orders (so_number, project_id, customer_name, customer_email, total_amount, status, order_date, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [so_number, project_id, customer_name, customer_email, total_amount, status, order_date, created_by]
  );
  return rows[0];
}

async function ensureInvoice({ invoice_number, project_id = null, sales_order_id = null, customer_name, total_amount, status = 'Draft', invoice_date, due_date = null, created_by }) {
  const existing = await pool.query('SELECT id FROM customer_invoices WHERE invoice_number = $1', [invoice_number]);
  if (existing.rows.length) return existing.rows[0];
  const { rows } = await pool.query(
    `INSERT INTO customer_invoices (invoice_number, project_id, sales_order_id, customer_name, total_amount, status, invoice_date, due_date, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [invoice_number, project_id, sales_order_id, customer_name, total_amount, status, invoice_date, due_date, created_by]
  );
  return rows[0];
}

async function ensurePurchaseOrder({ po_number, project_id = null, vendor_name, vendor_email = null, total_amount, status = 'Draft', order_date, created_by }) {
  const existing = await pool.query('SELECT id FROM purchase_orders WHERE po_number = $1', [po_number]);
  if (existing.rows.length) return existing.rows[0];
  const { rows } = await pool.query(
    `INSERT INTO purchase_orders (po_number, project_id, vendor_name, vendor_email, total_amount, status, order_date, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [po_number, project_id, vendor_name, vendor_email, total_amount, status, order_date, created_by]
  );
  return rows[0];
}

async function ensureVendorBill({ bill_number, project_id = null, purchase_order_id = null, vendor_name, total_amount, status = 'Received', bill_date, due_date = null, created_by }) {
  const existing = await pool.query('SELECT id FROM vendor_bills WHERE bill_number = $1', [bill_number]);
  if (existing.rows.length) return existing.rows[0];
  const { rows } = await pool.query(
    `INSERT INTO vendor_bills (bill_number, project_id, purchase_order_id, vendor_name, total_amount, status, bill_date, due_date, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [bill_number, project_id, purchase_order_id, vendor_name, total_amount, status, bill_date, due_date, created_by]
  );
  return rows[0];
}

async function ensureExpense({ project_id = null, submitted_by, expense_type, amount, description = null, expense_date, is_billable = false, status = 'Pending', approved_by = null }) {
  const existing = await pool.query(
    `SELECT id FROM expenses WHERE project_id IS NOT DISTINCT FROM $1 AND submitted_by = $2 AND expense_type = $3 AND amount = $4 AND expense_date = $5`,
    [project_id, submitted_by, expense_type, amount, expense_date]
  );
  if (existing.rows.length) return existing.rows[0];
  const { rows } = await pool.query(
    `INSERT INTO expenses (project_id, submitted_by, expense_type, amount, description, expense_date, is_billable, status, approved_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [project_id, submitted_by, expense_type, amount, description, expense_date, is_billable, status, approved_by]
  );
  return rows[0];
}

async function ensureUserStats(user_id, { total_points = 0, level = 1, streak_days = 0, last_activity_date = null, tasks_completed = 0, hours_logged = 0 } = {}) {
  const r = await pool.query('SELECT 1 FROM user_stats WHERE user_id = $1', [user_id]);
  if (!r.rows.length) {
    await pool.query('INSERT INTO user_stats (user_id, total_points, level, streak_days, last_activity_date, tasks_completed, hours_logged) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [user_id, total_points, level, streak_days, last_activity_date, tasks_completed, hours_logged]);
  } else {
    await pool.query('UPDATE user_stats SET total_points=$2, level=$3, streak_days=$4, last_activity_date=$5, tasks_completed=$6, hours_logged=$7, updated_at=CURRENT_TIMESTAMP WHERE user_id=$1',
      [user_id, total_points, level, streak_days, last_activity_date, tasks_completed, hours_logged]);
  }
}

async function addAchievement(user_id, { badge_type, badge_name, badge_description, points }, earned_at = null) {
  await pool.query(
    `INSERT INTO achievements (user_id, badge_type, badge_name, badge_description, points, earned_at)
     VALUES ($1,$2,$3,$4,$5, COALESCE($6, CURRENT_TIMESTAMP))
     ON CONFLICT (user_id, badge_type) DO NOTHING`,
    [user_id, badge_type, badge_name, badge_description, points, earned_at]
  );
}

async function run() {
  try {
    console.log('Seeding database...');

    // Users
    const admin = await upsertUser({
      email: 'admin@oneflow.local',
      password: 'admin123',
      full_name: 'Admin User',
      role: 'Admin',
      hourly_rate: 80,
      security_question: 'What is your favorite movie?',
      security_answer: 'Inception'
    });
    const pm = await upsertUser({
      email: 'pm@oneflow.local',
      password: 'pm123456',
      full_name: 'Project Manager',
      role: 'Project Manager',
      hourly_rate: 60,
      security_question: 'What city were you born in?',
      security_answer: 'Delhi'
    });
    const member = await upsertUser({
      email: 'member@oneflow.local',
      password: 'member123',
      full_name: 'Team Member',
      role: 'Team Member',
      hourly_rate: 35,
      security_question: 'What was your childhood nickname?',
      security_answer: 'Mo'
    });
    const member2 = await upsertUser({
      email: 'designer@oneflow.local',
      password: 'designer123',
      full_name: 'Design Lead',
      role: 'Team Member',
      hourly_rate: 40,
      security_question: 'What is your favorite food?',
      security_answer: 'Pasta'
    });
    const finance = await upsertUser({
      email: 'finance@oneflow.local',
      password: 'finance123',
      full_name: 'Finance User',
      role: 'Sales/Finance',
      hourly_rate: 0,
      security_question: 'What was the name of your first pet?',
      security_answer: 'Rocky'
    });

    console.log('Users ready');

    // Projects
    const today = new Date();
    const d = (offsetDays) => new Date(Date.now() + offsetDays*86400000).toISOString().slice(0,10);

    const proj1 = await ensureProject({
      name: 'Website Revamp',
      description: 'Revamp corporate website with new branding',
      status: 'In Progress',
      start_date: d(-7),
      budget: 25000,
      project_manager_id: pm.id
    });
    const proj2 = await ensureProject({
      name: 'Mobile App Launch',
      description: 'Build and launch the customer mobile app',
      status: 'Planned',
      start_date: d(0),
      budget: 50000,
      project_manager_id: pm.id
    });
    const proj3 = await ensureProject({
      name: 'ERP Integration',
      description: 'Integrate ERP with internal systems',
      status: 'On Hold',
      start_date: d(-30),
      budget: 80000,
      project_manager_id: pm.id
    });

    await ensureProjectMember(proj1.id, pm.id);
    await ensureProjectMember(proj1.id, member.id);
    await ensureProjectMember(proj1.id, member2.id);
    await ensureProjectMember(proj2.id, pm.id);
    await ensureProjectMember(proj2.id, member.id);
    await ensureProjectMember(proj3.id, pm.id);
    await ensureProjectMember(proj3.id, member2.id);

    console.log('Projects ready');

    // Tasks
    const t1 = await ensureTask({
      project_id: proj1.id,
      title: 'Design new homepage',
      description: 'Create modern homepage layout',
      assigned_to: member.id,
      status: 'In Progress',
      priority: 'High',
      due_date: new Date(Date.now() + 7*86400000).toISOString().slice(0,10),
      estimated_hours: 12,
      created_by: pm.id
    });
    const t2 = await ensureTask({
      project_id: proj1.id,
      title: 'Implement responsive styles',
      description: 'Ensure mobile-first design',
      assigned_to: member.id,
      status: 'New',
      priority: 'Medium',
      due_date: new Date(Date.now() + 14*86400000).toISOString().slice(0,10),
      estimated_hours: 16,
      created_by: pm.id
    });
    const t3 = await ensureTask({
      project_id: proj2.id,
      title: 'Define MVP scope',
      description: 'Gather requirements and define MVP',
      assigned_to: pm.id,
      status: 'New',
      priority: 'High',
      due_date: d(10),
      estimated_hours: 8,
      created_by: pm.id
    });
    const t4 = await ensureTask({
      project_id: proj1.id,
      title: 'Build components library',
      description: 'Reusable UI components',
      assigned_to: member2.id,
      status: 'Blocked',
      priority: 'Urgent',
      due_date: d(5),
      estimated_hours: 20,
      created_by: pm.id
    });
    const t5 = await ensureTask({
      project_id: proj3.id,
      title: 'Map ERP entities',
      description: 'Define data mappings',
      assigned_to: pm.id,
      status: 'New',
      priority: 'Medium',
      due_date: d(21),
      estimated_hours: 10,
      created_by: pm.id
    });
    const t6 = await ensureTask({
      project_id: proj2.id,
      title: 'Setup CI/CD',
      description: 'Automate builds and deploys',
      assigned_to: member.id,
      status: 'In Progress',
      priority: 'High',
      due_date: d(12),
      estimated_hours: 14,
      created_by: pm.id
    });

    console.log('Tasks ready');

    // Timesheets
    await ensureTimesheet({ task_id: t1.id, user_id: member.id, hours_worked: 3.5, work_date: d(0), description: 'Wireframes', is_billable: true });
    await ensureTimesheet({ task_id: t1.id, user_id: member.id, hours_worked: 4, work_date: d(-1), description: 'Hi-fi design', is_billable: true });
    await ensureTimesheet({ task_id: t2.id, user_id: member.id, hours_worked: 2, work_date: d(0), description: 'Breakpoints', is_billable: true });
    await ensureTimesheet({ task_id: t6.id, user_id: member.id, hours_worked: 1.5, work_date: d(-2), description: 'Pipeline setup', is_billable: true });
    await ensureTimesheet({ task_id: t4.id, user_id: member2.id, hours_worked: 2, work_date: d(-3), description: 'Design tokens', is_billable: true });

    console.log('Timesheets ready');

    // Sales orders / invoices
    const so1 = await ensureSalesOrder({ so_number: 'SO-20250101-001', project_id: proj1.id, customer_name: 'Acme Corp', customer_email: 'ops@acme.com', total_amount: 15000, status: 'Confirmed', order_date: d(0), created_by: finance.id });
    const inv1 = await ensureInvoice({ invoice_number: 'INV-20250101-001', project_id: proj1.id, sales_order_id: so1.id, customer_name: 'Acme Corp', total_amount: 15000, status: 'Sent', invoice_date: d(0), due_date: d(14), created_by: finance.id });

    const so2 = await ensureSalesOrder({ so_number: 'SO-20250101-002', project_id: proj2.id, customer_name: 'Globex Ltd', customer_email: 'orders@globex.com', total_amount: 32000, status: 'In Progress', order_date: d(-3), created_by: finance.id });
    const inv2 = await ensureInvoice({ invoice_number: 'INV-20250101-002', project_id: proj2.id, sales_order_id: so2.id, customer_name: 'Globex Ltd', total_amount: 12000, status: 'Paid', invoice_date: d(-2), due_date: d(12), created_by: finance.id });

    const so3 = await ensureSalesOrder({ so_number: 'SO-20250101-003', project_id: proj3.id, customer_name: 'Soylent Inc', customer_email: 'ap@soylent.com', total_amount: 45000, status: 'Confirmed', order_date: d(-10), created_by: finance.id });
    const inv3 = await ensureInvoice({ invoice_number: 'INV-20250101-003', project_id: proj3.id, sales_order_id: so3.id, customer_name: 'Soylent Inc', total_amount: 45000, status: 'Overdue', invoice_date: d(-20), due_date: d(-5), created_by: finance.id });

    // Purchase orders / vendor bills
    const po1 = await ensurePurchaseOrder({ po_number: 'PO-20250101-001', project_id: proj1.id, vendor_name: 'Pixel Studio', vendor_email: 'hello@pixelstudio.com', total_amount: 5000, status: 'Confirmed', order_date: d(0), created_by: finance.id });
    await ensureVendorBill({ bill_number: 'BILL-20250101-001', project_id: proj1.id, purchase_order_id: po1.id, vendor_name: 'Pixel Studio', total_amount: 5000, status: 'In Payment', bill_date: d(0), due_date: d(7), created_by: finance.id });

    const po2 = await ensurePurchaseOrder({ po_number: 'PO-20250101-002', project_id: proj2.id, vendor_name: 'CloudOps', vendor_email: 'billing@cloudops.com', total_amount: 8000, status: 'Received', order_date: d(-5), created_by: finance.id });
    await ensureVendorBill({ bill_number: 'BILL-20250101-002', project_id: proj2.id, purchase_order_id: po2.id, vendor_name: 'CloudOps', total_amount: 8000, status: 'Paid', bill_date: d(-4), due_date: d(3), created_by: finance.id });

    // Expenses
    await ensureExpense({ project_id: proj1.id, submitted_by: member.id, expense_type: 'Software', amount: 49.99, description: 'Design plugin subscription', expense_date: d(0), is_billable: false, status: 'Pending' });
    await ensureExpense({ project_id: proj1.id, submitted_by: member.id, expense_type: 'Travel', amount: 120.00, description: 'Client meeting commute', expense_date: d(-2), is_billable: true, status: 'Approved', approved_by: pm.id });
    await ensureExpense({ project_id: proj2.id, submitted_by: member2.id, expense_type: 'Equipment', amount: 299.00, description: 'Headset', expense_date: d(-1), is_billable: false, status: 'Rejected', approved_by: pm.id });
    await ensureExpense({ project_id: proj2.id, submitted_by: member2.id, expense_type: 'Meals', amount: 35.50, description: 'Team lunch', expense_date: d(-6), is_billable: false, status: 'Reimbursed', approved_by: admin.id });

    console.log('Financial data ready');

    // Gamification: user stats and achievements
    const todayStr = d(0);
    await ensureUserStats(member.id, { total_points: 50, level: 1, streak_days: 3, last_activity_date: todayStr, tasks_completed: 5, hours_logged: 12 });
    await ensureUserStats(member2.id, { total_points: 80, level: 1, streak_days: 2, last_activity_date: todayStr, tasks_completed: 7, hours_logged: 10 });
    await ensureUserStats(pm.id, { total_points: 110, level: 2, streak_days: 4, last_activity_date: todayStr, tasks_completed: 3, hours_logged: 8 });
    await ensureUserStats(finance.id, { total_points: 200, level: 3, streak_days: 1, last_activity_date: todayStr, tasks_completed: 0, hours_logged: 2 });
    await ensureUserStats(admin.id, { total_points: 30, level: 1, streak_days: 1, last_activity_date: todayStr, tasks_completed: 0, hours_logged: 1 });

    // Achievements
    await addAchievement(member.id, { badge_type: 'first_steps', badge_name: 'First Steps', badge_description: 'Complete your first task', points: 10 });
    await addAchievement(member.id, { badge_type: 'early_bird', badge_name: 'Early Bird', badge_description: 'Log hours before 9 AM', points: 20 });
    await addAchievement(member.id, { badge_type: 'night_owl', badge_name: 'Night Owl', badge_description: 'Log hours after 8 PM', points: 20 });

    await addAchievement(member2.id, { badge_type: 'speed_demon', badge_name: 'Speed Demon', badge_description: 'Complete 5 tasks in one day', points: 50 });
    await addAchievement(member2.id, { badge_type: 'team_player', badge_name: 'Team Player', badge_description: 'Work on 3+ projects simultaneously', points: 30 });

    await addAchievement(pm.id, { badge_type: 'team_player', badge_name: 'Team Player', badge_description: 'Work on 3+ projects simultaneously', points: 30 });
    await addAchievement(pm.id, { badge_type: 'on_time_hero', badge_name: 'On Time Hero', badge_description: 'Complete all tasks before deadline', points: 40 });
    await addAchievement(pm.id, { badge_type: 'marathon_runner', badge_name: 'Marathon Runner', badge_description: '7-day streak of logging hours', points: 100 });

    await addAchievement(finance.id, { badge_type: 'money_maker', badge_name: 'Money Maker', badge_description: 'Generate ₹1,00,000+ revenue', points: 200 });

    console.log('Gamification seeded');

    console.log('✅ Seeding complete');
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
