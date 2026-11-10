"""Build the site's data file: data/ -> site/js/data.js, and stamp fingerprints on the code files in index.html.

    python -X utf8 tools/build.py

The page itself (site/index.html, site.css, js/app.js) is hand-written and never generated; this only refreshes what it
shows. Run it after tools/import_go.py, after changing data/events.json, or after changing the page's code.
Her ticks (data/collection/go.json) are written by tools/serve.py as she clicks; a copy goes into data.js too, so the
page still shows them (read only) if it's opened straight from the folder.
"""
import hashlib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA, SITE = os.path.join(ROOT, 'data'), os.path.join(ROOT, 'site')


def load(*p, default=None):
    path = os.path.join(DATA, *p)
    if not os.path.exists(path):
        return default
    return json.load(open(path, encoding='utf-8'))


def main():
    dex = load('go', 'dex.json')
    costumes = load('go', 'costumes.json')
    events = load('events.json', default=[])
    # special backgrounds (global, not tied to a place), with their notes; sources and doubts stay in the data file
    special = [{k: v for k, v in x.items() if k not in ('sources', 'unsure')} for x in (load('special-backgrounds.json', default={}) or {}).get('special', [])]
    collection = load('collection', 'go.json', default={})
    sprites = os.path.join(SITE, 'sprites')
    have = {f[:-5] for f in os.listdir(sprites) if f.endswith('.webp')} if os.path.isdir(sprites) else set()
    bigdir = os.path.join(sprites, 'big')
    big = {f[:-5] for f in os.listdir(bigdir) if f.endswith('.webp')} if os.path.isdir(bigdir) else set()   # for the Pokémon pages
    bgdir = os.path.join(SITE, 'backgrounds')   # the game's location cards, by event id (tools/fetch_backgrounds.py)
    bgs = {f[:-5] for f in os.listdir(bgdir) if f.endswith('.webp')} if os.path.isdir(bgdir) else set()
    names = {}
    for e in dex['entries']:
        names.setdefault(e['name'].lower(), e['dex'])
    problems = []
    for ev in events + special:   # background Pokémon by name -> dex number (so the page can show their pictures)
        for p in ev.get('backgroundPokemon') or []:
            if p.lower() not in names:
                problems.append(f'{ev["id"]}: no Pokémon called {p}')
        ids = {e['id'] for e in dex['entries']} | {c['id'] for c in costumes['costumes']}
        for c in ev.get('cards') or []:   # the exact forms/costumes the background's cards show
            if c not in ids:
                problems.append(f'{ev["id"]}: no entry or costume {c}')
    pics = [k for e in dex['entries'] + costumes['costumes'] for k in (e['img'], e['img'] + '.s')]
    missing = sum(1 for k in pics if k not in have)
    out = {'game': 'go', 'updated': dex['updated'], 'entries': dex['entries'], 'costumes': costumes['costumes'],
           'events': events, 'special': special, 'dexByName': names, 'sprites': sorted(have), 'bigSprites': sorted(big), 'backgrounds': sorted(bgs), 'collection': collection}
    js = 'const DATA = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
    write(os.path.join(SITE, 'js', 'data.js'), js)
    stamp()
    print(f'Built site/js/data.js: {len(dex["entries"])} entries, {len(costumes["costumes"])} costumes, {len(events)} events; '
          f'{len(have)} pictures ({missing} missing: new ones need tools/fetch_sprites.py; the rest have no picture in the game yet)')
    for p in problems:
        print('  check:', p)
    if problems:
        sys.exit(1)


def stamp():
    """A fingerprint on each code file's link in index.html, so the app window never uses an old copy."""
    path = os.path.join(SITE, 'index.html')
    html = open(path, encoding='utf-8').read()
    def fp(m):
        f = os.path.join(SITE, m.group(2))
        v = hashlib.md5(open(f, 'rb').read()).hexdigest()[:8] if os.path.exists(f) else '0'
        return f'{m.group(1)}{m.group(2)}?v={v}"'
    new = re.sub(r'((?:src|href)=")((?:js/)?[\w.-]+\.(?:js|css))(?:\?v=\w+)?"', fp, html)
    if new != html:
        write(path, new)


def write(path, text):
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(text)
    os.replace(tmp, path)


if __name__ == '__main__':
    main()
