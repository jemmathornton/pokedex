"""The GO import, re-run on a throwaway copy from the saved downloads in imports/ (slow, so only with "slow"): it
must come out the same as the data in the project, so a change to tools/import_go.py can't quietly lose or change
anything. (After a real new import, the saved copies change too, so this still compares like with like.)"""
import json, os, subprocess, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from support import PYTHON, REAL, Sandbox, fingerprint, real

HAS_IMPORTS = os.path.isdir(os.path.join(REAL, 'imports')) and any(d.startswith('go-') for d in os.listdir(os.path.join(REAL, 'imports')))


@unittest.skipUnless(os.environ.get('POKEDEX_SLOW'), 'slow: run with "slow"')
@unittest.skipUnless(HAS_IMPORTS, 'needs the saved downloads in imports/')
class Import(unittest.TestCase):
    def test_reimport_gives_the_same_data(self):
        before = fingerprint()
        with Sandbox(imports=True) as box:
            r = subprocess.run([PYTHON, '-X', 'utf8', os.path.join(REAL, 'tools', 'import_go.py'), '--reuse', '--apply'],
                               capture_output=True, text=True, env={**os.environ, 'POKEDEX_ROOT': box.root}, timeout=900)
            self.assertEqual(r.returncode, 0, r.stdout[-2000:] + r.stderr[-2000:])
            for name, key in (('dex.json', 'entries'), ('costumes.json', 'costumes')):
                with self.subTest(name):
                    new, old = box.read('go', name)[key], real('go', name)[key]
                    self.assertEqual(len(new), len(old))
                    diff = [a['id'] for a, b in zip(new, old) if a != b]
                    self.assertEqual(diff[:20], [], f'{len(diff)} {key} differ')
        self.assertEqual(fingerprint(), before)


if __name__ == '__main__':
    unittest.main()
