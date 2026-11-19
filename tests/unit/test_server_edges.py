"""The server's saving, edge by edge (19 Nov): a missing, broken or Notepad-saved ticks file, the .bak copy, what it
refuses, the lists, the lock between the two copies. All on a throwaway copy; her real file is checked unchanged."""
import functools, json, os, subprocess, sys, threading, time, unittest, urllib.error, urllib.request
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from support import LightSandbox, fingerprint, load

EMPTY = {'have': {}, 'went': [], 'costumes': []}


class Base(unittest.TestCase):
    def setUp(self):
        self.before = fingerprint()
        self.box = LightSandbox(with_data=False).__enter__()
        self.serve = load('serve')
        self.assertTrue(self.serve.FILE.startswith(self.box.root), 'the server would write her real file')
        self.file, self.bak = self.serve.FILE, self.serve.FILE + '.bak'
        for p in (self.bak,):
            if os.path.exists(p):
                os.remove(p)
        self.put({'have': {'d:1': ['c']}, 'went': ['go-fest-2023-london'], 'costumes': ['1-fall-2019']})

    def tearDown(self):
        self.box.__exit__(None, None, None)
        self.assertEqual(fingerprint(), self.before, 'her real ticks file changed during a test')

    def put(self, obj, path=None, bom=False):
        with open(path or self.file, 'w', encoding='utf-8-sig' if bom else 'utf-8') as fh:
            json.dump(obj, fh)

    def raw(self, path=None):
        with open(path or self.file, 'rb') as fh:
            return fh.read()

    def scribble(self, text, path=None):
        with open(path or self.file, 'w', encoding='utf-8') as fh:
            fh.write(text)

    def saved(self, path=None):
        return json.loads(self.raw(path).decode('utf-8'))

    def tick(self, key='d:4', t='c', on=True):
        return self.serve.change({'list': 'have', 'key': key, 'tick': t, 'on': on})


class Reading(Base):
    def test_missing_file_with_a_bak_reads_the_bak(self):
        self.put({'have': {'d:9': ['s']}}, self.bak)
        os.remove(self.file)
        self.assertEqual(self.serve.read(), {'have': {'d:9': ['s']}, 'went': [], 'costumes': []})
        self.assertEqual(self.tick('d:4'), {'ok': True})
        self.assertEqual(self.saved()['have'], {'d:9': ['s'], 'd:4': ['c']}, 'the next save starts from the .bak, not from nothing')

    def test_missing_file_and_no_bak_starts_empty(self):
        os.remove(self.file)
        self.assertEqual(self.serve.read(), EMPTY)
        self.tick('d:4')
        self.assertEqual(self.saved(), {'have': {'d:4': ['c']}, 'went': [], 'costumes': []})

    def test_broken_file_and_no_bak_refuses_and_leaves_it_alone(self):
        self.scribble('{"have": {"d:1"', self.file)
        before = self.raw()
        with self.assertRaises(RuntimeError):
            self.tick('d:4')
        self.assertEqual(self.raw(), before, 'a broken file with no .bak must never be saved over')
        self.assertFalse(os.path.exists(self.bak))

    def test_broken_file_with_a_bak_saves_from_the_bak_and_keeps_the_bak_whole(self):
        self.put({'have': {'d:7': ['c']}}, self.bak)
        self.scribble('{"have": ', self.file)
        self.assertEqual(self.tick('d:4'), {'ok': True})
        self.assertEqual(set(self.saved()['have']), {'d:7', 'd:4'})
        self.assertEqual(self.saved(self.bak), {'have': {'d:7': ['c']}}, 'the broken file was copied over the .bak')

    def test_broken_file_and_broken_bak_saves_nothing(self):
        self.scribble('nonsense', self.bak)
        self.scribble('{', self.file)
        with self.assertRaises(ValueError):
            self.tick('d:4')
        self.assertEqual(self.raw(), b'{')

    def test_a_file_saved_with_a_bom_is_read_and_saved_without_one(self):
        self.put({'have': {'d:1': ['c']}}, bom=True)
        self.assertEqual(self.serve.read()['have'], {'d:1': ['c']})
        self.tick('d:4')
        self.assertFalse(self.raw().startswith(b'\xef\xbb\xbf'))
        self.assertEqual(set(self.saved()['have']), {'d:1', 'd:4'})
        self.assertEqual(json.loads(self.raw(self.bak).decode('utf-8-sig')), {'have': {'d:1': ['c']}}, 'the copy before is the BOM file')

    def test_missing_lists_are_filled_in(self):
        self.put({'have': {'d:1': ['c']}})
        self.assertEqual(self.serve.read(), {'have': {'d:1': ['c']}, 'went': [], 'costumes': []})


