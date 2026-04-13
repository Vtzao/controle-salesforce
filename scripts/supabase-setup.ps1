param(
    [string]$ProjectRef = "ouyquukpulztkfwxmmty"
)

$ErrorActionPreference = "Stop"

function Require-Env {
    param(
        [string]$Name
    )

    if ([string]::IsNullOrWhiteSpace((Get-Item -Path "Env:$Name" -ErrorAction SilentlyContinue).Value)) {
        throw "Variavel de ambiente obrigatoria ausente: $Name"
    }
}

Write-Host "== Supabase setup start =="
Write-Host "Project ref: $ProjectRef"

& npx supabase --version | Out-Host

Require-Env -Name "SUPABASE_ACCESS_TOKEN"
Require-Env -Name "SUPABASE_DB_PASSWORD"

if (!(Test-Path "supabase\config.toml")) {
    Write-Host "Rodando supabase init..."
    & npx supabase init | Out-Host
}

Write-Host "Linkando projeto remoto..."
& npx supabase link --project-ref $ProjectRef --password $env:SUPABASE_DB_PASSWORD | Out-Host
if ($LASTEXITCODE -ne 0) {
    throw "Falha no supabase link."
}

Write-Host "Puxando schema remoto (public)..."
$pullOutput = cmd /c "npx supabase db pull --schema public 2>&1"
$pullExitCode = $LASTEXITCODE
$pullOutput | Out-Host
if ($pullExitCode -ne 0) {
    $pullJoined = ($pullOutput -join "`n")
    if ($pullJoined -notmatch "No schema changes found") {
        throw "Falha no supabase db pull. Verifique Docker Desktop em execucao e o estado das migrations."
    }
    Write-Host "Sem mudancas de schema no remoto. Seguindo com snapshot local."
}

if (!(Test-Path "db")) {
    New-Item -ItemType Directory -Path "db" | Out-Null
}

Write-Host "Gerando snapshot atual do schema remoto..."
$dumpOutput = cmd /c "npx supabase db dump --linked --schema public --file db/schema.snapshot.sql 2>&1"
$dumpExitCode = $LASTEXITCODE
$dumpOutput | Out-Host
if ($dumpExitCode -ne 0) {
    throw "Falha ao gerar snapshot com supabase db dump."
}

$snapshotFile = Get-Item "db\schema.snapshot.sql" -ErrorAction SilentlyContinue
if (-not $snapshotFile -or $snapshotFile.Length -le 0) {
    throw "Snapshot db/schema.snapshot.sql vazio ou ausente."
}

Write-Host "Snapshot atualizado em db/schema.snapshot.sql"

Write-Host "== Supabase setup done =="
