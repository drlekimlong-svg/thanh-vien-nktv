// Phiếu trả lời cho bài làm trên giấy (migration 0019; anh Long yêu cầu 21/11/2026 cho pretest thống kê 22/11/2026).
// Thành viên làm bài trên giấy. Hết giờ, Ban cố vấn đọc mật khẩu; người đã điểm danh buổi đó mở phiếu rồi chọn lại
// đáp án đã ghi trên giấy. App chỉ hiện "Câu n" với các chữ A, B, C…, không hiện nội dung câu. Không tính điểm.
// Đáp án nằm ở máy chủ: chỉ màn quản trị đọc được, máy người làm bài không bao giờ nhận.
import { S } from './state.js';
import { h, dat, dong, nhom, thu, toast, ngay, ngayGio, soVN, moSheet, oNhap, oChon, oBat, soLieu, taiCSV, rungThanhCong, rungLoi, moTaTV, bieuTuong, xacNhan, DS_NHA } from './ui.js';

const CHU = 'ABCDEFGH';
const CAP = ['Junior', 'Senior', 'Ban cố vấn'];
const chuCua = (i) => i === null || i === undefined ? '–' : CHU[i];
const khoaNhap = (id) => 'nktv-bai-giay-' + id;
const phanTram = (a, b) => b ? Math.round(a / b * 100) : null;
const tb = (a) => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
const icon = (ten) => h('div', { class: 'bieu-tuong' }, bieuTuong(ten));
const thanhNho = (tieu, href, nhan) => h('div', { class: 'thanh-nho' },
  h('div', { class: 'khoang' }, h('a', { class: 'nut-lui', href, style: 'text-decoration:none' }, '‹ ' + nhan)), h('h1', null, tieu), h('div', { class: 'khoang phai' }));
const dauPhieu = (b, them) => [
  h('h2', { class: 'bg-tieu' }, b.ten),
  h('p', { class: 'tieu-de-phu bg-phu' }, [`${b.buoi_ten || 'Buổi'} ${ngay(b.buoi_bat_dau)}`, `${b.so_cau} câu`, them].filter(Boolean).join(' · '))
];

function trangThai(b) {
  if (b.gui_luc) return { chu: 'Đã gửi', lop: 'dat' };
  if (!b.mo) return { chu: 'Đã đóng', lop: 'vang' };
  if (!b.da_diem_danh) return { chu: 'Chờ điểm danh', lop: 'cho' };
  if (!b.da_mo) return { chu: 'Cần mật khẩu', lop: '' };
  return { chu: 'Đang chọn', lop: 'dung' };
}

/** Khối đầu tab Post-test. Không bao giờ báo lỗi: máy chủ chưa có migration 0019 thì không hiện gì. */
export async function khoiBaiGiay() {
  try {
    const [ds, ql] = await Promise.all([
      S.db.baiGiayCuaToi ? S.db.baiGiayCuaToi().catch(() => []) : [],
      S.toi.la_quan_tri && S.db.dsBaiGiay ? S.db.dsBaiGiay().catch(() => null) : null
    ]);
    const kq = [];
    if (ds.length) kq.push(nhom('Phiếu trả lời bài giấy', ds.map(b => {
      const tt = trangThai(b);
      return dong({ tieu: b.ten, phu: `Chọn lại đáp án đã ghi trên giấy · ${b.so_cau} câu · buổi ${ngay(b.buoi_bat_dau)}`, sau: h('span', { class: 'the-nhan ' + tt.lop }, tt.chu), href: '#post-test/phieu/' + b.id });
    })));
    if (ql && (ql.length || S.toi.la_admin)) kq.push(nhom('Phiếu trả lời · quản lý',
      ql.map(b => dong({ tieu: b.ten, phu: `${b.mo ? 'Đang mở' : 'Chưa mở hoặc đã đóng'} · buổi ${ngay(b.buoi_bat_dau)} · đã gửi ${b.da_gui}, đã điểm danh ${b.da_diem_danh}`, href: '#post-test/phieu-ql/' + b.id })),
      S.toi.la_admin ? dong({ tieu: 'Tạo phiếu mới', phu: 'Cho một bài làm trên giấy', truoc: icon('phieu'), href: '#post-test/phieu-ql/moi' }) : null));
    return kq;
  } catch (e) { console.error(e); return []; }
}

