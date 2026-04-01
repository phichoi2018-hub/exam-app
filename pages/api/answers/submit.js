
import fs from 'fs';
import path from 'path';

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
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function normalize(v) {
  return String(v ?? '').trim();
}

function getTypeIdByName(typeName) {
  const name = String(typeName || '').trim();

  if (name.includes('곱셈') || name.includes('계산')) return 'T01';
  if (name.includes('개념')) return 'T02';
  if (name.includes('서술')) return 'T03';
  if (name.includes('응용')) return 'T04';
  if (name.includes('심화')) return 'T05';
  return 'T06';
}

function getTypeNameById(typeId) {
  const map = {
    T01: '계산',
    T02: '개념',
    T03: '서술',
    T04: '응용',
    T05: '심화',
    T06: '기타',
  };
  return map[typeId] || '기타';
}

function ensureWrongBucket(typeScores, typeId, difficulty) {
  if (!typeScores[typeId]) {
    typeScores[typeId] = {
      total: { correct: 0, wrong: 0, net: 0 },
      byDifficulty: {},
    };
  }

  if (!typeScores[typeId].byDifficulty[difficulty]) {
    typeScores[typeId].byDifficulty[difficulty] = {
      correct: 0,
      wrong: 0,
      net: 0,
    };
  }
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'POST만 허용됩니다.',
    });
  }

  try {
    const { examId, studentName, answers } = req.body || {};

    if (!examId || !studentName) {
      return res.status(400).json({
        success: false,
        error: 'examId 또는 studentName이 없습니다.',
      });
    }

    const examsPath = path.join(process.cwd(), 'data', 'exams.json');
    const answersPath = path.join(process.cwd(), 'data', 'answers.json');
    const wrongPath = path.join(process.cwd(), 'data', 'wrongAnswers.json');

    const exams = readJson(examsPath, []);
    const allAnswers = readJson(answersPath, {});
    const wrongAll = readJson(wrongPath, {});

    const exam = exams.find(e => e.id === examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        error: '시험을 찾을 수 없습니다.',
      });
    }

    const results = (exam.questions || []).map(q => {
      const studentAnswer = normalize(answers?.[q.no]);
      const correctAnswer = normalize(q.answer);
      const correct = studentAnswer === correctAnswer;

      const rawTypeName = q.typeName || '기타';
      const typeId = getTypeIdByName(rawTypeName);

      return {
        no: q.no,
        typeId,
        rawTypeName,
        typeName: getTypeNameById(typeId),
        difficulty: q.difficulty || '기본',
        studentAnswer,
        correctAnswer,
        correct,
      };
    });

    const score = results.filter(r => r.correct).length;
    const total = results.length;

    const typeStats = {};
    results.forEach(r => {
      const key = r.typeName || '기타';
      if (!typeStats[key]) {
        typeStats[key] = { correct: 0, total: 0, wrong: [] };
      }
      typeStats[key].total += 1;
      if (r.correct) {
        typeStats[key].correct += 1;
      } else {
        typeStats[key].wrong.push(r.no);
      }
    });

    if (!allAnswers[examId]) {
      allAnswers[examId] = {};
    }

    allAnswers[examId][studentName] = {
      studentName,
      answers,
      submitted: true,
      submittedAt: new Date().toISOString(),
      score,
      total,
      results,
      typeStats,
    };

    const appliedKey = `${examId}::${studentName}`;

    if (!wrongAll[studentName]) {
      wrongAll[studentName] = {
        appliedKeys: [],
        typeScores: {},
      };
    }

    const studentWrong = wrongAll[studentName];

    if (!studentWrong.appliedKeys.includes(appliedKey)) {
      results.forEach(r => {
        const typeId = r.typeId || 'T06';
        const difficulty = r.difficulty || '기본';

        ensureWrongBucket(studentWrong.typeScores, typeId, difficulty);

        const typeBucket = studentWrong.typeScores[typeId];
        const diffBucket = typeBucket.byDifficulty[difficulty];

        if (r.correct) {
          typeBucket.total.correct += 1;
          typeBucket.total.net += 1;

          diffBucket.correct += 1;
          diffBucket.net += 1;
        } else {
          typeBucket.total.wrong += 1;
          typeBucket.total.net -= 1;

          diffBucket.wrong += 1;
          diffBucket.net -= 1;
        }
      });

      studentWrong.appliedKeys.push(appliedKey);
    }

    writeJson(answersPath, allAnswers);
    writeJson(wrongPath, wrongAll);

    return res.status(200).json({
      success: true,
      score,
      total,
      results,
      typeStats,
    });
  } catch (error) {
    console.error('[submit API]', error);
    return res.status(500).json({
      success: false,
      error: '제출 처리 중 오류가 발생했습니다.',
    });
  }
}