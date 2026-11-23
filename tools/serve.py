"""Serve site/ at http://localhost:8030 for the Pokédex's app window, and save her ticks.

Started with no window by Jemma's Journals' family server (tools/serve_all.py in the parent, http://localhost:8050), which
passes /pokedex/api/* on to it and starts it if it's down; her shortcuts open the Pokédex there. (There is no Startup-folder
copy; tools/make_shortcuts.ps1 -Startup would make one.) Only this computer can reach it. If it's already running, a second
copy just stops.

    pythonw tools/serve.py              (port 8030, her app)
    python  tools/serve.py --port 8031  (a second copy for checking changes in the preview; same data)

    GET  /api/collection   everything she has ticked in Pokémon GO (data/collection/go.json)
    GET  /api/collection?game=home   her Pokémon HOME ticks (data/collection/home.json; 22 Nov, her ask: HOME fully built)
    GET  /api/collection?game=shield   her Pokémon Shield ticks (data/collection/shield.json; 23 Nov)
    GET  /api/collection?game=arceus   her Pokémon Legends: Arceus ticks (data/collection/arceus.json; 23 Nov)
    GET  /family/<file>    the family's shared code (mode.js, family.js, family.css), from Jemma's Journals, the parent
                           folder (its site/family/; her decision, 22 Nov: all shared code lives there and every app
                           loads it at /family/, as the family server on 8050 and, online, the one address do)
    POST /api/tick         {list: "have", key, tick, on}   a box on a Pokémon, costume or background Pokémon
                           {list: "went" | "costumes", key, on}   an event she went to / a costume she's collecting
                           {game: "home", list: "have", key, tick, on}   a box in Pokémon HOME (home.json; only HOME's boxes)
Posts need the header "X-Pokedex: 1", which only the site itself sends, so a page from anywhere else can't change it.
Each change is written straight away (to a temporary file, then swapped in), so nothing is lost if the PC goes off.
The daily backup (tools/backup.py, run by the parent's tools/weekly.py) commits it and pushes it to GitHub.
"""
import contextlib, functools, http.server, json, os, re, shutil, sys, threading, time, urllib.parse

PORT = int(sys.argv[sys.argv.index('--port') + 1]) if '--port' in sys.argv else 8030
ROOT = os.environ.get('POKEDEX_ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # POKEDEX_ROOT: the tests' throwaway copy
SITE = os.path.join(ROOT, 'site')
FILE = os.path.join(ROOT, 'data', 'collection', 'go.json')
# each game its own ticks file (her decision, 22 Nov: GO's file and its keys never change; HOME's ticks beside it)
FILES = {'go': FILE, 'home': os.path.join(ROOT, 'data', 'collection', 'home.json'),
         'shield': os.path.join(ROOT, 'data', 'collection', 'shield.json'),   # Pokémon Shield (23 Nov: the games in release order)
         'arceus': os.path.join(ROOT, 'data', 'collection', 'arceus.json')}   # Pokémon Legends: Arceus (23 Nov)
FAMILY = os.path.normpath(os.path.join(ROOT, '..', 'site', 'family'))   # Jemma's Journals' shared code (the tests' copy has one beside it too)
THREADS = threading.Lock()


@contextlib.contextmanager
def LOCK(file=None):
    """One change at a time, across this server's threads and across both copies (8030 and 8031 save to the same file;
    the 15 Nov review showed 5 of 200 ticks lost when the two saved at once): a lock on go.json.lock (home.json.lock) as well."""
    file = file or FILE
    with THREADS:
        os.makedirs(os.path.dirname(file), exist_ok=True)
        fh = open(file + '.lock', 'a+b')
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
# Pokémon HOME's boxes: only what HOME has (her note, 22 Nov: no Lucky there; research/home-tracking.md): in HOME now, female,
# male, shiny, and Gigantamax (a Pokémon with the Gigantamax Factor kept in HOME)
HOME_TICKS = {'c', 'cm', 'cf', 's', 'gx'}
# Legends: Arceus: Caught, Female, Male, Shiny, Alpha ("al") and Complete ("rc", Research Level 10) (her answer, 23 Nov)
ARCEUS_TICKS = {'c', 'cm', 'cf', 's', 'al', 'rc'}
GAME_TICKS = {'go': TICKS, 'home': HOME_TICKS, 'shield': HOME_TICKS, 'arceus': ARCEUS_TICKS}   # Shield: Caught, Female, Male, Shiny, Gigantamax (her answer, 23 Nov)


def read(file=None):
    # utf-8-sig: a file saved by Notepad or PowerShell starts with a BOM, which isn't a broken file (19 Nov review)
    file = file or FILE
    try:
        with open(file, encoding='utf-8-sig') as fh:
            c = json.load(fh)
    except (FileNotFoundError, ValueError):
        # missing (moved for a moment, a git checkout) or broken (the PC went off mid-save): the copy before the last
        # change. Missing too: a first start, so empty. Never start from empty while a .bak exists, or the next two
        # saves would replace both files with almost nothing (19 Nov review)
        if not os.path.exists(file + '.bak'):
            if os.path.exists(file):
                raise RuntimeError(f'{file} is broken and there is no .bak copy: nothing saved, fix it by hand')
            return {'have': {}, 'went': [], 'costumes': []}
        with open(file + '.bak', encoding='utf-8-sig') as fh:
            c = json.load(fh)
    for k, v in (('have', {}), ('went', []), ('costumes', [])):
        c.setdefault(k, v)
    return c


def write(obj, file=None):
    file = file or FILE
    os.makedirs(os.path.dirname(file), exist_ok=True)
    tmp = f'{file}.{os.getpid()}.tmp'
    with open(tmp, 'w', encoding='utf-8', newline='\n') as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=1, sort_keys=True)
        fh.write('\n')
        fh.flush()
        os.fsync(fh.fileno())   # on the disk before it's swapped in, so a power cut can't leave an empty file
    try:
        with open(file, encoding='utf-8-sig') as fh:
            json.load(fh)
        shutil.copyfile(file, file + '.bak')   # the copy before this change, only if it's whole
    except (OSError, ValueError):
        pass
    for n in range(10):   # Windows refuses the swap while the file is being read: try again for a moment
        try:
            return os.replace(tmp, file)
        except PermissionError:
            if n == 9:
                raise
            time.sleep(.2)


