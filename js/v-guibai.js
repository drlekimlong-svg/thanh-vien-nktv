// Tab Gửi bài: lối vào webapp Gửi bài NKTV (Google Apps Script), nơi sáu nhà gửi bài theo combo cho Ban cố vấn.
// Webapp có đăng nhập riêng bằng mã nhà và mã Ban cố vấn; app này không giữ, không hiện mã nào,
// và không nhúng iframe vì Apps Script không cho nhúng từ tên miền khác.
import { S } from './state.js';
import { h, dat, nhom, dong, bieuTuong, NHA, phanDoan, BAI_LAM } from './ui.js';

// Bản /exec của lần triển khai lâu dài: đường dẫn giữ nguyên khi webapp ra phiên bản mới.
export const GUI_BAI_URL = 'https://script.google.com/macros/s/AKfycbzAAu3JBu68OqdcUcbRCrzfYN426-T1eV_0ZNJSalDaSlhUMh_72Q81MWUmILaPTlOA/exec';

const icon = (ten) => h('div', { class: 'bieu-tuong' }, bieuTuong(ten));

export function manGuiBai(vung) {
  const nha = S.toi.nha && NHA[S.toi.nha];
  dat(vung,
    h('h1', { class: 'tieu-de-lon' }, 'Bài làm'),
    phanDoan(BAI_LAM, '#gui-bai'),
    h('div', { class: 'dau-ho-so' + (nha ? ' co-nha' : ''), style: nha ? `--nha-goc:${nha.mau}` : null },
      nha ? h('img', { class: 'mascot', src: `img/${nha.anh}.webp`, alt: '' }) : null,
      h('div', { class: 'nhan' }, 'Theo từng combo sinh hoạt'),
      h('div', { class: 'ten' }, 'Các nhà gửi bài cho Ban cố vấn'),
      // Khoảng trắng không ngắt ( ) giữ từ ghép trên một dòng.
      h('div', { class: 'phu' }, 'Slide, câu hỏi phản biện, bản tư vấn, sổ đề tài. Ban cố vấn đọc và phản hồi riêng cho từng nhà, nhà vào lại trang để đọc.')),
    h('a', { class: 'nut day lon', href: GUI_BAI_URL, target: '_blank', rel: 'noopener' }, 'Mở trang Gửi bài', bieuTuong('mo_ngoai')),
    h('p', { class: 'chu-nho giua-chu', style: 'margin:8px 0 26px' }, 'Trang chạy trên Google, mở ở thẻ mới.'),
    nhom('Đăng nhập trang Gửi bài',
      dong({ truoc: icon('khoa'), tieu: 'Mã nhà', phu: 'Trưởng nhà giữ mã của nhà. Cần gửi bài thì liên hệ trưởng nhà.' }),
      dong({ truoc: icon('nguoi'), tieu: 'Mã Ban cố vấn', phu: 'Ban cố vấn có mã riêng để xem bài, tải tệp và phản hồi.' }),
      dong({ truoc: icon('ho_so'), tieu: 'Không dùng tài khoản app này', phu: 'Mã NKTV và mật khẩu của app Thành viên không đăng nhập được trang Gửi bài.' })));
}
