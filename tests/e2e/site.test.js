// Page tests: loaded into the real site (a throwaway copy) in headless Chrome by tests/e2e/test_site.py.
// Each test drives the page the way she would (clicks, typing, routes) and checks what's on screen. Ticks go to the
// throwaway copy's server, so they're real saves into a copy, never her file.
(() => {
  const tests = [], wait = ms => new Promise(r => setTimeout(r, ms));
  const test = (name, fn) => tests.push([name, fn]);
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || ""} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
  const ok = (v, msg) => { if (!v) throw new Error(msg || "not true"); };
  const view = () => document.getElementById("view");
  // the browser stops changing the address if it's changed too often too fast, so wait until it has really changed
  const go = async h => {
    for (let t = 0; t < 15000; t += 250) {
      history.replaceState(null, "", h);
      if (location.hash === h) { route(); await wait(0); return; }
      await wait(250);
    }
    throw new Error(`the browser wouldn’t change the address to ${h}`);
  };
  const show = async h => { route(h.slice(1)); await wait(0); };   // for the sweeps: drawn without touching the address
  const click = el => { ok(el, "nothing to click"); el.dispatchEvent(new MouseEvent("click", {bubbles: true})); };
  const until = async (cond, ms = 3000) => { for (let t = 0; t < ms && !cond(); t += 20) await wait(20); ok(cond(), "timed out waiting"); };
  const strip = () => [...view().querySelectorAll(".bigboxes:not(.ssbox) .pc")].map(b => b.querySelector(".pclab b").textContent);
  const box = label => [...view().querySelectorAll(".bigboxes:not(.ssbox) .pc")].find(b => b.querySelector(".pclab b").textContent === label);
  const fact = name => { const dt = [...view().querySelectorAll("dt")].find(d => d.textContent === name); return dt && dt.nextElementSibling.textContent; };
  const server = (game = "go") => fetch("/api/collection" + (game === "go" ? "" : "?game=" + game)).then(r => r.json());
  const realFetch = window.fetch.bind(window);

  // ---------- every page ----------
  test("the page finds the server (ticks can be saved)", async () => {
    await until(() => !readOnly, 5000);
  });

  test("every page opens with no errors, blanks or leftovers, and every link on them goes somewhere", async () => {
    const problems = [], errs = [], seen = new Set(), links = new Set();
    const onErr = e => errs.push(e.message || String(e.reason)); addEventListener("error", onErr);
    await go("#go"); await show("#home");   // both games' lists made
    const routes = ["#home", "#go", "#hm-dex", "#hm-fast", "#games", "#dex", "#costumes", "#events", "#fast", "#want", "#coming", "#sets", ...(useGame("go"), allSets()).map(st => "#set-" + st.id),
      ...Object.keys(genById).map(g => "#gen-" + g), ...WORLDS.go.PAGE_KEYS.map(k => "#p-" + k),
      ...Object.keys(genById).map(g => "#hm-gen-" + g), ...WORLDS.home.PAGE_KEYS.map(k => "#hm-p-" + k),   // Pokémon HOME's pages too (22 Nov)
      ...(await show("#shield"), ["#shield", "#sh-dex", "#sh-fast", ...GAME_DATA.shield.sections.map(s => "#sh-gen-" + s.id), ...WORLDS.shield.PAGE_KEYS.map(k => "#sh-p-" + k)])];   // and Shield's (23 Nov)
    try {
      for (const h of routes) {
        if (seen.has(h)) continue; seen.add(h);
        const before = errs.length;
        try { await show(h); } catch (e) { problems.push(`${h}: ${e.message}`); continue; }
        const text = view().innerText;
        if (errs.length > before) problems.push(`${h}: ${errs.slice(before).join(" / ")}`);
        if (text.trim().length < 20) problems.push(`${h}: empty`);
        const bad = text.match(/\bundefined\b|\bNaN\b|\[object [A-Za-z]+\]|\bnull\b/); if (bad) problems.push(`${h}: shows “${bad[0]}”`);
        view().querySelectorAll('a[href^="#"]').forEach(a => links.add(a.getAttribute("href")));
        if (problems.length > 20) break;
      }
      for (const h of links) {
        if (seen.has(h) || h === "#") continue; seen.add(h);
        await show(h);
        const r = h.slice(1);
        if (!/^(home|shield|([a-z]+-)?(dex|gen-[\w-]+|p-\d+(-[a-z]+)?)|costumes|events)$/.test(r)) problems.push(`a link to ${h}, which isn’t a page`);
        if (/^(hm-)?p-\d+$/.test(r) && !view().querySelector(".mondetail")) problems.push(`link to ${h}: no Pokémon page`);
      }
    } finally { removeEventListener("error", onErr); }
    eq(problems, [], "problems:");
  });

  test("every picture the main pages use is there", async () => {
    const srcs = new Set(), missing = [];
    for (const h of ["#home", "#go", "#dex", "#costumes", "#events", "#p-6", "#p-25", "#p-94", "#p-382", "#gen-8", "#hm-p-25", "#hm-p-869", "#hm-gen-9", "#hm-fast"]) {
      await go(h); view().querySelectorAll("img[src]").forEach(i => srcs.add(i.getAttribute("src")));
      [...view().querySelectorAll("[style*='url(']")].forEach(el => { const m = /url\('?([^')]+)'?\)/.exec(el.getAttribute("style")); if (m) srcs.add(m[1]); });
    }
    const list = [...srcs];
    for (let i = 0; i < list.length; i += 25)
      await Promise.all(list.slice(i, i + 25).map(async s => {   // a busy computer can drop a request: try each up to three times
        for (let n = 0; n < 3; n++) { try { if (!(await realFetch(s, {method: "HEAD"})).ok) missing.push(s); return; } catch (e) { if (n === 2) throw e; await wait(300); } }
      }));
    ok(list.length > 100, `only ${list.length} pictures found`);
    eq(missing.slice(0, 20), [], `${missing.length} pictures missing:`);
  });

  test("every look's own picture loads (Lucky sparkles, Shadow flames, Mega background…)", async () => {
    const css = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules].map(r => r.cssText); } catch { return []; } }).join("\n");
    const files = [...new Set([...css.matchAll(/url\("?((?:variants|backgrounds)\/[^")]+)"?\)/g)].map(m => m[1]))];
    ok(files.length >= 6, `only ${files.length} look pictures in the styles`);
    const missing = [];
    await Promise.all(files.map(f => realFetch(f, {method: "HEAD"}).then(r => { if (!r.ok) missing.push(f); })));
    eq(missing, [], "missing (run tools/fetch_sprites.py --extras):");
  });

  // ---------- a Pokémon's page ----------
  test("Charizard's boxes: everything, with Mega X and Mega Y and the G-Max picture", async () => {
    await go("#p-6");
    eq(strip(), ["Caught", "Female", "Male", "Shiny", "Lucky", "XXL", "XXS", "Dynamax", "G-Max", "Mega X", "Mega Y", "Shadow", "Purified", "4★"]);
    ok(box("G-Max").querySelector("img").src.includes("GIGANTAMAX"), "G-Max shows the Gigantamax picture");
    ok(box("Mega X").querySelector("img").src.includes("MEGA_X"), "Mega X shows the Mega X picture");
    eq(fact("Mega"), "Available"); eq(fact("Gigantamax"), "Available");
  });

  test("boxes that can never be aren’t there; facts say Not possible", async () => {
    await go("#p-151");   // Mew: mythical, can't be traded, so never lucky; genderless
    ok(!strip().includes("Lucky"), "Mew has no Lucky box"); eq(fact("Lucky"), "Not possible");
    ok(!strip().includes("Female") && !strip().includes("Male"), "Mew is genderless");
    await go("#p-888");   // Zacian can't Dynamax
    eq(fact("Dynamax"), "Not possible");
    await go("#p-382");   // Kyogre: Primal
    ok(strip().includes("Primal"), "Kyogre has a Primal box");
  });

  test("a box on the strip ticks, saves, and ticking a shiny ticks caught too", async () => {
    await go("#p-25");
    const key = "d:25"; delete COL.have[key];
    await save({list: "have", key, tick: "c", on: false}); await save({list: "have", key, tick: "s", on: false});
    rerender();
    click(box("Shiny")); await until(() => (COL.have[key] || []).includes("c"));
    ok(COL.have[key].includes("s"), "shiny ticked");
    await wait(200); const s = await server();
    ok(s.have[key] && s.have[key].includes("s") && s.have[key].includes("c"), "saved to the server: shiny and caught");
    eq(box("Shiny").getAttribute("aria-pressed"), "true");
    click(box("Shiny")); await until(() => !(COL.have[key] || []).includes("s"));
    click(box("Caught")); await until(() => !COL.have[key]);
  });

  test("Shiny Shadow is a picture box under the evolutions, and clicking it ticks it", async () => {
    await go("#p-94");
    const b = view().querySelector(".ssbox .pc"); ok(b, "a Shiny Shadow box on Gengar's page");
    click(b.querySelector(".pcpic")); await until(() => (COL.have["d:94"] || []).includes("ss"));
    eq(location.hash, "#p-94", "stays on Gengar's page");
    click(view().querySelector(".ssbox .pc")); await until(() => !(COL.have["d:94"] || []).includes("ss"));
    await save({list: "have", key: "d:94", tick: "c", on: false}); delete COL.have["d:94"];
  });

  test("a costume card on its Pokémon's page ticks Caught when clicked (not a jump to the top)", async () => {
    await go("#p-94");
    const card = view().querySelector(".card[data-costume]"); ok(card, "Gengar has costume cards");
    const key = "c:" + card.dataset.costume, hashBefore = location.hash;
    click(card.querySelector(".pic") || card); await until(() => (COL.have[key] || []).includes("c"));
    eq(location.hash, hashBefore);
    click(view().querySelector(`.card[data-costume="${card.dataset.costume}"] .pic`)); await until(() => !COL.have[key]);
  });

  test("← and → step through the numbers", async () => {
    await go("#p-25");
    document.body.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight", bubbles: true})); await wait(50);
    eq(location.hash, "#p-26");
    document.body.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowLeft", bubbles: true})); await wait(50);
    eq(location.hash, "#p-25");
    await go("#hm-p-25");   // in Pokémon HOME, HOME's pages
    document.body.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowRight", bubbles: true})); await wait(50);
    eq(location.hash, "#hm-p-26");
    document.body.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowLeft", bubbles: true})); await wait(50);
    eq(location.hash, "#hm-p-25");
  });

  test("a Pokémon whose forms she tracks one by one: one card whose boxes count her forms and fill up (her pick, 15 Nov)", async () => {
    prefs.work = "all"; prefs.workShow = "all"; await go("#gen-4");
    const card = [...view().querySelectorAll(".card")].find(c => c.querySelector(".nm").textContent === "Rotom");
    const forms = ENTRIES.filter(e => e.dex === 479 && e.released);
    const n = forms.filter(e => has(dk(e), "c")).length;
    eq(card.querySelector(".tk.fb.c").title, `Caught: ${n} of ${forms.length} forms`);
    eq(card.querySelector(".tk.fb.c b").textContent, `${n}/${forms.length}`);
    eq(!!card.querySelector(".tk.fb.c .fill"), n > 0 && n < forms.length, "partly got: the filled part is drawn");
    eq(card.classList.contains("got"), n === forms.length, "marked only when every form is caught");
    ok(card.querySelector(".tk.fb.c").getAttribute("href") === "#p-479", "a box opens its page");
    const bulba = [...view().querySelectorAll(".card")].find(c => c.querySelector(".nm").textContent === "Turtwig");
    ok(bulba && !bulba.querySelector(".tk.fb") && bulba.querySelector("button.tk"), "other Pokémon keep their tick boxes");
    prefs.work = "shiny"; route();
    const one = [...view().querySelectorAll(".card")].find(c => c.querySelector(".nm").textContent === "Rotom");
    ok(one.querySelectorAll(".tk.fb").length === 1 && one.querySelector(".tk.fb.s"), "with a tab on: just that box, counted");
    prefs.work = "all";
  });

  test("a regional form is a Pokémon of its own: its own card and page, after the usual one (her call, 14 Nov)", async () => {
    await go("#p-58");
    ok(!document.querySelector(".formpick"), "Growlithe's page has no form picker");
    eq(document.querySelector(".pn.next").getAttribute("href"), "#p-58-hisuian");
    await go("#p-58-hisuian");
    ok(document.querySelector("h1").textContent.includes("Hisuian"), "Hisuian Growlithe's page");
    eq(document.querySelector(".pn.next").getAttribute("href"), "#p-59");
    eq([...document.querySelectorAll(".formpick small")].length, 0);
    await go("#p-128-paldean");
    eq([...document.querySelectorAll(".formpick small")].map(x => x.textContent), ["Paldean Combat", "Paldean Blaze", "Paldean Aqua"]);   // the game files' order (15 Nov)
    eq(groupByNumber(ENTRIES.filter(e => e.dex === 52)).length, 3, "Meowth, Alolan Meowth and Galarian Meowth: three cards");
    eq(groupByNumber(ENTRIES.filter(e => e.dex === 201)).length, 1, "Unown stays one card");
  });

  // ---------- the lists ----------
  test("clicking a card (not a box) opens that Pokémon's page", async () => {
    await go("#gen-1");
    click(view().querySelector('.card[data-id="4"] .pic') || view().querySelector('.card[data-id="4"]')); await wait(50);
    eq(location.hash, "#p-4");
  });

  test("the tabs at the top are the filter, in the game's order, in even rows where one row would cut them (phones; her pick, 21 Nov; second review)", async () => {
    prefs.work = "all"; await go("#gen-1");
    const tabs = [...view().querySelectorAll(".hero .stattab .slt")].map(b => b.textContent);
    eq(tabs, ["Pokémon", "Female", "Male", "Shiny", "Lucky", "XXL", "XXS", "Dynamax", "Gigantamax", "Mega", "Shadow", "Purified", "4★"]);   // the game's Pokédex order (her ask, 12 Nov)
    fitLabels();
    const rows = new Map();
    for (const t of view().querySelectorAll(".hero .stattab")) rows.set(t.offsetTop, (rows.get(t.offsetTop) || 0) + 1);
    const sizes = [...rows.values()];
    ok(sizes.length === 1 || Math.max(...sizes) - Math.min(...sizes) <= Math.ceil(13 / sizes.length), "even rows: " + sizes.join(" + "));
    ok(sizes.length === 1 || view().querySelector(".hero .stats.rows"), "rows only when one row doesn't fit");
    ok(!view().querySelector("#toolbar .worktab"), "no Filter row of buttons any more");
    const sw = view().querySelector("[data-showall]"); ok(sw && /Hide ones I have/.test(sw.textContent), "the Hide ones I have switch");
    click(view().querySelector('.hero .stattab[data-work="shiny"]')); await wait(30);
    eq(prefs.work, "shiny"); ok(view().querySelector('.hero .stattab[data-work="shiny"][aria-pressed="true"]'), "Shiny picked");
    click(view().querySelector('.hero .stattab[data-work="shiny"]')); await wait(30);
    eq(prefs.work, "all", "clicking it again: every box");
  });

  test("the Mega tab shows only Pokémon with a Mega, each card with only its Mega boxes", async () => {
    prefs.work = "all"; prefs.workShow = "all";
    await go("#gen-1");
    click(view().querySelector('.hero .stattab[data-work="mega"]'));
    await wait(30);
    const cards = [...view().querySelectorAll("#grid .card")];
    ok(cards.length > 5 && cards.length < 40, `${cards.length} cards`);
    for (const c of cards) {
      const labels = [...c.querySelectorAll(".tk span")].map(s => s.textContent);
      ok(labels.length && labels.every(l => /^(Mega( X| Y)?|Primal)$/.test(l)), `${c.dataset.id}: ${labels}`);
    }
    click(view().querySelector('.hero .stattab[data-work="mega"]'));   // click again: back to all
    prefs.work = "all"; prefs.workShow = "all"; keepPrefs();
  });

  test("search finds Pokémon by name and number", async () => {
    await go("#dex");
    q.value = "pikachu"; q.dispatchEvent(new Event("input")); await wait(250);
    ok([...view().querySelectorAll(".card .nm")].some(n => n.textContent === "Pikachu"), "Pikachu found");
    q.value = "#94"; q.dispatchEvent(new Event("input")); await wait(250);
    ok([...view().querySelectorAll(".card .nm")].some(n => n.textContent === "Gengar"), "#94 finds Gengar");
    q.value = ""; q.dispatchEvent(new Event("input")); await wait(250);
  });

  test("Event Pokémon shows only hers; the old pages lead there", async () => {
    ok(myCostumes().every(c => COL.costumes.includes(c.id)), "a costume she doesn't collect");
    ok(myEvents().every(ev => COL.went.includes(ev.id)), "an event she didn't go to");
    for (const old of ["#costumes", "#events"]) { await go(old); await wait(50); eq(location.hash, "#sets", old); }
  });

  test("the totals count each Pokémon once, whatever its forms (her rule, 11 Nov)", async () => {
    eq(counts(ENTRIES.filter(e => e.dex === 6)).megaOut, 1, "Charizard's Mega X and Y:");
    eq(counts(ENTRIES.filter(e => e.dex === 479)).shinyOut, 1, "all the Rotom:");
    for (const g of Object.keys(genById)) {
      const c = counts(ENTRIES.filter(e => e.gen === g || e.gen === +g));
      for (const k of ["maleOut", "femaleOut", "shinyOut", "luckyOut", "shadowOut", "dynamaxOut", "gmaxOut", "megaOut"])
        ok(c[k] <= c.speciesAll, `${g}: ${k} ${c[k]} is more than ${c.speciesAll} Pokémon`);   // out of every Pokémon that could have it, out in GO or not (12 Nov)
      eq(c.shinyOut, c.speciesAll, `${g}: every Pokémon can be shiny`);
    }
  });

  // ---------- region banners ----------
  test("her picked region pictures show with no switch", async () => {
    for (const [g, f] of Object.entries(REGION_CHOSEN).filter(([g]) => genById[g])) {   // GO's ten regions (Shield's paintings: its own test)
      await go("#gen-" + g);
      ok((view().querySelector(".hero").getAttribute("style") || "").includes("regions/" + f), `${g} shows ${f}`);
      ok(!view().querySelector(".shotsw"), `${g} has no switch`);
    }
  });

  test("every region has its picked map, and the scenery trial is gone (22 Nov)", async () => {
    ok(typeof REGION_SHOTS === "undefined" && typeof PIXEL_SHOTS === "undefined" && typeof heroArt === "undefined", "the trial's code is gone");
    for (const k of Object.keys(genById)) {
      await go("#gen-" + k);
      ok(view().querySelector(".hero").classList.contains("withshot"), `${k} has a picture`);
      ok(!view().querySelector(".shotsw, [data-shotg], .heroart"), `${k}: no switch or hidden parade left`);
    }
  });

  test("a collected costume whose event has no date yet doesn't break the pages", async () => {
    const id = DATA.costumes.find(c => c.code === "ANNIVERSARY_2026_THAILAND_01").id, before = [...COL.costumes];
    try {
      COL.costumes = [...COL.costumes, id];
      const st = allSets().find(s => s.cos.includes(id));
      ok(st, "it has a set"); ok(/to be announced/.test(st.meta), "dates to be announced");
      await go("#home"); ok(view().querySelector("h1"), "Home still draws");
    } finally { COL.costumes = before; }
  });

  test("every costume of a code with parts has its own part (Pumpkaboo's Halloween sits at Halloween 2022)", async () => {
    const CEV = DATA.costumeEvents, missing = DATA.costumes.filter(c => { const r = CEV[c.code] || CEV[c.code.replace(/_NOEVOLVE$/, "")]; return r && r.parts && !r.parts[`${c.name} ${c.costume}`]; });
    eq(missing.map(c => c.id), [], "no part");
  });

  test("XXL and XXS count only what can be (Pumpkaboo and Gourgeist sizes are fixed)", async () => {
    const k = counts(ENTRIES.filter(e => e.gen === "6"));
    eq(k.xsOut, fastSpecies("6").filter(sp => POSSIBLE.xs(sp.all)).length, "Kalos XXS as Fast tick counts it");
    ok(k.xsOut < k.out, "fewer than every Pokémon");
  });

  test("a got card under the Mega tab is marked in the Mega colour", async () => {
    const key = "d:6", before = COL.have[key];
    try {
      COL.have[key] = ["c", "mx", "my"]; prefs.work = "mega"; prefs.workShow = "all"; await go("#gen-1");
      const card = view().querySelector('.card[data-id="6"]');
      ok(card && /--hl:var\(--mega\)/.test(card.getAttribute("style") || ""), "--hl is --mega");
    } finally { if (before) COL.have[key] = before; else delete COL.have[key]; prefs.work = "all"; prefs.workShow = "all"; }
  });

  test("Hide ones I have hides a Pokémon caught in another form (not the ones tracked form by form)", async () => {
    const forms = ENTRIES.filter(e => e.dex === 664 && e.released), keys = forms.map(dk), before = keys.map(k => COL.have[k]);
    try {
      keys.forEach(k => delete COL.have[k]); COL.have[dk(forms[forms.length - 1])] = ["c"];
      prefs.work = "all"; prefs.workShow = "need"; await go("#gen-6");
      ok(!view().querySelector('.card[data-id^="664"]'), "Scatterbug hidden");
    } finally { keys.forEach((k, i) => { if (before[i]) COL.have[k] = before[i]; else delete COL.have[k]; }); prefs.workShow = "all"; }
  });

  test("her ask (22 Nov): Hide ones I have is off by default for all: picking a tab leaves it off, in every region and on Every Pokémon", async () => {
    try {
      prefs.work = "all"; prefs.workShow = "all";
      for (const page of ["#dex", "#gen-1", "#gen-9"]) {
        await go(page);
        view().querySelector('[data-work="shiny"]').click(); await wait(30);
        eq(prefs.work, "shiny", page + ": the Shiny tab picked");
        eq(view().querySelector("[data-showall]").getAttribute("aria-checked"), "false", page + ": Hide ones I have still off");
        view().querySelector('[data-work="shiny"]').click(); await wait(30);
      }
    } finally { prefs.work = "all"; prefs.workShow = "all"; keepPrefs(); }
  });

  test("games (her decisions, 22 Nov): HOME is the default; the sidebar switch changes game; GO's Home is #go", async () => {
    await go("#home");
    eq(document.querySelector('.game-switch a[aria-current]').textContent, "HOME", "opens on HOME");
    ok(!/Placeholder/.test(view().textContent), "HOME is built: no Placeholder (her ask, 22 Nov)");
    ok(!nav.querySelector('a[href="#gen-1"]') && nav.querySelector('a[href="#hm-gen-1"]') && nav.querySelector('a[href="#hm-fast"]'), "HOME's sidebar: its own regions and Fast tick, no GO pages");
    ok(!nav.querySelector('a[href="#sets"], a[href="#want"], a[href="#coming"]'), "no events, Looking for or What’s on in HOME");
    await go("#go");
    eq(document.querySelector('.game-switch a[aria-current]').textContent, "GO", "GO chosen");
    ok(nav.querySelector('a[href="#gen-1"]') && nav.querySelector('a[href="#go"].on'), "GO's sidebar as before, its Home lit");
    ok(view().querySelector(".hero .stats") && view().querySelectorAll(".gen .genmap").length === 10, "GO's Home: the totals, then the region hub with a map on each region");
    ok(!view().querySelector('.gen[href^="#gen-"] img'), "no Pokémon pictures on the region hub");
    eq(view().querySelector('.gen[href="#gen-1"] .genno').textContent, "#0001–#0151", "Kanto's National Pokédex numbers");
    await go("#home");
    eq([...view().querySelectorAll(".hero .stats .slt")].map(x => x.textContent), ["Pokémon", "Female", "Male", "Shiny", "Gigantamax"], "HOME's totals: only what HOME has (her notes, 22 Nov)");
    eq(view().querySelectorAll('.gen[href^="#hm-gen-"] .genmap').length, 10, "HOME's region hub, linking to HOME's regions");
    ok(!/Lucky|4★|Dynamax|Shadow|Purified|XXL|XXS|Mega|Placeholder/.test(view().textContent), "nothing on HOME's Home that HOME doesn't have");
    ok(!view().querySelector('img[src*="sprites/"]'), "no Pokémon pictures on HOME's Home");
    const hk = countsIn("home");
    eq(view().querySelector(".hero .stats .stat b").textContent.replace(/\s+/g, " ").trim(), `${num(hk.species)} of ${num(hk.speciesAll)}`, "HOME's Pokémon total");
    await go("#games");
    ok(document.querySelector(".games a.allgames.on"), "All games lit above the switch (her pick, 22 Nov evening)"); ok(!document.querySelector(".game-switch a[aria-current]"), "no game chosen there");
    eq(view().querySelectorAll(".allgame").length, GAMES.length, "a card per game");
    ok(!/Lucky|4★|Placeholder/.test(view().querySelector(".allgame").textContent), "HOME's card has real figures and no Lucky or 4★");
    eq(view().querySelector(".allgame .v").textContent, `${num(hk.species)} / ${num(hk.speciesAll)}`, "HOME's card counts as HOME's Home");
    ok(!view().querySelector(".card, img[src*='sprites/']"), "no Pokémon on All games");
    await go("#gen-1"); ok(document.querySelector('.games a.allgames[href="#games"]:not(.on)'), "the link is there on every page");
    eq(document.querySelector('.game-switch a[aria-current]').textContent, "GO", "a GO page shows GO");
    eq(getComputedStyle(document.querySelector(".brand b em")).color, getComputedStyle(document.querySelector(".brand b")).color, "the italic Pokédex not yellow (her note, 22 Nov)");
  });

  test("her answers (21 Nov): Hide ones I have is off when the app opens; a search shows everything matching; foil only with Shiny ticked", async () => {
    const saved = localStorage.getItem(PREFS_KEY);
    localStorage.setItem(PREFS_KEY, JSON.stringify(Object.assign({}, prefs, {workShow: "need"})));
    const f = document.createElement("iframe");
    f.style.cssText = "position:fixed;left:0;top:0;width:1280px;height:800px;border:0;opacity:0;pointer-events:none";
    f.src = "index.html#gen-1"; document.body.append(f);
    try {
      await until(() => f.contentDocument && f.contentDocument.querySelector("#view [data-showall]"), 15000);
      eq(f.contentDocument.querySelector("#view [data-showall]").getAttribute("aria-checked"), "false", "the switch off on opening, whatever was kept");
    } finally { f.remove(); if (saved === null) localStorage.removeItem(PREFS_KEY); else localStorage.setItem(PREFS_KEY, saved); }
    const key = "d:25", before = COL.have[key];
    try {
      COL.have[key] = ["c"]; prefs.work = "all"; prefs.workShow = "need";
      await go("#dex"); q.value = "pikachu"; route(); await wait(30);
      ok(view().querySelector('.card[data-id="25"]'), "Pikachu caught, Hide ones I have on: still found by the search");
      ok(!view().querySelector("[data-showall]"), "no Hide ones I have switch on a search");
      q.value = ""; prefs.workShow = "all"; await go("#gen-1");
      const pika = view().querySelector('.card[data-id="25"]');
      ok(pika && !pika.classList.contains("shiny") && getComputedStyle(pika.querySelector(".pic")).borderImageSource === "none", "caught, Shiny not ticked: no foil");
      ok([...view().querySelectorAll(".card")].filter(c => c.classList.contains("shiny")).every(c => c.querySelector('.tk.s[aria-pressed="true"]') || c.querySelector(".tk.fb.s")), "every foil card has its Shiny box ticked");
    } finally { q.value = ""; if (before) COL.have[key] = before; else delete COL.have[key]; prefs.workShow = "all"; }
  });

  test("a Pokémon page's banner has room under its chips, as much as above (her note, 21 Nov: Fire, Female… sat on the edge)", async () => {
    for (const h of ["#p-6", "#p-201", "#p-25"]) {
      await go(h);
      const hero = view().querySelector(".hero"), chips = hero.querySelector(".chips");
      const below = hero.getBoundingClientRect().bottom - chips.getBoundingClientRect().bottom;
      ok(below >= 24, `${h}: ${below}px under the chips`);
    }
  });

  test("no date on Home (her decision, 22 Nov: the “Pokémon data from the game, checked …” line is gone)", async () => {
    await go("#go");
    ok(!/checked|Pokémon data from the game/.test(view().textContent), "no checked line on Home");
  });

  test("Home's banner uses the smaller copies in regions/home/ (her pick, 22 Nov: Smaller)", async () => {
    await go("#go");
    const small = [...view().querySelectorAll(".hero .heropics i")].map(i => i.style.getPropertyValue("--pic"));
    eq(small.length, 10, "ten maps"); ok(small.every(u => /regions\/home\/[a-z]+-map-\d\.webp/.test(u)), `Home: ${small[0]}`);
    for (const u of small) { const r = await fetch(u.match(/url\('?([^')]+)/)[1]); ok(r.ok, `${u} is there`); }
    // the same small copies wherever the ten maps make a strip (round 5 review: about 13 MB of full maps on each of these pages)
    for (const h of ["#dex", "#want", "#coming"]) { await go(h);
      const pics = [...view().querySelectorAll(".hero .heropics i")].map(i => i.style.getPropertyValue("--pic"));
      ok(pics.length === 10 && pics.every(u => /regions\/home\//.test(u)), `${h}: ${pics[0]}`); }
    // one region's map: the full map, its phone copy and Kanto's lift (round 5 review: the white sky on Fast tick and Pokémon pages)
    await go("#p-6");
    const one = view().querySelector(".hero .heropics.one"), i = one && one.querySelector("i");
    ok(i && /regions\/kanto-map-2\.jpg/.test(i.style.getPropertyValue("--pic")) && /regions\/phone\/kanto-map-2\.webp/.test(i.style.getPropertyValue("--picsm")), "Charizard: Kanto's map and its phone copy");
    eq(one.style.getPropertyValue("--shotlift"), "10%", "Kanto's sky lifted out");
    ok((await fetch("regions/phone/kanto-map-2.webp")).ok, "the phone copy is there");
  });

  test("a tick on a list page redraws only what changed (round 5 review: Every Pokémon froze 5–6 s after every tick)", async () => {
    prefs.work = "all"; prefs.workShow = "all"; await go("#dex");
    const cards = view().querySelectorAll("#grid > .card"), first = cards[0], other = cards[5], hero = view().querySelector(".hero");
    const t0 = performance.now(); rerender(); const ms = performance.now() - t0;
    ok(view().querySelector("#grid > .card") === first && view().querySelectorAll("#grid > .card")[5] === other && view().querySelector(".hero") === hero, "nothing changed, nothing redrawn");
    ok(ms < 1500, `drawn again in ${Math.round(ms)} ms`);
    // a card whose ticks change is drawn again, the rest are kept (her ticks file is the throwaway copy's)
    const id = first.dataset.id, key = "d:" + id, had = has(key, "s");
    setTick(key, "s", !had); rerender();
    ok(view().querySelector("#grid > .card") !== first && view().querySelectorAll("#grid > .card")[5] === other, "only the changed card drawn again");
    eq(view().querySelector("#grid > .card").dataset.id, id);
    setTick(key, "s", had); rerender();
  });

  test("the picture strip: two even rows where one row is too tight, every label one size, at least 8px, none cut (round 5 review)", async () => {
    for (const width of [1600, 1280, 1000, 901]) {
      const f = document.createElement("iframe");
      f.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:800px;border:0;opacity:0;pointer-events:none`;
      f.src = "index.html#p-6"; document.body.append(f);
      try {
        await until(() => f.contentDocument && f.contentDocument.querySelector("#view .pcs-strip .pclab"), 15000); await wait(150);
        const w = f.contentWindow, d = f.contentDocument; w.fitLabels();
        const labs = [...d.querySelectorAll("#view .pcs-strip .pclab")], sizes = new Set(labs.map(l => w.getComputedStyle(l).fontSize));
        eq(sizes.size, 1, `${width}: one size (${[...sizes]})`); ok(parseFloat([...sizes][0]) >= 8, `${width}: ${[...sizes][0]}`);
        eq(labs.filter(l => w.textOver(l)).map(l => l.textContent).join(), "", `${width}: none cut`);
        const pc = d.querySelector("#view .pcs-strip .pc").getBoundingClientRect().width; ok(pc >= 72, `${width}: boxes ${Math.round(pc)}px wide`);
      } finally { f.remove(); }
    }
  });

  test("her picks from the Try switch (22 Nov): Card art in dark mode Brighter; Shiny #6C7786 and Lucky #B48600; the switch gone", async () => {
    const root = document.documentElement;
    const onlyDlc = () => [...document.querySelectorAll(".trybox [data-row]")].every(r => r.dataset.row === "dlcpics");   // the one Try switch now (23 Nov: Shield’s DLC pictures)
    ok(onlyDlc() && !("tryArt" in root.dataset) && !("tryBoxes" in root.dataset), "no old Try switch left");
    const hex = n => getComputedStyle(root).getPropertyValue(`--${n}`).trim().toUpperCase();
    eq(hex("shiny"), "#6C7786", "Shiny a little deeper"); eq(hex("lucky"), "#B48600", "Lucky a little deeper (a middle gold)");
    eq(hex("male"), "#078E5A", "the other boxes as they were"); eq(hex("hundo"), "#D14186"); eq(hex("mega"), "#C2571A");
    const wasMode = root.dataset.mode;
    prefs.work = "all"; prefs.workShow = "all"; await go("#gen-1");
    const art = () => getComputedStyle(view().querySelector('.card[data-id="6"] .pic')).backgroundImage;
    try {
      root.dataset.mode = "light"; const light = art();
      root.dataset.mode = "dark"; const dark = art();
      ok(dark !== light && (dark.match(/radial-gradient/g) || []).length === 2, `dark mode: Brighter, its own type-tinted window (${dark})`);
      const on = view().querySelector('.tk.l[aria-pressed="true"]');
      if (on) eq(getComputedStyle(on).backgroundColor, "rgb(180, 134, 0)", "a ticked Lucky box in the new gold");
    } finally { if (wasMode) root.dataset.mode = wasMode; else delete root.dataset.mode; }
  });

  test("the art window is tinted by the Pokémon's first type (her pick, 21 Nov); the 21 Nov Try switch is gone", async () => {
    ok([...document.querySelectorAll(".trybox [data-row]")].every(r => r.dataset.row === "dlcpics"), "no games or Form names Try switch (removed); only Shield’s DLC pictures (23 Nov)");
    eq(localStorage.getItem("jemmas-pokedex-try-formnames"), null, "the Form names choice cleared");
    ok(["jemmas-pokedex-try-homepage", "jemmas-pokedex-try-allgames", "jemmas-pokedex-try-gameswitch", "jemmas-pokedex-try-lastgame"].every(k => localStorage.getItem(k) === null), "its kept choices cleared");
    prefs.work = "all"; prefs.workShow = "all"; await go("#gen-1");
    const art = id => { const c = view().querySelector(`.card[data-id="${id}"]`); return c && getComputedStyle(c.querySelector(".pic")).backgroundImage; };
    eq(view().querySelector('.card[data-id="1"]').dataset.t1, "Grass", "Bulbasaur: Grass");
    ok(art("1") && art("4") && art("1") !== art("4"), "Grass and Fire tints differ");
  });

  test("male and female fully different (Frillish…) are two forms with their own boxes and no ♂/♀ box", async () => {
    const m = ENTRIES.find(e => e.id === "592"), f = ENTRIES.find(e => e.id === "592-female");
    ok(m && f && m.form === "Male" && f.form === "Female" && f.img !== m.img, "two entries, each its own picture");
    ok(!maleTick(m) && !femaleTick(m) && !maleTick(f) && !femaleTick(f), "no ♂/♀ boxes");
    ok(FORM_SPECIES.has(592), "tracked form by form");
    eq(JSON.stringify(ENTRIES.find(e => e.id === "667").evo.map(s => s.to)), JSON.stringify(["668", "668-female"]), "Litleo evolves into both");
    eq(ENTRIES.find(e => e.id === "592-female").evo[0].to, "593-female", "female to female");
    eq(bgMonsOf({backgroundPokemon: ["Unfezant"]}).map(e => e.id).join(), "521-female,521", "a background by name: both, female first");
    eq(bgMonsOf({cards: ["916"]}).map(e => e.id).join(), "916-female,916", "a background by card: both too");
    ok(byId["677"].dynamax && byId["678"].dynamax && byId["678-female"].dynamax, "Dynamax Espurr (flag-fixes.json) and what it evolves into");
    pageForm["592"] = "592-female"; await go("#p-592");
    ok(view().querySelector('.bigboxes[data-id="592-female"]'), "the female's own page boxes");
    delete pageForm["592"];
  });

  test("unticking a Shiny on a Pokémon's page unticks the Caught that came with it", async () => {
    const key = "d:7", clear = async () => { for (const t of ["c", "s"]) await save({list: "have", key, tick: t, on: false}); delete COL.have[key]; autoCaught.delete(key); };
    await clear();
    try {
      await tick(key, "s", true); ok(has(key, "c") && has(key, "s"), "Shiny ticks Caught too");
      await tick(key, "s", false); ok(!has(key, "c"), "and unticking it takes Caught away");
      await tick(key, "c", true); await tick(key, "s", true); await tick(key, "s", false);
      ok(has(key, "c"), "a Caught ticked by hand stays");
    } finally { await clear(); }
  });

  test("a refusal from the server says why", async () => {
    let msg = ""; const t0 = window.toast; window.toast = m => { msg = m; };
    try { ok(!await save({list: "have", key: "d:25", tick: "zz", on: true})); ok(/Not a box/.test(msg) && !/isn’t answering/.test(msg), msg); }
    finally { window.toast = t0; }
  });

  test("Looking for lists what's out and not got, and ticking one takes it off", async () => {
    const key = "d:83", clear = async () => { for (const t of ["c", "s"]) await save({list: "have", key, tick: t, on: false}); delete COL.have[key]; autoCaught.delete(key); };
    await clear();
    try {
      for (const [b] of WANT) { prefs.wantBox = b; await go("#want"); eq(view().querySelectorAll(".fc.want").length, wanted(b).length, b + ": one square each"); }
      prefs.wantBox = "s"; await go("#want");
      ok(view().querySelector('.fc.want[href="#p-83"]'), "Farfetch’d’s shiny is out and not got");
      ok(!wanted("l").some(u => UNTRADEABLE.has(u.e.dex)), "no lucky that can't be traded");
      ok(!wanted("s").some(u => !u.e.shiny), "only shinies that are out");
      // overlaps (her ask, 15 Nov): the other boxes needed show as icons; Only overlaps keeps just those
      const all = wantShown("s"), withAlso = all.filter(u => u.also.length);
      eq(view().querySelectorAll(".fc.want .wb").length, withAlso.length, "an icon set on each square that needs more");
      prefs.wantOverlap = true; await go("#want");
      eq(view().querySelectorAll(".fc.want").length, withAlso.length, "Only overlaps");
      ok([...view().querySelectorAll(".fc.want")].every(a => a.querySelector(".wb")), "every one has another box");
      prefs.wantOverlap = false;
      // Backgrounds (her ask, 15 Nov): each background's Pokémon she hasn't got with it, under its background
      prefs.wantBox = "bg"; await go("#want");
      const bgs = bgWanted(); eq(view().querySelectorAll(".fc.want").length, bgs.length, "one square each");
      const keys = new Set(allSets().flatMap(st => st.items.filter(i => i.bg).map(i => i.key)));
      eq(bgs.length, [...keys].filter(k => !has(k, "c")).length, "every background Pokémon not got, once each");
      prefs.wantBox = "s"; await go("#want");
      await tick(key, "s", true); await go("#want");
      ok(!view().querySelector('.fc.want[href="#p-83"]'), "gone once ticked");
    } finally { await clear(); prefs.wantBox = "s"; prefs.wantOverlap = false; }
  });

  test("Coming up: each event, and what's still needed from its Pokémon", async () => {
    const key = "d:624", before = COL.have[key], up0 = DATA.upcoming; let k0;
    try {
      delete COL.have[key];
      eq(upNeeds({id: "624", shiny: true, as: []}), ["c", "s"], "Pawniard not caught: new, and shiny");
      COL.have[key] = ["c", "s"]; eq(upNeeds({id: "624", shiny: true, as: []}), [], "nothing once caught and shiny");
      eq(upNeeds({id: "624", shiny: true, as: ["shadow"]}), ["sd"], "a Shadow raid asks for the Shadow");
      const iso = d => { const t = new Date(Date.now() + d * 864e5); return new Date(t - t.getTimezoneOffset() * 6e4).toISOString().slice(0, 23); };   // dates around today, so the test never goes stale
      DATA.upcoming = {fetched: "2026-11-16", backgrounds: {"t-ev": {background: "sb-gofest2025-eternatus"}}, events: [
        {id: "t-ev", name: "Test event", type: "Event", start: iso(-2), end: iso(5), link: "https://leekduck.com/events/", mons: [{name: "Pawniard", id: "624", shiny: true, as: []}]}]};
      comingSel = comingWeek = null; comingMonth = 0; await go("#coming");
      ok(view().querySelector(".calbar") && /\d{4}/.test(view().querySelector(".calnav h2").textContent), "a month of the calendar, named");
      ok(!view().querySelector(".caldetail"), "nothing open until clicked");
      click(view().querySelector('.calbar[data-comesel="t-ev"]')); await wait(50);
      ok(view().querySelector(".calweek + .caldetail") && /Test event/.test(view().querySelector(".caldetail").textContent), "the details open under the week clicked");
      ok(view().querySelector('.caldetail .fc.want.done[href="#p-624"]'), "Pawniard faded: nothing left to get");
      // the background's Pokémon still to get; the ones she has, faded, behind a button (18 Nov)
      const st = allSets().find(s => s.id === "sb-gofest2025-eternatus"), keys = st ? [...new Set(st.items.filter(i => i.bg).map(i => i.key))] : [];
      k0 = keys.find(k => !has(k, "c")); if (k0) COL.have[k0] = ["c"];   // in memory only
      await go("#coming");
      eq(view().querySelectorAll('.evmons .fc.withbg').length, keys.filter(k => !has(k, "c")).length, "the ones still to get");
      click(view().querySelector(".caldetail [data-comegot]")); await wait(50);
      eq(view().querySelectorAll('.evmons .fc.withbg').length, keys.length, "all of them once shown");
      eq(view().querySelectorAll('.evmons .fc.withbg.done').length, keys.filter(k => has(k, "c")).length, "the ones she has, faded");
      const nums = [...view().querySelectorAll('.evmons .fc.withbg')].map(a => +a.querySelector("span:not(.wb):not(.fcn)").textContent);
      ok(nums.every((n, i) => !i || n >= nums[i - 1]), "in Pokédex number order (her ask, 16 Nov)");
      click(view().querySelector("[data-comeclose]")); await wait(50);
      ok(!view().querySelector(".caldetail"), "Close shuts it");
      ok(view().querySelector(".calneed .huntbg"), "You need: the background coming back");
      // a kind for each toggle; one switched off leaves the calendar (her ask, 19 Nov)
      eq(view().querySelectorAll(".calkey").length, 7);
      // just past midnight ends on the day before (her rule, 19 Nov): 20:00 to 02:00 is one day on the calendar
      { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(20, 0, 0, 0); const e2 = new Date(d); e2.setDate(e2.getDate() + 1); e2.setHours(2, 0, 0, 0);
        const loc = t => new Date(t - t.getTimezoneOffset() * 6e4).toISOString().slice(0, 23);
        DATA.upcoming.events.push({id: "t-late", name: "Test late", type: "Event", start: loc(d), end: loc(e2), link: "https://leekduck.com/events/", mons: []});
        const t0 = new Date(); comingMonth = (d.getFullYear() - t0.getFullYear()) * 12 + d.getMonth() - t0.getMonth();   // its month, even on the last day of one
        comingSel = comingWeek = null; await go("#coming");
        const bars = [...view().querySelectorAll('.calbar[data-comesel="t-late"]')];
        ok(bars.length >= 1 && bars.every(b => +b.style.getPropertyValue("--c1") - +b.style.getPropertyValue("--c0") === 1), "one day wide");
        ok(/20:00/.test(bars[0].textContent), "with its start time");
        DATA.upcoming.events.pop(); comingMonth = 0; }
      const hide0 = prefs.comingHide;
      try {
        prefs.comingHide = ["ev"]; await go("#coming");
        ok(!view().querySelector('.calbar[data-comesel="t-ev"]') && view().querySelector('.calkey.off[data-comekind="ev"]'), "a kind switched off leaves the calendar");
      } finally { prefs.comingHide = hide0; comingSel = comingWeek = null; }
    } finally { if (before) COL.have[key] = before; else delete COL.have[key]; DATA.upcoming = up0; comingOpen.clear(); if (k0) delete COL.have[k0]; }
  });

  test("Unown's forms are A to Z, then ! and ?, everywhere: Looking for too, not F first (her note, 20 Nov)", async () => {
    const want = ENTRIES.filter(e => e.dex === 201 && e.released).map(e => e.form);
    for (const b of ["s", "l"]) {
      const got = wanted(b).filter(u => u.e.dex === 201).map(u => u.e.form);
      eq(got.join(""), want.filter(f => got.includes(f)).join(""), "Looking for " + b);
    }
    eq(want.slice(0, 3).join(""), "ABC", "the data's own order starts at A");
  });

  test("a background lists one Pokémon's forms in the game's order (Toxtricity Low Key before Amped, her question 20 Nov)", async () => {
    const ev = [...EVENTS, ...SPECIAL].find(e => e.id === "sb-gofest2025-eternatus");
    const tox = bgMonsOf(ev).filter(e => e.dex === 849).map(e => e.form);
    eq(tox.join(","), ENTRIES.filter(e => e.dex === 849).map(e => e.form).join(","));
  });

  test("every event's background Pokémon by number, the same on every page; Female before Male in an evolution family (order review, 20 Nov)", async () => {
    for (const ev of myEvents()) { const ds = bgMonsOf(ev).map(e => e.dex); ok(ds.every((d, i) => !i || d >= ds[i - 1]), ev.name); }
    await go("#p-520");
    const fam = [...view().querySelectorAll(".evo .evo-mon")].map(a => a.getAttribute("data-goform")).filter(id => /^521/.test(id));
    eq(fam.join(), "521-female,521", "Unfezant: Female first");
    eq(NEED_ORDER.join(), "c,s,dx,gx,mega,sd", "What's on boxes in the game's order");
  });

  test("costumes are in the game's order on every event (her rule, 20 Nov: Serena's Hat came before Calem's)", async () => {
    for (const st of allSets()) {
      const cs = st.items.filter(i => !i.bg).map(i => i.e);
      for (let i = 1; i < cs.length; i++) ok(!(cs[i - 1].dex === cs[i].dex && cosIdx.get(cs[i - 1].id) > cosIdx.get(cs[i].id)), `${st.title}: ${cs[i - 1].id} before ${cs[i].id}`);
      eq(st.cos.join(), cs.map(c => c.id).join(), st.title + ": its list matches");
    }
  });

  // ---------- Fast tick (trial) ----------
  test("Fast tick does costumes and backgrounds, each once, under its event", async () => {
    prefs.fastKind = "cos"; prefs.fastBox = "c"; await go("#fast");
    const cos = [...view().querySelectorAll(".fastset [data-fk]")];
    eq(cos.length, myCostumes().length, "one square per costume she collects");
    ok(cos.every(c => c.dataset.fk.startsWith("c:")), "costume keys");
    const key = cos[0].dataset.fk;
    cos[0].click(); await until(() => has(key, "c"));
    view().querySelector(`[data-fk="${key}"]`).click(); await until(() => !has(key, "c"));
    prefs.fastKind = "bg"; fastPage();
    const bgs = [...view().querySelectorAll(".fastset [data-fk]")].map(c => c.dataset.fk);
    eq(bgs.length, new Set(allSets().flatMap(st => st.items.filter(i => i.bg).map(i => i.key))).size, "every background Pokémon once");
    ok(bgs.every(k => k.startsWith("b:")), "background keys");
    prefs.fastBox = "s"; fastPage();
    ok(view().querySelectorAll(".fastset [data-fk]").length <= bgs.length, "Shiny: only where one is out");
    // Pokédex number order by default (her ask, 15 Nov), each Pokémon's costumes newest first as in the game; Event order still there
    prefs.fastKind = "cos"; prefs.fastBox = "c"; delete prefs.fastOrder; fastPage();
    const heads = [...view().querySelectorAll(".fastset h3")].map(h => +(/#(\d+)/.exec(h.textContent) || [])[1]);
    ok(heads.length && heads.every((n, i) => n && (!i || n >= heads[i - 1])), "sections by number, in order");
    const pika = [...view().querySelectorAll(".fastset")].find(s => /#0025 Pikachu/.test(s.textContent));
    if (pika) { const ords = [...pika.querySelectorAll("[data-fk]")].map(b => costumeById[b.dataset.fk.slice(2)].order); ok(ords.every((o, i) => !i || o >= ords[i - 1]), "Pikachu's costumes in the game's order"); }
    prefs.fastOrder = "event"; fastPage();
    eq(view().querySelectorAll(".fastset [data-fk]").length, cos.length, "Event order: the same costumes");
    ok(!/^#\d/.test(view().querySelector(".fastset h3").textContent), "Event order: under events");
    delete prefs.fastOrder; prefs.fastKind = "dex"; prefs.fastBox = "c";
  });

  test("Fast tick shows a whole region in number order, with Mega X and Y apart", async () => {
    prefs.fastGen = "1"; prefs.fastBox = "c"; await go("#fast");
    const cells = [...view().querySelectorAll(".fastgrid button.fc")];
    eq(cells.length, 151, "Kanto has 151");
    eq(cells[0].dataset.fast, "1", "Bulbasaur first"); eq(cells[150].dataset.fast, "151", "Mew last");
    prefs.fastBox = "mega"; fastPage();
    const zard = [...view().querySelectorAll('[data-fast="6"]')].map(c => c.dataset.t);
    ok(view().querySelectorAll(".fastgrid .fc").length < 151, "Mega lists only the ones that have a Mega");
    prefs.fastBox = "s"; fastPage(); eq(view().querySelectorAll(".fastgrid .fc").length, 151, "Shiny lists all 151, out or not");
    prefs.fastBox = "l"; fastPage(); eq(view().querySelectorAll(".fastgrid .fc").length, 150, "Lucky leaves out Mew (can't be traded)");
    prefs.fastBox = "mega"; fastPage();
    eq(zard, ["mx", "my"], "Charizard has X and Y");
    prefs.fastGen = "hisui"; prefs.fastBox = "c"; fastPage();
    ok([...view().querySelectorAll("button.fc")].every(c => +byId[c.dataset.fast].dex >= 899 || isRegional(byId[c.dataset.fast])), "Hisui: its Hisuian forms, then #899 on");
    const hisuian = new Set(ENTRIES.filter(e => e.gen === "hisui" && isRegional(e)).map(groupKey)).size;
    eq(view().querySelectorAll(".fastgrid .fc").length, 7 + hisuian, "Hisui has its 7 (Basculegion an empty slot) and a square for each Hisuian form (her call, 14 Nov)");
    eq(view().querySelector('.fc[data-fast="58-hisuian"]').title, "Hisuian Growlithe");
    ok(new RegExp(` / ${7 + hisuian}$`).test(view().querySelector(".fastn").textContent), "counted out of them all");
  });

  test("Fast tick ticks and unticks; a regional form has its own square", async () => {
    const clear = async k => { for (const t of ["c", "s"]) await save({list: "have", key: k, tick: t, on: false}); delete COL.have[k]; };
    for (const k of ["d:52", "d:52-alolan", "d:27"]) await clear(k);
    prefs.fastGen = "1"; prefs.fastBox = "s"; await go("#fast");
    click(view().querySelector('.fc[data-fast="27"]'));
    let s;
    for (let t = 0; t < 8000; t += 100) { s = await server(); if ((s.have["d:27"] || []).includes("c")) break; await wait(100); }   // saved one box after the other
    ok(s.have["d:27"] && s.have["d:27"].includes("s") && s.have["d:27"].includes("c"), "Sandshrew shiny and caught saved");
    ok(view().querySelector('.fc[data-fast="27"]').getAttribute("aria-pressed") === "true", "lit up");
    click(view().querySelector('.fc[data-fast="27"]'));
    for (let t = 0; t < 8000; t += 100) { s = await server(); if (!(s.have["d:27"] || []).includes("s")) break; await wait(100); }
    ok(!(s.have["d:27"] || []).includes("s"), "unticked");
    await save({list: "have", key: "d:52-alolan", tick: "s", on: true}); setTick("d:52-alolan", "s", true); fastPage();
    ok(view().querySelector('.fc[data-fast="52"]').getAttribute("aria-pressed") === "false", "Alolan Meowth's shiny doesn't light Meowth: a regional form is its own Pokémon (her call, 14 Nov)");
    prefs.fastGen = "7"; fastPage();
    ok(view().querySelector('.fc[data-fast="52-alolan"]').getAttribute("aria-pressed") === "true", "it lights its own square under Alola");
    for (const k of ["d:52", "d:52-alolan", "d:27"]) await clear(k);
    prefs.fastGen = "1"; prefs.fastBox = "c";
  });

  test("Fast tick's Forms check: every form of every Pokémon with forms, each ticked on its own (temporary, her ask 15 Nov)", async () => {
    const k = "d:37-alolan"; await save({list: "have", key: k, tick: "c", on: false}); delete COL.have[k];
    prefs.fastKind = "forms"; prefs.fastBox = "c"; await go("#fast");
    ok(view().querySelector('.fc[data-fast="201-a"]') || view().querySelector('.fc[data-fast^="201"]'), "Unown's letters are there");
    ok(!view().querySelector('.fc[data-fast="1"]'), "Bulbasaur (no forms) isn't");
    ok(!view().querySelector('.fc[data-fast^="664"]'), "Scatterbug (forms she doesn't track one by one) isn't");
    const cell = view().querySelector('.fc[data-fast="37-alolan"]');
    eq(cell.querySelector(".fcn").textContent, "Alolan");
    eq(view().querySelector('.fc[data-fast="37"] .fcn').textContent, "Kanto", "the usual one named by its region beside a regional form");
    click(cell);
    let s; for (let t = 0; t < 8000; t += 100) { s = await server(); if ((s.have[k] || []).includes("c")) break; await wait(100); }
    ok((s.have[k] || []).includes("c"), "Alolan Vulpix saved, on its own");
    await save({list: "have", key: k, tick: "c", on: false}); delete COL.have[k];
    prefs.fastKind = "dex";
  });

  test("Fast tick's Tick all saves every one left and lights them up", async () => {
    prefs.fastGen = "hisui"; prefs.fastBox = "c"; await go("#fast");
    const ids = [...view().querySelectorAll(".fastgrid button.fc")].map(c => c.dataset.fast);
    const clear = async () => { for (const id of ids) { await save({list: "have", key: "d:" + id, tick: "c", on: false}); delete COL.have["d:" + id]; } };
    await clear(); fastPage();
    const realConfirm = window.confirm; window.confirm = () => true;
    try { click(view().querySelector("[data-fastall]")); await until(() => !view().querySelector('.fastgrid .fc[aria-pressed="false"]') && !/Ticking/.test(view().querySelector(".fastn").textContent), 8000); }
    finally { window.confirm = realConfirm; }
    const s = await server();
    eq(ids.filter(id => !(s.have["d:" + id] || []).includes("c")), [], "all saved");
    await clear(); prefs.fastGen = "1";
  });

  test("Meltan and Melmetal can be Lucky (the one mythical that can be traded); Mew can't", async () => {
    ok(canLucky(byId["808"]) && canLucky(byId["809"]), "Meltan and Melmetal");
    ok(!canLucky(byId["151"]), "Mew");
    ok(!canLucky(byId["718"] || ENTRIES.find(e => e.dex === 718)), "Zygarde can't be traded");
    ok(!canXXS(byId["710-average"]) && !canXXL(byId["710-average"]) && canXXL(byId["710-super"]), "Pumpkaboo: no XXS, XXL only Super Size");
    ok(POSSIBLE.sd([byId["491"]]), "Darkrai can be Shadow");
  });

  test("XXL and XXS: boxes on cards and the page, a filter tab, and Fast tick tabs", async () => {
    await go("#p-25");
    ok(strip().includes("XXL") && strip().includes("XXS"), "on Pikachu's page");
    prefs.work = "all"; prefs.workShow = "all"; await go("#gen-1");
    ok(view().querySelector('.card[data-id="25"] [data-tick="xl"]') && view().querySelector('.card[data-id="25"] [data-tick="xs"]'), "on the card");
    ok(view().querySelector('[data-work="xxl"]') && view().querySelector('[data-work="xxs"]'), "filter tabs");
    prefs.fastGen = "1"; prefs.fastBox = "xl"; await go("#fast");
    eq(view().querySelectorAll(".fastgrid button.fc").length, 151, "Fast tick XXL: all 151");
    prefs.fastBox = "c";
  });

  test("Fast tick: a Caught ticked only because of Shiny comes off again with it; one she ticked herself stays", async () => {
    const clear = async k => { for (const x of ["c", "s"]) await save({list: "have", key: k, tick: x, on: false}); delete COL.have[k]; };
    await clear("d:35"); await clear("d:36");
    await save({list: "have", key: "d:36", tick: "c", on: true}); setTick("d:36", "c", true);   // Clefable already caught
    prefs.fastGen = "1"; prefs.fastBox = "s"; await go("#fast");
    for (const id of ["35", "36"]) { click(view().querySelector(`.fc[data-fast="${id}"]`)); await wait(400); }
    ok(has("d:35", "c") && has("d:35", "s"), "Clefairy shiny, and so caught");
    for (const id of ["35", "36"]) { click(view().querySelector(`.fc[data-fast="${id}"]`)); await wait(600); }
    const s = await server();
    ok(!(s.have["d:35"] || []).includes("c"), "Clefairy's Caught came off with its Shiny");
    ok((s.have["d:36"] || []).includes("c"), "Clefable stays Caught (ticked before)");
    await clear("d:35"); await clear("d:36"); prefs.fastBox = "c";
  });

  // ---------- more checks (19 Nov) ----------
  // a known app bug: the test says what should happen; while it fails it's reported as known (not a failure), and once
  // it passes it fails, so the note gets taken off
  const knownBug = (name, why, fn) => tests.push([name, fn, why]);
  const inMemory = async (keys, fn) => {   // change ticks in memory only for a check, then put them back
    const before = keys.map(k => COL.have[k]);
    try { keys.forEach(k => delete COL.have[k]); await fn(); }
    finally { keys.forEach((k, i) => { if (before[i]) COL.have[k] = before[i]; else delete COL.have[k]; }); }
  };

  test("the totals: gender forms, one-gender species, regional forms and forms tracked one by one", async () => {
    const of = n => counts(ENTRIES.filter(e => e.dex === n));
    const frillish = of(592);
    eq([frillish.speciesAll, frillish.maleOut, frillish.femaleOut], [1, 0, 0], "Frillish: one Pokémon, no ♂/♀ boxes (her call, 18 Nov)");
    const tauros = of(128);
    eq([tauros.speciesAll, tauros.maleOut, tauros.femaleOut], [2, 2, 0], "Tauros and the Paldean Tauros: two Pokémon, male only");
    eq([of(37).speciesAll, of(201).speciesAll], [2, 1], "Vulpix and Alolan Vulpix two, Unown one");
    eq([of(52).gmaxOut, of(52).speciesAll], [1, 3], "Meowth's three: only the usual one can Gigantamax");
    eq([of(888).dynamaxOut, of(151).luckyOut, of(808).luckyOut], [0, 0, 1], "Zacian no Dynamax, Mew no Lucky, Meltan Lucky");
    await inMemory(["d:201-f", "d:201-a", "d:592-female", "d:37-alolan", "d:37"], async () => {
      COL.have["d:201-a"] = ["c", "s"]; COL.have["d:592-female"] = ["c"]; COL.have["d:37-alolan"] = ["c", "s"];
      eq([of(201).species, of(201).shiny], [1, 1], "one Unown form caught and shiny: Unown counts");
      eq(of(592).species, 1, "the female Frillish counts Frillish");
      const v = of(37); eq([v.species, v.shiny, v.speciesAll], [1, 1, 2], "Alolan Vulpix counts itself, not Vulpix");
    });
  });

  test("ticking any box ticks Caught too and saves both; Caught goes again with the last of them", async () => {
    const key = "d:10", clear = async () => { for (const t of ["c", "l", "dx"]) await save({list: "have", key, tick: t, on: false}); delete COL.have[key]; autoCaught.delete(key); };
    await clear();
    try {
      await tick(key, "l", true); await tick(key, "dx", true);
      let s = await server(); eq([...s.have[key]].sort(), ["c", "dx", "l"], "saved:");
      await tick(key, "l", false); ok(has(key, "c"), "Dynamax still ticked, so still caught");
      await tick(key, "dx", false); s = await server();
      ok(!s.have[key], "nothing left saved once the last box is off");
    } finally { await clear(); }
  });



  test("What's on: a month at a time, You need for the month shown, kinds hidden, ended events gone, a bar clicked twice closes", async () => {
    const up0 = DATA.upcoming, hide0 = prefs.comingHide, now = new Date();
    const loc = t => new Date(t - t.getTimezoneOffset() * 6e4).toISOString().slice(0, 23);
    const at = h => loc(new Date(Date.now() + h * 36e5));
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 10), next2 = new Date(+next + 3 * 36e5);
    const M = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const monthName = d => `${M[d.getMonth()]} ${d.getFullYear()}`;
    const need = () => [...view().querySelectorAll(".calneed .hn")].map(n => n.textContent);
    await inMemory(["d:624", "d:25", "d:1"], async () => {
      try {
        DATA.upcoming = {fetched: "2026-11-19", backgrounds: {}, events: [
          {id: "t-now", name: "Test raid hour", type: "Raid Hour", start: at(-1), end: at(1), link: "https://leekduck.com/events/", mons: [{name: "Pawniard", id: "624", shiny: true, as: []}]},
          {id: "t-next", name: "Test Community Day", type: "Community Day", start: loc(next), end: loc(next2), link: "https://leekduck.com/events/", mons: [{name: "Pikachu", id: "25", shiny: true, as: []}]},
          {id: "t-gone", name: "Test ended", type: "Event", start: at(-3), end: loc(new Date(Date.now() - 6e4)), link: "https://leekduck.com/events/", mons: [{name: "Bulbasaur", id: "1", shiny: true, as: []}]}]};
        prefs.comingHide = []; comingSel = comingWeek = null; comingMonth = 0; await go("#coming");
        eq(view().querySelector(".calnav h2").textContent, monthName(now));
        ok(view().querySelector('[data-comemonth="-1"]').disabled, "no going back before this month");
        ok(!view().querySelector('.calbar[data-comesel="t-gone"]'), "an event that has ended is gone");
        ok(need().includes("Pawniard") && !need().includes("Pikachu") && !need().includes("Bulbasaur"), `You need this month: ${need()}`);
        const bar = () => view().querySelector('.calbar[data-comesel="t-now"]');
        click(bar()); await wait(30); ok(view().querySelector(".caldetail"), "opened");
        click(bar()); await wait(30); ok(!view().querySelector(".caldetail"), "clicked again: closed");
        click(bar()); await wait(30);
        click(view().querySelector('[data-comemonth="1"]')); await wait(30);
        eq(view().querySelector(".calnav h2").textContent, monthName(next));
        ok(!view().querySelector(".caldetail"), "moving month closes the details");
        ok(need().includes("Pikachu") && !need().includes("Pawniard"), `You need next month: ${need()}`);
        ok(view().querySelector('[data-comemonth="1"]').disabled, "nothing listed after next month");
        ok(view().querySelector('.calbar[data-comesel="t-next"]'), "the Community Day on the calendar");
        click(view().querySelector('.calkey[data-comekind="cd"]')); await wait(30);
        ok(!view().querySelector('.calbar[data-comesel="t-next"]'), "Community Days hidden");
        click(view().querySelector('.calkey[data-comekind="cd"]')); await wait(30);
        ok(view().querySelector('.calbar[data-comesel="t-next"]'), "and shown again");
        click(view().querySelector('[data-comemonth="0"]')); await wait(30);
        eq(view().querySelector(".calnav h2").textContent, monthName(now), "Back to this month");
        COL.have["d:624"] = ["c", "s"]; await go("#coming");
        ok(!need().includes("Pawniard"), "nothing needed once caught and shiny");
      } finally { DATA.upcoming = up0; prefs.comingHide = hide0; keepPrefs(); comingSel = comingWeek = null; comingMonth = 0; }
    });
  });

  test("Event Pokémon: the page's counts, each set's tile, and Home's card all agree", async () => {
    const sets = allSets(), seen = new Set(), items = sets.flatMap(s => s.items).filter(i => !seen.has(i.key) && seen.add(i.key));
    const want = [[sets.filter(s => s.items.every(setGot)).length, sets.length], [items.filter(i => i.bg && setGot(i)).length, items.filter(i => i.bg).length],
                  [items.filter(i => !i.bg && setGot(i)).length, items.filter(i => !i.bg).length]];
    ok(sets.length > 5 && want[1][1] > 0 && want[2][1] > 0, "her events and costumes are there");
    eq(new Set(sets.map(s => s.id)).size, sets.length, "set ids are unique");
    await go("#sets");
    eq([...view().querySelectorAll(".stats .stat b")].map(b => b.textContent.split(" of ").map(x => +x.replace(/,/g, ""))), want, "the page's tiles");
    eq(view().querySelectorAll(".settile").length, sets.length, "a tile per set");
    const st = sets.find(s => s.ev && s.items.length);
    eq(view().querySelector(`.settile[href="#set-${st.id}"] .setn`).textContent, `${st.items.filter(setGot).length} of ${st.items.length}`);
    await go("#set-" + st.id); ok(view().querySelector("h1").textContent === curly(st.title), "the set's own page");
    await go("#set-no-such-set"); eq(view().querySelector("h1").textContent, "Event Pokémon", "an unknown set: the list");
    await go("#go");
    eq([...view().querySelector('.gen[href="#sets"]').querySelectorAll(".v")].map(v => v.textContent.split(" / ").map(x => +x.replace(/,/g, ""))), [want[1], want[2], want[0]], "Home's card (Backgrounds, Costumes, Events)");
  });

  test("Home's region cards count as the region pages do", async () => {
    await go("#go");
    for (const [g] of GENS) {
      const k = counts(ENTRIES.filter(e => e.gen === g)), v = [...view().querySelector(`.gen[href="#gen-${g}"]`).querySelectorAll(".v")].map(x => x.textContent);
      eq(v, [[k.species, k.speciesAll], [k.shiny, k.shinyOut], [k.lucky, k.luckyOut], [k.hundo, k.out]].map(([a, b]) => `${num(a)} / ${num(b)}`), g);
    }
    eq(+nav.querySelector('a[href="#dex"] .n').textContent.replace(/,/g, ""), groupByNumber(ENTRIES).length, "Every Pokémon in the sidebar");
  });

  test("unknown addresses go Home; a Pokémon's page lights its region in the sidebar", async () => {
    for (const h of ["#gen-99", "#nonsense"]) {
      await go(h); ok(/Pokédex/.test(view().querySelector("h1").textContent), `${h} goes Home`);
    }
    await go("#p-58-hisuian"); eq(nav.querySelector("a.on").getAttribute("href"), "#gen-hisui");
    await go("#set-" + allSets()[0].id); eq(nav.querySelector("a.on").getAttribute("href"), "#sets");
  });

  test("search: forms, nothing found, and typing on Home goes to Every Pokémon", async () => {
    const search = async v => { q.value = v; q.dispatchEvent(new Event("input")); await wait(250); };
    try {
      await go("#dex");
      await search("alolan");
      const nms = [...view().querySelectorAll(".card")].map(c => c.dataset.id);
      ok(nms.length > 10 && nms.every(id => /-alolan$/.test(id)), `only Alolan forms: ${nms.slice(0, 5)}`);
      await search("zzzz"); ok(view().querySelector(".empty"), "Nothing here.");
      await search("farfetch'd"); ok(view().querySelector('.card[data-id="83"]'), "Farfetch’d typed straight");
      await search(""); await go("#go");
      await search("pikachu"); await until(() => location.hash === "#dex");
      ok(view().querySelector('.card[data-id="25"]'), "Pikachu on Every Pokémon");
      await search(""); await go("#home");   // in Pokémon HOME: HOME's own Every Pokémon
      await search("pikachu"); await until(() => location.hash === "#hm-dex");
      ok(view().querySelector('.card[data-id="25"]') && GAME === "home" && view().querySelector('.card a.nm[href="#hm-p-25"]'), "Pikachu found in HOME, its card opening HOME's page");
    } finally { q.value = ""; route(); }
  });

  test("search finds a name typed with a curly apostrophe, as the page shows it (Farfetch’d)", async () => {
    try {
      await go("#dex"); q.value = "farfetch’d"; q.dispatchEvent(new Event("input")); await wait(250);
      ok(view().querySelector('.card[data-id="83"]'), "Farfetch’d typed curly");
    } finally { q.value = ""; route(); }
  });

  test("Looking for: every tab, Mega X and Y apart, no impossible ones, and Copy the list", async () => {
    await inMemory(["d:6", "d:83"], async () => {
      const mega = wanted("mega").filter(u => u.e.dex === 6).map(u => u.what).sort();
      eq(mega, ["Mega X", "Mega Y"]);
      ok(!wanted("gx").some(u => isRegional(u.e) || !GMAX_SPECIES.has(u.e.dex)), "Gigantamax only for the 32");
      ok(!wanted("dx").some(u => NO_DYNAMAX.has(u.e.dex)), "no Dynamax Zacian");
      ok(wanted("s").every(u => u.e.released), "only what's out");
      for (const [b, l] of WANT_TABS) {
        prefs.wantBox = b; prefs.wantOverlap = false; await go("#want");
        eq(view().querySelector(`[data-wantbox="${b}"]`).getAttribute("aria-pressed"), "true", l);
        eq(+view().querySelector(".fastn").textContent.replace(/,/g, ""), wantShown(b).length, `${l}: the count`);
      }
      let copied = ""; const cb = navigator.clipboard, fake = {writeText: async t => { copied = t; }};
      Object.defineProperty(navigator, "clipboard", {value: fake, configurable: true});
      try { prefs.wantBox = "s"; await go("#want"); click(view().querySelector("[data-wantcopy]")); await until(() => copied); }
      finally { Object.defineProperty(navigator, "clipboard", {value: cb, configurable: true}); }
      ok(copied.startsWith("Shiny I’m looking for:\nKanto: ") && copied.includes("#83 Farfetch’d"), copied.slice(0, 120));
    });
    prefs.wantBox = "s";
  });

  // ---------- narrow windows and phones (21 Nov, her ask): a top bar with a Menu button, the sidebar a drawer ----------

  test("review fixes (21 Nov): focus stays on the box pressed; part-caught form cards aren't faded; background cards have a number and the foil", async () => {
    prefs.work = "all"; prefs.workShow = "all"; await go("#gen-1");
    const b = view().querySelector('[data-work="shiny"]'); b.focus(); click(b); await wait(80);
    ok(document.activeElement && document.activeElement.dataset.work === "shiny", "focus kept on the tab pressed");
    prefs.work = "all"; await go("#gen-1");
    const some = [...view().querySelectorAll(".card.some")];
    ok(some.every(c => !c.classList.contains("got")), "some = not every form");
    if (some.length) ok(!/grayscale/.test(getComputedStyle(some[0].querySelector(".pic img")).filter), "part-caught: picture not greyed");
    const ev = myEvents()[0]; await go("#set-" + ev.id);
    const bg = view().querySelector(".card.bgcard"); ok(bg && /^#\d{4}$/.test(bg.querySelector(".no").textContent), "a background card's number");
  });

  test("no box label or square name is cut short, measured to the fraction of a pixel (21 Nov review: Mega X, Gigantamax, Crabominable)", async () => {
    prefs.work = "all"; prefs.workShow = "all";
    for (const h of ["#dex", "#gen-9", "#p-849", "#p-150", "#want"]) {
      await go(h); fitLabels();
      const cut = [...view().querySelectorAll(".boxgrid .tk > span:not(.fill)")].filter(textOver).map(s => s.textContent);
      const names = [...view().querySelectorAll(".fastset .fc .fcn")].filter(n => n.scrollWidth > n.clientWidth).map(n => n.textContent);
      eq([...new Set(cut)].join(), "", h + " box labels");
      eq([...new Set(names)].join(), "", h + " square names");
    }
  });

  test("the banner tabs are never cut, never under 7px over 900 wide and 8.5px on phones (other tiles 10px), keep their icons and never slide sideways, at 1600, 1450, 1280, 1100, 1000, 901 and 390 (second review, 21 Nov; her decision, 22 Nov)", async () => {
    const problems = [];
    for (const width of [1600, 1450, 1280, 1100, 1000, 901, 390]) {
      const f = document.createElement("iframe");
      f.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:800px;border:0;opacity:0;pointer-events:none`;
      f.src = "index.html#gen-1"; document.body.append(f);
      try {
        await until(() => f.contentDocument && f.contentDocument.querySelector("#view .hero .stattab") && f.contentDocument.querySelector("#view .card"), 15000);
        const w = f.contentWindow, d = f.contentDocument;
        for (const h of ["#gen-1", "#dex", "#gen-4", "#go", "#sets"]) {
          w.location.hash = h; await until(() => w.location.hash === h && d.querySelector("#view .hero .stats")); await wait(80); w.fitLabels();
          const st = d.querySelector("#view .hero .stats"), hero = st.closest(".hero").getBoundingClientRect();
          for (const t of st.querySelectorAll(":scope > .stat")) {
            const l = t.querySelector(".slt"); if (!l) continue;
            const icon = t.querySelector(".sl > svg, .sl > .i");
            if (w.textOver(l)) problems.push(`${width} ${h}: “${l.textContent}” cut`);
            if (parseFloat(w.getComputedStyle(l).fontSize) < (t.classList.contains("stattab") ? (width > 900 ? 7 : 8.5) : 10)) problems.push(`${width} ${h}: “${l.textContent}” ${w.getComputedStyle(l).fontSize}`);
            if (t.getBoundingClientRect().right > hero.right + .5) problems.push(`${width} ${h}: “${l.textContent}” past the banner's edge`);
            if (!icon || w.getComputedStyle(icon).display === "none") problems.push(`${width} ${h}: “${l.textContent}” lost its icon`);
          }
          if (st.scrollWidth > st.clientWidth + 1) problems.push(`${width} ${h}: the tab row slides sideways`);
          if (d.documentElement.scrollWidth > width) problems.push(`${width} ${h}: the page is ${d.documentElement.scrollWidth} wide`);
        }
        w.JJFamily.fitCredits();
        for (const x of d.querySelectorAll(".jj-foot [data-jj-credits] .dot")) {   // the footer: a “·” never ends a line (family rules)
          const next = x.nextElementSibling, shown = w.getComputedStyle(x).display !== "none" && w.getComputedStyle(x).visibility !== "hidden";
          if (shown && next.getBoundingClientRect().top > x.getBoundingClientRect().top + 2) problems.push(`${width}: a “·” ends a line in the footer`);
        }
      } finally { f.remove(); }
    }
    eq(problems, [], "problems:");
  });

  test("every region page and Every Pokémon have tabs of the same size, in one row, at every width over 900 (her note, 21 Nov: Kanto's were bigger and didn't fit in a line; her decision, 22 Nov: one smaller row at 901-1450 too)", async () => {
    const problems = [];
    for (const width of [1600, 1584, 1450, 1280, 1100, 1000, 901]) {   // 1584: her 1600 window less its scrollbar
      const f = document.createElement("iframe");
      f.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:800px;border:0;opacity:0;pointer-events:none`;
      f.src = "index.html#gen-1"; document.body.append(f);
      try {
        await until(() => f.contentDocument && f.contentDocument.querySelector("#view .hero .stattab"), 15000);
        const w = f.contentWindow, d = f.contentDocument, seen = [];
        for (const h of ["#dex", ...Object.keys(genById).map(g => "#gen-" + g)]) {
          w.location.hash = h; await until(() => w.location.hash === h && d.querySelector("#view .hero .stattab")); await wait(80); w.fitLabels();
          const t = [...d.querySelectorAll("#view .hero .stats > .stat")], first = t[0].getBoundingClientRect();
          const perRow = t.filter(x => x.offsetTop === t[0].offsetTop).length;
          seen.push({h, w: Math.round(first.width * 10) / 10, ht: Math.round(first.height), row: Math.min(perRow, 13) === t.length ? "one" : perRow});
        }
        const k = seen.find(x => x.h === "#gen-1");
        for (const x of seen) if (x.w !== k.w || x.ht !== k.ht || x.row !== k.row) problems.push(`${width}: ${x.h} ${x.w}×${x.ht} (${x.row}) but Kanto ${k.w}×${k.ht} (${k.row})`);
        if (k.row !== "one") problems.push(`${width}: Kanto's tabs not in one line`);   // 1280 too: smaller writing rather than two rows (her answer, 21 Nov), and down to 901 (22 Nov)
        if (d.querySelector("#view .hero .stats.rows")) problems.push(`${width}: tabs in rows`);
        const sizes = new Set([...d.querySelectorAll("#view .hero .stattab .slt")].map(l => w.getComputedStyle(l).fontSize));
        if (sizes.size !== 1) problems.push(`${width}: tab writing in ${[...sizes].join(", ")}`);
      } finally { f.remove(); }
    }
    eq(problems, [], "problems:");
  });

  test("the family of evolutions never slides sideways: on a phone and at 940 it stacks downwards (second review, 21 Nov)", async () => {
    const problems = [];
    for (const width of [390, 940]) {
      const f = document.createElement("iframe");
      f.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:800px;border:0;opacity:0;pointer-events:none`;
      f.src = "index.html#p-6"; document.body.append(f);
      try {
        await until(() => f.contentDocument && f.contentDocument.querySelector("#view .evo"), 15000);
        const w = f.contentWindow, d = f.contentDocument;
        for (const h of ["#p-6", "#p-133", "#p-265", "#p-236"]) {
          w.location.hash = h; await until(() => w.location.hash === h && d.querySelector("#view .evo .evo-mon.here")); await wait(80); w.fitLabels();
          const e = d.querySelector("#view .evo");
          if (e.scrollWidth > e.clientWidth + 1) problems.push(`${width} ${h}: ${e.scrollWidth} in ${e.clientWidth}`);
          const here = e.querySelector(".evo-mon.here").getBoundingClientRect(), box = e.getBoundingClientRect();
          if (here.left < box.left - 1 || here.right > box.right + 1) problems.push(`${width} ${h}: this Pokémon out of sight`);
        }
      } finally { f.remove(); }
    }
    eq(problems, [], "problems:");
  });

  test("on a phone (390 wide), the Pokédex's own part of the drawer: it opens on this region's link, which says so; a link goes there, focus to the page; the bar name goes home (the rest: the parent's family suite)", async () => {
    const f = document.createElement("iframe");   // a phone-sized window of its own, same site
    f.style.cssText = "position:fixed;left:0;top:0;width:390px;height:844px;border:0;opacity:0;pointer-events:none";
    f.src = "index.html#gen-8";
    document.body.append(f);
    try {
      await until(() => f.contentDocument && f.contentDocument.getElementById("menuBtn") && f.contentDocument.querySelector("#view .card") && f.contentWindow.JJFamily && f.contentDocument.getElementById("side").inert, 15000);
      const w = f.contentWindow, d = f.contentDocument, btn = d.getElementById("menuBtn"), side = d.getElementById("side");
      const isOpen = () => d.documentElement.classList.contains("jj-menu-open") && side.classList.contains("jj-open");
      btn.click(); ok(isOpen(), "opens");
      ok(d.activeElement === side.querySelector('.nav a[href="#gen-8"]'), "focus on this page's link (Galar)");
      eq(side.querySelector('.nav a[href="#gen-8"]').getAttribute("aria-current"), "page", "this page's link says so");
      side.querySelector('.nav a[href="#gen-1"]').click();
      ok(!isOpen(), "choosing a link shuts it");
      await until(() => d.activeElement === d.getElementById("view"));   // then focus on the page (the family drawer moves it just after closing)
      await until(() => w.location.hash === "#gen-1");
      eq(d.querySelector("#topbar .topname").getAttribute("href"), "#home", "the name goes home");
    } finally { f.remove(); }
  });

  // ---------- the family's shared code (22 Nov, her decision: it lives in Jemma's Journals, loaded at /family/) ----------
  test("the Pokédex's own colours for the family's dark mode: the bar colour (light and dark) and the page's paper (the rest of /family/: the parent's family suite)", async () => {
    const root = document.documentElement, before = root.dataset.mode;
    eq(document.querySelector('meta[name="theme-color"]').getAttribute("data-dark"), "#4E1018", "the dark bar colour for family.js");
    const paper = () => getComputedStyle(root).getPropertyValue("--paper").trim().toUpperCase();
    try {
      root.dataset.mode = "light"; eq(paper(), "#ECE7E0", "light paper");
      root.dataset.mode = "dark"; eq(paper(), "#171012", "dark paper");
    } finally { root.dataset.mode = before; }
    const html = await (await realFetch("index.html", {cache: "no-store"})).text();
    ok(/<meta name="theme-color" content="#7A1E2A"/.test(html), "the light bar colour");
  });

  // a window whose api/collection answers as given (no server, a web host's 404, her server failing): __stub__.html, the page
  // with a stand-in fetch put in before its own scripts (tests/e2e/test_site.py); nothing reaches the server, no POST is sent
  const stubWindow = async answer => {
    const f = document.createElement("iframe");
    f.style.cssText = "position:fixed;left:0;top:0;width:1280px;height:800px;border:0;opacity:0;pointer-events:none";
    f.src = "__stub__.html?answer=" + answer + "#home";
    document.body.append(f);
    await until(() => f.contentDocument && f.contentDocument.querySelector("#view .hero") && f.contentWindow.JJFamily && f.contentWindow.__answered, 15000);
    await wait(300);   // the redraw after the answer
    return f;
  };
  test("online with no save server (a web host's 404, no answer, its page instead): view only, quietly (like her Library)", async () => {
    for (const answer of ["404", "405", "none", "html"]) {
      const f = await stubWindow(answer);
      try {
        const w = f.contentWindow, d = f.contentDocument, label = answer;
        ok(d.documentElement.classList.contains("view-only"), `${label}: view only`);
        ok(!d.querySelector("#view .notice"), `${label}: no error note`);
        w.route("p-6"); await wait(50);
        const b = d.querySelector('#view .bigboxes [data-tick]'); ok(b, `${label}: the boxes still show her ticks`);
        const was = b.getAttribute("aria-pressed");
        b.dispatchEvent(new w.MouseEvent("click", {bubbles: true})); await wait(100);
        eq(d.querySelector('#view .bigboxes [data-tick]').getAttribute("aria-pressed"), was, `${label}: a click changes nothing`);
        ok(d.getElementById("toast").hidden, `${label}: and says nothing`);
        eq(w.__posts, [], `${label}: nothing sent`);
        const unmarked = p => [...d.querySelectorAll("#view button:is([data-tick],[data-fast],[data-fk],[data-went],[data-fastall])")].filter(x => x.getAttribute("aria-disabled") !== "true").length;
        ok(d.querySelectorAll("#view [data-tick]").length > 5, `${label}: boxes on the page`);
        eq(unmarked(), 0, `${label}: every box on a Pokémon's page is aria-disabled (round 4 review)`);
        eq(w.getComputedStyle(b).cursor, "default", `${label}: no hand cursor on a box`);
        w.route("fast"); await wait(50);
        ok(!d.querySelector("#view [data-fastall]") || w.getComputedStyle(d.querySelector("#view [data-fastall]")).display === "none", `${label}: no Tick all`);
        ok(d.querySelectorAll("#view [data-fast],#view [data-fk]").length > 5, `${label}: squares on Fast tick`);
        eq(unmarked(), 0, `${label}: every Fast tick square is aria-disabled`);
        w.route("sets"); await wait(50); eq(unmarked(), 0, `${label}: Event Pokémon's boxes too`);
        w.route("gen-1"); await wait(50); eq(unmarked(), 0, `${label}: a region's cards too`);
        w.route("hm-p-6"); await wait(50); ok(d.querySelectorAll("#view [data-tick]").length >= 5, `${label}: HOME's boxes show`); eq(unmarked(), 0, `${label}: HOME's boxes aria-disabled too`);
        w.route("hm-fast"); await wait(50); eq(unmarked(), 0, `${label}: HOME's Fast tick too`);
        eq(w.__posts, [], `${label}: still nothing sent`);
      } finally { f.remove(); }
    }
  });
  test("with her server the boxes aren't marked disabled (view only is only for no server)", async () => {
    await until(() => !readOnly, 5000);
    await go("#p-6");
    ok(view().querySelectorAll("[data-tick]").length > 5, "boxes");
    eq([...view().querySelectorAll("[aria-disabled]")].length, 0, "no aria-disabled with a save server");
  });

  // ---------- links made by someone else (round 4 review, 22 Nov): nothing from the address may reach the page as markup ----------
  test("a crafted ?pic=, ?fit=, ?ratio= or ?boxes= can't add attributes or run script; good values still work", async () => {
    const bad = ['x" data-pwn="yes', "x' data-pwn='yes", '"><img src=x onerror="parent.__pwned=1">', "x');}</style><img src=x onerror=parent.__pwned=1>",
      "x;--shot:url(javascript:parent.__pwned=1)", "center/cover\" data-pwn=\"1", "1/1\"><b data-pwn>"];
    const frame = async (qs, h) => {
      const f = document.createElement("iframe");
      f.style.cssText = "position:fixed;left:0;top:0;width:1280px;height:800px;border:0;opacity:0;pointer-events:none";
      f.src = "index.html?" + qs + h; document.body.append(f);
      await until(() => f.contentDocument && f.contentDocument.querySelector("#view .hero"), 15000);
      await wait(200); return f;
    };
    window.__pwned = 0;
    for (const v of bad) for (const k of ["pic", "fit", "ratio", "boxes"]) {
      const f = await frame(`${k}=${encodeURIComponent(v)}`, k === "boxes" ? "#p-6" : "#gen-1");
      try {
        const d = f.contentDocument, hero = d.querySelector("#view .hero");
        eq(d.querySelectorAll("[data-pwn], #view img[onerror], #view b[data-pwn]").length, 0, `${k}=${v}: no attribute or element added`);
        ok(!(hero.getAttribute("style") || "").includes("pwn") && !(hero.getAttribute("style") || "").includes("javascript"), `${k}=${v}: the banner's style is untouched`);
        if (k === "pic") ok((hero.getAttribute("style") || "").includes("regions/kanto-map-2.jpg"), `${k}=${v}: her picked map is used instead`);
        if (k === "boxes") ok(d.querySelector("#view .bigboxes.pcs-strip"), `${k}=${v}: the usual strip`);
      } finally { f.remove(); }
    }
    await wait(200);
    eq(window.__pwned, 0, "no script ran");
    const f = await frame("pic=johto-map-1.jpg&fit=center%2045%25%2Fcover&ratio=16%2F9", "#gen-1");   // pictures of options still work
    try {
      const st = f.contentDocument.querySelector("#view .hero").getAttribute("style");
      ok(st.includes("regions/johto-map-1.jpg") && st.includes("--shotfit:center 45%/cover") && st.includes("--shotratio:16/9"), `good values used: ${st}`);
    } finally { f.remove(); }
  });

  test("her own server failing (a 500, or a broken answer) still says so", async () => {
    for (const answer of ["500", "broken", "503"]) {
      const f = await stubWindow(answer);
      try {
        const d = f.contentDocument, label = answer;
        ok(!d.documentElement.classList.contains("view-only"), `${label}: not view only`);
        ok(/couldn’t read your ticks/.test(d.querySelector("#view .notice")?.textContent || ""), `${label}: the note says the server couldn’t read her ticks`);
      } finally { f.remove(); }
    }
  });

  // ---------- the foot of every page (21 Nov, the family rules for all her sites): name, two lines, Back to top and Dark mode ----------
  test("Back to top and Dark mode are at the foot of every page, with the Pokédex's own line 1 and credits (the footer's looks: the parent's family suite)", async () => {
    const routes = ["#home", "#go", "#hm-dex", "#games", "#dex", "#sets", "#want", "#coming", "#fast", "#p-6", "#p-58-hisuian", ...Object.keys(genById).map(g => "#gen-" + g), ...allSets().slice(0, 3).map(st => "#set-" + st.id)];
    const problems = [];
    for (const h of routes) {
      await show(h);
      const top = document.querySelector("[data-jj-top]"), md = document.querySelector("[data-jj-mode]"), foot = top && top.closest("footer.jj-foot");   // the family footer (/family/family.js fills the buttons)
      if (!top || !md || !foot || foot !== md.closest("footer")) { problems.push(`${h}: buttons missing`); continue; }
      if (!/Back to top/.test(top.textContent) || !/(Dark|Light) mode/.test(md.textContent)) problems.push(`${h}: words “${top.textContent}”, “${md.textContent}”`);
      if (foot.getBoundingClientRect().top < view().getBoundingClientRect().bottom - 1) problems.push(`${h}: not below the page`);
      if (getComputedStyle(foot).display === "none") problems.push(`${h}: hidden`);
      const name = foot.querySelector(".jj-name"), lines = foot.querySelectorAll("p[data-jj-line1], p[data-jj-credits]");
      if (!name || name.textContent !== "Jemma’s Pokédex") problems.push(`${h}: the name`);
      if (lines.length !== 2 || lines[0].textContent !== "No cookies, no tracking, no ads. Made with HTML, CSS, JavaScript and Python, kept on GitHub.") problems.push(`${h}: line 1`);
      const credits = [...foot.querySelectorAll("[data-jj-credits] .cr")].map(c => c.textContent);
      if (credits.join(" | ") !== "Pokémon pictures, backgrounds and region maps from the Pokémon games | Fonts: Instrument Serif and Manrope | Icons by Lucide, Phosphor, Tabler, MingCute and Solar (480 Design)") problems.push(`${h}: credits ${credits.join(" | ")}`);
      { const cl = foot.querySelector("p[data-jj-credits]"); if (cl.scrollWidth > cl.clientWidth + 1) problems.push(`${h}: the credits line can’t wrap`); }   // round-2 review: it couldn’t, so pages scrolled sideways at 601–1113
    }
    eq(problems, [], "problems:");
  });





  test("text contrast is at least 4.5:1 in light and in dark", async () => {
    const root = document.documentElement, before = root.dataset.mode;
    const probe = document.createElement("div"); document.body.append(probe);
    const rgb = v => { probe.style.color = ""; probe.style.color = v; const c = getComputedStyle(probe).color, n = c.match(/[\d.]+/g).slice(0, 3).map(Number); return /^color\(srgb/.test(c) ? n.map(x => x * 255) : n; };   // color-mix() comes back as color(srgb 0–1)
    const lum = c => { const [r, g, b] = c.map(x => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
    const ratio = (a, b) => { const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((p, q) => q - p); return (x + .05) / (y + .05); };
    const pairs = [["--ink", "--paper"], ["--ink", "--surface"], ["--muted", "--paper"], ["--muted", "--surface"], ["--deep-text", "--paper"], ["--deep-text", "--surface"],
      ["--deep-text", "--page-hi"], ["--deep-text", "--page-lo"], ["--card-ink", "--card-stock"], ["--card-mute", "--card-stock"], ["--tab-ink", "--tab-bg"], ["--tab-mute", "--tab-bg"]];
    const low = [];
    try {
      for (const m of ["light", "dark"]) {
        root.dataset.mode = m;
        for (const [fg, bg] of pairs) { const r = ratio(`var(${fg})`, `var(${bg})`); if (r < 4.5) low.push(`${m}: ${fg} on ${bg} ${r.toFixed(2)}`); }
        const btn = getComputedStyle(document.querySelector("[data-jj-mode]")).color, footText = "var(--jj-muted)";   // the footer lines' colour (site.css --jj-muted)
        for (const bg of ["--page-hi", "--page-lo", ...(m === "light" ? ["#CFC5BC"] : [])]) { const r = ratio(footText, bg.startsWith("#") ? bg : `var(${bg})`); if (r < 4.5) low.push(`${m}: the foot lines on ${bg} ${r.toFixed(2)}`); }   // #CFC5BC: the darkest of the shaded band behind them (second review)
        for (const bg of ["--page-hi", "--page-lo"]) { const r = ratio(btn, `var(${bg})`); if (r < 4.5) low.push(`${m}: the foot buttons on ${bg} ${r.toFixed(2)}`); }
      }
    } finally { root.dataset.mode = before; probe.remove(); }
    eq(low, [], "too faint:");
  });

  // last of all: nothing the tests did (this page and every window they opened) broke the Content Security Policy
  test("Content Security Policy (her decision, 22 Nov): only the site's own code runs, and nothing on any page breaks the policy", async () => {
    const POLICY = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'";
    const real = await realFetch("index.html").then(r => r.text());
    const m = real.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/);
    ok(m, "index.html has the policy"); eq(m[1], POLICY, "the policy");
    ok(real.indexOf(m[0]) < real.indexOf('<script src="/family/mode.js"'), "the policy comes before any of the site's scripts");
    ok(!/<script(?![^>]*\bsrc=)[^>]*>/.test(real.replace('<script src="__tests__/csp-watch.js"></script>', "")), "no inline script in index.html");
    ok(!/\son[a-z]+=/i.test(real), "no inline handlers in index.html");
    // the policy is on: inline code is refused
    const n = window.__csp.length; window.__inlineRan = false;
    const s = document.createElement("script"); s.textContent = "window.__inlineRan = true"; document.head.append(s); await wait(50); s.remove();
    ok(!window.__inlineRan, "an inline script didn't run"); ok(window.__csp.length > n, "and was reported");
    window.__csp.splice(n);
    const b = document.createElement("button"); b.setAttribute("onclick", "window.__inlineRan = true"); document.body.append(b); b.click(); b.remove(); await wait(20);
    ok(!window.__inlineRan, "an inline handler didn't run"); window.__csp.splice(n);
    // every kind of page, light and dark
    const root = document.documentElement, before = root.dataset.mode;
    try {
      for (const mode of ["light", "dark"]) {
        root.dataset.mode = mode;
        for (const h of ["#home", "#go", "#hm-dex", "#hm-gen-1", "#hm-p-25", "#hm-fast", "#games", "#dex", "#gen-1", "#gen-8", "#gen-hisui", "#p-6", "#p-201", "#p-58-hisuian", "#sets", "#want", "#coming", "#fast", "#nothing-here"]) { await show(h); await wait(30); }
      }
    } finally { root.dataset.mode = before; }
    await wait(200);
    eq(window.__csp, [], "Content Security Policy violations:");
  });

  // ---------- Pokémon HOME (built 22 Nov, her ask: “Home needs to be fully built… Used shared stuff between games”) ----------
  const NOT_HOME = /\b(Lucky|4★|XXL|XXS|Dynamax|Mega|Shadow|Purified|Costumes?|Event backgrounds|Buddy distance)\b/;
  test("HOME: every species #0001–#1025, each with a picture; GO's entry shared wherever HOME has the same Pokémon", async () => {
    await go("#hm-dex");
    const dexes = new Set(ENTRIES.map(e => e.dex));
    eq(dexes.size, 1025, "every species"); ok([...dexes].every(n => n >= 1 && n <= 1025), "#0001–#1025");
    const noPic = ENTRIES.filter(e => !sprite(e.img)).map(e => e.id);
    eq(noPic, [], "every HOME entry has a picture (GO's, or HOME's own where GO has none)");
    const shared = HOME_DATA.entries.filter(h => h.go).length;
    ok(shared > 1000, `most entries are GO's own: ${shared}`);
    const pika = WORLDS.go.byId["25"], hp = byId["25"];
    eq([hp.name, hp.img, hp.desc], [pika.name, pika.img, pika.desc], "Pikachu shares GO's name, picture and Pokédex text");
    ok(!WORLDS.go.byId["25-original-cap"] && byId["25-original-cap"], "HOME's own forms (Pikachu in a cap) only in HOME");
    ok(!byId["150-armored"] && WORLDS.go.byId["150-armored"], "GO's own forms (Armored Mewtwo) only in GO");
    ok(ENTRIES.every(e => e.released && !e.shadow && !e.dynamax && !(e.mega || []).length), "no GO-only boxes on any HOME entry");
  });

  test("HOME pages show only HOME's boxes (her notes, 22 Nov): Caught, Female, Male, Shiny, Gigantamax", async () => {
    await go("#hm-gen-1");
    const labels = new Set([...view().querySelectorAll(".card .tk span:not(.fill)")].map(x => x.textContent));
    ok([...labels].every(l => ["Caught", "Female", "Male", "Shiny", "Gigantamax"].includes(l)), `card boxes: ${[...labels]}`);
    eq([...view().querySelectorAll(".hero .stattab .slt")].map(x => x.textContent), ["Pokémon", "Female", "Male", "Shiny", "Gigantamax"], "the tabs");
    ok(!view().querySelector("[data-notout]"), "no Not in GO switch");
    await go("#hm-p-6");
    eq(strip(), ["Caught", "Female", "Male", "Shiny", "G-Max"], "Charizard's strip in HOME");
    ok(!NOT_HOME.test(view().querySelector(".mondetail").textContent), "facts: nothing HOME hasn't got");
    eq(fact("Shiny"), "Available"); eq(fact("Gigantamax"), "Available");
    ok(/From Pokémon GO’s Pokédex/.test(view().querySelector(".dexfrom").textContent), "GO's Pokédex text says it's GO's");
    ok(!/Candy/.test(view().querySelector(".evo").textContent), "the evolution family without GO's candy");
    ok(view().querySelector('.evo a[href="#hm-p-4"]') && view().querySelector('.crumbs a[href="#hm-dex"]') && view().querySelector('.crumbs a[href="#hm-gen-1"]'), "links stay in HOME");
    ok(view().querySelector('.prevnext a[href="#hm-p-5"]') && view().querySelector('.prevnext a[href="#hm-p-7"]'), "Previous and Next in HOME");
    await go("#hm-p-25");
    ok(!/Costumes|backgrounds/i.test([...view().querySelectorAll(".section h2")].map(h => h.textContent).join(" ")), "no costumes or backgrounds in HOME");
    ok(view().querySelector('.formpick [data-pickform="25-original-cap"]'), "Pikachu's caps among its forms");
    await go("#p-25");
    ok(strip().includes("Lucky") && strip().includes("4★"), "GO's Pikachu keeps every GO box");
  });

  test("HOME's ticks save to HOME's own file, never GO's; each game keeps its own", async () => {
    const goBefore = JSON.stringify((await server("go")).have);
    await go("#hm-p-1");
    try {
      click(box("Shiny")); await until(() => box("Shiny").getAttribute("aria-pressed") === "true");
      let h = null;   // the Caught that comes with it is saved just after the Shiny
      for (let t = 0; t < 5000 && !(h && (h.have["d:1"] || []).length === 2); t += 200) { await wait(200); h = await server("home"); }
      eq(h.have["d:1"], ["c", "s"], "Shiny and Caught with it, in HOME");
      eq(JSON.stringify((await server("go")).have), goBefore, "GO's ticks unchanged");
      await go("#p-1"); eq(box("Shiny").getAttribute("aria-pressed"), "false", "GO's Bulbasaur not shiny");
      await go("#hm-p-1"); eq(box("Shiny").getAttribute("aria-pressed"), "true", "HOME's still is");
      click(box("Shiny")); await until(() => box("Shiny").getAttribute("aria-pressed") === "false");
      for (let t = 0; t < 5000 && (await server("home")).have["d:1"]; t += 200) await wait(200);
      eq((await server("home")).have["d:1"], undefined, "unticking Shiny unticks the Caught that came with it");
    } finally {
      for (const t of ["s", "c"]) await save({game: "home", list: "have", key: "d:1", tick: t, on: false});
      COLS.home.have = {};
    }
  });

  test("HOME's Fast tick: a whole region, only HOME's boxes, saving to HOME", async () => {
    await go("#hm-fast");
    eq([...view().querySelectorAll("[data-fastbox]")].map(b => b.textContent), ["Caught", "Female", "Male", "Shiny", "Gigantamax"], "HOME's boxes");
    eq([...view().querySelectorAll("[data-fastkind]")].map(b => b.textContent), ["Pokédex", "Forms check"], "no costumes or backgrounds");
    ok(/Pokémon HOME/.test(view().querySelector(".hero p").textContent), "says to use HOME");
    const cell = view().querySelector('.fastgrid [data-fast="4"]');
    try {
      click(cell); await until(() => view().querySelector('.fastgrid [data-fast="4"]').getAttribute("aria-pressed") === "true");
      for (let t = 0; t < 5000 && !(await server("home")).have["d:4"]; t += 200) await wait(200);
      eq((await server("home")).have["d:4"], ["c"], "saved in HOME");
      ok(!(await server("go")).have["d:4"], "not in GO");
    } finally { await save({game: "home", list: "have", key: "d:4", tick: "c", on: false}); COLS.home.have = {}; }
  });

  test("Alcremie tracked form by form in HOME, like Vivillon (her answer, 22 Nov evening)", async () => {
    await go("#hm-gen-8");
    const al = view().querySelector('.card[data-id="869"]');
    ok(al && al.querySelector(".fbs") && /0\/63/.test(al.textContent), "its card counts its 63 flavours");
    ok(FORM_SPECIES.has(666) && FORM_SPECIES.has(869), "beside Vivillon");
    await go("#gen-8"); ok(!view().querySelector('.card[data-id="869"] .fbs'), "GO's one Alcremie: a plain card");
  });

  test("Crowned Zacian and Zamazenta and Complete Zygarde tracked as Pokémon of their own in GO (her answer, 23 Nov)", async () => {
    await go("#p-888"); ok(view().querySelector('[data-pickform="888-crowned-sword"]'), "Zacian's page: its Crowned Sword form");
    await go("#gen-8"); const z = view().querySelector('.card[data-id="888"]');
    ok(z && z.querySelector(".fbs") && /\/2/.test(z.textContent), "Zacian's card counts its two forms, like Necrozma");
    await go("#p-718"); ok(view().querySelector('[data-pickform="718-complete"]'), "Zygarde's page: Complete");
    await go("#hm-p-718"); ok(!view().querySelector('[data-pickform="718-complete"]') && view().querySelector('[data-pickform="718-10-power-construct"]'), "HOME: no Complete (it can't be kept there), Power Construct apart");
  });

  // ---------- Pokémon Shield (23 Nov: the games in release order, Shield first) ----------
  test("Shield: its own Home with a card per Pokédex, base game then DLC, and its own sidebar", async () => {
    await go("#shield");
    eq(document.querySelector('.game-switch a[aria-current]').textContent, "Shield", "Shield chosen on the switch");
    eq([...document.querySelectorAll(".game-switch a")].map(a => a.textContent), ["HOME", "GO", "Shield"], "three games");
    const names = [...view().querySelectorAll(".gen h3")].map(h => h.textContent);
    eq(names.slice(0, 3), ["Galar", "Isle of Armor", "Crown Tundra"], "the three Pokédexes first: the base game, then the two DLCs");
    eq(view().querySelector('.gen[href="#sh-gen-galar"] .genno').textContent, "#001–#400", "Galar’s own numbers");
    ok(view().querySelectorAll('.gen[href^="#sh-gen-"] .genmap').length >= 3, "each with its picture");
    eq([...view().querySelectorAll(".hero .stats .slt")].map(x => x.textContent), ["Pokémon", "Female", "Male", "Shiny", "Gigantamax"], "Shield’s boxes (her answer, 23 Nov)");
    ok(nav.querySelector('a[href="#sh-gen-galar"]') && nav.querySelector('a[href="#sh-fast"]') && !nav.querySelector('a[href="#gen-1"], a[href="#hm-gen-1"], a[href="#sets"]'), "Shield’s sidebar only");
    ok(!/Lucky|4★|Shadow|Mega|Placeholder/.test(view().textContent), "nothing Shield hasn’t got (Dynamax only as Dynamax Adventures, the Crown Tundra’s)");
  });

  test("Shield: a Pokédex in its own order and numbers; the other version’s Pokémon marked; a Pokémon’s page gives its numbers", async () => {
    await go("#sh-gen-galar");
    eq([...view().querySelectorAll(".card")].slice(0, 3).map(c => c.querySelector(".no").textContent + " " + c.querySelector(".nm").textContent), ["#001 Grookey", "#002 Thwackey", "#003 Rillaboom"], "Galar’s order");
    const sir = view().querySelector('.card[data-id="865"]');
    ok(sir && /Sword only/.test(sir.textContent), "Sirfetch’d marked Sword only (her answer: shown with a mark)");
    ok(!/Sword only/.test(view().querySelector('.card[data-id="810"]').textContent), "Grookey not");
    await go("#sh-p-810");
    ok(/Galar #001/.test(fact("Pokédex")), `Grookey: ${fact("Pokédex")}`);
    eq(strip(), ["Caught", "Female", "Male", "Shiny"], "Grookey’s boxes in Shield");
    ok(view().querySelector('.crumbs a[href="#sh-gen-galar"]') && view().querySelector('.prevnext a[href^="#sh-p-"]'), "links stay in Shield");
    await go("#sh-p-865"); ok([...view().querySelectorAll(".chips .type")].some(c => c.textContent === "Sword only"), "the mark on its page too");
    await go("#sh-p-6"); ok(strip().includes("G-Max"), "Charizard can be Gigantamax in Shield");
  });

  test("Shield’s ticks save to its own file, never GO’s or HOME’s; Fast tick goes by Pokédex", async () => {
    const goBefore = JSON.stringify((await server("go")).have), homeBefore = JSON.stringify((await server("home")).have);
    await go("#sh-fast");
    eq([...view().querySelectorAll("[data-fastgen]")].slice(0, 3).map(b => b.textContent), ["Galar", "Isle of Armor", "Crown Tundra"], "by Pokédex");
    ok(/Pokémon Shield/.test(view().querySelector(".hero p").textContent), "says to use Shield");
    const cell = view().querySelector('.fastgrid [data-fast="810"]');
    eq(cell.querySelector("span").textContent, "001", "Galar’s number");
    try {
      click(cell); await until(() => view().querySelector('.fastgrid [data-fast="810"]').getAttribute("aria-pressed") === "true");
      for (let t = 0; t < 5000 && !(await server("shield")).have["d:810"]; t += 200) await wait(200);
      eq((await server("shield")).have["d:810"], ["c"], "saved in Shield");
      eq(JSON.stringify((await server("go")).have), goBefore, "GO’s ticks unchanged");
      eq(JSON.stringify((await server("home")).have), homeBefore, "HOME’s ticks unchanged");
    } finally { await save({game: "shield", list: "have", key: "d:810", tick: "c", on: false}); COLS.shield.have = {}; }
  });

  test("TRIAL Try switch Shield’s DLC pictures (23 Nov): the official paintings or Galar’s map", async () => {
    const pick = async v => { click(document.querySelector(`.trybox [data-v="${v}"]`)); await wait(150); };
    const was = tryDlcPics;
    try {
      await go("#sh-gen-isle-of-armor");
      await pick("paintings"); ok(/isle-of-armor-1/.test(view().querySelector(".hero").getAttribute("style") || ""), "the Isle of Armor painting");
      await pick("galar"); ok(/galar-map-1/.test(view().querySelector(".hero").getAttribute("style") || ""), "Galar’s map");
      eq(localStorage.getItem(TRY_DLC_KEY), '"galar"', "kept");
      await go("#shield"); ok(view().querySelector('.gen[href="#sh-gen-crown-tundra"] .genmap').getAttribute("style").includes("galar-map-1"), "the Crown Tundra card too");
    } finally { await pick(was); }
  });

  test("one picture for a Pokémon in both games (her question, 22 Nov): GO's own, HOME's only where GO's files have none", async () => {
    const goAl = WORLDS.go.byId["869"];
    ok(goAl && !SPRITES.has(goAl.img) && sprite(goAl.img) && /sprites\/hm\./.test(sprite(goAl.img)), "Alcremie: no picture in GO's files, so HOME's, in GO too");
    ok(SPRITES.has("pm25") && sprite("pm25") === "sprites/pm25.webp", "Pikachu: GO's own picture");
    await go("#hm-p-869"); ok(view().querySelector(".monpic img").getAttribute("src").includes("sprites/big/hm."), "Alcremie's big picture in HOME");
  });

  test("a GO-only tab picked in GO is no tab in HOME, and is still picked back in GO", async () => {
    try {
      prefs.work = "lucky"; keepPrefs();
      await go("#hm-gen-1");
      ok(!view().querySelector("[data-clear]"), "no Clear in HOME");
      ok(!view().querySelector('.stattab[aria-pressed="true"]'), "no tab lit in HOME");
      ok(view().querySelector('.card[data-id="1"] .tk.s'), "HOME's cards show every HOME box, not only one");
      await go("#gen-1");
      ok(view().querySelector('.stattab[data-work="lucky"][aria-pressed="true"]'), "Lucky still picked in GO");
    } finally { prefs.work = "all"; prefs.workShow = "all"; keepPrefs(); }
  });

  test("GO's own switch and addresses stay in GO (overnight review, 23 Nov): Not in GO, #hm-set-…, Tick all's memory", async () => {
    try {
      prefs.unreleased = true; prefs.work = "shiny"; keepPrefs();
      await go("#hm-gen-5");   // Unova: Victini can't be shiny in HOME
      ok(!view().querySelector('.card[data-id="494"]'), "HOME's Shiny tab leaves out Victini, whatever GO's Not in GO switch says");
      const t = view().querySelector('.stattab[data-work="shiny"]');
      eq(+t.querySelector("b small").textContent.replace(/\D/g, ""), counts(ENTRIES.filter(e => e.gen === "5")).shinyOut, "the tab's figure");
      eq(view().querySelectorAll(".card").length, counts(ENTRIES.filter(e => e.gen === "5")).shinyOut, "one card for each that can be shiny");
    } finally { prefs.unreleased = false; prefs.work = "all"; keepPrefs(); }
    await go("#hm-set-nothing");
    eq(document.querySelector('.game-switch a[aria-current]').textContent, "HOME", "an unknown HOME address: HOME in the switch");
    ok(nav.querySelector('a[href="#hm-dex"]') && !nav.querySelector('a[href="#dex"]'), "and HOME's sidebar only");
    const before = localStorage.getItem(AUTO_KEYS.home);
    try {
      AUTOS.home.add("d:test-only"); useGame("go"); keepAuto("home");
      ok(JSON.parse(localStorage.getItem(AUTO_KEYS.home)).includes("d:test-only"), "HOME's memory saved under HOME's key from GO");
    } finally { AUTOS.home.delete("d:test-only"); before === null ? localStorage.removeItem(AUTO_KEYS.home) : localStorage.setItem(AUTO_KEYS.home, before); }
  });

  test("HOME's ticks on a server from before HOME: refused with a note, nothing saved to either file", async () => {
    const goBefore = JSON.stringify((await server("go")).have), homeBefore = JSON.stringify((await server("home")).have);
    let msg = ""; const t0 = window.toast; window.toast = m => { msg = m; };
    try {
      READY.home = false;
      await go("#hm-p-1");
      click(box("Caught")); await until(() => msg);
      ok(/can’t save Pokémon HOME/.test(msg), msg);
      await until(() => box("Caught").getAttribute("aria-pressed") === "false");
      eq(JSON.stringify((await server("go")).have), goBefore, "GO's file unchanged");
      eq(JSON.stringify((await server("home")).have), homeBefore, "HOME's file unchanged");
    } finally { READY.home = true; window.toast = t0; }
  });

  test("HOME's own facts: no shiny where HOME has none, Gigantamax only where it can be, its own forms", async () => {
    await go("#hm-p-494");   // Victini: can't be shiny in HOME
    eq(fact("Shiny"), "Unavailable"); ok(box("Shiny").disabled, "Victini's Shiny box can't be ticked");
    await go("#hm-p-25"); click(view().querySelector('[data-pickform="25-original-cap"]')); await wait(50);
    ok(box("Shiny").disabled && !strip().includes("G-Max"), "a cap Pikachu: no shiny, no Gigantamax");
    click(view().querySelector('[data-pickform="25"]')); await wait(50);
    ok(!box("Shiny").disabled && strip().includes("G-Max"), "plain Pikachu: shiny and Gigantamax");
    await go("#hm-p-52-galarian"); ok(!strip().includes("G-Max"), "no regional form can Gigantamax");
    await go("#hm-p-892"); eq([...view().querySelectorAll("[data-pickform]")].map(b => byId[b.dataset.pickform].gmax), [true, true], "both Urshifu styles Gigantamax");
    const h = countsIn("home"), noShinyGroups = new Set(HOME_DATA.entries.filter(e => !e.shiny).map(e => groupKey({...WORLDS.home.byId[e.id]})));
    ok(h.shinyOut < h.speciesAll && h.speciesAll - h.shinyOut <= noShinyGroups.size, `Shiny out of ${h.shinyOut} of ${h.speciesAll}`);
    await go("#hm-p-327"); ok(!view().querySelector(".formpick") && !byId["327-1"].form, "one Spinda in HOME, no numbered patterns");
    await go("#hm-p-487"); ok(!view().querySelector('[data-pickform="487-origin"]'), "no Origin Giratina in HOME");
    await go("#hm-p-999"); eq([...view().querySelectorAll("[data-pickform]")].map(b => b.dataset.pickform), ["999-chest", "999"], "Gimmighoul: Chest, then Roaming (GO's coin one)");
    await go("#hm-p-902"); ok(view().querySelector('[data-pickform="902-female"]') && byId["902"].genderForm && byId["902-female"].genderForm, "Basculegion: Female and Male, like the other nine");
    await go("#hm-p-774"); eq(view().querySelectorAll("[data-pickform]").length, 7, "Minior: its seven cores, no Meteor Form");
  });

  test("the HOME | GO switch: each game lights its own pages, and All games counts both", async () => {
    await go("#hm-p-25");
    eq(document.querySelector('.game-switch a[aria-current]').textContent, "HOME"); eq(nav.querySelector("a.on").getAttribute("href"), "#hm-gen-1", "its region lit in HOME");
    click(document.querySelector('.game-switch a[href="#go"]')); await until(() => location.hash === "#go");  await wait(50);
    eq(document.querySelector('.game-switch a[aria-current]').textContent, "GO"); ok(view().querySelector('.gen[href="#gen-1"]'), "GO's Home");
    eq(+nav.querySelector('a[href="#dex"] .n').textContent.replace(/,/g, ""), groupByNumber(WORLDS.go.ENTRIES).length, "GO's Every Pokémon count");
    await go("#home");
    eq(+nav.querySelector('a[href="#hm-dex"] .n').textContent.replace(/,/g, ""), groupByNumber(WORLDS.home.ENTRIES).length, "HOME's Every Pokémon count");
    for (const [g] of GENS) eq(+nav.querySelector(`a[href="#hm-gen-${g}"] .n`).textContent.replace(/,/g, ""), groupByNumber(WORLDS.home.ENTRIES.filter(e => e.gen === g)).length, `HOME's ${g}`);
  });

  // ---------- run ----------
  addEventListener("load", async () => {
    await wait(500);
    const out = [];
    for (const [name, fn, known] of tests) {
      try { useGame("go"); await fn(); out.push(known ? {name, ok: false, error: `passes now: take it off knownBug (${known})`} : {name, ok: true}); }
      catch (e) {
        if (known) out.push({name, ok: true, known: `${known} [${String(e && e.message || e).slice(0, 200)}]`});
        else out.push({name, ok: false, error: `${String(e && e.stack || e).slice(0, 800)}\n  (page then: ${location.hash})`});
      }
    }
    const report = new URLSearchParams(location.search).get("report");
    if (report) await realFetch(`http://127.0.0.1:${report}/`, {method: "POST", mode: "no-cors", headers: {"Content-Type": "text/plain"}, body: JSON.stringify(out)});
  });
})();
