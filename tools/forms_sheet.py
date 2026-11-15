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
       493: 'type', 550: 'evolution (White Striped)', 555: 'type', 641: 'stats', 642: 'stats', 645: 'stats', 646: 'stats',
       649: 'moves', 718: 'stats', 720: 'type', 741: 'type', 744: 'evolution', 745: 'stats', 774: 'stats', 800: 'type', 849: 'moves',
       892: 'type', 905: 'stats', 710: 'stats', 711: 'stats'}
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
     'Regional forms (Alolan, Galarian, Hisuian, Paldean) already have their own card and page. Everything below is still one card per number, with its forms inside, as Unown is. Easiest: open `forms-to-decide.html` and click **Own cards** on the ones you want. Or put **Yes** next to any you want listed separately (its own card, page and Fast tick square, like Hisuian Growlithe). Pictures: `forms-big.png` and `forms-looks.png`.', '',
     'The split into “big” and “looks only” is Claude’s suggestion (from the main games: whether a form has another type, other stats, other moves or evolves differently). Form names are the game’s.', '',
     '## Big forms (suggestion)', '']
for k in big:
    es = multi[k]; L.append(f"- [ ] **#{k:04d} {es[0]['name']}** ({BIG[k]}): " + ', '.join(label(e) for e in es))
L += ['', '## Forms that only look different (suggestion)', '']
for k in looks:
    es = multi[k]; L.append(f"- [ ] **#{k:04d} {es[0]['name']}**: " + ', '.join(label(e) for e in es))
open(R + '/for-jemma/forms-to-decide.md', 'w', encoding='utf8').write('\n'.join(L) + '\n')
print(len(big), len(looks))

# a page she can click (14 Nov: the Markdown list's checkboxes can't be ticked in the viewer): pictures inline, picks kept in the browser,
# and a line of her picks at the bottom to copy to Claude
import base64, io, html
def uri(img):
    s = pic(img, 72)
    if not s: return ''
    b = io.BytesIO(); s.save(b, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
def block(k):
    es = multi[k]; n = html.escape(es[0]['name'])
    why = f'<small>differs in {html.escape(BIG[k])}</small>' if k in BIG else ''
    pics = ''.join(f'<figure><img src="{uri(e["img"])}" alt=""><figcaption>{html.escape(label(e))}</figcaption></figure>' for e in es)
    return (f'<section class="mon" data-k="{k}" data-name="{n}"><header><h3>#{k:04d} {n}</h3>{why}'
            f'<button type="button" aria-pressed="false"><span class="box"></span>Own cards</button></header><div class="pics">{pics}</div></section>')
page = '''<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Forms to decide</title><style>
:root{--bg:#F7F3EC;--card:#fff;--line:#E4DCCF;--ink:#222;--muted:#8A6A3A;--on:#2F6B4F}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 "Segoe UI",system-ui,sans-serif;padding:24px 24px 90px}
h1{font-size:26px;margin:0 0 6px}h2{font-size:19px;margin:28px 0 10px}p{max-width:820px;margin:0 0 8px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(460px,1fr));gap:10px}
.mon{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 12px}
.mon header{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.mon h3{font-size:16px;margin:0}.mon small{color:var(--muted)}
.mon button{margin-left:auto;display:flex;align-items:center;gap:7px;font:600 14px "Segoe UI",system-ui,sans-serif;border:1.5px solid var(--line);background:#fff;border-radius:999px;padding:5px 12px 5px 8px;cursor:pointer;color:var(--ink)}
.mon .box{width:18px;height:18px;border:2px solid #9a9a9a;border-radius:5px;display:inline-block;position:relative}
.mon button[aria-pressed="true"]{background:var(--on);border-color:var(--on);color:#fff}
.mon button[aria-pressed="true"] .box{border-color:#fff;background:#fff}
.mon button[aria-pressed="true"] .box::after{content:"";position:absolute;left:4px;top:0;width:5px;height:10px;border:solid var(--on);border-width:0 2.5px 2.5px 0;transform:rotate(45deg)}
.mon.on{border-color:var(--on);box-shadow:0 0 0 1px var(--on)}
.pics{display:flex;flex-wrap:wrap;gap:2px;margin-top:6px}figure{margin:0;width:70px;text-align:center}figure img{width:56px;height:56px;object-fit:contain}
figcaption{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid var(--line);padding:12px 24px;display:flex;gap:12px;align-items:center}
.bar b{flex:none}.bar span{flex:1;min-width:0}.bar button{font:600 14px "Segoe UI",system-ui,sans-serif;border:0;background:var(--on);color:#fff;border-radius:8px;padding:8px 14px;cursor:pointer}
</style></head><body>
<h1>Which forms get their own card?</h1>
<p>Regional forms (Alolan, Galarian, Hisuian, Paldean) already have their own card, page and Fast tick square. Everything here is still one card per number with its forms inside, like Unown. Click <b>Own cards</b> on any you want listed separately, then tell Claude the line at the bottom (or click Copy and paste it).</p>
<p><small>The split into big forms and looks-only is Claude’s suggestion, from the main games. Form names are the game’s.</small></p>
<h2>Big forms: a different type, stats, moves or evolution (suggestion)</h2><div class="grid">''' + ''.join(block(k) for k in big) + '''</div>
<h2>Forms that only look different (suggestion)</h2><div class="grid">''' + ''.join(block(k) for k in looks) + '''</div>
<div class="bar"><b>Own cards:</b><span id="picks">none yet</span><button type="button" id="copy">Copy</button></div>
<script>
const KEY = "jemmas-pokedex-forms-picks";
let picks = []; try { picks = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) {}
const line = () => [...document.querySelectorAll(".mon.on")].map(m => m.dataset.name).join(", ");
function show(){ document.getElementById("picks").textContent = line() || "none yet"; }
for (const m of document.querySelectorAll(".mon")) {
  const b = m.querySelector("button"), on = v => { m.classList.toggle("on", v); b.setAttribute("aria-pressed", v); };
  on(picks.includes(m.dataset.k));
  b.addEventListener("click", () => { on(b.getAttribute("aria-pressed") !== "true");
    try { localStorage.setItem(KEY, JSON.stringify([...document.querySelectorAll(".mon.on")].map(x => x.dataset.k))); } catch (e) {}
    show(); });
}
show();
document.getElementById("copy").addEventListener("click", async () => {
  const t = "Own cards: " + (line() || "none");
  try { await navigator.clipboard.writeText(t); document.getElementById("copy").textContent = "Copied"; } catch (e) { prompt("Copy this:", t); }
});
</script></body></html>'''
open(R + '/for-jemma/forms-to-decide.html', 'w', encoding='utf8').write(page)
print('html', len(page) // 1024, 'KB')
