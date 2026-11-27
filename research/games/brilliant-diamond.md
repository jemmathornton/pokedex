# Pokémon Brilliant Diamond (for a Brilliant Diamond tracker)

Research for adding Pokémon Brilliant Diamond (Brilliant Diamond and Shining Pearl, Switch, 2021) next to the other games. Sources were read on **27 Nov 2026**. Bulbapedia refuses automated reading, so anything from it is from **search snippets only** and says so. “Inferred” marks my own reasoning; “unsure” means the sources disagree or say nothing. The lists are in `data/games/brilliant-diamond.json`.

## 1. The game’s Pokédexes

- **Two Pokédexes, one entry per species:**
  - **Sinnoh** (the story): **151**, #001 Turtwig to #151 Manaphy, Diamond and Pearl’s list, not Platinum’s 210 ([Serebii Sinnoh][s-sin]).
  - **National** (after the Sinnoh one is seen): **493**, Bulbasaur to Arceus ([Serebii National][s-nat]).
- **The lists come from PokeAPI**: pokedex 5 `original-sinnoh`, which PokeAPI links to the `brilliant-diamond-shining-pearl` version group as well as Diamond and Pearl; pokedex 1 `national`, 1–493 ([PokeAPI][pokeapi]). **The Sinnoh order matches Serebii entry by entry** (only Mime Jr. and Mr. Mime are spelt differently).
- **All 493 are in the National Pokédex**, so no species is in no dex.

## 2. Brilliant Diamond’s exclusives

Serebii lists **37 for each version** ([Serebii exclusives][s-ex]); 7 of each are in the Sinnoh Pokédex, the rest are National only (post-game, mostly the Grand Underground’s hideaways ([Serebii hideaways][s-hide]), inferred; not checked one by one).

**Only in Brilliant Diamond (37):** Caterpie, Metapod, Butterfree, Ekans, Arbok, Growlithe, Arcanine, Seel, Dewgong, Scyther, Electabuzz, **Murkrow**, Gligar, Scizor, Elekid, Raikou, Entei, Suicune, Larvitar, Pupitar, Tyranitar, Ho-Oh, Seedot, Nuzleaf, Shiftry, Mawile, Zangoose, Solrock, Kecleon, **Cranidos, Rampardos, Honchkrow, Stunky, Skuntank**, Electivire, Gliscor, **Dialga** (bold = in the Sinnoh Pokédex).

**Only in Shining Pearl (37):** Weedle, Kakuna, Beedrill, Sandshrew, Sandslash, Vulpix, Ninetales, Slowpoke, Slowbro, Magmar, Pinsir, Articuno, Zapdos, Moltres, Slowking, **Misdreavus**, Teddiursa, Ursaring, Stantler, Magby, Lugia, Lotad, Lombre, Ludicolo, Sableye, Seviper, Lunatone, Bagon, Shelgon, Salamence, **Shieldon, Bastiodon, Mismagius, Glameow, Purugly**, Magmortar, **Palkia**.

- Fossils: the Skull and Armor Fossils are version-only, but “this Pokémon can be obtained natively by trading the fossil over” ([Serebii exclusives][s-ex]).
- Legendaries in Ramanas Park: Raikou, Entei, Suicune and Ho-Oh in Brilliant Diamond; Articuno, Zapdos, Moltres and Lugia in Shining Pearl ([Serebii Ramanas Park][s-ram]).

## 3. Legendary and Mythical Pokémon

- **Story:** Dialga (Spear Pillar). **After Spear Pillar:** Uxie (Lake Acuity), Azelf (Lake Valor), Mesprit (Lake Verity, then roams) ([Serebii legendary][s-leg]).
- **After the National Pokédex:** Heatran (Stark Mountain), Giratina (Turnback Cave), Cresselia (Fullmoon Island, then roams), Regigigas (Snowpoint Temple, woken by the three Regis) ([Serebii legendary][s-leg]).
- **Ramanas Park** (after the Sinnoh Pokédex): Regirock, Regice, Registeel, Latias, Latios, Kyogre, Groudon, Rayquaza, Mewtwo in both; the version legendaries above ([Serebii Ramanas Park][s-ram]).
- **Save data on the Switch:** Mew (Let’s Go save) and Jirachi (Sword or Shield save), gifts in Floaroma Town ([Serebii other games][s-og]); Arceus at the Hall of Origin with the Azure Flute, needing a Legends: Arceus save with its main missions done, the National Pokédex and version 1.3.0 ([official news, 15 Mar 2022][o-arc]; [Serebii legendary][s-leg]).
- **Ended Mystery Gifts:** Manaphy Egg (19 Nov 2021 – 21 Feb 2022), Oak’s Letter for Shaymin (27 Feb – 27 Mar 2022), Member Card for Darkrai (1–30 Apr 2022) ([Serebii internet events][s-ie]). Inferred: a new save now needs HOME for these.

## 4. What can’t be had in Brilliant Diamond alone

- **Transfer only (Serebii): Celebi, Deoxys, Phione, Manaphy** ([Serebii transfer only][s-tr]). Inferred, **unsure**: a HOME Manaphy bred with Ditto gives Phione in the game.
- **Events ended, so HOME only now:** Darkrai, Shaymin (see 3).
- **By trade or HOME:** the 37 Shining Pearl exclusives.
- **HOME rules for BDSP** ([Serebii HOME][s-home]): one of each Legendary or Mythical species can go from a save into HOME; Gigantamax Factor Pikachu, Eevee and Meowth can’t come in; Spinda can’t come in or go out; Nincada only if it came from BDSP.

