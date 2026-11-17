// Tập huấn: đợt, Ban tổ chức, nạp danh sách học viên, cấp mã kích hoạt.
// Mọi việc đi qua hàm trong Postgres (migration 0013); trình duyệt không đọc thẳng bảng học viên.
import { S } from './state.js';
import {
  h, dat, dong, nhom, moSheet, thu, toast, bieuTuong, ngay, soLieu, rong, oNhap, xacNhan,
  taiCSV, boDau, giaTriNgay, moTaTV
} from './ui.js';

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

export async function tuyenTapHuan(vung, con) {
  const [a, b] = con;
  if (a && b === 'nap') return manNapDS(vung, a);
  if (a && b === 'hoc-vien') return manHocVien(vung, a);
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
  const [btc, tv] = await Promise.all([
    S.db.btcCuaDot(id).catch(() => []),
    S.toi.xem_duoc_ten ? S.db.dsThanhVien().catch(() => []) : []
  ]);
  const tenCua = (tvId) => { const t = tv.find(x => x.id === tvId); return t ? t.ho_ten : 'Thành viên'; };
  const theoVai = Object.keys(VAI).map(v => {
    const nguoi = btc.filter(b => b.vai === v);
    return nguoi.length ? `${VAI[v]}: ${nguoi.map(b => tenCua(b.thanh_vien_id)).join(', ')}` : null;
  }).filter(Boolean);

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
    d.trang_thai === 'ket_thuc' ? h('div', { class: 'bang-tin' }, 'Đợt đã kết thúc: tài khoản học viên chỉ còn xem lại kết quả và giấy chứng nhận.') : null,
    // Chỉ trưởng ban, thư ký và quản trị đọc được danh sách học viên (hàm ds_hoc_vien_dot).
    // Người giữ vai khác thấy dòng giải thích, không thấy danh sách rỗng rồi tưởng đợt chưa có ai.
    nhom('Học viên',
      ql ? dong({ tieu: 'Nạp danh sách', phu: 'Dán bảng đăng ký, app xem trước rồi mới ghi', truoc: icon('don'), href: `#tap-huan/${id}/nap` }) : null,
      ql ? dong({ tieu: 'Danh sách học viên', phu: 'Xem, cấp mã kích hoạt, xuất bảng cho thư ký gửi', truoc: icon('nguoi'), href: `#tap-huan/${id}/hoc-vien` })
        : dong({ tieu: 'Danh sách học viên', phu: 'Chỉ trưởng ban, thư ký và quản trị xem được danh sách và thông tin học viên', truoc: icon('nguoi'), muiTen: false })),
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
