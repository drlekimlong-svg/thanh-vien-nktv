// Soạn lịch sinh hoạt ngay trong app và kho lịch đã lưu. Mẫu ảnh lấy nguyên từ app soạn lịch cũ (lich-ve.js).
import { S, khiRoi } from './state.js';
import { h, dat, dong, nhom, moSheet, thu, toast, oNhap, gio, ngay, ngayGio, rong, dauNgay, xacNhan, taiCSV } from './ui.js';
import * as V from './lich-ve.js';

const KHOA_NHA = { Seiryu: 'seiryu', Suzaku: 'suzaku', Byakko: 'byakko', Genbu: 'genbu', Kirin: 'kirin', 'Yin-Yang Kois': 'koi' };
const thanhNho = (tieu, href, nhan, phai) => h('div', { class: 'thanh-nho' }, h('div', { class: 'khoang' }, h('a', { class: 'nut-lui', href, style: 'text-decoration:none' }, '‹ ' + nhan)), h('h1', null, tieu), h('div', { class: 'khoang phai' }, phai || null));
/** Nhà được soạn lịch: người phụ trách, Ban cố vấn, quản trị soạn cho mọi nhà; nhóm trưởng, nhóm phó cho nhà mình. */
const nhaDuocSoan = () => S.toi.lich_moi_nha ? V.GROUPS : S.toi.lich_nha && KHOA_NHA[S.toi.lich_nha] ? [KHOA_NHA[S.toi.lich_nha]] : [];
const suaDuoc = (l) => nhaDuocSoan().includes(l.nhom);
const tenLich = (l) => l.ten || 'Chương trình chưa đặt tên';

/* Trang soạn lịch cũ cùng tên miền với app nên bản nháp trong trình duyệt vẫn đọc được. */
const KHOA_NHAP_CU = 'nktv-lich-sinh-hoat-v1';
let choMo = null;
const docNhapCu = () => { try { const o = JSON.parse(localStorage.getItem(KHOA_NHAP_CU)); return o && o.sample !== true ? V.normalize(o) : null; } catch (_) { return null; } };
const xoaNhapCu = () => { try { localStorage.removeItem(KHOA_NHAP_CU); } catch (_) { /* không có bộ nhớ */ } };

function taiFile(blob, ten) {
  const u = URL.createObjectURL(blob), a = h('a', { href: u, download: ten, rel: 'noopener' });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 6000);
}
const chiaSeDuoc = () => {
  if (!navigator.share || !navigator.canShare) return false;
  try { return navigator.canShare({ files: [new File([new Blob(['x'], { type: 'image/png' })], 'x.png', { type: 'image/png' })] }); } catch (_) { return false; }
};
const anhTu = (cv) => new Promise(r => cv.toBlob(r, 'image/png'));
async function chiaSe(cv, st) {
  const b = await anhTu(cv);
  try { await navigator.share({ files: [new File([b], V.tenTep(st) + '.png', { type: 'image/png' })], title: V.tenTep(st) }); }
  catch (e) { if (e && e.name !== 'AbortError') toast('Máy này chưa chia sẻ được. Dùng nút Tải ảnh.', true); }
}

const nhaMacDinh = () => { const ds = nhaDuocSoan(); return ds.includes(KHOA_NHA[S.toi.nha]) ? KHOA_NHA[S.toi.nha] : ds[0]; };

function moi() {
  return V.normalize({ mau: 'tuan', kho: 'post', nhom: nhaMacDinh(), ngay: V.nextSunday(), gioBD: '14:00', gioKT: '18:00', dd1: 'Phòng [số phòng], khu A2', dd2: 'ĐHYK Phạm Ngọc Thạch',
    chuTri: '', dieuHanh: '', tenCT: '', phuCT: '', moTa: '', qrLink: '', qrNote: '', rows: [{ t1: '14:00', t2: '', title: '', who: '', org: '' }] });
}

