# Pokémon Violet (for a Violet tracker)

Research for adding Pokémon Violet (Scarlet and Violet, Switch, 2022, with The Teal Mask and The Indigo Disk) next to GO and HOME. Sources were read on **22 or 23 Nov 2026** (the date is beside each one at the bottom). Bulbapedia refuses automated reading, so anything from it is from **search snippets only** and says so. “Inferred” marks my own reasoning; “unsure” means the sources disagree or say nothing. The lists are in `data/games/violet.json`.

## 1. The game’s Pokédexes

- **Three Pokédexes, one entry per species, numbered from 001 with no gaps:**
  - **Paldea** (base game): **400**, #001 Sprigatito to #400 Miraidon ([Serebii Paldea][s-pal]).
  - **Kitakami** (The Teal Mask, 13 Sep 2023 ([Serebii Teal Mask][s-tm])): **200**, #001 Spinarak to #200 Ogerpon ([Serebii Kitakami][s-kit]).
  - **Blueberry** (The Indigo Disk, 14 Dec 2023 ([press release][gp-id])): **243**, #001 Doduo to #243 Pecharunt; #241 Walking Wake and #242 Iron Leaves sit before it ([Serebii Blueberry][s-bb]).
- **The lists come from PokeAPI** (`pokedexes.csv` ids 31 paldea, 32 kitakami, 33 blueberry; `pokemon_dex_numbers.csv`) ([PokeAPI][pokeapi]). **Counts and order match Serebii exactly**, entry by entry: no differences.
- **Overlap:** 664 different species in the three. Kitakami adds 99 not in Paldea; Blueberry adds 165 not in either (PokeAPI, counted).
- **Forms are not separate entries.** Every list is one row per species ([PokeAPI][pokeapi]; [Serebii][s-pal]). Serebii’s pictures show which form a dex means (e.g. Blueberry #004 Alolan Exeggutor, #146 Hisuian Qwilfish, #157 Alolan Vulpix; Kitakami #115 Sensu Oricorio, #194 White-Striped Basculin, #196 Bloodmoon Ursaluna) ([Serebii Blueberry][s-bb]; [Serebii Kitakami][s-kit]).
  - Inferred: a species in two dexes (Wooper: Paldean in Paldea, Johtonian in Kitakami; Tauros: Paldean in Paldea, Kantonian in Blueberry) is one Pokémon counted in both.
  - Forms inside an entry: from Generation VII on, “a Pokémon’s forms (including Shiny forms and gender differences) that have been encountered can be switched between in the Pokémon’s entry” ([Bulbapedia, form differences][b-forms], snippet). That it works the same in Scarlet and Violet: **inferred, unsure**.
  - Scarlet and Violet is “the first game in which regional forms (and original forms of regional form Pokémon) can be obtained but are not registered in the Pokédex” ([Bulbapedia, Paldea list][b-pal], snippet). Which forms that covers since the DLC: **unsure**.
- **Forms the game has** (Serebii’s form page and the dex pictures; whether the dex shows each one: unsure): Paldean Tauros (Combat, Blaze, Aqua Breed), Squawkabilly (Green, Blue, Yellow, White Plumage), Tatsugiri (Curly, Droopy, Stretchy), Maushold (Family of Three, Four), Dudunsparce (Two-, Three-Segment), Palafin (Zero, Hero), Ogerpon (four masks), Ursaluna (Bloodmoon; the plain one is transfer-only), Terapagos, Rotom (six), Deerling and Sawsbuck (four seasons), Oricorio (four), Minior (cores), Vivillon (patterns) ([Serebii forms][s-forms]). Male and female Oinkologne, Basculegion, Indeedee, Meowstic and Pyroar are separate forms in PokeAPI ([PokeAPI][pokeapi]).

## 2. Violet’s exclusives

Serebii’s exclusives page has **34 for each version** in one list (base game and DLC together) ([Serebii exclusives][s-ex]). The DLC split matches guides ([search, Teal Mask][g-tm]; [search, Indigo Disk][g-id]). “Only in Scarlet” means a Violet player needs a trade, HOME, the Union Circle or another player’s Tera Raid: Serebii says you can get them through the Union Circle “or through Tera Raid Battles” ([Serebii exclusives][s-ex]), and other players “can participate in them and catch them regardless of what game they’re playing” ([Serebii raids][s-raids]).

**Only in Violet (34):**
- Paldea: 0200 Misdreavus, 0429 Mismagius, 0316 Gulpin, 0317 Swalot, 0371 Bagon, 0372 Shelgon, 0373 Salamence, 0692 Clauncher, 0693 Clawitzer, 0766 Passimian, 0875 Eiscue, 0885 Dreepy, 0886 Drakloak, 0887 Dragapult, 0937 Ceruledge, 0990 Iron Treads, 0991 Iron Bundle, 0992 Iron Hands, 0993 Iron Jugulis, 0994 Iron Moth, 0995 Iron Thorns, 1006 Iron Valiant, 1008 Miraidon, and 0128 Tauros (Paldean Aqua Breed).
- Kitakami: 0190 Aipom, 0424 Ambipom, 0877 Morpeko.
- Blueberry: 0027 Sandshrew and 0028 Sandslash (Alolan), 0410 Shieldon, 0411 Bastiodon, 1022 Iron Boulder, 1023 Iron Crown, 1010 Iron Leaves (raid events only, see 5).

**Only in Scarlet (34, not catchable in Violet):**
- Paldea: 0246 Larvitar, 0247 Pupitar, 0248 Tyranitar, 0425 Drifloon, 0426 Drifblim, 0434 Stunky, 0435 Skuntank, 0633 Deino, 0634 Zweilous, 0635 Hydreigon, 0690 Skrelp, 0691 Dragalge, 0765 Oranguru, 0874 Stonjourner, 0936 Armarouge, 0984 Great Tusk, 0985 Scream Tail, 0986 Brute Bonnet, 0987 Flutter Mane, 0988 Slither Wing, 0989 Sandy Shocks, 1005 Roaring Moon, 1007 Koraidon, and 0128 Tauros (Paldean Blaze Breed).
- Kitakami: 0207 Gligar, 0472 Gliscor, 0845 Cramorant.
- Blueberry: 0037 Vulpix and 0038 Ninetales (Alolan), 0408 Cranidos, 0409 Rampardos, 1020 Gouging Fire, 1021 Raging Bolt, 1009 Walking Wake (raid events only).
- Armarouge: Charcadet is in both, but the Auspicious Armor it needs is listed for Scarlet only (Zapapico) ([Serebii item][s-armor]).
- Form only: Combat Breed Tauros is in both. Kantonian Vulpix, Ninetales, Sandshrew and Sandslash are in Kitakami for both versions ([Serebii Kitakami][s-kit]). Inferred, **unsure**: since entries are per species, the Kantonian ones may fill Blueberry’s Vulpix and Sandshrew entries.

**Paradox Pokémon:** Ancient ones are Scarlet’s (0984–0989, 1005, 1009, 1020, 1021); Future ones are Violet’s (0990–0995, 1006, 1010, 1022, 1023) ([Serebii paradox][s-para]; versions from [exclusives][s-ex]). Roaring Moon and Iron Valiant are “found only in a hidden cave in Area Zero near Research Station 3” ([Serebii paradox][s-para]).

**What Violet alone can fill** (inferred from the lists): Paldea 377 of 400, Kitakami 197 of 200, Blueberry 236 of the 240 needed (234 if the Kantonian Vulpix doesn’t count).

## 3. What the game records per entry

- **Seen and caught.** Completion is “seeing and catching the Pokémon, and filling out the volumes in the Pokédex”; rewards count “Pokémon Caught” ([Serebii completion][s-comp]). The list shows caught and seen totals ([Bulbapedia, Pokédex][b-dex], snippet).
- **Look:** the Paldea Pokédex is “a digital bookshelf, with the Pokémon’s entries being books”, an app on the Rotom Phone ([Bulbapedia, Pokédex][b-dex], snippet). Caught Pokémon are shown in a natural scene ([search][g-dex], snippet).
- **Shiny, forms, gender:** viewable inside an entry, if Gen VII’s rule holds (see 1). An SV-only source: **none found, unsure**.
- **Not in the Pokédex** (none of the sources show them there, inferred):
  - **Size:** the Summary “doesn’t list the Pokémon’s size”; a person in Mesagoza checks it, and the biggest and smallest get a mark ([Serebii size][s-size]).
  - **Marks:** 50; they belong to each Pokémon, like ribbons ([Serebii marks][s-marks]).
  - **Tera Type:** no source mentions it in the Pokédex.
- **What to tick (my suggestion, not decided):** Caught, Shiny, Female and Male where the game shows a difference, and each form from 1, the same boxes as HOME. Seen could be a box too, as the game counts it. Marks, size and Tera Type belong to one Pokémon, not the Pokédex.

## 4. Completion and rewards

- **What counts:** “owned” (caught), not seen ([Bulbapedia, Diploma][b-dip], snippet).
  - **Paldea:** all 400. Koraidon is Scarlet’s, so Violet needs a trade for it (inferred from [exclusives][s-ex]).
  - **Kitakami:** all 200 ([Bulbapedia, Diploma][b-dip], snippet), so the Loyal Three and Ogerpon too (inferred).
  - **Blueberry:** 240 of 243. Not needed: **1009 Walking Wake, 1010 Iron Leaves, 1025 Pecharunt** ([Bulbapedia, Blueberry list][b-bb], snippet). Serebii names only Walking Wake and Iron Leaves ([Serebii completion][s-comp]).
  - Mythical Pokémon aren’t needed for a diploma ([Bulbapedia, Mythical][b-myth], snippet).
- **Rewards:**
  - **Paldea:** Jacq’s goals: 30 caught TM057 ×5, 100 Ultra Ball ×20, 200 Quick Ball ×20, **400 Shiny Charm**; Pokédex milestones every 10 from 10 to 400 (items and balls, a Beast Ball at 400) ([Serebii completion][s-comp]). Diploma from **Director Clavell** in the Biology Lab ([Bulbapedia, Diploma][b-dip], snippet).
  - **Kitakami:** milestones every 10 from 90 to 200 (Moon Ball at 200), then **Glimmering Charm** from Jacq at Reveler’s Road ([Serebii completion][s-comp]); diploma from Jacq near Reveler’s Road, east of Mossui Town ([Bulbapedia, Diploma][b-dip], snippet). Rewards below 90: **unsure** (Serebii shows none).
  - **Blueberry:** milestones every 10 from 90 to 240 (Master Ball at 240), then **Mark Charm** from Cyrano at the Academy entrance ([Serebii completion][s-comp]); diploma from Cyrano ([Bulbapedia, Diploma][b-dip], snippet).
- **Shiny Charm:** Jacq gives it at 400 caught, the Paldea dex ([Serebii completion][s-comp]); TheGamer (updated 11 Apr 2023, before the DLC) says the same ([TheGamer][g-charm]). Kitakami and Blueberry aren’t needed (inferred: their rewards are other charms). It gives two extra rolls (3/4096) and doesn’t work on fixed encounters ([Serebii shiny][s-shiny]).

## 5. What can’t be had in Violet

- **Shiny-locked** (PokéBase list, answer last edited 21 Apr 2023 ([PokéBase][pb-lock]); Snacksworth from [Serebii Snacksworth][s-snack]):
  - Base game: Koraidon, Miraidon (both, including the second one), Ting-Lu, Chien-Pao, Wo-Chien, Chi-Yu, Walking Wake, Iron Leaves; the starter gifts (breedable); Artazon’s Sunflora; the Titans; Roaming Gimmighoul.
  - Teal Mask: Bloodmoon Ursaluna, Okidogi, Munkidori, Fezandipiti, Ogerpon; the Turtwig, Chimchar and Piplup gifts; the Hisuian Growlithe gift.
  - Indigo Disk: Gouging Fire, Raging Bolt, Iron Boulder, Iron Crown, Terapagos, Pecharunt, Meloetta, and all 25 from Snacksworth: “These Legendary Pokémon are Shiny Locked” ([Serebii Snacksworth][s-snack]).
  - Gimmighoul: PokéBase says the Roaming form; a Bulbapedia snippet says the Chest form ([search][g-lock]): **unsure**. Serebii lists raids with a shiny Gimmighoul chance in Jun–Jul 2023 and Aug 2024 ([Serebii raid events][s-revents]).
  - **Shinies given by event since:** shiny Rayquaza raid, once per save, 20 Dec 2024 – 5 Jan 2025; shiny Wo-Chien, Chien-Pao, Ting-Lu and Chi-Yu after raid challenges, Jul–Sep 2025 ([Serebii raid events][s-revents]); a shiny Koraidon for Violet by code, 26 Sep – 16 Oct 2025: “a Shiny Koraidon in Pokémon Violet” ([Serebii codes][s-codes]). A Bulbapedia snippet says the code works from 1 Nov 2025 to 31 Jan 2027 ([Bulbapedia, event list][b-events], snippet): which dates are right, **unsure**.
- **Snacksworth (Violet):** solo quests give Lugia, Latias, Kyogre, Cobalion, Terrakion, Virizion, Zekrom, Lunala, Spectrier, plus Articuno, Zapdos, Moltres and Kubfu in both; group quests give Raikou, Entei, Suicune, Ho-Oh, Latios, Groudon, Reshiram, Solgaleo, Glastrier, plus Rayquaza, Kyurem and Necrozma ([Serebii Snacksworth][s-snack]). None are in a Pokédex ([Serebii not in a dex][s-nodex]).
- **Event only:** Walking Wake and Iron Leaves came only from 5-star Tera Raid events (Feb 2023 to 21–27 Feb 2025) ([Serebii raid events][s-revents]); a guide says there’s no way to catch them in The Indigo Disk ([search][g-perrin]). 7-star raids with the Mightiest Mark are events too (the latest listed: Kingambit, 28 Aug – 3 Sep 2026) ([Serebii raid events][s-revents]).
- **Tera Raid only:** no source lists species found only in raids; **unsure**. In practice it is the raid events above (inferred).
- **HOME only (or event):** 41 species: Mewtwo, Mew, Regirock, Regice, Registeel, Jirachi, Deoxys, Uxie, Mesprit, Azelf, Dialga, Palkia, Heatran, Regigigas, Giratina, Cresselia, Phione, Manaphy, Darkrai, Shaymin, Arceus, Tornadus, Thundurus, Landorus, Keldeo, Diancie, Hoopa, Volcanion, Cosmog, Cosmoem, Magearna, Zacian, Zamazenta, Eternatus, Zarude, Regieleki, Regidrago, Calyrex, Wyrdeer, Sneasler, Enamorus; and forms: eight cap Pikachu, Alolan Raichu, Hisuian Voltorb, Electrode, Typhlosion, Sneasel, Samurott, Lilligant, Zorua, Zoroark, Braviary, Sliggoo, Goodra, Avalugg, Decidueye, Galarian Weezing, Articuno, Zapdos, Moltres, Original Color Magearna, Dada Zarude, plain Ursaluna, Roaming Gimmighoul, Poké Ball Vivillon ([Serebii transfer only][s-tr]).
  - Hisuian Growlithe and Arcanine aren’t on that list; Hisuian Growlithe is a Teal Mask gift ([Serebii gifts][s-gift]). Hisuian Arcanine: **unsure** (inferred: by evolving the gift).
- **By trade only:** the 34 Scarlet exclusives (see 2).
- **Not in the game at all:** “292 Pokémon are, at time of writing, unavailable” ([Serebii unobtainable][s-unob]).

## 6. Links with Pokémon HOME

- **Which Pokémon move:** inferred: the **733** species the game has: 664 in its Pokédexes, 28 catchable but in no Pokédex ([Serebii not in a dex][s-nodex]) and 41 transfer-only ([Serebii transfer only][s-tr]). 733 + the 292 unavailable = 1,025, so the lists agree ([Serebii unobtainable][s-unob]). The 292 can’t go into Violet.
- **HOME’s Paldea, Kitakami and Blueberry Pokédexes** are HOME’s own: a game Pokédex “can only register Pokémon caught in those specific games” ([HOME features][o-feat]); “A Game Pokédex only registers Pokémon from that specific game” ([Dittobase][db-mel]).
  - Counts: Paldea 400, Kitakami 200, Blueberry 240 needed; Pecharunt, Walking Wake and Iron Leaves not needed; a Pokémon in two dexes needs registering once ([Dittobase][db-mel]).
  - **Reward: Shiny Meloetta**, in HOME’s mobile app after confirming in its Games tab ([official news, 18 Oct 2024][o-mel]); from 16 Oct 2024, end date unknown ([Dittobase][db-mel]).
- Also in HOME: moves can be changed when bringing a Pokémon into Violet (HOME 3.0.0), and Violet’s Mystery Gifts can be received in the mobile app ([HOME features][o-feat]). HOME’s own shiny and form ticks: see `research/home-tracking.md`.

## 7. Pictures (nothing downloaded)

- **Paldea:** already have one (`site/regions/paldea-map-1.jpg`).
- **Kitakami:** no painted map art found. The nearest is **`Kitakami.png`, 3,400 × 3,400, 4.8 MB**, in Bulbagarden Archives’ “Scarlet and Violet maps” ([search][g-kmap], snippet; the Archives refuse automated reading). Inferred: it is the in-game map, square, so a banner would be a slice. **Unsure** what it looks like.
- **Terarium (Blueberry Academy):** no map file found. Its four biomes: Savanna (south-east), Coastal (north-east), Canyon (south-west), Polar (north-west) ([search][g-tmap], snippet). Serebii’s interactive maps of [Kitakami][s-pek] and the [Terarium][s-pet] don’t show a picture file that could be read.
- **Official art, not maps:** key art for The Teal Mask and The Indigo Disk on the official site (`/_images/news/feb_27/teal_mask_art.jpg` and `indigo_disk_art.jpg`) ([official DLC page][o-dlc]). Not opened; what they show: **unsure**.

## Sources

Read 22 Nov 2026:
- Serebii: [Paldea][s-pal], [Kitakami][s-kit], [Blueberry][s-bb] Pokédexes; [Version Exclusives][s-ex]; [The Teal Mask][s-tm]; [Pokédex Completion][s-comp] (and 23 Nov); [Shiny Pokémon][s-shiny]; [Transfer Only][s-tr] (and 23 Nov); [Paradox][s-para]; [Tera Raid events][s-revents]
- Searches (guides and Bulbapedia snippets): [g-tm], [g-id], [g-charm], [g-lock], [g-dex], [g-perrin]

Read 23 Nov 2026:
- PokeAPI CSVs (downloaded): [pokeapi]
- Serebii: [Not in a Pokédex][s-nodex]; [Unobtainable][s-unob]; [Snacksworth][s-snack]; [Legendary][s-leg]; [Gifts][s-gift]; [Serial codes][s-codes]; [Form changes][s-forms]; [Size][s-size]; [Marks][s-marks]; [Tera Raids][s-raids]; [Auspicious Armor][s-armor]; [Wo-Chien events][s-ev1001]; [Pokéarth Kitakami][s-pek], [Terarium][s-pet]
- Official: [HOME features][o-feat]; [Shiny Meloetta news][o-mel]; [DLC page][o-dlc]; press release [gp-id]
- [Dittobase, Shiny Meloetta][db-mel]; [PokéBase, shiny-locked][pb-lock]
- Bulbapedia (search snippets only): [b-pal], [b-bb], [b-dip], [b-dex], [b-forms], [b-myth], [b-events]; searches [g-kmap], [g-tmap]

[pokeapi]: https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv
[s-pal]: https://www.serebii.net/scarletviolet/paldeapokedex.shtml
[s-kit]: https://www.serebii.net/scarletviolet/kitakamipokedex.shtml
[s-bb]: https://www.serebii.net/scarletviolet/blueberrypokedex.shtml
[s-ex]: https://www.serebii.net/scarletviolet/exclusives.shtml
[s-tm]: https://www.serebii.net/scarletviolet/thehiddentreasureofareazero/thetealmask.shtml
[s-comp]: https://www.serebii.net/scarletviolet/pokedexcompletion.shtml
[s-shiny]: https://www.serebii.net/scarletviolet/shinypokemon.shtml
[s-tr]: https://www.serebii.net/scarletviolet/transferonly.shtml
[s-para]: https://www.serebii.net/scarletviolet/paradoxpokemon.shtml
[s-revents]: https://www.serebii.net/scarletviolet/teraraidbattleevents.shtml
[s-nodex]: https://www.serebii.net/scarletviolet/pokemonnotindex.shtml
[s-unob]: https://www.serebii.net/scarletviolet/unobtainable.shtml
[s-snack]: https://www.serebii.net/scarletviolet/snacksworthlegendary.shtml
[s-leg]: https://www.serebii.net/scarletviolet/legendary.shtml
[s-gift]: https://www.serebii.net/scarletviolet/giftpokemon.shtml
[s-codes]: https://www.serebii.net/scarletviolet/serialcode.shtml
[s-forms]: https://www.serebii.net/scarletviolet/formchange.shtml
[s-size]: https://www.serebii.net/scarletviolet/size.shtml
[s-marks]: https://www.serebii.net/scarletviolet/marks.shtml
[s-raids]: https://www.serebii.net/scarletviolet/teraraidbattles.shtml
[s-armor]: https://www.serebii.net/itemdex/auspiciousarmor.shtml
[s-ev1001]: https://www.serebii.net/events/dex/1001.shtml
[s-pek]: https://www.serebii.net/pokearth/kitakami/
[s-pet]: https://www.serebii.net/pokearth/terarium/
[o-feat]: https://home.pokemon.com/en-us/features
[o-mel]: https://www.pokemon.com/us/pokemon-news/a-new-pokemon-home-update-and-an-opportunity-to-earn-a-shiny-meloetta
[o-dlc]: https://scarletviolet.pokemon.com/en-gb/dlc/
[gp-id]: https://pokemon.gamespress.com/The-Hidden-Treasure-of-Area-Zero-Part-2-The-Indigo-Disk-DLC-for-Pokemo
[db-mel]: https://www.dittobase.com/events/mystery-gifts/shiny-meloetta-in-pokemon-home
[pb-lock]: https://pokemondb.net/pokebase/414543/what-are-all-the-shiny-locked-pokemon-in-scarlet-violet
[b-pal]: https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_Paldea_Pok%C3%A9dex_number
[b-bb]: https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_Blueberry_Pok%C3%A9dex_number
[b-dip]: https://bulbapedia.bulbagarden.net/wiki/Diploma
[b-dex]: https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9dex
[b-forms]: https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_with_form_differences
[b-myth]: https://bulbapedia.bulbagarden.net/wiki/Mythical_Pok%C3%A9mon
[b-events]: https://bulbapedia.bulbagarden.net/wiki/List_of_event_Pok%C3%A9mon_distributions_(Scarlet_and_Violet)
[g-tm]: https://primagames.com/tips/all-version-exclusive-pokemon-in-pokemon-scarlet-and-violet-the-teal-mask-dlc
[g-id]: https://nintendoeverything.com/pokemon-scarlet-and-violet-indigo-disk-exclusives-list/
[g-charm]: https://www.thegamer.com/pokemon-scarlet-violet-shiny-charm-unlock-guide-walkthrough/
[g-lock]: https://bulbapedia.bulbagarden.net/wiki/Shiny_lock
[g-dex]: https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_Paldea_Pok%C3%A9dex_number
[g-perrin]: https://dotesports.com/pokemon/news/can-you-catch-iron-leaves-and-walking-wake-in-the-indigo-disk-dlc-answered
[g-kmap]: https://archives.bulbagarden.net/wiki/Category:Scarlet_and_Violet_maps
[g-tmap]: https://bulbapedia.bulbagarden.net/wiki/Terarium
