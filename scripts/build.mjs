#!/usr/bin/env node
// Builds the profile README: fetches live GitHub data, draws every panel as an
// SVG (light, dark, desktop and phone variants) into assets/, and writes README.md.
// No dependencies. Run: node scripts/build.mjs  (uses GITHUB_TOKEN, GH_TOKEN or `gh auth token`)
// Look: matches nazmulnahid.bd (monochrome zinc, SF-style type, rounded cards).
// Fonts: Inter (SIL OFL 1.1), subset into scripts/fonts/; the site's SF Pro may not be embedded. Icons: Lucide (ISC).

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const ASSETS = join(ROOT, 'assets');
const LOGIN = 'nazmulnahid-git';

// ─── Content ────────────────────────────────────────────────────────────────

const SITE = 'https://nazmulnahid.bd';
const NAME = 'Nazmul Nahid';
const ROLE = 'Software Engineer';
const HEADLINE = ['Building multi-tenant SaaS', 'platforms at scale.']; // second line muted, like the site
const INTRO = 'Software Engineer (2.5+ yrs) building platforms used by creators and agencies worldwide.';
const FACTS = [['Currently', 'Software Engineer at AppifyLab'], ['Working on', 'EzyCourse, EzyStudio, EzyCommunity'], ['Based in', 'Sylhet, Bangladesh']];
// The first link is the filled button, like "View work" on the site.
const LINKS = [
  { key: 'site', label: 'nazmulnahid.bd', href: SITE, icon: 'globe', primary: true },
  { key: 'li', label: 'LinkedIn', href: 'https://www.linkedin.com/in/itsnazmulnahid/', icon: 'linkedin' },
  { key: 'mail', label: 'Email', href: 'mailto:hello@nazmulnahid.bd', icon: 'mail' },
];

// About Me, word for word from the original README: [icon, text]. **text** is drawn bold.
const ABOUT = [
  ['layers', 'Building and maintaining **scalable, multi-tenant SaaS platforms** (AI-powered LMS, no-code website builder, white-label community) used by creators and agencies worldwide'],
  ['code', 'Strong **full-stack expertise** across APIs, databases, caching, indexing, query optimization, and modern Next.js architecture'],
  ['card', '**End-to-end payment systems** with multiple gateways (eg. Stripe & PayPal), subscriptions, webhooks, refunds, and revenue reporting'],
  ['mail', '**Email marketing platforms** with audience segmentation, campaign builders, behavioral automation, and delivery analytics'],
  ['globe', '**Custom domain infrastructure** with DNS, SSL provisioning, and white-label routing'],
  ['shield', '**Security-first practices** with tenant isolation, permission-based APIs, secure authentication, and data privacy'],
  ['flask', '**Unit & end-to-end testing**, production debugging, and root-cause problem solving'],
  ['blocks', 'Focused on **clean architecture, scalable systems, and cost-efficient data access**'],
];
// The README's tools in the groups and words of the Skills section on nazmulnahid.bd.
// [name, brand colour, Simple Icons slug or lucide:<icon>, logo colour (default white)]
const STACK = [
  { title: 'Languages', blurb: 'The languages I think and solve problems in.', items: [
    ['TypeScript', '3178C6', 'typescript'], ['JavaScript', 'F7DF1E', 'javascript', '000000'], ['Python', '3776AB', 'python'], ['C++', '00599C', 'cplusplus'], ['Java', 'ED8B00', 'openjdk']] },
  { title: 'Frontend', blurb: 'Interfaces that are fast, accessible and polished.', items: [
    ['React', '20232A', 'react', '61DAFB'], ['Next.js', '000000', 'nextdotjs'], ['TanStack Start', 'ECE8D1', 'tanstack', '000000'], ['Astro', 'BC52EE', 'astro'], ['Vite', '646CFF', 'vite'], ['TanStack Query', 'FF4154', 'reactquery'],
    ['Redux', '764ABC', 'redux'], ['Tailwind CSS', '38B2AC', 'tailwindcss'], ['shadcn/ui', '000000', 'shadcnui'], ['Ant Design', '0170FE', 'antdesign']] },
  { title: 'Backend', blurb: 'APIs, real-time services and payments.', items: [
    ['Node.js', '339933', 'nodedotjs'], ['Go', '00ADD8', 'go'], ['AdonisJS', '5A45FF', 'adonisjs'], ['Express.js', '000000', 'express'], ['JWT', '000000', 'jsonwebtokens'],
    ['Socket.IO', '010101', 'socketdotio'], ['REST APIs', '6BA539', 'openapiinitiative'], ['Stripe', '635BFF', 'stripe'], ['PayPal', '003087', 'paypal']] },
  { title: 'Databases', blurb: 'Where the data lives, relational to real-time.', items: [
    ['MySQL', '4479A1', 'mysql'], ['PostgreSQL', '316192', 'postgresql'], ['Redis', 'DC382D', 'redis'], ['Valkey', '6983FF', 'lucide:databaseZap'],
    ['MongoDB', '47A248', 'mongodb'], ['DynamoDB', '4053D6', 'lucide:database'], ['DocumentDB', 'C925D1', 'lucide:fileJson'], ['Supabase', '3FCF8E', 'supabase']] },
  { title: 'Cloud & DevOps', blurb: 'Shipping, hosting and keeping things fast at the edge.', items: [
    ['AWS', '232F3E', 'lucide:cloud', 'FF9900'], ['Cloudflare', 'F38020', 'cloudflare'], ['CDN', '0B7285', 'lucide:globe'], ['Vercel', '000000', 'vercel'],
    ['Docker', '2496ED', 'docker'], ['Caddy', '1F88C0', 'caddy'], ['GitHub Actions', '2088FF', 'githubactions'], ['Grafana', 'F46800', 'grafana'],
    ['Loki', 'F2A10C', 'lucide:logs']] },
  { title: 'Developer Tools', blurb: 'What keeps the day-to-day workflow sharp.', items: [
    ['Git', 'F05032', 'git'], ['Turborepo', 'EF4444', 'turborepo'], ['pnpm', 'F69220', 'pnpm'], ['Vitest', '6E9F18', 'vitest'],
    ['ESLint', '4B32C3', 'eslint'], ['Postman', 'FF6C37', 'postman']] },
];

// ─── Design tokens ──────────────────────────────────────────────────────────
// Surfaces and text use the colours of nazmulnahid.bd (src/index.css): zinc greys, near-black and white.
// Emerald is the one accent: contribution data, charts and the About Me icons.

