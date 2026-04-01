# 📝 시험 답안 웹앱 — 실행 가이드

## 폴더 구조

```
exam-app/
├── pages/
│   ├── _app.js              ← 전체 앱 설정 (CSS 불러오기)
│   ├── index.js             ← 시작 페이지 (자동 리다이렉트)
│   ├── exam/
│   │   └── [examId].jsx     ← ★ 학생용 답안 입력 페이지
│   └── api/
│       ├── exam/
│       │   └── [examId].js  ← 시험 정보 API (정답 숨김)
│       └── answers/
│           ├── autosave.js  ← 자동 저장 API
│           ├── submit.js    ← 제출 + 자동 채점 API
│           └── question.js  ← 선생님께 질문 전송 API
├── data/
│   ├── exams.json           ← ★ 시험 데이터 (여기서 문항 수정)
│   ├── answers.json         ← 학생 답안 저장소 (자동 생성)
│   └── questions.json       ← 질문 저장소 (자동 생성)
├── styles/
│   └── globals.css          ← 전체 스타일
├── package.json
└── next.config.js
```

---

## ✅ 처음 실행하는 법 (초보자용)

### 1단계 — Node.js 설치
https://nodejs.org 에서 LTS 버전 다운로드 후 설치

### 2단계 — 폴더 열기
터미널(명령 프롬프트)을 열고:
```bash
cd exam-app
```

### 3단계 — 패키지 설치 (최초 1회만)
```bash
npm install
```

### 4단계 — 개발 서버 실행
```bash
npm run dev
```

### 5단계 — 브라우저에서 확인
- 학생용 페이지: http://localhost:3000/exam/exam001
- 다른 시험: http://localhost:3000/exam/exam002

---

## 📋 시험 추가/수정 방법

`data/exams.json` 파일을 직접 수정합니다.

```json
{
  "exam001": {
    "id": "exam001",
    "title": "1학기 중간고사",
    "subject": "수학",
    "teacher": "김선생님",
    "grade": "중학교 2학년",
    "totalQuestions": 3,
    "questions": [
      { "no": 1, "type": "계산", "answer": "24" },
      { "no": 2, "type": "개념", "answer": "이등변삼각형" },
      { "no": 3, "type": "서술", "answer": "평행사변형" }
    ]
  }
}
```

**유형(type)** 은 자유롭게 지정 가능합니다: 계산, 개념, 서술, 어휘, 문법, 독해 등

---

## 🌐 학생에게 링크 나눠주는 법

- 같은 Wi-Fi 환경이라면 선생님 PC의 IP 주소로 접속 가능합니다.
- 예: `http://192.168.0.10:3000/exam/exam001`
- IP 확인: Windows → `ipconfig`, Mac → `ifconfig`

---

## 📁 현재 구현된 기능 (1단계)

- [x] 학생 이름 입력 후 시험 시작
- [x] 문항별 유형 표시 (색상 배지)
- [x] 답안 자동 저장 (2초 딜레이)
- [x] 진행 현황 프로그레스 바
- [x] 제출 전 확인 모달 (미입력 문항 경고)
- [x] 자동 채점 후 결과 표시
- [x] 유형별 오답 분석
- [x] 선생님께 질문 전송

## 📌 다음 단계 예정

- [ ] 선생님 관리 페이지 (시험 생성, 실시간 현황)
- [ ] 실시간 업데이트 (WebSocket or Polling)
- [ ] 재채점 기능 (유형 수정 후)
- [ ] 데이터베이스 연동 (현재는 JSON 파일)
