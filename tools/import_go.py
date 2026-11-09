"""Bring in the Pokémon GO Pokédex: every species and form, its genders, and which shinies and costumes are out.

    python -X utf8 tools/import_go.py            (report only: what would change)
    python -X utf8 tools/import_go.py --apply    (writes data/go/dex.json and data/go/costumes.json)

Rerun after a GO update or a new shiny release, then tools/fetch_sprites.py (new pictures) and tools/build.py.

Where everything comes from (copies of what was read are kept in imports/go-<date>/, not in git):
- pokemon-go-api (built from the game's own Game Master): species, names, types, generation, legendary/mythical, forms.
- PokeMiners' pogo_assets (the game's own picture files): which forms, female pictures and costumes exist.
- Leek Duck's Shiny Checklist: which shinies are out (and the costume names as Leek Duck writes them).
- PokeAPI's species table: male/female ratios (genderless, male only, female only, or both).
- Serebii's lists (pokemongo/shadowpokemon.shtml, pokemongo/maxbattles.shtml): which Pokémon can be Shadow (and so
  Purified), Dynamax and Gigantamax in GO. Regional forms aren't on Serebii's Shadow list, so only the plain ones get it.
- Which species are out: pogoapi.net (frozen in early 2024) + anything with a shiny out + research/data/go-release-check.json
  (checked 9 Nov 2026) + data/go/release-fixes.json (by hand: {"<dex or entry id>": true/false}).
Nothing here is made up: a costume Leek Duck doesn't name gets its game code tidied ("Halloween 2017").
"""
import csv, io, json, os, re, sys, urllib.request
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data', 'go')
UA = {'User-Agent': "Mozilla/5.0 (Jemma's Pokedex, private)"}
SOURCES = {
    'pokedex.json': 'https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex.json',
    'assets-tree.json': 'https://api.github.com/repos/PokeMiners/pogo_assets/git/trees/master?recursive=1',
    'leekduck-shiny.json': 'https://leekduck.com/shiny/pms.json',
    'leekduck-names.json': 'https://leekduck.com/shiny/name.json',
    'pogoapi-released.json': 'https://pogoapi.net/api/v1/released_pokemon.json',
    'pokeapi-species.csv': 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species.csv',
    'serebii-shadowpokemon.html': 'https://www.serebii.net/pokemongo/shadowpokemon.shtml',
    'serebii-maxbattles.html': 'https://www.serebii.net/pokemongo/maxbattles.shtml',
}
# Serebii writes a form as a letter after the number in its picture name ("849-l"); what that is here
SEREBII_FORMS = {(849, ''): ['849-amped'], (849, 'l'): ['849-low-key'], (849, 'gi'): ['849-amped', '849-low-key'],
                 (892, ''): ['892-single-strike'], (892, 'r'): ['892-rapid-strike'], (487, ''): ['487-altered'], (555, ''): ['555-standard'],
                 (641, ''): ['641-incarnate'], (642, ''): ['642-incarnate'], (645, ''): ['645-incarnate']}
SEREBII_REGION = {'a': 'alolan', 'g': 'galarian', 'h': 'hisuian', 'p': 'paldean'}


def serebii_rows(html, start=None, end=None):
    """(dex, form letter) for each Pokémon in a Serebii list, between two headings."""
    if start:
        html = html[html.index(start):]
    if end:
        html = html[:html.index(end)]
    pat = r'<td class="cen">\s*#(\d{4})\s*</td>\s*<td class="cen">.*?<img src="/pokemongo/pokemon/(\d+)-?([a-z]*)\.png"'
    return [(int(n), suf) for n, _, suf in re.findall(pat, html, re.S)]
ASSET_DIRS = ('Images/Pokemon/Addressable Assets/', 'Images/Pokemon - 256x256/Addressable Assets/')
ASSET_RAW = 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/'

# Forms that aren't Pokédex entries: Mega, Gigantamax and in-battle shapes (in GO you catch the other one).
NOT_ENTRIES = re.compile(r'(^|_)(MEGA|MEGA_X|MEGA_Y|PRIMAL|GIGANTAMAX|ETERNAMAX)$|_(ZEN|GALARIAN_ZEN|SCHOOL|BUSTED|GULPING|GORGING|HANGRY|'
                         r'BLADE|COMPLETE|COMPLETE_TEN_PERCENT|COMPLETE_FIFTY_PERCENT|NOICE|PIROUETTE|ULTRA|DUSK_MANE_ULTRA|'
                         r'CROWNED_SWORD|CROWNED_SHIELD|ETERNAMAX|STELLAR|TERASTAL|HERO|MASTERPIECE|PHONY|UNREMARKABLE|COUNTERFEIT|ARTISAN|'
                         r'METEOR_\w+|BREAD_DOUGH_MODE\w*)$|^(?!UNOWN)\w+_S$')   # _S: the Apex Shadow versions (Lugia, Ho-Oh, the legendary beasts…)
