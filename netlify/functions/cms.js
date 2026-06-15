exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: '잘못된 요청입니다.' }) }; }

  const { password, filename, content, upload, action } = body;

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: '비밀번호가 틀렸습니다.' }) };
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const repo = 'YoungjuneNLEX/blog-youngjune';
  const apiBase = `https://api.github.com/repos/${repo}/contents`;
  const ghHeaders = { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github+json' };

  // 권한 부족(404)·인증 실패(401)를 사람이 읽을 수 있는 메시지로 변환
  function friendlyError(status, raw) {
    if (status === 401) return 'GitHub 토큰이 유효하지 않습니다. Netlify의 GITHUB_TOKEN 값을 확인해주세요.';
    if (status === 404) return 'GitHub 토큰에 이 저장소 쓰기 권한이 없습니다. Netlify의 GITHUB_TOKEN을 쓰기(repo/contents) 권한이 있는 토큰으로 교체해주세요.';
    return raw;
  }

  // GitHub 저장소에 파일을 커밋하는 공통 함수
  async function commitFile(filePath, base64Content, message) {
    let sha;
    const checkRes = await fetch(`${apiBase}/${filePath}`, { headers: ghHeaders });
    if (checkRes.ok) {
      const existing = await checkRes.json();
      sha = existing.sha;
    }

    const putBody = { message, content: base64Content, branch: 'main' };
    if (sha) putBody.sha = sha;

    const putRes = await fetch(`${apiBase}/${filePath}`, {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(putBody),
    });

    if (!putRes.ok) {
      const err = await putRes.text();
      const e = new Error(friendlyError(putRes.status, err));
      throw e;
    }
  }

  // ── 글 목록 조회 ─────────────────────────────────────────────
  if (action === 'list') {
    const res = await fetch(`${apiBase}/src/content/posts?ref=main`, { headers: ghHeaders });
    if (!res.ok) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: friendlyError(res.status, await res.text()) }) };
    }
    const items = await res.json();
    const files = (Array.isArray(items) ? items : [])
      .filter(f => f.type === 'file' && f.name.endsWith('.md') && f.name !== '_template.md')
      .map(f => ({ name: f.name }))
      .sort((a, b) => b.name.localeCompare(a.name)); // 최신(파일명 날짜) 먼저
    return { statusCode: 200, headers, body: JSON.stringify({ files }) };
  }

  // ── 글 한 편 불러오기 ────────────────────────────────────────
  if (action === 'get') {
    const safe = String(filename || '').replace(/[/\\]/g, '');
    const res = await fetch(`${apiBase}/src/content/posts/${encodeURIComponent(safe)}?ref=main`, { headers: ghHeaders });
    if (!res.ok) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: friendlyError(res.status, await res.text()) }) };
    }
    const data = await res.json();
    const text = Buffer.from(data.content || '', 'base64').toString('utf-8');
    return { statusCode: 200, headers, body: JSON.stringify({ content: text }) };
  }

  // ── 이미지 업로드 (썸네일/표지) ──────────────────────────────
  // content는 클라이언트에서 이미 base64로 인코딩된 이미지 데이터
  if (upload === 'image') {
    // 파일명 정리: 경로 구분자 제거, 안전한 문자만 허용
    const safeName = String(filename || '')
      .replace(/[/\\]/g, '')
      .replace(/[^\w.\-ㄱ-힣가-힣]/g, '_');
    if (!safeName) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: '이미지 파일명이 올바르지 않습니다.' }) };
    }
    try {
      await commitFile(`public/image/${safeName}`, content, `이미지 업로드: ${safeName}`);
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: '이미지 업로드 실패: ' + e.message }) };
    }
    // 사이트에서 참조할 공개 경로 반환
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, path: `/image/${safeName}` }) };
  }

  // ── 글(마크다운) 저장 ────────────────────────────────────────
  const encodedContent = Buffer.from(content, 'utf-8').toString('base64');
  try {
    await commitFile(`src/content/posts/${filename}`, encodedContent, `글 저장: ${filename}`);
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: '저장 실패: ' + e.message }) };
  }

  return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
};
