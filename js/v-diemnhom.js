// Điểm nhóm: xếp hạng 6 nhà theo từng buổi đã đóng. Cách tính nằm ở hàm diem_nhom trong cơ sở dữ liệu.
import { S } from './state.js';
import { h, dat, dong, nhom, moSheet, soVN, ngay, namHoc, rong, dauNgay, NHA, DS_NHA } from './ui.js';

const thanhNho = (tieu) => h('div', { class: 'thanh-nho' }, h('div', { class: 'khoang' }, h('a', { class: 'nut-lui', href: '#lich', style: 'text-decoration:none' }, '‹ Lịch')), h('h1', null, tieu), h('div', { class: 'khoang phai' }));
const CACH_TINH = [
  'Mỗi buổi đã đóng và tính chuyên cần, mỗi nhà được tối đa 100 điểm. Chỉ tính Junior, Senior và người chưa ghi cấp; Ban cố vấn không tính.',
  'Chuyên cần, 60 điểm: đúng giờ 1, trễ 0,5, vắng 0, chia cho số người của nhà. Vắng có phép không tính vào số người.',
  'Test đầu giờ, 40 điểm: điểm trung bình của những người có mặt. Có mặt mà không làm bài tính 0.',
  'Buổi không có test đầu giờ: điểm chuyên cần quy về thang 100.',
  'Xếp hạng theo điểm trung bình các buổi trong năm học, nên nhà đông hay ít người đều so được với nhau.'
];

function chiTiet(b) {
  const ds = DS_NHA.map(n => b.nha[n]).filter(Boolean).sort((x, y) => (y.tong ?? -1) - (x.tong ?? -1));
  moSheet({
    tieuDe: 'Buổi ' + ngay(b.bat_dau),
    noiDung: h('div', null,
      h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:14px' }, b.co_test ? 'Có test đầu giờ: chuyên cần 60 điểm, test 40 điểm.' : 'Không có test đầu giờ: điểm chuyên cần quy về thang 100.'),
      h('div', { class: 'nhom' }, ds.map(r => dong({
        tieu: r.nha,
        phu: `Có mặt ${r.dung + r.tre}/${r.so_nguoi - r.phep} · Trễ ${r.tre} · Có phép ${r.phep} · Vắng ${r.vang}` +
          (r.co_test ? ` · Test TB ${soVN(r.tb_test)} (${r.so_lam} người làm) · Chuyên cần ${soVN(r.diem_cc, 1)} + test ${soVN(r.diem_test, 1)}` : ''),
        sau: h('span', { class: 'diem-nha', style: 'font-size:1.125rem' }, soVN(r.tong, 1))
      }))))
  });
}

export async function manDiemNhom(vung) {
  const nam = namHoc();
  const ds = await S.db.diemNhom(nam.tu, nam.den);
  const theoBuoi = new Map();
  ds.forEach(r => {
    if (!theoBuoi.has(r.buoi_id)) theoBuoi.set(r.buoi_id, { bat_dau: r.bat_dau, co_test: r.co_test, nha: {} });
    theoBuoi.get(r.buoi_id).nha[r.nha] = r;
  });
  const buoi = [...theoBuoi.values()].sort((a, b) => new Date(b.bat_dau) - new Date(a.bat_dau));
  const xep = DS_NHA.map(n => {
    const d = ds.filter(r => r.nha === n && r.tong !== null);
    return { nha: n, tb: d.length ? d.reduce((s, r) => s + Number(r.tong), 0) / d.length : null, so: d.length };
  }).sort((a, b) => (b.tb ?? -1) - (a.tb ?? -1));
  const dauBuoi = (b) => {
    const tot = DS_NHA.map(n => b.nha[n]).filter(r => r && r.tong !== null).sort((x, y) => y.tong - x.tong)[0];
    return tot ? `Cao nhất: ${tot.nha} ${soVN(tot.tong, 1)}` : 'Chưa đủ dữ liệu';
  };

  dat(vung, thanhNho('Điểm nhóm'),
    h('p', { class: 'tieu-de-phu', style: 'margin-top:4px;text-align:center' }, 'Năm học ' + nam.nhan + ' · trung bình các buổi đã đóng'),
    buoi.length ? nhom(null, xep.map((x, i) => h('div', { class: 'dong hang-nha', style: `--mau:${NHA[x.nha].mau}` },
      h('div', { class: 'hang-so' }, x.tb === null ? '–' : i + 1),
      h('img', { src: `img/${NHA[x.nha].anh}.webp`, alt: '' }),
      h('div', { class: 'giua' },
        h('div', { class: 'chinh' }, x.nha),
        h('div', { class: 'phu' }, x.so ? `${x.so} buổi` : 'Chưa có buổi nào'),
        h('div', { class: 'thanh-pt' }, h('i', { style: `width:${Math.max(0, Math.min(100, x.tb || 0))}%` }))),
      h('div', { class: 'diem-nha' }, x.tb === null ? '–' : soVN(x.tb, 1)))))
      : rong('Chưa có buổi nào đã đóng. Điểm nhóm được tính sau khi người phụ trách đóng buổi.'),
    buoi.length ? nhom('Từng buổi', buoi.map(b => dong({ truoc: dauNgay(b.bat_dau), tieu: b.co_test ? 'Có test đầu giờ' : 'Không có test đầu giờ', phu: dauBuoi(b), onclick: () => chiTiet(b) }))) : null,
    nhom('Cách tính', h('div', { style: 'padding:12px 16px;display:grid;gap:8px;font-size:0.9375rem;line-height:1.45' }, CACH_TINH.map(c => h('p', null, c)))));
}
