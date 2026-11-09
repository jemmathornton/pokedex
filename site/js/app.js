// Jemma's Pokédex: the page code. What there is comes from DATA (js/data.js, built by tools/build.py from data/);
// what she has comes from tools/serve.py (/api/collection), saved as she clicks. Opened straight from the folder,
// the page shows the ticks as they were at the last build and can't change them.
const ic = n => ICONS[n].replace("<svg ", '<svg class="i" aria-hidden="true" ');
const curly = s => String(s ?? "").replace(/(^|[\s(\[“"—-])'/g, "$1‘").replace(/'/g, "’");
const esc = s => curly(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
const attr = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const num = n => n.toLocaleString("en-GB");
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const pad = n => String(n).padStart(4, "0");
function dates(a, b){   // "12–14 June 2026", "30 May – 1 June 2026", "4 October 2026 – 30 April 2027"
  const p = d => { const [y, m, dd] = d.split("-").map(Number); return {y, m, d: dd}; };
  if (!a) return "";
  const s = p(a), e = p(b || a);
  if (a === (b || a)) return `${s.d} ${MONTHS[s.m - 1]} ${s.y}`;
  if (s.y !== e.y) return `${s.d} ${MONTHS[s.m - 1]} ${s.y} – ${e.d} ${MONTHS[e.m - 1]} ${e.y}`;
  if (s.m !== e.m) return `${s.d} ${MONTHS[s.m - 1]} – ${e.d} ${MONTHS[e.m - 1]} ${e.y}`;
  return `${s.d}–${e.d} ${MONTHS[s.m - 1]} ${s.y}`;
}

// ---------- browser storage: only viewing preferences (what to show), never her ticks ----------
const store = {
  get(k, d){ try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const PREFS_KEY = "jemmas-pokedex-view";
const prefs = Object.assign({show: "all", gender: "any", forms: "all", unreleased: false, costumes: "auto", events: "all"}, store.get(PREFS_KEY, {}));
const keepPrefs = () => store.set(PREFS_KEY, prefs);

// ---------- what there is ----------
const GENS = {1: "Kanto", 2: "Johto", 3: "Hoenn", 4: "Sinnoh", 5: "Unova", 6: "Kalos", 7: "Alola", 8: "Galar", 9: "Paldea"};
const ENTRIES = DATA.entries, COSTUMES = DATA.costumes, EVENTS = DATA.events;
const SPRITES = new Set(DATA.sprites);
const byId = Object.fromEntries(ENTRIES.map(e => [e.id, e]));
const costumeById = Object.fromEntries(COSTUMES.map(c => [c.id, c]));
const baseOf = {};   // dex number -> its plain entry (for background Pokémon)
ENTRIES.forEach(e => { if (!baseOf[e.dex] || (!e.form && baseOf[e.dex].form)) baseOf[e.dex] = e; });
const canLucky = e => e.released && e.class !== "mythical";   // mythicals can't be traded, so never lucky
const sprite = k => k && SPRITES.has(k) ? `sprites/${k}.webp` : null;

// ---------- what she has ----------
let COL = norm(DATA.collection), readOnly = true;
function norm(c){ c = c || {}; return {have: c.have || {}, went: c.went || [], costumes: c.costumes || []}; }
const has = (key, t) => (COL.have[key] || []).includes(t);
const hasAny = (key, ts) => ts.some(t => has(key, t));
const dk = e => "d:" + e.id;
const caught = e => (COL.have[dk(e)] || []).length > 0;   // any box ticked: she has one
const gotBoth = e => has(dk(e), "cm") && has(dk(e), "cf");
// species with more than one entry out in GO (Unown, Vivillon, Alolan Vulpix…): their entries are the "forms"
const outBySpecies = {};
ENTRIES.forEach(e => { if (e.released) (outBySpecies[e.dex] = outBySpecies[e.dex] || []).push(e); });
const hasForms = e => (outBySpecies[e.dex] || []).length > 1;

// the extra boxes, only on the Pokémon they can apply to (Serebii's lists, tools/import_go.py)
const EXTRAS = [
  {t: "sd", label: "Shadow", flag: "shadow", title: "Shadow"},
  {t: "pu", label: "Purified", flag: "shadow", title: "Purified"},
  {t: "dx", label: "Dynamax", flag: "dynamax", title: "Dynamax"},
  {t: "gx", label: "G-Max", flag: "gmax", title: "Gigantamax"},
];

function counts(list){
  const r = {species: 0, speciesOut: 0, forms: 0, formsOut: 0, genders: 0, gendersOut: 0, shiny: 0, shinyOut: 0,
             lucky: 0, luckyOut: 0, hundo: 0, out: 0, sd: 0, pu: 0, shadowOut: 0, dx: 0, dynamaxOut: 0, gx: 0, gmaxOut: 0};
  const species = {};
  for (const e of list) {
    if (!e.released) continue;
    const k = dk(e);
    r.out++;
    species[e.dex] = species[e.dex] || caught(e);
    if (hasForms(e)) { r.formsOut++; if (caught(e)) r.forms++; }
    if (e.gender === "both") { r.gendersOut++; if (gotBoth(e)) r.genders++; }
    if (e.shiny) { r.shinyOut++; if (has(k, "s")) r.shiny++; }
    if (canLucky(e)) { r.luckyOut++; if (has(k, "l")) r.lucky++; }
    if (has(k, "h")) r.hundo++;
    if (e.shadow) { r.shadowOut++; if (has(k, "sd")) r.sd++; if (has(k, "pu")) r.pu++; }
    if (e.dynamax) { r.dynamaxOut++; if (has(k, "dx")) r.dx++; }
    if (e.gmax) { r.gmaxOut++; if (has(k, "gx")) r.gx++; }
  }
  r.speciesOut = Object.keys(species).length;
  r.species = Object.values(species).filter(Boolean).length;
  return r;
}

// the filters: what to show, which genders, forms
const SHOWS = [
  ["Everything", [["all", "Everything", () => true]]],
  ["Still to get", [
    ["need-caught", "Not caught yet", e => !caught(e)],
    ["need-gender", "Missing ♂ or ♀", e => e.gender === "both" && !gotBoth(e)],
    ["need-shiny", "No shiny yet", e => e.shiny && !has(dk(e), "s")],
    ["need-lucky", "No lucky yet", e => canLucky(e) && !has(dk(e), "l")],
    ["need-hundo", "No 4★ yet", e => !has(dk(e), "h")],
    ["need-shadow", "No shadow yet", e => e.shadow && !has(dk(e), "sd")],
    ["need-purified", "No purified yet", e => e.shadow && !has(dk(e), "pu")],
    ["need-dynamax", "No Dynamax yet", e => e.dynamax && !has(dk(e), "dx")],
    ["need-gmax", "No Gigantamax yet", e => e.gmax && !has(dk(e), "gx")]]],
  ["What I have", [
    ["have-caught", "Caught", e => caught(e)],
    ["have-shiny", "Shinies", e => has(dk(e), "s")],
    ["have-lucky", "Luckies", e => has(dk(e), "l")],
    ["have-hundo", "4★s", e => has(dk(e), "h")],
    ["have-shadow", "Shadows", e => has(dk(e), "sd")],
    ["have-purified", "Purified", e => has(dk(e), "pu")],
    ["have-dynamax", "Dynamax", e => has(dk(e), "dx")],
    ["have-gmax", "Gigantamax", e => has(dk(e), "gx")]]],
];
const SHOW_LIST = SHOWS.flatMap(g => g[1]);
const GENDERS = [["any", "Any", () => true], ["both", "Male and female", e => e.gender === "both"], ["male", "Male only", e => e.gender === "male"],
                 ["female", "Female only", e => e.gender === "female"], ["none", "Genderless", e => e.gender === "none"]];
const FORMS = [["all", "All Pokémon", () => true], ["forms", "Only ones with forms", hasForms], ["plain", "Only ones without forms", e => !hasForms(e)]];
const GENDER_WORDS = {male: "♂ only", female: "♀ only", none: "Genderless"};

// ---------- boxes on a card ----------
function boxes(e){
  const k = dk(e), btn = (t, cls, html, title, off) => {
    const on = has(k, t);
    return `<button class="tk ${cls}" type="button" data-tick="${t}" aria-pressed="${on}" title="${attr(title)}" aria-label="${attr(title)}"${off && !on ? " disabled" : ""}>${html}</button>`;
  };
  let row1 = e.gender === "both"
    ? btn("cm", "c", ic("mars"), "Male") + btn("cf", "c", ic("venus"), "Female")
    : btn("c", "c", ic("check") + "Caught", "Caught");
  row1 += btn("s", "s", ic("sparkles") + "Shiny", e.shiny ? "Shiny" : "No shiny in GO yet", !e.shiny);
  const row2 = btn("l", "l", ic("clover") + "Lucky", e.class === "mythical" ? "Mythical: can’t be traded, so never lucky" : "Lucky", !canLucky(e)) +
    btn("h", "h", "4★", "4★ (perfect IVs)", !e.released);
  const row3 = EXTRAS.filter(x => e[x.flag]).map(x => btn(x.t, x.t, esc(x.label), x.title)).join("");
  return `<div class="ticks">${row1}</div><div class="ticks">${row2}</div>` + (row3 ? `<div class="ticks">${row3}</div>` : "");
}

// the picture: click to look through the versions there are (normal, female, shiny, shiny female)
const picChoice = new Map();
function variants(item){
  const v = [{k: item.img, what: ""}];
  if (item.femaleImg) v.push({k: item.femaleImg, what: "♀"});
  if (sprite(item.img + ".s")) v.push({k: item.img + ".s", what: "Shiny", s: true});
  if (item.femaleImg && sprite(item.femaleImg + ".s")) v.push({k: item.femaleImg + ".s", what: "Shiny ♀", s: true});
  return v;
}
function pic(item, key){
  const v = variants(item);
  let i = picChoice.get(key);
  if (i === undefined) i = has(key, "s") ? Math.max(0, v.findIndex(x => x.s)) : 0;   // she has the shiny: show it
  i = i % v.length;
  const src = sprite(v[i].k);
  return `<button class="pic" type="button" data-pic="${attr(key)}" title="${v.length > 1 ? "Click to see the other versions" : ""}">` +
    (src ? `<img src="${src}" alt="" loading="lazy" decoding="async">` : `<span class="blank">?</span>`) +
    (v[i].what ? `<span class="what${v[i].s ? " s" : ""}">${esc(v[i].what)}</span>` : "") + `</button>`;
}

function card(e){
  const flags = [];
  if (!e.released) flags.push("Not out yet");
  if (e.class === "legendary") flags.push("Legendary");
  if (e.class === "mythical") flags.push("Mythical");
  if (e.class === "ultra-beast") flags.push("Ultra Beast");
  const gw = GENDER_WORDS[e.gender];
  return `<div class="card${e.released ? "" : " out-not"}${has(dk(e), "l") ? " lucky-on" : ""}" data-id="${attr(e.id)}">` +
    `<span class="no">#${pad(e.dex)}</span>` + (flags.length ? `<span class="flags">${flags.map(f => `<span>${esc(f)}</span>`).join("")}</span>` : "") +
    pic(e, dk(e)) +
    `<b class="nm">${esc(e.name)}</b><small class="fm">${esc(e.form || "")}${e.form && gw ? " · " : ""}${gw ? `<span class="gd">${esc(gw)}</span>` : ""}</small>` +
    boxes(e) + `</div>`;
}

// ---------- pages ----------
const view = document.getElementById("view"), nav = document.getElementById("nav"), q = document.getElementById("q");

function statsHtml(c){
  const t = (cls, icon, have, of, what) => `<div class="stat ${cls}"><b>${num(have)}</b><span>${icon}${what} of ${num(of)}</span></div>`;
  return `<div class="stats">` +
    t("caught", ic("check"), c.species, c.speciesOut, "Pokémon") +
    t("caught", ic("layers"), c.forms, c.formsOut, "forms") +
    t("caught", ic("mars") + ic("venus"), c.genders, c.gendersOut, "both genders") +
    t("shiny", ic("sparkles"), c.shiny, c.shinyOut, "shiny") +
    t("lucky", ic("clover"), c.lucky, c.luckyOut, "lucky") +
    t("hundo", ic("star"), c.hundo, c.out, "4★") +
    (c.shadowOut ? t("shadow", "", c.sd, c.shadowOut, "shadow") + t("purified", "", c.pu, c.shadowOut, "purified") : "") +
    (c.dynamaxOut ? t("dynamax", "", c.dx, c.dynamaxOut, "Dynamax") : "") +
    (c.gmaxOut ? t("dynamax", "", c.gx, c.gmaxOut, "Gigantamax") : "") + `</div>`;
}
const readOnlyNote = () => readOnly ? `<div class="notice">${ic("info")} Opened from the folder, so ticks can’t be saved here. Open it with the Jemma’s Pokédex shortcut.</div>` : "";

function home(){
  const c = counts(ENTRIES);
  let gens = "";
  for (const g of Object.keys(GENS)) {
    const list = ENTRIES.filter(e => e.gen == g), k = counts(list);
    const row = (name, have, of, col) => `<span>${name}</span><span class="bar" style="--c:${col}"><i style="width:${of ? have / of * 100 : 0}%"></i></span><span class="v">${num(have)} / ${num(of)}</span>`;
    gens += `<a class="gen" href="#gen-${g}"><span class="label">Generation ${g}</span><h3>${GENS[g]}</h3><div class="rows">` +
      row("Pokémon", k.species, k.speciesOut, "var(--caught)") + row("Shiny", k.shiny, k.shinyOut, "var(--shiny)") +
      row("Lucky", k.lucky, k.luckyOut, "var(--lucky)") + row("4★", k.hundo, k.out, "var(--hundo)") + `</div></a>`;
  }
  const went = EVENTS.filter(e => COL.went.includes(e.id)).length;
  view.innerHTML = `<header class="hero"><span class="label">Pokémon GO · ${num(c.speciesOut)} Pokémon out, plus their forms</span>
    <h1>Jemma’s <em>Pokédex</em></h1>${statsHtml(c)}</header>${readOnlyNote()}
    <section class="section"><h2>By generation</h2><div class="gens">${gens}</div></section>
    <section class="section"><h2>Costumes and backgrounds</h2><div class="gens">
      <a class="gen" href="#costumes"><span class="label">Costumes</span><h3>${num(COL.costumes.length)} collecting</h3><p class="muted" style="margin:6px 0 0;font-size:13.5px">of ${num(COSTUMES.length)} in the game</p></a>
      <a class="gen" href="#events"><span class="label">European events</span><h3>${num(went)} been to</h3><p class="muted" style="margin:6px 0 0;font-size:13.5px">of ${num(EVENTS.length)} listed</p></a>
    </div></section>
    <p class="muted" style="margin-top:40px;font-size:12.5px">Pokémon data from the game, checked ${dates(DATA.updated)}.</p>`;
}

function dexPage(title, label, list){
  const show = SHOW_LIST.find(x => x[0] === prefs.show) || SHOW_LIST[0];
  const gender = GENDERS.find(x => x[0] === prefs.gender) || GENDERS[0];
  const forms = FORMS.find(x => x[0] === prefs.forms) || FORMS[0];
  const items = list.filter(e => (prefs.unreleased || e.released) && show[2](e) && gender[2](e) && forms[2](e));
  const notOut = list.filter(e => !e.released).length;
  const opts = (rows, cur) => rows.map(x => `<option value="${x[0]}"${x[0] === cur ? " selected" : ""}>${esc(x[1])}</option>`).join("");
  const filtered = show[0] !== "all" || gender[0] !== "any" || forms[0] !== "all";
  view.innerHTML = `<header class="hero"><span class="label">${esc(label)}</span><h1>${title}</h1>${statsHtml(counts(list))}</header>${readOnlyNote()}
    <div class="toolbar filters" id="toolbar"><span class="label">${ic("eye")} Filters</span>
      <label class="sel">Show <select data-pref="show">${SHOWS.map(g => g[0] === "Everything" ? opts(g[1], show[0]) : `<optgroup label="${esc(g[0])}">${opts(g[1], show[0])}</optgroup>`).join("")}</select></label>
      <label class="sel">Gender <select data-pref="gender">${opts(GENDERS, gender[0])}</select></label>
      <label class="sel">Forms <select data-pref="forms">${opts(FORMS, forms[0])}</select></label>
      ${notOut ? `<label class="check"><input type="checkbox" data-pref="unreleased"${prefs.unreleased ? " checked" : ""}> Include ones not out in GO yet</label>` : ""}
      <span class="gap"></span>${filtered ? `<button class="linkbtn" type="button" data-clear>Clear filters</button>` : ""}<span class="shown">${num(items.length)} shown</span></div>
    ${items.length ? `<div class="grid" id="grid">${items.map(card).join("")}</div>` : `<p class="empty">Nothing here.</p>`}`;
}

function costumesPage(){
  const mode = prefs.costumes === "auto" ? (COL.costumes.length ? "collecting" : "all") : prefs.costumes;
  const term = q.value.trim().toLowerCase();
  let items = mode === "collecting" ? COSTUMES.filter(c => COL.costumes.includes(c.id)) : COSTUMES;
  if (term) items = items.filter(c => (c.name + " " + c.costume).toLowerCase().includes(term) || String(c.dex) === term);
  const ck = c => "c:" + c.id;
  const haveShiny = COSTUMES.filter(c => COL.costumes.includes(c.id) && has(ck(c), "s")).length;
  const haveAny = COSTUMES.filter(c => COL.costumes.includes(c.id) && hasAny(ck(c), ["c", "s"])).length;
  view.innerHTML = `<header class="hero"><span class="label">Pokémon GO</span><h1>Costumes</h1>
    <div class="stats"><div class="stat"><b>${num(COL.costumes.length)}</b><span>collecting, of ${num(COSTUMES.length)}</span></div>
    <div class="stat caught"><b>${num(haveAny)}</b><span>${ic("check")}caught</span></div>
    <div class="stat shiny"><b>${num(haveShiny)}</b><span>${ic("sparkles")}shiny</span></div></div></header>${readOnlyNote()}
    <div class="toolbar"><button class="chip" type="button" data-cmode="collecting" aria-pressed="${mode === "collecting"}">${ic("list-checks")}Ones I’m collecting</button>
      <button class="chip" type="button" data-cmode="all" aria-pressed="${mode === "all"}">${ic("shirt")}Every costume</button>
      ${term ? `<span class="muted" style="font-size:13.5px">Matching “${esc(q.value.trim())}”</span>` : ""}</div>
    ${items.length ? `<div class="grid">${items.map(c => {
      const on = COL.costumes.includes(c.id), key = ck(c);
      return `<div class="card${on ? "" : " not-collecting"}" data-costume="${attr(c.id)}"><span class="no">#${pad(c.dex)}</span>` +
        pic(c, key) + `<b class="nm">${esc(c.name)}</b><small class="fm">${esc(c.costume)}</small>` +
        (on ? `<div class="ticks"><button class="tk c" type="button" data-tick="c" aria-pressed="${has(key, "c")}" title="Caught">${ic("check")}Caught</button>` +
          `<button class="tk s" type="button" data-tick="s" aria-pressed="${has(key, "s")}" title="${c.shiny ? "Shiny" : "No shiny in GO yet"}"${!c.shiny && !has(key, "s") ? " disabled" : ""}>${ic("sparkles")}Shiny</button></div>` : "") +
        `<button class="chip collect" type="button" data-collect aria-pressed="${on}">${on ? ic("check") + "Collecting" : "Collect this"}</button></div>`;
    }).join("")}</div>` : `<p class="empty">${mode === "collecting" ? "No costumes chosen yet: pick them from Every costume." : "Nothing matches."}</p>`}`;
}

function eventsPage(){
  const mode = prefs.events;
  let list = EVENTS;
  if (mode === "went") list = list.filter(e => COL.went.includes(e.id));
  if (mode === "bg") list = list.filter(e => e.background);
  let html = "", year = "";
  for (const ev of list) {
    const y = ev.start.slice(0, 4), went = COL.went.includes(ev.id);
    if (y !== year) { html += `<h2 class="yearhead">${y}</h2>`; year = y; }
    const mons = (ev.backgroundPokemon || []).map(name => {
      const e = baseOf[DATA.dexByName[name.toLowerCase()]];
      if (!e) return "";
      const key = `b:${ev.id}:${e.dex}`, src = sprite(has(key, "s") && sprite(e.img + ".s") ? e.img + ".s" : e.img);
      return `<div class="bgmon" data-bg="${attr(key)}">${src ? `<img src="${src}" alt="" loading="lazy">` : ""}<div class="t">${esc(e.name)}` +
        (went ? `<div class="ticks"><button class="tk c" type="button" data-tick="c" aria-pressed="${has(key, "c")}" title="Have it with this background">${ic("check")}</button>` +
          `<button class="tk s" type="button" data-tick="s" aria-pressed="${has(key, "s")}" title="${e.shiny ? "Shiny with this background" : "No shiny in GO yet"}"${!e.shiny && !has(key, "s") ? " disabled" : ""}>${ic("sparkles")}</button></div>` : "") + `</div></div>`;
    }).join("");
    html += `<div class="event${went ? " went" : ""}" data-event="${attr(ev.id)}"><div class="top"><div>
      <h3>${esc(ev.name)}</h3><div class="meta">${ic("map-pin")} ${esc(ev.city)}, ${esc(ev.country)} · ${esc(dates(ev.start, ev.end))}</div>
      <div class="bg">${ev.background ? `${ic("image")} Background: <b>${esc(ev.background)}</b>` : `<span class="muted">No location background</span>`}</div></div>
      <button class="chip" type="button" data-went aria-pressed="${went}">${went ? ic("check") + "I went" : "I went"}</button></div>
      ${mons ? `<div class="bgmons"${went ? "" : ' style="opacity:.55"'}>${mons}</div>` : ""}</div>`;
  }
  const bgs = EVENTS.filter(e => COL.went.includes(e.id) && e.background).length;
  view.innerHTML = `<header class="hero"><span class="label">In-person events in Europe</span><h1>Events and <em>backgrounds</em></h1>
    <div class="stats"><div class="stat"><b>${num(COL.went.length)}</b><span>${ic("ticket")}been to, of ${num(EVENTS.length)}</span></div>
    <div class="stat"><b>${num(bgs)}</b><span>${ic("image")}with a background</span></div></div></header>${readOnlyNote()}
    <div class="toolbar">${[["all", "Every event", EVENTS.length], ["went", "Ones I went to", COL.went.length], ["bg", "With a background", EVENTS.filter(e => e.background).length]]
      .map(([k, l]) => `<button class="chip" type="button" data-emode="${k}" aria-pressed="${mode === k}">${l}</button>`).join("")}</div>
    <div class="events">${html || `<p class="empty">None yet: tick “I went” on the events you’ve been to.</p>`}</div>`;
}

function navHtml(route){
  const link = (href, icon, text, n) => `<a href="${href}" class="${route === href.slice(1) ? "on" : ""}">${ic(icon)}${esc(text)}${n !== undefined ? `<span class="n">${num(n)}</span>` : ""}</a>`;
  const out = ENTRIES.filter(e => e.released);
  nav.innerHTML = `<div class="nav-group">${link("#home", "house", "Home")}${link("#dex", "layout-grid", "Every Pokémon", out.length)}</div>
    <div class="nav-group"><span class="label">Generations</span>${Object.entries(GENS).map(([g, n]) => link("#gen-" + g, "layers", `${g} · ${n}`, out.filter(e => e.gen == g).length)).join("")}</div>
    <div class="nav-group"><span class="label">More</span>${link("#costumes", "shirt", "Costumes", COL.costumes.length)}${link("#events", "ticket", "Events and backgrounds", COL.went.length)}</div>`;
}

function route(){
  const r = (location.hash || "#home").slice(1);
  const term = q.value.trim().toLowerCase();
  navHtml(r);
  if (r === "costumes") return costumesPage();
  if (r === "events") return eventsPage();
  if (term && r !== "costumes") {
    const n = parseInt(term.replace(/^#/, ""), 10);
    const list = ENTRIES.filter(e => (e.name + " " + (e.form || "")).toLowerCase().includes(term) || e.dex === n);
    return dexPage(`“${esc(q.value.trim())}”`, "Search", list);
  }
  const g = /^gen-(\d)$/.exec(r);
  if (g) return dexPage(esc(GENS[g[1]]), `Generation ${g[1]}`, ENTRIES.filter(e => e.gen == g[1]));
  if (r === "dex") return dexPage("Every <em>Pokémon</em>", "Pokémon GO", ENTRIES);
  home();
}
function rerender(){ const y = scrollY; route(); scrollTo(0, y); }

// ---------- saving ----------
const toastEl = document.getElementById("toast");
let toastTimer;
function toast(msg){ toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.hidden = true, 3500); }

async function save(body){
  if (readOnly) { toast("Opened from the folder: open it with the shortcut to save ticks."); return false; }
  try {
    const r = await fetch("/api/tick", {method: "POST", headers: {"Content-Type": "application/json", "X-Pokedex": "1"}, body: JSON.stringify(body)});
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || "not saved");
    return true;
  } catch (e) {
    toast("Not saved: the Pokédex server isn’t answering. Try again in a moment.");
    return false;
  }
}
function setTick(key, t, on){
  const s = new Set(COL.have[key] || []);
  on ? s.add(t) : s.delete(t);
  if (s.size) COL.have[key] = [...s]; else delete COL.have[key];
}
async function tick(key, t, on){
  setTick(key, t, on);
  rerender();
  if (!await save({list: "have", key, tick: t, on})) { setTick(key, t, !on); rerender(); }
}
async function toggleList(list, id){
  const on = !COL[list].includes(id);
  const apply = v => { COL[list] = v ? [...COL[list], id] : COL[list].filter(x => x !== id); };
  apply(on); rerender();
  if (!await save({list, key: id, on})) { apply(!on); rerender(); }
}

document.addEventListener("click", ev => {
  const b = ev.target.closest("button");
  if (!b) return;
  if (b.hasAttribute("data-clear")) { Object.assign(prefs, {show: "all", gender: "any", forms: "all"}); keepPrefs(); return rerender(); }
  if (b.dataset.cmode) { prefs.costumes = b.dataset.cmode; keepPrefs(); return rerender(); }
  if (b.dataset.emode) { prefs.events = b.dataset.emode; keepPrefs(); return rerender(); }
  if (b.dataset.pic) { const k = b.dataset.pic; picChoice.set(k, (picChoice.get(k) ?? currentPic(b)) + 1); return rerender(); }
  if (b.hasAttribute("data-collect")) return toggleList("costumes", b.closest("[data-costume]").dataset.costume);
  if (b.hasAttribute("data-went")) return toggleList("went", b.closest("[data-event]").dataset.event);
  if (b.dataset.tick) {
    const holder = b.closest("[data-id],[data-costume],[data-bg]");
    const key = holder.dataset.id ? "d:" + holder.dataset.id : holder.dataset.costume ? "c:" + holder.dataset.costume : holder.dataset.bg;
    return tick(key, b.dataset.tick, b.getAttribute("aria-pressed") !== "true");
  }
});
function currentPic(btn){   // which version the picture shows now (so the first click moves on from it)
  const key = btn.dataset.pic, id = key.slice(2), item = key.startsWith("d:") ? byId[id] : costumeById[id];
  const img = btn.querySelector("img");
  if (!item || !img) return 0;
  return Math.max(0, variants(item).findIndex(v => img.getAttribute("src") === sprite(v.k)));
}

document.addEventListener("change", ev => {   // the filters
  const el = ev.target.closest("[data-pref]");
  if (!el) return;
  prefs[el.dataset.pref] = el.type === "checkbox" ? el.checked : el.value;
  keepPrefs(); rerender();
});

let qTimer;
q.addEventListener("input", () => {
  clearTimeout(qTimer);
  qTimer = setTimeout(() => {
    const r = (location.hash || "#home").slice(1);
    if (q.value.trim() && !["dex", "costumes"].includes(r) && !r.startsWith("gen-")) location.hash = "#dex"; else route();
  }, 150);
});
document.getElementById("searchIco").innerHTML = ic("search");
addEventListener("hashchange", () => { route(); scrollTo(0, 0); });

route();
if (location.protocol.startsWith("http")) {
  fetch("/api/collection").then(r => r.ok ? r.json() : Promise.reject()).then(c => { COL = norm(c); readOnly = false; rerender(); }).catch(() => {});
}
