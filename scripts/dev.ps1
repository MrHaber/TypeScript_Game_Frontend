param(
  [switch] $SmokeTest
)

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$BackendDir = Join-Path $Root "backend"
$LogDir = Join-Path $Root "logs"
$NodeDir = "C:\Program Files\nodejs"

if (Test-Path -LiteralPath $NodeDir) {
  $env:Path = "$NodeDir;$env:Path"
}

if (-not (Test-Path -LiteralPath $LogDir)) {
  New-Item -ItemType Directory -Path $LogDir | Out-Null
}

$BackendOut = Join-Path $LogDir "backend.out.log"
$BackendErr = Join-Path $LogDir "backend.err.log"
$FrontendOut = Join-Path $LogDir "frontend.out.log"
$FrontendErr = Join-Path $LogDir "frontend.err.log"

function Stop-DevProcess {
  param(
    [System.Diagnostics.Process] $Process,
    [string] $Name
  )

  if ($null -ne $Process -and -not $Process.HasExited) {
    Write-Host "Stopping $Name..."
    Stop-Process -Id $Process.Id -Force -ErrorAction SilentlyContinue
  }
}

function Test-PortOpen {
  param([int] $Port)

  $Client = New-Object System.Net.Sockets.TcpClient
  try {
    $Async = $Client.BeginConnect("127.0.0.1", $Port, $null, $null)
    $Open = $Async.AsyncWaitHandle.WaitOne(250, $false)
    if ($Open) {
      $Client.EndConnect($Async)
    }
    return $Open
  }
  catch {
    return $false
  }
  finally {
    $Client.Close()
  }
}

if (Test-PortOpen -Port 8000) {
  Write-Host "Backend already responds on http://127.0.0.1:8000"
  $Backend = $null
}
else {
  Write-Host "Starting backend on http://127.0.0.1:8000"
  $Backend = Start-Process `
    -FilePath "python" `
    -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000") `
    -WorkingDirectory $BackendDir `
    -RedirectStandardOutput $BackendOut `
    -RedirectStandardError $BackendErr `
    -PassThru
}

if (Test-PortOpen -Port 5173) {
  Write-Host "Frontend already responds on http://127.0.0.1:5173"
  $Frontend = $null
}
else {
  Write-Host "Starting frontend on http://127.0.0.1:5173"
  $Frontend = Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList @("run", "dev:frontend", "--", "--host", "127.0.0.1") `
    -WorkingDirectory $Root `
    -RedirectStandardOutput $FrontendOut `
    -RedirectStandardError $FrontendErr `
    -PassThru
}

Write-Host ""
Write-Host "Full dev stack is starting."
Write-Host "Frontend: http://127.0.0.1:5173/"
Write-Host "Backend:  http://127.0.0.1:8000/api/health"
Write-Host "Docs:     http://127.0.0.1:8000/docs"
Write-Host ""
Write-Host "Logs:"
Write-Host "  $FrontendOut"
Write-Host "  $FrontendErr"
Write-Host "  $BackendOut"
Write-Host "  $BackendErr"
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers."

try {
  if ($SmokeTest) {
    Start-Sleep -Seconds 3
    Write-Host "Smoke test finished."
    return
  }

  while ($true) {
    if ($null -ne $Backend -and $Backend.HasExited) {
      Write-Host "Backend stopped. Check $BackendErr"
      break
    }
    if ($null -ne $Frontend -and $Frontend.HasExited) {
      Write-Host "Frontend stopped. Check $FrontendErr"
      break
    }
    Start-Sleep -Seconds 1
  }
}
finally {
  Stop-DevProcess -Process $Frontend -Name "frontend"
  Stop-DevProcess -Process $Backend -Name "backend"
}
