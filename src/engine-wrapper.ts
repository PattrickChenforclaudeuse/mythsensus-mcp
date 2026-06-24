/**
 * Engine wrapper — loads the compiled CommonJS engine (`engine/calc.js`)
 * into this ESM context and exposes typed access to its functions.
 *
 * The compiled engine is the same JavaScript that mythsensus.com serves to
 * every browser visitor — bundling it here adds no incremental disclosure.
 * TypeScript source for the engine remains private until v2 release
 * (planned Q3-Q4 2026). See README for honest limitations disclosure.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Lazy-load — only import the engine when first tool call happens. Keeps
// startup fast.
let _calc: any = null;
let _gods: any = null;

function loadCalc(): any {
  if (_calc) return _calc;
  _calc = require(join(__dirname, 'engine', 'calc.cjs'));
  return _calc;
}

function loadGods(): any[] {
  if (_gods) return _gods;
  const fs = require('fs');
  _gods = JSON.parse(
    fs.readFileSync(join(__dirname, 'engine', 'gods.json'), 'utf8')
  );
  return _gods;
}

// ── Public API ─────────────────────────────────────────────────────

export interface BirthData {
  name?: string;
  gender?: string;
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  lat?: number;
  lon?: number;
  timezone?: number;
  lang?: 'th' | 'en';
}

export interface CosmicScoreResult {
  total: number;        // 1-999
  tier: string;         // Thai tier name
  tierEn?: string;      // English tier name
  percentile?: string;  // "Top X%"
  breakdown?: any[];    // per-system contribution
}

export interface ChartSummary {
  cosmicScore: CosmicScoreResult;
  western: { sun?: string; sunTh?: string; moon?: string; moonTh?: string };
  bazi: { dayMaster?: string; dayMasterTh?: string; dayMasterElement?: string };
  ninestar: { star?: number; starTh?: string };
  numerology: { lifePath?: number };
  vedic: { moonNakshatra?: string; nakshatraLord?: string };
  mayan: { kin?: number };
  celtic: { tree?: string; treeTh?: string };
  humandesign: { type?: string };
  thai: { dayName?: string; dayColor?: string; dayGod?: string; dayGodTh?: string; nakshatra?: string; fortuneDay?: string };
  // raw chart object available via getRawChart()
  _hasFullChart: boolean;
}

/**
 * Run the engine for a birth date. Returns a structured summary of the
 * 26-system synthesis + Cosmic Score.
 */
export function calculate(birth: BirthData): { chart: any; summary: ChartSummary } {
  // Apply defaults: noon UTC+7 Bangkok if unspecified
  const input = {
    name: birth.name ?? '',
    gender: birth.gender ?? 'ชาย',
    year: birth.year,
    month: birth.month,
    day: birth.day,
    hour: birth.hour ?? 12,
    minute: birth.minute ?? 0,
    lat: birth.lat ?? 13.75,
    lon: birth.lon ?? 100.5,
    timezone: birth.timezone ?? 7,
    lang: birth.lang ?? 'th',
  };

  const calc = loadCalc();
  const chart = calc.calculate(input);

  const summary: ChartSummary = {
    cosmicScore: {
      total: chart.score?.total ?? 0,
      tier: chart.score?.tier ?? '',
      tierEn: chart.score?.tierEn,
      percentile: chart.score?.percentile,
      breakdown: chart.score?.breakdown,
    },
    western: {
      sun: chart.western?.sunSign,
      sunTh: chart.western?.sunSignTh,
      moon: chart.western?.moonSign,
      moonTh: chart.western?.moonSignTh,
    },
    bazi: {
      dayMaster: chart.bazi?.dayMaster,
      dayMasterTh: chart.bazi?.dayMasterTh,
      dayMasterElement: chart.bazi?.dayMasterElement,
    },
    ninestar: {
      star: chart.ninestar?.star,
      starTh: chart.ninestar?.starTh,
    },
    numerology: {
      lifePath: chart.numerology?.lifePath,
    },
    vedic: {
      moonNakshatra: chart.vedic?.nakshatra,
      nakshatraLord: chart.vedic?.nakshatraLord,
    },
    mayan: {
      kin: chart.mayan?.kin,
    },
    celtic: {
      tree: chart.celtic?.tree,
      treeTh: chart.celtic?.treeTh,
    },
    humandesign: {
      type: chart.humandesign?.type,
    },
    thai: {
      dayName: chart.thai?.dayName,
      dayColor: chart.thai?.dayColor,
      dayGod: chart.thai?.dayGod,
      dayGodTh: chart.thai?.dayGodTh,
      nakshatra: chart.thai?.nakshatra,
      fortuneDay: chart.thai?.fortuneDay,
    },
    _hasFullChart: true,
  };

  return { chart, summary };
}

