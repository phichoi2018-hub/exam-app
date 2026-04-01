/**
 * pages/exam/[examId].jsx
 * 학생용 답안 입력 페이지
 * typeName / typeId 신규 구조 + 구 type 필드 하위호환
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

/* ── 유형 색상 (typeName 기준) ── */
const TYPE_COLORS = {
  계산: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  개념: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  서술: { bg: '#fdf4ff', text: '#7e22ce', border: '#e9d5ff' },
  응용: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  심화: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  어휘: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  문법: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  독해: { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc' },
  기타: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
};
const DEFAULT_TC = { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };

function getTypeColor(typeName) {
  return TYPE_COLORS[typeName] || DEFAULT_TC;
}

/* ── 서브 컴포넌트: 유형 배지 ── */
function TypeBadge({ typeName }) {
  const c = getTypeColor(typeName);
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:600, background:c.bg, color:c.text, border:`1px solid ${c.border}` }}>
      {typeName}
    </span>
  );
}

/* ── 자동저장 표시 ── */
function SaveIndicator({ status }) {
  const map = {
    saving: { color:'#d97706', text:'저장 중...', dot:'#fbbf24' },
    saved:  { color:'#16a34a', text:'자동 저장됨', dot:'#4ade80' },
    error:  { color:'#dc2626', text:'저장 실패', dot:'#f87171' },
    idle:   { color:'#8b95a7', text:'', dot:'transparent' },
  };
  const s = map[status] || map.idle;
  if (!s.text) return null;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:s.color, fontWeight:500 }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:s.dot, animation:status==='saving'?'pulse 1s infinite':'none' }}/>
      {s.text}
    </span>
  );
}

/* ── 진행 바 ── */
function ProgressBar({ answered, total }) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6, color:'#5a6375' }}>
        <span>답안 입력 현황</span>
        <span style={{ fontWeight:600, color:'#1a1f2e' }}>{answered}/{total} ({pct}%)</span>
      </div>
      <div style={{ height:8, background:'#e2e5ea', borderRadius:4, overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:4, background:pct===100?'linear-gradient(90deg,#16a34a,#4ade80)':'linear-gradient(90deg,#2563eb,#60a5fa)', width:`${pct}%`, transition:'width 0.4s cubic-bezier(0.4,0,0.2,1)' }}/>
      </div>
    </div>
  );
}

