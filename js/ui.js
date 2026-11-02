// Công cụ giao diện dùng chung: dựng phần tử, sheet kéo được, thông báo nhanh, định dạng ngày giờ.
export const $ = (s, g = document) => g.querySelector(s);

/** Dựng phần tử an toàn: chữ luôn đi qua textContent, không qua innerHTML. */
export function h(the, tt, ...con) {
  const el = document.createElement(the);
  if (tt) for (const k of Object.keys(tt)) {
    const v = tt[k];
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked' || k === 'disabled' || k === 'hidden' || k === 'selected') el[k] = !!v;
    else if (k === 'style') el.style.cssText = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  chen(el, con);
  return el;
}
function chen(el, con) {
  for (const c of con) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) chen(el, c);
    else el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
}
export function dat(el, ...con) { el.replaceChildren(); chen(el, con); return el; }

const SVG = {
  hom_nay: '<path d="M12 3.5 3.8 10v9.2c0 .7.6 1.3 1.3 1.3H9v-6h6v6h3.9c.7 0 1.3-.6 1.3-1.3V10z" fill="currentColor"/>',
  lich: '<path d="M7 2.8v2.4M17 2.8v2.4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M5.4 4.4h13.2A2.4 2.4 0 0 1 21 6.8v11.8a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 18.6V6.8a2.4 2.4 0 0 1 2.4-2.4Zm-.6 5.2v9c0 .3.3.6.6.6h13.2c.3 0 .6-.3.6-.6v-9z" fill="currentColor"/><path d="M7 12.4h3v2.8H7zM14 12.4h3v2.8h-3z" fill="currentColor"/>',
  test: '<path d="M6.4 2.8h8.2L20 8.2v10.6a2.4 2.4 0 0 1-2.4 2.4H6.4A2.4 2.4 0 0 1 4 18.8V5.2a2.4 2.4 0 0 1 2.4-2.4Z" fill="currentColor"/><path d="m8 14 2.4 2.4L16 11" stroke="var(--tab-nen, #fff)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  ho_so: '<circle cx="12" cy="8" r="4.4" fill="currentColor"/><path d="M3.8 20.4c.7-4.2 4-6.6 8.2-6.6s7.5 2.4 8.2 6.6c.1.5-.3.9-.8.9H4.6c-.5 0-.9-.4-.8-.9Z" fill="currentColor"/>',
  quan_ly: '<path d="M4 6.5h16M4 12h16M4 17.5h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/><circle cx="8" cy="6.5" r="2.5" fill="currentColor"/><circle cx="16" cy="12" r="2.5" fill="currentColor"/><circle cx="10" cy="17.5" r="2.5" fill="currentColor"/>',
  quet: '<path d="M4 8.5V6a2 2 0 0 1 2-2h2.5M15.5 4H18a2 2 0 0 1 2 2v2.5M20 15.5V18a2 2 0 0 1-2 2h-2.5M8.5 20H6a2 2 0 0 1-2-2v-2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M4.5 12h15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  qr: '<path d="M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M13.5 13.5h3v3h-3zM17 17h3v3h-3z" fill="currentColor"/>',
  chuong: '<path d="M12 3a6 6 0 0 0-6 6c0 4.6-1.4 6.3-2.1 7.1-.5.5-.1 1.4.6 1.4h15c.7 0 1.1-.9.6-1.4C19.4 15.3 18 13.6 18 9a6 6 0 0 0-6-6Z" fill="currentColor"/><path d="M9.8 20a2.3 2.3 0 0 0 4.4 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>',
  nguoi: '<circle cx="9" cy="8" r="3.6" fill="currentColor"/><path d="M2.5 19c.5-3.4 3.2-5.2 6.5-5.2s6 1.8 6.5 5.2c.1.4-.3.8-.7.8H3.2c-.4 0-.8-.4-.7-.8Z" fill="currentColor"/><circle cx="17" cy="9" r="2.8" fill="currentColor" opacity=".6"/><path d="M17 13.5c2.6 0 4.5 1.4 4.9 4 .1.4-.2.7-.6.7H17.400c0-1.800-.6-3.500-1.900-4.600.5-.1 1-.100 1.500-.100Z" fill="currentColor" opacity=".6"/>',
  don: '<path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" fill="currentColor"/><path d="M8 8h8M8 12h8M8 16h5" stroke="var(--tab-nen, #fff)" stroke-width="1.8" stroke-linecap="round"/>',
  sao: '<path d="m12 3 2.7 5.8 6.3.8-4.600 4.300 1.200 6.200L12 17.100 6.400 20.100l1.200-6.200L3 9.600l6.300-.8z" fill="currentColor"/>',
  khoa: '<path d="M7 10V7.500a5 5 0 0 1 10 0V10" stroke="currentColor" stroke-width="2" fill="none"/><rect x="4.500" y="10" width="15" height="11" rx="2.400" fill="currentColor"/>',
  bieu_do: '<path d="M5 20V12M12 20V5M19 20v-5" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"/>',
  mui: '<path d="m1.500 1.500 5.500 5.500-5.500 5.500" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
};
export function bieuTuong(ten) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = SVG[ten] || '';
  return s;
}
export function mui() {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 8.500 14'); s.setAttribute('class', 'mui'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = SVG.mui;
  return s;
}

