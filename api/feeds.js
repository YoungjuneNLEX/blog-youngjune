// Vercel 서버리스 함수 — 네이버 블로그 최신글 + 유튜브 최신영상을 가져와 JSON으로 돌려줍니다.
// 브라우저에서 외부 RSS를 직접 부르면 CORS에 막히므로, 이 함수가 대신 받아서 정리해 넘깁니다.
// (의존성 없이 정규식으로 가볍게 파싱 — api/cms.js와 같은 스타일)

// 네이버 블로그 ID / 유튜브 핸들 — 주소만 여기서 바꾸면 됩니다.
const NAVER_BLOG_ID = 'lawyer_youngjune';
const YOUTUBE_HANDLE = '@사무장박영준';

// 따뜻한 인스턴스가 재사용될 때 유튜브 채널 ID를 다시 찾지 않도록 메모리에 캐시
let cachedChannelId = null;

// ── 작은 도우미들 ───────────────────────────────────────────────
function stripCdata(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .trim();
}
function decodeEntities(s) {
  return String(s || '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}
function firstTag(xml, tag) {
  const m = xml.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i'));
  return m ? stripCdata(m[1]) : '';
}
// 본문 HTML에서 첫 번째 이미지 주소 추출 (네이버 썸네일용)
function firstImage(html) {
  const m = decodeEntities(String(html || '')).match(/<img[^>]+src=["']([^"']+)["']/i);
  if (!m) return '';
  let url = m[1];
  if (url.startsWith('//')) url = 'https:' + url;
  return url;
}

// ── 네이버 블로그 최신글 ─────────────────────────────────────────
async function getNaver() {
  const url = `https://rss.blog.naver.com/${NAVER_BLOG_ID}.xml`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error('naver rss ' + r.status);
  const xml = await r.text();
  const itemMatch = xml.match(/<item>([\s\S]*?)<\/item>/i);
  if (!itemMatch) throw new Error('naver item 없음');
  const item = itemMatch[1];
  const desc = firstTag(item, 'description');
  return {
    title: decodeEntities(firstTag(item, 'title')),
    link: stripCdata(firstTag(item, 'link')),
    thumbnail: firstImage(desc),
    date: firstTag(item, 'pubDate'),
  };
}

// ── 유튜브 핸들 → 채널 ID 변환 ───────────────────────────────────
async function resolveChannelId() {
  if (cachedChannelId) return cachedChannelId;
  const r = await fetch('https://www.youtube.com/' + encodeURI(YOUTUBE_HANDLE), {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'ko' },
  });
  if (!r.ok) throw new Error('youtube page ' + r.status);
  const html = await r.text();
  const m = html.match(/"(?:channelId|externalId)":"(UC[\w-]+)"/) ||
            html.match(/channel\/(UC[\w-]+)/) ||
            html.match(/"browseId":"(UC[\w-]+)"/);
  if (!m) throw new Error('channelId 못 찾음');
  cachedChannelId = m[1];
  return cachedChannelId;
}

// ── 유튜브 최신영상 ──────────────────────────────────────────────
async function getYoutube() {
  const channelId = await resolveChannelId();
  const r = await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=' + channelId, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!r.ok) throw new Error('youtube rss ' + r.status);
  const xml = await r.text();
  const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/i);
  if (!entryMatch) throw new Error('youtube entry 없음');
  const entry = entryMatch[1];
  const videoId = firstTag(entry, 'yt:videoId');
  const linkMatch = entry.match(/<link[^>]+href=["']([^"']+)["']/i);
  return {
    title: decodeEntities(firstTag(entry, 'title')),
    link: linkMatch ? linkMatch[1] : ('https://www.youtube.com/watch?v=' + videoId),
    videoId,
    // 고화질 썸네일은 항상 이 주소 패턴을 따릅니다.
    thumbnail: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '',
    date: firstTag(entry, 'published'),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Vercel 엣지에서 10분 캐시 + 1시간 동안은 오래된 값이라도 우선 보여주고 뒤에서 갱신
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');

  // 한쪽이 실패해도 다른 쪽은 살리도록 각각 따로 처리
  const [naver, youtube] = await Promise.allSettled([getNaver(), getYoutube()]);

  return res.status(200).json({
    naver: naver.status === 'fulfilled' ? naver.value : null,
    youtube: youtube.status === 'fulfilled' ? youtube.value : null,
  });
}
