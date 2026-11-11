# StyleScent: Technical Design Document

| | |
|---|---|
| **Companion doc** | `prd.md` (what we are building and why) |
| **Runtime** | Node.js (current LTS), ES modules, plain JavaScript |
| **Document date** | 10 November 2026 |

---

## 0. Rules for the coding agent (read first)

1. **Read `prd.md` and this file before every task.** Work one milestone at a time (§13). At the end of each milestone, run the tests, then stop and summarise what changed.
2. **Never invent Nonilion API endpoints, payloads or auth.** Nonilion's Bot API details come from the developer guide, which we do not have yet. All Nonilion-specific code lives in `src/nonilion/` behind the interface in §8. Until the guide is provided, implement the interface with a local stub and mark gaps with `// TODO(NONILION_GUIDE)`.
3. **No secrets in code.** Keys come from environment variables. Provide `.env.example`. Add `.env` to `.gitignore`. Never log keys.
4. **Deterministic logic stays deterministic.** Colour maths, pattern rules, fragrance scoring and the checker are plain functions with unit tests. The LLM is used only to (a) understand the request, (b) read images, and (c) write the final explanation.
5. **Never fabricate fragrances.** The agent may only recommend fragrance IDs that exist in `data/perfumes.json`.
6. **Keep it small.** Minimal dependencies (§2). No frameworks beyond those listed.
7. **Comment for explanation.** The team must justify design decisions to judges, so every module starts with a short comment on what it does and why.
8. **Do not call external data sources or scrape websites** for fragrance or colour data.

---

## 1. Architecture

```
 Nonilion user (chat / @mention / image upload)
              |
              v
   +-----------------------+
   |  Nonilion adapter     |   src/nonilion/   <- only place that knows Nonilion's API
   +-----------------------+
              | NormalizedRequest { text, images[], userId, channel }
              v
   +---------------------------------------------------------+
   |  Orchestrator  (src/agent/orchestrator.js)              |
   |   1. Understand   -> slots                              |
   |   2. Clarify?     -> return one question and stop       |
   |   3. Plan         -> short visible plan                 |
   |   4. Act          -> specialists + tools                |
   |        +-- Wardrobe specialist (colour + pattern tools) |
   |        +-- Fragrance specialist (matcher tool)          |
   |   5. Compose      -> draft reply                        |
   |   6. Check        -> pass, or revise once               |
   |   7. Format       -> chat markdown + files + image      |
   +---------------------------------------------------------+
              | NormalizedResponse { text, files[], images[], progress[] }
              v
   +-----------------------+
   |  Nonilion adapter     |   delivers text, files, images, progress updates
   +-----------------------+
```

**Key design choice:** the agent core never imports anything from `src/nonilion/`. The core is tested through a local harness (§8.3), so work is not blocked while we wait for Nonilion's developer guide.

## 2. Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Runtime | Node.js LTS, ESM | `"type": "module"` |
| HTTP server | `express` | webhook, `/health`, `/dev/chat` |
| LLM | `@google/genai` (default), behind our own `llm.js` wrapper | Provider and model set by env vars. Use a current fast model that supports image input and JSON output; **confirm the exact model ID in Google's docs** and do not hardcode it. |
| Validation | `zod` | Validate dataset files, LLM JSON outputs, tool inputs |
| Image rendering | `sharp` (SVG template to PNG) | Alternative: `@resvg/resvg-js` |
| CSV | built-in string building (no dependency) | Quote fields correctly |
| Logging | `pino` | One trace per request |
| Tests | `node:test` and `node:assert` | No extra test framework |

## 3. Repository structure

