"""Bring in the Pokémon GO Pokédex: every species and form, its genders, and which shinies and costumes are out.

    python -X utf8 tools/import_go.py            (report only: what would change)
    python -X utf8 tools/import_go.py --apply    (writes data/go/dex.json and data/go/costumes.json)

Rerun after a GO update or a new shiny release, then tools/fetch_sprites.py (new pictures) and tools/build.py.

Where everything comes from (copies of what was read are kept in imports/go-<date>/, not in git):
- pokemon-go-api (built from the game's own Game Master): species, names, types, generation, legendary/mythical, forms.
- PokeMiners' pogo_assets (the game's own picture files): which forms, female pictures and costumes exist.
- Leek Duck's Shiny Checklist: which shinies are out (and the costume names as Leek Duck writes them).
- PokeAPI's species table: male/female ratios (genderless, male only, female only, or both).
- Dittobase's GO Pokédex (dittobase.com/api/go-pokemon/pokedex, the data behind its Pokédex page): which Pokémon and
  forms are out as Shadow (and so Purified), Dynamax and Gigantamax, regional forms included (9 Nov: Serebii's Shadow
  list leaves out every regional form, e.g. Alolan Rattata, which she spotted). Serebii's lists (pokemongo/shadowpokemon.shtml,
  pokemongo/maxbattles.shtml) are read as a second opinion: disagreements are printed, and either source saying yes is enough
  (a missing box is worse than a spare one).
  The report also prints where Dittobase disagrees with what's counted as out and which shinies are out; again either
  saying out (or shiny out) is enough.
- The game's own Pokédex text (PokeMiners' copy of GO's English text file): each Pokémon's description and category
  ("Seed Pokémon"), word for word; a form's own text where the game has one (its keys use the game's form numbers,
  read from the POGOProtos list in the @na-ji/pogo-protos package).
- PokeMiners' copy of the Game Master: height, weight, buddy distance, family and evolutions (candy, items, lures,
  trades, buddy and time-of-day rules, evolution tasks in the game's own words).
- Which species are out: pogoapi.net (frozen in early 2024) + anything with a shiny out + research/data/go-release-check.json
  (checked 9 Nov 2026) + data/go/release-fixes.json (by hand: {"<dex or entry id>": true/false}).
Nothing here is made up: a costume Leek Duck doesn't name gets its game code tidied ("Halloween 2017").
"""
import csv, io, json, os, re, sys, urllib.request
from datetime import date

ROOT = os.environ.get('POKEDEX_ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # POKEDEX_ROOT: the tests' throwaway copy
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
    'dittobase-go-pokedex.json': 'https://www.dittobase.com/api/go-pokemon/pokedex',
    'gamemaster.json': 'https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json',
    'go-text-apk.json': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Texts/Latest%20APK/JSON/i18n_english.json',
    'pogo-protos.d.ts': 'https://cdn.jsdelivr.net/npm/@na-ji/pogo-protos/compiled.d.ts',
}
DITTO_FLAGS = {'isShadow': ('shadow', '-shadow'), 'isDynamax': ('dynamax', '-dynamax'), 'isGigantamax': ('gmax', '-gigantamax')}
# Dittobase's words for a form, where they differ from ours
DITTO_WORDS = {'alola': 'alolan', 'paldea': 'paldean', 'galar': 'galarian', 'hisui': 'hisuian'}


