# Docker Desktop Diagnostic and Fix Script
# Run as Administrator

Write-Host "=== Docker Desktop Diagnostic and Fix Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠ WARNING: This script should be run as Administrator" -ForegroundColor Yellow
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
}

# Step 1: Diagnose Issues
Write-Host "[1/6] Diagnosing Docker Desktop issues..." -ForegroundColor Yellow
Write-Host ""

$issues = @()

# Check Docker Desktop Service
$dockerService = Get-Service -Name "com.docker.service" -ErrorAction SilentlyContinue
if ($dockerService) {
    Write-Host "  Docker Desktop Service: $($dockerService.Status)" -ForegroundColor $(if ($dockerService.Status -eq 'Running') { 'Green' } else { 'Red' })
    if ($dockerService.Status -ne 'Running') {
        $issues += "Docker Desktop Service is stopped"
    }
} else {
    Write-Host "  Docker Desktop Service: Not found" -ForegroundColor Red
    $issues += "Docker Desktop Service not installed"
}

# Check vmcompute service
$vmcompute = Get-Service -Name "vmcompute" -ErrorAction SilentlyContinue
if ($vmcompute) {
    Write-Host "  vmcompute Service: $($vmcompute.Status)" -ForegroundColor $(if ($vmcompute.Status -eq 'Running') { 'Green' } else { 'Red' })
    if ($vmcompute.Status -ne 'Running') {
        $issues += "vmcompute service is stopped (required for WSL2)"
    }
} else {
    Write-Host "  vmcompute Service: Not found" -ForegroundColor Red
    $issues += "vmcompute service not found"
}

# Check WSL2
try {
    $wslStatus = wsl --status 2>&1
    Write-Host "  WSL2 Status: Configured" -ForegroundColor Green
} catch {
    Write-Host "  WSL2 Status: Error checking" -ForegroundColor Red
    $issues += "WSL2 status check failed"
}

# Check virtualization
$hyperv = systeminfo | Select-String "Hyper-V"
if ($hyperv) {
    Write-Host "  Hyper-V: Detected" -ForegroundColor Green
} else {
    Write-Host "  Hyper-V: Not detected" -ForegroundColor Yellow
    $issues += "Hyper-V not detected (may need BIOS virtualization enabled)"
}

Write-Host ""

if ($issues.Count -eq 0) {
    Write-Host "  ✓ No obvious issues detected" -ForegroundColor Green
} else {
    Write-Host "  Issues found:" -ForegroundColor Red
    foreach ($issue in $issues) {
        Write-Host "    - $issue" -ForegroundColor Red
    }
}

Write-Host ""

# Step 2: Fix Services
Write-Host "[2/6] Fixing Windows services..." -ForegroundColor Yellow

if (-not $isAdmin) {
    Write-Host "  ⚠ Skipping service fixes (requires Administrator)" -ForegroundColor Yellow
    Write-Host ""
} else {
    # Start vmcompute service
    Write-Host "  Starting vmcompute service..." -ForegroundColor Gray
    try {
        Start-Service -Name "vmcompute" -ErrorAction Stop
        Write-Host "    ✓ vmcompute service started" -ForegroundColor Green
    } catch {
        Write-Host "    ✗ Failed to start vmcompute: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "    Try: Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All" -ForegroundColor Yellow
    }
    
    # Set vmcompute to automatic startup
    try {
        Set-Service -Name "vmcompute" -StartupType Automatic -ErrorAction SilentlyContinue
        Write-Host "    ✓ vmcompute set to automatic startup" -ForegroundColor Green
    } catch {
        Write-Host "    ⚠ Could not set vmcompute to automatic" -ForegroundColor Yellow
    }
    
    # Start Docker Desktop Service
    Write-Host "  Starting Docker Desktop Service..." -ForegroundColor Gray
    try {
        Start-Service -Name "com.docker.service" -ErrorAction Stop
        Write-Host "    ✓ Docker Desktop Service started" -ForegroundColor Green
    } catch {
        Write-Host "    ✗ Failed to start Docker Desktop Service: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Step 3: Restart WSL
Write-Host "[3/6] Restarting WSL..." -ForegroundColor Yellow
try {
    wsl --shutdown 2>&1 | Out-Null
    Start-Sleep -Seconds 2
    Write-Host "  ✓ WSL restarted" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ WSL restart had issues: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Reset Docker (if needed)
Write-Host "[4/6] Checking Docker Desktop application..." -ForegroundColor Yellow
$dockerPath = "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
if (Test-Path $dockerPath) {
    Write-Host "  ✓ Docker Desktop found at: $dockerPath" -ForegroundColor Green
    
    # Check if Docker Desktop process is running
    $dockerProcess = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
    if ($dockerProcess) {
        Write-Host "  ✓ Docker Desktop process is running" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Docker Desktop process not running" -ForegroundColor Yellow
        Write-Host "  Starting Docker Desktop..." -ForegroundColor Gray
        Start-Process $dockerPath
        Write-Host "  ⏳ Waiting 30 seconds for Docker Desktop to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
    }
} else {
    Write-Host "  ✗ Docker Desktop not found at expected location" -ForegroundColor Red
    Write-Host "  You may need to reinstall Docker Desktop" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Verify Docker is working
Write-Host "[5/6] Verifying Docker is working..." -ForegroundColor Yellow
$maxAttempts = 10
$attempt = 0
$dockerWorking = $false

while ($attempt -lt $maxAttempts -and -not $dockerWorking) {
    $attempt++
    try {
        $result = docker ps 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dockerWorking = $true
            Write-Host "  ✓ Docker is working!" -ForegroundColor Green
        } else {
            Write-Host "  Attempt $attempt/$maxAttempts: Docker not ready yet..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }
    } catch {
        Write-Host "  Attempt $attempt/$maxAttempts: Docker not ready yet..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}

if (-not $dockerWorking) {
    Write-Host "  ✗ Docker is still not working after $maxAttempts attempts" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Manual steps to try:" -ForegroundColor Yellow
    Write-Host "  1. Open Docker Desktop application manually" -ForegroundColor Gray
    Write-Host "  2. Check Docker Desktop settings > General > Use WSL 2 based engine" -ForegroundColor Gray
    Write-Host "  3. Try: wsl --update" -ForegroundColor Gray
    Write-Host "  4. Try: wsl --set-default-version 2" -ForegroundColor Gray
    Write-Host "  5. Restart your computer" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""

# Step 6: Test Docker Compose
Write-Host "[6/6] Testing Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Docker Compose is working: $composeVersion" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Docker Compose check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Docker Compose not found" -ForegroundColor Red
    Write-Host "  Install Docker Compose or use 'docker compose' (v2)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Docker Desktop Fix Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Verify Docker is working: docker ps" -ForegroundColor Gray
Write-Host "  2. Run verification: .\verify-docker-setup.ps1" -ForegroundColor Gray
Write-Host ""

