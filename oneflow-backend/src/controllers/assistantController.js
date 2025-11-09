const pool = require("../config/database");

function buildSystemPrompt(context) {
  return `You are Munim Ji, the OneFlow AI assistant for project management inside a web app.
Rules:
- ONLY discuss OneFlow projects, tasks, timesheets, users, budgets, and related guidance.
- If the user asks about anything unrelated (general world facts, coding outside the app, etc.), politely refuse: "I only assist with OneFlow."
- Be specific and data-grounded: reference exact numbers, dates, and project names from Context.
- Prefer 3–6 concise bullets. If recommending actions, tie them to the data (e.g., "Website Revamp has 3 overdue tasks").
- If data is missing, say so briefly and suggest how to collect it.

Context (database snapshot):
${context}

Answer using only the context above plus standard project-management best practices. Include at least two concrete references (counts, names, dates).`;
}

async function getContext(userId) {
  try {
    const parts = [];

    // Recent projects
    const proj = await pool.query(
      "SELECT id, name, status, budget, start_date FROM projects ORDER BY created_at DESC LIMIT 5"
    );
    const projLines = proj.rows.map(
      p => `- [${p.id}] ${p.name} (${p.status}) budget=${p.budget ?? 'N/A'} start=${p.start_date ?? 'N/A'}`
    );
    parts.push(`Recent projects:\n${projLines.join("\n") || 'None'}`);

    // Task status summary
    const taskStat = await pool.query(
      "SELECT status, COUNT(*) as c FROM tasks GROUP BY status ORDER BY status"
    );
    const statLine = taskStat.rows.map(r => `${r.status}:${r.c}`).join(', ');
    parts.push(`Task status counts: ${statLine || 'None'}`);

    // Overdue tasks summary
    const overdue = await pool.query(
      "SELECT id, title, due_date, status FROM tasks WHERE due_date IS NOT NULL AND status <> 'Done' AND due_date < CURRENT_DATE ORDER BY due_date DESC LIMIT 5"
    );
    const overdueLines = overdue.rows.map(t => `#${t.id} ${t.title} due=${t.due_date} (${t.status})`);
    parts.push(`Overdue tasks (top 5):\n${overdueLines.join("\n") || 'None'}`);

    // Top projects by overdue count
    const topOverdue = await pool.query(
      `SELECT p.id, p.name, COUNT(*) as cnt
       FROM tasks t JOIN projects p ON t.project_id = p.id
       WHERE t.due_date IS NOT NULL AND t.status <> 'Done' AND t.due_date < CURRENT_DATE
       GROUP BY p.id, p.name ORDER BY cnt DESC LIMIT 5`);
    if (topOverdue.rows.length) {
      parts.push('Projects with most overdue tasks:' + '\n' + topOverdue.rows.map(r => `- ${r.name}: ${r.cnt}`).join('\n'));
    }

    // Simple financial snapshot (paid revenue and paid vendor bills)
    const revenue = await pool.query("SELECT COALESCE(SUM(total_amount),0) AS total FROM customer_invoices WHERE status='Paid'");
    const bills = await pool.query("SELECT COALESCE(SUM(total_amount),0) AS total FROM vendor_bills WHERE status='Paid'");
    parts.push(`Financials: revenue_paid=${revenue.rows[0].total} bills_paid=${bills.rows[0].total}`);

    // User-specific upcoming tasks (if authenticated)
    if (userId) {
      const mine = await pool.query(
        "SELECT id, title, status, due_date FROM tasks WHERE assigned_to = $1 AND due_date >= CURRENT_DATE AND due_date <= CURRENT_DATE + INTERVAL '14 days' ORDER BY due_date ASC LIMIT 5",
        [userId]
      );
      const myLines = mine.rows.map(t => `#${t.id} ${t.title} due=${t.due_date} (${t.status})`);
      parts.push(`Your tasks due soon (14d):\n${myLines.join('\n') || 'None'}`);
    }

    return parts.join("\n\n");
  } catch (e) {
    return "No context available due to error.";
  }
}


const fetchFn = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));


async function tryModel(apiKey, model, input){
  const url = `https://router.huggingface.co/hf-inference/models/${encodeURIComponent(model)}`;
  const res = await fetchFn(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: input,
      parameters: {
        max_new_tokens: 256,
        temperature: 0.5,
        top_p: 0.9,
        repetition_penalty: 1.05,
        return_full_text: false,
      },
      options: { wait_for_model: true },
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(()=>"");
    return { ok:false, error:`${res.status}`, body: txt };
  }
  const data = await res.json().catch(()=>({}));
  let text = "";
  if (Array.isArray(data) && data[0]) text = data[0].generated_text || data[0].summary_text || "";
  else if (data.generated_text) text = data.generated_text;
  text = (text||"").trim();
  if (!text) return { ok:false, error:'empty' };
  return { ok:true, text };
}