def ditto_ids(rec, by_slug, ids):
    """Our entry ids for one of Dittobase's records ('rattata-alola-shadow' -> ['19-alolan'])."""
    flag = next((f for f in DITTO_FLAGS if rec.get(f)), None)
    slug = rec['slug']
    if flag:
        suffix = DITTO_FLAGS[flag][1]
        i = slug.find(suffix)
        if i < 0:
            return []   # e.g. 'ho-oh-s', the Apex Shadow: not a box here
        form_extra = slug[i + len(suffix):].strip('-')   # 'urshifu-gigantamax-rapid-strike'
        slug = slug[:i] + ('-' + form_extra if form_extra else '')
    sp = rec['speciesSlug']
    part = slug[len(sp) + 1:] if slug.startswith(sp + '-') else ''
    part = '-'.join(DITTO_WORDS.get(w, w) for w in part.split('-')) if part else ''
    n = rec['speciesId']
    if part and f'{n}-{part}' in ids:
        return [f'{n}-{part}']
    if not part and str(n) in ids:
        return [str(n)]
    if not part:   # no plain entry: every form of it (Toxtricity's Gigantamax is both Amped and Low Key)
        return sorted(i for i in ids if i.startswith(f'{n}-')) if flag == 'isGigantamax' else []
    if str(n) in ids and part in ('normal', 'standard', 'ordinary', 'altered', 'incarnate'):
        return [str(n)]
    return []
# Serebii writes a form as a letter after the number in its picture name ("849-l"); what that is here
SEREBII_FORMS = {(849, ''): ['849-amped'], (849, 'l'): ['849-low-key'], (849, 'gi'): ['849-amped', '849-low-key'],
                 (892, ''): ['892-single-strike'], (892, 'r'): ['892-rapid-strike'], (487, ''): ['487-altered'], (555, ''): ['555-standard'],
                 (641, ''): ['641-incarnate'], (642, ''): ['642-incarnate'], (645, ''): ['645-incarnate']}
SEREBII_REGION = {'a': 'alolan', 'g': 'galarian', 'h': 'hisuian', 'p': 'paldean'}
# the form the game's Pokédex shows first, where the API's own default picture isn't it (her word, 9 Nov: Unown is F)
DEFAULT_FORM = {201: 'pm201.fUNOWN_F'}
# pictures in the costume slots that aren't costumes (10 Nov, her questions): exact copies of the plain picture, which the game
# keeps as placeholders (never released as costumes), and Xerneas's normal look
NOT_COSTUMES = {'pm26.cNOVEMBER_2018', 'pm136.cHOLIDAY_2022', 'pm136.cNOVEMBER_2018', 'pm150.cONE_YEAR_ANNIVERSARY', 'pm172.cFALL_2018',
                'pm249.cONE_YEAR_ANNIVERSARY', 'pm716.fNEUTRAL'}
