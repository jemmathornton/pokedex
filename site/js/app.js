// Jemma's Pokédex: the page code. What there is comes from DATA (js/data.js, built by tools/build.py from data/);
// what she has comes from tools/serve.py (/api/collection), saved as she clicks. Opened straight from the folder,
// the page shows the ticks as they were at the last build and can't change them.
const ic = n => ICONS[n].replace("<svg ", '<svg class="i" aria-hidden="true" ');
const curly = s => String(s ?? "").replace(/(^|[\s(\[“"—-])'/g, "$1‘").replace(/'/g, "’");
const esc = s => curly(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
const attr = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const tip = s => attr(curly(s));   // hover text is shown, so curly apostrophes like the rest (19 Nov review: “Farfetch'd” in tooltips); attr() stays for ids and links
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
const prefs = Object.assign({work: "all", workShow: "all", gender: "any", forms: "all", type: "any", kind: "any",
  unreleased: false, costumes: "auto", events: "all", comingHide: ["research"]}, store.get(PREFS_KEY, {}));   // What's on: research off to begin with (her point, 19 Nov: barely an in-game event)
if (["genders", "caught", "forms"].includes(prefs.work)) prefs.work = "all";
prefs.workShow = "all";   // "Hide ones I have" is always off when the app opens, not remembered (her answer, 21 Nov)
delete prefs.regionShot;   // left from the scenery trial (removed 22 Nov)
try { localStorage.removeItem("jemmas-pokedex-try"); } catch {}   // left from the Try switch (removed 21 Nov)
for (const k of ["jemmas-pokedex-try-art", "jemmas-pokedex-try-boxes", "jemmas-pokedex-try-formnames"]) { try { localStorage.removeItem(k); } catch {} }   // and the 23 Nov "Form names" one (her pick: as now)   // left from the 22 Nov Try switch (removed: her picks, Brighter and the deeper Shiny and Lucky, are in site.css)
const keepPrefs = () => store.set(PREFS_KEY, prefs);

// ---------- what there is ----------
// the sections, in game order: [key, region, small label]. Hisui stands on its own between Galar and Paldea (her call, 9 Nov)
// each region with its games, like Legends: Arceus (her ask, 19 Nov: games, not generation numbers)
const GENS = [["1", "Kanto", "Red and Blue"], ["2", "Johto", "Gold and Silver"], ["3", "Hoenn", "Ruby and Sapphire"], ["4", "Sinnoh", "Diamond and Pearl"],
  ["5", "Unova", "Black and White"], ["6", "Kalos", "X and Y"], ["7", "Alola", "Sun and Moon"], ["8", "Galar", "Sword and Shield"],
  ["hisui", "Hisui", "Legends: Arceus"], ["9", "Paldea", "Scarlet and Violet"]];
const genById = Object.fromEntries(GENS.map(g => [g[0], g]));
// ENTRIES, byId and the other lists made from them are the game shown's (games, below: Pokémon GO or Pokémon HOME, one set of
// pages for both, her ask 22 Nov: “Used shared stuff between games”); useGame() swaps them
let ENTRIES = DATA.entries;
const COSTUMES = DATA.costumes, EVENTS = DATA.events;
// regional forms go under their region, not their species' generation (her call, 9 Nov): Alolan Vulpix in Alola, not Kanto.
// Hisui also gets the Pokémon that first appeared there (#899–905, Wyrdeer to Enamorus).
const REGION_GEN = {Alolan: "7", Galarian: "8", Hisuian: "hisui", Paldean: "9"};
const fixGen = es => es.forEach(e => {
  e.gen = REGION_GEN[(e.form || "").split(" ")[0]] || (e.dex >= 899 && e.dex <= 905 ? "hisui" : String(e.gen));
});
fixGen(ENTRIES);
const SPRITES = new Set(DATA.sprites);
// one picture for a Pokémon in both games (her question, 22 Nov: “aren't we using same source for everything?”): GO's own, and
// where GO's files have none (the Pokémon and forms not in GO yet), Pokémon HOME's own picture of it (build.py: picAlt)
const PIC_ALT = DATA.picAlt || {};
const mkById = es => Object.fromEntries(es.map(e => [e.id, e]));
let byId = mkById(ENTRIES);
const costumeById = Object.fromEntries(COSTUMES.map(c => [c.id, c]));
const cosIdx = new Map(COSTUMES.map((c, i) => [c.id, i]));   // costumes.json is in the game's order: by number, then oldest first
const mkBaseOf = es => { const b = {}; es.forEach(e => { if (!b[e.dex] || (!e.form && b[e.dex].form)) b[e.dex] = e; }); return b; };
let baseOf = mkBaseOf(ENTRIES);   // dex number -> its plain entry (for background Pokémon)
// Lucky comes only from trading, so a Pokémon the game won't let you trade can never be Lucky (the game's own trade flags,
// 12 Nov research: 20 mythicals plus Zygarde and Eternatus; Meltan, Melmetal and Pecharunt can be traded)
const UNTRADEABLE = new Set([151, 251, 385, 386, 489, 490, 491, 492, 493, 494, 647, 648, 649, 718, 719, 720, 721, 801, 802, 807, 890, 893]);
const canLucky = e => e.released && !UNTRADEABLE.has(e.dex);
// Pumpkaboo and Gourgeist are one fixed size per form in GO (the game's size data): never XXS, and only Super Size is XXL
const SIZE_FIXED = new Set([710, 711]);
const neverXXL = e => SIZE_FIXED.has(e.dex) && !e.id.endsWith("-super"), neverXXS = e => SIZE_FIXED.has(e.dex);
const canXXL = e => e.released && !neverXXL(e), canXXS = e => e.released && !neverXXS(e);
const sprite = k => k && SPRITES.has(k) ? `sprites/${k}.webp` : k && SPRITES.has(PIC_ALT[k]) ? `sprites/${PIC_ALT[k]}.webp` : null;
const BIG = new Set(DATA.bigSprites || []);   // the game's full-size pictures, for a Pokémon's page
const bigSprite = k => k && BIG.has(k) ? `sprites/big/${k}.webp` : k && BIG.has(PIC_ALT[k]) ? `sprites/big/${PIC_ALT[k]}.webp` : sprite(k);

// ---------- what she has ----------
let COL = norm(DATA.collection), readOnly = true, loadFailed = false, viewOnly = false, loading = location.protocol.startsWith("http");   // readOnly until the server has given her ticks
const HOME_DATA = DATA.home || {entries: [], collection: {}};   // Pokémon HOME (build.py: data/home/dex.json and her collection/home.json)
const COLS = {go: COL, home: norm(HOME_DATA.collection)};   // each game's ticks; COL is the game shown's
// viewOnly (22 Nov, like her Library's read-only mode): no save server at this address at all (plain web hosting once it's online:
// api/collection missing, refused or not JSON), so the page just shows her ticks as at the last build, quietly: no banner, and the
// boxes don't react to clicks. A real failure of her own server (a 500, a broken answer) still shows loadFailed's note.
function norm(c){ c = c || {}; return {have: c.have || {}, went: c.went || [], costumes: c.costumes || []}; }
const has = (key, t) => (COL.have[key] || []).includes(t);
const hasAny = (key, ts) => ts.some(t => has(key, t));
const dk = e => "d:" + e.id;
const caught = e => (COL.have[dk(e)] || []).length > 0;   // any box ticked: she has one
// Caught ("c") is on every card; ♂ ("cm") and ♀ ("cf") sit beside it wherever that gender exists (her call, 9 Nov)
// male and female fully different (her pick, 18 Nov: Frillish, Pyroar, Unfezant…) are two forms, Male and Female
// (`genderForm`), each its own boxes: no ♂/♀ box on them, the form says it
const maleTick = e => !e.genderForm && (e.gender === "both" || e.gender === "male") ? "cm" : null;
const femaleTick = e => !e.genderForm && (e.gender === "both" || e.gender === "female") ? "cf" : null;
const gName = e => e.name + (e.genderForm ? (e.gender === "female" ? " ♀" : " ♂") : "");   // Unfezant ♀ and Unfezant ♂ side by side (18 Nov)
const gotMale = e => !!maleTick(e) && has(dk(e), maleTick(e));
const gotFemale = e => !!femaleTick(e) && has(dk(e), femaleTick(e));
// species with more than one entry out in GO (Unown, Vivillon, Alolan Vulpix…): their entries are the "forms"
const mkOut = es => { const o = {}; es.forEach(e => { if (e.released) (o[e.dex] = o[e.dex] || []).push(e); }); return o; };
let outBySpecies = mkOut(ENTRIES);

// the extra boxes, only on the Pokémon they can apply to (Serebii's lists, tools/import_go.py)
const EXTRAS = [
  {t: "sd", label: "Shadow", icon: "shadow", flag: "shadow", title: "Shadow"},
  {t: "pu", label: "Purified", icon: "purified", flag: "shadow", title: "Purified"},
  {t: "dx", label: "Dynamax", icon: "dynamax", flag: "dynamax", title: "Dynamax"},
  {t: "gx", label: "Gigantamax", icon: "gigantamax", flag: "gmax", title: "Gigantamax"},
];

// the boxes each game has: GO all of them; Pokémon HOME only what HOME has (her notes, 22 Nov: “Thing like lucky aren't a thing
// there”, “Home is shiny, male/female (like go), maybe dyna and gigan if they are in home”): Caught (in HOME now), Female, Male,
// Shiny and Gigantamax (a Pokémon kept with the Gigantamax Factor; HOME has no Dynamax box: research/home-tracking.md)
let GAME = "go";
const GAME_BOXES = {go: null, home: new Set(["c", "cf", "cm", "s", "gx"])};
const boxOn = t => !GAME_BOXES[GAME] || GAME_BOXES[GAME].has(["mg", "mx", "my"].includes(t) ? "mega" : t);
// which boxes a Pokémon could ever have (her rule, 12 Nov: only what's impossible is left out; ones not in GO yet still
// count, as in the game's Pokédex), from all its entries, out or not. In HOME: a shiny only where HOME can have one, and
// Gigantamax only where it can be kept with the Factor (data/home/dex.json)
const POSSIBLE = {
  c: () => true, s: es => GAME !== "home" || es.some(e => e.shiny), h: () => true, xl: es => es.some(e => !neverXXL(e)), xs: es => !neverXXS(es[0]),
  l: es => !UNTRADEABLE.has(es[0].dex),
  sd: () => true, pu: () => true,   // no rule rules any out (Shadow Darkrai exists, 2025)
  dx: es => !NO_DYNAMAX.has(es[0].dex), gx: es => GAME === "home" ? es.some(e => e.gmax) : es.some(e => GMAX_SPECIES.has(e.dex) && !isRegional(e)),   // no regional form can Gigantamax (Galarian Meowth can't)
  mega: es => es.some(e => (e.mega || []).length || e.megaLater),
  cm: es => es.some(e => maleTick(e)), cf: es => es.some(e => femaleTick(e)),
};
function counts(list){
  // the totals at the top of a page count each Pokémon once, ignoring forms (her call, 11 Nov: forms are counted on each
  // Pokémon's own page, not in these totals), and out of every Pokémon that could ever have that box, out in GO yet or
  // not (12 Nov, as the game's Pokédex counts): got if any of its forms has it
  const r = {species: 0, speciesOut: 0, male: 0, maleOut: 0, female: 0, femaleOut: 0, shiny: 0, shinyOut: 0,
             lucky: 0, luckyOut: 0, hundo: 0, out: 0, sd: 0, pu: 0, shadowOut: 0, dx: 0, dynamaxOut: 0, gx: 0, gmaxOut: 0, mega: 0, megaOut: 0, xl: 0, xlOut: 0, xs: 0, xsOut: 0};
  const by = {};
  for (const e of list) (by[groupKey(e)] = by[groupKey(e)] || []).push(e);   // a regional form is a Pokémon of its own (her call, 14 Nov)
  r.speciesAll = Object.keys(by).length;
  const tally = (es, b, got, out, have) => { if (boxOn(b) && POSSIBLE[b](es)) { r[out]++; if (es.some(e => e.released && got(e))) r[have]++; } };   // only the game's own boxes
  const ticked = t => e => has(dk(e), t);
  for (const es of Object.values(by)) {
    r.out++;
    if (es.some(e => e.released)) r.speciesOut++;
    if (es.some(caught)) r.species++;
    tally(es, "cm", gotMale, "maleOut", "male");
    tally(es, "cf", gotFemale, "femaleOut", "female");
    tally(es, "s", ticked("s"), "shinyOut", "shiny");
    tally(es, "l", ticked("l"), "luckyOut", "lucky");
    if (es.some(ticked("h"))) r.hundo++;
    tally(es, "xl", ticked("xl"), "xlOut", "xl");   // XXL and XXS: nearly any Pokémon can be either (her ask, 12 Nov), not the fixed Pumpkaboo and Gourgeist sizes (15 Nov review)
    tally(es, "xs", ticked("xs"), "xsOut", "xs");
    tally(es, "sd", ticked("sd"), "shadowOut", "sd");
    if (POSSIBLE.pu(es) && es.some(ticked("pu"))) r.pu++;
    tally(es, "dx", ticked("dx"), "dynamaxOut", "dx");
    tally(es, "gx", ticked("gx"), "gmaxOut", "gx");
    tally(es, "mega", e => (e.mega || []).some(m => has(dk(e), m.t)), "megaOut", "mega");
  }
  return r;
}

// the filters (9 Nov, her pick of three tried; since 21 Nov the banner's tabs): choose the box she's working on, and the "Hide ones
// I have" switch; the cards then show only that box. Every box works the same way, Male, Female and Forms included (her rule).
const BOXF = [   // each box as a filter: which Pokémon it applies to, and whether she has it (t: the box)
  {k: "female", t: "cf", label: "Female", applies: e => !!femaleTick(e), have: gotFemale, ticks: e => [femaleTick(e)]},
  {k: "male", t: "cm", label: "Male", applies: e => !!maleTick(e), have: gotMale, ticks: e => [maleTick(e)]},
  {k: "shiny", t: "s", label: "Shiny", applies: e => !!e.shiny || (prefs.unreleased && GAME === "go"),   // with "Not in GO" on, shinies not out yet too (GO only: HOME has no such switch; overnight review, 23 Nov)
   have: e => has(dk(e), "s"), ticks: ["s"]},
  {k: "lucky", t: "l", label: "Lucky", applies: e => canLucky(e), have: e => has(dk(e), "l"), ticks: ["l"]},
  {k: "xxl", t: "xl", label: "XXL", applies: canXXL, have: e => has(dk(e), "xl"), ticks: ["xl"]},
  {k: "xxs", t: "xs", label: "XXS", applies: canXXS, have: e => has(dk(e), "xs"), ticks: ["xs"]},
  {k: "dynamax", t: "dx", label: "Dynamax", applies: e => !!e.dynamax, have: e => has(dk(e), "dx"), ticks: ["dx"]},
  {k: "gmax", t: "gx", label: "Gigantamax", applies: e => !!e.gmax, have: e => has(dk(e), "gx"), ticks: ["gx"]},
  // Mega Evolution and Primal (her ask, 10 Nov: a full box like Dynamax; Mega X and Y a box each, so "have" means all of them)
  {k: "mega", t: "mega", label: "Mega", applies: e => !!(e.mega || []).length, have: e => (e.mega || []).every(m => has(dk(e), m.t)), ticks: e => (e.mega || []).map(m => m.t)},
  {k: "shadow", t: "sd", label: "Shadow", applies: e => !!e.shadow, have: e => has(dk(e), "sd"), ticks: ["sd"]},
  {k: "purified", t: "pu", label: "Purified", applies: e => !!e.shadow, have: e => has(dk(e), "pu"), ticks: ["pu"]},
  {k: "hundo", t: "h", label: "4★", applies: e => e.released, have: e => has(dk(e), "h"), ticks: ["h"]},
];
const workBox = () => BOXF.find(x => x.k === prefs.work && boxOn(x.t));   // the tab picked, if the game shown has that box
const boxPass = (b, val, e) => val === "have" ? b.applies(e) && b.have(e) : val === "need" ? b.applies(e) && !b.have(e) : true;
function boxFilter(e, show = prefs.workShow){
  const b = workBox();
  if (!b) return show !== "need" || !caught(e);   // no tab: "Hide ones I have" shows the ones not caught at all
  return b.applies(e) && boxPass(b, show, e);
}
let showAllBoxes = false;   // the Pokémon page shows every box, whatever tab is picked
function onlyTicks(e){   // cards show only the box she's working on
  if (showAllBoxes) return null;
  const b = workBox();
  return b ? (typeof b.ticks === "function" ? b.ticks(e) : b.ticks) : null;
}
const GENDER_WORDS = {male: "♂ only", female: "♀ only", none: "Genderless"};

// ---------- boxes on a card ----------
// Pokémon whose forms she tracks one by one (her picks, 15 Nov): still one card in the lists, but its boxes there count her
// forms (Shiny 3/6) and the card opens its page (Pumpkaboo and Urshifu added 15 Nov; Sinistea and Polteageist undecided), where every form has its own boxes. Arceus left for when it's out (her call).
const FORM_SPECIES = new Set([150, 351, 386, 413, 479, 483, 484, 487, 492, 550, 641, 642, 645, 646, 649, 710, 711, 718, 720, 741, 745, 774, 800, 849, 892, 905,
  201, 327, 412, 421, 422, 423, 585, 586, 647, 666, 669, 670, 671, 676, 925, 931, 978, 982,
  869,   // Alcremie, like Vivillon (her answer, 22 Nov evening): its 63 flavours in Pokémon HOME (GO has one Alcremie)
  888, 889,   // Zacian and Zamazenta with their Crowned forms, like Necrozma and Kyurem (her answer, 23 Nov: Crowned and Complete Zygarde “Track as own”)
  449, 450, 521, 592, 593, 668, 678, 876, 902, 916]);   // male and female fully different (her pick, 18 Nov)
// her pick of the looks (15 Nov, her idea): each box fills up in its colour as she gets its forms, with the count (Shiny 1/4);
// the filled part is a copy of the box in white words, clipped; every form got = the full box. With a filter tab on, just that box.
function formBoxes(lead, forms, only){
  // every box, counted over her forms that can have it: got/out of; a box no form can have isn't shown
  const out = forms.filter(f => f.released);
  const B = (t, cls, icon, label, can) => {
    if ((only && !only.includes(t)) || !boxOn(t)) return "";   // only the game's own boxes
    const fs = out.filter(can); if (!fs.length) return "";
    const got = fs.filter(f => has(dk(f), t)).length, all = got === fs.length;
    const inner = `${ic(icon)}<span>${esc(label)}</span><b>${got}/${fs.length}</b>`;
    // a link, so no aria-pressed (axe, 22 Nov: not allowed on <a>); data-all fills it, and the count is in its text and title
    return `<a class="tk fb ${cls}" href="${pageOf(lead)}" data-all="${all}" title="${tip(`${label}: ${got} of ${fs.length} forms`)}" style="--p:${Math.round(got / fs.length * 100)}%">` +
      inner + (got && !all ? `<span class="fill" aria-hidden="true">${inner}</span>` : "") + `</a>`;
  };
  const megaT = [...new Set(out.flatMap(f => (f.mega || []).map(m => m.t)))];
  const rows = [
    [B("c", "c", "poke-ball", "Caught", () => true)],
    [B("cf", "f", "venus", "Female", femaleTick), B("cm", "m", "mars", "Male", maleTick)],
    [B("s", "s", "sparkles", "Shiny", f => !!f.shiny), B("l", "l", "lucky", "Lucky", canLucky)],
    [B("xl", "xl", "expand", "XXL", f => !neverXXL(f)), B("xs", "xs", "shrink", "XXS", f => !neverXXS(f))],
    [B("dx", "dx", "dynamax", "Dynamax", f => !!f.dynamax)], [B("gx", "gx", "gigantamax", "Gigantamax", f => !!f.gmax)],   // a full row each, so Gigantamax is the same size as the rest (her pick, 21 Nov)
    megaT.map(t => B(t, "mg", "mega", t === "mx" ? "Mega X" : t === "my" ? "Mega Y" : "Mega", f => (f.mega || []).some(m => m.t === t))),
    [B("sd", "sd", "shadow", "Shadow", f => !!f.shadow), B("pu", "pu", "purified", "Purified", f => !!f.shadow)],
    [B("h", "h", "star", "4★", () => true)],
  ];
  if (only) { const one = rows.flat().filter(Boolean).join(""); return one ? `<div class="ticks big fbs">${one}</div>` : ""; }
  return `<div class="boxgrid fbs">` + rows.filter(r => r.some(Boolean)).map(r => r.length === 1 ? r[0].replace('class="tk ', 'class="tk wide ') : (r[0] || "<span></span>") + (r[1] || "<span></span>")).join("") + `</div>`;
}
// a form-tracked card is marked (got) only when every form that can has it: caught, or with a tab on, that tab's box
const formsGot = (forms, tab) => { const fs = forms.filter(f => f.released && (!tab || tab.applies(f))); return fs.length > 0 && fs.every(f => tab ? tab.have(f) : caught(f)); };
function boxes(e){
  // a fixed two-column grid, so every box has the same place on every card (her point, 9 Nov: the ragged rows looked
  // bizarre), in the game's Pokédex order like everything else (her rule, 12 Nov): Caught · Female | Male · Shiny | Lucky ·
  // XXL | XXS · Dynamax | G-Max · Mega (X | Y) · Shadow | Purified · 4★. A box that can't apply leaves its place empty;
  // a row with nothing in it is left out.
  const only = onlyTicks(e);
  const k = dk(e), btn = (t, cls, icon, label, title, off) => {
    if ((only && !only.includes(t)) || !boxOn(t)) return "";   // only the game's own boxes
    const on = has(k, t);
    return `<button class="tk ${cls}" type="button" data-tick="${t}" aria-pressed="${on}" title="${tip(title)}" aria-label="${attr(title)}"${off && !on ? " disabled" : ""}>${ic(icon)}<span>${esc(label)}</span></button>`;
  };
  const x = t => EXTRAS.find(z => z.t === t);
  const extra = (t, label) => e[x(t).flag] ? btn(t, t, x(t).icon, label || x(t).label, x(t).title) : "";
  const megas = (e.mega || []).map(m => btn(m.t, "mg", "mega", m.label, m.label));
  const rows = [
    [btn("c", "c", "poke-ball", "Caught", "Caught")],
    [femaleTick(e) ? btn("cf", "f", "venus", "Female", e.gender === "female" ? "Female (female only)" : "Female") : "",
     maleTick(e) ? btn("cm", "m", "mars", "Male", e.gender === "male" ? "Male (male only)" : "Male") : ""],   // female first (her call)
    [btn("s", "s", "sparkles", "Shiny", e.shiny ? "Shiny" : GAME === "home" ? "No shiny in Pokémon HOME" : "No shiny in GO yet", !e.shiny),
     UNTRADEABLE.has(e.dex) && !has(k, "l") ? "" : btn("l", "l", "lucky", "Lucky", "Lucky", !canLucky(e))],   // a box that can never be (a mythical’s Lucky) isn’t shown (her call, 10 Nov)
    [neverXXL(e) && !has(k, "xl") ? "" : btn("xl", "xl", "expand", "XXL", "XXL", !e.released), neverXXS(e) && !has(k, "xs") ? "" : btn("xs", "xs", "shrink", "XXS", "XXS", !e.released)],
    [extra("dx")], [extra("gx")],   // a full row each (her pick, 21 Nov: Gigantamax was squeezed into smaller writing)
    megas.length > 1 ? megas : [megas[0] || ""],
    [extra("sd"), extra("pu")],
    [btn("h", "h", "star", "4★", "4★ (perfect IVs)", !e.released)],
  ];
  if (only) {   // working on one box: just that one, bigger
    const one = rows.flat().filter(Boolean).join("");
    return one ? `<div class="ticks big">${one}</div>` : "";
  }
  return `<div class="boxgrid">` + rows.filter(r => r.some(Boolean)).map(r => r.length === 1 ? r[0].replace('class="tk ', 'class="tk wide ') : (r[0] || "<span></span>") + (r[1] || "<span></span>")).join("") + `</div>`;
}

// the picture: small ✨ and ♀ buttons on it flip to the shiny / female picture (9 Nov: clicking the picture itself was
// too hidden, her words). It shows the normal colours unless she is on the Shiny tab: the shiny has its own box and
// picture (13 Nov, her question: after Fast tick nearly every picture had turned shiny).
const picFlip = new Map();   // key -> {s, f} she has flipped to (until the page is reloaded)
const shinyFirst = () => prefs.work === "shiny";
function pic(item, key, big = false){
  const shinyPic = sprite(item.img + ".s"), femalePic = item.femaleImg && sprite(item.femaleImg);
  const st = picFlip.get(key) || {s: shinyFirst(), f: !!femalePic};   // female look first (her call)
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
// regional forms are Pokémon of their own (her call, 14 Nov: Hisuian Growlithe is listed apart from Growlithe, with its own
// card and page); other forms (Unown, Rotom, Vivillon…) stay one card and one page per number. The three Paldean Tauros are one.
const groupKey = e => isRegional(e) ? `${e.dex}-${e.form.split(" ")[0].toLowerCase()}` : String(e.dex);
const R = path => (GAME === "home" ? "#hm-" : "#") + path;   // an address in the game shown: #gen-1 in GO, #hm-gen-1 in HOME
const pageOf = e => R("p-" + groupKey(e));
const cosName = c => c.form ? `${c.costume} · ${c.form}` : c.costume;   // a costume on a form says which (Halloween · Small, 15 Nov)
// a form's name; the plain form is named after its own region, not "usual" (her ask, 13 Nov: Tauros is Kanto)
const formTag = e => e.form || (ENTRIES.some(x => x.dex === e.dex && isRegional(x)) && (genById[e.gen] || [])[1]) || "";   // a region name only tells apart a regional form's usual one (Tauros); 19 Nov review: plain Rotom showed "Sinnoh"
const formLabel = e => formTag(e) || e.name;   // 19 Nov review: plain Rotom showed "Sinnoh"
function groupByNumber(items){
  const groups = [], byDex = {};
  for (const e of items) {
    const k = groupKey(e);
    if (!byDex[k]) groups.push(byDex[k] = []);
    byDex[k].push(e);
  }
  return groups.map(g => {
    const lead = g.find(x => !x.form) || g.find(x => x.default) || g.find(x => /^[a-z0-9]/i.test(x.form)) || g[0];   // the game's default form first (Unown F)
    const odd = x => /^[a-z0-9#]/i.test(x.form || "") ? 0 : 1;   // Unown: A to Z, then ! and ?
    return {lead, others: g.filter(x => x !== lead).sort((a, b) => odd(a) - odd(b))};
  });
}
// a Pokémon's other forms: small pictures inside its card (9 Nov: no expanding, and not as ordinary cards, her words).
// Clicking one ticks that form: Caught, or with a tab on, that tab's box. Ticked ones light up in the box's colour.
// a card shows a small "Forms 3/28" button; it opens a pop-up with every form as a full card with all its boxes (9 Nov:
// forms inside the card made Unown's card far too tall; she wants shiny etc. for each form, her words). The list never changes.
const groupsByDex = {};   // the current page's groups, for the pop-up
const formGot = e => { const b = workBox(); return b ? b.applies(e) && b.have(e) : caught(e); };
function formsButton(lead, others){
  if (!others.length) return "";
  const all = [lead, ...others];
  return `<a class="formsbtn" href="${pageOf(lead)}">${ic("layers")}Forms ${all.filter(formGot).length}/${all.length}</a>`;
}
// a card's HTML is kept and used again while nothing it shows has changed (her ticks on that number's entries, its picture
// flips, the tab picked): drawing 1,000 cards for one tick took about 50 ms of the time a tick takes on Every Pokémon
const mkGroups = es => { const g = {}; es.forEach(e => (g[groupKey(e)] = g[groupKey(e)] || []).push(e)); return g; };
let BY_GROUP = mkGroups(ENTRIES);
const cardMemo = new Map();
let cardMemoFor = "";
function groupCardList(groups){
  for (const k in groupsByDex) delete groupsByDex[k];
  groups.forEach(g => { groupsByDex[groupKey(g.lead)] = g; });
  const now = JSON.stringify([GAME, prefs.work, showAllBoxes, viewOnly]);
  if (now !== cardMemoFor || cardMemo.size > 5000) { cardMemo.clear(); cardMemoFor = now; }
  return groups.map(({lead, others}) => {
    const all = BY_GROUP[groupKey(lead)];
    const k = lead.id + "|" + others.map(o => o.id).join() + "|" + all.map(e => (COL.have[dk(e)] || []).join()).join(";") + "|" + JSON.stringify(picFlip.get(dk(lead)) || null);
    let h = cardMemo.get(k);
    if (h === undefined) { h = card(lead, formsButton(lead, others), false, FORM_SPECIES.has(lead.dex) ? all : null); cardMemo.set(k, h); }
    return h;
  });
}
const groupCards = groups => groupCardList(groups).join("");
// a list page (Every Pokémon, a region, a search) drawn again with the same cards in the same order (a tick, mostly) changes only
// what is different: the banner's totals and the one card ticked, not all 1,000 cards (round 5 review, 22 Nov: every tick on
// Every Pokémon froze the page for 5–6 s; drawing it all again takes about a second even before the labels are fitted)
let lastList = null;
function drawList(hero, mid, cards, ids){
  const L = lastList, grid = view.querySelector(":scope > #grid"), where = location.hash + "|" + q.value;
  if (L && L.first === view.firstElementChild && L.where === where && L.mid === mid && cards && L.cards && grid && grid.children.length === cards.length && ids.join() === L.ids.join()) {
    const heroEl = view.firstElementChild, changed = [];
    if (L.hero !== hero) {   // the banner: the same element, new insides (so the page isn't redrawn and nothing jumps)
      const t = document.createElement("template"); t.innerHTML = hero; const h = t.content.firstElementChild;
      for (const a of [...heroEl.attributes]) if (!h.hasAttribute(a.name)) heroEl.removeAttribute(a.name);
      for (const a of h.attributes) if (heroEl.getAttribute(a.name) !== a.value) heroEl.setAttribute(a.name, a.value);
      heroEl.replaceChildren(...h.childNodes);
    }
    cards.forEach((c, i) => { if (c !== L.cards[i]) { grid.children[i].outerHTML = c; changed.push(grid.children[i]); } });
    if (L.hero !== hero) for (const st of heroEl.querySelectorAll(".stats")) fitTabs(st);
    if (changed.length) fitCardLabels(changed);
  } else view.innerHTML = hero + mid + (cards ? `<div class="grid" id="grid">${cards.join("")}</div>` : `<p class="empty">Nothing here.</p>`);
  lastList = {hero, mid, cards, ids, where, first: view.firstElementChild};
}

const HL = {caught: "--caught", female: "--female", male: "--male", shiny: "--shiny", lucky: "--lucky", hundo: "--hundo",
            shadow: "--shadow", purified: "--purified", dynamax: "--dynamax", gmax: "--gmax", mega: "--mega", xxl: "--xxl", xxs: "--xxs"};
function card(e, more = "", inForms = false, forms = null){
  const flags = [];
  if (!e.released) flags.push("Not out yet");
  if (e.class === "legendary") flags.push("Legendary");
  if (e.class === "mythical") flags.push("Mythical");
  if (e.class === "ultra-beast") flags.push("Ultra Beast");
  const gw = e.genderForm ? null : GENDER_WORDS[e.gender];   // a Male or Female form says it already
  // the card is marked when she has it: caught, or with a tab on, that tab's box, in its colour (her call, 9 Nov)
  const tab = !showAllBoxes && workBox();
  const byForm = forms && FORM_SPECIES.has(e.dex);
  const got = byForm ? formsGot(forms, tab) : tab ? tab.applies(e) && tab.have(e) : caught(e);
  const some = byForm && !got && forms.some(f => tab ? tab.applies(f) && tab.have(f) : caught(f));   // some of its forms: not faded (binder review, 21 Nov: Floette 2/5 looked not caught)
  const shiny = byForm ? forms.some(f => has(dk(f), "s")) : has(dk(e), "s");   // the foil shows whatever tab is on (binder review, 21 Nov)
  return `<div class="card${e.released ? "" : " out-not"}${got ? " got" : ""}${some ? " some" : ""}${shiny ? " shiny" : ""}${inForms ? " informs" : ""}" data-id="${attr(e.id)}" data-t1="${attr((e.types || [])[0] || "")}"${got ? ` style="--hl:var(${HL[tab ? tab.k : "caught"]})"` : ""}>` +
    `<span class="no">#${pad(e.dex)}</span>` + (flags.length ? `<span class="flags">${flags.map(f => `<span>${esc(f)}</span>`).join("")}</span>` : "") +
    pic(e, dk(e)) +
    `<a class="nm" href="${pageOf(e)}" title="Open ${tip(e.name)}’s page">${esc(e.name)}</a><small class="fm">${esc(e.form || "")}${e.form && gw ? " · " : ""}${gw ? `<span class="gd">${esc(gw)}</span>` : ""}</small>` +
    (byForm ? formBoxes(e, forms, onlyTicks(e)) : boxes(e)) + more + `</div>`;
}

// ---------- the banner and sidebar look: “Colours + parade” (her pick, 10 Nov, of the trial looks): each region's colour in
// the banner and its Pokémon walking along the bottom, a dark sidebar; no parade on a Pokémon's page. The CSS is under
// “the look” in site.css (data-look="mix"); she may want to change the parade later.
// each region's colour (a suggestion, after its games' colours): Kanto red, Johto gold,
// Hoenn sapphire, Sinnoh pearl-violet, Unova black, Kalos blue, Alola sunset orange, Galar purple, Hisui forest, Paldea scarlet-violet
const REGION_COLOURS = {"1": "#A3302A", "2": "#8E6A0E", "3": "#16618A", "4": "#5B4B94", "5": "#36353D", "6": "#2B55A3",
  "7": "#B5531C", "8": "#6E2D82", "hisui": "#3C6150", "9": "#952F57"};
document.documentElement.dataset.look = "mix";
const setRegion = g => document.documentElement.style.setProperty("--rc", REGION_COLOURS[g] || GAME_COLOUR);   // a page with no region: the game's own colour
const REGION_CHOSEN = {"1": "kanto-map-2.jpg", "2": "johto-map-1.jpg", "3": "hoenn-map-2.jpg", "4": "sinnoh-map-3.jpg", "5": "unova-map-2.jpg", "6": "kalos-map-2.jpg", "7": "alola-map-1.jpg", "8": "galar-map-1.jpg", "hisui": "hisui-map-1.jpg", "9": "paldea-map-1.jpg"};   // her picks: the official painted region maps (12 Nov; she switched from scenery)
// which part of a picture the banner shows, where the middle isn't the best part (12 Nov: Kanto's Route 1 was nearly all sky):
// a closer crop towards the ground; the picture itself is unchanged
const SHOT_FIT = {"kanto-map-2.jpg": "center/cover", "johto-map-1.jpg": "center/cover", "hoenn-map-2.jpg": "center/cover", "unova-map-2.jpg": "center/cover", "galar-map-1.jpg": "center 45%/cover", "hisui-map-1.jpg": "50% 50%/112% auto", "paldea-map-1.jpg": "center/cover", "sinnoh-map-3.jpg": "50% 48%/118% auto", "kalos-map-2.jpg": "center/cover", "alola-map-1.jpg": "center 45%/cover"};   // maps: the middle; Hisui closer, so its parchment edge is cut off (her ask, 12 Nov)   // maps: the middle
// a narrower picture shown less zoomed in: the banner's picture area takes this shape (width / height), so more of it shows and
// it still blends softly into the colour on the left (12 Nov: Johto looked too zoomed in)
const SHOT_RATIO = {};
// ?fit=, ?ratio= and ?pic= are for pictures of options only. Anything from the address is checked against a strict format before
// it is used, and escaped too (round 4 review, 22 Nov: a crafted link could break out of the style attribute and run script)
const TRY = new URLSearchParams(location.search);
const tryVal = (k, re) => { const v = TRY.get(k); return v && v.length <= 80 && re.test(v) ? v : null; };
const FIT_TRY = tryVal("fit", /^[a-z0-9%. ]+(\/[a-z0-9%. ]+)?$/i);   // background position[/size]: "center 45%/cover", "50% 50%/112% auto"
const RATIO_TRY = tryVal("ratio", /^\d{1,4}(\.\d{1,3})?( ?\/ ?\d{1,4}(\.\d{1,3})?)?$/);   // "16/9" or "1.6"
const PIC_TRY = tryVal("pic", /^[a-z0-9][a-z0-9_-]{0,60}\.(jpg|jpeg|png|webp)$/i);   // a file name in site/regions, nothing else
// a map whose top is plain white sky gets it lifted out of the banner (her note, 22 Nov: in dark mode at about 1000 wide the top
// of Kanto's map showed as a white haze, top right; at narrow banners the whole height of the map shows): site.css --shotlift
const SHOT_LIFT = {"kanto-map-2.jpg": "10%"};
const shotStyle = f => { const fit = FIT_TRY || SHOT_FIT[f], ratio = RATIO_TRY || SHOT_RATIO[f], lift = PIC_TRY ? null : SHOT_LIFT[f], sm = PIC_TRY ? null : phoneMap(f);
  return ` style="${attr(`--shot:url('regions/${f}')${sm ? `;--shotsm:url('${sm}')` : ""}${fit ? `;--shotfit:${fit}` : ""}${ratio ? `;--shotratio:${ratio}` : ""}${lift ? `;--shotlift:${lift}` : ""}`)}"`; };
// phones and narrow windows (900px and under) get a copy of the map 1200 px wide (round 5 phone review: Kanto's banner was a
// 1.76 MB picture for a strip 390 px wide): site/regions/phone/, made by tools/make_home_maps.py with Home's copies
const phoneMap = f => Object.values(REGION_CHOSEN).includes(f) ? `regions/phone/${f.replace(/\.\w+$/, "")}.webp` : null;
const shotCls = f => RATIO_TRY || SHOT_RATIO[f] ? " ratio" : "";
// banners for the other pages (13 Nov, her ask: no plain colour or parade anywhere): a row of pictures filling the banner's
// right side like the region maps; Home and Every Pokémon: all ten region maps side by side; Event Pokémon: her
// events' background cards; Fast tick and a Pokémon's page: its region's map
const heroPics = (srcs, cls = "") => srcs.length ? `<span class="heropics${cls ? " " + cls : ""}">${srcs.map(f => `<i style="--pic:url('${f}')"></i>`).join("")}</span>` : "";
// one region's map (Fast tick for a region, a Pokémon's page), cropped and lifted like the region page's own banner (round 5
// review: Kanto's white sky still showed at the top right of these at about 1000 wide), the phone copy on narrow windows
function regionPics(g){
  const f = REGION_CHOSEN[g]; if (!f) return "";
  const sm = phoneMap(f), fit = SHOT_FIT[f], lift = SHOT_LIFT[f];
  return `<span class="heropics one"${lift ? ` style="--shotlift:${lift}"` : ""}><i style="${attr(`--pic:url('regions/${f}')${sm ? `;--picsm:url('${sm}')` : ""}${fit ? `;--fit:${fit}` : ""}`)}"></i></span>`;
}
// the ten maps side by side (Every Pokémon, Fast tick, Looking for, What's on): Home's smaller copies, the strip being the same
// size there (round 5 review: each of those pages downloaded about 13 MB of full-size maps)
const ALL_MAPS = () => homeMaps();

// Home's banner: smaller copies of the region maps (her pick, 22 Nov, from the Try switch: "Smaller"): site/regions/home/,
// WebP 660 px tall (twice the 330 px shown), made by tools/make_home_maps.py from REGION_CHOSEN (run it after changing a map).
const homeMaps = () => GENS.map(([g]) => REGION_CHOSEN[g] ? `regions/home/${REGION_CHOSEN[g].replace(/\.\w+$/, "")}.webp` : null).filter(Boolean);

function regionShot(g){   // style for a region page's banner: her picked map (12 Nov; the scenery trial and its switch were removed 22 Nov)
  const f = PIC_TRY || REGION_CHOSEN[g];   // ?pic= for pictures of options only
  return f ? {style: shotStyle(f), cls: " withshot" + shotCls(f), sw: ""} : {style: "", sw: ""};
}
function firstStages(list){   // a region's starters (first stages that aren't regional forms), then the rest of the page
  const firsts = list.filter(e => e.released && !isRegional(e) && !(EVO_IN[e.id] || []).length && (e.evo || []).length);
  return [...firsts.slice(0, 3), ...list];
}

// ---------- pages ----------
const view = document.getElementById("view"), nav = document.getElementById("nav"), q = document.getElementById("q");
// labels that don't fit get smaller writing (never cut short), the banner tabs go into rows, and a wide family of evolutions
// stacks downwards; run after every page is drawn and on every resize. Fast (round 5 review, 22 Nov: Every Pokémon froze for
// 5–6 s after every tick, measuring 9,000 labels one at a time): every label is read first, then written; the same word in a box
// of the same width needs the same size, so each is measured once (fitMemo) and that size given to all of them.
const fitMemo = new Map();   // label text | count | box width -> how it fitted; emptied when the window or the font changes
function fitLabels(){
  for (const st of view.querySelectorAll(".hero .stats")) fitTabs(st);
  // the family of evolutions wider than the page stacks downwards (second review, 21 Nov: it slid sideways on a phone and at 901–960)
  for (const e of view.querySelectorAll(".evo")) { e.classList.remove("stack"); if (e.scrollWidth > e.clientWidth + 1) e.classList.add("stack"); }
  fitStrips();
  fitCardLabels();
  fitSquareNames();
}
// a Pokémon page's picture boxes: every label in the strip one size, the size the longest needs, never under 8px, icon kept (her
// note, 21 Nov; round 5 review: the check measured the box, not the label, so labels ran into the border, mixed sizes down to 6.5px)
// One row while every box is at least STRIP_BOX wide, otherwise two even rows (.two, site.css; phones have their rows of three).
const STRIP_FLOOR = 8, STRIP_BOX = 72;   // 72: her 1600 window keeps Charizard’s 14 in one row (75px each)
function fitStrips(){
  for (const strip of view.querySelectorAll(".pcs-strip")) {
    const labs = [...strip.querySelectorAll(".pc.small .pclab")];
    for (const l of labs) l.style.fontSize = "";
    strip.classList.remove("two");
    const first = strip.querySelector(".pc");
    if (first && strip.children.length > 3 && first.getBoundingClientRect().width < STRIP_BOX && innerWidth > 700) strip.classList.add("two");
    if (!labs.length || !labs.some(textOver)) continue;
    let f = parseFloat(getComputedStyle(labs[0]).fontSize);
    do { f -= 0.25; for (const l of labs) l.style.fontSize = f + "px"; } while (f > STRIP_FLOOR && labs.some(textOver));
  }
}
// a card's box label that doesn't fit (Gigantamax, or Dynamax with a form count) gets a little smaller, always keeping its
// icon, never cut short (rule review, 20 Nov: "Giganta…" on every card; her rule, 14 Nov: Gigantamax in full); the same word
// the same size on every card (her note, 21 Nov: Gigantamax kept coming out a different size)
function fitCardLabels(only = null){   // only: just these cards (one ticked), the page's sizes kept from its last fit
  const sps = (only || [view]).flatMap(r => [...r.querySelectorAll(".boxgrid .tk > span:not(.fill)")]);
  if (!sps.length) return;
  const items = [];
  for (const sp of sps) {   // 1. undo an earlier fit (writes only)
    const tk = sp.parentElement;
    if (sp.style.fontSize) sp.style.fontSize = "";
    if (tk.classList.contains("tight") || tk.classList.contains("widefit")) tk.classList.remove("tight", "widefit");
    items.push({sp, tk});
  }
  for (const it of items) {   // 2. read every box's width (one layout for all of them)
    const w = it.tk.getBoundingClientRect().width;
    it.word = it.sp.textContent;
    it.key = w ? `${it.word}|${it.tk.querySelector(":scope > b")?.textContent || ""}|${w.toFixed(2)}` : null;   // 0 wide: not shown
    if (it.key && !fitMemo.has(it.key)) it.gw = it.tk.parentElement.getBoundingClientRect().width;
  }
  for (const it of items) if (it.gw && !fitMemo.has(it.key)) fitMemo.set(it.key, fitOneLabel(it));   // 3. each new kind once
  const least = only ? fitLeast : (fitLeast = new Map());   // 4. the same word the same size: the smallest any of its boxes needed
  for (const it of items) if (it.key) least.set(it.word, Math.min(least.get(it.word) ?? Infinity, fitMemo.get(it.key).size));
  for (const it of items) {   // 5. write, only where something changes
    if (!it.key) continue;
    const r = fitMemo.get(it.key), f = least.get(it.word), copy = it.tk.querySelector(".fill > span");
    if (r.tight) it.tk.classList.add("tight");
    if (r.widefit) it.tk.classList.add("widefit");
    const size = f < r.natural - .01 ? f + "px" : "";
    if (size) it.sp.style.fontSize = size;
    if (copy && copy.style.fontSize !== size) copy.style.fontSize = size;   // the white copy over the filled part, the same size
  }
}
let fitLeast = new Map();   // word -> the size every box with it has on this page
// one label measured on a copy of its box, off the page and walled in (contain:strict), so trying sizes never makes the browser
// lay out the whole page again (that was the 5-second freeze: each try re-laid out 1,000 cards)
let fitBox = null;
function fitOneLabel(it){   // how one label fits: a little less space round it, then smaller writing, then the whole row
  if (!fitBox) { fitBox = document.createElement("div"); fitBox.setAttribute("aria-hidden", "true"); document.getElementById("main").append(fitBox); }
  fitBox.style.cssText = "position:fixed;left:-10000px;top:0;width:2000px;height:400px;visibility:hidden;contain:strict;pointer-events:none;margin:0";
  fitBox.className = it.tk.closest(".card")?.className || "";
  fitBox.innerHTML = `<div class="${attr(it.tk.parentElement.className)}" style="width:${it.gw}px;margin:0">${it.tk.outerHTML}</div>`;
  const tk = fitBox.querySelector(".tk"), sp = tk.querySelector(":scope > span:not(.fill)");
  const over = () => textOver(sp), natural = parseFloat(getComputedStyle(sp).fontSize);
  let tight = false, widefit = false, f = natural;
  if (over()) {
    tk.classList.add("tight"); tight = true;   // first a little less space around it, keeping the icon (every box has one, her rule)
    while (over() && f > 7.5) sp.style.fontSize = (f -= 0.25) + "px";   // smaller writing, the icon always kept (her note, 21 Nov)
    if (over()) { tk.classList.add("widefit"); widefit = true; sp.style.fontSize = ""; f = natural; while (over() && f > 9) sp.style.fontSize = (f -= 0.25) + "px"; }   // still too long: the whole row
  }
  fitBox.innerHTML = ""; fitBox.className = "";
  return {tight, widefit, size: f, natural};
}
// a square's name too long to wrap (one long word: "Crabominable" on Looking for at 1280) gets smaller, not cut (21 Nov review)
function fitSquareNames(){
  const ns = [...view.querySelectorAll(".fastset .fc .fcn")];
  for (const n of ns) if (n.style.fontSize) n.style.fontSize = "";
  const items = ns.map(n => ({n, key: "fcn|" + n.textContent + "|" + n.clientWidth}));
  for (const it of items) if (!fitMemo.has(it.key)) {
    const n = it.n; let f = parseFloat(getComputedStyle(n).fontSize); const natural = f;
    while (n.scrollWidth > n.clientWidth && f > 7) n.style.fontSize = (f -= 0.25) + "px";
    fitMemo.set(it.key, {size: f, natural});
  }
  for (const it of items) { const r = fitMemo.get(it.key); it.n.style.fontSize = r.size < r.natural ? r.size + "px" : ""; }
}
// the banner's tabs (her note, 21 Nov: the writing shrinks, the icon stays, in line with the rest): every label whole, at
// TAB_MIN (8.5px) or more beside its icon, in one row where that fits; otherwise in even rows (13 as 7 + 6, then 5 + 5 + 3 …)
// rather than sliding sideways or cut at the banner's edge (second review, 21 Nov: at 1280 "4★" was cut in half and Gigantamax
// was 7.5px). Her answer (21 Nov): at 1280 one row with smaller writing rather than two rows, the same on every region and
// Every Pokémon; rows only where even TAB_MIN won't fit (phones). Tiles that aren't tabs (Home, a set's page) keep 10px. A single row of a few tiles (a set's page: Backgrounds) keeps the tiles' usual size (her rule, 13 Nov) unless a label
// needs more, then they widen just enough. Only if nothing fits does a label go under that floor (never under 7px). Measured to the
// fraction of a pixel (textOver), since scrollWidth rounds. Tab rows are laid out for the longest label any page can have
// ("Gigantamax"), so every region page and Every Pokémon have tabs of the same size, in one row or in the same rows (her note,
// 21 Nov: Kanto's tabs came out bigger than the rest and didn't fit in a line, because only regions with a Gigantamax tab
// were sent to rows).
const tabCanvas = document.createElement("canvas").getContext("2d");
const TAB_MIN = 8.5;   // the smallest writing on a banner tab before they go into rows (her answer, 21 Nov: smaller rather than two rows)
// windows wider than 900 (her decision, 22 Nov: at 901-1450 the tabs went into 7 + 6 and covered more of the map): always one
// row, smaller. The usual tabs (icon beside the label) at TAB_MIN or more, else down to TAB_FLOOR; only where even that won't
// fit (under about 1180 wide) the icon goes above the label (.stacked, tighter, site.css), down to TAB_FLOOR. Phones (900 and
// under) keep their rows.
const TAB_FLOOR = 7;
function longestFits(t, px){   // would "Gigantamax" fit whole at px beside its icon in this tile (above it, in .stacked)?
  const l = t.querySelector(".slt"), sl = l.parentElement, ic = t.parentElement.classList.contains("stacked") ? null : sl.querySelector(":scope > svg, :scope > .i"), cs = getComputedStyle(t), ls = getComputedStyle(l);
  tabCanvas.font = `${ls.fontWeight} ${px}px ${ls.fontFamily}`;
  const room = t.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - (ic ? ic.getBoundingClientRect().width + (parseFloat(getComputedStyle(sl).columnGap) || 0) : 0);
  return tabCanvas.measureText("Gigantamax").width <= room - 1;   // a pixel to spare, as the page measures a hair wider
}
function fitTabs(st){
  const tiles = [...st.querySelectorAll(":scope > .stat")], labs = tiles.map(t => t.querySelector(".slt")).filter(Boolean);
  st.classList.remove("rows", "stacked"); st.style.gridTemplateColumns = "";
  for (const l of labs) l.style.fontSize = "";
  if (!labs.length || !st.offsetParent) return;
  if (st.querySelector(".stattab") && innerWidth > 900) {   // one row, smaller (her decision, 22 Nov)
    const oneRow = least => { for (const l of labs) l.style.fontSize = "";
      if (!longestFits(tiles[0], least)) return false;
      let f = parseFloat(getComputedStyle(labs[0]).fontSize);
      while (f > least && !longestFits(tiles[0], f)) f -= 0.25;
      for (const l of labs) if (parseFloat(getComputedStyle(l).fontSize) > f) l.style.fontSize = f + "px";
      return labs.every(l => { let g = parseFloat(getComputedStyle(l).fontSize); while (textOver(l) && g > least) l.style.fontSize = (g -= 0.25) + "px"; return !textOver(l); }); };
    if (oneRow(TAB_MIN) || oneRow(TAB_FLOOR)) return;
    st.classList.add("stacked"); if (oneRow(TAB_FLOOR)) return;
    st.classList.remove("stacked");
    for (const l of labs) l.style.fontSize = "";
  }
  const n = tiles.length, top = tiles[0].offsetTop, c0 = tiles.filter(t => t.offsetTop === top).length;
  const tabs = !!st.querySelector(".stattab"), most = tabs ? 13 : n, least = tabs ? TAB_MIN : 10;   // tab rows: always as for the thirteen tabs of Kanto or Galar
  const cols = [c0];   // as laid out, then fewer columns: even rows, or (a few tiles in one row) a little wider each
  if (tabs || c0 < n) for (let r = 2; r <= most; r++) { const c = Math.ceil(most / r); if (c < cols[cols.length - 1]) cols.push(c); if (c <= 3) break; }
  else { const gap = parseFloat(getComputedStyle(st).columnGap) || 0, w = tiles[0].getBoundingClientRect().width;
    for (let k = Math.round((st.clientWidth + gap) / (w + gap)) - 1; k >= Math.max(n, 2); k--) cols.push(k); }
  const fit = least => labs.every(l => { let f = parseFloat(getComputedStyle(l).fontSize); while (textOver(l) && f > least) l.style.fontSize = (f -= 0.25) + "px"; return !textOver(l); });
  for (let i = 0; i < cols.length; i++) {
    if (i) { st.classList.add("rows"); st.style.gridTemplateColumns = `repeat(${cols[i]},minmax(0,1fr))`; for (const l of labs) l.style.fontSize = ""; }
    if (tabs && longestFits(tiles[0], least)) {   // every tab's writing the size "Gigantamax" needs, so every region and Every Pokémon match (her note, 21 Nov)
      let f = parseFloat(getComputedStyle(labs[0]).fontSize);
      while (f > least && !longestFits(tiles[0], f)) f -= 0.25;
      for (const l of labs) if (parseFloat(getComputedStyle(l).fontSize) > f) l.style.fontSize = f + "px";
    }
    if ((!tabs || longestFits(tiles[0], least)) && fit(least)) return;
  }
  fit(7);
}
// overflow measured to the fraction of a pixel (scrollWidth rounds, so "Mega X" 39.4 in 39 showed "Mega…": 21 Nov review)
const textRange = document.createRange();
function textOver(el){ textRange.selectNodeContents(el); const cs = getComputedStyle(el);
  return textRange.getBoundingClientRect().width > el.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) + 0.05; }
new MutationObserver(fitLabels).observe(view, {childList: true});
let fitTimer;   // a resize refits once the window has stopped changing (round 5 review: every resize frame refitted the page)
addEventListener("resize", () => { clearTimeout(fitTimer); fitTimer = setTimeout(() => { fitMemo.clear(); fitLabels(); }, 120); });
if (document.fonts) { const refit = () => { fitMemo.clear(); fitLabels(); }; document.fonts.ready.then(refit); document.fonts.addEventListener("loadingdone", refit); }   // the label font arriving late changes the widths

function statTile(colour, icon, label, have, of, extra = "", work = null){
  if (work) return `<button type="button" class="stat stattab" data-work="${work}" aria-pressed="${prefs.work === work}" title="${tip(work === "all" ? "Show every box" : "Show only " + label)}" style="--sc:var(${colour})"><span class="sl">${ic(icon)}<span class="slt">${esc(label)}</span></span><b>${num(have)}<small> of ${num(of)}</small></b>
    <span class="sbar"><i style="width:${of ? have / of * 100 : 0}%"></i></span>${extra}</button>`;   // the tabs at the top are the filter (her pick, 21 Nov): click one for that box, again (or Pokémon) for every box
  return `<div class="stat" style="--sc:var(${colour})"><span class="sl">${ic(icon)}<span class="slt">${esc(label)}</span></span><b>${num(have)}<small> of ${num(of)}</small></b>
    <span class="sbar"><i style="width:${of ? have / of * 100 : 0}%"></i></span>${extra}</div>`;
}
function statsHtml(c, tabs = false){
  // the counts at the top: an even grid of tiles, each with its box's icon and colour, "3 of 151" and a bar (her point:
  // the old row of uneven tiles looked bad). Forms sit inside the Pokémon tile.
  const K = {Pokémon: "all", Female: "female", Male: "male", Shiny: "shiny", Lucky: "lucky", XXL: "xxl", XXS: "xxs", Dynamax: "dynamax", Gigantamax: "gmax", Mega: "mega", Shadow: "shadow", Purified: "purified", "4★": "hundo"};
  const T = {Female: "cf", Male: "cm", Shiny: "s", Lucky: "l", XXL: "xl", XXS: "xs", Dynamax: "dx", Gigantamax: "gx", Mega: "mega", Shadow: "sd", Purified: "pu", "4★": "h"};
  const t = (colour, icon, label, have, of, extra = "") => of && (!T[label] || boxOn(T[label])) ? statTile(colour, icon, label, have, of, extra, tabs ? K[label] : null) : "";   // only the game's own boxes
  return `<div class="stats">` +
    t("--caught", "poke-ball", "Pokémon", c.species, c.speciesAll) +
    t("--female", "venus", "Female", c.female, c.femaleOut) +
    t("--male", "mars", "Male", c.male, c.maleOut) +
    t("--shiny", "sparkles", "Shiny", c.shiny, c.shinyOut) +
    t("--lucky", "lucky", "Lucky", c.lucky, c.luckyOut) +
    t("--xxl", "expand", "XXL", c.xl, c.xlOut) +
    t("--xxs", "shrink", "XXS", c.xs, c.xsOut) +
    t("--dynamax", "dynamax", "Dynamax", c.dx, c.dynamaxOut) +
    t("--gmax", "gigantamax", "Gigantamax", c.gx, c.gmaxOut) +
    t("--mega", "mega", "Mega", c.mega, c.megaOut) +
    t("--shadow", "shadow", "Shadow", c.sd, c.shadowOut) +
    t("--purified", "purified", "Purified", c.pu, c.shadowOut) +
    t("--hundo", "star", "4★", c.hundo, c.out) + `</div>`;
}
const readOnlyNote = () => location.protocol === "file:" ? `<div class="notice">${ic("info")} Opened from the folder, so ticks can’t be saved here. Open it with the Jemma’s Pokédex shortcut.</div>`
  : loadFailed ? `<div class="notice">${ic("info")} The Pokédex server couldn’t read your ticks, so nothing can be saved for now. Open the Jemma’s Pokédex shortcut again; if it keeps happening, ask Claude.</div>` : "";   // 19 Nov review: no folder notice flashing on every load

// Home's Event Pokémon card (her point, 19 Nov: the two cards both opened the same page, so one card named like it):
// three she has, and Backgrounds, Costumes and Complete events counted as the page counts them (each Pokémon once)
function setTiles(){
  const seen = new Set(), items = [];
  for (const st of allSets()) for (const it of st.items) if (!seen.has(it.key)) { seen.add(it.key); items.push(it); }
  const row = (name, icon, have, of, col) => `<span class="rl" style="--c:${col}">${ic(icon)}${name}</span><span class="bar" style="--c:${col}"><i style="width:${of ? have / of * 100 : 0}%"></i></span><span class="v">${num(have)} / ${num(of)}</span>`;
  const sets = allSets(), bgI = items.filter(it => it.bg), csI = items.filter(it => !it.bg), pics = [], dexes = new Set();
  for (const it of items.filter(it => has(it.key, "c"))) { if (pics.length < 3 && !dexes.has(it.e.dex) && sprite(it.img)) { dexes.add(it.e.dex); pics.push(sprite(it.img)); } }
  return `<a class="gen" href="#sets"><span class="genart" aria-hidden="true">${pics.map(p => `<img src="${p}" alt="" loading="lazy">`).join("")}</span><span class="label">Your events</span><h3>Costumes and backgrounds</h3><div class="rows">` +
    row("Backgrounds", "image", bgI.filter(setGot).length, bgI.length, "var(--caught)") + row("Costumes", "shirt", csI.filter(setGot).length, csI.length, "var(--mega)") +
    row("Events", "ticket", sets.filter(st => st.items.every(setGot)).length, sets.length, "var(--deep-2)") + `</div></a>`;
}
function home(){
  const c = counts(ENTRIES);
  let gens = "";
  for (const [g, region, small] of GENS) {
    const list = ENTRIES.filter(e => e.gen === g), k = counts(list);
    const row = (name, icon, have, of, col) => `<span class="rl" style="--c:${col}">${ic(icon)}${name}</span><span class="bar" style="--c:${col}"><i style="width:${of ? have / of * 100 : 0}%"></i></span><span class="v">${num(have)} / ${num(of)}</span>`;
    // the region hub (her pick, 22 Nov evening: “a combination of region hub with stats”): its map, name, games, National Pokédex numbers, her counts
    gens += `<a class="gen" href="${R("gen-" + g)}" style="--rc:${REGION_COLOURS[g]}">${regionMapPlate(g)}${regionHead(g, region, small)}<div class="rows">` +
      row("Pokémon", "poke-ball", k.species, k.speciesAll, "var(--caught)") + row("Shiny", "sparkles", k.shiny, k.shinyOut, "var(--shiny)") +
      row("Lucky", "lucky", k.lucky, k.luckyOut, "var(--lucky)") + row("4★", "star", k.hundo, k.out, "var(--hundo)") + `</div></a>`;
  }
  const went = EVENTS.filter(e => COL.went.includes(e.id)).length;
  setRegion(null);
  view.innerHTML = `<header class="hero withshot">${heroPics(homeMaps())}<span class="label">Pokémon GO · ${num(c.speciesOut)} Pokémon out, plus their forms</span>
    <h1>Jemma’s <em>Pokédex</em></h1>${statsHtml(c)}</header>${readOnlyNote()}
    <section class="section"><h2>By region</h2><div class="gens">${gens}</div></section>
    <section class="section"><h2>Event Pokémon</h2><div class="gens">${setTiles()}</div></section>`;
}

function dexPage(title, label, list, region, search = false){
  const shown = list.filter(e => prefs.unreleased || e.released);
  const hide = prefs.workShow === "need" && !search;   // a search shows everything matching, even with "Hide ones I have" on (her answer, 21 Nov)
  let items = shown.filter(e => boxFilter(e, hide ? "need" : "all"));
  if (hide) {   // a Pokémon is got when any of its forms has it, as the totals count (15 Nov review: Scatterbug,
    // Rockruff, Sinistea and Paldean Tauros stayed on "Hide ones I have" with a different form caught); not the ones she tracks form by form
    const b = workBox();
    const got = new Set(shown.filter(e => !FORM_SPECIES.has(e.dex) && (b ? b.applies(e) && b.have(e) : caught(e))).map(groupKey));
    items = items.filter(e => FORM_SPECIES.has(e.dex) || !got.has(groupKey(e)));
  }
  // a form-by-form Pokémon keeps all its forms on the card, so the card still leads with its default form (19 Nov review:
  // with Unown F caught and "Hide ones I have" on, the card showed Unown A)
  const formKeys = new Set(items.filter(e => FORM_SPECIES.has(e.dex)).map(groupKey)), kept = new Set(items);
  items = shown.filter(e => FORM_SPECIES.has(e.dex) ? formKeys.has(groupKey(e)) : kept.has(e));
  const notOut = list.filter(e => !e.released).length;
  const groups = groupByNumber(items);
  const seg = (attrName, cur, rows) => `<span class="opts">${rows.map(([v, l]) => `<button type="button" ${attrName}="${v}" aria-pressed="${v === cur}">${l}</button>`).join("")}</span>`;
  const picked = !!workBox();   // a tab this game has (a GO-only one picked in GO is no tab in HOME)
  // one line: the tabs, Clear, and on the far right the "Hide ones I have" switch (was "Not caught"; no tab: not caught at all; a tab: missing that box), off until she clicks it
  // (picking a tab leaves it as it is: her ask, 22 Nov; her place, 9 Nov; hidden during a search); the not-out switch under it where there are some; how many are shown sits by the title (her layout, 9 Nov)
  setRegion(region);
  const shot = region ? regionShot(region) : {style: "", sw: heroPics(ALL_MAPS()), cls: " withshot"};
  const hero = `<header class="hero${shot.cls || ""}"${shot.style}>${shot.sw}<span class="label">${esc(label)} · ${num(groups.length)} shown</span><h1>${title}</h1>${statsHtml(counts(list), true)}</header>`;
  const mid = `${readOnlyNote()}
    <div class="toolbar filters" id="toolbar">
      <div class="frow"><div class="worktabs">` +
      (picked || hide ? `<button class="linkbtn" type="button" data-clear>${ic("x")}Clear</button>` : "") +
      `<span class="switches">` + (search ? "" : `<button class="switchbtn" type="button" role="switch" data-showall aria-checked="${hide}"><span class="track"></span>Hide ones I have</button>`) +
      (notOut ? `<button class="switchbtn" type="button" role="switch" data-notout="${prefs.unreleased ? "no" : "yes"}" aria-checked="${prefs.unreleased}"><span class="track"></span>Not in GO</button>` : "") +
      `</span></div></div></div>`;
  drawList(hero, mid, items.length ? groupCardList(groups) : null, groups.map(g => g.lead.id));
  const picked1 = view.querySelector(".hero .stattab[aria-pressed=true]");   // a narrow window: the chosen tab slid into view
  if (picked1) { const row = picked1.parentElement; if (row.scrollWidth > row.clientWidth) row.scrollLeft = picked1.offsetLeft - row.clientWidth / 2 + picked1.clientWidth / 2; }
}

// one Pokémon's page (#p-201), laid out like a Sim's page on her Sims site (her ask, 9 Nov): the picture and GO's own
// Pokédex entry with the facts beside it, big boxes to tick, the evolution family, every form, its costumes and
// backgrounds, and Previous / Next at the top. With forms, a row of small pictures picks which form the top part shows.
const REGION_OF = {1: "Kanto", 2: "Johto", 3: "Hoenn", 4: "Sinnoh", 5: "Unova", 6: "Kalos", 7: "Alola", 8: "Galar", 9: "Paldea"};
const pageForm = {};   // page (groupKey) -> the form picked on its page (until the page is reloaded)
// every page in order: each number, then its regional forms (Growlithe, Hisuian Growlithe, Arcanine…), for Previous / Next
const mkPageKeys = es => [...new Set([...es].sort((a, b) => a.dex - b.dex || isRegional(a) - isRegional(b)).map(groupKey))];
let PAGE_KEYS = mkPageKeys(ENTRIES);
const mkEvoIn = (es, ids) => { const o = {}; es.forEach(x => (x.evo || []).forEach(st => { if (ids[st.to]) (o[st.to] = o[st.to] || []).push(x); })); return o; };
let EVO_IN = mkEvoIn(ENTRIES, byId);     // entry id -> the entries that evolve into it
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
  const node = x => `<a class="evo-mon${x.id === sel.id ? " here" : ""}${x.released ? "" : " out-not"}" href="${pageOf(x)}" data-goform="${attr(x.id)}">` +
    (sprite(x.img) ? `<img src="${sprite(x.img)}" alt="" loading="lazy">` : `<span class="blank">?</span>`) +
    `<b>${esc(x.name)}</b>${x.form ? `<small>${esc(x.form)}</small>` : ""}${x.released ? "" : `<small>Not out yet</small>`}</a>`;
  const tree = (x, path) => {
    const byTo = new Map();   // two ways to the same Pokémon are shown together
    (x.evo || []).forEach(st => { if (byId[st.to] && !path.has(st.to)) byTo.set(st.to, [...(byTo.get(st.to) || []), st]); });
    // in HOME the arrows only: what an evolution takes is GO's (candy, items), not HOME's
    const kids = [...byTo].sort(([a], [b]) => entryIdx.get(byId[a]) - entryIdx.get(byId[b])).map(([to, sts]) => `<div class="evo-kid"><div class="evo-step">${ic("arrow-right")}<span>${GAME === "home" ? "" : sts.map(st => evoWays(st).map(esc).join("<br>")).join('<i class="or">or</i>')}</span></div>${tree(byId[to], new Set([...path, to]))}</div>`);
    return `<div class="evo-branch">${node(x)}${kids.length ? `<div class="evo-kids${kids.length > 3 ? " many" : ""}">${kids.join("")}</div>` : ""}</div>`;
  };
  return `<div class="evo">${roots.map(r => tree(r, new Set([r.id]))).join("")}</div>`;
}
// the Pokémon page's boxes are a strip of pictures, the Pokémon as it looks that way (her pick of three, 10 Nov);
// ?boxes=cards or ?boxes=now still shows the other two, for pictures only
const BOX_LOOK = ["strip", "cards", "now"].find(k => k === TRY.get("boxes")) || "strip";   // only these three (round 4 review)
const boxLook = () => BOX_LOOK;
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
  const bs = [
    B("c", "--caught", "poke-ball", "Caught", true),   // only the game's own boxes: filtered below
    B("cf", "--female", "venus", "Female", !!femaleTick(e)),   // a gender it can't be isn't shown (genderless, male only…)
    B("cm", "--male", "mars", "Male", !!maleTick(e)),
    B("s", "--shiny", "sparkles", "Shiny", !!e.shiny, "Unavailable"),
    B("l", "--lucky", "lucky", "Lucky", canLucky(e), UNTRADEABLE.has(e.dex) ? null : "Unavailable"),
    B("xl", "--xxl", "expand", "XXL", canXXL(e), neverXXL(e) ? null : "Unavailable"),
    B("xs", "--xxs", "shrink", "XXS", canXXS(e), neverXXS(e) ? null : "Unavailable"),
    B("dx", "--dynamax", "dynamax", "Dynamax", !!e.dynamax),
    B("gx", "--gmax", "gigantamax", "Gigantamax", !!e.gmax),
    ...(e.mega || []).map(m => B(m.t, "--mega", "mega", m.label, true)),
    B("sd", "--shadow", "shadow", "Shadow", !!e.shadow),
    B("pu", "--purified", "purified", "Purified", !!e.shadow),
    B("h", "--hundo", "star", "4★", e.released, "Unavailable")].filter((x, i, a) => x && boxOn(/data-tick="(\w+)"/.exec(x)[1]));
  // --half: under about 1300 wide the strip goes into two even rows (round 5 review: 14 in one row left 41 px boxes, the tick
  // circle over the picture and labels shrunk to 6.5px); site.css "the strip in two rows"
  return `<div class="bigboxes${boxLook() !== "now" ? " pcs pcs-" + boxLook() : ""}" data-id="${attr(e.id)}" style="--half:${Math.ceil(bs.length / 2)}">` + bs.join("") + `</div>`;
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
function pokemonPage(key){
  const every = ENTRIES.filter(e => groupKey(e) === key);
  if (!every.length) return GAME === "home" ? hmHome() : home();
  const n = every[0].dex, regionalPage = isRegional(every[0]);
  const all = every.filter(e => prefs.unreleased || e.released || every.every(x => !x.released));
  if (!all.length) return GAME === "home" ? hmHome() : home();
  const grouped = groupByNumber(all)[0], ordered = all;   // the data's order, the game's (Unown A to Z, F the one shown first: her note, 15 Nov)
  const sel = byId[pageForm[key]] && all.includes(byId[pageForm[key]]) ? byId[pageForm[key]] : grouped.lead;
  const goOnly = GAME === "go";   // costumes, backgrounds and Shiny Shadow are GO's alone
  const costumes = goOnly ? myCostumes().filter(c => groupKey(c) === key) : [];   // a costume on a regional form sits on that form's page (Galarian Zigzagoon's Meloetta Hat)
  const evs = !goOnly ? [] : myEvents().filter(ev => regionalPage ? bgMonsOf(ev).some(e => groupKey(e) === key)
    : (ev.backgroundPokemon || []).some(name => DATA.dexByName[name.toLowerCase()] === n) && (!bgMonsOf(ev).some(e => e.dex === n) || bgMonsOf(ev).some(e => groupKey(e) === key)));
  const gw = {both: "Female · Male", male: "Male", female: "Female", none: "Genderless"}[sel.gender];   // like Type (her call, 10 Nov)
  const kind = {legendary: "Legendary", mythical: "Mythical", "ultra-beast": "Ultra Beast"}[sel.class];
  const gen = genById[sel.gen] || ["", REGION_OF[sel.gen] || "", ""];
  const at = PAGE_KEYS.indexOf(key), prev = PAGE_KEYS[at - 1], next = PAGE_KEYS[at + 1];
  const step = (m, dir) => { if (!m) return `<span></span>`; const x = groupByNumber(ENTRIES.filter(e => groupKey(e) === m))[0].lead;
    return `<a class="pn ${dir}" href="${R("p-" + m)}" title="${dir === "prev" ? "Previous" : "Next"}: ${tip(x.name)}">${dir === "prev" ? ic("chevron-left") : ""}${sprite(x.img) ? `<img src="${sprite(x.img)}" alt="">` : ""}<span><small>#${pad(x.dex)}${isRegional(x) ? " " + esc(x.form.split(" ")[0]) : ""}</small>${esc(x.name)}</span>${dir === "next" ? ic("chevron-right") : ""}</a>`; };
  const yesNo = (on, yes, no) => on ? esc(yes) : `<span class="no">${esc(no)}</span>`;   // no ticks here: they looked like "caught" (her point, 10 Nov)
  const row = (t, v) => v ? `<div><dt>${esc(t)}</dt><dd>${v}</dd></div>` : "";
  const facts = GAME === "home" ? `<dl class="dfacts">` +   // Pokémon HOME: only what HOME has (her note, 22 Nov)
    row("Category", esc(sel.category || "")) + row("Type", esc(sel.types.join(" · "))) + row("Gender", esc(gw)) +
    row("Average height", sel.height ? esc(metres(sel.height)) : "") + row("Average weight", sel.weight ? esc(kilos(sel.weight)) : "") +
    row("Shiny", yesNo(!!sel.shiny, "Available", "Unavailable")) +
    row("Gigantamax", yesNo(!!sel.gmax, "Available", "Not possible")) + `</dl>` : `<dl class="dfacts">` +
    row("Category", esc(sel.category || "")) + row("Type", esc(sel.types.join(" · "))) + row("Gender", esc(gw)) +
    row("Average height", sel.height ? esc(metres(sel.height)) : "") + row("Average weight", sel.weight ? esc(kilos(sel.weight)) : "") +   // the species' Pokédex size; each one caught varies
    row("Buddy distance", sel.buddyKm ? esc(`${num(sel.buddyKm)} km`) : "") +
    row("In Pokémon GO", yesNo(sel.released, "Available", "Unavailable")) +
    row("Shiny", yesNo(!!sel.shiny, "Available", "Unavailable")) +
    row("Lucky", yesNo(canLucky(sel), "Available", UNTRADEABLE.has(sel.dex) ? "Not possible" : "Unavailable")) +
    row("Dynamax", yesNo(!!sel.dynamax, "Available", NO_DYNAMAX.has(sel.dex) ? "Not possible" : "Unavailable")) +
    row("Gigantamax", yesNo(!!sel.gmax, "Available", GMAX_SPECIES.has(sel.dex) && !isRegional(sel) ? "Unavailable" : "Not possible")) +
    row("Mega", yesNo(!!(sel.mega || []).length, "Available", sel.megaLater ? "Unavailable" : "Not possible")) +
    row("Shadow and Purified", yesNo(!!sel.shadow, "Available", "Unavailable")) + `</dl>`;   // the game's box order, as the strip below
  const desc = sel.desc ? (sel.femaleDesc ? `<p class="dex-entry"><span class="label">Female</span>${esc(sel.femaleDesc)}</p><p class="dex-entry"><span class="label">Male</span>${esc(sel.desc)}</p>`
      : `<p class="dex-entry">${esc(sel.desc)}</p>`) : `<p class="dex-entry muted">No Pokédex entry for it in the game’s text yet.</p>`;
  const descFrom = GAME === "home" && sel.desc ? `<span class="label dexfrom">From Pokémon GO’s Pokédex</span>` : "";   // HOME shows GO's own words, and says so
  const picker = ordered.length > 1 ? `<div class="formpick" role="group" aria-label="Which form to show">${ordered.map(e =>
    `<button type="button" data-pickform="${attr(e.id)}" aria-pressed="${e === sel}" title="${tip(e.form || e.name)}">${sprite(e.img) ? `<img src="${sprite(e.img)}" alt="" loading="lazy">` : `<span class="blank">?</span>`}<small>${esc(formLabel(e))}</small></button>`).join("")}</div>` : "";
  const family = evoFamily(sel);
  const bgCards = evs.flatMap(ev => { const ms = bgMonsOf(ev).filter(e => groupKey(e) === key); return (ms.length ? ms : [regionalPage ? grouped.lead : baseOf[n] || grouped.lead]).map(e => bgCard(ev, e, false)); }).join("");
  const first = esc(sel.name);
  showAllBoxes = true;
  const formCards = all.length > 1 ? all.map(e => card(e)).join("") : "";
  const costumeCards = costumes.map(costumeCard).join("");
  showAllBoxes = false;
  setRegion(sel.gen);
  const kin = ENTRIES.filter(x => x.family && x.family === sel.family && x !== sel);
  view.innerHTML = `<header class="hero mon withshot">${regionPics(sel.gen)}<div class="montop"><div class="crumbs"><a href="${R("dex")}">${ic("layout-grid")}Every Pokémon</a>` +
      (gen[0] ? `<a href="${R("gen-" + gen[0])}">${ic("layers")}${esc(gen[1])}</a>` : "") + `</div>
      <nav class="prevnext" aria-label="Previous and next Pokémon">${step(prev, "prev")}${step(next, "next")}</nav></div>
    <div class="monhead"><div><span class="label">#${pad(n)}${sel.category ? " · " + esc(sel.category) : ""}</span><h1>${esc(sel.name)}${sel.form ? ` <em>${esc(sel.form)}</em>` : ""}</h1>
      <div class="chips">${sel.types.map(t => `<span class="type">${esc(t)}</span>`).join("")}${{both: ["Female", "Male"], male: ["Male"], female: ["Female"], none: ["Genderless"]}[sel.gender].map(g => `<span class="type">${g}</span>`).join("")}${kind ? `<span class="type">${esc(kind)}</span>` : ""}${sel.released ? "" : `<span class="type">Unavailable in ${GAME === "home" ? "Pokémon HOME" : "GO"}</span>`}</div></div></div></header>${readOnlyNote()}
    <div class="mondetail"><div class="monpic" data-t1="${attr((sel.types || [])[0] || "")}">${pic(sel, dk(sel), true)}${picker}</div>
      <div>${descFrom}${desc}${facts}</div></div>
    <section class="section"><div class="boxhead"><h2>Your <em>boxes</em>${ordered.length > 1 ? ` <span class="muted">for ${esc(formLabel(sel))}</span>` : ""}</h2></div>${bigBoxes(sel)}</section>
    ${family ? `<section class="section"><h2>Evolution <em>family</em></h2>${family}</section>` : ""}
    ${goOnly && (sel.shadowShiny || has("d:" + sel.id, "ss")) ? `<section class="section"><h2>Shiny <em>Shadow</em></h2><p class="muted" style="margin:-6px 0 14px;font-size:13.5px">A bonus, not counted.</p>${shinyShadowCard(sel)}</section>` : ""}
    ${formCards ? `<section class="section"><h2>Every <em>form</em> <span class="muted">${all.filter(caught).length} of ${all.length} caught</span></h2><div class="grid">${formCards}</div></section>` : ""}
    ${costumeCards ? `<section class="section"><h2>Costumes</h2><p class="muted" style="margin:-6px 0 14px;font-size:13.5px">A costume’s Shiny is a bonus, not counted.</p><div class="grid">${costumeCards}</div></section>` : ""}
    ${evs.length ? `<section class="section"><h2>Event <em>backgrounds</em></h2><div class="grid">${bgCards}</div></section>` : ""}`;
}

const BGS = new Set(DATA.backgrounds || []);   // site/backgrounds/<event id>.webp: the game's location cards
const SPECIAL = DATA.special || [];   // special backgrounds: ticked “I took part”, like “I went” for the in-person ones (her call, 10 Nov)
const isSpecial = ev => ev.id.startsWith("sb-");
const bgKey = (ev, e) => `b:${ev.id}:${e.id}`;
function bgCard(ev, e, wentButton, showEvent = true){   // showEvent false on the event's own page (the name is in the banner)
  const went = COL.went.includes(ev.id), key = bgKey(ev, e);
  const src = bigSprite(shinyFirst() && sprite(e.img + ".s") ? e.img + ".s" : e.img);   // the normal colours; shiny only on the Shiny tab (her rule, 13 Nov; rule review 20 Nov)
  const bg = BGS.has(ev.id) ? `backgrounds/${ev.id}.webp` : null;
  return `<div class="card bgcard${went ? "" : " not-went"}${has(key, "s") ? " shiny" : ""}" data-bg="${attr(key)}" data-event="${attr(ev.id)}" data-bgdex="${e.dex}" data-bgmon="${attr(e.id)}">` +
    `<div class="bgpic${bg ? "" : " nobg"}"${bg ? ` style="background-image:url('${bg}')"` : ""}>${bg ? "" : `<span class="nobg-note">No picture in the game files yet</span>`}${src ? `<img src="${src}" alt="" loading="lazy">` : ""}</div>` +
    `<span class="no">#${pad(e.dex)}</span>` +
    `<a class="nm" href="${pageOf(e)}">${esc(e.name)}</a><small class="fm">${[e.costume ? cosName(e) : e.form, showEvent ? ev.background || ev.name : ""].filter(Boolean).map(esc).join(" · ")}</small>` +
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
    pic(c, key) + `<a class="nm" href="${pageOf(c)}" title="Open ${tip(c.name)}’s page">${esc(c.name)}</a><small class="fm">${esc(cosName(c))}</small>` +
    `<div class="boxgrid"><button class="tk c" type="button" data-tick="c" aria-pressed="${has(key, "c")}" title="Caught">${ic("poke-ball")}<span>Caught</span></button>` +
    (c.shiny || has(key, "s") ? `<button class="tk s" type="button" data-tick="s" aria-pressed="${has(key, "s")}" title="Shiny: a bonus, not counted">${ic("sparkles")}<span>Shiny</span></button>` : "") + `</div></div>`;   // a costume’s shiny is a bonus, like Shiny Shadow, and only where one is out (her calls, 10 Nov)
}
// only the events she went to (or took part in, for special backgrounds) exist in the app (her call, 10 Nov); the rest stay
// in data/ so one can be added back by ticking it there
const myEvents = () => [...EVENTS, ...SPECIAL].filter(ev => COL.went.includes(ev.id) && (ev.backgroundPokemon || []).length)
  .sort((a, b) => b.start.localeCompare(a.start));
// in its costume where the background came with one; a Pokémon whose male and female are two forms (Unfezant…) both, female
// first (18 Nov recheck: each background had shown just one, and not always the same one)
const bgMonsOf = ev => { const seen = new Set();
  return (ev.cards ? ev.cards.map(id => byId[id] || costumeById[id]) : (ev.backgroundPokemon || []).map(name => baseOf[DATA.dexByName[name.toLowerCase()]])).filter(Boolean)
    .flatMap(e => e.genderForm ? ENTRIES.filter(x => x.dex === e.dex && x.genderForm) : [e]).filter(e => !seen.has(e.id) && seen.add(e.id))
    .sort((a, b) => a.dex - b.dex || isRegional(a) - isRegional(b) || !!a.costume - !!b.costume || (a.order ?? 0) - (b.order ?? 0)); };   // by number, a regional form after the usual one, then costumes, each in the game's order (her rule; 20 Nov: Toxtricity Amped came before Low Key, and pages disagreed on the order of an event's Pokémon)



// ---------- Event Pokémon (was Events and costumes; renamed 19 Nov, her idea: all-inclusive for one page), one page (13 Nov, her ask: the two pages felt half done and mixed, as costumes and
// backgrounds often come from the same event) ----------
// A timeline of sets, newest first: each event she went to or took part in (its background Pokémon, plus the costumes
// she collects that came from it) and each group of her other costumes (by the game's costume code, named with Leek
// Duck's costume name). Every set is a tile with "5 of 12" and its Pokémon lit when got; a tile opens the set to tick.
function allSets(){
  const sets = [], linked = new Set();
  for (const ev of myEvents()) {
    const bgs = bgMonsOf(ev).map(e => ({key: bgKey(ev, e), e, img: e.img, bg: true}));
    const cos = (ev.cards || []).filter(id => costumeById[id] && COL.costumes.includes(id));
    cos.forEach(id => linked.add(id));
    const items = [...bgs, ...cos.map(id => ({key: "c:" + id, e: costumeById[id], img: costumeById[id].img, bg: false}))];
    sets.push({id: ev.id, ev, title: ev.name, when: ev.start, year: ev.start.slice(0, 4),
      meta: `${isSpecial(ev) ? "Special background" : `${ev.city}, ${ev.country}`} · ${dates(ev.start, ev.end)}`, art: BGS.has(ev.id) ? `backgrounds/${ev.id}.webp` : null, items, cos});
  }
  // costumes sit with the event they came from (13 Nov, her point: you only get costumes at events): the event Bulbapedia
  // gives for each costume (data/costume-events.json); one first seen at an in-person GO Fest sits with the GO Fest she
  // went to that year (the in-person ones share costumes), one from GO Fest Global with that year's Global background
  const CEV = DATA.costumeEvents || {};
  const debutOf = c => { const r = CEV[c.code] || CEV[c.code.replace(/_NOEVOLVE$/, "")]; return r && ((r.parts || {})[`${c.name} ${c.costume}`] || r); };
  const herSet = d => {
    const m = d && d.event && /GO Fest (20\d\d)\s*[—–-]\s*(.+)/.exec(d.event);
    if (!d || !d.event) return null;
    const wa = /GO Wild Area: /.test(d.event) && d.start && sets.find(o => o.title.includes(`GO Wild Area ${d.start.slice(0, 4)}`));   // an in-person Wild Area's costume came to that year's Global
    if (wa) return wa;
    const words = t => new Set((t.toLowerCase().match(/[a-z]{5,}/g) || []).filter(w => w !== "global"));
    if (!m) return sets.find(o => o.title === d.event || o.ev && d.start >= o.ev.start && d.start <= (o.ev.end || o.ev.start) && [...words(d.event)].some(w => words(o.title).has(w)));   // same event under another name (the 9th Anniversary coin Gimmighoul)
    return /Global/.test(m[2]) ? sets.find(o => isSpecial(o.ev) && [`GO Fest ${m[1]}`, `GO Fest ${m[1]} Global`].includes(o.title))
      : sets.find(o => !isSpecial(o.ev) && o.title.includes(`GO Fest ${m[1]}`));
  };
  for (const c of myCostumes()) {
    if (linked.has(c.id)) continue;
    const st = herSet(debutOf(c));
    if (!st) continue;
    st.items.push({key: "c:" + c.id, e: c, img: c.img, bg: false}); st.cos.push(c.id); linked.add(c.id);
  }
  // every other costume sits with the event it came from (13 Nov, her point: you only get costumes at events), named as
  // the sources name it (data/costume-events.json); a code not looked up yet groups by its game code, tidied
  const baseCode = code => code.replace(/_NOEVOLVE$/, "").replace(/^[A-Z]_(?=[A-Z]{3})/, "").replace(/^(.*?_20\d\d)_.*$/, "$1").replace(/_\d+(?=_20\d\d)/, "");
  const tidy = code => baseCode(code).split("_").map(w => w === "GOFEST" ? "GO Fest" : /^\d+$/.test(w) ? w : w[0] + w.slice(1).toLowerCase()).join(" ");
  const d0 = cs => { const d = debutOf(cs[0]); return d && !d.event && d.start ? d : null; };
  const groups = new Map();
  for (const c of myCostumes()) {
    if (linked.has(c.id)) continue;
    const d = debutOf(c) || CEV[baseCode(c.code)], ev = d && d.event ? d : null;
    const key = ev ? ev.event : d && d.start ? `${c.name} ${c.costume}` : baseCode(c.code);   // not from an event (a GO Battle League reward…): on its own
    if (!groups.has(key)) groups.set(key, {ev, cs: []});
    groups.get(key).cs.push(c);
  }
  for (const [key, {ev, cs}] of groups) {
    cs.sort((a, b) => cosIdx.get(a.id) - cosIdx.get(b.id));   // the game's order: by number, then oldest first (her rule, 20 Nov)
    const y = ev && ev.start ? ev.start.slice(0, 4) : d0(cs) ? d0(cs).start.slice(0, 4) : (/20\d\d/.exec(key) || [])[0] || (cs.map(c => c.shiny).filter(Boolean).sort()[0] || "").slice(0, 4);
    sets.push({id: "cos-" + key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), title: ev ? ev.event : d0(cs) ? key : tidy(key),
      when: ev && ev.start ? ev.start : d0(cs) ? d0(cs).start : y ? `${y}-00-00` : "0000", year: y || "Other",   // an event with no date yet (the Bangkok stamp rally, "To be announced"): by year
      meta: ev ? (ev.start ? `Costumes · ${dates(ev.start, ev.end || ev.start)}` : "Costumes · dates to be announced") : d0(cs) ? "Costume · not from an event" : "Costumes", art: null,
      mosaic: cs.slice(0, 4).map(c => sprite(c.img)).filter(Boolean), items: cs.map(c => ({key: "c:" + c.id, e: c, img: c.img, bg: false})), cos: cs.map(c => c.id)});
  }
  for (const st of sets) {   // costumes in the game's order everywhere (her rule, 20 Nov: GO Tour 2026 X had Serena's Hat before Calem's), after the background Pokémon
    const cs = st.items.filter(i => !i.bg).sort((a, b) => cosIdx.get(a.e.id) - cosIdx.get(b.e.id));
    st.items = [...st.items.filter(i => i.bg), ...cs]; st.cos = cs.map(i => i.e.id);
  }
  return sets.sort((a, b) => b.when.localeCompare(a.when));
}
const setGot = it => has(it.key, "c");   // got = Caught; a costume's Shiny is a bonus, not counted (her rule, 10 Nov; rule review 20 Nov)
function setTile(st){
  const got = st.items.filter(setGot).length, n = st.items.length;
  return `<a class="settile${got === n ? " done" : ""}${got ? "" : " none"}" href="#set-${attr(st.id)}">` +   // a collector's card (her ask, 21 Nov): grey frame until she has one from it, foil once complete
    (st.mosaic ? `<span class="setart mosaic">${st.mosaic.map(m => `<img src="${m}" alt="">`).join("")}</span>`
      : `<span class="setart${st.art ? "" : " noart"}"${st.art ? ` style="background-image:url('${st.art}')"` : ""}>${st.art ? "" : (sprite((st.items[0] || {}).img) ? `<img src="${sprite((st.items[0] || {}).img)}" alt="">` : "")}</span>`) +
    `<span class="setbody"><b>${esc(st.title)}</b><small>${esc(st.meta)}</small>` +
    `<span class="setprog"><i style="width:${n ? got / n * 100 : 0}%"></i></span><small class="setn">${num(got)} of ${num(n)}</small></span>` +
    `<span class="setstrip">${st.items.slice(0, 24).map(it => `<img class="${setGot(it) ? "on" : ""}" src="${sprite(it.img) || ""}" alt="" title="${tip(it.e.name + (it.e.costume ? " · " + cosName(it.e) : ""))}" loading="lazy">`).join("")}${n > 24 ? `<span class="more">+${n - 24}</span>` : ""}</span></a>`;
}
function setsPage(){
  const sets = allSets();
  const seen = new Set(), items = sets.flatMap(s => s.items).filter(i => !seen.has(i.key) && seen.add(i.key)), bg = items.filter(i => i.bg), cs = items.filter(i => !i.bg);
  let html = "", year = "";
  for (const st of sets) {
    if (st.year !== year) { html += `<h2 class="yearhead">${esc(st.year)}</h2>`; year = st.year; }
    html += setTile(st);
  }
  setRegion(null);
  view.innerHTML = `<header class="hero withshot">${heroPics(sets.filter(st => st.art).slice(0, 6).map(st => st.art))}<span class="label">Pokémon GO</span><h1>Event <em>Pokémon</em></h1>
    <div class="stats">${statTile("--deep-2", "ticket", "Events", sets.filter(s => s.items.every(setGot)).length, sets.length)}
    ${statTile("--caught", "image", "Backgrounds", bg.filter(setGot).length, bg.length)}${statTile("--mega", "shirt", "Costumes", cs.filter(setGot).length, cs.length)}</div></header>${readOnlyNote()}
    <div class="settiles">${html || `<p class="empty">Nothing yet.</p>`}</div>`;
}
function setPage(id){
  const st = allSets().find(s => s.id === id);
  if (!st) return setsPage();
  const got = st.items.filter(setGot).length;
  const bgs = st.ev ? bgMonsOf(st.ev) : [], cos = st.cos.map(cid => costumeById[cid]).filter(Boolean);
  setRegion(null);
  // a costume year's banner: some of its own costumes, as on its tile (13 Nov: other events' backgrounds there confused her)
  const yearMons = st.ev ? [] : [...new Map(st.items.map(i => [i.e.dex, i])).values()].slice(0, 4).map(i => bigSprite(i.img)).filter(Boolean);   // one per Pokémon
  view.innerHTML = `<header class="hero${st.art ? " setheroart" : yearMons.length ? " withshot" : ""}"${st.art ? ` style="--shot:url('${st.art}')"` : ""}>${yearMons.length ? heroPics(yearMons, "mons") : ""}<div class="crumbs"><a href="#sets">${ic("arrow-left")}Event Pokémon</a></div>
    <span class="label">${esc(st.meta)}</span><h1>${esc(st.title)}</h1>
    <div class="stats one">${statTile("--caught", "poke-ball", "Got", got, st.items.length)}</div></header>${readOnlyNote()}
    ${st.ev && st.ev.note ? `<p class="muted setnote">${esc(st.ev.note)}</p>` : ""}
    ${bgs.length ? `<section class="section"><h2>With the <em>background</em></h2><div class="grid bggrid">${bgs.map(e => bgCard(st.ev, e, false, false)).join("")}</div></section>` : ""}
    ${cos.length ? `<section class="section"><h2>${st.ev ? "Its <em>costumes</em>" : "The <em>costumes</em>"}</h2><div class="grid">${cos.map(costumeCard).join("")}</div></section>` : ""}`;
}


// which boxes a Pokémon can have ticked (Fast tick uses it; it came with the old Quick add page)
function canTick(e, t){
  if (!boxOn(t)) return false;   // only the game's own boxes
  return {c: true, cm: !!maleTick(e), cf: !!femaleTick(e), s: !!e.shiny, l: canLucky(e), h: e.released, xl: canXXL(e), xs: canXXS(e), sd: !!e.shadow, pu: !!e.shadow,
    dx: !!e.dynamax, gx: !!e.gmax, ss: !!e.shadowShiny, mg: (e.mega || []).some(m => m.t === "mg"), mx: (e.mega || []).some(m => m.t === "mx"),
    my: (e.mega || []).some(m => m.t === "my")}[t];
}

// ---------- Fast tick (TRIAL, 11 Nov overnight: her ask for a better way to put her whole collection in) ----------
// A whole region at once, laid out like the game's own Pokédex tabs (Pokémon, Shiny, Lucky, 100%, Shadow, Purified,
// G-Max, Mega): every Pokémon in number order, in colour when she has it and a silhouette when she hasn't. With the
// game's tab open on her phone, she clicks the ones that are in colour there, and the count at the top should end up
// the same as the game's. One click ticks the Pokémon's plain form (the game's Pokédex counts the species too).
const FAST = [["c", "Caught", "poke-ball"], ["cf", "Female", "venus"], ["cm", "Male", "mars"], ["s", "Shiny", "sparkles"], ["l", "Lucky", "lucky"],   // the game's Pokédex order (her ask, 12 Nov), with Female, Male and Dynamax fitted in
  ["xl", "XXL", "expand"], ["xs", "XXS", "shrink"], ["dx", "Dynamax", "dynamax"], ["gx", "Gigantamax", "gigantamax"], ["mega", "Mega", "mega"], ["sd", "Shadow", "shadow"], ["pu", "Purified", "purified"], ["h", "4★", "star"]];
const FAST_GAME = {c: "Pokémon", s: "Shiny", l: "Lucky", h: "100%", sd: "Shadow", pu: "Purified", gx: "G-Max", mega: "Mega", xl: "XXL", xs: "XXS"};   // the game's own tab names (its Gigantamax tab is "G-Max": Dittobase's Pokédex V2 guide, checked 14 Nov)
const FAST_COL = {c: "--caught", s: "--shiny", l: "--lucky", h: "--hundo", sd: "--shadow", pu: "--purified", dx: "--dynamax", gx: "--gmax", mega: "--mega", cm: "--male", cf: "--female", xl: "--xxl", xs: "--xxs"};
const fastTicks = (e, b) => b === "mega" ? (e.mega || []).map(m => m.t) : canTick(e, b) ? [b] : [];
function fastSpecies(g){   // the region's Pokémon in number order, each with its entries that are out; not-out ones too, as GO counts them.
  // Regional forms are Pokémon of their own (her call, 14 Nov): a square each in their own region (Hisuian Growlithe under Hisui), as on the region pages
  const keys = [...new Set(ENTRIES.filter(e => e.gen === g).sort((a, b) => a.dex - b.dex || isRegional(a) - isRegional(b)).map(groupKey))];
  return keys.map(k => { const all = ENTRIES.filter(e => groupKey(e) === k); return {dex: all[0].dex, key: k, all, es: all.filter(e => e.released)}; });
}
function fastPic(e, t){
  const gmax = `pm${e.dex}.fGIGANTAMAX`, mega = (e.mega || []).find(m => m.t === t);
  const k = mega ? mega.img : t === "s" ? e.img + ".s" : t === "cf" && e.femaleImg ? e.femaleImg : t === "gx" && SPRITES.has(gmax) ? gmax : e.img;
  return sprite(k) || sprite(e.img) || "";
}
function fastCell(e, t, on, n, other){
  return `<button class="fc" type="button" data-fast="${attr(e.id)}" data-t="${t}" aria-pressed="${on}"${other ? ` data-other="${attr(other)}"` : ""} title="${isRegional(e) ? esc(e.form.split(" ")[0]) + " " : ""}${esc(e.name)}${t === "mx" ? " Mega X" : t === "my" ? " Mega Y" : ""}">` +
    `<img src="${fastPic(e, t)}" alt="" loading="lazy"><span>${pad(n)}${t === "mx" ? " X" : t === "my" ? " Y" : ""}</span><span class="fcname" aria-hidden="true">${isRegional(e) ? esc(e.form.split(" ")[0]) + " " : ""}${esc(e.name)}</span></button>`;   // the name, shown on touch screens only (site.css)
}
// what to tick: the game's Pokédex region by region, or her costumes or background Pokémon, under their events (her ask, 14 Nov)
const FAST_KINDS = [["dex", "Pokédex"], ["cos", "Costumes"], ["bg", "Backgrounds"], ["forms", "Forms check"]];   // Forms check: TEMPORARY (her ask, 15 Nov), take it out when she has been through
const fastKinds = () => GAME === "home" ? FAST_KINDS.filter(([k]) => k === "dex" || k === "forms") : FAST_KINDS;   // costumes and backgrounds are GO's alone
const fastBoxes = () => FAST.filter(([t]) => boxOn(t));   // only the game's own boxes
const fastKindRow = kind => `<div class="frow"><span class="label flabel">Tick</span><div class="worktabs">${fastKinds().map(([k, l]) => `<button type="button" class="worktab" data-fastkind="${k}" aria-pressed="${k === kind}">${esc(l)}</button>`).join("")}</div></div>`;
function fastItemCell(it, b, art, evName){   // evName: in number order, a background Pokémon is named by its event
  const pic = (b === "s" && sprite(it.img + ".s")) || sprite(it.img) || "", what = it.e.costume ? cosName(it.e) : it.e.form || "";
  const card = it.bg && art ? ` style="--card:url('${art}')"` : "";
  const name = it.bg && evName ? (it.e.costume ? cosName(it.e) + " · " : "") + evName : it.bg || !it.e.costume ? gName(it.e) : cosName(it.e);
  return `<button class="fc col${card ? " withbg" : ""}" type="button" data-fk="${attr(it.key)}" data-t="${b}" aria-pressed="${has(it.key, b)}" title="${tip(it.e.name + (what ? " · " + what : "") + (evName ? " · " + evName : ""))}"${card}>` +
    `<img src="${pic}" alt="" loading="lazy"><span class="fcn">${esc(name)}</span></button>`;
}
function fastSetsPage(kind){
  const b = prefs.fastBox === "s" ? "s" : "c", [, label, icon] = FAST.find(x => x[0] === b), sets = allSets(), seen = new Set();
  const byNum = prefs.fastOrder !== "event";   // Pokédex order by default (her ask, 15 Nov: traded ones make event order hard to follow)
  let got = 0, all = 0, html = "";
  const picked = [];
  for (const st of sets) {   // newest first, each one once (a costume on two backgrounds' cards sits with the first)
    const items = st.items.filter(it => (kind === "bg") === it.bg && !seen.has(it.key) && (b === "c" || it.e.shiny || has(it.key, "s")));   // Shiny: only where one is out
    items.forEach(it => { seen.add(it.key); picked.push({it, st}); });
  }
  const groups = new Map();   // by event, or by Pokémon (a regional form on its own, as everywhere else), in number order
  for (const p of picked) {
    const k = byNum ? groupKey(p.it.e) : p.st.id;
    if (!groups.has(k)) groups.set(k, {title: byNum ? `#${pad(p.it.e.dex)} ${isRegional(p.it.e) ? p.it.e.form.split(" ")[0] + " " : ""}${p.it.e.name}` : p.st.title, dex: p.it.e.dex, reg: isRegional(p.it.e), ps: []});
    groups.get(k).ps.push(p);
  }
  const list = [...groups.values()];
  if (byNum) {   // and in each, the game files' order: its forms, then its costumes (her note, 15 Nov); a background's newest first
    list.sort((x, y) => x.dex - y.dex || x.reg - y.reg);
    const pos = it => (it.e.costume ? 1e4 : 0) + (it.e.order ?? 999);
    list.forEach(gr => gr.ps.sort((x, y) => pos(x.it) - pos(y.it)));
  }
  for (const gr of list) {
    const g = gr.ps.filter(p => has(p.it.key, b)).length; got += g; all += gr.ps.length;
    html += `<section class="fastset"><h3>${esc(gr.title)}<small>${num(g)} / ${num(gr.ps.length)}</small></h3><div class="fastgrid" style="--bc:var(${FAST_COL[b]})">${gr.ps.map(p => fastItemCell(p.it, b, p.st.art, byNum ? p.st.title : null)).join("")}</div></section>`;
  }
  const how = kind === "bg" ? "<b>locationbackground</b> or <b>specialbackground</b>" : "<b>costume</b>";
  setRegion(null);
  view.innerHTML = `<header class="hero withshot">${heroPics(sets.filter(st => st.art).slice(0, 6).map(st => st.art))}<h1>Fast <em>tick</em></h1>
    <p style="max-width:380px">Every ${kind === "bg" ? "background Pokémon from your events" : "costume you collect"}, ${byNum ? "in Pokédex number order" : "under its event"}. Search your Pokémon in the game for ${how}${b === "s" ? " with <b>&amp;shiny</b>" : ""}${byNum ? ", sort by number," : ""} and click each one you have.</p></header>${readOnlyNote()}
    <div class="toolbar filters">${fastKindRow(kind)}
    <div class="frow"><span class="label flabel">Order</span><div class="worktabs">${[["num", "Number"], ["event", "Event"]].map(([k, l]) => `<button type="button" class="worktab" data-fastorder="${k}" aria-pressed="${(k === "num") === byNum}">${l}</button>`).join("")}</div></div>
    <div class="frow"><span class="label flabel">Box</span><div class="worktabs">${FAST.filter(([t]) => t === "c" || t === "s").map(([t, l]) => `<button type="button" class="worktab" data-fastbox="${t}" aria-pressed="${t === b}">${esc(l)}</button>`).join("")}</div></div></div>
    <div class="fasthead" style="--bc:var(${FAST_COL[b]})">${ic(icon)}<b>${kind === "bg" ? "Backgrounds" : "Costumes"} · ${esc(label)}</b><span class="fastn">${num(got)} / ${num(all)}</span>
      ${got < all ? `<button class="linkbtn" type="button" data-fastall>${ic("check")}Tick all ${num(all - got)} left</button>` : ""}</div>
    ${html ? `<div class="fastsets">${html}</div>` : `<p class="empty">None yet.</p>`}`;
}
// TEMPORARY (her ask, 15 Nov: after regional forms and form-by-form tracking she wants to check every form's boxes):
// her form-by-form picks and every Pokémon with a regional form, each form its own square, under its number, one box at a time
function fastFormsPage(){
  const b = fastBoxes().some(x => x[0] === prefs.fastBox) ? prefs.fastBox : "c", [, label, icon] = FAST.find(x => x[0] === b);
  const out = ENTRIES.filter(e => e.released), byDex = new Map();
  for (const e of out) { if (!byDex.has(e.dex)) byDex.set(e.dex, []); byDex.get(e.dex).push(e); }
  let got = 0, all = 0, html = "";
  for (const [dex, es] of [...byDex].sort((x, y) => x[0] - y[0])) {
    if (es.length < 2 || !(FORM_SPECIES.has(dex) || es.some(isRegional))) continue;   // only her form-by-form picks and regional forms (not Scatterbug…)
    const ordered = [...es.filter(e => !isRegional(e)), ...es.filter(isRegional)];   // the data's order, the game's (Unown A to Z)
    const hasRegional = es.some(isRegional);
    const cells = ordered.flatMap(e => fastTicks(e, b).map(t => {
      const on = has(dk(e), t), name = (e.form || (hasRegional ? (genById[e.gen] || [])[1] : "") || e.name) + (t === "mx" ? " · X" : t === "my" ? " · Y" : "");
      all++; if (on) got++;
      return `<button class="fc col" type="button" data-fast="${attr(e.id)}" data-t="${t}" aria-pressed="${on}" title="${tip(e.name + " · " + name)}"><img src="${fastPic(e, t)}" alt="" loading="lazy"><span class="fcn">${esc(name)}</span></button>`;
    }));
    if (!cells.length) continue;
    const g = cells.filter(c => c.includes('aria-pressed="true"')).length;
    html += `<section class="fastset"><h3>#${pad(dex)} ${esc(es[0].name)}<small>${num(g)} / ${num(cells.length)}</small></h3><div class="fastgrid" style="--bc:var(${FAST_COL[b]})">${cells.join("")}</div></section>`;
  }
  setRegion(null);
  view.innerHTML = `<header class="hero withshot">${heroPics(ALL_MAPS())}<h1>Fast <em>tick</em></h1>
    <p style="max-width:380px">For now: the Pokémon you track form by form and the ones with regional forms, each form on its own, so you can check them all against the game. Pick a box, then click each form you have.</p></header>${readOnlyNote()}
    <div class="toolbar filters">${fastKindRow("forms")}
    <div class="frow"><span class="label flabel">Box</span><div class="worktabs">${fastBoxes().map(([t, l]) => `<button type="button" class="worktab" data-fastbox="${t}" aria-pressed="${t === b}">${esc(l)}</button>`).join("")}</div></div></div>
    <div class="fasthead" style="--bc:var(${FAST_COL[b]})">${ic(icon)}<b>Forms · ${esc(label)}</b><span class="fastn">${num(got)} / ${num(all)}</span></div>
    ${html ? `<div class="fastsets">${html}</div>` : `<p class="empty">None.</p>`}`;
}
function fastPage(){
  const kind = [TRY.get("fastkind"), prefs.fastKind].find(k => fastKinds().some(([x]) => x === k)) || "dex";   // ?fastkind= for pictures only
  if (kind === "forms") return fastFormsPage();
  if (kind !== "dex") return fastSetsPage(kind);
  const g = genById[prefs.fastGen] ? prefs.fastGen : "1", b = fastBoxes().some(x => x[0] === prefs.fastBox) ? prefs.fastBox : "c";
  const [, label, icon] = FAST.find(x => x[0] === b);
  // every tab lists the whole region, so every tab counts out of the same number, as in the game (her note, 12 Nov: Shiny
  // and Caught shouldn't have different totals); a Pokémon that can't have this box (yet) is an empty slot
  const rows = fastSpecies(g).filter(sp => POSSIBLE[b](sp.all));   // only what can never be is left out (her rule, 12 Nov)
  let got = 0;
  const all = rows.length;
  const cells = rows.map(sp => {
    const can = sp.es.filter(e => fastTicks(e, b).length);
    if (!can.length) return `<span class="fc none" title="${GAME === "home" ? `Not in Pokémon HOME as ${esc(label)}` : !sp.es.length ? "Not in Pokémon GO yet" : `Not in Pokémon GO as ${esc(label)} yet`}"><span>${pad(sp.dex)}</span></span>`;
    const lead = sp.es.find(e => !e.form) || sp.es.find(e => e.default) || sp.es[0];
    const main = can.includes(lead) ? lead : can[0];
    const ts = fastTicks(main, b);
    if (ts.length > 1) {   // Charizard and Mewtwo: one square (one Pokémon, as the game counts), with Mega X and Mega Y to tick inside it
      const on = ts.map(t => has(dk(main), t));
      if (on.some(Boolean)) got++;
      return `<span class="fc two${on.some(Boolean) ? " lit" : ""}"><img src="${fastPic(main, ts[0])}" alt="" loading="lazy"><span>${pad(sp.dex)}</span><span class="fcname" aria-hidden="true">${esc(main.name)}</span><span class="xy">` +
        ts.map((t, k) => `<button type="button" data-fast="${attr(main.id)}" data-t="${t}" aria-pressed="${on[k]}" title="${esc(main.name)} ${t === "mx" ? "Mega X" : "Mega Y"}">${t === "mx" ? "X" : "Y"}</button>`).join("") + `</span></span>`;
    }
    const t = ts[0];
    const elsewhere = can.find(e => e !== main && fastTicks(e, b).some(x => has(dk(e), x)));   // got on another form (Alolan Vulpix…)
    const mine = has(dk(main), t), on = mine || !!elsewhere;
    if (on) got++;
    return fastCell(main, t, on, sp.dex, !mine && elsewhere ? (elsewhere.form || elsewhere.name) : "");
  }).join("");
  setRegion(g);
  const how = GAME === "home" ? `A whole region at once. Open your boxes in Pokémon HOME and click every Pokémon you have there now${b === "c" ? "" : ` as ${esc(label)}`}. Regional forms have their own squares here, in their own region (Hisuian Growlithe under Hisui).`
    : `A whole region at once, laid out like the game’s Pokédex. Open the same tab on your phone (${b in FAST_GAME ? `the game calls it <b>${esc(FAST_GAME[b])}</b>` : "the game’s Pokédex has no tab for this one, so use the storage search instead"}) and click every Pokémon that’s in colour there. Regional forms have their own squares here, in their own region (Hisuian Growlithe under Hisui); the game puts them with the usual one.`;
  view.innerHTML = `<header class="hero withshot">${regionPics(g)}<h1>Fast <em>tick</em></h1>
    <p style="max-width:380px">${how}</p></header>${readOnlyNote()}
    <div class="toolbar filters">${fastKindRow("dex")}<div class="frow"><span class="label flabel">Region</span><div class="worktabs">${GENS.map(([id, n]) => `<button type="button" class="worktab" data-fastgen="${id}" aria-pressed="${id === g}">${esc(n)}</button>`).join("")}</div></div>
    <div class="frow"><span class="label flabel">Box</span><div class="worktabs">${fastBoxes().map(([t, l]) => `<button type="button" class="worktab" data-fastbox="${t}" aria-pressed="${t === b}">${esc(l)}</button>`).join("")}</div></div></div>
    <div class="fasthead" style="--bc:var(${FAST_COL[b]})">${ic(icon)}<b>${esc(genById[g][1])} · ${esc(label)}</b><span class="fastn">${num(got)} / ${num(all)}</span>
      ${got < all ? `<button class="linkbtn" type="button" data-fastall>${ic("check")}Tick all ${num(all - got)} left</button>` : ""}</div>
    <div class="fastgrid" style="--bc:var(${FAST_COL[b]})">${cells || `<p class="empty">None in this region.</p>`}</div>`;
}
// Caught that Fast tick ticked only because another box was ticked there (her note, 12 Nov: tick all the shinies, untick the
// ones she hasn't got, and those shouldn't stay Caught): unticking that box unticks Caught again, unless something else is ticked
const AUTO_KEYS = {go: "jemmas-pokedex-autocaught", home: "jemmas-pokedex-autocaught-home"};   // each game its own (the same ids are in both)
const AUTOS = {go: new Set(store.get(AUTO_KEYS.go, [])), home: new Set(store.get(AUTO_KEYS.home, []))};
let autoCaught = AUTOS.go;
const keepAuto = (g = GAME) => store.set(AUTO_KEYS[g], [...AUTOS[g]]);   // that game's, even if she has changed game meanwhile (overnight review, 23 Nov)
async function fastClick(btn){
  const t = btn.dataset.t, on = btn.getAttribute("aria-pressed") !== "true", key = btn.dataset.fk || dk(byId[btn.dataset.fast]);
  if (!on && btn.dataset.other) return toast(`Ticked on its ${curly(btn.dataset.other)} form: untick it on its page.`);
  await tick(key, t, on);   // tick() looks after a Caught that came with another box
}
async function fastAll(){
  if (viewOnly) return;
  const left = [...document.querySelectorAll('.fastgrid [data-fast][aria-pressed="false"], .fastgrid [data-fk][aria-pressed="false"]')];   // Mega X and Y count as one each here
  if (!left.length || !confirm(`Tick all ${left.length} left on this page? You can untick any afterwards.`)) return;
  // each one lights up as it's saved, with a running count, so it's clear it's working (12 Nov: she saw nothing happen
  // while 147 saved one by one); ten at a time
  let done = 0, failed = false;
  const game = GAME, col = COL, ids = byId, auto = autoCaught;   // the game shown when she clicked, even if she changes game meanwhile
  const one = async btn => {
    const key = btn.dataset.fk || dk(ids[btn.dataset.fast]), t = btn.dataset.t;
    for (const x of t === "c" ? ["c"] : [t, "c"]) {
      if ((col.have[key] || []).includes(x)) continue;
      setTick(key, x, true, col);
      if (!await save({game, list: "have", key, tick: x, on: true})) { setTick(key, x, false, col); failed = true; return; }
      if (x === "c" && t !== "c") auto.add(key);   // Caught only because of this box (see fastClick)
    }
    done++; btn.setAttribute("aria-pressed", "true");
    const n = GAME === game && document.querySelector(".fastn"); if (n) n.textContent = `Ticking… ${num(done)} of ${num(left.length)}`;   // not on the other game's page
  };
  for (let i = 0; i < left.length && !failed; i += 10) await Promise.all(left.slice(i, i + 10).map(one));
  keepAuto(game);
  toast(failed ? `Stopped after ${num(done)}: not saved.` : `Ticked ${num(done)}.`);
  rerender();   // the page she's on now, in case she moved on while it was saving
}

// ---------- Looking for (TRIAL, her ask 15 Nov: a page for what she's searching for) ----------
// shinies that are out and she needs, the same for Dynamax, Gigantamax and Mega, and luckies to try to trade for: every Pokémon
// whose box is out in GO and not ticked, by region. A Pokémon counts as got if any of its forms has it, except the ones she
// tracks form by form, where each form is its own; regional forms are their own (as everywhere)
const WANT = [["s", "Shiny", "sparkles", "--shiny"], ["l", "Lucky", "lucky", "--lucky"], ["dx", "Dynamax", "dynamax", "--dynamax"],
  ["gx", "Gigantamax", "gigantamax", "--gmax"], ["mega", "Mega", "mega", "--mega"]];
const mkIdx = es => new Map(es.map((e, i) => [e, i]));
let entryIdx = mkIdx(ENTRIES);   // the data's order, the game's
function wanted(b){
  const can = e => b === "s" ? !!e.shiny : b === "l" ? !UNTRADEABLE.has(e.dex) : b === "dx" ? !!e.dynamax : b === "gx" ? !!e.gmax : false;
  const units = [];
  for (const g of groupByNumber(ENTRIES.filter(e => e.released))) {
    const es = [g.lead, ...g.others].sort((x, y) => entryIdx.get(x) - entryIdx.get(y));   // the game's order (Unown A to Z, then ! and ?), not F first (her note, 20 Nov)
    if (b === "mega") { for (const e of es) for (const m of e.mega || []) if (!has(dk(e), m.t)) units.push({e, t: m.t, key: FORM_SPECIES.has(e.dex) ? e.id : groupKey(e), what: m.t === "mx" ? "Mega X" : m.t === "my" ? "Mega Y" : ""}); continue; }
    if (FORM_SPECIES.has(g.lead.dex)) { for (const e of es) if (can(e) && !has(dk(e), b)) units.push({e, t: b, key: e.id, what: formTag(e)}); continue; }
    const ok = es.filter(can);
    if (ok.length && !ok.some(e => has(dk(e), b))) units.push({e: ok.includes(g.lead) ? g.lead : ok[0], t: b, key: groupKey(g.lead), what: ""});
  }
  return units;
}
// her ask, 15 Nov: show where they overlap (a lucky and a shiny needed for the same one): each square has a small icon for
// every other box she also still needs for it, and "Only overlaps" lists just those
// Backgrounds (her ask, 15 Nov: to see which background Pokémon to target when an old background comes back, like Dark Skies
// for Dynamax Trails): from her events, each background's Pokémon she hasn't got with it (Caught), under that background's card
const WANT_TABS = [...WANT, ["bg", "Backgrounds", "ticket", "--deep-2"]];
// Pokédex number order for background Pokémon (her ask, 16 Nov): number, the usual form before a regional one, a plain one before its costumes, then the game's own order
const dexOrder = (a, b) => a.e.dex - b.e.dex || isRegional(a.e) - isRegional(b.e) || !!a.e.costume - !!b.e.costume || (a.e.order ?? 0) - (b.e.order ?? 0);
function bgWanted(){
  const seen = new Set(), units = [];
  for (const st of allSets()) {
    const here = [];
    for (const it of st.items) {
      if (!it.bg || seen.has(it.key)) continue;
      seen.add(it.key);
      if (!has(it.key, "c")) here.push({e: it.e, st, key: it.e.costume ? null : FORM_SPECIES.has(it.e.dex) ? it.e.id : groupKey(it.e), what: it.e.costume ? cosName(it.e) : FORM_SPECIES.has(it.e.dex) && it.e.form ? it.e.form : "", img: it.img});
    }
    units.push(...here.sort(dexOrder));   // each background's in Pokédex number order (her ask, 16 Nov)
  }
  return units;
}
function wantShown(b){
  const need = new Map();
  for (const [t] of WANT) for (const u of wanted(t)) { if (!need.has(u.key)) need.set(u.key, new Set()); need.get(u.key).add(t); }
  const also = u => u.key && need.has(u.key) ? WANT.filter(([t]) => t !== b && need.get(u.key).has(t)) : [];
  const units = (b === "bg" ? bgWanted() : wanted(b)).map(u => ({...u, also: also(u)}));
  return wantOverlap() ? units.filter(u => u.also.length) : units;
}
const wantOverlap = () => !!prefs.wantOverlap || TRY.has("overlap");   // ?overlap for pictures only
const wantBox = () => [TRY.get("want"), prefs.wantBox].find(k => WANT_TABS.some(w => w[0] === k)) || "s";   // ?want= for pictures only
const wantName = u => `${isRegional(u.e) ? u.e.form.split(" ")[0] + " " : ""}${curly(u.e.name)}${u.what ? " · " + u.what : ""}`;
function wantPage(){
  const b = wantBox(), [, label, icon, col] = WANT_TABS.find(w => w[0] === b);
  const units = wantShown(b);
  const cell = (u, art) => `<a class="fc col want${art ? " withbg" : ""}" href="${pageOf(u.e)}" title="${tip(wantName(u) + (u.st ? " · " + u.st.title : "") + (u.also.length ? " · also " + u.also.map(w => w[1]).join(", ") : ""))}"${art ? ` style="--card:url('${art}')"` : ""}>` +
    (u.also.length ? `<span class="wb">${u.also.map(([, , i, c]) => `<i style="--c:var(${c})">${ic(i)}</i>`).join("")}</span>` : "") +
    `<img src="${u.img ? sprite(u.img) : b === "s" ? sprite(u.e.img + ".s") || sprite(u.e.img) : fastPic(u.e, u.t)}" alt="" loading="lazy"><span>${pad(u.e.dex)}</span><span class="fcn">${esc(wantName(u))}</span></a>`;
  let html = "";
  const groups = b === "bg" ? [...new Set(units.map(u => u.st))].map(st => [st.title, units.filter(u => u.st === st), st.art])
    : GENS.map(([g, region]) => [region, units.filter(u => u.e.gen === g), null]);
  for (const [title, us, art] of groups) {
    if (!us.length) continue;
    html += `<section class="fastset"><h3>${esc(title)}<small>${num(us.length)}</small></h3><div class="fastgrid" style="--bc:var(${col})">${us.map(u => cell(u, art)).join("")}</div></section>`;
  }
  setRegion(null);
  view.innerHTML = `<header class="hero withshot">${heroPics(ALL_MAPS())}<span class="label">Trial</span><h1>Looking <em>for</em></h1>
    <p style="max-width:380px">${b === "bg" ? "The background Pokémon from your events that you haven’t got with that background yet, under each background: handy when one comes back." : "Everything that’s out in Pokémon GO that you haven’t got yet: shinies to hunt, luckies to try to trade for, and Dynamax, Gigantamax and Mega to look out for."} The small icons on a square are the other boxes you need for it too. Ticking one takes it off here.</p></header>${readOnlyNote()}
    <div class="toolbar filters"><div class="frow"><span class="label flabel">Box</span><div class="worktabs">${WANT_TABS.map(([t, l]) => `<button type="button" class="worktab" data-wantbox="${t}" aria-pressed="${t === b}">${esc(l)}</button>`).join("")}</div>
      <span class="switches"><button class="switchbtn" type="button" role="switch" data-wantoverlap aria-checked="${wantOverlap()}"><span class="track"></span>Only overlaps</button></span></div></div>
    <div class="fasthead" style="--bc:var(${col})">${ic(icon)}<b>${esc(label)} · still to get${wantOverlap() ? ", with another box too" : ""}</b><span class="fastn">${num(units.length)}</span>
      ${units.length ? `<button class="linkbtn" type="button" data-wantcopy>${ic("copy")}Copy the list</button>` : ""}</div>
    ${html ? `<div class="fastsets">${html}</div>` : `<p class="empty">${wantOverlap() ? "None that you need another box for too." : "Nothing left: you have every one that’s out."}</p>`}`;
}
async function wantCopy(){
  const b = wantBox(), label = WANT_TABS.find(w => w[0] === b)[1], units = wantShown(b);
  const one = u => `#${u.e.dex} ${isRegional(u.e) ? u.e.form.split(" ")[0] + " " : ""}${curly(u.e.name)}${u.what ? " (" + u.what + ")" : ""}`;
  const text = b === "bg" ? [...new Set(units.map(u => u.st))].map(st => `${st.title}: ` + units.filter(u => u.st === st).map(one).join(", ")).join("\n")
    : `${label} I’m looking for:\n` + GENS.map(([g, region]) => [region, units.filter(u => u.e.gen === g)]).filter(([, us]) => us.length).map(([region, us]) => `${region}: ` + us.map(one).join(", ")).join("\n");   // by region, as the page (order review, 20 Nov)
  try { await navigator.clipboard.writeText(text); toast("Copied: paste it into a message to a friend."); } catch (e) { toast("Couldn’t copy here."); }
}
// ---------- What’s on (was Coming up, then Events calendar; renamed 18 Nov, her point: it’s more what’s on, and “Events” clashed with Events and costumes) (TRIAL, her ask 16 Nov: upcoming events with details and what she needs to hunt) ----------
// the next six weeks from Leek Duck (tools/import_events.py, via ScrapedDuck): each event with its dates and a link, and
// the Pokémon it's known to have with what she still needs from each (new to her, shiny, Mega, Shadow, Dynamax,
// Gigantamax); one bringing back a background of hers lists that background's Pokémon she hasn't got with it
const NEED_LOOK = {c: ["New", "poke-ball", "--caught"], s: ["Shiny", "sparkles", "--shiny"], mega: ["Mega", "mega", "--mega"],
  sd: ["Shadow", "shadow", "--shadow"], dx: ["Dynamax", "dynamax", "--dynamax"], gx: ["Gigantamax", "gigantamax", "--gmax"], bg: ["Background", "ticket", "--deep-2"]};
const NEED_ORDER = ["c", "s", "dx", "gx", "mega", "sd"];   // the game's box order (her rule, 13 Nov)
function upNeeds(m){
  const e = byId[m.id];
  if (!e) return [];
  const group = FORM_SPECIES.has(e.dex) ? [e] : ENTRIES.filter(x => groupKey(x) === groupKey(e) && x.released);
  const any = t => group.some(x => has(dk(x), t));
  const out = [];
  if (!group.some(caught)) out.push("c");
  if ((m.shiny ?? !!e.shiny) && e.shiny && !any("s")) out.push("s");
  for (const a of m.as || []) {
    if (a === "mega" && (e.mega || []).some(x => !has(dk(e), x.t))) out.push("mega");
    if (a === "shadow" && !any("sd")) out.push("sd");
    if (a === "dynamax" && !any("dx")) out.push("dx");
    if (a === "gmax" && !any("gx")) out.push("gx");
  }
  return out;
}
// a background Pokémon on What’s on ticks there (her ask, 16 Nov: say she's got it with that background without leaving
// the page): click = Caught with the background, again = untick; got ones faded, as the rest of the page
function bgTick(it, art){
  const on = has(it.key, "c"), name = gName(it.e) + (it.e.costume ? " · " + cosName(it.e) : "");
  return `<button type="button" class="fc col want withbg${on ? " done" : ""}" data-fk="${attr(it.key)}" data-t="c" aria-pressed="${on}" title="${tip(name + (on ? " · got with this background: click to untick" : " · click when you’ve got it with this background"))}"${art ? ` style="--card:url('${art}')"` : ""}>` +
    (on ? "" : `<span class="wb"><i style="--c:var(--deep-2)">${ic("ticket")}</i></span>`) +
    `<img src="${sprite(it.img) || ""}" alt="" loading="lazy"><span>${pad(it.e.dex)}</span><span class="fcn">${esc(it.e.costume ? cosName(it.e) : gName(it.e))}</span></button>`;
}
function comingPage(){
  const now = new Date(), up = DATA.upcoming || {events: []}, day = s => (s || "").slice(0, 10);
  const square = (e, needs, extra = "", art = null) => `<a class="fc col want${needs.length ? "" : " done"}${art ? " withbg" : ""}" href="${pageOf(e)}" title="${tip(e.name + (e.form ? " · " + e.form : "") + (extra ? " · " + extra : "") + (needs.length ? " · you need: " + needs.map(n => NEED_LOOK[n][0]).join(", ") : " · you have everything from it"))}"${art ? ` style="--card:url('${art}')"` : ""}>` +
    (needs.length ? `<span class="wb">${needs.map(n => `<i style="--c:var(${NEED_LOOK[n][2]})">${ic(NEED_LOOK[n][1])}</i>`).join("")}</span>` : "") +
    `<img src="${sprite(e.img) || ""}" alt="" loading="lazy"><span>${pad(e.dex)}</span><span class="fcn">${esc(extra || (e.genderForm ? gName(e) : e.form && FORM_SPECIES.has(e.dex) ? e.name + " · " + e.form : e.name))}</span></a>`;
  // her point (18 Nov): a months-long event for an avatar item isn't a Community Day. So each event says its kind and how
  // long it runs; the ones running for weeks sit together at the bottom, one line each; the rest go by week, and an event
  // with nothing for her is one line too
  const DAY = 864e5, MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const midnight = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const longDate = d => `${WD[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const hm = d => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const today = midnight(now);
  const info = ev => {
    const a = new Date(ev.start), b = new Date(ev.end || ev.start);
    // her rule (19 Nov): an event that runs just past midnight (ends before 06:00) ends on the day before, on the calendar too
    const bd = b.getHours() < 6 && midnight(b) > midnight(a) ? new Date(midnight(b) - 1) : b;
    const isoDay = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const days = Math.round((midnight(bd) - midnight(a)) / DAY) + 1;
    const hours = Math.round((b - a) / 36e5), oneDay = days === 1;
    const len = oneDay ? (hours <= 1 ? "1 hour" : hours < 12 ? `${hours} hours` : "All day") : days >= 14 ? `${Math.round(days / 7)} weeks` : `${days} days`;
    const when = oneDay ? `${longDate(a)} · ${hm(a)}–${hm(b)}` : dates(isoDay(a), isoDay(bd));
    const on = a <= now, left = Math.round((midnight(bd) - today) / DAY), until = Math.round((midnight(a) - today) / DAY);
    const status = on ? (left <= 0 ? "On now · ends today" : left === 1 ? "On now · ends tomorrow" : `On now · ends in ${left} days`)
      : until === 0 ? "Today" : until === 1 ? "Tomorrow" : `In ${until} days`;
    return {a, b, bd, on, len, when, status, month: days >= 14 && days <= 35, season: days > 35};   // her point (18 Nov): a Shadow legendary's month of raids or a GO Pass (This month) isn't a season-long Timed Research (This season)
  };
  const kindChip = (ev, i) => `<span class="evkind">${esc(ev.type || "Event")}</span><span class="evlen">${esc(i.len)}</span>`;
  const evs = up.events.map(ev => {
    const i = info(ev), mons = ev.mons.filter(m => byId[m.id]);
    const ub = up.backgrounds[ev.id] || {}, bgId = ub.background, st = bgId && allSets().find(x => x.id === bgId);
    const only = ub.dex && ub.dex.length ? new Set(ub.dex) : null;   // only the ones that can get it at this event (19 Nov), not the whole background
    const seenBg = new Set(), bgAll = st ? st.items.filter(it => it.bg && (!only || only.has(it.e.dex)) && !seenBg.has(it.key) && seenBg.add(it.key)) : [];
    bgAll.sort(dexOrder);   // Pokédex number order (her ask, 16 Nov)
    const want = mons.filter(m => upNeeds(m).length).length, bgs = bgAll.filter(it => !has(it.key, "c"));
    return {ev, i, mons, st, bgAll, bgs, want, full: !!(want || bgs.length)};
  }).filter(x => x.i.b > now);   // gone once it has finished, not at midnight (19 Nov review: a Spotlight Hour stayed "On now" all evening)
  // the details of one event, opened under the week clicked in the calendar
  const row = x => {
    const {ev, i, mons, st, bgAll, bgs, want} = x, open = comingOpen.has(ev.id), got = bgAll.length - bgs.length;
    return `<div class="evrow${i.on ? " on" : ""}"><div class="evwhen"><span class="label">${esc(i.status)}</span>
        <h3>${esc(ev.name)}</h3><p class="evchips">${kindChip(ev, i)}</p><p class="muted">${esc(i.when)}</p>
        <a class="linkbtn" href="${attr(ev.link)}" target="_blank" rel="noopener">${ic("external-link")}Details on Leek Duck</a></div>
      <div class="evmons">${mons.length ? `<p class="evsum">${want ? `You need something from ${num(want)} of ${num(mons.length)}` : "You have everything from these"}</p><div class="fastgrid" style="--bc:var(--deep-2)">${mons.map(m => square(byId[m.id], upNeeds(m))).join("")}</div>` : ""}
        ${st ? `<p class="evsum">Brings back the <b>${esc(st.title)}</b> background: ${bgs.length ? `${num(bgs.length)} of ${num(bgAll.length)} still to get with it` : "you have them all"}</p>
          <div class="fastgrid" style="--bc:var(--deep-2)">${(open ? bgAll : bgs).map(it => bgTick(it, st.art)).join("")}</div>
          ${got ? `<button class="linkbtn" type="button" data-comegot="${attr(ev.id)}">${ic(open ? "eye-off" : "eye")}${open ? `Hide the ${num(got)} you have` : `Show the ${num(got)} you have too`}</button>` : ""}` : ""}</div></div>`;
  };
  const monday = d => { const m = midnight(d); m.setDate(m.getDate() - (m.getDay() + 6) % 7); return m; };
  // her pick (19 Nov): the Calendar, a month at a time. Kinds (her points, 19 Nov): who's in raids for days at a time (the
  // rotation) apart from one-day raid and battle events (Raid Day, Raid Hour, Max Battle Day, Max Monday); GO Pass apart from research
  const KINDS = [["cd", "Community Day", "--lucky"], ["rot", "Raid rotation", "--mega"], ["day", "Raid and battle days", "--dynamax"], ["spot", "Spotlight Hour", "--male"], ["ev", "Event", "--caught"], ["pass", "GO Pass", "--purified"], ["research", "Research", "--shadow"]];   // her pick E (20 Nov): Spotlight green, Event navy, GO Pass bright blue, Research plum
  const kindOf = ev => /community/i.test(ev.type) ? "cd" : /raid|max/i.test(ev.type) ? (new Date(ev.end || ev.start) - new Date(ev.start) >= 2 * DAY ? "rot" : "day") : /spotlight/i.test(ev.type) ? "spot" : /pass/i.test(ev.type) ? "pass" : /research/i.test(ev.type) ? "research" : "ev";
  const kcol = ev => `var(${KINDS.find(k => k[0] === kindOf(ev))[2]})`;
  const needSet = x => NEED_ORDER.filter(n => x.mons.some(m => upNeeds(m).includes(n)));   // the game's order
  const badge = x => (needSet(x).length || x.bgs.length) ? `<span class="nb">${needSet(x).map(n => `<i style="--c:var(${NEED_LOOK[n][2]})" title="${tip(NEED_LOOK[n][0])}">${ic(NEED_LOOK[n][1])}</i>`).join("")}${x.bgs.length ? `<i style="--c:var(--deep)" title="Background">${ic("ticket")}</i><b>${num(x.bgs.length)}</b>` : ""}</span>` : "";
  const hide = new Set(prefs.comingHide || []);   // her ask (19 Nov): each kind can be shown or hidden from the row of kinds
  const legend = `<div class="callegend">${KINDS.map(([k, l, c]) => `<button type="button" class="calkey${hide.has(k) ? " off" : ""}" data-comekind="${k}" aria-pressed="${!hide.has(k)}" title="${hide.has(k) ? "Show" : "Hide"} ${attr(l)}"><i style="--k:var(${c})">${ic("check")}</i>${esc(l)}</button>`).join("")}<span class="muted">Click one to show or hide it</span></div>`;
  const shortDay = d => `${WD[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
  const isRaidRun = x => kindOf(x.ev) === "rot";   // a boss in raids for days: a short bar of the tier, its pictures and names
  const isRun = x => ["pass", "research"].includes(kindOf(x.ev));
  const cs = comingSel && evs.find(x => x.ev.id === comingSel);   // nothing open until she clicks one (19 Nov)
  const detail = cs ? `<div class="caldetail"><button type="button" class="linkbtn cdclose" data-comeclose>${ic("x")}Close</button>${row(cs)}</div>` : "";
  const tierOf = x => (/ in (.+)$/.exec(x.ev.name) || [, "Raids"])[1];   // the source's own words: "5-star Raid Battles", "Mega Raids"
  const visible = evs.filter(x => !hide.has(kindOf(x.ev)));
  const names = x => { const n = [...new Set(x.mons.map(m => byId[m.id].name))]; return n.length > 1 ? n.slice(0, -1).join(", ") + " and " + n[n.length - 1] : n[0] || x.ev.name; };
  const pics = x => [...new Map(x.mons.map(m => [byId[m.id].img, byId[m.id]])).values()].map(e => `<img src="${sprite(e.img) || ""}" alt="" loading="lazy" title="${tip(gName(e) + (e.form ? " · " + e.form : ""))}">`).join("");
  const DSHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];   // a bar's days, shown on phones, where the bars run the full width (21 Nov)
  let g = `<div class="calweek calhead">${["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => `<span data-short="${d.slice(0, 3)}">${d}</span>`).join("")}</div>`;
  // a month at a time, with arrows (her point, 19 Nov: six weeks with no month named, and no way to move on)
  const m0 = new Date(today.getFullYear(), today.getMonth() + comingMonth, 1), mEnd = new Date(m0.getFullYear(), m0.getMonth() + 1, 0), mNext = new Date(m0.getFullYear(), m0.getMonth() + 1, 1);
  const lastEv = visible.reduce((m, x) => x.i.b > m ? x.i.b : m, today), maxMonth = (lastEv.getFullYear() - today.getFullYear()) * 12 + lastEv.getMonth() - today.getMonth();
  const nWeeks = Math.round((monday(mEnd) - monday(m0)) / (7 * DAY)) + 1;
  for (let w = 0; w < nWeeks; w++) {
    const ws = monday(m0); ws.setDate(ws.getDate() + 7 * w);
    const we = new Date(ws); we.setDate(we.getDate() + 6);
    const inW = visible.filter(x => midnight(x.i.a) <= we && midnight(x.i.bd) >= ws)
      .sort((p, q) => isRun(q) - isRun(p) || isRaidRun(q) - isRaidRun(p) || (q.i.b - q.i.a) - (p.i.b - p.i.a) || p.i.a - q.i.a);   // GO Pass, then the raids, at the top
    const lanes = [];
    const bars = inW.map(x => {
      const c0 = Math.max(0, Math.round((midnight(x.i.a) - ws) / DAY)), c1 = Math.min(6, Math.round((midnight(x.i.bd) - ws) / DAY));
      let l = lanes.findIndex(o => o.every((v, i) => i < c0 || i > c1 || !v));
      if (l < 0) { l = lanes.length; lanes.push(Array(7).fill(false)); }
      for (let i = c0; i <= c1; i++) lanes[l][i] = true;
      const one = /hour/.test(x.i.len);   // a few hours on one day: its start time
      const mini = isRaidRun(x);
      return `<button type="button" class="calbar${mini ? " mini" : ""}${x.full ? " need" : ""}${x === cs && comingWeek === String(w) ? " sel" : ""}" data-comesel="${attr(x.ev.id)}" data-comeweek="${w}" style="--c0:${c0 + 1};--c1:${c1 + 2};--r:${l + 2};--k:${kcol(x.ev)}" title="${tip(x.ev.name + " · " + x.i.when)}"><small class="cdays">${DSHORT[c0]}${c1 > c0 ? "–" + DSHORT[c1] : ""}</small>${one ? `<small>${hm(x.i.a)}</small>` : ""}${mini ? `<small>${esc(tierOf(x).replace(/ Raid Battles| Raids/, ""))}</small><span class="mp">${pics(x)}</span><span class="t">${esc(names(x))}</span>` : `<span class="t">${esc(x.ev.name)}</span>`}${badge(x)}</button>`;
    }).join("");
    const days = [...Array(7)].map((_, i) => { const d = new Date(ws); d.setDate(d.getDate() + i);
      return `<span class="calday${+d === +today ? " today" : d < today ? " past" : ""}${d.getMonth() !== m0.getMonth() ? " out" : ""}" style="--c0:${i + 1}">${d.getDate() === 1 ? `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}` : d.getDate()}</span>`; }).join("");
    g += `<div class="calweek">${days}${bars}</div>${comingWeek === String(w) ? detail : ""}`;   // the details open under the week clicked
  }
  const calNav = `<div class="calnav"><button type="button" class="iconbtn" data-comemonth="-1" ${comingMonth <= 0 ? "disabled" : ""} title="Month before">${ic("chevron-left")}</button><h2>${MONTHS[m0.getMonth()]} <em>${m0.getFullYear()}</em></h2><button type="button" class="iconbtn" data-comemonth="1" ${comingMonth >= maxMonth ? "disabled" : ""} title="Next month">${ic("chevron-right")}</button>${comingMonth ? `<button type="button" class="linkbtn" data-comemonth="0">Back to this month</button>` : ""}<span class="muted">Leek Duck lists about six weeks ahead</span></div>`;
  let html = `${legend}${calNav}<div class="cal">${g}</div>`;
  // You need (her ask, 19 Nov), for the month shown: by box, each with its event and when; then the backgrounds coming back
  const inMonth = x => x.i.a < mNext && x.i.bd >= m0;
  const items = [];
  const seenNeed = new Set();   // each Pokémon and box once, at its first event, and only from the kinds shown (19 Nov review: Deoxys twice)
  for (const x of visible.filter(inMonth)) for (const m of x.mons) for (const n of upNeeds(m)) if (!seenNeed.has(m.id + "|" + n) && seenNeed.add(m.id + "|" + n)) items.push({x, m, n});
  const whenShort = x => x.i.on ? (x.i.month || x.i.season ? `until ${shortDay(x.i.bd)}` : x.i.status.replace("On now · ", "")) : x.i.len.includes("hour") || x.i.len === "All day" ? `${shortDay(x.i.a)} ${hm(x.i.a)}` : `from ${shortDay(x.i.a)}`;
  const groups = NEED_ORDER.map(n => [n, items.filter(it => it.n === n)]).filter(([, its]) => its.length);
  const huntCell = it => `<a class="hunt" href="${pageOf(byId[it.m.id])}"><img src="${sprite(byId[it.m.id].img) || ""}" alt="" loading="lazy"><span class="hn">${esc(gName(byId[it.m.id]))}</span>
    <span class="hev">${esc(it.x.ev.name)}</span><span class="hw${it.x.i.on ? " on" : ""}">${esc(whenShort(it.x))}</span></a>`;
  let h = groups.map(([n, its]) => `<section class="huntset"><h3 style="--c:var(${NEED_LOOK[n][2]})"><i>${ic(NEED_LOOK[n][1])}</i>${esc(n === "c" ? "New to you" : NEED_LOOK[n][0])}<small>${num(its.length)}</small></h3><div class="huntgrid">${its.map(huntCell).join("")}</div></section>`).join("");
  const bgEvs = visible.filter(x => inMonth(x) && x.st && x.bgs.length);
  if (bgEvs.length) h += `<section class="huntset"><h3 style="--c:var(--deep)"><i>${ic("ticket")}</i>Backgrounds coming back<small>${num(bgEvs.length)}</small></h3>${bgEvs.map(x => {
    const open = comingOpen.has(x.ev.id), got = x.bgAll.length - x.bgs.length;
    return `<div class="huntbg"><span class="hbart"${x.st.art ? ` style="background-image:url('${x.st.art}')"` : ""}></span><div><b>${esc(x.st.title)}</b><span class="muted"> · ${esc(x.ev.name)}, ${esc(whenShort(x))}</span>
      <div class="hbbar"><i style="width:${(100 * got / x.bgAll.length).toFixed(1)}%"></i></div><span class="muted">${num(got)} of ${num(x.bgAll.length)} got with it · ${num(x.bgs.length)} to go</span>
      <button class="linkbtn" type="button" data-comegot="${attr(x.ev.id)}">${ic(open ? "eye-off" : "eye")}${open ? "Hide them" : `Show the ${num(x.bgs.length)} to get`}</button>
      ${open ? `<div class="fastgrid" style="--bc:var(--deep-2)">${x.bgs.map(it => bgTick(it, x.st.art)).join("")}</div>` : ""}</div></div>`; }).join("")}</section>`;
  html += `<section class="calneed"><h2>You <em>need</em> in ${MONTHS[m0.getMonth()]}</h2>${h ? `<div class="calneedgrid">${h}</div>` : `<p class="muted">Nothing new for you in what’s listed for ${MONTHS[m0.getMonth()]}.</p>`}</section>`;
  setRegion(null);
  view.innerHTML = `<header class="hero withshot">${heroPics(ALL_MAPS())}<span class="label">Trial</span><h1>What’s <em>on</em></h1>
    <p style="max-width:380px">What’s on in Pokémon GO month by month (from Leek Duck), and what you still need from each: the small icons say what. Checked ${dates(up.fetched || DATA.updated)}.</p></header>${readOnlyNote()}
    ${evs.length ? `<div class="evlist">${html}</div>` : `<p class="empty">No events saved yet: run tools/import_events.py.</p>`}`;
}
const comingOpen = new Set();   // What's on: backgrounds showing the ones she has too
let comingSel = null, comingWeek = null, comingMonth = 0;   // What's on: the event opened, the week it was clicked in, months on from this one

function navHtml(route){
  const link = (href, icon, text, n) => `<a href="${href}" class="${route === href.slice(1) ? "on" : ""}"${route === href.slice(1) ? ' aria-current="page"' : ""}>${ic(icon)}${esc(text)}${n !== undefined ? `<span class="n">${num(n)}</span>` : ""}</a>`;
  const regions = `<div class="nav-group"><span class="label">Regions</span>${GENS.map(([g, n]) => link(R("gen-" + g), "layers", n, groupByNumber(ENTRIES.filter(e => e.gen === g)).length)).join("")}</div>`;
  const more = GAME === "home" ? `<div class="nav-group"><span class="label">More</span>${link("#hm-fast", "layout-grid", "Fast tick")}</div>`   // HOME: Fast tick too (her yes, 22 Nov); events, Looking for and What’s on are GO's
    : `<div class="nav-group"><span class="label">More</span>${link("#sets", "ticket", "Event Pokémon", allSets().length)}${link("#want", "search", "Looking for")}${link("#coming", "calendar", "What’s on")}${link("#fast", "layout-grid", "Fast tick")}</div>`;
  nav.innerHTML = gameNavHtml(route, link, regions, more);   // the game shown: HOME (the default) or GO (games, below)
}

// ---------- games: Pokémon HOME and Pokémon GO (her decisions, 22 Nov) ----------
// The Pokédex covers Pokémon GO and Pokémon HOME; HOME’s main box means “you have it in HOME now” (a living dex). HOME is the
// default game: the Pokédex opens on HOME (#home). A small two-option switch under “Jemma’s Pokédex” in the sidebar changes game
// (her pick from the Try switch, 22 Nov: “Sidebar switch”), and the sidebar shows only that game’s pages, otherwise as it was. GO’s
// pages and addresses are unchanged, except its Home is #go. HOME (built 22 Nov, her ask: “Home needs to be fully built… Used
// shared stuff between games”) is the same pages as GO, drawn from HOME's own list (data/home/dex.json: GO's entry wherever HOME
// keeps the same Pokémon or form, HOME's own for the rest) and her HOME ticks (collection/home.json), at #hm-… addresses (#hm-dex,
// #hm-gen-1, #hm-p-25, #hm-fast), with only what HOME has (her notes, 22 Nov): Caught, Female, Male, Shiny, Gigantamax. Above the switch, a small “All games” link
// (her pick, 22 Nov evening) opens #games: each game’s totals side by side, never a list of Pokémon (her note: “every mon is
// game specific”). Each game’s Home is the totals at the top and a region hub below (her pick, 22 Nov evening: “a combination of
// region hub with stats”): a card per region with its map, name, National Pokédex numbers and her counts.
// both games the binder red, HOME as GO (her pick, 23 Nov: “Same red as GO”; teal #2E6A72 had been my suggestion): only the switch says which game
const GAME_COLOUR = "#7E2530", HOME_COLOUR = GAME_COLOUR;
const GAMES = [
  {id: "home", name: "Pokémon HOME", short: "HOME", colour: HOME_COLOUR, href: "#home"},
  {id: "go", name: "Pokémon GO", short: "GO", colour: "#7E2530", href: "#go"},
];
const isHmRoute = r => r === "home" || r.startsWith("hm-");
const gameOf = r => isHmRoute(r) ? "home" : "go";
let wasHm = false;
const brandSmall = document.querySelector(".brand small");
const gameSwitch = document.createElement("div"); gameSwitch.className = "games";
document.querySelector(".brand").after(gameSwitch);
// the Try switches are gone (her picks, 22 Nov evening): their kept choices cleared once
try { for (const k of ["jemmas-pokedex-try-homepage", "jemmas-pokedex-try-allgames", "jemmas-pokedex-try-gameswitch", "jemmas-pokedex-try-lastgame"]) localStorage.removeItem(k); } catch {}
function gameNavHtml(route, link, regions, more){
  if (wasHm && !isHmRoute(route)) setRegion(null);   // back from HOME
  wasHm = isHmRoute(route);
  const game = gameOf(route), all = route === "games";
  brandSmall.textContent = GAMES.find(g => g.id === game).name; brandSmall.hidden = true;   // the switch shows the game
  gameSwitch.innerHTML = `<a class="allgames${all ? " on" : ""}" href="#games"${all ? ' aria-current="page"' : ""}>${ic("layers")}All games</a>` +
    `<div class="game-switch" role="group" aria-label="Game">${GAMES.map(g => `<a href="${g.href}" style="--gc:${g.colour}"${g.id === game && !all ? ' aria-current="true"' : ""}>${esc(g.short)}</a>`).join("")}</div>`;
  if (game === "home") return `<div class="nav-group">${link("#home", "house", "Home")}${link("#hm-dex", "layout-grid", "Every Pokémon", groupByNumber(ENTRIES).length)}</div>${regions}${more}`;
  return `<div class="nav-group">${link("#go", "house", "Home")}${link("#dex", "layout-grid", "Every Pokémon", groupByNumber(ENTRIES).length)}</div>${regions}${more}`;
}
// the National Pokédex’s numbers for each region (the games’ own; Meltan and Melmetal in Alola, her call)
const DEX_RANGE = {"1": [1, 151], "2": [152, 251], "3": [252, 386], "4": [387, 493], "5": [494, 649], "6": [650, 721], "7": [722, 809], "8": [810, 898], "hisui": [899, 905], "9": [906, 1025]};
const dexNo = n => "#" + String(n).padStart(4, "0");
const PH = `<span class="stamp">Placeholder</span>`;
const regionMapPlate = g => REGION_CHOSEN[g] ? `<span class="genmap" aria-hidden="true" style="--pic:url('regions/home/${REGION_CHOSEN[g].replace(/\.\w+$/, "")}.webp')"></span>` : "";
const statRow = (name, icon, have, of, col) => `<span class="rl" style="--c:${col}">${ic(icon)}${name}</span><span class="bar" style="--c:${col}">${of ? `<i style="width:${have / of * 100}%"></i>` : ""}</span><span class="v">${of ? `${num(have)} / ${num(of)}` : PH}</span>`;
const regionHead = (g, region, small) => `<span class="label">${esc(small)}</span><h3>${esc(region)}</h3><span class="genno">${dexNo(DEX_RANGE[g][0])}–${dexNo(DEX_RANGE[g][1])}</span>`;

// each game's own list, made once: GO's from DATA.entries; HOME's from data/home/dex.json, where an entry with `go` is GO's entry
// for that Pokémon or form (its name, picture, types, Pokédex text and evolutions shared, her ask: “Used shared stuff between
// games”) with HOME's own shiny and Gigantamax, and the rest are HOME's own (the forms GO hasn't got)
const WORLDS = {go: {ENTRIES, byId, baseOf, outBySpecies, BY_GROUP, PAGE_KEYS, EVO_IN, entryIdx}};
function indexWorld(es){ fixGen(es); const ids = mkById(es); return {ENTRIES: es, byId: ids, baseOf: mkBaseOf(es), outBySpecies: mkOut(es), BY_GROUP: mkGroups(es), PAGE_KEYS: mkPageKeys(es), EVO_IN: mkEvoIn(es, ids), entryIdx: mkIdx(es)}; }
const NOT_IN_HOME = {released: true, shiny: false, gmax: false, shadow: false, shadowShiny: false, dynamax: false, mega: undefined, megaLater: false, buddyKm: undefined};   // GO's own boxes and facts
function homeEntries(){
  const go = WORLDS.go.byId;
  return HOME_DATA.entries.map(h => { const e = {...(h.go ? go[h.go === true ? h.id : h.go] : null), ...NOT_IN_HOME, ...h}; delete e.go; return e; });
}
function useGame(g){   // draw the pages from this game's list and ticks
  if (g === GAME) return;
  if (!WORLDS[g]) WORLDS[g] = indexWorld(homeEntries());
  ({ENTRIES, byId, baseOf, outBySpecies, BY_GROUP, PAGE_KEYS, EVO_IN, entryIdx} = WORLDS[g]);
  GAME = g; COL = COLS[g]; autoCaught = AUTOS[g];
  cardMemo.clear(); lastList = null;
}
const countsIn = g => { const was = GAME; useGame(g); const c = counts(ENTRIES); useGame(was); return c; };
function hmHome(){   // Pokémon HOME's Home: its totals and the region hub, as GO's Home (her pick, 22 Nov evening), only what HOME has
  const c = counts(ENTRIES);
  let gens = "";
  for (const [g, region, small] of GENS) {
    const k = counts(ENTRIES.filter(e => e.gen === g));
    gens += `<a class="gen" href="${R("gen-" + g)}" style="--rc:${REGION_COLOURS[g]}">${regionMapPlate(g)}${regionHead(g, region, small)}<div class="rows">` +
      statRow("Pokémon", "poke-ball", k.species, k.speciesAll, "var(--caught)") + statRow("Shiny", "sparkles", k.shiny, k.shinyOut, "var(--shiny)") + `</div></a>`;
  }
  setRegion(null);
  view.innerHTML = `<header class="hero withshot">${heroPics(homeMaps())}<span class="label">Pokémon HOME · ${num(c.speciesOut)} Pokémon, plus their forms</span>
    <h1>Jemma’s <em>Pokédex</em></h1>${statsHtml(c)}</header>${readOnlyNote()}
    <section class="section"><h2>By region</h2><div class="gens">${gens}</div></section>`;
}
function allGamesPage(){   // All games: each game's totals side by side, no Pokémon (HOME: only what HOME has)
  setRegion(null);
  const c = countsIn("go"), h = countsIn("home");
  view.innerHTML = `<header class="hero withshot">${heroPics(homeMaps())}<span class="label">All games</span><h1>Jemma’s <em>Pokédex</em></h1></header>${readOnlyNote()}
    <section class="section"><div class="allg">` + GAMES.map(g => `<article class="allgame" style="--gc:${g.colour}"><h2>${esc(g.name)}</h2><div class="rows">${g.id === "go"
      ? statRow("Pokémon", "poke-ball", c.species, c.speciesAll, "var(--caught)") + statRow("Shiny", "sparkles", c.shiny, c.shinyOut, "var(--shiny)") + statRow("Lucky", "lucky", c.lucky, c.luckyOut, "var(--lucky)") + statRow("4★", "star", c.hundo, c.out, "var(--hundo)")
      : statRow("Pokémon", "poke-ball", h.species, h.speciesAll, "var(--caught)") + statRow("Shiny", "sparkles", h.shiny, h.shinyOut, "var(--shiny)")}</div><a class="allopen" href="${g.href}">Open ${esc(g.name)}</a></article>`).join("") + `</div></section>`;
}

// view only (no save server): every box that would save is marked aria-disabled, so the keyboard and screen readers know
// pressing it does nothing (round 4 review, 22 Nov); it still shows ticked or not by aria-pressed
const SAVE_BOXES = "button[data-tick],button[data-fast],button[data-fk],button[data-went],button[data-fastall]";
function lockBoxes(){ if (viewOnly) view.querySelectorAll(SAVE_BOXES).forEach(b => b.setAttribute("aria-disabled", "true")); }
function route(to){ const out = drawRoute(to); lockBoxes(); return out; }
// GO's addresses; anything else is Pokémon HOME's (#home, #hm-…), the default game, and an unknown address goes to HOME's Home
const GO_ROUTE = /^(go|dex|fast|want|coming|sets|games|costumes|events|hm|set-.+|gen-\w+|p-\d+(-[a-z]+)?)$/;
function drawRoute(to){   // to: draw that page without changing the address (the tests' sweep over every page)
  const full = to || (location.hash || "#home").slice(1);
  const hm = !GO_ROUTE.test(full);
  useGame(hm ? "home" : "go");
  const r = hm ? (full.startsWith("hm-") ? full.slice(3) : "home") : full;   // HOME's pages: the same names as GO's after #hm-
  document.documentElement.classList.toggle("tab-shiny", prefs.work === "shiny" && !!workBox());
  const term = q.value.trim().toLowerCase().replace(/[‘’]/g, "'");   // “farfetch’d” as the page shows it, or from a phone (19 Nov tests)
  const pn = /^p-(\d+(?:-[a-z]+)?)$/.exec(r), lead = pn && groupByNumber(ENTRIES.filter(e => groupKey(e) === pn[1]))[0];
  navHtml(lead ? R("gen-" + lead.lead.gen).slice(1) : !hm && /^set-/.test(r) ? "sets" : hm && !/^(dex|fast|gen-\w+)$/.test(r) ? "home" : full);   // a Pokémon's page lights up its region in the sidebar
  if (hm) return hmRoute(r, term);
  if (r === "costumes" || r === "events") { location.replace("#sets"); return; }   // the old pages are now Event Pokémon
  if (r === "fast") return fastPage();
  if (r === "want") return wantPage();
  if (r === "coming") return comingPage();
  if (r === "sets") return setsPage();
  const sm = /^set-(.+)$/.exec(r);
  if (sm) return setPage(sm[1]);
  const pm = /^p-(\d+(?:-[a-z]+)?)$/.exec(r);
  if (pm) return pokemonPage(pm[1]);
  if (TRY.get("only")) { const ns = TRY.get("only").split(",").map(Number); Object.assign(prefs, {work: "all", workShow: "all"}); return dexPage("Forms", "Trial", ENTRIES.filter(e => ns.includes(e.dex) && !isRegional(e)).sort((a, b) => ns.indexOf(a.dex) - ns.indexOf(b.dex))); }   // ?only= for pictures of options only
  if (term) {
    const n = parseInt(term.replace(/^#/, ""), 10);
    const list = ENTRIES.filter(e => (e.name + " " + (e.form || "")).toLowerCase().includes(term) || e.dex === n);
    return dexPage(`“${esc(q.value.trim())}”`, "Search", list, undefined, true);
  }
  const g = /^gen-(\w+)$/.exec(r);
  if (g && genById[g[1]]) return dexPage(esc(genById[g[1]][1]), genById[g[1]][2], ENTRIES.filter(e => e.gen === g[1]), g[1]);
  if (r === "dex") return dexPage("Every <em>Pokémon</em>", "Pokémon GO", ENTRIES);
  if (r === "go") return home();   // GO's Home
  if (r === "games") return allGamesPage();   // All games (games, above)
  if (r === "hm") { location.replace("#home"); return; }
  useGame("home"); navHtml("home"); return hmHome();   // anything else (#gen-99): Pokémon HOME's Home, the default game
}
function hmRoute(r, term){   // Pokémon HOME's pages: the same as GO's, from HOME's list (games, above)
  if (r === "fast") return fastPage();
  const pm = /^p-(\d+(?:-[a-z]+)?)$/.exec(r);
  if (pm) return pokemonPage(pm[1]);
  if (term) {
    const n = parseInt(term.replace(/^#/, ""), 10);
    const list = ENTRIES.filter(e => (e.name + " " + (e.form || "")).toLowerCase().replace(/[‘’]/g, "'").includes(term) || e.dex === n);
    return dexPage(`“${esc(q.value.trim())}”`, "Search", list, undefined, true);
  }
  const g = /^gen-(\w+)$/.exec(r);
  if (g && genById[g[1]]) return dexPage(esc(genById[g[1]][1]), genById[g[1]][2], ENTRIES.filter(e => e.gen === g[1]), g[1]);
  if (r === "dex") return dexPage("Every <em>Pokémon</em>", "Pokémon HOME", ENTRIES);
  return hmHome();
}
function focusKey(el){   // a way to find the same control after the page is drawn again: its data-* attributes, and its card's
  if (!el || el === document.body || !(view.contains(el) || nav.contains(el))) return null;
  const sel = el => el.tagName.toLowerCase() + [...el.attributes].filter(a => a.name.startsWith("data-") || a.name === "href" || a.name === "id").map(a => `[${a.name}="${CSS.escape(a.value)}"]`).join("");
  const holder = el.parentElement && el.parentElement.closest("[data-id],[data-bg],[data-costume],[data-fk]");
  return (holder && holder !== el ? sel(holder) + " " : "") + sel(el);
}
function rerender(){
  const y = scrollY, k = focusKey(document.activeElement);
  route(); scrollTo(0, y);
  if (k) { try { document.querySelector(k)?.focus({preventScroll: true}); } catch (e) {} }
}

// ---------- saving ----------
const toastEl = document.getElementById("toast");
let toastTimer;
function toast(msg){ toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.hidden = true, 3500); }

const READY = {go: false, home: false};   // her ticks for that game read from the server (HOME's need a server that knows HOME)
async function save(body){
  if (viewOnly) return false;
  const game = body.game || GAME;
  body = {...body}; delete body.game;
  if (game !== "go") body.game = game;   // GO's saves exactly as before; HOME's go to collection/home.json
  if (!readOnly && !READY[game]) { toast("Not saved: the Pokédex server can’t save Pokémon HOME’s ticks yet."); return false; }
  if (readOnly) { toast(loadFailed ? "The server couldn’t read your ticks, so nothing was saved. Open the shortcut again." : loading ? "Still reading your ticks from the server: try again in a moment." : "Opened from the folder: open it with the shortcut to save ticks."); return false; }   // loading: clicked before the server's answer came (round 5 review: it said "Opened from the folder")
  try {
    const r = await fetch("api/tick", {method: "POST", headers: {"Content-Type": "application/json", "X-Pokedex": "1"}, body: JSON.stringify(body)});
    const j = await r.json();
    if (!j.ok && r.status >= 500) throw new Error(j.error);
    if (!j.ok) { toast(`Not saved: ${curly(j.error || "the server said no")}`); return false; }   // the server's own reason (15 Nov review: it always said "isn't answering")
    return true;
  } catch (e) {
    toast("Not saved: the Pokédex server isn’t answering. Try again in a moment.");
    return false;
  }
}
function setTick(key, t, on, col = COL){
  const s = new Set(col.have[key] || []);
  on ? s.add(t) : s.delete(t);
  if (s.size) col.have[key] = [...s]; else delete col.have[key];
}
async function tick(key, t, on){
  if (viewOnly) return;   // nothing to save to: the boxes only show
  const game = GAME, col = COL, auto = autoCaught;   // the game this box is in, even if she changes game while it saves
  const alsoCaught = on && t !== "c" && !has(key, "c");   // a ♂, ♀, shiny, lucky… one is caught too
  // a Caught ticked only because of another box goes again when that box is unticked, unless something else is still
  // ticked (her note, 12 Nov, for Fast tick; everywhere since the 15 Nov review); ticking Caught by hand keeps it
  if (alsoCaught) auto.add(key);
  if (t === "c") auto.delete(key);
  keepAuto(game);
  setTick(key, t, on, col);
  if (alsoCaught) setTick(key, "c", true, col);
  rerender();
  if (!await save({game, list: "have", key, tick: t, on})) { setTick(key, t, !on, col); if (alsoCaught) setTick(key, "c", false, col); return rerender(); }
  if (alsoCaught && !await save({game, list: "have", key, tick: "c", on: true})) { setTick(key, "c", false, col); rerender(); }
  if (GAME !== game) return;
  if (!on && t !== "c" && auto.has(key) && (col.have[key] || []).every(x => x === "c")) {
    auto.delete(key); keepAuto(game);
    if (has(key, "c")) await tick(key, "c", false);
  }
}
async function toggleList(list, id){
  if (viewOnly) return;
  const on = !COL[list].includes(id);
  const apply = v => { COL[list] = v ? [...COL[list], id] : COL[list].filter(x => x !== id); };
  apply(on); rerender();
  if (!await save({list, key: id, on})) { apply(!on); rerender(); }
}

document.addEventListener("click", ev => {
  if (ev.target.closest("a[data-skip]")) { ev.preventDefault(); view.focus(); return; }   // Skip to the page: focus, not an address (#view isn't a page)
  const go = ev.target.closest("a[data-goform]");
  if (go) { const e = byId[go.dataset.goform]; pageForm[groupKey(e)] = e.id; if (location.hash === pageOf(e)) { ev.preventDefault(); rerender(); } return; }
  const b = ev.target.closest("button");
  if (!b) {   // anywhere else on a card opens that Pokémon's page, at that form (her ask, 10 Nov; ticking is on the boxes)
    const c = ev.target.closest(".card[data-id],.card[data-costume],.card[data-bgdex]");
    const link = ev.target.closest("a");
    if (!c || (link && link.getAttribute("href") !== location.hash)) return;   // a link to this same page (a name on its own page) counts as the card
    if (link) ev.preventDefault();
    const e = byId[c.dataset.id] || costumeById[c.dataset.costume] || byId[c.dataset.bgmon] || costumeById[c.dataset.bgmon] || baseOf[c.dataset.bgdex];
    if (!e) return;
    if (location.hash === pageOf(e) && !c.dataset.id) {   // a costume or background on its own Pokémon's page: the card ticks its Caught box (her note, 10 Nov)
      const key = c.dataset.costume ? "c:" + c.dataset.costume : c.dataset.bg;
      if (key) return tick(key, "c", !has(key, "c"));
    }
    if (c.dataset.id) pageForm[groupKey(e)] = e.id;
    if (location.hash === pageOf(e)) { rerender(); return scrollTo({top: 0, behavior: "smooth"}); }
    location.hash = pageOf(e);
    return;
  }
  if (b.dataset.pickform) { const e = byId[b.dataset.pickform]; pageForm[groupKey(e)] = e.id; return rerender(); }
  if (b.hasAttribute("data-clear")) { Object.assign(prefs, {work: "all", workShow: "all"}); keepPrefs(); return rerender(); }
  if (b.hasAttribute("data-showall")) { prefs.workShow = prefs.workShow === "all" ? "need" : "all"; keepPrefs(); return rerender(); }
  if (b.dataset.work) { prefs.work = prefs.work === b.dataset.work ? "all" : b.dataset.work; keepPrefs(); return rerender(); }   // click again: back to all; "Hide ones I have" stays as it is, off unless she turns it on (her ask, 22 Nov: off by default for all)
  if (b.dataset.fast || b.dataset.fk) return fastClick(b);
  if (b.dataset.fastkind) { prefs.fastKind = b.dataset.fastkind; keepPrefs(); return rerender(); }
  if (b.hasAttribute("data-fastall")) return fastAll();
  if (b.dataset.fastgen) { prefs.fastGen = b.dataset.fastgen; keepPrefs(); return rerender(); }
  if (b.dataset.fastbox) { prefs.fastBox = b.dataset.fastbox; keepPrefs(); return rerender(); }
  if (b.dataset.wantbox) { prefs.wantBox = b.dataset.wantbox; keepPrefs(); return rerender(); }
  if (b.hasAttribute("data-wantcopy")) return wantCopy();
  if (b.dataset.comesel) {   // click again: closed; the details open under the week clicked, scrolled into view
    const wk = b.dataset.comeweek ?? null, again = comingSel === b.dataset.comesel && comingWeek === wk;
    comingSel = again ? null : b.dataset.comesel; comingWeek = again ? null : wk; rerender();
    if (!again) view.querySelector(".caldetail")?.scrollIntoView({block: "nearest", behavior: "smooth"});
    return;
  }
  if (b.dataset.comemonth) { const v = +b.dataset.comemonth; comingMonth = v ? comingMonth + v : 0; comingSel = comingWeek = null; return rerender(); }
  if (b.hasAttribute("data-comeclose")) { comingSel = comingWeek = null; return rerender(); }
  if (b.dataset.comekind) { const h = new Set(prefs.comingHide || []), k = b.dataset.comekind; h.has(k) ? h.delete(k) : h.add(k); prefs.comingHide = [...h]; keepPrefs(); comingSel = comingWeek = null; return rerender(); }
  if (b.dataset.comegot) { const k = b.dataset.comegot; comingOpen.has(k) ? comingOpen.delete(k) : comingOpen.add(k); return rerender(); }
  if (b.hasAttribute("data-wantoverlap")) { prefs.wantOverlap = !prefs.wantOverlap; keepPrefs(); return rerender(); }
  if (b.dataset.fastorder) { prefs.fastOrder = b.dataset.fastorder; keepPrefs(); return rerender(); }
  if (b.dataset.notout) { prefs.unreleased = b.dataset.notout === "yes"; keepPrefs(); return rerender(); }
  if (b.dataset.flip) {
    const k = b.dataset.pic, item = byId[k.slice(2)] || costumeById[k.slice(2)];
    const st = {...(picFlip.get(k) || {s: shinyFirst(), f: !!(item && item.femaleImg && sprite(item.femaleImg))})};
    st[b.dataset.flip] = !st[b.dataset.flip]; picFlip.set(k, st); return rerender();
  }
  if (b.hasAttribute("data-went")) return toggleList("went", b.closest("[data-event]").dataset.event);
  if (b.dataset.tick) {
    const holder = b.closest("[data-id],[data-costume],[data-bg]");   // a card, the big boxes on a Pokémon's page, a costume or a background
    const key = holder.dataset.id ? "d:" + holder.dataset.id : holder.dataset.costume ? "c:" + holder.dataset.costume : holder.dataset.bg;
    return tick(key, b.dataset.tick, b.getAttribute("aria-pressed") !== "true");
  }
});

let qTimer;
q.addEventListener("input", () => {
  clearTimeout(qTimer);
  qTimer = setTimeout(() => {
    const r = (location.hash || "#home").slice(1), p = GO_ROUTE.test(r) ? "" : "hm-";   // in the game shown
    if (q.value.trim() && r !== p + "dex" && !r.startsWith(p + "gen-")) location.hash = "#" + p + "dex"; else route();
  }, 150);
});
document.getElementById("searchIco").innerHTML = ic("search");
// narrow windows and phones (21 Nov, her note: “Other apps have hamburger no sidebar in condensed browser”): a top bar with a Menu
// button, the sidebar a drawer over the page. Since 22 Nov the family's shared Menu drawer (Jemma's Journals' /family/family.js,
// JJFamily.menu; her decision: all shared code lives there): it closes on choosing a link, on Escape and on tapping outside it;
// while shut it is inert; while open everything else is inert, so Tab stays inside it. Opening puts focus on this page's link
// (Home if it has none), never on "← Jemma’s Journals"; closing puts it back on Menu, or on the page after a link. The bar and
// drawer keep the Pokédex's own look (site.css). family.js is loaded with defer, so this starts once it has run.
const side = document.getElementById("side"), menuBtn = document.getElementById("menuBtn");
document.getElementById("menuIco").innerHTML = ic("menu");
let menu = null;
const menuOpen = () => !!(menu && menu.isOpen());
function startFamily(){
  if (menu) return;
  if (!window.JJFamily) {   // the shared code missing (opened as a file, or without Jemma's Journals): no drawer, no footer buttons;
    document.documentElement.classList.add("no-family");   // site.css then puts the sidebar at the top of the page under 900px
    return;
  }
  menu = JJFamily.menu({
    button: menuBtn, drawer: side, scrim: document.getElementById("scrim"),
    outside: () => [document.getElementById("skipLink"), document.getElementById("topbar"), document.getElementById("main")],   // inert while the drawer is open
    current: () => nav.querySelector("a.on") || nav.querySelector("a"),   // this page's link (aria-current), the game's Home if none
    main: () => view,
  });
}
if (window.JJFamily) startFamily(); else document.addEventListener("DOMContentLoaded", startFamily);
// opened as a file: "← Jemma’s Journals" goes to the home site's own file beside this one (pokedex/site → site), like her other apps
const HOME_LOCAL = "../../site/index.html";
if (location.protocol === "file:") document.getElementById("homeLink").setAttribute("href", HOME_LOCAL);
// Pokédex-only: Enter in the search box closes the drawer and goes on to the results
q.addEventListener("keydown", ev => { if (ev.key === "Enter" && menuOpen()) menu.close("link"); });
// Tab and Shift+Tab stay inside the open drawer: the family's menu() does that (round 4; it also brings back focus a redraw lost)
// the foot of every page (family rules, 21 Nov) is the family's too: Back to top, Dark mode / Light mode (the shared jj-mode, set
// before the page draws by /family/mode.js), footer line 1 and the credits' dots are all done by /family/family.js
// Back (or Forward) goes back to where she was on that page (phone review: back from a Pokémon put Kanto at the top again, 151
// cards to scroll through once more): each history entry keeps its place, saved as she scrolls and before a click opens a page
history.scrollRestoration = "manual";
const saveScroll = () => { try { history.replaceState({...(history.state || {}), y: scrollY}, ""); } catch (e) {} };   // no address given: it stays as it is
let scrollTimer;
addEventListener("scroll", () => { clearTimeout(scrollTimer); scrollTimer = setTimeout(saveScroll, 150); }, {passive: true});
document.addEventListener("click", saveScroll, true);
addEventListener("hashchange", () => {
  const a = document.activeElement, fromNav = nav.contains(a) ? a.getAttribute("href") : null;   // a sidebar link chosen (keyboard or mouse)
  const y = (history.state && history.state.y) || 0;   // a page gone back to: its place; a new page: the top
  if (!["#dex", "#hm-dex"].includes(location.hash) && q.value) q.value = ""; if (menuOpen() && document.activeElement !== q) menu.close(); route(); scrollTo(0, y);
  if (y) requestAnimationFrame(() => scrollTo(0, y));   // again once the labels are fitted (a long one can make a card taller)
  // the sidebar is drawn again, so the chosen link is new: on wide screens focus goes back to it, not to the page's body (round 4
  // review, 22 Nov); in the drawer (900px and under) the family's menu puts it on the page instead
  if (fromNav && !menuOpen() && !matchMedia("(max-width: 900px)").matches && (document.activeElement === document.body || !document.contains(a)))
    (nav.querySelector(`a[href="${CSS.escape(fromNav)}"]`) || nav.querySelector("a.on") || view).focus({preventScroll: true});
});   // another page clears the search (19 Nov review: Home and the regions showed an old search)
addEventListener("keydown", ev => {   // ← and → step through the numbers on a Pokémon's page
  if (!/^#(hm-)?p-\d+(-[a-z]+)?$/.test(location.hash) || menuOpen() || ev.target.closest("input,textarea,select") || ev.altKey || ev.ctrlKey || ev.metaKey) return;
  const a = document.querySelector(ev.key === "ArrowLeft" ? ".pn.prev" : ev.key === "ArrowRight" ? ".pn.next" : null);
  if (a) { ev.preventDefault(); location.hash = a.getAttribute("href"); }
});

route();
if (location.protocol.startsWith("http")) {
  // her server answers with JSON; no server at all (online: a 404 or 405 from the web host, its page instead of JSON, or no
  // answer) means view only, quietly; anything else (a 500, a refusal, broken JSON from her server) is a real failure
  const noServer = () => { loading = false; viewOnly = true; document.documentElement.classList.add("view-only"); rerender(); };
  // each game's ticks: GO's as ever, and HOME's (?game=home); a server from before HOME answers that with a 404, so HOME's boxes
  // then say they can't be saved rather than saving into GO's file
  const get = url => fetch(url, {cache: "no-store"}).then(r => {   // null: no server here (view only); an error: her server failed
    if ([404, 405, 501].includes(r.status) || (r.ok && !/json/i.test(r.headers.get("Content-Type") || ""))) return null;
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }, () => null);
  get("api/collection").then(c => {
    if (!c) return noServer();
    COLS.go = norm(c); READY.go = true;
    return get("api/collection?game=home").catch(() => null).then(h => {
      if (h) { COLS.home = norm(h); READY.home = true; }
      COL = COLS[GAME]; readOnly = false; loading = false; rerender();
    });
  }).catch(() => { loading = false; loadFailed = true; rerender(); });
}
