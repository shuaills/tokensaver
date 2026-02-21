#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { cleanText } from "./cleaner.js";

const server = new McpServer({
  name: "tokensaver",
  version: "1.0.0",
});

server.tool(
  "optimize_context",
  "Clean and compress text to reduce token usage before sending to an LLM. " +
    "Removes redundant whitespace, repeated punctuation, zero-width chars, and decorative lines. " +
    "Returns the optimized text and estimated token savings.",
  {
    text: z.string().describe("The raw text to optimize"),
    intensity: z
      .enum(["soft", "aggressive"])
      .default("soft")
      .describe(
        "soft: safe whitespace normalization only. " +
          "aggressive: also collapses blank lines, removes decorative separators, " +
          "and deduplicates repeated words."
      ),
  },
  async ({ text, intensity }) => {
    const result = cleanText(text, intensity);
    const pct =
      result.originalChars > 0
        ? ((result.savedChars / result.originalChars) * 100).toFixed(1)
        : "0.0";

    return {
      content: [
        {
          type: "text",
          text: result.text,
        },
        {
          type: "text",
          text:
            `\n---\n` +
            `📊 TokenSaver stats:\n` +
            `  Original:  ${result.originalChars.toLocaleString()} chars\n` +
            `  Cleaned:   ${result.cleanedChars.toLocaleString()} chars\n` +
            `  Saved:     ${result.savedChars.toLocaleString()} chars (${pct}%)\n` +
            `  Est. token savings: ~${result.estimatedTokenSavings.toLocaleString()}`,
        },
      ],
    };
  }
);

server.tool(
  "estimate_tokens",
  "Quickly estimate the token count of a text string without cleaning it.",
  {
    text: z.string().describe("Text to estimate token count for"),
  },
  async ({ text }) => {
    const cjk = (text.match(/[\u4e00-\u9fff\u3040-\u30ff]/g) || []).length;
    const rest = text.length - cjk;
    const estimate = Math.ceil(cjk / 2 + rest / 4);

    return {
      content: [
        {
          type: "text",
          text:
            `Estimated tokens: ~${estimate.toLocaleString()}\n` +
            `Characters: ${text.length.toLocaleString()}\n` +
            `(CJK chars: ${cjk.toLocaleString()}, other: ${rest.toLocaleString()})`,
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TokenSaver MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
