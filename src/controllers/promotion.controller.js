const { Promotion, Product, sequelize, ProductVariant } = require('../models');
const { Op } = require('sequelize');
const { catchAsync } = require('../utils/catchAsync');
const { AppError } = require('../middlewares/errorHandler');
const { syncProductPrice } = require('../services/price.service'); // Uncomment khi đã có service

/**
 * ------------------------------------------------------------------
 * PROMOTION CONTROLLER (ADMIN)
 * Chứa các logic quản lý chương trình khuyến mãi
 * ------------------------------------------------------------------
 */

// 1. Lấy danh sách khuyến mãi (Có phân trang, lọc, tìm kiếm)
const getAllPromotions = catchAsync(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        search = '',
        status = 'all',
        sortBy = 'createdAt',
        sortOrder = 'DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereClause = {};

    // Logic Filter Trạng Thái
    if (status !== 'all') {
        const now = new Date();
        switch (status) {
            case 'active':
                whereClause = { isActive: true, startDate: { [Op.lte]: now }, endDate: { [Op.gte]: now } };
                break;
            case 'upcoming':
                whereClause = { isActive: true, startDate: { [Op.gt]: now } };
                break;
            case 'expired':
                whereClause = { endDate: { [Op.lt]: now } };
                break;
            case 'inactive':
                whereClause = { isActive: false };
                break;
        }
    }

    // Filter theo tìm kiếm
    if (search) {
        whereClause[Op.or] = [
            { name: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } },
        ];
    }
    
    // Thực hiện truy vấn
    const { count, rows: promotions } = await Promotion.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]],
    });

    res.status(200).json({
        status: 'success',
        data: {
            promotions, 
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / parseInt(limit)),
                totalItems: count,
                itemsPerPage: parseInt(limit),
            }
        },
    });
});

// 2. Tạo khuyến mãi mới
const createPromotion = catchAsync(async (req, res) => {
    const { 
        name, description, 
        discountPercent, discountAmount, fixedPrice, // Hỗ trợ 3 loại giảm giá
        startDate, endDate, isActive 
    } = req.body;

    // Validate cơ bản (Ngày bắt đầu < Ngày kết thúc) - Đã có validator nhưng check thêm ở đây cho chắc
    if (new Date(startDate) >= new Date(endDate)) {
        throw new AppError('Ngày kết thúc phải sau ngày bắt đầu', 400);
    }

    const newPromotion = await Promotion.create({
        name,
        description,
        discountPercent,
        discountAmount,
        fixedPrice,
        startDate,
        endDate,
        isActive: isActive !== undefined ? isActive : true,
    });

    // TODO: Nếu Promotion có hiệu lực ngay và có sản phẩm, cần trigger sync giá
    
    res.status(201).json({
        status: 'success',
        message: 'Tạo chương trình khuyến mãi thành công',
        data: { promotion: newPromotion },
    });
});

// 3. Lấy chi tiết khuyến mãi (Kèm danh sách sản phẩm)
// src/controllers/promotion.controller.js

const getPromotionDetail = catchAsync(async (req, res) => {
    const { id } = req.params;
    const promotion = await Promotion.findByPk(id, {
        include: [{
            model: Product,
            as: 'products',
            // 1. THÊM 'stockQuantity' VÀO ĐÂY
            attributes: ['id', 'name', 'price', 'salePrice', 'thumbnail', 'sku', 'stockQuantity'], 
            through: { attributes: [] },
            
            // 2. THÊM KHỐI INCLUDE VARIANTS NÀY (Bắt buộc để tính tổng kho biến thể)
            include: [{
                model: ProductVariant,
                as: 'variants',
                attributes: ['id', 'name', 'price', 'salePrice', 'stockQuantity', 'sku', 'displayName']
            }]
        }]
    });
    // ...

    if (!promotion) {
        throw new AppError('Không tìm thấy chương trình khuyến mãi', 404);
    }

    res.status(200).json({
        status: 'success',
        data: promotion, // Trả về object promotion (có kèm mảng products)
    });
});

