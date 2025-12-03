# MacroMind Docker Setup Verification Script
# Run this script after starting Docker Desktop

Write-Host "=== MacroMind Docker Setup Verification ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify .env file exists and has required variables
Write-Host "[1/8] Verifying .env file..." -ForegroundColor Yellow
if (Test-Path .env) {
    $envContent = Get-Content .env -Raw
    $requiredVars = @("POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB", "DATABASE_URL", "JWT_SECRET_KEY", "OPENAI_API_KEY")
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        if ($envContent -notmatch "$var=") {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -eq 0) {
        Write-Host "  ✓ .env file exists with all required variables" -ForegroundColor Green
        
        # Check DATABASE_URL uses postgres hostname
        if ($envContent -match "DATABASE_URL=postgresql://.*@postgres:5432") {
            Write-Host "  ✓ DATABASE_URL uses postgres container hostname" -ForegroundColor Green
        } else {
            Write-Host "  ✗ DATABASE_URL does not use postgres hostname" -ForegroundColor Red
        }
    } else {
        Write-Host "  ✗ Missing variables: $($missingVars -join ', ')" -ForegroundColor Red
    }
} else {
    Write-Host "  ✗ .env file not found" -ForegroundColor Red
}

Write-Host ""

# Step 2: Clean restart
Write-Host "[2/8] Performing clean restart..." -ForegroundColor Yellow
Write-Host "  Running: docker-compose down -v" -ForegroundColor Gray
docker-compose down -v
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Containers stopped and volumes removed" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Warning: docker-compose down failed (containers may not exist)" -ForegroundColor Yellow
}

Write-Host "  Running: docker-compose up --build -d" -ForegroundColor Gray
docker-compose up --build -d
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Services building and starting..." -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to start services" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Wait for services to be ready
Write-Host "[3/8] Waiting for services to be ready (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""

# Step 4: Check service status
Write-Host "[4/8] Checking service status..." -ForegroundColor Yellow
$services = @("postgres", "auth-service", "meal-planner-service", "nutrition-ai-service", "frontend")
$allRunning = $true

foreach ($service in $services) {
    $status = docker-compose ps $service --format json | ConvertFrom-Json
    if ($status.State -eq "running") {
        Write-Host "  ✓ $service is running" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $service is not running (Status: $($status.State))" -ForegroundColor Red
        $allRunning = $false
    }
}

if (-not $allRunning) {
    Write-Host "  ⚠ Some services are not running. Check logs with: docker-compose logs" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Test health endpoints
Write-Host "[5/8] Testing health endpoints..." -ForegroundColor Yellow
$healthEndpoints = @(
    @{Service="auth-service"; Port=8000},
    @{Service="meal-planner-service"; Port=8001},
    @{Service="nutrition-ai-service"; Port=8002}
)

$allHealthy = $true
foreach ($endpoint in $healthEndpoints) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($endpoint.Port)/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✓ $($endpoint.Service) health check passed" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $($endpoint.Service) health check failed (Status: $($response.StatusCode))" -ForegroundColor Red
            $allHealthy = $false
        }
    } catch {
        Write-Host "  ✗ $($endpoint.Service) health check failed: $($_.Exception.Message)" -ForegroundColor Red
        $allHealthy = $false
    }
}

Write-Host ""

# Step 6: Test registration
Write-Host "[6/8] Testing user registration..." -ForegroundColor Yellow
$testEmail = "test_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$registerBody = @{
    email = $testEmail
    password = "TestPassword123!"
    fitness_goal = "MAINTAIN"
    dietary_preference = "NONE"
    daily_calories = 2000
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/register" `
        -Method POST `
        -Body $registerBody `
        -ContentType "application/json" `
        -TimeoutSec 10
    
    if ($registerResponse.access_token) {
        Write-Host "  ✓ Registration successful" -ForegroundColor Green
        $global:testToken = $registerResponse.access_token
        $global:testUserId = $registerResponse.user_id
    } else {
        Write-Host "  ✗ Registration failed: No token returned" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "    Response: $responseBody" -ForegroundColor Gray
    }
}

Write-Host ""

# Step 7: Test login
Write-Host "[7/8] Testing user login..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = "TestPassword123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -TimeoutSec 10
    
    if ($loginResponse.access_token) {
        Write-Host "  ✓ Login successful" -ForegroundColor Green
        $global:testToken = $loginResponse.access_token
    } else {
        Write-Host "  ✗ Login failed: No token returned" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 8: Test AI chat
Write-Host "[8/8] Testing AI chat..." -ForegroundColor Yellow
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
            -TimeoutSec 30
        
        if ($chatResponse.ai_response) {
            Write-Host "  ✓ AI chat successful" -ForegroundColor Green
            Write-Host "    Response preview: $($chatResponse.ai_response.Substring(0, [Math]::Min(100, $chatResponse.ai_response.Length)))..." -ForegroundColor Gray
        } else {
            Write-Host "  ✗ AI chat failed: No response returned" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ✗ AI chat failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "    Response: $responseBody" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  ⚠ Skipping AI chat test (no valid token from registration/login)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Verification Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view logs: docker-compose logs -f" -ForegroundColor Gray
Write-Host "To check service status: docker-compose ps" -ForegroundColor Gray

