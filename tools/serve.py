"""Serve site/ at http://localhost:8030 for the Pokédex's app window, and save her ticks.

Started at login with no window by the shortcut tools/make_shortcuts.ps1 puts in her Startup folder, like Jemma's
Library's server. Only this computer can reach it. If it's already running, a second copy just stops.

    pythonw tools/serve.py              (port 8030, her app)
    python  tools/serve.py --port 8031  (a second copy for checking changes in the preview; same data)

    GET  /api/collection   everything she has ticked (data/collection/go.json)
    GET  /family/<file>    the family's shared code (mode.js, family.js, family.css), from Jemma's Journals, the parent
                           folder (its site/family/; her decision, 22 Nov: all shared code lives there and every app
                           loads it at /family/, as the family server on 8050 and, online, the one address do)
    POST /api/tick         {list: "have", key, tick, on}   a box on a Pokémon, costume or background Pokémon
                           {list: "went" | "costumes", key, on}   an event she went to / a costume she's collecting
Posts need the header "X-Pokedex: 1", which only the site itself sends, so a page from anywhere else can't change it.
Each change is written straight away (to a temporary file, then swapped in), so nothing is lost if the PC goes off.
The weekly backup (tools/backup.py) saves it to git and zips it.
"""
import contextlib, functools, http.server, json, os, re, shutil, sys, threading, time, urllib.parse

