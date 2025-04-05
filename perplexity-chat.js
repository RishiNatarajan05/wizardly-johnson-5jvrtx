// perplexity-chat.js
// Integration of Perplexity API for MentorMatch chat system

// Perplexity API configuration
const PERPLEXITY_API_KEY = "YOUR_PERPLEXITY_API_KEY"; // Replace with your actual API key
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

// Cache to store mentor profile data for context in conversations
const mentorProfiles = {};

/**
 * Initialize the chat system with Perplexity API integration
 * @param {string} role - 'mentor' or 'mentee'
 */
function initChatSystem(role) {
  // Setup event listeners for all chat interfaces
  const chatContainers = document.querySelectorAll(`.${role}-chat`);

  chatContainers.forEach((container) => {
    const mentorId = container.id.split("-")[0]; // Extract mentor ID from container ID
    const inputElem = document.getElementById(`${mentorId}-input`);
    const sendBtn = container.querySelector("button");

    // Load mentor profile data if not already loaded
    if (!mentorProfiles[mentorId] && role === "mentee") {
      fetchMentorProfile(mentorId);
    }

    // Add event listener for send button
    if (sendBtn) {
      sendBtn.addEventListener("click", () => sendMessage(mentorId, role));
    }

    // Add event listener for Enter key
    if (inputElem) {
      inputElem.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
          sendMessage(mentorId, role);
        }
      });
    }
  });

  // Initialize typing indicators
  setupTypingIndicators();
}

/**
 * Fetch mentor profile data for better context in conversations
 * @param {string} mentorId - ID of the mentor
 */
async function fetchMentorProfile(mentorId) {
  try {
    const { data, error } = await supabase
      .from("mentors")
      .select("*")
      .eq("id", mentorId)
      .single();

    if (error) throw error;

    mentorProfiles[mentorId] = data;
    console.log(`Loaded mentor profile for ${mentorId}:`, data);
  } catch (error) {
    console.error(`Error loading mentor profile for ${mentorId}:`, error);
  }
}

/**
 * Send a message and get response from Perplexity API
 * @param {string} partnerId - ID of the chat partner (mentor or mentee)
 * @param {string} role - 'mentor' or 'mentee'
 */
async function sendMessage(partnerId, role) {
  // Get input element and messages container
  const inputElem = document.getElementById(`${partnerId}-input`);
  const messagesContainer = document.getElementById(`${partnerId}-messages`);

  if (!inputElem || !messagesContainer) {
    console.error("Required elements not found");
    return;
  }

  const message = inputElem.value.trim();
  if (message === "") return;

  // Get current time for the message
  const now = new Date();
  const timeString = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Add user message to the chat
  messagesContainer.innerHTML += `
    <div class="message message-sent">
      <div class="message-text">${escapeHtml(message)}</div>
      <div class="message-time">${timeString}</div>
    </div>
  `;

  // Clear input field
  inputElem.value = "";

  // Show typing indicator
  showTypingIndicator(partnerId);

  // Scroll to bottom
  scrollToBottom(messagesContainer);

  try {
    // Send message to Perplexity API
    const response = await generatePerplexityResponse(message, partnerId, role);

    // Remove typing indicator
    hideTypingIndicator(partnerId);

    // Add AI response to chat
    messagesContainer.innerHTML += `
      <div class="message message-received">
        <div class="message-text">${response}</div>
        <div class="message-time">${timeString}</div>
      </div>
    `;

    // Scroll to bottom again
    scrollToBottom(messagesContainer);
  } catch (error) {
    console.error("Error generating response:", error);

    // Remove typing indicator
    hideTypingIndicator(partnerId);

    // Show error message
    messagesContainer.innerHTML += `
      <div class="message message-received">
        <div class="message-text">Sorry, I encountered an error. Please try again later.</div>
        <div class="message-time">${timeString}</div>
      </div>
    `;

    // Scroll to bottom
    scrollToBottom(messagesContainer);
  }
}

/**
 * Generate a response using the Perplexity API
 * @param {string} message - The user's message
 * @param {string} partnerId - ID of the chat partner
 * @param {string} role - 'mentor' or 'mentee'
 * @returns {Promise<string>} The generated response
 */
