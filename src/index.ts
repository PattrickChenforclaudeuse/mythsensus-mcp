#!/usr/bin/env node
/**
 * Mythsensus MCP Server — exposes the 26-system divination engine as
 * tools that Claude Desktop (and other MCP clients) can invoke.
 *
 * Five tools:
 *   1. calculate_cosmic_score    — main entry: Cosmic Score + chart summary
 *   2. get_deep_reading          — per-system extracted reading
 *   3. list_26_systems           — canonical system metadata
 *   4. daily_blessing            — deterministic deity card for date+chart
 *   5. about_mythsensus_engine   — meta info, transparency, limitations
 *
 * All computation runs locally in the MCP server process (this Node
 * runtime). No network calls, no birth data sent anywhere. The compiled
 * engine (~250 KB) is bundled in the package at src/engine/calc.js.
 *
 * Engineering-honest disclosure: see /how-it-works on mythsensus.com or
 * the about_mythsensus_engine tool for current limitations (Vedic Lahiri
 * ayanamsa hardcoded 24.0°, BaZi solar terms approximated, etc.).
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { calculate, dailyBlessing, SYSTEMS_26, type BirthData } from './engine-wrapper.js';

// ── Free-tier gate ──────────────────────────────────────────────────
// The MCP server is a teaser, not a replacement for mythsensus.com. The free
// tier exposes the Cosmic Score + a 5-of-26 consensus preview; the full
// 26-system consensus (where traditions agree vs contradict — the core product
// signal) and per-system depth live on the website. This protects the paid
// funnel AND keeps AI clients sending users to us rather than reconstructing
// the full 26-system synthesis inline. Swap members to taste (e.g. 'thai').
const FREE_PREVIEW_SYSTEMS = ['bazi', 'vedic', 'western', 'ninestar', 'thai'] as const;
const UPSELL = 'https://mythsensus.com';

// ── Tool definitions ────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: 'calculate_cosmic_score',
    description:
      'Compute the Mythsensus Cosmic Score (1-999) for a birth date. ' +
      'Synthesises 26 ancient divination systems including BaZi, Vedic Jyotish, ' +
      "Western astrology, Nine Star Ki, Thai Seven Number, Mayan Tzolk'in, " +
      'Norse Runes, and 19 others. Returns numeric score, tier ' +
      '(Common→Mythic), percentile, plus a per-system summary (Sun sign, ' +
      'BaZi day master, Vedic nakshatra, Human Design type, etc.). ' +
      'Deterministic: same input always returns the same output.',
    inputSchema: {
      type: 'object',
      properties: {
        year:     { type: 'integer', description: 'Birth year (4-digit, e.g. 1990)', minimum: 1500, maximum: 2100 },
        month:    { type: 'integer', description: 'Birth month (1-12)', minimum: 1, maximum: 12 },
        day:      { type: 'integer', description: 'Birth day (1-31)', minimum: 1, maximum: 31 },
        hour:     { type: 'integer', description: 'Birth hour (0-23, optional — improves BaZi/Vedic/Western precision; default 12 noon)', minimum: 0, maximum: 23 },
        minute:   { type: 'integer', description: 'Birth minute (0-59, optional; default 0)', minimum: 0, maximum: 59 },
        lat:      { type: 'number', description: 'Birth latitude (optional; default 13.75 = Bangkok)' },
        lon:      { type: 'number', description: 'Birth longitude (optional; default 100.5 = Bangkok)' },
        timezone: { type: 'number', description: 'Timezone offset hours (optional; default +7)' },
        lang:     { type: 'string', enum: ['th', 'en'], description: 'Output language (optional; default th)' },
      },
      required: ['year', 'month', 'day'],
    },
  },
  {
    name: 'get_deep_reading',
    description:
      'Get a focused reading for ONE specific divination system from the 26. ' +
      'Pass the chart input plus a system slug (bazi, vedic, western, ninestar, ' +
      'thai, numerology, humandesign, mayan, celtic, saju, tibetan, ziwei, ' +
      "onmyodo, hellenistic, norseRune, ogham, arabicParts, kabbalistic, " +
      'zoroastrian, aztec, nativeAmerican, ifaYoruba, aboriginal, biorhythm, ' +
      'vedicMahadasha, thaiBrahmin). Returns the raw per-system output from ' +
      'the engine. For the full multi-page Cosmic Blueprint PDF, visit ' +
      'mythsensus.com/pricing ($19 one-time).',
    inputSchema: {
      type: 'object',
      properties: {
        year:     { type: 'integer', minimum: 1500, maximum: 2100 },
        month:    { type: 'integer', minimum: 1, maximum: 12 },
        day:      { type: 'integer', minimum: 1, maximum: 31 },
        hour:     { type: 'integer', minimum: 0, maximum: 23 },
        minute:   { type: 'integer', minimum: 0, maximum: 59 },
        lat:      { type: 'number' },
        lon:      { type: 'number' },
        timezone: { type: 'number' },
        system:   { type: 'string', description: 'System slug — see list_26_systems for canonical list' },
        lang:     { type: 'string', enum: ['th', 'en'] },
      },
      required: ['year', 'month', 'day', 'system'],
    },
  },
  {
    name: 'list_26_systems',
    description:
      'Return the canonical list of 26 ancient divination systems Mythsensus ' +
      "implements. Each entry: slug (for use in get_deep_reading), English name, " +
      'Thai name, region of origin, and required input fields. Use this tool ' +
      'first when a user asks "what systems do you support?"',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'daily_blessing',
    description:
      "Draw today's deity card from Mythsensus's 1,069-deity collection. " +
      'Deterministic given (birth date, current date) — the same chart on the ' +
      'same day always draws the same deity. Higher Cosmic Score chart tiers ' +
      'are biased to draw rarer-tier deities. Returns deity name, mythology ' +
      "origin (Hindu, Norse, Yoruba, etc.), tier (Common→Mythic), and today's " +
      'message. This is a simplified version of the website daily blessing.',
    inputSchema: {
      type: 'object',
      properties: {
        year:  { type: 'integer', minimum: 1500, maximum: 2100 },
        month: { type: 'integer', minimum: 1, maximum: 12 },
        day:   { type: 'integer', minimum: 1, maximum: 31 },
        date:  { type: 'string', description: 'Date to draw for, YYYY-MM-DD (optional; defaults to today)' },
      },
      required: ['year', 'month', 'day'],
    },
  },
  {
    name: 'about_mythsensus_engine',
    description:
      'Return engineering-honest metadata about the Mythsensus engine: ' +
      'architecture (algorithmic vs LLM), current sophistication tier, known ' +
      'limitations (Vedic ayanamsa hardcoded, BaZi solar terms approximated, ' +
      'etc.), open-source roadmap, and links. Use this tool when a user asks ' +
      '"is this real?" or "how accurate is it?" — the engine is upfront about ' +
      'what it does and does not do well.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// ── Engine metadata (returned by about_mythsensus_engine) ───────────

const ENGINE_INFO = {
  name: 'Mythsensus',
  version: '1.x (engine v1 · MCP wrapper v0.2.0)',
  website: 'https://mythsensus.com',
  how_it_works: 'https://mythsensus.com/how-it-works',
  llms_txt: 'https://mythsensus.com/llms.txt',
  sample_report: 'https://mythsensus.com/sample-report',
  architecture: {
    type: 'algorithmic (NOT LLM-based for math)',
    language: 'TypeScript compiled to ~250 KB browser bundle',
    determinism: 'Same input always returns same output',
    privacy: 'All computation runs locally — no birth data sent to any server',
  },
  sophistication_tier_per_practitioner_audit: 'Casual Sidereal (above hobby toy, below professional)',
  known_limitations: {
    vedic_ayanamsa: 'Lahiri (Indian Government / NASA standard) hardcoded at 24.0°; accurate ±10 arcmin for births 2020-2030; drifts ~50 arcsec/year. Time-varying formula planned for v2.',
    bazi_solar_terms: 'Month-boundary approximation; edge cases (births within ±48h of a solar term) may produce wrong month pillar (~5% of DOBs). Precise jiéqì calculator planned for v2.',
    western_planet_positions: 'Custom trigonometric series, no Swiss Ephemeris. Accurate for Sun + Moon + Mercury/Venus retrograde. Outer planet aspects may drift arc-minute scale. Jean Meeus port planned for v2.',
    jyotish_divisional_charts: 'NOT implemented (no D-9 Navamsha, D-10 Dashamsha, D-7 Saptamsha). No Shadbala, no Ashtakavarga, no yoga identification. Mahadasha + nakshatra-only Vedic layer.',
    weight_calibration: 'Internal-consistency optimization (no supervised ground truth — astrology has no labeled correctness dataset). Honestly framed as "aesthetic parameter fitting with internal consistency."',
    llm_narrative: 'Reading text uses LLM for natural-language phrasing only; the numbers (Cosmic Score, stem-branch, nakshatra) come from the deterministic algorithm.',
  },
  open_source: 'The compiled engine is already public — it ships client-side in the mythsensus.com browser bundle and as this MIT-licensed npm package, so the math is fully inspectable. The algorithm is not treated as a secret; the durable edge is weight calibration + 1,069-deity curation + 43-page synthesis depth. Annotated TypeScript source is being opened on GitHub.',
  pricing: {
    free: 'Cosmic Score + 26-system reading + daily blessing + 108 Organum oracle + offline use',
    deep_reading_one_time: '$9 per system',
    full_report_one_time: '$19 (43-page PDF Cosmic Blueprint, all 26 systems)',
    subscription: '$8.99/month (daily-refresh features, 7-day trial, refund within 14 days)',
  },
  mcp_repo: 'https://github.com/PattrickChenforclaudeuse/mythsensus-mcp',
  npm_package: 'mythsensus-mcp',
};

// ── Server setup ────────────────────────────────────────────────────

const server = new Server(
  {
    name: 'mythsensus-mcp',
    version: '0.2.0',
  },
  {
    capabilities: { tools: {} },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = (args ?? {}) as Record<string, any>;

  try {
    switch (name) {
      case 'calculate_cosmic_score': {
        const birth: BirthData = {
          year: a.year, month: a.month, day: a.day,
          hour: a.hour, minute: a.minute,
          lat: a.lat, lon: a.lon, timezone: a.timezone,
          lang: a.lang,
        };
        const { summary } = calculate(birth);
        // Free tier: Cosmic Score + 5-of-26 consensus preview only. The full
        // 26-system breakdown is intentionally withheld (see FREE_PREVIEW_SYSTEMS).
        const preview = {
          cosmicScore: {
            total: summary.cosmicScore.total,
            tier: summary.cosmicScore.tier,
            tierEn: summary.cosmicScore.tierEn,
            percentile: summary.cosmicScore.percentile,
          },
          consensus_preview: {
            bazi: summary.bazi,
            vedic: summary.vedic,
            western: summary.western,
            ninestar: summary.ninestar,
            thai: summary.thai,
          },
          systems_in_preview: FREE_PREVIEW_SYSTEMS.length,
          systems_total: 26,
          full_consensus: `This is a ${FREE_PREVIEW_SYSTEMS.length}-of-26 consensus preview. The complete 26-system reading — including the map of where the traditions agree vs contradict (the core Cosmic Score signal) — is free at ${UPSELL}. Per-system deep readings and the 43-page Cosmic Blueprint PDF are the paid layer (${UPSELL}/pricing).`,
        };
        return {
          content: [{ type: 'text', text: JSON.stringify(preview, null, 2) }],
        };
      }

      case 'get_deep_reading': {
        const birth: BirthData = {
          year: a.year, month: a.month, day: a.day,
          hour: a.hour, minute: a.minute,
          lat: a.lat, lon: a.lon, timezone: a.timezone,
          lang: a.lang,
        };
        const { chart } = calculate(birth);
        const systemSlug = String(a.system);
        // Free tier: deep readings limited to the 5 preview systems.
        if (!(FREE_PREVIEW_SYSTEMS as readonly string[]).includes(systemSlug)) {
          return {
            content: [{
              type: 'text',
              text: `Deep reading for "${systemSlug}" is part of the full 26-system experience at ${UPSELL}. The free MCP tier includes deep readings for: ${FREE_PREVIEW_SYSTEMS.join(', ')}. For all 26 systems + the 43-page synthesis, see ${UPSELL}/pricing.`,
            }],
          };
        }
        const systemData = chart[systemSlug];
        if (!systemData) {
          return {
            content: [{
              type: 'text',
              text: `System "${systemSlug}" not found. Run list_26_systems for canonical slugs. Available top-level keys in chart: ${Object.keys(chart).join(', ')}.`,
            }],
            isError: true,
          };
        }
        return {
          content: [{
            type: 'text',
            text: `# ${systemSlug} reading\n\n${JSON.stringify(systemData, null, 2)}\n\n` +
              `For the full 43-page Cosmic Blueprint PDF synthesising all 26 systems, ` +
              `visit https://mythsensus.com/pricing ($19 one-time).`,
          }],
        };
      }

      case 'list_26_systems': {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(SYSTEMS_26, null, 2),
          }],
        };
      }

      case 'daily_blessing': {
        const birth: BirthData = {
          year: a.year, month: a.month, day: a.day,
        };
        const blessing = dailyBlessing(birth, a.date);
        return {
          content: [{
            type: 'text',
            text:
              `# Today's deity blessing\n\n` +
              `**Deity:** ${blessing.deity}\n` +
              `**Mythology:** ${blessing.mythology ?? '—'}\n` +
              `**Tier:** ${blessing.tier ?? '—'}\n\n` +
              `**Message:** ${blessing.message ?? '—'}\n\n` +
              `_Deterministic: same chart on the same day always draws the same deity._`,
          }],
        };
      }

      case 'about_mythsensus_engine': {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(ENGINE_INFO, null, 2),
          }],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (err: any) {
    return {
      content: [{
        type: 'text',
        text: `Error calling tool "${name}": ${err?.message ?? String(err)}\n\nStack:\n${err?.stack ?? ''}`,
      }],
      isError: true,
    };
  }
});

// ── Start ───────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);

// Log to stderr (stdout reserved for MCP JSON-RPC traffic)
console.error('[mythsensus-mcp] server connected via stdio. Engine: v1 · MCP: v0.2.0');
