const express = require('express');
const router = express.Router();
const invoiceGeneratorController = require('../controllers/invoiceGeneratorController');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roleCheck');

router.get(
  '/projects/:project_id/completed-work-value',
  authenticate,
  requireRole(['Admin', 'Sales/Finance', 'Project Manager']),
  invoiceGeneratorController.calculateCompletedWorkValue
);

module.exports = router;

