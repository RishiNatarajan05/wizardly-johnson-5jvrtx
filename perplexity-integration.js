// perplexity-integration.js
// Helper script to integrate Perplexity chat into the MentorMatch application

import { initChatSystem, loadChatHistory } from "./perplexity-chat.js";

document.addEventListener("DOMContentLoaded", function () {
  // Check which page we're on
  const isMenteePage = document.body.contains(
    document.getElementById("mentee-quiz")
  );
  const isMentorPage = document.body.contains(
    document.getElementById("mentor-quiz")
  );
  const isMyMentorsPage = document.body.contains(
    document.getElementById("mentors-list-view")
  );

  // Initialize regular app features
  if (isMenteePage) {
    initMenteeQuiz();
  }

  if (isMentorPage) {
    initMentorQuiz();
  }

  // Initialize chat system if on My Mentors page
  if (isMyMentorsPage) {
    initChatFeatures();
  }

  // Initialize tag input functionality if present on page
  initTagInputs();
});

/**
 * Initialize chat-related features on the My Mentors page
 */
function initChatFeatures() {
  // Initialize Perplexity chat system
  initChatSystem("mentee");

  // Add event listeners for opening/closing chats
  document.querySelectorAll(".mentor-card").forEach((card) => {
    const mentorId = card.getAttribute("data-mentor-id");

    // Add listeners to chat buttons
    const chatButton = card.querySelector(".btn-primary");
    if (chatButton) {
      chatButton.addEventListener("click", () => openChat(mentorId));
    }
  });

  // Add listeners to back buttons in chat interfaces
  document.querySelectorAll(".back-button").forEach((button) => {
    button.addEventListener("click", () => {
      const chatContainer = button.closest(".chat-container");
      if (chatContainer) {
        const mentorId = chatContainer.id.split("-")[0];
        closeChat(mentorId);
      }
    });
  });

  // Add listeners for profile view buttons
  document.querySelectorAll(".btn-outline").forEach((button) => {
    button.addEventListener("click", () => {
      const mentorId = button
        .closest(".mentor-card")
        .getAttribute("data-mentor-id");
      openProfile(mentorId);
    });
  });
}

/**
 * Open a chat interface with a specific mentor
 * @param {string} mentorId - ID of the mentor
 */
function openChat(mentorId) {
  // Hide the mentors list view
  document.getElementById("mentors-list-view").style.display = "none";

  // Show the specific chat container
  const chatContainer = document.getElementById(`${mentorId}-chat`);
  if (chatContainer) {
    chatContainer.style.display = "flex";

    // Load chat history if user is logged in
    const currentUser = getCurrentUser();
    if (currentUser) {
      const messagesContainer = document.getElementById(`${mentorId}-messages`);
      loadChatHistory(mentorId, currentUser.id, messagesContainer);
    }

    // Focus on input field
    const inputField = document.getElementById(`${mentorId}-input`);
    if (inputField) {
      inputField.focus();
    }
  }
}

/**
 * Close a chat interface
 * @param {string} mentorId - ID of the mentor
 */
function closeChat(mentorId) {
  // Hide the chat container
  const chatContainer = document.getElementById(`${mentorId}-chat`);
  if (chatContainer) {
    chatContainer.style.display = "none";
  }

  // Show the mentors list view
  document.getElementById("mentors-list-view").style.display = "block";
}

/**
 * Open a mentor's profile modal
 * @param {string} mentorId - ID of the mentor
 */
function openProfile(mentorId) {
  const profileModal = document.getElementById(`${mentorId}-profile-modal`);
  if (profileModal) {
    profileModal.style.display = "flex";
  }
}

/**
 * Close a mentor's profile modal
 * @param {string} mentorId - ID of the mentor
 */
function closeProfile(mentorId) {
  const profileModal = document.getElementById(`${mentorId}-profile-modal`);
  if (profileModal) {
    profileModal.style.display = "none";
  }
}

/**
 * Open profile and then switch to chat
 * @param {string} mentorId - ID of the mentor
 */
function closeProfileAndOpenChat(mentorId) {
  closeProfile(mentorId);
  openChat(mentorId);
}

/**
 * Get the current logged-in user
 * @returns {Object|null} User object or null if not logged in
 */
function getCurrentUser() {
  // Get user from supabase auth or session storage
  const user = supabase.auth.user();

  // If no user is logged in, try to get demo user from session storage
  if (!user) {
    const demoUser = sessionStorage.getItem("demoUser");
    return demoUser ? JSON.parse(demoUser) : null;
  }

  return user;
}

// Re-export the original app functions that are still needed
export {
  initMenteeQuiz,
  initMentorQuiz,
  initTagInputs,
  openChat,
  closeChat,
  openProfile,
  closeProfile,
  closeProfileAndOpenChat,
};
