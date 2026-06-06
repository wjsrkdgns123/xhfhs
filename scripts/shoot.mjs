#!/usr/bin/env node
// Screenshot harness for the design-completeness loop.
// Captures static (auth-free) routes from the built app so the GPT designer can
// review REAL renders (via gpt-design.mjs vision), not just code.
//
// Usage:  npm run build   &&   node scripts/shoot.mjs [route ...]
// Output: design-output/shots/<name>.<desktop|mobile>.png
//
// Self-contained: it boots `vite preview` itself, waits for the port, shoots, then kills it.
// Only static content pages are captured — lobby/room/verdict render from live
// Firebase/debate state and cannot be meaningfully shot headless.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 4173;
const BASE = `http://localhost:${PORT}`;
const OUT = 'design-output/shots';

const DEFAULT_ROUTES = [
  ['landing', '/'],
  ['learn', '/learn'],
  ['topics', '/topics'],
  ['fallacies', '/fallacies'],
  ['glossary', '/glossary'],
  ['famous', '/famous'],
  ['samples', '/samples'],
  ['formats', '/formats'],
  ['resources', '/resources'],
  ['about', '/about'],
  ['contact', '/contact'],
  ['privacy', '/privacy'],
  ['terms', '/terms'],
];

const argRoutes = process.argv.slice(2);
const routes = argRoutes.length
  ? argRoutes.map((r) => [r.replace(/[^a-z0-9]/gi, '') || 'root', r.startsWith('/') ? r : `/${r}`])
  : DEFAULT_ROUTES;

const VIEWPORTS = [
  ['desktop', 1280, 900],
  ['mobile', 390, 844],
];

async function waitForServer(url, ms = 30000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await sleep(500);
  }
  throw new Error('vite preview did not become ready in time');
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  const preview = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vite', 'preview', '--port', String(PORT), '--strictPort'],
    { stdio: 'ignore', shell: process.platform === 'win32' },
  );

  try {
    await waitForServer(BASE);
    const browser = await chromium.launch();
    for (const [vpName, w, h] of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      for (const [name, route] of routes) {
        try {
          await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 20000 });
          await sleep(600); // let fonts/animations settle
          const file = `${OUT}/${name}.${vpName}.png`;
          await page.screenshot({ path: file, fullPage: true });
          console.log(`shot ${file}`);
        } catch (e) {
          console.warn(`skip ${name} (${vpName}): ${e.message}`);
        }
      }
      await ctx.close();
    }
    await browser.close();
  } finally {
    preview.kill();
  }
  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
