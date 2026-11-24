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
import {
  TRANG_THAI, LOP_TT, VAI, PHAN, icon, thanh, laBtcQuanLy, laGiangVien, laDiemDanh, thayDuocDot,
  ANH_DOT, MAU_MAC_DINH, nhanDien, theKhoaHoc, veDiemDanh
} from './dot-chung.js';
import { manYeuCauDot, manBaiThiDot, manPhieuDot, manTieuChiDot, manKetQuaDot } from './v-ketqua.js';

// Nhãn, vai trò và thanh tiêu đề nằm ở dot-chung.js vì v-ketqua.js cũng dùng.
// Chỉ trưởng ban và thư ký nạp được danh sách và cấp được mã (hàm la_btc_dot trong Postgres).

const khoang = (d) => {
  if (!d.bat_dau && !d.ket_thuc) return 'Chưa ghi ngày';
  if (d.bat_dau && d.ket_thuc) return ngay(d.bat_dau + 'T12:00:00+07:00') + ' – ' + ngay(d.ket_thuc + 'T12:00:00+07:00');
  return ngay((d.bat_dau || d.ket_thuc) + 'T12:00:00+07:00');
};
export async function tuyenTapHuan(vung, con) {
  const [a, b, c] = con;
  if (a && b === 'nap') return manNapDS(vung, a);
  if (a && b === 'hoc-vien') return manHocVien(vung, a);
  if (a && b === 'thu') return manThuDot(vung, a);
  if (a && b === 'zalo') return manZaloDot(vung, a);
  if (a && b === 'anh') return manAnhDot(vung, a);
  if (a && b === 'buoi' && c) return manBuoiDot(vung, a, c);
  if (a && b === 'buoi') return manDsBuoiDot(vung, a);
  if (a && b === 'tai-lieu') return manTaiLieuDot(vung, a);
  if (a && b === 'checklist') return manChecklistDot(vung, a);
  if (a && b === 'thong-bao') return manThongBaoDot(vung, a);
  if (a && b === 'cau-hoi') return manCauHoiDot(vung, a, c);
  if (a && b === 'yeu-cau') return manYeuCauDot(vung, a);
  if (a && b === 'bai-thi') return manBaiThiDot(vung, a, c);
  if (a && b === 'phieu') return manPhieuDot(vung, a, c);
  if (a && b === 'tieu-chi') return manTieuChiDot(vung, a);
  if (a && b === 'ket-qua') return manKetQuaDot(vung, a);
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
        : dong({ tieu: 'Danh sách học viên', phu: 'Chỉ trưởng ban, thư ký và quản trị xem được danh sách và thông tin học viên', truoc: icon('nguoi'), muiTen: false }),
      ql ? dong({ tieu: 'Thư đã gửi', phu: 'Ai nhận được mã qua email, ai phải gửi tay', truoc: icon('chuong'), href: `#tap-huan/${id}/thu` }) : null,
      ql ? dong({
        tieu: 'Nhóm Zalo của đợt', truoc: icon('nguoi'), href: `#tap-huan/${id}/zalo`,
        phu: d.zalo_link ? 'Đã có link' + (d.co_zalo_qr ? ' và mã QR' : ', chưa có mã QR') : 'Chưa có — dán vào trước khi nạp danh sách'
      }) : null),
    // Bộ ảnh theo mùa của đợt.
    ql ? nhom('Giao diện cho học viên', dong({
      tieu: 'Ảnh nhận diện khóa học', truoc: icon('sao'), href: `#tap-huan/${id}/anh`,
      phu: (() => { const nd = nhanDien(d); const co = Object.keys(ANH_DOT).filter(k => nd[k]).length;
        return co ? `Đã có ${co}/${Object.keys(ANH_DOT).length} ảnh` + (nd.mau ? ' và màu nhấn' : '') : 'Chưa có — học viên đang thấy thẻ nền màu'; })()
    })) : null,
    nhom('Trong buổi',
      dong({ tieu: 'Buổi và điểm danh', truoc: icon('lich'), href: `#tap-huan/${id}/buoi`,
        phu: buoi.length ? `${buoi.length} buổi · ${buoi.filter(b => b.dong).length} đã đóng` : 'Chưa có buổi nào' }),
      dong({ tieu: 'Câu hỏi trong giờ', phu: 'Học viên gửi câu hỏi, có thể ẩn tên trên màn hình', truoc: icon('don'), href: `#tap-huan/${id}/cau-hoi` }),
      laGiangVien(id) ? dong({ tieu: 'Tài liệu', phu: 'Đường dẫn Drive, mở theo giờ hoặc sau khi điểm danh', truoc: icon('test'), href: `#tap-huan/${id}/tai-lieu` }) : null,
      laGiangVien(id) ? dong({ tieu: 'Checklist', phu: 'Học viên tick trong giờ, in ra PDF được', truoc: icon('phieu'), href: `#tap-huan/${id}/checklist` }) : null,
      ql ? dong({ tieu: 'Thông báo của đợt', phu: 'Chỉ học viên trong đợt và Ban tổ chức thấy', truoc: icon('chuong'), href: `#tap-huan/${id}/thong-bao` }) : null),
    nhom('Sau buổi',
      dong({ tieu: 'Phản hồi và thắc mắc', phu: 'Học viên gửi chữ, không đính tệp', truoc: icon('don'), href: `#tap-huan/${id}/yeu-cau` }),
      ql ? dong({ tieu: 'Bài thi và điểm', phu: 'Thi trên máy CLB, ở đây chỉ nhập điểm', truoc: icon('bieu_do'), href: `#tap-huan/${id}/bai-thi` }) : null,
      ql ? dong({ tieu: 'Phiếu đánh giá', phu: 'Soạn phiếu, mở cho học viên, xem tổng hợp', truoc: icon('phieu'), href: `#tap-huan/${id}/phieu` }) : null,
      ql ? dong({ tieu: 'Tiêu chí hoàn thành', phu: 'Cốt lõi, bổ sung và ngưỡng xuất sắc', truoc: icon('sao'), href: `#tap-huan/${id}/tieu-chi` }) : null,
      ql ? dong({ tieu: 'Kết quả và chứng nhận', phu: 'Xét từng người rồi cấp giấy', truoc: icon('khoa'), href: `#tap-huan/${id}/ket-qua` }) : null),
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
/* App chỉ thu thập bốn ô này (anh Long chốt 18/11/2026, migration 0017). Cột khác trong bảng
   dán vào — số điện thoại, ngày sinh, giới tính, trường, ngành, năm học — app bỏ qua, không lưu. */
