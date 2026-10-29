# Creates a Desktop shortcut that launches the mini-player via run-player.bat
param(
    [string]$Name = 'Apple Music Mini'
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$target = Join-Path $scriptDir '..\run-player.bat'
$target = [System.IO.Path]::GetFullPath($target)

$desktop = [Environment]::GetFolderPath('Desktop')
$linkPath = Join-Path $desktop ($Name + '.lnk')

$w = New-Object -ComObject WScript.Shell
$s = $w.CreateShortcut($linkPath)
$s.TargetPath = $target
$s.WorkingDirectory = Split-Path $target -Parent
$icon = Join-Path (Split-Path $scriptDir -Parent) 'assets\icon.ico'
if (Test-Path $icon) { $s.IconLocation = $icon }
# open minimized
$s.WindowStyle = 7
$s.Save()

Write-Output "Created shortcut: $linkPath"