// 4. Cập nhật khuyến mãi
const updatePromotion = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const promotion = await Promotion.findByPk(id);
    if (!promotion) {
        throw new AppError('Không tìm thấy chương trình khuyến mãi', 404);
    }

    const t = await sequelize.transaction();
    try {
        const updatedPromotion = await promotion.update(updateData, { transaction: t });
        
        // Kiểm tra xem các trường ảnh hưởng đến giá có bị thay đổi không
        if (
            updateData.discountPercent !== undefined ||
            updateData.discountAmount !== undefined ||
            updateData.fixedPrice !== undefined ||
            updateData.startDate ||
            updateData.endDate ||
            updateData.isActive !== undefined
        ) {
            // ✅ LOGIC QUAN TRỌNG: Lấy sản phẩm và tính lại giá ngay lập tức
            const products = await promotion.getProducts({ transaction: t });
            
            if (products.length > 0) {
                // Dùng Promise.all để chạy song song cho nhanh
                await Promise.all(products.map(p => syncProductPrice(p.id, t)));
            }
        }

        await t.commit();

        res.status(200).json({
            status: 'success',
            message: 'Cập nhật thành công',
            data: { promotion: updatedPromotion },
        });
    } catch (error) {
        await t.rollback();
        throw error;
    }
});

// 5. Xóa khuyến mãi
const deletePromotion = catchAsync(async (req, res) => {
    const { id } = req.params;
    const promotion = await Promotion.findByPk(id);
    
    if (!promotion) {
        throw new AppError('Không tìm thấy chương trình khuyến mãi', 404);
    }

    const t = await sequelize.transaction();
    try {
        // 1. Lấy danh sách sản phẩm TRƯỚC KHI xóa quan hệ
        const products = await promotion.getProducts({ transaction: t });

        // 2. Xóa khuyến mãi
        await promotion.destroy({ transaction: t });

        // 3. ✅ LOGIC QUAN TRỌNG: Tính lại giá cho các sản phẩm vừa mất khuyến mãi
        // (Để giá sale trở về bằng giá gốc hoặc theo KM khác)
        if (products.length > 0) {
           await Promise.all(products.map(p => syncProductPrice(p.id, t)));
        }

        await t.commit();

        res.status(200).json({
            status: 'success',
            message: 'Xóa chương trình khuyến mãi thành công',
        });
    } catch (error) {
        await t.rollback();
        throw error;
    }
});

// 6. Thêm sản phẩm vào khuyến mãi (LOGIC MỚI: MERGE KHÔNG GHI ĐÈ)
const addProductsToPromotion = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { items } = req.body; // [{ productId, variantIds: ['v1'] }]

    if (!items || !Array.isArray(items) || items.length === 0) {
         throw new AppError("Danh sách sản phẩm không hợp lệ.", 400);
    }

    const t = await sequelize.transaction();
    try {
        const promotion = await Promotion.findByPk(id, { transaction: t });
        if (!promotion) throw new AppError('Promotion not found', 404);

        await Promise.all(items.map(async (item) => {
            const { productId, variantIds } = item;
            const incomingVariantIds = Array.isArray(variantIds) ? variantIds : [];

            // 1. Tìm xem sản phẩm đã có trong KM chưa
            const productPromotion = await sequelize.models.ProductPromotion.findOne({
                where: { productId, promotionId: id },
                transaction: t
            });

            let newVariantIds = [];

            if (productPromotion) {
                // --- TRƯỜNG HỢP ĐÃ CÓ: GỘP CŨ + MỚI ---
                let currentVariantIds = productPromotion.variantIds;
                
                // Fix lỗi parse JSON nếu cần
                if (typeof currentVariantIds === 'string') {
                    try { currentVariantIds = JSON.parse(currentVariantIds); } catch (e) { currentVariantIds = []; }
                }
                if (!Array.isArray(currentVariantIds)) currentVariantIds = [];

                // Nếu hiện tại đang là "Áp dụng tất cả" (Rỗng/Null) -> Giữ nguyên
                if (currentVariantIds.length === 0 && productPromotion.variantIds !== null) {
                     // Logic cũ của bạn: [] = All. Nếu muốn giữ nguyên All thì không làm gì cả.
                     // Nhưng nếu logic của bạn là [] = None (chưa chọn gì), thì gộp bình thường.
                     // Dựa trên logic "Chọn biến thể", ta gộp ID lại:
                     newVariantIds = [...new Set([...currentVariantIds, ...incomingVariantIds])];
                } else {
                    // Gộp ID cũ và mới, loại bỏ trùng lặp
                    newVariantIds = [...new Set([...currentVariantIds, ...incomingVariantIds])];
                }

                // Cập nhật lại
                await productPromotion.update({ variantIds: newVariantIds }, { transaction: t });
            } else {
                // --- TRƯỜNG HỢP CHƯA CÓ: TẠO MỚI ---
                await promotion.addProduct(productId, { 
                    through: { variantIds: incomingVariantIds },
                    transaction: t 
                });
            }
        }));

        // Trigger Sync Giá
        const productIdsToSync = items.map(i => i.productId);
        if (productIdsToSync.length > 0) {
            await Promise.all(productIdsToSync.map(pid => syncProductPrice(pid, t)));
        }

        await t.commit();
        res.status(200).json({ status: 'success', message: 'Đã cập nhật sản phẩm.' });
    } catch (error) {
        await t.rollback();
        throw error;
    }
});

