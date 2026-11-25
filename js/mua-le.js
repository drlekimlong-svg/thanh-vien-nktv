// Giao diện mùa lễ cuối năm (anh Long duyệt kế hoạch 0.2 ngày 25/11/2026).
// 01/12–27/12 Giáng sinh ("Cozy Christmas"), 28/12–03/01 Năm mới ("Happy New Year"), theo ngày giờ Việt Nam, năm nào cũng tự chạy.
// Quản trị chọn Tự động / Bật ngay / Tắt (cai_dat.giang_sinh); mỗi thành viên tắt được trên máy mình (localStorage).
// Chỉ thành viên CLB; học viên các đợt không thấy. Tắt thì không gắn data-mua, không nạp css/giang-sinh.css: app y như cũ.
import { S } from './state.js';
import { h, giaTriNgay } from './ui.js';

export const KHOA_MAY = 'nktv-mua-le';
// Bản chạy thử trên máy nhận ?ngay=YYYY-MM-DD và ?mua=giang-sinh|nam-moi để thử trước mùa.
const thamSo = (k) => S.demo ? new URLSearchParams(location.search).get(k) : null;
/** Ngày hiện tại theo giờ Việt Nam, dạng YYYY-MM-DD. */
export const ngayLe = () => thamSo('ngay') || giaTriNgay(Date.now());
/** Giai đoạn theo ngày, so bằng chuỗi MM-DD nên không phụ thuộc năm. */
export const phaTheoNgay = (ngay) => { const md = ngay.slice(5); return md >= '12-01' && md <= '12-27' ? 'giang-sinh' : md >= '12-28' || md <= '01-03' ? 'nam-moi' : null; };
export const cheDoQT = () => { const v = S.caiDat && S.caiDat.giang_sinh; return v === 'bat' || v === 'tat' ? v : 'tu_dong'; };
export function mayDaTat() { try { return localStorage.getItem(KHOA_MAY) === 'tat'; } catch (_) { return false; } }
export function datMay(bat) { try { if (bat) localStorage.removeItem(KHOA_MAY); else localStorage.setItem(KHOA_MAY, 'tat'); } catch (_) {} apMuaLe(); }
export const laThanhVienCLB = () => !!S.toi && S.toi.loai === 'thanh_vien';

/** Mùa lễ của cả CLB với người này, chưa tính công tắc trên máy: null, 'giang-sinh' hoặc 'nam-moi'. */
export function muaChung() {
  if (!laThanhVienCLB() || cheDoQT() === 'tat') return null;
  const ep = thamSo('mua');
  if (ep === 'giang-sinh' || ep === 'nam-moi') return ep;
  return phaTheoNgay(ngayLe()) || (cheDoQT() === 'bat' ? 'giang-sinh' : null);
}
/** Giai đoạn đang hiện trên máy này. Ưu tiên: quản trị Tắt → máy này tắt → quản trị Bật ngay → theo ngày. */
export const giaiDoan = () => mayDaTat() ? null : muaChung();

/** Gắn hoặc gỡ lớp mùa lễ; gọi khi dựng khung app và khi đổi công tắc. */
export function apMuaLe() {
  const pha = giaiDoan(), goc = document.documentElement;
  if (!pha) { delete goc.dataset.mua; return null; }
  if (!document.getElementById('css-mua-le')) document.head.append(h('link', { id: 'css-mua-le', rel: 'stylesheet', href: 'css/giang-sinh.css' }));
  goc.dataset.mua = pha;
  return pha;
}

/** Dòng đếm ngược trên ngày. */
export function demNguoc(ngay, pha) {
  const md = ngay.slice(5), d = Number(md.slice(3)), nam = Number(ngay.slice(0, 4)) + (md >= '12-01' ? 1 : 0);
  if (pha === 'nam-moi') {
    if (md === '12-31') return 'Tối nay giao thừa';
    if (md === '01-01') return 'Chúc mừng năm mới ' + nam;
    return md >= '12-01' ? `Còn ${32 - d} ngày tới năm ${nam}` : 'Năm mới ' + nam;
  }
  if (md >= '12-01' && md < '12-24') return `Còn ${25 - d} ngày tới Giáng sinh`;
  return md === '12-24' ? 'Tối nay là đêm Giáng sinh' : md === '12-25' ? 'Giáng sinh an lành' : 'Mùa Giáng sinh';
}

/* Lời chào mùa lễ (anh Long duyệt 25/11/2026; "đồng hành" thay "đi cùng"). Dấu ~ là dấu cách không ngắt,
   để bóng nói không tách từ ghép xuống hàng. Ngày có buổi, v-homnay.js vẫn dùng nhóm câu "hôm nay" (giờ, nơi). */
