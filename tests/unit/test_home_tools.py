"""Pokémon HOME's tools (22 Nov): tools/import_home.py, re-run on a throwaway copy from the saved downloads in imports/home-*,
must come out the same as data/home/ (so a change to it can't quietly lose or change a Pokémon), and tools/fetch_home_sprites.py
fetches the right files: HOME's own pictures only, never a shiny of one that can't be shiny."""
import json, os, subprocess, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from support import PYTHON, REAL, Sandbox, fingerprint, load, real

IMPORTS = os.path.join(REAL, 'imports')
HAS_IMPORTS = os.path.isdir(IMPORTS) and any(d.startswith('home-') for d in os.listdir(IMPORTS))


class FetchHomeSprites(unittest.TestCase):
    def test_a_key_says_which_file(self):
        f = load('fetch_home_sprites')
        self.assertEqual(f.source('hm.869-vanilla-cream-berry-sweet'), '869-vanilla-cream-berry-sweet.png')
        self.assertEqual(f.source('hm.1025.s'), 'shiny/1025.png')
        self.assertEqual(f.source('hm.10248.g2'), 'female/10248.png')
        self.assertEqual(f.source('hm.3.g2.s'), 'shiny/female/3.png')

    def test_it_wants_homes_pictures_only_and_no_shiny_that_cannot_be(self):
        keys = set(load('fetch_home_sprites').wanted())
        self.assertTrue(keys and all(k.startswith('hm.') for k in keys))
        self.assertIn('hm.10094', keys)   # Pikachu, Original Cap
        self.assertNotIn('hm.10094.s', keys, 'the cap Pikachu can’t be shiny: no shiny picture to fetch')
        self.assertIn('hm.1025.s', keys, 'a GO picture missing (Pecharunt): HOME’s, shiny too')

    def test_every_picture_it_wants_is_in_the_project(self):
        sprites = os.path.join(REAL, 'site', 'sprites')
        missing = [k for k in load('fetch_home_sprites').wanted() if not (os.path.exists(os.path.join(sprites, k + '.webp')) and os.path.exists(os.path.join(sprites, 'big', k + '.webp')))]
        self.assertEqual(missing, [], 'run tools/fetch_home_sprites.py')


@unittest.skipUnless(HAS_IMPORTS, 'needs the saved downloads in imports/home-*')
class ImportHome(unittest.TestCase):
    def test_reimport_gives_the_same_data(self):
        before = fingerprint()
        with Sandbox(imports=True) as box:
            r = subprocess.run([PYTHON, '-X', 'utf8', os.path.join(REAL, 'tools', 'import_home.py'), '--reuse', '--apply'],
                               capture_output=True, text=True, env={**os.environ, 'POKEDEX_ROOT': box.root}, timeout=300)
            self.assertEqual(r.returncode, 0, r.stdout[-2000:] + r.stderr[-2000:])
            new, old = box.read('home', 'dex.json')['entries'], real('home', 'dex.json')['entries']
            self.assertEqual(len(new), len(old))
            self.assertEqual([a['id'] for a, b in zip(new, old) if a != b][:20], [])
            self.assertEqual(box.read('home', 'pictures.json'), real('home', 'pictures.json'))
            self.assertIn('1,298 entries', r.stdout.replace('1298', '1,298'))
        self.assertEqual(fingerprint(), before)


@unittest.skipUnless(os.path.isdir(IMPORTS) and any(d.startswith('games-') for d in os.listdir(IMPORTS)), 'needs the saved downloads in imports/games-*')
class ImportGames(unittest.TestCase):
    def test_shield_reimport_gives_the_same_data(self):   # Pokémon Shield (23 Nov)
        before = fingerprint()
        with Sandbox(imports=True) as box:
            r = subprocess.run([PYTHON, '-X', 'utf8', os.path.join(REAL, 'tools', 'import_games.py'), 'shield', '--reuse', '--apply'],
                               capture_output=True, text=True, env={**os.environ, 'POKEDEX_ROOT': box.root}, timeout=300)
            self.assertEqual(r.returncode, 0, r.stdout[-2000:] + r.stderr[-2000:])
            self.assertEqual(box.read('shield', 'dex.json')['entries'], real('shield', 'dex.json')['entries'])
        self.assertEqual(fingerprint(), before)

    def test_arceus_violet_and_za_reimport_give_the_same_data(self):   # Legends: Arceus, Violet, Legends: Z-A (23 Nov)
        before = fingerprint()
        with Sandbox(imports=True) as box:
            for game in ('arceus', 'violet', 'za'):
                r = subprocess.run([PYTHON, '-X', 'utf8', os.path.join(REAL, 'tools', 'import_games.py'), game, '--reuse', '--apply'],
                                   capture_output=True, text=True, env={**os.environ, 'POKEDEX_ROOT': box.root}, timeout=300)
                self.assertEqual(r.returncode, 0, r.stdout[-2000:] + r.stderr[-2000:])
                self.assertEqual(box.read(game, 'dex.json')['entries'], real(game, 'dex.json')['entries'], game)
        self.assertEqual(fingerprint(), before)


if __name__ == '__main__':
    unittest.main()
