// Tập huấn: đợt, Ban tổ chức, nạp danh sách học viên, cấp mã kích hoạt (migration 0013);
// buổi của đợt, điểm danh vào và ra, đăng ký chỗ, tài liệu, checklist, câu hỏi, thông báo (0014).
// Mọi việc đi qua hàm trong Postgres; trình duyệt không đọc thẳng bảng học viên.
import { S } from './state.js';
import {
  h, dat, dong, nhom, moSheet, thu, toast, bieuTuong, gio, ngay, ngayGio, soLieu, rong,
  oNhap, oChon, oBat, xacNhan, taiCSV, boDau, giaTriNgay, giaTriGio, tuNhap, dauNgay, moTaTV
} from './ui.js';
import { manMotBuoi } from './v-quanly.js';
import { manCauHoi, docMucChecklist, vietMucChecklist, soMucChecklist, moChecklist, hangTaiLieu } from './v-tronggio.js';

const icon = (t) => h('div', { class: 'bieu-tuong' }, bieuTuong(t));
const thanh = (tieu, href = '#tap-huan', nhan = 'Tập huấn', phai = null) =>
  h('div', { class: 'thanh-nho' }, h('div', { class: 'khoang' }, h('a', { class: 'nut-lui', href, style: 'text-decoration:none' }, '‹ ' + nhan)), h('h1', null, tieu), h('div', { class: 'khoang phai' }, phai));

const TRANG_THAI = { soan: 'Đang soạn', mo: 'Đang mở', ket_thuc: 'Đã kết thúc' };
const LOP_TT = { soan: 'cho', mo: 'dung', ket_thuc: '' };
const VAI = { truong_ban: 'Trưởng ban', thu_ky: 'Thư ký', giang_vien: 'Tập huấn viên', diem_danh: 'Phụ trách điểm danh' };
// Chỉ trưởng ban và thư ký nạp được danh sách và cấp được mã (hàm la_btc_dot trong Postgres).
const VAI_QUAN_LY = ['truong_ban', 'thu_ky'];

const khoang = (d) => {
  if (!d.bat_dau && !d.ket_thuc) return 'Chưa ghi ngày';
  if (d.bat_dau && d.ket_thuc) return ngay(d.bat_dau + 'T12:00:00+07:00') + ' – ' + ngay(d.ket_thuc + 'T12:00:00+07:00');
  return ngay((d.bat_dau || d.ket_thuc) + 'T12:00:00+07:00');
};
const laBtcQuanLy = (dot) => S.toi.la_quan_tri ||
  (S.toi.btc_dot || []).some(b => b.dot_id === dot && VAI_QUAN_LY.includes(b.vai));
const coVai = (dot, vai) => S.toi.la_quan_tri || (S.toi.btc_dot || []).some(b => b.dot_id === dot && vai.includes(b.vai));
// Tài liệu, checklist, câu hỏi: trưởng ban, thư ký và tập huấn viên. Điểm danh: thêm phụ trách điểm danh.
const laGiangVien = (dot) => coVai(dot, ['truong_ban', 'thu_ky', 'giang_vien']);
const laDiemDanh = (dot) => coVai(dot, ['truong_ban', 'thu_ky', 'diem_danh']);
const thayDuocDot = (dot) => coVai(dot, Object.keys(VAI));

export const PHAN = { ly_thuyet: 'Lý thuyết', thuc_hanh: 'Thực hành', luong_gia: 'Lượng giá', khac: 'Khác' };

export async function tuyenTapHuan(vung, con) {
  const [a, b, c] = con;
  if (a && b === 'nap') return manNapDS(vung, a);
  if (a && b === 'hoc-vien') return manHocVien(vung, a);
  if (a && b === 'buoi' && c) return manBuoiDot(vung, a, c);
  if (a && b === 'buoi') return manDsBuoiDot(vung, a);
  if (a && b === 'tai-lieu') return manTaiLieuDot(vung, a);
  if (a && b === 'checklist') return manChecklistDot(vung, a);
  if (a && b === 'thong-bao') return manThongBaoDot(vung, a);
  if (a && b === 'cau-hoi') return manCauHoiDot(vung, a, c);
  if (a) return manMotDot(vung, a);
  return manTapHuan(vung);
}

/* ---------- Danh sách đợt ---------- */
export async function manTapHuan(vung) {
  const ds = await S.db.dsDot();
  const lai = () => manTapHuan(vung);
  const nhanSo = (d) => `${d.so_hoc_vien} học viên · ${d.so_kich_hoat} đã kích hoạt`;
  const nhomTT = (tt) => {
    const c = ds.filter(d => d.trang_thai === tt);
    return c.length ? nhom(TRANG_THAI[tt], c.map(d => dong({
      tieu: d.ten, phu: `${d.ma} · ${khoang(d)} · ${nhanSo(d)}`,
      sau: d.la_btc ? null : h('span', { class: 'the-nhan' }, 'Xem'),
      href: '#tap-huan/' + d.id
    }))) : null;
  };
  dat(vung,
    h('h1', { class: 'tieu-de-lon' }, 'Tập huấn'),
    S.toi.la_quan_tri ? h('button', { class: 'nut day', type: 'button', style: 'margin-bottom:22px', onclick: () => suaDot(null, lai) }, 'Tạo đợt mới') : null,
    ds.length ? [nhomTT('mo'), nhomTT('soan'), nhomTT('ket_thuc')]
      : rong(S.toi.la_quan_tri ? 'Chưa có đợt nào. Tạo đợt rồi phân vai Ban tổ chức, sau đó thư ký nạp danh sách học viên.' : 'Chưa có đợt nào bạn tham gia tổ chức.'));
}

/* ---------- Tạo, sửa đợt ---------- */
function suaDot(d, sauKhi) {
  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const v = f.elements;
      const ma = v.ma.value.trim().toUpperCase(), ten = v.ten.value.trim();
      if (!ma || !ten) return toast('Cần mã đợt và tên đợt.', true);
      if (v.bd.value && v.kt.value && v.kt.value < v.bd.value) return toast('Ngày kết thúc trước ngày bắt đầu.', true);
      const o = { ma, ten, nam_hoc: v.nh.value.trim(), mo_ta: v.mt.value.trim(), bat_dau: v.bd.value, ket_thuc: v.kt.value };
      const id = await thu(() => S.db.luuDot(d ? d.id : null, o), 'Đã lưu đợt');
      if (id) { s.dong(); sauKhi(typeof id === 'string' ? id : null); }
    }
  },
    h('div', { class: 'nhom' },
      oNhap('Mã đợt', { name: 'ma', value: d ? d.ma : '', placeholder: 'XQ2627', autocapitalize: 'characters', required: true, disabled: !!d }),
      oNhap('Tên đợt', { name: 'ten', value: d ? d.ten : '', placeholder: 'Tập huấn X-quang bụng 2026–2027', required: true }),
      oNhap('Năm học', { name: 'nh', value: d ? d.nam_hoc : '', placeholder: '2026–2027' }),
      oNhap('Ngày bắt đầu', { name: 'bd', type: 'date', value: d ? d.bat_dau : '' }),
      oNhap('Ngày kết thúc', { name: 'kt', type: 'date', value: d ? d.ket_thuc : '' }),
      oNhap('Mô tả', { the: 'textarea', name: 'mt', value: d ? d.mo_ta : '', rows: 3 })),
    d ? null : h('p', { class: 'chu-nho', style: 'margin-bottom:14px' }, 'Mã đợt không sửa được sau khi tạo, vì mã học viên và danh sách gắn theo đợt.'),
    h('button', { class: 'nut day', type: 'submit' }, 'Lưu'));
  const s = moSheet({ tieuDe: d ? 'Sửa đợt' : 'Đợt mới', noiDung: f });
}

