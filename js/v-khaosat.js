// Khảo sát cho thành viên CLB (migration 0021; anh Long yêu cầu 23/11/2026, dùng lần đầu cho BM01 trước workshop Quản lý thời gian).
// Khảo sát ẩn danh: máy chủ ghi bạn đã gửi, còn dòng trả lời không gắn tên và giờ gửi chỉ ghi theo ngày.
// Câu có điều kiện chỉ hiện khi câu trước đó được trả lời đúng điều kiện; cách xét giống hệt hàm gui_khao_sat.
// Bản nháp lưu trên máy (localStorage) cho tới khi gửi, để thoát ra giữa chừng không mất câu đã chọn.
import { S } from './state.js';
import { h, dat, dong, nhom, thu, toast, ngayGio, soVN, soLieu, taiCSV, bieuTuong, rong, moTaTV, tenDep, giaTriNgay, giaTriGio, tuNhap, moSheet, oNhap, rungThanhCong } from './ui.js';

const icon = (ten) => h('div', { class: 'bieu-tuong' }, bieuTuong(ten));
const thanhNho = (tieu, href, nhan) => h('div', { class: 'thanh-nho' },
  h('div', { class: 'khoang' }, h('a', { class: 'nut-lui', href, style: 'text-decoration:none' }, '‹ ' + nhan)), h('h1', null, tieu), h('div', { class: 'khoang phai' }));
const khoaNhap = (id) => `nktv-khao-sat-${id}-${S.toi.id}`;
const conHan = (k) => k.mo && (!k.han || new Date(k.han) > new Date());
const coTraLoi = (v) => v !== undefined && v !== null && !(typeof v === 'string' && !v.trim()) && !(Array.isArray(v) && !v.length);
const phanTram = (a, b) => b ? Math.round(a / b * 100) : 0;
const doanVan = (s) => String(s || '').split(/\n{2,}/).map(p => h('p', { class: 'ks-mo-ta' }, p));

/** Các câu đang hiện, xét theo thứ tự như máy chủ: điều kiện chỉ nhìn câu trả lời của những câu đang hiện. */
function cauDangHien(cau, tl) {
  const sach = {}, hien = new Set();
  for (const c of cau) {
    const dk = c.dieu_kien;
    if (dk) {
      const v = sach[String(dk.cau)];
      if (!(dk.trong ? typeof v === 'string' && dk.trong.includes(v) : coTraLoi(v))) continue;
    }
    hien.add(c.thu_tu);
    if (coTraLoi(tl[String(c.thu_tu)])) sach[String(c.thu_tu)] = tl[String(c.thu_tu)];
  }
  return hien;
}

/** Khối trên màn Hôm nay. Không bao giờ báo lỗi: máy chủ chưa có migration 0021 thì không hiện gì. */
export async function khoiKhaoSat() {
  try {
    if (!S.db.khaoSatCuaToi) return [];
    const [ds, ql] = await Promise.all([
      S.db.khaoSatCuaToi().catch(() => []),
      S.toi.la_quan_tri && S.db.dsKhaoSat ? S.db.dsKhaoSat().catch(() => []) : []
    ]);
    const kq = [];
    const chua = ds.filter(k => !k.da_gui);
    if (chua.length) kq.push(nhom('Khảo sát cần làm', chua.map(k => dong({
      tieu: k.ten, phu: [`${k.so_cau} câu`, k.han ? 'hạn ' + ngayGio(k.han) : null].filter(Boolean).join(' · '),
      truoc: icon('phieu'), href: '#khao-sat/' + k.id
    }))));
    const dangMo = ql.filter(conHan);
    if (dangMo.length) kq.push(nhom('Khảo sát đang mở · kết quả', dangMo.map(k => dong({
      tieu: k.ten, phu: `Đã gửi ${k.so_gui}/${k.so_doi_tuong}`, truoc: icon('bieu_do'), href: `#khao-sat/${k.id}/ket-qua`
    }))));
    return kq;
  } catch (e) { console.error(e); return []; }
}

export async function manKhaoSat(vung, con) {
  if (!con[0]) return manDanhSach(vung);
  if (con[1] === 'ket-qua') return manKetQua(vung, con[0]);
  return manLam(vung, con[0]);
}

