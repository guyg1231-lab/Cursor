-- Optimize RLS policies by wrapping auth helper calls in SELECT initplans
-- (Supabase advisor: auth_rls_initplan).
-- Behavior stays the same; only evaluation strategy changes.

do $$
begin
  if to_regclass('public.profiles') is not null then
    execute 'drop policy if exists profiles_select_own_or_admin on public.profiles';
    execute 'drop policy if exists profiles_insert_own on public.profiles';
    execute 'drop policy if exists profiles_update_own on public.profiles';

    execute 'create policy profiles_select_own_or_admin
      on public.profiles for select
      using (id = (select auth.uid()) or public.is_admin())';

    execute 'create policy profiles_insert_own
      on public.profiles for insert
      with check (id = (select auth.uid()))';

    execute 'create policy profiles_update_own
      on public.profiles for update
      using (id = (select auth.uid()))
      with check (id = (select auth.uid()))';
  end if;

  if to_regclass('public.matching_responses') is not null then
    execute 'drop policy if exists matching_responses_select_own on public.matching_responses';
    execute 'drop policy if exists matching_responses_insert_own on public.matching_responses';
    execute 'drop policy if exists matching_responses_update_own on public.matching_responses';

    execute 'create policy matching_responses_select_own
      on public.matching_responses for select
      using (user_id = (select auth.uid()))';

    execute 'create policy matching_responses_insert_own
      on public.matching_responses for insert
      with check (user_id = (select auth.uid()))';

    execute 'create policy matching_responses_update_own
      on public.matching_responses for update
      using (user_id = (select auth.uid()))
      with check (user_id = (select auth.uid()))';
  end if;

  if to_regclass('public.user_roles') is not null then
    execute 'drop policy if exists user_roles_select_self_or_admin on public.user_roles';
    execute 'create policy user_roles_select_self_or_admin
      on public.user_roles for select
      using (user_id = (select auth.uid()) or public.is_admin())';
  end if;

  if to_regclass('public.events') is not null then
    execute 'drop policy if exists events_select_visible_or_related on public.events';
    execute 'drop policy if exists events_insert_own_draft on public.events';
    execute 'drop policy if exists events_update_creator_draft on public.events';

    execute 'create policy events_select_visible_or_related
      on public.events for select
      using (
        is_published = true
        or created_by_user_id = (select auth.uid())
        or host_user_id = (select auth.uid())
        or public.user_has_registration_for_event(id, (select auth.uid()))
        or public.is_admin()
      )';

    execute 'create policy events_insert_own_draft
      on public.events for insert
      with check (
        created_by_user_id = (select auth.uid())
        and host_user_id is null
        and is_published = false
        and status = ''draft''
        and public.is_questionnaire_ready((select auth.uid()))
      )';

    execute 'create policy events_update_creator_draft
      on public.events for update
      using (
        created_by_user_id = (select auth.uid())
        and status = ''draft''
      )
      with check (
        created_by_user_id = (select auth.uid())
        and host_user_id is null
        and is_published = false
        and status in (''draft'', ''submitted_for_review'')
      )';
  end if;

  if to_regclass('public.event_registrations') is not null then
    execute 'drop policy if exists event_registrations_select_related on public.event_registrations';
    execute 'create policy event_registrations_select_related
      on public.event_registrations for select
      using (
        user_id = (select auth.uid())
        or public.is_admin()
      )';
  end if;

  if to_regclass('public.registration_payments') is not null then
    execute 'drop policy if exists registration_payments_select_own_or_admin on public.registration_payments';
    execute 'create policy registration_payments_select_own_or_admin
      on public.registration_payments for select
      using (
        user_id = (select auth.uid())
        or public.is_admin()
      )';
  end if;
end $$;
