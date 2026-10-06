const VN_PHONE_RE = /^(0|\+84)(\d){9,10}$/;
const LEAD_MARKER_RE = /<!--LEAD:(\{.*?\})-->/s;
const MAX_HISTORY_MESSAGES = 12;
const REQUEST_TIMEOUT_MS = 20000;

function buildSystemPrompt(studio, salesProcess) {
  const pillars = studio.pillars.map((p) => `- ${p.name}: ${p.desc}`).join('\n');

  return [
    `Bạn là trợ lý tư vấn của ${studio.name} (${studio.tagline}), một studio nhiếp ảnh nghệ thuật tại ${studio.location}.`,
    `Phong cách của studio:\n${pillars}`,
    `Thông tin liên hệ: Zalo/Hotline ${studio.phone}, Facebook: ${studio.facebookUrl}.`,
    `QUY TRÌNH TƯ VẤN VÀ CHỐT ĐƠN (do chủ studio thiết lập — hãy tuân theo sát nhất có thể, chủ động dẫn dắt hội thoại tự nhiên theo đúng các bước này, kể cả việc đề xuất và chốt ngày giờ hẹn cụ thể với khách):\n${salesProcess}`,
    `QUAN TRỌNG: Khi khách đã cung cấp cả họ tên VÀ số điện thoại/Zalo hợp lệ, hãy kết thúc câu trả lời bằng một dòng ẩn duy nhất theo đúng định dạng sau (khách sẽ không nhìn thấy dòng này):\n<!--LEAD:{"name":"Họ tên khách","phone":"Số điện thoại","bookingDate":"Ngày giờ hẹn đã chốt với khách, để chuỗi rỗng nếu chưa chốt được ngày cụ thể","note":"Tóm tắt ngắn gọn nhu cầu/concept khách quan tâm"}-->\nChỉ chèn dòng này một lần, khi đã có đủ cả tên và số điện thoại. Không chèn nếu thiếu một trong hai.`
  ].filter(Boolean).join('\n\n');
}

function extractLead(replyText) {
  const match = replyText.match(LEAD_MARKER_RE);
  if (!match) {
    return { cleanText: replyText.trim(), lead: null };
  }

  const cleanText = replyText.replace(LEAD_MARKER_RE, '').trim();

  try {
    const parsed = JSON.parse(match[1]);
    const name = String(parsed.name || '').trim();
    const phone = String(parsed.phone || '').trim().replace(/[\s.-]/g, '');
    const bookingDate = String(parsed.bookingDate || '').trim().slice(0, 200);
    const note = String(parsed.note || '').trim().slice(0, 500);

    if (name.length >= 2 && VN_PHONE_RE.test(phone)) {
      return { cleanText, lead: { name, phone, bookingDate, note } };
    }
  } catch (_) {
    // ignore malformed marker
  }

  return { cleanText, lead: null };
}

async function callAI({ settings, studio, history, message }) {
  const systemPrompt = buildSystemPrompt(studio, settings.salesProcess);

  const trimmedHistory = (Array.isArray(history) ? history : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  const messages = [
    { role: 'system', content: systemPrompt },
    ...trimmedHistory,
    { role: 'user', content: message }
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${settings.apiBaseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages,
        max_tokens: 500,
        temperature: 0.7
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`AI API trả về lỗi ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) {
      throw new Error('AI API không trả về nội dung hợp lệ.');
    }

    return extractLead(raw);
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { callAI, buildSystemPrompt, extractLead };
