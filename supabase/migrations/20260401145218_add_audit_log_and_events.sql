-- Audit baseline for shared database traceability.

create table if not exists public.audit_log (
    id bigint generated always as identity primary key,
    occurred_at timestamp with time zone not null default now(),
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

revoke all on function public.log_portal_event(text, jsonb) from public;
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
