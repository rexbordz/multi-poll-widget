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
  if (startEndBtn.textContent === 'Start Poll') {
    // Get the first two required inputs
    const requiredInputs = document.querySelectorAll('.choice-input[required]');
    const allFilled = Array.from(requiredInputs).every(input => input.value.trim() !== '');

    if (!allFilled) {
      return;
    }

    sendPollData();
    startEndBtn.textContent = 'End Poll';
    startEndBtn.style.backgroundColor = '#af221dff'; // red when ending
  } else {
    channel.postMessage({ action: 'endPoll' }); // you might keep this only for local clicks
    startEndBtn.textContent = 'Start Poll';
    startEndBtn.style.backgroundColor = '#284cb8'; // blue when starting
  }
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
  localStorage.clear(); // clear saved form data too
  location.reload();
});

/**
 * Broadcast event listeners
 */

// Optional: reset button when poll ends automatically
channel.onmessage = (e) => {
  const data = e.data;
  if ((data.action === 'pollState' && data.isActive === false)) {
    startEndBtn.textContent = 'Start Poll';
    startEndBtn.style.backgroundColor = '#284cb8'; // reset color
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
  
};



