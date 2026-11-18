// Sau buổi (migration 0015), màn của Ban tổ chức: phản hồi và thắc mắc, bài thi và điểm,
// phiếu đánh giá, tiêu chí hoàn thành, xét kết quả và cấp giấy chứng nhận.
import { S } from './state.js';
import {
  h, dat, dong, nhom, moSheet, thu, toast, gio, ngay, ngayGio, soLieu, rong,
  oNhap, oChon, oBat, xacNhan, taiCSV, boDau, giaTriNgay, soVN
} from './ui.js';
import { PHAN, MUC, LOAI_YC, TT_YC, LOAI_CAU, icon, thanh, laBtcQuanLy, thayDuocDot } from './dot-chung.js';

const timDot = async (id) => (await S.db.dsDot()).find(x => x.id === id);
const chan = (vung, tieu, dot, ma, chu) => dat(vung, thanh(tieu, '#tap-huan/' + dot, ma || 'Đợt'), rong(chu));

/* ============================================================ Phản hồi và thắc mắc */
export async function manYeuCauDot(vung, dot) {
  const d = await timDot(dot);
  if (!d) return dat(vung, thanh('Phản hồi', '#tap-huan'), rong('Không tìm thấy đợt này.'));
  if (!thayDuocDot(dot)) return chan(vung, 'Phản hồi', dot, d.ma, 'Chỉ Ban tổ chức của đợt xem được mục này.');
  const ql = laBtcQuanLy(dot);
  const ds = await S.db.dsYeuCauDot(dot);
  const lai = () => manYeuCauDot(vung, dot);
  let loc = 'tat';

  const mo = (y) => {
    const f = h('form', { onsubmit: async (e) => {
      e.preventDefault();
      const v = f.elements;
      if (await thu(() => S.db.xuLyYeuCauDot(y.id, v.tt.value, v.tl.value), 'Đã lưu')) { s.dong(); lai(); }
    } },
      h('p', { class: 'chu-nho', style: 'margin-bottom:4px' }, [LOAI_YC[y.loai], ngayGio(y.luc), y.ho_ten].filter(Boolean).join(' · ')),
      h('div', { class: 'noi-dung-tb', style: 'margin-bottom:14px' }, y.noi_dung),
      h('div', { class: 'nhom' },
        oChon('Trạng thái', Object.keys(TT_YC).map(k => [k, TT_YC[k][0]]), y.trang_thai, { name: 'tt' }),
        oNhap('Trả lời cho người gửi', { the: 'textarea', name: 'tl', value: y.tra_loi || '', rows: 5 })),
      h('button', { class: 'nut day', type: 'submit' }, 'Lưu'));
    const s = moSheet({ tieuDe: LOAI_YC[y.loai], noiDung: ql ? f : h('div', null,
      h('p', { class: 'chu-nho', style: 'margin-bottom:4px' }, ngayGio(y.luc)),
      h('div', { class: 'noi-dung-tb' }, y.noi_dung),
      y.tra_loi ? h('div', { class: 'bang-tin xanh', style: 'margin-top:14px' }, 'Trả lời: ', y.tra_loi) : null) });
  };

  const vungDs = h('div');
  const ve = () => {
    const kq = ds.filter(y => loc === 'tat' || y.trang_thai === loc);
    dat(vungDs, kq.length ? h('div', { class: 'nhom' }, kq.map(y => dong({
      tieu: (y.ho_ten || (y.la_cua_toi ? 'Bạn gửi' : 'Học viên')) + ' · ' + LOAI_YC[y.loai],
      phu: [ngayGio(y.luc), y.noi_dung.slice(0, 70) + (y.noi_dung.length > 70 ? '…' : '')].join(' · '),
      sau: h('span', { class: 'the-nhan ' + TT_YC[y.trang_thai][1] }, TT_YC[y.trang_thai][0]),
      onclick: () => mo(y)
    }))) : rong('Không có mục nào.'));
  };
  const vien = (nhan, ma) => h('button', { class: 'vien', type: 'button', 'data-ma': ma, 'aria-pressed': loc === ma ? 'true' : 'false',
    onclick: (e) => { loc = ma; e.currentTarget.parentElement.querySelectorAll('.vien').forEach(v => v.setAttribute('aria-pressed', v.dataset.ma === ma ? 'true' : 'false')); ve(); } }, nhan);

  dat(vung,
    thanh('Phản hồi và thắc mắc', '#tap-huan/' + dot, d.ma),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:14px' }, d.ten),
    ds.length ? soLieu([
      { so: ds.filter(y => y.trang_thai === 'moi').length, ten: 'Mới', lop: 'vang' },
      { so: ds.filter(y => y.trang_thai === 'dang_xem').length, ten: 'Đang xem', lop: 'tre' },
      { so: ds.filter(y => y.trang_thai === 'xong').length, ten: 'Đã xong', lop: 'dung' }
    ]) : null,
    ds.length ? h('div', { class: 'chon-ngang' }, vien('Tất cả', 'tat'), vien('Mới', 'moi'), vien('Đang xem', 'dang_xem'), vien('Đã xong', 'xong')) : null,
    vungDs,
    h('p', { class: 'chu-nho', style: 'margin-bottom:22px' }, 'Mục này chỉ nhận chữ. App không cho đính tệp, để học viên không vô tình gửi giấy tờ sức khỏe lên máy chủ.'));
  ve();
}

