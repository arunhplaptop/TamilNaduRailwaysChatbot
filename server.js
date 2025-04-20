const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./railwayChat');  // ✅ Use the full railwayChat.js route list

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 💡 In-memory user session (for mock booking)
let userState = {
  awaitingRoute: false,
  awaitingDate: false,
  pendingRoute: ''
};

app.post('/ask', (req, res) => {  // ✅ Correct endpoint
  const message = req.body.message.toLowerCase().trim();
  let reply = "Sorry, I didn’t get that. Try asking about train schedules, booking, or help.";

  // Booking: Awaiting Route
  if (userState.awaitingRoute) {
    const match = message.match(/([a-z\s]+)\s*to\s*([a-z\s]+)/i);
    if (match) {
      const routeKey = `${match[1].trim()} to ${match[2].trim()}`.toLowerCase();
      if (routes[routeKey]) {
        userState.awaitingRoute = false;
        userState.awaitingDate = true;
        userState.pendingRoute = routeKey;
        reply = `✅ Route found: ${routeKey}. Train: ${routes[routeKey]}\n📅 Please provide your travel date (e.g. 2025-04-25).`;
      } else {
        reply = `❌ Sorry, no train found for "${routeKey}". Please check and try again.`;
      }
    } else {
      reply = "⚠️ Please provide route in format: source to destination. Example: Chennai to Madurai.";
    }
  }
  // Booking: Awaiting Date
  else if (userState.awaitingDate) {
    userState.awaitingDate = false;
    reply = `🎟️ Ticket booked for ${userState.pendingRoute} on ${message}. Safe travels!`;
    userState.pendingRoute = '';
  }
  // New Booking Intent
  else if (message.includes("book") || message.includes("ticket")) {
    userState.awaitingRoute = true;
    reply = "🎟️ I'd be happy to help you book a ticket. Please provide your route (e.g. Chennai to Madurai).";
  }
  // Direct Route Query (even without booking)
  else if (message.match(/([a-z\s]+)\s*to\s*([a-z\s]+)/i)) {
    const routeMatch = message.match(/([a-z\s]+)\s*to\s*([a-z\s]+)/i);
    const routeKey = `${routeMatch[1].trim()} to ${routeMatch[2].trim()}`.toLowerCase();
    if (routes[routeKey]) {
      reply = `✅ Route: ${routeKey}\n🚆 Train: ${routes[routeKey]}`;
    } else {
      reply = `❌ Sorry, no train found for "${routeKey}". Please check and try again.`;
    }
  }
  // Train Schedules
  else if (message.includes("train") || message.includes("schedule") || message.includes("timing")) {
    reply = "📅 Available Train Schedules:\n";
    let count = 1;
    for (let route in routes) {
      reply += `${count}. ${route} → ${routes[route]}\n`;
      if (++count > 5) break;  // show top 5
    }
    reply += "\n📝 Ask 'Chennai to Madurai' to get specific details.";
  }
  // Platform Info
  else if (message.includes("platform")) {
    reply = "🛤️ Platform info will be available closer to departure. Tell me the train name or number for updates.";
  }
  // General Help
  else if (message.includes("help") || message.includes("services")) {
    reply = "🤖 I can assist you with:\n- 🚆 Train Schedules\n- 🎟️ Ticket Booking\n- 🛤️ Platform Info\n- ℹ️ General Railway Help\n\nJust say 'book ticket' or 'Chennai to Madurai'";
  }

  res.json({ reply });
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
