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
  awaitingPassengerDetails: false,
  pendingRoute: '',
  pendingTrain: '',
};

let passengerInfo = {
  name: '',
  gender: '',
  age: '',
  dob: ''
};

const OPENAI_API_KEY = 'sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // replace yours

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
  let reply = "Sorry, I didn’t get that. You can ask about train schedules, book tickets, or get help.";

  // ✨ Smart Passenger Details Handling
  if (userState.awaitingPassengerDetails && message.includes(',')) {
    const parts = message.split(',');
    if (parts.length === 4 && !isNaN(parseInt(parts[2].trim()))) { 
      const [name, gender, age, dob] = parts.map(p => p.trim());
      if (name && gender && age && dob) {
        passengerInfo = { name, gender, age, dob };
        userState.awaitingPassengerDetails = false;

        const url = `/payment.html?route=${encodeURIComponent(userState.pendingRoute)}&train=${encodeURIComponent(userState.pendingTrain)}&name=${encodeURIComponent(name)}&gender=${gender}&age=${age}&dob=${dob}`;
        reply = `✅ Details received for ${name}. Redirecting to payment page...`;
        return res.json({ reply, redirect: url });
      }
    }
    // Else, do NOT return error here. Let normal flow continue.
  }

  // ✨ Greeting Responses
  if (["hi", "hello", "hey"].some(greet => message.includes(greet))) {
    reply = "👋 Hey! I can assist you with bookings, train timings, platform info, and more. Just ask me anything!";
    return res.json({ reply });
  }

  // ✨ Ticket Booking Quick Response
  if (message.includes("book ticket")) {
    userState.awaitingRoute = true;
    reply = "🎟️ Ready to travel? Please type your source and destination like 'Chennai to Madurai' and I’ll help you book!";
    return res.json({ reply });
  }

  // ✨ Platform Info Quick Response
  if (message.includes("platform")) {
    reply = "🛤️ Need platform info? Tell me your route (like 'Chennai to Madurai') and I’ll fetch it for you.";
    return res.json({ reply });
  }

  // ✨ General Help
  if (message.includes("help")) {
    reply = "🤖 I'm here to assist with bookings, train schedules, platform numbers, and customer care support. Type your query!";
    return res.json({ reply });
  }

  // ✨ Customer Care Quick Response
  if (message.includes("customer care") || message.includes("issue")) {
    reply = "☎️ Facing an issue? You can call Railway Helpline 139 📞 or tell me your problem — I’ll guide you.";
    return res.json({ reply });
  }

  // ✨ After "Book Ticket" → Handle Source to Destination
  if (userState.awaitingRoute) {
    const match = message.match(/([a-z\s]+)\s*to\s*([a-z\s]+)/i);
    if (match) {
      const routeKey = `${match[1].trim()} to ${match[2].trim()}`.toLowerCase();
      if (routes[routeKey]) {
        userState.pendingRoute = routeKey;
        userState.pendingTrain = routes[routeKey];
        userState.awaitingRoute = false;
        userState.awaitingPassengerDetails = true;
        reply = `✅ Route: ${routeKey} 🚆 Train: ${routes[routeKey]}\nPlease provide passenger details in this format:\nName, Gender, Age, DOB (YYYY-MM-DD)`;
      } else {
        reply = `❌ Sorry, no train found for "${routeKey}".`;
      }
    } else {
      reply = "⚠️ Please enter route like: source to destination (example: Chennai to Madurai).";
    }
    return res.json({ reply });
  }

  // ✨ Direct "Chennai to Madurai" type route entry
  const routeMatch = message.match(/([a-z\s]+)\s*to\s*([a-z\s]+)/i);
  if (routeMatch) {
    const routeKey = `${routeMatch[1].trim()} to ${routeMatch[2].trim()}`.toLowerCase();
    if (routes[routeKey]) {
      userState.pendingRoute = routeKey;
      userState.pendingTrain = routes[routeKey];
      userState.awaitingPassengerDetails = true;
      reply = `✅ Route: ${routeKey} 🚆 Train: ${routes[routeKey]}\nPlease provide passenger details in this format:\nName, Gender, Age, DOB (YYYY-MM-DD)`;
    } else {
      reply = `❌ Sorry, no train found for "${routeKey}".`;
    }
    return res.json({ reply });
  }

  // ✨ Finally fallback to OpenAI if none matched
  const aiResponse = await askAI(message);
  res.json({ reply: aiResponse });
});

app.listen(port, () => {
  console.log(`✅ Tamil Nadu Railways chatbot server running on port ${port}`);
});