/** Lưới "Câu n: A B C D E". tl được sửa tại chỗ. dapAn (chỉ màn quản trị) tô câu đúng, câu sai. */
function luoiChon({ soCau, soLc, chuaHieu, tl, khiDoi, chiXem = false, boChon = true, dapAn = null }) {
  const hang = (i) => {
    const nut = Array.from({ length: soLc }, (_, j) => {
      let lop = 'o-chon' + (j === chuaHieu ? ' chua-hieu' : '');
      if (dapAn && dapAn[i] !== null && dapAn[i] !== undefined) lop += j === dapAn[i] ? ' la-dap-an' : tl[i] === j ? ' chon-sai' : '';
      return h('button', {
        class: lop, type: 'button', disabled: chiXem, 'aria-pressed': tl[i] === j ? 'true' : 'false', 'aria-label': `Câu ${i + 1}, ${CHU[j]}`,
        onclick: chiXem ? null : () => {
          tl[i] = boChon && tl[i] === j ? null : j;
          nut.forEach((n, k) => n.setAttribute('aria-pressed', tl[i] === k ? 'true' : 'false'));
          rungThanhCong();
          if (khiDoi) khiDoi(i);
        }
      }, CHU[j]);
    });
    return h('div', { class: 'bg-cau', style: `grid-template-columns:3.7em repeat(${soLc}, minmax(0, 1fr))` }, h('div', { class: 'so' }, 'Câu ' + (i + 1)), nut);
  };
  const khoi = [];
  for (let i = 0; i < soCau; i += 5) khoi.push(h('div', { class: 'nhom bg-khoi' }, Array.from({ length: Math.min(5, soCau - i) }, (_, k) => hang(i + k))));
  return khoi;
}

const bangXemLai = (tl) => h('div', { class: 'bg-xem-lai' }, tl.map((x, i) => h('span', { class: x === null ? 'trong' : null }, h('b', null, i + 1), ' ', chuCua(x))));

/* ---------- Người làm bài ---------- */
export async function manBaiGiay(vung, id) {
  const b = await S.db.xemBaiGiay(id);
  const lai = () => manBaiGiay(vung, id);
  const dau = [thanhNho('Phiếu trả lời', '#post-test', 'Post-test'), dauPhieu(b, 'không tính điểm')];
  if (b.gui_luc) return manDaGui(vung, b, dau);
  if (!b.da_diem_danh) return dat(vung, dau,
    h('div', { class: 'bang-tin' }, 'Phiếu chỉ mở cho người đã điểm danh buổi này. Nhờ người điểm danh quét mã của bạn, rồi bấm Thử lại.'),
    h('button', { class: 'nut phu day', type: 'button', onclick: lai }, 'Thử lại'));
  if (!b.da_mo) return manMatKhau(vung, b, dau, lai);
  manChon(vung, b, dau, lai);
}

function manMatKhau(vung, b, dau, lai) {
  const o = oNhap('Mật khẩu', { name: 'mk', autocomplete: 'off', autocapitalize: 'none', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'go' });
  const loi = h('div', { class: 'loi-o', style: 'padding-bottom:12px' });
  loi.hidden = true;
  const nut = h('button', { class: 'nut day', type: 'submit' }, 'Mở phiếu');
  const baoLoi = (c) => { loi.textContent = c; loi.hidden = false; rungLoi(); };
  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const mk = f.elements.mk.value;
      loi.hidden = true;
      if (!mk.trim()) return baoLoi('Cần nhập mật khẩu.');
      nut.disabled = true;
      try {
        const r = await S.db.moBaiGiay(b.id, mk);
        if (r && r.ok) { rungThanhCong(); lai(); return; }
        baoLoi((r && r.loi) || 'Mật khẩu chưa đúng.');
      } catch (er) { baoLoi(er.message); }
      nut.disabled = false;
    }
  }, h('div', { class: 'nhom' }, o, loi), nut);
  dat(vung, dau,
    h('p', { class: 'bg-mo-ta' }, 'Làm xong bài trên giấy, chờ Ban cố vấn đọc mật khẩu rồi nhập vào đây. Chữ hoa, chữ thường hay khoảng trắng đều được.'),
    f);
  o.querySelector('input').focus({ preventScroll: true });
}

