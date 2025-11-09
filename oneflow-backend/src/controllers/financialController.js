const pool = require("../config/database");
const path = require("path");

const generateSONumber = async () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const countResult = await pool.query(
    "SELECT COUNT(*) as count FROM sales_orders WHERE so_number LIKE $1",
    [`SO-${dateStr}-%`]
  );
  const count = parseInt(countResult.rows[0].count) + 1;
  return `SO-${dateStr}-${count.toString().padStart(3, "0")}`;
};

const generatePONumber = async () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const countResult = await pool.query(
    "SELECT COUNT(*) as count FROM purchase_orders WHERE po_number LIKE $1",
    [`PO-${dateStr}-%`]
  );
  const count = parseInt(countResult.rows[0].count) + 1;
  return `PO-${dateStr}-${count.toString().padStart(3, "0")}`;
};

const generateInvoiceNumber = async () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const countResult = await pool.query(
    "SELECT COUNT(*) as count FROM customer_invoices WHERE invoice_number LIKE $1",
    [`INV-${dateStr}-%`]
  );
  const count = parseInt(countResult.rows[0].count) + 1;
  return `INV-${dateStr}-${count.toString().padStart(3, "0")}`;
};

// Sales Orders
const getAllSalesOrders = async (req, res) => {
  try {
    const { project_id, customer_name, status } = req.query;
    let query = "SELECT * FROM sales_orders WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (project_id) {
      query += ` AND project_id = $${paramCount}`;
      params.push(project_id);
      paramCount++;
    }

    if (customer_name) {
      query += ` AND customer_name ILIKE $${paramCount}`;
      params.push(`%${customer_name}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get all sales orders error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getSalesOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM sales_orders WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Sales order not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get sales order error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const createSalesOrder = async (req, res) => {
  try {
    const {
      project_id,
      customer_name,
      customer_email,
      total_amount,
      status,
      order_date,
    } = req.body;

    if (!customer_name || !total_amount || !order_date) {
      return res
        .status(400)
        .json({
          error: "Customer name, total amount, and order date are required",
        });
    }

    const so_number = await generateSONumber();

    const result = await pool.query(
      "INSERT INTO sales_orders (so_number, project_id, customer_name, customer_email, total_amount, status, order_date, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        so_number,
        project_id,
        customer_name,
        customer_email,
        total_amount,
        status || "Draft",
        order_date,
        req.user.id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create sales order error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const updateSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, customer_email, total_amount, status, order_date } =
      req.body;

    const result = await pool.query(
      "UPDATE sales_orders SET customer_name = COALESCE($1, customer_name), customer_email = COALESCE($2, customer_email), total_amount = COALESCE($3, total_amount), status = COALESCE($4, status), order_date = COALESCE($5, order_date), updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *",
      [customer_name, customer_email, total_amount, status, order_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Sales order not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update sales order error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const deleteSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM sales_orders WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Sales order not found" });
    }
    res.json({ message: "Sales order deleted successfully" });
  } catch (error) {
    console.error("Delete sales order error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Purchase Orders
const getAllPurchaseOrders = async (req, res) => {
  try {
    const { project_id, vendor_name, status } = req.query;
    let query = "SELECT * FROM purchase_orders WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (project_id) {
      query += ` AND project_id = $${paramCount}`;
      params.push(project_id);
      paramCount++;
    }

    if (vendor_name) {
      query += ` AND vendor_name ILIKE $${paramCount}`;
      params.push(`%${vendor_name}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get all purchase orders error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM purchase_orders WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Purchase order not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get purchase order error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const createPurchaseOrder = async (req, res) => {
  try {
    const {
      project_id,
      vendor_name,
      vendor_email,
      total_amount,
      status,
      order_date,
    } = req.body;

    if (!vendor_name || !total_amount || !order_date) {
      return res
        .status(400)
        .json({
          error: "Vendor name, total amount, and order date are required",
        });
    }

    const po_number = await generatePONumber();

    const result = await pool.query(
      "INSERT INTO purchase_orders (po_number, project_id, vendor_name, vendor_email, total_amount, status, order_date, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        po_number,
        project_id,
        vendor_name,
        vendor_email,
        total_amount,
        status || "Draft",
        order_date,
        req.user.id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create purchase order error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { vendor_name, vendor_email, total_amount, status, order_date } =
      req.body;

    const result = await pool.query(
      "UPDATE purchase_orders SET vendor_name = COALESCE($1, vendor_name), vendor_email = COALESCE($2, vendor_email), total_amount = COALESCE($3, total_amount), status = COALESCE($4, status), order_date = COALESCE($5, order_date), updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *",
      [vendor_name, vendor_email, total_amount, status, order_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Purchase order not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update purchase order error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM purchase_orders WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Purchase order not found" });
    }
    res.json({ message: "Purchase order deleted successfully" });
  } catch (error) {
    console.error("Delete purchase order error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Customer Invoices
const getAllInvoices = async (req, res) => {
  try {
    const { project_id, customer_name, status } = req.query;
    let query = "SELECT * FROM customer_invoices WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (project_id) {
      query += ` AND project_id = $${paramCount}`;
      params.push(project_id);
      paramCount++;
    }

    if (customer_name) {
      query += ` AND customer_name ILIKE $${paramCount}`;
      params.push(`%${customer_name}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get all invoices error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM customer_invoices WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get invoice error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const createInvoice = async (req, res) => {
  try {
    const {
      project_id,
      sales_order_id,
      customer_name,
      total_amount,
      status,
      invoice_date,
      due_date,
    } = req.body;

    if (!customer_name || !customer_name.trim()) {
      return res
        .status(400)
        .json({
          error: "Customer name is required",
        });
    }

    if (!total_amount || isNaN(total_amount) || total_amount <= 0) {
      return res
        .status(400)
        .json({
          error: "Total amount must be a valid positive number",
        });
    }

    if (!invoice_date) {
      return res
        .status(400)
        .json({
          error: "Invoice date is required",
        });
    }

    const invoice_number = await generateInvoiceNumber();

    // Convert to proper types
    const amount = parseFloat(total_amount);
    const projectId = project_id && project_id !== '' ? parseInt(project_id) : null;
    const salesOrderId = sales_order_id && sales_order_id !== '' ? parseInt(sales_order_id) : null;

    const result = await pool.query(
      "INSERT INTO customer_invoices (invoice_number, project_id, sales_order_id, customer_name, total_amount, status, invoice_date, due_date, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [
        invoice_number,
        projectId,
        salesOrderId,
        customer_name.trim(),
        amount,
        status || "Draft",
        invoice_date,
        due_date || null,
        req.user.id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create invoice error:", error);
    
    // Handle database constraint errors
    if (error.code === '23503') {
      return res.status(400).json({ error: "Invalid project or sales order reference" });
    }
    
    if (error.code === '23505') {
      return res.status(400).json({ error: "Invoice already exists" });
    }
    
    res.status(500).json({ 
      error: "Server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      customer_name, 
      total_amount, 
      status, 
      invoice_date, 
      due_date,
      project_id,
      sales_order_id,
    } = req.body;

    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ error: "Customer name is required" });
    }

    if (!total_amount || isNaN(total_amount) || total_amount <= 0) {
      return res.status(400).json({ error: "Total amount must be a valid positive number" });
    }

    if (!invoice_date) {
      return res.status(400).json({ error: "Invoice date is required" });
    }

    // Convert to proper types
    const amount = parseFloat(total_amount);
    const projectId = project_id && project_id !== '' ? parseInt(project_id) : null;
    const salesOrderId = sales_order_id && sales_order_id !== '' ? parseInt(sales_order_id) : null;

    const result = await pool.query(
      "UPDATE customer_invoices SET customer_name = $1, total_amount = $2, status = $3, invoice_date = $4, due_date = $5, project_id = $6, sales_order_id = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *",
      [customer_name.trim(), amount, status || "Draft", invoice_date, due_date || null, projectId, salesOrderId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update invoice error:", error);
    
    // Handle database constraint errors
    if (error.code === '23503') {
      return res.status(400).json({ error: "Invalid project or sales order reference" });
    }
    
    res.status(500).json({ 
      error: "Server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const markInvoicePaid = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE customer_invoices SET status = 'Paid', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Mark invoice paid error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Vendor Bills
const getAllVendorBills = async (req, res) => {
  try {
    const { project_id, vendor_name, status } = req.query;
    let query = "SELECT * FROM vendor_bills WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (project_id) {
      query += ` AND project_id = $${paramCount}`;
      params.push(project_id);
      paramCount++;
    }

    if (vendor_name) {
      query += ` AND vendor_name ILIKE $${paramCount}`;
      params.push(`%${vendor_name}%`);
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get all vendor bills error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getVendorBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM vendor_bills WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vendor bill not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get vendor bill error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const createVendorBill = async (req, res) => {
  try {
    const {
      project_id,
      purchase_order_id,
      vendor_name,
      total_amount,
      status,
      bill_date,
      due_date,
    } = req.body;

    if (!vendor_name || !vendor_name.trim()) {
      return res
        .status(400)
        .json({
          error: "Vendor name is required",
        });
    }

    if (!total_amount || isNaN(total_amount) || total_amount <= 0) {
      return res
        .status(400)
        .json({
          error: "Total amount must be a valid positive number",
        });
    }

    if (!bill_date) {
      return res
        .status(400)
        .json({
          error: "Bill date is required",
        });
    }

    // Generate bill number
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const countResult = await pool.query(
      "SELECT COUNT(*) as count FROM vendor_bills WHERE bill_number LIKE $1",
      [`BILL-${dateStr}-%`]
    );
    const count = parseInt(countResult.rows[0].count) + 1;
    const bill_number = `BILL-${dateStr}-${count.toString().padStart(3, "0")}`;

    // Convert to proper types
    const amount = parseFloat(total_amount);
    const projectId = project_id && project_id !== '' ? parseInt(project_id) : null;
    const purchaseOrderId = purchase_order_id && purchase_order_id !== '' ? parseInt(purchase_order_id) : null;

    const result = await pool.query(
      "INSERT INTO vendor_bills (bill_number, project_id, purchase_order_id, vendor_name, total_amount, status, bill_date, due_date, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [
        bill_number,
        projectId,
        purchaseOrderId,
        vendor_name.trim(),
        amount,
        status || "Received",
        bill_date,
        due_date || null,
        req.user.id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create vendor bill error:", error);
    
    // Handle database constraint errors
    if (error.code === '23503') {
      return res.status(400).json({ error: "Invalid project or purchase order reference" });
    }
    
    if (error.code === '23505') {
      return res.status(400).json({ error: "Vendor bill already exists" });
    }
    
    res.status(500).json({ 
      error: "Server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateVendorBill = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vendor_name,
      total_amount,
      status,
      bill_date,
      due_date,
      project_id,
      purchase_order_id,
    } = req.body;

    if (!vendor_name || !vendor_name.trim()) {
      return res.status(400).json({ error: "Vendor name is required" });
    }

    if (!total_amount || isNaN(total_amount) || total_amount <= 0) {
      return res.status(400).json({ error: "Total amount must be a valid positive number" });
    }

    if (!bill_date) {
      return res.status(400).json({ error: "Bill date is required" });
    }

    // Convert to proper types
    const amount = parseFloat(total_amount);
    const projectId = project_id && project_id !== '' ? parseInt(project_id) : null;
    const purchaseOrderId = purchase_order_id && purchase_order_id !== '' ? parseInt(purchase_order_id) : null;

    const result = await pool.query(
      "UPDATE vendor_bills SET vendor_name = $1, total_amount = $2, status = $3, bill_date = $4, due_date = $5, project_id = $6, purchase_order_id = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *",
      [vendor_name.trim(), amount, status || "Received", bill_date, due_date || null, projectId, purchaseOrderId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vendor bill not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update vendor bill error:", error);
    
    // Handle database constraint errors
    if (error.code === '23503') {
      return res.status(400).json({ error: "Invalid project or purchase order reference" });
    }
    
    res.status(500).json({ 
      error: "Server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const markVendorBillPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE vendor_bills SET status = 'Paid', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vendor bill not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Mark vendor bill paid error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Expenses
const getAllExpenses = async (req, res) => {
  try {
    const { project_id, status, submitted_by } = req.query;
    let query = "SELECT * FROM expenses WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (project_id) {
      query += ` AND project_id = $${paramCount}`;
      params.push(project_id);
      paramCount++;
    }

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (submitted_by) {
      query += ` AND submitted_by = $${paramCount}`;
      params.push(submitted_by);
      paramCount++;
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get all expenses error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM expenses WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get expense error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const createExpense = async (req, res) => {
  try {
    const {
      project_id,
      expense_type,
      amount,
      description,
      expense_date,
      is_billable,
      receipt_url,
    } = req.body;

    if (!expense_type || !amount || !expense_date) {
      return res
        .status(400)
        .json({ error: "Expense type, amount, and expense date are required" });
    }

    const result = await pool.query(
      "INSERT INTO expenses (project_id, submitted_by, expense_type, amount, description, expense_date, is_billable, receipt_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        project_id,
        req.user.id,
        expense_type,
        amount,
        description,
        expense_date,
        is_billable || false,
        receipt_url,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create expense error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const approveExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE expenses SET status = 'Approved', approved_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Approve expense error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const rejectExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE expenses SET status = 'Rejected', approved_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Reject expense error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const uploadReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "Receipt file is required" });
    }

    const receipt_url = `/uploads/receipts/${req.file.filename}`;

    const result = await pool.query(
      "UPDATE expenses SET receipt_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [receipt_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Upload receipt error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Timesheets
const getAllTimesheets = async (req, res) => {
  try {
    const { task_id, user_id, start_date, end_date } = req.query;
    let query = "SELECT * FROM timesheets WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (task_id) {
      query += ` AND task_id = $${paramCount}`;
      params.push(task_id);
      paramCount++;
    }

    if (user_id) {
      query += ` AND user_id = $${paramCount}`;
      params.push(user_id);
      paramCount++;
    }

    if (start_date) {
      query += ` AND work_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND work_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += " ORDER BY work_date DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get all timesheets error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getMyTimesheets = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM timesheets WHERE user_id = $1 ORDER BY work_date DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get my timesheets error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const createTimesheet = async (req, res) => {
  try {
    const { task_id, hours_worked, work_date, description, is_billable } =
      req.body;

    if (!task_id || !hours_worked || !work_date) {
      return res
        .status(400)
        .json({ error: "Task ID, hours worked, and work date are required" });
    }

    const result = await pool.query(
      "INSERT INTO timesheets (task_id, user_id, hours_worked, work_date, description, is_billable) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        task_id,
        req.user.id,
        hours_worked,
        work_date,
        description,
        is_billable !== undefined ? is_billable : true,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create timesheet error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getAllSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  markInvoicePaid,
  getAllVendorBills,
  getVendorBillById,
  createVendorBill,
  updateVendorBill,
  markVendorBillPaid,
  getAllExpenses,
  getExpenseById,
  createExpense,
  approveExpense,
  rejectExpense,
  uploadReceipt,
  getAllTimesheets,
  getMyTimesheets,
  createTimesheet,
};
