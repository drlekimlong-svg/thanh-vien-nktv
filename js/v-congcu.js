// Tab Công cụ (anh Long 24/11/2026): thay tab Quản lý và tab Tập huấn, đường dẫn vẫn là #quan-ly.
// Thành viên: Lịch tuần khả thi, Tập huấn nếu thuộc Ban tổ chức đợt. Quản trị, Ban cố vấn: thêm Gọi ngẫu nhiên.
// Ai xem được tên (quản trị, phụ trách, người điểm danh) thấy thêm các nhóm quản lý như cũ.
import { S } from './state.js';
import { h, dat, dong, nhom, bieuTuong, rong, toast, NHA, moTaTV, tenDep, ngayGio, giaTriNgay, oBat, oChon, thu } from './ui.js';
import { manQuanLy, thanhNho } from './v-quanly.js';
import { muaChung, mayDaTat, datMay, cheDoQT, apMuaLe } from './mua-le.js';

const icon = (t) => h('div', { class: 'bieu-tuong' }, bieuTuong(t));

/** Giao diện mùa lễ (anh Long 25/11/2026): thành viên CLB tắt trên máy mình khi đang mùa; quản trị chọn chế độ cho cả CLB (cai_dat.giang_sinh). */
const nhomMuaLe = () => {
  const ds = [
    muaChung() ? oBat('Trang trí mùa lễ trên máy này', { checked: !mayDaTat(), onchange: (e) => {
      datMay(e.target.checked); toast(e.target.checked ? 'Đã bật trang trí trên máy này' : 'Đã tắt trang trí trên máy này');
    } }) : null,
    S.toi.la_quan_tri ? oChon('Giao diện mùa lễ cho cả CLB', [['tu_dong', 'Tự động theo ngày (01/12–03/01)'], ['bat', 'Bật ngay'], ['tat', 'Tắt']], cheDoQT(), { onchange: async (e) => {
      const v = e.target.value;
      if (await thu(() => S.db.datCaiDat('giang_sinh', v), 'Đã lưu')) { S.caiDat.giang_sinh = v; apMuaLe(); dispatchEvent(new HashChangeEvent('hashchange')); }
      else e.target.value = cheDoQT();
    } }) : null
  ].filter(Boolean);
  return ds.length ? nhom('Giao diện mùa lễ', ...ds).filter(Boolean) : [];
};

const dsCongCu = () => [
  S.toi.la_quan_tri ? dong({ truoc: icon('xuc_xac'), tieu: 'Gọi ngẫu nhiên', phu: 'Một Junior, một Senior hoặc một nhà trong số người đang có mặt', href: '#quan-ly/goi' }) : null,
  // Cùng điều kiện với v-lichtuan.js.
  S.toi.loai === 'thanh_vien' && S.toi.hoat_dong === true ? dong({ truoc: icon('lich'), tieu: 'Lịch tuần khả thi', phu: '15 phút mỗi tuần: xếp một lịch làm được, rồi rà soát', href: '#lich-tuan' }) : null,
  !S.toi.xem_duoc_ten && S.toi.btc_dot && S.toi.btc_dot.length ? dong({ truoc: icon('nguoi'), tieu: 'Tập huấn học viên', phu: 'Đợt bạn thuộc Ban tổ chức', href: '#tap-huan' }) : null
].filter(Boolean);
/** Tab Công cụ chỉ hiện khi có ít nhất một mục. */
export const coCongCu = () => !!S.toi.xem_duoc_ten || dsCongCu().length > 0 || !!muaChung();

export async function manCongCu(vung) {
  const cc = dsCongCu(), ml = nhomMuaLe();
  if (S.toi.xem_duoc_ten) {
    // Các nhóm quản lý giữ như cũ; nhóm công cụ và nhóm mùa lễ đặt ngay dưới tiêu đề.
    await manQuanLy(vung);
    const them = [...(cc.length ? nhom(null, ...cc).filter(Boolean) : []), ...ml];
    if (them.length) vung.querySelector('.tieu-de-lon').after(...them);
    return;
  }
  dat(vung, h('h1', { class: 'tieu-de-lon' }, 'Công cụ'), cc.length ? nhom(null, ...cc) : ml.length ? null : rong('Chưa có công cụ nào cho bạn.'), ml);
}

