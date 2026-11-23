# Thành viên NKTV · CLB Ngoại khoa Trưng Vương

Webapp nội bộ của CLB Ngoại Khoa Trưng Vương - Trường ĐH Y Khoa Phạm Ngọc Thạch: quản lý thành viên, điểm danh bằng mã QR, lịch sinh hoạt và thông báo, hồ sơ năng lực, post-test hằng tuần, xin nghỉ và vắng có phép.

Kho này chỉ chứa giao diện và lược đồ cơ sở dữ liệu. Danh sách thành viên, điểm danh, điểm số nằm trong Supabase, được bảo vệ bằng quy tắc theo từng dòng dữ liệu; không có dữ liệu cá nhân nào trong kho.

## Ai làm được gì

| Vai trò | Quyền |
|---|---|
| Không đăng nhập, quét mã trên thẻ | Thẻ của đúng người đó: họ tên, Generation, nhà, cấp, tình trạng |
| Senior, Junior | Lịch, kho lịch, điểm nhóm, thông báo, xin nghỉ, làm post-test, hồ sơ và chuyên cần của chính mình |
| Nhóm trưởng, nhóm phó | Thêm soạn và gửi lịch cho nhà mình |
| Người được phân công soạn lịch | Thêm soạn và gửi lịch cho nhà được phân công, tới ngày hết hạn nếu có |
| Phụ trách điểm danh | Thêm danh sách có tên, tạo buổi, quét mã, ghi tay, duyệt đơn xin nghỉ, soạn lịch cho mọi nhà |
| Ban cố vấn | Gần đủ quyền quản trị: thêm thông báo, post-test, xác nhận năng lực; không phân quyền, không sửa danh sách, không cấp mã |
| Quản trị | Toàn quyền, kể cả phân quyền, sửa danh sách thành viên, cấp mã kích hoạt |

Quản trị phân quyền ở **Quản lý → Phân quyền** cho tài khoản đã kích hoạt. Cấp (Junior, Senior, Ban cố vấn) và chức vụ trong nhà (nhóm trưởng, nhóm phó) là hai ô riêng. App luôn giữ ít nhất một quản trị đã kích hoạt.

## Đăng nhập

Thành viên không cần email. Ban nhân sự cấp mã kích hoạt trong app (dùng một lần, hết hạn sau 30 ngày); thành viên nhập mã thành viên và mã kích hoạt, tự đặt mật khẩu. Quên mật khẩu thì xin mã mới và làm lại đúng bước đó.

## Điểm danh

- **Mã của thành viên:** Hôm nay → Mã điểm danh. Mã đổi sau mỗi 20 giây, ký bằng khóa riêng của từng người (`js/ma-dong.js`, hàm `ghi_diem_danh`), kèm đồng hồ chạy từng giây. Ảnh chụp mã chỉ còn dùng được khoảng một phút.
- **Cài đặt “Chỉ nhận mã đang chạy trên app”** (Quản lý → Buổi sinh hoạt, mặc định bật): mã cố định trên thẻ in và ảnh chụp mã không quét được; ai quên điện thoại thì người quét nhìn mặt rồi ghi tay.
- **Người quét:** quản trị, Ban cố vấn, phụ trách điểm danh, và người được giao cho từng buổi (trang của buổi → Người điểm danh buổi này). Quyền được giao hết khi buổi đóng.
- **Báo hiệu khi quét:** kết quả phủ lên khung camera (xanh: đúng giờ, vàng: trễ, xanh dương: đã điểm danh trước đó, đỏ: lỗi), kèm hai nốt nhạc, rung và giọng đọc “Đã điểm danh” nếu máy có giọng tiếng Việt. Cùng một mã đưa lại trong 8 giây thì bỏ qua.

## Soạn lịch sinh hoạt

Ngoài nhóm trưởng, nhóm phó, quản trị và Ban cố vấn phân công thêm người soạn lịch cho từng nhà ở **Quản lý → Phân công soạn lịch** (bảng `phan_cong_lich`, hàm `dat_phan_cong_lich`). Phân công có thể kèm ngày hết hạn; qua ngày đó quyền tự gỡ.

Nhóm trưởng, nhóm phó soạn lịch tuần hoặc chương trình đặc biệt cho nhà mình, xem trước ảnh theo mascot nhóm trực, tải PNG hoặc Excel. Bản nháp tự lưu và nhóm trưởng, nhóm phó cùng nhà soạn tiếp được. Khi gửi, lịch vào kho, tạo buổi ở tab Lịch để điểm danh và đăng một thông báo. Ảnh không lưu thành tệp: dữ liệu được giữ nguyên nên vẽ lại được bất cứ lúc nào.