```
stylescent/
  package.json
  .env.example
  .gitignore
  README.md
  prd.md
  design.md
  data/
    perfumes.json
    colour_rules.json
    patterns.json
    tone_map.json          # outfit mood -> fragrance vibe tags
  src/
    index.js               # server bootstrap
    config.js              # reads and validates env
    llm.js                 # provider wrapper: generateJson(), generateText(), describeImage()
    agent/
      orchestrator.js      # the 7-step loop
      slots.js             # slot schema + understand step
      planner.js           # builds the visible plan
      wardrobe.js          # wardrobe specialist (uses colour + pattern tools)
      fragrance.js         # fragrance specialist (uses matcher)
      checker.js           # programmatic checks + one revision request
      composer.js          # drafts the reply from structured results
      prompts.js           # all system prompts in one place
    tools/
      colour.js
      pattern.js
      perfume.js
      image.js             # image -> garment JSON via vision
      outputs.js           # CSV, Markdown plan, mood-board PNG
    data/
      load.js              # loads and validates datasets at startup
    nonilion/
      adapter.js           # interface implementation (stub until guide arrives)
      types.js             # NormalizedRequest / NormalizedResponse shapes
    dev/
      cli.js               # `npm run chat`
      devRoutes.js         # POST /dev/chat
  test/
    colour.test.js
    pattern.test.js
    perfume.test.js
    checker.test.js
    golden.test.js         # the 10 golden requests (LLM mocked where possible)
```

## 4. Data schemas

All files are validated with `zod` at startup. If validation fails, the server must refuse to start and print the problem.

### 4.1 `perfumes.json` (about 60 entries)

```json
{
  "id": "p_001",
  "name": "string",
  "brand": "string",
  "family": "woody | floral | citrus | fresh | oriental | gourmand | aromatic | fruity",
  "notes": { "top": ["string"], "heart": ["string"], "base": ["string"] },
  "seasons": ["spring", "summer", "autumn", "winter"],
  "occasions": ["college_fest", "office", "date_night", "wedding", "casual", "interview", "party", "festival_traditional"],
  "time_of_day": ["day", "evening", "night"],
  "vibe": ["confident", "fresh", "elegant", "playful", "bold", "calm", "romantic"],
  "intensity": "light | moderate | strong",
  "longevity": "short | medium | long",
  "price_band": "budget | mid | premium",
  "verified": false,
  "source": "team-curated sample"
}
```

### 4.2 `colour_rules.json`

```json
{
  "neutrals": ["black", "white", "grey", "beige", "navy", "cream", "tan", "olive"],
  "named_colours": [{ "name": "string", "hex": "#RRGGBB", "temperature": "warm | cool | neutral" }],
  "season_palettes": { "spring": ["#hex"], "summer": ["#hex"], "autumn": ["#hex"], "winter": ["#hex"] },
  "occasion_palettes": { "college_fest": ["#hex"], "office": ["#hex"] },
  "harmony_angles": { "complementary": [180], "analogous": [30, -30], "triadic": [120, 240] }
}
```

### 4.3 `patterns.json`

```json
{
  "patterns": ["solid", "stripes", "checks", "floral", "polka", "paisley", "geometric", "abstract"],
  "pairing_rules": [
    { "a": "stripes", "b": "solid", "verdict": "good", "reason": "string" },
    { "a": "stripes", "b": "checks", "verdict": "avoid", "reason": "string" }
  ],
  "scale_rule": "When mixing two prints, use different scales (one large, one small) and share one colour."
}
```

### 4.4 `tone_map.json`

Maps outfit characteristics to fragrance vibe tags, for example `{ "dark_bold_palette": ["bold", "confident"], "pastel_palette": ["fresh", "calm"] }`. This is how the wardrobe result influences the fragrance choice.

### 4.5 Garment (used in requests and tool calls)

```json
{
  "type": "top | bottom | outerwear | dress | ethnic | footwear | accessory",
  "colour_hex": "#RRGGBB",
  "colour_name": "string",
  "pattern": "solid | stripes | checks | floral | polka | paisley | geometric | abstract",
  "formality": "casual | smart | formal"
}
```

## 5. Tool contracts

All tools are pure functions (no network, no LLM) except `image.js`.

### 5.1 `tools/colour.js`

| Function | Behaviour |
|---|---|
| `analyseColour(hex)` | Returns `{ hsl, name, temperature, isNeutral }`. Name is the nearest entry in `named_colours` by distance in a perceptual colour space (or simple RGB distance if time is short). |
| `suggestHarmonies(hex, scheme)` | Rotates hue by the angles in `harmony_angles`, keeps saturation and lightness within wearable bounds, and returns up to 3 colours per scheme. Neutrals (low saturation) always pair, so return the neutral list. |
| `paletteForSeason(season)` | Returns the season palette. |
| `scoreOutfit(garments[])` | Returns `{ score: 0-100, reasons: [] }`. Rules: at most 3 non-neutral hues, penalise clashing hue pairs (hue distance 60 to 100 degrees with both saturated), reward a neutral base, reward a harmony match, check formality consistency. Every deduction or bonus adds a human-readable line to `reasons`. |

