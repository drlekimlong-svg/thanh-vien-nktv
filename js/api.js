// Nói chuyện với Supabase bằng fetch, không cần thư viện. Mọi kiểm tra quyền nằm ở cơ sở dữ liệu.
const C = window.NKTV_CONFIG;
const KHOA = 'nktv-phien-v1';

let phien = null;
try { phien = JSON.parse(localStorage.getItem(KHOA)); } catch (_) {}
const luuPhien = (p) => { phien = p; try { p ? localStorage.setItem(KHOA, JSON.stringify(p)) : localStorage.removeItem(KHOA); } catch (_) {} };

const THONG_DICH = [
  [/Invalid login credentials/i, 'Mã thành viên hoặc mật khẩu không đúng.'],
  [/Failed to fetch|NetworkError|Load failed/i, 'Không có mạng hoặc máy chủ đang tạm dừng. Thử lại sau ít phút.'],
  [/JWT expired/i, 'Phiên đăng nhập đã hết hạn. Đăng nhập lại.'],
  [/thanh_vien_chuc_vu_nha/, 'Nhóm trưởng, nhóm phó cần thuộc một nhà. Chọn nhà cho người này trước.'],
  [/cau_hoi_hinh_check/, 'Hình quá lớn. Chọn hình khác hoặc cắt nhỏ lại.']
];
const loiViet = (m) => { for (const [a, b] of THONG_DICH) if (a.test(m)) return b; return m; };

async function goiFetch(url, tt) {
  let r;
  try { r = await fetch(url, tt); } catch (e) { throw new Error(loiViet(e.message)); }
  const chu = await r.text();
  let du = null;
  try { du = chu ? JSON.parse(chu) : null; } catch (_) { du = chu; }
  if (!r.ok) {
    const e = new Error(loiViet((du && (du.message || du.msg || du.error_description || du.loi)) || 'Lỗi máy chủ (' + r.status + ')'));
    e.status = r.status; throw e;
  }
  return du;
}