# Hero Palafin, Crowned Zacian/Zamazenta etc. are battle or item-change forms; Sinistea/Poltchageist editions look the same.
# Region names as GO shows them.
REGION = {'ALOLA': 'Alolan', 'GALARIAN': 'Galarian', 'HISUIAN': 'Hisuian', 'PALDEA': 'Paldean'}


def fetch(folder, name, url):
    path = os.path.join(folder, name)
    if not os.path.exists(path):
        print(f'downloading {name}…')
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
            open(path, 'wb').write(r.read())
    return path


def tidy(code):
    """A game code as words: 'GOFEST_2025_GOGGLES_RED' -> 'GO Fest 2025 Goggles Red'."""
    words = []
    for w in code.replace('NOEVOLVE', '').strip('_').split('_'):
        if not w:
            continue
        words.append({'GOFEST': 'GO Fest', 'GOTOUR': 'GO Tour', 'WCS': 'World Championships', 'TCG': 'TCG', 'PXP': 'PXP',
                      'WILDAREA': 'Wild Area', 'OF': 'of', 'POKEBALL': 'Poké Ball', 'PERCENT': '%', 'BB': 'BB', 'K': 'K', 'A': 'A', 'B': 'B', 'C': 'C', 'S': 'S'}.get(w, w.capitalize()))
    return ' '.join(words).replace(' %', '%').replace('Fifty%', '50%').replace('Ten%', '10%')


def form_name(code, species):
    """How a form reads after the species name: 'ALOLA' -> 'Alolan', 'UNOWN_A' -> 'A', 'PALDEA_COMBAT' -> 'Paldean Combat'."""
    c = re.sub(rf'^{re.escape(species)}_', '', code)
    for k, v in REGION.items():
        if c == k or c.startswith(k + '_'):
            rest = c[len(k):].strip('_')
            return f'{v} {tidy(rest)}'.strip() if rest and rest != 'STANDARD' else v
    c = {'EXCLAMATION_POINT': '!', 'QUESTION_MARK': '?'}.get(c, c)
    return tidy(c) if not re.fullmatch(r'\d+', c) else f'#{int(c) + 1}'


def asset_key(url):
    return os.path.basename(url or '').replace('.icon.png', '') or None


