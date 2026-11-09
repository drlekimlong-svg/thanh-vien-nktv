// Quản lý: thành viên, buổi và điểm danh, đơn xin nghỉ, thông báo, kích hoạt, năng lực, báo cáo. Post-test ở v-qltest.js.
import { S } from './state.js';
import {
  h, dat, dong, nhom, moSheet, thu, toast, bieuTuong, gio, ngay, ngayGio, namHoc, soLieu, rong, dauNgay, oNhap, oChon, oBat, xacNhan,
  DS_NHA, NHA, TT_DIEM_DANH, moTaTV, taiCSV, qrSvg, chuNhatToi, tuNhap, giaTriNgay, giaTriGio
} from './ui.js';
import { soanThongBao, linkThe } from './v-homnay.js';
import { nhanDon } from './v-lich.js';
import { BAC, LOAI_HD, BANG_MINH_HOA } from './v-hoso.js';
import { batMayQuet, docAnh, moAmThanh, kieu, noi, batGiong, datGiong, hangCho } from './quet.js';
import { docMa, conHan } from './ma-dong.js';
import { manDsBai, manSoanBai, manThongKeBai } from './v-qltest.js';

export const thanhNho = (tieu, href = '#quan-ly', nhan = 'Quản lý', phai = null) =>
  h('div', { class: 'thanh-nho' }, h('div', { class: 'khoang' }, h('a', { class: 'nut-lui', href, style: 'text-decoration:none' }, '‹ ' + nhan)), h('h1', null, tieu), h('div', { class: 'khoang phai' }, phai));
const icon = (t) => h('div', { class: 'bieu-tuong' }, bieuTuong(t));

export async function tuyenQuanLy(vung, con) {
  const [a, b, c] = con;
  if (a === 'thanh-vien') return manThanhVien(vung);
  if (a === 'buoi' && b) return manMotBuoi(vung, b);
  if (a === 'buoi') return manDsBuoi(vung);
  if (a === 'don') return manDon(vung);
  if (a === 'thong-bao') return manThongBao(vung);
  if (a === 'kich-hoat') return manKichHoat(vung);
  if (a === 'phan-quyen') return manPhanQuyen(vung);
  if (a === 'phan-cong-lich') return manPhanCongLich(vung);
  if (a === 'danh-muc') return manDanhMuc(vung);
  if (a === 'xac-nhan') return manXacNhan(vung);
  if (a === 'bao-cao') return manBaoCao(vung);
  if (a === 'post-test' && b === 'tk') return manThongKeBai(vung, c);
  if (a === 'post-test' && b) return manSoanBai(vung, b === 'moi' ? null : b);
  if (a === 'post-test') return manDsBai(vung);
  return manQuanLy(vung);
}

export async function manQuanLy(vung) {
  const qt = S.toi.la_quan_tri, pt = S.toi.la_phu_trach, ad = S.toi.la_admin;
  const [don, nl, hd] = await Promise.all([
    pt ? S.db.dsDon('cho').catch(() => []) : [],
    qt ? S.db.nangLucCho().catch(() => []) : [],
    qt ? S.db.hoatDongCho().catch(() => []) : []
  ]);
  const choXn = nl.length + hd.length;
  const so = (n) => n ? h('span', { class: 'the-nhan cho' }, n) : null;
  dat(vung,
    h('h1', { class: 'tieu-de-lon' }, 'Quản lý'),
    nhom('Sinh hoạt',
      dong({ tieu: 'Buổi sinh hoạt và điểm danh', phu: pt ? 'Tạo lịch, quét mã, xem hiện diện' : 'Xem hiện diện từng buổi', truoc: icon('quet'), href: '#quan-ly/buoi' }),
      pt ? dong({ tieu: 'Đơn xin nghỉ', truoc: icon('don'), sau: so(don.length), href: '#quan-ly/don' }) : null,
      dong({ tieu: 'Báo cáo chuyên cần', truoc: icon('bieu_do'), href: '#quan-ly/bao-cao' }),
      dong({ tieu: 'Điểm nhóm', phu: 'Xếp hạng 6 nhà theo chuyên cần và test đầu giờ', truoc: icon('sao'), href: '#lich/diem-nhom' }),
      qt ? dong({ tieu: 'Phân công soạn lịch', phu: 'Thêm người soạn lịch cho từng nhà', truoc: icon('lich'), href: '#quan-ly/phan-cong-lich' }) : null,
      qt ? dong({ tieu: 'Thông báo', truoc: icon('chuong'), href: '#quan-ly/thong-bao' }) : null),
    nhom('Thành viên',
      dong({ tieu: 'Danh sách thành viên', truoc: icon('nguoi'), href: '#quan-ly/thanh-vien' }),
      ad ? dong({ tieu: 'Phân quyền', phu: 'Ban cố vấn, Senior, Junior, nhóm trưởng, nhóm phó', truoc: icon('khoa'), href: '#quan-ly/phan-quyen' }) : null,
      ad ? dong({ tieu: 'Kích hoạt tài khoản', phu: 'Cấp mã lần đầu, cấp lại khi quên mật khẩu', truoc: icon('khoa'), href: '#quan-ly/kich-hoat' }) : null),
    qt ? nhom('Học tập',
      dong({ tieu: 'Post-test và test đầu giờ', phu: 'Tải đề lên, xem điểm', truoc: icon('test'), href: '#quan-ly/post-test' }),
      dong({ tieu: 'Xác nhận năng lực và hoạt động', truoc: icon('sao'), sau: so(choXn), href: '#quan-ly/xac-nhan' }),
      dong({ tieu: 'Danh mục năng lực', truoc: icon('don'), href: '#quan-ly/danh-muc' })) : null);
}

/* ---------- Thành viên ---------- */
const VAI = { thanh_vien: 'Thành viên', diem_danh: 'Phụ trách điểm danh', quan_tri: 'Quản trị' };
const CHUC_VU = { nhom_truong: 'Nhóm trưởng', nhom_pho: 'Nhóm phó' };
const nhanChucVu = (t) => t.chuc_vu ? CHUC_VU[t.chuc_vu] + (t.nha ? ' ' + t.nha : '') : null;

function inMaQR(ds) {
  const the = h('div', { class: 'trang-in' }, h('div', { class: 'in-luoi' }, ds.map(t => h('div', { class: 'in-the' }, qrSvg(linkThe(t.khoa_qr)), h('b', null, t.ho_ten), moTaTV(t)))));
  document.body.append(the);
  window.print();
  setTimeout(() => the.remove(), 500);
}

function suaThanhVien(t, sauKhi) {
  const qt = S.toi.la_admin;
  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const x = f.elements;
      const ten = x.ten.value.trim();
      if (!ten) { toast('Cần có họ và tên.', true); return; }
      const o = {
        ho_ten: ten, gen: x.gen.value === '' ? null : Number(x.gen.value), nha: x.nha.value || null, cap: x.cap.value || null,
        hoat_dong: x.hd.checked, ghi_chu: x.ghi.value.trim() || null, vai_tro: x.vai.value, tham_gia_tu: x.tg.value || null,
        chuc_vu: x.nha.value ? x.cv.value || null : null
      };
      if (t) {
        const ok = await thu(() => S.db.suaThanhVien(t.id, o), 'Đã lưu');
        if (ok) { s.dong(); sauKhi(); }
      } else {
        const ma = await thu(async () => {
          const ds = await S.db.dsThanhVien();
          const lon = ds.reduce((m, y) => Math.max(m, Number((y.ma.match(/\d+$/) || [0])[0])), 0);
          return S.db.themThanhVien(Object.assign(o, { ma: 'NKTV-' + String(lon + 1).padStart(3, '0') }));
        }, 'Đã thêm thành viên');
        if (ma) { s.dong(); sauKhi(); }
      }
    }
  },
    h('div', { class: 'nhom' },
      oNhap('Họ và tên', { name: 'ten', value: t ? t.ho_ten : '', required: true, disabled: !qt }),
      oNhap('Generation', { name: 'gen', type: 'number', min: 0, inputmode: 'numeric', value: t ? t.gen : '', disabled: !qt }),
      oChon('Nhà', [['', 'Chưa có'], ...DS_NHA], t ? t.nha : '', { name: 'nha', disabled: !qt }),
      oChon('Cấp', [['', 'Chưa có'], 'Junior', 'Senior', 'Ban cố vấn'], t ? t.cap : '', { name: 'cap', disabled: !qt }),
      oChon('Chức vụ trong nhà', [['', 'Không'], ...Object.entries(CHUC_VU)], t ? t.chuc_vu || '' : '', { name: 'cv', disabled: !qt }),
      oBat('Còn hoạt động', { name: 'hd', checked: t ? t.hoat_dong : true, disabled: !qt }),
      oNhap('Tính chuyên cần từ ngày', { name: 'tg', type: 'date', value: t ? t.tham_gia_tu : '', disabled: !qt }),
      oNhap('Ghi chú', { name: 'ghi', value: t ? t.ghi_chu : '', disabled: !qt })),
    qt ? [h('div', { class: 'nhom' }, oChon('Vai trò trong app', Object.entries(VAI), t ? t.vai_tro : 'thanh_vien', { name: t && t.id === S.toi.id ? null : 'vai', disabled: t && t.id === S.toi.id })),
      t && t.id === S.toi.id ? h('p', { class: 'chu-nhom' }, 'Không tự đổi vai trò của chính mình, để app luôn còn người quản trị.') : null,
      t && t.id === S.toi.id ? h('input', { type: 'hidden', name: 'vai', value: t.vai_tro }) : null,
      h('button', { class: 'nut day', type: 'submit', style: 'margin-bottom:12px' }, t ? 'Lưu' : 'Thêm thành viên')] : h('input', { type: 'hidden', name: 'vai', value: t ? t.vai_tro : '' }),
    t && qt ? h('div', { class: 'nhom' },
      dong({ tieu: 'Xem hồ sơ năng lực', href: '#ho-so/' + t.id }),
      dong({ tieu: 'In mã QR của người này', onclick: () => inMaQR([t]) }),
      dong({ tieu: 'Cấp mã kích hoạt', phu: 'Dùng khi kích hoạt lần đầu hoặc quên mật khẩu', onclick: async () => { s.dong(); hienMaKichHoat(await S.db.capMaKichHoat([t.id])); } })) : null);
  const s = moSheet({ tieuDe: t ? t.ma : 'Thành viên mới', noiDung: f });
}