/* ---------- Thông báo nhanh ---------- */
let henToast = 0;
export function toast(chu, loi = false) {
  const t = $('#toast');
  t.textContent = chu; t.classList.toggle('loi', !!loi); t.classList.add('hien');
  clearTimeout(henToast); henToast = setTimeout(() => t.classList.remove('hien'), loi ? 4200 : 2400);
}
/** Chạy thao tác, báo lỗi bằng tiếng Việt thay vì để app im lặng. */
export async function thu(viec, thanhCong) {
  try { const kq = await viec(); if (thanhCong) toast(thanhCong); return kq === undefined ? true : kq; }
  catch (e) { console.error(e); toast(e.message || 'Có lỗi xảy ra. Thử lại.', true); return false; }
}

/* ---------- Lò xo: chạy từ giá trị và vận tốc hiện tại nên ngắt giữa chừng không bị giật ---------- */
const giamChuyenDong = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export function loXo({ tu, den, vanToc = 0, giamChan = 1, phanHoi = 0.32, moiKhung, xong }) {
  const w = 2 * Math.PI / phanHoi, k = w * w, c = 2 * giamChan * w;
  let x = tu, v = vanToc, cu = performance.now(), id = 0, dung = false;
  const buoc = (nay) => {
    if (dung) return;
    const dt = Math.min((nay - cu) / 1000, 1 / 15); cu = nay;
    for (let i = 0; i < 4; i++) { const a = -k * (x - den) - c * v; v += a * dt / 4; x += v * dt / 4; }
    if (Math.abs(x - den) < 0.4 && Math.abs(v) < 8) { moiKhung(den); if (xong) xong(); return; }
    moiKhung(x); id = requestAnimationFrame(buoc);
  };
  id = requestAnimationFrame(buoc);
  return { dung() { dung = true; cancelAnimationFrame(id); return { x, v }; } };
}
const chieuNem = (v, d = 0.998) => (v / 1000) * d / (1 - d);
const cao_su = (qua, kt, c = 0.55) => (qua * kt * c) / (kt + c * Math.abs(qua));