const THEMES = {
  light: {
    card: '#ffffff', chip: '#f4f4f5', fg: '#111113', onFg: '#ffffff', body: '#62626a', muted: '#62626a', faint: '#a1a1aa',
    border: '#e4e4e7', track: '#f0f0f1', shadow: true, data: '#059669', ok: '#16a34a',
    heat: ['#f4f4f5', '#d1fae5', '#6ee7b7', '#10b981', '#047857'], heatText: ['#a1a1aa', '#065f46', '#064e3b', '#022c22', '#ffffff'],
    logo: 'logo-black.png',
  },
  dark: {
    card: '#19191a', chip: '#222224', fg: '#f2f2f2', onFg: '#0f0f10', body: '#9a9a9e', muted: '#9a9a9e', faint: '#6b6b70',
    border: '#282829', track: '#262628', shadow: false, data: '#34d399', ok: '#4ade80',
    heat: ['#232325', '#064e3b', '#047857', '#10b981', '#6ee7b7'], heatText: ['#5a5a5e', '#a7f3d0', '#d1fae5', '#022c22', '#022c22'],
    logo: 'logo-white.png',
  },
};

const FONTS = {
  i4: { family: 'IN', weight: 400, file: 'i4.woff2' },
  i5: { family: 'IN', weight: 500, file: 'i5.woff2' },
  i6: { family: 'IN', weight: 600, file: 'i6.woff2' },
  i7: { family: 'IN', weight: 700, file: 'i7.woff2' },
};
const FALLBACK = { IN: `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Helvetica, Arial, sans-serif` };
const METRICS = JSON.parse(readFileSync(join(HERE, 'fonts', 'metrics.json'), 'utf8'));
const FONT_DATA = Object.fromEntries(Object.entries(FONTS).map(([k, f]) => [k, readFileSync(join(HERE, 'fonts', f.file)).toString('base64')]));
const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

const PAD = 6; // room around cards for the light-mode shadow
// Desktop panels draw at 880 but sit on a wider canvas with transparent space on the right, so on
// GitHub (width 100%) everything renders this much smaller, proportions intact and left-aligned.
// Phone panels use the full width.
const SHRINK = 1; // 1 = full width; e.g. 0.9 renders everything 10% smaller
let WIDEN = false;
const P = 20; // padding inside a card

// ─── Helpers ────────────────────────────────────────────────────────────────

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n) => n.toLocaleString('en-US');
const pl = (n, w) => `${fmt(n)} ${w}${n === 1 ? '' : 's'}`;
const r1 = (n) => Math.round(n * 10) / 10;
const iso = (d) => d.toISOString().slice(0, 10);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = (d, { day: showDay = true, year = false } = {}) => {
  const [y, m, dd] = d.split('-').map(Number);
  return [showDay ? dd : null, MONTHS[m - 1], year ? y : null].filter((x) => x != null).join(' ');
};

// Letter-spacing in em, as on the site: display type tight, body -0.01em.
const track = (size) => (size >= 28 ? -0.03 : size >= 18 ? -0.02 : -0.01);
// Exact advance widths from the embedded fonts, including letter-spacing.
const tw = (s, size, font, ls = track(size)) => {
  const m = METRICS[font];
  let w = 0, n = 0;
  for (const c of String(s)) { w += m[c] ?? 0.6; n++; }
  return (w + ls * n) * size;
};