/**
 * Get the canonical list of 26 systems the engine implements.
 */
export const SYSTEMS_26 = [
  { slug: 'bazi',           nameEn: 'BaZi (Four Pillars of Destiny)',     nameTh: 'BaZi · สี่เสาดวง',           region: 'China',               inputs: ['date', 'time-optional'] },
  { slug: 'vedic',          nameEn: 'Vedic Jyotish',                       nameTh: 'โหราศาสตร์อินเดีย Vedic',   region: 'India',               inputs: ['date', 'time-optional'] },
  { slug: 'western',        nameEn: 'Western Astrology',                   nameTh: 'โหราศาสตร์ตะวันตก',         region: 'Greco-Roman',         inputs: ['date', 'time-optional'] },
  { slug: 'ninestar',       nameEn: 'Nine Star Ki (九星気学)',             nameTh: 'Nine Star Ki',              region: 'Japan',               inputs: ['date'] },
  { slug: 'thai',           nameEn: 'Thai Seven Number (เลข 7 ตัว 9 ฐาน)', nameTh: 'เลข 7 ตัว 9 ฐาน',           region: 'Thailand',            inputs: ['date'] },
  { slug: 'numerology',     nameEn: 'Pythagorean Numerology',              nameTh: 'ตัวเลขพิทาโกรัส',           region: 'Greece',              inputs: ['date'] },
  { slug: 'humandesign',    nameEn: 'Human Design',                        nameTh: 'Human Design',              region: 'Modern Synthesis (1987)', inputs: ['date', 'time-optional'] },
  { slug: 'mayan',          nameEn: "Mayan Tzolk'in",                      nameTh: 'ปฏิทินมายา Tzolk\'in',      region: 'Mesoamerica',         inputs: ['date'] },
  { slug: 'celtic',         nameEn: 'Celtic Tree Astrology',               nameTh: 'โหราศาสตร์ต้นไม้เซลติก',   region: 'Celtic',              inputs: ['date'] },
  { slug: 'saju',           nameEn: 'Korean Saju (사주)',                  nameTh: 'Saju (사주)',                region: 'Korea',               inputs: ['date', 'time-optional'] },
  { slug: 'tibetan',        nameEn: 'Tibetan Astrology',                   nameTh: 'โหราศาสตร์ทิเบต',          region: 'Tibet',               inputs: ['date'] },
  { slug: 'ziwei',          nameEn: 'Zi Wei Dou Shu (紫微斗数)',          nameTh: 'ดาวจักรพรรดิ Zi Wei',       region: 'China',               inputs: ['date', 'time'] },
  { slug: 'onmyodo',        nameEn: 'Onmyōdō (陰陽道)',                    nameTh: 'Onmyōdō',                   region: 'Japan',               inputs: ['date'] },
  { slug: 'hellenistic',    nameEn: 'Hellenistic Astrology',               nameTh: 'โหราศาสตร์ Hellenistic',    region: 'Hellenistic',         inputs: ['date', 'time-optional'] },
  { slug: 'norseRune',      nameEn: 'Norse Runes',                         nameTh: 'รูนนอร์ส',                  region: 'Norse',               inputs: ['date'] },
  { slug: 'ogham',          nameEn: 'Ogham Alphabet',                      nameTh: 'อักษร Ogham',                region: 'Celtic',              inputs: ['date'] },
  { slug: 'arabicParts',    nameEn: 'Arabic Parts',                        nameTh: 'Arabic Parts',              region: 'Arabia',              inputs: ['date', 'time'] },
  { slug: 'kabbalistic',    nameEn: 'Kabbalistic Numerology',              nameTh: 'ตัวเลขคาบาลาห์',           region: 'Kabbalah',            inputs: ['date'] },
  { slug: 'zoroastrian',    nameEn: 'Zoroastrian Astrology',               nameTh: 'โหราศาสตร์โซโรอัสเตอร์',   region: 'Persia',              inputs: ['date'] },
  { slug: 'aztec',          nameEn: 'Aztec Tonalpohualli',                 nameTh: 'ปฏิทินแอซเทค',              region: 'Aztec',               inputs: ['date'] },
  { slug: 'nativeAmerican', nameEn: 'Native American Birth Totems',        nameTh: 'โทเทมพื้นเมืองอเมริกา',     region: 'Indigenous Americas', inputs: ['date'] },
  { slug: 'ifaYoruba',      nameEn: 'Ifá Yoruba',                          nameTh: 'Ifá Yoruba',                region: 'West Africa',         inputs: ['date'] },
  { slug: 'aboriginal',     nameEn: 'Aboriginal Dreamtime',                nameTh: 'Dreamtime ของชาวอะบอริจิน', region: 'Australia',           inputs: ['date'] },
  { slug: 'biorhythm',      nameEn: 'Biorhythm',                           nameTh: 'Biorhythm',                 region: 'Modern',              inputs: ['date'] },
  { slug: 'vedicMahadasha', nameEn: 'Vedic Mahādaśā',                      nameTh: 'ทศ Mahādaśā',                region: 'India',               inputs: ['date', 'time-optional'] },
  { slug: 'thaiBrahmin',    nameEn: 'Thai Brahmin',                        nameTh: 'ไทยพราหมณ์',                region: 'Thailand',            inputs: ['date'] },
];

