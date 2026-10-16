# Kiểm tra SEO kỹ thuật — 16/10/2026

## Đã hoàn tất trong mã nguồn

- Nội dung mặc định của các trang là tiếng Việt trong HTML, gồm tiêu đề, đoạn giới thiệu, menu, bảng giá, nhãn biểu mẫu và gợi ý nhập liệu. Đã chuyển 545 vị trí nội dung văn bản/HTML và một placeholder; dữ liệu JSON-LD hiện có được giữ lại.
- Nội dung và các khối fade-in hiển thị khi không có JavaScript. JavaScript chỉ bật hiệu ứng khi khởi tạo được bộ quan sát cuộn.
- Nút VI/EN sử dụng hai tệp từ điển đầy đủ, không tải lại trang khi đổi ngôn ngữ. Khi tệp dịch không tải được, nội dung tiếng Việt gốc vẫn hiển thị. Bộ nhớ trình duyệt bị chặn cũng không làm trang trắng.
- Router lưu cả nội dung và metadata của từng trang. Khi chuyển trang hoặc quay lại, router thay title, description, canonical, Open Graph, Twitter Card, robots và JSON-LD. Metadata không có trên trang đích được gỡ bỏ.
- Kết quả của một yêu cầu chuyển trang cũ không được ghi đè trang người dùng vừa chọn.
- Sitemap ghi nhận ngày sửa đổi của các trang đã cập nhật.

## Kiểm tra đã chạy

- Đối chiếu nội dung HTML tĩnh với từ điển VI; kiểm tra từ điển EN, placeholder, nhãn truy cập, title và JSON-LD.
- Kiểm tra logic chuyển VI/EN, từ điển không tải được và localStorage bị chặn bằng fixture DOM trong Node.js.
- Kiểm tra metadata từ HTML thực của bảy trang công khai, điều hướng qua trang đã lưu, chuyển từ trang quản trị sang trang công khai và hai yêu cầu điều hướng kết thúc không theo thứ tự.
- Kiểm tra hồi quy thông điệp/ảnh trang chủ, album ảnh và bộ xem khung ảnh; kiểm tra cú pháp JavaScript và `git diff --check`.
- Phiên trình duyệt kiểm thử không kết nối được máy chủ local; đợt kiểm tra này sử dụng đối chiếu HTML tĩnh và kiểm thử logic, không xác nhận bằng ảnh chụp giao diện mới.

## Search Console: chưa có dữ liệu để đánh giá

Đã mở Search Console cho `https://happybooth.vn/`. Tài khoản Google hiện tại nhận thông báo không có quyền truy cập thuộc tính này. Chưa đọc được báo cáo Pages, sitemap, canonical Google chọn hoặc HTML Google đã render. Thông báo thiếu quyền không cho biết trạng thái lập chỉ mục của website.

Để kiểm tra tiếp, cần đăng nhập bằng tài khoản đã có quyền hoặc xác minh quyền sở hữu website bằng tài khoản được chủ website chọn. Chưa thêm mã xác minh, chưa thay đổi quyền và chưa gửi yêu cầu lập chỉ mục.

Sau khi có quyền và triển khai mã nguồn, kiểm tra:

| URL | Canonical dự kiến |
| --- | --- |
| `/` hoặc `/index.html` | `https://happybooth.vn/` |
| `/about.html` | `https://happybooth.vn/about.html` |
| `/du-an-note-group.html` | `https://happybooth.vn/du-an-note-group.html` |
| `/price.html` | `https://happybooth.vn/price.html` |
| `/portfolio.html` | `https://happybooth.vn/portfolio.html` |
| `/frame.html` | `https://happybooth.vn/frame.html` |
| `/contact.html` | `https://happybooth.vn/contact.html` |

Với từng URL: ghi nhận trạng thái lập chỉ mục, lần crawl, canonical khai báo/canonical Google chọn và nội dung HTML trong URL Inspection. Trang NOTE GROUP mới cần được triển khai trước khi kiểm tra URL công khai. Xem thêm báo cáo Pages và trạng thái xử lý sitemap; ghi nhận lý do cụ thể nếu một URL chưa được lập chỉ mục.

## Khi cập nhật nội dung về sau

Giữ HTML mặc định bằng tiếng Việt. Khi sửa một mục có `data-i18n`, cập nhật đồng thời HTML, `lang/vi.json` và bản dịch tương ứng trong `lang/en.json`. Thuộc tính `data-i18n-placeholder` phải giữ tên khóa; chỉ giá trị `placeholder` là nội dung hiển thị. Không dùng lớp ẩn toàn trang để chờ bản dịch.

Bản rà soát này được lập trước khi triển khai. Trạng thái phát hành được theo dõi qua lịch sử Git và GitHub Pages.