`js/lich-ve.js` là bộ vẽ ảnh trích nguyên văn từ app soạn lịch cũ bằng `tools/tao_lich_ve.py`, không sửa tay.

## Post-test

Quản trị tải đề PDF có chữ (dạng “Câu 1.” và “A. … B. …”) hoặc dán chữ, xem lại từng câu, chọn đáp án rồi đăng. Đáp án nằm ở bảng riêng và không gửi về máy người làm bài trước khi được phép xem. Máy chủ giữ đồng hồ và chấm điểm. Bài được lưu tự động; hết giờ, bài tự gửi.

Mỗi câu có thể kèm một hình (Thêm hình ở màn soạn đề; hình được thu về JPEG rộng 1100 px). Hình chỉ gửi về máy khi người làm đã mở được bài.

**Test đầu giờ:** gắn bài với một buổi ở ô “Test đầu giờ của buổi”. Chỉ người đã điểm danh buổi đó mới mở được bài, và điểm bài tính vào điểm nhóm.

## Điểm nhóm

Tab Lịch → Điểm nhóm. Mỗi buổi đã đóng và tính chuyên cần, mỗi nhà tối đa 100 điểm: chuyên cần 60 điểm (đúng giờ 1, trễ 0,5, vắng 0, vắng có phép không tính vào số người), test đầu giờ 40 điểm (trung bình của người có mặt, không làm tính 0). Buổi không có test thì chuyên cần quy về thang 100. Ban cố vấn không tính. Xếp hạng theo trung bình các buổi trong năm học. Cách tính nằm ở hàm `diem_nhom`.

## Tuyển quân: đánh giá thí sinh

Tab **Tuyển quân** hiện khi cài đặt `tuyen_quan` có `mo: true`. Quản trị bật, tắt ở cuối màn Tuyển quân và luôn thấy tab này.

- **Danh sách thí sinh:** bảng `tq_thi_sinh` (mã thí sinh, họ tên, lớp, năm học), nhập bằng SQL riêng vì chứa họ tên. Không lưu SĐT, email, ngày sinh, MSSV của thí sinh.
- **Ghi chú chuẩn bị:** mỗi người một ghi chú cho mỗi thí sinh, tự lưu khi ngừng gõ. Chỉ người viết đọc được, kể cả quản trị cũng không đọc được (bảng `tq_ghi_chu`).
- **Phiếu đánh giá:** theo form Google “[TQ2026] ĐÁNH GIÁ VÒNG 3”, gồm phần A (thuyết trình), phần B (tác phong, phẩm chất) và phần C (nhận xét, kết luận). Tên người đánh giá lấy từ tài khoản; nhà được điền sẵn theo hồ sơ và đổi được. Mỗi người một phiếu cho mỗi thí sinh và sửa được. Phiếu đang soạn được lưu tạm trên máy. Gửi qua hàm `luu_danh_gia_tq`, hàm này kiểm tra đủ mục.
- **Xem kết quả:** quản trị, Ban cố vấn, và những người có id trong cài đặt `tq_xem_ket_qua` (mảng) đọc được mọi phiếu và mở được **Tổng hợp**. Trang Tổng hợp có điểm trung bình phần A, phần B, số phiếu Phù hợp, Cân nhắc, Không phù hợp, và tải được CSV. Tệp CSV từng phiếu có cùng cột với bảng trả lời của form Google. Người khác chỉ thấy phiếu của chính mình.

## Khảo sát thành viên

Dùng lần đầu cho BM01, khảo sát trước workshop Quản lý thời gian (anh Long yêu cầu 23/11/2026). Bảng và hàm ở migration `0021_khao_sat.sql`, tách hẳn khỏi phiếu của đợt tập huấn.

- **Ai làm:** thành viên CLB còn hoạt động có cấp nằm trong đối tượng của khảo sát (BM01: Junior, Senior). Khảo sát đang mở mà chưa gửi hiện ở màn Hôm nay; trang làm bài là `#khao-sat/<id>`. Câu đã chọn được giữ trên máy cho tới khi gửi; gửi rồi không sửa được.
- **Câu có điều kiện:** câu chỉ hiện khi một câu trước đó được trả lời đúng điều kiện. BM01: chọn "Không tham gia" ở câu 1 thì chỉ trả lời câu 1 rồi gửi. Máy chủ xét lại điều kiện, bỏ phần trả lời của câu không hiện và kiểm từng lựa chọn.
- **Ẩn danh:** app ghi ai đã gửi, còn dòng trả lời không gắn tên, giờ gửi làm tròn theo ngày, danh sách người đã gửi không kèm giờ.
- **Kết quả:** quản trị và Ban cố vấn mở `#khao-sat/<id>/ket-qua` (có lối vào ở màn Hôm nay khi khảo sát đang mở): số đã gửi, chưa gửi, chưa kích hoạt app; câu 1 đưa lên đầu thành ô số; biểu đồ từng câu; mở, đóng, đặt hạn; tải CSV câu trả lời và danh sách đã gửi, chưa gửi.
- **Nội dung khảo sát** nằm trong tệp JSON ở `supabase/du_lieu/`; `tools/tao_khao_sat.py` kiểm tệp rồi tạo lệnh SQL nạp lên. Chưa có màn soạn khảo sát trên app.

