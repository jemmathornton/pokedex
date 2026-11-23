"""Bring in a game after HOME: everything that can be had in it, grouped by where it comes from (23 Nov: Pokémon Shield).

    python -X utf8 tools/import_games.py shield            (report only)
    python -X utf8 tools/import_games.py shield --apply    (writes data/shield/dex.json)
    python -X utf8 tools/import_games.py shield --reuse    (the newest copies in imports/ instead of fetching again)

Then tools/fetch_home_sprites.py (pictures of forms GO and HOME haven't got) and tools/build.py.

Her asks (23 Nov): the games in release order, Shield first; “Basically I want everything that can be got in Shield … Maybe
separate dex for base vs DLC.” So Shield's sections are its three Pokédexes (Galar, the base game; Isle of Armor and Crown Tundra,
the two DLCs), then what Shield can hold outside them: Dynamax Adventures (The Crown Tundra), the rest found in Shield, and what
only comes from HOME. Her other answers: Caught means “you have it in Shield now”; boxes Caught, Female, Male, Shiny, Gigantamax;
only the forms Shield itself has; Pokémon only in Sword shown with a mark (`only: "sword"`).

Each entry names HOME's entry for the same Pokémon or form (`"home": true`, so the same id, name, picture and text as HOME and
GO), or GO's where HOME can't keep that form (`"go": true`: fused Kyurem and Necrozma…), or is Shield's own (a form neither
has). Its `sec` says which sections it is in and its number there ({"galar": 1}). Shiny: as in HOME (anything shiny in HOME
can be brought into Shield). Gigantamax: Serebii's Gigantamax list (research/data/games/shield.json), as in HOME.

Sources: PokeAPI's Pokédex numbers (pokedexes 27–29), research/data/games/shield.json and shield-extras.json (Serebii, read
22–23 Nov), data/home/dex.json and data/go/dex.json.
"""
import csv, io, json, os, re, sys, urllib.request
from datetime import date

ROOT = os.environ.get('POKEDEX_ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data')
UA = {'User-Agent': "Jemma's Pokedex (private)"}
CSV = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/'

GAMES = {
    'shield': {
        'pokedexes': [('galar', 27), ('isle-of-armor', 28), ('crown-tundra', 29)],
        # sections: the three Pokédexes (base game, then the two DLCs), then what Shield can hold outside them
        'sections': [
            {'id': 'galar', 'name': 'Galar', 'small': 'Sword and Shield', 'map': '8', 'colour': '#6E2D82'},
            {'id': 'isle-of-armor', 'name': 'Isle of Armor', 'small': 'The Isle of Armor', 'map': 'isle-of-armor', 'colour': '#6E2D82'},
            {'id': 'crown-tundra', 'name': 'Crown Tundra', 'small': 'The Crown Tundra', 'map': 'crown-tundra', 'colour': '#6E2D82'},
            {'id': 'max-lair', 'name': 'Dynamax Adventures', 'small': 'The Crown Tundra', 'map': 'all', 'colour': '#6E2D82'},   # every region's map (her pick, 23 Nov)
            {'id': 'elsewhere', 'name': 'Bonus Pokémon', 'small': 'Not in a Pokédex', 'map': ['8', 'isle-of-armor', 'crown-tundra'], 'colour': '#6E2D82'},   # all three (her pick, 23 Nov)
            {'id': 'from-home', 'name': 'HOME Transfers', 'small': 'Pokémon HOME', 'map': 'all', 'colour': '#6E2D82'},   # every region's map (her pick, 23 Nov)
        ],
        'other': 'sword',   # the other version: its Pokémon are marked (her answer, 23 Nov)
        # one of each pair in a save (Serebii's legendaries page, 23 Nov: "You can only choose one"): Regieleki or Regidrago, Glastrier
        # or Spectrier, so Ice or Shadow Rider Calyrex; the other needs a trade. Marked "Choose one" on both (her answer, 23 Nov)
        'chooseOne': ['894', '895', '896', '897', '898-ice', '898-shadow'],
    },
}
SYN = {'alola': 'alolan', 'galar': 'galarian', 'hisui': 'hisuian', 'paldea': 'paldean'}
FILLER = {'form', 'forme', 'pattern', 'cloak', 'style', 'mode', 'size', 'flower', 'plumage', 'breed', 'mask', 'striped', 'sea', 'segment', 'trim', 'core', 'build', 'the', 'type'}
# Serebii names a species' own region's look ("Kantonian Form", "Unovan Form"): that is the plain Pokémon
NATIVE = {'kantonian', 'johtonian', 'hoennian', 'sinnohan', 'unovan', 'kalosian', 'normal'}
ALIASES = {'Genesect': {'electric': 'shock', 'fire': 'burn', 'ice': 'chill', 'water': 'douse'}}   # Serebii by the Drive's type, GO by its name
# caught in Shield after all (Serebii's Passimian page: in the Max Lair), though Serebii's exclusives list has it as Sword's
CATCHABLE_HERE = {766}


