-- 댓글 테이블 (로그인한 사용자가 글에 댓글 작성)
-- Supabase SQL 편집기에서 이 파일을 실행하세요.
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

-- RLS (앱은 service role 로 접근하지만, 직접 접근 대비 기본 정책 설정)
alter table comments enable row level security;
create policy "comments_select" on comments for select using (true);