async function manDanhSach(vung) {
  const [ds, ql] = await Promise.all([S.db.khaoSatCuaToi(), S.toi.la_quan_tri ? S.db.dsKhaoSat() : []]);
  dat(vung,
    thanhNho('Khảo sát', '#hom-nay', 'Hôm nay'),
    ds.length ? nhom('Dành cho bạn', ds.map(k => dong({
      tieu: k.ten, phu: [`${k.so_cau} câu`, k.han ? 'hạn ' + ngayGio(k.han) : null].filter(Boolean).join(' · '),
      sau: h('span', { class: 'the-nhan ' + (k.da_gui ? 'dat' : 'cho') }, k.da_gui ? 'Đã gửi' : 'Chưa gửi'),
      href: '#khao-sat/' + k.id
    }))) : rong('Hiện chưa có khảo sát nào dành cho bạn.'),
    ql.length ? nhom('Quản lý', ql.map(k => dong({
      tieu: k.ten, phu: `${conHan(k) ? 'Đang mở' : k.mo ? 'Đã hết hạn' : 'Đã đóng'} · đã gửi ${k.so_gui}/${k.so_doi_tuong}`,
      href: `#khao-sat/${k.id}/ket-qua`
    }))) : null);
}

/* ---------- Làm khảo sát ---------- */
async function manLam(vung, id) {
  const k = await S.db.xemKhaoSat(id);
  const lui = thanhNho('Khảo sát', '#hom-nay', 'Hôm nay');
  if (!k) return dat(vung, lui, rong('Khảo sát này chưa mở, đã đóng, hoặc không dành cho tài khoản của bạn.'));
  const dau = [
    h('h2', { class: 'ks-tieu' }, k.ten),
    doanVan(k.mo_ta),
    k.han ? h('p', { class: 'chu-nho', style: 'margin:0 0 12px' }, (conHan(k) ? 'Hạn gửi: ' : 'Đã hết hạn: ') + ngayGio(k.han)) : null
  ];
  const lienKetKQ = S.toi.la_quan_tri ? nhom(null, dong({ tieu: 'Xem kết quả', truoc: icon('bieu_do'), href: `#khao-sat/${id}/ket-qua` })) : null;
  if (k.da_gui) {
    return dat(vung, lui, dau, h('div', { class: 'bang-tin xanh' }, 'Bạn đã gửi khảo sát này. ', k.loi_ket || 'Cảm ơn bạn.'), lienKetKQ);
  }

  let tl = {};
  try { tl = JSON.parse(localStorage.getItem(khoaNhap(id))) || {}; } catch (_) {}
  const luuNhap = () => { try { localStorage.setItem(khoaNhap(id), JSON.stringify(tl)); } catch (_) {} };
  const capNhat = [];
  const khoi = new Map();

  const veO = (c) => {
    const kk = String(c.thu_tu);
    if (c.loai === 'chon' || c.loai === 'nhieu') {
      const nhieu = c.loai === 'nhieu';
      const nut = c.lua_chon.map(x => h('button', {
        class: 'ks-lc' + (nhieu ? ' vuong' : ''), type: 'button', role: nhieu ? 'checkbox' : 'radio', 'aria-checked': 'false',
        onclick: () => {
          if (nhieu) {
            const ds = Array.isArray(tl[kk]) ? tl[kk].slice() : [];
            const i = ds.indexOf(x);
            if (i >= 0) ds.splice(i, 1);
            else if (c.toi_da && ds.length >= c.toi_da) return toast(`Câu ${c.thu_tu} chọn tối đa ${c.toi_da} ý. Bỏ một ý trước đã.`, true);
            else ds.push(x);
            tl[kk] = ds;
          } else tl[kk] = tl[kk] === x ? null : x;
          doi();
        }
      }, h('i', { 'aria-hidden': 'true' }), h('span', null, x)));
      capNhat.push(() => nut.forEach((n, i) => n.setAttribute('aria-checked',
        String(nhieu ? (tl[kk] || []).includes(c.lua_chon[i]) : tl[kk] === c.lua_chon[i]))));
      return h('div', { class: 'ks-ds', role: nhieu ? 'group' : 'radiogroup', 'aria-label': 'Câu ' + c.thu_tu }, nut);
    }
    if (c.loai === 'thang5') {
      const nut = [1, 2, 3, 4, 5].map(n => h('button', {
        class: 'ks-muc', type: 'button', role: 'radio', 'aria-checked': 'false', 'aria-label': `Câu ${c.thu_tu}, mức ${n}`,
        onclick: () => { tl[kk] = tl[kk] === n ? null : n; doi(); }
      }, String(n)));
      capNhat.push(() => nut.forEach((b, i) => b.setAttribute('aria-checked', String(tl[kk] === i + 1))));
      return h('div', null,
        h('div', { class: 'ks-thang', role: 'radiogroup', 'aria-label': 'Câu ' + c.thu_tu }, nut),
        c.nhan_thang ? h('div', { class: 'ks-nhan-thang' }, h('span', null, '1 = ' + c.nhan_thang[0]), h('span', null, '5 = ' + c.nhan_thang[1])) : null);
    }
    const doan = c.loai === 'doan';
    return h(doan ? 'textarea' : 'input', {
      class: 'ks-chu', rows: doan ? 4 : null, maxlength: doan ? 2000 : 300, value: tl[kk] || '', 'aria-label': 'Câu ' + c.thu_tu,
      oninput: (e) => { tl[kk] = e.target.value; doi(); }
    });
  };

  const cau = k.cau.map(c => {
    const el = h('div', { class: 'ks-khoi' },
      c.phan ? h('h3', { class: 'ks-phan' }, c.phan) : null,
      h('div', { class: 'ks-cau' },
        h('p', { class: 'ks-nd' }, h('span', { class: 'ks-so' }, c.thu_tu + '.'), ' ', c.noi_dung,
          c.bat_buoc ? null : h('span', { class: 'ks-tuy' }, ' · không bắt buộc')),
        c.ghi_chu ? h('p', { class: 'ks-gc' }, c.ghi_chu) : null,
        veO(c)));
    khoi.set(c.thu_tu, el);
    return el;
  });

  const tienDo = h('p', { class: 'chu-nho giua-chu', style: 'margin:0 0 10px' });
  const nutGui = h('button', { class: 'nut day', type: 'button', disabled: !k.gui_duoc, onclick: () => gui() }, 'Gửi khảo sát');
  function doi() {
    capNhat.forEach(f => f());
    const hien = cauDangHien(k.cau, tl);
    let can = 0, xong = 0;
    k.cau.forEach(c => {
      const el = khoi.get(c.thu_tu), co = coTraLoi(tl[String(c.thu_tu)]);
      el.hidden = !hien.has(c.thu_tu);
      if (co) el.classList.remove('thieu');
      if (hien.has(c.thu_tu) && c.bat_buoc) { can++; if (co) xong++; }
    });
    tienDo.textContent = `Đã trả lời ${xong}/${can} câu bắt buộc`;
    luuNhap();
  }
  async function gui() {
    const hien = cauDangHien(k.cau, tl);
    const thieu = k.cau.filter(c => hien.has(c.thu_tu) && c.bat_buoc && !coTraLoi(tl[String(c.thu_tu)]));
    if (thieu.length) {
      thieu.forEach(c => khoi.get(c.thu_tu).classList.add('thieu'));
      toast(`Còn ${thieu.length} câu bắt buộc chưa trả lời: câu ${thieu.map(c => c.thu_tu).join(', ')}.`, true);
      khoi.get(thieu[0].thu_tu).scrollIntoView({ block: 'center' });
      return;
    }
    const goi = {};
    k.cau.forEach(c => {
      const v = tl[String(c.thu_tu)];
      if (hien.has(c.thu_tu) && coTraLoi(v)) goi[String(c.thu_tu)] = typeof v === 'string' ? v.trim() : v;
    });
    nutGui.disabled = true;
    if (await thu(() => S.db.guiKhaoSat(id, goi), 'Đã gửi khảo sát')) {
      try { localStorage.removeItem(khoaNhap(id)); } catch (_) {}
      rungThanhCong();
      window.scrollTo(0, 0);
      await manLam(vung, id);
    } else nutGui.disabled = false;
  }

  dat(vung, lui,
    h('div', { class: 'ks-trang' },
      dau,
      k.gui_duoc ? null : h('div', { class: 'bang-tin' }, conHan(k)
        ? `Bạn đang xem trước. Khảo sát này dành cho ${k.doi_tuong.join(', ')}; tài khoản của bạn không gửi được.`
        : 'Khảo sát đã đóng hoặc hết hạn, không gửi được nữa.'),
      h('div', { class: 'bang-tin xanh' }, k.an_danh
        ? 'Khảo sát ẩn danh: câu trả lời không gắn với tên bạn, giờ gửi chỉ ghi theo ngày. App vẫn ghi là bạn đã gửi, để Ban tổ chức biết còn ai chưa trả lời.'
        : 'Khảo sát này có tên: Ban tổ chức thấy bạn trả lời gì.'),
      cau,
      h('div', { class: 'ks-cuoi' }, tienDo, nutGui,
        h('p', { class: 'chu-nho giua-chu', style: 'margin-top:10px' }, 'Gửi rồi thì không sửa lại được. Câu đã chọn được giữ trên máy này cho tới khi gửi.'))),
    lienKetKQ);
  doi();
}

