import fs from 'fs';
import path from 'path';
import formidable from 'formidable';
import pdf from 'pdf-parse';
import { parseExamPdfWithAI } from '../../../lib/parseExamPdfWithAI';

export const config = {
  api: {
    bodyParser: false,
  },
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function sanitizeFileName(name = 'upload.pdf') {
  return name.replace(/[^\w.\-가-힣]/g, '_');
}

function parseForm(req) {
  const uploadDir = path.join(process.cwd(), 'data', 'uploads');
  ensureDir(uploadDir);

  const form = formidable({
    multiples: false,
    uploadDir,
    keepExtensions: true,
    maxFiles: 1,
    maxFileSize: 30 * 1024 * 1024, // 30MB
    filename: (_name, _ext, part) => {
      const safeName = sanitizeFileName(part.originalFilename || 'upload.pdf');
      const ts = Date.now();
      return `${ts}_${safeName}`;
    },
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

function getDifficultyByRate(rate) {
  const n = Number(rate);
  if (Number.isNaN(n)) return '기본';
  if (n >= 80) return '기본';
  if (n >= 60) return '실력하';
  if (n >= 40) return '실력중';
  if (n >= 20) return '심화하';
  return '심화중';
}

function normalizeParsedResult(parsed) {
  const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];

  const normalizedQuestions = questions
    .map((q, idx) => {
      const no = Number(q?.no ?? idx + 1);
      const correctRate = Number(q?.correctRate ?? 0);
      const difficulty =
        q?.difficulty && String(q.difficulty).trim()
          ? String(q.difficulty).trim()
          : getDifficultyByRate(correctRate);

      return {
        no,
        typeName: String(q?.typeName || '기타').trim(),
        correctRate,
        difficulty,
        answer: String(q?.answer || '').trim(),
        explanation: String(q?.explanation || '').trim(),
      };
    })
    .sort((a, b) => a.no - b.no);

  return {
    title: String(parsed?.title || '').trim(),
    grade: String(parsed?.grade || '').trim(),
    subject: String(parsed?.subject || '수학').trim(),
    teacher: String(parsed?.teacher || '브라이언 선생님').trim(),
    difficulty: String(parsed?.difficulty || '기본').trim(),
    totalQuestions:
      Number(parsed?.totalQuestions) > 0
        ? Number(parsed.totalQuestions)
        : normalizedQuestions.length,
    questions: normalizedQuestions,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'POST만 허용됩니다.',
    });
  }

  try {
    const { files } = await parseForm(req);
    const uploaded = files?.file;

    if (!uploaded) {
      return res.status(400).json({
        success: false,
        error: 'PDF 파일이 없습니다. file 필드로 업로드해 주세요.',
      });
    }

    const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
    const filePath = file.filepath || file.path;
    const originalFilename = file.originalFilename || 'upload.pdf';
    const mimetype = file.mimetype || '';

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(400).json({
        success: false,
        error: '업로드된 파일을 찾을 수 없습니다.',
      });
    }

    if (
      !originalFilename.toLowerCase().endsWith('.pdf') &&
      !mimetype.includes('pdf')
    ) {
      return res.status(400).json({
        success: false,
        error: 'PDF 파일만 업로드할 수 있습니다.',
      });
    }

    const buffer = fs.readFileSync(filePath);
    const pdfData = await pdf(buffer);

    const rawText = String(pdfData?.text || '').trim();

    if (!rawText) {
      return res.status(400).json({
        success: false,
        error: 'PDF에서 텍스트를 추출하지 못했습니다.',
      });
    }

    const aiParsed = await parseExamPdfWithAI({
      rawText,
      originalFilename,
    });

    const examPreview = normalizeParsedResult(aiParsed);

    if (!examPreview.title) {
      return res.status(400).json({
        success: false,
        error: 'AI가 시험 제목을 추출하지 못했습니다.',
      });
    }

    if (!examPreview.questions.length) {
      return res.status(400).json({
        success: false,
        error: '문항 정보를 추출하지 못했습니다.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'PDF 분석이 완료되었습니다.',
      preview: examPreview,
      uploadMeta: {
        originalFilename,
        storedPath: filePath,
        pageCount: pdfData.numpages || 0,
      },
    });
  } catch (error) {
    console.error('[uploadExam API]', error);

    return res.status(500).json({
      success: false,
      error: 'PDF 업로드 또는 분석 중 오류가 발생했습니다.',
      detail: process.env.NODE_ENV === 'development' ? String(error.message || error) : undefined,
    });
  }
}