"""Run the Pokédex's tests (10 Nov 2026). Nothing here changes her real files: every test that writes works on a
throwaway copy of the project, and the checks on the real data only read it.

    python -X utf8 tests/run_tests.py            data checks and unit tests, then the page tests in headless Chrome
    python -X utf8 tests/run_tests.py unit       data checks and unit tests only (quick)
    python -X utf8 tests/run_tests.py e2e        page tests only
    python -X utf8 tests/run_tests.py unit -k server    only tests whose name has "server"
    python -X utf8 tests/run_tests.py slow       also re-runs the GO import from the saved copies (a minute or two)

unit/  the real data's consistency (read only), the server, the build, the import (slow), in Python
e2e/   the site itself in headless Chrome: every page, ticking, filters, the Pokémon pages
"""
import os, sys, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)


def main():
    args = sys.argv[1:]
    if 'slow' in args:
        os.environ['POKEDEX_SLOW'] = '1'
    which = [a for a in args if a in ('unit', 'e2e')] or ['unit', 'e2e']
    pattern = args[args.index('-k') + 1] if '-k' in args else None
    loader = unittest.TestLoader()
    if pattern:
        loader.testNamePatterns = [f'*{pattern}*']
    suite = unittest.TestSuite()
    for w in which:
        suite.addTests(loader.discover(os.path.join(HERE, w), top_level_dir=os.path.join(HERE, w)))
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)


if __name__ == '__main__':
    main()
