// Post-test phía quản trị: tải đề, chọn đáp án, đăng bài, xem điểm.
import { S } from './state.js';
import { h, dat, dong, nhom, moSheet, thu, toast, ngayGio, ngay, gio, soVN, soLieu, rong, oNhap, oChon, xacNhan, tuNhap, giaTriNgay, giaTriGio, taiCSV, moTaTV, hinhCau } from './ui.js';
import { chuTuPdf, phanTichDe } from './doc-de.js';

const thanhNho = (tieu, href, nhan, phai) => h('div', { class: 'thanh-nho' }, h('div', { class: 'khoang' }, h('a', { class: 'nut-lui', href, style: 'text-decoration:none' }, '‹ ' + nhan)), h('h1', null, tieu), h('div', { class: 'khoang phai' }, phai || null));
const CHU = 'ABCDEFGH';
const HIEN = [['sau_dong', 'Sau khi bài đóng'], ['sau_gui', 'Ngay sau khi gửi bài'], ['khong', 'Không công bố']];

/** Thu nhỏ hình về JPEG rộng tối đa 1100 px để lưu cùng câu hỏi. */
async function nenHinh(tep) {
  const u = URL.createObjectURL(tep);
  try {
    const anh = await new Promise((ok, loi) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => loi(new Error('Không đọc được hình này.')); i.src = u; });
    const k = Math.min(1, 1100 / anh.naturalWidth);
    const cv = document.createElement('canvas');
    cv.width = Math.round(anh.naturalWidth * k); cv.height = Math.round(anh.naturalHeight * k);
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.drawImage(anh, 0, 0, cv.width, cv.height);
    const kq = cv.toDataURL('image/jpeg', 0.84);
    if (kq.length > 1400000) throw new Error('Hình quá lớn. Cắt nhỏ lại rồi thử lần nữa.');
    return kq;
  } finally { URL.revokeObjectURL(u); }
}

export async function manDsBai(vung) {
  const ds = await S.db.dsBaiQuanTri();
  const nhan = (b) => {
    if (b.trang_thai === 'nhap') return h('span', { class: 'the-nhan' }, 'Nháp');
    const nay = new Date();
    if (b.dong_luc && new Date(b.dong_luc) <= nay) return h('span', { class: 'the-nhan' }, 'Đã đóng');
    if (b.mo_luc && new Date(b.mo_luc) > nay) return h('span', { class: 'the-nhan cho' }, 'Chờ mở');
    return h('span', { class: 'the-nhan dung' }, 'Đang mở');
  };
  dat(vung, thanhNho('Post-test', '#quan-ly', 'Quản lý', h('a', { class: 'nut-lui', href: '#quan-ly/post-test/moi', style: 'text-decoration:none' }, 'Thêm')),
    ds.length ? h('div', { class: 'nhom' }, ds.map(b => dong({
      tieu: b.tieu_de, phu: (b.buoi ? `Đầu giờ buổi ${ngay(b.buoi.bat_dau)} · ` : '') + `${b.cau_hoi.length} câu · ${b.thoi_gian_phut} phút` + (b.dong_luc ? ' · Hạn ' + ngay(b.dong_luc) : ''), sau: nhan(b),
      href: b.trang_thai === 'nhap' ? '#quan-ly/post-test/' + b.id : '#quan-ly/post-test/tk/' + b.id
    }))) : rong('Chưa có bài nào. Bấm Thêm để tải đề lên.'));
}

