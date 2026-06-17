// Vercel 서버리스 함수 — 글 본문의 맞춤법·띄어쓰기를 Claude로 교정합니다.
// 관리자 비밀번호로 보호 (api/cms.js와 동일한 인증) → 아무나 호출해 비용이 새는 것을 막습니다.
// Vercel 환경변수 ANTHROPIC_API_KEY 가 필요합니다.

export const config = { maxDuration: 60 }; // 긴 글도 처리할 수 있게 시간 여유

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: '잘못된 요청입니다.' }); }
  }
  if (!body || typeof body !== 'object') return res.status(400).json({ error: '잘못된 요청입니다.' });

  const { username, password, text } = body;

  // ── 인증 (cms.js와 동일 규칙) ──
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 틀렸습니다.' });
  }
  if (process.env.ADMIN_USERNAME && username !== process.env.ADMIN_USERNAME) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 틀렸습니다.' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요.' });
  }

  const content = String(text || '').trim();
  if (!content) return res.status(400).json({ error: '검사할 본문이 비어 있습니다.' });
  if (content.length > 20000) {
    return res.status(400).json({ error: '본문이 너무 깁니다. 한 번에 2만 자 이내로 검사해주세요.' });
  }

  const system =
    '당신은 한국어 맞춤법·띄어쓰기 교정 전문가입니다. ' +
    '사용자가 마크다운 형식의 글 본문을 줍니다. ' +
    '다음 규칙을 반드시 지키세요:\n' +
    '1) 맞춤법과 띄어쓰기 오류만 고칩니다.\n' +
    '2) 글의 의미·문체·어투·문장 순서는 절대 바꾸지 않습니다 (재작성 금지).\n' +
    '3) 마크다운 문법(#, *, >, 링크, 이미지, 줄바꿈 등)과 빈 줄 구조를 그대로 보존합니다.\n' +
    '4) 고유명사·전문용어·일부러 쓴 표현은 함부로 바꾸지 않습니다.\n' +
    '교정한 전체 본문과, 실제로 바꾼 부분의 목록을 반환하세요. ' +
    '바꾼 곳이 없으면 changes를 빈 배열로 두고 corrected에는 원문을 그대로 담으세요.';

  const schema = {
    type: 'object',
    properties: {
      corrected: { type: 'string', description: '맞춤법·띄어쓰기를 교정한 전체 본문 (마크다운 보존)' },
      changes: {
        type: 'array',
        description: '실제로 바꾼 부분 목록',
        items: {
          type: 'object',
          properties: {
            before: { type: 'string', description: '교정 전 표현' },
            after:  { type: 'string', description: '교정 후 표현' },
            reason: { type: 'string', description: '맞춤법 / 띄어쓰기 / 기타 중 하나' },
          },
          required: ['before', 'after', 'reason'],
          additionalProperties: false,
        },
      },
    },
    required: ['corrected', 'changes'],
    additionalProperties: false,
  };

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 16000,
        thinking: { type: 'disabled' }, // 단순 교정 작업 — 응답 속도 우선
        system,
        output_config: { format: { type: 'json_schema', schema } },
        messages: [{ role: 'user', content }],
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(502).json({ error: 'AI 교정 요청 실패 (' + r.status + '): ' + errText.slice(0, 300) });
    }

    const data = await r.json();
    if (data.stop_reason === 'refusal') {
      return res.status(422).json({ error: '이 내용은 교정할 수 없습니다.' });
    }

    // 구조화 출력: 첫 text 블록에 JSON 문자열이 담겨 옵니다.
    const textBlock = (data.content || []).find(b => b.type === 'text');
    if (!textBlock) return res.status(502).json({ error: 'AI 응답을 해석하지 못했습니다.' });

    let parsed;
    try { parsed = JSON.parse(textBlock.text); }
    catch { return res.status(502).json({ error: 'AI 응답 형식이 올바르지 않습니다.' }); }

    return res.status(200).json({
      corrected: String(parsed.corrected || ''),
      changes: Array.isArray(parsed.changes) ? parsed.changes : [],
      truncated: data.stop_reason === 'max_tokens', // 너무 길어 잘렸는지 표시
    });
  } catch (e) {
    return res.status(500).json({ error: '네트워크 오류로 교정에 실패했습니다: ' + e.message });
  }
}
