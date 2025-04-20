const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./railwayChat');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// User state to manage flow
let userState = {
  awaitingRoute: false,
  awaitingDate: false,
  pendingRoute: '',
};

let trainChoices = []; // store train options when a train query is made

// Chatbot logic
app.post('/ask', (req, res) => {
  const message = req.body.message.toLowerCase().trim();
  let reply = "Sorry, I didn’t get that. Try asking about train schedules, booking, or help.";

  // Train query like "train chennai to madurai"
  if (message.startsWith("train")) {
    const match = message.match(/train\s+([a-z\s]+)\s*to\s*([a-z\s]+)/i);
    if (match) {
      const routeKey = `${match[1].trim()} to ${match[2].trim()}`.toLowerCase();
      if (routes[routeKey]) {
        // Found the route, list options
        trainChoices = [
          routes[routeKey],
          "Vaigai Express (12635) - 13:20 → 21:25"
        ];
        reply = `Sure! Please tell me your source and destination stations. Example: "Chennai to Madurai"\nPopular Trains:\n`;
        trainChoices.forEach((train, i) => {
          reply += `${i + 1}. ${train}\n`;
        });
      } else {
        reply = `❌ Sorry, no train found for "${routeKey}".`;
      }
    }
  }

  // Selecting a train by number or name
  else if (trainChoices.length > 0 && (message === '1' || message === '2' || trainChoices.some(t => t.toLowerCase().includes(message)))) {
    const selectedTrain = message === '1' ? trainChoices[0]
      : message === '2' ? trainChoices[1]
      : trainChoices.find(t => t.toLowerCase().includes(message));

    reply = `✅ You selected: ${selectedTrain}\nRedirecting to payment page...`;
    res.json({ reply, redirect: "/payment.html?train=" + encodeURIComponent(selectedTrain) });
    return;
  }

  // Booking: Awaiting Route
  else if (userState.awaitingRoute) {
    const match = message.match(/(?:train\s+from\s+)?([a-z\s]+)\s*to\s*([a-z\s]+)/i);
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
  }

  // Booking: Awaiting Date
  else if (userState.awaitingDate) {
    userState.awaitingDate = false;
    reply = `🎟️ Ticket booked for ${userState.pendingRoute} on ${message}. Safe travels!`;
    userState.pendingRoute = '';
  }

  // New booking intent
  else if (message.includes("book") || message.includes("ticket")) {
    userState.awaitingRoute = true;
    reply = "🎟️ I'd be happy to help you book a ticket. Please provide your route (e.g. Chennai to Madurai).";
  }

  // Direct route query (anytime)
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
      if (++count > 5) break;
    }
    reply += "\n📝 Ask 'Chennai to Madurai' to get specific details.";
  }

  // Platform Info
  else if (message.includes("platform")) {
    reply = "🛤️ Platform info will be available closer to departure. Tell me the train name or number for updates.";
  }

  // General Help
  else if (message.includes("help") || message.includes("services")) {
    reply = "🤖 I can assist you with:\n- 🚆 Train Schedules\n- 🎟️ Ticket Booking\n- 🛤️ Platform Info\n- ℹ️ General Railway Help\n\nJust say 'book ticket' or 'chennai to madurai'.";
  }

  res.json({ reply });
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
