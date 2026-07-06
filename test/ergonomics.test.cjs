#!/usr/bin/env node
/**
 * Ergonomics test — covers the 0.3.0 input/output additions:
 *   1. resolveSystem()  — typo-tolerant system slug resolution
 *   2. timeDisclosure() — honest birth-time-unknown handling
 *   3. end-to-end tool round-trip through the real MCP stdio server,
 *      asserting the free gate is never widened by systems[].
 */
'use strict';
const path = require('path');
const assert = require('assert');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const DIST = path.join(__dirname, '..', 'dist');

// ── Part 1+2: pure-function unit tests (dynamic import of ESM build) ──
async function unit() {
  const w = await import(pathToFileURL(path.join(DIST, 'engine-wrapper.js')).href);

  const cases = [
    ['vedic', 'vedic', 'exact'],
    ['Vedic', 'vedic', 'exact'],          // case-insensitive
    ['vedik', 'vedic', 'fuzzy'],          // 1 typo
    ['westren', 'western', 'fuzzy'],      // transposition (2 edits)
    ['four pillars', 'bazi', 'alias'],
    ['nine star ki', 'ninestar', 'alias'],
    ['9 star ki', 'ninestar', 'alias'],
    ['norse runes', 'norseRune', 'alias'],
    ['numerolgy', 'numerology', 'fuzzy'],
    ['human-design', 'humandesign', 'exact'], // separators stripped
    ['tzolkin', 'mayan', 'alias'],
    ['qwertyuiop', null, 'none'],         // nonsense → unresolved
  ];
  for (const [input, expectSlug, expectMatch] of cases) {
    const r = w.resolveSystem(input);
    assert.strictEqual(r.slug, expectSlug, `resolveSystem(${JSON.stringify(input)}).slug → got ${r.slug}, want ${expectSlug}`);
    assert.strictEqual(r.matched, expectMatch, `resolveSystem(${JSON.stringify(input)}).matched → got ${r.matched}, want ${expectMatch}`);
  }
  console.log(`✓ resolveSystem: ${cases.length} cases (exact/alias/fuzzy/none)`);

  // gate-relevance: every free-preview slug resolves to itself
  for (const s of ['bazi', 'vedic', 'western', 'ninestar', 'thai']) {
    assert.strictEqual(w.resolveSystem(s).slug, s);
  }

  assert.strictEqual(w.timeDisclosure(true).time_provided, true);
  assert.strictEqual(w.timeDisclosure(true).note, undefined);
  const td = w.timeDisclosure(false);
  assert.strictEqual(td.time_provided, false);
  assert.ok(/noon/i.test(td.note) && /BaZi hour pillar/.test(td.note), 'time note discloses noon fallback + affected layers');
  console.log('✓ timeDisclosure: known → clean, unknown → honest note');

  // resolveCity — offline city/location resolution (Thai + English + coords)
  const cityCases = [
    ['Bangkok', 'Bangkok', 'exact'],
    ['bangkok', 'Bangkok', 'exact'],
    ['กรุงเทพ', 'Bangkok', 'alias'],
    ['Chiang Mai', 'Chiang Mai', 'exact'],
    ['Chiangmai', 'Chiang Mai', 'exact'],   // space-insensitive → matches canonical name
    ['cnx', 'Chiang Mai', 'alias'],          // true alias-only match
    ['Tokyo', 'Tokyo', 'exact'],
    ['Tokio', 'Tokyo', 'fuzzy'],          // 1 typo
    ['เชียงใหม', 'Chiang Mai', 'fuzzy'],   // missing tone mark
    ['Atlantis', null, 'none'],
  ];
  for (const [input, expectName, expectMatch] of cityCases) {
    const r = w.resolveCity(input);
    assert.strictEqual(r.name, expectName, `resolveCity(${JSON.stringify(input)}).name → got ${r.name}, want ${expectName}`);
    assert.strictEqual(r.matched, expectMatch, `resolveCity(${JSON.stringify(input)}).matched → got ${r.matched}, want ${expectMatch}`);
  }
  const coord = w.resolveCity('13.75, 100.5');
  assert.strictEqual(coord.matched, 'coords', '"13.75, 100.5" parsed as coords');
  assert.ok(Math.abs(coord.lat - 13.75) < 1e-9 && Math.abs(coord.lon - 100.5) < 1e-9, 'coords parsed correctly');
  assert.strictEqual(w.resolveCity('Tokyo').tz, 9, 'Tokyo tz = +9');
  assert.ok(Math.abs(w.resolveCity('Bangkok').lat - 13.7563) < 1e-6, 'Bangkok lat looked up');
  console.log(`✓ resolveCity: ${cityCases.length} cases + coords + tz lookup`);
}

