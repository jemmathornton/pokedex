# The Windows task "Jemma's Pokedex - weekly backup": every Sunday at 09:40 runs tools/backup.py (no window).
# If the laptop is off then, it runs the next time it's on. Run again to change it; delete it in Task Scheduler to stop.
# Run:  powershell -ExecutionPolicy Bypass -File tools\make_backup_task.ps1

$root    = Split-Path -Parent $PSScriptRoot
$pythonw = "$env:LOCALAPPDATA\Programs\Python\Python313\pythonw.exe"
$action  = New-ScheduledTaskAction -Execute $pythonw -Argument "`"$(Join-Path $root 'tools\backup.py')`"" -WorkingDirectory $root
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 9:40am
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 30)
Register-ScheduledTask -TaskName "Jemma's Pokedex - weekly backup" -Action $action -Trigger $trigger -Settings $settings `
    -Description "Refreshes What's on, saves Jemma's Pokedex to git and pushes it to GitHub." -Force | Out-Null
"Made the task: every Sunday 09:40"
