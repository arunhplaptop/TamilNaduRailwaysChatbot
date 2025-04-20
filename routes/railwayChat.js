const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Popular routes and trains
// routes.js

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
  "chennai to pondicherry": "Pondy Express (12605) - 06:30 → 09:45",
  "chennai to tirunelveli": "Ananthapuri Express (16724) - 19:40 → 07:45",
  "chennai to tuticorin": "Pearl City Express (12693) - 19:30 → 07:20",
  "chennai to nagercoil": "Kanyakumari Express (12633) - 17:00 → 06:30",
  "chennai to villupuram": "Villuparum Passenger (56001) - 06:45 → 09:30",
  "madurai to chennai": "Vaigai Express (12636) - 07:10 → 14:35",
  "madurai to coimbatore": "Intercity Express (22624) - 06:00 → 10:15",
  "madurai to tirunelveli": "Tirunelveli Passenger (56725) - 14:10 → 18:15",
  "coimbatore to chennai": "Cheran Express (12674) - 22:50 → 06:45",
  "coimbatore to trichy": "Intercity Express (22626) - 15:30 → 19:30",
  "trichy to chennai": "Rockfort Express (12652) - 22:00 → 05:15",
  "trichy to coimbatore": "Intercity Express (22625) - 08:30 → 12:45",
  "salem to chennai": "Yercaud Express (22650) - 22:40 → 05:30",
  "pondicherry to chennai": "Puducherry Express (16116) - 16:35 → 20:30",
  "bangalore to chennai": "Brindavan Express (12640) - 14:30 → 21:15",
  "bangalore to coimbatore": "Coimbatore Express (12645) - 23:15 → 05:45",
  "bangalore to madurai": "Tuticorin Express (16236) - 21:15 → 07:20",
  "tirunelveli to chennai": "Ananthapuri Express (16723) - 17:15 → 06:10",
  "nagercoil to chennai": "Kanyakumari Express (12634) - 10:15 → 03:50"
};

module.exports = routes;

// ✅ Custom chatbot logic (No Hugging Face needed)
app.post('/chat', (req, res) => {
  const userMessage = req.body.message.toLowerCase().trim();
  let reply = "Sorry, I didn’t get that. Try asking about train schedules, booking, or help.";

  // Handle train schedule requests
  if (userMessage.includes("train") || userMessage.includes("schedule") || userMessage.includes("timing")) {
    reply = `Sure! Please tell me your source and destination stations.\nExample: "Chennai to Madurai"\n\nPopular Trains:\n1. Pandian Express (12637) - 21:40 → 05:40\n2. Vaigai Express (12635) - 13:20 → 21:25\n3. Cholan Express (16170) - 19:20 → 04:30`;
  } 
  // Handle ticket booking requests
  else if (userMessage.includes("book") || userMessage.includes("ticket")) {
    reply = "I'd be happy to help you book a ticket. Please provide your route and travel date.";

    // Check if the user provided a route like "Chennai to Madurai"
    const routeMatch = userMessage.match(/([a-zA-Z\s]+)\s*to\s*([a-zA-Z\s]+)/);
    if (routeMatch) {
      const source = routeMatch[1].trim();
      const destination = routeMatch[2].trim();
      const routeKey = `${source.toLowerCase()} to ${destination.toLowerCase()}`;

      if (routes[routeKey]) {
        reply = `You have selected: ${source} to ${destination}. Here's a popular train: ${routes[routeKey]}. Please provide your travel date.`;
      } else {
        reply = `Sorry, I couldn't find that route. Please check the route and try again.`;
      }
    }
  }
  // Handle platform info requests
  else if (userMessage.includes("platform")) {
    reply = "Platform info will be available closer to departure. Tell me the train name or number for updates.";
  } 
  // Handle general help requests
  else if (userMessage.includes("help") || userMessage.includes("services")) {
    reply = "I'm here to assist you with:\n- 🚆 Train Schedules\n- 🎟️ Ticket Booking\n- 🛤️ Platform Info\n- ℹ️ General Railway Help\nHow can I assist you today?";
  }

  res.json({ reply });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
