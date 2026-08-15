// script.js (overlay) — pure renderer; poll-engine.js on the dashboard owns all state.
// Classic script (not a module) — kept at the site root for existing OBS browser sources.

(function () {
  const STORAGE_KEYS = {
    address: "sb_address",
    port: "sb_port",
    password: "sb_password",
  };

  // Same keys connection.js saves under — reuses the dashboard's saved connection info.
  function loadConnectionSettings() {
    return {
      address: localStorage.getItem(STORAGE_KEYS.address) || "127.0.0.1",
      port: localStorage.getItem(STORAGE_KEYS.port) || "8080",
      password: localStorage.getItem(STORAGE_KEYS.password) || "",
    };
  }

  const saved = loadConnectionSettings();

  const sbClient = new StreamerbotClient({
    host: saved.address,
    port: saved.port,
    password: saved.password,

    onConnect: (data) => {
      const version = data.info?.version || data.version || "";
      console.log("[overlay] Connected to Streamer.bot", version);
    },

    onDisconnect: () => {
      console.warn("[overlay] Disconnected from Streamer.bot, retrying...");
    },
  });

  function parseIfJSON(value) {
    if (typeof value !== "string") return value;
    try {
      return JSON.parse(value);
    } catch (err) {
      return value;
    }
  }

  // Toggle Poll's Stream Deck action — listened to directly for an instant toggle.
  const TOGGLE_POLL_ACTION_ID = "705bae3a-36f1-4f42-9bb1-110c8bc5feb7";

  sbClient.on("Raw.Action", (response) => {
    const actionId = response?.data?.actionId;
    if (actionId === TOGGLE_POLL_ACTION_ID) {
      toggleOverlayVisibility();
    }
  });

  sbClient.on("Custom.CodeEvent", (response) => {

    const parsed = parseCodeEvent(response);
    if (!parsed) return;

    render(parsed.event, parsed.payload);
  });

  function parseCodeEvent(response) {
    const data = response?.data || {};
    const event = data.triggerName || data.eventName || data.name;
    const payload = data.args || data.arguments || data.payload || {};

    if (!event) {
      console.warn("[overlay] Couldn't determine event name — check parseCodeEvent()", response);
      return null;
    }
    return { event, payload };
  }

  // ---- DOM refs ----

  const pollWidget = document.getElementById("poll-widget");
  const pollCard = document.querySelector(".poll-card");
  const titleElement = document.querySelector(".poll-card .title");
  const choicesContainer = document.querySelector(".choices");

  const CHOICE_COLORS = ["choice-1", "choice-2", "choice-3", "choice-4", "choice-5", "choice-6", "choice-7", "choice-8", "choice-9", "choice-10"];
  const FLASH_COLORS = ["flash-choice-1", "flash-choice-2", "flash-choice-3", "flash-choice-4", "flash-choice-5", "flash-choice-6", "flash-choice-7", "flash-choice-8", "flash-choice-9", "flash-choice-10"];

  let isPollActive = false; // render-side bookkeeping only, for togglePoll's blank-state check — not a decision-maker
  let lastStats = []; // previous liveStatsUpdate, kept only to detect which choice changed for the vote-key flash

  // ---- Building / showing / hiding ----

  function showPoll() {
    pollWidget.classList.remove("hidden");
  }

  function hidePoll() {
    pollWidget.classList.add("hidden");
  }

  function buildChoices(choicesArray) {
    choicesContainer.innerHTML = "";

    choicesArray.forEach((choice, i) => {
      const choiceDiv = document.createElement("div");
      choiceDiv.className = "choice";

      const choiceText = choice.text || `Choice ${i + 1}`;

      choiceDiv.innerHTML = `
        <div class="vote-key">${i === 9 ? 0 : i + 1}</div>
        <div class="choice-main">
          <div class="choice-label">
            <div class="choice-text">${choiceText}</div>
            <div class="choice-right">
              <div class="votes">(0 votes)</div>
              <div class="percent">0%</div>
            </div>
          </div>
          <div class="gauge">
            <div class="gauge-fill ${CHOICE_COLORS[i] || ""}"></div>
          </div>
        </div>
      `;

      choicesContainer.appendChild(choiceDiv);
    });
  }

  // ---- Countdown bar ----
  // Purely decorative — just animates; PollEnded/PollReset decide when to snap or remove it.

  function startTimerBar(duration) {
    let overlay = document.querySelector(".poll-timer-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "poll-timer-overlay";
      pollCard.prepend(overlay);
    }

    overlay.style.transition = "none";
    overlay.style.width = "100%";
    void overlay.offsetWidth; // force reflow so the transition below actually applies
    overlay.style.transition = `width ${duration}s linear`;
    overlay.style.width = "0%";
  }

  function snapTimerBarToZero() {
    const overlay = document.querySelector(".poll-timer-overlay");
    if (!overlay) return;
    overlay.style.transition = "none";
    overlay.style.width = getComputedStyle(overlay).width;
    void overlay.offsetWidth;
    overlay.style.transition = "width 0.5s linear";
    overlay.style.width = "0%";
  }

  function removeTimerBar() {
    const overlay = document.querySelector(".poll-timer-overlay");
    if (overlay) overlay.remove();
  }

  // ---- Vote flash ----
  // Infers which choice just changed by diffing against the previous LiveStatsUpdate.

  function flashVoteKey(index) {
    const voteKey = document.querySelectorAll(".vote-key")[index];
    if (!voteKey) return;

    voteKey.classList.remove(...FLASH_COLORS);
    voteKey.classList.add(FLASH_COLORS[index]);
    setTimeout(() => voteKey.classList.remove(FLASH_COLORS[index]), 200);
  }

  // Winner's vote-key stays lit (buildChoices() resets it on the next poll) and shows a pulsing star icon.
  function showWinnerVoteKey(index) {
    const voteKey = document.querySelectorAll(".vote-key")[index];
    if (!voteKey) return;

    voteKey.classList.remove(...FLASH_COLORS);
    voteKey.classList.add(CHOICE_COLORS[index]);
    voteKey.innerHTML = `<i class="fa-solid fa-ranking-star winner-icon" aria-label="Winner"></i>`;
  }

  function toggleOverlayVisibility() {
    pollWidget.classList.toggle("hidden");

    // Matches old behavior: toggling into view with no active poll shows the blank "START A POLL" state.
    if (!pollWidget.classList.contains("hidden") && !isPollActive) {
      choicesContainer.innerHTML = "";
      if (titleElement) titleElement.textContent = "START A POLL";
    }
  }

  // ---- Rendering poll-engine's emitted events ----
  // Same event names as dashboard-ui.js's render() — this is the overlay's half of the same switch.

  function render(event, payload) {
    switch (event) {
      case "PollStarted": {
        isPollActive = true;
        if (titleElement) titleElement.textContent = payload.title || "START A POLL";
        buildChoices(parseIfJSON(payload.choicesArray));
        showPoll();

        if (payload.duration !== "permanent" && payload.duration > 0) {
          startTimerBar(payload.duration);
        } else {
          removeTimerBar();
        }

        lastStats = [];
        break;
      }

      case "LiveStatsUpdate": {
        const choices = document.querySelectorAll(".choice");
        const stats = parseIfJSON(payload.stats);

        stats.forEach((stat, i) => {
          const choice = choices[i];
          if (!choice) return;

          const previousVotes = lastStats[i]?.votes ?? 0;
          if (stat.votes > previousVotes) {
            flashVoteKey(i);
          }

          const votePluralized = stat.votes !== 1 ? "votes" : "vote";
          choice.querySelector(".votes").textContent = `(${stat.votes} ${votePluralized})`;
          choice.querySelector(".percent").textContent = `${stat.percent}%`;
          choice.querySelector(".gauge-fill").style.width = `${stat.percent}%`;
        });

        lastStats = stats;
        break;
      }

      case "PollEnded": {
        const choices = document.querySelectorAll(".choice");
        const winners = parseIfJSON(payload.winners);
        // The engine doesn't send an explicit tie flag, so this recomputes it like dashboard-ui.js does.
        const isGlobalTie = winners.length === choices.length || payload.maxVotes === 0;

        choices.forEach((choice, i) => {
          choice.classList.remove("winner", "loser");
          if (isGlobalTie) return;
          choice.classList.add(winners.includes(i) ? "winner" : "loser");
          if (winners.includes(i)) showWinnerVoteKey(i);
        });

        snapTimerBarToZero();
        break;
      }

      case "PollReset": {
        if (payload.isActive === false) {
          isPollActive = false;
          removeTimerBar();
          hidePoll();
        }
        break;
      }

      case "TogglePoll": {
        toggleOverlayVisibility();
        break;
      }

      case "timerTick":
      case "lockStartButton":
      default:
        break; // nothing on the overlay needs these
    }
  }
})();