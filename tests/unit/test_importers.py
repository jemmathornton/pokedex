"""The import tools' helpers, offline (19 Nov): import_events.py's names, times, picture keys, Pokémon matching and its
refresh with a made-up feed (no network); import_go.py's game-code tidying, form names, slugs and source matching."""
import io, json, os, pathlib, sys, unittest
from datetime import datetime, timedelta, timezone
from unittest import mock
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from support import LightSandbox, fingerprint, load, real

DEX = real('go', 'dex.json')['entries']


class ImportEvents(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ie = load('import_events')

    def test_tidy_names(self):
        t = self.ie.tidy
        self.assertEqual(t('Dynamax Espurr during Max Monday'), 'Dynamax Espurr Max Monday')
        self.assertEqual(t('Clefable Super Mega Raid Day'), 'Clefable Super Mega Raid Day')
        self.assertEqual(t('Bonus during the event'), 'Bonus during the event', 'only “during” before Max Monday goes')

    def test_when_turns_utc_into_this_computers_time(self):
        w = self.ie.when
        self.assertIsNone(w(None)); self.assertIsNone(w(''))
        self.assertEqual(w('2026-11-20T10:00:00.000'), datetime(2026, 11, 20, 10, 0), 'a local time stays as it is')
        for s in ('2026-07-01T12:00:00Z', '2026-12-01T12:00:00.000Z'):   # summer and winter
            with self.subTest(s):
                u = datetime.fromisoformat(s.replace('Z', '+00:00'))
                got = w(s)
                self.assertIsNone(got.tzinfo)
                self.assertEqual(got - u.replace(tzinfo=None), u.astimezone().utcoffset(), 'not moved by this computer’s offset')
        got = w('2026-07-01T12:00:00+02:00')
        self.assertEqual(got, datetime(2026, 7, 1, 10, tzinfo=timezone.utc).astimezone().replace(tzinfo=None))

    def test_picture_keys(self):
        k = self.ie.key
        self.assertEqual(k('https://x/Pokemon/Addressable Assets/pm354.fMEGA.icon.png'), 'pm354.fMEGA')
        self.assertEqual(k('https://x/pm25.s.icon.png'), 'pm25')
        self.assertEqual(k('https://x/pokemon_icon_386_12.png'), '386_12')
        self.assertIsNone(k(None)); self.assertIsNone(k('https://x/other.png'))

    def test_mons_from_each_list(self):
        xd = {'spotlight': {'list': [{'name': 'Pikachu', 'image': '/pm25.icon.png', 'canBeShiny': True}]},
              'communityday': {'spawns': [{'name': 'Pawniard', 'image': '/pm624.icon.png'}]},
              'raidbattles': {'bosses': [{'name': 'Darkrai', 'image': None, 'canBeShiny': False}]}}
        self.assertEqual(self.ie.mons(xd), [{'name': 'Pikachu', 'key': 'pm25', 'shiny': True}, {'name': 'Pawniard', 'key': 'pm624', 'shiny': True},
                                            {'name': 'Darkrai', 'key': None, 'shiny': False}])
        self.assertEqual(self.ie.mons({}), [])

    def test_resolve_from_the_title(self):
        r = lambda name: [(m['id'], m['as']) for m in self.ie.resolve(name, [], DEX)]
        self.assertEqual(r('Dynamax Espurr during Max Monday'), [('677', ['dynamax'])])
        self.assertEqual(r('Clefable Super Mega Raid Day'), [('36', ['mega'])])
        self.assertEqual(r('Eternamax Eternatus in Max Battles'), [], 'Eternamax Eternatus can’t be caught')
        self.assertEqual(r('GO Pass: November'), [])

    def test_resolve_listed_pokemon_and_their_forms(self):
        ms = [{'name': 'Toxtricity (Low Key Form)', 'key': None, 'shiny': True}, {'name': 'Shadow Darkrai', 'key': None, 'shiny': False},
              {'name': 'Mega Gengar', 'key': None, 'shiny': True}, {'name': 'Notamon', 'key': None, 'shiny': None}]
        got = {m['name']: (m['id'], m['as']) for m in self.ie.resolve('Raids', ms, DEX)}
        self.assertEqual(got, {'Toxtricity (Low Key Form)': ('849-low-key', []), 'Shadow Darkrai': ('491', ['shadow']), 'Mega Gengar': ('94', ['mega'])})

    def test_refresh_keeps_whats_on_and_leaves_out_the_rest(self):
        now = datetime.now()
        iso = lambda d: (now + timedelta(days=d)).strftime('%Y-%m-%dT%H:%M:%S.000')
        ev = lambda i, s, e, **kw: {'eventID': i, 'name': kw.pop('name', i), 'eventType': kw.pop('t', 'event'), 'heading': 'Event', 'start': iso(s), 'end': iso(e), 'link': f'https://leekduck.com/events/{i}/', **kw}
        feed = [ev('later', 3, 4), ev('now', -1, 2), ev('ended', -5, -1), ev('too-far', 50, 51),
                ev('league', -1, 30, t='go-battle-league'), ev('season', -1, 60, t='season'), ev('cancelled', 1, 2, name='[Canceled] Something'),
                {**ev('no-link', 1, 1.1, name='Dynamax Espurr during Max Monday'), 'link': None}]
        class Resp(io.BytesIO):
            def __enter__(self): return self
            def __exit__(self, *a): pass
        before = fingerprint()
        with LightSandbox() as box:
            mod = load('import_events')
            with mock.patch.object(mod.urllib.request, 'urlopen', lambda *a, **k: Resp(json.dumps(feed).encode())), mock.patch('builtins.print'):
                mod.main()
            out = json.loads(pathlib.Path(box.path('data', 'go', 'upcoming.json')).read_text(encoding='utf-8'))
            self.assertEqual([e['id'] for e in out['events']], ['now', 'no-link', 'later'], 'in start order; ended, too far, league, season and cancelled left out')
            nl = out['events'][1]
            self.assertEqual((nl['name'], nl['link'], nl['mons'][0]['id']), ('Dynamax Espurr Max Monday', 'https://leekduck.com/events/', '677'))
            self.assertFalse(os.path.exists(box.path('data', 'go', 'upcoming.json.tmp')))
            self.assertTrue(os.listdir(box.path('imports')), 'a raw copy of the feed is kept')
        self.assertEqual(fingerprint(), before)


class ImportGo(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ig = load('import_go')

    def test_tidy_game_codes(self):
        t = self.ig.tidy
        self.assertEqual(t('GOFEST_2025_GOGGLES_RED'), 'GO Fest 2025 Goggles Red')
        self.assertEqual(t('GOFEST_2021_NOEVOLVE'), 'GO Fest 2021')
        self.assertEqual(t('COMPLETE_FIFTY_PERCENT'), 'Complete 50%')
        self.assertEqual(t('WCS_2023'), 'World Championships 2023')

    def test_form_names(self):
        f = self.ig.form_name
        self.assertEqual(f('VULPIX_ALOLA', 'VULPIX'), 'Alolan')
        self.assertEqual(f('TAUROS_PALDEA_COMBAT', 'TAUROS'), 'Paldean Combat')
        self.assertEqual(f('DARMANITAN_GALARIAN_STANDARD', 'DARMANITAN'), 'Galarian')
        self.assertEqual(f('UNOWN_A', 'UNOWN'), 'A')
        self.assertEqual(f('UNOWN_EXCLAMATION_POINT', 'UNOWN'), '!')
        self.assertEqual(f('UNOWN_QUESTION_MARK', 'UNOWN'), '?')
        self.assertEqual(f('VIVILLON_2', 'VIVILLON'), '#3')

    def test_slugs(self):
        s = self.ig.slug
        self.assertEqual(s('Flabébé'), 'flabebe')
        self.assertEqual(s('Low Key'), 'low-key')
        self.assertEqual(s('!'), 'exclamation'); self.assertEqual(s('?'), 'question')
        self.assertEqual(s('#3'), '3')

    def test_dittobase_records_to_entry_ids(self):
        ids = {'19', '19-alolan', '849-amped', '849-low-key', '250', '892-single-strike', '892-rapid-strike'}
        d = lambda slug, sp, n, **f: self.ig.ditto_ids({'slug': slug, 'speciesSlug': sp, 'speciesId': n, **f}, {}, ids)
        self.assertEqual(d('rattata-alola-shadow', 'rattata', 19, isShadow=True), ['19-alolan'])
        self.assertEqual(d('rattata-shadow', 'rattata', 19, isShadow=True), ['19'])
        self.assertEqual(d('ho-oh-s', 'ho-oh', 250, isShadow=True), [], 'the Apex Shadow isn’t a box')
        self.assertEqual(d('toxtricity-gigantamax', 'toxtricity', 849, isGigantamax=True), ['849-amped', '849-low-key'])
        self.assertEqual(d('urshifu-gigantamax-rapid-strike', 'urshifu', 892, isGigantamax=True), ['892-rapid-strike'])
        self.assertEqual(d('toxtricity-dynamax', 'toxtricity', 849, isDynamax=True), [], 'no plain entry and not Gigantamax: none')

    def test_serebii_rows(self):
        row = lambda n, img: f'<tr><td class="cen">\n#{n:04d}\n</td><td class="cen"><a><img src="/pokemongo/pokemon/{img}.png"></a></td></tr>'
        html = '<h2>Shadow</h2>' + row(19, '019-a') + row(849, '849-l') + '<h2>Other</h2>' + row(1, '001')
        self.assertEqual(self.ig.serebii_rows(html, '<h2>Shadow</h2>', '<h2>Other</h2>'), [(19, 'a'), (849, 'l')])
        self.assertEqual(self.ig.serebii_rows(html), [(19, 'a'), (849, 'l'), (1, '')])

    def test_not_entries(self):
        ne = self.ig.NOT_ENTRIES
        for code in ('CHARIZARD_MEGA_X', 'KYOGRE_PRIMAL', 'LUGIA_S', 'DARMANITAN_GALARIAN_ZEN', 'ZACIAN_CROWNED_SWORD'):
            self.assertTrue(ne.search(code), code)
        for code in ('UNOWN_S', 'VULPIX_ALOLA', 'DARMANITAN_GALARIAN_STANDARD', 'MEOWSTIC_FEMALE'):
            self.assertFalse(ne.search(code), code)


if __name__ == '__main__':
    unittest.main()
