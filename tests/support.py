"""Shared test setup: a throwaway copy of the Pokédex for each test that writes, so the tests never touch her files.

A sandbox is a temporary folder laid out like the project: data/ copied (her ticks included, so tests see real-looking
data), and site/ with its pictures linked rather than copied (hard links: instant and take no space; nothing in the code
writes into a picture). index.html and js/ are real copies because the build writes them. The scripts in tools/ are
loaded fresh with POKEDEX_ROOT pointing at the sandbox.
"""
import hashlib, importlib.util, json, os, shutil, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
REAL = os.path.dirname(HERE)
TOOLS = os.path.join(REAL, 'tools')
PYTHON = sys.executable
if TOOLS not in sys.path:
    sys.path.insert(0, TOOLS)
REAL_TICKS = os.path.join(REAL, 'data', 'collection', 'go.json')


def fingerprint(path=REAL_TICKS):
    """Her real ticks file's fingerprint, to check afterwards that no test changed it."""
    return hashlib.sha256(open(path, 'rb').read()).hexdigest() if os.path.exists(path) else None


def _link_tree(src, dst):
    os.makedirs(dst, exist_ok=True)
    for name in os.listdir(src):
        s, d = os.path.join(src, name), os.path.join(dst, name)
        if os.path.isdir(s):
            _link_tree(s, d)
        else:
            try:
                os.link(s, d)
            except OSError:
                shutil.copy2(s, d)


class Sandbox:
    """with Sandbox() as box: ...  -> a copy of the project at box.root, removed afterwards."""

    def __init__(self, imports=False):
        self.imports = imports   # link the saved GO downloads too (only the import test needs them)

    def __enter__(self):
        self.root = tempfile.mkdtemp(prefix='pokedex-test-')
        shutil.copytree(os.path.join(REAL, 'data'), os.path.join(self.root, 'data'), ignore=shutil.ignore_patterns('*.tmp'))
        os.makedirs(os.path.join(self.root, 'logs'))
        if self.imports and os.path.isdir(os.path.join(REAL, 'imports')):
            _link_tree(os.path.join(REAL, 'imports'), os.path.join(self.root, 'imports'))
        else:
            os.makedirs(os.path.join(self.root, 'imports'))
        site = os.path.join(self.root, 'site')
        _link_tree(os.path.join(REAL, 'site'), site)
        for name in ('index.html',):   # written by the build: real copies, never links
            os.remove(os.path.join(site, name)); shutil.copy2(os.path.join(REAL, 'site', name), os.path.join(site, name))
        shutil.rmtree(os.path.join(site, 'js')); shutil.copytree(os.path.join(REAL, 'site', 'js'), os.path.join(site, 'js'))
        self._env = os.environ.get('POKEDEX_ROOT')
        os.environ['POKEDEX_ROOT'] = self.root
        return self

    def __exit__(self, *exc):
        if self._env is None:
            os.environ.pop('POKEDEX_ROOT', None)
        else:
            os.environ['POKEDEX_ROOT'] = self._env
        shutil.rmtree(self.root, ignore_errors=True)

    def path(self, *parts):
        return os.path.join(self.root, *parts)

    def read(self, *parts):
        return json.load(open(self.path('data', *parts), encoding='utf-8'))

    def write(self, obj, *parts):
        with open(self.path('data', *parts), 'w', encoding='utf-8') as fh:
            json.dump(obj, fh, ensure_ascii=False, indent=1)

    def built(self):
        """site/js/data.js of the sandbox, as a dict."""
        return _data_js(self.path('site', 'js', 'data.js'))


def _data_js(path):
    text = open(path, encoding='utf-8').read()
    return json.loads(text.split('const DATA = ', 1)[1].rsplit(';', 1)[0])


def load(name):
    """A fresh copy of tools/<name>.py, reading POKEDEX_ROOT as it is now."""
    spec = importlib.util.spec_from_file_location(f'{name}_under_test', os.path.join(TOOLS, name + '.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def real(*parts):
    return json.load(open(os.path.join(REAL, 'data', *parts), encoding='utf-8'))


def real_built():
    return _data_js(os.path.join(REAL, 'site', 'js', 'data.js'))