/* ---------- Một đợt ---------- */
async function manMotDot(vung, id) {
  const ds = await S.db.dsDot();
  const d = ds.find(x => x.id === id);
  if (!d) return dat(vung, thanh('Đợt', '#tap-huan'), rong('Không tìm thấy đợt này, hoặc bạn không còn trong Ban tổ chức.'));
  const lai = () => manMotDot(vung, id);
  const ql = laBtcQuanLy(id);
  const [btc, tv, buoi] = await Promise.all([
    S.db.btcCuaDot(id).catch(() => []),
    S.toi.xem_duoc_ten ? S.db.dsThanhVien().catch(() => []) : [],
    S.db.dsBuoiDot(id).catch(() => [])
  ]);
  // Người không được xem danh sách thành viên thì chỉ thấy số người giữ vai, không thấy tên.
  const tenCua = (tvId) => { const t = tv.find(x => x.id === tvId); return t ? t.ho_ten : null; };
  const theoVai = Object.keys(VAI).map(v => {
    const nguoi = btc.filter(b => b.vai === v);
    if (!nguoi.length) return null;
    const ten = nguoi.map(b => tenCua(b.thanh_vien_id)).filter(Boolean);
    return `${VAI[v]}: ${ten.length ? ten.join(', ') : nguoi.length + ' người'}`;
  }).filter(Boolean);

  const nay = Date.now() + (S.lech || 0);
  const gan = buoi.filter(b => !b.dong
    && nay >= new Date(b.bat_dau).getTime() - 3600e3
    && nay <= new Date(b.ket_thuc || new Date(b.bat_dau).getTime() + 4 * 3600e3).getTime() + 3600e3)
    .sort((x, y) => new Date(x.bat_dau) - new Date(y.bat_dau))[0];

  const doiTrangThai = async () => {
    const chon = { soan: 'mo', mo: 'ket_thuc', ket_thuc: 'mo' }[d.trang_thai];
    const chu = chon === 'mo'
      ? 'Học viên trong đợt dùng được app: điểm danh, xem lịch, đăng ký buổi.'
      : 'Tài khoản học viên của đợt chuyển sang chỉ xem lại kết quả và giấy chứng nhận. Mở lại đợt là dùng được tiếp.';
    if (!await xacNhan({ tieuDe: `Chuyển sang "${TRANG_THAI[chon]}"?`, chu, nut: TRANG_THAI[chon] })) return;
    if (await thu(() => S.db.luuDot(id, { trang_thai: chon }), 'Đã chuyển sang ' + TRANG_THAI[chon])) lai();
  };

  dat(vung,
    thanh(d.ma, '#tap-huan', 'Tập huấn', ql ? h('button', { class: 'nut-lui', type: 'button', onclick: () => suaDot(d, lai) }, 'Sửa') : null),
    h('p', { class: 'tieu-de-phu', style: 'margin-top:4px;text-align:center' }, d.ten),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:18px' }, khoang(d), ' · ', h('span', { class: 'the-nhan ' + LOP_TT[d.trang_thai] }, TRANG_THAI[d.trang_thai])),
    soLieu([
      { so: d.so_hoc_vien, ten: 'Học viên trong đợt' },
      { so: d.so_kich_hoat, ten: 'Đã kích hoạt', lop: 'dung' },
      { so: d.so_hoc_vien - d.so_kich_hoat, ten: 'Chưa kích hoạt', lop: d.so_hoc_vien - d.so_kich_hoat ? 'tre' : '' }
    ]),
    // Buổi đang tới gần: từ 1 giờ trước giờ bắt đầu tới 1 giờ sau giờ kết thúc, để Ban tổ chức
    // vào thẳng việc đang phải làm chứ không phải đi tìm trong danh sách.
    gan ? h('div', { class: 'the-buoi' },
      h('div', { class: 'nhan' }, 'Buổi đang tới gần'),
      h('h2', null, gan.ten),
      h('div', { class: 'chi-tiet' }, [ngayGio(gan.bat_dau), gan.phan ? PHAN[gan.phan] : null, gan.dia_diem].filter(Boolean).join(' · ')),
      h('div', { class: 'hang-nut' },
        laDiemDanh(id) ? h('a', { class: 'nut', href: `#tap-huan/${id}/buoi/${gan.id}` }, bieuTuong('quet'), 'Điểm danh') : null,
        h('a', { class: 'nut phu', href: `#tap-huan/${id}/cau-hoi/${gan.id}` }, 'Câu hỏi trong giờ'))) : null,
    d.trang_thai === 'ket_thuc' ? h('div', { class: 'bang-tin' }, 'Đợt đã kết thúc: tài khoản học viên chỉ còn xem lại kết quả và giấy chứng nhận.') : null,
    // Chỉ trưởng ban, thư ký và quản trị đọc được danh sách học viên (hàm ds_hoc_vien_dot).
    // Người giữ vai khác thấy dòng giải thích, không thấy danh sách rỗng rồi tưởng đợt chưa có ai.
    nhom('Học viên',
      ql ? dong({ tieu: 'Nạp danh sách', phu: 'Dán bảng đăng ký, app xem trước rồi mới ghi', truoc: icon('don'), href: `#tap-huan/${id}/nap` }) : null,
      ql ? dong({ tieu: 'Danh sách học viên', phu: 'Xem, cấp mã kích hoạt, xuất bảng cho thư ký gửi', truoc: icon('nguoi'), href: `#tap-huan/${id}/hoc-vien` })
        : dong({ tieu: 'Danh sách học viên', phu: 'Chỉ trưởng ban, thư ký và quản trị xem được danh sách và thông tin học viên', truoc: icon('nguoi'), muiTen: false })),
    nhom('Trong buổi',
      dong({ tieu: 'Buổi và điểm danh', truoc: icon('lich'), href: `#tap-huan/${id}/buoi`,
        phu: buoi.length ? `${buoi.length} buổi · ${buoi.filter(b => b.dong).length} đã đóng` : 'Chưa có buổi nào' }),
      dong({ tieu: 'Câu hỏi trong giờ', phu: 'Học viên gửi câu hỏi, có thể ẩn tên trên màn hình', truoc: icon('don'), href: `#tap-huan/${id}/cau-hoi` }),
      laGiangVien(id) ? dong({ tieu: 'Tài liệu', phu: 'Đường dẫn Drive, mở theo giờ hoặc sau khi điểm danh', truoc: icon('test'), href: `#tap-huan/${id}/tai-lieu` }) : null,
      laGiangVien(id) ? dong({ tieu: 'Checklist', phu: 'Học viên tick trong giờ, in ra PDF được', truoc: icon('phieu'), href: `#tap-huan/${id}/checklist` }) : null,
      ql ? dong({ tieu: 'Thông báo của đợt', phu: 'Chỉ học viên trong đợt và Ban tổ chức thấy', truoc: icon('chuong'), href: `#tap-huan/${id}/thong-bao` }) : null),
    nhom('Ban tổ chức',
      dong({ tieu: 'Phân vai', phu: theoVai.length ? theoVai.join(' · ') : 'Chưa phân vai ai', truoc: icon('khoa'),
        onclick: S.toi.la_quan_tri || (S.toi.btc_dot || []).some(b => b.dot_id === id && b.vai === 'truong_ban') ? () => phanVai(id, btc, tv, lai) : undefined,
        muiTen: false })),
    ql ? h('button', { class: 'nut ' + (d.trang_thai === 'mo' ? 'phu' : 'day'), type: 'button', style: 'margin-bottom:24px', onclick: doiTrangThai },
      d.trang_thai === 'soan' ? 'Mở đợt cho học viên' : d.trang_thai === 'mo' ? 'Kết thúc đợt' : 'Mở lại đợt') : null);
}

/* ---------- Phân vai Ban tổ chức ---------- */
function phanVai(id, btc, tv, sauKhi) {
  if (!tv.length) return toast('Cần quyền xem danh sách thành viên để phân vai.', true);
  // Một người có thể giữ nhiều vai; mỗi dòng là một cặp người–vai.
  const giu = new Map();
  btc.forEach(b => giu.set(b.thanh_vien_id + '|' + b.vai, true));
  const hd = tv.filter(t => t.hoat_dong).sort((x, y) => x.ho_ten.localeCompare(y.ho_ten, 'vi'));
  const hang = hd.map(t => {
    const o = h('div', { class: 'o' },
      h('span', null, t.ho_ten, h('small', { style: 'display:block;color:var(--chu-2);font-size:.8125rem' }, [t.ma, moTaTV(t)].filter(Boolean).join(' · '))),
      h('div', { class: 'chon-ngang', style: 'padding:6px 0 0;flex-wrap:wrap' }, Object.entries(VAI).map(([v, ten]) =>
        h('button', {
          class: 'vien', type: 'button', 'aria-pressed': giu.has(t.id + '|' + v) ? 'true' : 'false',
          onclick: (e) => {
            const k = t.id + '|' + v;
            if (giu.has(k)) giu.delete(k); else giu.set(k, true);
            e.currentTarget.setAttribute('aria-pressed', giu.has(k) ? 'true' : 'false');
          }
        }, ten))));
    o.dataset.tim = boDau(t.ho_ten + ' ' + t.ma + ' ' + (t.nha || ''));
    return o;
  });
  const s = moSheet({
    tieuDe: 'Ban tổ chức đợt',
    noiDung: h('div', null,
      h('p', { class: 'chu-nho', style: 'margin-bottom:12px' }, 'Trưởng ban và thư ký nạp được danh sách, cấp được mã và sửa được đợt. Tập huấn viên và phụ trách điểm danh chỉ xem danh sách.'),
      h('input', { class: 'tim', type: 'search', placeholder: 'Tìm tên, mã, nhà…', 'aria-label': 'Tìm thành viên', oninput: (e) => { const k = boDau(e.target.value); hang.forEach(o => { o.hidden = !!k && !o.dataset.tim.includes(k); }); } }),
      h('div', { class: 'nhom' }, hang),
      h('button', { class: 'nut day', type: 'button', onclick: async () => {
        const p = [...giu.keys()].map(k => { const [thanh_vien_id, vai] = k.split('|'); return { thanh_vien_id, vai }; });
        if (await thu(() => S.db.datBtcDot(id, p), 'Đã lưu Ban tổ chức')) { s.dong(); sauKhi(); }
      } }, 'Lưu'))
  });
}

