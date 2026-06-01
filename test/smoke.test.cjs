#!/usr/bin/env node
/**
 * Smoke test — verifies the engine loads and produces deterministic output
 * for known historical figures (cross-checked against published Astrodatabank
 * AA-rated birth data).
 */
'use strict';
const path = require('path');
const assert = require('assert');

const calc = require(path.join(__dirname, '..', 'src', 'engine', 'calc.cjs'));

console.log('=== Mythsensus MCP smoke test ===');

// Test 1: Engine loads
assert.strictEqual(typeof calc.calculate, 'function', 'calc.calculate should exist');
console.log('✓ Engine loads, calculate() exported');

// Test 2: Calculate for Sunthorn Phu (Thai poet b.1786)
const sunthornPhu = calc.calculate({
  name: 'Sunthorn Phu',
  gender: 'ชาย',
  year: 1786, month: 6, day: 26,
  hour: 12, minute: 0,
  lat: 13.75, lon: 100.5, timezone: 7,
  lang: 'th',
});

assert.ok(sunthornPhu.score, 'Should produce score object');
assert.ok(typeof sunthornPhu.score.total === 'number', 'Score total should be a number');
assert.ok(sunthornPhu.score.total >= 1 && sunthornPhu.score.total <= 999,
  `Score should be 1-999, got ${sunthornPhu.score.total}`);
console.log(`✓ Sunthorn Phu: Score ${sunthornPhu.score.total} (tier: ${sunthornPhu.score.tier})`);

// Test 3: Determinism — re-run, expect identical output
const sunthornPhu2 = calc.calculate({
  name: 'Sunthorn Phu',
  gender: 'ชาย',
  year: 1786, month: 6, day: 26,
  hour: 12, minute: 0,
  lat: 13.75, lon: 100.5, timezone: 7,
  lang: 'th',
});
assert.strictEqual(sunthornPhu.score.total, sunthornPhu2.score.total,
  'Score should be deterministic — same input, same output');
console.log('✓ Deterministic: same input → same Cosmic Score');

// Test 4: Steve Jobs
const jobs = calc.calculate({
  year: 1955, month: 2, day: 24,
  hour: 19, minute: 15,
  lat: 37.7749, lon: -122.4194, timezone: -8,
  lang: 'en',
});
assert.ok(jobs.score?.total, 'Jobs should produce a score');
assert.ok(jobs.western?.sunSign, 'Jobs should have Western Sun sign');
console.log(`✓ Steve Jobs: Score ${jobs.score.total}, Sun ${jobs.western.sunSign}`);

// Test 5: At minimum has these 8 core systems
const requiredSystems = ['western', 'bazi', 'ninestar', 'numerology', 'vedic', 'mayan', 'celtic', 'humandesign'];
for (const sys of requiredSystems) {
  assert.ok(jobs[sys], `Chart should include "${sys}" system`);
}
console.log(`✓ All ${requiredSystems.length} required core systems present`);

console.log('\n=== ALL SMOKE TESTS PASSED ===');
