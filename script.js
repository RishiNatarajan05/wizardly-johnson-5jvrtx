// Import the Perplexity chat generation function
import { generatePerplexityResponse } from "./perplexity-chat.js";

// Supabase client initialization
const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseKey = "YOUR_SUPABASE_KEY";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", function () {
  const isMenteePage = document.body.contains(
    document.getElementById("mentee-quiz")
  );
  const isMentorPage = document.body.contains(
    document.getElementById("mentor-quiz")
  );
  const isHomePage = !isMenteePage && !isMentorPage;

  if (isMenteePage) initMenteeQuiz();
  if (isMentorPage) initMentorQuiz();

  initTagInputs();

  // Initialize chat-related functionality
  const chatContainers = document.querySelectorAll(".chat-container");
  if (chatContainers.length > 0) {
    initChatFunctionality();
  }
});

// Mentee Quiz Initialization
function initMenteeQuiz() {
  const totalSteps = 5;
  document.getElementById("mentee-total-steps").textContent = totalSteps;

  for (let i = 1; i <= totalSteps; i++) {
    const nextBtn = document.getElementById(`mentee-next-${i}`);
    if (nextBtn) {
      nextBtn.addEventListener("click", () => goToStep("mentee", i, i + 1));
    }
  }

  for (let i = 2; i <= totalSteps; i++) {
    const prevBtn = document.getElementById(`mentee-prev-${i}`);
    if (prevBtn) {
      prevBtn.addEventListener("click", () => goToStep("mentee", i, i - 1));
    }
  }

  document.getElementById("mentee-submit")?.addEventListener("click", (e) => {
    e.preventDefault();
    submitMenteeForm();
  });

  document.getElementById("mentee-done")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  document.getElementById("mentee-close")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

// Mentor Quiz Initialization
function initMentorQuiz() {
  const totalSteps = 5;
  document.getElementById("mentor-total-steps").textContent = totalSteps;

  for (let i = 1; i <= totalSteps; i++) {
    const nextBtn = document.getElementById(`mentor-next-${i}`);
    if (nextBtn) {
      nextBtn.addEventListener("click", () => goToStep("mentor", i, i + 1));
    }
  }

  for (let i = 2; i <= totalSteps; i++) {
    const prevBtn = document.getElementById(`mentor-prev-${i}`);
    if (prevBtn) {
      prevBtn.addEventListener("click", () => goToStep("mentor", i, i - 1));
    }
  }

  document.getElementById("mentor-submit")?.addEventListener("click", (e) => {
    e.preventDefault();
    submitMentorForm();
  });

  document.getElementById("mentor-done")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  document.getElementById("mentor-close")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

// Navigate between quiz steps
function goToStep(role, fromStep, toStep) {
  document
    .querySelector(`#${role}-quiz .quiz-step[data-step="${fromStep}"]`)
    ?.classList.remove("active");
  document
    .querySelector(`#${role}-quiz .quiz-step[data-step="${toStep}"]`)
    ?.classList.add("active");

  const stepDisplay = document.getElementById(`${role}-current-step`);
  const totalSteps = parseInt(
    document.getElementById(`${role}-total-steps`).textContent
  );
  if (stepDisplay && toStep <= totalSteps) {
    stepDisplay.textContent = toStep;
  }

  const progressBar = document.getElementById(`${role}-progress`);
  if (progressBar) {
    const percentage = (toStep / totalSteps) * 100;
    progressBar.style.width = `${percentage}%`;
  }
}

// Tag input functionality
function initTagInputs() {
  const tagInputs = [
    {
      inputId: "mentee-languages-input",
      containerId: "mentee-languages-tags",
      maxTags: 10,
    },
    {
      inputId: "mentee-skills-input",
      containerId: "mentee-skills-tags",
      maxTags: 5,
    },
    {
      inputId: "mentee-interests-input",
      containerId: "mentee-interests-tags",
      maxTags: 5,
    },
    {
      inputId: "mentor-languages-input",
      containerId: "mentor-languages-tags",
      maxTags: 10,
    },
    {
      inputId: "mentor-skills-input",
      containerId: "mentor-skills-tags",
      maxTags: 5,
    },
    {
      inputId: "mentor-interests-input",
      containerId: "mentor-interests-tags",
      maxTags: 5,
    },
  ];

  tagInputs.forEach((config) => {
    const input = document.getElementById(config.inputId);
    const container = document.getElementById(config.containerId);

    if (input && container) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && this.value.trim() !== "") {
          e.preventDefault();
          const tagsCount = container.querySelectorAll(".tag").length;
          if (tagsCount < config.maxTags) {
            const tag = document.createElement("div");
            tag.className = "tag";
            tag.innerHTML = `${this.value.trim()} <span class="tag-remove">×</span>`;
            tag
              .querySelector(".tag-remove")
              .addEventListener("click", function () {
                this.parentNode.remove();
              });
            container.appendChild(tag);
            this.value = "";
          } else {
            alert(`You can only add up to ${config.maxTags} items.`);
          }
        }
      });
    }
  });
}