def main():
    apply = '--apply' in sys.argv
    folder = os.path.join(ROOT, 'imports', f'go-{date.today().isoformat()}')
    os.makedirs(folder, exist_ok=True)
    paths = {n: fetch(folder, n, u) for n, u in SOURCES.items()}
    dex = json.load(open(paths['pokedex.json'], encoding='utf-8'))
    tree = json.load(open(paths['assets-tree.json'], encoding='utf-8'))
    shiny = json.load(open(paths['leekduck-shiny.json'], encoding='utf-8'))
    released_old = set(map(int, json.load(open(paths['pogoapi-released.json'], encoding='utf-8'))))
    research = json.load(open(os.path.join(ROOT, 'research', 'data', 'go-release-check.json'), encoding='utf-8'))
    fixes_path = os.path.join(DATA, 'release-fixes.json')
    fixes = json.load(open(fixes_path, encoding='utf-8')) if os.path.exists(fixes_path) else {}
    fixes = {k: v for k, v in fixes.items() if not k.startswith('_')}

    # the game's picture files: key ('pm37.fALOLA') -> path in the repo
    files = {}
    for t in tree['tree']:
        for d in ASSET_DIRS:
            if t['path'].startswith(d) and t['path'].endswith('.icon.png'):
                files.setdefault(t['path'][len(d):-len('.icon.png')], t['path'])
    # shinies out, by picture key, with the date Leek Duck gives
    shiny_out = {}
    for s in shiny:
        shiny_out.setdefault(s['aa_fn'], s.get('released_date', '').replace('/', '-'))
    shiny_label = {s['aa_fn']: re.sub(r'\s+', ' ', s['name_suffix']).strip() for s in shiny if s.get('name_suffix')}

    # genders: PokeAPI gender_rate is eighths female (-1 = genderless)
    gender = {}
    for row in csv.DictReader(io.StringIO(open(paths['pokeapi-species.csv'], encoding='utf-8').read())):
        r = int(row['gender_rate'])
        gender[int(row['id'])] = 'none' if r == -1 else 'male' if r == 0 else 'female' if r == 8 else 'both'

    released = released_old | {int(re.match(r'pm(\d+)', k).group(1)) for k in shiny_out}
    for s in research['species']:
        if s['released'] is True:
            released.add(s['dex'])
        elif s['released'] is False:
            released.discard(s['dex'])

    entries, costumes, used = [], [], set()
    for sp in dex:
        n, sid = sp['dexNr'], sp['id']
        name = sp['names']['English']
        cls = {'POKEMON_CLASS_LEGENDARY': 'legendary', 'POKEMON_CLASS_MYTHIC': 'mythical',
               'POKEMON_CLASS_ULTRA_BEAST': 'ultra-beast'}.get(sp.get('pokemonClass'))
        forms = list((sp.get('regionForms') or {}).values()) if isinstance(sp.get('regionForms'), dict) else list(sp.get('regionForms') or [])
        form_keys = {asset_key((f.get('assets') or {}).get('image')) for f in forms if not NOT_ENTRIES.search(f['formId'])}
        cands = []
        base_key = asset_key((sp.get('assets') or {}).get('image'))
        if base_key and base_key not in form_keys:
            cands.append((None, sp, base_key))
        for f in forms:
            if NOT_ENTRIES.search(f['formId']):
                continue
            key = asset_key((f.get('assets') or {}).get('image'))
            if not key:   # the API has no picture: look for the game's own file under the form's code
                short = re.sub(rf'^{re.escape(sid)}_', '', f['formId'])
                key = next((k for k in (f'pm{n}.f{f["formId"]}', f'pm{n}.f{short}') if k in files), None)
            if not key:
                continue   # a form the game has no picture for (Spinda's unused patterns, Minior's meteor shells…)
            cands.append((f['formId'], f, key))
        if not cands:   # a new species with no pictures yet (shown as a blank until it has some)
            cands.append((None, sp, f'pm{n}'))
        for fid, src, key in cands:
            used.add(key)
            types = [t['names']['English'] for t in (src.get('primaryType'), src.get('secondaryType')) if t]
            fname = form_name(fid, sid) if fid else None
            eid = str(n) if not fid else f'{n}-{slug(fname)}'
            regional = bool(fname) and fname.split()[0] in REGION.values()
            out = n in released and (not fid or not regional or key in shiny_out or fixes.get(eid) is True)
            out = fixes.get(eid, fixes.get(str(n), out)) if eid in fixes or str(n) in fixes else out
            g = gender.get(n, 'both')
            e = {'id': eid, 'dex': n, 'gen': sp.get('generation'), 'name': name, 'form': fname, 'types': types,
                 'img': key, 'gender': g, 'released': bool(out)}
            if cls:
                e['class'] = cls
            if g == 'both' and key + '.g2' in files:
                e['femaleImg'] = key + '.g2'
            if key in shiny_out:
                e['shiny'] = shiny_out[key] or True
            entries.append(e)
        # costumes: every other picture of this species that isn't a form above or a Mega / Gigantamax
        for key in sorted(files):
            m = re.fullmatch(rf'pm{n}\.([cf])([A-Za-z0-9_]+?)(\.g2)?(\.s)?', key)
            if not m or m.group(3) or m.group(4) or key in used:
                continue
            code = m.group(2)
            if code != code.upper() and f'pm{n}.{m.group(1)}{code.upper()}' in files:
                continue   # the same costume under a second spelling (pm133.cMay_2023)
            if NOT_ENTRIES.search('_' + code) or code in ('NORMAL', 'MALE', 'FEMALE') or (m.group(1) == 'f' and any(e['img'] == key for e in entries)):
                continue
            if m.group(1) == 'f' and f'{sid}_{code}' in {f['formId'] for f in forms}:
                continue   # a real form left out above (battle form)
            label = shiny_label.get(key) or tidy(code)
            c = {'id': f'{n}-{slug(code)}', 'dex': n, 'name': name, 'costume': label, 'code': code, 'img': key}
            if key + '.g2' in files:
                c['femaleImg'] = key + '.g2'
            if key in shiny_out:
                c['shiny'] = shiny_out[key] or True
            costumes.append(c)

    # Shadow / Purified, Dynamax, Gigantamax: from Serebii's lists, onto the matching entries
    byid = {e['id']: e for e in entries}
    def targets(n, suf):
        if (n, suf) in SEREBII_FORMS:
            return [byid[i] for i in SEREBII_FORMS[(n, suf)] if i in byid]
        if suf in ('', 'gi'):
            return [byid[str(n)]] if str(n) in byid else []
        if suf in SEREBII_REGION:
            return [e for e in entries if e['dex'] == n and e['id'].startswith(f'{n}-{SEREBII_REGION[suf]}')]
        return []
    shadow_html = open(paths['serebii-shadowpokemon.html'], encoding='latin-1').read()
    max_html = open(paths['serebii-maxbattles.html'], encoding='latin-1').read()
    unmatched = []
    for flag, rows in (('shadow', serebii_rows(shadow_html, 'List of Available Shadow')),
                       ('gmax', serebii_rows(max_html, 'List of Gigantamax Capable', 'List of Dynamax Capable')),
                       ('dynamax', serebii_rows(max_html, 'List of Dynamax Capable'))):
        hits = 0
        for n, suf in rows:
            ts = [e for e in targets(n, suf) if e['released']]
            if not ts:
                unmatched.append(f'{flag} {n}{"-" + suf if suf else ""}')
            for e in ts:
                e[flag] = True
                hits += 1
        print(f'{flag}: {len(rows)} on Serebii’s list, {hits} entries marked')
    if unmatched:
        print('Not matched (check):', ', '.join(unmatched))

    entries.sort(key=lambda e: (e['dex'], e['form'] is not None, e['form'] or ''))
    costumes.sort(key=lambda c: (c['dex'], c['code']))
    seen = set()
    for e in entries + costumes:   # ids must be unique: the collection is saved by them
        while e['id'] in seen:
            e['id'] += '-2'
        seen.add(e['id'])
    pics = {k: files.get(k) for e in entries + costumes for k in (e['img'], e['img'] + '.s', e.get('femaleImg'), (e.get('femaleImg') or '') + '.s') if k and k != '.s'}
    missing = sorted(k for k, v in pics.items() if not v)

    out_n = sum(e['released'] for e in entries)
    print(f'{len(entries)} entries ({out_n} out in GO), {len({e["dex"] for e in entries})} species; '
          f'{sum(1 for e in entries if e.get("shiny"))} shinies out; {sum(1 for e in entries if e.get("femaleImg"))} with a female picture; '
          f'{len(costumes)} costumes ({sum(1 for c in costumes if c.get("shiny"))} with their shiny out)')
    odd = [e['id'] for e in entries if e['released'] and e['form'] and not e.get('shiny')]
    print(f'{len(odd)} forms counted as out with no shiny yet:', ', '.join(odd[:80]))
    if missing:
        print(f'{len(missing)} pictures not in the game files (shown as a blank):', ', '.join(missing[:30]))
    old = os.path.join(DATA, 'dex.json')
    if os.path.exists(old):
        before = {e['id']: e for e in json.load(open(old, encoding='utf-8'))['entries']}
        new = [e['id'] for e in entries if e['id'] not in before]
        gone = [i for i in before if i not in {e['id'] for e in entries}]
        newly_out = [e['id'] for e in entries if e['released'] and e['id'] in before and not before[e['id']]['released']]
        new_shiny = [e['id'] for e in entries if e.get('shiny') and e['id'] in before and not before[e['id']].get('shiny')]
        print(f'Since last time: {len(new)} new entries, {len(gone)} gone {gone[:10]}, {len(newly_out)} newly out, {len(new_shiny)} new shinies {new_shiny[:20]}')
    if not apply:
        print('(report only; --apply to write data/go/)')
        return
    os.makedirs(DATA, exist_ok=True)
    write(os.path.join(DATA, 'dex.json'), {'updated': date.today().isoformat(), 'entries': entries})
    write(os.path.join(DATA, 'costumes.json'), {'updated': date.today().isoformat(), 'costumes': costumes})
    write(os.path.join(DATA, 'pictures.json'), {k: v for k, v in sorted(pics.items()) if v})
    print('Written data/go/dex.json, costumes.json and pictures.json')


def slug(s):
    import unicodedata
    s = ''.join(c for c in unicodedata.normalize('NFKD', str(s)) if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', '-', s.lower().replace('!', 'exclamation').replace('?', 'question').replace('#', '')).strip('-')


def write(path, obj):
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8', newline='\n') as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=1)
        fh.write('\n')
    os.replace(tmp, path)


if __name__ == '__main__':
    main()
