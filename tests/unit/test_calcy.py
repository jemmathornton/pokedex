"""The Calcy IV importer's reading of an export (made-up rows in Calcy's real layout): it proposes the right boxes,
skips Calcy's extra 'ancestor' rows, finds regional forms, and never proposes a box the Pokémon can't have."""
import csv, os, sys, tempfile, unittest
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from support import fingerprint, load

HEADER = ('Ancestor?,Scan date,Nr,Name,Temp Evo,Gender,Nickname,Level,possibleLevels,CP,HP,Dust cost,min IV%,ØIV%,max IV%,'
          'ØATT IV,ØDEF IV,ØHP IV,Unique?,Fast move,Fast move (ID),Special move,Special move (ID),Special move 2,'
          'Special move 2 (ID),DPS,LL Rank (min),LL Rank (max),GL Evo,GL Rank (min),GL Rank (max),Box,Custom1,Custom2,'
          'Saved,Egg,Lucky?,Favorite,BuddyBoosted,Form,ShadowForm,MultiForm?,Dynamax,Height (cm),Weight (g),Height Tag,'
          'Catch Date,Catch Level').split(',')


def row(nr, name, gender='♂', lucky='0', ivs=(10, 11, 12), unique='1', shadow='1', dynamax='?', ancestor='0'):
    r = dict.fromkeys(HEADER, '')
    r.update({'Ancestor?': ancestor, 'Nr': str(nr), 'Name': name, 'Gender': gender, 'Lucky?': lucky, 'Unique?': unique,
              'ØATT IV': f'{ivs[0]:.1f}', 'ØDEF IV': f'{ivs[1]:.1f}', 'ØHP IV': f'{ivs[2]:.1f}', 'ShadowForm': shadow, 'Dynamax': dynamax})
    return r


class Calcy(unittest.TestCase):
    def propose(self, rows):
        path = os.path.join(tempfile.mkdtemp(), 'export.csv')
        with open(path, 'w', encoding='utf-8', newline='') as fh:
            w = csv.DictWriter(fh, HEADER); w.writeheader(); w.writerows(rows)
        return load('import_calcy').propose(path)

    def test_boxes_from_a_row(self):
        before = fingerprint()
        p, notes, skipped, seen = self.propose([
            row(1, 'Bulbasaur', '♀', lucky='1', ivs=(15, 15, 15)),
            row(27, 'Sandshrew Alolan Shadow', '♂', shadow='2'),
            row(81, 'Magnemite', ''),
            row(25, 'Pikachu', '♂', dynamax='D'),
            row(150, 'Mewtwo', '-', ancestor='1'),
        ])
        self.assertEqual(p['d:1'], sorted(['c', 'cf', 'l', 'h']))
        self.assertEqual(p['d:27-alolan'], sorted(['c', 'cm', 'sd']))
        self.assertEqual(p['d:81'], ['c'], 'genderless: no male/female')
        self.assertIn('dx', p['d:25'])
        self.assertNotIn('d:150', p, 'an ancestor row is not a Pokémon')
        self.assertEqual(skipped, [])
        self.assertEqual(fingerprint(), before)

    def test_never_a_box_the_pokemon_cant_have(self):
        p, *_ = self.propose([row(151, 'Mew', '', lucky='1'), row(1, 'Bulbasaur', shadow='2', dynamax='G')])
        self.assertNotIn('l', p['d:151'], 'mythicals are never lucky')
        self.assertNotIn('gx', p['d:1'], 'Bulbasaur has no Gigantamax')

    def test_not_exact_ivs_are_not_4_star(self):
        p, *_ = self.propose([row(4, 'Charmander', ivs=(15, 15, 15), unique='0')])
        self.assertNotIn('h', p['d:4'])

    def test_a_scan_twice_counts_once(self):
        p, _, _, seen = self.propose([row(4, 'Charmander', '♂'), row(4, 'Charmander', '♀')])
        self.assertEqual(p['d:4'], sorted(['c', 'cm', 'cf']))
        self.assertEqual(len(seen), 2)

    def test_not_a_calcy_file(self):
        path = os.path.join(tempfile.mkdtemp(), 'other.csv')
        open(path, 'w', encoding='utf-8').write('a,b\n1,2\n')
        with self.assertRaises(SystemExit):
            load('import_calcy').propose(path)


if __name__ == '__main__':
    unittest.main()
