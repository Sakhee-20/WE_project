# Starts local mysqld using the bundled MySQL install and project mysql-local-data.
# Run after reboot if nothing is listening on 127.0.0.1:3306.
$ErrorActionPreference = "Stop"
$basedir = "C:\PROGRA~1\MySQL\MYSQLS~1.4"
$mysqld = Join-Path $basedir "bin\mysqld.exe"
$projectRoot = Split-Path $PSScriptRoot -Parent
$datadir = Join-Path $projectRoot "mysql-local-data"
if (-not (Test-Path $datadir)) {
  Write-Error "mysql-local-data not found at $datadir. Initialize once with: mysqld --initialize-insecure --datadir=<path>"
  exit 1
}
$listen = netstat -an 2>$null | Select-String "127.0.0.1:3306.*LISTENING"
if ($listen) {
  Write-Host "MySQL already listening on 127.0.0.1:3306"
  exit 0
}
$arg = "--basedir=$basedir --datadir=$datadir --port=3306 --bind-address=127.0.0.1"
Start-Process -FilePath $mysqld -ArgumentList $arg -WindowStyle Hidden
Start-Sleep -Seconds 3
$listen2 = netstat -an 2>$null | Select-String "127.0.0.1:3306.*LISTENING"
if (-not $listen2) {
  Write-Error "mysqld did not open 127.0.0.1:3306. Check $datadir\*.err"
  exit 1
}
Write-Host "mysqld started (127.0.0.1:3306)"