def game_file(game):
    """The ticks file for a game: GO's when none is given (every GO save as before), HOME's own; None for anything else."""
    if game is None:
        game = 'go'
    return FILES.get(game) if isinstance(game, str) else None


def change(body, file=None):
    lst, key, on = body.get('list'), str(body.get('key', '')), bool(body.get('on'))
    game = body.get('game') or 'go'
    file = file or game_file(game)
    if not file:
        return {'ok': False, 'error': 'Unknown game.'}
    c = read(file)
    if lst == 'have':
        tick = body.get('tick')
        if not KEY.match(key) or not isinstance(tick, str) or tick not in GAME_TICKS[game]:
            return {'ok': False, 'error': 'Not a box this page has.'}
        ticks = set(c['have'].get(key, []))
        (ticks.add if on else ticks.discard)(tick)
        if ticks:
            c['have'][key] = sorted(ticks)
        else:
            c['have'].pop(key, None)
    elif lst in ('went', 'costumes') and game == 'go':   # events and costumes are GO's alone
        if not re.fullmatch(r'[\w-]{1,120}', key):
            return {'ok': False, 'error': 'No such item.'}
        items = set(c[lst])
        (items.add if on else items.discard)(key)
        c[lst] = sorted(items)
    else:
        return {'ok': False, 'error': 'Unknown list.'}
    write(c, file)
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
            path, _, query = self.path.partition('?')
            if path == '/api/collection':
                file = game_file(urllib.parse.parse_qs(query).get('game', ['go'])[0])
                if not file:
                    return self.reply({'error': 'unknown game'}, 404)
                with LOCK(file):
                    c = read(file)
                return self.reply(c)
            return self.reply({'error': 'unknown'}, 404)
        return super().do_GET()

    def do_POST(self):
        if self.path != '/api/tick' or self.headers.get('X-Pokedex') != '1' or not self.host_ok():
            return self.reply({'error': 'not allowed'}, 403)
        try:
            body = json.loads(self.rfile.read(min(int(self.headers.get('Content-Length', 0)), 10000)) or b'{}')
            file = game_file(body.get('game')) if isinstance(body, dict) else None
            if not file:
                return self.reply({'ok': False, 'error': 'Unknown game.'})
            with LOCK(file):
                r = change(body, file)
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
