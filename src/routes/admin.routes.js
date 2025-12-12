const express = require('express');
const router = express.Router();

// Import controllers
const adminController = require('../controllers/admin.controller');

// Import middlewares
const { adminAuthenticate } = require('../middlewares/adminAuth');
const { validate } = require('../middlewares/validateRequest');
const { auditMiddleware } = require('../services/adminAuditService');

// Import validators
const {
  createProductValidation,
  updateProductValidation,
  updateUserValidation,
  updateOrderStatusValidation,
  paginationValidation,
  statsValidation,
  deleteValidation,
  getByIdValidation,
  createPromotionValidation, // Cần tạo
  updatePromotionValidation, // Cần tạo
} = require('../validators/admin.validator');

// Middleware cho tất cả admin routes
router.use(adminAuthenticate);
router.use(auditMiddleware);

/**
 * DASHBOARD & STATISTICS ROUTES
 */
// GET /api/admin/dashboard - Thống kê tổng quan
router.get('/dashboard', adminController.getDashboardStats);

// GET /api/admin/stats - Thống kê chi tiết theo thời gian
router.get(
  '/stats',
  validate(statsValidation),
  adminController.getDetailedStats
);

/**
 * USER MANAGEMENT ROUTES
 */
// GET /api/admin/users - Lấy danh sách user với filter
router.get(
  '/users',
  validate(paginationValidation),
  adminController.getAllUsers
);

// PUT /api/admin/users/:id - Cập nhật thông tin user
router.put(
  '/users/:id',
  validate(updateUserValidation),
  adminController.updateUser
);

// DELETE /api/admin/users/:id - Xóa user
router.delete(
  '/users/:id',
  validate(deleteValidation),
  adminController.deleteUser
);

/**
 * PRODUCT MANAGEMENT ROUTES
 */
// GET /api/admin/products - Lấy danh sách sản phẩm với filter admin
router.get(
  '/products',
  validate(paginationValidation),
  adminController.getAllProducts
);

// GET /api/admin/products/:id - Lấy chi tiết sản phẩm
router.get(
  '/products/:id',
  validate(getByIdValidation),
  adminController.getProductById
);

// POST /api/admin/products - Tạo sản phẩm mới
router.post(
  '/products',
  validate(createProductValidation),
  adminController.createProduct
);

// PUT /api/admin/products/:id - Cập nhật sản phẩm
router.put(
  '/products/:id',
  validate(updateProductValidation),
  adminController.updateProduct
);

// DELETE /api/admin/products/:id - Xóa sản phẩm
router.delete(
  '/products/:id',
  validate(deleteValidation),
  adminController.deleteProduct
);

/**
 * REVIEW MANAGEMENT ROUTES
 */
// GET /api/admin/reviews - Lấy danh sách review
router.get(
  '/reviews',
  validate(paginationValidation),
  adminController.getAllReviews
);

// DELETE /api/admin/reviews/:id - Xóa review
router.delete(
  '/reviews/:id',
  validate(deleteValidation),
  adminController.deleteReview
);

/**
 * ORDER MANAGEMENT ROUTES
 */
// GET /api/admin/orders - Lấy danh sách đơn hàng
router.get(
  '/orders',
  validate(paginationValidation),
  adminController.getAllOrders
);

// PUT /api/admin/orders/:id/status - Cập nhật trạng thái đơn hàng
router.put(
  '/orders/:id/status',
  validate(updateOrderStatusValidation),
  adminController.updateOrderStatus
);

/**
 * PROMOTION MANAGEMENT ROUTES
 */

// 1. Lấy danh sách (List)
router.get(
    '/promotions',
    validate(paginationValidation),
    adminController.getAllPromotions
);

// 2. Tạo mới (Create)
router.post(
    '/promotions',
    validate(createPromotionValidation),
    adminController.createPromotion
);

// 3. Lấy chi tiết (Detail for Edit)
router.get(
    '/promotions/:id',
    validate(getByIdValidation),
    adminController.getPromotionDetail
);

// 4. Cập nhật (Update Info)
router.put(
    '/promotions/:id',
    validate(updatePromotionValidation),
    adminController.updatePromotion
);

// 5. Xóa (Delete)
router.delete(
    '/promotions/:id',
    validate(deleteValidation),
    adminController.deletePromotion
);

// --- CÁC ROUTE QUẢN LÝ SẢN PHẨM TRONG KM (Cho Tab "Sản phẩm áp dụng") ---

// 6. Thêm sản phẩm vào KM
// Sử dụng getByIdValidation để check ID Promotion, body productIds check trong controller
router.post(
    '/promotions/:id/products',
    validate(getByIdValidation), 
    adminController.addProductsToPromotion
);

// 7. Gỡ sản phẩm khỏi KM
router.delete(
    '/promotions/:id/products',
    validate(getByIdValidation),
    adminController.removeProductsFromPromotion
);

// 8. Nút khẩn cấp: Đồng bộ lại giá thủ công (Force Sync)
router.post(
    '/promotions/:id/sync-price',
    validate(getByIdValidation),
    adminController.forceSyncPrice // Hàm này cần đảm bảo có trong controller
);

module.exports = router;
