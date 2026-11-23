// Bản chạy thử trên máy (localhost, ?demo=admin|diem|gv|bcv|nt|tv|hv|hvxong|dangnhap): dữ liệu giả trong bộ nhớ, không gọi máy chủ.
// nt là nhóm trưởng nhà Genbu, bcv là Ban cố vấn không giữ vai trò quản trị.
// Trong đợt XQ2627: admin là trưởng ban, tv là thư ký, diem là phụ trách điểm danh, gv là tập huấn viên.
// hv là học viên đang trong đợt mở, hvxong là học viên chỉ còn đợt đã kết thúc (tài khoản chỉ xem).
// Cùng tên hàm với api.js để thử giao diện mà không chạm vào dữ liệu thật.
import { baiGiayGia } from './demo-baigiay.js';
import { duLieuGia } from './demo-dulieu.js';
import { khaoSatGia } from './demo-khaosat.js';
const uid = () => 'x' + Math.random().toString(36).slice(2, 12);
const NHA = ['Seiryu', 'Suzaku', 'Byakko', 'Genbu', 'Kirin', 'Yin-Yang Kois'];

export function demo(vai) {
  const tv = Array.from({ length: 18 }, (_, i) => ({
    id: 't' + i, ma: 'NKTV-' + String(i + 1).padStart(3, '0'), ho_ten: ['NGUYỄN VĂN', 'TRẦN THỊ', 'LÊ MINH'][i % 3] + ' ' + String.fromCharCode(65 + i),
    gen: 8 + (i % 4), nha: NHA[i % 6], cap: i === 0 || i === 4 ? 'Ban cố vấn' : i % 5 === 3 ? 'Junior' : 'Senior', chuc_vu: null, hoat_dong: i !== 17, ghi_chu: null, khoa_qr: String(i).padStart(16, 'a'), vai_tro: 'thanh_vien', loai: 'thanh_vien', tham_gia_tu: null, user_id: null
  }));
  const dangNhap = { admin: 0, diem: 1, nt: 3, bcv: 4, gv: 5 }[vai] ?? 2;
  tv[0].vai_tro = 'quan_tri'; tv[1].vai_tro = 'diem_danh'; tv[3].chuc_vu = 'nhom_truong';
  const khoaNha = (n) => n === 'Yin-Yang Kois' ? 'koi' : String(n || '').toLowerCase();
  const co = vai !== 'dangnhap';
  let phien = co;
  const me = () => tv[dangNhap];
  const nay = Date.now(), ngay = 864e5;
  const buoi = [
    { id: 'b1', ten: 'Sinh hoạt hằng tuần', bat_dau: new Date(nay - 7 * ngay).toISOString(), ket_thuc: null, dia_diem: 'Phòng A', noi_dung: 'Chuyên đề mẫu', nhom_truc: 'Suzaku', chu_tri: 'Nguyễn Văn A', tre_sau_phut: 10, tinh_chuyen_can: true, dong: true },
    { id: 'b2', ten: 'Sinh hoạt hằng tuần', bat_dau: new Date(nay - 20 * 60e3).toISOString(), ket_thuc: null, dia_diem: 'Phòng A', noi_dung: null, nhom_truc: 'Kirin', chu_tri: null, tre_sau_phut: 10, tinh_chuyen_can: true, dong: false },
    { id: 'b3', ten: 'Thực hành khâu cơ bản', bat_dau: new Date(nay + 6 * ngay).toISOString(), ket_thuc: null, dia_diem: 'Phòng thực hành', noi_dung: 'Mang theo bộ dụng cụ.', nhom_truc: 'Genbu', chu_tri: null, tre_sau_phut: 10, tinh_chuyen_can: true, dong: false }
  ];
  // Buổi của đợt tập huấn nằm cùng mảng buoi, phân biệt bằng dot_id (migration 0014).
  buoi.push(
    { id: 'bd1', dot_id: 'o1', ten: 'Lý thuyết X-quang bụng', bat_dau: new Date(nay - 40 * 60e3).toISOString(), ket_thuc: new Date(nay + 110 * 60e3).toISOString(), dia_diem: 'Giảng đường 3', noi_dung: 'Mang theo máy tính.', nhom_truc: null, chu_tri: null, tre_sau_phut: 10, ra_sau_phut: 60, tinh_chuyen_can: true, dong: false, phan: 'ly_thuyet', nhom_chon: null, can_dang_ky: false, suc_chua: null, mo_dang_ky_tu: null, han_dang_ky: null },
    { id: 'bd2', dot_id: 'o1', ten: 'Thực hành ca sáng', bat_dau: new Date(nay + 3 * ngay).toISOString(), ket_thuc: null, dia_diem: 'Phòng đọc phim', noi_dung: null, nhom_truc: null, chu_tri: null, tre_sau_phut: 10, ra_sau_phut: null, tinh_chuyen_can: true, dong: false, phan: 'thuc_hanh', nhom_chon: 'Thực hành tuần 1', can_dang_ky: true, suc_chua: 2, mo_dang_ky_tu: null, han_dang_ky: new Date(nay + 2 * ngay).toISOString() },
    { id: 'bd3', dot_id: 'o1', ten: 'Thực hành ca chiều', bat_dau: new Date(nay + 3 * ngay + 5 * 3600e3).toISOString(), ket_thuc: null, dia_diem: 'Phòng đọc phim', noi_dung: null, nhom_truc: null, chu_tri: null, tre_sau_phut: 10, ra_sau_phut: null, tinh_chuyen_can: true, dong: false, phan: 'thuc_hanh', nhom_chon: 'Thực hành tuần 1', can_dang_ky: true, suc_chua: 3, mo_dang_ky_tu: null, han_dang_ky: new Date(nay + 2 * ngay).toISOString() },
    { id: 'bd4', dot_id: 'o1', ten: 'Lượng giá cuối đợt', bat_dau: new Date(nay + 20 * ngay).toISOString(), ket_thuc: null, dia_diem: null, noi_dung: null, nhom_truc: null, chu_tri: null, tre_sau_phut: 5, ra_sau_phut: null, tinh_chuyen_can: true, dong: false, phan: 'luong_gia', nhom_chon: null, can_dang_ky: false, suc_chua: null, mo_dang_ky_tu: null, han_dang_ky: null }
  );
  const dd = [{ buoi_id: 'b1', thanh_vien_id: 't0', luc: buoi[0].bat_dau, cach: 'qr' }, { buoi_id: 'b1', thanh_vien_id: 't2', luc: new Date(new Date(buoi[0].bat_dau).getTime() + 15 * 60e3).toISOString(), cach: 'qr' }];
  [1, 3, 5, 6, 7, 8, 10, 11, 13, 14].forEach((i, k) => dd.push({ buoi_id: 'b1', thanh_vien_id: 't' + i, luc: new Date(new Date(buoi[0].bat_dau).getTime() + (k % 4 === 3 ? 20 : 2) * 60e3).toISOString(), cach: 'qr' }));
  [0, 3].forEach(i => dd.push({ buoi_id: 'b2', thanh_vien_id: 't' + i, luc: buoi[1].bat_dau, cach: 'qr' }));
  const don = [{ id: 'd1', buoi_id: 'b3', thanh_vien_id: 't3', ly_do: 'Trùng lịch thi', trang_thai: 'cho', gui_luc: new Date(nay - 3600e3).toISOString(), phan_hoi: null }];
  const tb = [{ id: 'n1', tieu_de: 'Lịch tuần này', noi_dung: 'Nội dung mẫu của thông báo.\nDòng thứ hai.', ghim: true, dang_luc: new Date(nay - 3600e3).toISOString() }, { id: 'n2', tieu_de: 'Thông báo cũ', noi_dung: 'Mẫu.', ghim: false, dang_luc: new Date(nay - 5 * ngay).toISOString() }];
  const doc = [];
  const nl = ['Lãnh đạo', 'Tổ chức sự kiện', 'Làm việc nhóm', 'Khâu cơ bản', 'Đọc CT-scan bụng', 'Đọc X-quang bụng'].map((ten, i) => ({ id: 'l' + i, nhom: i < 3 ? 'A' : 'B', ten, mo_ta: null, thu_tu: i, dang_dung: true }));
  const gn = [{ id: 'g1', thanh_vien_id: me().id, nang_luc_id: 'l0', bac: 1, trang_thai: 'dat', ngay_dat: '2026-10-10', minh_chung: 'Điều hành buổi mẫu', lien_ket: null }, { id: 'g2', thanh_vien_id: me().id, nang_luc_id: 'l0', bac: 2, trang_thai: 'dang_ren' }, { id: 'g3', thanh_vien_id: 't4', nang_luc_id: 'l3', bac: 1, trang_thai: 'cho', minh_chung: 'Đạt buổi thực hành mẫu', gui_luc: new Date().toISOString() }];
  const hd = [{ id: 'h1', thanh_vien_id: me().id, loai: 'chuyen_de', ten: 'Chuyên đề mẫu', ngay: '2026-10-01', so_gio: null, trang_thai: 'dat', lien_ket: null }, { id: 'h2', thanh_vien_id: 't5', loai: 'trao_lai', ten: 'Dạy khâu mẫu', ngay: '2026-10-02', so_gio: 2, trang_thai: 'cho', gui_luc: new Date().toISOString() }];
  const bai = [
    { id: 'p1', tieu_de: 'Post-test mẫu', mo_ta: null, thoi_gian_phut: 10, mo_luc: null, dong_luc: new Date(nay + 3 * ngay).toISOString(), so_lan: 1, hien_dap_an: 'sau_gui', trang_thai: 'mo', buoi_id: null, tao_luc: new Date(nay - ngay).toISOString() },
    { id: 'p2', tieu_de: 'Test đầu giờ mẫu', mo_ta: 'Bài mẫu gắn với buổi đang diễn ra.\nViết tắt: CPR – hồi sinh tim phổi.', thoi_gian_phut: 20, mo_luc: null, dong_luc: new Date(nay + 4 * 3600e3).toISOString(), so_lan: 1, hien_dap_an: 'sau_gui', trang_thai: 'mo', buoi_id: 'b2', tao_luc: new Date(nay - 3600e3).toISOString() },
    { id: 'p3', tieu_de: 'Test đầu giờ tuần trước', mo_ta: null, thoi_gian_phut: 20, mo_luc: null, dong_luc: buoi[0].bat_dau, so_lan: 1, hien_dap_an: 'sau_dong', trang_thai: 'mo', buoi_id: 'b1', tao_luc: new Date(nay - 8 * ngay).toISOString() }
  ];
  const HINH = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320"><rect width="480" height="320" fill="#000"/><ellipse cx="240" cy="160" rx="210" ry="135" fill="#4a4a4a"/><circle cx="190" cy="150" r="46" fill="#9a9a9a"/><circle cx="292" cy="178" r="34" fill="#828282"/><path d="M300 70l-22 30" stroke="#fff" stroke-width="6"/><text x="240" y="306" fill="#fff" font-size="15" text-anchor="middle" font-family="sans-serif">Hình minh họa</text></svg>');
  const cau = [
    { id: 'c1', bai_id: 'p1', phan: 'PHẦN A. KIẾN THỨC NỀN', noi_dung: 'Câu hỏi mẫu thứ nhất?', lua_chon: ['Lựa chọn một', 'Lựa chọn hai', 'Lựa chọn ba', 'Lựa chọn bốn'], dung: 1, hinh: null },
    { id: 'c2', bai_id: 'p1', phan: 'PHẦN A. KIẾN THỨC NỀN', noi_dung: 'Câu hỏi mẫu thứ hai, dài hơn một chút để thử xuống dòng trên màn hình điện thoại?', lua_chon: ['Một', 'Hai', 'Ba', 'Bốn'], dung: 2, hinh: null },
    { id: 'c3', bai_id: 'p2', phan: 'Đọc hình ảnh', noi_dung: 'Quan sát hình dưới đây. Mũi tên chỉ cấu trúc nào?\nChọn một đáp án đúng nhất.', lua_chon: ['Quai ruột giãn', 'Dịch tự do', 'Khí trong thành ruột', 'Vùng chuyển tiếp'], dung: 3, hinh: HINH },
    { id: 'c4', bai_id: 'p2', phan: 'Kiến thức', noi_dung: 'Câu chữ mẫu không có hình?', lua_chon: ['Một', 'Hai', 'Ba', 'Bốn'], dung: 0, hinh: null },
    { id: 'c5', bai_id: 'p3', phan: null, noi_dung: 'Câu của bài tuần trước?', lua_chon: ['Một', 'Hai'], dung: 0, hinh: null }
  ];
  const lam = [3, 5, 6, 7, 10, 13].map((i, k) => ({ id: 'l' + i, bai_id: 'p3', thanh_vien_id: 't' + i, lan: 1, han_luc: buoi[0].bat_dau, nop_luc: buoi[0].bat_dau, tra_loi: {}, so_dung: k % 3 ? 1 : 0, tong: 1, diem: k % 3 ? 10 : 0 }));
  const giao = [{ buoi_id: 'b2', thanh_vien_id: 't2' }];
  // Gửi thư (migration 0016): bản chạy thử bật sẵn để thấy nút, nhưng không gửi thư thật đi đâu cả.
  const thuDaGui = [];
  const caiDat = { danh_muc_da_duyet: false, chi_nhan_ma_dong: true,
    thu: { bat: true, ten_nguoi_gui: 'CLB Ngoại Khoa Trưng Vương', dia_chi_gui: 'clb@vi-du.test', tra_loi_toi: '', app_url: 'https://vi-du.test/app' },
    tuyen_quan: { mo: false, ten: 'Tuyển quân 2026 · Gen12', vong: 'Vòng 3 · Phỏng vấn', mo_ta: 'Thuyết trình ngắn kết hợp phỏng vấn, ứng xử tình huống giả định.\nPhòng 302, 303.\n17:30–20:30 thứ Bảy 14/11/2026 và 7:30–11:30 Chủ nhật 15/11/2026.' } };
  // Tuyển quân: thí sinh giả; người t0 (quản trị) và t5 đã chấm vài phiếu.
  const thiSinh = Array.from({ length: 12 }, (_, i) => ({ id: 'ts' + i, ma_ts: String(2601 + i), stt: i + 1, ho_ten: ['Thí sinh Mẫu', 'Ứng viên Thử', 'Bạn Giả Định'][i % 3] + ' ' + String.fromCharCode(65 + i), lop: ['Y2025A', 'Y2026C', 'Y2024B'][i % 3], nam: [2, 1, 3][i % 3] }));
  const phieuMau = (ts, tvId, kl, lech) => {
    const t = tv.find(x => x.id === tvId), d = {};
    ['phong_thai', 'eye_contact', 'giong_noi', 'mach_y', 'tac_phong', 'thai_do', 'giao_tiep', 'hoa_dong', 'thich_nghi', 'to_chuc', 'ap_luc', 'trach_nhiem', 'chia_se', 'cau_tien'].forEach((k, j) => { d[k] = Math.max(1, Math.min(5, 3 + ((j + lech) % 3) - (kl === 'Không phù hợp' ? 1 : 0))); });
    return { id: uid(), thi_sinh_id: ts, thanh_vien_id: tvId, nguoi_ten: t.ho_ten, thuoc_nha: t.cap === 'Ban cố vấn' ? 'Anh/Chị Ban Cố vấn' : t.nha === 'Yin-Yang Kois' ? 'Yin Yang Kois' : t.nha, diem: d,
      nhan_xet_tt: 'Trình bày mạch lạc, cần nhìn khán giả nhiều hơn.', nhan_xet_tp: 'Lễ phép, chủ động.', ket_luan: kl, gui_luc: new Date(nay - 3600e3).toISOString(), sua_luc: new Date(nay - 3000e3).toISOString() };
  };
  const phieuTQ = [phieuMau('ts0', 't0', 'Phù hợp', 0), phieuMau('ts0', 't5', 'Cân nhắc', 1), phieuMau('ts1', 't5', 'Không phù hợp', 2), phieuMau('ts2', 't4', 'Phù hợp', 1)];
  const ghiChuTQ = [{ thi_sinh_id: 'ts1', thanh_vien_id: 't0', noi_dung: 'Hỏi lại về lịch học thứ Bảy.', sua_luc: new Date(nay - 7200e3).toISOString() }];
  // Người đang đăng nhập: học viên thì là id trong mảng hv, còn lại là thành viên CLB.
  const toiId = () => hvDangNhap || me().id;
  const coVaiDot = (id, vai) => {
    if (hvDangNhap) return false;
    const t = me();
    return t.vai_tro === 'quan_tri' || t.cap === 'Ban cố vấn' || dotBtc.some(b => b.dot_id === id && b.thanh_vien_id === t.id && vai.includes(b.vai));
  };
  const oTrongDot = (id) => dotHv.some(x => x.dot_id === id && x.thanh_vien_id === toiId() && x.trang_thai === 'ghi_danh');
  const thayDuocDot = (id) => coVaiDot(id, ['truong_ban', 'thu_ky', 'giang_vien', 'diem_danh']) || oTrongDot(id);
  const dotDangMo = (id) => (dot.find(d => d.id === id) || {}).trang_thai === 'mo';
  const duocQuet = (bId) => {
    const b = buoi.find(x => x.id === bId), t = me();
    if (b && b.dot_id) return coVaiDot(b.dot_id, ['truong_ban', 'thu_ky', 'diem_danh']);
    return !hvDangNhap && (t.vai_tro !== 'thanh_vien' || t.cap === 'Ban cố vấn' || giao.some(g => g.buoi_id === bId && g.thanh_vien_id === t.id));
  };
  const kyMa = async (ma, w, biMat) => {
    const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(biMat), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return [...new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(`${ma}.${w}`)))].map(x => x.toString(16).padStart(2, '0')).join('').slice(0, 12);
  };
  const daDiemDanh = (b, t) => !b || dd.some(x => x.buoi_id === b && x.thanh_vien_id === t);
  // Phân công soạn lịch: LÊ MINH C (t2, nhà Byakko) được soạn lịch cho nhà Kirin tới 7 ngày nữa.
  const ngayVN = (ms) => new Date(ms + 7 * 3600e3).toISOString().slice(0, 10);
  const phanCong = [{ thanh_vien_id: 't2', nha: 'Kirin', den_ngay: ngayVN(nay + 7 * ngay) }];
  const conPC = (p) => !p.den_ngay || p.den_ngay >= ngayVN(Date.now());
  const pcCua = (id) => phanCong.filter(p => p.thanh_vien_id === id && conPC(p));
  const soanDuoc = (nhom) => { const t = me(); return t.vai_tro !== 'thanh_vien' || t.cap === 'Ban cố vấn' || (!!t.chuc_vu && khoaNha(t.nha) === nhom) || pcCua(t.id).some(p => khoaNha(p.nha) === nhom); };
  const lich = [{ id: 'k1', buoi_id: 'b1', loai: 'tuan', nhom: 'suzaku', ngay: buoi[0].bat_dau.slice(0, 10), ten: 'Lịch sinh hoạt tuần', trang_thai: 'da_gui', nguoi_tao: 't1', nguoi_tao_ten: 'TRẦN THỊ B', gui_luc: buoi[0].bat_dau, sua_luc: buoi[0].bat_dau,
    du_lieu: { mau: 'tuan', kho: 'post', nhom: 'suzaku', ngay: buoi[0].bat_dau.slice(0, 10), gioBD: '14:00', gioKT: '16:00', dd1: 'Phòng A', dd2: 'ĐHYK Phạm Ngọc Thạch', chuTri: 'BS. Nguyễn Văn A', dieuHanh: 'SV. Trần Thị B', tenCT: '', phuCT: '', moTa: '', qrLink: '', qrNote: '',
      rows: [{ t1: '14:00', t2: '15:00', title: 'Chuyên đề mẫu', who: 'SV. Lê Minh C', org: 'kirin' }, { t1: '15:00', t2: '16:00', title: 'Thông báo chung', who: 'Ban tổ chức', org: '' }] } }];
  /* ---------- Tập huấn: đợt, Ban tổ chức, học viên ----------
     t0 (quản trị) là trưởng ban, t2 là thư ký của đợt đang mở, nên ?demo=tv cũng thử được màn thư ký. */
  const dot = [
    { id: 'o1', ma: 'XQ2627', ten: 'Tập huấn X-quang bụng 2026–2027', nam_hoc: '2026–2027', mo_ta: 'Một buổi lý thuyết, ba buổi thực hành, ba buổi lượng giá.', bat_dau: ngayVN(nay + 10 * ngay), ket_thuc: ngayVN(nay + 40 * ngay), trang_thai: 'mo',
      zalo_link: 'https://zalo.me/g/vidudientap', zalo_qr: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMjAnIGhlaWdodD0nMTIwJz48cmVjdCB3aWR0aD0nMTIwJyBoZWlnaHQ9JzEyMCcgZmlsbD0nI2ZmZicvPjxnIGZpbGw9JyMxMTEnPjxyZWN0IHg9JzEwJyB5PScxMCcgd2lkdGg9JzMwJyBoZWlnaHQ9JzMwJy8+PHJlY3QgeD0nMTgnIHk9JzE4JyB3aWR0aD0nMTQnIGhlaWdodD0nMTQnIGZpbGw9JyNmZmYnLz48cmVjdCB4PSc4MCcgeT0nMTAnIHdpZHRoPSczMCcgaGVpZ2h0PSczMCcvPjxyZWN0IHg9Jzg4JyB5PScxOCcgd2lkdGg9JzE0JyBoZWlnaHQ9JzE0JyBmaWxsPScjZmZmJy8+PHJlY3QgeD0nMTAnIHk9JzgwJyB3aWR0aD0nMzAnIGhlaWdodD0nMzAnLz48cmVjdCB4PScxOCcgeT0nODgnIHdpZHRoPScxNCcgaGVpZ2h0PScxNCcgZmlsbD0nI2ZmZicvPjxyZWN0IHg9JzUyJyB5PSc1Micgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJy8+PHJlY3QgeD0nNzAnIHk9JzYwJyB3aWR0aD0nMTAnIGhlaWdodD0nMTAnLz48cmVjdCB4PSc2MCcgeT0nODYnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCcvPjxyZWN0IHg9Jzg2JyB5PSc3MCcgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJy8+PHJlY3QgeD0nNTInIHk9JzE2JyB3aWR0aD0nMTAnIGhlaWdodD0nMTAnLz48cmVjdCB4PScxNicgeT0nNTInIHdpZHRoPScxMCcgaGVpZ2h0PScxMCcvPjwvZz48L3N2Zz4=' },
    { id: 'o2', ma: 'KHAU2526', ten: 'Tập huấn khâu cơ bản 2025–2026', nam_hoc: '2025–2026', mo_ta: null, bat_dau: ngayVN(nay - 300 * ngay), ket_thuc: ngayVN(nay - 270 * ngay), trang_thai: 'ket_thuc' },
    { id: 'o3', ma: 'CTBUNG27', ten: 'Tập huấn CT bụng 2027', nam_hoc: '2026–2027', mo_ta: null, bat_dau: null, ket_thuc: null, trang_thai: 'soan' }
  ];
  const dotBtc = [
    { dot_id: 'o1', thanh_vien_id: 't0', vai: 'truong_ban' }, { dot_id: 'o1', thanh_vien_id: 't2', vai: 'thu_ky' },
    { dot_id: 'o1', thanh_vien_id: 't5', vai: 'giang_vien' }, { dot_id: 'o1', thanh_vien_id: 't1', vai: 'diem_danh' },
    { dot_id: 'o2', thanh_vien_id: 't0', vai: 'truong_ban' }
  ];
  // Tên học viên giả đặt rõ là giả: kho này công khai, không dùng tên trông như tên thật.
  const HV_TEN = ['Học Viên Mẫu A', 'Bạn Thử Nghiệm B', 'Người Học Giả Định C', 'Học Viên Mẫu D', 'Bạn Thử Nghiệm E', 'Người Học Giả Định F', 'Học Viên Mẫu G', 'Bạn Thử Nghiệm H'];
  const khongDau = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, '');
  const hv = HV_TEN.map((ten, i) => ({
    id: 'h' + i, ma: 'HV' + String(i + 1).padStart(5, '0'), ho_ten: ten, loai: 'hoc_vien', hoat_dong: true,
    // h7 đã học đợt KHAU2526 nên có tài khoản sẵn: nạp lại vào đợt mới thì giữ mật khẩu cũ.
    user_id: i < 5 || i === 7 ? 'u' + i : null, khoa_qr: 'hv' + String(i).padStart(14, '0'),
    email: khongDau(ten) + '@sv.test',
    mssv: '21' + String(5001 + i), lop: 'Y' + (2021 + (i % 3)) + String.fromCharCode(65 + (i % 3)),
    ma_con_han: i === 5 || i === 6
  }));
  let hvSo = hv.length;
  const dotHv = [];
  [0, 1, 2, 3, 4, 5, 6].forEach(i => dotHv.push({ dot_id: 'o1', thanh_vien_id: 'h' + i, trang_thai: 'ghi_danh', ghi_danh_luc: new Date(nay - 2 * ngay).toISOString(), ghi_chu: null }));
  [0, 7].forEach(i => dotHv.push({ dot_id: 'o2', thanh_vien_id: 'h' + i, trang_thai: 'ghi_danh', ghi_danh_luc: new Date(nay - 300 * ngay).toISOString(), ghi_chu: null }));
  // ?demo=hv là học viên đang học (h0, có cả đợt cũ); ?demo=hvxong là người chỉ còn đợt đã kết thúc (h7).
  const hvDangNhap = vai === 'hv' ? 'h0' : vai === 'hvxong' ? 'h7' : null;

  /* ---------- Trong đợt (migration 0014): đăng ký ca, tài liệu, checklist, câu hỏi, thông báo ---------- */
  // h1 và h2 đã chọn ca sáng nên ca đó đủ 2 chỗ: bấm chọn thêm là thấy báo hết chỗ.
  const dangKy = [
    { buoi_id: 'bd2', thanh_vien_id: 'h1', luc: new Date(nay - ngay).toISOString() },
    { buoi_id: 'bd2', thanh_vien_id: 'h2', luc: new Date(nay - ngay + 60e3).toISOString() }
  ];
  // h0 đã điểm danh vào buổi lý thuyết 35 phút trước, chưa tới mốc 60 phút nên chưa ra được.
  dd.push({ buoi_id: 'bd1', thanh_vien_id: 'h0', luc: new Date(nay - 35 * 60e3).toISOString(), cach: 'ma_dong', ra_luc: null });
  dd.push({ buoi_id: 'bd1', thanh_vien_id: 'h3', luc: new Date(nay - 38 * 60e3).toISOString(), cach: 'ma_dong', ra_luc: null });
  const taiLieu = [
    { id: 'tl1', dot_id: 'o1', buoi_id: 'bd1', ten: 'Slide lý thuyết X-quang bụng', mo_ta: 'Bản PDF', lien_ket: 'https://drive.google.com/mau-slide', thu_tu: 1, mo_tu: null, can_diem_danh: false },
    { id: 'tl2', dot_id: 'o1', buoi_id: 'bd1', ten: 'Bộ phim tập đọc', mo_ta: null, lien_ket: 'https://drive.google.com/mau-phim', thu_tu: 2, mo_tu: null, can_diem_danh: true },
    { id: 'tl3', dot_id: 'o1', buoi_id: null, ten: 'Đáp án bài lượng giá', mo_ta: 'Mở sau buổi lượng giá', lien_ket: 'https://drive.google.com/mau-dap-an', thu_tu: 3, mo_tu: new Date(nay + 21 * ngay).toISOString(), can_diem_danh: false }
  ];
  const checklist = [
    { id: 'ck1', dot_id: 'o1', buoi_id: 'bd2', ten: 'Đọc một phim X-quang bụng', mo_ta: 'Theo đúng thứ tự, không bỏ bước.', thu_tu: 1,
      muc: [{ ten: 'Trước khi đọc', muc: ['Kiểm tên và ngày chụp', 'Xác định thế chụp', 'Đánh giá chất lượng phim'] },
        { ten: 'Đọc có hệ thống', muc: ['Hơi trong ổ bụng', 'Quai ruột', 'Mức nước hơi', 'Bóng gan, lách, thận', 'Xương và phần mềm'] },
        { ten: 'Kết luận', muc: ['Nêu dấu hiệu chính', 'Đề xuất bước kế tiếp'] }] }
  ];
  const cauHoi = [
    { id: 'q1', buoi_id: 'bd1', nguoi: 'h3', an_ten: true, noi_dung: 'Phân biệt hơi tự do với hơi trong quai ruột thế nào ạ?', luc: new Date(nay - 20 * 60e3).toISOString(), trang_thai: 'moi', tra_loi: null, tra_loi_luc: null },
    { id: 'q2', buoi_id: 'bd1', nguoi: 'h0', an_ten: false, noi_dung: 'Thế chụp đứng và nằm khác nhau ở chỗ nào?', luc: new Date(nay - 12 * 60e3).toISOString(), trang_thai: 'da_tra_loi', tra_loi: 'Đứng thấy mức nước hơi và hơi tự do dưới hoành rõ hơn.', tra_loi_luc: new Date(nay - 8 * 60e3).toISOString() }
  ];
  const quanTam = [{ cau_hoi_id: 'q1', thanh_vien_id: 'h0' }, { cau_hoi_id: 'q1', thanh_vien_id: 'h1' }];
  const tbDot = [
    { id: 'nd1', dot_id: 'o1', tieu_de: 'Buổi lý thuyết đổi phòng', noi_dung: 'Chuyển sang Giảng đường 3.\nTới sớm 10 phút để điểm danh.', ghim: true, dang_luc: new Date(nay - 2 * 3600e3).toISOString() },
    { id: 'nd2', dot_id: 'o1', tieu_de: 'Nhớ chọn ca thực hành', noi_dung: 'Hạn chọn ca là hết ngày mai.', ghim: false, dang_luc: new Date(nay - 26 * 3600e3).toISOString() }
  ];
  const BANG_MA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const maKichHoat = () => Array.from({ length: 8 }, () => BANG_MA[Math.floor(Math.random() * BANG_MA.length)]).join('');
  const chuanTenHV = (s) => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, a, b) => a + b.toUpperCase()) || null;
  const emailHopLe = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
  const xemDuocDot = () => { const t = me(); return t.vai_tro === 'quan_tri' || t.cap === 'Ban cố vấn' || dotBtc.some(b => b.thanh_vien_id === t.id); };
  const laBtcDot = (id) => { const t = me(); return t.vai_tro === 'quan_tri' || t.cap === 'Ban cố vấn' || dotBtc.some(b => b.dot_id === id && b.thanh_vien_id === t.id && (b.vai === 'truong_ban' || b.vai === 'thu_ky')); };
  const dotCuaHV = (id) => dotHv.filter(x => x.thanh_vien_id === id && x.trang_thai === 'ghi_danh')
    .map(x => dot.find(d => d.id === x.dot_id)).filter(Boolean)
    .map(d => ({ id: d.id, ma: d.ma, ten: d.ten, bat_dau: d.bat_dau, ket_thuc: d.ket_thuc, trang_thai: d.trang_thai }));


  /* ---------- Sau buổi (migration 0015): yêu cầu, bài thi, phiếu, tiêu chí, chứng nhận ---------- */
  const yeuCau = [
    { id: 'y1', dot_id: 'o1', nguoi: 'h3', loai: 'thac_mac', noi_dung: 'Em bận ca trực đúng giờ thực hành, đổi ca được không ạ?', luc: new Date(nay - 4 * 3600e3).toISOString(), trang_thai: 'moi', tra_loi: null, tra_loi_luc: null },
    { id: 'y2', dot_id: 'o1', nguoi: 'h1', loai: 'phan_hoi', noi_dung: 'Buổi lý thuyết hơi nhanh ở phần quai ruột ạ.', luc: new Date(nay - 26 * 3600e3).toISOString(), trang_thai: 'xong', tra_loi: 'Cảm ơn bạn, buổi sau tập huấn viên sẽ đi chậm phần đó.', tra_loi_luc: new Date(nay - 20 * 3600e3).toISOString() }
  ];
  const baiThi = [
    { id: 'bt1', dot_id: 'o1', ma: 'VIET', ten: 'Bài viết', thang: 10, trong_so: 70, thu_tu: 1 },
    { id: 'bt2', dot_id: 'o1', ma: 'TRAM', ten: 'Chạy trạm', thang: 10, trong_so: 30, thu_tu: 2 }
  ];
  const diemBai = [
    { bai_id: 'bt1', thanh_vien_id: 'h0', diem: 8 }, { bai_id: 'bt2', thanh_vien_id: 'h0', diem: 9 },
    { bai_id: 'bt1', thanh_vien_id: 'h1', diem: 7 }, { bai_id: 'bt2', thanh_vien_id: 'h1', diem: 6 },
    { bai_id: 'bt1', thanh_vien_id: 'h2', diem: 4 }, { bai_id: 'bt2', thanh_vien_id: 'h2', diem: 5 }
  ];
  const phieu = [{ id: 'f1', dot_id: 'o1', ten: 'Phiếu đánh giá cuối đợt', mo_ta: 'Gửi trước khi nhận giấy chứng nhận.', an_danh: true, mo: true, han: new Date(nay + 15 * ngay).toISOString(), tao_luc: new Date(nay - 2 * ngay).toISOString() }];
  const phieuCau = [
    { id: 'fc1', phieu_id: 'f1', thu_tu: 1, noi_dung: 'Buổi học có ích với bạn không?', loai: 'thang5', lua_chon: null, bat_buoc: true },
    { id: 'fc2', phieu_id: 'f1', thu_tu: 2, noi_dung: 'Tập huấn viên giảng dễ hiểu không?', loai: 'thang5', lua_chon: null, bat_buoc: true },
    { id: 'fc3', phieu_id: 'f1', thu_tu: 3, noi_dung: 'Điều bạn muốn Ban tổ chức làm khác đi (không bắt buộc)', loai: 'chu', lua_chon: null, bat_buoc: false }
  ];
  // Hai người đã gửi: dòng trả lời không gắn tên vì phiếu ẩn danh, giờ làm tròn theo ngày.
  const phieuDaGui = [
    { phieu_id: 'f1', thanh_vien_id: 'h1', luc: new Date(nay - ngay).toISOString() },
    { phieu_id: 'f1', thanh_vien_id: 'h3', luc: new Date(nay - ngay).toISOString() }
  ];
  const phieuTraLoi = [
    { id: 'ft1', phieu_id: 'f1', nguoi: null, tra_loi: { fc1: '5', fc2: '4', fc3: 'Thêm thời gian hỏi đáp.' }, luc: ngayVN(nay - ngay) + 'T00:00:00+07:00' },
    { id: 'ft2', phieu_id: 'f1', nguoi: null, tra_loi: { fc1: '4', fc2: '5', fc3: '' }, luc: ngayVN(nay - ngay) + 'T00:00:00+07:00' }
  ];
  const tieuChi = [
    { id: 'tc1', dot_id: 'o1', ten: 'Dự buổi lý thuyết', loai: 'co_mat_buoi', buoi_id: 'bd1', phan: null, so_buoi: null, nguong: null, phieu_id: null, cot_loi: true, thu_tu: 1 },
    { id: 'tc2', dot_id: 'o1', ten: 'Điểm tổng từ 6,0', loai: 'diem_tong', buoi_id: null, phan: null, so_buoi: null, nguong: 6, phieu_id: null, cot_loi: true, thu_tu: 2 },
    { id: 'tc3', dot_id: 'o1', ten: 'Gửi phiếu đánh giá', loai: 'gui_phieu', buoi_id: null, phan: null, so_buoi: null, nguong: null, phieu_id: 'f1', cot_loi: true, thu_tu: 3 },
    { id: 'tc4', dot_id: 'o1', ten: 'Dự ít nhất 1 ca thực hành', loai: 'co_mat_phan', buoi_id: null, phan: 'thuc_hanh', so_buoi: 1, nguong: null, phieu_id: null, cot_loi: false, thu_tu: 4 }
  ];
  dot[0].cai_dat = { nguong_xuat_sac: 8.5 };
  // Đợt KHAU2526 đã xong: h7 có sẵn giấy để thử màn Kết quả và trang tra cứu công khai.
  const chungNhan = [{ dot_id: 'o2', thanh_vien_id: 'h7', ma: 'KHAU2526-0001-K3PW', muc: 'hoan_thanh', ghi_chu: null, diem_tong: 7.5, cap_luc: new Date(nay - 260 * ngay).toISOString(), thu_hoi_luc: null }];

  const diemTongDemo = (dotId, tvId) => {
    const bs = baiThi.filter(b => b.dot_id === dotId);
    const tong = bs.reduce((s, b) => s + Number(b.trong_so), 0);
    if (!tong) return null;
    const s = bs.reduce((acc, b) => {
      const d = diemBai.find(x => x.bai_id === b.id && x.thanh_vien_id === tvId);
      return acc + ((d ? Number(d.diem) : 0) / Number(b.thang) * 10 * Number(b.trong_so));
    }, 0);
    return Math.round(s / tong * 100) / 100;
  };
  const datTieuChiDemo = (tc, tvId, diem) => {
    if (tc.loai === 'co_mat_buoi') return dd.some(d => d.buoi_id === tc.buoi_id && d.thanh_vien_id === tvId);
    if (tc.loai === 'co_mat_phan') return new Set(dd.filter(d => d.thanh_vien_id === tvId
      && (buoi.find(b => b.id === d.buoi_id) || {}).dot_id === tc.dot_id
      && (buoi.find(b => b.id === d.buoi_id) || {}).phan === tc.phan).map(d => d.buoi_id)).size >= (tc.so_buoi || 1);
    if (tc.loai === 'diem_tong') return diem !== null && diem !== undefined && diem >= (tc.nguong || 0);
    if (tc.loai === 'gui_phieu') return phieuDaGui.some(g => g.phieu_id === tc.phieu_id && g.thanh_vien_id === tvId);
    return false;
  };
  const xetMotDemo = (dotId, tvId) => {
    const diem = diemTongDemo(dotId, tvId);
    const tcs = tieuChi.filter(x => x.dot_id === dotId).sort((a, b) => a.thu_tu - b.thu_tu);
    const thieuCot = tcs.filter(x => x.cot_loi && !datTieuChiDemo(x, tvId, diem)).map(x => x.ten);
    const thieuBo = tcs.filter(x => !x.cot_loi && !datTieuChiDemo(x, tvId, diem)).map(x => x.ten);
    const soBuoi = new Set(dd.filter(d => d.thanh_vien_id === tvId && (buoi.find(b => b.id === d.buoi_id) || {}).dot_id === dotId).map(d => d.buoi_id)).size;
    const nguong = ((dot.find(x => x.id === dotId) || {}).cai_dat || {}).nguong_xuat_sac;
    let muc;
    if (thieuCot.length) muc = soBuoi > 0 ? 'tham_du' : 'chua_hoan_thanh';
    else if (thieuBo.length) muc = 'hoan_thanh_ghi_chu';
    else if (nguong !== null && nguong !== undefined && diem !== null && diem >= Number(nguong)) muc = 'xuat_sac';
    else muc = 'hoan_thanh';
    return { muc, diem_tong: diem, so_buoi_co_mat: soBuoi, thieu_cot_loi: thieuCot, thieu_bo_sung: thieuBo,
      ghi_chu: thieuBo.length && !thieuCot.length ? 'Chưa có: ' + thieuBo.join(', ') : null };
  };

  const gioi =(ms = 60) => new Promise(r => setTimeout(r, ms));
  const tt = (b, t) => {
    const d = dd.find(x => x.buoi_id === b.id && x.thanh_vien_id === t.id);
    const x = don.find(y => y.buoi_id === b.id && y.thanh_vien_id === t.id && y.trang_thai === 'duyet');
    if (!d) return { trang_thai: x ? 'phep' : 'vang', luc: null, ra_luc: null, tre_phut: null, cach: null, ly_do: x ? x.ly_do : null };
    const tre = d.cach !== 'bo_sung' && new Date(d.luc) > new Date(new Date(b.bat_dau).getTime() + b.tre_sau_phut * 60e3);
    return { trang_thai: tre ? 'tre' : 'dung', luc: d.luc, ra_luc: d.ra_luc || null, tre_phut: tre ? Math.ceil((new Date(d.luc) - new Date(b.bat_dau)) / 60e3) : null, cach: d.cach, ly_do: null };
  };
  /* Danh sách của một buổi, y như noi_bo.dong_diem_danh sau migration 0014:
     buổi CLB thì thành viên CLB, buổi đợt thì học viên của đợt, ca phải đăng ký thì người đã đăng ký. */
  const nguoiCuaBuoi = (b) => {
    if (!b) return [];
    if (!b.dot_id) return tv.filter(t => t.hoat_dong);
    if (b.can_dang_ky) return dangKy.filter(k => k.buoi_id === b.id).map(k => hv.find(h => h.id === k.thanh_vien_id)).filter(Boolean);
    return dotHv.filter(x => x.dot_id === b.dot_id && x.trang_thai === 'ghi_danh').map(x => hv.find(h => h.id === x.thanh_vien_id)).filter(Boolean);
  };
  const trongBuoi = (b, id) => nguoiCuaBuoi(b).some(t => t.id === id);
  const dem = (ds) => { const o = { tong: ds.length, dung: 0, tre: 0, phep: 0, vang: 0 }; ds.forEach(x => { o[x]++; }); return o; };
  const cham = (l, tl, tuDong) => {
    const cs = cau.filter(c => c.bai_id === l.bai_id), d = cs.filter(c => tl[c.id] === c.dung).length;
    Object.assign(l, { tra_loi: tl, nop_luc: new Date().toISOString(), tu_dong: tuDong, so_dung: d, tong: cs.length, diem: Math.round(d * 1000 / cs.length) / 100 });
    return l;
  };
  const coBoSung = (r, o) => Object.assign(r, o);

  return {
    coPhien: () => phien,
    async dangNhap() { phien = true; },
    async dangXuat() { phien = false; },
    async doiMatKhau() {},
    async kichHoat() {},
    async theCongKhai(k) { await gioi(); const t = tv.find(x => x.khoa_qr === k); return t ? { ho_ten: t.ho_ten, gen: t.gen, nha: t.nha, cap: t.cap, hoat_dong: t.hoat_dong } : null; },
    async toi() {
      if (hvDangNhap) {
        const t = hv.find(x => x.id === hvDangNhap), ds = dotCuaHV(t.id);
        return { id: t.id, ma: t.ma, ho_ten: t.ho_ten, loai: 'hoc_vien', hoat_dong: t.hoat_dong, khoa_qr: t.khoa_qr, email: t.email,
          dot: ds, chi_doc: !ds.some(d => d.trang_thai === 'mo'), bay_gio: new Date().toISOString() };
      }
      const t = me(), bcv = t.cap === 'Ban cố vấn', pt = t.vai_tro !== 'thanh_vien' || bcv;
      return Object.assign({}, t, { la_admin: t.vai_tro === 'quan_tri', la_quan_tri: t.vai_tro === 'quan_tri' || bcv, la_phu_trach: pt, xem_duoc_ten: pt, lich_moi_nha: pt, lich_nha: t.chuc_vu ? t.nha : null,
        lich_duoc_giao: pcCua(t.id).map(p => ({ nha: p.nha, den_ngay: p.den_ngay })),
        buoi_diem_danh: giao.filter(g => g.thanh_vien_id === t.id && !buoi.find(b => b.id === g.buoi_id).dong).map(g => g.buoi_id),
        btc_dot: dotBtc.filter(b => b.thanh_vien_id === t.id).map(b => ({ dot_id: b.dot_id, vai: b.vai })),
        bay_gio: new Date().toISOString() });
    },
    async caiDat() { return Object.assign({}, caiDat); },
    async datCaiDat(k, v) { caiDat[k] = v; },
    async maDongCuaToi() { await gioi(); const t = hvDangNhap ? hv.find(x => x.id === hvDangNhap) : me(); return { ma: t.ma, bi_mat: 'demo-' + t.id, bay_gio: new Date().toISOString() }; },
    async dsPhanCongLich() { return phanCong.map(p => Object.assign({}, p)); },
    async datPhanCongLich(nha, ids, den) {
      if (!(me().vai_tro === 'quan_tri' || me().cap === 'Ban cố vấn')) throw new Error('Chỉ quản trị và Ban cố vấn được phân công soạn lịch');
      if (den && den < ngayVN(Date.now())) throw new Error('Ngày hết hạn đã qua');
      for (let i = phanCong.length - 1; i >= 0; i--) if (phanCong[i].nha === nha && !ids.includes(phanCong[i].thanh_vien_id)) phanCong.splice(i, 1);
      ids.forEach(id => { const p = phanCong.find(x => x.nha === nha && x.thanh_vien_id === id); if (p) p.den_ngay = den || null; else phanCong.push({ thanh_vien_id: id, nha, den_ngay: den || null }); });
    },
    async nguoiDiemDanh(b) { return giao.filter(g => g.buoi_id === b).map(g => ({ thanh_vien_id: g.thanh_vien_id })); },
    async datNguoiDiemDanh(b, ids) { for (let i = giao.length - 1; i >= 0; i--) if (giao[i].buoi_id === b) giao.splice(i, 1); ids.forEach(x => giao.push({ buoi_id: b, thanh_vien_id: x })); },
    async dsThanhVien() { await gioi(); return tv.map(t => Object.assign({}, t)); },
    async themThanhVien(o) { const t = Object.assign({ id: uid(), khoa_qr: uid().padEnd(16, '0').slice(0, 16) }, o); tv.push(t); return t; },
    async suaThanhVien(id, o) { coBoSung(tv.find(t => t.id === id), o); },
    async tinhTrangKichHoat() { return tv.map((t, i) => ({ thanh_vien_id: t.id, da_kich_hoat: i < 7, ma_con_han: i === 7 })); },
    async capMaKichHoat(ids) { return ids.map(i => { const t = tv.find(x => x.id === i); return { id: i, ma: t.ma, ho_ten: t.ho_ten, ma_kich_hoat: 'DEMO' + uid().slice(1, 5).toUpperCase() }; }); },
    async dsBuoi(tu, den) { await gioi(); return buoi.filter(b => !b.dot_id && (!tu || new Date(b.bat_dau) >= new Date(tu)) && (!den || new Date(b.bat_dau) <= new Date(den))).sort((a, b) => new Date(a.bat_dau) - new Date(b.bat_dau)).map(b => Object.assign({}, b)); },
    async themBuoi(o) { const b = Object.assign({ id: uid(), dong: false }, o); buoi.push(b); return b; },
    async suaBuoi(id, o) { coBoSung(buoi.find(b => b.id === id), o); },
    async xoaBuoi(id) { buoi.splice(buoi.findIndex(b => b.id === id), 1); },
    async ghiDiemDanh(p) {
      await gioi(150);
      if (!duocQuet(p.buoi)) throw new Error('Bạn chưa được giao điểm danh buổi này');
      const b = buoi.find(x => x.id === p.buoi), luc = p.luc || new Date().toISOString();
      let t = null, cach = p.cach || 'qr';
      const ai = [...tv, ...hv];
      const m = String(p.khoa || '').match(/^NKTV1\.((?:NKTV-\d+|HV\d+))\.(\d+)\.([0-9a-f]{12})$/i);
      if (m) {
        t = ai.find(x => x.ma === m[1]);
        if (!t || m[3].toLowerCase() !== await kyMa(m[1], m[2], 'demo-' + t.id)) return { ok: false, loi: 'Mã không hợp lệ.' };
        const lech = new Date(luc).getTime() / 1000 - Number(m[2]) * 20;
        if (lech < -30 || lech > 60) return { ok: false, het_han: true, id: t.id, ho_ten: t.ho_ten, loi: 'Mã đã hết hạn, có thể là ảnh chụp. Nhờ bạn mở lại mã trên app.' };
        cach = 'ma_dong';
      } else if (p.khoa) {
        t = ai.find(x => x.khoa_qr === p.khoa);
        if (t && caiDat.chi_nhan_ma_dong && cach !== 'tay') return { ok: false, ma_cu: true, id: t.id, ho_ten: t.ho_ten, loi: 'Mã cố định trên thẻ hoặc ảnh chụp không dùng để điểm danh. Nhờ bạn mở app → Mã điểm danh của tôi.' };
      } else t = ai.find(x => x.id === p.tv);
      if (!t) return { ok: false, loi: 'Mã này không thuộc thành viên nào.' };
      // Người quét phải thuộc danh sách của đúng buổi này (migration 0014).
      if (!b.dot_id && t.loai === 'hoc_vien') return { ok: false, id: t.id, ho_ten: t.ho_ten, loi: 'Đây là mã của học viên tập huấn, không thuộc buổi sinh hoạt CLB.' };
      if (b.dot_id && !trongBuoi(b, t.id)) {
        return { ok: false, id: t.id, ho_ten: t.ho_ten,
          loi: b.can_dang_ky && dotHv.some(x => x.dot_id === b.dot_id && x.thanh_vien_id === t.id && x.trang_thai === 'ghi_danh')
            ? t.ho_ten + ' chưa đăng ký ca này. Xếp vào ca rồi điểm danh lại.'
            : 'Người này không có tên trong đợt tập huấn này.' };
      }
      const cu = dd.find(x => x.buoi_id === p.buoi && x.thanh_vien_id === t.id);
      const coRa = b.ra_sau_phut !== null && b.ra_sau_phut !== undefined;
      let la_ra = false, con_phut = null;
      if (!cu) dd.push({ buoi_id: p.buoi, thanh_vien_id: t.id, luc, cach, ra_luc: null });
      else if (coRa && cu.ra_luc) la_ra = true;
      else if (coRa && new Date(luc).getTime() >= new Date(cu.luc).getTime() + b.ra_sau_phut * 60e3) { cu.ra_luc = luc; la_ra = true; }
      else if (coRa) con_phut = Math.max(1, Math.ceil((new Date(cu.luc).getTime() + b.ra_sau_phut * 60e3 - new Date(luc).getTime()) / 60e3));
      const r = tt(b, t);
      return { ok: true, moi: !cu, ra: la_ra, con_phut, id: t.id, ma: t.ma, ho_ten: t.ho_ten, gen: t.gen ?? null, nha: t.nha ?? null, cap: t.cap ?? null,
        loai: t.loai, hoat_dong: t.hoat_dong, luc: r.luc, ra_luc: r.ra_luc, cach, tre_phut: r.tre_phut };
    },
    async datGioRa(bId, tvId, luc) {
      if (!duocQuet(bId)) throw new Error('Bạn chưa được giao điểm danh buổi này');
      const cu = dd.find(x => x.buoi_id === bId && x.thanh_vien_id === tvId);
      if (!cu) return { ok: false, loi: 'Người này chưa điểm danh vào.' };
      if (luc && new Date(luc) < new Date(cu.luc)) return { ok: false, loi: 'Giờ ra không thể trước giờ vào.' };
      cu.ra_luc = luc || null;
      return { ok: true, luc: cu.luc, ra_luc: cu.ra_luc };
    },
    async xoaDiemDanh(b, t) { const i = dd.findIndex(x => x.buoi_id === b && x.thanh_vien_id === t); if (i >= 0) dd.splice(i, 1); },
    async bangDiemDanh(id) {
      await gioi();
      const b = buoi.find(x => x.id === id);
      if (b && b.dot_id && !thayDuocDot(b.dot_id)) return [];
      return nguoiCuaBuoi(b).map(t => Object.assign({ thanh_vien_id: t.id, ma: t.ma, ho_ten: t.ho_ten, gen: t.gen ?? null, nha: t.nha ?? null, cap: t.cap ?? null }, tt(b, t)));
    },
    async soTongBuoi(id) {
      const b = buoi.find(x => x.id === id);
      const o = dem(nguoiCuaBuoi(b).map(t => tt(b, t).trang_thai));
      return Object.assign(o, { da_ra: nguoiCuaBuoi(b).filter(t => tt(b, t).ra_luc).length });
    },
    async chuyenCan(id) {
      const t = tv.find(x => x.id === id) || hv.find(x => x.id === id);
      if (!t) return dem([]);
      return dem(buoi.filter(b => b.dong && b.tinh_chuyen_can && trongBuoi(b, t.id)).map(b => tt(b, t).trang_thai));
    },
    async lichSuCuaToi(tu, den) { const t = me(); return buoi.filter(b => !b.dot_id && new Date(b.bat_dau) >= new Date(tu) && new Date(b.bat_dau) <= new Date(den)).map(b => Object.assign({ buoi_id: b.id }, tt(b, t))); },
    async diemNhom() {
      await gioi();
      const kq = [], r1 = (x) => x === null ? null : Math.round(x * 10) / 10;
      buoi.filter(b => !b.dot_id && b.dong && b.tinh_chuyen_can).forEach(b => {
        const bt = bai.filter(x => x.buoi_id === b.id && x.trang_thai === 'mo');
        NHA.forEach(n => {
          const ds = tv.filter(t => t.hoat_dong && t.nha === n && t.cap !== 'Ban cố vấn').map(t => ({ t, s: tt(b, t).trang_thai }));
          if (!ds.length) return;
          const c = { dung: 0, tre: 0, phep: 0, vang: 0 }; ds.forEach(x => { c[x.s]++; });
          const coMat = ds.filter(x => x.s === 'dung' || x.s === 'tre');
          const lan = (y, t) => lam.filter(l => l.bai_id === y.id && l.thanh_vien_id === t.id && l.nop_luc).map(l => l.diem);
          const diemTV = coMat.map(x => bt.reduce((s, y) => s + Math.max(0, ...lan(y, x.t)), 0) / (bt.length || 1));
          const soLam = coMat.filter(x => bt.some(y => lan(y, x.t).length)).length;
          const mau = ds.length - c.phep, cc = mau ? 60 * (c.dung + 0.5 * c.tre) / mau : null;
          const tb = bt.length && coMat.length ? diemTV.reduce((s, x) => s + x, 0) / coMat.length : null;
          const ts = bt.length ? 40 * (tb || 0) / 10 : null;
          kq.push(Object.assign({ buoi_id: b.id, bat_dau: b.bat_dau, nha: n, so_nguoi: ds.length, co_test: !!bt.length, so_lam: soLam, tb_test: tb, diem_cc: r1(cc), diem_test: r1(ts), tong: r1(cc === null ? null : bt.length ? cc + ts : cc * 100 / 60) }, c));
        });
      });
      return kq;
    },
    async baoCaoChuyenCan() { return tv.filter(t => t.hoat_dong).map(t => Object.assign({ ma: t.ma, ho_ten: t.ho_ten, gen: t.gen, nha: t.nha, cap: t.cap }, dem(buoi.filter(b => !b.dot_id && b.dong).map(b => tt(b, t).trang_thai)))); },
    async donCuaToi(id) { return don.filter(d => d.thanh_vien_id === id).map(d => Object.assign({}, d, { buoi: buoi.find(b => b.id === d.buoi_id) })); },
    async guiXinNghi(b, ly) { const c = don.find(d => d.buoi_id === b && d.thanh_vien_id === me().id); if (c) Object.assign(c, { ly_do: ly, trang_thai: 'cho' }); else don.push({ id: uid(), buoi_id: b, thanh_vien_id: me().id, ly_do: ly, trang_thai: 'cho', gui_luc: new Date().toISOString() }); },
    async huyXinNghi(id) { don.splice(don.findIndex(d => d.id === id), 1); },
    async dsDon(tt_) { return don.filter(d => !tt_ || d.trang_thai === tt_).map(d => Object.assign({}, d, { buoi: buoi.find(b => b.id === d.buoi_id), thanh_vien: tv.find(t => t.id === d.thanh_vien_id) })); },
    async xuLyDon(id, duyet, ph) { Object.assign(don.find(d => d.id === id), { trang_thai: duyet ? 'duyet' : 'tu_choi', phan_hoi: ph }); },
    async ghiVangPhep(b, t, ly) { don.push({ id: uid(), buoi_id: b, thanh_vien_id: t, ly_do: ly || 'Ghi hộ', trang_thai: 'duyet', gui_luc: new Date().toISOString() }); },
    async dsThongBao() { await gioi(); return tb.slice().sort((a, b) => b.ghim - a.ghim || new Date(b.dang_luc) - new Date(a.dang_luc)); },
    async daDoc() { return doc.slice(); },
    async danhDauDoc(id) { doc.push(id); },
    async themThongBao(o) { tb.push(Object.assign({ id: uid(), dang_luc: new Date().toISOString(), ghim: false }, o)); },
    async suaThongBao(id, o) { coBoSung(tb.find(x => x.id === id), o); },
    async xoaThongBao(id) { tb.splice(tb.findIndex(x => x.id === id), 1); },
    async dsNangLuc() { return nl.slice(); },
    async themNangLuc(o) { nl.push(Object.assign({ id: uid() }, o)); },
    async suaNangLuc(id, o) { coBoSung(nl.find(x => x.id === id), o); },
    async xoaNangLuc() {},
    async ghiNhanCua(id) { return gn.filter(g => g.thanh_vien_id === id); },
    async guiNangLuc(o) { const c = gn.find(g => g.thanh_vien_id === me().id && g.nang_luc_id === o.p_nang_luc && g.bac === o.p_bac); const m = { trang_thai: o.p_trang_thai, minh_chung: o.p_minh_chung, lien_ket: o.p_lien_ket, gui_luc: new Date().toISOString() }; if (c) Object.assign(c, m); else gn.push(Object.assign({ id: uid(), thanh_vien_id: me().id, nang_luc_id: o.p_nang_luc, bac: o.p_bac }, m)); },
    async xuLyNangLuc(id, duyet, ngay_) { Object.assign(gn.find(g => g.id === id), { trang_thai: duyet ? 'dat' : 'tu_choi', ngay_dat: ngay_ }); },
    async nangLucCho() { return gn.filter(g => g.trang_thai === 'cho').map(g => Object.assign({}, g, { nang_luc: nl.find(n => n.id === g.nang_luc_id), thanh_vien: tv.find(t => t.id === g.thanh_vien_id) })); },
    async hoatDongCua(id) { return hd.filter(x => x.thanh_vien_id === id); },
    async guiHoatDong(o) { hd.unshift({ id: uid(), thanh_vien_id: me().id, loai: o.p_loai, ten: o.p_ten, ngay: o.p_ngay, so_gio: o.p_so_gio, lien_ket: o.p_lien_ket, trang_thai: 'cho', gui_luc: new Date().toISOString() }); },
    async xuLyHoatDong(id, duyet) { Object.assign(hd.find(x => x.id === id), { trang_thai: duyet ? 'dat' : 'tu_choi' }); },
    async hoatDongCho() { return hd.filter(x => x.trang_thai === 'cho').map(x => Object.assign({}, x, { thanh_vien: tv.find(t => t.id === x.thanh_vien_id) })); },
    async diemTestCua(id) { return lam.filter(l => l.thanh_vien_id === id && l.nop_luc).map(l => ({ diem: l.diem, nop_luc: l.nop_luc, bai_id: l.bai_id, bai_test: bai.find(b => b.id === l.bai_id) })); },
    async dsLich() { await gioi(); return lich.slice(); },
    async docLich(id) { return lich.find(l => l.id === id); },
    async lichCuaBuoi(b) { return lich.find(l => l.buoi_id === b); },
    async luuLich(id, d, gui) {
      if (!soanDuoc(d.nhom)) throw new Error('Bạn chưa được soạn lịch cho nhà này. Nhóm trưởng, nhóm phó của nhà, người được phân công, Ban cố vấn và người phụ trách soạn được.');
      const ten = d.mau === 'dacbiet' ? d.tenCT : 'Lịch sinh hoạt tuần';
      let l = lich.find(x => x.id === id);
      if (!l) { l = { id: uid(), nguoi_tao: me().id, nguoi_tao_ten: me().ho_ten, trang_thai: 'nhap' }; lich.unshift(l); }
      Object.assign(l, { du_lieu: d, nhom: d.nhom, ngay: d.ngay, ten, loai: d.mau, sua_luc: new Date().toISOString(), nguoi_sua_ten: me().ho_ten });
      if (gui) {
        l.trang_thai = 'da_gui'; l.gui_luc = l.gui_luc || new Date().toISOString();
        const bd = new Date(`${d.ngay}T${d.gioBD || '14:00'}:00+07:00`).toISOString();
        const o = { ten: d.mau === 'tuan' ? 'Sinh hoạt hằng tuần' : d.tenCT, bat_dau: bd, dia_diem: [d.dd1, d.dd2].filter(Boolean).join(', '), nhom_truc: d.nhom === 'koi' ? 'Yin-Yang Kois' : d.nhom[0].toUpperCase() + d.nhom.slice(1), chu_tri: d.chuTri, noi_dung: d.rows.map(r => `${r.t1} ${r.title}`).join('\n') };
        const c = buoi.find(b => b.id === l.buoi_id);
        if (c) Object.assign(c, o); else { const b = Object.assign({ id: uid(), tre_sau_phut: 10, tinh_chuyen_can: d.mau === 'tuan', dong: false, ket_thuc: null }, o); buoi.push(b); l.buoi_id = b.id; }
      }
      return { id: l.id, buoi_id: l.buoi_id, trang_thai: l.trang_thai };
    },
    async xoaLich(id) { lich.splice(lich.findIndex(l => l.id === id), 1); },
    async baiCuaToi() {
      return bai.filter(b => b.trang_thai === 'mo').map(b => {
        const ls = lam.filter(l => l.bai_id === b.id && l.thanh_vien_id === me().id), g = ls.filter(l => l.nop_luc), d = ls.find(l => !l.nop_luc);
        const u = buoi.find(x => x.id === b.buoi_id);
        return Object.assign({}, b, { so_cau: cau.filter(c => c.bai_id === b.id).length, da_gui: g.length, diem: g.length ? Math.max(...g.map(l => l.diem)) : null, dang_lam_den: d ? d.han_luc : null,
          buoi_ten: u ? u.ten : null, buoi_bat_dau: u ? u.bat_dau : null, da_diem_danh: daDiemDanh(b.buoi_id, me().id) });
      });
    },
    async batDauBai(id) {
      const b = bai.find(x => x.id === id);
      let l = lam.find(x => x.bai_id === id && x.thanh_vien_id === me().id && !x.nop_luc);
      if (!l) {
        if (!daDiemDanh(b.buoi_id, me().id)) throw new Error('Bài test đầu giờ chỉ mở sau khi bạn đã điểm danh buổi này.');
        l = { id: uid(), bai_id: id, thanh_vien_id: me().id, han_luc: new Date(Date.now() + b.thoi_gian_phut * 60e3).toISOString(), tra_loi: {} }; lam.push(l);
      }
      return { lam_id: l.id, han_luc: l.han_luc, bay_gio: new Date().toISOString(), tra_loi: l.tra_loi, tieu_de: b.tieu_de, mo_ta: b.mo_ta, cau: cau.filter(c => c.bai_id === id).map(c => ({ id: c.id, phan: c.phan, noi_dung: c.noi_dung, lua_chon: c.lua_chon, hinh: c.hinh })) };
    },
    async luuTamBai(id, tl) { lam.find(l => l.id === id).tra_loi = tl; },
    async guiBai(id, tl) { const l = cham(lam.find(x => x.id === id), tl, false); return { so_dung: l.so_dung, tong: l.tong, diem: l.diem }; },
    async xemLaiBai(id) {
      const b = bai.find(x => x.id === id), l = lam.filter(x => x.bai_id === id && x.thanh_vien_id === me().id && x.nop_luc)[0];
      const duoc = b.hien_dap_an === 'sau_gui';
      return { tieu_de: b.tieu_de, so_dung: l.so_dung, tong: l.tong, diem: l.diem, nop_luc: l.nop_luc, tu_dong: false, hien_dap_an: duoc, hien_dap_an_kieu: b.hien_dap_an, dong_luc: b.dong_luc, cau: duoc ? cau.filter(c => c.bai_id === id).map(c => ({ noi_dung: c.noi_dung, lua_chon: c.lua_chon, hinh: c.hinh, chon: l.tra_loi[c.id], dung: c.dung })) : null };
    },
    async dsBaiQuanTri() { return bai.map(b => { const u = buoi.find(x => x.id === b.buoi_id); return Object.assign({}, b, { cau_hoi: cau.filter(c => c.bai_id === b.id), buoi: u ? { bat_dau: u.bat_dau } : null }); }); },
    async docBaiQuanTri(id) { return Object.assign({}, bai.find(b => b.id === id), { cau: cau.filter(c => c.bai_id === id).map(c => Object.assign({}, c, { lua_chon: c.lua_chon.slice() })) }); },
    async luuBaiTest(p) {
      const id = p.id || uid(), c = bai.find(b => b.id === id);
      const m = { id, tieu_de: p.tieu_de, mo_ta: p.mo_ta, thoi_gian_phut: p.thoi_gian_phut, mo_luc: p.mo_luc, dong_luc: p.dong_luc, so_lan: p.so_lan, hien_dap_an: p.hien_dap_an, trang_thai: p.trang_thai, buoi_id: p.buoi_id || null, tao_luc: new Date().toISOString() };
      if (c) Object.assign(c, m); else bai.push(m);
      for (let i = cau.length - 1; i >= 0; i--) if (cau[i].bai_id === id) cau.splice(i, 1);
      p.cau.forEach(x => cau.push(Object.assign({ id: uid(), bai_id: id }, x)));
      return id;
    },
    async xoaBaiTest(id) { bai.splice(bai.findIndex(b => b.id === id), 1); },
    async dsThiSinh() { await gioi(); return thiSinh.map(t => Object.assign({}, t)); },
    async dsDanhGiaTQ() {
      const t = me(), xem = t.vai_tro === 'quan_tri' || t.cap === 'Ban cố vấn' || (Array.isArray(caiDat.tq_xem_ket_qua) && caiDat.tq_xem_ket_qua.includes(t.id));
      return phieuTQ.filter(p => xem || p.thanh_vien_id === t.id).map(p => JSON.parse(JSON.stringify(p)));
    },
    async luuDanhGiaTQ(ts, p) {
      await gioi();
      const KEY = ['phong_thai', 'eye_contact', 'giong_noi', 'mach_y', 'tac_phong', 'thai_do', 'giao_tiep', 'hoa_dong', 'thich_nghi', 'to_chuc', 'ap_luc', 'trach_nhiem', 'chia_se', 'cau_tien'];
      if (KEY.some(k => !(p.diem[k] >= 1 && p.diem[k] <= 5))) throw new Error('Chưa chấm đủ các mục');
      if (!p.thuoc_nha || !String(p.nhan_xet_tt).trim() || !String(p.nhan_xet_tp).trim() || !p.ket_luan) throw new Error('Phiếu còn thiếu');
      const t = me(), cu = phieuTQ.find(x => x.thi_sinh_id === ts && x.thanh_vien_id === t.id), bay = new Date().toISOString();
      const moi = { thuoc_nha: p.thuoc_nha, diem: JSON.parse(JSON.stringify(p.diem)), nhan_xet_tt: p.nhan_xet_tt.trim(), nhan_xet_tp: p.nhan_xet_tp.trim(), ket_luan: p.ket_luan, nguoi_ten: t.ho_ten, sua_luc: bay };
      if (cu) Object.assign(cu, moi); else phieuTQ.push(Object.assign({ id: uid(), thi_sinh_id: ts, thanh_vien_id: t.id, gui_luc: bay }, moi));
      return true;
    },
    async ghiChuTQ(tvId) { return ghiChuTQ.filter(g => g.thanh_vien_id === tvId).map(g => Object.assign({}, g)); },
    async luuGhiChuTQ(ts, tvId, noiDung) {
      const cu = ghiChuTQ.find(g => g.thi_sinh_id === ts && g.thanh_vien_id === tvId), bay = new Date().toISOString();
      if (cu) Object.assign(cu, { noi_dung: noiDung, sua_luc: bay }); else ghiChuTQ.push({ thi_sinh_id: ts, thanh_vien_id: tvId, noi_dung: noiDung, sua_luc: bay });
    },
    /* ---------- Tập huấn ---------- */
    async dsDot() {
      await gioi();
      if (!xemDuocDot()) return [];
      return dot.map(d => Object.assign({}, d, {
        so_hoc_vien: dotHv.filter(x => x.dot_id === d.id && x.trang_thai === 'ghi_danh').length,
        so_kich_hoat: dotHv.filter(x => x.dot_id === d.id && x.trang_thai === 'ghi_danh' && (hv.find(h => h.id === x.thanh_vien_id) || {}).user_id).length,
        cai_dat: d.cai_dat || {},
        zalo_link: d.zalo_link || null, co_zalo_qr: !!d.zalo_qr,
        la_btc: laBtcDot(d.id)
      }));
    },
    async luuDot(id, p) {
      await gioi();
      const t = me();
      if (!id) {
        if (!(t.vai_tro === 'quan_tri' || t.cap === 'Ban cố vấn')) throw new Error('Chỉ quản trị và Ban cố vấn được tạo đợt');
        const ma = String(p.ma || '').trim().toUpperCase();
        if (dot.some(d => d.ma === ma)) throw new Error('Mã đợt này đã có');
        const moi = { id: uid(), ma, ten: String(p.ten || '').trim(), nam_hoc: p.nam_hoc || null, mo_ta: p.mo_ta || null, bat_dau: p.bat_dau || null, ket_thuc: p.ket_thuc || null, trang_thai: 'soan' };
        dot.push(moi);
        return moi.id;
      }
      if (!laBtcDot(id)) throw new Error('Chỉ Ban tổ chức của đợt được sửa đợt');
      const d = dot.find(x => x.id === id);
      if (!d) throw new Error('Không tìm thấy đợt');
      ['ten', 'nam_hoc', 'mo_ta', 'bat_dau', 'ket_thuc', 'trang_thai'].forEach(k => { if (p[k]) d[k] = p[k]; });
      ['zalo_link', 'zalo_qr'].forEach(k => { if (k in p) d[k] = String(p[k] || '').trim() || null; });
      if (d.zalo_link && !/^https?:\/\//i.test(d.zalo_link)) throw new Error('Link nhóm Zalo phải bắt đầu bằng https://');
      return id;
    },
    async btcCuaDot(id) { await gioi(); return dotBtc.filter(b => b.dot_id === id).map(b => ({ thanh_vien_id: b.thanh_vien_id, vai: b.vai })); },
    async datBtcDot(id, p) {
      await gioi();
      const t = me();
      if (!(t.vai_tro === 'quan_tri' || t.cap === 'Ban cố vấn' || dotBtc.some(b => b.dot_id === id && b.thanh_vien_id === t.id && b.vai === 'truong_ban'))) throw new Error('Chỉ quản trị hoặc trưởng ban của đợt được phân vai');
      for (let i = dotBtc.length - 1; i >= 0; i--) if (dotBtc[i].dot_id === id) dotBtc.splice(i, 1);
      p.forEach(x => { if (tv.some(y => y.id === x.thanh_vien_id)) dotBtc.push({ dot_id: id, thanh_vien_id: x.thanh_vien_id, vai: x.vai }); });
    },
    async dsHocVienDot(id) {
      await gioi();
      if (!laBtcDot(id)) return [];
      return dotHv.filter(x => x.dot_id === id && x.trang_thai === 'ghi_danh').map(x => {
        const t = hv.find(h => h.id === x.thanh_vien_id);
        const th = thuDaGui.filter(z => z.dot_id === id && z.thanh_vien_id === t.id && z.loai === 'ma_kich_hoat').slice(-1)[0];
        return { id: t.id, ma: t.ma, ho_ten: t.ho_ten, email: t.email, mssv: t.mssv, lop: t.lop,
          da_kich_hoat: !!t.user_id, ma_con_han: !!t.ma_con_han, trang_thai: x.trang_thai, ghi_danh_luc: x.ghi_danh_luc,
          thu_luc: th ? th.luc : null, thu_trang_thai: th ? th.trang_thai : null };
      }).sort((a, b) => a.ho_ten.localeCompare(b.ho_ten, 'vi'));
    },
    async napDanhSachHV(id, ds, ghi) {
      await gioi(240);
      if (!laBtcDot(id)) throw new Error('Chỉ Ban tổ chức của đợt được nạp danh sách');
      if (!Array.isArray(ds)) throw new Error('Danh sách phải là một mảng');
      if (ds.length > 1000) throw new Error('Mỗi lần nạp tối đa 1000 dòng');
      const daGap = new Map(), ket = [], dem = { moi: 0, da_co_tai_khoan: 0, da_trong_dot: 0, loi: 0 };
      ds.forEach((r, i) => {
        const email = String(r.email || '').trim().toLowerCase(), ten = chuanTenHV(r.ho_ten);
        let tt = null, ly_do = null, ma = null, ma_kich_hoat = null;
        let cu = hv.find(h => h.email === email);
        if (!emailHopLe(email)) { tt = 'loi'; ly_do = email ? 'Email không đúng: ' + email : 'Thiếu email'; }
        else if (daGap.has(email)) { tt = 'loi'; ly_do = 'Trùng email với dòng ' + daGap.get(email) + ' trong chính tệp này'; }
        else {
          daGap.set(email, r.dong || String(i + 1));
          if (!cu && !ten) { tt = 'loi'; ly_do = 'Thiếu họ tên'; }
          else if (cu && dotHv.some(x => x.dot_id === id && x.thanh_vien_id === cu.id && x.trang_thai === 'ghi_danh')) tt = 'da_trong_dot';
          else if (cu) tt = 'da_co_tai_khoan';
          else tt = 'moi';
        }
        if (ghi && (tt === 'moi' || tt === 'da_co_tai_khoan')) {
          if (tt === 'moi') {
            hvSo++;
            cu = { id: uid(), ma: 'HV' + String(hvSo).padStart(5, '0'), ho_ten: ten, loai: 'hoc_vien', hoat_dong: true, user_id: null, khoa_qr: uid(),
              email, mssv: r.mssv || null, lop: r.lop || null, ma_con_han: true };
            hv.push(cu);
            ma_kich_hoat = maKichHoat();
          } else {
            // Bổ sung ô còn trống, không ghi đè thông tin cũ.
            ['mssv', 'lop'].forEach(k => { if (!cu[k] && r[k]) cu[k] = r[k]; });
          }
          ma = cu.ma;
          dotHv.push({ dot_id: id, thanh_vien_id: cu.id, trang_thai: 'ghi_danh', ghi_danh_luc: new Date().toISOString(), ghi_chu: null });
        }
        dem[tt]++;
        ket.push({ dong: r.dong || String(i + 1), id: ghi && cu ? cu.id : null, ho_ten: ten || r.ho_ten || '', email, tinh_trang: tt, ly_do, ma, ma_kich_hoat });
      });
      return { da_ghi: !!ghi, dem, ds: ket };
    },
    async capMaKichHoatHV(id, ids) {
      await gioi();
      if (!laBtcDot(id)) throw new Error('Chỉ Ban tổ chức của đợt được cấp mã');
      return ids.map(x => hv.find(h => h.id === x))
        .filter(t => t && dotHv.some(g => g.dot_id === id && g.thanh_vien_id === t.id && g.trang_thai === 'ghi_danh'))
        .sort((a, b) => a.ma.localeCompare(b.ma))
        .map(t => { t.ma_con_han = true; return { id: t.id, ma: t.ma, ho_ten: t.ho_ten, email: t.email, ma_kich_hoat: maKichHoat() }; });
    },

    /* ---------- Gửi thư (migration 0016) ----------
       Không có thư nào rời máy. Cứ người thứ hai thì báo lỗi để thấy nhánh "chưa gửi được". */
    async guiThu(than) {
      await gioi(400);
      const t = me();
      if (than.viec === 'kiem') {
        if (t.vai_tro !== 'quan_tri') throw new Error('Chỉ quản trị làm được việc này.');
        return { ok: true, co_khoa: true, co_dia_chi: !!caiDat.thu.dia_chi_gui, bat: caiDat.thu.bat === true,
          ten_nguoi_gui: caiDat.thu.ten_nguoi_gui, dia_chi_gui: caiDat.thu.dia_chi_gui, tra_loi_toi: caiDat.thu.tra_loi_toi, app_url: caiDat.thu.app_url };
      }
      if (than.viec === 'thu') {
        if (t.vai_tro !== 'quan_tri') throw new Error('Chỉ quản trị làm được việc này.');
        thuDaGui.push({ id: uid(), dot_id: null, thanh_vien_id: null, email: than.email, loai: 'thu_thu', trang_thai: 'da_gui', loi: null, luc: new Date().toISOString(), gui_boi: t.id });
        return { ok: true };
      }
      if (!laBtcDot(than.dot_id)) throw new Error('Chỉ trưởng ban, thư ký của đợt và quản trị được gửi thư.');
      if (caiDat.thu.bat !== true) throw new Error('Gửi thư đang tắt. Quản trị bật ở Quản lý › Gửi thư.');
      const ds = (than.ds || []).map((x, i) => {
        const n = hv.find(z => z.id === x.id);
        const trong = n && dotHv.some(g => g.dot_id === than.dot_id && g.thanh_vien_id === n.id && g.trang_thai === 'ghi_danh');
        if (!trong) return { id: x.id, email: '', ok: false, loi: 'Không có tên trong đợt này' };
        const hong = i % 2 === 1;
        return { id: n.id, email: n.email, ok: !hong, loi: hong ? 'Hộp thư không nhận được' : undefined };
      });
      ds.forEach(r => thuDaGui.push({ id: uid(), dot_id: than.dot_id, thanh_vien_id: r.id, email: r.email, loai: 'ma_kich_hoat',
        trang_thai: r.ok ? 'da_gui' : 'loi', loi: r.loi || null, luc: new Date().toISOString(), gui_boi: t.id }));
      return { ok: true, da_gui: ds.filter(r => r.ok).length, loi: ds.filter(r => !r.ok).length, ds };
    },
    async dsThuDaGui(id) {
      await gioi();
      if (!laBtcDot(id)) return [];
      return thuDaGui.filter(x => x.dot_id === id).map(x => {
        const n = hv.find(z => z.id === x.thanh_vien_id);
        return Object.assign({}, x, { ho_ten: n ? n.ho_ten : null, ma: n ? n.ma : null, gui_boi: (tv.find(y => y.id === x.gui_boi) || {}).ho_ten || null });
      }).sort((a, b) => new Date(b.luc) - new Date(a.luc));
    },
    /* ---------- Nhóm Zalo của đợt (migration 0017) ---------- */
    async zaloCuaDot(id) {
      await gioi();
      const d = dot.find(x => x.id === id);
      if (!d) return null;
      const toi = toiId();
      const duoc = me().vai_tro === 'quan_tri' || dotBtc.some(b => b.dot_id === id && b.thanh_vien_id === toi)
        || dotHv.some(g => g.dot_id === id && g.thanh_vien_id === toi && g.trang_thai === 'ghi_danh');
      if (!duoc) return null;
      return { link: d.zalo_link || null, qr: d.zalo_qr || null };
    },
    async dsThuGanDay() {
      await gioi();
      if (me().vai_tro !== 'quan_tri') return [];
      return thuDaGui.map(x => {
        const n = hv.find(z => z.id === x.thanh_vien_id);
        return Object.assign({}, x, { ho_ten: n ? n.ho_ten : '—', ma: n ? n.ma : null,
          ten_dot: (dot.find(d => d.id === x.dot_id) || {}).ten || null,
          gui_boi: (tv.find(y => y.id === x.gui_boi) || {}).ho_ten || null });
      }).sort((a, b) => new Date(b.luc) - new Date(a.luc)).slice(0, 200);
    },

    /* ---------- Trong đợt (migration 0014) ---------- */
    async dsBuoiDot(id) {
      await gioi();
      if (!thayDuocDot(id)) return [];
      const cua = (b, k) => (dd.find(x => x.buoi_id === b.id && x.thanh_vien_id === toiId()) || {})[k] || null;
      return buoi.filter(b => b.dot_id === id).sort((a, c) => new Date(a.bat_dau) - new Date(c.bat_dau)).map(b => Object.assign({}, b, {
        so_dang_ky: dangKy.filter(k => k.buoi_id === b.id).length,
        so_diem_danh: dd.filter(x => x.buoi_id === b.id).length,
        toi_dang_ky: dangKy.some(k => k.buoi_id === b.id && k.thanh_vien_id === toiId()),
        toi_vao: cua(b, 'luc'), toi_ra: cua(b, 'ra_luc')
      }));
    },
    async luuBuoiDot(id, p) {
      await gioi();
      const v = (x) => (x === '' || x === undefined ? null : x);
      const dotId = id ? (buoi.find(b => b.id === id) || {}).dot_id : v(p.dot_id);
      if (!dotId) throw new Error('Buổi này không thuộc đợt tập huấn nào');
      if (!laBtcDot(dotId)) throw new Error('Chỉ trưởng ban, thư ký của đợt và quản trị được sửa buổi');
      if (!String(p.ten || '').trim()) throw new Error('Buổi phải có tên');
      if (!p.bat_dau) throw new Error('Buổi phải có giờ bắt đầu');
      const o = {
        dot_id: dotId, ten: String(p.ten).trim(), bat_dau: p.bat_dau, ket_thuc: v(p.ket_thuc), dia_diem: v(p.dia_diem),
        noi_dung: v(p.noi_dung), phan: v(p.phan), nhom_chon: v(p.nhom_chon), can_dang_ky: !!p.can_dang_ky,
        suc_chua: v(p.suc_chua), mo_dang_ky_tu: v(p.mo_dang_ky_tu), han_dang_ky: v(p.han_dang_ky),
        tre_sau_phut: p.tre_sau_phut ?? 10, ra_sau_phut: v(p.ra_sau_phut),
        tinh_chuyen_can: p.tinh_chuyen_can !== false, dong: !!p.dong, nhom_truc: null, chu_tri: null
      };
      if (id) { Object.assign(buoi.find(b => b.id === id), o); return id; }
      const moi = Object.assign({ id: uid() }, o);
      buoi.push(moi);
      return moi.id;
    },
    async xoaBuoiDot(id) {
      const b = buoi.find(x => x.id === id);
      if (!b || !b.dot_id) throw new Error('Buổi này không thuộc đợt tập huấn nào');
      if (!laBtcDot(b.dot_id)) throw new Error('Chỉ trưởng ban, thư ký của đợt và quản trị được xóa buổi');
      if (dd.some(x => x.buoi_id === id)) throw new Error('Buổi này đã có điểm danh. Đóng buổi thay vì xóa, để giữ lại dữ liệu.');
      buoi.splice(buoi.findIndex(x => x.id === id), 1);
      for (let i = dangKy.length - 1; i >= 0; i--) if (dangKy[i].buoi_id === id) dangKy.splice(i, 1);
    },
    async chonBuoi(id) {
      await gioi(120);
      const b = buoi.find(x => x.id === id);
      if (!b) throw new Error('Không tìm thấy buổi');
      if (!b.dot_id) throw new Error('Buổi này không thuộc đợt tập huấn');
      if (!oTrongDot(b.dot_id)) throw new Error('Bạn không có tên trong đợt này');
      if (!dotDangMo(b.dot_id)) throw new Error('Đợt chưa mở hoặc đã kết thúc');
      if (!b.can_dang_ky) throw new Error('Buổi này không cần đăng ký');
      const bay = Date.now();
      if (b.mo_dang_ky_tu && bay < new Date(b.mo_dang_ky_tu).getTime()) return { ok: false, loi: 'Chưa tới giờ mở đăng ký.' };
      if (b.han_dang_ky && bay > new Date(b.han_dang_ky).getTime()) return { ok: false, loi: 'Đã quá hạn đăng ký.' };
      const sl = dangKy.filter(k => k.buoi_id === id).length;
      if (dangKy.some(k => k.buoi_id === id && k.thanh_vien_id === toiId())) return { ok: true, da_co: true, con_lai: b.suc_chua ? b.suc_chua - sl : null };
      if (b.nhom_chon) {
        const khac = dangKy.map(k => ({ k, x: buoi.find(y => y.id === k.buoi_id) }))
          .find(({ k, x }) => k.thanh_vien_id === toiId() && x && x.dot_id === b.dot_id && x.nhom_chon === b.nhom_chon && x.id !== b.id);
        if (khac) return { ok: false, loi: 'Bạn đã chọn ca ' + khac.x.ten + '. Bỏ ca đó trước rồi chọn lại.' };
      }
      if (b.suc_chua && sl >= b.suc_chua) return { ok: false, het_cho: true, loi: 'Ca này đã đủ ' + b.suc_chua + ' chỗ.' };
      dangKy.push({ buoi_id: id, thanh_vien_id: toiId(), luc: new Date().toISOString() });
      return { ok: true, con_lai: b.suc_chua ? b.suc_chua - sl - 1 : null };
    },
    async boChonBuoi(id) {
      await gioi(120);
      const b = buoi.find(x => x.id === id);
      if (!b || !b.dot_id) throw new Error('Không tìm thấy buổi');
      if (!dotDangMo(b.dot_id)) throw new Error('Đợt chưa mở hoặc đã kết thúc');
      if (b.han_dang_ky && Date.now() > new Date(b.han_dang_ky).getTime()) return { ok: false, loi: 'Đã quá hạn đăng ký, không bỏ ca được nữa. Nhắn Ban tổ chức nếu cần đổi.' };
      if (dd.some(x => x.buoi_id === id && x.thanh_vien_id === toiId())) return { ok: false, loi: 'Bạn đã điểm danh buổi này nên không bỏ được.' };
      const i = dangKy.findIndex(k => k.buoi_id === id && k.thanh_vien_id === toiId());
      if (i >= 0) dangKy.splice(i, 1);
      return { ok: true };
    },
    async dsDangKyBuoi(id) {
      const b = buoi.find(x => x.id === id);
      if (!b || (b.dot_id && !thayDuocDot(b.dot_id))) return [];
      return dangKy.filter(k => k.buoi_id === id).sort((a, c) => new Date(a.luc) - new Date(c.luc)).map(k => {
        const t = [...tv, ...hv].find(x => x.id === k.thanh_vien_id) || {};
        return { thanh_vien_id: k.thanh_vien_id, ma: t.ma, ho_ten: t.ho_ten, luc: k.luc };
      });
    },
    async datDangKyBuoi(id, ids) {
      const b = buoi.find(x => x.id === id);
      if (!b || !b.dot_id) throw new Error('Buổi này không thuộc đợt tập huấn nào');
      if (!laBtcDot(b.dot_id)) throw new Error('Chỉ trưởng ban, thư ký của đợt và quản trị được xếp ca');
      for (let i = dangKy.length - 1; i >= 0; i--) {
        const k = dangKy[i];
        if (k.buoi_id === id && !ids.includes(k.thanh_vien_id) && !dd.some(x => x.buoi_id === id && x.thanh_vien_id === k.thanh_vien_id)) dangKy.splice(i, 1);
      }
      ids.forEach(x => {
        if (!dotHv.some(g => g.dot_id === b.dot_id && g.thanh_vien_id === x && g.trang_thai === 'ghi_danh')) return;
        if (!dangKy.some(k => k.buoi_id === id && k.thanh_vien_id === x)) dangKy.push({ buoi_id: id, thanh_vien_id: x, luc: new Date().toISOString() });
      });
    },
    async dsTaiLieuDot(id) {
      await gioi();
      if (!thayDuocDot(id)) return [];
      const ql = coVaiDot(id, ['truong_ban', 'thu_ky', 'giang_vien', 'diem_danh']);
      const bay = Date.now();
      return taiLieu.filter(x => x.dot_id === id).sort((a, c) => a.thu_tu - c.thu_tu).map(x => {
        const b = buoi.find(y => y.id === x.buoi_id);
        let mo = true, vuong = null;
        if (!ql) {
          if (x.mo_tu && bay < new Date(x.mo_tu).getTime()) { mo = false; vuong = 'chua_den_gio'; }
          else if (x.can_diem_danh && x.buoi_id && !dd.some(y => y.buoi_id === x.buoi_id && y.thanh_vien_id === toiId())) { mo = false; vuong = 'can_diem_danh'; }
        }
        return Object.assign({}, x, { buoi_ten: b ? b.ten : null, buoi_bat_dau: b ? b.bat_dau : null, mo, vuong, lien_ket: mo ? x.lien_ket : null });
      });
    },
    async luuTaiLieuDot(id, p) {
      const dotId = id ? (taiLieu.find(x => x.id === id) || {}).dot_id : p.dot_id;
      if (!coVaiDot(dotId, ['truong_ban', 'thu_ky', 'giang_vien'])) throw new Error('Chỉ Ban tổ chức của đợt được thêm tài liệu');
      if (!/^https?:\/\//i.test(String(p.lien_ket || ''))) throw new Error('Đường dẫn phải bắt đầu bằng http:// hoặc https://');
      const o = { dot_id: dotId, buoi_id: p.buoi_id || null, ten: String(p.ten).trim(), mo_ta: p.mo_ta || null,
        lien_ket: p.lien_ket.trim(), thu_tu: p.thu_tu || 0, mo_tu: p.mo_tu || null, can_diem_danh: !!p.can_diem_danh };
      if (id) { Object.assign(taiLieu.find(x => x.id === id), o); return id; }
      const moi = Object.assign({ id: uid() }, o);
      taiLieu.push(moi);
      return moi.id;
    },
    async xoaTaiLieuDot(id) {
      const x = taiLieu.find(y => y.id === id);
      if (!x) throw new Error('Không tìm thấy tài liệu');
      if (!coVaiDot(x.dot_id, ['truong_ban', 'thu_ky', 'giang_vien'])) throw new Error('Chỉ Ban tổ chức của đợt được xóa tài liệu');
      taiLieu.splice(taiLieu.indexOf(x), 1);
    },
    async dsChecklistDot(id) {
      await gioi();
      if (!thayDuocDot(id)) return [];
      return checklist.filter(x => x.dot_id === id).sort((a, c) => a.thu_tu - c.thu_tu)
        .map(x => Object.assign({}, x, { buoi_ten: (buoi.find(b => b.id === x.buoi_id) || {}).ten || null }));
    },
    async luuChecklistDot(id, p) {
      const dotId = id ? (checklist.find(x => x.id === id) || {}).dot_id : p.dot_id;
      if (!coVaiDot(dotId, ['truong_ban', 'thu_ky', 'giang_vien'])) throw new Error('Chỉ Ban tổ chức của đợt được soạn checklist');
      if (!Array.isArray(p.muc)) throw new Error('Mục phải là một mảng');
      const o = { dot_id: dotId, buoi_id: p.buoi_id || null, ten: String(p.ten).trim(), mo_ta: p.mo_ta || null, muc: p.muc, thu_tu: p.thu_tu || 0 };
      if (id) { Object.assign(checklist.find(x => x.id === id), o); return id; }
      const moi = Object.assign({ id: uid() }, o);
      checklist.push(moi);
      return moi.id;
    },
    async xoaChecklistDot(id) {
      const x = checklist.find(y => y.id === id);
      if (!x) throw new Error('Không tìm thấy checklist');
      if (!coVaiDot(x.dot_id, ['truong_ban', 'thu_ky', 'giang_vien'])) throw new Error('Chỉ Ban tổ chức của đợt được xóa checklist');
      checklist.splice(checklist.indexOf(x), 1);
    },
    async guiCauHoiBuoi(bId, nd, an) {
      await gioi(120);
      const b = buoi.find(x => x.id === bId);
      if (!b) throw new Error('Không tìm thấy buổi');
      const thuoc = b.dot_id ? thayDuocDot(b.dot_id) : !hvDangNhap;
      if (!thuoc) throw new Error('Bạn không thuộc buổi này');
      if (b.dot_id && !dotDangMo(b.dot_id) && hvDangNhap) throw new Error('Đợt đã kết thúc, không gửi câu hỏi được nữa');
      if (b.dong) throw new Error('Buổi đã đóng');
      if (!String(nd || '').trim()) throw new Error('Câu hỏi còn trống');
      const id = uid();
      cauHoi.push({ id, buoi_id: bId, nguoi: toiId(), an_ten: !!an, noi_dung: String(nd).trim(), luc: new Date().toISOString(), trang_thai: 'moi', tra_loi: null, tra_loi_luc: null });
      return id;
    },
    async dsCauHoiBuoi(bId) {
      await gioi();
      const b = buoi.find(x => x.id === bId);
      if (!b) return [];
      const thuoc = b.dot_id ? thayDuocDot(b.dot_id) : !hvDangNhap;
      if (!thuoc) return [];
      const ql = b.dot_id ? coVaiDot(b.dot_id, ['truong_ban', 'thu_ky', 'giang_vien']) : (!hvDangNhap && (me().vai_tro !== 'thanh_vien' || me().cap === 'Ban cố vấn'));
      return cauHoi.filter(q => q.buoi_id === bId && (q.trang_thai !== 'an' || ql || q.nguoi === toiId()))
        .map(q => {
          const t = [...tv, ...hv].find(x => x.id === q.nguoi);
          return { id: q.id, noi_dung: q.noi_dung, luc: q.luc, an_ten: q.an_ten,
            ho_ten: q.an_ten ? null : (t ? t.ho_ten : null), la_cua_toi: q.nguoi === toiId(),
            trang_thai: q.trang_thai, tra_loi: q.tra_loi, tra_loi_luc: q.tra_loi_luc,
            so_quan_tam: quanTam.filter(z => z.cau_hoi_id === q.id).length,
            toi_quan_tam: quanTam.some(z => z.cau_hoi_id === q.id && z.thanh_vien_id === toiId()) };
        })
        .sort((a, c) => c.so_quan_tam - a.so_quan_tam || new Date(c.luc) - new Date(a.luc));
    },
    async quanTamCauHoi(id, bat) {
      const q = cauHoi.find(x => x.id === id);
      if (!q) throw new Error('Không tìm thấy câu hỏi');
      const i = quanTam.findIndex(z => z.cau_hoi_id === id && z.thanh_vien_id === toiId());
      if (bat && i < 0) quanTam.push({ cau_hoi_id: id, thanh_vien_id: toiId() });
      if (!bat && i >= 0) quanTam.splice(i, 1);
      return quanTam.filter(z => z.cau_hoi_id === id).length;
    },
    async traLoiCauHoiBuoi(id, tl) {
      const q = cauHoi.find(x => x.id === id);
      if (!q) throw new Error('Không tìm thấy câu hỏi');
      const b = buoi.find(x => x.id === q.buoi_id);
      const ql = b.dot_id ? coVaiDot(b.dot_id, ['truong_ban', 'thu_ky', 'giang_vien']) : (!hvDangNhap && (me().vai_tro !== 'thanh_vien' || me().cap === 'Ban cố vấn'));
      if (!ql) throw new Error('Chỉ Ban tổ chức và giảng viên được trả lời');
      const t = String(tl || '').trim() || null;
      Object.assign(q, { tra_loi: t, tra_loi_luc: t ? new Date().toISOString() : null, trang_thai: t ? 'da_tra_loi' : 'moi' });
    },
    async anCauHoiBuoi(id, an) {
      const q = cauHoi.find(x => x.id === id);
      if (!q) throw new Error('Không tìm thấy câu hỏi');
      const b = buoi.find(x => x.id === q.buoi_id);
      const ql = b.dot_id ? coVaiDot(b.dot_id, ['truong_ban', 'thu_ky', 'giang_vien']) : (!hvDangNhap && (me().vai_tro !== 'thanh_vien' || me().cap === 'Ban cố vấn'));
      if (q.nguoi !== toiId() && !ql) throw new Error('Chỉ người gửi, Ban tổ chức và giảng viên được ẩn câu hỏi');
      q.trang_thai = an ? 'an' : (q.tra_loi ? 'da_tra_loi' : 'moi');
    },
    async thongBaoDot(id) {
      await gioi();
      if (!thayDuocDot(id)) return [];
      return tbDot.filter(x => x.dot_id === id).slice().sort((a, c) => c.ghim - a.ghim || new Date(c.dang_luc) - new Date(a.dang_luc));
    },
    async luuThongBaoDot(id, p) {
      const dotId = id ? (tbDot.find(x => x.id === id) || {}).dot_id : p.dot_id;
      if (!dotId) throw new Error('Thông báo này không thuộc đợt tập huấn nào');
      if (!laBtcDot(dotId)) throw new Error('Chỉ trưởng ban, thư ký của đợt và quản trị được đăng thông báo');
      const o = { dot_id: dotId, tieu_de: String(p.tieu_de).trim(), noi_dung: p.noi_dung || null, ghim: !!p.ghim };
      if (id) { Object.assign(tbDot.find(x => x.id === id), o); return id; }
      const moi = Object.assign({ id: uid(), dang_luc: new Date().toISOString() }, o);
      tbDot.push(moi);
      return moi.id;
    },
    async xoaThongBaoDot(id) {
      const x = tbDot.find(y => y.id === id);
      if (!x) throw new Error('Thông báo này không thuộc đợt tập huấn nào');
      if (!laBtcDot(x.dot_id)) throw new Error('Chỉ trưởng ban, thư ký của đợt và quản trị được xóa thông báo');
      tbDot.splice(tbDot.indexOf(x), 1);
    },
    async hvTrangChu() {
      await gioi();
      const bay = Date.now();
      const moCuaToi = dotHv.filter(x => x.thanh_vien_id === toiId() && x.trang_thai === 'ghi_danh')
        .map(x => dot.find(d => d.id === x.dot_id)).filter(d => d && d.trang_thai === 'mo').map(d => d.id);
      const cua = (b, k) => (dd.find(x => x.buoi_id === b.id && x.thanh_vien_id === toiId()) || {})[k] || null;
      const buoiGan = buoi.filter(b => moCuaToi.includes(b.dot_id)
        && new Date(b.bat_dau).getTime() >= bay - 6 * 3600e3 && new Date(b.bat_dau).getTime() <= bay + 30 * 3600e3)
        .sort((a, c) => new Date(a.bat_dau) - new Date(c.bat_dau))
        .map(b => ({ id: b.id, dot_id: b.dot_id, dot_ma: (dot.find(d => d.id === b.dot_id) || {}).ma, ten: b.ten,
          bat_dau: b.bat_dau, ket_thuc: b.ket_thuc, dia_diem: b.dia_diem, phan: b.phan, ra_sau_phut: b.ra_sau_phut,
          dong: b.dong, can_dang_ky: b.can_dang_ky,
          toi_dang_ky: dangKy.some(k => k.buoi_id === b.id && k.thanh_vien_id === toiId()),
          toi_vao: cua(b, 'luc'), toi_ra: cua(b, 'ra_luc') }));
      const canChon = buoi.filter(b => moCuaToi.includes(b.dot_id) && b.can_dang_ky && !b.dong
        && (!b.mo_dang_ky_tu || bay >= new Date(b.mo_dang_ky_tu).getTime())
        && (!b.han_dang_ky || bay <= new Date(b.han_dang_ky).getTime())
        && !dangKy.some(k => k.buoi_id === b.id && k.thanh_vien_id === toiId())
        && !(b.nhom_chon && dangKy.some(k => k.thanh_vien_id === toiId() && (buoi.find(y => y.id === k.buoi_id) || {}).nhom_chon === b.nhom_chon
          && (buoi.find(y => y.id === k.buoi_id) || {}).dot_id === b.dot_id)))
        .map(b => ({ id: b.id, dot_id: b.dot_id, dot_ma: (dot.find(d => d.id === b.dot_id) || {}).ma, ten: b.ten,
          bat_dau: b.bat_dau, phan: b.phan, nhom_chon: b.nhom_chon, han_dang_ky: b.han_dang_ky, suc_chua: b.suc_chua,
          con_lai: b.suc_chua ? b.suc_chua - dangKy.filter(k => k.buoi_id === b.id).length : null }));
      const cuaToi = dotHv.filter(x => x.thanh_vien_id === toiId() && x.trang_thai === 'ghi_danh').map(x => x.dot_id);
      return { bay_gio: new Date().toISOString(), buoi_gan: buoiGan, can_chon: canChon,
        thong_bao_moi: tbDot.filter(x => cuaToi.includes(x.dot_id) && !doc.includes(x.id)).length };
    },

    /* ---------- Sau buổi (migration 0015) ---------- */
    async dsYeuCauDot(id) {
      await gioi();
      if (!thayDuocDot(id)) return [];
      const ql = laBtcDot(id);
      return yeuCau.filter(y => y.dot_id === id && (ql || y.nguoi === toiId()))
        .slice().sort((a, b) => new Date(b.luc) - new Date(a.luc))
        .map(y => {
          const t = [...tv, ...hv].find(x => x.id === y.nguoi) || {};
          return Object.assign({}, y, { la_cua_toi: y.nguoi === toiId(), ho_ten: ql ? t.ho_ten : null, ma: ql ? t.ma : null });
        });
    },
    async guiYeuCauDot(id, loai, nd) {
      await gioi(120);
      if (!thayDuocDot(id)) throw new Error('Bạn không thuộc đợt này');
      if (!String(nd || '').trim()) throw new Error('Nội dung còn trống');
      const x = { id: uid(), dot_id: id, nguoi: toiId(), loai, noi_dung: String(nd).trim(), luc: new Date().toISOString(), trang_thai: 'moi', tra_loi: null, tra_loi_luc: null };
      yeuCau.push(x);
      return x.id;
    },
    async xuLyYeuCauDot(id, tt, tl) {
      const y = yeuCau.find(x => x.id === id);
      if (!y) throw new Error('Không tìm thấy yêu cầu');
      if (!laBtcDot(y.dot_id)) throw new Error('Chỉ trưởng ban, thư ký của đợt và quản trị được xử lý');
      const t = String(tl || '').trim() || null;
      Object.assign(y, { trang_thai: tt, tra_loi: t, tra_loi_luc: t ? new Date().toISOString() : null });
    },

    async dsBaiThiDot(id) {
      await gioi();
      if (!thayDuocDot(id)) return [];
      return baiThi.filter(b => b.dot_id === id).slice().sort((a, c) => a.thu_tu - c.thu_tu || a.ma.localeCompare(c.ma))
        .map(b => Object.assign({}, b, { so_diem: diemBai.filter(d => d.bai_id === b.id).length }));
    },
    async luuBaiThiDot(id, p) {
      const dotId = id ? (baiThi.find(b => b.id === id) || {}).dot_id : p.dot_id;
      if (!laBtcDot(dotId)) throw new Error('Chỉ trưởng ban, thư ký của đợt và quản trị được sửa bài thi');
      const o = { dot_id: dotId, ma: String(p.ma).trim().toUpperCase(), ten: String(p.ten).trim(),
        thang: Number(p.thang) || 10, trong_so: Number(p.trong_so) || 1, thu_tu: Number(p.thu_tu) || 0 };
      if (id) { Object.assign(baiThi.find(b => b.id === id), o); return id; }
      const moi = Object.assign({ id: uid() }, o);
      baiThi.push(moi);
      return moi.id;
    },
    async xoaBaiThiDot(id) {
      const b = baiThi.find(x => x.id === id);
      if (!b) throw new Error('Không tìm thấy bài thi');
      if (!laBtcDot(b.dot_id)) throw new Error('Chỉ trưởng ban, thư ký của đợt và quản trị được xóa bài thi');
      baiThi.splice(baiThi.indexOf(b), 1);
      for (let i = diemBai.length - 1; i >= 0; i--) if (diemBai[i].bai_id === id) diemBai.splice(i, 1);
    },
    async nhapDiemDot(baiId, ds, ghi) {
      await gioi(200);
      const b = baiThi.find(x => x.id === baiId);
      if (!b) throw new Error('Không tìm thấy bài thi');
      if (!laBtcDot(b.dot_id)) throw new Error('Chỉ trưởng ban, thư ký của đợt và quản trị được nhập điểm');
      const daGap = new Map(), ket = [], dem = { ok: 0, sua: 0, loi: 0 };
      ds.forEach((r, i) => {
        const ma = String(r.ma || '').trim().toUpperCase();
        const diem = String(r.diem || '').trim().replace(',', '.');
        const so = diem === '' || Number.isNaN(Number(diem)) ? null : Number(diem);
        let tt = null, ly_do = null, t = null;
        if (!ma) { tt = 'loi'; ly_do = 'Thiếu mã học viên'; }
        else if (so === null) { tt = 'loi'; ly_do = 'Điểm không đọc được'; }
        else if (so < 0 || so > b.thang) { tt = 'loi'; ly_do = 'Điểm ngoài thang 0 đến ' + b.thang; }
        else if (daGap.has(ma)) { tt = 'loi'; ly_do = 'Trùng mã với dòng ' + daGap.get(ma) + ' trong chính bảng này'; }
        else {
          daGap.set(ma, r.dong || String(i + 1));
          t = [...tv, ...hv].find(x => x.ma === ma) || hv.find(x => x.email === String(r.ma || '').trim().toLowerCase());
          if (!t) { tt = 'khong_thay'; ly_do = 'Không có ai mang mã này'; }
          else if (!dotHv.some(g => g.dot_id === b.dot_id && g.thanh_vien_id === t.id && g.trang_thai === 'ghi_danh')) { tt = 'ngoai_dot'; ly_do = 'Không có tên trong đợt này'; }
          else if (diemBai.some(d => d.bai_id === baiId && d.thanh_vien_id === t.id)) tt = 'sua';
          else tt = 'ok';
        }
        if (ghi && (tt === 'ok' || tt === 'sua')) {
          const cu = diemBai.find(d => d.bai_id === baiId && d.thanh_vien_id === t.id);
          if (cu) cu.diem = so; else diemBai.push({ bai_id: baiId, thanh_vien_id: t.id, diem: so });
        }
        dem[tt === 'ok' || tt === 'sua' ? tt : 'loi']++;
        ket.push({ dong: r.dong || String(i + 1), ma, ho_ten: t ? t.ho_ten : null, diem: so, tinh_trang: tt, ly_do });
      });
      return { da_ghi: !!ghi, dem, ds: ket };
    },
    async xoaDiemDot(baiId, tvId) {
      const i = diemBai.findIndex(d => d.bai_id === baiId && d.thanh_vien_id === tvId);
      if (i >= 0) diemBai.splice(i, 1);
    },

    async dsPhieuDot(id) {
      await gioi();
      if (!thayDuocDot(id)) return [];
      return phieu.filter(f => f.dot_id === id).map(f => Object.assign({}, f, {
        so_cau: phieuCau.filter(c => c.phieu_id === f.id).length,
        so_gui: phieuDaGui.filter(g => g.phieu_id === f.id).length,
        toi_da_gui: phieuDaGui.some(g => g.phieu_id === f.id && g.thanh_vien_id === toiId()),
        cau: phieuCau.filter(c => c.phieu_id === f.id).slice().sort((a, b) => a.thu_tu - b.thu_tu)
      }));
    },
    async luuPhieuDot(id, p) {
      const dotId = id ? (phieu.find(f => f.id === id) || {}).dot_id : p.dot_id;
      if (!laBtcDot(dotId)) throw new Error('Chỉ trưởng ban, thư ký của đợt và quản trị được soạn phiếu');
      const daGui = id && phieuTraLoi.some(x => x.phieu_id === id);
      if (daGui && p.cau) throw new Error('Phiếu đã có người gửi nên không sửa được câu hỏi');
      const o = { dot_id: dotId, ten: String(p.ten).trim(), mo_ta: p.mo_ta || null,
        an_danh: p.an_danh !== false, mo: !!p.mo, han: p.han || null };
      let fid = id;
      if (id) Object.assign(phieu.find(f => f.id === id), o);
      else { fid = uid(); phieu.push(Object.assign({ id: fid, tao_luc: new Date().toISOString() }, o)); }
      if (p.cau) {
        for (let i = phieuCau.length - 1; i >= 0; i--) if (phieuCau[i].phieu_id === fid) phieuCau.splice(i, 1);
        p.cau.forEach((c, i) => phieuCau.push({ id: uid(), phieu_id: fid, thu_tu: i + 1, noi_dung: c.noi_dung,
          loai: c.loai || 'thang5', lua_chon: c.lua_chon || null, bat_buoc: c.bat_buoc !== false }));
      }
      return fid;
    },
    async xoaPhieuDot(id) {
      const f = phieu.find(x => x.id === id);
      if (!f) throw new Error('Không tìm thấy phiếu');
      if (!laBtcDot(f.dot_id)) throw new Error('Chỉ trưởng ban, thư ký của đợt và quản trị được xóa phiếu');
      phieu.splice(phieu.indexOf(f), 1);
      for (let i = phieuCau.length - 1; i >= 0; i--) if (phieuCau[i].phieu_id === id) phieuCau.splice(i, 1);
      for (let i = phieuTraLoi.length - 1; i >= 0; i--) if (phieuTraLoi[i].phieu_id === id) phieuTraLoi.splice(i, 1);
      for (let i = phieuDaGui.length - 1; i >= 0; i--) if (phieuDaGui[i].phieu_id === id) phieuDaGui.splice(i, 1);
    },
    async guiPhieuDot(id, tl) {
      await gioi(150);
      const f = phieu.find(x => x.id === id);
      if (!f) throw new Error('Không tìm thấy phiếu');
      if (!oTrongDot(f.dot_id)) throw new Error('Bạn không có tên trong đợt này');
      if (!f.mo) throw new Error('Phiếu chưa mở');
      if (f.han && Date.now() > new Date(f.han).getTime()) throw new Error('Phiếu đã hết hạn');
      if (phieuDaGui.some(g => g.phieu_id === id && g.thanh_vien_id === toiId())) throw new Error('Bạn đã gửi phiếu này rồi');
      const thieu = phieuCau.filter(c => c.phieu_id === id && c.bat_buoc && !String((tl || {})[c.id] || '').trim());
      if (thieu.length) throw new Error('Còn câu bắt buộc chưa trả lời');
      phieuDaGui.push({ phieu_id: id, thanh_vien_id: toiId(), luc: new Date().toISOString() });
      phieuTraLoi.push({ id: uid(), phieu_id: id, nguoi: f.an_danh ? null : toiId(), tra_loi: tl,
        luc: f.an_danh ? ngayVN(Date.now()) + 'T00:00:00+07:00' : new Date().toISOString() });
    },
    async tongHopPhieuDot(id) {
      await gioi();
      const f = phieu.find(x => x.id === id);
      if (!f || !laBtcDot(f.dot_id)) return null;
      const tls = phieuTraLoi.filter(x => x.phieu_id === id);
      return {
        so_gui: phieuDaGui.filter(g => g.phieu_id === id).length,
        an_danh: f.an_danh,
        cau: phieuCau.filter(c => c.phieu_id === id).slice().sort((a, b) => a.thu_tu - b.thu_tu).map(c => ({
          id: c.id, noi_dung: c.noi_dung, loai: c.loai, lua_chon: c.lua_chon,
          tra_loi: tls.map(x => (x.tra_loi || {})[c.id]).filter(v => String(v || '').trim() !== '')
        })),
        ds: f.an_danh ? null : tls.map(x => {
          const t = [...tv, ...hv].find(y => y.id === x.nguoi) || {};
          return { ho_ten: t.ho_ten || null, ma: t.ma || null, luc: x.luc, tra_loi: x.tra_loi };
        })
      };
    },

    async datCaiDatDot(id, p) {
      if (!laBtcDot(id)) throw new Error('Chỉ trưởng ban, thư ký của đợt và quản trị được đổi cài đặt');
      const d = dot.find(x => x.id === id);
      d.cai_dat = Object.assign({}, d.cai_dat || {}, p);
    },
    async dsTieuChiDot(id) {
      await gioi();
      if (!thayDuocDot(id)) return [];
      return tieuChi.filter(x => x.dot_id === id).slice().sort((a, b) => a.thu_tu - b.thu_tu).map(x => Object.assign({}, x, {
        buoi_ten: (buoi.find(b => b.id === x.buoi_id) || {}).ten || null,
        phieu_ten: (phieu.find(f => f.id === x.phieu_id) || {}).ten || null
      }));
    },
    async luuTieuChiDot(id, p) {
      if (!laBtcDot(id)) throw new Error('Chỉ trưởng ban, thư ký của đợt và quản trị được đặt tiêu chí');
      for (let i = tieuChi.length - 1; i >= 0; i--) if (tieuChi[i].dot_id === id) tieuChi.splice(i, 1);
      (p || []).forEach((x, i) => tieuChi.push({
        id: uid(), dot_id: id, ten: x.ten, loai: x.loai, buoi_id: x.buoi_id || null, phan: x.phan || null,
        so_buoi: x.so_buoi ? Number(x.so_buoi) : null, nguong: x.nguong === '' || x.nguong === null || x.nguong === undefined ? null : Number(x.nguong),
        phieu_id: x.phieu_id || null, cot_loi: x.cot_loi !== false, thu_tu: i + 1
      }));
    },
    async xetKetQuaDot(id) {
      await gioi();
      if (!laBtcDot(id)) return [];
      return dotHv.filter(g => g.dot_id === id && g.trang_thai === 'ghi_danh')
        .map(g => hv.find(h2 => h2.id === g.thanh_vien_id)).filter(Boolean)
        .sort((a, b) => a.ho_ten.localeCompare(b.ho_ten, 'vi'))
        .map(t => ({
          thanh_vien_id: t.id, ma: t.ma, ho_ten: t.ho_ten,
          xet: xetMotDemo(id, t.id),
          diem: baiThi.filter(b => b.dot_id === id).sort((a, c) => a.thu_tu - c.thu_tu).map(b => {
            const d = diemBai.find(x => x.bai_id === b.id && x.thanh_vien_id === t.id);
            return { bai_id: b.id, ma: b.ma, ten: b.ten, diem: d ? d.diem : null };
          }),
          chung_nhan: chungNhan.find(c => c.dot_id === id && c.thanh_vien_id === t.id) || null
        }));
    },
    async capChungNhanDot(id, ids) {
      await gioi(150);
      if (!laBtcDot(id)) throw new Error('Chỉ trưởng ban, thư ký của đợt và quản trị được cấp chứng nhận');
      const d = dot.find(x => x.id === id), ra = [];
      (ids || []).forEach(x => {
        if (!dotHv.some(g => g.dot_id === id && g.thanh_vien_id === x && g.trang_thai === 'ghi_danh')) return;
        const xet = xetMotDemo(id, x);
        let c = chungNhan.find(y => y.dot_id === id && y.thanh_vien_id === x);
        if (!c) {
          const n = chungNhan.filter(y => y.dot_id === id).length + 1;
          c = { dot_id: id, thanh_vien_id: x, ma: `${d.ma}-${String(n).padStart(4, '0')}-${maKichHoat().slice(0, 4)}` };
          chungNhan.push(c);
        }
        Object.assign(c, { muc: xet.muc, ghi_chu: xet.ghi_chu, diem_tong: xet.diem_tong, cap_luc: new Date().toISOString(), thu_hoi_luc: null });
        ra.push({ thanh_vien_id: x, ma: c.ma, muc: c.muc });
      });
      return { ds: ra };
    },
    async thuHoiChungNhan(id, tvId, th) {
      if (!laBtcDot(id)) throw new Error('Chỉ trưởng ban, thư ký của đợt và quản trị được thu hồi chứng nhận');
      const c = chungNhan.find(y => y.dot_id === id && y.thanh_vien_id === tvId);
      if (c) c.thu_hoi_luc = th ? new Date().toISOString() : null;
    },
    async traChungNhan(ma) {
      await gioi();
      const c = chungNhan.find(x => x.ma === String(ma || '').trim().toUpperCase());
      if (!c) return null;
      const t = hv.find(x => x.id === c.thanh_vien_id) || {}, d = dot.find(x => x.id === c.dot_id) || {};
      return { ma: c.ma, ho_ten: t.ho_ten, dot_ma: d.ma, dot_ten: d.ten, bat_dau: d.bat_dau, ket_thuc: d.ket_thuc,
        muc: c.muc, ghi_chu: c.ghi_chu, cap_luc: c.cap_luc, con_hieu_luc: !c.thu_hoi_luc };
    },
    async ketQuaCuaToi() {
      await gioi();
      return dotHv.filter(g => g.thanh_vien_id === toiId() && g.trang_thai === 'ghi_danh')
        .map(g => dot.find(d => d.id === g.dot_id)).filter(Boolean)
        .map(d => ({
          dot_id: d.id, dot_ma: d.ma, dot_ten: d.ten, trang_thai: d.trang_thai,
          diem: baiThi.filter(b => b.dot_id === d.id).sort((a, c) => a.thu_tu - c.thu_tu).map(b => {
            const x = diemBai.find(y => y.bai_id === b.id && y.thanh_vien_id === toiId());
            return { ten: b.ten, diem: x ? x.diem : null, thang: b.thang };
          }),
          diem_tong: diemTongDemo(d.id, toiId()),
          tieu_chi: tieuChi.filter(x => x.dot_id === d.id).sort((a, b) => a.thu_tu - b.thu_tu).map(x => ({
            ten: x.ten, cot_loi: x.cot_loi, dat: datTieuChiDemo(x, toiId(), diemTongDemo(d.id, toiId()))
          })),
          chung_nhan: (() => {
            const c = chungNhan.find(y => y.dot_id === d.id && y.thanh_vien_id === toiId());
            return c ? { ma: c.ma, muc: c.muc, ghi_chu: c.ghi_chu, cap_luc: c.cap_luc, con_hieu_luc: !c.thu_hoi_luc } : null;
          })()
        }));
    },

    async thongKeBai(id) {
      const ls = lam.filter(l => l.bai_id === id && l.nop_luc), b = bai.find(x => x.id === id);
      const ds = tv.filter(t => b.buoi_id ? daDiemDanh(b.buoi_id, t.id) || ls.some(l => l.thanh_vien_id === t.id) : t.hoat_dong).map(t => { const l = ls.find(x => x.thanh_vien_id === t.id); return { ma: t.ma, ho_ten: t.ho_ten, gen: t.gen, nha: t.nha, diem: l ? l.diem : null, so_dung: l ? l.so_dung : null, tong: l ? l.tong : null, nop_luc: l ? l.nop_luc : null, tu_dong: false }; });
      const d = ls.map(l => l.diem);
      return { buoi_id: b.buoi_id, doi_tuong: ds.length, da_gui: ls.length, tb: d.length ? d.reduce((a, b) => a + b, 0) / d.length : null, cao: d.length ? Math.max(...d) : null, thap: d.length ? Math.min(...d) : null, ds,
        cau: cau.filter(c => c.bai_id === id).map(c => { const o = {}; ls.forEach(l => { const v = l.tra_loi[c.id]; if (v !== undefined) o[v] = (o[v] || 0) + 1; }); return { noi_dung: c.noi_dung, lua_chon: c.lua_chon, hinh: c.hinh, dung: c.dung, dem: o }; }) };
    },

    // Phiếu trả lời bài giấy (migration 0019).
    ...baiGiayGia({ tv, buoi, dd, me }),
    // Dữ liệu cá nhân (migration 0020).
    ...duLieuGia({ tv, hv, me, toiId }),
    // Khảo sát thành viên (migration 0021).
    ...khaoSatGia({ tv, me })
  };
}
