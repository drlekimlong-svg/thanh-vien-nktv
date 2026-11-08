// Khởi động, đăng nhập, khung điều hướng.
import { S, donDep } from './state.js';
import { $, h, dat, bieuTuong, oNhap, NHA, moTaTV, dangTai, dongHetSheet } from './ui.js';
import { api, chuanMa } from './api.js';
import { manHomNay } from './v-homnay.js';
import { manLich } from './v-lich.js';
import { manSoanLich, manKhoLich } from './v-soanlich.js';
import { manDiemNhom } from './v-diemnhom.js';
import { manPostTest, manLamBai, manKetQua } from './v-test.js';
import { manHoSo } from './v-hoso.js';
import { manQuanLy, tuyenQuanLy } from './v-quanly.js';

const goc = $('#app');
const q = new URLSearchParams(location.search);

const TAB = [
  { id: 'hom-nay', ten: 'Hôm nay', icon: 'hom_nay' },
  { id: 'lich', ten: 'Lịch', icon: 'lich' },
  { id: 'post-test', ten: 'Post-test', icon: 'test' },
  { id: 'ho-so', ten: 'Hồ sơ', icon: 'ho_so' },
  { id: 'quan-ly', ten: 'Quản lý', icon: 'quan_ly', dk: () => S.toi.xem_duoc_ten }
];

export const denTrang = (duong) => { if (location.hash === '#' + duong) tuyen(); else location.hash = duong; };

async function tuyen() {
  donDep(); dongHetSheet();
  const [dau, ...con] = location.hash.replace(/^#\/?/, '').split('/');
  const tab = dau || 'hom-nay';
  dat($('#khung-tab'), TAB.filter(t => !t.dk || t.dk()).map(t =>
    h('button', { class: 'tab', type: 'button', 'aria-current': t.id === tab ? 'page' : null, onclick: () => denTrang(t.id) }, bieuTuong(t.icon), h('span', null, t.ten),
      t.id === 'quan-ly' && S.soCho ? h('span', { class: 'cham' }, S.soCho) : null)));
  const vung = $('#vung');
  vung.className = 'noi-dung';
  dat(vung, dangTai());
  window.scrollTo(0, 0);
  try {
    if (tab === 'lich') {
      if (con[0] === 'soan') await manSoanLich(vung, con[1], con[2]);
      else if (con[0] === 'kho') await manKhoLich(vung);
      else if (con[0] === 'diem-nhom') await manDiemNhom(vung);
      else await manLich(vung);
    }
    else if (tab === 'post-test') {
      if (con[0] === 'lam') await manLamBai(vung, con[1]);
      else if (con[0] === 'ket-qua') await manKetQua(vung, con[1]);
      else await manPostTest(vung);
    } else if (tab === 'ho-so') await manHoSo(vung, con[0]);
    else if (tab === 'quan-ly') { if (con.length) await tuyenQuanLy(vung, con); else await manQuanLy(vung); }
    else await manHomNay(vung);
  } catch (e) {
    console.error(e);
    dat(vung, h('div', { class: 'rong-chu' }, e.message || 'Không tải được dữ liệu.', h('div', { style: 'margin-top:14px' }, h('button', { class: 'nut phu nho', type: 'button', onclick: tuyen }, 'Thử lại'))));
  }
}

/* Màn đăng nhập và thẻ công khai luôn nền sáng: logo nét đậm chìm trên nền tối, và không đặt nền tròn sau logo. */
function nenSang(bat) {
  const r = document.documentElement;
  if (bat) r.dataset.theme = 'light'; else delete r.dataset.theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.content = bat || !m.media.includes('dark') ? '#f2f4f1' : '#0f1411'; });
}

function dungKhung() {
  nenSang(false);
  const nha = S.toi.nha && NHA[S.toi.nha];
  document.documentElement.style.setProperty('--tab-nen', 'var(--be-mat)');
  dat(goc, h('div', { class: 'khung' },
    h('nav', { class: 'thanh-tab', 'aria-label': 'Điều hướng chính', id: 'thanh-tab' },
      h('div', { class: 'logo-ben' }, h('img', { src: 'img/logo.webp', alt: '' }), h('span', null, 'CLB Ngoại khoa', h('br'), 'Trưng Vương')),
      h('div', { id: 'khung-tab', style: 'display:contents' })),
    h('main', { id: 'vung', class: 'noi-dung' })));
  if (nha) { goc.classList.add('co-nha'); goc.style.setProperty('--nha-goc', nha.mau); }
  window.addEventListener('hashchange', tuyen);
  tuyen();
}

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

