# 🎻 J-Violin Academy Management System

바이올린 학원 관리를 위한 풀스택 웹 애플리케이션입니다.

## ✨ 주요 기능

### 🎯 학생/강사용 기능
- **사용자 인증**: 회원가입, 로그인, 역할 기반 접근 제어
- **수업 예약**: 실시간 시간표 확인 및 수업 예약
- **게시판**: 공지사항, 소식, 이벤트 정보 확인
- **갤러리**: 학원 활동 사진 및 동영상 갤러리

### 🔧 관리자용 기능
- **대시보드**: 학원 운영 현황 한눈에 보기
- **사용자 관리**: 학생/강사 계정 생성, 편집, 관리
- **시간표 관리**: 수업 스케줄 등록 및 관리
- **게시판 관리**: 공지사항 및 게시글 작성/관리
- **갤러리 관리**: 미디어 파일 업로드 및 관리
- **예약 관리**: 수업 예약 승인/거절/완료 처리

## 🛠 기술 스택

### Backend
- **Node.js** + **Express.js** - 웹 서버
- **MySQL** + **Sequelize ORM** - 데이터베이스
- **JWT** + **bcrypt** - 인증 및 보안
- **Multer** - 파일 업로드

### Frontend
- **Vanilla HTML/CSS/JavaScript** - 프론트엔드 (프레임워크 없음)
- **반응형 디자인** - 모바일/데스크톱 지원

### Database
- **사용자 관리**: 학생, 강사, 관리자 역할 구분
- **스케줄링**: 요일별 시간표 관리
- **예약 시스템**: 실시간 예약 및 상태 관리
- **미디어 관리**: 이미지/동영상 파일 업로드

## 🚀 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd J-Violin
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 설정
`.env` 파일을 생성하고 다음 내용을 설정:
```env
# 데이터베이스 설정
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=j_violin_db
DB_PORT=3306

# JWT 설정
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# 서버 설정
PORT=3000
NODE_ENV=development

# 관리자 계정 설정
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
```

### 4. 데이터베이스 설정
MySQL에서 데이터베이스 생성:
```sql
CREATE DATABASE j_violin_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. 서버 실행
```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 모드
npm start
```

서버가 시작되면 http://localhost:3000 에서 접속 가능합니다.

## 📁 프로젝트 구조

```
J-Violin/
├── components/          # 재사용 가능한 프론트엔드 컴포넌트
├── config/             # 데이터베이스 설정
├── css/                # 스타일시트
├── js/                 # 프론트엔드 JavaScript
├── middleware/         # Express 미들웨어
├── models/             # Sequelize 데이터베이스 모델
├── pages/              # HTML 페이지
│   ├── admin/          # 관리자 페이지
│   └── ...             # 일반 페이지
├── routes/             # API 라우터
├── uploads/            # 업로드된 파일 저장소
├── .env                # 환경변수 (gitignore에 포함)
├── .gitignore          # Git 제외 파일 목록
├── package.json        # 프로젝트 의존성
└── server.js           # 메인 서버 파일
```

## 🔑 기본 관리자 계정

- **사용자명**: admin
- **비밀번호**: .env 파일의 ADMIN_PASSWORD 값
- **관리자 페이지**: http://localhost:3000/pages/admin/login.html

## 🌐 배포 가이드

### 프론트엔드 (정적 호스팅)
- Netlify, Vercel, GitHub Pages 등 활용
- 빌드된 정적 파일만 배포

### 백엔드 (서버/NAS)
- Docker 컨테이너화 권장
- 포트포워딩 설정 (기본 3000번 포트)
- HTTPS 설정 (Let's Encrypt)
- 환경변수 분리 (개발/운영)

## 📝 API 문서

### 인증 API
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보
- `POST /api/auth/verify` - 토큰 검증

### 관리자 API
- `GET /api/admin/dashboard` - 대시보드 데이터
- `GET /api/admin/users` - 사용자 목록
- `POST /api/admin/users` - 사용자 생성
- `PUT /api/admin/users/:id` - 사용자 수정
- `DELETE /api/admin/users/:id` - 사용자 삭제

### 기타 API
- `/api/schedules` - 스케줄 관리
- `/api/posts` - 게시판 관리
- `/api/media` - 미디어 관리
- `/api/reservations` - 예약 관리

## 🤝 기여하기

1. Fork 프로젝트
2. Feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원

문제가 발생하거나 질문이 있으시면 Issues를 통해 문의해 주세요.

---

**Made with ❤️ for J-Violin Academy**