/* ---------- Soạn lịch ---------- */
export async function manSoanLich(vung, id, idMau) {
  const choPhep = nhaDuocSoan();
  if (!choPhep.length) {
    dat(vung, thanhNho('Soạn lịch', '#lich', 'Lịch'),
      rong('Nhóm trưởng, nhóm phó của nhà trực, Ban cố vấn và người phụ trách soạn được lịch. Lịch đã gửi xem ở Kho lịch.'),
      h('a', { class: 'nut phu day', href: '#lich/kho' }, 'Mở Kho lịch'));
    return;
  }
  await V.napTaiNguyen();
  let banGhi = null, st, tuNhap = null;
  const lichMoi = !id && !idMau;
  if (lichMoi && choMo) { tuNhap = choMo; st = choMo.st; choMo = null; }
  else if (id && id !== 'moi') {
    banGhi = await S.db.docLich(id);
    if (!banGhi) throw new Error('Không tìm thấy lịch này.');
    st = V.normalize(banGhi.du_lieu);
  } else if (idMau) {
    const m = await S.db.docLich(idMau);
    st = V.normalize(Object.assign({}, m.du_lieu, { ngay: V.nextSunday(), nhom: nhaMacDinh() }));
  } else st = moi();
  if (banGhi && !suaDuoc(banGhi)) throw new Error('Lịch này thuộc nhà khác. Mở trong Kho lịch để xem.');
  if (!choPhep.includes(st.nhom)) st.nhom = nhaMacDinh();

  const cv = h('canvas', { width: 1080, height: 1350, role: 'img', 'aria-label': 'Ảnh xem trước lịch sinh hoạt', class: 'anh-lich' }), ctx = cv.getContext('2d');
  const dsKiem = h('div'), demKiem = h('span'), baoLuu = h('span', { class: 'chu-nho' });
  let lay = null, khung = 0, henLuu = 0, chuaLuu = false, dangLuu = false;
  const daGui = () => banGhi && banGhi.trang_thai === 'da_gui';

  const ve = () => {
    khung = 0;
    const F = V.fmt(st);
    if (cv.height !== F.H) cv.height = F.H;
    lay = V.drawPoster(ctx, st);
    const ds = V.checks(st, lay), loi = ds.filter(c => c.level === 'err').length;
    demKiem.textContent = ds.length ? `${ds.length} điểm cần xem lại` + (loi ? `, ${loi} lỗi` : '') : 'Sẵn sàng gửi';
    dat(dsKiem, ds.length ? ds.map(c => h('div', { class: 'kiem ' + c.level }, h('i'), h('p', null, c.text),
      c.fix ? h('button', { class: 'nut phu nho', type: 'button', onclick: () => sua(c.fix) }, c.fix.label) : null)) : h('div', { class: 'kiem ok' }, h('i'), h('p', null, 'Không có gì cần xem lại.')));
  };
  const henVe = () => { if (!khung) khung = requestAnimationFrame(ve); };

  const luuNhap = async () => {
    clearTimeout(henLuu);
    if (!chuaLuu || dangLuu || daGui()) return;
    dangLuu = true; chuaLuu = false;
    try {
      const kq = await S.db.luuLich(banGhi ? banGhi.id : null, V.duLieu(st), false);
      if (!banGhi) { banGhi = { id: kq.id, trang_thai: kq.trang_thai, nguoi_tao: S.toi.id, nhom: st.nhom }; history.replaceState(null, '', '#lich/soan/' + kq.id); }
      baoLuu.textContent = 'Đã lưu nháp lúc ' + gio(new Date());
      if (tuNhap && tuNhap.cuaMay) xoaNhapCu();
    } catch (e) { chuaLuu = true; baoLuu.textContent = 'Chưa lưu được nháp: ' + e.message; }
    dangLuu = false;
  };
  const doi = () => {
    henVe(); chuaLuu = true;
    if (daGui()) { baoLuu.textContent = 'Có thay đổi chưa cập nhật'; return; }
    clearTimeout(henLuu); henLuu = setTimeout(luuNhap, 1500);
  };
  khiRoi(() => { if (khung) cancelAnimationFrame(khung); luuNhap(); });

  const sua = (fx) => {
    if (fx.act === 'gap') st.rows.splice(fx.at, 0, { id: V.rid(), t1: fx.t1, t2: fx.t2, title: 'Giải lao', who: '', org: '' });
    if (fx.act === 'sort') V.sortRowsOf(st.rows);
    if (fx.act === 'span') { st.gioBD = fx.t1; st.gioKT = fx.t2; f.elements.gioBD.value = fx.t1; f.elements.gioKT.value = fx.t2; }
    veMuc(); doi();
  };

  /* Các ô */
  const o = (nhan, k, tt) => oNhap(nhan, Object.assign({ name: k, value: st[k] || '', autocomplete: 'off', oninput: (e) => { st[k] = e.target.value; doi(); } }, tt));
  const thuCua = h('span', { class: 'chu-nho' }, V.weekday(st.ngay));
  const khungCT = h('div', { class: 'nhom' },
    o('Tên chương trình', 'tenCT', { maxlength: 120, placeholder: '“Chill” cùng Ngoại khoa' }),
    o('Dòng phụ (không bắt buộc)', 'phuCT', { maxlength: 120 }),
    o('Mô tả ngắn (không bắt buộc)', 'moTa', { the: 'textarea', rows: 3, maxlength: 400 }));
  const nutLoai = [['tuan', 'Lịch tuần'], ['dacbiet', 'Chương trình đặc biệt']].map(([v, c]) => h('button', { class: 'vien', type: 'button', 'aria-pressed': st.mau === v ? 'true' : 'false', 'data-v': v, onclick: () => { st.mau = v; capLoai(); doi(); } }, c));
  const capLoai = () => { nutLoai.forEach(n => n.setAttribute('aria-pressed', n.dataset.v === st.mau ? 'true' : 'false')); khungCT.hidden = st.mau !== 'dacbiet'; };
  const nutNha = V.GROUPS.map(g => h('button', {
    class: 'chon-nha', type: 'button', 'aria-pressed': st.nhom === g ? 'true' : 'false', 'data-g': g, style: `--mau:${V.THEMES[g].col}`, disabled: !choPhep.includes(g),
    onclick: () => { st.nhom = g; nutNha.forEach(n => n.setAttribute('aria-pressed', n.dataset.g === g ? 'true' : 'false')); doi(); }
  }, h('img', { src: `img/${g}.webp`, alt: '' }), h('span', null, V.THEMES[g].name)));

  /* Chương trình */
  const danhMuc = h('div');
  const CHON_ORG = [['', 'Không ghi nhóm'], ...V.GROUPS.map(g => [g, 'Nhóm ' + V.THEMES[g].name]), ['bcv', 'Cố vấn (BCV)'], ['khach', 'Khách mời']];
  const veMuc = () => {
    dat(danhMuc, st.rows.map((r, i) => {
      const chonOrg = h('select', { 'aria-label': `Mục ${i + 1}, nhóm hoặc vai trò`, onchange: (e) => { r.org = e.target.value; doi(); } }, CHON_ORG.map(([v, c]) => h('option', { value: v, selected: (r.org || '') === v }, c)));
      const oWho = h('input', { list: 'ds-nguoi', value: r.who, placeholder: 'Chức danh, họ tên người trình bày', autocomplete: 'off', 'aria-label': `Mục ${i + 1}, người trình bày`, oninput: (e) => { r.who = e.target.value; doi(); },
        onchange: (e) => { const p = V.parseWho(e.target.value); if (p.org && (!r.org || r.org === p.org)) { r.who = p.who; r.org = p.org; e.target.value = p.who; chonOrg.value = p.org; doi(); } } });
      const doiCho = (d) => { const j = i + d; if (j < 0 || j >= st.rows.length) return; st.rows.splice(i, 1); st.rows.splice(j, 0, r); veMuc(); doi(); };
      return h('div', { class: 'soan-cau muc-lich' },
        h('div', { class: 'so-cau' }, `Mục ${i + 1}`, h('span', { style: 'display:flex;gap:2px' },
          h('button', { class: 'nut-chu', type: 'button', disabled: i === 0, 'aria-label': `Đưa mục ${i + 1} lên`, onclick: () => doiCho(-1) }, 'Lên'),
          h('button', { class: 'nut-chu', type: 'button', disabled: i === st.rows.length - 1, 'aria-label': `Đưa mục ${i + 1} xuống`, onclick: () => doiCho(1) }, 'Xuống'),
          h('button', { class: 'nut-chu', type: 'button', style: 'color:var(--vang)', 'aria-label': `Xóa mục ${i + 1}`, onclick: () => { st.rows.splice(i, 1); if (!st.rows.length) st.rows.push({ id: V.rid(), t1: st.gioBD || '', t2: '', title: '', who: '', org: '' }); veMuc(); doi(); } }, 'Xóa'))),
        h('div', { class: 'hang-gio' },
          h('input', { type: 'time', value: r.t1, 'aria-label': `Mục ${i + 1}, bắt đầu`, oninput: (e) => { r.t1 = e.target.value; doi(); } }), h('span', null, '–'),
          h('input', { type: 'time', value: r.t2, 'aria-label': `Mục ${i + 1}, kết thúc`, oninput: (e) => { r.t2 = e.target.value; doi(); } })),
        h('input', { value: r.title, placeholder: 'Nội dung', autocomplete: 'off', 'aria-label': `Mục ${i + 1}, nội dung`, oninput: (e) => { r.title = e.target.value; doi(); } }),
        oWho, chonOrg);
    }));
  };

  /* Mở bản nháp của trang cũ: trong trình duyệt này, hoặc tệp .json đã lưu */
  const moNhap = (s, cuaMay) => { clearTimeout(henLuu); chuaLuu = false; choMo = { st: s, cuaMay }; manSoanLich(vung); };
  const nhapCu = lichMoi && !tuNhap ? docNhapCu() : null;
  const hopNhapCu = nhapCu ? h('div', { class: 'nhom', style: 'padding:12px 16px' },
    h('p', { style: 'margin:0 0 10px' }, 'Máy này còn một bản nháp từ trang lịch cũ: ', h('b', null, nhapCu.mau === 'dacbiet' ? (nhapCu.tenCT || 'Chương trình đặc biệt') : 'Lịch tuần'), nhapCu.ngay ? ', ngày ' + ngay(nhapCu.ngay + 'T12:00:00+07:00') : '', '.'),
    h('div', { class: 'hang-nut' },
      h('button', { class: 'nut nho', type: 'button', onclick: () => moNhap(nhapCu, true) }, 'Mở bản nháp'),
      h('button', { class: 'nut phu nho', type: 'button', onclick: async () => {
        if (await xacNhan({ tieuDe: 'Bỏ bản nháp cũ?', chu: 'Bản nháp này sẽ bị xóa khỏi máy.', nut: 'Bỏ bản nháp', nguy: true })) { xoaNhapCu(); hopNhapCu.remove(); }
      } }, 'Bỏ'))) : null;
  const chonTep = h('input', { type: 'file', accept: '.json,application/json', style: 'display:none', 'aria-label': 'Chọn tệp bản nháp', onchange: async (e) => {
    const tep = e.target.files[0]; e.target.value = '';
    if (!tep) return;
    let s = null;
    try { s = V.normalize(JSON.parse(await tep.text())); } catch (_) { /* báo ở dưới */ }
    if (s) moNhap(s, false); else toast('Tệp này không phải bản nháp lịch.', true);
  } });

  const f = h('form', { onsubmit: (e) => e.preventDefault(), class: 'o-nhap-lich' },
    hopNhapCu,
    h('div', { class: 'chon-ngang' }, nutLoai), khungCT,
    h('div', { class: 'nhan-nhom' }, 'Nhóm trực'), h('div', { class: 'luoi-nha' }, nutNha),
    h('div', { class: 'nhan-nhom' }, 'Ngày, giờ và địa điểm', thuCua),
    h('div', { class: 'nhom' },
      oNhap('Ngày sinh hoạt', { name: 'ngay', type: 'date', value: st.ngay, oninput: (e) => { st.ngay = e.target.value; thuCua.textContent = V.weekday(st.ngay); doi(); } }),
      o('Giờ bắt đầu', 'gioBD', { type: 'time' }), o('Giờ kết thúc', 'gioKT', { type: 'time' }),
      o('Địa điểm, dòng 1', 'dd1'), o('Địa điểm, dòng 2', 'dd2')),
    h('div', { class: 'nhan-nhom' }, 'Chương trình', h('button', { class: 'nut-chu', type: 'button', onclick: () => { V.sortRowsOf(st.rows); veMuc(); doi(); } }, 'Xếp theo giờ')),
    danhMuc,
    h('button', { class: 'nut phu day', type: 'button', style: 'margin-bottom:22px', onclick: () => { const c = st.rows[st.rows.length - 1]; st.rows.push({ id: V.rid(), t1: c && c.t2 ? c.t2 : '', t2: '', title: '', who: '', org: '' }); veMuc(); doi(); } }, 'Thêm mục'),
    h('div', { class: 'nhan-nhom' }, 'Phụ trách buổi'),
    h('div', { class: 'nhom' }, o('Chủ trì', 'chuTri', { placeholder: 'BS. Nguyễn Văn A' }), o('Điều hành', 'dieuHanh', { placeholder: 'SV. Trần Thị B' })),
    h('div', { class: 'nhan-nhom' }, 'Mã QR trên ảnh (không bắt buộc)'),
    h('div', { class: 'nhom' }, o('Link', 'qrLink', { type: 'url', inputmode: 'url', maxlength: 300, placeholder: 'https://forms.gle/…' }), o('Chú thích cạnh mã', 'qrNote', { maxlength: 40, placeholder: 'Đăng ký tham gia' })),
    h('datalist', { id: 'ds-nguoi' }, ['Thành viên CLB', 'Ban tổ chức', 'Ban chủ nhiệm'].map(v => h('option', { value: v }))),
    lichMoi ? h('button', { class: 'nut-chu', type: 'button', onclick: () => chonTep.click() }, 'Mở tệp bản nháp từ trang cũ (.json)') : null, chonTep);

  /* Xem trước và các nút */
  const nutKho = [['post', 'Bài đăng 4:5'], ['story', 'Story 9:16']].map(([v, c]) => h('button', { class: 'vien', type: 'button', 'aria-pressed': st.kho === v ? 'true' : 'false', 'data-v': v, onclick: () => { st.kho = v; nutKho.forEach(n => n.setAttribute('aria-pressed', n.dataset.v === v ? 'true' : 'false')); doi(); } }, c));
  const nutGui = h('button', { class: 'nut day', type: 'button', onclick: async () => {
    ve();
    const ds = V.checks(st, lay), loi = ds.filter(c => c.level === 'err'), canh = ds.filter(c => c.level === 'warn');
    if (loi.length) { toast(`Còn ${loi.length} lỗi trong phần Cần xem lại, sửa xong mới gửi được.`, true); return; }
    if (canh.length && !await xacNhan({ tieuDe: 'Vẫn gửi?', chu: `Còn ${canh.length} cảnh báo: ${canh[0].text}${canh.length > 1 ? ' …' : ''}`, nut: 'Vẫn gửi' })) return;
    clearTimeout(henLuu); nutGui.disabled = true;
    const lanDau = !daGui();
    const kq = await thu(() => S.db.luuLich(banGhi ? banGhi.id : null, V.duLieu(st), true), lanDau ? 'Đã gửi lịch. Lịch hiện ở tab Lịch và đã có thông báo.' : 'Đã cập nhật lịch');
    nutGui.disabled = false;
    if (kq) { chuaLuu = false; if (tuNhap && tuNhap.cuaMay) xoaNhapCu(); location.hash = 'lich/kho'; }
  } }, daGui() ? 'Cập nhật lịch' : 'Xác nhận và gửi');
  const xem = h('aside', { class: 'o-xem' },
    h('div', { class: 'chon-ngang' }, nutKho),
    h('div', { class: 'hop-anh' }, cv),
    h('div', { class: 'hang-nut', style: 'margin:12px 0' },
      h('button', { class: 'nut phu', type: 'button', onclick: async () => { ve(); taiFile(await anhTu(cv), V.tenTep(st) + '.png'); } }, 'Tải ảnh PNG'),
      chiaSeDuoc() ? h('button', { class: 'nut phu', type: 'button', onclick: () => { ve(); chiaSe(cv, st); } }, 'Chia sẻ ảnh') : null),
    h('div', { class: 'nhan-nhom' }, 'Cần xem lại'), h('div', { class: 'nhom', style: 'padding:6px 0' }, dsKiem),
    nutGui,
    h('button', { class: 'nut phu day', type: 'button', style: 'margin-top:10px', onclick: () => { const x = V.buildXlsx(st, S.toi.ho_ten, new Date()); taiFile(x.blob, V.tenTep(Object.assign({}, st, { kho: 'post' })) + '.xlsx'); } }, 'Tải file Excel'),
    !daGui() ? h('button', { class: 'nut nguy day', type: 'button', style: 'margin-top:10px', onclick: async () => {
      if (!await xacNhan({ tieuDe: 'Bỏ bản nháp này?', nut: 'Bỏ bản nháp', nguy: true })) return;
      clearTimeout(henLuu); chuaLuu = false;
      const ok = !banGhi || await thu(() => S.db.xoaLich(banGhi.id), 'Đã bỏ bản nháp');
      if (ok) location.hash = 'lich/kho';
    } }, 'Bỏ bản nháp') : null);
  const moXem = () => {
    ve();
    moSheet({ tieuDe: 'Xem trước', noiDung: (than) => than.append(xem), khiDong: () => khungXem.append(xem) });
  };
  const khungXem = h('div', { class: 'cot-xem' }, xem);

  dat(vung,
    thanhNho(banGhi ? 'Sửa lịch' : 'Soạn lịch', '#lich', 'Lịch'),
    h('div', { class: 'khung-soan' }, f, khungXem),
    h('div', { class: 'thanh-soan' }, h('div', { class: 'giua' }, demKiem, h('br'), baoLuu), h('button', { class: 'nut nho', type: 'button', onclick: moXem }, 'Xem và gửi')));
  vung.className = 'noi-dung rong';
  capLoai(); veMuc(); ve();
  if (tuNhap) doi();
}

