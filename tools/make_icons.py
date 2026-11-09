"""The app icon: a plain ball outline (a circle, a band across it and a button) in cream on the sidebar red.
Drawn by this script from simple shapes, the same way as the Sims site's and the Library's icons.

    python -X utf8 tools/make_icons.py

Writes site/icon.svg, site/icon-<size>.png (browser tab, app window) and site/app-v1.ico (Windows shortcuts).
Every size is drawn on its own (at 4x, then scaled down), so the small ones stay crisp.
"""
import io, os, struct
from PIL import Image, ImageDraw

SITE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'site')
RED, RED_TOP, CREAM, GOLD = "#5A1820", "#8A2A35", "#FFF4EE", "#F2C14E"
SIZES = (16, 24, 32, 48, 64, 96, 192, 512)
ICO, ICO_SIZES = 'app-v1.ico', (16, 20, 24, 32, 40, 48, 64, 96, 128, 256)   # a new picture needs a new file name (Windows keeps old icons)

SVG = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
       f'<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{RED_TOP}"/><stop offset="1" stop-color="{RED}"/></linearGradient></defs>'
       f'<rect width="32" height="32" rx="7" fill="url(#g)"/>'
       f'<g fill="none" stroke="{CREAM}" stroke-width="2.4"><circle cx="16" cy="16" r="10"/><path d="M6 16h6.2M19.8 16H26"/></g>'
       f'<circle cx="16" cy="16" r="3.4" fill="{GOLD}" stroke="{CREAM}" stroke-width="2.2"/></svg>\n')


def draw(px):
    S = px * 4; u = S / 32
    grad = Image.linear_gradient("L").resize((S, S))
    bg = Image.composite(Image.new("RGBA", (S, S), RED), Image.new("RGBA", (S, S), RED_TOP), grad)
    mask = Image.new("L", (S, S), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, S - 1, S - 1), radius=7 * u, fill=255)
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); im.paste(bg, mask=mask)
    d = ImageDraw.Draw(im)
    w = (2.4 if px >= 32 else 3) * u
    c = 16 * u
    r = 10 * u
    d.ellipse((c - r, c - r, c + r, c + r), outline=CREAM, width=round(w))
    d.line([(6 * u, c), (12.6 * u, c)], fill=CREAM, width=round(w))
    d.line([(19.4 * u, c), (26 * u, c)], fill=CREAM, width=round(w))
    b = 3.6 * u
    d.ellipse((c - b - w / 2, c - b - w / 2, c + b + w / 2, c + b + w / 2), fill=CREAM)
    d.ellipse((c - b + w / 2, c - b + w / 2, c + b - w / 2, c + b - w / 2), fill=GOLD)
    return im.resize((px, px), Image.LANCZOS)


def write_ico(path, images):
    """Every size stored as PNG inside the .ico (Pillow's own writer kept only one size, which Windows stretched)."""
    pngs = []
    for im in images:
        b = io.BytesIO(); im.save(b, 'PNG'); pngs.append((im.width, b.getvalue()))
    out = struct.pack('<HHH', 0, 1, len(pngs)); offset = 6 + 16 * len(pngs)
    for px, data in pngs:
        out += struct.pack('<BBBBHHII', px % 256, px % 256, 0, 0, 1, 32, len(data), offset); offset += len(data)
    open(path, 'wb').write(out + b''.join(d for _, d in pngs))


def main():
    open(os.path.join(SITE, 'icon.svg'), 'w', encoding='utf-8', newline='\n').write(SVG)
    for px in SIZES:
        draw(px).save(os.path.join(SITE, f'icon-{px}.png'))
    write_ico(os.path.join(SITE, ICO), [draw(px) for px in ICO_SIZES])
    print(f'Written site/icon.svg, icon-<size>.png and {ICO}')


if __name__ == '__main__':
    main()
