const INTENSITY_DESC = {
  soft: "Safe whitespace normalization. Preserves code structure and indentation.",
  aggressive:
    "Also removes blank lines, decorative separators (====, ----), and repeated words. Best for prose/logs.",
};

const toggle = document.getElementById("toggle");
const statusText = document.getElementById("status-text");
const intensityBtns = document.querySelectorAll(".intensity-btn");
const intensityDesc = document.getElementById("intensity-desc");
const statChars = document.getElementById("stat-chars");
const statTokens = document.getElementById("stat-tokens");
const resetBtn = document.getElementById("reset-btn");

// ---------- Load prefs ----------
chrome.storage.sync.get({ enabled: true, intensity: "soft" }, ({ enabled, intensity }) => {
  toggle.checked = enabled;
  statusText.textContent = enabled ? "Intercepting paste events" : "Paused";
  setIntensity(intensity);
});

// ---------- Load session stats ----------
function loadStats() {
  chrome.storage.session?.get({ totalSaved: 0 }, ({ totalSaved }) => {
    statChars.textContent = Number(totalSaved).toLocaleString();
    statTokens.textContent = "~" + Math.ceil(totalSaved / 4).toLocaleString();
  });
}
loadStats();

// ---------- Toggle ----------
toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  statusText.textContent = enabled ? "Intercepting paste events" : "Paused";
  chrome.storage.sync.set({ enabled });
});

// ---------- Intensity ----------
function setIntensity(val) {
  intensityBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.val === val);
  });
  intensityDesc.textContent = INTENSITY_DESC[val] || "";
}

intensityBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const val = btn.dataset.val;
    setIntensity(val);
    chrome.storage.sync.set({ intensity: val });
  });
});

// ---------- Reset ----------
resetBtn.addEventListener("click", () => {
  chrome.storage.session?.set({ totalSaved: 0 });
  statChars.textContent = "0";
  statTokens.textContent = "~0";
});
