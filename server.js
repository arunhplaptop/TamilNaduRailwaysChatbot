const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

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

// ✅ Static route data
const routes = {
  "chennai to madurai": "Pandian Express (12637) - 21:40 → 05:40",
  "chennai to coimbatore": "Covai Express (12677) - 05:00 → 09:30",
  "chennai to trichy": "Cholan Express (16170) - 19:20 → 04:30",
  "chennai to bangalore": "Bangalore Express (12673) - 21:20 → 05:50",
  "madurai to coimbatore": "Vaigai Express (12635) - 13:20 → 21:25",
  "madurai to trichy": "Rockfort Express (12671) - 08:40 → 09:50",
  "coimbatore to bangalore": "Coimbatore Express (12643) - 06:00 → 10:30",
  "trichy to bangalore": "Tiruchendur Express (12679) - 16:20 → 05:00",
  "chennai to salem": "Salem Express (12681) - 12:15 → 17:30",
  "chennai to pondicherry": "Pondy Express (12605) - 06:30 → 09:45"
};

app.post('/chat', (req, res) => {
  const message = req.body.message.toLowerCase().trim();
  let reply = "Sorry, I didn’t get that. Try asking about train schedules, booking, or help.";

  // Check if user is in the middle of booking
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
  } else if (userState.awaitingDate) {
    userState.awaitingDate = false;
    reply = `🎟️ Ticket booked for ${userState.pendingRoute} on ${message}. Safe travels!`;
    userState.pendingRoute = '';
  }
  // New booking intent
  else if (message.includes("book") || message.includes("ticket")) {
    userState.awaitingRoute = true;
    reply = "🎟️ I'd be happy to help you book a ticket. Please provide your route (e.g. Chennai to Madurai).";
  }
  // Train schedules
  else if (message.includes("train") || message.includes("schedule") || message.includes("timing")) {
    reply = `📅 Train Schedules:\n1. Pandian Express - Chennai → Madurai\n2. Covai Express - Chennai → Coimbatore\n3. Cholan Express - Chennai → Trichy\n\n📝 Ask: "Chennai to Madurai" to get details.`;
  }
  // Platform Info
  else if (message.includes("platform")) {
    reply = "🛤️ Platform info will be available closer to departure. Tell me the train name or number for updates.";
  }
  // General Help
  else if (message.includes("help") || message.includes("services")) {
    reply = "🤖 I can assist you with:\n- 🚆 Train Schedules\n- 🎟️ Ticket Booking\n- 🛤️ Platform Info\n- ℹ️ General Railway Help\n\nJust say 'book ticket' or 'chennai to madurai'";
  }
  // Direct route query (e.g. "Chennai to Madurai")
  else {
    const routeMatch = message.match(/([a-z\s]+)\s*to\s*([a-z\s]+)/i);
    if (routeMatch) {
      const routeKey = `${routeMatch[1].trim()} to ${routeMatch[2].trim()}`.toLowerCase();
      if (routes[routeKey]) {
        reply = `✅ Route: ${routeKey}\n🚆 Train: ${routes[routeKey]}`;
      }
    }
  }

  res.json({ reply });
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
