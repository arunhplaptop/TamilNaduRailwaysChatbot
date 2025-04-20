const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// ✅ Custom chatbot logic (No Hugging Face needed)
app.post('/ask', (req, res) => {
  const userMessage = req.body.message.toLowerCase();
  let reply = "Sorry, I didn’t get that. Try asking about train schedules, booking, or help.";

  if (userMessage.includes("train") || userMessage.includes("schedule") || userMessage.includes("timing")) {
    reply = `Sure! Please tell me your source and destination stations.\nExample: "Chennai to Madurai"\n\nPopular Trains:\n1. Pandian Express (12637) - 21:40 → 05:40\n2. Vaigai Express (12635) - 13:20 → 21:25`;
  } else if (userMessage.includes("book") || userMessage.includes("ticket")) {
    reply = "I'd be happy to help you book a ticket. Please provide your route and travel date.";
  } else if (userMessage.includes("platform")) {
    reply = "Platform info will be available closer to departure. Tell me the train name or number for updates.";
  } else if (userMessage.includes("help") || userMessage.includes("services")) {
    reply = "I'm here to assist you with:\n- 🚆 Train Schedules\n- 🎟️ Ticket Booking\n- 🛤️ Platform Info\n- ℹ️ General Railway Help\nHow can I assist you today?";
  }

  res.json({ reply });
});

// Serve frontend (index.html)
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
