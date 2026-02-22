import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../store-assets");
mkdirSync(outDir, { recursive: true });

// ─── helpers ────────────────────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function lightning(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.10, cy - s * 0.52);
  ctx.lineTo(cx - s * 0.32, cy + 0.06 * s);
  ctx.lineTo(cx + s * 0.08, cy + 0.06 * s);
  ctx.lineTo(cx - s * 0.10, cy + s * 0.52);
  ctx.lineTo(cx + s * 0.32, cy - 0.06 * s);
  ctx.lineTo(cx - s * 0.08, cy - 0.06 * s);
  ctx.closePath();
}

// ─── 128×128 store icon (no alpha — solid bg) ───────────────────────────────

function makeIcon128() {
  const c = createCanvas(128, 128);
  const ctx = c.getContext("2d");

  // solid dark bg (no alpha)
  ctx.fillStyle = "#18181b";
  ctx.fillRect(0, 0, 128, 128);

  // green rounded square
  roundRect(ctx, 8, 8, 112, 112, 22);
  ctx.fillStyle = "#22c55e";
  ctx.fill();

  // dark inset
  roundRect(ctx, 14, 14, 100, 100, 18);
  ctx.fillStyle = "#18181b";
  ctx.fill();

  // lightning bolt
  lightning(ctx, 64, 64, 52);
  ctx.fillStyle = "#22c55e";
  ctx.fill();

  writeFileSync(resolve(outDir, "icon-128.png"), c.toBuffer("image/png"));
  console.log("✓ icon-128.png");
}

// ─── screenshot helper ───────────────────────────────────────────────────────

const W = 1280, H = 800;
const BG     = "#09090b";
const PANEL  = "#18181b";
const BORDER = "#27272a";
const GREEN  = "#22c55e";
const MUTED  = "#71717a";
const TEXT   = "#f4f4f5";
const SUBTEXT= "#a1a1aa";

// ─── screenshot 1: browser + toast ──────────────────────────────────────────

