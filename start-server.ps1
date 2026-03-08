# Start Server Script
Write-Host "🚀 Starting GamesUp Platform Server..."
Write-Host "📁 Working Directory: $PWD"

# Check if .env exists
if (Test-Path ".env") {
    Write-Host "✅ .env file found"
    Get-Content ".env" | ForEach-Object { Write-Host "   $_" }
} else {
    Write-Host "❌ .env file not found"
}

# Check if MySQL is running
try {
    $result = mysql --version 2>$null
    Write-Host "✅ MySQL is available"
} catch {
    Write-Host "❌ MySQL not found - please install MySQL"
}

# Start the server
Write-Host "🔄 Starting server on port 5000..."
node server/index.js
