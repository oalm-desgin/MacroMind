# Full MacroMind Docker Verification Script
# Tests all services and functionality end-to-end

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"
$global:testResults = @{}

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Message = ""
    )
    $status = if ($Passed) { "PASS" } else { "FAIL" }
    $color = if ($Passed) { "Green" } else { "Red" }
    Write-Host "[$status] $TestName" -ForegroundColor $color
    if ($Message) {
        Write-Host "  $Message" -ForegroundColor Gray
    }
    $global:testResults[$TestName] = @{
        Passed = $Passed
        Message = $Message
    }
}

Write-Host "=== MacroMind Full Verification ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Docker Status
Write-Host "[1/9] Checking Docker Status..." -ForegroundColor Yellow
try {
    $dockerCheck = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-TestResult -TestName "Docker Status" -Passed $true -Message "Docker is running"
    } else {
        Write-TestResult -TestName "Docker Status" -Passed $false -Message "Docker is not running: $dockerCheck"
        Write-Host "  Run .\fix-docker-desktop.ps1 as Administrator" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-TestResult -TestName "Docker Status" -Passed $false -Message "Docker check failed: $($_.Exception.Message)"
    exit 1
}
Write-Host ""

# Step 2: Clean Restart
Write-Host "[2/9] Performing clean restart..." -ForegroundColor Yellow
Write-Host "  Running: docker-compose down -v" -ForegroundColor Gray
try {
    docker-compose down -v 2>&1 | Out-Null
    Write-Host "  Running: docker-compose up --build -d" -ForegroundColor Gray
    docker-compose up --build -d
    if ($LASTEXITCODE -eq 0) {
        Write-TestResult -TestName "Docker Compose Build" -Passed $true -Message "Services building and starting"
    } else {
        Write-TestResult -TestName "Docker Compose Build" -Passed $false -Message "Build failed"
        exit 1
    }
} catch {
    Write-TestResult -TestName "Docker Compose Build" -Passed $false -Message "Build error: $($_.Exception.Message)"
    exit 1
}
Write-Host ""

# Step 3: Wait for Services
Write-Host "[3/9] Waiting for services to be ready (60 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 60
Write-Host ""

# Step 4: Check Service Status
Write-Host "[4/9] Checking service status..." -ForegroundColor Yellow
$services = @("postgres", "auth-service", "meal-planner-service", "nutrition-ai-service", "frontend")
$allRunning = $true

foreach ($service in $services) {
    try {
        $status = docker-compose ps $service --format json 2>&1 | ConvertFrom-Json
        if ($status.State -eq "running") {
            Write-Host "  [OK] $service is running" -ForegroundColor Green
        } else {
            Write-Host "  [FAIL] $service is not running (Status: $($status.State))" -ForegroundColor Red
            $allRunning = $false
        }
    } catch {
        # Try alternative method
        try {
            $statusText = docker-compose ps $service 2>&1
            if ($statusText -match "running") {
                Write-Host "  [OK] $service is running" -ForegroundColor Green
            } else {
                Write-Host "  [WARN] $service status unknown" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "  [FAIL] $service status check failed" -ForegroundColor Red
            $allRunning = $false
        }
    }
}

Write-TestResult -TestName "Service Status" -Passed $allRunning -Message "All services running: $allRunning"
Write-Host ""

# Step 5: Test Health Endpoints
Write-Host "[5/9] Testing health endpoints..." -ForegroundColor Yellow
$healthTests = @(
    @{Service="auth-service"; Port=8000; Name="Auth Service Health"},
    @{Service="meal-planner-service"; Port=8001; Name="Meal Planner Health"},
    @{Service="nutrition-ai-service"; Port=8002; Name="Nutrition AI Health"}
)

$allHealthy = $true
foreach ($test in $healthTests) {
    $maxRetries = 5
    $retry = 0
    $healthy = $false
    
    while ($retry -lt $maxRetries -and -not $healthy) {
        $retry++
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$($test.Port)/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $healthy = $true
                $healthData = $response.Content | ConvertFrom-Json
                Write-Host "  [OK] $($test.Service) health check passed" -ForegroundColor Green
                Write-Host "    Status: $($healthData.status), Database: $($healthData.database)" -ForegroundColor Gray
            }
        } catch {
            if ($retry -lt $maxRetries) {
                Write-Host "  Retry $retry/$maxRetries for $($test.Service)..." -ForegroundColor Yellow
                Start-Sleep -Seconds 5
            } else {
                Write-Host "  [FAIL] $($test.Service) health check failed: $($_.Exception.Message)" -ForegroundColor Red
                $allHealthy = $false
            }
        }
    }
}

