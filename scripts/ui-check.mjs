// Screenshots (desktop / tablet / mobile) + console errors + automated a11y check (axe).
//
// Usage (`npm run dev` must be running):
//   npm run ui-check
//   npm run ui-check -- --out screenshots/my-change --pages /p/FAV/board,/p/FAV/board?issue=FAV-3
//
// Exits with code 1 on console/page errors, horizontal page overflow, or serious/critical a11y violations.
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const baseUrl = arg('url', 'http://localhost:5173');
const outDir = arg('out', 'screenshots');
const pages = arg('pages', '/,/p/FAV/board,/p/FAV/backlog,/p/FAV/board?issue=FAV-3,/p/FAV/settings').split(',');

const VIEWPORTS = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: 'tablet', viewport: { width: 768, height: 1024 }, deviceScaleFactor: 2, hasTouch: true },
  { name: 'mobile', viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true },
];

const slug = (path) =>
  path === '/'
    ? 'projects'
    : path
        .replace(/^\/p\//, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const problems = [];

for (const vp of VIEWPORTS) {
  // Fresh context = empty localStorage = sample data, so screenshots are reproducible.
  const context = await browser.newContext({ ...vp, locale: 'pl-PL' });
  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`[${vp.name}] console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`[${vp.name}] pageerror: ${err.message}`));

  for (const path of pages) {
    await page.goto(baseUrl + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    const file = `${outDir}/${vp.name}-${slug(path)}.png`;
    await page.screenshot({ path: file });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    if (overflow) problems.push(`[${vp.name}] ${path}: horizontal page overflow`);

    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async () => {
      const result = await window.axe.run(document, { resultTypes: ['violations'] });
      return result.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, count: v.nodes.length }));
    });
    for (const v of violations) {
      const line = `[${vp.name}] ${path}: a11y ${v.impact} ${v.id} (${v.count}×) – ${v.help}`;
      if (v.impact === 'serious' || v.impact === 'critical') problems.push(line);
      else console.log(`  warning: ${line}`);
    }
    console.log(`✓ ${file}`);
  }
  await context.close();
}

await browser.close();

if (problems.length) {
  console.error(`\nProblems found (${problems.length}):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log('\nNo console errors, horizontal overflow, or serious a11y violations.');
