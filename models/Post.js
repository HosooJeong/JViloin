const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    category: {
        type: DataTypes.ENUM('notice', 'qna', 'event', 'general'),
        defaultValue: 'general',
    },
    isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    isPinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    tags: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '태그 배열',
    },
}, {
    tableName: 'posts',
    timestamps: true,
});

module.exports = Post;