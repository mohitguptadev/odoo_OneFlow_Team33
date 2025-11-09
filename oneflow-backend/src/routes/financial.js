const express = require("express");
const router = express.Router();
const financialController = require("../controllers/financialController");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/roleCheck");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/receipts/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Sales Orders
router.get(
  "/sales-orders",
  authenticate,
  financialController.getAllSalesOrders
);
router.get(
  "/sales-orders/:id",
  authenticate,
  financialController.getSalesOrderById
);
router.post(
  "/sales-orders",
  authenticate,
  requireRole(["Admin", "Sales/Finance"]),
  financialController.createSalesOrder
);
router.put(
  "/sales-orders/:id",
  authenticate,
  requireRole(["Admin", "Sales/Finance"]),
  financialController.updateSalesOrder
);
router.delete(
  "/sales-orders/:id",
  authenticate,
  requireRole(["Admin", "Sales/Finance"]),
  financialController.deleteSalesOrder
);

// Purchase Orders
router.get(
  "/purchase-orders",
  authenticate,
  financialController.getAllPurchaseOrders
);
router.get(
  "/purchase-orders/:id",
  authenticate,
  financialController.getPurchaseOrderById
);
router.post(
  "/purchase-orders",
  authenticate,
  requireRole(["Admin", "Sales/Finance"]),
  financialController.createPurchaseOrder
);
router.put(
  "/purchase-orders/:id",
  authenticate,
  requireRole(["Admin", "Sales/Finance"]),
  financialController.updatePurchaseOrder
);
router.delete(
  "/purchase-orders/:id",
  authenticate,
  requireRole(["Admin", "Sales/Finance"]),
  financialController.deletePurchaseOrder
);

// Customer Invoices
router.get("/invoices", authenticate, financialController.getAllInvoices);
router.get("/invoices/:id", authenticate, financialController.getInvoiceById);
router.post(
  "/invoices",
  authenticate,
  requireRole(["Admin", "Sales/Finance", "Project Manager"]),
  financialController.createInvoice
);
router.put(
  "/invoices/:id",
  authenticate,
  requireRole(["Admin", "Sales/Finance", "Project Manager"]),
  financialController.updateInvoice
);
router.post(
  "/invoices/:id/mark-paid",
  authenticate,
  requireRole(["Admin", "Sales/Finance"]),
  financialController.markInvoicePaid
);

// Vendor Bills
router.get(
  "/vendor-bills",
  authenticate,
  financialController.getAllVendorBills
);
router.get(
  "/vendor-bills/:id",
  authenticate,
  financialController.getVendorBillById
);
router.post(
  "/vendor-bills",
  authenticate,
  requireRole(["Admin", "Sales/Finance"]),
  financialController.createVendorBill
);
router.put(
  "/vendor-bills/:id",
  authenticate,
  requireRole(["Admin", "Sales/Finance"]),
  financialController.updateVendorBill
);
router.put(
  "/vendor-bills/:id/mark-paid",
  authenticate,
  requireRole(["Admin", "Sales/Finance"]),
  financialController.markVendorBillPaid
);

// Expenses
router.get("/expenses", authenticate, financialController.getAllExpenses);
router.get("/expenses/:id", authenticate, financialController.getExpenseById);
router.post("/expenses", authenticate, financialController.createExpense);
router.put(
  "/expenses/:id/approve",
  authenticate,
  requireRole(["Admin", "Project Manager"]),
  financialController.approveExpense
);
router.put(
  "/expenses/:id/reject",
  authenticate,
  requireRole(["Admin", "Project Manager"]),
  financialController.rejectExpense
);
router.post(
  "/expenses/:id/upload-receipt",
  authenticate,
  upload.single("receipt"),
  financialController.uploadReceipt
);

// Timesheets
router.get("/timesheets", authenticate, financialController.getAllTimesheets);
router.get(
  "/timesheets/my-timesheets",
  authenticate,
  financialController.getMyTimesheets
);
router.post("/timesheets", authenticate, financialController.createTimesheet);

module.exports = router;
