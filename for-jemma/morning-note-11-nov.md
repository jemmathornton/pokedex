# Good morning (11 Nov 2026)

What happened overnight, shortest first. Nothing touched your ticks: everything that could change them was a proposal, a test on a copy, or waited for you.

## Done
- **Weekly backup is on.** Every Sunday 09:40 it saves the Pokédex and zips it to Documents\PokedexBackups (keeps 8). I ran it once to check: the first backup is there (67.5 MB). Next one: Sunday 15 Nov.
- **Test suite.** 36 tests, about 2 minutes, run with `python -X utf8 tests/run_tests.py`. They open every page in the app (all ~1,000 Pokémon pages), tick boxes, try the filters, search and Quick add, check the data hangs together, and check the server refuses bad saves. They work on a throwaway copy and check your ticks file is untouched afterwards. All pass. While building them I found and fixed a few things in my own work, none affecting you.
- **Backgrounds checked against Dittobase** (the most complete source). Fixed:
  - Madrid 2024: the raid boss was **Pheromosa**, not Stakataka.
  - The right costumes on several backgrounds: Goggles Charmander and Charizard and Captain's Hat Pikachu (Horizons), Ditto's two Pokopia looks, Swim-ring Psyduck (Concierge), Modern Jacket Machamp, Scarf Lapras (Delightful Days), Origin Dialga and Palkia, Dusk Mane Necrozma.
  - Added: Alolan Vulpix (Community Days), the Flabébé colours, Galarian Ponyta, Low Key Toxtricity, Party Hat Bulbasaur, Charmander and Squirtle (Team Yellow), and the raid forms on GO Fest 2026 Global (Origin, Therian, Deoxys forms, Genesect drives).
  - London 2023 and Copenhagen were right.
- **30 more region screenshots** without people (or only tiny ones). They're on each region's **Try a picture** switch, and marked with a green border in `for-jemma/region-banner-options.png`. Johto and Alola are still thin: their games' screenshots are mostly close-ups.
- **Quick add** (new, a trial): in the sidebar under More. Type lines like `25 shiny`, `1-151`, `alolan vulpix lucky, female`, `charizard mega x`. It shows what it would tick, what's already ticked and what can't be, and only ticks when you press the button.

## Ways to get your collection in (my suggestions, from `research/data-input-routes.md`)
No single route gives everything, so the plan is to combine them. Each turns into a **proposal you look over** before anything is ticked.
1. **Calcy IV export** (you have it): swipe through your storage with Calcy's AutoScan on, then Calcy → Scan History → menu → Export. That gives caught, male/female, lucky, 4★, shadow and Dynamax for what you have now. I've built the importer and tested it on a real Calcy export. No shiny, costumes or backgrounds in it, though.
2. **Calcy scans of searches:** search `shiny` in GO and swipe through with Calcy, then the same for `purified` and `gigantamax`. That fills in shiny.
3. **A screen recording of the game's Pokédex:** it has tabs for Shiny, Lucky, Shadow, Purified, Mega, G-Max and 100%, all in number order. A recording of each tab gives what you've *ever* had, including Pokémon traded away. ffmpeg is installed, and I've made a reader that recognises Pokémon from the game's own pictures (86% right on test screens so far, before tuning).
4. **Screenshots for costumes and backgrounds:** search `costume` and screenshot the grid; search `locationbackground` and `specialbackground` and screenshot each Pokémon's page (it shows the date and place).
5. **Quick add** for anything left, or for a batch you know by heart.

**Easiest first step:** one short screen recording of the Pokédex's **Lucky** tab, just Kanto, plus a Calcy export if you've scanned anything before. Copy them into the Pokédex folder's `imports` folder (by cable or Google Drive). Then I can check the reader really works on your phone's screens before you do the rest.

## Decide
- **Region pictures:** pick from `for-jemma/region-banner-options.png` (the green-bordered ones are the new landscapes).
- **Three background questions from the Dittobase check:**
  1. **GO Tour Kalos X:** raid Xerneas, Honedge and the Calem's and Serena's Hat Pikachu could have the X background, whichever version you played (only the guaranteed research Xerneas followed your choice). Add them to X?
  2. **Paris:** the same Paris background was also given at a separate *Pokémon Méga Évolution Paris* event on 13–14 Sep 2025 (Charmander). Did you go to that?
  3. **Evolving:** a background stays when a Pokémon evolves (I added Candela Rapidash that way). Should the backgrounds also list the Pokémon you'd get by evolving (Raichu on LEGO, the Kalos starters' evolutions, Community Day evolutions…)? There are a lot.
- **Tesseract** (a text reader) needs administrator permission, and Windows' prompt was cancelled while you were away. It isn't needed: Windows' own built-in text reading works. So nothing to do unless you'd like it.

## Coming up
See `research/coming-up.md` (still being written when this note was made).