function makeScreenshot1() {
  const c = createCanvas(W, H);
  const ctx = c.getContext("2d");

  // page background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // ── fake browser chrome ──
  ctx.fillStyle = "#111113";
  ctx.fillRect(0, 0, W, 52);
  ctx.fillStyle = BORDER;
  ctx.fillRect(0, 52, W, 1);

  // address bar
  roundRect(ctx, W/2 - 220, 13, 440, 26, 6);
  ctx.fillStyle = "#1c1c1f";
  ctx.fill();
  ctx.font = "12px system-ui";
  ctx.fillStyle = MUTED;
  ctx.textAlign = "center";
  ctx.fillText("claude.ai", W/2, 31);

  // tab
  roundRect(ctx, 80, 10, 160, 30, 5);
  ctx.fillStyle = PANEL;
  ctx.fill();
  ctx.font = "12px system-ui";
  ctx.fillStyle = SUBTEXT;
  ctx.textAlign = "left";
  ctx.fillText("Claude", 100, 30);

  // ── sidebar ──
  ctx.fillStyle = "#111113";
  ctx.fillRect(0, 53, 220, H - 53);
  ctx.fillStyle = BORDER;
  ctx.fillRect(220, 53, 1, H - 53);

  ctx.font = "bold 13px system-ui";
  ctx.fillStyle = SUBTEXT;
  ctx.fillText("New conversation", 24, 90);

  const histItems = ["Analyze server logs", "Draft email to team", "Explain transformer arch", "Debug Python script"];
  histItems.forEach((t, i) => {
    ctx.font = "12px system-ui";
    ctx.fillStyle = i === 0 ? TEXT : MUTED;
    ctx.fillText(t, 24, 130 + i * 36);
  });

  // ── main chat area ──
  const chatX = 221, chatW = W - 221;

  // assistant bubble
  roundRect(ctx, chatX + 40, 80, chatW - 80, 180, 12);
  ctx.fillStyle = PANEL;
  ctx.fill();

  ctx.font = "bold 13px system-ui";
  ctx.fillStyle = GREEN;
  ctx.fillText("Claude", chatX + 64, 110);

  const lines = [
    "I've analyzed the pasted content. Here's a summary of the key findings:",
    "",
    "  • 3 critical errors found in lines 847–912",
    "  • Memory leak detected in the worker thread pool",
    "  • Recommendation: increase connection pool timeout to 30s",
  ];
  ctx.font = "13px system-ui";
  ctx.fillStyle = TEXT;
  lines.forEach((l, i) => ctx.fillText(l, chatX + 64, 136 + i * 22));

  // user bubble (the pasted content, already cleaned)
  roundRect(ctx, chatX + 40, 290, chatW - 80, 100, 12);
  ctx.fillStyle = "#1e1e24";
  ctx.fill();
  ctx.font = "bold 13px system-ui";
  ctx.fillStyle = SUBTEXT;
  ctx.fillText("You", chatX + 64, 318);
  ctx.font = "13px system-ui";
  ctx.fillStyle = SUBTEXT;
  ctx.fillText("Here are the logs from last night's deployment — please analyze for errors.", chatX + 64, 342);
  ctx.fillText("[8.4 KB of log content, auto-cleaned by TokenSaver]", chatX + 64, 364);

  // input box
  roundRect(ctx, chatX + 40, H - 100, chatW - 80, 60, 12);
  ctx.fillStyle = PANEL;
  ctx.fill();
  roundRect(ctx, chatX + 40, H - 100, chatW - 80, 60, 12);
  ctx.strokeStyle = GREEN + "55";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = "13px system-ui";
  ctx.fillStyle = MUTED;
  ctx.fillText("Message Claude…", chatX + 64, H - 64);

  // ── TOAST ────────────────────────────────────────────────────────────────
  const tx = W - 420, ty = H - 90, tw = 392, th = 56;
  roundRect(ctx, tx, ty, tw, th, 10);
  ctx.fillStyle = "#1f1f23";
  ctx.fill();
  roundRect(ctx, tx, ty, tw, th, 10);
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // glow
  ctx.shadowColor = GREEN;
  ctx.shadowBlur = 18;
  roundRect(ctx, tx, ty, tw, th, 10);
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // icon
  ctx.font = "bold 20px system-ui";
  ctx.fillStyle = GREEN;
  ctx.textAlign = "left";
  ctx.fillText("⚡", tx + 14, ty + 36);

  // text
  ctx.font = "bold 13px system-ui";
  ctx.fillStyle = TEXT;
  ctx.fillText("TokenSaver", tx + 42, ty + 24);

  ctx.font = "12px system-ui";
  ctx.fillStyle = SUBTEXT;
  ctx.fillText("Saved  ", tx + 42, ty + 43);

  ctx.font = "bold 12px system-ui";
  ctx.fillStyle = GREEN;
  ctx.fillText("2,242 chars", tx + 84, ty + 43);

  ctx.font = "12px system-ui";
  ctx.fillStyle = SUBTEXT;
  ctx.fillText("  (~561 tokens, 75.7%)", tx + 152, ty + 43);

  writeFileSync(resolve(outDir, "screenshot-1.png"), c.toBuffer("image/png"));
  console.log("✓ screenshot-1.png  (browser + toast)");
}

// ─── screenshot 2: popup UI close-up ─────────────────────────────────────────

