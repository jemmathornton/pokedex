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
const prefs = Object.assign({layout: "C", box: {}, work: "all", workShow: "need", gender: "any", forms: "all", type: "any", kind: "any",
  unreleased: false, costumes: "auto", events: "all"}, store.get(PREFS_KEY, {}));
if (typeof prefs.box !== "object" || !prefs.box) prefs.box = {};
delete prefs.box.genders;
if (prefs.work === "genders") prefs.work = "all";
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
const maleTick = e => e.gender === "both" ? "cm" : e.gender === "male" ? "c" : null;
const femaleTick = e => e.gender === "both" ? "cf" : e.gender === "female" ? "c" : null;
const gotMale = e => !!maleTick(e) && has(dk(e), maleTick(e));
const gotFemale = e => !!femaleTick(e) && has(dk(e), femaleTick(e));
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
  const r = {species: 0, speciesOut: 0, forms: 0, formsOut: 0, male: 0, maleOut: 0, female: 0, femaleOut: 0, shiny: 0, shinyOut: 0,
             lucky: 0, luckyOut: 0, hundo: 0, out: 0, sd: 0, pu: 0, shadowOut: 0, dx: 0, dynamaxOut: 0, gx: 0, gmaxOut: 0};
  const species = {};
  for (const e of list) {
    if (!e.released) continue;
    const k = dk(e);
    r.out++;
    species[e.dex] = species[e.dex] || caught(e);
    if (hasForms(e)) { r.formsOut++; if (caught(e)) r.forms++; }
    if (maleTick(e)) { r.maleOut++; if (gotMale(e)) r.male++; }
    if (femaleTick(e)) { r.femaleOut++; if (gotFemale(e)) r.female++; }
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

// the filters. Trial (9 Nov, her ask): three layouts, A (a drop-down per box), B (Any/Have/Need switches per box),
// C (pick the box you're working on: cards show only that box). The switch at the bottom right picks one; remove the
// other two once she has chosen.
const BOXF = [   // each box as a filter: which Pokémon it applies to, and whether she has it
  {k: "caught", label: "Caught", applies: () => true, have: e => caught(e), ticks: ["c", "cm", "cf"]},
  {k: "male", label: "Male", applies: e => !!maleTick(e), have: gotMale, ticks: e => [maleTick(e)]},
  {k: "female", label: "Female", applies: e => !!femaleTick(e), have: gotFemale, ticks: e => [femaleTick(e)]},
  {k: "shiny", label: "Shiny", applies: e => !!e.shiny, have: e => has(dk(e), "s"), ticks: ["s"]},
  {k: "lucky", label: "Lucky", applies: e => canLucky(e), have: e => has(dk(e), "l"), ticks: ["l"]},
  {k: "hundo", label: "4★", applies: e => e.released, have: e => has(dk(e), "h"), ticks: ["h"]},
  {k: "shadow", label: "Shadow", applies: e => !!e.shadow, have: e => has(dk(e), "sd"), ticks: ["sd"]},
  {k: "purified", label: "Purified", applies: e => !!e.shadow, have: e => has(dk(e), "pu"), ticks: ["pu"]},
  {k: "dynamax", label: "Dynamax", applies: e => !!e.dynamax, have: e => has(dk(e), "dx"), ticks: ["dx"]},
  {k: "gmax", label: "G-Max", applies: e => !!e.gmax, have: e => has(dk(e), "gx"), ticks: ["gx"]},
];
const boxPass = (b, val, e) => val === "have" ? b.applies(e) && b.have(e) : val === "need" ? b.applies(e) && !b.have(e) : true;
function boxFilter(e){
  if (prefs.layout === "C") {
    const b = BOXF.find(x => x.k === prefs.work);
    return !b || (b.applies(e) && boxPass(b, prefs.workShow, e));
  }
  return BOXF.every(b => boxPass(b, prefs.box[b.k] || "any", e));
}
function onlyTicks(e){   // C: cards show only the box she's working on
  const b = prefs.layout === "C" && BOXF.find(x => x.k === prefs.work);
  return b ? (typeof b.ticks === "function" ? b.ticks(e) : b.ticks) : null;
}
const TYPES = [...new Set(ENTRIES.flatMap(e => e.types))].sort();
const KINDS = [["any", "Any", () => true], ["legendary", "Legendary", e => e.class === "legendary"], ["mythical", "Mythical", e => e.class === "mythical"],
               ["ultra-beast", "Ultra Beast", e => e.class === "ultra-beast"], ["ordinary", "Not legendary or mythical", e => !e.class]];
const FORMS = [["all", "All Pokémon", () => true], ["forms", "Only ones with forms", hasForms], ["plain", "Only ones without forms", e => !hasForms(e)]];
const GENDER_WORDS = {male: "♂ only", female: "♀ only", none: "Genderless"};

// ---------- boxes on a card ----------
function boxes(e){
  const only = onlyTicks(e);
  const k = dk(e), btn = (t, cls, html, title, off) => {
    if (only && !only.includes(t)) return "";
    const on = has(k, t);
    return `<button class="tk ${cls}" type="button" data-tick="${t}" aria-pressed="${on}" title="${attr(title)}" aria-label="${attr(title)}"${off && !on ? " disabled" : ""}>${html}</button>`;
  };
  const row1 = (maleTick(e) ? btn(maleTick(e), "c", ic("mars"), e.gender === "male" ? "Male (male only)" : "Male") : "") +
    (femaleTick(e) ? btn(femaleTick(e), "c", ic("venus"), e.gender === "female" ? "Female (female only)" : "Female") : "") +
    (e.gender === "none" ? btn("c", "c", ic("check") + "Caught", "Caught (genderless)") : "") +
    btn("s", "s", ic("sparkles") + "Shiny", e.shiny ? "Shiny" : "No shiny in GO yet", !e.shiny);
  const row2 = btn("l", "l", ic("clover") + "Lucky", e.class === "mythical" ? "Mythical: can’t be traded, so never lucky" : "Lucky", !canLucky(e)) +
    btn("h", "h", "4★", "4★ (perfect IVs)", !e.released);
  const row3 = EXTRAS.filter(x => e[x.flag]).map(x => btn(x.t, x.t, esc(x.label), x.title)).join("");
  return [row1, row2, row3].filter(Boolean).map(r => `<div class="ticks${only ? " big" : ""}">${r}</div>`).join("");
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
    t("caught", ic("mars"), c.male, c.maleOut, "male") +
    t("caught", ic("venus"), c.female, c.femaleOut, "female") +
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
  const pick = (rows, cur) => rows.find(x => x[0] === cur) || rows[0];
  const forms = pick(FORMS, prefs.forms), kind = pick(KINDS, prefs.kind);
  const items = list.filter(e => (prefs.unreleased || e.released) && boxFilter(e) && forms[2](e) && kind[2](e) &&
    (prefs.type === "any" || e.types.includes(prefs.type)));
  const notOut = list.filter(e => !e.released).length;
  const opts = (rows, cur) => rows.map(x => `<option value="${x[0]}"${x[0] === cur ? " selected" : ""}>${esc(x[1])}</option>`).join("");
  const sel = (name, pref, rows) => `<label class="sel">${name} <select data-pref="${pref}">${opts(rows, prefs[pref])}</select></label>`;
  const seg = (attrName, cur, rows) => `<span class="opts">${rows.map(([v, l]) => `<button type="button" ${attrName}="${v}" aria-pressed="${v === cur}">${l}</button>`).join("")}</span>`;
  let boxRows;
  if (prefs.layout === "A") {
    boxRows = `<div class="frow"><span class="label">Your boxes</span>${BOXF.map(b => `<label class="sel">${esc(b.label)} <select data-box="${b.k}">` +
      opts([["any", "Any"], ["have", "Have it"], ["need", "Still need"]], prefs.box[b.k] || "any") + `</select></label>`).join("")}</div>`;
  } else if (prefs.layout === "B") {
    boxRows = `<div class="frow"><span class="label">Your boxes</span><div class="fgrid">${BOXF.map(b => `<span class="seg"><b>${esc(b.label)}</b>` +
      seg(`data-box-${b.k}`, prefs.box[b.k] || "any", [["any", "Any"], ["have", "Have"], ["need", "Need"]]) + `</span>`).join("")}</div></div>`;
  } else {
    boxRows = `<div class="frow"><span class="label">Working on</span><div class="worktabs">` +
      [{k: "all", label: "Everything"}, ...BOXF].map(b => `<button type="button" class="worktab" data-work="${b.k}" aria-pressed="${prefs.work === b.k}">${esc(b.label)}</button>`).join("") +
      `</div></div>` + (prefs.work !== "all" ? `<div class="frow"><span class="label">Show</span><span class="seg">` +
      seg("data-workshow", prefs.workShow, [["need", "Still need"], ["have", "Have"], ["all", "All"]]) + `</span></div>` : "");
  }
  const filtered = forms[0] !== "all" || kind[0] !== "any" || prefs.type !== "any" ||
    (prefs.layout === "C" ? prefs.work !== "all" : Object.values(prefs.box).some(v => v && v !== "any"));
  view.innerHTML = `<header class="hero"><span class="label">${esc(label)}</span><h1>${title}</h1>${statsHtml(counts(list))}</header>${readOnlyNote()}
    <div class="toolbar filters" id="toolbar">${boxRows}
      <div class="frow"><span class="label">The Pokémon</span>${sel("Forms", "forms", FORMS)}
        ${sel("Type", "type", [["any", "Any type"], ...TYPES.map(t => [t, t])])}${sel("Kind", "kind", KINDS)}
        ${notOut ? `<label class="check"><input type="checkbox" data-pref="unreleased"${prefs.unreleased ? " checked" : ""}> Include ones not out in GO yet</label>` : ""}
        <span class="gap"></span>${filtered ? `<button class="linkbtn" type="button" data-clear>Clear filters</button>` : ""}<span class="shown">${num(items.length)} shown</span></div></div>
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
  trialSwitch();
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
function trialSwitch(){   // trial: which filter layout (remove once she has chosen)
  let el = document.getElementById("trial");
  if (!el) { el = document.createElement("div"); el.id = "trial"; el.className = "trial"; document.body.appendChild(el); }
  const names = {A: "A drop-down for each box", B: "Any / Have / Need switches", C: "Pick what you’re working on"};
  el.innerHTML = `<span class="label">Trying out: filters</span><div class="opts">${Object.keys(names).map(k =>
    `<button type="button" data-layout="${k}" aria-pressed="${prefs.layout === k}" title="${names[k]}">${k}</button>`).join("")}</div><small>${names[prefs.layout]}</small>`;
}

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
  if (b.hasAttribute("data-clear")) { Object.assign(prefs, {box: {}, work: "all", forms: "all", type: "any", kind: "any"}); keepPrefs(); return rerender(); }
  if (b.dataset.layout) { prefs.layout = b.dataset.layout; keepPrefs(); return rerender(); }
  if (b.dataset.work) { prefs.work = b.dataset.work; keepPrefs(); return rerender(); }
  if (b.dataset.workshow) { prefs.workShow = b.dataset.workshow; keepPrefs(); return rerender(); }
  const boxAttr = [...b.attributes].find(a => a.name.startsWith("data-box-"));
  if (boxAttr) { prefs.box[boxAttr.name.slice(9)] = boxAttr.value; keepPrefs(); return rerender(); }
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
  const bx = ev.target.closest("[data-box]");
  if (bx) { prefs.box[bx.dataset.box] = bx.value; keepPrefs(); return rerender(); }
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