# a picture the game files keep with the costumes that is really a form in the game's Pokédex: Armored Mewtwo (her call, 10 Nov)
PICTURE_FORMS = {'pm150.fA': ('MEWTWO_A', 'Armored')}
# names for costumes the sources call by code only
COSTUME_NAMES = {'COPY_2019': 'Clone', 'FEB_2019': 'Detective Hat'}   # Detective Hat: Dittobase's name (Leek Duck has none, no shiny)


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
    if '--reuse' in sys.argv:   # the newest copies already downloaded (rebuild without fetching again)
        imports = os.path.join(ROOT, 'imports')
        folder = os.path.join(imports, max(d for d in os.listdir(imports) if d.startswith('go-')))
        print('reusing', os.path.basename(folder))
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
        default_key = DEFAULT_FORM.get(n) or base_key   # the form shown on the card (the rest open from it)
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
            if fid and key == default_key:
                e['default'] = True
            e['_fid'], e['_evos'] = fid or sid, [x['formId'] for x in src.get('evolutions') or []]   # for shadow evolutions
            e['_sid'] = sid
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
            if key in NOT_COSTUMES:
                continue
            if key in PICTURE_FORMS:   # a form after all: an entry like the others, from the plain one
                fid, fname = PICTURE_FORMS[key]
                base = next(e for e in entries if e['dex'] == n and e['form'] is None)
                e = {k: v for k, v in base.items() if k not in ('femaleImg', 'shiny', 'shadow', 'dynamax', 'gmax', 'default')}
                e.update(id=f'{n}-{slug(fname)}', form=fname, img=key, _fid=fid, _evos=[])
                if key in shiny_out:
                    e['shiny'] = shiny_out[key] or True
                entries.append(e)
                used.add(key)
                continue
            ld = f'pm{n}.{m.group(1)}{code.upper()}'   # Leek Duck writes the code in capitals (the game has pm133.cMay_2023)
            label = COSTUME_NAMES.get(code.upper()) or shiny_label.get(key) or shiny_label.get(ld) or tidy(code)
            c = {'id': f'{n}-{slug(code)}', 'dex': n, 'name': name, 'costume': label, 'code': code, 'img': key}
            if key + '.g2' in files:
                c['femaleImg'] = key + '.g2'
            if key in shiny_out or ld in shiny_out:
                c['shiny'] = shiny_out.get(key, shiny_out.get(ld)) or True
            costumes.append(c)

    # GO's own Pokédex page for each (her ask, 9 Nov): description and category word for word from the game's text file
    # (a form's own text where there is one), and height, weight, buddy distance and evolutions from the Game Master
    text = json.load(open(paths['go-text-apk.json'], encoding='utf-8'))['data']
    text = dict(zip(text[0::2], text[1::2]))
    protos = open(paths['pogo-protos.d.ts'], encoding='utf-8').read()
    i = protos.index('enum Form {')
    form_no = {m.group(1): int(m.group(2)) for m in re.finditer(r'(\w+) = (\d+)', protos[i:protos.index('}', i)])}
    gm, quests = {}, {}
    for rec in json.load(open(paths['gamemaster.json'], encoding='utf-8')):
        ps = rec['data'].get('pokemonSettings')
        if ps:
            gm.setdefault(ps.get('form') or ps['pokemonId'], ps)
        if rec['data'].get('evolutionQuestTemplate'):
            quests[rec['templateId']] = rec['data']['evolutionQuestTemplate']

    def words(key):
        t = text.get(key) or text.get(key.lower())
        return re.sub(r'\s+', ' ', t).replace("'", '\u2019').strip() if t else None

    def item(code):
        return words(code.lower() + '_name') or words(code.lower()) or tidy(code.replace('ITEM_', ''))

    no_text, own_text = [], 0
    for e in entries:
        n, fid, sid = e['dex'], e['_fid'], e['_sid']
        num = form_no.get(fid, form_no.get(sid + '_NORMAL')) if fid != sid else None
        for field in ('desc', 'category'):
            own = words(f'pokemon_{field}_{n:04d}_{num:04d}') if num is not None else None
            plain = form_no.get(sid + '_NORMAL')   # some species only have text under their normal form's number
            v = own or words(f'pokemon_{field}_{n:04d}') or (plain is not None and words(f'pokemon_{field}_{n:04d}_{plain:04d}')) or None
            if v:
                e[field] = v
            if own and field == 'desc':
                own_text += 1
        if not e.get('desc') and e['released']:
            no_text.append(e['id'])
        ps = gm.get(fid) or gm.get(sid + '_NORMAL') or gm.get(sid)
        if not ps:
            continue
        if ps.get('pokedexHeightM'):
            e['height'] = round(ps['pokedexHeightM'], 2)
        if ps.get('pokedexWeightKg'):
            e['weight'] = round(ps['pokedexWeightKg'], 2)
        if ps.get('kmBuddyDistance'):
            e['buddyKm'] = ps['kmBuddyDistance']
        if ps.get('familyId'):
            e['family'] = ps['familyId'].replace('FAMILY_', '')
        steps = []
        for b in ps.get('evolutionBranch') or []:
            if b.get('temporaryEvolution') or not b.get('evolution'):
                continue   # Mega Evolution isn't an evolution here
            st = {'_to': b.get('form') or b['evolution']}
            if b.get('candyCost'):
                st['candy'] = b['candyCost']
            if b.get('evolutionItemRequirement'):
                st['item'] = item(b['evolutionItemRequirement'])
                if b.get('evolutionItemRequirementCost', 1) > 1:
                    st['itemCount'] = b['evolutionItemRequirementCost']
            if b.get('lureItemRequirement'):
                st['lure'] = item(b['lureItemRequirement'])
            if b.get('kmBuddyDistanceRequirement'):
                st['buddyKm'] = b['kmBuddyDistanceRequirement']
            if b.get('mustBeBuddy'):
                st['buddy'] = True
            for k, v in (('onlyDaytime', 'day'), ('onlyNighttime', 'night'), ('onlyDuskPeriod', 'dusk'), ('onlyFullMoon', 'full moon')):
                if b.get(k):
                    st['time'] = v
            if b.get('genderRequirement'):
                st['gender'] = b['genderRequirement'].lower()
            if b.get('noCandyCostViaTrade'):
                st['tradeFree'] = True
            if b.get('onlyUpsideDown'):
                st['upsideDown'] = True
            for q in b.get('questDisplay') or []:
                qt = quests.get(q.get('questRequirementTemplateId'))
                if qt:
                    key = qt['display']['description']
                    goal = (qt.get('goals') or [{}])[0].get('target')
                    if goal and goal > 1 and key.upper().endswith('_SINGLE'):   # the game's plural wording ('Earn 70 hearts')
                        key = key[:-len('_SINGLE')] + ('_PLURAL' if key.isupper() else '_plural')
                    t = words(key)
                    if t:
                        st['task'] = t.replace('{0}', str(goal)) if goal is not None else t
            if st not in steps:
                steps.append(st)
        if steps:
            e['evo'] = steps
    print(f'descriptions: {sum(1 for e in entries if e.get("desc"))} of {len(entries)} entries ({own_text} forms with their own text)')
    if no_text:
        print(f'{len(no_text)} out in GO with no description in the game text:', ', '.join(no_text[:40]))

    # Shadow / Purified, Dynamax, Gigantamax: from Dittobase, onto the matching entries; Serebii as a second opinion
    byid = {e['id']: e for e in entries}
    ids = set(byid)
    ditto = json.load(open(paths['dittobase-go-pokedex.json'], encoding='utf-8'))
    by_slug = {r['slug']: r for r in ditto}
    unmatched, from_ditto = [], {'shadow': set(), 'dynamax': set(), 'gmax': set()}
    for r in ditto:
        flag = next((f for f in DITTO_FLAGS if r.get(f)), None)
        if not flag or not r.get('isReleased') or r.get('isCostume'):
            continue
        got = [i for i in ditto_ids(r, by_slug, ids) if byid[i]['released']]
        if not got and not r['slug'].endswith('-s'):
            unmatched.append(r['slug'])
        for i in got:
            byid[i][DITTO_FLAGS[flag][0]] = True
            from_ditto[DITTO_FLAGS[flag][0]].add(i)
    for flag, got in from_ditto.items():
        print(f'{flag}: {len(got)} entries (Dittobase)')
    if unmatched:
        print('Dittobase records not matched (check):', ', '.join(unmatched))

    # Mega Evolution and Primal Reversion (her ask, 10 Nov: a box like Dynamax; X and Y a box each): the Game Master's megas
    # (pokemon-go-api), out in GO when Dittobase says released or Leek Duck lists its shiny; on the species' plain entry
    MEGA_TICK = {'MEGA': ('mg', 'Mega'), 'MEGA_X': ('mx', 'Mega X'), 'MEGA_Y': ('my', 'Mega Y'), 'PRIMAL': ('mg', 'Primal')}
    mega_n = 0
    for sp in dex:
        n = sp['dexNr']
        base = byid.get(str(n)) or next((e for e in entries if e['dex'] == n and e.get('default')), None)
        if not base or not base['released']:
            continue
        for key in sp.get('megaEvolutions') or {}:
            suf = key[len(sp['id']) + 1:]
            if suf not in MEGA_TICK:
                continue
            sslug = (by_slug.get(sp['id'].lower().replace('_', '-')) or {}).get('speciesSlug') or sp['id'].lower().replace('_', '-')
            d = by_slug.get(f'{sslug}-{suf.lower().replace("_", "-")}') or {}
            pic = f'pm{n}.f{suf}'
            if not (d.get('isReleased') or pic in shiny_out):
                continue
            t, label = MEGA_TICK[suf]
            base.setdefault('mega', []).append({'t': t, 'label': label, 'img': pic})
            mega_n += 1
    for pic in sorted(shiny_out):   # Leek Duck lists a Mega the Game Master copy doesn't have yet (Mega Clefable, 10 Nov)
        m = re.fullmatch(r'pm(\d+)\.f(MEGA|MEGA_X|MEGA_Y|PRIMAL)', pic)
        base = m and (byid.get(m.group(1)) or next((e for e in entries if e['dex'] == int(m.group(1)) and e.get('default')), None))
        if base and base['released'] and not any(x['img'] == pic for x in base.get('mega') or []):
            t, label = MEGA_TICK[m.group(2)]
            base.setdefault('mega', []).append({'t': t, 'label': label, 'img': pic})
            mega_n += 1
    for r in ditto:   # a Mega not out yet (Dittobase lists the main games' Megas): "Unavailable" rather than "Not possible"
        base = byid.get(str(r.get('speciesId')))
        if r.get('isMega') and not r.get('isReleased') and base and not base.get('mega'):
            base['megaLater'] = True
    print(f'Mega and Primal: {mega_n} out, on {sum(1 for e in entries if e.get("mega"))} entries')

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
    for flag, rows in (('shadow', serebii_rows(shadow_html, 'List of Available Shadow')),
                       ('gmax', serebii_rows(max_html, 'List of Gigantamax Capable', 'List of Dynamax Capable')),
                       ('dynamax', serebii_rows(max_html, 'List of Dynamax Capable'))):
        serebii = {e['id'] for n, suf in rows for e in targets(n, suf) if e['released']}
        only_s = sorted(serebii - from_ditto[flag])
        # Serebii has no regional forms on its Shadow list, so only count plain ones Dittobase lacks
        only_d = sorted(i for i in from_ditto[flag] - serebii if not (flag == 'shadow' and byid[i]['form'] and byid[i]['form'].split()[0] in REGION.values()))
        if only_s or only_d:
            print(f'  {flag}: Serebii only {only_s}; Dittobase only {only_d}')
        for i in only_s:   # either source is enough: a missing box is worse than a spare one (9 Nov)
            byid[i][flag] = True

    # a shadow that evolves stays a shadow: Shadow Alolan Meowth makes Shadow Alolan Persian (Dittobase lists only the ones
    # caught directly). The game's own evolution data, form by form.
    by_fid = {}
    for e in entries:
        by_fid[e['_fid']] = e
        if e['form'] is None:
            by_fid.setdefault(e['_fid'] + '_NORMAL', e)
    added, changed = [], True
    while changed:
        changed = False
        for e in entries:
            if not e.get('shadow'):
                continue
            for f in e['_evos']:
                t = by_fid.get(f)
                if t and t['released'] and not t.get('shadow'):
                    t['shadow'] = True
                    added.append(t['id'])
                    changed = True
    if added:
        print(f'shadow by evolving: {len(added)} more ({", ".join(sorted(added, key=lambda i: (int(i.split("-")[0]), i)))})')

    # second opinion on what's out and which shinies are out
    plain = {}
    for r in ditto:
        if not any(r.get(f) for f in DITTO_FLAGS) and not r.get('isCostume') and not r.get('isMega'):
            for i in ditto_ids(r, by_slug, ids):
                plain[i] = r
    out_diff = sorted(i for i, r in plain.items() if bool(r.get('isReleased')) != byid[i]['released'])
    shiny_diff = sorted(i for i, r in plain.items() if byid[i]['released'] and bool(r.get('isShinyReleased')) != bool(byid[i].get('shiny')))
    for i in out_diff:   # either source is enough, as above
        if plain[i].get('isReleased'):
            byid[i]['released'] = True
    for i in shiny_diff:
        if plain[i].get('isShinyReleased') and not byid[i].get('shiny'):
            byid[i]['shiny'] = True
    if out_diff:
        print(f'Out in GO, Dittobase disagrees ({len(out_diff)}):', ', '.join(f'{i} (Dittobase: {"out" if plain[i]["isReleased"] else "not out"})' for i in out_diff))
    if shiny_diff:
        print(f'Shiny out, Dittobase disagrees ({len(shiny_diff)}):', ', '.join(f'{i} (Dittobase: {"yes" if plain[i]["isShinyReleased"] else "no"})' for i in shiny_diff))

    # Shiny Shadow, a bonus box (her ask, 10 Nov), like a costume: not counted. Since 3 March 2026 (season Memories in
    # Motion) every Shadow Pokémon whose shiny is out can be shiny (Serebii 24 Feb 2026, Bulbapedia), so it's simply both.
    # (Dittobase's own shiny-shadow flags were older and left out about 140.)
    for e in entries:
        if e.get('shadow') and e.get('shiny'):
            e['shadowShiny'] = True
    print(f'shiny shadow: {sum(1 for e in entries if e.get("shadowShiny"))} entries')
    # a gender the game files keep as a form (Meowstic, Indeedee, Pyroar, Frillish, Jellicent, Oinkologne) is a gender
    # difference like Pikachu's (her point, 9 Nov): one entry with both genders and a female picture
    merged = {}
    for n in sorted({e['dex'] for e in entries if e['form'] in ('Female', 'Male')}):
        same = [e for e in entries if e['dex'] == n]
        fem = next((e for e in same if e['form'] == 'Female'), None)
        base = next((e for e in same if e['form'] is None), None) or next((e for e in same if e['form'] == 'Male'), None)
        if not fem or not base:
            continue
        base.update(id=str(n), form=None, gender='both', femaleImg=fem['img'], released=base['released'] or fem['released'])
        if fem.get('shiny') and not base.get('shiny'):
            base['shiny'] = fem['shiny']
        for flag in ('shadow', 'dynamax', 'gmax'):
            if fem.get(flag):
                base[flag] = True
        entries.remove(fem)
        merged[id(fem)] = base
        if fem.get('desc') and fem['desc'] != base.get('desc'):
            base['femaleDesc'] = fem['desc']   # the game has a female Pokédex text of its own (Oinkologne)
        print(f'genders as forms merged: #{n} {base["name"]}')

    for e in entries:
        e.pop('_fid', None)
        e.pop('_evos', None)
        e.pop('_sid', None)
    entries.sort(key=lambda e: (e['dex'], e['form'] is not None, e['form'] or ''))
    costumes.sort(key=lambda c: (c['dex'], c['code']))
    seen = set()
    for e in entries + costumes:   # ids must be unique: the collection is saved by them
        while e['id'] in seen:
            e['id'] += '-2'
        seen.add(e['id'])
    # evolutions point at entry ids (once the ids are final)
    lost = []
    for e in entries:
        for st in e.get('evo', []):
            t = by_fid.get(st['_to']) or by_fid.get(st['_to'] + '_NORMAL')
            t = merged.get(id(t), t)
            if not t:
                lost.append(f"{e['id']}->{st['_to']}")
            st['to'] = t['id'] if t else None
            del st['_to']
        if 'evo' in e:
            e['evo'] = [st for st in e['evo'] if st['to']]
            if not e['evo']:
                del e['evo']
    if lost:
        print(f'{len(lost)} evolutions to something with no entry:', ', '.join(lost[:20]))
    pics = {k: files.get(k) for e in entries + costumes for k in (e['img'], e['img'] + '.s', e.get('femaleImg'), (e.get('femaleImg') or '') + '.s') if k and k != '.s'}
    pics.update({k: files.get(k) for e in entries for m in e.get('mega') or [] for k in (m['img'], m['img'] + '.s')})   # the Mega pictures
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
