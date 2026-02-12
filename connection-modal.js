// =============================
// Streamer.bot Connection System
// =============================

let sbClient = null;
let sbClientConnected = false;
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

function updateStatusIndicator(isConnected, version = "") {
  const indicator = document.querySelector(".status-indicator");
  if (!indicator) return;

  indicator.classList.remove("online", "offline");
  indicator.classList.add(isConnected ? "online" : "offline");

  // Update the tooltip title based on connection state
  if (isConnected) {
    indicator.title = `Connected to Streamer.bot ${version}`;
  } else {
    indicator.title = "Disconnected from Streamer.bot";
  }
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
      const channel = new BroadcastChannel('rexbordzPollWidget');
      channel.postMessage({
        type: 'CONNECTION_SUCCESS',
        address: sbAddress,
        port: sbPort,
        password: sbPassword
    });

      
      console.debug(data);

      updateStatusIndicator(true, sbVersion);
      saveConnectionSettings(sbAddress, sbPort, sbPassword);

      // Hide banner
      if (warningBanner) warningBanner.classList.add("hidden");

      const activeOverlay = document.querySelector(".connection-overlay");
        if (activeOverlay) activeOverlay.remove(); 

      
      const response = await sbClient.getActions();
      streamerbotActions = response.actions || [];
      console.log("Streamer.bot Actions", streamerbotActions);
      buildActionLookup();
      const allValid = computeIntegrationHealth();
      updateIntegrationButton(allValid);
      paintIntegrationRows(); // will safely do nothing if modal not open
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

}


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

  if (document.querySelector(".connection-overlay")) return;

  const saved = loadConnectionSettings();

  const overlay = document.createElement("div");
  overlay.className = "connection-overlay";

  overlay.innerHTML = `
    <div class="connection-modal">
    
      <div class="connection-header">
        <div class="connection-header-left">
          <img src="assets/images/streamerbot-logo.svg" 
               class="connection-icon" 
               alt="logo">
          <span class="connection-title">MULTIPOLL</span>
        </div>
        <button class="connection-close">&times;</button>
      </div>

      <div class="connection-body">

        <div class="connection-warning ${sbClientConnected ? 'hidden' : ''}">
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
          <button class="form-button" id="connect-btn">Connect</button>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const warningBanner = overlay.querySelector(".connection-warning");
  const connectBtn = overlay.querySelector("#connect-btn");

  // Close button
  overlay.querySelector(".connection-close")
    .addEventListener("click", () => overlay.remove());

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Connect button
  connectBtn.addEventListener("click", () => {

    const sbAddress = document.getElementById("sb-address").value.trim();
    const sbPort = document.getElementById("sb-port").value.trim();
    const sbPassword = document.getElementById("sb-password").value.trim();

    if (!sbAddress || !sbPort) {
      warningBanner.textContent = "Address and Port are required.";
      warningBanner.classList.remove("hidden");
      return;
    }

    initializeStreamerbotConnection(
      sbAddress,
      sbPort,
      sbPassword,
      warningBanner,
      connectBtn,
      overlay
    );
  });

}

// =============================
// Action Button Logic
// =============================

const integrationActions = [
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

  if (document.querySelector(".integration-overlay")) return;
  

  const overlay = document.createElement("div");
  overlay.className = "integration-overlay";

  overlay.innerHTML = `
    <div class="integration-modal">

      <!-- Close Button -->
      <button class="connection-close">&times;</button>

      <div class="integration-body">

        <div class="integration-status-text">
          Some actions are not found.
        </div>

        <div class="integration-list"></div>

        <div class="integration-import-label">
          Import the following to Streamer.bot:
        </div>

        <div class="integration-code-row">
          <input type="text"
                 class="integration-code"
                 value="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"
                 readonly>

          <button class="copy-btn">Copy</button>
        </div>

        <button class="form-button" id="integration-recheck-btn">
          Recheck Integration
        </button>

      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  renderIntegrationList();
  updateIntegrationStatuses();


  // Close logic
  overlay.querySelector(".connection-close")
  .addEventListener("click", () => overlay.remove());


  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Copy logic
  const copyBtn = overlay.querySelector(".copy-btn");
  const codeInput = overlay.querySelector(".integration-code");

  copyBtn.addEventListener("click", () => {
    codeInput.select();
    document.execCommand("copy");

    copyBtn.textContent = "Copied";
    copyBtn.classList.add("copied");

    setTimeout(() => {
      copyBtn.textContent = "Copy";
      copyBtn.classList.remove("copied");
    }, 1500);
  });
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

  integrationActions.forEach(expected => {

    const row = document.querySelector(
      `.integration-row[data-id="${expected.id}"]`
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
      statusEl.textContent = "✔ Found";
    } else {
      statusEl.classList.add("not-found");
      statusEl.textContent = "✖ Not Found";
      allValid = false;
    }
  });

  updateIntegrationSummary(allValid);
}

function updateIntegrationSummary(allValid) {
  const summary = document.querySelector(".integration-status-text");
  const integrationBtn = document.querySelector(".integration-check");

  if (!summary || !integrationBtn) return;

  summary.classList.remove("status-valid", "status-invalid", "status-checking");

  if (allValid) {
  summary.textContent = "All actions are found.";
  summary.classList.add("status-valid");
  } else {
  summary.textContent = "Some actions are not found.";
  summary.classList.add("status-invalid");
  }

}

function renderIntegrationList() {
  const list = document.querySelector(".integration-list");
  list.innerHTML = "";

  integrationActions.forEach(action => {
    const row = document.createElement("div");
    row.className = "integration-row";
    row.dataset.id = action.id;

    row.innerHTML = `
      <span>${action.name}</span>
      <span class="status not-found">✖ Not Found</span>
    `;

    list.appendChild(row);
  });
}

function resetIntegrationState() {
  const integrationBtn = document.querySelector(".integration-check");
  const summary = document.querySelector(".integration-status-text");

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
  return integrationActions.every(expected => {
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

function paintIntegrationRows() {
  integrationActions.forEach(expected => {
    const row = document.querySelector(
      `.integration-row[data-id="${expected.id}"]`
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
      statusEl.textContent = "✔ Found";
    } else {
      statusEl.classList.add("not-found");
      statusEl.textContent = "✖ Not Found";
    }
  });
}

async function recheckIntegration() {
  const summary = document.querySelector(".integration-status-text");
  const recheckBtn = document.getElementById("integration-recheck-btn");

  // 1. Immediate UI feedback (Optional but recommended)
  if (recheckBtn) recheckBtn.classList.add("loading"); // Add a CSS spinner if you have one
  if (summary) {
    summary.textContent = "Fetching latest actions...";
    summary.classList.add("status-checking");
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
    updateIntegrationSummary(allValid);
    updateIntegrationButton(allValid);
    paintIntegrationRows();

    console.log("Integration recheck complete. Healthy:", allValid);

  } catch (err) {
    console.error("Integration recheck failed:", err);
    if (summary) summary.textContent = "Failed to reach Streamer.bot.";
  } finally {
    if (recheckBtn) recheckBtn.classList.remove("loading");
  }
}

document.addEventListener("click", (event) => {
  if (event.target && event.target.id === "integration-recheck-btn") {
    console.log("Button clicked! Triggering recheck...");
    recheckIntegration();
  }
});







