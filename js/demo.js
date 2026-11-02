// Bản chạy thử trên máy (localhost, ?demo=admin|diem|tv): dữ liệu giả trong bộ nhớ, không gọi máy chủ.
// Cùng tên hàm với api.js để thử giao diện mà không chạm vào dữ liệu thật.
const uid = () => 'x' + Math.random().toString(36).slice(2, 12);
const NHA = ['Seiryu', 'Suzaku', 'Byakko', 'Genbu', 'Kirin', 'Yin-Yang Kois'];

export function demo(vai) {
  const tv = Array.from({ length: 18 }, (_, i) => ({
    id: 't' + i, ma: 'NKTV-' + String(i + 1).padStart(3, '0'), ho_ten: ['NGUYỄN VĂN', 'TRẦN THỊ', 'LÊ MINH'][i % 3] + ' ' + String.fromCharCode(65 + i),
    gen: 8 + (i % 4), nha: NHA[i % 6], cap: i === 0 ? 'Ban cố vấn' : 'Senior', hoat_dong: i !== 17, ghi_chu: null, khoa_qr: String(i).padStart(16, 'a'), vai_tro: 'thanh_vien', tham_gia_tu: null, user_id: null
  }));
  const dangNhap = vai === 'admin' ? 0 : vai === 'diem' ? 1 : 2;
  tv[0].vai_tro = 'quan_tri'; tv[1].vai_tro = 'diem_danh';
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
  const don = [{ id: 'd1', buoi_id: 'b3', thanh_vien_id: 't3', ly_do: 'Trùng lịch thi', trang_thai: 'cho', gui_luc: new Date(nay - 3600e3).toISOString(), phan_hoi: null }];
  const tb = [{ id: 'n1', tieu_de: 'Lịch tuần này', noi_dung: 'Nội dung mẫu của thông báo.\nDòng thứ hai.', ghim: true, dang_luc: new Date(nay - 3600e3).toISOString() }, { id: 'n2', tieu_de: 'Thông báo cũ', noi_dung: 'Mẫu.', ghim: false, dang_luc: new Date(nay - 5 * ngay).toISOString() }];
  const doc = [];
  const nl = ['Lãnh đạo', 'Tổ chức sự kiện', 'Làm việc nhóm', 'Khâu cơ bản', 'Đọc CT-scan bụng', 'Đọc X-quang bụng'].map((ten, i) => ({ id: 'l' + i, nhom: i < 3 ? 'A' : 'B', ten, mo_ta: null, thu_tu: i, dang_dung: true }));
  const gn = [{ id: 'g1', thanh_vien_id: me().id, nang_luc_id: 'l0', bac: 1, trang_thai: 'dat', ngay_dat: '2026-10-10', minh_chung: 'Điều hành buổi mẫu', lien_ket: null }, { id: 'g2', thanh_vien_id: me().id, nang_luc_id: 'l0', bac: 2, trang_thai: 'dang_ren' }, { id: 'g3', thanh_vien_id: 't4', nang_luc_id: 'l3', bac: 1, trang_thai: 'cho', minh_chung: 'Đạt buổi thực hành mẫu', gui_luc: new Date().toISOString() }];
  const hd = [{ id: 'h1', thanh_vien_id: me().id, loai: 'chuyen_de', ten: 'Chuyên đề mẫu', ngay: '2026-10-01', so_gio: null, trang_thai: 'dat', lien_ket: null }, { id: 'h2', thanh_vien_id: 't5', loai: 'trao_lai', ten: 'Dạy khâu mẫu', ngay: '2026-10-02', so_gio: 2, trang_thai: 'cho', gui_luc: new Date().toISOString() }];
  const bai = [{ id: 'p1', tieu_de: 'Post-test mẫu', mo_ta: null, thoi_gian_phut: 10, mo_luc: null, dong_luc: new Date(nay + 3 * ngay).toISOString(), so_lan: 1, hien_dap_an: 'sau_gui', trang_thai: 'mo', tao_luc: new Date(nay - ngay).toISOString() }];
  const cau = [
    { id: 'c1', bai_id: 'p1', phan: 'PHẦN A. KIẾN THỨC NỀN', noi_dung: 'Câu hỏi mẫu thứ nhất?', lua_chon: ['Lựa chọn một', 'Lựa chọn hai', 'Lựa chọn ba', 'Lựa chọn bốn'], dung: 1 },
    { id: 'c2', bai_id: 'p1', phan: 'PHẦN A. KIẾN THỨC NỀN', noi_dung: 'Câu hỏi mẫu thứ hai, dài hơn một chút để thử xuống dòng trên màn hình điện thoại?', lua_chon: ['Một', 'Hai', 'Ba', 'Bốn'], dung: 2 }
  ];
  const lam = [];
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
    async toi() { const t = me(); return Object.assign({}, t, { la_quan_tri: t.vai_tro === 'quan_tri', la_phu_trach: t.vai_tro !== 'thanh_vien', xem_duoc_ten: t.vai_tro !== 'thanh_vien' || t.cap === 'Ban cố vấn' }); },
    async caiDat() { return { danh_muc_da_duyet: false }; },
    async datCaiDat() {},
    async dsThanhVien() { await gioi(); return tv.map(t => Object.assign({}, t)); },
    async themThanhVien(o) { const t = Object.assign({ id: uid(), khoa_qr: uid().padEnd(16, '0').slice(0, 16) }, o); tv.push(t); return t; },
    async suaThanhVien(id, o) { coBoSung(tv.find(t => t.id === id), o); },
    async tinhTrangKichHoat() { return tv.map((t, i) => ({ thanh_vien_id: t.id, da_kich_hoat: i < 2, ma_con_han: i === 2 })); },
    async capMaKichHoat(ids) { return ids.map(i => { const t = tv.find(x => x.id === i); return { id: i, ma: t.ma, ho_ten: t.ho_ten, ma_kich_hoat: 'DEMO' + uid().slice(1, 5).toUpperCase() }; }); },
    async dsBuoi(tu, den) { await gioi(); return buoi.filter(b => (!tu || new Date(b.bat_dau) >= new Date(tu)) && (!den || new Date(b.bat_dau) <= new Date(den))).sort((a, b) => new Date(a.bat_dau) - new Date(b.bat_dau)).map(b => Object.assign({}, b)); },
    async themBuoi(o) { const b = Object.assign({ id: uid(), dong: false }, o); buoi.push(b); return b; },
    async suaBuoi(id, o) { coBoSung(buoi.find(b => b.id === id), o); },
    async xoaBuoi(id) { buoi.splice(buoi.findIndex(b => b.id === id), 1); },
    async ghiDiemDanh(p) {
      const t = p.khoa ? tv.find(x => x.khoa_qr === p.khoa) : tv.find(x => x.id === p.tv);
      if (!t) return { ok: false, loi: 'Mã này không thuộc thành viên nào.' };
      if (!dd.find(x => x.buoi_id === p.buoi && x.thanh_vien_id === t.id)) dd.push({ buoi_id: p.buoi, thanh_vien_id: t.id, luc: p.luc || new Date().toISOString(), cach: p.cach || 'qr' });
      return { ok: true };
    },
    async xoaDiemDanh(b, t) { const i = dd.findIndex(x => x.buoi_id === b && x.thanh_vien_id === t); if (i >= 0) dd.splice(i, 1); },
    async bangDiemDanh(id) { await gioi(); const b = buoi.find(x => x.id === id); return tv.filter(t => t.hoat_dong).map(t => Object.assign({ thanh_vien_id: t.id, ma: t.ma, ho_ten: t.ho_ten, gen: t.gen, nha: t.nha, cap: t.cap }, tt(b, t))); },
    async soTongBuoi() { return { tong: 0, dung: 0, tre: 0, phep: 0, vang: 0 }; },
    async chuyenCan(id) { const t = tv.find(x => x.id === id); return dem(buoi.filter(b => b.dong && b.tinh_chuyen_can).map(b => tt(b, t).trang_thai)); },
    async lichSuCuaToi(tu, den) { return buoi.filter(b => new Date(b.bat_dau) >= new Date(tu) && new Date(b.bat_dau) <= new Date(den)).map(b => Object.assign({ buoi_id: b.id }, tt(b, me()))); },
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
        return Object.assign({}, b, { so_cau: cau.filter(c => c.bai_id === b.id).length, da_gui: g.length, diem: g.length ? Math.max(...g.map(l => l.diem)) : null, dang_lam_den: d ? d.han_luc : null });
      });
    },
    async batDauBai(id) {
      const b = bai.find(x => x.id === id);
      let l = lam.find(x => x.bai_id === id && x.thanh_vien_id === me().id && !x.nop_luc);
      if (!l) { l = { id: uid(), bai_id: id, thanh_vien_id: me().id, han_luc: new Date(Date.now() + b.thoi_gian_phut * 60e3).toISOString(), tra_loi: {} }; lam.push(l); }
      return { lam_id: l.id, han_luc: l.han_luc, bay_gio: new Date().toISOString(), tra_loi: l.tra_loi, tieu_de: b.tieu_de, cau: cau.filter(c => c.bai_id === id).map(c => ({ id: c.id, phan: c.phan, noi_dung: c.noi_dung, lua_chon: c.lua_chon })) };
    },
    async luuTamBai(id, tl) { lam.find(l => l.id === id).tra_loi = tl; },
    async guiBai(id, tl) { const l = cham(lam.find(x => x.id === id), tl, false); return { so_dung: l.so_dung, tong: l.tong, diem: l.diem }; },
    async xemLaiBai(id) {
      const b = bai.find(x => x.id === id), l = lam.filter(x => x.bai_id === id && x.thanh_vien_id === me().id && x.nop_luc)[0];
      const duoc = b.hien_dap_an === 'sau_gui';
      return { tieu_de: b.tieu_de, so_dung: l.so_dung, tong: l.tong, diem: l.diem, nop_luc: l.nop_luc, tu_dong: false, hien_dap_an: duoc, hien_dap_an_kieu: b.hien_dap_an, dong_luc: b.dong_luc, cau: duoc ? cau.filter(c => c.bai_id === id).map(c => ({ noi_dung: c.noi_dung, lua_chon: c.lua_chon, chon: l.tra_loi[c.id], dung: c.dung })) : null };
    },
    async dsBaiQuanTri() { return bai.map(b => Object.assign({}, b, { cau_hoi: cau.filter(c => c.bai_id === b.id) })); },
    async docBaiQuanTri(id) { return Object.assign({}, bai.find(b => b.id === id), { cau: cau.filter(c => c.bai_id === id).map(c => Object.assign({}, c, { lua_chon: c.lua_chon.slice() })) }); },
    async luuBaiTest(p) {
      const id = p.id || uid(), c = bai.find(b => b.id === id);
      const m = { id, tieu_de: p.tieu_de, mo_ta: p.mo_ta, thoi_gian_phut: p.thoi_gian_phut, mo_luc: p.mo_luc, dong_luc: p.dong_luc, so_lan: p.so_lan, hien_dap_an: p.hien_dap_an, trang_thai: p.trang_thai, tao_luc: new Date().toISOString() };
      if (c) Object.assign(c, m); else bai.push(m);
      for (let i = cau.length - 1; i >= 0; i--) if (cau[i].bai_id === id) cau.splice(i, 1);
      p.cau.forEach(x => cau.push(Object.assign({ id: uid(), bai_id: id }, x)));
      return id;
    },
    async xoaBaiTest(id) { bai.splice(bai.findIndex(b => b.id === id), 1); },
    async thongKeBai(id) {
      const ls = lam.filter(l => l.bai_id === id && l.nop_luc);
      const ds = tv.filter(t => t.hoat_dong).map(t => { const l = ls.find(x => x.thanh_vien_id === t.id); return { ma: t.ma, ho_ten: t.ho_ten, gen: t.gen, nha: t.nha, diem: l ? l.diem : null, so_dung: l ? l.so_dung : null, tong: l ? l.tong : null, nop_luc: l ? l.nop_luc : null, tu_dong: false }; });
      const d = ls.map(l => l.diem);
      return { doi_tuong: ds.length, da_gui: ls.length, tb: d.length ? d.reduce((a, b) => a + b, 0) / d.length : null, cao: d.length ? Math.max(...d) : null, thap: d.length ? Math.min(...d) : null, ds,
        cau: cau.filter(c => c.bai_id === id).map(c => { const o = {}; ls.forEach(l => { const v = l.tra_loi[c.id]; if (v !== undefined) o[v] = (o[v] || 0) + 1; }); return { noi_dung: c.noi_dung, lua_chon: c.lua_chon, dung: c.dung, dem: o }; }) };
    }
  };
}
