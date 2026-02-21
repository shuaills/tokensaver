// TokenSaver — Content Script
// Intercepts paste events, cleans text, shows a savings toast.
// Cleaner logic is inlined (content scripts don't support ES module imports).

// ---------- Cleaner ----------
function estimateTokens(text) {
  const cjk = (text.match(/[\u4e00-\u9fff\u3040-\u30ff]/g) || []).length;
  const rest = text.length - cjk;
  return Math.ceil(cjk / 2 + rest / 4);
}

function cleanText(raw, intensity = "soft") {
  const originalChars = raw.length;
  let text = raw;

  text = text.replace(/\r\n/g, "\n");
  text = text.replace(/[^\S\n]+$/gm, "");
  text = text.replace(/^( {4,})\n/gm, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/([^\n]) {2,}([^\n])/g, "$1 $2");
  text = text.replace(/[\u200b\u200c\u200d\ufeff]/g, "");
  text = text.replace(/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g, " ");
  text = text.trim();

  if (intensity === "aggressive") {
    text = text.replace(/[^\S\n]+/g, " ");
    text = text.replace(/\n\s*\n/g, "\n");
    text = text.replace(/([.!?,;])\1{2,}/g, "$1$1$1");
    text = text.replace(/^[-=*_~#]{4,}\s*$/gm, "");
    text = text.replace(/\b(\w+)( \1){2,}\b/gi, "$1");
    text = text.trim();
  }

  const cleanedChars = text.length;
  const savedChars = originalChars - cleanedChars;
  const savedPct =
    originalChars > 0
      ? ((savedChars / originalChars) * 100).toFixed(1)
      : "0.0";
  const estimatedTokenSavings = estimateTokens(raw) - estimateTokens(text);

  return { text, originalChars, cleanedChars, savedChars, savedPct, estimatedTokenSavings };
}

// ---------- State ----------
const MIN_CHARS = 100;
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

    const raw = e.clipboardData && e.clipboardData.getData("text/plain");
    if (!raw || raw.length < MIN_CHARS) return;

    const result = cleanText(raw, intensity);
    if (result.savedChars <= 0) return;

    e.preventDefault();
    e.stopPropagation();

    insertText(result.text);
    showToast(result);

    chrome.storage.local.get({ totalSaved: 0 }, (s) => {
      chrome.storage.local.set({ totalSaved: (s.totalSaved || 0) + result.savedChars });
    });
  },
  true
);

// ---------- Text insertion ----------
function insertText(text) {
  const el = document.activeElement;
  if (!el) return;

  if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
    const start = el.selectionStart != null ? el.selectionStart : el.value.length;
    const end = el.selectionEnd != null ? el.selectionEnd : el.value.length;
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    el.selectionStart = el.selectionEnd = start + text.length;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  if (el.isContentEditable || el.closest("[contenteditable]")) {
    document.execCommand("insertText", false, text);
    return;
  }

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

  if (!document.getElementById("tokensaver-style")) {
    const style = document.createElement("style");
    style.id = "tokensaver-style";
    style.textContent =
      "@keyframes tokensaver-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}";
    document.head.appendChild(style);
  }

  const toast = document.createElement("div");
  toast.id = "tokensaver-toast";
  toast.innerHTML =
    '<span style="font-size:16px">⚡</span>' +
    "<span><strong>TokenSaver</strong> — saved&nbsp;<strong>" +
    savedChars.toLocaleString() +
    "</strong>&nbsp;chars (~<strong>" +
    estimatedTokenSavings.toLocaleString() +
    "</strong>&nbsp;tokens,&nbsp;" +
    savedPct +
    "%)</span>" +
    '<button id="tokensaver-close" title="Dismiss" style="background:none;border:none;color:#71717a;cursor:pointer;font-size:14px;padding:0 0 0 4px;margin-left:4px">✕</button>';

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
    animation: "tokensaver-in 0.2s ease",
    border: "1px solid #3f3f46",
  });

  document.body.appendChild(toast);
  document.getElementById("tokensaver-close").onclick = () => toast.remove();
  setTimeout(() => toast && toast.remove(), 4000);
}
