import * as XLSX from "xlsx";
import api from "./api";

// Export Tasks to Excel
export const exportTasksToExcel = async (projectId) => {
  try {
    const tasksRes = await api.get(`/tasks?project_id=${projectId}`);
    const tasks = tasksRes.data;

    const projectRes = await api.get(`/projects/${projectId}`);
    const project = projectRes.data;

    const data = tasks.map(task => ({
      "Title": task.title,
      "Description": task.description || "",
      "Assignee": task.assigned_to_name || "Unassigned",
      "Status": task.status,
      "Priority": task.priority,
      "Due Date": task.due_date ? new Date(task.due_date).toLocaleDateString() : "",
      "Estimated Hours": task.estimated_hours || 0,
      "Created At": new Date(task.created_at).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tasks");

    const fileName = `Tasks_${project.name.replace(/\s+/g, "_")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  } catch (error) {
    console.error("Error exporting tasks:", error);
    throw error;
  }
};

// Export Financials to Excel
export const exportFinancialsToExcel = async (projectId) => {
  try {
    const projectRes = await api.get(`/projects/${projectId}`);
    const project = projectRes.data;

    // Fetch all financial data
    const [invoicesRes, billsRes, expensesRes, salesOrdersRes, purchaseOrdersRes] = await Promise.all([
      api.get(`/financial/invoices?project=${projectId}`),
      api.get(`/financial/vendor-bills?project=${projectId}`),
      api.get(`/financial/expenses?project=${projectId}`),
      api.get(`/financial/sales-orders?project=${projectId}`),
      api.get(`/financial/purchase-orders?project=${projectId}`),
    ]);

    const wb = XLSX.utils.book_new();

    // Sales Orders Sheet
    const soData = salesOrdersRes.data.map(so => ({
      "SO Number": so.so_number,
      "Customer": so.customer_name,
      "Amount": parseFloat(so.total_amount),
      "Status": so.status,
      "Date": new Date(so.order_date).toLocaleDateString(),
    }));
    const soWs = XLSX.utils.json_to_sheet(soData);
    XLSX.utils.book_append_sheet(wb, soWs, "Sales Orders");

    // Purchase Orders Sheet
    const poData = purchaseOrdersRes.data.map(po => ({
      "PO Number": po.po_number,
      "Vendor": po.vendor_name,
      "Amount": parseFloat(po.total_amount),
      "Status": po.status,
      "Date": new Date(po.order_date).toLocaleDateString(),
    }));
    const poWs = XLSX.utils.json_to_sheet(poData);
    XLSX.utils.book_append_sheet(wb, poWs, "Purchase Orders");

    // Invoices Sheet
    const invData = invoicesRes.data.map(inv => ({
      "Invoice #": inv.invoice_number,
      "Customer": inv.customer_name,
      "Amount": parseFloat(inv.total_amount),
      "Status": inv.status,
      "Invoice Date": new Date(inv.invoice_date).toLocaleDateString(),
      "Due Date": inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "",
    }));
    const invWs = XLSX.utils.json_to_sheet(invData);
    XLSX.utils.book_append_sheet(wb, invWs, "Invoices");

    // Vendor Bills Sheet
    const vbData = billsRes.data.map(bill => ({
      "Bill #": bill.bill_number,
      "Vendor": bill.vendor_name,
      "Amount": parseFloat(bill.total_amount),
      "Status": bill.status,
      "Bill Date": new Date(bill.bill_date).toLocaleDateString(),
      "Due Date": bill.due_date ? new Date(bill.due_date).toLocaleDateString() : "",
    }));
    const vbWs = XLSX.utils.json_to_sheet(vbData);
    XLSX.utils.book_append_sheet(wb, vbWs, "Vendor Bills");

    // Expenses Sheet
    const expData = expensesRes.data.map(exp => ({
      "Type": exp.expense_type,
      "Amount": parseFloat(exp.amount),
      "Description": exp.description || "",
      "Date": new Date(exp.expense_date).toLocaleDateString(),
      "Billable": exp.is_billable ? "Yes" : "No",
      "Status": exp.status,
    }));
    const expWs = XLSX.utils.json_to_sheet(expData);
    XLSX.utils.book_append_sheet(wb, expWs, "Expenses");

    const fileName = `Financials_${project.name.replace(/\s+/g, "_")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  } catch (error) {
    console.error("Error exporting financials:", error);
    throw error;
  }
};

// Export Analytics to Excel
export const exportAnalyticsToExcel = async () => {
  try {
    const [projectsRes, resourcesRes, timeRes] = await Promise.all([
      api.get("/analytics/projects"),
      api.get("/analytics/resource-utilization"),
      api.get("/analytics/time-tracking"),
    ]);

    const wb = XLSX.utils.book_new();

    // Projects Analytics
    const projectsData = projectsRes.data.map(p => ({
      "Project": p.name,
      "Progress": `${p.progress_percentage?.toFixed(1)}%`,
      "Revenue": parseFloat(p.revenue || 0),
      "Costs": parseFloat(p.costs || 0),
      "Profit": parseFloat(p.profit || 0),
    }));
    const projectsWs = XLSX.utils.json_to_sheet(projectsData);
    XLSX.utils.book_append_sheet(wb, projectsWs, "Projects");

    // Resource Utilization
    const resourcesData = resourcesRes.data.map(r => ({
      "Name": r.full_name,
      "Total Hours": parseFloat(r.total_hours_logged || 0),
      "Completion Rate": `${r.completion_rate?.toFixed(1)}%`,
    }));
    const resourcesWs = XLSX.utils.json_to_sheet(resourcesData);
    XLSX.utils.book_append_sheet(wb, resourcesWs, "Resources");

    // Time Tracking
    const timeData = timeRes.data.hours_by_project?.map(t => ({
      "Project": t.project_name,
      "Hours": parseFloat(t.hours || 0),
    })) || [];
    const timeWs = XLSX.utils.json_to_sheet(timeData);
    XLSX.utils.book_append_sheet(wb, timeWs, "Time Tracking");

    const fileName = `Analytics_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  } catch (error) {
    console.error("Error exporting analytics:", error);
    throw error;
  }
};

