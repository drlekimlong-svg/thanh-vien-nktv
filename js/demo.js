// Bản chạy thử trên máy (localhost, ?demo=admin|diem|bcv|nt|tv|dangnhap): dữ liệu giả trong bộ nhớ, không gọi máy chủ.
// nt là nhóm trưởng nhà Genbu, bcv là Ban cố vấn không giữ vai trò quản trị.
// Cùng tên hàm với api.js để thử giao diện mà không chạm vào dữ liệu thật.
const uid = () => 'x' + Math.random().toString(36).slice(2, 12);
const NHA = ['Seiryu', 'Suzaku', 'Byakko', 'Genbu', 'Kirin', 'Yin-Yang Kois'];

export function demo(vai) {
  const tv = Array.from({ length: 18 }, (_, i) => ({
    id: 't' + i, ma: 'NKTV-' + String(i + 1).padStart(3, '0'), ho_ten: ['NGUYỄN VĂN', 'TRẦN THỊ', 'LÊ MINH'][i % 3] + ' ' + String.fromCharCode(65 + i),
    gen: 8 + (i % 4), nha: NHA[i % 6], cap: i === 0 || i === 4 ? 'Ban cố vấn' : i % 5 === 3 ? 'Junior' : 'Senior', chuc_vu: null, hoat_dong: i !== 17, ghi_chu: null, khoa_qr: String(i).padStart(16, 'a'), vai_tro: 'thanh_vien', tham_gia_tu: null, user_id: null
  }));
  const dangNhap = { admin: 0, diem: 1, nt: 3, bcv: 4 }[vai] ?? 2;
  tv[0].vai_tro = 'quan_tri'; tv[1].vai_tro = 'diem_danh'; tv[3].chuc_vu = 'nhom_truong';
  const khoaNha = (n) => n === 'Yin-Yang Kois' ? 'koi' : String(n || '').toLowerCase();
  const co = vai !== 'dangnhap';
  let phien = co;
  const me = () => tv[dangNhap];
  const nay = Date.now(), ngay = 864e5;
  const buoi = [
    { id: 'b1', ten: 'Sinh hoạt hằng tuần', bat_dau: new Date(nay - 7 * ngay).toISOString(), ket_thuc: null, dia_diem: 'Phòng A', noi_dung: 'Chuyên đề mẫu', nhom_truc: 'Suzaku', chu_tri: 'Nguyễn Văn A', tre_sau_phut: 10, tinh_chuyen_can: true, dong: true },
    { id: 'b2', ten: 'Sinh hoạt hằng tuần', bat_dau: new Date(nay - 20 * 60e3).toISOString(), ket_thuc: null, dia_diem: 'Phòng A', noi_dung: null, nhom_truc: 'Kirin', chu_tri: null, tre_sau_phut: 10, tinh_chuyen_can: true, dong: false },
    { id: 'b3', ten: 'Thực hành khâu cơ bản', bat_dau: new Date(nay + 6 * ngay).toISOString(), ket_thuc: null, dia_diem: 'Phòng thực hành', noi_dung: 'Mang theo bộ dụng cụ.', nhom_truc: 'Genbu', chu_tri: null, tre_sau_phut: 10, tinh_chuyen_can: true, dong: false }
  ];
  const dd = [{ buoi_id: 'b1', thanh_vien_id: 't0', luc: buoi[0].bat_dau, cach: 'qr' }, { buoi_id: 'b1', thanh_vien_id: 't2', luc: new Date(new Date(buoi[0].bat_dau).getTime() + 15 * 60e3).toISOString(), cach: 'qr' }];
  [1, 3, 5, 6, 7, 8, 10, 11, 13, 14].forEach((i, k) => dd.push({ buoi_id: 'b1', thanh_vien_id: 't' + i, luc: new Date(new Date(buoi[0].bat_dau).getTime() + (k % 4 === 3 ? 20 : 2) * 60e3).toISOString(), cach: 'qr' }));
  [0, 3].forEach(i => dd.push({ buoi_id: 'b2', thanh_vien_id: 't' + i, luc: buoi[1].bat_dau, cach: 'qr' }));
  const don = [{ id: 'd1', buoi_id: 'b3', thanh_vien_id: 't3', ly_do: 'Trùng lịch thi', trang_thai: 'cho', gui_luc: new Date(nay - 3600e3).toISOString(), phan_hoi: null }];
  const tb = [{ id: 'n1', tieu_de: 'Lịch tuần này', noi_dung: 'Nội dung mẫu của thông báo.\nDòng thứ hai.', ghim: true, dang_luc: new Date(nay - 3600e3).toISOString() }, { id: 'n2', tieu_de: 'Thông báo cũ', noi_dung: 'Mẫu.', ghim: false, dang_luc: new Date(nay - 5 * ngay).toISOString() }];
  const doc = [];
  const nl = ['Lãnh đạo', 'Tổ chức sự kiện', 'Làm việc nhóm', 'Khâu cơ bản', 'Đọc CT-scan bụng', 'Đọc X-quang bụng'].map((ten, i) => ({ id: 'l' + i, nhom: i < 3 ? 'A' : 'B', ten, mo_ta: null, thu_tu: i, dang_dung: true }));
  const gn = [{ id: 'g1', thanh_vien_id: me().id, nang_luc_id: 'l0', bac: 1, trang_thai: 'dat', ngay_dat: '2026-10-10', minh_chung: 'Điều hành buổi mẫu', lien_ket: null }, { id: 'g2', thanh_vien_id: me().id, nang_luc_id: 'l0', bac: 2, trang_thai: 'dang_ren' }, { id: 'g3', thanh_vien_id: 't4', nang_luc_id: 'l3', bac: 1, trang_thai: 'cho', minh_chung: 'Đạt buổi thực hành mẫu', gui_luc: new Date().toISOString() }];
  const hd = [{ id: 'h1', thanh_vien_id: me().id, loai: 'chuyen_de', ten: 'Chuyên đề mẫu', ngay: '2026-10-01', so_gio: null, trang_thai: 'dat', lien_ket: null }, { id: 'h2', thanh_vien_id: 't5', loai: 'trao_lai', ten: 'Dạy khâu mẫu', ngay: '2026-10-02', so_gio: 2, trang_thai: 'cho', gui_luc: new Date().toISOString() }];
  const bai = [
    { id: 'p1', tieu_de: 'Post-test mẫu', mo_ta: null, thoi_gian_phut: 10, mo_luc: null, dong_luc: new Date(nay + 3 * ngay).toISOString(), so_lan: 1, hien_dap_an: 'sau_gui', trang_thai: 'mo', buoi_id: null, tao_luc: new Date(nay - ngay).toISOString() },
    { id: 'p2', tieu_de: 'Test đầu giờ mẫu', mo_ta: 'Bài mẫu gắn với buổi đang diễn ra.\nViết tắt: CPR – hồi sinh tim phổi.', thoi_gian_phut: 20, mo_luc: null, dong_luc: new Date(nay + 4 * 3600e3).toISOString(), so_lan: 1, hien_dap_an: 'sau_gui', trang_thai: 'mo', buoi_id: 'b2', tao_luc: new Date(nay - 3600e3).toISOString() },
    { id: 'p3', tieu_de: 'Test đầu giờ tuần trước', mo_ta: null, thoi_gian_phut: 20, mo_luc: null, dong_luc: buoi[0].bat_dau, so_lan: 1, hien_dap_an: 'sau_dong', trang_thai: 'mo', buoi_id: 'b1', tao_luc: new Date(nay - 8 * ngay).toISOString() }
  ];
  const HINH = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320"><rect width="480" height="320" fill="#000"/><ellipse cx="240" cy="160" rx="210" ry="135" fill="#4a4a4a"/><circle cx="190" cy="150" r="46" fill="#9a9a9a"/><circle cx="292" cy="178" r="34" fill="#828282"/><path d="M300 70l-22 30" stroke="#fff" stroke-width="6"/><text x="240" y="306" fill="#fff" font-size="15" text-anchor="middle" font-family="sans-serif">Hình minh họa</text></svg>');
  const cau = [
    { id: 'c1', bai_id: 'p1', phan: 'PHẦN A. KIẾN THỨC NỀN', noi_dung: 'Câu hỏi mẫu thứ nhất?', lua_chon: ['Lựa chọn một', 'Lựa chọn hai', 'Lựa chọn ba', 'Lựa chọn bốn'], dung: 1, hinh: null },
    { id: 'c2', bai_id: 'p1', phan: 'PHẦN A. KIẾN THỨC NỀN', noi_dung: 'Câu hỏi mẫu thứ hai, dài hơn một chút để thử xuống dòng trên màn hình điện thoại?', lua_chon: ['Một', 'Hai', 'Ba', 'Bốn'], dung: 2, hinh: null },
    { id: 'c3', bai_id: 'p2', phan: 'Đọc hình ảnh', noi_dung: 'Quan sát hình dưới đây. Mũi tên chỉ cấu trúc nào?\nChọn một đáp án đúng nhất.', lua_chon: ['Quai ruột giãn', 'Dịch tự do', 'Khí trong thành ruột', 'Vùng chuyển tiếp'], dung: 3, hinh: HINH },
    { id: 'c4', bai_id: 'p2', phan: 'Kiến thức', noi_dung: 'Câu chữ mẫu không có hình?', lua_chon: ['Một', 'Hai', 'Ba', 'Bốn'], dung: 0, hinh: null },
    { id: 'c5', bai_id: 'p3', phan: null, noi_dung: 'Câu của bài tuần trước?', lua_chon: ['Một', 'Hai'], dung: 0, hinh: null }
  ];
  const lam = [3, 5, 6, 7, 10, 13].map((i, k) => ({ id: 'l' + i, bai_id: 'p3', thanh_vien_id: 't' + i, lan: 1, han_luc: buoi[0].bat_dau, nop_luc: buoi[0].bat_dau, tra_loi: {}, so_dung: k % 3 ? 1 : 0, tong: 1, diem: k % 3 ? 10 : 0 }));
  const giao = [{ buoi_id: 'b2', thanh_vien_id: 't2' }];
  const caiDat = { danh_muc_da_duyet: false, chi_nhan_ma_dong: true };
  const duocQuet = (b) => { const t = me(); return t.vai_tro !== 'thanh_vien' || t.cap === 'Ban cố vấn' || giao.some(g => g.buoi_id === b && g.thanh_vien_id === t.id); };
  const kyMa = async (ma, w, biMat) => {
    const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(biMat), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return [...new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(`${ma}.${w}`)))].map(x => x.toString(16).padStart(2, '0')).join('').slice(0, 12);
  };
  const daDiemDanh = (b, t) => !b || dd.some(x => x.buoi_id === b && x.thanh_vien_id === t);
  const soanDuoc = (nhom) => { const t = me(); return t.vai_tro !== 'thanh_vien' || t.cap === 'Ban cố vấn' || (!!t.chuc_vu && khoaNha(t.nha) === nhom); };
  const lich = [{ id: 'k1', buoi_id: 'b1', loai: 'tuan', nhom: 'suzaku', ngay: buoi[0].bat_dau.slice(0, 10), ten: 'Lịch sinh hoạt tuần', trang_thai: 'da_gui', nguoi_tao: 't1', nguoi_tao_ten: 'TRẦN THỊ B', gui_luc: buoi[0].bat_dau, sua_luc: buoi[0].bat_dau,
    du_lieu: { mau: 'tuan', kho: 'post', nhom: 'suzaku', ngay: buoi[0].bat_dau.slice(0, 10), gioBD: '14:00', gioKT: '16:00', dd1: 'Phòng A', dd2: 'ĐHYK Phạm Ngọc Thạch', chuTri: 'BS. Nguyễn Văn A', dieuHanh: 'SV. Trần Thị B', tenCT: '', phuCT: '', moTa: '', qrLink: '', qrNote: '',
      rows: [{ t1: '14:00', t2: '15:00', title: 'Chuyên đề mẫu', who: 'SV. Lê Minh C', org: 'kirin' }, { t1: '15:00', t2: '16:00', title: 'Thông báo chung', who: 'Ban tổ chức', org: '' }] } }];
  const gioi =(ms = 60) => new Promise(r => setTimeout(r, ms));
  const tt = (b, t) => {
    const d = dd.find(x => x.buoi_id === b.id && x.thanh_vien_id === t.id);
    const x = don.find(y => y.buoi_id === b.id && y.thanh_vien_id === t.id && y.trang_thai === 'duyet');
    if (!d) return { trang_thai: x ? 'phep' : 'vang', luc: null, tre_phut: null, cach: null, ly_do: x ? x.ly_do : null };
    const tre = d.cach !== 'bo_sung' && new Date(d.luc) > new Date(new Date(b.bat_dau).getTime() + b.tre_sau_phut * 60e3);
    return { trang_thai: tre ? 'tre' : 'dung', luc: d.luc, tre_phut: tre ? Math.ceil((new Date(d.luc) - new Date(b.bat_dau)) / 60e3) : null, cach: d.cach, ly_do: null };
  };
  const dem = (ds) => { const o = { tong: ds.length, dung: 0, tre: 0, phep: 0, vang: 0 }; ds.forEach(x => { o[x]++; }); return o; };
  const cham = (l, tl, tuDong) => {
    const cs = cau.filter(c => c.bai_id === l.bai_id), d = cs.filter(c => tl[c.id] === c.dung).length;
    Object.assign(l, { tra_loi: tl, nop_luc: new Date().toISOString(), tu_dong: tuDong, so_dung: d, tong: cs.length, diem: Math.round(d * 1000 / cs.length) / 100 });
    return l;
  };
  const coBoSung = (r, o) => Object.assign(r, o);

  return {
    coPhien: () => phien,
    async dangNhap() { phien = true; },
    async dangXuat() { phien = false; },
    async doiMatKhau() {},
    async kichHoat() {},
    async theCongKhai(k) { await gioi(); const t = tv.find(x => x.khoa_qr === k); return t ? { ho_ten: t.ho_ten, gen: t.gen, nha: t.nha, cap: t.cap, hoat_dong: t.hoat_dong } : null; },
    async toi() {
      const t = me(), bcv = t.cap === 'Ban cố vấn', pt = t.vai_tro !== 'thanh_vien' || bcv;
      return Object.assign({}, t, { la_admin: t.vai_tro === 'quan_tri', la_quan_tri: t.vai_tro === 'quan_tri' || bcv, la_phu_trach: pt, xem_duoc_ten: pt, lich_moi_nha: pt, lich_nha: t.chuc_vu ? t.nha : null,
        buoi_diem_danh: giao.filter(g => g.thanh_vien_id === t.id && !buoi.find(b => b.id === g.buoi_id).dong).map(g => g.buoi_id), bay_gio: new Date().toISOString() });
    },
    async caiDat() { return Object.assign({}, caiDat); },
    async datCaiDat(k, v) { caiDat[k] = v; },
    async maDongCuaToi() { await gioi(); return { ma: me().ma, bi_mat: 'demo-' + me().id, bay_gio: new Date().toISOString() }; },
    async nguoiDiemDanh(b) { return giao.filter(g => g.buoi_id === b).map(g => ({ thanh_vien_id: g.thanh_vien_id })); },
    async datNguoiDiemDanh(b, ids) { for (let i = giao.length - 1; i >= 0; i--) if (giao[i].buoi_id === b) giao.splice(i, 1); ids.forEach(x => giao.push({ buoi_id: b, thanh_vien_id: x })); },
    async dsThanhVien() { await gioi(); return tv.map(t => Object.assign({}, t)); },
    async themThanhVien(o) { const t = Object.assign({ id: uid(), khoa_qr: uid().padEnd(16, '0').slice(0, 16) }, o); tv.push(t); return t; },
    async suaThanhVien(id, o) { coBoSung(tv.find(t => t.id === id), o); },
    async tinhTrangKichHoat() { return tv.map((t, i) => ({ thanh_vien_id: t.id, da_kich_hoat: i < 7, ma_con_han: i === 7 })); },
    async capMaKichHoat(ids) { return ids.map(i => { const t = tv.find(x => x.id === i); return { id: i, ma: t.ma, ho_ten: t.ho_ten, ma_kich_hoat: 'DEMO' + uid().slice(1, 5).toUpperCase() }; }); },
    async dsBuoi(tu, den) { await gioi(); return buoi.filter(b => (!tu || new Date(b.bat_dau) >= new Date(tu)) && (!den || new Date(b.bat_dau) <= new Date(den))).sort((a, b) => new Date(a.bat_dau) - new Date(b.bat_dau)).map(b => Object.assign({}, b)); },
    async themBuoi(o) { const b = Object.assign({ id: uid(), dong: false }, o); buoi.push(b); return b; },
    async suaBuoi(id, o) { coBoSung(buoi.find(b => b.id === id), o); },
    async xoaBuoi(id) { buoi.splice(buoi.findIndex(b => b.id === id), 1); },
    async ghiDiemDanh(p) {
      await gioi(150);
      if (!duocQuet(p.buoi)) throw new Error('Bạn chưa được giao điểm danh buổi này');
      const b = buoi.find(x => x.id === p.buoi), luc = p.luc || new Date().toISOString();
      let t = null, cach = p.cach || 'qr';
      const m = String(p.khoa || '').match(/^NKTV1\.(NKTV-\d+)\.(\d+)\.([0-9a-f]{12})$/i);
      if (m) {
        t = tv.find(x => x.ma === m[1]);
        if (!t || m[3].toLowerCase() !== await kyMa(m[1], m[2], 'demo-' + t.id)) return { ok: false, loi: 'Mã không hợp lệ.' };
        const lech = new Date(luc).getTime() / 1000 - Number(m[2]) * 20;
        if (lech < -30 || lech > 60) return { ok: false, het_han: true, id: t.id, ho_ten: t.ho_ten, loi: 'Mã đã hết hạn, có thể là ảnh chụp. Nhờ bạn mở lại mã trên app.' };
        cach = 'ma_dong';
      } else if (p.khoa) {
        t = tv.find(x => x.khoa_qr === p.khoa);
        if (t && caiDat.chi_nhan_ma_dong && cach !== 'tay') return { ok: false, ma_cu: true, id: t.id, ho_ten: t.ho_ten, loi: 'Mã cố định trên thẻ hoặc ảnh chụp không dùng để điểm danh. Nhờ bạn mở app → Mã điểm danh của tôi.' };
      } else t = tv.find(x => x.id === p.tv);
      if (!t) return { ok: false, loi: 'Mã này không thuộc thành viên nào.' };
      const cu = dd.find(x => x.buoi_id === p.buoi && x.thanh_vien_id === t.id);
      if (!cu) dd.push({ buoi_id: p.buoi, thanh_vien_id: t.id, luc, cach });
      const r = tt(b, t);
      return { ok: true, moi: !cu, id: t.id, ma: t.ma, ho_ten: t.ho_ten, gen: t.gen, nha: t.nha, cap: t.cap, hoat_dong: t.hoat_dong, luc: r.luc, cach, tre_phut: r.tre_phut };
    },
    async xoaDiemDanh(b, t) { const i = dd.findIndex(x => x.buoi_id === b && x.thanh_vien_id === t); if (i >= 0) dd.splice(i, 1); },
    async bangDiemDanh(id) { await gioi(); const b = buoi.find(x => x.id === id); return tv.filter(t => t.hoat_dong).map(t => Object.assign({ thanh_vien_id: t.id, ma: t.ma, ho_ten: t.ho_ten, gen: t.gen, nha: t.nha, cap: t.cap }, tt(b, t))); },
    async soTongBuoi() { return { tong: 0, dung: 0, tre: 0, phep: 0, vang: 0 }; },
    async chuyenCan(id) { const t = tv.find(x => x.id === id); return dem(buoi.filter(b => b.dong && b.tinh_chuyen_can).map(b => tt(b, t).trang_thai)); },
    async lichSuCuaToi(tu, den) { return buoi.filter(b => new Date(b.bat_dau) >= new Date(tu) && new Date(b.bat_dau) <= new Date(den)).map(b => Object.assign({ buoi_id: b.id }, tt(b, me()))); },
    async diemNhom() {
      await gioi();
      const kq = [], r1 = (x) => x === null ? null : Math.round(x * 10) / 10;
      buoi.filter(b => b.dong && b.tinh_chuyen_can).forEach(b => {
        const bt = bai.filter(x => x.buoi_id === b.id && x.trang_thai === 'mo');
        NHA.forEach(n => {
          const ds = tv.filter(t => t.hoat_dong && t.nha === n && t.cap !== 'Ban cố vấn').map(t => ({ t, s: tt(b, t).trang_thai }));
          if (!ds.length) return;
          const c = { dung: 0, tre: 0, phep: 0, vang: 0 }; ds.forEach(x => { c[x.s]++; });
          const coMat = ds.filter(x => x.s === 'dung' || x.s === 'tre');
          const lan = (y, t) => lam.filter(l => l.bai_id === y.id && l.thanh_vien_id === t.id && l.nop_luc).map(l => l.diem);
          const diemTV = coMat.map(x => bt.reduce((s, y) => s + Math.max(0, ...lan(y, x.t)), 0) / (bt.length || 1));
          const soLam = coMat.filter(x => bt.some(y => lan(y, x.t).length)).length;
          const mau = ds.length - c.phep, cc = mau ? 60 * (c.dung + 0.5 * c.tre) / mau : null;
          const tb = bt.length && coMat.length ? diemTV.reduce((s, x) => s + x, 0) / coMat.length : null;
          const ts = bt.length ? 40 * (tb || 0) / 10 : null;
          kq.push(Object.assign({ buoi_id: b.id, bat_dau: b.bat_dau, nha: n, so_nguoi: ds.length, co_test: !!bt.length, so_lam: soLam, tb_test: tb, diem_cc: r1(cc), diem_test: r1(ts), tong: r1(cc === null ? null : bt.length ? cc + ts : cc * 100 / 60) }, c));
        });
      });
      return kq;
    },
    async baoCaoChuyenCan() { return tv.filter(t => t.hoat_dong).map(t => Object.assign({ ma: t.ma, ho_ten: t.ho_ten, gen: t.gen, nha: t.nha, cap: t.cap }, dem(buoi.filter(b => b.dong).map(b => tt(b, t).trang_thai)))); },
    async donCuaToi(id) { return don.filter(d => d.thanh_vien_id === id).map(d => Object.assign({}, d, { buoi: buoi.find(b => b.id === d.buoi_id) })); },
    async guiXinNghi(b, ly) { const c = don.find(d => d.buoi_id === b && d.thanh_vien_id === me().id); if (c) Object.assign(c, { ly_do: ly, trang_thai: 'cho' }); else don.push({ id: uid(), buoi_id: b, thanh_vien_id: me().id, ly_do: ly, trang_thai: 'cho', gui_luc: new Date().toISOString() }); },
    async huyXinNghi(id) { don.splice(don.findIndex(d => d.id === id), 1); },
    async dsDon(tt_) { return don.filter(d => !tt_ || d.trang_thai === tt_).map(d => Object.assign({}, d, { buoi: buoi.find(b => b.id === d.buoi_id), thanh_vien: tv.find(t => t.id === d.thanh_vien_id) })); },
    async xuLyDon(id, duyet, ph) { Object.assign(don.find(d => d.id === id), { trang_thai: duyet ? 'duyet' : 'tu_choi', phan_hoi: ph }); },
    async ghiVangPhep(b, t, ly) { don.push({ id: uid(), buoi_id: b, thanh_vien_id: t, ly_do: ly || 'Ghi hộ', trang_thai: 'duyet', gui_luc: new Date().toISOString() }); },
    async dsThongBao() { await gioi(); return tb.slice().sort((a, b) => b.ghim - a.ghim || new Date(b.dang_luc) - new Date(a.dang_luc)); },
    async daDoc() { return doc.slice(); },
    async danhDauDoc(id) { doc.push(id); },
    async themThongBao(o) { tb.push(Object.assign({ id: uid(), dang_luc: new Date().toISOString(), ghim: false }, o)); },
    async suaThongBao(id, o) { coBoSung(tb.find(x => x.id === id), o); },
    async xoaThongBao(id) { tb.splice(tb.findIndex(x => x.id === id), 1); },
    async dsNangLuc() { return nl.slice(); },
    async themNangLuc(o) { nl.push(Object.assign({ id: uid() }, o)); },
    async suaNangLuc(id, o) { coBoSung(nl.find(x => x.id === id), o); },
    async xoaNangLuc() {},
    async ghiNhanCua(id) { return gn.filter(g => g.thanh_vien_id === id); },
    async guiNangLuc(o) { const c = gn.find(g => g.thanh_vien_id === me().id && g.nang_luc_id === o.p_nang_luc && g.bac === o.p_bac); const m = { trang_thai: o.p_trang_thai, minh_chung: o.p_minh_chung, lien_ket: o.p_lien_ket, gui_luc: new Date().toISOString() }; if (c) Object.assign(c, m); else gn.push(Object.assign({ id: uid(), thanh_vien_id: me().id, nang_luc_id: o.p_nang_luc, bac: o.p_bac }, m)); },
    async xuLyNangLuc(id, duyet, ngay_) { Object.assign(gn.find(g => g.id === id), { trang_thai: duyet ? 'dat' : 'tu_choi', ngay_dat: ngay_ }); },
    async nangLucCho() { return gn.filter(g => g.trang_thai === 'cho').map(g => Object.assign({}, g, { nang_luc: nl.find(n => n.id === g.nang_luc_id), thanh_vien: tv.find(t => t.id === g.thanh_vien_id) })); },
    async hoatDongCua(id) { return hd.filter(x => x.thanh_vien_id === id); },
    async guiHoatDong(o) { hd.unshift({ id: uid(), thanh_vien_id: me().id, loai: o.p_loai, ten: o.p_ten, ngay: o.p_ngay, so_gio: o.p_so_gio, lien_ket: o.p_lien_ket, trang_thai: 'cho', gui_luc: new Date().toISOString() }); },
    async xuLyHoatDong(id, duyet) { Object.assign(hd.find(x => x.id === id), { trang_thai: duyet ? 'dat' : 'tu_choi' }); },
    async hoatDongCho() { return hd.filter(x => x.trang_thai === 'cho').map(x => Object.assign({}, x, { thanh_vien: tv.find(t => t.id === x.thanh_vien_id) })); },
    async diemTestCua(id) { return lam.filter(l => l.thanh_vien_id === id && l.nop_luc).map(l => ({ diem: l.diem, nop_luc: l.nop_luc, bai_id: l.bai_id, bai_test: bai.find(b => b.id === l.bai_id) })); },
    async dsLich() { await gioi(); return lich.slice(); },
    async docLich(id) { return lich.find(l => l.id === id); },
    async lichCuaBuoi(b) { return lich.find(l => l.buoi_id === b); },
    async luuLich(id, d, gui) {
      if (!soanDuoc(d.nhom)) throw new Error('Chỉ nhóm trưởng, nhóm phó nhà trực, Ban cố vấn và người phụ trách được soạn lịch cho nhà này.');
      const ten = d.mau === 'dacbiet' ? d.tenCT : 'Lịch sinh hoạt tuần';
      let l = lich.find(x => x.id === id);
      if (!l) { l = { id: uid(), nguoi_tao: me().id, nguoi_tao_ten: me().ho_ten, trang_thai: 'nhap' }; lich.unshift(l); }
      Object.assign(l, { du_lieu: d, nhom: d.nhom, ngay: d.ngay, ten, loai: d.mau, sua_luc: new Date().toISOString(), nguoi_sua_ten: me().ho_ten });
      if (gui) {
        l.trang_thai = 'da_gui'; l.gui_luc = l.gui_luc || new Date().toISOString();
        const bd = new Date(`${d.ngay}T${d.gioBD || '14:00'}:00+07:00`).toISOString();
        const o = { ten: d.mau === 'tuan' ? 'Sinh hoạt hằng tuần' : d.tenCT, bat_dau: bd, dia_diem: [d.dd1, d.dd2].filter(Boolean).join(', '), nhom_truc: d.nhom === 'koi' ? 'Yin-Yang Kois' : d.nhom[0].toUpperCase() + d.nhom.slice(1), chu_tri: d.chuTri, noi_dung: d.rows.map(r => `${r.t1} ${r.title}`).join('\n') };
        const c = buoi.find(b => b.id === l.buoi_id);
        if (c) Object.assign(c, o); else { const b = Object.assign({ id: uid(), tre_sau_phut: 10, tinh_chuyen_can: d.mau === 'tuan', dong: false, ket_thuc: null }, o); buoi.push(b); l.buoi_id = b.id; }
      }
      return { id: l.id, buoi_id: l.buoi_id, trang_thai: l.trang_thai };
    },
    async xoaLich(id) { lich.splice(lich.findIndex(l => l.id === id), 1); },
    async baiCuaToi() {
      return bai.filter(b => b.trang_thai === 'mo').map(b => {
        const ls = lam.filter(l => l.bai_id === b.id && l.thanh_vien_id === me().id), g = ls.filter(l => l.nop_luc), d = ls.find(l => !l.nop_luc);
        const u = buoi.find(x => x.id === b.buoi_id);
        return Object.assign({}, b, { so_cau: cau.filter(c => c.bai_id === b.id).length, da_gui: g.length, diem: g.length ? Math.max(...g.map(l => l.diem)) : null, dang_lam_den: d ? d.han_luc : null,
          buoi_ten: u ? u.ten : null, buoi_bat_dau: u ? u.bat_dau : null, da_diem_danh: daDiemDanh(b.buoi_id, me().id) });
      });
    },
    async batDauBai(id) {
      const b = bai.find(x => x.id === id);
      let l = lam.find(x => x.bai_id === id && x.thanh_vien_id === me().id && !x.nop_luc);
      if (!l) {
        if (!daDiemDanh(b.buoi_id, me().id)) throw new Error('Bài test đầu giờ chỉ mở sau khi bạn đã điểm danh buổi này.');
        l = { id: uid(), bai_id: id, thanh_vien_id: me().id, han_luc: new Date(Date.now() + b.thoi_gian_phut * 60e3).toISOString(), tra_loi: {} }; lam.push(l);
      }
      return { lam_id: l.id, han_luc: l.han_luc, bay_gio: new Date().toISOString(), tra_loi: l.tra_loi, tieu_de: b.tieu_de, mo_ta: b.mo_ta, cau: cau.filter(c => c.bai_id === id).map(c => ({ id: c.id, phan: c.phan, noi_dung: c.noi_dung, lua_chon: c.lua_chon, hinh: c.hinh })) };
    },
    async luuTamBai(id, tl) { lam.find(l => l.id === id).tra_loi = tl; },
    async guiBai(id, tl) { const l = cham(lam.find(x => x.id === id), tl, false); return { so_dung: l.so_dung, tong: l.tong, diem: l.diem }; },
    async xemLaiBai(id) {
      const b = bai.find(x => x.id === id), l = lam.filter(x => x.bai_id === id && x.thanh_vien_id === me().id && x.nop_luc)[0];
      const duoc = b.hien_dap_an === 'sau_gui';
      return { tieu_de: b.tieu_de, so_dung: l.so_dung, tong: l.tong, diem: l.diem, nop_luc: l.nop_luc, tu_dong: false, hien_dap_an: duoc, hien_dap_an_kieu: b.hien_dap_an, dong_luc: b.dong_luc, cau: duoc ? cau.filter(c => c.bai_id === id).map(c => ({ noi_dung: c.noi_dung, lua_chon: c.lua_chon, hinh: c.hinh, chon: l.tra_loi[c.id], dung: c.dung })) : null };
    },
    async dsBaiQuanTri() { return bai.map(b => { const u = buoi.find(x => x.id === b.buoi_id); return Object.assign({}, b, { cau_hoi: cau.filter(c => c.bai_id === b.id), buoi: u ? { bat_dau: u.bat_dau } : null }); }); },
    async docBaiQuanTri(id) { return Object.assign({}, bai.find(b => b.id === id), { cau: cau.filter(c => c.bai_id === id).map(c => Object.assign({}, c, { lua_chon: c.lua_chon.slice() })) }); },
    async luuBaiTest(p) {
      const id = p.id || uid(), c = bai.find(b => b.id === id);
      const m = { id, tieu_de: p.tieu_de, mo_ta: p.mo_ta, thoi_gian_phut: p.thoi_gian_phut, mo_luc: p.mo_luc, dong_luc: p.dong_luc, so_lan: p.so_lan, hien_dap_an: p.hien_dap_an, trang_thai: p.trang_thai, buoi_id: p.buoi_id || null, tao_luc: new Date().toISOString() };
      if (c) Object.assign(c, m); else bai.push(m);
      for (let i = cau.length - 1; i >= 0; i--) if (cau[i].bai_id === id) cau.splice(i, 1);
      p.cau.forEach(x => cau.push(Object.assign({ id: uid(), bai_id: id }, x)));
      return id;
    },
    async xoaBaiTest(id) { bai.splice(bai.findIndex(b => b.id === id), 1); },
    async thongKeBai(id) {
      const ls = lam.filter(l => l.bai_id === id && l.nop_luc), b = bai.find(x => x.id === id);
      const ds = tv.filter(t => b.buoi_id ? daDiemDanh(b.buoi_id, t.id) || ls.some(l => l.thanh_vien_id === t.id) : t.hoat_dong).map(t => { const l = ls.find(x => x.thanh_vien_id === t.id); return { ma: t.ma, ho_ten: t.ho_ten, gen: t.gen, nha: t.nha, diem: l ? l.diem : null, so_dung: l ? l.so_dung : null, tong: l ? l.tong : null, nop_luc: l ? l.nop_luc : null, tu_dong: false }; });
      const d = ls.map(l => l.diem);
      return { buoi_id: b.buoi_id, doi_tuong: ds.length, da_gui: ls.length, tb: d.length ? d.reduce((a, b) => a + b, 0) / d.length : null, cao: d.length ? Math.max(...d) : null, thap: d.length ? Math.min(...d) : null, ds,
        cau: cau.filter(c => c.bai_id === id).map(c => { const o = {}; ls.forEach(l => { const v = l.tra_loi[c.id]; if (v !== undefined) o[v] = (o[v] || 0) + 1; }); return { noi_dung: c.noi_dung, lua_chon: c.lua_chon, hinh: c.hinh, dung: c.dung, dem: o }; }) };
    }
  };
}