function manChon(vung, b, dau, lai) {
  let tl = Array(b.so_cau).fill(null);
  try {
    const cu = JSON.parse(localStorage.getItem(khoaNhap(b.id)));
    if (Array.isArray(cu) && cu.length === b.so_cau) tl = cu.map(x => Number.isInteger(x) && x >= 0 && x < b.so_lua_chon ? x : null);
  } catch (_) {}
  const dem = () => tl.filter(x => x !== null).length;
  const nutGui = h('button', { class: 'nut day lon', type: 'button', onclick: () => xemLai() });
  const capNhat = () => { nutGui.textContent = `Xem lại và gửi (${dem()}/${b.so_cau})`; };
  const luu = () => { try { localStorage.setItem(khoaNhap(b.id), JSON.stringify(tl)); } catch (_) {} };
  const xemLai = () => {
    const trong = tl.map((x, i) => x === null ? i + 1 : null).filter(Boolean);
    let dangGui = false;
    const nut = h('button', {
      class: 'nut day', type: 'button',
      onclick: async () => {
        if (dangGui) return;
        dangGui = true; nut.disabled = true;
        const kq = await thu(() => S.db.guiBaiGiay(b.id, tl), 'Đã gửi phiếu');
        if (kq) { try { localStorage.removeItem(khoaNhap(b.id)); } catch (_) {} s.dong(); lai(); }
        else { dangGui = false; nut.disabled = false; }
      }
    }, 'Gửi phiếu');
    const s = moSheet({
      tieuDe: 'Xem lại trước khi gửi', noiDung: h('div', null,
        h('p', { style: 'margin-bottom:12px;line-height:1.45' }, 'So từng câu với bài giấy của bạn. Gửi rồi không tự sửa được; cần sửa thì báo Ban cố vấn.'),
        bangXemLai(tl),
        trong.length ? h('div', { class: 'bang-tin' }, `Còn ${trong.length} câu bỏ trống: ${trong.join(', ')}.`) : null,
        nut)
    });
  };
  dat(vung, dau,
    b.chu_thich ? h('div', { class: 'bang-tin xanh' }, b.chu_thich) : null,
    h('p', { class: 'bg-mo-ta' }, 'Chọn đúng như đã ghi trên bài giấy. Chạm lần nữa để bỏ chọn.'),
    luoiChon({ soCau: b.so_cau, soLc: b.so_lua_chon, chuaHieu: b.chua_hieu, tl, khiDoi: () => { capNhat(); luu(); } }),
    nutGui,
    h('p', { class: 'chu-nho giua-chu', style: 'margin-top:10px' }, 'Lựa chọn được giữ trên máy này cho tới khi gửi.'));
  capNhat();
}

function manDaGui(vung, b, dau) {
  const coSo = b.so_dung !== null && b.so_dung !== undefined;
  dat(vung, dau,
    h('div', { class: 'nhom diem-lon' },
      coSo ? [h('div', { class: 'so' }, `${b.so_dung}/${b.so_cau}`), h('div', { class: 'phu' }, 'câu đúng')] : h('div', { class: 'so', style: 'font-size:2rem' }, 'Đã gửi'),
      h('p', { class: 'chu-nho', style: 'margin-top:10px' }, 'Gửi ' + ngayGio(b.gui_luc), b.nhap_ho ? ' · quản trị đã sửa theo bài giấy' : '')),
    h('div', { class: 'bang-tin xanh' }, 'Cảm ơn bạn. Bài này không tính điểm. Cần sửa phiếu thì báo Ban cố vấn.'),
    b.tra_loi ? [h('div', { class: 'nhan-nhom' }, 'Phiếu bạn đã gửi'), luoiChon({ soCau: b.so_cau, soLc: b.so_lua_chon, chuaHieu: b.chua_hieu, tl: b.tra_loi, chiXem: true })] : null);
}

