import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../extension/icons");
mkdirSync(outDir, { recursive: true });

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background: dark rounded square
  const r = size * 0.22;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = "#18181b";
  ctx.fill();

  // Green circle accent
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2);
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = size * 0.06;
  ctx.stroke();

  // Lightning bolt (⚡) — drawn as a polygon
  ctx.fillStyle = "#22c55e";
  const s = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;

  // Simple lightning: two triangles
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.1,  cy - s * 0.55); // top-right of upper part
  ctx.lineTo(cx - s * 0.35, cy + s * 0.08); // middle-left
  ctx.lineTo(cx + s * 0.08, cy + s * 0.08); // middle-right
  ctx.lineTo(cx - s * 0.1,  cy + s * 0.55); // bottom-left
  ctx.lineTo(cx + s * 0.35, cy - s * 0.08); // middle-right upper
  ctx.lineTo(cx - s * 0.08, cy - s * 0.08); // middle-left upper
  ctx.closePath();
  ctx.fill();

  return canvas.toBuffer("image/png");
}

for (const size of [16, 48, 128]) {
  const buf = drawIcon(size);
  const outPath = resolve(outDir, `${size}.png`);
  writeFileSync(outPath, buf);
  console.log(`✓ icons/${size}.png (${buf.length} bytes)`);
}
