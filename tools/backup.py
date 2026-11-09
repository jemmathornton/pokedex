"""Weekly backup of Jemma's Pokédex (as for Jemma's Library).

    pythonw tools/backup.py

1. Saves any changes in the project to git (her ticks since the last save, new data).
2. Zips the whole Pokédex (everything but git's own folder; the pictures included) to Documents\\PokedexBackups\\Pokedex backup <date>.zip,
   like the Sims site's backups, and keeps the newest 8.
Run every Sunday by the Windows task "Jemma's Pokedex - weekly backup" (tools/make_backup_task.ps1); log in logs/backup.log.
"""
import os, subprocess, sys, zipfile
from datetime import date, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(os.path.expanduser('~'), 'Documents', 'PokedexBackups')
KEEP = 8
LOG = os.path.join(ROOT, 'logs', 'backup.log')
NO_WINDOW = getattr(subprocess, 'CREATE_NO_WINDOW', 0)


def log(msg):
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    with open(LOG, 'a', encoding='utf-8') as fh:
        fh.write(f'{datetime.now():%Y-%m-%d %H:%M} {msg}\n')


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True, creationflags=NO_WINDOW)


def main():
    try:   # on its own: if git can't run (not found, the repo busy), the zip still happens
        if git('status', '--porcelain').stdout.strip():
            git('add', '-A')
            r = git('commit', '-q', '-m', f'Weekly backup {date.today().isoformat()}: changes since the last save')
            log('git: saved changes' if r.returncode == 0 else 'git: ' + (r.stderr or r.stdout).strip())
    except Exception as e:
        log(f'git failed: {e}')
    out = os.path.join(DEST, f'Pokedex backup {date.today().isoformat()}.zip')
    part = out + '.part'   # renamed once finished, so a broken zip is never kept as a backup
    try:
        os.makedirs(DEST, exist_ok=True)
        n = 0
        with zipfile.ZipFile(part, 'w', zipfile.ZIP_DEFLATED) as z:
            for here, dirs, files in os.walk(ROOT):
                dirs[:] = [d for d in dirs if d not in ('.git', '__pycache__', 'logs', 'imports')]   # imports: raw downloads, fetched again by import_go.py
                for f in files:
                    if f.endswith('.lnk'):
                        continue
                    p = os.path.join(here, f)
                    z.write(p, os.path.join('Pokedex', os.path.relpath(p, ROOT)))
                    n += 1
        with zipfile.ZipFile(part) as z:
            bad = z.testzip()
        if bad:
            raise RuntimeError(f'the zip came out broken ({bad})')
        os.replace(part, out)
        old = sorted(f for f in os.listdir(DEST) if f.startswith('Pokedex backup ') and f.endswith('.zip'))
        for f in old[:-KEEP]:
            os.remove(os.path.join(DEST, f))
        log(f'zipped {n} files to {out} ({os.path.getsize(out) / 1e6:.1f} MB); {min(len(old), KEEP)} backups kept')
    except Exception as e:
        log(f'failed: {e}')
        if os.path.exists(part):
            os.remove(part)
        sys.exit(1)


if __name__ == '__main__':
    main()