/* ---------- Gọi ngẫu nhiên trong buổi sinh hoạt ----------
   Chỉ gọi người đã điểm danh có mặt (đúng giờ hoặc trễ). Trong một buổi, người đã được gọi không bị gọi lại
   cho tới khi cả nhóm đã được gọi hết một vòng; danh sách đã gọi giữ trong phiên trình duyệt. */
const LOAI = {
  junior: { ten: 'Junior', loc: (r) => r.cap === 'Junior' },
  senior: { ten: 'Senior', loc: (r) => r.cap === 'Senior' },
  nha: { ten: 'nhà' }
};
const coMat = (r) => r.trang_thai === 'dung' || r.trang_thai === 'tre';

/** idBuoi: mở từ trang một buổi; không có thì lấy các buổi hôm nay (hoặc buổi sắp tới gần nhất). */
export async function manGoiNgauNhien(vung, idBuoi) {
  const dau = idBuoi ? thanhNho('Gọi ngẫu nhiên', '#quan-ly/buoi/' + idBuoi, 'Buổi') : thanhNho('Gọi ngẫu nhiên');
  if (!S.toi.la_quan_tri) return dat(vung, dau, rong('Công cụ này dành cho Ban cố vấn và quản trị.'));
  let cacBuoi;
  if (idBuoi) cacBuoi = (await S.db.dsBuoi()).filter(x => x.id === idBuoi);
  else {
    const ds = await S.db.dsBuoi(new Date(Date.now() - 12 * 3600e3).toISOString());
    const homNay = ds.filter(x => giaTriNgay(x.bat_dau) === giaTriNgay(Date.now()));
    cacBuoi = homNay.length ? homNay : ds.slice(0, 1);
  }
  if (!cacBuoi.length) return dat(vung, dau, rong('Chưa có buổi sinh hoạt nào hôm nay.'));
  let b = cacBuoi[0], bang = [];
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const khoa = () => 'nktv-da-goi-' + b.id;
  const daGoi = () => { try { return JSON.parse(sessionStorage.getItem(khoa()) || '{}'); } catch (_) { return {}; } };
  const luu = (o) => { try { sessionStorage.setItem(khoa(), JSON.stringify(o)); } catch (_) {} };
  const ai = (id) => bang.find(r => r.thanh_vien_id === id);
  const pool = (loai) => loai === 'nha'
    ? [...new Set(bang.filter(r => coMat(r) && r.nha).map(r => r.nha))]
    : bang.filter(r => coMat(r) && LOAI[loai].loc(r)).map(r => r.thanh_vien_id);

  const vungKq = h('div', { class: 'goi-kq', 'aria-live': 'polite' }, h('p', { class: 'goi-goi-y' }, 'Bấm một nút bên dưới để gọi.'));
  const vungNut = h('div', { class: 'goi-nut' }), vungDa = h('div');
  const theKq = (loai, x) => {
    if (loai === 'nha') {
      const tv = bang.filter(r => coMat(r) && r.nha === x), n = NHA[x];
      return h('div', { class: 'goi-the', style: n ? `--nha-goc:${n.mau};--nha-nen:${n.nhat}` : null },
        n ? h('img', { src: `img/${n.anh}.webp`, alt: '' }) : null,
        h('div', { class: 'goi-chu' }, h('div', { class: 'goi-loai' }, 'Nhà được gọi'), h('div', { class: 'goi-ten' }, 'Nhà ' + x),
          h('div', { class: 'goi-phu' }, `${tv.length} bạn có mặt: ` + tv.map(r => tenDep(r.ho_ten).split(/\s+/).slice(-2).join(' ')).join(', '))));
    }
    const r = ai(x), n = r && r.nha && NHA[r.nha];
    return h('div', { class: 'goi-the', style: n ? `--nha-goc:${n.mau};--nha-nen:${n.nhat}` : null },
      h('img', { src: n ? `img/${n.anh}.webp` : 'img/logo.webp', alt: '' }),
      h('div', { class: 'goi-chu' }, h('div', { class: 'goi-loai' }, LOAI[loai].ten + ' được gọi'), h('div', { class: 'goi-ten' }, tenDep(r.ho_ten)),
        h('div', { class: 'goi-phu' }, moTaTV(r) || r.ma)));
  };
  const tenNhanh = (loai, x) => loai === 'nha' ? 'Nhà ' + x : tenDep(ai(x).ho_ten);

  const goi = (loai) => {
    const p = pool(loai);
    if (!p.length) { toast(loai === 'nha' ? 'Chưa có nhà nào có người điểm danh.' : `Chưa có ${LOAI[loai].ten} nào điểm danh có mặt.`, true); return; }
    const o = daGoi(); o[loai] = (o[loai] || []).filter(x => p.includes(x));
    let con = p.filter(x => !o[loai].includes(x)), vongMoi = false;
    if (!con.length) {
      // Vòng mới: không gọi lại ngay người vừa được gọi cuối vòng trước.
      const cuoi = o[loai][o[loai].length - 1];
      o[loai] = []; con = p.length > 1 ? p.filter(y => y !== cuoi) : p; vongMoi = true;
    }
    const x = con[Math.floor(Math.random() * con.length)];
    o[loai].push(x); o.lich = [...(o.lich || []), { l: loai, x }]; luu(o);
    const xong = () => { dat(vungKq, theKq(loai, x), vongMoi ? h('p', { class: 'goi-goi-y' }, 'Đã gọi hết một vòng, bắt đầu vòng mới.') : null); veNut(); veDa(); };
    if (rm || p.length < 2) return xong();
    // Xáo tên vài nhịp, chậm dần rồi dừng ở người được chọn.
    vungNut.querySelectorAll('button').forEach(n => { n.disabled = true; });
    let k = 0; const nhip = [50, 50, 60, 70, 80, 95, 110, 130, 155, 185];
    const xao = () => {
      if (k >= nhip.length) return xong();
      dat(vungKq, h('div', { class: 'goi-xao' }, tenNhanh(loai, p[Math.floor(Math.random() * p.length)])));
      setTimeout(xao, nhip[k++]);
    };
    xao();
  };
  const veNut = () => {
    const o = daGoi();
    dat(vungNut, ['junior', 'senior', 'nha'].map(loai => {
      const p = pool(loai), con = p.filter(x => !(o[loai] || []).includes(x)).length;
      return h('button', { class: 'nut' + (loai === 'nha' ? ' phu' : ''), type: 'button', disabled: !p.length, onclick: () => goi(loai) },
        h('span', null, loai === 'nha' ? 'Gọi một nhà' : 'Gọi một ' + LOAI[loai].ten),
        h('small', null, p.length ? `${p.length} ${loai === 'nha' ? 'nhà' : 'bạn'} có mặt · còn ${con} chưa gọi` : 'Chưa có ai có mặt'));
    }));
  };
  const veDa = () => {
    // Mới gọi lên đầu.
    const hang = (daGoi().lich || []).filter(g => g.l === 'nha' || ai(g.x)).reverse()
      .map(g => dong({ tieu: tenNhanh(g.l, g.x), phu: g.l === 'nha' ? 'Nhà' : LOAI[g.l].ten, muiTen: false }));
    dat(vungDa, hang.length ? [nhom(`Đã gọi trong buổi · ${hang.length}`, hang),
      h('button', { class: 'nut-chu', type: 'button', style: 'margin:-12px 0 24px 10px', onclick: () => { luu({}); veNut(); veDa(); dat(vungKq, h('p', { class: 'goi-goi-y' }, 'Đã xóa danh sách đã gọi.')); } }, 'Bắt đầu lại từ đầu')] : null);
  };
  const phu = h('p', { class: 'tieu-de-phu', style: 'margin-top:4px;text-align:center' });
  const tai = async () => { bang = await S.db.bangDiemDanh(b.id); phu.textContent = b.ten + ' · ' + ngayGio(b.bat_dau); veNut(); veDa(); };

  dat(vung, dau,
    cacBuoi.length > 1 ? h('div', { class: 'chon-ngang' }, cacBuoi.map(x => h('button', { class: 'vien', type: 'button', 'aria-pressed': String(x.id === b.id), onclick: (e) => { b = x; dat(vungKq, h('p', { class: 'goi-goi-y' }, 'Bấm một nút bên dưới để gọi.')); e.currentTarget.parentElement.querySelectorAll('.vien').forEach(v => v.setAttribute('aria-pressed', String(v === e.currentTarget))); tai(); } }, x.ten))) : null,
    phu, vungKq, vungNut,
    h('button', { class: 'nut-chu', type: 'button', style: 'display:block;margin:0 auto 24px', onclick: () => thuTai() }, 'Cập nhật danh sách có mặt'),
    vungDa);
  const thuTai = () => tai().then(() => toast('Đã cập nhật danh sách có mặt')).catch(e => toast(e.message, true));
  await tai();
}
