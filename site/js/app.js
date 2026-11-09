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
const prefs = Object.assign({work: "all", workShow: "need", gender: "any", forms: "all", type: "any", kind: "any",
  unreleased: false, costumes: "auto", events: "all"}, store.get(PREFS_KEY, {}));
if (["genders", "caught", "forms"].includes(prefs.work)) prefs.work = "all";
if (!["need", "all"].includes(prefs.workShow)) prefs.workShow = "need";   // tabs that no longer exist
const keepPrefs = () => store.set(PREFS_KEY, prefs);

// ---------- what there is ----------
// the sections, in game order: [key, region, small label]. Hisui stands on its own between Galar and Paldea (her call, 9 Nov)
const GENS = [["1", "Kanto", "Generation 1"], ["2", "Johto", "Generation 2"], ["3", "Hoenn", "Generation 3"], ["4", "Sinnoh", "Generation 4"],
  ["5", "Unova", "Generation 5"], ["6", "Kalos", "Generation 6"], ["7", "Alola", "Generation 7"], ["8", "Galar", "Generation 8"],
  ["hisui", "Hisui", "Legends: Arceus"], ["9", "Paldea", "Generation 9"]];
const genById = Object.fromEntries(GENS.map(g => [g[0], g]));
const ENTRIES = DATA.entries, COSTUMES = DATA.costumes, EVENTS = DATA.events;
// regional forms go under their region, not their species' generation (her call, 9 Nov): Alolan Vulpix in Alola, not Kanto.
// Hisui also gets the Pokémon that first appeared there (#899–905, Wyrdeer to Enamorus).
const REGION_GEN = {Alolan: "7", Galarian: "8", Hisuian: "hisui", Paldean: "9"};
ENTRIES.forEach(e => {
  e.gen = REGION_GEN[(e.form || "").split(" ")[0]] || (e.dex >= 899 && e.dex <= 905 ? "hisui" : String(e.gen));
});
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
// Caught ("c") is on every card; ♂ ("cm") and ♀ ("cf") sit beside it wherever that gender exists (her call, 9 Nov)
const maleTick = e => e.gender === "both" || e.gender === "male" ? "cm" : null;
const femaleTick = e => e.gender === "both" || e.gender === "female" ? "cf" : null;
const gotMale = e => !!maleTick(e) && has(dk(e), maleTick(e));
const gotFemale = e => !!femaleTick(e) && has(dk(e), femaleTick(e));
// species with more than one entry out in GO (Unown, Vivillon, Alolan Vulpix…): their entries are the "forms"
const outBySpecies = {};
ENTRIES.forEach(e => { if (e.released) (outBySpecies[e.dex] = outBySpecies[e.dex] || []).push(e); });
const hasForms = e => (outBySpecies[e.dex] || []).length > 1;