/* ---------- Nạp danh sách ---------- */
const COT = [
  ['ho_ten', 'Họ và tên', ['hoten', 'hovaten', 'ten', 'name', 'fullname']],
  ['email', 'Email', ['email', 'mail', 'thudientu', 'diachiemail', 'emailaddress']],
  ['sdt', 'Số điện thoại', ['sdt', 'sodienthoai', 'dienthoai', 'phone', 'dt']],
  ['ngay_sinh', 'Ngày sinh', ['ngaysinh', 'ns', 'dob', 'birthday']],
  ['gioi_tinh', 'Giới tính', ['gioitinh', 'gender', 'phai']],
  ['truong', 'Trường', ['truong', 'truonghoc', 'school']],
  ['nganh', 'Ngành', ['nganh', 'nganhhoc', 'major']],
  ['nam_hoc', 'Năm học', ['namhoc', 'nam', 'year', 'khoa']],
  ['mssv', 'MSSV', ['mssv', 'masinhvien', 'studentid', 'ma']],
  ['lop', 'Lớp', ['lop', 'class']]
];
const KEY = (s) => boDau(s).replace(/[^a-z0-9]/g, '');

/** Tách bảng dán hoặc CSV: ưu tiên tab, không có tab thì dùng dấu phẩy hoặc chấm phẩy. */
function tachBang(chu) {
  const dong0 = String(chu || '').replace(/\r/g, '').split('\n').filter(x => x.trim() !== '');
  if (!dong0.length) return [];
  const dauCot = dong0[0].includes('\t') ? '\t' : (dong0[0].match(/;/g) || []).length > (dong0[0].match(/,/g) || []).length ? ';' : ',';
  return dong0.map(l => tachDong(l, dauCot));
}
function tachDong(l, d) {
  if (d === '\t') return l.split('\t').map(x => x.trim());
  const o = []; let cur = '', trongNgoac = false;
  for (let i = 0; i < l.length; i++) {
    const c = l[i];
    if (c === '"') { if (trongNgoac && l[i + 1] === '"') { cur += '"'; i++; } else trongNgoac = !trongNgoac; }
    else if (c === d && !trongNgoac) { o.push(cur.trim()); cur = ''; }
    else cur += c;
  }
  o.push(cur.trim());
  return o;
}
/** Dò tên cột ở dòng đầu; không nhận ra cột nào thì coi dòng đầu là dữ liệu và xếp theo thứ tự mẫu. */
function doCot(bang) {
  const dau = bang[0].map(KEY);
  const map = {};
  let nhan = 0;
  dau.forEach((k, i) => {
    for (const [ten, , bi] of COT) if (!(ten in map) && bi.includes(k)) { map[ten] = i; nhan++; break; }
  });
  if (nhan >= 2) return { map, tuDong: 1 };
  const m2 = {};
  COT.forEach(([ten], i) => { if (i < bang[0].length) m2[ten] = i; });
  return { map: m2, tuDong: 0, khongCoDau: true };
}
export function docDanhSach(chu) {
  const bang = tachBang(chu);
  if (!bang.length) return { ds: [], khongCoDau: false };
  const { map, tuDong, khongCoDau } = doCot(bang);
  const ds = [];
  for (let i = tuDong; i < bang.length; i++) {
    const r = bang[i];
    if (!r.some(x => x !== '')) continue;
    const o = { dong: String(i + 1) };
    for (const [ten] of COT) o[ten] = ten in map ? (r[map[ten]] || '') : '';
    ds.push(o);
  }
  return { ds, khongCoDau: !!khongCoDau, coCot: Object.keys(map) };
}

const NHAN_TT = {
  moi: ['Mới', 'dung'], da_co_tai_khoan: ['Đã có tài khoản', 'phep'], da_trong_dot: ['Đã trong đợt', 'cho'], loi: ['Lỗi', 'vang']
};

