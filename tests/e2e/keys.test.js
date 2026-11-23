// Keyboard and file-mode checks with real key presses (round 4 review, 22 Nov), in Edge or Chrome through Playwright (shared
// in Jemma's Journals' node_modules). Run by tests/e2e/test_keys.py: node keys.test.js <http address of the copy> <file:// address>.
// Every POST is blocked, so nothing is ever saved. Prints one JSON line: [{name, ok, error}].
const path = require("path");
const { chromium } = require(process.env.PLAYWRIGHT || path.join(__dirname, "..", "..", "..", "node_modules", "playwright"));
const [BASE, FILE] = process.argv.slice(2);
const ok = (v, msg) => { if (!v) throw new Error(msg || "not true"); };
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

async function open(browser, url, width, height = 900) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.route("**/*", r => r.request().method() === "POST" ? r.abort() : r.continue());
  await page.goto(url);
  await page.waitForSelector("#view .hero");
  await page.waitForTimeout(300);
  return page;
}
const inSide = page => page.evaluate(() => document.getElementById("side").contains(document.activeElement));
const focusDesc = page => page.evaluate(() => { const a = document.activeElement; return a ? a.tagName + (a.getAttribute("href") ? " " + a.getAttribute("href") : a.id ? "#" + a.id : "") : "none"; });

test("Tab and Shift+Tab stay inside the open drawer, 30 presses each way (899 wide)", async browser => {
  for (const h of ["#home", "#gen-2", "#p-25", "#fast", "#sets", "#nope"]) {
    const page = await open(browser, BASE + h, 899);
    try {
      await page.waitForFunction(() => window.JJFamily && document.getElementById("side").inert);
      await page.click("#menuBtn");
      ok(await inSide(page), `${h}: focus goes into the drawer`);
      for (const key of ["Tab", "Shift+Tab"]) for (let i = 1; i <= 30; i++) {
        await page.keyboard.press(key);
        ok(await inSide(page), `${h}: ${key} press ${i} left the drawer (focus on ${await focusDesc(page)})`);
      }
    } finally { await page.close(); }
  }
});

test("Skip to the page: the first Tab stop; Enter puts focus on the page and keeps the address (overnight review, 23 Nov)", async browser => {
  const page = await open(browser, BASE + "#hm-gen-1", 1600);
  try {
    await page.keyboard.press("Tab");
    ok(await page.evaluate(() => document.activeElement.id === "skipLink" && getComputedStyle(document.activeElement).left !== "-999px"), `the skip link first, on screen (got ${await focusDesc(page)})`);
    await page.keyboard.press("Enter"); await page.waitForTimeout(150);
    ok(await page.evaluate(() => document.activeElement.id === "view" && location.hash === "#hm-gen-1"), `focus on the page, still Kanto (got ${await focusDesc(page)}, ${await page.evaluate(() => location.hash)})`);
  } finally { await page.close(); }
});

test("at 1280, choosing a sidebar link by keyboard keeps focus on that link", async browser => {
  const page = await open(browser, BASE + "#go", 1280);   // GO's sidebar, then HOME's (built 22 Nov: Home, Every Pokémon, its regions, Fast tick)
  try {
    for (const h of ["#gen-1", "#fast", "#sets", "#go", "#gen-hisui", "#want", "#dex"]) {
      await page.focus(`#nav a[href="${h}"]`);
      await page.keyboard.press("Enter");
      await page.waitForFunction(x => location.hash === x, h);
      await page.waitForTimeout(150);
      const f = await page.evaluate(() => { const a = document.activeElement; return { href: a.getAttribute("href"), inNav: document.getElementById("nav").contains(a), on: a.classList.contains("on") }; });
      ok(f.inNav && f.href === h && f.on, `${h}: focus on the chosen (current) link, got ${JSON.stringify(f)}`);
    }
    await page.keyboard.press("Tab");   // the next Tab goes on from there, not from ← Jemma's Journals
    ok(await page.evaluate(() => document.activeElement.getAttribute("href")) === "#gen-1", `next Tab after Every Pokémon goes on to Kanto in the sidebar (got ${await focusDesc(page)})`);
    await page.goto(BASE + "#home"); await page.waitForTimeout(400);   // HOME's sidebar the same
    for (const h of ["#hm-gen-1", "#hm-fast", "#hm-dex", "#home"]) {
      await page.focus(`#nav a[href="${h}"]`);
      await page.keyboard.press("Enter");
      await page.waitForFunction(x => location.hash === x, h);
      await page.waitForTimeout(150);
      const f = await page.evaluate(() => { const a = document.activeElement; return { href: a.getAttribute("href"), inNav: document.getElementById("nav").contains(a), on: a.classList.contains("on") }; });
      ok(f.inNav && f.href === h && f.on, `HOME ${h}: focus on the chosen (current) link, got ${JSON.stringify(f)}`);
    }
  } finally { await page.close(); }
});

test("opened as a file (no family code): usable under 900px, no scrim, no empty footer buttons, home link to ../../site/index.html", async browser => {
  for (const width of [899, 390, 1280]) {
    const page = await open(browser, FILE + "#gen-2", width, 844);
    try {
      const s = await page.evaluate(() => {
        const cs = el => getComputedStyle(el), side = document.getElementById("side"), r = side.getBoundingClientRect();
        return { nofam: document.documentElement.classList.contains("no-family"), fam: !!window.JJFamily,
          scrimHiddenAttr: document.getElementById("scrim").hasAttribute("hidden"), scrim: cs(document.getElementById("scrim")).display,
          footLinks: cs(document.querySelector(".jj-foot-links")).display, sideVis: cs(side).visibility, sideLeft: r.left, sideW: r.width,
          menuBtn: cs(document.getElementById("menuBtn")).display, home: document.getElementById("homeLink").getAttribute("href"),
          sideInert: side.inert, wide: document.documentElement.scrollWidth };
      });
      ok(!s.fam && s.nofam, `${width}: no family code, .no-family set (${JSON.stringify(s)})`);
      ok(s.scrimHiddenAttr && s.scrim === "none", `${width}: the scrim stays hidden (${s.scrim})`);
      ok(s.footLinks === "none", `${width}: the empty footer buttons are hidden`);
      ok(s.home === "../../site/index.html", `${width}: ← Jemma’s Journals goes to ../../site/index.html (${s.home})`);
      ok(s.sideVis === "visible" && s.sideLeft >= 0 && s.sideW > 100 && !s.sideInert, `${width}: the sidebar is on screen (${JSON.stringify(s)})`);
      ok(s.wide <= width, `${width}: no sideways scrolling (${s.wide})`);
      if (width < 900) ok(s.menuBtn === "none", `${width}: no Menu button that does nothing`);
      await page.click('#nav a[href="#gen-1"]');   // the sidebar works: a click there opens Kanto
      await page.waitForFunction(() => location.hash === "#gen-1");
      await page.keyboard.press("Tab");
      ok(await page.evaluate(() => document.activeElement !== document.body), `${width}: Tab still moves through the page`);
    } finally { await page.close(); }
  }
});

(async () => {
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || "msedge", headless: true });
  const out = [];
  try {
    for (const [name, fn] of tests) {
      try { await fn(browser); out.push({ name, ok: true }); }
      catch (e) { out.push({ name, ok: false, error: String(e && e.stack || e).slice(0, 800) }); }
    }
  } finally { await browser.close(); }
  console.log(JSON.stringify(out));
})().catch(e => { console.log(JSON.stringify([{ name: "keys.test.js", ok: false, error: String(e && e.stack || e) }])); });
