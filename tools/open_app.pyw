"""Open Jemma's Pokédex as an app window: what the "Jemma’s Pokédex" shortcuts run (no console window).

1. If the Pokédex server (tools/serve.py, http://localhost:8030) isn't running, start it on its own, so it keeps going
   after this has finished, and wait for it to answer.
2. Open http://localhost:8030 in its own Chrome window (no tabs or address bar), with its own Chrome profile in
   %LOCALAPPDATA%\\Jemmas Pokedex\\Chrome, so Windows gives it its own taskbar button, apart from her other apps.

Used instead of a server in her Startup folder (9 Nov: Windows' safety check stopped Claude making one). If she
later adds the Startup server, this still works: it just finds the server already running.
"""
import os, socket, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8030
URL = f'http://localhost:{PORT}/'
PROFILE = os.path.join(os.environ.get('LOCALAPPDATA', os.path.expanduser('~')), 'Jemmas Pokedex', 'Chrome')
CHROMES = [os.path.join(os.environ.get(v, ''), *p) for v, p in (
    ('ProgramFiles', ('Google', 'Chrome', 'Application', 'chrome.exe')),
    ('ProgramFiles(x86)', ('Google', 'Chrome', 'Application', 'chrome.exe')),
    ('LOCALAPPDATA', ('Google', 'Chrome', 'Application', 'chrome.exe')),
    ('ProgramFiles(x86)', ('Microsoft', 'Edge', 'Application', 'msedge.exe')),
    ('ProgramFiles', ('Microsoft', 'Edge', 'Application', 'msedge.exe')))]


def answering():
    try:
        with socket.create_connection(('127.0.0.1', PORT), timeout=.5):
            return True
    except OSError:
        return False


def main():
    if not answering():
        pythonw = os.path.join(os.path.dirname(sys.executable), 'pythonw.exe')
        flags = 0x00000008 | 0x00000200 | 0x08000000   # detached, its own process group, no window
        subprocess.Popen([pythonw, os.path.join(ROOT, 'tools', 'serve.py')], cwd=ROOT, creationflags=flags, close_fds=True,
                         stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(50):
            if answering():
                break
            time.sleep(.1)
    browser = next((c for c in CHROMES if os.path.exists(c)), None)
    if not browser:
        import webbrowser
        return webbrowser.open(URL)
    subprocess.Popen([browser, f'--user-data-dir={PROFILE}', '--no-first-run', '--no-default-browser-check', f'--app={URL}'],
                     close_fds=True)


if __name__ == '__main__':
    main()
