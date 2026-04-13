-- Add soft activation flag for collaborators.

alter table public.collaborators
    add column if not exists is_active boolean not null default true;

update public.collaborators
set is_active = true
where is_active is null;

create index if not exists idx_collaborators_is_active
    on public.collaborators (is_active);
