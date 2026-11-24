// Dùng chung cho mọi màn của đợt tập huấn: nhãn, vai trò trong đợt, thanh tiêu đề.
// Tách riêng để v-dot.js và v-ketqua.js không phải gọi chéo nhau.
import { S } from './state.js';
import { h, bieuTuong } from './ui.js';

export const TRANG_THAI = { soan: 'Đang soạn', mo: 'Đang mở', ket_thuc: 'Đã kết thúc' };
export const LOP_TT = { soan: 'cho', mo: 'dung', ket_thuc: '' };
export const VAI = { truong_ban: 'Trưởng ban', thu_ky: 'Thư ký', giang_vien: 'Tập huấn viên', diem_danh: 'Phụ trách điểm danh' };
export const PHAN = { ly_thuyet: 'Lý thuyết', thuc_hanh: 'Thực hành', luong_gia: 'Lượng giá', khac: 'Khác' };

// Mức hoàn thành, đúng thứ tự từ cao xuống thấp như hàm xet_mot_hv trong migration 0015.
export const MUC = {
  xuat_sac: ['Xuất sắc', 'dung'],
  hoan_thanh: ['Hoàn thành', 'dung'],
  hoan_thanh_ghi_chu: ['Hoàn thành có ghi chú', 'phep'],
  tham_du: ['Tham dự', 'tre'],
  chua_hoan_thanh: ['Chưa hoàn thành', 'vang']
};
export const LOAI_YC = { thac_mac: 'Thắc mắc', phan_hoi: 'Phản hồi', van_de: 'Vấn đề cần giúp' };
export const TT_YC = { moi: ['Mới', 'vang'], dang_xem: ['Đang xem', 'tre'], xong: ['Đã xong', 'dung'] };
export const LOAI_CAU = { thang5: 'Thang 1 đến 5', chon: 'Chọn một đáp án', chu: 'Viết chữ' };

export const icon = (t) => h('div', { class: 'bieu-tuong' }, bieuTuong(t));
export const thanh = (tieu, href = '#tap-huan', nhan = 'Tập huấn', phai = null) =>
  h('div', { class: 'thanh-nho' },
    h('div', { class: 'khoang' }, h('a', { class: 'nut-lui', href, style: 'text-decoration:none' }, '‹ ' + nhan)),
    h('h1', null, tieu), h('div', { class: 'khoang phai' }, phai));

// Vai trong đợt. Giữ đúng như các hàm trong Postgres, vì máy chủ mới là nơi quyết định.
const VAI_QUAN_LY = ['truong_ban', 'thu_ky'];
export const coVai = (dot, vai) => S.toi.la_quan_tri || (S.toi.btc_dot || []).some(b => b.dot_id === dot && vai.includes(b.vai));
export const laBtcQuanLy = (dot) => coVai(dot, VAI_QUAN_LY);
export const laGiangVien = (dot) => coVai(dot, ['truong_ban', 'thu_ky', 'giang_vien']);
export const laDiemDanh = (dot) => coVai(dot, ['truong_ban', 'thu_ky', 'diem_danh']);
export const thayDuocDot = (dot) => coVai(dot, Object.keys(VAI));

/* ---------- Ảnh nhận diện của đợt (migration 0023) ----------

   Mỗi đợt mang một bộ mặt riêng theo mùa: Ban Truyền thông làm ảnh theo bản "Yêu cầu ảnh nhận diện
   khóa học", thư ký đưa lên ở Tập huấn › đợt › Ảnh nhận diện. Học viên thấy khóa học của mình là
   một thẻ có ảnh nền, bấm vào là vào trang của khóa đó.
   d.nhan_dien = { the, dau, bieu_tuong, ve, moc, mau }: năm đường dẫn ảnh và một mã màu. Thiếu ô nào thì app
   tự lùi về nền màu, nên đợt chưa có ảnh vẫn hiện đủ thông tin.
   Cỡ ảnh ở đây phải khớp bản yêu cầu gửi Ban Truyền thông; đổi một bên thì đổi cả bên kia. */
