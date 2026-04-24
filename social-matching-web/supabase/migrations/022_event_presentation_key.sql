-- Keep event visual identity stable across environments without relying on title matching.
alter table public.events
add column if not exists presentation_key text;

alter table public.events
drop constraint if exists events_presentation_key_check;

alter table public.events
add constraint events_presentation_key_check
check (
  presentation_key is null
  or presentation_key in (
    'picnic',
    'beach-volleyball',
    'promenade-walk',
    'coffee-square',
    'young-house',
    'cinemateque',
    'default'
  )
);

create index if not exists events_presentation_key_idx on public.events (presentation_key);
