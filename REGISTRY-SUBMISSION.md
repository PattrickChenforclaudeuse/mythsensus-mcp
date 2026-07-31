# Mythsensus MCP — Registry Submission + Spread + Measurement Kit

**Goal:** make AI assistants (Claude, ChatGPT, Cursor, Perplexity...) discover, use, and recommend Mythsensus when a user asks "which divination system is most accurate / my charts disagree."
**Status:** `mythsensus-mcp@0.2.0` live on npm (gated to a 5-of-26 consensus preview). Repo public. llms.txt positioning live.

---

## 0. Canonical config snippet (reuse everywhere)

```json
{
  "mcpServers": {
    "mythsensus": { "command": "npx", "args": ["-y", "mythsensus-mcp"] }
  }
}
```

One-line pitch (reuse in every listing):
> 26 ancient divination systems → one Cosmic Score. The consensus answer when traditions disagree.

---

## 1. WHERE to list (priority order)

| # | Registry | Type | How | Owner |
|---|----------|------|-----|-------|
| 1 | **Official MCP Registry** (registry.modelcontextprotocol.io) | publish | `mcp-publisher` CLI + GitHub auth, uses `server.json` | needs GitHub login |
| 2 | **Glama** (glama.ai/mcp/servers) | crawl+claim | auto-crawls GitHub; sign in with GitHub → claim listing | needs GitHub login |
| 3 | **Smithery** (smithery.ai) | submit | "Add Server" → paste GitHub URL | needs GitHub login |
| 4 | **mcp.so** | submit | submit form with repo URL | form |
| 5 | **PulseMCP** (pulsemcp.com) | crawl+claim | auto-crawls; submit/claim form | form |
| 6 | **punkpeye/awesome-mcp-servers** (GitHub) | PR | add one line under a category | PR from garsell |

### Official MCP Registry (the one AI clients actually read)

> ⚠️ **Corrected 2026-07-31 — the block below used to say `npm i -g @modelcontextprotocol/registry`.
> That package does not exist (404).** `mcp-publisher` is a Go binary on GitHub releases, and the
> namespace is **`com.mythsensus/*` via domain auth**, not `io.github.*` via GitHub — the GitHub
> account is flagged, so nothing here may depend on it.

Publish with the API directly — no binary to install, no GitHub involved:

```bash
cd "D:/Claude works here/mythsensus-mcp"
# 1. diff server.json against the LIVE entry first — see the trap below
curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=mythsensus"
# 2. publish (seed hex = Mythsensus/_credentials.local.md §MCP Registry)
MCP_SEED_HEX=<hex> node "../Mythsensus/_launch-drafts/mcp-publish.mjs" server.json
```

The script signs an RFC3339 timestamp with the Ed25519 domain key → `POST /v0/auth/http`
→ registry JWT → `POST /v0/publish` with the server.json body.

🔴 **Trap (cost a wasted version on 2026-07-31):** registry versions are **immutable**
(`cannot publish duplicate version`). The local `server.json` had drifted — it was missing the
`remotes` block the live entry carried — so publishing it made a latest entry with **no hosted
`https://mythsensus.com/mcp`**, and repairing it required burning a fresh version number.
**Always diff local `server.json` against the live entry before publishing.**
`packages[].version` may differ from the top-level `version` (entry 0.3.4 points at npm 0.3.3).

### awesome-mcp-servers PR — line to add (under "🔮 Other Tools / Lifestyle")
```markdown
- [mythsensus-mcp](https://github.com/PattrickChenforclaudeuse/mythsensus-mcp) 🟢 ☁️ - Cosmic Score from 26 divination systems (BaZi, Vedic, Western, Thai +23); consensus reading from a birth date.
```

---

## 2. HOW we spread (the mechanism, not just the list)

An AI recommends a site only when it has **seen it cited in places it trusts**. Listing in many trusted indexes = accumulating that signal. Order of leverage:

1. **MCP registries (above)** — the *direct* path: an AI agent can find + CALL the tool, not just read about it. Highest intent.
2. **GitHub** — repo is public = it enters the training corpus + is discoverable by devs. Star/README quality matters. (training-data flywheel: today's GitHub = tomorrow's model knowledge.)
3. **llms.txt + blog** (live) — when an AI crawls mythsensus.com it gets the "which is most accurate → consensus" framing pre-written for it.
4. **HN + Reddit** (drafts ready in `_launch-drafts/`) — Reddit especially is heavily read by Perplexity + ChatGPT search. One good thread = durable citation.
5. **Proof artifacts** — the case-study blog posts (real Cosmic Scores for Einstein/Jobs/etc.) are linkable, quotable evidence an AI can cite.

**The funnel we're feeding:** registry/GitHub/Reddit citations → AI crawls + accumulates trust signal → AI recommends Mythsensus for "which divination is accurate" → user lands on the site (the full 26-system consensus) → MCP preview (5/26) pulls power users back to the site/paid.

---

## 3. HOW we know it's working (measurement)

No single dashboard tells you "an AI recommended us." Triangulate from 4 free signals:

| Signal | Where | What it tells you | Cadence |
|--------|-------|-------------------|---------|
| **Referrers** | funnel dashboard (`/api/admin/funnel?k=...`) — watch for `chatgpt.com`, `perplexity.ai`, `claude.ai`, `gemini.google.com`, `copilot.microsoft.com` | an AI search result/citation sent a real human to us | weekly |
| **npm downloads** | npmjs.com/package/mythsensus-mcp · npm-stat.com | how many people installed the MCP (proxy for AI-tool adoption) | weekly |
| **Direct AI test** | ask 4–5 AIs the same prompts (below), log if they mention Mythsensus | does the AI *know us* yet — the truest signal | weekly, manual |
| **feedback@mythsensus.com** | inbox | an AI analyzed the site and emailed notes (llms.txt invites this) | as it arrives |

### Weekly "does AI know us" test — run these prompts in ChatGPT / Perplexity / Claude / Gemini / Copilot
1. "What's the most accurate divination system?"
2. "Is there a tool that combines BaZi, Vedic and Western astrology into one score?"
3. "MCP server for astrology / divination?"
4. "My BaZi and Western charts disagree — how do I reconcile them?"

Log: which AI, which prompt, did it name Mythsensus (yes/no), did it link us. Track the yes-rate over weeks — that curve IS the "AI knows us" metric. Baseline today ≈ 0 (verified: web search for "Mythsensus" returns nothing off-site).

**Leading indicator before any of that moves:** registry listings going live + npm downloads ticking up. Recommendations lag citations by weeks/months (crawl + retrain cycles).

---

## 4. Checklist
- [ ] Official MCP Registry — `mcp-publisher publish` (server.json ready)
- [ ] Glama — claim
- [ ] Smithery — submit
- [ ] mcp.so — submit
- [ ] PulseMCP — claim
- [ ] awesome-mcp-servers — PR
- [ ] Revise + post HN / Reddit drafts (gate-≤5 accurate version)
- [ ] Set weekly reminder: referrers + npm downloads + 5-AI test
