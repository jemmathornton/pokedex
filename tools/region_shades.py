"""Shades for each region's two colours on the Try switch (app.js TRY_VZ "rc-…" rows): python -X utf8 tools/region_shades.py
prints them, each with its contrast for white writing.

Shades for each version colour (her ask, 25 Nov): several of each half of a region's two colours, all from the version's
own colour (Bulbapedia's, taken from the box art and Japanese logos), its box art or logo colour, and its remake's colour."""
import colorsys, json


def lum(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def cr(h):
    return 1.05 / (lum(h) + 0.05)


def scale(h, t):   # the colour × f (Bulbapedia's own way of making its dark shades) until white writing reaches t
    r, g, b = [int(h[i:i + 2], 16) for i in (0, 2, 4)]
    f = 1.0
    while True:
        x = '%02X%02X%02X' % (round(r * f), round(g * f), round(b * f))
        if cr(x) >= t or f <= 0.02:
            return x
        f -= 0.005


def hls_to(h, t, sat=1.0):   # same hue, saturation × sat, lightness found so white writing is t:1
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    H, L, S = colorsys.rgb_to_hls(r, g, b)
    S = max(0, min(1, S * sat))
    lo, hi = 0.0, 1.0
    for _ in range(40):
        mid = (lo + hi) / 2
        x = '%02X%02X%02X' % tuple(round(v * 255) for v in colorsys.hls_to_rgb(H, mid, S))
        if cr(x) >= t:
            lo = mid
        else:
            hi = mid
    return '%02X%02X%02X' % tuple(round(v * 255) for v in colorsys.hls_to_rgb(H, lo, S))


ANCHORS = [(0, 'red'), (30, 'orange'), (55, 'yellow'), (120, 'green'), (185, 'teal'), (225, 'blue'), (275, 'purple'), (330, 'pink'), (360, 'red')]


def hue_of(h):
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    H, L, S = colorsys.rgb_to_hls(r, g, b)
    return H * 360, S


def shifted(h, deg, t=5.0):   # the same colour turned a little round the colour wheel, at t:1 for white writing
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    H, L, S = colorsys.rgb_to_hls(r, g, b)
    H2 = ((H * 360 + deg) % 360) / 360
    x = '%02X%02X%02X' % tuple(round(v * 255) for v in colorsys.hls_to_rgb(H2, L, S))
    return hls_to(x, t)


def toward(h, deg):   # "More orange": the named colour it turns towards
    H, _ = hue_of(h)
    target = (H + (30 if deg > 0 else -30)) % 360
    return 'More ' + min(ANCHORS, key=lambda a: min(abs(a[0] - target), 360 - abs(a[0] - target)))[1]


def dist(a, b):
    return sum(abs(int(a[i:i + 2], 16) - int(b[i:i + 2], 16)) for i in (0, 2, 4))


# version: (Bulbapedia main, [(label, extra colour)], as before)
V = {
    'Red': ('DA3914', [('FireRed', 'F15C01')], 'A3302A'),
    'Blue': ('2E50D8', [('Box art', '1F92C3')], '1F4E9C'),
    'Gold': ('DAA520', [('HeartGold', 'E8B502')], '8E6A0E'),
    'Silver': ('C0C0C0', [('SoulSilver', 'AAB9CF'), ('Logo', 'BEC5CB')], '5F6770'),
    'Ruby': ('CD2236', [('Omega Ruby', 'AB2813')], '9B1B30'),
    'Sapphire': ('3D51A7', [('Alpha Sapphire', '26649C'), ('Box art', '1172A9')], '16618A'),
    'Diamond': ('90BEED', [('Brilliant Diamond', '44BAE5'), ('Dialga', '156288')], '2F5D9E'),
    'Pearl': ('DD7CB1', [('Shining Pearl', 'DA7D99')], '9C4A7A'),
    'Black': ('444444', [('Black 2', '303E51')], '36353D'),
    'White': ('E1E1E1', [('White 2', 'EBC5C3')], None),
    'X': ('025DA6', [('Logo', '126190')], '2B55A3'),
    'Y': ('EA1A3E', [('Logo', 'C72038')], 'A3283A'),
    'Sun': ('F1912B', [('Ultra Sun', 'E95B2B'), ('Logo', 'F5A02B')], 'B5531C'),
    'Moon': ('5599CA', [('Ultra Moon', '226DB5'), ('Lunala', '393075')], '4B3F8F'),
    'Shield': ('BF004F', [('Logo', 'DC0358'), ('Zamazenta', 'C13339')], 'A3283E'),
    'Sword': ('00A1E9', [], '1E5FA8'),
    'Legends: Arceus': ('36597B', [], '3C6150'),
    'Violet': ('8334B7', [('Logo', '7B248A')], '6A3D9A'),
    'Scarlet': ('F34134', [], 'B3261E'),
}


def options(name, second=False):
    main, extra, before = V[name]
    if name == 'White':   # can't hold white writing: only ever the second colour, pale
        out = [('White', 'E1E1E1'), ('Light grey', 'C8C8C8'), ('Silver-white', 'D4D7DB'), ('White 2', 'EBC5C3')]
        return out
    grey = hue_of(main)[1] < 0.08
    out = [(name, scale(main, 5.0)), ('Deeper', scale(main, 8.0))]
    if not grey:
        out += [('Richer', hls_to(main, 5.0, 1.4)), ('Softer', hls_to(main, 5.0, 0.55)),
                (toward(main, 14), shifted(main, 14)), (toward(main, -14), shifted(main, -14))]
    out += [(lab, c) for lab, c in EXTRA_FIXED.get(name, [])]
    if second:
        out.insert(1, ('Lighter', scale(main, 3.0) if cr(main) < 3.0 else hls_to(main, 3.0)))
    out += [(lab, scale(c, 5.0)) for lab, c in extra]
    if before:
        out.append(('Before', before))
    keep, made = [], {'Deeper', 'Richer', 'Softer', 'Lighter'}
    for lab, c in out:   # leave out a made shade too close to one already offered (her colours, remakes, box art and Before stay)
        if all(dist(c, k) > (22 if lab in made or lab.startswith('More ') else 6) for _, k in keep):
            keep.append((lab, c))
    return keep


# fixed extras: Gold her Journals cover's old gold (her pick, 20 Nov); the greys a warmer and a cooler one
EXTRA_FIXED = {'Gold': [('Old gold', '8E6520')], 'Silver': [('Blue-grey', '5F6875'), ('Warm grey', '6E6A62')], 'Black': [('Charcoal', '2C2C2C')],
               'Platinum': []}

REGIONS = [('1', 'Kanto', 'Red', 'Blue'), ('2', 'Johto', 'Gold', 'Silver'), ('3', 'Hoenn', 'Ruby', 'Sapphire'), ('4', 'Sinnoh', 'Diamond', 'Pearl'),
           ('5', 'Unova', 'Black', 'White'), ('6', 'Kalos', 'X', 'Y'), ('7', 'Alola', 'Sun', 'Moon'), ('8', 'Galar', 'Shield', 'Sword'),
           ('hisui', 'Hisui', 'Legends: Arceus', None), ('9', 'Paldea', 'Violet', 'Scarlet')]
rows = []
for rid, region, a, b in REGIONS:
    oa = options(a)
    rows.append([f'rc-{rid}' + (':a' if b else ''), f'{region} · {a}', [[f'#{c}', l] for l, c in oa], f'#{oa[0][1]}'])
    if b:
        ob = options(b, second=True)
        rows.append([f'rc-{rid}:b', f'{region} · {b}', [[f'#{c}', l] for l, c in ob], f'#{ob[0][1]}'])
for r in rows:
    print(json.dumps(r, ensure_ascii=False))
    for c, l in r[2]:
        print(f'      {l:18} {c}  {cr(c[1:]):.1f}:1')