/* ============================================================ Bài thi và điểm */
export async function manBaiThiDot(vung, dot, baiId) {
  const d = await timDot(dot);
  if (!d) return dat(vung, thanh('Bài thi', '#tap-huan'), rong('Không tìm thấy đợt này.'));
  if (!laBtcQuanLy(dot)) return chan(vung, 'Bài thi', dot, d.ma, 'Chỉ trưởng ban, thư ký của đợt và quản trị nhập được điểm.');
  const ds = await S.db.dsBaiThiDot(dot);
  if (baiId) {
    const b = ds.find(x => x.id === baiId);
    if (!b) return chan(vung, 'Bài thi', dot, d.ma, 'Không tìm thấy bài thi này.');
    return manNhapDiem(vung, dot, d, b);
  }
  const lai = () => manBaiThiDot(vung, dot);
  const tong = ds.reduce((s, b) => s + Number(b.trong_so), 0);

  const sua = (b) => {
    const f = h('form', { onsubmit: async (e) => {
      e.preventDefault();
      const v = f.elements;
      if (!v.ma.value.trim() || !v.ten.value.trim()) return toast('Cần mã và tên bài.', true);
      const o = { dot_id: dot, ma: v.ma.value.trim(), ten: v.ten.value.trim(), thang: v.thang.value, trong_so: v.ts.value, thu_tu: v.tt.value };
      if (await thu(() => S.db.luuBaiThiDot(b ? b.id : null, o), b ? 'Đã lưu' : 'Đã thêm bài thi')) { s.dong(); lai(); }
    } },
      h('div', { class: 'nhom' },
        oNhap('Mã bài', { name: 'ma', value: b ? b.ma : '', placeholder: 'VIET', autocapitalize: 'characters', required: true }),
        oNhap('Tên bài', { name: 'ten', value: b ? b.ten : '', placeholder: 'Bài viết', required: true }),
        oNhap('Thang điểm', { name: 'thang', type: 'number', min: 1, step: 'any', inputmode: 'decimal', value: b ? b.thang : 10 }),
        oNhap('Trọng số', { name: 'ts', type: 'number', min: 0.01, step: 'any', inputmode: 'decimal', value: b ? b.trong_so : 1 }),
        oNhap('Thứ tự hiện', { name: 'tt', type: 'number', inputmode: 'numeric', value: b ? b.thu_tu : 0 })),
      h('p', { class: 'chu-nho', style: 'margin-bottom:14px' }, 'Điểm tổng là trung bình có trọng số, quy về thang 10. Bài chưa có điểm tính là 0.'),
      h('button', { class: 'nut day', type: 'submit' }, b ? 'Lưu' : 'Thêm'),
      b ? h('button', { class: 'nut nguy day', type: 'button', style: 'margin-top:10px', onclick: async () => {
        if (!await xacNhan({ tieuDe: 'Xóa bài thi?', chu: 'Điểm đã nhập của bài này mất theo.', nut: 'Xóa', nguy: true })) return;
        if (await thu(() => S.db.xoaBaiThiDot(b.id), 'Đã xóa')) { s.dong(); lai(); }
      } }, 'Xóa bài thi') : null);
    const s = moSheet({ tieuDe: b ? 'Sửa bài thi' : 'Bài thi mới', noiDung: f });
  };

  dat(vung,
    thanh('Bài thi và điểm', '#tap-huan/' + dot, d.ma, h('button', { class: 'nut-lui', type: 'button', onclick: () => sua(null) }, 'Thêm')),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:14px' }, d.ten),
    h('div', { class: 'bang-tin xanh' }, 'Thi làm trên máy của CLB. App chỉ giữ điểm do Ban tổ chức dán vào, không có phần làm bài.'),
    ds.length ? nhom(null, ds.map(b => dong({
      tieu: b.ten,
      phu: [`mã ${b.ma}`, `thang ${soVN(b.thang)}`, `trọng số ${soVN(b.trong_so)}${tong ? ' (' + Math.round(b.trong_so / tong * 100) + '%)' : ''}`,
        `${b.so_diem} đã có điểm`].join(' · '),
      truoc: icon('bieu_do'), href: `#tap-huan/${dot}/bai-thi/${b.id}`
    }))) : rong('Chưa có bài thi nào. Bấm Thêm để tạo, ví dụ Bài viết trọng số 70 và Chạy trạm trọng số 30.'),
    ds.length ? nhom('Sửa bài', ds.map(b => dong({ tieu: b.ten, phu: 'Đổi tên, thang điểm, trọng số', onclick: () => sua(b), muiTen: false }))) : null);
}

/* ---------- Dán bảng điểm từ máy thi ---------- */
export function docBangDiem(chu) {
  const d0 = String(chu || '').replace(/\r/g, '').split('\n').filter(x => x.trim() !== '');
  if (!d0.length) return [];
  const dau = d0[0].includes('\t') ? '\t' : (d0[0].match(/;/g) || []).length > (d0[0].match(/,/g) || []).length ? ';' : ',';
  const tach = (l) => l.split(dau).map(x => x.trim().replace(/^"|"$/g, ''));
  const ra = [];
  d0.forEach((l, i) => {
    const o = tach(l);
    if (o.length < 2) return;
    // Bỏ dòng tên cột: ô thứ hai không phải số.
    if (i === 0 && !/^-?\d+([.,]\d+)?$/.test(o[1])) return;
    ra.push({ dong: String(i + 1), ma: o[0], diem: o[1], ghi_chu: o[2] || '' });
  });
  return ra;
}

const NHAN_DIEM = { ok: ['Mới', 'dung'], sua: ['Ghi đè điểm cũ', 'tre'], khong_thay: ['Không thấy', 'vang'], ngoai_dot: ['Ngoài đợt', 'vang'], loi: ['Lỗi', 'vang'] };

