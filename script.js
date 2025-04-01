document.addEventListener('DOMContentLoaded', function() {
    // Check which page we're on
    const isMenteePage = document.body.contains(document.getElementById('mentee-quiz'));
    const isMentorPage = document.body.contains(document.getElementById('mentor-quiz'));
    const isHomePage = !isMenteePage && !isMentorPage;
  
    // Mentee page functionality
    if (isMenteePage) {
      initMenteeQuiz();
    }
  
    // Mentor page functionality
    if (isMentorPage) {
      initMentorQuiz();
    }
  
    // Initialize tag input functionality if present on page
    initTagInputs();
  });
  
  // Add Supabase client initialization
  const supabaseUrl = 'YOUR_SUPABASE_URL';
  const supabaseKey = 'YOUR_SUPABASE_KEY';
  const supabase = supabase.createClient(supabaseUrl, supabaseKey);
  
  // Mentee Quiz Initialization
  function initMenteeQuiz() {
    const totalSteps = 5;
    
    // Set total steps display
    document.getElementById('mentee-total-steps').textContent = totalSteps;
    
    // Next button handlers - one for each step
    for (let i = 1; i <= totalSteps; i++) {
      const nextBtn = document.getElementById(`mentee-next-${i}`);
      if (nextBtn) {
        nextBtn.addEventListener('click', function() {
          goToStep('mentee', i, i + 1);
        });
      }
    }
    
    // Previous button handlers
    for (let i = 2; i <= totalSteps; i++) {
      const prevBtn = document.getElementById(`mentee-prev-${i}`);
      if (prevBtn) {
        prevBtn.addEventListener('click', function() {
          goToStep('mentee', i, i - 1);
        });
      }
    }
    
    // Submit button
    const submitBtn = document.getElementById('mentee-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', function(e) {
        e.preventDefault();
        submitMenteeForm();
      });
    }
    
    // Done button redirects to home
    const doneBtn = document.getElementById('mentee-done');
    if (doneBtn) {
      doneBtn.addEventListener('click', function() {
        window.location.href = 'index.html';
      });
    }
    
    // Cancel button redirects to home
    const closeBtn = document.getElementById('mentee-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        window.location.href = 'index.html';
      });
    }
  }
  
  // Mentor Quiz Initialization
  function initMentorQuiz() {
    const totalSteps = 5;
    
    // Set total steps display
    document.getElementById('mentor-total-steps').textContent = totalSteps;
    
    // Next button handlers - one for each step
    for (let i = 1; i <= totalSteps; i++) {
      const nextBtn = document.getElementById(`mentor-next-${i}`);
      if (nextBtn) {
        nextBtn.addEventListener('click', function() {
          goToStep('mentor', i, i + 1);
        });
      }
    }
    
    // Previous button handlers
    for (let i = 2; i <= totalSteps; i++) {
      const prevBtn = document.getElementById(`mentor-prev-${i}`);
      if (prevBtn) {
        prevBtn.addEventListener('click', function() {
          goToStep('mentor', i, i - 1);
        });
      }
    }
    
    // Submit button
    const submitBtn = document.getElementById('mentor-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', function(e) {
        e.preventDefault();
        submitMentorForm();
      });
    }
    
    // Done button redirects to home
    const doneBtn = document.getElementById('mentor-done');
    if (doneBtn) {
      doneBtn.addEventListener('click', function() {
        window.location.href = 'index.html';
      });
    }
    
    // Cancel button redirects to home
    const closeBtn = document.getElementById('mentor-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        window.location.href = 'index.html';
      });
    }
  }
  
  // Utility function to navigate between quiz steps
  function goToStep(role, fromStep, toStep) {
    // Hide current step
    document.querySelector(`#${role}-quiz .quiz-step[data-step="${fromStep}"]`).classList.remove('active');
    
    // Show target step
    document.querySelector(`#${role}-quiz .quiz-step[data-step="${toStep}"]`).classList.add('active');
    
    // Update step counter
    const stepDisplay = document.getElementById(`${role}-current-step`);
    if (stepDisplay && toStep <= parseInt(document.getElementById(`${role}-total-steps`).textContent)) {
      stepDisplay.textContent = toStep;
    }
    
    // Update progress bar
    const progressBar = document.getElementById(`${role}-progress`);
    if (progressBar) {
      const totalSteps = parseInt(document.getElementById(`${role}-total-steps`).textContent);
      const percentage = (toStep / totalSteps) * 100;
      progressBar.style.width = `${percentage}%`;
    }
  }
  
  // Initialize tag input functionality
  function initTagInputs() {
    const tagInputs = [
      { inputId: 'mentee-languages-input', containerId: 'mentee-languages-tags', maxTags: 10 },
      { inputId: 'mentee-skills-input', containerId: 'mentee-skills-tags', maxTags: 5 },
      { inputId: 'mentee-interests-input', containerId: 'mentee-interests-tags', maxTags: 5 },
      { inputId: 'mentor-languages-input', containerId: 'mentor-languages-tags', maxTags: 10 },
      { inputId: 'mentor-skills-input', containerId: 'mentor-skills-tags', maxTags: 5 },
      { inputId: 'mentor-interests-input', containerId: 'mentor-interests-tags', maxTags: 5 }
    ];
    
    tagInputs.forEach(config => {
      const input = document.getElementById(config.inputId);
      const container = document.getElementById(config.containerId);
      
      if (input && container) {
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' && this.value.trim() !== '') {
            e.preventDefault();
            
            const tagsCount = container.querySelectorAll('.tag').length;
            if (tagsCount < config.maxTags) {
              const tag = document.createElement('div');
              tag.className = 'tag';
              tag.innerHTML = `${this.value.trim()} <span class="tag-remove">×</span>`;
              
              tag.querySelector('.tag-remove').addEventListener('click', function() {
                this.parentNode.remove();
              });
              
              container.appendChild(tag);
              this.value = '';
            } else {
              alert(`You can only add up to ${config.maxTags} items.`);
            }
          }
        });
      }
    });
  }
  
  // Mentee registration
  async function submitMenteeForm() {
    // Get form data from each step
    const name = document.getElementById('mentee-name').value;
    const email = document.getElementById('mentee-email').value;
    const age = parseInt(document.getElementById('mentee-age').value);
    const country = document.getElementById('mentee-origin').value.toLowerCase();
    const languages = Array.from(document.querySelectorAll('#mentee-languages-tags .tag'))
      .map(tag => tag.textContent.replace('×', '').trim());
    
    // ...collect all other fields...
    
    // Create mentee data object
    const menteeData = {
      name,
      email,
      age,
      country,
      speaking_languages: languages,
      desired_field: document.getElementById('mentee-field').value,
      stem_skills: Array.from(document.querySelectorAll('#mentee-skills-tags .tag'))
        .map(tag => tag.textContent.replace('×', '').trim()),
      interests: Array.from(document.querySelectorAll('#mentee-interests-tags .tag'))
        .map(tag => tag.textContent.replace('×', '').trim()),
      // Add other fields
    };
    
    try {
      // Insert into Supabase
      const { data, error } = await supabase
        .from('mentees')
        .insert([menteeData])
        .select();
      
      if (error) throw error;
      
      // Show success message
      console.log('Mentee created successfully:', data);
      const menteeId = data[0].id;
      
      // Call matching API endpoint
      requestMentorMatches(menteeId);
      
      // Show success step
      goToStep('mentee', 5, 6);
      
    } catch (error) {
      console.error('Error creating mentee:', error.message);
      alert('There was an error submitting your information. Please try again.');
    }
  }
  
  // Mentor registration (similar to mentee)
  async function submitMentorForm() {
    // Similar to mentee form but with mentor fields
    // ...
  }
  
  // Function to request mentor matches
  async function requestMentorMatches(menteeId) {
    try {
      // Call your API that runs the Python matching
      const response = await fetch(`/api/matching/mentee/${menteeId}`);
      const matchData = await response.json();
      
      // Store match data for display
      sessionStorage.setItem('mentorMatches', JSON.stringify(matchData));
      
    } catch (error) {
      console.error('Error finding matches:', error);
    }
  }