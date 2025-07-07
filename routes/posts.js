const express = require('express');
const { body, validationResult } = require('express-validator');
const { Post, User } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// 모든 게시글 조회 (공개, 발행된 것만)
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, category, search } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = { isPublished: true };
        if (category) whereClause.category = category;
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { content: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows: posts } = await Post.findAndCountAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'author',
                attributes: ['name', 'username']
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [
                ['isPinned', 'DESC'],
                ['createdAt', 'DESC']
            ]
        });

        res.json({
            posts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalPosts: count,
                hasNext: offset + posts.length < count,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('게시글 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 특정 게시글 상세 조회
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['name', 'username']
            }]
        });

        if (!post || !post.isPublished) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        // 조회수 증가
        await post.increment('viewCount');

        res.json({ post });

    } catch (error) {
        console.error('게시글 상세 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 게시글 작성 (로그인 필요)
router.post('/', [
    authenticateToken,
    body('title').isLength({ min: 2, max: 200 })
        .withMessage('제목은 2-200자 사이여야 합니다.'),
    body('content').isLength({ min: 10 })
        .withMessage('내용은 최소 10자 이상이어야 합니다.'),
    body('category').isIn(['notice', 'qna', 'event', 'general'])
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

        const { title, content, category, tags } = req.body;

        // 일반 사용자는 qna, general만 작성 가능
        if (req.user.role === 'student' && !['qna', 'general'].includes(category)) {
            return res.status(403).json({ message: '해당 카테고리에 글을 작성할 권한이 없습니다.' });
        }

        const post = await Post.create({
            title,
            content,
            category,
            tags: tags || [],
            authorId: req.user.id,
            isPublished: req.user.role === 'admin' ? true : false // 관리자는 바로 발행, 일반 사용자는 승인 대기
        });

        const postWithAuthor = await Post.findByPk(post.id, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['name', 'username']
            }]
        });

        res.status(201).json({
            message: req.user.role === 'admin' ? '게시글이 작성되었습니다.' : '게시글이 작성되었습니다. 관리자 승인 후 게시됩니다.',
            post: postWithAuthor
        });

    } catch (error) {
        console.error('게시글 작성 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 게시글 수정 (작성자 또는 관리자)
router.put('/:id', [
    authenticateToken,
    body('title').optional().isLength({ min: 2, max: 200 })
        .withMessage('제목은 2-200자 사이여야 합니다.'),
    body('content').optional().isLength({ min: 10 })
        .withMessage('내용은 최소 10자 이상이어야 합니다.'),
    body('category').optional().isIn(['notice', 'qna', 'event', 'general'])
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

        const postId = req.params.id;
        const updateData = req.body;

        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        // 권한 확인 (작성자 또는 관리자)
        if (post.authorId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: '게시글을 수정할 권한이 없습니다.' });
        }

        await post.update(updateData);

        const updatedPost = await Post.findByPk(postId, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['name', 'username']
            }]
        });

        res.json({
            message: '게시글이 수정되었습니다.',
            post: updatedPost
        });

    } catch (error) {
        console.error('게시글 수정 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 게시글 삭제 (작성자 또는 관리자)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;

        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        // 권한 확인 (작성자 또는 관리자)
        if (post.authorId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: '게시글을 삭제할 권한이 없습니다.' });
        }

        await post.destroy();

        res.json({ message: '게시글이 삭제되었습니다.' });

    } catch (error) {
        console.error('게시글 삭제 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 게시글 발행/비발행 (관리자만)
router.patch('/:id/publish', authenticateToken, requireAdmin, async (req, res) => {
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
        console.error('게시글 발행 상태 변경 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 게시글 고정/고정해제 (관리자만)
router.patch('/:id/pin', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { isPinned } = req.body;
        const postId = req.params.id;

        const post = await Post.findByPk(postId);
        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        await post.update({ isPinned });

        res.json({
            message: `게시글이 ${isPinned ? '고정' : '고정 해제'}되었습니다.`,
            post
        });

    } catch (error) {
        console.error('게시글 고정 상태 변경 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 카테고리별 게시글 수 조회
router.get('/stats/categories', async (req, res) => {
    try {
        const categories = await Post.findAll({
            attributes: [
                'category',
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
            ],
            where: { isPublished: true },
            group: ['category']
        });

        res.json({ categories });

    } catch (error) {
        console.error('카테고리 통계 조회 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;