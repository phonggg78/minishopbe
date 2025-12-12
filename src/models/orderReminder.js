const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const OrderReminder = sequelize.define(
  'OrderReminder',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders', // Tên bảng orders
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('SMS', 'EMAIL', 'ZALO'),
      defaultValue: 'SMS',
    },
    messageContent: {
      type: DataTypes.TEXT, // Lưu nội dung tin nhắn để đối chứng
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('success', 'failed'),
      defaultValue: 'success',
    },
    sentBy: {
      type: DataTypes.STRING, 
      defaultValue: 'SYSTEM', // 'SYSTEM' nếu là cron job, hoặc UUID của Admin
    },
    sentAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    tableName: 'order_reminders',
    timestamps: true, // createdAt sẽ đóng vai trò là thời điểm tạo log
  }
);

module.exports = OrderReminder;