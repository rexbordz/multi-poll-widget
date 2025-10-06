// Create BroadcastChannel
const channel = new BroadcastChannel('rexbordzPollWidget');

// Select input elements
const pollTitleInput = document.querySelector('#poll-title');
const choiceInputs = document.querySelectorAll('.choice-input');
const durationDropdown = document.querySelector('#duration-dropdown');
const durationInput = document.querySelector('#duration-input');

durationInput.addEventListener('input', () => {
  if (durationInput.value.trim() !== '') {
    durationDropdown.value = 'custom'; // reflect manual input
  } else {
    // reset dropdown to its previous selected value if manual input cleared
    durationDropdown.value = '30'; // or your default
  }
});

// Select buttons
const startEndBtn = document.querySelector('#start-end-poll');
const endBtn = document.querySelector('#end-poll');
const toggleBtn = document.querySelector('#toggle-poll');
const resetBtn = document.querySelector('#reset-poll');

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
  // Send resetPoll action
  channel.postMessage({ action: 'resetPoll' });
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
    location.reload();
  }

  if (data.action === 'startEndBtn') {
    startEndPoll(); 
  }
  
};



