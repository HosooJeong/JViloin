const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { authenticateToken, requireAdmin, requireOwnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// 모든 사용자 목록 조회 (관리자만)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, role, search } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (role) {
            whereClause.role = role;
        }
        if (search) {
            whereClause[Symbol.for('or')] = [
                { name: { [Symbol.for('like')]: `%${search}%` } },
                { username: { [Symbol.for('like')]: `%${search}%` } },
                { email: { [Symbol.for('like')]: `%${search}%` } }
            ];
        }

        const { count, rows: users } = await User.findAndCountAll({
            where: whereClause,
            attributes: { exclude: ['password'] },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalUsers: count,
                hasNext: offset + users.length < count,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('사용자 목록 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 특정 사용자 정보 조회
router.get('/:id', authenticateToken, requireOwnerOrAdmin, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        res.json({ user });

    } catch (error) {
        console.error('사용자 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 사용자 정보 수정
router.put('/:id', [
    authenticateToken,
    requireOwnerOrAdmin,
    body('name').optional().isLength({ min: 2, max: 50 }).withMessage('이름은 2-50자 사이여야 합니다.'),
    body('email').optional().isEmail().withMessage('유효한 이메일 주소를 입력해주세요.'),
    body('phone').optional().matches(/^[0-9-+\s()]+$/).withMessage('유효한 전화번호를 입력해주세요.')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: '입력 데이터가 유효하지 않습니다.',
                errors: errors.array()
            });
        }

        const { name, email, phone } = req.body;
        const userId = req.params.id;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 이메일 중복 확인
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
            }
        }

        // 정보 업데이트
        await user.update({
            ...(name && { name }),
            ...(email && { email }),
            ...(phone !== undefined && { phone })
        });

        res.json({
            message: '사용자 정보가 업데이트되었습니다.',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role
            }
        });

    } catch (error) {
        console.error('사용자 정보 수정 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 사용자 비활성화/활성화 (관리자만)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { isActive } = req.body;
        const userId = req.params.id;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ message: '관리자 계정은 비활성화할 수 없습니다.' });
        }

        await user.update({ isActive });

        res.json({
            message: `사용자가 ${isActive ? '활성화' : '비활성화'}되었습니다.`,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error('사용자 상태 변경 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 사용자 역할 변경 (관리자만)
router.patch('/:id/role', [
    authenticateToken,
    requireAdmin,
    body('role').isIn(['student', 'teacher', 'admin']).withMessage('유효한 역할을 선택해주세요.')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: '입력 데이터가 유효하지 않습니다.',
                errors: errors.array()
            });
        }

        const { role } = req.body;
        const userId = req.params.id;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        await user.update({ role });

        res.json({
            message: '사용자 역할이 변경되었습니다.',
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('사용자 역할 변경 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;