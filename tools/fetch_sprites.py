"""Copy the game's own Pokémon pictures into site/sprites/ (one small .webp each), for every entry and costume.

    python -X utf8 tools/fetch_sprites.py

Reads data/go/pictures.json (made by tools/import_go.py: picture key -> file in PokeMiners' pogo_assets, the game's
picture files). Only pictures not already there are fetched, so it's quick after the first time. Each is shrunk to
128 px (shown at 64-96 px) and kept as it is otherwise: no cropping or touching up.
The sprites folder is kept out of git (about 15 MB, and it can always be fetched again); the weekly backup zips it.
"""
import io, json, os, sys, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'site', 'sprites')
RAW = 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/'
UA = {'User-Agent': "Jemma's Pokedex (private)"}
SIZE = 128


def one(item):
    key, path = item
    dest = os.path.join(OUT, key + '.webp')
    if os.path.exists(dest):
        return 'kept'
    try:
        with urllib.request.urlopen(urllib.request.Request(RAW + urllib.parse.quote(path), headers=UA), timeout=60) as r:
            im = Image.open(io.BytesIO(r.read())).convert('RGBA')
        im.thumbnail((SIZE, SIZE), Image.LANCZOS)
        im.save(dest + '.tmp', 'WEBP', quality=88, method=6)
        os.replace(dest + '.tmp', dest)
        return 'new'
    except Exception as e:
        return f'failed {key}: {e}'


def main():
    os.makedirs(OUT, exist_ok=True)
    pics = json.load(open(os.path.join(ROOT, 'data', 'go', 'pictures.json'), encoding='utf-8'))
    counts, failed = {'new': 0, 'kept': 0}, []
    with ThreadPoolExecutor(8) as pool:
        for i, res in enumerate(pool.map(one, pics.items()), 1):
            if res in counts:
                counts[res] += 1
            else:
                failed.append(res)
            if i % 250 == 0:
                print(f'{i}/{len(pics)}', flush=True)
    print(f'{counts["new"]} new, {counts["kept"]} already there, {len(failed)} failed')
    for f in failed[:20]:
        print(' ', f)
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
