import fs from 'fs';
import path from 'path';

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf-8').trim();
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function normalizeQuestion(q, idx, examDifficulty = '기본') {
  const no = Number(q?.no ?? idx + 1);
  const correctRate = Number(q?.correctRate ?? 0);

  // 🔥 핵심: answer 자동 보정
  const answer = String(q?.answer ?? '').trim() || '1';

  return {
    no,
    typeName: String(q?.typeName || '기타').trim(),
    correctRate,
    difficulty: String(q?.difficulty || examDifficulty).trim(),
    answer,
    explanation: String(q?.explanation || '').trim(),
  };
}

function normalizeExam(input) {
  const examDifficulty = String(input?.difficulty || '기본').trim();

  const questions = Array.isArray(input?.questions)
    ? input.questions.map((q, idx) =>
        normalizeQuestion(q, idx, examDifficulty)
      )
    : [];

  return {
    id: `exam_${Date.now()}`,
    title: String(input?.title || '불러온 시험').trim(),
    grade: String(input?.grade || '').trim(),
    subject: String(input?.subject || '수학').trim(),
    teacher: String(input?.teacher || '브라이언 선생님').trim(),
    difficulty: examDifficulty,
    totalQuestions:
      Number(input?.totalQuestions) > 0
        ? Number(input.totalQuestions)
        : questions.length,
    questions,
    createdAt: new Date().toISOString(),
  };
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'POST만 허용됩니다.',
    });
  }

  try {
    const exam = normalizeExam(req.body);

    if (!exam.questions.length) {
      return res.status(400).json({
        success: false,
        error: 'questions가 없습니다.',
      });
    }

    const examsPath = path.join(process.cwd(), 'data', 'exams.json');

    // 🔥 배열 → 객체 구조로 변경
    const existing = readJson(examsPath, {});
    const exams =
      typeof existing === 'object' && !Array.isArray(existing)
        ? existing
        : {};

    exams[exam.id] = exam;

    writeJson(examsPath, exams);

    return res.status(200).json({
      success: true,
      exam,
    });
  } catch (error) {
    console.error('[createExamFromJson]', error);

    return res.status(500).json({
      success: false,
      error: '시험 생성 중 오류가 발생했습니다.',
      detail: error.message,
    });
  }
}