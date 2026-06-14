exports.handler = async (event) => {
  const { code } = event.queryStringParameters || {};
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  // 1단계: GitHub 로그인 페이지로 이동
  if (!code) {
    const params = new URLSearchParams({
      client_id: clientId,
      scope: 'repo,user',
    });
    return {
      statusCode: 302,
      headers: { Location: `https://github.com/login/oauth/authorize?${params}` },
      body: '',
    };
  }

  // 2단계: 로그인 완료 후 토큰 교환
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  const data = await res.json();
  const token = data.access_token || '';

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: `<!DOCTYPE html><html><body><script>
      window.opener.postMessage(
        'authorization:github:success:' + JSON.stringify({token:"${token}",provider:"github"}),
        '*'
      );
    </script></body></html>`,
  };
};