/* ── 문항 카드 ── */
function QuestionCard({
  question,
  answer,
  onChange,
  submitted,
  result,
  index,
  showExplanation = false,
  isSelected = false,
  onToggleSelect = null,
}) {
  const typeName  = question.typeName || question.type || '기타';
  const isCorrect = result?.correct;

  let cardBorder = '#e2e5ea';
  let cardBg     = '#ffffff';
  if (submitted) {
    cardBorder = isCorrect ? '#86efac' : '#fca5a5';
    cardBg     = isCorrect ? '#f0fdf4' : '#fef2f2';
  } else if (answer) {
    cardBorder = '#93c5fd';
    cardBg     = '#fafcff';
  }

  return (
    <div style={{ background:cardBg, border:`1.5px solid ${cardBorder}`, borderRadius:14, padding:'20px 24px', transition:'all 0.25s ease', animation:`fadeIn 0.3s ease ${index*0.04}s both`, boxShadow:answer&&!submitted?'0 2px 12px rgba(37,99,235,0.07)':'none' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
        <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, background:submitted?(isCorrect?'#16a34a':'#dc2626'):(answer?'#2563eb':'#e2e5ea'), color:submitted||answer?'#fff':'#8b95a7', transition:'all 0.3s ease' }}>
          {question.no}
        </div>
        <TypeBadge typeName={typeName} />
        {submitted && (
          <div style={{ marginLeft:'auto' }}>
            <span style={{ color:isCorrect?'#16a34a':'#dc2626', fontWeight:700, fontSize:18 }}>{isCorrect?'✓':'✗'}</span>
          </div>
        )}
      </div>

      <input
        type="text"
        value={answer}
        onChange={e => onChange(question.no, e.target.value)}
        disabled={submitted}
        placeholder={`${question.no}번 답안 입력`}
        style={{ width:'100%', padding:'11px 16px', border:`1.5px solid ${answer&&!submitted?'#93c5fd':'#e2e5ea'}`, borderRadius:10, fontSize:15, fontFamily:'Noto Sans KR,sans-serif', background:submitted?'transparent':'#fff', color:'#1a1f2e', outline:'none', transition:'border-color 0.2s', cursor:submitted?'default':'text', boxSizing:'border-box' }}
        onFocus={e  => { if(!submitted) e.target.style.borderColor='#2563eb'; }}
        onBlur={e   => { if(!submitted) e.target.style.borderColor=answer?'#93c5fd':'#e2e5ea'; }}
      />

      {submitted && !isCorrect && (
        <div style={{ marginTop:12, padding:'10px 14px', background:'#fef2f2', borderRadius:8, border:'1px solid #fecaca', fontSize:13, color:'#dc2626', display:'flex', gap:16, flexWrap:'wrap' }}>
          <span>내 답: <strong>{result?.studentAnswer||'(미입력)'}</strong></span>
          <span style={{ color:'#8b95a7' }}>|</span>
          <span>정답: <strong style={{ color:'#15803d' }}>{result?.correctAnswer}</strong></span>
        </div>
      )}
      {submitted && isCorrect && (
        <div style={{ marginTop:12, padding:'8px 14px', background:'#f0fdf4', borderRadius:8, fontSize:13, color:'#16a34a', fontWeight:500 }}>정답입니다! ✓</div>
      )}

      {submitted && showExplanation && (
        <div style={{ marginTop:12, padding:'12px 14px', background:'#fff', borderRadius:10, border:'1px solid #E2E5EA' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#2563eb', marginBottom:6 }}>해설</div>
          <div style={{ fontSize:13, color:'#1a1f2e', lineHeight:1.6 }}>
            {question.explanation || '등록된 해설이 없습니다.'}
          </div>
        </div>
      )}

      {submitted && onToggleSelect && (
        <button
          type="button"
          onClick={() => onToggleSelect(question.no)}
          style={{
            marginTop:12,
            width:'100%',
            padding:'10px 0',
            borderRadius:10,
            border:`1.5px solid ${isSelected ? '#2563eb' : '#e2e5ea'}`,
            background:isSelected ? '#eff6ff' : '#fff',
            color:isSelected ? '#2563eb' : '#5a6375',
            fontWeight:700,
            fontSize:13,
            cursor:'pointer',
            fontFamily:'Noto Sans KR,sans-serif'
          }}
        >
          {isSelected ? '✓ 질문 문항 선택됨' : '이 문항 질문하기'}
        </button>
      )}
    </div>
  );
}

/* ── 질문 보내기 모달 ── */
function QuestionModal({ questions, onClose, onSend }) {
  const [selectedNo, setSelectedNo] = useState(null);
  const [message, setMessage] = useState('');
  const [sending,  setSending] = useState(false);
  const [sent,     setSent]    = useState(false);

  async function handleSend() {
    if (!selectedNo) return;
    setSending(true);
    try {
      await onSend(selectedNo, message);
      setSent(true);
      setTimeout(() => { setSent(false); onClose(); }, 1500);
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#fff', borderRadius:18, padding:'28px 28px 24px', width:'100%', maxWidth:440, boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        <h3 style={{ fontSize:17, fontWeight:700, marginBottom:6 }}>선생님께 질문하기</h3>
        <p style={{ fontSize:13, color:'#5a6375', marginBottom:20 }}>질문할 문항 번호를 선택하세요.</p>

        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:18 }}>
          {questions.map(q => (
            <button key={q.no} onClick={() => setSelectedNo(q.no)} style={{ width:40, height:40, borderRadius:10, border:'1.5px solid', borderColor:selectedNo===q.no?'#2563eb':'#e2e5ea', background:selectedNo===q.no?'#2563eb':'#fff', color:selectedNo===q.no?'#fff':'#5a6375', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'Noto Sans KR,sans-serif' }}>
              {q.no}
            </button>
          ))}
        </div>

        <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="추가 메시지 (선택사항)" rows={3} style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #e2e5ea', borderRadius:10, fontSize:14, fontFamily:'Noto Sans KR,sans-serif', resize:'none', outline:'none', marginBottom:18, boxSizing:'border-box' }}/>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'12px 0', borderRadius:10, border:'1.5px solid #e2e5ea', background:'#fff', color:'#5a6375', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'Noto Sans KR,sans-serif' }}>취소</button>
          <button onClick={handleSend} disabled={!selectedNo||sending||sent} style={{ flex:2, padding:'12px 0', borderRadius:10, border:'none', background:sent?'#16a34a':(!selectedNo?'#e2e5ea':'#2563eb'), color:'#fff', fontWeight:700, fontSize:14, cursor:selectedNo&&!sending&&!sent?'pointer':'default', fontFamily:'Noto Sans KR,sans-serif' }}>
            {sent?'✓ 전송 완료!':sending?'전송 중...':`${selectedNo?selectedNo+'번 ':''}질문 전송`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 결과 요약 ── */
function ResultSummary({ score, total, typeStats }) {
  const pct = Math.round((score / total) * 100);
  function getGrade(p) {
    if (p >= 90) return { label:'우수', color:'#16a34a' };
    if (p >= 70) return { label:'보통', color:'#2563eb' };
    if (p >= 50) return { label:'미흡', color:'#d97706' };
    return { label:'부족', color:'#dc2626' };
  }
  const grade = getGrade(pct);

  return (
    <div style={{ background:'#fff', borderRadius:16, padding:'28px 28px 24px', boxShadow:'0 2px 16px rgba(0,0,0,0.07)', marginBottom:24, border:'1.5px solid #e2e5ea' }}>
      <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:20 }}>
        <div style={{ width:80, height:80, borderRadius:'50%', flexShrink:0, background:`conic-gradient(${grade.color} ${pct*3.6}deg,#f1f5f9 0deg)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
            <span style={{ fontSize:18, fontWeight:800, color:grade.color, lineHeight:1 }}>{score}</span>
            <span style={{ fontSize:11, color:'#8b95a7' }}>/{total}</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize:24, fontWeight:800, lineHeight:1 }}>{pct}점</div>
          <div style={{ fontSize:14, color:grade.color, fontWeight:600, marginTop:4 }}>{grade.label}</div>
          <div style={{ fontSize:13, color:'#5a6375', marginTop:2 }}>{score}개 정답 / {total-score}개 오답</div>
        </div>
      </div>

      {Object.keys(typeStats||{}).length > 0 && (
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'#5a6375', marginBottom:10, paddingTop:16, borderTop:'1px solid #f1f5f9' }}>유형별 분석</div>
          {Object.entries(typeStats).map(([typeName, stat]) => {
            const tp = Math.round((stat.correct/stat.total)*100);
            const c  = getTypeColor(typeName);
            return (
              <div key={typeName} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                <TypeBadge typeName={typeName} />
                <div style={{ flex:1, height:6, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${tp}%`, background:tp===100?'#16a34a':c.text, borderRadius:3 }}/>
                </div>
                <span style={{ fontSize:12, color:'#5a6375', minWidth:60, textAlign:'right' }}>{stat.correct}/{stat.total} ({tp}%)</span>
                {(stat.wrong||[]).length>0 && <span style={{ fontSize:11, color:'#dc2626' }}>오답:{stat.wrong.join(',')}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   메인 페이지
══════════════════════════════════════════ */
export default function ExamPage() {
  const router = useRouter();
  const { examId, student: queryStudent } = router.query;

  const [exam,           setExam]           = useState(null);
  const [studentName,    setStudentName]    = useState('');
  const [nameConfirmed,  setNameConfirmed]  = useState(false);
  const [answers,        setAnswers]        = useState({});
  const [saveStatus,     setSaveStatus]     = useState('idle');
  const [submitted,      setSubmitted]      = useState(false);
  const [results,        setResults]        = useState(null);
  const [showQuestion,   setShowQuestion]   = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [error,          setError]          = useState('');
  const [loading,        setLoading]        = useState(true);
  const [lastSavedTime,  setLastSavedTime]  = useState('');
  const [resultFilter,   setResultFilter]   = useState('all');
  const [selectedQuestionNos, setSelectedQuestionNos] = useState([]);
  const [sendingSelectedQuestions, setSendingSelectedQuestions] = useState(false);

  const saveTimerRef = useRef(null);

  useEffect(() => {
    if (!router.isReady) return;

    if (queryStudent) {
      const name = decodeURIComponent(queryStudent).trim();
      if (name) {
        setStudentName(name);
        setNameConfirmed(true);
        return;
      }
    }

    try {
      const saved = localStorage.getItem('examStudentName');
      if (saved && saved.trim()) {
        setStudentName(saved.trim());
      }
    } catch {}
  }, [router.isReady, queryStudent]);

  useEffect(() => {
    async function loadExam() {
      try {
        const res = await fetch('/api/teacher/dashboard');
        const data = await res.json();

        const list = data.exams || [];
        const found = list.find(e => e.id === examId);

        if (!found) {
          setError('시험을 찾을 수 없습니다.');
          return;
        }

        setExam(found);
      } catch (e) {
        setError('시험 정보를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    }

    if (examId) loadExam();
  }, [examId]);

  const autoSave = useCallback(async (currentAnswers) => {
    if (!nameConfirmed || !examId || submitted) return;
    setSaveStatus('saving');
    try {
      const res  = await fetch('/api/answers/autosave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId, studentName, answers: currentAnswers }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus('saved');
        const d = new Date(data.lastSaved);
        setLastSavedTime(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
    setTimeout(() => setSaveStatus(s => s==='saved'||s==='error'?'idle':s), 3000);
  }, [nameConfirmed, examId, studentName, submitted]);

  function handleAnswerChange(no, value) {
    const next = { ...answers, [no]: value };
    setAnswers(next);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => autoSave(next), 2000);
  }

  async function handleSubmit() {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const res  = await fetch('/api/answers/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId, studentName, answers }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setResults(data);
        setResultFilter('all');
        setSelectedQuestionNos([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(data.error || '제출 중 오류가 발생했습니다.');
      }
    } catch {
      alert('제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendQuestion(questionNo, message) {
    const res  = await fetch('/api/answers/question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId, studentName, questionNo, message }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
  }

  function toggleQuestionSelect(no) {
    setSelectedQuestionNos(prev =>
      prev.includes(no) ? prev.filter(n => n !== no) : [...prev, no]
    );
  }

  async function handleSendSelectedQuestions() {
    if (selectedQuestionNos.length === 0) {
      alert('질문할 문항을 먼저 선택해 주세요.');
      return;
    }

    setSendingSelectedQuestions(true);

    try {
      for (const no of selectedQuestionNos) {
        await handleSendQuestion(no, `${no}번 문항 질문 요청`);
      }

      alert(`선택한 ${selectedQuestionNos.length}개 문항을 선생님께 보냈습니다.`);
      setSelectedQuestionNos([]);
    } catch (e) {
      alert('질문 전송 중 오류가 발생했습니다.');
    } finally {
      setSendingSelectedQuestions(false);
    }
  }

  const answeredCount = exam
    ? exam.questions.filter(q => answers[q.no] && String(answers[q.no]).trim()).length
    : 0;

  const displayedQuestions = submitted
    ? (resultFilter === 'wrong'
        ? (exam?.questions || []).filter(q => {
            const r = results?.results?.find(item => item.no === q.no);
            return r && !r.correct;
          })
        : (exam?.questions || []))
    : (exam?.questions || []);

  const wrongCount = results?.results?.filter(r => !r.correct).length || 0;

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ width:40, height:40, border:'3px solid #e2e5ea', borderTopColor:'#2563eb', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color:'#5a6375', fontSize:14 }}>시험 정보를 불러오는 중...</span>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, padding:24 }}>
      <div style={{ fontSize:32 }}>⚠️</div>
      <div style={{ fontSize:16, fontWeight:600 }}>{error}</div>
      <div style={{ fontSize:13, color:'#8b95a7' }}>링크를 다시 확인해 주세요.</div>
    </div>
  );

  if (!nameConfirmed) return (
    <>
      <Head><title>{exam?.title || '시험'} | 답안 입력</title></Head>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Noto Sans KR',sans-serif;background:linear-gradient(135deg,#f4f5f7 0%,#e8edf5 100%);min-height:100vh;}`}</style>
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ background:'#fff', borderRadius:20, padding:'40px 36px', width:'100%', maxWidth:420, boxShadow:'0 8px 40px rgba(0,0,0,0.09)' }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ width:56, height:56, borderRadius:16, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:24 }}>📝</div>
            {exam && (
              <>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.08em', color:'#2563eb', marginBottom:6 }}>
                  {[exam.subject, exam.grade].filter(Boolean).join(' · ')}
                  {exam.difficulty && ` · ${exam.difficulty}`}
                </div>
                <h1 style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>{exam.title}</h1>
                <p style={{ fontSize:13, color:'#8b95a7' }}>총 {exam.totalQuestions}문항 · {exam.teacher}</p>
              </>
            )}
          </div>
          <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#5a6375', marginBottom:8 }}>학생 이름</label>
          <input
            type="text" value={studentName} onChange={e => setStudentName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && studentName.trim()) {
                try { localStorage.setItem('examStudentName', studentName.trim()); } catch {}
                setNameConfirmed(true);
              }
            }}
            placeholder="이름을 입력하세요"
            autoFocus={!studentName}
            style={{ width:'100%', padding:'14px 16px', border:'1.5px solid #e2e5ea', borderRadius:12, fontSize:16, fontFamily:'Noto Sans KR,sans-serif', outline:'none', marginBottom:8, boxSizing:'border-box' }}
          />
          {studentName && !queryStudent && (
            <p style={{ fontSize:11, color:'#2563eb', marginBottom:12 }}>
              🔖 이전에 저장된 이름입니다. 다른 이름이라면 수정하세요.
            </p>
          )}
          {queryStudent && (
            <p style={{ fontSize:11, color:'#16a34a', marginBottom:12 }}>
              ✓ 링크에서 이름이 자동으로 설정되었습니다.
            </p>
          )}
          {!studentName && !queryStudent && <div style={{ marginBottom:8 }}/>}
          <button
            onClick={() => {
              if (!studentName.trim()) return;
              try { localStorage.setItem('examStudentName', studentName.trim()); } catch {}
              setNameConfirmed(true);
            }}
            disabled={!studentName.trim()}
            style={{ width:'100%', padding:'14px 0', border:'none', borderRadius:12, background:studentName.trim()?'#2563eb':'#e2e5ea', color:studentName.trim()?'#fff':'#8b95a7', fontWeight:700, fontSize:15, cursor:studentName.trim()?'pointer':'default', fontFamily:'Noto Sans KR,sans-serif' }}>
            시험 시작하기 →
          </button>
          <p style={{ fontSize:12, color:'#8b95a7', textAlign:'center', marginTop:16 }}>입력한 이름이 선생님께 전달됩니다</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Head><title>{exam?.title} | {studentName}</title></Head>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Noto Sans KR',sans-serif;background:#f4f5f7;color:#1a1f2e;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-12px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <header style={{ position:'sticky', top:0, zIndex:100, background:'rgba(255,255,255,0.92)', backdropFilter:'blur(12px)', borderBottom:'1px solid #e2e5ea', padding:'12px 20px' }}>
        <div style={{ maxWidth:700, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div>
              <span style={{ fontSize:14, fontWeight:700 }}>{exam?.title}</span>
              <span style={{ fontSize:13, color:'#8b95a7', marginLeft:8 }}>· {studentName}</span>
            </div>
            <SaveIndicator status={saveStatus}/>
          </div>
          {!submitted && <ProgressBar answered={answeredCount} total={exam?.totalQuestions||0}/>}
          {submitted  && <div style={{ fontSize:13, color:'#16a34a', fontWeight:600 }}>✓ 제출 완료 — 채점 결과와 해설을 확인하세요</div>}
        </div>
      </header>

      <main style={{ maxWidth:700, margin:'0 auto', padding:'24px 16px 120px' }}>
        {submitted && results && (
          <ResultSummary score={results.score} total={results.total} typeStats={results.typeStats}/>
        )}

        {submitted && (
          <div style={{ background:'#fff', borderRadius:14, padding:'16px 18px', marginBottom:20, border:'1px solid #e2e5ea', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
            <button
              onClick={() => setResultFilter('all')}
              style={{
                padding:'10px 14px',
                borderRadius:10,
                border:`1.5px solid ${resultFilter==='all' ? '#2563eb' : '#e2e5ea'}`,
                background:resultFilter==='all' ? '#eff6ff' : '#fff',
                color:resultFilter==='all' ? '#2563eb' : '#5a6375',
                fontWeight:700,
                fontSize:13,
                cursor:'pointer',
                fontFamily:'Noto Sans KR,sans-serif'
              }}
            >
              전체 해설 보기
            </button>

            <button
              onClick={() => setResultFilter('wrong')}
              style={{
                padding:'10px 14px',
                borderRadius:10,
                border:`1.5px solid ${resultFilter==='wrong' ? '#2563eb' : '#e2e5ea'}`,
                background:resultFilter==='wrong' ? '#eff6ff' : '#fff',
                color:resultFilter==='wrong' ? '#2563eb' : '#5a6375',
                fontWeight:700,
                fontSize:13,
                cursor:'pointer',
                fontFamily:'Noto Sans KR,sans-serif'
              }}
            >
              틀린 문항만 보기 ({wrongCount})
            </button>

            <div style={{ marginLeft:'auto', fontSize:13, color:'#5a6375' }}>
              선택 문항: <strong>{selectedQuestionNos.length}개</strong>
            </div>

            <button
              onClick={handleSendSelectedQuestions}
              disabled={sendingSelectedQuestions || selectedQuestionNos.length===0}
              style={{
                padding:'10px 14px',
                borderRadius:10,
                border:'none',
                background:selectedQuestionNos.length===0 ? '#e2e5ea' : '#2563eb',
                color:'#fff',
                fontWeight:700,
                fontSize:13,
                cursor:selectedQuestionNos.length===0 ? 'default' : 'pointer',
                fontFamily:'Noto Sans KR,sans-serif',
                opacity:sendingSelectedQuestions ? 0.7 : 1
              }}
            >
              {sendingSelectedQuestions ? '전송 중...' : '선택 문항 질문 보내기'}
            </button>
          </div>
        )}

        {!submitted && (
          <div style={{ background:'#fff', borderRadius:14, padding:'18px 22px', marginBottom:20, border:'1px solid #e2e5ea', display:'flex', gap:16, alignItems:'center' }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#2563eb', marginBottom:2 }}>
                {[exam?.subject, exam?.grade].filter(Boolean).join(' · ')}
                {exam?.difficulty && ` · ${exam.difficulty}`}
              </div>
              <div style={{ fontSize:17, fontWeight:700 }}>{exam?.title}</div>
              <div style={{ fontSize:12, color:'#8b95a7', marginTop:2 }}>{exam?.teacher} · 총 {exam?.totalQuestions}문항</div>
            </div>
            {lastSavedTime && (
              <div style={{ fontSize:11, color:'#8b95a7', textAlign:'right' }}>
                마지막 저장<br/>
                <span style={{ fontFamily:'monospace', fontSize:12, color:'#5a6375' }}>{lastSavedTime}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {displayedQuestions.map((q, i) => (
            <QuestionCard
              key={q.no}
              question={q}
              answer={answers[q.no] || ''}
              onChange={handleAnswerChange}
              submitted={submitted}
              result={results?.results?.find(r => r.no === q.no)}
              index={i}
              showExplanation={submitted}
              isSelected={selectedQuestionNos.includes(q.no)}
              onToggleSelect={submitted ? toggleQuestionSelect : null}
            />
          ))}
        </div>
      </main>

      {!submitted && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', borderTop:'1px solid #e2e5ea', padding:'14px 16px' }}>
          <div style={{ maxWidth:700, margin:'0 auto', display:'flex', gap:10 }}>
            <button onClick={() => setShowQuestion(true)} style={{ padding:'12px 18px', border:'1.5px solid #e2e5ea', borderRadius:12, background:'#fff', color:'#5a6375', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'Noto Sans KR,sans-serif', whiteSpace:'nowrap' }}>
              🙋 질문하기
            </button>
            <button onClick={() => setShowConfirm(true)} disabled={submitting} style={{ flex:1, padding:'12px 0', border:'none', borderRadius:12, background:'linear-gradient(135deg,#2563eb,#3b82f6)', color:'#fff', fontWeight:700, fontSize:15, cursor:submitting?'default':'pointer', fontFamily:'Noto Sans KR,sans-serif', boxShadow:'0 4px 14px rgba(37,99,235,0.3)' }}>
              {submitting ? '제출 중...' : `답안 제출 (${answeredCount}/${exam?.totalQuestions})`}
            </button>
          </div>
        </div>
      )}

      {showConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16, backdropFilter:'blur(4px)' }}>
          <div style={{ background:'#fff', borderRadius:18, padding:'28px 28px 22px', width:'100%', maxWidth:360, boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📤</div>
              <h3 style={{ fontSize:17, fontWeight:700, marginBottom:6 }}>답안을 제출할까요?</h3>
              <p style={{ fontSize:13, color:'#5a6375' }}>제출 후에는 수정할 수 없습니다.</p>
              {answeredCount < (exam?.totalQuestions || 0) && (
                <div style={{ marginTop:12, padding:'10px 14px', background:'#fffbeb', borderRadius:10, border:'1px solid #fde68a', fontSize:13, color:'#d97706' }}>
                  ⚠️ {exam?.totalQuestions - answeredCount}개 문항에 답안이 없습니다
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowConfirm(false)} style={{ flex:1, padding:'12px 0', borderRadius:10, border:'1.5px solid #e2e5ea', background:'#fff', color:'#5a6375', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'Noto Sans KR,sans-serif' }}>취소</button>
              <button onClick={handleSubmit} style={{ flex:2, padding:'12px 0', borderRadius:10, border:'none', background:'#2563eb', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'Noto Sans KR,sans-serif' }}>제출하기</button>
            </div>
          </div>
        </div>
      )}

      {showQuestion && exam && (
        <QuestionModal
          questions={exam.questions}
          onClose={() => setShowQuestion(false)}
          onSend={handleSendQuestion}
        />
      )}
    </>
  );
}
