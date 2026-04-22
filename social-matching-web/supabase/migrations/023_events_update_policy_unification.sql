-- Consolidate events UPDATE RLS policies to a single permissive policy.
-- This keeps existing behavior but removes "multiple_permissive_policies" advisor warnings.

do $$
begin
  if to_regclass('public.events') is null then
    return;
  end if;

  execute 'drop policy if exists events_update_admin on public.events';
  execute 'drop policy if exists events_update_creator_draft on public.events';

  execute 'create policy events_update_creator_or_admin
    on public.events
    for update
    to authenticated
    using (
      public.is_admin()
      or (
        created_by_user_id = (select auth.uid())
        and status = ''draft''
      )
    )
    with check (
      public.is_admin()
      or (
        created_by_user_id = (select auth.uid())
        and host_user_id is null
        and is_published = false
        and status in (''draft'', ''submitted_for_review'')
      )
    )';
end $$;
