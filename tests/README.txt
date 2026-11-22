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
unit/test_server_edges.py  (19 Nov) the saving itself: a missing, broken or BOM ticks file, the .bak copy, bad keys and
                     ticks refused with nothing written, lists sorted, the lock between the two copies, the API's refusals.
unit/test_family.py  (22 Nov) the family’s shared code: the server hands out Jemma’s Journals’ site/family/ files at /family/
                     and nothing else (no ../, other folders or other hosts), the page asks for all three; the weekly backup
                     records the version in the parent after a push that worked, and a failure there is only logged.
unit/test_build.py   the build: everything the page reads is in data.js, fingerprints stamped, stops on bad data.
unit/test_build_more.py  (19 Nov) backgrounds an upcoming event brings back (Pokémon, evolutions, `dex` lists), the
                     flag check, data.js's shape, optional files missing.
unit/test_importers.py  (19 Nov) import_events.py offline (names, UTC times, picture keys, matching, a refresh from a
                     made-up feed) and import_go.py's helpers (codes, form names, slugs, Dittobase and Serebii matching).
unit/test_import.py  (slow) re-running the import from the saved downloads gives the same data.
unit/test_calcy.py   the Calcy IV importer: the right boxes from a row, ancestor rows skipped, never an impossible box.
unit/test_pokedex_reader.py  the game's-Pokédex reader on real screenshots (fixtures/pokedex/): every cell it reads is
                     right, covered cells skipped, region/count/tab read, misread numbers dropped, the Quick add line,
                     never writes her ticks; with "slow" also its self-test (a made-up screen recording).
e2e/site.test.js     in Chrome: every page (all ~1,000 Pokémon pages too) opens with no errors or "undefined", every
                     link goes to a page, pictures load, the box strip (Charizard's Mega X/Y, Mew's missing Lucky,
                     Kyogre's Primal), ticking saves, Shiny Shadow and costume cards tick, ← →, card clicks, the filter
                     line on one line, the Mega tab, search, Costumes/Events only hers, the region picture switch; (19 Nov) totals for gender
                     forms, regional forms and forms one by one, ticking any box ticks Caught, What's on
                     month by month, Event Pokémon and Home counts, unknown addresses, Looking for's tabs and copied list.
                     (21 Nov) the foot of every page: Back to top and Dark mode on every page, Back to top scrolls up and
                     moves focus, Dark mode opens light, switches and is remembered after reloading, no follow-the-device
                     dark rules, text contrast 4.5:1 in light and dark.
                     (22 Nov) the family’s shared code loads from /family/ and runs (window.JJFamily); with no save server
                     (a web host’s 404/405, its page, no answer) the page is view only, quietly; her server failing (500, 503,
                     a broken answer) still says so (__stub__.html, a stand-in fetch, from test_site.py).
                     knownBug(...) marks a test for a known app bug: reported (not failed) until it passes.
support.py           Sandbox (a full copy, ~8 s, inside a temporary Jemma’s Journals with site/family/ copied) and LightSandbox (data and code only, under a second: use it when no
                     pictures are needed).

Run them after any change to the page or the tools, and before committing.
