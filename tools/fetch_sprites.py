"""Copy the game's own Pokémon pictures into site/sprites/ (one small .webp each), for every entry and costume.

    python -X utf8 tools/fetch_sprites.py          (small pictures, 128 px, for cards: every entry and costume)
    python -X utf8 tools/fetch_sprites.py --big    (big pictures, the game's full 256 px, for the Pokémon pages: entries only)

Reads data/go/pictures.json (made by tools/import_go.py: picture key -> file in PokeMiners' pogo_assets, the game's
picture files). Only pictures not already there are fetched, so it's quick after the first time. Each is shrunk to
128 px (shown at 64-96 px) and kept as it is otherwise: no cropping or touching up.
Big pictures go in site/sprites/big/ (9 Nov: on a Pokémon's page the small ones looked tiny, as the game draws small
Pokémon small inside the picture). The sprites folder is kept out of git (about 15 MB, and it can always be fetched again); the weekly backup zips it.
"""
import io, json, os, sys, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'site', 'sprites')
RAW = 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/'
UA = {'User-Agent': "Jemma's Pokedex (private)"}
SIZE = 128


def one(item, big=False):
    key, path = item
    dest = os.path.join(OUT, 'big' if big else '', key + '.webp')
    if os.path.exists(dest):
        return 'kept'
    try:
        with urllib.request.urlopen(urllib.request.Request(RAW + urllib.parse.quote(path), headers=UA), timeout=60) as r:
            im = Image.open(io.BytesIO(r.read())).convert('RGBA')
        if not big:
            im.thumbnail((SIZE, SIZE), Image.LANCZOS)
        im.save(dest + '.tmp', 'WEBP', quality=88, method=6)
        os.replace(dest + '.tmp', dest)
        return 'new'
    except Exception as e:
        return f'failed {key}: {e}'


# the game's own looks for the Pokémon page's picture cards (--extras): the Lucky sparkles and the Shadow flames, as they are in the game
EXTRAS = {'lucky': 'Images/Friends/ui_bg_lucky_pokemon.png', 'shadow-flame': 'Images/Effects/tx_shadow_cloud_02.png',
          'sparkle': 'Images/Effects/flare_6_point.png', 'star': 'Images/Appraisal/AppraisalStar.png',
          'swirl': 'Images/Effects/swirls.png', 'energy': 'Images/Effects/tx_energy_tile_purple.png'}


def extras():
    """--extras: the Gigantamax pictures (256 px, into sprites/big as pm94.fGIGANTAMAX…) and the looks above (into site/variants/)."""
    imports = sorted(d for d in os.listdir(os.path.join(ROOT, 'imports')) if d.startswith('go-'))
    tree = json.load(open(os.path.join(ROOT, 'imports', imports[-1], 'assets-tree.json'), encoding='utf-8'))
    paths = [x['path'] for x in (tree['tree'] if isinstance(tree, dict) else tree)]
    d256 = 'Images/Pokemon - 256x256/Addressable Assets/'
    items = [(p[len(d256):-len('.icon.png')], p) for p in paths if p.startswith(d256) and '.fGIGANTAMAX' in p and p.endswith('.icon.png')]
    res = [one(it, True) for it in items]
    os.makedirs(os.path.join(ROOT, 'site', 'variants'), exist_ok=True)
    for name, path in EXTRAS.items():
        dest = os.path.join(ROOT, 'site', 'variants', name + '.png')
        if not os.path.exists(dest):
            with urllib.request.urlopen(urllib.request.Request(RAW + urllib.parse.quote(path), headers=UA), timeout=60) as r:
                open(dest, 'wb').write(r.read())
    print(f'Gigantamax pictures: {res.count("new")} new, {res.count("kept")} kept, {len(res) - res.count("new") - res.count("kept")} failed; looks in site/variants/')


def main():
    if '--extras' in sys.argv:
        return extras()
    big = '--big' in sys.argv
    os.makedirs(os.path.join(OUT, 'big'), exist_ok=True)
    pics = json.load(open(os.path.join(ROOT, 'data', 'go', 'pictures.json'), encoding='utf-8'))
    if big:   # entries only (not costumes): their picture, shiny, and female look
        dex = json.load(open(os.path.join(ROOT, 'data', 'go', 'dex.json'), encoding='utf-8'))['entries']
        want = {k for e in dex for k in (e['img'], e['img'] + '.s', e.get('femaleImg'), e.get('femaleImg') and e['femaleImg'] + '.s') if k}
        pics = {k: v for k, v in pics.items() if k in want}
    counts, failed = {'new': 0, 'kept': 0}, []
    with ThreadPoolExecutor(8) as pool:
        for i, res in enumerate(pool.map(lambda it: one(it, big), pics.items()), 1):
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