function wrap(s, maxW, size, font) {
  const lines = [];
  let line = '';
  for (const word of s.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && tw(next, size, font) > maxW) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// Fonts used by the panel being drawn, so each SVG embeds only what it needs.
let USED = new Set();
let UID = 0;

function text(x, y, s, { f = 'i5', s: size = 16, c, a = 'start', o = null, ls = track(size), extra = '' } = {}) {
  USED.add(f);
  return `<text x="${r1(x)}" y="${r1(y)}" class="${f}" font-size="${size}" letter-spacing="${r1(ls * size * 100) / 100}" style="fill:${c}"${o != null ? ` fill-opacity="${o}"` : ''} text-anchor="${a}"${extra} xml:space="preserve">${esc(s)}</text>`;
}

function svg(w, h, t, label, body) {
  const faces = [...USED].map((k) => `@font-face{font-family:${FONTS[k].family};font-weight:${FONTS[k].weight};src:url(data:font/woff2;base64,${FONT_DATA[k]}) format('woff2')}`).join('');
  const classes = [...USED].map((k) => `.${k}{font-family:${FONTS[k].family},${FALLBACK[FONTS[k].family]};font-weight:${FONTS[k].weight}}`).join('');
  const shadow = t.shadow
    ? `<filter id="sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#111113" flood-opacity="0.04"/><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#0f172a" flood-opacity="0.05"/></filter>`
    : '';
  const cw = WIDEN ? Math.round(w / SHRINK) : w;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${h}" viewBox="0 0 ${cw} ${h}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><defs><style>${faces}${classes}</style>${shadow}</defs>
${body}
</svg>
`;
}

const rect = (x, y, w, h, r, attrs) => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(Math.max(0, w))}" height="${r1(Math.max(0, h))}" rx="${r}" ${attrs}/>`;
const hline = (x1, x2, y, c) => `<line x1="${r1(x1)}" y1="${r1(y) + 0.5}" x2="${r1(x2)}" y2="${r1(y) + 0.5}" stroke="${c}"/>`;
const vline = (x, y1, y2, c) => `<line x1="${r1(x) + 0.5}" y1="${r1(y1)}" x2="${r1(x) + 0.5}" y2="${r1(y2)}" stroke="${c}"/>`;

// Outer card: hairline border, soft shadow in light mode.
const card = (x, y, w, h, t, r = 16) => rect(x + 0.5, y + 0.5, w - 1, h - 1, r, `fill="${t.card}" stroke="${t.border}"${t.shadow ? ' filter="url(#sh)"' : ''}`);

const ICONS = {
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  code: '<path d="m18 16 4-4-4-4M6 8l-4 4 4 4M14.5 4l-5 16"/>',
  card: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  flask: '<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2M8.5 2h7M7 16h10"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  logs: '<path d="M13 12h8M13 18h8M13 6h8M3 12h1M3 18h1M3 6h1M8 12h1M8 18h1M8 6h1"/>',
  databaseZap: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 15 21.84M21 5V8M21 12L18 17H22L19 22M3 12A9 3 0 0 0 14.59 14.87"/>',
  fileJson: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
  blocks: '<rect width="7" height="7" x="14" y="3" rx="1"/><path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3"/>',
};
function icon(name, x, y, size, color, sw = 2) {
  return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${r1((size / 24) * 1000) / 1000})" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</g>`;
}
const dot = (cx, cy, r, c) => `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" fill="${c}"/>`;

function sectionTitle(t, W, title, note, phone, y = 25) {
  let out = text(PAD + 2, y, title.toUpperCase(), { f: 'i6', s: 12.5, ls: 0.04, c: t.muted });
  if (note) out += text(W - PAD - 2, y, note, { f: 'i4', s: 12.5, a: 'end', c: t.muted });
  return out;
}

// ─── GitHub data ────────────────────────────────────────────────────────────

function getToken() {
  const env = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (env) return env;
  try { return execSync('gh auth token', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* fall through */ }
  throw new Error('No token: set GITHUB_TOKEN or log in with `gh auth login`.');
}
const TOKEN = getToken();

async function gql(query, variables = {}) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-readme-builder' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors || json));
  return json.data;
}

const CAL = `contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } }`;

async function fetchData() {
  const { user } = await gql(`query($login: String!) { user(login: $login) {
    followers { totalCount }
    contributionsCollection { contributionYears ${CAL} }
    repositories(ownerAffiliations: OWNER, privacy: PUBLIC, first: 100, orderBy: { field: PUSHED_AT, direction: DESC }) { totalCount nodes {
      name isFork stargazerCount
      releases(first: 30) { nodes { releaseAssets(first: 20) { nodes { downloadCount } } } }
    } }
  } }`, { login: LOGIN });

  const years = [...user.contributionsCollection.contributionYears].sort((a, b) => b - a);
  const yearCals = {};
  await Promise.all(years.map(async (y) => {
    const d = await gql(`query($login: String!, $from: DateTime!, $to: DateTime!) { user(login: $login) {
      contributionsCollection(from: $from, to: $to) { ${CAL} } } }`,
    { login: LOGIN, from: `${y}-01-01T00:00:00Z`, to: `${y}-12-31T23:59:59Z` });
    yearCals[y] = d.user.contributionsCollection.contributionCalendar;
  }));

  const today = iso(new Date());
  const toWeeks = (cal) => cal.weeks
    .map((w) => w.contributionDays.filter((d) => d.date <= today).map((d) => ({ date: d.date, count: d.contributionCount, level: LEVEL[d.contributionLevel] ?? 0 })))
    .filter((w) => w.length);

  const lastYear = toWeeks(user.contributionsCollection.contributionCalendar);
  const byYear = Object.fromEntries(years.map((y) => [y, toWeeks(yearCals[y])]));

  // Every day we know about, oldest first, for streaks and the 30-day line.
  const counts = new Map();
  for (const weeks of [...Object.values(byYear), lastYear]) for (const w of weeks) for (const d of w) counts.set(d.date, d.count);
  const days = [...counts.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, count]) => ({ date, count }));

  let longest = { len: 0, from: null, to: null }, run = 0, runFrom = null;
  for (const d of days) {
    if (d.count > 0) { if (!run) runFrom = d.date; run++; if (run > longest.len) longest = { len: run, from: runFrom, to: d.date }; } else run = 0;
  }
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i--; // today not done yet: streak is still alive
  let current = { len: 0, from: null };
  while (i >= 0 && days[i].count > 0) { current = { len: current.len + 1, from: days[i].date }; i--; }

  const repos = user.repositories.nodes;
  const downloadsOf = (r) => r.releases.nodes.reduce((s, rel) => s + rel.releaseAssets.nodes.reduce((a, x) => a + x.downloadCount, 0), 0);

  return {
    today,
    years,
    lastYear,
    byYear,
    yearTotals: Object.fromEntries(years.map((y) => [y, yearCals[y].totalContributions])),
    total12: user.contributionsCollection.contributionCalendar.totalContributions,
    totalAll: years.reduce((s, y) => s + yearCals[y].totalContributions, 0),
    days,
    current,
    longest,
    publicRepos: user.repositories.totalCount,
    stars: repos.filter((r) => !r.isFork).reduce((s, r) => s + r.stargazerCount, 0),
    downloads: repos.reduce((s, r) => s + downloadsOf(r), 0),
    followers: user.followers.totalCount,
  };
}

// ─── Hero and links ─────────────────────────────────────────────────────────

// The mark from nazmulnahid.bd (99×116 PNG): black on light, white on dark, as on the site.
const LOGO_RATIO = 99 / 116;
const LOGO_DATA = Object.fromEntries(['logo-black.png', 'logo-white.png'].map((f) => [f, readFileSync(join(HERE, 'brand', f)).toString('base64')]));
function logo(x, y, h, t) {
  return `<image x="${r1(x)}" y="${r1(y)}" width="${r1(h * LOGO_RATIO)}" height="${h}" href="data:image/png;base64,${LOGO_DATA[t.logo]}"/>`;
}

// Like the site's hero: small intro line, big two-tone headline, intro, then a row of facts.
// The logo line is its own small image, sized to its content, so only it links to the site.
function brand(t) {
  const lh = 30, x = 2, top = 2, hi = `Hi, I'm ${NAME}`;
  let body = logo(x, top, lh, t);
  let cx = x + lh * LOGO_RATIO + 12;
  body += text(cx, top + lh / 2 + 5, hi, { f: 'i5', s: 14, c: t.fg });
  cx += tw(hi, 14, 'i5') + 12;
  body += vline(cx, top + lh / 2 - 8, top + lh / 2 + 8, t.border);
  cx += 12;
  body += text(cx, top + lh / 2 + 5, ROLE, { f: 'i5', s: 14, c: t.muted });
  return svg(Math.ceil(cx + tw(ROLE, 14, 'i5') + 4), lh + 2 * top, t, `Hi, I'm ${NAME}, ${ROLE}`, body);
}

