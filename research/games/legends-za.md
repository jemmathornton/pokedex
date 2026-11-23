# Pokémon Legends: Z-A (with Mega Dimension)

Research for adding Legends: Z-A (Switch and Switch 2, out 16 Oct 2025) next to GO and HOME. Sources were read on **22 or 23 Nov 2026** (the date is beside each one at the bottom). Bulbapedia refuses automated reading, so anything from it is from **search snippets only** and says so. “Inferred” marks my own reasoning; “unsure” means the sources disagree or say nothing. The lists are in `../data/games/legends-za.json`.

**What we knew, checked:**
- HOME 4.0.0 connected Z-A: Nintendo dates it 1 April 2026; Serebii says it rolled out from 2 April until 06:00 UTC on 3 April ([Serebii, 2 April][s-n0204]; Nintendo’s date via `../home-tracking.md`). Right.
- HOME added Lumiose, Hyperspace and Mega Evolution Pokédexes ([Serebii, 2 April][s-n0204]). Right. **Correction:** the Mega Evolution Pokédex isn’t only HOME’s: the game has one too, a section shared by its two Pokédexes ([Bulbapedia, Mega Evolution Pokédex][b-megadex], snippet).
- Completing all three in HOME with Z-A Pokémon gives a shiny Volcanion ([Serebii, 27 April][s-n2704]). Right, with exclusions: see 3.

## 1. The game’s Pokédexes

