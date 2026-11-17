// Màn của học viên các đợt tập huấn (không phải thành viên CLB).
// Phần A chỉ có: đợt của tôi, trạng thái tài khoản, hồ sơ. Điểm danh, lịch, đăng ký slot ở phần B.
import { S } from './state.js';
import { h, dat, dong, nhom, moSheet, thu, ngay, rong, oNhap, xacNhan } from './ui.js';

const TRANG_THAI = { soan: 'Chưa mở', mo: 'Đang mở', ket_thuc: 'Đã kết thúc' };
const LOP_TT = { soan: 'cho', mo: 'dung', ket_thuc: '' };
const ngayVN = (d) => d ? ngay(d + 'T12:00:00+07:00') : null;
const khoang = (d) => [ngayVN(d.bat_dau), ngayVN(d.ket_thuc)].filter(Boolean).join(' – ') || 'Chưa ghi ngày';
const dotMo = () => (S.toi.dot || []).filter(d => d.trang_thai === 'mo');

export async function tuyenHocVien(vung, tab) {
  if (tab === 'ho-so') return manHVHoSo(vung);
  return manHVHomNay(vung);
}

export async function manHVHomNay(vung) {
  const ds = S.toi.dot || [];
  const mo = dotMo();
  const xong = ds.filter(d => d.trang_thai === 'ket_thuc');

  dat(vung,
    h('h1', { class: 'tieu-de-lon' }, 'Chào ', S.toi.ho_ten ? S.toi.ho_ten.split(' ').slice(-1)[0] : 'bạn'),

    !ds.length ? h('div', { class: 'bang-tin' }, 'Tài khoản đã kích hoạt nhưng chưa có đợt tập huấn nào. Ban tổ chức sẽ thêm bạn vào đợt khi danh sách được nạp.') : null,

    mo.length ? nhom('Đợt đang học', mo.map(d => dong({
      tieu: d.ten, phu: `${d.ma} · ${khoang(d)}`,
      sau: h('span', { class: 'the-nhan dung' }, 'Đang mở'), muiTen: false
    }))) : null,

    mo.length ? h('div', { class: 'bang-tin xanh' },
      'Đợt đang mở. Điểm danh, lịch học và đăng ký buổi thực hành sẽ hiện ở đây đúng giờ Ban tổ chức mở; chưa tới giờ thì màn này không có việc gì cần làm.') : null,

    S.toi.chi_doc && ds.length ? h('div', { class: 'bang-tin' },
      'Các đợt của bạn đã kết thúc nên tài khoản đang ở chế độ chỉ xem. Khi bạn đăng ký đợt mới và Ban tổ chức nạp danh sách, tài khoản mở lại bằng chính mật khẩu này.') : null,

    ds.filter(d => d.trang_thai === 'soan').length ? nhom('Đợt sắp tới', ds.filter(d => d.trang_thai === 'soan').map(d => dong({
      tieu: d.ten, phu: `${d.ma} · ${khoang(d)}`,
      sau: h('span', { class: 'the-nhan cho' }, 'Chưa mở'), muiTen: false
    }))) : null,

    xong.length ? nhom('Đã học xong', xong.map(d => dong({
      tieu: d.ten, phu: `${d.ma} · ${khoang(d)}`,
      sau: h('span', { class: 'the-nhan' }, 'Đã kết thúc'), muiTen: false
    }))) : null,

    xong.length ? h('p', { class: 'chu-nho', style: 'margin-bottom:22px' }, 'Kết quả và giấy chứng nhận của các đợt đã xong sẽ hiện ở mục này khi Ban tổ chức nhập điểm và duyệt.') : null,

    h('p', { class: 'chu-nho giua-chu' }, 'CLB Ngoại Khoa Trưng Vương · Đón Nhận – Trưởng thành – Trao lại'));
}

function doiMatKhau() {
  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const m = f.elements.mk.value;
      if (m.length < 8) return;
      if (await thu(() => S.db.doiMatKhau(m), 'Đã đổi mật khẩu')) s.dong();
    }
  },
    h('div', { class: 'nhom' }, oNhap('Mật khẩu mới (ít nhất 8 ký tự)', { name: 'mk', type: 'password', autocomplete: 'new-password', required: true, minlength: 8 })),
    h('button', { class: 'nut day', type: 'submit' }, 'Đổi mật khẩu'));
  const s = moSheet({ tieuDe: 'Đổi mật khẩu', noiDung: f });
}

export async function manHVHoSo(vung) {
  const t = S.toi;
  const ds = t.dot || [];
  dat(vung,
    h('h1', { class: 'tieu-de-lon' }, 'Hồ sơ'),
    h('div', { class: 'dau-ho-so' },
      h('div', { class: 'nhan' }, 'Học viên'),
      h('div', { class: 'ten' }, t.ho_ten),
      h('div', { class: 'phu' }, t.ma)),
    nhom('Thông tin',
      dong({ tieu: 'Mã học viên', sau: t.ma, muiTen: false }),
      dong({ tieu: 'Email', sau: t.email || '–', muiTen: false }),
      dong({ tieu: 'Tài khoản', sau: t.chi_doc ? 'Chỉ xem' : 'Đang dùng được', muiTen: false })),
    ds.length ? nhom('Đợt đã đăng ký', ds.map(d => dong({
      tieu: d.ten, phu: `${d.ma} · ${khoang(d)}`,
      sau: h('span', { class: 'the-nhan ' + LOP_TT[d.trang_thai] }, TRANG_THAI[d.trang_thai]), muiTen: false
    }))) : rong('Chưa có đợt nào.'),
    h('p', { class: 'chu-nho', style: 'margin-bottom:22px' }, 'Sai thông tin thì nhắn Ban tổ chức đợt sửa, vì danh sách do Ban tổ chức nạp.'),
    nhom('Tài khoản',
      dong({ tieu: 'Đổi mật khẩu', onclick: doiMatKhau }),
      h('button', {
        class: 'dong', type: 'button', style: 'color:var(--vang);font-weight:500',
        onclick: async () => { if (await xacNhan({ tieuDe: 'Đăng xuất?', nut: 'Đăng xuất', nguy: true })) { await S.db.dangXuat(); location.hash = ''; location.reload(); } }
      }, 'Đăng xuất')),
    h('p', { class: 'chu-nho giua-chu' }, 'Thông tin cá nhân chỉ Ban tổ chức đợt và quản trị app xem được.'));
}