// Headline, intro and facts; not a link. Uses the full width so it stays short.
function hero(t, phone) {
  const label = `${HEADLINE.join(' ')} ${INTRO} ${FACTS.map(([k, v]) => `${k}: ${v}.`).join(' ')}`;
  const W = phone ? 440 : 880, x = PAD, maxW = W - 2 * PAD;
  let body = '';

  // Headline: on one line, two-tone, when it fits; otherwise one part per line.
  const hs = phone ? 27 : 38, hl = hs * 1.1;
  let y = (phone ? 8 : 10) + hs * 0.8;
  const [first, second] = HEADLINE;
  if (tw(`${first} ${second}`, hs, 'i7') <= maxW) {
    body += text(x - 1, y, first, { f: 'i7', s: hs, c: t.fg });
    body += text(x - 1 + tw(`${first} `, hs, 'i7'), y, second, { f: 'i7', s: hs, c: t.faint });
    y += hl;
  } else {
    HEADLINE.forEach((part, i) => {
      for (const l of wrap(part, maxW, hs, 'i7')) { body += text(x - 1, y, l, { f: 'i7', s: hs, c: i ? t.faint : t.fg }); y += hl; }
    });
  }
  y += phone ? 2 : 4;
  const is = phone ? 14.5 : 15.5;
  for (const l of wrap(INTRO, maxW, is, 'i4')) { body += text(x, y, l, { f: 'i4', s: is, c: t.muted }); y += is * 1.5; }

  y += phone ? 4 : 6;
  const colW = maxW / FACTS.length;
  body += hline(x, x + maxW, y, t.border);
  let bottom = y;
  // Each fact is centred in its third of the row.
  FACTS.forEach(([k, v], i) => {
    const fx = x + i * colW + colW / 2;
    body += text(fx, y + 22, k, { f: 'i4', s: 12, a: 'middle', c: t.muted });
    wrap(v, colW - 14, 13.5, 'i5').forEach((l, j) => {
      body += text(fx, y + 41 + j * 18, l, { f: 'i5', s: 13.5, a: 'middle', c: t.fg });
      bottom = Math.max(bottom, y + 41 + j * 18);
    });
  });
  return svg(W, Math.ceil(bottom + 16), t, label, body);
}

// Pill buttons: the first filled (primary), the rest outlined, as on the site. Drawn in the same units as the
// panels (880 wide on desktop, 440 on phone) so the README can size them in % and they scale with the hero.
function badge(t, link, phone) {
  const size = phone ? 13 : 14, h = phone ? 34 : 38, is = phone ? 15 : 16, ip = phone ? 15 : 18;
  const w = Math.ceil(tw(link.label, size, 'i5') + ip + is + 8 + ip);
  const x = 2, y = 2, fill = link.primary ? t.fg : t.card, ink = link.primary ? t.onFg : t.fg;
  const body = rect(x + 0.5, y + 0.5, w - 1, h - 1, (h - 1) / 2, `fill="${fill}" stroke="${link.primary ? t.fg : t.border}"${t.shadow && !link.primary ? ' filter="url(#sh)"' : ''}`)
    + icon(link.icon, x + ip, y + (h - is) / 2, is, ink)
    + text(x + ip + is + 8, y + h / 2 + size * 0.35, link.label, { f: 'i5', s: size, c: ink });
  return svg(w + 4, h + 8, t, link.label, body);
}

// ─── About Me: the original points, two per row in one card ─────────────────

// Split "**bold** plain" into words; each word is a list of { t, b } runs so "**testing**," stays glued.
function richWords(src) {
  const words = [];
  let prevSpace = true;
  src.split('**').forEach((part, i) => {
    const b = i % 2 === 1;
    part.split(' ').forEach((tk, j) => {
      if (!tk) return;
      if (j === 0 && !prevSpace && words.length) words[words.length - 1].push({ t: tk, b });
      else words.push([{ t: tk, b }]);
    });
    if (part) prevSpace = part.endsWith(' ');
  });
  return words;
}
const runFont = (r) => (r.b ? 'i6' : 'i4');
const wordW = (wd, size) => wd.reduce((s, r) => s + tw(r.t, size, runFont(r)), 0);
function richLines(src, maxW, size) {
  const lines = [[]];
  let w = 0;
  const sp = tw(' ', size, 'i4');
  for (const wd of richWords(src)) {
    const ww = wordW(wd, size);
    const cur = lines[lines.length - 1];
    if (cur.length && w + sp + ww > maxW) { lines.push([wd]); w = ww; } else { cur.push(wd); w += (cur.length > 1 ? sp : 0) + ww; }
  }
  return lines;
}
function drawRich(t, lines, x, y, size, lh) {
  const sp = tw(' ', size, 'i4');
  let out = '';
  lines.forEach((line, i) => {
    let cx = x;
    line.forEach((wd) => {
      for (const r of wd) { out += text(cx, y + i * lh, r.t, { f: runFont(r), s: size, c: r.b ? t.fg : t.body }); cx += tw(r.t, size, runFont(r)); }
      cx += sp;
    });
  });
  return out;
}

function about(t, phone) {
  const W = phone ? 440 : 880, cw = W - 2 * PAD, cols = phone ? 1 : 2, colW = cw / cols;
  const size = phone ? 14 : 14.5, lh = phone ? 21 : 22, pad = phone ? 16 : 20, box = phone ? 30 : 32, gut = box + 14;
  const cells = ABOUT.map(([, src]) => richLines(src, colW - 2 * pad - gut, size));
  const lift = phone ? 0 : 14; // desktop: the hidden phone-button line above already gives this space
  const top = (phone ? 38 : 40) - lift;
  let body = '', y = top;
  for (let r = 0; r < cells.length; r += cols) {
    const row = cells.slice(r, r + cols);
    const h = Math.max(pad * 2 + box, pad * 2 + 14 + (Math.max(...row.map((c) => c.length)) - 1) * lh);
    if (r) body += hline(PAD + 1, PAD + cw - 1, y, t.border);
    row.forEach((lines, j) => {
      const x = PAD + j * colW;
      if (j) body += vline(x, y + 1, y + h - 1, t.border);
      const is = Math.round(box * 0.5);
      body += rect(x + pad + 0.5, y + pad - 3.5, box - 1, box - 1, 10, `fill="${t.chip}" stroke="${t.border}"`);
      body += icon(ABOUT[r + j][0], x + pad + (box - is) / 2, y + pad - 4 + (box - is) / 2, is, t.data);
      body += drawRich(t, lines, x + pad + gut, y + pad + 12, size, lh);
    });
    y += h;
  }
  const label = `About me: ${ABOUT.map(([, s]) => s.replace(/\*\*/g, '')).join('. ')}.`;
  return svg(W, y + PAD, t, label, sectionTitle(t, W, 'About Me', null, phone, 25 - lift) + card(PAD, top, cw, y - top, t) + body);
}

