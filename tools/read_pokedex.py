"""PROTOTYPE (11 Nov 2026): read which Pokémon are in colour on one tab of Pokémon GO's own Pokédex (the Feb 2025 design:
Pokémon, Shiny, Lucky, 100%, Shadow, Purified, G-Max, Mega, XXL, XXS, each by region), from a screen recording or
screenshots of it. It never touches her ticks: it prints a short report and writes a proposal file
(imports/pokedex-<tab>-<region>.json) with a line for the Quick add page, e.g. "1-3, 6, 25 shiny".

    python -X utf8 tools/read_pokedex.py <video, folder of screenshots, or one screenshot> [--tab shiny] [--region kanto]
                                         [--fps 3] [--out file.json] [--debug folder] [--no-check]
    python -X utf8 tools/read_pokedex.py --selftest     checks itself on made-up Pokédex screens built from the sprites

How it works, for each frame (3 a second from a video):
  1. Windows' own OCR (through PowerShell; nothing to install) reads the words on screen: the cell numbers ("0025"), the
     region name and its count ("KANTO 151 / 151"), and the tab names along the bottom.
  2. The numbers give the grid: columns, rows and the size of a cell. A number that doesn't fit the grid is a misread
     and is dropped (on tabs that list every Pokémon in order, a cell's number must follow from its place in the grid).
  3. Each cell's picture is compared with the cell's own background: nothing there = blank (not registered), one flat
     colour = silhouette (not registered), anything else = in colour (registered). Cells hidden behind the round buttons
     or the tab bar at the bottom are skipped; they come into view in other frames as the list scrolls.
  4. A Pokémon seen in several frames gets the answer most frames agree on; disagreements are listed for checking.
  5. Cross-check (unless --no-check): each cell's picture is matched to the game's own pictures (site/sprites/): a
     silhouette's outline against every Pokémon's outline, a colour picture against every picture. The report says how
     often the closest pictures include the Pokémon the number says. This catches a misread number.
The region's count on screen ("140/151", or "107" on tabs without a total) is compared with the number it found.

Needs: opencv-python, numpy, ffmpeg (for videos), Windows 10/11 (for the OCR). Measured on real screenshots: see
research/data-input-routes.md, "Reading the game's Pokédex".
"""
import glob, json, os, re, shutil, subprocess, sys, tempfile
from collections import Counter, defaultdict
import numpy as np, cv2

ROOT = os.environ.get('POKEDEX_ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPRITES = os.path.join(ROOT, 'site', 'sprites')

# the game's tab names -> (our name, the word for Quick add, or None where the app has no such box)
TABS = {'pokemon': ('Pokémon', 'caught'), 'shiny': ('Shiny', 'shiny'), 'lucky': ('Lucky', 'lucky'), '100': ('100%', '4★'),
        'shadow': ('Shadow', 'shadow'), 'purified': ('Purified', 'purified'), 'gmax': ('G-Max', 'g-max'),
        'mega': ('Mega', 'mega'), 'xxl': ('XXL', None), 'xxs': ('XXS', None)}
TAB_WORDS = {'POKEMON': 'pokemon', 'POKÉMON': 'pokemon', 'SHINY': 'shiny', 'LUCKY': 'lucky', '100%': '100', 'SHADOW': 'shadow',
             'PURIFIED': 'purified', 'G-MAX': 'gmax', 'GMAX': 'gmax', 'MEGA': 'mega', 'XXL': 'xxl', 'XXS': 'xxs'}
# the game's regions, in order, with the app's section for each (Hisui = #899-905, as in the app)
REGIONS = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'hisui', 'paldea']
GEN_OF = dict(zip(REGIONS, ['1', '2', '3', '4', '5', '6', '7', '8', 'hisui', '9']))
DIGITS = str.maketrans({'O': '0', 'o': '0', 'D': '0', 'Q': '0', 'I': '1', 'l': '1', '|': '1', 'i': '1', 'S': '5', 's': '5',
                        'B': '8', 'Z': '2', 'z': '2', 'G': '6', 'b': '6', 'g': '9', 'q': '9'})

OCR_PS = r'''param([string]$ListFile)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType = WindowsRuntime]
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($t, $type) { $n = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($t)); $n.Wait(-1) | Out-Null; $n.Result }
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
foreach ($p in Get-Content -Encoding UTF8 $ListFile) {
 try {
  $f = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($p)) ([Windows.Storage.StorageFile])
  $s = Await ($f.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
  $d = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($s)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $b = Await ($d.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  $r = Await ($engine.RecognizeAsync($b)) ([Windows.Media.Ocr.OcrResult])
  $words = @()
  foreach ($l in $r.Lines) { foreach ($w in $l.Words) { $words += ,@($w.Text, [int]$w.BoundingRect.X, [int]$w.BoundingRect.Y, [int]$w.BoundingRect.Width, [int]$w.BoundingRect.Height) } }
  $s.Dispose()
  [Console]::Out.WriteLine((ConvertTo-Json -Compress -Depth 4 @{ file = [string]$p; words = $words }))
 } catch { [Console]::Error.WriteLine("$p : $_") }
}
'''


