const cron = require('node-cron');
const { Promotion } = require('../models');
const { syncProductPrice } = require('../services/price.service');
const { Op } = require('sequelize');

const initCron = () => {
    // ---------------------------------------------------------
    // VÍ DỤ: Setup chạy MỖI 15 PHÚT (Vào phút thứ 0, 15, 30, 45)
    // ---------------------------------------------------------
    cron.schedule('*/5 * * * *', async () => {
        console.log('🔄 Running Price Sync Cron (Every 15 mins)...');
        
        const now = new Date();
        // Lùi lại 20 phút để chắc chắn không bỏ sót cái nào vừa diễn ra
        // (Ví dụ cron chạy lúc 8:15, nó sẽ quét từ 7:55 đến 8:15)
        const timeWindow = new Date(now.getTime() - 20 * 60 * 1000); 

        try {
            // 1. Tìm các Promotion vừa BẮT ĐẦU hoặc vừa KẾT THÚC trong khoảng thời gian quét
            const changedPromotions = await Promotion.findAll({
                where: {
                    isActive: true, // Chỉ quan tâm promo đang bật
                    [Op.or]: [
                        // Vừa mới bắt đầu trong 20p qua
                        { startDate: { [Op.between]: [timeWindow, now] } },
                        // Hoặc vừa mới kết thúc trong 20p qua
                        { endDate: { [Op.between]: [timeWindow, now] } }
                    ]
                },
                include: ['products']
            });

            if (changedPromotions.length === 0) {
                console.log('✅ No promotions changed status recently.');
                return;
            }

            // 2. Gom nhóm Product ID để tránh update trùng lặp
            // (Ví dụ 1 sp tham gia cả 2 chương trình vừa đổi thì chỉ cần update 1 lần)
            const productIdsToUpdate = new Set();
            
            changedPromotions.forEach(promo => {
                if (promo.products) {
                    promo.products.forEach(p => productIdsToUpdate.add(p.id));
                }
            });

            // 3. Thực hiện Update
            const ids = Array.from(productIdsToUpdate);
            console.log(`⚡ Found ${ids.length} products to update.`);
            
            for (const id of ids) {
                await syncProductPrice(id);
            }
            
        } catch (error) {
            console.error('❌ Cron Job Error:', error);
        }
    });
};

module.exports = initCron;