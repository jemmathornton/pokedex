"""Picture sheet + markdown list of every non-regional multi-form Pokémon, for her to decide which get their own cards."""
import json, os, collections
from PIL import Image, ImageDraw, ImageFont
R = r'C:/Users/Jemma/Documents/Pokedex'
d = json.load(open(R + '/data/go/dex.json', encoding='utf8')); d = d if isinstance(d, list) else d['entries']
REG = ('Alolan', 'Galarian', 'Hisuian', 'Paldean')
isreg = lambda e: (e.get('form') or '').split(' ')[0] in REG
by = collections.OrderedDict()
for e in sorted(d, key=lambda e: e['dex']):
    if not isreg(e): by.setdefault(e['dex'], []).append(e)
multi = {k: v for k, v in by.items() if len(v) > 1}
# suggestion: forms that are a different battle form (another type, stats or moves in the games) vs ones that only look different
BIG = {150: 'stats', 351: 'type', 386: 'stats', 413: 'type', 479: 'type', 483: 'stats', 484: 'stats', 487: 'stats', 492: 'type',
       493: 'type', 550: 'evolution (White Striped)', 555: 'type', 641: 'stats', 642: 'stats', 645: 'stats', 646: 'type and stats', 647: 'moves',
       649: 'moves', 718: 'stats', 720: 'type', 741: 'type', 744: 'evolution', 745: 'stats', 774: 'stats', 800: 'type', 849: 'moves',
       892: 'type', 905: 'type and stats', 710: 'stats', 711: 'stats'}
spr = lambda img: next((p for p in (f'{R}/site/sprites/{img}.webp', f'{R}/site/sprites/{img}.png') if os.path.exists(p)), None)
F = lambda n, b=False: ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf' if b else 'C:/Windows/Fonts/segoeui.ttf', n)
def label(e): return e.get('form') or e['name']
def pic(img, box):
    p = spr(img)
    if not p: return None
    s = Image.open(p).convert('RGBA'); bb = s.getbbox()
    if bb: s = s.crop(bb)
    s.thumbnail((box, box)); return s
def sheet(dexes, title, out):
    W, pad, colw, cell, lab = 1600, 24, 768, 74, 18
    per = (colw - 10) // cell
    blocks = [(k, multi[k], 34 + ((len(multi[k]) + per - 1) // per) * (cell + lab + 6) + 12) for k in dexes]
    cols, hs = [[], []], [0, 0]
    for b in blocks:   # fill the shorter column
        i = 0 if hs[0] <= hs[1] else 1; cols[i].append(b); hs[i] += b[2]
    H = 76 + max(hs) + 10
    im = Image.new('RGB', (W, H), '#F7F3EC'); dr = ImageDraw.Draw(im)
    dr.text((pad, 18), title, fill='#222', font=F(28, True))
    for ci, col in enumerate(cols):
        x0, y = pad + ci * (colw + 16), 70
        for k, es, h in col:
            dr.rounded_rectangle((x0, y, x0 + colw, y + h - 8), 10, fill='#FFFFFF', outline='#E4DCCF')
            dr.text((x0 + 12, y + 7), f"#{k:04d} {es[0]['name']}", fill='#222', font=F(17, True))
            if k in BIG:
                tw = dr.textlength(f"#{k:04d} {es[0]['name']}", font=F(17, True))
                dr.text((x0 + 22 + tw, y + 10), f"differs in {BIG[k]}", fill='#8A6A3A', font=F(13))
            for i, e in enumerate(es):
                x = x0 + 6 + (i % per) * cell; yy = y + 34 + (i // per) * (cell + lab + 6)
                s = pic(e['img'], cell - 16)
                if s: im.paste(s, (x + (cell - s.width) // 2, yy + (cell - 8 - s.height) // 2), s)
                t = label(e); f = F(11)
                while dr.textlength(t, font=f) > cell - 2 and len(t) > 3: t = t[:-2] + '…' if t.endswith('…') else t[:-1] + '…'
                dr.text((x + (cell - dr.textlength(t, font=f)) / 2, yy + cell - 4), t, fill='#333', font=f)
            y += h
    im.save(out); print(out, im.size)
big = [k for k in multi if k in BIG]; looks = [k for k in multi if k not in BIG]
sheet(big, 'Big forms: a different type, stats, moves or evolution (suggestion)', R + '/for-jemma/forms-big.png')
sheet(looks, 'Forms that only look different (suggestion)', R + '/for-jemma/forms-looks.png')
L = ['# Forms: which get their own card? (14 Nov 2026)', '',
     'Regional forms (Alolan, Galarian, Hisuian, Paldean) already have their own card and page. Everything below is still one card per number, with its forms inside, as Unown is. Put **Yes** next to any you want listed separately (its own card, page and Fast tick square, like Hisuian Growlithe). Pictures: `forms-big.png` and `forms-looks.png`.', '',
     'The split into “big” and “looks only” is Claude’s suggestion (from the main games: whether a form has another type, other stats, other moves or evolves differently). Form names are the game’s.', '',
     '## Big forms (suggestion)', '']
for k in big:
    es = multi[k]; L.append(f"- [ ] **#{k:04d} {es[0]['name']}** ({BIG[k]}): " + ', '.join(label(e) for e in es))
L += ['', '## Forms that only look different (suggestion)', '']
for k in looks:
    es = multi[k]; L.append(f"- [ ] **#{k:04d} {es[0]['name']}**: " + ', '.join(label(e) for e in es))
open(R + '/for-jemma/forms-to-decide.md', 'w', encoding='utf8').write('\n'.join(L) + '\n')
print(len(big), len(looks))