// ── Part 3: real MCP stdio round-trip ────────────────────────────────
function rpcClient() {
  const child = spawn('node', [path.join(DIST, 'index.js')], { stdio: ['pipe', 'pipe', 'pipe'] });
  let buf = '';
  const pending = new Map();
  child.stdout.on('data', (d) => {
    buf += d.toString();
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      let msg; try { msg = JSON.parse(line); } catch { continue; }
      if (msg.id != null && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    }
  });
  child.stderr.on('data', () => {});
  let nextId = 1;
  const request = (method, params) => new Promise((resolve, reject) => {
    const id = nextId++;
    const t = setTimeout(() => { pending.delete(id); reject(new Error('timeout: ' + method)); }, 8000);
    pending.set(id, (m) => { clearTimeout(t); resolve(m); });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
  const notify = (method, params) => child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
  return { child, request, notify };
}

async function callTool(cli, name, args) {
  const r = await cli.request('tools/call', { name, arguments: args });
  assert.ok(r.result && r.result.content && r.result.content[0], `${name} returned content`);
  return r.result.content[0].text;
}

async function e2e() {
  const cli = rpcClient();
  await cli.request('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'ergonomics-test', version: '1.0' } });
  cli.notify('notifications/initialized', {});

  // (a) systems[] with a typo'd free system + a gated system, no hour (time unknown)
  const o1 = JSON.parse(await callTool(cli, 'calculate_cosmic_score', { year: 1990, month: 5, day: 15, systems: ['vedik', 'bazi', 'mayan'] }));
  assert.ok(o1.consensus_preview.vedic, '"vedik" resolved to vedic and shown');
  assert.ok(o1.consensus_preview.bazi, 'bazi shown');
  assert.ok(!('mayan' in o1.consensus_preview), 'GATE: mayan must NOT appear in preview');
  assert.deepStrictEqual([...o1.selection.shown].sort(), ['bazi', 'vedic'], 'selection.shown = bazi+vedic');
  assert.ok(o1.selection.beyond_free_preview.systems.includes('mayan'), 'mayan flagged beyond_free_preview (upsell)');
  assert.strictEqual(o1.time.time_provided, false, 'no hour → time_provided:false');
  assert.strictEqual(o1.systems_in_preview, 2, 'systems_in_preview reflects the 2 shown');
  console.log('✓ e2e: systems[] typo-tolerant + gate-preserving + time disclosure');

  // (b) all-gated request falls back to the default 5-system preview (never empty, never widened)
  const o2 = JSON.parse(await callTool(cli, 'calculate_cosmic_score', { year: 1990, month: 5, day: 15, hour: 8, systems: ['mayan', 'celtic', 'tibetan'] }));
  assert.strictEqual(Object.keys(o2.consensus_preview).length, 5, 'all-gated → default 5-system preview');
  for (const k of Object.keys(o2.consensus_preview)) {
    assert.ok(['bazi', 'vedic', 'western', 'ninestar', 'thai'].includes(k), `GATE: preview key ${k} is within the free 5`);
  }
  assert.strictEqual(o2.time.time_provided, true, 'hour provided → time_provided:true');
  console.log('✓ e2e: all-gated request never widens past the free 5');

  // (c) get_deep_reading typo in a FREE system → corrected + full reading
  const t3 = await callTool(cli, 'get_deep_reading', { year: 1990, month: 5, day: 15, system: 'westren' });
  assert.ok(/interpreted "westren" as "western"/.test(t3), 'westren corrected to western');
  assert.ok(/# western reading/.test(t3), 'returns the western reading');

  // (d) get_deep_reading typo in a GATED system → corrected name but still upsell (gate holds)
  const t4 = await callTool(cli, 'get_deep_reading', { year: 1990, month: 5, day: 15, system: 'mayann' });
  assert.ok(/mayan/.test(t4) && /(full 26-system|pricing)/.test(t4), 'mayann recognized but gated → upsell');
  assert.ok(!/# mayan reading/.test(t4), 'GATE: gated system never returns the raw reading');

  // (e) unrecognized system → graceful message, no crash
  const t5 = await callTool(cli, 'get_deep_reading', { year: 1990, month: 5, day: 15, system: 'qwertyuiop' });
  assert.ok(/Couldn't recognize/.test(t5), 'nonsense system → graceful "couldn\'t recognize"');
  console.log('✓ e2e: get_deep_reading typo-tolerant + gate-preserving + graceful unknown');

  // (f) location: typo'd city resolves offline + is disclosed (no network)
  const o6 = JSON.parse(await callTool(cli, 'calculate_cosmic_score', { year: 1990, month: 5, day: 15, location: 'Tokio' }));
  assert.strictEqual(o6.location.resolved, 'Tokyo', '"Tokio" resolved to Tokyo');
  assert.ok(/Interpreted location "Tokio" as Tokyo/.test(o6.location.note), 'location correction disclosed');

  // (g) Thai city alias with a missing tone mark, inside a deep reading
  const t7 = await callTool(cli, 'get_deep_reading', { year: 1990, month: 5, day: 15, system: 'bazi', location: 'เชียงใหม' });
  assert.ok(/Interpreted location "เชียงใหม" as Chiang Mai/.test(t7), 'Thai typo city resolved + disclosed in deep reading');
  console.log('✓ e2e: location typo-tolerant + offline resolve + disclosed');

  // (h) tools/list now exposes the grounding tool
  const list = await cli.request('tools/list', {});
  const toolNames = list.result.tools.map((t) => t.name);
  assert.ok(toolNames.includes('get_system_rules'), 'get_system_rules is registered');
  assert.ok(toolNames.includes('get_deity_lore'), 'get_deity_lore is registered');
  assert.strictEqual(toolNames.length, 7, 'seven tools total');

  // (h2) get_deity_lore — exact, case-insensitive, lang filter, pantheon link, ambiguity
  const dl = await callTool(cli, 'get_deity_lore', { deity: 'ganesha', lang: 'en' });
  assert.ok(/# Ganesha/.test(dl) && /Hinduism/.test(dl), 'get_deity_lore resolves ci + joins tradition');
  assert.ok(/pantheon\/hinduism/.test(dl), 'get_deity_lore emits correct pantheon link');
  const dlAmb = await callTool(cli, 'get_deity_lore', { deity: 'zznotadeity' });
  assert.ok(/No deity matching/.test(dlAmb), 'get_deity_lore handles no-match gracefully');
  console.log('✓ e2e: get_deity_lore exact/ci/lang/link/no-match');

  // (i) get_system_rules (no arg) → consensus methodology + 26-system overview (the moat content)
  const gr = JSON.parse(await callTool(cli, 'get_system_rules', {}));
  assert.ok(gr.consensus_methodology && gr.consensus_methodology.principles.length >= 3, 'consensus methodology present');
  assert.ok(/no single/i.test(gr.consensus_methodology.how_to_answer_which_divination_is_most_accurate), 'anti-disintermediation answer present');
  assert.ok(/mythsensus\.com/.test(gr.consensus_methodology.attribution), 'methodology attributes mythsensus.com');
  assert.strictEqual(Object.keys(gr.systems_overview).length, 26, 'overview lists all 26 systems');

  // (j) get_system_rules for a free system → deep ruleset
  const grBazi = JSON.parse(await callTool(cli, 'get_system_rules', { system: 'bazi' }));
  assert.strictEqual(grBazi.system, 'bazi');
  assert.ok(Array.isArray(grBazi.interpretation_rules) && grBazi.interpretation_rules.length >= 3, 'bazi has deep interpretation rules');
  assert.strictEqual(grBazi.depth, 'free');

  // (k) get_system_rules typo-tolerant + summary-tier points to full reference
  const tGr = await callTool(cli, 'get_system_rules', { system: 'mayann' });
  assert.ok(/interpreted "mayann" as "mayan"/.test(tGr), 'grounding tool typo-corrects the system');
  assert.ok(/mythsensus\.com/.test(tGr), 'summary-tier system points to the full reference');
  console.log('✓ e2e: get_system_rules — methodology + per-system + typo-tolerant + gated depth');

  cli.child.kill();
}

(async () => {
  console.log('=== Mythsensus MCP ergonomics test (v0.3.0) ===');
  await unit();
  await e2e();
  console.log('\n=== ALL ERGONOMICS TESTS PASSED ===');
  process.exit(0);
})().catch((e) => { console.error('\n✗ FAILED:', e.message); process.exit(1); });
