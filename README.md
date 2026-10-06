# LE HIEP STUDIO — Website

Website cho LE HIEP STUDIO — chụp ảnh nghệ thuật Hà Nội. Xây dựng bằng Node.js (Express + EJS), phong cách dark editorial.

Facebook: https://www.facebook.com/le.hiep.7545

## 1. Chạy thử ở máy local

Yêu cầu: đã cài [Node.js](https://nodejs.org) bản >= 18.

```bash
npm install
cp .env.example .env   # rồi điền thông tin SMTP nếu muốn nhận email khi có khách để lại thông tin
npm run dev             # chạy dev, tự reload khi sửa code
# hoặc
npm start                # chạy như production
```

Mở trình duyệt tại http://localhost:3000

## 2. Thay / thêm ảnh

Ảnh hero, about và portfolio đang dùng ảnh thật từ studio, đặt tại:

```
public/images/hero.jpg           # ảnh nền hero
public/images/about.jpg          # ảnh phần Giới thiệu
public/images/portfolio/01.jpg   # 8 ảnh portfolio, đặt tên 01.jpg → 08.jpg
```

Muốn đổi ảnh portfolio hoặc thêm/bớt ảnh: sửa mảng `STUDIO.portfolio` trong `server.js` (mỗi ảnh gồm `file` và `caption`), rồi bỏ file ảnh tương ứng vào `public/images/portfolio/`.

## 3. Form liên hệ / thu thập Zalo

- Khách điền form ở mục "Liên hệ" → dữ liệu được lưu vào `data/leads.json`
- Nếu điền đủ biến môi trường `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAIL` trong `.env`, hệ thống sẽ gửi email thông báo mỗi khi có khách để lại thông tin (kể cả khi khách để lại thông tin qua AI chat)
- Nút "Nhắn Zalo" mở thẳng `https://zalo.me/0987595212`

## 4. Widget chăm sóc khách & AI tư vấn chốt đơn

Góc dưới bên phải website có nút tròn mở ra 3 lựa chọn: **Nhắn Zalo**, **Nhắn Facebook**, và **Chat với AI tư vấn** (chỉ hiện khi AI đã được bật trong trang Admin).

### Cấu hình AI (trang `/admin`)

1. Mở `.env`, đặt `ADMIN_PASSWORD` (mật khẩu đăng nhập trang quản trị) và `SESSION_SECRET` (chuỗi ngẫu nhiên bất kỳ, càng dài càng tốt — có thể tạo bằng lệnh `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
2. Truy cập `https://<domain-cua-ban>/admin`, đăng nhập bằng `ADMIN_PASSWORD`
3. Điền:
   - **API Base URL** + **API Key** + **Model**: thông tin của bất kỳ AI nào tương thích chuẩn OpenAI (OpenAI, DeepSeek, Groq, hoặc proxy sang Gemini/Claude...). API key chỉ lưu trên server (`data/settings.json`), không bao giờ gửi ra trình duyệt khách.
   - **Quy trình tư vấn & chốt lịch**: viết các bước AI cần theo khi tư vấn khách bằng ngôn ngữ tự nhiên — kể cả cách đề xuất và chốt ngày giờ hẹn theo lịch rảnh thực tế của bạn. AI sẽ bám theo quy trình này.
4. Dùng khung **"Thử trò chuyện trước khi dùng thật"** ngay trong trang Admin để đóng vai khách, kiểm tra AI trả lời/chốt lịch đúng ý chưa — cuộc trò chuyện thử này không bị lưu vào danh sách khách thật.
5. Tick **"Bật trợ lý AI trên website"** rồi **Lưu cài đặt** khi đã ưng ý.

Khi khách chat thật trên website và cung cấp đủ họ tên + số điện thoại/Zalo, AI tự động lưu thông tin (kèm ngày hẹn đã chốt và ghi chú nhu cầu) vào danh sách khách — xem ngay trong trang Admin ở mục **"Khách hàng"**.

### Lưu ý về chi phí & bảo mật
- Mỗi tin nhắn AI trả lời sẽ tốn phí theo nhà cung cấp AI bạn chọn (tính theo token) — nên theo dõi usage trên tài khoản AI của bạn.
- Trang `/admin` có giới hạn số lần đăng nhập sai (chống dò mật khẩu) và mật khẩu không bao giờ lưu trong code hay Git.
- Nếu nghi ngờ API key bị lộ, vào `/admin` nhập key mới và **Lưu cài đặt** — key cũ sẽ bị thay thế ngay.

## 6. Đưa code lên GitHub

```bash
git remote add origin https://github.com/<ten-tai-khoan>/le-hiep-studio.git
git branch -M main
git push -u origin main
```

(Repo Git đã được khởi tạo sẵn và có commit đầu tiên — chỉ cần tạo repo trống trên GitHub rồi nối remote như trên.)

## 7. Deploy lên Hostinger (gói Business — hỗ trợ Node.js)

Gói Business của Hostinger có mục **Node.js App** trong hPanel, hỗ trợ deploy trực tiếp từ GitHub.

1. Đăng nhập **hPanel** → **Websites** → chọn domain → **Advanced** → **Node.js**
2. Bấm **Create Application**:
   - **Node.js version**: chọn 18.x trở lên
   - **Application root**: thư mục chứa code (ví dụ `le-hiep-studio`)
   - **Application URL**: domain hoặc subdomain của studio
   - **Application startup file**: `server.js`
3. Sau khi tạo, vào tab **Git** của ứng dụng Node.js đó:
   - Nhập URL repo GitHub vừa tạo ở bước 4 (nếu repo private cần cấp quyền/deploy key theo hướng dẫn của Hostinger)
   - Chọn nhánh `main`
   - Bấm **Create** rồi **Deploy** để Hostinger tự `git pull` code về
4. Vào phần **Environment variables** của ứng dụng Node.js, khai báo các biến giống file `.env` (SMTP_HOST, SMTP_USER, SMTP_PASS, NOTIFY_EMAIL, STUDIO_PHONE, STUDIO_ZALO_URL, STUDIO_FACEBOOK_URL, `ADMIN_PASSWORD`, `SESSION_SECRET`, và `NODE_ENV=production`) — **bắt buộc** phải đặt `ADMIN_PASSWORD` và `SESSION_SECRET` trước khi website lên mạng thật, nếu không trang `/admin` sẽ từ chối truy cập
5. Bấm **NPM Install** (hoặc SSH vào chạy `npm install`) rồi **Restart Application**
6. Vào **SSL** trong hPanel, bật SSL miễn phí cho domain (gói Business có sẵn)
7. Mỗi lần cập nhật code: push lên GitHub → vào lại tab Git của ứng dụng → bấm **Pull/Deploy** → **Restart Application**

### Lưu ý
- File `data/leads.json` và `data/settings.json` lưu trực tiếp trên server — nên tải về sao lưu định kỳ (hoặc nâng cấp qua email/CRM khi lượng khách tăng)
- Vì static assets được gắn `?v=` theo thời điểm khởi động server, mỗi lần **Restart Application** sau khi deploy, CSS/JS mới sẽ tự động được tải lại cho khách — không cần khách xoá cache trình duyệt

## Cấu trúc thư mục

```
le-hiep-studio/
├── server.js              # Express server, routes trang chủ + contact + chat + admin
├── lib/
│   ├── ai.js               # Gọi API AI, tạo system prompt, trích xuất lead từ hội thoại
│   ├── leads.js             # Đọc/ghi data/leads.json
│   └── settings.js          # Đọc/ghi data/settings.json (cấu hình AI)
├── views/                 # Giao diện EJS
│   ├── index.ejs
│   ├── 404.ejs
│   ├── partials/
│   └── admin/
│       ├── login.ejs
│       └── dashboard.ejs
├── public/
│   ├── css/style.css
│   ├── js/main.js
│   ├── js/theme-init.js    # chống nhấp nháy khi tải trang do chế độ sáng/tối
│   ├── js/chat-widget.js   # widget Zalo/Facebook/AI chat phía khách
│   ├── js/admin.js         # khung chat thử trong trang Admin
│   └── images/
├── data/
│   ├── leads.json           # Danh sách khách để lại thông tin (tự tạo khi có người gửi form/chat)
│   └── settings.json        # Cấu hình AI (tự tạo khi lưu trong trang Admin)
└── .env.example
```
