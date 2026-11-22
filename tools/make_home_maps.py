"""Smaller copies of the ten region maps for Home's banner (TEMPORARY trial, 22 Nov: the Try switch "Pictures on Home: Smaller").

Home's banner shows the ten maps side by side, each 330 px tall on a laptop (150 on a phone), so a copy 660 px tall (twice the size
shown) looks the same and is a fraction of the download. Reads her picked maps (REGION_CHOSEN in site/js/app.js) from
site/regions and writes WebP copies to site/regions/home/. The originals are unchanged.

Run: python -X utf8 tools/make_home_maps.py
"""
import os
import re

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
OUT = os.path.join(SITE, 'regions', 'home')
HEIGHT = 660   # twice the banner's 330 px
QUALITY = 82


def chosen():
    js = open(os.path.join(SITE, 'js', 'app.js'), encoding='utf-8').read()
    block = re.search(r'const REGION_CHOSEN = \{([^}]*)\}', js).group(1)
    return re.findall(r'"[^"]+":\s*"([^"]+)"', block)


def main():
    os.makedirs(OUT, exist_ok=True)
    for name in chosen():
        src = os.path.join(SITE, 'regions', name)
        dst = os.path.join(OUT, os.path.splitext(name)[0] + '.webp')
        with Image.open(src) as im:
            im = im.convert('RGB')
            if im.height > HEIGHT:
                im = im.resize((round(im.width * HEIGHT / im.height), HEIGHT), Image.LANCZOS)
            im.save(dst, 'WEBP', quality=QUALITY, method=6)
        print(f'{name}: {os.path.getsize(src) // 1024} KB -> {os.path.basename(dst)}: {os.path.getsize(dst) // 1024} KB')


if __name__ == '__main__':
    main()
