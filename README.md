# Jemma’s Pokédex

My Pokémon GO collection: every Pokémon and form, with boxes for caught, shiny, lucky, 4★ and the rest, plus costumes, event backgrounds and what’s on. Everything is here, the game’s pictures included, so it runs from this copy alone.

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
