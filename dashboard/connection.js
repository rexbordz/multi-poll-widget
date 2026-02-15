// Create BroadcastChannel
const channel = new BroadcastChannel('rexbordzPollWidget');

let sbClient = null;
let sbClientConnected = false;
let tikfinitySocket = null;
let tikfinityConnected = false;
let isConnecting = false;
let streamerbotActions = [];


const STORAGE_KEYS = {
  address: "sb_address",
  port: "sb_port",
  password: "sb_password"
};


// =============================
// Status Indicator
// =============================

let lastSBConnected = false;
let lastSBVersion = "";

function updateStatusIndicator(isConnected, version = "") {
  const indicator = document.querySelector(".status-indicator");
  if (!indicator) return;

  // ----- If SB state was provided, update stored state -----
  if (typeof isConnected === "boolean") {
    lastSBConnected = isConnected;
    lastSBVersion = version || "";
  }

  // ----- Only SB controls visual class -----
  indicator.classList.remove("online", "offline");
  indicator.classList.add(lastSBConnected ? "online" : "offline");

  // ----- SB Line -----
  const sbLine = lastSBConnected
    ? `Connected to Streamer.bot ${lastSBVersion}`
    : "Disconnected from Streamer.bot";

  // ----- Tik Line -----
  const tikLine = tikfinityConnected
    ? "Connected to TikFinity"
    : "Disconnected from TikFinity (Optional)";

  // ----- Tooltip -----
  indicator.title = `${sbLine}\n${tikLine}`;
}


// =============================
// Save / Load Settings
// =============================

function saveConnectionSettings(address, port, password) {
  localStorage.setItem(STORAGE_KEYS.address, address);
  localStorage.setItem(STORAGE_KEYS.port, port);
  localStorage.setItem(STORAGE_KEYS.password, password);
}

function loadConnectionSettings() {
  return {
    address: localStorage.getItem(STORAGE_KEYS.address) || "127.0.0.1",
    port: localStorage.getItem(STORAGE_KEYS.port) || "8080",
    password: localStorage.getItem(STORAGE_KEYS.password) || ""
  };
}


// =============================
// Streamer.bot Initialization
// =============================

