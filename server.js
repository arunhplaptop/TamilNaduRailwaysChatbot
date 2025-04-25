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

const OPENAI_API_KEY = 'sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

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

  // Handle name, gender, age, dob
  if (userState.awaitingPassengerDetails) {
    const parts = message.split(',');
    if (parts.length === 4) {
      const [name, gender, age, dob] = parts.map(p => p.trim());
      if (name && gender && age && dob) {
        passengerInfo = { name, gender, age, dob };
        userState.awaitingPassengerDetails = false;

        const url = `/payment.html?route=${encodeURIComponent(userState.pendingRoute)}&train=${encodeURIComponent(userState.pendingTrain)}&name=${encodeURIComponent(name)}&gender=${gender}&age=${age}&dob=${dob}`;
        reply = `✅ Details received for ${name}. Redirecting to payment...`;
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

  // Greeting response
  if (["hi", "hello", "hey"].includes(message)) {
    reply = "Hello! I can help you with ticket bookings, train schedules, and more. Try typing 'book ticket' or 'Chennai to Madurai'.";
    return res.json({ reply });
  }

  // Handle book ticket
  if (message.includes("book ticket")) {
    userState.awaitingRoute = true;
    reply = "Please enter your route (e.g., Chennai to Madurai).";
    return res.json({ reply });
  }

  // Handle route after book ticket
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
      reply = "⚠️ Please enter the route in the format: source to destination (e.g., Chennai to Madurai).";
    }
    return res.json({ reply });
  }

  // Handle direct route input like "Chennai to Madurai"
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

  // Fallback to OpenAI
  const aiResponse = await askAI(message);
  res.json({ reply: aiResponse });
});

app.listen(port, () => {
  console.log(`✅ Tamil Nadu Railways chatbot server running on port ${port}`);
});
