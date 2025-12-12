const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const ProductPromotion = sequelize.define(
  'ProductPromotion',
  {
    productId: {
      type: DataTypes.UUID,
      field: 'product_id',
      primaryKey: true,
      references: { model: 'products', key: 'id' },
    },
    promotionId: {
      type: DataTypes.UUID,
      field: 'promotion_id',
      primaryKey: true,
      references: { model: 'promotions', key: 'id' },
    },
    // 🆕 THÊM CỘT NÀY: Lưu danh sách ID các biến thể được chọn
    // Nếu null hoặc rỗng [] -> Hiểu là chọn TẤT CẢ biến thể
    variantIds: {
      type: DataTypes.JSONB, // Hoặc DataTypes.TEXT nếu dùng MySQL bản cũ (lưu string JSON)
      allowNull: true,
      defaultValue: [], 
      field: 'variant_ids',
      comment: 'Danh sách ID các biến thể áp dụng. Nếu rỗng thì áp dụng hết.',
    },
  },
  {
    tableName: 'product_promotions',
    timestamps: true,
  }
);

module.exports = ProductPromotion;