// Submit mentee form
async function submitMenteeForm() {
  const name = document.getElementById("mentee-name").value;
  const email = document.getElementById("mentee-email").value;
  const age = parseInt(document.getElementById("mentee-age").value);
  const country = document.getElementById("mentee-origin").value.toLowerCase();
  const languages = Array.from(
    document.querySelectorAll("#mentee-languages-tags .tag")
  ).map((tag) => tag.textContent.replace("×", "").trim());

  const menteeData = {
    name,
    email,
    age,
    country,
    speaking_languages: languages,
    desired_field: document.getElementById("mentee-field").value,
    stem_skills: Array.from(
      document.querySelectorAll("#mentee-skills-tags .tag")
    ).map((tag) => tag.textContent.replace("×", "").trim()),
    interests: Array.from(
      document.querySelectorAll("#mentee-interests-tags .tag")
    ).map((tag) => tag.textContent.replace("×", "").trim()),
  };

  try {
    const { data, error } = await supabase
      .from("mentees")
      .insert([menteeData])
      .select();

    if (error) throw error;

    console.log("Mentee created successfully:", data);
    const menteeId = data[0].id;

    sessionStorage.setItem(
      "demoUser",
      JSON.stringify({
        id: menteeId,
        name,
        role: "mentee",
      })
    );

    requestMentorMatches(menteeId);
    goToStep("mentee", 5, 6);
  } catch (error) {
    console.error("Error creating mentee:", error.message);
    alert("There was an error submitting your information. Please try again.");
  }
}

// Submit mentor form
async function submitMentorForm() {
  const name = document.getElementById("mentor-name").value;
  const email = document.getElementById("mentor-email").value;
  const age = parseInt(document.getElementById("mentor-age").value);
  const country = document.getElementById("mentor-origin").value.toLowerCase();
  const languages = Array.from(
    document.querySelectorAll("#mentor-languages-tags .tag")
  ).map((tag) => tag.textContent.replace("×", "").trim());

  const mentorData = {
    name,
    email,
    age,
    country,
    speaking_language: languages.join(" "),
    field: document.getElementById("mentor-field").value,
    stem_skills: Array.from(
      document.querySelectorAll("#mentor-skills-tags .tag")
    ).map((tag) => tag.textContent.replace("×", "").trim()),
    interests: Array.from(
      document.querySelectorAll("#mentor-interests-tags .tag")
    ).map((tag) => tag.textContent.replace("×", "").trim()),
    work_experience: document.getElementById("mentor-motivation").value,
  };

  try {
    const { data, error } = await supabase
      .from("mentors")
      .insert([mentorData])
      .select();

    if (error) throw error;

    console.log("Mentor created successfully:", data);
    const mentorId = data[0].id;

    sessionStorage.setItem(
      "demoUser",
      JSON.stringify({
        id: mentorId,
        name,
        role: "mentor",
      })
    );

    // Optional: requestMenteeMatches(mentorId); if implemented

    goToStep("mentor", 5, 6);
  } catch (error) {
    console.error("Error creating mentor:", error.message);
    alert("There was an error submitting your information. Please try again.");
  }
}

// Chat Functionality Initialization
function initChatFunctionality() {
  const sendButtons = document.querySelectorAll(".chat-input button");
  const inputFields = document.querySelectorAll(".chat-input input");

  sendButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const mentorId = this.closest(".chat-container").id.split("-")[0];
      sendMessage(mentorId);
    });
  });

  inputFields.forEach((input) => {
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        const mentorId = this.closest(".chat-container").id.split("-")[0];
        sendMessage(mentorId);
      }
    });
  });
}

// Send Message Function
async function sendMessage(partnerId) {
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
    // Determine the role of the current user from session storage
    const currentUser = getCurrentUser();
    const role = currentUser ? currentUser.role : "mentee";

    // Generate response using Perplexity API
    const response = await generatePerplexityResponse(message, partnerId, role);

    // Remove typing indicator
    hideTypingIndicator(partnerId);

    // Add AI response to chat
    messagesContainer.innerHTML += `
      <div class="message message-received">
        <div class="message-text">${escapeHtml(response)}</div>
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

// Utility function to escape HTML to prevent XSS
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Retrieve current user from session storage
function getCurrentUser() {
  const userJson = sessionStorage.getItem("demoUser");
  return userJson ? JSON.parse(userJson) : null;
}

// Typing indicator functions
function showTypingIndicator(partnerId) {
  const indicator = document.getElementById(`${partnerId}-typing`);
  if (indicator) {
    indicator.style.display = "flex";
  }
}

function hideTypingIndicator(partnerId) {
  const indicator = document.getElementById(`${partnerId}-typing`);
  if (indicator) {
    indicator.style.display = "none";
  }
}

function scrollToBottom(container) {
  container.scrollTop = container.scrollHeight;
}

// Utility function to request mentor matches after mentee registration
async function requestMentorMatches(menteeId) {
  try {
    const response = await fetch(`/api/matches/${menteeId}`, {
      method: "POST",
    });
    const matchData = await response.json();

    // Store match data in session storage for later use
    sessionStorage.setItem("mentorMatches", JSON.stringify(matchData));

    // Redirect to matches page
    window.location.href = "matches.html";
  } catch (error) {
    console.error("Error requesting mentor matches:", error);
    alert("Unable to find mentor matches.  try again later.");
  }
}

export { sendMessage, getCurrentUser, requestMentorMatches };
