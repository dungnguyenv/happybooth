# Rà soát SEO — 21/10/2026

Tiếp nối bản rà soát ngày 16/10. Điểm SEO on-page của Lighthouse đã đạt 100 trên site đang chạy, nên đợt này tập trung vào Core Web Vitals, ảnh chia sẻ mạng xã hội và độ dài tiêu đề.

## Đo trên site đang chạy (trước khi sửa)

Lighthouse 12.6, mô phỏng mobile, ngày 21/10/2026:

| Trang | Hiệu năng | SEO | LCP | CLS | Dung lượng tải |
| --- | --- | --- | --- | --- | --- |
| `/` | 63 | 100 | 18,1 s | 0,049 | 14 MB |
| `/portfolio.html` | 51 | 100 | 86,2 s | 0,265 | 44 MB |

Nguyên nhân chính:

- **Portfolio** tải thẳng 110 ảnh gốc 2400×3600 (1,5–2,5 MB/ảnh, tổng 156 MB), không khai báo `width`/`height`, alt giống nhau "Happy Booth portfolio".
- **Trang chủ**: thuộc tính `autoplay` buộc trình duyệt tải ngay cả 4 video (8,5 MB) khi mở trang, dù video nằm dưới màn hình đầu tiên.
- **Mọi trang**: hai script Firebase nằm trong `<head>` chặn hiển thị (Lighthouse ước tính ~1,7 s).
- Ảnh chia sẻ (`og:image`) là ảnh dọc 2400×3600, 1,5 MB. Facebook/Zalo cắt thành một dải ngang ở giữa ảnh.
- **HTTPS chưa được bắt buộc**: `http://happybooth.vn/` trả về 200 thay vì chuyển sang HTTPS (`https_enforced: false` trong cấu hình GitHub Pages).

## Đã sửa trong mã nguồn

- **Ảnh portfolio**: tạo bản WebP rộng 600 px trong `assets/images/portfolio/thumbs/` (156 MB còn 7,2 MB). Lưới ảnh dùng bản thu nhỏ, lightbox vẫn mở ảnh gốc qua `data-full`. Mỗi ảnh có `width`/`height` thật và alt tiếng Việt mô tả loại sự kiện. Alt không ghi tên cô dâu chú rể. Bốn ảnh đầu tải ngay, các ảnh còn lại tải lười.
- **Masonry** (`js/main.js`): chia cột theo kích thước khai báo ngay từ đầu, nên bước cân lại cột sau khi ảnh tải không còn phải dời ảnh. CSS cho lần hiển thị đầu tiên dùng grid cùng số cột, tránh xô lệch trước khi JS chạy.
- **Video trang chủ**: đổi thành `data-autoplay` + `preload="none"`. Video chỉ tải và phát khi cuộn tới gần, rồi dừng khi cuộn đi. Khi bật giảm chuyển động, video không tự phát.
- **Firebase**: chuyển hai script xuống cuối `<body>`, ngay trước `js/auth.js`, trên cả 10 trang. Thứ tự thực thi không đổi.
- **Ảnh chia sẻ**: thêm `assets/images/og-cover.jpg` (1200×630) cho trang chủ, Dự án, Bộ sưu tập, Khung ảnh, Bảng giá, Liên hệ. Trang NOTE GROUP dùng `jobs/note-group/facebook-cover.jpg`. Bổ sung `og:image:width/height/alt` và `twitter:card`.
- **Tiêu đề** được rút xuống ≤ 60 ký tự để không bị cắt trên Google. Bỏ "2026" vì sẽ lỗi thời. Đồng bộ `lang/vi.json`, vì i18n ghi đè `document.title` từ tệp này.

  | Trang | Tiêu đề mới |
  | --- | --- |
  | Bảng giá | Bảng giá thuê Photobooth Hà Nội từ 2.500.000đ \| Happy Booth |
  | Bộ sưu tập | Ảnh Photobooth đám cưới & sự kiện tại Hà Nội \| Happy Booth |
  | Liên hệ | Liên hệ thuê Photobooth Hà Nội: 0971 842 329 \| Happy Booth |
  | Khung ảnh | Mẫu khung ảnh Photobooth cưới & sự kiện \| Happy Booth |
  | Dự án | Dự án Photobooth sự kiện & tiệc cưới \| Happy Booth |

  Giữ nguyên tiêu đề trang chủ. Rút mô tả trang chủ từ 186 xuống 151 ký tự.
- **`baogia.html`**: bỏ `noindex` vì mâu thuẫn với `canonical` trỏ về `/price`. Trang vẫn chuyển hướng ngay sang `/price`.
- **`sitemap.xml`**: thống nhất định dạng, bỏ namespace không dùng, bỏ `changefreq`/`priority` (Google không dùng hai trường này). Cập nhật `lastmod` vì toàn bộ URL canonical đã chuyển sang dạng không có `.html`.

## Kết quả sau khi sửa

Lighthouse chạy trên máy local, cùng cấu hình mô phỏng mobile. Đây là số so sánh trước/sau trên cùng môi trường, không thay cho dữ liệu người dùng thật:

| Trang | Hiệu năng | LCP | CLS | Dung lượng tải |
| --- | --- | --- | --- | --- |
| Trang chủ, trước | 73 | 7,1 s | 0,057 | 14,3 MB |
| Trang chủ, sau | 74 | 8,9 s | 0,045 | 5,9 MB |
| Portfolio, trước | 73 | 254,5 s | 0 | 43,9 MB |
| Portfolio, sau | 84 | 4,4 s | 0 | 2,3 MB |

LCP trang chủ là dòng chữ H1. Thời điểm hiển thị đo thực là 305 ms, trùng với FCP. Con số 7–9 s là ước tính mô phỏng: Lighthouse coi ~18 ảnh "tường ảnh" tải cùng lúc là phụ thuộc của LCP. Muốn giảm tiếp, xem mục WebP bên dưới.

Đã kiểm tra bằng Playwright:

- Không tải `.mp4` khi mở trang. Video phát khi cuộn tới và dừng khi cuộn đi.
- Firebase và `auth` vẫn hoạt động trên trang chủ và trang đăng nhập.
- Khi chuyển trang kiểu SPA, title, canonical, `og:image` và `twitter:card` được thay đúng.
- Portfolio chia 4 cột trên desktop và 2 cột trên mobile, CLS < 0,03. Trang chỉ tải ảnh thu nhỏ, lightbox mở ảnh gốc. Nút "Xem thêm" mở thêm 30 ảnh.
- Không có lỗi JavaScript.

## Việc cần chủ website thực hiện

1. **Bật "Enforce HTTPS"**: GitHub → repo `happybooth` → Settings → Pages. Chứng chỉ đã được cấp cho `happybooth.vn` và `www`, chỉ cần tích ô này.
2. **Google Search Console**: xác minh quyền sở hữu `happybooth.vn`, ưu tiên bản ghi DNS TXT cho cả domain. Sau đó gửi `https://happybooth.vn/sitemap.xml`. Sau khi triển khai nhánh URL sạch, dùng URL Inspection kiểm tra:

   | URL | Canonical dự kiến |
   | --- | --- |
   | `/`, `/index.html` | `https://happybooth.vn/` |
   | `/price`, `/price.html`, `/baogia` | `https://happybooth.vn/price` |
   | `/portfolio`, `/portfolio.html` | `https://happybooth.vn/portfolio` |
   | `/about`, `/frame`, `/contact` và bản `.html` | URL không có `.html` |
   | `/du-an-20-10`, `/du-an-note-group` | URL không có `.html` |

3. **Google Business Profile**: với từ khoá "thuê photobooth hà nội", khối bản đồ (local pack) đứng trên kết quả web. Đăng ký hồ sơ doanh nghiệp theo dạng phục vụ tại nhà khách hàng (service-area business), khai báo khu vực phục vụ trùng với `areaServed`, rồi mời khách cũ để lại đánh giá.
4. **Kiểm tra ảnh chia sẻ** bằng [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/): bấm "Scrape Again" cho từng URL để Facebook xoá bộ nhớ đệm ảnh cũ.

## Đề xuất tiếp theo (chưa làm)

- **WebP cho "tường ảnh" trang chủ**: đổi `highlights/p*`, `l*`, `s*.jpg` sang WebP giảm từ 4,7 MB xuống 1,9 MB (đã thử với `cwebp -q 75`). Ảnh poster video (615 KB) cũng nên đổi.
- **H1 chứa từ khoá**: H1 hiện tại là "Bảng giá", "Bộ sưu tập", "Mẫu khung ảnh", "Liên hệ đặt lịch". Gợi ý: "Bảng giá thuê photobooth", "Ảnh photobooth thực tế", "Mẫu khung ảnh photobooth". H1 trang chủ là thông điệp thương hiệu, không có từ "photobooth". Có thể đưa từ khoá vào dòng phụ phía trên H1.
- **Trang dịch vụ riêng**: "Photobooth đám cưới Hà Nội", "Photobooth sự kiện doanh nghiệp", "Mirror booth & 360 booth". Mỗi trang có nội dung, ảnh và bảng giá riêng. Hiện các từ khoá này dồn vào trang chủ.
- **Tiếp tục đăng bài dự án** như 20/10 và NOTE GROUP. Đây là nội dung mới, thật và có ảnh, nên Google đánh giá cao.
- `FAQPage` JSON-LD vẫn nên giữ, nhưng từ 2023 Google chỉ hiện kết quả FAQ mở rộng cho website chính phủ và y tế. Đừng kỳ vọng nhóm câu hỏi này xuất hiện trên trang kết quả.

## Khi thêm ảnh vào portfolio

Tạo ảnh thu nhỏ cùng tên trong `thumbs/`:

```sh
cwebp -q 72 -resize 600 0 -metadata none assets/images/portfolio/111.jpg -o assets/images/portfolio/thumbs/111.webp
```

Lấy kích thước bằng `sips -g pixelWidth -g pixelHeight` và khai báo vào thẻ ảnh:

```html
<div class="gallery__item fade-in" data-full="assets/images/portfolio/111.jpg"><img src="assets/images/portfolio/thumbs/111.webp" width="600" height="900" alt="Ảnh in photobooth …" loading="lazy" decoding="async"></div>
```
