const { Product, ProductVariant, Promotion, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Hàm cốt lõi: Tính toán và Cập nhật lại giá cho 1 sản phẩm (và các biến thể của nó)
 */
const syncProductPrice = async (productId, transaction) => {
    const now = new Date();

    // BƯỚC 1: Lấy thông tin Sản phẩm + Biến thể + Khuyến mãi đang chạy
    const product = await Product.findByPk(productId, {
        include: [
            {
                model: ProductVariant,
                as: 'variants'
            },
            {
                model: Promotion,
                as: 'promotions',
                required: false, // Left Join
                where: {
                    isActive: true,
                    startDate: { [Op.lte]: now }, // Bắt đầu <= Hiện tại
                    endDate: { [Op.gte]: now }    // Kết thúc >= Hiện tại
                },
                // ⚠️ QUAN TRỌNG: Lấy thêm thông tin từ bảng trung gian
                through: {
                    attributes: ['variantIds'] 
                }
            }
        ],
        transaction
    });

    if (!product) return;

    // ----------------------------------------------------------------------
    // BƯỚC 2: Hàm xác định giá cuối cùng thấp nhất (Lowest Final Price Rule)
    // ----------------------------------------------------------------------
    const calculateFinalPrice = (originalPrice, promotions) => {
        let lowestFinalPrice = originalPrice;
        
        if (!promotions || promotions.length === 0) {
            return originalPrice;
        }

        promotions.forEach(promo => {
            let calculatedPrice = originalPrice;

            if (promo.fixedPrice && promo.fixedPrice > 0) {
                calculatedPrice = parseFloat(promo.fixedPrice);
            } else if (promo.discountAmount && promo.discountAmount > 0) {
                calculatedPrice = originalPrice - parseFloat(promo.discountAmount);
            } else if (promo.discountPercent && promo.discountPercent > 0) {
                calculatedPrice = originalPrice * (1 - promo.discountPercent / 100);
            }
            
            calculatedPrice = Math.max(0, calculatedPrice);

            if (calculatedPrice < lowestFinalPrice) {
                lowestFinalPrice = calculatedPrice;
            }
        });

        return lowestFinalPrice;
    };
    
    // ----------------------------------------------------------------------
    // BƯỚC 3: Cập nhật giá cho từng BIẾN THỂ (ProductVariant)
    // ----------------------------------------------------------------------
    const updateVariantPromises = [];
    let minVariantPrice = Infinity;
    let minVariantSalePrice = Infinity;

    const activePromotions = product.promotions || [];

    if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
            const originalPrice = parseFloat(variant.price);
            
            // 🔍 LOGIC MỚI: Lọc các Promotion áp dụng cho Variant này
            const applicablePromotions = activePromotions.filter(promo => {
                // Lấy dữ liệu từ bảng trung gian
                const throughData = promo.ProductPromotion || {}; // Sequelize trả về model ProductPromotion trong object này
                
                let allowedVariantIds = throughData.variantIds;

                // Fix lỗi kiểu dữ liệu nếu DB trả về string
                if (typeof allowedVariantIds === 'string') {
                    try {
                        allowedVariantIds = JSON.parse(allowedVariantIds);
                    } catch (e) {
                        allowedVariantIds = [];
                    }
                }

                // Nếu không có giới hạn (null/empty) -> Áp dụng cho tất cả
                if (!allowedVariantIds || !Array.isArray(allowedVariantIds) || allowedVariantIds.length === 0) {
                    return true; 
                }

                // Nếu có giới hạn -> Kiểm tra ID
                return allowedVariantIds.includes(variant.id);
            });

            // Tính giá sale mới dựa trên các promotion ĐƯỢC PHÉP
            let newSalePrice = calculateFinalPrice(originalPrice, applicablePromotions);
            
            newSalePrice = Math.round(newSalePrice);

            if (originalPrice < minVariantPrice) minVariantPrice = originalPrice;
            if (newSalePrice < minVariantSalePrice) minVariantSalePrice = newSalePrice;

            // Update DB Variant nếu giá thay đổi
            if (parseFloat(variant.salePrice) !== newSalePrice) {
                updateVariantPromises.push(
                    variant.update({ salePrice: newSalePrice }, { transaction })
                );
            }
        }
    } else {
        // Trường hợp sản phẩm đơn
        const originalPrice = parseFloat(product.price);
        minVariantPrice = originalPrice;
        
        // Sản phẩm đơn thì activePromotions áp dụng hết (vì ko có variantIds để lọc)
        let newSalePrice = calculateFinalPrice(originalPrice, activePromotions);
        minVariantSalePrice = Math.round(newSalePrice);
    }

    await Promise.all(updateVariantPromises);

    // ----------------------------------------------------------------------
    // BƯỚC 4: Đồng bộ giá lên bảng PRODUCT (Cha)
    // ----------------------------------------------------------------------
    
    if (minVariantPrice === Infinity) minVariantPrice = 0;
    if (minVariantSalePrice === Infinity) minVariantSalePrice = 0;

    await product.update({
        price: minVariantPrice,
        salePrice: minVariantSalePrice
    }, { transaction });
    
    console.log(`✅ Synced Price for Product ${product.id}: ${minVariantPrice} -> ${minVariantSalePrice}`);
};

module.exports = { syncProductPrice };