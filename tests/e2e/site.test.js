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
  const server = () => fetch("/api/collection").then(r => r.json());
  const realFetch = window.fetch.bind(window);

  // ---------- every page ----------
  test("the page finds the server (ticks can be saved)", async () => {
    await until(() => !readOnly, 5000);
  });

  test("every page opens with no errors, blanks or leftovers, and every link on them goes somewhere", async () => {
    const problems = [], errs = [], seen = new Set(), links = new Set();
    const onErr = e => errs.push(e.message || String(e.reason)); addEventListener("error", onErr);
    const routes = ["#home", "#dex", "#costumes", "#events", "#fast", "#want", "#sets", ...allSets().map(st => "#set-" + st.id), ...Object.keys(genById).map(g => "#gen-" + g), ...PAGE_KEYS.map(k => "#p-" + k)];
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
        if (!/^(home|dex|costumes|events|gen-\w+|p-\d+(-[a-z]+)?)$/.test(r)) problems.push(`a link to ${h}, which isn’t a page`);
        if (/^p-\d+$/.test(r) && !view().querySelector(".mondetail")) problems.push(`link to ${h}: no Pokémon page`);
      }
    } finally { removeEventListener("error", onErr); }
    eq(problems, [], "problems:");
  });

  test("every picture the main pages use is there", async () => {
    const srcs = new Set(), missing = [];
    for (const h of ["#home", "#dex", "#costumes", "#events", "#p-6", "#p-25", "#p-94", "#p-382", "#gen-8"]) {
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

  test("the filter line: tabs, Hide ones I have, all on one line", async () => {
    await go("#gen-1");
    const tabs = [...view().querySelectorAll(".worktab")].map(b => b.textContent);
    eq(tabs, ["Female", "Male", "Shiny", "Lucky", "XXL", "XXS", "Dynamax", "Gigantamax", "Mega", "Shadow", "Purified", "4★"]);   // the game's Pokédex order (her ask, 12 Nov)
    const row = view().querySelector(".frow"), top = [...row.querySelectorAll(".worktab")].map(b => b.getBoundingClientRect().top);
    ok(Math.max(...top) - Math.min(...top) < 4, "the tabs wrapped onto a second line");
    const sw = view().querySelector("[data-showall]"); ok(sw, "the Hide ones I have switch"); ok(/Hide ones I have/.test(sw.textContent));
    ok(Math.abs(sw.getBoundingClientRect().top - top[0]) < 30, "the switch is on the same line as the tabs");
  });

  test("the Mega tab shows only Pokémon with a Mega, each card with only its Mega boxes", async () => {
    prefs.work = "all"; prefs.workShow = "all";
    await go("#gen-1");
    click([...view().querySelectorAll(".worktab")].find(b => b.textContent === "Mega"));
    await wait(30);
    const cards = [...view().querySelectorAll("#grid .card")];
    ok(cards.length > 5 && cards.length < 40, `${cards.length} cards`);
    for (const c of cards) {
      const labels = [...c.querySelectorAll(".tk span")].map(s => s.textContent);
      ok(labels.length && labels.every(l => /^(Mega( X| Y)?|Primal)$/.test(l)), `${c.dataset.id}: ${labels}`);
    }
    click([...view().querySelectorAll(".worktab")].find(b => b.textContent === "Mega"));   // click again: back to all
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

  test("Costumes and Events show only hers", async () => {
    await go("#costumes");
    eq(view().querySelectorAll(".grid .card").length, COL.costumes.filter(id => COSTUMES.some(c => c.id === id)).length);
    await go("#events");
    const shown = [...view().querySelectorAll(".event")].map(e => e.dataset.event);
    ok(shown.every(id => COL.went.includes(id)), "an event she didn't go to is showing");
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
    for (const [g, f] of Object.entries(REGION_CHOSEN)) {
      await go("#gen-" + g);
      ok((view().querySelector(".hero").getAttribute("style") || "").includes("regions/" + f), `${g} shows ${f}`);
      ok(!view().querySelector(".shotsw"), `${g} has no switch`);
    }
  });

  test("the region picture switch changes the banner", async () => {
    const g = Object.keys(REGION_SHOTS).find(k => !REGION_CHOSEN[k] && REGION_SHOTS[k].length > 1);   // a region she hasn't picked yet
    if (g) {
      await go("#gen-" + g);
      const two = view().querySelector(`[data-shotg="${g}"][data-shot="2"]`); ok(two, `picture 2 on ${g}`);
      click(two); await wait(30);
      ok((view().querySelector(".hero").getAttribute("style") || "").includes("regions/" + REGION_SHOTS[g][1]), `${g} shows picture 2`);
      ok(!view().querySelector(`[data-shotg="${g}"][data-shot="0"]`), "no plain-colour choice (her call)");
      click(view().querySelector(`[data-shotg="${g}"][data-shot="1"]`)); await wait(30);
    }
    for (const k of Object.keys(genById)) { await go("#gen-" + k); ok(view().querySelector(".hero").classList.contains("withshot"), `${k} has a picture`); }
  });

  // ---------- Quick add (trial) ----------
  test("Quick add reads numbers, ranges, names and forms, and knows what can't be", async () => {
    const {rows, problems} = quickParse("25 shiny\n1-3\nalolan vulpix lucky, female\nmew lucky\ncharizard mega\nnotapokemon");
    const got = rows.map(r => `${r.e.id}:${r.t}${r.cant ? "!" : ""}`);
    for (const want of ["25:s", "1:c", "2:c", "3:c", "37-alolan:l", "37-alolan:cf", "151:l!", "6:mx", "6:my"]) ok(got.includes(want), `missing ${want} in ${got}`);
    eq(problems.length, 1, "one line it doesn't know");
  });

  test("Quick add ticks them all (and caught with them)", async () => {
    for (const k of ["d:132", "d:133"]) { for (const t of ["c", "s"]) await save({list: "have", key: k, tick: t, on: false}); delete COL.have[k]; }
    await go("#quick");
    quickText = "132, 133 shiny"; quickPage();
    click(view().querySelector("[data-quickgo]"));
    await until(() => quickText === "", 8000);   // emptied once every tick is saved
    const s = await server();
    ok(["d:132", "d:133"].every(k => s.have[k] && s.have[k].includes("s") && s.have[k].includes("c")), "saved shiny and caught");
    for (const k of ["d:132", "d:133"]) { for (const t of ["c", "s"]) await save({list: "have", key: k, tick: t, on: false}); delete COL.have[k]; }
  });

  // ---------- the 15 Nov review's fixes ----------
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
      await tick(key, "s", true); await go("#want");
      ok(!view().querySelector('.fc.want[href="#p-83"]'), "gone once ticked");
    } finally { await clear(); prefs.wantBox = "s"; prefs.wantOverlap = false; }
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

  test("XXL and XXS: boxes on cards and the page, a filter tab, Fast tick tabs and Quick add words", async () => {
    await go("#p-25");
    ok(strip().includes("XXL") && strip().includes("XXS"), "on Pikachu's page");
    prefs.work = "all"; prefs.workShow = "all"; await go("#gen-1");
    ok(view().querySelector('.card[data-id="25"] [data-tick="xl"]') && view().querySelector('.card[data-id="25"] [data-tick="xs"]'), "on the card");
    ok(view().querySelector('[data-work="xxl"]') && view().querySelector('[data-work="xxs"]'), "filter tabs");
    prefs.fastGen = "1"; prefs.fastBox = "xl"; await go("#fast");
    eq(view().querySelectorAll(".fastgrid button.fc").length, 151, "Fast tick XXL: all 151");
    prefs.fastBox = "c";
    const got = quickParse("25 xxl\n26 xxs").rows.map(r => `${r.e.id}:${r.t}`);
    ok(got.includes("25:xl") && got.includes("26:xs"), "Quick add");
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

  // ---------- run ----------
  addEventListener("load", async () => {
    await wait(500);
    const out = [];
    for (const [name, fn] of tests) {
      try { await fn(); out.push({name, ok: true}); }
      catch (e) { out.push({name, ok: false, error: `${String(e && e.stack || e).slice(0, 800)}\n  (page then: ${location.hash})`}); }
    }
    const report = new URLSearchParams(location.search).get("report");
    if (report) await realFetch(`http://127.0.0.1:${report}/`, {method: "POST", mode: "no-cors", headers: {"Content-Type": "text/plain"}, body: JSON.stringify(out)});
  });
})();
