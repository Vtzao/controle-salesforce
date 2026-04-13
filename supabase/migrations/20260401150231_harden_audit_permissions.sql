-- Harden permissions for audit objects.

revoke all on table public.audit_log from anon, authenticated;
grant select on table public.audit_log to authenticated;
grant all on table public.audit_log to service_role;

revoke all on sequence public.audit_log_id_seq from anon, authenticated;
grant usage, select on sequence public.audit_log_id_seq to service_role;

revoke all on function public.log_portal_event(text, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.log_portal_event(text, jsonb) to authenticated, service_role;