// ── Typo-tolerant system resolver ───────────────────────────────────
// Lets a caller pass a slightly-misspelled or alternative system name and
// still route to the canonical slug — e.g. "vedik" → vedic, "four pillars"
// → bazi, "9 star ki" → ninestar. All matching logic is original; only the
// idea (forgiving input) is borrowed. Order: exact canonical → known alias
// → fuzzy (Levenshtein, length-scaled threshold).

export const SYSTEM_SLUGS: string[] = SYSTEMS_26.map((s) => s.slug);

// Normalize for matching: lowercase, strip whitespace + common separators/
// punctuation. Keeps letters (incl. Thai) and digits so city names in any
// script still match — only word boundaries are removed.
const _norm = (s: string): string =>
  String(s ?? '').toLowerCase().replace(/[\s\-_.,\/'’()]+/g, '');

// Common alternative names → canonical slug. Keys are pre-normalized
// (lowercase, alphanumeric-only) to match _norm() output.
const SYSTEM_ALIASES: Record<string, string> = {
  fourpillars: 'bazi', eightcharacters: 'bazi', bazidestiny: 'bazi', pazi: 'bazi',
  jyotish: 'vedic', vedicastrology: 'vedic', hindu: 'vedic', indian: 'vedic', sidereal: 'vedic',
  westernastrology: 'western', tropical: 'western', zodiac: 'western', sunsign: 'western',
  ninestarki: 'ninestar', kyusei: 'ninestar', '9starki': 'ninestar', '9star': 'ninestar',
  thaisevennumber: 'thai', sevennumber: 'thai', thai7: 'thai', lek7tua: 'thai', thaiastrology: 'thai',
  pythagorean: 'numerology', pythagoreannumerology: 'numerology', numbers: 'numerology', lifepath: 'numerology',
  hd: 'humandesign', humandesignsystem: 'humandesign',
  tzolkin: 'mayan', mayantzolkin: 'mayan', mayancalendar: 'mayan',
  celtictree: 'celtic', treeastrology: 'celtic', druid: 'celtic',
  korean: 'saju', sajupalja: 'saju',
  tibetanastrology: 'tibetan',
  ziweidoushu: 'ziwei', zwds: 'ziwei', purplestar: 'ziwei', emperorstar: 'ziwei',
  onmyoji: 'onmyodo', yinyang: 'onmyodo',
  hellenisticastrology: 'hellenistic',
  norserunes: 'norserune', runes: 'norserune', rune: 'norserune', norse: 'norserune', futhark: 'norserune', elderfuthark: 'norserune',
  oghamalphabet: 'ogham', oghamtree: 'ogham',
  arabicpart: 'arabicparts', lots: 'arabicparts', arabiclots: 'arabicparts', partoffortune: 'arabicparts',
  kabbalah: 'kabbalistic', kabbalisticnumerology: 'kabbalistic', gematria: 'kabbalistic', qabalah: 'kabbalistic',
  zoroastrianastrology: 'zoroastrian', persian: 'zoroastrian',
  azteccalendar: 'aztec', tonalpohualli: 'aztec',
  totem: 'nativeamerican', birthtotem: 'nativeamerican', nativeamericantotems: 'nativeamerican', medicinewheel: 'nativeamerican',
  ifa: 'ifayoruba', yoruba: 'ifayoruba', ifadivination: 'ifayoruba',
  dreamtime: 'aboriginal', aboriginaldreamtime: 'aboriginal',
  biorhythms: 'biorhythm',
  mahadasha: 'vedicmahadasha', dasha: 'vedicmahadasha', vimshottari: 'vedicmahadasha', dasa: 'vedicmahadasha',
  brahmin: 'thaibrahmin',
};

function _levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let cur = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    const tmp = prev; prev = cur; cur = tmp;
  }
  return prev[n];
}

