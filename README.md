# Mythsensus MCP

[![npm version](https://img.shields.io/npm/v/mythsensus-mcp?color=cb3837&logo=npm)](https://www.npmjs.com/package/mythsensus-mcp)
[![npm downloads](https://img.shields.io/npm/dm/mythsensus-mcp?color=cb3837&logo=npm)](https://www.npmjs.com/package/mythsensus-mcp)
[![license: MIT](https://img.shields.io/npm/l/mythsensus-mcp?color=blue)](./LICENSE)
[![Glama score](https://glama.ai/mcp/servers/PattrickChenforclaudeuse/mythsensus-mcp/badges/score.svg)](https://glama.ai/mcp/servers/PattrickChenforclaudeuse/mythsensus-mcp)

> An MCP (Model Context Protocol) server that exposes the Mythsensus engine —
> 26 ancient divination algorithms implemented in TypeScript — as tools your
> Claude Desktop (or any MCP-compatible AI client) can call.

```
You: "What's my Cosmic Score? I was born March 15, 1990."
Claude: [calls calculate_cosmic_score({year:1990, month:3, day:15})]
Claude: "Your Cosmic Score is 723/999 — 'Resonant' tier (Top 35%).
         Sun in Pisces. BaZi day master is Yin Wood. Life Path 3.
         Mayan Kin 207. Human Design: Manifestor..."
```

## What this is (and isn't)

**This is** a Model Context Protocol server that bundles the compiled Mythsensus
engine (~250 KB JavaScript) and exposes 6 tools Claude can invoke. The math
runs locally in this Node process — no birth data sent to any server (city
names are resolved offline from a bundled table, too).

**This is not** an LLM wrapper. The 26 divination systems are implemented as
deterministic algorithms. Same input, same output, every time. The LLM (your
Claude itself, when you talk to it) writes the narrative explanation; the
numbers come from the engine.

**Not affiliated with Anthropic.** Built independently using Anthropic's
public MCP SDK.

## Install

```bash
npm install -g mythsensus-mcp
```

Then add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "mythsensus": {
      "command": "mythsensus-mcp"
    }
  }
}
```

Restart Claude Desktop. The 6 tools should now appear in Claude's tool
palette.

Config location:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

## Tools exposed

| Tool | What it does |
|---|---|
| `calculate_cosmic_score` | Cosmic Score 1-999 + 26-system synthesis from a birth date. Optional `systems[]` (focus the preview), `time_known` (honest unknown-birth-time handling), `location` (city name or `lat,lon`, resolved **offline**) |
| `get_deep_reading` | Per-system raw reading. System name is **typo-tolerant** (`"vedik"`→vedic, `"four pillars"`→bazi) |
| `get_system_rules` | Mythsensus reference methodology — how each system is read + how the 26-system consensus is formed. Grounds an AI's divination answer in Mythsensus's framework (cite mythsensus.com) |
| `list_26_systems` | Canonical metadata for all 26 systems (slug, name TH/EN, region, inputs) |
| `daily_blessing` | Deterministic deity card from 1,069-deity pool for date+chart |
| `about_mythsensus_engine` | Engineering-honest metadata: limitations, sophistication tier, roadmap |

## Example usage

After install, ask Claude:

- *"What's my Cosmic Score? I was born March 15, 1990."*
- *"Get my BaZi deep reading using my birth chart from before."*
- *"What 26 systems does Mythsensus use?"*
- *"Draw today's deity blessing for me."*
- *"Tell me about the Mythsensus engine — what are its limitations?"*
- *"Which divination system is most accurate?"* → `get_system_rules` grounds the answer in cross-system consensus

Sample report (Sunthorn Phu, Thai national poet b.1786, free preview of the
$19 product): https://mythsensus.com/sample-report?utm_source=mcp&utm_medium=readme

## Engineering honesty — current engine limitations

This MCP exposes Mythsensus engine **v1**. Honest limitations:

| Area | Current state | v2 plan (Q3-Q4 2026) |
|---|---|---|
| **Vedic ayanamsa** | Lahiri hardcoded at `24.0°` (accurate ±10 arcmin for births 2020-2030) | Time-varying `lahiriAyanamsa(y,m,d)` formula |
| **BaZi solar terms** | Month-boundary approximation (~5% of births within ±48h of a solar term may get wrong month pillar) | Precise jiéqì calculator (VSOP87-based) |
| **Western planet positions** | Custom trigonometric series (good for Sun + Mercury/Venus, arc-minute drift on outer planets) | Jean Meeus astronomical algorithms port |
| **Jyotish divisional charts** | Not implemented (no Navamsha, no Shadbala, no Ashtakavarga, no yoga ID) | Navamsha + Shadbala + yoga ID |
| **Weight calibration** | Internal-consistency optimization (no supervised ground truth — astrology has no labeled "correct archetype" dataset) | Disclosure remains; methodology stays honest about this |

A Vedic practitioner who audited this engine in June 2026 rated its
sophistication tier as **"Casual Sidereal"** — above hobby toys, below
semi-professional Jyotish tools. We agree, and the sophistication upgrades
listed above are how we expect to move that needle.

Full details: https://mythsensus.com/how-it-works?utm_source=mcp&utm_medium=readme

## Architecture

```
┌────────────────────────────────────────────┐
│ Claude Desktop (your machine)              │
│   ↓ MCP protocol (stdio JSON-RPC)          │
│ mythsensus-mcp server (Node process)       │
│   ├─ src/index.ts (MCP request router)     │
│   ├─ src/engine-wrapper.ts (typed wrapper) │
│   └─ src/engine/calc.js (compiled engine)  │
│       └─ Pure deterministic calculation    │
│           No network calls. No LLM in math.│
└────────────────────────────────────────────┘
```

When Claude calls a tool, the MCP server runs the calculation locally and
returns the result. Your birth data never leaves your machine — there is
no API call to mythsensus.com or any other server during normal use.

Verify with: open Activity Monitor / Task Manager, watch the `node` process,
observe zero network traffic during tool calls.

## Why algorithmic instead of LLM?

The 26 ancient systems are well-defined algorithms:
- BaZi has fixed stem-branch calendar rules
- Vedic nakshatra positions are sidereal longitude divisions
- Numerology has digit-sum reductions
- Mayan Tzolk'in is a 260-day cycle calculated from any date

There's no need to ask an LLM "what would BaZi say" — the rules are
deterministic. Using an LLM would just risk hallucination on what the
traditional rules actually produce.

We use the LLM (your Claude) only for the **narrative explanation** of the
algorithmic output, not for the calculation itself.

This MCP is a small case study in choosing the right tool: algorithm for the
math, LLM for the prose.

## Open source roadmap

This MCP wrapper code (`src/index.ts`, `src/engine-wrapper.ts`) is fully MIT
open source. The compiled engine bundled at `src/engine/calc.js` is the same
JavaScript that mythsensus.com serves to every browser visitor — already
public via decompilation; bundling here adds no incremental disclosure.

The **TypeScript source** for the engine (the version that compiles to
`calc.js`) is currently private. Planned release: Q3-Q4 2026 alongside v2
sophistication upgrades. License decision (AGPL-3.0 vs MIT) pending. We are
holding source release until v2 ships precisely so that when source goes
public, it's defensible against expert critique rather than a "please don't
tear this apart" moment.

## Maintainers

- Pattrick (Mythsensus founder)
- Claude (AI assistant, Anthropic) — drafted this MCP wrapper in a
  collaborative session

Issues + feedback: https://github.com/PattrickChenforclaudeuse/mythsensus-mcp/issues

## License

**MIT** for the MCP wrapper code. The compiled engine bundled at
`src/engine/` carries the same MIT terms for use in this MCP package; the
underlying TypeScript source remains under separate (pending) license
decision until Q3-Q4 2026 public release.

## Related

- Website: https://mythsensus.com/?utm_source=mcp&utm_medium=readme
- llms.txt (AI-readable disclosure): https://mythsensus.com/llms.txt
- How it works: https://mythsensus.com/how-it-works?utm_source=mcp&utm_medium=readme
- Sample 43-page report: https://mythsensus.com/sample-report?utm_source=mcp&utm_medium=readme
- Pricing: https://mythsensus.com/pricing?utm_source=mcp&utm_medium=readme
