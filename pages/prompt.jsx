import { useState } from 'react';

export default function PromptPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');

  const generatePrompt = () => {
    const prompt = `이 시험지를 아래 형식의 완전한 JSON으로 만들어줘.
설명 없이 JSON만 출력해줘.

{
  "title": "",
  "grade": "",
  "subject": "수학",
  "teacher": "브라이언 선생님",
  "difficulty": "기본",
  "totalQuestions": 0,
  "questions": [
    {
      "no": 1,
      "typeName": "",
      "correctRate": 0,
      "difficulty": "",
      "answer": "",
      "explanation": ""
    }
  ]
}

시험지 내용:
${input}
`;

    setResult(prompt);
  };

  const copyText = () => {
    navigator.clipboard.writeText(result);
    alert('복사 완료!');
  };

  return (
    <div style={{ padding: 30 }}>
      <h1>📄 문제 → JSON 요청 생성기</h1>

      <textarea
        placeholder="문제 내용을 붙여넣으세요 (PDF 복사 or 텍스트)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: '100%', height: 200, marginTop: 10 }}
      />

      <button onClick={generatePrompt} style={{ marginTop: 10 }}>
        프롬프트 생성
      </button>

      {result && (
        <>
          <textarea
            value={result}
            readOnly
            style={{ width: '100%', height: 300, marginTop: 20 }}
          />
          <button onClick={copyText}>복사</button>
        </>
      )}
    </div>
  );
}