create table if not exists public.home_notice_banner (
  key text primary key default 'main',
  title text not null default '',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint home_notice_banner_singleton check (key = 'main')
);

create or replace function public.set_home_notice_banner_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_home_notice_banner_updated_at on public.home_notice_banner;
create trigger trg_home_notice_banner_updated_at
before update on public.home_notice_banner
for each row
execute procedure public.set_home_notice_banner_updated_at();

insert into public.home_notice_banner (key, title, content)
values ('main', '', '')
on conflict (key) do nothing;

alter table public.home_notice_banner enable row level security;

drop policy if exists "home_notice_banner_select_all" on public.home_notice_banner;
create policy "home_notice_banner_select_all"
on public.home_notice_banner
for select
using (true);
