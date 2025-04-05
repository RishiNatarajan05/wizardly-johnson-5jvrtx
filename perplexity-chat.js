// perplexity-chat.js
// Improved Perplexity API integration

// Cache to store mentor profile data for context in conversations
const mentorProfiles = {};

/**
 * Generate a response using the Perplexity API
 * @param {string} message - The user's message
 * @param {string} partnerId - ID of the chat partner
 * @param {string} role - 'mentor' or 'mentee'
 * @returns {Promise<string>} The generated response
 */
async function generatePerplexityResponse(message, partnerId, role) {
  let context = "";

  // Try to get mentor profile if it exists
  const mentor = mentorProfiles[partnerId] || {};

  // Construct context based on role
  if (role === "mentee") {
    context = `You are a mentor helping an immigrant professional. 
      Your name is ${mentor.name || "Anonymous"}. 
      You work in ${mentor.field || "a professional field"}. 
      You have expertise in: ${
        mentor.stem_skills ? mentor.stem_skills.join(", ") : "various skills"
      }. 
      Provide personalized, empathetic, and actionable career advice.`;
  } else if (role === "mentor") {
    context = `You are an immigrant professional seeking mentorship advice. 
      Engage professionally and show genuine interest in career growth.`;
  }

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        partnerId,
        role,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return (
      data.reply ||
      "I apologize, but I couldn't generate a response at the moment."
    );
  } catch (error) {
    console.error("Error generating Perplexity response:", error);
    return "I'm experiencing some technical difficulties. Please try again later.";
  }
}

export { generatePerplexityResponse };
