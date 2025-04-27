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

const OPENAI_API_KEY = 'sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // Your OpenAI key

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
    console.error("OpenAI API Error:", error);
    return "Sorry, something went wrong!";
  }
}

app.post('/ask', async (req, res) => {
  const message = (req.body.message || "").toLowerCase().trim();
  let reply = "Sorry, I didn't understand. Please ask about train schedules, ticket booking, or help.";

  if (!message) {
    return res.json({ reply });
  }

  // Check if awaiting passenger details
  if (userState.awaitingPassengerDetails) {
    const parts = message.split(',');
    if (parts.length === 4) {
      const [name, gender, age, dob] = parts.map(p => p.trim());
      if (name && gender && age && dob) {
        passengerInfo = { name, gender, age, dob };
        userState.awaitingPassengerDetails = false;

        const url = `/payment.html?route=${encodeURIComponent(userState.pendingRoute)}&train=${encodeURIComponent(userState.pendingTrain)}&name=${encodeURIComponent(name)}&gender=${gender}&age=${age}&dob=${dob}`;
        reply = `✅ Passenger details received for ${name}. Redirecting to payment page...`;
        return res.json({ reply, redirect: url });
      } else {
        reply = "⚠️ Please enter in correct format: Name, Gender, Age, DOB (YYYY-MM-DD)";
        return res.json({ reply });
      }
    } else {
      reply = "⚠️ Please enter details correctly: Name, Gender, Age, DOB (YYYY-MM-DD)";
      return res.json({ reply });
    }
  }

  // Greeting
  if (["hi", "hello", "hey"].some(word => message.includes(word))) {
    reply = "👋 Hello! I can assist you with ticket booking, schedules and more. Try typing 'book ticket'!";
    return res.json({ reply });
  }

  // Ticket booking button pressed
  if (message.includes('book ticket')) {
    userState.awaitingRoute = true;
    reply = "🎟️ Ready to travel? Please type your source and destination like 'Chennai to Madurai' and I’ll help you book!";
    return res.json({ reply });
  }

  // If awaiting Route
  if (userState.awaitingRoute) {
    const routeMatch = message.match(/([a-z\s]+)\s*to\s*([a-z\s]+)/i);
    if (routeMatch) {
      const routeKey = `${routeMatch[1].trim()} to ${routeMatch[2].trim()}`.toLowerCase();
      if (routes[routeKey]) {
        userState.pendingRoute = routeKey;
        userState.pendingTrain = routes[routeKey];
        userState.awaitingRoute = false;
        userState.awaitingPassengerDetails = true;
        reply = `✅ Route found: ${routeKey} 🚆 Train: ${routes[routeKey]}\n\nPlease provide your passenger details:\nName, Gender, Age, DOB (YYYY-MM-DD)`;
      } else {
        reply = `❌ Sorry, no trains found for "${routeKey}".`;
      }
    } else {
      reply = "⚠️ Please enter in format: source to destination (e.g., Chennai to Madurai)";
    }
    return res.json({ reply });
  }

  // Direct route detection even if not from button
  const directRoute = message.match(/([a-z\s]+)\s*to\s*([a-z\s]+)/i);
  if (directRoute) {
    const routeKey = `${directRoute[1].trim()} to ${directRoute[2].trim()}`.toLowerCase();
    if (routes[routeKey]) {
      userState.pendingRoute = routeKey;
      userState.pendingTrain = routes[routeKey];
      userState.awaitingPassengerDetails = true;
      reply = `✅ Route found: ${routeKey} 🚆 Train: ${routes[routeKey]}\n\nNow please enter:\nName, Gender, Age, DOB (YYYY-MM-DD)`;
      return res.json({ reply });
    }
  }

  // Otherwise fallback to OpenAI small talk
  const aiResponse = await askAI(message);
  return res.json({ reply: aiResponse });
});

app.listen(port, () => {
  console.log(`✅ Tamil Nadu Railways chatbot running on port ${port}`);
});
