# AI-Powered HRMS - Quick Environment Setup Script (PowerShell)
# This script helps you create your .env file quickly on Windows

Write-Host "================================" -ForegroundColor Cyan
Write-Host "HRMS Environment Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env already exists
if (Test-Path "backend\.env") {
    $response = Read-Host ".env file already exists. Overwrite? (y/N)"
    if ($response -notmatch '^[Yy]$') {
        Write-Host "Setup cancelled." -ForegroundColor Red
        exit 1
    }
}

# Copy example file
Write-Host "Creating .env file from template..." -ForegroundColor Yellow
Copy-Item "backend\env.example.txt" "backend\.env"

# Generate JWT secrets
Write-Host "Generating JWT secrets..." -ForegroundColor Yellow

# Generate random strings for JWT secrets (64 bytes = 88 characters in base64)
$rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
$bytes = New-Object byte[] 64
$rng.GetBytes($bytes)
$JWT_SECRET = [Convert]::ToBase64String($bytes)
$rng.GetBytes($bytes)
$JWT_REFRESH_SECRET = [Convert]::ToBase64String($bytes)

# Read .env file
$envContent = Get-Content "backend\.env"

# Update JWT secrets
$envContent = $envContent -replace 'JWT_SECRET=.*', "JWT_SECRET=$JWT_SECRET"
$envContent = $envContent -replace 'JWT_REFRESH_SECRET=.*', "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"

# Write back to file
$envContent | Set-Content "backend\.env"

Write-Host "JWT secrets generated and updated" -ForegroundColor Green
Write-Host ""

# Ask for Gemini API key
Write-Host "AI Provider Setup" -ForegroundColor Cyan
Write-Host "-----------------------------------" -ForegroundColor Cyan
$hasGemini = Read-Host "Do you have a Google Gemini API key? (y/N)"
if ($hasGemini -match '^[Yy]$') {
    $geminiKey = Read-Host "Enter your Gemini API key"
    $envContent = Get-Content "backend\.env"
    $envContent = $envContent -replace 'GEMINI_API_KEY=.*', "GEMINI_API_KEY=$geminiKey"
    $envContent | Set-Content "backend\.env"
    Write-Host "Gemini API key configured" -ForegroundColor Green
} else {
    Write-Host "Get your free Gemini API key at: https://makersuite.google.com/app/apikey" -ForegroundColor Blue
}
Write-Host ""

# Ask for HuggingFace token
$hasHF = Read-Host "Do you have a HuggingFace token? (y/N)"
if ($hasHF -match '^[Yy]$') {
    $hfToken = Read-Host "Enter your HuggingFace token"
    $envContent = Get-Content "backend\.env"
    $envContent = $envContent -replace 'HUGGINGFACE_API_KEY=.*', "HUGGINGFACE_API_KEY=$hfToken"
    $envContent | Set-Content "backend\.env"
    Write-Host "HuggingFace token configured" -ForegroundColor Green
} else {
    Write-Host "Get your free HuggingFace token at: https://huggingface.co/settings/tokens" -ForegroundColor Blue
}
Write-Host ""

Write-Host "================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your .env file has been created at: backend\.env" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Review your backend\.env file"
Write-Host "2. If you skipped API keys, add them manually"
Write-Host "3. Start Docker: docker-compose up -d"
Write-Host "4. Run migrations: cd backend; npm run migrate"
Write-Host "5. Seed database: npm run seed"
Write-Host "6. Start backend: npm start"
Write-Host "7. Start frontend: cd ..\frontend; npm run dev"
Write-Host ""
Write-Host "For detailed setup instructions, see: ENV_SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