export const ANH_DOT = {
  the: { ten: 'Ảnh thẻ khóa học', w: 1200, h: 600, chu: 'Thẻ trên màn hình Hôm nay của học viên. Góc trên bên phải để trống cho nhãn trạng thái.' },
  dau: { ten: 'Ảnh đầu trang khóa học', w: 1200, h: 400, chu: 'Dải ảnh trên cùng khi học viên mở khóa học. Không có thì app dùng ảnh thẻ.' },
  bieu_tuong: { ten: 'Biểu tượng khóa học', w: 512, h: 512, chu: 'Hình vuông nhỏ cạnh tên khóa. Không bắt buộc.' },
  ve: { ten: 'Ảnh nền vé điểm danh', w: 1080, h: 1350, chu: 'Nền tấm vé trong trang khóa học. 28% phía trên để lộ tựa đề; phần dưới bị thẻ tên và các ô đóng mộc che, chỉ nên là họa tiết.' },
  moc: { ten: 'Con dấu điểm danh', w: 600, h: 600, chu: 'Hình con mộc đóng vào ô khi học viên đã điểm danh, nền trong suốt (PNG). Không có thì app dùng con dấu CLB mặc định.' }
};
export const MAU_MAC_DINH = '#1c6b3f';
export const nhanDien = (d) => (d && d.nhan_dien) || {};
const kieuMau = (nd) => `--mau-khoa:${nd.mau || MAU_MAC_DINH}`;
/** Giữ cụm năm như 2026–2027 trên một dòng (U+2060 không cho ngắt dòng sau gạch). */
export const giuNam = (t) => String(t).replace(/(\d)([–-])(\d)/g, '$1$2\u2060$3');

/** Thẻ khóa học có ảnh nền. Tên khóa luôn in bằng chữ dưới ảnh, nên ảnh có hay không có chữ đều đọc được. */
export function theKhoaHoc(d, { nhanTT, lopTT, phu, href } = {}) {
  const nd = nhanDien(d);
  return h(href ? 'a' : 'div', {
    class: 'the-khoa' + (d.trang_thai === 'ket_thuc' ? ' xong' : ''), href, style: kieuMau(nd),
    'aria-label': [d.ten, nhanTT, phu].filter(Boolean).join(', ')
  },
    h('div', { class: 'the-khoa-anh' },
      nd.the ? h('img', { src: nd.the, alt: '', decoding: 'async' }) : h('div', { class: 'the-khoa-nen' }, h('span', null, giuNam(d.ten))),
      nhanTT ? h('span', { class: 'the-khoa-nhan ' + (lopTT || '') }, nhanTT) : null),
    h('div', { class: 'the-khoa-chan' },
      nd.bieu_tuong ? h('img', { class: 'the-khoa-bt', src: nd.bieu_tuong, alt: '' }) : null,
      h('div', { class: 'the-khoa-chu' }, h('div', { class: 'ten' }, giuNam(d.ten)), phu ? h('div', { class: 'phu' }, phu) : null),
      href ? h('span', { class: 'the-khoa-mui', 'aria-hidden': 'true' }, '›') : null));
}

/** Dải ảnh đầu trang khóa học; thiếu ảnh đầu trang thì dùng ảnh thẻ, thiếu cả hai thì nền màu. */
export function anhDauKhoa(d) {
  const nd = nhanDien(d), src = nd.dau || nd.the;
  return h('div', { class: 'khoa-dau', style: kieuMau(nd) },
    src ? h('img', { src, alt: '' }) : h('div', { class: 'the-khoa-nen' }, h('span', null, giuNam(d.ten))));
}

/** Bọc một màn trong màu nhấn của khóa: nút và nhãn trong màn đổi theo mùa. */
export const boKhoa = (d, ...con) => h('div', { class: 'trang-khoa', style: kieuMau(nhanDien(d)) }, ...con);

/* ---------- Vé điểm danh ----------

   Các khóa trước in vé giấy có ô cho từng buổi; điểm danh xong thì đóng mộc vào ô đó. Trong app,
   vé nằm ở trang khóa học: nền là ảnh vé của mùa, thẻ tên học viên, mỗi buổi một ô, buổi đã điểm danh
   hiện con mộc kèm ngày. Chủ yếu để đẹp: số liệu chuyên cần thật vẫn ở tab Lịch học và Kết quả.
   Gom ô: các ca cùng nhom_chon (học viên chọn một ca) là một ô; buổi khác mỗi buổi một ô. */
