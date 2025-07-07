const sequelize = require('../config/database');
const User = require('./User');
const Schedule = require('./Schedule');
const Post = require('./Post');
const Media = require('./Media');
const Reservation = require('./Reservation');

// 관계 설정
// 사용자와 스케줄 (강사)
User.hasMany(Schedule, {
    foreignKey: 'teacherId',
    as: 'teachingSchedules'
});
Schedule.belongsTo(User, {
    foreignKey: 'teacherId',
    as: 'teacher'
});

// 사용자와 게시글
User.hasMany(Post, {
    foreignKey: 'authorId',
    as: 'posts'
});
Post.belongsTo(User, {
    foreignKey: 'authorId',
    as: 'author'
});

// 사용자와 미디어
User.hasMany(Media, {
    foreignKey: 'uploadedBy',
    as: 'uploadedMedia'
});
Media.belongsTo(User, {
    foreignKey: 'uploadedBy',
    as: 'uploader'
});

// 사용자와 예약
User.hasMany(Reservation, {
    foreignKey: 'userId',
    as: 'reservations'
});
Reservation.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// 스케줄과 예약
Schedule.hasMany(Reservation, {
    foreignKey: 'scheduleId',
    as: 'reservations'
});
Reservation.belongsTo(Schedule, {
    foreignKey: 'scheduleId',
    as: 'schedule'
});

// 데이터베이스 동기화 함수
const syncDatabase = async () => {
    try {
        await sequelize.sync({ force: false }); // force: true면 기존 테이블 삭제 후 재생성
        console.log('데이터베이스 테이블이 성공적으로 동기화되었습니다.');
        
        // 관리자 계정 생성
        await createAdminUser();
    } catch (error) {
        console.error('데이터베이스 동기화 실패:', error);
    }
};

// 관리자 계정 생성 함수
const createAdminUser = async () => {
    try {
        const adminExists = await User.findOne({ where: { username: 'admin' } });
        
        if (!adminExists) {
            await User.create({
                username: process.env.ADMIN_USERNAME || 'admin',
                email: 'admin@j-violin.com',
                password: process.env.ADMIN_PASSWORD || 'adimin',
                name: '관리자',
                role: 'admin'
            });
            console.log('관리자 계정이 생성되었습니다.');
        } else {
            console.log('관리자 계정이 이미 존재합니다.');
        }
    } catch (error) {
        console.error('관리자 계정 생성 실패:', error);
    }
};

module.exports = {
    sequelize,
    User,
    Schedule,
    Post,
    Media,
    Reservation,
    syncDatabase
};