"""Bring in Pokémon HOME's Pokédex: every Pokémon and form HOME keeps, which can be shiny there and which can be kept as Gigantamax.

    python -X utf8 tools/import_home.py            (report only: what it found, and where Serebii's list disagrees)
    python -X utf8 tools/import_home.py --apply    (writes data/home/dex.json and data/home/pictures.json)
    python -X utf8 tools/import_home.py --reuse    (the newest copies in imports/ instead of fetching again)

Then tools/fetch_home_sprites.py (HOME's pictures for what GO's files haven't got) and tools/build.py.

Her ask (22 Nov): “Home needs to be fully built … Used shared stuff between games, no need to redo stuff all over again. Home
is shiny, male/female (like go), maybe dyna and gigan if they are in home. Do whatever home has.” So HOME is GO's own entries
wherever HOME keeps the same Pokémon or form (the same id, name, picture, types, Pokédex text and evolutions: an entry with
"go": true), with HOME's own facts (shiny, gmax), and HOME's own entries only for the forms GO hasn't got (Pikachu in a cap,
Alcremie's flavours…). Her GO ticks and GO's data are never changed.

Where everything comes from (copies of what was read are kept in imports/home-<date>/):
- PokeAPI's tables (github.com/PokeAPI/pokeapi, data/v2/csv: the main games' own data): every species and form, which forms
  are battle-only or Mega, each form's English name as the games write it, and its types.
- PokeAPI's copy of HOME's own pictures (github.com/PokeAPI/sprites, sprites/pokemon/other/home): which pictures there are.
- Serebii's Pokémon HOME pages, read 22 Nov (research/home-tracking.md, research/data/home-facts.json): which Pokémon and
  forms can be kept in HOME, which can't be shiny there, and which can be kept with the Gigantamax Factor. The report prints
  every form where PokeAPI and Serebii's list disagree.
- data/home/fixes.json (by hand, optional): {"<entry id>": {"shiny": false, …}} for anything the sources haven't caught up with.

Forms are as in GO (her picks): regional forms are Pokémon of their own, her form-by-form list is one card whose boxes count
each form, and forms that look no different (Scatterbug's patterns, Rockruff's Own Tempo) are one entry.
"""
import csv, io, json, os, re, sys, urllib.request
from datetime import date

ROOT = os.environ.get('POKEDEX_ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data')
UA = {'User-Agent': "Jemma's Pokedex (private)"}
CSV = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/'
SOURCES = {f'{n}.csv': CSV + f'{n}.csv' for n in ('pokemon', 'pokemon_forms', 'pokemon_form_names', 'pokemon_types', 'types')}

# forms PokeAPI lists that HOME doesn't keep (Serebii's Standard Boxes, research/home-tracking.md): the cosplay and partner
# Pikachu, Spiky-eared Pichu, Minior's Meteor Form (HOME keeps its seven cores), and Koraidon's and Miraidon's ride shapes.
# (species, PokeAPI form name.) Also forms that look just like the plain one, kept as one entry by her rule for GO (16 Nov:
# Rockruff, Scatterbug and Spewpa, “no real difference”): Battle Bond Greninja, Power Construct Zygarde, Artisan Poltchageist,
# Masterpiece Sinistcha (Serebii lists them apart; research/home-tracking.md: same pictures). Besides these, where Serebii's list has one form for a species and PokeAPI more (Origin Giratina,
# Arceus's types, fused Kyurem, Ogerpon's masks: items decide them, or they can't be put in HOME), only the first is kept.
LOOK_ALIKES = {(658, 'battle-bond'), (718, '10-power-construct'), (718, '50-power-construct'), (1012, 'artisan'), (1013, 'masterpiece')}
NOT_IN_HOME = {(774, c + '-meteor') for c in ('red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet')} | {(25, f) for f in ('rock-star', 'belle', 'pop-star', 'phd', 'libre', 'cosplay', 'starter')} |     {(133, 'starter'), (172, 'spiky-eared')} | LOOK_ALIKES | {(1007, f) for f in ('limited-build', 'sprinting-build', 'swimming-build', 'gliding-build')} | {(1008, f) for f in ('low-power-mode', 'drive-mode', 'aquatic-mode', 'glide-mode')}
# forms with no real difference: one entry, as in GO (import_go.py NO_FORMS; her picks, 16 Nov), plus Mothim, whose cloaks
# don't show
ONE_ENTRY = {664, 665, 744, 414}
# male and female fully different: two entries each, as in GO (import_go.py GENDER_FORMS; her pick, 18 Nov)
GENDER_FORMS = (449, 450, 521, 592, 593, 668, 678, 876, 902, 916)
# a PokeAPI form whose GO entry the names don't find: GO's Gimmighoul is its Roaming Form (the coin one)
FORM_MAP = {(999, 'roaming'): '999'}
# a GO form name that isn't HOME's: GO's Spinda #1 (GO numbers its spot patterns; HOME's Spinda is one Pokémon)
FORM_NAMES = {(327, '327-1'): None, (999, '999'): 'Roaming Form'}
# Gigantamax for every form, not only the first: any Alcremie flavour can have the Gigantamax Factor
GMAX_ALL_FORMS = {869}
SYN = {'alola': 'alolan', 'galar': 'galarian', 'hisui': 'hisuian', 'paldea': 'paldean'}


