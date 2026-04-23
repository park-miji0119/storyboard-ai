export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { scenario, claude_key } = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claude_key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `당신은 영화/애니메이션 프리프로덕션 전문가입니다. 아래 시나리오를 분석해서 JSON으로만 응답하세요.

규칙:
- characters: 각 인물을 개별 항목으로 분리 (그룹 X)
- backgrounds: 인물 없는 순수 배경
- prompt는 영어로, Seedream AI용
- 그림체: hyperrealistic 3D animation, Prince of Egypt meets Pixar live-action hybrid, photorealistic skin texture, dramatic lighting, cinematic quality, NOT cartoon, NOT anime
- 캐릭터: solo portrait, one person only, upper body
- 배경: empty scene, no people, cinematic establishing shot
- name/description은 한국어

시나리오: ${scenario}

JSON 형식:
{"characters":[{"id":"c1","name":"이름","description":"설명","prompt":"English prompt..."}],"backgrounds":[{"id":"b1","name":"이름","description":"설명","prompt":"English prompt..."}]}

JSON만 출력.`
        }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || 'Claude API 오류' });
    }

    const data = await response.json();
    const text = data.content[0].text.trim();
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
