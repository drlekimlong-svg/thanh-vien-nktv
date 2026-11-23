// Khởi động, đăng nhập, khung điều hướng.
import { S, donDep } from './state.js';
import { $, h, dat, dong, bieuTuong, oNhap, ngay, NHA, moTaTV, dangTai, dongHetSheet, anhDaiDien, bannerCLB } from './ui.js';
import { api, chuanMa } from './api.js';
import { manHomNay } from './v-homnay.js';
import { manLich } from './v-lich.js';
import { manSoanLich, manKhoLich } from './v-soanlich.js';
import { manDiemNhom } from './v-diemnhom.js';
import { manPostTest, manLamBai, manKetQua } from './v-test.js';
import { manHoSo } from './v-hoso.js';
import { manQuanLy, tuyenQuanLy, thanhNho } from './v-quanly.js';
import { manTuyenQuan } from './v-tuyenquan.js';
import { tuyenTapHuan } from './v-dot.js';
import { tuyenHocVien } from './v-hocvien.js';
import { manGuiBai } from './v-guibai.js';
import { manBaiGiay, manQlBaiGiay } from './v-baigiay.js';
import { manKhaoSat } from './v-khaosat.js';
import { canHoi, noiDungHoiLai, noiDungTuChoi, noiDungThongBao, oDongY, manQlDuLieu, PHIEN_BAN } from './v-dulieu.js';

const goc = $('#app');
const q = new URLSearchParams(location.search);

/* Thanh tab tối đa 5 mục (anh Long chốt 21/11/2026). `cung`: các trang con vẫn tô sáng tab này.
   - Post-test và Gửi bài chung tab "Bài làm", chuyển qua lại bằng nút hai nửa ở đầu màn hình.
   - Tập huấn vào trong Quản lý; ai thuộc Ban tổ chức đợt mà không có tab Quản lý thì Tập huấn là tab thứ năm.
   - Tuyển quân không còn là tab: khi mở, lối vào là thẻ đầu màn hình Hôm nay và dòng trong Quản lý. */
const TAB = [
  { id: 'hom-nay', ten: 'Hôm nay', icon: 'hom_nay' },
  { id: 'lich', ten: 'Lịch', icon: 'lich' },
  { id: 'post-test', ten: 'Bài làm', icon: 'test', cung: ['gui-bai'] },
  { id: 'ho-so', ten: 'Hồ sơ', icon: 'ho_so' },
  { id: 'quan-ly', ten: 'Quản lý', icon: 'quan_ly', dk: () => S.toi.xem_duoc_ten, cung: ['tap-huan', 'tuyen-quan'] },
  { id: 'tap-huan', ten: 'Tập huấn', icon: 'nguoi', dk: () => !S.toi.xem_duoc_ten && !!(S.toi.btc_dot && S.toi.btc_dot.length) }
];
// Học viên các đợt tập huấn dùng bộ tab riêng: không có lịch CLB, post-test, quản lý.
const TAB_HV = [
  { id: 'hom-nay', ten: 'Hôm nay', icon: 'hom_nay' },
  { id: 'lich', ten: 'Lịch học', icon: 'lich' },
  { id: 'tai-lieu', ten: 'Tài liệu', icon: 'test' },
  { id: 'ket-qua', ten: 'Kết quả', icon: 'sao' },
  { id: 'ho-so', ten: 'Hồ sơ', icon: 'ho_so' }
];
const laHocVien = () => S.toi && S.toi.loai === 'hoc_vien';

export const denTrang = (duong) => { if (location.hash === '#' + duong) tuyen(); else location.hash = duong; };

