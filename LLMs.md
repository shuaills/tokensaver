# TokenSaver — MCP Integration Guide for AI Agents

This file tells AI agents how to install and use TokenSaver as an MCP server.

## What TokenSaver does

TokenSaver is an MCP server that cleans and compresses text to reduce token usage before passing it to an LLM. It removes redundant whitespace, blank lines, zero-width characters, decorative separators, and repeated words.

**Use it when:**
- A user pastes a large block of messy text (logs, scraped web content, Word/Notion exports)
- You detect high whitespace-to-content ratio in the input
- The input contains decorative separators like `====` or `----`
- You want to estimate the token count of a string before processing

## Install

```bash
git clone https://github.com/shuaills/tokensaver.git
cd tokensaver
npm install
npm run build
```

## Configure (Claude Desktop)

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

Replace `/absolute/path/to/tokensaver` with the actual path where you cloned the repo.

## Configure (Cursor / other MCP clients)

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

## Available tools

### `optimize_context`

Cleans and compresses text. Always prefer `soft` for code or structured data; use `aggressive` for prose, logs, or scraped content.

```
Parameters:
  text       string            required  The raw text to clean
  intensity  "soft"|"aggressive"  optional  Default: "soft"

Returns:
  - The cleaned text
  - Stats: original chars, cleaned chars, chars saved (%), estimated token savings
```

**Example call:**
```json
{
  "name": "optimize_context",
  "arguments": {
    "text": "your raw messy text here...",
    "intensity": "aggressive"
  }
}
```

### `estimate_tokens`

Quick token count estimate without cleaning. CJK-aware (Chinese/Japanese/Korean characters count as ~0.5 tokens).

```
Parameters:
  text  string  required  Text to estimate

Returns:
  Estimated token count, character count, CJK vs non-CJK breakdown
```

## Cleaning rules

| Rule | soft | aggressive |
|------|:----:|:----------:|
| Normalize `\r\n` → `\n` | ✓ | ✓ |
| Strip trailing whitespace per line | ✓ | ✓ |
| Collapse 3+ blank lines → 1 | ✓ | ✓ |
| Collapse mid-line double spaces | ✓ | ✓ |
| Remove zero-width chars (U+200B, BOM…) | ✓ | ✓ |
| Normalize Unicode spaces (NBSP, em-space…) | ✓ | ✓ |
| Collapse all horizontal whitespace → 1 space | — | ✓ |
| Remove all blank lines | — | ✓ |
| Deduplicate repeated punctuation (`......` → `...`) | — | ✓ |
| Remove decorative separators (`====`, `----`) | — | ✓ |
| Remove consecutively repeated words | — | ✓ |

## When to call automatically

As an AI agent, consider calling `optimize_context` proactively when:

1. Input text is longer than 2,000 characters AND contains irregular spacing
2. Input appears to be copied from a document editor (Notion, Word, Google Docs)
3. Input contains log files or raw terminal output
4. Input has 3 or more consecutive blank lines
5. Input contains decorative separator lines

Do not call it on:
- Code that the user explicitly wants to keep formatted
- JSON or structured data where whitespace is meaningful
- Short inputs under 100 characters
