require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const { loadSettings, saveSettings } = require('./lib/settings');
const { listLeads, saveLead } = require('./lib/leads');
const { callAI } = require('./lib/ai');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const STUDIO = {
  name: 'LE HIEP STUDIO',
  tagline: 'Chụp Ảnh Nghệ Thuật Hà Nội',
  phone: process.env.STUDIO_PHONE || '0987595212',
  zaloUrl: process.env.STUDIO_ZALO_URL || 'https://zalo.me/0987595212',
  facebookUrl: process.env.STUDIO_FACEBOOK_URL || 'https://www.facebook.com/le.hiep.7545',
  followers: '51K',
  location: 'Hà Nội',
  pillars: [
    { key: 'concept', name: 'Ý tưởng & Concept', desc: 'Mỗi bộ ảnh được xây dựng như một câu chuyện riêng — từ trang phục, đạo cụ đến bối cảnh.' },
    { key: 'di-san', name: 'Bối cảnh & Di sản', desc: 'Khai thác vẻ đẹp kiến trúc cổ, thiên nhiên và văn hoá truyền thống quanh Hà Nội.' },
    { key: 'anh-sang', name: 'Ánh sáng tự nhiên', desc: 'Tận dụng ánh sáng vàng, khoảnh khắc hoàng hôn để tạo chiều sâu và cảm xúc cho khung hình.' },
    { key: 'hau-ky', name: 'Hậu kỳ điện ảnh', desc: 'Màu sắc và hậu kỳ được chăm chút tỉ mỉ, mang dấu ấn riêng, giàu chất điện ảnh.' }
  ],
  inquiryOptions: [
    'Chân dung nghệ thuật',
    'Concept cổ trang / áo dài',
    'Ngoại cảnh thiên nhiên',
    'Theo ý tưởng riêng'
  ],
  portfolio: [
    { file: '01.jpg', caption: 'Sen & ánh sáng' },
    { file: '02.jpg', caption: 'Cổ trang Việt' },
    { file: '03.jpg', caption: 'Mùa hoa phượng' },
    { file: '04.jpg', caption: 'Chân dung sen' },
    { file: '05.jpg', caption: 'Góc nhìn từ trên cao' },
    { file: '06.jpg', caption: 'Cổng chùa cổ kính' },
    { file: '07.jpg', caption: 'Vườn hoa rực rỡ' },
    { file: '08.jpg', caption: 'Tháp cổ hoàng hôn' }
  ]
};

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);
app.locals.assetVersion = Date.now();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'"]
    }
  }
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: IS_PROD ? '7d' : 0,
  etag: true
}));

app.use(session({
  name: 'lhs.sid',
  secret: process.env.SESSION_SECRET || 'change-me-in-env-please',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    maxAge: 8 * 60 * 60 * 1000
  }
}));

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Bạn gửi hơi nhiều, vui lòng thử lại sau ít phút.' }
});

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Bạn chat hơi nhiều, vui lòng thử lại sau ít phút hoặc nhắn Zalo trực tiếp.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Đăng nhập sai quá nhiều lần, vui lòng thử lại sau ít phút.'
});

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

function notifyNewLead(lead) {
  if (!transporter || !process.env.NOTIFY_EMAIL) return;
  transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.NOTIFY_EMAIL,
    subject: `[LE HIEP STUDIO] Khách mới: ${lead.name}`,
    text: `Tên: ${lead.name}\nSĐT/Zalo: ${lead.phone}\nNguồn: ${lead.source}\nDịch vụ/ghi chú: ${lead.note || lead.service || ''}\nNgày hẹn: ${lead.bookingDate || 'chưa chốt'}\nThời gian: ${lead.createdAt}`
  }).catch((err) => console.error('Send mail error:', err.message));
}

const VN_PHONE_RE = /^(0|\+84)(\d){9,10}$/;

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.redirect('/admin/login');
}

// ---------- Public routes ----------

app.get('/', (req, res) => {
  const settings = loadSettings();
  res.render('index', { studio: STUDIO, aiChatEnabled: settings.aiEnabled && !!settings.apiKey });
});

app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, phone, service, message, website } = req.body;

  if (website) {
    return res.json({ ok: true });
  }

  const cleanName = (name || '').trim();
  const cleanPhone = (phone || '').trim().replace(/[\s.-]/g, '');

  if (cleanName.length < 2) {
    return res.status(400).json({ ok: false, error: 'Vui lòng nhập tên của bạn.' });
  }
  if (!VN_PHONE_RE.test(cleanPhone)) {
    return res.status(400).json({ ok: false, error: 'Số điện thoại/Zalo không hợp lệ.' });
  }

  const lead = {
    name: cleanName,
    phone: cleanPhone,
    service: service || 'Chưa chọn',
    message: (message || '').trim().slice(0, 1000),
    source: 'form',
    createdAt: new Date().toISOString()
  };

  try {
    saveLead(lead);
    notifyNewLead(lead);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Save lead error:', err);
    return res.status(500).json({ ok: false, error: 'Có lỗi xảy ra, vui lòng thử lại hoặc nhắn Zalo trực tiếp.' });
  }
});