Write-TestResult -TestName "Health Endpoints" -Passed $allHealthy -Message "All health checks passed: $allHealthy"
Write-Host ""

# Step 6: Test Database Connectivity
Write-Host "[6/9] Testing database connectivity..." -ForegroundColor Yellow
try {
    $dbCheck = docker-compose exec -T postgres pg_isready -U macromind 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-TestResult -TestName "Database Connectivity" -Passed $true -Message "PostgreSQL is ready"
    } else {
        Write-TestResult -TestName "Database Connectivity" -Passed $false -Message "PostgreSQL not ready: $dbCheck"
    }
} catch {
    Write-TestResult -TestName "Database Connectivity" -Passed $false -Message "Database check failed: $($_.Exception.Message)"
}
Write-Host ""

# Step 7: Test Registration
Write-Host "[7/9] Testing user registration..." -ForegroundColor Yellow
$testEmail = "test_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$registerBody = @{
    email = $testEmail
    password = "TestPassword123!"
    fitness_goal = "MAINTAIN"
    dietary_preference = "NONE"
    daily_calories = 2000
} | ConvertTo-Json

$registrationPassed = $false
$global:testToken = $null
$global:testUserId = $null

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/register" `
        -Method POST `
        -Body $registerBody `
        -ContentType "application/json" `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    if ($registerResponse.access_token) {
        $global:testToken = $registerResponse.access_token
        if ($registerResponse.user_id) {
            $global:testUserId = $registerResponse.user_id
        }
        $registrationPassed = $true
        Write-Host "  [OK] Registration successful" -ForegroundColor Green
        Write-Host "    Email: $testEmail" -ForegroundColor Gray
        $tokenPreview = if ($registerResponse.access_token.Length -gt 20) {
            $registerResponse.access_token.Substring(0, 20) + "..."
        } else {
            $registerResponse.access_token
        }
        Write-Host "    Token received: $tokenPreview" -ForegroundColor Gray
    } else {
        Write-Host "  [FAIL] Registration failed: No token returned" -ForegroundColor Red
    }
} catch {
    $errorMsg = $_.Exception.Message
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            $reader.Close()
            $errorMsg += " - $responseBody"
        } catch {
            $errorMsg += " - (Could not read response body)"
        }
    }
    Write-Host "  [FAIL] Registration failed: $errorMsg" -ForegroundColor Red
}

Write-TestResult -TestName "Registration" -Passed $registrationPassed -Message "User registration test"
Write-Host ""

# Step 8: Test Login
Write-Host "[8/9] Testing user login..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = "TestPassword123!"
} | ConvertTo-Json

$loginPassed = $false
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    if ($loginResponse.access_token) {
        $global:testToken = $loginResponse.access_token
        $loginPassed = $true
        Write-Host "  [OK] Login successful" -ForegroundColor Green
        $tokenPreview = if ($loginResponse.access_token.Length -gt 20) {
            $loginResponse.access_token.Substring(0, 20) + "..."
        } else {
            $loginResponse.access_token
        }
        Write-Host "    Token received: $tokenPreview" -ForegroundColor Gray
    } else {
        Write-Host "  [FAIL] Login failed: No token returned" -ForegroundColor Red
    }
} catch {
    $errorMsg = $_.Exception.Message
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            $reader.Close()
            $errorMsg += " - $responseBody"
        } catch {
            $errorMsg += " - (Could not read response body)"
        }
    }
    Write-Host "  [FAIL] Login failed: $errorMsg" -ForegroundColor Red
}

Write-TestResult -TestName "Login" -Passed $loginPassed -Message "User login test"
Write-Host ""

# Step 9: Test AI Chat
Write-Host "[9/9] Testing AI chat..." -ForegroundColor Yellow
$aiChatPassed = $false

if ($global:testToken) {
    $chatBody = @{
        message = "What are good sources of protein?"
    } | ConvertTo-Json
    
    $headers = @{
        "Authorization" = "Bearer $global:testToken"
    }
    
    try {
        $chatResponse = Invoke-RestMethod -Uri "http://localhost:8002/api/ai/chat" `
            -Method POST `
            -Body $chatBody `
            -ContentType "application/json" `
            -Headers $headers `
            -TimeoutSec 30 `
            -ErrorAction Stop
        
        if ($chatResponse.ai_response) {
            $aiChatPassed = $true
            Write-Host "  [OK] AI chat successful" -ForegroundColor Green
            $preview = if ($chatResponse.ai_response.Length -gt 100) { 
                $chatResponse.ai_response.Substring(0, 100) + "..." 
            } else { 
                $chatResponse.ai_response 
            }
            Write-Host "    Response: $preview" -ForegroundColor Gray
        } else {
            Write-Host "  [FAIL] AI chat failed: No response returned" -ForegroundColor Red
        }
    } catch {
        $errorMsg = $_.Exception.Message
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $responseBody = $reader.ReadToEnd()
                $reader.Close()
                $errorMsg += " - $responseBody"
            } catch {
                $errorMsg += " - (Could not read response body)"
            }
        }
        Write-Host "  [FAIL] AI chat failed: $errorMsg" -ForegroundColor Red
    }
} else {
    Write-Host "  [WARN] Skipping AI chat test (no valid token from registration/login)" -ForegroundColor Yellow
}

Write-TestResult -TestName "AI Chat" -Passed $aiChatPassed -Message "AI chat functionality test"
Write-Host ""

# Final Report
Write-Host "=== FINAL VERIFICATION REPORT ===" -ForegroundColor Cyan
Write-Host ""

$testOrder = @(
    "Docker Status",
    "Docker Compose Build",
    "Service Status",
    "Health Endpoints",
    "Database Connectivity",
    "Auth Service",
    "Meal Planner",
    "Nutrition AI",
    "Frontend",
    "Registration",
    "Login",
    "AI Chat"
)

# Map test results to report format
$reportResults = @{
    "Docker Status" = $global:testResults["Docker Status"]
    "Docker Compose Build" = $global:testResults["Docker Compose Build"]
    "Service Status" = $global:testResults["Service Status"]
    "Health Endpoints" = $global:testResults["Health Endpoints"]
    "Database Connectivity" = $global:testResults["Database Connectivity"]
    "Auth Service" = $global:testResults["Health Endpoints"]
    "Meal Planner" = $global:testResults["Health Endpoints"]
    "Nutrition AI" = $global:testResults["Health Endpoints"]
    "Frontend" = $global:testResults["Service Status"]
    "Registration" = $global:testResults["Registration"]
    "Login" = $global:testResults["Login"]
    "AI Chat" = $global:testResults["AI Chat"]
}

foreach ($testName in $testOrder) {
    $result = $reportResults[$testName]
    if ($result) {
        $status = if ($result.Passed) { "PASS" } else { "FAIL" }
        $color = if ($result.Passed) { "Green" } else { "Red" }
        Write-Host "[$status] $testName" -ForegroundColor $color
        if ($result.Message) {
            Write-Host "  $($result.Message)" -ForegroundColor Gray
        }
    } else {
        Write-Host "[SKIP] $testName" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
$passed = ($global:testResults.Values | Where-Object { $_.Passed }).Count
$total = $global:testResults.Count
$color = if ($passed -eq $total) { "Green" } else { "Yellow" }
Write-Host "Tests Passed: $passed / $total" -ForegroundColor $color
Write-Host ""

if ($passed -eq $total) {
    Write-Host "[PASS] All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAIL] Some tests failed. Check logs above." -ForegroundColor Red
    exit 1
}
