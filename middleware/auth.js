const jwt = require('jsonwebtoken');
const { User } = require('../models');

// JWT 토큰 검증 미들웨어
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ message: '액세스 토큰이 필요합니다.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ message: '유효하지 않은 사용자입니다.' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: '토큰이 만료되었습니다.' });
        }
        return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
    }
};

// 관리자 권한 확인 미들웨어
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
    }
    next();
};

// 강사 이상 권한 확인 미들웨어
const requireTeacher = (req, res, next) => {
    if (!['teacher', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: '강사 이상의 권한이 필요합니다.' });
    }
    next();
};

// 본인 또는 관리자 권한 확인 미들웨어
const requireOwnerOrAdmin = (req, res, next) => {
    const userId = parseInt(req.params.userId || req.params.id);
    if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: '본인 또는 관리자만 접근 가능합니다.' });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireTeacher,
    requireOwnerOrAdmin
};