export type Intensity = "soft" | "aggressive";

export interface CleanResult {
  text: string;
  originalChars: number;
  cleanedChars: number;
  savedChars: number;
  estimatedTokenSavings: number;
}

// Rough estimate: 1 token ≈ 4 chars for English, ~2 for CJK
function estimateTokens(text: string): number {
  const cjk = (text.match(/[\u4e00-\u9fff\u3040-\u30ff]/g) || []).length;
  const rest = text.length - cjk;
  return Math.ceil(cjk / 2 + rest / 4);
}

export function cleanText(raw: string, intensity: Intensity): CleanResult {
  const originalChars = raw.length;
  let text = raw;

  // --- Soft: safe normalizations ---
  // Normalize Windows line endings
  text = text.replace(/\r\n/g, "\n");
  // Collapse trailing whitespace on each line
  text = text.replace(/[^\S\n]+$/gm, "");
  // Collapse leading whitespace on each line (keep indentation structure but strip pure blank prefix runs)
  // Only collapse runs of 4+ spaces at start not followed by code-like content
  text = text.replace(/^( {4,})\n/gm, "\n");
  // Collapse multiple blank lines into a single blank line
  text = text.replace(/\n{3,}/g, "\n\n");
  // Normalize multiple spaces into one (outside of leading indentation)
  text = text.replace(/([^\n]) {2,}([^\n])/g, "$1 $2");
  // Remove zero-width characters
  text = text.replace(/[\u200b\u200c\u200d\ufeff]/g, "");
  // Normalize Unicode whitespace variants to regular space
  text = text.replace(/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g, " ");
  // Trim leading/trailing blank lines
  text = text.trim();

  if (intensity === "aggressive") {
    // Collapse all horizontal whitespace runs to single space
    text = text.replace(/[^\S\n]+/g, " ");
    // Collapse blank lines more aggressively (zero blank lines between paragraphs)
    text = text.replace(/\n\s*\n/g, "\n");
    // Remove repeated punctuation (e.g. "....." → "...")
    text = text.replace(/([.!?,;])\1{2,}/g, "$1$1$1");
    // Remove decorative separator lines (----, ====, ****  etc.)
    text = text.replace(/^[-=*_~#]{4,}\s*$/gm, "");
    // Collapse repeated words (e.g. "the the" → "the")
    text = text.replace(/\b(\w+)( \1){2,}\b/gi, "$1");
    // Trim again after aggressive passes
    text = text.trim();
  }

  const cleanedChars = text.length;
  const savedChars = originalChars - cleanedChars;
  const estimatedTokenSavings = estimateTokens(raw) - estimateTokens(text);

  return {
    text,
    originalChars,
    cleanedChars,
    savedChars,
    estimatedTokenSavings,
  };
}