/* ---------- Xem một lịch đã lưu ---------- */
export async function moLich(l, sauKhi) {
  await V.napTaiNguyen();
  const st = V.normalize(l.du_lieu);
  const cv = h('canvas', { width: 1080, height: V.fmt(st).H, class: 'anh-lich', role: 'img', 'aria-label': 'Ảnh lịch sinh hoạt' });
  const ve = () => { const F = V.fmt(st); if (cv.height !== F.H) cv.height = F.H; V.drawPoster(cv.getContext('2d'), st); };
  ve();
  const nutKho = [['post', 'Bài đăng 4:5'], ['story', 'Story 9:16']].map(([v, c]) => h('button', { class: 'vien', type: 'button', 'aria-pressed': st.kho === v ? 'true' : 'false', 'data-v': v, onclick: () => { st.kho = v; nutKho.forEach(n => n.setAttribute('aria-pressed', n.dataset.v === v ? 'true' : 'false')); ve(); } }, c));
  const s = moSheet({
    tieuDe: tenLich(l),
    noiDung: h('div', null,
      h('div', { class: 'chon-ngang' }, nutKho),
      h('div', { class: 'hop-anh', style: 'margin-bottom:12px' }, cv),
      h('div', { class: 'hang-nut', style: 'margin-bottom:16px' },
        h('button', { class: 'nut', type: 'button', onclick: async () => taiFile(await anhTu(cv), V.tenTep(st) + '.png') }, 'Tải ảnh PNG'),
        chiaSeDuoc() ? h('button', { class: 'nut phu', type: 'button', onclick: () => chiaSe(cv, st) }, 'Chia sẻ ảnh') : null),
      nhom(null,
        dong({ tieu: l.trang_thai === 'da_gui' ? 'Đã gửi' : 'Bản nháp', phu: [l.nguoi_tao_ten && 'Người soạn: ' + l.nguoi_tao_ten, l.gui_luc && ngayGio(l.gui_luc)].filter(Boolean).join(' · ') }),
        dong({ tieu: 'Tải file Excel', onclick: () => { const x = V.buildXlsx(st, l.nguoi_tao_ten || '', new Date(l.gui_luc || l.sua_luc)); taiFile(x.blob, V.tenTep(Object.assign({}, st, { kho: 'post' })) + '.xlsx'); } }),
        dong({ tieu: 'Dùng làm mẫu cho lịch mới', href: '#lich/soan/moi/' + l.id }),
        suaDuoc(l) ? dong({ tieu: 'Sửa lịch này', href: '#lich/soan/' + l.id }) : null,
        suaDuoc(l) ? h('button', { class: 'dong', type: 'button', style: 'color:var(--vang);font-weight:500', onclick: async () => {
          if (!await xacNhan({ tieuDe: 'Xóa lịch này?', chu: 'Buổi do lịch này tạo cũng bị xóa nếu chưa có điểm danh hay đơn xin nghỉ. Không khôi phục được.', nut: 'Xóa lịch', nguy: true })) return;
          const ok = await thu(() => S.db.xoaLich(l.id), 'Đã xóa lịch');
          if (ok) { s.dong(); if (sauKhi) sauKhi(); }
        } }, 'Xóa lịch') : null))
  });
}