const g = (s) => s.replace(/~/g, ' ');
const LOI_GIANG_SINH = [
  'Giáng~sinh an~lành, {ten}. Hẹn bạn ở buổi~tới',
  'Tháng~12 nhiều bài~thi, mỗi tuần một~bước là đủ',
  'Mùa~lạnh rồi, giữ~ấm và giữ lịch sinh~hoạt nhé',
  'Một năm Đón~Nhận nhiều điều, cảm~ơn bạn đã đồng~hành cùng~CLB',
  'Món~quà cho khóa~sau là điều bạn học~kỹ hôm~nay',
  'Cuối năm bận thì xin~nghỉ sớm trong app để nhà~{nha} sắp~xếp',
  'Còn {con} ngày nữa là gặp~lại cả~CLB, mặc~ấm nhé',
  // Anh Long thêm 25/11/2026.
  'Trong mùa Giáng~sinh này, hãy cùng tìm~hiểu về CLB nhé'
];
// Câu gắn với Lịch 24 ô, thiệp "người bí ẩn" và đi chơi Noel: chỉ dùng tới hết 24/12 (anh Long thêm 25/11/2026).
const LOI_TRUOC_NOEL = [
  'Mỗi ngày mở một câu, bạn biết thêm một~chút về CLB',
  'Bạn đã viết thiệp Giáng~sinh cho “người bí~ẩn” chưa?',
  'Nhóm mình dự~định đi~chơi Noel ngày nào?'
];
const LOI_NAM_MOI = [
  'Năm~{nam} sắp khép~lại, cảm~ơn {ten} đã đồng~hành cùng~CLB',
  'Năm~mới đi~đều từng~buổi, nhà~{nha} đồng~hành cùng bạn',
  'Nhìn~lại một kỹ~năng bạn đã vững hơn trong năm~nay',
  'Một năm Trưởng~thành nữa đang chờ, hẹn bạn ở buổi~tới',
  'Nghỉ Tết dương~lịch xong, nhớ xem lịch buổi~tới nhé'
];
const NGAY_LE = {
  '12-24': 'Đêm Giáng~sinh an~lành, {ten}. Ai đi~trực, cả~CLB cảm~ơn bạn',
  '12-25': 'Giáng~sinh an~lành, {ten}. Cảm~ơn bạn một năm đồng~hành cùng~CLB',
  '12-31': 'Tối nay giao~thừa, chúc {ten} một tối thật ấm bên người~thân và bạn~bè',
  '01-01': 'Chúc~mừng năm~mới, {ten}. Chúc bạn một năm vững~tay, bình~an'
};
/** Bộ câu cho ngày không có buổi: [câu riêng của ngày lễ] hoặc cả bộ của giai đoạn. {nam} đã thay sẵn; câu "sắp khép lại" bỏ từ 01/01. */
export function boCauLe(ngay, pha) {
  const md = ngay.slice(5);
  if (NGAY_LE[md] && phaTheoNgay(ngay) === pha) return [g(NGAY_LE[md])];
  if (pha === 'nam-moi') return LOI_NAM_MOI.filter(c => md >= '12-01' || !c.includes('{nam}')).map(c => g(c.replace('{nam}', ngay.slice(0, 4))));
  return (md >= '12-01' && md <= '12-24' ? LOI_GIANG_SINH.concat(LOI_TRUOC_NOEL) : LOI_GIANG_SINH).map(g);
}

/** Chữ đèn cạnh logo thay chữ hạt: mỗi chữ một màu đèn, ba nhóm nhấp nháy đuổi nhau (CSS lo phần màu và nhịp). */
export function chuDen(pha) {
  const chu = pha === 'nam-moi' ? 'Happy New Year' : 'Cozy Christmas';
  let i = 0;
  return h('p', { class: 'chu-den', role: 'img', 'aria-label': chu }, [...chu].map(c => c === ' '
    ? h('span', { class: 'cach', 'aria-hidden': 'true' }, ' ')
    : h('span', { class: `d${(i % 4) + 1} k${(i++ % 3) + 1}`, 'aria-hidden': 'true' }, c)));
}

const SVG = (s) => { const d = document.createElement('div'); d.innerHTML = s; return d.firstChild; };
const SAO = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.2l1.9 4.1 4.5.5-3.4 3 1 4.4L8 10.9 4 13.2l1-4.4-3.4-3 4.5-.5z" fill="currentColor"/></svg>';
export const dongDemNguoc = (ngay, pha) => h('p', { class: 'dem-nguoc' }, SVG(SAO), g(demNguoc(ngay, pha).replace(/ (?=\S+$)/, '~')));
/** Dây đèn mép trên dải xanh: ba đoạn võng, mỗi đoạn ba bóng (hình học đơn giản). */
export function dayDen() {
  const MAU = ['#F2D58A', '#FFFFFF', '#F4A29B'];
  let s = '<svg class="day-den" viewBox="0 0 400 26" preserveAspectRatio="xMidYMin meet" aria-hidden="true"><path class="day" d="M0 3Q50 22 100 3T200 3T300 3T400 3"/>', k = 0;
  for (let d = 0; d < 4; d++) for (const t of [0.25, 0.5, 0.75]) {
    const x = d * 100 + 100 * t, y = (1 - t) * (1 - t) * 3 + 2 * (1 - t) * t * 22 + t * t * 3;
    s += `<rect x="${(x - 1.4).toFixed(1)}" y="${(y - 0.5).toFixed(1)}" width="2.8" height="3" rx=".6" fill="rgba(255,255,255,.55)"/><circle class="den" cx="${x}" cy="${(y + 5.6).toFixed(1)}" r="3.4" fill="${MAU[k++ % 3]}"/>`;
  }
  return SVG(s + '</svg>');
}
export const lopTuyet = () => h('div', { class: 'tuyet', 'aria-hidden': 'true' });

const bam = (s) => { let x = 5381; for (const c of s) x = ((x * 33) ^ c.charCodeAt(0)) >>> 0; return x; };
/** Ảnh mascot mùa lễ (img/le/<nhà>-<tư thế>.webp, ảnh Codex anh Long gửi 25/11/2026).
    Tư thế: 1 mũ, 2 khăn, 3 ném tuyết, 4 Năm mới. 24–25/12 dùng 1; Năm mới dùng 4; ngày khác mỗi người một tư thế 1–3, đổi mỗi ngày. */
export function anhLinhVatLe(anh, id, ngay, pha) {
  const md = ngay.slice(5);
  const n = pha === 'nam-moi' ? 4 : md === '12-24' || md === '12-25' ? 1 : 1 + bam(id + '|' + ngay) % 3;
  return `img/le/${anh}-${n}.webp`;
}
