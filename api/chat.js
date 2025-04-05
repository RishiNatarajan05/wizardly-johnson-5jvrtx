// /api/chat.js
export default async function handler(req, res) {
  // Validate request method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Destructure request body
  const { model, messages, max_tokens, temperature, top_p } = req.body;

  // Validate required fields
  if (!model || !messages || !Array.isArray(messages)) {
    return res.status(400).json({
      error: "Invalid request. Missing required fields.",
    });
  }

  // Get API key from environment variables
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.error("Perplexity API key is not configured");
    return res.status(500).json({
      error: "Server configuration error: Missing API key",
    });
  }

  // Prepare payload for Perplexity API
  const payload = {
    model: model || "mixtral-8x7b-instruct",
    messages: messages,
    max_tokens: max_tokens || 1024,
    temperature: temperature || 0.7,
    top_p: top_p || 0.9,
  };

  try {
    // Make API call to Perplexity
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    // Handle non-2xx responses
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Perplexity API error response:", errorBody);
      return res.status(response.status).json({
        error: "Error communicating with AI service",
        details: errorBody,
      });
    }

    // Parse successful response
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No reply received.";

    // Return successful response
    return res.status(200).json({
      reply: reply,
      usage: data.usage || {},
    });
  } catch (error) {
    // Handle network or parsing errors
    console.error("Unexpected error in chat API:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