async function manNapDS(vung, id) {
  const ds = await S.db.dsDot();
  const d = ds.find(x => x.id === id);
  if (!d) return dat(vung, thanh('Nạp danh sách', '#tap-huan'), rong('Không tìm thấy đợt này.'));
  if (!laBtcQuanLy(id)) return dat(vung, thanh('Nạp danh sách', '#tap-huan/' + id, d.ma), rong('Chỉ trưởng ban và thư ký của đợt nạp được danh sách.'));

  const oDan = oNhap('Dán bảng danh sách vào đây', { the: 'textarea', rows: 8, placeholder: 'Dán từ Excel hoặc Google Sheet, gồm cả dòng tên cột.' });
  const o = oDan.querySelector('textarea');
  const tep = h('input', { type: 'file', accept: '.csv,.txt,text/csv,text/plain', hidden: true, onchange: async (e) => {
    const f = e.target.files[0]; if (!f) return;
    o.value = await f.text(); e.target.value = ''; xemTruoc();
  } });
  const vungKQ = h('div');
  let dsGui = [];

  const veKQ = (kq, daGhi) => {
    const dem = kq.dem;
    const so = [
      { so: dem.moi, ten: 'Mới', lop: 'dung' },
      { so: dem.da_co_tai_khoan, ten: 'Đã có tài khoản', lop: 'phep' },
      { so: dem.da_trong_dot, ten: 'Đã trong đợt', lop: 'tre' },
      { so: dem.loi, ten: 'Lỗi', lop: dem.loi ? 'vang' : '' }
    ];
    const hang = kq.ds.map(r => {
      const [nhan, lop] = NHAN_TT[r.tinh_trang] || ['', ''];
      return dong({
        tieu: r.ho_ten || '(chưa có tên)',
        phu: [r.email || 'chưa có email', r.ly_do, daGhi && r.ma ? 'Mã ' + r.ma : null].filter(Boolean).join(' · '),
        sau: h('span', { class: 'the-nhan ' + lop }, nhan), muiTen: false
      });
    });
    dat(vungKQ,
      h('h2', { class: 'nhan-nhom', style: 'margin-top:4px' }, daGhi ? 'Đã ghi' : 'Xem trước · chưa ghi gì'),
      soLieu(so),
      dem.loi ? h('div', { class: 'bang-tin' }, 'Dòng lỗi sẽ bị bỏ qua. Sửa trong bảng gốc rồi dán lại nếu cần.') : null,
      !daGhi && (dem.moi || dem.da_co_tai_khoan)
        ? h('button', { class: 'nut day', type: 'button', style: 'margin-bottom:18px', onclick: async () => {
            if (!await xacNhan({
              tieuDe: `Ghi ${dem.moi + dem.da_co_tai_khoan} học viên vào đợt?`,
              chu: `${dem.moi} người được tạo tài khoản mới kèm mã kích hoạt, ${dem.da_co_tai_khoan} người đã học đợt trước chỉ thêm vào đợt này và giữ nguyên mật khẩu cũ.`,
              nut: 'Ghi vào đợt'
            })) return;
            const kq2 = await thu(() => S.db.napDanhSachHV(id, dsGui, true), 'Đã ghi danh sách');
            if (kq2) { veKQ(kq2, true); hienMaHV(kq2.ds, d); }
          } }, `Ghi ${dem.moi + dem.da_co_tai_khoan} người vào đợt`)
        : null,
      daGhi ? h('div', { class: 'hang-nut', style: 'margin-bottom:18px' },
        h('button', { class: 'nut phu', type: 'button', onclick: () => hienMaHV(kq.ds, d) }, 'Xem lại bảng gửi học viên'),
        h('a', { class: 'nut phu', href: `#tap-huan/${id}/hoc-vien`, style: 'text-decoration:none;text-align:center' }, 'Danh sách học viên')) : null,
      h('div', { class: 'nhom' }, hang));
    vungKQ.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const xemTruoc = async () => {
    const { ds: hang, khongCoDau } = docDanhSach(o.value);
    if (!hang.length) return toast('Chưa có dòng nào đọc được.', true);
    if (hang.length > 1000) return toast('Mỗi lần nạp tối đa 1000 dòng. Chia nhỏ bảng.', true);
    if (khongCoDau) toast('Không nhận ra dòng tên cột, app đọc theo thứ tự cột mẫu.');
    dsGui = hang;
    const kq = await thu(() => S.db.napDanhSachHV(id, hang, false));
    if (kq) veKQ(kq, false);
  };

  dat(vung,
    thanh('Nạp danh sách', '#tap-huan/' + id, d.ma),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:16px' }, d.ten),
    h('div', { class: 'bang-tin xanh' }, 'Cột theo mẫu: ', COT.map(c => c[1]).join(' · '), '. App tự dò tên cột nên thứ tự khác vẫn được; chỉ email là bắt buộc.'),
    h('div', { class: 'nhom' }, oDan),
    h('div', { class: 'hang-nut', style: 'margin-bottom:8px' },
      h('button', { class: 'nut phu', type: 'button', onclick: () => tep.click() }, 'Chọn tệp CSV'),
      h('button', { class: 'nut', type: 'button', onclick: xemTruoc }, 'Xem trước')),
    tep,
    h('p', { class: 'chu-nho', style: 'margin-bottom:22px' }, 'Xem trước không ghi gì vào cơ sở dữ liệu. Tên tự viết hoa đầu chữ, email đổi thành chữ thường, số điện thoại chuẩn hóa về dạng 0…'),
    vungKQ);
}

/* ---------- Bảng gửi học viên: mã kích hoạt chỉ hiện một lần ---------- */
function hienMaHV(ds, d) {
  const co = (ds || []).filter(r => r.tinh_trang === 'moi' || r.tinh_trang === 'da_co_tai_khoan');
  if (!co.length) return;
  const ghiChu = (r) => r.ma_kich_hoat ? '' : 'Đã có tài khoản, dùng mật khẩu cũ';
  const appUrl = (window.NKTV_CONFIG && window.NKTV_CONFIG.appUrl) || location.origin + location.pathname;
  const inPhieu = () => {
    const the = h('div', { class: 'trang-in' }, h('div', { class: 'in-luoi', style: 'grid-template-columns:repeat(2,1fr)' }, co.map(r => h('div', { class: 'in-phieu' },
      h('b', null, r.ho_ten), h('br'), d.ten, h('br'),
      'Mã học viên: ', h('span', { class: 'ma' }, r.ma), h('br'),
      r.ma_kich_hoat ? ['Mã kích hoạt: ', h('span', { class: 'ma' }, r.ma_kich_hoat), h('br')] : ['Đã có tài khoản, dùng mật khẩu cũ.', h('br')],
      appUrl, h('br'),
      r.ma_kich_hoat ? 'Mở trang, chọn kích hoạt bằng mã, tự đặt mật khẩu. Mã dùng một lần, hết hạn sau 90 ngày.' : 'Mở trang và đăng nhập như đợt trước.'))));
    document.body.append(the); window.print(); setTimeout(() => the.remove(), 500);
  };
  const chepTin = async () => {
    const chu = co.map(r => r.ma_kich_hoat
      ? `${r.ho_ten} · ${r.email}\nMã học viên: ${r.ma}\nMã kích hoạt: ${r.ma_kich_hoat}`
      : `${r.ho_ten} · ${r.email}\nMã học viên: ${r.ma}\nĐã có tài khoản, dùng mật khẩu cũ.`).join('\n\n');
    const tron = `${d.ten}\nMở ${appUrl}, chọn "Kích hoạt bằng mã", tự đặt mật khẩu.\n\n${chu}`;
    try { await navigator.clipboard.writeText(tron); toast('Đã chép ' + co.length + ' dòng'); }
    catch (_) { toast('Không chép được. Dùng Tải CSV.', true); }
  };
  moSheet({
    tieuDe: `Bảng gửi học viên · ${co.length} người`,
    noiDung: h('div', null,
      h('div', { class: 'bang-tin' }, 'Mã kích hoạt chỉ hiện một lần này. Tải tệp hoặc in phiếu ngay. Cần mã mới thì vào Danh sách học viên cấp lại.'),
      h('div', { class: 'hang-nut', style: 'margin-bottom:16px' },
        h('button', { class: 'nut phu', type: 'button', onclick: inPhieu }, 'In phiếu'),
        h('button', { class: 'nut phu', type: 'button', onclick: chepTin }, 'Chép tất cả'),
        h('button', { class: 'nut phu', type: 'button', onclick: () => taiCSV(`ma-kich-hoat-${d.ma}-${giaTriNgay(Date.now())}.csv`,
          [['Họ và tên', 'Email', 'Mã học viên', 'Mã kích hoạt', 'Ghi chú'], ...co.map(r => [r.ho_ten, r.email, r.ma, r.ma_kich_hoat || '', ghiChu(r)])]) }, 'Tải CSV')),
      h('div', { class: 'nhom' }, co.map(r => dong({
        tieu: r.ho_ten, phu: r.email + ' · ' + r.ma,
        sau: r.ma_kich_hoat
          ? h('span', { style: 'font:600 0.9375rem ui-monospace,Menlo,Consolas,monospace;letter-spacing:.03em;color:var(--chu)' }, r.ma_kich_hoat)
          : h('span', { class: 'the-nhan phep' }, 'Mật khẩu cũ'),
        muiTen: false
      }))))
  });
}

/* ---------- Danh sách học viên của đợt ---------- */
async function manHocVien(vung, id) {
  const dsDot = await S.db.dsDot();
  const d = dsDot.find(x => x.id === id);
  if (!d) return dat(vung, thanh('Học viên', '#tap-huan'), rong('Không tìm thấy đợt này.'));
  const ql = laBtcQuanLy(id);
  if (!ql) return dat(vung, thanh('Học viên', '#tap-huan/' + id, d.ma),
    rong('Chỉ trưởng ban, thư ký của đợt và quản trị xem được danh sách học viên.'));
  const hv = await S.db.dsHocVienDot(id);
  const lai = () => manHocVien(vung, id);
  let loc = 'tat', tim = '';

  const daKH = hv.filter(x => x.da_kich_hoat);
  const chuaCapMa = hv.filter(x => !x.da_kich_hoat && !x.ma_con_han);
  const daCapMa = hv.filter(x => !x.da_kich_hoat && x.ma_con_han);

  const vungDs = h('div');
  const ve = () => {
    const k = boDau(tim);
    const theoLoc = hv.filter(x =>
      (loc === 'tat' || (loc === 'da' ? x.da_kich_hoat : loc === 'ma' ? !x.da_kich_hoat && x.ma_con_han : !x.da_kich_hoat && !x.ma_con_han))
      && (!k || boDau([x.ho_ten, x.ma, x.email, x.truong, x.mssv].join(' ')).includes(k)));
    dat(vungDs,
      h('div', { class: 'nhan-nhom' }, theoLoc.length + ' người'),
      theoLoc.length ? h('div', { class: 'nhom' }, theoLoc.map(x => dong({
        tieu: x.ho_ten,
        phu: [x.ma, x.email, x.truong, x.nam_hoc].filter(Boolean).join(' · '),
        sau: x.da_kich_hoat ? h('span', { class: 'the-nhan dung' }, 'Đã kích hoạt')
          : x.ma_con_han ? h('span', { class: 'the-nhan tre' }, 'Đã cấp mã') : h('span', { class: 'the-nhan' }, 'Chưa cấp mã'),
        onclick: () => moHV(x)
      }))) : rong('Không có ai khớp.'));
  };

  const moHV = (x) => {
    const s = moSheet({
      tieuDe: x.ho_ten,
      noiDung: h('div', null,
        h('div', { class: 'nhom' },
          dong({ tieu: 'Mã học viên', sau: x.ma, muiTen: false }),
          dong({ tieu: 'Email', sau: x.email, muiTen: false }),
          x.sdt ? dong({ tieu: 'Số điện thoại', sau: x.sdt, muiTen: false }) : null,
          x.truong ? dong({ tieu: 'Trường', sau: x.truong, muiTen: false }) : null,
          x.nganh ? dong({ tieu: 'Ngành', sau: x.nganh, muiTen: false }) : null,
          x.nam_hoc ? dong({ tieu: 'Năm học', sau: x.nam_hoc, muiTen: false }) : null,
          x.mssv ? dong({ tieu: 'MSSV', sau: x.mssv, muiTen: false }) : null,
          x.lop ? dong({ tieu: 'Lớp', sau: x.lop, muiTen: false }) : null,
          dong({ tieu: 'Tài khoản', sau: x.da_kich_hoat ? 'Đã kích hoạt' : x.ma_con_han ? 'Đã cấp mã, chưa dùng' : 'Chưa cấp mã', muiTen: false })),
        h('button', { class: 'nut day', type: 'button', onclick: async () => {
          if (x.da_kich_hoat && !await xacNhan({ tieuDe: 'Cấp lại mã?', chu: 'Mật khẩu cũ vẫn dùng được cho đến khi bạn ấy đặt mật khẩu mới bằng mã.', nut: 'Cấp lại' })) return;
          const kq = await thu(() => S.db.capMaKichHoatHV(id, [x.id]));
          if (kq) { s.dong(); hienMaHV(kq.map(r => ({ ho_ten: r.ho_ten, email: r.email, ma: r.ma, ma_kich_hoat: r.ma_kich_hoat, tinh_trang: 'moi' })), d); lai(); }
        } }, x.da_kich_hoat ? 'Cấp lại mã kích hoạt' : 'Cấp mã kích hoạt'))
    });
  };

  const vien = (nhan, ma) => h('button', { class: 'vien', type: 'button', 'data-ma': ma, 'aria-pressed': loc === ma ? 'true' : 'false',
    onclick: (e) => { loc = ma; e.currentTarget.parentElement.querySelectorAll('.vien').forEach(v => v.setAttribute('aria-pressed', v.dataset.ma === ma ? 'true' : 'false')); ve(); } }, nhan);

  dat(vung,
    thanh('Học viên', '#tap-huan/' + id, d.ma),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:16px' }, d.ten),
    soLieu([
      { so: hv.length, ten: 'Trong đợt' },
      { so: daKH.length, ten: 'Đã kích hoạt', lop: 'dung' },
      { so: daCapMa.length, ten: 'Đã cấp mã', lop: 'tre' },
      { so: chuaCapMa.length, ten: 'Chưa cấp mã', lop: chuaCapMa.length ? 'vang' : '' }
    ]),
    !hv.length ? rong('Chưa có học viên nào. Vào Nạp danh sách để thêm.') : null,
    chuaCapMa.length ? h('button', { class: 'nut day', type: 'button', style: 'margin-bottom:18px', onclick: async () => {
      if (!await xacNhan({ tieuDe: `Cấp mã cho ${chuaCapMa.length} người?`, chu: 'Mã chỉ hiện một lần ngay sau bước này.', nut: 'Cấp mã' })) return;
      const kq = await thu(() => S.db.capMaKichHoatHV(id, chuaCapMa.map(x => x.id)));
      if (kq) { hienMaHV(kq.map(r => ({ ho_ten: r.ho_ten, email: r.email, ma: r.ma, ma_kich_hoat: r.ma_kich_hoat, tinh_trang: 'moi' })), d); lai(); }
    } }, `Cấp mã cho ${chuaCapMa.length} người chưa có`) : null,
    hv.length ? h('div', { class: 'hang-nut', style: 'margin-bottom:12px' },
      h('button', { class: 'nut phu', type: 'button', onclick: () => taiCSV(`hoc-vien-${d.ma}.csv`,
        [['Mã học viên', 'Họ và tên', 'Email', 'Số điện thoại', 'Trường', 'Ngành', 'Năm học', 'MSSV', 'Lớp', 'Tài khoản'],
          ...hv.map(x => [x.ma, x.ho_ten, x.email, x.sdt, x.truong, x.nganh, x.nam_hoc, x.mssv, x.lop,
            x.da_kich_hoat ? 'Đã kích hoạt' : x.ma_con_han ? 'Đã cấp mã, chưa dùng' : 'Chưa cấp mã'])]) }, 'Xuất CSV')) : null,
    hv.length ? h('input', { class: 'tim', type: 'search', placeholder: 'Tìm tên, mã, email, trường…', 'aria-label': 'Tìm học viên', oninput: (e) => { tim = e.target.value; ve(); } }) : null,
    hv.length ? h('div', { class: 'chon-ngang' }, vien('Tất cả', 'tat'), vien('Đã kích hoạt', 'da'), vien('Đã cấp mã', 'ma'), vien('Chưa cấp mã', 'chua')) : null,
    vungDs);
  if (hv.length) ve();
}

/* ============================================================ Buổi của đợt (migration 0014)

   luu_buoi_dot nhận cả object nên mọi lần lưu đều gửi đủ các ô; goiBuoi dựng object đó
   từ dòng ds_buoi_dot, chỉ thay những ô cần đổi. */

const goiBuoi = (dot, b, ghiDe) => Object.assign({
  dot_id: dot, ten: b.ten, bat_dau: b.bat_dau, ket_thuc: b.ket_thuc, dia_diem: b.dia_diem,
  noi_dung: b.noi_dung, phan: b.phan, nhom_chon: b.nhom_chon, can_dang_ky: b.can_dang_ky,
  suc_chua: b.suc_chua, mo_dang_ky_tu: b.mo_dang_ky_tu, han_dang_ky: b.han_dang_ky,
  tre_sau_phut: b.tre_sau_phut, ra_sau_phut: b.ra_sau_phut, tinh_chuyen_can: b.tinh_chuyen_can, dong: b.dong
}, ghiDe || {});

const coGioRa = (b) => b.ra_sau_phut !== null && b.ra_sau_phut !== undefined;
const moTaBuoi = (b) => [b.phan ? PHAN[b.phan] : null, b.dia_diem,
  b.can_dang_ky ? `${b.so_dang_ky}${b.suc_chua ? '/' + b.suc_chua : ''} đã đăng ký` : null,
  b.so_diem_danh ? `${b.so_diem_danh} đã điểm danh` : null,
  coGioRa(b) ? 'Có giờ ra' : null,
  b.dong ? 'Đã đóng' : null].filter(Boolean).join(' · ');

function suaBuoiDot(dot, b, sauKhi) {
  const canDK = h('div');
  const veDK = (bat) => dat(canDK, bat ? h('div', { class: 'nhom' },
    oNhap('Sức chứa (để trống là không giới hạn)', { name: 'sc', type: 'number', min: 1, inputmode: 'numeric', value: b && b.suc_chua ? b.suc_chua : '' }),
    oNhap('Nhóm ca (các ca cùng nhóm thì chỉ chọn một)', { name: 'nc', value: b ? b.nhom_chon || '' : '', placeholder: 'Thực hành tuần 1' }),
    oNhap('Mở đăng ký từ ngày', { name: 'mdn', type: 'date', value: b && b.mo_dang_ky_tu ? giaTriNgay(b.mo_dang_ky_tu) : '' }),
    oNhap('Giờ mở đăng ký', { name: 'mdg', type: 'time', value: b && b.mo_dang_ky_tu ? giaTriGio(b.mo_dang_ky_tu) : '' }),
    oNhap('Hạn đăng ký đến ngày', { name: 'hdn', type: 'date', value: b && b.han_dang_ky ? giaTriNgay(b.han_dang_ky) : '' }),
    oNhap('Giờ hết hạn', { name: 'hdg', type: 'time', value: b && b.han_dang_ky ? giaTriGio(b.han_dang_ky) : '' })) : null);

  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const x = f.elements;
      if (!x.ten.value.trim() || !x.ngay.value || !x.gio.value) return toast('Cần có tên, ngày và giờ bắt đầu.', true);
      const bat = x.dk.checked;
      const o = goiBuoi(dot, b || {}, {
        ten: x.ten.value.trim(),
        bat_dau: tuNhap(x.ngay.value, x.gio.value),
        ket_thuc: x.ket.value ? tuNhap(x.ngay.value, x.ket.value) : '',
        dia_diem: x.dd.value.trim(), noi_dung: x.nd.value.trim(), phan: x.phan.value,
        tre_sau_phut: Number(x.tre.value) || 0,
        ra_sau_phut: x.ra.value === '' ? '' : Number(x.ra.value),
        tinh_chuyen_can: x.cc.checked,
        can_dang_ky: bat,
        suc_chua: bat && x.sc.value ? Number(x.sc.value) : '',
        nhom_chon: bat ? x.nc.value.trim() : '',
        mo_dang_ky_tu: bat && x.mdn.value ? tuNhap(x.mdn.value, x.mdg.value || '00:00') : '',
        han_dang_ky: bat && x.hdn.value ? tuNhap(x.hdn.value, x.hdg.value || '23:59') : ''
      });
      const id = await thu(() => S.db.luuBuoiDot(b ? b.id : null, o), b ? 'Đã lưu buổi' : 'Đã thêm buổi');
      if (id) { s.dong(); sauKhi(); }
    }
  },
    h('div', { class: 'nhom' },
      oNhap('Tên buổi', { name: 'ten', value: b ? b.ten : '', required: true, placeholder: 'Lý thuyết X-quang bụng' }),
      oChon('Phần', [['', 'Chưa ghi'], ...Object.entries(PHAN)], b ? b.phan || '' : '', { name: 'phan' }),
      oNhap('Ngày', { name: 'ngay', type: 'date', value: b ? giaTriNgay(b.bat_dau) : giaTriNgay(Date.now()), required: true }),
      oNhap('Giờ bắt đầu', { name: 'gio', type: 'time', value: b ? giaTriGio(b.bat_dau) : '08:00', required: true }),
      oNhap('Giờ kết thúc (nếu có)', { name: 'ket', type: 'time', value: b && b.ket_thuc ? giaTriGio(b.ket_thuc) : '' }),
      oNhap('Địa điểm', { name: 'dd', value: b ? b.dia_diem || '' : '' }),
      oNhap('Nội dung', { the: 'textarea', name: 'nd', value: b ? b.noi_dung || '' : '', rows: 3 })),
    h('div', { class: 'nhom' },
      oNhap('Tính trễ sau bao nhiêu phút', { name: 'tre', type: 'number', min: 0, inputmode: 'numeric', value: b ? b.tre_sau_phut : 10 }),
      oNhap('Quét lại sau bao nhiêu phút là giờ ra (để trống nếu buổi không điểm danh ra)',
        { name: 'ra', type: 'number', min: 0, inputmode: 'numeric', value: b && coGioRa(b) ? b.ra_sau_phut : '' }),
      oBat('Tính vào chuyên cần của đợt', { name: 'cc', checked: b ? b.tinh_chuyen_can : true }),
      oBat('Học viên phải đăng ký chỗ', { name: 'dk', checked: b ? b.can_dang_ky : false, onchange: (e) => veDK(e.target.checked) })),
    canDK,
    h('p', { class: 'chu-nho', style: 'margin-bottom:14px' }, 'Buổi phải đăng ký thì danh sách điểm danh chỉ gồm người đã đăng ký. Buổi không đăng ký thì cả đợt đều có tên.'),
    h('button', { class: 'nut day', type: 'submit' }, b ? 'Lưu' : 'Thêm buổi'),
    b ? h('button', {
      class: 'nut nguy day', type: 'button', style: 'margin-top:10px',
      onclick: async () => {
        if (!await xacNhan({ tieuDe: 'Xóa buổi này?', chu: 'Chỉ xóa được khi buổi chưa có ai điểm danh.', nut: 'Xóa buổi', nguy: true })) return;
        if (await thu(() => S.db.xoaBuoiDot(b.id), 'Đã xóa buổi')) { s.dong(); location.hash = `tap-huan/${dot}/buoi`; }
      }
    }, 'Xóa buổi') : null);
  veDK(b ? b.can_dang_ky : false);
  const s = moSheet({ tieuDe: b ? 'Sửa buổi' : 'Buổi mới', noiDung: f });
}