const COT = [
  ['ho_ten', 'Họ và tên', ['hoten', 'hovaten', 'ten', 'name', 'fullname']],
  ['email', 'Email', ['email', 'mail', 'thudientu', 'diachiemail', 'emailaddress']],
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
    h('div', { class: 'bang-tin xanh' }, 'Cột theo mẫu: ', COT.map(c => c[1]).join(' · '), '. App tự dò tên cột nên thứ tự khác vẫn được; chỉ email là bắt buộc. Cột khác trong bảng — số điện thoại, ngày sinh, trường, ngành — app bỏ qua, không lưu.'),
    h('div', { class: 'nhom' }, oDan),
    h('div', { class: 'hang-nut', style: 'margin-bottom:8px' },
      h('button', { class: 'nut phu', type: 'button', onclick: () => tep.click() }, 'Chọn tệp CSV'),
      h('button', { class: 'nut', type: 'button', onclick: xemTruoc }, 'Xem trước')),
    tep,
    h('p', { class: 'chu-nho', style: 'margin-bottom:22px' }, 'Xem trước không ghi gì vào cơ sở dữ liệu. Tên tự viết hoa đầu chữ, email đổi thành chữ thường.'),
    vungKQ);
}

/* ---------- Gửi mã kích hoạt qua email (migration 0016, Edge Function gui-thu) ----------

   Mã kích hoạt bản rõ chỉ nằm trong trí nhớ của trang này, đóng bảng là mất. Trình duyệt gửi
   lên id học viên và mã; địa chỉ nhận do máy chủ tra trong hồ sơ, nên thư không thể đi lạc.
   Gửi theo từng lượt nhỏ để người bấm thấy tiến độ và để Edge Function không chạy quá lâu. */

const MOI_LUOT = 40;
export const batGuiThu = () => !!(S.caiDat && S.caiDat.thu && S.caiDat.thu.bat);