class Writing(Base):
    def test_the_bak_is_the_copy_before_each_change(self):
        first = self.saved()
        self.tick('d:4')
        self.assertEqual(self.saved(self.bak), first)
        second = self.saved()
        self.tick('d:7')
        self.assertEqual(self.saved(self.bak), second)

    def test_no_temporary_files_left(self):
        for n in range(1, 6):
            self.tick(f'd:{n}')
        left = [f for f in os.listdir(os.path.dirname(self.file)) if f.endswith('.tmp')]
        self.assertEqual(left, [])

    def test_ticks_sorted_and_never_twice(self):
        for t in ('s', 'c', 's', 'l'):
            self.tick('d:25', t)
        self.assertEqual(self.saved()['have']['d:25'], ['c', 'l', 's'])

    def test_unticking_something_not_ticked_is_fine(self):
        self.assertEqual(self.tick('d:300', 's', False), {'ok': True})
        self.assertNotIn('d:300', self.saved()['have'])

    def test_lists_sorted_no_duplicates_and_untick(self):
        for key in ('b-event', 'a-event', 'b-event'):
            self.assertEqual(self.serve.change({'list': 'went', 'key': key, 'on': True}), {'ok': True})
        self.assertEqual(self.saved()['went'], ['a-event', 'b-event', 'go-fest-2023-london'])
        self.serve.change({'list': 'went', 'key': 'not-there', 'on': False})
        self.serve.change({'list': 'went', 'key': 'a-event', 'on': False})
        self.assertEqual(self.saved()['went'], ['b-event', 'go-fest-2023-london'])
        self.serve.change({'list': 'costumes', 'key': '25-gotour-2026-a', 'on': True})
        self.assertEqual(self.saved()['costumes'], ['1-fall-2019', '25-gotour-2026-a'])

    def test_keys_her_app_uses_are_taken(self):
        for key in ('d:37-alolan', 'd:201-exclamation', "d:83", 'c:25-gotour-2026-a', 'b:sb-gotour2026-gold:25-gotour-2026-b', 'b:go-fest-2025-paris:592-female'):
            with self.subTest(key):
                self.assertEqual(self.tick(key), {'ok': True})

    def test_bad_bodies_are_refused_and_nothing_written(self):
        before = self.raw()
        for body in ({'list': 'have', 'key': 'd:', 'tick': 'c', 'on': True},
                     {'list': 'have', 'key': 'd:' + 'x' * 121, 'tick': 'c', 'on': True},
                     {'list': 'have', 'key': 'd:25 26', 'tick': 'c', 'on': True},
                     {'list': 'have', 'key': 'd:25/../x', 'tick': 'c', 'on': True},
                     {'list': 'have', 'key': '25', 'tick': 'c', 'on': True},
                     {'list': 'have', 'key': 'd:25', 'on': True},
                     {'list': 'have', 'key': 'd:25', 'tick': 'C', 'on': True},
                     {'list': 'went', 'key': '', 'on': True},
                     {'list': 'went', 'key': 'two words', 'on': True},
                     {'list': 'costumes', 'key': 'x' * 121, 'on': True},
                     {'list': 'costumes', 'key': 'a/b', 'on': True},
                     {'key': 'd:25', 'tick': 'c', 'on': True},
                     {'list': 'collection', 'key': 'x', 'on': True},
                     {}):
            with self.subTest(body):
                self.assertFalse(self.serve.change(body).get('ok'))
        self.assertEqual(self.raw(), before)
        self.assertFalse(os.path.exists(self.bak), 'a refused change still wrote')


