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
const BIG = new Set(DATA.bigSprites || []);   // the game's full-size pictures, for a Pokémon's page
const bigSprite = k => k && BIG.has(k) ? `sprites/big/${k}.webp` : sprite(k);

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
  {t: "sd", label: "Shadow", icon: "shadow", flag: "shadow", title: "Shadow"},
  {t: "pu", label: "Purified", icon: "purified", flag: "shadow", title: "Purified"},
  {t: "dx", label: "Dynamax", icon: "expand", flag: "dynamax", title: "Dynamax"},
  {t: "gx", label: "Gigantamax", icon: "expand", flag: "gmax", title: "Gigantamax"},
];

function counts(list){
  const r = {species: 0, speciesOut: 0, forms: 0, formsOut: 0, male: 0, maleOut: 0, female: 0, femaleOut: 0, shiny: 0, shinyOut: 0,
             lucky: 0, luckyOut: 0, hundo: 0, out: 0, sd: 0, pu: 0, shadowOut: 0, dx: 0, dynamaxOut: 0, gx: 0, gmaxOut: 0, mega: 0, megaOut: 0};
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
    for (const m of e.mega || []) { r.megaOut++; if (has(k, m.t)) r.mega++; }   // Mega X and Y count one each
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
  {k: "shiny", label: "Shiny", applies: e => !!e.shiny || prefs.unreleased,   // with "Not in GO" on, shinies not out yet too
   have: e => has(dk(e), "s"), ticks: ["s"]},
  {k: "lucky", label: "Lucky", applies: e => canLucky(e), have: e => has(dk(e), "l"), ticks: ["l"]},
  {k: "hundo", label: "4★", applies: e => e.released, have: e => has(dk(e), "h"), ticks: ["h"]},
  {k: "shadow", label: "Shadow", applies: e => !!e.shadow, have: e => has(dk(e), "sd"), ticks: ["sd"]},
  {k: "purified", label: "Purified", applies: e => !!e.shadow, have: e => has(dk(e), "pu"), ticks: ["pu"]},
  {k: "dynamax", label: "Dynamax", applies: e => !!e.dynamax, have: e => has(dk(e), "dx"), ticks: ["dx"]},
  {k: "gmax", label: "G-Max", applies: e => !!e.gmax, have: e => has(dk(e), "gx"), ticks: ["gx"]},
  // Mega Evolution and Primal (her ask, 10 Nov: a full box like Dynamax; Mega X and Y a box each, so "have" means all of them)
  {k: "mega", label: "Mega", applies: e => !!(e.mega || []).length, have: e => (e.mega || []).every(m => has(dk(e), m.t)), ticks: e => (e.mega || []).map(m => m.t)},
];
const boxPass = (b, val, e) => val === "have" ? b.applies(e) && b.have(e) : val === "need" ? b.applies(e) && !b.have(e) : true;
function boxFilter(e){
  const b = BOXF.find(x => x.k === prefs.work);
  if (!b) return prefs.workShow !== "need" || !caught(e);   // no tab: "Not caught" shows the ones not caught at all
  return b.applies(e) && boxPass(b, prefs.workShow, e);
}
let showAllBoxes = false;   // the Pokémon page shows every box, whatever tab is picked
function onlyTicks(e){   // cards show only the box she's working on
  if (showAllBoxes) return null;
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
    [e.class === "mythical" && !has(k, "l") ? "" : btn("l", "l", "lucky", "Lucky", "Lucky", !canLucky(e)),   // a box that can never be (a mythical’s Lucky) isn’t shown (her call, 10 Nov)
     btn("h", "h", "star", "4★", "4★ (perfect IVs)", !e.released)],
    [extra("sd"), extra("pu")],
  ];
  const wide = [extra("dx"), extra("gx"), ...(e.mega || []).map(m => btn(m.t, "mg", "mega", m.label, m.label))].filter(Boolean);   // Dynamax, Gigantamax and Mega get a full row each, so the words fit
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
function pic(item, key, big = false){
  const shinyPic = sprite(item.img + ".s"), femalePic = item.femaleImg && sprite(item.femaleImg);
  const st = picFlip.get(key) || {s: has(key, "s") || prefs.work === "shiny", f: !!femalePic};   // female look first (her call)
  const k = (st.f && femalePic ? item.femaleImg : item.img) + (st.s && shinyPic ? ".s" : "");
  const src = big ? bigSprite(k) || bigSprite(item.img) : sprite(k) || sprite(item.img);
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
const groupsByDex = {};   // the current page's groups, for the pop-up
const formGot = e => { const b = BOXF.find(x => x.k === prefs.work); return b ? b.applies(e) && b.have(e) : caught(e); };
function formsButton(lead, others){
  if (!others.length) return "";
  const all = [lead, ...others];
  return `<a class="formsbtn" href="#p-${lead.dex}">${ic("layers")}Forms ${all.filter(formGot).length}/${all.length}</a>`;
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
  const tab = !showAllBoxes && BOXF.find(x => x.k === prefs.work);
  const got = tab ? tab.applies(e) && tab.have(e) : caught(e);
  return `<div class="card${e.released ? "" : " out-not"}${got ? " got" : ""}${inForms ? " informs" : ""}" data-id="${attr(e.id)}"${got ? ` style="--hl:var(${HL[tab ? tab.k : "caught"]})"` : ""}>` +
    `<span class="no">#${pad(e.dex)}</span>` + (flags.length ? `<span class="flags">${flags.map(f => `<span>${esc(f)}</span>`).join("")}</span>` : "") +
    pic(e, dk(e)) +
    `<a class="nm" href="#p-${e.dex}" title="Open ${attr(e.name)}’s page">${esc(e.name)}</a><small class="fm">${esc(e.form || "")}${e.form && gw ? " · " : ""}${gw ? `<span class="gd">${esc(gw)}</span>` : ""}</small>` +
    boxes(e) + more + `</div>`;
}

// ---------- the banner and sidebar look: “Colours + parade” (her pick, 10 Nov, of the trial looks): each region's colour in
// the banner and its Pokémon walking along the bottom, a dark sidebar; no parade on a Pokémon's page. The CSS is under
// “the look” in site.css (data-look="mix"); she may want to change the parade later.
// each region's colour (a suggestion, after its games' colours): Kanto red, Johto gold,
// Hoenn sapphire, Sinnoh pearl-violet, Unova black, Kalos blue, Alola sunset orange, Galar purple, Hisui forest, Paldea scarlet-violet
const REGION_COLOURS = {"1": "#A3302A", "2": "#8E6A0E", "3": "#16618A", "4": "#5B4B94", "5": "#36353D", "6": "#2B55A3",
  "7": "#B5531C", "8": "#6E2D82", "hisui": "#3C6150", "9": "#952F57"};
document.documentElement.dataset.look = "mix";
const setRegion = g => document.documentElement.style.setProperty("--rc", REGION_COLOURS[g] || "#7E2530");
// TRIAL (10 Nov, her idea): a real in-game screenshot of the region behind its banner; she flicks between them with the
// switch on the banner (0 = plain colour). Official press screenshots, sources in research/data/region-screenshots.json
const REGION_SHOTS = {"1": ["kanto-1.jpg", "kanto-2.jpg", "kanto-3.jpg", "kanto-4.jpg", "kanto-5.jpg", "kanto-6.jpg", "kanto-7.jpg", "kanto-8.jpg", "kanto-9.jpg", "kanto-10.jpg", "kanto-11.jpg"], "2": ["johto-1.png", "johto-2.jpg", "johto-3.jpg", "johto-4.jpg", "johto-5.jpg"], "3": ["hoenn-1.jpg", "hoenn-2.jpg", "hoenn-3.jpg", "hoenn-4.jpg", "hoenn-5.jpg", "hoenn-6.jpg", "hoenn-7.jpg", "hoenn-8.jpg", "hoenn-9.png", "hoenn-10.png", "hoenn-11.png", "hoenn-12.png", "hoenn-13.png"], "4": ["sinnoh-1.jpg", "sinnoh-2.jpg", "sinnoh-3.jpg", "sinnoh-4.jpg", "sinnoh-5.jpg", "sinnoh-6.jpg", "sinnoh-7.jpg", "sinnoh-8.jpg", "sinnoh-9.jpg", "sinnoh-10.jpg"], "5": ["unova-1.jpg", "unova-2.jpg", "unova-3.jpg", "unova-4.png", "unova-5.png", "unova-6.png", "unova-7.jpg", "unova-8.jpg", "unova-9.jpg", "unova-10.png", "unova-11.png"], "6": ["kalos-1.jpg", "kalos-2.jpg", "kalos-3.jpg", "kalos-4.jpg", "kalos-5.jpg", "kalos-6.jpg", "kalos-7.jpg", "kalos-8.jpg", "kalos-9.png", "kalos-10.jpg", "kalos-11.jpg", "kalos-12.jpg", "kalos-13.jpg"], "7": ["alola-1.jpg", "alola-2.jpg", "alola-3.jpg", "alola-4.jpg", "alola-5.jpg", "alola-6.jpg", "alola-7.jpg", "alola-8.jpg", "alola-9.jpg"], "8": ["galar-1.jpg", "galar-2.jpg", "galar-3.jpg", "galar-4.jpg", "galar-5.jpg", "galar-6.jpg", "galar-7.jpg", "galar-8.jpg", "galar-9.jpg", "galar-10.jpg", "galar-11.jpg", "galar-12.jpg", "galar-13.jpg", "galar-14.jpg"], "hisui": ["hisui-1.jpg", "hisui-2.jpg", "hisui-3.jpg", "hisui-4.jpg", "hisui-5.jpg", "hisui-6.jpg", "hisui-7.jpg", "hisui-8.jpg", "hisui-9.jpg", "hisui-10.jpg", "hisui-11.jpg", "hisui-12.jpg", "hisui-13.jpg"], "9": ["paldea-1.jpg", "paldea-2.jpg", "paldea-3.jpg", "paldea-4.jpg", "paldea-5.jpg", "paldea-6.jpg", "paldea-7.jpg", "paldea-8.jpg", "paldea-9.jpg", "paldea-10.jpg"]};
const shotPick = g => Math.min(+(new URLSearchParams(location.search).get("shot") ?? (prefs.regionShot || {})[g] ?? 1), (REGION_SHOTS[g] || []).length);   // ?shot= for pictures only
function regionShot(g){   // style and switch for a region page's banner
  const shots = REGION_SHOTS[g] || [], k = shotPick(g);
  if (!shots.length) return {style: "", sw: ""};
  return {style: k ? ` style="--shot:url('regions/${shots[k - 1]}')"` : "", cls: k ? " withshot" : "",   // the picture always fills the banner (10 Nov: the uncropped and blurred tries confused; wide shots instead)
    sw: `<span class="shotsw"><span class="label">Try a picture</span><span class="opts">${["Colour", ...shots.map((_, i) => String(i + 1))].map((l, i) =>
      `<button type="button" data-shot="${i}" data-shotg="${g}" aria-pressed="${i === k}">${l}</button>`).join("")}</span></span>`};
}
const STARTERS = [1, 4, 7, 152, 155, 158, 252, 255, 258, 387, 390, 393, 495, 498, 501, 650, 653, 656, 722, 725, 728, 810, 813, 816, 906, 909, 912];
function heroArt(list){   // a few of the page's Pokémon, for the looks that show them (big ones first, then a parade)
  const seen = new Set(), keys = [];
  for (const e of list) {
    if (keys.length >= 14) break;
    if (!e || e.released === false || seen.has(e.img) || !sprite(e.img)) continue;
    seen.add(e.img); keys.push(e.img);
  }
  return `<div class="heroart" aria-hidden="true">${keys.map((k, i) => `<img src="${i < 3 ? bigSprite(k) : sprite(k)}" alt="" style="--i:${i}" loading="lazy">`).join("")}</div>`;
}
function firstStages(list){   // a region's starters (first stages that aren't regional forms), then the rest of the page
  const firsts = list.filter(e => e.released && !isRegional(e) && !(EVO_IN[e.id] || []).length && (e.evo || []).length);
  return [...firsts.slice(0, 3), ...list];
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
    t("--lucky", "lucky", "Lucky", c.lucky, c.luckyOut) +
    t("--hundo", "star", "4★", c.hundo, c.out) +
    t("--shadow", "shadow", "Shadow", c.sd, c.shadowOut) +
    t("--purified", "purified", "Purified", c.pu, c.shadowOut) +
    t("--dynamax", "expand", "Dynamax", c.dx, c.dynamaxOut) +
    t("--gmax", "expand", "Gigantamax", c.gx, c.gmaxOut) +
    t("--mega", "mega", "Mega", c.mega, c.megaOut) + `</div>`;
}
const readOnlyNote = () => readOnly ? `<div class="notice">${ic("info")} Opened from the folder, so ticks can’t be saved here. Open it with the Jemma’s Pokédex shortcut.</div>` : "";

function home(){
  const c = counts(ENTRIES);
  let gens = "";
  for (const [g, region, small] of GENS) {
    const list = ENTRIES.filter(e => e.gen === g), k = counts(list);
    const row = (name, icon, have, of, col) => `<span class="rl" style="--c:${col}">${ic(icon)}${name}</span><span class="bar" style="--c:${col}"><i style="width:${of ? have / of * 100 : 0}%"></i></span><span class="v">${num(have)} / ${num(of)}</span>`;
    const three = firstStages(list).slice(0, 3);
    gens += `<a class="gen" href="#gen-${g}" style="--rc:${REGION_COLOURS[g]}"><span class="genart" aria-hidden="true">${three.map(e => sprite(e.img) ? `<img src="${sprite(e.img)}" alt="" loading="lazy">` : "").join("")}</span>` +
      `<span class="label">${esc(small)}</span><h3>${esc(region)}</h3><div class="rows">` +
      row("Pokémon", "poke-ball", k.species, k.speciesOut, "var(--caught)") + row("Shiny", "sparkles", k.shiny, k.shinyOut, "var(--shiny)") +
      row("Lucky", "lucky", k.lucky, k.luckyOut, "var(--lucky)") + row("4★", "star", k.hundo, k.out, "var(--hundo)") + `</div></a>`;
  }
  const went = EVENTS.filter(e => COL.went.includes(e.id)).length;
  setRegion(null);
  view.innerHTML = `<header class="hero">${heroArt(STARTERS.map(d => baseOf[d]))}<span class="label">Pokémon GO · ${num(c.speciesOut)} Pokémon out, plus their forms</span>
    <h1>Jemma’s <em>Pokédex</em></h1>${statsHtml(c)}</header>${readOnlyNote()}
    <section class="section"><h2>By generation</h2><div class="gens">${gens}</div></section>
    <section class="section"><h2>Costumes and backgrounds</h2><div class="gens">
      <a class="gen" href="#costumes"><span class="genart" aria-hidden="true">${myCostumes().slice(0, 3).map(c => sprite(c.img) ? `<img src="${sprite(c.img)}" alt="" loading="lazy">` : "").join("")}</span><span class="label">Costumes</span><h3>${num(myCostumes().length)} collecting</h3><p class="muted" style="margin:6px 0 0;font-size:13.5px">the ones you collect</p></a>
      <a class="gen" href="#events"><span class="genart" aria-hidden="true">${myEvents().flatMap(bgMonsOf).slice(0, 3).map(e => sprite(e.img) ? `<img src="${sprite(e.img)}" alt="" loading="lazy">` : "").join("")}</span><span class="label">Events</span><h3>${num(myEvents().length)} with backgrounds</h3><p class="muted" style="margin:6px 0 0;font-size:13.5px">the ones you went to or took part in</p></a>
    </div></section>
    <p class="muted" style="margin-top:40px;font-size:12.5px">Pokémon data from the game, checked ${dates(DATA.updated)}.</p>`;
}

function dexPage(title, label, list, region){
  const items = list.filter(e => (prefs.unreleased || e.released) && boxFilter(e));
  const notOut = list.filter(e => !e.released).length;
  const groups = groupByNumber(items);
  const seg = (attrName, cur, rows) => `<span class="opts">${rows.map(([v, l]) => `<button type="button" ${attrName}="${v}" aria-pressed="${v === cur}">${l}</button>`).join("")}</span>`;
  const picked = prefs.work !== "all";
  // one line: the tabs, Clear, and on the far right a "Not caught" toggle, always there (no tab: not caught at all; a tab: missing that box), on when a tab is picked (untick it to
  // see the ones she has too, lit up; her wording and place, 9 Nov); the not-out switch under it where there are some; how many are shown sits by the title (her layout, 9 Nov)
  setRegion(region);
  const shot = region ? regionShot(region) : {style: "", sw: ""};
  view.innerHTML = `<header class="hero${shot.cls || ""}"${shot.style}>${shot.sw}${heroArt(region ? firstStages(list) : STARTERS.map(d => baseOf[d]))}<span class="label">${esc(label)} · ${num(groups.length)} shown</span><h1>${title}</h1>${statsHtml(counts(list))}</header>${readOnlyNote()}
    <div class="toolbar filters" id="toolbar">
      <div class="frow"><span class="label flabel">Filter</span><div class="worktabs">` +
      BOXF.map(b => `<button type="button" class="worktab" data-work="${b.k}" aria-pressed="${prefs.work === b.k}">${esc(b.label)}</button>`).join("") +
      (picked || prefs.workShow === "need" ? `<button class="linkbtn" type="button" data-clear>${ic("x")}Clear</button>` : "") +
      `<span class="switches"><button class="switchbtn" type="button" role="switch" data-showall aria-checked="${prefs.workShow === "need"}"><span class="track"></span>Hide ones I have</button>` +
      (notOut ? `<button class="switchbtn" type="button" role="switch" data-notout="${prefs.unreleased ? "no" : "yes"}" aria-checked="${prefs.unreleased}"><span class="track"></span>Not in GO</button>` : "") +
      `</span></div></div></div>
    ${items.length ? `<div class="grid" id="grid">${groupCards(groups)}</div>` : `<p class="empty">Nothing here.</p>`}`;
}

// one Pokémon's page (#p-201), laid out like a Sim's page on her Sims site (her ask, 9 Nov): the picture and GO's own
// Pokédex entry with the facts beside it, big boxes to tick, the evolution family, every form, its costumes and
// backgrounds, and Previous / Next at the top. With forms, a row of small pictures picks which form the top part shows.
const REGION_OF = {1: "Kanto", 2: "Johto", 3: "Hoenn", 4: "Sinnoh", 5: "Unova", 6: "Kalos", 7: "Alola", 8: "Galar", 9: "Paldea"};
const pageForm = {};   // dex number -> the form picked on its page (until the page is reloaded)
const DEX_NUMBERS = [...new Set(ENTRIES.map(e => e.dex))].sort((a, b) => a - b);
const EVO_IN = {};     // entry id -> the entries that evolve into it
ENTRIES.forEach(x => (x.evo || []).forEach(st => { if (byId[st.to]) (EVO_IN[st.to] = EVO_IN[st.to] || []).push(x); }));
const metres = v => `${v.toLocaleString("en-GB", {maximumFractionDigits: 2})} m`;
const kilos = v => `${v.toLocaleString("en-GB", {maximumFractionDigits: 2})} kg`;
function evoWays(st){   // what an evolution takes, in GO's words where the game has them
  const w = [];
  if (st.candy) w.push(`${num(st.candy)} Candy`);
  if (st.item) w.push(st.itemCount ? `${num(st.itemCount)} ${st.item}` : st.item);
  if (st.lure) w.push(st.lure);
  if (st.task) w.push(st.task);
  else if (st.buddyKm) w.push(`Walk ${num(st.buddyKm)} km with your buddy`);
  if (st.buddy && !st.task && !st.buddyKm) w.push("As your buddy");
  if (st.time) w.push({day: "In the daytime", night: "At night", dusk: "At dusk", "full moon": "At full moon"}[st.time] || st.time);
  if (st.gender) w.push(st.gender === "female" ? "Female only" : "Male only");
  if (st.upsideDown) w.push("With your phone upside down");
  if (st.tradeFree) w.push("No Candy needed if traded");
  return w;
}
function evoFamily(sel){
  // the chain this form is part of, from the game's own evolution data (Alolan Vulpix's chain is its own)
  const seen = new Set([sel.id]), todo = [sel];
  while (todo.length) {
    const x = todo.pop();
    [...(x.evo || []).map(st => byId[st.to]), ...(EVO_IN[x.id] || [])].forEach(y => { if (y && !seen.has(y.id)) { seen.add(y.id); todo.push(y); } });
  }
  if (seen.size < 2) return "";
  const roots = [...seen].map(i => byId[i]).filter(x => !(EVO_IN[x.id] || []).some(y => seen.has(y.id)));
  const node = x => `<a class="evo-mon${x.id === sel.id ? " here" : ""}${x.released ? "" : " out-not"}" href="#p-${x.dex}" data-goform="${attr(x.id)}">` +
    (sprite(x.img) ? `<img src="${sprite(x.img)}" alt="" loading="lazy">` : `<span class="blank">?</span>`) +
    `<b>${esc(x.name)}</b>${x.form ? `<small>${esc(x.form)}</small>` : ""}${x.released ? "" : `<small>Not out yet</small>`}</a>`;
  const tree = (x, path) => {
    const byTo = new Map();   // two ways to the same Pokémon are shown together
    (x.evo || []).forEach(st => { if (byId[st.to] && !path.has(st.to)) byTo.set(st.to, [...(byTo.get(st.to) || []), st]); });
    const kids = [...byTo].map(([to, sts]) => `<div class="evo-kid"><div class="evo-step">${ic("arrow-right")}<span>${sts.map(st => evoWays(st).map(esc).join("<br>")).join('<i class="or">or</i>')}</span></div>${tree(byId[to], new Set([...path, to]))}</div>`);
    return `<div class="evo-branch">${node(x)}${kids.length ? `<div class="evo-kids${kids.length > 3 ? " many" : ""}">${kids.join("")}</div>` : ""}</div>`;
  };
  return `<div class="evo">${roots.map(r => tree(r, new Set([r.id]))).join("")}</div>`;
}
// the Pokémon page's boxes are a strip of pictures, the Pokémon as it looks that way (her pick of three, 10 Nov);
// ?boxes=cards or ?boxes=now still shows the other two, for pictures only
const boxLook = () => new URLSearchParams(location.search).get("boxes") || "strip";
const DEMO = new Set((new URLSearchParams(location.search).get("demo") || "").split(",").filter(Boolean));   // pictures only: shows these boxes ticked, saves nothing
function boxPic(e, t){   // the picture for one box: the game's own pictures and looks (G-Max picture, Lucky sparkles, Shadow flames)
  const fem = e.femaleImg && BIG.has(e.femaleImg) ? e.femaleImg : e.img;
  const gmax = `pm${e.dex}.fGIGANTAMAX`;
  const mega = (e.mega || []).find(m => m.t === t);
  const k = mega ? mega.img : t === "s" ? e.img + ".s" : t === "cf" ? fem : t === "gx" && BIG.has(gmax) ? gmax : e.img;
  return bigSprite(k) || bigSprite(e.img);
}
function bigBoxes(e){
  // big boxes for the form shown at the top: the same boxes as on its card, in the same colours (white text when ticked)
  const k = dk(e);
  const B = (t, col, icon, label, applies, why) => {
    const on = has(k, t) || DEMO.has(t);
    if (!applies && !on && !why) return "";
    if (boxLook() !== "now") {
      const src = boxPic(e, t);
      return `<button class="pc pc-${["mg", "mx", "my"].includes(t) ? "mg" : t}${boxLook() === "strip" ? " small" : ""}" type="button" data-tick="${t}" aria-pressed="${on}" style="--bc:var(${col})"${!applies && !on ? " disabled" : ""}>` +
        `<span class="pcpic">${src ? `<img src="${src}" alt="" loading="lazy">` : ""}${on ? `<span class="pcok">${ic("check")}</span>` : ""}</span>` +
        `<span class="pclab">${ic(icon)}<b>${esc(boxLook() === "strip" && label === "Gigantamax" ? "G-Max" : label)}</b></span>${boxLook() === "strip" ? "" : `<small>${esc(on ? "Got it" : applies ? "Not yet" : why)}</small>`}</button>`;
    }
    return `<button class="bb" type="button" data-tick="${t}" aria-pressed="${on}" style="--bc:var(${col})"${!applies && !on ? " disabled" : ""}>${ic(icon)}<span><b>${esc(label)}</b><small>${esc(on ? "Got it" : applies ? "Not yet" : why)}</small></span></button>`;
  };
  return `<div class="bigboxes${boxLook() !== "now" ? " pcs pcs-" + boxLook() : ""}" data-id="${attr(e.id)}">` +
    B("c", "--caught", "poke-ball", "Caught", true) +
    B("cf", "--female", "venus", "Female", !!femaleTick(e)) +   // a gender it can't be isn't shown (genderless, male only…)
    B("cm", "--male", "mars", "Male", !!maleTick(e)) +
    B("s", "--shiny", "sparkles", "Shiny", !!e.shiny, "Unavailable") +
    B("l", "--lucky", "lucky", "Lucky", canLucky(e), e.class === "mythical" ? null : "Unavailable") +
    B("h", "--hundo", "star", "4★", e.released, "Unavailable") +
    B("sd", "--shadow", "shadow", "Shadow", !!e.shadow) +
    B("pu", "--purified", "purified", "Purified", !!e.shadow) +
    B("dx", "--dynamax", "expand", "Dynamax", !!e.dynamax) +
    B("gx", "--gmax", "expand", "Gigantamax", !!e.gmax) +
    (e.mega || []).map(m => B(m.t, "--mega", "mega", m.label, true)).join("") + `</div>`;
}
// Shiny Shadow: a bonus, like a costume (her ask, 10 Nov): not counted anywhere and not on the list cards; its own card with
// the shiny picture, under the evolution family (her call)
function shinyShadowCard(e){   // a picture box like the others (her note: clicking anywhere on it ticks it): the shiny picture in the Shadow flames
  const on = has("d:" + e.id, "ss"), src = bigSprite(e.img + ".s") || bigSprite(e.img);
  return `<div class="bigboxes pcs pcs-cards ssbox" data-id="${attr(e.id)}"><button class="pc pc-sd" type="button" data-tick="ss" aria-pressed="${on}" style="--bc:var(--shadow)" title="Shiny Shadow: a bonus, not counted">` +
    `<span class="pcpic">${src ? `<img src="${src}" alt="" loading="lazy">` : ""}${on ? `<span class="pcok">${ic("check")}</span>` : ""}</span>` +
    `<span class="pclab">${ic("shadow")}<b>Shiny Shadow</b></span><small>${on ? "Got it" : "Not yet"}</small></button></div>`;
}
// what can never be, from the main games (her call, 10 Nov: “Not possible” rather than “Unavailable”): only these species
// have a Gigantamax form at all (regional forms of them don't), and Zacian, Zamazenta and Eternatus can't Dynamax
const GMAX_SPECIES = new Set([3, 6, 9, 12, 25, 52, 68, 94, 99, 131, 133, 143, 569, 809, 812, 815, 818, 823, 826, 834, 839, 841, 842, 844, 849, 851, 858, 861, 869, 879, 884, 892]);
const NO_DYNAMAX = new Set([888, 889, 890]);
function pokemonPage(n){
  const every = ENTRIES.filter(e => e.dex === n);
  const all = every.filter(e => prefs.unreleased || e.released || every.every(x => !x.released));
  if (!all.length) return home();
  const grouped = groupByNumber(all)[0], ordered = [grouped.lead, ...grouped.others];
  const sel = byId[pageForm[n]] && all.includes(byId[pageForm[n]]) ? byId[pageForm[n]] : grouped.lead;
  const costumes = myCostumes().filter(c => c.dex === n);
  const evs = myEvents().filter(ev => (ev.backgroundPokemon || []).some(name => DATA.dexByName[name.toLowerCase()] === n));
  const gw = {both: "Female · Male", male: "Male", female: "Female", none: "Genderless"}[sel.gender];   // like Type (her call, 10 Nov)
  const kind = {legendary: "Legendary", mythical: "Mythical", "ultra-beast": "Ultra Beast"}[sel.class];
  const gen = genById[sel.gen] || ["", REGION_OF[sel.gen] || "", ""];
  const at = DEX_NUMBERS.indexOf(n), prev = DEX_NUMBERS[at - 1], next = DEX_NUMBERS[at + 1];
  const step = (m, dir) => { if (!m) return `<span></span>`; const x = groupByNumber(ENTRIES.filter(e => e.dex === m))[0].lead;
    return `<a class="pn ${dir}" href="#p-${m}" title="${dir === "prev" ? "Previous" : "Next"}: ${attr(x.name)}">${dir === "prev" ? ic("chevron-left") : ""}${sprite(x.img) ? `<img src="${sprite(x.img)}" alt="">` : ""}<span><small>#${pad(m)}</small>${esc(x.name)}</span>${dir === "next" ? ic("chevron-right") : ""}</a>`; };
  const yesNo = (on, yes, no) => on ? esc(yes) : `<span class="no">${esc(no)}</span>`;   // no ticks here: they looked like "caught" (her point, 10 Nov)
  const row = (t, v) => v ? `<div><dt>${esc(t)}</dt><dd>${v}</dd></div>` : "";
  const facts = `<dl class="dfacts">` +
    row("Category", esc(sel.category || "")) + row("Type", esc(sel.types.join(" · "))) + row("Gender", esc(gw)) +
    row("Average height", sel.height ? esc(metres(sel.height)) : "") + row("Average weight", sel.weight ? esc(kilos(sel.weight)) : "") +   // the species' Pokédex size; each one caught varies
    row("Buddy distance", sel.buddyKm ? esc(`${num(sel.buddyKm)} km`) : "") +
    row("In Pokémon GO", yesNo(sel.released, "Available", "Unavailable")) +
    row("Shiny", yesNo(!!sel.shiny, "Available", "Unavailable")) +
    row("Lucky", yesNo(canLucky(sel), "Available", sel.class === "mythical" ? "Not possible" : "Unavailable")) +
    row("Shadow and Purified", yesNo(!!sel.shadow, "Available", "Unavailable")) +
    row("Dynamax", yesNo(!!sel.dynamax, "Available", NO_DYNAMAX.has(sel.dex) ? "Not possible" : "Unavailable")) +
    row("Gigantamax", yesNo(!!sel.gmax, "Available", GMAX_SPECIES.has(sel.dex) && !isRegional(sel) ? "Unavailable" : "Not possible")) +
    row("Mega", yesNo(!!(sel.mega || []).length, "Available", sel.megaLater ? "Unavailable" : "Not possible")) + `</dl>`;
  const desc = sel.desc ? (sel.femaleDesc ? `<p class="dex-entry"><span class="label">Male</span>${esc(sel.desc)}</p><p class="dex-entry"><span class="label">Female</span>${esc(sel.femaleDesc)}</p>`
      : `<p class="dex-entry">${esc(sel.desc)}</p>`) : `<p class="dex-entry muted">No Pokédex entry for it in the game’s text yet.</p>`;
  const picker = ordered.length > 1 ? `<div class="formpick" role="group" aria-label="Which form to show">${ordered.map(e =>
    `<button type="button" data-pickform="${attr(e.id)}" aria-pressed="${e === sel}" title="${attr(e.form || e.name)}">${sprite(e.img) ? `<img src="${sprite(e.img)}" alt="" loading="lazy">` : `<span class="blank">?</span>`}<small>${esc(e.form || "Usual")}</small></button>`).join("")}</div>` : "";
  const family = evoFamily(sel);
  const bgCards = evs.flatMap(ev => { const ms = bgMonsOf(ev).filter(e => e.dex === n); return (ms.length ? ms : [baseOf[n] || grouped.lead]).map(e => bgCard(ev, e, false)); }).join("");
  const first = esc(sel.name);
  showAllBoxes = true;
  const formCards = all.length > 1 ? all.map(e => card(e)).join("") : "";
  const costumeCards = costumes.map(costumeCard).join("");
  showAllBoxes = false;
  setRegion(sel.gen);
  const kin = ENTRIES.filter(x => x.family && x.family === sel.family && x !== sel);
  view.innerHTML = `<header class="hero mon">${heroArt([sel, ...kin])}<div class="montop"><div class="crumbs"><a href="#dex">${ic("layout-grid")}Every Pokémon</a>` +
      (gen[0] ? `<a href="#gen-${gen[0]}">${ic("layers")}${esc(gen[1])}</a>` : "") + `</div>
      <nav class="prevnext" aria-label="Previous and next Pokémon">${step(prev, "prev")}${step(next, "next")}</nav></div>
    <div class="monhead"><div><span class="label">#${pad(n)}${sel.category ? " · " + esc(sel.category) : ""}</span><h1>${esc(sel.name)}${sel.form ? ` <em>${esc(sel.form)}</em>` : ""}</h1>
      <div class="chips">${sel.types.map(t => `<span class="type">${esc(t)}</span>`).join("")}${{both: ["Female", "Male"], male: ["Male"], female: ["Female"], none: ["Genderless"]}[sel.gender].map(g => `<span class="type">${g}</span>`).join("")}${kind ? `<span class="type">${esc(kind)}</span>` : ""}${sel.released ? "" : `<span class="type">Unavailable in GO</span>`}</div></div></div></header>${readOnlyNote()}
    <div class="mondetail"><div class="monpic">${pic(sel, dk(sel), true)}${picker}</div>
      <div>${desc}${facts}</div></div>
    <section class="section"><div class="boxhead"><h2>Your <em>boxes</em>${ordered.length > 1 ? ` <span class="muted">for ${esc(sel.form || "the usual form")}</span>` : ""}</h2></div>${bigBoxes(sel)}</section>
    ${family ? `<section class="section"><h2>Evolution <em>family</em></h2>${family}</section>` : ""}
    ${sel.shadowShiny || has("d:" + sel.id, "ss") ? `<section class="section"><h2>Shiny <em>Shadow</em></h2><p class="muted" style="margin:-6px 0 14px;font-size:13.5px">A bonus, not counted.</p>${shinyShadowCard(sel)}</section>` : ""}
    ${formCards ? `<section class="section"><h2>Every <em>form</em> <span class="muted">${all.filter(caught).length} of ${all.length} caught</span></h2><div class="grid">${formCards}</div></section>` : ""}
    ${costumeCards ? `<section class="section"><h2>Costumes</h2><p class="muted" style="margin:-6px 0 14px;font-size:13.5px">A costume’s Shiny is a bonus, not counted.</p><div class="grid">${costumeCards}</div></section>` : ""}
    ${evs.length ? `<section class="section"><h2>Event <em>backgrounds</em></h2><div class="grid">${bgCards}</div></section>` : ""}`;
}

const BGS = new Set(DATA.backgrounds || []);   // site/backgrounds/<event id>.webp: the game's location cards
const SPECIAL = DATA.special || [];   // special backgrounds: ticked “I took part”, like “I went” for the in-person ones (her call, 10 Nov)
const isSpecial = ev => ev.id.startsWith("sb-");
const bgKey = (ev, e) => `b:${ev.id}:${e.id}`;
function bgCard(ev, e, wentButton){
  const went = COL.went.includes(ev.id), key = bgKey(ev, e);
  const src = bigSprite(has(key, "s") && sprite(e.img + ".s") ? e.img + ".s" : e.img);
  const bg = BGS.has(ev.id) ? `backgrounds/${ev.id}.webp` : null;
  return `<div class="card bgcard${went ? "" : " not-went"}" data-bg="${attr(key)}" data-event="${attr(ev.id)}" data-bgdex="${e.dex}">` +
    `<div class="bgpic${bg ? "" : " nobg"}"${bg ? ` style="background-image:url('${bg}')"` : ""}>${bg ? "" : `<span class="nobg-note">No picture in the game files yet</span>`}${src ? `<img src="${src}" alt="" loading="lazy">` : ""}</div>` +
    `<a class="nm" href="#p-${e.dex}">${esc(e.name)}</a><small class="fm">${e.costume || e.form ? esc(e.costume || e.form) + " · " : ""}${esc(ev.background || ev.name)}</small>` +
    (went ? `<div class="boxgrid"><button class="tk c" type="button" data-tick="c" aria-pressed="${has(key, "c")}" title="Have it with this background">${ic("poke-ball")}<span>Caught</span></button>` +
      `<button class="tk s" type="button" data-tick="s" aria-pressed="${has(key, "s")}" title="${e.shiny ? "Shiny with this background" : "No shiny in GO yet"}"${!e.shiny && !has(key, "s") ? " disabled" : ""}>${ic("sparkles")}<span>Shiny</span></button></div>`
      : wentButton ? `<button class="chip collect" type="button" data-went aria-pressed="false">I went</button>` : "") + `</div>`;
}

// only the costumes she collects exist in the app (her call, 10 Nov), like events: she tells Claude which, and Claude adds
// them to `costumes` through the server; the rest stay in data/ but are never shown
const myCostumes = () => COSTUMES.filter(c => COL.costumes.includes(c.id));
function costumeCard(c){
  const key = "c:" + c.id;
  return `<div class="card" data-costume="${attr(c.id)}"><span class="no">#${pad(c.dex)}</span>` +
    pic(c, key) + `<a class="nm" href="#p-${c.dex}" title="Open ${attr(c.name)}’s page">${esc(c.name)}</a><small class="fm">${esc(c.costume)}</small>` +
    `<div class="boxgrid"><button class="tk c" type="button" data-tick="c" aria-pressed="${has(key, "c")}" title="Caught">${ic("poke-ball")}<span>Caught</span></button>` +
    (c.shiny || has(key, "s") ? `<button class="tk s" type="button" data-tick="s" aria-pressed="${has(key, "s")}" title="Shiny: a bonus, not counted">${ic("sparkles")}<span>Shiny</span></button>` : "") + `</div></div>`;   // a costume’s shiny is a bonus, like Shiny Shadow, and only where one is out (her calls, 10 Nov)
}
function costumesPage(){
  const term = q.value.trim().toLowerCase();
  let items = myCostumes();
  if (term) items = items.filter(c => (c.name + " " + c.costume).toLowerCase().includes(term) || String(c.dex) === term);
  const ck = c => "c:" + c.id, mine = myCostumes();
  setRegion(null);
  view.innerHTML = `<header class="hero">${heroArt(mine)}<span class="label">Pokémon GO</span><h1>Costumes</h1><p class="muted" style="margin:6px 0 0;font-size:14px">A costume’s Shiny is a bonus, not counted.</p>
    ${mine.length ? `<div class="stats">${statTile("--caught", "poke-ball", "Caught", mine.filter(c => hasAny(ck(c), ["c", "s"])).length, mine.length)}</div>` : ""}</header>${readOnlyNote()}
    ${term ? `<p class="muted" style="font-size:13.5px">Matching “${esc(q.value.trim())}”</p>` : ""}
    ${items.length ? `<div class="grid" style="margin-top:22px">${items.map(costumeCard).join("")}</div>` : `<p class="empty">${term ? "Nothing matches." : "No costumes yet."}</p>`}`;
}

// only the events she went to (or took part in, for special backgrounds) exist in the app (her call, 10 Nov); the rest stay
// in data/ so one can be added back by ticking it there
const myEvents = () => [...EVENTS, ...SPECIAL].filter(ev => COL.went.includes(ev.id) && (ev.backgroundPokemon || []).length)
  .sort((a, b) => b.start.localeCompare(a.start));
const bgMonsOf = ev => (ev.cards ? ev.cards.map(id => byId[id] || costumeById[id]) : (ev.backgroundPokemon || []).map(name => baseOf[DATA.dexByName[name.toLowerCase()]])).filter(Boolean);   // in its costume where the background came with one
function eventsPage(){
  const list = myEvents();
  let html = "", year = "";
  for (const ev of list) {
    const y = ev.start.slice(0, 4);
    if (y !== year) { html += `<h2 class="yearhead">${y}</h2>`; year = y; }
    html += `<div class="event went" data-event="${attr(ev.id)}"><div class="top"><div>
      <h3>${esc(ev.name)}</h3><div class="meta">${isSpecial(ev) ? `${ic("sparkles")} Special background` : `${ic("map-pin")} ${esc(ev.city)}, ${esc(ev.country)}`} · ${esc(dates(ev.start, ev.end))}</div>
      ${isSpecial(ev) && ev.note ? `<div class="bg muted">${esc(ev.note)}</div>` : ""}</div></div>
      <div class="grid bggrid">${bgMonsOf(ev).map(e => bgCard(ev, e, false)).join("")}</div></div>`;
  }
  const keys = list.flatMap(ev => bgMonsOf(ev).map(e => bgKey(ev, e)));
  setRegion(null);
  view.innerHTML = `<header class="hero">${heroArt(list.flatMap(bgMonsOf))}<span class="label">Pokémon GO</span><h1>Events and <em>backgrounds</em></h1>
    <div class="stats">${statTile("--deep-2", "ticket", "Events", list.length, list.length)}
    ${keys.length ? statTile("--caught", "poke-ball", "Backgrounds caught", keys.filter(k => has(k, "c")).length, keys.length) + statTile("--shiny", "sparkles", "Shiny", keys.filter(k => has(k, "s")).length, keys.length) : ""}</div></header>${readOnlyNote()}
    <div class="events">${html || `<p class="empty">No events yet.</p>`}</div>`;
}


// ---------- Quick add (TRIAL, 10 Nov overnight: one of the ways to put her collection in) ----------
// She types lines like "25 shiny", "1-9 caught", "alolan vulpix lucky, female", sees what would be ticked, then ticks
// it all at once. Nothing is saved until she presses the button.
const QBOX = [["shiny shadow", "ss"], ["mega x", "mx"], ["mega y", "my"], ["g-max", "gx"], ["gmax", "gx"], ["gigantamax", "gx"],
  ["dynamax", "dx"], ["dmax", "dx"], ["primal", "mg"], ["mega", "mega"], ["caught", "c"], ["female", "cf"], ["male", "cm"], ["♂", "cm"],
  ["♀", "cf"], ["shiny", "s"], ["lucky", "l"], ["4★", "h"], ["4*", "h"], ["hundo", "h"], ["perfect", "h"], ["shadow", "sd"], ["purified", "pu"]];
const QNAME = {c: "Caught", cm: "Male", cf: "Female", s: "Shiny", l: "Lucky", h: "4★", sd: "Shadow", pu: "Purified", dx: "Dynamax", gx: "G-Max", mg: "Mega", mx: "Mega X", my: "Mega Y", ss: "Shiny Shadow"};
let quickText = "", quickTimer;
const quickNames = (() => {   // "vulpix" -> plain Vulpix; "alolan vulpix" and "vulpix alolan" -> Alolan Vulpix
  const m = new Map();
  for (const e of ENTRIES) {
    const n = e.name.toLowerCase();
    if (!e.form) m.set(n, e); else if (!m.has(n)) m.set(n, baseOf[e.dex]);
    if (e.form) { const f = e.form.toLowerCase(); m.set(`${f} ${n}`, e); m.set(`${n} ${f}`, e); m.set(`${n} (${f})`, e); }
  }
  return m;
})();
function canTick(e, t){
  return {c: true, cm: !!maleTick(e), cf: !!femaleTick(e), s: !!e.shiny, l: canLucky(e), h: e.released, sd: !!e.shadow, pu: !!e.shadow,
    dx: !!e.dynamax, gx: !!e.gmax, ss: !!e.shadowShiny, mg: (e.mega || []).some(m => m.t === "mg"), mx: (e.mega || []).some(m => m.t === "mx"),
    my: (e.mega || []).some(m => m.t === "my")}[t];
}
function quickParse(text){
  const rows = [], problems = [];
  for (const raw of text.split("\n")) {
    let line = raw.toLowerCase().replace(/[“”"]/g, "").trim();
    if (!line) continue;
    const boxes = [];
    for (const [w, t] of QBOX) {
      const re = new RegExp(`(^|[\\s,;])${w.replace(/[*.?+]/g, "\\$&")}(?=$|[\\s,;])`, "g");
      if (re.test(line)) { boxes.push(t); line = line.replace(re, " "); }
    }
    if (!boxes.length) boxes.push("c");
    const targets = [];
    for (let part of line.split(/[,;]+/)) {
      part = part.trim().replace(/^#/, "");
      if (!part) continue;
      const range = /^(\d+)\s*[-–]\s*(\d+)$/.exec(part);
      if (range) { for (let n = +range[1]; n <= +range[2]; n++) if (baseOf[n]) targets.push(baseOf[n]); continue; }
      if (/^\d+$/.test(part)) { if (baseOf[+part]) targets.push(baseOf[+part]); else problems.push(`No Pokémon #${part}`); continue; }
      const e = quickNames.get(part.replace(/\s+/g, " "));
      if (e) targets.push(e); else problems.push(`Don’t know “${raw.trim()}”: try its number`);
    }
    for (const e of targets) for (const b of boxes) {
      const ts = b === "mega" ? (e.mega || []).map(m => m.t) : [b];
      if (!ts.length) rows.push({e, t: "mg", cant: true});
      for (const t of ts) rows.push({e, t, cant: !canTick(e, t), have: has(dk(e), t)});
    }
  }
  return {rows, problems};
}
function quickPage(){
  const {rows, problems} = quickParse(quickText);
  const todo = rows.filter(r => !r.cant && !r.have);
  setRegion(null);
  view.innerHTML = `<header class="hero"><span class="label">Trial</span><h1>Quick <em>add</em></h1>
    <p>Type what you have, one line at a time: numbers, ranges or names, then the boxes. Nothing is saved until you press the button.</p></header>${readOnlyNote()}
    <div class="quick"><div><textarea id="quickText" rows="12" spellcheck="false" placeholder="25 shiny&#10;1-9 caught&#10;alolan vulpix lucky, female&#10;charizard mega x&#10;gengar shiny shadow">${esc(quickText)}</textarea>
      <p class="muted" style="font-size:13px">Boxes: caught, male, female, shiny, lucky, 4★ (or hundo), shadow, purified, dynamax, g-max, mega (or mega x / mega y), shiny shadow. No box means caught.</p></div>
    <div><h3>${todo.length ? `${num(todo.length)} to tick` : "Nothing new to tick yet"}</h3>
      ${todo.length ? `<button class="chip collect" type="button" data-quickgo>${ic("check")}Tick these ${num(todo.length)}</button>` : ""}
      ${problems.map(p => `<p class="qprob">${esc(p)}</p>`).join("")}
      <ul class="qlist">${rows.slice(0, 400).map(r => `<li class="${r.cant ? "cant" : r.have ? "have" : ""}"><a href="#p-${r.e.dex}">#${pad(r.e.dex)} ${esc(r.e.name)}${r.e.form ? ` <small>${esc(r.e.form)}</small>` : ""}</a><span>${esc(QNAME[r.t])}${r.cant ? " · can’t be" : r.have ? " · already ticked" : ""}</span></li>`).join("")}</ul>
      ${rows.length > 400 ? `<p class="muted">…and ${num(rows.length - 400)} more</p>` : ""}</div></div>`;
  const ta = document.getElementById("quickText");
  ta.addEventListener("input", () => {
    quickText = ta.value; clearTimeout(quickTimer);
    quickTimer = setTimeout(() => { const pos = ta.selectionStart; quickPage(); const t2 = document.getElementById("quickText"); t2.focus(); t2.setSelectionRange(pos, pos); }, 300);
  });
}
async function quickGo(){
  const todo = quickParse(quickText).rows.filter(r => !r.cant && !has(dk(r.e), r.t));
  let done = 0;
  for (const r of todo) {
    const key = dk(r.e);
    for (const t of r.t === "c" ? ["c"] : [r.t, "c"]) {   // any box ticked means caught too
      if (has(key, t)) continue;
      setTick(key, t, true);
      if (!await save({list: "have", key, tick: t, on: true})) { setTick(key, t, false); toast(`Stopped after ${done}: not saved.`); return quickPage(); }
    }
    done++;
  }
  toast(`Ticked ${done}.`); quickText = ""; quickPage();
}

function navHtml(route){
  const link = (href, icon, text, n) => `<a href="${href}" class="${route === href.slice(1) ? "on" : ""}">${ic(icon)}${esc(text)}${n !== undefined ? `<span class="n">${num(n)}</span>` : ""}</a>`;
  const out = ENTRIES.filter(e => e.released);
  nav.innerHTML = `<div class="nav-group">${link("#home", "house", "Home")}${link("#dex", "layout-grid", "Every Pokémon", groupByNumber(out).length)}</div>
    <div class="nav-group"><span class="label">Generations</span>${GENS.map(([g, n]) => link("#gen-" + g, "layers", g === "hisui" ? n : `${g} · ${n}`, groupByNumber(out.filter(e => e.gen === g)).length)).join("")}</div>
    <div class="nav-group"><span class="label">More</span>${link("#costumes", "shirt", "Costumes", COL.costumes.length)}${link("#events", "ticket", "Events and backgrounds", myEvents().length)}${link("#quick", "list-checks", "Quick add (trial)")}</div>`;
}

function route(){
  const r = (location.hash || "#home").slice(1);
  const term = q.value.trim().toLowerCase();
  const pn = /^p-(\d+)$/.exec(r), lead = pn && groupByNumber(ENTRIES.filter(e => e.dex === +pn[1]))[0];
  navHtml(lead ? "gen-" + lead.lead.gen : r);   // a Pokémon's page lights up its region in the sidebar
  if (r === "costumes") return costumesPage();
  if (r === "events") return eventsPage();
  if (r === "quick") return quickPage();
  const pm = /^p-(\d+)$/.exec(r);
  if (pm) return pokemonPage(+pm[1]);
  if (term && r !== "costumes") {
    const n = parseInt(term.replace(/^#/, ""), 10);
    const list = ENTRIES.filter(e => (e.name + " " + (e.form || "")).toLowerCase().includes(term) || e.dex === n);
    return dexPage(`“${esc(q.value.trim())}”`, "Search", list);
  }
  const g = /^gen-(\w+)$/.exec(r);
  if (g && genById[g[1]]) return dexPage(esc(genById[g[1]][1]), genById[g[1]][2], ENTRIES.filter(e => e.gen === g[1]), g[1]);
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
  const go = ev.target.closest("a[data-goform]");
  if (go) { const e = byId[go.dataset.goform]; pageForm[e.dex] = e.id; if (location.hash === "#p-" + e.dex) { ev.preventDefault(); rerender(); } return; }
  const b = ev.target.closest("button");
  if (!b) {   // anywhere else on a card opens that Pokémon's page, at that form (her ask, 10 Nov; ticking is on the boxes)
    const c = ev.target.closest(".card[data-id],.card[data-costume],.card[data-bgdex]");
    const link = ev.target.closest("a");
    if (!c || (link && link.getAttribute("href") !== location.hash)) return;   // a link to this same page (a name on its own page) counts as the card
    if (link) ev.preventDefault();
    const e = byId[c.dataset.id] || costumeById[c.dataset.costume] || baseOf[c.dataset.bgdex];
    if (!e) return;
    if (location.hash === "#p-" + e.dex && !c.dataset.id) {   // a costume or background on its own Pokémon's page: the card ticks its Caught box (her note, 10 Nov)
      const key = c.dataset.costume ? "c:" + c.dataset.costume : c.dataset.bg;
      if (key) return tick(key, "c", !has(key, "c"));
    }
    if (c.dataset.id) pageForm[e.dex] = e.id;
    if (location.hash === "#p-" + e.dex) { rerender(); return scrollTo({top: 0, behavior: "smooth"}); }
    location.hash = "#p-" + e.dex;
    return;
  }
  if (b.dataset.pickform) { const e = byId[b.dataset.pickform]; pageForm[e.dex] = e.id; return rerender(); }
  if (b.hasAttribute("data-clear")) { Object.assign(prefs, {work: "all", workShow: "all"}); keepPrefs(); return rerender(); }
  if (b.hasAttribute("data-showall")) { prefs.workShow = prefs.workShow === "all" ? "need" : "all"; keepPrefs(); return rerender(); }
  if (b.dataset.work) { prefs.work = prefs.work === b.dataset.work ? "all" : b.dataset.work; prefs.workShow = prefs.work === "all" ? "all" : "need"; keepPrefs(); return rerender(); }   // click again: back to all
  if (b.hasAttribute("data-quickgo")) return quickGo();
  if (b.dataset.shotg) { prefs.regionShot = {...(prefs.regionShot || {}), [b.dataset.shotg]: +b.dataset.shot}; keepPrefs(); return rerender(); }   // trial, 10 Nov
  if (b.dataset.notout) { prefs.unreleased = b.dataset.notout === "yes"; keepPrefs(); return rerender(); }
  if (b.dataset.workshow) { prefs.workShow = b.dataset.workshow; keepPrefs(); return rerender(); }
  if (b.dataset.cmode) { prefs.costumes = b.dataset.cmode; keepPrefs(); return rerender(); }
  if (b.dataset.emode) { prefs.events = b.dataset.emode; keepPrefs(); return rerender(); }
  if (b.dataset.formtick) return tick("d:" + b.dataset.formtick, b.dataset.t, b.getAttribute("aria-pressed") !== "true");
  if (b.dataset.flip) {
    const k = b.dataset.pic, item = byId[k.slice(2)] || costumeById[k.slice(2)];
    const st = {...(picFlip.get(k) || {s: has(k, "s") || prefs.work === "shiny", f: !!(item && item.femaleImg && sprite(item.femaleImg))})};
    st[b.dataset.flip] = !st[b.dataset.flip]; picFlip.set(k, st); return rerender();
  }
  if (b.hasAttribute("data-collect")) return toggleList("costumes", b.closest("[data-costume]").dataset.costume);
  if (b.hasAttribute("data-went")) return toggleList("went", b.closest("[data-event]").dataset.event);
  if (b.dataset.tick) {
    const holder = b.closest("[data-id],[data-costume],[data-bg]");   // a card, the big boxes on a Pokémon's page, a costume or a background
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
addEventListener("hashchange", () => { route(); scrollTo(0, 0); });
addEventListener("keydown", ev => {   // ← and → step through the numbers on a Pokémon's page
  if (!/^#p-\d+$/.test(location.hash) || ev.target.closest("input,textarea,select") || ev.altKey || ev.ctrlKey || ev.metaKey) return;
  const a = document.querySelector(ev.key === "ArrowLeft" ? ".pn.prev" : ev.key === "ArrowRight" ? ".pn.next" : null);
  if (a) { ev.preventDefault(); location.hash = a.getAttribute("href"); }
});

route();
if (location.protocol.startsWith("http")) {
  fetch("/api/collection").then(r => r.ok ? r.json() : Promise.reject()).then(c => { COL = norm(c); readOnly = false; rerender(); }).catch(() => {});
}