async function lamMoi() {
  if (!phien) return false;
  try {
    const d = await goiFetch(`${C.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', headers: { apikey: C.supabaseKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: phien.refresh_token })
    });
    luuPhien({ access_token: d.access_token, refresh_token: d.refresh_token, expires_at: d.expires_at });
    return true;
  } catch (e) {
    if (e.status === 400 || e.status === 401) { luuPhien(null); location.reload(); }
    throw e;
  }
}
let dangLamMoi = null;
async function matVe() {
  if (!phien) return null;
  if (phien.expires_at && phien.expires_at - Date.now() / 1000 < 60) {
    dangLamMoi = dangLamMoi || lamMoi().finally(() => { dangLamMoi = null; });
    await dangLamMoi;
  }
  return phien && phien.access_token;
}
async function dauDe(them) {
  const v = await matVe();
  return Object.assign({ apikey: C.supabaseKey, 'Content-Type': 'application/json' }, v ? { Authorization: 'Bearer ' + v } : null, them);
}
const rest = async (duong, tt = {}) => goiFetch(`${C.supabaseUrl}/rest/v1/${duong}`, Object.assign({}, tt, { headers: await dauDe(tt.headers) }));
const rpc = (ten, than = {}) => rest('rpc/' + ten, { method: 'POST', body: JSON.stringify(than) });
const them = (bang, o) => rest(bang, { method: 'POST', body: JSON.stringify(o), headers: { Prefer: 'return=representation' } });
const sua = (bang, id, o) => rest(`${bang}?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(o), headers: { Prefer: 'return=representation' } });
const xoa = (bang, id) => rest(`${bang}?id=eq.${id}`, { method: 'DELETE' });

export const emailTu = (ma) => `${ma.toLowerCase()}@${C.mienTaiKhoan}`;
/** Nhận "NKTV-001", "nktv001", "1" đều ra NKTV-001. */
export const chuanMa = (s) => {
  const so = String(s || '').replace(/\D/g, '');
  return so ? 'NKTV-' + so.padStart(3, '0') : '';
};

export const api = {
  coPhien: () => !!phien,
  async dangNhap(ma, matKhau) {
    const d = await goiFetch(`${C.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: { apikey: C.supabaseKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailTu(chuanMa(ma)), password: matKhau })
    });
    luuPhien({ access_token: d.access_token, refresh_token: d.refresh_token, expires_at: d.expires_at });
  },
  async dangXuat() {
    try { await goiFetch(`${C.supabaseUrl}/auth/v1/logout`, { method: 'POST', headers: await dauDe() }); } catch (_) {}
    luuPhien(null);
    try { localStorage.removeItem('nktv-ma-dong-v1'); } catch (_) {}
  },
  async doiMatKhau(moi) {
    await goiFetch(`${C.supabaseUrl}/auth/v1/user`, { method: 'PUT', headers: await dauDe(), body: JSON.stringify({ password: moi }) });
  },
  kichHoat: (ma, code, matKhau) => goiFetch(`${C.supabaseUrl}/functions/v1/kich-hoat`, {
    method: 'POST', headers: { apikey: C.supabaseKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ ma: chuanMa(ma), ma_kich_hoat: code, mat_khau: matKhau })
  }),
  theCongKhai: (khoa) => goiFetch(`${C.supabaseUrl}/rest/v1/rpc/the_thanh_vien`, {
    method: 'POST', headers: { apikey: C.supabaseKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_khoa: khoa })
  }),

  toi: () => rpc('toi_la_ai'),
  caiDat: async () => { const r = await rest('cai_dat?select=khoa,gia_tri'); const o = {}; r.forEach(x => { o[x.khoa] = x.gia_tri; }); return o; },
  datCaiDat: (khoa, gia_tri) => rest('cai_dat', { method: 'POST', body: JSON.stringify({ khoa, gia_tri }), headers: { Prefer: 'resolution=merge-duplicates' } }),

  dsThanhVien: () => rest('thanh_vien?select=id,ma,ho_ten,gen,nha,cap,chuc_vu,hoat_dong,ghi_chu,khoa_qr,vai_tro,tham_gia_tu&order=ma'),
  themThanhVien: async (o) => (await them('thanh_vien', o))[0],
  suaThanhVien: (id, o) => sua('thanh_vien', id, o),
  tinhTrangKichHoat: () => rpc('tinh_trang_kich_hoat'),
  capMaKichHoat: (ids) => rpc('cap_ma_kich_hoat', { p_ids: ids }),

  dsBuoi: (tu, den) => rest(`buoi?select=*${tu ? `&bat_dau=gte.${encodeURIComponent(tu)}` : ''}${den ? `&bat_dau=lte.${encodeURIComponent(den)}` : ''}&order=bat_dau`),
  themBuoi: async (o) => (await them('buoi', o))[0],
  suaBuoi: (id, o) => sua('buoi', id, o),
  xoaBuoi: (id) => xoa('buoi', id),
  nguoiDiemDanh: (buoi) => rest(`buoi_diem_danh?select=thanh_vien_id&buoi_id=eq.${buoi}`),
  datNguoiDiemDanh: (buoi, ids) => rpc('dat_nguoi_diem_danh', { p_buoi: buoi, p_ids: ids }),
  maDongCuaToi: () => rpc('ma_dong_cua_toi'),
  ghiDiemDanh: (p) => rpc('ghi_diem_danh', { p_buoi: p.buoi, p_khoa: p.khoa ?? null, p_tv: p.tv ?? null, p_luc: p.luc ?? null, p_cach: p.cach ?? 'qr' }),
  xoaDiemDanh: (buoi, tv) => rpc('xoa_diem_danh', { p_buoi: buoi, p_tv: tv }),
  bangDiemDanh: (buoi) => rpc('bang_diem_danh', { p_buoi: buoi }),
  soTongBuoi: (buoi) => rpc('so_tong_buoi', { p_buoi: buoi }),
  chuyenCan: (tv, tu, den) => rpc('chuyen_can', { p_tv: tv, p_tu: tu, p_den: den }),
  lichSuCuaToi: (tu, den) => rpc('lich_su_cua_toi', { p_tu: tu, p_den: den }),
  baoCaoChuyenCan: (tu, den) => rpc('bao_cao_chuyen_can', { p_tu: tu, p_den: den }),
  diemNhom: (tu, den) => rpc('diem_nhom', { p_tu: tu, p_den: den }),

  donCuaToi: (tv) => rest(`xin_nghi?select=*,buoi(ten,bat_dau)&thanh_vien_id=eq.${tv}&order=gui_luc.desc`),
  guiXinNghi: (buoi, lyDo) => rpc('gui_xin_nghi', { p_buoi: buoi, p_ly_do: lyDo }),
  huyXinNghi: (id) => rpc('huy_xin_nghi', { p_id: id }),
  dsDon: (tt) => rest(`xin_nghi?select=*,buoi(ten,bat_dau),thanh_vien!xin_nghi_thanh_vien_id_fkey(ma,ho_ten,gen,nha,cap)${tt ? `&trang_thai=eq.${tt}` : ''}&order=gui_luc.desc&limit=200`),
  xuLyDon: (id, duyet, phanHoi) => rpc('xu_ly_xin_nghi', { p_id: id, p_duyet: duyet, p_phan_hoi: phanHoi || null }),
  ghiVangPhep: (buoi, tv, lyDo) => rpc('ghi_vang_phep', { p_buoi: buoi, p_tv: tv, p_ly_do: lyDo }),

  dsThongBao: () => rest('thong_bao?select=*&order=ghim.desc,dang_luc.desc&limit=60'),
  daDoc: async (tv) => (await rest(`thong_bao_da_doc?select=thong_bao_id&thanh_vien_id=eq.${tv}`)).map(x => x.thong_bao_id),
  danhDauDoc: (id, tv) => rest('thong_bao_da_doc', { method: 'POST', body: JSON.stringify({ thong_bao_id: id, thanh_vien_id: tv }), headers: { Prefer: 'resolution=ignore-duplicates' } }),
  themThongBao: (o) => them('thong_bao', o),
  suaThongBao: (id, o) => sua('thong_bao', id, o),
  xoaThongBao: (id) => xoa('thong_bao', id),

  dsNangLuc: () => rest('nang_luc?select=*&order=thu_tu'),
  themNangLuc: (o) => them('nang_luc', o),
  suaNangLuc: (id, o) => sua('nang_luc', id, o),
  xoaNangLuc: (id) => xoa('nang_luc', id),
  ghiNhanCua: (tv) => rest(`nang_luc_ghi_nhan?select=*&thanh_vien_id=eq.${tv}`),
  guiNangLuc: (o) => rpc('gui_nang_luc', o),
  xuLyNangLuc: (id, duyet, ngay, phanHoi) => rpc('xu_ly_nang_luc', { p_id: id, p_duyet: duyet, p_ngay: ngay || null, p_phan_hoi: phanHoi || null }),
  nangLucCho: () => rest('nang_luc_ghi_nhan?select=*,nang_luc(ten),thanh_vien!nang_luc_ghi_nhan_thanh_vien_id_fkey(ma,ho_ten,gen,nha)&trang_thai=eq.cho&order=gui_luc'),
  hoatDongCua: (tv) => rest(`hoat_dong_ghi_nhan?select=*&thanh_vien_id=eq.${tv}&order=ngay.desc`),
  guiHoatDong: (o) => rpc('gui_hoat_dong', o),
  xuLyHoatDong: (id, duyet, phanHoi) => rpc('xu_ly_hoat_dong', { p_id: id, p_duyet: duyet, p_phan_hoi: phanHoi || null }),
  hoatDongCho: () => rest('hoat_dong_ghi_nhan?select=*,thanh_vien!hoat_dong_ghi_nhan_thanh_vien_id_fkey(ma,ho_ten,gen,nha)&trang_thai=eq.cho&order=gui_luc'),
  diemTestCua: (tv) => rest(`lam_bai?select=diem,nop_luc,bai_id,bai_test(tieu_de)&thanh_vien_id=eq.${tv}&nop_luc=not.is.null&order=nop_luc.desc`),

  dsLich: () => rest('lich?select=*&order=ngay.desc.nullsfirst,sua_luc.desc&limit=500'),
  docLich: async (id) => (await rest(`lich?select=*&id=eq.${id}`))[0],
  lichCuaBuoi: async (buoi) => (await rest(`lich?select=*&buoi_id=eq.${buoi}`))[0],
  luuLich: (id, duLieu, gui) => rpc('luu_lich', { p_id: id, p_du_lieu: duLieu, p_gui: gui }),
  xoaLich: (id) => rpc('xoa_lich', { p_id: id }),

  baiCuaToi: () => rpc('bai_cua_toi'),
  batDauBai: (bai) => rpc('bat_dau_bai', { p_bai: bai }),
  luuTamBai: (lam, tl) => rpc('luu_tam_bai', { p_lam: lam, p_tra_loi: tl }),
  guiBai: (lam, tl) => rpc('gui_bai', { p_lam: lam, p_tra_loi: tl }),
  xemLaiBai: (bai) => rpc('xem_lai_bai', { p_bai: bai }),
  dsBaiQuanTri: () => rest('bai_test?select=*,cau_hoi(id),buoi(bat_dau)&order=tao_luc.desc'),
  docBaiQuanTri: async (id) => {
    const [b, c] = await Promise.all([rest(`bai_test?select=*&id=eq.${id}`), rest(`cau_hoi?select=*,dap_an(dung)&bai_id=eq.${id}&order=thu_tu`)]);
    return Object.assign(b[0], { cau: c.map(x => ({ id: x.id, phan: x.phan, noi_dung: x.noi_dung, lua_chon: x.lua_chon, hinh: x.hinh, dung: x.dap_an ? x.dap_an.dung : null })) });
  },
  luuBaiTest: (p) => rpc('luu_bai_test', { p }),
  xoaBaiTest: (id) => xoa('bai_test', id),
  thongKeBai: (bai) => rpc('thong_ke_bai', { p_bai: bai })
};
