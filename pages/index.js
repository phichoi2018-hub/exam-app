import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/exam/exam001');
  }, [router]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', fontFamily: 'Noto Sans KR, sans-serif',
      color: '#5a6375', fontSize: '15px'
    }}>
      시험 페이지로 이동 중...
    </div>
  );
}