// the extra boxes, only on the Pokémon they can apply to (Serebii's lists, tools/import_go.py)
const EXTRAS = [
  {t: "sd", label: "Shadow", icon: "flame", flag: "shadow", title: "Shadow"},
  {t: "pu", label: "Purified", icon: "sun", flag: "shadow", title: "Purified"},
  {t: "dx", label: "Dynamax", icon: "chevrons-up", flag: "dynamax", title: "Dynamax"},
  {t: "gx", label: "Gigantamax", icon: "cloud", flag: "gmax", title: "Gigantamax"},
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

// the filters (9 Nov, her pick of three tried): choose the box she's working on (tabs), then Still need / Have / All;
// the cards then show only that box. Every box works the same way, Male, Female and Forms included (her rule).
const BOXF = [   // each box as a filter: which Pokémon it applies to, and whether she has it
  {k: "female", label: "Female", applies: e => !!femaleTick(e), have: gotFemale, ticks: e => [femaleTick(e)]},
  {k: "male", label: "Male", applies: e => !!maleTick(e), have: gotMale, ticks: e => [maleTick(e)]},
  {k: "shiny", label: "Shiny", applies: e => !!e.shiny, have: e => has(dk(e), "s"), ticks: ["s"]},
  {k: "lucky", label: "Lucky", applies: e => canLucky(e), have: e => has(dk(e), "l"), ticks: ["l"]},
  {k: "hundo", label: "4★", applies: e => e.released, have: e => has(dk(e), "h"), ticks: ["h"]},
  {k: "shadow", label: "Shadow", applies: e => !!e.shadow, have: e => has(dk(e), "sd"), ticks: ["sd"]},
  {k: "purified", label: "Purified", applies: e => !!e.shadow, have: e => has(dk(e), "pu"), ticks: ["pu"]},
  {k: "dynamax", label: "Dynamax", applies: e => !!e.dynamax, have: e => has(dk(e), "dx"), ticks: ["dx"]},
  {k: "gmax", label: "Gigantamax", applies: e => !!e.gmax, have: e => has(dk(e), "gx"), ticks: ["gx"]},
];
const boxPass = (b, val, e) => val === "have" ? b.applies(e) && b.have(e) : val === "need" ? b.applies(e) && !b.have(e) : true;
function boxFilter(e){
  const b = BOXF.find(x => x.k === prefs.work);
  return !b || (b.applies(e) && boxPass(b, prefs.workShow, e));
}
function onlyTicks(e){   // C: cards show only the box she's working on
  const b = BOXF.find(x => x.k === prefs.work);
  return b ? (typeof b.ticks === "function" ? b.ticks(e) : b.ticks) : null;
}
const GENDER_WORDS = {male: "♂ only", female: "♀ only", none: "Genderless"};

// ---------- boxes on a card ----------
function boxes(e){
  // a fixed two-column grid, so every box has the same place on every card (her point, 9 Nov: the ragged rows looked
  // bizarre): Caught | Shiny · Male | Female · Lucky | 4★ · Shadow | Purified · Dynamax | G-Max. A box that can't apply
  // to this Pokémon leaves its place empty; a pair with neither is left out.
  const only = onlyTicks(e);
  const k = dk(e), btn = (t, cls, icon, label, title, off) => {
    if (only && !only.includes(t)) return "";
    const on = has(k, t);
    return `<button class="tk ${cls}" type="button" data-tick="${t}" aria-pressed="${on}" title="${attr(title)}" aria-label="${attr(title)}"${off && !on ? " disabled" : ""}>${ic(icon)}<span>${esc(label)}</span></button>`;
  };
  const x = t => EXTRAS.find(z => z.t === t);
  const extra = t => e[x(t).flag] ? btn(t, t, x(t).icon, x(t).label, x(t).title) : "";
  const pairs = [
    [btn("c", "c", "poke-ball", "Caught", "Caught"), btn("s", "s", "sparkles", "Shiny", e.shiny ? "Shiny" : "No shiny in GO yet", !e.shiny)],
    [femaleTick(e) ? btn("cf", "f", "venus", "Female", e.gender === "female" ? "Female (female only)" : "Female") : "",
     maleTick(e) ? btn("cm", "m", "mars", "Male", e.gender === "male" ? "Male (male only)" : "Male") : ""],   // female first (her call)
    [btn("l", "l", "clover", "Lucky", e.class === "mythical" ? "Mythical: can’t be traded, so never lucky" : "Lucky", !canLucky(e)),
     btn("h", "h", "star", "4★", "4★ (perfect IVs)", !e.released)],
    [extra("sd"), extra("pu")],
  ];
  const wide = [extra("dx"), extra("gx")].filter(Boolean);   // Dynamax and Gigantamax get a full row each, so the words fit
  if (only) {   // working on one box: just that one, bigger
    const one = pairs.flat().concat(wide).filter(Boolean).join("");
    return one ? `<div class="ticks big">${one}</div>` : "";
  }
  return `<div class="boxgrid">` + pairs.filter(pr => pr[0] || pr[1]).map(pr => (pr[0] || "<span></span>") + (pr[1] || "<span></span>")).join("") +
    wide.map(w => w.replace('class="tk ', 'class="tk wide ')).join("") + `</div>`;
}

// the picture: small ✨ and ♀ buttons on it flip to the shiny / female picture (9 Nov: clicking the picture itself was
// too hidden, her words). It shows shiny by itself when she has the shiny or is working on shinies.
const picFlip = new Map();   // key -> {s, f} she has flipped to (until the page is reloaded)
function pic(item, key){
  const shinyPic = sprite(item.img + ".s"), femalePic = item.femaleImg && sprite(item.femaleImg);
  const st = picFlip.get(key) || {s: has(key, "s") || prefs.work === "shiny", f: !!femalePic};   // female look first (her call)
  const k = (st.f && femalePic ? item.femaleImg : item.img) + (st.s && shinyPic ? ".s" : "");
  const src = sprite(k) || sprite(item.img);
  const flip = (w, on, icon, title) => `<button class="flip${w === "s" ? " fs" : " ff"}" type="button" data-flip="${w}" data-pic="${attr(key)}" aria-pressed="${on}" title="${title}" aria-label="${title}">${icon}</button>`;
  return `<div class="pic">` + (src ? `<img src="${src}" alt="" loading="lazy" decoding="async">` : `<span class="blank">?</span>`) +
    `<span class="flips">` + (shinyPic ? flip("s", !!st.s, ic("sparkles"), st.s ? "Show the normal colours" : "Show the shiny") : "") +
    (femalePic ? flip("f", !!st.f, ic(st.f ? "mars" : "venus"), st.f ? "Show the male (he looks different)" : "Show the female") : "") + `</span></div>`;
}

// one card per Pokédex number on each page, as in the game; its other forms open from a button on it (her call, 9 Nov).
// Every Pokémon the same way, regional forms too (her point: Paldean Tauros should work like Unown). Regional forms sit
// on their region's page, so there they group among themselves (Paldea: one Tauros card).
const isRegional = e => !!REGION_GEN[(e.form || "").split(" ")[0]];
function groupByNumber(items){
  const groups = [], byDex = {};
  for (const e of items) {
    if (!byDex[e.dex]) groups.push(byDex[e.dex] = []);
    byDex[e.dex].push(e);
  }
  return groups.map(g => {
    const lead = g.find(x => !x.form) || g.find(x => x.default) || g.find(x => /^[a-z0-9]/i.test(x.form)) || g[0];   // the game's default form first (Unown F)
    const odd = x => /^[a-z0-9#]/i.test(x.form || "") ? 0 : 1;   // Unown: A to Z, then ! and ?
    return {lead, others: g.filter(x => x !== lead).sort((a, b) => odd(a) - odd(b))};
  });
}
// a Pokémon's other forms: small pictures inside its card (9 Nov: no expanding, and not as ordinary cards, her words).
// Clicking one ticks that form: Caught, or with a tab on, that tab's box. Ticked ones light up in the box's colour.
function formTick(e){
  const b = BOXF.find(x => x.k === prefs.work);
  if (!b) return "c";
  if (!b.applies(e)) return null;
  const t = typeof b.ticks === "function" ? b.ticks(e) : b.ticks;
  return t[0];
}
// a card shows a small "Forms 3/28" button; it opens a pop-up with every form as a full card with all its boxes (9 Nov:
// forms inside the card made Unown's card far too tall; she wants shiny etc. for each form, her words). The list never changes.
let formsOpen = null;   // the Pokédex number whose forms pop-up is open
const groupsByDex = {};   // the current page's groups, for the pop-up
const formGot = e => { const b = BOXF.find(x => x.k === prefs.work); return b ? b.applies(e) && b.have(e) : caught(e); };
function formsButton(lead, others){
  if (!others.length) return "";
  const all = [lead, ...others];
  return `<button class="formsbtn" type="button" data-forms="${lead.dex}">${ic("layers")}Forms ${all.filter(formGot).length}/${all.length}</button>`;
}
function formsModal(){
  const g = groupsByDex[formsOpen];
  if (!g) return "";
  const b = BOXF.find(x => x.k === prefs.work);
  const all = [g.lead, ...g.others];
  return `<div class="modal" id="modal" role="dialog" aria-modal="true" aria-label="${attr(g.lead.name)} forms"><div class="modal-box">
    <div class="modal-head"><div><span class="label">#${pad(g.lead.dex)} · ${all.filter(formGot).length} of ${all.length} ticked</span><h2>${esc(g.lead.name)} forms</h2>
      <p class="muted">Every form with its own boxes.</p></div>
      <button class="modal-x" type="button" data-closeforms aria-label="Close">${ic("x")}</button></div>
    <div class="grid">${all.map(e => card(e)).join("")}</div></div></div>`;
}
function groupCards(groups){
  for (const k in groupsByDex) delete groupsByDex[k];
  groups.forEach(g => { groupsByDex[g.lead.dex] = g; });
  return groups.map(({lead, others}) => card(lead, formsButton(lead, others))).join("");
}

const HL = {caught: "--caught", female: "--female", male: "--male", shiny: "--shiny", lucky: "--lucky", hundo: "--hundo",
            shadow: "--shadow", purified: "--purified", dynamax: "--dynamax", gmax: "--gmax"};
function card(e, more = "", inForms = false){
  const flags = [];
  if (!e.released) flags.push("Not out yet");
  if (e.class === "legendary") flags.push("Legendary");
  if (e.class === "mythical") flags.push("Mythical");
  if (e.class === "ultra-beast") flags.push("Ultra Beast");
  const gw = GENDER_WORDS[e.gender];
  // the card is marked when she has it: caught, or with a tab on, that tab's box, in its colour (her call, 9 Nov)
  const tab = BOXF.find(x => x.k === prefs.work);
  const got = tab ? tab.applies(e) && tab.have(e) : caught(e);
  return `<div class="card${e.released ? "" : " out-not"}${got ? " got" : ""}${inForms ? " informs" : ""}" data-id="${attr(e.id)}"${got ? ` style="--hl:var(${HL[tab ? tab.k : "caught"]})"` : ""}>` +
    `<span class="no">#${pad(e.dex)}</span>` + (flags.length ? `<span class="flags">${flags.map(f => `<span>${esc(f)}</span>`).join("")}</span>` : "") +
    pic(e, dk(e)) +
    `<b class="nm">${esc(e.name)}</b><small class="fm">${esc(e.form || "")}${e.form && gw ? " · " : ""}${gw ? `<span class="gd">${esc(gw)}</span>` : ""}</small>` +
    boxes(e) + more + `</div>`;
}

// ---------- pages ----------
const view = document.getElementById("view"), nav = document.getElementById("nav"), q = document.getElementById("q");

function statTile(colour, icon, label, have, of, extra = ""){
  return `<div class="stat" style="--sc:var(${colour})"><span class="sl">${ic(icon)}${esc(label)}</span><b>${num(have)}<small> of ${num(of)}</small></b>
    <span class="sbar"><i style="width:${of ? have / of * 100 : 0}%"></i></span>${extra}</div>`;
}
function statsHtml(c){
  // the counts at the top: an even grid of tiles, each with its box's icon and colour, "3 of 151" and a bar (her point:
  // the old row of uneven tiles looked bad). Forms sit inside the Pokémon tile.
  const t = (colour, icon, label, have, of, extra = "") => of ? statTile(colour, icon, label, have, of, extra) : "";
  return `<div class="stats">` +
    t("--caught", "poke-ball", "Pokémon", c.species, c.speciesOut, c.formsOut ? `<span class="sx">Forms ${num(c.forms)} of ${num(c.formsOut)}</span>` : "") +
    t("--female", "venus", "Female", c.female, c.femaleOut) +
    t("--male", "mars", "Male", c.male, c.maleOut) +
    t("--shiny", "sparkles", "Shiny", c.shiny, c.shinyOut) +
    t("--lucky", "clover", "Lucky", c.lucky, c.luckyOut) +
    t("--hundo", "star", "4★", c.hundo, c.out) +
    t("--shadow", "flame", "Shadow", c.sd, c.shadowOut) +
    t("--purified", "sun", "Purified", c.pu, c.shadowOut) +
    t("--dynamax", "chevrons-up", "Dynamax", c.dx, c.dynamaxOut) +
    t("--gmax", "cloud", "Gigantamax", c.gx, c.gmaxOut) + `</div>`;
}
const readOnlyNote = () => readOnly ? `<div class="notice">${ic("info")} Opened from the folder, so ticks can’t be saved here. Open it with the Jemma’s Pokédex shortcut.</div>` : "";

function home(){
  const c = counts(ENTRIES);
  let gens = "";
  for (const [g, region, small] of GENS) {
    const list = ENTRIES.filter(e => e.gen === g), k = counts(list);
    const row = (name, have, of, col) => `<span>${name}</span><span class="bar" style="--c:${col}"><i style="width:${of ? have / of * 100 : 0}%"></i></span><span class="v">${num(have)} / ${num(of)}</span>`;
    gens += `<a class="gen" href="#gen-${g}"><span class="label">${esc(small)}</span><h3>${esc(region)}</h3><div class="rows">` +
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
  const items = list.filter(e => (prefs.unreleased || e.released) && boxFilter(e));
  const notOut = list.filter(e => !e.released).length;
  const groups = groupByNumber(items);
  const seg = (attrName, cur, rows) => `<span class="opts">${rows.map(([v, l]) => `<button type="button" ${attrName}="${v}" aria-pressed="${v === cur}">${l}</button>`).join("")}</span>`;
  const picked = prefs.work !== "all";
  // one line: the tabs, then Clear and a "Show all" check (a tab shows the ones still needed; Show all adds the ones she
  // has, lit up); the not-out switch under it where there are some; how many are shown sits by the title (her layout, 9 Nov)
  view.innerHTML = `<header class="hero"><span class="label">${esc(label)} · ${num(groups.length)} shown</span><h1>${title}</h1>${statsHtml(counts(list))}</header>${readOnlyNote()}
    <div class="toolbar filters" id="toolbar">
      <div class="frow"><div class="worktabs">` +
      BOXF.map(b => `<button type="button" class="worktab" data-work="${b.k}" aria-pressed="${prefs.work === b.k}">${esc(b.label)}</button>`).join("") +
      (picked ? `<button class="linkbtn" type="button" data-clear>${ic("x")}Clear</button>
        <button class="checkbtn" type="button" data-showall aria-pressed="${prefs.workShow === "all"}"><span class="cb">${prefs.workShow === "all" ? ic("check") : ""}</span>Show all</button>` : "") +
      `</div></div>
      ${notOut ? `<div class="frow subrow">${seg("data-notout", prefs.unreleased ? "yes" : "no", [["no", "Out in GO"], ["yes", "Include not out yet"]])}</div>` : ""}</div>
    ${items.length ? `<div class="grid" id="grid">${groupCards(groups)}</div>` : `<p class="empty">Nothing here.</p>`}` + formsModal();
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
    <div class="stats">${statTile("--deep-2", "shirt", "Collecting", COL.costumes.length, COSTUMES.length)}
    ${statTile("--caught", "poke-ball", "Caught", haveAny, COL.costumes.length)}${statTile("--shiny", "sparkles", "Shiny", haveShiny, COL.costumes.length)}</div></header>${readOnlyNote()}
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
    <div class="stats">${statTile("--deep-2", "ticket", "Been to", COL.went.length, EVENTS.length)}
    ${statTile("--purified", "image", "With a background", bgs, COL.went.length)}</div></header>${readOnlyNote()}
    <div class="toolbar">${[["all", "Every event", EVENTS.length], ["went", "Ones I went to", COL.went.length], ["bg", "With a background", EVENTS.filter(e => e.background).length]]
      .map(([k, l]) => `<button class="chip" type="button" data-emode="${k}" aria-pressed="${mode === k}">${l}</button>`).join("")}</div>
    <div class="events">${html || `<p class="empty">None yet: tick “I went” on the events you’ve been to.</p>`}</div>`;
}

function navHtml(route){
  const link = (href, icon, text, n) => `<a href="${href}" class="${route === href.slice(1) ? "on" : ""}">${ic(icon)}${esc(text)}${n !== undefined ? `<span class="n">${num(n)}</span>` : ""}</a>`;
  const out = ENTRIES.filter(e => e.released);
  nav.innerHTML = `<div class="nav-group">${link("#home", "house", "Home")}${link("#dex", "layout-grid", "Every Pokémon", groupByNumber(out).length)}</div>
    <div class="nav-group"><span class="label">Generations</span>${GENS.map(([g, n]) => link("#gen-" + g, "layers", g === "hisui" ? n : `${g} · ${n}`, groupByNumber(out.filter(e => e.gen === g)).length)).join("")}</div>
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
  const g = /^gen-(\w+)$/.exec(r);
  if (g && genById[g[1]]) return dexPage(esc(genById[g[1]][1]), genById[g[1]][2], ENTRIES.filter(e => e.gen === g[1]));
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
  const alsoCaught = on && t !== "c" && !has(key, "c");   // a ♂, ♀, shiny, lucky… one is caught too
  setTick(key, t, on);
  if (alsoCaught) setTick(key, "c", true);
  rerender();
  if (!await save({list: "have", key, tick: t, on})) { setTick(key, t, !on); if (alsoCaught) setTick(key, "c", false); return rerender(); }
  if (alsoCaught && !await save({list: "have", key, tick: "c", on: true})) { setTick(key, "c", false); rerender(); }
}
async function toggleList(list, id){
  const on = !COL[list].includes(id);
  const apply = v => { COL[list] = v ? [...COL[list], id] : COL[list].filter(x => x !== id); };
  apply(on); rerender();
  if (!await save({list, key: id, on})) { apply(!on); rerender(); }
}

document.addEventListener("click", ev => {
  if (ev.target.id === "modal") { formsOpen = null; return rerender(); }
  const b = ev.target.closest("button");
  if (!b) {   // anywhere else on a Pokémon's card: tick Caught, or the selected tab's box (her ask, 9 Nov)
    const c = ev.target.closest(".card[data-id]"), e = c && byId[c.dataset.id];
    if (!e || ev.target.closest("a")) return;
    const t = formTick(e);
    if (!t || (t !== "c" && t === "s" && !e.shiny && !has(dk(e), "s"))) return;
    return tick(dk(e), t, !has(dk(e), t));
  }
  if (b.hasAttribute("data-clear")) { Object.assign(prefs, {work: "all", workShow: "need"}); keepPrefs(); return rerender(); }
  if (b.hasAttribute("data-showall")) { prefs.workShow = prefs.workShow === "all" ? "need" : "all"; keepPrefs(); return rerender(); }
  if (b.dataset.work) { prefs.work = prefs.work === b.dataset.work ? "all" : b.dataset.work; prefs.workShow = "need"; keepPrefs(); return rerender(); }   // click again: back to all
  if (b.dataset.notout) { prefs.unreleased = b.dataset.notout === "yes"; keepPrefs(); return rerender(); }
  if (b.dataset.workshow) { prefs.workShow = b.dataset.workshow; keepPrefs(); return rerender(); }
  if (b.dataset.cmode) { prefs.costumes = b.dataset.cmode; keepPrefs(); return rerender(); }
  if (b.dataset.emode) { prefs.events = b.dataset.emode; keepPrefs(); return rerender(); }
  if (b.dataset.forms) { formsOpen = +b.dataset.forms; return rerender(); }
  if (b.hasAttribute("data-closeforms")) { formsOpen = null; return rerender(); }
  if (b.dataset.formtick) return tick("d:" + b.dataset.formtick, b.dataset.t, b.getAttribute("aria-pressed") !== "true");
  if (b.dataset.flip) {
    const k = b.dataset.pic, item = byId[k.slice(2)] || costumeById[k.slice(2)];
    const st = {...(picFlip.get(k) || {s: has(k, "s") || prefs.work === "shiny", f: !!(item && item.femaleImg && sprite(item.femaleImg))})};
    st[b.dataset.flip] = !st[b.dataset.flip]; picFlip.set(k, st); return rerender();
  }
  if (b.hasAttribute("data-collect")) return toggleList("costumes", b.closest("[data-costume]").dataset.costume);
  if (b.hasAttribute("data-went")) return toggleList("went", b.closest("[data-event]").dataset.event);
  if (b.dataset.tick) {
    const holder = b.closest("[data-id],[data-costume],[data-bg]");
    const key = holder.dataset.id ? "d:" + holder.dataset.id : holder.dataset.costume ? "c:" + holder.dataset.costume : holder.dataset.bg;
    return tick(key, b.dataset.tick, b.getAttribute("aria-pressed") !== "true");
  }
});

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
addEventListener("keydown", ev => { if (ev.key === "Escape" && formsOpen !== null) { formsOpen = null; rerender(); } });
addEventListener("hashchange", () => { formsOpen = null; route(); scrollTo(0, 0); });

route();
if (location.protocol.startsWith("http")) {
  fetch("/api/collection").then(r => r.ok ? r.json() : Promise.reject()).then(c => { COL = norm(c); readOnly = false; rerender(); }).catch(() => {});
}
