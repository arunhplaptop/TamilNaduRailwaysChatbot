require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Load routes safely
let railwayChat;
try {
  railwayChat = require("./routes/railwayChat");
} catch (err) {
  console.error("Failed to load railwayChat route:", err.message);
}
app.use("/api/railway-chat", railwayChat);

// Chatbot endpoint with OpenRouter GPT-3.5
app.post('/ask', async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ reply: "Invalid request: Message is required." });
  }

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: userMessage }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const botReply = response.data.choices[0]?.message?.content || "No reply available.";
    res.json({ reply: botReply });
  } catch (err) {
    console.error("OpenRouter API Error:", err.response?.data || err.message);
    res.status(500).json({ reply: "Sorry, something went wrong. Please try again later." });
  }
});

// Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
