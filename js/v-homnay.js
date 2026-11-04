// Màn hình "Hôm nay": buổi sắp tới, thông báo, việc đang chờ.
import { S } from './state.js';
import { h, dat, dong, nhom, bieuTuong, moSheet, thu, gio, ngayGio, ngay, namHoc, oNhap, oBat, qrSvg } from './ui.js';
import { suKienBuoi } from './v-lich.js';

const C = window.NKTV_CONFIG;
export const linkThe = (khoa) => (S.demo ? location.origin + location.pathname + '?demo=tv&' : C.appUrl + '?') + 'the=' + khoa;

export function moMaCuaToi() {
  moSheet({
    tieuDe: 'Mã điểm danh của tôi',
    noiDung: h('div', null,
      h('div', { class: 'qr-cua-toi' }, qrSvg(linkThe(S.toi.khoa_qr))),
      h('p', { class: 'giua-chu', style: 'font-weight:600' }, S.toi.ho_ten),
      h('p', { class: 'chu-nho giua-chu', style: 'margin:4px 0 0' }, S.toi.ma + ' · Mã này giống mã trên thẻ, đưa cho người phụ trách quét khi quên thẻ.'))
  });
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
        S.toi.la_phu_trach ? h('a', { class: 'nut', href: '#quan-ly/buoi/' + toi.id }, bieuTuong('quet'), 'Điểm danh') : null,
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
