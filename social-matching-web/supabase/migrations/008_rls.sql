alter table public.profiles enable row level security;
alter table public.matching_responses enable row level security;
alter table public.user_roles enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.email_templates enable row level security;
alter table public.email_queue enable row level security;
alter table public.message_logs enable row level security;

create policy profiles_select_own_or_admin
  on public.profiles
  for select
  using (id = auth.uid() or public.is_admin());

create policy profiles_insert_own
  on public.profiles
  for insert
  with check (id = auth.uid());

create policy profiles_update_own
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy matching_responses_select_own
  on public.matching_responses
  for select
  using (user_id = auth.uid());

create policy matching_responses_insert_own
  on public.matching_responses
  for insert
  with check (user_id = auth.uid());

create policy matching_responses_update_own
  on public.matching_responses
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy user_roles_select_self_or_admin
  on public.user_roles
  for select
  using (user_id = auth.uid() or public.is_admin());

create policy user_roles_admin_insert
  on public.user_roles
  for insert
  with check (public.is_admin());

create policy user_roles_admin_update
  on public.user_roles
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy user_roles_admin_delete
  on public.user_roles
  for delete
  using (public.is_admin());

create policy events_select_visible_or_related
  on public.events
  for select
  using (
    is_published = true
    or created_by_user_id = auth.uid()
    or host_user_id = auth.uid()
    or public.user_has_registration_for_event(id, auth.uid())
    or public.is_admin()
  );

create policy events_insert_own_draft
  on public.events
  for insert
  with check (
    created_by_user_id = auth.uid()
    and host_user_id is null
    and is_published = false
    and status = 'draft'
    and public.is_questionnaire_ready(auth.uid())
  );

create policy events_update_creator_draft
  on public.events
  for update
  using (
    created_by_user_id = auth.uid()
    and status = 'draft'
  )
  with check (
    created_by_user_id = auth.uid()
    and host_user_id is null
    and is_published = false
    and status in ('draft', 'submitted_for_review')
  );

create policy events_update_admin
  on public.events
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy event_registrations_select_related
  on public.event_registrations
  for select
  using (
    user_id = auth.uid()
    or public.is_admin()
  );

create policy email_templates_admin_select
  on public.email_templates
  for select
  using (public.is_admin());

create policy email_templates_admin_insert
  on public.email_templates
  for insert
  with check (public.is_admin());

create policy email_templates_admin_update
  on public.email_templates
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy email_templates_admin_delete
  on public.email_templates
  for delete
  using (public.is_admin());

create policy email_queue_admin_select
  on public.email_queue
  for select
  using (public.is_admin());

create policy message_logs_admin_select
  on public.message_logs
  for select
  using (public.is_admin());