class Lock(Base):
    def test_threads_wait_their_turn(self):
        order = []
        def other():
            with self.serve.LOCK():
                order.append('other')
        with self.serve.LOCK():
            t = threading.Thread(target=other); t.start()
            time.sleep(.3)
            order.append('first')
        t.join(5)
        self.assertEqual(order, ['first', 'other'])

    def test_a_second_copy_waits_for_the_lock_file(self):
        # the other copy (8030 or 8031) holds go.json.lock: this one must wait, not save at the same time
        code = ('import importlib.util, sys, time\n'
                f'spec = importlib.util.spec_from_file_location("s", {self.serve.__file__!r})\n'
                'm = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)\n'
                'with m.LOCK():\n    print("held", flush=True); time.sleep(1.2)\n')
        proc = subprocess.Popen([sys.executable, '-X', 'utf8', '-c', code], stdout=subprocess.PIPE, text=True,
                                env={**os.environ, 'POKEDEX_ROOT': self.box.root})
        try:
            self.assertEqual(proc.stdout.readline().strip(), 'held')
            t0 = time.time()
            with self.serve.LOCK():
                waited = time.time() - t0
            self.assertGreater(waited, .5, 'got the lock while the other copy held it')
        finally:
            proc.wait(10)


class Http(Base):
    def setUp(self):
        super().setUp()
        self.httpd = self.serve.Server(('127.0.0.1', 0), functools.partial(self.serve.Handler, directory=self.serve.SITE))
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
        self.url = f'http://127.0.0.1:{self.httpd.server_port}'

    def tearDown(self):
        self.httpd.shutdown(); self.httpd.server_close()
        super().tearDown()

    def call(self, path, data=None, headers=None, method=None):
        req = urllib.request.Request(self.url + path, data=data, headers=headers or {}, method=method)
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read())

    def test_get_from_another_host_or_an_unknown_api(self):
        self.assertEqual(self.call('/api/collection', headers={'Host': 'evil.example'})[0], 403)
        self.assertEqual(self.call('/api/nothing')[0], 404)

    def test_post_anywhere_else_is_refused(self):
        self.assertEqual(self.call('/api/collection', b'{}', {'X-Pokedex': '1'}, 'POST')[0], 403)
        self.assertEqual(self.call('/api/tick', b'{}', {'X-Pokedex': '2'}, 'POST')[0], 403)

    def test_post_that_isnt_json_says_so(self):
        before = self.raw()
        code, body = self.call('/api/tick', b'{not json', {'X-Pokedex': '1', 'Content-Type': 'application/json'}, 'POST')
        self.assertEqual(code, 500); self.assertFalse(body['ok'])
        self.assertEqual(self.raw(), before)

    def test_post_with_a_broken_file_and_no_bak_says_why(self):
        self.scribble('{"have"', self.file)
        code, body = self.call('/api/tick', json.dumps({'list': 'have', 'key': 'd:4', 'tick': 'c', 'on': True}).encode(),
                               {'X-Pokedex': '1', 'Content-Type': 'application/json'}, 'POST')
        self.assertEqual(code, 500)
        self.assertIn('no .bak', body['error'])
        self.assertEqual(self.raw(), b'{"have"')

    def test_get_collection_reads_the_bak_when_the_file_is_missing(self):
        self.put({'have': {'d:9': ['c']}}, self.bak); os.remove(self.file)
        self.assertEqual(self.call('/api/collection'), (200, {'have': {'d:9': ['c']}, 'went': [], 'costumes': []}))


if __name__ == '__main__':
    unittest.main()
