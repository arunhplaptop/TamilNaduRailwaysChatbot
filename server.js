const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const routes = require('./railwayChat'); // Your routes list

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

const OPENAI_API_KEY = 'sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // your real key

// Function to ask OpenAI if no matching route
async function askAI(question) {
  try {
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
  } catch (error) {
    console.error("OpenAI Error:", error);
    return "Sorry, I couldn't understand that. Please try again.";
  }
}

// Main Chatbot POST Endpoint
app.post('/ask', async (req, res) => {
  const message = (req.body.message || "").toLowerCase().trim();
  let reply = "Sorry, I didn’t get that. You can ask about train schedules, book tickets, or get help.";

  if (!message) {
    return res.json({ reply });
  }

  // Handle when awaiting Passenger Details
  if (userState.awaitingPassengerDetails) {
    const parts = message.split(',');
    if (parts.length === 4) {
      const [name, gender, age, dob] = parts.map(p => p.trim());
      if (name && gender && age && dob) {
        passengerInfo = { name, gender, age, dob };
        userState.awaitingPassengerDetails = false;

        const url = `/payment.html?route=${encodeURIComponent(userState.pendingRoute)}&train=${encodeURIComponent(userState.pendingTrain)}&name=${encodeURIComponent(name)}&gender=${gender}&age=${age}&dob=${dob}`;
        reply = `✅ Details received for ${name}. Redirecting to payment page...`;
        return res.json({ reply, redirect: url });
      } else {
        reply = "⚠️ Invalid format. Please enter details like: Name, Gender, Age, DOB (YYYY-MM-DD)";
        return res.json({ reply });
      }
    } else {
      reply = "⚠️ Invalid format. Please enter details like: Name, Gender, Age, DOB (YYYY-MM-DD)";
      return res.json({ reply });
    }
  }

  // Greeting shortcut
  if (["hi", "hello", "hey"].some(greet => message.includes(greet))) {
    reply = "👋 Hello! I can assist with ticket bookings, train schedules, and more. Try typing 'book ticket' or a route like 'Chennai to Madurai'.";
    return res.json({ reply });
  }

  // Quick options
  if (message.includes("platform info")) {
    reply = "🛤️ Platform info will be updated 2 hours before departure. Please check closer to your travel time!";
    return res.json({ reply });
  }

  if (message.includes("customer care")) {
    reply = "📞 Customer Care Helpline: Dial 139 for assistance.";
    return res.json({ reply });
  }

  if (message.includes("general help") || message.includes("help")) {
    reply = "🤖 I can help you with:\n- Train Schedules\n- Ticket Booking\n- Platform Info\n- Customer Care Details\nJust type your query!";
    return res.json({ reply });
  }

  if (message.includes("book ticket")) {
    userState.awaitingRoute = true;
    reply = "🎟️ Please enter your travel route in the format: 'Source to Destination' (e.g., Chennai to Madurai).";
    return res.json({ reply });
  }

  // If waiting for a route entry
  if (userState.awaitingRoute) {
    const match = message.match(/([a-z\s]+)\s*to\s*([a-z\s]+)/i);
    if (match) {
      const routeKey = `${match[1].trim()} to ${match[2].trim()}`.toLowerCase();
      if (routes[routeKey]) {
        userState.pendingRoute = routeKey;
        userState.pendingTrain = routes[routeKey];
        userState.awaitingRoute = false;
        userState.awaitingPassengerDetails = true;
        reply = `✅ Route selected: ${routeKey} 🚆 Train: ${routes[routeKey]}\nPlease provide passenger details in the format:\nName, Gender, Age, DOB (YYYY-MM-DD)`;
      } else {
        reply = `❌ Sorry, no trains found for "${routeKey}".`;
      }
    } else {
      reply = "⚠️ Please enter the route in correct format: Source to Destination.";
    }
    return res.json({ reply });
  }

  // Direct route input detection
  const directMatch = message.match(/([a-z\s]+)\s*to\s*([a-z\s]+)/i);
  if (directMatch) {
    const routeKey = `${directMatch[1].trim()} to ${directMatch[2].trim()}`.toLowerCase();
    if (routes[routeKey]) {
      userState.pendingRoute = routeKey;
      userState.pendingTrain = routes[routeKey];
      userState.awaitingPassengerDetails = true;
      reply = `✅ Route found: ${routeKey} 🚆 Train: ${routes[routeKey]}\nNow, enter your details:\nName, Gender, Age, DOB (YYYY-MM-DD)`;
      return res.json({ reply });
    }
  }

  // Default fallback to AI if no command matches
  const aiResponse = await askAI(message);
  res.json({ reply: aiResponse });
});

// Start the server
app.listen(port, () => {
  console.log(`✅ Tamil Nadu Railways chatbot server running on port ${port}`);
});