def slug(s):
    import unicodedata
    s = ''.join(c for c in unicodedata.normalize('NFKD', str(s)) if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', '-', s.lower().replace('!', 'exclamation').replace('?', 'question').replace('#', '')).strip('-')


def tokens(s):
    return {SYN.get(t, t) for t in slug(s).split('-') if t and t not in ('form', 'forme', 'pattern', 'cloak', 'style', 'mode', 'size', 'flower', 'plumage', 'breed', 'mask', 'striped', 'sea', 'segment', 'trim', 'core', 'build')}


def fetch(folder, reuse):
    os.makedirs(folder, exist_ok=True)
    for name, url in SOURCES.items():
        path = os.path.join(folder, name)
        if reuse and os.path.exists(path):
            continue
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
            open(path, 'wb').write(r.read())
    path = os.path.join(folder, 'home-pictures.json')
    if not (reuse and os.path.exists(path)):   # the names of HOME's picture files: the tree, folder by folder
        def tree(sha):
            with urllib.request.urlopen(urllib.request.Request(f'https://api.github.com/repos/PokeAPI/sprites/git/trees/{sha}', headers=UA), timeout=120) as r:
                return json.load(r)['tree']
        sha = 'master'
        for part in ('sprites', 'pokemon', 'other', 'home'):
            sha = next(x['sha'] for x in tree(sha) if x['path'] == part)
        with urllib.request.urlopen(urllib.request.Request(f'https://api.github.com/repos/PokeAPI/sprites/git/trees/{sha}?recursive=1', headers=UA), timeout=120) as r:
            files = sorted(x['path'] for x in json.load(r)['tree'] if x['type'] == 'blob' and x['path'].endswith('.png'))
        json.dump(files, open(path, 'w', encoding='utf-8'), indent=0)
    return folder


def rows(folder, name):
    return list(csv.DictReader(io.open(os.path.join(folder, name), encoding='utf-8')))


def load(*p, default=None):
    path = os.path.join(*p)
    return json.load(open(path, encoding='utf-8-sig')) if os.path.exists(path) else default


def main():
    apply, reuse = '--apply' in sys.argv, '--reuse' in sys.argv
    imports = os.path.join(ROOT, 'imports')
    folder = os.path.join(imports, f'home-{date.today().isoformat()}')
    if reuse and os.path.isdir(imports) and any(d.startswith('home-') for d in os.listdir(imports)):
        folder = os.path.join(imports, max(d for d in os.listdir(imports) if d.startswith('home-')))
    fetch(folder, reuse)
    go = load(DATA, 'go', 'dex.json')['entries']
    facts = load(ROOT, 'research', 'data', 'home-facts.json', default={}) or {}
    fixes = {k: v for k, v in (load(DATA, 'home', 'fixes.json', default={}) or {}).items() if not k.startswith('_')}
    pics = set(load(folder, 'home-pictures.json'))
    sprites = os.path.join(ROOT, 'site', 'sprites')
    have = {f[:-5] for f in os.listdir(sprites) if f.endswith('.webp')} if os.path.isdir(sprites) else set()   # GO's pictures

    poke = {r['id']: r for r in rows(folder, 'pokemon.csv')}
    names = {r['pokemon_form_id']: r for r in rows(folder, 'pokemon_form_names.csv') if r['local_language_id'] == '9'}
    tname = {r['id']: r['identifier'].capitalize() for r in rows(folder, 'types.csv')}
    ptypes = {}
    for r in rows(folder, 'pokemon_types.csv'):
        ptypes.setdefault(r['pokemon_id'], []).append((int(r['slot']), tname[r['type_id']]))
    types_of = lambda pid: [t for _, t in sorted(ptypes.get(pid, []))]

    # PokeAPI's forms per species, in its order: not battle-only, not Mega, not Gigantamax or Totem (those are boxes, or not HOME's)
    forms = {}
    for f in rows(folder, 'pokemon_forms.csv'):
        p = poke[f['pokemon_id']]
        sp, fi = int(p['species_id']), f['form_identifier']
        if sp > 1025 or f['is_battle_only'] == '1' or f['is_mega'] == '1' or 'gmax' in fi or 'totem' in fi:
            continue
        default = p['is_default'] == '1' and f['is_default'] == '1'
        forms.setdefault(sp, []).append({'dex': sp, 'fid': f['id'], 'pid': f['pokemon_id'], 'ident': p['identifier'], 'fi': fi, 'default': default, 'order': int(f['order'])})
    for sp in forms:
        forms[sp].sort(key=lambda x: (not x['default'], x['order']))

    go_by = {}
    for e in go:
        go_by.setdefault(e['dex'], []).append(e)
    not_in = set(NOT_IN_HOME) | {tuple(x) for x in facts.get('notInHome', [])}
    no_shiny = facts.get('noShiny', [])
    gmax = facts.get('gmax', [])

    def picture(f, dex):
        """HOME's picture of this form: the form's own file, its Pokémon's (10001…), or the species'."""
        for stem in (f'{dex}-{f["fi"]}' if f['fi'] else None, f['pid'] if int(f['pid']) > 10000 else None, str(dex) if f['default'] or int(f['pid']) <= 10000 else None):
            if stem and f'{stem}.png' in pics:
                return f'hm.{stem}'
        return None

    def match(f, goes, used):
        """The GO entry for this form: the one whose form name matches (Meadow, Average, Amped…); for the default form with
        none matching, GO's plain one (Pikachu, Spinda #1)."""
        reserved = {v for (d, fi), v in FORM_MAP.items() if d == f['dex'] and fi != f['fi']}   # kept for the form FORM_MAP names
        free = [e for e in goes if e['id'] not in used and e['id'] not in reserved]
        if (f['dex'], f['fi']) in FORM_MAP:
            return next((e for e in free if e['id'] == FORM_MAP[(f['dex'], f['fi'])]), None)
        want = tokens(f['fi'])
        if want:
            flat = lambda x: slug(x).replace('-', '')   # Pom-Pom and Pompom
            best = [e for e in free if e.get('form') and (tokens(e['form']) == want or flat(e['form']) == flat(f['fi']))]
            best = best or [e for e in free if e.get('form') and (tokens(e['form']) < want or want < tokens(e['form']))]
            if best:
                return best[0]
        if f['default']:
            return next((e for e in free if not e.get('form')), None) or next((e for e in free if e.get('default')), None) or (free[0] if free and not want else None)
        return None

    out, alt, report = [], {}, []
    for dex in range(1, 1026):
        goes = go_by.get(dex, [])
        base = next((e for e in goes if not e.get('form')), None) or next((e for e in goes if e.get('default')), None) or (goes[0] if goes else None)
        fs = [f for f in forms.get(dex, []) if (dex, f['fi']) not in not_in]
        serebii = [x for x in (facts.get('forms') or {}).get(str(dex), [None]) if x != 'Female']
        if dex in ONE_ENTRY or (facts.get('forms') is not None and len(serebii) <= 1 and dex not in GENDER_FORMS):
            fs = fs[:1]   # one form in HOME (Serebii), or no real difference (as in GO)
        used = set()
        for f in fs:
            g = match(f, goes, used)
            pic = picture(f, dex)
            fname = (names.get(f['fid']) or {}).get('form_name') or None
            if g:
                used.add(g['id'])
                e = {'id': g['id'], 'go': True}
                if not g.get('form') and f['fi'] and fname and len(fs) > 1:   # GO's plain Alcremie is HOME's Vanilla Cream Strawberry Sweet
                    e['form'] = fname
                if g['img'] and pic and g['img'] not in have:   # GO's picture where there is one; HOME's only where GO's files have none
                    alt.setdefault(g['img'], pic); alt.setdefault(g['img'] + '.s', pic + '.s')
                    if g.get('femaleImg') and g['femaleImg'] not in have and f'female/{pic[3:]}.png' in pics:
                        alt.setdefault(g['femaleImg'], pic + '.g2'); alt.setdefault(g['femaleImg'] + '.s', pic + '.g2.s')
            else:
                if not base:
                    report.append(f'#{dex}: no GO entry to share its name and facts'); continue
                fid = f'{dex}-{slug(f["fi"])}' if f['fi'] else str(dex)
                e = {'id': fid, 'dex': dex, 'gen': base.get('gen'), 'name': base['name'], 'form': fname or f['fi'].replace('-', ' ').title(),
                     'types': types_of(f['pid']) or base.get('types', []), 'img': pic, 'gender': base.get('gender'),
                     'class': base.get('class'), 'category': base.get('category'), 'height': base.get('height'), 'weight': base.get('weight'),
                     'desc': base.get('desc'), 'family': base.get('family'), 'evo': [], 'order': f['order']}
                e = {k: v for k, v in e.items() if v not in (None, '')}
                if dex == 25 and f['fi'].endswith('-cap'):   # every cap Pikachu is male (PokeAPI's gender rate is the species'; overnight review, 23 Nov)
                    e['gender'] = 'male'
                if not pic:
                    report.append(f'#{dex} {e["form"]}: no HOME picture')
            if (dex, (g or {}).get('id')) in FORM_NAMES:
                e['form'] = FORM_NAMES[(dex, g['id'])]
            out.append(e)
        if dex in GENDER_FORMS and not any(g.get('genderForm') for g in goes):   # Basculegion: GO has one entry (not out in GO yet)
            for e in out[-len(fs):]:
                female = e['id'].endswith('-female')
                e.update({'form': 'Female' if female else 'Male', 'gender': 'female' if female else 'male', 'genderForm': True})
        # GO's gender forms (Female and Male fully different, her pick 18 Nov) stay two entries in HOME too
        for g in goes:
            if g.get('genderForm') and g['id'] not in used:
                out.append({'id': g['id'], 'go': True}); used.add(g['id'])
        # forms GO has and HOME doesn't keep: reported, left out
        for g in goes:
            if g['id'] not in used and dex not in ONE_ENTRY:
                report.append(f'#{dex} {g["name"]} {g.get("form") or ""}: in GO, not a form of its own in HOME (left out)')

    # HOME's facts: shiny unless HOME can't have it shiny; Gigantamax where it can be kept with the Factor
    by_dex = {}
    gofull = {e['id']: e for e in go}
    for e in out:
        full = {**gofull.get(e['id'], {}), **e} if e.get('go') else e
        by_dex.setdefault(full['dex'], []).append((e, full))
    flat = lambda x: ''.join(sorted(tokens(x)))
    def hits(lst, dex, full, first, every=False):
        """Is this entry on Serebii's list? A form named there by its name ("Original Cap", "Rapid Strike Style"); one with no
        form named is the species' first form only (Victini; plain Pikachu, not the caps), or every form (Alcremie's Gigantamax)."""
        mine = flat(full.get('form') or '')
        for x in lst:
            if x.get('dex') != dex:
                continue
            if not x.get('form'):
                if first or every:
                    return True
            elif mine and (flat(x['form']) in mine or mine in flat(x['form']) or flat(x['form']) == flat((full.get('name') or '') + ' ' + (full.get('form') or ''))):
                return True
        return False
    for dex, es in by_dex.items():
        for i, (e, full) in enumerate(es):
            e['shiny'] = not hits(no_shiny, dex, full, i == 0)
            e['gmax'] = hits(gmax, dex, full, i == 0, dex in GMAX_ALL_FORMS) and not any((full.get('form') or '').startswith(r) for r in ('Alolan', 'Galarian', 'Hisuian', 'Paldean'))
            e.update(fixes.get(e['id'], {}))

    ids = [e['id'] for e in out]
    dupes = {i for i in ids if ids.count(i) > 1}
    report += [f'id twice: {i}' for i in sorted(dupes)]
    print(f'Pokémon HOME: {len(out)} entries ({sum(1 for e in out if e.get("go"))} shared with GO, {sum(1 for e in out if not e.get("go"))} HOME\'s own), '
          f'{len({(e.get("dex") or gofull[e["id"]]["dex"]) for e in out})} species; {sum(1 for e in out if not e["shiny"])} can’t be shiny; {sum(1 for e in out if e["gmax"])} Gigantamax')
    for r in report:
        print(' ', r)
    if apply:
        os.makedirs(os.path.join(DATA, 'home'), exist_ok=True)
        write(os.path.join(DATA, 'home', 'dex.json'), {'updated': date.today().isoformat(), 'entries': out})
        write(os.path.join(DATA, 'home', 'pictures.json'), {'_': 'GO picture key -> HOME picture key, used only where GO has no picture (tools/import_home.py)', **dict(sorted(alt.items()))})
        print('Written data/home/dex.json and data/home/pictures.json')


def write(path, obj):
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8', newline='\n') as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=1)
        fh.write('\n')
    os.replace(tmp, path)


if __name__ == '__main__':
    main()
