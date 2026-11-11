# Getting the collection into the Pokédex without ticking by hand

Researched 10 Nov 2026 for Jemma (Android phone with Calcy IV, Windows laptop). The question was how to fill in about 1,300 entries’ boxes (Caught, ♂, ♀, Shiny, Lucky, 4★, Shadow, Purified, Dynamax, G-Max, Mega) plus costumes and event backgrounds without ticking each one.

Short answer: no single route gives everything. **Calcy IV’s CSV export** covers most boxes for the Pokémon she still has. The **game’s own search strings** fill the gaps (shiny, costumes, backgrounds), and **the game’s Pokédex** covers what she has had in the past. The recommendation and steps are at the end. Effort figures are estimates (suggestions, not measured).

One thing to keep in mind throughout: **storage and the Pokédex answer different questions.** Storage, Calcy and Poke Genie only know the Pokémon she has *now*. The game’s Pokédex records what she has *ever* registered, including Pokémon traded or transferred away. Her ticks mean “I’ve had one”, so the Pokédex is the better record of the past and storage is the better record of the detail (gender, form, background).

## What each route can give

✓ = yes, reliably · ~ = partly or with care · ✗ = no

| Route | Caught | ♂ / ♀ | Shiny | Lucky | 4★ | Shadow | Purified | Dynamax | G-Max | Mega | Costume | Background | Forms (e.g. Alolan Vulpix) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1. Calcy IV CSV (whole storage scanned) | ✓ now | ✓ | ✗ | ✓ | ✓ | ✓ | ~ | ✓ | ~ | ✗ | ✗ | ✗ | ✓ regional; ✗ Pikachu-type forms |
| 1b. Calcy IV scan of a search-filtered list | ✓ | ✓ | ✓ (filter `shiny`) | | | | ✓ (filter `purified`) | | ✓ (filter `gigantamax`) | ~ (`mega1-`) | ~ (filter `costume`, form unclear) | ~ (filter, but not which one) | as row 1 |
| 2. Game Pokédex, screen recording | ✓ ever | ✗ | ✓ ever | ✓ ever | ✓ ever (“100%”) | ✓ ever | ✓ ever | ✗ (no tab) | ✓ ever | ✓ ever | ~ (on each entry’s page) | ✗ | ✗ on the grid (species only) |
| 3. Search strings + screenshots | ✓ now | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ~ | ✓ | ✓ (with date and place) | ~ (by picture) |
| 4a. Poke Genie CSV | ✓ now | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ regional and many others |
| 4b. Data request (GDPR) | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? |
| 4c. Pokémon HOME | ✗ (one-way transfer, loses GO-only details) | | | | | | | | | | | | |

## 1. Calcy IV

### Export

- **It exists and is CSV.** Calcy IV keeps every scan in its *Scan History* and can export the whole history as a CSV file (“export all your pokemon to a csv file”, App Store review; PvP ranks were added to the CSV export in 3.35a, which also added CSV *import* from other sources).
- **On Android:** open the Calcy IV app (not the overlay), go to **Scan History**, open the menu in the top right and choose **Export** (CSV). Android then offers to share or save the file. Send it to the laptop by USB cable (phone in “File transfer” mode), Google Drive or email to herself. I couldn’t reach Calcy IV’s own FAQ (its website no longer resolves and Reddit blocks automated reading), so the menu wording is from memory and should be checked on the phone.
- **Calcy IV is current:** 3.5a came out 24 Oct 2026 (APKMirror). Recent versions added Dynamax support and Scan History filters for Dynamax and Mega (iOS 1.0.18, Oct 2024), improved Gigantamax support (2025) and a “CalcyDex” that marks species she has scanned (3.5, Oct 2026). CalcyDex isn’t an export.

### The CSV’s columns

