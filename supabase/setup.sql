-- Run once in the SQL Editor of a dedicated Supabase project.
begin;
create table public.rehlat_admins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
create table public.rehlat_network (
 id text primary key check (id = 'damascus'),
 routes jsonb not null default '[]'::jsonb check (jsonb_typeof(routes) = 'array' and jsonb_array_length(routes) <= 300),
 revision integer not null default 0 check (revision >= 0),
 updated_at timestamptz not null default now()
);
insert into public.rehlat_network(id) values ('damascus');
alter table public.rehlat_admins enable row level security;
alter table public.rehlat_network enable row level security;
revoke all on public.rehlat_admins from public, anon, authenticated;
revoke all on public.rehlat_network from public, anon, authenticated;
grant select on public.rehlat_admins to authenticated;
grant select on public.rehlat_network to anon, authenticated;
grant update (routes, revision, updated_at) on public.rehlat_network to authenticated;
create policy admin_reads_self on public.rehlat_admins for select to authenticated
 using (user_id = (select auth.uid()));
create policy public_reads_network on public.rehlat_network for select to anon, authenticated using (true);
create policy admin_updates_network on public.rehlat_network for update to authenticated
 using (exists (select 1 from public.rehlat_admins a where a.user_id = (select auth.uid())))
 with check (exists (select 1 from public.rehlat_admins a where a.user_id = (select auth.uid())));
commit;
-- After creating an email/password user in Authentication > Users:
-- insert into public.rehlat_admins(user_id) values ('PASTE_USER_UUID_HERE');
-- Emergency access removal: delete from public.rehlat_admins where user_id = 'UUID';