// ─── Tech stack: the Skills section of nazmulnahid.bd ───────────────────────
// A row per group: number, title and blurb on the left, logo chips on the right.

// Simple Icons (CC0) paths, the same logos the site loads from cdn.simpleicons.org.
const BRAND_ICONS = JSON.parse(readFileSync(join(HERE, 'brand', 'simple-icons.json'), 'utf8'));
const nearBlack = (hex) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0) < 40;

// The brand tile: brand colour with a soft top highlight and a faint inner ring, logo centred.
function logoTile(t, item, x, y, size) {
  const [, color, logo, ink = 'ffffff'] = item;
  const fill = !t.shadow && nearBlack(color) ? '#2a2a2c' : `#${color}`; // lift black tiles on the dark theme
  const ls = Math.round(size * 0.56), lx = x + (size - ls) / 2, ly = y + (size - ls) / 2;
  let out = rect(x, y, size, size, size * 0.3, `fill="${fill}"`);
  out += rect(x, y, size, size, size * 0.3, `fill="url(#tileg)"`);
  out += rect(x + 0.5, y + 0.5, size - 1, size - 1, size * 0.3 - 0.5, `fill="none" stroke="#ffffff" stroke-opacity="0.1"`);
  out += logo.startsWith('lucide:')
    ? icon(logo.slice(7), lx, ly, ls, `#${ink}`)
    : `<svg x="${r1(lx)}" y="${r1(ly)}" width="${ls}" height="${ls}" viewBox="0 0 24 24"><path fill="#${ink}" d="${BRAND_ICONS[logo]}"/></svg>`;
  return out;
}

function techChips(items, t, x0, y0, maxX, { h = 30, size = 13, gap = 7 } = {}) {
  let body = '', x = x0, y = y0;
  const ts = h - 8;
  for (const item of items) {
    const w = Math.ceil(4 + ts + 9 + tw(item[0], size, 'i5') + 12);
    if (x + w > maxX && x > x0) { x = x0; y += h + gap; }
    body += rect(x + 0.5, y + 0.5, w - 1, h - 1, 10, `fill="${t.chip}" stroke="${t.border}"`);
    body += logoTile(t, item, x + 4, y + 4, ts);
    body += text(x + 4 + ts + 9, y + h / 2 + size * 0.36, item[0], { f: 'i5', s: size, c: t.fg });
    x += w + gap;
  }
  return { body, bottom: y + h };
}

// Compact: one row per group, number and name on the left, logo chips on the right.
// The blurbs from the site go into the alt text only, to keep the section short.
function stack(t, phone) {
  const W = phone ? 440 : 880, cw = W - 2 * PAD, ip = phone ? 16 : 22, pad = phone ? 14 : 15;
  const ch = 30, labelW = 150, chipsX = phone ? PAD + ip : PAD + ip + labelW, maxX = PAD + cw - ip;
  const total = STACK.reduce((s, g) => s + g.items.length, 0);
  const top = 38;
  let body = `<defs><linearGradient id="tileg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>`;
  let y = top;
  STACK.forEach((g, i) => {
    if (i) body += hline(PAD + 1, PAD + cw - 1, y, t.border);
    const lx = PAD + ip, ly = y + pad + ch / 2 + 5;
    const num = String(i + 1).padStart(2, '0');
    body += text(lx, ly, num, { f: 'i5', s: 12, c: t.faint });
    body += text(lx + 24, ly, g.title, { f: 'i6', s: 14.5, c: t.fg });
    const c = techChips(g.items, t, chipsX, phone ? y + pad + ch + 8 : y + pad, maxX, { h: ch, size: 13, gap: 7 });
    body += c.body;
    y = c.bottom + pad;
  });
  const label = `Tech stack: ${STACK.map((s) => `${s.title} (${s.blurb.replace(/\.$/, '')}): ${s.items.map((i) => i[0]).join(', ')}.`).join(' ')}`;
  return svg(W, y + PAD, t, label, sectionTitle(t, W, 'Tech Stack', `${total} tools`, phone) + card(PAD, top, cw, y - top, t) + body);
}

// ─── GitHub activity: numbers with the data behind them ─────────────────────

