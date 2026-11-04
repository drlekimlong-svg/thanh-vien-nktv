# Thành viên NKTV · CLB Ngoại khoa Trưng Vương

Webapp nội bộ của CLB Ngoại Khoa Trưng Vương - Trường ĐH Y Khoa Phạm Ngọc Thạch: quản lý thành viên, điểm danh bằng mã QR, lịch sinh hoạt và thông báo, hồ sơ năng lực, post-test hằng tuần, xin nghỉ và vắng có phép.

Kho này chỉ chứa giao diện và lược đồ cơ sở dữ liệu. Danh sách thành viên, điểm danh, điểm số nằm trong Supabase, được bảo vệ bằng quy tắc theo từng dòng dữ liệu; không có dữ liệu cá nhân nào trong kho.

## Ai làm được gì

| Vai trò | Quyền |
|---|---|
| Không đăng nhập, quét mã trên thẻ | Thẻ của đúng người đó: họ tên, Generation, nhà, cấp, tình trạng |
| Senior, Junior | Lịch, kho lịch, điểm nhóm, thông báo, xin nghỉ, làm post-test, hồ sơ và chuyên cần của chính mình |
| Nhóm trưởng, nhóm phó | Thêm soạn và gửi lịch cho nhà mình |
| Phụ trách điểm danh | Thêm danh sách có tên, tạo buổi, quét mã, ghi tay, duyệt đơn xin nghỉ, soạn lịch cho mọi nhà |
| Ban cố vấn | Gần đủ quyền quản trị: thêm thông báo, post-test, xác nhận năng lực; không phân quyền, không sửa danh sách, không cấp mã |
| Quản trị | Toàn quyền, kể cả phân quyền, sửa danh sách thành viên, cấp mã kích hoạt |

Quản trị phân quyền ở **Quản lý → Phân quyền** cho tài khoản đã kích hoạt. Cấp (Junior, Senior, Ban cố vấn) và chức vụ trong nhà (nhóm trưởng, nhóm phó) là hai ô riêng. App luôn giữ ít nhất một quản trị đã kích hoạt.

## Đăng nhập

Thành viên không cần email. Ban nhân sự cấp mã kích hoạt trong app (dùng một lần, hết hạn sau 30 ngày); thành viên nhập mã thành viên và mã kích hoạt, tự đặt mật khẩu. Quên mật khẩu thì xin mã mới và làm lại đúng bước đó.

## Soạn lịch sinh hoạt

Nhóm trưởng, nhóm phó soạn lịch tuần hoặc chương trình đặc biệt cho nhà mình, xem trước ảnh theo mascot nhóm trực, tải PNG hoặc Excel. Bản nháp tự lưu và nhóm trưởng, nhóm phó cùng nhà soạn tiếp được. Khi gửi, lịch vào kho, tạo buổi ở tab Lịch để điểm danh và đăng một thông báo. Ảnh không lưu thành tệp: dữ liệu được giữ nguyên nên vẽ lại được bất cứ lúc nào.

`js/lich-ve.js` là bộ vẽ ảnh trích nguyên văn từ app soạn lịch cũ bằng `tools/tao_lich_ve.py`, không sửa tay.

## Post-test

Quản trị tải đề PDF có chữ (dạng “Câu 1.” và “A. … B. …”) hoặc dán chữ, xem lại từng câu, chọn đáp án rồi đăng. Đáp án nằm ở bảng riêng và không gửi về máy người làm bài trước khi được phép xem. Máy chủ giữ đồng hồ và chấm điểm. Bài được lưu tự động; hết giờ, bài tự gửi.

Mỗi câu có thể kèm một hình (Thêm hình ở màn soạn đề; hình được thu về JPEG rộng 1100 px). Hình chỉ gửi về máy khi người làm đã mở được bài.

**Test đầu giờ:** gắn bài với một buổi ở ô “Test đầu giờ của buổi”. Chỉ người đã điểm danh buổi đó mới mở được bài, và điểm bài tính vào điểm nhóm.

## Điểm nhóm

Tab Lịch → Điểm nhóm. Mỗi buổi đã đóng và tính chuyên cần, mỗi nhà tối đa 100 điểm: chuyên cần 60 điểm (đúng giờ 1, trễ 0,5, vắng 0, vắng có phép không tính vào số người), test đầu giờ 40 điểm (trung bình của người có mặt, không làm tính 0). Buổi không có test thì chuyên cần quy về thang 100. Ban cố vấn không tính. Xếp hạng theo trung bình các buổi trong năm học. Cách tính nằm ở hàm `diem_nhom`.

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
