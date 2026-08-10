create table "public"."custom_pages" (
    "id" uuid primary key default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "project_id" uuid not null references "public"."projects"("id") on delete cascade,
    "title" text not null,
    "slug" text not null,
    "content" text not null default '',
    "seo_title" text,
    "seo_description" text,
    "published" boolean not null default false,
    "show_in_header" boolean not null default false,
    "show_in_footer" boolean not null default false,
    "sort_order" integer not null default 0,
    constraint "custom_pages_title_check" check (char_length(btrim(title)) between 1 and 120),
    constraint "custom_pages_slug_check" check (
      char_length(slug) between 1 and 80
      and slug = lower(slug)
      and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      and slug <> all (array['feedback', 'changelog', 'dash', 'api', 'auth', 'home', 'login', 'signup', 'invite', 'settings', '_next', 'favicon.ico', 'robots.txt', 'sitemap.xml'])
    ),
    constraint "custom_pages_content_check" check (char_length(content) <= 100000),
    constraint "custom_pages_seo_title_check" check (seo_title is null or char_length(seo_title) <= 70),
    constraint "custom_pages_seo_description_check" check (seo_description is null or char_length(seo_description) <= 300),
    constraint "custom_pages_sort_order_check" check (sort_order between -10000 and 10000),
    constraint "custom_pages_project_id_slug_key" unique (project_id, slug)
);

create index "custom_pages_project_id_idx" on "public"."custom_pages" using btree (project_id);
create index "custom_pages_public_navigation_idx"
  on "public"."custom_pages" using btree (project_id, sort_order, title)
  where published = true;

create or replace function "public"."set_custom_pages_updated_at"()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.project_id <> old.project_id then
    raise exception 'custom_pages.project_id is immutable';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create trigger "set_custom_pages_updated_at"
before update on "public"."custom_pages"
for each row execute function "public"."set_custom_pages_updated_at"();

create or replace function "public"."is_allowed_project_api_token"(
  api_token text,
  target_project_id uuid,
  allowed_permissions "public"."token_type"[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from "public"."project_api_keys"
    where "project_api_keys"."token" = api_token
      and "project_api_keys"."project_id" = target_project_id
      and "project_api_keys"."permission" = any(allowed_permissions)
  );
$$;

alter table "public"."custom_pages" enable row level security;

create policy "Published custom pages are publicly readable"
on "public"."custom_pages"
for select
to anon, authenticated
using (published = true);

create policy "Project members can read custom pages"
on "public"."custom_pages"
for select
to authenticated
using (
  exists (
    select 1
    from "public"."project_members"
    where "project_members"."project_id" = "custom_pages"."project_id"
      and "project_members"."member_id" = auth.uid()
  )
);

create policy "Project members can insert custom pages"
on "public"."custom_pages"
for insert
to authenticated
with check (
  exists (
    select 1
    from "public"."project_members"
    where "project_members"."project_id" = "custom_pages"."project_id"
      and "project_members"."member_id" = auth.uid()
  )
);

create policy "Project members can update custom pages"
on "public"."custom_pages"
for update
to authenticated
using (
  exists (
    select 1
    from "public"."project_members"
    where "project_members"."project_id" = "custom_pages"."project_id"
      and "project_members"."member_id" = auth.uid()
  )
)
with check (
  exists (
    select 1
    from "public"."project_members"
    where "project_members"."project_id" = "custom_pages"."project_id"
      and "project_members"."member_id" = auth.uid()
  )
);

create policy "Project members can delete custom pages"
on "public"."custom_pages"
for delete
to authenticated
using (
  exists (
    select 1
    from "public"."project_members"
    where "project_members"."project_id" = "custom_pages"."project_id"
      and "project_members"."member_id" = auth.uid()
  )
);

create policy "Full-access project API keys can manage custom pages"
on "public"."custom_pages"
for all
to anon
using (
  "public"."is_allowed_project_api_token"(
    ((current_setting('request.headers'::text, true))::json ->> 'lumkey'::text),
    project_id,
    '{full_access}'::"public"."token_type"[]
  )
)
with check (
  "public"."is_allowed_project_api_token"(
    ((current_setting('request.headers'::text, true))::json ->> 'lumkey'::text),
    project_id,
    '{full_access}'::"public"."token_type"[]
  )
);

grant select, insert, update, delete on table "public"."custom_pages" to anon;
grant select, insert, update, delete on table "public"."custom_pages" to authenticated;
grant all on table "public"."custom_pages" to service_role;
grant execute on function "public"."set_custom_pages_updated_at"() to service_role;
grant execute on function "public"."is_allowed_project_api_token"(text, uuid, "public"."token_type"[]) to anon, authenticated, service_role;
