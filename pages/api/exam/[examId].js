/**
 * pages/api/exam/[examId].js
 * 학생용 시험 데이터 반환 (정답 숨김)
 * typeName / typeId / answerKind 포함, answer 제외
 */
import fs from 'fs';
import path from 'path';

function readJson(p, fallback = {}) {
  try {
    if (!fs.existsSync(p)) return fallback;
    const raw = fs.readFileSync(p, 'utf-8').trim();
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export default function handler(req, res) {
  const { examId } = req.query;

  try {
    const exams = readJson(path.join(process.cwd(), 'data', 'exams.json'), {});
    const exam  = exams[examId];

    if (!exam) {
      return res.status(404).json({ error: '시험을 찾을 수 없습니다.' });
    }

    /* 학생에게 보내는 데이터 — answer / answerKind 제외 */
    const safeExam = {
      id:             exam.id,
      title:          exam.title,
      subject:        exam.subject  || '수학',
      teacher:        exam.teacher  || '브라이언',
      grade:          exam.grade    || '',
      difficulty:     exam.difficulty || '',
      totalQuestions: exam.totalQuestions,
      questions: exam.questions.map(q => ({
        no:       q.no,
        typeId:   q.typeId   || 'T99',
        typeName: q.typeName || q.type || '기타',  // 구 구조 하위호환
        // answer, answerKind 제외
      })),
    };

    return res.status(200).json(safeExam);
  } catch (err) {
    console.error('[exam API]', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
