const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');
const { validateRequest } = require('../middlewares/validateRequest');
// Đảm bảo bạn đã tạo file validator này, nếu chưa thì tạm thời comment dòng này lại
// const { promotionSchema, addProductsToPromotionSchema } = require('../validators/promotion.validator');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

/**
 * @swagger
 * tags:
 *   - name: Promotions
 *     description: Promotion & Discount management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Promotion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         discountPercent:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/promotions:
 *   post:
 *     summary: Create a new promotion campaign
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - discountPercent
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *               discountPercent:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Promotion created
 *       400:
 *         description: Invalid dates or percentage
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  // validateRequest(promotionSchema), // Bỏ comment khi đã có validator
  promotionController.createPromotion
);

/**
 * @swagger
 * /api/promotions:
 *   get:
 *     summary: Get all promotions (Admin dashboard)
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, upcoming, all]
 *         default: all
 *     responses:
 *       200:
 *         description: List of promotions
 */
router.get(
  '/',
  authenticate,
  authorize('admin'),
  promotionController.getAllPromotions
);

/**
 * @swagger
 * /api/promotions/{id}:
 *   get:
 *     summary: Get promotion detail with products list
 *     tags: [Promotions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Promotion detail
 */
router.get(
  '/:id',
  promotionController.getPromotionDetail
);

/**
 * @swagger
 * /api/promotions/{id}:
 *   put:
 *     summary: Update promotion info
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Promotion'
 *     responses:
 *       200:
 *         description: Updated successfully
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  promotionController.updatePromotion
);

/**
 * @swagger
 * /api/promotions/{id}:
 *   delete:
 *     summary: Delete promotion (and restore product prices)
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted successfully
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  promotionController.deletePromotion
);

// --- CÁC ROUTER QUAN TRỌNG CHO LOGIC GIÁ ---

/**
 * @swagger
 * /api/promotions/{id}/products:
 *   post:
 *     summary: Add products to a promotion (Trigger Price Sync)
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Promotion UUID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productIds
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Products added and prices recalculated
 */
router.post(
  '/:id/products',
  authenticate,
  authorize('admin'),
  // validateRequest(addProductsToPromotionSchema), // Bỏ comment khi đã có validator
  promotionController.addProductsToPromotion
);

/**
 * @swagger
 * /api/promotions/{id}/products:
 *   delete:
 *     summary: Remove products from promotion
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Products removed and prices restored
 */
router.delete(
  '/:id/products',
  authenticate,
  authorize('admin'),
  promotionController.removeProductsFromPromotion
);

/**
 * @swagger
 * /api/promotions/{id}/sync-price:
 *   post:
 *     summary: Manually trigger price sync for this promotion (Emergency Button)
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prices recalculated successfully
 */
router.post(
  '/:id/sync-price',
  authenticate,
  authorize('admin'),
  promotionController.forceSyncPrice
);

module.exports = router;
