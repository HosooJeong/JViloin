const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Media = sequelize.define('Media', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false,
    },
    fileName: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    filePath: {
        type: DataTypes.STRING(500),
        allowNull: false,
    },
    fileType: {
        type: DataTypes.ENUM('image', 'video'),
        allowNull: false,
    },
    mimeType: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    fileSize: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: '파일 크기 (bytes)',
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    uploadedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    category: {
        type: DataTypes.ENUM('performance', 'lesson', 'event', 'facility'),
        defaultValue: 'lesson',
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '정렬 순서',
    },
}, {
    tableName: 'media',
    timestamps: true,
});

module.exports = Media;