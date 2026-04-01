export default function StartPage() {
  const btn = {
    display: 'block',
    width: '100%',
    padding: '18px 20px',
    borderRadius: 16,
    border: '1.5px solid #E2E5EA',
    background: '#fff',
    color: '#1A1F2E',
    fontSize: 18,
    fontWeight: 800,
    textDecoration: 'none',
    textAlign: 'center',
    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
  };

  return (
    <div style={{ minHeight:'100vh', background:'#F4F5F7', fontFamily:'Noto Sans KR, sans-serif', padding:'40px 20px' }}>
      <div style={{ maxWidth: 520, margin:'0 auto' }}>
        <div style={{ background:'#fff', borderRadius:24, padding:'28px 24px', boxShadow:'0 10px 30px rgba(0,0,0,0.08)' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 10 }}>📚 공부방 시스템 시작</h1>
          <p style={{ fontSize: 14, color:'#5A6375', marginBottom: 24 }}>
            자주 쓰는 화면으로 바로 들어가세요.
          </p>

          <div style={{ display:'grid', gap:14 }}>
            <a href="/teacher" style={btn}>📋 시험 목록</a>
            <a href="/teacher?tab=status" style={btn}>👨‍🎓 학생 현황</a>
            <a href="/teacher?tab=results" style={btn}>✅ 채점 결과</a>
            <a href="/teacher?tab=wrong" style={btn}>📊 오답관리</a>
          </div>
        </div>
      </div>
    </div>
  );
}