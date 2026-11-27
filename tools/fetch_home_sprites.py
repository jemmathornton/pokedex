"""Copy Pokémon HOME's own pictures into site/sprites/ for the Pokémon and forms GO's files have no picture of.

    python -X utf8 tools/fetch_home_sprites.py

Her question (22 Nov): “For pics aren't we using same source for everything? Why would they be different between games?”
Both games show the same picture of a Pokémon: GO's own (tools/fetch_sprites.py, PokeMiners' copy of GO's files). Only where
GO's files have none (Pokémon not in GO yet, such as Alcremie, and forms GO hasn't got, such as Pikachu in a cap) does the
Pokédex use HOME's own picture of it, from PokeAPI's open copy of HOME's pictures (github.com/PokeAPI/sprites, the
sprites/pokemon/other/home folder: © The Pokémon Company, like every Pokémon picture here). Nothing is drawn or changed.

Which pictures: every key starting with "hm." in data/home/dex.json (img, femaleImg) and data/home/pictures.json (made by
tools/import_home.py). The key says where it comes from: hm.<name> is <name>.png, hm.<name>.s the shiny (shiny/<name>.png),
hm.<name>.g2 the female (female/<name>.png). Each is kept twice, like GO's: 128 px in site/sprites/ for the cards and 256 px
in site/sprites/big/ for the Pokémon pages. Only pictures not already there are fetched. Then run tools/build.py.
"""
import io, json, os, sys, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

ROOT = os.environ.get('POKEDEX_ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'site', 'sprites')
RAW = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/'
UA = {'User-Agent': "Jemma's Pokedex (private)"}


def source(key):
    """hm.869-vanilla-cream-strawberry-sweet.s -> shiny/869-vanilla-cream-strawberry-sweet.png"""
    name = key[3:]
    folder = ''
    if name.endswith('.s'):
        name, folder = name[:-2], 'shiny/'
    if name.endswith('.g2'):
        name, folder = name[:-3], folder + 'female/'
    return folder + name + '.png'


def wanted():
    keys = set()
    dex = json.load(open(os.path.join(ROOT, 'data', 'home', 'dex.json'), encoding='utf-8'))['entries']
    for game in ('shield', 'diamond', 'arceus', 'violet', 'za'):   # the games after HOME: their own forms (Calyrex's riders, Silvally's memories in Shield)
        path = os.path.join(ROOT, 'data', game, 'dex.json')
        if os.path.exists(path):
            dex = dex + json.load(open(path, encoding='utf-8'))['entries']
    for e in dex:
        for m in e.get('mega') or []:   # Legends: Z-A's Megas without a GO picture (Mega Clefable…): HOME's, not shiny
            if m.get('img', '').startswith('hm.'):
                keys.add(m['img'])
        for k in (e.get('img'), e.get('femaleImg')):
            if k and k.startswith('hm.'):
                keys |= {k, k + '.s'} if e.get('shiny') else {k}   # no shiny picture of one that can't be shiny (the cap Pikachu)
    pics = json.load(open(os.path.join(ROOT, 'data', 'home', 'pictures.json'), encoding='utf-8'))
    keys |= {v for k, v in pics.items() if not k.startswith('_') and isinstance(v, str) and v.startswith('hm.')}
    return sorted(keys)


def one(key):
    small, big = os.path.join(OUT, key + '.webp'), os.path.join(OUT, 'big', key + '.webp')
    if os.path.exists(small) and os.path.exists(big):
        return 'kept'
    try:
        with urllib.request.urlopen(urllib.request.Request(RAW + urllib.parse.quote(source(key)), headers=UA), timeout=60) as r:
            im = Image.open(io.BytesIO(r.read())).convert('RGBA')
        for dest, size in ((big, 256), (small, 128)):
            copy = im.copy()
            copy.thumbnail((size, size), Image.LANCZOS)
            copy.save(dest + '.tmp', 'WEBP', quality=88, method=6)
            os.replace(dest + '.tmp', dest)
        return 'new'
    except Exception as e:
        return f'failed {key} ({source(key)}): {e}'


def main():
    os.makedirs(os.path.join(OUT, 'big'), exist_ok=True)
    keys = wanted()
    counts, failed = {'new': 0, 'kept': 0}, []
    with ThreadPoolExecutor(8) as pool:
        for i, res in enumerate(pool.map(one, keys), 1):
            if res in counts:
                counts[res] += 1
            else:
                failed.append(res)
            if i % 100 == 0:
                print(f'{i}/{len(keys)}', flush=True)
    print(f'HOME pictures: {counts["new"]} new, {counts["kept"]} already there, {len(failed)} failed')
    for f in failed[:30]:
        print(' ', f)
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
