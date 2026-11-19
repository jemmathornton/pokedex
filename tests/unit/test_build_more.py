"""The build's checks and what it adds (19 Nov): backgrounds an upcoming event brings back (their Pokémon and evolutions,
the `dex` list What's on shows), the flag check that stops it, data.js's shape, files that may be missing. On a quick
throwaway copy with no pictures."""
import json, os, pathlib, subprocess, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from support import PYTHON, REAL, LightSandbox, fingerprint


def build(box):
    return subprocess.run([PYTHON, '-X', 'utf8', os.path.join(REAL, 'tools', 'build.py')], capture_output=True, text=True,
                          env={**os.environ, 'POKEDEX_ROOT': box.root})


class BuildMore(unittest.TestCase):
    def setUp(self):
        self.before = fingerprint()
        self.box = LightSandbox().__enter__()
        self.ticks = pathlib.Path(self.box.path('data', 'collection', 'go.json')).read_bytes()

    def tearDown(self):
        self.box.__exit__(None, None, None)
        self.assertEqual(fingerprint(), self.before, 'her real ticks file changed during a test')

    def upbg(self, entries):
        self.box.write({'_about': 'test', **entries}, 'go', 'upcoming-backgrounds.json')

    def ok(self):
        r = build(self.box)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        return self.box.built()

    def fails(self, *words):
        r = build(self.box)
        self.assertNotEqual(r.returncode, 0, 'the build should have stopped')
        for w in words:
            self.assertIn(w, r.stdout + r.stderr)

    def test_data_js_shape(self):
        d = self.ok()
        text = pathlib.Path(self.box.path('site', 'js', 'data.js')).read_text(encoding='utf-8')
        self.assertTrue(text.startswith('const DATA = ') and text.endswith(';\n'))
        self.assertEqual(d['game'], 'go')
        self.assertEqual(set(d['upcoming']), {'fetched', 'events', 'backgrounds'})
        self.assertEqual(d['sprites'], [], 'a copy with no pictures lists none')
        self.assertTrue(all(not k.startswith('_') for k in d['costumeEvents']), 'notes in costume-events.json leaked')
        for v in d['costumeEvents'].values():
            self.assertLessEqual(set(v), {'event', 'start', 'end', 'parts'})
        self.assertNotIn('_about', d['upcoming']['backgrounds'])
        self.assertTrue(all('unsure' not in v for v in d['upcoming']['backgrounds'].values()))
        self.assertEqual(pathlib.Path(self.box.path('data', 'collection', 'go.json')).read_bytes(), self.ticks, 'the build changed the ticks file')

    def test_an_event_adds_its_pokemon_and_their_evolutions_to_a_named_background(self):
        self.upbg({'t-ev': {'background': 'sb-gofest2024-wormhole', 'pokemon': ['Feebas']}})
        d = self.ok()
        self.assertEqual(d['upcoming']['backgrounds']['t-ev'], {'background': 'sb-gofest2024-wormhole', 'dex': [349, 350]})
        bg = next(s for s in d['special'] if s['id'] == 'sb-gofest2024-wormhole')
        self.assertIn('Feebas', bg['backgroundPokemon']); self.assertIn('Milotic', bg['backgroundPokemon'])
        self.assertEqual(len(bg['backgroundPokemon']), len(set(bg['backgroundPokemon'])), 'a name twice')

    def test_an_event_adds_the_exact_form_to_a_background_with_cards(self):
        self.upbg({'t-ev': {'background': 'sb-gotour2026-diamond', 'pokemon': ['Toxtricity (Low Key Form)', 'Meowstic']}})
        d = self.ok()
        cards = next(s for s in d['special'] if s['id'] == 'sb-gotour2026-diamond')['cards']
        self.assertIn('849-low-key', cards); self.assertNotIn('849-amped', cards)
        self.assertEqual(d['upcoming']['backgrounds']['t-ev']['dex'], [678, 849])

    def test_two_events_keep_their_own_dex_lists(self):
        # her point, 19 Nov: each event only the Pokémon that can get the background there, not the whole background
        self.upbg({'a': {'background': 'sb-community-2026', 'pokemon': ['Pawniard']},
                   'b': {'background': 'sb-community-2026', 'pokemon': ['Abra']}})
        d = self.ok()['upcoming']['backgrounds']
        self.assertEqual(d['a']['dex'], [624, 625, 983])
        self.assertEqual(d['b']['dex'], [63, 64, 65])

    def test_an_event_with_no_pokemon_has_an_empty_list(self):
        self.upbg({'t-ev': {'background': 'sb-community-2026'}})
        self.assertEqual(self.ok()['upcoming']['backgrounds']['t-ev']['dex'], [])

    def test_stops_on_an_unknown_pokemon_or_background(self):
        self.upbg({'t-ev': {'background': 'sb-community-2026', 'pokemon': ['Notapokemon']}})
        self.fails('Notapokemon')
        self.upbg({'t-ev': {'background': 'sb-no-such-background', 'pokemon': ['Pawniard']}})
        self.fails('sb-no-such-background')

    def test_stops_when_whats_on_asks_for_a_box_dex_json_says_cant_be(self):
        up = {'fetched': '2026-11-19', 'events': [{'id': 'x', 'name': 'Gigantamax Bulbasaur Max Battle Day', 'mons': [{'name': 'Bulbasaur', 'id': '1', 'as': ['gmax']}]}]}
        self.box.write(up, 'go', 'upcoming.json')
        self.fails('Bulbasaur as gmax', 'flag-fixes.json')
        up['events'][0]['mons'][0]['as'] = ['dynamax']   # Bulbasaur can Dynamax
        self.box.write(up, 'go', 'upcoming.json')
        self.ok()

    def test_builds_without_the_optional_files(self):
        for f in (('go', 'upcoming.json'), ('go', 'upcoming-backgrounds.json'), ('costume-events.json',), ('special-backgrounds.json',)):
            os.remove(self.box.path('data', *f))
        d = self.ok()
        self.assertEqual(d['upcoming'], {'fetched': None, 'events': [], 'backgrounds': {}})
        self.assertEqual((d['special'], d['costumeEvents']), ([], {}))


if __name__ == '__main__':
    unittest.main()
