"""Serve site/ at http://localhost:8030 for the Pokédex's app window, and save her ticks.

Started at login with no window by the shortcut tools/make_shortcuts.ps1 puts in her Startup folder, like Jemma's
Library's server. Only this computer can reach it. If it's already running, a second copy just stops.

    pythonw tools/serve.py              (port 8030, her app)
    python  tools/serve.py --port 8031  (a second copy for checking changes in the preview; same data)

    GET  /api/collection   everything she has ticked (data/collection/go.json)
    POST /api/tick         {list: "have", key, tick, on}   a box on a Pokémon, costume or background Pokémon
                           {list: "went" | "costumes", key, on}   an event she went to / a costume she's collecting
Posts need the header "X-Pokedex: 1", which only the site itself sends, so a page from anywhere else can't change it.
Each change is written straight away (to a temporary file, then swapped in), so nothing is lost if the PC goes off.
The weekly backup (tools/backup.py) saves it to git and zips it.
"""
import functools, http.server, json, os, re, sys, threading, time

PORT = int(sys.argv[sys.argv.index('--port') + 1]) if '--port' in sys.argv else 8030
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
FILE = os.path.join(ROOT, 'data', 'collection', 'go.json')
LOCK = threading.Lock()
KEY = re.compile(r'^[a-z]:[\w:.!?#\'’-]{1,120}$', re.I)   # d:<entry> c:<costume> b:<event>:<pokemon>
TICKS = {'c', 'cm', 'cf', 's', 'sm', 'sf', 'l', 'h'}


def read():
    if not os.path.exists(FILE):
        return {'have': {}, 'went': [], 'costumes': []}
    c = json.load(open(FILE, encoding='utf-8'))
    for k, v in (('have', {}), ('went', []), ('costumes', [])):
        c.setdefault(k, v)
    return c


def write(obj):
    os.makedirs(os.path.dirname(FILE), exist_ok=True)
    tmp = f'{FILE}.{os.getpid()}.tmp'
    with open(tmp, 'w', encoding='utf-8', newline='\n') as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=1, sort_keys=True)
        fh.write('\n')
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
        if not KEY.match(key) or tick not in TICKS:
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

    def do_GET(self):
        if self.path.startswith('/api/'):
            if not self.host_ok():
                return self.reply({'error': 'not allowed'}, 403)
            if self.path == '/api/collection':
                with LOCK:
                    return self.reply(read())
            return self.reply({'error': 'unknown'}, 404)
        return super().do_GET()

    def do_POST(self):
        if self.path != '/api/tick' or self.headers.get('X-Pokedex') != '1' or not self.host_ok():
            return self.reply({'error': 'not allowed'}, 403)
        try:
            body = json.loads(self.rfile.read(min(int(self.headers.get('Content-Length', 0)), 10000)) or b'{}')
            with LOCK:
                self.reply(change(body))
        except Exception as e:
            self.reply({'ok': False, 'error': str(e)}, 500)


class Server(http.server.ThreadingHTTPServer):
    allow_reuse_address = False   # on Windows "reuse" lets a second copy share the port; it must fail and stop instead


def main():
    try:
        server = Server(('127.0.0.1', PORT), functools.partial(Handler, directory=SITE))
    except OSError:
        sys.exit(0)
    server.serve_forever()


if __name__ == '__main__':
    main()