async function manThanhVien(vung) {
  const ds = await S.db.dsThanhVien();
  const lai = () => manThanhVien(vung);
  const loc = { tim: '', hd: 'co', nha: '' };
  const chuan = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  const vungDs = h('div');
  const dem = h('span');
  const ve = () => {
    const k = chuan(loc.tim);
    const kq = ds.filter(t => (loc.hd === 'tat' || (loc.hd === 'co') === t.hoat_dong) && (!loc.nha || t.nha === loc.nha) && (!k || chuan(t.ho_ten + ' ' + t.ma + ' gen' + t.gen).includes(k)));
    dem.textContent = kq.length + ' người';
    dat(vungDs, kq.length ? h('div', { class: 'nhom' }, kq.slice(0, 300).map(t => dong({ tieu: t.ho_ten, phu: [t.ma, moTaTV(t), t.chuc_vu ? CHUC_VU[t.chuc_vu] : null, t.ghi_chu].filter(Boolean).join(' · '), onclick: () => suaThanhVien(t, lai) }))) : rong('Không có ai khớp.'));
  };
  const vien = (nhan, duoc, bat) => { const n = h('button', { class: 'vien', type: 'button', 'aria-pressed': duoc() ? 'true' : 'false', onclick: () => { bat(); hang.querySelectorAll('.vien').forEach(v => v.__cn()); ve(); } }, nhan); n.__cn = () => n.setAttribute('aria-pressed', duoc() ? 'true' : 'false'); return n; };
  const hang = h('div', { class: 'chon-ngang' },
    vien('Còn hoạt động', () => loc.hd === 'co', () => { loc.hd = 'co'; }), vien('Đã ngừng', () => loc.hd === 'khong', () => { loc.hd = 'khong'; }), vien('Tất cả', () => loc.hd === 'tat', () => { loc.hd = 'tat'; }),
    DS_NHA.map(n => vien(n, () => loc.nha === n, () => { loc.nha = loc.nha === n ? '' : n; })));
  dat(vung,
    thanhNho('Thành viên', '#quan-ly', 'Quản lý', S.toi.la_admin ? h('button', { class: 'nut-lui', type: 'button', onclick: () => suaThanhVien(null, lai) }, 'Thêm') : null),
    h('input', { class: 'tim', type: 'search', placeholder: 'Tìm tên, mã, gen…', 'aria-label': 'Tìm thành viên', oninput: (e) => { loc.tim = e.target.value; ve(); } }),
    hang,
    h('div', { class: 'nhan-nhom' }, dem, h('span', { style: 'display:flex;gap:6px' },
      S.toi.la_quan_tri ? h('button', { class: 'nut-chu', type: 'button', onclick: () => inMaQR(ds.filter(t => t.hoat_dong)) }, 'In mã QR') : null,
      h('button', { class: 'nut-chu', type: 'button', onclick: () => taiCSV('thanh-vien-nktv.csv', [['Mã thành viên', 'Họ và tên', 'Generation', 'Nhà', 'Cấp', 'Chức vụ', 'Còn hoạt động', 'Ghi chú', 'Vai trò'], ...ds.map(t => [t.ma, t.ho_ten, t.gen, t.nha, t.cap, CHUC_VU[t.chuc_vu] || '', t.hoat_dong ? 'Có' : 'Không', t.ghi_chu, VAI[t.vai_tro]])]) }, 'Xuất CSV'))),
    vungDs);
  ve();
}

/* ---------- Phân quyền (chỉ quản trị, cho tài khoản đã kích hoạt) ---------- */
const QUYEN = [
  ['Quản trị', 'Toàn quyền, kể cả phân quyền, sửa danh sách thành viên và cấp mã kích hoạt.'],
  ['Ban cố vấn', 'Gần đủ quyền quản trị: điểm danh, duyệt đơn, tạo buổi, thông báo, post-test, xác nhận năng lực, soạn lịch cho mọi nhà. Không phân quyền, không sửa danh sách, không cấp mã.'],
  ['Phụ trách điểm danh', 'Điểm danh mọi buổi, duyệt đơn xin nghỉ, tạo buổi, soạn lịch cho mọi nhà.'],
  ['Người được giao điểm danh', 'Quét mã và ghi tay cho đúng buổi được giao, tới khi buổi đóng. Giao ở trang của từng buổi (Quản lý → Buổi sinh hoạt).'],
  ['Nhóm trưởng, nhóm phó', 'Soạn và gửi lịch sinh hoạt cho nhà mình.'],
  ['Người được phân công soạn lịch', 'Soạn và gửi lịch cho nhà được phân công, tới ngày hết hạn nếu có. Phân công ở Quản lý → Phân công soạn lịch.'],
  ['Senior, Junior', 'Chưa có quyền riêng: xem lịch, xin nghỉ, làm bài, cập nhật hồ sơ của mình.']
];

function suaQuyen(t, sauKhi) {
  const ban = t.id === S.toi.id;
  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const x = f.elements;
      const o = { cap: x.cap.value || null, chuc_vu: t.nha ? x.cv.value || null : null };
      if (!ban) o.vai_tro = x.vai.value;
      const ok = await thu(() => S.db.suaThanhVien(t.id, o), 'Đã lưu quyền');
      if (ok) { s.dong(); sauKhi(); }
    }
  },
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:14px' }, [t.ma, moTaTV(t)].filter(Boolean).join(' · ')),
    h('div', { class: 'nhom' },
      oChon('Cấp', [['', 'Chưa ghi'], 'Junior', 'Senior', 'Ban cố vấn'], t.cap || '', { name: 'cap' }),
      oChon('Chức vụ trong nhà' + (t.nha ? ' ' + t.nha : ''), [['', 'Không'], ...Object.entries(CHUC_VU)], t.chuc_vu || '', { name: 'cv', disabled: !t.nha }),
      oChon('Quyền trong app', Object.entries(VAI), t.vai_tro, { name: ban ? null : 'vai', disabled: ban })),
    !t.nha ? h('p', { class: 'chu-nhom' }, 'Người này chưa thuộc nhà nào nên chưa đặt được nhóm trưởng, nhóm phó. Ghi nhà ở Danh sách thành viên trước.') : null,
    ban ? h('p', { class: 'chu-nhom' }, 'Không tự đổi quyền trong app của chính mình, để app luôn còn người quản trị.') : null,
    h('button', { class: 'nut day', type: 'submit' }, 'Lưu'));
  const s = moSheet({ tieuDe: t.ho_ten, noiDung: f });
}

