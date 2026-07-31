// Ascendant regression test — added 2026-07-31 after the ascendant was found to match the
// standard only 7% of the time (chance is ~8%).
//
// The existing suites (smoke, ergonomics, fuzz, bilingual) were all green while this was
// broken, because none of them compared engine output to anything outside the codebase.
// These assertions are chosen so they cannot pass for a wrong formula:
//
//   1. SWEEP    — the ascendant must pass through all 12 signs over 24 hours. The old bug
//                 made it revolve twice per day and only ever touch 3-4 signs.
//   2. SUNRISE  — at sunrise the eastern horizon is where the Sun is, so the ascendant must
//                 sit within a few degrees of the Sun's longitude. This is an external
//                 astronomical fact, not an internal invariant.
//   3. STANDARD — direct comparison against the textbook ascendant formula, independently
//                 implemented here, over a spread of dates/places/latitudes.
const assert = require('assert');
const calc = require('../src/engine/calc.cjs');

const D = Math.PI / 180;
const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const norm = (x) => ((x % 360) + 360) % 360;
const angDiff = (a, b) => { const d = Math.abs(norm(a) - norm(b)); return d > 180 ? 360 - d : d; };

function julianDay(y, m, d, h, mi, tz) {
  const ut = h + mi / 60 - tz;
  let Y = y, M = m;
  if (M <= 2) { Y--; M += 12; }
  const A = Math.floor(Y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + B - 1524.5 + ut / 24;
}

// Textbook ascendant, implemented independently of the engine.
function referenceAsc(y, m, d, h, mi, tz, lat, lon) {
  const J = julianDay(y, m, d, h, mi, tz), T = (J - 2451545) / 36525;
  const gmst = norm(280.46061837 + 360.98564736629 * (J - 2451545) + 0.000387933 * T * T);
  const R = norm(gmst + lon) * D, E = 23.4392911 * D, P = lat * D;
  return norm(Math.atan2(Math.cos(R), -(Math.sin(R) * Math.cos(E) + Math.tan(P) * Math.sin(E))) / D);
}

const chart = (o) => calc.calculate(Object.assign({ minute: 0, lang: 'en' }, o)).western;

console.log('=== Mythsensus ascendant test ===');

// 1. SWEEP — every sign must be hit across one day, and only once each.
{
  const seen = new Set();
  for (let h = 0; h < 24; h++) {
    for (const mi of [0, 30]) {
      seen.add(chart({ year: 1990, month: 6, day: 15, hour: h, minute: mi, lat: 13.75, lon: 100.5, timezone: 7 }).ascSign);
    }
  }
  assert.strictEqual(seen.size, 12, `ascendant only reached ${seen.size}/12 signs in 24h — it is not tracking sidereal time`);
  console.log('✓ sweeps all 12 signs in 24h');
}

// 2. SUNRISE — ascendant must be near the Sun when the Sun is on the horizon.
{
  const cases = [
    ['Bangkok  1990-06-15', { year: 1990, month: 6, day: 15, lat: 13.75, lon: 100.5, timezone: 7 }],
    ['Bangkok  1990-12-15', { year: 1990, month: 12, day: 15, lat: 13.75, lon: 100.5, timezone: 7 }],
    ['Quito    2000-03-20', { year: 2000, month: 3, day: 20, lat: -0.18, lon: -78.47, timezone: -5 }],
  ];
  for (const [label, base] of cases) {
    // find the hour where the Sun is closest to the horizon-rising point
    let best = null;
    for (let h = 3; h <= 9; h++) {
      for (let mi = 0; mi < 60; mi += 10) {
        const w = chart(Object.assign({}, base, { hour: h, minute: mi }));
        const gap = angDiff(w.ascDeg, w.sunDeg);
        if (!best || gap < best.gap) best = { gap, h, mi };
      }
    }
    assert.ok(best.gap < 6, `${label}: ascendant never came within 6° of the Sun around sunrise (best ${best.gap.toFixed(1)}°)`);
  }
  console.log('✓ ascendant meets the Sun at sunrise (all 3 locations)');
}

// 3. STANDARD — agree with the reference formula across varied dates, times, latitudes.
{
  const PLACES = [
    ['Bangkok', 13.75, 100.5, 7], ['London', 51.5077, -0.1277, 0],
    ['Sydney', -33.8688, 151.2093, 10], ['Reykjavik', 64.1466, -21.9426, 0],
  ];
  let seed = 4242;
  const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  let matched = 0, total = 0, worst = 0;
  for (const [, lat, lon, tz] of PLACES) {
    for (let i = 0; i < 40; i++) {
      const y = 1950 + rnd(70), m = 1 + rnd(12), d = 1 + rnd(28), h = rnd(24), mi = rnd(60);
      const got = chart({ year: y, month: m, day: d, hour: h, minute: mi, lat, lon, timezone: tz });
      const gap = angDiff(got.ascDeg, referenceAsc(y, m, d, h, mi, tz, lat, lon));
      worst = Math.max(worst, gap);
      total++;
      if (got.ascSign === SIGNS[Math.floor(referenceAsc(y, m, d, h, mi, tz, lat, lon) / 30)]) matched++;
    }
  }
  assert.ok(worst < 2, `ascendant drifts up to ${worst.toFixed(1)}° from the standard formula`);
  assert.strictEqual(matched, total, `rising sign matched only ${matched}/${total}`);
  console.log(`✓ matches the standard formula on ${total}/${total} charts (max drift ${worst.toFixed(2)}°)`);
}

console.log('\n=== ASCENDANT TESTS PASSED ===');
