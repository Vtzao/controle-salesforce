


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."audit_extract_pk"("p_schema_name" "text", "p_table_name" "text", "p_row" "jsonb") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
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


ALTER FUNCTION "public"."audit_extract_pk"("p_schema_name" "text", "p_table_name" "text", "p_row" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_row_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."audit_row_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_user"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select
    lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'admin'
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', 'email')) <> 'salesforce';
$$;


ALTER FUNCTION "public"."is_admin_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_portal_event"("p_event" "text", "p_payload" "jsonb" DEFAULT '{}'::"jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."log_portal_event"("p_event" "text", "p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_category_with_modules"("p_category_id" "uuid" DEFAULT NULL::"uuid", "p_name" "text" DEFAULT NULL::"text", "p_modules" "jsonb" DEFAULT '[]'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
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


ALTER FUNCTION "public"."save_category_with_modules"("p_category_id" "uuid", "p_name" "text", "p_modules" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_collaborator_with_categories"("p_collaborator_id" "uuid" DEFAULT NULL::"uuid", "p_external_id" "text" DEFAULT NULL::"text", "p_name" "text" DEFAULT NULL::"text", "p_role" "text" DEFAULT NULL::"text", "p_category_ids" "uuid"[] DEFAULT '{}'::"uuid"[]) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
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


ALTER FUNCTION "public"."save_collaborator_with_categories"("p_collaborator_id" "uuid", "p_external_id" "text", "p_name" "text", "p_role" "text", "p_category_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_row_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_row_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."touch_collaborator_module_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;


ALTER FUNCTION "public"."touch_collaborator_module_status"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" bigint NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "txid" bigint DEFAULT "txid_current"() NOT NULL,
    "schema_name" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "action" "text" NOT NULL,
    "record_pk" "jsonb",
    "old_data" "jsonb",
    "new_data" "jsonb",
    "changed_columns" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "actor_id" "uuid",
    "actor_email" "text",
    "actor_role" "text",
    "actor_is_anonymous" boolean,
    "source" "text" DEFAULT 'trigger'::"text" NOT NULL,
    "origin" "text",
    CONSTRAINT "audit_log_action_check" CHECK (("action" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text", 'EVENT'::"text"])))
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


ALTER TABLE "public"."audit_log" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."audit_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "sort_order" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collaborator_categories" (
    "collaborator_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."collaborator_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collaborator_module_status" (
    "collaborator_id" "uuid" NOT NULL,
    "module_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'Pendente'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "collaborator_module_status_status_check" CHECK (("status" = ANY (ARRAY['Pendente'::"text", 'Concluído'::"text", 'Agendado'::"text", 'Não se aplica'::"text"])))
);


ALTER TABLE "public"."collaborator_module_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collaborators" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "external_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."collaborators" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comunicados" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "label" "text" DEFAULT 'COMUNICADO'::"text" NOT NULL,
    "title" "text" NOT NULL,
    "summary" "text" NOT NULL,
    "content" "text" NOT NULL,
    "cta_label" "text" DEFAULT 'Ver detalhes'::"text" NOT NULL,
    "cta_url" "text",
    "published_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."comunicados" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "sort_order" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."noticias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "summary" "text" NOT NULL,
    "content" "text" NOT NULL,
    "category" "text" DEFAULT 'Geral'::"text" NOT NULL,
    "image_url" "text",
    "source_url" "text",
    "published_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_published" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."noticias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."portais" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "icon" "text" DEFAULT 'layout-grid'::"text" NOT NULL,
    "route" "text" DEFAULT ''::"text" NOT NULL,
    "color_classes" "text" DEFAULT 'bg-amber-500/10 text-amber-500'::"text" NOT NULL,
    "color_hex" "text" DEFAULT '#f59e0b'::"text" NOT NULL,
    "image_url" "text",
    "is_external" boolean DEFAULT false NOT NULL,
    "external_url" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."portais" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."portal_admins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "text"
);


ALTER TABLE "public"."portal_admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sistemas_principais" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "icon" "text" DEFAULT 'database'::"text" NOT NULL,
    "color_classes" "text" DEFAULT 'bg-sky-500/10 text-sky-500'::"text" NOT NULL,
    "color_hex" "text" DEFAULT '#f59e0b'::"text" NOT NULL,
    "image_url" "text",
    "url" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sistemas_principais" OWNER TO "postgres";


ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collaborator_categories"
    ADD CONSTRAINT "collaborator_categories_pkey" PRIMARY KEY ("collaborator_id", "category_id");



ALTER TABLE ONLY "public"."collaborator_module_status"
    ADD CONSTRAINT "collaborator_module_status_pkey" PRIMARY KEY ("collaborator_id", "module_id");



ALTER TABLE ONLY "public"."collaborators"
    ADD CONSTRAINT "collaborators_external_id_key" UNIQUE ("external_id");



ALTER TABLE ONLY "public"."collaborators"
    ADD CONSTRAINT "collaborators_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comunicados"
    ADD CONSTRAINT "comunicados_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_category_name_unique" UNIQUE ("category_id", "name");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."noticias"
    ADD CONSTRAINT "noticias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."portais"
    ADD CONSTRAINT "portais_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."portal_admins"
    ADD CONSTRAINT "portal_admins_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."portal_admins"
    ADD CONSTRAINT "portal_admins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sistemas_principais"
    ADD CONSTRAINT "sistemas_principais_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_audit_log_actor_email" ON "public"."audit_log" USING "btree" ("actor_email", "occurred_at" DESC);



CREATE INDEX "idx_audit_log_occurred_at" ON "public"."audit_log" USING "btree" ("occurred_at" DESC);



CREATE INDEX "idx_audit_log_record_pk_gin" ON "public"."audit_log" USING "gin" ("record_pk");



CREATE INDEX "idx_audit_log_table" ON "public"."audit_log" USING "btree" ("schema_name", "table_name", "occurred_at" DESC);



CREATE INDEX "idx_collaborator_categories_category_id" ON "public"."collaborator_categories" USING "btree" ("category_id");



CREATE INDEX "idx_collaborator_module_status_module_id" ON "public"."collaborator_module_status" USING "btree" ("module_id");



CREATE INDEX "idx_collaborators_is_active" ON "public"."collaborators" USING "btree" ("is_active");



CREATE INDEX "idx_comunicados_published_at" ON "public"."comunicados" USING "btree" ("published_at" DESC);



CREATE INDEX "idx_modules_category_id" ON "public"."modules" USING "btree" ("category_id");



CREATE INDEX "idx_noticias_published_at" ON "public"."noticias" USING "btree" ("published_at" DESC);



CREATE INDEX "idx_portais_sort_order" ON "public"."portais" USING "btree" ("sort_order");



CREATE INDEX "idx_sistemas_principais_sort_order" ON "public"."sistemas_principais" USING "btree" ("sort_order");



CREATE OR REPLACE TRIGGER "audit_row_change_categories" AFTER INSERT OR DELETE OR UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."audit_row_change"();



CREATE OR REPLACE TRIGGER "audit_row_change_collaborator_categories" AFTER INSERT OR DELETE OR UPDATE ON "public"."collaborator_categories" FOR EACH ROW EXECUTE FUNCTION "public"."audit_row_change"();



CREATE OR REPLACE TRIGGER "audit_row_change_collaborator_module_status" AFTER INSERT OR DELETE OR UPDATE ON "public"."collaborator_module_status" FOR EACH ROW EXECUTE FUNCTION "public"."audit_row_change"();



CREATE OR REPLACE TRIGGER "audit_row_change_collaborators" AFTER INSERT OR DELETE OR UPDATE ON "public"."collaborators" FOR EACH ROW EXECUTE FUNCTION "public"."audit_row_change"();



CREATE OR REPLACE TRIGGER "audit_row_change_modules" AFTER INSERT OR DELETE OR UPDATE ON "public"."modules" FOR EACH ROW EXECUTE FUNCTION "public"."audit_row_change"();



CREATE OR REPLACE TRIGGER "audit_row_change_portal_admins" AFTER INSERT OR DELETE OR UPDATE ON "public"."portal_admins" FOR EACH ROW EXECUTE FUNCTION "public"."audit_row_change"();



CREATE OR REPLACE TRIGGER "collaborator_module_status_touch" BEFORE UPDATE ON "public"."collaborator_module_status" FOR EACH ROW EXECUTE FUNCTION "public"."touch_collaborator_module_status"();



CREATE OR REPLACE TRIGGER "trg_comunicados_updated_at" BEFORE UPDATE ON "public"."comunicados" FOR EACH ROW EXECUTE FUNCTION "public"."set_row_updated_at"();



CREATE OR REPLACE TRIGGER "trg_noticias_updated_at" BEFORE UPDATE ON "public"."noticias" FOR EACH ROW EXECUTE FUNCTION "public"."set_row_updated_at"();



CREATE OR REPLACE TRIGGER "trg_portais_updated_at" BEFORE UPDATE ON "public"."portais" FOR EACH ROW EXECUTE FUNCTION "public"."set_row_updated_at"();



CREATE OR REPLACE TRIGGER "trg_sistemas_principais_updated_at" BEFORE UPDATE ON "public"."sistemas_principais" FOR EACH ROW EXECUTE FUNCTION "public"."set_row_updated_at"();



ALTER TABLE ONLY "public"."collaborator_categories"
    ADD CONSTRAINT "collaborator_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collaborator_categories"
    ADD CONSTRAINT "collaborator_categories_collaborator_id_fkey" FOREIGN KEY ("collaborator_id") REFERENCES "public"."collaborators"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collaborator_module_status"
    ADD CONSTRAINT "collaborator_module_status_collaborator_id_fkey" FOREIGN KEY ("collaborator_id") REFERENCES "public"."collaborators"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collaborator_module_status"
    ADD CONSTRAINT "collaborator_module_status_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



CREATE POLICY "admin_manage_comunicados" ON "public"."comunicados" TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "admin_manage_noticias" ON "public"."noticias" TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "admin_manage_portais" ON "public"."portais" TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "admin_manage_sistemas_principais" ON "public"."sistemas_principais" TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "admins_delete" ON "public"."portal_admins" FOR DELETE TO "authenticated" USING (((("auth"."jwt"() ->> 'is_anonymous'::"text"))::boolean IS NOT TRUE));



CREATE POLICY "admins_insert" ON "public"."portal_admins" FOR INSERT TO "authenticated" WITH CHECK (((("auth"."jwt"() ->> 'is_anonymous'::"text"))::boolean IS NOT TRUE));



CREATE POLICY "admins_select" ON "public"."portal_admins" FOR SELECT TO "authenticated" USING (((("auth"."jwt"() ->> 'is_anonymous'::"text"))::boolean IS NOT TRUE));



CREATE POLICY "admins_update" ON "public"."portal_admins" FOR UPDATE TO "authenticated" USING (((("auth"."jwt"() ->> 'is_anonymous'::"text"))::boolean IS NOT TRUE)) WITH CHECK (((("auth"."jwt"() ->> 'is_anonymous'::"text"))::boolean IS NOT TRUE));



ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_log_admin_select" ON "public"."audit_log" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "authenticated_read_comunicados" ON "public"."comunicados" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_read_noticias" ON "public"."noticias" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_read_portais" ON "public"."portais" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_read_sistemas_principais" ON "public"."sistemas_principais" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categories_admin_write" ON "public"."categories" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "categories_public_select" ON "public"."categories" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."collaborator_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "collaborator_categories_admin_write" ON "public"."collaborator_categories" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "collaborator_categories_public_select" ON "public"."collaborator_categories" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."collaborator_module_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collaborators" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "collaborators_admin_write" ON "public"."collaborators" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "collaborators_public_select" ON "public"."collaborators" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."comunicados" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."modules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "modules_admin_write" ON "public"."modules" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "modules_public_select" ON "public"."modules" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."noticias" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."portais" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."portal_admins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sistemas_principais" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "status_admin_write" ON "public"."collaborator_module_status" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "status_public_select" ON "public"."collaborator_module_status" FOR SELECT TO "authenticated", "anon" USING (true);



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_extract_pk"("p_schema_name" "text", "p_table_name" "text", "p_row" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."audit_extract_pk"("p_schema_name" "text", "p_table_name" "text", "p_row" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_extract_pk"("p_schema_name" "text", "p_table_name" "text", "p_row" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."audit_row_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_row_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_row_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."log_portal_event"("p_event" "text", "p_payload" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_portal_event"("p_event" "text", "p_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_portal_event"("p_event" "text", "p_payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."save_category_with_modules"("p_category_id" "uuid", "p_name" "text", "p_modules" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."save_category_with_modules"("p_category_id" "uuid", "p_name" "text", "p_modules" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_category_with_modules"("p_category_id" "uuid", "p_name" "text", "p_modules" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."save_collaborator_with_categories"("p_collaborator_id" "uuid", "p_external_id" "text", "p_name" "text", "p_role" "text", "p_category_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."save_collaborator_with_categories"("p_collaborator_id" "uuid", "p_external_id" "text", "p_name" "text", "p_role" "text", "p_category_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_collaborator_with_categories"("p_collaborator_id" "uuid", "p_external_id" "text", "p_name" "text", "p_role" "text", "p_category_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_row_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_row_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_row_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."touch_collaborator_module_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."touch_collaborator_module_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."touch_collaborator_module_status"() TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "service_role";
GRANT SELECT ON TABLE "public"."audit_log" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."collaborator_categories" TO "anon";
GRANT ALL ON TABLE "public"."collaborator_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."collaborator_categories" TO "service_role";



GRANT ALL ON TABLE "public"."collaborator_module_status" TO "anon";
GRANT ALL ON TABLE "public"."collaborator_module_status" TO "authenticated";
GRANT ALL ON TABLE "public"."collaborator_module_status" TO "service_role";



GRANT ALL ON TABLE "public"."collaborators" TO "anon";
GRANT ALL ON TABLE "public"."collaborators" TO "authenticated";
GRANT ALL ON TABLE "public"."collaborators" TO "service_role";



GRANT ALL ON TABLE "public"."comunicados" TO "anon";
GRANT ALL ON TABLE "public"."comunicados" TO "authenticated";
GRANT ALL ON TABLE "public"."comunicados" TO "service_role";



GRANT ALL ON TABLE "public"."modules" TO "anon";
GRANT ALL ON TABLE "public"."modules" TO "authenticated";
GRANT ALL ON TABLE "public"."modules" TO "service_role";



GRANT ALL ON TABLE "public"."noticias" TO "anon";
GRANT ALL ON TABLE "public"."noticias" TO "authenticated";
GRANT ALL ON TABLE "public"."noticias" TO "service_role";



GRANT ALL ON TABLE "public"."portais" TO "anon";
GRANT ALL ON TABLE "public"."portais" TO "authenticated";
GRANT ALL ON TABLE "public"."portais" TO "service_role";



GRANT ALL ON TABLE "public"."portal_admins" TO "anon";
GRANT ALL ON TABLE "public"."portal_admins" TO "authenticated";
GRANT ALL ON TABLE "public"."portal_admins" TO "service_role";



GRANT ALL ON TABLE "public"."sistemas_principais" TO "anon";
GRANT ALL ON TABLE "public"."sistemas_principais" TO "authenticated";
GRANT ALL ON TABLE "public"."sistemas_principais" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







