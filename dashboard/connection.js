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
            U0JBRR+LCAAAAAAABADtW91S29oVvu9M30FDJ9N25my6/6V9Zs4FAUJITjgBHBNyyMX+NUpky5VkfnImM32DXvayM32F3vR5+gLtI3RJtgnGNhBCiMtBM4Cltba09vr51o/ML7/9TRQtdX2ll76PfqlP4LSnux5Ol14Msip9mWdZtJe6jq+i3arwQCuWTV5FK7ZK81659N1olR5Uh3lRryv8ickL9+GMdOSLEnhrGlkmy/iM4Hxpi7RfjYjn75XvDHrDRwClN8iyMa2b9tLuoNs+u2dNrGkfG44lpyc2o0difh/9PLwSjUkNOXX1gz3hmtA4IMaDRBwrgozGEmniDXcsiYXkY+GaZX8e+EGjIzw60Ixf42Nipe9pk/n6qVUx8BOUE5sNnH9S5N2naVnlxenlTC99z6W9DjAFnZUTXHMt+O+//CP6uVWknY4v3oI9dVH9ab3noppnQsxOkQ/65435+zK6eLeJBTo71qclGG2WPIXuubx7Zs4pus17dlAUvlfNolZDeRsbvj1PKAdmZdq8F0w89ECdDe3VOkzLKEsrX+gsO43AO8qoOvRRCRqL9PCzGVRV3oOPuopO80FUeh81535KBdGuryowQhn1dccvn9fIaGPZMCamKEPHI0wSSZRHxoYEHM/GSAnPkaHCEJ0kHmsxtfTYp53DWlN4GV+kVaf9ep8EY3WR1Ne1gjfdZDx98qx5jjkUt+f8Sf3I89c/fnctna84F+loZMUoDY1Sj3Wvp0G1FZAO8+q9P41CDtRqOfp8LUrhmXcMERU44j44lFgrkHNUCqmxEVoulBbJDbS4D0qzuhdBdOQRBEzP2wp8Etx5CHFRlYMqhxAdrXn7fuzHgxIctPHeM/x+DPjdzwadtNco/dyiz9a9BnBkXjDEpAAPDhSgk/AEJRQ7GlPrNI0XSvd0QvefTt5OAlKW6X7p3UaNg0PkGZM/2Ws6kcRYGO2ZBm0EAtrgFCljCCIE28RYEbyJ72EiaeWdTuabLBI9pJG7TyPOChqSWCPpEo+48QqZRATEleCBSM6xYAsVhAuZRnBsYo19jLSJKeKMaKQSSMaaBhs4odLKxdLiPUoj2LggLcBlEtcpnEiDVAxphCaxJILZhNpkoXT/VdNIwgnDHAfkPeRTzpRDps6xhvMghGNCqeQeppHVzOviIYF8iz4kcGdCHCOmLYMK2kqkpIN+2DqPlbOUGLtQ4beQCcRjQSxAFaIW192cwEhxzBE1wSrJVIInxwjfXIv3KIEE6YmWjiKPDZRAFOqgJBEUCRzHyisV02SxPPirJhBuoScmHPpgWZcylkloyJhH1hNCidLMOPNtEsgUqt5CBmnOm2EWyHGPs8dYCat5L6SdQeGbaDq/+6jryxIyQHTogTo/iH73ZG1FYDrFMNziDPGvkHSGtM2KI12ktXtsjSQfiXfxuSPeEcK8/OnHH6Pd1spOa30t+u/f//bP//zrr42dH/Vhq620yvyjqb0NzTeo8tYwbmeEXsMyjA/DhQusjg9DHeIOM6jysUEOwEJS5oQUU3O3ZvkliNHQx6hB2SzqOeBYcrHFhCmFsAiQcqmBGk9qh6DelYA5KsbTFW9zk0vhZbjHWUmyPj5OXng7G0pvItl1oFQphadod10NjGNoF7AmejGKFkhZLzNdQQ7qlnODZpZ4tx0vlT+pdbj0aBQoj2Z6wFgiPos4KD2k1Uu8A0TNjIYUe1WQSME81CzQiVFIpNyzGCkloCmWXHoWlKF6CkGa5dcMkqtjBPwvYBcnKFhoCHlCE6S5dMgb7ICGqZezw/RLYmSK++aGuj1bcA/1OUkCkthrSOjYIi2EhPLG1R1hgpWfjarXtAUTGJMFMAdZdHOYItfO6rJR6Xx7CUliQhIDaUVCOeqIRcZpBaEkpfUOStLwRbHDF8Nc9GbmGoNwK33fyt+PYfhSrJuBvg39UgRuOC5H4TkiNis/o3oZ8Y8qmEvdsGG9ulJp2EZ9pWeeaglFeCLAkEwTlBBlkICmhiROapuQuU+6wqEankurlobjvF8FahIaPEYxJnWbC2WUITKgQBX2QpHA7XwdXelbw33PQ+f6mPax+phnxHkJf+R7f1jN+6d/nCvu5DcU5jhhw1n4ADV3z/q5btawrX5/cLAH28uPy4ODF6kt8jIP1fLWeuvg4EkBsh7nxXvJDw6O+DJeZpgRdXDQLW1eZKlZdlm2NPvWF2u5swea08qv5q7RgXu91Tdd23nFsg9uo139dIyfj6+1um3mNtTAUtV1q+I5/B3U9LXt/rHbe1bqvRedfXpyaNmLzjZ5vLm7J+CayIAer23nnc3VlY592k7NRvZuc+PZkaHHnZ3Xh9k+a+M3u53+mMfDPeu/w5/Ha6/WO4M2bafwvHeatvF279nR/t7Ou/3XW3i3t3Vk0sNGlm34cd32KcjWevP6WX9/76Tvu+2X+90+PGM7NyD/5tOys7+3hfWeGmyu4c5mbysz3Z01vfEE73cVbu21P1j6pPdmd7Pc3Hhy+gb28nL38aHtug+bT3H/eavcWk3HssF+um3sXj8bbD7dOXV7r872Gbbx87D9ww9z3aZfeJt3+2nmL0GmkYNl+rTp3q7iLPWR3/EltK+tvD1CpuusmeC+zINHL3Rj50UNMTpoDtGdCKj6oEliBpMab4gmU29Bzm7xGWCj6mPB4Gaq+qiPj9MXZwXbeA51Q2mvm/hnNVFTKruDzM9u1lveRLJv21tOzkg/nVw1pzu/7AZecT1NnRNn/PGysaAXOgnaShRE/Z6YcY6SxEODZxxhxnNt6IQY92AsuA5m/LUOBZu935+R4M767qsfW7vRys569HQdfp3NBIdpsfzSqaBwnBqFKQpeM4hSH1AC9Rfiwfk4TpiTBn8Jdl9jKkhizKmNDUpo/SKO24CMBBGoMsRZRx2j7tYnHtdC7ptI9jAVvH9TQcOxIcEqpAKG+tBqjXRM6rbUQIjoWMRCf92pYMwwho7YI+2a5yYMGSUkIpoSkMIIyWfDyb2bCjquYkYTjbwgGnHAF6RcIChwoQxOlNf0i15jXGsqeAfmuC9TQUlZbCmUTcHpALETIMEE5ZCDpssYm3BHZqP7LU4F78BcD1PBSf6vNBXENI4Fr/9jgIAzOUXrd5gOBeJ9bBPHjJs5Ym5ucftTQZ1oxSzViAYMfuXrNxRYc4QNDUwrHwP9/2Uq+DAOfBgHPowDm7CmlCeCWYksdxhQhgHKKCqQjXlilIypJLeCMtceB94hztzCOPCm0t7qOPAOUv4Nx4E3kezXOQ78fEdaij0njJMYMRw7xOtvOimLKZJUYywTDa2DvLjkOvY4t+nxx5EixkoYzg0nplqgk24XqrLJi8felLl976tdXxxdmIN9Iq5mKRhuklil3TF/fWX0z7+f/tN4VLQs+ZN+Xn8zrh4kNmMMSKOjL+FO/ytxQ8VIZ/1DvUxgox//B5g9548hPQAA
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









