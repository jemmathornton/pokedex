# Shortcuts that open Jemma's Pokédex in its own app window (no tabs or address bar), like her other apps.
# Run:  powershell -ExecutionPolicy Bypass -File tools\make_shortcuts.ps1                (Desktop, Start menu, project folder)
#       powershell -ExecutionPolicy Bypass -File tools\make_shortcuts.ps1 -ProjectOnly   (only the one in the project folder)
#       powershell -ExecutionPolicy Bypass -File tools\make_shortcuts.ps1 -Startup       (also starts the server at login)
# - "Jemma's Pokédex" on the Desktop, in the Start menu and in the project folder runs Jemma's Journals'
#   tools/open_site.pyw pokedex (since 22 Nov, her choice: the Pokédex loads the family's shared code from Jemma's Journals,
#   so it opens through the family server, http://localhost:8050/pokedex/, which starts this app's own save server,
#   tools/serve.py on 8030). It opens the app window in its own Chrome profile, so Windows gives it its own taskbar button.
# - With -Startup only: "Jemma's Pokedex server" in her Startup folder, as for the Library (not made on 9 Nov: Windows'
#   safety check stopped Claude, and the shortcuts start the server anyway).
# Delete them any time.
param([switch]$Startup, [switch]$ProjectOnly)

$root       = Split-Path -Parent $PSScriptRoot
$family     = Split-Path -Parent $root   # Jemma's Journals, the parent: this folder is its submodule
$openSite   = Join-Path $family 'tools\open_site.pyw'
if (-not (Test-Path $openSite)) { throw "Jemma's Journals' tools\open_site.pyw not found at $openSite" }
$pythonw    = "$env:LOCALAPPDATA\Programs\Python\Python313\pythonw.exe"
$profileDir = Join-Path $env:LOCALAPPDATA "Jemmas Pokedex\Chrome"
$icon       = Join-Path $root 'site\app-v1.ico'   # a new name for each new picture: Windows keeps old icons by file name
$name       = "Jemma" + [char]0x2019 + "s Pok" + [char]0x00E9 + "dex"   # curly apostrophe and é, whatever this file's encoding
$chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
            "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe") |
          Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not (Test-Path $pythonw)) { throw "pythonw.exe not found at $pythonw" }
if (-not $chrome) { throw 'Neither Chrome nor Edge was found.' }

$shell = New-Object -ComObject WScript.Shell
if ($Startup) {
    $startupLnk = Join-Path ([Environment]::GetFolderPath('Startup')) "Jemma's Pokedex server.lnk"
    $lnk = $shell.CreateShortcut($startupLnk)
    $lnk.TargetPath       = $pythonw
    $lnk.Arguments        = "`"$(Join-Path $root 'tools\serve.py')`""
    $lnk.WorkingDirectory = $root
    $lnk.IconLocation     = "$icon,0"
    $lnk.Description      = "Serves Jemma's Pokedex to its app window and saves her ticks (this computer only)"
    $lnk.Save()
    "Made $startupLnk"
}

# Windows knows the window by the app id Chrome gives it: "Chrome." + its address as Chrome writes it ("localhost_/") +
# "." + the profile. The shortcuts carry the same id, so Windows can use their sharp icon on the taskbar.
$appId = "Chrome.localhost_/.Chrome.Default"
Add-Type -TypeDefinition @'
using System; using System.Runtime.InteropServices;
public static class ShortcutAppId {
  [StructLayout(LayoutKind.Sequential, Pack = 4)] struct PROPERTYKEY { public Guid fmtid; public uint pid; }
  [StructLayout(LayoutKind.Explicit, Size = 24)] struct PROPVARIANT { [FieldOffset(0)] public ushort vt; [FieldOffset(8)] public IntPtr p; }
  [ComImport, Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IPropertyStore { [PreserveSig] int GetCount(out uint c); [PreserveSig] int GetAt(uint i, out PROPERTYKEY k);
    [PreserveSig] int GetValue(ref PROPERTYKEY k, out PROPVARIANT v); [PreserveSig] int SetValue(ref PROPERTYKEY k, ref PROPVARIANT v); [PreserveSig] int Commit(); }
  [ComImport, Guid("0000010b-0000-0000-C000-000000000046"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IPersistFile { void GetClassID(out Guid c); [PreserveSig] int IsDirty(); void Load([MarshalAs(UnmanagedType.LPWStr)] string f, uint mode);
    void Save([MarshalAs(UnmanagedType.LPWStr)] string f, bool remember); void SaveCompleted([MarshalAs(UnmanagedType.LPWStr)] string f); void GetCurFile(out IntPtr f); }
  public static void Set(string path, string id) {
    var link = Activator.CreateInstance(Type.GetTypeFromCLSID(new Guid("00021401-0000-0000-C000-000000000046")));
    ((IPersistFile)link).Load(path, 2);
    var key = new PROPERTYKEY { fmtid = new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"), pid = 5 };
    var v = new PROPVARIANT { vt = 31, p = Marshal.StringToCoTaskMemUni(id) };
    var st = (IPropertyStore)link;
    Marshal.ThrowExceptionForHR(st.SetValue(ref key, ref v)); Marshal.ThrowExceptionForHR(st.Commit());
    ((IPersistFile)link).Save(path, true);
    Marshal.FreeCoTaskMem(v.p);
  }
}
'@

$dirs = if ($ProjectOnly) { @($root) } else { @($root, [Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs')) }
foreach ($dir in $dirs) {
    $lnk = $shell.CreateShortcut((Join-Path $dir "$name.lnk"))
    $lnk.TargetPath       = $pythonw
    $lnk.Arguments        = "`"$openSite`" pokedex"
    $lnk.IconLocation     = "$icon,0"
    $lnk.WorkingDirectory = $family
    $lnk.Description      = $name
    $lnk.Save()
    [ShortcutAppId]::Set($lnk.FullName, $appId)
    "Made $($lnk.FullName)"
}