/* ---------- Xếp ca: dùng khi học viên không tự chọn được ---------- */
async function xepCa(dot, b, sauKhi) {
  const [hv, dk] = await Promise.all([S.db.dsHocVienDot(dot), S.db.dsDangKyBuoi(b.id)]);
  if (!hv.length) return toast('Đợt chưa có học viên nào.', true);
  const chon = new Set(dk.map(x => x.thanh_vien_id));
  const demEl = h('b', null, String(chon.size));
  const hang = hv.slice().sort((x, y) => x.ho_ten.localeCompare(y.ho_ten, 'vi')).map(x => {
    const o = oBat(x.ho_ten, { checked: chon.has(x.id), onchange: (e) => {
      if (e.target.checked) chon.add(x.id); else chon.delete(x.id);
      demEl.textContent = String(chon.size);
    } });
    o.querySelector('span').append(h('small', { style: 'display:block;color:var(--chu-2);font-size:.8125rem' }, x.ma));
    o.dataset.tim = boDau(x.ho_ten + ' ' + x.ma);
    return o;
  });
  const s = moSheet({
    tieuDe: 'Xếp ca',
    noiDung: h('div', null,
      h('p', { class: 'chu-nho', style: 'margin-bottom:12px' }, b.ten, '. Đã chọn ', demEl, b.suc_chua ? ` trên sức chứa ${b.suc_chua}` : '', '. Người đã điểm danh thì app giữ lại dù bạn bỏ tick.'),
      h('input', { class: 'tim', type: 'search', placeholder: 'Tìm tên hoặc mã học viên', 'aria-label': 'Tìm học viên', oninput: (e) => { const k = boDau(e.target.value); hang.forEach(o => { o.hidden = !!k && !o.dataset.tim.includes(k); }); } }),
      h('div', { class: 'nhom' }, hang),
      h('button', { class: 'nut day', type: 'button', onclick: async () => {
        if (b.suc_chua && chon.size > b.suc_chua && !await xacNhan({ tieuDe: 'Quá sức chứa?', chu: `Ca này ghi sức chứa ${b.suc_chua} nhưng bạn chọn ${chon.size} người.`, nut: 'Vẫn lưu' })) return;
        if (await thu(() => S.db.datDangKyBuoi(b.id, [...chon]), 'Đã xếp ca')) { s.dong(); sauKhi(); }
      } }, 'Lưu'))
  });
}

