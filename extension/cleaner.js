// Shared cleaning logic — used by both content.js and popup.js
// No build step needed: plain ES module

/**
 * @param {string} text
 * @returns {number}
 */
function estimateTokens(text) {
  const cjk = (text.match(/[\u4e00-\u9fff\u3040-\u30ff]/g) || []).length;
  const rest = text.length - cjk;
  return Math.ceil(cjk / 2 + rest / 4);
}

/**
 * @param {string} raw
 * @param {'soft'|'aggressive'} intensity
 * @returns {{ text: string, originalChars: number, cleanedChars: number, savedChars: number, savedPct: string, estimatedTokenSavings: number }}
 */
export function cleanText(raw, intensity = "soft") {
  const originalChars = raw.length;
  let text = raw;

  // --- Always applied ---
  text = text.replace(/\r\n/g, "\n");
  text = text.replace(/[^\S\n]+$/gm, "");           // trailing spaces per line
  text = text.replace(/^( {4,})\n/gm, "\n");        // leading blank-only indents
  text = text.replace(/\n{3,}/g, "\n\n");            // 3+ blank lines → 1
  text = text.replace(/([^\n]) {2,}([^\n])/g, "$1 $2"); // mid-line double spaces
  text = text.replace(/[\u200b\u200c\u200d\ufeff]/g, ""); // zero-width chars
  text = text.replace(/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g, " "); // fancy spaces
  text = text.trim();

  if (intensity === "aggressive") {
    text = text.replace(/[^\S\n]+/g, " ");           // all horizontal runs → 1 space
    text = text.replace(/\n\s*\n/g, "\n");           // all blank lines removed
    text = text.replace(/([.!?,;])\1{2,}/g, "$1$1$1"); // repeated punctuation
    text = text.replace(/^[-=*_~#]{4,}\s*$/gm, ""); // decorative separator lines
    text = text.replace(/\b(\w+)( \1){2,}\b/gi, "$1"); // repeated words
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