async function tuyen() {
  donDep(); dongHetSheet();
  const [dau, ...con] = location.hash.replace(/^#\/?/, '').split('/');
  const tab = dau || 'hom-nay';
  dat($('#khung-tab'), (laHocVien() ? TAB_HV : TAB.filter(t => !t.dk || t.dk())).map(t =>
    h('button', { class: 'tab', type: 'button', 'aria-current': t.id === tab || (t.cung || []).includes(tab) ? 'page' : null, onclick: () => denTrang(t.id) },
      h('span', { class: 'vien-tab' }, bieuTuong(t.icon)), h('span', { class: 'ten-tab' }, t.ten),
      t.id === 'quan-ly' && S.soCho ? h('span', { class: 'cham' }, S.soCho) : null)));
  // Thanh logo chỉ ở trang gốc của mỗi tab; Hôm nay đã có dải xanh riêng, trang con có thanh quay lại.
  goc.dataset.dauApp = !con.length && !(tab === 'hom-nay' && !laHocVien()) ? 'co' : '';
  const vung = $('#vung');
  vung.className = 'noi-dung';
  dat(vung, dangTai());
  window.scrollTo(0, 0);
  try {
    if (laHocVien()) await tuyenHocVien(vung, tab, con);
    else if (tab === 'lich') {
      if (con[0] === 'soan') await manSoanLich(vung, con[1], con[2]);
      else if (con[0] === 'kho') await manKhoLich(vung);
      else if (con[0] === 'diem-nhom') await manDiemNhom(vung);
      else await manLich(vung);
    }
    else if (tab === 'post-test') {
      if (con[0] === 'lam') await manLamBai(vung, con[1]);
      else if (con[0] === 'ket-qua') await manKetQua(vung, con[1]);
      else if (con[0] === 'phieu') await manBaiGiay(vung, con[1]);
      else if (con[0] === 'phieu-ql') await manQlBaiGiay(vung, con[1], con[2]);
      else await manPostTest(vung);
    } else if (tab === 'gui-bai') manGuiBai(vung);
    else if (tab === 'khao-sat') await manKhaoSat(vung, con);
    else if (tab === 'tuyen-quan') await manTuyenQuan(vung, con);
    else if (tab === 'tap-huan') await tuyenTapHuan(vung, con);
    else if (tab === 'ho-so') await manHoSo(vung, con[0]);
    else if (tab === 'quan-ly') {
      if (con[0] === 'du-lieu') await manQlDuLieu(vung, thanhNho);
      else if (con.length) await tuyenQuanLy(vung, con); else { await manQuanLy(vung); xepHaiCot(vung); }
    }
    else await manHomNay(vung);
  } catch (e) {
    console.error(e);
    dat(vung, h('div', { class: 'rong-chu' }, e.message || 'Không tải được dữ liệu.', h('div', { style: 'margin-top:14px' }, h('button', { class: 'nut phu nho', type: 'button', onclick: tuyen }, 'Thử lại'))));
  }
}

/** Gói mỗi nhãn nhóm với nhóm ngay sau nó, để màn hình rộng xếp được hai cột (Quản lý). */
function xepHaiCot(vung) {
  const con = [...vung.children];
  con.forEach((el, i) => {
    if (!el.classList.contains('nhom')) return;
    const nhan = con[i - 1] && con[i - 1].classList.contains('nhan-nhom') ? con[i - 1] : null;
    const khoi = h('div', { class: 'khoi-cot' });
    el.before(khoi);
    if (nhan) khoi.append(nhan);
    khoi.append(el);
  });
  vung.classList.add('hai-cot');
}

/* Màn đăng nhập và thẻ công khai luôn nền sáng: logo nét đậm chìm trên nền tối, và không đặt nền tròn sau logo. */
function nenSang(bat) {
  const r = document.documentElement;
  if (bat) r.dataset.theme = 'light'; else delete r.dataset.theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.content = bat || !m.media.includes('dark') ? '#F5F6F4' : '#0E1822'; });
}

function dungKhung() {
  nenSang(false);
  const nha = S.toi.nha && NHA[S.toi.nha];
  document.documentElement.style.setProperty('--tab-nen', 'var(--be-mat)');
  dat(goc, h('div', { class: 'khung' },
    h('nav', { class: 'thanh-tab', 'aria-label': 'Điều hướng chính', id: 'thanh-tab' },
      h('div', { class: 'logo-ben' }, h('img', { src: 'img/logo.webp', alt: '' }), h('span', null, 'CLB Ngoại khoa', h('br'), 'Trưng Vương')),
      h('div', { id: 'khung-tab', style: 'display:contents' })),
    // Logo CLB ở đầu mỗi màn trên điện thoại (máy tính đã có ở thanh bên).
    h('header', { class: 'dau-app' },
      h('img', { class: 'logo-dau', src: 'img/logo.webp', alt: 'Logo CLB Ngoại khoa Trưng Vương' }),
      h('span', { class: 'ten-dau' }, 'CLB Ngoại khoa', h('br'), 'Trưng Vương'),
      h('a', { href: '#ho-so', 'aria-label': 'Hồ sơ của tôi' }, anhDaiDien(S.toi))),
    h('main', { id: 'vung', class: 'noi-dung' })));
  if (nha) { goc.classList.add('co-nha'); goc.style.setProperty('--nha-goc', nha.mau); }
  window.addEventListener('hashchange', tuyen);
  tuyen();
}