async function callHuggingFace(prompt, message) {
  const apiKey = process.env.HF_API_KEY;
  const primary = process.env.HF_MODEL || "google/flan-t5-base";
  const candidates = [primary, "google/flan-t5-large", "google/flan-t5-small"];
  if (!apiKey) {
    return { ok: false, text: "HF not configured" };
  }
  const input = `${prompt}\n\nUser: ${message}\nAssistant:`;
  for (const m of candidates) {
    const r = await tryModel(apiKey, m, input);
    if (r.ok) return { ok:true, text: r.text };
  }
  return { ok:false, text: "HF unavailable" };
}

async function callOpenRouter(prompt, message) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const modelEnv = process.env.OPENROUTER_MODEL || 'mistralai/mixtral-8x7b-instruct';
  if (!apiKey) return { ok:false, text:'OpenRouter not configured' };

  const url = 'https://openrouter.ai/api/v1/chat/completions';
  const modelCandidates = [
    modelEnv,
    'deepseek/deepseek-chat-v3.1:free',
    'deepseek/deepseek-chat:free',
    'deepseek/deepseek-chat'
  ];
  for (const model of modelCandidates){
    const body = {
      model,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: message }
      ],
      temperature: 0.5,
      max_tokens: 256
    };
    try {
      const res = await fetchFn(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5000',
          'X-Title': 'OneFlow Assistant'
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) continue;
      const data = await res.json().catch(()=>({}));
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (text) return { ok:true, text };
    } catch {}
  }
  return { ok:false, text:'OpenRouter unavailable' };
}

async function callAI(prompt, message) {
  const hasOR = !!process.env.OPENROUTER_API_KEY;
  const hasHF = !!process.env.HF_API_KEY;
  // Prefer OpenRouter if configured (often faster/more available on free tier)
  if (hasOR) {
    const or = await callOpenRouter(prompt, message);
    if (or.ok) return or;
  }
  if (hasHF) {
    const hf = await callHuggingFace(prompt, message);
    if (hf.ok) return hf;
  }
  // Try the other order in case transient
  if (hasHF) {
    const hf2 = await callHuggingFace(prompt, message);
    if (hf2.ok) return hf2;
  }
  if (hasOR) {
    const or2 = await callOpenRouter(prompt, message);
    if (or2.ok) return or2;
  }
  return { ok:false, text:'All AI providers unavailable' };
}

async function bestContributors(days = 30) {
  try {
    // Top by completed tasks in last N days
    const tasksDone = await pool.query(
      `SELECT u.id, u.full_name, u.email, COUNT(*) as completed
       FROM tasks t JOIN users u ON u.id = t.assigned_to
       WHERE t.status='Done' AND t.updated_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY u.id, u.full_name, u.email
       ORDER BY completed DESC
       LIMIT 5`
    );
    // Top by hours logged in last N days
    const hours = await pool.query(
      `SELECT u.id, u.full_name, u.email, COALESCE(SUM(t.hours_worked),0) as hours
       FROM timesheets t JOIN users u ON u.id = t.user_id
       WHERE t.work_date >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY u.id, u.full_name, u.email
       ORDER BY hours DESC
       LIMIT 5`
    );
    const lines = [];
    if (tasksDone.rows.length) {
      lines.push(`Top by tasks completed (last ${days}d):`);
      tasksDone.rows.forEach((r, i) => lines.push(`${i+1}. ${r.full_name} — ${r.completed} tasks`));
    }
    if (hours.rows.length) {
      lines.push(`\nTop by hours logged (last ${days}d):`);
      hours.rows.forEach((r, i) => lines.push(`${i+1}. ${r.full_name} — ${parseFloat(r.hours).toFixed(1)}h`));
    }
    return lines.join('\n');
  } catch (e) {
    return 'Unable to compute contributors right now.';
  }
}

