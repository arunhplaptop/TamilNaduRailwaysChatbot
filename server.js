// ✅ Final fixed server.js with OpenAI API integration and payment redirection
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const routes = require('./railwayChat');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

let userState = {
  awaitingRoute: false,
  awaitingDate: false,
  pendingRoute: '',
};

let trainChoices = [];

const OPENAI_API_KEY = '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';

async function askAI(question) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: question }]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

app.post('/ask', async (req, res) => {
  const message = req.body.message.toLowerCase().trim();
  let reply = "Sorry, I didn’t get that. Try asking about train schedules, booking, or help.";

  if (message.startsWith("train")) {
    const match = message.match(/train\s+([a-z\s]+)\s*to\s*([a-z\s]+)/i);
    if (match) {
      const routeKey = `${match[1].trim()} to ${match[2].trim()}`.toLowerCase();
      if (routes[routeKey]) {
        trainChoices = [routes[routeKey], "Vaigai Express (12635) - 13:20 → 21:25"];
        reply = `Sure! Popular Trains:\n`;
        trainChoices.forEach((train, i) => {
          reply += `${i + 1}. ${train}\n`;
        });
      } else {
        reply = `❌ Sorry, no train found for \"${routeKey}\".`;
      }
    }
  } else if (trainChoices.length > 0 && (
    message === '1' || message === '2' ||
    message.includes("yes") || message.includes("payment") ||
    trainChoices.some(t => t.toLowerCase().includes(message))
  )) {
    const selectedTrain = 
      message === '1' ? trainChoices[0] :
      message === '2' ? trainChoices[1] :
      trainChoices.find(t => t.toLowerCase().includes(message)) || trainChoices[0];

    reply = `✅ You selected: ${selectedTrain}\nRedirecting to payment page...`;
    res.json({ reply, redirect: "/payment.html?train=" + encodeURIComponent(selectedTrain) });
    return;
  } else if (userState.awaitingRoute) {
    const match = message.match(/(?:train\s+from\s+)?([a-z\s]+)\s*to\s*([a-z\s]+)/i);
    if (match) {
      const routeKey = `${match[1].trim()} to ${match[2].trim()}`.toLowerCase();
      if (routes[routeKey]) {
        userState.awaitingRoute = false;
        userState.awaitingDate = true;
        userState.pendingRoute = routeKey;
        trainChoices = [routes[routeKey], "Vaigai Express (12635) - 13:20 → 21:25"];
        reply = `✅ Route found: ${routeKey}. Train: ${routes[routeKey]}\n📅 Please provide your travel date (e.g. 2025-04-25).`;
      } else {
        reply = `❌ Sorry, no train found for \"${routeKey}\".`;
      }
    } else {
      reply = "⚠️ Please provide the route in the format: source to destination.";
    }
  } else if (userState.awaitingDate) {
    if (trainChoices.some(t => t.toLowerCase() === message)) {
      const selectedTrain = trainChoices.find(t => t.toLowerCase() === message);
      reply = `✅ You selected: ${selectedTrain}\nRedirecting to payment page...`;
      userState.awaitingDate = false;
      userState.pendingRoute = '';
      res.json({ reply, redirect: "/payment.html?train=" + encodeURIComponent(selectedTrain) });
      return;
    }

    userState.awaitingDate = false;
    reply = `🎟️ Ticket booked for ${userState.pendingRoute} on ${message}. Safe travels!`;
    userState.pendingRoute = '';

  } else if (message.includes("book") || message.includes("ticket")) {
    userState.awaitingRoute = true;
    reply = "🎟️ I'd be happy to help you book a ticket. Please provide your route (e.g. Chennai to Madurai).";
  } else if (message.includes("hi") || message.includes("hello") || message.includes("hey")) {
    reply = "👋 Hello! How can I assist you today? You can ask me to book tickets or check train schedules!";
  } else if (message.match(/([a-z\s]+)\s*to\s*([a-z\s]+)/i)) {
    const routeMatch = message.match(/([a-z\s]+)\s*to\s*([a-z\s]+)/i);
    const routeKey = `${routeMatch[1].trim()} to ${routeMatch[2].trim()}`.toLowerCase();
    if (routes[routeKey]) {
      trainChoices = [routes[routeKey], "Vaigai Express (12635) - 13:20 → 21:25"];
      reply = `✅ Route: ${routeKey}\n🚆 Train: ${routes[routeKey]}\n\nType 'yes' or the train name to proceed to payment.`;
    } else {
      reply = `❌ Sorry, no train found for \"${routeKey}\".`;
    }
  } else if (message.includes("schedule") || message.includes("timing")) {
    reply = "📅 Available Train Schedules:\n";
    let count = 1;
    for (let route in routes) {
      reply += `${count}. ${route} → ${routes[route]}\n`;
      if (++count > 5) break;
    }
  } else if (message.includes("platform")) {
    reply = "🛤️ Platform info available closer to departure.";
  } else if (message.includes("help") || message.includes("services")) {
    reply = "🤖 I can help with:\n- 🚆 Train Schedules\n- 🎟️ Ticket Booking\n- 🛤️ Platform Info\n- ℹ️ Railway Help\nSay 'book ticket' or 'Chennai to Madurai'.";
  } else {
    const aiResponse = await askAI(message);
    reply = aiResponse;
  }

  res.json({ reply });
});

app.listen(port, () => {
  console.log(`✅ Tamil Nadu Railways chatbot server running on port ${port}`);
});