async function manNhapDiem(vung, dot, d, b) {
  const lai = () => manBaiThiDot(vung, dot, b.id);
  const hv = await S.db.dsHocVienDot(dot).catch(() => []);
  const xet = await S.db.xetKetQuaDot(dot).catch(() => []);
  const diemCua = new Map();
  xet.forEach(x => { const t = (x.diem || []).find(y => y.bai_id === b.id); if (t && t.diem !== null) diemCua.set(x.thanh_vien_id, t.diem); });

  const oDan = oNhap('Dán bảng điểm vào đây', { the: 'textarea', rows: 7, placeholder: 'Mỗi dòng: mã học viên, điểm. Dán thẳng từ máy thi hoặc Excel.' });
  const o = oDan.querySelector('textarea');
  const vungKQ = h('div');
  let dsGui = [];

  const veKQ = (kq, daGhi) => {
    const dem = kq.dem;
    dat(vungKQ,
      h('h2', { class: 'nhan-nhom', style: 'margin-top:4px' }, daGhi ? 'Đã ghi' : 'Xem trước · chưa ghi gì'),
      soLieu([
        { so: dem.ok, ten: 'Điểm mới', lop: 'dung' },
        { so: dem.sua, ten: 'Ghi đè điểm cũ', lop: 'tre' },
        { so: dem.loi, ten: 'Bỏ qua', lop: dem.loi ? 'vang' : '' }
      ]),
      !daGhi && (dem.ok + dem.sua) ? h('button', { class: 'nut day', type: 'button', style: 'margin-bottom:18px', onclick: async () => {
        if (!await xacNhan({ tieuDe: `Ghi ${dem.ok + dem.sua} điểm?`,
          chu: dem.sua ? `${dem.sua} người đã có điểm sẽ bị ghi đè bằng điểm mới.` : 'Dòng lỗi sẽ bỏ qua.', nut: 'Ghi điểm' })) return;
        const kq2 = await thu(() => S.db.nhapDiemDot(b.id, dsGui, true), 'Đã ghi điểm');
        if (kq2) { veKQ(kq2, true); lai(); }
      } }, `Ghi ${dem.ok + dem.sua} điểm`) : null,
      h('div', { class: 'nhom' }, kq.ds.map(r => dong({
        tieu: r.ho_ten || r.ma || '(trống)',
        phu: [r.ma, r.diem !== null && r.diem !== undefined ? 'điểm ' + soVN(r.diem) : null, r.ly_do].filter(Boolean).join(' · '),
        sau: h('span', { class: 'the-nhan ' + (NHAN_DIEM[r.tinh_trang] || ['', ''])[1] }, (NHAN_DIEM[r.tinh_trang] || ['', ''])[0]),
        muiTen: false
      }))));
    vungKQ.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const xemTruoc = async () => {
    const hang = docBangDiem(o.value);
    if (!hang.length) return toast('Chưa có dòng nào đọc được.', true);
    dsGui = hang;
    const kq = await thu(() => S.db.nhapDiemDot(b.id, hang, false));
    if (kq) veKQ(kq, false);
  };

  const coDiem = hv.filter(x => diemCua.has(x.id));
  dat(vung,
    thanh(b.ten, `#tap-huan/${dot}/bai-thi`, 'Bài thi'),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:14px' }, `${d.ma} · thang ${soVN(b.thang)} · trọng số ${soVN(b.trong_so)}`),
    soLieu([
      { so: coDiem.length, ten: `Đã có điểm / ${hv.length}`, lop: 'dung' },
      { so: hv.length - coDiem.length, ten: 'Chưa có', lop: hv.length - coDiem.length ? 'tre' : '' }
    ]),
    h('div', { class: 'bang-tin xanh' }, 'Mỗi dòng hai cột: mã học viên rồi điểm. Dán cả dòng tên cột cũng được, app tự bỏ. Dấu phẩy thập phân cũng đọc được.'),
    h('div', { class: 'nhom' }, oDan),
    h('div', { class: 'hang-nut', style: 'margin-bottom:18px' },
      h('button', { class: 'nut', type: 'button', onclick: xemTruoc }, 'Xem trước')),
    vungKQ,
    hv.length ? [h('div', { class: 'nhan-nhom' }, 'Bảng điểm hiện có'),
      h('div', { class: 'hang-nut', style: 'margin-bottom:12px' },
        h('button', { class: 'nut phu', type: 'button', onclick: () => taiCSV(`diem-${d.ma}-${b.ma}.csv`,
          [['Mã học viên', 'Họ và tên', 'Điểm'], ...hv.map(x => [x.ma, x.ho_ten, diemCua.has(x.id) ? diemCua.get(x.id) : ''])]) }, 'Xuất CSV')),
      h('div', { class: 'nhom' }, hv.slice().sort((x, y) => x.ho_ten.localeCompare(y.ho_ten, 'vi')).map(x => dong({
        tieu: x.ho_ten, phu: x.ma,
        sau: diemCua.has(x.id) ? h('b', null, soVN(diemCua.get(x.id))) : h('span', { class: 'the-nhan tre' }, 'Chưa có'),
        onclick: diemCua.has(x.id) ? async () => {
          if (!await xacNhan({ tieuDe: 'Xóa điểm của ' + x.ho_ten + '?', chu: 'Bài chưa có điểm tính là 0 khi xét kết quả.', nut: 'Xóa điểm', nguy: true })) return;
          if (await thu(() => S.db.xoaDiemDot(b.id, x.id), 'Đã xóa điểm')) lai();
        } : undefined,
        muiTen: false
      })))] : null);
}

/* ============================================================ Phiếu đánh giá */
export async function manPhieuDot(vung, dot, phieuId) {
  const d = await timDot(dot);
  if (!d) return dat(vung, thanh('Phiếu', '#tap-huan'), rong('Không tìm thấy đợt này.'));
  if (!laBtcQuanLy(dot)) return chan(vung, 'Phiếu', dot, d.ma, 'Chỉ trưởng ban, thư ký của đợt và quản trị soạn được phiếu.');
  const ds = await S.db.dsPhieuDot(dot);
  if (phieuId) {
    const f = ds.find(x => x.id === phieuId);
    if (!f) return chan(vung, 'Phiếu', dot, d.ma, 'Không tìm thấy phiếu này.');
    return manTongHopPhieu(vung, dot, d, f);
  }
  const lai = () => manPhieuDot(vung, dot);

  const docCau = (chu) => String(chu || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const m = l.match(/^\[(thang5|chon|chu)\]\s*(.*)$/i);
    const loai = m ? m[1].toLowerCase() : 'thang5';
    let nd = m ? m[2] : l;
    let lua = null;
    const p = nd.split('|');
    if (loai === 'chon' && p.length > 1) { nd = p[0].trim(); lua = p.slice(1).map(x => x.trim()).filter(Boolean); }
    return { noi_dung: nd, loai, lua_chon: lua, bat_buoc: !/\(không bắt buộc\)$/i.test(nd) };
  }).filter(c => c.noi_dung);
  const vietCau = (cau) => (cau || []).map(c =>
    (c.loai === 'thang5' ? '' : '[' + c.loai + '] ') + c.noi_dung + (c.lua_chon ? ' | ' + c.lua_chon.join(' | ') : '')).join('\n');

  const sua = (f) => {
    const daGui = f && f.so_gui > 0;
    const fo = h('form', { onsubmit: async (e) => {
      e.preventDefault();
      const v = fo.elements;
      if (!v.ten.value.trim()) return toast('Cần tên phiếu.', true);
      const o = { dot_id: dot, ten: v.ten.value.trim(), mo_ta: v.mt.value.trim(), an_danh: v.ad.checked, mo: v.mo.checked, han: v.han.value ? v.han.value + 'T23:59:00+07:00' : '' };
      if (!daGui) o.cau = docCau(v.cau.value);
      if (!daGui && !o.cau.length) return toast('Chưa có câu nào.', true);
      if (await thu(() => S.db.luuPhieuDot(f ? f.id : null, o), f ? 'Đã lưu' : 'Đã tạo phiếu')) { s.dong(); lai(); }
    } },
      h('div', { class: 'nhom' },
        oNhap('Tên phiếu', { name: 'ten', value: f ? f.ten : 'Phiếu đánh giá cuối đợt', required: true }),
        oNhap('Mô tả', { name: 'mt', value: f ? f.mo_ta || '' : '' }),
        oNhap('Hạn gửi (hết ngày)', { name: 'han', type: 'date', value: f && f.han ? giaTriNgay(f.han) : '' }),
        oBat('Ẩn danh', { name: 'ad', checked: f ? f.an_danh : true, disabled: daGui }),
        oBat('Mở cho học viên gửi', { name: 'mo', checked: f ? f.mo : false })),
      daGui ? h('div', { class: 'bang-tin' }, 'Phiếu đã có ', String(f.so_gui), ' người gửi nên không sửa được câu hỏi và chế độ ẩn danh nữa.') : null,
      daGui ? null : h('div', { class: 'nhom' }, oNhap('Các câu hỏi', { the: 'textarea', name: 'cau', rows: 10, value: f ? vietCau(f.cau) : 'Buổi học có ích với bạn không?\nTập huấn viên giảng dễ hiểu không?\n[chu] Điều bạn muốn Ban tổ chức làm khác đi (không bắt buộc)' })),
      daGui ? null : h('p', { class: 'chu-nho', style: 'margin-bottom:14px' }, 'Mỗi dòng một câu, mặc định là thang 1 đến 5. Mở đầu bằng [chu] để người ta viết chữ, [chon] để chọn một đáp án rồi ngăn các đáp án bằng dấu |. Kết thúc bằng "(không bắt buộc)" thì câu đó bỏ trống được.'),
      h('p', { class: 'chu-nho', style: 'margin-bottom:14px' }, 'Phiếu ẩn danh: dòng trả lời không gắn với người gửi và giờ gửi làm tròn theo ngày. App vẫn biết ai đã gửi, để tính tiêu chí hoàn thành, nhưng không nối được người với câu trả lời.'),
      h('button', { class: 'nut day', type: 'submit' }, f ? 'Lưu' : 'Tạo phiếu'),
      f ? h('button', { class: 'nut nguy day', type: 'button', style: 'margin-top:10px', onclick: async () => {
        if (!await xacNhan({ tieuDe: 'Xóa phiếu?', chu: 'Toàn bộ câu trả lời đã gửi mất theo.', nut: 'Xóa', nguy: true })) return;
        if (await thu(() => S.db.xoaPhieuDot(f.id), 'Đã xóa')) { s.dong(); lai(); }
      } }, 'Xóa phiếu') : null);
    const s = moSheet({ tieuDe: f ? 'Sửa phiếu' : 'Phiếu mới', noiDung: fo });
  };

  dat(vung,
    thanh('Phiếu đánh giá', '#tap-huan/' + dot, d.ma, h('button', { class: 'nut-lui', type: 'button', onclick: () => sua(null) }, 'Thêm')),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:14px' }, d.ten),
    ds.length ? nhom(null, ds.map(f => dong({
      tieu: f.ten,
      phu: [f.an_danh ? 'ẩn danh' : 'có tên', `${f.so_cau} câu`, `${f.so_gui} người gửi`,
        f.mo ? 'đang mở' : 'chưa mở', f.han ? 'hạn ' + ngay(f.han) : null].filter(Boolean).join(' · '),
      truoc: icon('phieu'), href: `#tap-huan/${dot}/phieu/${f.id}`
    }))) : rong('Chưa có phiếu nào.'),
    ds.length ? nhom('Sửa phiếu', ds.map(f => dong({ tieu: f.ten, phu: 'Đổi câu hỏi, mở hoặc đóng', onclick: () => sua(f), muiTen: false }))) : null);
}

