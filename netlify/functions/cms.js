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

  const { password, filename, content, upload } = body;

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: '비밀번호가 틀렸습니다.' }) };
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const repo = 'YoungjuneNLEX/blog-youngjune';

  // GitHub 저장소에 파일을 커밋하는 공통 함수
  async function commitFile(filePath, base64Content, message) {
    let sha;
    const checkRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github+json' },
    });
    if (checkRes.ok) {
      const existing = await checkRes.json();
      sha = existing.sha;
    }

    const putBody = { message, content: base64Content, branch: 'main' };
    if (sha) putBody.sha = sha;

    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(putBody),
    });

    if (!putRes.ok) {
      const err = await putRes.text();
      throw new Error(err);
    }
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
