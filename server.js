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

const OPENAI_API_KEY = 'sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

let userState = {
  awaitingRoute: false,
  awaitingPassengerDetails: false,
  pendingRoute: '',
  selectedTrain: '',
  passengerDetails: {}
};

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
  const message = req.body.message.trim().toLowerCase();
  let reply = "Sorry, I didn’t get that. Try asking about train schedules, booking, or help.";

  if (message.includes(" to ")) {
    const match = message.match(/([a-z\s]+)\s+to\s+([a-z\s]+)/i);
    if (match) {
      const routeKey = `${match[1].trim()} to ${match[2].trim()}`.toLowerCase();
      if (routes[routeKey]) {
        userState.pendingRoute = routeKey;
        userState.selectedTrain = routes[routeKey];
        userState.awaitingPassengerDetails = true;
        reply = `✅ Route: ${routeKey} 🚆 Train: ${routes[routeKey]}\nPlease provide passenger details in the following format:\nName, Gender, Age, DOB (YYYY-MM-DD).`;
      } else {
        reply = `❌ Sorry, no train found for "${routeKey}".`;
      }
    }
  } else if (userState.awaitingPassengerDetails) {
    const detailMatch = message.match(/^([a-z\s]+),\s*(male|female|other),\s*(\d{1,2}),\s*(\d{4}-\d{2}-\d{2})$/i);
    if (detailMatch) {
      userState.awaitingPassengerDetails = false;
      const [_, name, gender, age, dob] = detailMatch;
      userState.passengerDetails = { name, gender, age, dob };
      const redirectUrl = `/payment.html?route=${encodeURIComponent(userState.pendingRoute)}&train=${encodeURIComponent(userState.selectedTrain)}&name=${name}&gender=${gender}&age=${age}&dob=${dob}`;
      reply = `✅ Passenger info received.\nRedirecting to payment page...`;
      res.json({ reply, redirect: redirectUrl });
      return;
    } else {
      reply = "⚠️ Invalid format. Please enter: Name, Gender, Age, DOB (YYYY-MM-DD).";
    }
  } else {
    const aiResponse = await askAI(message);
    reply = aiResponse;
  }

  res.json({ reply });
});

app.listen(port, () => {
  console.log(`✅ Tamil Nadu Railways chatbot server running on port ${port}`);
});
