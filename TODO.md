# To-do list

Claude’s jobs, and the record of what was decided. Everything waiting on Jemma is on `for-jemma/your-list.md`.

## 9 Nov 2026: started
- Built from her ask: a Pokédex for Pokémon GO first (other games later), with genders, lucky, shiny and 4★; costumes and backgrounds she’ll choose later; backgrounds for the European events she went to (she has been to many European events, none outside Europe). Lucky and shiny tracking first.
- Set up like Jemma’s Library: static site + tools/serve.py on port 8030 (saves ticks), Startup shortcut, app-window shortcuts, weekly backup task, git.
- Data: 1,292 entries (1,208 out in GO) across 1,024 species; 1,126 shinies out; 96 with a different female picture; 326 costumes; 79 European events (research by a helper agent from Serebii, Leek Duck, GO Hub, Dittobase and official posts; 17 species found out since early 2024 with no shiny yet, e.g. Mimikyu, Zeraora, Minior).

## 9 Nov, later (her comments)
- One of each gender and one shiny, kept apart: boxes are now ♂, ♀ (Caught for one-gender and genderless), Shiny, Lucky, 4★.
- Genderless, ♂ only and ♀ only are written on each card.
- Forms counted on their own (“forms” next to “Pokémon” in the counts).
- Filters (her pick of three tried in the app): tabs for what she’s working on (Everything, Caught, Male, Female, Forms, Shiny, Lucky, 4★, Shadow, Purified, Dynamax, G-Max), then Still need / Have / All; the cards then show only that box. Her rule: every box is filtered the same way, Male, Female and Forms included; no separate Gender or Forms drop-downs. Cards keep the ♂ ♀ symbols. Later the same evening: a Caught box on every card with ♂ and ♀ beside it (ticking any box ticks Caught too); the Caught and Everything tabs removed (nothing selected = everything); the Forms tab shows just Caught. Regional forms listed under their region, not their species’ generation (Alolan in Alola, Galarian in Galar, Paldean in Paldea); Hisui is its own section between Galar and Paldea, with the Hisuian forms and #899–905 (Wyrdeer to Enamorus, Claude’s suggestion). Still open, her words: unsure how forms should work, as some Pokémon have many.
- Shadow, Purified, Dynamax and Gigantamax added, on the Pokémon Serebii lists for each (448 shadow, 145 Dynamax, 18 G-Max entries).

## 9 Nov, evening (her checks)
- She spotted missing Alolan shadows: Serebii’s Shadow list has no regional forms. Now Dittobase’s data is the main source (regional shadows included), Serebii a second opinion, either saying yes is enough, and shadow carries through evolutions. Result: 488 shadow, 156 Dynamax, 19 Gigantamax entries. The two lists disagreed on about 20 plain shadows (e.g. Kabuto, Poochyena, Seel, Krabby only on Dittobase; Pancham and Pangoro only on Serebii) and some Dynamax (Magikarp, Gyarados, Spheal on Dittobase; Mawile, Drampa on Serebii).
- Out in GO / shiny cross-checked against Dittobase too: Hisuian Zorua and Zoroark now out; Rockruff (Dusk), Poltchageist and Sinistcha shinies now out. Left as they were where Leek Duck says out/shiny and Dittobase doesn’t (e.g. Hisuian Sliggoo and Goodra, Applin line, Snom). Shadow regional forms Dittobase lists as not out yet (Galarian Meowth, Hisuian Growlithe, Paldean Wooper and others) have no Shadow box.
- Forms taken out of the Working on tabs (her point: every tab is a yes/no box, forms are more Pokémon to list).
- Box colours (her picks over several rounds of pictures, for-jemma/box-colours-*.png; final: box-colours-9.png, “Balanced”): white text on every box (never mixed with black), no gender stereotypes (Male green, Female blue-purple), Shiny silver, Lucky gold (not mustard), 4★ pink, Shadow plum, Purified a clear blue, Dynamax and G-Max the game’s dark red-pink (G-Max darker), Caught navy; then evened out in brightness so they sit together. One set for light and dark mode.
- The “not out in GO yet” choice is now a two-way switch (Out in GO | Include not out yet) like Still need / Have / All, side by side on the line under the tabs, both the size of the tabs (her ask: the toggle looked out of place).
- Boxes on a card in themed rows so none sits alone (her point: 4★ was alone): Caught ♂ ♀ · Shiny Lucky 4★ · Shadow Purified · Dynamax G-Max; every box has an icon (her ask: flame Shadow, sun Purified, up-arrows Dynamax, cloud G-Max, Lucide); unticked boxes a soft fill, unavailable ones dashed. Checked: no row wraps on any page at 1280px.
- Clicking anywhere on a card (not on a box or button) ticks Caught, or the selected tab’s box (her ask).
- Card marking (her call): with no tab on, a card you’ve caught gets a border and tint in the caught colour; with a tab on (Shiny, Lucky…), a card gets that box’s colour once that box is ticked. The old gold lucky-only card style is gone.
- Pictures: small ✨ and ♀ buttons flip to the shiny / female look (clicking the picture itself was too hidden, her words); shiny shows by itself if she has it or is on the Shiny tab.
- One card per Pokédex number, as in the game (her ask): a Pokémon with forms (Unown, Spinda, Castform, Vivillon…) shows one card with a “+N forms” button that opens the others after it (dashed cards), each with its own boxes. Regional forms sit on their region’s page and group there like every other form (her point: Paldean Tauros should work like Unown). She didn’t like the expanding or forms showing as ordinary cards: forms inside the card made Unown’s card far too tall and couldn’t be hidden (her words), so now a card has a small “Forms 3/28” button that opens a pop-up with every form as a full card with all its boxes (she wants shiny etc. for each form); closes with ×, a click outside or Esc. The card shows the game’s default form (her word: Unown’s is F; `default` in dex.json, `DEFAULT_FORM` in import_go.py for overrides).
- Genders the game keeps as forms (Meowstic, Indeedee, Pyroar, Frillish, Jellicent, Oinkologne) merged into one entry with ♂ ♀ and a female picture (her point: like Pikachu). Sidebar counts and “shown” count numbers, not forms.
- The “shown” count sits under the Working on label, so the tabs stay on one line.
- Filter bar: tabs with Clear at the end; one line below with Still need / Have / All, a toggle (not a checkbox) for ones not out in GO yet, and how many are shown (her layout).

## Open
- [x] 9 Nov, her ask (“as an app, not browser”): Desktop, Start menu and folder shortcuts made. They run tools/open_app.pyw, which starts the server if needed and then opens the app window, because Windows blocked a Startup-folder server. Opened for her.
- [ ] Check the taskbar icon once she opens the app: the shortcuts carry the app id `Chrome.localhost_/.Chrome.Default`, the same as the Library’s (different Chrome profile and port). If the two group together or the icon is blurry, read the window’s real id and change it in tools/make_shortcuts.ps1.
- [ ] After 10 Nov: update Night Out London from what actually happened.
- [ ] ESA museum events run until 30 Apr 2027: recheck their background Pokémon then.
- [ ] The 31 forms counted as out with no shiny (import report): fine as far as known; recheck when Leek Duck adds their shinies.
- [ ] Refresh the GO data after each new season or shiny release (tools/import_go.py, fetch_sprites.py, build.py).
- [ ] Later: other games (her call which).
- [ ] 9 Nov evening: the server (started by the Desktop shortcut) had stopped once by itself; reopening the shortcut starts it again. Watch for it; if it keeps happening, look in logs/ or ask her about the Startup server (make_shortcuts.ps1 -Startup).