### 5.2 `tools/pattern.js`

| Function | Behaviour |
|---|---|
| `checkPatternPairing(a, b)` | Looks up `pairing_rules` (order-insensitive). Returns `{ verdict, reason }`, or `{ verdict: "ok", reason: "no specific rule" }`. |
| `suggestCompanion(pattern)` | Returns patterns whose verdict with `pattern` is `good`. |

### 5.3 `tools/perfume.js`

`matchPerfumes(query, k = 3)` where:

```js
query = {
  occasion, season, timeOfDay,     // required: occasion; the others may be defaulted
  vibe: [],                        // from tone_map or user wording
  intensity,                       // optional
  budget,                          // optional: budget | mid | premium
  avoidNotes: []                   // optional
}
```

1. **Hard filters:** drop any fragrance containing an avoided note in any note list; drop any above the budget band.
2. **Score** each remaining fragrance (0 to 100): occasion 30, season 25, vibe 20, intensity 10, time of day 5, budget fit 10. Use proportional credit for list fields (matches divided by requested).
3. Return the top `k` as `{ id, name, brand, score, reasons[], matched: {...} }`.
4. If the best score is below a threshold (default 40), return `{ results: [], reason: "no close match" }`. The agent must then say so, never invent.

### 5.4 `tools/image.js`

`extractGarmentFromImage(imageBuffer, mimeType)` calls the LLM vision endpoint with a JSON schema asking for a list of garments (§4.5) and a `confidence` value from 0 to 1. Validate with `zod`. If `confidence < 0.6`, the orchestrator asks the user to confirm the colour in one question.

Limit the image size (for example 5 MB) and reject unsupported types with a friendly message.

### 5.5 `tools/outputs.js`

| Function | Output |
|---|---|
| `buildShoppingListCsv(look, fragrance)` | CSV with columns `item,category,colour_name,colour_hex,pattern,notes`. Quote every field, escape quotes. |
| `buildOutfitPlanMd(look, fragrance, reasons, assumptions)` | Markdown document of the look, reasons and assumptions. |
| `renderMoodboard({ palette, garments, fragrance })` | 1200 by 800 PNG: palette swatches, one tile per garment, fragrance name and top notes. Built from an SVG template, then converted to PNG. |

## 6. Agent loop

### 6.1 Slots

```js
slots = {
  occasion,        // REQUIRED. one of the occasion values or free text mapped to one
  season,          // optional. default: derive from the current date and say so in assumptions
  timeOfDay,       // optional. default: infer from the occasion, else "evening"
  colourPrefs: [], // optional
  budget,          // optional
  avoidNotes: [],  // optional
  garments: [],    // optional. from text or image
  intent           // "full_look" | "pairing_only" | "fragrance_only" | "out_of_scope"
}
```

### 6.2 Steps

1. **Understand.** One LLM call returns slots as JSON, validated with `zod`. Use low temperature.
2. **Clarify.** Ask **one** short question and stop if: the occasion is missing; the request is contradictory (for example formal wedding in gym wear); or image confidence is low. Never ask more than one question per turn. Otherwise fill defaults and record each one in `assumptions[]`.
3. **Refuse or redirect.** If `intent = out_of_scope`, or the request asks for guarantees, live prices or stock, reply with a short, honest limit and one useful alternative.
4. **Plan.** `planner.js` produces a 4 to 6 line plan (for example "1. Read the request. 2. Build the colour palette. 3. Check patterns. 4. Pick fragrance. 5. Verify. 6. Prepare files."). Send it as a progress message if the adapter supports it, and include it in the trace.
5. **Act.**
   - Wardrobe specialist: palette, harmonies, pattern pairing, `scoreOutfit`.
   - Fragrance specialist: derive vibe tags from `tone_map`, then `matchPerfumes`.
   - These two are independent, so run them in parallel.
