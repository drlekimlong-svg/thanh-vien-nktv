// Màn hình "Hôm nay": buổi sắp tới, thông báo, việc đang chờ.
import { S } from './state.js';
import { h, dat, dong, nhom, bieuTuong, moSheet, thu, gio, ngayGio, ngay, namHoc, oNhap, oBat, qrSvg, moTaTV, NHA, DS_NHA, anhDaiDien, tenDep, thuDai, ngayNgan, giaTriNgay } from './ui.js';
import { suKienBuoi } from './v-lich.js';
import { taoMa, BUOC } from './ma-dong.js';
import { khoiKhaoSat } from './v-khaosat.js';

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

/* ---------- Lời khích lệ ở dải đầu màn hình Hôm nay ----------
   Anh Long 22/11/2026: lời chào đổi ngẫu nhiên mỗi chủ nhật, để khích lệ thành viên đi sinh hoạt.
   Mỗi người một câu, giữ nguyên cả tuần, sang chủ nhật kế tiếp mới đổi (hạt giống: mã người + ngày chủ nhật).
   Ngày có buổi sinh hoạt dùng nhóm câu "hôm nay"; ngày khác dùng nhóm câu nhắc buổi tới.
   Câu có {nha} chỉ dùng khi người đó đã có nhà; {con} chỉ khi còn từ 2 ngày trở lên. Không dùng dấu chấm than. */
const LOI_HOM_NAY = [
  '{ten} ơi, {gio} hôm nay nhà {nha} chờ bạn ở {noi}',
  'Hôm nay cả CLB có mặt thì ca bệnh mới đủ người biện luận',
  'Chiều nay mang theo một câu hỏi bạn còn băn khoăn nhất',
  'Đến sớm 5 phút, điểm danh xong là vào ca',
  'Đón Nhận hôm nay, để mai kia Trao lại cho khóa sau',
  'Mỗi người một mũi khâu, thiếu bạn là hở một mũi',
  'Nhà {nha} cần đủ người hôm nay, hẹn bạn lúc {gio}',
  'Ba tiếng hôm nay, thêm một ca bệnh bạn hiểu đến nơi',
  '{ten}, hẹn bạn {gio} ở {noi}',
  'Tay vững nhờ những buổi đi đều, gặp bạn lúc {gio}',
  'Có mặt hôm nay là thêm điểm chuyên cần cho nhà {nha}',
  'Học cùng nhau hôm nay, vào trực sẽ đỡ bỡ ngỡ hơn'
];
const LOI_NGAY_THUONG = [
  'Buổi tới: {buoi}, nhớ giữ lịch',
  'Còn {con} ngày nữa là gặp lại cả CLB',
  'Đọc trước một chút trong tuần, buổi tới sẽ dễ theo hơn',
  'Xem bài cần làm sớm, đỡ dồn vào phút cuối',
  'Trưởng thành là đi đều từng buổi, không cần đi nhanh',
  'Bận thì xin nghỉ sớm trong app, để nhà biết mà sắp xếp',
  'Mỗi buổi bạn có mặt là thêm điểm cho nhà {nha}',
  'Buổi tới mang theo một câu hỏi lâm sàng của riêng bạn',
  'Đón Nhận – Trưởng thành – Trao lại: mỗi tuần một bước',
  'Ôn lại một kỹ năng của buổi trước, mười phút là đủ'
];
const bam = (s) => { let x = 5381; for (const c of s) x = ((x * 33) ^ c.charCodeAt(0)) >>> 0; return x; };
function loiChao(toi) {
  const homNay = new Date(giaTriNgay(Date.now()) + 'T12:00:00+07:00');
  const cn = new Date(homNay); cn.setUTCDate(cn.getUTCDate() - homNay.getUTCDay());
  const coBuoi = toi && giaTriNgay(toi.bat_dau) === giaTriNgay(Date.now());
  const con = toi ? Math.round((new Date(giaTriNgay(toi.bat_dau) + 'T12:00:00+07:00') - homNay) / 864e5) : 0;
  const tenGoi = tenDep(S.toi.ho_ten).split(/\s+/).pop();
  const gt = { ten: tenGoi, nha: S.toi.nha || '', gio: toi ? gio(toi.bat_dau) : '', noi: toi && toi.dia_diem ? toi.dia_diem : '', buoi: toi ? ngayGio(toi.bat_dau) : '', con: con >= 2 ? String(con) : '' };
  const ds = (coBuoi ? LOI_HOM_NAY : LOI_NGAY_THUONG).filter(c => (c.match(/\{(\w+)\}/g) || []).every(k => gt[k.slice(1, -1)]));
  const c = ds[bam((S.toi.id || '') + '|' + giaTriNgay(cn)) % ds.length];
  return c.replace(/\{(\w+)\}/g, (_, k) => gt[k]);
}


