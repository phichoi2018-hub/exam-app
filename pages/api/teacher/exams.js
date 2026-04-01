import fs from 'fs';
import path from 'path';

const examsPath = () => path.join(process.cwd(), 'data', 'exams.json');

export default function handler(req, res) {
  try {
    const exams = JSON.parse(fs.readFileSync(examsPath(), 'utf-8'));

    /* ── GET: 전체 목록 ── */
    if (req.method === 'GET') {
      return res.status(200).json({ exams });
    }

    /* ── POST: 새 시험 생성 ── */
    if (req.method === 'POST') {
      const { title, subject, grade, questions } = req.body;
      if (!title || !questions || questions.length === 0) {
        return res.status(400).json({ error: '제목과 문항을 입력해 주세요.' });
      }

      const id = 'exam_' + Date.now();
      exams[id] = {
        id,
        title,
        subject: subject || '',
        grade: grade || '',
        teacher: '브라이언',
        totalQuestions: questions.length,
        questions,
        createdAt: new Date().toISOString(),
      };

      fs.writeFileSync(examsPath(), JSON.stringify(exams, null, 2), 'utf-8');
      return res.status(200).json({ success: true, exam: exams[id] });
    }

    /* ── PUT: 시험 수정 (유형/정답 변경 → 재채점) ── */
    if (req.method === 'PUT') {
      const { id, title, subject, grade, questions } = req.body;
      if (!id || !exams[id]) {
        return res.status(404).json({ error: '시험을 찾을 수 없습니다.' });
      }

      exams[id] = {
        ...exams[id],
        title: title ?? exams[id].title,
        subject: subject ?? exams[id].subject,
        grade: grade ?? exams[id].grade,
        questions: questions ?? exams[id].questions,
        totalQuestions: (questions ?? exams[id].questions).length,
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(examsPath(), JSON.stringify(exams, null, 2), 'utf-8');

      // 재채점: 이미 제출된 답안들 다시 채점
      const answersPath = path.join(process.cwd(), 'data', 'answers.json');
      if (fs.existsSync(answersPath)) {
        const allAnswers = JSON.parse(fs.readFileSync(answersPath, 'utf-8'));
        const updatedExam = exams[id];
        let changed = false;

        Object.keys(allAnswers).forEach(key => {
          const rec = allAnswers[key];
          if (rec.examId !== id || !rec.submitted) return;

          const results = updatedExam.questions.map(q => {
            const studentAnswer = (rec.answers[q.no] || '').trim();
            const correct = studentAnswer === q.answer.trim();
            return { no: q.no, type: q.type, studentAnswer, correctAnswer: q.answer, correct };
          });

          const score = results.filter(r => r.correct).length;
          const typeStats = {};
          results.forEach(r => {
            if (!typeStats[r.type]) typeStats[r.type] = { total: 0, correct: 0, wrong: [] };
            typeStats[r.type].total++;
            if (r.correct) typeStats[r.type].correct++;
            else typeStats[r.type].wrong.push(r.no);
          });

          allAnswers[key] = { ...rec, results, score, total: updatedExam.totalQuestions, typeStats };
          changed = true;
        });

        if (changed) fs.writeFileSync(answersPath, JSON.stringify(allAnswers, null, 2), 'utf-8');
      }

      return res.status(200).json({ success: true, exam: exams[id] });
    }

    /* ── DELETE: 시험 삭제 ── */
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id || !exams[id]) {
        return res.status(404).json({ error: '시험을 찾을 수 없습니다.' });
      }
      delete exams[id];
      fs.writeFileSync(examsPath(), JSON.stringify(exams, null, 2), 'utf-8');
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
