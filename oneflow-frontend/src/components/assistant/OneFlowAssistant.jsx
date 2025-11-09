import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Button from '../common/Button';
import { Plus, List, ClipboardCheck, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function formatDateToken(token) {
  const today = new Date();
  if (/^today$/i.test(token)) return today.toISOString().slice(0,10);
  if (/^tomorrow$/i.test(token)) {
    const d = new Date(today.getTime()+86400000);
    return d.toISOString().slice(0,10);
  }
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(token)) return token;
  return null;
}

const OneFlowAssistant = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your OneFlow Assistant. Ask me about your projects, tasks, timesheets, and expenses." }
  ]);
  const [pendingAction, setPendingAction] = useState(null); // { intent, summary }
  const listRef = useRef(null);

  useEffect(()=>{ if(listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages, open]);
  const addMsg = (role, content) => setMessages(m => [...m, { role, content }]);

  // Simple intent parser
  function parse(text){
    const t = text.trim();
    if (/^list\s+projects?$/i.test(t)) return { type: 'list_projects' };
    const showProj = t.match(/^show\s+project\s+(.+)$/i);
    if (showProj) return { type: 'show_project', name: showProj[1].trim() };
    if (/^my\s+tasks?$/i.test(t)) return { type: 'my_tasks' };

    const createProj = t.match(/^create\s+project[:\-]?\s*(.+)$/i);
    if (createProj) return { type: 'create_project', name: createProj[1].trim() };

    // create task: <title> in project <name> assigned to <me|email|name> priority <x> due <token>
    const createTask = t.match(/^create\s+task[:\-]?\s*(.+)$/i);
    if (createTask) {
      const rest = createTask[1];
      const titleMatch = rest.split(/\s+in\s+project\s+/i)[0].trim();
      const projMatch = rest.match(/in\s+project\s+([^\s].*?)(?:\s+assigned\s+to\s+|\s+priority\s+|\s+due\s+|$)/i);
      const assignMatch = rest.match(/assigned\s+to\s+(me|[^\s].*?)(?:\s+priority\s+|\s+due\s+|$)/i);
      const priorityMatch = rest.match(/priority\s+(Low|Medium|High|Urgent)/i);
      const dueMatch = rest.match(/due\s+(today|tomorrow|\d{4}-\d{2}-\d{2})/i);
      return {
        type: 'create_task',
        title: titleMatch,
        projectName: projMatch ? projMatch[1].trim() : null,
        assigned: assignMatch ? assignMatch[1].trim() : null,
        priority: priorityMatch ? priorityMatch[1] : null,
        due: dueMatch ? dueMatch[1] : null,
      };
    }

    // add member <user> to project <name> | add <user> to project <name>
    const addMember1 = t.match(/^add\s+member\s+(.+?)\s+to\s+project\s+(.+)$/i);
    const addMember2 = t.match(/^add\s+(.+?)\s+to\s+project\s+(.+)$/i);
    if (addMember1 || addMember2) {
      const m = addMember1 || addMember2;
      return { type: 'add_member', userHint: m[1].trim(), projectName: m[2].trim() };
    }

    // show overdue tasks [for project <name>]
    const overdue = t.match(/^show\s+overdue\s+tasks(?:\s+for\s+project\s+(.+))?$/i);
    if (overdue) return { type: 'show_overdue', projectName: overdue[1] ? overdue[1].trim() : null };

    // show tasks [for project <name>] [status <...>] [priority <...>]
    const showTasks = t.match(/^show\s+tasks(?:\s+for\s+project\s+(.+?))?(?:\s+status\s+(New|In\s+Progress|Blocked|Done))?(?:\s+priority\s+(Low|Medium|High|Urgent))?$/i);
    if (showTasks) return { type: 'show_tasks', projectName: showTasks[1]?.trim() || null, status: showTasks[2]?.replace(/\s+/g,' ') || null, priority: showTasks[3] || null };

    // remove member <user> from project <name>
    const removeMember = t.match(/^remove\s+member\s+(.+?)\s+from\s+project\s+(.+)$/i);
    if (removeMember) return { type: 'remove_member', userHint: removeMember[1].trim(), projectName: removeMember[2].trim() };

    // set project <name> status <...>
    const setProj = t.match(/^set\s+project\s+(.+?)\s+status\s+(Planned|In\s+Progress|Completed|On\s+Hold)$/i);
    if (setProj) return { type: 'set_project_status', projectName: setProj[1].trim(), status: setProj[2].replace(/\s+/g,' ') };

    const updateTask = t.match(/^update\s+task\s+(\d+)\s+status\s+(?:to\s+)?(New|In\s+Progress|Blocked|Done)$/i);
    if (updateTask) return { type: 'update_task_status', id: parseInt(updateTask[1],10), status: updateTask[2].replace(/\s+/g,' ') };

    const logHours = t.match(/^log\s+hours\s+(\d+(?:\.\d+)?)\s+on\s+task\s+(\d+)(?:\s+date\s+(today|tomorrow|\d{4}-\d{2}-\d{2}))?/i);
    if (logHours) return { type: 'log_hours', hours: parseFloat(logHours[1]), taskId: parseInt(logHours[2],10), date: logHours[3] || 'today' };

    // create expense: amount <n> project <name> type <text> [desc <text>] [date <...>] [billable <true|false>]
    const expense = t.match(/^create\s+expense[:\-]?\s+amount\s+(\d+(?:\.\d+)?)\s+(?:project\s+(.+?)\s+)?type\s+(.+?)(?:\s+desc\s+(.+?))?(?:\s+date\s+(today|tomorrow|\d{4}-\d{2}-\d{2}))?(?:\s+billable\s+(true|false))?$/i);
    if (expense) {
      return {
        type: 'create_expense',
        amount: parseFloat(expense[1]),
        projectName: expense[2]?.trim() || null,
        expense_type: expense[3]?.trim() || 'General',
        description: expense[4]?.trim() || null,
        date: expense[5] || 'today',
        billable: expense[6] ? expense[6].toLowerCase()==='true' : false,
      };
    }

    return { type: 'help' };
  }

  async function getProjectByName(name){
    const res = await api.get('/projects');
    const list = Array.isArray(res.data) ? res.data : [];
    const exact = list.find(p => (p.name||'').toLowerCase() === name.toLowerCase());
    return exact || list.find(p => (p.name||'').toLowerCase().includes(name.toLowerCase()));
  }

  async function getUserIdByHint(hint){
    if (!hint || hint.toLowerCase()==='me') return user?.id;
    try {
      const r = await api.get('/users');
      const arr = Array.isArray(r.data) ? r.data : [];
      const byEmail = arr.find(u => (u.email||'').toLowerCase() === hint.toLowerCase());
      if (byEmail) return byEmail.id;
      const byName = arr.find(u => (u.full_name||'').toLowerCase().includes(hint.toLowerCase()));
      return byName ? byName.id : null;
    } catch { return null; }
  }

  function summarizeAction(intent){
    switch(intent.type){
      case 'create_project':
        return `Create project: ${intent.name}`;
      case 'create_task':
        return `Create task: "${intent.title}" in project ${intent.projectName} assigned to ${intent.assigned||'n/a'} priority ${intent.priority||'Medium'}${intent.due?` due ${intent.due}`:''}`;
      case 'add_member':
        return `Add member ${intent.userHint} to project ${intent.projectName}`;
      case 'remove_member':
        return `Remove member ${intent.userHint} from project ${intent.projectName}`;
      case 'set_project_status':
        return `Set project ${intent.projectName} status to ${intent.status}`;
      case 'update_task_status':
        return `Update task #${intent.id} status to ${intent.status}`;
      case 'log_hours':
        return `Log ${intent.hours}h on task #${intent.taskId} date ${intent.date||'today'}`;
      case 'create_expense':
        return `Create expense ₹${intent.amount} ${intent.expense_type}${intent.projectName?` for ${intent.projectName}`:''}`;
      default:
        return null;
    }
  }

  async function performAction(intent, originalText=''){
    switch(intent.type){
        case 'list_projects': {
          const res = await api.get('/projects');
          const list = Array.isArray(res.data) ? res.data : [];
          if (list.length===0) addMsg('assistant','No projects found.');
          else addMsg('assistant', 'Projects:\n' + list.map(p=>`• ${p.name} (${p.status})`).join('\n'));
          break;
        }
        case 'show_project': {
          const proj = await getProjectByName(intent.name);
          if (!proj) { addMsg('assistant', `Project not found: ${intent.name}`); break; }
          addMsg('assistant', `Project: ${proj.name}\nStatus: ${proj.status}\nBudget: ${proj.budget||'N/A'}\nStart: ${proj.start_date||'N/A'}\nTasks: ${proj.tasks_count||0} (Done: ${proj.completed_tasks||0})`);
          break;
        }
        case 'my_tasks': {
          const r = await api.get('/tasks/my-tasks');
          const arr = Array.isArray(r.data)? r.data: [];
          if (arr.length===0) addMsg('assistant','You have no tasks.');
          else addMsg('assistant','Your tasks:\n'+arr.slice(0,10).map(t=>`#${t.id} ${t.title} — ${t.status}${t.due_date?` (due ${new Date(t.due_date).toLocaleDateString()})`:''}`).join('\n'));
          break;
        }
        case 'create_project': {
          const payload = { name: intent.name, description: null, status: 'Planned' };
          const r = await api.post('/projects', payload);
          addMsg('assistant', `✅ Project created: ${r.data.name} (id ${r.data.id})`);
          // Quick action buttons
          setMessages(m => [...m, { role:'assistant', content: '', action: { type:'project_created', id:r.data.id, name:r.data.name } }]);
          break;
        }
        case 'create_task': {
          if (!intent.projectName) { addMsg('assistant','Please specify project name: \"... in project <name>\"'); break; }
          const proj = await getProjectByName(intent.projectName);
          if (!proj) { addMsg('assistant', `Project not found: ${intent.projectName}`); break; }
          const assignedId = await getUserIdByHint(intent.assigned||'me');
          const due = intent.due ? formatDateToken(intent.due) : null;
          const payload = {
            project_id: proj.id,
            title: intent.title,
            description: null,
            assigned_to: assignedId || null,
            status: 'New',
            priority: intent.priority || 'Medium',
            due_date: due,
            estimated_hours: null
          };
          const r = await api.post('/tasks', payload);
          addMsg('assistant', `✅ Task created: #${r.data.id} ${r.data.title} in ${proj.name}`);
          setMessages(m => [...m, { role:'assistant', content:'', action:{ type:'task_created', id:r.data.id, title:r.data.title, projectId:proj.id, projectName:proj.name } }]);
          break;
        }
        case 'add_member': {
          const proj = await getProjectByName(intent.projectName);
          if (!proj) { addMsg('assistant', `Project not found: ${intent.projectName}`); break; }
          const userId = await getUserIdByHint(intent.userHint);
          if (!userId) { addMsg('assistant', `User not found: ${intent.userHint}`); break; }
          await api.post(`/projects/${proj.id}/members`, { user_id: userId });
          addMsg('assistant', `✅ Added member to ${proj.name}`);
          break;
        }
        case 'show_overdue': {
          let items = [];
          if (intent.projectName) {
            const proj = await getProjectByName(intent.projectName);
            if (!proj) { addMsg('assistant', `Project not found: ${intent.projectName}`); break; }
            const r = await api.get('/tasks', { params: { project_id: proj.id } });
            items = Array.isArray(r.data) ? r.data : [];
          } else {
            const r = await api.get('/tasks');
            items = Array.isArray(r.data) ? r.data : [];
          }
          const todayStr = new Date().toISOString().slice(0,10);
          const overdue = items.filter(t => t.due_date && t.status !== 'Done' && t.due_date < todayStr);
          if (overdue.length === 0) addMsg('assistant', 'No overdue tasks.');
          else addMsg('assistant', 'Overdue tasks:\n' + overdue.slice(0,15).map(t=>`#${t.id} ${t.title} — ${t.status} (due ${new Date(t.due_date).toLocaleDateString()})`).join('\n'));
          break;
        }
        case 'show_tasks': {
          let params = {};
          if (intent.projectName) {
            const proj = await getProjectByName(intent.projectName);
            if (!proj) { addMsg('assistant', `Project not found: ${intent.projectName}`); break; }
            params.project_id = proj.id;
          }
          if (intent.status) params.status = intent.status;
          if (intent.priority) params.priority = intent.priority;
          const r = await api.get('/tasks', { params });
          const arr = Array.isArray(r.data)? r.data: [];
          if (arr.length===0) addMsg('assistant','No matching tasks.');
          else addMsg('assistant','Tasks:\n'+arr.slice(0,20).map(t=>`#${t.id} ${t.title} — ${t.status}${t.due_date?` (due ${new Date(t.due_date).toLocaleDateString()})`:''}`).join('\n'));
          break;
        }
        case 'remove_member': {
          const proj = await getProjectByName(intent.projectName);
          if (!proj) { addMsg('assistant', `Project not found: ${intent.projectName}`); break; }
          const userId = await getUserIdByHint(intent.userHint);
          if (!userId) { addMsg('assistant', `User not found: ${intent.userHint}`); break; }
          await api.delete(`/projects/${proj.id}/members/${userId}`);
          addMsg('assistant', `✅ Removed member from ${proj.name}`);
          break;
        }
        case 'set_project_status': {
          const proj = await getProjectByName(intent.projectName);
          if (!proj) { addMsg('assistant', `Project not found: ${intent.projectName}`); break; }
          await api.put(`/projects/${proj.id}`, { status: intent.status });
          addMsg('assistant', `✅ Project ${proj.name} status set to ${intent.status}`);
          break;
        }
        case 'update_task_status': {
          await api.put(`/tasks/${intent.id}`, { status: intent.status });
          addMsg('assistant', `✅ Task #${intent.id} status updated to ${intent.status}`);
          break;
        }
        case 'log_hours': {
          const d = formatDateToken(intent.date) || new Date().toISOString().slice(0,10);
          await api.post('/financial/timesheets', {
            task_id: intent.taskId,
            user_id: user?.id,
            hours_worked: intent.hours,
            work_date: d,
            description: 'Logged via Assistant',
            is_billable: true
          });
          addMsg('assistant', `✅ Logged ${intent.hours}h on task #${intent.taskId} for ${d}`);
          break;
        }
        case 'create_expense': {
          const d = formatDateToken(intent.date) || new Date().toISOString().slice(0,10);
          let project_id = null;
          if (intent.projectName) {
            const proj = await getProjectByName(intent.projectName);
            if (!proj) { addMsg('assistant', `Project not found: ${intent.projectName}`); break; }
            project_id = proj.id;
          }
          await api.post('/financial/expenses', {
            project_id,
            submitted_by: user?.id,
            expense_type: intent.expense_type,
            amount: intent.amount,
            description: intent.description,
            expense_date: d,
            is_billable: intent.billable,
            status: 'Pending'
          });
          addMsg('assistant', `✅ Expense recorded: ₹${intent.amount} (${intent.expense_type})${project_id? ' for project':''}`);
          break;
        }
        case 'help':
        default: {
          // Ask external AI within OneFlow context
          const ai = await api.post('/assistant/chat', { message: originalText || 'help' });
          const fallback = `I can help with:
- list projects
- show project <name>
- my tasks
- create project: <name>
- create task: <title> in project <name> assigned to <me|email|name> priority <Low|Medium|High|Urgent> due <today|tomorrow|YYYY-MM-DD>
- update task <id> status to <New|In Progress|Blocked|Done>
- log hours <n> on task <id> date <today|tomorrow|YYYY-MM-DD>
- add member <user/email> to project <name>
- remove member <user/email> from project <name>
- show tasks [for project <name>] [status <...>] [priority <...>]
- set project <name> status <Planned|In Progress|Completed|On Hold>
- create expense: amount <n> project <name> type <text> desc <text> date <today|tomorrow|YYYY-MM-DD> billable <true|false>`;
          addMsg('assistant', ai.data?.text || fallback);
          break;
        }
      }
  }

  async function handle(text){
    const intent = parse(text);
    setBusy(true);
    try {
      // If user explicitly asks for advice/suggestions, call AI directly first.
      if (/\b(advice|suggest|recommend|insight)\b/i.test(text)) {
        const ai = await api.post('/assistant/chat', { message: text });
        addMsg('assistant', ai.data?.text || '(no advice)');
        setBusy(false);
        return;
      }

      // For actions, ask for confirmation first
      const actionTypes = new Set(['create_project','create_task','add_member','remove_member','set_project_status','update_task_status','log_hours','create_expense']);
      if (actionTypes.has(intent.type)){
        const summary = summarizeAction(intent);
        setPendingAction({ intent, summary });
        addMsg('assistant', `Please confirm: ${summary}`);
        setBusy(false);
        return;
      }

      await performAction(intent, text);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.error || e?.message || 'Request failed';
      addMsg('assistant', `❌ ${msg}`);
    } finally { setBusy(false); }
  }


  return (
    <>
      <div className="fixed bottom-5 right-5 z-[1100]">
        {!open && (
          <button onClick={()=>setOpen(true)} className="flex items-center gap-2 px-4 py-3 rounded-full shadow-xl bg-white border-2 border-orange-400 hover:shadow-2xl transition-all">
            <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs">मु</span>
            <span className="font-semibold text-gray-800">Ask Munim Ji</span>
          </button>
        )}
      </div>

      {open && (
        <div className="fixed bottom-5 right-5 z-[1100] w-[380px] max-w-[92vw]">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-200 to-orange-300 border-b border-orange-400">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs">मु</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">Munim Ji</p>
                  <p className="text-[11px] text-gray-700">Project guide & actions</p>
                </div>
              </div>
              <button onClick={()=>setOpen(false)} className="px-2 py-1 text-sm rounded-lg hover:bg-white/50">✕</button>
            </div>


            <div ref={listRef} className="p-3 h-80 overflow-y-auto bg-gray-50">
              {messages.map((m,i)=> (
                <div key={i} className={`mb-2 flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                  {m.action ? (
                    <div className="bg-white text-gray-800 border max-w-[80%] p-3 rounded-xl shadow-sm">
                      {m.action.type==='project_created' && (
                        <div className="space-y-2">
                          <p className="font-semibold">Project created: {m.action.name}</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={()=>navigate(`/projects/${m.action.id}`)}>Open Project</Button>
                            <Button size="sm" variant="primary" onClick={()=>navigate('/projects')}>All Projects</Button>
                          </div>
                        </div>
                      )}
                      {m.action.type==='task_created' && (
                        <div className="space-y-2">
                          <p className="font-semibold">Task created: #{m.action.id} {m.action.title}</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={()=>navigate(`/projects/${m.action.projectId}`)}>Open {m.action.projectName}</Button>
                            <Button size="sm" variant="primary" onClick={()=>navigate('/tasks')}>View Tasks</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`${m.role==='user'?'bg-blue-600 text-white rounded-tr-none':'bg-white text-gray-800 border rounded-tl-none'} max-w-[80%] px-3 py-2 rounded-xl shadow-sm whitespace-pre-wrap text-sm`}>{m.content}</div>
                  )}
                </div>
              ))}
              {busy && (
                <div className="mb-2 flex justify-start">
                  <div className="bg-white text-gray-800 border max-w-[80%] px-3 py-2 rounded-xl shadow-sm text-sm">
                    <span className="inline-flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {pendingAction && (
              <div className="p-3 bg-yellow-50 border-t border-b border-yellow-200 flex items-center justify-between">
                <div className="text-sm text-yellow-800 font-medium">Confirm: {pendingAction.summary}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={()=>{ setPendingAction(null); }}>Cancel</Button>
                  <Button size="sm" variant="primary" onClick={async()=>{ setBusy(true); try { await performAction(pendingAction.intent); } finally { setPendingAction(null); setBusy(false);} }}>Confirm</Button>
                </div>
              </div>
            )}
            <div className="p-3 bg-white border-t flex items-center gap-2">
              <input
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder={busy?"Working...":"Type a request..."}
                value={input}
                onChange={(e)=>setInput(e.target.value)}
                onKeyDown={(e)=>{ if(e.key==='Enter' && input.trim()){ addMsg('user', input); handle(input); setInput(''); } }}
                disabled={busy}
              />
              <Button onClick={()=>{ if(!input.trim()) return; addMsg('user', input); handle(input); setInput(''); }} disabled={busy || !input.trim()} variant="primary" size="md">Send</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OneFlowAssistant;