export interface ResolvedSystem {
  slug: string | null;                              // canonical slug, or null if unresolvable
  matched: 'exact' | 'alias' | 'fuzzy' | 'none';
  input: string;                                    // the raw input, for echo-back
  suggestion?: string;                              // closest slug when fuzzy / none
}

/**
 * Resolve a user-supplied system name to a canonical slug, tolerating case,
 * separators, common aliases, and small typos (≤1 edit for short names, ≤2
 * for longer ones). Returns slug:null with a suggestion when nothing is close.
 */
export function resolveSystem(input: string): ResolvedSystem {
  const raw = String(input ?? '');
  const n = _norm(raw);
  if (!n) return { slug: null, matched: 'none', input: raw };

  // 1. Exact canonical (normalized)
  const exact = SYSTEM_SLUGS.find((s) => _norm(s) === n);
  if (exact) return { slug: exact, matched: 'exact', input: raw };

  // 2. Known alias (alias values are normalized slugs → map back to canonical)
  const aliasNorm = SYSTEM_ALIASES[n];
  if (aliasNorm) {
    const canon = SYSTEM_SLUGS.find((s) => _norm(s) === aliasNorm) ?? aliasNorm;
    return { slug: canon, matched: 'alias', input: raw };
  }

  // 3. Fuzzy across canonical slugs + alias keys
  let best: string | null = null;
  let bestD = Infinity;
  const consider = (candidateNorm: string, canonNorm: string) => {
    const d = _levenshtein(n, candidateNorm);
    if (d < bestD) { bestD = d; best = canonNorm; }
  };
  for (const s of SYSTEM_SLUGS) consider(_norm(s), _norm(s));
  for (const [alias, slugNorm] of Object.entries(SYSTEM_ALIASES)) consider(alias, slugNorm);

  const threshold = n.length <= 4 ? 1 : 2;
  if (best !== null && bestD <= threshold) {
    const canon = SYSTEM_SLUGS.find((s) => _norm(s) === best) ?? best;
    return { slug: canon, matched: 'fuzzy', input: raw, suggestion: canon };
  }
  const canonSugg = best !== null ? (SYSTEM_SLUGS.find((s) => _norm(s) === best) ?? best) : undefined;
  return { slug: null, matched: 'none', input: raw, suggestion: canonSugg };
}

// ── Birth-time disclosure ───────────────────────────────────────────
// Layers whose output depends on the birth TIME (not just the date). When
// the caller omits hour/minute the engine falls back to 12:00 noon, so these
// are flagged approximate rather than silently presented as precise — the
// honest-engine stance (see about_mythsensus_engine).
export const TIME_SENSITIVE_LAYERS = [
  'BaZi hour pillar',
  'Western Ascendant & houses',
  'Zi Wei Dou Shu',
  'Vedic & Hellenistic Ascendant',
  'Arabic Parts',
];

// NOTE (v2 ceiling): disclosure-only for now — the score still computes with
// the noon fallback. A deeper version would drop the hour-pillar / house
// contributions from the aggregate when time is unknown.
export function timeDisclosure(timeKnown: boolean): { time_provided: boolean; note?: string } {
  if (timeKnown) return { time_provided: true };
  return {
    time_provided: false,
    note:
      'Birth time not provided — engine used 12:00 noon as a neutral default. ' +
      'Time-dependent layers are approximate: ' + TIME_SENSITIVE_LAYERS.join(', ') +
      '. Pass hour (and minute) for full precision.',
  };
}

// ── Typo-tolerant city / location resolver ──────────────────────────
// Resolves a free-text location — a city name (Thai or English, with aliases
// and small typos) OR an explicit "lat,lon" pair — to coordinates + standard
// timezone, from a bundled OFFLINE table (engine/cities.json). No network: the
// server stays fully local (privacy promise). Unlisted cities resolve to null
// so the caller can fall back to a default. Curated v1 subset — see cities.json.
let _cities: any[] | null = null;
function loadCities(): any[] {
  if (_cities) return _cities;
  const fs = require('fs');
  const raw = JSON.parse(fs.readFileSync(join(__dirname, 'engine', 'cities.json'), 'utf8'));
  _cities = Array.isArray(raw) ? raw : (raw.cities ?? []);
  return _cities!;
}

