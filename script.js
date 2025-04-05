// Import the Perplexity chat generation function
import { generatePerplexityResponse } from "./perplexity-chat.js";

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Handle profile modals
function openProfile(mentor) {
  document.getElementById(`${mentor}-profile-modal`).style.display = "flex";
}

function closeProfile(mentor) {
  document.getElementById(`${mentor}-profile-modal`).style.display = "none";
}

// Handle chat views
function openChat(mentor) {
  document.getElementById("mentors-list-view").style.display = "none";
  document.getElementById(`${mentor}-chat`).style.display = "flex";
}

function closeChat(mentor) {
  document.getElementById(`${mentor}-chat`).style.display = "none";
  document.getElementById("mentors-list-view").style.display = "block";
}

function closeProfileAndOpenChat(mentor) {
  closeProfile(mentor);
  openChat(mentor);
}

// Send Message Function
async function sendMessage(mentor) {
  const inputElement = document.getElementById(`${mentor}-input`);
  const messagesContainer = document.getElementById(`${mentor}-messages`);
  const message = inputElement.value.trim();

  if (message === "") return;

  // Get current time
  const now = new Date();
  const timeString = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Add user message
  messagesContainer.innerHTML += `
    <div class="message message-sent">
      <div class="message-text">${escapeHtml(message)}</div>
      <div class="message-time">${timeString}</div>
    </div>
  `;

  // Clear input
  inputElement.value = "";

  // Show typing indicator
  messagesContainer.innerHTML += `
    <div class="typing-indicator" id="${mentor}-typing">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;

  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    // Determine the role (using mentee as default)
    const role = "mentee";

    // Generate response using Perplexity API
    const response = await generatePerplexityResponse(message, mentor, role);

    // Remove typing indicator
    document.getElementById(`${mentor}-typing`)?.remove();

    // Add AI response to chat
    messagesContainer.innerHTML += `
      <div class="message message-received">
        <div class="message-text">${escapeHtml(response)}</div>
        <div class="message-time">${timeString}</div>
      </div>
    `;

    // Scroll to bottom again
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } catch (error) {
    console.error("Error generating response:", error);

    // Remove typing indicator
    document.getElementById(`${mentor}-typing`)?.remove();

    // Show error message
    messagesContainer.innerHTML += `
      <div class="message message-received">
        <div class="message-text">Sorry, I encountered an error. Please try again later.</div>
        <div class="message-time">${timeString}</div>
      </div>
    `;

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// Allow pressing Enter to send messages
document.querySelectorAll(".chat-input input").forEach((input) => {
  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      const mentor = this.id.split("-")[0];
      sendMessage(mentor);
    }
  });
});

// Add event listeners for send buttons
document.querySelectorAll(".chat-input button").forEach((button) => {
  button.addEventListener("click", function () {
    const mentor = this.closest(".chat-container").id.split("-")[0];
    sendMessage(mentor);
  });
});
