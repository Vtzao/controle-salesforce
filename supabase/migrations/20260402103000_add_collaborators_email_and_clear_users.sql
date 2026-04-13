-- Add real e-mail field for collaborators and preserve only admin users.

alter table public.collaborators
    add column if not exists email text;

update public.collaborators
set email = nullif(lower(btrim(email)), '')
where email is not null;

drop function if exists public.save_collaborator_with_categories(uuid, text, text, text, uuid[]);

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
            raise exception 'Usuario nao encontrado.';
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

grant execute on function public.save_collaborator_with_categories(uuid, text, text, text, text, uuid[]) to authenticated;

-- Requested cleanup: remove all registered users without affecting admins.
delete from public.collaborators c
where not exists (
    select 1
    from public.portal_admins a
    where lower(btrim(a.email)) = lower(btrim(c.email))
);

create unique index if not exists collaborators_email_unique
    on public.collaborators (lower(email))
    where email is not null and btrim(email) <> '';