async function manPhanQuyen(vung) {
  const [ds, tt, pc] = await Promise.all([S.db.dsThanhVien(), S.db.tinhTrangKichHoat(), S.db.dsPhanCongLich().catch(() => [])]);
  const daKH = new Set(tt.filter(x => x.da_kich_hoat).map(x => x.thanh_vien_id));
  const kh = ds.filter(t => daKH.has(t.id));
  const lai = () => manPhanQuyen(vung);
  const soanLich = (t) => { const x = pc.filter(p => p.thanh_vien_id === t.id && conPhanCong(p)).map(p => p.nha); return x.length ? 'Soạn lịch ' + x.join(', ') : null; };
  const hang = (t) => dong({ tieu: t.ho_ten, phu: [t.ma, t.vai_tro !== 'thanh_vien' ? VAI[t.vai_tro] : null, t.cap || 'Chưa ghi cấp', nhanChucVu(t), soanLich(t)].filter(Boolean).join(' · '), onclick: () => suaQuyen(t, lai) });
  const nhomQ = (nhan, loc) => { const x = kh.filter(loc); return x.length ? nhom(`${nhan} · ${x.length}`, x.map(hang)) : null; };
  dat(vung, thanhNho('Phân quyền'),
    h('p', { class: 'tieu-de-phu', style: 'margin-top:4px;text-align:center' }, `${kh.length} tài khoản đã kích hoạt · chạm vào tên để đổi`),
    nhomQ('Quản trị và phụ trách điểm danh', t => t.vai_tro !== 'thanh_vien'),
    nhomQ('Ban cố vấn', t => t.vai_tro === 'thanh_vien' && t.cap === 'Ban cố vấn'),
    nhomQ('Nhóm trưởng, nhóm phó', t => t.vai_tro === 'thanh_vien' && t.cap !== 'Ban cố vấn' && t.chuc_vu),
    nhomQ('Senior, Junior và chưa ghi cấp', t => t.vai_tro === 'thanh_vien' && t.cap !== 'Ban cố vấn' && !t.chuc_vu),
    !kh.length ? rong('Chưa có tài khoản nào được kích hoạt.') : null,
    nhom('Mỗi vai trò làm được gì', QUYEN.map(([tieu, phu]) => dong({ tieu, phu }))),
    h('p', { class: 'chu-nhom' }, 'Một người có thể vừa là Senior vừa là nhóm trưởng. Người chưa kích hoạt thì đổi ở Danh sách thành viên.'));
}

/* ---------- Phân công soạn lịch (quản trị, Ban cố vấn) ---------- */
// Thêm người soạn lịch cho từng nhà, ngoài nhóm trưởng, nhóm phó. Hết ngày hạn thì quyền tự gỡ.
const conPhanCong = (p) => !p.den_ngay || p.den_ngay >= giaTriNgay(Date.now());

async function manPhanCongLich(vung) {
  const [ds, tt, pc] = await Promise.all([S.db.dsThanhVien(), S.db.tinhTrangKichHoat(), S.db.dsPhanCongLich()]);
  const lai = () => manPhanCongLich(vung);
  const daKH = new Set(tt.filter(x => x.da_kich_hoat).map(x => x.thanh_vien_id));
  const theoId = new Map(ds.map(t => [t.id, t]));
  const chuan = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  // Ai đã soạn được lịch cho mọi nhà thì không cần phân công.
  const moiNha = (t) => t.vai_tro !== 'thanh_vien' || t.cap === 'Ban cố vấn';
  const quanLyNha = (nha) => ds.filter(t => t.nha === nha && t.chuc_vu && !moiNha(t)).map(t => `${t.ho_ten} (${CHUC_VU[t.chuc_vu].toLowerCase()})`);
  const dangGiao = (nha) => pc.filter(p => p.nha === nha && conPhanCong(p) && theoId.has(p.thanh_vien_id));
  const nhanGiao = (p) => theoId.get(p.thanh_vien_id).ho_ten + (p.den_ngay ? ` (đến hết ${ngay(p.den_ngay)})` : '');

  const sua = (nha) => {
    const cu = dangGiao(nha);
    const chon = new Set(cu.map(p => p.thanh_vien_id));
    const ngayCu = [...new Set(cu.map(p => p.den_ngay || ''))];
    const ung = ds.filter(t => daKH.has(t.id) && t.hoat_dong && !moiNha(t) && !(t.chuc_vu && t.nha === nha))
      .sort((x, y) => (chon.has(y.id) - chon.has(x.id)) || ((y.nha === nha) - (x.nha === nha)) || x.ho_ten.localeCompare(y.ho_ten, 'vi'));
    const hang = ung.map(t => {
      const o = oBat(t.ho_ten, { checked: chon.has(t.id), onchange: (e) => { if (e.target.checked) chon.add(t.id); else chon.delete(t.id); } });
      o.dataset.tim = chuan(t.ho_ten + ' ' + t.ma + ' ' + (t.nha || ''));
      o.querySelector('span').append(h('small', { style: 'display:block;color:var(--chu-2);font-size:.8125rem' }, [t.ma, moTaTV(t)].join(' · ')));
      return o;
    });
    const ql = quanLyNha(nha);
    const oNgay = oNhap('Đến hết ngày (để trống nếu chưa định ngày gỡ)', { type: 'date', min: giaTriNgay(Date.now()), value: ngayCu.length === 1 ? ngayCu[0] : '' });
    const s = moSheet({
      tieuDe: 'Soạn lịch nhà ' + nha,
      noiDung: h('div', null,
        h('p', { class: 'chu-nho', style: 'margin-bottom:12px' },
          `Người được chọn soạn và gửi được lịch cho nhà ${nha}, như nhóm trưởng và nhóm phó. `,
          ql.length ? `Nhóm trưởng, nhóm phó hiện có: ${ql.join(', ')}.` : 'Nhà này chưa ghi nhóm trưởng, nhóm phó.',
          ' Ban cố vấn và người phụ trách luôn soạn được nên không có trong danh sách.'),
        h('div', { class: 'nhom' }, oNgay),
        h('input', { class: 'tim', type: 'search', placeholder: 'Tìm tên, mã, nhà…', 'aria-label': 'Tìm người', oninput: (e) => { const k = chuan(e.target.value); hang.forEach(o => { o.hidden = !!k && !o.dataset.tim.includes(k); }); } }),
        h('div', { class: 'nhom' }, hang.length ? hang : rong('Chưa có tài khoản nào để chọn.')),
        h('button', { class: 'nut day', type: 'button', onclick: async () => {
          const den = oNgay.querySelector('input').value || null;
          const ok = await thu(() => S.db.datPhanCongLich(nha, [...chon], den), chon.size ? 'Đã lưu phân công' : 'Đã gỡ phân công');
          if (ok) { s.dong(); lai(); }
        } }, 'Lưu'))
    });
  };

  dat(vung, thanhNho('Phân công soạn lịch'),
    h('p', { class: 'tieu-de-phu', style: 'margin-top:4px;text-align:center' }, 'Chạm vào nhà để chọn người'),
    nhom(null, DS_NHA.map(nha => {
      const g = dangGiao(nha);
      return dong({
        tieu: nha, phu: g.length ? 'Được phân công: ' + g.map(nhanGiao).join(', ') : 'Chưa phân công thêm ai',
        truoc: h('img', { class: 'anh-nha-nho', src: `img/${NHA[nha].anh}.webp`, alt: '' }), onclick: () => sua(nha)
      });
    })),
    h('p', { class: 'chu-nhom' }, 'Nhóm trưởng, nhóm phó soạn được lịch cho nhà mình; Ban cố vấn và người phụ trách soạn được cho mọi nhà. Phân công ở đây thêm người ngoài các vai trò đó. Hết ngày hạn, quyền tự gỡ.'));
}

