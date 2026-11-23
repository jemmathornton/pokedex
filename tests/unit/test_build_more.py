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


    # ---------- Pokémon HOME (22 Nov) ----------
    def test_home_goes_in_as_data_home_with_her_home_ticks(self):
        self.box.write({'have': {'d:25': ['c', 's']}, 'went': [], 'costumes': []}, 'collection', 'home.json')
        d = self.ok()
        self.assertEqual(d['home']['entries'], self.box.read('home', 'dex.json')['entries'])
        self.assertEqual(d['home']['collection']['have'], {'d:25': ['c', 's']})
        self.assertEqual(pathlib.Path(self.box.path('data', 'collection', 'go.json')).read_bytes(), self.ticks, 'GO’s ticks file untouched')

    def test_builds_without_home_and_its_ticks(self):
        os.remove(self.box.path('data', 'home', 'dex.json'))
        os.remove(self.box.path('data', 'shield', 'dex.json'))   # Shield's list names HOME's entries
        os.remove(self.box.path('data', 'arceus', 'dex.json'))   # and so does Legends: Arceus's
        os.remove(self.box.path('data', 'violet', 'dex.json')); os.remove(self.box.path('data', 'za', 'dex.json'))   # and Violet's and Z-A's
        if os.path.exists(self.box.path('data', 'collection', 'home.json')):
            os.remove(self.box.path('data', 'collection', 'home.json'))
        d = self.ok()
        self.assertEqual(d['home'], {'entries': [], 'collection': {}})

    def test_stops_when_home_names_a_go_entry_that_isnt_there_or_an_id_twice(self):
        home = self.box.read('home', 'dex.json')
        self.box.write({**home, 'entries': home['entries'] + [{'id': '99999', 'go': True, 'shiny': True, 'gmax': False}]}, 'home', 'dex.json')
        self.fails('99999', 'hasn’t got')
        self.box.write({**home, 'entries': home['entries'] + [home['entries'][0]]}, 'home', 'dex.json')
        self.fails('id is there twice')

    def test_shield_goes_in_with_its_sections_and_ticks(self):   # Pokémon Shield (23 Nov)
        self.box.write({'have': {'d:810': ['c']}, 'went': [], 'costumes': []}, 'collection', 'shield.json')
        d = self.ok()
        self.assertEqual(d['shield']['entries'], self.box.read('shield', 'dex.json')['entries'])
        self.assertEqual([s['id'] for s in d['shield']['sections']][:3], ['galar', 'isle-of-armor', 'crown-tundra'])
        self.assertEqual(d['shield']['collection']['have'], {'d:810': ['c']})
        sh = self.box.read('shield', 'dex.json')
        self.box.write({**sh, 'entries': sh['entries'] + [{'id': 'nope', 'home': True, 'shiny': True, 'gmax': False, 'sec': {}}]}, 'shield', 'dex.json')
        self.fails('nope', 'HOME entry')

    def test_arceus_goes_in_with_its_sections_and_ticks(self):   # Pokémon Legends: Arceus (23 Nov)
        self.box.write({'have': {'d:722': ['al']}, 'went': [], 'costumes': []}, 'collection', 'arceus.json')
        d = self.ok()
        self.assertEqual(d['arceus']['entries'], self.box.read('arceus', 'dex.json')['entries'])
        self.assertEqual([s['id'] for s in d['arceus']['sections']], ['hisui', 'elsewhere'])
        self.assertEqual([s['id'] for s in d['violet']['sections']][:3], ['paldea', 'kitakami', 'blueberry'])   # and Violet and Z-A (23 Nov)
        self.assertEqual([s['id'] for s in d['za']['sections']][:3], ['lumiose', 'hyperspace', 'mega'])
        self.assertEqual(d['arceus']['collection']['have'], {'d:722': ['al']})

    def test_homes_picture_only_where_go_has_none_and_only_if_it_is_there(self):
        sprites = pathlib.Path(self.box.path('site', 'sprites')); (sprites / 'big').mkdir(parents=True)
        al = 'hm.869-vanilla-cream-strawberry-sweet'   # GO's plain Alcremie is HOME's Vanilla Cream Strawberry Sweet
        for name in (al, al + '.s', 'hm.1025'):   # stand-ins: the build only reads the names
            (sprites / f'{name}.webp').write_bytes(b'')
        (sprites / 'pm1025.webp').write_bytes(b'')   # say GO's files had a Pecharunt
        alt = self.ok()['picAlt']
        self.assertEqual((alt.get('pm869'), alt.get('pm869.s')), (al, al + '.s'), 'Alcremie: HOME’s picture')
        self.assertNotIn('pm1025', alt, 'GO’s own picture wins')
        self.assertFalse([k for k, v in alt.items() if not (sprites / f'{v}.webp').exists()], 'only pictures that are there')


if __name__ == '__main__':
    unittest.main()