PORT = int(sys.argv[sys.argv.index('--port') + 1]) if '--port' in sys.argv else 8030
ROOT = os.environ.get('POKEDEX_ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # POKEDEX_ROOT: the tests' throwaway copy
SITE = os.path.join(ROOT, 'site')
FILE = os.path.join(ROOT, 'data', 'collection', 'go.json')
FAMILY = os.path.normpath(os.path.join(ROOT, '..', 'site', 'family'))   # Jemma's Journals' shared code (the tests' copy has one beside it too)
THREADS = threading.Lock()


@contextlib.contextmanager
def LOCK():
    """One change at a time, across this server's threads and across both copies (8030 and 8031 save to the same file;
    the 15 Nov review showed 5 of 200 ticks lost when the two saved at once): a lock on go.json.lock as well."""
    with THREADS:
        os.makedirs(os.path.dirname(FILE), exist_ok=True)
        fh = open(FILE + '.lock', 'a+b')
        try:
            for n in range(200):   # up to 20 seconds
                try:
                    if os.name == 'nt':
                        import msvcrt
                        fh.seek(0)
                        msvcrt.locking(fh.fileno(), msvcrt.LK_NBLCK, 1)
                    else:
                        import fcntl
                        fcntl.flock(fh.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                    break
                except OSError:
                    if n == 199:
                        raise
                    time.sleep(.1)
            try:
                yield
            finally:
                if os.name == 'nt':
                    import msvcrt
                    fh.seek(0)
                    msvcrt.locking(fh.fileno(), msvcrt.LK_UNLCK, 1)
                else:
                    import fcntl
                    fcntl.flock(fh.fileno(), fcntl.LOCK_UN)
        finally:
            fh.close()
KEY = re.compile(r'^[a-z]:[\w:.!?#\'’-]{1,120}$', re.I)   # d:<entry> c:<costume> b:<event>:<pokemon>
TICKS = {'c', 'cm', 'cf', 's', 'l', 'h', 'sd', 'pu', 'dx', 'gx', 'ss', 'mg', 'mx', 'my', 'xl', 'xs'}   # caught, male, female, shiny, lucky, 4★, shadow, purified, Dynamax, Gigantamax, shiny shadow (a bonus), Mega (or Primal), Mega X, Mega Y, XXL, XXS


def read():
    # utf-8-sig: a file saved by Notepad or PowerShell starts with a BOM, which isn't a broken file (19 Nov review)
    try:
        with open(FILE, encoding='utf-8-sig') as fh:
            c = json.load(fh)
    except (FileNotFoundError, ValueError):
        # missing (moved for a moment, a git checkout) or broken (the PC went off mid-save): the copy before the last
        # change. Missing too: a first start, so empty. Never start from empty while a .bak exists, or the next two
        # saves would replace both files with almost nothing (19 Nov review)
        if not os.path.exists(FILE + '.bak'):
            if os.path.exists(FILE):
                raise RuntimeError(f'{FILE} is broken and there is no .bak copy: nothing saved, fix it by hand')
            return {'have': {}, 'went': [], 'costumes': []}
        with open(FILE + '.bak', encoding='utf-8-sig') as fh:
            c = json.load(fh)
    for k, v in (('have', {}), ('went', []), ('costumes', [])):
        c.setdefault(k, v)
    return c


def write(obj):
    os.makedirs(os.path.dirname(FILE), exist_ok=True)
    tmp = f'{FILE}.{os.getpid()}.tmp'
    with open(tmp, 'w', encoding='utf-8', newline='\n') as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=1, sort_keys=True)
        fh.write('\n')
        fh.flush()
        os.fsync(fh.fileno())   # on the disk before it's swapped in, so a power cut can't leave an empty file
    try:
        with open(FILE, encoding='utf-8-sig') as fh:
            json.load(fh)
        shutil.copyfile(FILE, FILE + '.bak')   # the copy before this change, only if it's whole
    except (OSError, ValueError):
        pass
    for n in range(10):   # Windows refuses the swap while the file is being read: try again for a moment
        try:
            return os.replace(tmp, FILE)
        except PermissionError:
            if n == 9:
                raise
            time.sleep(.2)


def change(body):
    lst, key, on = body.get('list'), str(body.get('key', '')), bool(body.get('on'))
    c = read()
    if lst == 'have':
        tick = body.get('tick')
        if not KEY.match(key) or not isinstance(tick, str) or tick not in TICKS:
            return {'ok': False, 'error': 'Not a box this page has.'}
        ticks = set(c['have'].get(key, []))
        (ticks.add if on else ticks.discard)(tick)
        if ticks:
            c['have'][key] = sorted(ticks)
        else:
            c['have'].pop(key, None)
    elif lst in ('went', 'costumes'):
        if not re.fullmatch(r'[\w-]{1,120}', key):
            return {'ok': False, 'error': 'No such item.'}
        items = set(c[lst])
        (items.add if on else items.discard)(key)
        c[lst] = sorted(items)
    else:
        return {'ok': False, 'error': 'Unknown list.'}
    write(c)
    return {'ok': True}


class Handler(http.server.SimpleHTTPRequestHandler):
    server_version, sys_version = 'Pokedex', ''

    def log_message(self, *args):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')   # a rebuild shows at once
        super().end_headers()

    def reply(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def host_ok(self):
        return (self.headers.get('Host') or '').split(':')[0] in ('localhost', '127.0.0.1')

    def family(self):
        """/family/<file>: a file from Jemma's Journals' site/family/, only an existing file inside that folder."""
        if not self.host_ok():
            return self.reply({'error': 'not allowed'}, 403)
        name = urllib.parse.unquote(self.path.split('?', 1)[0].split('#', 1)[0][len('/family/'):])
        path = os.path.realpath(os.path.join(FAMILY, *[p for p in name.split('/') if p]))
        base = os.path.realpath(FAMILY)
        if not name or '\\' in name or ':' in name or '..' in name.split('/') or os.path.commonpath([path, base]) != base or not os.path.isfile(path):
            return self.send_error(404)
        with open(path, 'rb') as fh:
            data = fh.read()
        self.send_response(200)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path.startswith('/family/'):
            return self.family()
        if self.path.startswith('/api/'):
            if not self.host_ok():
                return self.reply({'error': 'not allowed'}, 403)
            if self.path == '/api/collection':
                with LOCK():
                    c = read()
                return self.reply(c)
            return self.reply({'error': 'unknown'}, 404)
        return super().do_GET()

    def do_POST(self):
        if self.path != '/api/tick' or self.headers.get('X-Pokedex') != '1' or not self.host_ok():
            return self.reply({'error': 'not allowed'}, 403)
        try:
            body = json.loads(self.rfile.read(min(int(self.headers.get('Content-Length', 0)), 10000)) or b'{}')
            with LOCK():
                r = change(body)
            self.reply(r)
        except Exception as e:
            self.reply({'ok': False, 'error': str(e)}, 500)


class Server(http.server.ThreadingHTTPServer):
    allow_reuse_address = False   # on Windows "reuse" lets a second copy share the port; it must fail and stop instead
    request_queue_size = 64   # a page asks for many pictures at once: Python's default queue of 5 refused some (round 3 review)
    daemon_threads = True


def main():
    try:
        server = Server(('127.0.0.1', PORT), functools.partial(Handler, directory=SITE))
    except OSError:
        sys.exit(0)
    server.serve_forever()


if __name__ == '__main__':
    main()
