const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (프론트엔드)
app.use(express.static(path.join(__dirname)));

// 업로드된 파일 서빙
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 데이터베이스 연결 및 모델
const db = require('./config/database');
const { syncDatabase } = require('./models');

// 라우터 설정
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/media', require('./routes/media'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/admin', require('./routes/admin'));

// 메인 페이지 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 에러 핸들링
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// 서버 시작
db.authenticate()
    .then(() => {
        console.log('데이터베이스 연결 성공');
        return syncDatabase();
    })
    .then(() => {
        app.listen(PORT, () => {
            console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
            console.log(`관리자 페이지: http://localhost:${PORT}/pages/admin/login.html`);
        });
    })
    .catch(err => {
        console.error('서버 시작 실패:', err);
    });