async function manTongHopPhieu(vung, dot, d, f) {
  const t = await S.db.tongHopPhieuDot(f.id);
  const soCau = (ds) => { const o = {}; (ds || []).forEach(x => { o[x] = (o[x] || 0) + 1; }); return o; };
  const tb = (ds) => { const s = (ds || []).map(Number).filter(x => !Number.isNaN(x)); return s.length ? s.reduce((a, b) => a + b, 0) / s.length : null; };

  dat(vung,
    thanh('Tổng hợp phiếu', `#tap-huan/${dot}/phieu`, 'Phiếu'),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:14px' }, f.ten, ' · ', d.ma),
    soLieu([{ so: t.so_gui, ten: 'Người đã gửi', lop: 'dung' }]),
    t.an_danh ? h('div', { class: 'bang-tin' }, 'Phiếu ẩn danh: app biết ai đã gửi nhưng không nối được người với câu trả lời, nên không có bảng từng người.') : null,
    (t.cau || []).map(c => h('div', { class: 'nhom', style: 'padding:13px 14px' },
      h('p', { style: 'font-weight:600;line-height:1.35' }, c.noi_dung),
      h('p', { class: 'chu-nho', style: 'margin:4px 0 8px' }, LOAI_CAU[c.loai] || c.loai, ' · ', String((c.tra_loi || []).length), ' câu trả lời'),
      c.loai === 'thang5' && tb(c.tra_loi) !== null
        ? h('p', null, 'Trung bình ', h('b', null, soVN(tb(c.tra_loi), 2)), ' trên 5')
        : null,
      c.loai === 'chu'
        ? h('div', null, (c.tra_loi || []).slice(0, 50).map(x => h('p', { class: 'noi-dung-tb', style: 'margin-top:6px;padding-left:10px;border-left:3px solid var(--be-mat-2)' }, x)))
        : h('div', null, Object.entries(soCau(c.tra_loi)).sort((a, b) => b[1] - a[1]).map(([k, n]) =>
            h('p', { class: 'chu-nho' }, k, ': ', h('b', null, String(n))))))),
    !t.an_danh && (t.ds || []).length ? [h('div', { class: 'nhan-nhom' }, 'Từng người'),
      h('div', { class: 'nhom' }, t.ds.map(x => dong({ tieu: x.ho_ten || 'Không rõ', phu: [x.ma, ngayGio(x.luc)].filter(Boolean).join(' · '), muiTen: false })))] : null);
}