/* ---------- Sheet: kéo theo tay, thả theo đà, trở về đúng đường đã lên ---------- */
const dangMo = [];
export function moSheet({ tieuDe, noiDung, trai, phai, khiDong }) {
  const lop = $('#lop-sheet'), rongLon = matchMedia('(min-width: 900px)').matches;
  const man = h('div', { class: 'man-sheet' });
  const than = h('div', { class: 'sheet-than' });
  const nutDong = h('button', { class: 'nut-chu', type: 'button', onclick: () => dong() }, 'Đóng');
  const dau = h('div', { class: 'sheet-dau' }, h('div', { class: 'sheet-hang' },
    h('div', { class: 'khoang' }, trai || nutDong), h('h2', null, tieuDe || ''), h('div', { class: 'khoang', style: 'text-align:right' }, phai || null)));
  const el = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': tieuDe || 'Chi tiết' }, dau, than);
  if (typeof noiDung === 'function') noiDung(than, () => dong()); else if (noiDung) dat(than, noiDung);
  lop.append(man, el);

  let y = 0, cao = el.getBoundingClientRect().height, anim = null, daDong = false;
  const ve = (g) => {
    y = g;
    const tile = Math.max(0, Math.min(1, 1 - g / Math.max(cao, 1)));
    man.style.opacity = tile;
    el.style.transform = rongLon ? `translate(-50%, calc(-50% + ${g * 0.12}px)) scale(${0.96 + 0.04 * tile})` : `translateY(${g}px)`;
    if (rongLon) el.style.opacity = tile;
  };
  const toi = (den, vanToc, giamChan, xong) => {
    if (anim) anim.dung();
    if (giamChuyenDong()) { ve(den); if (xong) xong(); return; }
    anim = loXo({ tu: y, den, vanToc, giamChan, phanHoi: 0.3, moiKhung: ve, xong });
  };
  ve(cao);
  requestAnimationFrame(() => { cao = el.getBoundingClientRect().height; ve(cao); toi(0, 0, 1); });

  const dong = (vanToc = 0) => {
    if (daDong) return; daDong = true;
    const i = dangMo.indexOf(api); if (i >= 0) dangMo.splice(i, 1);
    man.style.pointerEvents = 'none';
    toi(cao + 24, vanToc, 1, () => { man.remove(); el.remove(); if (khiDong) khiDong(); });
  };
  man.addEventListener('pointerdown', () => dong());

  if (!rongLon) {
    // Kéo được cả từ phần đầu lẫn phần thân khi thân đang ở trên cùng.
    let keo = null;
    const batDau = (e) => {
      if (e.target.closest('input, textarea, select, button, a') && e.currentTarget === than) return;
      if (e.currentTarget === than && than.scrollTop > 0) return;
      if (anim) { const s = anim.dung(); anim = null; y = s.x; }
      keo = { id: e.pointerId, tuY: e.clientY, goc: y, ls: [{ t: e.timeStamp, y: e.clientY }], daKeo: false, nguon: e.currentTarget };
    };
    const di = (e) => {
      if (!keo || e.pointerId !== keo.id) return;
      const dy = e.clientY - keo.tuY;
      if (!keo.daKeo) {
        if (Math.abs(dy) < 8) return;
        if (keo.nguon === than && dy < 0) { keo = null; return; }
        keo.daKeo = true; try { keo.nguon.setPointerCapture(e.pointerId); } catch (_) {}
      }
      keo.ls.push({ t: e.timeStamp, y: e.clientY }); if (keo.ls.length > 5) keo.ls.shift();
      const g = keo.goc + dy;
      ve(g < 0 ? cao_su(g, cao) : g);
      e.preventDefault();
    };
    const tha = (e) => {
      if (!keo || e.pointerId !== keo.id) return;
      const k = keo; keo = null;
      if (!k.daKeo) return;
      const dau0 = k.ls[0], cuoi = k.ls[k.ls.length - 1], dt = Math.max(cuoi.t - dau0.t, 1);
      const v = (cuoi.y - dau0.y) / dt * 1000;
      if (y + chieuNem(v) > cao * 0.5) dong(v); else toi(0, v, v < 0 ? 0.85 : 1);
    };
    for (const n of [dau, than]) {
      n.addEventListener('pointerdown', batDau);
      n.addEventListener('pointermove', di);
      n.addEventListener('pointerup', tha);
      n.addEventListener('pointercancel', tha);
    }
    dau.addEventListener('dragstart', (e) => e.preventDefault());
  }
  const api = { dong, than, el };
  dangMo.push(api);
  return api;
}
export function dongHetSheet() { dangMo.slice().forEach(s => s.dong()); }
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && dangMo.length) dangMo[dangMo.length - 1].dong(); });

