param(
    [string]$ProjectRef = "ouyquukpulztkfwxmmty"
)

$ErrorActionPreference = "Stop"

Write-Host "== Supabase preflight =="
Write-Host "Project ref target: $ProjectRef"

try {
    $version = & npx supabase --version
    Write-Host "CLI: $version"
} catch {
    Write-Error "Falha ao executar 'npx supabase --version'."
    exit 1
}

$tokenPresent = -not [string]::IsNullOrWhiteSpace($env:SUPABASE_ACCESS_TOKEN)
$dbPassPresent = -not [string]::IsNullOrWhiteSpace($env:SUPABASE_DB_PASSWORD)

Write-Host "SUPABASE_ACCESS_TOKEN: $tokenPresent"
Write-Host "SUPABASE_DB_PASSWORD: $dbPassPresent"

if (!(Test-Path "supabase\config.toml")) {
    Write-Host "Arquivo supabase/config.toml nao encontrado. Rodando init..."
    & npx supabase init | Out-Host
}

Write-Host "Link check (dry):"
if ($tokenPresent -and $dbPassPresent) {
    Write-Host "Credenciais presentes. Pode rodar setup completo."
    exit 0
}

Write-Host "Credenciais faltando. Defina as variaveis de ambiente e rode setup."
Write-Host "PowerShell exemplo:"
Write-Host '$env:SUPABASE_ACCESS_TOKEN="seu_token"'
Write-Host '$env:SUPABASE_DB_PASSWORD="sua_senha_db"'
Write-Host 'npx supabase projects list'
exit 0
