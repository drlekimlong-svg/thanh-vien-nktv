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
/** Chuẩn hóa mã đăng nhập. Gõ sẵn tiền tố thì theo tiền tố; không thì theo cửa đã chọn.
    Thành viên CLB: "NKTV-001", "nktv001", "1" đều ra NKTV-001.
    Học viên: "HV00001", "hv1", "1" đều ra HV00001. */
export const chuanMa = (s, loai) => {
  const chu = String(s || '').trim().toUpperCase();
  const so = chu.replace(/\D/g, '');
  if (!so) return '';
  if (chu.startsWith('HV')) return 'HV' + so.padStart(5, '0');
  if (chu.startsWith('NKTV')) return 'NKTV-' + so.padStart(3, '0');
  return loai === 'hoc_vien' ? 'HV' + so.padStart(5, '0') : 'NKTV-' + so.padStart(3, '0');
};

export const api = {
  coPhien: () => !!phien,
  async dangNhap(ma, matKhau, loai) {
    const d = await goiFetch(`${C.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: { apikey: C.supabaseKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailTu(chuanMa(ma, loai)), password: matKhau })
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
  kichHoat: (ma, code, matKhau, loai) => goiFetch(`${C.supabaseUrl}/functions/v1/kich-hoat`, {
    method: 'POST', headers: { apikey: C.supabaseKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ ma: chuanMa(ma, loai), ma_kich_hoat: code, mat_khau: matKhau })
  }),
  theCongKhai: (khoa) => goiFetch(`${C.supabaseUrl}/rest/v1/rpc/the_thanh_vien`, {
    method: 'POST', headers: { apikey: C.supabaseKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_khoa: khoa })
  }),

  toi: () => rpc('toi_la_ai'),
  caiDat: async () => { const r = await rest('cai_dat?select=khoa,gia_tri'); const o = {}; r.forEach(x => { o[x.khoa] = x.gia_tri; }); return o; },
  datCaiDat: (khoa, gia_tri) => rest('cai_dat', { method: 'POST', body: JSON.stringify({ khoa, gia_tri }), headers: { Prefer: 'resolution=merge-duplicates' } }),

  // loai=eq.thanh_vien để các màn quản lý CLB không lẫn học viên các đợt tập huấn (migration 0013).
  dsThanhVien: () => rest('thanh_vien?select=id,ma,ho_ten,gen,nha,cap,chuc_vu,hoat_dong,ghi_chu,khoa_qr,vai_tro,tham_gia_tu&loai=eq.thanh_vien&order=ma'),
  themThanhVien: async (o) => (await them('thanh_vien', o))[0],
  suaThanhVien: (id, o) => sua('thanh_vien', id, o),
  tinhTrangKichHoat: () => rpc('tinh_trang_kich_hoat'),
  capMaKichHoat: (ids) => rpc('cap_ma_kich_hoat', { p_ids: ids }),

  // dot_id=is.null để lịch và điểm danh của CLB không lẫn buổi của các đợt tập huấn (migration 0014).
  dsBuoi: (tu, den) => rest(`buoi?select=*&dot_id=is.null${tu ? `&bat_dau=gte.${encodeURIComponent(tu)}` : ''}${den ? `&bat_dau=lte.${encodeURIComponent(den)}` : ''}&order=bat_dau`),
  themBuoi: async (o) => (await them('buoi', o))[0],
  suaBuoi: (id, o) => sua('buoi', id, o),
  xoaBuoi: (id) => xoa('buoi', id),
  nguoiDiemDanh: (buoi) => rest(`buoi_diem_danh?select=thanh_vien_id&buoi_id=eq.${buoi}`),
  datNguoiDiemDanh: (buoi, ids) => rpc('dat_nguoi_diem_danh', { p_buoi: buoi, p_ids: ids }),
  dsPhanCongLich: () => rest('phan_cong_lich?select=thanh_vien_id,nha,den_ngay&order=nha'),
  datPhanCongLich: (nha, ids, denNgay) => rpc('dat_phan_cong_lich', { p_nha: nha, p_ids: ids, p_den_ngay: denNgay || null }),
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

  dsThongBao: () => rest('thong_bao?select=*&dot_id=is.null&order=ghim.desc,dang_luc.desc&limit=60'),
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
  thongKeBai: (bai) => rpc('thong_ke_bai', { p_bai: bai }),

  /* Đợt tập huấn và học viên (migration 0013). Danh sách học viên, hồ sơ và mã kích hoạt
     chỉ đi qua hàm: hai bảng dot_hoc_vien, hv_ho_so không mở cho trình duyệt. */
  dsDot: () => rpc('ds_dot'),
  luuDot: (id, p) => rpc('luu_dot', { p_id: id, p }),
  btcCuaDot: (dot) => rest(`dot_ban_to_chuc?select=thanh_vien_id,vai&dot_id=eq.${dot}`),
  datBtcDot: (dot, p) => rpc('dat_btc_dot', { p_dot: dot, p }),
  dsHocVienDot: (dot) => rpc('ds_hoc_vien_dot', { p_dot: dot }),
  napDanhSachHV: (dot, ds, ghi) => rpc('nap_danh_sach_hv', { p_dot: dot, p_ds: ds, p_ghi: !!ghi }),
  capMaKichHoatHV: (dot, ids) => rpc('cap_ma_kich_hoat_hv', { p_dot: dot, p_ids: ids }),

  /* Trong đợt (migration 0014): buổi của đợt, đăng ký chỗ, giờ ra, tài liệu, checklist,
     câu hỏi trong giờ, thông báo theo đợt. Bảng dang_ky_buoi, dot_tai_lieu, dot_checklist,
     cau_hoi_buoi không mở cho trình duyệt nên tất cả đi qua hàm. */
  dsBuoiDot: (dot) => rpc('ds_buoi_dot', { p_dot: dot }),
  luuBuoiDot: (id, p) => rpc('luu_buoi_dot', { p_id: id, p }),
  xoaBuoiDot: (id) => rpc('xoa_buoi_dot', { p_id: id }),
  chonBuoi: (buoi) => rpc('chon_buoi', { p_buoi: buoi }),
  boChonBuoi: (buoi) => rpc('bo_chon_buoi', { p_buoi: buoi }),
  dsDangKyBuoi: (buoi) => rpc('ds_dang_ky_buoi', { p_buoi: buoi }),
  datDangKyBuoi: (buoi, ids) => rpc('dat_dang_ky_buoi', { p_buoi: buoi, p_ids: ids }),
  datGioRa: (buoi, tv, luc) => rpc('dat_gio_ra', { p_buoi: buoi, p_tv: tv, p_luc: luc ?? null }),
  dsTaiLieuDot: (dot) => rpc('ds_tai_lieu_dot', { p_dot: dot }),
  luuTaiLieuDot: (id, p) => rpc('luu_tai_lieu_dot', { p_id: id, p }),
  xoaTaiLieuDot: (id) => rpc('xoa_tai_lieu_dot', { p_id: id }),
  dsChecklistDot: (dot) => rpc('ds_checklist_dot', { p_dot: dot }),
  luuChecklistDot: (id, p) => rpc('luu_checklist_dot', { p_id: id, p }),
  xoaChecklistDot: (id) => rpc('xoa_checklist_dot', { p_id: id }),
  guiCauHoiBuoi: (buoi, nd, anTen) => rpc('gui_cau_hoi_buoi', { p_buoi: buoi, p_noi_dung: nd, p_an_ten: !!anTen }),
  dsCauHoiBuoi: (buoi) => rpc('ds_cau_hoi_buoi', { p_buoi: buoi }),
  quanTamCauHoi: (id, bat) => rpc('quan_tam_cau_hoi', { p_id: id, p_bat: !!bat }),
  traLoiCauHoiBuoi: (id, tl) => rpc('tra_loi_cau_hoi_buoi', { p_id: id, p_tra_loi: tl }),
  anCauHoiBuoi: (id, an) => rpc('an_cau_hoi_buoi', { p_id: id, p_an: !!an }),
  thongBaoDot: (dot) => rest(`thong_bao?select=*&dot_id=eq.${dot}&order=ghim.desc,dang_luc.desc&limit=60`),
  luuThongBaoDot: (id, p) => rpc('luu_thong_bao_dot', { p_id: id, p }),
  xoaThongBaoDot: (id) => rpc('xoa_thong_bao_dot', { p_id: id }),
  hvTrangChu: () => rpc('hv_trang_chu'),

  /* Sau buổi (migration 0015): phản hồi và thắc mắc, bài thi và điểm, phiếu đánh giá,
     tiêu chí hoàn thành, xét kết quả và giấy chứng nhận. */
  guiYeuCauDot: (dot, loai, nd) => rpc('gui_yeu_cau_dot', { p_dot: dot, p_loai: loai, p_noi_dung: nd }),
  dsYeuCauDot: (dot) => rpc('ds_yeu_cau_dot', { p_dot: dot }),
  xuLyYeuCauDot: (id, tt, tl) => rpc('xu_ly_yeu_cau_dot', { p_id: id, p_trang_thai: tt, p_tra_loi: tl ?? null }),
  luuBaiThiDot: (id, p) => rpc('luu_bai_thi_dot', { p_id: id, p }),
  xoaBaiThiDot: (id) => rpc('xoa_bai_thi_dot', { p_id: id }),
  dsBaiThiDot: (dot) => rpc('ds_bai_thi_dot', { p_dot: dot }),
  nhapDiemDot: (bai, ds, ghi) => rpc('nhap_diem_dot', { p_bai: bai, p_ds: ds, p_ghi: !!ghi }),
  xoaDiemDot: (bai, tv) => rpc('xoa_diem_dot', { p_bai: bai, p_tv: tv }),
  luuPhieuDot: (id, p) => rpc('luu_phieu_dot', { p_id: id, p }),
  xoaPhieuDot: (id) => rpc('xoa_phieu_dot', { p_id: id }),
  dsPhieuDot: (dot) => rpc('ds_phieu_dot', { p_dot: dot }),
  guiPhieuDot: (phieu, tl) => rpc('gui_phieu_dot', { p_phieu: phieu, p_tra_loi: tl }),
  tongHopPhieuDot: (phieu) => rpc('tong_hop_phieu_dot', { p_phieu: phieu }),
  datCaiDatDot: (dot, p) => rpc('dat_cai_dat_dot', { p_dot: dot, p }),
  luuTieuChiDot: (dot, p) => rpc('luu_tieu_chi_dot', { p_dot: dot, p }),
  dsTieuChiDot: (dot) => rpc('ds_tieu_chi_dot', { p_dot: dot }),
  xetKetQuaDot: (dot) => rpc('xet_ket_qua_dot', { p_dot: dot }),
  capChungNhanDot: (dot, ids) => rpc('cap_chung_nhan_dot', { p_dot: dot, p_ids: ids }),
  thuHoiChungNhan: (dot, tv, th) => rpc('thu_hoi_chung_nhan', { p_dot: dot, p_tv: tv, p_thu_hoi: !!th }),
  ketQuaCuaToi: () => rpc('ket_qua_cua_toi'),
  // Tra cứu chứng nhận chạy được khi chưa đăng nhập, y như thẻ thành viên.
  traChungNhan: (ma) => goiFetch(`${C.supabaseUrl}/rest/v1/rpc/tra_chung_nhan`, {
    method: 'POST', headers: { apikey: C.supabaseKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_ma: ma })
  }),

  /* Gửi thư (migration 0016). Mã kích hoạt bản rõ chỉ đi từ trình duyệt sang Edge Function
     rồi vào thư, không lưu lại ở đâu. Địa chỉ nhận do máy chủ tra, trình duyệt chỉ gửi id. */
  guiThu: async (than) => goiFetch(`${C.supabaseUrl}/functions/v1/gui-thu`, {
    method: 'POST', headers: await dauDe(), body: JSON.stringify(than)
  }),
  dsThuDaGui: (dot) => rpc('ds_thu_da_gui', { p_dot: dot }),
  dsThuGanDay: () => rpc('ds_thu_gan_day'),

  // Nhóm Zalo của đợt (migration 0017): ảnh QR nặng nên để riêng, không đi kèm ds_dot.
  zaloCuaDot: (dot) => rpc('zalo_cua_dot', { p_dot: dot }),

  // Tuyển quân: phiếu của người khác chỉ trả về khi tài khoản được xem kết quả (quy tắc ở bảng tq_danh_gia).
  dsThiSinh: () => rest('tq_thi_sinh?select=id,ma_ts,stt,ho_ten,lop,nam&dot=eq.TQ2026&order=stt'),
  dsDanhGiaTQ: () => rest('tq_danh_gia?select=*&order=gui_luc'),
  luuDanhGiaTQ: (ts, p) => rpc('luu_danh_gia_tq', { p_ts: ts, p }),
  ghiChuTQ: (tv) => rest(`tq_ghi_chu?select=thi_sinh_id,noi_dung,sua_luc&thanh_vien_id=eq.${tv}`),
  luuGhiChuTQ: (ts, tv, noiDung) => rest('tq_ghi_chu', { method: 'POST', body: JSON.stringify({ thi_sinh_id: ts, thanh_vien_id: tv, noi_dung: noiDung, sua_luc: new Date().toISOString() }), headers: { Prefer: 'resolution=merge-duplicates' } })
};