function stats(t, phone, d) {
  const updated = day(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }), { year: true });
  const firstYear = Math.min(...d.years);
  const days = (n) => `${fmt(n)} day${n === 1 ? '' : 's'}`;
  const label = `On GitHub: ${fmt(d.total12)} contributions in the last year, a ${d.current.len}-day current streak${d.current.len ? `, since ${day(d.current.from)}` : ''}, longest streak ${days(d.longest.len)}, ${fmt(d.totalAll)} contributions since ${firstYear}.`;
  const small = (s, x, y, a = 'start') => text(x, y, s, { f: 'i4', s: 11, a, c: t.faint });

  // Each viz draws into the box (x, y, w, 46).
  const months = (() => {
    const m = new Map();
    for (const x of d.lastYear.flat()) m.set(x.date.slice(0, 7), (m.get(x.date.slice(0, 7)) || 0) + x.count);
    return [...m.entries()].slice(-12);
  })();
  const vizMonths = (x, y, w) => {
    const max = Math.max(1, ...months.map((m) => m[1])), step = w / months.length, bh = 30;
    let out = '';
    months.forEach(([, v], i) => {
      const h = Math.max(2, (v / max) * bh);
      out += rect(x + i * step, y + bh - h, step - 3, h, 2, `fill="${t.data}" fill-opacity="${i === months.length - 1 ? 1 : 0.35}"`);
    });
    const ml = (k) => MONTHS[Number(k.slice(5, 7)) - 1];
    return out + small(ml(months[0][0]), x, y + 45) + small(ml(months[months.length - 1][0]), x + w - 3, y + 45, 'end');
  };
  const vizStreak = (x, y, w) => {
    const last = d.days.slice(-14), step = w / last.length, inRun = (dd) => d.current.len && dd.date >= d.current.from;
    let out = '';
    last.forEach((dd, i) => {
      const fill = dd.count ? `fill="${t.data}" fill-opacity="${inRun(dd) ? 1 : 0.35}"` : `fill="${t.track}"`;
      out += rect(x + i * step, y + 4, step - 3, 24, 3, fill);
    });
    return out + small(day(last[0].date), x, y + 45) + small('Today', x + w - 3, y + 45, 'end');
  };
  const vizLongest = (x, y, w) => {
    const n = d.days.length, at = (date) => d.days.findIndex((dd) => dd.date === date);
    let out = rect(x, y + 12, w, 8, 4, `fill="${t.track}"`);
    if (d.longest.len) {
      const a = at(d.longest.from), b = at(d.longest.to);
      out += rect(x + (a / n) * w, y + 12, Math.max(4, ((b - a + 1) / n) * w), 8, 4, `fill="${t.data}"`);
    }
    return out + small(`${MONTHS[Number(d.days[0].date.slice(5, 7)) - 1]} ${d.days[0].date.slice(0, 4)}`, x, y + 45) + small('Today', x + w, y + 45, 'end');
  };
  const vizYears = (x, y, w) => {
    const ys = [...d.years].sort().slice(-3), max = Math.max(1, ...ys.map((yy) => d.yearTotals[yy]));
    let out = '';
    ys.forEach((yy, i) => {
      const cy = y + 6 + i * 16, bx = x + 34, bw = w - 34 - 44;
      out += text(x, cy + 4, String(yy), { f: 'i4', s: 11, c: t.muted });
      out += rect(bx, cy - 3, bw, 6, 3, `fill="${t.track}"`) + rect(bx, cy - 3, Math.max(6, (d.yearTotals[yy] / max) * bw), 6, 3, `fill="${t.data}" fill-opacity="${i === ys.length - 1 ? 1 : 0.45}"`);
      out += text(x + w, cy + 4, fmt(d.yearTotals[yy]), { f: 'i5', s: 11, a: 'end', c: t.fg });
    });
    return out;
  };
  const kpis = [
    { title: 'Contributions', value: fmt(d.total12), sub: 'in the last 12 months', viz: vizMonths },
    { title: 'Current streak', value: days(d.current.len), sub: d.current.len ? `since ${day(d.current.from)}` : 'no commits yet today', viz: vizStreak },
    { title: 'Longest streak', value: days(d.longest.len), sub: d.longest.len ? `${day(d.longest.from)} – ${day(d.longest.to, { year: true })}` : 'none yet', viz: vizLongest },
    { title: 'All time', value: fmt(d.totalAll), sub: `contributions since ${firstYear}`, viz: vizYears },
  ];
  const kpi = (k, x, y, w, h) => card(x, y, w, h, t)
    + text(x + P, y + 30, k.title, { f: 'i5', s: 13, c: t.muted })
    + text(x + P, y + 66, k.value, { f: 'i7', s: 30, c: t.fg })
    + text(x + P, y + 85, k.sub, { f: 'i4', s: 12.5, c: t.muted })
    + k.viz(x + P, y + 104, w - 2 * P);

  const W = phone ? 440 : 880, cw = W - 2 * PAD, gap = 10, kh = 164;
  let body = sectionTitle(t, W, 'GitHub activity', `Updated ${updated}`, phone);
  let y = phone ? 38 : 40;
  const kw = phone ? (cw - gap) / 2 : (cw - 3 * gap) / 4;
  kpis.forEach((k, i) => {
    const col = phone ? i % 2 : i, row = phone ? Math.floor(i / 2) : 0;
    body += kpi(k, PAD + col * (kw + gap), y + row * (kh + gap), kw, kh);
  });
  y += (phone ? 2 : 1) * (kh + gap);

  // Repos, stars and release downloads strip: hidden for now. To bring it back, uncomment this block,
  // delete the `return` just below it, and add the three numbers back to `label` above.
  return svg(W, y - gap + PAD, t, label, body);
  // // Smaller numbers share one strip.
  // const strip = [[fmt(d.publicRepos), 'public repos'], [fmt(d.stars), 'stars earned'], [fmt(d.downloads), 'release downloads']];
  // const sh = phone ? 70 : 60, sw = cw / strip.length;
  // body += card(PAD, y, cw, sh, t);
  // strip.forEach(([n, l], i) => {
  //   const x = PAD + i * sw;
  //   if (i) body += vline(x, y + 1, y + sh - 1, t.border);
  //   if (phone) {
  //     body += text(x + 18, y + 32, n, { f: 'i7', s: 22, c: t.fg }) + text(x + 18, y + 52, l, { f: 'i4', s: 12, c: t.muted });
  //   } else {
  //     body += text(x + P, y + 38, n, { f: 'i7', s: 24, c: t.fg }) + text(x + P + tw(n, 24, 'i7') + 8, y + 36, l, { f: 'i4', s: 13.5, c: t.muted });
  //   }
  // });
  // return svg(W, y + sh + PAD, t, label, body);
}

function legend(t, xEnd, y) {
  let x = xEnd - tw('More', 12, 'i4');
  let body = text(x, y, 'More', { f: 'i4', s: 12, c: t.muted });
  x -= 8 + 5 * 16;
  for (let l = 0; l < 5; l++) body += rect(x + l * 16, y - 10, 12, 12, 3, `fill="${t.heat[l]}"`);
  return body + text(x - 8, y, 'Less', { f: 'i4', s: 12, a: 'end', c: t.muted });
}

function cellNumber(t, cx, cy, count, level, size) {
  const s = String(count);
  const fs = r1(Math.min(size, (size * 3.2) / Math.max(3.2, s.length)));
  return text(cx, cy + fs * 0.35, s, { f: count ? 'i5' : 'i4', s: fs, a: 'middle', c: t.heatText[count ? level : 0] });
}

function headline(t, x, y, value, what) {
  return text(x, y, value, { f: 'i7', s: 22, c: t.fg }) + text(x + tw(value, 22, 'i7') + 8, y, what, { f: 'i4', s: 14, c: t.muted });
}

