// Hiển thị nội dung thông báo theo từng phần (anh Long 24/11/2026: thông báo lịch nhìn rối).
// Nội dung vẫn là chữ tự do; app nhận ra ba kiểu dòng hay gặp, dòng khác giữ nguyên là đoạn văn:
//   - ngày giờ: "18:00 25/11/2026", "18:00 · T4 25/11/2026", "T4 25/11 · 18:00"
//   - mục: "Địa điểm: …", "Nhóm trực: …", "Chủ trì: …" (tên mục không có chữ số)
//   - chương trình: "18:00–18:45 Nội dung (Người phụ trách)", "19:00 Nội dung"
import { h, bieuTuong, NHA, thuDai } from './ui.js';

const RE_NGAY = /^(?:(\d{1,2}:\d{2})\s*·?\s*)?(?:(T[2-7]|CN|Thứ \S+|Chủ nhật)\s+)?(\d{1,2}\/\d{1,2}(?:\/\d{4})?)(?:\s*·\s*(\d{1,2}:\d{2}))?$/i;
const RE_MUC = /^([A-ZÀ-ỸĐ][^:\d]{1,23}):\s+(.+)$/;
const RE_GIO = /^(\d{1,2}[:h]\d{2})(?:\s*[–-]\s*(\d{1,2}[:h]\d{2}))?\s+(.+)$/;
const RE_NGUOI = /\s*\(([^()]+)\)\s*$/;
const NGHI = /^(giải lao|nghỉ|ăn tối|ăn trưa|check-in)/i;
const BIEU = { 'địa điểm': 'ghim', 'nhóm trực': 'hom_nay', 'nhà trực': 'hom_nay', 'chủ trì': 'ho_so', 'điều hành': 'ho_so', 'liên hệ': 'ho_so', 'thời gian': 'dong_ho', 'hạn': 'dong_ho' };

/** Tách chữ thành các khối: { loai: 'ngay'|'muc'|'gio'|'doan', ... }. Thuần, không đụng DOM. */
export function tachNoiDung(chu) {
  const ra = [];
  for (const dong of String(chu || '').split(/\r?\n/)) {
    const s = dong.trim();
    if (!s) { ra.push({ loai: 'cach' }); continue; }
    let m;
    if ((m = s.match(RE_NGAY)) && (m[1] || m[4])) ra.push({ loai: 'ngay', gio: m[1] || m[4], thu: m[2] || '', ngay: m[3] });
    else if ((m = s.match(RE_GIO))) {
      const nd = m[3], nguoi = nd.match(RE_NGUOI);
      ra.push({ loai: 'gio', tu: m[1].replace('h', ':'), den: m[2] ? m[2].replace('h', ':') : '', noi: nguoi ? nd.slice(0, nguoi.index) : nd, nguoi: nguoi ? nguoi[1] : '', nghi: NGHI.test(nd) });
    } else if ((m = s.match(RE_MUC))) ra.push({ loai: 'muc', ten: m[1].trim(), gt: m[2].trim() });
    else ra.push({ loai: 'doan', chu: s.replace(/^[-•*]\s+/, ''), dau: /^[-•*]\s+/.test(s) });
  }
  return ra;
}

const icon = (t) => h('span', { class: 'tb-bt' }, bieuTuong(t));

/** Dựng phần thân thông báo: thẻ thông tin (ngày giờ, các mục), bảng chương trình, các đoạn còn lại. */
export function veNoiDung(chu) {
  const k = tachNoiDung(chu);
  if (!k.some(x => x.loai === 'ngay' || x.loai === 'muc' || x.loai === 'gio')) return h('div', { class: 'noi-dung-tb' }, chu || '');
  const thongTin = [], chuongTrinh = [], khac = [];
  for (const x of k) {
    if (x.loai === 'ngay') {
      // Thông báo cũ chỉ ghi "18:00 25/11/2026": tự thêm thứ trong tuần khi có đủ ngày tháng năm.
      const d = x.ngay.split('/'), thu = x.thu || (d.length === 3 ? thuDai(`${d[2]}-${d[1].padStart(2, '0')}-${d[0].padStart(2, '0')}T12:00:00+07:00`) : '');
      thongTin.push(h('div', { class: 'tb-ngay' }, icon('lich'), h('span', null, [thu, x.ngay].filter(Boolean).join(' '), h('b', null, ' · ' + x.gio))));
    }
    else if (x.loai === 'muc') {
      const nha = /nhóm trực|nhà trực/i.test(x.ten) && NHA[x.gt];
      thongTin.push(h('div', { class: 'tb-muc' }, icon(BIEU[x.ten.toLowerCase()] || 'don'),
        h('span', { class: 'tb-ten' }, x.ten),
        h('span', { class: 'tb-gt' }, nha ? h('i', { class: 'cham-nha', style: `background:${nha.mau}` }) : null, x.gt)));
    } else if (x.loai === 'gio') chuongTrinh.push(h('div', { class: 'tb-gio' + (x.nghi ? ' nghi' : '') },
      h('div', { class: 'tb-khung' }, h('b', null, x.tu), x.den ? h('span', null, x.den) : null),
      h('div', { class: 'tb-viec' }, h('div', null, x.noi), x.nguoi ? h('div', { class: 'tb-nguoi' }, x.nguoi) : null)));
    else if (x.loai === 'doan') khac.push(h('p', { class: 'tb-doan' + (x.dau ? ' dau' : '') }, x.chu));
  }
  return h('div', { class: 'tb-khoi' },
    thongTin.length ? h('div', { class: 'tb-thong-tin' }, thongTin) : null,
    chuongTrinh.length ? [h('div', { class: 'tb-nhan' }, 'Chương trình'), h('div', { class: 'tb-chuong-trinh' }, chuongTrinh)] : null,
    khac);
}