async function guiMaQuaEmail(d, hang, nut) {
  let ds = (hang || []).filter(r => r.ma_kich_hoat && r.email);
  if (!ds.length) return toast('Không có mã nào để gửi.', true);
  // Dòng từ màn Nạp danh sách không kèm id, tra lại theo email trong danh sách học viên của đợt.
  if (ds.some(r => !r.id)) {
    const hv = await S.db.dsHocVienDot(d.id).catch(() => []);
    const theoEmail = new Map(hv.map(x => [String(x.email || '').toLowerCase(), x.id]));
    ds = ds.map(r => Object.assign({}, r, { id: r.id || theoEmail.get(String(r.email || '').toLowerCase()) }))
      .filter(r => r.id);
    if (!ds.length) return toast('Không tra được học viên để gửi. Vào Danh sách học viên gửi lại.', true);
  }
  const tenCua = new Map(ds.map(r => [r.id, r.ho_ten || r.email]));
  const chuCu = nut.textContent;
  nut.disabled = true;
  const ra = [];
  try {
    for (let i = 0; i < ds.length; i += MOI_LUOT) {
      const lo = ds.slice(i, i + MOI_LUOT);
      nut.textContent = `Đang gửi ${Math.min(i + lo.length, ds.length)}/${ds.length}…`;
      const kq = await S.db.guiThu({
        viec: 'ma_kich_hoat', dot_id: d.id,
        ds: lo.map(r => ({ id: r.id, ma_kich_hoat: r.ma_kich_hoat }))
      });
      (kq.ds || []).forEach(r => ra.push(Object.assign({ ho_ten: tenCua.get(r.id) }, r)));
    }
  } catch (e) {
    nut.disabled = false; nut.textContent = chuCu;
    return toast(e.message, true);
  }
  nut.disabled = false;
  nut.textContent = chuCu;
  const thanhCong = ra.filter(r => r.ok);
  const hong = ra.filter(r => !r.ok);
  if (!hong.length) return toast(`Đã gửi thư cho ${thanhCong.length} người`);
  moSheet({
    tieuDe: `Gửi xong · ${thanhCong.length} thành, ${hong.length} chưa`,
    noiDung: h('div', null,
      h('div', { class: 'bang-tin vang' }, 'Những người dưới đây chưa nhận được thư. Gửi tay cho họ bằng bảng đã tải về, mã vẫn còn dùng được.'),
      h('div', { class: 'nhom' }, hong.map(r => dong({
        tieu: r.ho_ten || r.email || 'Không rõ', phu: r.email || null,
        sau: h('span', { class: 'the-nhan vang' }, r.loi || 'Lỗi'), muiTen: false
      }))))
  });
}

const nutGuiEmail = (d, layHang, nhan) => h('button', {
  class: 'nut phu', type: 'button',
  onclick: (e) => guiMaQuaEmail(d, layHang(), e.currentTarget)
}, nhan);

