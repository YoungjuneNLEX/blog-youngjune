// 날짜·시각 표기
//
// 서버와 브라우저가 반드시 같은 글자를 만들어야 한다. 그렇지 않으면
// React 하이드레이션이 깨진다. 두 가지가 어긋날 수 있다.
//   1) 시간대  — 서버는 UTC, 브라우저는 그 기기의 시간대
//   2) 로캘 데이터 — Node 빌드에 따라 ko-KR 이 '오전' 대신 'AM' 으로 나오기도 한다
// 그래서 한국 시간의 숫자만 뽑아 쓰고, 한글 표기는 직접 붙인다.

const TZ = 'Asia/Seoul'
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 숫자만 뽑는다. en-US 의 숫자 표기는 어떤 Node 빌드에서도 같다.
const KST = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  year: 'numeric', month: 'numeric', day: 'numeric',
  hour: 'numeric', minute: '2-digit', hour12: false,
})

function kstParts(iso: string) {
  const map: Record<string, string> = {}
  for (const p of KST.formatToParts(new Date(iso))) {
    if (p.type !== 'literal') map[p.type] = p.value
  }
  const year = Number(map.year)
  const month = Number(map.month)
  const day = Number(map.day)
  // hour12:false 에서 자정이 '24' 로 나오는 구현이 있어 24 로 나눈 나머지를 쓴다
  const hour = Number(map.hour) % 24
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return { year, month, day, hour, minute: map.minute, weekday }
}

function clock(hour: number, minute: string) {
  const half = hour < 12 ? '오전' : '오후'
  const h = hour % 12 === 0 ? 12 : hour % 12
  return `${half} ${h}:${minute}`
}

/** 2026년 9월 27일 (일) — 날짜별 묶음의 머리말 */
export function formatDay(iso: string): string {
  const t = kstParts(iso)
  return `${t.year}년 ${t.month}월 ${t.day}일 (${t.weekday})`
}

/** 오전 10:20 */
export function formatTime(iso: string): string {
  const t = kstParts(iso)
  return clock(t.hour, t.minute)
}

/** 9월 27일 오전 10:20 */
export function formatDateTime(iso: string): string {
  const t = kstParts(iso)
  return `${t.month}월 ${t.day}일 ${clock(t.hour, t.minute)}`
}
