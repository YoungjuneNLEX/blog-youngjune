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

  const { password, filename, content } = body;

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: '비밀번호가 틀렸습니다.' }) };
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const repo = 'YoungjuneNLEX/blog-youngjune';
  const filePath = `src/content/posts/${filename}`;
  const encodedContent = Buffer.from(content, 'utf-8').toString('base64');

  let sha;
  const checkRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
    headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github+json' },
  });
  if (checkRes.ok) {
    const existing = await checkRes.json();
    sha = existing.sha;
  }

  const putBody = { message: `글 저장: ${filename}`, content: encodedContent, branch: 'main' };
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
    return { statusCode: 500, headers, body: JSON.stringify({ error: '저장 실패: ' + err }) };
  }

  return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
};