export async function manSoanBai(vung, id) {
  const macDinhDong = new Date(Date.now() + 7 * 864e5);
  const [bai, dsBuoi] = await Promise.all([id ? S.db.docBaiQuanTri(id) : {
    tieu_de: '', mo_ta: '', thoi_gian_phut: 30, so_lan: 1, hien_dap_an: 'sau_dong', trang_thai: 'nhap', mo_luc: null, dong_luc: tuNhap(giaTriNgay(macDinhDong), '23:59'), nguon_tep: null, buoi_id: null, cau: []
  }, S.db.dsBuoi(new Date(Date.now() - 30 * 864e5).toISOString())]);
  const nhanBuoi = (b) => `${ngay(b.bat_dau)} · ${gio(b.bat_dau)} · ${b.ten}`;
  const khungCau = h('div');
  const baoCau = h('div', { class: 'nhan-nhom' });
  const f = h('form', { onsubmit: (e) => e.preventDefault() });
  const docForm = () => {
    const x = f.elements;
    bai.tieu_de = x.td.value; bai.mo_ta = x.mt.value; bai.thoi_gian_phut = Number(x.tg.value) || 30; bai.so_lan = Number(x.sl.value) || 1; bai.hien_dap_an = x.hien.value;
    bai.buoi_id = x.buoi.value || null;
    bai.mo_luc = x.mn.value ? tuNhap(x.mn.value, x.mg.value || '00:00') : null;
    bai.dong_luc = x.dn.value ? tuNhap(x.dn.value, x.dg.value || '23:59') : null;
  };
  const thieu = () => bai.cau.filter(c => c.dung === null || c.dung === undefined).length;
  const capNhatBao = () => dat(baoCau, h('span', null, `${bai.cau.length} câu`), thieu() ? h('span', { style: 'color:var(--tre)' }, `${thieu()} câu chưa có đáp án`) : bai.cau.length ? h('span', { style: 'color:var(--dung)' }, 'Đủ đáp án') : null);

  const veCau = () => {
    capNhatBao();
    dat(khungCau, bai.cau.map((c, n) => {
      const the = h('div', { class: 'soan-cau' + (c.dung === null || c.dung === undefined ? ' thieu' : '') });
      const nutDung = [];
      const hang = c.lua_chon.map((t, i) => {
        const nut = h('button', {
          class: 'chon-dung', type: 'button', 'aria-pressed': c.dung === i ? 'true' : 'false', 'aria-label': `Chọn ${CHU[i]} là đáp án đúng của câu ${n + 1}`,
          onclick: () => { c.dung = i; nutDung.forEach((b, j) => b.setAttribute('aria-pressed', j === i ? 'true' : 'false')); the.classList.remove('thieu'); capNhatBao(); }
        }, CHU[i]);
        nutDung.push(nut);
        return h('div', { class: 'hang' }, nut, h('textarea', { rows: 1, 'aria-label': `Lựa chọn ${CHU[i]}`, oninput: (e) => { c.lua_chon[i] = e.target.value; } , value: t }));
      });
      const chonHinh = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: async (e) => {
        const t = e.target.files[0]; e.target.value = ''; if (!t) return;
        const kq = await thu(() => nenHinh(t));
        if (kq) { c.hinh = kq; veCau(); }
      } });
      the.append(
        h('div', { class: 'so-cau' }, `Câu ${n + 1}${c.phan ? ' · ' + c.phan : ''}`, h('button', { class: 'nut-chu', type: 'button', style: 'color:var(--vang)', onclick: () => { bai.cau.splice(n, 1); veCau(); } }, 'Bỏ câu')),
        h('textarea', { rows: 2, 'aria-label': `Nội dung câu ${n + 1}`, oninput: (e) => { c.noi_dung = e.target.value; }, value: c.noi_dung }),
        h('div', { class: 'hinh-soan' }, c.hinh ? h('img', { src: c.hinh, alt: `Hình câu ${n + 1}` }) : null, chonHinh,
          h('button', { class: 'nut-chu', type: 'button', onclick: () => chonHinh.click() }, c.hinh ? 'Đổi hình' : 'Thêm hình'),
          c.hinh ? h('button', { class: 'nut-chu', type: 'button', style: 'color:var(--vang)', onclick: () => { c.hinh = null; veCau(); } }, 'Bỏ hình') : null),
        ...hang);
      return the;
    }));
    khungCau.querySelectorAll('textarea').forEach(t => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 2 + 'px'; });
  };

  const napKetQua = (kq, tenTep) => {
    if (!kq.cau.length) { toast('Không nhận ra câu hỏi nào. Đề cần có dạng “Câu 1.” và “A. … B. …”. PDF dạng ảnh chụp thì không đọc được.', true); return; }
    bai.cau = kq.cau.map(c => ({ phan: c.phan, noi_dung: c.noi_dung, lua_chon: c.lua_chon, dung: c.dung, hinh: null }));
    if (kq.tieu_de && !f.elements.td.value.trim()) f.elements.td.value = kq.tieu_de;
    if (kq.thoi_gian_phut) f.elements.tg.value = kq.thoi_gian_phut;
    if (tenTep) bai.nguon_tep = tenTep;
    veCau();
    const le = bai.cau.filter(c => c.lua_chon.length < 2).length;
    toast(`Đã đọc ${bai.cau.length} câu.` + (le ? ` ${le} câu thiếu lựa chọn, cần xem lại.` : ''), !!le);
  };
  const chonTep = h('input', { type: 'file', accept: 'application/pdf,.pdf', hidden: true, onchange: async (e) => {
    const t = e.target.files[0]; e.target.value = ''; if (!t) return;
    toast('Đang đọc đề…');
    await thu(async () => napKetQua(phanTichDe(await chuTuPdf(await t.arrayBuffer())), t.name));
  } });
  const danChu = () => {
    const form = h('form', { onsubmit: (e) => { e.preventDefault(); napKetQua(phanTichDe(form.elements.c.value)); s.dong(); } },
      h('div', { class: 'nhom' }, oNhap('Dán đề vào đây', { the: 'textarea', name: 'c', rows: 12, placeholder: 'Câu 1. Nội dung câu hỏi\nA. Lựa chọn thứ nhất\nB. Lựa chọn thứ hai\n\nĐáp án: 1A 2C (nếu có)' })),
      h('button', { class: 'nut day', type: 'submit' }, 'Đọc đề'));
    const s = moSheet({ tieuDe: 'Dán chữ', noiDung: form });
  };

  const luu = async (trangThai) => {
    docForm();
    if (!bai.tieu_de.trim()) { toast('Cần có tên bài.', true); return; }
    if (trangThai === 'mo') {
      if (thieu()) { toast(`Còn ${thieu()} câu chưa có đáp án.`, true); return; }
      if (!await xacNhan({ tieuDe: 'Đăng bài này?', chu: `${bai.cau.length} câu, ${bai.thoi_gian_phut} phút. ` + (bai.buoi_id ? 'Ai đã điểm danh buổi đã chọn làm được ngay khi đến giờ mở.' : 'Thành viên thấy và làm được ngay khi đến giờ mở.'), nut: 'Đăng bài' })) return;
    }
    const p = { id: bai.id || null, tieu_de: bai.tieu_de.trim(), mo_ta: bai.mo_ta || null, thoi_gian_phut: bai.thoi_gian_phut, mo_luc: bai.mo_luc, dong_luc: bai.dong_luc, so_lan: bai.so_lan, hien_dap_an: bai.hien_dap_an, trang_thai: trangThai, nguon_tep: bai.nguon_tep, buoi_id: bai.buoi_id,
      cau: bai.cau.map(c => ({ id: c.id, phan: c.phan, noi_dung: c.noi_dung.trim(), lua_chon: c.lua_chon.map(t => t.trim()).filter(Boolean), dung: c.dung, hinh: c.hinh || null })) };
    const kq = await thu(() => S.db.luuBaiTest(p), trangThai === 'mo' ? 'Đã đăng bài' : 'Đã lưu nháp');
    if (kq) location.hash = 'quan-ly/post-test';
  };

  dat(f,
    h('div', { class: 'nhom' },
      oNhap('Tên bài', { name: 'td', value: bai.tieu_de, required: true }),
      oNhap('Ghi chú cho người làm', { the: 'textarea', name: 'mt', value: bai.mo_ta, rows: 3 })),
    h('div', { class: 'nhom' },
      oChon('Test đầu giờ của buổi', [['', 'Không gắn buổi (post-test thường)'],
        ...dsBuoi.map(b => [b.id, nhanBuoi(b)]),
        ...(bai.buoi_id && !dsBuoi.some(b => b.id === bai.buoi_id) ? [[bai.buoi_id, 'Buổi đã gắn trước đây']] : [])], bai.buoi_id || '', { name: 'buoi' })),
    h('p', { class: 'chu-nhom' }, 'Gắn buổi thì chỉ người đã điểm danh buổi đó mới mở được bài, và điểm bài tính vào điểm nhóm của buổi.'),
    h('div', { class: 'nhom' },
      oNhap('Thời gian làm bài (phút)', { name: 'tg', type: 'number', min: 1, inputmode: 'numeric', value: bai.thoi_gian_phut }),
      oNhap('Số lần được làm', { name: 'sl', type: 'number', min: 1, inputmode: 'numeric', value: bai.so_lan }),
      oChon('Hiện đáp án', HIEN, bai.hien_dap_an, { name: 'hien' })),
    h('div', { class: 'nhom' },
      oNhap('Ngày mở (trống là mở ngay)', { name: 'mn', type: 'date', value: bai.mo_luc ? giaTriNgay(bai.mo_luc) : '' }),
      oNhap('Giờ mở', { name: 'mg', type: 'time', value: bai.mo_luc ? giaTriGio(bai.mo_luc) : '' }),
      oNhap('Ngày đóng', { name: 'dn', type: 'date', value: bai.dong_luc ? giaTriNgay(bai.dong_luc) : '' }),
      oNhap('Giờ đóng', { name: 'dg', type: 'time', value: bai.dong_luc ? giaTriGio(bai.dong_luc) : '' })));

  dat(vung,
    thanhNho(id ? 'Sửa bài' : 'Bài mới', '#quan-ly/post-test', 'Post-test'),
    f, chonTep,
    h('div', { class: 'hang-nut', style: 'margin-bottom:22px' },
      h('button', { class: 'nut phu', type: 'button', onclick: () => chonTep.click() }, 'Tải đề PDF'),
      h('button', { class: 'nut phu', type: 'button', onclick: danChu }, 'Dán chữ')),
    baoCau, khungCau,
    h('button', { class: 'nut phu day', type: 'button', style: 'margin:0 0 18px', onclick: () => { bai.cau.push({ noi_dung: '', lua_chon: ['', '', '', ''], dung: null, phan: null }); veCau(); } }, 'Thêm câu'),
    h('div', { class: 'hang-nut' },
      h('button', { class: 'nut phu', type: 'button', onclick: () => luu('nhap') }, 'Lưu nháp'),
      h('button', { class: 'nut', type: 'button', onclick: () => luu('mo') }, 'Đăng bài')),
    id && bai.trang_thai === 'nhap' ? h('button', { class: 'nut nguy day', type: 'button', style: 'margin-top:10px', onclick: async () => { if (await xacNhan({ tieuDe: 'Xóa bài nháp?', nut: 'Xóa', nguy: true })) { const ok = await thu(() => S.db.xoaBaiTest(id), 'Đã xóa'); if (ok) location.hash = 'quan-ly/post-test'; } } }, 'Xóa bài') : null);
  veCau();
}

