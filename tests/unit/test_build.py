"""The build (data/ -> site/js/data.js), on a throwaway copy: it carries everything the page needs, and it stops on
data that would break the page."""
import os, subprocess, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from support import PYTHON, REAL, Sandbox, fingerprint, real


def build(box):
    return subprocess.run([PYTHON, '-X', 'utf8', os.path.join(REAL, 'tools', 'build.py')], capture_output=True, text=True,
                          env={**os.environ, 'POKEDEX_ROOT': box.root})


class Build(unittest.TestCase):
    def setUp(self):
        self.before = fingerprint()

    def tearDown(self):
        self.assertEqual(fingerprint(), self.before, 'her real ticks file changed during a test')

    def test_builds_everything_the_page_reads(self):
        with Sandbox() as box:
            r = build(box)
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
            d = box.built()
            for k in ('entries', 'costumes', 'events', 'special', 'dexByName', 'sprites', 'bigSprites', 'backgrounds', 'collection'):
                self.assertIn(k, d)
            self.assertEqual(len(d['entries']), len(real('go', 'dex.json')['entries']))
            self.assertEqual(d['collection'], box.read('collection', 'go.json'), 'the page’s copy of her ticks')
            self.assertTrue(all('sources' not in s and 'unsure' not in s for s in d['special']), 'research notes leaked onto the page')

    def test_stamps_fingerprints_on_the_code_files(self):
        with Sandbox() as box:
            build(box)
            html = open(box.path('site', 'index.html'), encoding='utf-8').read()
            for f in ('site.css', 'js/app.js', 'js/data.js', 'js/icons.js'):
                self.assertRegex(html, rf'{f}\?v=\w+', f)

    def test_stops_on_a_background_pokemon_with_no_entry(self):
        with Sandbox() as box:
            ev = box.read('events.json'); ev[0]['backgroundPokemon'] = ['Notapokemon']; box.write(ev, 'events.json')
            r = build(box)
            self.assertNotEqual(r.returncode, 0)
            self.assertIn('Notapokemon', r.stdout + r.stderr)

    def test_stops_on_a_background_card_that_doesnt_exist(self):
        with Sandbox() as box:
            sp = box.read('special-backgrounds.json'); sp['special'][0]['cards'] = ['25-no-such-costume']; box.write(sp, 'special-backgrounds.json')
            r = build(box)
            self.assertNotEqual(r.returncode, 0)
            self.assertIn('25-no-such-costume', r.stdout + r.stderr)


if __name__ == '__main__':
    unittest.main()