/* ---------- Buổi sinh hoạt ---------- */
function suaBuoi(b, sauKhi) {
  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const x = f.elements;
      if (!x.ten.value.trim() || !x.ngay.value || !x.gio.value) { toast('Cần có tên, ngày và giờ bắt đầu.', true); return; }
      const o = {
        ten: x.ten.value.trim(), bat_dau: tuNhap(x.ngay.value, x.gio.value), ket_thuc: x.ket.value ? tuNhap(x.ngay.value, x.ket.value) : null,
        dia_diem: x.dd.value.trim() || null, nhom_truc: x.truc.value || null, chu_tri: x.ct.value.trim() || null, noi_dung: x.nd.value.trim() || null,
        tre_sau_phut: Number(x.tre.value) || 0, tinh_chuyen_can: x.cc.checked
      };
      const ok = await thu(async () => {
        if (b) await S.db.suaBuoi(b.id, o);
        else await S.db.themBuoi(Object.assign(o, { tao_boi: S.toi.id }));
        if (!b && x.dang && x.dang.checked) {
          await S.db.themThongBao({ tieu_de: `Lịch: ${o.ten}`, noi_dung: [ngayGio(o.bat_dau), o.dia_diem && 'Địa điểm: ' + o.dia_diem, o.nhom_truc && 'Nhóm trực: ' + o.nhom_truc, o.noi_dung].filter(Boolean).join('\n'), tac_gia: S.toi.id });
        }
      }, b ? 'Đã lưu' : 'Đã tạo buổi');
      if (ok) { s.dong(); sauKhi(); }
    }
  },
    h('div', { class: 'nhom' },
      oNhap('Tên buổi', { name: 'ten', value: b ? b.ten : 'Sinh hoạt hằng tuần', required: true }),
      oNhap('Ngày', { name: 'ngay', type: 'date', value: b ? giaTriNgay(b.bat_dau) : chuNhatToi(), required: true }),
      oNhap('Giờ bắt đầu', { name: 'gio', type: 'time', value: b ? giaTriGio(b.bat_dau) : '14:00', required: true }),
      oNhap('Giờ kết thúc (nếu có)', { name: 'ket', type: 'time', value: b && b.ket_thuc ? giaTriGio(b.ket_thuc) : '' }),
      oNhap('Tính trễ sau bao nhiêu phút', { name: 'tre', type: 'number', min: 0, inputmode: 'numeric', value: b ? b.tre_sau_phut : 10 })),
    h('div', { class: 'nhom' },
      oNhap('Địa điểm', { name: 'dd', value: b ? b.dia_diem : '' }),
      oChon('Nhóm trực', [['', 'Chưa có'], ...DS_NHA], b ? b.nhom_truc : '', { name: 'truc' }),
      oNhap('Chủ trì', { name: 'ct', value: b ? b.chu_tri : '' }),
      oNhap('Nội dung', { the: 'textarea', name: 'nd', value: b ? b.noi_dung : '', rows: 4 })),
    h('div', { class: 'nhom' },
      oBat('Tính vào chuyên cần', { name: 'cc', checked: b ? b.tinh_chuyen_can : true }),
      !b && S.toi.la_quan_tri ? oBat('Đăng thông báo cho mọi người', { name: 'dang', checked: true }) : null),
    h('button', { class: 'nut day', type: 'submit' }, b ? 'Lưu' : 'Tạo buổi'),
    b && S.toi.la_quan_tri ? h('button', {
      class: 'nut nguy day', type: 'button', style: 'margin-top:10px',
      onclick: async () => {
        if (!await xacNhan({ tieuDe: 'Xóa buổi này?', chu: 'Toàn bộ điểm danh và đơn xin nghỉ của buổi sẽ mất, không khôi phục được.', nut: 'Xóa buổi', nguy: true })) return;
        const ok = await thu(() => S.db.xoaBuoi(b.id), 'Đã xóa buổi');
        if (ok) { s.dong(); location.hash = 'quan-ly/buoi'; }
      }
    }, 'Xóa buổi') : null);
  const s = moSheet({ tieuDe: b ? 'Sửa buổi' : 'Buổi mới', noiDung: f });
}

async function manDsBuoi(vung) {
  const nam = namHoc();
  const ds = await S.db.dsBuoi(nam.tu, nam.den);
  const nay = Date.now();
  const lai = () => manDsBuoi(vung);
  const hang = (b) => dong({ truoc: dauNgay(b.bat_dau), tieu: b.ten, phu: gio(b.bat_dau) + (b.nhom_truc ? ' · Trực: ' + b.nhom_truc : '') + (b.dong ? ' · Đã đóng' : ''), href: '#quan-ly/buoi/' + b.id });
  const sap = ds.filter(b => new Date(b.bat_dau).getTime() >= nay - 12 * 3600e3), qua = ds.filter(b => new Date(b.bat_dau).getTime() < nay - 12 * 3600e3).reverse();
  dat(vung,
    thanhNho('Buổi sinh hoạt', '#quan-ly', 'Quản lý', S.toi.la_phu_trach ? h('button', { class: 'nut-lui', type: 'button', onclick: () => suaBuoi(null, lai) }, 'Thêm') : null),
    sap.length ? nhom('Sắp tới', sap.map(hang)) : rong('Chưa có buổi nào sắp tới.'),
    qua.length ? nhom('Đã qua', qua.map(hang)) : null,
    S.toi.la_quan_tri ? [h('div', { class: 'nhom' }, oBat('Chỉ nhận mã đang chạy trên app', { checked: S.caiDat.chi_nhan_ma_dong === true, onchange: async (e) => {
      const v = e.target.checked;
      const ok = await thu(() => S.db.datCaiDat('chi_nhan_ma_dong', v), v ? 'Đã bật: chỉ nhận mã trên app' : 'Đã tắt: nhận cả mã trên thẻ in');
      if (ok) S.caiDat.chi_nhan_ma_dong = v; else e.target.checked = !v;
    } })),
    h('p', { class: 'chu-nhom' }, 'Mã trên app đổi sau mỗi 20 giây nên ảnh chụp gửi cho bạn không dùng được. Khi bật, mã trên thẻ in và ảnh chụp mã không quét được; ai quên điện thoại thì người quét nhìn mặt rồi ghi tay.')] : null);
}

