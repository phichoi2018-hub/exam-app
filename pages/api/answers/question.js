import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST만 허용됩니다.' });
  }

  const { examId, studentName, questionNo, message } = req.body;

  if (!examId || !studentName || !questionNo) {
    return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'questions.json');

    let allQuestions = {};
    if (fs.existsSync(filePath)) {
      allQuestions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    if (!allQuestions[examId]) {
      allQuestions[examId] = [];
    }

    allQuestions[examId].push({
      id: Date.now().toString(),
      studentName,
      questionNo,
      message: message || '',
      sentAt: new Date().toISOString(),
      read: false,
    });

    fs.writeFileSync(filePath, JSON.stringify(allQuestions, null, 2), 'utf-8');
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '질문 전송 중 오류가 발생했습니다.' });
  }
}
