const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 10000; // Use 10000 or the environment PORT if available

// Middleware setup
app.use(cors()); // Enable Cross-Origin Resource Sharing (CORS)
app.use(bodyParser.json()); // Middleware to parse JSON bodies from requests

// Serve static files (like your HTML, CSS, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Import the railwayChat route
const railwayChat = require("./routes/railwayChat");
app.use("/api/railway-chat", railwayChat);

// Chatbot endpoint (dummy reply for testing)
app.post('/ask', (req, res) => {
  const userMessage = req.body.message;
  const dummyReply = `You said: "${userMessage}". I'm your Tamil Nadu Railway Assistant 🚆`;
  res.json({ reply: dummyReply });
});

// Serve HTML for any other requests (fallback route)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')); // Make sure index.html exists in the 'public' folder
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