export async function manThongKeBai(vung, id) {
  const [tk, bai] = await Promise.all([S.db.thongKeBai(id), S.db.docBaiQuanTri(id)]);
  const lai = () => manThongKeBai(vung, id);
  const chuaGui = tk.ds.filter(x => x.diem === null || x.diem === undefined);
  const daGui = tk.ds.filter(x => x.diem !== null && x.diem !== undefined);
  const dongBai = async () => {
    if (!await xacNhan({ tieuDe: 'Đóng bài ngay?', chu: 'Ai đang làm dở sẽ được chấm theo phần đã lưu khi hết giờ. Đáp án hiện theo cài đặt của bài.', nut: 'Đóng bài' })) return;
    const ok = await thu(() => S.db.luuBaiTest(Object.assign({}, bai, { dong_luc: new Date().toISOString() })), 'Đã đóng bài');
    if (ok) lai();
  };
  const daDong = bai.dong_luc && new Date(bai.dong_luc) <= new Date();
  dat(vung,
    thanhNho('Kết quả', '#quan-ly/post-test', 'Post-test', h('a', { class: 'nut-lui', href: '#quan-ly/post-test/' + id, style: 'text-decoration:none' }, 'Sửa')),
    h('h2', { style: 'font-size:1.375rem;font-weight:700;letter-spacing:-0.018em;line-height:1.2;margin:4px 0 4px' }, bai.tieu_de),
    h('p', { class: 'tieu-de-phu', style: 'margin:0 0 14px;padding:0' }, bai.dong_luc ? (daDong ? 'Đã đóng ' : 'Hạn ') + ngayGio(bai.dong_luc) : 'Không đặt hạn'),
    soLieu([{ so: `${tk.da_gui}/${tk.doi_tuong}`, ten: tk.buoi_id ? 'Đã gửi / đã điểm danh' : 'Đã gửi bài' }, { so: soVN(tk.tb), ten: 'Điểm trung bình' }, { so: soVN(tk.cao), ten: 'Cao nhất', lop: 'dung' }, { so: soVN(tk.thap), ten: 'Thấp nhất', lop: 'vang' }]),
    tk.da_gui ? nhom('Tỷ lệ đúng từng câu', h('div', null, tk.cau.map((c, n) => {
      const so = c.dung === null || c.dung === undefined ? 0 : Number(c.dem[c.dung] || 0);
      const pt = tk.da_gui ? Math.round(so / tk.da_gui * 100) : 0;
      return h('button', { class: 'dong', type: 'button', onclick: () => xemCau(c, n, tk.da_gui) },
        h('div', { class: 'giua' }, h('div', { class: 'chinh', style: 'font-weight:400;font-size:.9375rem' }, `Câu ${n + 1}. ${c.noi_dung.slice(0, 80)}${c.noi_dung.length > 80 ? '…' : ''}`),
          h('div', { class: 'thanh-pt' + (pt < 50 ? ' thap' : '') }, h('i', { style: `width:${pt}%` }))),
        h('div', { class: 'sau' }, pt + '%'));
    }))) : null,
    daGui.length ? nhom(`Điểm · ${daGui.length} người`, h('div', null, daGui.map(x => dong({ tieu: x.ho_ten, phu: moTaTV(x) + ' · ' + ngayGio(x.nop_luc) + (x.tu_dong ? ' · Tự gửi' : ''), sau: soVN(x.diem) })))) : null,
    chuaGui.length ? nhom(`${tk.buoi_id ? 'Có mặt, chưa gửi' : 'Chưa gửi'} · ${chuaGui.length} người`, h('div', null, chuaGui.map(x => dong({ tieu: x.ho_ten, phu: moTaTV(x) })))) : null,
    h('div', { class: 'hang-nut' },
      h('button', { class: 'nut phu', type: 'button', onclick: () => taiCSV('diem-post-test.csv', [['Mã', 'Họ và tên', 'Generation', 'Nhà', 'Điểm', 'Số câu đúng', 'Tổng câu', 'Thời điểm gửi'], ...tk.ds.map(x => [x.ma, x.ho_ten, x.gen, x.nha, x.diem, x.so_dung, x.tong, x.nop_luc ? ngayGio(x.nop_luc) : ''])]) }, 'Xuất CSV'),
      !daDong ? h('button', { class: 'nut', type: 'button', onclick: dongBai }, 'Đóng bài') : null));
}

function xemCau(c, n, tong) {
  moSheet({
    tieuDe: `Câu ${n + 1}`,
    noiDung: h('div', null,
      h('p', { style: 'margin-bottom:12px;line-height:1.42;white-space:pre-line' }, c.noi_dung),
      c.hinh ? hinhCau(c.hinh, `Hình câu ${n + 1}`) : null,
      h('div', { class: 'nhom' }, c.lua_chon.map((t, i) => {
        const so = Number(c.dem[i] || 0);
        return dong({ tieu: `${CHU[i]}. ${t}`, sau: `${so}/${tong}`, truoc: c.dung === i ? h('span', { class: 'the-nhan dung' }, 'Đúng') : null });
      })))
  });
}
