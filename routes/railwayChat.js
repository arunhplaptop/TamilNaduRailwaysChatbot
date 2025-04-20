const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');  // Importing the routes.js file

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// User state to manage flow
let userState = {
  awaitingRoute: false,
  awaitingDate: false,
  pendingRoute: '',
};

// Chatbot logic
app.post('/chat', (req, res) => {
  const message = req.body.message.toLowerCase().trim();
  let reply = "Sorry, I didn’t get that. Try asking about train schedules, booking, or help.";

  // Check if user is in the middle of booking
  if (userState.awaitingRoute) {
    const match = message.match(/([a-z\s]+)\s*to\s*([a-z\s]+)/i);  // Match 'chennai to madurai'
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
      reply = "⚠️ Please provide the route in the format: source to destination. Example: Chennai to Madurai.";
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
    reply = "🤖 I can assist you with:\n- 🚆 Train Schedules\n- 🎟️ Ticket Booking\n- 🛤️ Platform Info\n- ℹ️ General Railway Help\n\nJust say 'book ticket' or 'chennai to madurai'.";
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
  console.log(`Server running on port ${port}`);
});