export async function manHomNay(vung) {
  const nam = namHoc();
  const [buoi, tb, doc, bai, khaoSat] = await Promise.all([
    S.db.dsBuoi(new Date(Date.now() - 6 * 3600e3).toISOString()),
    S.db.dsThongBao(), S.db.daDoc(S.toi.id), S.db.baiCuaToi().catch(() => []), khoiKhaoSat()
  ]);
  const toi = buoi[0];
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

  // Dải xanh đầu màn hình: tiêu đề là ngày (rà soát 22/11/2026), lời khích lệ đổi mỗi chủ nhật, dòng phụ là họ tên và nhà.
  const nha = S.toi.nha && NHA[S.toi.nha];
  const chuaNha = !nha && S.toi.cap === 'Junior';
  const moTa = [tenDep(S.toi.ho_ten), nha ? 'Nhà ' + S.toi.nha : null, S.toi.gen !== null && S.toi.gen !== undefined ? 'Gen ' + S.toi.gen : null, S.toi.cap, chuaNha ? 'chưa xếp nhà' : null].filter(Boolean).join(' · ');
  const conLai = (t) => { const p = Math.round((new Date(t) - Date.now()) / 60e3); if (p <= 0) return null; const g = Math.floor(p / 60); return 'Còn ' + (g ? g + ' giờ' : '') + (g && p % 60 ? ' ' : '') + (p % 60 ? (p % 60) + ' phút' : ''); };
  const ganBuoiToi = toi && Math.abs(new Date(toi.bat_dau) - Date.now()) < 4 * 3600e3;
  const coQuet = toi && (S.toi.la_phu_trach || (S.toi.buoi_diem_danh || []).includes(toi.id));
  const tuyenQuanMo = !!(S.caiDat.tuyen_quan && S.caiDat.tuyen_quan.mo === true);
  const oNhanh = (ten, icon, viec, so) => typeof viec === 'string'
    ? h('a', { class: 'o-nhanh', href: viec }, so ? h('span', { class: 'so-nho' }, so) : null, h('span', { class: 'bieu-tuong' }, bieuTuong(icon)), h('span', null, ten))
    : h('button', { class: 'o-nhanh', type: 'button', onclick: viec }, so ? h('span', { class: 'so-nho' }, so) : null, h('span', { class: 'bieu-tuong' }, bieuTuong(icon)), h('span', null, ten));
  // Một nút chính, nhiều nhất một nút phụ; "Chi tiết buổi, xin nghỉ" là dòng chữ.
  const nutBuoi = toi ? [
    ganBuoiToi ? h('button', { class: 'nut', type: 'button', onclick: moMaCuaToi }, bieuTuong('qr'), 'Mở mã điểm danh') : null,
    coQuet ? h('a', { class: 'nut' + (ganBuoiToi ? ' phu' : ''), href: '#quan-ly/buoi/' + toi.id }, bieuTuong('quet'), 'Quét điểm danh') : null
  ].filter(Boolean) : [];

  dat(vung,
    h('section', { class: 'hero-hom-nay' },
      h('div', { class: 'hero-dau' },
        h('img', { class: 'logo-trang', src: 'img/logo.webp', alt: 'Logo CLB Ngoại khoa Trưng Vương' }),
        h('span', { class: 'ten-dau' }, 'CLB Ngoại khoa Trưng Vương'),
        h('a', { href: '#ho-so', 'aria-label': 'Hồ sơ của tôi' }, anhDaiDien(S.toi))),
      h('h1', null, thuDai(Date.now()), ' ', ngayNgan(Date.now())),
      h('p', { class: 'loi-chao' }, loiChao(toi)),
      moTa ? h('div', { class: 'phu' }, moTa) : null),
    toi ? h('div', { class: 'the-buoi' },
      h('div', { class: 'dau-the' },
        h('span', { class: 'nhan-the' }, giaTriNgay(toi.bat_dau) === giaTriNgay(Date.now()) ? 'Buổi hôm nay' : 'Buổi sắp tới'),
        conLai(toi.bat_dau) && new Date(toi.bat_dau) - Date.now() < 24 * 3600e3 ? h('span', { class: 'the-nhan dung' }, conLai(toi.bat_dau)) : null),
      h('h2', null, toi.ten),
      h('div', { class: 'chi-tiet' },
        h('div', null, ngayGio(toi.bat_dau), toi.ket_thuc ? ' – ' + gio(toi.ket_thuc) : ''),
        toi.dia_diem ? h('div', null, toi.dia_diem) : null,
        toi.nhom_truc ? h('div', null, h('i', { class: 'cham-nha', style: NHA[toi.nhom_truc] ? `background:${NHA[toi.nhom_truc].mau}` : null }), 'Nhà trực: ', toi.nhom_truc) : null),
      nutBuoi.length ? h('div', { class: 'nut-buoi' + (nutBuoi.length === 2 ? ' hai' : '') }, nutBuoi) : null,
      h('button', { class: 'nut-chu lien-ket-buoi', type: 'button', onclick: () => suKienBuoi(toi) }, 'Chi tiết buổi, xin nghỉ ›'))
      : h('div', { class: 'the-buoi' }, h('div', { class: 'chi-tiet' }, 'Chưa có buổi sinh hoạt nào sắp tới.')),
    // Bốn việc hay dùng nằm cố định một chỗ. Khi thẻ buổi đã có nút "Mở mã điểm danh", ô đầu đổi thành Lịch (anh Long 22/11/2026).
    h('div', { class: 'luoi-nhanh' },
      ganBuoiToi ? oNhanh('Lịch', 'lich', '#lich') : oNhanh('Mã điểm danh', 'qr', moMaCuaToi),
      oNhanh('Điểm nhóm', 'sao', '#lich/diem-nhom'),
      oNhanh('Làm bài', 'test', '#post-test', baiMo.length || null),
      oNhanh('Gửi bài', 'gui', '#gui-bai')),
    // Khảo sát đang mở chưa gửi (migration 0021); quản trị, Ban cố vấn thấy thêm dòng kết quả.
    khaoSat,
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