/* ---------- Bảng gửi học viên: mã kích hoạt chỉ hiện một lần ---------- */
function hienMaHV(ds, d) {
  const co = (ds || []).filter(r => r.tinh_trang === 'moi' || r.tinh_trang === 'da_co_tai_khoan');
  if (!co.length) return;
  // Người đã có tài khoản dùng mật khẩu cũ nên không có mã để gửi.
  const coMa = co.filter(r => r.ma_kich_hoat && r.email);
  const ghiChu = (r) => r.ma_kich_hoat ? '' : 'Đã có tài khoản, dùng mật khẩu cũ';
  const appUrl = (window.NKTV_CONFIG && window.NKTV_CONFIG.appUrl) || location.origin + location.pathname;
  // Ảnh QR nhóm Zalo không đi kèm ds_dot vì nặng, nên lấy riêng ngay trước khi in.
  const inPhieu = async () => {
    const z = (d.zalo_link || d.co_zalo_qr) ? await S.db.zaloCuaDot(d.id).catch(() => null) : null;
    const the = h('div', { class: 'trang-in' }, h('div', { class: 'in-luoi', style: 'grid-template-columns:repeat(2,1fr)' }, co.map(r => h('div', { class: 'in-phieu' },
      h('b', null, r.ho_ten), h('br'), d.ten, h('br'),
      'Mã học viên: ', h('span', { class: 'ma' }, r.ma), h('br'),
      r.ma_kich_hoat ? ['Mã kích hoạt: ', h('span', { class: 'ma' }, r.ma_kich_hoat), h('br')] : ['Đã có tài khoản, dùng mật khẩu cũ.', h('br')],
      appUrl, h('br'),
      r.ma_kich_hoat ? 'Mở trang, chọn kích hoạt bằng mã, tự đặt mật khẩu. Mã dùng một lần, hết hạn sau 90 ngày.' : 'Mở trang và đăng nhập như đợt trước.',
      z && z.link ? [h('br'), 'Nhóm Zalo: ', z.link] : null,
      z && z.qr ? h('img', { src: z.qr, alt: 'Mã QR nhóm Zalo', style: 'display:block;width:96px;height:auto;margin-top:6px' }) : null))));
    document.body.append(the); window.print(); setTimeout(() => the.remove(), 500);
  };
  const chepTin = async () => {
    const chu = co.map(r => r.ma_kich_hoat
      ? `${r.ho_ten} · ${r.email}\nMã học viên: ${r.ma}\nMã kích hoạt: ${r.ma_kich_hoat}`
      : `${r.ho_ten} · ${r.email}\nMã học viên: ${r.ma}\nĐã có tài khoản, dùng mật khẩu cũ.`).join('\n\n');
    const zalo = d.zalo_link ? `\nNhóm Zalo của lớp: ${d.zalo_link}` : '';
    const tron = `${d.ten}\nMở ${appUrl}, chọn "Kích hoạt bằng mã", tự đặt mật khẩu.${zalo}\n\n${chu}`;
    try { await navigator.clipboard.writeText(tron); toast('Đã chép ' + co.length + ' dòng'); }
    catch (_) { toast('Không chép được. Dùng Tải CSV.', true); }
  };
  moSheet({
    tieuDe: `Bảng gửi học viên · ${co.length} người`,
    noiDung: h('div', null,
      h('div', { class: 'bang-tin' }, 'Mã kích hoạt chỉ hiện một lần này. Tải tệp hoặc in phiếu ngay. Cần mã mới thì vào Danh sách học viên cấp lại.'),
      coMa.length && batGuiThu() ? h('button', {
        class: 'nut day', type: 'button', style: 'margin-bottom:12px',
        onclick: (e) => guiMaQuaEmail(d, coMa, e.currentTarget)
      }, `Gửi email cho ${coMa.length} người`) : null,
      coMa.length && !batGuiThu() ? h('p', { class: 'chu-nho', style: 'margin-bottom:12px' },
        'Gửi thư tự động đang tắt. Quản trị bật ở Quản lý › Gửi thư, rồi quay lại cấp mã là gửi được.') : null,
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
  // Chưa nhận thư: chưa gửi lần nào, hoặc lần gửi gần nhất bị lỗi. Người đã kích hoạt rồi thì thôi.
  const chuaNhanThu = hv.filter(x => !x.da_kich_hoat && x.thu_trang_thai !== 'da_gui');
  const nhanThu = (x) => x.thu_luc
    ? (x.thu_trang_thai === 'da_gui' ? 'Đã gửi thư ' + ngay(x.thu_luc) : 'Thư lỗi ' + ngay(x.thu_luc))
    : null;

  const vungDs = h('div');
  const ve = () => {
    const k = boDau(tim);
    const theoLoc = hv.filter(x =>
      (loc === 'tat' ? true
        : loc === 'da' ? x.da_kich_hoat
        : loc === 'ma' ? !x.da_kich_hoat && x.ma_con_han
        : loc === 'thu' ? !x.da_kich_hoat && x.thu_trang_thai !== 'da_gui'
        : !x.da_kich_hoat && !x.ma_con_han)
      && (!k || boDau([x.ho_ten, x.ma, x.email, x.mssv, x.lop].join(' ')).includes(k)));
    dat(vungDs,
      h('div', { class: 'nhan-nhom' }, theoLoc.length + ' người'),
      theoLoc.length ? h('div', { class: 'nhom' }, theoLoc.map(x => dong({
        tieu: x.ho_ten,
        phu: [x.ma, x.email, nhanThu(x) || x.lop, x.mssv].filter(Boolean).join(' · '),
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
          x.mssv ? dong({ tieu: 'MSSV', sau: x.mssv, muiTen: false }) : null,
          x.lop ? dong({ tieu: 'Lớp', sau: x.lop, muiTen: false }) : null,
          dong({ tieu: 'Tài khoản', sau: x.da_kich_hoat ? 'Đã kích hoạt' : x.ma_con_han ? 'Đã cấp mã, chưa dùng' : 'Chưa cấp mã', muiTen: false }),
          dong({ tieu: 'Thư báo mã', sau: x.thu_luc
            ? (x.thu_trang_thai === 'da_gui' ? 'Đã gửi ' + ngayGio(x.thu_luc) : 'Lỗi ' + ngayGio(x.thu_luc))
            : 'Chưa gửi', muiTen: false })),
        batGuiThu() && !x.da_kich_hoat ? h('p', { class: 'chu-nho', style: 'margin-bottom:10px' },
          'Mã cũ đã băm nên không gửi lại được. Cấp mã mới rồi app cho gửi email ngay sau đó.') : null,
        h('button', { class: 'nut day', type: 'button', onclick: async () => {
          if (x.da_kich_hoat && !await xacNhan({ tieuDe: 'Cấp lại mã?', chu: 'Mật khẩu cũ vẫn dùng được cho đến khi bạn ấy đặt mật khẩu mới bằng mã.', nut: 'Cấp lại' })) return;
          const kq = await thu(() => S.db.capMaKichHoatHV(id, [x.id]));
          if (kq) { s.dong(); hienMaHV(kq.map(r => ({ id: r.id, ho_ten: r.ho_ten, email: r.email, ma: r.ma, ma_kich_hoat: r.ma_kich_hoat, tinh_trang: 'moi' })), d); lai(); }
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
      if (kq) { hienMaHV(kq.map(r => ({ id: r.id, ho_ten: r.ho_ten, email: r.email, ma: r.ma, ma_kich_hoat: r.ma_kich_hoat, tinh_trang: 'moi' })), d); lai(); }
    } }, `Cấp mã cho ${chuaCapMa.length} người chưa có`) : null,
    // Mã cũ chỉ còn bản băm nên muốn gửi lại thì phải cấp mã mới. Nút này làm liền hai việc đó.
    batGuiThu() && chuaNhanThu.length ? h('button', { class: 'nut phu day', type: 'button', style: 'margin-bottom:18px', onclick: async () => {
      if (!await xacNhan({ tieuDe: `Cấp mã mới và gửi email cho ${chuaNhanThu.length} người?`,
        chu: 'Mã cũ của những người này hết dùng được. Ai đã kích hoạt rồi thì không nằm trong danh sách.', nut: 'Cấp và gửi' })) return;
      const kq = await thu(() => S.db.capMaKichHoatHV(id, chuaNhanThu.map(x => x.id)));
      if (kq) { hienMaHV(kq.map(r => ({ id: r.id, ho_ten: r.ho_ten, email: r.email, ma: r.ma, ma_kich_hoat: r.ma_kich_hoat, tinh_trang: 'moi' })), d); lai(); }
    } }, `Cấp mã mới và gửi email cho ${chuaNhanThu.length} người chưa nhận thư`) : null,
    hv.length ? h('div', { class: 'hang-nut', style: 'margin-bottom:12px' },
      h('button', { class: 'nut phu', type: 'button', onclick: () => taiCSV(`hoc-vien-${d.ma}.csv`,
        [['Mã học viên', 'Họ và tên', 'Email', 'MSSV', 'Lớp', 'Tài khoản', 'Thư báo mã'],
          ...hv.map(x => [x.ma, x.ho_ten, x.email, x.mssv, x.lop,
            x.da_kich_hoat ? 'Đã kích hoạt' : x.ma_con_han ? 'Đã cấp mã, chưa dùng' : 'Chưa cấp mã',
            nhanThu(x) || 'Chưa gửi'])]) }, 'Xuất CSV')) : null,
    hv.length ? h('input', { class: 'tim', type: 'search', placeholder: 'Tìm tên, mã, email, trường…', 'aria-label': 'Tìm học viên', oninput: (e) => { tim = e.target.value; ve(); } }) : null,
    hv.length ? h('div', { class: 'chon-ngang' }, vien('Tất cả', 'tat'), vien('Đã kích hoạt', 'da'), vien('Đã cấp mã', 'ma'), vien('Chưa cấp mã', 'chua'),
      batGuiThu() ? vien('Chưa nhận thư', 'thu') : null) : null,
    vungDs);
  if (hv.length) ve();
}

/* ---------- Thư đã gửi của đợt (migration 0016) ---------- */
async function manThuDot(vung, id) {
  const dsDot = await S.db.dsDot();
  const d = dsDot.find(x => x.id === id);
  if (!d) return dat(vung, thanh('Thư đã gửi', '#tap-huan'), rong('Không tìm thấy đợt này.'));
  if (!laBtcQuanLy(id)) return dat(vung, thanh('Thư đã gửi', '#tap-huan/' + id, d.ma),
    rong('Chỉ trưởng ban, thư ký của đợt và quản trị xem được nhật ký thư.'));
  const ds = await S.db.dsThuDaGui(id);
  const thanhCong = ds.filter(x => x.trang_thai === 'da_gui');
  const hong = ds.filter(x => x.trang_thai === 'loi');

  dat(vung,
    thanh('Thư đã gửi', '#tap-huan/' + id, d.ma),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:16px' }, d.ten),
    !ds.length ? rong(batGuiThu()
      ? 'Chưa gửi thư nào. Vào Danh sách học viên, cấp mã rồi bấm gửi email.'
      : 'Chưa gửi thư nào, và gửi thư tự động đang tắt. Quản trị bật ở Quản lý › Gửi thư.') : null,
    ds.length ? soLieu([
      { so: thanhCong.length, ten: 'Đã gửi', lop: 'dung' },
      { so: hong.length, ten: 'Chưa gửi được', lop: hong.length ? 'vang' : '' }
    ]) : null,
    ds.length ? h('div', { class: 'bang-tin' }, 'Nhật ký chỉ ghi gửi được hay không, không ghi nội dung mã. Thư đã gửi vẫn có thể rơi vào hộp Spam của người nhận.') : null,
    ds.length ? h('div', { class: 'hang-nut', style: 'margin:12px 0 16px' },
      h('button', { class: 'nut phu', type: 'button', onclick: () => taiCSV(`thu-da-gui-${d.ma}.csv`,
        [['Lúc', 'Họ và tên', 'Mã học viên', 'Email', 'Kết quả', 'Lý do', 'Người gửi'],
          ...ds.map(x => [ngayGio(x.luc), x.ho_ten || '', x.ma || '', x.email,
            x.trang_thai === 'da_gui' ? 'Đã gửi' : 'Lỗi', x.loi || '', x.gui_boi || ''])]) }, 'Xuất CSV')) : null,
    hong.length ? nhom('Chưa gửi được', hong.map(x => dong({
      tieu: x.ho_ten || x.email, phu: [x.email, ngayGio(x.luc)].filter(Boolean).join(' · '),
      sau: h('span', { class: 'the-nhan vang' }, x.loi || 'Lỗi'), muiTen: false
    }))) : null,
    thanhCong.length ? nhom('Đã gửi', thanhCong.map(x => dong({
      tieu: x.ho_ten || x.email, phu: [x.email, ngayGio(x.luc)].filter(Boolean).join(' · '),
      sau: h('span', { class: 'the-nhan dung' }, 'Đã gửi'), muiTen: false
    }))) : null);
}

/* ---------- Nhóm Zalo của đợt (migration 0017) ----------

   Thư ký hoặc điều hành tạo nhóm Zalo trước khi nạp danh sách, rồi dán link và ảnh QR vào đây.
   Link và QR đi kèm thư báo mã kích hoạt, hiện trên màn hình Hôm nay của học viên và in lên phiếu. */

/** Thu nhỏ ảnh QR về PNG rộng tối đa 600 px, nền trắng để quét được. */
async function nenQR(tep) {
  const u = URL.createObjectURL(tep);
  try {
    const anh = await new Promise((ok, loi) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => loi(new Error('Không đọc được hình này.')); i.src = u; });
    const k = Math.min(1, 600 / Math.max(anh.naturalWidth, anh.naturalHeight));
    const cv = document.createElement('canvas');
    cv.width = Math.round(anh.naturalWidth * k); cv.height = Math.round(anh.naturalHeight * k);
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.drawImage(anh, 0, 0, cv.width, cv.height);
    const kq = cv.toDataURL('image/png');
    if (kq.length > 1400000) throw new Error('Ảnh quá lớn. Cắt gọn quanh mã QR rồi thử lại.');
    return kq;
  } finally { URL.revokeObjectURL(u); }
}

async function manZaloDot(vung, id) {
  const dsDot = await S.db.dsDot();
  const d = dsDot.find(x => x.id === id);
  if (!d) return dat(vung, thanh('Nhóm Zalo', '#tap-huan'), rong('Không tìm thấy đợt này.'));
  if (!laBtcQuanLy(id)) return dat(vung, thanh('Nhóm Zalo', '#tap-huan/' + id, d.ma),
    rong('Chỉ trưởng ban, thư ký của đợt và quản trị đặt được nhóm Zalo.'));
  const z = (await S.db.zaloCuaDot(id)) || {};
  const lai = () => manZaloDot(vung, id);
  let qr = z.qr || null;

  const khungQR = h('div', { class: 'hinh-soan' });
  const chonAnh = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: async (e) => {
    const t = e.target.files[0]; e.target.value = ''; if (!t) return;
    const kq = await thu(() => nenQR(t));
    if (kq) { qr = kq; veQR(); }
  } });
  const veQR = () => dat(khungQR,
    qr ? h('img', { src: qr, alt: 'Mã QR nhóm Zalo' }) : null, chonAnh,
    h('button', { class: 'nut-chu', type: 'button', onclick: () => chonAnh.click() }, qr ? 'Đổi ảnh QR' : 'Chọn ảnh QR'),
    qr ? h('button', { class: 'nut-chu', type: 'button', style: 'color:var(--vang)', onclick: () => { qr = null; veQR(); } }, 'Bỏ ảnh') : null);
  veQR();

  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const link = e.target.link.value.trim();
      if (link && !/^https?:\/\//i.test(link)) return toast('Link nhóm Zalo phải bắt đầu bằng https://', true);
      if (await thu(() => S.db.luuDot(id, { zalo_link: link, zalo_qr: qr || '' }), 'Đã lưu nhóm Zalo')) lai();
    }
  },
    h('div', { class: 'nhom' }, oNhap('Link nhóm Zalo', { name: 'link', value: z.link || '', placeholder: 'https://zalo.me/g/…', type: 'url' })),
    h('div', { class: 'nhan-nhom' }, 'Ảnh mã QR của nhóm'),
    khungQR,
    h('button', { class: 'nut day', type: 'submit', style: 'margin-top:14px' }, 'Lưu'));

  dat(vung,
    thanh('Nhóm Zalo', '#tap-huan/' + id, d.ma),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:16px' }, d.ten),
    h('div', { class: 'bang-tin xanh' }, 'Tạo nhóm Zalo trước khi nạp danh sách. Link và mã QR ở đây sẽ đi kèm thư báo mã kích hoạt, hiện trên màn hình Hôm nay của học viên và in lên phiếu.'),
    f,
    h('p', { class: 'chu-nho', style: 'margin-top:14px' }, 'Trong Zalo: mở nhóm → Tùy chọn → Link tham gia nhóm. Chép link và lưu ảnh QR về máy, rồi dán vào đây. Đổi link thì các thư đã gửi vẫn mang link cũ.'));
}

/* ---------- Ảnh nhận diện khóa học ----------

   Ban Truyền thông làm ảnh theo bản yêu cầu; thư ký chọn tệp ở đây. App tự cắt giữa cho đúng tỉ lệ,
   thu về đúng cỡ trong ANH_DOT rồi nén WebP, nên thư ký không phải tự cắt ảnh.
   Ảnh vừa chọn giữ dạng data URL tới khi bấm Lưu; api.luuNhanDienDot đưa lên kho ảnh Supabase Storage
   rồi lưu đường dẫn vào dot.nhan_dien (migration 0023). Kho nhận tối đa 600 KB một ảnh. */
async function nenAnhDot(tep, c) {
  const u = URL.createObjectURL(tep);
  try {
    const anh = await new Promise((ok, loi) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => loi(new Error('Không đọc được hình này.')); i.src = u; });
    const W = anh.naturalWidth, H = anh.naturalHeight, tiLe = c.w / c.h;
    // Cắt phần giữa cho đúng tỉ lệ yêu cầu.
    let sw = W, sh = Math.round(W / tiLe);
    if (sh > H) { sh = H; sw = Math.round(H * tiLe); }
    const sx = Math.round((W - sw) / 2), sy = Math.round((H - sh) / 2);
    const cv = document.createElement('canvas');
    cv.width = c.w; cv.height = c.h;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(anh, sx, sy, sw, sh, 0, 0, c.w, c.h);
    // Safari cũ không xuất được WebP thì trả PNG: khi đó dùng JPEG cho ảnh nền, PNG cho biểu tượng (giữ nền trong).
    // Kho ảnh nhận tối đa 600 KB: hạ dần chất lượng nén tới khi vừa. Safari cũ không xuất được WebP thì dùng PNG cho ảnh vuông, JPEG cho ảnh còn lại.
    const kich = (u) => (u.length - u.indexOf(',') - 1) * 0.75;
    let kq;
    for (const q of [0.82, 0.7, 0.6, 0.5]) {
      kq = cv.toDataURL('image/webp', q);
      if (!kq.startsWith('data:image/webp')) kq = c.w === c.h ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', q);
      if (kich(kq) <= 614400) break;
    }
    const nang = kich(kq) > 614400;
    const canhBao = [];
    if (Math.abs(W / H - tiLe) > 0.03) canhBao.push(`Ảnh gốc ${W}×${H} không đúng tỉ lệ nên app đã cắt phần giữa. Xem lại phần bị cắt ở khung xem trước.`);
    if (W < c.w || H < c.h) canhBao.push(`Ảnh gốc nhỏ hơn cỡ yêu cầu ${c.w}×${c.h} nên sẽ hơi nhòe trên điện thoại. Nên xin Ban Truyền thông bản lớn hơn.`);
    if (nang) canhBao.push('Ảnh này vẫn quá 600 KB dù đã nén tối đa nên kho ảnh sẽ không nhận. Xin Ban Truyền thông bản ít chi tiết hơn rồi chọn lại.');
    return { url: kq, canhBao, nang };
  } finally { URL.revokeObjectURL(u); }
}

/** Độ tương phản giữa chữ trắng và màu nhấn, theo công thức WCAG. Dưới 4,5 thì chữ trên nút khó đọc. */
function tuongPhanVoiTrang(hex) {
  const kenh = (i) => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * kenh(1) + 0.7152 * kenh(3) + 0.0722 * kenh(5);
  return 1.05 / (L + 0.05);
}

async function manAnhDot(vung, id) {
  const dsDot = await S.db.dsDot();
  const d = dsDot.find(x => x.id === id);
  if (!d) return dat(vung, thanh('Ảnh nhận diện', '#tap-huan'), rong('Không tìm thấy đợt này.'));
  if (!laBtcQuanLy(id)) return dat(vung, thanh('Ảnh nhận diện', '#tap-huan/' + id, d.ma),
    rong('Chỉ quản trị, Ban cố vấn, trưởng ban và thư ký của đợt đặt được ảnh nhận diện.'));
  const o = Object.assign({}, nhanDien(d));
  const lai = () => manAnhDot(vung, id);
  // Vé xem trước: lấy đúng các buổi của đợt, giả như học viên đã điểm danh buổi đầu để thấy con mộc.
  const buoiDot = await S.db.dsBuoiDot(id).catch(() => []);
  const dau = buoiDot.slice().sort((a, b) => new Date(a.bat_dau) - new Date(b.bat_dau))[0];
  const buoiMau = buoiDot.map(b => Object.assign({}, b, { toi_vao: dau && b.id === dau.id ? (b.bat_dau || new Date().toISOString()) : null }));
  const nguoiMau = { ho_ten: 'Học Viên Mẫu', ma: 'HV00000', lop: 'Y2022A', mssv: '2250000' };

  const xemThu = h('div');
  const veXemThu = () => { const dd = Object.assign({}, d, { trang_thai: 'mo', nhan_dien: o });
    dat(xemThu, theKhoaHoc(dd, { nhanTT: 'Đang học', lopTT: 'dung', phu: khoang(d) }),
      h('div', { style: 'height:14px' }), veDiemDanh(dd, buoiMau, nguoiMau, { xemThu: true })); };

  // Ảnh nào còn quá nặng thì khóa nút Lưu và nói rõ ảnh nào.
  const nang = new Set(), canhNang = h('div');
  let nutLuu = null;
  const capNhatLuu = () => {
    if (nutLuu) nutLuu.disabled = nang.size > 0;
    dat(canhNang, nang.size ? h('div', { class: 'bang-tin', style: 'margin:8px 0 0' }, 'Chưa lưu được: ' + [...nang].map(k => ANH_DOT[k].ten).join(', ') + ' quá 600 KB. Chọn lại ảnh nhẹ hơn hoặc bỏ ảnh đó.') : null);
  };
  const o_anh = (k) => {
    const c = ANH_DOT[k];
    const khung = h('div', { class: 'o-anh-dot' + (c.w === c.h ? ' vuong' : c.h > c.w ? ' doc' : ''), style: `aspect-ratio:${c.w} / ${c.h}` });
    const ghiChu = h('div');
    const chon = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: async (e) => {
      const t = e.target.files[0]; e.target.value = ''; if (!t) return;
      const kq = await thu(() => nenAnhDot(t, c));
      if (!kq) return;
      o[k] = kq.url; kq.nang ? nang.add(k) : nang.delete(k); capNhatLuu(); ve();
      dat(ghiChu, kq.canhBao.map(x => h('div', { class: 'bang-tin', style: 'margin:8px 0 0' }, x)));
    } });
    const ve = () => {
      dat(khung, o[k] ? h('img', { src: o[k], alt: c.ten }) : h('span', null, `${c.w} × ${c.h}`));
      dat(nut,
        h('button', { class: 'nut-chu', type: 'button', onclick: () => chon.click() }, o[k] ? 'Đổi ảnh' : 'Chọn ảnh'),
        o[k] ? h('button', { class: 'nut-chu', type: 'button', style: 'color:var(--vang)', onclick: () => { delete o[k]; nang.delete(k); capNhatLuu(); dat(ghiChu); ve(); } }, 'Bỏ ảnh') : null);
      veXemThu();
    };
    const nut = h('div', { class: 'hang-nut-chu' });
    ve();
    return h('div', { class: 'nhom o-anh-nhom' },
      h('div', { class: 'o-anh-tieu' }, h('b', null, c.ten), h('span', null, `${c.w} × ${c.h} px`)),
      h('p', { class: 'chu-nho' }, c.chu),
      khung, chon, nut, ghiChu);
  };

  const canhBaoMau = h('div');
  const kiemMau = () => {
    const m = o.mau || MAU_MAC_DINH;
    const tp = tuongPhanVoiTrang(m);
    dat(canhBaoMau, tp < 4.5 ? h('div', { class: 'bang-tin', style: 'margin:8px 0 0' },
      `Chữ trắng trên màu này chỉ đạt độ tương phản ${tp.toFixed(1).replace('.', ',')}:1, dưới mức 4,5:1 nên khó đọc. Chọn màu đậm hơn.`) : null);
  };
  const oMau = h('input', { type: 'color', value: o.mau || MAU_MAC_DINH, oninput: (e) => { o.mau = e.target.value; maMau.textContent = o.mau; kiemMau(); veXemThu(); } });
  const maMau = h('code', null, o.mau || 'chưa đặt');
  kiemMau();

  dat(vung,
    thanh('Ảnh nhận diện', '#tap-huan/' + id, d.ma),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:16px' }, d.ten),
    h('div', { class: 'bang-tin xanh' }, 'Ban Truyền thông làm ảnh theo bản "Yêu cầu ảnh nhận diện khóa học". Chọn tệp ảnh ở từng ô, app tự cắt phần giữa cho đúng tỉ lệ và nén nhẹ lại. Thiếu ảnh nào thì app dùng nền màu ở chỗ đó.'),
    h('div', { class: 'nhan-nhom' }, 'Học viên sẽ thấy'),
    xemThu,
    Object.keys(ANH_DOT).map(o_anh),
    h('div', { class: 'nhom o-anh-nhom' },
      h('div', { class: 'o-anh-tieu' }, h('b', null, 'Màu nhấn của khóa'), maMau),
      h('p', { class: 'chu-nho' }, 'Màu của nút và nhãn khi học viên ở trong trang khóa này. Lấy theo màu chủ đạo của bộ ảnh.'),
      h('label', { class: 'o-mau' }, oMau, h('span', null, 'Chọn màu')),
      canhBaoMau),
    canhNang,
    nutLuu = h('button', { class: 'nut day', type: 'button', style: 'margin-top:6px', onclick: async () => {
      if (await thu(() => S.db.luuNhanDienDot(id, o), 'Đã lưu ảnh nhận diện')) lai();
    } }, 'Lưu'),
    h('p', { class: 'chu-nho', style: 'margin-top:14px' }, 'Không dùng ảnh có mặt người tham dự (ảnh recap, ảnh lớp học) làm ảnh nền khi chưa có đồng ý của họ.'));
  veXemThu();
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
