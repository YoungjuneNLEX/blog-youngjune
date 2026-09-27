-- ⚠️ 이 파일은 초기 설계안이며, 실제 Supabase DB 와 다릅니다.
--    (2026-09 확인) 실제 DB 를 기준으로 삼으세요. 이 파일은 참고용 기록입니다.
--
--    실제 DB 와 다른 점
--      · comments 테이블 : 실제 DB에 **없음**. 이 파일에만 있다.
--                          적바림에서는 댓글 기능을 쓰지 않으므로 앱에서도 제거했다.
--      · books 테이블    : 실제 DB에는 **있지만** 이 파일에는 없다.
--      · posts 컬럼      : 실제 DB에는 thumbnail_url, excerpt 가 더 있다.
--      · RLS 정책        : 아래 정책들은 모두 제거되었다. 현재 public 스키마 정책 0개.
--                          supabase/fix-rls.sql 참고.
--
--    앞으로 DB 변경 SQL 은 이 파일이 아니라 실제 DB 상태를 조회해서 만든다.

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

-- 댓글 테이블 — 실제 DB에 생성된 적이 없고, 적바림에서 댓글 기능을 제거했으므로 사용하지 않는다.
-- 댓글 테이블 (로그인한 사용자가 글에 댓글 작성)
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete set null,
  author_name text,
  author_avatar text,
  content text not null,
  created_at timestamptz default now()
);
create index if not exists comments_post_id_idx on comments(post_id, created_at);

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
