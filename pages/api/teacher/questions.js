import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), 'data', 'questions.json');

  try {
    /* ── GET: 전체 질문 조회 ── */
    if (req.method === 'GET') {
      if (!fs.existsSync(filePath)) {
        return res.status(200).json({ questions: {} });
      }
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return res.status(200).json({ questions: data });
    }

    /* ── PATCH: 질문 읽음 처리 ── */
    if (req.method === 'PATCH') {
      const { examId, questionId } = req.body;
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: '없음' });

      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (data[examId]) {
        data[examId] = data[examId].map(q =>
          q.id === questionId ? { ...q, read: true } : q
        );
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '서버 오류' });
  }
}
