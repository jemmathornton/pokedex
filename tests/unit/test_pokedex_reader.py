"""The game's-Pokédex reader (tools/read_pokedex.py) on real screenshots of the Feb 2025 Pokédex (from Pokémon GO Hub
and Dittobase's articles, cut down to 720 px wide: tests/fixtures/pokedex/): every cell it reads is right (colour,
silhouette or blank), cells behind the buttons are skipped, the region, count and tab are read, a misread number is
dropped, the Quick add line is right, and it never touches her ticks. The words on each screenshot are saved
(words.json, from Windows' OCR) so most tests don't need the OCR; one checks the OCR itself."""
import json, os, subprocess, sys, tempfile, shutil, unittest
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)
from support import PYTHON, REAL, fingerprint, load

FIX = os.path.join(HERE, 'fixtures', 'pokedex')
S, C, B = 'silhouette', 'colour', 'blank'
# checked by eye on the full screenshots
TRUTH = {
    'xxs-kanto.jpg': ({1: S, 2: S, 3: S, 4: C, 5: C, 6: C, 7: C, 8: C, 9: C, 10: S, 11: S, 12: S}, 'xxs', ('kanto', 94, None)),
    'gmax-kanto.jpg': ({3: S, 6: S, 9: S, 12: B, 25: B, 52: B}, 'gmax', None),
    'pokemon-kanto-iphone.jpg': ({n: C for n in range(1, 16)}, 'pokemon', ('kanto', 151, 151)),
}


class PokedexReader(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rp = load('read_pokedex')
        cls.words = json.load(open(os.path.join(FIX, 'words.json'), encoding='utf-8'))

    def frames(self, name, words=None):
        p = os.path.join(FIX, name)
        return self.rp.read_frames([p], {p: [tuple(w) for w in (words or self.words[name])]})

    def test_every_cell_read_is_right(self):
        for name, (truth, _, _) in TRUTH.items():
            with self.subTest(name):
                seen, _ = self.frames(name)
                self.assertEqual({s['n']: s['state'] for s in seen}, truth)

    def test_region_count_and_tab(self):
        for name, (_, tab, count) in TRUTH.items():
            with self.subTest(name):
                _, info = self.frames(name)
                self.assertEqual(info['regions'].most_common(1)[0][0], 'kanto')
                self.assertEqual(info['tabs'].most_common(1)[0][0], tab)
                if count:
                    self.assertEqual(info['counts'].most_common(1)[0][0], count)

    def test_a_misread_number_is_dropped(self):
        words = [list(w) for w in self.words['xxs-kanto.jpg']]
        for w in words:
            if w[0] == '0006':
                w[0] = '0066'
        seen, _ = self.frames('xxs-kanto.jpg', words)
        got = {s['n']: s['state'] for s in seen}
        self.assertNotIn(66, got)
        self.assertEqual(got, {n: st for n, st in TRUTH['xxs-kanto.jpg'][0].items() if n != 6})

    def test_proposal_and_quick_add_line(self):
        rp = self.rp
        self.assertEqual(rp.ranges([1, 2, 3, 6, 25, 26]), '1-3, 6, 25, 26')
        seen, info = self.frames('pokemon-kanto-iphone.jpg')
        s = rp.summarise(rp.combine(seen), info)
        self.assertEqual((s['tab'], s['region']), ('pokemon', 'kanto'))
        self.assertEqual(s['quickAdd'], '1-15')
        self.assertEqual(s['onScreenCount'], {'got': 151, 'of': 151})
        self.assertEqual(s['notSeen'], list(range(16, 152)))
        fake = {n: {'registered': n in (1, 2, 3, 25), 'state': C if n in (1, 2, 3, 25) else S, 'sure': True, 'rank': 1,
                    'frames': 1, 'votes': {}} for n in (1, 2, 3, 4, 25)}
        s = rp.summarise(fake, {}, tab='shiny', region='kanto')
        self.assertEqual(s['quickAdd'], '1-3, 25 shiny')
        self.assertIsNone(rp.summarise(fake, {}, tab='xxl', region='kanto')['quickAdd'], 'no XXL box in the app')

    @unittest.skipUnless(os.name == 'nt', "needs Windows' own OCR")
    def test_windows_ocr_reads_the_numbers(self):
        p = os.path.join(FIX, 'xxs-kanto.jpg')
        words = self.rp.ocr([p])[p]
        nums = {self.rp.as_number(w[0]) for w in words} - {None}
        self.assertTrue(set(range(1, 13)) <= nums, sorted(nums))

    @unittest.skipUnless(os.name == 'nt', "needs Windows' own OCR")
    def test_never_writes_her_ticks(self):
        before = fingerprint()
        tmp = tempfile.mkdtemp()
        try:
            out = os.path.join(tmp, 'proposal.json')
            r = subprocess.run([PYTHON, '-X', 'utf8', os.path.join(REAL, 'tools', 'read_pokedex.py'),
                                os.path.join(FIX, 'xxs-kanto.jpg'), '--no-check', '--out', out],
                               capture_output=True, text=True, timeout=300)
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
            s = json.load(open(out, encoding='utf-8'))
            self.assertEqual(s['registered'], [4, 5, 6, 7, 8, 9])
            r = subprocess.run([PYTHON, '-X', 'utf8', os.path.join(REAL, 'tools', 'read_pokedex.py'),
                                os.path.join(FIX, 'xxs-kanto.jpg'), '--no-check', '--out',
                                os.path.join(tmp, 'collection', 'go.json')], capture_output=True, text=True, timeout=300)
            self.assertNotEqual(r.returncode, 0, 'refuses to write anything called collection/go.json')
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
        self.assertEqual(fingerprint(), before)

    @unittest.skipUnless(os.environ.get('POKEDEX_SLOW'), 'slow: run with "slow"')
    @unittest.skipUnless(os.name == 'nt', "needs Windows' own OCR")
    def test_selftest_recording(self):
        right, n, s = self.rp.selftest()
        self.assertEqual(right, n, 'every cell it read is right')
        self.assertGreater(n, 100, 'reads most of the 151 cells')


if __name__ == '__main__':
    unittest.main()