/* ---------- Đăng nhập và kích hoạt ---------- */
function manDangNhap(cheDo = 'dang-nhap', baoLoi = '') {
  nenSang(true);
  const ma = oNhap('Mã thành viên', { name: 'ma', autocomplete: 'username', placeholder: 'NKTV-001', autocapitalize: 'characters', required: true });
  const mk = oNhap(cheDo === 'kich-hoat' ? 'Mật khẩu tự đặt (ít nhất 8 ký tự)' : 'Mật khẩu', { name: 'mk', type: 'password', autocomplete: cheDo === 'kich-hoat' ? 'new-password' : 'current-password', required: true });
  const code = cheDo === 'kich-hoat' ? oNhap('Mã kích hoạt', { name: 'code', autocomplete: 'one-time-code', autocapitalize: 'characters', required: true }) : null;
  const loi = h('div', { class: 'loi-o', style: 'padding:0 16px 14px' }, baoLoi);
  loi.hidden = !baoLoi;
  const nut = h('button', { class: 'nut day', type: 'submit' }, cheDo === 'kich-hoat' ? 'Kích hoạt và đăng nhập' : 'Đăng nhập');
  const form = h('form', {
    novalidate: true,
    onsubmit: async (e) => {
      e.preventDefault();
      const f = form.elements, m = chuanMa(f.ma.value);
      loi.hidden = true;
      const baoSai = (c) => { loi.textContent = c; loi.hidden = false; };
      if (!m) return baoSai('Cần nhập mã thành viên, ví dụ NKTV-001.');
      if (!f.mk.value) return baoSai('Cần nhập mật khẩu.');
      nut.disabled = true;
      try {
        if (cheDo === 'kich-hoat') {
          if (!f.code.value.trim()) throw new Error('Cần nhập mã kích hoạt.');
          if (f.mk.value.length < 8) throw new Error('Mật khẩu cần ít nhất 8 ký tự.');
          await S.db.kichHoat(m, f.code.value, f.mk.value);
        }
        await S.db.dangNhap(m, f.mk.value);
        await vaoApp();
      } catch (er) { baoSai(er.message); nut.disabled = false; }
    }
  },
    h('div', { class: 'nhom' }, ma, code, mk), loi, nut);
  dat(goc, h('div', { class: 'man-ngoai' },
    h('img', { class: 'logo-lon', src: 'img/logo.webp', alt: 'Logo CLB Ngoại Khoa Trưng Vương' }),
    h('h1', { class: 'ten-clb' }, 'CLB Ngoại Khoa Trưng Vương'),
    h('p', { class: 'khau-hieu' }, 'Đón Nhận – Trưởng thành – Trao lại'),
    form,
    h('div', { class: 'giua-chu', style: 'margin-top:14px' },
      h('button', { class: 'nut-chu', type: 'button', onclick: () => manDangNhap(cheDo === 'kich-hoat' ? 'dang-nhap' : 'kich-hoat') },
        cheDo === 'kich-hoat' ? 'Đã có tài khoản? Đăng nhập' : 'Lần đầu dùng hoặc quên mật khẩu? Kích hoạt bằng mã')),
    cheDo === 'kich-hoat' ? h('p', { class: 'chu-nho giua-chu', style: 'margin-top:12px' }, 'Mã kích hoạt do Ban nhân sự cấp, dùng một lần. Quên mật khẩu thì xin mã mới và làm lại bước này.') : null));
  (ma.querySelector('input')).focus({ preventScroll: true });
}

async function vaoApp() {
  S.toi = await S.db.toi();
  if (!S.toi) {
    await S.db.dangXuat();
    return manDangNhap('dang-nhap', 'Tài khoản này chưa gắn với thành viên nào. Báo lại cho Ban nhân sự.');
  }
  // Lệch giờ giữa máy này và máy chủ, để mã động và giờ quét không sai khi đồng hồ điện thoại chạy lệch.
  if (S.toi.bay_gio) S.lech = new Date(S.toi.bay_gio).getTime() - Date.now();
  S.caiDat = await S.db.caiDat().catch(() => ({}));
  if (S.toi.la_phu_trach) S.soCho = (await S.db.dsDon('cho').catch(() => [])).length;
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
    if (S.db.coPhien()) await vaoApp(); else manDangNhap();
  } catch (e) {
    console.error(e);
    if (e.status === 401) { await S.db.dangXuat(); manDangNhap(); return; }
    dat(goc, h('div', { class: 'man-ngoai' }, h('div', { class: 'rong-chu' }, e.message || 'Không kết nối được máy chủ.'), h('button', { class: 'nut phu', type: 'button', onclick: () => location.reload() }, 'Thử lại')));
  }
})();
