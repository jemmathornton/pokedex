"""PROTOTYPE (10 Nov 2026, overnight): read Pokémon off screenshots or a screen recording of Pokémon GO, by matching the
pictures on screen against the game's own pictures the app already has (site/sprites/). Nothing here writes her ticks:
it writes a report of what it saw, for her to check, and an import can come later.

    python -X utf8 tools/read_screens.py <video or folder of screenshots> [--fps 2] [--out research/screen-read.json]
    python -X utf8 tools/read_screens.py --selftest      checks itself on made-up screens built from the sprites

How it works: a recording is split into still frames with ffmpeg (2 a second). On each frame, the Pokémon pictures are
found as blobs that stand out from the light background, cut out, and compared with every picture (normal and shiny) at
a small size, by colour and shape, using the picture's own transparency. The closest picture names the Pokémon and tells
shiny from normal. Each Pokémon is reported once, with how sure the match was. Needs: opencv-python, numpy, ffmpeg.

Self-test (10 Nov): 86% named right on made-up screens (most misses: costumes that look alike). Not done yet (needs a real recording from her phone to tune): the exact layout of GO's Pokédex and storage screens,
reading the numbers and names with OCR (Windows' built-in OCR works here), costumes, and the Lucky/Shadow marks.
"""
import glob, json, os, shutil, subprocess, sys, tempfile
import numpy as np, cv2

