"""Page tests: the real site (a throwaway copy, served by the real server code on a spare port) in headless Chrome or
Edge, with tests/e2e/site.test.js loaded into it. Each JavaScript test shows here as its own result. Ticks the tests
make go into the throwaway copy only."""
import functools, http.server, json, os, queue, shutil, subprocess, sys, tempfile, threading, unittest
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from support import HERE, Sandbox, fingerprint, load

BROWSERS = [r'C:\Program Files\Google\Chrome\Application\chrome.exe', r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe']
BROWSER = next((b for b in BROWSERS if os.path.exists(b)), None)


# __stub__.html: the page with a stand-in fetch before its own scripts, so api/collection answers as ?answer= says (the
# view-only and server-failure tests, 22 Nov); POSTs are never sent. A file of its own, __tests__/stub.js, as the page's
# Content Security Policy (22 Nov) runs only the site's own files, never inline code.
STUB_JS = r"""(function(){ var rf = window.fetch.bind(window), a = new URLSearchParams(location.search).get("answer"); window.__posts = [];
  var json = {"Content-Type": "application/json"}, answers = {
    "404": function(){ return Promise.resolve(new Response("Not found", {status: 404})); },
    "405": function(){ return Promise.resolve(new Response("", {status: 405})); },
    "none": function(){ return Promise.reject(new TypeError("Failed to fetch")); },
    "html": function(){ return Promise.resolve(new Response("<!doctype html><p>a web host's page", {status: 200, headers: {"Content-Type": "text/html"}})); },
    "500": function(){ return Promise.resolve(new Response(JSON.stringify({error: "x"}), {status: 500, headers: json})); },
    "broken": function(){ return Promise.resolve(new Response("{broken", {status: 200, headers: json})); },
    "503": function(){ return Promise.resolve(new Response("The pokedex server (port 8030) is not running", {status: 503})); } };
  window.fetch = function(u, o){ u = String(u);
    if (o && o.method && o.method !== "GET") { window.__posts.push(u); return Promise.reject(new TypeError("blocked in the test")); }
    if (/api\/collection/.test(u) && answers[a]) { window.__answered = true; return answers[a](); }
    return rf(u, o); }; })();"""
# __tests__/csp-watch.js, first in <head> of the throwaway copy's index.html (so every window the tests open has it):
# notes every Content Security Policy violation, in this window and in the test page's list (the CSP test, 22 Nov)
CSP_WATCH = r"""(function(){ window.__csp = [];
  document.addEventListener("securitypolicyviolation", function(e){ var t = e.violatedDirective + " " + e.blockedURI + " " + (e.sourceFile || "") + ":" + e.lineNumber + " (" + location.pathname + ")";
    window.__csp.push(t); try { if (window.top !== window && window.top.__csp) window.top.__csp.push(t); } catch (x) {} }); })();"""
WATCH_TAG = '<script src="__tests__/csp-watch.js"></script>'



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
        _Results.box = queue.Queue()
        inbox = http.server.ThreadingHTTPServer(('127.0.0.1', 0), _Results)
        os.makedirs(os.path.join(site, '__tests__'))
        for name, text in (('csp-watch.js', CSP_WATCH), ('stub.js', STUB_JS)):
            open(os.path.join(site, '__tests__', name), 'w', encoding='utf-8').write(text)
        shutil.copy(os.path.join(HERE, 'e2e', 'site.test.js'), os.path.join(site, '__tests__', 'site.test.js'))
        real = open(os.path.join(site, 'index.html'), encoding='utf-8').read()
        assert 'http-equiv="Content-Security-Policy"' in real, 'index.html has no Content Security Policy'
        index = real.replace('<head>', '<head>' + WATCH_TAG, 1)   # the copy only
        open(os.path.join(site, 'index.html'), 'w', encoding='utf-8').write(index)
        # the test page: the same policy, except that it may send its results to the inbox (another port) and open the
        # site in frames of its own (same site), as the tests do; every window it opens keeps the real policy
        page = index.replace("connect-src 'self'", f"connect-src 'self' http://127.0.0.1:{inbox.server_port}").replace("frame-src 'none'", "frame-src 'self'")
        page = page.replace('</body>', '<script src="__tests__/site.test.js"></script></body>')
        open(os.path.join(site, '__test__.html'), 'w', encoding='utf-8').write(page)
        open(os.path.join(site, '__stub__.html'), 'w', encoding='utf-8').write(index.replace(WATCH_TAG, WATCH_TAG + '<script src="__tests__/stub.js"></script>', 1))
        serve = load('serve')
        assert serve.FILE.startswith(box.root)
        httpd = serve.Server(('127.0.0.1', 0), functools.partial(serve.Handler, directory=serve.SITE))
        for srv in (httpd, inbox):
            threading.Thread(target=srv.serve_forever, daemon=True).start()
        profile = tempfile.mkdtemp(prefix='pokedex-chrome-')
        chrome = subprocess.Popen([BROWSER, '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
                                   '--disable-extensions', f'--user-data-dir={profile}', '--window-size=1280,900',
                                   '--force-dark-mode',   # the device set to dark: the page must still open light (family rules, 21 Nov)
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
        for r in self.results:
            if r.get('known'):
                print(f"    known app bug (expected failure): {r['name']}: {r['known']}", file=sys.stderr)


if __name__ == '__main__':
    unittest.main()
