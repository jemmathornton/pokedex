"""Real key presses and the page opened as a file (round 4 review, 22 Nov): tests/e2e/keys.test.js in Edge through the
Playwright shared in Jemma's Journals (skipped when Node or Playwright isn't there, e.g. this repo on its own). It runs on a
throwaway copy served by the real server code; every POST is blocked in the browser, so nothing is saved."""
import functools, json, os, subprocess, sys, threading, unittest
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from support import HERE, REAL, Sandbox, fingerprint, load

PARENT = os.path.dirname(REAL)
NODE = os.path.join(PARENT, '.tools', 'node', 'node.exe')
PLAYWRIGHT = os.path.join(PARENT, 'node_modules', 'playwright')


@unittest.skipUnless(os.path.exists(NODE) and os.path.isdir(PLAYWRIGHT), "needs Jemma's Journals' Node and Playwright")
class Keys(unittest.TestCase):
    def test_keys_and_file_mode(self):
        before = fingerprint()
        with Sandbox() as box:
            serve = load('serve')
            assert serve.FILE.startswith(box.root)
            httpd = serve.Server(('127.0.0.1', 0), functools.partial(serve.Handler, directory=serve.SITE))
            threading.Thread(target=httpd.serve_forever, daemon=True).start()
            try:
                page = os.path.join(box.path('site'), 'index.html').replace('\\', '/')
                env = dict(os.environ, PLAYWRIGHT=PLAYWRIGHT)
                run = subprocess.run([NODE, os.path.join(HERE, 'e2e', 'keys.test.js'), f'http://127.0.0.1:{httpd.server_port}/',
                                      'file:///' + page], capture_output=True, text=True, encoding='utf-8', timeout=600, env=env)
            finally:
                httpd.shutdown(); httpd.server_close()
        lines = [l for l in run.stdout.splitlines() if l.startswith('[')]
        self.assertTrue(lines, f'no results from keys.test.js: {run.stdout[-1500:]} {run.stderr[-1500:]}')
        for r in json.loads(lines[-1]):
            with self.subTest(r['name']):
                self.assertTrue(r['ok'], r.get('error'))
        self.assertEqual(fingerprint(), before, 'her real ticks file changed')


if __name__ == '__main__':
    unittest.main()
