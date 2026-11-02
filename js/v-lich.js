// Lịch sinh hoạt và xin nghỉ của thành viên.
import { S } from './state.js';
import { h, dat, dong, nhom, moSheet, thu, gio, ngayGio, namHoc, oNhap, rong, dauNgay, soLieu, xacNhan, TT_DIEM_DANH } from './ui.js';

const TT_DON = { cho: 'Chờ duyệt', duyet: 'Đã duyệt', tu_choi: 'Không duyệt' };
export const nhanDon = (d) => h('span', { class: 'the-nhan ' + d.trang_thai }, TT_DON[d.trang_thai]);

let donCache = null;
const taiDon = async () => (donCache = await S.db.donCuaToi(S.toi.id));

/** Sheet chi tiết một buổi: nội dung, trạng thái của tôi, xin nghỉ. */
export async function suKienBuoi(b, sauKhi) {
  const noiDung = h('div', null, h('div', { class: 'dang-tai' }, 'Đang tải…'));
  const s = moSheet({ tieuDe: 'Buổi sinh hoạt', noiDung });
  const [don, lichSu, lichBuoi] = await Promise.all([taiDon(), S.db.lichSuCuaToi(b.bat_dau, b.bat_dau), S.db.lichCuaBuoi(b.id).catch(() => null)]);
  const toiDon = don.find(d => d.buoi_id === b.id);
  const toi = lichSu.find(x => x.buoi_id === b.id);
  const daQua = new Date(b.bat_dau) < new Date();
  const coMat = toi && (toi.trang_thai === 'dung' || toi.trang_thai === 'tre');

  const form = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const v = form.elements.ly.value.trim();
      if (!v) return;
      const ok = await thu(() => S.db.guiXinNghi(b.id, v), 'Đã gửi đơn xin nghỉ');
      if (ok) { s.dong(); if (sauKhi) sauKhi(); }
    }
  },
    h('div', { class: 'nhan-nhom' }, toiDon ? 'Gửi lại đơn' : 'Xin nghỉ buổi này'),
    h('div', { class: 'nhom' }, oNhap('Lý do', { the: 'textarea', name: 'ly', rows: 3, required: true, placeholder: 'Ví dụ: trùng lịch thi', value: toiDon && toiDon.trang_thai === 'tu_choi' ? toiDon.ly_do : '' })),
    daQua ? h('p', { class: 'chu-nho', style: 'margin:-12px 16px 14px' }, 'Buổi đã bắt đầu nên đơn sẽ được ghi là gửi sau giờ.') : null,
    h('button', { class: 'nut day', type: 'submit' }, 'Gửi đơn'));

  dat(noiDung,
    h('h2', { style: 'font-size:1.375rem;font-weight:700;letter-spacing:-0.018em;line-height:1.2;margin-bottom:4px' }, b.ten),
    h('p', { style: 'color:var(--chu-2);margin-bottom:14px' }, ngayGio(b.bat_dau), b.ket_thuc ? ' – ' + gio(b.ket_thuc) : ''),
    nhom(null,
      b.dia_diem ? dong({ tieu: b.dia_diem, phu: 'Địa điểm' }) : null,
      b.nhom_truc ? dong({ tieu: b.nhom_truc, phu: 'Nhóm trực' }) : null,
      b.chu_tri ? dong({ tieu: b.chu_tri, phu: 'Chủ trì' }) : null,
      toi && (coMat || b.dong) ? dong({ tieu: TT_DIEM_DANH[toi.trang_thai] + (toi.tre_phut ? ` ${toi.tre_phut} phút` : ''), phu: 'Điểm danh của tôi' + (toi.luc ? ' · ' + gio(toi.luc) : '') }) : null,
      lichBuoi ? dong({ tieu: 'Xem ảnh lịch', onclick: async () => { const { moLich } = await import('./v-soanlich.js'); s.dong(); moLich(lichBuoi, sauKhi); } }) : null),
    b.noi_dung ? h('div', { class: 'nhom', style: 'padding:13px 16px' }, h('div', { class: 'noi-dung-tb' }, b.noi_dung)) : null,
    toiDon ? nhom('Đơn của tôi',
      dong({ tieu: toiDon.ly_do, phu: 'Gửi ' + ngayGio(toiDon.gui_luc) + (toiDon.phan_hoi ? ' · Phản hồi: ' + toiDon.phan_hoi : ''), sau: nhanDon(toiDon) }),
      toiDon.trang_thai !== 'duyet' ? h('button', {
        class: 'dong', type: 'button', style: 'color:var(--vang);justify-content:center;font-weight:500',
        onclick: async () => { if (await xacNhan({ tieuDe: 'Hủy đơn này?', nut: 'Hủy đơn', nguy: true })) { const ok = await thu(() => S.db.huyXinNghi(toiDon.id), 'Đã hủy đơn'); if (ok) { s.dong(); if (sauKhi) sauKhi(); } } }
      }, 'Hủy đơn') : null) : null,
    !coMat && (!toiDon || toiDon.trang_thai === 'tu_choi') && !b.dong ? form : null);
}

export async function manLich(vung) {
  const nam = namHoc();
  const [ds, don] = await Promise.all([S.db.dsBuoi(nam.tu, nam.den), taiDon()]);
  const nay = Date.now();
  const sap = ds.filter(b => new Date(b.bat_dau).getTime() >= nay - 3 * 3600e3);
  const qua = ds.filter(b => new Date(b.bat_dau).getTime() < nay - 3 * 3600e3).reverse();
  const cc = await S.db.chuyenCan(S.toi.id, nam.tu, nam.den).catch(() => null);
  const mapDon = new Map(don.map(d => [d.buoi_id, d]));
  const lai = () => manLich(vung);
  const hang = (b) => dong({
    truoc: dauNgay(b.bat_dau), tieu: b.ten, phu: gio(b.bat_dau) + (b.dia_diem ? ' · ' + b.dia_diem : '') + (b.nhom_truc ? ' · Trực: ' + b.nhom_truc : ''),
    sau: mapDon.has(b.id) ? nhanDon(mapDon.get(b.id)) : null, onclick: () => suKienBuoi(b, lai)
  });
  dat(vung,
    h('h1', { class: 'tieu-de-lon' }, 'Lịch sinh hoạt'),
    h('div', { class: 'hang-nut', style: 'margin-bottom:20px' },
      h('a', { class: 'nut', href: '#lich/soan' }, 'Soạn lịch'),
      h('a', { class: 'nut phu', href: '#lich/kho' }, 'Kho lịch')),
    cc && cc.tong ? soLieu([
      { so: Math.round((cc.dung + cc.tre) / cc.tong * 100) + '%', ten: `Chuyên cần ${cc.dung + cc.tre}/${cc.tong}` },
      { so: cc.tre, ten: 'Trễ', lop: 'tre' }, { so: cc.phep, ten: 'Có phép', lop: 'phep' }, { so: cc.vang, ten: 'Vắng', lop: 'vang' }
    ]) : null,
    sap.length ? nhom('Sắp tới', sap.map(hang)) : rong('Chưa có buổi nào sắp tới.'),
    qua.length ? nhom('Đã qua · năm học ' + nam.nhan, qua.map(hang)) : null);
}
