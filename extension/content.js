// TokenSaver — Content Script
// Intercepts paste events, cleans text, shows a savings toast.

import { cleanText } from "./cleaner.js";

const MIN_CHARS = 100; // don't bother cleaning tiny pastes

// ---------- State (synced from popup via chrome.storage) ----------
let enabled = true;
let intensity = "soft";

chrome.storage.sync.get({ enabled: true, intensity: "soft" }, (prefs) => {
  enabled = prefs.enabled;
  intensity = prefs.intensity;
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled !== undefined) enabled = changes.enabled.newValue;
  if (changes.intensity !== undefined) intensity = changes.intensity.newValue;
});

// ---------- Paste interception ----------
document.addEventListener(
  "paste",
  (e) => {
    if (!enabled) return;

    const raw = e.clipboardData?.getData("text/plain");
    if (!raw || raw.length < MIN_CHARS) return;

    const result = cleanText(raw, intensity);
    if (result.savedChars <= 0) return; // nothing to save

    e.preventDefault();
    e.stopPropagation();

    insertText(result.text);
    showToast(result);

    // Accumulate session stats
    chrome.storage.session?.get({ totalSaved: 0 }, (s) => {
      chrome.storage.session?.set({ totalSaved: (s.totalSaved || 0) + result.savedChars });
    });
  },
  true // capture phase — fires before the page's own listeners
);

// ---------- Text insertion ----------
function insertText(text) {
  const el = document.activeElement;
  if (!el) return;

  if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    el.selectionStart = el.selectionEnd = start + text.length;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  // contenteditable (Claude, ChatGPT, etc.)
  if (el.isContentEditable || el.closest("[contenteditable]")) {
    // execCommand works in all current browsers for this use case
    document.execCommand("insertText", false, text);
    return;
  }

  // Fallback: find the nearest contenteditable
  const ce = document.querySelector("[contenteditable='true']");
  if (ce) {
    ce.focus();
    document.execCommand("insertText", false, text);
  }
}

// ---------- Toast ----------
function showToast({ savedChars, savedPct, estimatedTokenSavings }) {
  const existing = document.getElementById("tokensaver-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "tokensaver-toast";
  toast.innerHTML = `
    <span style="font-size:16px">⚡</span>
    <span>
      <strong>TokenSaver</strong> — saved&nbsp;<strong>${savedChars.toLocaleString()}</strong>&nbsp;chars
      (~<strong>${estimatedTokenSavings.toLocaleString()}</strong>&nbsp;tokens,&nbsp;${savedPct}%)
    </span>
    <button id="tokensaver-close" title="Dismiss">✕</button>
  `;

  Object.assign(toast.style, {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: "2147483647",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#18181b",
    color: "#f4f4f5",
    padding: "10px 16px",
    borderRadius: "10px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
    fontSize: "13px",
    fontFamily: "system-ui, sans-serif",
    lineHeight: "1.4",
    maxWidth: "380px",
    cursor: "default",
    animation: "tokensaver-in 0.2s ease",
    border: "1px solid #3f3f46",
  });

  // Inject keyframe once
  if (!document.getElementById("tokensaver-style")) {
    const style = document.createElement("style");
    style.id = "tokensaver-style";
    style.textContent = `
      @keyframes tokensaver-in {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  const closeBtn = document.getElementById("tokensaver-close");
  Object.assign(closeBtn.style, {
    background: "none",
    border: "none",
    color: "#71717a",
    cursor: "pointer",
    fontSize: "14px",
    padding: "0 0 0 4px",
    marginLeft: "4px",
  });
  closeBtn.onclick = () => toast.remove();

  // Auto-dismiss after 4 s
  setTimeout(() => toast?.remove(), 4000);
}