/* ---------- Danh sách buổi của đợt ---------- */
async function manDsBuoiDot(vung, dot) {
  const dsDot = await S.db.dsDot();
  const d = dsDot.find(x => x.id === dot);
  if (!d) return dat(vung, thanh('Buổi', '#tap-huan'), rong('Không tìm thấy đợt này.'));
  if (!thayDuocDot(dot)) return dat(vung, thanh('Buổi', '#tap-huan/' + dot, d.ma), rong('Chỉ Ban tổ chức của đợt xem được buổi học.'));
  const ds = await S.db.dsBuoiDot(dot);
  const ql = laBtcQuanLy(dot);
  const lai = () => manDsBuoiDot(vung, dot);
  const nay = Date.now() + (S.lech || 0);
  const hang = (b) => dong({
    truoc: dauNgay(b.bat_dau), tieu: b.ten,
    phu: [gio(b.bat_dau), moTaBuoi(b)].filter(Boolean).join(' · '),
    href: `#tap-huan/${dot}/buoi/${b.id}`
  });
  const sap = ds.filter(b => new Date(b.bat_dau).getTime() >= nay - 12 * 3600e3);
  const qua = ds.filter(b => new Date(b.bat_dau).getTime() < nay - 12 * 3600e3).reverse();
  dat(vung,
    thanh('Buổi của đợt', '#tap-huan/' + dot, d.ma, ql ? h('button', { class: 'nut-lui', type: 'button', onclick: () => suaBuoiDot(dot, null, lai) }, 'Thêm') : null),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:16px' }, d.ten),
    sap.length ? nhom('Sắp tới', sap.map(hang)) : rong(ql ? 'Chưa có buổi nào sắp tới. Bấm Thêm để tạo buổi.' : 'Chưa có buổi nào sắp tới.'),
    qua.length ? nhom('Đã qua', qua.map(hang)) : null,
    ql && ds.some(b => b.can_dang_ky) ? nhom('Xếp ca', ds.filter(b => b.can_dang_ky).map(b => dong({
      tieu: b.ten, phu: `${b.so_dang_ky}${b.suc_chua ? '/' + b.suc_chua : ''} đã đăng ký · ${gio(b.bat_dau)} ${ngay(b.bat_dau)}`,
      onclick: () => xepCa(dot, b, lai), muiTen: false
    }))) : null);
}

