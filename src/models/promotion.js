const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/sequelize');

const Promotion = sequelize.define(
  'Promotion',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Tên chương trình, ví dụ: Flash Sale 8/3',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    
    // 1. GIẢM GIÁ THEO % (Đã có, nhưng cho phép null khi dùng loại giảm giá khác)
    discountPercent: {
      type: DataTypes.FLOAT, // 🚨 Đổi INTEGER thành FLOAT để hỗ trợ 0.01%
      allowNull: true, // 🚨 Cho phép NULL vì KM có thể là số tiền cố định
      field: 'discount_percent',
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },

    // 2. GIẢM GIÁ THEO SỐ TIỀN CỐ ĐỊNH (Fixed Amount Discount)
    discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'discount_amount',
        defaultValue: 0,
        comment: 'Số tiền cố định giảm (Ví dụ: 50000 VNĐ).',
    },

    // 3. GIÁ BÁN CỐ ĐỊNH (Fixed Price / Đồng giá)
    fixedPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'fixed_price',
        defaultValue: 0,
        comment: 'Giá bán cố định cuối cùng của sản phẩm (Ví dụ: 99000 VNĐ).',
    },

    // 4. GIỚI HẠN SỐ LƯỢNG (Quantity Cap) - Cần cho quản lý ngân sách KM
    totalUsageLimit: {
        type: DataTypes.INTEGER,
        allowNull: true, // Nếu null, không có giới hạn số lượng
        field: 'total_usage_limit',
        comment: 'Tổng số lần/sản phẩm tối đa được áp dụng KM.',
    },
    
    // 5. SỐ LƯỢNG ĐÃ DÙNG (Tracking)
    quantityUsed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'quantity_used',
        comment: 'Số lượng sản phẩm đã bán/đã dùng trong KM này.',
    },

    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_date',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    tableName: 'promotions',
    timestamps: true,
    // Thêm index để tối ưu Cron Job Query
    indexes: [
        {
            fields: ['start_date', 'end_date', 'is_active'],
        },
    ],
  }
);

module.exports = Promotion;