/* ---------- Dữ liệu cá nhân: trang công khai, hỏi lại, sau khi từ chối ---------- */
function manDuLieu() {
  nenSang(true);
  dat(goc, h('div', { class: 'man-ngoai man-du-lieu' },
    h('a', { class: 'nut-chu', href: location.pathname + (S.demo ? location.search.replace(/[?&]du-lieu[^&]*/, '').replace(/^&/, '?') : ''), style: 'align-self:flex-start;margin-left:-6px;text-decoration:none' }, '‹ Mở app thành viên'),
    h('img', { class: 'logo-nho-ngoai', src: 'img/logo.webp', alt: 'Logo CLB Ngoại khoa Trưng Vương' }),
    h('h1', { class: 'tieu-de-serif' }, 'Dữ liệu cá nhân của bạn'),
    h('div', { class: 'gach-ngan' }),
    noiDungThongBao('thu')));
}

function manHoiLai(dy) {
  nenSang(true);
  dat(goc, h('div', { class: 'man-ngoai' },
    h('img', { class: 'logo-nho-ngoai', src: 'img/logo.webp', alt: 'Logo CLB Ngoại khoa Trưng Vương' }),
    noiDungHoiLai(dy, {
      tiepTuc: () => dungKhung(),
      tuChoi: async () => { await S.db.dangXuat(); manTuChoi(); }
    })));
}

function manTuChoi() {
  nenSang(true);
  window.removeEventListener('hashchange', tuyen);
  history.replaceState(null, '', location.pathname + location.search);
  goc.classList.remove('co-nha');
  dat(goc, h('div', { class: 'man-ngoai' },
    h('img', { class: 'logo-nho-ngoai', src: 'img/logo.webp', alt: 'Logo CLB Ngoại khoa Trưng Vương' }),
    noiDungTuChoi(),
    h('button', { class: 'nut phu day', type: 'button', onclick: () => manDangNhap() }, 'Về giao diện đăng nhập')));
}
// Rút lại đồng ý từ Hồ sơ › Dữ liệu của tôi.
window.addEventListener('nktv-tu-choi', async () => { await S.db.dangXuat(); manTuChoi(); });

/* ---------- Thẻ công khai khi quét bằng camera thường ---------- */
async function manThe(khoa) {
  nenSang(true);
  dat(goc, h('div', { class: 'man-ngoai' }, dangTai()));
  let t = null, loi = '';
  try { t = await S.db.theCongKhai(khoa); } catch (e) { loi = e.message; }
  const nha = t && t.nha && NHA[t.nha];
  dat(goc, h('div', { class: 'man-ngoai' + (nha ? ' co-nha' : ''), style: nha ? `--nha-goc:${nha.mau}` : null },
    t ? h('div', { class: 'the-cong-khai' },
      h('div', { class: 'dau' }, h('img', { src: nha ? `img/${nha.anh}.webp` : 'img/logo.webp', alt: '' })),
      h('div', { class: 'than' },
        h('div', { class: 'ten' }, t.ho_ten),
        h('div', { style: 'color:var(--chu-2);margin:6px 0 12px' }, moTaTV(t)),
        h('span', { class: 'the-nhan ' + (t.hoat_dong ? 'dung' : '') }, t.hoat_dong ? 'Đang hoạt động' : 'Đã ngừng hoạt động')))
      : h('div', { class: 'rong-chu' }, loi || 'Mã này không thuộc thành viên nào.'),
    h('p', { class: 'chu-nho giua-chu', style: 'margin:18px 0 14px' }, 'CLB Ngoại Khoa Trưng Vương - Trường ĐH Y Khoa Phạm Ngọc Thạch'),
    h('a', { class: 'nut phu', href: location.pathname + (S.demo ? location.search.replace(/[?&]the=[^&]*/, '') : '') }, 'Mở app thành viên')));
}

/* ---------- Tra cứu giấy chứng nhận, không cần đăng nhập ----------
   Mã in trên giấy. Ai có mã thì xem được họ tên, đợt và mức của đúng giấy đó;
   hàm tra_chung_nhan không trả về email, số điện thoại hay điểm từng bài. */