| Pokédex | Entries | Needed to complete | Added |
|---|---|---|---|
| Lumiose | 232 (#001 Chikorita to #232 Mewtwo) | 230: not Diancie or Mewtwo | base game |
| Hyperspace | 132 (#001 Mankey to #132 Zeraora) | 131: not Zeraora | Mega Dimension (version 2.0.0) |
| Mega Evolution | 93 (68 before the DLC) | 81 (62 before the DLC) | base game, 25 added by the DLC |

- **Lumiose and Hyperspace:** Serebii’s lists ([Lumiose][s-lum], [Hyperspace][s-hyp], 22 Nov) and PokeAPI’s ([PokeAPI CSVs][api], 23 Nov) **match entry for entry**, numbers and order. No species is in both (counted, 364 species in all). Full lists with National numbers in the JSON.
- **PokeAPI has the game:** version groups `legends-za` (30) and `mega-dimension` (31); Pokédexes `lumiose-city` (34) and `hyperspace` (35). It has **no Mega Evolution Pokédex**. Its dex file last changed 9 Sep 2026 ([GitHub history][api-git], 23 Nov).
- **Needed to complete:** Lumiose 232, “230 are required”, Diancie and Mewtwo not ([Bulbapedia, Lumiose list][b-lumdex], snippet). Hyperspace 132, “only 131 are required … (Zeraora is not required)” ([Bulbapedia, Hyperspace list][b-hydex], snippet).
- **Mega Evolution Pokédex:** 93 with the DLC, “81 of which are directly available … and required”; originally 68, of which 62 ([Bulbapedia][b-megadex], snippet). My count from Serebii’s Megas gives the same (inferred): 48 old Megas + 48 new = 96 forms, less 2 for Tatsugiri’s three sharing one entry and 1 for Magearna’s two. Base game 68 = the Megas of Lumiose species. Tatsugiri, Magearna and “no stone circle” for Mega Rayquaza come from a search summary of Bulbapedia (snippet, 22 Nov): **unsure**.
  - No numbers of its own were found. Bulbapedia’s list gives Lumiose, Hyperspace and National numbers and starts with Mega Venusaur and Mega Charizard X and Y (snippet). The JSON orders it by National number; the in-game order is **unsure**.
  - The 12 event-only Megas, not needed: Garchomp Z, Greninja, Chesnaught, Delphox, Diancie, Mewtwo X, Mewtwo Y, Baxcalibur, Sceptile, Blaziken, Swampert, Zeraora ([Bulbapedia][b-megadex], snippet).
  - The 25 added by the DLC (inferred from the lists): the 19 entries for Mega Dimension’s 22 new Megas ([Serebii DLC Megas][s-dlcmega]) plus Sceptile, Blaziken, Swampert, Latias, Latios and Rayquaza, whose species are only in the Hyperspace Pokédex.
- **Forms are not separate entries.** One number per species ([Serebii][s-lum]; [PokeAPI][api]). Forms sit inside the entry: see 2.
  - **Regional forms in the game (16):** Lumiose: Alolan Raichu, Galarian Slowpoke, Slowbro, Slowking and Stunfisk, Hisuian Sliggoo, Goodra and Avalugg. Hyperspace: Alolan Meowth, Persian and Marowak, Galarian Meowth, Farfetch’d, Mr. Mime and Yamask, Hisuian Qwilfish ([RankedBoost][rb-reg], 23 Nov; Lumiose ones also [Bulbapedia, Lumiose list][b-lumdex], snippet). Whether the original forms of the Hyperspace ones (Kanto Meowth, Persian, Farfetch’d…) are in the game: **unsure**.
  - **Vivillon:** three patterns in the game, Meadow (wild), Marine (only the Lumiose Museum Spewpa, Side Mission 21) and Garden (Hyperspace) ([PokéBase answer][pdb-viv], community, 23 Nov). The other 17 are transfer-only ([Serebii transfer-only][s-tro]).
  - **Flabébé line:** five colours, plus Eternal Flower Floette (a post-game gift) ([Serebii gifts][s-gift]; a fan’s living dex, [X post][cbad], snippet).
  - **Mega Meowstic** is one form for both genders ([Vice, 15 Dec 2025][vice-meow]). PokeAPI keeps a male and a female Mega Meowstic: **unsure** how the Pokédex shows it.

## 2. What the game records per entry

- **Registering:** catching or evolving. Mable’s request: “Catch them, evolve them - however you do it is all the same” ([Serebii, Mable’s Research][s-mable]).
- **Seen and registered:** in the Mega Evolution Pokédex, seeing a Mega in battle only marks it seen. It is registered once you own **both the Pokémon and its Mega Stone**, without needing to Mega Evolve ([Bulbapedia][b-megadex], snippet). For the Lumiose and Hyperspace Pokédexes, no source spells out seen and caught: **unsure** (inferred: the same two states).
- **Forms and gender:** the Z-A Pokédex shows gender differences as forms named “Male” and “Female”. You register one by getting it, or by seeing it in battle once you have any form of that Pokémon ([Bulbapedia, gender differences][b-gender], snippet). Furfrou’s trims can be registered ([All Things How, 10 Nov 2025][ath-furfrou]). A datamine lists 10 Furfrou trims, 20 Vivillon patterns, 4 Pumpkaboo and Gourgeist sizes, 5 Zygarde forms and 2 Hoopa forms ([Sportskeeda][ss-datamine], snippet). Whether the Pokédex shows every one: **unsure**.
- **Shiny:** version 2.0.1 fixed shiny Megas caught before Mega Dimension not showing in the Mega Evolution Pokédex ([Nintendo][n-upd]; [Serebii patches][s-patch]). So that Pokédex records shiny (inferred). For the other two: **unsure**, no source found.
- **Alpha:** an Alpha has “a special symbol on their status screen” and maximum size ([Serebii Alphas][s-alpha]). No source says the Pokédex records Alphas: **unsure** (inferred: no).
- **What a collector would tick** (inferred, my suggestion): per species, caught; shiny; Alpha; shiny Alpha; each form the game has (regional, Male/Female, colours, the three Vivillon patterns, trims, sizes). Per Mega, registered (Pokémon plus stone) and shiny. Event and transfer-only items marked as such (see 4).

## 3. Completion and rewards

- **Mable’s Research:** requests give points, and levels 2 to 50 give rewards: mostly TMs, Exp. Candy, Bottle Caps, 3 Gold Bottle Caps, a Master Ball at 49 and the **Shiny Charm at 50** ([Serebii][s-mable], 22 Nov; [PokemonDB][pdb-res], 23 Nov). Requests include “Filling Your Pokédex”, “Filling Your Mega Evolution Pokédex” (“Obtain Mega Stones and register Mega Evolutions”) and “Filling Your Hyperspace Pokédex”. So filling Pokédexes helps towards the Shiny Charm, but it isn’t a completion reward.
  - Top steps: Serebii gives 230 (Pokédex), 90 (Mega) and 130 (Hyperspace); PokemonDB gives 240 and 65. **Unsure** (inferred: PokemonDB mixes versions).
  - Shiny Charm: “an additional extra roll making the effective rate … 1 in 1,024.38” (Serebii’s figure, base 1 in 4,096) ([Serebii shiny][s-shiny]).
- **Lumiose Pokédex complete:** the title “Pokémon Professor”; Diancie and Mewtwo not needed ([Bulbapedia, titles][b-title], snippet). Any in-game reward for completing the Hyperspace or Mega Evolution Pokédex: **unsure**, none found.
- **HOME:** a shiny Volcanion for completing HOME’s Lumiose, Hyperspace and Mega Evolution Pokédexes “with Pokémon deposited from Pokémon Legends: Z-A” ([Serebii, 27 April][s-n2704]). From 27 April 2026, no end date; Lv. 50, Cherish Ball, OT HOME, ID 260427, Modest, Souvenir Ribbon ([Serebii event list][s-ev721]). Not needed: Diancie, Mewtwo, Zeraora and event-only Megas ([Bulbapedia, distributions][b-dist], snippet). Confirm completion in HOME’s Games tab ([Nintendo Life, 27 April][nl-volc]); it is “to use in Pokémon Legends: Z-A” ([Pokémon Blog][pb-volc]).

## 4. What can’t be had

**Shiny-locked** ([Gamerant, 29 Dec 2025][gr-locks]; rule from [Serebii shiny][s-shiny]: gifts and story or request Pokémon are locked; fossils are not):
- Locked encounters, but the species can be shiny elsewhere in the game: the starters (Chikorita, Tepig, Totodile; Bulbasaur, Charmander, Squirtle; Chespin, Fennekin, Froakie), Heracross, Riolu, Absol, Lucario, Galarian Slowpoke, Galarian Stunfisk, Alolan Raichu and Gimmighoul (where in the JSON).
- **Never shiny in the game (20 species):** Xerneas, Yveltal, Zygarde, Diancie, Mewtwo; DLC: Heatran, Darkrai, Groudon, Kyogre, Rayquaza, Meloetta, Keldeo, Genesect, Marshadow, Meltan, Melmetal, Volcanion, Magearna, Hoopa, Zeraora. Also Eternal Flower Floette and the museum’s Marine Spewpa (so no shiny Marine Vivillon, inferred). Meltan isn’t on Gamerant’s list; locked by Serebii’s gift rule (inferred).
  - **Can be shiny:** Latias, Latios, Cobalion, Terrakion, Virizion (special scans in Hyperspace) ([Serebii legendaries][s-leg]).
  - **Shiny by event or HOME:** Xerneas by serial code CELEBRATE30TH, 12 Nov 2026 to 7 Jan 2027 ([Serebii serial codes][s-code]); Volcanion from HOME (see 3). Inferred: other shinies from other games can come in through HOME if the species is in Z-A.

**Event, transfer or trade:**
- **Mystery Gift:** Diancie (Diancite, from 6 Nov 2025) and Mewtwo (Mewtwonite X and Y, from 2 Dec 2025) start their side missions ([Serebii Mystery Gift][s-mg]). Garchompite Z from an event portal (from 27 Feb 2026, needs the DLC).
- **Zeraora: unsure.** Gamerant: Side Mission EX3; Bulbapedia: not needed, and Mega Zeraora event-only (snippets); Serebii describes an in-game route ([Serebii legendaries][s-leg]).
- **Ranked Battle Mega Stones:** Greninjite, Delphoxite, Chesnaughtite, Baxcalibrite, Sceptilite, Swampertite, Blazikenite ([Serebii stones][s-stones]; seasons in [Nintendo Life][nl-mega]). Season 9 gave the earlier ones again ([Serebii, 2 April][s-n0204]).
- **Transfer-only forms:** 17 Vivillon patterns, Original Color Magearna, Roaming Gimmighoul ([Serebii transfer-only][s-tro]). Vivillon also by Mystery Gift: a Spewpa with a random one of 16 patterns (29 Oct to 19 Nov 2026, ended) and a Poké Ball Pattern Vivillon (6 Nov 2026 to 26 Feb 2027) ([Serebii Mystery Gift][s-mg]).
- **Trade:** one game, so no version exclusives (inferred). Trade evolutions need a link trade; there is no Linking Cord (guides, [search][g-trade], snippet). Alakazam, Machamp, Gengar and Trevenant are also wild Alphas ([Serebii Alphas][s-alpha]).
- **Without the DLC:** players “can still encounter or obtain the Pokémon added to Mega Dimension via communication features” ([Nintendo][n-upd]). Whether they then register in the Hyperspace Pokédex: **unsure**.

**New Megas (48)** ([Serebii new Megas][s-mega]; [DLC Megas][s-dlcmega]):
- **Base game (26):** Clefable, Victreebel, Starmie, Dragonite, Meganium, Feraligatr, Skarmory, Froslass, Emboar, Excadrill, Scolipede, Scrafty, Eelektross, Chandelure, Chesnaught, Delphox, Greninja, Pyroar, Floette (Eternal Flower only), Malamar, Barbaracle, Dragalge, Hawlucha, Zygarde, Drampa, Falinks.
- **Mega Dimension (22):** Raichu X and Y, Chimecho, Absol Z, Staraptor, Garchomp Z, Lucario Z, Heatran, Darkrai, Golurk, Meowstic, Crabominable, Golisopod, Magearna and Magearna (Original Color), Zeraora, Scovillain, Glimmora, Tatsugiri (Curly, Droopy, Stretchy), Baxcalibur. “These Mega Evolutions can only be obtained if you have the DLC”, unless the stone comes by Ranked Battle or Mystery Gift ([Serebii][s-dlcmega]).
- All 48 X and Y and Omega Ruby and Alpha Sapphire Megas return ([Bulbapedia, Z-A list][b-list], snippet). Mega Rayquaza uses Dragon Ascent, no stone ([Game8][g8-ray], snippet). **92 Mega Stones** and where each comes from: [Serebii][s-stones] (in the JSON).
- PokeAPI has all 48 new Megas (Meowstic twice), but marks them all as from Mega Dimension, even the 26 base-game ones ([PokeAPI][api]).

## 5. Alphas

- They start appearing after the side mission “A Big Ol’ Bunnelby”. They are marked on the status screen, are maximum size, and harder to catch. Some spawns are always Alpha; many others have a 5% to 40% chance ([Serebii Alphas][s-alpha]; [Serebii wild Pokémon][s-wild]).
- **Which can be Alpha:** every species in the game **except 25 legendaries and mythicals** ([Serebii, can’t be Alpha][s-noalpha]): Mewtwo, Latias, Latios, Kyogre, Groudon, Rayquaza, Heatran, Darkrai, Cobalion, Terrakion, Virizion, Keldeo, Meloetta, Genesect, Xerneas, Yveltal, Zygarde, Diancie, Hoopa, Volcanion, Magearna, Marshadow, Zeraora, Meltan, Melmetal. That leaves **339 species** (inferred count).
- **Fixed or random:** Serebii lists **111 species with guaranteed Alpha spawns** in Lumiose: Wild Zones 1 to 20, the districts and Lysandre Labs (the long Wild Zone 20 run is inferred from the page layout). In the JSON as `guaranteed`. Hyperspace Alphas aren’t listed by place; Hyperspace zones have “Catch alpha Pokémon” tasks ([Serebii Hyperspace Lumiose][s-hl]).
- **Shiny Alphas: yes.** Hyperspace zones have a “Catch alpha Shiny Pokémon” task ([Serebii][s-hl]), and guides hunt them in Wild Zone 20 ([VGC, 3 Nov 2025][vgc-alpha]).
- **Pokédex:** no source says it records Alphas: **unsure** (see 2).
- **Alpha gifts:** Alpha Charizard by serial code (9 Dec 2025 to 19 Jan 2026) ([Serebii serial codes][s-code]); Alpha Chikorita, Tepig and Totodile from HOME (see 6).

## 6. Links with Pokémon HOME

- **Linking** is on the Switch version of HOME only ([HOME: move][o-move]; [official news, 27 Feb 2026][o-link]).
- **Which Pokémon move:**
  - Z-A to HOME: yes, and they “cannot be transferred from Pokémon Legends: Z-A to previous titles” ([official][o-link]).
  - HOME to Z-A: only “Pokémon that can appear in those games”. Once moved into Z-A, a Pokémon from an earlier game can no longer go back to earlier games ([official][o-link]). Inferred: they can still go between Z-A, HOME and Pokémon Champions.
  - Forms only by transfer: see 4. Megas can’t be deposited; held items go to the Bag (`../home-tracking.md`, from Serebii and Pokémon Support).
- **What keeps:** HOME “does not overwrite Pokémon data” (Pokémon Support, via `../home-tracking.md`). HOME gives Alpha starters straight into HOME boxes ([Serebii, 2 April][s-n0204]), so Alphas exist in HOME (inferred: Alpha kept). Shiny and form kept: inferred, no Z-A-specific source.
- **Original Color Magearna** put into Z-A can become a Mega Magearna variant, with Magearnite and Mega Dimension ([Nintendo Life, 2 April][nl-home]). It “has its own Pokédex entry” ([Serebii, 2 April][s-n0204]); in Z-A’s Mega Evolution Pokédex the two share one (snippet): **unsure** which Pokédex Serebii means (inferred: HOME’s).
- **HOME’s Z-A Pokédexes:** Lumiose 230, Mega Evolution 93, Hyperspace 131 ([Bulbapedia, Pokédex (HOME)][b-homedex], snippet). Fandom says 232, 72 and 132: **unsure**.
  - Only Pokémon that originate from Z-A count. A Mega entry also needs the linked Z-A save to have that Mega Stone ([Bulbapedia][b-homedex], snippet).
  - Mythicals count only in the Hyperspace (not Zeraora) and Mega Evolution Pokédexes ([Bulbapedia][b-homedex], snippet). So HOME’s Lumiose 230 leaves out Diancie and Mewtwo (inferred, matching the Volcanion rule).
  - Whether HOME’s Z-A Pokédexes record shiny or forms: **unsure**.
- **Gifts:** the first deposit from Z-A unlocks Alpha Chikorita, Tepig and Totodile as Mystery Gifts in HOME’s mobile app ([HOME: move][o-move]). Shiny Volcanion: see 3.
- **Pokémon Champions:** Z-A Pokémon can go there; sending Z-A Chesnaught, Delphox, Greninja or Eternal Flower Floette gives their Mega Stones in Champions ([HOME: move][o-move]).

## 7. Pictures (nothing downloaded)

- **Official Lumiose City map:** on the official site’s Lumiose City page, under “Discover the Map”, with a “See a full view” link. The file is `/images/pages/story-map/lumiose-map-2x.jpg` on legends.pokemon.com ([official Lumiose City page][o-lum], 23 Nov). The page doesn’t say what it shows: **unsure** whether it is the whole city with the Wild Zones.
- **The announcement art:** “Pokemon Legends Z-A Artwork 015 Lumiose City Map”, in RPGFan’s gallery (uploaded February 2024; the thumbnail is 1019 × 720, so about 1.4:1) ([RPGFan][rpgfan]). GamePro says official map art was shown in a Pokémon Presents ([GamePro][gamepro], snippet). It would need cropping for home’s 2:1 plates (inferred).
- **The in-game map** with every Wild Zone: GamesRadar’s, credited to The Pokémon Company and Nintendo ([GamesRadar][gr-map], snippet). A screenshot of the game’s own map, not art (inferred).
- **Hyperspace Lumiose: no map found.** It is “small pockets” entered through Hoopa’s distortions ([Serebii][s-hl]). The official DLC page has two uncaptioned pictures (`/images/dlc/p15_01.jpg`, `p14_02.jpg`), not labelled as maps ([official DLC page][o-dlc]). Serebii’s Pokéarth Lumiose page shows no map picture in its text ([Pokéarth][s-pokearth]).

## Sources

Serebii (Legends: Z-A section):
- Index [s-index]; Lumiose Pokédex [s-lum]; Hyperspace Pokédex [s-hyp]; new Megas [s-mega]; DLC Megas [s-dlcmega]; Mega Stones [s-stones]; Mable’s Research [s-mable]; transfer-only [s-tro]; shiny [s-shiny]; can’t be Alpha [s-noalpha]; Mega Dimension [s-md]; patches [s-patch]: read 22 Nov.
- Alphas [s-alpha] (22 Nov, headings re-read 23 Nov); legendaries [s-leg]; gifts [s-gift]; Mystery Gift [s-mg]; serial codes [s-code]; Hyperspace Lumiose [s-hl]; wild Pokémon [s-wild]; Pokéarth [s-pokearth]: read 23 Nov.
- Serebii news 2 April 2026 [s-n0204] (22 Nov); 27 April 2026 [s-n2704] and event list 721 [s-ev721] (23 Nov).

Official:
- Nintendo, Z-A version history [n-upd] (22 Nov); HOME: moving Pokémon [o-move] (22 Nov).
- Legends: Z-A site: HOME news 27 Feb 2026 [o-link], HOME news 12 Sep 2025 [o-home25], Lumiose City page [o-lum], DLC page [o-dlc] (23 Nov).

Data: PokeAPI CSVs [api] (pokedexes.csv first read 22 Nov; all files 23 Nov); GitHub history [api-git] (23 Nov).

Others, read 23 Nov unless marked: Nintendo Life, 2 April 2026 [nl-home] (22 Nov), 27 April 2026 [nl-volc], Mega guide [nl-mega]; Pokémon Blog [pb-volc]; Gamerant [gr-locks]; RankedBoost [rb-reg]; PokemonDB [pdb-res]; PokéBase [pdb-viv]; VGC [vgc-alpha]; Vice [vice-meow]; All Things How [ath-furfrou]; RPGFan [rpgfan].

Search snippets only (23 Nov unless marked): Bulbapedia [b-megadex] (22 and 23 Nov), [b-lumdex], [b-hydex], [b-homedex] (22 and 23 Nov), [b-gender], [b-title], [b-dist], [b-list] (22 Nov); Game8 [g8-ray] (its pages answer 402 Payment Required); Sportskeeda [ss-datamine]; X post [cbad]; GamePro [gamepro]; GamesRadar [gr-map]; trade-evolution guides [g-trade].

[s-index]: https://www.serebii.net/legendsz-a/
[s-lum]: https://www.serebii.net/legendsz-a/availablepokemon.shtml
[s-hyp]: https://www.serebii.net/legendsz-a/hyperspacepokedex.shtml
[s-mega]: https://www.serebii.net/legendsz-a/megaevolutions.shtml
[s-dlcmega]: https://www.serebii.net/legendsz-a/dlc-megaevolutions.shtml
[s-stones]: https://www.serebii.net/legendsz-a/megastones.shtml
[s-mable]: https://www.serebii.net/legendsz-a/mablesresearch.shtml
[s-tro]: https://www.serebii.net/legendsz-a/transferonly.shtml
[s-shiny]: https://www.serebii.net/legendsz-a/shinypokemon.shtml
[s-alpha]: https://www.serebii.net/legendsz-a/alphapokemon.shtml
[s-noalpha]: https://www.serebii.net/legendsz-a/unobtainablealpha.shtml
[s-md]: https://www.serebii.net/legendsz-a/megadimension.shtml
[s-patch]: https://www.serebii.net/legendsz-a/patch.shtml
[s-leg]: https://www.serebii.net/legendsz-a/legendary.shtml
[s-gift]: https://www.serebii.net/legendsz-a/giftpokemon.shtml
[s-mg]: https://www.serebii.net/legendsz-a/internetevents.shtml
[s-code]: https://www.serebii.net/legendsz-a/serialcode.shtml
[s-hl]: https://www.serebii.net/legendsz-a/hyperspacelumiose.shtml
[s-wild]: https://www.serebii.net/legendsz-a/wildpokemon.shtml
[s-pokearth]: https://www.serebii.net/pokearth/lumiosecity
[s-n0204]: https://www.serebii.net/news/2026/02-April-2026.shtml
[s-n2704]: https://www.serebii.net/news/2026/27-April-2026.shtml
[s-ev721]: https://www.serebii.net/events/dex/721.shtml
[n-upd]: https://en-americas-support.nintendo.com/app/answers/detail/a_id/68626
[o-move]: https://home.pokemon.com/en-us/move/
[o-link]: https://legends.pokemon.com/en-us/news/pokemon-home-connectivity
[o-home25]: https://legends.pokemon.com/en-us/news/pokemon-home
[o-lum]: https://legends.pokemon.com/en-us/story-world/lumiose-city
[o-dlc]: https://legends.pokemon.com/en-us/dlc
[api]: https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/
[api-git]: https://github.com/PokeAPI/pokeapi/commits/master/data/v2/csv/pokemon_dex_numbers.csv
[nl-home]: https://www.nintendolife.com/news/2026/04/pokemon-home-gets-an-alpha-sized-distribution-to-celebrate-legends-z-a-compatibility
[nl-volc]: https://www.nintendolife.com/news/2026/04/completed-legends-z-as-pokedexes-theres-a-shiny-prize-waiting-for-you-in-pokemon-home
[nl-mega]: https://www.nintendolife.com/guides/pokemon-legends-z-a-all-mega-evolutions-and-mega-stone-locations
[pb-volc]: https://pokemonblog.com/2026/04/27/if-you-complete-your-lumiose-pokedex-mega-evolution-pokedex-and-hyperspace-pokedex-in-pokemon-home-youll-receive-shiny-volcanion-in-pokemon-legends-z-a/
[gr-locks]: https://gamerant.com/pokemon-legends-za-shiny-locked-pokemon-plza-mega-dimension/
[rb-reg]: https://rankedboost.com/pokemon/regional-forms/legends-z-a/
[pdb-res]: https://pokemondb.net/legends-z-a/research
[pdb-viv]: https://pokemondb.net/pokebase/435133/how-many-vivillon-patterns-are-available-in-legends-z-a
[vgc-alpha]: https://www.videogameschronicle.com/guide/how-to-shiny-hunt-6-alpha-pokemon-at-once/
[vice-meow]: https://www.vice.com/en/article/pokemon-legends-z-a-dlc-introduces-series-first-multi-gendered-pokemon
[ath-furfrou]: https://allthings.how/pokemon-legends-z-a-furfrou-trims-how-to-unlock-and-change-every-form/
[rpgfan]: https://www.rpgfan.com/gallery/pokemon-legends-z-a-artwork/
[b-megadex]: https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_in_the_Mega_Evolution_Pok%C3%A9dex
[b-lumdex]: https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_Lumiose_Pok%C3%A9dex_number
[b-hydex]: https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_Hyperspace_Pok%C3%A9dex_number
[b-homedex]: https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9dex_(HOME)
[b-gender]: https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_with_gender_differences
[b-title]: https://bulbapedia.bulbagarden.net/wiki/Title_(Legends:_Z-A)
[b-dist]: https://bulbapedia.bulbagarden.net/wiki/List_of_game-based_Pok%C3%A9mon_distributions_in_Generation_IX
[b-list]: https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_in_Pok%C3%A9mon_Legends:_Z-A
[g8-ray]: https://game8.co/games/Pokemon-Legends-Z-A/archives/570525
[ss-datamine]: https://www.sportskeeda.com/pokemon/complete-pokemon-legends-z-a-pokedex
[cbad]: https://x.com/CBADgg/status/2016361010194485269
[gamepro]: https://www.gamepro.de/artikel/pokemon-legenden-z-a-map,3428609.html
[gr-map]: https://www.gamesradar.com/games/pokemon/full-pokemon-legends-z-a-map-and-all-locations
[g-trade]: https://www.dbltap.com/guides/pokemon-legends-za-trade-evolution