/* ============================================================ Tiêu chí hoàn thành */
export async function manTieuChiDot(vung, dot) {
  const d = await timDot(dot);
  if (!d) return dat(vung, thanh('Tiêu chí', '#tap-huan'), rong('Không tìm thấy đợt này.'));
  if (!laBtcQuanLy(dot)) return chan(vung, 'Tiêu chí', dot, d.ma, 'Chỉ trưởng ban, thư ký của đợt và quản trị đặt được tiêu chí.');
  const [ds, buoi, phieu] = await Promise.all([S.db.dsTieuChiDot(dot), S.db.dsBuoiDot(dot), S.db.dsPhieuDot(dot)]);
  const lai = () => manTieuChiDot(vung, dot);
  const nguong = (d.cai_dat && d.cai_dat.nguong_xuat_sac) || '';

  const moTa = (x) => {
    if (x.loai === 'co_mat_buoi') return 'Có mặt buổi: ' + (x.buoi_ten || 'buổi đã xóa');
    if (x.loai === 'co_mat_phan') return `Có mặt ít nhất ${x.so_buoi || 1} buổi phần ${PHAN[x.phan] || x.phan}`;
    if (x.loai === 'diem_tong') return 'Điểm tổng từ ' + soVN(x.nguong);
    if (x.loai === 'gui_phieu') return 'Đã gửi phiếu: ' + (x.phieu_ten || 'phiếu đã xóa');
    return x.loai;
  };

  const them = (cu) => {
    const vungRieng = h('div');
    const veRieng = (loai) => dat(vungRieng,
      loai === 'co_mat_buoi' ? h('div', { class: 'nhom' }, oChon('Buổi', buoi.map(b => [b.id, `${ngay(b.bat_dau)} · ${b.ten}`]), cu ? cu.buoi_id : '', { name: 'buoi' })) :
      loai === 'co_mat_phan' ? h('div', { class: 'nhom' },
        oChon('Phần', Object.keys(PHAN).map(k => [k, PHAN[k]]), cu ? cu.phan : 'thuc_hanh', { name: 'phan' }),
        oNhap('Ít nhất bao nhiêu buổi', { name: 'sb', type: 'number', min: 1, inputmode: 'numeric', value: cu ? cu.so_buoi || 1 : 1 })) :
      loai === 'diem_tong' ? h('div', { class: 'nhom' }, oNhap('Điểm tổng tối thiểu (thang 10)', { name: 'ng', type: 'number', min: 0, max: 10, step: 'any', inputmode: 'decimal', value: cu ? cu.nguong : 6 })) :
      loai === 'gui_phieu' ? h('div', { class: 'nhom' }, phieu.length ? oChon('Phiếu', phieu.map(f => [f.id, f.ten]), cu ? cu.phieu_id : '', { name: 'phieu' }) : h('p', { class: 'bang-tin' }, 'Chưa có phiếu nào. Tạo phiếu trước rồi quay lại.')) : null);

    const f = h('form', { onsubmit: async (e) => {
      e.preventDefault();
      const v = f.elements;
      if (!v.ten.value.trim()) return toast('Cần tên tiêu chí.', true);
      const o = { ten: v.ten.value.trim(), loai: v.loai.value, cot_loi: v.cl.checked };
      if (o.loai === 'co_mat_buoi') o.buoi_id = v.buoi ? v.buoi.value : '';
      if (o.loai === 'co_mat_phan') { o.phan = v.phan.value; o.so_buoi = v.sb.value; }
      if (o.loai === 'diem_tong') o.nguong = v.ng.value;
      if (o.loai === 'gui_phieu') o.phieu_id = v.phieu ? v.phieu.value : '';
      if ((o.loai === 'co_mat_buoi' && !o.buoi_id) || (o.loai === 'gui_phieu' && !o.phieu_id)) return toast('Chưa chọn được mục cho tiêu chí này.', true);
      const moi = ds.filter(x => x.id !== (cu && cu.id)).map(x => ({
        ten: x.ten, loai: x.loai, buoi_id: x.buoi_id, phan: x.phan, so_buoi: x.so_buoi, nguong: x.nguong, phieu_id: x.phieu_id, cot_loi: x.cot_loi
      })).concat([o]);
      if (await thu(() => S.db.luuTieuChiDot(dot, moi), 'Đã lưu tiêu chí')) { s.dong(); lai(); }
    } },
      h('div', { class: 'nhom' },
        oNhap('Tên tiêu chí', { name: 'ten', value: cu ? cu.ten : '', placeholder: 'Dự buổi lượng giá', required: true }),
        oChon('Loại', [['co_mat_buoi', 'Có mặt một buổi'], ['co_mat_phan', 'Có mặt một phần'], ['diem_tong', 'Điểm tổng'], ['gui_phieu', 'Đã gửi phiếu']],
          cu ? cu.loai : 'co_mat_buoi', { name: 'loai', onchange: (e) => veRieng(e.target.value) }),
        oBat('Cốt lõi (thiếu là chưa hoàn thành)', { name: 'cl', checked: cu ? cu.cot_loi : true })),
      vungRieng,
      h('button', { class: 'nut day', type: 'submit' }, cu ? 'Lưu' : 'Thêm'));
    veRieng(cu ? cu.loai : 'co_mat_buoi');
    const s = moSheet({ tieuDe: cu ? 'Sửa tiêu chí' : 'Tiêu chí mới', noiDung: f });
  };

  const xoa = async (x) => {
    if (!await xacNhan({ tieuDe: 'Xóa tiêu chí?', chu: x.ten, nut: 'Xóa', nguy: true })) return;
    const moi = ds.filter(y => y.id !== x.id).map(y => ({
      ten: y.ten, loai: y.loai, buoi_id: y.buoi_id, phan: y.phan, so_buoi: y.so_buoi, nguong: y.nguong, phieu_id: y.phieu_id, cot_loi: y.cot_loi
    }));
    if (await thu(() => S.db.luuTieuChiDot(dot, moi), 'Đã xóa')) lai();
  };

  dat(vung,
    thanh('Tiêu chí hoàn thành', '#tap-huan/' + dot, d.ma, h('button', { class: 'nut-lui', type: 'button', onclick: () => them(null) }, 'Thêm')),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:14px' }, d.ten),
    h('div', { class: 'bang-tin xanh' },
      'Thiếu một tiêu chí cốt lõi thì chỉ là "Tham dự". Đủ cốt lõi mà thiếu bổ sung thì "Hoàn thành có ghi chú", phần thiếu in lên giấy. Đủ hết và đạt ngưỡng dưới đây thì "Xuất sắc".'),
    ds.filter(x => x.cot_loi).length ? nhom('Cốt lõi', ds.filter(x => x.cot_loi).map(x => dong({
      tieu: x.ten, phu: moTa(x), sau: h('button', { class: 'vien', type: 'button', onclick: (e) => { e.stopPropagation(); e.preventDefault(); xoa(x); } }, 'Xóa'),
      onclick: () => them(x), muiTen: false
    }))) : null,
    ds.filter(x => !x.cot_loi).length ? nhom('Bổ sung', ds.filter(x => !x.cot_loi).map(x => dong({
      tieu: x.ten, phu: moTa(x), sau: h('button', { class: 'vien', type: 'button', onclick: (e) => { e.stopPropagation(); e.preventDefault(); xoa(x); } }, 'Xóa'),
      onclick: () => them(x), muiTen: false
    }))) : null,
    ds.length ? null : rong('Chưa có tiêu chí nào. Không có tiêu chí thì ai cũng được xét là Hoàn thành.'),
    h('div', { class: 'nhom' }, oNhap('Ngưỡng điểm cho mức Xuất sắc (để trống là không xét xuất sắc)', {
      name: 'nx', type: 'number', min: 0, max: 10, step: 'any', inputmode: 'decimal', value: nguong,
      onchange: async (e) => {
        const v = e.target.value === '' ? null : Number(e.target.value);
        await thu(() => S.db.datCaiDatDot(dot, { nguong_xuat_sac: v }), 'Đã lưu ngưỡng xuất sắc');
      }
    })),
    h('p', { class: 'chu-nho', style: 'margin-bottom:22px' }, 'Đổi tiêu chí rồi thì vào Kết quả và chứng nhận xét lại; giấy đã cấp không tự đổi theo.'));
}