function graph(t, phone, weeks, what) {
  const all = weeks.flat();
  const total = all.reduce((s, x) => s + x.count, 0);
  const label = `${fmt(total)} contributions ${what}`;
  const isFirst = (dd) => dd.date.endsWith('-01');

  if (!phone) {
    const W = 880, cw = W - 2 * PAD, x0 = PAD + 24, avail = cw - 48;
    const multi = weeks.length > 27;
    const perRow = Math.ceil(weeks.length / Math.ceil(weeks.length / 27));
    const stepX = multi ? avail / 27 : Math.min(30.5, avail / weeks.length);
    const cell = stepX - 3, stepY = cell + 3;
    let body = headline(t, x0, PAD + 40, fmt(total), `contributions ${what}`);
    let y = PAD + 76;
    for (let r = 0; r < weeks.length; r += perRow) {
      const row = weeks.slice(r, r + perRow);
      let lastLabel = -9;
      row.forEach((w, col) => {
        const x = x0 + col * stepX;
        const first = w.find(isFirst) || (col === 0 && !row.slice(1, 3).some((x2) => x2.some(isFirst)) ? w[0] : null);
        if (first && col - lastLabel >= 3) { body += text(x, y, MONTHS[Number(first.date.slice(5, 7)) - 1], { f: 'i4', s: 12, c: t.muted }); lastLabel = col; }
        for (const dd of w) {
          const cy = y + 10 + new Date(dd.date + 'T00:00:00Z').getUTCDay() * stepY;
          body += rect(x, cy, cell, cell, 4, `fill="${t.heat[dd.level]}"`);
          body += cellNumber(t, x + cell / 2, cy + cell / 2, dd.count, dd.level, 11);
        }
      });
      y += 10 + 7 * stepY + 28;
    }
    const fy = y - 28 + 26;
    body += hline(PAD + 1, W - PAD - 1, fy - 22, t.border);
    body += text(x0, fy + 6, 'Contributions per day', { f: 'i4', s: 13, c: t.muted }) + legend(t, W - PAD - 24, fy + 6);
    const ch = fy + 24 - PAD;
    return svg(W, ch + 2 * PAD, t, label, card(PAD, PAD, cw, ch, t) + body);
  }

  // Phone: a calendar, one week per row.
  const W = 440, cw = W - 2 * PAD, colStep = 44, cw2 = 39, chh = 34, rowStep = 39, cx0 = 92;
  let body = text(PAD + 22, PAD + 40, fmt(total), { f: 'i7', s: 26, c: t.fg }) + text(PAD + 22, PAD + 62, `contributions ${what}`, { f: 'i4', s: 14, c: t.muted });
  'SMTWTFS'.split('').forEach((ch2, i) => { body += text(cx0 + cw2 / 2 + i * colStep, PAD + 98, ch2, { f: 'i4', s: 13, a: 'middle', c: t.muted }); });
  let y = PAD + 110;
  weeks.forEach((w, r) => {
    const first = w.find(isFirst) || (r === 0 ? w[0] : null);
    if (first) body += text(PAD + 22, y + chh / 2 + 5, MONTHS[Number(first.date.slice(5, 7)) - 1], { f: 'i4', s: 13, c: t.muted });
    for (const dd of w) {
      const x = cx0 + new Date(dd.date + 'T00:00:00Z').getUTCDay() * colStep;
      body += rect(x, y, cw2, chh, 6, `fill="${t.heat[dd.level]}"`);
      body += cellNumber(t, x + cw2 / 2, y + chh / 2, dd.count, dd.level, 16);
    }
    y += rowStep;
  });
  const fy = y + 22;
  body += hline(PAD + 1, W - PAD - 1, fy - 21, t.border);
  body += text(PAD + 22, fy + 6, 'Per day', { f: 'i4', s: 13, c: t.muted }) + legend(t, W - PAD - 22, fy + 6);
  const ch = fy + 24 - PAD;
  return svg(W, ch + 2 * PAD, t, label, card(PAD, PAD, cw, ch, t) + body);
}

// Smooth curve that never overshoots below zero (monotone cubic).
function curve(pts) {
  const n = pts.length, m = [], tg = [];
  for (let i = 0; i < n - 1; i++) m.push((pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]));
  tg[0] = m[0]; tg[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) tg[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { tg[i] = 0; tg[i + 1] = 0; continue; }
    const a = tg[i] / m[i], b = tg[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); tg[i] = k * a * m[i]; tg[i + 1] = k * b * m[i]; }
  }
  let out = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], h = (x1 - x0) / 3;
    out += ` C${r1(x0 + h)} ${r1(y0 + tg[i] * h)} ${r1(x1 - h)} ${r1(y1 - tg[i + 1] * h)} ${r1(x1)} ${r1(y1)}`;
  }
  return out;
}