# ---------------------------------------------------------------- reading the words
def ocr(paths):
    """{path: [(text, x, y, w, h), ...]} for every picture, from Windows' own OCR (one PowerShell for all of them)."""
    if not paths:
        return {}
    tmp = tempfile.mkdtemp(prefix='pokedex-ocr-')
    try:
        ps, lst = os.path.join(tmp, 'ocr.ps1'), os.path.join(tmp, 'list.txt')
        open(ps, 'w', encoding='utf-8-sig').write(OCR_PS)
        open(lst, 'w', encoding='utf-8').write('\n'.join(os.path.abspath(p) for p in paths))
        out = subprocess.run(['powershell.exe', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps, lst],
                             capture_output=True, timeout=60 + 5 * len(paths))
        res = {}
        for line in out.stdout.decode('utf-8', 'replace').splitlines():
            line = line.strip()
            if line.startswith('{'):
                d = json.loads(line)
                words = d.get('words') or []
                if words and not isinstance(words[0], list):   # PowerShell flattens a list of one
                    words = [words]
                res[os.path.normcase(os.path.abspath(d['file']))] = [tuple(w) for w in words]
        if not res and out.returncode:
            raise RuntimeError('Windows OCR failed: ' + out.stderr.decode('utf-8', 'replace')[:400])
        return {p: res.get(os.path.normcase(os.path.abspath(p)), []) for p in paths}
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def as_number(text):
    t = text.strip().translate(DIGITS)
    return int(t) if re.fullmatch(r'\d{4}', t) else None


def layout(words, W, H):
    """What the words say about a frame: the numbered cells, the region and its count, the tab, and where the buttons
    at the bottom start (anything lower is hidden)."""
    nums, region, count, tabs, regions_btn = [], None, None, [], None
    for text, x, y, w, h in words:
        n = as_number(text)
        if n is not None and 0 < n < 2000:
            nums.append((n, x, y, w, h))
        up = text.upper().strip('.,:')
        if re.fullmatch(r'POK.MON', up):
            up = 'POKEMON'
        if up in (r.upper() for r in REGIONS) and y < H * 0.6:
            region = (up.lower(), x, y, w, h)
        if up in TAB_WORDS and y > H * 0.55:
            tabs.append((TAB_WORDS[up], x, y, w, h))
        if up == 'REGIONS' and y > H * 0.5:
            regions_btn = (x, y, w, h)
    if region:   # the count sits on the same line, to the right: "151 / 151", "151/151" or "107"
        _, rx, ry, rw, rh = region
        line = sorted((x, text) for text, x, y, w, h in words if x > rx + rw and abs((y + h / 2) - (ry + rh / 2)) < rh * 1.2
                      and x < rx + W * 0.6)
        txt = ' '.join(t for _, t in line).replace(' ', '')
        m = re.match(r'^(\d{1,4})(?:/(\d{1,4}))?', txt.translate(DIGITS))
        if m:
            count = (int(m.group(1)), int(m.group(2)) if m.group(2) else None)
    # what hides the list: the tab bar (everything below its top) and the three round buttons above it (search, ×,
    # Regions), placed from the "REGIONS" label under the right-hand one (measured on Android and iPhone screenshots)
    cut, hidden = H - 0.45 * W, []
    if tabs:
        cut = min(t[2] for t in tabs) - 0.06 * W
    if regions_btn:
        x, y, w, h = regions_btn
        cy = y - 0.04 * W
        if not tabs:
            cut = y + h + 0.06 * W
        hidden = [(0.135 * W - 0.08 * W, cy - 0.08 * W, 0.135 * W + 0.08 * W, cy + 0.08 * W),
                  (0.5 * W - 0.08 * W, cy - 0.08 * W, 0.5 * W + 0.08 * W, cy + 0.08 * W),
                  (0.87 * W - 0.10 * W, cy - 0.12 * W, W, y + h + 0.02 * W)]
    elif tabs:
        hidden = [(0, cut - 0.22 * W, W, cut)]   # buttons not found: assume the row above the tab bar is covered
    # the top: the phone's status bar, and the region's card (name, count, "Recently registered") if it's on screen
    top = 0.1 * W
    head = [y + h for text, x, y, w, h in words if y < H * 0.4 and text.lower().strip('.,:') in
            set(REGIONS) | {'recently', 'registered'}]
    if head:
        top = max(top, max(head) + 0.1 * W)
    hidden.append((0, -H, W, top))
    return {'nums': nums, 'region': region[0] if region else None, 'count': count, 'tabs': tabs, 'cut': cut, 'hidden': hidden}


def covered(box, lay):
    x0, y0, x1, y1 = box
    if y1 > lay['cut']:
        return True
    return any(x0 < hx1 and x1 > hx0 and y0 < hy1 and y1 > hy0 for hx0, hy0, hx1, hy1 in lay['hidden'])


