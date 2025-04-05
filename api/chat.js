// api/chat.js - Enhanced version
export default async function handler(req, res) {
  // Validate request method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Log the incoming request (for debugging)
  console.log("Received chat request:", JSON.stringify(req.body, null, 2));

  // Destructure request body
  const { model, messages, max_tokens, temperature, top_p } = req.body;

  // Validate required fields
  if (!model || !messages || !Array.isArray(messages)) {
    return res.status(400).json({
      error: "Invalid request. Missing required fields.",
      details: "The request must include model and messages array.",
    });
  }

  // Get API key from environment variables
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.error("Perplexity API key is not configured");

    // For development purposes, return a mock response if no API key
    if (process.env.NODE_ENV === "development") {
      console.log("Using mock response in development mode");
      return res.status(200).json({
        reply:
          "This is a mock response from the development environment. Configure PERPLEXITY_API_KEY to use the real API.",
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      });
    }

    return res.status(500).json({
      error: "Server configuration error: Missing API key",
      details:
        "Please make sure the PERPLEXITY_API_KEY environment variable is set.",
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

  console.log("Sending to Perplexity API:", JSON.stringify(payload, null, 2));

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

    // Log the raw response for debugging
    const responseText = await response.text();
    console.log(`Perplexity API response status: ${response.status}`);
    console.log(`Response body: ${responseText}`);

    // Handle non-2xx responses
    if (!response.ok) {
      return res.status(response.status).json({
        error: "Error communicating with AI service",
        details: responseText,
      });
    }

    // Parse successful response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      return res.status(500).json({
        error: "Error parsing API response",
        details: parseError.message,
      });
    }

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
