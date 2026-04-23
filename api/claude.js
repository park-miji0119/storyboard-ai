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
1. characters: 시나리오에 언급된 모든 인물을 빠짐없이 각각 별도 항목으로 추출 (절대 묶거나 생략하지 말 것)
2. backgrounds: 등장하는 배경/장소 목록 (인물 없는 순수 배경)
3. 각 prompt는 반드시 영어로 작성
4. 그림체: hyperrealistic 3D animation, Prince of Egypt meets Pixar live-action hybrid, photorealistic skin texture, dramatic cinematic lighting, NOT cartoon, NOT anime, NOT stylized
5. 캐릭터 prompt 필수 조건: solo portrait, one person only, front-facing, looking directly at camera, symmetrical composition, upper body, neutral background
6. 배경 prompt 필수 조건: empty scene, absolutely no people, no humans, no figures, cinematic establishing shot, wide angle
7. name과 description은 한국어로

시나리오:
${scenario}

JSON 형식 (이 형식 그대로, 다른 텍스트 없이):
{
  "characters": [
    {
      "id": "c1",
      "name": "인물 이름",
      "description": "인물 한줄 설명",
      "prompt": "solo portrait, one person only, front-facing, looking directly at camera, upper body, [character appearance details], hyperrealistic 3D animation, Prince of Egypt meets Pixar live-action hybrid, photorealistic skin texture, dramatic lighting, neutral dark background, NOT cartoon NOT anime"
    }
  ],
  "backgrounds": [
    {
      "id": "b1",
      "name": "배경 이름",
      "description": "배경 한줄 설명",
      "prompt": "empty scene, no people, no humans, [location details], cinematic establishing shot, hyperrealistic, dramatic lighting, wide angle"
    }
  ]
}

JSON만 출력. 마크다운 없이.`
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