function initializeStreamerbotConnection(sbAddress, sbPort, sbPassword, warningBanner, connectBtn, overlay) {

  if (isConnecting) return;

  isConnecting = true;
  if (connectBtn) {
    connectBtn.disabled = true;
    connectBtn.textContent = "Connecting...";
  }

  // Disconnect previous client safely
  if (sbClient) {
    try { sbClient.disconnect(); } catch (e) {}
  }

  sbClient = new StreamerbotClient({
    host: sbAddress,
    port: sbPort,
    password: sbPassword,

    onConnect: async (data) => {

      sbClientConnected = true;
      isConnecting = false;

      console.log(`✅ Streamer.bot connected to ${sbAddress}:${sbPort}`);
      const sbVersion = data.info?.version || data.version || "";
      
      console.debug(data);

      updateStatusIndicator(true, sbVersion);
      saveConnectionSettings(sbAddress, sbPort, sbPassword);

      // Hide banner
      if (warningBanner) warningBanner.classList.add("hidden");

      const activeOverlay = document.querySelector(".modal-overlay");
      if (activeOverlay) activeOverlay.remove();
      document.body.classList.remove("modal-open");
      
      const response = await sbClient.getActions();
      streamerbotActions = response.actions || [];
      console.log("Streamer.bot Actions", streamerbotActions);
      buildActionLookup();
      const allValid = computeIntegrationHealth();
      updateIntegrationButton(allValid);
      paintActionRows(); // will safely do nothing if modal not open
    },

    onDisconnect: () => {

      if (sbClientConnected) {
        openConnectionModal();
        sbClientConnected = false;
      }
      
      isConnecting = false;

      console.warn("❌ Streamer.bot Client disconnected");

      updateStatusIndicator(false);

      if (warningBanner) {
        warningBanner.textContent = "Disconnected from Streamer.bot";
        warningBanner.classList.remove("hidden");
      }

      if (connectBtn) {
        connectBtn.disabled = false;
        connectBtn.textContent = "Connect";
      }
    }
  });

  sbClient.on("Twitch.ChatMessage", (response) => forward("Twitch.ChatMessage", response));
  sbClient.on("Kick.ChatMessage", (response) => forward("Kick.ChatMessage", response));
  sbClient.on("YouTube.Message", (response) => forward("YouTube.Message", response));

  sbClient.on("Raw.Action", (response) => {
    const actionId = response?.data?.actionId;

    const dropdown = document.getElementById("duration-dropdown");
    if (!dropdown) return; // dropdown not on this page

    switch (actionId) {

      // 1) 15s
      case "ec6fb9ae-1a07-4698-bb44-149e05e11b22":
        dropdown.value = "15";
        dropdown.dispatchEvent(new Event("change", { bubbles: true }));
        break;

      // 2) 30s
      case "2b2e28da-bbb3-4bfb-9437-965af70a38de":
        dropdown.value = "30";
        dropdown.dispatchEvent(new Event("change", { bubbles: true }));
        break;

      // 3) 1m (60s)
      case "2399c23b-48a4-470b-853f-ec779fa7b08e":
        dropdown.value = "60";
        dropdown.dispatchEvent(new Event("change", { bubbles: true }));
        break;

      // 4) 2m (120s)
      case "a4b03917-4298-450a-9b1e-fbc1c3c3bd44":
        dropdown.value = "120";
        dropdown.dispatchEvent(new Event("change", { bubbles: true }));
        break;

      // 5) 10m (600s)
      case "d09444c9-aac1-4869-b0e5-421ee8ec949a":
        dropdown.value = "600";
        dropdown.dispatchEvent(new Event("change", { bubbles: true }));
        break;

      // 6) Permanent (0)
      case "87ec91b3-be85-47d2-981c-81125df6d65e":
        dropdown.value = "0";
        dropdown.dispatchEvent(new Event("change", { bubbles: true }));
        break;

      default:
        forward("Raw.Action", response);
        break;
    }
  });

}

function forward(eventName, response) {
  // Send the whole payload, plus eventName for routing
  channel.postMessage({
    type: "SB_EVENT",
    event: eventName,
    payload: response
  });
}

// Broadcast Listener for Streamer.bot Requests
channel.addEventListener("message", async (e) => {
  const data = e.data;
  if (data?.type !== "SB_DO_ACTION") return;

  if (!sbClientConnected || !sbClient) {
    console.warn("SB_DO_ACTION requested but SB not connected");
    return;
  }

  try {
    await sbClient.doAction(data.actionId, data.args || {});
    console.debug("✅ SB Action executed:", data.actionId, data.args);
  } catch (err) {
    console.error("❌ SB Action failed:", err);
  }
});

// =============================
// Tikfinity Setup
// =============================

