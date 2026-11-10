"""Copy the game's own location-card pictures (the event backgrounds) into site/backgrounds/<event id>.webp.

    python -X utf8 tools/fetch_backgrounds.py

The pictures are the game's files in PokeMiners' pogo_assets (Images/LocationCards/lc_*.png). CARDS below says which
card belongs to which event in data/events.json (matched by hand, 10 Nov 2026); an event with two cards (Mega Evolution
Paris) lists both. Each is shrunk to 480 px wide, nothing else changed. Then run tools/build.py.
"""
import io, json, os, sys, urllib.error, urllib.parse, urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'site', 'backgrounds')
RAW = 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/LocationCards/'
UA = {'User-Agent': "Jemma's Pokedex (private)"}
WIDTH = 480
NT = {'anglesey-abbey': 'angleseyAbbey', 'attingham-park': 'attinghampark', 'belton-house': 'beltonHouse', 'calke-abbey': 'calkeAbbey', 'chirk': 'chirk',
      'cliveden': 'cliveden', 'clumber-park': 'clumberPark', 'dunham-massey': 'dunhamMassey', 'fountains-abbey-estate': 'fountainsAbbeyEstate',
      'gibside': 'gibslide', 'hanbury': 'hanbury', 'hardwick': 'hardwick', 'killerton': 'killerton', 'kingston-lacy': 'kingstonLacy', 'lacock': 'lacock',
      'lyme-park': 'lymePark', 'mottisfont': 'mottisfont', 'mount-stewart': 'mountStewart', 'nymans': 'nymans', 'polesden': 'polesden',
      'scotney-castle': 'scotneyCastle', 'stourhead': 'stourhead', 'stowe-garden-park': 'stoweGardenPark', 'tredegar-house': 'tredegarHouse',
      'trelissick': 'trelissick', 'tyntesfield': 'tyntesfield', 'wimpole': 'whimpole'}
CARDS = {
    'night-out-2026-london': ['lc_nightOut2026_London'],
    'esa-2026-science-museum-london': ['lc_ESA_scienceMuseumLondon'],
    'esa-2026-cite-de-lespace-toulouse': ['lc_ESA_citeDeEspace'],
    'esa-2026-deutsches-museum-nuremberg': ['lc_ESA_spaceCenterGermany'],
    'esa-2026-museu-de-les-ciencies-valencia': ['lc_ESA_ciudadDeLasArtes'],
    'esa-2026-space-expo-noordwijk': ['lc_ESA_spaceExpoNL'],
    'esa-2026-euro-space-center-transinne': ['lc_ESA_euroSpaceCenter'],
    'sdcc-malaga-2026': ['lc_2026_ComicCon_Malaga'],
    'city-safari-2026-lisbon': ['lc_CitySafari2026_lisbon'],
    'city-safari-2026-marseille': ['lc_CitySafari2026_marseille'],
    'city-safari-2026-munich': ['lc_CitySafari2026_munich'],
    **{f'national-trust-2026-{k}': [f'lc_nationalTrust_{v}'] for k, v in NT.items()},
    'go-fest-2026-copenhagen': ['lc_GoFest2026_copenhagen'],
    'carnival-flamigo-2026-cologne': ['lc_carnivalFlamigo_cologne_2026'],
    'city-safari-2025-amsterdam': ['lc_CitySafari2025_amsterdam'],
    'city-safari-2025-valencia': ['lc_CitySafari2025_valencia'],
    'mega-evolution-paris-2025': ['lc_Paris2025_01', 'lc_Paris2025_02'],
    'road-trip-2025-cologne': ['lc_roadtrip2025_cologne'],
    'road-trip-2025-the-hague': ['lc_roadtrip2025_hague'],
    'road-trip-2025-berlin': ['lc_roadtrip2025_berlin'],
    'road-trip-2025-valencia': ['lc_roadtrip2025_valencia'],
    'road-trip-2025-paris': ['lc_roadtrip2025_paris'],
    'road-trip-2025-london': ['lc_roadtrip2025_london'],
    'road-trip-2025-manchester': ['lc_roadtrip2025_manchester'],
    'go-fest-2025-paris': ['lc_GoFest2025_paris'],
    'city-safari-2025-milan': ['lc_CitySafari2024_milan'],
    'go-fest-2024-madrid': ['lc_GoFest2024_madrid'],
    'city-safari-2023-barcelona': ['lc_CitySafari2023_barcelona_2023'],
    'go-fest-2023-london': ['lc_GoFest2023_london'],
    'lego-collab-2026-uk-poland': ['sb_lego_2026'],
}


def main():
    os.makedirs(OUT, exist_ok=True)
    events = json.load(open(os.path.join(ROOT, 'data', 'events.json'), encoding='utf-8'))
    events = events['events'] if isinstance(events, dict) else events
    # special backgrounds (data/special-backgrounds.json): their own card from the game files, where there is one
    special = json.load(open(os.path.join(ROOT, 'data', 'special-backgrounds.json'), encoding='utf-8'))['special']
    CARDS.update({x['id']: [x['card']] for x in special if x.get('card') and not x.get('picture')})
    # special backgrounds: Serebii's full picture (the game files only have the base layer of some, e.g. no Mega logo,
    # and nothing for others; 10 Nov). Fetched again whenever the picture name changes (kept in a small note file).
    for x in special:
        if x.get('picture'):
            dest = os.path.join(OUT, x['id'] + '.webp'); note = dest + '.src'
            if os.path.exists(dest) and os.path.exists(note) and open(note).read() == x['picture']:
                continue
            try:
                im = None
                for size in ('', 'th/'):   # the full picture, or Serebii's smaller one where there's no full one (GO Fest 2025 Zacian)
                    try:
                        url = 'https://www.serebii.net/pokemongo/locationcard/' + size + x['picture'] + '.jpg'
                        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (private Pokedex)'}), timeout=60) as r:
                            im = Image.open(io.BytesIO(r.read())).convert('RGB')
                        break
                    except urllib.error.HTTPError:
                        continue
                if im is None:
                    raise RuntimeError('no picture on Serebii')
                if im.width > WIDTH:
                    im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
                im.save(dest, 'WEBP', quality=86, method=6)
                open(note, 'w').write(x['picture'])
            except Exception as e:
                print('failed', x['id'], e)
    with_bg = {e['id'] for e in events if e.get('background')} | {x['id'] for x in special if x.get('card') and not x.get('picture')}
    print('events with a background but no card here:', sorted(with_bg - set(CARDS)) or 'none')
    print('cards for events not in events.json:', sorted(set(CARDS) - {e['id'] for e in events} - {x['id'] for x in special}) or 'none')
    failed = []
    for eid, cards in CARDS.items():
        for i, card in enumerate(cards):
            dest = os.path.join(OUT, f'{eid}{"-" + str(i + 1) if i else ""}.webp')
            if os.path.exists(dest):
                continue
            try:
                with urllib.request.urlopen(urllib.request.Request(RAW + urllib.parse.quote(card + '.png'), headers=UA), timeout=60) as r:
                    im = Image.open(io.BytesIO(r.read())).convert('RGB')
                if im.width > WIDTH:
                    im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
                im.save(dest, 'WEBP', quality=86, method=6)
            except Exception as e:
                failed.append(f'{eid} {card}: {e}')
    print(len([f for f in os.listdir(OUT) if f.endswith('.webp')]), 'pictures;', len(failed), 'failed', failed[:5])
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
