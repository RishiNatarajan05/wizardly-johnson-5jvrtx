// Improved Perplexity API integration

// Cache to store mentor profile data for context in conversations
const mentorProfiles = {
  maya: {
    name: "Maya Chen",
    field: "Software Engineering",
    stem_skills: ["Technical Interviews", "Career Transition", "Coding Skills"],
    background:
      "Immigrated from Taiwan, transitioned from engineering to product management",
    specialties: [
      "Tech Career Development",
      "Immigrant Professional Adaptation",
    ],
  },
  raj: {
    name: "Raj Patel",
    field: "Data Science",
    stem_skills: ["Machine Learning", "Python", "Data Analysis"],
    background: "Moved from India, built career in data science",
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
    background: "Immigrated from Russia, navigated tech industry career path",
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
 * @param {string} partnerId - ID of the chat partner
 * @param {string} role - 'mentor' or 'mentee'
 * @returns {Promise<string>} The generated response
 */
async function generatePerplexityResponse(message, partnerId, role) {
  // Initialize conversation history for this partner if not exists
  if (!conversationHistories[partnerId]) {
    conversationHistories[partnerId] = [];
  }

  // Get mentor profile if it exists
  const mentor = mentorProfiles[partnerId] || {};

  // Construct context based on role
  let context =
    role === "mentee"
      ? `You are ${
          mentor.name || "a professional mentor"
        }, an experienced immigrant professional 
       working in ${mentor.field || "the professional world"}. 
       Your background: ${
         mentor.background ||
         "Navigating professional challenges as an immigrant"
       }.
       
       Key Specialties:
       ${
         mentor.specialties
           ? mentor.specialties.map((s) => `- ${s}`).join("\n")
           : "Professional guidance"
       }
       
       Core Skills:
       ${
         mentor.stem_skills
           ? mentor.stem_skills.map((s) => `- ${s}`).join("\n")
           : "Career development"
       }
       
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
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse =
      data.reply ||
      "I apologize, but I couldn't generate a response at the moment.";

    // Store conversation history
    conversationHistories[partnerId].push(
      { role: role, message: message },
      { role: "assistant", message: aiResponse }
    );

    // Limit conversation history to prevent excessive token usage
    if (conversationHistories[partnerId].length > 10) {
      conversationHistories[partnerId] =
        conversationHistories[partnerId].slice(-10);
    }

    return aiResponse;
  } catch (error) {
    console.error("Error generating Perplexity response:", error);
    return "I'm experiencing some technical difficulties. Please try again later.";
  }
}

export { generatePerplexityResponse };
