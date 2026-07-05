require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

const STUDIO = {
  name: 'LE HIEP STUDIO',
  tagline: 'Chụp Ảnh Nghệ Thuật Hà Nội',
  phone: process.env.STUDIO_PHONE || '0987595212',
  zaloUrl: process.env.STUDIO_ZALO_URL || 'https://zalo.me/0987595212',
  facebookUrl: process.env.STUDIO_FACEBOOK_URL || 'https://www.facebook.com/le.hiep.7545',
  followers: '51K',
  location: 'Hà Nội',
  services: [
    { key: 'cuoi-hoi', name: 'Chụp Cưới Hỏi', desc: 'Lưu giữ trọn vẹn khoảnh khắc ngày trọng đại với phong cách nghệ thuật, chân thực và giàu cảm xúc.' },
    { key: 'hieu-hy', name: 'Chụp Hiếu Hỷ', desc: 'Ghi lại những dịp trọng đại của gia đình một cách trang trọng, tinh tế và đầy ý nghĩa.' },
    { key: 'sinh-nhat', name: 'Chụp Sinh Nhật', desc: 'Bộ ảnh sinh nhật sống động, đầy màu sắc, lưu giữ niềm vui của bé và gia đình.' },
    { key: 'gia-dinh', name: 'Chụp Gia Đình Tại Nhà', desc: 'Không gian quen thuộc, khoảnh khắc tự nhiên — dịch vụ chụp ảnh gia đình ngay tại nhà bạn.' }
  ],
  portfolio: [
    { seed: 'lehiep-01', category: 'Cưới hỏi' },
    { seed: 'lehiep-02', category: 'Gia đình' },
    { seed: 'lehiep-03', category: 'Chân dung' },
    { seed: 'lehiep-04', category: 'Sinh nhật' },
    { seed: 'lehiep-05', category: 'Cưới hỏi' },
    { seed: 'lehiep-06', category: 'Gia đình' },
    { seed: 'lehiep-07', category: 'Chân dung' },
    { seed: 'lehiep-08', category: 'Hiếu hỷ' }
  ]
};

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.locals.assetVersion = Date.now();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://picsum.photos', 'https://fastly.picsum.photos'],
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
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  etag: true
}));

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Bạn gửi hơi nhiều, vui lòng thử lại sau ít phút.' }
});

const LEADS_FILE = path.join(__dirname, 'data', 'leads.json');
function saveLead(lead) {
  fs.mkdirSync(path.dirname(LEADS_FILE), { recursive: true });
  let leads = [];
  if (fs.existsSync(LEADS_FILE)) {
    try { leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8')); } catch (_) { leads = []; }
  }
  leads.push(lead);
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
}

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

const VN_PHONE_RE = /^(0|\+84)(\d){9,10}$/;

app.get('/', (req, res) => {
  res.render('index', { studio: STUDIO });
});

app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, phone, service, message, website } = req.body;

  // honeypot: bot da dien vao truong an
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
    createdAt: new Date().toISOString()
  };

  try {
    saveLead(lead);

    if (transporter && process.env.NOTIFY_EMAIL) {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.NOTIFY_EMAIL,
        subject: `[LE HIEP STUDIO] Khách mới: ${lead.name}`,
        text: `Tên: ${lead.name}\nSĐT/Zalo: ${lead.phone}\nDịch vụ: ${lead.service}\nLời nhắn: ${lead.message}\nThời gian: ${lead.createdAt}`
      }).catch((err) => console.error('Send mail error:', err.message));
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('Save lead error:', err);
    return res.status(500).json({ ok: false, error: 'Có lỗi xảy ra, vui lòng thử lại hoặc nhắn Zalo trực tiếp.' });
  }
});

app.use((req, res) => {
  res.status(404).render('404', { studio: STUDIO });
});

app.listen(PORT, () => {
  console.log(`LE HIEP STUDIO website dang chay tai http://localhost:${PORT}`);
});
