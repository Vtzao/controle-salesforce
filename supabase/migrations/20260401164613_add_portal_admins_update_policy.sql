-- Allow authenticated non-anonymous admins to update existing portal_admins rows.

drop policy if exists admins_update on public.portal_admins;
create policy admins_update
on public.portal_admins
for update
to authenticated
using ((auth.jwt() ->> 'is_anonymous')::boolean is not true)
with check ((auth.jwt() ->> 'is_anonymous')::boolean is not true);
