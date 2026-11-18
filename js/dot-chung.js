// Dùng chung cho mọi màn của đợt tập huấn: nhãn, vai trò trong đợt, thanh tiêu đề.
// Tách riêng để v-dot.js và v-ketqua.js không phải gọi chéo nhau.
import { S } from './state.js';
import { h, bieuTuong } from './ui.js';

export const TRANG_THAI = { soan: 'Đang soạn', mo: 'Đang mở', ket_thuc: 'Đã kết thúc' };
export const LOP_TT = { soan: 'cho', mo: 'dung', ket_thuc: '' };
export const VAI = { truong_ban: 'Trưởng ban', thu_ky: 'Thư ký', giang_vien: 'Tập huấn viên', diem_danh: 'Phụ trách điểm danh' };
export const PHAN = { ly_thuyet: 'Lý thuyết', thuc_hanh: 'Thực hành', luong_gia: 'Lượng giá', khac: 'Khác' };

// Mức hoàn thành, đúng thứ tự từ cao xuống thấp như hàm xet_mot_hv trong migration 0015.
export const MUC = {
  xuat_sac: ['Xuất sắc', 'dung'],
  hoan_thanh: ['Hoàn thành', 'dung'],
  hoan_thanh_ghi_chu: ['Hoàn thành có ghi chú', 'phep'],
  tham_du: ['Tham dự', 'tre'],
  chua_hoan_thanh: ['Chưa hoàn thành', 'vang']
};
export const LOAI_YC = { thac_mac: 'Thắc mắc', phan_hoi: 'Phản hồi', van_de: 'Vấn đề cần giúp' };
export const TT_YC = { moi: ['Mới', 'vang'], dang_xem: ['Đang xem', 'tre'], xong: ['Đã xong', 'dung'] };
export const LOAI_CAU = { thang5: 'Thang 1 đến 5', chon: 'Chọn một đáp án', chu: 'Viết chữ' };

export const icon = (t) => h('div', { class: 'bieu-tuong' }, bieuTuong(t));
export const thanh = (tieu, href = '#tap-huan', nhan = 'Tập huấn', phai = null) =>
  h('div', { class: 'thanh-nho' },
    h('div', { class: 'khoang' }, h('a', { class: 'nut-lui', href, style: 'text-decoration:none' }, '‹ ' + nhan)),
    h('h1', null, tieu), h('div', { class: 'khoang phai' }, phai));

// Vai trong đợt. Giữ đúng như các hàm trong Postgres, vì máy chủ mới là nơi quyết định.
const VAI_QUAN_LY = ['truong_ban', 'thu_ky'];
export const coVai = (dot, vai) => S.toi.la_quan_tri || (S.toi.btc_dot || []).some(b => b.dot_id === dot && vai.includes(b.vai));
export const laBtcQuanLy = (dot) => coVai(dot, VAI_QUAN_LY);
export const laGiangVien = (dot) => coVai(dot, ['truong_ban', 'thu_ky', 'giang_vien']);
export const laDiemDanh = (dot) => coVai(dot, ['truong_ban', 'thu_ky', 'diem_danh']);
export const thayDuocDot = (dot) => coVai(dot, Object.keys(VAI));