async function manMotBuoi(vung, id) {
  const ds = await S.db.dsBuoi();
  let b = ds.find(x => x.id === id);
  if (!b) throw new Error('Không tìm thấy buổi này.');
  let bang = await S.db.bangDiemDanh(id);
  const pt = S.toi.la_phu_trach;
  // Người được giao điểm danh buổi này quét và ghi tay được tới khi buổi đóng.
  const duocGiao = (S.toi.buoi_diem_danh || []).includes(id);
  const coThe = (pt || duocGiao) && (!b.dong || S.toi.la_quan_tri);
  const tv = pt ? await S.db.dsThanhVien() : [];
  const theoKhoa = new Map(tv.map(t => [t.khoa_qr, t]));
  const giao = S.toi.la_quan_tri ? await S.db.nguoiDiemDanh(id).catch(() => []) : [];
  let loc = 'tat', timChu = '';
  const lai = () => manMotBuoi(vung, id);

  const chuan = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  const nhanTT = (r) => r.trang_thai === 'vang' && !b.dong ? 'chua' : r.trang_thai;
  const dem = () => { const o = { dung: 0, tre: 0, phep: 0, vang: 0 }; bang.forEach(r => { o[r.trang_thai]++; }); return o; };
  const vungSo = h('div'), vungDs = h('div');
  const veSo = () => { const o = dem(); demMat.textContent = `Có mặt ${o.dung + o.tre}/${bang.length}`; dat(vungSo, soLieu([{ so: o.dung + o.tre, ten: `Có mặt / ${bang.length}`, lop: 'dung' }, { so: o.tre, ten: 'Trễ', lop: 'tre' }, { so: o.phep, ten: 'Có phép', lop: 'phep' }, { so: o.vang, ten: b.dong ? 'Vắng' : 'Chưa điểm danh', lop: 'vang' }])); };
  const veDs = () => {
    const k = chuan(timChu);
    const kq = bang.filter(r => (loc === 'tat' || (loc === 'mat' ? (r.trang_thai === 'dung' || r.trang_thai === 'tre') : r.trang_thai === loc)) && (!k || chuan(r.ho_ten + ' ' + r.ma).includes(k)));
    dat(vungDs, kq.length ? h('div', { class: 'nhom' }, kq.slice(0, 300).map(r => dong({
      tieu: r.ho_ten, phu: moTaTV(r) + (r.luc && r.cach !== 'bo_sung' ? ' · ' + gio(r.luc) : '') + (r.cach === 'bo_sung' ? ' · Ghi bổ sung sau buổi' : '') + (r.ly_do && r.trang_thai === 'phep' ? ' · ' + r.ly_do : ''),
      sau: h('span', { class: 'the-nhan ' + nhanTT(r) }, TT_DIEM_DANH[nhanTT(r)] + (r.tre_phut ? ` ${r.tre_phut}′` : '')),
      onclick: coThe ? () => suaLuot(r) : null, muiTen: false
    }))) : rong('Không có ai khớp.'));
  };
  const capNhat = () => { veSo(); veDs(); };
  const taiLai = async () => { bang = await S.db.bangDiemDanh(id); capNhat(); };

  /* Ghi tay, xóa lượt, ghi vắng có phép */
  const suaLuot = (r) => {
    const coMat = r.trang_thai === 'dung' || r.trang_thai === 'tre';
    const s = moSheet({
      tieuDe: r.ho_ten,
      noiDung: h('div', null,
        h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:14px' }, moTaTV(r), ' · ', TT_DIEM_DANH[nhanTT(r)]),
        h('div', { class: 'hang-nut', style: 'flex-direction:column' },
          !coMat ? h('button', { class: 'nut', type: 'button', onclick: async () => { const ok = await thu(() => S.db.ghiDiemDanh({ buoi: id, tv: r.thanh_vien_id, luc: new Date(Date.now() + (S.lech || 0)).toISOString(), cach: 'tay' }), 'Đã ghi có mặt'); if (ok) { s.dong(); taiLai(); } } }, 'Ghi có mặt') : null,
          r.trang_thai !== 'phep' && !coMat ? h('button', { class: 'nut phu', type: 'button', onclick: () => { s.dong(); ghiPhep(r); } }, 'Ghi vắng có phép') : null,
          coMat ? h('button', { class: 'nut nguy', type: 'button', onclick: async () => { const ok = await thu(() => S.db.xoaDiemDanh(id, r.thanh_vien_id), 'Đã xóa lượt điểm danh'); if (ok) { s.dong(); taiLai(); } } }, 'Xóa lượt điểm danh') : null))
    });
  };
  const ghiPhep = (r) => {
    const f = h('form', { onsubmit: async (e) => { e.preventDefault(); const ok = await thu(() => S.db.ghiVangPhep(id, r.thanh_vien_id, f.elements.ly.value), 'Đã ghi vắng có phép'); if (ok) { s.dong(); taiLai(); } } },
      h('div', { class: 'nhom' }, oNhap('Lý do', { the: 'textarea', name: 'ly', rows: 3 })), h('button', { class: 'nut day', type: 'submit' }, 'Ghi vắng có phép'));
    const s = moSheet({ tieuDe: r.ho_ten, noiDung: f });
  };

  /* Máy quét: kết quả phủ lên khung camera, kèm tiếng và giọng nói, để người quét không phải nhìn xuống dưới */
  const video = h('video', { playsinline: true, muted: true });
  const baoCam = h('div', { class: 'bao' }, 'Bấm “Bật máy quét”, rồi đưa mã điểm danh trên app vào khung.');
  const lop = h('div', { class: 'phu-quet', hidden: true, 'aria-hidden': 'true' });
  const demMat = h('div', { class: 'dem-quet' });
  const ketQua = h('div', { 'aria-live': 'polite' });
  const baoCho = h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:12px' });
  let tatMay = null, cuoi = { k: '', t: 0 }, henAn = 0, nghiDen = 0;
  const nutCam = h('button', { class: 'nut', type: 'button', onclick: async () => {
    if (tatMay) { tatMay(); tatMay = null; nutCam.textContent = 'Bật máy quét'; baoCam.hidden = false; return; }
    moAmThanh(); baoCam.textContent = 'Đang mở camera…'; baoCam.hidden = false;
    try { tatMay = await batMayQuet(video, nhanMa); baoCam.hidden = true; nutCam.textContent = 'Tắt máy quét'; }
    catch (e) { baoCam.textContent = e.message; }
  } }, 'Bật máy quét');
  const nutGiong = h('button', { class: 'nut-chu', type: 'button', onclick: () => {
    datGiong(!batGiong()); veGiong();
    if (batGiong()) { moAmThanh(); noi('Đã điểm danh'); }
  } });
  const veGiong = () => { nutGiong.textContent = batGiong() ? 'Giọng nói: bật' : 'Giọng nói: tắt'; };
  veGiong();
  const nhapAnh = h('input', { type: 'file', accept: 'image/*', capture: 'environment', hidden: true, onchange: async (e) => {
    const t = e.target.files[0]; e.target.value = ''; if (!t) return;
    moAmThanh();
    const chu = await docAnh(t);
    if (chu) nhanMa(chu, 'anh'); else hienKQ('loi', 'Không đọc được mã trong ảnh', 'Chụp gần hơn, đủ sáng, để mã nằm trọn trong ảnh.', 'Không đọc được');
  } });
  const DAU = { ok: '✓', tre: '✓', roi: '✓', loi: '✕', cho: '…' };
  // loai: ok (đúng giờ, xanh), tre (trễ hoặc cần chú ý, vàng), roi (đã điểm danh trước đó), loi (đỏ), cho (đang kiểm tra)
  const hienKQ = (loai, tieu, phu, cauNoi) => {
    kieu(loai); noi(cauNoi);
    dat(lop, h('div', { class: 'dau' }, DAU[loai]), h('div', { class: 'tieu' }, tieu), phu ? h('div', { class: 'phu' }, phu) : null);
    lop.className = 'phu-quet ' + loai; lop.hidden = false;
    clearTimeout(henAn); henAn = setTimeout(() => { lop.hidden = true; }, loai === 'cho' ? 8000 : loai === 'ok' || loai === 'roi' ? 1600 : 2800);
    if (loai !== 'cho') nghiDen = Date.now() + 900;
    dat(ketQua, h('div', { class: 'ket-qua-quet ' + (loai === 'ok' || loai === 'roi' ? 'ok' : loai === 'loi' ? 'loi' : 'canh') }, h('div', { class: 'tieu' }, tieu), phu ? h('div', { class: 'phu' }, phu) : null));
  };
  const capNhatCho = () => { const n = hangCho.doc().length; baoCho.textContent = n ? `${n} lượt đang chờ mạng để gửi lên.` : ''; baoCho.hidden = !n; };
  const ghiVaoBang = (t, laTre, tre, luc, cach) => {
    const moi = { thanh_vien_id: t.thanh_vien_id || t.id, ma: t.ma, ho_ten: t.ho_ten, gen: t.gen, nha: t.nha, cap: t.cap, trang_thai: laTre ? 'tre' : 'dung', luc, tre_phut: laTre ? tre : null, cach, ly_do: null };
    const r = bang.find(x => x.thanh_vien_id === moi.thanh_vien_id);
    const cu = r ? Object.assign({}, r) : null;
    if (r) Object.assign(r, moi); else bang.push(moi);
    capNhat();
    return () => { const x = bang.findIndex(y => y.thanh_vien_id === moi.thanh_vien_id); if (cu) Object.assign(bang[x], cu); else bang.splice(x, 1); capNhat(); };
  };
  async function nhanMa(chu, cach = 'qr') {
    if (Date.now() < nghiDen) return;
    const m = docMa(chu);
    if (!m) return hienKQ('loi', 'Không phải mã của CLB', 'Đưa mã điểm danh trên app vào khung.', 'Không hợp lệ');
    const nay = Date.now(), gioChuan = nay + (S.lech || 0);
    const khoaLap = m.loai === 'dong' ? m.ma : m.khoa;
    if (khoaLap === cuoi.k && nay - cuoi.t < 8000) return; // vẫn đang đưa cùng một mã: im lặng
    cuoi = { k: khoaLap, t: nay };
    let t = null;
    if (m.loai === 'dong') {
      t = bang.find(r => r.ma === m.ma) || null;
      if (!conHan(m.w, gioChuan)) return hienKQ('loi', t ? t.ho_ten : 'Mã đã hết hạn', 'Mã đã hết hạn, có thể là ảnh chụp. Nhờ bạn mở lại mã trên app.', 'Mã hết hạn');
    } else {
      const x = theoKhoa.get(m.khoa);
      t = x ? Object.assign({ thanh_vien_id: x.id }, x) : null;
      if (S.caiDat.chi_nhan_ma_dong === true) return hienKQ('loi', t ? t.ho_ten : 'Mã cố định', 'Mã trên thẻ in hoặc ảnh chụp không dùng để điểm danh. Nhờ bạn mở app → Mã điểm danh của tôi.', 'Mã cũ');
    }
    const khoa = m.loai === 'dong' ? m.chu : m.khoa;
    const luc = new Date(gioChuan).toISOString();
    const tre = Math.ceil((gioChuan - new Date(b.bat_dau).getTime()) / 60000), laTre = tre > b.tre_sau_phut;
    const baoXong = (x, tre_) => x.hoat_dong === false
      ? hienKQ('tre', x.ho_ten, 'Đã ngừng hoạt động. Lượt này vẫn được ghi.', 'Đã điểm danh')
      : hienKQ(tre_ ? 'tre' : 'ok', x.ho_ten, [moTaTV(x), tre_ ? `Trễ ${tre_} phút` : 'Đúng giờ'].filter(Boolean).join(' · '), tre_ ? 'Đã điểm danh, trễ' : 'Đã điểm danh');
    let hoanTac = null;
    if (t) {
      const r = bang.find(x => x.thanh_vien_id === t.thanh_vien_id);
      if (r && (r.trang_thai === 'dung' || r.trang_thai === 'tre')) return hienKQ('roi', r.ho_ten, `Đã điểm danh lúc ${gio(r.luc)}.`, 'Đã điểm danh rồi');
      // Biết người này: báo ngay, gửi lên máy chủ phía sau; mất mạng thì lượt nằm trong hàng chờ.
      baoXong(t, laTre ? tre : null);
      hoanTac = ghiVaoBang(t, laTre, tre, luc, cach);
    } else hienKQ('cho', 'Đang kiểm tra…', null, null);
    try {
      const kq = await S.db.ghiDiemDanh({ buoi: id, khoa, luc, cach });
      if (kq && kq.ok === false) {
        if (hoanTac) hoanTac();
        return hienKQ('loi', kq.ho_ten || (t && t.ho_ten) || 'Không ghi được', kq.loi, kq.het_han ? 'Mã hết hạn' : kq.ma_cu ? 'Mã cũ' : 'Không hợp lệ');
      }
      if (!t && kq) {
        const r = bang.find(x => x.thanh_vien_id === kq.id);
        if (r && !kq.moi) return hienKQ('roi', kq.ho_ten, `Đã điểm danh lúc ${gio(kq.luc)}.`, 'Đã điểm danh rồi');
        ghiVaoBang(kq, !!kq.tre_phut, kq.tre_phut, kq.luc, kq.cach);
        baoXong(kq, kq.tre_phut);
      }
    } catch (e) {
      if (/mạng|máy chủ đang/i.test(e.message) && t) { hangCho.them({ buoi: id, khoa, luc, cach }); capNhatCho(); }
      else { if (hoanTac) hoanTac(); hienKQ('loi', t ? t.ho_ten : 'Không ghi được', e.message, 'Không ghi được'); }
    }
  }
  const dayHang = async () => { if (await hangCho.day(S.db)) { capNhatCho(); taiLai(); } };
  window.addEventListener('online', dayHang);
  S.huy.push(() => window.removeEventListener('online', dayHang));
  dayHang();

  const vien = (nhan, ma) => h('button', { class: 'vien', type: 'button', 'data-ma': ma, 'aria-pressed': loc === ma ? 'true' : 'false', onclick: (e) => { loc = ma; e.currentTarget.parentElement.querySelectorAll('.vien').forEach(v => v.setAttribute('aria-pressed', v.dataset.ma === ma ? 'true' : 'false')); veDs(); } }, nhan);

  /* Giao quyền điểm danh buổi này (quản trị, Ban cố vấn) */
  const giaoQuyen = async () => {
    const [ds, tt] = await Promise.all([tv.length ? tv : S.db.dsThanhVien(), S.db.tinhTrangKichHoat()]);
    const daKH = new Set(tt.filter(x => x.da_kich_hoat).map(x => x.thanh_vien_id));
    const chon = new Set(giao.map(g => g.thanh_vien_id));
    const ung = ds.filter(t => daKH.has(t.id) && t.hoat_dong).sort((x, y) => (chon.has(y.id) - chon.has(x.id)) || x.ho_ten.localeCompare(y.ho_ten, 'vi'));
    const hang = ung.map(t => { const o = oBat(t.ho_ten, { checked: chon.has(t.id), onchange: (e) => { if (e.target.checked) chon.add(t.id); else chon.delete(t.id); } }); o.dataset.tim = chuan(t.ho_ten + ' ' + t.ma + ' ' + (t.nha || '')); o.querySelector('span').append(h('small', { style: 'display:block;color:var(--chu-2);font-size:.8125rem' }, [t.ma, moTaTV(t)].join(' · '))); return o; });
    const s = moSheet({
      tieuDe: 'Người điểm danh',
      noiDung: h('div', null,
        h('p', { class: 'chu-nho', style: 'margin-bottom:12px' }, `${ngayGio(b.bat_dau)}. Người được chọn quét mã và ghi tay được buổi này tới khi buổi đóng. Ban cố vấn và người phụ trách luôn điểm danh được.`),
        h('input', { class: 'tim', type: 'search', placeholder: 'Tìm tên, mã, nhà…', 'aria-label': 'Tìm người', oninput: (e) => { const k = chuan(e.target.value); hang.forEach(o => { o.hidden = !!k && !o.dataset.tim.includes(k); }); } }),
        h('div', { class: 'nhom' }, hang.length ? hang : rong('Chưa có tài khoản nào được kích hoạt.')),
        h('button', { class: 'nut day', type: 'button', onclick: async () => { const ok = await thu(() => S.db.datNguoiDiemDanh(id, [...chon]), 'Đã lưu người điểm danh'); if (ok) { s.dong(); lai(); } } }, 'Lưu'))
    });
  };
  const tenGiao = giao.map(g => (tv.find(t => t.id === g.thanh_vien_id) || {}).ho_ten).filter(Boolean);

  dat(vung,
    thanhNho(b.ten, S.toi.xem_duoc_ten ? '#quan-ly/buoi' : '#hom-nay', S.toi.xem_duoc_ten ? 'Buổi' : 'Hôm nay', pt ? h('button', { class: 'nut-lui', type: 'button', onclick: () => suaBuoi(b, lai) }, 'Sửa') : null),
    h('p', { class: 'tieu-de-phu', style: 'margin-top:4px;text-align:center' }, ngayGio(b.bat_dau), ` · Trễ sau ${b.tre_sau_phut} phút`, b.dong ? ' · Đã đóng' : ''),
    vungSo,
    S.toi.la_quan_tri ? nhom(null, dong({ tieu: 'Người điểm danh buổi này', phu: tenGiao.length ? tenGiao.join(', ') : 'Chưa giao ai. Ban cố vấn và người phụ trách luôn điểm danh được.', onclick: giaoQuyen })) : null,
    coThe ? h('div', null,
      h('div', { class: 'khung-quet' }, video, h('div', { class: 'ngam' }), baoCam, demMat, lop),
      ketQua, baoCho, nhapAnh,
      h('div', { class: 'hang-nut', style: 'margin-bottom:8px' }, nutCam, h('button', { class: 'nut phu', type: 'button', onclick: () => nhapAnh.click() }, 'Chụp ảnh mã')),
      h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:20px' }, nutGiong, ' · Nhìn mặt người đưa mã trước khi cho qua.')) : null,
    h('input', { class: 'tim', type: 'search', placeholder: 'Tìm tên để xem hoặc ghi tay…', 'aria-label': 'Tìm trong danh sách', oninput: (e) => { timChu = e.target.value; veDs(); } }),
    h('div', { class: 'chon-ngang' }, vien('Tất cả', 'tat'), vien('Có mặt', 'mat'), vien('Trễ', 'tre'), vien('Có phép', 'phep'), vien(b.dong ? 'Vắng' : 'Chưa điểm danh', 'vang')),
    vungDs,
    h('div', { class: 'hang-nut', style: 'margin-top:4px' },
      h('button', { class: 'nut phu', type: 'button', onclick: () => taiCSV(`diem-danh-${giaTriNgay(b.bat_dau)}.csv`, [['Mã', 'Họ và tên', 'Generation', 'Nhà', 'Cấp', 'Trạng thái', 'Giờ', 'Trễ (phút)', 'Lý do'], ...bang.map(r => [r.ma, r.ho_ten, r.gen, r.nha, r.cap, TT_DIEM_DANH[nhanTT(r)], r.luc ? gio(r.luc) : '', r.tre_phut, r.ly_do])]) }, 'Xuất CSV'),
      pt ? h('button', { class: 'nut ' + (b.dong ? 'phu' : ''), type: 'button', disabled: b.dong && !S.toi.la_quan_tri, onclick: async () => {
        if (!b.dong && !await xacNhan({ tieuDe: 'Đóng buổi?', chu: 'Người chưa điểm danh sẽ tính là vắng và buổi được tính vào chuyên cần.', nut: 'Đóng buổi' })) return;
        const ok = await thu(() => S.db.suaBuoi(id, { dong: !b.dong }), b.dong ? 'Đã mở lại buổi' : 'Đã đóng buổi');
        if (ok) lai();
      } }, b.dong ? 'Mở lại buổi' : 'Đóng buổi') : null));
  capNhat(); capNhatCho();
}

/* ---------- Đơn xin nghỉ ---------- */
async function manDon(vung) {
  const lai = () => manDon(vung);
  const ds = await S.db.dsDon();
  const cho = ds.filter(d => d.trang_thai === 'cho'), xong = ds.filter(d => d.trang_thai !== 'cho');
  const xuLy = (d) => {
    const f = h('form', { onsubmit: (e) => e.preventDefault() },
      h('div', { class: 'nhom' },
        dong({ tieu: d.buoi.ten, phu: ngayGio(d.buoi.bat_dau) }),
        dong({ tieu: d.ly_do, phu: 'Gửi ' + ngayGio(d.gui_luc) + (new Date(d.gui_luc) > new Date(d.buoi.bat_dau) ? ' · Sau giờ bắt đầu' : '') })),
      h('div', { class: 'nhom' }, oNhap('Phản hồi (nếu có)', { name: 'ph', value: d.phan_hoi })),
      h('div', { class: 'hang-nut' },
        h('button', { class: 'nut nguy', type: 'button', onclick: async () => { const ok = await thu(() => S.db.xuLyDon(d.id, false, f.elements.ph.value), 'Đã ghi không duyệt'); if (ok) { s.dong(); lai(); } } }, 'Không duyệt'),
        h('button', { class: 'nut', type: 'button', onclick: async () => { const ok = await thu(() => S.db.xuLyDon(d.id, true, f.elements.ph.value), 'Đã duyệt'); if (ok) { s.dong(); lai(); } } }, 'Duyệt')));
    const s = moSheet({ tieuDe: d.thanh_vien.ho_ten, noiDung: f });
  };
  const hang = (d) => dong({ tieu: d.thanh_vien.ho_ten, phu: `${d.buoi.ten} · ${ngay(d.buoi.bat_dau)} · ${d.ly_do}`, sau: nhanDon(d), onclick: () => xuLy(d) });
  dat(vung, thanhNho('Đơn xin nghỉ'),
    cho.length ? nhom(`Chờ duyệt · ${cho.length}`, cho.map(hang)) : rong('Không có đơn nào đang chờ.'),
    xong.length ? nhom('Đã xử lý', xong.map(hang)) : null);
}

/* ---------- Thông báo ---------- */
async function manThongBao(vung) {
  const lai = () => manThongBao(vung);
  const ds = await S.db.dsThongBao();
  const moTB = (x) => {
    const s = moSheet({
      tieuDe: 'Thông báo', noiDung: h('div', null,
        h('h2', { style: 'font-size:1.25rem;letter-spacing:-0.015em;margin-bottom:4px' }, x.tieu_de),
        h('p', { class: 'chu-nho', style: 'margin-bottom:12px' }, ngayGio(x.dang_luc)),
        h('div', { class: 'noi-dung-tb', style: 'margin-bottom:18px' }, x.noi_dung || ''),
        h('div', { class: 'hang-nut' },
          h('button', { class: 'nut nguy', type: 'button', onclick: async () => { if (await xacNhan({ tieuDe: 'Xóa thông báo?', nut: 'Xóa', nguy: true })) { const ok = await thu(() => S.db.xoaThongBao(x.id), 'Đã xóa'); if (ok) { s.dong(); lai(); } } } }, 'Xóa'),
          h('button', { class: 'nut phu', type: 'button', onclick: () => { s.dong(); soanThongBao(x, lai); } }, 'Sửa')))
    });
  };
  dat(vung, thanhNho('Thông báo', '#quan-ly', 'Quản lý', h('button', { class: 'nut-lui', type: 'button', onclick: () => soanThongBao(null, lai) }, 'Thêm')),
    ds.length ? h('div', { class: 'nhom' }, ds.map(x => dong({ tieu: x.tieu_de, phu: ngayGio(x.dang_luc) + (x.ghim ? ' · Đã ghim' : ''), onclick: () => moTB(x) }))) : rong('Chưa có thông báo nào.'));
}

/* ---------- Kích hoạt ---------- */
function hienMaKichHoat(ds) {
  if (!ds || !ds.length) return;
  const inPhieu = () => {
    const the = h('div', { class: 'trang-in' }, h('div', { class: 'in-luoi', style: 'grid-template-columns:repeat(2,1fr)' }, ds.map(d => h('div', { class: 'in-phieu' },
      h('b', null, d.ho_ten), h('br'), 'Mã thành viên: ', h('span', { class: 'ma' }, d.ma), h('br'), 'Mã kích hoạt: ', h('span', { class: 'ma' }, d.ma_kich_hoat), h('br'),
      window.NKTV_CONFIG.appUrl, h('br'), 'Mở trang, chọn kích hoạt bằng mã, tự đặt mật khẩu. Mã dùng một lần, hết hạn sau 30 ngày.'))));
    document.body.append(the); window.print(); setTimeout(() => the.remove(), 500);
  };
  moSheet({
    tieuDe: `Mã kích hoạt · ${ds.length} người`,
    noiDung: h('div', null,
      h('div', { class: 'bang-tin' }, 'Mã chỉ hiện một lần này. In phiếu hoặc tải tệp ngay, rồi đưa riêng cho từng người.'),
      h('div', { class: 'hang-nut', style: 'margin-bottom:16px' },
        h('button', { class: 'nut phu', type: 'button', onclick: inPhieu }, 'In phiếu'),
        h('button', { class: 'nut phu', type: 'button', onclick: () => taiCSV('ma-kich-hoat.csv', [['Mã thành viên', 'Họ và tên', 'Mã kích hoạt'], ...ds.map(d => [d.ma, d.ho_ten, d.ma_kich_hoat])]) }, 'Tải CSV')),
      h('div', { class: 'nhom' }, ds.map(d => dong({ tieu: d.ho_ten, phu: d.ma, sau: h('span', { style: 'font:600 0.9375rem ui-monospace,Menlo,Consolas,monospace;letter-spacing:.03em;color:var(--chu)' }, d.ma_kich_hoat) }))))
  });
}

async function manKichHoat(vung) {
  const [ds, tt] = await Promise.all([S.db.dsThanhVien(), S.db.tinhTrangKichHoat()]);
  const m = new Map(tt.map(x => [x.thanh_vien_id, x]));
  const lai = () => manKichHoat(vung);
  const hd = ds.filter(t => t.hoat_dong);
  const daCo = hd.filter(t => m.get(t.id) && m.get(t.id).da_kich_hoat);
  const chua = hd.filter(t => !m.get(t.id) || !m.get(t.id).da_kich_hoat);
  const chuaCapMa = chua.filter(t => !m.get(t.id) || !m.get(t.id).ma_con_han);
  dat(vung, thanhNho('Kích hoạt tài khoản'),
    soLieu([{ so: daCo.length, ten: 'Đã kích hoạt', lop: 'dung' }, { so: chua.length - chuaCapMa.length, ten: 'Đã cấp mã, chưa dùng', lop: 'tre' }, { so: chuaCapMa.length, ten: 'Chưa cấp mã' }]),
    chuaCapMa.length ? h('button', { class: 'nut day', type: 'button', style: 'margin-bottom:22px', onclick: async () => {
      if (!await xacNhan({ tieuDe: `Cấp mã cho ${chuaCapMa.length} người?`, chu: 'Mã chỉ hiện một lần ngay sau bước này.', nut: 'Cấp mã' })) return;
      const kq = await thu(() => S.db.capMaKichHoat(chuaCapMa.map(t => t.id)));
      if (kq) { await lai(); hienMaKichHoat(kq); }
    } }, `Cấp mã cho ${chuaCapMa.length} người chưa có`) : null,
    chua.length ? nhom('Chưa kích hoạt', h('div', null, chua.map(t => dong({
      tieu: t.ho_ten, phu: t.ma + ' · ' + (m.get(t.id) && m.get(t.id).ma_con_han ? 'Đã cấp mã' : 'Chưa cấp mã'),
      sau: 'Cấp mã', onclick: async () => { const kq = await thu(() => S.db.capMaKichHoat([t.id])); if (kq) { await lai(); hienMaKichHoat(kq); } }
    })))) : null,
    daCo.length ? nhom('Đã kích hoạt · chạm để cấp lại khi quên mật khẩu', h('div', null, daCo.map(t => dong({
      tieu: t.ho_ten, phu: t.ma,
      onclick: async () => { if (!await xacNhan({ tieuDe: `Cấp lại mã cho ${t.ho_ten}?`, chu: 'Mật khẩu cũ vẫn dùng được cho đến khi người này đặt mật khẩu mới bằng mã.', nut: 'Cấp lại' })) return; const kq = await thu(() => S.db.capMaKichHoat([t.id])); if (kq) { await lai(); hienMaKichHoat(kq); } }
    })))) : null);
}

/* ---------- Danh mục và xác nhận năng lực ---------- */
function suaNangLuc(x, sauKhi) {
  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const v = f.elements;
      if (!v.ten.value.trim()) return;
      const o = { nhom: v.nhom.value, ten: v.ten.value.trim(), mo_ta: v.mt.value.trim() || null, dang_dung: v.dd.checked, thu_tu: Number(v.tt.value) || 0 };
      const ok = await thu(() => x ? S.db.suaNangLuc(x.id, o) : S.db.themNangLuc(o), 'Đã lưu');
      if (ok) { s.dong(); sauKhi(); }
    }
  },
    h('div', { class: 'nhom' },
      oNhap('Tên năng lực', { name: 'ten', value: x ? x.ten : '', required: true }),
      oChon('Nhóm', [['A', 'A · Năng lực cốt lõi'], ['B', 'B · Kỹ năng chuyên môn CLB']], x ? x.nhom : 'B', { name: 'nhom' }),
      oNhap('Mô tả các bậc', { the: 'textarea', name: 'mt', value: x ? x.mo_ta : '', rows: 4 }),
      oNhap('Thứ tự', { name: 'tt', type: 'number', value: x ? x.thu_tu : 100, inputmode: 'numeric' }),
      oBat('Đang dùng', { name: 'dd', checked: x ? x.dang_dung : true })),
    h('button', { class: 'nut day', type: 'submit' }, 'Lưu'));
  const s = moSheet({ tieuDe: x ? 'Sửa năng lực' : 'Năng lực mới', noiDung: f });
}

