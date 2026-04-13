
  create table "public"."categories" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "sort_order" integer not null default 1,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."categories" enable row level security;


  create table "public"."collaborator_categories" (
    "collaborator_id" uuid not null,
    "category_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."collaborator_categories" enable row level security;


  create table "public"."collaborator_module_status" (
    "collaborator_id" uuid not null,
    "module_id" uuid not null,
    "status" text not null default 'Pendente'::text,
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."collaborator_module_status" enable row level security;


  create table "public"."collaborators" (
    "id" uuid not null default gen_random_uuid(),
    "external_id" text not null,
    "name" text not null,
    "role" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."collaborators" enable row level security;


  create table "public"."modules" (
    "id" uuid not null default gen_random_uuid(),
    "category_id" uuid not null,
    "name" text not null,
    "sort_order" integer not null default 1,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."modules" enable row level security;


  create table "public"."portal_admins" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "created_at" timestamp with time zone not null default now(),
    "created_by" text
      );


alter table "public"."portal_admins" enable row level security;

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE UNIQUE INDEX collaborator_categories_pkey ON public.collaborator_categories USING btree (collaborator_id, category_id);

CREATE UNIQUE INDEX collaborator_module_status_pkey ON public.collaborator_module_status USING btree (collaborator_id, module_id);

CREATE UNIQUE INDEX collaborators_external_id_key ON public.collaborators USING btree (external_id);

CREATE UNIQUE INDEX collaborators_pkey ON public.collaborators USING btree (id);

CREATE INDEX idx_collaborator_categories_category_id ON public.collaborator_categories USING btree (category_id);

CREATE INDEX idx_collaborator_module_status_module_id ON public.collaborator_module_status USING btree (module_id);

CREATE INDEX idx_modules_category_id ON public.modules USING btree (category_id);

CREATE UNIQUE INDEX modules_category_name_unique ON public.modules USING btree (category_id, name);

CREATE UNIQUE INDEX modules_pkey ON public.modules USING btree (id);

CREATE UNIQUE INDEX portal_admins_email_key ON public.portal_admins USING btree (email);

CREATE UNIQUE INDEX portal_admins_pkey ON public.portal_admins USING btree (id);

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."collaborator_categories" add constraint "collaborator_categories_pkey" PRIMARY KEY using index "collaborator_categories_pkey";

alter table "public"."collaborator_module_status" add constraint "collaborator_module_status_pkey" PRIMARY KEY using index "collaborator_module_status_pkey";

alter table "public"."collaborators" add constraint "collaborators_pkey" PRIMARY KEY using index "collaborators_pkey";

alter table "public"."modules" add constraint "modules_pkey" PRIMARY KEY using index "modules_pkey";

alter table "public"."portal_admins" add constraint "portal_admins_pkey" PRIMARY KEY using index "portal_admins_pkey";

alter table "public"."categories" add constraint "categories_name_key" UNIQUE using index "categories_name_key";

alter table "public"."collaborator_categories" add constraint "collaborator_categories_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE not valid;

alter table "public"."collaborator_categories" validate constraint "collaborator_categories_category_id_fkey";

alter table "public"."collaborator_categories" add constraint "collaborator_categories_collaborator_id_fkey" FOREIGN KEY (collaborator_id) REFERENCES public.collaborators(id) ON DELETE CASCADE not valid;

alter table "public"."collaborator_categories" validate constraint "collaborator_categories_collaborator_id_fkey";

alter table "public"."collaborator_module_status" add constraint "collaborator_module_status_collaborator_id_fkey" FOREIGN KEY (collaborator_id) REFERENCES public.collaborators(id) ON DELETE CASCADE not valid;

alter table "public"."collaborator_module_status" validate constraint "collaborator_module_status_collaborator_id_fkey";

alter table "public"."collaborator_module_status" add constraint "collaborator_module_status_module_id_fkey" FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE not valid;

alter table "public"."collaborator_module_status" validate constraint "collaborator_module_status_module_id_fkey";

alter table "public"."collaborator_module_status" add constraint "collaborator_module_status_status_check" CHECK ((status = ANY (ARRAY['Pendente'::text, 'Concluído'::text, 'Agendado'::text, 'Não se aplica'::text]))) not valid;

alter table "public"."collaborator_module_status" validate constraint "collaborator_module_status_status_check";

alter table "public"."collaborators" add constraint "collaborators_external_id_key" UNIQUE using index "collaborators_external_id_key";

alter table "public"."modules" add constraint "modules_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE not valid;

alter table "public"."modules" validate constraint "modules_category_id_fkey";

alter table "public"."modules" add constraint "modules_category_name_unique" UNIQUE using index "modules_category_name_unique";

alter table "public"."portal_admins" add constraint "portal_admins_email_key" UNIQUE using index "portal_admins_email_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_admin_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select
    lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'admin'
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', 'email')) <> 'salesforce';
$function$
;

CREATE OR REPLACE FUNCTION public.save_category_with_modules(p_category_id uuid DEFAULT NULL::uuid, p_name text DEFAULT NULL::text, p_modules jsonb DEFAULT '[]'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.save_collaborator_with_categories(p_collaborator_id uuid DEFAULT NULL::uuid, p_external_id text DEFAULT NULL::text, p_name text DEFAULT NULL::text, p_role text DEFAULT NULL::text, p_category_ids uuid[] DEFAULT '{}'::uuid[])
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.touch_collaborator_module_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    new.updated_at = now();
    return new;
end;
$function$
;

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."collaborator_categories" to "anon";

grant insert on table "public"."collaborator_categories" to "anon";

grant references on table "public"."collaborator_categories" to "anon";

grant select on table "public"."collaborator_categories" to "anon";

grant trigger on table "public"."collaborator_categories" to "anon";

grant truncate on table "public"."collaborator_categories" to "anon";

grant update on table "public"."collaborator_categories" to "anon";

grant delete on table "public"."collaborator_categories" to "authenticated";

grant insert on table "public"."collaborator_categories" to "authenticated";

grant references on table "public"."collaborator_categories" to "authenticated";

grant select on table "public"."collaborator_categories" to "authenticated";

grant trigger on table "public"."collaborator_categories" to "authenticated";

grant truncate on table "public"."collaborator_categories" to "authenticated";

grant update on table "public"."collaborator_categories" to "authenticated";

grant delete on table "public"."collaborator_categories" to "service_role";

grant insert on table "public"."collaborator_categories" to "service_role";

grant references on table "public"."collaborator_categories" to "service_role";

grant select on table "public"."collaborator_categories" to "service_role";

grant trigger on table "public"."collaborator_categories" to "service_role";

grant truncate on table "public"."collaborator_categories" to "service_role";

grant update on table "public"."collaborator_categories" to "service_role";

grant delete on table "public"."collaborator_module_status" to "anon";

grant insert on table "public"."collaborator_module_status" to "anon";

grant references on table "public"."collaborator_module_status" to "anon";

grant select on table "public"."collaborator_module_status" to "anon";

grant trigger on table "public"."collaborator_module_status" to "anon";

grant truncate on table "public"."collaborator_module_status" to "anon";

grant update on table "public"."collaborator_module_status" to "anon";

grant delete on table "public"."collaborator_module_status" to "authenticated";

grant insert on table "public"."collaborator_module_status" to "authenticated";

grant references on table "public"."collaborator_module_status" to "authenticated";

grant select on table "public"."collaborator_module_status" to "authenticated";

grant trigger on table "public"."collaborator_module_status" to "authenticated";

grant truncate on table "public"."collaborator_module_status" to "authenticated";

grant update on table "public"."collaborator_module_status" to "authenticated";

grant delete on table "public"."collaborator_module_status" to "service_role";

grant insert on table "public"."collaborator_module_status" to "service_role";

grant references on table "public"."collaborator_module_status" to "service_role";

grant select on table "public"."collaborator_module_status" to "service_role";

grant trigger on table "public"."collaborator_module_status" to "service_role";

grant truncate on table "public"."collaborator_module_status" to "service_role";

grant update on table "public"."collaborator_module_status" to "service_role";

grant delete on table "public"."collaborators" to "anon";

grant insert on table "public"."collaborators" to "anon";

grant references on table "public"."collaborators" to "anon";

grant select on table "public"."collaborators" to "anon";

grant trigger on table "public"."collaborators" to "anon";

grant truncate on table "public"."collaborators" to "anon";

grant update on table "public"."collaborators" to "anon";

grant delete on table "public"."collaborators" to "authenticated";

grant insert on table "public"."collaborators" to "authenticated";

grant references on table "public"."collaborators" to "authenticated";

grant select on table "public"."collaborators" to "authenticated";

grant trigger on table "public"."collaborators" to "authenticated";

grant truncate on table "public"."collaborators" to "authenticated";

grant update on table "public"."collaborators" to "authenticated";

grant delete on table "public"."collaborators" to "service_role";

grant insert on table "public"."collaborators" to "service_role";

grant references on table "public"."collaborators" to "service_role";

grant select on table "public"."collaborators" to "service_role";

grant trigger on table "public"."collaborators" to "service_role";

grant truncate on table "public"."collaborators" to "service_role";

grant update on table "public"."collaborators" to "service_role";

grant delete on table "public"."modules" to "anon";

grant insert on table "public"."modules" to "anon";

grant references on table "public"."modules" to "anon";

grant select on table "public"."modules" to "anon";

grant trigger on table "public"."modules" to "anon";

grant truncate on table "public"."modules" to "anon";

grant update on table "public"."modules" to "anon";

grant delete on table "public"."modules" to "authenticated";

grant insert on table "public"."modules" to "authenticated";

grant references on table "public"."modules" to "authenticated";

grant select on table "public"."modules" to "authenticated";

grant trigger on table "public"."modules" to "authenticated";

grant truncate on table "public"."modules" to "authenticated";

grant update on table "public"."modules" to "authenticated";

grant delete on table "public"."modules" to "service_role";

grant insert on table "public"."modules" to "service_role";

grant references on table "public"."modules" to "service_role";

grant select on table "public"."modules" to "service_role";

grant trigger on table "public"."modules" to "service_role";

grant truncate on table "public"."modules" to "service_role";

grant update on table "public"."modules" to "service_role";

grant delete on table "public"."portal_admins" to "anon";

grant insert on table "public"."portal_admins" to "anon";

grant references on table "public"."portal_admins" to "anon";

grant select on table "public"."portal_admins" to "anon";

grant trigger on table "public"."portal_admins" to "anon";

grant truncate on table "public"."portal_admins" to "anon";

grant update on table "public"."portal_admins" to "anon";

grant delete on table "public"."portal_admins" to "authenticated";

grant insert on table "public"."portal_admins" to "authenticated";

grant references on table "public"."portal_admins" to "authenticated";

grant select on table "public"."portal_admins" to "authenticated";

grant trigger on table "public"."portal_admins" to "authenticated";

grant truncate on table "public"."portal_admins" to "authenticated";

grant update on table "public"."portal_admins" to "authenticated";

grant delete on table "public"."portal_admins" to "service_role";

grant insert on table "public"."portal_admins" to "service_role";

grant references on table "public"."portal_admins" to "service_role";

grant select on table "public"."portal_admins" to "service_role";

grant trigger on table "public"."portal_admins" to "service_role";

grant truncate on table "public"."portal_admins" to "service_role";

grant update on table "public"."portal_admins" to "service_role";


  create policy "categories_admin_write"
  on "public"."categories"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "categories_public_select"
  on "public"."categories"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "collaborator_categories_admin_write"
  on "public"."collaborator_categories"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "collaborator_categories_public_select"
  on "public"."collaborator_categories"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "status_admin_write"
  on "public"."collaborator_module_status"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "status_public_select"
  on "public"."collaborator_module_status"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "collaborators_admin_write"
  on "public"."collaborators"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "collaborators_public_select"
  on "public"."collaborators"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "modules_admin_write"
  on "public"."modules"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "modules_public_select"
  on "public"."modules"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "admins_delete"
  on "public"."portal_admins"
  as permissive
  for delete
  to authenticated
using ((((auth.jwt() ->> 'is_anonymous'::text))::boolean IS NOT TRUE));



  create policy "admins_insert"
  on "public"."portal_admins"
  as permissive
  for insert
  to authenticated
with check ((((auth.jwt() ->> 'is_anonymous'::text))::boolean IS NOT TRUE));



  create policy "admins_select"
  on "public"."portal_admins"
  as permissive
  for select
  to authenticated
using ((((auth.jwt() ->> 'is_anonymous'::text))::boolean IS NOT TRUE));


CREATE TRIGGER collaborator_module_status_touch BEFORE UPDATE ON public.collaborator_module_status FOR EACH ROW EXECUTE FUNCTION public.touch_collaborator_module_status();


