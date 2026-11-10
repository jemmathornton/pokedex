"""Read a Calcy IV scan-history export (CSV) and PROPOSE ticks from it (10 Nov 2026). It never changes her ticks: it
writes a proposal (research/calcy-proposed.json) and prints what's new compared with what she has ticked, for her to
look over first. Format: research/data/calcy-iv-export-format.json (from a real Calcy export).

    python -X utf8 tools/import_calcy.py <export.csv>            the proposal and a summary
    python -X utf8 tools/import_calcy.py <export.csv> --list     also every Pokémon it read, one per line

What a Calcy export can give, per row (one row per scan; a Pokémon scanned twice counts once):
  caught (any row), male / female (Gender), lucky (Lucky? = 1), 4★ (exact IVs 15/15/15), shadow (ShadowForm 2),
  purified (ShadowForm 3, not yet seen in a real export), Dynamax (Dynamax "D"), Gigantamax (assumed "G": check).
What it can't give: shiny, costumes, backgrounds, Megas, and forms other than regional ones (Calcy's own form numbers
aren't the game's; Unown letters, Vivillon patterns and so on are left for her).
"""
import csv, json, os, re, sys
from collections import Counter

ROOT = os.environ.get('POKEDEX_ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGIONAL = {'alolan': 'alolan', 'alola': 'alolan', 'galarian': 'galarian', 'galar': 'galarian', 'hisuian': 'hisuian',
            'hisui': 'hisuian', 'paldean': 'paldean', 'paldea': 'paldean'}


def load_dex():
    dex = json.load(open(os.path.join(ROOT, 'data', 'go', 'dex.json'), encoding='utf-8'))['entries']
    by_num = {}
    for e in dex:
        by_num.setdefault(e['dex'], []).append(e)
    return dex, by_num


def entry_for(row, by_num):
    """The dex entry a row is: its number, and a regional form if the name says so ('Sandshrew Alolan Shadow')."""
    try:
        n = int(row['Nr'])
    except (ValueError, KeyError):
        return None, 'no Pokédex number'
    es = by_num.get(n)
    if not es:
        return None, f'no entry for #{n}'
    words = [w.lower() for w in (row.get('Name') or '').split()[1:]]
    region = next((REGIONAL[w] for w in words if w in REGIONAL), None)
    if region:
        hit = [e for e in es if e['id'].startswith(f'{n}-{region}')]
        if hit:
            return hit[0], None
        return None, f'#{n} {region}: no such entry'
    plain = [e for e in es if not e.get('form')] or [e for e in es if e.get('default')] or es
    note = 'has other forms: check which' if len([e for e in es if e['released']]) > 1 and not any(not e.get('form') for e in es) else None
    return plain[0], note


def ticks_for(row, e):
    t = {'c'}
    g = (row.get('Gender') or '').strip()
    if g == '♂' and e['gender'] in ('both', 'male'):
        t.add('cm')
    if g == '♀' and e['gender'] in ('both', 'female'):
        t.add('cf')
    if (row.get('Lucky?') or '').strip() == '1' and e['released'] and e.get('class') != 'mythical':
        t.add('l')
    try:
        ivs = [float(row[k]) for k in ('ØATT IV', 'ØDEF IV', 'ØHP IV')]
        if (row.get('Unique?') or '').strip() == '1' and ivs == [15.0, 15.0, 15.0]:
            t.add('h')
    except (ValueError, KeyError):
        pass
    sf = (row.get('ShadowForm') or '').strip()
    if sf == '2' and e.get('shadow'):
        t.add('sd')
    if sf == '3' and e.get('shadow'):
        t.add('pu')
    dm = (row.get('Dynamax') or '').strip().upper()
    if dm == 'D' and e.get('dynamax'):
        t.add('dx')
    if dm == 'G' and e.get('gmax'):
        t.add('gx')
    return t


def propose(path):
    dex, by_num = load_dex()
    rows = list(csv.DictReader(open(path, encoding='utf-8-sig')))
    need = {'Nr', 'Name', 'Gender', 'Lucky?', 'ShadowForm'}
    missing = need - set(rows[0] if rows else [])
    if missing:
        raise SystemExit(f'Not a Calcy IV export I know: no column(s) {", ".join(sorted(missing))}')
    proposal, notes, skipped, seen = {}, Counter(), [], []
    for row in rows:
        if (row.get('Ancestor?') or '').strip() == '1':
            continue
        e, note = entry_for(row, by_num)
        if not e:
            skipped.append(f"{row.get('Nr')} {row.get('Name')}: {note}"); continue
        if note:
            notes[f"{e['name']}: {note}"] += 1
        key = 'd:' + e['id']
        proposal.setdefault(key, set()).update(ticks_for(row, e))
        seen.append((e['id'], row.get('Name'), sorted(ticks_for(row, e))))
    return {k: sorted(v) for k, v in sorted(proposal.items(), key=lambda kv: int(kv[0][2:].split('-')[0]))}, notes, skipped, seen


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        print(__doc__); return
    proposal, notes, skipped, seen = propose(args[0])
    col = json.load(open(os.path.join(ROOT, 'data', 'collection', 'go.json'), encoding='utf-8'))
    new = {k: [t for t in v if t not in col['have'].get(k, [])] for k, v in proposal.items()}
    new = {k: v for k, v in new.items() if v}
    out = os.path.join(ROOT, 'research', 'calcy-proposed.json')
    json.dump({'source': os.path.basename(args[0]), 'proposed': proposal, 'newComparedWithHerTicks': new,
               'notes': dict(notes), 'skipped': skipped}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    names = {'c': 'caught', 'cm': 'male', 'cf': 'female', 'l': 'lucky', 'h': '4★', 'sd': 'shadow', 'pu': 'purified', 'dx': 'Dynamax', 'gx': 'G-Max'}
    count = Counter(t for v in new.values() for t in v)
    print(f'{len(seen)} Pokémon read ({len(proposal)} different entries); {len(skipped)} skipped')
    print('New boxes this would tick: ' + ', '.join(f'{names[t]} {n}' for t, n in count.most_common()) if count else 'Nothing new.')
    for n, k in notes.most_common(10):
        print(f'  check: {n} ({k})')
    for s in skipped[:10]:
        print(f'  skipped: {s}')
    if '--list' in sys.argv:
        for i, name, t in seen:
            print(f'  {i:<18} {name:<28} {" ".join(names[x] for x in t)}')
    print(f'Proposal written to {out} (her ticks are unchanged).')


if __name__ == '__main__':
    main()
