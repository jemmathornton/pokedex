"""Smaller copies of the ten region maps: Home's banner and the ten-map strips, and phones (22 Nov).

- site/regions/home/: 660 px tall (twice the 330 px banner), for Home's banner (her pick, 22 Nov, from the Try switch:
  "Smaller") and the same strip of ten maps on Every Pokémon, Fast tick, Looking for and What's on (app.js homeMaps, ALL_MAPS).
- site/regions/phone/: 1200 px wide, for one region's banner on narrow windows and phones, 900 px and under (app.js phoneMap;
  round 5 phone review: Kanto's banner was a 1.76 MB picture for a strip 390 px wide).

Reads her picked maps (REGION_CHOSEN in site/js/app.js) from site/regions and writes WebP copies. The originals are unchanged
and still used for the region banners on a laptop. Run it again after changing a map.

Run: python -X utf8 tools/make_home_maps.py
"""
import os
import re

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
HOME = os.path.join(SITE, 'regions', 'home')
PHONE = os.path.join(SITE, 'regions', 'phone')
HEIGHT = 660   # twice the banner's 330 px
WIDTH = 1200   # a phone's banner is the screen's width (390 px at 3x) or, up to 900 px, 70% of the banner (630 px at 2x)
QUALITY = 82


def chosen():
    js = open(os.path.join(SITE, 'js', 'app.js'), encoding='utf-8').read()
    block = re.search(r'const REGION_CHOSEN = \{([^}]*)\}', js).group(1)
    return re.findall(r'"[^"]+":\s*"([^"]+)"', block)


def copy(src, folder, size):
    dst = os.path.join(folder, os.path.splitext(os.path.basename(src))[0] + '.webp')
    with Image.open(src) as im:
        im = im.convert('RGB')
        w, h = size(im)
        if w < im.width:
            im = im.resize((w, h), Image.LANCZOS)
        im.save(dst, 'WEBP', quality=QUALITY, method=6)
    return dst


def main():
    os.makedirs(HOME, exist_ok=True)
    os.makedirs(PHONE, exist_ok=True)
    for name in chosen():
        src = os.path.join(SITE, 'regions', name)
        home = copy(src, HOME, lambda im: (round(im.width * HEIGHT / im.height), HEIGHT))
        phone = copy(src, PHONE, lambda im: (WIDTH, round(im.height * WIDTH / im.width)))
        print(f'{name}: {os.path.getsize(src) // 1024} KB -> home {os.path.getsize(home) // 1024} KB, phone {os.path.getsize(phone) // 1024} KB')


if __name__ == '__main__':
    main()
