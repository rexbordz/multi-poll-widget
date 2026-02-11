// Create BroadcastChannel
const channel = new BroadcastChannel('rexbordzPollWidget');

// Select input elements
const pollTitleInput = document.querySelector('#poll-title');
const choiceInputs = document.querySelectorAll('.choice-input');
const durationDropdown = document.querySelector('#duration-dropdown');
const durationInput = document.querySelector('#duration-input');

let lastSelectedDuration = durationDropdown.value; // remember initial choice

durationDropdown.addEventListener('change', () => {
  // update the remembered choice whenever dropdown changes (but not when custom)
  if (durationDropdown.value !== 'custom') {
    lastSelectedDuration = durationDropdown.value;
  }
});

durationInput.addEventListener('input', () => {
  if (durationInput.value.trim() !== '') {
    durationDropdown.value = 'custom'; // reflect manual input
  } else {
    // revert to the last non-custom selection
    durationDropdown.value = lastSelectedDuration;
  }
});

// Select buttons
const startEndBtn = document.querySelector('#start-end-poll');
const endBtn = document.querySelector('#end-poll');
const toggleBtn = document.querySelector('#toggle-poll');
const resetBtn = document.querySelector('#reset-poll');

// === Persistent Form Storage ===
const inputGroups = document.querySelectorAll('.input-group input, .input-group select');

// Load saved values
inputGroups.forEach(field => {
  const savedValue = localStorage.getItem(`poll-${field.id || field.className}-${field.name || ''}-${[...field.parentElement.children].indexOf(field)}`);
  if (savedValue !== null) {
    field.value = savedValue;
  }
});

// Save values on change/input
inputGroups.forEach(field => {
  field.addEventListener('input', () => {
    localStorage.setItem(
      `poll-${field.id || field.className}-${field.name || ''}-${[...field.parentElement.children].indexOf(field)}`,
      field.value
    );
  });
});

/**
 * Collect all poll data and send via BroadcastChannel
 */
function sendPollData() {
  const title = pollTitleInput.value.trim() || undefined;

  const choicesArray = [];
  choiceInputs.forEach(input => {
    const text = input.value.trim();
    if (text) {
      choicesArray.push({ text });
    }
  });

  // Minimum 2 choices check
  if (choicesArray.length < 2) {
    alert('Please provide at least 2 choices.');
    return;
  }

  // Determine duration
  let duration = 0;
  if (durationInput.value) {
    duration = parseInt(durationInput.value);
    if (isNaN(duration) || duration < 0) duration = 0;
  } else {
    duration = parseInt(durationDropdown.value) || 0;
  }

  const pollData = {
    title: title,
    choicesArray: choicesArray,
    duration: duration
  };

  // Send JSON to widget
  channel.postMessage(pollData);
  console.log('Poll data sent:', pollData);

  startEndBtn.textContent = 'End Poll';
}

