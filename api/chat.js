// /api/chat.js
export default async function handler(req, res) {
  const { message, partnerId, role, context } = req.body;

  const apiKey = process.env.PERPLEXITY_API_KEY;

  const payload = {
    model: "mixtral-8x7b-instruct",
    messages: [
      {
        role: "system",
        content: context,
      },
      {
        role: "user",
        content: message,
      },
    ],
    max_tokens: 1024,
    temperature: 0.7,
    top_p: 0.9,
  };

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    res
      .status(200)
      .json({
        reply: data.choices?.[0]?.message?.content || "No reply received.",
      });
  } catch (error) {
    console.error("Perplexity API error:", error);
    res.status(500).json({ error: "Error processing chat response." });
  }
}
