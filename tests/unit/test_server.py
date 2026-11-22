"""The server that saves her ticks, on a throwaway copy and a spare port: what it saves, what it refuses, and that
her real file is never touched."""
import functools, json, os, sys, threading, unittest, urllib.error, urllib.request
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from support import Sandbox, fingerprint, load


class Server(unittest.TestCase):
    def setUp(self):
        self.before = fingerprint()
        self.box = Sandbox().__enter__()
        col = self.box.read('collection', 'go.json'); col['have'] = {}; self.box.write(col, 'collection', 'go.json')   # start with no ticks (the copy only)
        self.serve = load('serve')
        self.assertTrue(self.serve.FILE.startswith(self.box.root), 'the server would write her real file')
        self.httpd = self.serve.Server(('127.0.0.1', 0), functools.partial(self.serve.Handler, directory=self.serve.SITE))
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
        self.url = f'http://127.0.0.1:{self.httpd.server_port}'

    def tearDown(self):
        self.httpd.shutdown(); self.httpd.server_close()
        self.box.__exit__(None, None, None)
        self.assertEqual(fingerprint(), self.before, 'her real ticks file changed during a test')

    def post(self, body, header=True, host=None):
        headers = {'Content-Type': 'application/json'}
        if header:
            headers['X-Pokedex'] = '1'
        if host:
            headers['Host'] = host
        req = urllib.request.Request(self.url + '/api/tick', data=json.dumps(body).encode(), headers=headers, method='POST')
        try:
            with urllib.request.urlopen(req) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read())

    def saved(self):
        return self.box.read('collection', 'go.json')

    def test_two_copies_saving_at_once_lose_nothing(self):
        # her app (8030) and the preview copy (8031) save to the same file; the 15 Nov review lost 5 of 200 this way
        import subprocess, socket, time
        s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
        env = dict(os.environ, POKEDEX_ROOT=self.box.root)
        proc = subprocess.Popen([sys.executable, '-X', 'utf8', self.serve.__file__, '--port', str(port)], env=env)
        try:
            other = f'http://127.0.0.1:{port}'
            for _ in range(50):
                try:
                    urllib.request.urlopen(other + '/api/collection').read(); break
                except OSError:
                    time.sleep(.1)
            def send(base, key):
                req = urllib.request.Request(base + '/api/tick', data=json.dumps({'list': 'have', 'key': key, 'tick': 'c', 'on': True}).encode(),
                                             headers={'Content-Type': 'application/json', 'X-Pokedex': '1'}, method='POST')
                urllib.request.urlopen(req).read()
            jobs = [threading.Thread(target=send, args=(self.url if n % 2 else other, f'd:{n + 1}')) for n in range(120)]
            [j.start() for j in jobs]; [j.join() for j in jobs]
            self.assertEqual(len(self.saved()['have']), 120)
        finally:
            proc.terminate(); proc.wait()

    def test_a_broken_file_falls_back_to_the_copy_before(self):
        self.post({'list': 'have', 'key': 'd:1', 'tick': 'c', 'on': True})
        self.post({'list': 'have', 'key': 'd:4', 'tick': 'c', 'on': True})   # the .bak now has d:1
        with open(self.serve.FILE, 'w', encoding='utf-8') as fh:
            fh.write('{"have": {"d:1"')   # cut off, as after a power cut mid-write
        self.assertEqual(self.post({'list': 'have', 'key': 'd:7', 'tick': 'c', 'on': True}), (200, {'ok': True}))
        self.assertEqual(set(self.saved()['have']), {'d:1', 'd:7'})

    def test_ticking_and_unticking_a_box(self):
        self.assertEqual(self.post({'list': 'have', 'key': 'd:25', 'tick': 's', 'on': True}), (200, {'ok': True}))
        self.assertIn('s', self.saved()['have']['d:25'])
        self.post({'list': 'have', 'key': 'd:25', 'tick': 's', 'on': False})
        self.assertNotIn('s', self.saved()['have'].get('d:25', []))

    def test_every_box_can_be_saved(self):
        for t in sorted(self.serve.TICKS):
            with self.subTest(t):
                self.assertEqual(self.post({'list': 'have', 'key': 'd:6', 'tick': t, 'on': True})[1], {'ok': True})

    def test_last_tick_off_removes_the_key(self):
        self.post({'list': 'have', 'key': 'd:1', 'tick': 'c', 'on': True})
        self.post({'list': 'have', 'key': 'd:1', 'tick': 'c', 'on': False})
        self.assertNotIn('d:1', self.saved()['have'])

    def test_costume_background_and_mega_keys(self):
        for key, tick in (('c:25-gotour-2026-a', 'c'), ('b:sb-gotour2026-gold:25-gotour-2026-b', 's'), ('d:6', 'mx'), ('d:382', 'mg')):
            with self.subTest(key):
                self.assertEqual(self.post({'list': 'have', 'key': key, 'tick': tick, 'on': True})[1], {'ok': True})
                self.assertIn(tick, self.saved()['have'][key])

    # ---------- Pokémon HOME (22 Nov): its own ticks file, GO's never touched ----------
    def get(self, path):
        with urllib.request.urlopen(self.url + path) as r:
            return json.loads(r.read())

    def test_home_ticks_go_to_home_json_and_never_to_go_json(self):
        go_before = self.box.read('collection', 'go.json')
        self.assertEqual(self.post({'game': 'home', 'list': 'have', 'key': 'd:25', 'tick': 's', 'on': True}), (200, {'ok': True}))
        self.assertEqual(self.box.read('collection', 'home.json')['have'], {'d:25': ['s']})
        self.assertEqual(self.box.read('collection', 'go.json'), go_before, "GO's file unchanged")
        self.assertEqual(self.get('/api/collection?game=home')['have'], {'d:25': ['s']})
        self.assertEqual(self.get('/api/collection'), go_before, 'GO read as ever')
        self.assertEqual(self.get('/api/collection?game=go'), go_before)

    def test_home_has_only_homes_boxes(self):
        for t in sorted(self.serve.HOME_TICKS):
            with self.subTest(t):
                self.assertEqual(self.post({'game': 'home', 'list': 'have', 'key': 'd:6', 'tick': t, 'on': True})[1], {'ok': True})
        for t in ('l', 'h', 'sd', 'pu', 'dx', 'mx', 'xl', 'ss'):   # no Lucky, 4★, Shadow… in HOME (her note, 22 Nov)
            with self.subTest(t):
                self.assertFalse(self.post({'game': 'home', 'list': 'have', 'key': 'd:6', 'tick': t, 'on': True})[1]['ok'])
        self.assertFalse(self.post({'game': 'home', 'list': 'costumes', 'key': '1-fall-2019', 'on': True})[1]['ok'], 'costumes are GO’s')
        self.assertFalse(self.post({'game': 'home', 'list': 'went', 'key': 'x', 'on': True})[1]['ok'], 'events are GO’s')

    def test_an_unknown_game_is_refused(self):
        for game in ('za', '../go', 5, ['go']):
            with self.subTest(game):
                self.assertFalse(self.post({'game': game, 'list': 'have', 'key': 'd:6', 'tick': 'c', 'on': True})[1]['ok'])
        with self.assertRaises(urllib.error.HTTPError):
            self.get('/api/collection?game=za')
        self.assertFalse(os.path.exists(self.box.path('data', 'collection', 'za.json')))

    def test_went_and_costume_lists(self):
        self.post({'list': 'costumes', 'key': '1-fall-2019', 'on': False})
        self.assertNotIn('1-fall-2019', self.saved()['costumes'])
        self.post({'list': 'costumes', 'key': '1-fall-2019', 'on': True})
        self.assertIn('1-fall-2019', self.saved()['costumes'])
        self.post({'list': 'went', 'key': 'go-fest-2022-berlin', 'on': True})
        self.assertIn('go-fest-2022-berlin', self.saved()['went'])

    def test_refuses_unknown_boxes_and_bad_keys(self):
        for body in ({'list': 'have', 'key': 'd:25', 'tick': 'zz', 'on': True},
                     {'list': 'have', 'key': 'nonsense', 'tick': 'c', 'on': True},
                     {'list': 'went', 'key': '../../etc', 'on': True},
                     {'list': 'other', 'key': 'x', 'on': True}):
            with self.subTest(body):
                self.assertFalse(self.post(body)[1].get('ok'))
        self.assertEqual(self.saved(), self.box.read('collection', 'go.json'))

    def test_refuses_posts_without_the_header_or_from_elsewhere(self):
        self.assertEqual(self.post({'list': 'have', 'key': 'd:25', 'tick': 'c', 'on': True}, header=False)[0], 403)
        self.assertEqual(self.post({'list': 'have', 'key': 'd:25', 'tick': 'c', 'on': True}, host='evil.example')[0], 403)

    def test_many_ticks_at_once_all_land(self):
        keys = [f'd:{n}' for n in range(1, 41)]
        threads = [threading.Thread(target=self.post, args=({'list': 'have', 'key': k, 'tick': 'c', 'on': True},)) for k in keys]
        for t in threads: t.start()
        for t in threads: t.join()
        have = self.saved()['have']
        self.assertEqual([k for k in keys if 'c' not in have.get(k, [])], [])

    def test_collection_comes_back(self):
        with urllib.request.urlopen(self.url + '/api/collection') as r:
            c = json.loads(r.read())
        self.assertEqual(set(c), {'have', 'went', 'costumes'})

    def test_serves_the_site(self):
        with urllib.request.urlopen(self.url + '/') as r:
            self.assertIn(b'id="view"', r.read())


if __name__ == '__main__':
    unittest.main()
