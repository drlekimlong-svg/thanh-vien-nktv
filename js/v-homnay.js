// Màn hình "Hôm nay": buổi sắp tới, thông báo, việc đang chờ.
import { S } from './state.js';
import { h, dat, dong, nhom, bieuTuong, moSheet, thu, gio, ngayGio, ngay, namHoc, oNhap, oBat, qrSvg, moTaTV } from './ui.js';
import { suKienBuoi } from './v-lich.js';
import { taoMa, BUOC } from './ma-dong.js';

const C = window.NKTV_CONFIG;
export const linkThe = (khoa) => (S.demo ? location.origin + location.pathname + '?demo=tv&' : C.appUrl + '?') + 'the=' + khoa;
const KHOA_MA_DONG = 'nktv-ma-dong-v1';
const F_GIAY = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

/** Mã điểm danh động: đổi sau mỗi 20 giây, kèm đồng hồ chạy từng giây để người quét thấy đây là app đang mở, không phải ảnh chụp. */
export async function moMaCuaToi() {
  const hop = h('div', { class: 'qr-cua-toi' }, h('div', { class: 'dang-tai', style: 'padding:60px 0' }, 'Đang tạo mã…'));
  const vach = h('i'), dongHo = h('div', { class: 'dong-ho-ma' });
  let hen = 0;
  moSheet({
    tieuDe: 'Mã điểm danh của tôi',
    noiDung: h('div', null,
      hop, h('div', { class: 'vach-ma' }, vach), dongHo,
      h('p', { class: 'giua-chu', style: 'font-weight:600;font-size:1.125rem;margin-top:8px' }, S.toi.ho_ten),
      h('p', { class: 'chu-nho giua-chu', style: 'margin:2px 0 10px' }, [S.toi.ma, moTaTV(S.toi)].filter(Boolean).join(' · ')),
      h('p', { class: 'chu-nho giua-chu' }, 'Mã tự đổi sau mỗi 20 giây. Ảnh chụp màn hình không dùng để điểm danh được.')),
    khiDong: () => clearInterval(hen)
  });
  let khoa = null;
  try {
    khoa = await S.db.maDongCuaToi();
    S.lech = new Date(khoa.bay_gio).getTime() - Date.now();
    try { localStorage.setItem(KHOA_MA_DONG, JSON.stringify({ ma: khoa.ma, bi_mat: khoa.bi_mat })); } catch (_) {}
  } catch (e) {
    // Mất mạng lúc điểm danh: dùng khóa đã lưu trên máy từ lần trước.
    try { const c = JSON.parse(localStorage.getItem(KHOA_MA_DONG)); if (c && c.ma === S.toi.ma) khoa = c; } catch (_) {}
    if (!khoa) { dat(hop, h('div', { class: 'rong-chu', style: 'color:#333' }, 'Chưa tạo được mã: ' + e.message)); return; }
  }
  let wCu = -1, dangVe = false;
  const ve = async () => {
    const nay = Date.now() + (S.lech || 0), w = Math.floor(nay / 1000 / BUOC);
    dongHo.textContent = F_GIAY.format(new Date(nay));
    vach.style.transform = `scaleX(${(BUOC - (nay / 1000) % BUOC) / BUOC})`;
    if (w === wCu || dangVe) return;
    dangVe = true;
    try { const m = await taoMa(khoa.ma, khoa.bi_mat, nay); dat(hop, qrSvg(m.chu)); wCu = w; }
    catch (_) { dat(hop, h('div', { class: 'rong-chu', style: 'color:#333' }, 'Trình duyệt này không tạo được mã. Mở app bằng Chrome hoặc Safari.')); clearInterval(hen); }
    dangVe = false;
  };
  ve(); hen = setInterval(ve, 250);
}

export async function moThongBao(tb, sauKhi) {
  moSheet({
    tieuDe: 'Thông báo',
    noiDung: h('div', null,
      h('h2', { style: 'font-size:1.25rem;letter-spacing:-0.015em;line-height:1.25;margin-bottom:4px' }, tb.tieu_de),
      h('p', { class: 'chu-nho', style: 'margin-bottom:12px' }, ngayGio(tb.dang_luc)),
      h('div', { class: 'noi-dung-tb' }, tb.noi_dung || ''))
  });
  S.db.danhDauDoc(tb.id, S.toi.id).then(sauKhi).catch(() => {});
}