/* ============================================================ Kết quả và chứng nhận */
export async function manKetQuaDot(vung, dot) {
  const d = await timDot(dot);
  if (!d) return dat(vung, thanh('Kết quả', '#tap-huan'), rong('Không tìm thấy đợt này.'));
  if (!laBtcQuanLy(dot)) return chan(vung, 'Kết quả', dot, d.ma, 'Chỉ trưởng ban, thư ký của đợt và quản trị xét được kết quả.');
  const [ds, tieuChi] = await Promise.all([S.db.xetKetQuaDot(dot), S.db.dsTieuChiDot(dot)]);
  const lai = () => manKetQuaDot(vung, dot);
  let loc = 'tat', tim = '';

  const demMuc = (m) => ds.filter(x => x.xet.muc === m).length;
  const chuaCap = ds.filter(x => !x.chung_nhan);

  const inGiay = (ds2) => {
    const the = h('div', { class: 'trang-in' }, ds2.map(x => h('div', { class: 'in-giay' },
      h('div', { class: 'ten-clb' }, 'CLB NGOẠI KHOA TRƯNG VƯƠNG'),
      h('div', { class: 'phu' }, 'Trường Đại học Y khoa Phạm Ngọc Thạch'),
      h('h2', null, 'GIẤY CHỨNG NHẬN'),
      h('p', null, 'Chứng nhận'),
      h('div', { class: 'ten' }, x.ho_ten),
      h('p', null, 'đã tham gia ', h('b', null, d.ten), x.xet.diem_tong !== null && x.xet.diem_tong !== undefined ? [' với điểm tổng ', h('b', null, soVN(x.xet.diem_tong, 2)), '/10'] : null),
      h('div', { class: 'muc' }, 'Kết quả: ' + MUC[x.chung_nhan ? x.chung_nhan.muc : x.xet.muc][0]),
      x.xet.ghi_chu ? h('p', { class: 'ghi-chu' }, x.xet.ghi_chu) : null,
      h('p', { class: 'ma' }, 'Mã tra cứu: ', x.chung_nhan ? x.chung_nhan.ma : '(chưa cấp)'),
      h('p', { class: 'ma' }, 'Tra tại: ', (window.NKTV_CONFIG && window.NKTV_CONFIG.appUrl) || location.origin + location.pathname, '?cn=', x.chung_nhan ? x.chung_nhan.ma : ''))));
    document.body.append(the);
    window.print();
    setTimeout(() => the.remove(), 500);
  };

  const mo = (x) => {
    const s = moSheet({
      tieuDe: x.ho_ten,
      noiDung: h('div', null,
        h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:12px' }, x.ma, ' · ',
          h('span', { class: 'the-nhan ' + MUC[x.xet.muc][1] }, MUC[x.xet.muc][0])),
        h('div', { class: 'nhom' },
          dong({ tieu: 'Điểm tổng', sau: x.xet.diem_tong === null || x.xet.diem_tong === undefined ? 'chưa có bài thi' : soVN(x.xet.diem_tong, 2) + '/10', muiTen: false }),
          dong({ tieu: 'Số buổi có mặt', sau: String(x.xet.so_buoi_co_mat), muiTen: false }),
          ...(x.diem || []).map(b => dong({ tieu: b.ten, sau: b.diem === null ? 'chưa có' : soVN(b.diem), muiTen: false }))),
        tieuChi.length ? nhom('Tiêu chí', tieuChi.map(tc => {
          const thieu = (tc.cot_loi ? x.xet.thieu_cot_loi : x.xet.thieu_bo_sung) || [];
          const chua = thieu.includes(tc.ten);
          return dong({ tieu: tc.ten, phu: tc.cot_loi ? 'Cốt lõi' : 'Bổ sung',
            sau: h('span', { class: 'the-nhan ' + (chua ? 'vang' : 'dung') }, chua ? 'Chưa đạt' : 'Đạt'), muiTen: false });
        })) : null,
        x.chung_nhan ? h('div', { class: 'bang-tin' + (x.chung_nhan.thu_hoi_luc ? '' : ' xanh') },
          x.chung_nhan.thu_hoi_luc ? 'Giấy đã thu hồi. ' : 'Đã cấp giấy. ', 'Mã ', x.chung_nhan.ma, ', cấp ', ngayGio(x.chung_nhan.cap_luc), '.') : null,
        h('div', { class: 'hang-nut', style: 'flex-direction:column' },
          h('button', { class: 'nut day', type: 'button', onclick: async () => {
            const kq = await thu(() => S.db.capChungNhanDot(dot, [x.thanh_vien_id]), x.chung_nhan ? 'Đã cấp lại' : 'Đã cấp giấy');
            if (kq) { s.dong(); lai(); }
          } }, x.chung_nhan ? 'Cấp lại theo kết quả hiện tại' : 'Cấp giấy chứng nhận'),
          x.chung_nhan ? h('button', { class: 'nut phu', type: 'button', onclick: () => { s.dong(); inGiay([x]); } }, 'In giấy') : null,
          x.chung_nhan && !x.chung_nhan.thu_hoi_luc ? h('button', { class: 'nut nguy', type: 'button', onclick: async () => {
            if (!await xacNhan({ tieuDe: 'Thu hồi giấy này?', chu: 'Trang tra cứu công khai sẽ báo giấy không còn hiệu lực.', nut: 'Thu hồi', nguy: true })) return;
            if (await thu(() => S.db.thuHoiChungNhan(dot, x.thanh_vien_id, true), 'Đã thu hồi')) { s.dong(); lai(); }
          } }, 'Thu hồi giấy') : null,
          x.chung_nhan && x.chung_nhan.thu_hoi_luc ? h('button', { class: 'nut phu', type: 'button', onclick: async () => {
            if (await thu(() => S.db.thuHoiChungNhan(dot, x.thanh_vien_id, false), 'Đã bỏ thu hồi')) { s.dong(); lai(); }
          } }, 'Bỏ thu hồi') : null))
    });
  };

  const vungDs = h('div');
  const ve = () => {
    const k = boDau(tim);
    const kq = ds.filter(x => (loc === 'tat' || (loc === 'chua_cap' ? !x.chung_nhan : x.xet.muc === loc))
      && (!k || boDau(x.ho_ten + ' ' + x.ma).includes(k)));
    dat(vungDs,
      h('div', { class: 'nhan-nhom' }, kq.length + ' người'),
      kq.length ? h('div', { class: 'nhom' }, kq.map(x => dong({
        tieu: x.ho_ten,
        phu: [x.ma, x.xet.diem_tong === null || x.xet.diem_tong === undefined ? null : soVN(x.xet.diem_tong, 2) + '/10',
          x.chung_nhan ? (x.chung_nhan.thu_hoi_luc ? 'đã thu hồi' : 'đã cấp ' + x.chung_nhan.ma) : 'chưa cấp giấy'].filter(Boolean).join(' · '),
        sau: h('span', { class: 'the-nhan ' + MUC[x.xet.muc][1] }, MUC[x.xet.muc][0]),
        onclick: () => mo(x)
      }))) : rong('Không có ai khớp.'));
  };
  const vien = (nhan, ma) => h('button', { class: 'vien', type: 'button', 'data-ma': ma, 'aria-pressed': loc === ma ? 'true' : 'false',
    onclick: (e) => { loc = ma; e.currentTarget.parentElement.querySelectorAll('.vien').forEach(v => v.setAttribute('aria-pressed', v.dataset.ma === ma ? 'true' : 'false')); ve(); } }, nhan);

  dat(vung,
    thanh('Kết quả và chứng nhận', '#tap-huan/' + dot, d.ma),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:14px' }, d.ten),
    soLieu([
      { so: demMuc('xuat_sac'), ten: 'Xuất sắc', lop: 'dung' },
      { so: demMuc('hoan_thanh') + demMuc('hoan_thanh_ghi_chu'), ten: 'Hoàn thành', lop: 'dung' },
      { so: demMuc('tham_du'), ten: 'Tham dự', lop: 'tre' },
      { so: demMuc('chua_hoan_thanh'), ten: 'Chưa hoàn thành', lop: 'vang' }
    ]),
    tieuChi.length ? null : h('div', { class: 'bang-tin' }, 'Đợt chưa có tiêu chí nào nên ai cũng ra Hoàn thành. Đặt tiêu chí trước khi cấp giấy.'),
    chuaCap.length ? h('button', { class: 'nut day', type: 'button', style: 'margin-bottom:16px', onclick: async () => {
      if (!await xacNhan({ tieuDe: `Cấp giấy cho ${chuaCap.length} người chưa có?`,
        chu: 'App xét lại theo tiêu chí hiện tại rồi cấp. Cấp cả cho người đang ở mức Chưa hoàn thành, vì giấy ghi đúng mức đó.', nut: 'Cấp giấy' })) return;
      const kq = await thu(() => S.db.capChungNhanDot(dot, chuaCap.map(x => x.thanh_vien_id)), 'Đã cấp giấy');
      if (kq) lai();
    } }, `Cấp giấy cho ${chuaCap.length} người chưa có`) : null,
    ds.length ? h('div', { class: 'hang-nut', style: 'margin-bottom:12px' },
      h('button', { class: 'nut phu', type: 'button', onclick: () => taiCSV(`ket-qua-${d.ma}.csv`,
        [['Mã học viên', 'Họ và tên', 'Điểm tổng', 'Mức', 'Ghi chú', 'Mã chứng nhận'],
          ...ds.map(x => [x.ma, x.ho_ten, x.xet.diem_tong, MUC[x.xet.muc][0], x.xet.ghi_chu || '', x.chung_nhan ? x.chung_nhan.ma : ''])]) }, 'Xuất CSV'),
      h('button', { class: 'nut phu', type: 'button', onclick: () => {
        const co = ds.filter(x => x.chung_nhan && !x.chung_nhan.thu_hoi_luc);
        if (!co.length) return toast('Chưa có giấy nào để in.', true);
        inGiay(co);
      } }, 'In tất cả giấy')) : null,
    ds.length ? h('input', { class: 'tim', type: 'search', placeholder: 'Tìm tên hoặc mã học viên', 'aria-label': 'Tìm học viên', oninput: (e) => { tim = e.target.value; ve(); } }) : null,
    ds.length ? h('div', { class: 'chon-ngang' }, vien('Tất cả', 'tat'), vien('Chưa cấp giấy', 'chua_cap'),
      vien('Xuất sắc', 'xuat_sac'), vien('Tham dự', 'tham_du'), vien('Chưa hoàn thành', 'chua_hoan_thanh')) : null,
    vungDs,
    ds.length ? null : rong('Đợt chưa có học viên nào.'));
  if (ds.length) ve();
}