## Thông tin học viên app thu thập

App chỉ lưu **họ tên, email, MSSV và lớp** (anh Long chốt 18/11/2026). Bảng thư ký dán vào có thêm cột nào — số điện thoại, ngày sinh, giới tính, trường, ngành, năm học — app đọc qua rồi bỏ, không ghi vào cơ sở dữ liệu. Thu ít thì hồ sơ bảo vệ dữ liệu cá nhân nhẹ đi và rủi ro cũng nhẹ đi.

## Nhóm Zalo của đợt

Thư ký hoặc điều hành tạo nhóm Zalo **trước khi nạp danh sách**, rồi vào **Tập huấn › đợt › Nhóm Zalo** dán link và ảnh mã QR. Sau đó link và QR tự đi theo: trong thư báo mã kích hoạt (link trong thân thư, ảnh QR gửi kèm vì phần lớn hộp thư chặn ảnh nhúng), trên màn Hôm nay của học viên, và trên phiếu in. Đổi link thì các thư đã gửi vẫn mang link cũ.

## Gửi mã kích hoạt qua email

App gửi được mã kích hoạt cho học viên qua email, thay cho việc thư ký chép bảng gửi tay. Thành viên CLB không có email trong danh sách nên không gửi thư cho thành viên.

**Nối dịch vụ gửi thư** (làm một lần, quản trị): tạo tài khoản Mailjet (gói miễn phí 200 thư mỗi ngày) → xác minh một địa chỉ gửi ở *Account › Sender domains & addresses* → vào *Account › API Key Management*, bấm **Generate Secret Key** và chép cả API Key lẫn Secret Key → đặt hai secret `MAILJET_API_KEY` và `MAILJET_SECRET_KEY` cho dự án Supabase → vào **Quản lý › Gửi thư**, điền tên và địa chỉ người gửi, gửi một thư thử, rồi bật công tắc. Khóa API không nằm trong kho mã nguồn và không nằm trong cơ sở dữ liệu.

Edge Function `gui-thu` chạy được với Brevo (`BREVO_API_KEY`) lẫn Mailjet (`MAILJET_API_KEY` + `MAILJET_SECRET_KEY`); đủ cặp khóa Mailjet thì nó dùng Mailjet, không thì quay về Brevo. Màn *Quản lý › Gửi thư* hiện tên dịch vụ đang nối.

**Cách dùng:** Ban tổ chức cấp mã ở *Danh sách học viên* → bảng mã hiện ra kèm nút **Gửi email**. App gửi theo từng lượt 40 người, xong thì báo ai nhận được, ai không. Người không nhận được vẫn gửi tay bằng bảng CSV, mã vẫn dùng được.

**Những điều đã cố ý làm như vậy:**

- Địa chỉ nhận do máy chủ tra trong hồ sơ, trình duyệt chỉ gửi lên id học viên và mã. Thư vì thế không thể đi tới địa chỉ lạ.
- Mã kích hoạt bản rõ không lưu ở đâu cả; nhật ký `thu_da_gui` chỉ ghi gửi được hay lỗi. Muốn gửi lại thì phải cấp mã mới — có nút làm liền hai việc đó cho những người chưa nhận thư.
- Tài khoản có email đuôi `@dientap.test` thì app không gửi thật, để gói diễn tập khỏi tốn hạn mức.
- Gửi từ địa chỉ `@gmail.com` qua dịch vụ ngoài thì một phần thư rơi vào Spam. Có tên miền riêng thì hết.

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
| `supabase/functions/gui-thu/` | Hàm gửi thư cho học viên; giữ khóa API của dịch vụ gửi thư |
| `tools/nhap_thanh_vien.py` | Tạo lệnh SQL nhập danh sách từ CSV; tệp SQL tạo ra chứa họ tên nên không đưa lên kho |
| `supabase/du_lieu/khao_sat_*.json`, `tools/tao_khao_sat.py` | Nội dung từng khảo sát thành viên và công cụ tạo lệnh SQL nạp lên (migration 0021) |

## Chạy thử trên máy

```bash
python -m http.server 8765
```

Mở `http://localhost:8765/?demo=admin`.