const MUC_CN = {
  xuat_sac: ['Xuất sắc', 'dung'], hoan_thanh: ['Hoàn thành', 'dung'],
  hoan_thanh_ghi_chu: ['Hoàn thành có ghi chú', 'phep'], tham_du: ['Tham dự', 'tre'],
  chua_hoan_thanh: ['Chưa hoàn thành', 'vang']
};
async function manChungNhan(ma) {
  nenSang(true);
  dat(goc, h('div', { class: 'man-ngoai' }, dangTai()));
  let c = null, loi = '';
  if (ma) { try { c = await S.db.traChungNhan(ma); } catch (e) { loi = e.message; } }
  const oMa = oNhap('Mã trên giấy', { name: 'ma', value: ma || '', placeholder: 'XQ2627-0001-K3PW', autocapitalize: 'characters', required: true });
  const form = h('form', { onsubmit: (e) => { e.preventDefault(); const v = form.elements.ma.value.trim(); if (v) manChungNhan(v); } },
    h('div', { class: 'nhom' }, oMa), h('button', { class: 'nut day', type: 'submit' }, 'Tra cứu'));
  dat(goc, h('div', { class: 'man-ngoai' },
    h('img', { class: 'logo-lon', src: 'img/logo.webp', alt: 'Logo CLB Ngoại Khoa Trưng Vương' }),
    h('h1', { class: 'ten-clb' }, 'CLB Ngoại Khoa Trưng Vương'),
    h('p', { class: 'khau-hieu' }, 'Tra cứu giấy chứng nhận'),
    c ? h('div', { class: 'the-cong-khai' }, h('div', { class: 'than' },
      h('div', { class: 'ten' }, c.ho_ten),
      h('div', { style: 'color:var(--chu-2);margin:6px 0 4px' }, c.dot_ten),
      h('div', { class: 'chu-nho', style: 'margin-bottom:12px' }, 'Mã ', c.ma),
      h('span', { class: 'the-nhan ' + (c.con_hieu_luc ? MUC_CN[c.muc][1] : 'vang') },
        c.con_hieu_luc ? MUC_CN[c.muc][0] : 'Giấy đã thu hồi'),
      c.ghi_chu ? h('p', { class: 'chu-nho', style: 'margin-top:10px' }, c.ghi_chu) : null,
      h('p', { class: 'chu-nho', style: 'margin-top:10px' }, 'Cấp ngày ', ngay(c.cap_luc))))
      : ma ? h('div', { class: 'rong-chu' }, loi || 'Không có giấy chứng nhận nào mang mã này.') : null,
    form,
    h('p', { class: 'chu-nho giua-chu', style: 'margin:16px 0 14px' }, 'Trang này chỉ cho biết giấy có thật và còn hiệu lực hay không.'),
    h('a', { class: 'nut phu', href: location.pathname }, 'Mở app thành viên')));
  if (!ma) (oMa.querySelector('input')).focus({ preventScroll: true });
}

/* ---------- Đăng nhập và kích hoạt ----------
   Trước 18/11/2026 chỉ có một màn, "Kích hoạt bằng mã" là dòng chữ nhỏ dưới cùng, nên nhiều
   người lần đầu dùng app điền mã kích hoạt vào ô mật khẩu. Nay chia ba màn, mỗi màn hỏi đúng
   một câu, và hai lựa chọn "Đăng nhập" với "Kích hoạt bằng mã" hiện ngang nhau. */

// han: số ngày mã kích hoạt còn dùng được (0002/0009: thành viên 30 ngày; 0013/0017: học viên 90 ngày).
const CUA = {
  thanh_vien: { ten: 'Thành viên CLB', phu: 'Mã NKTV-… do Ban nhân sự cấp', icon: 'nguoi', mau: 'NKTV-001', ai: 'Ban nhân sự', han: 30 },
  hoc_vien: { ten: 'Học viên tập huấn', phu: 'Mã HV… do Ban tổ chức đợt cấp', icon: 'ho_so', mau: 'HV00001', ai: 'Ban tổ chức đợt', han: 90 }
};