Found: a **real Calcy IV history export from 18 Sep 2026** (135 rows), published as a test file in the open-source project [pogo-grader](https://github.com/ziajowaty/pogo-grader). The full column list with each field’s meaning is in **`research/data/calcy-iv-export-format.json`**. The header is:

```
Ancestor?,Scan date,Nr,Name,Temp Evo,Gender,Nickname,Level,possibleLevels,CP,HP,Dust cost,min IV%,ØIV%,max IV%,ØATT IV,ØDEF IV,ØHP IV,Unique?,Fast move,Fast move (ID),Special move,Special move (ID),Special move 2,Special move 2 (ID),DPS,LL Rank (min),LL Rank (max),GL Evo,GL Rank (min),GL Rank (max),Box,Custom1,Custom2,Saved,Egg,Lucky?,Favorite,BuddyBoosted,Form,ShadowForm,MultiForm?,Dynamax,Height (cm),Weight (g),Height Tag,Catch Date,Catch Level
```

How each box shows up:

| Box | In the CSV? | How |
|---|---|---|
| Species | ✓ | `Nr` (Pokédex number) and `Name` |
| Regional form | ✓ | Words after the name: `Sandshrew Alolan Shadow` |
| Other forms and costumes | ✗ / unclear | `Form` is **Calcy’s own number**, not the game’s (Froakie is 2352 in Calcy, 3028 in the game files), and no list of them is published. Every Pikachu in the sample has the same number with `MultiForm?` = 1, so Calcy probably can’t tell a costumed Pikachu from a plain one. |
| ♂ / ♀ | ✓ | `Gender`: ♂, ♀, blank for genderless |
| Shiny | **✗** | No column at all |
| Lucky | ✓ | `Lucky?` = 1 |
| 4★ | ✓ | `ØATT IV`, `ØDEF IV`, `ØHP IV` all 15 with `Unique?` = 1. Exact only if she appraised it, or Calcy narrowed it to one combination. |
| Shadow | ✓ | `ShadowForm` = 2, and “Shadow” in `Name` |
| Purified | ~ | `ShadowForm` = 3 according to the pogo-grader parser. The sample has no purified Pokémon, so this isn’t confirmed. |
| Dynamax | ✓ | `Dynamax` = `D` (`-` no, `?` not checked) |
| Gigantamax | ~ | Probably another letter in the `Dynamax` column. Not in the sample, so unconfirmed. |
| Mega | ✗ | Only `Temp Evo` while it is Mega Evolved at scan time (inferred) |
| Background | ✗ | Nothing |
| Catch date | ~ | `Catch Date` (e.g. 2024-02-27), often only the year |
| Place caught | ✗ | Nothing |

Other points:

- **One row per scan, not per Pokémon.** Scanning the same Pokémon twice gives two rows, and Pokémon she has since transferred stay in the history. Rows with `Ancestor?` = 1 aren’t real Pokémon (Calcy’s extra pre-evolution rows) and must be skipped.
- The column set has changed between versions, and an older layout with different names exists (`Lucky`, `Shadow`, `Star`), so an importer should read columns by name.
- Poke Genie’s export (below) is a different format.

### Scanning the whole storage (“batch scan”)

- Calcy IV has no “scan my whole storage” button. Its **AutoScan** scans each Pokémon as its page appears in GO (App Store release notes mention AutoScan repeatedly). So she opens the first Pokémon in a storage list and **swipes sideways through them one by one**, and each is added to the Scan History.
- There are community automations that do the swiping (e.g. an [Automate flow](https://llamalab.com/automate/community/flows/30982) that opens the appraisal and swipes while Calcy scans). **Not recommended:** automatic taps in the game break GO’s terms of play, and the flow is from 2019.
- Reported problem: one iPhone user found AutoScan caught only 157 of 475 Pokémon (App Store review). Swiping slowly and checking the count in Scan History afterwards helps.
- **Effort (estimate):** about 1–2 seconds a swipe, so roughly an hour per 2,000–3,000 Pokémon. It can be split over several sittings because the history keeps everything.
- **Scanning a filtered list is the useful trick:** type `shiny` in GO’s storage search, open the first one and swipe through. Every row scanned in that sitting (by `Scan date`) is a shiny Pokémon with its species, form and gender. The same works for `purified`, `gigantamax`, `mega1-`, `costume`, `locationbackground`, `specialbackground`. This fills the CSV’s missing Shiny column.

## 2. The game’s own Pokédex

What it shows (official help page, now under Scopely, which bought GO in 2025; Pokémon GO Hub on the Feb 2025 redesign):

- **Tabs (“classifications”) since 7 Feb 2025:** Pokémon, Shiny, Lucky, XXL, XXS, G-Max, Mega, Shadow, Purified and 100% (perfect, i.e. 4★). Each is split by region with a progress number (e.g. 140/151) and a *Recently registered* row. There is **no Dynamax tab and no background tab**.
- On a tab, Pokémon she has registered show in colour and the rest as silhouettes. On the main tab, caught = colour, seen = silhouette, never seen = number only.
- **Each Pokémon’s page** shows which classifications that Pokémon can have, greyed out where she hasn’t got one. Since 6 Feb 2025 costumes and event forms are shown on the Pokémon’s own page (Bulbapedia, Event Pokémon), not in a separate tab.
- **Gender:** the Pokédex doesn’t record which genders she has caught for most species. It only shows both looks for species where the female looks different. Not usable for ♂/♀.
- **Forms:** regional forms and costumes sit inside the species’ page, not on the grid. I couldn’t confirm from sources whether the classification marks (shiny, lucky…) are per form or per species.
- The Pokédex search has no `&`, `,` or `!` (Pokémon GO Hub search-strings page).

**Reading a screen recording:** feasible for the grids, and simpler than it sounds. The grid is in Pokédex-number order, so the script doesn’t need to recognise any Pokémon: it only needs to tell colour from silhouette in each cell and count cells. The region totals on each tab give a check (the script’s count must equal, say, 140/151). Reading form-level detail would mean opening ~1,000 pages, which isn’t worth it.

- **Gives:** at species level, ever-registered Caught, Shiny, Lucky, 4★ (100%), Shadow, Purified, Mega (each Mega, X and Y presumably separate), G-Max.
- **Effort (estimate):** 10 tabs × 9 regions of scrolling with Android’s screen recorder (Quick Settings → Screen record), perhaps 20–30 minutes, then copy the videos to the laptop.
- **Risks:** species-level only (Alolan Vulpix and Vulpix share a cell); a frame with a pop-up or a half-loaded row could be misread (the totals catch this); silhouettes on dark backgrounds need testing. **Suggestion:** first send one short recording (e.g. the Lucky tab, Kanto) so Claude can check it works before doing them all.

### Reading the game’s Pokédex: `tools/read_pokedex.py` (prototype, 11 Nov 2026)

What it does: it watches a screen recording (or screenshots) of one Pokédex tab, reads the number on each cell with Windows’ own text reader, and decides for each cell whether the Pokémon is in colour (registered), a silhouette or blank (not). It then checks the picture against the game’s own picture for that number, compares its total with the count the game shows next to the region’s name, and writes a proposal to `imports/pokedex-<tab>-<region>.json` with a line ready for the Quick add page (for example `1-3, 6, 25 shiny`). **It never ticks anything**: she pastes the line into Quick add, looks at the preview, and only then presses the button. It also says how many of them aren’t ticked in the app yet.

**How she’d use it (Android):**

1. Open the screen recorder: swipe down twice from the top of the screen and tap **Screen record** (Samsung: **Screen recorder**). Choose no sound.
2. In GO open the Pokédex, choose the tab along the bottom (start with **Shiny** or **Lucky**), then **Regions** and one region (start with Kanto).
3. Hold still for a second at the top so the region’s name and count are in the video.
4. Scroll down **slowly and steadily with one finger, about two rows a second**, right to the end, so the last row comes up above the round buttons. No flicks: a fast flick blurs the numbers and those cells are missed (missed, not misread). Pausing is fine. Don’t tap a cell (it opens that Pokémon’s page).
5. Stop the recording. One tab and one region per video for now.
6. Copy the video to the laptop (USB cable or Google Drive) into the Pokédex folder’s `imports` folder, and tell Claude which video it is. Claude runs `tools/read_pokedex.py` and shows her what it found.

The printout says how many it found against the game’s own count, and lists any numbers it never saw clearly (“scroll over them again”). If the two counts match, the proposal is complete.

**Footage it was built and measured on:** no video could be downloaded (YouTube asked for a sign-in for every video; Bilibili and Reddit refused too), so it was built on **4 real screenshots of the new Pokédex** from Pokémon GO Hub and Dittobase’s articles about the redesign (Android: Kanto XXS, XXL and G-Max tabs; iPhone: Kanto Pokémon tab), and on a **made-up screen recording** built from the game’s own pictures in the game’s layout (the self-test).

**Accuracy measured:**

- **Real screenshots:** 45 cells read, **45 right**, checked by eye (30 in colour, 12 silhouettes, 3 blank). 10 more cells were skipped on purpose because a round button or the tab bar was over them; in a recording they come into view as the list scrolls. The difference between a silhouette and a real picture is very clear: in every silhouette 0% of the pixels were off its one flat colour, against at least 47% for real pictures, Squirtle on the blue background included. The picture check named the right Pokémon first for all 39 cells it could check (not G-Max: the app has no G-Max pictures). The region (Kanto), the count (“94”, “107”, “151 / 151”) and the tab were read on all of them, except the G-Max count “2” (a single digit wasn’t read).
- **Made-up recording** (15 seconds of the Kanto Shiny tab at 720p with pauses, steady scrolling, fast flicks and a pop-up): 110 of 151 cells read, **all 110 right**. The 41 missed were all during the fast flicks (blurred frames) or under the pop-up, and the printout listed them and said the count didn’t add up yet.
- Not yet tried on a real recording. **Suggestion:** first one short recording (one tab, one region) so the settings can be checked against her phone.

**Where it struggles:**

- **Fast scrolling:** blurred frames can’t be read; those cells are skipped and listed. Slow scrolling fixes it.
- **The round buttons and tab bar** at the bottom cover the last rows on screen; cells there are skipped. The very last row of a region is only read if the list scrolls up far enough (not checked on a real phone yet).
- **Pop-ups** (messages, a page starting to open): a cell with something lying over it is skipped (it checks the background strips either side of each tile).
- **The same Pokémon in many frames:** each number gets one answer, the one most frames agree on; disagreements are listed as unsure.
- **Dark or faint silhouettes:** fine so far (see-through wings, like Beedrill’s, still count as a silhouette), but only seen on light backgrounds.
- **G-Max and Mega:** these tabs only list some Pokémon, so it can’t say which are missing; no picture check for G-Max; whether Mega X and Y are two cells with the same number is untested.
- **Forms:** the grid is one cell per species, so Alolan Vulpix and Vulpix are one answer, as in the game.

## 3. Storage search strings

Official list (Scopely help centre, “Searching and filtering your Pokémon inventory”), with extras from Pokémon GO Hub’s search-strings page:

| Box | Search | Notes |
|---|---|---|
| Shiny | `shiny` | |
| Lucky | `lucky` | |
| 4★ | `4*` | `0*`–`4*` |
| Shadow | `shadow` | |
| Purified | `purified` | |
| Shiny Shadow (bonus box) | `shiny&shadow` | |
| ♂ / ♀ | `male`, `female`, `genderunknown` | Not on the official page; listed by Pokémon GO Hub and others |
| Dynamax | `dynamax` | Pokémon that can Dynamax; `dynamax1`–`3` by Max Moves unlocked. Leaves out Crowned Zacian/Zamazenta and Eternatus. |
| Gigantamax | `gigantamax` | Same pattern |
| Mega | `mega1-` (has been Mega Evolved at least once) | `mega0`–`mega4`. Plain `mega` also matches Meganium and moves like Megahorn. `megaevolve` = has enough energy now. Storage only knows Pokémon she still has: the Mega tab of the Pokédex is better. |
| Costume | `costume` | “Pokémon from Special Events, such as a Halloween costume” |
| Background | `background` (both kinds), `locationbackground` (in-person events), `specialbackground` (global events) | The official page lists `background` and `locationbackground`; `specialbackground` is listed by Pokémon GO Hub and the Fandom wiki |
| Region / regional form | `kanto` … `paldea`, `alola`, `galar`, `hisui`, `paldea` | Regional searches also return that region’s forms |
| Pokédex number | `25`, `1-151` | |

Combining: `&` or `|` = and; `,` `:` `;` = or; `!` = not (e.g. `shiny&!lucky`); `+name` = whole evolution family; `#tag` = her own tags. When `&` and `,` are mixed, the commas are worked out first.

**What it gives:** the filtered storage grid shows each Pokémon’s picture and CP; names may be Calcy nicknames such as “GL 69”, so names can’t be relied on. Ways to read the result:

1. **Scan the filtered list with Calcy** (section 1): best for shiny, purified and Gigantamax.
2. **Screenshots matched to the pictures.** The app already has every game picture, shiny and costume ones included (3,616 files in `site/sprites/`), so the storage grid can be matched picture by picture. Best for **costumes** (Calcy can’t tell them apart): `costume` usually returns a short list. Shiny costumes need the shiny picture set (also there).
3. **Backgrounds:** search `locationbackground`, then `specialbackground`, and screenshot **each Pokémon’s own page**: it shows the background art, the date caught and the place. Date + place match the in-person events in `data/events.json`; date + art match `data/special-backgrounds.json`. A typical player has tens of these, not hundreds, so this is manageable. Neither Calcy nor any other tool records which background a Pokémon has.

**Effort:** a few minutes per search; screenshots by hand (no automatic tapping).
**Risks:** current storage only; picture matching needs the Pokémon facing the same way as the game picture (it does in the storage grid) and can confuse near-identical forms. Anything unsure goes to her to check.

## 4. Other tools

- **Poke Genie** (Android/iOS): exports its scan history as CSV. A real export from Sep 2026 (4,989 rows, from the public project [pokemon-go-collection](https://github.com/stevenfarless/pokemon-go-collection)) has: `Index, Name, Form, Pokemon Number, Gender, CP, HP, Atk IV, Def IV, Sta IV, IV Avg, Level Min, Level Max, Quick Move, Charge Move, Charge Move 2, Scan Date, Original Scan Date, Catch Date, Weight, Height, Lucky, Shadow/Purified, Favorite, Dust`, then PvP rank columns for each league (`Rank % (G)` … `Sha/Pur (L)`) and `Marked for PvP use`. `Form` is written out (Alola, Galar, Hisui, Paldea, Therian, Origin, Mega X, Sunny…), which is better than Calcy’s numbers. `Shadow/Purified`: 1 = Shadow, 2 = Purified. But **no Shiny, Costume, Dynamax or Background**, and Poke Genie needs a screenshot per Pokémon. Not worth switching from Calcy unless Calcy’s forms prove unworkable.
- **Leek Duck’s Shiny Checklist:** it doesn’t read the game. Its ticks are kept in the browser and shared as a link (its page code uses the browser’s storage and a share URL). Only helpful if she has already ticked her shinies there; then Claude could read her share link.
- **Other GO collection trackers** found (pogo-grader, pokemon-go-collection, Oak Coliseum’s inventory importer) all just read a Calcy or Poke Genie CSV. None knows more than those exports. pokemon-go-collection says outright that shiny, costume, background, Dynamax and Gigantamax have to be confirmed by hand.
- **Data request (GDPR):** she can ask for a copy of her data (historically in-game Settings → Help → request my data, or email to Niantic’s privacy address; now Scopely’s privacy policy applies). Replies took 3–4 weeks. Published descriptions mention location history, play time, spending and friends’ names. **None I found confirms a Pokémon-by-Pokémon list with shiny, costume or background.** Too slow and uncertain to plan around. She could ask anyway out of interest.
- **Pokémon HOME:** sending to HOME *removes* the Pokémon from GO for good, and Shadow Pokémon can’t be sent. Not a way to read the collection.
- **Tools that log in to her account or read the game’s servers:** left out. They break GO’s terms and risk a ban. Calcy IV and Poke Genie only read the screen.

## 5. Recommendation

All of this is a suggestion.

1. **Calcy IV whole-storage scan + CSV export** → for what she has now: Caught (form level for regional forms), ♂, ♀, Lucky, 4★, Shadow, Dynamax.
2. **Calcy scans of filtered lists** (`shiny`, `purified`, `gigantamax`) → the boxes the CSV misses.
3. **Pokédex screen recordings** (all 10 tabs) → what she has *had*, at species level: Caught, Shiny, Lucky, 4★, Shadow, Purified, Mega, G-Max. Anything here but not in storage gets a tick on the species’ default form and a note for her to check.
4. **Screenshots** of `costume` (grid) and of each `locationbackground` / `specialbackground` Pokémon’s page → costumes and backgrounds.
5. Claude turns all of it into a **proposed** set of ticks with a review page showing what would be ticked and why. Nothing goes into `data/collection/go.json` until she has looked and said yes (her rule).
6. What’s left is ticked by hand: forms Calcy can’t tell apart, Mega for Pokémon she no longer has.

### Step by step for her

1. **Calcy IV:** check it’s up to date and AutoScan is on (Calcy IV settings).
2. **Whole storage:** in GO, sort storage by Pokédex number, open the first Pokémon and swipe through slowly. Breaks are fine. Afterwards, check the count in Calcy’s Scan History roughly matches her storage count.
3. **Filtered lists:** in GO search type `shiny`, open the first one and swipe through all. Note the time she started. Repeat for `purified` and `gigantamax`, noting each start time (or send each export separately).
4. **Export:** Calcy IV → Scan History → menu → Export (CSV). Copy the file to the laptop (USB cable or Google Drive) into `imports/` in the Pokédex folder. Tell Claude the start times from step 3.
5. **Pokédex:** start the phone’s screen recorder. Open the Pokédex, choose a tab, scroll steadily through every region, then the next tab, until all 10 are done. Copy the video(s) to the laptop. (First time: just one tab and region, so Claude can check it reads correctly.)
6. **Costumes:** search `costume` and screenshot the grid, scrolling until the end.
7. **Backgrounds:** search `locationbackground`, open each Pokémon and screenshot its page (background, date and place showing). Then the same for `specialbackground`.
8. Claude makes the proposed ticks and a review page; she looks and says yes or changes things.

Total effort for her (estimate): an hour or two of swiping for the storage scan depending on storage size, plus about 30–45 minutes for the rest, against ticking ~1,300 entries × several boxes by hand.

### Accuracy risks to watch

- **Shiny comes only from the `shiny`-filtered scan:** if a Pokémon is missed while swiping, it’s missed. The Pokédex Shiny tab catches species-level gaps.
- **Calcy forms:** regional forms are reliable, but Calcy can’t name forms like costumed Pikachu, Unown letters or Vivillon patterns (`MultiForm?` = 1). Those go to her as a list to check.
- **Purified = 3 and the Gigantamax letter** aren’t confirmed. Check with one Purified and one Gigantamax Pokémon scanned on purpose.
- **4★ needs exact IVs:** Calcy only knows exactly when it narrowed to one combination (usually after appraisal). Cross-check with GO’s `4*` search and the Pokédex 100% tab.
- **Storage vs Pokédex disagree by design:** the Pokédex includes Pokémon traded away; storage doesn’t. Both feed the proposal; where only the Pokédex knows, she confirms.
- **Duplicates and old scans** in Calcy’s history are harmless: any row is enough for a tick.

## Sources

- Real Calcy IV export (18 Sep 2026) and parser: [pogo-grader fixtures/history-calcy.csv](https://github.com/ziajowaty/pogo-grader/blob/main/fixtures/history-calcy.csv), [src/parseCsv.ts](https://github.com/ziajowaty/pogo-grader/blob/main/src/parseCsv.ts)
- Real Poke Genie export (6 Sep 2026): [stevenfarless/pokemon-go-collection](https://github.com/stevenfarless/pokemon-go-collection)
- Calcy IV release notes: [APKMirror Calcy IV versions](https://www.apkmirror.com/apk/tesmath/calcy-iv/), [3.35a](https://www.apkmirror.com/apk/tesmath/calcy-iv/calcy-iv-3-35a-release/), [3.5](https://www.apkmirror.com/apk/tesmath/calcy-iv/calcy-iv-fast-iv-pvp-ranks-3-5-release/); [App Store listing and version history](https://apps.apple.com/us/app/calcy-iv-fast-iv-pvp-ranks/id1526882812); [App Store reviews](https://apps.apple.com/us/app/calcy-iv-fast-iv-pvp-ranks/id1526882812?see-all=reviews&platform=iphone)
- Calcy IV auto-swipe flow (not recommended): [Automate community flow 30982](https://llamalab.com/automate/community/flows/30982)
- Official search terms: [Scopely help: Searching and filtering your Pokémon inventory](https://scopelyexplore.helpshift.com/hc/faq/1126-searching-filtering-your-pokemon-inventory/)
- Official Pokédex help: [Scopely help: Viewing the Pokédex](https://scopelyexplore.helpshift.com/hc/faq/1089-viewing-the-pokedex/)
- Search strings in detail: [Pokémon GO Hub search strings](https://db.pokemongohub.net/tools/search-strings), [euphonic.dev search terms](https://euphonic.dev/pokemon-go/search-terms/), [Fandom: Pokémon search](https://pokemongo.fandom.com/wiki/Pok%C3%A9mon_search)
- Pokédex redesign: [Pokémon GO Hub, 7 Feb 2025](https://pokemongohub.net/post/news/new-pokemon-go-pokedex-update-live/); [Bulbapedia: Event Pokémon (GO)](https://bulbapedia.bulbagarden.net/wiki/Event_Pok%C3%A9mon_(GO))
- Oak Coliseum CSV import guide: [oakcoliseum.com/csv-help](https://oakcoliseum.com/csv-help)
- Leek Duck Shiny Checklist: [leekduck.com/shiny](https://leekduck.com/shiny/)
- Data requests: [Queen Mary University of London, how to request your data from Niantic](https://gamedd.eecs.qmul.ac.uk/donate); [Scopely privacy policy](https://explore.scopely.com/privacy)
- Game form ids compared against: `imports/go-2026-11-09/pogo-protos.d.ts` (this project)
