// Lịch 24 ô tới Giáng sinh: mỗi ngày mở thêm một ô, một câu hỏi lâm sàng ngắn 30 giây. Không lưu gì.
import { S } from './state.js';
import { h, moSheet, toast } from './ui.js';

const GIAY = 30;
let tai = null;
const taiDuLieu = () => tai || (tai = fetch(S.demo ? 'du-lieu/lich-24-o.demo.json' : 'du-lieu/lich-24-o.json')
  .then(r => r.ok ? r.json() : null)
  .then(d => d && Array.isArray(d.cau) && d.cau.length ? d.cau : null)
  .catch(() => null));

function moCau(c) {
  let hen = 0, xong = false;
  const giamCD = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const thanh = h('div', { class: 'l24-thanh' });
  // Đồng hồ không đọc to mỗi giây; kết quả đọc một lần qua vùng giải thích.
  const chu = h('span', null, `${GIAY} giây`);
  const giai = h('div', { class: 'l24-giai', hidden: true, 'aria-live': 'polite' });
  const nut = c.lua_chon.map((t, i) => h('button', { type: 'button', class: 'l24-chon', onclick: () => chot(i) }, t));
  const chot = (i) => {
    if (xong) return; xong = true; clearInterval(hen);
    nut.forEach((b, k) => { b.disabled = true; if (k === c.dung) b.classList.add('dung'); else if (k === i) b.classList.add('sai'); });
    chu.textContent = i === -1 ? 'Hết giờ' : i === c.dung ? 'Chính xác' : 'Chưa đúng';
    giai.hidden = false;
    giai.append(h('p', null, (i === -1 ? 'Hết giờ. ' : '') + 'Đáp án: ' + c.lua_chon[c.dung] + '. ' + (c.giai_thich || '')), c.nguon ? h('p', { class: 'l24-nguon' }, 'Nguồn: ' + c.nguon) : null);
  };
  let con = GIAY;
  const ve = () => { thanh.style.width = (con / GIAY * 100) + '%'; chu.textContent = `${con} giây`; };
  ve();
  if (!giamCD) thanh.style.transition = `width 1s linear`; // mỗi giây một nấc
  hen = setInterval(() => { con--; if (con <= 0) { thanh.style.width = '0%'; chot(-1); } else ve(); }, 1000);
  moSheet({
    tieuDe: `Ô ${c.o} · ${c.o}/12`,
    noiDung: h('div', { class: 'l24-cau' },
      h('p', { class: 'l24-hoi' }, c.cau_hoi),
      h('div', { class: 'l24-dong-ho' }, h('div', { class: 'l24-nen' }, thanh), chu),
      h('div', { class: 'l24-lc' }, nut), giai),
    khiDong: () => clearInterval(hen)
  });
}

export async function theLich24O(ngay) {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(ngay || '');
  if (!m || m[1] !== '12' || +m[2] < 1 || +m[2] > 24) return null;
  const homNay = +m[2];
  const ds = await taiDuLieu();
  if (!ds) return null;
  const theo = {}; ds.forEach(c => { if (c && c.o >= 1 && c.o <= 24 && Array.isArray(c.lua_chon) && c.lua_chon.length) theo[c.o] = c; });
  const bam = (i) => {
    if (i > homNay) return toast(`Ô ${i} mở ngày ${i}/12`);
    if (theo[i]) moCau(theo[i]); else toast('Ô này sắp có câu hỏi');
  };
  const o = [];
  for (let i = 1; i <= 24; i++) {
    const tt = i < homNay ? 'da' : i === homNay ? 'nay' : 'khoa';
    o.push(h('button', { type: 'button', class: tt, onclick: () => bam(i),
      'aria-label': i < homNay ? `Ô ${i}, đã mở` : i === homNay ? `Ô ${i}, hôm nay` : `Ô ${i}, mở ngày ${i}/12` }, String(i)));
  }
  const nhan = theo[homNay]
    ? h('button', { type: 'button', class: 'the-nhan', onclick: () => bam(homNay) }, `Mở ô ${homNay}`)
    : h('span', { class: 'the-nhan' }, `Mở ô ${homNay}`);
  return h('div', { class: 'the-24-o' },
    h('div', { class: 'dau' }, h('span', { class: 'tieu' }, 'Lịch 24 ô tới Giáng sinh'), nhan),
    // Nội dung là câu hỏi về CLB (anh Long đổi 25/11/2026, thay câu lâm sàng).
    h('div', { class: 'phu' }, 'Mỗi ngày một câu hỏi về CLB, trả lời trong 30 giây, xem đáp án ngay.'),
    h('div', { class: 'o-24' }, o));
}
