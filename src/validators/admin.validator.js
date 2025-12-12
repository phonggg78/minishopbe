const { body, query, param } = require('express-validator');

const createProductValidation = [
  body('name')
    .notEmpty()
    .withMessage('Tên sản phẩm là bắt buộc')
    .isLength({ min: 2, max: 200 })
    .withMessage('Tên sản phẩm phải từ 2-200 ký tự'),

  body('description').notEmpty().withMessage('Mô tả chi tiết là bắt buộc'),

  body('shortDescription').notEmpty().withMessage('Mô tả ngắn là bắt buộc'),

  body('price')
    .isFloat({ min: 0 })
    .withMessage('Giá sản phẩm phải là số dương'),

  body('compareAtPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giá so sánh phải là số dương'),

  body('comparePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giá so sánh phải là số dương'),

  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Số lượng tồn kho phải là số nguyên không âm'),

  body('inStock')
    .optional()
    .isBoolean()
    .withMessage('inStock phải là true/false'),

  body('featured')
    .optional()
    .isBoolean()
    .withMessage('featured phải là true/false'),

  body('images').optional().isArray().withMessage('Hình ảnh phải là một mảng'),

  body('searchKeywords')
    .optional()
    .isArray()
    .withMessage('Từ khóa tìm kiếm phải là một mảng'),

  body('seoKeywords')
    .optional()
    .isArray()
    .withMessage('SEO keywords phải là một mảng'),

  body('categoryIds')
    .optional()
    .isArray()
    .withMessage('Danh mục phải là một mảng'),
];

const updateProductValidation = [
  param('id').isUUID().withMessage('Product ID không hợp lệ'),

  body('name')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Tên sản phẩm phải từ 2-200 ký tự'),

  body('description').optional(),

  body('shortDescription').optional(),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giá sản phẩm phải là số dương'),

  body('compareAtPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giá so sánh phải là số dương'),

  body('comparePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giá so sánh phải là số dương'),

  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Số lượng tồn kho phải là số nguyên không âm'),

  body('inStock')
    .optional()
    .isBoolean()
    .withMessage('inStock phải là true/false'),

  body('featured')
    .optional()
    .isBoolean()
    .withMessage('featured phải là true/false'),

  body('images').optional().isArray().withMessage('Hình ảnh phải là một mảng'),

  body('searchKeywords')
    .optional()
    .isArray()
    .withMessage('Từ khóa tìm kiếm phải là một mảng'),

  body('seoKeywords')
    .optional()
    .isArray()
    .withMessage('SEO keywords phải là một mảng'),

  body('categoryIds')
    .optional()
    .isArray()
    .withMessage('Danh mục phải là một mảng'),
];

const updateUserValidation = [
  param('id').isUUID().withMessage('User ID không hợp lệ'),

  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên phải từ 2-50 ký tự'),

  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Họ phải từ 2-50 ký tự'),

  body('phone').optional(),

  body('role')
    .optional()
    .isIn(['customer', 'admin', 'manager'])
    .withMessage('Role không hợp lệ'),

  body('isEmailVerified')
    .optional()
    .isBoolean()
    .withMessage('isEmailVerified phải là boolean'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive phải là boolean'),
];

const updateOrderStatusValidation = [
  param('id').isUUID().withMessage('Order ID không hợp lệ'),

  body('status')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Trạng thái đơn hàng không hợp lệ'),

  body('note')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Ghi chú không được vượt quá 500 ký tự'),
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là số nguyên dương'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit phải là số nguyên từ 1-100'),

  query('sortBy').optional().isString().withMessage('SortBy phải là chuỗi'),

  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('SortOrder phải là ASC hoặc DESC'),
];

const statsValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày bắt đầu không hợp lệ'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày kết thúc không hợp lệ'),

  query('groupBy')
    .optional()
    .isIn(['hour', 'day', 'week', 'month'])
    .withMessage('GroupBy phải là hour, day, week hoặc month'),
];

const deleteValidation = [param('id').isUUID().withMessage('ID không hợp lệ')];

const getByIdValidation = [param('id').isUUID().withMessage('ID không hợp lệ')];

// ------------------------------------------------------------------
// PROMOTION VALIDATION (Đã cập nhật cho 3 loại giảm giá)
// ------------------------------------------------------------------

