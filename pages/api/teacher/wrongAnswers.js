/**
 * pages/api/teacher/wrongAnswers.js
 * wrongAnswers.json 을 읽어 선생님 대시보드에 반환
 * GET /api/teacher/wrongAnswers
 */
import fs   from 'fs';
import path from 'path';

function readJson(p, fallback = {}) {
  try {
    if (!fs.existsSync(p)) return fallback;
    const raw = fs.readFileSync(p, 'utf-8').trim();
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET만 허용됩니다.' });
  }

  try {
    const wrongAll = readJson(path.join(process.cwd(), 'data', 'wrongAnswers.json'), {});
    return res.status(200).json({ wrongAnswers: wrongAll });
  } catch (err) {
    console.error('[wrongAnswers API]', err);
    return res.status(500).json({ error: '오답 데이터를 불러올 수 없습니다.' });
  }
}
