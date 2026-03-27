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
    created_at timestamptz not null default now()
);

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
    p_category_ids uuid[] default '{}'
)
returns uuid
language plpgsql
as $$
declare
    v_collaborator_id uuid;
begin
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
        insert into public.collaborators (external_id, name, role)
        values (btrim(p_external_id), btrim(p_name), btrim(p_role))
        returning id into v_collaborator_id;
    else
        update public.collaborators
        set
            external_id = btrim(p_external_id),
            name = btrim(p_name),
            role = btrim(p_role)
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
grant execute on function public.save_collaborator_with_categories(uuid, text, text, text, uuid[]) to authenticated;

drop trigger if exists collaborator_module_status_touch on public.collaborator_module_status;
create trigger collaborator_module_status_touch
before update on public.collaborator_module_status
for each row
execute function public.touch_collaborator_module_status();

create index if not exists idx_modules_category_id on public.modules(category_id);
create index if not exists idx_collaborator_categories_category_id on public.collaborator_categories(category_id);
create index if not exists idx_collaborator_module_status_module_id on public.collaborator_module_status(module_id);

alter table public.categories enable row level security;
alter table public.modules enable row level security;
alter table public.collaborators enable row level security;
alter table public.collaborator_categories enable row level security;
alter table public.collaborator_module_status enable row level security;

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