6. **Compose.** One LLM call receives only the **structured results** (palette, scores, reasons, top fragrances, assumptions) and writes the user-facing explanation. It must not add facts that are not in the input.
7. **Check.** See §6.3. On failure, revise once with the failure reasons, then fall back to a safe, shorter reply.
8. **Format and deliver.** Build the chat markdown, the CSV, the Markdown plan and the mood-board PNG.

### 6.3 Checker (programmatic first, LLM only for tone)

The reply passes only if all of these hold:

| # | Check |
|---|---|
| C1 | Every fragrance ID in the reply exists in `perfumes.json`. |
| C2 | No fragrance in the reply contains an avoided note. |
| C3 | `scoreOutfit` is at or above 70, or the reply states the outfit's weak points honestly. |
| C4 | The reply includes an Assumptions section if any default was applied. |
| C5 | The reply contains none of the banned claims: "guaranteed", "will get you the job", "safe for allergies", "perfect for everyone". |
| C6 | The reply names the dataset entry (ID) behind each fragrance. |

### 6.4 Prompts (kept in `prompts.js`)

Each prompt is a constant string with the rules below. Write them carefully and keep them short.

- **Understand prompt:** "Extract the slots as JSON matching the schema. Use null for anything not stated. Do not guess the occasion. Mark `intent = out_of_scope` for anything not about outfits, colours, patterns or fragrance."
- **Image prompt:** "List each visible garment with type, hex colour, colour name, pattern, formality. Include a `confidence` from 0 to 1. Do not describe people."
- **Compose prompt:** "You are StyleScent, a friendly personal stylist. Use only the data provided. Never mention a fragrance that is not in the data. Keep it concise. Sections: Your look, Why it works, Fragrance pick, Assumptions. State when you are unsure. Never claim guarantees or medical safety."

## 7. Output formats

**Chat reply (Markdown):**

```
## Your look
| Item | Colour | Pattern |
|---|---|---|
...
## Why it works
- reason lines from the colour and pattern tools
## Fragrance pick
**Name** (id: p_xxx): top notes; why it matches
**Alternatives:** two more
## Assumptions
- season assumed: ...
## Files
- shopping list (CSV), outfit plan (Markdown), mood board (PNG)
```

**Files:** `stylescent-shopping-list.csv`, `stylescent-outfit-plan.md`, `stylescent-moodboard.png`. Include a timestamp or short ID in each name to avoid collisions.

**Voice (P2):** a 2 to 3 sentence summary, generated only if the Nonilion route supports it.

## 8. Nonilion integration

### 8.1 Chosen route

**Connect a bot** (the "your own code" route in the rulebook): Nonilion calls our public webhook when someone talks to the agent, and our agent replies and acts through the Nonilion Bot API. A pairing code is obtained from the **robot button in the room's Agents dock**.

Use **www.nonilion.com** (with www) whenever configuring a connection.

### 8.2 Adapter interface (`src/nonilion/adapter.js`)

```js
// All functions return Promises. Real implementations come from the developer guide.
parseIncoming(httpRequest)            -> NormalizedRequest | null   // verify signature/token here
sendText(target, markdown)            -> void
sendFile(target, { name, mime, buffer })  -> void
sendImage(target, { name, mime, buffer }) -> void
postProgress(target, text)            -> void    // if supported
```

Rules:
- **Acknowledge the webhook quickly**, then process asynchronously, so slow LLM calls do not time out the request (confirm the exact timeout and retry behaviour in the guide).
- Handle duplicate deliveries safely (ignore a request ID already processed).
- Respect whichever limits the guide sets on file and image sizes.

### 8.3 Local harness (build this first)

- `npm run chat`: terminal chat that sends `NormalizedRequest` objects straight into the orchestrator and prints text, plus writes files and images to `./out/`.
- `POST /dev/chat`: the same over HTTP, with optional image upload. Enabled only when `NODE_ENV !== "production"`.

### 8.4 Fallbacks (decide by 12 Nov at the latest)

| Plan | When | Limits |
|---|---|---|
| **A: Connect a bot (primary)** | Developer guide received | Full tools, files, images. |
| **B: Import with instructions** (Gemini or other provider) | Bot API cannot be made to work in time | Prompt-only agent: no custom tools, so reduced capability. Keep a compact version of the system prompt and a small knowledge file ready. |
| **C: Ask the Nonilion team** | Any blocker | Ask early; the rulebook says developer guides are available for the Bot API and MCP routes. |

