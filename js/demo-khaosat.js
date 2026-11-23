// Bản chạy thử của khảo sát thành viên (migration 0021): cùng tên hàm với api.js, dữ liệu giả trong bộ nhớ.
// Nội dung lấy từ chính tệp JSON dùng để nạp lên máy chủ, nên bản chạy thử luôn khớp phiếu thật; hạn dời ra 2 ngày sau.
// Mười người giả đã gửi để màn kết quả có số liệu. ?demo=tv (Senior) và ?demo=jr (Junior) làm được khảo sát;
// ?demo=admin là Ban cố vấn nên chỉ xem trước và xem kết quả.
export function khaoSatGia({ tv, me }) {
  const cho = () => new Promise(r => setTimeout(r, 120));
  let ks = null;
  let hat = 7;
  const ngauNhien = () => (hat = (hat * 9301 + 49297) % 233280) / 233280;
  const chonMot = (ds) => ds[Math.floor(ngauNhien() * ds.length)];

  const hienCau = (cau, tl) => {
    const sach = {}, hien = new Set();
    for (const c of cau) {
      const dk = c.dieu_kien, v = dk ? sach[String(dk.cau)] : null;
      if (dk && !(dk.trong ? typeof v === 'string' && dk.trong.includes(v) : v !== undefined)) continue;
      hien.add(c.thu_tu);
      if (tl[String(c.thu_tu)] !== undefined) sach[String(c.thu_tu)] = tl[String(c.thu_tu)];
    }
    return hien;
  };

  async function nap() {
    if (ks) return ks;
    const d = await (await fetch('supabase/du_lieu/khao_sat_bm01_qltg.json')).json();
    ks = Object.assign({}, d, {
      id: 'ks1', han: new Date(Date.now() + 2 * 864e5).toISOString(), tao_luc: new Date().toISOString(),
      cau: d.cau.map((c, i) => Object.assign({ phan: null, ghi_chu: null, lua_chon: null, toi_da: null, nhan_thang: null, bat_buoc: true, dieu_kien: null }, c, { thu_tu: i + 1 })),
      tra_loi: [], da_gui: new Set()
    });
    ['t1', 't3', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't13'].forEach((id, n) => {
      const tl = {};
      ks.cau.forEach(c => {
        if (!hienCau(ks.cau.filter(x => x.thu_tu <= c.thu_tu), tl).has(c.thu_tu)) return;
        const k = String(c.thu_tu);
        if (c.thu_tu === 1) tl[k] = n < 6 ? 'Có' : n < 8 ? 'Chưa chắc' : 'Không tham gia';
        else if (c.loai === 'chon') tl[k] = chonMot(c.lua_chon);
        else if (c.loai === 'nhieu') { const s = c.lua_chon.filter(() => ngauNhien() < 0.3).slice(0, c.toi_da || 9); if (s.length || c.bat_buoc) tl[k] = s.length ? s : [c.lua_chon[0]]; }
        else if (c.loai === 'thang5') tl[k] = 1 + Math.floor(ngauNhien() * 5);
        else if (ngauNhien() < 0.5) tl[k] = c.loai === 'doan' ? 'Tuần trước vừa có bài kiểm tra vừa có hạn nộp bệnh án, em thức tới 2 giờ sáng hai đêm liền.' : 'Biết cách xếp lịch tuần cho thực tế hơn';
      });
      ks.tra_loi.push({ id: 'r' + n, luc: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(), tra_loi: tl });
      ks.da_gui.add(id);
    });
    return ks;
  }
  const laQT = () => { const t = me(); return t.vai_tro === 'quan_tri' || t.cap === 'Ban cố vấn'; };
  const thuoc = (k) => { const t = me(); return t.loai !== 'hoc_vien' && t.hoat_dong && k.doi_tuong.includes(t.cap); };
  const conHan = (k) => k.mo && (!k.han || new Date(k.han) > new Date());
  const doiTuong = (k) => tv.filter(t => t.hoat_dong && k.doi_tuong.includes(t.cap));
  const cauRa = (k) => k.cau.map(c => Object.assign({}, c));

  return {
    async khaoSatCuaToi() {
      await cho(); const k = await nap();
      return conHan(k) && thuoc(k) ? [{ id: k.id, ma: k.ma, ten: k.ten, han: k.han, an_danh: k.an_danh, so_cau: k.cau.length, da_gui: k.da_gui.has(me().id) }] : [];
    },
    async xemKhaoSat(id) {
      await cho(); const k = await nap();
      if (id !== k.id || !(laQT() || (k.mo && thuoc(k)))) return null;
      return { id: k.id, ma: k.ma, ten: k.ten, mo_ta: k.mo_ta, loi_ket: k.loi_ket, an_danh: k.an_danh, mo: k.mo, han: k.han, doi_tuong: k.doi_tuong,
        gui_duoc: conHan(k) && thuoc(k), da_gui: k.da_gui.has(me().id), cau: cauRa(k) };
    },
    async guiKhaoSat(id, tl) {
      await cho(); const k = await nap();
      if (!thuoc(k)) throw new Error('Khảo sát này không dành cho tài khoản của bạn');
      if (!conHan(k)) throw new Error('Khảo sát chưa mở hoặc đã đóng');
      if (k.da_gui.has(me().id)) throw new Error('Bạn đã gửi khảo sát này rồi');
      const hien = hienCau(k.cau, tl), sach = {};
      for (const c of k.cau) {
        if (!hien.has(c.thu_tu)) continue;
        const v = tl[String(c.thu_tu)];
        const rong = v === undefined || v === null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length);
        if (rong) { if (c.bat_buoc) throw new Error(`Câu ${c.thu_tu} chưa trả lời`); continue; }
        if (c.loai === 'chon' && !c.lua_chon.includes(v)) throw new Error(`Câu ${c.thu_tu}: lựa chọn không hợp lệ`);
        if (c.loai === 'nhieu' && (!Array.isArray(v) || v.some(x => !c.lua_chon.includes(x)) || (c.toi_da && v.length > c.toi_da))) throw new Error(`Câu ${c.thu_tu}: lựa chọn không hợp lệ`);
        if (c.loai === 'thang5' && ![1, 2, 3, 4, 5].includes(v)) throw new Error(`Câu ${c.thu_tu}: chọn một mức từ 1 đến 5`);
        sach[String(c.thu_tu)] = v;
      }
      k.da_gui.add(me().id);
      k.tra_loi.push({ id: 'r' + Date.now(), luc: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(), tra_loi: sach });
    },
    async dsKhaoSat() {
      await cho(); const k = await nap();
      return laQT() ? [{ id: k.id, ma: k.ma, ten: k.ten, mo: k.mo, han: k.han, an_danh: k.an_danh, doi_tuong: k.doi_tuong, so_gui: k.da_gui.size, so_doi_tuong: doiTuong(k).length }] : [];
    },
    async tongHopKhaoSat(id) {
      await cho(); const k = await nap();
      if (id !== k.id || !laQT()) return null;
      const ds = tv.filter(t => (t.hoat_dong && k.doi_tuong.includes(t.cap)) || k.da_gui.has(t.id));
      return { id: k.id, ma: k.ma, ten: k.ten, mo: k.mo, han: k.han, an_danh: k.an_danh, doi_tuong: k.doi_tuong, cau: cauRa(k),
        tra_loi: k.tra_loi.slice().sort((a, b) => (a.id < b.id ? -1 : 1)).map(r => ({ luc: r.luc, tra_loi: r.tra_loi })),
        nguoi: ds.map(t => ({ ma: t.ma, ho_ten: t.ho_ten, cap: t.cap, gen: t.gen, nha: t.nha, da_gui: k.da_gui.has(t.id), da_kich_hoat: t.id !== 't12' })) };
    },
    async datKhaoSat(id, mo, han) {
      await cho(); const k = await nap();
      if (!laQT()) throw new Error('Chỉ quản trị và Ban cố vấn được mở, đóng khảo sát');
      if (mo !== null && mo !== undefined) k.mo = !!mo;
      k.han = han || null;
    }
  };
}
