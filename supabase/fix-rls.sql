-- 적바림 — RLS(행 수준 보안) 정리  [실행 완료본]
--
-- 이 파일은 "앞으로 실행할 것"이 아니라 **이미 실제 DB에 실행한 내용**입니다.
-- 같은 상태를 다시 만들어야 할 때(프로젝트 복구·이전 등) 그대로 다시 쓸 수 있도록
-- 멱등하게(여러 번 실행해도 결과가 같게) 작성해 두었습니다.
--
-- ── 실행 당시 실제 DB 상태 ──────────────────────────────────────
--   public 스키마 테이블 4개 : posts, profiles, site_settings, books
--   RLS                      : 4개 모두 이미 켜져 있었음
--   정책                     : posts 5개, profiles 2개  (site_settings·books 는 0개)
--   Storage 정책             : 없음
--
-- ── 실행 결과 ──────────────────────────────────────────────────
--   정책 7개를 모두 제거 → public 스키마 정책 0개.
--   RLS 가 켜져 있고 정책이 하나도 없으므로 anon 키로는 아무것도 할 수 없다.
--   service role 키는 RLS 를 우회하므로 앱 동작에는 영향이 없다.
--
-- ── 주의: supabase-schema.sql 과 실제 DB 는 다릅니다 ────────────
--   · comments 테이블은 실제 DB에 **없습니다**. (schema 파일에는 있음)
--     → 첫 시도에서 comments 를 건드리다 에러가 났고, 트랜잭션이라 통째로 취소되었습니다.
--   · books 테이블은 schema 파일에 없지만 실제 DB에는 **있습니다**.
--   · posts 테이블의 thumbnail_url·excerpt 컬럼도 schema 파일에 없습니다.
--   앞으로 DB 변경 SQL 은 schema 파일이 아니라 **실제 DB 기준**으로 만듭니다.
--
-- ── 왜 필요했나 ────────────────────────────────────────────────
--   앱의 DB 접근은 전부 서버에서 service role 키로만 이뤄지고,
--   브라우저에 노출되는 anon 키는 앱 어디에서도 쓰지 않습니다.
--   그런데 아래 정책들이 anon 키에 열려 있었습니다.
--     · posts   : insert / update / delete 가 조건 없이 true
--                 → 누구나 글을 쓰고, 남의 글을 고치고, 전부 지울 수 있었음
--     · profiles: select 가 조건 없이 true
--                 → 회원 이메일 주소가 그대로 조회되었음

begin;

-- ── 1. RLS 켜기 (이미 켜져 있었지만, 복구용으로 남겨 둠) ─────────
alter table if exists public.posts         enable row level security;
alter table if exists public.profiles      enable row level security;
alter table if exists public.site_settings enable row level security;
alter table if exists public.books         enable row level security;

-- ── 2. posts 정책 5개 제거 ──────────────────────────────────────
-- 쓰기 3개가 실제 위험이었다. 읽기 2개는 앱이 쓰지 않는 통로라 함께 정리.
drop policy if exists "posts_insert"         on public.posts;
drop policy if exists "posts_update"         on public.posts;
drop policy if exists "posts_delete"         on public.posts;
drop policy if exists "posts_select_public"  on public.posts;
drop policy if exists "posts_select_members" on public.posts;

-- ── 3. profiles 정책 2개 제거 ───────────────────────────────────
-- profiles_select 가 이메일 유출 지점이었다.
drop policy if exists "profiles_select" on public.profiles;
-- profiles_update 는 auth.uid() 를 쓰는데, 이 앱은 NextAuth 로 로그인하므로
-- Postgres 쪽 auth.uid() 는 항상 NULL 이다. 즉 아무것도 허용하지 않던 정책이다.
drop policy if exists "profiles_update" on public.profiles;

commit;


-- ════════════════════════════════════════════════════════════════
-- 확인 쿼리 (실행 후 상태 점검용 — 지금은 아래대로 나오는 것이 정상)
-- ════════════════════════════════════════════════════════════════

-- 확인 1) 테이블 4개가 모두 rowsecurity = true 여야 한다.
select tablename, rowsecurity as "RLS 켜짐"
from pg_tables
where schemaname = 'public'
order by tablename;

-- 확인 2) 남은 정책. 아무 행도 나오지 않아야 정상.
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 확인 3) Storage 정책. 현재 0건.
--         나중에 roles 에 anon 이 있으면서 cmd 가 INSERT/UPDATE/DELETE 인 줄이 생기면
--         누구나 파일을 올리거나 지울 수 있다는 뜻이다.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
