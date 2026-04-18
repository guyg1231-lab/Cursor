create or replace function public.enqueue_email_queue(
  p_event_id uuid,
  p_registration_id uuid,
  p_user_id uuid,
  p_template_key public.template_key_type,
  p_idempotency_key text default null
)
returns table(queue_id uuid, queue_status public.message_status_type, idempotency_key text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_idempotency_key is null then
    insert into public.email_queue (
      event_id,
      registration_id,
      user_id,
      template_key
    )
    values (
      p_event_id,
      p_registration_id,
      p_user_id,
      p_template_key
    )
    returning id, status, email_queue.idempotency_key
    into queue_id, queue_status, idempotency_key;
  else
    execute $sql$
      insert into public.email_queue (
        event_id,
        registration_id,
        user_id,
        template_key,
        idempotency_key
      )
      values ($1, $2, $3, $4::public.template_key_type, $5)
      on conflict (idempotency_key)
      do update
        set updated_at = now()
      returning id, status, email_queue.idempotency_key
    $sql$
    into strict queue_id, queue_status, idempotency_key
    using p_event_id, p_registration_id, p_user_id, p_template_key, p_idempotency_key;
  end if;

  return next;
end;
$$;
