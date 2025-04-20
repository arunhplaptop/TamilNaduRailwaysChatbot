const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/chat', (req, res) => {
    const userMessage = req.body.message.toLowerCase();
    let reply = "Sorry, I didn't understand that. Try asking about train timings, booking, or platform info.";

    if (userMessage.includes("train") || userMessage.includes("schedule") || userMessage.includes("timing")) {
        reply = `Sure! Please tell me your source and destination stations.\nExample: "Chennai to Madurai"\n\nPopular Trains:\n1. Pandian Express (12637) - 21:40 → 05:40\n2. Vaigai Express (12635) - 13:20 → 21:25`;
    } else if (userMessage.includes("book") || userMessage.includes("ticket")) {
        reply = "I'd be happy to help you book a ticket. Please provide your route and travel date.";
    } else if (userMessage.includes("platform")) {
        reply = "Platform information is available closer to departure. Please tell me the train name or number.";
    } else if (userMessage.includes("help") || userMessage.includes("services")) {
        reply = "I'm here to assist you with:\n- Train Schedules\n- Ticket Booking\n- Platform Info\n- General Railway Help\nHow can I help you today?";
    }

    res.json({ reply });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
