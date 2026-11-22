"""Daily backup of Jemma's Pokédex (as for Jemma's Library).

    pythonw tools/backup.py

0. Refreshes What's on (her ask, 19 Nov: a check for new events; daily since 22 Nov): tools/import_events.py, then tools/build.py;
   the new events are listed in the log. Which background an event brings back is still added by hand (upcoming-backgrounds.json).
1. Saves any changes in the project to git (her ticks since the last save, new data), then pushes them to GitHub
   (jemmathornton/pokedex, her ask 19 Nov).
2. After a push that worked, records this version in Jemma's Journals, the parent (its tools/record_apps.py, if it is there;
   since 22 Nov). Its output goes in the log; if it fails, the backup has still happened.
No zips any more (her call, 19 Nov): GitHub has everything, every version, off this PC.
Run every day at 09:30 by Jemma's Journals' one backup job (the parent's tools/weekly.py, the Windows task "Jemma's Journals -
backup", 22 Nov; it catches up after the PC has been off). The old task "Jemma's Pokedex - weekly backup"
(tools/make_backup_task.ps1) is disabled. Log in logs/backup.log.
"""
import os, subprocess, sys
from datetime import date, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG = os.path.join(ROOT, 'logs', 'backup.log')
NO_WINDOW = getattr(subprocess, 'CREATE_NO_WINDOW', 0)


def log(msg):
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    with open(LOG, 'a', encoding='utf-8') as fh:
        fh.write(f'{datetime.now():%Y-%m-%d %H:%M} {msg}\n')


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True, creationflags=NO_WINDOW)


def refresh_events():
    """What's on: fetch the next six weeks of events again and rebuild the app. On its own: if it fails, the backup still happens."""
    env = dict(os.environ, PYTHONUTF8='1')
    up = os.path.join(ROOT, 'data', 'go', 'upcoming.json')

    def names():
        try:
            import json
            with open(up, encoding='utf-8') as fh:
                return {e['id']: e['name'] for e in json.load(fh)['events']}
        except Exception:
            return {}
    try:
        before = names()
        for script in ('import_events.py', 'build.py'):
            r = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', script)], cwd=ROOT, capture_output=True, text=True,
                               encoding='utf-8', errors='replace', env=env, creationflags=NO_WINDOW, timeout=600)
            if r.returncode:
                log(f'events: {script} failed: ' + (r.stderr or r.stdout).strip()[-600:])
                if script == 'import_events.py':
                    return
        # build.py still writes the app when it finds problems (19 Nov review), so the new events are listed either way
        new = [n for i, n in names().items() if i not in before]
        log('events: refreshed' + (f'; new: {"; ".join(new)} (check them for a Special Background by hand)' if new else '; nothing new'))
    except Exception as e:
        log(f'events: refresh failed: {e}')


def push():
    """Up to GitHub too (her ask, 19 Nov: jemmathornton/pokedex, everything, so it can run on another PC). Never asks
    anything (no window to answer in): if GitHub can't be reached or the sign-in has gone, it says so in the log, and the
    next week's push catches up. Signed in through the GitHub tool (gh), which git uses for github.com."""
    try:
        env = dict(os.environ, GIT_TERMINAL_PROMPT='0', GCM_INTERACTIVE='never')
        gh = 'C:/Program Files/GitHub CLI/gh.exe'   # sign in through the GitHub CLI, never Windows' sign-in window (her ask, 22 Nov)
        if os.path.exists(gh):   # git reads these as config: no helper from Windows, then the GitHub CLI's
            env.update(GIT_CONFIG_COUNT='2', GIT_CONFIG_KEY_0='credential.helper', GIT_CONFIG_VALUE_0='', GIT_CONFIG_KEY_1='credential.helper', GIT_CONFIG_VALUE_1=f"!'{gh}' auth git-credential")
        r = subprocess.run(['git', 'push', '-q', 'origin', 'HEAD'], cwd=ROOT, capture_output=True, text=True, encoding='utf-8',
                           errors='replace', env=env, creationflags=NO_WINDOW, timeout=900)
        log('github: pushed' if r.returncode == 0 else 'github: push failed: ' + (r.stderr or r.stdout).strip()[-400:])
        return r.returncode == 0
    except Exception as e:
        log(f'github: push failed: {e}')
        return False


def record_in_parent():
    """The parent (Jemma's Journals) points at a version of this app: record the one just pushed (her layout, 21 Nov; its
    tools/record_apps.py does it, for every app). Only if the parent is there; never fails the backup."""
    script = os.path.join(ROOT, '..', 'tools', 'record_apps.py')
    if not os.path.exists(script):
        return
    try:
        env = dict(os.environ, GIT_TERMINAL_PROMPT='0', GCM_INTERACTIVE='never', PYTHONUTF8='1')
        r = subprocess.run([sys.executable, script], cwd=os.path.dirname(os.path.dirname(os.path.abspath(script))), capture_output=True,
                           text=True, encoding='utf-8', errors='replace', env=env, creationflags=NO_WINDOW, timeout=900)
        out = ' '.join((r.stdout + ' ' + r.stderr).split())[-600:]
        log(('parent: recorded' if r.returncode == 0 else 'parent: record_apps.py failed') + (f': {out}' if out else ''))
    except Exception as e:
        log(f'parent: record_apps.py failed: {e}')


def main():
    refresh_events()
    try:   # on its own: if git can't run (not found, the repo busy), it's logged
        if git('status', '--porcelain').stdout.strip():
            git('add', '-A')
            r = git('commit', '-q', '-m', f'Weekly backup {date.today().isoformat()}: changes since the last save')
            log('git: saved changes' if r.returncode == 0 else 'git: ' + (r.stderr or r.stdout).strip())
    except Exception as e:
        log(f'git failed: {e}')
    if push():
        record_in_parent()


if __name__ == '__main__':
    main()