export interface ResolvedCity {
  lat: number | null;
  lon: number | null;
  tz?: number;
  name: string | null;
  matched: 'coords' | 'exact' | 'alias' | 'fuzzy' | 'none';
  input: string;
  suggestion?: string;
}

export function resolveCity(input: string): ResolvedCity {
  const raw = String(input ?? '').trim();
  if (!raw) return { lat: null, lon: null, name: null, matched: 'none', input: raw };

  // Explicit "lat,lon" (also accepts "lat lon" or "lat/lon")
  const m = raw.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,/ ]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
  if (m) {
    const lat = parseFloat(m[1]); const lon = parseFloat(m[2]);
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon, name: `${lat},${lon}`, matched: 'coords', input: raw };
    }
  }

  const cities = loadCities();
  const n = _norm(raw);
  if (!n) return { lat: null, lon: null, name: null, matched: 'none', input: raw };

  // 1. Exact on canonical name
  for (const c of cities) {
    if (_norm(c.name) === n) return { lat: c.lat, lon: c.lon, tz: c.tz, name: c.name, matched: 'exact', input: raw };
  }
  // 2. Exact on a known alias
  for (const c of cities) {
    if ((c.aliases ?? []).some((al: string) => _norm(al) === n)) {
      return { lat: c.lat, lon: c.lon, tz: c.tz, name: c.name, matched: 'alias', input: raw };
    }
  }

  // 3. Fuzzy across names + aliases (Levenshtein, length-scaled threshold)
  let best: any = null;
  let bestD = Infinity;
  for (const c of cities) {
    for (const cand of [c.name, ...(c.aliases ?? [])]) {
      const cn = _norm(cand);
      if (!cn) continue;
      const d = _levenshtein(n, cn);
      if (d < bestD) { bestD = d; best = c; }
    }
  }
  const threshold = n.length <= 4 ? 1 : 2;
  if (best && bestD <= threshold) {
    return { lat: best.lat, lon: best.lon, tz: best.tz, name: best.name, matched: 'fuzzy', input: raw, suggestion: best.name };
  }
  return { lat: null, lon: null, name: null, matched: 'none', input: raw, suggestion: best ? best.name : undefined };
}

// ── Reference methodology / interpretation rules ────────────────────
// Curated, OPEN methodology (anti-disintermediation + authority) — the rules
// an AI should ground a divination answer in. Distinct from the per-user
// computed reading, which stays gated in calculate(). Loaded from
// engine/system-rules.json.
let _rules: any = null;
export function systemRules(): any {
  if (_rules) return _rules;
  const fs = require('fs');
  _rules = JSON.parse(fs.readFileSync(join(__dirname, 'engine', 'system-rules.json'), 'utf8'));
  return _rules;
}

/**
 * Deterministic deity draw — picks a deity from gods.json biased by chart
 * tier + date. Same chart on the same day always draws the same deity.
 * Simplified version of the website's daily-blessing logic.
 */
export function dailyBlessing(birth: BirthData, date?: string): {
  deity: string;
  mythology?: string;
  tier?: string;
  message?: string;
} {
  const { chart } = calculate(birth);
  const gods = loadGods();
  const dateStr = date ?? new Date().toISOString().slice(0, 10);

  // Deterministic seed from (DOB, date) — simple FNV-1a hash
  const seedStr = `${birth.year}-${birth.month}-${birth.day}-${dateStr}`;
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }

  // Tier-bias: higher Cosmic Score → more likely to draw higher-tier deity.
  const score = chart.score?.total ?? 500;
  const tierFilter = (g: any): boolean => {
    if (score >= 900) return ['Mythic', 'Legendary', 'Epic', 'Rare'].includes(g.tier);
    if (score >= 800) return ['Legendary', 'Epic', 'Rare', 'Uncommon'].includes(g.tier);
    if (score >= 700) return ['Epic', 'Rare', 'Uncommon', 'Common'].includes(g.tier);
    if (score >= 600) return ['Rare', 'Uncommon', 'Common'].includes(g.tier);
    return ['Uncommon', 'Common'].includes(g.tier);
  };
  const pool = gods.filter(tierFilter);
  const pick = pool[hash % pool.length];

  const messages = pick.messages_en || pick.messages || [];
  const msg = messages.length > 0 ? messages[hash % messages.length] : '';

  return {
    deity: pick.name,
    mythology: pick.mythology,
    tier: pick.tier,
    message: msg,
  };
}