async function manDanhMuc(vung) {
  const ds = await S.db.dsNangLuc();
  const lai = async () => { S.caiDat = await S.db.caiDat(); manDanhMuc(vung); };
  dat(vung, thanhNho('Danh mục năng lực', '#quan-ly', 'Quản lý', h('button', { class: 'nut-lui', type: 'button', onclick: () => suaNangLuc(null, lai) }, 'Thêm')),
    BANG_MINH_HOA(),
    h('div', { class: 'nhom' }, oBat('Đã được Ban chủ nhiệm duyệt', { checked: S.caiDat.danh_muc_da_duyet === true, onchange: async (e) => { const v = e.target.checked; const ok = await thu(() => S.db.datCaiDat('danh_muc_da_duyet', v), 'Đã lưu'); if (ok) lai(); } })),
    ['A', 'B'].map(n => nhom(n === 'A' ? 'A · Năng lực cốt lõi' : 'B · Kỹ năng chuyên môn CLB', ds.filter(x => x.nhom === n).map(x => dong({ tieu: x.ten, phu: x.dang_dung ? x.mo_ta : 'Đã tắt', onclick: () => suaNangLuc(x, lai) })))));
}

async function manXacNhan(vung) {
  const lai = () => manXacNhan(vung);
  const [nl, hd] = await Promise.all([S.db.nangLucCho(), S.db.hoatDongCho()]);
  const xlNl = (x) => {
    const f = h('form', { onsubmit: (e) => e.preventDefault() },
      h('div', { class: 'nhom' },
        dong({ tieu: x.nang_luc.ten, phu: 'Bậc ' + BAC[x.bac - 1] }),
        dong({ tieu: x.minh_chung || '(không ghi)', phu: 'Minh chứng · gửi ' + ngay(x.gui_luc) }),
        x.lien_ket ? dong({ tieu: 'Mở minh chứng', href: x.lien_ket, target: '_blank' }) : null),
      h('div', { class: 'nhom' }, oNhap('Ngày đạt', { name: 'ng', type: 'date', value: giaTriNgay(Date.now()) }), oNhap('Phản hồi (nếu có)', { name: 'ph' })),
      h('div', { class: 'hang-nut' },
        h('button', { class: 'nut nguy', type: 'button', onclick: async () => { const ok = await thu(() => S.db.xuLyNangLuc(x.id, false, null, f.elements.ph.value), 'Đã ghi chưa xác nhận'); if (ok) { s.dong(); lai(); } } }, 'Chưa đạt'),
        h('button', { class: 'nut', type: 'button', onclick: async () => { const ok = await thu(() => S.db.xuLyNangLuc(x.id, true, f.elements.ng.value, f.elements.ph.value), 'Đã xác nhận'); if (ok) { s.dong(); lai(); } } }, 'Xác nhận đạt')));
    const s = moSheet({ tieuDe: x.thanh_vien.ho_ten, noiDung: f });
  };
  const xlHd = (x) => {
    const f = h('form', { onsubmit: (e) => e.preventDefault() },
      h('div', { class: 'nhom' },
        dong({ tieu: x.ten, phu: LOAI_HD[x.loai] + ' · ' + ngay(x.ngay) + (x.so_gio ? ` · ${x.so_gio} giờ` : '') }),
        x.lien_ket ? dong({ tieu: 'Mở minh chứng', href: x.lien_ket, target: '_blank' }) : null),
      h('div', { class: 'nhom' }, oNhap('Phản hồi (nếu có)', { name: 'ph' })),
      h('div', { class: 'hang-nut' },
        h('button', { class: 'nut nguy', type: 'button', onclick: async () => { const ok = await thu(() => S.db.xuLyHoatDong(x.id, false, f.elements.ph.value), 'Đã ghi không xác nhận'); if (ok) { s.dong(); lai(); } } }, 'Không xác nhận'),
        h('button', { class: 'nut', type: 'button', onclick: async () => { const ok = await thu(() => S.db.xuLyHoatDong(x.id, true, f.elements.ph.value), 'Đã xác nhận'); if (ok) { s.dong(); lai(); } } }, 'Xác nhận')));
    const s = moSheet({ tieuDe: x.thanh_vien.ho_ten, noiDung: f });
  };
  dat(vung, thanhNho('Xác nhận'),
    nl.length ? nhom(`Năng lực · ${nl.length}`, nl.map(x => dong({ tieu: x.thanh_vien.ho_ten, phu: `${x.nang_luc.ten} · ${BAC[x.bac - 1]}`, onclick: () => xlNl(x) }))) : null,
    hd.length ? nhom(`Hoạt động · ${hd.length}`, hd.map(x => dong({ tieu: x.thanh_vien.ho_ten, phu: `${x.ten} · ${LOAI_HD[x.loai]}`, onclick: () => xlHd(x) }))) : null,
    !nl.length && !hd.length ? rong('Không có gì đang chờ xác nhận.') : null);
}