const createPromotionValidation = [
    // 1. Tên chương trình (Bắt buộc)
    body('name')
        .notEmpty()
        .withMessage('Tên chương trình khuyến mãi là bắt buộc')
        .isLength({ min: 2, max: 150 })
        .withMessage('Tên phải từ 2 đến 150 ký tự'),

    // 2. Ngày bắt đầu
    body('startDate')
        .notEmpty()
        .withMessage('Ngày bắt đầu là bắt buộc')
        .isISO8601()
        .withMessage('Ngày bắt đầu phải ở định dạng ISO 8601'),

    // 3. Ngày kết thúc
    body('endDate')
        .notEmpty()
        .withMessage('Ngày kết thúc là bắt buộc')
        .isISO8601()
        .withMessage('Ngày kết thúc phải ở định dạng ISO 8601')
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.startDate)) {
                throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
            }
            return true;
        }),

    // 4. Validate Loại giảm giá (Linh hoạt cho cả 3 loại)
    // Ít nhất một trong 3 loại giảm giá phải có giá trị > 0
    body().custom((value, { req }) => {
        const percent = parseFloat(req.body.discountPercent);
        const amount = parseFloat(req.body.discountAmount);
        const fixed = parseFloat(req.body.fixedPrice);

        const hasPercent = !isNaN(percent) && percent > 0;
        const hasAmount = !isNaN(amount) && amount > 0;
        const hasFixed = !isNaN(fixed) && fixed > 0;

        if (!hasPercent && !hasAmount && !hasFixed) {
            throw new Error('Vui lòng nhập ít nhất một mức giảm giá hợp lệ (%, Số tiền, hoặc Đồng giá)');
        }
        
        // Optional: Kiểm tra logic xung đột (chỉ cho phép 1 loại)
        // if ((hasPercent && hasAmount) || (hasPercent && hasFixed) || (hasAmount && hasFixed)) {
        //     throw new Error('Chỉ được chọn một loại giảm giá duy nhất');
        // }
        
        return true;
    }),

    // Validate chi tiết từng trường nếu nó tồn tại
    body('discountPercent')
        .optional({ nullable: true, checkFalsy: true })
        .isFloat({ min: 0.01, max: 100 })
        .withMessage('Mức giảm giá (%) phải từ 0.01 đến 100'),

    body('discountAmount')
        .optional({ nullable: true, checkFalsy: true })
        .isFloat({ min: 1000 }) // Ví dụ tối thiểu 1000đ
        .withMessage('Số tiền giảm phải là số dương và tối thiểu 1,000 VNĐ'),

    body('fixedPrice')
        .optional({ nullable: true, checkFalsy: true })
        .isFloat({ min: 1000 })
        .withMessage('Giá bán cố định phải là số dương và tối thiểu 1,000 VNĐ'),
    
    // 5. Giới hạn số lượng (Mới thêm)
    body('totalUsageLimit')
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: 1 })
        .withMessage('Giới hạn số lượng phải là số nguyên dương'),

    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive phải là true/false'),
];

// Trong file src/validators/admin.validator.js

const updatePromotionValidation = [
    param('id').isUUID().withMessage('Promotion ID không hợp lệ'),

    body('name').optional().isLength({ min: 2, max: 150 }),
    
    // Cho phép null hoặc 0 để reset
    body('discountPercent')
        .optional({ nullable: true })
        .isFloat({ min: 0, max: 100 }) // ⬅️ SỬA min: 0.01 THÀNH min: 0
        .withMessage('Mức giảm giá (%) phải từ 0 đến 100'),
    
    body('discountAmount')
        .optional({ nullable: true })
        .isFloat({ min: 0 }) // ⬅️ SỬA min THÀNH 0
        .withMessage('Số tiền giảm không được âm'),

    body('fixedPrice')
        .optional({ nullable: true })
        .isFloat({ min: 0 }) // ⬅️ SỬA min THÀNH 0
        .withMessage('Giá bán cố định không được âm'),
        
    body('totalUsageLimit')
        .optional({ nullable: true })
        .isInt({ min: 1 }),

    // (Tùy chọn) Thêm Custom Validator để đảm bảo logic
    body().custom((value, { req }) => {
        // Logic: Nếu người dùng gửi cả 3 trường là 0 thì báo lỗi (trừ khi họ không gửi trường nào để update partial)
        const percent = req.body.discountPercent !== undefined ? parseFloat(req.body.discountPercent) : undefined;
        const amount = req.body.discountAmount !== undefined ? parseFloat(req.body.discountAmount) : undefined;
        const fixed = req.body.fixedPrice !== undefined ? parseFloat(req.body.fixedPrice) : undefined;

        // Nếu request có gửi dữ liệu về giá, kiểm tra xem có cái nào > 0 không
        if ((percent === 0) && (amount === 0) && (fixed === 0)) {
             throw new Error('Phải có ít nhất một loại giảm giá có giá trị lớn hơn 0');
        }
        return true;
    }),
];

const addProductsValidation = [
    param('id').isUUID().withMessage('ID Khuyến mãi không hợp lệ'),
    body('items').isArray({ min: 1 }).withMessage('Phải chọn ít nhất 1 sản phẩm'),
    body('items.*.productId').isUUID().withMessage('Product ID không hợp lệ'),
    body('items.*.variantIds').isArray().withMessage('Variant IDs phải là mảng'),
];


module.exports = {
  createProductValidation,
  updateProductValidation,
  updateUserValidation,
  updateOrderStatusValidation,
  paginationValidation,
  statsValidation,
  deleteValidation,
  getByIdValidation,

  createPromotionValidation,
  updatePromotionValidation,
  addProductsValidation
};