function line30(t, phone, d) {
  const days = d.days.slice(-30);
  const total = days.reduce((s, x) => s + x.count, 0);
  const max = Math.max(1, ...days.map((x) => x.count));
  const avg = Math.round(total / days.length);
  const label = `${fmt(total)} contributions in the last 30 days`;
  const W = phone ? 440 : 880, cw = W - 2 * PAD, ls = 12, ip = phone ? 20 : 24;

  let body = text(PAD + ip, PAD + 36, 'Last 30 days', { f: 'i6', s: 16, c: t.fg });
  body += text(PAD + ip, PAD + 57, 'Contributions per day', { f: 'i4', s: 13, c: t.muted });
  const kpis = phone ? [['Total', fmt(total)], ['Peak', fmt(max)]] : [['Total', fmt(total)], ['Daily average', fmt(avg)], ['Peak', fmt(max)]];
  const kw = phone ? 82 : 120, hh = 82;
  kpis.forEach(([k, v], i) => {
    const x = W - PAD - (kpis.length - i) * kw;
    body += vline(x, PAD + 1, PAD + hh, t.border);
    body += text(x + 16, PAD + 32, k, { f: 'i4', s: 12, c: t.muted });
    body += text(x + 16, PAD + 60, v, { f: 'i7', s: phone ? 22 : 26, c: t.fg });
  });
  body += hline(PAD + 1, W - PAD - 1, PAD + hh, t.border);

  const x0 = PAD + ip + tw(fmt(max), ls, 'i4') + 10, x1 = W - PAD - ip;
  const top = PAD + hh + 28, bottom = PAD + hh + (phone ? 196 : 226);
  const X = (i) => x0 + (i * (x1 - x0)) / (days.length - 1);
  const Y = (v) => bottom - (v / max) * (bottom - top);
  const raw = max / 3.6, p = 10 ** Math.floor(Math.log10(raw));
  const stepV = [10, 5, 2.5, 2, 1].map((k) => k * p).find((v) => v <= raw * 1.1) || p;
  const ticks = [0];
  for (let v = stepV; v < max - stepV * 0.35; v += stepV) ticks.push(v);
  ticks.push(max);
  for (const v of ticks) {
    body += `<line x1="${r1(x0)}" y1="${r1(Y(v)) + 0.5}" x2="${r1(x1)}" y2="${r1(Y(v)) + 0.5}" stroke="${t.border}"${v ? ' stroke-dasharray="3 3"' : ''}/>`;
    body += text(x0 - 10, Y(v) + 4, fmt(Math.round(v)), { f: 'i4', s: ls, a: 'end', c: t.muted });
  }
  const every = phone ? 7 : 4;
  days.forEach((x, i) => {
    if ((days.length - 1 - i) % every) return;
    const [, mm, dd] = x.date.split('-').map(Number);
    body += text(X(i), bottom + 22, `${MONTHS[mm - 1]} ${dd}`, { f: 'i4', s: ls, a: i === days.length - 1 ? 'end' : 'middle', c: t.muted });
  });
  const pts = days.map((x, i) => [X(i), Y(x.count)]);
  const c = curve(pts), gid = `a${UID++}`;
  body += `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.data}" stop-opacity="0.22"/><stop offset="1" stop-color="${t.data}" stop-opacity="0"/></linearGradient></defs>`;
  body += `<path d="${c} L${r1(x1)} ${bottom} L${r1(x0)} ${bottom} Z" fill="url(#${gid})"/>`;
  body += `<path d="${c}" fill="none" stroke="${t.data}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  const [lx, ly] = pts[pts.length - 1];
  body += `<circle cx="${r1(lx)}" cy="${r1(ly)}" r="3.5" fill="${t.card}" stroke="${t.data}" stroke-width="2"/>`;
  const ch = bottom + 42 - PAD;
  return svg(W, ch + 2 * PAD, t, label, card(PAD, PAD, cw, ch, t) + body);
}

// ─── README ─────────────────────────────────────────────────────────────────

const pic = (name, alt, size = 'width="100%"', { phone = true } = {}) => {
  const src = (v) => `assets/${name}${v}.svg`;
  const sources = phone
    ? `<source media="(prefers-color-scheme: dark) and (max-width: 600px)" srcset="${src('-phone-dark')}"><source media="(max-width: 600px)" srcset="${src('-phone-light')}"><source media="(prefers-color-scheme: dark)" srcset="${src('-dark')}">`
    : `<source media="(prefers-color-scheme: dark)" srcset="${src('-dark')}">`;
  return `<picture>${sources}<img src="${src('-light')}" ${size} alt="${esc(alt)}"></picture>`;
};
const altOf = (s) => s.match(/aria-label="([^"]*)"/)[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

async function main() {
  const d = await fetchData();
  mkdirSync(ASSETS, { recursive: true });
  for (const f of readdirSync(ASSETS)) if (f.endsWith('.svg')) rmSync(join(ASSETS, f));

  const alts = {};
  const widths = {}; // intrinsic SVG widths, for sizing the buttons in %
  const emit = (name, fn, { phone = true, widen = true } = {}) => {
    for (const [mode, t] of Object.entries(THEMES)) {
      for (const ph of phone ? [false, true] : [false]) {
        USED = new Set();
        UID = 0;
        WIDEN = !ph && widen;
        const out = fn(t, ph);
        writeFileSync(join(ASSETS, `${name}${ph ? '-phone' : ''}-${mode}.svg`), out);
        widths[`${name}${ph ? '-phone' : ''}`] = Number(out.match(/width="([\d.]+)"/)[1]);
        if (mode === 'light' && !ph) alts[name] = altOf(out);
      }
    }
  };

  const sixMonthsAgo = new Date(); sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 6);
  const cut = iso(sixMonthsAgo);
  const weeks6 = d.lastYear.map((w) => w.filter((x) => x.date >= cut)).filter((w) => w.length);

  emit('brand', (t) => brand(t), { phone: false, widen: false });
  emit('hero', (t, p) => hero(t, p));
  for (const l of LINKS) emit(`badge-${l.key}`, (t, p) => badge(t, l, p), { widen: false });
  // Stand-in for the button set that does not belong on this screen size: wide and ~0 tall, so it shows nothing.
  writeFileSync(join(ASSETS, 'none.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1" viewBox="0 0 1000 1"/>\n');
  emit('about', (t, p) => about(t, p));
  emit('stack', (t, p) => stack(t, p));
  emit('github', (t, p) => stats(t, p, d));
  emit('graph-6m', (t, p) => graph(t, p, weeks6, 'in the last 6 months'));
  emit('graph-12m', (t, p) => graph(t, p, d.lastYear, 'in the last 12 months'));
  for (const y of d.years) emit(`graph-${y}`, (t, p) => graph(t, p, d.byYear[y], `in ${y}`));
  emit('line-30d', (t, p) => line30(t, p, d));

  const details = [
    [`Last 12 months: ${pl(d.total12, 'contribution')}`, 'graph-12m'],
    ...d.years.map((y) => [`${y}: ${pl(d.yearTotals[y], 'contribution')}`, `graph-${y}`]),
  ].map(([summary, name]) => `<details><summary>${esc(summary)}</summary>${pic(name, alts[name])}</details>`).join('\n');

  // Buttons: one set sized for desktop, one for phone, each a % of the column so they scale with the hero.
  // Each set swaps to assets/none.svg on the other screen size, so only one shows; every button keeps its own link.
  const button = (l, phone) => {
    const name = `badge-${l.key}`, v = phone ? '-phone' : '';
    const pct = ((widths[`${name}${v}`] / (phone ? 440 : 880)) * 100).toFixed(1);
    const hide = phone ? '(min-width: 601px)' : '(max-width: 600px)';
    return `<a href="${l.href}"><picture><source media="${hide}" srcset="assets/none.svg"><source media="(prefers-color-scheme: dark)" srcset="assets/${name}${v}-dark.svg"><img src="assets/${name}${v}-light.svg" width="${pct}%" alt="${esc(l.label)}"></picture></a>`;
  };
  const buttons = [false, true].map((ph) => LINKS.map((l) => button(l, ph)).join('\n')).join('\n<br>\n');

  const readme = `<!-- Generated by scripts/build.mjs. Edit the script, not this file: it is rebuilt every night. -->

<div>
<a href="${SITE}">${pic('brand', alts.brand, 'height="30"', { phone: false })}</a>
<br>
${pic('hero', alts.hero)}
<div align="center">
${buttons}
</div>
${['about', 'stack', 'github', 'graph-6m'].map((n) => pic(n, alts[n])).join('\n<br>\n')}
${details}
${pic('line-30d', alts['line-30d'])}
<br>
<sub>Numbers redrawn every night by a GitHub Action.</sub>
</div>
`;
  writeFileSync(join(ROOT, 'README.md'), readme);
  console.log(`Built ${readdirSync(ASSETS).length} SVGs. Last year: ${d.total12}, streak: ${d.current.len}, longest: ${d.longest.len}, all-time: ${d.totalAll}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