export function xacNhan({ tieuDe, chu, nut = 'Đồng ý', nguy = false }) {
  return new Promise((rs) => {
    // Trả lời ngay khi bấm, không chờ sheet đóng xong, để thao tác sau đó không bị trễ.
    const s = moSheet({
      tieuDe, khiDong: () => rs(false),
      noiDung: h('div', null, chu ? h('p', { style: 'margin-bottom:16px;line-height:1.45' }, chu) : null,
        h('button', { class: 'nut day' + (nguy ? ' nguy' : ''), type: 'button', onclick: () => { rs(true); s.dong(); } }, nut))
    });
  });
}

/* ---------- Phần tử hay dùng ---------- */
export const dong = ({ tieu, phu, sau, truoc, onclick, href, muiTen, target }) => {
  const the = onclick ? 'button' : href ? 'a' : 'div';
  return h(the, { class: 'dong', type: onclick ? 'button' : null, onclick, href, target, rel: target ? 'noopener' : null },
    truoc || null,
    h('div', { class: 'giua' }, h('div', { class: 'chinh' }, tieu), phu ? h('div', { class: 'phu' }, phu) : null),
    sau !== undefined && sau !== null ? (sau.nodeType ? sau : h('div', { class: 'sau' }, sau)) : null,
    (muiTen ?? !!(onclick || href)) ? mui() : null);
};
export const nhom = (nhan, ...con) => [nhan ? h('div', { class: 'nhan-nhom' }, nhan) : null, h('div', { class: 'nhom' }, ...con)];
export const oNhap = (nhan, tt) => h('label', { class: 'o' }, h('span', null, nhan), h(tt && tt.the === 'textarea' ? 'textarea' : 'input', Object.assign({}, tt, { the: null })));
export const oChon = (nhan, ds, gt, tt) => h('label', { class: 'o' }, h('span', null, nhan),
  h('select', tt, ds.map(d => { const [v, c] = Array.isArray(d) ? d : [d, d]; return h('option', { value: v, selected: String(gt ?? '') === String(v) }, c); })));
export const oBat = (nhan, tt) => h('label', { class: 'o o-ngang' }, h('span', null, nhan), h('input', Object.assign({ type: 'checkbox' }, tt)));
export const dangTai = () => h('div', { class: 'dang-tai' }, 'Đang tải…');
export const rong = (chu) => h('div', { class: 'rong-chu' }, chu);
export const soLieu = (ds) => h('div', { class: 'so-lieu' }, ds.map(d => h('div', { class: 'o-so ' + (d.lop || '') }, h('div', { class: 'so' }, d.so), h('div', { class: 'ten' }, d.ten))));

