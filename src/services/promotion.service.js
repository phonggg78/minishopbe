const { Promotion, Product, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Tạo chương trình khuyến mãi mới
 * @param {Object} data - Dữ liệu input (name, discountPercent, dates...)
 */
const createPromotion = async (data) => {
  const { name, description, discountPercent, startDate, endDate } = data;

  // 1. Validate Logic nghiệp vụ (Business Logic)
  // Ngày kết thúc không được trước ngày bắt đầu
  if (new Date(startDate) >= new Date(endDate)) {
    throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
  }

  // 2. Validate trùng tên (Optional)
  const existingPromo = await Promotion.findOne({ where: { name: name } });
  if (existingPromo) {
    throw new Error('Tên chương trình khuyến mãi đã tồn tại');
  }

  // 3. Gọi Model để tạo
  const newPromotion = await Promotion.create({
    name,
    description,
    discountPercent,
    startDate,
    endDate,
    isActive: true,
  });

  return newPromotion;
};

/**
 * Thêm danh sách sản phẩm vào khuyến mãi
 * @param {String} promotionId
 * @param {Array} productIds
 */
const addProductsToPromotion = async (promotionId, productIds) => {
  const transaction = await sequelize.transaction(); // Dùng transaction để đảm bảo an toàn dữ liệu

  try {
    // 1. Kiểm tra khuyến mãi có tồn tại không
    const promotion = await Promotion.findByPk(promotionId, { transaction });
    if (!promotion) {
      throw new Error('Không tìm thấy chương trình khuyến mãi');
    }

    // 2. Kiểm tra khuyến mãi có đang active không (Tuỳ logic bên bạn, có thể cho phép add vào promo cũ)
    // if (!promotion.isActive) throw new Error('Chương trình này đã bị khoá');

    // 3. Thực hiện add
    // Hàm addProducts là Magic Method do Sequelize tự sinh ra nhờ quan hệ belongsToMany
    await promotion.addProducts(productIds, { transaction });

    await transaction.commit();
    return { success: true, count: productIds.length };

  } catch (error) {
    await transaction.rollback();
    throw error; // Ném lỗi ra để Controller bắt
  }
};

/**
 * Lấy chi tiết khuyến mãi kèm danh sách sản phẩm bên trong
 */
const getPromotionDetail = async (promotionId) => {
    const promotion = await Promotion.findByPk(promotionId, {
        include: [{
            model: Product,
            as: 'products',
            attributes: ['id', 'name', 'price', 'slug'], // Chỉ lấy trường cần thiết
            through: { attributes: [] } // Không lấy dữ liệu bảng trung gian
        }]
    });
    
    if (!promotion) throw new Error('Không tìm thấy chương trình khuyến mãi');
    return promotion;
}

module.exports = {
  createPromotion,
  addProductsToPromotion,
  getPromotionDetail
};