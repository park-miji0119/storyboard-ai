export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, aspect_ratio, freepik_key } = req.body;

  try {
    const startRes = await fetch('https://api.freepik.com/v1/ai/text-to-image/seedream-v4-5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-freepik-api-key': freepik_key
      },
      body: JSON.stringify({ prompt, aspect_ratio: ({'16:9':'widescreen_16_9','9:16':'social_story_9_16','1:1':'square_1_1','4:3':'traditional_3_4'})[aspect_ratio] || 'widescreen_16_9' })
    });

    const startData = await startRes.json();
    if (!startRes.ok) return res.status(startRes.status).json({ error: startData.message || 'Freepik 오류' });

    const taskId = startData.data?.task_id;
    if (!taskId) return res.status(500).json({ error: 'task_id 없음' });

    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const pollRes = await fetch(`https://api.freepik.com/v1/ai/text-to-image/seedream-v4-5/${taskId}`, {
        headers: { 'x-freepik-api-key': freepik_key }
      });
      const pollData = await pollRes.json();
      const status = pollData.data?.status;
      if (status === 'COMPLETED') {
        const generated = pollData.data?.generated;
        if (generated?.length > 0) return res.status(200).json({ image_url: generated[0] });
        return res.status(500).json({ error: '이미지 URL 없음' });
      }
      if (status === 'FAILED') return res.status(500).json({ error: '생성 실패' });
    }
    return res.status(408).json({ error: '타임아웃' });
  } catch (err) {

    return res.status(500).json({ error: err.message });
  }
}