async function profitAdvice() {
  try {
    const revenuePaid = await pool.query("SELECT COALESCE(SUM(total_amount),0) as total FROM customer_invoices WHERE status='Paid'");
    const billsPaid = await pool.query("SELECT COALESCE(SUM(total_amount),0) as total FROM vendor_bills WHERE status='Paid'");
    const expensesApproved = await pool.query("SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE status='Approved'");
    const timesheetCosts = await pool.query(`SELECT COALESCE(SUM(t.hours_worked * u.hourly_rate),0) as total FROM timesheets t JOIN users u ON t.user_id=u.id`);

    const totalRevenue = parseFloat(revenuePaid.rows[0].total);
    const totalCosts = parseFloat(billsPaid.rows[0].total) + parseFloat(expensesApproved.rows[0].total) + parseFloat(timesheetCosts.rows[0].total);
    const profit = totalRevenue - totalCosts;

    // Low margin projects
    const perProject = await pool.query(`
      SELECT p.id, p.name,
        COALESCE((SELECT SUM(total_amount) FROM customer_invoices ci WHERE ci.project_id=p.id AND ci.status='Paid'),0) as revenue,
        COALESCE((SELECT SUM(total_amount) FROM vendor_bills vb WHERE vb.project_id=p.id AND vb.status='Paid'),0) +
        COALESCE((SELECT SUM(amount) FROM expenses e WHERE e.project_id=p.id AND e.status='Approved'),0) +
        COALESCE((SELECT SUM(t.hours_worked * u.hourly_rate) FROM timesheets t JOIN tasks tk ON t.task_id=tk.id JOIN users u ON t.user_id=u.id WHERE tk.project_id=p.id),0) as costs
      FROM projects p
      ORDER BY p.created_at DESC LIMIT 50`);

    const lowMargin = [];
    perProject.rows.forEach(r => {
      const rev = parseFloat(r.revenue||0);
      const c = parseFloat(r.costs||0);
      const margin = rev>0 ? ((rev-c)/rev)*100 : -100;
      if (rev>0 && margin < 15) lowMargin.push({ name:r.name, margin:parseFloat(margin.toFixed(1)) });
    });

    // Overdue or sent invoices (to improve cash)
    const uncollected = await pool.query(`SELECT COALESCE(SUM(total_amount),0) as total FROM customer_invoices WHERE status IN ('Sent','Overdue')`);

    const lines = [];
    lines.push(`Totals: Revenue ₹${totalRevenue.toLocaleString()} • Costs ₹${totalCosts.toLocaleString()} • Profit ₹${profit.toLocaleString()}`);
    if (parseFloat(uncollected.rows[0].total) > 0) {
      lines.push(`Uncollected invoices: ₹${parseFloat(uncollected.rows[0].total).toLocaleString()}`);
    }
    if (lowMargin.length) {
      lines.push('Low-margin projects (<15%):');
      lowMargin.slice(0,5).forEach(x=>lines.push(`- ${x.name}: ${x.margin}%`));
    }
    lines.push('\nActions:');
    lines.push('- Collect outstanding invoices (Sent/Overdue) to improve cash and profit.');
    lines.push('- Reduce costs on low-margin projects (renegotiate vendors, limit non-billable work).');
    lines.push('- Increase billable hours ratio; review tasks marked non-billable.');
    lines.push('- Prioritize high-revenue tasks and close work sooner to bill earlier.');

    return lines.join('\n');
  } catch (e) {
    return 'Unable to compute profit advice right now.';
  }
}

async function projectProfitRanking(limit = 5) {
  try {
    const perProject = await pool.query(`
      SELECT p.id, p.name,
        COALESCE((SELECT SUM(total_amount) FROM customer_invoices ci WHERE ci.project_id=p.id AND ci.status='Paid'),0) as revenue,
        COALESCE((SELECT SUM(total_amount) FROM vendor_bills vb WHERE vb.project_id=p.id AND vb.status='Paid'),0) +
        COALESCE((SELECT SUM(amount) FROM expenses e WHERE e.project_id=p.id AND e.status='Approved'),0) +
        COALESCE((SELECT SUM(t.hours_worked * u.hourly_rate) FROM timesheets t JOIN tasks tk ON t.task_id=tk.id JOIN users u ON t.user_id=u.id WHERE tk.project_id=p.id),0) as costs
      FROM projects p
      ORDER BY p.created_at DESC LIMIT 200`);
    const rows = perProject.rows.map(r => {
      const rev = parseFloat(r.revenue||0);
      const c = parseFloat(r.costs||0);
      const prof = rev - c;
      const margin = rev>0 ? ((rev-c)/rev)*100 : (prof<0?-100:0);
      return { name: r.name, revenue: rev, costs: c, profit: prof, margin: parseFloat(margin.toFixed(1)) };
    });
    const most = [...rows].sort((a,b)=>b.profit-a.profit).slice(0, limit);
    const least = [...rows].sort((a,b)=>a.profit-b.profit).slice(0, limit);
    const lines = [];
    lines.push('Most profitable projects:');
    most.forEach((r,i)=>lines.push(`${i+1}. ${r.name} — Profit ₹${r.profit.toLocaleString()} (Margin ${r.margin}%)`));
    lines.push('\nLeast profitable projects:');
    least.forEach((r,i)=>lines.push(`${i+1}. ${r.name} — Profit ₹${r.profit.toLocaleString()} (Margin ${r.margin}%)`));
    return lines.join('\n');
  } catch (e) {
    return 'Unable to compute project profitability right now.';
  }
}

