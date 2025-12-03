const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
require("dotenv").config();

console.log("🔑 OpenAI key loaded?", !!process.env.OPENAI_API_KEY); // 👈 debug log

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/chat", async (req, res) => {
  try {
    const { message, context } = req.body;
    console.log("🟢 Incoming AI message:", message); // 👈 debug

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const result = await client.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        {
          role: "system",
          content:
            "You are TripMate AI Assistant. Help users plan trips, suggest destinations, activities, budgets, and itineraries.",
        },
        ...(context || []),
        { role: "user", content: message },
      ],
    });

    console.log("✅ AI response received!");
    res.json({ reply: result.choices[0].message.content });
  } catch (error) {
    console.error("❌ AI Chat Error:", error);
    res.status(500).json({
      error: error.message,
      details: error.response?.data || "Unknown error",
    });
  }
});

module.exports = router;
