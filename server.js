const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Chatbot endpoint
app.post('/ask', (req, res) => {
  const userMessage = req.body.message;
  const dummyReply = `You said: "${userMessage}". I'm your Tamil Nadu Railway Assistant 🚆`;
  res.json({ reply: dummyReply });
});

// Serve HTML
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