ROOT = os.environ.get('POKEDEX_ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPRITES = os.path.join(ROOT, 'site', 'sprites')
SIZE = 32   # compare at 32×32 first
FINE = 64   # then the closest 40 again at 64×64


def _norm(img_bgra, size=None):
    """A picture -> (colour vector, mask vector) at SIZE×SIZE, cropped to what isn't see-through."""
    SIZE_ = size or SIZE
    a = img_bgra[:, :, 3]
    ys, xs = np.where(a > 40)
    if len(xs) == 0:
        return None
    crop = img_bgra[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = crop.shape[:2]; s = SIZE_ / max(h, w)
    small = cv2.resize(crop, (max(1, round(w * s)), max(1, round(h * s))), interpolation=cv2.INTER_AREA)
    canvas = np.zeros((SIZE_, SIZE_, 4), np.uint8)
    y0, x0 = (SIZE_ - small.shape[0]) // 2, (SIZE_ - small.shape[1]) // 2
    canvas[y0:y0 + small.shape[0], x0:x0 + small.shape[1]] = small
    lab = cv2.cvtColor(canvas[:, :, :3], cv2.COLOR_BGR2LAB).astype(np.float32)
    mask = (canvas[:, :, 3] > 40).astype(np.float32)
    return lab, mask


class Library:
    """Every picture the app has (128 px), with its entry/costume and whether it's the shiny one."""

    def __init__(self):
        sys.path.insert(0, os.path.join(ROOT, 'tools'))
        dex = json.load(open(os.path.join(ROOT, 'data', 'go', 'dex.json'), encoding='utf-8'))['entries']
        cos = json.load(open(os.path.join(ROOT, 'data', 'go', 'costumes.json'), encoding='utf-8'))['costumes']
        owner = {}
        for e in dex:
            for k in (e['img'], e.get('femaleImg')):
                if k:
                    owner[k] = ('d:' + e['id'], False); owner[k + '.s'] = ('d:' + e['id'], True)
        for c in cos:
            owner[c['img']] = ('c:' + c['id'], False); owner[c['img'] + '.s'] = ('c:' + c['id'], True)
        self.keys, labs, masks, self.fine = [], [], [], []
        for k, who in owner.items():
            p = os.path.join(SPRITES, k + '.webp')
            if not os.path.exists(p):
                continue
            im = cv2.imread(p, cv2.IMREAD_UNCHANGED)
            if im is None or im.ndim != 3 or im.shape[2] != 4:
                continue
            n = _norm(im)
            if n is None:
                continue
            self.keys.append((k, who[0], who[1])); labs.append(n[0]); masks.append(n[1]); self.fine.append(_norm(im, FINE))
        self.lab = np.stack(labs); self.mask = np.stack(masks)

    def match(self, lab, mask, top=3, cut=None):
        """The closest pictures to one cut-out: colour difference where both have picture, plus shape difference;
        then the closest 40 looked at again at 64 px (when the cut-out itself is given)."""
        both = self.mask * mask[None]
        col = (np.abs(self.lab - lab[None]).sum(-1) * both).sum((1, 2)) / np.maximum(both.sum((1, 2)), 1)
        shape = np.abs(self.mask - mask[None]).sum((1, 2)) / (SIZE * SIZE)
        score = col / 60 + shape * 3
        order = np.argsort(score)[:40 if cut is not None else top]
        if cut is not None:
            fl, fm = _norm(cut, FINE)
            fine = []
            for i in order:
                L, M = self.fine[i]
                b = M * fm
                c = (np.abs(L - fl).sum(-1) * b).sum() / max(b.sum(), 1)
                sh = np.abs(M - fm).sum() / (FINE * FINE)
                fine.append(c / 60 + sh * 3)
            order = [order[j] for j in np.argsort(fine)[:top]]
            return [(self.keys[i], float(sorted(fine)[n])) for n, i in enumerate(order)]
        return [(self.keys[i], float(score[i])) for i in order]


def blobs(frame_bgr):
    """The Pokémon pictures on a screen: parts that differ from the light background, of a sensible size."""
    g = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2LAB)
    bg = cv2.medianBlur(g, 51)
    diff = np.abs(g.astype(np.int16) - bg.astype(np.int16)).sum(-1)
    m = (diff > 14).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
    H, W = m.shape
    out = []
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        if w < W * 0.06 or h < W * 0.06 or w > W * 0.6 or h > W * 0.6 or area < w * h * 0.15:
            continue
        crop = frame_bgr[y:y + h, x:x + w]
        alpha = ((lab[y:y + h, x:x + w] == i) * 255).astype(np.uint8)
        out.append((x, y, w, h, np.dstack([crop, alpha])))
    return out


def read(frames, lib, sure=0.9):
    seen = {}
    for f in frames:
        img = cv2.imread(f)
        if img is None:
            continue
        for x, y, w, h, cut in blobs(img):
            n = _norm(cut)
            if n is None:
                continue
            (key, who, shiny), score = lib.match(*n, top=1, cut=cut)[0]
            if score > sure:
                continue
            k = (who, shiny)
            if k not in seen or score < seen[k]['score']:
                seen[k] = {'key': who, 'shiny': shiny, 'picture': key, 'score': round(score, 3), 'frame': os.path.basename(f)}
    return sorted(seen.values(), key=lambda r: r['score'])


def frames_of(src, fps, tmp):
    if os.path.isdir(src):
        return sorted(glob.glob(os.path.join(src, '*.png')) + glob.glob(os.path.join(src, '*.jpg')))
    ff = shutil.which('ffmpeg') or 'ffmpeg'
    subprocess.run([ff, '-loglevel', 'error', '-i', src, '-vf', f'fps={fps}', os.path.join(tmp, 'f%05d.png')], check=True)
    return sorted(glob.glob(os.path.join(tmp, '*.png')))


def selftest(n_screens=6, per=12, seed=4):
    """Made-up screens: 12 random pictures each on a light background in a 3-wide grid, a little resized and blurred,
    like a phone screenshot. Reports how many it names right, and right shiny-or-not."""
    rng = np.random.default_rng(seed)
    lib = Library()
    tmp = tempfile.mkdtemp(prefix='screens-')
    truth = []
    for s in range(n_screens):
        W, H = 1080, 2340
        screen = np.full((H, W, 3), (246, 248, 244), np.uint8)
        for i in range(per):
            k = lib.keys[rng.integers(len(lib.keys))]
            im = cv2.imread(os.path.join(SPRITES, k[0] + '.webp'), cv2.IMREAD_UNCHANGED)
            size = int(rng.integers(230, 300)); im = cv2.resize(im, (size, size), interpolation=cv2.INTER_CUBIC)
            col, row = i % 3, i // 3
            x, y = 60 + col * 340, 200 + row * 520
            a = im[:, :, 3:4] / 255.0
            screen[y:y + size, x:x + size] = (screen[y:y + size, x:x + size] * (1 - a) + im[:, :, :3] * a).astype(np.uint8)
            truth.append((s, k))
        screen = cv2.GaussianBlur(screen, (3, 3), 0)
        cv2.imwrite(os.path.join(tmp, f's{s:02d}.png'), screen)
    right = right_shiny = 0
    for s in range(n_screens):
        img = cv2.imread(os.path.join(tmp, f's{s:02d}.png'))
        found = []
        for x, y, w, h, cut in blobs(img):
            nn = _norm(cut)
            if nn is not None:
                found.append(lib.match(*nn, top=1, cut=cut)[0][0])
        want = [k for t, k in truth if t == s]
        for k in want:
            if any(f[1] == k[1] for f in found): right += 1
            if any(f[1] == k[1] and f[2] == k[2] for f in found): right_shiny += 1
    shutil.rmtree(tmp, ignore_errors=True)
    total = len(truth)
    print(f'self-test: {len(lib.keys)} pictures in the library; {total} Pokémon on {n_screens} made-up screens')
    print(f'  named right: {right}/{total} ({right / total:.0%}); named right and shiny-or-not right: {right_shiny}/{total} ({right_shiny / total:.0%})')
    return right / total, right_shiny / total


def main():
    if '--selftest' in sys.argv:
        selftest(); return
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        print(__doc__); return
    fps = float(sys.argv[sys.argv.index('--fps') + 1]) if '--fps' in sys.argv else 2
    out = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else os.path.join(ROOT, 'research', 'screen-read.json')
    tmp = tempfile.mkdtemp(prefix='frames-')
    try:
        lib = Library()
        res = read(frames_of(args[0], fps, tmp), lib)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    json.dump(res, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{len(res)} Pokémon seen; report in {out}')


if __name__ == '__main__':
    main()
