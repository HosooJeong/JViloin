const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// 회원가입
router.post('/register', [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('사용자명은 3-50자 사이여야 합니다.')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('사용자명은 영문, 숫자, 언더스코어만 사용 가능합니다.'),
    body('email')
        .isEmail()
        .withMessage('유효한 이메일 주소를 입력해주세요.')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('비밀번호는 최소 6자 이상이어야 합니다.'),
    body('name')
        .isLength({ min: 2, max: 50 })
        .withMessage('이름은 2-50자 사이여야 합니다.'),
    body('phone')
        .optional()
        .matches(/^[0-9-+\s()]+$/)
        .withMessage('유효한 전화번호를 입력해주세요.')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: '입력 데이터가 유효하지 않습니다.',
                errors: errors.array()
            });
        }

        const { username, email, password, name, phone } = req.body;

        // 중복 확인
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ username }, { email }]
            }
        });

        if (existingUser) {
            return res.status(409).json({
                message: existingUser.username === username 
                    ? '이미 사용 중인 사용자명입니다.' 
                    : '이미 사용 중인 이메일입니다.'
            });
        }

        // 사용자 생성
        const user = await User.create({
            username,
            email,
            password,
            name,
            phone,
            role: 'student'
        });

        // JWT 토큰 생성
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: '회원가입이 완료되었습니다.',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 로그인
router.post('/login', [
    body('username').notEmpty().withMessage('사용자명을 입력해주세요.'),
    body('password').notEmpty().withMessage('비밀번호를 입력해주세요.')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: '입력 데이터가 유효하지 않습니다.',
                errors: errors.array()
            });
        }

        const { username, password } = req.body;

        // 사용자 찾기 (username 또는 email로)
        const user = await User.findOne({
            where: {
                [Op.or]: [{ username }, { email: username }]
            }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ message: '존재하지 않는 사용자이거나 비활성화된 계정입니다.' });
        }

        // 비밀번호 확인
        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
        }

        // JWT 토큰 생성
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            message: '로그인 성공',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 현재 사용자 정보 조회
router.get('/me', authenticateToken, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user.id,
                username: req.user.username,
                email: req.user.email,
                name: req.user.name,
                phone: req.user.phone,
                role: req.user.role,
                createdAt: req.user.createdAt
            }
        });
    } catch (error) {
        console.error('사용자 정보 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 토큰 검증
router.post('/verify', authenticateToken, (req, res) => {
    res.json({ 
        valid: true, 
        user: {
            id: req.user.id,
            username: req.user.username,
            name: req.user.name,
            role: req.user.role
        }
    });
});

// 로그아웃 (클라이언트에서 토큰 삭제)
router.post('/logout', (req, res) => {
    res.json({ message: '로그아웃되었습니다.' });
});

module.exports = router;