/* ---------- Quản trị và Ban cố vấn ---------- */
export async function manQlBaiGiay(vung, id, viec) {
  if (!S.toi.la_quan_tri) throw new Error('Màn này dành cho quản trị và Ban cố vấn.');
  if (id === 'moi') return manThongTin(vung, null);
  const admin = !!S.toi.la_admin;
  const [td, kq] = await Promise.all([S.db.tienDoBaiGiay(id), admin ? S.db.ketQuaBaiGiay(id) : null]);
  const b = td.bai;
  if (viec === 'sua') return manThongTin(vung, b);
  const lai = () => manQlBaiGiay(vung, id);
  const nguoi = td.nguoi;
  const coDD = nguoi.filter(x => x.da_diem_danh);
  const daGui = nguoi.filter(x => x.gui_luc);
  const chuaGui = coDD.filter(x => !x.gui_luc);
  const E = b.chua_hieu;
  const tlCu = (tvId) => { const x = kq && kq.bai_lam.find(y => y.id === tvId); return x ? x.tra_loi.slice() : null; };

  const doi = async (p, chu) => { await thu(() => S.db.luuBaiGiay(Object.assign({ id }, p)), chu); lai(); };

  const datMatKhau = () => {
    const o = oNhap('Mật khẩu mới', { name: 'mk', autocomplete: 'off', autocapitalize: 'none', autocorrect: 'off', spellcheck: 'false' });
    const f = h('form', {
      onsubmit: async (e) => {
        e.preventDefault();
        const ok = await thu(() => S.db.datMatKhauBaiGiay(id, f.elements.mk.value), 'Đã đặt mật khẩu');
        if (ok) { s.dong(); lai(); }
      }
    }, h('div', { class: 'nhom' }, o),
      h('p', { class: 'chu-nho', style: 'margin:-12px 0 16px' }, 'Ít nhất 4 ký tự. Không phân biệt chữ hoa, chữ thường; khoảng trắng bị bỏ qua. Nên dùng chữ không dấu hoặc số cho dễ gõ. App chỉ giữ bản đã băm nên không xem lại được; quên thì đặt mật khẩu mới. Ai đã mở phiếu thì không phải nhập lại.'),
      h('button', { class: 'nut day', type: 'submit' }, 'Lưu mật khẩu'));
    const s = moSheet({ tieuDe: 'Mật khẩu mở phiếu', noiDung: f });
    o.querySelector('input').focus({ preventScroll: true });
  };

  const suaDapAn = () => {
    const tl = kq.dap_an && kq.dap_an.length === b.so_cau ? kq.dap_an.slice() : Array(b.so_cau).fill(null);
    const nut = h('button', {
      class: 'nut day', type: 'button',
      onclick: async () => { const ok = await thu(() => S.db.luuBaiGiay({ id, dap_an: tl }), 'Đã lưu đáp án'); if (ok) { s.dong(); lai(); } }
    }, 'Lưu đáp án');
    const s = moSheet({
      tieuDe: 'Đáp án', noiDung: h('div', null,
        h('p', { class: 'chu-nho', style: 'margin-bottom:12px' }, 'Đáp án chỉ nằm ở máy chủ và chỉ quản trị xem được. Câu để trống không tính vào số câu đúng.'),
        luoiChon({ soCau: b.so_cau, soLc: b.so_lua_chon, chuaHieu: null, tl }), nut)
    });
  };

  // Không có đường nhập hộ: ai chưa kích hoạt tài khoản thì coi như vắng (anh Long chốt 21/11/2026).
  // Chỉ quản trị sửa phiếu của một người đã gửi mà chép nhầm, từ màn xem phiếu đó.
  const suaPhieu = (x) => {
    const tl = tlCu(x.id) || Array(b.so_cau).fill(null);
    const ghi = h('p', { class: 'chu-nho giua-chu', style: 'margin:0 0 12px' });
    const capNhat = () => { const t = tl.filter(v => v === null).length; ghi.textContent = t ? `Còn ${t} câu bỏ trống.` : 'Đủ ' + b.so_cau + ' câu.'; };
    const nut = h('button', {
      class: 'nut day', type: 'button',
      onclick: async () => { const ok = await thu(() => S.db.nhapHoBaiGiay(id, x.id, tl), 'Đã sửa phiếu của ' + x.ho_ten); if (ok) { s.dong(); lai(); } }
    }, 'Lưu phần sửa');
    const s = moSheet({
      tieuDe: 'Sửa phiếu', noiDung: h('div', null,
        h('p', { style: 'font-weight:600;margin-bottom:2px' }, x.ho_ten),
        h('p', { class: 'chu-nho', style: 'margin-bottom:12px' }, [x.ma, moTaTV(x)].filter(Boolean).join(' · ')),
        luoiChon({ soCau: b.so_cau, soLc: b.so_lua_chon, chuaHieu: E, tl, khiDoi: capNhat }), ghi, nut)
    });
    capNhat();
  };

  const dieuKhien = admin ? [
    nhom('Điều khiển',
      oBat('Mở cho thành viên', { checked: b.mo, onchange: (e) => doi({ mo: e.target.checked }, e.target.checked ? 'Đã mở phiếu' : 'Đã đóng phiếu') }),
      dong({ tieu: 'Mật khẩu', phu: b.co_mat_khau ? 'Đã đặt. Quên thì đặt mật khẩu mới.' : 'Chưa đặt. Cần đặt trước khi mở phiếu.', truoc: icon('khoa'), onclick: datMatKhau }),
      dong({ tieu: 'Đáp án', phu: `Đã nhập ${b.so_dap_an}/${b.so_cau} câu`, truoc: icon('phieu'), onclick: suaDapAn }),
      oBat('Cho người làm xem số câu đúng', { checked: b.hien_diem, onchange: (e) => doi({ hien_diem: e.target.checked }, 'Đã lưu') }),
      dong({ tieu: 'Thông tin phiếu', phu: 'Tên, buổi, số câu, các phần', href: `#post-test/phieu-ql/${id}/sua` })),
    h('p', { class: 'chu-nhom' }, 'Hết giờ làm bài trên giấy thì bật Mở cho thành viên rồi đọc mật khẩu. Thu đủ phiếu thì tắt để đóng.')
  ] : h('div', { class: 'bang-tin xanh' }, 'Ban cố vấn xem được ai đã gửi. Kết quả và đáp án chỉ quản trị xem được, vì Ban cố vấn cũng làm bài.');

  dat(vung,
    thanhNho('Phiếu trả lời', '#post-test', 'Post-test'),
    dauPhieu(b, `${b.so_lua_chon} phương án`),
    soLieu([
      { so: daGui.length, ten: 'Đã gửi', lop: 'dung' },
      { so: coDD.length, ten: 'Đã điểm danh buổi này' },
      { so: chuaGui.length, ten: 'Điểm danh mà chưa gửi', lop: chuaGui.length ? 'tre' : '' }
    ]),
    dieuKhien,
    admin ? ketQua(b, kq, suaPhieu, lai, id) : null,
    chuaGui.length ? nhom(`Đã điểm danh, chưa gửi · ${chuaGui.length}`, chuaGui.map(x => dong({ tieu: x.ho_ten, phu: [x.ma, moTaTV(x)].filter(Boolean).join(' · ') }))) : null,
    !admin && daGui.length ? nhom(`Đã gửi · ${daGui.length}`, daGui.map(x => dong({ tieu: x.ho_ten, phu: [x.ma, moTaTV(x), x.nhap_ho ? 'quản trị đã sửa' : null].filter(Boolean).join(' · ') }))) : null);
}

