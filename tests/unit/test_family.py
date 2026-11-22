"""The family's shared code (22 Nov, her decision: it lives in Jemma's Journals and every app loads it at /family/): the
server hands out the files from the parent's site/family/ and nothing else; and the weekly backup records the new version
in the parent after a push. All on a throwaway copy laid out like her PC (tests/support.py); her real file is checked unchanged."""
import functools, http.client, os, sys, tempfile, threading, unittest
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from support import REAL_FAMILY, LightSandbox, fingerprint, load


@unittest.skipUnless(os.path.isdir(REAL_FAMILY), "needs Jemma's Journals' site/family/ beside this folder")
class FamilyFiles(unittest.TestCase):
    def setUp(self):
        self.before = fingerprint()
        self.box = LightSandbox(with_data=False).__enter__()
        serve = load('serve')
        self.assertTrue(serve.FAMILY.startswith(self.box.base), 'the copy should serve its own family folder')
        self.httpd = serve.Server(('127.0.0.1', 0), functools.partial(serve.Handler, directory=serve.SITE))
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()

    def tearDown(self):
        self.httpd.shutdown(); self.httpd.server_close()
        self.box.__exit__(None, None, None)
        self.assertEqual(fingerprint(), self.before, 'her real ticks file changed during a test')

    def get(self, path, host='localhost'):
        c = http.client.HTTPConnection('127.0.0.1', self.httpd.server_port, timeout=10)
        c.putrequest('GET', path, skip_host=True); c.putheader('Host', f'{host}:{self.httpd.server_port}'); c.endheaders()
        r = c.getresponse(); body = r.read(); c.close()
        return r.status, r.getheader('Content-Type') or '', body

    def test_the_shared_files_load(self):
        for name, kind in (('mode.js', 'javascript'), ('family.js', 'javascript'), ('family.css', 'css')):
            status, ctype, body = self.get('/family/' + name)
            self.assertEqual(status, 200, name)
            self.assertIn(kind, ctype, name)
            self.assertEqual(body, open(os.path.join(REAL_FAMILY, name), 'rb').read(), name)
        self.assertIn(b'JJFamily', self.get('/family/family.js?v=1')[2])

    def test_nothing_else(self):
        for path in ('/family/', '/family/nope.js', '/family/../index.html', '/family/%2e%2e/index.html', '/family/..%2findex.html',
                     '/family/..%5cindex.html', '/family/C:%5cWindows%5cwin.ini', '/family/%2e%2e/pokedex/data/collection/go.json'):
            self.assertEqual(self.get(path)[0], 404, path)

    def test_only_this_computer(self):
        self.assertEqual(self.get('/family/mode.js', host='evil.example')[0], 403)

    def test_the_page_asks_for_them(self):
        page = open(os.path.join(self.box.root, 'site', 'index.html'), encoding='utf-8').read()
        for tag in ('<script src="/family/mode.js" data-old-key="jemmas-pokedex-mode"></script>', '<link rel="stylesheet" href="/family/family.css">',
                    '<script src="/family/family.js" defer></script>'):
            self.assertIn(tag, page)
        self.assertLess(page.index('/family/family.css'), page.index('site.css'), "the family's styles first, so the Pokédex's own win")
        self.assertLess(page.index('/family/mode.js'), page.index('site.css'), 'the mode set before the page draws')


class BackupRecordsInParent(unittest.TestCase):
    """tools/backup.py: after a push that worked, the parent's tools/record_apps.py; never fails the backup."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix='pokedex-backup-')
        self.backup = load('backup')
        self.backup.ROOT = os.path.join(self.tmp, 'pokedex')
        self.backup.LOG = os.path.join(self.tmp, 'backup.log')
        os.makedirs(self.backup.ROOT)

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmp, ignore_errors=True)

    def parent_script(self, code):
        os.makedirs(os.path.join(self.tmp, 'tools'), exist_ok=True)
        with open(os.path.join(self.tmp, 'tools', 'record_apps.py'), 'w', encoding='utf-8') as fh:
            fh.write(code)

    def log(self):
        return open(self.backup.LOG, encoding='utf-8').read() if os.path.exists(self.backup.LOG) else ''

    def test_recorded_and_logged(self):
        self.parent_script('import os; print("pokedex: recorded", os.getcwd())')
        self.backup.record_in_parent()
        self.assertIn('parent: recorded: pokedex: recorded', self.log())
        self.assertIn(os.path.normcase(self.tmp), os.path.normcase(self.log()), 'run from the parent folder')

    def test_a_failure_is_only_logged(self):
        self.parent_script('import sys; print("pokedex: has uncommitted changes, not recorded"); sys.exit(1)')
        self.backup.record_in_parent()   # no exception
        self.assertIn('parent: record_apps.py failed: pokedex: has uncommitted changes', self.log())

    def test_no_parent_nothing_done(self):
        self.backup.record_in_parent()
        self.assertEqual(self.log(), '')

    def test_only_after_a_push_that_worked(self):
        calls = []
        self.backup.refresh_events = lambda: None
        self.backup.git = lambda *a: type('R', (), {'stdout': '', 'returncode': 0, 'stderr': ''})()
        self.backup.record_in_parent = lambda: calls.append('recorded')
        self.backup.push = lambda: False
        self.backup.main()
        self.assertEqual(calls, [])
        self.backup.push = lambda: True
        self.backup.main()
        self.assertEqual(calls, ['recorded'])


if __name__ == '__main__':
    unittest.main()
