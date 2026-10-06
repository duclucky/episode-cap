$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
  $env:PYTHONUTF8 = '1'
  & .venv/Scripts/python.exe scripts/genvm_lint_rc.py check contracts/episode_cap.py
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  & .venv/Scripts/gltest.exe tests/ -q --tb=short
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  & node --test tests/deployment/*.test.mjs
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  foreach ($file in Get-ChildItem scripts -Filter *.mjs) {
    & node --check $file.FullName
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }
  Write-Host 'CHECK PASS: contract lint, direct tests, metadata, receipt parsers, script syntax'
} finally { Pop-Location }
