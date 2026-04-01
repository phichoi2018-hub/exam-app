/**
 * pages/teacher/index.jsx
 * 브라이언 선생님 관리 대시보드
 * http://localhost:3000/teacher
 */
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

/* ═══════════════════════════════════
   ① 상수
═══════════════════════════════════ */
const POLL_MS = 8000;

const TYPE_OPTIONS = [
  { typeId:'T01', typeName:'계산' },
  { typeId:'T02', typeName:'개념' },
  { typeId:'T03', typeName:'서술' },
  { typeId:'T04', typeName:'응용' },
  { typeId:'T05', typeName:'심화' },
  { typeId:'T06', typeName:'기타' },
];

const DIFFICULTY_OPTIONS = ['기본','실력하','실력중','심화하','심화중'];
const CIRCLE_NUMS        = ['①','②','③','④','⑤'];

function detectAnswerKind(answer) {
  return CIRCLE_NUMS.includes((answer||'').trim()) ? 'multiple' : 'short';
}

function normalizeShareBaseUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  return raw.replace(/\/+$/, '');
}

const TYPE_COLOR = {
  T01:{ bg:'#EFF6FF', text:'#1D4ED8', border:'#BFDBFE' },
  T02:{ bg:'#F0FDF4', text:'#15803D', border:'#BBF7D0' },
  T03:{ bg:'#FDF4FF', text:'#7E22CE', border:'#E9D5FF' },
  T04:{ bg:'#FFF7ED', text:'#C2410C', border:'#FED7AA' },
  T05:{ bg:'#FEF2F2', text:'#B91C1C', border:'#FECACA' },
  T06:{ bg:'#F1F5F9', text:'#475569', border:'#CBD5E1' },
};
const DEF_TC = { bg:'#F1F5F9', text:'#475569', border:'#CBD5E1' };

const DIFF_COLOR = {
  '기본':   { bg:'#F0FDF4', text:'#16A34A', border:'#86EFAC' },
  '실력하': { bg:'#EFF6FF', text:'#2563EB', border:'#BFDBFE' },
  '실력중': { bg:'#EFF6FF', text:'#1D4ED8', border:'#93C5FD' },
  '심화하': { bg:'#FFF7ED', text:'#D97706', border:'#FDE68A' },
  '심화중': { bg:'#FEF2F2', text:'#DC2626', border:'#FCA5A5' },
};

function tcByName(typeName) {
  const o = TYPE_OPTIONS.find(o => o.typeName === typeName);
  return o ? (TYPE_COLOR[o.typeId] || DEF_TC) : DEF_TC;
}
function scoreColor(pct) {
  if (pct >= 80) return '#16A34A';
  if (pct >= 60) return '#2563EB';
  if (pct >= 40) return '#D97706';
  return '#DC2626';
}
/* net 점수 → 상태 레이블 */
function netLabel(net, total) {
  if (total === 0) return { label:'데이터없음', color:'#8B95A7', bg:'#F8F9FB', border:'#E2E5EA' };
  if (net >  0)   return { label:'강점',   color:'#16A34A', bg:'#F0FDF4', border:'#86EFAC' };
  if (net === 0)  return { label:'보통',   color:'#D97706', bg:'#FFFBEB', border:'#FDE68A' };
  return              { label:'약점',   color:'#DC2626', bg:'#FEF2F2', border:'#FECACA' };
}

/* ═══════════════════════════════════
   ② 유틸
═══════════════════════════════════ */
function pad(n) { return String(n).padStart(2,'0'); }
function fmtDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getMonth()+1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fmtTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function studentStatus(s) {
  if (s.submitted)         return { label:'제출완료', bg:'#F0FDF4', color:'#16A34A', border:'#86EFAC' };
  if (s.answeredCount > 0) return { label:'진행중',   bg:'#EFF6FF', color:'#2563EB', border:'#BFDBFE' };
  return                          { label:'미접속',   bg:'#F8F9FB', color:'#8B95A7', border:'#E2E5EA' };
}