def selected_tab(img, tabs):
    """The tab that's chosen: its button is the strong colour (the others are pale)."""
    best = None
    for name, x, y, w, h in tabs:
        ring = img[max(0, y - h // 2):y + h + h // 2, max(0, x - h):x + w + h]
        if ring.size == 0:
            continue
        light = float(np.median(cv2.cvtColor(ring, cv2.COLOR_BGR2LAB)[:, :, 0]))
        if best is None or light < best[0]:
            best = (light, name)
    if best and best[0] < 200:
        return best[1]
    # the chosen tab's white-on-colour name is sometimes not read: then it's the one between its two neighbours
    # (the game's order, as far as screenshots show it)
    order = ['pokemon', 'shiny', 'lucky', 'xxl', 'xxs', 'gmax', 'mega']
    got = sorted((x, name) for name, x, y, w, h in tabs if name in order)
    for (xa, a), (xb, b) in zip(got, got[1:]):
        if order.index(b) - order.index(a) == 2:
            return order[order.index(a) + 1]
    return None


# ---------------------------------------------------------------- the grid
def _clusters(values, tol):
    out = []
    for v in sorted(values):
        if out and v - out[-1][-1] <= tol:
            out[-1].append(v)
        else:
            out.append([v])
    return [float(np.mean(c)) for c in out]


def grid(nums, W):
    """The numbered cells of a frame, each with its place in the grid and its picture's box. Misread numbers (ones that
    break the order) are dropped. Returns (cells, sequential?)."""
    if not nums:
        return [], False
    cxs = [x + w / 2 for _, x, y, w, h in nums]
    cys = [y + h / 2 for _, x, y, w, h in nums]
    hh = float(np.median([h for *_, h in nums]))
    cols = _clusters(cxs, W * 0.05)
    rows = _clusters(cys, hh * 1.2)
    cp = float(np.median(np.diff(cols))) if len(cols) > 1 else W / 4
    if len(cols) > 1:   # a column with no number in this frame (hidden) still counts
        ncols = int(round((cols[-1] - cols[0]) / cp)) + 1
    else:
        ncols = 4
    rp = float(np.median(np.diff(rows))) if len(rows) > 1 else cp * 1.33
    if rp > cp * 2.2:   # rows far apart: rows missing in between
        rp = cp * 1.33
    cells = []
    for (n, x, y, w, h), cx, cy in zip(nums, cxs, cys):
        c = int(round((cx - cols[0]) / cp))
        r = int(round((cy - rows[0]) / rp))
        cells.append({'n': n, 'row': r, 'col': c, 'cx': cx, 'cy': cy, 'top': y, 'cp': cp, 'h': h,
                      'box': (int(cx - 0.42 * cp), int(cy - 0.78 * rp), int(cx + 0.42 * cp), int(y - 0.02 * rp))})
    # tabs listing every Pokémon in order: number = first + place in the grid
    base = Counter(c['n'] - (c['row'] * ncols + c['col']) for c in cells)
    b, k = base.most_common(1)[0]
    sequential = len(cells) >= 3 and k >= max(3, 0.6 * len(cells))
    if sequential:
        cells = [c for c in cells if c['n'] - (c['row'] * ncols + c['col']) == b]
    else:   # other tabs (G-Max, Mega…): numbers only go up (or repeat: Mega X and Y?); keep the longest run that does
        cells.sort(key=lambda c: (c['row'], c['col']))
        best = [[c] for c in cells]
        for i, c in enumerate(cells):
            for j in range(i):
                if cells[j]['n'] <= c['n'] and len(best[j]) + 1 > len(best[i]):
                    best[i] = best[j] + [c]
        cells = max(best, key=len) if best else []
    return cells, sequential


# ---------------------------------------------------------------- one cell
def look(img, box):
    """What's in a cell's picture box: 'blank', 'silhouette' or 'colour', with the measurements behind it and the mask
    of what isn't background."""
    x0, y0, x1, y1 = box
    crop = img[y0:y1, x0:x1]
    lab = cv2.cvtColor(cv2.GaussianBlur(crop, (3, 3), 0), cv2.COLOR_BGR2LAB).astype(np.float32)
    h, w = lab.shape[:2]
    m = max(2, int(w * 0.05))
    # the cell's own background: a straight line top to bottom through the edge pixels (it's a gentle gradient)
    side = np.concatenate([lab[:, :m], lab[:, -m:]], axis=1)          # h × 2m × 3
    ys = np.arange(h, dtype=np.float32)
    rowmed = np.median(side, axis=1)                                   # h × 3
    bg = np.empty_like(rowmed)
    for ch in range(3):
        v = rowmed[:, ch]
        keep = np.abs(v - np.median(v)) < max(3.0, 2.5 * np.median(np.abs(v - np.median(v))))
        if keep.sum() < 5:
            keep[:] = True
        a, b = np.polyfit(ys[keep], v[keep], 1)
        bg[:, ch] = a * ys + b
    diff = lab - bg[:, None, :]
    dist = np.sqrt((diff ** 2).sum(-1))
    mask = (dist > 14).astype(np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    area = float(mask.mean())
    stats = {'area': round(area, 4)}
    if area < 0.004:
        return 'blank', stats, mask
    px = lab[mask > 0]
    bgpx = np.broadcast_to(bg[:, None, :], lab.shape)[mask > 0]
    # a silhouette is one flat colour (with soft edges between it and the background): every pixel lies close to the
    # line from the background's colour to the silhouette's. A real picture has colours well off that line.
    d = px - bgpx
    far = d[np.argsort((d ** 2).sum(-1))[int(len(d) * 0.7):]]
    tip = np.median(far, axis=0)                                       # the silhouette's colour, relative to background
    u = tip / (np.linalg.norm(tip) + 1e-6)
    t = np.clip(d @ u, 0, None)
    resid = np.sqrt(np.maximum((d ** 2).sum(-1) - t ** 2, 0))
    off = float((resid > 12).mean())
    beyond = float((t > np.linalg.norm(tip) + 12).mean())   # darker than the silhouette's own colour: outlines, shading
    # and a silhouette is flat inside (no shading, no outlines): how much the colour varies away from its edges
    e = max(5, int(round(w / 45)) | 1)
    inner = cv2.erode(mask, np.ones((e, e), np.uint8)) > 0
    ipx = lab[inner]
    spread = float(np.sqrt(ipx.var(0).sum())) if len(ipx) > 20 else 0.0
    spread_l = float(ipx[:, 0].std()) if len(ipx) > 20 else 0.0
    stats.update(off=round(off, 3), beyond=round(beyond, 3), spread=round(spread, 2), spreadL=round(spread_l, 2), inner=int(inner.sum()),
                 tip=[round(float(v), 1) for v in tip])
    # a silhouette (even with see-through parts, like Beedrill's wings) has every pixel on that line and none darker
    # than the silhouette itself; measured on real screenshots both are exactly 0, and at least 0.4 for a real picture
    return ('colour' if off + beyond > 0.012 else 'silhouette'), stats, mask


# ---------------------------------------------------------------- the game's pictures, for the cross-check
class Shapes:
    """Every Pokémon's outline and picture (normal, shiny, Mega) at 32×32, for checking a cell against its number."""
    S = 32

    def __init__(self):
        dex = json.load(open(os.path.join(ROOT, 'data', 'go', 'dex.json'), encoding='utf-8'))['entries']
        keys = []
        for e in dex:
            for k in (e['img'], e.get('femaleImg')):
                if k:
                    keys += [(k, e['dex']), (k + '.s', e['dex'])]
            for mg in e.get('mega') or []:
                keys += [(mg['img'], e['dex']), (mg['img'] + '.s', e['dex'])]
        self.dex, masks, labs = [], [], []
        for k, n in dict.fromkeys(keys):
            p = os.path.join(SPRITES, k + '.webp')
            im = cv2.imread(p, cv2.IMREAD_UNCHANGED) if os.path.exists(p) else None
            if im is None or im.ndim != 3 or im.shape[2] != 4:
                continue
            got = self.norm(im[:, :, :3], im[:, :, 3] > 40)
            if got:
                self.dex.append(n); masks.append(got[0]); labs.append(got[1])
        self.dex = np.array(self.dex); self.mask = np.stack(masks); self.lab = np.stack(labs)

    def norm(self, bgr, mask):
        ys, xs = np.where(mask)
        if len(xs) < 20:
            return None
        crop_m = mask[ys.min():ys.max() + 1, xs.min():xs.max() + 1].astype(np.uint8) * 255
        crop_c = bgr[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        h, w = crop_m.shape; s = self.S / max(h, w)
        nw, nh = max(1, round(w * s)), max(1, round(h * s))
        cm = np.zeros((self.S, self.S), np.float32); cc = np.zeros((self.S, self.S, 3), np.float32)
        y0, x0 = (self.S - nh) // 2, (self.S - nw) // 2
        cm[y0:y0 + nh, x0:x0 + nw] = cv2.resize(crop_m, (nw, nh), interpolation=cv2.INTER_AREA) / 255.0
        cc[y0:y0 + nh, x0:x0 + nw] = cv2.cvtColor(cv2.resize(crop_c, (nw, nh), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2LAB)
        return cm, cc

    def rank(self, bgr, mask, n, colour):
        """Where Pokémon n comes among the closest pictures (1 = closest), by outline (and colour, for a colour cell)."""
        got = self.norm(bgr, mask > 0)
        if not got:
            return None
        m, c = got
        score = np.abs(self.mask - m[None]).mean((1, 2)) * 3
        if colour:
            both = self.mask * m[None]
            score = score + (np.abs(self.lab - c[None]).sum(-1) * both).sum((1, 2)) / np.maximum(both.sum((1, 2)), 1) / 60
        best = {}
        for i in np.argsort(score):
            best.setdefault(int(self.dex[i]), len(best) + 1)
            if n in best:
                return best[n]
        return None


# ---------------------------------------------------------------- frames
def frames_of(src, fps, tmp):
    if os.path.isdir(src):
        return sorted(f for e in ('*.png', '*.jpg', '*.jpeg', '*.webp') for f in glob.glob(os.path.join(src, e)))
    if os.path.splitext(src)[1].lower() in ('.png', '.jpg', '.jpeg', '.webp'):
        return [src]
    ff = shutil.which('ffmpeg') or 'ffmpeg'
    subprocess.run([ff, '-loglevel', 'error', '-i', src, '-vf', f'fps={fps}', os.path.join(tmp, 'f%05d.png')], check=True)
    return sorted(glob.glob(os.path.join(tmp, '*.png')))


def disturbed(img, c):
    """Is something lying over this cell? The thin strips of background either side of its tile should be one smooth
    colour from top to bottom; a pop-up or a banner crossing the cell shows as a jump."""
    x0, y0, x1, y1 = c['box']
    H, W = img.shape[:2]
    ya, yb = max(0, y0), min(H, int(c['top'] + c['h']))
    for gx in (int(c['cx'] - 0.5 * c['cp']), int(c['cx'] + 0.5 * c['cp'])):
        if gx - 1 < 0 or gx + 2 > W:
            continue
        strip = cv2.cvtColor(img[ya:yb, gx - 1:gx + 2], cv2.COLOR_BGR2LAB).astype(np.float32).mean(1)
        if len(strip) < 10:
            continue
        k = max(3, len(strip) // 20) | 1
        sm = cv2.medianBlur(np.ascontiguousarray(strip[:, None, :]).astype(np.uint8), k)[:, 0, :].astype(np.float32)
        if float(np.sqrt(((sm - np.median(sm, 0)) ** 2).sum(1)).max()) > 12:
            return True
    return False


def sharpness(img):
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(g, cv2.CV_64F).var())


def read_frames(paths, words=None, shapes=None, debug=None):
    """Every numbered cell in every frame: [{'frame', 'n', 'state', 'stats', 'rank'}], plus what the frames said about
    the region, the count and the tab."""
    words = words if words is not None else ocr(paths)
    seen, regions, counts, tabs = [], Counter(), Counter(), Counter()
    sharp = {}
    for p in paths:
        img = cv2.imread(p)
        if img is None:
            continue
        sharp[p] = sharpness(img)
    if not sharp:
        return seen, {}
    blur_line = float(np.median(list(sharp.values()))) * 0.35   # much blurrier than usual: scrolling fast, skip
    for p in paths:
        img = cv2.imread(p)
        if img is None:
            continue
        H, W = img.shape[:2]
        lay = layout(words.get(p, []), W, H)
        if lay['region']:
            regions[lay['region']] += 1
            if lay['count']:
                counts[(lay['region'],) + lay['count']] += 1
        t = selected_tab(img, lay['tabs'])
        if t:
            tabs[t] += 1
        if sharp[p] < blur_line and len(paths) > 2:
            continue
        cells, sequential = grid(lay['nums'], W)
        for c in cells:
            x0, y0, x1, y1 = c['box']
            if y0 < 0 or x0 < 0 or x1 > W or y1 - y0 < 10 or covered(c['box'], lay):
                continue   # partly off screen, or behind the buttons at the bottom
            if disturbed(img, c):
                continue   # something over it (a pop-up, a finger's ripple…)
            state, stats, mask = look(img, c['box'])
            rank = None
            if shapes is not None and state != 'blank' and t != 'gmax':   # no G-Max pictures to compare with
                rank = shapes.rank(img[y0:y1, x0:x1], mask, c['n'], state == 'colour')
            seen.append({'frame': os.path.basename(p), 'n': c['n'], 'state': state, 'stats': stats, 'rank': rank,
                         'sequential': sequential})
            if debug:
                os.makedirs(debug, exist_ok=True)
                cv2.imwrite(os.path.join(debug, f"{os.path.splitext(os.path.basename(p))[0]}-{c['n']:04d}-{state}.png"),
                            img[y0:y1, x0:x1])
    return seen, {'regions': regions, 'counts': counts, 'tabs': tabs}


def combine(seen):
    """One answer per Pokédex number: what most frames say. Ties and disagreements go on the 'unsure' list."""
    votes = defaultdict(Counter)
    ranks = defaultdict(list)
    for s in seen:
        votes[s['n']][s['state']] += 1
        if s['rank'] is not None:
            ranks[s['n']].append(s['rank'])
    out = {}
    for n, v in sorted(votes.items()):
        (top, k), *rest = v.most_common()
        sure = not rest or k >= 2 * rest[0][1]
        out[n] = {'registered': top == 'colour', 'state': top, 'frames': sum(v.values()), 'votes': dict(v), 'sure': sure,
                  'rank': min(ranks[n]) if ranks[n] else None}
    return out


def region_numbers():
    """{region: sorted Pokédex numbers out in GO}, as the app splits them (regional forms count with their species)."""
    dex = json.load(open(os.path.join(ROOT, 'data', 'go', 'dex.json'), encoding='utf-8'))['entries']
    out = defaultdict(set)
    for e in dex:
        if not e.get('released'):
            continue
        g = 'hisui' if 899 <= e['dex'] <= 905 else str(e['gen'])
        out[next(r for r, k in GEN_OF.items() if k == g)].add(e['dex'])
    return {r: sorted(v) for r, v in out.items()}


TICK = {'pokemon': ('c',), 'shiny': ('s',), 'lucky': ('l',), '100': ('h',), 'shadow': ('sd',), 'purified': ('pu',),
        'gmax': ('gx',), 'mega': ('mg', 'mx', 'my')}


def not_ticked(numbers, tab):
    """Of these Pokédex numbers, the ones with that box ticked on none of their forms in the app (her ticks are only
    read, never changed). None where the app has no box for the tab."""
    if tab not in TICK:
        return None
    col = json.load(open(os.path.join(ROOT, 'data', 'collection', 'go.json'), encoding='utf-8'))
    have = set()
    for key, ticks in col.get('have', {}).items():
        if key.startswith('d:') and any(t in TICK[tab] for t in ticks):
            have.add(int(key[2:].split('-')[0]))
    return [n for n in numbers if n not in have]


def ranges(ns):
    """[1, 2, 3, 6, 25] -> '1-3, 6, 25'"""
    out, ns = [], sorted(ns)
    i = 0
    while i < len(ns):
        j = i
        while j + 1 < len(ns) and ns[j + 1] == ns[j] + 1:
            j += 1
        out.append(str(ns[i]) if i == j else f'{ns[i]}-{ns[j]}' if j > i + 1 else f'{ns[i]}, {ns[j]}')
        i = j + 1
    return ', '.join(out)


def summarise(result, info, tab=None, region=None, source=''):
    tab = tab or (info['tabs'].most_common(1)[0][0] if info.get('tabs') else None)
    region = region or (info['regions'].most_common(1)[0][0] if info.get('regions') else None)
    nums = region_numbers()
    want = nums.get(region, [])
    if region:
        result = {n: r for n, r in result.items() if n in want}
    yes = [n for n, r in result.items() if r['registered']]
    no = [n for n, r in result.items() if not r['registered']]
    unsure = [n for n, r in result.items() if not r['sure']]
    count = None
    if info.get('counts'):
        cs = [c for c in info['counts'] if c[0] == region] or list(info['counts'])
        best = max(cs, key=lambda c: info['counts'][c])
        count = {'got': best[1], 'of': best[2]}
    checked = [r['rank'] for r in result.values() if r['rank'] is not None]
    word = TABS.get(tab, (None, None))[1] if tab else None
    return {
        'source': source, 'tab': tab, 'region': region, 'onScreenCount': count,
        'registered': yes, 'notRegistered': no, 'unsure': unsure,
        'notSeen': [n for n in want if n not in result] if (region and tab in (None, 'pokemon', 'shiny', 'lucky', '100', 'xxl', 'xxs')) else [],
        'pictureCheck': {'checked': len(checked), 'closest': sum(1 for k in checked if k == 1),
                         'top5': sum(1 for k in checked if k <= 5)} if checked else None,
        'quickAdd': (ranges(yes) + (f' {word}' if word and word != 'caught' else '')) if yes and word else None,
        'cells': {str(n): {k: v for k, v in r.items() if k != 'registered'} for n, r in result.items()},
        'note': 'A proposal only: nothing has been ticked. Check it, then paste quickAdd into the Quick add page.',
    }


def report(s):
    tab = TABS.get(s['tab'], (s['tab'] or 'unknown tab',))[0]
    print(f"{(s['region'] or 'unknown region').title()}, {tab} tab: {len(s['registered'])} in colour, "
          f"{len(s['notRegistered'])} not ({len(s['registered']) + len(s['notRegistered'])} cells read)")
    c = s['onScreenCount']
    if c:
        print(f"  the game says {c['got']}" + (f" / {c['of']}" if c['of'] else '') +
              ('  - matches' if c['got'] == len(s['registered']) else
               f"  - {len(s['registered'])} found so far (not every cell was read)" if s['notSeen'] else
               f"  - DOESN'T match ({len(s['registered'])} found): check the unsure ones"))
    if s['notSeen']:
        print(f"  not seen in any frame ({len(s['notSeen'])}): {ranges(s['notSeen'])} "
              f"(scrolled past too fast, or hidden: scroll over them again)")
    if s['unsure']:
        print(f"  frames disagree, check by eye: {ranges(s['unsure'])}")
    pc = s['pictureCheck']
    if pc:
        print(f"  picture check: the number's own picture was closest for {pc['closest']} of {pc['checked']}, "
              f"among the 5 closest for {pc['top5']}")
    if s['quickAdd']:
        print(f"  Quick add: {s['quickAdd']}")
    elif s['registered']:
        print(f"  in colour: {ranges(s['registered'])} (the app has no box for this tab)")


# ---------------------------------------------------------------- self-test
FONT = cv2.FONT_HERSHEY_DUPLEX


def make_list(keys, states, W=720, tint=(236, 200, 160), count=None, cols=4, seed=0):
    """A made-up Pokédex list in the game's layout (the region's card, then 4 columns of tiles with the number under the
    picture), as one tall picture, from the game's own pictures. states[i] = 'colour' / 'silhouette' / 'blank'."""
    rng = np.random.default_rng(seed)
    k = W / 1080
    cp = (W - 80 * k) / cols; rp = cp * 1.33
    top = 430 * k
    H = int(top + rp * ((len(keys) + cols - 1) // cols) + 500 * k)
    img = np.zeros((H, W, 3), np.uint8)
    img[:] = np.array(tint, np.uint8)
    sil = tuple(int(v * 0.72) for v in tint)
    ink = tuple(int(v * 0.55) for v in tint)
    th2, th3 = max(1, int(round(2 * k))), max(1, int(round(3 * k)))
    cv2.rectangle(img, (int(40 * k), int(90 * k)), (int(W - 40 * k), int(400 * k)), tuple(min(255, int(v * 1.08)) for v in tint), -1)
    cv2.putText(img, 'KANTO', (int(80 * k), int(170 * k)), FONT, 1.6 * k, ink, th3, cv2.LINE_AA)
    cv2.putText(img, str(count if count is not None else ''), (int(460 * k), int(170 * k)), FONT, 1.6 * k, ink, th3, cv2.LINE_AA)
    cv2.putText(img, 'Recently registered', (int(80 * k), int(290 * k)), FONT, 1.0 * k, ink, th2, cv2.LINE_AA)
    for i, (key, st) in enumerate(zip(keys, states)):
        r, c = divmod(i, cols)
        x0, y0 = int(40 * k + c * cp + 6 * k), int(top + r * rp + 6 * k)
        x1, y1 = int(40 * k + (c + 1) * cp - 6 * k), int(top + (r + 1) * rp - 6 * k)
        cv2.rectangle(img, (x0, y0), (x1, y1), tuple(min(255, int(v * 1.06)) for v in tint), -1)
        cv2.rectangle(img, (x0, y0), (x1, y1), tuple(min(255, int(v * 1.12)) for v in tint), th2)
        if st != 'blank':
            im = cv2.imread(os.path.join(SPRITES, key + '.webp'), cv2.IMREAD_UNCHANGED)
            size = int(cp * rng.uniform(0.45, 0.85))   # the game draws small Pokémon small
            im = cv2.resize(im, (size, size), interpolation=cv2.INTER_AREA)
            px, py = int((x0 + x1) / 2 - size / 2), int(y1 - rp * 0.22 - size)
            a = im[:, :, 3:4] / 255.0
            pic = im[:, :, :3] if st == 'colour' else np.full_like(im[:, :, :3], sil)
            reg = img[py:py + size, px:px + size]
            img[py:py + size, px:px + size] = (reg * (1 - a) + pic * a).astype(np.uint8)
        (tw, th), _ = cv2.getTextSize(f'{i + 1:04d}', FONT, 1.5 * k, th2)
        cv2.putText(img, f'{i + 1:04d}', (int((x0 + x1) / 2 - tw / 2), int(y1 - rp * 0.07)), FONT, 1.5 * k, ink, th2, cv2.LINE_AA)
    return img


def make_frame(listimg, offset, H, tint, tab='SHINY', popup=False, blur=0):
    """One screen of the list, scrolled down by offset, with the game's buttons and tab bar on top."""
    W = listimg.shape[1]; k = W / 1080
    th2, th3 = max(1, int(round(2 * k))), max(1, int(round(3 * k)))
    shade = (1.0 - 0.10 * np.arange(H) / H)[:, None, None]   # the background's gentle gradient
    img = (np.broadcast_to(np.array(tint, np.float32), (H, W, 3)) * shade).astype(np.uint8)
    part = listimg[offset:offset + H]
    img[:len(part)] = (part.astype(np.float32) * shade[:len(part)]).astype(np.uint8)
    if blur:
        img = cv2.blur(img, (1, blur))
    for cx in (int(150 * k), W // 2):
        cv2.circle(img, (cx, int(H - 450 * k)), int(70 * k), (250, 250, 250), -1)
        cv2.circle(img, (cx, int(H - 450 * k)), int(70 * k), (90, 90, 90), th3)
    cv2.circle(img, (int(W - 150 * k), int(H - 470 * k)), int(80 * k), (250, 250, 250), -1)
    cv2.putText(img, 'REGIONS', (int(W - 260 * k), int(H - 360 * k)), FONT, 1.1 * k, (60, 60, 60), th2, cv2.LINE_AA)
    cv2.rectangle(img, (0, int(H - 290 * k)), (W, int(H - 170 * k)), (250, 250, 250), -1)
    cv2.rectangle(img, (int(W / 2 - 170 * k), int(H - 290 * k)), (int(W / 2 + 170 * k), int(H - 170 * k)),
                  tuple(int(v * 0.5) for v in tint), -1)
    cv2.putText(img, tab, (int(W / 2 - 85 * k), int(H - 210 * k)), FONT, 1.5 * k, (255, 255, 255), th3, cv2.LINE_AA)
    cv2.putText(img, 'LUCKY', (int(W / 2 + 230 * k), int(H - 210 * k)), FONT, 1.5 * k, (80, 80, 80), th3, cv2.LINE_AA)
    if popup:   # something popping up over the list (a message, or a Pokémon's page starting to open)
        cv2.rectangle(img, (int(90 * k), int(H * 0.3)), (int(W - 90 * k), int(H * 0.55)), (252, 252, 252), -1)
        cv2.putText(img, 'Pokemon GO', (int(300 * k), int(H * 0.42)), FONT, 1.4 * k, (50, 50, 50), th2, cv2.LINE_AA)
    return cv2.GaussianBlur(img, (3, 3), 0)


def make_recording(path, truth, plain, W=720, H=1560, tint=(150, 215, 245), seed=0):
    """A made-up screen recording (mp4, 30 a second) of scrolling down the Kanto Shiny tab: steady scrolling, a few fast
    flicks (blurred), pauses, and a pop-up for a moment."""
    ns = sorted(truth)
    keys = [plain[n]['img'] + ('.s' if truth[n] == 'colour' else '') for n in ns]
    listimg = make_list(keys, [truth[n] for n in ns], W, tint, count=sum(1 for n in ns if truth[n] == 'colour'), seed=seed)
    end = listimg.shape[0] - H + int(300 * W / 1080)
    tmp = tempfile.mkdtemp(prefix='pokedex-rec-')
    try:
        y, i, speed = 0.0, 0, 0.0
        while y < end:
            phase = (i // 45) % 4                         # 1.5 s of each: pause, steady, steady, fast
            want = [0, 14, 18, 45][phase] * W / 720       # pixels per frame
            speed += (want - speed) * 0.3
            y = min(end, y + speed)
            blur = int(speed * 0.3) if speed > 25 * W / 720 else 0   # compression smears fast scrolling
            fr = make_frame(listimg, int(y), H, tint, popup=(90 <= i < 100), blur=blur)
            cv2.imwrite(os.path.join(tmp, f'f{i:05d}.png'), fr)
            i += 1
        ff = shutil.which('ffmpeg') or 'ffmpeg'
        subprocess.run([ff, '-loglevel', 'error', '-y', '-framerate', '30', '-i', os.path.join(tmp, 'f%05d.png'),
                        '-c:v', 'libx264', '-crf', '28', '-pix_fmt', 'yuv420p', path], check=True)
        return i
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def selftest(seed=7):
    """A made-up screen recording of the Kanto Shiny tab (shiny pictures in colour, the rest silhouettes or blank),
    read back as she'd read a real one. Reports cells right, the count, and the picture check."""
    rng = np.random.default_rng(seed)
    dex = json.load(open(os.path.join(ROOT, 'data', 'go', 'dex.json'), encoding='utf-8'))['entries']
    plain = {e['dex']: e for e in dex if not e.get('form') and e['dex'] <= 151}
    truth = {n: str(rng.choice(['colour', 'colour', 'silhouette', 'blank'])) for n in range(1, 152)}
    tmp = tempfile.mkdtemp(prefix='pokedex-selftest-')
    try:
        video = os.path.join(tmp, 'kanto-shiny.mp4')
        nframes = make_recording(video, truth, plain, seed=seed)
        frames = os.path.join(tmp, 'frames'); os.makedirs(frames)
        paths = frames_of(video, 3, frames)
        seen, info = read_frames(paths, shapes=Shapes())
        res = combine(seen)
        s = summarise(res, info, source='self-test')
        right = sum(1 for n, r in res.items() if r['registered'] == (truth[n] == 'colour'))
        state_right = sum(1 for n, r in res.items() if r['state'] == truth[n])
        print(f'self-test: a made-up {nframes / 30:.0f}-second recording of the Kanto Shiny tab, {len(paths)} frames read')
        print(f'  cells read: {len(res)} of 151; registered or not right: {right}/{len(res)}; '
              f'blank/silhouette/colour right: {state_right}/{len(res)}')
        wrong = [f"#{n} read {r['state']}, was {truth[n]}" for n, r in res.items() if r['state'] != truth[n]]
        if wrong:
            print('  wrong: ' + '; '.join(wrong))
        report(s)
        return right, len(res), s
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    if '--selftest' in sys.argv:
        selftest(); return
    opts = {}
    args = []
    it = iter(sys.argv[1:])
    for a in it:
        if a in ('--tab', '--region', '--fps', '--out', '--debug'):
            opts[a[2:]] = next(it, None)
        elif a.startswith('--'):
            opts[a[2:]] = True
        else:
            args.append(a)
    if not args:
        print(__doc__); return
    if opts.get('tab') and opts['tab'].lower().replace('%', '').replace('-', '') not in TABS:
        raise SystemExit(f"--tab must be one of: {', '.join(TABS)}")
    tab = opts.get('tab', '').lower().replace('%', '').replace('-', '') or None
    region = (opts.get('region') or '').lower() or None
    tmp = tempfile.mkdtemp(prefix='pokedex-frames-')
    try:
        paths = frames_of(args[0], float(opts.get('fps') or 3), tmp)
        if not paths:
            raise SystemExit('No pictures found.')
        print(f'{len(paths)} frame(s); reading the words…')
        words = ocr(paths)
        shapes = None if opts.get('no-check') else Shapes()
        seen, info = read_frames(paths, words, shapes, debug=opts.get('debug'))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    s = summarise(combine(seen), info, tab, region, source=os.path.basename(args[0]))
    s['newComparedWithHerTicks'] = not_ticked(s['registered'], s['tab'])
    out = opts.get('out') or os.path.join(ROOT, 'imports', f"pokedex-{s['tab'] or 'tab'}-{s['region'] or 'region'}.json")
    if os.path.normcase(os.path.abspath(out)).endswith(os.path.normcase(os.path.join('collection', 'go.json'))):
        raise SystemExit('This never writes her ticks file.')
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    json.dump(s, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    report(s)
    new = s['newComparedWithHerTicks']
    if new is not None:
        print(f"  not ticked in the app yet: {len(new)}" + (f" ({ranges(new)})" if new else ''))
    print(f'Proposal written to {out} (her ticks are unchanged).')


if __name__ == '__main__':
    main()
