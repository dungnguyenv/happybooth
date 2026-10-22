# Rà soát SEO — 22/10/2026: AI Overview của Google

Mục tiêu: Happy Booth được Google trích dẫn trong phần "Thông tin tổng quan do AI tạo" (AI Overview) khi tìm "thuê photobooth sự kiện hà nội".

## Google chọn nguồn cho AI Overview thế nào

Theo [hướng dẫn của Google](https://developers.google.com/search/docs/appearance/ai-features):

- Không có yêu cầu riêng hay cách đăng ký. Trang chỉ cần **được lập chỉ mục và được phép hiện đoạn trích (snippet)**.
- Không cần schema hay tệp riêng cho AI. Dữ liệu có cấu trúc phải khớp với nội dung hiển thị trên trang.
- AI Overview dùng **"query fan-out"**: tách câu tìm kiếm thành nhiều câu nhỏ, rồi lấy từng ý từ những trang đang xếp hạng tốt cho câu nhỏ đó.
- Google khuyên cập nhật Google Business Profile.

Câu trả lời hiện tại cho "thuê photobooth sự kiện hà nội" có ba ý: các loại booth kèm giá 4 giờ, gói thuê gồm những gì, và lưu ý khi đặt lịch. Trước đợt này, website có dữ liệu cho cả ba ý nhưng không có câu trả lời ngắn để Google trích.

## Đã kiểm tra

- HTTPS đã được bắt buộc. `http://` và `www` chuyển 301 về `https://happybooth.vn/`. `robots.txt` không chặn trang công khai nào, không có `nosnippet`. Kỹ thuật không phải rào cản.
- Chưa kiểm tra được thứ hạng thật trên Google Việt Nam. Đây là yếu tố quyết định nhất, xem mục "Việc cần chủ website thực hiện".
- **Nội dung tự mâu thuẫn:** trang Bảng giá ghi mọi gói đã gồm "giấy ảnh không giới hạn", trong khi gói theo ngày tính giấy in 3.500đ/ảnh.
- **Trùng tên:** Công ty TNHH Happy Booth Vietnam ở TP.HCM cũng làm photobooth sự kiện. Nên dùng thống nhất tên "Happy Booth Hà Nội" để Google không nhầm hai doanh nghiệp.

## Đã sửa trong mã nguồn

- **Trang mới [`/thue-photobooth-su-kien-ha-noi`](https://happybooth.vn/thue-photobooth-su-kien-ha-noi)**, viết theo đúng ba ý AI Overview đang trả lời:
  - Các loại booth, bảng giá theo thời lượng (có giá 4 giờ), gói thuê gồm những gì
  - Địa điểm cần chuẩn bị gì, lưu ý khi đặt lịch, sự kiện đã làm (20/10, NOTE GROUP)
  - Khung "Thông tin nhanh" và 6 câu hỏi thường gặp
  - JSON-LD `Service` (kèm giá từng gói), `FAQPage`, `BreadcrumbList`
- Thân trang chỉ có tiếng Việt, giống trang 20/10. Header, footer và tiêu đề vẫn có bản tiếng Anh.
- **Trang Bảng giá:**
  - Sửa câu "giấy ảnh không giới hạn" thành "các gói theo giờ in ảnh không giới hạn", ghi rõ gói theo ngày tính giấy 3.500đ/ảnh
  - Thêm giá 4 giờ, phí đi ngoại thành và yêu cầu mặt bằng
  - Thêm 5 câu hỏi thường gặp về giá, JSON-LD `Service` và `FAQPage`
- **Liên kết nội bộ:** từ đoạn giới thiệu trang chủ và trang Bảng giá tới trang mới. Đã thêm trang mới vào `sitemap.xml` và router.

Số liệu mới do chủ website cung cấp ngày 22/10/2026:

| Mục | Giá trị |
| --- | --- |
| Mặt bằng | khoảng 3 m² |
| Nguồn điện | 1000W |
| Lắp đặt | 30 phút |
| Thuê 4 giờ | 6.500.000đ (Happy 2 + 1 giờ, Booth 16'') · 7.000.000đ (Premium 2 + 1 giờ, Booth 24'') |
| Đặt cọc | chỉ khi rơi vào ngày quan trọng (trên web ghi "ngày cao điểm như ngày lễ hoặc ngày đẹp nhiều tiệc cưới") |
| Phí đi ngoại thành | từ 15.000đ/km |

Giữ nguyên theo yêu cầu: mirror booth, 360 video booth, audio guestbook và mức "đến 15.000.000đ" chưa có gói giá cụ thể.

## Việc cần chủ website thực hiện

Ba việc này ảnh hưởng nhiều hơn mọi thay đổi trong mã nguồn:

1. **Google Search Console**:
   - Kiểm tra `https://happybooth.vn/thue-photobooth-su-kien-ha-noi` và `/price` bằng URL Inspection, rồi bấm "Yêu cầu lập chỉ mục".
   - Gửi lại `sitemap.xml`.
   - Theo dõi vị trí của từ khoá "thuê photobooth sự kiện hà nội", "giá thuê photobooth hà nội" và "thuê photobooth 4 giờ" trong mục Hiệu suất. Trang nằm ngoài top 10–20 thì gần như không được AI Overview chọn.
2. **Google Business Profile**:
   - Đăng ký dạng doanh nghiệp phục vụ tận nơi khách hàng, khu vực Hà Nội và các tỉnh lân cận, đúng như `areaServed`.
   - Liệt kê các gói kèm giá, đăng ảnh thật từ các sự kiện.
   - Mời khách doanh nghiệp (20/10, NOTE GROUP) để lại đánh giá.
   - Dùng đúng tên, hotline và website như trên happybooth.vn.
3. **Được nhắc tên ở trang khác:** các nguồn AI Overview đang trích thường có mặt trong bài "top đơn vị cho thuê photobooth Hà Nội", trên danh bạ doanh nghiệp và trên website của đơn vị tổ chức sự kiện. Nhờ đối tác và khách doanh nghiệp ghi tên "Happy Booth Hà Nội" và dẫn link về happybooth.vn.

Sau 3–4 tuần, tìm lại các từ khoá trên ở chế độ ẩn danh để xem Happy Booth đã được trích chưa. Google cần thời gian thu thập lại dữ liệu, và không cách nào đảm bảo chắc chắn được chọn.

## Khi thêm thông tin dịch vụ

Câu hỏi thường gặp trên trang mới và trang Bảng giá được khai báo hai lần: một lần trong `<details>` hiển thị, một lần trong JSON-LD `FAQPage` ở `<head>`. Sửa câu trả lời thì sửa cả hai chỗ, vì Google yêu cầu dữ liệu có cấu trúc khớp với nội dung trên trang. Giá trong JSON-LD `Service` cũng phải khớp với bảng giá.