/* ---------- Kết quả (chỉ quản trị) ---------- */
function ketQua(b, kq, suaPhieu, lai, id) {
  if (!kq.bai_lam.length) return h('div', { class: 'bang-tin xanh' }, 'Chưa ai gửi phiếu.');
  const N = b.so_cau, LC = b.so_lua_chon, E = b.chua_hieu, K = kq.dap_an;
  const coDapAn = !!(K && K.some(x => x !== null));
  const coE = E !== null && E !== undefined;
  const phan = (Array.isArray(b.phan) ? b.phan : []).filter(p => p && p.tu >= 1 && p.den <= N && p.tu <= p.den);
  const bl = kq.bai_lam.map(x => {
    const dung = x.tra_loi.map((t, i) => coDapAn && K[i] !== null && t === K[i]);
    return Object.assign({}, x, {
      dung, so_dung: dung.filter(Boolean).length, so_e: coE ? x.tra_loi.filter(t => t === E).length : 0,
      diem_phan: phan.map(p => dung.slice(p.tu - 1, p.den).filter(Boolean).length)
    });
  });
  const cau = Array.from({ length: N }, (_, i) => {
    const dem = Array(LC).fill(0); let trong = 0, dung = 0;
    bl.forEach(x => { const t = x.tra_loi[i]; if (t === null || t === undefined) trong++; else dem[t]++; if (x.dung[i]) dung++; });
    const theo = (loc) => { const nh = bl.filter(loc); return nh.length ? phanTram(nh.filter(x => x.dung[i]).length, nh.length) : null; };
    return { i, dap_an: K ? K[i] : null, dem, trong, dung, theoCap: CAP.map(c => theo(x => x.cap === c)), theoNha: [...DS_NHA, null].map(n => theo(x => (x.nha || null) === n)) };
  });
  const nhomTheo = (khoa, thuTu) => {
    const m = new Map();
    bl.forEach(x => { const k = khoa(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); });
    const dong1 = (ten, ds) => ({ ten, n: ds.length, tb: tb(ds.map(x => x.so_dung)), phan: phan.map((_, j) => tb(ds.map(x => x.diem_phan[j]))), e: tb(ds.map(x => x.so_e)) });
    return [dong1('Cả CLB', bl), ...[...m.entries()].sort((a, c) => thuTu(a[0]) - thuTu(c[0])).map(([k, ds]) => dong1(k, ds))];
  };
  const theoCap = nhomTheo(x => x.cap || 'Chưa ghi cấp', k => { const i = CAP.indexOf(k); return i < 0 ? 99 : i; });
  const theoNha = nhomTheo(x => x.nha || 'Chưa có nhà', k => { const i = DS_NHA.indexOf(k); return i < 0 ? 99 : i; });

  const pt = (v, lop) => v === null || v === undefined ? '–' : lop ? h('span', { class: lop }, v + '%') : v + '%';
  const bang = (dau, hang) => h('div', { class: 'nhom bg-bang-cuon' }, h('table', { class: 'bg-bang' },
    h('thead', null, h('tr', null, dau.map(d => h('th', { scope: 'col' }, d)))),
    h('tbody', null, hang.map(r => h('tr', null, r.map((o, j) => j === 0 ? h('th', { scope: 'row' }, o) : h('td', null, o === null || o === undefined ? '–' : o)))))));
  const bangNhom = (ds) => bang(['', 'Số người', `Đúng /${N}`, ...phan.map(p => `${p.ten} /${p.den - p.tu + 1}`), ...(coE ? [`Chọn ${CHU[E]}`] : [])],
    ds.map(r => [r.ten, r.n, soVN(r.tb, 1), ...r.phan.map(v => soVN(v, 1)), ...(coE ? [soVN(r.e, 1)] : [])]));

  const tongE = coE ? bl.reduce((s, x) => s + x.so_e, 0) : 0;
  const xemBai = (x) => {
    const s = moSheet({
      tieuDe: 'Phiếu đã gửi', noiDung: h('div', null,
        h('p', { style: 'font-weight:600;margin-bottom:2px' }, x.ho_ten),
        h('p', { class: 'chu-nho', style: 'margin-bottom:12px' }, [x.ma, moTaTV(x), 'gửi ' + ngayGio(x.gui_luc), x.nhap_ho ? 'quản trị đã sửa' : null].filter(Boolean).join(' · ')),
        coDapAn ? soLieu([{ so: `${x.so_dung}/${N}`, ten: 'Câu đúng', lop: 'dung' }, ...phan.map((p, j) => ({ so: `${x.diem_phan[j]}/${p.den - p.tu + 1}`, ten: p.ten })), ...(coE ? [{ so: x.so_e, ten: `Chọn ${CHU[E]}`, lop: x.so_e ? 'tre' : '' }] : [])]) : null,
        luoiChon({ soCau: N, soLc: LC, chuaHieu: E, tl: x.tra_loi, chiXem: true, dapAn: coDapAn ? K : null }),
        h('div', { class: 'hang-nut' },
          h('button', { class: 'nut phu', type: 'button', onclick: () => { s.dong(); suaPhieu(x); } }, 'Sửa phiếu'),
          h('button', {
            class: 'nut nguy', type: 'button', onclick: async () => {
              if (!await xacNhan({ tieuDe: 'Xóa phiếu này?', chu: `${x.ho_ten} sẽ chọn lại và gửi lại trên app, không cần mật khẩu lần nữa.`, nut: 'Xóa phiếu', nguy: true })) return;
              const ok = await thu(() => S.db.xoaBaiGiayLam(id, x.id), 'Đã xóa');
              if (ok) { s.dong(); lai(); }
            }
          }, 'Xóa để gửi lại')))
    });
  };

  const tenTep = 'phieu-tra-loi-' + (b.buoi_bat_dau ? String(b.buoi_bat_dau).slice(0, 10) : 'bai-giay');
  const csvNguoi = () => taiCSV(tenTep + '-tung-nguoi.csv', [
    ['Mã', 'Họ và tên', 'Gen', 'Nhà', 'Cấp', 'Gửi lúc', 'Quản trị sửa', 'Số câu đúng', ...phan.map(p => `${p.ten} (câu ${p.tu}-${p.den})`), ...(coE ? [`Số câu chọn ${CHU[E]}`] : []),
      ...cau.map(c => `Câu ${c.i + 1}`), ...cau.map(c => `Đúng câu ${c.i + 1}`)],
    ...bl.map(x => [x.ma, x.ho_ten, x.gen, x.nha || 'Chưa có nhà', x.cap, ngayGio(x.gui_luc), x.nhap_ho ? 'có' : '', coDapAn ? x.so_dung : '', ...x.diem_phan, ...(coE ? [x.so_e] : []),
      ...x.tra_loi.map(t => t === null || t === undefined ? '' : CHU[t]), ...x.dung.map(d => coDapAn ? (d ? 1 : 0) : '')])]);
  const csvCau = () => taiCSV(tenTep + '-tung-cau.csv', [
    ['Câu', 'Đáp án', 'Số người', 'Số đúng', 'Đúng (%)', ...(coE ? [`Chọn ${CHU[E]} (%)`] : []), 'Bỏ trống', ...Array.from({ length: LC }, (_, j) => 'Chọn ' + CHU[j]),
      ...CAP.map(c => `Đúng (%) ${c}`), ...DS_NHA.map(n => `Đúng (%) ${n}`), 'Đúng (%) Chưa có nhà'],
    ...cau.map(c => [c.i + 1, c.dap_an === null || c.dap_an === undefined ? '' : CHU[c.dap_an], bl.length, c.dung, phanTram(c.dung, bl.length), ...(coE ? [phanTram(c.dem[E], bl.length)] : []), c.trong, ...c.dem,
      ...c.theoCap.map(v => v ?? ''), ...c.theoNha.map(v => v ?? '')])]);

  return [
    !coDapAn ? h('div', { class: 'bang-tin' }, 'Chưa nhập đáp án nên chưa chấm được. Bấm Đáp án ở mục Điều khiển.') : null,
    coDapAn ? soLieu([
      { so: soVN(tb(bl.map(x => x.so_dung)), 1), ten: `Trung bình câu đúng /${N}` },
      ...(coE ? [{ so: (phanTram(tongE, bl.length * N) ?? 0) + '%', ten: `Lượt chọn ${CHU[E]} (chưa hiểu)`, lop: 'tre' }] : [])
    ]) : null,
    coDapAn ? [h('div', { class: 'nhan-nhom' }, 'Từng câu'), bang(['Câu', 'Đáp án', 'Đúng', ...(coE ? [`Chọn ${CHU[E]}`] : []), 'Junior', 'Senior', 'BCV'],
      cau.map(c => [String(c.i + 1), chuCua(c.dap_an), pt(phanTram(c.dung, bl.length), phanTram(c.dung, bl.length) < 50 ? 'thap' : null),
        ...(coE ? [pt(phanTram(c.dem[E], bl.length), phanTram(c.dem[E], bl.length) >= 25 ? 'e-cao' : null)] : []), ...c.theoCap.map(v => pt(v))])),
      h('p', { class: 'chu-nhom' }, `Đỏ: dưới 50% đúng.${coE ? ` Cam: từ 25% chọn ${CHU[E]} trở lên.` : ''} Junior, Senior, BCV: tỷ lệ đúng trong từng cấp.`)] : null,
    coDapAn ? [h('div', { class: 'nhan-nhom' }, 'Theo cấp · trung bình số câu'), bangNhom(theoCap)] : null,
    coDapAn ? [h('div', { class: 'nhan-nhom' }, 'Theo nhà · trung bình số câu'), bangNhom(theoNha)] : null,
    nhom(`Đã gửi · ${bl.length} người`, bl.map(x => dong({
      tieu: x.ho_ten, phu: [x.ma, moTaTV(x), x.nhap_ho ? 'quản trị đã sửa' : null].filter(Boolean).join(' · '),
      sau: coDapAn ? `${x.so_dung}/${N}` : 'Đã gửi', onclick: () => xemBai(x)
    }))),
    h('div', { class: 'hang-nut', style: 'margin-bottom:22px' },
      h('button', { class: 'nut phu', type: 'button', onclick: csvNguoi }, 'CSV từng người'),
      h('button', { class: 'nut phu', type: 'button', onclick: csvCau }, 'CSV từng câu'))
  ];
}

