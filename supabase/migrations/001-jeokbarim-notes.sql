-- 적바림 2단계 — posts 테이블에 메모/주제/요약 붙이기
--
-- [실행 방법] Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.
-- [되돌리기]  파일 맨 아래 주석에 되돌리는 SQL 을 적어 뒀습니다.
--
-- 실행 전 실제 DB 상태 (확인 완료)
--   posts 10개 (발행 8), category: 에세이 8 · 소설 2, null 없음
--   title 은 NOT NULL, books 테이블은 그대로 둔다
--
-- 무엇이 바뀌나
--   1) posts 에 컬럼 4개 추가 : kind, topic, summary, source_note_ids
--   2) title 의 기본값을 '' 로  (메모는 제목이 없다. NOT NULL 은 그대로 유지)
--   3) 기존 category 를 topic 으로 복사 : 소설 → 상상, 에세이 → 생각
--   4) 목록·필터용 인덱스 3개
--   기존 글 10개는 전부 kind='article' 이 되어 지금처럼 긴 글로 남는다.
--   category 컬럼은 지우지 않는다. 노트 창고에서 주제를 다시 정리한 뒤 나중 단계에서 뺀다.

begin;

-- ── 1. 컬럼 추가 ────────────────────────────────────────────────
alter table public.posts
  -- 'note'  : 빠른 메모 (제목 없음, 표지 없음)
  -- 'article': 긴 글 (제목·표지 있음, 발행 시 AI 요약)
  add column if not exists kind text not null default 'article',
  -- 적바림 주제. 목록은 site_settings 의 site_config.topics 에서 관리한다.
  add column if not exists topic text,
  -- 발행할 때 한 번 만들어 저장하는 세 줄 요약. 방문자 화면은 이것만 읽는다.
  add column if not exists summary text,
  -- 이 긴 글이 어느 메모들에서 나왔는지 (5단계 "묶어서 글 초안 만들기"에서 채운다)
  add column if not exists source_note_ids uuid[] not null default '{}';

-- kind 는 두 값만 허용
alter table public.posts drop constraint if exists posts_kind_check;
alter table public.posts add constraint posts_kind_check
  check (kind in ('note', 'article'));

-- ── 2. 메모는 제목이 없다 ───────────────────────────────────────
-- title 이 NOT NULL 이므로 제약을 푸는 대신 빈 문자열을 기본값으로 둔다.
alter table public.posts alter column title set default '';

-- ── 3. category → topic 복사 ────────────────────────────────────
-- 지금 있는 값은 '에세이'와 '소설' 뿐이다. 나머지는 '생각'으로 모아 두고
-- 노트 창고에서 다시 분류한다.
update public.posts set topic = '상상' where topic is null and category = '소설';
update public.posts set topic = '생각' where topic is null and category = '에세이';
update public.posts set topic = '생각' where topic is null;

-- ── 4. 인덱스 ───────────────────────────────────────────────────
-- 노트 창고: 종류별 최신순
create index if not exists posts_kind_created_idx
  on public.posts (kind, created_at desc);
-- 주제별 보기
create index if not exists posts_topic_idx
  on public.posts (topic);
-- 공개 페이지: 발행된 글 최신순
create index if not exists posts_published_created_idx
  on public.posts (published, created_at desc);

commit;


-- ════════════════════════════════════════════════════════════════
-- 실행 후 확인
-- ════════════════════════════════════════════════════════════════

-- 확인 1) 컬럼 4개가 생겼는지
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'posts'
  and column_name in ('kind', 'topic', 'summary', 'source_note_ids', 'title')
order by column_name;

-- 확인 2) 기존 글 10개가 전부 article 이고 topic 이 채워졌는지
--         → 생각 8, 상상 2 가 나와야 한다
select kind, topic, count(*)
from public.posts
group by kind, topic
order by kind, topic;

-- 확인 3) RLS 는 그대로 켜져 있고 정책은 0개여야 한다
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename = 'posts';
select count(*) as 정책수 from pg_policies where schemaname = 'public';


-- ════════════════════════════════════════════════════════════════
-- 되돌리기 (문제가 생겼을 때만)
-- ════════════════════════════════════════════════════════════════
-- begin;
-- drop index if exists public.posts_kind_created_idx;
-- drop index if exists public.posts_topic_idx;
-- drop index if exists public.posts_published_created_idx;
-- alter table public.posts drop constraint if exists posts_kind_check;
-- alter table public.posts alter column title drop default;
-- alter table public.posts
--   drop column if exists kind,
--   drop column if exists topic,
--   drop column if exists summary,
--   drop column if exists source_note_ids;
-- commit;