export async function manHomNay(vung) {
  const nam = namHoc();
  const [buoi, tb, doc, bai] = await Promise.all([
    S.db.dsBuoi(new Date(Date.now() - 6 * 3600e3).toISOString()),
    S.db.dsThongBao(), S.db.daDoc(S.toi.id), S.db.baiCuaToi().catch(() => [])
  ]);
  const toi = buoi[0];
  const tenGoi = S.toi.ho_ten.trim().split(/\s+/).pop();
  const canh = tenGoi[0] + tenGoi.slice(1).toLowerCase();
  const daDoc = new Set(doc);
  // Test đầu giờ hiện từ 12 giờ trước buổi, kể cả khi chưa điểm danh, để thành viên biết có bài.
  const ganBuoi = (b) => b.buoi_bat_dau && Math.abs(new Date(b.buoi_bat_dau) - Date.now()) < 12 * 3600e3;
  const baiMo = bai.filter(b => b.dang_lam_den || (b.da_gui === 0 && (!b.dong_luc || new Date(b.dong_luc) > new Date()) && (!b.mo_luc || new Date(b.mo_luc) <= new Date()) && (b.da_diem_danh || ganBuoi(b))));

  const veTB = () => {
    const chua = tb.filter(x => !daDoc.has(x.id));
    return tb.length
      ? nhom(chua.length ? `Thông báo · ${chua.length} chưa đọc` : 'Thông báo', tb.slice(0, 5).map(x => dong({
        tieu: x.tieu_de, phu: ngay(x.dang_luc) + (x.ghim ? ' · Đã ghim' : ''),
        truoc: h('div', { class: 'bieu-tuong', style: daDoc.has(x.id) ? 'opacity:.45' : null }, bieuTuong('chuong')),
        onclick: () => moThongBao(x, () => { daDoc.add(x.id); dat(vungTB, veTB()); })
      })))
      : null;
  };
  const vungTB = h('div', null);
  dat(vungTB, veTB());

  dat(vung,
    h('h1', { class: 'tieu-de-lon' }, 'Chào ' + canh),
    toi ? h('div', { class: 'the-buoi' },
      h('div', { class: 'nhan' }, new Date(toi.bat_dau) - Date.now() < 12 * 3600e3 ? 'Buổi gần nhất' : 'Buổi sắp tới'),
      h('h2', null, toi.ten),
      h('div', { class: 'chi-tiet' }, ngayGio(toi.bat_dau), toi.dia_diem ? ' · ' + toi.dia_diem : ''),
      h('div', { class: 'hang-nut' },
        S.toi.la_phu_trach || (S.toi.buoi_diem_danh || []).includes(toi.id) ? h('a', { class: 'nut', href: '#quan-ly/buoi/' + toi.id }, bieuTuong('quet'), 'Điểm danh') : null,
        Math.abs(new Date(toi.bat_dau) - Date.now()) < 4 * 3600e3 ? h('button', { class: 'nut' + (S.toi.la_phu_trach ? ' phu' : ''), type: 'button', onclick: moMaCuaToi }, bieuTuong('qr'), 'Mã điểm danh') : null,
        h('button', { class: 'nut phu', type: 'button', onclick: () => suKienBuoi(toi) }, 'Chi tiết, xin nghỉ')))
      : h('div', { class: 'the-buoi' }, h('div', { class: 'chi-tiet' }, 'Chưa có buổi sinh hoạt nào sắp tới.')),
    baiMo.length ? nhom('Bài cần làm', baiMo.map(b => dong({
      tieu: b.tieu_de,
      phu: b.dang_lam_den ? 'Đang làm dở, hạn ' + gio(b.dang_lam_den)
        : !b.da_diem_danh ? `Test đầu giờ · ${b.so_cau} câu · ${b.thoi_gian_phut} phút · Điểm danh xong là mở`
        : (b.dong_luc ? 'Hạn ' + ngayGio(b.dong_luc) : `${b.so_cau} câu · ${b.thoi_gian_phut} phút`),
      truoc: h('div', { class: 'bieu-tuong' }, bieuTuong('test')), href: '#post-test'
    }))) : null,
    vungTB,
    nhom(null,
      dong({ tieu: 'Mã điểm danh của tôi', truoc: h('div', { class: 'bieu-tuong' }, bieuTuong('qr')), onclick: moMaCuaToi })),
    h('p', { class: 'chu-nho giua-chu' }, 'Năm học ' + nam.nhan));
}

export const soanThongBao = (cu, sauKhi) => {
  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const x = f.elements;
      if (!x.td.value.trim()) return;
      const o = { tieu_de: x.td.value.trim(), noi_dung: x.nd.value.trim() || null, ghim: x.g.checked };
      const ok = await thu(() => cu ? S.db.suaThongBao(cu.id, o) : S.db.themThongBao(Object.assign(o, { tac_gia: S.toi.id })), cu ? 'Đã lưu' : 'Đã đăng thông báo');
      if (ok) { s.dong(); sauKhi(); }
    }
  },
    h('div', { class: 'nhom' },
      oNhap('Tiêu đề', { name: 'td', value: cu ? cu.tieu_de : '', required: true }),
      oNhap('Nội dung', { the: 'textarea', name: 'nd', value: cu ? cu.noi_dung : '', rows: 6 }),
      oBat('Ghim lên đầu', { name: 'g', checked: cu ? cu.ghim : false })),
    h('button', { class: 'nut day', type: 'submit' }, cu ? 'Lưu' : 'Đăng'));
  const s = moSheet({ tieuDe: cu ? 'Sửa thông báo' : 'Thông báo mới', noiDung: f });
};