function makeScreenshot2() {
  const c = createCanvas(W, H);
  const ctx = c.getContext("2d");

  // blurred bg
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // decorative grid lines
  ctx.strokeStyle = "#ffffff08";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // glow blob
  const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 400);
  grad.addColorStop(0, "#22c55e18");
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // ── popup card ────────────────────────────────────────────────────────────
  const pw = 320, ph = 480;
  const px = (W - pw) / 2, py = (H - ph) / 2;

  // shadow
  ctx.shadowColor = "#000000aa";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 20;
  roundRect(ctx, px, py, pw, ph, 16);
  ctx.fillStyle = PANEL;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // border
  roundRect(ctx, px, py, pw, ph, 16);
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── header ──
  ctx.font = "bold 22px system-ui";
  ctx.fillStyle = GREEN;
  ctx.textAlign = "left";
  ctx.fillText("⚡", px + 20, py + 44);

  ctx.font = "bold 16px system-ui";
  ctx.fillStyle = TEXT;
  ctx.fillText("TokenSaver", px + 50, py + 38);

  ctx.font = "12px system-ui";
  ctx.fillStyle = MUTED;
  ctx.fillText("LLM context optimizer", px + 50, py + 55);

  ctx.fillStyle = BORDER;
  ctx.fillRect(px, py + 68, pw, 1);

  // ── toggle row ──
  ctx.font = "bold 13px system-ui";
  ctx.fillStyle = TEXT;
  ctx.fillText("Active on this site", px + 20, py + 96);
  ctx.font = "11px system-ui";
  ctx.fillStyle = GREEN;
  ctx.fillText("Intercepting paste events", px + 20, py + 113);

  // toggle (ON)
  roundRect(ctx, px + pw - 60, py + 88, 40, 22, 11);
  ctx.fillStyle = GREEN;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(px + pw - 60 + 28, py + 88 + 11, 8, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();

  ctx.fillStyle = BORDER;
  ctx.fillRect(px, py + 128, pw, 1);

  // ── intensity section ──
  ctx.font = "bold 10px system-ui";
  ctx.fillStyle = MUTED;
  ctx.fillText("CLEANING INTENSITY", px + 20, py + 152);

  // Soft button (active)
  roundRect(ctx, px + 20, py + 162, 130, 34, 7);
  ctx.fillStyle = "#22c55e22";
  ctx.fill();
  roundRect(ctx, px + 20, py + 162, 130, 34, 7);
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = "bold 13px system-ui";
  ctx.fillStyle = GREEN;
  ctx.textAlign = "center";
  ctx.fillText("Soft", px + 85, py + 184);

  // Aggressive button
  roundRect(ctx, px + 162, py + 162, 138, 34, 7);
  ctx.fillStyle = "#27272a";
  ctx.fill();
  roundRect(ctx, px + 162, py + 162, 138, 34, 7);
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = "13px system-ui";
  ctx.fillStyle = MUTED;
  ctx.fillText("Aggressive", px + 231, py + 184);

  ctx.font = "11px system-ui";
  ctx.fillStyle = MUTED;
  ctx.textAlign = "left";
  ctx.fillText("Safe whitespace normalization.", px + 20, py + 214);
  ctx.fillText("Preserves code structure and indentation.", px + 20, py + 230);

  ctx.fillStyle = BORDER;
  ctx.fillRect(px, py + 248, pw, 1);

  // ── stats section ──
  ctx.font = "bold 10px system-ui";
  ctx.fillStyle = MUTED;
  ctx.fillText("SESSION STATS", px + 20, py + 270);

  // chars card
  roundRect(ctx, px + 20, py + 282, 130, 72, 10);
  ctx.fillStyle = "#1c1c20";
  ctx.fill();
  ctx.font = "bold 28px system-ui";
  ctx.fillStyle = GREEN;
  ctx.textAlign = "center";
  ctx.fillText("2,242", px + 85, py + 320);
  ctx.font = "11px system-ui";
  ctx.fillStyle = MUTED;
  ctx.fillText("chars saved", px + 85, py + 340);

  // tokens card
  roundRect(ctx, px + 162, py + 282, 138, 72, 10);
  ctx.fillStyle = "#1c1c20";
  ctx.fill();
  ctx.font = "bold 28px system-ui";
  ctx.fillStyle = GREEN;
  ctx.textAlign = "center";
  ctx.fillText("~561", px + 231, py + 320);
  ctx.font = "11px system-ui";
  ctx.fillStyle = MUTED;
  ctx.fillText("tokens saved", px + 231, py + 340);

  ctx.fillStyle = BORDER;
  ctx.fillRect(px, py + 368, pw, 1);

  // ── footer ──
  ctx.font = "11px system-ui";
  ctx.fillStyle = "#3f3f46";
  ctx.textAlign = "left";
  ctx.fillText("github.com/shuaills/tokensaver", px + 20, py + 392);
  ctx.textAlign = "right";
  ctx.fillText("Reset stats", px + pw - 20, py + 392);

  // ── label outside card ────────────────────────────────────────────────────
  ctx.font = "bold 22px system-ui";
  ctx.fillStyle = TEXT;
  ctx.textAlign = "center";
  ctx.fillText("Clean paste. Save tokens. Zero config.", W / 2, py - 40);

  ctx.font = "15px system-ui";
  ctx.fillStyle = MUTED;
  ctx.fillText("Works on Claude · ChatGPT · Gemini · Perplexity · Grok", W / 2, py - 12);

  writeFileSync(resolve(outDir, "screenshot-2.png"), c.toBuffer("image/png"));
  console.log("✓ screenshot-2.png  (popup UI)");
}

// ─── run ────────────────────────────────────────────────────────────────────
makeIcon128();
makeScreenshot1();
makeScreenshot2();
console.log("\nAll assets saved to store-assets/");
