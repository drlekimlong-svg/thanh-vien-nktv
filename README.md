# Thành viên NKTV · CLB Ngoại khoa Trưng Vương

Webapp nội bộ của CLB Ngoại Khoa Trưng Vương - Trường ĐH Y Khoa Phạm Ngọc Thạch: quản lý thành viên, điểm danh bằng mã QR, lịch sinh hoạt và thông báo, hồ sơ năng lực, post-test hằng tuần, xin nghỉ và vắng có phép.

Kho này chỉ chứa giao diện và lược đồ cơ sở dữ liệu. Danh sách thành viên, điểm danh, điểm số nằm trong Supabase, được bảo vệ bằng quy tắc theo từng dòng dữ liệu; không có dữ liệu cá nhân nào trong kho.

## Ai làm được gì

| Vai trò | Quyền |
|---|---|
| Không đăng nhập, quét mã trên thẻ | Thẻ của đúng người đó: họ tên, Generation, nhà, cấp, tình trạng |
| Thành viên | Lịch, thông báo, xin nghỉ, làm post-test, hồ sơ và chuyên cần của chính mình |
| Ban cố vấn | Thêm danh sách có tên: hiện diện, chuyên cần; chỉ xem |
| Phụ trách điểm danh | Thêm tạo buổi, quét mã, ghi tay, duyệt đơn xin nghỉ |
| Quản trị | Thêm thành viên, vai trò, kích hoạt, thông báo, post-test, xác nhận năng lực |

## Đăng nhập

Thành viên không cần email. Ban nhân sự cấp mã kích hoạt trong app (dùng một lần, hết hạn sau 30 ngày); thành viên nhập mã thành viên và mã kích hoạt, tự đặt mật khẩu. Quên mật khẩu thì xin mã mới và làm lại đúng bước đó.

## Post-test

Quản trị tải đề PDF có chữ (dạng “Câu 1.” và “A. … B. …”) hoặc dán chữ, xem lại từng câu, chọn đáp án rồi đăng. Đáp án nằm ở bảng riêng và không gửi về máy người làm bài trước khi được phép xem. Máy chủ giữ đồng hồ và chấm điểm. Bài được lưu tự động; hết giờ, bài tự gửi.

## Các tệp

| Đường dẫn | Nội dung |
|---|---|
| `index.html`, `css/`, `js/` | Giao diện, không cần bước build |
| `js/api.js` | Gọi Supabase |
| `js/demo.js` | Bản chạy thử với dữ liệu giả, chỉ bật trên máy (`localhost`, thêm `?demo=admin`, `?demo=diem` hoặc `?demo=tv`) |
| `config.js` | Địa chỉ dự án và khóa công khai của Supabase |
| `lib/` | qrcode-generator của Kazuhiko Arase (MIT), jsQR của Cosmo Wolfe (Apache-2.0, tệp `LICENSE-jsQR.txt`) |
| `supabase/migrations/` | Lược đồ, quyền, các hàm phía máy chủ |
| `supabase/functions/kich-hoat/` | Hàm kích hoạt tài khoản |
| `tools/nhap_thanh_vien.py` | Tạo lệnh SQL nhập danh sách từ CSV; tệp SQL tạo ra chứa họ tên nên không đưa lên kho |

## Chạy thử trên máy

```bash
python -m http.server 8765
```

Mở `http://localhost:8765/?demo=admin`.
