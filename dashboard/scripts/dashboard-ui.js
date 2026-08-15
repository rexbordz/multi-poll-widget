// dashboard/dashboard-ui.js — poll config form, persistent storage, and rendering poll-engine's state onto the DOM.

const STORAGE_PREFIX = "poll-field-";

/**
 * @param {object} handlers
 * @param {(pollData: {title: string, choicesArray: {text:string}[], duration: number}) => void} handlers.onStart
 * @param {() => void} handlers.onEnd
 * @param {() => void} handlers.onToggle
 * @param {() => void} handlers.onReset
 */
export function createDashboardUI({ onStart, onEnd, onToggle, onReset }) {
  const pollTitleInput = document.querySelector("#poll-title");
  const choiceInputs = document.querySelectorAll(".choice-input");
  const durationDropdown = document.querySelector("#duration-dropdown");
  const durationInput = document.querySelector("#duration-input");
  const startEndBtn = document.querySelector("#start-end-poll");
  const toggleBtn = document.querySelector("#toggle-poll");
  const resetBtn = document.querySelector("#reset-poll");
  const choicesGroup = document.querySelector("#choices-group");

  // Hardcoded, not read from durationDropdown.value — wa-select hasn't upgraded yet here, so .value would be undefined.
  let lastSelectedDuration = "0";

  // ---- Persistent form storage ----

  function bindPersistentStorage() {
    const allInputs = document.querySelectorAll(
      "#poll-title, .choice-input, #duration-dropdown, #duration-input"
    );

    allInputs.forEach((field, index) => {
      const storageKey = `${STORAGE_PREFIX}${field.id || index}`;

      const savedValue = localStorage.getItem(storageKey);
      if (savedValue !== null) {
        field.value = savedValue;
      }

      field.addEventListener("input", () => {
        localStorage.setItem(storageKey, field.value);
      });
    });
  }

  // ---- Duration dropdown / custom input sync ----

  function bindDurationSync() {
    durationDropdown.addEventListener("change", () => {
      if (durationDropdown.value !== "custom") {
        lastSelectedDuration = durationDropdown.value;
      }
    });

    durationInput.addEventListener("input", () => {
      // wa-number-input's .value can be a number, not always a string — .trim() directly would risk a TypeError.
      const raw = String(durationInput.value ?? "").trim();

      if (raw === "") {
        durationDropdown.value = lastSelectedDuration;
        return;
      }

      const parsed = parseInt(raw, 10);
      // 0 or negative typed deliberately means "no time limit" — same as the Permanent preset.
      durationDropdown.value = !isNaN(parsed) && parsed <= 0 ? "0" : "custom";
    });
  }

  /** Drives the dropdown/custom-input pair from an external value — used
   *  for both Stream Deck duration presets and requeue sync. */
  function applyDurationPreset(value) {
    const hasMatch = Array.from(durationDropdown.querySelectorAll("wa-option")).some((opt) => opt.value === value);

    if (hasMatch) {
      durationDropdown.value = value;
      durationInput.value = "";
      lastSelectedDuration = value;
    } else {
      durationDropdown.value = "custom";
      durationInput.value = value;
    }
  }

  // ---- Reading / filling the form ----

  function readPollData() {
    const title = (pollTitleInput.value || "").trim() || undefined;

    const choicesArray = [];
    choiceInputs.forEach((input) => {
      const text = input.value.trim();
      if (text) choicesArray.push({ text });
    });

    if (choicesArray.length < 2) {
      alert("Please provide at least 2 choices.");
      return null;
    }

    let duration = 0;
    if (durationInput.value) {
      duration = parseInt(durationInput.value, 10);
      if (isNaN(duration) || duration < 0) duration = 0;
    } else {
      duration = parseInt(durationDropdown.value, 10) || 0;
    }

    return { title, choicesArray, duration };
  }

  function fillFormFrom({ title, choicesArray, duration }) {
    pollTitleInput.value = title || "";

    const inputs = document.querySelectorAll(".choice-input");
    choicesArray.forEach((choice, i) => {
      if (inputs[i]) {
        inputs[i].value = choice.text;
        if (choice.text.trim() !== "") clearRequiredMissing(inputs[i]);
      }
    });

    applyDurationPreset(String(duration));
  }

  // ---- Clear (title + choices only, duration kept) ----

  // Matches the default values hardcoded into index.html's first two (required) choice inputs.
  const DEFAULT_CHOICE_VALUES = ["Choice 1", "Choice 2"];

  function clearPollFields() {
    const allInputs = document.querySelectorAll(
      "#poll-title, .choice-input, #duration-dropdown, #duration-input"
    );

    let choiceIndex = -1;
    allInputs.forEach((field, index) => {
      if (field.classList.contains("choice-input")) choiceIndex++;
      if (field !== pollTitleInput && !field.classList.contains("choice-input")) return;

      const storageKey = `${STORAGE_PREFIX}${field.id || index}`;
      localStorage.removeItem(storageKey);
      field.value = DEFAULT_CHOICE_VALUES[choiceIndex] || "";
      if (field.classList.contains("choice-input")) clearRequiredMissing(field);
    });
  }

  // ---- Start / End / Toggle / Reset ----

  function resetStatsDisplay() {
    const gauges = document.querySelectorAll(".gauge-fill.config-page");
    gauges.forEach((g) => {
      g.style.transition = "none"; // snap to 0 instead of animating down
      g.style.width = "0%";
    });

    document.querySelectorAll(".choice-container").forEach((container) => {
      const votesEl = container.querySelector(".votes.config-page");
      const percentEl = container.querySelector(".percent.config-page");
      if (votesEl) votesEl.textContent = "0 votes";
      if (percentEl) percentEl.textContent = "0%";
    });

    void choicesGroup.offsetWidth; // force reflow before re-enabling the transition
    gauges.forEach((g) => {
      g.style.transition = "width 0.5s ease";
    });
  }

  // ---- Required-choice validation ----

  function clearRequiredMissing(input) {
    input.closest(".choice-container")?.classList.remove("required-missing");
  }

  function bindRequiredValidation() {
    document.querySelectorAll(".choice-input[required]").forEach((input) => {
      input.addEventListener("input", () => {
        if (input.value.trim() !== "") clearRequiredMissing(input);
      });
    });
  }

  function markRequiredMissing() {
    document.querySelectorAll(".choice-input[required]").forEach((input) => {
      if (input.value.trim() === "") {
        input.closest(".choice-container")?.classList.add("required-missing");
      }
    });
  }

  function startEndPoll() {
    if (startEndBtn.textContent === "Start Poll") {
      const requiredInputs = document.querySelectorAll(".choice-input[required]");
      const allFilled = Array.from(requiredInputs).every((input) => input.value.trim() !== "");
      if (!allFilled) {
        markRequiredMissing();
        return;
      }

      const pollData = readPollData();
      if (!pollData) return;

      onStart(pollData);
    } else {
      onEnd();
    }
  }

  function bindButtons() {
    startEndBtn.addEventListener("click", startEndPoll);
    toggleBtn.addEventListener("click", () => onToggle());
    resetBtn.addEventListener("click", () => {
      onReset();
      clearPollFields();
    });
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  // ---- Rendering poll-engine's emitted events ----
  // Mirrors each `emit(...)` call in poll-engine.js — script.js's render() switches on the same event names.

  function render(event, payload) {
    switch (event) {
      case "PollStarted": {
        if (!payload.requeued) {
          resetStatsDisplay();
        } else {
          fillFormFrom(payload);
        }

        choicesGroup.classList.add("poll-active");
        startEndBtn.disabled = false;
        startEndBtn.textContent = "End Poll";
        startEndBtn.classList.add("is-ending");
        startEndBtn.style.opacity = "1";
        startEndBtn.style.cursor = "pointer";
        break;
      }

      case "LiveStatsUpdate": {
        const containers = document.querySelectorAll(".choice-container");
        payload.stats.forEach((stat, i) => {
          const container = containers[i];
          if (!container) return;

          const votesEl = container.querySelector(".votes.config-page");
          const percentEl = container.querySelector(".percent.config-page");
          const gaugeEl = container.querySelector(".gauge-fill.config-page");
          const label = stat.votes !== 1 ? "votes" : "vote";

          if (votesEl) votesEl.textContent = `${stat.votes} ${label}`;
          if (percentEl) percentEl.textContent = `${stat.percent}%`;
          if (gaugeEl) gaugeEl.style.width = `${stat.percent}%`;
        });
        break;
      }

      case "PollEnded": {
        const containers = document.querySelectorAll(".choice-container");
        const activeChoicesCount = Array.from(document.querySelectorAll(".choice-input"))
          .filter((input) => input.value.trim() !== "").length;
        const isGlobalTie = payload.winners.length === activeChoicesCount || payload.maxVotes === 0;

        choicesGroup.classList.add("poll-active");

        containers.forEach((container, i) => {
          container.classList.remove("winner", "loser");
          if (isGlobalTie) return;

          if (payload.winners.includes(i)) {
            container.classList.add("winner");
          } else if (container.querySelector(".choice-input").value.trim() !== "") {
            container.classList.add("loser");
          }
        });

        startEndBtn.disabled = true;
        startEndBtn.textContent = "Closing Poll...";
        startEndBtn.style.opacity = "0.5";
        startEndBtn.style.cursor = "not-allowed";
        startEndBtn.classList.add("is-ending");
        break;
      }

      case "timerTick": {
        const timeDisplay = document.querySelector(".time-remaining");
        if (!timeDisplay) break;

        if (payload.time === "permanent" || payload.time === "" || payload.time === null) {
          timeDisplay.style.display = "none";
          timeDisplay.textContent = "";
        } else if (payload.time === "ended") {
          timeDisplay.style.display = "block";
          timeDisplay.textContent = "Poll Ended!";
        } else {
          timeDisplay.style.display = "block";
          timeDisplay.textContent = `Time Left: ${formatTime(payload.time)}`;
        }
        break;
      }

      case "PollReset": {
        if (payload.isActive === false) {
          choicesGroup.classList.remove("poll-active");

          document.querySelectorAll(".choice-container").forEach((c) => {
            c.classList.remove("winner", "loser");
            const g = c.querySelector(".gauge-fill.config-page");
            if (g) g.style.width = "0%";
          });

          const timeDisplay = document.querySelector(".time-remaining");
          if (timeDisplay) {
            timeDisplay.textContent = "";
            timeDisplay.style.display = "none";
          }

          startEndBtn.disabled = false;
          startEndBtn.textContent = "Start Poll";
          startEndBtn.classList.remove("is-ending");
          startEndBtn.style.opacity = "1";
          startEndBtn.style.cursor = "pointer";
        }
        break;
      }

      case "lockStartButton": {
        startEndBtn.disabled = payload.lock;
        startEndBtn.style.opacity = payload.lock ? "0.5" : "1";
        startEndBtn.style.cursor = payload.lock ? "not-allowed" : "pointer";
        break;
      }

      default:
        break; // togglePoll etc: nothing on the dashboard needs to react
    }
  }

  function init() {
    bindPersistentStorage();
    bindDurationSync();
    bindButtons();
    bindRequiredValidation();
  }

  return {
    init,
    render,
    startEndPoll, // exposed so an external "Start/End Poll" trigger can drive the same click path
    applyDurationPreset, // exposed for connection.js's duration-preset triggers
  };
}
