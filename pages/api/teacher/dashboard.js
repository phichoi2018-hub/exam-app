import fs from 'fs';
import path from 'path';

/* data/ 폴더와 파일이 없으면 자동 생성 */
function ensureFile(filePath, defaultContent = '{}') {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, defaultContent, 'utf-8');
}

function readJson(filePath, fallback = {}) {
  try {
    ensureFile(filePath);
    const raw = fs.readFileSync(filePath, 'utf-8').trim();
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`[dashboard] JSON 읽기 실패: ${filePath}`, e.message);
    return fallback;
  }
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET만 허용됩니다.' });
  }

  try {
    const dataDir     = path.join(process.cwd(), 'data');
    const examsPath   = path.join(dataDir, 'exams.json');
    const answersPath = path.join(dataDir, 'answers.json');

    const exams   = readJson(examsPath,   {});
    const answers = readJson(answersPath, {});

    /* answers.json 구조 예시:
       {
         "exam001_홍길동": {
           examId: "exam001",
           studentName: "홍길동",
           answers: { "1": "24", "2": "3" },
           submitted: false,
           lastSaved: "2024-...",
           // 제출 후 추가 필드:
           submitted: true,
           submittedAt: "2024-...",
           results: [...],
           score: 8,
           total: 10,
           typeStats: { 계산: { total:5, correct:4, wrong:[3] } }
         }
       }
    */

    const allAnswerRecords = Object.values(answers); // 전체 레코드 배열

    const examList = Object.values(exams).map(exam => {
      /* 이 시험에 해당하는 학생 레코드만 필터 */
      const records = allAnswerRecords.filter(r => r.examId === exam.id);

      const students = records.map(r => {
        /* 실제로 입력된 답안 수 계산 (빈 문자열 제외) */
        const answersObj    = r.answers || {};
        const answeredCount = Object.values(answersObj).filter(v => typeof v === 'string' && v.trim() !== '').length;

        return {
          studentName:    r.studentName,
          answeredCount:  answeredCount,
          totalQuestions: exam.totalQuestions,
          submitted:      r.submitted === true,
          score:          r.score  ?? null,
          total:          r.total  ?? exam.totalQuestions,
          lastSaved:      r.lastSaved   || null,
          submittedAt:    r.submittedAt || null,
          typeStats:      r.typeStats   || {},
          results:        r.results     || [],
        };
      });

      return {
        /* 시험 기본 정보 */
        id:             exam.id,
        title:          exam.title,
        subject:        exam.subject   || '',
        grade:          exam.grade     || '',
        teacher:        exam.teacher   || '브라이언',
        totalQuestions: exam.totalQuestions,
        questions:      exam.questions || [],
        createdAt:      exam.createdAt || null,
        /* 집계 */
        studentCount:   students.length,
        submittedCount: students.filter(s => s.submitted).length,
        students,
      };
    });

    return res.status(200).json({ exams: examList });

  } catch (err) {
    console.error('[dashboard] 오류:', err);
    return res.status(500).json({ error: '데이터를 불러올 수 없습니다.', detail: err.message });
  }
}