const F_MOC = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: '2-digit' });
const ngayMoc = (t) => F_MOC.format(new Date(t)).replace(/\//g, '.');

export function oTrenVe(buoi) {
  const nhom = [], theoKhoa = new Map();
  buoi.slice().sort((a, b) => new Date(a.bat_dau) - new Date(b.bat_dau)).forEach(b => {
    const k = b.nhom_chon ? 'n:' + b.nhom_chon : 'b:' + b.id;
    if (!theoKhoa.has(k)) { const g = { khoa: k, phan: b.phan, ten: b.nhom_chon || b.ten, buoi: [] }; theoKhoa.set(k, g); nhom.push(g); }
    theoKhoa.get(k).buoi.push(b);
  });
  return nhom.map((g, i) => {
    const da = g.buoi.filter(b => b.toi_vao).sort((a, b) => new Date(a.toi_vao) - new Date(b.toi_vao))[0];
    // Tên phần (Lý thuyết, Thực hành…) chỉ hai âm tiết: nối bằng dấu cách không ngắt để không xuống hàng giữa từ ghép.
    const nhan = g.phan && g.phan !== 'khac' ? PHAN[g.phan].replace(/ /g, ' ') : g.ten;
    return { khoa: g.khoa, so: i + 1, nhan, da: da ? da.toi_vao : null, buoi_id: da ? da.id : null };
  });
}

/** Con dấu CLB vẽ bằng SVG: hai vòng tròn, tên CLB chạy quanh, chữ "ĐÃ DỰ" và ngày, nét hơi loang như mực thật. */
let soMoc = 0;
function mocMacDinh(luc) {
  const id = 'moc' + (++soMoc);
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 120 120'); s.setAttribute('class', 'moc-svg'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML =
    `<defs><filter id="${id}-m" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${soMoc * 7}" result="n"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="2.4"/></filter>` +
    `<path id="${id}-v" d="M60,60 m-41,0 a41,41 0 1,1 82,0 a41,41 0 1,1 -82,0"/></defs>` +
    `<g filter="url(#${id}-m)"><g fill="none" stroke="currentColor"><circle cx="60" cy="60" r="55" stroke-width="4.5"/>` +
    `<circle cx="60" cy="60" r="48" stroke-width="1.6"/><circle cx="60" cy="60" r="31" stroke-width="1.6"/></g>` +
    `<g fill="currentColor" font-family="system-ui, 'Segoe UI', sans-serif" font-weight="700">` +
    `<text font-size="8.6" letter-spacing="1.25"><textPath href="#${id}-v">CLB NGOẠI KHOA TRƯNG VƯƠNG ★ NKTV ★</textPath></text>` +
    `<text x="60" y="59" text-anchor="middle" font-size="15" font-weight="800">ĐÃ DỰ</text>` +
    `<text x="60" y="74" text-anchor="middle" font-size="10">${ngayMoc(luc)}</text></g></g>`;
  return s;
}

/** Mộc vừa có thì đập xuống một lần (nhớ trên máy theo buổi), mộc cũ nằm yên. */
function mocMoi(buoiId) {
  if (!buoiId) return false;
  try {
    const k = 'nktv-moc-' + buoiId;
    if (localStorage.getItem(k)) return false;
    localStorage.setItem(k, '1');
    return true;
  } catch (e) { return false; }
}

/**
 * Vé điểm danh của một khóa.
 * nguoi: { ho_ten, ma, lop, mssv } (thiếu ô nào hiện gạch ngang). xemThu: không ghi nhớ mộc, không đập mộc.
 */
export function veDiemDanh(d, buoi, nguoi, { xemThu = false } = {}) {
  const nd = nhanDien(d);
  const o = oTrenVe(buoi);
  const dong = (nhan, gt) => h('div', { class: 've-dong' }, h('span', { class: 've-nhan' }, nhan), h('span', { class: 've-gt' }, gt || '—'));
  return h('div', { class: 've', style: kieuMau(nd), role: 'group', 'aria-label': `Vé điểm danh ${d.ten}: ${o.filter(x => x.da).length}/${o.length} buổi đã có mộc` },
    nd.ve ? h('img', { class: 've-nen', src: nd.ve, alt: '' }) : h('div', { class: 've-nen ve-nen-mau' }, h('span', null, giuNam(d.ten))),
    h('div', { class: 've-dau' }),
    h('div', { class: 've-xe', 'aria-hidden': 'true' }),
    h('div', { class: 've-than' },
      h('div', { class: 've-the' },
        dong('Họ tên', nguoi.ho_ten), dong('Lớp', nguoi.lop), dong('MSSV', nguoi.mssv), dong('Mã học viên', nguoi.ma)),
      o.length ? h('div', { class: 've-o-hang' }, o.map(x => {
        const dap = x.da && !xemThu && mocMoi(x.buoi_id);
        const moc = !x.da ? null
          : nd.moc ? h('img', { class: 've-moc' + (dap ? ' dap' : ''), src: nd.moc, alt: '' })
          : h('div', { class: 've-moc' + (dap ? ' dap' : '') }, mocMacDinh(x.da));
        if (moc) moc.style.setProperty('--xoay', (((x.so * 37) % 25) - 12) + 'deg');
        return h('div', { class: 've-o' + (x.da ? ' da' : '') },
          h('div', { class: 've-o-khung' }, moc),
          h('div', { class: 've-o-so' }, `Buổi ${x.so}`),
          h('div', { class: 've-o-nhan' }, x.nhan),
          h('div', { class: 've-o-ngay' }, x.da ? ngayMoc(x.da) : 'Chưa điểm danh'));
      })) : h('div', { class: 've-trong' }, 'Khóa này chưa có lịch, ô đóng mộc sẽ hiện khi Ban tổ chức thêm buổi.')));
}
