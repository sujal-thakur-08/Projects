# setup-env.ps1 — helper to check Node/npm and show install/run commands

Write-Host "Checking for Node.js and npm..."
$node = Get-Command node -ErrorAction SilentlyContinue
$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "Node.js not found. Install Node.js (v18+) via one of the following:"
    Write-Host "  1) https://nodejs.org/"
    Write-Host "  2) winget: winget install OpenJS.NodeJS.LTS"
    Write-Host "  3) choco: choco install nodejs-lts"
}
else {
    Write-Host "Node found: $($node.Path)"
}
if (-not $npm) {
    Write-Host "npm not found. It is usually bundled with Node.js."
}

Write-Host "When Node/npm are installed, run these commands to start the app:"
Write-Host ""
Write-Host "    cd \"$(Split-Path -Path $PSScriptRoot -Leaf)\""
Write-Host "    npm install"
Write-Host "    npm start"

Write-Host ""
Write-Host "If you want me to try `npm install` here, tell me and I'll attempt it (may fail if npm isn't available in this environment)."
