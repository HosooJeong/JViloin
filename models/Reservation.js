const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reservation = sequelize.define('Reservation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    scheduleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'schedules',
            key: 'id',
        },
    },
    reservationDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: '예약 날짜 (YYYY-MM-DD)',
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
        defaultValue: 'pending',
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '예약 메모',
    },
    paymentStatus: {
        type: DataTypes.ENUM('unpaid', 'paid', 'refunded'),
        defaultValue: 'unpaid',
    },
    paymentAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: '결제 금액',
    },
    cancelledAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    cancelReason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'reservations',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['userId', 'scheduleId', 'reservationDate'],
            name: 'unique_user_schedule_date'
        }
    ],
});

module.exports = Reservation;