/* ---------- Một buổi của đợt: dùng lại máy quét của buổi sinh hoạt CLB ---------- */
async function manBuoiDot(vung, dot, buoiId) {
  const dsDot = await S.db.dsDot();
  const d = dsDot.find(x => x.id === dot);
  if (!d) return dat(vung, thanh('Buổi', '#tap-huan'), rong('Không tìm thấy đợt này.'));
  if (!thayDuocDot(dot)) return dat(vung, thanh('Buổi', '#tap-huan/' + dot, d.ma), rong('Chỉ Ban tổ chức của đợt xem được buổi học.'));
  const ds = await S.db.dsBuoiDot(dot);
  const b = ds.find(x => x.id === buoiId);
  if (!b) return dat(vung, thanh('Buổi', `#tap-huan/${dot}/buoi`, 'Buổi'), rong('Không tìm thấy buổi này.'));
  const lai = () => manBuoiDot(vung, dot, buoiId);
  await manMotBuoi(vung, buoiId, {
    b, quanLy: laBtcQuanLy(dot), diemDanhDuoc: laDiemDanh(dot),
    lui: `#tap-huan/${dot}/buoi`, luiNhan: 'Buổi', lai,
    sua: () => suaBuoiDot(dot, b, lai),
    dongBuoi: (moi) => S.db.luuBuoiDot(buoiId, goiBuoi(dot, b, { dong: moi }))
  });
  vung.append(
    h('div', { class: 'hang-nut', style: 'margin-top:12px' },
      h('a', { class: 'nut phu', href: `#tap-huan/${dot}/cau-hoi/${buoiId}`, style: 'text-decoration:none;text-align:center' }, 'Câu hỏi trong giờ'),
      b.can_dang_ky && laBtcQuanLy(dot) ? h('button', { class: 'nut phu', type: 'button', onclick: () => xepCa(dot, b, lai) }, 'Xếp ca') : null),
    h('p', { class: 'chu-nho giua-chu', style: 'margin:14px 0 22px' },
      'Buổi của đợt ', d.ma, '. Danh sách là ', b.can_dang_ky ? 'học viên đã đăng ký ca này' : 'học viên của cả đợt', '.'));
}

