# Legends: Arceus, Legends: Z-A, Violet and Shield in the Pokédex: research and how it would be built (23 Nov 2026)

Her ask (22 Nov, overnight): “research into adding more games: Legends Arceus, Legends ZA, Violet & Shield. They only have newer regions and do different dexes slightly so may need a bit different to home or go … do full research and come up with proposals for them.” Her plain version, with every choice listed: `for-jemma/new-games.md`. The research, one page per game with every fact’s source and date: `research/games/legends-arceus.md`, `legends-za.md`, `violet.md`, `shield.md`; the lists as data: `research/data/games/*.json`. Nothing in the app was changed for this. **Her answers (23 Nov):** not yet; when built, Caught = have it in that game now (a living dex, like HOME, not the game’s Pokédex registration), and version exclusives shown with a mark (and tickable).

## 1. What each game has (from the research)

| | Legends: Arceus | Legends: Z-A | Violet | Shield |
|---|---|---|---|---|
| **Pokédexes** | Hisui 242 | Lumiose 232, Hyperspace 132 (Mega Dimension), Mega Evolution 93 (68 before the DLC) | Paldea 400, Kitakami 200, Blueberry 243 | Galar 400, Isle of Armor 211, Crown Tundra 210 |
| **Needed to complete** | 237 for the Arceus quest (no mythicals); the Shiny Charm’s set is disputed (237, 238 or #001–#240) | Lumiose 230 (not Diancie, Mewtwo), Hyperspace 131 (not Zeraora), Mega 81 | Paldea 400, Kitakami 200, Blueberry 240 (not Walking Wake, Iron Leaves, Pecharunt) | Galar 400, Isle of Armor 210 (not Zarude), Crown Tundra 210 |
| **Species** (all its Pokédexes) | 242 | 364 (Lumiose and Hyperspace) | 664 | 584 |
| **Forms in the game’s Pokédex** | one entry per species; forms, gender and shiny viewed inside it; 57 gender differences; 15 species only Hisuian | one entry per species; Male/Female shown as forms; 3 Vivillon patterns; 96 Megas in their own Pokédex | one entry per species; regional forms obtainable but not always registrable | one entry per species; forms (Gigantamax too) registered inside it |
| **What the game marks** | Research Level 0–10: “Complete!” at 10, “Perfect!” with every task; Alpha; seen/obtained/caught split by gender, Alpha and shiny in the save | seen / registered; a Mega registered with the Pokémon **and** its Mega Stone; shiny Megas | seen / caught | seen / caught; Number Battled |
| **Version exclusives** | none | none | 34 each side (Violet: the Iron paradoxes, Miraidon, Aqua Breed Tauros, Dreepy…) | 47 each side (45 species, Blue-Striped Basculin, female Indeedee) + 8 Dynamax Adventure legendaries |
| **Shiny-locked** | 18 legendaries and mythicals; gift Alolan Vulpix/Ninetales | 20 never shiny in the game | 54 entries (46 never shiny in the game) | 36 encounters (starters, gifts, Zacian, Zamazenta, Eternatus, Kubfu, the Crown Tundra legendaries…) |
| **Special** | Alpha (224 species; 82 with fixed Alphas) | Alpha (339 species; 111 with guaranteed Alpha spawns); Mega | the 25 Snacksworth legendaries, Meloetta and others are catchable but in no Pokédex | Gigantamax (32 species, 34 looks; Max Soup gives the Factor except Melmetal) |
| **Shiny Charm** | Research Level 10 across the Hisui Pokédex | Mable’s Research level 50 | complete Paldea | complete Galar |
| **HOME** | its own Hisui Pokédex in HOME (shiny Enamorus); only Pokémon in the game can go in; an Alpha keeps the Alpha Mark | linked since HOME 4.0.0 (1–2 April 2026), Switch only; HOME’s Lumiose, Hyperspace and Mega Evolution Pokédexes (shiny Volcanion) | HOME’s Paldea, Kitakami and Blueberry Pokédexes (shiny Meloetta) | HOME’s Galar, Isle of Armor and Crown Tundra Pokédexes (shiny Keldeo); the Gigantamax Factor keeps |

**Data sources.** PokeAPI’s open tables already have every regional Pokédex here (`pokedexes.csv` ids 27–35: galar, isle-of-armor, crown-tundra, hisui, paldea, kitakami, blueberry, lumiose-city, hyperspace; `pokemon_dex_numbers.csv`), and each was checked entry for entry against Serebii: no differences. Only Z-A’s Mega Evolution Pokédex isn’t in PokeAPI (Serebii, in `legends-za.json`). Exclusives, shiny locks, Alphas, Gigantamax and Megas: the research JSON files (Serebii, official pages; Bulbapedia from search snippets only, marked).

**Maps for banners.** Already in the Pokédex: Hisui, Paldea, Galar. Found, not downloaded: the official site’s Isle of Armor and Crown Tundra maps (`swordshield.pokemon.com/assets/img/articles/ex/map_armor_2x.jpg`, `map_crown_2x.jpg`; small, size unchecked); the official Lumiose City map (`legends.pokemon.com/images/pages/story-map/lumiose-map-2x.jpg`) and the announcement art “Lumiose City Map” (about 1.4:1). None found for Kitakami (only an in-game map, 3,400 × 3,400, Bulbagarden Archives), the Blueberry Terarium or Hyperspace Lumiose.

## 2. How it would be built (my suggestion, not decided)

HOME showed the way: one set of pages, each game a “world” (`useGame`), GO’s entries shared wherever a game has the same Pokémon or form. These games add three things HOME didn’t need.

**a. Pokédexes instead of regions.** Each game lists its Pokédexes (id, name, map, the numbers it runs to). A Pokédex page shows its Pokémon in the game’s order with the game’s own number on the card (Galar #001), the National number on the Pokémon’s page. The game’s Home is its totals and a card per Pokédex (map, “#001–#400”, counts), like today’s region hub. A Pokémon in two Pokédexes (Wooper in Paldea and Kitakami) is one Pokémon with both numbers.

**b. More than one Pokédex per game, and Pokémon outside them.** Every Pokémon = all the game’s Pokédexes together. Pokémon the game has outside its Pokédexes (Violet’s Snacksworth legendaries; Shield’s Dynamax Adventure Pokémon) are her choice 4.

**c. Version exclusives.** A `only: "scarlet"` / `only: "sword"` on an entry: a small mark on the card and the page, counted in the totals (they’re needed to complete), her choice 3.

**Data.** A new `tools/import_games.py` (like `import_home.py`): PokeAPI’s dex numbers for each Pokédex, the research JSON for exclusives, shiny locks, Alphas, Gigantamax and Megas, GO’s entries shared wherever the form is the same (the same matching as HOME), HOME’s pictures where GO has none (`fetch_home_sprites.py` already does this). One file per game, `data/<game>/dex.json`, each entry with its Pokédex numbers (`dexNo: {"galar": 1, "isle-of-armor": 15}`).

**Ticks.** One file per game beside GO’s and HOME’s (`collection/legends-arceus.json`, `legends-za.json`, `violet.json`, `shield.json`), the server’s `FILES` and `GAME_TICKS` growing by one line each, the same lock and `.bak`. The daily backup already commits any change in `data/collection/`; `record_apps.py` and `check_all.py` would ignore the new files as they do GO’s and HOME’s.

**Boxes.** Shared codes where the meaning is the same (`c`, `cf`, `cm`, `s`, `gx`, `mg`); new ones only where needed: `al` Alpha, `rc` Complete (Research Level 10), `rp` Perfect. New boxes need an icon from her sets (Lucide, Phosphor, Tabler…) and a colour balanced with the others: shown to her as a picture first (her rules).

**Addresses.** Each game a short prefix, like HOME’s `hm-`: `la-` (Legends: Arceus), `za-`, `vi-`, `sh-`; GO’s addresses unchanged.

**The game switch.** Two options fit a switch; six don’t. Options for a Try switch (her choice 7): two rows of three small buttons · a drop-down under the title · the games as a list in the sidebar · All games only.

**Size.** Each game adds about 60–120 KB to `data.js` (HOME added 90 KB): fine. A game’s data could be its own file loaded only when opened, if `data.js` grows too big.

**Effort.** The first game with the shared parts (a–c, the switch, a new box or two): medium (a day or so, with tests). Each further game: small to medium (mostly data and its own boxes).

## 3. Open questions in the research (unsure)

- Legends: Arceus: which entries the Shiny Charm needs (Serebii 237; Bulbapedia 238; Thonky #001–#240); who gives it (Cyllene or Laventon).
- Legends: Z-A: the Mega Evolution Pokédex’s own order (no numbers found); whether the main Pokédexes record shiny; whether the Pokédex shows Alphas; Zeraora (event or in-game route).
- Violet: whether Kantonian Vulpix and Ninetales fill Blueberry’s Alolan entries; the shiny Koraidon code’s dates.
- Shield: whether the in-game Pokédex records shiny or gender; what the Catching Charm needs.
- All four: exactly which forms each game’s own Pokédex shows inside an entry (sources describe the Pokédex screens only in general).
