const path = require('path');
const fs = require('fs');

const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'settings.json');

const DEFAULT_SALES_PROCESS = `1. Chào hỏi thân thiện, hỏi khách đang quan tâm dịp/ý tưởng chụp nào (chân dung, cổ trang, ngoại cảnh...).
2. Giới thiệu ngắn gọn phong cách phù hợp của studio dựa trên nhu cầu khách vừa chia sẻ.
3. Nếu khách hỏi giá: không bịa số cụ thể — nói studio sẽ tư vấn báo giá theo đúng concept khách chọn, mời khách để lại thông tin.
4. Chủ động đề xuất và CHỐT một ngày giờ hẹn chụp cụ thể với khách (hỏi khách ngày nào rảnh, đề xuất khung giờ phù hợp). [Chủ studio: hãy sửa bước này để ghi rõ lịch rảnh thật của bạn, ví dụ "chỉ nhận lịch sáng thứ 7, chủ nhật", "nghỉ các ngày lễ"...]
5. Xin họ tên và số điện thoại/Zalo để studio xác nhận lại lịch hẹn.
6. Tóm tắt lại ngày giờ đã chốt và cảm ơn khách, xác nhận studio sẽ liên hệ xác nhận lại sớm.`;

const DEFAULTS = {
  aiEnabled: false,
  apiBaseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  salesProcess: DEFAULT_SALES_PROCESS
};

function loadSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    return { ...DEFAULTS };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    return { ...DEFAULTS, ...raw };
  } catch (_) {
    return { ...DEFAULTS };
  }
}

function saveSettings(partial) {
  const current = loadSettings();
  const next = { ...current, ...partial };
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

module.exports = { loadSettings, saveSettings, DEFAULT_SALES_PROCESS };
