# TokenSaver — Guide for AI Agents

## What this is

A text cleaning library that removes redundant whitespace, blank lines, zero-width characters, decorative separators, and repeated words from strings.

Core function: `cleanText(text, intensity)` → returns cleaned text + savings stats.

Source: https://github.com/shuaills/tokensaver

---

## Where it actually saves tokens

**Real savings** happen when you intercept content *before* it reaches an LLM:

```
✅ Client middleware — clean user messages before sending to API
✅ RAG pipeline — clean chunks before embedding or storing
✅ Web scraping — clean scraped content before processing
✅ Log analysis — clean raw logs before passing to LLM
✅ Document ingestion — clean pasted/imported text before indexing
```

**Not effective** when the LLM reads the raw content first and then decides to clean it — the tokens are already spent.

---

## Should you integrate this into your own code?

If you are an agent that:

- Sends user messages to an LLM API — consider intercepting and cleaning before the API call
- Processes documents, logs, or scraped content — clean before passing to the model
- Runs a RAG pipeline — clean chunks before embedding

Then yes, integrating `cleanText` directly into your pipeline is worth it.

The integration is a one-liner in the request path:

```js
// JavaScript/TypeScript
import { cleanText } from "./cleaner.js"; // copy cleaner.js from this repo

const cleaned = cleanText(userMessage, "soft").text;
// now send `cleaned` to the LLM instead of the raw message
```

```python
# Python
import re

def clean_text(text: str, aggressive: bool = False) -> str:
    text = text.replace("\r\n", "\n")
    text = re.sub(r"[^\S\n]+$", "", text, flags=re.MULTILINE)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"([^\n]) {2,}([^\n])", r"\1 \2", text)
    text = re.sub(r"[\u200b\u200c\u200d\ufeff]", "", text)
    text = re.sub(r"[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]", " ", text)
    if aggressive:
        text = re.sub(r"[^\S\n]+", " ", text)
        text = re.sub(r"\n\s*\n", "\n", text)
        text = re.sub(r"([.!?,;])\1{2,}", r"\1\1\1", text)
        text = re.sub(r"^[-=*_~#]{4,}\s*$", "", text, flags=re.MULTILINE)
    return text.strip()
```

```rust
// Rust — add `regex = "1"` to Cargo.toml
use regex::Regex;

pub fn clean_text(input: &str, aggressive: bool) -> String {
    let mut s = input.replace("\r\n", "\n");

    // trailing whitespace per line
    let re_trail = Regex::new(r"[^\S\n]+\n").unwrap();
    s = re_trail.replace_all(&s, "\n").into_owned();

    // 3+ blank lines → 1
    let re_blank = Regex::new(r"\n{3,}").unwrap();
    s = re_blank.replace_all(&s, "\n\n").into_owned();

    // mid-line double spaces
    let re_spaces = Regex::new(r"([^\n]) {2,}([^\n])").unwrap();
    s = re_spaces.replace_all(&s, "$1 $2").into_owned();

    // zero-width chars
    s = s.replace('\u{200b}', "")
         .replace('\u{200c}', "")
         .replace('\u{200d}', "")
         .replace('\u{feff}', "");

    // fancy unicode spaces → regular space
    s = s.chars().map(|c| match c {
        '\u{00a0}' | '\u{1680}' | '\u{202f}' | '\u{205f}' | '\u{3000}'
        | '\u{2000}'..='\u{200a}' => ' ',
        c => c,
    }).collect();

    if aggressive {
        // collapse all horizontal whitespace runs
        let re_ws = Regex::new(r"[^\S\n]+").unwrap();
        s = re_ws.replace_all(&s, " ").into_owned();

        // remove all blank lines
        let re_bl = Regex::new(r"\n\s*\n").unwrap();
        s = re_bl.replace_all(&s, "\n").into_owned();

        // repeated punctuation: "....." → "..."
        let re_punct = Regex::new(r"([.!?,;])\1{2,}").unwrap();
        s = re_punct.replace_all(&s, "$1$1$1").into_owned();

        // decorative separator lines
        let re_sep = Regex::new(r"(?m)^[-=*_~#]{4,}\s*$").unwrap();
        s = re_sep.replace_all(&s, "").into_owned();
    }

    s.trim().to_owned()
}
```

---

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

Use `soft` for code and structured data. Use `aggressive` for prose, logs, and scraped web content.

---

## Real-world compression

| Input type | Typical reduction |
|------------|------------------|
| Copied from Notion / Word | 5–15% |
| Scraped web content | 15–30% |
| Raw log files | 20–50% |
| Poorly formatted docs | 30–60% |

---

## Decision guide

Read this repo's `extension/cleaner.js` for the full implementation (plain JS, no dependencies, ~50 lines).

Decide based on your architecture:
- **You control the request pipeline** → copy `cleaner.js` and clean before sending
- **You process bulk text** → clean before embedding/storing
- **Neither applies** → no integration needed