## 5. Shiny-locked

- Serebii: “all Legendary Pokémon and the starters are not Shiny Locked”; locked are **the gift Mew and Jirachi** and **Mystery Gifts** (so the Manaphy Egg) ([Serebii shiny][s-shiny]).
- **Arceus: unsure.** Serebii’s rule says shinyable and Game8 agrees ([search][g-arc]); a Bulbapedia snippet says Arceus is coded never to be shiny.
- **Darkrai, Shaymin: unsure.** One guide says not locked ([search][g-lock]); Serebii says nothing.
- Shiny Charm (National Pokédex, all but Mythicals) works on eggs, not wild encounters ([Serebii shiny][s-shiny]).

## 6. Forms

- **In the game:** Unown 28 (A–Z, ! and ?, Solaceon Ruins ([Serebii Pokéarth][s-sol])); Burmy and Wormadam 3 cloaks; Shellos and Gastrodon West and East; Rotom 6 (Rotom Catalog); Giratina Origin (Griseous Orb, Ramanas Park); Shaymin Sky (Gracidea); Deoxys 4 (Veilstone meteorites, Deoxys itself from HOME) ([Serebii form change][s-form]; [Serebii Ramanas Park][s-ram]); Arceus 18 (all 17 Plates incl. Pixie in the item list ([Serebii items][s-items])). Castform (4) and Cherrim (2) change in battle only.
- **No regional forms:** Alolan and Galarian forms are on Serebii’s Unobtainable list ([Serebii unobtainable][s-unob]); Hisuian ones can’t be moved in either ([search][g-his], snippet). Origin Dialga and Palkia go back to normal in HOME (guide snippet).
- **Forms only by HOME:** none found. Pikachu caps, Spiky-eared Pichu: **unsure** (no source; inferred not in the game).

## 7. Completion

- **Sinnoh:** seen, not caught; showing it to Professor Rowan gets the National Pokédex from Professor Oak ([Serebii National][s-nat]). Whether #151 Manaphy must be seen: **unsure**.
- **National:** all caught except Mythical Pokémon (inferred 484); Shiny Charm from Ueda and a diploma from Masuda at the Grand Lake hotel ([Serebii National][s-nat]).

## Sources

Read 27 Nov 2026:
- PokeAPI CSVs (downloaded): [pokeapi]
- Serebii: [Sinnoh][s-sin], [National][s-nat], [Other available][s-other] Pokédexes; [Version Exclusives][s-ex]; [Transfer Only][s-tr]; [Unobtainable][s-unob]; [Legendary][s-leg]; [Ramanas Park][s-ram]; [Gifts][s-gift]; [Other games][s-og]; [Internet events][s-ie]; [Shiny][s-shiny]; [Form change][s-form]; [Items][s-items]; [Hideaways][s-hide]; [Solaceon Ruins][s-sol]; [HOME transfer][s-home]
- Official: [Arceus and Darkrai news][o-arc]
- Searches (guide and Bulbapedia snippets): [g-lock], [g-arc], [g-his]

[pokeapi]: https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv
[s-sin]: https://www.serebii.net/brilliantdiamondshiningpearl/sinnohpokedex.shtml
[s-nat]: https://www.serebii.net/brilliantdiamondshiningpearl/nationalpokedex.shtml
[s-other]: https://www.serebii.net/brilliantdiamondshiningpearl/otherpokemon.shtml
[s-ex]: https://www.serebii.net/brilliantdiamondshiningpearl/exclusives.shtml
[s-tr]: https://www.serebii.net/brilliantdiamondshiningpearl/transferonly.shtml
[s-unob]: https://www.serebii.net/brilliantdiamondshiningpearl/unobtainable.shtml
[s-leg]: https://www.serebii.net/brilliantdiamondshiningpearl/legendary.shtml
[s-ram]: https://www.serebii.net/brilliantdiamondshiningpearl/ramanaspark.shtml
[s-gift]: https://www.serebii.net/brilliantdiamondshiningpearl/gift.shtml
[s-og]: https://www.serebii.net/brilliantdiamondshiningpearl/othergames.shtml
[s-ie]: https://www.serebii.net/brilliantdiamondshiningpearl/internetevents.shtml
[s-shiny]: https://www.serebii.net/brilliantdiamondshiningpearl/shinypokemon.shtml
[s-form]: https://www.serebii.net/brilliantdiamondshiningpearl/formchange.shtml
[s-items]: https://www.serebii.net/brilliantdiamondshiningpearl/items.shtml
[s-hide]: https://www.serebii.net/brilliantdiamondshiningpearl/pokemonhideaways.shtml
[s-sol]: https://www.serebii.net/pokearth/sinnoh/solaceonruins.shtml
[s-home]: https://www.serebii.net/pokemonhome/transfer.shtml
[o-arc]: https://www.pokemon.com/uk/pokemon-news/get-arceus-and-darkrai-in-pokemon-brilliant-diamond-and-pokemon-shining-pearl
[g-lock]: https://cyberpost.co/is-anything-shiny-locked-in-bdsp/
[g-arc]: https://game8.co/games/Pokemon-Brilliant-Diamond-Shining-Pearl/archives/348236
[g-his]: https://bulbagarden.net/threads/293006