async function memberWithMostOverdue(limit = 5) {
  try {
    const q = await pool.query(`
      SELECT u.id, u.full_name, u.email, COUNT(*) as overdue
      FROM tasks t JOIN users u ON u.id = t.assigned_to
      WHERE t.due_date IS NOT NULL AND t.status <> 'Done' AND t.due_date < CURRENT_DATE
      GROUP BY u.id, u.full_name, u.email
      ORDER BY overdue DESC
      LIMIT ${limit}`);
    if (!q.rows.length) return 'No overdue tasks assigned to any member.';
    const lines = ['Members with most overdue tasks:'];
    q.rows.forEach((r,i)=>lines.push(`${i+1}. ${r.full_name} — ${r.overdue} overdue`));
    return lines.join('\n');
  } catch (e) {
    return 'Unable to compute overdue by member right now.';
  }
}

async function timeSpentByTeam(days = 30, limit = 5) {
  try {
    const byUser = await pool.query(`
      SELECT u.id, u.full_name, COALESCE(SUM(t.hours_worked),0) as hours
      FROM timesheets t JOIN users u ON u.id = t.user_id
      WHERE t.work_date >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY u.id, u.full_name
      ORDER BY hours DESC
      LIMIT ${limit}`);
    const byProject = await pool.query(`
      SELECT p.id, p.name, COALESCE(SUM(t.hours_worked),0) as hours
      FROM timesheets t
      JOIN tasks tk ON t.task_id = tk.id
      JOIN projects p ON tk.project_id = p.id
      WHERE t.work_date >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY p.id, p.name
      ORDER BY hours DESC
      LIMIT ${limit}`);
    const lines = [];
    if (byUser.rows.length) {
      lines.push(`Top team time by member (last ${days}d):`);
      byUser.rows.forEach((r,i)=>lines.push(`${i+1}. ${r.full_name} — ${parseFloat(r.hours).toFixed(1)}h`));
    }
    if (byProject.rows.length) {
      lines.push(`\nTop team time by project (last ${days}d):`);
      byProject.rows.forEach((r,i)=>lines.push(`${i+1}. ${r.name} — ${parseFloat(r.hours).toFixed(1)}h`));
    }
    return lines.join('\n');
  } catch (e) {
    return 'Unable to compute time spent by team right now.';
  }
}

async function chat(req, res) {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string') return res.status(400).json({ success: false, error: 'message is required' });

    const userId = req.user?.id || null;
    const context = await getContext(userId);

    // Deterministic answers for common asks
    const m = message.toLowerCase();
    if (m.includes('best contributor') || m.includes('top contributor') || m.includes('most productive') || m.includes('best performer')) {
      const txt = await bestContributors(30);
      return res.json({ success:true, text: txt });
    }
    if ((m.includes('profit') && (m.includes('increase') || m.includes('improve') || m.includes('more'))) || m.includes('make more profit')) {
      const txt = await profitAdvice();
      return res.json({ success:true, text: txt });
    }
    if ((m.includes('most profitable') || m.includes('least profitable') || (m.includes('profit') && m.includes('project')))) {
      const txt = await projectProfitRanking(5);
      return res.json({ success:true, text: txt });
    }
    if ((m.includes('most overdue') && (m.includes('member') || m.includes('user') || m.includes('assignee'))) || m.includes('who has the most overdue')) {
      const txt = await memberWithMostOverdue(5);
      return res.json({ success:true, text: txt });
    }
    if (m.includes('most time') || m.includes('time being spent') || (m.includes('time') && m.includes('team'))) {
      const txt = await timeSpentByTeam(30, 5);
      return res.json({ success:true, text: txt });
    }

    const systemPrompt = buildSystemPrompt(context);
    const result = await callAI(systemPrompt, message);

    if (!result.ok) {
      return res.status(200).json({ success: true, text: 'AI is unavailable right now. Please try again shortly.' });
    }

    res.json({ success: true, text: result.text });
  } catch (e) {
    res.status(500).json({ success: false, error: 'assistant error' });
  }
}

module.exports = { chat };
