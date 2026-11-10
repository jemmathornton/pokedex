The Pokédex's tests (made 10 Nov 2026). They never change her real files: anything that writes works on a throwaway
copy of the project (tests/support.py, Sandbox), and they check afterwards that her ticks file is exactly as it was.

Run (Python 3.13, from the project folder):
    python -X utf8 tests/run_tests.py            everything (about 2 minutes)
    python -X utf8 tests/run_tests.py unit       the data checks and unit tests only
    python -X utf8 tests/run_tests.py e2e        the page tests only (headless Chrome)
    python -X utf8 tests/run_tests.py slow       also re-runs the GO import from imports/ and compares (a few minutes more)
    python -X utf8 tests/run_tests.py unit -k mega    only tests whose name has "mega"

unit/test_data.py    the real data, read only: ids unique, evolutions/backgrounds/costumes/ticks all point at things that
                     exist, Megas well formed, her ticks only on boxes the Pokémon can have, every box the page ticks can
                     be saved by the server, site/js/data.js not out of date.
unit/test_server.py  the server on a spare port: saves, unticks, every box, costumes/events lists, refuses bad keys,
                     posts without the header or from another site, many ticks at once.
unit/test_build.py   the build: everything the page reads is in data.js, fingerprints stamped, stops on bad data.
unit/test_import.py  (slow) re-running the import from the saved downloads gives the same data.
unit/test_calcy.py   the Calcy IV importer: the right boxes from a row, ancestor rows skipped, never an impossible box.
e2e/site.test.js     in Chrome: every page (all ~1,000 Pokémon pages too) opens with no errors or "undefined", every
                     link goes to a page, pictures load, the box strip (Charizard's Mega X/Y, Mew's missing Lucky,
                     Kyogre's Primal), ticking saves, Shiny Shadow and costume cards tick, ← →, card clicks, the filter
                     line on one line, the Mega tab, search, Costumes/Events only hers, the region picture switch.

Run them after any change to the page or the tools, and before committing.
