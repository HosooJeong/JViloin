const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { Media, User } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 멀터 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const typeDir = file.mimetype.startsWith('image/') ? 'images' : 'videos';
        const fullPath = path.join(uploadDir, typeDir);
        
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
        
        cb(null, fullPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // 이미지 파일
    if (file.mimetype.startsWith('image/')) {
        if (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('지원하지 않는 이미지 형식입니다.'), false);
        }
    }
    // 비디오 파일
    else if (file.mimetype.startsWith('video/')) {
        if (['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('지원하지 않는 비디오 형식입니다.'), false);
        }
    } else {
        cb(new Error('이미지 또는 비디오 파일만 업로드 가능합니다.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB 제한
    }
});

// 모든 미디어 조회 (공개, 발행된 것만)
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 12, type, category } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = { isPublished: true };
        if (type) whereClause.fileType = type;
        if (category) whereClause.category = category;

        const { count, rows: media } = await Media.findAndCountAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'uploader',
                attributes: ['name', 'username']
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [
                ['sortOrder', 'DESC'],
                ['createdAt', 'DESC']
            ]
        });

        res.json({
            media,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalMedia: count,
                hasNext: offset + media.length < count,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('미디어 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 특정 미디어 상세 조회
router.get('/:id', async (req, res) => {
    try {
        const media = await Media.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'uploader',
                attributes: ['name', 'username']
            }]
        });

        if (!media || !media.isPublished) {
            return res.status(404).json({ message: '미디어를 찾을 수 없습니다.' });
        }

        res.json({ media });

    } catch (error) {
        console.error('미디어 상세 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 미디어 업로드 (관리자만)
router.post('/upload', [
    authenticateToken,
    requireAdmin,
    upload.single('file')
], async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: '파일을 선택해주세요.' });
        }

        const { title, description, category = 'lesson' } = req.body;

        if (!title || title.trim().length < 2) {
            return res.status(400).json({ message: '제목은 2글자 이상이어야 합니다.' });
        }

        const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
        const filePath = `/uploads/${fileType === 'image' ? 'images' : 'videos'}/${req.file.filename}`;

        const media = await Media.create({
            title: title.trim(),
            fileName: req.file.originalname,
            filePath: filePath,
            fileType: fileType,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            description: description || '',
            category: category,
            uploadedBy: req.user.id,
            isPublished: true
        });

        const mediaWithUploader = await Media.findByPk(media.id, {
            include: [{
                model: User,
                as: 'uploader',
                attributes: ['name', 'username']
            }]
        });

        res.status(201).json({
            message: '미디어가 업로드되었습니다.',
            media: mediaWithUploader
        });

    } catch (error) {
        // 파일 업로드 실패 시 파일 삭제
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        console.error('미디어 업로드 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 미디어 정보 수정 (관리자만)
router.put('/:id', [
    authenticateToken,
    requireAdmin,
    body('title').optional().isLength({ min: 2, max: 200 })
        .withMessage('제목은 2-200자 사이여야 합니다.'),
    body('category').optional().isIn(['performance', 'lesson', 'event', 'facility'])
        .withMessage('유효한 카테고리를 선택해주세요.')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: '입력 데이터가 유효하지 않습니다.',
                errors: errors.array()
            });
        }

        const mediaId = req.params.id;
        const { title, description, category, sortOrder } = req.body;

        const media = await Media.findByPk(mediaId);
        if (!media) {
            return res.status(404).json({ message: '미디어를 찾을 수 없습니다.' });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (category !== undefined) updateData.category = category;
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

        await media.update(updateData);

        const updatedMedia = await Media.findByPk(mediaId, {
            include: [{
                model: User,
                as: 'uploader',
                attributes: ['name', 'username']
            }]
        });

        res.json({
            message: '미디어 정보가 수정되었습니다.',
            media: updatedMedia
        });

    } catch (error) {
        console.error('미디어 수정 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 미디어 발행/비발행 (관리자만)
router.patch('/:id/publish', authenticateToken, requireAdmin, async (req, res) => {
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
        console.error('미디어 발행 상태 변경 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 미디어 삭제 (관리자만)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const mediaId = req.params.id;

        const media = await Media.findByPk(mediaId);
        if (!media) {
            return res.status(404).json({ message: '미디어를 찾을 수 없습니다.' });
        }

        // 파일 시스템에서 파일 삭제
        const fullPath = path.join(__dirname, '..', media.filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        await media.destroy();

        res.json({ message: '미디어가 삭제되었습니다.' });

    } catch (error) {
        console.error('미디어 삭제 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 미디어 정렬 순서 일괄 수정 (관리자만)
router.patch('/reorder', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { mediaList } = req.body; // [{ id: 1, sortOrder: 10 }, ...]

        if (!Array.isArray(mediaList)) {
            return res.status(400).json({ message: '올바른 데이터 형식이 아닙니다.' });
        }

        // 트랜잭션으로 일괄 업데이트
        const updatePromises = mediaList.map(item => 
            Media.update(
                { sortOrder: item.sortOrder },
                { where: { id: item.id } }
            )
        );

        await Promise.all(updatePromises);

        res.json({ message: '미디어 순서가 변경되었습니다.' });

    } catch (error) {
        console.error('미디어 순서 변경 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 카테고리별 미디어 수 조회
router.get('/stats/categories', async (req, res) => {
    try {
        const categories = await Media.findAll({
            attributes: [
                'category',
                'fileType',
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
            ],
            where: { isPublished: true },
            group: ['category', 'fileType']
        });

        res.json({ categories });

    } catch (error) {
        console.error('미디어 카테고리 통계 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;