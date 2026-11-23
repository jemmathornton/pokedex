# Pokémon Legends: Arceus (for a tracker)

Research for a possible Legends: Arceus side of the Pokédex, next to GO and HOME. Sources were read on **22 and 23 Nov 2026** (each link at the bottom says which). Bulbapedia refuses automated reading, so anything from it is from **search snippets only** and says so. “Inferred” marks my own reasoning; “unsure” means the sources disagree or are silent. The lists are also in `data/games/legends-arceus.json`.

**At a glance:**
- 242 entries, one per species. PokeAPI and Serebii agree on every number and name.
- 224 species can be Alpha; 82 have a fixed Alpha somewhere; 18 (the legendaries and mythicals) never can.
- 18 species are shiny-locked (all legendaries and mythicals), plus Alolan Vulpix and Alolan Ninetales.
- Only Darkrai and Shaymin need something outside the game (another game’s save data). Nothing is trade-only.
- **Unsure:** which entries the Shiny Charm needs (237, 238 or #001–#240, by source), and whether HOME’s Hisui Pokédex needs 238 or all 242.

## 1. The game’s Pokédex

- **The Hisui Pokédex has 242 entries, #001 Rowlet to #242 Darkrai** ([Serebii Hisui Pokédex][s-dex]). The page shows species names only, no forms.
- **PokeAPI has it as pokedex 30, `hisui`**, with 242 rows ([PokeAPI CSVs][pokeapi]). I compared the two lists: the same numbers, the same order, the same National numbers, and (by eye) the same names. No differences.
- **Numbering:** its own order, not National. It starts with the three starters (Rowlet, Cyndaquil, Oshawott and their evolutions), then Bidoof, Starly, Shinx and so on, and ends with the legendaries and mythicals: #225–#234 Uxie to Enamorus, #235 Dialga, #236 Palkia, #237 Giratina, #238 Arceus, #239 Phione, #240 Manaphy, #241 Shaymin, #242 Darkrai ([Serebii Hisui Pokédex][s-dex]).
- **New species:** #899–#905 (Wyrdeer, Kleavor, Ursaluna, Basculegion, Sneasler, Overqwil, Enamorus) ([Serebii Hisui Pokédex][s-dex]).
- **Five mythicals:** Arceus, Phione, Manaphy, Shaymin, Darkrai. So 237 non-mythical ([Serebii shiny][s-shiny], [Serebii Arceus][s-arceus]).

**Forms are not separate entries.** The game’s Pokédex has one entry per species and shows forms inside it:
- L/R switches gender and form; the minus button switches shiny (community answer, 2 Feb 2022) ([PokéBase][pb-shiny]).
- A research task, “Number of different forms obtained”, counts forms (genders included) for 65 species ([Serebii forms task][s-forms]):
  - Unown 28; Rotom 6 (2, 4, 6); Burmy and Wormadam 3 (cloaks); Sneasel 4 (normal and Hisuian, each male and female).
  - Shellos and Gastrodon 2 (West and East Sea); Vulpix and Ninetales 2 (normal and Alolan).
  - 57 species with gender differences, 2 each. PKHeX’s copy of the game’s gender table lists the same 57 ([PKHeX Pokédex code][pkhex-dex]).
- **Hisuian forms:** 16 on Serebii, plus Sneasler and Overqwil as new evolutions ([Serebii Hisuian forms][s-hforms]).
  - For 15 of them only the Hisuian form is in the game: Decidueye, Typhlosion, Samurott, Growlithe, Arcanine, Voltorb, Electrode, Qwilfish, Lilligant, Zorua, Zoroark, Braviary, Sliggoo, Goodra, Avalugg.
  - Basculin is White-Striped only.
  - Sneasel has both forms.
  - Serebii’s Unobtainable list has the normal forms: I checked the rows for Typhlosion, Samurott, Growlithe, Arcanine, Voltorb, Electrode, Qwilfish, Lilligant, Zorua, Zoroark and Basculin (its picture is the Red-Striped one); the rest of that long page was only skimmed ([Serebii unobtainable][s-unob]).
  - PKHeX’s copy of the game’s species table (its “present in game” flag) agrees for all 15, and has no Red- or Blue-Striped Basculin ([PKHeX species table][pkhex-sp]).
- **Other forms in the game** ([Serebii form change][s-fchange]; game data from [PKHeX][pkhex-sp]):
  - Rotom’s five appliances; Burmy and Wormadam cloaks; Cherrim Sunshine (sunny weather only); Shellos and Gastrodon seas.
  - Origin Dialga, Palkia and Giratina; Shaymin Sky; Therian Tornadus, Thundurus, Landorus and Enamorus.
  - Arceus by Plate: the game data has 19 Arceus forms, the 18 types plus “Legend” (the Legend Plate).
  - Basculegion male and female are separate forms.
  - Alolan Vulpix is a gift (below).
- **Not counted as forms** (inferred, from the game data):
  - The Nobles’ “Lord”/“Lady” forms of Kleavor, Arcanine, Electrode, Lilligant and Avalugg (battles only).
  - Mothim’s hidden cloak value.
  - In all, 318 species-forms are in the game data; 311 without these 7 (inferred count).
- **Area lists** (game data, [PKHeX][pkhex-sp]): each species is also in up to five area lists that reuse the Hisui numbers (85, 75, 96, 90 and 91 species).
  - Inferred names, from who is in each: Obsidian Fieldlands, Crimson Mirelands, Cobalt Coastlands, Coronet Highlands, Alabaster Icelands.
  - 26 entries are in none: the starters, Unown, Spiritomb, the fossils, the Porygon line, and the legendaries and mythicals.
  - Whether and how the game shows these lists: **unsure**. They’re in the JSON as `areas`.

## 2. What the game records per entry

- **Research tasks:** each species has its own tasks ([Serebii research tasks][s-tasks]). PKHeX’s copy of the game’s task table has 1 to 9 tasks per entry, 1,611 in all ([PKHeX][pkhex-dex]; count is mine).
  - Kinds: number caught; caught by size (alpha, large, small, heavy, light); caught by time (morning, day, evening, night) or while sleeping, airborne or unnoticed.
  - Also: seen using moves; defeated, and defeated with moves of a type; evolved; given food; stunned; scared with a Scatter Bang; seen using strong or agile style; leaping out of trees or ore; forms obtained; part of Arceus; special tasks.
- **Points:** each step of a task gives 10 points, 20 for tasks marked in red ([Serebii Pokédex rank][s-rank]). Bulbapedia says tasks with two upward arrows give 20 ([research task][b-tasks], snippet).
- **Research Level** goes from 0 (not caught) to 10 ([research task][b-tasks], snippet).
  - In the game data an entry is complete at 100 points ([PKHeX][pkhex-dex]). Inferred: level = points ÷ 10.
  - **Level 10 = “Complete!”; every step of every task done = “Perfect!”** ([research task][b-tasks], snippet). You don’t need every task for level 10.
  - Unown and Arceus reach Perfect at level 10. Bulbapedia says so (snippet), and their tasks total exactly 100 points in the game data ([PKHeX][pkhex-dex]).
- **What level 10 gives:**
  - The entry’s text: in this game the Pokédex entry is only added at research level 10 ([Pokédex entry][b-dexentry], snippet).
  - 100 rank points ([Serebii Pokédex rank][s-rank]).
  - One extra shiny roll for that species; Perfect gives two more ([Serebii shiny][s-shiny]).
- **Seen, caught, shiny, Alpha, gender:** the save keeps, per species and form, “seen in the wild”, “obtained” and “caught in the wild”. Each is split eight ways: male/female × Alpha or not × shiny or not ([PKHeX Pokédex code][pkhex-dex]: `PokedexSaveStatisticsEntry`, `TryGetStatisticsEntry`).
  - It also keeps how many of each species you’ve obtained, and which gender, shiny and Alpha view is chosen.
  - Inferred: the Pokédex can show an Alpha view. I found no other source for that: **unsure**.
- **Size:** the save keeps the smallest and largest height and weight caught, per form ([PKHeX][pkhex-dex]).
  - Heights and weights of gender differences aren’t kept apart, except Basculegion ([form differences][b-forms], snippet).
  - Many species have “large specimen” tasks ([Serebii sizes][s-size]); there are also small, heavy and light tasks ([Serebii research tasks][s-tasks]).
  - Caught Alphas count as large and heavy ([Alpha Pokémon][b-alpha], snippet).
- **What trackers tick:** Pokélab for Legends Arceus has checklists for “Research tasks”, “Pokémon caught”, “Shiny Pokémon”, “Alpha Pokémon”, “Shiny Alpha Pokémon”, “Research level 10”, “Research 100%”, “Path of Solitude” and “Favorite Pokémon” ([App Store][pokelab]). That’s the only tracker I found.
- **My suggestion (not decided):** per entry, Caught, Level 10 (Complete), Perfect, Shiny, Alpha and Shiny Alpha. Add male and female for the 57 gender-difference species, and form by form for Unown, Burmy, Wormadam, Shellos, Gastrodon, Rotom, Sneasel, Vulpix, Ninetales, Basculegion (and the legendary forms, if wanted).

## 3. Completion and rewards

- **Arceus:** “Return having caught all Pokémon (except for Phinoe [sic], Manaphy, Darkrai, Shaymin and Arceus)”. That is 237 caught (my count) ([Serebii Arceus][s-arceus]).
- **Shiny Charm:** Research Level 10 for a set of entries. Which set, **unsure**:
  - Serebii: level 10 “with all 237 non-Mythical Pokémon” ([Serebii shiny][s-shiny]).
  - Bulbapedia: when “Arceus and all non-Mythical species” reach level 10, so 238 ([Pokédex][b-charm], [Galaxy Hall][b-hall], snippets).
  - Thonky: “Research Level 10 with pokémon 001 through 240”, so with Arceus, Phione and Manaphy, but not Shaymin and Darkrai (updated 8 Feb 2022) ([Thonky][thonky]).
  - All agree Shaymin and Darkrai aren’t needed. Arceus is needed in two of three.
  - **Who gives it: unsure.** Cyllene in the Galaxy Hall says Bulbapedia (snippet); Professor Laventon in the Galaxy Hall say Thonky and Screen Rant ([Screen Rant, 24 Mar 2022][sr-charm]).
  - Version 1.1.1 (18 March 2022) “Fixed a glitch where the Shiny Charm would not be given to players under certain conditions” ([Serebii patches][s-patch]).
  - The charm adds 3 rolls ([Serebii shiny][s-shiny]).
- **Shiny odds** ([Serebii shiny][s-shiny]):
  - Base 1/4096; level 10 for that species 2/4096; Perfect 4/4096; with the charm 5/4096 (level 10) or 7/4096 (Perfect).
  - Mass Outbreaks add 25 rolls, up to 32/4096. Massive Mass Outbreaks add 12, up to 19/4096.
- **Ranks:** 0 to 10 stars, up to 60,000 points; ranks raise obedience levels, unlock balls and recipes, and gate the story ([Serebii Pokédex rank][s-rank]).
- **A Perfect Pokédex:** the save has “completed” and “perfect” flags for the whole Pokédex and each area list ([PKHeX][pkhex-dex]). I found no reward for Perfect beyond the per-species shiny boost: **unsure**.
- **In HOME:** completing HOME’s Hisui Pokédex gives a shiny Enamorus (section 6).

## 4. What can’t be had

- **Shiny-locked:** “all Legendary Pokémon and the starters (as gifts) are Shiny Locked” ([Serebii shiny][s-shiny]). From this game on, “all in-game event Pokémon encounters … are programmed to never be Shiny” ([unobtainable shinies][b-lock], snippet).
  - **Whole species (18):** Uxie, Mesprit, Azelf, Heatran, Regigigas, Cresselia, Tornadus, Thundurus, Landorus, Enamorus, Dialga, Palkia, Giratina, Arceus, Phione, Manaphy, Shaymin, Darkrai. The same 18 can’t be Alpha ([Serebii unobtainable Alpha][s-unalpha]).
  - Phione’s respawns “can’t be Alpha or Shiny” ([Serebii legendary][s-legend]).
  - **Starters:** the gifts are locked, but wild starters (Space-time Distortions after the story) can be shiny ([Serebii shiny][s-shiny], [Serebii distortions][s-std], [Screen Rant][sr-lock]). Massive Mass Outbreaks have all three lines too ([Serebii Massive Mass Outbreaks][s-mmo]).
  - **Alolan Vulpix and Alolan Ninetales:** a gift only, so no shiny in the game; a shiny one has to be moved in ([unobtainable shinies][b-lock], snippet).
  - **Unown:** the 28 hidden ones are shiny-locked ([iMore][imore], snippet; Gamepur says the same from players’ reports). After all 28, Unown spawn in the Solaceon Ruins and can be shiny or Alpha ([Serebii Unown][s-unown]; [in-game events][b-events], snippet).
  - **Spiritomb:** the first is neither shiny nor Alpha; later spawns can be either ([in-game events][b-events], snippet).
  - Japan-only event Happiny and Piplup are shiny-locked ([Screen Rant][sr-lock]).
- **Needs other games’ save data** on the same Switch ([Serebii other games][s-other], [Serebii legendary][s-legend]):
  - Darkrai: Brilliant Diamond or Shining Pearl.
  - Shaymin: Sword or Shield.
  - (Also outfits from Let’s Go saves.)
- **Events:** the serial codes gave Clefairy, Hisuian Growlithe, Piplup, Regigigas and Happiny, plus items ([Serebii serial codes][s-serial]). The internet gifts were clothes only ([Serebii internet events][s-inet]). Inferred: no species is event-only.
- **Trade:** none. Kadabra, Machoke, Graveler and Haunter evolve by “the Linking Cord or Trade” ([Serebii evolution][s-evo]). Inferred: one version, so no version exclusives.
- **Gift only:** Alolan Vulpix, from the request “Snow-White Vulpix in the Snow” at Snowfields Camp ([Serebii gifts][s-gift]); Alolan Ninetales by evolving it (inferred).
- **Not in the game at all:** every species outside the Hisui Pokédex, and the Alolan and Galarian forms of Hisui species: Alolan Raichu, Alolan Geodude line, Galarian Ponyta, Rapidash and Mr. Mime ([Serebii unobtainable][s-unob]). Also the normal forms of the 15 Hisuian-only species and Red- and Blue-Striped Basculin (section 1).
- **Rare:** some are found in the wild only in Space-time Distortions (some can also be got by evolving): the Eeveelutions, the fossils, the Porygon line, Magnemite and Magneton, Magmortar, Scizor, Gengar, Sneasel and Weavile, and the starter lines ([Serebii distortions][s-std]). Inferred: that Sneasel is the normal one, as Hisuian Sneasel is wild elsewhere.

## 5. Alphas

- **What they are:** bigger, with red eyes, “denoted by a red symbol when you battle them and in the various menus” ([Serebii Alpha][s-alpha]).
  - The red eyes don’t stay after capture; the Alpha icon shows on the summary screen ([Alpha Pokémon][b-alpha], snippet).
- **Which species: 224**, all but the 18 on Serebii’s Unobtainable Alpha list ([Serebii unobtainable Alpha][s-unalpha]).
  - Alolan Vulpix and Alolan Ninetales are the only other ones that can’t be Alpha ([Alpha Pokémon][b-alpha], snippet).
  - Spiritomb and Unown can be Alpha after their quests (above).
- **Fixed or random:** both.
  - Fixed: 82 species have Alphas in set places, unlocked after each area’s Noble, and back when you return ([Serebii Alpha][s-alpha]).
  - Random: a small chance in normal spawns ([Serebii Alpha][s-alpha]); one at a time in Mass Outbreaks ([Serebii Mass Outbreaks][s-mo]); in a Massive Mass Outbreak’s second wave ([Serebii Massive Mass Outbreaks][s-mmo]).
  - Inferred: evolving an Alpha keeps it Alpha, which covers species that don’t spawn wild.
- **Shiny Alphas:** yes, “if they are not story-related” ([Serebii Alpha][s-alpha]). Alphas from missions are fixed encounters and shiny-locked ([unobtainable shinies][b-lock], snippet).
- **In the Pokédex:**
  - 46 species have the task “Number of alpha specimens caught” ([Serebii Alpha task][s-alphatask]).
  - The save keeps Alpha seen and caught flags and a chosen Alpha view for each entry ([PKHeX][pkhex-dex]). So inferred yes, but **unsure** how the screen shows it.
- **Size:** Alphas are “towering over the standard Pokémon Size range”, from about 20% bigger to over four times ([Serebii sizes][s-size]).

## 6. Links with Pokémon HOME

- **When:**
  - HOME 2.0.0 added “Support for Pokémon Legends: Arceus”, released 17 May 2022 ([Nintendo version history][n-ver]).
  - It was announced 12 May 2022 ([Pokémon press release][o-press]).
  - Serebii dates the starter gift 18 May 2022 ([Serebii HOME gifts][s-homegift]).
  - Moving needs HOME on the Switch (inferred: the press release’s gift is for depositing into “the Nintendo Switch version of Pokémon HOME”) ([Pokémon press release][o-press]).
- **Into the game:** “limited to the Pokémon that appear in those games” ([Pokémon press release][o-press]).
  - Gigantamax Pikachu and Eevee can’t go in ([Serebii HOME transfer][s-hometr]).
  - Moves reset to the game’s own; Pokémon from Sword, Shield, Brilliant Diamond and Shining Pearl arrive in Strange Balls ([Serebii HOME transfer][s-hometr], [Pokémon press release][o-press]).
  - Inferred from the game data ([PKHeX][pkhex-sp]): only the 318 species-forms it has can go in, so not the normal forms of the 15 Hisuian-only species or Red- and Blue-Striped Basculin.
  - Bulbapedia says the game is “compatible with 369 forms” ([availability][b-avail], snippet). It doesn’t match 318 and I can’t see why: **unsure**.
- **Out to HOME:** Pokémon move “at will with few restrictions” ([Serebii HOME transfer][s-hometr]).
  - **Alpha becomes the Alpha Mark**, title “the Former Alpha”, “given to a Pokémon that was an Alpha in Pokémon Legends Arceus” ([Serebii marks][s-marks]). Bulbapedia says it’s given on moving to HOME ([Marks][b-marks], snippet).
  - Alpha size isn’t kept in Scarlet and Violet ([Dot Esports][dot-alpha], snippet).
  - **Shiny and form keep** (inferred; HOME doesn’t rewrite Pokémon).
  - **Origin mark:** the Legends: Arceus mark, all 242 species can have it. Inside Brilliant Diamond, Shining Pearl and Legends: Arceus it shows no mark ([origin mark][b-origin], snippet).
  - HOME shows the Effort Levels of Pokémon from this game ([Pokémon press release][o-press]).
  - Onward moves depend on the other game: Hisuian Growlithe “cannot be transferred to” Brilliant Diamond, Shining Pearl, Sword or Shield ([Pokémon press release][o-press]).
- **HOME’s National Pokédex:** “If a Pokédex entry in Pokémon Legends: Arceus is incomplete, you will not be able to see that Pokémon’s entry in Pokémon HOME” ([Pokémon press release][o-press]). Serebii: entries come “when the Pokédex for that species has hit completion” ([Serebii HOME transfer][s-hometr]).
  - Bulbapedia says depositing registers it as caught even below level 10; only viewing the entry needs level 10 ([Pokémon HOME][b-home], [Pokédex (HOME)][b-homedex], snippets).
  - Registering versus viewing: **unsure**.
- **HOME’s Hisui Pokédex** (a game Pokédex in HOME): 242 entries, and “Only Pokémon originating from the respective game count” ([Dittobase][ditto]).
  - Bulbapedia says only 238 are needed (not Phione, Manaphy, Shaymin, Darkrai) ([Pokédex (HOME)][b-homedex], snippet). Dittobase explains how to get all 242. Whether 238 or 242: **unsure**.
  - **Reward:** a shiny Enamorus by Mystery Gift, from 28 Jan 2025 ([Serebii HOME gifts][s-homegift], [Pokémon news, 28 Jan 2025][o-jan25]). Dittobase: from 9:00 UTC, end date unknown; claim it in the mobile app ([Dittobase][ditto]).
  - HOME challenges: “Fill in your Hisui Pokédex in Pokémon Legends: Arceus!” (a wallpaper), “Register Arceus from Pokémon Legends: Arceus” and “Register Hisuian Decidueye, Hisuian Typhlosion, and Hisuian Samurott” (stickers) ([Serebii challenges][s-chal]).
- **Starter gift:** deposit any Pokémon from the game to get Rowlet, Cyndaquil and Oshawott with maximum Effort Levels ([Pokémon press release][o-press]). Serebii: level 5, male, Hidden Ability in games with Abilities ([Serebii HOME gifts][s-homegift]).

## 7. Pictures (nothing downloaded)

- **PidgiWiki “Hisui - Pokemon Legends Arceus.png”**: the official painted map of Hisui.
  - 5,705 × 3,169 PNG, 33 MB, uploaded 18 Aug 2021; marked “Artwork”, source “Nintendo France” ([PidgiWiki file][pidgi], read through the wiki’s API).
  - The best banner candidate: wide (1.8:1) and large.
  - The Pokédex already has a Hisui map, `site/regions/hisui-map-1.jpg`: 2,800 × 1,555, the same 1.8:1 shape. Inferred: the same painting, scaled down. Its source isn’t recorded in the app.
- **Bulbapedia’s Hisui page** shows “artwork of Hisui” from the game, illustrated by You Iribi ([Hisui][b-hisui], snippet). Not checked whether it’s the same painting.
- **Serebii’s Hisui page** has one map, `https://www.serebii.net/pokearth/hisui.jpg`, with no caption; size not read ([Serebii Hisui region][s-earth]).
- **Bulbagarden Archives**, Game maps category: “Hisui.png” 1,280 × 720 ([Game maps][b-arch], snippet). Inferred from the size: an in-game map screen, small for a banner.
- **Bulbapedia’s area maps** (e.g. “File:Hisui Windswept Run Map.png”) are in-game map screenshots with one place highlighted ([Windswept Run map][b-wsr], snippet). Not banner material.
- The official site’s Story page has scenery but no map ([Legends: Arceus story][o-story]).

## Sources

**Read on 22 Nov 2026**

- s-dex: <https://www.serebii.net/legendsarceus/hisuipokedex.shtml>
- s-tasks: <https://www.serebii.net/legendsarceus/researchtasks.shtml>
- s-rank: <https://www.serebii.net/legendsarceus/pokedexrank.shtml>
- s-unob: <https://www.serebii.net/legendsarceus/unobtainable.shtml>
- s-other: <https://www.serebii.net/legendsarceus/othergames.shtml>
- s-alpha: <https://www.serebii.net/legendsarceus/alphapokemon.shtml>
- s-unalpha: <https://www.serebii.net/legendsarceus/unobtainablealpha.shtml>
- s-mmo: <https://serebii.net/legendsarceus/massivemassoutbreaks.shtml>
- s-size: <https://www.serebii.net/legendsarceus/size.shtml>
- s-arceus: <https://www.serebii.net/legendsarceus/arceus.shtml>
- s-patch: <https://www.serebii.net/legendsarceus/patch.shtml>
- s-forms: <https://www.serebii.net/legendsarceus/researchtasks/formsobtained.shtml>
- s-alphatask: <https://www.serebii.net/legendsarceus/researchtasks/alpha.shtml>
- s-hforms: <https://www.serebii.net/legendsarceus/hisuianforms.shtml>
- s-fchange: <https://www.serebii.net/legendsarceus/formchange.shtml>
- s-hometr: <https://www.serebii.net/pokemonhome/transfer.shtml>
- s-homegift: <https://www.serebii.net/pokemonhome/giftpokemon.shtml>
- o-press: <https://press.pokemon.com/en/releases/NEW-VERSION-OF-POKEMON-HOME-INTRODUCES-MORE-GAME-COMPATIBILITY>
- o-jan25: <https://www.pokemon.com/uk/pokemon-news/complete-pokedexes-to-earn-shiny-enamorus-and-shiny-manaphy-in-pokemon-home>
- thonky: <https://thonky.com/pokemon-legends-arceus/how-to-get-the-shiny-charm>
- sr-charm: <https://screenrant.com/pokemon-legends-arceus-shiny-charm-update-patch-fix/>
- pb-shiny: <https://pokemondb.net/pokebase/403460/why-isnt-my-shiny-shellos-appearing-in-my-pokedex>
- b-tasks: <https://bulbapedia.bulbagarden.net/wiki/Research_task_(Legends:_Arceus)>
- b-charm: <https://bulbapedia.bulbagarden.net/wiki/Pokedex>
- b-hall: <https://bulbapedia.bulbagarden.net/wiki/Galaxy_Hall>
- b-alpha: <https://bulbapedia.bulbagarden.net/wiki/Alpha_Pok%C3%A9mon>
- b-events: <https://bulbapedia.bulbagarden.net/wiki/List_of_in-game_event_Pok%C3%A9mon_(Legends:_Arceus)>
- b-forms: <https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_with_form_differences>
- b-dexentry: <https://bulbapedia.bulbagarden.net/wiki/Dex_entry>
- b-home: <https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_HOME>
- b-homedex: <https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9dex_(HOME)>

**Read on 23 Nov 2026**

- pokeapi: <https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/> (pokedexes.csv, pokemon_dex_numbers.csv, pokemon_species_names.csv; pokemon_dex_numbers.csv last changed 9 Sep 2026)
- s-shiny: <https://www.serebii.net/legendsarceus/shinypokemon.shtml> (also read 22 Nov)
- s-legend: <https://www.serebii.net/legendsarceus/legendary.shtml>
- s-gift: <https://www.serebii.net/legendsarceus/gift.shtml>
- s-unown: <https://www.serebii.net/legendsarceus/unownlocations.shtml>
- s-std: <https://www.serebii.net/legendsarceus/space-timedistortions.shtml>
- s-mo: <https://www.serebii.net/legendsarceus/massoutbreaks.shtml>
- s-serial: <https://www.serebii.net/legendsarceus/serialcode.shtml>
- s-inet: <https://www.serebii.net/legendsarceus/internetevents.shtml>
- s-evo: <https://www.serebii.net/legendsarceus/evolution.shtml>
- s-chal: <https://serebii.net/pokemonhome/challenges.shtml>
- s-marks: <https://www.serebii.net/scarletviolet/marks.shtml>
- s-earth: <https://www.serebii.net/pokearth/hisui/>
- n-ver: <https://en-americas-support.nintendo.com/app/answers/detail/a_id/49104>
- sr-lock: <https://screenrant.com/legends-arceus-shiny-locked-pokemon-legendaries-starters/>
- ditto: <https://dittobase.com/events/mystery-gifts/shiny-enamorus-and-shiny-manaphy-in-pokemon-home>
- pokelab: <https://apps.apple.com/us/app/id1614967174>
- pidgi: <https://www.pidgi.net/wiki/File:Hisui_-_Pokemon_Legends_Arceus.png>
- o-story: <https://legends.arceus.pokemon.com/en-gb/story>
- pkhex-sp: <https://github.com/kwsch/PKHeX/blob/master/PKHeX.Core/Resources/byte/personal/personal_la> (layout in PKHeX.Core/PersonalInfo/Info/PersonalInfo8LA.cs)
- pkhex-dex: <https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Saves/Substructures/Gen8/LA/Pokedex> (with PKHeX.Core/Resources/byte/zukan_research/researchtask_la.pkl; folder last changed 25 May 2025)
- b-lock: <https://bulbapedia.bulbagarden.net/wiki/List_of_unobtainable_Shiny_Pok%C3%A9mon>
- b-marks: <https://bulbapedia.bulbagarden.net/wiki/Marks>
- b-origin: <https://bulbapedia.bulbagarden.net/wiki/Origin_mark>
- b-avail: <https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_availability_(Legends:_Arceus)>
- b-hisui: <https://bulbapedia.bulbagarden.net/wiki/Hisui>
- b-arch: <https://archives.bulbagarden.net/wiki/Category:Game_maps>
- b-wsr: <https://bulbapedia.bulbagarden.net/wiki/File:Hisui_Windswept_Run_Map.png>
- imore: <https://www.imore.com/pokemon-legends-arceus-all-unown-locations>
- dot-alpha: <https://dotesports.com/pokemon/news/pokemon-scarlet-and-violet-players-are-noticing-one-peculiar-thing-about-their-newly-transferred-alpha-pokemon>

All Bulbapedia and Bulbagarden links, and iMore and Dot Esports, are search snippets only. PKHeX is a community save editor: its tables are copies of the game’s own data, and what they mean on screen is inferred.

[s-dex]: https://www.serebii.net/legendsarceus/hisuipokedex.shtml
[s-tasks]: https://www.serebii.net/legendsarceus/researchtasks.shtml
[s-rank]: https://www.serebii.net/legendsarceus/pokedexrank.shtml
[s-unob]: https://www.serebii.net/legendsarceus/unobtainable.shtml
[s-other]: https://www.serebii.net/legendsarceus/othergames.shtml
[s-alpha]: https://www.serebii.net/legendsarceus/alphapokemon.shtml
[s-unalpha]: https://www.serebii.net/legendsarceus/unobtainablealpha.shtml
[s-mmo]: https://serebii.net/legendsarceus/massivemassoutbreaks.shtml
[s-size]: https://www.serebii.net/legendsarceus/size.shtml
[s-arceus]: https://www.serebii.net/legendsarceus/arceus.shtml
[s-patch]: https://www.serebii.net/legendsarceus/patch.shtml
[s-forms]: https://www.serebii.net/legendsarceus/researchtasks/formsobtained.shtml
[s-alphatask]: https://www.serebii.net/legendsarceus/researchtasks/alpha.shtml
[s-hforms]: https://www.serebii.net/legendsarceus/hisuianforms.shtml
[s-fchange]: https://www.serebii.net/legendsarceus/formchange.shtml
[s-hometr]: https://www.serebii.net/pokemonhome/transfer.shtml
[s-homegift]: https://www.serebii.net/pokemonhome/giftpokemon.shtml
[o-press]: https://press.pokemon.com/en/releases/NEW-VERSION-OF-POKEMON-HOME-INTRODUCES-MORE-GAME-COMPATIBILITY
[o-jan25]: https://www.pokemon.com/uk/pokemon-news/complete-pokedexes-to-earn-shiny-enamorus-and-shiny-manaphy-in-pokemon-home
[thonky]: https://thonky.com/pokemon-legends-arceus/how-to-get-the-shiny-charm
[sr-charm]: https://screenrant.com/pokemon-legends-arceus-shiny-charm-update-patch-fix/
[pb-shiny]: https://pokemondb.net/pokebase/403460/why-isnt-my-shiny-shellos-appearing-in-my-pokedex
[b-tasks]: https://bulbapedia.bulbagarden.net/wiki/Research_task_(Legends:_Arceus)
[b-charm]: https://bulbapedia.bulbagarden.net/wiki/Pokedex
[b-hall]: https://bulbapedia.bulbagarden.net/wiki/Galaxy_Hall
[b-alpha]: https://bulbapedia.bulbagarden.net/wiki/Alpha_Pok%C3%A9mon
[b-events]: https://bulbapedia.bulbagarden.net/wiki/List_of_in-game_event_Pok%C3%A9mon_(Legends:_Arceus)
[b-forms]: https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_with_form_differences
[b-dexentry]: https://bulbapedia.bulbagarden.net/wiki/Dex_entry
[b-home]: https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_HOME
[b-homedex]: https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9dex_(HOME)
[pokeapi]: https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/
[s-shiny]: https://www.serebii.net/legendsarceus/shinypokemon.shtml
[s-legend]: https://www.serebii.net/legendsarceus/legendary.shtml
[s-gift]: https://www.serebii.net/legendsarceus/gift.shtml
[s-unown]: https://www.serebii.net/legendsarceus/unownlocations.shtml
[s-std]: https://www.serebii.net/legendsarceus/space-timedistortions.shtml
[s-mo]: https://www.serebii.net/legendsarceus/massoutbreaks.shtml
[s-serial]: https://www.serebii.net/legendsarceus/serialcode.shtml
[s-inet]: https://www.serebii.net/legendsarceus/internetevents.shtml
[s-evo]: https://www.serebii.net/legendsarceus/evolution.shtml
[s-chal]: https://serebii.net/pokemonhome/challenges.shtml
[s-marks]: https://www.serebii.net/scarletviolet/marks.shtml
[s-earth]: https://www.serebii.net/pokearth/hisui/
[n-ver]: https://en-americas-support.nintendo.com/app/answers/detail/a_id/49104
[sr-lock]: https://screenrant.com/legends-arceus-shiny-locked-pokemon-legendaries-starters/
[ditto]: https://dittobase.com/events/mystery-gifts/shiny-enamorus-and-shiny-manaphy-in-pokemon-home
[pokelab]: https://apps.apple.com/us/app/id1614967174
[pidgi]: https://www.pidgi.net/wiki/File:Hisui_-_Pokemon_Legends_Arceus.png
[o-story]: https://legends.arceus.pokemon.com/en-gb/story
[pkhex-sp]: https://github.com/kwsch/PKHeX/blob/master/PKHeX.Core/Resources/byte/personal/personal_la
[pkhex-dex]: https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/Saves/Substructures/Gen8/LA/Pokedex
[b-lock]: https://bulbapedia.bulbagarden.net/wiki/List_of_unobtainable_Shiny_Pok%C3%A9mon
[b-marks]: https://bulbapedia.bulbagarden.net/wiki/Marks
[b-origin]: https://bulbapedia.bulbagarden.net/wiki/Origin_mark
[b-avail]: https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_availability_(Legends:_Arceus)
[b-hisui]: https://bulbapedia.bulbagarden.net/wiki/Hisui
[b-arch]: https://archives.bulbagarden.net/wiki/Category:Game_maps
[b-wsr]: https://bulbapedia.bulbagarden.net/wiki/File:Hisui_Windswept_Run_Map.png
[imore]: https://www.imore.com/pokemon-legends-arceus-all-unown-locations
[dot-alpha]: https://dotesports.com/pokemon/news/pokemon-scarlet-and-violet-players-are-noticing-one-peculiar-thing-about-their-newly-transferred-alpha-pokemon
