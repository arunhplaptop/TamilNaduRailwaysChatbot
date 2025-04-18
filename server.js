require('dotenv').config(); // ✅ Load .env variables

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

// Optional: Load custom routes if you have any
let railwayChat;
try {
  railwayChat = require("./routes/railwayChat");
  app.use("/api/railway-chat", railwayChat);
} catch (err) {
  console.warn("No custom route loaded:", err.message);
}

// 🧠 Chatbot endpoint using Hugging Face
app.post('/ask', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const hfResponse = await axios.post(
      'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta',
      {
        inputs: `<|user|>\n${userMessage}\n<|assistant|>`,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const rawText = hfResponse.data[0].generated_text;
    const botReply = rawText.split("<|assistant|>").pop().trim();
    res.json({ reply: botReply });

  } catch (err) {
    console.error("Hugging Face API Error:", err.response?.data || err.message);
    res.status(500).json({ reply: "Sorry, something went wrong with Hugging Face API." });
  }
});

// Serve frontend (optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
