// Bản chạy thử của phiếu trả lời bài giấy (migration 0019): cùng tên hàm với api.js, dữ liệu giả trong bộ nhớ.
// Phiếu mẫu gắn buổi b1 (tuần trước): tv (t2) đã điểm danh nên mở được, jr (t18) chưa điểm danh, bcv (t4) chỉ xem tiến độ.
// Mật khẩu của phiếu mẫu là "demo". Đáp án mẫu là dãy giả, không phải đáp án thật của đề nào.
// Học viên (migration 0025): g2 (phiếu A, 15 câu, tắt hiện điểm) và g3 (phiếu B, 5 câu, hiện điểm) gắn buổi bd5 "Lượng giá · Nhóm 1" của đợt XQ2627.
// ?demo=hv (h0) đã điểm danh bd5 nên thấy cả hai phiếu ở tab Hôm nay; ?demo=hvchua (h1) chưa điểm danh nên chưa thấy phiếu nào.
export function baiGiayGia({ tv, hv, dot, dotHv, buoi, dd, me, toiId }) {
  const cho = () => new Promise(r => setTimeout(r, 120));
  const laHV = () => hv.some(x => x.id === toiId());
  const laQT = () => { if (laHV()) return false; const t = me(); return t.vai_tro === 'quan_tri' || t.cap === 'Ban cố vấn'; };
  const laAdmin = () => !laHV() && me().vai_tro === 'quan_tri';
  const chuan = (s) => String(s || '').replace(/\s+/g, '').toLowerCase();
  const daDD = (bId, tId) => dd.some(x => x.buoi_id === bId && x.thanh_vien_id === tId);
  const sao = (o) => JSON.parse(JSON.stringify(o));
  const ghiDanh = (dotId, tId) => dotHv.some(x => x.dot_id === dotId && x.thanh_vien_id === tId && x.trang_thai === 'ghi_danh');
  // Như noi_bo.duoc_phieu (0025): học viên cần đang ghi danh đợt có buổi của phiếu; mở và gửi (ghi) còn cần đợt đang mở.
  const duocPhieu = (g, ghi) => {
    if (!laHV()) return true;
    const b = buoi.find(x => x.id === g.buoi_id);
    return !!(b && b.dot_id && ghiDanh(b.dot_id, toiId()) && (!ghi || (dot.find(d => d.id === b.dot_id) || {}).trang_thai === 'mo'));
  };
  const nguoiDoc = () => laHV() ? 'giám thị' : 'Ban cố vấn';

  const bai = [{
    id: 'g1', ten: 'Pretest thống kê y sinh', buoi_id: 'b1', so_cau: 20, so_lua_chon: 5, chua_hieu: 4,
    chu_thich: 'E: Em hoàn toàn chưa hiểu khái niệm trong câu hỏi',
    phan: [{ ten: 'Nền', tu: 1, den: 7 }, { ten: 'Áp dụng', tu: 8, den: 15 }, { ten: 'Dẫn dắt', tu: 16, den: 20 }],
    mo: true, hien_diem: true, tao_luc: new Date().toISOString()
  }, {
    id: 'g2', ten: 'Lượng giá · Phiếu A (đề 1a)', buoi_id: 'bd5', so_cau: 15, so_lua_chon: 4, chua_hieu: null, chu_thich: null, phan: [],
    mo: true, hien_diem: false, tao_luc: new Date().toISOString()
  }, {
    id: 'g3', ten: 'Lượng giá · Phiếu B (đề 1a)', buoi_id: 'bd5', so_cau: 5, so_lua_chon: 4, chua_hieu: null, chu_thich: null, phan: [],
    mo: true, hien_diem: true, tao_luc: new Date().toISOString()
  }];
  const khoa = {
    g1: { dap_an: Array.from({ length: 20 }, (_, i) => (i * 7 + 3) % 4), mat_khau: 'demo' },
    g2: { dap_an: Array.from({ length: 15 }, (_, i) => (i * 5 + 1) % 4), mat_khau: 'demo' },
    g3: { dap_an: [2, 0, 3, 1, 2], mat_khau: 'demo' }
  };
  const lam = [];
  // Vài người đã gửi để màn kết quả có số liệu. Câu càng về sau càng ít người đúng, chừng một phần tám chọn E.
  let hat = 11;
  const ngauNhien = () => (hat = (hat * 9301 + 49297) % 233280) / 233280;
  ['t1', 't3', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't13'].forEach((id, k) => {
    const tra_loi = khoa.g1.dap_an.map((d, i) => {
      const r = ngauNhien(), de = i >= 15 ? 0.3 : i >= 7 ? 0.5 : 0.72;
      if (r < de) return d;
      if (r < de + 0.13) return 4;
      if (r > 0.97) return null;
      return (d + 1 + Math.floor(ngauNhien() * 3)) % 4;
    });
    const luc = new Date(Date.now() - (50 - k) * 60e3).toISOString();
    lam.push({ bai_id: 'g1', thanh_vien_id: id, mo_luc: luc, lan_sai: 0, sai_luc: null, tra_loi, gui_luc: luc, nhap_ho_boi: id === 't9' ? 't0' : null });
  });

  const timBai = (id) => { const g = bai.find(x => x.id === id); if (!g) throw new Error('Không có phiếu này.'); return g; };
  const cuaToi = (id) => lam.find(l => l.bai_id === id && l.thanh_vien_id === toiId());
  const docTraLoi = (tl, g) => {
    if (!Array.isArray(tl) || tl.length !== g.so_cau) throw new Error(`Phiếu cần đủ ${g.so_cau} câu.`);
    if (tl.some(x => x !== null && !(Number.isInteger(x) && x >= 0 && x < g.so_lua_chon))) throw new Error('Câu trả lời không hợp lệ.');
    return tl.slice();
  };
  const soDung = (tl, da) => da ? da.filter((d, i) => d !== null && tl[i] === d).length : null;
  const buoiCua = (g) => buoi.find(b => b.id === g.buoi_id) || {};

  return {
    async baiGiayCuaToi() {
      await cho();
      // Như bai_giay_cua_toi 0025: phiếu của buổi CLB hiện như cũ cho thành viên; phiếu của buổi thuộc đợt chỉ hiện khi đã điểm danh buổi đó hoặc đã gửi.
      return bai.filter(g => (g.mo || (cuaToi(g.id) || {}).gui_luc) && duocPhieu(g, false)
        && ((!buoiCua(g).dot_id && !laHV()) || daDD(g.buoi_id, toiId()) || (cuaToi(g.id) || {}).gui_luc)).map(g => {
        const l = cuaToi(g.id) || {};
        return { id: g.id, ten: g.ten, so_cau: g.so_cau, mo: g.mo, buoi_bat_dau: buoiCua(g).bat_dau, da_diem_danh: daDD(g.buoi_id, toiId()), da_mo: !!l.mo_luc, gui_luc: l.gui_luc || null };
      });
    },
    async xemBaiGiay(id) {
      await cho();
      const g = timBai(id), l = cuaToi(id) || {}, b = buoiCua(g);
      if (!duocPhieu(g, false)) throw new Error('Phiếu này không thuộc khóa học của bạn.');
      if (!g.mo && !l.gui_luc) throw new Error('Phiếu này chưa mở hoặc đã đóng.');
      return {
        id: g.id, ten: g.ten, so_cau: g.so_cau, so_lua_chon: g.so_lua_chon, chua_hieu: g.chua_hieu, chu_thich: g.chu_thich, mo: g.mo,
        buoi_ten: b.ten, buoi_bat_dau: b.bat_dau, da_diem_danh: daDD(g.buoi_id, toiId()), da_mo: !!l.mo_luc, gui_luc: l.gui_luc || null,
        nhap_ho: !!l.nhap_ho_boi, tra_loi: l.mo_luc ? (l.tra_loi ? l.tra_loi.slice() : null) : null,
        so_dung: g.hien_diem && l.gui_luc ? soDung(l.tra_loi, khoa[g.id].dap_an) : null
      };
    },
    async moBaiGiay(id, mk) {
      await cho();
      const g = timBai(id);
      if (!g.mo) throw new Error('Phiếu này chưa mở hoặc đã đóng.');
      if (!duocPhieu(g, true)) throw new Error('Phiếu này không thuộc khóa học đang mở của bạn.');
      if (!daDD(g.buoi_id, toiId())) throw new Error('Phiếu chỉ mở cho người đã điểm danh buổi này. Nhờ người điểm danh quét mã của bạn rồi thử lại.');
      let l = cuaToi(id);
      if (!l) { l = { bai_id: id, thanh_vien_id: toiId(), mo_luc: null, lan_sai: 0, sai_luc: null, tra_loi: null, gui_luc: null, nhap_ho_boi: null }; lam.push(l); }
      if (l.mo_luc) return { ok: true };
      if (l.lan_sai >= 5 && Date.now() - l.sai_luc < 60e3) return { ok: false, loi: 'Sai mật khẩu nhiều lần. Chờ một phút rồi thử lại.' };
      if (!khoa[id].mat_khau) throw new Error('Phiếu chưa có mật khẩu. Báo lại cho ' + nguoiDoc() + '.');
      if (chuan(mk) !== khoa[id].mat_khau) { l.lan_sai++; l.sai_luc = Date.now(); return { ok: false, loi: 'Mật khẩu chưa đúng.' }; }
      l.mo_luc = new Date().toISOString(); l.lan_sai = 0; l.sai_luc = null;
      return { ok: true };
    },
    async guiBaiGiay(id, tl) {
      await cho();
      const g = timBai(id);
      if (!g.mo) throw new Error('Phiếu đã đóng. Chưa kịp gửi thì báo ' + nguoiDoc() + '.');
      if (!duocPhieu(g, true)) throw new Error('Phiếu này không thuộc khóa học đang mở của bạn.');
      const l = cuaToi(id);
      if (!l || !l.mo_luc) throw new Error('Cần nhập mật khẩu để mở phiếu trước.');
      if (l.gui_luc) throw new Error('Bạn đã gửi phiếu này rồi. Cần sửa thì báo ' + nguoiDoc() + '.');
      l.tra_loi = docTraLoi(tl, g); l.gui_luc = new Date().toISOString();
      return this.xemBaiGiay(id);
    },

    async dsBaiGiay() {
      await cho();
      if (!laQT()) throw new Error('Chỉ quản trị và Ban cố vấn.');
      return bai.map(g => ({ id: g.id, ten: g.ten, so_cau: g.so_cau, mo: g.mo, buoi_bat_dau: buoiCua(g).bat_dau, buoi_ten: buoiCua(g).ten,
        da_gui: lam.filter(l => l.bai_id === g.id && l.gui_luc).length, da_diem_danh: dd.filter(x => x.buoi_id === g.buoi_id).length }));
    },
    async tienDoBaiGiay(id) {
      await cho();
      if (!laQT()) throw new Error('Chỉ quản trị và Ban cố vấn.');
      const g = timBai(id), b = buoiCua(g);
      return {
        bai: Object.assign(sao(g), { buoi_ten: b.ten, buoi_bat_dau: b.bat_dau, co_mat_khau: !!khoa[id].mat_khau, so_dap_an: (khoa[id].dap_an || []).filter(x => x !== null).length }),
        // Buổi CLB: thành viên còn hoạt động hoặc đã gửi. Buổi của đợt: học viên ghi danh đợt đó, cộng ai đã điểm danh hay đã gửi (0025).
        nguoi: (b.dot_id
          ? hv.filter(t => ghiDanh(b.dot_id, t.id) || daDD(g.buoi_id, t.id) || lam.some(l => l.bai_id === id && l.thanh_vien_id === t.id && l.gui_luc))
          : tv.filter(t => t.loai !== 'hoc_vien' && (t.hoat_dong || lam.some(l => l.bai_id === id && l.thanh_vien_id === t.id && l.gui_luc)))).map(t => {
          const l = lam.find(x => x.bai_id === id && x.thanh_vien_id === t.id) || {};
          return { id: t.id, ma: t.ma, ho_ten: t.ho_ten, gen: t.gen, nha: t.nha, cap: t.cap, da_diem_danh: daDD(g.buoi_id, t.id), gui_luc: l.gui_luc || null, nhap_ho: !!l.nhap_ho_boi };
        })
      };
    },
    async nhapHoBaiGiay(id, tId, tl) {
      await cho();
      if (!laAdmin()) throw new Error('Chỉ quản trị được sửa phiếu của người khác.');
      const g = timBai(id), v = docTraLoi(tl, g);
      const nguoi = [...tv, ...hv].find(x => x.id === tId);
      if (!nguoi || (nguoi.loai === 'hoc_vien' && !ghiDanh(buoiCua(g).dot_id, tId))) throw new Error('Không có người này trong danh sách của phiếu.');
      let l = lam.find(x => x.bai_id === id && x.thanh_vien_id === tId);
      const luc = new Date().toISOString();
      if (!l) { l = { bai_id: id, thanh_vien_id: tId, mo_luc: luc, lan_sai: 0, sai_luc: null }; lam.push(l); }
      Object.assign(l, { tra_loi: v, gui_luc: luc, mo_luc: l.mo_luc || luc, nhap_ho_boi: me().id });
    },
    async xoaBaiGiayLam(id, tId) {
      await cho();
      if (!laAdmin()) throw new Error('Chỉ quản trị được xóa bài đã gửi.');
      const l = lam.find(x => x.bai_id === id && x.thanh_vien_id === tId);
      if (l) Object.assign(l, { tra_loi: null, gui_luc: null, nhap_ho_boi: null });
    },
    async ketQuaBaiGiay(id) {
      await cho();
      if (!laAdmin()) throw new Error('Chỉ quản trị xem được kết quả và đáp án.');
      timBai(id);
      return {
        dap_an: khoa[id].dap_an ? khoa[id].dap_an.slice() : null,
        bai_lam: lam.filter(l => l.bai_id === id && l.gui_luc).map(l => {
          const t = [...tv, ...hv].find(x => x.id === l.thanh_vien_id);
          return { id: t.id, ma: t.ma, ho_ten: t.ho_ten, gen: t.gen, nha: t.nha, cap: t.cap, tra_loi: l.tra_loi.slice(), gui_luc: l.gui_luc, nhap_ho: !!l.nhap_ho_boi };
        }).sort((a, b) => a.ma.localeCompare(b.ma))
      };
    },
    async luuBaiGiay(p) {
      await cho();
      if (!laAdmin()) throw new Error('Chỉ quản trị được tạo và sửa phiếu.');
      let g;
      if (!p.id) {
        g = { id: 'g' + (bai.length + 1) + Math.random().toString(36).slice(2, 6), ten: String(p.ten || '').trim(), buoi_id: p.buoi_id, so_cau: p.so_cau || 20, so_lua_chon: p.so_lua_chon || 5,
          chua_hieu: p.chua_hieu ?? null, chu_thich: (p.chu_thich || '').trim() || null, phan: p.phan || [], mo: false, hien_diem: true, tao_luc: new Date().toISOString() };
        if (!g.ten) throw new Error('Cần đặt tên phiếu.');
        bai.push(g); khoa[g.id] = { dap_an: null, mat_khau: null };
      } else {
        g = timBai(p.id);
        const coBai = lam.some(l => l.bai_id === g.id && l.tra_loi);
        if (coBai && (('so_cau' in p && p.so_cau !== g.so_cau) || ('so_lua_chon' in p && p.so_lua_chon !== g.so_lua_chon))) throw new Error('Đã có người gửi phiếu nên không đổi được số câu hay số phương án.');
        const truoc = sao(g);
        ['ten', 'buoi_id', 'so_cau', 'so_lua_chon', 'chua_hieu', 'chu_thich', 'phan', 'mo', 'hien_diem'].forEach(k => { if (k in p) g[k] = p[k]; });
        if (g.mo && !khoa[g.id].mat_khau) { Object.assign(g, truoc); throw new Error('Đặt mật khẩu trước khi mở phiếu.'); }
      }
      if ('dap_an' in p) khoa[g.id].dap_an = docTraLoi(p.dap_an, g);
      else if (khoa[g.id].dap_an && (khoa[g.id].dap_an.length !== g.so_cau || khoa[g.id].dap_an.some(x => x >= g.so_lua_chon))) khoa[g.id].dap_an = null;
      return g.id;
    },
    async datMatKhauBaiGiay(id, mk) {
      await cho();
      if (!laAdmin()) throw new Error('Chỉ quản trị được đặt mật khẩu.');
      if (chuan(mk).length < 4) throw new Error('Mật khẩu cần ít nhất 4 ký tự, không tính khoảng trắng.');
      timBai(id); khoa[id].mat_khau = chuan(mk);
    }
  };
}