function startEndPoll() {
  // Use the ID so we don't accidentally pick the Title or Duration groups
  const choicesGroup = document.querySelector('#choices-group');

  if (startEndBtn.textContent === 'Start Poll') {
    // Reset data graphics
    const gauges = document.querySelectorAll('.gauge-fill.config-page');
    gauges.forEach(g => {
      g.style.transition = 'none'; // Snap to 0
      g.style.width = '0%';
    });

    // Force reflow
    void choicesGroup.offsetWidth;

    // Re-enable transition for the new poll
    gauges.forEach(g => {
      g.style.transition = 'width 0.5s ease';
    });

    // Input validation
    const requiredInputs = document.querySelectorAll('.choice-input[required]');
    const allFilled = Array.from(requiredInputs).every(input => input.value.trim() !== '');

    if (!allFilled) return;

    sendPollData();
    
    // This will now correctly trigger the CSS for the choices!
    choicesGroup.classList.add('poll-active'); 
    
    startEndBtn.textContent = 'End Poll';
    startEndBtn.style.backgroundColor = '#af221dff';
  } else {
    
    channel.postMessage({ action: 'endPoll' }); 
    
    // LOCK the button so they can't restart until the 8s reset is done
    startEndBtn.disabled = true;
    startEndBtn.textContent = 'Showing Results...';
    startEndBtn.style.opacity = "0.5";
    startEndBtn.style.cursor = "not-allowed";
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Button event listeners
 */
startEndBtn.addEventListener('click', startEndPoll);

toggleBtn.addEventListener('click', () => {
  channel.postMessage({ action: 'togglePoll' });
});

resetBtn.addEventListener('click', () => {
  channel.postMessage({ action: 'resetPoll' });
  
  const timeDisplay = document.querySelector('.time-remaining');
  if (timeDisplay) {
    timeDisplay.textContent = "";
    timeDisplay.style.display = "none";
  }

  localStorage.clear(); 
  
  // Give the broadcast 100ms to "fly" before killing the page
  setTimeout(() => {
    location.reload();
  }, 100);
});


/**
 * Broadcast event listeners
 */

channel.onmessage = (e) => {
  const data = e.data;

  // --- Live Sync Logic ---
  if (data.action === 'liveStatsUpdate' && data.stats) {
    const containers = document.querySelectorAll('.choice-container');
    
    data.stats.forEach((stat, i) => {
      // Ensure we have a matching container in the settings UI
      const container = containers[i];
      if (container) {
        const votesEl = container.querySelector('.votes');
        const percentEl = container.querySelector('.percent');
        const gaugeEl = container.querySelector('.gauge-fill');

        const votePluralized = stat.votes !== 1 ? "votes" : "vote";
        if (votesEl) votesEl.textContent = `${stat.votes} ${votePluralized}`;
        if (percentEl) percentEl.textContent = `${stat.percent}%`;
        if (gaugeEl) gaugeEl.style.width = `${stat.percent}%`;
      }
    });
  }

  // HIGHLIGHT WINNER (Automatic or Manual)
  if (data.action === 'highlightWinner') {
    const choicesGroup = document.querySelector('#choices-group');
    const containers = document.querySelectorAll('.choice-container');
    
    // Count how many choices were actually part of the poll (not empty)
    const activeChoicesCount = Array.from(document.querySelectorAll('.choice-input'))
                                    .filter(input => input.value.trim() !== "").length;

    choicesGroup.classList.add('poll-active');

    // GLOBAL TIE CHECK: 
    // No highlight if EVERY active choice is a winner (Global Tie) OR nobody voted.
    const isGlobalTie = data.winners.length === activeChoicesCount || data.maxVotes === 0;

    containers.forEach((container, i) => {
      container.classList.remove('winner', 'loser');

      if (!isGlobalTie) {
        if (data.winners.includes(i)) {
          container.classList.add('winner');
        } else {
          // Only mark as loser if the input isn't empty (part of the active group)
          if (container.querySelector('.choice-input').value.trim() !== "") {
            container.classList.add('loser');
          }
        }
      }
    });

    // LOCK BUTTON: Sync the button UI even if the timer ended it
    startEndBtn.disabled = true;
    startEndBtn.textContent = 'Closing Poll...';
    startEndBtn.style.opacity = "0.5";
    startEndBtn.style.cursor = "not-allowed";
    startEndBtn.style.backgroundColor = '#af221dff'; 
  }

  // Timer Update
  if (data.action === 'timerTick') {
    const timeDisplay = document.querySelector('.time-remaining');
    if (!timeDisplay) return;

    if (data.time === 'permanent' || data.time === '' || data.time === null) {
      timeDisplay.style.display = 'none'; // Hide for permanent or resets
      timeDisplay.textContent = "";
    } else if (data.time === 'ended') {
      timeDisplay.style.display = 'block';
      timeDisplay.textContent = "Poll Ended!";
    } else {
      timeDisplay.style.display = 'block';
      timeDisplay.textContent = `Time Left: ${formatTime(data.time)}`;
    }
  }


  // RESET (Poll State false)
  if (data.action === 'pollState' && data.isActive === false) {
    const choicesGroup = document.querySelector('#choices-group');
    choicesGroup.classList.remove('poll-active');
    
    document.querySelectorAll('.choice-container').forEach(c => {
      c.classList.remove('winner', 'loser');
      const g = c.querySelector('.gauge-fill');
      if (g) g.style.width = "0%";
    });

    const timeDisplay = document.querySelector('.time-remaining');
    if (timeDisplay) {
      timeDisplay.textContent = "";
      timeDisplay.style.display = "none";
    }

    // UNLOCK BUTTON
    startEndBtn.disabled = false;
    startEndBtn.textContent = 'Start Poll';
    startEndBtn.style.backgroundColor = '#284cb8';
    startEndBtn.style.opacity = "1";
    startEndBtn.style.cursor = "pointer";
  }


  if (data.action === 'lockStartButton') {
    startEndBtn.disabled = data.lock;
    startEndBtn.style.opacity = data.lock ? 0.5 : 1; // optional visual cue
    startEndBtn.style.cursor = data.lock ? 'not-allowed' : 'pointer';
  }

  if (data.action === 'reloadPage') {
    localStorage.clear();
    location.reload();
  }

  if (data.action === 'startEndBtn') {
    startEndPoll(); 
  }

  if (data.action === 'syncRequeue') {
    // Fill the inputs so the UI matches the actual poll
    pollTitleInput.value = data.title;
    
    const inputs = document.querySelectorAll('.choice-input');
    data.choicesArray.forEach((choice, i) => {
      if (inputs[i]) inputs[i].value = choice.text;
    });

    // Sync Duration UI
    const incomingDuration = String(data.duration); // Ensure string for comparison
    
    // Check if the duration exists as an option in the dropdown
    const hasMatch = Array.from(durationDropdown.options).some(opt => opt.value === incomingDuration);

    if (hasMatch) {
      durationDropdown.value = incomingDuration;
      durationInput.value = ""; // Clear manual input since it's a standard option
      lastSelectedDuration = incomingDuration; // Update your "remembered" choice
    } else {
      durationDropdown.value = 'custom';
      durationInput.value = incomingDuration;
      // lastSelectedDuration stays as it was (e.g., 60) so it can revert later
    }

    // Update the button visuals without re-triggering the 'Start' logic
    document.querySelector('#choices-group')?.classList.add('poll-active');
    startEndBtn.textContent = 'End Poll';
    startEndBtn.style.backgroundColor = '#af221dff';
    startEndBtn.disabled = false;
    startEndBtn.style.opacity = "1";
    startEndBtn.style.cursor = "pointer";
  }
};