/* ---------- Tạo, sửa thông tin phiếu (chỉ quản trị) ---------- */
const phanThanhChu = (ds) => (ds || []).map(p => `${p.ten}: ${p.tu}-${p.den}`).join('; ');
function docPhan(chu, soCau) {
  const kq = [];
  for (const m of String(chu || '').split(/[;\n]/).map(x => x.trim()).filter(Boolean)) {
    const k = m.match(/^(.+?)\s*[:：]\s*(\d+)\s*[-–—]\s*(\d+)$/);
    if (!k) throw new Error(`Không đọc được phần "${m}". Viết theo mẫu: Nền: 1-7; Áp dụng: 8-15`);
    const tu = Number(k[2]), den = Number(k[3]);
    if (tu < 1 || den > soCau || tu > den) throw new Error(`Phần "${k[1]}" vượt ngoài câu 1–${soCau}.`);
    kq.push({ ten: k[1].trim(), tu, den });
  }
  return kq;
}

async function manThongTin(vung, b) {
  if (!S.toi.la_admin) throw new Error('Chỉ quản trị tạo và sửa phiếu.');
  const nay = Date.now(), ngay1 = 864e5;
  const dsB = await S.db.dsBuoi(new Date(nay - 60 * ngay1).toISOString(), new Date(nay + 60 * ngay1).toISOString());
  if (b && !dsB.some(x => x.id === b.buoi_id)) dsB.unshift({ id: b.buoi_id, ten: b.buoi_ten, bat_dau: b.buoi_bat_dau });
  const macDinh = b ? b.buoi_id : (dsB.find(x => new Date(x.bat_dau).getTime() >= nay - 12 * 3600e3) || dsB[dsB.length - 1] || {}).id;
  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const x = f.elements;
      const so = Number(x.so.value), lc = Number(x.lc.value), ch = x.ch.value === '' ? null : Number(x.ch.value);
      let phan;
      try {
        if (!x.ten.value.trim()) throw new Error('Cần đặt tên phiếu.');
        if (!x.buoi.value) throw new Error('Cần chọn buổi.');
        if (!Number.isInteger(so) || so < 1 || so > 100) throw new Error('Số câu từ 1 đến 100.');
        if (ch !== null && ch >= lc) throw new Error('Phương án "chưa hiểu" phải nằm trong số phương án.');
        phan = docPhan(x.phan.value, so);
      } catch (er) { toast(er.message, true); return; }
      const p = { ten: x.ten.value.trim(), buoi_id: x.buoi.value, so_cau: so, so_lua_chon: lc, chua_hieu: ch, chu_thich: x.ct.value, phan };
      if (b) p.id = b.id;
      const moi = await thu(() => S.db.luuBaiGiay(p), b ? 'Đã lưu' : 'Đã tạo phiếu');
      if (moi) location.hash = 'post-test/phieu-ql/' + moi;
    }
  },
    h('div', { class: 'nhom' },
      oNhap('Tên phiếu', { name: 'ten', value: b ? b.ten : 'Pretest thống kê y sinh', maxlength: 120 }),
      oChon('Buổi', dsB.map(x => [x.id, `${ngay(x.bat_dau)} · ${x.ten}`]), macDinh, { name: 'buoi' }),
      oNhap('Số câu', { name: 'so', type: 'number', min: 1, max: 100, value: b ? b.so_cau : 20, inputmode: 'numeric' }),
      oChon('Số phương án', [2, 3, 4, 5, 6, 7, 8].map(n => [n, `${n} (A–${CHU[n - 1]})`]), b ? b.so_lua_chon : 5, { name: 'lc' }),
      oChon('Phương án "chưa hiểu" (chấm sai, đếm riêng)', [['', 'Không có'], ...CHU.split('').map((c, i) => [i, c])], b ? (b.chua_hieu ?? '') : 4, { name: 'ch' }),
      oNhap('Chú thích hiện trên phiếu', { name: 'ct', value: b ? (b.chu_thich || '') : 'E: Em hoàn toàn chưa hiểu khái niệm trong câu hỏi', maxlength: 300 }),
      oNhap('Các phần, để tính điểm từng phần', { name: 'phan', value: b ? phanThanhChu(b.phan) : 'Nền: 1-7; Áp dụng: 8-15; Dẫn dắt: 16-20', placeholder: 'Phần 1: 1-7; Phần 2: 8-15' })),
    h('p', { class: 'chu-nhom' }, 'Chỉ người đã điểm danh buổi này mở được phiếu. Đã có người gửi thì không đổi được số câu, số phương án.'),
    h('button', { class: 'nut day', type: 'submit' }, b ? 'Lưu' : 'Tạo phiếu'));
  dat(vung,
    thanhNho(b ? 'Sửa phiếu' : 'Phiếu mới', b ? '#post-test/phieu-ql/' + b.id : '#post-test', b ? 'Phiếu' : 'Post-test'),
    f);
}
