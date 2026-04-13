# DB Playbook (shared database)

## Goal
Keep one shared Supabase database for multiple portals without schema drift.

## Rules (always)
1. Migration-first: never change schema only in dashboard.
2. One PR = app code + migration (same change set).
3. Always run preflight before creating new migration.
4. Keep `db/schema.snapshot.sql` updated after `db pull`.
5. Never edit old migration files after merged.

## Environment vars
Use PowerShell variables before CLI operations:

```powershell
$env:SUPABASE_PROJECT_REF="ouyquukpulztkfwxmmty"
$env:SUPABASE_ACCESS_TOKEN="..."
$env:SUPABASE_DB_PASSWORD="..."
```

## First setup
```powershell
.\scripts\supabase-preflight.ps1
.\scripts\supabase-setup.ps1 -ProjectRef $env:SUPABASE_PROJECT_REF
```

## Daily workflow
1. Pull latest code.
2. Run preflight:
```powershell
.\scripts\supabase-preflight.ps1 -ProjectRef $env:SUPABASE_PROJECT_REF
```
3. Pull schema (sync real DB -> repo):
```powershell
npx supabase db pull --schema public
```
4. Create new migration:
```powershell
npx supabase migration new <short_name>
```
5. Apply to remote:
```powershell
npx supabase db push
```

## Drift policy
If `db pull` produces unexpected SQL:
1. Stop feature work.
2. Create reconciliation migration.
3. Merge reconciliation first.
4. Continue feature migration.

## Shared DB design guidance
1. Put common objects in `public` only if truly shared.
2. Prefix portal-specific tables (example: `portal_a_*`, `portal_b_*`).
3. Keep RLS strict and explicit per portal access path.
4. Keep RPC names stable; version them when behavior changes.

## Audit usage
After applying migration `add_audit_log_and_events`, you can query:

```sql
select *
from public.audit_log
order by occurred_at desc
limit 100;
```

Filter by table:

```sql
select occurred_at, action, actor_email, record_pk, changed_columns
from public.audit_log
where table_name = 'portal_admins'
order by occurred_at desc;
```

Filter manual auth events:

```sql
select occurred_at, origin as event_name, actor_email, new_data
from public.audit_log
where action = 'EVENT'
order by occurred_at desc;
```
