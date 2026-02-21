# ⚡ TokenSaver

**Automatically clean and compress text before it reaches your LLM — saving tokens, money, and context window space.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-compatible-blueviolet)](https://modelcontextprotocol.io)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-yellow?logo=googlechrome)](extension/)
[![GitHub](https://img.shields.io/badge/GitHub-shuaills%2Ftokensaver-black?logo=github)](https://github.com/shuaills/tokensaver)

---

## The Problem

Every time you paste a wall of text into Claude, ChatGPT, or any LLM, you're also pasting:

- Trailing spaces on every line
- Three blank lines where one would do
- `========================` decorative separators
- Zero-width characters from Word/Notion
- Repeated words from sloppy copy-paste

All of these cost **real tokens**. At scale (RAG pipelines, batch jobs, daily usage) the waste adds up fast.

TokenSaver removes all of it — transparently, before the text ever reaches the model.

---

## Ecosystem

TokenSaver ships as two components that share the same cleaning core:

```
┌─────────────────────┐     ┌──────────────────────────────┐
│  Chrome Extension   │     │       MCP Server             │
│                     │     │                              │
│  Intercepts paste   │     │  Tool: optimize_context      │
│  events on Claude,  │     │  Tool: estimate_tokens       │
│  ChatGPT, Gemini…   │     │                              │
│  Shows token        │     │  LLM calls it proactively    │
│  savings toast      │     │  when input looks noisy      │
└─────────────────────┘     └──────────────────────────────┘
         │                                │
         └──────────────┬─────────────────┘
                        ▼
              ┌──────────────────┐
              │   cleaner core   │
              │  (regex engine)  │
              └──────────────────┘
```

---

## Chrome Extension

### Install (development)

1. Clone this repo
2. Open Chrome → `chrome://extensions` → enable **Developer mode**
3. Click **Load unpacked** → select the `extension/` folder
4. [Generate icons](extension/icons/README.md) (optional but recommended)

### What it does

- Intercepts **paste events** on Claude, ChatGPT, Gemini, Perplexity, Grok, and Poe
- Replaces the pasted content with a cleaned version
- Shows a **toast notification** with chars saved, tokens saved, and compression %
- Accumulates **session stats** visible in the popup

### Popup controls

| Control | Description |
|---------|-------------|
| Toggle | Pause/resume interception on the current site |
| Soft | Safe whitespace normalization (default, code-safe) |
| Aggressive | Also removes blank lines, decorative separators, repeated words |
| Session stats | Chars and estimated tokens saved since the browser session started |

---

## MCP Server

Exposes two tools any MCP-compatible client (Claude Desktop, Cursor, etc.) can call.

### Install

```bash
git clone https://github.com/shuaills/tokensaver
cd tokensaver
npm install
npm run build
```

### Connect to Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "tokensaver": {
      "command": "node",
      "args": ["/absolute/path/to/tokensaver/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop. The tools are now available.

### Tools

#### `optimize_context`

Clean text before passing it to the model.

```
Input:
  text       string   required  Raw text to optimize
  intensity  string   optional  "soft" (default) | "aggressive"

Output:
  Cleaned text + stats block showing chars saved, % reduction, estimated token savings
```

**Example prompt:** *"Here's a log file, analyze it for errors: [paste 50 KB of messy logs]"*
→ Claude calls `optimize_context` → receives 30 KB instead → same answer, 40% cheaper.

#### `estimate_tokens`

Quick token count estimate without cleaning.

```
Input:
  text  string  required  Text to estimate

Output:
  Estimated token count (CJK-aware: ~2 chars/token for CJK, ~4 for Latin)
```

---

## Cleaning Rules

| Rule | Soft | Aggressive |
|------|:----:|:----------:|
| Normalize Windows line endings (`\r\n` → `\n`) | ✓ | ✓ |
| Strip trailing whitespace per line | ✓ | ✓ |
| Collapse 3+ blank lines → 1 blank line | ✓ | ✓ |
| Collapse mid-line double spaces → single | ✓ | ✓ |
| Remove zero-width characters (`\u200b`, BOM, etc.) | ✓ | ✓ |
| Normalize fancy Unicode spaces (NBSP, em-space, etc.) | ✓ | ✓ |
| Collapse all horizontal whitespace runs → 1 space | — | ✓ |
| Remove all blank lines between paragraphs | — | ✓ |
| Deduplicate repeated punctuation (`......` → `...`) | — | ✓ |
| Remove decorative separator lines (`====`, `----`) | — | ✓ |
| Remove consecutively repeated words (`the the` → `the`) | — | ✓ |

> **Soft** is safe for code, JSON, and structured data.
> **Aggressive** is best for prose, logs, and scraped web content.

---

## Real-world savings

| Input type | Typical reduction |
|------------|------------------|
| Copied from Notion / Word | 5–15% |
| Scraped web content | 15–30% |
| Raw log files | 20–50% |
| Poorly formatted docs | 30–60% |

---

## Development

```bash
npm install          # install dependencies
npm run dev          # run MCP server with hot reload (tsx)
npm run build        # compile to dist/
```

The Chrome extension requires no build step — it runs directly from `extension/`.

---

## Roadmap

- [ ] Firefox extension
- [ ] `npm` package (`import { cleanText } from "tokensaver"`) for RAG pipelines
- [ ] Proper tiktoken-based token counting (via `@dqbd/tiktoken`)
- [ ] Per-site toggle in extension popup
- [ ] VS Code extension

---

## Contributing

PRs welcome. The core logic lives in:
- `src/cleaner.ts` — MCP server version (TypeScript)
- `extension/cleaner.js` — extension version (plain ES module, no build)

Both must stay in sync. If you add a cleaning rule, add it to both files and add a row to the cleaning rules table above.

---

## License

MIT — see [LICENSE](LICENSE).