/* ═══════════════════════════════════
   ③ 공통 스타일
═══════════════════════════════════ */
const card = { background:'#fff', borderRadius:16, border:'1px solid #E2E5EA', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' };
const inp  = { width:'100%', padding:'9px 12px', fontSize:13, border:'1.5px solid #E2E5EA', borderRadius:9, outline:'none', fontFamily:'Noto Sans KR,sans-serif', color:'#1A1F2E', background:'#fff', boxSizing:'border-box' };
const sel  = { padding:'9px 10px', fontSize:13, border:'1.5px solid #E2E5EA', borderRadius:9, outline:'none', fontFamily:'Noto Sans KR,sans-serif', color:'#1A1F2E', background:'#fff', cursor:'pointer', width:'100%' };
const lbl  = { display:'block', fontSize:11, fontWeight:600, color:'#5A6375', marginBottom:5 };
const btnP = { padding:'11px 20px', border:'none', borderRadius:10, background:'#2563EB', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'Noto Sans KR,sans-serif' };
const btnS = { padding:'9px 14px', border:'1.5px solid #E2E5EA', borderRadius:9, background:'#fff', color:'#5A6375', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR,sans-serif' };
const btnD = { padding:'9px 14px', border:'1.5px solid #FECACA', borderRadius:9, background:'#fff', color:'#EF4444', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR,sans-serif' };
const TH   = { padding:'10px 14px', fontSize:12, fontWeight:600, color:'#8B95A7', background:'#F8F9FB', textAlign:'left', whiteSpace:'nowrap' };
const TD   = { padding:'11px 14px', fontSize:13, color:'#1A1F2E', borderBottom:'1px solid #F8F9FB' };

/* ═══════════════════════════════════
   ④ 소형 배지들
═══════════════════════════════════ */
function TypeBadge({ typeName }) {
  const c = tcByName(typeName);
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:600, background:c.bg, color:c.text, border:`1px solid ${c.border}` }}>{typeName}</span>;
}
function DiffBadge({ difficulty }) {
  const c = DIFF_COLOR[difficulty] || DIFF_COLOR['기본'];
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:c.bg, color:c.text, border:`1px solid ${c.border}` }}>{difficulty}</span>;
}
function KindBadge({ kind }) {
  const m = kind === 'multiple';
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:700, background:m?'#ECFEFF':'#F8F9FB', color:m?'#0E7490':'#64748B', border:`1px solid ${m?'#A5F3FC':'#E2E5EA'}` }}>{m?'객관식':'단답형'}</span>;
}
function StatCard({ icon, value, label, color='#2563EB' }) {
  return (
    <div style={{ ...card, padding:'18px 20px', flex:1, minWidth:120 }}>
      <div style={{ fontSize:22, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:26, fontWeight:800, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:12, color:'#8B95A7', marginTop:4 }}>{label}</div>
    </div>
  );
}
function TabBtn({ icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:6, padding:'12px 16px', border:'none', background:'transparent', cursor:'pointer', fontFamily:'Noto Sans KR,sans-serif', fontSize:13, fontWeight:active?700:500, color:active?'#2563EB':'#5A6375', borderBottom:`2px solid ${active?'#2563EB':'transparent'}`, transition:'all 0.15s', whiteSpace:'nowrap' }}>
      <span style={{ fontSize:14 }}>{icon}</span>
      {label}
      {badge > 0 && <span style={{ background:'#EF4444', color:'#fff', borderRadius:10, padding:'1px 7px', fontSize:11, fontWeight:700 }}>{badge}</span>}
    </button>
  );
}
function ExamSelector({ exams, selectedId, onChange }) {
  if (!exams.length) return null;
  return (
    <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
      {exams.map(e => (
        <button key={e.id} onClick={() => onChange(e.id)} style={{ padding:'8px 16px', borderRadius:10, border:`1.5px solid ${selectedId===e.id?'#2563EB':'#E2E5EA'}`, background:selectedId===e.id?'#EFF6FF':'#fff', color:selectedId===e.id?'#2563EB':'#5A6375', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR,sans-serif' }}>
          {e.title}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════
   ⑤ 시험 생성/수정 모달
═══════════════════════════════════ */
function ExamModal({ exam, onClose, onSave }) {
  const isEdit = !!exam;
  const [title,      setTitle]      = useState(exam?.title      || '');
  const [difficulty, setDifficulty] = useState(exam?.difficulty || '기본');
  const [grade,      setGrade]      = useState(exam?.grade      || '');
  const subject = '수학';

  function normalizeQ(q) {
    const typeName = q.typeName || q.type || '계산';
    const opt      = TYPE_OPTIONS.find(o => o.typeName===typeName) || TYPE_OPTIONS[0];
    const answer   = q.answer || '';
    return { no:q.no, typeId:opt.typeId, typeName:opt.typeName, answer, answerKind:q.answerKind||detectAnswerKind(answer) };
  }
  const [questions, setQuestions] = useState(
    exam?.questions?.length > 0 ? exam.questions.map(normalizeQ) : [{ no:1, typeId:'T01', typeName:'계산', answer:'', answerKind:'short' }]
  );
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const addQ    = () => setQuestions(q => [...q, { no:q.length+1, typeId:'T01', typeName:'계산', answer:'', answerKind:'short' }]);
  const removeQ = (i) => setQuestions(q => q.filter((_,idx)=>idx!==i).map((item,idx)=>({...item,no:idx+1})));
  function updateType(i, typeName) {
    const opt = TYPE_OPTIONS.find(o=>o.typeName===typeName)||TYPE_OPTIONS[0];
    setQuestions(q => q.map((item,idx) => idx===i ? {...item, typeId:opt.typeId, typeName:opt.typeName} : item));
  }
  function updateAnswer(i, val) {
    setQuestions(q => q.map((item,idx) => idx===i ? {...item, answer:val, answerKind:detectAnswerKind(val)} : item));
  }

  async function save() {
    setError('');
    if (!title.trim()) return setError('시험 제목을 입력해 주세요.');
    if (questions.some(q => !q.answer.trim())) return setError('모든 문항의 정답을 입력해 주세요.');
    setSaving(true);
    try {
      const body = { title, subject, grade, difficulty, questions };
      if (isEdit) body.id = exam.id;
      const res  = await fetch('/api/teacher/exams', { method:isEdit?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { onSave(); onClose(); }
      else setError(data.error || '저장에 실패했습니다.');
    } catch { setError('네트워크 오류가 발생했습니다.'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:200, padding:'28px 16px 16px', backdropFilter:'blur(4px)', overflowY:'auto' }}>
      <div style={{ ...card, width:'100%', maxWidth:620, padding:0, marginBottom:32 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 26px 14px', borderBottom:'1px solid #F1F5F9' }}>
          <div>
            <h2 style={{ fontSize:17, fontWeight:800 }}>{isEdit?'✏️ 시험 수정':'➕ 새 시험 만들기'}</h2>
            {isEdit && <p style={{ fontSize:11, color:'#8B95A7', marginTop:2 }}>저장 시 기존 제출 답안 자동 재채점</p>}
          </div>
          <button onClick={onClose} style={{ border:'none', background:'#F1F5F9', borderRadius:8, width:30, height:30, fontSize:15, cursor:'pointer', color:'#5A6375' }}>✕</button>
        </div>
        <div style={{ padding:'18px 26px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:18 }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={lbl}>시험 제목 *</label>
              <input style={inp} value={title} onChange={e=>setTitle(e.target.value)} placeholder="예: 1학기 중간고사"/>
            </div>
            <div><label style={lbl}>과목 (고정)</label><div style={{ ...inp, color:'#8B95A7', background:'#F8F9FB' }}>수학</div></div>
            <div><label style={lbl}>학년/반</label><input style={inp} value={grade} onChange={e=>setGrade(e.target.value)} placeholder="중학교 2학년"/></div>
            <div>
              <label style={lbl}>난이도</label>
              <select style={sel} value={difficulty} onChange={e=>setDifficulty(e.target.value)}>
                {DIFFICULTY_OPTIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div style={{ borderTop:'1px solid #F1F5F9', paddingTop:18 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:13, fontWeight:700 }}>문항 설정 <span style={{ color:'#2563EB' }}>({questions.length}문항)</span></span>
              <button onClick={addQ} style={{ ...btnS, borderStyle:'dashed', color:'#2563EB', borderColor:'#2563EB', padding:'6px 13px', fontSize:12 }}>+ 문항 추가</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'38px 130px 1fr 70px 28px', gap:6, padding:'0 4px', marginBottom:7 }}>
              {['번호','유형명','정답','구분',''].map((h,i) => <span key={i} style={{ fontSize:11, color:'#8B95A7', fontWeight:600 }}>{h}</span>)}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:360, overflowY:'auto', paddingRight:4 }}>
              {questions.map((q,i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'38px 130px 1fr 70px 28px', gap:6, alignItems:'center', background:'#F8F9FB', borderRadius:10, padding:'8px 10px', border:'1px solid #E2E5EA' }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'#2563EB', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>{q.no}</div>
                  <select value={q.typeName} onChange={e=>updateType(i,e.target.value)} style={{ ...sel, padding:'7px 8px', fontSize:12 }}>
                    {TYPE_OPTIONS.map(o => <option key={o.typeId} value={o.typeName}>{o.typeName} ({o.typeId})</option>)}
                  </select>
                  <div>
                    <div style={{ display:'flex', gap:3, marginBottom:4 }}>
                      {CIRCLE_NUMS.map(c => (
                        <button key={c} type="button" onClick={() => updateAnswer(i,c)} style={{ flex:1, padding:'3px 0', fontSize:12, border:`1.5px solid ${q.answer===c?'#2563EB':'#E2E5EA'}`, background:q.answer===c?'#EFF6FF':'#fff', color:q.answer===c?'#2563EB':'#8B95A7', borderRadius:6, cursor:'pointer', fontWeight:q.answer===c?700:400 }}>{c}</button>
                      ))}
                    </div>
                    <input value={q.answer} onChange={e=>updateAnswer(i,e.target.value)} placeholder="직접 입력 (단답형)" style={{ ...inp, padding:'6px 10px', fontSize:12 }}/>
                  </div>
                  <div style={{ textAlign:'center' }}><KindBadge kind={q.answerKind}/></div>
                  <button onClick={() => removeQ(i)} disabled={questions.length<=1} style={{ width:26, height:26, border:'none', borderRadius:7, background:questions.length<=1?'#F1F5F9':'#FEF2F2', color:questions.length<=1?'#CBD5E1':'#EF4444', cursor:questions.length<=1?'default':'pointer', fontSize:13 }}>✕</button>
                </div>
              ))}
            </div>
          </div>
          {error && <div style={{ marginTop:14, padding:'10px 14px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, fontSize:13, color:'#DC2626' }}>⚠️ {error}</div>}
          <div style={{ display:'flex', gap:10, marginTop:18 }}>
            <button onClick={onClose} style={{ ...btnS, flex:1, padding:'12px 0' }}>취소</button>
            <button onClick={save} disabled={saving} style={{ ...btnP, flex:2, padding:'12px 0', opacity:saving?0.7:1 }}>
              {saving ? '저장 중...' : isEdit ? '수정 저장 + 재채점' : '시험 생성'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function JsonImportModal({ onClose, onCreated }) {
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  function handlePreview() {
    setError('');
    setPreview(null);

    try {
      const parsed = JSON.parse(jsonText);

      if (!parsed.title) {
        setError('title 값이 없습니다.');
        return;
      }

      if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        setError('questions 배열이 없거나 비어 있습니다.');
        return;
      }

      setPreview(parsed);
    } catch (e) {
      setError('JSON 형식이 올바르지 않습니다.');
    }
  }

  async function handleCreate() {
    setError('');
    setLoading(true);

    try {
      const parsed = JSON.parse(jsonText);

      const res = await fetch('/api/teacher/createExamFromJson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || '시험 생성에 실패했습니다.');
        return;
      }

      alert(`시험 생성 완료: ${data.exam.title}`);
      onCreated?.();
      onClose?.();
    } catch (e) {
      setError('시험 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:300, padding:'28px 16px 16px', backdropFilter:'blur(4px)', overflowY:'auto' }}>
      <div style={{ ...card, width:'100%', maxWidth:760, padding:0, marginBottom:32 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 26px 14px', borderBottom:'1px solid #F1F5F9' }}>
          <div>
            <h2 style={{ fontSize:17, fontWeight:800 }}>📥 JSON으로 시험 가져오기</h2>
            <p style={{ fontSize:12, color:'#8B95A7', marginTop:4 }}>
              ChatGPT에서 만든 JSON을 붙여넣고 시험을 생성하세요.
            </p>
          </div>
          <button onClick={onClose} style={{ border:'none', background:'#F1F5F9', borderRadius:8, width:30, height:30, fontSize:15, cursor:'pointer', color:'#5A6375' }}>
            ✕
          </button>
        </div>

        <div style={{ padding:'18px 26px' }}>
          <label style={lbl}>시험 JSON 붙여넣기</label>
          <textarea
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
            placeholder={`{
  "title": "중2 1학기 테스트",
  "grade": "중2",
  "subject": "수학",
  "teacher": "브라이언 선생님",
  "difficulty": "기본",
  "totalQuestions": 2,
  "questions": [
    {
      "no": 1,
      "typeName": "개념",
      "correctRate": 88,
      "difficulty": "기본",
      "answer": "③",
      "explanation": "해설 예시"
    }
  ]
}`}
            style={{
              width:'100%',
              minHeight:260,
              padding:'14px 16px',
              border:'1.5px solid #E2E5EA',
              borderRadius:12,
              fontSize:13,
              lineHeight:1.5,
              fontFamily:'Consolas, monospace',
              outline:'none',
              resize:'vertical',
              boxSizing:'border-box'
            }}
          />

          <div style={{ display:'flex', gap:10, marginTop:14 }}>
            <button onClick={handlePreview} style={{ ...btnS }}>
              미리보기
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              style={{ ...btnP, opacity:loading ? 0.7 : 1 }}
            >
              {loading ? '생성 중...' : '시험 생성'}
            </button>
          </div>

          {error && (
            <div style={{ marginTop:14, padding:'10px 14px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, fontSize:13, color:'#DC2626' }}>
              ⚠️ {error}
            </div>
          )}

          {preview && (
            <div style={{ marginTop:18, border:'1px solid #E2E5EA', borderRadius:12, overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', background:'#F8F9FB', borderBottom:'1px solid #E2E5EA' }}>
                <div style={{ fontSize:15, fontWeight:800 }}>{preview.title}</div>
                <div style={{ fontSize:12, color:'#8B95A7', marginTop:4 }}>
                  {[preview.subject, preview.grade, preview.difficulty].filter(Boolean).join(' · ')} · 총 {preview.totalQuestions || preview.questions?.length || 0}문항
                </div>
              </div>

              <div style={{ maxHeight:280, overflowY:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...TH, textAlign:'center', width:60 }}>번호</th>
                      <th style={TH}>유형</th>
                      <th style={{ ...TH, textAlign:'center', width:80 }}>정답률</th>
                      <th style={{ ...TH, textAlign:'center', width:90 }}>난이도</th>
                      <th style={{ ...TH, textAlign:'center', width:80 }}>정답</th>
                      <th style={TH}>해설</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(preview.questions || []).map((q, idx) => (
                      <tr key={idx}>
                        <td style={{ ...TD, textAlign:'center' }}>{q.no}</td>
                        <td style={TD}>{q.typeName || '기타'}</td>
                        <td style={{ ...TD, textAlign:'center' }}>{q.correctRate ?? 0}%</td>
                        <td style={{ ...TD, textAlign:'center' }}>{q.difficulty || '기본'}</td>
                        <td style={{ ...TD, textAlign:'center', fontWeight:700 }}>{q.answer || ''}</td>
                        <td style={{ ...TD, color:'#5A6375' }}>
                          {String(q.explanation || '').slice(0, 50)}
                          {String(q.explanation || '').length > 50 ? '…' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function PromptMakerModal({ onClose }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');

  function generatePrompt() {
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
${input}`;
    setResult(prompt);
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(result);
      alert('복사 완료!');
    } catch (e) {
      alert('복사에 실패했습니다.');
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:320, padding:'28px 16px 16px', backdropFilter:'blur(4px)', overflowY:'auto' }}>
      <div style={{ ...card, width:'100%', maxWidth:760, padding:0, marginBottom:32 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 26px 14px', borderBottom:'1px solid #F1F5F9' }}>
          <div>
            <h2 style={{ fontSize:17, fontWeight:800 }}>🪄 JSON 요청문 만들기</h2>
            <p style={{ fontSize:12, color:'#8B95A7', marginTop:4 }}>
              문제 내용을 붙여넣으면 ChatGPT/Claude에 바로 넣을 요청문을 만들어 줍니다.
            </p>
          </div>
          <button onClick={onClose} style={{ border:'none', background:'#F1F5F9', borderRadius:8, width:30, height:30, fontSize:15, cursor:'pointer', color:'#5A6375' }}>
            ✕
          </button>
        </div>

        <div style={{ padding:'18px 26px' }}>
          <label style={lbl}>문제 내용 붙여넣기</label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="PDF에서 복사한 문제 내용이나 텍스트를 붙여넣으세요."
            style={{
              width:'100%',
              minHeight:220,
              padding:'14px 16px',
              border:'1.5px solid #E2E5EA',
              borderRadius:12,
              fontSize:13,
              lineHeight:1.5,
              fontFamily:'Noto Sans KR, sans-serif',
              outline:'none',
              resize:'vertical',
              boxSizing:'border-box'
            }}
          />

          <div style={{ display:'flex', gap:10, marginTop:14 }}>
            <button onClick={generatePrompt} style={btnP}>
              요청문 생성
            </button>
            <button onClick={() => setInput('')} style={btnS}>
              입력 지우기
            </button>
          </div>

          {result && (
            <div style={{ marginTop:18 }}>
              <label style={lbl}>생성된 요청문</label>
              <textarea
                value={result}
                readOnly
                style={{
                  width:'100%',
                  minHeight:280,
                  padding:'14px 16px',
                  border:'1.5px solid #E2E5EA',
                  borderRadius:12,
                  fontSize:13,
                  lineHeight:1.5,
                  fontFamily:'Consolas, monospace',
                  outline:'none',
                  resize:'vertical',
                  boxSizing:'border-box',
                  background:'#F8F9FB'
                }}
              />
              <div style={{ display:'flex', gap:10, marginTop:12 }}>
                <button onClick={copyPrompt} style={btnP}>복사</button>
                <button onClick={onClose} style={btnS}>닫기</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function QrModal({ title, url, onClose }) {
  if (!url) return null;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:350, padding:16, backdropFilter:'blur(4px)' }}>
      <div style={{ ...card, width:'100%', maxWidth:380, padding:'22px 22px 18px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:800 }}>QR 코드</div>
            <div style={{ fontSize:12, color:'#8B95A7', marginTop:4 }}>{title || '학생 접속 링크'}</div>
          </div>
          <button onClick={onClose} style={{ border:'none', background:'#F1F5F9', borderRadius:8, width:30, height:30, fontSize:15, cursor:'pointer', color:'#5A6375' }}>✕</button>
        </div>

        <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
          <img src={qrUrl} alt="QR 코드" width="220" height="220" style={{ border:'1px solid #E2E5EA', borderRadius:12, background:'#fff' }} />
        </div>

        <div style={{ padding:'10px 12px', background:'#F8F9FB', border:'1px solid #E2E5EA', borderRadius:10, fontSize:12, color:'#334155', wordBreak:'break-all', marginBottom:12 }}>
          {url}
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button
            onClick={() => {
              navigator.clipboard.writeText(url);
              alert('카톡용 링크를 복사했습니다.');
            }}
            style={{ ...btnP, flex:1, padding:'10px 0' }}
          >
            링크 복사
          </button>
          <button onClick={onClose} style={{ ...btnS, flex:1, padding:'10px 0' }}>닫기</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   ⑥ 채점 결과 상세 모달
═══════════════════════════════════ */
function ResultModal({ student, exam, onClose }) {
  if (!student) return null;
  const results    = student.results || [];
  const score      = student.score  ?? 0;
  const total      = student.total  ?? exam?.totalQuestions ?? 0;
  const pct        = total > 0 ? Math.round(score/total*100) : 0;
  const color      = scoreColor(pct);
  const wrongNos   = results.filter(r => !r.correct).map(r => r.no);
  const correctNos = results.filter(r =>  r.correct).map(r => r.no);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:200, padding:'28px 16px 16px', backdropFilter:'blur(6px)', overflowY:'auto' }}>
      <div style={{ ...card, width:'100%', maxWidth:600, padding:0, marginBottom:32 }}>
        <div style={{ padding:'18px 24px 14px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <h3 style={{ fontSize:18, fontWeight:800 }}>{student.studentName}의 채점 결과</h3>
            <p style={{ fontSize:12, color:'#8B95A7', marginTop:3 }}>{exam?.title} · 제출 {fmtDate(student.submittedAt)}</p>
          </div>
          <button onClick={onClose} style={{ border:'none', background:'#F1F5F9', borderRadius:8, width:30, height:30, fontSize:15, cursor:'pointer', color:'#5A6375' }}>✕</button>
        </div>
        <div style={{ padding:'18px 24px', borderBottom:'1px solid #F1F5F9', background:'#FAFBFC' }}>
          <div style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap', marginBottom:14 }}>
            <div style={{ width:80, height:80, borderRadius:'50%', flexShrink:0, background:`conic-gradient(${color} ${pct*3.6}deg,#E2E5EA 0deg)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:62, height:62, borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
                <span style={{ fontSize:18, fontWeight:800, color, lineHeight:1 }}>{pct}%</span>
                <span style={{ fontSize:10, color:'#8B95A7' }}>{score}/{total}</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, flex:1, flexWrap:'wrap' }}>
              {[{label:'총점',val:`${pct}점`,bg:'#fff',border:'#E2E5EA',tc:color},{label:'✓ 정답',val:`${score}개`,bg:'#F0FDF4',border:'#86EFAC',tc:'#16A34A'},{label:'✗ 오답',val:`${total-score}개`,bg:'#FEF2F2',border:'#FCA5A5',tc:'#DC2626'}].map(({label,val,bg,border,tc}) => (
                <div key={label} style={{ flex:1, minWidth:80, background:bg, border:`1px solid ${border}`, borderRadius:12, padding:'10px 14px', textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'#8B95A7', marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:tc }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
          {wrongNos.length > 0 && (
            <div style={{ padding:'10px 14px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, marginBottom:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#DC2626', marginBottom:7 }}>✗ 틀린 문제 번호</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {wrongNos.map(no => <span key={no} style={{ width:32, height:32, borderRadius:'50%', background:'#DC2626', color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800 }}>{no}</span>)}
              </div>
            </div>
          )}
          {correctNos.length > 0 && (
            <div style={{ padding:'10px 14px', background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:10, marginBottom:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#16A34A', marginBottom:7 }}>✓ 맞은 문제 번호</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {correctNos.map(no => <span key={no} style={{ width:32, height:32, borderRadius:'50%', background:'#16A34A', color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800 }}>{no}</span>)}
              </div>
            </div>
          )}
          {Object.keys(student.typeStats||{}).length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'#5A6375', marginBottom:7 }}>유형별 정답률</div>
              {Object.entries(student.typeStats).map(([typeName,stat]) => {
                const tp = Math.round(stat.correct/stat.total*100);
                return (
                  <div key={typeName} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <TypeBadge typeName={typeName}/>
                    <div style={{ flex:1, height:5, background:'#E2E5EA', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${tp}%`, background:tp===100?'#16A34A':tp>=50?'#2563EB':'#EF4444', borderRadius:3 }}/>
                    </div>
                    <span style={{ fontSize:11, color:'#5A6375', minWidth:70, textAlign:'right' }}>{stat.correct}/{stat.total} ({tp}%)</span>
                    {(stat.wrong||[]).length>0 && <span style={{ fontSize:10, color:'#DC2626' }}>오답:{stat.wrong.join(',')}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div>
          <div style={{ padding:'12px 24px 8px', fontSize:12, fontWeight:700 }}>문항별 학생답 / 정답 비교</div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...TH, textAlign:'center', width:44 }}>번호</th>
                  <th style={TH}>유형</th>
                  <th style={{ ...TH, textAlign:'center' }}>구분</th>
                  <th style={{ ...TH, textAlign:'center' }}>학생 답안</th>
                  <th style={{ ...TH, textAlign:'center' }}>정답</th>
                  <th style={{ ...TH, textAlign:'center', width:44 }}>결과</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0
                  ? <tr><td colSpan={6} style={{ ...TD, textAlign:'center', color:'#8B95A7', padding:32 }}>채점 데이터가 없습니다</td></tr>
                  : results.map(r => (
                    <tr key={r.no} style={{ background:r.correct?'transparent':'#FFF5F5' }}>
                      <td style={{ ...TD, textAlign:'center' }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', margin:'0 auto', background:r.correct?'#F0FDF4':'#FEF2F2', border:`1.5px solid ${r.correct?'#86EFAC':'#FCA5A5'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:r.correct?'#16A34A':'#DC2626' }}>{r.no}</div>
                      </td>
                      <td style={TD}><TypeBadge typeName={r.typeName||'기타'}/></td>
                      <td style={{ ...TD, textAlign:'center' }}><KindBadge kind={r.answerKind||'short'}/></td>
                      <td style={{ ...TD, textAlign:'center' }}>
                        {r.studentAnswer
                          ? <span style={{ fontWeight:600, color:r.correct?'#15803D':'#DC2626', background:r.correct?'#F0FDF4':'#FEF2F2', border:`1px solid ${r.correct?'#BBF7D0':'#FECACA'}`, borderRadius:7, padding:'2px 10px', fontSize:13 }}>{r.studentAnswer}</span>
                          : <span style={{ color:'#CBD5E1', fontSize:11 }}>미입력</span>}
                      </td>
                      <td style={{ ...TD, textAlign:'center' }}>
                        <span style={{ fontWeight:700, color:'#15803D', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:7, padding:'2px 10px', fontSize:13 }}>{r.correctAnswer}</span>
                      </td>
                      <td style={{ ...TD, textAlign:'center', fontSize:18, fontWeight:700, color:r.correct?'#16A34A':'#DC2626' }}>{r.correct?'✓':'✗'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ padding:'14px 24px', borderTop:'1px solid #F1F5F9' }}>
          <button onClick={onClose} style={{ ...btnS, width:'100%', padding:'11px 0', textAlign:'center' }}>닫기</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════
   ⑦ 오답관리 탭 컴포넌트
═══════════════════════════════════ */
function WrongAnswerTab({ wrongAnswers }) {
  const studentNames = Object.keys(wrongAnswers).sort();
  const [selectedStudent, setSelectedStudent] = useState(studentNames[0] || '');

  if (studentNames.length === 0) {
    return (
      <div style={{ ...card, padding:'60px 24px', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>📊</div>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>오답관리 데이터가 없습니다</div>
        <div style={{ fontSize:13, color:'#8B95A7' }}>학생이 시험을 제출하면 자동으로 반영됩니다</div>
      </div>
    );
  }

  const rec = wrongAnswers[selectedStudent] || {};
  const typeScores = rec.typeScores || {};
  const appliedCount = (rec.appliedKeys || []).length;

  return (
    <div>
      {/* 학생 선택 */}
      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:13, color:'#5A6375', fontWeight:600 }}>학생 선택:</span>
        {studentNames.map(name => (
          <button key={name} onClick={() => setSelectedStudent(name)} style={{ padding:'8px 16px', borderRadius:10, border:`1.5px solid ${selectedStudent===name?'#2563EB':'#E2E5EA'}`, background:selectedStudent===name?'#EFF6FF':'#fff', color:selectedStudent===name?'#2563EB':'#5A6375', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'Noto Sans KR,sans-serif' }}>
            {name}
          </button>
        ))}
      </div>

      {selectedStudent && (
        <div style={card}>
          {/* 헤더 */}
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:800 }}>{selectedStudent}의 유형별 오답관리</div>
              <div style={{ fontSize:12, color:'#8B95A7', marginTop:2 }}>
                반영된 시험 {appliedCount}회 · 점수: 정답 +1 / 오답 -1 누적
              </div>
            </div>
            {/* 범례 */}
            <div style={{ display:'flex', gap:8, fontSize:11 }}>
              {[{label:'강점 (net > 0)', color:'#16A34A', bg:'#F0FDF4', border:'#86EFAC'}, {label:'보통 (net = 0)', color:'#D97706', bg:'#FFFBEB', border:'#FDE68A'}, {label:'약점 (net < 0)', color:'#DC2626', bg:'#FEF2F2', border:'#FECACA'}].map(l => (
                <span key={l.label} style={{ padding:'2px 8px', borderRadius:6, background:l.bg, color:l.color, border:`1px solid ${l.border}`, fontWeight:600 }}>{l.label}</span>
              ))}
            </div>
          </div>

          {Object.keys(typeScores).length === 0 ? (
            <div style={{ padding:48, textAlign:'center', color:'#8B95A7' }}>이 학생의 오답 데이터가 없습니다</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    <th style={TH}>유형 ID</th>
                    <th style={TH}>유형명</th>
                    {DIFFICULTY_OPTIONS.map(d => (
                      <th key={d} style={{ ...TH, textAlign:'center' }}>{d}</th>
                    ))}
                    <th style={{ ...TH, textAlign:'center' }}>전체 합계</th>
                    <th style={{ ...TH, textAlign:'center' }}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {TYPE_OPTIONS.map(opt => {
                    const ts    = typeScores[opt.typeId];
                    const total = ts?.total || { correct:0, wrong:0, net:0 };
                    const nl    = netLabel(total.net, total.correct + total.wrong);
                    const tc    = TYPE_COLOR[opt.typeId] || DEF_TC;

                    return (
                      <tr key={opt.typeId}>
                        {/* typeId */}
                        <td style={TD}>
                          <span style={{ fontFamily:'monospace', fontWeight:700, fontSize:12, color:'#475569', background:'#F1F5F9', padding:'2px 8px', borderRadius:6 }}>{opt.typeId}</span>
                        </td>
                        {/* typeName */}
                        <td style={TD}>
                          <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:600, background:tc.bg, color:tc.text, border:`1px solid ${tc.border}` }}>{opt.typeName}</span>
                        </td>
                        {/* 난이도별 점수 */}
                        {DIFFICULTY_OPTIONS.map(diff => {
                          const bk  = ts?.byDifficulty?.[diff];
                          if (!bk) return (
                            <td key={diff} style={{ ...TD, textAlign:'center', color:'#CBD5E1' }}>—</td>
                          );
                          const dnl = netLabel(bk.net, bk.correct+bk.wrong);
                          const dc  = DIFF_COLOR[diff] || {};
                          return (
                            <td key={diff} style={{ ...TD, textAlign:'center' }}>
                              <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                                <span style={{ fontSize:13, fontWeight:800, color:dnl.color }}>{bk.net > 0 ? '+' : ''}{bk.net}</span>
                                <span style={{ fontSize:10, color:'#8B95A7' }}>✓{bk.correct} ✗{bk.wrong}</span>
                                <span style={{ padding:'1px 6px', borderRadius:4, fontSize:9, fontWeight:700, background:dc.bg||'#F8F9FB', color:dc.text||'#8B95A7', border:`1px solid ${dc.border||'#E2E5EA'}` }}>{diff}</span>
                              </div>
                            </td>
                          );
                        })}
                        {/* 전체 합계 */}
                        <td style={{ ...TD, textAlign:'center' }}>
                          {total.correct + total.wrong === 0
                            ? <span style={{ color:'#CBD5E1' }}>—</span>
                            : <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                                <span style={{ fontSize:14, fontWeight:800, color:nl.color }}>{total.net > 0 ? '+' : ''}{total.net}</span>
                                <span style={{ fontSize:10, color:'#8B95A7' }}>✓{total.correct} ✗{total.wrong}</span>
                              </div>
                          }
                        </td>
                        {/* 상태 */}
                        <td style={{ ...TD, textAlign:'center' }}>
                          {total.correct + total.wrong === 0
                            ? <span style={{ fontSize:12, color:'#CBD5E1' }}>미응시</span>
                            : <span style={{ padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:nl.bg, color:nl.color, border:`1px solid ${nl.border}` }}>{nl.label}</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 반영된 시험 목록 */}
          {appliedCount > 0 && (
            <div style={{ padding:'12px 20px', borderTop:'1px solid #F1F5F9', background:'#FAFBFC' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#5A6375', marginBottom:7 }}>반영된 시험 ({appliedCount}회)</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {(rec.appliedKeys||[]).map(k => (
                  <span key={k} style={{ padding:'2px 10px', borderRadius:20, fontSize:11, background:'#EFF6FF', color:'#2563EB', border:'1px solid #BFDBFE', fontFamily:'monospace' }}>{k}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════
   ⑧ 메인 페이지
═══════════════════════════════════ */
export default function TeacherPage() {
  const [tab,          setTab]          = useState('exams');
  const [exams,        setExams]        = useState([]);
  const [questions,    setQuestions]    = useState({});
  const [wrongAnswers, setWrongAnswers] = useState({});
  const [loading,      setLoading]      = useState(true);
  const [lastRefresh,  setLastRefresh]  = useState('');
  const [selectedId,   setSelectedId]   = useState('');
  const [modal,        setModal]        = useState(null);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [showPromptMaker, setShowPromptMaker] = useState(false);
  const [resultModal,  setResultModal]  = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [copiedId,     setCopiedId]     = useState('');
  const [shareBaseUrl, setShareBaseUrl] = useState('');
  const [showShareSettings, setShowShareSettings] = useState(false);
  const [qrExam, setQrExam] = useState(null);

  const selectedIdRef = useRef('');
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('exam_share_base_url');
    setShareBaseUrl(normalizeShareBaseUrl(saved || window.location.origin));
  }, []);

  async function loadAll() {
    try {
      const [dRes, qRes, wRes] = await Promise.all([
        fetch('/api/teacher/dashboard'),
        fetch('/api/teacher/questions'),
        fetch('/api/teacher/wrongAnswers'),
      ]);
      if (!dRes.ok) throw new Error(`dashboard ${dRes.status}`);
      const dash  = await dRes.json();
      const qData = await qRes.json();
      const wData = await wRes.json();
      const list  = dash.exams || [];

      setExams(list);
      setQuestions(qData.questions || {});
      setWrongAnswers(wData.wrongAnswers || {});
      if (!selectedIdRef.current && list.length > 0) setSelectedId(list[0].id);

      const n = new Date();
      setLastRefresh(`${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`);
    } catch (e) {
      console.error('[loadAll]', e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    const t = setInterval(loadAll, POLL_MS);
    return () => clearInterval(t);
  }, []); // eslint-disable-line

  async function handleDelete(id) {
    const res  = await fetch('/api/teacher/exams', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) });
    const data = await res.json();
    if (data.success) { setDeleteTarget(null); if (selectedId===id) setSelectedId(''); loadAll(); }
  }

  async function markRead(examId, questionId) {
    await fetch('/api/teacher/questions', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({examId, questionId}) });
    loadAll();
  }

  function buildShareUrl(examId) {
    const base = normalizeShareBaseUrl(shareBaseUrl || (typeof window !== 'undefined' ? window.location.origin : ''));
    return `${base}/exam/${examId}`;
  }

  function saveShareBaseUrl() {
    const normalized = normalizeShareBaseUrl(shareBaseUrl);
    setShareBaseUrl(normalized);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('exam_share_base_url', normalized);
    }
    setShowShareSettings(false);
    alert('카톡 공유 주소를 저장했습니다.');
  }

  function copyLink(examId) {
    const url = buildShareUrl(examId);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(examId);
      setTimeout(() => setCopiedId(''), 2000);
    });
  }

  const totalStudents  = exams.reduce((s,e) => s+(e.studentCount||0), 0);
  const totalSubmitted = exams.reduce((s,e) => s+(e.submittedCount||0), 0);
  const unreadQ        = Object.values(questions).flat().filter(q=>!q.read).length;
  const selExam        = exams.find(e => e.id===selectedId);
  const selStudents    = selExam?.students || [];
  const submitted      = selStudents.filter(s => s.submitted);
  const wrongStudentCount = Object.keys(wrongAnswers).length;

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14 }}>
      <div style={{ width:36, height:36, border:'3px solid #E2E5EA', borderTopColor:'#2563EB', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color:'#8B95A7', fontSize:14 }}>로딩 중...</span>
    </div>
  );

  return (
    <>
      <Head><title>브라이언 선생님 | 관리 대시보드</title></Head>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Noto Sans KR',sans-serif;background:#F4F5F7;color:#1A1F2E;}
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        table{border-collapse:collapse;width:100%;}
        input:focus,select:focus{border-color:#2563EB!important;box-shadow:0 0 0 3px rgba(37,99,235,0.1);}
        ::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:3px;}
        tbody tr:hover td{background:#F8F9FB;}
      `}</style>

      {/* ══ 헤더 ══ */}
      <header style={{ background:'#fff', borderBottom:'1px solid #E2E5EA', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0 0', flexWrap:'wrap', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>👨‍🏫</div>
              <div>
                <div style={{ fontSize:15, fontWeight:800 }}>브라이언 선생님 대시보드</div>
                <div style={{ fontSize:11, color:'#8B95A7' }}>마지막 갱신: {lastRefresh||'—'} · {POLL_MS/1000}초 자동갱신</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={loadAll} style={btnS}>🔄 새로고침</button>
              <button onClick={() => setShowShareSettings(true)} style={btnS}>🌐 공유주소</button>
              <button onClick={() => setShowPromptMaker(true)} style={btnS}>🪄 JSON 요청문</button>
              <button onClick={() => setShowJsonImport(true)} style={btnS}>📥 JSON 가져오기</button>
              <button onClick={() => setModal('create')} style={{ ...btnP, display:'flex', alignItems:'center', gap:6, boxShadow:'0 2px 8px rgba(37,99,235,0.3)' }}>➕ 새 시험 만들기</button>
            </div>
          </div>
          <div style={{ display:'flex', gap:0, overflowX:'auto', marginTop:8 }}>
            <TabBtn icon="📋" label="시험 목록"  active={tab==='exams'}     onClick={()=>setTab('exams')}/>
            <TabBtn icon="👥" label="학생 현황"  active={tab==='status'}    onClick={()=>setTab('status')}/>
            <TabBtn icon="✅" label="채점 결과"  active={tab==='results'}   onClick={()=>setTab('results')}/>
            <TabBtn icon="📊" label="오답관리"   active={tab==='wrong'}     onClick={()=>setTab('wrong')} badge={wrongStudentCount}/>
            <TabBtn icon="🙋" label="질문함"     active={tab==='questions'} onClick={()=>setTab('questions')} badge={unreadQ}/>
          </div>
        </div>
      </header>

      {/* ══ 본문 ══ */}
      <main style={{ maxWidth:1200, margin:'0 auto', padding:'24px 20px 80px' }}>

        {/* 통계 카드 */}
        <div style={{ display:'flex', gap:14, marginBottom:24, flexWrap:'wrap' }}>
          <StatCard icon="📝" value={exams.length}       label="등록된 시험"  color="#2563EB"/>
          <StatCard icon="🎓" value={totalStudents}      label="참여 학생"    color="#7C3AED"/>
          <StatCard icon="✅" value={totalSubmitted}     label="제출 완료"    color="#16A34A"/>
          <StatCard icon="📊" value={wrongStudentCount}  label="오답관리 학생" color="#D97706"/>
          <StatCard icon="🙋" value={unreadQ}            label="미확인 질문"  color={unreadQ>0?'#EF4444':'#8B95A7'}/>
        </div>

        <div style={{ ...card, padding:'14px 16px', marginBottom:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>카톡 전송용 기본 주소</div>
              <div style={{ fontSize:12, color:'#5A6375', wordBreak:'break-all' }}>
                {shareBaseUrl || '주소를 설정해 주세요'}
              </div>
              {(shareBaseUrl || '').includes('localhost') && (
                <div style={{ fontSize:11, color:'#D97706', marginTop:6 }}>
                  localhost 상태면 다른 휴대폰에서 안 열립니다. 컴퓨터 IPv4 주소로 바꿔 주세요.
                </div>
              )}
            </div>
            <button onClick={() => setShowShareSettings(true)} style={btnS}>설정</button>
          </div>
        </div>

        {showShareSettings && (
          <div style={{ ...card, padding:'16px 18px', marginBottom:18, border:'1px solid #BFDBFE', background:'#F8FBFF' }}>
            <div style={{ fontSize:14, fontWeight:800, marginBottom:10 }}>🌐 카톡 공유 주소 설정</div>
            <div style={{ fontSize:12, color:'#5A6375', marginBottom:10 }}>
              예: http://192.168.0.15:3000
            </div>
            <input
              value={shareBaseUrl}
              onChange={(e) => setShareBaseUrl(e.target.value)}
              style={{ ...inp, marginBottom:10 }}
              placeholder="http://192.168.0.15:3000"
            />
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <button onClick={saveShareBaseUrl} style={btnP}>저장</button>
              <button onClick={() => setShareBaseUrl(typeof window !== 'undefined' ? window.location.origin : '')} style={btnS}>현재 주소 넣기</button>
              <button onClick={() => setShowShareSettings(false)} style={btnS}>닫기</button>
            </div>
          </div>
        )}

        {/* ══ 탭 1: 시험 목록 ══ */}
        {tab==='exams' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {exams.length===0 ? (
              <div style={{ ...card, padding:'64px 24px', textAlign:'center' }}>
                <div style={{ fontSize:44, marginBottom:14 }}>📝</div>
                <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>아직 등록된 시험이 없습니다</div>
                <div style={{ fontSize:13, color:'#8B95A7', marginBottom:24 }}>오른쪽 위 버튼으로 첫 시험을 만들어 보세요!</div>
                <button onClick={()=>setModal('create')} style={btnP}>➕ 시험 만들기</button>
              </div>
            ) : exams.map(exam => {
              const studs    = exam.students||[];
              const sub      = studs.filter(s=>s.submitted);
              const avgScore = sub.length>0 ? Math.round(sub.reduce((acc,s)=>acc+(s.score/s.total*100),0)/sub.length) : null;
              return (
                <div key={exam.id} style={{ ...card, overflow:'hidden', animation:'fadeUp 0.3s ease' }}>
                  <div style={{ padding:'16px 20px', display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:180 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                        <span style={{ fontSize:11, fontWeight:600, color:'#2563EB' }}>수학{exam.grade?' · '+exam.grade:''}</span>
                        {exam.difficulty && <DiffBadge difficulty={exam.difficulty}/>}
                      </div>
                      <div style={{ fontSize:18, fontWeight:800 }}>{exam.title}</div>
                      <div style={{ fontSize:13, color:'#5A6375', marginTop:5, display:'flex', gap:14, flexWrap:'wrap' }}>
                        <span>{exam.totalQuestions}문항</span>
                        <span style={{ color:'#7C3AED', fontWeight:600 }}>참여 {exam.studentCount}명</span>
                        <span style={{ color:'#16A34A', fontWeight:600 }}>제출 {exam.submittedCount}명</span>
                        {avgScore!==null && <span style={{ color:'#2563EB', fontWeight:600 }}>평균 {avgScore}점</span>}
                      </div>
                    </div>
                    <div style={{ background:'#F8F9FB', border:'1px solid #E2E5EA', borderRadius:10, padding:'9px 13px', fontSize:12, flexShrink:0, minWidth:285 }}>
                      <div style={{ color:'#8B95A7', marginBottom:3, fontSize:10 }}>학생 접속 링크</div>
                      <div style={{ fontFamily:'monospace', color:'#2563EB', fontWeight:600, fontSize:12, marginBottom:6, wordBreak:'break-all' }}>
                        {buildShareUrl(exam.id)}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                        <button onClick={()=>copyLink(exam.id)} style={{ border:'none', background:copiedId===exam.id?'#F0FDF4':'#EFF6FF', color:copiedId===exam.id?'#16A34A':'#2563EB', borderRadius:6, padding:'3px 8px', fontSize:10, cursor:'pointer', fontFamily:'Noto Sans KR,sans-serif', fontWeight:600 }}>
                          {copiedId===exam.id?'✓ 복사됨':'복사'}
                        </button>
                        <button onClick={()=>setQrExam(exam)} style={{ border:'none', background:'#FFF7ED', color:'#C2410C', borderRadius:6, padding:'3px 8px', fontSize:10, cursor:'pointer', fontFamily:'Noto Sans KR,sans-serif', fontWeight:600 }}>
                          QR
                        </button>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:7, flexShrink:0 }}>
                      <button onClick={()=>{setSelectedId(exam.id);setTab('status');}} style={btnS}>👥 현황</button>
                      <button onClick={()=>setModal(exam)} style={btnS}>✏️ 수정</button>
                      <button onClick={()=>setDeleteTarget(exam.id)} style={btnD}>🗑</button>
                    </div>
                  </div>
                  <div style={{ padding:'9px 20px 12px', borderTop:'1px solid #F8F9FB', background:'#FAFBFC', display:'flex', gap:5, flexWrap:'wrap', alignItems:'center' }}>
                    <span style={{ fontSize:10, color:'#8B95A7', marginRight:4 }}>문항:</span>
                    {exam.questions?.map(q => {
                      const typeName = q.typeName||q.type||'기타';
                      const tc       = tcByName(typeName);
                      const kind     = q.answerKind||'short';
                      return (
                        <span key={q.no} style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 8px', borderRadius:20, fontSize:10, background:'#fff', border:'1px solid #E2E5EA', color:'#5A6375' }}>
                          <span style={{ width:16, height:16, borderRadius:'50%', background:tc.text, color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700 }}>{q.no}</span>
                          <span style={{ color:tc.text, fontWeight:600 }}>{typeName}</span>
                          <span style={{ color:kind==='multiple'?'#0E7490':'#94A3B8', fontSize:9 }}>{kind==='multiple'?'객':'단'}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ 탭 2: 학생 현황 ══ */}
        {tab==='status' && (
          <div>
            <ExamSelector exams={exams} selectedId={selectedId} onChange={setSelectedId}/>
            {!selExam ? (
              <div style={{ ...card, padding:48, textAlign:'center', color:'#8B95A7' }}>시험을 먼저 만들어 주세요</div>
            ) : (
              <div style={card}>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:800 }}>{selExam.title}</div>
                    <div style={{ fontSize:12, color:'#8B95A7', marginTop:2 }}>
                      {selExam.totalQuestions}문항 · <span style={{ color:'#7C3AED', fontWeight:600 }}>참여 {selExam.studentCount}명</span> · <span style={{ color:'#16A34A', fontWeight:600 }}>제출 {selExam.submittedCount}명</span>
                    </div>
                  </div>
                  <span style={{ fontSize:10, color:'#8B95A7' }}>{POLL_MS/1000}초 자동갱신</span>
                </div>
                {selStudents.length===0 ? (
                  <div style={{ padding:'48px 24px', textAlign:'center' }}>
                    <div style={{ fontSize:36, marginBottom:10 }}>👀</div>
                    <div style={{ fontSize:14, color:'#8B95A7' }}>아직 접속한 학생이 없습니다</div>
                  </div>
                ) : (
                  <div style={{ overflowX:'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th style={TH}>학생 이름</th>
                          <th style={TH}>진행 상태</th>
                          <th style={TH}>입력 현황</th>
                          <th style={{ ...TH, textAlign:'center' }}>마지막 활동</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selStudents.map(s => {
                          const pct    = selExam.totalQuestions>0 ? Math.round(s.answeredCount/selExam.totalQuestions*100) : 0;
                          const status = studentStatus(s);
                          return (
                            <tr key={s.studentName}>
                              <td style={TD}><span style={{ fontWeight:700 }}>{s.studentName}</span></td>
                              <td style={TD}>
                                <span style={{ background:status.bg, color:status.color, border:`1px solid ${status.border}`, borderRadius:20, padding:'3px 12px', fontSize:12, fontWeight:600 }}>{status.label}</span>
                              </td>
                              <td style={{ ...TD, minWidth:200 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                  <div style={{ flex:1, height:6, background:'#F1F5F9', borderRadius:3, overflow:'hidden' }}>
                                    <div style={{ height:'100%', width:`${pct}%`, background:s.submitted?'#16A34A':'#3B82F6', borderRadius:3, transition:'width 0.4s' }}/>
                                  </div>
                                  <span style={{ fontSize:13, fontWeight:600, minWidth:52 }}>{s.answeredCount}/{selExam.totalQuestions}</span>
                                </div>
                              </td>
                              <td style={{ ...TD, textAlign:'center', fontSize:12, color:'#8B95A7' }}>
                                {s.submitted ? fmtDate(s.submittedAt) : fmtTime(s.lastSaved)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ 탭 3: 채점 결과 ══ */}
        {tab==='results' && (
          <div>
            <ExamSelector exams={exams} selectedId={selectedId} onChange={setSelectedId}/>
            {!selExam ? (
              <div style={{ ...card, padding:48, textAlign:'center', color:'#8B95A7' }}>시험을 먼저 만들어 주세요</div>
            ) : submitted.length===0 ? (
              <div style={{ ...card, padding:'56px 24px', textAlign:'center' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>⏳</div>
                <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>{selExam.title}</div>
                <div style={{ fontSize:13, color:'#8B95A7' }}>아직 제출한 학생이 없습니다</div>
              </div>
            ) : (
              <div style={card}>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid #F1F5F9' }}>
                  <div style={{ fontSize:15, fontWeight:800 }}>{selExam.title} — 채점 결과</div>
                  <div style={{ fontSize:12, color:'#8B95A7', marginTop:2 }}>제출 {submitted.length}명 · 행 클릭 시 상세 확인</div>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th style={TH}>학생 이름</th>
                        <th style={{ ...TH, textAlign:'center' }}>총점</th>
                        <th style={{ ...TH, textAlign:'center' }}>맞은 수</th>
                        <th style={{ ...TH, textAlign:'center' }}>틀린 수</th>
                        <th style={TH}>틀린 번호</th>
                        <th style={TH}>약점 유형</th>
                        <th style={{ ...TH, textAlign:'center' }}>제출 시각</th>
                        <th style={{ ...TH, textAlign:'center' }}>상세</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submitted.sort((a,b)=>(b.score/b.total)-(a.score/a.total)).map(s => {
                        const pct       = Math.round(s.score/s.total*100);
                        const color     = scoreColor(pct);
                        const wrongNos  = (s.results||[]).filter(r=>!r.correct).map(r=>r.no);
                        const weakTypes = Object.entries(s.typeStats||{}).filter(([,st])=>st.correct<st.total).map(([tn])=>tn);
                        return (
                          <tr key={s.studentName} style={{ cursor:'pointer' }} onClick={()=>setResultModal({student:s,exam:selExam})}>
                            <td style={TD}><span style={{ fontWeight:700 }}>{s.studentName}</span></td>
                            <td style={{ ...TD, textAlign:'center' }}><span style={{ fontSize:16, fontWeight:800, color }}>{pct}점</span></td>
                            <td style={{ ...TD, textAlign:'center' }}>
                              <span style={{ fontWeight:700, color:'#16A34A', background:'#F0FDF4', border:'1px solid #86EFAC', borderRadius:20, padding:'2px 12px', fontSize:12 }}>{s.score}개</span>
                            </td>
                            <td style={{ ...TD, textAlign:'center' }}>
                              <span style={{ fontWeight:700, color:s.total-s.score===0?'#8B95A7':'#DC2626', background:s.total-s.score===0?'#F8F9FB':'#FEF2F2', border:`1px solid ${s.total-s.score===0?'#E2E5EA':'#FCA5A5'}`, borderRadius:20, padding:'2px 12px', fontSize:12 }}>{s.total-s.score}개</span>
                            </td>
                            <td style={TD}>
                              {wrongNos.length===0
                                ? <span style={{ fontSize:12, color:'#16A34A' }}>전부 정답 🎉</span>
                                : <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                                    {wrongNos.map(no => <span key={no} style={{ width:26, height:26, borderRadius:'50%', background:'#DC2626', color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800 }}>{no}</span>)}
                                  </div>}
                            </td>
                            <td style={TD}>
                              <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                                {weakTypes.length===0
                                  ? <span style={{ fontSize:12, color:'#16A34A' }}>없음 ✓</span>
                                  : weakTypes.map(t => <TypeBadge key={t} typeName={t}/>)}
                              </div>
                            </td>
                            <td style={{ ...TD, textAlign:'center', fontSize:12, color:'#8B95A7' }}>{fmtDate(s.submittedAt)}</td>
                            <td style={{ ...TD, textAlign:'center' }}>
                              <button onClick={e=>{e.stopPropagation();setResultModal({student:s,exam:selExam});}} style={{ ...btnS, padding:'5px 12px', fontSize:12 }}>상세보기</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* 많이 틀린 문제 TOP5 */}
                {(() => {
                  const qW = {};
                  submitted.forEach(s => (s.results||[]).forEach(r => { if(!r.correct) qW[r.no]=(qW[r.no]||0)+1; }));
                  const sorted = Object.entries(qW).sort((a,b)=>b[1]-a[1]).slice(0,5);
                  if (!sorted.length) return null;
                  return (
                    <div style={{ padding:'14px 20px', borderTop:'1px solid #F1F5F9', background:'#FAFBFC' }}>
                      <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>⚠️ 많이 틀린 문제 TOP {sorted.length}</div>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        {sorted.map(([no,cnt],rank) => {
                          const q        = selExam.questions?.find(q=>String(q.no)===String(no));
                          const typeName = q?.typeName||q?.type||'';
                          const errRate  = Math.round(cnt/submitted.length*100);
                          return (
                            <div key={no} style={{ background:'#fff', border:'1px solid #E2E5EA', borderRadius:12, padding:'10px 14px', minWidth:110 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                                <span style={{ fontSize:11, color:'#8B95A7' }}>#{rank+1}</span>
                                <span style={{ width:26, height:26, borderRadius:'50%', background:'#DC2626', color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800 }}>{no}</span>
                                {typeName && <TypeBadge typeName={typeName}/>}
                              </div>
                              <div style={{ fontSize:13, fontWeight:700, color:'#DC2626' }}>{cnt}명 오답</div>
                              <div style={{ fontSize:10, color:'#8B95A7', marginTop:1 }}>오답률 {errRate}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ══ 탭 4: 오답관리 ══ */}
        {tab==='wrong' && (
          <WrongAnswerTab wrongAnswers={wrongAnswers}/>
        )}

        {/* ══ 탭 5: 질문함 ══ */}
        {tab==='questions' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {Object.keys(questions).length===0 ? (
              <div style={{ ...card, padding:'60px 24px', textAlign:'center' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🙋</div>
                <div style={{ fontSize:14, color:'#8B95A7' }}>아직 받은 질문이 없습니다</div>
              </div>
            ) : Object.entries(questions).map(([examId,qList]) => {
              const exam   = exams.find(e=>e.id===examId);
              const unread = qList.filter(q=>!q.read).length;
              return (
                <div key={examId} style={{ ...card, overflow:'hidden' }}>
                  <div style={{ padding:'11px 20px', background:'#F8F9FB', borderBottom:'1px solid #F1F5F9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:14, fontWeight:700 }}>{exam?.title||examId}</span>
                    {unread>0 && <span style={{ background:'#EF4444', color:'#fff', borderRadius:10, padding:'2px 10px', fontSize:11, fontWeight:700 }}>NEW {unread}</span>}
                  </div>
                  {qList.map(q => (
                    <div key={q.id} style={{ padding:'13px 20px', borderBottom:'1px solid #F8F9FB', display:'flex', gap:12, alignItems:'flex-start', background:q.read?'#fff':'#FFFBEB' }}>
                      <div style={{ width:38, height:38, borderRadius:'50%', background:'#2563EB', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, flexShrink:0 }}>{q.questionNo}번</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                          <span style={{ fontWeight:700, fontSize:14 }}>{q.studentName}</span>
                          {!q.read && <span style={{ background:'#EF4444', color:'#fff', borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:700 }}>NEW</span>}
                          <span style={{ fontSize:11, color:'#8B95A7', marginLeft:'auto' }}>{fmtDate(q.sentAt)}</span>
                        </div>
                        <div style={{ fontSize:13, color:'#5A6375' }}>{q.message||'(추가 메시지 없음)'}</div>
                        {exam?.questions?.find(qx=>qx.no===q.questionNo) && (
                          <div style={{ fontSize:11, color:'#8B95A7', marginTop:3 }}>유형: {exam.questions.find(qx=>qx.no===q.questionNo).typeName||exam.questions.find(qx=>qx.no===q.questionNo).type}</div>
                        )}
                      </div>
                      {!q.read && <button onClick={()=>markRead(examId,q.id)} style={{ ...btnS, padding:'6px 12px', fontSize:11, flexShrink:0 }}>확인</button>}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 모달들 */}
      {modal       && <ExamModal   exam={modal==='create'?null:modal} onClose={()=>setModal(null)}      onSave={loadAll}/>}
      {resultModal && <ResultModal student={resultModal.student}      exam={resultModal.exam}            onClose={()=>setResultModal(null)}/>}
{showJsonImport && (
  <JsonImportModal
    onClose={() => setShowJsonImport(false)}
    onCreated={loadAll}
  />
)}
{showPromptMaker && (
  <PromptMakerModal
    onClose={() => setShowPromptMaker(false)}
  />
)}
      {qrExam && <QrModal title={qrExam.title} url={buildShareUrl(qrExam.id)} onClose={()=>setQrExam(null)} />}
      {deleteTarget && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
          <div style={{ ...card, padding:28, maxWidth:340, width:'100%', textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🗑️</div>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>시험을 삭제할까요?</h3>
            <p style={{ fontSize:13, color:'#5A6375', marginBottom:22 }}>삭제된 시험은 복구할 수 없습니다.</p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setDeleteTarget(null)} style={{ ...btnS, flex:1, padding:'12px 0' }}>취소</button>
              <button onClick={()=>handleDelete(deleteTarget)} style={{ flex:1, padding:'12px 0', border:'none', borderRadius:10, background:'#EF4444', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'Noto Sans KR,sans-serif' }}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