function connectTikfinity() {
  // Prevent duplicate sockets
  if (tikfinitySocket && (tikfinitySocket.readyState === WebSocket.OPEN || tikfinitySocket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  tikfinitySocket = new WebSocket("ws://localhost:21213");

  tikfinitySocket.onopen = () => {
    if (!tikfinityConnected) {
      tikfinityConnected = true;
      console.log("✅ Connected to TikFinity");
      updateStatusIndicator();
    }
  };

  tikfinitySocket.onclose = () => {
    if (tikfinityConnected) {
      tikfinityConnected = false;
      console.warn("❌ Disconnected from TikFinity");
      updateStatusIndicator();
    }
    setTimeout(connectTikfinity, 3000);
  };

  tikfinitySocket.onmessage = (event) => {
    try {
      const packet = JSON.parse(event.data);

      switch (packet.event) {

        case "chat": {
          // Broadcast the WHOLE packet, minimal + consistent
          channel.postMessage({
            type: "TIKFINITY_EVENT",
            source: "TikTok",
            event: "chat",
            payload: packet
          });
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

document.addEventListener("DOMContentLoaded", connectTikfinity);

// =============================
// Connection Modal Logic
// =============================
document.addEventListener("DOMContentLoaded", () => {

  updateStatusIndicator(false);

  const statusIndicator = document.querySelector(".status-indicator");
  if (statusIndicator) {
    statusIndicator.addEventListener("click", openConnectionModal);
  }

  // Auto-open modal when settings page loads
  openConnectionModal(true);

  // Attempt auto-reconnect if saved values exist
  const saved = loadConnectionSettings();
  if (saved.address && saved.port) {
    initializeStreamerbotConnection(
      saved.address,
      saved.port,
      saved.password
    );
  }

});

function openConnectionModal(isInitialLoad = false) {
  if (document.querySelector(".modal-overlay")) return;

  const saved = loadConnectionSettings();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <div id="connection" class="modal" role="dialog" aria-modal="true">
      <div class="modal-header">
        <div class="modal-header-left">
          <img src="../assets/images/streamerbot-logo.svg" class="modal-icon" alt="logo">
          <span class="modal-title">MULTIPOLL</span>
        </div>
        <button class="modal-close" type="button" aria-label="Close">&times;</button>
      </div>

      <div class="modal-body">
        <div class="modal-warning ${sbClientConnected ? 'hidden' : ''}">
          Disconnected from Streamer.bot
        </div>

        <div class="form-row two-cols">
          <div class="form-group">
            <label>Address <span class="required">*</span></label>
            <input type="text" id="sb-address" value="${saved.address}">
          </div>

          <div class="form-group">
            <label>Port <span class="required">*</span></label>
            <input type="text" id="sb-port" value="${saved.port}">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group full">
            <label>Password</label>
            <input type="password" id="sb-password" value="${saved.password}">
          </div>
        </div>

        <div class="form-row">
          <button class="modal-button" id="connect-btn" type="button">Connect</button>
        </div>
      </div>
    </div>
  `;

  document.body.classList.add("modal-open");
  document.body.appendChild(overlay);

  const modal = overlay.querySelector(".modal");
  const warningBanner = overlay.querySelector(".modal-warning");
  const connectBtn = overlay.querySelector("#connect-btn");

  if (document.hasFocus()) {
      // put focus on the first input or button (your choice)
      overlay.querySelector("#connect-btn")?.focus();
    }
    
  const closeModal = () => {
    overlay.remove();
    document.body.classList.remove("modal-open");
  };

  overlay.querySelector(".modal-close").addEventListener("click", closeModal);

  connectBtn.addEventListener("click", () => {
    const sbAddress = overlay.querySelector("#sb-address").value.trim();
    const sbPort = overlay.querySelector("#sb-port").value.trim();
    const sbPassword = overlay.querySelector("#sb-password").value.trim();


    if (!sbAddress || !sbPort) {
      warningBanner.textContent = "Address and Port are required.";
      warningBanner.classList.remove("hidden");
      return;
    }

    initializeStreamerbotConnection(sbAddress, sbPort, sbPassword, warningBanner, connectBtn, overlay);
  });

  focusTrapOnModal(modal); 
}

// =============================
// Action Button Logic
// =============================

const sbActions = [
  { id: "ec6fb9ae-1a07-4698-bb44-149e05e11b22", name: "MultiPoll Widget • [Trigger] 1 - 15s Duration" },
  { id: "2b2e28da-bbb3-4bfb-9437-965af70a38de", name: "MultiPoll Widget • [Trigger] 2 - 30s Duration" },
  { id: "2399c23b-48a4-470b-853f-ec779fa7b08e", name: "MultiPoll Widget • [Trigger] 3 - 1m Duration" },
  { id: "a4b03917-4298-450a-9b1e-fbc1c3c3bd44", name: "MultiPoll Widget • [Trigger] 4 - 2m Duration" },
  { id: "d09444c9-aac1-4869-b0e5-421ee8ec949a", name: "MultiPoll Widget • [Trigger] 5 - 10m Duration" },
  { id: "87ec91b3-be85-47d2-981c-81125df6d65e", name: "MultiPoll Widget • [Trigger] 6 - Permanent" },
  { id: "8413040f-ee21-439d-be53-b44f55d35998", name: "MultiPoll Widget • [Trigger] Clear " }, 
  { id: "e14a127f-34f6-4091-ba06-a1eb4d387564", name: "MultiPoll Widget • [Trigger] Start/End Poll" }, 
  { id: "705bae3a-36f1-4f42-9bb1-110c8bc5feb7", name: "MultiPoll Widget • [Trigger] Toggle Poll " }, 
  { id: "e5a8fac6-f58e-4344-88eb-9bd13be4ab2e", name: "MultiPoll Widget • Poll Ended" }, 
  { id: "4c16514d-8672-4c36-823e-ce11219a3bdb", name: "MultiPoll Widget • Poll Started" }, 
];

// Button
const integrationBtn = document.querySelector(".integration-check");
if (integrationBtn) {
  integrationBtn.addEventListener("click", openIntegrationModal);
}


// Open Window
function openIntegrationModal() {

  if (document.querySelector(".modal-overlay")) return;
  
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <div id="sb-actions" class="modal" >

      <!-- Close Button -->
      <button class="modal-close">&times;</button>

      <div class="modal-body">

        <div class="status-text">
          Some actions are not found
        </div>

        <div class="actions-list"></div>

        <div class="import-label">
          Import the following to Streamer.bot:
        </div>

        <div class="code-row">
          <div class="code" id="codeBox"> 
            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
          </div>

          <button class="copy-btn">Copy</button>
        </div>

        <div class="tip-line">
          <a href="https://github.com/rexbordz/multi-poll-widget/tree/main/streamdeck"
            target="_blank"
            rel="noopener noreferrer">
            Download Stream Deck Profile
          </a>
        </div>

        <button id="integration-recheck-btn" class="modal-button">
          Recheck
        </button>

      </div>
    </div>
  `;

  document.body.classList.add("modal-open");
  document.body.appendChild(overlay);
  renderActionsList();
  updateIntegrationStatuses();
 
  if (document.hasFocus()) {
    // put focus on the first input or button (your choice)
    overlay.querySelector("#integration-recheck-btn")?.focus();
  }
  // Close logic
  const closeModal = () => {
    overlay.remove();
    document.body.classList.remove("modal-open");
  };

  overlay.querySelector(".modal-close")
    .addEventListener("click", closeModal);

  
  // Copy logic
  const copyBtn = overlay.querySelector(".copy-btn");
  const codeBox = overlay.querySelector(".code");

  copyBtn.addEventListener("click", () => {
    const text = codeBox.textContent.trim();

    // Create a temporary textarea
    const textarea = document.createElement("textarea");
    textarea.value = text;

    // Prevent scrolling / flashing
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand("copy");

      copyBtn.textContent = "Copied";
      copyBtn.classList.add("copied");

      setTimeout(() => {
        copyBtn.textContent = "Copy";
        copyBtn.classList.remove("copied");
      }, 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }

    document.body.removeChild(textarea);
  });

  focusTrapOnModal(overlay);
}

let actionLookup = new Map();

function buildActionLookup() {
  actionLookup.clear();

  streamerbotActions.forEach(action => {
    actionLookup.set(action.id, action);
  });
}

function updateIntegrationStatuses() {
  let allValid = true;

  sbActions.forEach(expected => {

    const row = document.querySelector(
      `.row[data-id="${expected.id}"]`
    );

    if (!row) return;

    const statusEl = row.querySelector(".status");

    const foundAction = actionLookup.get(expected.id);

    const isValid =
      foundAction &&
      foundAction.name === expected.name &&
      foundAction.enabled === true;

    statusEl.classList.remove("found", "not-found");

    if (isValid) {
      statusEl.classList.add("found");
      statusEl.textContent = "✔";
    } else {
      statusEl.classList.add("not-found");
      statusEl.textContent = "✖";
      allValid = false;
    }
  });

  updateActionsSummary(allValid);
}

function updateActionsSummary(allValid) {
  const summary = document.querySelector(".status-text");
  const integrationBtn = document.querySelector(".integration-check");

  if (!summary || !integrationBtn) return;

  summary.classList.remove("valid", "invalid", "checking");

  if (allValid) {
  summary.textContent = "All actions are found";
  summary.classList.add("valid");
  } else {
  summary.textContent = "Some actions are not found";
  summary.classList.add("invalid");
  }

}

function renderActionsList() {
  const list = document.querySelector(".actions-list");
  list.innerHTML = "";

  sbActions.forEach(action => {
    const row = document.createElement("div");
    row.className = "row";
    row.dataset.id = action.id;

    row.innerHTML = `
      <span>${action.name}</span>
      <span class="status not-found">✖</span>
    `;

    list.appendChild(row);
  });
}

function resetIntegrationState() {
  const integrationBtn = document.querySelector(".integration-check");
  const summary = document.querySelector(".status-text");

  if (integrationBtn) {
    integrationBtn.classList.remove("warning");
  }

  if (summary) {
    summary.textContent = "Checking integration...";
    summary.style.color = "#aaa";
  }
}

document.addEventListener("DOMContentLoaded", () => { resetIntegrationState(); });

function computeIntegrationHealth() {
  return sbActions.every(expected => {
    const found = actionLookup.get(expected.id);

    return (
      found &&
      found.name === expected.name &&
      found.enabled === true
    );
  });
}

function updateIntegrationButton(allValid) {
  const integrationBtn = document.querySelector(".integration-check");
  if (!integrationBtn) return;

  if (allValid) {
    integrationBtn.classList.remove("warning");
  } else {
    integrationBtn.classList.add("warning");
  }
}

function paintActionRows() {
  sbActions.forEach(expected => {
    const row = document.querySelector(
      `.row[data-id="${expected.id}"]`
    );
    if (!row) return;

    const statusEl = row.querySelector(".status");

    const found = actionLookup.get(expected.id);

    const isValid =
      found &&
      found.name === expected.name &&
      found.enabled === true;

    statusEl.classList.remove("found", "not-found");

    if (isValid) {
      statusEl.classList.add("found");
      statusEl.textContent = "✔";
    } else {
      statusEl.classList.add("not-found");
      statusEl.textContent = "✖";
    }
  });
}

async function recheckIntegration() {
  const summary = document.querySelector(".status-text");
  const recheckBtn = document.getElementById("integration-recheck-btn");

  // 1. Immediate UI feedback (Optional but recommended)
  if (recheckBtn) recheckBtn.classList.add("loading"); // Add a CSS spinner if you have one
  if (summary) {
    summary.textContent = "Fetching latest actions...";
    summary.classList.add("checking");
  }

  try {
    // 2. FETCH: Get fresh data from the client
    const response = await sbClient.getActions();
    
    // 3. UPDATE: Refresh the global variable and the lookup Map
    streamerbotActions = response.actions || [];
    buildActionLookup(); 

    // 4. VALIDATE: Re-run the health check with NEW data
    const allValid = computeIntegrationHealth();

    // 5. PAINT: Update all UI elements
    updateActionsSummary(allValid);
    updateIntegrationButton(allValid);
    paintActionRows();

    console.log("Integration recheck complete. Healthy:", allValid);

  } catch (err) {
    console.error("Integration recheck failed:", err);
    if (summary) summary.textContent = "Failed to reach Streamer.bot.";
  } finally {
    if (recheckBtn) recheckBtn.classList.remove("loading");
  }
}

function focusTrapOnModal(modalRoot) {
  if (!modalRoot) return;

  const SELECTOR =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  modalRoot.addEventListener("keydown", (e) => {
    // Only care about Tab navigation
    if (e.key !== "Tab") return;

    // 🧊 MAX CHILL RULE:
    // Only trap if focus is ALREADY inside modal
    if (!modalRoot.contains(document.activeElement)) return;

    const focusables = Array.from(modalRoot.querySelectorAll(SELECTOR))
      .filter(el => !el.disabled && el.tabIndex !== -1 && el.offsetParent !== null);

    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    // SHIFT + TAB → loop to end
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
      return;
    }

    // TAB → loop to start
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
      return;
    }

    // Otherwise → do nothing (normal tab flow inside modal)
  });
}             


document.addEventListener("click", (event) => {
  if (event.target && event.target.id === "integration-recheck-btn") {
    console.log("Button clicked! Triggering recheck...");
    recheckIntegration();
  }
});









