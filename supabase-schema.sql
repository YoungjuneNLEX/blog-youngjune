-- 회원 프로필 테이블
create table if not exists profiles (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  name text,
  avatar_url text,
  role text default 'reader' check (role in ('admin', 'writer', 'reader')),
  created_at timestamptz default now()
);

-- 글 테이블
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text,
  category text,
  tags text[],
  visibility text default 'public' check (visibility in ('public', 'members')),
  published boolean default false,
  author_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 사이트 설정 (key/value) 테이블 — 소개글, 사이트 커스터마이즈(site_config) 등 저장
create table if not exists site_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger posts_updated_at
  before update on posts
  for each row execute function update_updated_at();

-- RLS 활성화
alter table profiles enable row level security;
alter table posts enable row level security;

-- profiles: 누구나 읽기 가능, 본인만 수정
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (auth.uid()::text = id::text);

-- posts: public 글은 누구나, members 글은 로그인 필요
create policy "posts_select_public" on posts for select using (
  published = true and visibility = 'public'
);
create policy "posts_select_members" on posts for select using (
  published = true and visibility = 'members' and auth.role() = 'authenticated'
);
create policy "posts_insert" on posts for insert with check (true);
create policy "posts_update" on posts for update using (true);
create policy "posts_delete" on posts for delete using (true);