def slug(s):
    import unicodedata
    s = ''.join(c for c in unicodedata.normalize('NFKD', str(s)) if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', '-', s.lower().replace('!', 'exclamation').replace('?', 'question').replace('#', '')).strip('-')


def tokens(s):
    return {SYN.get(t, t) for t in slug(s).split('-') if t and t not in FILLER}


def flat(s):
    return ''.join(sorted(tokens(s)))


def load(*p, default=None):
    path = os.path.join(*p)
    return json.load(open(path, encoding='utf-8-sig')) if os.path.exists(path) else default


def fetch(folder, reuse):
    os.makedirs(folder, exist_ok=True)
    for name in ('pokemon_dex_numbers', 'pokemon_form_types'):   # dex numbers; a form's own types (Silvally's memories)
        path = os.path.join(folder, name + '.csv')
        if not (reuse and os.path.exists(path)):
            with urllib.request.urlopen(urllib.request.Request(CSV + name + '.csv', headers=UA), timeout=120) as r:
                open(path, 'wb').write(r.read())


def rows(folder, name):
    return list(csv.DictReader(io.open(os.path.join(folder, name), encoding='utf-8')))


def core(s, sp=''):
    """A form name's own words: no filler, no species name, no native region ("Black Kyurem" -> black, "Kantonian Form" -> nothing)."""
    al = ALIASES.get(sp, {})
    return {al.get(t, t) for t in tokens(s or '')} - NATIVE - tokens(sp)


def same(a, b, sp='', exact=False):
    """Is form name a (Serebii's) the same form as b (our entry's)? Galarian / Galarian Form, Rapid Strike Style / Rapid Strike, the
    plain one either way (Kantonian Form / no form)."""
    ta, tb = core(a, sp), core(b, sp)
    if not ta or not tb:
        return not ta and not tb
    if ta == tb:
        return True
    return not exact and (ta <= tb or tb <= ta)   # whole words only: Male isn't Female


def main():
    game = next((a for a in sys.argv[1:] if not a.startswith('--')), None)
    if game not in GAMES:
        sys.exit(f'Which game? One of: {", ".join(GAMES)}')
    cfg, apply, reuse = GAMES[game], '--apply' in sys.argv, '--reuse' in sys.argv
    imports = os.path.join(ROOT, 'imports')
    folder = os.path.join(imports, f'games-{date.today().isoformat()}')
    if reuse and os.path.isdir(imports) and any(d.startswith('games-') for d in os.listdir(imports)):
        folder = os.path.join(imports, max(d for d in os.listdir(imports) if d.startswith('games-')))
    fetch(folder, reuse)
    research = load(ROOT, 'research', 'data', 'games', f'{game}.json')
    extras = load(ROOT, 'research', 'data', 'games', f'{game}-extras.json', default={}) or {}
    home = load(DATA, 'home', 'dex.json')['entries']
    go = {e['id']: e for e in load(DATA, 'go', 'dex.json')['entries']}
    full_home = [{**go.get(e['id'] if e.get('go') is True else e.get('go'), {}), **e} if e.get('go') else e for e in home]
    home_by_dex, go_by_dex = {}, {}
    for e in full_home:
        home_by_dex.setdefault(e['dex'], []).append(e)
    for e in go.values():
        go_by_dex.setdefault(e['dex'], []).append(e)
    report = []
    # PokeAPI's tables as tools/import_home.py read them, for forms neither GO nor HOME has (Calyrex's riders, Silvally's memories)
    hfolder = os.path.join(imports, max(d for d in os.listdir(imports) if d.startswith('home-')))
    poke = {r['id']: r for r in rows(hfolder, 'pokemon.csv')}
    pforms = [f for f in rows(hfolder, 'pokemon_forms.csv') if f['is_battle_only'] != '1' and f['is_mega'] != '1']
    tname = {r['id']: r['identifier'].capitalize() for r in rows(hfolder, 'types.csv')}
    ptypes, ftypes = {}, {}
    for r in rows(hfolder, 'pokemon_types.csv'):
        ptypes.setdefault(r['pokemon_id'], []).append((int(r['slot']), tname[r['type_id']]))
    for r in rows(folder, 'pokemon_form_types.csv'):
        ftypes.setdefault(r['pokemon_form_id'], []).append((int(r['slot']), tname[r['type_id']]))
    pics = set(load(hfolder, 'home-pictures.json'))

    def own(n, f, base):
        """Shield's own entry for a form neither list has, from PokeAPI's form and HOME's picture of it."""
        want = core(f, base['name'])
        hit = next((x for x in pforms if int(poke[x['pokemon_id']]['species_id']) == n and x['form_identifier'] and
                    (set(x['form_identifier'].split('-')) & want)), None)
        if not hit:
            return None
        fi, pid, p = hit['form_identifier'], hit['pokemon_id'], poke[hit['pokemon_id']]
        pic = next((f'hm.{st}' for st in (f'{n}-{fi}', pid if int(pid) > 10000 else None) if st and f'{st}.png' in pics), None)
        types = [t for _, t in sorted(ftypes.get(hit['id']) or ptypes.get(pid, []))]
        e = {'id': f'{n}-{slug(fi)}', 'dex': n, 'gen': base.get('gen'), 'name': base['name'], 'form': f, 'types': types or base.get('types', []),
             'img': pic, 'gender': base.get('gender'), 'class': base.get('class'), 'category': base.get('category'),
             'height': int(p['height']) / 10, 'weight': int(p['weight']) / 10, 'family': base.get('family'), 'evo': [], 'order': int(hit['order'])}
        return {k: v for k, v in e.items() if v not in (None, '')}

    # the Pokédexes: PokeAPI's numbers (checked entry for entry against Serebii in the research); which form an entry means
    # where Serebii's picture shows a regional one (Galarian Meowth in Galar)
    nums = {}
    ids = dict(cfg['pokedexes'])
    for r in csv.DictReader(io.open(os.path.join(folder, 'pokemon_dex_numbers.csv'), encoding='utf-8')):
        for sec, pid in cfg['pokedexes']:
            if r['pokedex_id'] == str(pid):
                nums.setdefault(sec, {})[int(r['species_id'])] = int(r['pokedex_number'])
    dex_form = {}
    for d in research['dexes']:
        for x in d['entries']:
            if x.get('form'):
                dex_form[(d['id'], x['national'])] = x['form']
    outside = extras.get('outsideDexes', {})
    not_gmax = lambda xs: [x for x in xs if (x.get('form') or '') != 'Gigantamax']   # a Gigantamax is a box, not a Pokémon to list
    groups = {'max-lair': not_gmax(outside.get('dynamaxAdventures', []) + outside.get('dynamaxAdventuresAlsoGives', [])),
              'elsewhere': not_gmax(outside.get('otherInGame', [])), 'from-home': not_gmax(outside.get('homeOnly', []))}
    species = set(n for d in nums.values() for n in d) | {x['national'] for xs in groups.values() for x in xs}
    shield_forms = {int(k): v for k, v in (extras.get('forms') or {}).items()}
    other = {(x['national'], x.get('form')) if isinstance(x, dict) else (x, None) for x in research.get(f'{cfg["other"]}Only', [])}

    out = []
    for n in sorted(species):
        homes, gos = home_by_dex.get(n, []), go_by_dex.get(n, [])
        if not homes and not gos:
            report.append(f'#{n}: in neither HOME’s nor GO’s list'); continue
        allowed = shield_forms.get(n)   # Serebii's forms in Sword and Shield (more than one); none listed: the species' first form only
        chosen, base = [], (homes or gos)[0]
        sp = base['name']
        if allowed:
            for i, f in enumerate(allowed):
                taken = {x['id'] for x in chosen}
                pick = lambda exact: next((e for e in homes if e['id'] not in taken and same(f, e.get('form'), sp, exact)), None) or \
                    next((e for e in gos if e['id'] not in taken and same(f, e.get('form'), sp, exact)), None)
                hit = pick(True) or pick(False)
                if not hit and i == 0:   # the first form Serebii lists is the plain one ("Hero of Many Battles")
                    hit = next((e for e in homes + gos if e['id'] not in taken and (not e.get('form') or e.get('default'))), None)
                if not hit:
                    hit = own(n, f, base)
                    if hit:
                        hit['_own'] = True
                if hit:
                    chosen.append(hit)
                else:
                    report.append(f'#{n} {f}: a Shield form found nowhere (left out)')
        else:
            chosen = [base]
        for e in homes + gos:   # male and female fully different: both, as everywhere (her pick, 18 Nov)
            if e.get('genderForm') and e['id'] not in {x['id'] for x in chosen} and any(x['dex'] == e['dex'] for x in chosen):
                chosen.append(e)
        for e in chosen:
            in_home = any(e is h for h in homes)
            if e.get('_own'):
                entry = {k: v for k, v in e.items() if k != '_own'}
            else:
                entry = {'id': e['id'], 'home' if in_home else 'go': True}
            base_home = e if in_home else (homes[0] if homes else {})
            entry['shiny'] = bool(base_home.get('shiny')) if base_home else bool(e.get('shiny'))
            entry['gmax'] = bool(base_home.get('gmax')) if in_home else False
            # only in the other version: the whole species (Ho-Oh), or one form (Red-Striped Basculin, male Indeedee, Galarian Farfetch'd)
            if n not in CATCHABLE_HERE and ((n, None) in other or any(k[0] == n and k[1] and same(k[1], e.get('form'), sp) for k in other)):
                entry['only'] = cfg['other']
            if entry['id'] in cfg.get('chooseOne', ()):
                entry['choose'] = True
            sec = {}
            regional = (e.get('form') or '').split(' ')[0] in ('Alolan', 'Galarian', 'Hisuian', 'Paldean')
            for s, d in nums.items():
                if n in d:
                    want = dex_form.get((s, n))
                    if (want and same(want, e.get('form'), sp)) or (not want and not regional):
                        sec[s] = d[n]
            for s, xs in groups.items():
                # a whole species in a group (Genesect from HOME, Giratina from the Max Lair) brings its forms (drives, Origin); a form
                # named (Kantonian Articuno) only that one
                if any(x['national'] == n and (same(x.get('form'), e.get('form'), sp) or (not x.get('form') and not regional)) for x in xs) and not sec:
                    sec[s] = None
            if not sec:
                sec['elsewhere'] = None   # a form Shield has outside its Pokédexes (Kantonian Meowth beside the Galarian one)
            entry['sec'] = sec
            out.append(entry)

    ids_ = [e['id'] for e in out]
    report += [f'id twice: {i}' for i in sorted({i for i in ids_ if ids_.count(i) > 1})]
    by_sec = {s['id']: sum(1 for e in out if s['id'] in e['sec']) for s in cfg['sections']}
    print(f'{game}: {len(out)} entries, {len(species)} species; ' + ', '.join(f'{k} {v}' for k, v in by_sec.items()) +
          f'; {sum(1 for e in out if e.get("only"))} {cfg["other"]} only; {sum(1 for e in out if not e["shiny"])} can’t be shiny; {sum(1 for e in out if e["gmax"])} Gigantamax')
    if not extras:
        print('  note: no research/data/games/%s-extras.json yet: only the three Pokédexes, forms the first one each' % game)
    for r in report:
        print(' ', r)
    if apply:
        os.makedirs(os.path.join(DATA, game), exist_ok=True)
        tmp = os.path.join(DATA, game, 'dex.json.tmp')
        with open(tmp, 'w', encoding='utf-8', newline='\n') as fh:
            json.dump({'updated': date.today().isoformat(), 'sections': cfg['sections'], 'entries': out}, fh, ensure_ascii=False, indent=1)
            fh.write('\n')
        os.replace(tmp, os.path.join(DATA, game, 'dex.json'))
        print(f'Written data/{game}/dex.json')


if __name__ == '__main__':
    main()
