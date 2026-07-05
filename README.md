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

## 2. Thay ảnh thật thay cho ảnh minh hoạ

Hiện tại toàn bộ ảnh (hero, about, portfolio) đang dùng ảnh minh hoạ từ picsum.photos để giữ dung lượng nhẹ khi bàn giao. Khi có ảnh thật:

1. Bỏ ảnh vào thư mục `public/images/` (ví dụ `public/images/portfolio/01.jpg`)
2. Mở `server.js`, sửa mảng `STUDIO.portfolio` — đổi link `https://picsum.photos/seed/...` trong `views/index.ejs` thành `/images/portfolio/01.jpg`
3. Làm tương tự cho ảnh hero (`.hero-bg`) và ảnh about (`.about-media img`)

## 3. Form liên hệ / thu thập Zalo

- Khách điền form ở mục "Liên hệ" → dữ liệu được lưu vào `data/leads.json`
- Nếu điền đủ biến môi trường `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAIL` trong `.env`, hệ thống sẽ gửi email thông báo mỗi khi có khách để lại thông tin
- Nút "Nhắn Zalo" mở thẳng `https://zalo.me/0987595212`

## 4. Đưa code lên GitHub

```bash
git remote add origin https://github.com/<ten-tai-khoan>/le-hiep-studio.git
git branch -M main
git push -u origin main
```

(Repo Git đã được khởi tạo sẵn và có commit đầu tiên — chỉ cần tạo repo trống trên GitHub rồi nối remote như trên.)

## 5. Deploy lên Hostinger (gói Business — hỗ trợ Node.js)

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
4. Vào phần **Environment variables** của ứng dụng Node.js, khai báo các biến giống file `.env` (SMTP_HOST, SMTP_USER, SMTP_PASS, NOTIFY_EMAIL, STUDIO_PHONE, STUDIO_ZALO_URL, STUDIO_FACEBOOK_URL, và `NODE_ENV=production`)
5. Bấm **NPM Install** (hoặc SSH vào chạy `npm install`) rồi **Restart Application**
6. Vào **SSL** trong hPanel, bật SSL miễn phí cho domain (gói Business có sẵn)
7. Mỗi lần cập nhật code: push lên GitHub → vào lại tab Git của ứng dụng → bấm **Pull/Deploy** → **Restart Application**

### Lưu ý
- File `data/leads.json` lưu trực tiếp trên server — nên tải về sao lưu định kỳ (hoặc nâng cấp qua email/CRM khi lượng khách tăng)
- Vì static assets được gắn `?v=` theo thời điểm khởi động server, mỗi lần **Restart Application** sau khi deploy, CSS/JS mới sẽ tự động được tải lại cho khách — không cần khách xoá cache trình duyệt

## Cấu trúc thư mục

```
le-hiep-studio/
├── server.js              # Express server, route trang chủ + API contact
├── views/                 # Giao diện EJS
│   ├── index.ejs
│   ├── 404.ejs
│   └── partials/
├── public/
│   ├── css/style.css
│   └── js/main.js
├── data/leads.json         # Danh sách khách để lại thông tin (tự tạo khi có người gửi form)
└── .env.example
```
