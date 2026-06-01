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