const lienKetDuLieu = () => location.pathname + '?du-lieu' + (S.demo ? '&demo=' + (q.get('demo') || '') : '');
const khungNgoai = (...con) => {
  nenSang(true);
  dat(goc, h('div', { class: 'man-ngoai man-dang-nhap' },
    // Tranh tập thể bản không chữ (anh Long gửi 22/11/2026); tên CLB và câu chuyện trung tâm là chữ thật bên dưới.
    bannerCLB('banner-ngoai'),
    h('div', { class: 'kicker giua-chu' }, 'App thành viên'),
    h('h1', { class: 'ten-clb' }, 'CLB Ngoại khoa', h('br'), 'Trưng Vương'),
    h('p', { class: 'khau-hieu' }, 'Đón Nhận – Trưởng thành – Trao lại'),
    h('div', { class: 'gach-ngan giua' }),
    ...con,
    // Lối vào thông báo xử lý dữ liệu cá nhân, mở được khi chưa đăng nhập (migration 0020).
    h('a', { class: 'chan-du-lieu', href: lienKetDuLieu() },
      h('span', { class: 'hang' }, 'Dữ liệu cá nhân của bạn ›'),
      h('small', null, 'CLB thu gì, lưu ở đâu, bạn có quyền gì · phiên bản ' + PHIEN_BAN))));
};
const oLoi = (chu) => { const d = h('div', { class: 'loi-o', style: 'padding:0 16px 14px' }, chu || ''); d.hidden = !chu; return d; };
const hoi = (chu) => h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:10px' }, chu);
const nutLui = (viec) => h('div', { class: 'giua-chu', style: 'margin-top:16px' },
  h('button', { class: 'nut-chu', type: 'button', onclick: viec }, '‹ Quay lại'));

function manDangNhap(baoLoi = '') {
  khungNgoai(
    oLoi(baoLoi),
    hoi('Bạn đăng nhập với tư cách nào?'),
    h('div', { class: 'nhom' }, Object.keys(CUA).map(k => dong({
      tieu: CUA[k].ten, phu: CUA[k].phu,
      truoc: h('div', { class: 'bieu-tuong' }, bieuTuong(CUA[k].icon)),
      onclick: () => manChonViec(k)
    }))));
}

function manChonViec(loai) {
  const v = CUA[loai];
  khungNgoai(
    hoi(v.ten + ' · bạn muốn làm gì?'),
    h('div', { class: 'nhom' },
      dong({ tieu: 'Đăng nhập', phu: 'Đã có mật khẩu', truoc: h('div', { class: 'bieu-tuong' }, bieuTuong('khoa')), onclick: () => manNhap(loai, 'dang-nhap') }),
      dong({ tieu: 'Kích hoạt bằng mã', phu: 'Lần đầu dùng app, hoặc quên mật khẩu', truoc: h('div', { class: 'bieu-tuong' }, bieuTuong('phieu')), onclick: () => manNhap(loai, 'kich-hoat') })),
    h('p', { class: 'chu-nho giua-chu' }, 'Mã kích hoạt do ', v.ai, ' cấp, dùng một lần. Đừng điền mã kích hoạt vào ô mật khẩu: chọn "Kích hoạt bằng mã" thì app hỏi riêng ô cho nó.'),
    nutLui(() => manDangNhap()));
}

