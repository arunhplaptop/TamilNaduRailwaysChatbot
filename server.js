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
  selectedRoute: '',
  selectedTrain: '',
  askingPassenger: false,
  passengerDetails: {
    name: '',
    gender: '',
    age: '',
    dob: ''
  }
};

let trainChoices = [];

const OPENAI_API_KEY = 'sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

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

function isPassengerDetailsComplete(details) {
  return details.name && details.gender && details.age && details.dob;
}

app.post('/ask', async (req, res) => {
  const message = req.body.message.trim().toLowerCase();
  let reply = "Sorry, I didn’t get that. Try asking about train schedules, booking, or help.";

  // Greeting
  if (["hi", "hello", "hey"].includes(message)) {
    reply = "Hello! How can I assist you today? You can ask for train routes like 'Chennai to Madurai' or type 'book ticket'.";
    return res.json({ reply });
  }

  // Passenger detail collection
  if (userState.askingPassenger) {
    const parts = message.split(',');
    if (parts.length === 4) {
      userState.passengerDetails = {
        name: parts[0].trim(),
        gender: parts[1].trim(),
        age: parts[2].trim(),
        dob: parts[3].trim()
      };

      if (isPassengerDetailsComplete(userState.passengerDetails)) {
        const paymentURL = `/payment.html?train=${encodeURIComponent(userState.selectedTrain)}&name=${encodeURIComponent(userState.passengerDetails.name)}&gender=${encodeURIComponent(userState.passengerDetails.gender)}&age=${encodeURIComponent(userState.passengerDetails.age)}&dob=${encodeURIComponent(userState.passengerDetails.dob)}`;
        reply = `✅ Passenger details saved for ${userState.passengerDetails.name}. Redirecting to payment page...`;
        userState.askingPassenger = false;
        return res.json({ reply, redirect: paymentURL });
      }
    }
    return res.json({ reply: "⚠️ Invalid format. Please enter: Name, Gender, Age, DOB (YYYY-MM-DD)." });
  }

  // Route detection
  const match = message.match(/([a-z\s]+)\s+to\s+([a-z\s]+)/i);
  if (match) {
    const routeKey = `${match[1].trim()} to ${match[2].trim()}`.toLowerCase();
    if (routes[routeKey]) {
      userState.selectedRoute = routeKey;
      userState.selectedTrain = routes[routeKey];
      userState.askingPassenger = true;
      trainChoices = [routes[routeKey]];
      reply = `✅ Route: ${routeKey} 🚆 Train: ${routes[routeKey]}\nPlease provide passenger details in the following format: Name, Gender, Age, DOB (YYYY-MM-DD).`;
      return res.json({ reply });
    } else {
      return res.json({ reply: `❌ Sorry, no train found for "${routeKey}".` });
    }
  }

  // Old flow - yes to redirect
  if (trainChoices.length > 0 && (message === "yes" || trainChoices.some(t => message.includes(t.toLowerCase())))) {
    const selectedTrain = trainChoices[0];
    const redirectUrl = `/payment.html?train=${encodeURIComponent(selectedTrain)}`;
    return res.json({ reply: `✅ You selected: ${selectedTrain}. Redirecting to payment page...`, redirect: redirectUrl });
  }

  // Fallback AI
  const aiResponse = await askAI(message);
  return res.json({ reply: aiResponse });
});

app.listen(port, () => {
  console.log(`✅ Tamil Nadu Railways chatbot server running on port ${port}`);
});