app.post('/api/chat', chatLimiter, async (req, res) => {
  const settings = loadSettings();

  if (!settings.aiEnabled || !settings.apiKey) {
    return res.json({
      ok: true,
      reply: `Hiện trợ lý AI đang tạm nghỉ. Bạn nhắn trực tiếp Zalo ${STUDIO.phone} để được tư vấn nhanh nhất nhé!`
    });
  }

  const message = String(req.body.message || '').trim().slice(0, 1000);
  const history = Array.isArray(req.body.history) ? req.body.history.slice(-20) : [];

  if (!message) {
    return res.status(400).json({ ok: false, error: 'Vui lòng nhập nội dung.' });
  }

  try {
    const { cleanText, lead } = await callAI({ settings, studio: STUDIO, history, message });

    if (lead) {
      const fullLead = {
        name: lead.name,
        phone: lead.phone,
        bookingDate: lead.bookingDate || '',
        note: lead.note || '',
        service: 'Tư vấn qua AI chat',
        source: 'ai-chat',
        createdAt: new Date().toISOString()
      };
      saveLead(fullLead);
      notifyNewLead(fullLead);
    }

    return res.json({ ok: true, reply: cleanText, leadSaved: !!lead });
  } catch (err) {
    console.error('AI chat error:', err.message);
    return res.status(502).json({
      ok: false,
      error: `Trợ lý AI đang gặp sự cố. Bạn nhắn trực tiếp Zalo ${STUDIO.phone} giúp mình nhé!`
    });
  }
});

// ---------- Admin routes ----------

app.get('/admin/login', (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin');
  res.render('admin/login', { studio: STUDIO, error: null });
});

app.post('/admin/login', loginLimiter, (req, res) => {
  const configured = process.env.ADMIN_PASSWORD;

  if (!configured) {
    return res.status(500).render('admin/login', {
      studio: STUDIO,
      error: 'Chưa cấu hình ADMIN_PASSWORD trong file .env trên server. Vui lòng thêm biến này rồi khởi động lại ứng dụng.'
    });
  }

  if (req.body.password === configured) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }

  return res.status(401).render('admin/login', { studio: STUDIO, error: 'Sai mật khẩu, vui lòng thử lại.' });
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

app.get('/admin', requireAdmin, (req, res) => {
  const settings = loadSettings();
  const leads = listLeads().slice().reverse();
  res.render('admin/dashboard', {
    studio: STUDIO,
    settings: { ...settings, apiKey: settings.apiKey ? '••••••••' : '' },
    hasApiKey: !!settings.apiKey,
    leads,
    saved: req.query.saved === '1'
  });
});

app.post('/admin/settings', requireAdmin, (req, res) => {
  const current = loadSettings();
  const { aiEnabled, apiBaseUrl, apiKey, model, salesProcess } = req.body;

  saveSettings({
    aiEnabled: aiEnabled === 'on',
    apiBaseUrl: (apiBaseUrl || '').trim() || current.apiBaseUrl,
    apiKey: apiKey && apiKey.trim() ? apiKey.trim() : current.apiKey,
    model: (model || '').trim() || current.model,
    salesProcess: salesProcess !== undefined ? salesProcess : current.salesProcess
  });

  res.redirect('/admin?saved=1');
});

app.post('/admin/api/chat-test', requireAdmin, chatLimiter, async (req, res) => {
  const settings = loadSettings();

  if (!settings.apiKey) {
    return res.status(400).json({ ok: false, error: 'Chưa nhập API key.' });
  }

  const message = String(req.body.message || '').trim().slice(0, 1000);
  const history = Array.isArray(req.body.history) ? req.body.history.slice(-20) : [];

  if (!message) {
    return res.status(400).json({ ok: false, error: 'Vui lòng nhập nội dung.' });
  }

  try {
    const { cleanText, lead } = await callAI({ settings, studio: STUDIO, history, message });
    return res.json({ ok: true, reply: cleanText, wouldSaveLead: lead });
  } catch (err) {
    console.error('AI test chat error:', err.message);
    return res.status(502).json({ ok: false, error: err.message });
  }
});

app.use((req, res) => {
  res.status(404).render('404', { studio: STUDIO });
});

app.listen(PORT, () => {
  console.log(`LE HIEP STUDIO website dang chay tai http://localhost:${PORT}`);
});
