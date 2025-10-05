// Settings configuration
const urlParams = new URLSearchParams(window.location.search);
const sbAddress = urlParams.get("address") || "127.0.0.1";
const sbPort = urlParams.get("port") || "8080";
const sbPassword = urlParams.get("password"); 

// Global variables
const streamerbot = "streamerbot";
const tikfinity = "tikfinity";
const widgetTitle = "MultiPoll Widget";
let sbClientConnected = false;
let tikfinityConnected = false;
let notifications = document.querySelector('.notifications');

// Poll state
let votes; // for 5 choices max
let pollTimer = null;      
let pollDuration = 0;  
let isPollActive = false;
let votedUsers = new Set();
let maxChoices = 5; // default, can be updated per poll

// Settings Page Listener
const channel = new BroadcastChannel('rexbordzPollWidget');

channel.onmessage = (e) => {
  console.log('📡 BroadcastChannel received data:', e.data);
  const data = e.data;
  if (data.choicesArray && data.choicesArray.length >= 2) {
    createPoll(data.choicesArray, data.title, data.duration);
    showPoll();
  }

  // If it's an action
  if (data.action === 'endPoll') endPoll();

  
  if (data.action === 'togglePoll') togglePoll();
  if (data.action === 'resetPoll') {
    // Cancel any pending auto-reset
    clearTimeout(pollTimer);

    // Perform the reset
    resetPoll();
  }
};

// Streamer.Bot setup
const sbClient = new StreamerbotClient({
  host: sbAddress,
  port: sbPort,
  password: sbPassword,

  onConnect: (data) => {
    if (!sbClientConnected){
      sbClientConnected = true;
      console.log(`✅ Streamer.bot Client connected to ${sbAddress}:${sbPort}`)
      console.debug(data);
      createToast('success', 'fa-solid fa-circle-check', widgetTitle, 'Connected to SB Client', streamerbot);
    }
  },

  onDisconnect: () => {
    if (sbClientConnected) {
      sbClientConnected = false;
      console.warn("❌ Streamer.bot Client disconnected");
      createToast('warning', 'fa-solid fa-triangle-exclamation', widgetTitle, 'Disconnected from SB Client', streamerbot);
    }  
  }
});

// ==========================
// Streamer.bot Event Handler
// ==========================
sbClient.on('Twitch.ChatMessage', (data) => {
  console.log('📢 New Twitch Chat:', data);
  const chat = data.data;
  onChatMessage(chat.user.login, chat.message.message);

});

sbClient.on('Kick.ChatMessage', (data) => {
  console.log('📢 New Kick Chat:', data);
  const chat = data.data;
  onChatMessage(chat.user.login, chat.text);

});

sbClient.on('YouTube.Message', (data) => {
  console.log('📢 New YouTube Chat:', data);
  const chat = data.data;
  onChatMessage(chat.user.name, chat.message);

});

// TikFinity setup
function connectTikFinity() {
  const socket = new WebSocket("ws://localhost:21213");

  socket.onopen = () => {
    if (!tikfinityConnected) {
      tikfinityConnected = true;
      console.log("✅ Connected to TikFinity");
      createToast('success', 'fa-solid fa-circle-check', widgetTitle, 'Connected to Tikfinity', tikfinity);
    }
  };

  socket.onclose = () => {
    if (tikfinityConnected) {
      tikfinityConnected = false;
      console.warn("❌ Disconnected from TikFinity");
      createToast('warning', 'fa-solid fa-triangle-exclamation', widgetTitle, 'Disconnected from Tikfinity', tikfinity);
    }
    setTimeout(connectTikFinity, 3000);
  };

  socket.onerror = (err) => {
    console.error("TikFinity WebSocket error:", err);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.event) {

        case "chat": {
          const chat = data.data;
          //console.log(`${chat.nickname || chat.uniqueId} ➝ ${chat.comment}`);
          onChatMessage(chat.uniqueId, chat.comment);
          break;
        }

        default:
          break;

      }
    } catch (err) {
      console.error("Failed to process TikFinity event:", err);
    }
  };
}

// Toast notifications for connections
function createToast(type, icon, title, text, source){
    let newToast = document.createElement('div');
    let logo;
    if (source === "streamerbot") {
        logo = 'assets/images/streamerbot-logo.png';
    } else if (source === "tikfinity") {
        logo = "assets/images/tikfinity-logo.png";
    }

    newToast.innerHTML = `
        <div class="toast ${type}">
            <i class="${icon}"></i>
            <div class="content">
                <div class="title">${title}</div>
                <span>${text}</span>
            </div>
            <img class="toast-logo" src="${logo}" alt="${source} logo">
        </div>`;
    notifications.appendChild(newToast);
    newToast.timeOut = setTimeout(
        ()=>newToast.remove(), 3000
    )
}
   

