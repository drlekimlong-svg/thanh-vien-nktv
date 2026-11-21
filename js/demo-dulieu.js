// Bản chạy thử của phần dữ liệu cá nhân (migration 0020): cùng tên hàm với api.js, dữ liệu giả trong bộ nhớ.
// Mặc định mọi người đã đồng ý phiên bản hiện hành, trừ vài người để màn quản trị có số liệu.
// Thêm &dy=chua (chưa trả lời), &dy=cu (đồng ý phiên bản cũ) hoặc &dy=tuchoi vào URL để thử màn hỏi lại.
import { PHIEN_BAN } from './v-dulieu.js';

export function duLieuGia({ tv, hv, me, toiId }) {
  const cho = () => new Promise(r => setTimeout(r, 120));
  const q = new URLSearchParams(location.search).get('dy');
  const truoc = new Date(Date.now() - 3 * 86400e3).toISOString();
  const so = [];
  let sttYc = 0;
  tv.forEach((t, i) => {
    if (['t6', 't7'].includes(t.id)) return; // chưa trả lời
    if (t.id === 't5') { so.push({ tv: t.id, phien_ban: PHIEN_BAN, dong_y: false, dang_anh: false, nguon: 'hoi_lai', luc: truoc }); return; }
    so.push({ tv: t.id, phien_ban: PHIEN_BAN, dong_y: true, dang_anh: i % 3 !== 0, nguon: 'kich_hoat', luc: truoc });
  });
  (hv || []).forEach(t => so.push({ tv: t.id, phien_ban: PHIEN_BAN, dong_y: true, dang_anh: false, nguon: 'kich_hoat', luc: truoc }));
  const yc = [
    { id: ++sttYc, tv: 't3', loai: 'sua', noi_dung: 'Họ tên bị thiếu dấu (dữ liệu giả).', gui_luc: truoc, trang_thai: 'moi', phan_hoi: null, xu_ly_luc: null },
    { id: ++sttYc, tv: 't9', loai: 'xem', noi_dung: null, gui_luc: new Date(Date.now() - 9 * 86400e3).toISOString(), trang_thai: 'xong', phan_hoi: 'Đã gửi bản sao qua tin nhắn (dữ liệu giả).', xu_ly_luc: truoc }
  ];
  const id0 = toiId();
  // Trạng thái của người đang thử theo tham số dy.
  for (let i = so.length - 1; i >= 0; i--) if (so[i].tv === id0) so.splice(i, 1);
  if (q === 'cu') so.push({ tv: id0, phien_ban: '0.9', dong_y: true, dang_anh: false, nguon: 'kich_hoat', luc: truoc });
  else if (q === 'tuchoi') so.push({ tv: id0, phien_ban: PHIEN_BAN, dong_y: false, dang_anh: false, nguon: 'hoi_lai', luc: truoc });
  else if (q !== 'chua') so.push({ tv: id0, phien_ban: PHIEN_BAN, dong_y: true, dang_anh: true, nguon: 'kich_hoat', luc: truoc });

  const cuoi = (id) => { const ds = so.filter(x => x.tv === id); return ds.length ? ds[ds.length - 1] : null; };
  const ban = (x) => x ? { phien_ban: x.phien_ban, dong_y: x.dong_y, dang_anh: x.dang_anh, nguon: x.nguon, luc: x.luc } : null;
  const laAdmin = () => { const t = me(); return t && t.vai_tro === 'quan_tri'; };
  const ai = (id) => tv.find(t => t.id === id) || (hv || []).find(t => t.id === id);

  return {
    async dongYCuaToi() { await cho(); return ban(cuoi(toiId())); },
    async ghiDongY(phien, dongY, dangAnh, nguon) {
      await cho();
      so.push({ tv: toiId(), phien_ban: phien, dong_y: !!dongY, dang_anh: !!dangAnh, nguon, luc: new Date().toISOString() });
      return ban(cuoi(toiId()));
    },
    async guiYeuCauDuLieu(loai, noiDung) {
      await cho();
      if (yc.filter(y => y.tv === toiId() && ['moi', 'dang_xu_ly'].includes(y.trang_thai)).length >= 5) throw new Error('Bạn đang có 5 yêu cầu chưa xử lý xong. Chờ Ban chủ nhiệm trả lời rồi gửi tiếp.');
      yc.push({ id: ++sttYc, tv: toiId(), loai, noi_dung: (noiDung || '').trim() || null, gui_luc: new Date().toISOString(), trang_thai: 'moi', phan_hoi: null, xu_ly_luc: null });
      return sttYc;
    },
    async yeuCauCuaToi() { await cho(); return yc.filter(y => y.tv === toiId()).slice().reverse().map(({ tv: _, ...y }) => y); },
    async dsDongYDuLieu() {
      await cho();
      if (!laAdmin()) throw new Error('Chỉ quản trị xem được.');
      return [...tv, ...(hv || [])].map(t => {
        const x = cuoi(t.id);
        return { id: t.id, ma: t.ma, ho_ten: t.ho_ten, loai: t.loai || 'thanh_vien', hoat_dong: t.hoat_dong !== false, da_kich_hoat: !['t6'].includes(t.id),
          phien_ban: x ? x.phien_ban : null, dong_y: x ? x.dong_y : null, dang_anh: x ? x.dang_anh : null, luc: x ? x.luc : null };
      });
    },
    async dsYeuCauDuLieu() {
      await cho();
      if (!laAdmin()) throw new Error('Chỉ quản trị xem được.');
      return yc.map(y => { const t = ai(y.tv); return Object.assign({}, y, { tv: undefined, ma: t ? t.ma : null, ho_ten: t ? t.ho_ten : null, loai_tk: t ? (t.loai || 'thanh_vien') : null }); })
        .sort((a, b) => (['moi', 'dang_xu_ly'].includes(b.trang_thai) - ['moi', 'dang_xu_ly'].includes(a.trang_thai)) || (new Date(b.gui_luc) - new Date(a.gui_luc)));
    },
    async xuLyYeuCauDuLieu(id, tt, phanHoi) {
      await cho();
      if (!laAdmin()) throw new Error('Chỉ quản trị xử lý được.');
      const y = yc.find(x => x.id === id); if (!y) throw new Error('Không có yêu cầu này.');
      Object.assign(y, { trang_thai: tt, phan_hoi: (phanHoi || '').trim() || null, xu_ly_luc: ['xong', 'tu_choi'].includes(tt) ? new Date().toISOString() : null });
    }
  };
}
