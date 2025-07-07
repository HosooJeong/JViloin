const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Schedule = sequelize.define('Schedule', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    dayOfWeek: {
        type: DataTypes.ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
        allowNull: false,
    },
    timeSlot: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: '예: 09:00-10:00',
    },
    courseName: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    teacherId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    level: {
        type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
        allowNull: false,
    },
    maxStudents: {
        type: DataTypes.INTEGER,
        defaultValue: 6,
        validate: {
            min: 1,
            max: 20,
        },
    },
    currentStudents: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'schedules',
    timestamps: true,
});

module.exports = Schedule;