// 7. Gỡ sản phẩm/biến thể (LOGIC MỚI: GIỮ LẠI SẢN PHẨM NẾU CÒN BIẾN THỂ KHÁC)
const removeProductsFromPromotion = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { items } = req.body; 

    const t = await sequelize.transaction();
    try {
        const promotion = await Promotion.findByPk(id, { transaction: t });
        if (!promotion) throw new AppError('Promotion not found', 404);

        await Promise.all(items.map(async (item) => {
            const { productId, variantIds } = item; // IDs cần xóa
            const idsToRemove = Array.isArray(variantIds) ? variantIds : [];

            const productPromotion = await sequelize.models.ProductPromotion.findOne({
                where: { productId, promotionId: id },
                transaction: t
            });

            if (!productPromotion) return;

            // Nếu yêu cầu xóa RỖNG [] -> Nghĩa là xóa toàn bộ sản phẩm
            if (idsToRemove.length === 0) {
                await productPromotion.destroy({ transaction: t });
                return;
            }

            // Xử lý xóa từng biến thể
            let currentVariantIds = productPromotion.variantIds;
             if (typeof currentVariantIds === 'string') {
                try { currentVariantIds = JSON.parse(currentVariantIds); } catch (e) { currentVariantIds = []; }
            }
            if (!Array.isArray(currentVariantIds)) currentVariantIds = [];

            // Nếu đang là "Chọn tất cả" (mảng rỗng/null), cần lấy danh sách full ID ra để trừ
            if (currentVariantIds.length === 0) {
                 const allVariants = await ProductVariant.findAll({
                    where: { productId },
                    attributes: ['id'],
                    transaction: t
                });
                const allVariantIds = allVariants.map(v => v.id);
                // Giữ lại những cái KHÔNG bị xóa
                currentVariantIds = allVariantIds;
            }

            // Lọc bỏ ID cần xóa
            const newVariantIds = currentVariantIds.filter(vid => !idsToRemove.includes(vid));

            if (newVariantIds.length === 0) {
                // ⚠️ QUAN TRỌNG: Nếu xóa hết biến thể, có nên xóa luôn sản phẩm khỏi list không?
                // Hiện tại: Xóa luôn dòng ProductPromotion để khỏi rác DB
                await productPromotion.destroy({ transaction: t });
            } else {
                // Cập nhật danh sách còn lại
                await productPromotion.update({ variantIds: newVariantIds }, { transaction: t });
            }
        }));

        // Trigger Sync Giá (về giá gốc)
        const productIdsToSync = items.map(i => i.productId);
        if (productIdsToSync.length > 0) {
            await Promise.all(productIdsToSync.map(pid => syncProductPrice(pid, t)));
        }

        await t.commit();
        res.status(200).json({ status: 'success', message: 'Đã cập nhật.' });
    } catch (error) {
        await t.rollback();
        throw error;
    }
});
// 8. Nút bấm khẩn cấp: Sync lại giá thủ công
const forceSyncPrice = catchAsync(async (req, res) => {
    const { id } = req.params;
    const promotion = await Promotion.findByPk(id);
    
    if (!promotion) {
        throw new AppError('Không tìm thấy chương trình khuyến mãi', 404);
    }

    // Lấy tất cả sản phẩm thuộc promotion này
    const products = await promotion.getProducts();
    
    if (products.length > 0) {
        console.log(`[FORCE SYNC] Đang tính lại giá cho ${products.length} sản phẩm của Promotion ${id}`);
        // Trigger sync giá cho từng sản phẩm
        await Promise.all(products.map(p => syncProductPrice(p.id)));
    }

    res.status(200).json({
        status: 'success',
        message: 'Đã kích hoạt đồng bộ giá thủ công thành công!',
    });
});

module.exports = {
    getAllPromotions,
    createPromotion,
    getPromotionDetail,
    updatePromotion,
    deletePromotion,
    addProductsToPromotion,
    removeProductsFromPromotion,
    forceSyncPrice
};