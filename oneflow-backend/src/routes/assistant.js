const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/assistantController');
const authenticate = require('../middleware/auth');

// Require auth so we can personalize context and respect permissions
router.post('/chat', authenticate, chat);

module.exports = router;
