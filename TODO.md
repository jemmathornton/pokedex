# To-do list

Claude’s jobs, and the record of what was decided. Everything waiting on Jemma is on `for-jemma/your-list.md`.

## 9 Nov 2026: started
- Built from her ask: a Pokédex for Pokémon GO first (other games later), with genders, lucky, shiny and 4★; costumes and backgrounds she’ll choose later; backgrounds for the European events she went to (she has been to many European events, none outside Europe). Lucky and shiny tracking first.
- Set up like Jemma’s Library: static site + tools/serve.py on port 8030 (saves ticks), Startup shortcut, app-window shortcuts, weekly backup task, git.
- Data: 1,292 entries (1,208 out in GO) across 1,024 species; 1,126 shinies out; 96 with a different female picture; 326 costumes; 79 European events (research by a helper agent from Serebii, Leek Duck, GO Hub, Dittobase and official posts; 17 species found out since early 2024 with no shiny yet, e.g. Mimikyu, Zeraora, Minior).

## Open
- [ ] Check the taskbar icon once she opens the app: the shortcuts carry the app id `Chrome.localhost_/.Chrome.Default`, the same as the Library’s (different Chrome profile and port). If the two group together or the icon is blurry, read the window’s real id and change it in tools/make_shortcuts.ps1.
- [ ] After 10 Nov: update Night Out London from what actually happened.
- [ ] ESA museum events run until 30 Apr 2027: recheck their background Pokémon then.
- [ ] The 31 forms counted as out with no shiny (import report): fine as far as known; recheck when Leek Duck adds their shinies.
- [ ] Refresh the GO data after each new season or shiny release (tools/import_go.py, fetch_sprites.py, build.py).
- [ ] Later: other games (her call which).
