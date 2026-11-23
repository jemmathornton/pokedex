# Pokémon Shield (with The Isle of Armor and The Crown Tundra)

Research for adding Shield to the Pokédex. Sources were read on **22 and 23 Nov 2026** (each one dated below). Bulbapedia refuses automated reading, so anything from it is from **search snippets only** and says so. “Inferred” marks my own reasoning; “unsure” means the sources disagree or say nothing. The lists are in `../data/games/shield.json`.

## 1. The game’s Pokédexes

Three regional Pokédexes, each numbered from 1, one entry per species (not per form).

| Pokédex | Entries | Needed to complete | Source check |
|---|---|---|---|
| Galar | 400 (#001 Grookey to #400 Eternatus) | 400 | PokeAPI and Serebii agree entry for entry |
| Isle of Armor | 211 (#001 Slowpoke to #211 Zarude) | 210: Zarude isn’t needed | agree |
| Crown Tundra | 210 (#001 Snom to #210 Calyrex) | 210 | agree |

- PokeAPI’s Pokédex ids: 27 galar, 28 isle-of-armor, 29 crown-tundra ([PokeAPI CSVs][api], downloaded 23 Nov). Serebii’s lists ([Galar][s-gdex], [Isle of Armor][s-idex], [Crown Tundra][s-cdex], 22 Nov) match PokeAPI’s numbers and species exactly; the full lists with National Dex numbers are in the JSON.
- Zarude: Bulbapedia, 211 entries “though only 210 are required” ([Isle of Armor Pokédex][b-idex], snippet, 22 Nov). Its Isle of Armor reward is for “all 210” (Bulbapedia [Fields of Honor][b-foh], snippet, 22 Nov).
- The Isle of Armor and Crown Tundra Pokédexes are added when you first reach those areas (Bulbapedia [Rotom Phone][b-rotom], snippet, 23 Nov).
- **Forms are not separate entries.** Each species has one number. Serebii’s pictures show which form the Pokédex lists: the Galarian one for 13 Galar entries (Zigzagoon, Linoone, Meowth, Farfetch’d, Stunfisk, Corsola, Weezing, Yamask, Ponyta, Rapidash, Mr. Mime, Darumaka, Darmanitan), 3 Isle of Armor (Slowpoke, Slowbro, Slowking) and 10 Crown Tundra (Mr. Mime, Zigzagoon, Linoone, Darumaka, Darmanitan, Ponyta, Rapidash, Articuno, Zapdos, Moltres). Marked `"form": "Galarian"` in the JSON.
- **Forms are registered inside the entry.** Bulbapedia: “Some forms that can be registered in the Galar Pokédex” (Gigantamax Rillaboom, Cinderace and Inteleon) only arrived with The Isle of Armor ([Galar Pokédex][b-gdex], snippet, 23 Nov). West Sea Shellos and Gastrodon are the only registrable forms that need HOME (same page, snippet, 22 Nov).
- Whether the in-game Pokédex shows **each** form (Alcremie’s 63, Toxtricity’s two, Urshifu’s two, Indeedee and Meowstic by gender, Pumpkaboo sizes) and how: **unsure**, no source found.

## 2. Shield’s exclusives

From Serebii’s Version Exclusives ([exclusives][s-excl], 22 Nov): **47 rows each side, 45 species and 2 forms** (Basculin’s stripe and Indeedee’s gender), plus Gigantamax raid differences. Serebii’s Dynamax Adventure list marks 8 legendaries “Shield Native” and 8 “Sword Native” ([Dynamax Adventures][s-da], 22 Nov). Forms from the Pokémon pages and Regina’s trades ([Ponyta][s-ponyta], [Darumaka][s-daru], 22 Nov; [in-game trades][s-trade], 23 Nov). The DLC Pokédexes come from comparing the lists (inferred).

**Only in Shield** (Sword needs a trade):
- **Galar (29 species + 2 forms):** Ponyta and Rapidash (Galarian), Corsola (Galarian), Larvitar, Pupitar, Tyranitar, Lotad, Lombre, Ludicolo, Sableye, Lunatone, Croagunk, Toxicroak, Solosis, Duosion, Reuniclus, Vullaby, Mandibuzz, Spritzee, Aromatisse, Goomy, Sliggoo, Goodra, Oranguru, Drampa, Appletun, Cursola, Eiscue, Zamazenta; forms Blue-Striped Basculin and female Indeedee.
- **Isle of Armor (12):** Heracross, Croagunk, Toxicroak, Vullaby, Mandibuzz, Skrelp, Dragalge (“Requires Isle of Armor”), Goomy, Sliggoo, Goodra, Oranguru, Appletun.
- **Crown Tundra (15 + 2 forms):** Ponyta, Rapidash, Kabuto, Kabutops, Larvitar, Pupitar, Tyranitar, Sableye, Gible, Gabite, Garchomp, Solosis, Duosion, Reuniclus, Eiscue; Blue-Striped Basculin, female Indeedee.
- **Dynamax Adventures (no Pokédex):** Lugia, Latias, Kyogre, Palkia, Thundurus, Zekrom, Yveltal, Lunala.
- **Gigantamax raids:** Gengar, Lapras, Appletun.
- **Other forms:** Kantonian Ponyta (Regina’s trade on the Isle of Armor, Shield only; Serebii’s Ponyta page). Johto Corsola: Regina swaps a Galarian Corsola for one, so inferred Shield-only too.

**Only in Sword** (Shield needs a trade):
- **Galar (29 + 2 forms):** Farfetch’d (Galarian), Sirfetch’d, Seedot, Nuzleaf, Shiftry, Mawile, Solrock, Darumaka and Darmanitan (Galarian), Scraggy, Scrafty, Gothita, Gothorita, Gothitelle, Rufflet, Braviary, Deino, Zweilous, Hydreigon, Swirlix, Slurpuff, Passimian, Turtonator, Jangmo-o, Hakamo-o, Kommo-o, Flapple, Stonjourner, Zacian; forms Red-Striped Basculin and male Indeedee.
- **Isle of Armor (12):** Pinsir, Scraggy, Scrafty, Rufflet, Braviary, Clauncher, Clawitzer, Passimian, Jangmo-o, Hakamo-o, Kommo-o, Flapple.
- **Crown Tundra (15 + 2 forms):** Omanyte, Omastar, Mawile, Bagon, Shelgon, Salamence, Darumaka, Darmanitan, Gothita, Gothorita, Gothitelle, Deino, Zweilous, Hydreigon, Stonjourner; Red-Striped Basculin, male Indeedee.
- **Dynamax Adventures:** Ho-Oh, Latios, Groudon, Dialga, Tornadus, Reshiram, Xerneas, Solgaleo.
- **Gigantamax raids:** Machamp, Coalossal, Flapple. Inferred: with Max Soup (Isle of Armor) a Shield Machamp or Coalossal can get the Gigantamax Factor; Flapple can’t without a trade.
- **Other forms:** Unovan Darumaka and Darmanitan (Regina, Sword; Shield “Trade from Pokémon Sword”). Kantonian Farfetch’d needs a Galarian Farfetch’d for Regina, so inferred a trade too.
- **Flapple and Appletun:** the Tart Apple is Sword’s and the Sweet Apple Shield’s ([version differences][s-vmisc], 22 Nov); Serebii’s Flapple page says Shield: “Trade from Sword” ([Flapple][s-flapple], 22 Nov).
- **Indeedee and Basculin, checked 23 Nov (her ask):** Serebii’s Exclusives page lists Indeedee “Male” and Basculin “Red-Striped Form Exclusive” under Sword (Indeedee “Female”, Basculin “Blue-Striped” under Shield); the Basculin page: “Its Red-Striped Form is found in Sword while its Blue-Striped Form is found in Shield”. No source says either can be had in Shield alone: only with a Sword player (a linked Max Raid, or Dynamax Adventures with “the Pokémon … from either game”), and nothing about breeding a male Indeedee. So both stay marked Sword only ([Basculin][s-basculin], [Indeedee][s-indeedee], [exclusives][s-excl], [Dynamax Adventures][s-da2], 23 Nov).
- **Ultra Beasts** (Nihilego, Buzzwole, Pheromosa, Xurkitree, Celesteela, Kartana, Guzzlord, Stakataka, Blacephalon): no version note on Serebii; guides say every Ultra Beast and the other 31 legendaries are in both games, 8 exclusive each side (search snippets, 22 Nov). That matches Serebii’s 47 bosses (38 legendaries, 9 Ultra Beasts).
- **Galarian forms in both games:** Meowth, Slowpoke, Slowbro, Slowking, Weezing, Mr. Mime, Zigzagoon, Linoone, Yamask, Stunfisk, Articuno, Zapdos, Moltres (inferred from the lists).
- **To complete in Shield (inferred):** Galar needs 29 species by trade, Isle of Armor 12, Crown Tundra 15. The Crown Tundra also needs the Calyrex steed and Regi you didn’t choose: Glastrier or Spectrier, and Regieleki or Regidrago (“You can only choose one”, [legendaries][s-leg], 23 Nov).

## 3. What the game records per entry

- **Seen and caught:** the Shiny Charm needs “a full Pokédex” ([Circhester][s-circ], 22 Nov). Guides say that means catching all 400 (search snippets, 22 Nov). That the Pokédex keeps seen apart from caught is inferred (every main game does); no Shield-specific source.
- **Number Battled**, for each species: a row “beneath the Pokémon’s Type, Height, and Weight” ([Nintendo Wire][nw], 15 Nov 2019, read 22 Nov). It counts wild, Max Raid and most Trainer battles, but not link battles, the Battle Tower or Restricted Sparring (Bulbapedia [Shiny Pokémon][b-shiny], snippet, 23 Nov). It raises shiny odds at 1, 50, 100, 200, 300 and 500 ([Serebii shiny][s-shiny], 22 Nov). Nintendo Wire gives different steps (1, 20, 50 … 500), so the exact steps are **unsure**.
- **Forms, including Gigantamax:** registered inside the species’ entry (section 1).
- **Shiny and gender:** whether the in-game Pokédex records them: **unsure** (a PokéBase answer says it shows shinies you’ve seen; community source, 22 Nov).
- **What a collector would tick for Shield** (my suggestion, not decided): Caught for each Pokédex entry, the three Pokédexes kept apart; Shiny; Gigantamax (32 species, 34 looks, all in Shield: section 5); forms where Shield has them (Galarian and other regional forms, Alcremie, Toxtricity, Urshifu, Basculin, Indeedee, Rotom…); ♀/♂ as for GO and HOME. Number Battled is a count, not a tick.

## 4. Completion and rewards

- **Galar (400):** the **Shiny Charm** from the game director in Room 1 of Hotel Ionia, Circhester, “when you have a full Pokédex” ([Circhester][s-circ], 22 Nov). It takes shiny odds from 1 in 4,096 to 1 in 1,365.33, and Dynamax Adventures from 1 in 300 to 1 in 100 ([Serebii shiny][s-shiny], 22 Nov). A **diploma** from the game director: Bulbapedia says the lead developer gives it up to Generation VIII ([Diploma][b-dip], snippet, 22 Nov). Nothing is excluded (inferred: no source lists any).
- **Isle of Armor (210, not Zarude):** from the scientist at the Armor Station, Fields of Honor: a certificate, an Original Style Replica Gold Crown and the **Mark Charm**; one guide adds a Special League Card (search snippets, 22 Nov; Bulbapedia [Fields of Honor][b-foh], snippet). Supercheats says “Train Station”; inferred the same place (the Armor Station is the island’s station).
- **Crown Tundra (210):** from the woman at the Crown Tundra station: a certificate, a League Card with a Crown Tundra logo, an Original Style Replica State Crown, 50 Rare Candies and 3 Gold Bottle Caps ([Nintendo Everything][ne], 25 Oct 2020, read 22 Nov). Serebii: Replica State Crown “From woman in Tundra Station if you complete The Crown Tundra Pokédex” ([Crown Tundra][s-ct], 23 Nov).
- **In Pokémon HOME:** completing all three with Pokémon caught in Sword or Shield gives **Shiny Keldeo** (official [HOME features][o-feat], 23 Nov); Bulbapedia says Zarude is excluded ([Pokédex (HOME)][b-hdex], snippet, 23 Nov).
- Other charms, not Pokédex rewards: Catching Charm from the same game director (condition **unsure**); Oval Charm, defeat Morimoto in Room 2 ([Circhester][s-circ]).

## 5. What can’t be had (in Shield)

**Shiny-locked encounters** ([PokéBase][pb-lock], answer 5 Oct 2023, read 23 Nov; [rotomlabs][rl], 23 Nov; Serebii: no shiny gifts, starters, Type: Null or the Gigantamax Pikachu and Eevee ([shiny][s-shiny])):
- Base game: Grookey, Scorbunny, Sobble, Charmander (gifts; shiny by breeding, inferred), Gigantamax Pikachu and Eevee (gifts), Toxel (gift), Type: Null, Zacian, Zamazenta, Eternatus.
- Isle of Armor: Kubfu (so Urshifu), Bulbasaur and Squirtle (Master Dojo), Porygon (PokéBase), and the Diglett hunter’s gifts: Alolan Meowth, Vulpix, Sandshrew, Raichu, Marowak, Exeggutor and Diglett, Kantonian Slowpoke (Serebii says “Kanto Form”), Rowlet, Litten, Popplio.
- Crown Tundra: Cosmog, Poipole, Keldeo (caught at Ballimere Lake, [Keldeo][s-keldeo], 23 Nov), Galarian Articuno, Zapdos and Moltres, Calyrex, Glastrier, Spectrier.
- **Not locked:** Regirock, Regice, Registeel, Regieleki, Regidrago, Cobalion, Terrakion, Virizion; every Dynamax Adventure legendary ([rotomlabs][rl]). Regigigas: **unsure**.
- **Never shiny anywhere** (Serebii’s HOME list, `research/home-tracking.md`, 22 Nov): Kubfu, Urshifu, Cosmog, Cosmoem, Calyrex, Glastrier, Spectrier, Zarude, Victini, Magearna, Marshadow. Type: Null **unsure**.
- **Shiny by event only:** Zacian and Zamazenta (retail codes, 22 Oct to 18 Nov 2021, [Zacian events][s-ev888], 23 Nov); Galarian Articuno (International Challenge February 2022 entry gift, [events 144][s-ev144], 23 Nov). Serebii’s event pages only show the shiny picture, so “shiny” is inferred from that. Eternatus and Poipole have shiny events (`home-tracking.md`, 22 Nov). Galarian Zapdos and Moltres: **unsure**, not checked.

**Only by Dynamax Adventures** (Max Lair, The Crown Tundra; none are in a regional Pokédex): Articuno, Zapdos, Moltres (Kantonian), Mewtwo, Raikou, Entei, Suicune, Rayquaza, Uxie, Mesprit, Azelf, Heatran, Giratina, Cresselia, Landorus, Kyurem, Zygarde, the four Tapus and Necrozma, the 9 Ultra Beasts, and Shield’s 8 above ([Dynamax Adventures][s-da], 22 Nov). Poipole is a Max Lair gift ([legendaries][s-leg]). Serebii lists 68 Pokémon usable in Shield but in no regional Pokédex, these among them ([Other Available][s-other], 23 Nov).

**Only through HOME or events** ([Transfer Only][s-tro], 23 Nov): Mew, Celebi, Jirachi, Victini, Genesect, Diancie, Volcanion, Magearna (and Original Color), Marshadow, Zeraora, Meltan, Melmetal, seven cap Pikachu, West Sea Shellos and Gastrodon. Zarude came by event (it is #211 but not needed). 234 species can’t be in Sword or Shield at all ([Unavailable][s-unav], 23 Nov).

**Only by trade with Sword:** the 45 species and 2 forms in section 2, and the Gigantamax Flapple.

**Gigantamax** ([Gigantamax][s-gmax], [Max Soup][s-soup], 22 Nov): 34 entries for 32 species (Toxtricity and Urshifu both forms), in the JSON with how each is got.
- Max Soup (Isle of Armor) gives the Factor to any of them except **Melmetal**, which comes only as HOME’s gift for a first GO-to-HOME transfer (Bulbapedia [Gigantamax][b-gmax], snippet, 23 Nov; Serebii “GO to HOME Event Only”).
- Before The Isle of Armor, Meowth, Snorlax and Toxtricity were event-only (Serebii: “Special Event”). Urshifu’s Gigantamax is only by Max Soup (3 Max Mushrooms and 1 Max Honey).
- Shiny Gigantamax: none for Melmetal or Urshifu (`home-tracking.md`).

## 6. Links with Pokémon HOME

- **Moving:** Sword and Shield link with HOME “at will with no restrictions” ([Serebii transfer][s-tr], 23 Nov). Only Pokémon in Sword and Shield can go in: Bulbapedia says the three Pokédexes “as well as a select few” others (search snippet, page not identified, 23 Nov); Serebii’s Other Available (68) and Transfer Only (15) pages list those few. Pokémon from Scarlet and Violet go in only “if they were available in the games”; from Let’s Go it’s one way into Sword and Shield ([Serebii transfer][s-tr]).
- **What keeps:** the Gigantamax Factor (“Yes, Pokémon HOME will recognize a Pokémon’s Gigantamax Factor”, official [Pokémon Support][o-gmax], 22 Nov). HOME “does not overwrite Pokémon data”, so shiny and Dynamax Level stay with the Pokémon ([Pokémon Support][o-display], 22 Nov). HOME blocks Gigantamax Factor Pikachu, Eevee and Meowth from going to Brilliant Diamond and Shining Pearl (`home-tracking.md`).
- **HOME’s Sword and Shield Pokédexes:** Galar, Isle of Armor and Crown Tundra, which “can only register Pokémon caught in those specific games” ([HOME features][o-feat], 23 Nov). Their sizes in HOME: 400 and 210, with the Isle of Armor shown as 210 (Zarude left out) in one snippet: **unsure** whether HOME shows 210 or 211. A HOME update (1.1.1) fixed transferred Pokémon not counting for the Isle of Armor Pokédex in the game ([GameSpot][gs], search snippet, 23 Nov).
- **Inferred for the tracker:** a Pokémon caught in Shield and put in HOME ticks HOME’s National Pokédex and the matching Galar / Isle of Armor / Crown Tundra Pokédex in HOME; a traded Sword exclusive caught in Sword counts there too (caught in “those specific games” means Sword or Shield).

## 7. Pictures (nothing downloaded)

Official map art for banners (headers checked only, 23 Nov):
- **The Isle of Armor:** the official site’s map, `https://swordshield.pokemon.com/assets/img/articles/ex/map_armor_2x.jpg` (JPEG, 134 KB) on [The Isle of Armor page][o-ioa]. The same page has the overview painting `illust_armor_2x.jpg` (428 KB, alt “Isle of Armor”).
- **The Crown Tundra:** `https://swordshield.pokemon.com/assets/img/articles/ex/map_crown_2x.jpg` (118 KB, alt “The Crown Tundra”) on [The Crown Tundra page][o-ct], and the painting `illust_crown_2x.jpg` (355 KB).
- Pixel sizes: not checked (would need the download). From the file sizes they’re probably smaller than the 2,800 px region maps (inferred).
- **Bigger copies:** Bulbagarden Archives has “Crown Tundra artwork.png”, 1,280 × 905, 1.3 MB ([Art from Sword and Shield][b-art], snippet, 23 Nov). Whether it’s the map or the painting: **unsure**; an Isle of Armor match wasn’t found. Serebii has small copies (`/swordshield/isleofarmormap.jpg`, 38 KB; `theisleofarmor.jpg`; `thecrowntundra.jpg`).

## Sources

- PokeAPI CSVs (`pokedexes.csv`, `pokemon_dex_numbers.csv`, `pokemon_species_names.csv`): [api], downloaded 23 Nov 2026
- Serebii, read 22 Nov 2026: Galar, Isle of Armor and Crown Tundra Pokédexes [s-gdex], [s-idex], [s-cdex]; Version Exclusives [s-excl]; version differences [s-vmisc]; Dynamax Adventures Pokémon [s-da]; shiny mechanics [s-shiny]; Gigantamax [s-gmax]; Max Soup [s-soup]; Circhester [s-circ]; Ponyta [s-ponyta]; Darumaka [s-daru]; Flapple [s-flapple]
- Serebii, read 23 Nov 2026: in-game trades [s-trade]; legendaries [s-leg]; Keldeo [s-keldeo]; Crown Tundra [s-ct]; Transfer Only [s-tro]; Other Available [s-other]; Unavailable [s-unav]; HOME transfer [s-tr]; events [s-ev888], [s-ev144]
- Official: HOME features [o-feat] (23 Nov); Pokémon Support [o-gmax], [o-display] (22 Nov); Sword and Shield Expansion Pass pages [o-ioa], [o-ct] (23 Nov)
- Bulbapedia (search snippets only): [b-gdex], [b-idex], [b-foh], [b-rotom], [b-shiny], [b-dip], [b-hdex], [b-gmax], [b-art]
- Others: Nintendo Wire [nw]; Nintendo Everything [ne]; PokéBase [pb-lock]; rotomlabs [rl]; GameSpot [gs]
- Earlier research reused: `research/home-tracking.md` (read 22 Nov 2026)

[api]: https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/
[s-gdex]: https://www.serebii.net/swordshield/galarpokedex.shtml
[s-idex]: https://www.serebii.net/swordshield/isleofarmordex.shtml
[s-cdex]: https://www.serebii.net/swordshield/thecrowntundradex.shtml
[s-excl]: https://www.serebii.net/swordshield/exclusives.shtml
[s-vmisc]: https://www.serebii.net/swordshield/versionmisc.shtml
[s-da]: https://www.serebii.net/swordshield/dynamaxadventurespokemon.shtml
[s-shiny]: https://www.serebii.net/swordshield/shinypokemon.shtml
[s-gmax]: https://www.serebii.net/swordshield/gigantamax.shtml
[s-soup]: https://www.serebii.net/swordshield/maxsoup.shtml
[s-circ]: https://www.serebii.net/pokearth/galar/circhester.shtml
[s-ponyta]: https://www.serebii.net/pokedex-swsh/ponyta/
[s-daru]: https://www.serebii.net/pokedex-swsh/darumaka/
[s-flapple]: https://www.serebii.net/pokedex-swsh/flapple/
[s-trade]: https://www.serebii.net/swordshield/ingametrade.shtml
[s-leg]: https://www.serebii.net/swordshield/legendary.shtml
[s-keldeo]: https://www.serebii.net/pokedex-swsh/keldeo/
[s-ct]: https://www.serebii.net/swordshield/expansionpass/thecrowntundra.shtml
[s-tro]: https://www.serebii.net/swordshield/transferonly.shtml
[s-other]: https://www.serebii.net/swordshield/pokemonnotindex.shtml
[s-unav]: https://www.serebii.net/swordshield/unobtainable.shtml
[s-tr]: https://www.serebii.net/pokemonhome/transfer.shtml
[s-ev888]: https://www.serebii.net/events/dex/888.shtml
[s-ev144]: https://www.serebii.net/events/dex/144.shtml
[o-feat]: https://home.pokemon.com/en-us/features
[o-gmax]: https://support.pokemon.com/hc/en-us/articles/360039030792
[o-display]: https://support.pokemon.com/hc/en-us/articles/7963042951444
[o-ioa]: https://swordshield.pokemon.com/en-gb/expansionpass/the-isle-of-armor/
[o-ct]: https://swordshield.pokemon.com/en-gb/expansionpass/the-crown-tundra/
[b-gdex]: https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_Galar_Pok%C3%A9dex_number
[b-idex]: https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_Isle_of_Armor_Pok%C3%A9dex_number
[b-foh]: https://bulbapedia.bulbagarden.net/wiki/Fields_of_Honor
[b-rotom]: https://bulbapedia.bulbagarden.net/wiki/Rotom_Phone
[b-shiny]: https://bulbapedia.bulbagarden.net/wiki/Shiny_Pok%C3%A9mon
[b-dip]: https://bulbapedia.bulbagarden.net/wiki/Diploma
[b-hdex]: https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9dex_(HOME)
[b-gmax]: https://bulbapedia.bulbagarden.net/wiki/Gigantamax
[b-art]: https://archives.bulbagarden.net/wiki/Category:Art_from_Pok%C3%A9mon_Sword_and_Shield
[nw]: https://nintendowire.com/guides/pokemon-sword-and-shield/shiny-pokemon/
[ne]: https://nintendoeverything.com/pokemon-sword-shield-rewards-for-100-pokedex-completion-in-the-crown-tundra-revealed/
[pb-lock]: https://pokemondb.net/pokebase/329784/what-are-all-the-shiny-locked-pokemon-in-swsh
[rl]: https://rotomlabs.net/guide/crown-tundra-shiny-legendary-hunting
[gs]: https://www.gamespot.com/articles/new-pokemon-home-switch-update-fixes-isle-of-armor/1100-6479226/
[s-basculin]: https://www.serebii.net/pokedex-swsh/basculin/
[s-indeedee]: https://www.serebii.net/pokedex-swsh/indeedee/
[s-da2]: https://www.serebii.net/swordshield/dynamaxadventures.shtml
