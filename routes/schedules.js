const express = require('express');
const { body, validationResult } = require('express-validator');
const { Schedule, User } = require('../models');
const { authenticateToken, requireAdmin, requireTeacher } = require('../middleware/auth');

const router = express.Router();

// 모든 스케줄 조회 (공개)
router.get('/', async (req, res) => {
    try {
        const { dayOfWeek, level } = req.query;
        
        const whereClause = { isActive: true };
        if (dayOfWeek) whereClause.dayOfWeek = dayOfWeek;
        if (level) whereClause.level = level;

        const schedules = await Schedule.findAll({
            where: whereClause,
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
        console.error('스케줄 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 특정 스케줄 상세 조회
router.get('/:id', async (req, res) => {
    try {
        const schedule = await Schedule.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'teacher',
                attributes: ['name', 'username', 'email']
            }]
        });

        if (!schedule) {
            return res.status(404).json({ message: '스케줄을 찾을 수 없습니다.' });
        }

        res.json({ schedule });

    } catch (error) {
        console.error('스케줄 상세 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 스케줄 생성 (관리자만)
router.post('/', [
    authenticateToken,
    requireAdmin,
    body('dayOfWeek').isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
        .withMessage('유효한 요일을 선택해주세요.'),
    body('timeSlot').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('시간 형식이 올바르지 않습니다. (예: 09:00-10:00)'),
    body('courseName').isLength({ min: 2, max: 100 })
        .withMessage('수업명은 2-100자 사이여야 합니다.'),
    body('teacherId').isInt()
        .withMessage('유효한 강사를 선택해주세요.'),
    body('level').isIn(['beginner', 'intermediate', 'advanced'])
        .withMessage('유효한 수준을 선택해주세요.'),
    body('maxStudents').isInt({ min: 1, max: 20 })
        .withMessage('최대 학생 수는 1-20명 사이여야 합니다.')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: '입력 데이터가 유효하지 않습니다.',
                errors: errors.array()
            });
        }

        const { dayOfWeek, timeSlot, courseName, teacherId, level, maxStudents, description } = req.body;

        // 강사 존재 여부 확인
        const teacher = await User.findOne({
            where: { id: teacherId, role: 'teacher', isActive: true }
        });

        if (!teacher) {
            return res.status(400).json({ message: '유효한 강사를 선택해주세요.' });
        }

        // 중복 스케줄 확인
        const existingSchedule = await Schedule.findOne({
            where: {
                dayOfWeek,
                timeSlot,
                teacherId,
                isActive: true
            }
        });

        if (existingSchedule) {
            return res.status(409).json({ message: '해당 시간대에 이미 스케줄이 존재합니다.' });
        }

        const schedule = await Schedule.create({
            dayOfWeek,
            timeSlot,
            courseName,
            teacherId,
            level,
            maxStudents,
            description
        });

        const scheduleWithTeacher = await Schedule.findByPk(schedule.id, {
            include: [{
                model: User,
                as: 'teacher',
                attributes: ['name', 'username']
            }]
        });

        res.status(201).json({
            message: '스케줄이 생성되었습니다.',
            schedule: scheduleWithTeacher
        });

    } catch (error) {
        console.error('스케줄 생성 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 스케줄 수정 (관리자만)
router.put('/:id', [
    authenticateToken,
    requireAdmin,
    body('dayOfWeek').optional().isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
        .withMessage('유효한 요일을 선택해주세요.'),
    body('timeSlot').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('시간 형식이 올바르지 않습니다. (예: 09:00-10:00)'),
    body('courseName').optional().isLength({ min: 2, max: 100 })
        .withMessage('수업명은 2-100자 사이여야 합니다.'),
    body('teacherId').optional().isInt()
        .withMessage('유효한 강사를 선택해주세요.'),
    body('level').optional().isIn(['beginner', 'intermediate', 'advanced'])
        .withMessage('유효한 수준을 선택해주세요.'),
    body('maxStudents').optional().isInt({ min: 1, max: 20 })
        .withMessage('최대 학생 수는 1-20명 사이여야 합니다.')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: '입력 데이터가 유효하지 않습니다.',
                errors: errors.array()
            });
        }

        const scheduleId = req.params.id;
        const updateData = req.body;

        const schedule = await Schedule.findByPk(scheduleId);
        if (!schedule) {
            return res.status(404).json({ message: '스케줄을 찾을 수 없습니다.' });
        }

        // 강사가 변경되는 경우 존재 여부 확인
        if (updateData.teacherId) {
            const teacher = await User.findOne({
                where: { id: updateData.teacherId, role: 'teacher', isActive: true }
            });

            if (!teacher) {
                return res.status(400).json({ message: '유효한 강사를 선택해주세요.' });
            }
        }

        await schedule.update(updateData);

        const updatedSchedule = await Schedule.findByPk(scheduleId, {
            include: [{
                model: User,
                as: 'teacher',
                attributes: ['name', 'username']
            }]
        });

        res.json({
            message: '스케줄이 수정되었습니다.',
            schedule: updatedSchedule
        });

    } catch (error) {
        console.error('스케줄 수정 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 스케줄 비활성화/활성화 (관리자만)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { isActive } = req.body;
        const scheduleId = req.params.id;

        const schedule = await Schedule.findByPk(scheduleId);
        if (!schedule) {
            return res.status(404).json({ message: '스케줄을 찾을 수 없습니다.' });
        }

        await schedule.update({ isActive });

        res.json({
            message: `스케줄이 ${isActive ? '활성화' : '비활성화'}되었습니다.`,
            schedule
        });

    } catch (error) {
        console.error('스케줄 상태 변경 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 스케줄 삭제 (관리자만)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const scheduleId = req.params.id;

        const schedule = await Schedule.findByPk(scheduleId);
        if (!schedule) {
            return res.status(404).json({ message: '스케줄을 찾을 수 없습니다.' });
        }

        await schedule.destroy();

        res.json({ message: '스케줄이 삭제되었습니다.' });

    } catch (error) {
        console.error('스케줄 삭제 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 강사별 스케줄 조회
router.get('/teacher/:teacherId', async (req, res) => {
    try {
        const { teacherId } = req.params;

        const schedules = await Schedule.findAll({
            where: {
                teacherId,
                isActive: true
            },
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
        console.error('강사별 스케줄 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;