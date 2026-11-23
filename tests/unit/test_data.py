"""The real data, read only: everything that points at something else points at something that exists, and her
ticks only use keys and boxes the page knows. A failure here means a data file needs fixing (or the page would show a
blank, a broken link or a tick that can't be seen)."""
import os, re, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from support import REAL, fingerprint, load, real, real_built

APP = open(os.path.join(REAL, 'site', 'js', 'app.js'), encoding='utf-8').read()
MEGA_TICKS = {'mg', 'mx', 'my'}


class Data(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dex = real('go', 'dex.json')['entries']
        cls.costumes = real('go', 'costumes.json')['costumes']
        cls.pictures = real('go', 'pictures.json')
        cls.events = real('events.json')
        cls.special = real('special-backgrounds.json')['special']
        cls.col = real('collection', 'go.json')
        cls.byid = {e['id']: e for e in cls.dex}
        cls.cos = {c['id']: c for c in cls.costumes}
        cls.names = {}
        for e in cls.dex:
            cls.names.setdefault(e['name'].lower(), e['dex'])
        # the page's "plain entry" for a Pokédex number (app.js baseOf): the first entry, or the first with no form
        cls.base = {}
        for e in cls.dex:
            b = cls.base.get(e['dex'])
            if not b or (not e.get('form') and b.get('form')):
                cls.base[e['dex']] = e
        cls.ticks = load('serve').TICKS

    # ---------- the Pokédex ----------
    def test_entry_ids_are_unique(self):
        ids = [e['id'] for e in self.dex]
        self.assertEqual(len(ids), len(set(ids)), [i for i in set(ids) if ids.count(i) > 1][:10])

    def test_entries_have_what_the_page_needs(self):
        for e in self.dex:
            with self.subTest(e['id']):
                self.assertIsInstance(e['dex'], int)
                self.assertTrue(e['name'] and e['img'] and e['types'])
                self.assertIn(e['gender'], ('both', 'male', 'female', 'none'))
                self.assertTrue(e['id'] == str(e['dex']) or e['id'].startswith(f"{e['dex']}-"))

    def test_evolutions_point_at_entries(self):
        bad = [(e['id'], st['to']) for e in self.dex for st in e.get('evo') or [] if st['to'] not in self.byid]
        self.assertEqual(bad, [])

    def test_shiny_shadow_only_where_shadow_and_shiny(self):
        bad = [e['id'] for e in self.dex if e.get('shadowShiny') and not (e.get('shadow') and e.get('shiny'))]
        self.assertEqual(bad, [])

    def test_megas(self):
        megas = [(e, m) for e in self.dex for m in e.get('mega') or []]
        self.assertGreaterEqual(len(megas), 60, 'fewer Megas than expected: did the import lose them?')
        for e, m in megas:
            with self.subTest(e['id'], mega=m['label']):
                self.assertIn(m['t'], MEGA_TICKS)
                self.assertIn(m['label'], ('Mega', 'Mega X', 'Mega Y', 'Primal'))
                self.assertTrue(m['img'].startswith(f"pm{e['dex']}.f"))
                self.assertTrue(e['released'])
            self.assertFalse(e.get('megaLater'), f"{e['id']}: both a Mega out and one not out")
        for e in self.dex:   # Mega X and Y come together; a Pokémon has one box per Mega
            ts = [m['t'] for m in e.get('mega') or []]
            self.assertEqual(len(ts), len(set(ts)), e['id'])
            self.assertEqual('mx' in ts, 'my' in ts, e['id'])

    def test_costumes(self):
        ids = [c['id'] for c in self.costumes]
        self.assertEqual(len(ids), len(set(ids)))
        for c in self.costumes:
            with self.subTest(c['id']):
                self.assertIn(c['dex'], self.base, 'a costume for a Pokémon with no entry')
                self.assertTrue(c['costume'] and c['img'].startswith(f"pm{c['dex']}."))

    def test_pictures_are_the_game_files(self):
        for k, v in list(self.pictures.items())[:5000]:
            self.assertTrue(v.endswith('.png'), k)

    # ---------- events and backgrounds ----------
    def bg_ids(self, ev):
        """The entry or costume ids an event's background cards show (app.js bgMonsOf)."""
        if ev.get('cards'):
            return ev['cards']
        return [self.base[self.names[n.lower()]]['id'] for n in ev.get('backgroundPokemon') or [] if n.lower() in self.names]

    def test_background_pokemon_have_entries(self):
        for ev in self.events + self.special:
            for n in ev.get('backgroundPokemon') or []:
                self.assertIn(n.lower(), self.names, f"{ev['id']}: no Pokémon called {n}")

    def test_background_cards_exist_and_match_the_list(self):
        for ev in self.events + self.special:
            if not ev.get('cards'):
                continue
            with self.subTest(ev['id']):
                species = {self.names[n.lower()] for n in ev.get('backgroundPokemon') or []}
                for c in ev['cards']:
                    item = self.byid.get(c) or self.cos.get(c)
                    self.assertIsNotNone(item, f'no entry or costume {c}')
                    self.assertIn(item['dex'], species, f'{c} is on the cards but not in backgroundPokemon')
                self.assertEqual(len(ev['cards']), len(set(ev['cards'])), 'a card twice')

    def test_event_ids_are_unique(self):
        ids = [ev['id'] for ev in self.events + self.special]
        self.assertEqual(len(ids), len(set(ids)))
        for ev in self.special:
            self.assertTrue(ev['id'].startswith('sb-'), ev['id'])

    # ---------- her ticks ----------
    def test_ticks_point_at_things_that_exist(self):
        evs = {ev['id']: ev for ev in self.events + self.special}
        for key, ticks in self.col['have'].items():
            with self.subTest(key):
                kind, _, rest = key.partition(':')
                if kind == 'd':
                    self.assertIn(rest, self.byid)
                elif kind == 'c':
                    self.assertIn(rest, self.cos)
                elif kind == 'b':
                    ev_id, _, item = rest.rpartition(':')
                    self.assertIn(ev_id, evs)
                    self.assertIn(item, self.bg_ids(evs[ev_id]), 'a background tick for a card that isn’t shown')
                else:
                    self.fail(f'unknown key kind {kind}')
                self.assertTrue(set(ticks) <= self.ticks, set(ticks) - self.ticks)

    def test_went_and_costumes_exist(self):
        evs = {ev['id'] for ev in self.events + self.special}
        self.assertEqual([w for w in self.col['went'] if w not in evs], [])
        self.assertEqual([c for c in self.col['costumes'] if c not in self.cos], [])

    def test_box_ticks_fit_the_pokemon(self):
        """A tick on a box the Pokémon can't have would be invisible (the page hides impossible boxes)."""
        rules = {'sd': 'shadow', 'pu': 'shadow', 'dx': 'dynamax', 'gx': 'gmax', 'ss': 'shadowShiny'}
        for key, ticks in self.col['have'].items():
            if not key.startswith('d:'):
                continue
            e = self.byid[key[2:]]
            for t in ticks:
                if t in rules:
                    self.assertTrue(e.get(rules[t]), f'{key} has {t}')
                if t in MEGA_TICKS:
                    self.assertIn(t, [m['t'] for m in e.get('mega') or []], f'{key} has {t}')

    # ---------- the page and the server agree ----------
    def test_every_box_the_page_ticks_can_be_saved(self):
        used = set(re.findall(r'\b(?:B|btn)\("([a-z]+)"', APP)) | set(re.findall(r'data-tick="([a-z]+)"', APP)) | MEGA_TICKS
        self.assertTrue(used, 'found no boxes in app.js: has the code changed shape?')
        self.assertEqual(used - self.ticks, set(), 'boxes the server would refuse to save')

    def test_data_js_is_built_from_the_data(self):
        built = real_built()
        self.assertEqual(len(built['entries']), len(self.dex), 'site/js/data.js is out of date: run tools/build.py')
        self.assertEqual(len(built['costumes']), len(self.costumes), 'site/js/data.js is out of date: run tools/build.py')
        self.assertEqual({e['id'] for e in built['entries']}, set(self.byid))



class HomeData(unittest.TestCase):
    """Pokémon HOME's list (data/home/dex.json, tools/import_home.py; built 22 Nov): what the research says HOME has."""
    @classmethod
    def setUpClass(cls):
        cls.go = {e['id']: e for e in real('go', 'dex.json')['entries']}
        cls.home = real('home', 'dex.json')['entries']
        cls.full = [{**cls.go.get(e['id'], {}), **e} if e.get('go') else e for e in cls.home]
        cls.facts = real('..', 'research', 'data', 'home-facts.json') if os.path.exists(os.path.join(REAL, 'research', 'data', 'home-facts.json')) else {}

    def test_every_species_once_each_id_once_and_every_shared_one_in_go(self):
        self.assertEqual({e['dex'] for e in self.full}, set(range(1, 1026)))
        ids = [e['id'] for e in self.home]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual([e['id'] for e in self.home if e.get('go') and e['id'] not in self.go], [])

    def test_only_homes_facts_and_a_picture_for_each(self):
        for e in self.home:
            with self.subTest(e['id']):
                self.assertIsInstance(e['shiny'], bool); self.assertIsInstance(e['gmax'], bool)
                self.assertFalse({'shadow', 'dynamax', 'mega', 'buddyKm', 'released'} & set(e), 'no GO-only facts in HOME’s own data')
                self.assertTrue(e.get('go') or (e.get('img') or '').startswith('hm.'), 'HOME’s own forms have HOME’s picture')

    def test_homes_own_forms_have_the_right_gender(self):
        """Every cap Pikachu is male (overnight review, 23 Nov: they had Female boxes); Eternal Floette female; Magearna, Zarude
        and Gimmighoul genderless."""
        g = {e['id']: e.get('gender') for e in self.full}
        caps = [i for i in g if i.startswith('25-') and i.endswith('-cap')]
        self.assertEqual(len(caps), 8)
        for i in caps:
            self.assertEqual(g[i], 'male', i)
        self.assertEqual(g['670-eternal'], 'female')
        for i in ('801-original', '893-dada', '999-chest'):
            self.assertEqual(g[i], 'none', i)

    def test_shiny_and_gigantamax_as_serebii_lists_them(self):
        no = {e['id'] for e in self.home if not e['shiny']}
        for i in ('494', '25-original-cap', '1025', '893', '893-dada', '670-eternal'):   # Victini, a cap Pikachu, Pecharunt, Zarude…
            self.assertIn(i, no)
        for i in ('25', '25-partner-cap', '6', '1'):
            self.assertNotIn(i, no)
        gmax = {e['dex'] for e in self.full if e['gmax']}
        self.assertEqual(len(gmax), 32, sorted(gmax))
        self.assertFalse([e['id'] for e in self.full if e['gmax'] and (e.get('form') or '').startswith(('Alolan', 'Galarian', 'Hisuian', 'Paldean'))])
        self.assertFalse([e['id'] for e in self.full if e['gmax'] and e['dex'] == 25 and e['id'] != '25'], 'only plain Pikachu, not the caps')

    def test_go_forms_home_does_not_keep_are_left_out(self):
        ids = {e['id'] for e in self.home}
        for i in ('150-armored', '351-sunny', '487-origin', '493-fire', '646-black', '774-meteor', '327-2'):
            self.assertNotIn(i, ids)
        for i in ('774-red', '670-eternal', '999', '999-chest', '902-female', '869-ruby-swirl-love-sweet'):
            self.assertIn(i, ids)


if __name__ == '__main__':
    unittest.main()
