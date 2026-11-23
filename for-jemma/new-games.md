# Four more games in your Pokédex (23 Nov)

Ideas only: nothing in the Pokédex has changed for these. The research for each game is in `research/games/` (one page each, every fact with its source), and how it would be built is in `research/new-games.md`.

## The idea in short

- **Each game works like HOME:** the same pages and look, its own list of Pokémon and its own ticks file. Your GO and HOME ticks are never touched.
- **Each game shows its own Pokédexes instead of the ten regions**, in the game’s own order and numbers (Galar’s #001 is Grookey), each with its map:

| Game | Its Pokédexes |
|---|---|
| Legends: Arceus | Hisui (242) |
| Legends: Z-A | Lumiose (232), Hyperspace (132, from Mega Dimension), Mega Evolution (93) |
| Violet | Paldea (400), Kitakami (200, The Teal Mask), Blueberry (243, The Indigo Disk) |
| Shield | Galar (400), Isle of Armor (211), Crown Tundra (210) |

- **Each game’s Home:** its totals, then a card for each Pokédex (its map, its numbers and your counts), like your region cards now.
- **Every Pokémon:** all the game’s Pokémon together. A Pokémon’s page shows its number in each of the game’s Pokédexes.
- **Pictures:** the same as now (GO’s, and HOME’s where GO has none).
- **Fast tick:** one Pokédex at a time, in its order.

## The boxes for each game (my suggestion, not decided)

Every game: **Caught, Female, Male, Shiny**, as in GO and HOME. Then what that game has:

| Game | Extra boxes | Why |
|---|---|---|
| Legends: Arceus | **Alpha**, **Complete** (Research Level 10), **Perfect** (every research task) | the game’s Pokédex marks each entry Complete or Perfect; 224 species can be Alpha |
| Legends: Z-A | **Alpha**, **Mega** | its Mega Evolution Pokédex counts a Mega once you have the Pokémon and its Mega Stone; 339 species can be Alpha |
| Violet | none | its Pokédex has nothing more |
| Shield | **Gigantamax** | 32 species; Max Soup gives the Gigantamax Factor |

New boxes (Alpha, Complete, Perfect) would need an icon and a colour: I’d show you the options as a picture first.

## What you’d choose (the first in each list is my suggestion, not decided)

1. **Which games, and which first:**
   - all four, one at a time, Shield first (its Pokédexes and boxes are closest to what’s built)
   - all four, one at a time, the one you play most first
   - only some of them
   - not yet
2. **What “Caught” means in these games:**
   - caught in that game, as its own Pokédex counts it (traded ones count)
   - you have it in that game now, like HOME
3. **Pokémon only in the other version** (34 are Scarlet-only for Violet; 47 Sword-only for Shield):
   - shown and tickable, with a small “Scarlet only” or “Sword only” mark (you need them, by trade, to complete the Pokédex)
   - shown, with a switch to hide them
   - left out
4. **Pokémon a game has outside its Pokédexes** (Violet: the 25 legendaries from Snacksworth, Meloetta and a few more; Shield: the Dynamax Adventure legendaries and Ultra Beasts):
   - left out at first
   - an extra list on the game’s Home, “Also in this game”
   - every Pokémon the game can hold, Pokédex or not
5. **The boxes:**
   - as in the table above
   - only Caught and Shiny
   - as in the table, but Female and Male only where the two look different
6. **Forms:**
   - as in GO and HOME (regional forms are Pokémon of their own, your form-by-form list, the rest one card)
   - only the forms each game’s own Pokédex shows
7. **Switching between six games** (the HOME | GO switch only fits two). I’d build these into the app for you to click through, once you’ve chosen the games:
   - two rows of small game buttons
   - a drop-down under “Jemma’s Pokédex”
   - the games listed in the sidebar
   - only on the All games page
8. **Maps for the Pokédexes:**
   - official maps where there are some, otherwise the game’s main region map
   - the game’s main region map for all its Pokédexes

   Found so far: official maps of the Isle of Armor, the Crown Tundra and Lumiose City; Hisui, Paldea and Galar are already in the Pokédex. None found for Kitakami (only the in-game map), the Blueberry Terarium or Hyperspace Lumiose.

## The steps

1. **You choose** from the lists above.
2. **The first game**, with what every game needs: Pokédexes instead of regions, more than one Pokédex per game, and the six-game switch as a Try switch. *Medium job.*
3. **Each other game:** mostly its data, from the research. *Small to medium job each.*

## Things to know

- PokeAPI’s open tables already have every one of these Pokédexes, in the games’ own order. Only Z-A’s Mega Evolution Pokédex isn’t there: it comes from Serebii.
- Without trading, Violet can fill 377 of Paldea’s 400, and Shield about 371 of Galar’s 400.
- The Shiny Charm comes from completing Paldea (Violet), Galar (Shield), Research Level 10 across the Hisui Pokédex (Legends: Arceus), and Mable’s Research level 50 (Legends: Z-A).
- Some Pokémon can’t be shiny in these games (the starters you’re given, most legendaries, the Paradox Pokémon in Violet). Their Shiny box would show as not possible, as in HOME.
