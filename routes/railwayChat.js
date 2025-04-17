const express = require('express');
const router = express.Router();

// Example route for railway chatbot
router.post('/', (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: "Message is required!" });
  }

  // Mock response for railway-specific questions
  const reply = `You asked about: "${userMessage}". Here's a placeholder response!`;

  res.json({ reply });
});

module.exports = router;
