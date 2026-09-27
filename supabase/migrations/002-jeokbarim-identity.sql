-- 적바림 3단계 — 사이트 이름과 색을 적바림으로
--
-- [실행 방법] Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.
--
-- 왜 SQL 로 하나
--   화면에 보이는 사이트 이름은 코드의 기본값이 아니라
--   site_settings 테이블의 site_config JSON 에 저장된 값이다.
--   코드 기본값만 바꾸면 실제 사이트는 그대로 "1인 서점"으로 남는다.
--
-- 무엇이 바뀌나
--   1) 사이트 이름·문구·푸터 이름 → 적바림
--   2) 보조 글자 #7a5c44 → #6b4f3a, 흐린 글자 #b09880 → #8a6f58 (시안 README 의 색)
--   3) 옛 서점 문구(최신 글 / 책장 섹션 제목)를 적바림 말로
--   theme 의 나머지 색과 섹션 순서·숨김 설정은 건드리지 않는다.

begin;

-- 설정 행이 아직 없으면 만들지 않는다. (없으면 코드 기본값이 쓰인다)
update public.site_settings
set value = (
  value::jsonb
  -- 이름·문구
  || jsonb_build_object(
       'siteName',       '적바림',
       'siteEyebrow',    'JEOKBARIM',
       'heroTitle',      '적어 두면 남는다',
       'latestTitle',    '최근 글',
       'bookshelfTitle', '책장',
       'footerName',     '적바림'
     )
  -- 보조 글자색만 교체하고 나머지 테마 색은 그대로 둔다
  || jsonb_build_object(
       'theme',
       coalesce(value::jsonb -> 'theme', '{}'::jsonb)
         || jsonb_build_object('textSub', '#6b4f3a', 'textMuted', '#8a6f58')
     )
)::text
where key = 'site_config';

commit;


-- ════════════════════════════════════════════════════════════════
-- 실행 후 확인
-- ════════════════════════════════════════════════════════════════

-- 이름·문구가 바뀌었는지
select
  value::jsonb ->> 'siteName'              as 이름,
  value::jsonb ->> 'siteEyebrow'           as 영문문구,
  value::jsonb ->> 'heroTitle'             as 한줄,
  value::jsonb ->> 'footerName'            as 푸터,
  value::jsonb -> 'theme' ->> 'textSub'    as 보조,
  value::jsonb -> 'theme' ->> 'textMuted'  as 흐린글자,
  value::jsonb -> 'theme' ->> 'accent'     as 강조색
from public.site_settings
where key = 'site_config';

-- 되돌리기가 필요하면 위 값들을 예전 값으로 다시 update 하면 된다.
-- 예전 값: siteName '1인 서점' / siteEyebrow "Young June's"
--          textSub '#7a5c44' / textMuted '#b09880'
