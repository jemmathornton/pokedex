"""Upcoming Pokémon GO events for the Coming up page (her ask, 16 Nov: what's coming and what she needs to hunt there).

    python -X utf8 tools/import_events.py           (writes data/go/upcoming.json, then run tools/build.py)

From ScrapedDuck (github.com/bigfoott/ScrapedDuck), an open copy of Leek Duck's events: every event from today to six weeks
ahead, word for word, with the Pokémon ScrapedDuck lists for it (Community Day spawns, Spotlight Hour Pokémon, raid
bosses, each with whether it can be shiny). Leek Duck's own pages refuse automatic reading, so they aren't read: for
other events the app only names the Pokémon in the event's title ("Dynamax Espurr during Max Monday") and links to Leek
Duck. Battle League rounds, the season and cancelled events are left out. A raw copy goes to imports/events-<date>/.
Which of her backgrounds an event brings back is by hand, in data/go/upcoming-backgrounds.json.
"""
import json, os, re, urllib.request
from datetime import date, datetime, timedelta

ROOT = os.environ.get('POKEDEX_ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'data', 'go', 'upcoming.json')
FEED = 'https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.min.json'
SKIP = {'go-battle-league', 'season'}
AHEAD = 42   # days


def when(s):
    return datetime.fromisoformat(s.replace('Z', '+00:00')).replace(tzinfo=None) if s else None


def key(img):
    """The game's picture name from Leek Duck's picture: pm354.fMEGA, or pokemon_icon_386_12 (dex 386, form 12)."""
    m = re.search(r'/(pm\d+[^/]*?)(?:\.s)?\.icon\.png', img or '') or re.search(r'pokemon_icon_(\d+_\d+)', img or '')
    return m.group(1) if m else None


def mons(xd):
    """[{name, key, shiny}] that ScrapedDuck lists for the event."""
    out = []
    for m in (xd.get('spotlight') or {}).get('list') or []:
        out.append({'name': m['name'], 'key': key(m.get('image')), 'shiny': bool(m.get('canBeShiny'))})
    for m in (xd.get('communityday') or {}).get('spawns') or []:
        out.append({'name': m['name'], 'key': key(m.get('image')), 'shiny': True})   # Community Day Pokémon can always be shiny
    for m in (xd.get('raidbattles') or {}).get('bosses') or []:
        out.append({'name': m['name'], 'key': key(m.get('image')), 'shiny': bool(m.get('canBeShiny'))})
    return out


def resolve(evname, ms, dex):
    """Each Pokémon matched to an entry of ours, with what it comes as there (Mega, Shadow, Dynamax, Gigantamax). Where
    ScrapedDuck lists none, the Pokémon named in the event's title ("Dynamax Espurr during Max Monday", "Clefable Super
    Mega Raid Day"); Eternamax Eternatus can't be caught, so it's left out."""
    byname = {}
    for e in dex:
        byname.setdefault(e['name'].lower(), []).append(e)
    if not ms:
        words = re.sub(r'\(.*?\)', '', evname)
        for n in sorted(byname, key=len, reverse=True):
            if re.search(rf'(?<![\w-]){re.escape(n)}(?![\w-])', words.lower()) and not re.search(rf'eternamax {re.escape(n)}', words.lower()):
                ms.append({'name': n.title() if n.islower() else n, 'key': None, 'shiny': None})
                words = re.sub(re.escape(n), '', words, flags=re.I)
    low = evname.lower()
    for m in ms:
        base = re.sub(r'^(mega|shadow|dynamax|gigantamax)\s+', '', m['name'], flags=re.I)
        form = (re.search(r'\((.*?)\)', base) or [None, None])[1]
        base = re.sub(r'\s*\(.*?\)', '', base).strip().lower()
        es = byname.get(base) or []
        e = next((x for x in es if form and x.get('form') and x['form'].lower().startswith(form.lower().replace(' forme', '').replace(' form', ''))), None) \
            or next((x for x in es if not x.get('form')), None) or next((x for x in es if x.get('default')), None) \
            or next((x for x in es if x.get('released')), None) or (es[0] if es else None)
        m['id'] = e['id'] if e else None
        m['as'] = [a for a, hit in (('mega', m['name'].lower().startswith('mega ') or 'mega raid day' in low),
                                    ('shadow', m['name'].lower().startswith('shadow ') or 'shadow raid' in low),
                                    ('dynamax', m['name'].lower().startswith('dynamax ') or 'max monday' in low or 'dynamax ' + base in low),
                                    ('gmax', m['name'].lower().startswith('gigantamax ') or 'gigantamax ' + base in low)) if hit]
    return [m for m in ms if m['id']]


def main():
    today = datetime.now()
    dex = json.load(open(os.path.join(ROOT, 'data', 'go', 'dex.json'), encoding='utf-8'))['entries']
    with urllib.request.urlopen(FEED, timeout=60) as r:
        feed = json.loads(r.read().decode('utf-8'))
    raw = os.path.join(ROOT, 'imports', f'events-{date.today().isoformat()}')
    os.makedirs(raw, exist_ok=True)
    open(os.path.join(raw, 'scrapedduck-events.json'), 'w', encoding='utf-8').write(json.dumps(feed, ensure_ascii=False, indent=1))
    events = []
    for ev in feed:
        start, end = when(ev.get('start')), when(ev.get('end'))
        if ev.get('eventType') in SKIP or ev['name'].startswith('[Canceled]') or not end or end < today or (start and start > today + timedelta(days=AHEAD)):
            continue
        ms = resolve(ev['name'], mons(ev.get('extraData') or {}), dex)
        events.append({'id': ev['eventID'], 'name': ev['name'], 'type': ev.get('heading') or ev.get('eventType'), 'kind': ev.get('eventType'),
                       'start': ev.get('start'), 'end': ev.get('end'), 'link': ev['link'], 'mons': ms})
        print(f'{(ev.get("start") or "")[:10]}  {ev["name"]}: {len(ms)} Pokémon listed')
    events.sort(key=lambda e: e['start'] or '')
    with open(OUT, 'w', encoding='utf-8', newline='\n') as fh:
        json.dump({'fetched': date.today().isoformat(), 'source': 'Leek Duck (leekduck.com/events), via ScrapedDuck', 'events': events}, fh, ensure_ascii=False, indent=1)
        fh.write('\n')
    print(f'Written data/go/upcoming.json: {len(events)} events. Now run tools/build.py.')


if __name__ == '__main__':
    main()