/* ---------- Báo cáo chuyên cần ---------- */
async function manBaoCao(vung) {
  const nam = namHoc();
  const ds = await S.db.baoCaoChuyenCan(nam.tu, nam.den);
  let nha = '';
  const vungDs = h('div');
  const pt = (x) => x.tong ? Math.round((x.dung + x.tre) / x.tong * 100) : 0;
  const ve = () => {
    const kq = ds.filter(x => !nha || x.nha === nha);
    dat(vungDs, kq.length ? h('div', { class: 'nhom' }, kq.map(x => dong({ tieu: x.ho_ten, phu: `${moTaTV(x)} · ${x.dung + x.tre}/${x.tong} buổi · Trễ ${x.tre} · Phép ${x.phep} · Vắng ${x.vang}`, sau: pt(x) + '%' }))) : rong('Chưa có buổi nào đã đóng để tính chuyên cần.'));
  };
  dat(vung, thanhNho('Chuyên cần'),
    h('p', { class: 'tieu-de-phu', style: 'margin-top:4px;text-align:center' }, 'Năm học ' + nam.nhan + ' · Chỉ tính các buổi đã đóng'),
    h('div', { class: 'chon-ngang' }, [['', 'Tất cả'], ...DS_NHA.map(n => [n, n])].map(([v, c]) => h('button', { class: 'vien', type: 'button', 'data-v': v, 'aria-pressed': nha === v ? 'true' : 'false', onclick: (e) => { nha = v; e.currentTarget.parentElement.querySelectorAll('.vien').forEach(n => n.setAttribute('aria-pressed', n.dataset.v === v ? 'true' : 'false')); ve(); } }, c))),
    vungDs,
    ds.length ? h('button', { class: 'nut phu day', type: 'button', onclick: () => taiCSV(`chuyen-can-${nam.nhan}.csv`, [['Mã', 'Họ và tên', 'Generation', 'Nhà', 'Cấp', 'Tổng buổi', 'Đúng giờ', 'Trễ', 'Có phép', 'Vắng', 'Chuyên cần (%)'], ...ds.map(x => [x.ma, x.ho_ten, x.gen, x.nha, x.cap, x.tong, x.dung, x.tre, x.phep, x.vang, pt(x)])]) }, 'Xuất CSV') : null);
  ve();
}
