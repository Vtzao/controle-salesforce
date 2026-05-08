-- Keep the intranet collaborators untouched and move this portal to its own training roster.

create table if not exists public.training_users (
    id uuid primary key default gen_random_uuid(),
    external_id text not null unique,
    name text not null,
    role text not null,
    email text,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

create table if not exists public.training_user_categories (
    training_user_id uuid not null references public.training_users(id) on delete cascade,
    category_id uuid not null references public.categories(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (training_user_id, category_id)
);

create table if not exists public.training_user_module_status (
    training_user_id uuid not null references public.training_users(id) on delete cascade,
    module_id uuid not null references public.modules(id) on delete cascade,
    status text not null default 'Pendente',
    updated_at timestamptz not null default now(),
    primary key (training_user_id, module_id)
);

alter table public.training_user_module_status
    drop constraint if exists training_user_module_status_status_check;

alter table public.training_user_module_status
    add constraint training_user_module_status_status_check
    check (status in ('Pendente', 'Concluído', 'Agendado', 'Não se aplica'));

create or replace function public.touch_training_user_module_status()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists training_user_module_status_touch on public.training_user_module_status;
create trigger training_user_module_status_touch
before update on public.training_user_module_status
for each row
execute function public.touch_training_user_module_status();

create or replace function public.save_training_user_with_categories(
    p_training_user_id uuid default null,
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
    v_training_user_id uuid;
    v_email text;
begin
    v_email := nullif(lower(btrim(coalesce(p_email, ''))), '');

    if p_external_id is null or btrim(p_external_id) = '' then
        raise exception 'O ID externo e obrigatorio.';
    end if;

    if p_name is null or btrim(p_name) = '' then
        raise exception 'O nome do usuario e obrigatorio.';
    end if;

    if p_role is null or btrim(p_role) = '' then
        raise exception 'O cargo do usuario e obrigatorio.';
    end if;

    if p_category_ids is null then
        p_category_ids := '{}';
    end if;

    if p_training_user_id is null then
        if v_email is null then
            raise exception 'O e-mail do usuario e obrigatorio.';
        end if;

        if v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
            raise exception 'O e-mail do usuario e invalido.';
        end if;

        insert into public.training_users (external_id, name, role, email)
        values (btrim(p_external_id), btrim(p_name), btrim(p_role), v_email)
        returning id into v_training_user_id;
    else
        if v_email is not null and v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
            raise exception 'O e-mail do usuario e invalido.';
        end if;

        update public.training_users
        set
            external_id = btrim(p_external_id),
            name = btrim(p_name),
            role = btrim(p_role),
            email = coalesce(v_email, email)
        where id = p_training_user_id
        returning id into v_training_user_id;

        if v_training_user_id is null then
            raise exception 'Usuario nao encontrado.';
        end if;
    end if;

    delete from public.training_user_categories
    where training_user_id = v_training_user_id
      and category_id <> all(p_category_ids);

    insert into public.training_user_categories (training_user_id, category_id)
    select v_training_user_id, category_id
    from unnest(p_category_ids) as category_id
    on conflict (training_user_id, category_id) do nothing;

    delete from public.training_user_module_status tums
    using public.modules m
    where tums.training_user_id = v_training_user_id
      and tums.module_id = m.id
      and m.category_id <> all(p_category_ids);

    return v_training_user_id;
end;
$$;

grant execute on function public.save_training_user_with_categories(uuid, text, text, text, text, uuid[]) to authenticated;

create index if not exists idx_training_user_categories_category_id
    on public.training_user_categories (category_id);

create index if not exists idx_training_user_module_status_module_id
    on public.training_user_module_status (module_id);

create index if not exists idx_training_users_is_active
    on public.training_users (is_active);

create unique index if not exists training_users_email_unique
    on public.training_users (lower(email))
    where email is not null and btrim(email) <> '';

alter table public.training_users enable row level security;
alter table public.training_user_categories enable row level security;
alter table public.training_user_module_status enable row level security;

drop policy if exists training_users_public_select on public.training_users;
create policy training_users_public_select
on public.training_users
for select
to anon, authenticated
using (true);

drop policy if exists training_users_admin_write on public.training_users;
create policy training_users_admin_write
on public.training_users
for all
to authenticated
using (true)
with check (true);

drop policy if exists training_user_categories_public_select on public.training_user_categories;
create policy training_user_categories_public_select
on public.training_user_categories
for select
to anon, authenticated
using (true);

drop policy if exists training_user_categories_admin_write on public.training_user_categories;
create policy training_user_categories_admin_write
on public.training_user_categories
for all
to authenticated
using (true)
with check (true);

drop policy if exists training_status_public_select on public.training_user_module_status;
create policy training_status_public_select
on public.training_user_module_status
for select
to anon, authenticated
using (true);

drop policy if exists training_status_admin_write on public.training_user_module_status;
create policy training_status_admin_write
on public.training_user_module_status
for all
to authenticated
using (true)
with check (true);

grant select on public.training_users to anon, authenticated;
grant insert, update, delete on public.training_users to authenticated;
grant all on public.training_users to service_role;

grant select on public.training_user_categories to anon, authenticated;
grant insert, update, delete on public.training_user_categories to authenticated;
grant all on public.training_user_categories to service_role;

grant select on public.training_user_module_status to anon, authenticated;
grant insert, update, delete on public.training_user_module_status to authenticated;
grant all on public.training_user_module_status to service_role;

drop trigger if exists audit_row_change_training_users on public.training_users;
create trigger audit_row_change_training_users
after insert or update or delete on public.training_users
for each row
execute function public.audit_row_change();

drop trigger if exists audit_row_change_training_user_categories on public.training_user_categories;
create trigger audit_row_change_training_user_categories
after insert or update or delete on public.training_user_categories
for each row
execute function public.audit_row_change();

drop trigger if exists audit_row_change_training_user_module_status on public.training_user_module_status;
create trigger audit_row_change_training_user_module_status
after insert or update or delete on public.training_user_module_status
for each row
execute function public.audit_row_change();
