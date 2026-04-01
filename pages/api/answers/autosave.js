import fs from 'fs';
import path from 'path';

function ensureFile(filePath, defaultContent = '{}') {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, defaultContent, 'utf-8');
}

function readJson(filePath) {
  ensureFile(filePath);
  const raw = fs.readFileSync(filePath, 'utf-8').trim();
  return raw ? JSON.parse(raw) : {};
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST만 허용됩니다.' });
  }

  const { examId, studentName, answers } = req.body;

  if (!examId || !studentName) {
    return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
  }

  try {
    const filePath  = path.join(process.cwd(), 'data', 'answers.json');
    const allAnswers = readJson(filePath);
    const key       = `${examId}_${studentName}`;

    /* 이미 제출한 경우 자동저장 차단 */
    if (allAnswers[key] && allAnswers[key].submitted) {
      return res.status(200).json({ success: true, lastSaved: allAnswers[key].lastSaved, alreadySubmitted: true });
    }

    /* 기존 레코드가 없으면 새로 생성, 있으면 answers만 갱신 */
    const now = new Date().toISOString();
    allAnswers[key] = {
      ...(allAnswers[key] || {}),   // 기존 필드 보존
      examId,
      studentName,
      answers: answers || {},
      submitted: false,
      lastSaved: now,
    };

    fs.writeFileSync(filePath, JSON.stringify(allAnswers, null, 2), 'utf-8');
    return res.status(200).json({ success: true, lastSaved: now });

  } catch (err) {
    console.error('[autosave] 오류:', err);
    return res.status(500).json({ error: '저장 중 오류가 발생했습니다.', detail: err.message });
  }
}
