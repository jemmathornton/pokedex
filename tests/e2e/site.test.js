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
    const nums = [...new Set(ENTRIES.map(e => e.dex))];
    const routes = ["#home", "#dex", "#costumes", "#events", ...Object.keys(genById).map(g => "#gen-" + g), ...nums.map(n => "#p-" + n)];
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
        if (!/^(home|dex|costumes|events|gen-\w+|p-\d+)$/.test(r)) problems.push(`a link to ${h}, which isn’t a page`);
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
      await Promise.all(list.slice(i, i + 25).map(s => realFetch(s, {method: "HEAD"}).then(r => { if (!r.ok) missing.push(s); })));
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
    eq(strip(), ["Caught", "Female", "Male", "Shiny", "Lucky", "4★", "Shadow", "Purified", "Dynamax", "G-Max", "Mega X", "Mega Y"]);
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

  // ---------- the lists ----------
  test("clicking a card (not a box) opens that Pokémon's page", async () => {
    await go("#gen-1");
    click(view().querySelector('.card[data-id="4"] .pic') || view().querySelector('.card[data-id="4"]')); await wait(50);
    eq(location.hash, "#p-4");
  });

  test("the filter line: tabs, Hide ones I have, all on one line", async () => {
    await go("#gen-1");
    const tabs = [...view().querySelectorAll(".worktab")].map(b => b.textContent);
    eq(tabs, ["Female", "Male", "Shiny", "Lucky", "4★", "Shadow", "Purified", "Dynamax", "G-Max", "Mega"]);
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
        ok(c[k] <= c.speciesOut, `${g}: ${k} ${c[k]} is more than ${c.speciesOut} Pokémon`);
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
    await go("#gen-1");
    const two = view().querySelector('[data-shotg="1"][data-shot="2"]'); ok(two, "picture 2 on Kanto");
    click(two); await wait(30);
    ok((view().querySelector(".hero").getAttribute("style") || "").includes("regions/" + REGION_SHOTS["1"][1]), "Kanto shows picture 2");
    click(view().querySelector('[data-shotg="1"][data-shot="0"]')); await wait(30);
    ok(!view().querySelector(".hero").classList.contains("withshot"), "Colour: no picture");
    click(view().querySelector('[data-shotg="1"][data-shot="1"]')); await wait(30);
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