async function generatePerplexityResponse(message, partnerId, role) {
  let context = "";

  if (role === "mentee" && mentorProfiles[partnerId]) {
    const mentor = mentorProfiles[partnerId];
    context = `You are a mentor named ${mentor.name} who is a ${
      mentor.field
    } professional. 
      Your expertise includes: ${mentor.stem_skills.join(", ")}. 
      You have ${mentor.work_experience}. 
      You are mentoring an immigrant professional who needs guidance in their career. 
      Respond in a helpful, encouraging, and professional manner.`;
  } else if (role === "mentor") {
    context = `You are responding as an immigrant professional seeking mentorship. 
      Express your career challenges, ask thoughtful questions, and show appreciation for advice.`;
  }

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, partnerId, role, context }),
  });

  const data = await response.json();
  return data.reply;
}

/**
 * Set up typing indicators for all chats
 */
function setupTypingIndicators() {
  // Create typing indicators for all message containers
  const messageContainers = document.querySelectorAll('[id$="-messages"]');

  messageContainers.forEach((container) => {
    const partnerId = container.id.split("-")[0];
    const typingIndicator = document.createElement("div");
    typingIndicator.id = `${partnerId}-typing`;
    typingIndicator.className = "typing-indicator";
    typingIndicator.style.display = "none";
    typingIndicator.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    container.appendChild(typingIndicator);
  });
}

/**
 * Show typing indicator for a specific chat
 * @param {string} partnerId - ID of the chat partner
 */
function showTypingIndicator(partnerId) {
  const indicator = document.getElementById(`${partnerId}-typing`);
  if (indicator) {
    indicator.style.display = "flex";
  }
}

/**
 * Hide typing indicator for a specific chat
 * @param {string} partnerId - ID of the chat partner
 */
function hideTypingIndicator(partnerId) {
  const indicator = document.getElementById(`${partnerId}-typing`);
  if (indicator) {
    indicator.style.display = "none";
  }
}

/**
 * Scroll a container to the bottom
 * @param {HTMLElement} container - The container to scroll
 */
function scrollToBottom(container) {
  container.scrollTop = container.scrollHeight;
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} unsafe - Potentially unsafe string
 * @returns {string} Escaped safe string
 */
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Save chat history to database
 * @param {string} mentorId - ID of the mentor
 * @param {string} menteeId - ID of the mentee
 * @param {string} message - The message content
 * @param {string} sender - 'mentor' or 'mentee'
 */
async function saveChatMessage(mentorId, menteeId, message, sender) {
  try {
    const { data, error } = await supabase.from("chat_messages").insert([
      {
        mentor_id: mentorId,
        mentee_id: menteeId,
        message: message,
        sender: sender,
        timestamp: new Date(),
      },
    ]);

    if (error) throw error;

    console.log("Message saved to database:", data);
  } catch (error) {
    console.error("Error saving message:", error);
  }
}

/**
 * Load chat history from database
 * @param {string} mentorId - ID of the mentor
 * @param {string} menteeId - ID of the mentee
 * @param {HTMLElement} messagesContainer - Container to display messages
 */
async function loadChatHistory(mentorId, menteeId, messagesContainer) {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .or(`mentor_id.eq.${mentorId},mentee_id.eq.${menteeId}`)
      .order("timestamp", { ascending: true });

    if (error) throw error;

    // Clear existing messages
    messagesContainer.innerHTML = "";

    // Add messages from history
    data.forEach((msg) => {
      const timeString = new Date(msg.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const messageClass =
        msg.sender === "mentee" ? "message-sent" : "message-received";

      messagesContainer.innerHTML += `
        <div class="message ${messageClass}">
          <div class="message-text">${escapeHtml(msg.message)}</div>
          <div class="message-time">${timeString}</div>
        </div>
      `;
    });

    // Add typing indicator (hidden by default)
    const typingIndicator = document.createElement("div");
    typingIndicator.id = `${mentorId}-typing`;
    typingIndicator.className = "typing-indicator";
    typingIndicator.style.display = "none";
    typingIndicator.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    messagesContainer.appendChild(typingIndicator);

    // Scroll to bottom
    scrollToBottom(messagesContainer);
  } catch (error) {
    console.error("Error loading chat history:", error);
  }
}

// Export functions for use in main script
export { initChatSystem, sendMessage, loadChatHistory };