/* ---------- Kho lịch ---------- */
export async function manKhoLich(vung) {
  const ds = await S.db.dsLich();
  const lai = () => manKhoLich(vung);
  let g = '', tim = '';
  const vungDs = h('div');
  const chuan = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  const veDs = () => {
    const k = chuan(tim);
    const kq = ds.filter(l => (!g || l.nhom === g) && (!k || chuan(tenLich(l) + ' ' + JSON.stringify(l.du_lieu.rows) + ' ' + l.du_lieu.chuTri + ' ' + l.du_lieu.dieuHanh + ' ' + l.du_lieu.phuCT).includes(k)));
    const nhap = kq.filter(l => l.trang_thai === 'nhap'), gui = kq.filter(l => l.trang_thai === 'da_gui');
    const hang = (l) => dong({
      truoc: l.ngay ? dauNgay(l.ngay + 'T12:00:00+07:00') : null, tieu: tenLich(l),
      phu: 'Trực: ' + V.THEMES[l.nhom].name + (l.nguoi_tao_ten ? ' · ' + l.nguoi_tao_ten : '') + ` · ${(l.du_lieu.rows || []).length} mục`,
      onclick: () => moLich(l, lai)
    });
    dat(vungDs,
      nhap.length ? nhom('Bản nháp', nhap.map(l => dong({ truoc: l.ngay ? dauNgay(l.ngay + 'T12:00:00+07:00') : null, tieu: tenLich(l), phu: 'Trực: ' + V.THEMES[l.nhom].name + (l.nguoi_sua_ten ? ' · ' + l.nguoi_sua_ten : '') + ' · Sửa ' + ngay(l.sua_luc), href: '#lich/soan/' + l.id }))) : null,
      gui.length ? nhom(`Đã gửi · ${gui.length}`, gui.map(hang)) : null,
      !kq.length ? rong(ds.length ? 'Không có lịch nào khớp.' : nhaDuocSoan().length ? 'Chưa có lịch nào. Bấm Soạn để bắt đầu.' : 'Chưa có lịch nào được gửi.') : null);
  };
  const xuat = () => {
    const hang = [['Ngày', 'Thứ', 'Loại lịch', 'Tên', 'Nhóm trực', 'Giờ', 'Địa điểm', 'Chủ trì', 'Điều hành', 'Người soạn', 'STT', 'Bắt đầu', 'Kết thúc', 'Nội dung', 'Chức danh – họ tên', 'Nhóm / vai trò']];
    ds.filter(l => l.trang_thai === 'da_gui').forEach(l => {
      const st = V.normalize(l.du_lieu), it = V.itemsOf(st), su = V.summaryOf(st, it);
      (it.length ? it : [{}]).forEach(m => hang.push([su.ngay, su.thu, su.loai, su.ten, su.nhom, su.gio, su.diaDiem, su.chuTri, su.dieuHanh, l.nguoi_tao_ten, m.stt, m.bd, m.kt, m.noiDung, m.nguoi, m.thuoc]));
    });
    taiCSV('kho-lich-sinh-hoat.csv', hang);
  };
  dat(vung,
    thanhNho('Kho lịch', '#lich', 'Lịch', nhaDuocSoan().length ? h('a', { class: 'nut-lui', href: '#lich/soan', style: 'text-decoration:none' }, 'Soạn') : null),
    h('input', { class: 'tim', type: 'search', placeholder: 'Tìm tên chương trình, nội dung, người trình bày…', 'aria-label': 'Tìm trong kho lịch', oninput: (e) => { tim = e.target.value; veDs(); } }),
    h('div', { class: 'chon-ngang' }, [['', 'Tất cả'], ...V.GROUPS.map(x => [x, V.THEMES[x].name])].map(([v, c]) => h('button', { class: 'vien', type: 'button', 'data-v': v, 'aria-pressed': g === v ? 'true' : 'false', onclick: (e) => { g = v; e.currentTarget.parentElement.querySelectorAll('.vien').forEach(n => n.setAttribute('aria-pressed', n.dataset.v === v ? 'true' : 'false')); veDs(); } }, c))),
    vungDs,
    ds.some(l => l.trang_thai === 'da_gui') ? h('button', { class: 'nut phu day', type: 'button', onclick: xuat }, 'Xuất toàn bộ ra CSV') : null);
  veDs();
}
