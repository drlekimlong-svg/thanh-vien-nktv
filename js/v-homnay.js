// Màn hình "Hôm nay": buổi sắp tới, thông báo, việc đang chờ.
import { S } from './state.js';
import { h, dat, dong, nhom, bieuTuong, moSheet, thu, gio, ngayGio, ngay, namHoc, oNhap, oBat, qrSvg, moTaTV, NHA, DS_NHA, anhDaiDien, bannerCLB } from './ui.js';
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

  // Dải xanh đầu màn theo bộ nhận diện: logo bản trắng, đường chỉ khâu, lời chào, ảnh đại diện (mascot nhà hoặc chữ cái đầu).
  const nha = S.toi.nha && NHA[S.toi.nha];
  const chuaNha = !nha && S.toi.cap === 'Junior';
  const moTa = [nha ? 'Nhà ' + S.toi.nha : null, S.toi.gen !== null && S.toi.gen !== undefined ? 'Gen ' + S.toi.gen : null, S.toi.cap, chuaNha ? 'chưa xếp nhà' : null].filter(Boolean).join(' · ');
  const chi = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  chi.setAttribute('class', 'chi-khau'); chi.setAttribute('viewBox', '0 0 390 260'); chi.setAttribute('preserveAspectRatio', 'none'); chi.setAttribute('aria-hidden', 'true');
  chi.innerHTML = '<path d="M150 248 C 210 200, 250 236, 300 196 S 372 150, 410 168" class="soi" stroke-dasharray="11 8"/><path d="M258 70 C 330 40, 380 92, 352 140 C 330 178, 268 160, 290 118 C 306 90, 372 96, 402 128" class="vong"/><path d="M196 224l8-14M226 218l8-14M256 210l8-14M286 198l8-14M316 184l8-14" class="mui-khau"/>';
  const thuHomNay = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long' }).format(new Date());
  const conLai = (t) => { const p = Math.round((new Date(t) - Date.now()) / 60e3); if (p <= 0) return null; const g = Math.floor(p / 60); return 'Còn ' + (g ? g + ' giờ' : '') + (g && p % 60 ? ' ' : '') + (p % 60 ? (p % 60) + ' phút' : ''); };
  const ganBuoiToi = toi && Math.abs(new Date(toi.bat_dau) - Date.now()) < 4 * 3600e3;
  const tuyenQuanMo = !!(S.caiDat.tuyen_quan && S.caiDat.tuyen_quan.mo === true);
  const oNhanh = (ten, icon, viec, so) => typeof viec === 'string'
    ? h('a', { class: 'o-nhanh', href: viec }, so ? h('span', { class: 'so-nho' }, so) : null, h('span', { class: 'bieu-tuong' }, bieuTuong(icon)), h('span', null, ten))
    : h('button', { class: 'o-nhanh', type: 'button', onclick: viec }, so ? h('span', { class: 'so-nho' }, so) : null, h('span', { class: 'bieu-tuong' }, bieuTuong(icon)), h('span', null, ten));

  dat(vung,
    h('section', { class: 'hero-hom-nay' }, chi,
      h('div', { class: 'hero-dau' },
        h('img', { class: 'logo-trang', src: 'img/logo.webp', alt: 'Logo CLB Ngoại khoa Trưng Vương' }),
        h('span', { class: 'ten-dau' }, 'CLB Ngoại khoa', h('br'), 'Trưng Vương'),
        h('a', { href: '#ho-so', 'aria-label': 'Hồ sơ của tôi' }, anhDaiDien(S.toi))),
      h('div', { class: 'kicker' }, thuHomNay, ' · ', ngay(Date.now())),
      h('h1', null, 'Chào ' + canh),
      moTa ? h('div', { class: 'phu' }, moTa) : null),
    toi ? h('div', { class: 'the-buoi' },
      h('div', { class: 'dau-the' },
        h('span', { class: 'kicker' }, new Date(toi.bat_dau) - Date.now() < 12 * 3600e3 ? 'Buổi gần nhất' : 'Buổi sắp tới'),
        conLai(toi.bat_dau) && new Date(toi.bat_dau) - Date.now() < 24 * 3600e3 ? h('span', { class: 'the-nhan dung' }, conLai(toi.bat_dau)) : null),
      h('h2', null, toi.ten),
      h('div', { class: 'chi-tiet' },
        h('div', null, ngayGio(toi.bat_dau), toi.ket_thuc ? ' – ' + gio(toi.ket_thuc) : ''),
        toi.dia_diem ? h('div', null, toi.dia_diem) : null,
        toi.nhom_truc ? h('div', null, h('i', { class: 'cham-nha', style: NHA[toi.nhom_truc] ? `background:${NHA[toi.nhom_truc].mau}` : null }), 'Nhà trực: ', toi.nhom_truc) : null),
      h('div', { class: 'cot-nut' },
        ganBuoiToi ? h('button', { class: 'nut day', type: 'button', onclick: moMaCuaToi }, bieuTuong('qr'), 'Mở mã điểm danh') : null,
        S.toi.la_phu_trach || (S.toi.buoi_diem_danh || []).includes(toi.id) ? h('a', { class: 'nut day' + (ganBuoiToi ? ' phu' : ''), href: '#quan-ly/buoi/' + toi.id }, bieuTuong('quet'), 'Quét điểm danh') : null,
        h('button', { class: 'nut phu nho day', type: 'button', onclick: () => suKienBuoi(toi) }, 'Chi tiết buổi, xin nghỉ')))
      : h('div', { class: 'the-buoi' }, h('div', { class: 'chi-tiet' }, 'Chưa có buổi sinh hoạt nào sắp tới.')),
    // Bốn việc hay dùng nằm cố định một chỗ.
    h('div', { class: 'luoi-nhanh' },
      oNhanh('Mã điểm danh', 'qr', moMaCuaToi),
      oNhanh('Điểm nhóm', 'sao', '#lich/diem-nhom'),
      oNhanh('Làm bài', 'test', '#post-test', baiMo.length || null),
      oNhanh('Gửi bài', 'gui', '#gui-bai')),
    tuyenQuanMo ? nhom(null, dong({ truoc: h('div', { class: 'bieu-tuong' }, bieuTuong('phieu')), tieu: 'Tuyển quân đang mở', phu: 'Phiếu đánh giá thí sinh', href: '#tuyen-quan' })) : null,
    // Junior Gen12 chọn nhà sau Tết Nguyên đán (anh Long, 20/11/2026).
    chuaNha ? h('a', { class: 'the-chon-nha', href: '#lich/diem-nhom' },
      h('div', { class: 'tieu' }, 'Sau Tết Nguyên đán, bạn sẽ chọn nhà'),
      h('div', { class: 'phu' }, 'Trước đó chuyên cần và điểm test vẫn ghi cho bạn, chưa cộng vào điểm nhóm.'),
      h('div', { class: 'sau-nha' }, DS_NHA.map(n => h('span', { style: `--nha-goc:${NHA[n].mau};--nha-nen:${NHA[n].nhat}`, title: n }, h('img', { src: `img/${NHA[n].anh}.webp`, alt: n }))))) : null,
    baiMo.length ? nhom('Bài cần làm', baiMo.map(b => dong({
      tieu: b.tieu_de,
      phu: b.dang_lam_den ? 'Đang làm dở, hạn ' + gio(b.dang_lam_den)
        : !b.da_diem_danh ? `Test đầu giờ · ${b.so_cau} câu · ${b.thoi_gian_phut} phút · Điểm danh xong là mở`
        : (b.dong_luc ? 'Hạn ' + ngayGio(b.dong_luc) : `${b.so_cau} câu · ${b.thoi_gian_phut} phút`),
      truoc: h('div', { class: 'bieu-tuong' }, bieuTuong('test')), href: '#post-test'
    }))) : null,
    vungTB,
    bannerCLB('banner-cuoi'),
    h('p', { class: 'chu-nho giua-chu' }, 'Năm học ' + nam.nhan));
  vung.classList.add('co-hero');
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