function manNhap(loai, cheDo, baoLoi = '') {
  const v = CUA[loai], kh = cheDo === 'kich-hoat';
  const ma = oNhap(loai === 'hoc_vien' ? 'Mã học viên' : 'Mã thành viên',
    { name: 'ma', autocomplete: 'username', placeholder: v.mau, autocapitalize: 'characters', required: true });
  const code = kh ? oNhap('Mã kích hoạt', { name: 'code', autocomplete: 'one-time-code', autocapitalize: 'characters', required: true }) : null;
  const mk = oNhap(kh ? 'Mật khẩu tự đặt (ít nhất 8 ký tự)' : 'Mật khẩu',
    { name: 'mk', type: 'password', autocomplete: kh ? 'new-password' : 'current-password', required: true });
  const loi = oLoi(baoLoi);
  const nut = h('button', { class: 'nut day', type: 'submit', disabled: kh }, kh ? 'Kích hoạt và đăng nhập' : 'Đăng nhập');
  // Kích hoạt lần đầu: hai ô đồng ý, không đánh dấu sẵn; nút chỉ bấm được khi đã chọn ô bắt buộc.
  const dongY = kh ? oDongY((ok) => { nut.disabled = !ok; }) : null;
  const form = h('form', {
    novalidate: true,
    onsubmit: async (e) => {
      e.preventDefault();
      const f = form.elements, m = chuanMa(f.ma.value, loai);
      loi.hidden = true;
      const baoSai = (c) => { loi.textContent = c; loi.hidden = false; };
      if (!m) return baoSai('Cần nhập mã, ví dụ ' + v.mau + '.');
      if (!f.mk.value) return baoSai('Cần nhập mật khẩu.');
      nut.disabled = true;
      try {
        if (kh) {
          if (!f.code.value.trim()) throw new Error('Cần nhập mã kích hoạt.');
          if (f.mk.value.length < 8) throw new Error('Mật khẩu cần ít nhất 8 ký tự.');
          if (!dongY.giaTri().dong_y) throw new Error('Cần đọc và chọn ô đồng ý bắt buộc.');
          await S.db.kichHoat(m, f.code.value, f.mk.value, loai);
        }
        await S.db.dangNhap(m, f.mk.value, loai);
        // Ghi lời đồng ý ngay sau khi có phiên. Ghi hỏng thì màn hỏi lại sẽ hiện, nên không chặn đăng nhập.
        if (kh) { const d = dongY.giaTri(); await S.db.ghiDongY(PHIEN_BAN, true, d.dang_anh, 'kich_hoat').catch(e => console.warn(e)); }
        await vaoApp();
      } catch (er) { baoSai(er.message); nut.disabled = kh && !dongY.giaTri().dong_y; }
    }
  },
    h('div', { class: 'nhom' }, ma, code, mk), dongY ? dongY.el : null, loi, nut);
  khungNgoai(
    hoi(v.ten + ' · ' + (kh ? 'kích hoạt bằng mã' : 'đăng nhập')),
    form,
    kh ? h('p', { class: 'chu-nho giua-chu', style: 'margin-top:12px' }, `Mã kích hoạt dùng một lần và hết hạn sau ${v.han} ngày. Ô mật khẩu là mật khẩu bạn tự đặt từ bây giờ, không phải mã kích hoạt.`) : null,
    nutLui(() => manChonViec(loai)));
  (ma.querySelector('input')).focus({ preventScroll: true });
}

async function vaoApp() {
  S.toi = await S.db.toi();
  if (!S.toi) {
    await S.db.dangXuat();
    return manDangNhap('Tài khoản này chưa gắn với ai. Báo lại cho Ban nhân sự hoặc Ban tổ chức đợt của bạn.');
  }
  // Lệch giờ giữa máy này và máy chủ, để mã động và giờ quét không sai khi đồng hồ điện thoại chạy lệch.
  if (S.toi.bay_gio) S.lech = new Date(S.toi.bay_gio).getTime() - Date.now();
  S.caiDat = await S.db.caiDat().catch(() => ({}));
  if (S.toi.la_phu_trach) S.soCho = (await S.db.dsDon('cho').catch(() => [])).length;
  // Chưa đồng ý phiên bản thông báo hiện hành (kể cả người kích hoạt trước khi có thông báo): hỏi trước khi vào app.
  const { can, dy } = await canHoi();
  if (can) return manHoiLai(dy);
  dungKhung();
}

/* ---------- Bắt đầu ---------- */
(async function () {
  const noiBo = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  S.demo = noiBo && q.has('demo');
  if (S.demo) {
    const { demo } = await import('./demo.js');
    S.db = demo(q.get('demo'));
    document.body.append(h('div', { class: 'tuy-nhap' }, 'Bản chạy thử · dữ liệu giả'));
  } else S.db = api;
  try {
    if (q.get('the')) return await manThe(q.get('the'));
    if (q.has('cn')) return await manChungNhan(q.get('cn'));
    if (q.has('du-lieu')) return manDuLieu();
    if (S.db.coPhien()) await vaoApp(); else manDangNhap();
  } catch (e) {
    console.error(e);
    if (e.status === 401) { await S.db.dangXuat(); manDangNhap(); return; }
    dat(goc, h('div', { class: 'man-ngoai' }, h('div', { class: 'rong-chu' }, e.message || 'Không kết nối được máy chủ.'), h('button', { class: 'nut phu', type: 'button', onclick: () => location.reload() }, 'Thử lại')));
  }
})();
