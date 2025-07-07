const express = require('express');
const { body, validationResult } = require('express-validator');
const { Reservation, User, Schedule } = require('../models');
const { authenticateToken, requireAdmin, requireOwnerOrAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// 사용자의 예약 목록 조회
router.get('/my', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = { userId: req.user.id };
        if (status) whereClause.status = status;

        const { count, rows: reservations } = await Reservation.findAndCountAll({
            where: whereClause,
            include: [{
                model: Schedule,
                as: 'schedule',
                attributes: ['courseName', 'timeSlot', 'dayOfWeek', 'level'],
                include: [{
                    model: User,
                    as: 'teacher',
                    attributes: ['name', 'username']
                }]
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['reservationDate', 'DESC'], ['createdAt', 'DESC']]
        });

        res.json({
            reservations,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalReservations: count,
                hasNext: offset + reservations.length < count,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('내 예약 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 예약 생성
router.post('/', [
    authenticateToken,
    body('scheduleId').isInt().withMessage('유효한 스케줄을 선택해주세요.'),
    body('reservationDate').isISO8601().withMessage('유효한 날짜를 입력해주세요.'),
    body('notes').optional().isLength({ max: 500 }).withMessage('메모는 500자 이하여야 합니다.')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: '입력 데이터가 유효하지 않습니다.',
                errors: errors.array()
            });
        }

        const { scheduleId, reservationDate, notes } = req.body;
        const userId = req.user.id;

        // 스케줄 존재 여부 및 활성 상태 확인
        const schedule = await Schedule.findOne({
            where: { id: scheduleId, isActive: true },
            include: [{
                model: User,
                as: 'teacher',
                attributes: ['name']
            }]
        });

        if (!schedule) {
            return res.status(404).json({ message: '유효한 스케줄을 찾을 수 없습니다.' });
        }

        // 예약 날짜가 과거인지 확인
        const today = new Date();
        const reservationDateObj = new Date(reservationDate);
        if (reservationDateObj < today.setHours(0, 0, 0, 0)) {
            return res.status(400).json({ message: '과거 날짜로는 예약할 수 없습니다.' });
        }

        // 중복 예약 확인
        const existingReservation = await Reservation.findOne({
            where: {
                userId,
                scheduleId,
                reservationDate,
                status: { [Op.in]: ['pending', 'confirmed'] }
            }
        });

        if (existingReservation) {
            return res.status(409).json({ message: '이미 해당 날짜에 예약이 있습니다.' });
        }

        // 해당 날짜의 예약 수 확인
        const reservationCount = await Reservation.count({
            where: {
                scheduleId,
                reservationDate,
                status: { [Op.in]: ['pending', 'confirmed'] }
            }
        });

        if (reservationCount >= schedule.maxStudents) {
            return res.status(400).json({ message: '해당 시간의 예약이 마감되었습니다.' });
        }

        // 예약 생성
        const reservation = await Reservation.create({
            userId,
            scheduleId,
            reservationDate,
            notes: notes || '',
            status: 'pending'
        });

        // 스케줄의 현재 학생 수 업데이트
        await schedule.increment('currentStudents');

        const reservationWithDetails = await Reservation.findByPk(reservation.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name', 'username']
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
            ]
        });

        res.status(201).json({
            message: '예약이 신청되었습니다.',
            reservation: reservationWithDetails
        });

    } catch (error) {
        console.error('예약 생성 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 특정 예약 상세 조회
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const reservation = await Reservation.findByPk(req.params.id, {
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
                        attributes: ['name', 'username']
                    }]
                }
            ]
        });

        if (!reservation) {
            return res.status(404).json({ message: '예약을 찾을 수 없습니다.' });
        }

        // 권한 확인 (예약자 본인 또는 관리자)
        if (reservation.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: '예약을 조회할 권한이 없습니다.' });
        }

        res.json({ reservation });

    } catch (error) {
        console.error('예약 상세 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 예약 수정 (예약자 본인 또는 관리자)
router.put('/:id', [
    authenticateToken,
    body('reservationDate').optional().isISO8601().withMessage('유효한 날짜를 입력해주세요.'),
    body('notes').optional().isLength({ max: 500 }).withMessage('메모는 500자 이하여야 합니다.')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: '입력 데이터가 유효하지 않습니다.',
                errors: errors.array()
            });
        }

        const reservationId = req.params.id;
        const { reservationDate, notes } = req.body;

        const reservation = await Reservation.findByPk(reservationId);
        if (!reservation) {
            return res.status(404).json({ message: '예약을 찾을 수 없습니다.' });
        }

        // 권한 확인 (예약자 본인 또는 관리자)
        if (reservation.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: '예약을 수정할 권한이 없습니다.' });
        }

        // 확정된 예약은 수정 불가 (관리자 제외)
        if (reservation.status === 'confirmed' && req.user.role !== 'admin') {
            return res.status(400).json({ message: '확정된 예약은 수정할 수 없습니다.' });
        }

        const updateData = {};
        if (reservationDate) {
            // 예약 날짜가 과거인지 확인
            const today = new Date();
            const reservationDateObj = new Date(reservationDate);
            if (reservationDateObj < today.setHours(0, 0, 0, 0)) {
                return res.status(400).json({ message: '과거 날짜로는 예약할 수 없습니다.' });
            }
            updateData.reservationDate = reservationDate;
        }
        if (notes !== undefined) updateData.notes = notes;

        await reservation.update(updateData);

        const updatedReservation = await Reservation.findByPk(reservationId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name', 'username']
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
            ]
        });

        res.json({
            message: '예약이 수정되었습니다.',
            reservation: updatedReservation
        });

    } catch (error) {
        console.error('예약 수정 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 예약 취소 (예약자 본인 또는 관리자)
router.patch('/:id/cancel', [
    authenticateToken,
    body('cancelReason').optional().isLength({ max: 500 }).withMessage('취소 사유는 500자 이하여야 합니다.')
], async (req, res) => {
    try {
        const reservationId = req.params.id;
        const { cancelReason } = req.body;

        const reservation = await Reservation.findByPk(reservationId, {
            include: [{
                model: Schedule,
                as: 'schedule'
            }]
        });

        if (!reservation) {
            return res.status(404).json({ message: '예약을 찾을 수 없습니다.' });
        }

        // 권한 확인 (예약자 본인 또는 관리자)
        if (reservation.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: '예약을 취소할 권한이 없습니다.' });
        }

        // 이미 취소된 예약인지 확인
        if (reservation.status === 'cancelled') {
            return res.status(400).json({ message: '이미 취소된 예약입니다.' });
        }

        // 예약 취소
        await reservation.update({
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelReason: cancelReason || ''
        });

        // 스케줄의 현재 학생 수 감소
        if (reservation.schedule && reservation.schedule.currentStudents > 0) {
            await reservation.schedule.decrement('currentStudents');
        }

        res.json({
            message: '예약이 취소되었습니다.',
            reservation
        });

    } catch (error) {
        console.error('예약 취소 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 예약 상태 변경 (관리자만)
router.patch('/:id/status', [
    authenticateToken,
    requireAdmin,
    body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed'])
        .withMessage('유효한 상태를 선택해주세요.')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: '입력 데이터가 유효하지 않습니다.',
                errors: errors.array()
            });
        }

        const reservationId = req.params.id;
        const { status } = req.body;

        const reservation = await Reservation.findByPk(reservationId);
        if (!reservation) {
            return res.status(404).json({ message: '예약을 찾을 수 없습니다.' });
        }

        const updateData = { status };
        if (status === 'cancelled') {
            updateData.cancelledAt = new Date();
        }

        await reservation.update(updateData);

        res.json({
            message: '예약 상태가 변경되었습니다.',
            reservation
        });

    } catch (error) {
        console.error('예약 상태 변경 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 스케줄별 예약 현황 조회
router.get('/schedule/:scheduleId', async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { date } = req.query;

        const whereClause = {
            scheduleId,
            status: { [Op.in]: ['pending', 'confirmed'] }
        };

        if (date) {
            whereClause.reservationDate = date;
        }

        const reservations = await Reservation.findAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'user',
                attributes: ['name', 'username']
            }],
            order: [['reservationDate', 'ASC']]
        });

        res.json({ reservations });

    } catch (error) {
        console.error('스케줄별 예약 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;