/* ---------- Ngày giờ theo giờ Việt Nam, không phụ thuộc múi giờ máy ---------- */
const TZ = 'Asia/Ho_Chi_Minh';
const fmt = (o) => new Intl.DateTimeFormat('vi-VN', Object.assign({ timeZone: TZ }, o));
const F_GIO = fmt({ hour: '2-digit', minute: '2-digit', hour12: false });
const F_NGAY = fmt({ day: '2-digit', month: '2-digit', year: 'numeric' });
const F_PHAN = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false });
export const phan = (t) => { const o = {}; F_PHAN.formatToParts(new Date(t)).forEach(p => { o[p.type] = p.value; }); return o; };
const THU = { Sun: 'CN', Mon: 'T2', Tue: 'T3', Wed: 'T4', Thu: 'T5', Fri: 'T6', Sat: 'T7' };
export const gio = (t) => t ? F_GIO.format(new Date(t)) : '';
export const ngay = (t) => t ? F_NGAY.format(new Date(t)) : '';
const tenThu = (t) => THU[phan(t).weekday];
export const ngayGio = (t) => t ? `${gio(t)} · ${tenThu(t)} ${ngay(t)}` : '';
export const giaTriNgay = (t) => { const p = phan(t); return `${p.year}-${p.month}-${p.day}`; };
export const giaTriGio = (t) => { const p = phan(t); return `${p.hour === '24' ? '00' : p.hour}:${p.minute}`; };
export const tuNhap = (d, g) => d ? new Date(`${d}T${g || '00:00'}:00+07:00`).toISOString() : null;
export const dauNgay = (t) => h('div', { class: 'dau-ngay' }, h('div', { class: 'thu' }, tenThu(t)), h('div', { class: 'so' }, phan(t).day), h('div', { class: 'thang' }, 'th ' + Number(phan(t).month)));
export function namHoc(t = Date.now()) {
  const p = phan(t), y = Number(p.year), bd = Number(p.month) >= 9 ? y : y - 1;
  return { nhan: `${bd}–${bd + 1}`, tu: `${bd}-09-01T00:00:00+07:00`, den: `${bd + 1}-08-31T23:59:59+07:00` };
}
export const chuNhatToi = () => {
  const n = new Date(giaTriNgay(Date.now()) + 'T12:00:00+07:00');
  n.setUTCDate(n.getUTCDate() + ((7 - n.getUTCDay()) % 7));
  return giaTriNgay(n);
};
export const soVN = (x, c = 2) => x === null || x === undefined ? '–' : Number(x).toLocaleString('vi-VN', { maximumFractionDigits: c });
export const dinhDangTen = (s) => s;

export const NHA = {
  Seiryu: { anh: 'seiryu', mau: '#123D88', nhat: '#E7EDF6', ten: 'Thanh Long' },
  Suzaku: { anh: 'suzaku', mau: '#8E1F1C', nhat: '#F8EAE6', ten: 'Chu Tước' },
  Byakko: { anh: 'byakko', mau: '#3A4756', nhat: '#E9EEF2', ten: 'Bạch Hổ' },
  Genbu: { anh: 'genbu', mau: '#3B4A2F', nhat: '#ECEFE3', ten: 'Huyền Vũ' },
  Kirin: { anh: 'kirin', mau: '#4B3F8F', nhat: '#EEEAF8', ten: 'Kỳ Lân' },
  'YinYang Kois': { anh: 'koi', mau: '#252B3B', nhat: '#F2EEE3', ten: 'Cá Chép' }
};
export const DS_NHA = Object.keys(NHA);
export const TT_DIEM_DANH = { dung: 'Đúng giờ', tre: 'Trễ', phep: 'Vắng có phép', vang: 'Vắng', chua: 'Chưa điểm danh' };
export const moTaTV = (t) => [t.gen !== null && t.gen !== undefined ? 'Gen ' + t.gen : null, t.nha, t.cap].filter(Boolean).join(' · ');
export const taiCSV = (ten, hang) => {
  const chu = hang.map(r => r.map(o => { const s = o === null || o === undefined ? '' : String(o); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\r\n');
  const a = h('a', { href: URL.createObjectURL(new Blob(['﻿' + chu], { type: 'text/csv;charset=utf-8' })), download: ten });
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
export const qrSvg = (chu) => { const q = window.qrcode(0, 'M'); q.addData(chu); q.make(); const d = h('div'); d.innerHTML = q.createSvgTag({ scalable: true, margin: 0 }); return d.firstChild; };
export const rungThanhCong = () => { try { navigator.vibrate && navigator.vibrate(40); } catch (_) {} };
export const rungLoi = () => { try { navigator.vibrate && navigator.vibrate([70, 50, 70]); } catch (_) {} };
