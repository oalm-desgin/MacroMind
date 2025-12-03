# Docker Desktop Fix Instructions

## 🔴 Critical Issues Found

1. **vmcompute service is STOPPED** - Required for WSL2 and Docker Desktop
2. **Docker Desktop Service is STOPPED**
3. **No WSL2 distributions installed** - Docker Desktop requires at least one

## ✅ What's Working

- WSL2 is configured (Default Version: 2)
- Hyper-V is detected and available
- Virtualization is enabled in BIOS

---

## 🛠️ Fix Instructions (Run as Administrator)

### Step 1: Open PowerShell as Administrator

1. Press `Windows Key + X`
2. Select "Windows PowerShell (Admin)" or "Terminal (Admin)"
3. Navigate to project directory:
   ```powershell
   cd C:\Users\Neyma\Downloads\MacroMind
   ```

### Step 2: Start Required Services

```powershell
# Start vmcompute service (critical for WSL2)
Start-Service -Name "vmcompute"
Set-Service -Name "vmcompute" -StartupType Automatic

# Start Docker Desktop Service
Start-Service -Name "com.docker.service"
Set-Service -Name "com.docker.service" -StartupType Automatic

# Verify services are running
Get-Service -Name "vmcompute", "com.docker.service" | Select-Object Name, Status
```

**Expected output:**
```
Name                Status
----                ------
com.docker.service Running
vmcompute          Running
```

### Step 3: Install WSL2 Distribution

Docker Desktop requires at least one WSL2 distribution:

```powershell
# Install Ubuntu (recommended)
wsl --install -d Ubuntu

# Or install from Microsoft Store:
# Search for "Ubuntu" in Microsoft Store and install
```

**Note:** This may take 5-10 minutes and require a restart.

### Step 4: Verify WSL2 Installation

```powershell
# Check installed distributions
wsl --list --verbose

# Should show Ubuntu (or another distribution) with VERSION 2
```

### Step 5: Start Docker Desktop

```powershell
# Start Docker Desktop application
Start-Process "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"

# Wait 30-60 seconds for Docker Desktop to fully start
Start-Sleep -Seconds 30

# Verify Docker is working
docker ps
```

**Expected output:** Should show an empty list (no error)

### Step 6: Verify Docker Compose

```powershell
docker-compose --version
```

---

## 🔄 Alternative: Complete WSL2 Setup

If services won't start, you may need to enable WSL2 features:

```powershell
# Run as Administrator

# Enable WSL feature
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux

# Enable Virtual Machine Platform
Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform

# Restart computer (required)
Restart-Computer

# After restart, set WSL2 as default
wsl --set-default-version 2

# Install Ubuntu
wsl --install -d Ubuntu

# Start services
Start-Service -Name "vmcompute"
Start-Service -Name "com.docker.service"
```

---

## 🧪 After Docker is Working

Once `docker ps` works without errors, run the full verification:

```powershell
.\full-verification.ps1
```

This will:
1. Perform clean restart (`docker-compose down -v` and `docker-compose up --build -d`)
2. Wait for all services to be healthy
3. Test all health endpoints
4. Test registration
5. Test login
6. Test AI chat
7. Generate final PASS/FAIL report

---

## 📋 Quick Reference Commands

```powershell
# Check service status
Get-Service -Name "vmcompute", "com.docker.service"

# Start services (as Admin)
Start-Service -Name "vmcompute"
Start-Service -Name "com.docker.service"

# Check WSL distributions
wsl --list --verbose

# Install Ubuntu
wsl --install -d Ubuntu

# Test Docker
docker ps

# Test Docker Compose
docker-compose --version

# Run full verification
.\full-verification.ps1
```

---

## 🚨 If Services Still Won't Start

### Check Event Logs:
```powershell
Get-EventLog -LogName System -Source "Service Control Manager" -Newest 20 | 
    Where-Object { $_.Message -like "*vmcompute*" -or $_.Message -like "*docker*" }
```

### Check if Hyper-V is blocking:
```powershell
# Disable Hyper-V (if causing conflicts)
Disable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All

# Restart required
Restart-Computer
```

### Reset Docker Desktop:
1. Open Docker Desktop
2. Go to Settings > Troubleshoot
3. Click "Reset to factory defaults"
4. Restart Docker Desktop

---

## ✅ Success Indicators

You'll know Docker is working when:
- ✅ `docker ps` returns empty list (no errors)
- ✅ `docker-compose --version` shows version number
- ✅ Docker Desktop application shows "Docker Desktop is running"
- ✅ Services show as Running: `Get-Service -Name "vmcompute", "com.docker.service"`

---

## 📞 Next Steps

1. **Run the fix commands above as Administrator**
2. **Install a WSL2 distribution** (Ubuntu recommended)
3. **Start Docker Desktop**
4. **Run verification:** `.\full-verification.ps1`

The verification script will automatically test everything and provide a complete PASS/FAIL report.

