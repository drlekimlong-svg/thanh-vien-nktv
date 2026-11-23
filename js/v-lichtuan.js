// Lịch tuần khả thi: công cụ ở kho lich-tuan, nhúng bằng iframe với ?nhung=1. App không lưu gì; dữ liệu nằm trong localStorage của công cụ.
import { S } from './state.js';
import { h, dat } from './ui.js';
import { thanhNho } from './v-quanly.js';

// Điều kiện như máy chủ dùng cho khảo sát: thành viên CLB còn sinh hoạt (v-homnay.js dùng cùng điều kiện).
const duocDungLichTuan = () => !!S.toi && S.toi.loai === 'thanh_vien' && S.toi.hoat_dong === true;

// Chiều cao trừ thanh tab dưới và thanh tiêu đề (205px; 145px khi có thanh bên). Dưới 900px cho khung tràn sát mép, bù đúng lề 16px của .noi-dung.
function chenStyle() {
  if (document.getElementById('lt-style')) return;
  document.head.append(h('style', { id: 'lt-style' }, `
.lt-khung { display: block; width: calc(100% + 32px); margin: 0 -16px; height: calc(100dvh - 205px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)); min-height: 300px; border: 0; }
@media (min-width: 900px) { .lt-khung { width: 100%; margin: 0; height: calc(100dvh - 145px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)); } }`));
}

export async function manLichTuan(vung) {
  vung.classList.add('rong');
  if (!duocDungLichTuan()) {
    return dat(vung, thanhNho('Lịch tuần khả thi', '#hom-nay', 'Hôm nay'),
      h('div', { class: 'rong-chu' }, 'Lịch tuần khả thi hiện dành cho thành viên CLB đang sinh hoạt.'));
  }
  chenStyle();
  dat(vung, thanhNho('Lịch tuần khả thi', '#hom-nay', 'Hôm nay'),
    h('iframe', { class: 'lt-khung', src: '../lich-tuan/?nhung=1', title: 'Lịch tuần khả thi' }),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-top:8px' }, 'Lịch tuần chỉ lưu trong trình duyệt trên máy này, CLB không nhận được; người dùng chung trình duyệt này sẽ thấy lịch của bạn.'));
}
