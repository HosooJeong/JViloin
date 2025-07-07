const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { User, Schedule, Post, Media, Reservation } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// 모든 관리자 라우트에 인증 및 관리자 권한 확인 적용
router.use(authenticateToken, requireAdmin);

// 관리자 대시보드 데이터
router.get('/dashboard', async (req, res) => {
    try {
        // 통계 데이터 수집
        const stats = await Promise.all([
            User.count({ where: { role: 'student', isActive: true } }),
            User.count({ where: { role: 'teacher', isActive: true } }),
            Schedule.count({ where: { isActive: true } }),
            Post.count({ where: { isPublished: true } }),
            Media.count({ where: { isPublished: true } }),
            Reservation.count({ where: { status: 'confirmed' } }),
            Reservation.count({
                where: {
                    status: 'pending',
                    createdAt: {
                        [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 지난 7일
                    }
                }
            })
        ]);

        // 최근 가입한 사용자들
        const recentUsers = await User.findAll({
            attributes: ['id', 'username', 'name', 'role', 'createdAt'],
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        // 최근 예약들
        const recentReservations = await Reservation.findAll({
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name', 'username']
                },
                {
                    model: Schedule,
                    as: 'schedule',
                    attributes: ['courseName', 'timeSlot', 'dayOfWeek']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        res.json({
            stats: {
                totalStudents: stats[0],
                totalTeachers: stats[1],
                totalSchedules: stats[2],
                totalPosts: stats[3],
                totalMedia: stats[4],
                confirmedReservations: stats[5],
                pendingReservations: stats[6]
            },
            recentUsers,
            recentReservations
        });

    } catch (error) {
        console.error('관리자 대시보드 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 사용자 관리
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 10, role, status, search } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (role) whereClause.role = role;
        if (status === 'active') whereClause.isActive = true;
        if (status === 'inactive') whereClause.isActive = false;
        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { username: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
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
                totalUsers: count
            }
        });

    } catch (error) {
        console.error('사용자 관리 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 스케줄 관리
router.get('/schedules', async (req, res) => {
    try {
        const schedules = await Schedule.findAll({
            include: [{
                model: User,
                as: 'teacher',
                attributes: ['name', 'username']
            }],
            order: [
                ['dayOfWeek', 'ASC'],
                ['timeSlot', 'ASC']
            ]
        });

        res.json({ schedules });

    } catch (error) {
        console.error('스케줄 관리 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 게시글 관리
router.get('/posts', async (req, res) => {
    try {
        const { page = 1, limit = 10, category, status } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (category) whereClause.category = category;
        if (status === 'published') whereClause.isPublished = true;
        if (status === 'unpublished') whereClause.isPublished = false;

        const { count, rows: posts } = await Post.findAndCountAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'author',
                attributes: ['name', 'username']
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            posts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalPosts: count
            }
        });

    } catch (error) {
        console.error('게시글 관리 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 미디어 관리
router.get('/media', async (req, res) => {
    try {
        const { page = 1, limit = 10, type, status } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (type) whereClause.fileType = type;
        if (status === 'published') whereClause.isPublished = true;
        if (status === 'unpublished') whereClause.isPublished = false;

        const { count, rows: media } = await Media.findAndCountAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'uploader',
                attributes: ['name', 'username']
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            media,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalMedia: count
            }
        });

    } catch (error) {
        console.error('미디어 관리 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 예약 관리
router.get('/reservations', async (req, res) => {
    try {
        const { page = 1, limit = 10, status, date } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (status) whereClause.status = status;
        if (date) whereClause.reservationDate = date;

        const { count, rows: reservations } = await Reservation.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name', 'username', 'phone']
                },
                {
                    model: Schedule,
                    as: 'schedule',
                    attributes: ['courseName', 'timeSlot', 'dayOfWeek', 'level'],
                    include: [{
                        model: User,
                        as: 'teacher',
                        attributes: ['name']
                    }]
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['reservationDate', 'DESC'], ['createdAt', 'DESC']]
        });

        res.json({
            reservations,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalReservations: count
            }
        });

    } catch (error) {
        console.error('예약 관리 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 예약 상태 변경
router.patch('/reservations/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const reservationId = req.params.id;

        if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({ message: '유효하지 않은 상태입니다.' });
        }

        const reservation = await Reservation.findByPk(reservationId);
        if (!reservation) {
            return res.status(404).json({ message: '예약을 찾을 수 없습니다.' });
        }

        await reservation.update({
            status,
            ...(status === 'cancelled' && { cancelledAt: new Date() })
        });

        res.json({
            message: '예약 상태가 변경되었습니다.',
            reservation
        });

    } catch (error) {
        console.error('예약 상태 변경 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 게시글 발행/비발행 상태 변경
router.patch('/posts/:id/publish', async (req, res) => {
    try {
        const { isPublished } = req.body;
        const postId = req.params.id;

        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        await post.update({ isPublished });

        res.json({
            message: `게시글이 ${isPublished ? '발행' : '비발행'}되었습니다.`,
            post
        });

    } catch (error) {
        console.error('게시글 상태 변경 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 미디어 발행/비발행 상태 변경
router.patch('/media/:id/publish', async (req, res) => {
    try {
        const { isPublished } = req.body;
        const mediaId = req.params.id;

        const media = await Media.findByPk(mediaId);
        if (!media) {
            return res.status(404).json({ message: '미디어를 찾을 수 없습니다.' });
        }

        await media.update({ isPublished });

        res.json({
            message: `미디어가 ${isPublished ? '발행' : '비발행'}되었습니다.`,
            media
        });

    } catch (error) {
        console.error('미디어 상태 변경 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;