// Modified function to accept an array of choice objects
// Each object in choicesArray should have at least a `text` property
function createPoll(choicesArray, pollTitle = "Type number (1, 2...) in chat to vote", duration = pollDuration) {
  const numberOfChoices = choicesArray.length;

  votes = new Array(numberOfChoices).fill(0);
  pollDuration = duration;
  maxChoices = numberOfChoices; // update globally
  isPollActive = true;          // ✅ Poll is now live
  votedUsers.clear();           // ✅ Reset usernames

  // Update poll title dynamically
  const titleElement = document.querySelector(".poll-card .title");
  if (titleElement) {
    titleElement.textContent = pollTitle;
  }

  const choicesContainer = document.querySelector(".choices");
  choicesContainer.innerHTML = ""; // Clear existing choices

  const colors = ["blue", "red", "green", "yellow", "orange"];

  for (let i = 0; i < numberOfChoices; i++) {
    const choiceDiv = document.createElement("div");
    choiceDiv.className = "choice";

    // Use choice text from array, fallback to default
    const choiceText = choicesArray[i].text || `Choice ${i + 1}`;

    choiceDiv.innerHTML = `
      <div class="vote-key">${i + 1}</div>
      <div class="choice-main">
        <div class="choice-label">
          <div class="choice-text">${choiceText}</div>
          <div class="choice-right">
            <div class="votes">(0 votes)</div>
            <div class="percent">0%</div>
          </div>
        </div>
        <div class="gauge">
          <div class="gauge-fill ${colors[i]}"></div>
        </div>
      </div>
    `;

    choicesContainer.appendChild(choiceDiv);
  }

  // Reset votes array to match number of choices
  votes = new Array(numberOfChoices).fill(0);
  updatePoll();
  startPollTimer();

  // Execute Poll Created Bot Message SB Action
  const actionId = "3e52314f-28bd-4d86-b0e0-3b5d665d7860"
  const message = `POLL STARTED! • ${pollTitle}`;
  sendMessageToPlatforms(actionId, message);
}

function startPollTimer() {
  clearTimeout(pollTimer); // stop any previous auto-reset

  // Find or create overlay
  let overlay = document.querySelector(".poll-timer-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "poll-timer-overlay";
    document.querySelector(".poll-card").prepend(overlay);
  }

  // Reset overlay instantly
  overlay.style.transition = "none";
  overlay.style.width = "100%";

  // Force reflow so that transition applies correctly
  void overlay.offsetWidth;

  // Start smooth transition over the poll duration
  overlay.style.transition = `width ${pollDuration}s linear`;
  overlay.style.width = "0%";

  // Listen for transition end to highlight winner and auto-reset
  overlay.addEventListener("transitionend", function handler(event) {
    if (event.propertyName === "width") {
      endPoll(); // only call endPoll(), which will highlight the winner
      overlay.removeEventListener("transitionend", handler);
    }
  });
}

function castVote(choiceIndex) {
  votes[choiceIndex]++;

  const voteKey = document.querySelectorAll('.vote-key')[choiceIndex];
  const colors = ["flash-blue", "flash-red", "flash-green", "flash-yellow", "flash-orange"];

  // remove any previous flash
  voteKey.classList.remove(...colors);

  // trigger flash
  voteKey.classList.add(colors[choiceIndex]);

  // fade back after 300ms
  setTimeout(() => {
    voteKey.classList.remove(colors[choiceIndex]);
  }, 200);

  updatePoll();
}

function updatePoll() {
  const totalVotes = votes.reduce((a, b) => a + b, 0);

  if (totalVotes === 0) {
    // No votes → all 0%
    document.querySelectorAll(".choice").forEach(choice => {
      choice.querySelector(".percent").textContent = "0.0%";
      choice.querySelector(".gauge-fill").style.width = "0%";
      choice.querySelector(".votes").textContent = `(0 votes)`;
    });
    return;
  }

  document.querySelectorAll(".choice").forEach((choice, i) => {
    const voteCount = votes[i];
    const percent = (voteCount / totalVotes) * 100;

    // Round to 1 decimal point
    const roundedPercent = parseFloat(percent.toFixed(1));

    choice.querySelector(".percent").textContent = `${roundedPercent}%`;
    choice.querySelector(".gauge-fill").style.width = `${roundedPercent}%`;
    choice.querySelector(".votes").textContent = `(${voteCount} votes)`;
  });
}