## 9. Configuration

`.env.example`

```
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

LLM_PROVIDER=gemini
LLM_API_KEY=
LLM_MODEL=                  # set to a current model ID from the provider docs

NONILION_BASE_URL=          # TODO(NONILION_GUIDE)
NONILION_PAIRING_CODE=      # TODO(NONILION_GUIDE)
NONILION_WEBHOOK_SECRET=    # TODO(NONILION_GUIDE)
```

`config.js` validates these with `zod` and fails fast with a clear message. Keys are never printed.

## 10. Error handling

- **LLM errors or timeouts:** retry once with a short backoff. On a second failure, reply with a short apology and what the agent can still do; never go silent.
- **Tool errors:** degrade gracefully (for example, if mood-board rendering fails, send the chat reply and CSV and say the image is unavailable).
- **Invalid LLM JSON:** one repair attempt, then the clarification fallback.
- **Process safety:** global `unhandledRejection` and `uncaughtException` handlers log and keep the server alive.
- **Input limits:** maximum message length, image size and type checks.
- **Privacy:** images are held in memory for the request only and are not written to disk in production.

## 11. Testing

- **Unit tests:** colour maths and naming, harmony outputs, `scoreOutfit` on known good and bad outfits, pattern lookups, fragrance filters and scoring, every checker rule (C1 to C6).
- **Dataset tests:** schema validation, unique IDs, every referenced season and occasion is in the allowed lists.
- **Golden tests:** the 10 requests in `prd.md` §8. Run them with the LLM mocked for CI-style checks, then **manually inside Nonilion** with the real model before 13 Nov.
- **Pre-demo checklist:** health endpoint returns OK; one full request passes in Nonilion; keys are valid and credits are available; backup video is recorded.

## 12. Deployment

- Host the Node server on **Render** as a web service (`npm start`), using the Render credits redeemed by every team member. Follow the Render documentation PDF provided by the organisers.
- Expose `/health`.
- Set all environment variables in the Render dashboard, not in the repo.
- **Free instances can spin down when idle. Use an always-on instance for 13 and 14 Nov** and check this before judging.
- Pin the Node version in `package.json` (`engines`).

## 13. Build milestones (exit criteria)

| # | Date | Milestone | Exit criteria |
|---|---|---|---|
| **M0** | 10 Nov | Scaffold + harness + hello bot | `npm run chat` works; `/health` works; "hello" bot deployed; round trip imported into Nonilion; developer guide requested. |
| **M1** | 10 to 11 Nov | Seed data | The three data files exist, pass schema tests, demo fragrances manually verified. |
| **M2** | 11 Nov | Tools | Colour, pattern and fragrance tools with passing unit tests. |
| **M3** | 11 to 12 Nov | Orchestrator | Understand, clarify, refuse, plan, act, compose working in the harness. Golden tests 1, 2, 4, 5, 6, 7, 9, 10 pass locally. |
| **M4** | 12 Nov | Checker + outputs | Checker rules C1 to C6 enforced; CSV, Markdown plan and mood-board PNG generated. |
| **M5** | 12 Nov | Real Nonilion adapter | Text, files and images delivered in Nonilion; @mentions work; image input works (golden tests 3 and 8). |
| **M6** | 13 Nov | Hardening | All 10 golden tests pass inside Nonilion; backup video recorded; pitch rehearsed. |
| **M7** | 14 Nov | Freeze | No new features. Instance always on. Only fix blocking bugs. |

## 14. Seed data creation (M1)

The coding agent drafts the files; the team reviews them.

- `perfumes.json`: about 60 entries, using real, widely known fragrances. Spread them across all families, seasons, occasions and the three price bands. Notes are drafted from general knowledge and **must be marked `"verified": false`** until a team member checks them against a reliable source. Verify at least every fragrance used in the demo.
- `colour_rules.json`: about 30 named colours with hex values, four season palettes (6 to 8 colours each), and occasion palettes for the occasion list.
- `patterns.json`: the 8 patterns and about 20 pairing rules, each with a short reason.
- `tone_map.json`: about 10 mappings from outfit characteristics to fragrance vibes.
- No scraping. If a public dataset is used instead, record its source and licence in `data/SOURCES.md`.
