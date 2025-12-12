const axios = require('axios');

// Helper: Chuẩn hóa số điện thoại cho eSMS (bắt buộc định dạng 84xxx)
// Ví dụ: 0912345678 -> 84912345678
const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  // Xóa tất cả ký tự không phải số
  let cleanPhone = phone.replace(/\D/g, ''); 
  
  // Nếu bắt đầu bằng 84 thì giữ nguyên
  if (cleanPhone.startsWith('84')) {
    return cleanPhone;
  }
  // Nếu bắt đầu bằng 0 thì đổi thành 84
  if (cleanPhone.startsWith('0')) {
    return '84' + cleanPhone.substring(1);
  }
  // Mặc định thêm 84
  return '84' + cleanPhone;
};

// Hàm gửi SMS gốc qua API eSMS
const sendSMS = async (phone, content) => {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    const isSandbox = process.env.ESMS_SANDBOX === 'true';

    // Log khi ở môi trường dev để đỡ tốn tiền test
    if (process.env.NODE_ENV === 'development' || isSandbox) {
      console.log(`[eSMS-DEV] To: ${formattedPhone} | Content: ${content}`);
      if (isSandbox) return { CodeResult: 100, ErrorMessage: 'Sandbox Mode' };
    }

    // Gọi API eSMS (V4 GET)
    // SmsType: 2 là tin nhắn CSKH/Thông báo (quan trọng để không bị chặn spam)
    const response = await axios.get('http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get', {
      params: {
        ApiKey: process.env.ESMS_API_KEY,
        SecretKey: process.env.ESMS_SECRET_KEY,
        Phone: formattedPhone,
        Content: content,
        Brandname: process.env.ESMS_BRANDNAME,
        SmsType: 2, 
        Sandbox: isSandbox ? 1 : 0
      }
    });

    // Kiểm tra kết quả từ eSMS (CodeResult: 100 là thành công)
    if (response.data && response.data.CodeResult !== 100) {
      console.error(`eSMS Error: ${response.data.ErrorMessage} (Code: ${response.data.CodeResult})`);
      throw new Error(response.data.ErrorMessage);
    }

    return response.data;

  } catch (error) {
    console.error('Error sending SMS:', error.message);
    // Tùy chọn: throw error nếu muốn chặn luồng xử lý chính khi gửi SMS thất bại
  }
};

// 1. Gửi OTP Xác thực (Nên ngắn gọn)
const sendVerificationSMS = async (phone, otp) => {
  // Nội dung nên không dấu để đảm bảo hiển thị tốt và tiết kiệm ký tự
  const content = `Ma xac thuc (OTP) cua ban la: ${otp}. Ma co hieu luc trong 5 phut.`;
  await sendSMS(phone, content);
};

// 2. Gửi xác nhận đơn hàng
const sendOrderConfirmationSMS = async (phone, order) => {
  const { orderNumber, total } = order;
  const content = `Cam on ban da mua hang. Don hang #${orderNumber} da duoc xac nhan. Tong tien: ${total.toLocaleString('vi-VN')}d.`;
  await sendSMS(phone, content);
};

// 3. Gửi cập nhật trạng thái đơn hàng
const sendOrderStatusUpdateSMS = async (phone, order) => {
  const { orderNumber, status } = order;
  
  const statusMap = {
    shipped: 'da giao cho DVVC',
    delivered: 'da giao hang thanh cong',
    cancelled: 'da bi huy',
  };

  // Chỉ gửi SMS cho các trạng thái quan trọng
  if (statusMap[status]) {
    const content = `Don hang #${orderNumber} ${statusMap[status]}. Chi tiet xem tai website.`;
    await sendSMS(phone, content);
  }
};

// 4. Gửi Reset Password
const sendResetPasswordSMS = async (phone, token) => {
    // Với SMS, thường gửi mã OTP để reset thay vì gửi link dài
    const content = `Ma khoi phuc mat khau cua ban la: ${token}. Vui long khong chia se ma nay.`;
    await sendSMS(phone, content);
};

// --- [MỚI] SERVICE: THÔNG BÁO ĐƠN HÀNG CHƯA THANH TOÁN ---
const sendPaymentReminderSMS = async (phone, order) => {
  const { orderNumber, total, paymentLink } = order;
  
  // Mẫu tin nhắn ngắn gọn (nhằm dưới 160 ký tự)
  // Nếu có link thanh toán, hãy đảm bảo link đó đã được rút gọn (bit.ly hoặc short link của hệ thống)
  let content = `Don hang #${orderNumber} (${total.toLocaleString('en-US')}d) chua duoc thanh toan. Vui long thanh toan de chung toi xu ly don hang som nhat.`;
  
  // Nếu có link thanh toán ngắn thì thêm vào (cân nhắc độ dài)
  if (paymentLink) {
     content += ` Link: ${paymentLink}`;
  }

  await sendSMS(phone, content);
};

module.exports = {
  sendSMS,
  sendVerificationSMS,
  sendOrderConfirmationSMS,
  sendOrderStatusUpdateSMS,
  sendResetPasswordSMS,
  sendPaymentReminderSMS
};