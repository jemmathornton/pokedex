# Jemma’s Pokédex

My Pokémon GO collection: every Pokémon and form, with boxes for caught, shiny, lucky, 4★ and the rest, plus costumes, event backgrounds and what’s on. Everything is here, the game’s pictures included, so it runs from this copy alone.

**To open it on this PC:** double-click **Jemma’s Pokédex** on the Desktop (also in the Start menu, and in this folder). It opens in its own window.

**Ticking:** click a box to tick it; it saves straight away, and ticking any box ticks Caught too. Clicking anywhere else on a card opens that Pokémon’s page, with the game’s picture, GO’s Pokédex entry, big boxes to tick, its evolution family, forms, costumes and backgrounds (← and → go to the previous and next number).

**Pages:** Every Pokémon and each region; Event Pokémon (your events’ backgrounds and the costumes you collect); Looking for (what you still need, to trade or hunt); What’s on (a calendar of GO events and what you need from them); Fast tick (a whole region at once, like the game’s Pokédex).

**What happens by itself:** every Sunday at 9:40 (or when the PC is next on) the events are refreshed and everything is saved to a backup zip in Documents\PokedexBackups.

**To change anything:** open Claude Code in this folder and ask. New Pokémon or shinies in GO: say “update the Pokédex”.

## Using it on another computer

You need [Git](https://git-scm.com/download/win) and [Python 3](https://www.python.org/downloads/) (tick “Add python.exe to PATH” when installing).

1. Get a copy: `git clone https://github.com/jemmathornton/pokedex.git`
2. Start it: `python tools/serve.py` in the `pokedex` folder (leave that window open).
3. Open http://localhost:8030 in a browser. Ticks you make there are saved in `data/collection/go.json`.

## Keeping both computers the same

Ticks are saved on the computer you make them on. To carry them over:

- On the computer you used: `git add -A`, `git commit -m "Ticks"`, `git push`
- On the other one, before using it: `git pull`

Use one computer at a time, and pull before you start, so the two never get different ticks.

## What’s in this folder

- `site` – the app itself, with the game’s pictures
- `data` – what the app shows, and your ticks (`data/collection/go.json`)
- `tools` – the scripts Claude runs
- `research` – notes: the European events list, which Pokémon are out
- `imports` – raw copies of what the tools downloaded
- `for-jemma` – your list: things waiting for you to do or decide
- `TODO.md` – Claude’s jobs
