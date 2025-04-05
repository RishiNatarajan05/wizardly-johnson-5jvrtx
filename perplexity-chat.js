// perplexity-chat.js
// This file provides integration with the Perplexity API for mentor chat functionality

// Cache to store mentor profile data for context in conversations
const mentorProfiles = {
  maya: {
    name: "Maya Chen",
    field: "Software Engineering",
    stem_skills: ["Technical Interviews", "Career Transition", "Coding Skills"],
    background:
      "Immigrated from Taiwan, transitioned from entry-level engineer to senior role at Google",
    specialties: [
      "Tech Career Development",
      "Immigrant Professional Adaptation",
    ],
  },
  raj: {
    name: "Raj Patel",
    field: "Data Science",
    stem_skills: ["Machine Learning", "Python", "Data Analysis"],
    background: "Moved from India, built career in data science at Microsoft",
    specialties: ["Career Planning in Tech", "Technical Skill Development"],
  },
  elena: {
    name: "Elena Petrova",
    field: "Product Management",
    stem_skills: [
      "Product Strategy",
      "User Research",
      "Stakeholder Management",
    ],
    background:
      "Immigrated from Russia, navigated tech industry career path at Amazon",
    specialties: [
      "Product Management Guidance",
      "Professional Growth Strategies",
    ],
  },
};

// Conversation history cache to maintain context
const conversationHistories = {};

/**
 * Generate a response using the Perplexity API
 * @param {string} message - The user's message
 * @param {string} partnerId - ID of the chat partner (mentor's ID)
 * @param {string} role - 'mentor' or 'mentee'
 * @returns {Promise<string>} The generated response
 */
async function generatePerplexityResponse(message, partnerId, role) {
  console.log(
    `Generating response for ${role} message to ${partnerId}: ${message}`
  );

  // Initialize conversation history for this partner if not exists
  if (!conversationHistories[partnerId]) {
    conversationHistories[partnerId] = [];
  }

  // Get mentor profile if it exists
  const mentor = mentorProfiles[partnerId] || {
    name: "a professional mentor",
    field: "the professional world",
    background: "Navigating professional challenges as an immigrant",
    specialties: ["Professional guidance"],
    stem_skills: ["Career development"],
  };

  // Construct context based on role
  let context =
    role === "mentee"
      ? `You are ${mentor.name}, an experienced immigrant professional 
         working in ${mentor.field}. 
         Your background: ${mentor.background}.
         
         Key Specialties:
         ${mentor.specialties.map((s) => `- ${s}`).join("\n")}
         
         Core Skills:
         ${mentor.stem_skills.map((s) => `- ${s}`).join("\n")}
         
         Communication Approach:
         - Be empathetic and understanding of immigrant professional challenges
         - Provide actionable, practical advice
         - Use a supportive and encouraging tone
         - Draw from personal experience when relevant`
      : `You are an immigrant professional seeking mentorship and career guidance. 
         Be genuine, ask thoughtful questions, and show eagerness to learn and grow professionally.`;

  // Add recent conversation history for context
  const recentHistory = conversationHistories[partnerId]
    .slice(-3) // Last 3 messages
    .map((entry) => `${entry.role}: ${entry.message}`)
    .join("\n");

  // Prepare API payload
  const payload = {
    model: "mixtral-8x7b-instruct",
    messages: [
      {
        role: "system",
        content: context + "\n\nRecent Conversation History:\n" + recentHistory,
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
    console.log("Sending request to API:", JSON.stringify(payload, null, 2));

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}): ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API response:", data);

    const aiResponse =
      data.reply ||
      "I apologize, but I couldn't generate a response at the moment.";

    // Store conversation history
    conversationHistories[partnerId].push(
      { role: role === "mentee" ? "user" : "assistant", message: message },
      { role: role === "mentee" ? "assistant" : "user", message: aiResponse }
    );

    // Limit conversation history to prevent excessive token usage
    if (conversationHistories[partnerId].length > 10) {
      conversationHistories[partnerId] =
        conversationHistories[partnerId].slice(-10);
    }

    return aiResponse;
  } catch (error) {
    console.error("Error generating Perplexity response:", error);

    // For development or if the API is not available, return a fallback response
    if (process.env.NODE_ENV === "development" || !window.PERPLEXITY_API_KEY) {
      console.log("Using fallback response for development");
      const fallbackResponses = {
        maya: "As someone who navigated the tech industry after immigrating, I understand your challenges. Let's work on developing a plan tailored to your situation and goals. What specific area would you like to focus on first?",
        raj: "From my experience transitioning from India to the data science field in the US, I've learned valuable lessons about adapting while maintaining your strengths. I'd be happy to share strategies that worked for me and explore what might work best for your situation.",
        elena:
          "Having moved from Russia and built my product management career here, I understand the unique challenges you're facing. Let's discuss practical steps you can take to leverage your background while adapting to the professional culture here.",
      };

      return (
        fallbackResponses[partnerId] ||
        "I appreciate you sharing that with me. As an immigrant professional myself, I understand some of those challenges. Let's work together to develop strategies that can help you succeed in your career journey."
      );
    }

    throw error; // Re-throw the error for the caller to handle
  }
}

// Export the function
export { generatePerplexityResponse };
