"""Page tests: the real site (a throwaway copy, served by the real server code on a spare port) in headless Chrome or
Edge, with tests/e2e/site.test.js loaded into it. Each JavaScript test shows here as its own result. Ticks the tests
make go into the throwaway copy only."""
import functools, http.server, json, os, queue, shutil, subprocess, sys, tempfile, threading, unittest
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from support import HERE, Sandbox, fingerprint, load

BROWSERS = [r'C:\Program Files\Google\Chrome\Application\chrome.exe', r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe']
BROWSER = next((b for b in BROWSERS if os.path.exists(b)), None)


class _Results(http.server.BaseHTTPRequestHandler):
    """Receives the page's results (the page sends them here when it's done)."""
    box = None

    def log_message(self, *a):
        pass

    def do_POST(self):
        _Results.box.put(self.rfile.read(int(self.headers.get('Content-Length', 0))).decode('utf-8'))
        self.send_response(204); self.end_headers()


def run_page_tests(timeout=900):
    with Sandbox() as box:
        col = box.read('collection', 'go.json'); col['have'] = {}; box.write(col, 'collection', 'go.json')   # start with no ticks (the copy only), whatever she has ticked
        site = box.path('site')
        page = open(os.path.join(site, 'index.html'), encoding='utf-8').read()
        page = page.replace('</body>', '<script src="__tests__/site.test.js"></script></body>')
        open(os.path.join(site, '__test__.html'), 'w', encoding='utf-8').write(page)
        os.makedirs(os.path.join(site, '__tests__'))
        shutil.copy(os.path.join(HERE, 'e2e', 'site.test.js'), os.path.join(site, '__tests__', 'site.test.js'))
        serve = load('serve')
        assert serve.FILE.startswith(box.root)
        httpd = serve.Server(('127.0.0.1', 0), functools.partial(serve.Handler, directory=serve.SITE))
        _Results.box = queue.Queue()
        inbox = http.server.ThreadingHTTPServer(('127.0.0.1', 0), _Results)
        for srv in (httpd, inbox):
            threading.Thread(target=srv.serve_forever, daemon=True).start()
        profile = tempfile.mkdtemp(prefix='pokedex-chrome-')
        chrome = subprocess.Popen([BROWSER, '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
                                   '--disable-extensions', f'--user-data-dir={profile}', '--window-size=1280,900',
                                   f'http://127.0.0.1:{httpd.server_port}/__test__.html?report={inbox.server_port}'],
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            body = _Results.box.get(timeout=timeout)
        except queue.Empty:
            raise RuntimeError(f'the page tests didn’t report back within {timeout} seconds')
        finally:
            chrome.kill(); chrome.wait()
            for srv in (httpd, inbox):
                srv.shutdown(); srv.server_close()
            shutil.rmtree(profile, ignore_errors=True)
        return json.loads(body)


@unittest.skipUnless(BROWSER, 'needs Chrome or Edge')
class Site(unittest.TestCase):
    results = None

    @classmethod
    def setUpClass(cls):
        cls.before = fingerprint()
        cls.results = run_page_tests()
        cls.after = fingerprint()

    def test_her_ticks_file_untouched(self):   # its own result, so the page results still show if it fails
        self.assertEqual(self.after, self.before, 'her real ticks file changed during the page tests (if she was ticking in the app at the time, that explains it: run again)')

    def test_pages(self):
        for r in self.results:
            with self.subTest(r['name']):
                self.assertTrue(r['ok'], r.get('error'))
        print(f"\n    {sum(r['ok'] for r in self.results)} of {len(self.results)} page tests passed", file=sys.stderr)


if __name__ == '__main__':
    unittest.main()
