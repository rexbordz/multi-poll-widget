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
const BotMessageActionId = "3e52314f-28bd-4d86-b0e0-3b5d665d7860";

// Global Poll Variable
let votes; // for 5 choices max
let pollTimer = null;      
let countdownInterval;
let pollDuration = 0; // default, can be updated per poll 
let isPollActive = false;
let votedUsers = new Map();
let maxChoices = 5; // default, can be updated per poll
let pollSessionId = 0;
let currentPollTitle = "";
let currentPollChoices = [];
let requeuedAction = false;

// Settings Page Listener
const channel = new BroadcastChannel('rexbordzPollWidget');

channel.onmessage = (e) => {
  console.debug('📡 BroadcastChannel received data:', e.data);
  const data = e.data;

  // 1. Check for Poll Creation
  if (data.choicesArray && data.choicesArray.length >= 2) {
    createPoll(data.choicesArray, data.title, data.duration);
    showPoll();
  }

  // 2. Handle Actions - ADD clearInterval here to kill the zombie timer instantly
  if (data.action === 'endPoll' || data.action === 'resetPoll') {
    // Kill the MM:SS timer immediately before doing anything else
    clearInterval(countdownInterval); 
    
    if (data.action === 'endPoll') endPoll();
    if (data.action === 'resetPoll') resetPoll();
  }

  if (data.action === 'togglePoll') togglePoll();
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
sbClient.on('Twitch.ChatMessage', (response) => {
  console.debug('📢 New Twitch Chat:', response);
  const chat = response.data;
  const platform = response.event.source;
  onChatMessage(chat.user.login, chat.message.message, platform);
});

sbClient.on('Kick.ChatMessage', (response) => {
  console.debug('📢 New Kick Chat:', response);
  const chat = response.data;
  const platform = response.event.source;
  onChatMessage(chat.user.login, chat.text, platform);
});

sbClient.on('YouTube.Message', (response) => {
  console.debug('📢 New YouTube Chat:', response);
  const chat = response.data;
  const platform = response.event.source;
  onChatMessage(chat.user.name, chat.message, platform);
});

sbClient.on('Raw.Action', (response) => {
  console.debug('📢 Action Executed:', response);
  const actionId = response.data.actionId;
  const data = response.data;
  
  switch (actionId) {
    case "8413040f-ee21-439d-be53-b44f55d35998":
      console.debug("Action Executed: MultiPoll Widget • [Trigger] Clear");
      resetPoll();
      channel.postMessage({ action: 'reloadPage' });
      break;

    case "e14a127f-34f6-4091-ba06-a1eb4d387564":
      console.debug("Action Executed: MultiPoll Widget • [Trigger] Start/End Poll");
      channel.postMessage({ action: 'startEndBtn' });
      break;

    case "705bae3a-36f1-4f42-9bb1-110c8bc5feb7":
      console.debug("Action Executed: MultiPoll Widget • [Trigger] Toggle Poll ");
      togglePoll();
      break;

    case "4c16514d-8672-4c36-823e-ce11219a3bdb":
      console.debug("Action Executed: MultiPoll Widget • Poll Started", data);
      const args = data.arguments;
      if (!args.requeuedAction) { 
        return;
      }
      
      requeuedAction = true;
      let parsedChoices = [];
      try {
        // If it's a string, parse it. If it's somehow already an object, use it.
        parsedChoices = typeof args.choicesArray === 'string' 
          ? JSON.parse(args.choicesArray) 
          : args.choicesArray;
      } catch (e) {
        console.error("Failed to parse choicesArray:", e);
        parsedChoices = []; 
      }

      createPoll(parsedChoices, args.pollTitle, args.pollDuration);
      showPoll();

      // ⚡ BROADCAST TO SETTINGS.JS
      // We send a new action 'syncRequeue' so settings.js knows to update its inputs
      channel.postMessage({
        action: 'syncRequeue',
        title: args.pollTitle,
        choicesArray: parsedChoices,
        duration: args.pollDuration
      });
      break;

    default:
      console.debug("Action ID not recognized");
      break;
  }
});

// TikFinity setup
function connectTikfinity() {
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
    setTimeout(connectTikfinity, 3000);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.event) {

        case "chat": {
          const chat = data.data;
          onChatMessage(chat.uniqueId, chat.comment, "TikTok");
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

document.addEventListener('DOMContentLoaded', connectTikfinity);

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
  pollSessionId++;

  currentPollTitle = pollTitle;
  currentPollChoices = choicesArray; 
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

  const colors = ["choice-1", "choice-2", "choice-3", "choice-4", "choice-5"];

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

  // 🔹 FIX: Only start the timer if duration is NOT "permanent"
  if (duration !== "permanent" && duration > 0) {
    startPollTimer();
  } else {
    // Optional: Explicitly hide the timer element if it exists in your UI
    const timerDisplay = document.querySelector(".time-remaining");
    if (timerDisplay) timerDisplay.textContent = ""; 
  }

  // Run Streamer.bot Action: MultiPoll Widget • Poll Started
  // Send the args below as well
  const choices = Array.isArray(choicesArray) 
    ? choicesArray.map(c => c.text || c.value || "") 
    : [];

  let args = {
    "pollTitle": pollTitle,
    "pollDuration": duration,
    "numChoices": numberOfChoices,
    "choicesArray": JSON.stringify(choicesArray),
  };

  args = addChoicesToArgs(args, choicesArray);

  if (!requeuedAction) {
    sbClient.doAction("4c16514d-8672-4c36-823e-ce11219a3bdb", args);
  }
  
}

function startPollTimer() {
  clearTimeout(pollTimer); // stop any previous auto-reset
  clearInterval(countdownInterval); // Clear any existing timer first!

  let secondsLeft = pollDuration;

  if (pollDuration === 0) {
    channel.postMessage({ action: 'timerTick', time: 'permanent' });
    return; 
  }

  countdownInterval = setInterval(() => {
    secondsLeft--;
    
    if (secondsLeft <= 0) {
      clearInterval(countdownInterval);
      channel.postMessage({ action: 'timerTick', time: 'ended' });
    } else {
      channel.postMessage({ action: 'timerTick', time: secondsLeft });
    }
  }, 1000);

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

  const sessionAtStart = pollSessionId;

  const handler = (event) => {
    if (event.propertyName !== "width") return;

    // ❌ Old poll — ignore completely
    if (sessionAtStart !== pollSessionId) return;

    if (pollDuration !== 0) {
      highlightWinner();
      isPollActive = false;
    }

    pollTimer = setTimeout(() => {
      if (sessionAtStart === pollSessionId) {
        resetPoll();
      }
    }, 8000);
  };

  overlay.addEventListener("transitionend", handler, { once: true });

}

function castVote(choiceIndex) {
  
  votes[choiceIndex]++;

  const voteKey = document.querySelectorAll('.vote-key')[choiceIndex];
  const colors = ["flash-choice-1", "flash-choice-2", "flash-choice-3", "flash-choice-4", "flash-choice-5"];

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
  const pollStats = []; // 1. Array to hold data for settings.js

  // Handle No Votes (0.0% State)
  if (totalVotes === 0) {
    document.querySelectorAll(".choice").forEach((choice, i) => {
      choice.querySelector(".percent").textContent = "0.0%";
      choice.querySelector(".gauge-fill").style.width = "0%";
      choice.querySelector(".votes").textContent = `(0 votes)`;
      
      // 2. Add 0% data to the sync array
      pollStats.push({ index: i, votes: 0, percent: 0 });
    });
    
    // 3. Broadcast empty state to settings
    channel.postMessage({ action: 'liveStatsUpdate', stats: pollStats });
    return;
  }

  // Handle Active Votes
  document.querySelectorAll(".choice").forEach((choice, i) => {
    const voteCount = votes[i];
    const percent = (voteCount / totalVotes) * 100;
    const roundedPercent = parseFloat(percent.toFixed(1));

    choice.querySelector(".percent").textContent = `${roundedPercent}%`;
    choice.querySelector(".gauge-fill").style.width = `${roundedPercent}%`;
    const votePluralized = voteCount !== 1 ? "votes" : "vote";
    choice.querySelector(".votes").textContent = `(${voteCount} ${votePluralized})`;

    // 4. Add live data to the sync array
    pollStats.push({
      index: i,
      votes: voteCount,
      percent: roundedPercent
    });
  });

  // 5. Broadcast live results to settings.js
  channel.postMessage({
    action: 'liveStatsUpdate',
    stats: pollStats
  });
}


function highlightWinner() {
  let pollResults = "";
  let winners = []; 
  let maxVotes = 0;
  let winnerArray = [];
  let voteCount = 0;
  let winnerPercent = "0%";

  const choices = document.querySelectorAll(".choice");

  if (!votes || votes.length === 0 || Math.max(...votes) === 0) {
    pollResults = "NOBODY voted. . . LOL";
  } else {
    maxVotes = Math.max(...votes);
    winners = votes
      .map((v, i) => v === maxVotes ? i : -1)
      .filter(i => i !== -1);

    choices.forEach(choice => choice.classList.remove("winner", "loser"));

    if (winners.length === votes.length) {
      pollResults = "It's a TIE. GG";
    } else {
      choices.forEach((choice, i) => {
        if (winners.includes(i)) choice.classList.add("winner");
        else choice.classList.add("loser");
      });

      // --- CLEAN WINNER ARRAY LOGIC ---
      winnerArray = winners.map(i => {
        const text = choices[i].querySelector(".choice-text")?.textContent || "";
        return text.replace(/[^a-zA-Z0-9 ]/g, "").trim();
      }).filter(Boolean);

      // Create a formatted string for the pollResults message
      const winnerTextFormatted = winnerArray.length > 1
        ? winnerArray.slice(0, -1).join(", ") + " and " + winnerArray.slice(-1)
        : winnerArray[0] || "";

      let rawVotes = (choices[winners[0]]?.querySelector(".votes")?.textContent.trim() || "0").replace(/[()]/g, "");
      winnerPercent = choices[winners[0]]?.querySelector(".percent")?.textContent.trim() || "0%";
      voteCount = parseInt(rawVotes, 10);
      
      const voteLabel = voteCount === 1 ? "vote" : "votes";
      pollResults = `${winnerTextFormatted} with ${voteCount} ${voteLabel} (${winnerPercent}).`;
    }
  }

  const totalVotes = votes.reduce((sum, current) => sum + current, 0);

  // Start with the "Header" info
  let args = {
    "pollTitle": currentPollTitle,
    "pollDuration": pollDuration,
    "choicesArray": JSON.stringify(currentPollChoices), // Stringify here for the Bot
  };

  // Inject choices0, choices1, etc. RIGHT HERE
  // This ensures they follow choicesArray in the object key order
  args = addChoicesToArgs(args, currentPollChoices);

  // 3. Add the "Results" data to the end of the object
  Object.assign(args, {
    "winner": winnerArray.join(", "),
    "numVotes": voteCount,
    "percent": winnerPercent,
    "pollResults": pollResults,
    "totalVotes": totalVotes,
  });

  sbClient.doAction("e5a8fac6-f58e-4344-88eb-9bd13be4ab2e", args);

  // 3. Send the winner to config page (The Handshake)
  channel.postMessage({
    action: 'highlightWinner',
    winners: winners, 
    maxVotes: maxVotes
  });
}


function onChatMessage(username, message, platform) {
  if (!isPollActive) return; // check if poll is currently active

  const vote = parseInt(message);
  if (!vote || vote < 1 || vote > maxChoices) return; // invalid vote

  // Ensure there's a Set for this platform
  if (!votedUsers.has(platform)) {
    votedUsers.set(platform, new Set());
  }

  const platformVoters = votedUsers.get(platform);

  if (platformVoters.has(username)) return; // user already voted on this platform

  castVote(vote - 1);
  platformVoters.add(username);
  console.debug(`${username} (${platform}) voted ${message}`);
}

/**
 * Utility to flatten an array into choice0, choice1, etc. keys in an object
 */
function addChoicesToArgs(targetArgs, choiceList) {
  if (!Array.isArray(choiceList)) return targetArgs;
  
  choiceList.forEach((choice, index) => {
    // If choice is an object {text: '...'}, get the text. Otherwise, use it directly.
    const choiceText = typeof choice === 'object' ? choice.text : choice;
    targetArgs[`choice${index}`] = choiceText;
  });
  
  return targetArgs;
}

function sendMessageToPlatforms(actionId, message) {
  sbClient.doAction(actionId, {"message" : message});
}

function showPoll() {
  document.getElementById("poll-widget").classList.remove("hidden");
}

function endPoll() {
  const overlay = document.querySelector(".poll-timer-overlay");

  // STOP THE CLOCK
  clearInterval(countdownInterval);
  
  channel.postMessage({ action: 'timerTick', time: 'ended' });
  
  if (votes && votes.some(v => v > 0)) {
    if (overlay) {
      overlay.style.transition = "none";
      overlay.style.width = getComputedStyle(overlay).width;
      void overlay.offsetWidth;
      overlay.style.transition = "width 0.5s linear";
      overlay.style.width = "0%";
    }

    highlightWinner();
    
    channel.postMessage({ action: 'lockStartButton', lock: true });

    const sessionAtEnd = pollSessionId;

    pollTimer = setTimeout(() => {
      if (sessionAtEnd !== pollSessionId) {
        console.warn("[POLL] Ignored stale endPoll reset", {
          sessionAtEnd,
          currentSession: pollSessionId
        });
        return;
      }

      resetPoll();
      channel.postMessage({ action: 'lockStartButton', lock: false });
    }, 8000);

  } else {
    // No votes? Just reset everything instantly
    resetPoll();
  }
}


function resetPoll() {
  const overlay = document.querySelector(".poll-timer-overlay");
  if (overlay) overlay.remove();
  isPollActive = false;

  // Clear any timers an data
  clearTimeout(pollTimer);
  clearInterval(countdownInterval);
  votedUsers.clear();
  votes = [];

  // SETTINGS PAGE – hide timer instantly
  channel.postMessage({ action: "timerTick", time: "ended" });

  // Visual Reset
  const poll = document.getElementById("poll-widget");
  const choicesContainer = document.querySelector(".choices");
  const titleElement = document.querySelector(".poll-card .title");

  channel.postMessage({ action: "pollState", isActive: false });
  poll.classList.add("hidden");
}

function togglePoll() {
  const poll = document.getElementById("poll-widget");
  const titleElement = document.querySelector(".poll-card .title");
  const choicesContainer = document.querySelector(".choices");

  poll.classList.toggle("hidden");

  // If we just made it visible but no poll is running, ensure it shows the "Blank" state
  if (!poll.classList.contains("hidden") && !isPollActive) {
    if (choicesContainer) choicesContainer.innerHTML = "";
    if (titleElement) titleElement.textContent = "START A POLL";
  }
}

/*
document.addEventListener('keydown', (event) => {
    const key = event.key; // '1', '2', etc.
    if (key >= '1' && key <= '5') {
        const voteIndex = parseInt(key) - 1; // Subtract 1 for 0-based index
        castVote(voteIndex);
    }
});*/