/* ============================================================ Tài liệu của đợt */
async function manTaiLieuDot(vung, dot) {
  const dsDot = await S.db.dsDot();
  const d = dsDot.find(x => x.id === dot);
  if (!d) return dat(vung, thanh('Tài liệu', '#tap-huan'), rong('Không tìm thấy đợt này.'));
  if (!laGiangVien(dot)) return dat(vung, thanh('Tài liệu', '#tap-huan/' + dot, d.ma),
    rong('Chỉ trưởng ban, thư ký và tập huấn viên của đợt soạn được tài liệu.'));
  const [ds, buoi] = await Promise.all([S.db.dsTaiLieuDot(dot), S.db.dsBuoiDot(dot)]);
  const lai = () => manTaiLieuDot(vung, dot);

  const sua = (x) => {
    const f = h('form', { onsubmit: async (e) => {
      e.preventDefault();
      const v = f.elements;
      if (!v.ten.value.trim()) return toast('Cần tên tài liệu.', true);
      if (!/^https?:\/\//i.test(v.lk.value.trim())) return toast('Đường dẫn phải bắt đầu bằng http:// hoặc https://', true);
      const o = {
        dot_id: dot, ten: v.ten.value.trim(), mo_ta: v.mt.value.trim(), lien_ket: v.lk.value.trim(),
        buoi_id: v.buoi.value, thu_tu: Number(v.tt.value) || 0,
        mo_tu: v.mn.value ? tuNhap(v.mn.value, v.mg.value || '00:00') : '',
        can_diem_danh: v.dd.checked
      };
      if (await thu(() => S.db.luuTaiLieuDot(x ? x.id : null, o), x ? 'Đã lưu' : 'Đã thêm tài liệu')) { s.dong(); lai(); }
    } },
      h('div', { class: 'nhom' },
        oNhap('Tên tài liệu', { name: 'ten', value: x ? x.ten : '', required: true }),
        oNhap('Đường dẫn trên Drive', { name: 'lk', type: 'url', value: x ? x.lien_ket || '' : '', placeholder: 'https://drive.google.com/...', required: true }),
        oNhap('Mô tả', { name: 'mt', value: x ? x.mo_ta || '' : '' }),
        oChon('Gắn với buổi', [['', 'Không gắn buổi nào'], ...buoi.map(b => [b.id, `${ngay(b.bat_dau)} · ${b.ten}`])], x ? x.buoi_id || '' : '', { name: 'buoi' }),
        oNhap('Thứ tự hiện', { name: 'tt', type: 'number', inputmode: 'numeric', value: x ? x.thu_tu : 0 })),
      h('div', { class: 'nhom' },
        oNhap('Mở từ ngày (để trống là mở ngay)', { name: 'mn', type: 'date', value: x && x.mo_tu ? giaTriNgay(x.mo_tu) : '' }),
        oNhap('Giờ mở', { name: 'mg', type: 'time', value: x && x.mo_tu ? giaTriGio(x.mo_tu) : '' }),
        oBat('Chỉ mở sau khi học viên điểm danh buổi đã gắn', { name: 'dd', checked: x ? x.can_diem_danh : false })),
      h('p', { class: 'chu-nho', style: 'margin-bottom:14px' }, 'App chỉ giữ đường dẫn, không giữ tệp. Quyền xem tệp vẫn do Drive quyết định, nhớ đặt quyền cho người có đường dẫn.'),
      h('button', { class: 'nut day', type: 'submit' }, x ? 'Lưu' : 'Thêm'),
      x ? h('button', { class: 'nut nguy day', type: 'button', style: 'margin-top:10px', onclick: async () => {
        if (!await xacNhan({ tieuDe: 'Xóa tài liệu?', chu: 'Chỉ xóa dòng trong app, tệp trên Drive không đổi.', nut: 'Xóa', nguy: true })) return;
        if (await thu(() => S.db.xoaTaiLieuDot(x.id), 'Đã xóa')) { s.dong(); lai(); }
      } }, 'Xóa tài liệu') : null);
    const s = moSheet({ tieuDe: x ? 'Sửa tài liệu' : 'Tài liệu mới', noiDung: f });
  };

  dat(vung,
    thanh('Tài liệu', '#tap-huan/' + dot, d.ma, h('button', { class: 'nut-lui', type: 'button', onclick: () => sua(null) }, 'Thêm')),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:16px' }, d.ten),
    ds.length ? nhom(null, ds.map(x => hangTaiLieu(x, { quanLy: true, sua }))) : rong('Chưa có tài liệu nào. Bấm Thêm để dán đường dẫn Drive.'),
    ds.length ? h('p', { class: 'chu-nho', style: 'margin-bottom:22px' }, 'Ban tổ chức luôn mở được mọi tài liệu. Dòng nào ghi điều kiện thì điều kiện đó chỉ áp cho học viên.') : null);
}

/* ============================================================ Checklist của đợt */
async function manChecklistDot(vung, dot) {
  const dsDot = await S.db.dsDot();
  const d = dsDot.find(x => x.id === dot);
  if (!d) return dat(vung, thanh('Checklist', '#tap-huan'), rong('Không tìm thấy đợt này.'));
  if (!laGiangVien(dot)) return dat(vung, thanh('Checklist', '#tap-huan/' + dot, d.ma),
    rong('Chỉ trưởng ban, thư ký và tập huấn viên của đợt soạn được checklist.'));
  const [ds, buoi] = await Promise.all([S.db.dsChecklistDot(dot), S.db.dsBuoiDot(dot)]);
  const lai = () => manChecklistDot(vung, dot);

  const sua = (x) => {
    const f = h('form', { onsubmit: async (e) => {
      e.preventDefault();
      const v = f.elements;
      if (!v.ten.value.trim()) return toast('Cần tên checklist.', true);
      const muc = docMucChecklist(v.muc.value);
      if (!muc.length) return toast('Chưa có mục nào.', true);
      const o = { dot_id: dot, ten: v.ten.value.trim(), mo_ta: v.mt.value.trim(), buoi_id: v.buoi.value, thu_tu: Number(v.tt.value) || 0, muc };
      if (await thu(() => S.db.luuChecklistDot(x ? x.id : null, o), x ? 'Đã lưu' : 'Đã thêm checklist')) { s.dong(); lai(); }
    } },
      h('div', { class: 'nhom' },
        oNhap('Tên checklist', { name: 'ten', value: x ? x.ten : '', required: true, placeholder: 'Rửa tay vô khuẩn' }),
        oNhap('Mô tả', { name: 'mt', value: x ? x.mo_ta || '' : '' }),
        oChon('Gắn với buổi', [['', 'Không gắn buổi nào'], ...buoi.map(b => [b.id, `${ngay(b.bat_dau)} · ${b.ten}`])], x ? x.buoi_id || '' : '', { name: 'buoi' }),
        oNhap('Thứ tự hiện', { name: 'tt', type: 'number', inputmode: 'numeric', value: x ? x.thu_tu : 0 }),
        oNhap('Các mục', { the: 'textarea', name: 'muc', rows: 12, value: x ? vietMucChecklist(x.muc) : '# Chuẩn bị\nRửa tay\nMặc áo mổ\n\n# Thực hiện\n' })),
      h('p', { class: 'chu-nho', style: 'margin-bottom:14px' }, 'Mỗi dòng là một mục. Dòng bắt đầu bằng dấu thăng là tên nhóm. Dòng trống bị bỏ qua.'),
      h('button', { class: 'nut day', type: 'submit' }, x ? 'Lưu' : 'Thêm'),
      x ? h('button', { class: 'nut nguy day', type: 'button', style: 'margin-top:10px', onclick: async () => {
        if (!await xacNhan({ tieuDe: 'Xóa checklist?', nut: 'Xóa', nguy: true })) return;
        if (await thu(() => S.db.xoaChecklistDot(x.id), 'Đã xóa')) { s.dong(); lai(); }
      } }, 'Xóa checklist') : null);
    const s = moSheet({ tieuDe: x ? 'Sửa checklist' : 'Checklist mới', noiDung: f });
  };

  dat(vung,
    thanh('Checklist', '#tap-huan/' + dot, d.ma, h('button', { class: 'nut-lui', type: 'button', onclick: () => sua(null) }, 'Thêm')),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:16px' }, d.ten),
    ds.length ? nhom(null, ds.map(x => dong({
      tieu: x.ten, phu: [x.buoi_ten, soMucChecklist(x) + ' mục'].filter(Boolean).join(' · '),
      truoc: icon('phieu'), onclick: () => sua(x)
    }))) : rong('Chưa có checklist nào.'),
    ds.length ? nhom('Xem như học viên', ds.map(x => dong({
      tieu: x.ten, phu: 'Mở bản tick và in thử', truoc: icon('test'), onclick: () => moChecklist(x, d.ten)
    }))) : null,
    h('p', { class: 'chu-nho', style: 'margin-bottom:22px' }, 'Học viên tick ngay trên máy của mình; app không lưu cái đã tick nên không có bảng theo dõi ai tick gì. Bản in có ô vuông để tích bằng bút.'));
}

/* ============================================================ Thông báo của đợt */
async function manThongBaoDot(vung, dot) {
  const dsDot = await S.db.dsDot();
  const d = dsDot.find(x => x.id === dot);
  if (!d) return dat(vung, thanh('Thông báo', '#tap-huan'), rong('Không tìm thấy đợt này.'));
  if (!laBtcQuanLy(dot)) return dat(vung, thanh('Thông báo', '#tap-huan/' + dot, d.ma),
    rong('Chỉ trưởng ban, thư ký của đợt và quản trị đăng được thông báo.'));
  const ds = await S.db.thongBaoDot(dot);
  const lai = () => manThongBaoDot(vung, dot);

  const soan = (cu) => {
    const f = h('form', { onsubmit: async (e) => {
      e.preventDefault();
      const v = f.elements;
      if (!v.td.value.trim()) return toast('Cần tiêu đề.', true);
      const o = { dot_id: dot, tieu_de: v.td.value.trim(), noi_dung: v.nd.value.trim(), ghim: v.g.checked };
      if (await thu(() => S.db.luuThongBaoDot(cu ? cu.id : null, o), cu ? 'Đã lưu' : 'Đã đăng thông báo')) { s.dong(); lai(); }
    } },
      h('div', { class: 'nhom' },
        oNhap('Tiêu đề', { name: 'td', value: cu ? cu.tieu_de : '', required: true }),
        oNhap('Nội dung', { the: 'textarea', name: 'nd', value: cu ? cu.noi_dung || '' : '', rows: 6 }),
        oBat('Ghim lên đầu', { name: 'g', checked: cu ? cu.ghim : false })),
      h('p', { class: 'chu-nho', style: 'margin-bottom:14px' }, 'Thông báo này chỉ học viên trong đợt và Ban tổ chức thấy. Thành viên CLB khác không thấy.'),
      h('button', { class: 'nut day', type: 'submit' }, cu ? 'Lưu' : 'Đăng'),
      cu ? h('button', { class: 'nut nguy day', type: 'button', style: 'margin-top:10px', onclick: async () => {
        if (!await xacNhan({ tieuDe: 'Xóa thông báo?', nut: 'Xóa', nguy: true })) return;
        if (await thu(() => S.db.xoaThongBaoDot(cu.id), 'Đã xóa')) { s.dong(); lai(); }
      } }, 'Xóa thông báo') : null);
    const s = moSheet({ tieuDe: cu ? 'Sửa thông báo' : 'Thông báo mới', noiDung: f });
  };

  dat(vung,
    thanh('Thông báo của đợt', '#tap-huan/' + dot, d.ma, h('button', { class: 'nut-lui', type: 'button', onclick: () => soan(null) }, 'Đăng')),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:16px' }, d.ten),
    ds.length ? nhom(null, ds.map(x => dong({
      tieu: x.tieu_de, phu: [ngayGio(x.dang_luc), x.ghim ? 'Đã ghim' : null].filter(Boolean).join(' · '),
      truoc: icon('chuong'), onclick: () => soan(x)
    }))) : rong('Chưa có thông báo nào cho đợt này.'));
}

/* ============================================================ Câu hỏi trong giờ: chọn buổi rồi xem */
async function manCauHoiDot(vung, dot, buoiId) {
  const dsDot = await S.db.dsDot();
  const d = dsDot.find(x => x.id === dot);
  if (!d) return dat(vung, thanh('Câu hỏi', '#tap-huan'), rong('Không tìm thấy đợt này.'));
  if (!thayDuocDot(dot)) return dat(vung, thanh('Câu hỏi', '#tap-huan/' + dot, d.ma), rong('Chỉ Ban tổ chức của đợt xem được câu hỏi.'));
  const ds = await S.db.dsBuoiDot(dot);
  if (buoiId) {
    const b = ds.find(x => x.id === buoiId);
    if (!b) return dat(vung, thanh('Câu hỏi', `#tap-huan/${dot}/cau-hoi`, 'Câu hỏi'), rong('Không tìm thấy buổi này.'));
    return manCauHoi(vung, {
      buoi: b, quanLy: laGiangVien(dot), guiDuoc: false,
      lui: `#tap-huan/${dot}/cau-hoi`, luiNhan: 'Chọn buổi',
      lai: () => manCauHoiDot(vung, dot, buoiId)
    });
  }
  const nay = Date.now() + (S.lech || 0);
  const theoGan = ds.slice().sort((x, y) => Math.abs(new Date(x.bat_dau) - nay) - Math.abs(new Date(y.bat_dau) - nay));
  dat(vung,
    thanh('Câu hỏi trong giờ', '#tap-huan/' + dot, d.ma),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:16px' }, 'Chọn buổi để xem câu hỏi học viên gửi. Buổi gần giờ này nằm trên.'),
    ds.length ? nhom(null, theoGan.map(b => dong({
      truoc: dauNgay(b.bat_dau), tieu: b.ten, phu: [gio(b.bat_dau), b.phan ? PHAN[b.phan] : null].filter(Boolean).join(' · '),
      href: `#tap-huan/${dot}/cau-hoi/${b.id}`
    }))) : rong('Đợt chưa có buổi nào.'));
}
