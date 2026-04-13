-- Execute este arquivo no SQL Editor do Supabase.
-- O frontend faz login com e-mail e senha de um usuário admin já criado no Supabase Auth.
-- Em Authentication > Providers, mantenha o signup público desabilitado.

create extension if not exists pgcrypto;

create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    sort_order integer not null default 1,
    created_at timestamptz not null default now()
);

create table if not exists public.modules (
    id uuid primary key default gen_random_uuid(),
    category_id uuid not null references public.categories(id) on delete cascade,
    name text not null,
    sort_order integer not null default 1,
    created_at timestamptz not null default now(),
    constraint modules_category_name_unique unique (category_id, name)
);

create table if not exists public.collaborators (
    id uuid primary key default gen_random_uuid(),
    external_id text not null unique,
    name text not null,
    role text not null,
    email text,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

alter table public.collaborators
    add column if not exists is_active boolean not null default true;

alter table public.collaborators
    add column if not exists email text;

update public.collaborators
set is_active = true
where is_active is null;

update public.collaborators
set email = nullif(lower(btrim(email)), '')
where email is not null;

create table if not exists public.collaborator_categories (
    collaborator_id uuid not null references public.collaborators(id) on delete cascade,
    category_id uuid not null references public.categories(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (collaborator_id, category_id)
);

create table if not exists public.collaborator_module_status (
    collaborator_id uuid not null references public.collaborators(id) on delete cascade,
    module_id uuid not null references public.modules(id) on delete cascade,
    status text not null default 'Pendente' check (status in ('Pendente', 'Concluído', 'Agendado', 'Não se aplica')),
    updated_at timestamptz not null default now(),
    primary key (collaborator_id, module_id)
);

create table if not exists public.portal_admins (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    created_at timestamptz not null default now(),
    created_by text
);

alter table public.collaborator_module_status
    drop constraint if exists collaborator_module_status_status_check;

alter table public.collaborator_module_status
    add constraint collaborator_module_status_status_check
    check (status in ('Pendente', 'Concluído', 'Agendado', 'Não se aplica'));

create or replace function public.touch_collaborator_module_status()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create or replace function public.save_category_with_modules(
    p_category_id uuid default null,
    p_name text default null,
    p_modules jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
as $$
declare
    v_category_id uuid;
    v_next_sort_order integer;
begin
    if p_name is null or btrim(p_name) = '' then
        raise exception 'O nome da categoria é obrigatório.';
    end if;

    if p_modules is null then
        p_modules := '[]'::jsonb;
    end if;

    if jsonb_typeof(p_modules) <> 'array' then
        raise exception 'A lista de módulos deve ser um array JSON.';
    end if;

    if p_category_id is null then
        select coalesce(max(sort_order), 0) + 1
        into v_next_sort_order
        from public.categories;

        insert into public.categories (name, sort_order)
        values (btrim(p_name), v_next_sort_order)
        returning id into v_category_id;
    else
        update public.categories
        set name = btrim(p_name)
        where id = p_category_id
        returning id into v_category_id;

        if v_category_id is null then
            raise exception 'Categoria não encontrada.';
        end if;

        if jsonb_array_length(p_modules) = 0 then
            delete from public.modules
            where category_id = v_category_id;
        else
            delete from public.modules
            where category_id = v_category_id
              and id not in (
                  select (item->>'id')::uuid
                  from jsonb_array_elements(p_modules) as item
                  where coalesce(item->>'id', '') <> ''
              );
        end if;
    end if;

    insert into public.modules (id, category_id, name, sort_order)
    select
        coalesce(nullif(item->>'id', '')::uuid, gen_random_uuid()),
        v_category_id,
        btrim(item->>'name'),
        coalesce((item->>'sort_order')::integer, 1)
    from jsonb_array_elements(p_modules) as item
    where btrim(coalesce(item->>'name', '')) <> ''
    on conflict (id) do update
    set
        category_id = excluded.category_id,
        name = excluded.name,
        sort_order = excluded.sort_order;

    return v_category_id;
end;
$$;

create or replace function public.save_collaborator_with_categories(
    p_collaborator_id uuid default null,
    p_external_id text default null,
    p_name text default null,
    p_role text default null,
    p_email text default null,
    p_category_ids uuid[] default '{}'
)
returns uuid
language plpgsql
as $$
declare
    v_collaborator_id uuid;
    v_email text;
begin
    v_email := nullif(lower(btrim(coalesce(p_email, ''))), '');

    if p_external_id is null or btrim(p_external_id) = '' then
        raise exception 'O ID externo é obrigatório.';
    end if;

    if p_name is null or btrim(p_name) = '' then
        raise exception 'O nome do usuário é obrigatório.';
    end if;

    if p_role is null or btrim(p_role) = '' then
        raise exception 'O cargo do usuário é obrigatório.';
    end if;

    if p_category_ids is null then
        p_category_ids := '{}';
    end if;

    if p_collaborator_id is null then
        if v_email is null then
            raise exception 'O e-mail do usuario e obrigatorio.';
        end if;

        if v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
            raise exception 'O e-mail do usuario e invalido.';
        end if;

        insert into public.collaborators (external_id, name, role, email)
        values (btrim(p_external_id), btrim(p_name), btrim(p_role), v_email)
        returning id into v_collaborator_id;
    else
        if v_email is not null and v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
            raise exception 'O e-mail do usuario e invalido.';
        end if;

        update public.collaborators
        set
            external_id = btrim(p_external_id),
            name = btrim(p_name),
            role = btrim(p_role),
            email = coalesce(v_email, email)
        where id = p_collaborator_id
        returning id into v_collaborator_id;

        if v_collaborator_id is null then
            raise exception 'Usuário não encontrado.';
        end if;
    end if;

    delete from public.collaborator_categories
    where collaborator_id = v_collaborator_id
      and category_id <> all(p_category_ids);

    insert into public.collaborator_categories (collaborator_id, category_id)
    select v_collaborator_id, category_id
    from unnest(p_category_ids) as category_id
    on conflict (collaborator_id, category_id) do nothing;

    delete from public.collaborator_module_status cms
    using public.modules m
    where cms.collaborator_id = v_collaborator_id
      and cms.module_id = m.id
      and m.category_id <> all(p_category_ids);

    return v_collaborator_id;
end;
$$;

grant execute on function public.save_category_with_modules(uuid, text, jsonb) to authenticated;
grant execute on function public.save_collaborator_with_categories(uuid, text, text, text, text, uuid[]) to authenticated;

drop trigger if exists collaborator_module_status_touch on public.collaborator_module_status;
create trigger collaborator_module_status_touch
before update on public.collaborator_module_status
for each row
execute function public.touch_collaborator_module_status();

create index if not exists idx_modules_category_id on public.modules(category_id);
create index if not exists idx_collaborator_categories_category_id on public.collaborator_categories(category_id);
create index if not exists idx_collaborator_module_status_module_id on public.collaborator_module_status(module_id);
create index if not exists idx_collaborators_is_active on public.collaborators(is_active);

alter table public.categories enable row level security;
alter table public.modules enable row level security;
alter table public.collaborators enable row level security;
alter table public.collaborator_categories enable row level security;
alter table public.collaborator_module_status enable row level security;
alter table public.portal_admins enable row level security;

drop policy if exists categories_public_select on public.categories;
create policy categories_public_select
on public.categories
for select
to anon, authenticated
using (true);

drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write
on public.categories
for all
to authenticated
using (true)
with check (true);

drop policy if exists modules_public_select on public.modules;
create policy modules_public_select
on public.modules
for select
to anon, authenticated
using (true);

drop policy if exists modules_admin_write on public.modules;
create policy modules_admin_write
on public.modules
for all
to authenticated
using (true)
with check (true);

drop policy if exists collaborators_public_select on public.collaborators;
create policy collaborators_public_select
on public.collaborators
for select
to anon, authenticated
using (true);

drop policy if exists collaborators_admin_write on public.collaborators;
create policy collaborators_admin_write
on public.collaborators
for all
to authenticated
using (true)
with check (true);

drop policy if exists collaborator_categories_public_select on public.collaborator_categories;
create policy collaborator_categories_public_select
on public.collaborator_categories
for select
to anon, authenticated
using (true);

drop policy if exists collaborator_categories_admin_write on public.collaborator_categories;
create policy collaborator_categories_admin_write
on public.collaborator_categories
for all
to authenticated
using (true)
with check (true);

drop policy if exists status_public_select on public.collaborator_module_status;
create policy status_public_select
on public.collaborator_module_status
for select
to anon, authenticated
using (true);

drop policy if exists status_admin_write on public.collaborator_module_status;
create policy status_admin_write
on public.collaborator_module_status
for all
to authenticated
using (true)
with check (true);

drop policy if exists admins_select on public.portal_admins;
create policy admins_select
on public.portal_admins
for select
to authenticated
using ((auth.jwt() ->> 'is_anonymous')::boolean is not true);

drop policy if exists admins_insert on public.portal_admins;
create policy admins_insert
on public.portal_admins
for insert
to authenticated
with check ((auth.jwt() ->> 'is_anonymous')::boolean is not true);

drop policy if exists admins_delete on public.portal_admins;
create policy admins_delete
on public.portal_admins
for delete
to authenticated
using ((auth.jwt() ->> 'is_anonymous')::boolean is not true);

drop policy if exists admins_update on public.portal_admins;
create policy admins_update
on public.portal_admins
for update
to authenticated
using ((auth.jwt() ->> 'is_anonymous')::boolean is not true)
with check ((auth.jwt() ->> 'is_anonymous')::boolean is not true);

insert into public.categories (name, sort_order)
values
    ('Salesforce', 1),
    ('PowerBI', 2),
    ('IA', 3)
on conflict (name) do nothing;

insert into public.modules (category_id, name, sort_order)
select c.id, seed.module_name, seed.sort_order
from (
    values
        ('Salesforce', 'CRM Básico', 1),
        ('Salesforce', 'Objetos Personalizados', 2),
        ('Salesforce', 'Automação', 3),
        ('PowerBI', 'DAX Básico', 1),
        ('PowerBI', 'Modelagem de Dados', 2),
        ('PowerBI', 'Visualizações', 3),
        ('IA', 'Prompting', 1),
        ('IA', 'LLMs', 2),
        ('IA', 'OpenAI API', 3)
) as seed(category_name, module_name, sort_order)
join public.categories c
    on c.name = seed.category_name
on conflict (category_id, name) do nothing;

-- Opcional: garante seu admin atual listado no painel.
insert into public.portal_admins (email, created_by)
values ('contato.vtpereira@gmail.com', 'setup')
on conflict (email) do nothing;

-- Limpeza solicitada: remove usuarios cadastrados sem afetar administradores.
delete from public.collaborators c
where not exists (
    select 1
    from public.portal_admins a
    where lower(btrim(a.email)) = lower(btrim(c.email))
);

create unique index if not exists collaborators_email_unique
on public.collaborators (lower(email))
where email is not null and btrim(email) <> '';

-- =========================================================
-- AUDITORIA
-- =========================================================

create table if not exists public.audit_log (
    id bigint generated always as identity primary key,
    occurred_at timestamptz not null default now(),
    txid bigint not null default txid_current(),
    schema_name text not null,
    table_name text not null,
    action text not null check (action in ('INSERT', 'UPDATE', 'DELETE', 'EVENT')),
    record_pk jsonb,
    old_data jsonb,
    new_data jsonb,
    changed_columns text[] not null default '{}'::text[],
    actor_id uuid,
    actor_email text,
    actor_role text,
    actor_is_anonymous boolean,
    source text not null default 'trigger',
    origin text
);

create index if not exists idx_audit_log_occurred_at
on public.audit_log (occurred_at desc);

create index if not exists idx_audit_log_table
on public.audit_log (schema_name, table_name, occurred_at desc);

create index if not exists idx_audit_log_actor_email
on public.audit_log (actor_email, occurred_at desc);

create index if not exists idx_audit_log_record_pk_gin
on public.audit_log using gin (record_pk);

alter table public.audit_log enable row level security;

drop policy if exists audit_log_admin_select on public.audit_log;
create policy audit_log_admin_select
on public.audit_log
for select
to authenticated
using (public.is_admin_user());

revoke all on table public.audit_log from anon, authenticated;
grant select on table public.audit_log to authenticated;
grant all on table public.audit_log to service_role;
revoke all on sequence public.audit_log_id_seq from anon, authenticated;
grant usage, select on sequence public.audit_log_id_seq to service_role;

create or replace function public.audit_extract_pk(p_schema_name text, p_table_name text, p_row jsonb)
returns jsonb
language sql
stable
set search_path = pg_catalog, public
as $$
with pk_cols as (
    select a.attname, cols.ord
    from pg_index i
    join pg_class c on c.oid = i.indrelid
    join pg_namespace ns on ns.oid = c.relnamespace
    join unnest(i.indkey) with ordinality as cols(attnum, ord) on true
    join pg_attribute a on a.attrelid = c.oid and a.attnum = cols.attnum
    where ns.nspname = p_schema_name
      and c.relname = p_table_name
      and i.indisprimary
)
select case
    when count(*) = 0 then null
    else jsonb_object_agg(attname, p_row -> attname order by ord)
end
from pk_cols;
$$;

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_old jsonb;
    v_new jsonb;
    v_row jsonb;
    v_claims jsonb := coalesce(auth.jwt(), '{}'::jsonb);
    v_actor_email text;
    v_actor_role text;
    v_actor_is_anonymous boolean;
    v_changed_columns text[] := '{}'::text[];
begin
    if tg_table_schema = 'public' and tg_table_name = 'audit_log' then
        return coalesce(new, old);
    end if;

    if tg_op = 'INSERT' then
        v_new := to_jsonb(new);
        v_row := v_new;
    elsif tg_op = 'UPDATE' then
        v_old := to_jsonb(old);
        v_new := to_jsonb(new);

        select coalesce(array_agg(n.key order by n.key), '{}'::text[])
        into v_changed_columns
        from jsonb_each(v_new) as n(key, value)
        where (v_old -> n.key) is distinct from n.value;

        if coalesce(array_length(v_changed_columns, 1), 0) = 0 then
            return new;
        end if;

        v_row := v_new;
    elsif tg_op = 'DELETE' then
        v_old := to_jsonb(old);
        v_row := v_old;
    else
        return coalesce(new, old);
    end if;

    begin
        v_actor_is_anonymous := nullif(v_claims ->> 'is_anonymous', '')::boolean;
    exception
        when others then
            v_actor_is_anonymous := null;
    end;

    v_actor_email := nullif(coalesce(
        v_claims ->> 'email',
        v_claims -> 'user_metadata' ->> 'email'
    ), '');

    v_actor_role := nullif(coalesce(
        v_claims -> 'user_metadata' ->> 'role',
        v_claims ->> 'role',
        auth.role()
    ), '');

    insert into public.audit_log (
        schema_name,
        table_name,
        action,
        record_pk,
        old_data,
        new_data,
        changed_columns,
        actor_id,
        actor_email,
        actor_role,
        actor_is_anonymous,
        source,
        origin
    ) values (
        tg_table_schema,
        tg_table_name,
        tg_op,
        public.audit_extract_pk(tg_table_schema, tg_table_name, v_row),
        v_old,
        v_new,
        v_changed_columns,
        auth.uid(),
        v_actor_email,
        v_actor_role,
        v_actor_is_anonymous,
        'trigger',
        tg_name
    );

    return coalesce(new, old);
end;
$$;

create or replace function public.log_portal_event(
    p_event text,
    p_payload jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_event text := btrim(coalesce(p_event, ''));
    v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
    v_claims jsonb := coalesce(auth.jwt(), '{}'::jsonb);
    v_actor_email text;
    v_actor_role text;
    v_actor_is_anonymous boolean;
    v_id bigint;
begin
    if v_event = '' then
        raise exception 'p_event is required';
    end if;

    begin
        v_actor_is_anonymous := nullif(v_claims ->> 'is_anonymous', '')::boolean;
    exception
        when others then
            v_actor_is_anonymous := null;
    end;

    v_actor_email := nullif(coalesce(
        v_claims ->> 'email',
        v_claims -> 'user_metadata' ->> 'email'
    ), '');

    v_actor_role := nullif(coalesce(
        v_claims -> 'user_metadata' ->> 'role',
        v_claims ->> 'role',
        auth.role()
    ), '');

    insert into public.audit_log (
        schema_name,
        table_name,
        action,
        record_pk,
        old_data,
        new_data,
        changed_columns,
        actor_id,
        actor_email,
        actor_role,
        actor_is_anonymous,
        source,
        origin
    ) values (
        'public',
        'portal_events',
        'EVENT',
        jsonb_build_object('event', v_event),
        null,
        v_payload,
        '{}'::text[],
        auth.uid(),
        v_actor_email,
        v_actor_role,
        v_actor_is_anonymous,
        'manual',
        v_event
    )
    returning id into v_id;

    return v_id;
end;
$$;

revoke all on function public.log_portal_event(text, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.log_portal_event(text, jsonb) to authenticated, service_role;

drop trigger if exists audit_row_change_categories on public.categories;
create trigger audit_row_change_categories
after insert or update or delete on public.categories
for each row
execute function public.audit_row_change();

drop trigger if exists audit_row_change_modules on public.modules;
create trigger audit_row_change_modules
after insert or update or delete on public.modules
for each row
execute function public.audit_row_change();

drop trigger if exists audit_row_change_collaborators on public.collaborators;
create trigger audit_row_change_collaborators
after insert or update or delete on public.collaborators
for each row
execute function public.audit_row_change();

drop trigger if exists audit_row_change_collaborator_categories on public.collaborator_categories;
create trigger audit_row_change_collaborator_categories
after insert or update or delete on public.collaborator_categories
for each row
execute function public.audit_row_change();

drop trigger if exists audit_row_change_collaborator_module_status on public.collaborator_module_status;
create trigger audit_row_change_collaborator_module_status
after insert or update or delete on public.collaborator_module_status
for each row
execute function public.audit_row_change();

drop trigger if exists audit_row_change_portal_admins on public.portal_admins;
create trigger audit_row_change_portal_admins
after insert or update or delete on public.portal_admins
for each row
execute function public.audit_row_change();