/* ---------- Kết quả cho quản trị và Ban cố vấn ---------- */
async function manKetQua(vung, id) {
  const t = await S.db.tongHopKhaoSat(id);
  const lui = thanhNho('Kết quả', '#khao-sat', 'Khảo sát');
  if (!t) return dat(vung, lui, rong('Không xem được kết quả khảo sát này.'));
  const dong_ = t.tra_loi || [], nguoi = t.nguoi || [];
  const daGui = nguoi.filter(x => x.da_gui), chuaGui = nguoi.filter(x => !x.da_gui);
  const chuaKH = chuaGui.filter(x => !x.da_kich_hoat).length;
  const hienCua = dong_.map(r => cauDangHien(t.cau, r.tra_loi));
  const dem = (c) => {
    const o = {}; let thay = 0, tra = 0;
    dong_.forEach((r, i) => {
      if (!hienCua[i].has(c.thu_tu)) return;
      thay++;
      const v = r.tra_loi[String(c.thu_tu)];
      if (!coTraLoi(v)) return;
      tra++;
      (Array.isArray(v) ? v : [v]).forEach(x => { o[x] = (o[x] || 0) + 1; });
    });
    return { o, thay, tra };
  };
  const thanh = (nhan, n, mau) => h('div', { class: 'ks-thanh' },
    h('div', { class: 'ks-thanh-chu' }, h('span', null, nhan), h('b', null, `${n.so} · ${n.pt}%`)),
    h('div', { class: 'ks-thanh-nen' }, h('i', { style: `width:${n.pt}%` + (mau ? `;background:${mau}` : '') })));

  const tomTat = (c) => {
    const d = dem(c);
    let than;
    if (c.loai === 'chon' || c.loai === 'nhieu') {
      const mau = c.loai === 'nhieu' ? d.thay : d.tra;
      than = c.lua_chon.map(x => thanh(x, { so: d.o[x] || 0, pt: phanTram(d.o[x] || 0, mau) }));
    } else if (c.loai === 'thang5') {
      const s = [1, 2, 3, 4, 5].reduce((a, n) => a + n * (d.o[n] || 0), 0);
      than = [h('p', { class: 'chu-nho', style: 'margin-bottom:6px' }, 'Trung bình ', h('b', null, d.tra ? soVN(s / d.tra, 2) : '–'), ' trên 5',
        c.nhan_thang ? ` · 1 = ${c.nhan_thang[0]}, 5 = ${c.nhan_thang[1]}` : ''),
        [1, 2, 3, 4, 5].map(n => thanh(String(n), { so: d.o[n] || 0, pt: phanTram(d.o[n] || 0, d.tra) }))];
    } else {
      const ds = dong_.map(r => r.tra_loi[String(c.thu_tu)]).filter(coTraLoi);
      than = ds.length ? ds.map(x => h('p', { class: 'ks-van' }, x)) : h('p', { class: 'chu-nho' }, 'Chưa có câu trả lời.');
    }
    return h('div', { class: 'nhom ks-tt' },
      h('p', { class: 'ks-tt-nd' }, c.thu_tu + '. ' + c.noi_dung),
      h('p', { class: 'chu-nho', style: 'margin:2px 0 10px' }, `${d.tra} người trả lời` + (d.thay !== dong_.length ? ` · câu hiện với ${d.thay} người` : '')),
      than);
  };

  // Câu đầu là câu chọn một ý (BM01: có tham gia buổi workshop không) thì đưa lên đầu thành ô số.
  const c1 = t.cau[0];
  const dau1 = c1 && c1.loai === 'chon' ? (() => {
    const d = dem(c1);
    return [h('div', { class: 'nhan-nhom' }, 'Câu 1 · ' + c1.noi_dung),
      soLieu([...c1.lua_chon.map((x, i) => ({ so: d.o[x] || 0, ten: x, lop: i === 0 ? 'dung' : i === c1.lua_chon.length - 1 ? 'vang' : 'tre' })),
        { so: chuaGui.length, ten: 'Chưa gửi phiếu' }])];
  })() : null;

  const taiTraLoi = () => {
    const dau = ['Dòng', 'Ngày gửi', ...(t.an_danh ? [] : ['Mã', 'Họ tên']), ...t.cau.map(c => `${c.thu_tu}. ${c.noi_dung}`)];
    taiCSV(`${t.ma}_tra_loi_${giaTriNgay(Date.now())}.csv`, [dau, ...dong_.map((r, i) => [i + 1, giaTriNgay(r.luc), ...(t.an_danh ? [] : [r.ma, r.ho_ten]),
      ...t.cau.map(c => { const v = r.tra_loi[String(c.thu_tu)]; return Array.isArray(v) ? v.join('; ') : v ?? ''; })])]);
  };
  const taiNguoi = () => taiCSV(`${t.ma}_da_gui_chua_gui_${giaTriNgay(Date.now())}.csv`,
    [['Mã', 'Họ tên', 'Cấp', 'Gen', 'Nhà', 'Đã gửi', 'Đã kích hoạt app'],
      ...nguoi.map(x => [x.ma, x.ho_ten, x.cap, x.gen, x.nha, x.da_gui ? 'Có' : 'Chưa', x.da_kich_hoat ? 'Có' : 'Chưa'])]);
  const doiHan = () => {
    const f = h('form', {
      onsubmit: async (e) => {
        e.preventDefault();
        const x = f.elements;
        const han = x.d.value ? tuNhap(x.d.value, x.g.value || '23:59') : null;
        if (await thu(() => S.db.datKhaoSat(id, t.mo, han), han ? 'Đã đặt hạn' : 'Đã bỏ hạn')) { s.dong(); manKetQua(vung, id); }
      }
    },
      h('div', { class: 'nhom' },
        oNhap('Ngày', { name: 'd', type: 'date', value: t.han ? giaTriNgay(t.han) : '' }),
        oNhap('Giờ', { name: 'g', type: 'time', value: t.han ? giaTriGio(t.han) : '12:00' })),
      h('p', { class: 'chu-nho', style: 'margin-bottom:12px' }, 'Để trống ngày rồi lưu là bỏ hạn. Qua hạn thì thành viên không gửi được nữa, kết quả vẫn còn.'),
      h('button', { class: 'nut day', type: 'submit' }, 'Lưu'));
    const s = moSheet({ tieuDe: 'Hạn gửi', noiDung: f });
  };
  const veNguoi = (x) => dong({ tieu: tenDep(x.ho_ten), phu: [x.ma, moTaTV(x), x.da_kich_hoat ? null : 'chưa kích hoạt app'].filter(Boolean).join(' · '), muiTen: false });

  dat(vung, lui,
    h('h2', { class: 'ks-tieu' }, t.ten),
    soLieu([{ so: daGui.length, ten: 'Đã gửi', lop: 'dung' }, { so: chuaGui.length, ten: 'Chưa gửi' }, { so: chuaKH, ten: 'Chưa kích hoạt app', lop: chuaKH ? 'vang' : '' }]),
    dau1,
    t.an_danh ? h('div', { class: 'bang-tin' }, 'Khảo sát ẩn danh: app biết ai đã gửi nhưng không nối được người với câu trả lời, nên không có bảng trả lời của từng người.') : null,
    nhom('Cài đặt',
      dong({ tieu: 'Trạng thái', sau: h('span', { class: 'the-nhan ' + (conHan(t) ? 'dung' : 'vang') }, conHan(t) ? 'Đang mở' : t.mo ? 'Đã hết hạn' : 'Đã đóng'), muiTen: false }),
      dong({ tieu: t.mo ? 'Đóng khảo sát' : 'Mở khảo sát', phu: t.mo ? 'Thành viên không gửi thêm được, kết quả vẫn còn' : 'Thành viên thuộc đối tượng thấy khảo sát ở màn Hôm nay',
        onclick: async () => { if (await thu(() => S.db.datKhaoSat(id, !t.mo, t.han), t.mo ? 'Đã đóng khảo sát' : 'Đã mở khảo sát')) manKetQua(vung, id); } }),
      dong({ tieu: 'Hạn gửi', phu: t.han ? ngayGio(t.han) : 'Không có hạn', onclick: doiHan }),
      dong({ tieu: 'Đối tượng', sau: t.doi_tuong.join(', '), muiTen: false }),
      dong({ tieu: 'Xem phiếu như thành viên', truoc: icon('phieu'), href: '#khao-sat/' + id }),
      dong({ tieu: 'Tải câu trả lời (CSV)', truoc: icon('don'), onclick: taiTraLoi }),
      dong({ tieu: 'Tải danh sách đã gửi, chưa gửi (CSV)', truoc: icon('nguoi'), onclick: taiNguoi })),
    h('div', { class: 'nhan-nhom' }, 'Từng câu'),
    dong_.length ? t.cau.map(tomTat) : rong('Chưa ai gửi.'),
    h('details', { class: 'ks-ds-nguoi' }, h('summary', null, `Chưa gửi · ${chuaGui.length} người`), h('div', { class: 'nhom' }, chuaGui.map(veNguoi))),
    h('details', { class: 'ks-ds-nguoi' }, h('summary', null, `Đã gửi · ${daGui.length} người`), h('div', { class: 'nhom' }, daGui.map(veNguoi))));
}
