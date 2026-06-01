"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = generateReport;
// ============================================================
//  MYTHSENSUS — Report HTML Generator
//  Generates full 25-section report from ChartData.
//  Structure-first version: all sections with real calculated data.
//  Expand prose text per section in future iterations.
// ============================================================
const calc_1 = require("./calc");
// ── helpers ──────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Strip HTML tags + collapse whitespace. Use for fields whose templates contain
// <strong>/<div>/<br> markup before truncating with substring(): cutting through
// a tag boundary leaves a broken open tag that the page renders as raw text.
const stripHtml = (s) => String(s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
// Truncate a string with an ellipsis when it actually overflows. Prefer this
// over bare .slice(0,N) for badge-style labels — bare slice silently drops
// the suffix (e.g. "เดือนความจริง-ไฟ" → "เดือนความจริง-ไ" looks broken).
const trunc = (s, n) => {
    const v = String(s ?? '');
    return v.length > n ? v.slice(0, Math.max(1, n - 1)) + '…' : v;
};
function bar(score, color) {
    const pct = Math.round((score - 300) / 7);
    return `<div style="background:#2a2010;border-radius:4px;height:10px;overflow:hidden;margin-top:4px">
    <div style="width:${pct}%;height:10px;border-radius:4px;background:${esc(color)}"></div></div>`;
}
function scoreColor(s) {
    if (s >= 850)
        return '#d4aa50';
    if (s >= 750)
        return '#1a8a3a';
    if (s >= 650)
        return '#3a5a80';
    return '#9a8a72';
}
function pill(text, bg = '#2a2010', color = '#d4aa50') {
    return `<span style="display:inline-block;background:${bg};color:${color};border-radius:20px;padding:2px 10px;font-size:11px;margin:2px">${esc(text)}</span>`;
}
// Auto-incrementing page counter (reset per report generation)
let _pageNum = 0;
let _totalPages = 43;
// Language for the currently-generating report. Set once by generateReport()
// from chart.input.lang so page headers/footers respect the user's choice.
let _lang = 'th';
// Translation helper. Use everywhere a Thai string is rendered into the
// report: tr('ดวงชะตา', 'destiny chart'). Returns Thai when _lang is 'th'
// (the default for the Thai-first market), English otherwise. Designed for
// inline use in template literals so the original Thai stays readable in
// source — translators / brand reviewers can still scan the English second
// argument without context-switching files.
const tr = (th, en) => _lang === 'en' ? en : th;
// ── Data-field translator ───────────────────────────────────────
// SLIM MAP after Phases A-B made the engine bilingual at the source.
// The remaining entries handle:
//   1. SCORE_WEIGHTS labels (system names baked into chart.score.breakdown
//      use Thai-mixed names like 'BaZi สี่เสา' / 'ไทยพราหมณ์' — these flow
//      directly to score-table renderers and need translation here).
//   2. Tier label aliases (chart.score.tier vs tierEn).
//   3. A handful of misc page-level fragments.
// All ~150 chart-data Thai entries (elements, directions, colours, days,
// stems, branches, totems, dreamings, aztec signs, celtic trees, ziwei
// stars, gods, profile descs, py meanings) are now handled at calc.ts
// via tPick/pEl/pDir/pColor/pDay — the chart object stores the
// language-correct value at calculate time, so trDF doesn't need them.
const _DF_MAP = {
    // SCORE_WEIGHTS system labels (mixed Thai-English in calc.ts:1188-1219)
    'โหราศาสตร์ตะวันตก': 'Western Astrology',
    'BaZi สี่เสา': 'BaZi · Four Pillars',
    'เลขศาสตร์ Pythagorean': 'Pythagorean Numerology',
    'เลข ๗ ตัว ๙ ฐาน': 'Thai 7-Number System',
    'ระบบประเภทพลังงาน': 'Human Design',
    'มายัน Tzolk\'in': 'Mayan Tzolk\'in',
    'เซลติก Tree': 'Celtic Tree',
    'ไทยพราหมณ์': 'Thai Brahmin',
    // Tier labels (chart.score.tier still ships Thai-prefixed when not en-only)
    'ฟ้า — Celestial': 'Celestial',
    'แสง — Radiant': 'Radiant',
    'เปล่งประกาย — Luminous': 'Luminous',
    'สั่นพ้อง — Resonant': 'Resonant',
    'หยั่งราก — Grounded': 'Grounded',
    'แสวงหา — Seeking': 'Seeking',
    'แสงเริ่มต้น — Awakening': 'Awakening',
    // Common short page-level fragments still surfacing in score breakdowns
    'เห็นด้วย': 'Agree', 'กลางๆ': 'Mixed', 'เสียงเตือน': 'Cautions',
    'ครบทุกธาตุ': 'all elements present',
};
// Translate a data-layer Thai string to English when in EN mode. Falls
// through unchanged when (a) lang is Thai or (b) the string isn\'t in the
// map — so untranslated strings remain visible (and traceable) instead of
// silently dropping.
const trDF = (s) => {
    if (_lang !== 'en' || !s)
        return s;
    return _DF_MAP[s] ?? s;
};
function section(_num, title, icon, content) {
    _pageNum++;
    const isEn = _lang === 'en';
    const pageLabel = isEn ? `Page ${_pageNum} / ${_totalPages}` : `หน้า ${_pageNum} / ${_totalPages}`;
    const footerText = isEn
        ? '✦ MYTHSENSUS COSMIC BLUEPRINT ✦ AI-generated analysis of 26 ancient systems · for personal exploration, not professional advice ✦'
        : '✦ MYTHSENSUS COSMIC BLUEPRINT ✦ รายงานสร้างโดย AI วิเคราะห์จาก 26 ศาสตร์โบราณ เพื่อการสำรวจตนเอง ไม่ใช่คำแนะนำวิชาชีพ ✦';
    // No per-page bg override — body star-field shows through transparent .page
    return `
<div class="page">
  <div class="page-header">
    <span class="page-icon">${icon}</span>
    <span class="page-title">${esc(title)}</span>
    <span class="page-num">${pageLabel}</span>
  </div>
  <div class="page-body">
    ${content}
  </div>
  <div class="page-footer">${footerText}</div>
</div>`;
}
function row2(label, value) {
    return `<tr><td class="lbl">${esc(label)}</td><td>${esc(value)}</td></tr>`;
}
function box(title, body, type = 'gold') {
    const styles = {
        gold: 'background:#1e1a0e;border:1px solid #d4aa50;border-radius:8px;padding:14px;margin:8px 0',
        green: 'background:#0a1a0e;border:1px solid #1a8a3a;border-radius:8px;padding:14px;margin:8px 0',
        red: 'background:#1a0a0a;border:2px solid #c01020;border-radius:8px;padding:14px;margin:8px 0',
        dark: 'background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:14px;margin:8px 0',
        purple: 'background:#120a1a;border:1px solid #7a3aaa;border-radius:8px;padding:14px;margin:8px 0',
    };
    return `<div style="${styles[type]}"><div style="font-weight:bold;margin-bottom:8px;color:#d4aa50">${esc(title)}</div><div style="font-size:13px;line-height:1.8;color:#c8c0a8">${body}</div></div>`;
}
// ── CSS ───────────────────────────────────────────────────────
// Background uses a layered star-field via multiple radial-gradients
// (restored — previous version lost the starfield when bg was simplified
// to flat #0e0c08). Pages no longer have a hard min-height constraint so
// long content flows onto a second/third page naturally instead of being
// clipped.
const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{
  font-family:'Sarabun','Noto Sans Thai',sans-serif;
  color:#f0e8d0;
  background-color:#0e0c08;
  background-image:
    radial-gradient(1px 1px at 14% 22%, rgba(255,235,200,.85) 50%, transparent 55%),
    radial-gradient(1px 1px at 26% 72%, rgba(200,220,255,.70) 50%, transparent 55%),
    radial-gradient(1px 1px at 42% 34%, rgba(255,255,255,.80) 50%, transparent 55%),
    radial-gradient(1.3px 1.3px at 58% 18%, rgba(255,245,220,.95) 50%, transparent 55%),
    radial-gradient(1px 1px at 73% 64%, rgba(220,220,255,.75) 50%, transparent 55%),
    radial-gradient(1px 1px at 82% 30%, rgba(255,255,230,.85) 50%, transparent 55%),
    radial-gradient(1.5px 1.5px at 92% 78%, rgba(255,235,200,.95) 50%, transparent 55%),
    radial-gradient(0.8px 0.8px at 10% 88%, rgba(255,255,255,.60) 50%, transparent 55%),
    radial-gradient(0.8px 0.8px at 34% 8%,  rgba(200,220,255,.60) 50%, transparent 55%),
    radial-gradient(0.9px 0.9px at 65% 90%, rgba(255,245,220,.70) 50%, transparent 55%),
    radial-gradient(ellipse at center, #141018 0%, #0a0812 55%, #050308 100%);
  background-size: 600px 800px, 700px 900px, 500px 700px, 800px 600px, 640px 750px, 720px 820px, 560px 680px, 900px 1000px, 820px 920px, 680px 860px, 100% 100%;
  background-attachment: fixed;
}
/* Each page uses transparent so the body star field shows through.
   min-height removed so content flows to next page when overflowing —
   UX first, hard pagination second. */
.page{padding:14mm 16mm 16mm;page-break-after:always;position:relative;background:transparent}
.page-header{display:flex;align-items:center;gap:10px;border-bottom:1px solid #3a3020;padding-bottom:10px;margin-bottom:18px}
.page-icon{font-size:22px}
.page-title{font-size:16px;font-weight:700;color:#d4aa50;flex:1;letter-spacing:1px}
.page-num{font-size:11px;color:#6a5a42}
.page-body{font-size:13px;line-height:1.8;color:#c8c0a8;padding-bottom:40px}
.page-footer{text-align:center;font-size:9px;color:#6a5a42;border-top:1px solid #2a2010;padding-top:6px;margin-top:18px}
h2{font-size:15px;color:#d4aa50;font-weight:700;margin:16px 0 8px;border-left:3px solid #d4aa50;padding-left:10px}
h3{font-size:13px;color:#c8a840;font-weight:600;margin:12px 0 6px}
p{margin-bottom:8px;color:#c8c0a8}
table{width:100%;border-collapse:collapse;margin:10px 0}
th{background:#1a1510;color:#d4aa50;padding:8px 10px;text-align:left;font-size:12px}
td{padding:7px 10px;border-bottom:1px solid #2a2010;font-size:12px;vertical-align:top}
.lbl{color:#9a8a72;font-weight:600;width:30%;background:#151210}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:10px 0}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:10px 0}
.stat-card{background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px;text-align:center}
.stat-card .val{font-size:28px;font-weight:700;color:#d4aa50}
.stat-card .lbl{font-size:11px;color:#9a8a72;width:auto;background:transparent;padding:0;margin-top:4px}
.pillar{background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px;text-align:center}
.pillar.dm{border-color:#d4aa50;background:#1e1a0e}
.pillar .stem{font-size:32px;font-weight:700;color:#d4aa50}
.pillar .branch{font-size:22px;color:#c8a840;margin-top:4px}
.pillar .sublabel{font-size:10px;color:#6a5a42;margin-top:2px}
.conv{border-left:3px solid #d4aa50;padding:8px 12px;margin:8px 0;background:#1a1510}
.conv.med{border-left-color:#6a5a42;background:#151210}
.warn{background:#1a0a0a;border:2px solid #c01020;border-radius:8px;padding:12px;margin:8px 0;color:#f0c8b0}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;margin:2px}
@media print{
  .page{page-break-after:always;min-height:0}
  body{background:#fff;color:#1a1510}
  .page{background:#fff!important}
  h2{color:#8a6820}
  .page-title{color:#8a6820}
  .stat-card,.pillar{background:#f8f5f0;border-color:#ccc}
  td{border-color:#ddd}
  .lbl{background:#f0ede8}
}`;
// ── PAGES ─────────────────────────────────────────────────────
// dd/mm/yyyy is ambiguous in international audiences (3/2 = March 2 or Feb 3?).
// Render with localized month name to remove the ambiguity.
const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatDob = (input) => {
    const months = input.lang === 'en' ? MONTHS_EN : MONTHS_TH;
    const m = months[Math.max(0, Math.min(11, input.month - 1))];
    return `${input.day} ${m} ${input.year}`;
};
function p01_cover(c) {
    const { score, bazi, western, ninestar, numerology, input } = c;
    const dobStr = formatDob({ ...input, lang: _lang });
    const timeStr = _lang === 'en'
        ? `${String(input.hour).padStart(2, '0')}:${String(input.minute).padStart(2, '0')}`
        : `${String(input.hour).padStart(2, '0')}:${String(input.minute).padStart(2, '0')} น.`;
    // Current age — surfaced on the cover so readers immediately notice if
    // their birth-year was off by 10 (a common typo: 1985 vs 1995). Birthday
    // hasn't happened yet this year? subtract 1.
    const _now = new Date();
    let _age = _now.getFullYear() - input.year;
    const _birthdayThisYear = new Date(_now.getFullYear(), input.month - 1, input.day);
    if (_now < _birthdayThisYear)
        _age -= 1;
    const ageStr = _lang === 'en' ? `${_age} years old` : `อายุ ${_age} ปี`;
    const pctBar = Math.round((score.total - 400) / 6);
    // Tier label is only available in Thai from the engine. When rendering EN,
    // prefer score.tierEn (already English) and skip the secondary "TierEn ·"
    // line since it would duplicate. In TH we keep both to give the reader
    // both languages on the same row.
    const tierMain = _lang === 'en' ? esc(score.tierEn || score.tier) : esc(score.tier);
    const tierSub = _lang === 'en'
        ? `${esc(score.percentile)} ${tr('ของโลก', 'globally')}`
        : `${esc(score.tierEn)} · ${esc(score.percentile)} ${tr('ของโลก', 'globally')}`;
    return section(1, tr('Cosmic Blueprint — ภาพรวม', 'Cosmic Blueprint — Overview'), '✦', `
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:10px;color:#6a5a42;letter-spacing:4px;margin-bottom:6px">✦ MYTHSENSUS — PREMIUM EDITION ✦</div>
      <div style="font-size:22px;font-weight:700;color:#d4aa50;margin-bottom:4px">Cosmic Blueprint · 26 Ancient Systems</div>
      <div style="font-size:12px;color:#9a8a72">${esc(input.gender)} ${esc(input.name)} · ${dobStr} · ${timeStr} · <strong style="color:#d4aa50">${ageStr}</strong></div>
      <div style="font-size:10.5px;color:#6a5a42;margin-top:4px;font-style:italic">${tr('ตรวจดูว่าวันเดือนปีถูก — ถ้าอายุไม่ตรง ให้กลับไปแก้ที่ Profile', 'Double-check the date — if the age is wrong, edit your profile')}</div>
    </div>

    <!-- Cosmic Score -->
    <div style="background:#1a1510;border:2px solid #d4aa50;border-radius:14px;padding:20px;margin:12px 0">
      <div style="display:flex;gap:20px;align-items:center">
        <div style="text-align:center;min-width:90px">
          <div style="font-size:60px;font-weight:700;color:#d4aa50;line-height:1">${score.cosmicFinal}</div>
          <div style="font-size:10px;color:#6a5a42;letter-spacing:1px">COSMIC SCORE</div>
          <div style="font-size:8px;color:#6a5a42;letter-spacing:.5px;margin-top:2px">${score.cosmicFinal === score.total ? 'Soul Frequency' : 'SF×40% + LT×30% + PR×30%'}</div>
        </div>
        <div style="flex:1">
          <div style="font-size:20px;font-weight:700;color:#f0e8d0">${tierMain}</div>
          <div style="font-size:12px;color:#9a8a72;margin-bottom:8px">${tierSub}</div>
          <div style="background:#2a2010;border-radius:6px;height:10px;overflow:hidden">
            <div style="width:${pctBar}%;height:10px;background:linear-gradient(90deg,#5a3810,#d4aa50)"></div>
          </div>
          <div style="font-size:10px;color:#6a5a42;margin-top:4px">
            ${tr('Median 26 ศาสตร์', 'Median 26 systems')} · Mean ${score.mean} · Modal ${score.modalBin}–${score.modalBin + 49}
          </div>
        </div>
      </div>
      <!-- Consensus bar -->
      <div style="display:flex;gap:6px;margin-top:14px;align-items:center">
        <div style="font-size:11px;color:#9a8a72;min-width:60px">Consensus:</div>
        <div style="background:#1a3a10;border-radius:4px;padding:3px 10px;font-size:12px;font-weight:600;color:#4aaa4a">🌟 ${score.starCount}/26</div>
        <div style="background:#2a2a10;border-radius:4px;padding:3px 10px;font-size:12px;color:#aaa84a">〰 ${score.midCount}/26</div>
        <div style="background:#3a1510;border-radius:4px;padding:3px 10px;font-size:12px;color:#aa5a4a">⚠ ${score.warnCount}/26</div>
        <div style="flex:1;font-size:10px;color:#6a5a42;text-align:right">
          ${score.starCount >= 18 ? 'Strong consensus' : score.starCount >= 12 ? 'Moderate consensus' : score.starCount >= 8 ? 'Mixed signals' : 'Rare split chart'}
        </div>
      </div>
    </div>

    <!-- 3-Score Framework -->
    <div style="margin:14px 0">
      <div style="font-size:12px;color:#9a8a72;margin-bottom:8px;letter-spacing:2px">THE 3-SCORE FRAMEWORK</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        <!-- Soul Frequency -->
        <div style="background:#151a10;border:1px solid #4a6a20;border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:10px;color:#6a8a40;letter-spacing:1px;margin-bottom:4px">SOUL FREQUENCY</div>
          <div style="font-size:28px;font-weight:700;color:#8aba50">${score.soulFrequency}</div>
          <div style="font-size:10px;color:#6a8a40">${tr('Born chart · น้ำมันเกรดไหน', 'Born chart · petroleum grade')}</div>
        </div>
        <!-- Life Terrain -->
        <div style="background:#1a1510;border:1px solid ${score.lifeTerrainScore > 0 ? '#8a6030' : '#3a2010'};border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:10px;color:#8a6030;letter-spacing:1px;margin-bottom:4px">LIFE TERRAIN</div>
          <div style="font-size:28px;font-weight:700;color:${score.lifeTerrainScore > 0 ? '#d4a040' : '#6a4020'}">${score.lifeTerrainScore > 0 ? score.lifeTerrainScore : '—'}</div>
          <div style="font-size:10px;color:#8a6030">${score.lifeTerrainScore > 0 ? 'Work environment' : tr('กรอกอาชีพ+ประเทศ', 'Add career + country')}</div>
          ${score.lifeTerrainDetail ? `<div style="font-size:9px;color:#6a4020;margin-top:3px">${esc(score.lifeTerrainDetail.split('|')[0])}</div>` : ''}
        </div>
        <!-- Path Resonance -->
        <div style="background:#10151a;border:1px solid ${score.pathResonanceScore > 0 ? '#205a5a' : '#103030'};border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:10px;color:#408080;letter-spacing:1px;margin-bottom:4px">PATH RESONANCE</div>
          <div style="font-size:28px;font-weight:700;color:${score.pathResonanceScore > 0 ? '#40c0a0' : '#206050'}">${score.pathResonanceScore > 0 ? score.pathResonanceScore : '—'}</div>
          <div style="font-size:10px;color:#408080">${score.pathResonanceScore > 0 ? 'Domain fit' : tr('กรอกสายงาน', 'Add domain')}</div>
          ${score.pathResonanceDetail ? `<div style="font-size:9px;color:#205050;margin-top:3px">${esc(score.pathResonanceDetail.split('|')[0])}</div>` : ''}
        </div>
      </div>
      <!-- Cosmic Final -->
      <div style="background:#1a1510;border-radius:8px;padding:10px;margin-top:8px;display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:11px;color:#9a8a72">
          Cosmic Final = SF×40% + LT×30% + PR×30%
          ${score.lifeTerrainScore === 0 ? ' · ' + tr('(LT/PR ยังไม่กรอกข้อมูล)', '(LT/PR not filled yet)') : ''}
        </div>
        <div style="font-size:24px;font-weight:700;color:#d4aa50">${score.cosmicFinal}</div>
      </div>
    </div>

    <!-- Key signals -->
    <div class="grid-3" style="margin:12px 0">
      ${(() => {
        // Match the emoji to the actual element so the visual cue agrees with
        // the label. Previously this was a hard-coded 🔥 next to all Day Masters
        // — Water-element users saw a fire emoji and assumed they were Fire.
        const elEmoji = {
            'ไม้': '🌳', 'ไฟ': '🔥', 'ดิน': '🌍', 'โลหะ': '⚔️', 'น้ำ': '🌊',
            'Wood': '🌳', 'Fire': '🔥', 'Earth': '🌍', 'Metal': '⚔️', 'Water': '🌊',
        };
        const dmE = elEmoji[bazi.dayMasterElement] || '✦';
        return [
            [`${dmE} ${tr('ธาตุประจำตัว (BaZi)', 'Primary Element (BaZi)')}`, `${bazi.dayStem} ${bazi.dayMasterElement}`],
            [tr('⭐ ดาวประจำตัว (NSK)', '⭐ Birth Star (NSK)'), ninestar.star + ' ' + ninestar.starName],
            [tr('☀️ Western', '☀️ Western Sun'), _lang === 'en' ? western.sunSign || western.sunSignTh : western.sunSignTh],
            ['🕉️ Vedic Lagna', c.vedic.lagnaSign],
            [tr('⚡ พลังงาน', '⚡ Energy Type'), _lang === 'en' ? c.humandesign.type || c.humandesign.typeTh : c.humandesign.typeTh],
            ['🔢 Life Path', `${numerology.lifePath}`],
        ].map(([l, v]) => `<div class="stat-card"><div class="lbl">${esc(l)}</div><div style="font-size:13px;font-weight:600;color:#d4aa50;margin-top:3px">${esc(v)}</div></div>`).join('');
    })()}
    </div>

    <!-- Element Consensus — answers "which element am I really?" by tallying
         all the birth-fixed element fields across the 26 systems. The BaZi
         Day Master is the East-Asian canonical "your element" but multiple
         systems contribute their own element-read; if a majority agree, the
         consensus is the "loudest" elemental signal. We exclude time-variable
         fields (vedicMahadasha.dashaElement changes with the current period). -->
    ${(() => {
        const ee = { 'ไม้': '🌳', 'ไฟ': '🔥', 'ดิน': '🌍', 'โลหะ': '⚔️', 'น้ำ': '🌊', 'Wood': '🌳', 'Fire': '🔥', 'Earth': '🌍', 'Metal': '⚔️', 'Water': '🌊' };
        const votes = {};
        const _v = (sys, el) => { if (!el)
            return; (votes[el] = votes[el] || []).push(sys); };
        _v('BaZi Day Master', bazi.dayMasterElement);
        _v('BaZi Dominant', bazi.dominantElement);
        _v('Nine Star Ki', ninestar.starElement);
        _v('Celtic Tree', c.celtic.element);
        _v('Saju', c.saju.sajuElement);
        _v('Tibetan Mewa', c.tibetan.mewaElement);
        _v('Tibetan Parkha', c.tibetan.parkhaElement);
        _v('Norse Rune', c.norseRune.runeElement);
        _v('Ogham', c.ogham.element);
        const total = Object.values(votes).reduce((s, a) => s + a.length, 0);
        if (total < 2)
            return '';
        const sorted = Object.entries(votes).sort((a, b) => b[1].length - a[1].length);
        const [winEl, winSys] = sorted[0];
        const winEmoji = ee[winEl] || '✦';
        const matchBaZi = winEl === bazi.dayMasterElement;
        const minorityLines = sorted.slice(1).map(([el, sys]) => `${ee[el] || '·'} ${esc(el)} ${sys.length} (${esc(sys.join(', '))})`).join(' · ');
        return `
    <div style="background:linear-gradient(135deg,#0e1a2a,#1a2a3e);border:2px solid #5a8acc;border-radius:12px;padding:14px 18px;margin:12px 0">
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <div style="font-size:36px;line-height:1">${winEmoji}</div>
        <div style="flex:1;min-width:200px">
          <div style="font-size:10px;color:#7aaae0;letter-spacing:2px;margin-bottom:3px">${tr('🤝 ฉันทามติธาตุ', '🤝 ELEMENT CONSENSUS')}</div>
          <div style="font-size:20px;font-weight:700;color:#aac8ff">${esc(winEl)}${matchBaZi ? '' : ` <span style="font-size:11px;color:#7a8aaa">(${tr('ต่างจาก BaZi', 'differs from BaZi')})</span>`}</div>
          <div style="font-size:11px;color:#90a8c8;margin-top:4px;line-height:1.6"><strong style="color:#aac8ff">${winSys.length}/${total}</strong> ${tr('ศาสตร์เห็นพ้อง', 'systems agree')} · ${esc(winSys.join(' · '))}</div>
          ${sorted.length > 1 ? `<div style="font-size:10.5px;color:#6a7a90;margin-top:4px">${tr('อีกฝั่งหนึ่ง', 'Other view')}: ${minorityLines}</div>` : ''}
        </div>
      </div>
      <div style="font-size:10.5px;color:#6a7a90;margin-top:10px;padding-top:10px;border-top:1px solid #2a3a5a;line-height:1.65">
        ${tr('ทำไมแต่ละศาสตร์ให้ต่างกัน? · ทุกศาสตร์มอง "ธาตุ" จากมุมของตัวเอง — BaZi ดูจาก Day Master (วันเกิด), Nine Star Ki ดูจากดาวเกิด, Celtic ดูจากต้นไม้ประจำวันเกิด ฯลฯ · ฉันทามติคือธาตุที่หลายๆ ศาสตร์เห็นตรงกัน = พลังที่ "ออกมาชัด" ที่สุดในตัวคุณ', 'Why do systems differ? · Each tradition reads "element" from its own angle — BaZi uses your Day Master, Nine Star Ki your birth star, Celtic your birth tree, etc. The consensus is the element multiple systems agree on = the energy that shows up most clearly in you.')}
      </div>
    </div>`;
    })()}

    ${bazi.benMingNian2026 ? `
    <div class="warn">
      <strong>⚠️ ${tr('Ben Ming Nian 2569', 'Ben Ming Nian (2026)')}</strong> — ${tr('เกิดปีม้า ตรงปี 2569 = ทุกสิ่งขยายผล ต้องใส่สีแดง 1 ชิ้น/วัน', 'Year of the Horse coincides with 2026 — everything amplifies. Wear at least one red item per day to balance.')}
    </div>` : ''}

    <div style="background:#0e0a16;border:1px solid #5a3a8a;border-radius:8px;padding:12px;margin:10px 0;display:flex;gap:12px;align-items:center">
      <div style="font-size:24px">✨</div>
      <div>
        <div style="font-size:13px;color:#c0a0e0;font-weight:600">${esc(score.cosmicEntity)}</div>
        <div style="font-size:11px;color:#7a6a9a;margin-top:2px">${tr('สัญลักษณ์จักรวาล', 'Cosmic symbol')} · ${esc(score.primaryGod)} &amp; ${esc(score.secondaryGod)}</div>
      </div>
    </div>
  `);
}
const JOURNEY_TIERS = [
    { min: 850, fuel: { th: 'เครื่องบินเจ็ท', en: 'Jet fuel' }, vehicle: { th: 'เครื่องบิน', en: 'Airplane', icon: '✈️' }, road: { th: 'ท้องฟ้าเปิด', en: 'Open sky', icon: '🌌' } },
    { min: 760, fuel: { th: 'เบนซิน 95+', en: '95+ premium' }, vehicle: { th: 'รถสปอร์ต', en: 'Sports car', icon: '🏎️' }, road: { th: 'ทางด่วน', en: 'Highway', icon: '🛣️' } },
    { min: 700, fuel: { th: 'เบนซิน 91', en: '91 regular' }, vehicle: { th: 'ซีดาน', en: 'Sedan', icon: '🚗' }, road: { th: 'ถนนหลัก', en: 'Main road', icon: '🛤️' } },
    { min: 0, fuel: { th: 'ดีเซล', en: 'Diesel' }, vehicle: { th: 'รถเก่า', en: 'Old car', icon: '🚙' }, road: { th: 'ทางลูกรัง', en: 'Dirt road', icon: '🪨' } },
];
// Resolve a score to its tier. Always returns a tier (last entry has min:0
// so any non-negative score lands somewhere). Caller is responsible for
// gating on score > 0 before calling — score=0 still maps to "Diesel/Old car"
// which would be misleading; we use it only as a typed fallback.
const _journeyTier = (score) => JOURNEY_TIERS.find(t => score >= t.min);
// Render the three-card Cosmic Journey panel. Cards 2-3 (Vehicle, Road) are
// gated on score > 0 — empty score means the user hasn't provided
// career/country/domain context, so we render the placeholder CTA instead of
// inventing a tier from default fallbacks (see review H1).
function _renderCosmicJourney(score) {
    const fuelTier = _journeyTier(score.total);
    const ltFilled = score.lifeTerrainScore > 0;
    const prFilled = score.pathResonanceScore > 0;
    const ltTier = ltFilled ? _journeyTier(score.lifeTerrainScore) : null;
    const prTier = prFilled ? _journeyTier(score.pathResonanceScore) : null;
    return `
    <!-- Cosmic Journey analogy -->
    <div style="background:#120a06;border:1px solid #5a3010;border-radius:8px;padding:14px;margin-bottom:14px">
      <div style="font-size:12px;color:#9a6040;margin-bottom:8px;font-weight:600">🛢️ ${tr('ดวงเหมือนการเดินทาง', 'Cosmic Journey')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;font-size:11px">
        <div style="background:#1a0e06;border-radius:6px;padding:10px">
          <div style="font-size:20px;margin-bottom:4px">🛢️</div>
          <div style="color:#d4aa50;font-weight:600">${tr('น้ำมัน', 'Fuel')}</div>
          <div style="color:#7a5a40;margin-top:2px">Soul Frequency</div>
          <div style="color:#aa8050;font-size:12px;margin-top:4px">${score.total} = ${tr(fuelTier.fuel.th, fuelTier.fuel.en)}</div>
        </div>
        <div style="background:#1a1206;border-radius:6px;padding:10px;opacity:${ltFilled ? '1' : '0.7'}">
          <div style="font-size:20px;margin-bottom:4px">${ltTier ? ltTier.vehicle.icon : '🚗'}</div>
          <div style="color:#aa8840;font-weight:600">${tr('พาหนะ', 'Vehicle')}</div>
          <div style="color:#7a6030;margin-top:2px">Life Terrain</div>
          <div style="color:${ltFilled ? '#d4a040' : '#7a6030'};font-size:12px;margin-top:4px;font-weight:${ltFilled ? '700' : '400'}">${ltTier ? `${score.lifeTerrainScore} = ${tr(ltTier.vehicle.th, ltTier.vehicle.en)}` : tr('กรอกอาชีพ+ประเทศ', 'Add career + country')}</div>
        </div>
        <div style="background:#0a1015;border-radius:6px;padding:10px;opacity:${prFilled ? '1' : '0.7'}">
          <div style="font-size:20px;margin-bottom:4px">${prTier ? prTier.road.icon : '🛣️'}</div>
          <div style="color:#408890;font-weight:600">${tr('เส้นทาง', 'Road')}</div>
          <div style="color:#306070;margin-top:2px">Path Resonance</div>
          <div style="color:${prFilled ? '#40c0a0' : '#306070'};font-size:12px;margin-top:4px;font-weight:${prFilled ? '700' : '400'}">${prTier ? `${score.pathResonanceScore} = ${tr(prTier.road.th, prTier.road.en)}` : tr('กรอกสายงาน', 'Add domain')}</div>
        </div>
      </div>
    </div>`;
}
// ── 3-SCORE DETAIL ─────────────────────────────────────────────
function p_threeScores(c) {
    const { bazi, score } = c;
    const SHENG = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
    const EL_EN = { 'ไม้': 'Wood', 'ไฟ': 'Fire', 'ดิน': 'Earth', 'โลหะ': 'Metal', 'น้ำ': 'Water' };
    const dmElEn = EL_EN[bazi.dayMasterElement] ?? 'Fire';
    // Domain example: Interior BD (construction = Earth, BD = Fire domain → Fire creates Earth → DM_CREATES)
    const bdEl = 'ไฟ'; // BD domain = fire (persuasion, leadership)
    const industryEl = 'ดิน'; // interior/construction = earth
    const countryEl = 'ไม้'; // Thailand = Wood (tropical, agricultural)
    const feedsDm = SHENG[EL_EN[countryEl] ?? ''] === dmElEn;
    const domainFit = SHENG[EL_EN[bdEl] ?? ''] === EL_EN[industryEl] ? 'ธาตุงานเสริมกัน ✓' : 'ธาตุงานต่างกัน';
    // Prose character portrait — answers the page's "who you are" promise in
    // words, synthesising element + tier + the loudest and quietest systems.
    const dmEl = bazi.dayMasterElement;
    const sortedSys = score.breakdown.slice().sort((a, b) => b.score - a.score);
    const topSys = sortedSys[0], secondSys = sortedSys[1], lowSys = sortedSys[sortedSys.length - 1];
    const tierLabel = _lang === 'en' ? (score.tierEn || score.tier) : score.tier;
    const portrait = tr(`ถ้าจะสรุปคุณเป็นย่อหน้าเดียว: คุณคือพลังงานธาตุ${esc(dmEl)} ที่แกนกลางของดวงสั่นพ้องในระดับ "${esc(tierLabel)}" (${esc(score.percentile)}) · ศาสตร์ที่ขับตัวตนคุณออกมาชัดที่สุดคือ <strong style="color:#c0e080">${esc(trDF(topSys.system))}</strong> — ${esc(stripHtml(String(topSys.finding || '')))} เสริมด้วยเสียงของ ${esc(trDF(secondSys.system))} อีกแรง · ส่วน ${esc(trDF(lowSys.system))} ที่ให้คะแนนต่ำสุดไม่ได้แปลว่าคุณอ่อนด้านนั้น แต่คือมุมที่พลังงานของคุณเลือกไม่เดินเป็นทางหลัก — และความ "ไม่เท่ากันทุกด้าน" นี่เองที่ทำให้คุณเป็นคุณ ไม่ใช่ค่าเฉลี่ยของใคร`, `If we had to capture you in a single paragraph: you are ${esc(dmEl)}-element energy whose core resonates at the "${esc(tierLabel)}" level (${esc(score.percentile)}). The system that voices your identity most clearly is <strong style="color:#c0e080">${esc(trDF(topSys.system))}</strong> — ${esc(stripHtml(String(topSys.finding || '')))}, reinforced by ${esc(trDF(secondSys.system))}. Your lowest-scoring system, ${esc(trDF(lowSys.system))}, doesn't mean you're weak there — it's simply an angle your energy chooses not to travel as a main road. That very unevenness is what makes you <em>you</em>, not an average of anyone else.`);
    return section(2, tr('Soul Frequency — คุณเป็นใครตั้งแต่เกิด', 'Soul Frequency — Who You Are From Birth'), '🔥', `
    <div style="font-size:12px;color:#7a8a60;margin-bottom:16px;line-height:1.6">
      ${tr('Soul Frequency คือ', 'Soul Frequency is')} <strong style="color:#c0d080">${tr('คุณภาพดวงชะตาพื้นฐาน', 'your fundamental chart quality')}</strong> — ${tr('ไม่เปลี่ยนแปลง เหมือนเกรดน้ำมัน', 'unchanging, like the grade of petroleum')}<br>
      ${tr('คำนวณจาก Median ของ 26 ศาสตร์โบราณ (ถ่วงน้ำหนักเท่ากัน)', 'Calculated from the median of 26 ancient systems (equal weight)')}
    </div>

    <!-- Soul Frequency big display -->
    <div style="background:linear-gradient(135deg,#0e1a08,#1a2810);border:2px solid #4a7a20;border-radius:12px;padding:20px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:20px">
        <div style="text-align:center">
          <div style="font-size:64px;font-weight:700;color:#8aba50;line-height:1">${score.total}</div>
          <div style="font-size:11px;color:#5a8a30;letter-spacing:2px">SOUL FREQUENCY</div>
        </div>
        <div style="flex:1">
          <div style="font-size:16px;font-weight:600;color:#c0e080">${_lang === 'en' ? esc(score.tierEn || score.tier) : esc(score.tier)}</div>
          <div style="font-size:12px;color:#7a9a50;margin:4px 0">${esc(score.percentile)}</div>
          <div style="background:#0a1205;border-radius:4px;height:8px;overflow:hidden;margin:8px 0">
            <div style="width:${Math.round((score.total - 400) / 6)}%;height:8px;background:linear-gradient(90deg,#2a5010,#8aba50)"></div>
          </div>
          <div style="display:flex;gap:8px;font-size:11px;color:#5a7a40">
            <span>Median: <strong style="color:#8aba50">${score.total}</strong></span>
            <span>Mean: ${score.mean}</span>
            <span>Modal: ${score.modalBin}–${score.modalBin + 49}</span>
          </div>
        </div>
      </div>
    </div>

    ${box(tr('ภาพรวมตัวตนคุณในหนึ่งย่อหน้า', 'Your portrait in one paragraph'), portrait, 'green')}

    ${_renderCosmicJourney(score)}

    <!-- Top contributors -->
    <div style="margin-bottom:14px">
      <div style="font-size:12px;color:#9a8a72;margin-bottom:8px">${tr('ระบบที่ให้คะแนนสูงสุด (Top 5)', 'Top-5 highest-scoring systems')}</div>
      ${c.score.breakdown.slice().sort((a, b) => b.score - a.score).slice(0, 5).map(b => `<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0;padding:6px 10px;background:#1a1510;border-radius:6px">
          <span style="font-size:12px;color:#c8b890">${esc(trDF(b.system))}</span>
          <span style="font-size:13px;font-weight:700;color:#d4aa50">${b.score}</span>
        </div>`).join('')}
    </div>

    <!-- Bottom contributors -->
    <div>
      <div style="font-size:12px;color:#9a8a72;margin-bottom:8px">${tr('ระบบที่ให้คะแนนต่ำสุด (Bottom 3) — ดาบสองคม', 'Bottom-3 lowest-scoring systems — double-edged sword')}</div>
      ${c.score.breakdown.slice().sort((a, b) => a.score - b.score).slice(0, 3).map(b => `<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0;padding:6px 10px;background:#1a1008;border-radius:6px;border-left:2px solid #6a3010">
          <span style="font-size:12px;color:#a87050">${esc(trDF(b.system))}</span>
          <div style="text-align:right">
            <span style="font-size:13px;font-weight:700;color:#d07040">${b.score}</span>
            <div style="font-size:10px;color:#7a5030">${esc(b.finding.slice(0, 40))}</div>
          </div>
        </div>`).join('')}
      <div style="font-size:10px;color:#5a4030;margin-top:6px">
        ${tr('ⓘ คะแนนต่ำ ≠ แย่ — แสดงว่าระบบนั้นเห็นต่าง หรือพลังงานนั้นไม่ใช่ทิศทางหลักของคุณ', 'ⓘ A low score ≠ bad — it means this system sees something different, or that energy isn\'t your primary direction')}
      </div>
    </div>
  `);
}
function p02_scoreBreakdown(c) {
    // Group into 🌟 ≥780 / 〰 650-779 / ⚠ <650
    const sorted = c.score.breakdown.slice().sort((a, b) => b.score - a.score);
    const stars = sorted.filter(b => b.score >= 780);
    const mids = sorted.filter(b => b.score >= 650 && b.score < 780);
    const warns = sorted.filter(b => b.score < 650);
    const systemRow = (b, icon) => `
    <div style="display:flex;align-items:center;gap:8px;margin:3px 0;padding:5px 8px;background:#141210;border-radius:6px">
      <span style="min-width:20px;text-align:center">${icon}</span>
      <span style="flex:1;font-size:12px;color:#c8b890">${esc(trDF(b.system))}</span>
      <span style="font-size:12px;font-weight:600;color:#d4aa50;min-width:34px;text-align:right">${b.score}</span>
      <div style="width:80px;background:#1a1510;border-radius:3px;height:6px;overflow:hidden">
        <div style="width:${Math.round((b.score - 400) / 6)}%;height:6px;background:${b.color}"></div>
      </div>
    </div>`;
    return section(3, tr('26-System Consensus — ทุกศาสตร์เห็นอะไร', '26-System Consensus — what every tradition sees'), '🌐', `
    <div style="font-size:11px;color:#7a6a52;margin-bottom:12px;line-height:1.6">
      ${tr('Equal weight · แต่ละระบบ 3.8% · คะแนน Median', 'Equal weight · each system 3.8% · Median score')} = <strong style="color:#d4aa50">${c.score.total}</strong>
      · Mean = ${c.score.mean} · Modal range = ${c.score.modalBin}–${c.score.modalBin + 49}
    </div>

    <!-- Stars -->
    <div style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:600;color:#4aaa4a;margin-bottom:6px">
        🌟 ${tr('เห็นด้วย', 'In agreement')} — ${stars.length} ${tr('ระบบ (คะแนน ≥780)', 'systems (score ≥780)')}
      </div>
      ${stars.map(b => systemRow(b, '🌟')).join('')}
    </div>

    <!-- Mids -->
    <div style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:600;color:#aaaa4a;margin-bottom:6px">
        〰 ${tr('กลางๆ', 'Mixed')} — ${mids.length} ${tr('ระบบ (650–779)', 'systems (650–779)')}
      </div>
      ${mids.map(b => systemRow(b, '〰')).join('')}
    </div>

    <!-- Warns -->
    ${warns.length > 0 ? `
    <div style="margin-bottom:12px">
      <div style="font-size:13px;font-weight:600;color:#aa6a4a;margin-bottom:6px">
        ⚠ ${tr('เสียงเตือน', 'Caution signals')} — ${warns.length} ${tr('ระบบ (ต่ำกว่า 650)', 'systems (below 650)')}
      </div>
      ${warns.map(b => systemRow(b, '⚠')).join('')}
      <div style="font-size:10px;color:#7a5040;margin-top:6px">
        ${tr('ⓘ เสียงเตือน = ระบบนี้มองเห็นความท้าทาย หรือพลังงานนั้นไม่ใช่ทิศหลักของคุณ ไม่ได้แปลว่า "แย่"', 'ⓘ A caution signal = this system sees a challenge, or that energy isn\'t your primary direction. It doesn\'t mean "bad".')}
      </div>
    </div>` : ''}

    <!-- Stats summary -->
    <div style="background:#1a1510;border-radius:8px;padding:12px;margin-top:12px">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center">
        ${[
        ['Median', c.score.total, '#d4aa50'],
        ['Mean', c.score.mean, '#b09040'],
        [tr('ต่ำสุด', 'Lowest'), Math.min(...c.score.breakdown.map(b => b.score)), '#c07050'],
        [tr('สูงสุด', 'Highest'), Math.max(...c.score.breakdown.map(b => b.score)), '#70c070'],
    ].map(([l, v, col]) => `<div><div style="font-size:18px;font-weight:700;color:${col}">${v}</div><div style="font-size:10px;color:#6a5a42">${l}</div></div>`).join('')}
      </div>
    </div>
  `);
}
function p03_convergence(c) {
    const all26 = c.score.breakdown; // all 26 systems with scores
    const medianScore = c.score.total;
    const hi = (s) => s >= medianScore; // "votes yes" if at or above median
    // Helper: get system score by name fragment
    const sc = (nameFragment) => all26.find(b => b.system.includes(nameFragment))?.score ?? 0;
    const { score, bazi, western, ninestar, numerology, vedic, humandesign, mayan, celtic, thai, saju, tibetan, ziwei, onmyodo, hellenistic, norseRune, ogham, arabicParts, kabbalistic, zoroastrian, aztec, nativeAmerican, ifaYoruba, aboriginal, biorhythm, vedicMahadasha } = c;
    const dmEl = bazi.dayMasterElement;
    const themes = [];
    // ─── 1. Element Resonance (ธาตุ Day Master แผ่ซึมทุกศาสตร์) ─────────────
    // Vote: system score ≥ median + element/energy aligns with DM
    const ELEM_EL_MAP = { 'ไม้': 'Wood', 'ไฟ': 'Fire', 'ดิน': 'Earth', 'โลหะ': 'Metal', 'น้ำ': 'Water', 'ลม': 'Wood', 'Air': 'Wood' };
    const SHENG = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
    const dmElEn = ELEM_EL_MAP[dmEl] ?? 'Fire';
    const elVotes = [];
    // BaZi — always votes for its own DM
    elVotes.push({ system: 'BaZi Day Master', score: sc('BaZi') });
    // Systems that directly echo the same element
    if (ninestar.starElement === dmEl)
        elVotes.push({ system: 'Nine Star Ki (' + ninestar.starName + ')', score: sc('Nine Star') });
    if (saju.sajuElement === dmEl)
        elVotes.push({ system: 'Saju Korean', score: sc('Saju') });
    if (norseRune.runeElement === dmEl)
        elVotes.push({ system: 'Norse Rune ' + norseRune.rune + ' ' + norseRune.runeName, score: sc('Norse') });
    if (ogham.element === dmEl)
        elVotes.push({ system: 'Ogham ' + ogham.ogham + ' ' + ogham.treeName, score: sc('Ogham') });
    // Systems that produce dmEl's element OR compatible element
    if (celtic.element === dmEl || SHENG[ELEM_EL_MAP[celtic.element] ?? ''] === dmElEn)
        elVotes.push({ system: 'Celtic ' + celtic.treeNameTh + ' (' + celtic.element + ')', score: sc('เซลติก') });
    if (tibetan.mewaElement === dmEl || SHENG[ELEM_EL_MAP[tibetan.mewaElement] ?? ''] === dmElEn)
        elVotes.push({ system: 'Tibetan Mewa ' + tibetan.mewa + ' (' + tibetan.mewaElement + ')', score: sc('Tibetan') });
    if (nativeAmerican.element === dmEl || SHENG[ELEM_EL_MAP[nativeAmerican.element] ?? ''] === dmElEn)
        elVotes.push({ system: 'Native American ' + nativeAmerican.birthTotemTh, score: sc('Native') });
    // High-scoring systems that support the DM element path
    if (hi(sc('Vedic')) && vedicMahadasha.dashaElement === dmEl)
        elVotes.push({ system: 'Vedic Dasha ' + vedicMahadasha.currentDasha, score: sc('Vedic M') });
    if (hi(sc('Zoroastrian')) && zoroastrian.harmony)
        elVotes.push({ system: 'Zoroastrian (harmony)', score: sc('Zoroastrian') });
    if (hi(sc('Hellenistic')) && hellenistic.sect === 'Day Sect' && dmEl === 'ไฟ')
        elVotes.push({ system: 'Hellenistic Day Sect', score: sc('Hellenistic') });
    [
        { sys: 'Aztec', label: 'Aztec ' + aztec.daySignTh },
        { sys: 'Ifa', label: 'Ifa/Yoruba ' + ifaYoruba.odu },
        { sys: 'Aboriginal', label: 'Aboriginal ' + aboriginal.dreamingTh },
        { sys: 'Kabbalistic', label: 'Kabbalistic ' + kabbalistic.sephira },
        { sys: 'Onmyōdō', label: 'Onmyōdō ' + onmyodo.rokuyo },
    ].forEach(({ sys, label }) => { const s = all26.find(b => b.system.toLowerCase().includes(sys.toLowerCase()))?.score ?? 0; if (s >= 780)
        elVotes.push({ system: label, score: s }); });
    themes.push({ icon: '🔥',
        theme: tr(`ธาตุ${dmEl} — แกนพลังงานที่ทุกศาสตร์สะท้อน`, `${trDF(dmEl)} Element — the energetic core every system reflects`),
        color: '#d48050', votes: elVotes,
        msg: tr(`Day Master ${bazi.dayStem} (${bazi.dayMasterTh}) + สีมงคล ${ninestar.starColor} + ทิศ ${ninestar.starDirection} — ธาตุ${dmEl}คือเส้นด้ายทอง`, `Day Master ${bazi.dayStem} (${trDF(bazi.dayMasterTh)}) + lucky colour ${trDF(ninestar.starColor)} + direction ${trDF(ninestar.starDirection)} — ${trDF(dmEl)} is the golden thread.`) });
    // ─── 2. High-Score Consensus (ศาสตร์ที่เห็นภาพรวมดี) ───────────────────
    const highVotes = all26.filter(b => b.score >= 780).map(b => ({ system: b.system, score: b.score }));
    themes.push({ icon: '🌟',
        theme: tr('High Consensus — ศาสตร์ที่เห็นภาพดีพร้อมกัน (คะแนน ≥780)', 'High Consensus — systems agreeing on a strong picture (scores ≥780)'),
        color: '#c0a030', votes: highVotes,
        msg: tr(`${highVotes.length} ระบบให้คะแนนสูง — Top: ${highVotes.sort((a, b) => b.score - a.score).slice(0, 3).map(v => v.system.split(' ')[0]).join(' · ')}`, `${highVotes.length} systems score high — Top: ${highVotes.sort((a, b) => b.score - a.score).slice(0, 3).map(v => v.system.split(' ')[0]).join(' · ')}`) });
    // ─── 3. Timing 2026 — ปีนี้มีพลังงานพิเศษ ────────────────────────────────
    const timeVotes = [];
    if (bazi.benMingNian2026)
        timeVotes.push({ system: 'BaZi Ben Ming Nian ม้า', score: sc('BaZi') });
    if (ninestar.star === 9)
        timeVotes.push({ system: 'NSK Star 9 Honmei Kaiki', score: sc('Nine Star') });
    if ([1, 3, 8, 9].includes(numerology.personalYear2026))
        timeVotes.push({ system: 'Numerology PY' + numerology.personalYear2026, score: sc('Pythagorean') });
    if (['Jupiter', 'Sun', 'Venus'].includes(vedicMahadasha.currentDasha))
        timeVotes.push({ system: 'Vedic ' + vedicMahadasha.currentDasha + ' Dasha', score: sc('Vedic M') });
    if (biorhythm.intellectual > 20 || biorhythm.emotional > 20)
        timeVotes.push({ system: 'Biorhythm (peak ' + Math.max(biorhythm.intellectual, biorhythm.emotional) + '%)', score: sc('Biorhythm') });
    if (!['รุ่งเรือง', 'เข้มแข็ง', 'มั่นคง', 'เติบโต'].every(q => !tibetan.mewaQuality.includes(q)))
        timeVotes.push({ system: 'Tibetan Mewa ' + tibetan.mewa + ' (' + tibetan.mewaQuality + ')', score: sc('Tibetan') });
    if (['大安', '友引'].includes(onmyodo.rokuyo))
        timeVotes.push({ system: 'Onmyōdō ' + onmyodo.rokuyo, score: sc('Onmyōdō') });
    if (zoroastrian.harmony)
        timeVotes.push({ system: 'Zoroastrian harmony', score: sc('Zoroastrian') });
    if (['Ogbe', 'Ose', 'Obara', 'Otura'].includes(ifaYoruba.odu))
        timeVotes.push({ system: 'Ifa/Yoruba ' + ifaYoruba.odu + ' (' + ifaYoruba.fortune + ')', score: sc('Ifa') });
    if (hi(sc('Hellenistic')))
        timeVotes.push({ system: 'Hellenistic Fortune ' + hellenistic.lotSign, score: sc('Hellenistic') });
    if (['Fehu', 'Jera', 'Dagaz', 'Sowilo'].includes(norseRune.runeName))
        timeVotes.push({ system: 'Norse Rune ' + norseRune.runeName, score: sc('Norse') });
    if (sc('Aztec') >= 780)
        timeVotes.push({ system: 'Aztec ' + aztec.daySignTh + ' Tone ' + aztec.toneNumber, score: sc('Aztec') });
    if (sc('Aboriginal') >= 770)
        timeVotes.push({ system: 'Aboriginal ' + aboriginal.dreamingTh, score: sc('Aboriginal') });
    if (hi(sc('Saju')))
        timeVotes.push({ system: 'Saju ' + saju.kwarsal, score: sc('Saju') });
    if (sc('Zi Wei') >= 770)
        timeVotes.push({ system: 'Zi Wei ' + ziwei.mainStarTh, score: sc('Zi Wei') });
    themes.push({ icon: '⏰',
        theme: tr('ปี 2026 — หน้าต่างโอกาส', '2026 — Window of Opportunity'),
        color: '#50c050', votes: timeVotes,
        msg: `${bazi.benMingNian2026 ? 'Ben Ming Nian + ' : ''} ${ninestar.star === 9 ? 'NSK Honmei + ' : ''} PY${numerology.personalYear2026} + ${vedicMahadasha.currentDasha} Dasha` });
    // ─── 4. Strength / Authority (ความแข็งแกร่ง) ─────────────────────────────
    const strVotes = [];
    [sc('BaZi'), sc('Nine Star'), sc('Saju'), sc('Zi Wei'), sc('Tibetan'), sc('Norse'), sc('Kabbalistic')].forEach((s, i) => {
        const labels = ['BaZi ' + bazi.dayMasterTh, 'NSK Star ' + ninestar.star, 'Saju ' + saju.dominantEnergy, 'Zi Wei ' + ziwei.mainStarTh, 'Tibetan Mewa ' + tibetan.mewa, 'Norse ' + norseRune.runeName, 'Kabbalistic ' + kabbalistic.sephira];
        if (s >= 780)
            strVotes.push({ system: labels[i], score: s });
    });
    if (['Projector', 'Manifesting Generator', 'Manifestor'].includes(humandesign.type))
        strVotes.push({ system: 'Energy Type ' + humandesign.typeTh, score: sc('พลังงาน') });
    if ([1, 8, 11, 22, 33].includes(numerology.lifePath) || numerology.lifePath >= 7)
        strVotes.push({ system: 'Life Path ' + numerology.lifePath + ' ' + numerology.lifePathName.split('—')[0], score: sc('Pythagorean') });
    if (hi(sc('Hellenistic')))
        strVotes.push({ system: 'Hellenistic ' + hellenistic.trigonLord.split('(')[0], score: sc('Hellenistic') });
    if (['Ogbe', 'Obara', 'Ogunda'].includes(ifaYoruba.odu))
        strVotes.push({ system: 'Ifa/Yoruba ' + ifaYoruba.odu, score: sc('Ifa') });
    if (hi(sc('Native')))
        strVotes.push({ system: 'Native Am ' + nativeAmerican.birthTotemTh, score: sc('Native') });
    if (hi(sc('Aztec')))
        strVotes.push({ system: 'Aztec ' + aztec.daySignTh, score: sc('Aztec') });
    themes.push({ icon: '👑',
        theme: tr('ความแข็งแกร่งและอำนาจ — พลังงานผู้นำ', 'Strength & Authority — Leadership Energy'),
        color: '#c0a030', votes: strVotes,
        msg: `${trDF(humandesign.typeTh)} Profile ${humandesign.profile} + LP${numerology.lifePath} + NSK Star ${ninestar.star} + Zi Wei ${trDF(ziwei.mainStarTh)}` });
    // ─── 5. Wealth / Material (ศักยภาพทรัพย์) ────────────────────────────────
    const wlthVotes = [];
    if (hi(sc('Arabic')))
        wlthVotes.push({ system: 'Arabic Parts Fortune ' + arabicParts.fortuneSign, score: sc('Arabic') });
    if (hi(sc('Hellenistic')))
        wlthVotes.push({ system: 'Hellenistic ' + hellenistic.sect, score: sc('Hellenistic') });
    ['Ifa', 'Zi Wei', 'Kabbalistic', 'Norse', 'Ogham', 'Aztec', 'Native', 'Aboriginal', 'Zoroastrian', 'Tibetan', 'Onmyōdō', 'Saju'].forEach(name => {
        const s = all26.find(b => b.system.toLowerCase().includes(name.toLowerCase()))?.score ?? 0;
        if (s >= 780) {
            const labels = {
                'Ifa': 'Ifa ' + ifaYoruba.fortune, 'Zi Wei': 'Zi Wei ' + ziwei.palaceQuality, 'Kabbalistic': 'Kabbalistic ' + kabbalistic.sephira,
                'Norse': 'Norse Rune ' + norseRune.runeName, 'Ogham': 'Ogham ' + ogham.treeNameTh, 'Aztec': 'Aztec ' + aztec.daySignQuality,
                'Native': 'Native Am ' + nativeAmerican.birthTotemTh, 'Aboriginal': 'Aboriginal ' + aboriginal.dreamingTh,
                'Zoroastrian': 'Zoroastrian ' + trunc(zoroastrian.dayYazataTh, 20), 'Tibetan': 'Tibetan Mewa ' + tibetan.mewa,
                'Onmyōdō': 'Onmyōdō ' + onmyodo.rokuyo, 'Saju': 'Saju ' + saju.kwarsal,
            };
            wlthVotes.push({ system: labels[name] ?? name, score: s });
        }
    });
    if (['Jupiter', 'Venus', 'Sun'].includes(vedicMahadasha.currentDasha))
        wlthVotes.push({ system: 'Vedic ' + vedicMahadasha.currentDasha + ' Dasha', score: sc('Vedic M') });
    if ([8, 4, 22].includes(numerology.pythagorean))
        wlthVotes.push({ system: 'Pythagorean ' + numerology.pythagorean, score: sc('Pythagorean') });
    themes.push({ icon: '💎',
        theme: tr('ศักยภาพความมั่งคั่ง', 'Wealth Potential'),
        color: '#50b080', votes: wlthVotes,
        msg: tr(`${wlthVotes.length} ระบบเห็นโอกาส — Arabic Parts ใน${arabicParts.fortuneSign} + ${vedicMahadasha.currentDasha} Dasha + Lucky Element ${bazi.luckyElement}`, `${wlthVotes.length} systems see opportunity — Arabic Parts in ${trDF(arabicParts.fortuneSign)} + ${vedicMahadasha.currentDasha} Dasha + Lucky Element ${trDF(bazi.luckyElement)}`) });
    // ─── 6. Spiritual / Inner Depth (ความลึกภายใน) ───────────────────────────
    const deptVotes = [];
    if ([7, 9, 11, 33].includes(numerology.lifePath))
        deptVotes.push({ system: 'Life Path ' + numerology.lifePath, score: sc('Pythagorean') });
    if (humandesign.profile.startsWith('6') || humandesign.profile.startsWith('5'))
        deptVotes.push({ system: 'HD Profile ' + humandesign.profile, score: sc('พลังงาน') });
    ['Kabbalistic', 'Aboriginal', 'Ifa', 'Norse', 'Ogham', 'Tibetan', 'Aztec', 'Zoroastrian', 'Native'].forEach(name => {
        const s = all26.find(b => b.system.toLowerCase().includes(name.toLowerCase()))?.score ?? 0;
        if (s >= 760) {
            const lbl = {
                'Kabbalistic': 'Kabbalistic ' + kabbalistic.sephira, 'Aboriginal': 'Aboriginal ' + aboriginal.dreamingTh,
                'Ifa': 'Ifa/Yoruba ' + ifaYoruba.oduTheme.slice(0, 15), 'Norse': 'Norse Rune ' + norseRune.runeKeyword,
                'Ogham': 'Ogham ' + ogham.oghamClass, 'Tibetan': 'Tibetan Mewa ' + tibetan.mewaQuality,
                'Aztec': 'Aztec ' + aztec.daySignQuality, 'Zoroastrian': 'Zoroastrian ' + trunc(zoroastrian.monthAmeshaTh, 22),
                'Native': 'Native Am ' + nativeAmerican.clansmother,
            };
            deptVotes.push({ system: lbl[name] ?? name, score: s });
        }
    });
    if (['กรกฎ', 'พิจิก', 'มีน'].includes(western.moonSignTh))
        deptVotes.push({ system: 'Western Moon ' + western.moonSignTh, score: sc('ตะวันตก') });
    themes.push({ icon: '🔮',
        theme: tr('ความลึกภายใน — จิตวิญญาณและสัญชาตญาณ', 'Inner Depth — Spirit & Intuition'),
        color: '#9060c0', votes: deptVotes,
        msg: `LP${numerology.lifePath} + ${kabbalistic.sephira} + ${trDF(aboriginal.dreamingTh)} + Vedic Nakshatra ${vedic.moonNakshatra}` });
    // ─── 7. Tension / Challenge (จุดท้าทาย) ───────────────────────────────────
    const warnVotes = all26.filter(b => b.score < 650).map(b => ({ system: b.system + ' (' + b.score + ')', score: b.score }));
    if (bazi.missingElement && bazi.missingElement !== 'ครบทุกธาตุ')
        warnVotes.push({ system: 'BaZi ขาดธาตุ' + bazi.missingElement, score: sc('BaZi') });
    if (['Rahu', 'Saturn', 'Ketu'].includes(vedicMahadasha.currentDasha))
        warnVotes.push({ system: 'Vedic Dasha ' + vedicMahadasha.currentDasha, score: sc('Vedic M') });
    themes.push({ icon: '⚡',
        theme: tr('จุดท้าทาย — พลังงานสร้างการเติบโต', 'Challenge Points — Energy that drives growth'),
        color: '#c05030', votes: warnVotes,
        msg: tr(`ระบบที่เห็นต่าง: ${warnVotes.slice(0, 3).map(v => v.system.split(' (')[0].split(' ')[0]).join(', ')} — ความขัดแย้งนี้เป็นแรงขับ ไม่ใช่ข้อบกพร่อง`, `Dissenting systems: ${warnVotes.slice(0, 3).map(v => v.system.split(' (')[0].split(' ')[0]).join(', ')} — this friction is fuel, not a flaw.`) });
    // ─── 8. Relationship / Network ───────────────────────────────────────────
    const relVotes = [];
    if (humandesign.profile.includes('4') || humandesign.profile.includes('6'))
        relVotes.push({ system: 'HD Profile ' + humandesign.profile, score: sc('พลังงาน') });
    ['Ifa', 'Aboriginal', 'Native', 'Zoroastrian', 'Kabbalistic', 'Ogham', 'Norse'].forEach(name => {
        const s = all26.find(b => b.system.toLowerCase().includes(name.toLowerCase()))?.score ?? 0;
        if (s >= 760) {
            const lbl = {
                'Ifa': 'Ifa/Yoruba ' + ifaYoruba.oduTheme.slice(0, 12), 'Aboriginal': 'Aboriginal ' + aboriginal.clan,
                'Native': 'Native Am ' + nativeAmerican.clansmother, 'Zoroastrian': 'Zoroastrian ' + trunc(zoroastrian.dayYazataTh, 20),
                'Kabbalistic': 'Kabbalistic ' + kabbalistic.archangel, 'Ogham': 'Ogham ' + ogham.treeName,
                'Norse': 'Norse Rune ' + norseRune.runeName,
            };
            relVotes.push({ system: lbl[name] ?? name, score: s });
        }
    });
    if (['ตุลย์', 'กรกฎ', 'มีน', 'พฤษภ'].includes(western.sunSignTh))
        relVotes.push({ system: 'Western Sun ' + western.sunSignTh, score: sc('ตะวันตก') });
    themes.push({ icon: '💞',
        theme: tr('พลังความสัมพันธ์ — เครือข่ายและการเชื่อมต่อ', 'Relational Power — Networks & Connection'),
        color: '#c06080', votes: relVotes,
        msg: `HD Profile ${humandesign.profile} + ${kabbalistic.archangel} + ${nativeAmerican.clansmother} + ${trDF(ifaYoruba.oduTheme.slice(0, 20))}` });
    const visible = themes.filter(t => t.votes.length >= 3).sort((a, b) => b.votes.length - a.votes.length);
    // Generate narrative for each theme based on chart data
    const narratives = {
        '🔥': tr(`จาก ${c.score.breakdown.filter(b => b.score >= 780).length} ระบบที่ให้คะแนนสูง ธาตุ${dmEl}ปรากฏชัดเจนที่สุด — Day Master ${bazi.dayStem} (${bazi.dayMasterTh}) กำหนดวิธีที่คุณประมวลผลโลก ไม่ใช่แค่ "นิสัย" แต่คือโครงสร้างพื้นฐานของการตัดสินใจและพลังงานชีวิต ศาสตร์ทั้งในและตะวันตกต่างยืนยันสิ่งเดียวกันโดยไม่รู้จักกัน`, `Across the ${c.score.breakdown.filter(b => b.score >= 780).length} highest-scoring systems, the ${trDF(dmEl)} element shows up most clearly. Day Master ${bazi.dayStem} (${trDF(bazi.dayMasterTh)}) shapes how you process the world — not as "personality", but as the underlying structure of how you make decisions and where your life-force flows. Eastern and Western traditions, computed independently, both confirm the same signal.`),
        '🌟': tr(`เมื่อมีระบบจากหลายวัฒนธรรม (ตะวันออก ตะวันตก แอฟริกา อเมริกา โอเชียเนีย) ต่างให้คะแนนสูงพร้อมกัน — นั่นคือ consensus ที่แท้จริง ไม่ใช่แค่ระบบใดระบบหนึ่งชอบ แต่ "ดวงชาตา" นี้แข็งแกร่งข้ามวัฒนธรรม`, `When systems from multiple cultures (East, West, Africa, the Americas, Oceania) score high simultaneously — that's true consensus. Not one tradition that happens to favour you, but a chart that holds up across cultural lenses.`),
        '⏰': tr(`ปี 2026 ไม่ใช่แค่ปีดีโดยบังเอิญ แต่มีกลไกทางโหราศาสตร์หลายชั้นเปิดพร้อมกัน — BaZi Ben Ming Nian หมายถึงพลังงานของคุณ "กลับบ้าน" ครบรอบ 12 ปี, NSK Star 9 Honmei Kaiki หมายถึงดาวเกิดตรงกับดาวปี, Vedic Dasha ชี้ช่วงปกครอง ${vedicMahadasha.currentDasha} — นี่คือ window ที่ควรลงมือ`, `2026 is not just incidentally good — multiple astrological mechanisms open at once. BaZi Ben Ming Nian means your energy "comes home" on its 12-year cycle. NSK Star 9 Honmei Kaiki means your birth star aligns with the year-star. Vedic Dasha currently rules ${vedicMahadasha.currentDasha} — this is the window for action.`),
        '👑': tr(`ลักษณะผู้นำในดวงชาตาไม่ได้มาจากความทะเยอทะยาน แต่มาจากโครงสร้างของพลังงาน — ${humandesign.typeTh} Strategy "${humandesign.strategy}" ประกอบกับ NSK Star ${ninestar.star} และ LP${numerology.lifePath} บ่งว่าคุณถูกออกแบบให้ "guide" มากกว่า "push"`, `The leadership signature in your chart isn't ambition — it's energetic structure. ${trDF(humandesign.typeTh)} Strategy "${trDF(humandesign.strategy)}" combined with NSK Star ${ninestar.star} and LP${numerology.lifePath} indicates you're designed to "guide" rather than "push".`),
        '💎': tr(`ศักยภาพทรัพย์ในดวงไม่ใช่การรับรองว่าจะรวย แต่คือ "ทิศทาง" ที่พลังงานไหลได้ดีที่สุด — Arabic Parts Fortune ใน${arabicParts.fortuneSign} ร่วมกับ ${vedicMahadasha.currentDasha} Dasha และ Lucky Element ${bazi.luckyElement} บ่งทิศ`, `Wealth potential in a chart isn't a guarantee of riches — it's the direction your energy flows best. Arabic Parts Fortune in ${trDF(arabicParts.fortuneSign)} combined with the ${vedicMahadasha.currentDasha} Dasha and Lucky Element ${trDF(bazi.luckyElement)} marks that direction.`),
        '🔮': tr(`ความลึกทางจิตวิญญาณใน LP${numerology.lifePath} + ${kabbalistic.sephira} + ${celtic.treeNameTh} บ่งว่าคุณมี "antenna" รับสัญญาณที่ละเอียดกว่าคนทั่วไป — สิ่งนี้อาจทำให้ตัดสินใจช้า แต่เมื่อตัดสินใจแล้วมักถูกต้อง`, `The spiritual depth across LP${numerology.lifePath} + ${kabbalistic.sephira} + ${trDF(celtic.treeNameTh)} suggests you have a finer "antenna" for subtle signals than most people. This can make decisions slow — but when you do decide, you're usually right.`),
        '⚡': tr(`ทุกจุดท้าทายในดวงมีเหตุผล — ธาตุขาด${bazi.missingElement ? bazi.missingElement : 'ไม่มี'} คือพลังงานที่ต้องหามาจากภายนอก ระบบที่ score ต่ำกว่า median ไม่ได้บอกว่า "ดวงแย่" แต่บอกว่า "พลังงานนั้นไม่ใช่ทิศหลัก"`, `Every challenge in your chart has a reason. The missing ${trDF(bazi.missingElement) || 'no'} element is the energy you must source from outside. Systems scoring below median don't say "bad chart" — they say "this energy isn't your primary direction".`),
        '💞': tr(`พลังความสัมพันธ์ใน HD Profile ${humandesign.profile} + ${kabbalistic.archangel} + ${nativeAmerican.clansmother} บ่งว่าเครือข่ายมนุษย์คือ multiplier — คนเดียวได้ 1x แต่ผ่านคนที่ใช่ได้ 5-10x`, `The relational signature in HD Profile ${humandesign.profile} + ${kabbalistic.archangel} + ${nativeAmerican.clansmother} indicates that human networks are your multiplier — solo you do 1x, but through the right people 5-10x.`),
    };
    const FAMILY_MAP = [
        ['BaZi', 'east'], ['Nine Star', 'east'], ['Saju', 'east'], ['Zi Wei', 'east'],
        ['Onmyōdō', 'east'], ['Tibetan', 'east'], ['ไทยพราหมณ์', 'east'], ['เลข ๗ ตัว', 'east'],
        ['Vedic Jyotish', 'east'], ['Vedic Mahadasha', 'east'],
        ['ตะวันตก', 'west'], ['Hellenistic', 'west'], ['Pythagorean', 'west'],
        ['Kabbalistic', 'west'], ['เซลติก', 'west'], ['Ogham', 'west'], ['Arabic', 'west'],
        ['มายัน', 'indigenous'], ['Aztec', 'indigenous'], ['Native', 'indigenous'],
        ['Aboriginal', 'indigenous'], ['Ifa', 'indigenous'],
        ['Norse', 'esoteric'], ['Zoroastrian', 'esoteric'], ['ระบบประเภทพลังงาน', 'esoteric'],
        ['Biorhythm', 'esoteric'],
    ];
    const familyOf = (sys) => {
        for (const [frag, fam] of FAMILY_MAP)
            if (sys.includes(frag))
                return fam;
        return null;
    };
    const families = {
        east: { total: 0, strong: 0, resonance: 0, weak: 0, names: [], strongNames: [] },
        west: { total: 0, strong: 0, resonance: 0, weak: 0, names: [], strongNames: [] },
        indigenous: { total: 0, strong: 0, resonance: 0, weak: 0, names: [], strongNames: [] },
        esoteric: { total: 0, strong: 0, resonance: 0, weak: 0, names: [], strongNames: [] },
    };
    for (const b of all26) {
        const fam = familyOf(b.system);
        if (!fam)
            continue;
        families[fam].total++;
        families[fam].names.push(b.system);
        if (b.score >= 780) {
            families[fam].strong++;
            families[fam].strongNames.push(b.system);
        }
        else if (b.score >= 650) {
            families[fam].resonance++;
        }
        else {
            families[fam].weak++;
        }
    }
    const fams = ['east', 'west', 'indigenous', 'esoteric'];
    const totalStrong = fams.reduce((s, f) => s + families[f].strong, 0);
    const totalResonance = fams.reduce((s, f) => s + families[f].resonance, 0);
    const totalWeak = fams.reduce((s, f) => s + families[f].weak, 0);
    const dominantFamily = fams.reduce((m, f) => (families[f].strong / families[f].total) > (families[m].strong / families[m].total) ? f : m, 'east');
    // ── Rarity math for the Unique Signature box ──
    // BaZi Day Pillar combinations: 10 stems × 12 branches = 60
    // Vedic Nakshatra × Pada: 27 nakshatras × 4 padas = 108
    // Mayan Kin: 13 tones × 20 day signs = 260
    // Joint combinations: 60 × 108 × 260 = 1,684,800 unique cosmic fingerprints.
    // World population ≈ 8B → ≈ 4,750 people share each fingerprint.
    const totalCombos = 60 * 108 * 260;
    const peopleSharing = Math.round(8000000000 / totalCombos);
    const nakshatra = c.vedic.moonNakshatra || '—';
    const pada = c.vedic.nakshathraPada || c.vedic.nakshatraPada || '';
    const mayanLbl = `${c.mayan.kin} ${_lang === 'en' ? c.mayan.daySignName : c.mayan.daySignNameTh}`;
    // ── Variant Perception ──────────────────────────────────────────────────
    // Surface systems that genuinely DISAGREE with the consensus — not just
    // "three lowest scores". Two filters:
    //   1. Exclude TIME-VARIABLE systems (Biorhythm = today's energy,
    //      Vedic Mahadasha = current planetary period). They speak about the
    //      moment, not the person, so they can't meaningfully "dissent" from
    //      an identity-level read.
    //   2. Require the score to be meaningfully BELOW the chart's own median
    //      (gap ≥ 50). Three lowest could be one point under median for a
    //      cohesive chart — that's coherence, not dissent.
    // If fewer than 2 real dissenters exist, the chart is highly coherent and
    // the Variant box renders a "your chart speaks with one voice" message
    // instead of forcing weak dissents.
    const VARIANT_EXCLUDE = ['Biorhythm', 'Vedic Mahadasha'];
    const dissenters = [...all26]
        .filter(b => !VARIANT_EXCLUDE.some(ex => b.system.includes(ex)))
        .filter(b => b.score < medianScore - 50)
        .sort((a, b) => a.score - b.score)
        .slice(0, 3);
    // Each dissenter needs a short "what it sees differently" line. Prefer the
    // system's own finding; if empty, fall back to a generic shadow phrase so
    // the row never renders a bare score with a trailing dash.
    const dissentLine = (d) => {
        const f = (d.finding || '').trim();
        if (f)
            return esc(f.slice(0, 90));
        return tr('เห็นมิติที่ระบบส่วนใหญ่ไม่ได้เน้น', 'sees a dimension the majority underplays');
    };
    const variantBox = dissenters.length >= 2
        ? `
    <div style="background:linear-gradient(135deg,#1a0a14,#180a28);border:2px solid #8a5acc;border-radius:12px;padding:14px 18px;margin:14px 0">
      <div style="font-size:10px;letter-spacing:3px;color:#c08ad8;margin-bottom:6px">${tr('🔍 อีกมุมหนึ่งที่น่าฟัง — variant perception', '🔍 THE DISSENTING VIEW — variant perception')}</div>
      <div style="font-size:12px;color:#d0a8e0;line-height:1.8;margin-bottom:8px">${tr(`เมื่อศาสตร์ส่วนใหญ่เห็นภาพรวมเป็นบวก ${dissenters.length} ศาสตร์ที่ให้คะแนนต่ำกว่าค่ากลางของคุณชัดเจน มักชี้สิ่งที่ระบบใหญ่มองข้าม — ไม่ใช่ "ดวงแย่" แต่เป็นมิติในเงาที่ควรฟังตอนตัดสินใจใหญ่:`, `When the majority sees a positive picture, the ${dissenters.length} systems scoring clearly below your own median often reveal what the consensus misses — not "bad chart" but the shadow dimension worth hearing when stakes are high:`)}</div>
      <div style="font-size:11.5px;color:#b890d0;line-height:1.9">
        ${dissenters.map(d => `• <strong>${esc(d.system)}</strong> <span style="color:#8868a0">(${d.score})</span> — ${dissentLine(d)}`).join('<br>')}
      </div>
      <div style="font-size:10px;color:#806090;margin-top:10px;padding-top:8px;border-top:1px solid #3a2050">${tr('🎯 ใช้ยังไง: ก่อนตัดสินใจใหญ่ (อาชีพ ความสัมพันธ์ การลงทุน) อ่านเสียงข้างน้อยนี้ซ้ำ มันมักชี้สิ่งที่คุณรู้ลึกๆ แต่ไม่อยากยอมรับ', '🎯 How to use: before big decisions (career, relationships, investments), re-read these dissenting voices — they often name what you already sense but resist admitting')}</div>
    </div>`
        : `
    <div style="background:linear-gradient(135deg,#0a1a14,#0a1828);border:2px solid #5acc8a;border-radius:12px;padding:14px 18px;margin:14px 0">
      <div style="font-size:10px;letter-spacing:3px;color:#7ad8a8;margin-bottom:6px">${tr('🎯 ดวงที่กลมกลืน — rare coherence', '🎯 A COHERENT CHART — rare coherence')}</div>
      <div style="font-size:12px;color:#a8e0c8;line-height:1.8">${tr(`ดวงของคุณ "พูดด้วยเสียงเดียว" — ไม่มีศาสตร์ระบุตัวตนใดให้คะแนนต่ำกว่าค่ากลางของคุณอย่างมีนัยสำคัญ นี่หายากกว่าที่คิด: ${dissenters.length === 1 ? 'มีเพียง 1 ศาสตร์ที่เห็นต่างเล็กน้อย' : 'แทบทุกศาสตร์เห็นภาพไปทางเดียวกัน'} เมื่อมุมมองส่วนใหญ่สอดคล้องกัน ความมั่นใจในการตัดสินใจของคุณมีพื้นฐานแข็งแรง — แต่ระวัง blind spot ที่ไม่มีใครเตือน`, `Your chart "speaks with one voice" — no identity-level system scores significantly below your own median. This is rarer than it sounds: ${dissenters.length === 1 ? 'only one system dissents, and only mildly' : 'nearly every system points the same way'}. When most lenses agree, your decisions rest on solid ground — but watch for the blind spot no one is there to flag.`)}</div>
    </div>`;
    // ── Headline TL;DR — one-paragraph summary ──
    const elemConsensusEl = dmEl; // we already established cover's element consensus
    const tldrCore = tr(`26 ศาสตร์มอง <strong style="color:#f0d060">${esc(c.input.name || 'คุณ')}</strong> = พลังธาตุ<strong>${esc(dmEl)}</strong> · <strong style="color:#f0d060">"${esc(score.cosmicEntity)}"</strong> · Life Path <strong>${numerology.lifePath}</strong> "${esc((numerology.lifePathName || '').split('—')[0].trim())}" · ${bazi.benMingNian2026 ? 'Ben Ming Nian + ' : ''}${ninestar.star === 9 ? 'NSK Honmei + ' : ''}Personal Year <strong>${numerology.personalYear2026}</strong> · ${totalStrong}/26 ศาสตร์ยืนยันชัด, ${totalWeak}/26 เห็นจุดท้าทาย · ลายเซ็นจักรวาล ~1 ใน ${(totalCombos / 1000).toFixed(0)}k คน`, `26 systems see <strong style="color:#f0d060">${esc(c.input.name || 'you')}</strong> as <strong>${esc(dmEl)}</strong>-element energy · <strong style="color:#f0d060">"${esc(score.cosmicEntity)}"</strong> · Life Path <strong>${numerology.lifePath}</strong> "${esc((numerology.lifePathName || '').split('—').slice(-1)[0].trim())}" · ${bazi.benMingNian2026 ? 'Ben Ming Nian + ' : ''}${ninestar.star === 9 ? 'NSK Honmei + ' : ''}Personal Year <strong>${numerology.personalYear2026}</strong> · ${totalStrong}/26 systems strongly agree, ${totalWeak}/26 flag challenges · cosmic fingerprint ~1 in ${(totalCombos / 1000).toFixed(0)}k people`);
    const familyLabels = {
        east: { th: 'ตะวันออก', en: 'Eastern' },
        west: { th: 'ตะวันตก', en: 'Western' },
        indigenous: { th: 'พื้นเมือง', en: 'Indigenous' },
        esoteric: { th: 'ลึกลับ/นิรนาม', en: 'Esoteric' },
    };
    const familyBars = fams.map(f => {
        const d = families[f];
        const sPct = d.total ? (d.strong / d.total) * 100 : 0;
        const rPct = d.total ? (d.resonance / d.total) * 100 : 0;
        const wPct = d.total ? (d.weak / d.total) * 100 : 0;
        const lbl = _lang === 'en' ? familyLabels[f].en : familyLabels[f].th;
        const star = (f === dominantFamily) ? ' ⭐' : '';
        return `<div style="display:flex;align-items:center;gap:10px;margin:5px 0">
      <div style="width:90px;font-size:11px;color:#c8b890">${esc(lbl)}${star}</div>
      <div style="flex:1;display:flex;height:14px;border-radius:3px;overflow:hidden;border:1px solid #2a2545;background:#0a0815">
        <div style="width:${sPct.toFixed(1)}%;background:#50b050" title="${d.strong} ${tr('ยืนยันชัด', 'strong')}"></div>
        <div style="width:${rPct.toFixed(1)}%;background:#d4aa50" title="${d.resonance} ${tr('เห็นสอดคล้อง', 'resonate')}"></div>
        <div style="width:${wPct.toFixed(1)}%;background:#a04030" title="${d.weak} ${tr('จุดท้าทาย', 'challenge')}"></div>
      </div>
      <div style="width:60px;font-size:11px;color:#9a8a72;text-align:right">${d.strong}/${d.total}</div>
    </div>`;
    }).join('');
    return section(4, tr('Grand Convergence — 26 ศาสตร์ส่งคำตอบเดียวกัน', 'Grand Convergence — All 26 Systems Speak Together'), '🌐', `
    <!-- 1. Headline TL;DR -->
    <div style="background:linear-gradient(135deg,#1a1408,#0e0a18);border:2px solid #d4aa50;border-radius:12px;padding:14px 18px;margin-bottom:14px">
      <div style="font-size:10px;letter-spacing:3px;color:#d4aa50;margin-bottom:6px">${tr('✦ สรุปสั้น 1 ย่อหน้า', '✦ ONE-PARAGRAPH SUMMARY')}</div>
      <div style="font-size:12.5px;color:#e0d4b0;line-height:1.85">${tldrCore}</div>
    </div>

    <!-- 2. Cross-Cultural Consensus -->
    <div style="background:linear-gradient(135deg,#0a1422,#1a1530);border:2px solid #5a8acc;border-radius:12px;padding:14px 18px;margin-bottom:14px">
      <div style="text-align:center;margin-bottom:10px">
        <div style="font-size:10px;letter-spacing:3px;color:#7aaae0">${tr('🌏 ฉันทามติข้ามวัฒนธรรม', '🌏 CROSS-CULTURAL CONSENSUS')}</div>
        <div style="font-size:13px;color:#aac8ff;margin-top:3px;line-height:1.65">${tr(`<strong>${totalStrong}/26</strong> ศาสตร์ยืนยันชัด · <strong>${totalResonance}/26</strong> เห็นสอดคล้อง · <strong>${totalWeak}/26</strong> ชี้จุดท้าทาย`, `<strong>${totalStrong}/26</strong> systems strongly agree · <strong>${totalResonance}/26</strong> resonate · <strong>${totalWeak}/26</strong> flag challenges`)}</div>
      </div>
      ${familyBars}
      <div style="font-size:10px;color:#6a7a90;margin-top:10px;padding-top:10px;border-top:1px solid #2a3a5a;line-height:1.65">
        🟢 ${tr('ยืนยันชัด (≥780)', 'Strong (≥780)')} · 🟡 ${tr('เห็นสอดคล้อง (650–779)', 'Resonate (650–779)')} · 🔴 ${tr('จุดท้าทาย (<650)', 'Challenge (<650)')} · ${tr(`จุดแข็งสุด: <strong style="color:#aac8ff">${esc(_lang === 'en' ? familyLabels[dominantFamily].en : familyLabels[dominantFamily].th)}</strong> — เมื่อศาสตร์จากหลายอารยธรรมเห็นตรงกัน ความน่าเชื่อถือสูงกว่าศาสตร์เดี่ยวจาก ลูกหลาน`, `Strongest: <strong style="color:#aac8ff">${esc(familyLabels[dominantFamily].en)}</strong> — when systems from multiple civilisations agree, the read is more reliable than any single tradition alone`)}
      </div>
    </div>

    <!-- 3. Themes (the existing 8 with consensus rows) -->
    <div style="font-size:11px;color:#7a6a52;margin:14px 0 8px;line-height:1.6">
      ${tr('🎯 ภาพหลัก ' + visible.length + ' theme — แต่ละ theme คือจุดที่ระบบหลายตัวยืนยัน', `🎯 ${visible.length} main themes — each is a point where multiple systems agree`)}
    </div>
    ${visible.map(t => consensusRow(t.icon, t.theme, t.votes.map(v => v.system), t.msg, t.votes.length, t.color, narratives[t.icon] ?? '')).join('')}

    <!-- 4. Variant Perception — minority dissent insight (or coherence note) -->
    ${variantBox}

    <!-- 5. Unique Cosmic Signature -->
    <div style="background:linear-gradient(135deg,#1a1408,#2a1c0a);border:2px solid #d4aa50;border-radius:12px;padding:14px 18px;margin:14px 0">
      <div style="text-align:center;margin-bottom:10px">
        <div style="font-size:10px;letter-spacing:3px;color:#d4aa50">${tr('✦ ลายเซ็นจักรวาลของคุณ ✦', '✦ YOUR COSMIC SIGNATURE ✦')}</div>
        <div style="font-size:18px;color:#f0d060;font-weight:700;margin-top:6px;font-family:'Cinzel Decorative',serif">${esc(score.cosmicEntity)}</div>
      </div>
      <div style="background:#0e0a08;border-radius:6px;padding:10px 14px;font-size:11.5px;color:#c8a878;line-height:2">
        <div>🀄 BaZi Day Pillar <strong style="color:#f0d060">${esc(bazi.dayStem)}${esc(bazi.dayBranch)}</strong> · ~1 ${tr('ใน 60', 'in 60')}</div>
        <div>🕉️ Vedic Nakshatra <strong style="color:#f0d060">${esc(nakshatra)}${pada ? ' ' + tr('บาท', 'pada') + ' ' + esc(String(pada)) : ''}</strong> · ~1 ${tr('ใน 108', 'in 108')}</div>
        <div>🌀 Mayan Kin <strong style="color:#f0d060">${esc(mayanLbl)}</strong> · ~1 ${tr('ใน 260', 'in 260')}</div>
        <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #3a2c1a;color:#f0d060;font-size:13px">${tr(`= ลายเซ็นรูปนี้ มีเพียง <strong>~${peopleSharing.toLocaleString()} คน</strong> บนโลก หรือ <strong>1 ใน ${(totalCombos / 1000).toFixed(0)},000</strong> คน`, `= this exact signature shared by only <strong>~${peopleSharing.toLocaleString()} people</strong> worldwide, or <strong>1 in ${(totalCombos / 1000).toFixed(0)},000</strong>`)}</div>
      </div>
      <div style="font-size:10.5px;color:#8a7050;margin-top:8px;line-height:1.65">${tr('💡 คุณไม่ใช่ "ราศีเมษ" หรือ "Life Path 4" — คุณคือผลคูณที่หาเหมือนไม่ได้ของหลายระบบที่ต่างวัฒนธรรมต่างยุค ลายเซ็นนี้คือ fingerprint ของคุณในจักรวาล', '💡 You are not just "Aries" or "Life Path 4" — you are the unrepeatable intersection of many systems across cultures and eras. This signature is your fingerprint in the cosmos.')}</div>
    </div>
  `);
}
function p_new16systems(c) {
    const systems = [
        { name: 'Saju (Korean)', icon: '🇰🇷', data: `${c.saju.yearPillar} ${c.saju.monthPillar} ${c.saju.dayPillar} ${c.saju.hourPillar}`, detail: trDF(c.saju.dominantEnergy), score: c.saju.score },
        { name: 'Tibetan Mewa', icon: '☸️', data: `Mewa ${c.tibetan.mewa} ${c.tibetan.mewaName}`, detail: c.tibetan.parkhaName, score: c.tibetan.score },
        { name: 'Zi Wei (紫微)', icon: '🌌', data: trDF(c.ziwei.mainStarTh), detail: c.ziwei.lifePalaceName, score: c.ziwei.score },
        { name: 'Onmyōdō', icon: '⛩️', data: `${c.onmyodo.rokuyo} ${c.onmyodo.rokuyoTh}`, detail: c.onmyodo.onmyoPolarity, score: c.onmyodo.score },
        { name: 'Hellenistic', icon: '🏛️', data: `${c.hellenistic.sect}`, detail: `${tr('Fortune ใน', 'Fortune in')} ${trDF(c.hellenistic.lotSign)}`, score: c.hellenistic.score },
        { name: 'Norse Rune', icon: 'ᚱ', data: `${c.norseRune.rune} ${c.norseRune.runeName}`, detail: trDF(c.norseRune.runeKeyword), score: c.norseRune.score },
        { name: 'Ogham', icon: '🌿', data: `${c.ogham.ogham} ${c.ogham.treeName}`, detail: trDF(c.ogham.oghamClass), score: c.ogham.score },
        { name: 'Arabic Parts', icon: '⭐', data: `${tr('Fortune ใน', 'Fortune in')} ${trDF(c.arabicParts.fortuneSign)}`, detail: `${tr('Spirit ใน', 'Spirit in')} ${trDF(c.arabicParts.spiritSign)}`, score: c.arabicParts.score },
        { name: 'Kabbalistic', icon: '✡️', data: c.kabbalistic.sephira, detail: c.kabbalistic.archangel, score: c.kabbalistic.score },
        { name: 'Zoroastrian', icon: '🔥', data: c.zoroastrian.dayYazataTh.slice(0, 20), detail: trDF(c.zoroastrian.monthAmeshaTh.slice(0, 20)), score: c.zoroastrian.score },
        { name: 'Aztec', icon: '🦅', data: `${trDF(c.aztec.daySignTh)} ${c.aztec.toneNumber}`, detail: trDF(c.aztec.daySignQuality), score: c.aztec.score },
        { name: 'Native American', icon: '🦅', data: trDF(c.nativeAmerican.birthTotemTh), detail: c.nativeAmerican.clansmother, score: c.nativeAmerican.score },
        { name: 'Ifa/Yoruba', icon: '🥁', data: `Odù ${c.ifaYoruba.odu}`, detail: trDF(c.ifaYoruba.fortune), score: c.ifaYoruba.score },
        { name: 'Aboriginal', icon: '🌈', data: trDF(c.aboriginal.dreamingTh), detail: c.aboriginal.clan, score: c.aboriginal.score },
        { name: 'Biorhythm', icon: '📈', data: `P:${c.biorhythm.physical}% E:${c.biorhythm.emotional}%`, detail: trDF(c.biorhythm.intellectualPhase), score: c.biorhythm.score },
        { name: 'Vedic Mahadasha', icon: '🕉️', data: `${c.vedicMahadasha.currentDasha} Dasha`, detail: `${tr('ถึงปี', 'until')} ${c.vedicMahadasha.currentDashaEnd}`, score: c.vedicMahadasha.score },
    ];
    return section(5, tr('16 ระบบเพิ่มเติม — ภาพรวม', '16 Additional Systems — Overview'), '🌍', `
    <div style="font-size:11px;color:#7a6a52;margin-bottom:12px">
      ${tr('ภาพรวมย่อของ 16 ศาสตร์ที่เพิ่งเพิ่มเข้ามา — ดูรายละเอียดเต็มใน Premium+ version', 'Compact summary of 16 newly-added world traditions — full readings in the Premium+ pages')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${systems.map(s => `
        <div style="background:#141210;border:1px solid #2a2010;border-radius:8px;padding:10px;display:flex;gap:8px;align-items:flex-start">
          <span style="font-size:16px;flex-shrink:0">${esc(s.icon)}</span>
          <div style="flex:1;min-width:0">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:11px;font-weight:600;color:#c8b890">${esc(s.name)}</span>
              <span style="font-size:12px;font-weight:700;color:${s.score >= 780 ? '#60c060' : s.score >= 650 ? '#c0c040' : '#c06030'}">${s.score}</span>
            </div>
            <div style="font-size:12px;color:#d4aa50;margin-top:2px">${esc(s.data)}</div>
            <div style="font-size:10px;color:#6a5a42;margin-top:1px">${esc(s.detail)}</div>
          </div>
        </div>`).join('')}
    </div>
  `);
}
function p04_western(c) {
    const w = c.western;
    // Sun/moon/asc sign labels — engine produces Thai names by default; for EN
    // we strip the Thai-suffix sentences and lean on the existing sunSign/moonSign
    // English values from the Western calculator.
    const isEn = _lang === 'en';
    const sunLabel = isEn ? w.sunSign : w.sunSignTh;
    const moonLabel = isEn ? w.moonSign : w.moonSignTh;
    const ascLabel = isEn ? w.ascSign : w.ascSignTh;
    // Specific per-sign traits so the Sun/Moon/ASC reads aren't "core X energy".
    // core = identity (Sun) · emo = inner needs (Moon) · mask = first impression (ASC)
    const SIGN_TRAITS = {
        Aries: { core: ['ผู้บุกเบิกที่กล้าเริ่มก่อนใคร ไม่กลัวเป็นคนแรก', 'a pioneer who moves before anyone else, unafraid to go first'], emo: ['โกรธเร็วหายเร็ว และต้องรู้สึกว่าได้นำ', 'flares up fast and cools fast, and needs to feel in the lead'], mask: ['ตรงไปตรงมาและมีพลังขับเคลื่อน', 'direct and full of forward drive'] },
        Taurus: { core: ['คนมั่นคงที่รักความสบายและคุณค่าที่จับต้องได้', 'a steady soul drawn to comfort and tangible value'], emo: ['ต้องการความปลอดภัยและความสม่ำเสมอ ไม่ชอบถูกเร่ง', 'needs security and steadiness, dislikes being rushed'], mask: ['สงบ น่าเชื่อถือ และไม่รีบร้อน', 'calm, dependable and unhurried'] },
        Gemini: { core: ['คนอยากรู้อยากเห็น สื่อสารเก่ง ปรับตัวไว', 'a curious, articulate mind that adapts quickly'], emo: ['ต้องการความหลากหลายทางความคิด และเบื่อง่าย', 'needs mental variety and bores easily'], mask: ['ช่างคุย ว่องไว และมีหลายมุม', 'talkative, quick, many-sided'] },
        Cancer: { core: ['คนอ่อนไหวที่ผูกพันกับบ้านและคนที่รัก', 'a sensitive heart bonded to home and loved ones'], emo: ['ต้องการความรู้สึกปลอดภัยทางใจเป็นอันดับแรก', 'needs emotional safety above all'], mask: ['อบอุ่น คอยปกป้อง และระวังตัวเล็กน้อย', 'warm, protective and a little guarded'] },
        Leo: { core: ['คนภูมิใจในตัวเอง มีเสน่ห์ และอยากเปล่งประกาย', 'proud, magnetic, and born to shine'], emo: ['ต้องการการยอมรับและความรักอย่างจริงใจ', 'needs genuine recognition and love'], mask: ['สง่า มั่นใจ และดึงดูดสายตา', 'regal, confident and eye-catching'] },
        Virgo: { core: ['คนละเอียด ใฝ่พัฒนา รับใช้ด้วยการทำให้สิ่งต่างๆ ดีขึ้น', 'precise and improvement-driven, serving by making things better'], emo: ['สบายใจที่สุดเมื่อทุกอย่างเป็นระเบียบ', 'most at ease when things are in order'], mask: ['สุภาพ คมชัด และช่างสังเกต', 'polite, sharp and observant'] },
        Libra: { core: ['คนรักความสมดุลและความงาม มองหาความยุติธรรม', 'a lover of balance and beauty who seeks fairness'], emo: ['ต้องการความกลมเกลียวและคู่คิด', 'needs harmony and a partner to think with'], mask: ['มีเสน่ห์ทางสังคมและประนีประนอม', 'socially charming and diplomatic'] },
        Scorpio: { core: ['คนเข้มข้น ลึกซึ้ง มองทะลุเปลือกนอก', 'intense and deep, seeing past the surface'], emo: ['ต้องการความสัมพันธ์ที่จริงและลึก ไม่เอาผิวเผิน', 'needs real, deep connection — nothing shallow'], mask: ['ลึกลับ ทรงพลัง และอ่านยาก', 'mysterious, powerful and hard to read'] },
        Sagittarius: { core: ['คนรักอิสระ มองภาพใหญ่ และใฝ่หาความหมาย', 'a freedom-loving, big-picture seeker of meaning'], emo: ['ต้องการพื้นที่และการผจญภัย', 'needs space and adventure'], mask: ['ร่าเริง ตรงไปตรงมา และมองโลกกว้าง', 'cheerful, blunt and broad-minded'] },
        Capricorn: { core: ['คนมีวินัย มุ่งเป้า และสร้างเพื่อระยะยาว', 'disciplined and goal-driven, building for the long term'], emo: ['รู้สึกมั่นคงเมื่อเห็นความก้าวหน้าที่จับต้องได้', 'feels secure with tangible progress'], mask: ['สุขุม จริงจัง และน่าเชื่อถือ', 'composed, serious and trustworthy'] },
        Aquarius: { core: ['คนคิดต่าง มองอนาคต และทำเพื่อส่วนรวม', 'an original, future-facing mind working for the collective'], emo: ['ต้องการอิสระทางความคิดและมิตรภาพ', 'needs intellectual freedom and friendship'], mask: ['แปลก เป็นตัวของตัวเอง และเป็นมิตรแบบมีระยะ', 'original, independent and warmly detached'] },
        Pisces: { core: ['คนช่างฝัน เห็นอกเห็นใจ และไหลตามสัญชาตญาณ', 'a dreamy, empathetic soul who follows intuition'], emo: ['ซึมซับอารมณ์รอบตัว และต้องการพื้นที่หลบพัก', 'absorbs the emotions around it and needs a place to retreat'], mask: ['อ่อนโยน ลึกลับ เหมือนอยู่คนละโลก', 'gentle, mystical, slightly otherworldly'] },
    };
    const FALLBACK_TRAIT = { core: [`พลังของ${w.sunSignTh}`, `the qualities of ${w.sunSign}`], emo: [`จังหวะของ${w.moonSignTh}`, `the rhythm of ${w.moonSign}`], mask: [`แบบ${w.ascSignTh}`, `a ${w.ascSign} quality`] };
    const traitOf = (s) => SIGN_TRAITS[s] ?? FALLBACK_TRAIT;
    return section(4, tr('โหราศาสตร์ตะวันตก', 'Western Astrology'), '☀️', `
    <h2>${tr('ตำแหน่งดาวหลัก', 'Major planetary positions')}</h2>
    <table><tbody>
      ${row2(tr('☉ ดวงอาทิตย์', '☉ Sun'), `${sunLabel} — ${Math.round(w.sunDeg % 30)}° ${sunLabel}`)}
      ${row2(tr('☽ ดวงจันทร์', '☽ Moon'), `${moonLabel} — ${Math.round(w.moonDeg % 30)}° ${moonLabel}`)}
      ${row2(tr('ASC ราศีขึ้น', 'ASC Rising sign'), `${ascLabel} — ${Math.round(w.ascDeg % 30)}° ${ascLabel}`)}
      ${row2(tr('♃ ดาวพฤหัสฯ', '♃ Jupiter'), w.jupiterSign)}
      ${row2(tr('♄ ดาวเสาร์', '♄ Saturn'), w.saturnSign)}
      ${row2('Transit 2026', w.transitNote2026)}
    </tbody></table>

    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('มีต้นกำเนิดจากอารยธรรม Babylonian กว่า 4,000 ปีก่อน ถูก Hellenistic Greeks พัฒนาเป็นระบบ Zodiac 12 ราศี และ Ptolemy (100 AD) รวบรวมเป็น "Tetrabiblos" — คัมภีร์โหราศาสตร์หลักจนถึงปัจจุบัน นิยมสูงสุดในโลกตะวันตก เพราะ Sun Sign ใน 5 นาทีทำให้ใครก็เข้าถึงได้', 'Originating in Babylonian civilisation over 4,000 years ago, refined by Hellenistic Greeks into the 12-sign Zodiac, and consolidated by Ptolemy (~100 AD) into Tetrabiblos — still the canonical text for Western astrology. The most popular tradition in the West because a Sun sign reading takes 5 minutes and is universally accessible.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${box(tr('ดวงอาทิตย์ ☉ — แกนตัวตน', 'Sun ☉ — Core Identity'), tr(`ดวงอาทิตย์ใน${w.sunSignTh} — แกนตัวตนของคุณคือ${traitOf(w.sunSign).core[0]} นี่คือพลังสร้างสรรค์ที่คุณฉายออกสู่โลก และเป็นตัวจริงของคุณเมื่อได้เป็นตัวเองเต็มที่`, `Sun in ${w.sunSign} — at your core you are ${traitOf(w.sunSign).core[1]}. This is the creative force you project into the world, and who you are when you're most fully yourself.`), 'gold')}
    ${box(tr('ดวงจันทร์ ☽ — โลกภายใน', 'Moon ☽ — Inner World'), tr(`ดวงจันทร์ใน${w.moonSignTh} — ในโลกภายใน คุณ${traitOf(w.moonSign).emo[0]} นี่คือวิธีที่อารมณ์และความต้องการลึกที่สุดของคุณทำงาน และคุณจะสงบก็ต่อเมื่อมันได้รับการเติมเต็ม`, `Moon in ${w.moonSign} — inwardly, ${traitOf(w.moonSign).emo[1]}. This is how your emotions and deepest needs operate, and you settle only when that need is met.`), 'dark')}
    ${box(tr('ASC — หน้ากากโลก', 'ASC — Public Mask'), tr(`ราศีขึ้น${w.ascSignTh} — สิ่งแรกที่คนรับรู้จากคุณคือความ${traitOf(w.ascSign).mask[0]} ก่อนที่เขาจะได้รู้จักตัวจริงข้างใน — มันคือ "ประตูหน้า" ของบุคลิกคุณ`, `Rising ${w.ascSign} — the first thing people register is that you come across as ${traitOf(w.ascSign).mask[1]}, before they meet the real you inside — it's the "front door" of your personality.`), 'dark')}
    ${box('Transit 2026', w.transitNote2026, 'purple')}
  `);
}
function p05_bazi(c) {
    const b = c.bazi;
    return section(5, tr('BaZi สี่เสา — Four Pillars of Destiny', 'BaZi — Four Pillars of Destiny'), '☯️', `
    <h2>${tr('ตารางสี่เสา', 'Four-Pillar Table')}</h2>
    <div class="grid-3" style="grid-template-columns:1fr 1fr 1fr 1fr">
      ${[
        { label: tr('ปีเกิด', 'Year Pillar'), s: b.yearStem, br: b.yearBranch, sth: b.yearStemTh, bth: b.yearBranchTh, dm: false },
        { label: tr('เดือนเกิด', 'Month Pillar'), s: b.monthStem, br: b.monthBranch, sth: b.monthStemTh, bth: b.monthBranchTh, dm: false },
        { label: tr('วันเกิด ★ Day Master', 'Day Pillar ★ Day Master'), s: b.dayStem, br: b.dayBranch, sth: b.dayStemTh, bth: b.dayBranchTh, dm: true },
        { label: tr('ชั่วโมงเกิด', 'Hour Pillar'), s: b.hourStem, br: b.hourBranch, sth: b.hourStemTh, bth: b.hourBranchTh, dm: false },
    ].map(p => `
        <div class="pillar ${p.dm ? 'dm' : ''}">
          <div class="sublabel">${esc(p.label)}</div>
          <div class="stem">${esc(p.s)}</div>
          <div style="font-size:10px;color:#9a8a72;margin:2px 0">${esc(p.sth)}</div>
          <div class="branch">${esc(p.br)}</div>
          <div style="font-size:10px;color:#9a8a72">${esc(p.bth)}</div>
        </div>`).join('')}
    </div>
    <table style="margin-top:12px"><tbody>
      ${row2('Day Master', `${b.dayStem} ${b.dayMasterTh} (${b.dayMasterPolarity === '+' ? 'Yang' : 'Yin'} ${b.dayMasterElement})`)}
      ${row2(tr('ธาตุโดดเด่น', 'Dominant Element'), b.dominantElement)}
      ${row2(tr('ธาตุที่ขาด', 'Missing Element'), b.missingElement || tr('ครบทุกธาตุ', 'All five present'))}
      ${row2(tr('ธาตุมงคล', 'Lucky Element'), b.luckyElement)}
      ${row2(tr('ธาตุที่ควรหลีกเลี่ยง', 'Element to Avoid'), b.avoidElement)}
      ${row2(tr('Luck Pillar ปัจจุบัน', 'Current Luck Pillar'), b.currentLuckPillarTh)}
    </tbody></table>
    <h2>${tr('การตีความ Day Master', 'Day Master Interpretation')}</h2>
    ${b.reading}
  `);
}
function p06_ninestar(c) {
    const n = c.ninestar;
    return section(6, tr('Nine Star Ki — นิยมในญี่ปุ่นและเกาหลี', 'Nine Star Ki — Japan & Korea\'s most-used system'), '⭐', `
    <div class="grid-2">
      <div class="stat-card">
        <div class="val">${n.star}</div>
        <div class="lbl">${tr('หมายเลขดาว', 'Star Number')}</div>
      </div>
      <div class="stat-card">
        <div class="val" style="font-size:18px">${n.star} ${esc(n.starName)}</div>
        <div class="lbl">${esc(n.starName)}</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2(tr('ธาตุ', 'Element'), n.starElement)}
      ${row2(tr('สีประจำดาว', 'Star Colour'), n.starColor)}
      ${row2(tr('ทิศทำงาน', 'Work Direction'), n.starDirection)}
      ${row2(tr('ทิศนอนหัว', 'Sleep Direction'), n.directionSleep)}
      ${row2(tr('สิ่งนำโชค 2026', 'Lucky Items 2026'), n.auspicious2026)}
    </tbody></table>
    ${box(tr('วิเคราะห์ปี 2026', '2026 Analysis'), n.year2026Analysis, n.star === 9 ? 'red' : 'gold')}
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('ต้นกำเนิดจากจีนโบราณกว่า 3,000 ปี อิงจาก Lo Shu Magic Square (洛書) ถ่ายทอดสู่ญี่ปุ่นในสมัย Heian เป็น "Kyusei Kigaku (九星気学)" นิยมมากในญี่ปุ่นและเกาหลีสำหรับการเลือกทิศทาง วันมงคล และความเข้ากันของคน', 'Originated in ancient China over 3,000 years ago, based on the Lo Shu Magic Square (洛書). Transmitted to Japan during the Heian era as "Kyusei Kigaku (九星気学)". Heavily used today in Japan and Korea for choosing directions, auspicious days, and compatibility.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${n.reading}
  `);
}
function p07_vedic(c) {
    const v = c.vedic;
    return section(7, tr('Vedic Jyotish — โหราศาสตร์เวท', 'Vedic Jyotish — India\'s Ancient Star Science'), '🕉️', `
    <table><tbody>
      ${row2(tr('Lagna (ราศีขึ้น)', 'Lagna (Rising Sign)'), `${v.lagna} · ${v.lagnaSign}`)}
      ${row2(tr('นักษัตรดวงจันทร์', 'Moon Nakshatra'), `${v.moonNakshatra} ${tr('บาท', 'Pada')} ${v.nakshathraPada}`)}
      ${row2(tr('ดาวปกครองนักษัตร', 'Nakshatra Lord'), v.nakshatraLord)}
      ${row2(tr('มหาทศาปัจจุบัน', 'Current Mahadasha'), `${v.mahadasha} (${v.mahadashaPeriod})`)}
      ${row2(tr('อันตราทศา', 'Antardasha'), v.antardasha)}
    </tbody></table>
    ${box(tr('Yogas (ดาวอำนวยผล)', 'Yogas (Beneficial Combinations)'), v.yogas.map(y => `• ${y}`).join('<br>'), 'purple')}
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('เป็นศาสตร์ดาวเก่าแก่ที่สุดระบบหนึ่งของโลก มีอายุกว่า 5,000 ปี บันทึกใน Vedanga Jyotisha — หนึ่งในหกสาขา Vedic knowledge ใช้ระบบ Sidereal (ตามดาวจริง ไม่ใช่ฤดูกาล) Nakshatra 27 แห่ง และ Dasha ระบบช่วงดาวปกครอง — นิยมทั่วอินเดียและเอเชียใต้', 'One of the world\'s oldest astrological systems — over 5,000 years old, recorded in Vedanga Jyotisha (one of the six branches of Vedic knowledge). Uses sidereal positions (actual stars, not seasonal), 27 Nakshatras (lunar mansions), and the Dasha planetary period system. Mainstream across India and South Asia today.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${v.reading}
  `);
}
function p08_energyType(c) {
    const h = c.humandesign;
    const typeLabel = _lang === 'en' ? (h.type || h.typeTh) : h.typeTh;
    return section(8, tr('ระบบประเภทพลังงาน (Energy Type System)', 'Energy Type System'), '⚡', `
    <div class="grid-2">
      <div class="stat-card">
        <div class="val" style="font-size:16px">${esc(typeLabel)}</div>
        <div class="lbl">${tr('ประเภทพลังงาน', 'Energy Type')}</div>
      </div>
      <div class="stat-card">
        <div class="val" style="font-size:20px">${esc(h.profile)}</div>
        <div class="lbl">${tr('โปรไฟล์', 'Profile')}</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2(tr('กลยุทธ์ชีวิต', 'Life Strategy'), h.strategy)}
      ${row2(tr('ศูนย์กลางการตัดสินใจ', 'Decision Authority'), h.authority)}
      ${row2('Definition', h.definition)}
      ${row2('Incarnation Cross', h.incarnationCross)}
      ${row2('Sun Gate', `Gate ${h.sunGate}`)}
      ${row2('Earth Gate', `Gate ${h.earthGate}`)}
    </tbody></table>
    ${box(tr('โปรไฟล์ความหมาย', 'Profile Meaning'), h.profileDesc, 'gold')}
    ${box(tr('Channels สำคัญ', 'Key Channels'), h.channels.join('<br>'), 'dark')}
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Human Design ถูกรับรู้โดย Ra Uru Hu ในปี 1987 ที่ Ibiza — อ้างว่าได้รับจาก "Voice" ใน 8 คืน ผสม Astrology, I Ching, Kabbalah, Chakras และ Quantum Physics เข้าเป็น synthesis ใหม่ ใช้ planetary positions ณ เวลาเกิดคำนวณ "BodyGraph" — ปัจจุบันมีผู้ติดตามทั่วโลกหลายล้านคน', 'Human Design was received by Ra Uru Hu in 1987 in Ibiza — claimed to have come from a "Voice" over 8 nights. Synthesises Astrology, I Ching, Kabbalah, Chakras and Quantum Physics into a unified system. Uses planetary positions at birth to compute the "BodyGraph". Today has millions of practitioners worldwide.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${h.reading}
    <p style="font-size:11px;color:#6a5a42;margin-top:8px">* ${tr('Energy Type System วิเคราะห์ตามหลักโบดีกราฟ ไม่ใช่คำแนะนำจากผู้ให้บริการใดโดยเฉพาะ', 'The Energy Type System analyses based on BodyGraph principles, not advice from any specific provider.')}</p>
  `);
}
function p09_mayan(c) {
    const m = c.mayan;
    return section(9, tr('มายัน Tzolk\'in', 'Mayan Tzolk\'in'), '🌀', `
    <div class="grid-2">
      <div class="stat-card">
        <div class="val">${m.kin}</div>
        <div class="lbl">Kin Number</div>
      </div>
      <div class="stat-card">
        <div class="val">${m.toneNumber}</div>
        <div class="lbl">${tr('โทนกาแล็กติก', 'Galactic Tone')}</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2('Day Sign', m.daySignNameTh)}
      ${row2('Galactic Tone', m.toneNameTh)}
      ${row2(tr('ทิศประจำ', 'Direction'), m.direction)}
      ${row2(tr('สีประจำ', 'Colour'), m.color)}
      ${row2('Wavespell', m.wavespell)}
    </tbody></table>
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Tzolk\'in คือปฏิทิน 260 วันของชาว Maya ที่ใช้มากว่า 3,000 ปี ประกอบด้วย 20 Day Signs × 13 Tone Numbers ใช้ร่วมกับ Haab 365 วันเป็น "Calendar Round" 52 ปี นิยมในกลุ่ม New Age สมัยใหม่หลัง 2012 prophecy แต่ชาว Maya ดั้งเดิมยังใช้จริงในพิธีกรรม', 'Tzolk\'in is the Maya 260-day sacred calendar used for over 3,000 years — 20 Day Signs × 13 Tone Numbers, paired with the 365-day Haab to form a 52-year "Calendar Round". Popular in New Age circles after the 2012 prophecy, but indigenous Maya communities still use it in actual ceremony today.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${m.reading}
  `);
}
function p10_celtic(c) {
    const ct = c.celtic;
    return section(10, tr('เซลติก Tree Calendar', 'Celtic Tree Calendar'), '🌳', `
    <div class="stat-card" style="margin-bottom:16px">
      <div class="val" style="font-size:20px">${ct.symbol} ${esc(_lang === 'en' ? ct.treeName : ct.treeNameTh)}</div>
      <div class="lbl">${esc(ct.treeName)} Tree</div>
    </div>
    <table><tbody>
      ${row2(tr('ดาวปกครอง', 'Ruling Planet'), ct.rulingPlanet)}
      ${row2(tr('อัญมณีนำโชค', 'Lucky Gemstone'), ct.gemstone)}
      ${row2(tr('ธาตุ', 'Element'), ct.element)}
      ${row2(tr('บุคลิกภาพ', 'Personality'), ct.personality)}
    </tbody></table>
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('อิงจาก Ogham alphabet โบราณของชาวไอริชและ Gaul Druids มีอายุกว่า 2,500 ปี แต่ละเดือนมีต้นไม้ศักดิ์สิทธิ์ปกครอง ตาม Beth-Luis-Nion calendar Robert Graves นักเขียน popularize ใน "The White Goddess" (1948) ทำให้เป็นที่รู้จักในโลกสมัยใหม่', 'Based on the ancient Ogham alphabet of Irish and Gaul Druids — over 2,500 years old. Each month is governed by a sacred tree following the Beth-Luis-Nion calendar. Robert Graves popularised this system in "The White Goddess" (1948), bringing it into modern awareness.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${ct.reading}
  `);
}
function p11_thai(c) {
    const t = c.thai;
    return section(11, tr('ไทยพราหมณ์', 'Thai Brahmin'), '🙏', `
    <div class="grid-2">
      <div class="stat-card">
        <div class="val" style="font-size:18px">${esc(t.dayName)}</div>
        <div class="lbl">${tr('วันเกิด', 'Birth Day')}</div>
      </div>
      <div class="stat-card">
        <div class="val" style="font-size:16px">${esc(t.dayColor)}</div>
        <div class="lbl">${tr('สีมงคล', 'Lucky Colour')}</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2(tr('เทพผู้ปกครอง', 'Ruling Deity'), `${t.dayGodTh} (${t.dayGod})`)}
      ${row2(tr('นักษัตรไทย', 'Thai Nakshatra'), t.nakshatra)}
      ${row2(tr('ด้านมงคล', 'Auspicious Domain'), t.fortuneDay)}
    </tbody></table>
    <p style="font-size:11px;color:#5a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:10px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('โหราศาสตร์ไทยรับอิทธิพลจาก Vedic Jyotish ผ่านอินเดียเมื่อกว่า 1,000 ปีก่อน ผสมผสานกับความเชื่อดั้งเดิมของไทยและพราหมณ์ฮินดู ระบบวัน 7 สีและเทพประจำวัน (เช่น พระจันทร์ วันจันทร์) เป็นเอกลักษณ์เฉพาะ ใช้กันแพร่หลายในพิธีกรรมราชสำนักไทยมาหลายศตวรรษ', 'Thai astrology was shaped by Vedic Jyotish via India over 1,000 years ago, blended with native Thai animism and Hindu Brahmin tradition. The 7-day, 7-colour, day-deity system (e.g. Moon-deity for Monday) is uniquely Thai and has been central to Royal Court ceremony for centuries.')}</p>
    <h2>${tr('การตีความ', 'Interpretation')}</h2>
    ${t.reading}
    ${box(tr('คำแนะนำไทยพราหมณ์', 'Thai Brahmin Guidance'), tr(`ใส่สี${t.dayColor}ในวันสำคัญ ทำบุญวันเกิดให้${t.dayGodTh} อธิษฐานด้าน${t.fortuneDay}`, `Wear ${t.dayColor} on important days, make merit on your birth weekday in honour of ${t.dayGodTh}, and direct prayers towards matters of ${t.fortuneDay}.`), 'gold')}
  `);
}
function p12_numerology(c) {
    const n = c.numerology;
    return section(12, tr('เลขศาสตร์ — Life Path + Pythagorean + เลข ๗ ตัว', 'Numerology — Life Path + Pythagorean + Thai 7 Numbers'), '🔢', `
    <div class="grid-3">
      <div class="stat-card">
        <div class="val">${n.lifePath}</div>
        <div class="lbl">Life Path</div>
      </div>
      <div class="stat-card">
        <div class="val">${n.personalYear2026}</div>
        <div class="lbl">${tr('ปีส่วนตัว 2026', 'Personal Year 2026')}</div>
      </div>
      <div class="stat-card">
        <div class="val">${n.pythagorean}</div>
        <div class="lbl">Pythagorean</div>
      </div>
    </div>
    <table style="margin:12px 0"><tbody>
      ${row2('Life Path', `${n.lifePath} — ${n.lifePathName}`)}
      ${row2(tr('ปีส่วนตัว 2026', 'Personal Year 2026'), `${n.personalYear2026} — ${n.personalYearMeaning}`)}
      ${row2(tr('เลข ๗ ตัว', 'Thai 7 Numbers'), n.thaiSeven.join(' · '))}
      ${row2('Destiny Number', n.destinyNumber.toString())}
    </tbody></table>
    ${box(tr('เลขชีวิต', 'Life Numbers'), n.reading, 'gold')}
    ${box(tr('ปีส่วนตัว 2026', 'Personal Year 2026'), n.personalYearMeaning, 'purple')}
    <p style="margin-top:8px">${esc(n.thaiSevenReading)}</p>
  `);
}
function p13_luckPillars(c) {
    const age2026 = 2026 - c.input.year;
    const { bazi, vedic, ninestar, numerology, biorhythm, vedicMahadasha } = c;
    const luckRows = bazi.luckPillars.map(lp => {
        const isCurrent = age2026 >= lp.ageStart && age2026 <= lp.ageEnd;
        // NSK decade: every 9 years a cycle completes
        const nskDecadeNote = ((lp.ageStart % 9) === 0) ? tr('NSK: เริ่มรอบใหม่', 'NSK: new cycle begins') : '';
        return `<tr ${isCurrent ? 'style="background:#1a1a08;border:1px solid #d4aa5044"' : ''}>
      <td style="font-size:12px">${esc(lp.ageStart)}–${esc(lp.ageEnd)}</td>
      <td style="font-size:18px">${esc(lp.stem)}${esc(lp.branch)}</td>
      <td style="font-size:11px;color:#9a8a72">${esc(lp.stemTh)} ${esc(lp.branchTh)}</td>
      <td style="font-size:11px;color:#6a8a60">${nskDecadeNote}</td>
      <td>${isCurrent ? `<span style="color:#d4aa50;font-weight:700">▶ ${tr('ปัจจุบัน', 'Current')}</span>` : ''}</td>
    </tr>`;
    }).join('');
    // NSK year trend 2026-2035
    const nskYears = Array.from({ length: 10 }, (_, i) => 2026 + i).map(yr => {
        const starForYear = ((9 - ((yr - 1) % 9)) % 9) + 1;
        const isGood = [starForYear].some(s => [1, 3, 6, 8, 9].includes(s));
        return `<span style="font-size:11px;padding:2px 6px;border-radius:4px;background:${isGood ? '#1a3010' : '#2a1010'};color:${isGood ? '#60c060' : '#c06060'};margin:2px">${yr}:${starForYear}${isGood ? '✓' : '·'}</span>`;
    }).join('');
    // ── Life-arc synthesis: turn the pillar tables into a story ──
    const lps = bazi.luckPillars;
    const curIdx = lps.findIndex(lp => age2026 >= lp.ageStart && age2026 <= lp.ageEnd);
    const cur = curIdx >= 0 ? lps[curIdx] : (lps.length ? (age2026 < lps[0].ageStart ? lps[0] : lps[lps.length - 1]) : null);
    const nxt = curIdx >= 0 && curIdx < lps.length - 1 ? lps[curIdx + 1] : null;
    const pivotYear = nxt ? c.input.year + nxt.ageStart : null;
    const firstLp = lps[0], lastLp = lps[lps.length - 1];
    const lifeArc = cur ? tr(`ตอนนี้คุณอายุ ${age2026} ปี กำลังอยู่ในเสา ${cur.stem}${cur.branch} (${cur.stemTh} ${cur.branchTh}) ซึ่งครอบช่วงอายุ ${cur.ageStart}–${cur.ageEnd} — แต่ละเสาใน BaZi คือ "บท" ของชีวิตยาวราว 10 ปี ที่มีบุคลิกพลังงานต่างกัน ${nxt ? `บทถัดไปจะเริ่มราวปี ${pivotYear} (ตอนคุณอายุ ${nxt.ageStart}) เมื่อพลังงานสลับเป็นเสา ${nxt.stem}${nxt.branch} จุดเปลี่ยนเสาแบบนี้มักมาพร้อมการเปลี่ยนงาน เปลี่ยนเมือง หรือเปลี่ยนมุมมองครั้งใหญ่ — รู้ล่วงหน้าก็เตรียมรับจังหวะได้` : `คุณกำลังอยู่ในเสาท้ายๆ ของเส้นเวลานี้ ซึ่งเป็นช่วงของการสรุปและส่งต่อปัญญาที่สะสมมาทั้งชีวิต`}`, `You're currently ${age2026}, inside the ${cur.stem}${cur.branch} pillar, spanning ages ${cur.ageStart}–${cur.ageEnd}. Each BaZi pillar is a roughly 10-year "chapter" of life, each with its own energetic character. ${nxt ? `Your next chapter begins around ${pivotYear} (when you turn ${nxt.ageStart}), as the energy shifts to the ${nxt.stem}${nxt.branch} pillar. These pillar changes often arrive with a job change, a move, or a major shift in outlook — knowing one is coming lets you prepare for the turn.` : `You're in one of the later pillars of this timeline — a phase for consolidating and passing on the wisdom gathered across a lifetime.`}`)
        : tr(`เส้นเวลาด้านล่างคือเสา BaZi แต่ละช่วง 10 ปีของชีวิตคุณ ซ้อนกับช่วงดาวของ Vedic และรอบเลขศาสตร์`, `The timeline below maps your BaZi pillars — each a 10-year span of life — layered with your Vedic planetary periods and numerology cycle.`);
    const lifeSpanNote = (firstLp && lastLp) ? tr(`เส้นเวลานี้ทอดยาวตั้งแต่อายุ ${firstLp.ageStart} ถึง ${lastLp.ageEnd} ปี — อ่านเป็นแผนที่ของทั้งชีวิต ไม่ใช่คำทำนายรายปี`, `This timeline spans ages ${firstLp.ageStart} to ${lastLp.ageEnd} — read it as a map of a whole life, not a year-by-year prophecy.`) : '';
    return section(14, tr('เส้นทาง 80 ปี — Multi-System Timeline', '80-Year Life Timeline — Multi-System View'), '🗺️', `
    <p style="font-size:12.5px;color:#c8c0a8;line-height:1.75;margin-bottom:6px">${lifeArc}</p>
    <p style="font-size:11px;color:#7a6a52;margin-bottom:10px">${lifeSpanNote}</p>
    <!-- BaZi Luck Pillars (main) -->
    <h2 style="font-size:14px;color:#d4aa50;margin-bottom:8px">🔥 ${tr('BaZi Luck Pillars — แกนหลัก 10 ปีต่อเสา', 'BaZi Luck Pillars — 10 years per pillar')}</h2>
    <table>
      <thead><tr><th>${tr('อายุ', 'Age')}</th><th>${tr('เสา', 'Pillar')}</th><th>${tr('ความหมาย', 'Meaning')}</th><th>NSK Note</th><th></th></tr></thead>
      <tbody>${luckRows}</tbody>
    </table>

    <!-- Current LP detail -->
    ${box(tr('Luck Pillar ปัจจุบัน', 'Current Luck Pillar'), `${bazi.currentLuckPillar} — ${bazi.currentLuckPillarTh}`, 'gold')}

    <!-- Vedic Mahadasha -->
    <h2 style="font-size:14px;color:#c090d0;margin:14px 0 8px">🕉️ ${tr('Vedic Mahadasha — ช่วงปกครองดาว', 'Vedic Mahadasha — Planetary Periods')}</h2>
    <div style="background:#120a1a;border:1px solid #5a3a8a;border-radius:8px;padding:12px">
      <div style="font-size:13px;color:#c090e0;font-weight:600">
        ${esc(vedicMahadasha.currentDasha)} Mahadasha ${tr('ถึงปี', 'until')} ${esc(String(vedicMahadasha.currentDashaEnd))}
      </div>
      <div style="font-size:12px;color:#9a70c0;margin-top:4px">${esc(vedicMahadasha.dashaQuality)}</div>
      <div style="font-size:11px;color:#7a5a9a;margin-top:4px">Antardasha: ${esc(vedicMahadasha.antardasha)}</div>
    </div>

    <!-- NSK Year Trend -->
    <h2 style="font-size:14px;color:#60b0c0;margin:14px 0 8px">⭐ NSK Year Stars 2026–2035</h2>
    <div style="background:#0a1215;border-radius:8px;padding:10px">${nskYears}
      <div style="font-size:10px;color:#4a7080;margin-top:6px">${tr('✓ = ดาวโชค (1,3,6,8,9) · · = ระมัดระวัง', '✓ = lucky stars (1, 3, 6, 8, 9) · · = caution year')}</div>
    </div>

    <!-- Numerology Personal Year pattern -->
    <h2 style="font-size:14px;color:#d0a060;margin:14px 0 8px">🔢 ${tr('Numerology — รอบชีวิต 9 ปี', 'Numerology — 9-Year Life Cycle')}</h2>
    <div style="background:#1a1208;border-radius:8px;padding:10px">
      <div style="font-size:12px;color:#c0a060">Personal Year 2026: <strong>${esc(String(numerology.personalYear2026))}</strong> — ${esc(numerology.personalYearMeaning.split('—')[0])}</div>
      <div style="font-size:11px;color:#8a7040;margin-top:4px">Biorhythm Physical ${esc(String(biorhythm.physical))}% | Emotional ${esc(String(biorhythm.emotional))}% | Intellectual ${esc(String(biorhythm.intellectual))}%</div>
    </div>
    ${box(tr('จุดบรรจบของสามเส้นเวลา', 'Where these timelines converge'), tr(`สามศาสตร์มองช่วงนี้ของคุณพร้อมกัน — BaZi อยู่เสา ${cur ? `${cur.stemTh} ${cur.branchTh}` : '—'}, Vedic อยู่ช่วงดาว ${esc(vedicMahadasha.currentDasha)} (ถึงปี ${esc(String(vedicMahadasha.currentDashaEnd))}) ${esc(vedicMahadasha.dashaQuality)}, และเลขศาสตร์เป็น Personal Year ${esc(String(numerology.personalYear2026))} เมื่อทั้งสามจังหวะชี้ไปทางเดียวกันคือช่วงเร่งเครื่องที่ควรลงแรง เมื่อชี้คนละทางให้ยึดกระแสของเสา BaZi เป็นหลัก เพราะมันคือคลื่นพลังที่ยาวที่สุดในชีวิตคุณ`, `Three systems read this season of your life at once — BaZi places you in the ${cur ? `${cur.stem}${cur.branch}` : '—'} pillar, Vedic in your ${esc(vedicMahadasha.currentDasha)} planetary period (until ${esc(String(vedicMahadasha.currentDashaEnd))}) ${esc(vedicMahadasha.dashaQuality)}, and numerology at Personal Year ${esc(String(numerology.personalYear2026))}. When all three point the same way it's an accelerate window worth your effort; when they diverge, follow the BaZi pillar first — it's the longest energy wave in your life.`), 'gold')}
  `);
}
function p14_health(c) {
    const { bazi, ninestar, vedic, humandesign, biorhythm, celtic, tibetan, thai, nativeAmerican, vedicMahadasha, norseRune } = c;
    const healthSignals = extractSignals(c, 'health');
    const good = healthSignals.filter(s => s.score >= 750);
    const warn = healthSignals.filter(s => s.score < 650);
    const EL_EXERCISE = {
        '甲': 'Weight Training / ยิม', '乙': 'Pilates / โยคะ', '丙': 'ว่ายน้ำ / ไตรกีฬา',
        '丁': 'โยคะ / ว่ายน้ำ', '戊': 'Hiking / เดิน', '己': 'เดิน / ไทชิ',
        '庚': 'Martial Arts / ฟันดาบ', '辛': 'เต้นรำ / ปิลาเตส', '壬': 'ว่ายน้ำ / พายเรือ', '癸': 'ว่ายน้ำ / ดำน้ำ'
    };
    // Map BaZi Day Master element → TCM organ pairing (well-established medical
    // tradition: ไม้→ตับ · ไฟ→หัวใจ · ดิน→ม้าม/กระเพาะ · โลหะ→ปอด · น้ำ→ไต)
    const ORGAN = { 'ไม้': 'ตับ+ถุงน้ำดี', 'ไฟ': 'หัวใจ+ลำไส้เล็ก', 'ดิน': 'ม้าม+กระเพาะ', 'โลหะ': 'ปอด+ลำไส้ใหญ่', 'น้ำ': 'ไต+กระเพาะปัสสาวะ' };
    const dmEl = bazi.dayMasterElement;
    const organ = ORGAN[dmEl] || '—';
    return section(20, tr('Health Coaching — ลักษณะประจำตัวจาก 26 ศาสตร์', 'Health Coaching — Constitutional Patterns from 26 Systems'), '🌿', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('สุขภาพตามดวง ≠ พยากรณ์รายวัน', 'Birth-chart health ≠ daily forecast')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr(`หน้านี้อธิบาย <strong>ลักษณะประจำตัวด้านสุขภาพตลอดชีวิต</strong> ที่มาจากวันเกิด —
        เช่น อวัยวะที่เปราะบางตามธรรมชาติ · ชนิดกีฬาที่ร่างกายตอบสนองดี · จังหวะพลังงาน
        <strong>ไม่ใช่</strong> พยากรณ์วันนี้ว่าจะป่วยหรือไม่ · ${healthSignals.length} ศาสตร์เห็นตรงกัน ${good.length} เรื่อง`, `This page describes <strong>your lifelong health constitution</strong> derived from your birth chart —
         organs that are naturally vulnerable, sports your body responds to well, and your energy rhythm.
         It is <strong>not</strong> a daily forecast of illness. · ${healthSignals.length} systems analysed, ${good.length} in agreement.`)}
      </div>
    </div>

    <!-- Constitutional pattern -->
    <div style="background:#0a1510;border:1px solid #2a4a20;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="font-size:12px;color:#5a9a40;font-weight:600;margin-bottom:6px">🫀 ${tr('ลักษณะตามธาตุ Day Master (TCM)', 'Constitution by Day Master Element (TCM)')}</div>
      <div style="font-size:12px;color:#c8c0a8;line-height:1.75">
        ${tr(`ธาตุ <strong>${esc(dmEl)}</strong> ของคุณคู่กับอวัยวะ <strong>${esc(organ)}</strong> ใน TCM —
        คืออวัยวะที่ <em>ทำงานหนักสุด</em> และ <em>เปราะบางก่อนสุด</em> เมื่ออายุมากขึ้น
        การดูแลป้องกันจึงควรเน้นที่จุดนี้เป็นอันดับแรก`, `Your <strong>${esc(dmEl)}</strong> element pairs with the organ system <strong>${esc(organ)}</strong> in Traditional Chinese Medicine — the organ that <em>works hardest</em> and <em>becomes vulnerable first</em> with age. Preventative care should prioritise this system.`)}
      </div>
    </div>

    <!-- Consensus positive -->
    <div style="margin-bottom:14px">
      <div style="font-size:13px;color:#60c060;font-weight:600;margin-bottom:8px">✅ ${tr('จุดแข็งด้านสุขภาพ', 'Health strengths')} · ${good.length} ${tr('ศาสตร์เห็นตรงกัน', 'systems in agreement')}</div>
      ${good.map(s => `
        <div style="display:flex;gap:8px;padding:8px 12px;background:#0a1508;border-radius:6px;margin:4px 0">
          <span style="font-size:11px;min-width:100px;color:#60a060;font-weight:600">${esc(s.system)}</span>
          <span style="font-size:12px;color:#c8d8a8;flex:1">${esc(s.finding)}</span>
        </div>`).join('')}
    </div>

    ${warn.length > 0 ? `
    <div style="margin-bottom:14px">
      <div style="font-size:13px;color:#c06030;font-weight:600;margin-bottom:8px">⚠️ ${tr('จุดที่ต้องดูแลเฉพาะ', 'Areas needing focused care')} · ${warn.length} ${tr('ศาสตร์เตือน', 'systems flag caution')}</div>
      ${warn.map(s => `
        <div style="display:flex;gap:8px;padding:8px 12px;background:#150a08;border-radius:6px;margin:4px 0;border-left:2px solid #8a3020">
          <span style="font-size:11px;min-width:100px;color:#c07050;font-weight:600">${esc(s.system)}</span>
          <span style="font-size:12px;color:#d8a888;flex:1">${esc(s.finding)}</span>
        </div>`).join('')}
    </div>` : ''}

    ${box(tr('ออกกำลังกายที่ร่างกายของคุณตอบสนองดีที่สุด', 'Movement your body responds to best'), tr(`<strong>${esc(EL_EXERCISE[bazi.dayStem] || 'เดิน/โยคะ')}</strong><br><br>เหตุผล: Day Master <strong>${esc(bazi.dayStem)} ${esc(bazi.dayMasterTh)}</strong> เป็นธาตุ <strong>${esc(dmEl)}</strong> — กีฬานี้เสริมการไหลเวียนของ ${esc(organ)} โดยตรง นี่ไม่ใช่กฎหนึ่งสำหรับทุกคน แต่เป็นการจับคู่ระหว่างธาตุของคุณกับชนิดการเคลื่อนไหวที่ธาตุนั้นต้องการ`, `<strong>${esc(EL_EXERCISE[bazi.dayStem] || 'Walking / Yoga')}</strong><br><br>Why: your Day Master <strong>${esc(bazi.dayStem)} ${esc(bazi.dayMasterTh)}</strong> is the <strong>${esc(dmEl)}</strong> element — this kind of movement directly supports circulation in your ${esc(organ)} system. Not a one-size-fits-all rule, but a pairing of your element with the type of motion that element naturally craves.`), 'green')}

    <!-- Biorhythm — reframed as "natural rhythm" not "today" -->
    <div style="background:#0a1510;border:1px solid #2a4a20;border-radius:8px;padding:12px 14px;margin:14px 0">
      <div style="font-size:12px;color:#5a9a40;font-weight:600;margin-bottom:6px">📊 ${tr('จังหวะ Biorhythm ของคุณตอนนี้', 'Your current biorhythm pulse')}</div>
      <div style="font-size:10.5px;color:#7a9a70;margin-bottom:10px">${tr('สามวงจรจากวันเกิด: กาย 23 วัน · อารมณ์ 28 วัน · สติปัญญา 33 วัน — วันนี้อยู่ช่วงใดของวงจร', 'Three cycles from birth: Physical 23 days · Emotional 28 days · Intellectual 33 days — where today sits in each cycle')}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
        ${[
        [tr('ร่างกาย', 'Physical'), biorhythm.physical, biorhythm.physicalPhase],
        [tr('อารมณ์', 'Emotional'), biorhythm.emotional, biorhythm.emotionalPhase],
        [tr('สติปัญญา', 'Intellectual'), biorhythm.intellectual, biorhythm.intellectualPhase],
    ].map(([l, v, p]) => `<div><div style="font-size:22px;font-weight:700;color:${+v > 30 ? '#60c060' : +v < -30 ? '#c06060' : '#c0c040'}">${v}%</div><div style="font-size:10px;color:#6a8a60">${esc(String(l))}</div><div style="font-size:10px;color:#4a6a40">${esc(String(p))}</div></div>`).join('')}
      </div>
    </div>

    <div style="font-size:11px;color:#5a6a50;margin-top:8px">
      🏥 ${tr('รายงานนี้เพื่อการสำรวจตนเอง ไม่ใช่การวินิจฉัยทางการแพทย์ · หากมีอาการผิดปกติ ควรปรึกษาแพทย์ (ในไทย สายด่วน 1323 สุขภาพจิต)', 'This report is for self-exploration, not medical diagnosis. Consult a qualified physician for any concerning symptoms.')}
    </div>
  `);
}
function p15_finance(c) {
    const finSignals = extractSignals(c, 'finance');
    const good = finSignals.filter(s => s.score >= 750).sort((a, b) => b.score - a.score);
    const warn = finSignals.filter(s => s.score < 650);
    const { bazi, numerology, ninestar, arabicParts, hellenistic, ifaYoruba, vedicMahadasha } = c;
    return section(21, tr('Finance Coaching — แนวทางการเงินตามดวง', 'Finance Coaching — Financial Guidance from Your Chart'), '💰', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('การเงินตามดวง ≠ พยากรณ์หวย', 'Birth-chart finance ≠ lottery forecast')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr(`หน้านี้อธิบาย <strong>ลักษณะทางการเงินประจำตัว</strong> — ว่าคุณเหมาะกับการลงทุนแบบไหน ความเสี่ยงระดับใด
        ช่วงเวลาของชีวิตที่ควรลงทุน/สะสม · <strong>ไม่ใช่</strong> การบอกตัวเลขผลตอบแทนหรือทำนายราคาทรัพย์สิน ·
        ${finSignals.length} ศาสตร์วิเคราะห์ โดย ${good.length} เห็นเสริมและ ${warn.length} เห็นเตือน`, `This page describes <strong>your innate financial pattern</strong> — what kind of investing suits you, your risk
         tolerance, and the life-phases best for accumulating versus deploying capital. It is <strong>not</strong> a return
         forecast or asset-price prediction. · ${finSignals.length} systems analysed: ${good.length} supportive, ${warn.length} cautionary.`)}
      </div>
    </div>

    <div style="background:#100a06;border:1px solid #4a3010;border-radius:6px;padding:8px 12px;font-size:11px;color:#8a6030;margin-bottom:12px">
      ⓘ ${tr('ข้อมูลประกอบการสำรวจตนเอง · ไม่ใช่คำแนะนำการลงทุน · ปรึกษาผู้เชี่ยวชาญก่อนตัดสินใจสำคัญ', 'For self-exploration only · not investment advice · consult a qualified professional before major decisions.')}
    </div>

    <div style="margin-bottom:14px">
      <div style="font-size:13px;color:#c0a030;font-weight:600;margin-bottom:8px">💎 ${tr('จุดแข็งทางการเงิน', 'Financial strengths')} · ${good.length} ${tr('ศาสตร์เห็นพ้อง', 'systems concur')}</div>
      ${good.map(s => `
        <div style="display:flex;gap:8px;padding:8px 12px;background:#100d06;border-radius:6px;margin:4px 0">
          <span style="font-size:11px;min-width:100px;color:#a08030;font-weight:600">${esc(s.system)}</span>
          <span style="font-size:12px;color:#d8c880;flex:1">${esc(s.finding)}</span>
        </div>`).join('')}
    </div>

    ${warn.length > 0 ? `
    <div style="margin-bottom:14px">
      <div style="font-size:13px;color:#c05030;font-weight:600;margin-bottom:8px">⚠️ ${tr('ข้อระวังทางการเงิน', 'Financial cautions')} · ${warn.length} ${tr('ศาสตร์เตือน', 'systems flag caution')}</div>
      ${warn.map(s => `
        <div style="display:flex;gap:8px;padding:8px 12px;background:#150a06;border-radius:6px;margin:4px 0;border-left:2px solid #8a3010">
          <span style="font-size:11px;min-width:100px;color:#c07030;font-weight:600">${esc(s.system)}</span>
          <span style="font-size:12px;color:#d89060;flex:1">${esc(s.finding)}</span>
        </div>`).join('')}
    </div>` : ''}

    <!-- Key synthesis -->
    ${box(tr('สรุปทิศทางการเงิน', 'Financial direction summary'), tr(`ธาตุมงคล${bazi.luckyElement} + Part of Fortune ใน${arabicParts.fortuneSign} + ${vedicMahadasha.currentDasha} Dasha → ${['Jupiter', 'Sun', 'Venus'].includes(vedicMahadasha.currentDasha) ? 'ช่วงขยายตัวทางการเงิน' : 'ช่วงสะสมและระมัดระวัง'}`, `Lucky element ${bazi.luckyElement} + Part of Fortune in ${arabicParts.fortuneSign} + ${vedicMahadasha.currentDasha} Dasha → ${['Jupiter', 'Sun', 'Venus'].includes(vedicMahadasha.currentDasha) ? 'a phase of financial expansion' : 'a phase of accumulation and prudence'}`), 'gold')}

    <!-- 3-step plan -->
    <div style="font-size:13px;color:#d0a050;font-weight:600;margin:12px 0 8px">${tr('แผน 3 ขั้นจาก Consensus', '3-step plan from consensus')}</div>
    ${[
        [tr(`สะสมธาตุ${bazi.luckyElement}`, `Accumulate the ${bazi.luckyElement} element`),
            tr(`ลงทุนในสิ่งที่สอดคล้องกับ Day Master ${bazi.dayMasterTh} — Wuxing: DM_CREATES = success`, `Invest in things aligned with your Day Master ${bazi.dayMasterTh} — Wuxing: DM_CREATES = success`)],
        [tr(`ใช้ทิศ${ninestar.starDirection}`, `Use the ${ninestar.starDirection} direction`),
            tr(`NSK: ทิศทำงานและติดต่อธุรกิจในทิศ${ninestar.starDirection} ปี 2026`, `NSK: orient your work + business meetings towards ${ninestar.starDirection} during 2026`)],
        [`Personal Year ${numerology.personalYear2026}`,
            numerology.personalYearMeaning.split('—')[0] + tr(' — จังหวะที่ดีที่สุดสำหรับปีนี้', ' — the rhythm best suited to this year')],
    ].map(([title, desc], i) => `
      <div style="display:flex;gap:10px;padding:8px;border:1px solid #2a2010;border-radius:8px;margin:5px 0">
        <div style="background:#d4aa50;color:#1a1510;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0">${i + 1}</div>
        <div><div style="font-weight:600;color:#d4aa50;font-size:13px">${esc(title)}</div><div style="font-size:11px;color:#9a8a72;margin-top:2px">${esc(desc)}</div></div>
      </div>`).join('')}
  `);
}
function p16_activation(c) {
    const { bazi, ninestar, numerology, humandesign, vedic, thai, celtic, tibetan, norseRune, kabbalistic, ifaYoruba, aboriginal, biorhythm, vedicMahadasha, onmyodo, zoroastrian, nativeAmerican, aztec, saju } = c;
    // Pull positive actions from all 26 systems — ranked by how many systems endorse
    const positives = [
        { icon: '🧭', pts: 0,
            title: tr(`หันหัวทิศ${ninestar.directionSleep}นอน`, `Sleep with your head pointing ${trDF(ninestar.directionSleep)}`),
            body: tr(`NSK Star ${ninestar.star}: ทิศนอน${ninestar.directionSleep} ยืนยันโดย Feng Shui พื้นฐาน`, `NSK Star ${ninestar.star}: sleep direction ${trDF(ninestar.directionSleep)}, confirmed by core Feng Shui`),
            systems: ['Nine Star Ki', 'BaZi Feng Shui'] },
        { icon: '🎯', pts: 0,
            title: tr(`ทำตาม Strategy "${humandesign.strategy}"`, `Follow your Strategy "${trDF(humandesign.strategy)}"`),
            body: tr(`Energy Type ${humandesign.typeTh}: หัวใจของ Human Design — ฝืนแล้วเหนื่อยเปล่า`, `Energy Type ${trDF(humandesign.typeTh)}: heart of Human Design — fight it and you exhaust yourself`),
            systems: ['Energy Type System', 'Kabbalistic'] },
        { icon: '🔥', pts: 0,
            title: tr(`เสริมธาตุ${bazi.luckyElement}ทุกวัน`, `Reinforce the ${trDF(bazi.luckyElement)} element daily`),
            body: tr(`BaZi: ธาตุมงคล${bazi.luckyElement} หนุน Day Master ${bazi.dayMasterTh}`, `BaZi: lucky element ${trDF(bazi.luckyElement)} supports Day Master ${trDF(bazi.dayMasterTh)}`),
            systems: ['BaZi', 'Saju (Korean)', 'Tibetan Mewa'] },
        { icon: '🎨', pts: 0,
            title: tr(`ใส่สี${ninestar.starColor}เป็น accent`, `Wear ${trDF(ninestar.starColor)} as an accent colour`),
            body: tr(`NSK ${ninestar.starChinese} + ไทยพราหมณ์วัน${thai.dayName}: สี${ninestar.starColor}/${thai.dayColor}`, `NSK ${ninestar.starChinese} + Thai-Brahmin ${trDF(thai.dayName)}: ${trDF(ninestar.starColor)} / ${trDF(thai.dayColor)}`),
            systems: ['Nine Star Ki', 'Thai Brahmin', 'Celtic'] },
        { icon: '📝', pts: 0,
            title: tr(`Journal ทุกเช้า — ตั้งเจตนา`, `Journal every morning — set intentions`),
            body: tr(`Life Path ${numerology.lifePath} + Kabbalistic ${kabbalistic.sephira}: ความชัดเจนในความคิดเป็นพลังงาน`, `Life Path ${numerology.lifePath} + Kabbalistic ${kabbalistic.sephira}: clarity of thought IS energy`),
            systems: ['Numerology', 'Kabbalistic', 'Zoroastrian'] },
        { icon: '🙏', pts: 0,
            title: tr(`ทำพิธีกรรมวัน${thai.dayName}`, `Perform a ritual on ${trDF(thai.dayName)}`),
            body: tr(`ไทยพราหมณ์ + Zoroastrian ${zoroastrian.dayYazataTh}: สักการะในวันเกิดของสัปดาห์`, `Thai-Brahmin + Zoroastrian ${zoroastrian.dayYazataTh}: honour the deity on your birth-weekday`),
            systems: ['Thai Brahmin', 'Zoroastrian', 'Onmyōdō'] },
        { icon: '🌿', pts: 0,
            title: tr(`ออกกำลังกาย 3x/สัปดาห์`, `Exercise 3× per week`),
            body: tr(`Biorhythm Physical ${biorhythm.physical}% (${biorhythm.physicalPhase}) + ${celtic.treeNameTh} ธาตุ${celtic.element}`, `Biorhythm Physical ${biorhythm.physical}% (${trDF(biorhythm.physicalPhase)}) + Celtic ${trDF(celtic.treeNameTh)} (${trDF(celtic.element)})`),
            systems: ['Biorhythm', 'Celtic', 'Native American'] },
        { icon: '💬', pts: 0,
            title: tr(`รอ Response ก่อนลงมือ`, `Wait for the inner response before acting`),
            body: tr(`${humandesign.typeTh} Authority ${humandesign.authority}: ตัดสินใจตาม inner response`, `${trDF(humandesign.typeTh)} Authority ${humandesign.authority}: decide via inner response`),
            systems: ['Energy Type System', 'Norse Rune'] },
        { icon: '🗺️', pts: 0,
            title: tr(`วางแผนทิศ${ninestar.starDirection}`, `Plan around the ${trDF(ninestar.starDirection)} direction`),
            body: tr(`NSK ทิศโชค${ninestar.starDirection} ปี 2026: ใช้ทิศนี้ในการเดินทางและจัดโต๊ะทำงาน`, `NSK lucky direction ${trDF(ninestar.starDirection)} for 2026: use it for travel and work-desk orientation`),
            systems: ['Nine Star Ki', 'Arabic Parts'] },
        { icon: '🌟', pts: 0,
            title: tr(`เชื่อมกับ Odù ${ifaYoruba.odu}`, `Connect with Odù ${ifaYoruba.odu}`),
            body: tr(`Ifa/Yoruba: ${ifaYoruba.oduTh} — ${ifaYoruba.oduTheme}`, `Ifa/Yoruba: ${ifaYoruba.odu} — ${trDF(ifaYoruba.oduTheme)}`),
            systems: ['Ifa/Yoruba', 'Aboriginal'] },
    ];
    // Pull negative inputs (things to avoid) from low-scoring systems + BaZi avoidance
    const negatives = [
        { icon: '🚫',
            title: tr(`หลีกเลี่ยงธาตุ${bazi.avoidElement}`, `Avoid the ${trDF(bazi.avoidElement)} element`),
            body: tr(`BaZi: ธาตุ${bazi.avoidElement}กดพลังงาน Day Master — ลดสีและอาหารที่สอดคล้อง`, `BaZi: ${trDF(bazi.avoidElement)} suppresses your Day Master — reduce matching colours and foods`),
            source: 'BaZi' },
        { icon: '⚠️',
            title: tr(`ระวัง Self-Punishment 午午`, `Watch for Self-Punishment 午午`),
            body: tr(`BaZi: ${bazi.dayStem}${bazi.dayBranch} + ${bazi.yearStem}${bazi.yearBranch} มีแรงกดดันตัวเอง — อย่า overthink`, `BaZi: ${bazi.dayStem}${bazi.dayBranch} + ${bazi.yearStem}${bazi.yearBranch} carries self-pressure — don't overthink`),
            source: 'BaZi Self-Punch' },
        ...(c.score.breakdown.filter(b => b.score < 650).map(b => ({
            icon: '⚠️',
            title: tr(`ระวัง: ${b.system}`, `Watch: ${trDF(b.system)}`),
            body: trDF(b.finding),
            source: trDF(b.system)
        }))),
        { icon: '🔴',
            title: tr(`${onmyodo.rokuyo} Birth Day — ระวังสิ่งนี้`, `${onmyodo.rokuyo} Birth Day — be aware`),
            body: tr(`Onmyōdō ${onmyodo.rokuyoTh}: วันเกิดมีพลังงาน${onmyodo.rokuyo} — ระมัดระวังในวันเดียวกันของสัปดาห์`, `Onmyōdō ${onmyodo.rokuyo}: your birth day carries ${onmyodo.rokuyo} energy — be cautious on the same weekday`),
            source: 'Onmyōdō' },
    ];
    // Score by system count (systems array length)
    positives.forEach(p => { p.pts = p.systems.length * 7 + (c.score.breakdown.find(b => b.system.includes(p.systems[0]?.split(' ')[0]))?.score || 700) / 100 | 0; });
    positives.sort((a, b) => b.pts - a.pts);
    // Compute cosmic score delta per action:
    // +1 point per endorsing system × 3 = small lift (3-system positive = +9)
    // Scaling is for visualisation only — users can see "doing this lifts your
    // consensus reading by ~X" even if the underlying score is fixed at birth.
    const cosmicDelta = (systemsCount) => systemsCount * 3;
    const cosmicDrain = (severity = 1) => -severity * 4;
    return section(18, tr('Activation Plan — ลำดับความสำคัญจาก 26 ศาสตร์', 'Activation Plan — Priority Actions from 26 Systems'), '🚀', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('วิธีอ่านและทำตาม', 'How to read this')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr(`แต่ละข้อถูก <strong>จัดลำดับความสำคัญจากจำนวนศาสตร์ที่เห็นพ้อง</strong> —
        ยิ่งหลายศาสตร์อิสระชี้ไปทางเดียวกัน ยิ่งมีน้ำหนัก`, `Each item is <strong>ranked by how many independent systems agree on it</strong> — the more traditions point the same direction, the more weight it carries.`)}<br>
        <strong style="color:#60c060">[+X]</strong> = ${tr('คาดว่าเสริม Cosmic Score Consensus ประมาณ +X จุด', 'expected to lift your Cosmic Score Consensus by ~X points')} ·
        <strong style="color:#c06060">[−X]</strong> = ${tr('ลด Consensus ถ้าทำสิ่งที่ขัดกับดวง', 'reduces consensus when you act against your chart')}<br>
        <span style="color:#6a5a42">${tr('หมายเหตุ: Cosmic Score ของวันเกิดคงที่ตลอดชีวิต — ตัวเลขนี้คือ "การใช้ชีวิตให้สอดคล้องกับดวง" ที่ชัดเจนขึ้น ไม่ใช่เปลี่ยนดวง', 'Note: your birth-chart Cosmic Score is fixed for life — this number reflects how aligned you\'re living with it, not a change to the chart itself.')}</span>
      </div>
    </div>

    <div style="font-size:13px;font-weight:600;color:#60c060;margin-bottom:8px">✅ ${tr('สิ่งที่ควรทำ · Priority-ranked (เรียงจากศาสตร์เห็นพ้องมากสุด)', 'What to do · Priority-ranked (most-agreed-upon first)')}</div>
    ${positives.slice(0, 8).map((a, n) => {
        const delta = cosmicDelta(a.systems.length);
        const priority = n < 3 ? 'HIGH' : n < 6 ? 'MEDIUM' : 'LOW';
        const priorityColor = n < 3 ? '#d4aa50' : n < 6 ? '#c0a060' : '#7a6a52';
        return `
      <div style="display:flex;gap:10px;padding:10px;border:1px solid ${n < 3 ? '#d4aa50' : '#2a2010'};border-radius:8px;margin:6px 0;background:${n < 3 ? '#1e1a0e' : '#141210'}">
        <div style="display:flex;flex-direction:column;align-items:center;min-width:34px">
          <span style="font-size:22px">${a.icon}</span>
          <span style="font-size:8px;letter-spacing:1px;color:${priorityColor};margin-top:2px">${priority}</span>
        </div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
            <span style="font-weight:600;color:#d4aa50;font-size:13px">${n + 1}. ${esc(a.title)}</span>
            <div style="display:flex;gap:6px;align-items:center">
              <span style="font-size:10px;color:#60a060;background:#0a1a0e;padding:2px 8px;border-radius:10px">${a.systems.length} ${tr('ศาสตร์ตรงกัน', 'agree')}</span>
              <span style="font-size:10px;color:#60c060;background:#0a1a0e;padding:2px 8px;border-radius:10px">+${delta}</span>
            </div>
          </div>
          <div style="font-size:11.5px;color:#c8c0a8;margin-top:4px;line-height:1.55">${esc(a.body)}</div>
          <div style="font-size:10px;color:#7a9070;margin-top:4px">${tr('ที่มา:', 'Sources:')} ${a.systems.slice(0, 3).map(s => '<strong>' + esc(s.replace(/\$\{[^}]*\}/g, '')) + '</strong>').join(' · ')}${a.systems.length > 3 ? ` +${(a.systems.length - 3)} ${tr('อื่นๆ', 'more')}` : ''}</div>
        </div>
      </div>`;
    }).join('')}

    <div style="font-size:13px;font-weight:600;color:#c05030;margin:16px 0 8px">🚫 ${tr('สิ่งที่ควรหลีกเลี่ยง · ลดความสอดคล้องกับดวง', 'What to avoid · reduces alignment with your chart')}</div>
    ${negatives.map(n => {
        const drain = cosmicDrain(1);
        return `
      <div style="display:flex;gap:10px;padding:10px;border:1px solid #3a1510;border-radius:8px;margin:5px 0;background:#1a0a08">
        <span style="font-size:20px">${n.icon}</span>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
            <span style="font-weight:600;color:#d07050;font-size:12.5px">${esc(n.title)}</span>
            <span style="font-size:10px;color:#c06060;background:#1a0a08;border:1px solid #4a2020;padding:2px 8px;border-radius:10px">${drain}</span>
          </div>
          <div style="font-size:11px;color:#c8a890;margin-top:3px;line-height:1.55">${esc(n.body)}</div>
          <div style="font-size:10px;color:#7a4030;margin-top:3px">${tr('ที่มา:', 'Source:')} <strong>${esc(n.source)}</strong></div>
        </div>
      </div>`;
    }).join('')}
  `);
}
function p17_weekly(c) {
    // Energy ของแต่ละวันมาจาก 3 ศาสตร์พร้อมกัน:
    //   1. ดาวประจำวัน (Planetary day ruler) — ไทยพราหมณ์/Hellenistic convention
    //   2. ธาตุของวัน (5-element day cycle)
    //   3. สีมงคลประจำวัน (ไทย/Vedic convention)
    // ผสานกับ Day Master ของผู้ใช้ → บอก "พลังประจำวัน" ที่เหมาะกับคุณ
    const { bazi, ninestar, humandesign, thai, celtic } = c;
    const dmEl = bazi.dayMasterElement;
    // Day-of-week cosmology (Vedic / Hellenistic / ไทยพราหมณ์ — all agree on the 7-planet system)
    const daysData = [
        { name: tr('จันทร์', 'Monday'), planet: tr('จันทร์ · Moon', 'Moon'), element: tr('น้ำ', 'Water'), color: tr('เหลือง', 'Yellow'), energy: tr('สัญชาตญาณ · อารมณ์', 'Intuition · Emotion') },
        { name: tr('อังคาร', 'Tuesday'), planet: tr('อังคาร · Mars', 'Mars'), element: tr('ไฟ', 'Fire'), color: tr('ชมพู', 'Pink'), energy: tr('ลงมือ · ความกล้า · การแข่งขัน', 'Action · Courage · Competition') },
        { name: tr('พุธ', 'Wednesday'), planet: tr('พุธ · Mercury', 'Mercury'), element: tr('ไม้', 'Wood'), color: tr('เขียว', 'Green'), energy: tr('สื่อสาร · เจรจา · สอน', 'Communication · Negotiation · Teaching') },
        { name: tr('พฤหัสบดี', 'Thursday'), planet: tr('พฤหัส · Jupiter', 'Jupiter'), element: tr('ไม้', 'Wood'), color: tr('ส้ม', 'Orange'), energy: tr('ขยายตัว · การเรียนรู้ · โชคลาภ', 'Expansion · Learning · Fortune') },
        { name: tr('ศุกร์', 'Friday'), planet: tr('ศุกร์ · Venus', 'Venus'), element: tr('โลหะ', 'Metal'), color: tr('ฟ้าอ่อน', 'Light Blue'), energy: tr('ความสัมพันธ์ · ศิลปะ · ความงาม', 'Relationships · Art · Beauty') },
        { name: tr('เสาร์', 'Saturday'), planet: tr('เสาร์ · Saturn', 'Saturn'), element: tr('ดิน', 'Earth'), color: tr('ดำ/ม่วง', 'Black/Purple'), energy: tr('วินัย · โครงสร้าง · ความอดทน', 'Discipline · Structure · Endurance') },
        { name: tr('อาทิตย์', 'Sunday'), planet: tr('อาทิตย์ · Sun', 'Sun'), element: tr('ไฟ', 'Fire'), color: tr('แดง', 'Red'), energy: tr('อัตตา · ความเป็นผู้นำ · ชื่อเสียง', 'Self · Leadership · Renown') },
    ];
    // ศาสตร์ 5 ธาตุ: เสริม (SHENG) · ควบคุม (KE) · กลาง
    const SHENG = { 'น้ำ': 'ไม้', 'ไม้': 'ไฟ', 'ไฟ': 'ดิน', 'ดิน': 'โลหะ', 'โลหะ': 'น้ำ' };
    const KE = { 'น้ำ': 'ไฟ', 'ไฟ': 'โลหะ', 'โลหะ': 'ไม้', 'ไม้': 'ดิน', 'ดิน': 'น้ำ' };
    const rate = (dayEl) => {
        if (dayEl === dmEl)
            return { label: tr('☀️ พลังเท่าตัว', '☀️ Full power'), color: '#c8a840', why: tr('ธาตุของวันตรงกับ Day Master — ดึงพลังของตัวเองมาใช้ได้ 100%', 'The day\'s element matches your Day Master — 100% of your native energy available.') };
        if (SHENG[dayEl] === dmEl)
            return { label: tr('🟢 วันที่หล่อเลี้ยง', '🟢 A nourishing day'), color: '#60a060', why: tr(`${dayEl} สร้าง ${dmEl} ในวงจร 5 ธาตุ — ได้รับการหล่อเลี้ยง`, `${dayEl} produces ${dmEl} in the 5-element cycle — you receive nourishment.`) };
        if (SHENG[dmEl] === dayEl)
            return { label: tr('🟡 วันที่คุณให้', '🟡 A day you give'), color: '#c0a060', why: tr(`${dmEl} สร้าง ${dayEl} — คุณเป็นผู้ให้ รู้สึกภูมิใจแต่เหนื่อยง่าย`, `${dmEl} produces ${dayEl} — you\'re the giver: proud but easily depleted.`) };
        if (KE[dayEl] === dmEl)
            return { label: tr('🔴 วันที่ต้องตั้งรับ', '🔴 A day to play defence'), color: '#c06060', why: tr(`${dayEl} ควบคุม ${dmEl} ใน 5 ธาตุ — ต้องยับยั้งชั่งใจ ไม่ฝืน`, `${dayEl} controls ${dmEl} in the 5-element cycle — restraint over force.`) };
        if (KE[dmEl] === dayEl)
            return { label: tr('⚠️ วันที่ต้องระวังรีดพลัง', '⚠️ A day that drains'), color: '#c08060', why: tr(`${dmEl} ควบคุม ${dayEl} — คุณเอาชนะได้แต่ใช้พลังมาก`, `${dmEl} controls ${dayEl} — you can win, but the cost is high.`) };
        return { label: tr('· กลาง', '· Neutral'), color: '#9a8a72', why: tr('ธาตุไม่เชื่อมโยงกัน — วันปกติ ไม่เร่ง ไม่หยุด', 'Elements unrelated — an ordinary day, neither pushing nor pausing.') };
    };
    const strategy = humandesign.strategy || 'Follow inner authority';
    return section(17, tr('Weekly Energy Plan — พลังงาน 7 วันต่อดวงของคุณ', 'Weekly Energy Plan — 7-day rhythm against your chart'), '📅', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('Energy ของแต่ละวันคืออะไร', 'What each weekday\'s energy means')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr(`ปฏิทิน 7 วันของโลกไม่ใช่เรื่องบังเอิญ — <strong>ไทยพราหมณ์ · Hellenistic · Vedic</strong> ทั้ง 3 ศาสตร์ตกลงว่าแต่ละวันอยู่ใต้การปกครองของดาวคนละดวง
        ซึ่งมีธาตุและพลังงานของมันเอง`, `The world's 7-day calendar is not coincidence — <strong>Thai Brahmin · Hellenistic · Vedic</strong> all agree that each day is ruled by a different planet, each with its own element and energy.`)}<br>
        ${tr(`ตารางด้านล่างเทียบ <strong>ธาตุของวัน</strong> กับ <strong>Day Master ของคุณ (${esc(bazi.dayMasterTh)} · ธาตุ${esc(dmEl)})</strong> แล้วบอกว่าวันไหนหล่อเลี้ยง วันไหนรีดพลัง`, `The table below compares <strong>each day's element</strong> against <strong>your Day Master (${esc(bazi.dayMasterTh)} · ${esc(dmEl)})</strong> and tells you which days nourish you and which drain you.`)}
      </div>
    </div>

    <table>
      <thead><tr>
        <th>${tr('วัน / ดาว', 'Day / Planet')}</th>
        <th>${tr('ธาตุ', 'Element')}</th>
        <th>${tr('พลังงานเด่น', 'Dominant Energy')}</th>
        <th>${tr('vs ดวงคุณ', 'vs Your Chart')}</th>
      </tr></thead>
      <tbody>
        ${daysData.map((d) => {
        const r = rate(d.element);
        const isBirthDay = d.name === thai.dayName;
        return `<tr ${isBirthDay ? 'style="background:#1e1a0e"' : ''}>
            <td>
              <div style="font-weight:600;color:${isBirthDay ? '#d4aa50' : '#c8c0a8'}">${esc(d.name)}${isBirthDay ? ' ★' : ''}</div>
              <div style="font-size:10px;color:#7a6a52;margin-top:2px">${esc(d.planet)}</div>
            </td>
            <td style="font-size:11.5px;color:#c8a840">${esc(d.element)}</td>
            <td style="font-size:11px;color:#c8c0a8">${esc(d.energy)}</td>
            <td style="font-size:11px;color:${r.color}">${esc(r.label)}<div style="color:#7a6a52;font-size:9.5px;margin-top:2px">${esc(r.why)}</div></td>
          </tr>`;
    }).join('')}
      </tbody>
    </table>

    ${box(tr(`วันเกิดของคุณ = วัน${esc(thai.dayName)} ★`, `Your Birth Weekday = ${esc(thai.dayName)} ★`), tr(`ในทางไทยพราหมณ์ วันเกิดคือวัน "ขอพร" — เทพประจำวัน${esc(thai.dayName)} (${esc(thai.dayGodTh || thai.dayGod || '—')}) เปิดรับคำขอพิเศษ ควรงดเนื้อสัตว์ / ทำบุญ / ตั้งจิตในวันนี้ทุกสัปดาห์<br><br>ส่วน <strong>Strategy Human Design</strong> ของคุณคือ "${esc(strategy)}" — ใช้ทุกวันเป็นแกนตัดสินใจ ไม่ใช่แค่วันเกิด`, `In Thai Brahmin tradition, your birth weekday is the day for <em>asking blessings</em> — your day-deity ${esc(thai.dayName)} (${esc(thai.dayGodTh || thai.dayGod || '—')}) is most receptive to special petitions. Consider abstaining from meat, making merit, and setting intentions on this weekday throughout the year.<br><br>Your <strong>Human Design Strategy</strong> is "${esc(strategy)}" — use it as your decision compass every day, not only on your birth weekday.`), 'gold')}
  `);
}
function p18_monthly2026(c) {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const monthStars = [2, 8, 7, 6, 5, 4, 3, 2, 1, 9, 8, 7];
    const starNames = ['', '一白水星', '二黒土星', '三碧木星', '四緑木星', '五黄土星', '六白金星', '七赤金星', '八白土星', '九紫火星'];
    const STAR_EL = { 1: 'Water', 2: 'Earth', 3: 'Wood', 4: 'Wood', 5: 'Earth', 6: 'Metal', 7: 'Metal', 8: 'Earth', 9: 'Fire' };
    const SHENG = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
    const KE = { Wood: 'Earth', Earth: 'Water', Water: 'Fire', Fire: 'Metal', Metal: 'Wood' };
    const natal = c.ninestar.star;
    // Biorhythm monthly peaks (approximate by days elapsed)
    const birthJD = Math.floor(2451545 + (c.input.year - 2000) * 365.25 + c.input.month * 30 + c.input.day);
    const monthBiorhythm = months.map((_, mi) => {
        const days = Math.round((2026 - c.input.year) * 365.25) + (mi * 30);
        const phy = Math.round(Math.sin(2 * Math.PI * days / 23) * 100);
        const emo = Math.round(Math.sin(2 * Math.PI * days / 28) * 100);
        const int = Math.round(Math.sin(2 * Math.PI * days / 33) * 100);
        return { phy, emo, int, avg: Math.round((phy + emo + int) / 3) };
    });
    // Vedic monthly quality (based on dasha sub-period)
    const vedicMonthQuality = months.map((_, mi) => {
        const py = ((c.numerology.personalYear2026 - 1 + mi) % 9) + 1;
        return [1, 3, 6, 8].includes(py) ? tr('ดี', 'Good') : [5].includes(py) ? tr('ระวัง', 'Caution') : tr('ปานกลาง', 'Mixed');
    });
    function monthRating(ms, bioAvg) {
        let base = 0;
        if (ms === natal)
            base = 3;
        else if (SHENG[STAR_EL[ms] ?? ''] === 'Fire')
            base = 2;
        else if (KE[STAR_EL[ms] ?? ''] === 'Fire')
            base = -1;
        if (ms === 5)
            base -= 1;
        const bioBonus = bioAvg > 40 ? 1 : bioAvg < -40 ? -1 : 0;
        const total = base + bioBonus;
        const icon = ms === natal ? '🌟' : total >= 2 ? '🟢' : total >= 0 ? '🟡' : '🔴';
        return { icon, score: total };
    }
    // Synthesis: surface the standout months instead of leaving them in the table.
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const lbl = (i) => _lang === 'en' ? monthsEn[i] : months[i];
    const monthEval = months.map((_, i) => ({ i, r: monthRating(monthStars[i], monthBiorhythm[i].avg), honmei: monthStars[i] === natal }));
    const bestM = monthEval.filter(e => e.r.icon === '🌟' || e.r.icon === '🟢').map(e => lbl(e.i));
    const honmeiM = (() => { const h = monthEval.find(e => e.honmei); return h ? lbl(h.i) : ''; })();
    const cautionM = monthEval.filter(e => e.r.icon === '🔴').map(e => lbl(e.i));
    const monthSynthesis = tr(`เดือนที่พลังหนุนที่สุดของปี 2026 คือ <strong>${bestM.join(', ') || '—'}</strong>${honmeiM ? ` (โดยเฉพาะ <strong>${honmeiM}</strong> ที่เป็น Honmei — เดือนดาวเกิดของคุณซึ่งมาปีละครั้ง)` : ''} — เก็บเรื่องใหญ่ เปิดตัว หรือเริ่มสิ่งสำคัญไว้ทำช่วงนี้ · ส่วนเดือนที่ควรตั้งหลักคือ <strong>${cautionM.join(', ') || 'ไม่มีเดือนที่ท้าทายเด่นชัด'}</strong> ใช้ช่วงนั้นทบทวนและเตรียมตัวแทนการบุก`, `Your most supported months in 2026 are <strong>${bestM.join(', ') || '—'}</strong>${honmeiM ? ` (especially <strong>${honmeiM}</strong>, your Honmei — the birth-star month that comes once a year)` : ''} — save your big launches and important starts for these. The months to steady yourself are <strong>${cautionM.join(', ') || 'none stand out as challenging'}</strong>; use them to reflect and prepare rather than push.`);
    return section(16, tr('พยากรณ์รายเดือน 2026 — 3 ศาสตร์ Consensus', 'Monthly Forecast 2026 — 3-System Consensus'), '🗓️', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('วิธีอ่านตารางนี้', 'How to read this table')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr('ตารางนี้เทียบ 3 ศาสตร์ <strong>ที่คำนวณอิสระจากกัน</strong> ในแต่ละเดือนของปี 2026 — เดือนที่ 3 ศาสตร์เห็นพ้องว่า "ดี" คือเดือนที่ควรลงมือ; เดือนที่ไม่สอดคล้อง ควรนิ่งและสังเกต', 'This table compares 3 systems <strong>that calculate independently</strong> for each month of 2026 — months where all three agree on "good" are months to act; months that disagree are for stillness and observation.')}
        <br><br>
        <strong style="color:#c8a840">NSK</strong> = ${tr(`ดาวประจำเดือน (เทียบกับดาวเกิด ${natal} ${esc(c.ninestar.starChinese || '')})`, `monthly star (vs your birth star ${natal} ${esc(c.ninestar.starChinese || '')})`)} ·
        ${natal} ${tr('ตรงเมื่อไหร่', 'aligning')} = <strong>Honmei</strong> = ${tr('ปีเกิดทุก 9 ปี', 'your birth-star month every 9 years')}<br>
        <strong style="color:#c8a840">Bio</strong> = ${tr('ค่าเฉลี่ย Biorhythm 3 วงจร (กาย + อารมณ์ + สมอง) ในกลางเดือนนั้น', 'average of 3 biorhythm cycles (Physical + Emotional + Intellectual) at mid-month')}<br>
        <strong style="color:#c8a840">PY-pattern</strong> = ${tr(`สถานะ Numerology ของเดือน (คำนวณจาก Personal Year ${c.numerology.personalYear2026})`, `numerology month status (derived from your Personal Year ${c.numerology.personalYear2026})`)}
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>${tr('เดือน', 'Month')}</th>
          <th>${tr('NSK ดาวเดือน', 'NSK Month Star')}</th>
          <th>Bio avg</th>
          <th>PY-pattern</th>
          <th>Consensus</th>
          <th>${tr('แนะนำ', 'Advice')}</th>
        </tr>
      </thead>
      <tbody>
        ${months.map((m, i) => {
        const ms = monthStars[i];
        const bio = monthBiorhythm[i];
        const nskRating = monthRating(ms, bio.avg);
        const isHonmei = ms === natal;
        const adviceTh = nskRating.icon === '🌟' ? tr('Honmei — ตั้งเป้าหมายใหญ่', 'Honmei — set big goals')
            : nskRating.icon === '🟢' ? tr('ลงมือทำได้เลย · พลังเสริม', 'Act now · energy supports')
                : nskRating.icon === '🟡' ? tr('ค่อยๆ ขยับ · ไม่เร่ง', 'Move gradually · don\'t rush')
                    : tr('ระวังและสังเกต · ไม่รีบตัดสินใจ', 'Watch & observe · don\'t decide hastily');
        return `<tr>
            <td style="font-weight:600">${esc(lbl(i))}</td>
            <td style="font-size:11px">${ms} ${esc(starNames[ms])}${isHonmei ? ' ★' : ''}</td>
            <td style="font-size:11px;color:${bio.avg > 30 ? '#60c060' : bio.avg < -30 ? '#c06060' : '#c0a060'}">${bio.avg > 0 ? '+' : ''}${bio.avg}%</td>
            <td style="font-size:11px;color:#9a8a72">${esc(vedicMonthQuality[i])}</td>
            <td style="text-align:center;font-size:16px">${nskRating.icon}</td>
            <td style="font-size:11px;color:#9a8a72">${esc(adviceTh)}</td>
          </tr>`;
    }).join('')}
      </tbody>
    </table>
    ${box(tr('สรุป: เดือนไหนควรลงมือ', 'At a glance: when to act'), monthSynthesis, 'green')}
    <div style="font-size:10.5px;color:#9a8a72;margin-top:10px;line-height:1.7">
      ${tr(`🌟 <strong>Honmei</strong> (ดาวเดือนตรงกับดาวเกิด ${natal} — เกิดปีละ 1 เดือน) · 🟢 <strong>Positive</strong> (NSK+Bio หนุนกัน) · 🟡 <strong>Neutral</strong> (หนึ่งหนุนหนึ่งต้าน) · 🔴 <strong>Challenging</strong> (NSK ขัด + Bio ตก)`, `🌟 <strong>Honmei</strong> (month star matches your birth star ${natal} — once per year) · 🟢 <strong>Positive</strong> (NSK + Bio aligned) · 🟡 <strong>Neutral</strong> (one supports, one resists) · 🔴 <strong>Challenging</strong> (NSK clashes + Bio dips)`)}
      <br>
      <span style="color:#6a5a42">${tr('หมายเหตุ: ไม่ใช่ "ดวงดี / ดวงแย่" — เป็นสัญญาณของช่วงเวลาที่ <strong>พลังงานสอดคล้อง vs ต้องระวัง</strong> เท่านั้น', 'Note: not "good fate / bad fate" — only a signal of when <strong>energy aligns vs. when caution is warranted</strong>.')}</span>
    </div>
  `);
}
function p19_decade(c) {
    const currentAge = 2026 - c.input.year;
    const lps = c.bazi.luckPillars;
    const { vedicMahadasha, ninestar, numerology, bazi } = c;
    const dmEl = bazi.dayMasterElement;
    // Personal-Year formula: standard Pythagorean numerology = reduce(month+day+year).
    // Use INTEGER arithmetic only — the old (1 + month/12) variant produced
    // fractional PYs like 4.5 which the user flagged.
    const pyForYear = (year) => {
        const digitSum = (n) => String(n).split('').reduce((a, b) => a + (+b), 0);
        let s = digitSum(c.input.month) + digitSum(c.input.day) + digitSum(year);
        while (s > 9 && s !== 11 && s !== 22 && s !== 33)
            s = digitSum(s);
        return s;
    };
    // Archetype meaning per life stage + the reason it maps to your chart.
    // Advice is derived from Day Master + dominant LP stem/branch, not a generic
    // one-line filler. Decade 25–34 can be ลงมือลุย vs พักค้นหา depending on
    // which element supports dmEl at that Luck Pillar.
    const SHENG_BY = { 'ไม้': 'น้ำ', 'ไฟ': 'ไม้', 'ดิน': 'ไฟ', 'โลหะ': 'ดิน', 'น้ำ': 'โลหะ' };
    const feedEl = SHENG_BY[dmEl] || 'น้ำ';
    const decades = [
        { age: '25–34', label: tr('วัยสร้างรากฐาน', 'Foundation Years'),
            why: tr(`ช่วงที่ Day Master ${dmEl} ต้องการ ${feedEl} หล่อเลี้ยง — ทุกประสบการณ์คือวัตถุดิบ`, `A phase where your ${dmEl} Day Master needs ${feedEl} to nourish it — every experience is raw material.`) },
        { age: '35–44', label: tr('วัยลงมือสร้าง', 'Building Years'),
            why: tr(`พลังงาน ${dmEl} ถึงจุดอิ่มตัว — เหมาะต่อยอดที่สะสมไว้ให้เห็นผลเป็นรูปธรรม`, `Your ${dmEl} energy reaches saturation — time to compound what you've stored into concrete results.`) },
        { age: '45–54', label: tr('วัยเก็บเกี่ยว', 'Harvest Years'),
            why: tr('Luck Pillar เปลี่ยนทิศ — สิ่งที่ลงแรงในสองทศวรรษก่อนเริ่มให้ดอกผล', 'Your Luck Pillar shifts direction — what you sowed across the prior two decades begins to bear fruit.') },
        { age: '55–64', label: tr('วัยถ่ายทอด', 'Transmission Years'),
            why: tr(`พลัง ${dmEl} เริ่มถอย — คุณค่าเปลี่ยนจาก "ทำเอง" เป็น "สอน / mentoring"`, `Your ${dmEl} force begins to recede — value shifts from "doing" to "teaching / mentoring".`) },
        { age: '65+', label: tr('วัยปัญญา', 'Wisdom Years'),
            why: tr('ชั้นของ experience สะสมเป็น wisdom — ถึงเวลาใช้บทเรียนสร้างมรดก', 'Layers of experience compound into wisdom — time to translate the lessons into legacy.') },
    ];
    const NSK_CHAR = {
        1: tr('白 น้ำขาว', '白 White Water'),
        2: tr('黒 ดินดำ', '黒 Black Earth'),
        3: tr('碧 ไม้น้ำเงิน', '碧 Blue Wood'),
        4: tr('緑 ไม้เขียว', '緑 Green Wood'),
        5: tr('黄 ดินเหลือง', '黄 Yellow Earth'),
        6: tr('白 โลหะขาว', '白 White Metal'),
        7: tr('赤 โลหะแดง', '赤 Red Metal'),
        8: tr('白 ดินขาว', '白 White Earth'),
        9: tr('紫 ไฟม่วง', '紫 Purple Fire'),
    };
    const NSK_THEME = {
        1: tr('สายน้ำที่ไหลลึก · ปัญญาภายใน', 'Deep flowing water · inner wisdom'),
        2: tr('แผ่นดิน · รักษาความสัมพันธ์', 'Earth · sustaining relationships'),
        3: tr('แตกหน่อ · เริ่มต้น · สื่อสาร', 'Sprouting · beginning · communication'),
        4: tr('ลม / ไม้โต · ยืดหยุ่นและเดินทาง', 'Wind / mature wood · flexibility & travel'),
        5: tr('ศูนย์กลาง · พลิกผันใหญ่', 'The centre · large reversals'),
        6: tr('โลหะผู้นำ · บริหารและอำนาจ', 'Leadership metal · administration & authority'),
        7: tr('โลหะร่าเริง · ความสุขและวัตถุ', 'Joyful metal · pleasure & material life'),
        8: tr('ภูเขา · เปลี่ยนผ่านและสะสม', 'Mountain · transition & accumulation'),
        9: tr('ไฟ · ชื่อเสียงและแสงสว่าง', 'Fire · renown & illumination'),
    };
    return section(15, tr('Decade by Decade — มุมมอง 4 ศาสตร์ซ้อนกัน', 'Decade by Decade — 4-System Layered View'), '📖', `
    <div style="font-size:11.5px;color:#9a8a72;margin-bottom:12px;line-height:1.7">
      ${tr('แต่ละทศวรรษอ่านจาก 4 แกนพร้อมกัน — <strong>BaZi Luck Pillar</strong> (ฉากหลัง 10 ปี) + <strong>Nine Star Ki</strong> (พลังงานเด่นของรอบ 9 ปี) + <strong>Vedic Mahadasha</strong> (เทพครองช่วง) + <strong>Numerology Personal Year</strong> (ธีมเฉพาะปีเริ่ม). เมื่อทั้งสี่ศาสตร์ชี้ไปทางเดียวกัน นั่นคือสัญญาณแรงที่สุด', 'Each decade is read across 4 axes simultaneously — <strong>BaZi Luck Pillar</strong> (10-year backdrop) + <strong>Nine Star Ki</strong> (9-year cycle\'s dominant energy) + <strong>Vedic Mahadasha</strong> (planet ruling the period) + <strong>Numerology Personal Year</strong> (theme of the opening year). When all four point the same direction, the signal is strongest.')}
    </div>

    ${decades.map((d, i) => {
        const ageStart = parseInt(d.age);
        const ageEnd = parseInt(d.age.split('–')[1] || '999');
        const lp = lps.find(lp => lp.ageEnd >= ageStart && lp.ageStart <= ageEnd) || lps[Math.min(i, lps.length - 1)];
        const isNow = currentAge >= ageStart && currentAge <= ageEnd;
        const decadeStartYear = c.input.year + ageStart;
        // Use the same NSK year formula as calcNineStar() so this matches the
        // year-star shown elsewhere (the prior formula derived from age+birth
        // year produced a different cycle and contradicted the headline NSK).
        let nskStar = ((2 - (decadeStartYear - 2024)) % 9 + 9) % 9;
        if (nskStar === 0)
            nskStar = 9;
        const py = pyForYear(decadeStartYear);
        const dashaOverlap = vedicMahadasha.currentDashaEnd >= decadeStartYear;
        const mahadashaLabel = dashaOverlap
            ? tr(`${vedicMahadasha.currentDasha} (ช่วงปัจจุบัน)`, `${vedicMahadasha.currentDasha} (current period)`)
            : tr(`หลัง ${vedicMahadasha.currentDasha} · รอบใหม่`, `After ${vedicMahadasha.currentDasha} · new cycle`);
        return `<div style="border:1px solid ${isNow ? '#d4aa50' : '#2a2010'};border-radius:8px;margin:10px 0;overflow:hidden">
        <div style="background:${isNow ? '#1e1a0e' : '#141210'};padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:700;color:${isNow ? '#d4aa50' : '#c8a840'}">${esc(d.age)} · ${esc(d.label)}</span>
          ${isNow ? `<span style="color:#d4aa50;font-size:11px">▶ ${tr('ยุคปัจจุบันของคุณ', 'Your current era')}</span>` : ''}
        </div>
        <div style="padding:12px 14px;font-size:12px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
            <div>🔥 <strong>BaZi Luck Pillar:</strong><br><span style="color:#9a8a72">${esc(lp.stem)}${esc(lp.branch)} · ${esc(lp.stemTh)} ${esc(lp.branchTh)}</span></div>
            <div>⭐ <strong>Nine Star Ki:</strong><br><span style="color:#9a8a72">${tr('ดาว', 'Star')} ${nskStar} ${esc(NSK_CHAR[nskStar] || '')}</span></div>
            <div>🕉️ <strong>Vedic Mahadasha:</strong><br><span style="color:#9a8a72">${esc(mahadashaLabel)}</span></div>
            <div>🔢 <strong>Personal Year ${decadeStartYear}:</strong><br><span style="color:#9a8a72">PY ${py} ${tr('(ธีมรอบเริ่มทศวรรษ)', '(theme that opens the decade)')}</span></div>
          </div>
          <div style="background:#1a1510;border-left:3px solid #c8a840;padding:8px 10px;margin-top:6px">
            <div style="font-size:10px;color:#c8a840;letter-spacing:1px;margin-bottom:4px">${tr(`ทำไมช่วงนี้ถูกเรียกว่า "${esc(d.label)}"`, `Why this stage is called "${esc(d.label)}"`)}</div>
            <div style="color:#c8c0a8;line-height:1.6">${esc(d.why)} ${tr(`NSK ${nskStar} สะท้อนธีม "<strong>${esc(NSK_THEME[nskStar] || '')}</strong>" คู่ไปกับ Luck Pillar ${esc(lp.stemTh)} — สองศาสตร์ชี้ทิศเดียวกันคือสัญญาณหลัก`, `NSK ${nskStar} echoes the theme "<strong>${esc(NSK_THEME[nskStar] || '')}</strong>" alongside Luck Pillar ${esc(lp.stemTh)} — two systems pointing the same direction is the headline signal.`)}</div>
          </div>
        </div>
      </div>`;
    }).join('')}

    ${box(tr('ช่วงทองในชีวิต', 'Golden Era of Your Life'), tr(`ตอนนี้คุณอยู่ใน <strong>Luck Pillar ${c.bazi.currentLuckPillar} (${c.bazi.currentLuckPillarTh})</strong> + <strong>NSK Star ${ninestar.star} ${ninestar.starChinese}</strong> + <strong>Vedic ${vedicMahadasha.currentDasha} Dasha</strong> — 3 ศาสตร์จาก 3 วัฒนธรรมที่คำนวณอย่างอิสระ ชี้ตรงกันว่าเป็นช่วงสำคัญของชีวิต`, `You are currently in <strong>Luck Pillar ${c.bazi.currentLuckPillar} (${c.bazi.currentLuckPillarTh})</strong> + <strong>NSK Star ${ninestar.star} ${ninestar.starChinese}</strong> + <strong>Vedic ${vedicMahadasha.currentDasha} Dasha</strong> — three independent traditions across three cultures all converge on this being a pivotal phase of your life.`), 'green')}
  `);
}
function p20_colors(c) {
    const { ninestar, bazi, thai, celtic } = c;
    // Each color has a traceable source + one-line "why"
    const sources = [];
    if (ninestar.starColor)
        sources.push({
            color: ninestar.starColor,
            source: tr(`Nine Star Ki (ดาว ${ninestar.star} ${ninestar.starChinese || ''})`, `Nine Star Ki (Star ${ninestar.star} ${ninestar.starChinese || ''})`),
            why: tr(`ดาวเกิดของคุณคือดาว ${ninestar.star} — ${ninestar.starColor}คือสีสัญลักษณ์ของดาวนี้ในโหราศาสตร์ญี่ปุ่น Feng Shui ใช้ค่านี้เป็น accent สำคัญ`, `Your birth star is Star ${ninestar.star} — ${ninestar.starColor} is the symbolic colour of this star in Japanese astrology. Feng Shui uses it as a key accent colour.`),
        });
    const bzColor = bazi.luckyElement === 'ไฟ' ? tr('แดง / ส้ม', 'Red / Orange')
        : bazi.luckyElement === 'ไม้' ? tr('เขียว', 'Green')
            : bazi.luckyElement === 'น้ำ' ? tr('ดำ / น้ำเงิน', 'Black / Blue')
                : bazi.luckyElement === 'โลหะ' ? tr('ขาว / เงิน', 'White / Silver')
                    : tr('เหลือง / น้ำตาล', 'Yellow / Brown');
    sources.push({
        color: bzColor,
        source: `BaZi (Day Master ${bazi.dayMasterTh})`,
        why: tr(`ธาตุมงคลของคุณคือ <strong>${bazi.luckyElement}</strong> — สีนี้สะท้อนธาตุที่ <em>หล่อเลี้ยง</em> Day Master ${bazi.dayMasterTh} ตามวงจร 5 ธาตุจีน`, `Your lucky element is <strong>${bazi.luckyElement}</strong> — this colour reflects the element that <em>nourishes</em> your Day Master ${bazi.dayMasterTh} in the Chinese 5-element cycle.`),
    });
    if (thai.dayColor)
        sources.push({
            color: thai.dayColor,
            source: tr(`ไทยพราหมณ์ (วัน${thai.dayName})`, `Thai Brahmin (${thai.dayName})`),
            why: tr(`คุณเกิดวัน<strong>${thai.dayName}</strong> — ในโหราศาสตร์ไทย สีของเทพประจำวันคือ ${thai.dayColor} ซึ่งช่วยเรียกพลังงานของเทพผู้คุ้มครอง`, `You were born on <strong>${thai.dayName}</strong> — in Thai astrology, the day-deity\'s colour is ${thai.dayColor}, which calls forth the energy of your guardian deity.`),
        });
    // Celtic element → associated color fallback (CelticData doesn't expose a
    // tree color field, so we map from the ruling element).
    const CELTIC_EL_COLOR = {
        'ไม้': tr('เขียวมรกต', 'Emerald Green'),
        'ไฟ': tr('ส้มทอง', 'Golden Orange'),
        'ดิน': tr('น้ำตาลอบอุ่น', 'Warm Brown'),
        'โลหะ': tr('เงินมุก', 'Pearl Silver'),
        'น้ำ': tr('ฟ้าคราม', 'Indigo Blue'),
    };
    const celticColor = CELTIC_EL_COLOR[celtic.element] || '';
    if (celticColor)
        sources.push({
            color: celticColor,
            source: `Celtic (${celtic.treeNameTh || celtic.treeName})`,
            why: tr(`ต้นไม้ประจำวันเกิดของคุณคือ <strong>${celtic.treeNameTh || celtic.treeName}</strong> — ธาตุ${celtic.element} ของต้นไม้นี้สัมพันธ์กับสี ${celticColor}`, `Your birth tree is <strong>${celtic.treeName}</strong> — its ${celtic.element} element associates with the colour ${celticColor}.`),
        });
    const avoidColor = bazi.avoidElement === 'ไฟ' ? tr('แดงสด', 'Bright Red')
        : bazi.avoidElement === 'น้ำ' ? tr('ดำสนิท', 'Solid Black')
            : bazi.avoidElement === 'ไม้' ? tr('เขียวเข้ม', 'Deep Green')
                : bazi.avoidElement === 'โลหะ' ? tr('เงินแท้ / โครเมียม', 'Pure Silver / Chrome')
                    : tr('เหลืองฉูดฉาด', 'Loud Yellow');
    return section(20, tr('สีมงคลและการแต่งตัว — ที่มาจาก 4 ศาสตร์', 'Lucky Colours & Style — Sourced from 4 Systems'), '👗', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('ทำไม "สีมงคล" ของคุณ = สีเหล่านี้ ไม่ใช่สีอื่น', 'Why your "lucky colours" = these specific shades')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr('แต่ละสีถูกเลือกจากศาสตร์คนละศาสตร์ที่คำนวณอิสระจากกัน ยิ่งสีไหนปรากฏซ้ำในหลายศาสตร์ ยิ่งมีน้ำหนัก', 'Each colour is selected by an independent system. Colours that recur across multiple traditions carry more weight.')}
      </div>
    </div>

    <h2>${tr('สีที่แนะนำ', 'Recommended Colours')} · ${sources.length} ${tr('ศาสตร์ยืนยัน', 'systems concur')}</h2>
    ${sources.map(s => `
      <div style="border-left:3px solid #c8a840;background:#1a1510;padding:10px 14px;margin:8px 0;border-radius:0 8px 8px 0">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <div style="font-family:'Sarabun',sans-serif;font-size:16px;font-weight:700;color:#d4aa50">${esc(s.color)}</div>
          <div style="font-size:10.5px;color:#7a6a52">${tr('ที่มา:', 'Source:')} <strong>${esc(s.source)}</strong></div>
        </div>
        <div style="font-size:11.5px;color:#c8c0a8;margin-top:4px;line-height:1.55">${s.why}</div>
      </div>
    `).join('')}

    <h2 style="margin-top:18px">${tr('สีที่ควรลด (ไม่ใช่ห้าม)', 'Colours to Reduce (not forbidden)')}</h2>
    <div style="border-left:3px solid #c01020;background:#1a0a0a;padding:10px 14px;border-radius:0 8px 8px 0">
      <div style="font-size:15px;font-weight:700;color:#f08080">${esc(avoidColor)}</div>
      <div style="font-size:11.5px;color:#e8a880;margin-top:4px">${tr(`ธาตุระวังของคุณคือ <strong>${esc(bazi.avoidElement)}</strong> — สีนี้ "กด" Day Master ${esc(bazi.dayMasterTh)} ตามวงจร 5 ธาตุจีน ใช้เป็นสีหลักบ่อยๆ อาจทำให้รู้สึกหมดพลัง`, `Your element to avoid is <strong>${esc(bazi.avoidElement)}</strong> — this colour "suppresses" your Day Master ${esc(bazi.dayMasterTh)} in the Chinese 5-element cycle. Using it as a primary colour too often may leave you feeling drained.`)}</div>
    </div>

    ${box(tr('คำแนะนำการแต่งกายรายวัน', 'Daily Dressing Guidance'), tr(`• <strong>ปกติ:</strong> ใส่${esc(ninestar.starColor || '')}เป็น accent (1 ชิ้น/วัน — เครื่องประดับ เน็คไท กระเป๋า)<br>` +
        `• <strong>วันสำคัญ:</strong> ใส่สีมงคลเต็มชุด (เลือกจาก ${sources.map(s => s.color).join(' / ')})<br>` +
        `• <strong>ประชุม / ขอขึ้นเงินเดือน:</strong> ${esc(bzColor)} (ธาตุ${esc(bazi.luckyElement)})<br>` +
        `• <strong>อัญมณีนำโชค:</strong> ${esc(celtic.gemstone || '—')} (จาก Celtic)`, `• <strong>Everyday:</strong> wear ${esc(ninestar.starColor || '')} as an accent (one item per day — jewellery, tie, bag)<br>` +
        `• <strong>Important days:</strong> dress fully in lucky colours (choose from ${sources.map(s => s.color).join(' / ')})<br>` +
        `• <strong>Meetings / asking for a raise:</strong> ${esc(bzColor)} (${esc(bazi.luckyElement)} element)<br>` +
        `• <strong>Lucky gemstone:</strong> ${esc(celtic.gemstone || '—')} (from Celtic tradition)`), 'gold')}
  `);
}
function p21_historicalFigures(c) {
    const FIGURE_POOL = [
        { name: 'Steve Jobs', years: '1955–2011', element: 'ไฟ', lifePath: [1, 5, 7], nsk: [1, 4, 9],
            why: tr(`ผู้บุกเบิกด้วยพลังงาน${c.bazi.dayMasterElement} + Life Path ${c.numerology.lifePath} + ความกล้าทำลายกรอบเดิม`, `A pioneer fuelled by ${c.bazi.dayMasterElement} energy + Life Path ${c.numerology.lifePath} + the courage to break frames.`) },
        { name: 'Albert Einstein', years: '1879–1955', element: 'ไม้', lifePath: [7, 11, 3], nsk: [3, 6, 9],
            why: tr(`Life Path ${c.numerology.lifePath} สู่ความจริงอันลึกซึ้ง + ${c.western.sunSignTh}ที่ให้ปัญญาและสัญชาตญาณ`, `Life Path ${c.numerology.lifePath} drawn toward deep truth + ${c.western.sunSign} granting insight and intuition.`) },
        { name: 'Marie Curie', years: '1867–1934', element: 'น้ำ', lifePath: [7, 6, 9], nsk: [1, 8, 6],
            why: tr(`ความลึกของ${c.bazi.dayMasterElement} + NSK ${c.ninestar.star} + ความอดทนสู่ความสำเร็จที่ยิ่งใหญ่`, `The depth of ${c.bazi.dayMasterElement} + NSK ${c.ninestar.star} + the patience that compounds into monumental achievement.`) },
        { name: 'Leonardo da Vinci', years: '1452–1519', element: 'ไม้', lifePath: [5, 11, 3], nsk: [3, 4, 9],
            why: tr(`ครีเอทีฟสูงสุดจาก${c.bazi.dayMasterElement} + Celtic ${c.celtic.treeName} + ความอยากรู้ไม่สิ้นสุด`, `Peak creativity from ${c.bazi.dayMasterElement} + Celtic ${c.celtic.treeName} + an inexhaustible curiosity.`) },
        { name: 'Frida Kahlo', years: '1907–1954', element: 'ไฟ', lifePath: [3, 9, 6], nsk: [9, 3, 7],
            why: tr(`พลังสร้างสรรค์จากภายใน + ธาตุ${c.bazi.dayMasterElement} + NSK ${c.ninestar.star} ที่โดดเด่น`, `Creative force from within + ${c.bazi.dayMasterElement} element + a NSK ${c.ninestar.star} that stands out.`) },
        { name: 'Nikola Tesla', years: '1856–1943', element: 'โลหะ', lifePath: [1, 7, 11], nsk: [1, 7, 4],
            why: tr(`ดาว${c.ninestar.star} + ธาตุ${c.bazi.dayMasterElement} + Life Path ${c.numerology.lifePath} ผสานจินตนาการและวิทยาศาสตร์`, `Star ${c.ninestar.star} + ${c.bazi.dayMasterElement} element + Life Path ${c.numerology.lifePath} fusing imagination with science.`) },
        { name: 'Coco Chanel', years: '1883–1971', element: 'ดิน', lifePath: [8, 4, 1], nsk: [8, 2, 6],
            why: tr(`ธาตุ${c.bazi.dayMasterElement} + NSK ${c.ninestar.star} หนุนรสนิยมและการสร้างตัวตน`, `${c.bazi.dayMasterElement} element + NSK ${c.ninestar.star} backing taste and self-construction.`) },
        { name: 'Laozi (老子)', years: tr('ราว 600 ปีก่อน ค.ศ.', 'c. 600 BCE'), element: 'น้ำ', lifePath: [7, 9, 4], nsk: [1, 6, 8],
            why: tr(`ความลึกของน้ำธาตุ + ปัญญาที่เกิดจากการสังเกต — Life Path ${c.numerology.lifePath}`, `The depth of the water element + wisdom born of observation — Life Path ${c.numerology.lifePath}.`) },
    ];
    // Score each figure by matching: element match (+3), lifePath match (+2), nsk match (+2), base from chart
    const dm = c.bazi.dayMasterElement;
    const lp = c.numerology.lifePath;
    const ns = c.ninestar.star;
    const scoredFigures = FIGURE_POOL.map(f => {
        const matchPts = (f.element === dm ? 3 : 0) + (f.lifePath.includes(lp) ? 2 : 0) + (f.nsk.includes(ns) ? 2 : 0);
        // Score = chart total adjusted for figure match (not hardcoded)
        const figureScore = Math.min(999, Math.round(c.score.total * 0.9 + matchPts * 8 + (f.lifePath[0] * 3)));
        return { ...f, score: figureScore, matchPts };
    });
    const figures = scoredFigures.sort((a, b) => b.matchPts - a.matchPts).slice(0, 4);
    return section(21, tr('บุคคลประวัติศาสตร์ — ดวงคล้ายคุณ', 'Historical Figures — Charts Like Yours'), '🏛️', `
    <p style="margin-bottom:12px">${tr('คัดเลือกจากลักษณะชาร์ตที่คล้ายกัน — ไม่ใช่การทำนายว่าจะเป็นแบบพวกเขา แต่แสดงให้เห็นว่าพลังงานนี้นำไปสู่อะไรได้', 'Selected by chart-pattern similarity — not a prediction that you\'ll become like them, but a glimpse of where this kind of energy can lead.')}</p>
    ${figures.map(f => `
      <div style="border:1px solid #2a2010;border-radius:8px;margin:10px 0;overflow:hidden">
        <div style="background:#151210;padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <span style="font-weight:700;color:#d4aa50">${esc(f.name)}</span>
            <span style="font-size:11px;color:#6a5a42;margin-left:8px">${esc(f.years)}</span>
          </div>
          <span style="font-size:18px;font-weight:700;color:#d4aa50">${f.score}</span>
        </div>
        <div style="padding:10px 14px;font-size:12px;color:#9a8a72">${esc(f.why)}</div>
      </div>`).join('')}
  `);
}
function p22_painPoints(c) {
    const dmEl = c.bazi.dayMasterElement;
    const missingEl = c.bazi.missingElement || (dmEl === 'ไม้' ? 'โลหะ' : dmEl === 'ไฟ' ? 'น้ำ' : dmEl === 'ดิน' ? 'ไม้' : dmEl === 'โลหะ' ? 'ไฟ' : 'ดิน');
    // Element-conditional bits used in the strings below — calculate once so
    // the bilingual strings can interpolate cleanly without long ternaries.
    const dmEmotion = dmEl === 'โลหะ' ? tr('ชอบเก็บไว้ในใจ', 'tend to keep things internal')
        : dmEl === 'ไฟ' ? tr('ระเบิดอารมณ์ง่าย', 'prone to emotional outbursts')
            : dmEl === 'น้ำ' ? tr('ลึกและเปลี่ยนแปลง', 'deep and shifting')
                : dmEl === 'ดิน' ? tr('มั่นคงแต่เปิดตัวช้า', 'steady but slow to open up')
                    : tr('ยืดหยุ่นแต่เรียกร้องอิสระ', 'flexible but craving independence');
    const missingTaste = missingEl === 'ไม้' ? tr('เปรี้ยว', 'sour')
        : missingEl === 'ไฟ' ? tr('ขม', 'bitter')
            : missingEl === 'ดิน' ? tr('หวานธรรมชาติ', 'naturally sweet')
                : missingEl === 'โลหะ' ? tr('เผ็ดเบา', 'lightly pungent')
                    : tr('เค็มเบา', 'lightly salty');
    const missingActivity = missingEl === 'น้ำ' ? tr('ว่ายน้ำ/สมาธิ', 'swimming / meditation')
        : missingEl === 'ไฟ' ? tr('ออกกำลังกลางแจ้ง', 'outdoor exercise')
            : missingEl === 'ดิน' ? tr('เดินเท้าเปล่าบนดิน', 'walking barefoot on earth')
                : missingEl === 'โลหะ' ? tr('หายใจลึก', 'deep breathing')
                    : tr('ปลูกต้นไม้/เดินป่า', 'planting / forest walks');
    const points = [
        { icon: '❤️', topic: tr('ความรัก & ความสัมพันธ์', 'Love & Relationships'),
            systems: ['Western (Moon)', 'BaZi (Day Master)', 'Human Design'],
            why: tr(`ดวงจันทร์ของคุณอยู่ใน<strong>${c.western.moonSignTh}</strong> — ต้องการความมั่นคงทางอารมณ์แบบเฉพาะ · Day Master <strong>${c.bazi.dayMasterTh}</strong> ธาตุ${dmEl}ทำให้การแสดงอารมณ์มีรูปแบบเฉพาะ — ${dmEmotion}`, `Your Moon sits in <strong>${c.western.moonSign}</strong> — needing a specific kind of emotional stability. Your Day Master <strong>${c.bazi.dayMasterTh}</strong> (${dmEl} element) shapes how you express feelings — you ${dmEmotion}.`),
            challenge: tr(`การผสมของ ${c.western.moonSignTh} (Moon) + ธาตุ${dmEl} (BaZi) ทำให้คุณ <em>ต้องการความใกล้ชิดอย่างลึกซึ้ง</em> แต่ <em>แสดงออกยาก</em> — 3 ศาสตร์อิสระชี้แบบเดียวกัน`, `The blend of ${c.western.moonSign} Moon + ${dmEl} Day Master means you <em>crave deep intimacy</em> but <em>find it hard to express</em> — three independent traditions point the same way.`),
            solution: tr(`ฝึก "บอกความรู้สึกก่อนคู่ถาม" — กฎง่ายๆ: สิ่งที่รู้สึกวันนี้ บอกภายใน 48 ชม. · ใช้ HD Strategy ของคุณ (${c.humandesign.strategy}) เป็นตัวกรองว่าจะบอกเมื่อไหร่`, `Practise the "speak first" rule — share what you feel today within 48 hours. Use your HD Strategy ("${c.humandesign.strategy}") as the filter for when to speak.`)
        },
        { icon: '💼', topic: tr('การงาน & พลังงานทำงาน', 'Work & Work Energy'),
            systems: ['Human Design', 'BaZi', 'Nine Star Ki'],
            why: tr(`<strong>${c.humandesign.typeTh}</strong> + Authority <strong>${c.humandesign.authority}</strong> = คุณถูกออกแบบให้ตัดสินใจผ่าน <em>${c.humandesign.authority}</em> ไม่ใช่ mind · NSK ดาว ${c.ninestar.star} ${c.ninestar.starChinese || ''} บอกธีมพลังงานหลักของคุณที่ไม่ควรฝืน`, `<strong>${c.humandesign.typeTh}</strong> + <strong>${c.humandesign.authority}</strong> Authority = you\'re wired to decide through <em>${c.humandesign.authority}</em>, not the mind. NSK Star ${c.ninestar.star} ${c.ninestar.starChinese || ''} marks the dominant energy theme that resists being forced.`),
            challenge: tr(`เมื่อบังคับให้ทำงานขัด Strategy "${c.humandesign.strategy}" คุณจะเหนื่อยเร็วกว่าคนอื่นที่ทำงานเท่ากัน — เป็น bug ของการ <em>บีบพลังงานที่ออกแบบมาต่าง</em> ไม่ใช่ bug ของความพยายาม`, `Forcing work against your "${c.humandesign.strategy}" strategy drains you faster than peers doing the same volume — it\'s a bug in <em>squeezing the wrong-shaped energy</em>, not a bug in your effort.`),
            solution: tr(`ทดลองใช้ Strategy "${c.humandesign.strategy}" อย่างตั้งใจ 90 วัน → สังเกตระดับพลังงานก่อนและหลัง · ถ้าดีขึ้น → วิธีตัดสินใจนี้คือของคุณตลอดชีวิต`, `Run a 90-day experiment using "${c.humandesign.strategy}" deliberately → track your energy before vs after. If it improves, this decision style is yours for life.`)
        },
        { icon: '🌿', topic: tr('สุขภาพ & ธาตุที่ขาด', 'Health & Missing Element'),
            systems: ['BaZi (missing element)', 'TCM organ pairing', 'Biorhythm'],
            why: tr(`BaZi ของคุณขาดธาตุ <strong>${missingEl}</strong> — ธาตุที่ขาดในชาร์ตตาม TCM มักสัมพันธ์กับอวัยวะที่ต้องดูแลพิเศษ · ต่างจาก "โรคภัยทำนาย" — นี่คือ <em>จุดที่ต้องเติมอย่างสม่ำเสมอ</em> ในฐานะการป้องกัน`, `Your BaZi is missing the <strong>${missingEl}</strong> element. Per TCM, a missing element correlates with organ systems that need extra care. This isn\'t illness prediction — it\'s the <em>spot that needs steady supplementation</em> as prevention.`),
            challenge: tr(`เมื่อธาตุ${missingEl}ขาด ระบบที่เกี่ยวข้องจะเป็นจุดแรกที่ "บ่น" เวลาร่างกายตึงเครียด — ไม่ใช่ป่วยหนัก แต่ทำงานไม่เต็มประสิทธิภาพ`, `When ${missingEl} is missing, the corresponding system is the first to "complain" under stress — not severe illness, but underperformance.`),
            solution: tr(`เสริมธาตุ${missingEl} 3 ทางพร้อมกัน — <strong>สี</strong> (ดูหน้าสีมงคล) · <strong>อาหาร</strong> (รส${missingTaste}) · <strong>กิจกรรม</strong> (${missingActivity})`, `Supplement ${missingEl} on 3 channels at once — <strong>colour</strong> (see the lucky-colour page) · <strong>food</strong> (${missingTaste} flavours) · <strong>activity</strong> (${missingActivity}).`)
        },
        { icon: '🤔', topic: tr('การตัดสินใจ & แรงกดดันภายนอก', 'Decisions & External Pressure'),
            systems: ['Human Design (Authority)', 'BaZi (Day Master)', 'Numerology (LP)'],
            why: tr(`<strong>${c.humandesign.authority}</strong> Authority + Life Path ${c.numerology.lifePath} → รูปแบบการตัดสินใจของคุณต้องใช้เวลาเฉพาะ (ไม่ใช่ "ช้า" — แต่ "ต้องรอสัญญาณภายในถูกต้อง") · สังคม modernity มักกดดันให้ "ตัดสินใจไว" ซึ่งเป็นของ Mental Authority แบบเดียวเท่านั้น`, `<strong>${c.humandesign.authority}</strong> Authority + Life Path ${c.numerology.lifePath} → your decision style needs specific timing — not "slow", but "wait for the right inner signal". Modern society pressures everyone to "decide fast", which is only correct for one type of authority (the mental kind).`),
            challenge: tr(`เมื่อถูกเร่ง คุณจะตัดสินใจด้วย "mind" ซึ่งไม่ใช่ Authority ของคุณ → ผลลัพธ์มักทำให้เสียใจภายหลัง · นี่ไม่ใช่จุดอ่อน แต่เป็นการ <em>ใช้เครื่องมือผิดประเภท</em>`, `When rushed, you decide via "mind" — which isn\'t your authority. The result usually breeds regret. This isn\'t weakness — it\'s <em>using the wrong tool</em>.`),
            solution: tr(`กฎ <strong>24/72/7</strong> — เรื่องเล็ก: รอ 24 ชม. · เรื่องกลาง: 72 ชม. · เรื่องใหญ่: 7 วัน · ภายในช่วงนั้น ${c.humandesign.authority} จะส่งสัญญาณชัด ไม่ต้องพยายามคิด`, `The <strong>24/72/7 rule</strong> — small matters: wait 24 hrs · medium: 72 hrs · big: 7 days. Within that window, your ${c.humandesign.authority} sends a clear signal — no forcing thought required.`)
        },
        { icon: '🪞', topic: tr('รู้จักตัวเอง & การเข้าสังคม', 'Self-Knowledge & Social Fit'),
            systems: ['Human Design (Profile)', 'Vedic (Nakshatra)', 'Mayan (Kin)'],
            why: tr(`Profile <strong>${c.humandesign.profile}</strong> + Nakshatra ${c.vedic.moonNakshatra} + Mayan Kin ${c.mayan.kin} — 3 ศาสตร์จาก 3 วัฒนธรรมบอกเรื่อง <em>วิธีที่จิตวิญญาณของคุณมาปรากฏในโลก</em> · มักไม่ตรงกับ "แม่แบบความสำเร็จมาตรฐาน"`, `Profile <strong>${c.humandesign.profile}</strong> + Nakshatra ${c.vedic.moonNakshatra} + Mayan Kin ${c.mayan.kin} — three traditions across three cultures point at <em>how your soul shows up in the world</em>. It rarely matches the "standard success template".`),
            challenge: tr(`คุณจะรู้สึก <em>ไม่ fit</em> ในหลายสถานการณ์ ไม่ใช่เพราะผิดปกติ — แต่เพราะสังคมใช้ template เดียวในการวัดทุกคน ส่วนดวงของคุณเป็น template คนละแบบ`, `You\'ll feel <em>out of place</em> in many settings — not because something\'s wrong with you, but because society measures everyone by one template, and your chart runs on a different one.`),
            solution: tr(`${esc(c.humandesign.profileDesc || 'ทำความเข้าใจ Profile ของตัวเองให้ลึก')} · ใช้ Profile เป็นกรอบอธิบายตัวเอง ไม่ใช่กรอบบังคับ`, `${esc(c.humandesign.profileDesc || 'Study your Profile deeply.')} Use your Profile as a frame for explaining yourself — not as a cage.`)
        },
    ];
    return section(22, tr('5 Pain Points — จุดที่ดวงชี้ให้ดูแลเป็นพิเศษ', '5 Pain Points — areas your chart says to nurture carefully'), '⚡', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('นี่คือ "จุดที่ต้องดูแล" ไม่ใช่ "ดวงเสีย"', 'These are "areas to nurture", not "broken charts"')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr('Pain Point ทั้ง 5 นี้มาจากการอ่านข้าม 3–5 ศาสตร์พร้อมกัน — ยิ่งหลายศาสตร์ชี้จุดเดียวกัน ยิ่งเป็นจุดที่ควรให้ความสนใจในชีวิต · แต่ละข้ออธิบาย <strong>ทำไมเป็น pain point ของคุณโดยเฉพาะ</strong> (Why) + <strong>อาการที่จะเจอ</strong> (Challenge) + <strong>วิธีรับมือตามดวง</strong> (Solution)', 'These 5 Pain Points emerge from cross-reading 3–5 systems at once — the more traditions point at the same spot, the more it merits attention. Each item explains <strong>why it\'s your specific pain point</strong> (Why) + <strong>the symptoms you\'ll encounter</strong> (Challenge) + <strong>how to navigate it through your chart</strong> (Solution).')}
      </div>
    </div>

    ${points.map(p => `
      <div style="border-left:3px solid #8a3040;padding:12px 14px;margin:10px 0;background:#1a0a0a;border-radius:0 8px 8px 0">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;margin-bottom:8px">
          <div style="font-size:15px;font-weight:700;color:#d4aa50">${p.icon} ${esc(p.topic)}</div>
          <div style="font-size:10px;color:#a08060">${p.systems.length} ${tr('ศาสตร์ชี้ตรงกัน', 'systems agree')}</div>
        </div>
        <div style="font-size:10px;color:#7a6a52;margin-bottom:8px">${tr('ที่มา:', 'Sources:')} ${p.systems.map(s => `<strong>${esc(s)}</strong>`).join(' · ')}</div>
        <div style="font-size:11.5px;color:#c8c0a8;margin-bottom:6px;line-height:1.65"><strong style="color:#d4aa50">${tr('ทำไมเป็น pain point ของคุณ:', 'Why this is your pain point:')}</strong> ${p.why}</div>
        <div style="font-size:11.5px;color:#f0a090;margin-bottom:6px;line-height:1.65"><strong>${tr('อาการที่จะเจอ:', 'Symptoms you\'ll encounter:')}</strong> ${p.challenge}</div>
        <div style="font-size:11.5px;color:#90e0a0;line-height:1.65"><strong>${tr('วิธีรับมือตามดวง:', 'How to navigate through your chart:')}</strong> ${p.solution}</div>
      </div>`).join('')}
  `);
}
function p23_forecast10yr(c) {
    const startYear = 2026;
    const years = Array.from({ length: 10 }, (_, i) => startYear + i);
    const { numerology } = c;
    const pyOf = (y) => ((numerology.personalYear2026 - 1 + (y - startYear)) % 9) + 1;
    const nskOf = (y) => ((9 - (y - startYear)) % 9) || 9;
    const icon = (py) => py === 1 || py === 8 || py === 3 ? '🟢' : py === 4 || py === 7 ? '🔴' : '🟡';
    const meaningOf = (py) => py === 1 ? tr('เริ่มต้นใหม่', 'New beginning')
        : py === 2 ? tr('สร้างความสัมพันธ์', 'Build relationships')
            : py === 3 ? tr('สื่อสารขยาย', 'Communicate & expand')
                : py === 4 ? tr('ทำงานหนัก', 'Hard work')
                    : py === 5 ? tr('เปลี่ยนแปลง', 'Change')
                        : py === 6 ? tr('ครอบครัว', 'Family / care')
                            : py === 7 ? tr('พักฟื้น', 'Rest & restore')
                                : py === 8 ? tr('เก็บเกี่ยว', 'Harvest')
                                    : tr('สรุปปิดฉาก', 'Closing chapter');
    // Deep per-Personal-Year guidance: the theme of the year + one concrete move.
    const PY_DEEP = {
        1: { focus: tr(`ปีแห่งการเริ่มต้น เมล็ดพันธุ์ที่หว่านปีนี้จะกำหนดทิศของทั้งรอบ 9 ปีข้างหน้า`, `The year of beginnings — the seeds you plant now set the direction for the entire 9-year cycle ahead.`),
            act: tr(`กล้าตัดสินใจเรื่องใหญ่ เริ่มโปรเจกต์หรือบทใหม่ของชีวิต อย่ารอให้พร้อม 100%`, `Make the big decision. Start the new project or chapter — don't wait to feel 100% ready.`) },
        2: { focus: tr(`ปีแห่งความอดทนและการร่วมมือ สิ่งที่เริ่มไว้ยังต้องบ่ม ไม่ใช่ปีของผลลัพธ์เร็ว`, `A year of patience and partnership — what you started still needs to incubate; this is not a year of fast results.`),
            act: tr(`สร้างพันธมิตร ฟังให้มากกว่าพูด ประคองความสัมพันธ์ที่จะพาคุณไปต่อ`, `Build alliances, listen more than you speak, and nurture the relationships that will carry you forward.`) },
        3: { focus: tr(`ปีแห่งการสื่อสารและความคิดสร้างสรรค์ พลังสังคมและการแสดงออกพุ่งสูง`, `A year of communication and creativity — your social and expressive energy runs high.`),
            act: tr(`เผยแพร่ผลงาน ขยายเครือข่าย ทำสิ่งที่สนุกและปล่อยให้คนอื่นได้เห็นตัวตนของคุณ`, `Publish your work, widen your network, and do the things that are fun and let people see who you really are.`) },
        4: { focus: tr(`ปีแห่งการวางรากฐาน หนักแต่จำเป็น โครงสร้างที่สร้างปีนี้จะรองรับความสำเร็จในอนาคต`, `A year of laying foundations — heavy but necessary. The structures you build now will hold up your future success.`),
            act: tr(`ทำงานเป็นระบบ เก็บรายละเอียด อย่าลัดขั้นตอน เพราะสิ่งที่สร้างปีนี้จะอยู่กับคุณยาว`, `Work systematically, mind the details, and don't cut corners — what you build this year is built to last.`) },
        5: { focus: tr(`ปีแห่งการเปลี่ยนแปลงและอิสระ สิ่งเดิมเริ่มคับแคบ โอกาสใหม่ๆ วิ่งเข้ามาเร็ว`, `A year of change and freedom — the old starts to feel too tight and new openings come at you fast.`),
            act: tr(`เปิดรับโอกาส เดินทาง ปรับตัว แต่อย่าทิ้งทุกอย่างพร้อมกัน เลือกการเปลี่ยนแปลงที่มีทิศ`, `Embrace the openings, travel, adapt — but don't throw everything out at once; choose change that has direction.`) },
        6: { focus: tr(`ปีแห่งความรับผิดชอบต่อคนรอบข้าง บ้าน ครอบครัว และชุมชนต่างเรียกหาคุณ`, `A year of responsibility to those around you — home, family and community all call on you.`),
            act: tr(`ดูแลความสัมพันธ์ใกล้ตัวและสุขภาพ จัดบ้านจัดใจ และรักษาสมดุลระหว่างการให้กับการรับ`, `Tend your close relationships and health, put your home and mind in order, and balance giving with receiving.`) },
        7: { focus: tr(`ปีแห่งการพักและทบทวน พลังภายนอกถอย พลังภายในและปัญญาขึ้นมาแทน`, `A year of rest and reflection — outer momentum pulls back while inner depth and wisdom rise.`),
            act: tr(`พักให้พอ เรียนรู้ให้ลึก ทบทวนทิศทาง อย่าฝืนดันงานใหญ่ในปีที่ร่างกายต้องการฟื้น`, `Rest enough, learn deeply, review your direction — don't force big pushes in a year your body needs to recover.`) },
        8: { focus: tr(`ปีแห่งการเก็บเกี่ยวและอำนาจ ผลของความพยายาม 7 ปีก่อนหน้าสุกพร้อมเก็บ`, `A year of harvest and power — the fruit of the previous seven years ripens and is ready to gather.`),
            act: tr(`ขอในสิ่งที่ควรได้ ปิดดีล ลงทุน และก้าวเข้าสู่บทบาทที่ใหญ่ขึ้นอย่างมั่นใจ`, `Ask for what you've earned, close deals, invest, and step into a bigger role with confidence.`) },
        9: { focus: tr(`ปีแห่งการสรุปและปล่อยวาง รอบ 9 ปีกำลังจบลงเพื่อเปิดพื้นที่ให้รอบใหม่`, `A year of completion and release — the 9-year cycle is closing to make room for the next one.`),
            act: tr(`สะสางสิ่งค้างคา ปล่อยสิ่งที่ไม่ไปต่อ ให้อภัยและให้คืน เคลียร์พื้นที่ว่างไว้สำหรับ PY1 ที่กำลังมา`, `Tie up loose ends, release what no longer fits, forgive and give back — clear the space for the PY1 that's coming.`) },
    };
    const py2026 = pyOf(2026);
    const golden = years.filter(y => [1, 8, 3].includes(pyOf(y)));
    const caution = years.filter(y => [4, 7].includes(pyOf(y)));
    const peak = years.find(y => pyOf(y) === 8) ?? golden[0];
    const arc = tr(`ทศวรรษนี้เปิดด้วยปี 2026 ที่เป็น Personal Year ${py2026} (${meaningOf(py2026)}) แล้วไล่ไปตามรอบพลังงาน 9 ปีของเลขศาสตร์ ซ้อนกับดาวประจำปีของ Nine Star Ki จุดพีคของรอบคือปี ${peak} (PY8 — ปีเก็บเกี่ยว) ส่วนช่วงที่ต้องตั้งหลักคือปี ${caution.join(', ')} ลองอ่านแต่ละปีเป็น "บท" หนึ่ง ไม่ใช่คำทำนายตายตัว แล้ววางแผนเรื่องใหญ่ให้ตรงกับจังหวะของมัน`, `This decade opens in 2026 at Personal Year ${py2026} (${meaningOf(py2026)}), then moves through numerology's 9-year energy cycle layered over your Nine Star Ki annual stars. The peak of the cycle is ${peak} (PY8 — the harvest year), while the years to steady yourself are ${caution.join(', ')}. Read each year as a "chapter," not a fixed prophecy, and time your big moves to match its rhythm.`);
    const yearGuide = years.map(y => {
        const py = pyOf(y);
        const d = PY_DEEP[py];
        const edge = py === 1 || py === 8 || py === 3 ? '#1a8a3a' : py === 4 || py === 7 ? '#c01020' : '#d4aa50';
        return `<div style="border-left:3px solid ${edge};padding:3px 0 6px 10px;margin:6px 0">
      <div style="font-size:12px"><strong style="color:#d4aa50">${y}</strong> · ${icon(py)} PY${py} ${meaningOf(py)}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.6;margin-top:2px">${d.focus} <span style="color:#90e0a0">→ ${d.act}</span></div>
    </div>`;
    }).join('');
    return section(23, tr('พยากรณ์ 10 ปี 2026–2035', '10-Year Forecast · 2026–2035'), '🔭', `
    <p style="font-size:12.5px;color:#c8c0a8;line-height:1.75;margin-bottom:10px">${arc}</p>
    <table>
      <thead><tr><th>${tr('ปี', 'Year')}</th><th>PY</th><th>NSK</th><th>${tr('แนวโน้ม', 'Trend')}</th></tr></thead>
      <tbody>
        ${years.map(y => {
        const py = pyOf(y);
        const nsk = nskOf(y);
        return `<tr>
            <td style="font-weight:600">${y}</td>
            <td style="color:#d4aa50">PY ${py}</td>
            <td style="font-size:11px;color:#9a8a72">Star ${nsk}</td>
            <td>${icon(py)} ${meaningOf(py)}</td>
          </tr>`;
    }).join('')}
      </tbody>
    </table>
    <p style="font-size:11px;color:#6a5a42;margin-top:8px">PY = Personal Year | 🟢 ${tr('ดี', 'Good')} 🟡 ${tr('ปานกลาง', 'Mixed')} 🔴 ${tr('ระวัง', 'Caution')}</p>
    <div style="font-size:13px;font-weight:700;color:#d4aa50;margin:14px 0 4px">${tr('แต่ละปีลงรายละเอียด', 'Year by year, in depth')}</div>
    ${yearGuide}
    ${box(tr('ช่วงทอง — ลงมือเรื่องใหญ่', 'Golden Window — make your big moves'), tr(`ปี <strong>${golden.slice(0, 3).join(', ')}</strong> คือ Personal Year ที่แรงที่สุดในรอบ 10 ปี (PY1 เริ่มต้น · PY3 ขยาย · PY8 เก็บเกี่ยว) ถ้าจะเปิดตัว ลงทุน เปลี่ยนงาน หรือตัดสินใจครั้งใหญ่ — จัดให้ตรงปีเหล่านี้`, `Years <strong>${golden.slice(0, 3).join(', ')}</strong> are your strongest Personal Years in this window (PY1 to begin · PY3 to expand · PY8 to harvest). If you're going to launch, invest, switch roles, or make a major call — time it to these years.`), 'green')}
    ${box(tr('ปีตั้งหลัก — สร้างและฟื้นฟู', 'Steady years — build and restore'), tr(`ปี <strong>${caution.join(', ')}</strong> ไม่ใช่ปี "แย่" แต่เป็นปีของการวางรากฐาน (PY4) และพักฟื้น (PY7) ผลงานเงียบๆ ของสองช่วงนี้คือสิ่งที่ทำให้ช่วงทองข้างบนเกิดขึ้นจริงได้ อย่าฝืนเร่งผลในปีเหล่านี้`, `Years <strong>${caution.join(', ')}</strong> are not "bad" years — they're for laying foundations (PY4) and recovering (PY7). The quiet work of these phases is exactly what makes the golden years above possible. Don't force fast results here.`), 'dark')}
  `);
}
function p24_pets(c) {
    const dmEl = c.bazi.dayMasterElement;
    const missingEl = c.bazi.missingElement || '—';
    // SINGLE SOURCE OF TRUTH: pet content comes from chart.addons.pet (calc.ts
    // calcAddons), the EXACT same data the Pet add-on tab renders. Previously
    // this page kept its own parallel petMap, so the premium report and the
    // add-on tab showed DIFFERENT animals for the same chart. Now they're
    // identical. Spirit creature continues to use chart.addons.companions.
    const pet = c.addons?.pet || null;
    const companions = c.addons?.companions || null;
    const isTh = _lang !== 'en';
    // Build the main + secondary pet cards from the addon shape.
    const petCard = (emoji, animalLabel, why, story, badge) => `
    <div style="border:1px solid #2a2010;border-radius:8px;padding:12px;margin:8px 0;display:flex;gap:12px">
      <span style="font-size:28px;flex-shrink:0">${emoji}</span>
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px">
          <div style="font-weight:600;color:#d4aa50;font-size:13px">${esc(animalLabel)}</div>
          ${badge ? `<div style="font-size:10px;color:#8a7040;background:#1e1a0e;padding:2px 8px;border-radius:10px">${esc(badge)}</div>` : ''}
        </div>
        <div style="font-size:11.5px;color:#c8c0a8;margin-top:4px;line-height:1.6">${esc(why)}</div>
        ${story ? `<div style="font-size:11px;color:#9a8a72;margin-top:6px;line-height:1.6;font-style:italic">${esc(story)}</div>` : ''}
      </div>
    </div>`;
    // Split "🐟 ปลาในตู้ Betta / Koi" → [emoji, label]. Only treat the leading
    // token as an emoji when it's an Extended_Pictographic grapheme (so a plain
    // ASCII letter is NOT mistaken for an icon); otherwise no emoji.
    const splitAnimal = (s) => {
        const t = (s || '').trim();
        const m = t.match(/^(\p{Extended_Pictographic}(?:‍\p{Extended_Pictographic})*)\s*(.*)$/u);
        return m ? [m[1], (m[2] || '').trim() || t] : ['🐾', t];
    };
    // ALWAYS source from pet.main — calcAddons swaps the whole object by language,
    // so pet.main is already "🐟 Fish in a tank — Betta / Koi" in EN and
    // "🐟 ปลาในตู้ Betta / Koi" in TH (emoji-prefixed in both). pet.mainEn has NO
    // emoji + an abbreviated breed list → feeding it to splitAnimal beheaded the
    // first letter as a fake icon ("og — Shiba / Golden"). Using pet.main makes
    // the report byte-identical to the Pet add-on tab in both languages.
    const [mainEmoji, mainLabel] = splitAnimal(pet?.main || '');
    const [secEmoji, secLabel] = splitAnimal(pet?.secondary || '');
    const petBlock = pet ? `
    <h2>${tr('สัตว์เลี้ยงที่แนะนำ', 'Recommended Pets')}</h2>
    ${petCard(mainEmoji, mainLabel, pet.why || '', pet.story || '', tr('ตัวเลือกหลัก', 'Primary'))}
    ${pet.secondary ? petCard(secEmoji, secLabel, pet.secWhy || '', pet.secStory || '', tr('ตัวเลือกรอง', 'Secondary')) : ''}
    <div class="grid-3" style="margin-top:10px">
      ${pet.colors ? `<div class="stat-card"><div class="lbl">${tr('สีเสริมพลัง', 'Lucky colours')}</div><div style="font-size:12px;color:#d4aa50;margin-top:3px">${esc(pet.colors)}</div></div>` : ''}
      ${pet.timing ? `<div class="stat-card"><div class="lbl">${tr('ช่วงรับมาเลี้ยง', 'Best timing')}</div><div style="font-size:12px;color:#d4aa50;margin-top:3px">${esc(pet.timing)}</div></div>` : ''}
      ${pet.care ? `<div class="stat-card"><div class="lbl">${tr('เคล็ดดูแล', 'Care tip')}</div><div style="font-size:11px;color:#c8c0a8;margin-top:3px">${esc(pet.care)}</div></div>` : ''}
    </div>
    ${pet.avoid ? box(tr('สัตว์ที่ควรเลี่ยง', 'Animal to avoid'), esc(pet.avoid), 'red') : ''}
  ` : tr('<p>ข้อมูลสัตว์เลี้ยงไม่พร้อมใช้งาน</p>', '<p>Pet data unavailable.</p>');
    return section(24, tr('สัตว์เลี้ยง & สัตว์ในตำนาน — ตามธาตุของคุณ', 'Pets & Mythological Creatures — by Your Element'), '🐾', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('ที่มาของคำแนะนำ', 'Source of these suggestions')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">
        ${tr(`สัตว์ถูกจับคู่กับธาตุใน <strong>5-element cycle</strong> ของจีนโบราณ — สัตว์ที่เสริม Day Master ของคุณคือสัตว์ที่พลังงานจะ "ทำงานให้" คุณทุกวัน · <strong>ตรงกับแท็บ สัตว์เลี้ยง ในแอป</strong>`, `Each animal is matched to an element in the ancient Chinese <strong>5-element cycle</strong> — animals reinforcing your Day Master work for you every day. <strong>Identical to the Pet add-on tab in the app.</strong>`)}<br>
        ${tr(`Day Master ของคุณ: <strong>${esc(c.bazi.dayMasterTh)} (ธาตุ${esc(dmEl)})</strong> · ธาตุที่ขาด: <strong>${esc(missingEl)}</strong>`, `Your Day Master: <strong>${esc(c.bazi.dayMasterTh)} (${esc(dmEl)} element)</strong> · Missing element: <strong>${esc(missingEl)}</strong>`)}
      </div>
    </div>

    <!-- Spirit Creature (mythological) — shared with the Companions add-on tab -->
    ${companions ? `
    <div style="border:2px solid #c8a840;background:linear-gradient(135deg,#1e1a0e,#14120a);border-radius:10px;padding:14px 16px;margin:8px 0 16px">
      <div style="font-size:10px;letter-spacing:2px;color:#c8a840;margin-bottom:6px">${tr(`✦ สัตว์ในตำนานประจำธาตุ${esc(dmEl)} ✦`, `✦ Mythological Companion for the ${esc(dmEl)} Element ✦`)}</div>
      <div style="font-family:'Cinzel Decorative',serif;font-size:17px;color:#d4aa50;margin-bottom:6px">${esc(companions.creature || '')}</div>
      <div style="font-size:12px;color:#c8c0a8;line-height:1.7">${esc(companions.creatureDesc || '')}</div>
      ${companions.mantra ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #3a3020;font-size:11px;color:#c8a840;font-style:italic">🔔 ${esc(companions.mantra)}</div>` : ''}
    </div>` : ''}

    ${petBlock}
  `);
}
// Divine Mirror — included in the Full Report per PRICING. Sourced from
// chart.addons.mirror (SAME data the Divine Mirror add-on tab renders), so the
// premium report and the add-on are guaranteed identical. 4 deity archetypes
// (primary/secondary/tertiary) + the shadow archetype + cosmic entity + mantra.
function p_divineMirror(c) {
    const m = c.addons?.mirror || null;
    const dmEl = c.bazi.dayMasterElement;
    if (!m)
        return section(0, tr('Divine Mirror — เทพกระจกสะท้อนตัวตน', 'Divine Mirror — Deities That Reflect You'), '🪞', tr('<p>ข้อมูลกระจกเทพไม่พร้อมใช้งาน</p>', '<p>Divine Mirror data unavailable.</p>'));
    const archetype = (label, name, desc, story, color = '#d4aa50') => name ? `
    <div style="border:1px solid #2a2010;border-left:3px solid ${color};border-radius:6px;padding:12px 14px;margin:8px 0">
      <div style="font-size:9px;letter-spacing:2px;color:${color};margin-bottom:4px">${esc(label)}</div>
      <div style="font-family:'Cinzel Decorative',serif;font-size:15px;color:#d4aa50;margin-bottom:4px">${esc(name)}</div>
      ${desc ? `<div style="font-size:12px;color:#c8c0a8;line-height:1.6">${esc(desc)}</div>` : ''}
      ${story ? `<div style="font-size:11px;color:#9a8a72;line-height:1.6;margin-top:6px;font-style:italic">${esc(story)}</div>` : ''}
    </div>` : '';
    return section(0, tr('Divine Mirror — เทพกระจกสะท้อนตัวตน', 'Divine Mirror — Deities That Reflect You'), '🪞', `
    <div style="background:#1a1510;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#c8a840;font-weight:600;margin-bottom:6px;font-size:12px">${tr('กระจกเทพคืออะไร', 'What the Divine Mirror is')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.75">${tr(`เทพ 4 องค์จากหลายอารยธรรมที่ "สะท้อน" พลังงานธาตุ<strong>${esc(dmEl)}</strong>ของคุณ — ไม่ใช่เทพที่คุณบูชา แต่คือกระจกที่ทำให้เห็นตัวตนเมื่อมองอย่างซื่อสัตย์ รวมถึง <strong>เงา (shadow)</strong> ที่เป็นด้านเดียวกันเมื่อพลังงานเสียสมดุล · <strong>ตรงกับแท็บ Divine Mirror ในแอป</strong>`, `Four deities across civilisations that "mirror" your <strong>${esc(dmEl)}</strong>-element energy — not gods you worship, but reflections that reveal who you are when you look honestly, including the <strong>shadow</strong> archetype — the same energy gone out of balance. <strong>Identical to the Divine Mirror add-on tab.</strong>`)}</div>
    </div>

    ${m.cosmic && m.cosmic.name ? `<div style="text-align:center;margin-bottom:14px">
      <div style="font-size:10px;letter-spacing:3px;color:#c8a840">${tr('✦ สัญลักษณ์จักรวาลของคุณ ✦', '✦ YOUR COSMIC ENTITY ✦')}</div>
      <div style="font-family:'Cinzel Decorative',serif;font-size:18px;color:#f0d060;margin-top:4px">${esc(m.cosmic.name)}</div>
      ${m.cosmic.desc ? `<div style="font-size:11.5px;color:#c8c0a8;margin-top:4px;line-height:1.6">${esc(m.cosmic.desc)}</div>` : ''}
    </div>` : ''}

    ${archetype(tr('เทพหลัก — ตัวตนที่ฉายออก', 'PRIMARY — your projected self'), m.primary, m.primaryDesc, m.primaryStory, '#d4aa50')}
    ${archetype(tr('เทพรอง — แรงขับเคลื่อน', 'SECONDARY — your driving force'), m.secondary, m.secondaryDesc, m.secondaryStory, '#c8a840')}
    ${archetype(tr('เทพที่สาม — มิติที่ซ่อน', 'TERTIARY — your hidden dimension'), m.tertiary, m.tertiaryDesc, m.tertiaryStory, '#a89060')}
    ${archetype(tr('เงา — พลังงานเดียวกันที่เสียสมดุล', 'SHADOW — the same energy imbalanced'), m.shadow, m.shadowDesc, m.shadowStory, '#a05050')}

    ${m.mantra ? box(tr('มนตราของกระจก', 'Mirror mantra'), `<span style="font-style:italic">🔔 ${esc(m.mantra)}</span>`, 'gold') : ''}
  `);
}
function p25_summary(c) {
    const { score, bazi, numerology, ninestar, western } = c;
    const dmEl = bazi.dayMasterElement;
    const closingMsg = tr(`คุณคือ "<strong style="color:#d4aa50">${esc(score.cosmicEntity)}</strong>" — พลังของธาตุ${esc(dmEl)} ที่เดินอยู่บน Life Path ${esc(String(numerology.lifePath))} (${esc(numerology.lifePathName)}) ทั้ง 26 ศาสตร์ต่างมองคุณจากคนละมุม แต่ฉายภาพเดียวกันออกมา · ดวงชะตาไม่ใช่โชคที่ตายตัว มันคือแผนที่พลังงานที่ช่วยให้คุณรู้จักตัวเองและเลือกทางได้ฉลาดขึ้น · จุดแข็งทุกข้อในรายงานนี้จะเปล่งประกายก็ต่อเมื่อคุณกล้าหยิบมันมาใช้จริง — จงเดินต่อไปด้วยความมั่นใจ`, `You are "<strong style="color:#d4aa50">${esc(score.cosmicEntity)}</strong>" — the force of the ${esc(dmEl)} element walking Life Path ${esc(String(numerology.lifePath))} (${esc(numerology.lifePathName)}). All 26 systems look at you from different angles yet project the same image. Your chart is not a fixed fate — it is an energy map that helps you know yourself and choose your path with more wisdom. Every strength named in this report only shines once you dare to actually use it. Walk forward with confidence.`);
    return section(25, tr('สรุปภาพรวมและคำส่งท้าย', 'Final Summary & Closing Reflection'), '✨', `
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:48px;font-weight:700;color:#d4aa50">${score.cosmicFinal}</div>
      <div style="font-size:16px;color:#f0e8d0;margin-top:4px">${esc(_lang === 'en' ? (score.tierEn || score.tier) : score.tier)}</div>
      <div style="font-size:12px;color:#9a8a72">${esc(score.percentile)} ${tr('ของโลก', 'globally')}</div>
    </div>

    ${box(tr('จุดแข็งหลัก', 'Core Strengths'), [
        `• ${tr(`ธาตุ${esc(bazi.dayMasterElement)} Day Master ${esc(bazi.dayStem)}`, `${esc(bazi.dayMasterElement)} element · Day Master ${esc(bazi.dayStem)}`)} — ${esc(stripHtml(bazi.reading).substring(0, 60))}…`,
        `• ${esc(ninestar.starChinese)} — ${esc(stripHtml(ninestar.reading).substring(0, 50))}…`,
        `• Life Path ${esc(numerology.lifePath)} — ${esc(numerology.lifePathName)}`,
    ].join('<br>'), 'gold')}

    ${box(tr('ความท้าทายหลัก', 'Core Challenges'), [
        `• ${tr('ธาตุที่ขาด', 'Missing element')}: ${bazi.missingElement || tr('ครบ', 'none')} — ${tr('ต้องเสริมจากภายนอก', 'supplement from external sources')}`,
        `• ${tr('หลีกเลี่ยงธาตุ', 'Element to avoid')}: ${bazi.avoidElement}`,
        `• ${tr('กลยุทธ์', 'Strategy')}: "${c.humandesign.strategy}" — ${tr('ฝืนสิ่งนี้คือเหนื่อยเปล่า', 'fighting this is wasted effort')}`,
    ].join('<br>'), 'dark')}

    ${box(tr('ช่วงทองในชีวิต', 'Golden Window'), tr(`Luck Pillar ${bazi.currentLuckPillar} (${bazi.currentLuckPillarTh}) + Personal Year 2026: ${numerology.personalYear2026} + NSK Star ${ninestar.star} → ช่วงนี้เป็นหนึ่งในช่วงที่สำคัญที่สุดในชีวิตคุณ`, `Luck Pillar ${bazi.currentLuckPillar} (${bazi.currentLuckPillarTh}) + Personal Year 2026: ${numerology.personalYear2026} + NSK Star ${ninestar.star} → this is one of the most consequential phases of your life.`), 'green')}

    <div style="text-align:center;margin:24px 0;padding:20px;background:#1a1510;border:1px solid #3a3020;border-radius:12px">
      <div style="font-size:14px;color:#d4aa50;font-weight:600;margin-bottom:8px">✦ ${tr('คำส่งท้าย', 'Closing')} ✦</div>
      <div style="font-size:13px;color:#c8c0a8;line-height:1.9;text-align:left">${closingMsg}</div>
    </div>

    <div style="font-size:11px;color:#6a5a42;text-align:center;border-top:1px solid #2a2010;padding-top:12px;line-height:1.8">
      ${tr('รายงานนี้สร้างโดย AI โดยนำ 26 ศาสตร์โบราณมาวิเคราะห์หาจุดร่วม', 'This report is AI-generated, synthesising 26 ancient systems for points of consensus.')}<br>
      ${tr('เพื่อความบันเทิงและการสำรวจตนเอง ไม่ใช่คำแนะนำวิชาชีพด้านการแพทย์ กฎหมาย หรือการเงิน', 'For entertainment and self-exploration only — not medical, legal, or financial advice.')}<br>
      © Mythsensus · mythsensus.com
    </div>
  `);
}
// ── MAIN EXPORT ──────────────────────────────────────────────
function generateReport(c) {
    _pageNum = 0; // reset counter for each report
    // Propagate chart language to module-local _lang + the buildRichReading
    // module in calc.ts so page headers + meta labels respect user choice.
    _lang = (c.input && c.input.lang === 'en') ? 'en' : 'th';
    (0, calc_1._setReportLang)(_lang);
    const pages = [
        // ─── 1-4: Front matter ───────────────────────────────────────
        p01_cover, // 1. ปก + Cosmic Score + 3-score preview
        p_threeScores, // 2. Soul Frequency (petroleum) deep dive
        p02_scoreBreakdown, // 3. 26-system consensus (🌟〰⚠ grouped)
        p03_convergence, // 4. Grand Convergence (8 themes × 26 systems)
        // ─── 5-9: Born Chart deep-dive (5 systems) ───────────────────
        p05_bazi, // 5. BaZi สี่เสา
        p06_ninestar, // 6. Nine Star Ki
        p04_western, // 7. Western Astrology
        p07_vedic, // 8. Vedic Jyotish
        p12_numerology, // 9. Numerology (LP + Thai7)
        // ─── 10-13: Original 4 systems ───────────────────────────────
        p08_energyType, // 10. Energy Type System
        p09_mayan, // 11. Mayan Tzolk'in
        p10_celtic, // 12. Celtic Tree
        p11_thai, // 13. Thai Brahmin
        // ─── 14-29: 16 New Systems (each own page) ───────────────────
        p_saju, // 14. Saju (Korean)
        p_tibetan, // 15. Tibetan Mewa & Parkha
        p_ziwei, // 16. Zi Wei Dou Shu
        p_onmyodo, // 17. Onmyōdō
        p_hellenistic, // 18. Hellenistic Astrology
        p_norseRune, // 19. Norse Rune
        p_ogham, // 20. Ogham
        p_arabicParts, // 21. Arabic Parts
        p_kabbalistic, // 22. Kabbalistic
        p_zoroastrian, // 23. Zoroastrian
        p_aztec, // 24. Aztec Tonalpohualli
        p_nativeAmerican, // 25. Native American Totem
        p_ifaYoruba, // 26. Ifa/Yoruba
        p_aboriginal, // 27. Aboriginal Dreamtime
        p_biorhythm, // 28. Biorhythm
        p_vedicMahadasha, // 29. Vedic Mahadasha
        // ─── 30-35: Life guidance (multi-system) ─────────────────────
        p13_luckPillars, // 30. 80-Year Path (BaZi+Vedic+NSK+Numerology)
        p19_decade, // 31. Decade by Decade
        p18_monthly2026, // 32. Monthly 2026 (NSK+Biorhythm+PY)
        p23_forecast10yr, // 33. 10-Year Forecast
        p16_activation, // 34. Activation Plan (all 26 systems)
        p17_weekly, // 35. Weekly Plan
        // ─── 36-43: Lifestyle & closing ──────────────────────────────
        p14_health, // 36. Health (multi-system)
        p15_finance, // 37. Finance (multi-system)
        p20_colors, // 38. สีมงคล
        p24_pets, // 39. สัตว์เลี้ยง (now shares chart.addons.pet with the add-on tab)
        p_divineMirror, // 40. Divine Mirror (chart.addons.mirror — same as add-on tab)
        p21_historicalFigures, // 41. Historical Figures
        p22_painPoints, // 42. 5 Pain Points
        p25_summary, // 43. Summary + Disclaimer
    ].map(fn => fn(c)).join('\n');
    return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cosmic Blueprint — ${esc(c.input.name)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
${pages}
</body>
</html>`;
}
/** Extract structured signals from all 26 systems for a given topic */
function extractSignals(c, topic) {
    const { bazi, western, ninestar, vedic, humandesign, mayan, celtic, thai, numerology, saju, tibetan, ziwei, onmyodo, hellenistic, norseRune, ogham, arabicParts, kabbalistic, zoroastrian, aztec, nativeAmerican, ifaYoruba, aboriginal, biorhythm, vedicMahadasha } = c;
    const all = [];
    const EL_MAP = { 'ไม้': 'Wood', 'ไฟ': 'Fire', 'ดิน': 'Earth', 'โลหะ': 'Metal', 'น้ำ': 'Water' };
    const SHENG = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
    const dmEl = bazi.dayMasterElement;
    if (topic === 'element') {
        all.push({ system: 'BaZi', score: bazi.score, finding: `Day Master ${bazi.dayMasterTh} ธาตุ${dmEl}`, category: 'element', value: dmEl }, { system: 'Nine Star Ki', score: ninestar.score, finding: `Star ${ninestar.star} ธาตุ${ninestar.starElement}`, category: 'element', value: ninestar.starElement }, { system: 'Western', score: western.score, finding: `Sun ${western.sunSignTh}`, category: 'element', value: western.sunSignTh }, { system: 'Vedic', score: vedic.score, finding: `Nakshatra ${vedic.moonNakshatra}`, category: 'element', value: vedic.moonNakshatra.split(' ')[0] }, { system: 'Celtic', score: celtic.score, finding: `${celtic.treeNameTh} ธาตุ${celtic.element}`, category: 'element', value: celtic.element }, { system: 'Tibetan', score: tibetan.score, finding: `Mewa ${tibetan.mewa} ธาตุ${tibetan.mewaElement}`, category: 'element', value: tibetan.mewaElement }, { system: 'Zoroastrian', score: zoroastrian.score, finding: `${zoroastrian.dayYazataTh}`, category: 'element', value: zoroastrian.dayYazataTh });
    }
    if (topic === 'health') {
        const healthEl = bazi.missingElement.split(' ')[0] || 'ดิน';
        all.push({ system: 'BaZi', score: bazi.score, finding: tr(`ธาตุขาด ${bazi.missingElement} ควรเสริมผ่านสีและอาหาร`, `Missing ${bazi.missingElement} element — reinforce via colour and food`), category: 'health', value: healthEl }, { system: 'Nine Star Ki', score: ninestar.score, finding: tr(`ทิศนอน ${ninestar.directionSleep} เสริมสุขภาพ`, `Sleep direction ${ninestar.directionSleep} supports health`), category: 'health', value: ninestar.directionSleep }, { system: 'Vedic', score: vedic.score, finding: `${vedic.mahadasha} Dasha: ${vedicMahadasha.dashaQuality}`, category: 'health', value: vedicMahadasha.dashaElement }, { system: 'Biorhythm', score: biorhythm.score, finding: `Physical ${biorhythm.physical}% (${biorhythm.physicalPhase})`, category: 'health', value: biorhythm.physicalPhase }, { system: 'Celtic', score: celtic.score, finding: tr(`ต้น${celtic.treeNameTh} — gem ${celtic.gemstone}`, `${celtic.treeName} — gem ${celtic.gemstone}`), category: 'health', value: celtic.gemstone }, { system: 'Energy Type', score: humandesign.score, finding: tr(`Strategy "${humandesign.strategy}" ลดการต้านพลังงาน`, `Strategy "${humandesign.strategy}" reduces energetic resistance`), category: 'health', value: humandesign.strategy }, { system: 'Native American', score: nativeAmerican.score, finding: tr(`${nativeAmerican.birthTotemTh} ธาตุ${nativeAmerican.element}`, `${nativeAmerican.birthTotem} (${nativeAmerican.element} element)`), category: 'health', value: nativeAmerican.element }, { system: 'Tibetan', score: tibetan.score, finding: tr(`Mewa ${tibetan.mewa} ธาตุ${tibetan.mewaElement}`, `Mewa ${tibetan.mewa} (${tibetan.mewaElement} element)`), category: 'health', value: tibetan.mewaElement }, { system: tr('ไทยพราหมณ์', 'Thai Brahmin'), score: thai.score, finding: tr(`สีมงคล${thai.dayColor} วัน${thai.dayName}`, `Lucky colour ${thai.dayColor} on ${thai.dayName}`), category: 'health', value: thai.dayColor }, { system: 'Zoroastrian', score: zoroastrian.score, finding: tr(`${zoroastrian.dayYazataTh} ปกครองสุขภาพ`, `${zoroastrian.dayYazataTh} rules health`), category: 'health', value: tr(zoroastrian.harmony ? 'สมดุล' : 'ต้องสร้างสมดุล', zoroastrian.harmony ? 'balanced' : 'needs balance') });
    }
    if (topic === 'finance') {
        all.push({ system: 'BaZi', score: bazi.score, finding: tr(`ธาตุมงคล ${bazi.luckyElement}`, `Lucky element ${bazi.luckyElement}`), category: 'finance', value: bazi.luckyElement }, { system: 'Nine Star Ki', score: ninestar.score, finding: tr(`ทิศ ${ninestar.starDirection} เสริมการเงิน`, `Direction ${ninestar.starDirection} supports finance`), category: 'finance', value: ninestar.starDirection }, { system: 'Numerology', score: numerology.score, finding: `Personal Year ${numerology.personalYear2026}: ${numerology.personalYearMeaning.split('—')[0]}`, category: 'finance', value: String(numerology.personalYear2026) }, { system: 'Vedic', score: vedic.score, finding: `${vedicMahadasha.currentDasha} Dasha`, category: 'finance', value: vedicMahadasha.dashaElement }, { system: 'Arabic Parts', score: arabicParts.score, finding: tr(`Part of Fortune ใน ${arabicParts.fortuneSign}`, `Part of Fortune in ${arabicParts.fortuneSign}`), category: 'finance', value: arabicParts.fortuneSign }, { system: 'Hellenistic', score: hellenistic.score, finding: tr(`${hellenistic.sectTh} กับ ${hellenistic.trigonLord}`, `${hellenistic.sectTh} with ${hellenistic.trigonLord}`), category: 'finance', value: hellenistic.trigonLord.split(' ')[0] }, { system: 'Kabbalistic', score: kabbalistic.score, finding: `${kabbalistic.sephira} (${kabbalistic.archangel})`, category: 'finance', value: kabbalistic.sephira }, { system: 'Ifa/Yoruba', score: ifaYoruba.score, finding: `Odù ${ifaYoruba.odu}: ${ifaYoruba.fortune}`, category: 'finance', value: ifaYoruba.fortune }, { system: 'Zoroastrian', score: zoroastrian.score, finding: `${zoroastrian.dayYazataTh}`, category: 'finance', value: tr(zoroastrian.harmony ? 'สอดคล้อง' : 'ระวัง', zoroastrian.harmony ? 'aligned' : 'caution') }, { system: 'Biorhythm', score: biorhythm.score, finding: tr(`สติปัญญา ${biorhythm.intellectual}% (${biorhythm.intellectualPhase})`, `Intellect ${biorhythm.intellectual}% (${biorhythm.intellectualPhase})`), category: 'finance', value: biorhythm.intellectualPhase });
    }
    if (topic === 'timing') {
        all.push({ system: 'BaZi', score: bazi.score, finding: `LP ${bazi.currentLuckPillar} ${bazi.currentLuckPillarTh}`, category: 'timing', value: bazi.currentLuckPillar }, { system: 'Nine Star Ki', score: ninestar.score, finding: ninestar.year2026Analysis.substring(0, 60), category: 'timing', value: ninestar.star === 9 ? 'peak' : 'normal' }, { system: 'Vedic', score: vedic.score, finding: tr(`${vedicMahadasha.currentDasha} Dasha ถึง ${vedicMahadasha.currentDashaEnd}`, `${vedicMahadasha.currentDasha} Dasha until ${vedicMahadasha.currentDashaEnd}`), category: 'timing', value: String(vedicMahadasha.currentDashaEnd) }, { system: 'Numerology', score: numerology.score, finding: `PY ${numerology.personalYear2026}: ${numerology.personalYearMeaning.substring(0, 40)}`, category: 'timing', value: String(numerology.personalYear2026) }, { system: 'Biorhythm', score: biorhythm.score, finding: `E:${biorhythm.emotional}% I:${biorhythm.intellectual}% P:${biorhythm.physical}%`, category: 'timing', value: biorhythm.intellectualPhase }, { system: 'Tibetan', score: tibetan.score, finding: `Mewa ${tibetan.mewa} ${tibetan.mewaQuality}`, category: 'timing', value: tibetan.mewaQuality }, { system: 'Onmyōdō', score: onmyodo.score, finding: `${onmyodo.rokuyo} ${onmyodo.rokuyoTh}`, category: 'timing', value: onmyodo.rokuyo }, { system: 'Aztec', score: aztec.score, finding: `${aztec.daySignTh} Tone ${aztec.toneNumber}`, category: 'timing', value: aztec.daySignQuality });
    }
    return all;
}
/** Render a consensus row: icon + count + systems + message */
function consensusRow(icon, theme, systems, msg, count, color = '#d4aa50', narrative = '') {
    const strength = count >= 10 ? '██████' : count >= 7 ? '████' : count >= 4 ? '██' : '█';
    // Show ALL systems as chips — no truncation
    const chips = systems.map(s => {
        // Translate any embedded Thai data fields in the chip label.
        // System labels are constructed like 'Tibetan Mewa 5' or 'Aboriginal งูรุ้ง'
        // — split-and-translate on whitespace so Thai tokens get hit by trDF.
        const label = s.split('(')[0].trim().split(/\s+/).map(tok => trDF(tok)).join(' ');
        return `<span style="display:inline-block;background:${color}18;color:${color};border:1px solid ${color}44;border-radius:4px;padding:1px 7px;font-size:10px;margin:2px">${esc(label)}</span>`;
    }).join('');
    return `<div style="border-left:3px solid ${color};padding:10px 14px;margin:10px 0;background:#141210;border-radius:0 8px 8px 0">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span style="font-size:14px;font-weight:700;color:${color}">${icon} ${esc(theme)}</span>
      <span style="font-size:11px;color:${color};background:${color}22;padding:2px 10px;border-radius:10px;font-weight:600">${count} ${tr('ศาสตร์', 'systems')} ${strength}</span>
    </div>
    <div style="margin-bottom:6px;line-height:1.8">${chips}</div>
    ${narrative ? `<div style="font-size:12px;color:#d4c89a;line-height:1.7;margin-bottom:6px;padding:8px;background:#1a1608;border-radius:6px">${esc(narrative)}</div>` : ''}
    <div style="font-size:11px;color:#7a6a52">${esc(msg)}</div>
  </div>`;
}
// ============================================================
// ── 16 NEW SYSTEM PAGES (individual, consistent format) ─────
// ============================================================
function p_saju(c) {
    const s = c.saju;
    return section(0, tr('Saju — สี่เสาเกาหลี (사주)', 'Saju (사주) — Korean Four-Pillar Astrology'), '🇰🇷', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:20px">${esc(s.dayPillar)}</div><div class="lbl">일주 Day Pillar</div></div>
      <div class="stat-card"><div class="val">${s.score}</div><div class="lbl">Saju Score</div></div>
    </div>
    ${bar(s.score, '#4a8a40')}
    <table style="margin:12px 0"><tbody>
      ${row2('연주 Year', s.yearPillar)} ${row2('월주 Month', s.monthPillar)}
      ${row2('일주 Day', s.dayPillar)} ${row2('시주 Hour', s.hourPillar)}
      ${row2('일간 Day Master Element', s.sajuElement)}
      ${row2('꽃살 Fortune Cycle 2026', s.kwarsal)}
      ${row2(tr('พลังงานหลัก', 'Dominant Energy'), s.dominantEnergy)}
    </tbody></table>
    ${box(tr('การตีความ Saju', 'Saju Reading'), s.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Saju (사주) คือโหราศาสตร์เกาหลีที่ใช้ 4 เสา (ปี เดือน วัน ชั่วโมง) เหมือน BaZi แต่มีการตีความตามประเพณีเกาหลีที่เน้น 월주 (เดือนเกิด) เป็นหลัก มีอายุกว่า 1,000 ปี ยังใช้แพร่หลายในเกาหลีใต้ปัจจุบัน — มีแอปดูดวงหลายร้อยล้าน downloads ต่อปี', 'Saju (사주) is the Korean four-pillar astrology system — Year, Month, Day, Hour pillars, similar to BaZi but with Korean tradition emphasising the 월주 (month pillar) as the core anchor. Over 1,000 years old and still mainstream in South Korea today, with mobile divination apps reaching hundreds of millions of downloads per year.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr('Saju ใช้ระบบเสาสี่เดียวกับ BaZi แต่เน้นการตีความตามประเพณีเกาหลี — ความสัมพันธ์ระหว่างเดือนและวันสำคัญที่สุด', 'Saju shares the four-pillar framework with BaZi but interprets through a Korean lens — the month-day relationship is paramount.')}</p>
  `);
}
function p_tibetan(c) {
    const t = c.tibetan;
    return section(0, tr('Tibetan Astrology — โหราศาสตร์ทิเบต', 'Tibetan Astrology — Mewa & Parkha'), '☸️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val">${t.mewa}</div><div class="lbl">${tr('Mewa (ดาวเก้าช่อง)', 'Mewa (Nine-Square)')}</div></div>
      <div class="stat-card"><div class="val">${t.score}</div><div class="lbl">Tibetan Score</div></div>
    </div>
    ${bar(t.score, '#8a5a4a')}
    <table style="margin:12px 0"><tbody>
      ${row2('Mewa', t.mewaName)} ${row2(tr('ธาตุ Mewa', 'Mewa Element'), t.mewaElement)}
      ${row2(tr('คุณภาพ Mewa', 'Mewa Quality'), t.mewaQuality)}
      ${row2(tr('Parkha (ตรีศูล)', 'Parkha (Trigram)'), t.parkhaName)} ${row2(tr('ธาตุ Parkha', 'Parkha Element'), t.parkhaElement)}
    </tbody></table>
    ${box(tr('การตีความทิเบต', 'Tibetan Reading'), t.reading, 'purple')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('โหราศาสตร์ทิเบตผสมระบบ Mewa จากจีน + Parkha จาก Ba Gua + ประเพณีดั้งเดิม Bon + Vedic Jyotish เข้าด้วยกัน พัฒนาในทิเบตกว่า 1,500 ปี ยังใช้อย่างเป็นทางการในวัดทิเบตและโดย Dalai Lama สถาบัน — เน้น Mewa 9 ดวงเป็นแกนหลัก', 'Tibetan astrology fuses the Chinese Mewa system + Ba Gua\'s Parkha trigrams + indigenous Bön tradition + Vedic Jyotish into a single synthesis. Developed in Tibet over 1,500 years and still officially used in Tibetan monasteries and the Dalai Lama\'s institutions — Mewa\'s nine squares are the central axis.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Mewa สอดคล้องกับ Nine Star Ki แต่นับทวนเข็ม — Mewa ${t.mewa} หมายถึง${t.mewaQuality}ในชีวิต`, `Mewa parallels Nine Star Ki but counts in reverse — Mewa ${t.mewa} marks "${t.mewaQuality}" energy in your life.`)}</p>
  `);
}
function p_ziwei(c) {
    const z = c.ziwei;
    return section(0, tr('Zi Wei Dou Shu — 紫微斗數', 'Zi Wei Dou Shu (紫微斗數) — Purple Star Astrology'), '🌌', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:20px">${esc(_lang === 'en' ? z.mainStar : z.mainStarTh)}</div><div style="font-size:12px;color:#6a5a42">${esc(_lang === 'en' ? z.mainStarTh : z.mainStar)}</div><div class="lbl">${tr('ดาวหลัก Main Star', 'Main Star')}</div></div>
      <div class="stat-card"><div class="val">${z.score}</div><div class="lbl">Zi Wei Score</div></div>
    </div>
    ${bar(z.score, '#5a3a8a')}
    <table style="margin:12px 0"><tbody>
      ${row2(tr('ดาวหลัก (Thai)', 'Main Star (Thai)'), z.mainStarTh)}
      ${row2(tr('วังชีวิต Life Palace', 'Life Palace (命宮)'), z.lifePalaceName)}
      ${row2(tr('คุณภาพวัง Palace Quality', 'Palace Quality'), z.palaceQuality)}
    </tbody></table>
    ${box(tr('การตีความ 紫微', 'Zi Wei Reading (紫微)'), z.reading, 'purple')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('紫微斗數 (Zi Wei Dou Shu) พัฒนาโดย Chen Tuan นักปราชญ์จีนในสมัย Song Dynasty (~1000 AD) ใช้ดาว 108 ดวงใน 12 palace — ซับซ้อนและแม่นยำกว่า BaZi ในการทำนายเส้นทางอาชีพ นิยมมากในไต้หวัน ฮ่องกง สิงคโปร์ สำหรับการตัดสินใจธุรกิจ', '紫微斗數 (Zi Wei Dou Shu) was developed by the Song-dynasty Chinese sage Chen Tuan (~1000 AD). It maps 108 stars across 12 palaces — more complex and more precise than BaZi for career-path prediction. Especially popular in Taiwan, Hong Kong and Singapore for major business decisions.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`紫微斗數 คือโหราศาสตร์จีนขั้นสูง — วังชีวิต (命宮) เป็นตำแหน่งสำคัญที่สุด ดาว${z.mainStarTh}ชี้นำเส้นทางชีวิต`, `紫微斗數 is high-level Chinese astrology — the Life Palace (命宮) is the central anchor, and ${z.mainStar} (${z.mainStarTh}) guides your life path.`)}</p>
  `);
}
function p_onmyodo(c) {
    const o = c.onmyodo;
    return section(0, tr('Onmyōdō — 陰陽道 ศาสตร์ญี่ปุ่น', 'Onmyōdō (陰陽道) — Japan\'s Way of Yin & Yang'), '⛩️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:22px">${esc(o.rokuyo)}</div><div class="lbl">${tr('六曜 Rokuyo วันเกิด', '六曜 Rokuyo · Birth Day')}</div></div>
      <div class="stat-card"><div class="val">${o.score}</div><div class="lbl">Onmyōdō Score</div></div>
    </div>
    ${bar(o.score, '#6a4a2a')}
    <table style="margin:12px 0"><tbody>
      ${row2('Rokuyo (Thai)', o.rokuyoTh)}
      ${row2(tr('พลังงานคะแนน', 'Energy Score'), String(o.rokuyoScore))}
      ${row2('Onmyo Polarity', o.onmyoPolarity)}
      ${row2('Jūnishi Nakshatra', o.juniShiNakshatra)}
    </tbody></table>
    ${box(tr('การตีความ Onmyōdō', 'Onmyōdō Reading'), o.reading, o.rokuyoScore >= 780 ? 'green' : o.rokuyoScore >= 650 ? 'gold' : 'red')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Onmyōdō (陰陽道) พัฒนาในญี่ปุ่นสมัย Nara (710-794 AD) โดย Abe no Seimei หมอดูในตำนาน รับอิทธิพลจาก Taoist เต๋าและ Chinese Cosmology ผสมกับความเชื่อ Shinto ใช้โดยราชสำนักญี่ปุ่นเป็นเวลาหลายร้อยปี ปัจจุบันยังมีสถาบัน Onmyōdō อย่างเป็นทางการ', 'Onmyōdō (陰陽道) developed in Japan\'s Nara period (710–794 AD), most famously practised by the legendary diviner Abe no Seimei. It blends Taoist metaphysics, Chinese cosmology and native Shinto beliefs. Used by the Japanese Imperial Court for centuries — and still active in formal Onmyōdō institutions today.')}</p>

    <div style="background:#13110e;border:1px solid #3a3020;border-radius:8px;padding:12px 14px;margin-bottom:8px">
      <div style="font-size:11px;color:#d4aa50;letter-spacing:1px;margin-bottom:6px">${tr('六曜 ROKUYO — ปฏิทินมงคล 6 วันของญี่ปุ่น', '六曜 ROKUYO — Japan\'s Six-Day Auspicious Cycle')}</div>
      <div style="font-size:11.5px;color:#c8c0a8;line-height:1.7">
        ${tr('Rokuyo (六曜) เป็นวัฏจักรโชค <strong>6 วันที่หมุนเวียนกัน</strong>ในปฏิทินญี่ปุ่น ใช้เลือก "วันดี" สำหรับงานแต่ง การประกอบธุรกิจ การเดินทาง — ปัจจุบันยังพิมพ์อยู่บนปฏิทินญี่ปุ่นทุกเล่ม แต่ละวันให้พลังงานต่างกัน:', 'Rokuyo (六曜) is a <strong>six-day cycle</strong> in the Japanese calendar used to choose auspicious days for weddings, business openings, and travel — still printed on every Japanese calendar today. Each of the six days carries a different energy:')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;font-size:10.5px">
        <div style="background:#0a1a0e;border-left:3px solid #5aaa3a;padding:5px 8px"><strong>大安 Taian</strong> · ${tr('วันมงคลที่สุด · ทำได้ทุกอย่าง', 'Most auspicious · all activities favoured')}</div>
        <div style="background:#0a1612;border-left:3px solid #4a8a4a;padding:5px 8px"><strong>友引 Tomobiki</strong> · ${tr('ดี (ยกเว้นงานศพ)', 'Good (avoid funerals)')}</div>
        <div style="background:#1a1510;border-left:3px solid #c8a840;padding:5px 8px"><strong>先勝 Senshō</strong> · ${tr('เช้าดี บ่ายร้าย', 'Morning good, afternoon poor')}</div>
        <div style="background:#1a1510;border-left:3px solid #c8a840;padding:5px 8px"><strong>先負 Senpu</strong> · ${tr('เช้าร้าย บ่ายดี', 'Morning poor, afternoon good')}</div>
        <div style="background:#1a1010;border-left:3px solid #aa6030;padding:5px 8px"><strong>赤口 Shakkō</strong> · ${tr('ระวัง · ดีเฉพาะกลางวัน', 'Caution · only midday is favourable')}</div>
        <div style="background:#1a0a0a;border-left:3px solid #c01020;padding:5px 8px"><strong>仏滅 Butsumetsu</strong> · ${tr('"พระพุทธเจ้าสิ้น" · วันอัปมงคลที่สุด', '"Buddha\'s passing" · most inauspicious')}</div>
      </div>
      <div style="font-size:11px;color:#9a8a72;margin-top:8px;line-height:1.6">
        ${tr(`วันเกิดของคุณตรงกับ <strong style="color:#d4aa50">${esc(o.rokuyo)} (${esc(o.rokuyoTh)})</strong> — ${o.rokuyo === '仏滅' ? 'นี่คือสาเหตุที่คะแนน Onmyōdō ในรายงานต่ำ ไม่ใช่คะแนนคุณภาพชีวิตหรือบุคลิก แต่คือ "พลังงานปฏิทินวันเกิด" เท่านั้น · ในประเพณีญี่ปุ่นวันนี้แปลตรงตัวว่า "พระพุทธเจ้าสิ้น" ถือว่าหลีกเลี่ยงงานสำคัญ — แต่หลายธุรกิจญี่ปุ่นใช้เป็นวันสะท้อนตัวและรีเซ็ต' : o.rokuyo === '大安' ? 'นี่คือวันที่ดีที่สุดในปฏิทิน Rokuyo — คะแนนของคุณสูงเพราะวันเกิดให้พลังงานเปิดทาง' : 'แปลความได้ตามตารางด้านบน · คะแนนสะท้อนพลังงานของวันเกิดเฉพาะในศาสตร์นี้ ไม่ใช่ตัวคุณ'}`, `Your birth day falls on <strong style="color:#d4aa50">${esc(o.rokuyo)} (${esc(o.rokuyoTh)})</strong> — ${o.rokuyo === '仏滅' ? 'this is why your Onmyōdō score in the report is low. It is not a measure of your character or life quality — only the calendrical energy of your birth date. In Japanese tradition this day literally means "Buddha\'s passing" and is avoided for major events — though many Japanese businesses use it as a day for self-reflection and reset.' : o.rokuyo === '大安' ? 'this is the most auspicious day in the Rokuyo calendar — your high score reflects that your birth day carries opening, path-clearing energy.' : 'interpret using the grid above. The score reflects the energy of your birth day within this single tradition, not your inherent self.'}`)}
      </div>
    </div>
    <p style="font-size:11px;color:#6a5a42">${tr('六曜 เป็นเพียง <em>1 ใน 26 ศาสตร์</em>ของรายงาน — ใช้ประกอบมุมมองเรื่องจังหวะ ไม่ใช่คำตัดสินคุณภาพชีวิต', '六曜 is only <em>one of 26 systems</em> in this report — use it as a timing perspective, not a life-quality verdict.')}</p>
  `);
}
function p_hellenistic(c) {
    const h = c.hellenistic;
    return section(0, tr('Hellenistic Astrology — โหราศาสตร์กรีก', 'Hellenistic Astrology — Greek Tradition'), '🏛️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(h.sect)}</div><div class="lbl">${tr('Sect (กลุ่มดาว)', 'Sect (planetary group)')}</div></div>
      <div class="stat-card"><div class="val">${h.score}</div><div class="lbl">Hellenistic Score</div></div>
    </div>
    ${bar(h.score, '#8a7a30')}
    <table style="margin:12px 0"><tbody>
      ${row2('Sect', h.sectTh)}
      ${row2('Trigon Lord', h.trigonLord)}
      ${row2('Lot of Fortune', tr(`${h.lotOfFortune}° ใน ${h.lotSign}`, `${h.lotOfFortune}° in ${h.lotSign}`))}

    </tbody></table>
    ${box(tr('การตีความ Hellenistic', 'Hellenistic Reading'), h.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Hellenistic Astrology พัฒนาโดยชาว Greek ใน Alexandria อียิปต์ (~300-100 ปีก่อน ค.ศ.) รวมระบบ Babylonian Horoscope + Greek Philosophy + Egyptian Lots เข้าด้วยกัน Ptolemy\'s Tetrabiblos เป็นรากฐานของ Western Astrology ทั้งหมด ปัจจุบัน Renaissance กลับมาแรงมากในวงการ Traditional Astrology', 'Hellenistic Astrology was developed by Greeks in Alexandria, Egypt (~300–100 BCE), fusing Babylonian horoscopy, Greek philosophy, and Egyptian Lots. Ptolemy\'s Tetrabiblos is the foundational text for the entire Western tradition. The Traditional Astrology revival has brought it back to prominence in recent decades.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Hellenistic ใช้ Lots (Arabic Parts) + Sect เพื่อดูโชค — Lot of Fortune ใน${h.lotSign}ชี้ทิศทางทรัพย์สิน`, `Hellenistic uses Lots (Arabic Parts) + Sect to read fortune — your Lot of Fortune in ${h.lotSign} marks the direction of material flow.`)}</p>
  `);
}
function p_norseRune(c) {
    const n = c.norseRune;
    return section(0, tr('Norse Rune — รูนนอร์ส', 'Norse Runes — Elder Futhark'), '🔱', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:40px">${esc(n.rune)}</div><div class="lbl">${esc(n.runeName)}</div></div>
      <div class="stat-card"><div class="val">${n.score}</div><div class="lbl">Norse Score</div></div>
    </div>
    ${bar(n.score, '#5a3a5a')}
    <table style="margin:12px 0"><tbody>
      ${row2(tr('รูน (Thai)', 'Rune (Thai)'), n.runeNameTh)}
      ${row2(tr('ธาตุ', 'Element'), n.runeElement)}
      ${row2(tr('คำสำคัญ', 'Keyword'), n.runeKeyword)}
    </tbody></table>
    ${box(tr('การตีความรูน', 'Rune Reading'), n.reading, 'purple')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Elder Futhark 24 Runes ใช้โดยชาว Germanic/Viking ราว 160 ปีก่อน ค.ศ. ถึง 1100 AD — ใช้ทั้งเป็นตัวอักษรและเป็นเครื่องมือ divination Rune casting เป็นหนึ่งใน oldest divination systems ในยุโรปเหนือ ปัจจุบัน Neo-Pagan / Heathen communities ยังใช้อย่างจริงจัง', 'The 24-rune Elder Futhark was used by Germanic and Viking peoples from ~160 BCE to 1100 CE — both as a writing system and as a divination tool. Rune casting is among the oldest divination practices in Northern Europe and remains in serious use among Neo-Pagan and Heathen communities today.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Elder Futhark มี 24 รูน แต่ละรูนครอบคลุม ~15 วัน ในปีแบบ runic calendar — ${n.rune} ${n.runeName} บ่งถึง${n.runeKeyword}`, `The Elder Futhark has 24 runes, each covering ~15 days in the runic calendar — ${n.rune} ${n.runeName} marks the keyword "${n.runeKeyword}".`)}</p>
  `);
}
function p_ogham(c) {
    const o = c.ogham;
    return section(0, tr('Ogham — ตัวอักษรศักดิ์สิทธิ์ไอริช', 'Ogham — Ancient Irish Sacred Alphabet'), '🌿', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:40px">${esc(o.ogham)}</div><div class="lbl">${esc(o.treeName)}</div></div>
      <div class="stat-card"><div class="val">${o.score}</div><div class="lbl">Ogham Score</div></div>
    </div>
    ${bar(o.score, '#3a6a30')}
    <table style="margin:12px 0"><tbody>
      ${row2(tr('ต้นไม้ (Thai)', 'Tree (Thai)'), o.treeNameTh)}
      ${row2(tr('กลุ่ม Ogham', 'Ogham Class'), o.oghamClass)}
      ${row2(tr('ธาตุ', 'Element'), o.element)}
    </tbody></table>
    ${box(tr('การตีความ Ogham', 'Ogham Reading'), o.reading, 'green')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Ogham alphabet มีอายุราว 300-500 AD ค้นพบบนหินในไอร์แลนด์และเวลส์กว่า 400 แผ่น Celtic Druids ใช้เป็นทั้งตัวหนังสือและระบบ tree calendar ความลึกของ Ogham อยู่ที่ Beth-Luis-Nion calendar ที่แต่ละต้นไม้มีความหมายทางจิตวิญญาณ — Robert Graves นำมา popularize อีกครั้งในศตวรรษ 20', 'The Ogham alphabet dates from ~300–500 CE, found inscribed on over 400 stones across Ireland and Wales. Celtic Druids used it both as a writing system and a tree calendar. Ogham\'s depth lies in the Beth-Luis-Nion calendar, where each tree carries a distinct spiritual meaning. Robert Graves repopularised it in the 20th century.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Beth-Luis-Nion calendar มี 13 เดือนต้นไม้ — ${o.ogham} ${o.treeNameTh} (${o.oghamClass}) บ่งถึงพลังงานหลักจากธรรมชาติ`, `The Beth-Luis-Nion calendar has 13 tree months — ${o.ogham} ${o.treeName} (${o.oghamClass}) marks your primary energetic signature from nature.`)}</p>
  `);
}
function p_arabicParts(c) {
    const a = c.arabicParts;
    return section(0, tr('Arabic Parts — ล็อตโชคชะตา', 'Arabic Parts (Lots) — Hellenistic Fortune Points'), '⭐', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(a.fortuneSign)}</div><div class="lbl">Part of Fortune</div></div>
      <div class="stat-card"><div class="val">${a.score}</div><div class="lbl">Arabic Score</div></div>
    </div>
    ${bar(a.score, '#8a5a20')}
    <table style="margin:12px 0"><tbody>
      ${row2('Lot of Fortune', tr(`${a.partOfFortune}° ใน ${a.fortuneSign}`, `${a.partOfFortune}° in ${a.fortuneSign}`))}
      ${row2('Lot of Spirit', tr(`${a.partOfSpirit}° ใน ${a.spiritSign}`, `${a.partOfSpirit}° in ${a.spiritSign}`))}
    </tbody></table>
    ${box(tr('การตีความ Arabic Parts', 'Arabic Parts Reading'), a.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Arabic Parts หรือ Lots of Fortune มีต้นกำเนิดใน Hellenistic Astrology แต่ Arab astrologers ใน Baghdad (~800-1200 AD) เป็นผู้รวบรวมและขยายให้ครบ 97 Lots Albumasar และ al-Qabisi เป็นผู้มีอิทธิพลสูงสุด Arabic Parts ถ่ายทอดมายังยุโรปผ่าน Crusades และ Spanish translation', 'The Arabic Parts (or Lots of Fortune) originated in Hellenistic astrology, but were systematised and expanded to 97 Lots by Arab astrologers in Baghdad (~800–1200 CE). Albumasar and al-Qabisi were the most influential codifiers. The system reached Europe via the Crusades and Spanish translations.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Arabic Lots (Hellenistic Lots) คำนวณจาก ASC + Moon + Sun — Part of Fortune ใน${a.fortuneSign}ชี้ทิศทางโชคลาภทางวัตถุ`, `Arabic Lots (Hellenistic Lots) are calculated from ASC + Moon + Sun — your Part of Fortune in ${a.fortuneSign} marks the direction of material flow.`)}</p>
  `);
}
function p_kabbalistic(c) {
    const k = c.kabbalistic;
    return section(0, tr('Kabbalistic — ต้นไม้แห่งชีวิต', 'Kabbalistic — Tree of Life'), '✡️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(k.sephira)}</div><div class="lbl">Sephira</div></div>
      <div class="stat-card"><div class="val">${k.score}</div><div class="lbl">Kabbalah Score</div></div>
    </div>
    ${bar(k.score, '#6a3a8a')}
    <table style="margin:12px 0"><tbody>
      ${row2('Sephira Hebrew', k.sephiraHebrew)}
      ${row2('Archangel', k.archangel)}
      ${row2('Hebrew Year', String(k.hebrewYear))}
      ${row2('Mazal (Zodiac)', k.mazalTh)}
    </tbody></table>
    ${box(tr('การตีความ Kabbalah', 'Kabbalistic Reading'), k.reading, 'purple')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Kabbalah (קַבָּלָה) มีต้นกำเนิดในยิวโบราณ พัฒนาเต็มรูปแบบใน 12-13 ศตวรรษในสเปนและ Provence Sefer ha-Bahir (1180 AD) และ Sefer ha-Zohar (1290 AD) คือคัมภีร์หลัก Tree of Life มี 10 Sephirot และ 22 paths ตาม Hebrew alphabet ปัจจุบัน Madonna และ Hollywood stars ทำให้ Kabbalah เป็นที่รู้จักทั่วโลก', 'Kabbalah (קַבָּלָה) has ancient Jewish roots, fully developed in 12th–13th-century Spain and Provence. The Sefer ha-Bahir (1180 CE) and Sefer ha-Zohar (1290 CE) are the foundational texts. The Tree of Life has 10 Sephirot connected by 22 paths corresponding to the Hebrew alphabet. Today, popular interest in Kabbalah has grown worldwide through Madonna and other Hollywood practitioners.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Tree of Life มี 10 Sephirot — ${k.sephira} (${k.sephiraHebrew}) ปกครองโดย ${k.archangel} บ่งถึงแง่มุมจิตวิญญาณหลัก`, `The Tree of Life has 10 Sephirot — ${k.sephira} (${k.sephiraHebrew}), governed by ${k.archangel}, marks your primary spiritual aspect.`)}</p>
  `);
}
function p_zoroastrian(c) {
    const z = c.zoroastrian;
    return section(0, tr('Zoroastrian — ปรัชญาเปอร์เซีย', 'Zoroastrian — Persian Philosophy'), '🔥', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:14px">${esc(z.dayYazataTh.slice(0, 15))}</div><div class="lbl">Day Yazata</div></div>
      <div class="stat-card"><div class="val">${z.score}</div><div class="lbl">Zoroastrian Score</div></div>
    </div>
    ${bar(z.score, '#8a4a20')}
    <table style="margin:12px 0"><tbody>
      ${row2(tr('Yazata วันเกิด', 'Birth Yazata'), z.dayYazataTh)}
      ${row2(tr('Amesha เดือนเกิด', 'Birth-Month Amesha'), z.monthAmeshaTh)}
      ${row2(tr('ความสอดคล้อง', 'Harmony'), z.harmony ? tr('✓ ธาตุสอดคล้อง — เสริมพลัง', '✓ Elements aligned — power amplified') : tr('○ ธาตุต่างกัน — สร้างสมดุล', '○ Elements differ — creates balance'))}
    </tbody></table>
    ${box(tr('การตีความ Zoroastrian', 'Zoroastrian Reading'), z.reading, z.harmony ? 'green' : 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Zoroastrianism เป็นหนึ่งในศาสนาที่เก่าแก่ที่สุดในโลก ก่อตั้งโดย Zarathustra (~1500-1000 ปีก่อน ค.ศ.) ในเปอร์เซีย (อิหร่านปัจจุบัน) ระบบ Yazata 30 วัน และ Amesha Spenta 6 เดือน สะท้อนปรัชญา Asha (ความจริง/ความดี) vs Druj (ความเท็จ) — มีอิทธิพลต่อ Judaism, Christianity และ Islam', 'Zoroastrianism is one of the world\'s oldest religions, founded by Zarathustra (~1500–1000 BCE) in Persia (modern Iran). The 30-day Yazata cycle and 6-month Amesha Spenta system reflect the philosophical axis of Asha (truth/order) vs Druj (deception) — and influenced Judaism, Christianity, and Islam.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr('Yazata คือสิ่งศักดิ์สิทธิ์ใน Zoroastrianism — แต่ละวันและเดือนมี Yazata/Amesha ปกครอง', 'Yazatas are the sacred beings in Zoroastrianism — each day and month is governed by a specific Yazata or Amesha Spenta.')}</p>
  `);
}
function p_aztec(c) {
    const a = c.aztec;
    return section(0, tr('Aztec Tonalpohualli — ปฏิทิน 260 วัน', 'Aztec Tonalpohualli — 260-Day Sacred Calendar'), '🦅', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(a.daySignTh)}</div><div class="lbl">Day Sign</div></div>
      <div class="stat-card"><div class="val">${a.score}</div><div class="lbl">Aztec Score</div></div>
    </div>
    ${bar(a.score, '#8a4a10')}
    <table style="margin:12px 0"><tbody>
      ${row2('Day Sign (EN)', a.daySign + ' ' + a.daySignTh)}
      ${row2('Tone Number', `${a.toneNumber} — ${a.toneName}`)}
      ${row2('Day Sign Quality', a.daySignQuality)}
    </tbody></table>
    ${box(tr('การตีความ Tonalpohualli', 'Tonalpohualli Reading'), a.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Tonalpohualli (260 วัน) เป็นปฏิทินศักดิ์สิทธิ์ของ Aztec เหมือน Mayan Tzolk\'in แต่มีชื่อ Day Signs ต่างออกไป ใช้โดย tonalpouhqui (นักโหราศาสตร์) เพื่อกำหนดชะตาชีวิตตั้งแต่แรกเกิด Aztec เชื่อว่า Day Sign ณ วันเกิดกำหนด "patron deity" ของบุคคลนั้น — นิยมในเม็กซิโกและนักวิจัย Mesoamerican culture', 'Tonalpohualli (260 days) is the Aztec sacred calendar, structurally similar to the Mayan Tzolk\'in but with different Day-Sign names. It was used by the tonalpouhqui (astrologers) to set life destiny from birth. The Aztecs believed your birth Day Sign determined your "patron deity" for life. Still used today in Mexico and by scholars of Mesoamerican culture.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Tonalpohualli คือปฏิทิน 260 วัน (20 Day Signs × 13 Tones) ใช้ร่วมกับ Mayan Tzolk'in — ${a.daySignTh} Tone ${a.toneNumber} กำหนดพลังงาน`, `Tonalpohualli is a 260-day calendar (20 Day Signs × 13 Tones), paired with the Mayan Tzolk'in — ${a.daySign} (${a.daySignTh}) Tone ${a.toneNumber} sets your energy signature.`)}</p>
  `);
}
function p_nativeAmerican(c) {
    const n = c.nativeAmerican;
    return section(0, tr('Native American — Birth Totem', 'Native American — Birth Totem & Clan'), '🦅', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(n.birthTotemTh)}</div><div class="lbl">Birth Totem</div></div>
      <div class="stat-card"><div class="val">${n.score}</div><div class="lbl">Native American Score</div></div>
    </div>
    ${bar(n.score, '#8a5a30')}
    <table style="margin:12px 0"><tbody>
      ${row2('Birth Totem (EN)', n.birthTotem)}
      ${row2('Moon Cycle', n.moonCycle)}
      ${row2('Clan', n.clansmother)}
      ${row2(tr('ธาตุ', 'Element'), n.element)}
    </tbody></table>
    ${box(tr('การตีความ Native American', 'Native American Reading'), n.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Medicine Wheel เป็นระบบจักรวาลวิทยาของชนพื้นเมืองอเมริกาเหนือหลายเผ่า (Lakota, Ojibwe, Cherokee ฯลฯ) 13 Moon Calendar ใช้ lunar cycle 13 รอบต่อปี แต่ละ moon มี totem animal ประจำ ระบบนี้ถ่ายทอดผ่าน oral tradition กว่า 10,000 ปี Sun Bear popularize ผ่านหนังสือในทศวรรษ 1980', 'The Medicine Wheel is a cosmological system shared by multiple Indigenous North American nations (Lakota, Ojibwe, Cherokee, and others). The 13 Moon Calendar tracks 13 lunar cycles per year, each with its own totem animal. The tradition has passed through oral teaching for over 10,000 years. Sun Bear popularised it for non-Indigenous audiences through his 1980s books.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Medicine Wheel มี 13 moon cycle — Birth Totem ${n.birthTotemTh} (${n.birthTotem}) ใน ${n.clansmother} บ่งถึงสัตว์นำทางทางจิตวิญญาณ`, `The Medicine Wheel has 13 moon cycles — your Birth Totem ${n.birthTotem} (${n.birthTotemTh}) in the ${n.clansmother} clan marks your spirit guide animal.`)}</p>
  `);
}
function p_ifaYoruba(c) {
    const i = c.ifaYoruba;
    return section(0, tr('Ifa / Yoruba — Odù แห่งชะตา', 'Ifá / Yoruba — Odù of Destiny'), '🥁', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:18px">${esc(i.odu)}</div><div class="lbl">Odù ${i.oduNumber}</div></div>
      <div class="stat-card"><div class="val">${i.score}</div><div class="lbl">Ifa Score</div></div>
    </div>
    ${bar(i.score, '#6a4a10')}
    <table style="margin:12px 0"><tbody>
      ${row2('Odù (Thai)', i.oduTh)}
      ${row2('Theme', i.oduTheme)}
      ${row2('Fortune', i.fortune)}
    </tbody></table>
    ${box(tr('การตีความ Ifa', 'Ifá Reading'), i.reading, i.fortune.includes('เยี่ยม') ? 'green' : i.fortune.includes('ท้าทาย') ? 'red' : 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Ifa divination เป็นระบบโหราศาสตร์ของชาว Yoruba ไนจีเรีย มีอายุกว่า 8,000 ปีตามตำนาน มี 256 Odù (corpus ความรู้) แต่ละ Odù มี poems, proverbs และ remedies UNESCO ประกาศให้ Ifa เป็น Intangible Cultural Heritage of Humanity ในปี 2005 Babalawo (นักพยากรณ์) ใช้เวลาเรียน 7-10 ปี', 'Ifá divination is the wisdom system of the Yoruba people of Nigeria — said by tradition to be over 8,000 years old. Its corpus of 256 Odù carries poems, proverbs, and remedies for every life situation. UNESCO declared Ifá an Intangible Cultural Heritage of Humanity in 2005. Babalawo (diviner-priests) train for 7–10 years to master it.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Ifa มี 256 Odù (16×16) — ${i.odu} คือ Odù ที่ ${i.oduNumber} หนึ่งในระบบโชคชะตาของชาว Yoruba ไนจีเรีย/เบนิน`, `Ifá has 256 Odù (16×16) — yours is ${i.odu}, Odù #${i.oduNumber} of the Yoruba destiny system from Nigeria and Benin.`)}</p>
  `);
}
function p_aboriginal(c) {
    const a = c.aboriginal;
    return section(0, tr('Aboriginal Dreamtime — บรรพบุรุษแห่งฝัน', 'Aboriginal Dreamtime — Ancestors of the Dreaming'), '🌈', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card"><div class="val" style="font-size:16px">${esc(a.dreamingTh)}</div><div class="lbl">Dreaming Ancestor</div></div>
      <div class="stat-card"><div class="val">${a.score}</div><div class="lbl">Aboriginal Score</div></div>
    </div>
    ${bar(a.score, '#6a4a30')}
    <table style="margin:12px 0"><tbody>
      ${row2('Ancestor (EN)', a.dreamingAncestor)}
      ${row2('Season', a.season)}
      ${row2('Clan', a.clan)}
    </tbody></table>
    ${box(tr('การตีความ Dreamtime', 'Dreamtime Reading'), a.reading, 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Dreamtime (Tjukurpa ในภาษา Anangu) เป็นปรัชญาและโลกทัศน์ของชาวอะบอริจินออสเตรเลีย อายุกว่า 65,000 ปี — เก่าแก่ที่สุดในโลก บรรพบุรุษ Dreaming สร้างภูมิทัศน์และกำหนดกฎทางสังคม ไม่ใช่แค่ "ตำนาน" แต่คือ living law ที่ยังใช้อยู่ในชุมชนอะบอริจินปัจจุบัน', 'Dreamtime (Tjukurpa in Anangu) is the philosophy and worldview of Aboriginal Australians — over 65,000 years old, the oldest continuous spiritual tradition on Earth. Dreaming Ancestors shaped the landscape and codified social law. It is not "myth" — it is living law still actively practised in Aboriginal communities today.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Dreamtime เป็นปรัชญาชาวอะบอริจินออสเตรเลีย — บรรพบุรุษ ${a.dreamingTh} ชี้แนะเส้นทางผ่านกฎธรรมชาติ`, `Dreamtime is the Aboriginal Australian philosophy — your Ancestor ${a.dreamingAncestor} (${a.dreamingTh}) guides your path through natural law.`)}</p>
  `);
}
function p_biorhythm(c) {
    const b = c.biorhythm;
    const phaseColor = (v) => v > 40 ? '#4a9a40' : v > 0 ? '#8a8a30' : v > -40 ? '#8a5a20' : '#9a3020';
    return section(0, tr('Biorhythm — วัฏจักรชีวิต', 'Biorhythm — Life Cycles'), '📈', `
    <div class="grid-3" style="margin-bottom:12px;text-align:center">
      ${[
        [tr('ร่างกาย', 'Physical'), b.physical, b.physicalPhase, 'Physical (23d)'],
        [tr('อารมณ์', 'Emotional'), b.emotional, b.emotionalPhase, 'Emotional (28d)'],
        [tr('สติปัญญา', 'Intellectual'), b.intellectual, b.intellectualPhase, 'Intellectual (33d)'],
    ].map(([l, v, p, en]) => `
        <div class="stat-card">
          <div class="val" style="color:${phaseColor(+v)}">${+v > 0 ? '+' : ''}${v}%</div>
          <div class="lbl">${esc(String(l))}</div>
          <div style="font-size:10px;color:#6a5a42;margin-top:2px">${esc(String(p))}</div>
        </div>`).join('')}
    </div>
    <div style="background:#0a1008;border-radius:8px;padding:12px;margin:8px 0">
      <div style="font-size:12px;color:#5a8a40;margin-bottom:6px">${tr('วัฏจักร ณ 14 เม.ย. 2026', 'Cycles as of 14 April 2026')}</div>
      ${[['Physical 23d', b.physical, '#4a9a40'], ['Emotional 28d', b.emotional, '#5a6a90'], ['Intellectual 33d', b.intellectual, '#9a7a30']].map(([l, v, col]) => `<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px"><span style="color:#9a8a72">${esc(String(l))}</span><span style="color:${col};font-weight:600">${+v > 0 ? '+' : ''}${v}%</span></div>
        <div style="background:#1a2010;border-radius:3px;height:6px"><div style="width:${Math.round((+v + 100) / 2)}%;height:6px;background:${col};border-radius:3px"></div></div></div>`).join('')}
    </div>
    <div class="stat-card" style="margin-top:8px">
      <div class="val">${b.score}</div><div class="lbl">Biorhythm Score</div>
    </div>
    ${bar(b.score, '#5a7a30')}
    ${b.reading}
  `);
}
function p_vedicMahadasha(c) {
    const v = c.vedicMahadasha;
    const DASHA_COLORS = {
        Jupiter: '#5a8a30', Venus: '#8a5a80', Sun: '#8a6020', Moon: '#5a7a9a',
        Mercury: '#3a7a60', Mars: '#9a3020', Saturn: '#4a4a5a', Rahu: '#5a3060', Ketu: '#6a5a30'
    };
    const col = DASHA_COLORS[v.currentDasha] ?? '#6a5a42';
    return section(0, tr('Vedic Mahadasha — ช่วงดาวปกครอง', 'Vedic Mahadasha — Planetary Period Cycles'), '🕉️', `
    <div class="grid-2" style="margin-bottom:12px">
      <div class="stat-card" style="border-color:${col}">
        <div class="val" style="color:${col};font-size:20px">${esc(v.currentDasha)}</div>
        <div class="lbl">${tr('Mahadasha ปัจจุบัน', 'Current Mahadasha')}</div>
      </div>
      <div class="stat-card"><div class="val">${v.score}</div><div class="lbl">Mahadasha Score</div></div>
    </div>
    ${bar(v.score, col)}
    <table style="margin:12px 0"><tbody>
      ${row2('Mahadasha', v.currentDasha)}
      ${row2(tr('สิ้นสุด', 'Ends'), String(v.currentDashaEnd))}
      ${row2('Antardasha', v.antardasha)}
      ${row2(tr('คุณภาพ', 'Quality'), v.dashaQuality)}
      ${row2(tr('ธาตุ Dasha', 'Dasha Element'), v.dashaElement)}
    </tbody></table>
    ${box(tr('การตีความ Mahadasha', 'Mahadasha Reading'), v.reading, ['Jupiter', 'Venus', 'Sun'].includes(v.currentDasha) ? 'green' : ['Saturn', 'Rahu', 'Ketu'].includes(v.currentDasha) ? 'red' : 'gold')}
    <p style="font-size:11px;color:#4a6a70;border-left:2px solid #3a5a60;padding:6px 10px;margin-bottom:8px"><strong>${tr('ต้นกำเนิด:', 'Origin:')}</strong> ${tr('Vimshottari Dasha เป็นระบบ planetary periods ใน Vedic Jyotish รวม 120 ปี ประกอบด้วย 9 ดาว แต่ละดาวปกครอง 6-20 ปี คำนวณจาก Nakshatra ของดวงจันทร์ณ เวลาเกิด — ถือเป็นหนึ่งในเครื่องมือทำนาย timing ที่แม่นยำที่สุดใน Vedic system ยังใช้แพร่หลายในอินเดียสำหรับการตัดสินใจสำคัญ', 'Vimshottari Dasha is the planetary-period system at the heart of Vedic Jyotish — a 120-year cycle spread across nine planets, each ruling 6–20 years. Calculated from the Moon\'s Nakshatra at birth, it is considered the most precise timing tool in Vedic astrology. Still widely consulted in India for major life decisions.')}</p>
    <p style="font-size:11px;color:#6a5a42">${tr(`Vedic Mahadasha กำหนด "ช่วงเวลา" ที่ดาวแต่ละดวงปกครองชีวิต — ${v.currentDasha} (${v.dashaQuality}) ครองจนถึงปี ${v.currentDashaEnd}`, `Vedic Mahadasha defines the periods during which each planet rules your life — ${v.currentDasha} (${v.dashaQuality}) rules through ${v.currentDashaEnd}.`)}</p>
  `);
}