function highlightWinner() {
  if (!votes || votes.length === 0) return;

  const maxVotes = Math.max(...votes);

  // find all indexes with that max (could be tie)
  const winners = votes
    .map((v, i) => v === maxVotes ? i : -1)
    .filter(i => i !== -1);

  const choices = document.querySelectorAll(".choice");

  // no votes or all tied → don’t highlight
  if (maxVotes === 0 || winners.length === votes.length) {
    choices.forEach(choice => choice.classList.remove("winner", "loser"));
    return;
  }

  // clear classes first
  choices.forEach(choice => choice.classList.remove("winner", "loser"));

  // highlight winners, mark others as losers
  choices.forEach((choice, i) => {
    if (winners.includes(i)) {
      choice.classList.add("winner");
    } else {
      choice.classList.add("loser");
    }
  });

  const actionId = "82f37eb4-454b-48c3-8218-2b1a1511d6cf";

  const winnerTexts = winners.map(i => 
    choices[i].querySelector(".choice-text")?.textContent.trim()
  ).filter(Boolean);

  const winnerTextsFormatted = winnerTexts.length > 1 
  ? winnerTexts.slice(0, -1).join(", ") + " and " + winnerTexts.slice(-1)
  : winnerTexts[0] || "";

  const winnerVotes = winners.map(i => 
    (choices[i].querySelector(".votes")?.textContent.trim() || "0 votes").replace(/[()]/g, "")
  );

  const winnerPercent = winners.map(i => 
    choices[i].querySelector(".percent")?.textContent.trim() || "0%"
  );

  let pollResults;

  if (maxVotes === 0) {
    // Nobody voted
    pollResults = "POLL RESULTS ARE HERE! • NOBODY VOTED. . . LOL";
  } else if (votes.length === 2 && votes[0] === votes[1]) {
    // Two-choice tie
    pollResults = "POLL RESULTS ARE HERE! • It's a TIE. GG";
  } else {
    // Normal winner(s)
    pollResults = `POLL RESULTS ARE HERE! • ${winnerTextsFormatted} with ${winnerVotes} (${winnerPercent}).`;
  }

  sendMessageToPlatforms(actionId, pollResults);
}

function onChatMessage(username, message) {
  if (!isPollActive) return;  // check if poll is currently active

  const vote = parseInt(message);
  if (!vote || vote < 1 || vote > maxChoices) return; // invalid vote

  if (votedUsers.has(username)) return; // user already voted

  castVote(vote - 1);
  votedUsers.add(username);
  console.log(`${username} voted ${message}`);
}

function showPoll() {
  document.getElementById("poll-widget").classList.remove("hidden");
}

function endPoll() {
  const overlay = document.querySelector(".poll-timer-overlay");

  if (votes && votes.some(v => v > 0)) {
    if (overlay) {
      // Remove existing transition to reset instantly
      overlay.style.transition = "none";
      overlay.style.width = getComputedStyle(overlay).width; // force current width

      // Force reflow so that next transition applies
      void overlay.offsetWidth;

      // Apply transition and collapse
      overlay.style.transition = "width 0.5s linear";
      overlay.style.width = "0%";
    }

    // Show winner immediately
    highlightWinner();
    channel.postMessage({ action: 'lockStartButton', lock: true });

    // Wait 8 seconds before calling resetPoll
    pollTimer = setTimeout(() => {
      resetPoll();
      // Unlock Start/End button
      channel.postMessage({ action: 'lockStartButton', lock: false });
    }, 8000);

  } else {
    resetPoll();
  }
}

function resetPoll() {
  clearTimeout(pollTimer);
  isPollActive = false;
  votedUsers.clear();

  const poll = document.getElementById("poll-widget");
  const choicesContainer = document.querySelector(".choices");

  // If already hidden, clear immediately
  if (poll.classList.contains("hidden")) {
    choicesContainer.innerHTML = "";
    votes = [];
    channel.postMessage({ action: 'pollState', isActive: false });
    return;
  }

  // Trigger fade out
  poll.classList.add("hidden");

  // Wait for fade to complete
  poll.addEventListener("transitionend", function handler(event) {
    if (event.propertyName === "opacity") {
      choicesContainer.innerHTML = "";
      votes = [];
      delete poll.dataset.autoReset;

      poll.removeEventListener("transitionend", handler);
      channel.postMessage({ action: 'pollState', isActive: false });
    }
  });
}

function togglePoll() {
  document.getElementById("poll-widget").classList.toggle("hidden");
}

function sendMessageToPlatforms(actionId, message) {
  sbClient.doAction(actionId, {"message" : message});
}


/*
document.addEventListener('keydown', (event) => {
    const key = event.key; // '1', '2', etc.
    if (key >= '1' && key <= '5') {
        const voteIndex = parseInt(key) - 1; // Subtract 1 for 0-based index
        castVote(voteIndex);
    }
});*/

connectTikFinity();
connectSbWebSocket();
