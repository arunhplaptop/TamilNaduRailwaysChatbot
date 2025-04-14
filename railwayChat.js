// routes/railwayChat.js
const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

router.post("/", async (req, res) => {
  const messages = req.body.messages;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.json({ error: "Messages array is required", status: false });
  }

  const systemContext =
    "You are a helpful Tamil Nadu Railways assistant. You can help with train timings, ticket booking information, and general railway inquiries. Always be polite and provide accurate information about Tamil Nadu Railways services.";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer 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`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "system", content: systemContext }, ...messages],
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No response";

    res.json({ message: reply, status: true });
  } catch (error) {
    res.json({ error: error.message, status: false });
  }
});

module.exports = router;
