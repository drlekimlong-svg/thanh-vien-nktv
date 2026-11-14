// Tuyển quân: danh sách thí sinh vào phỏng vấn, ghi chú chuẩn bị riêng từng người, phiếu đánh giá theo form Google
// "[TQ2026] ĐÁNH GIÁ VÒNG 3" (tên người đánh giá lấy từ tài khoản), tổng hợp cho quản trị, Ban cố vấn và người được giao xem kết quả.
import { S, khiRoi } from './state.js';
import { h, dat, dong, nhom, thu, toast, rong, soLieu, oChon, oBat, gio, ngay, taiCSV, moSheet, soVN, bieuTuong } from './ui.js';

const MUC_A = [['phong_thai', 'Phong thái'], ['eye_contact', 'Eye-contact'], ['giong_noi', 'Giọng nói'], ['mach_y', 'Mạch ý & Nội dung']];
const MUC_A_PHU = ['xu_ly_su_co', 'Xử lý sự cố (nếu có)'];
const MUC_B = [['tac_phong', 'Tác phong & Trang phục'], ['thai_do', 'Thái độ'], ['giao_tiep', 'Giao tiếp'], ['hoa_dong', 'Hòa đồng'], ['thich_nghi', 'Khả năng thích nghi'],
  ['to_chuc', 'Tính tổ chức & quản lý thời gian'], ['ap_luc', 'Khả năng xử lý áp lực'], ['trach_nhiem', 'Tinh thần trách nhiệm'], ['chia_se', 'Khả năng chia sẻ'], ['cau_tien', 'Tinh thần cầu tiến']];
const MUC = ['Rất tệ', 'Tệ', 'Ổn', 'Tốt', 'Rất tốt'];
const KET_LUAN = ['Phù hợp', 'Cân nhắc', 'Không phù hợp'];
const LOP_KL = { 'Phù hợp': 'dung', 'Cân nhắc': 'tre', 'Không phù hợp': 'vang' };
const NHA_FORM = ['Anh/Chị Ban Cố vấn', 'Y7+', 'Byakko', 'Genbu', 'Kirin', 'Suzaku', 'Seiryu', 'Yin Yang Kois'];

const chuan = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const tb = (ds) => ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : null;
const diemA = (d) => tb([...MUC_A.map(m => d.diem[m[0]]), d.diem.xu_ly_su_co].filter(x => x !== null && x !== undefined));
const diemB = (d) => tb(MUC_B.map(m => d.diem[m[0]]).filter(x => x !== null && x !== undefined));
const nhaMacDinh = () => S.toi.cap === 'Ban cố vấn' ? 'Anh/Chị Ban Cố vấn' : S.toi.nha === 'Yin-Yang Kois' ? 'Yin Yang Kois' : NHA_FORM.includes(S.toi.nha) ? S.toi.nha : '';
export const xemKetQuaTQ = () => !!(S.toi.la_quan_tri || (Array.isArray(S.caiDat.tq_xem_ket_qua) && S.caiDat.tq_xem_ket_qua.includes(S.toi.id)));
const nhanKL = (kl) => kl ? h('span', { class: 'the-nhan ' + (LOP_KL[kl] || '') }, kl) : null;
const thanhNho = (lui, href, tieu) => h('div', { class: 'thanh-nho' }, h('div', { class: 'khoang' }, h('a', { class: 'nut-lui', href, style: 'text-decoration:none' }, '‹ ' + lui)), h('h1', null, tieu), h('div', { class: 'khoang phai' }));
const demKL = (ds) => { const o = {}; ds.forEach(d => { o[d.ket_luan] = (o[d.ket_luan] || 0) + 1; }); return o; };
const tomKL = (ds) => { const o = demKL(ds); return KET_LUAN.filter(k => o[k]).map(k => `${k} ${o[k]}`).join(' · '); };

async function tai() {
  return Promise.all([S.db.dsThiSinh(), S.db.dsDanhGiaTQ(), S.db.ghiChuTQ(S.toi.id)]);
}

export async function manTuyenQuan(vung, con) {
  if (con[0] === 'tong-hop') return xemKetQuaTQ() ? manTongHop(vung) : dat(vung, rong('Chỉ người được giao xem kết quả mới mở được trang này.'));
  if (con[0]) return manThiSinh(vung, decodeURIComponent(con[0]));
  return manDanhSach(vung);
}

/* ---------- Danh sách thí sinh ---------- */
const LOC = { tim: '', che: 'tat' };
async function manDanhSach(vung) {
  const cd = S.caiDat.tuyen_quan || {};
  const [ts, dg, gc] = await tai();
  const cuaToi = new Map(dg.filter(d => d.thanh_vien_id === S.toi.id).map(d => [d.thi_sinh_id, d]));
  const coGC = new Set(gc.filter(g => (g.noi_dung || '').trim()).map(g => g.thi_sinh_id));
  const vungDS = h('div');
  const CHE = [['tat', 'Tất cả'], ['chua', 'Chưa đánh giá'], ['da', 'Đã đánh giá'], ['ghi', 'Có ghi chú']];
  const nutChe = CHE.map(([k, c]) => h('button', { class: 'vien', type: 'button', 'aria-pressed': String(LOC.che === k), onclick: () => { LOC.che = k; nutChe.forEach((n, i) => n.setAttribute('aria-pressed', String(CHE[i][0] === k))); ve(); } }, c));
  const ve = () => {
    const k = chuan(LOC.tim.trim());
    const ds = ts.filter(t => (!k || chuan(`${t.ho_ten} ${t.ma_ts} ${t.lop || ''}`).includes(k))
      && (LOC.che === 'tat' || (LOC.che === 'chua' && !cuaToi.has(t.id)) || (LOC.che === 'da' && cuaToi.has(t.id)) || (LOC.che === 'ghi' && coGC.has(t.id))));
    dat(vungDS, ds.length ? nhom(null, ds.map(t => {
      const p = cuaToi.get(t.id);
      return dong({
        truoc: h('div', { class: 'tq-stt' }, t.stt ?? ''),
        tieu: t.ho_ten,
        phu: [t.ma_ts ? 'Mã ' + t.ma_ts : null, t.lop, t.nam ? 'Năm ' + t.nam : null].filter(Boolean).join(' · '),
        sau: p || coGC.has(t.id) ? h('div', { class: 'tq-nhan' }, p ? nhanKL(p.ket_luan) : null, coGC.has(t.id) ? h('span', { class: 'the-nhan' }, 'Ghi chú') : null) : null,
        href: '#tuyen-quan/' + encodeURIComponent(t.ma_ts)
      });
    })) : rong(ts.length ? 'Không có thí sinh khớp bộ lọc.' : 'Chưa có danh sách thí sinh.'));
  };
  ve();
  const nguoi = new Set(dg.map(d => d.thanh_vien_id)).size;
  dat(vung,
    h('h1', { class: 'tieu-de-lon' }, 'Tuyển quân'),
    h('p', { class: 'tieu-de-phu' }, [cd.ten, cd.vong].filter(Boolean).join(' · ') || 'Đánh giá thí sinh'),
    cd.mo_ta ? h('div', { class: 'nhom tq-mo-ta' }, cd.mo_ta) : null,
    soLieu([{ so: `${cuaToi.size}/${ts.length}`, ten: 'Bạn đã đánh giá' }, { so: coGC.size, ten: 'Bạn có ghi chú' }]),
    xemKetQuaTQ() ? nhom(null, dong({ truoc: h('div', { class: 'bieu-tuong' }, bieuTuong('bieu_do')), tieu: 'Tổng hợp kết quả', phu: `${dg.length} phiếu của ${nguoi} người đánh giá`, href: '#tuyen-quan/tong-hop' })) : null,
    h('input', { class: 'tim', type: 'search', value: LOC.tim, placeholder: 'Tìm tên, mã thí sinh, lớp…', 'aria-label': 'Tìm thí sinh', oninput: (e) => { LOC.tim = e.target.value; ve(); } }),
    h('div', { class: 'chon-ngang', role: 'group', 'aria-label': 'Lọc thí sinh' }, nutChe),
    vungDS,
    h('p', { class: 'chu-nho', style: 'padding:0 16px 18px;margin-top:-10px' }, 'Ghi chú chuẩn bị chỉ mình bạn đọc được. Phiếu đánh giá do quản trị, Ban cố vấn và người được giao xem kết quả đọc; bạn sửa được phiếu của mình bất cứ lúc nào.'),
    S.toi.la_quan_tri ? nhom('Cài đặt', oBat('Hiện mục Tuyển quân cho mọi thành viên', {
      checked: cd.mo !== false,
      onchange: async (e) => {
        const moi = Object.assign({}, cd, { mo: e.target.checked });
        if (await thu(() => S.db.datCaiDat('tuyen_quan', moi), e.target.checked ? 'Đã hiện mục Tuyển quân' : 'Đã ẩn mục Tuyển quân với thành viên')) S.caiDat.tuyen_quan = moi;
        else e.target.checked = !e.target.checked;
      }
    })) : null);
}

/* ---------- Một thí sinh: ghi chú và phiếu ---------- */
async function manThiSinh(vung, ma) {
  const [ts, dg, gc] = await tai();
  const i = ts.findIndex(t => t.ma_ts === ma);
  if (i < 0) return dat(vung, thanhNho('Tuyển quân', '#tuyen-quan', 'Thí sinh'), rong('Không tìm thấy thí sinh này.'));
  const t = ts[i], truoc = ts[i - 1], sau = ts[i + 1];
  const cua = dg.find(d => d.thi_sinh_id === t.id && d.thanh_vien_id === S.toi.id);
  const gcCua = gc.find(g => g.thi_sinh_id === t.id);

  /* Ghi chú: tự lưu khi ngừng gõ, khi rời ô và khi rời màn hình. */
  const oGhi = h('textarea', { rows: 4, placeholder: 'Câu muốn hỏi, điểm cần quan sát, điều cần kiểm chứng ở vòng 1…', value: gcCua ? gcCua.noi_dung : '' });
  const ttGhi = h('span', { class: 'chu-nho' }, gcCua && gcCua.noi_dung ? 'Đã lưu ' + gio(gcCua.sua_luc) + ' ' + ngay(gcCua.sua_luc) : 'Tự lưu khi bạn ngừng gõ');
  let henGhi = 0, daLuuGhi = oGhi.value;
  const luuGhi = async () => {
    clearTimeout(henGhi);
    const v = oGhi.value;
    if (v === daLuuGhi) return;
    ttGhi.textContent = 'Đang lưu…';
    try { await S.db.luuGhiChuTQ(t.id, S.toi.id, v); daLuuGhi = v; ttGhi.textContent = 'Đã lưu ' + gio(Date.now()); }
    catch (e) { ttGhi.textContent = 'Chưa lưu được: ' + e.message; }
  };
  oGhi.addEventListener('input', () => { ttGhi.textContent = 'Đang gõ…'; clearTimeout(henGhi); henGhi = setTimeout(luuGhi, 900); });
  oGhi.addEventListener('blur', luuGhi);
  khiRoi(luuGhi);

  /* Phiếu: bản đang soạn lưu tạm trên máy, gửi xong thì xóa. */
  const KHOA_NHAP = `tq-nhap-${S.toi.id}-${t.id}`;
  const docNhap = () => { try { return JSON.parse(localStorage.getItem(KHOA_NHAP)); } catch (_) { return null; } };
  const luuNhap = () => { try { localStorage.setItem(KHOA_NHAP, JSON.stringify(gt)); } catch (_) {} };
  const xoaNhap = () => { try { localStorage.removeItem(KHOA_NHAP); } catch (_) {} };
  const tuPhieu = (d) => d ? { thuoc_nha: d.thuoc_nha, diem: Object.assign({}, d.diem), nhan_xet_tt: d.nhan_xet_tt, nhan_xet_tp: d.nhan_xet_tp, ket_luan: d.ket_luan }
    : { thuoc_nha: nhaMacDinh(), diem: {}, nhan_xet_tt: '', nhan_xet_tp: '', ket_luan: '' };
  const nhap = docNhap();
  const gt = nhap && nhap.diem ? nhap : tuPhieu(cua);

  const oChonMuc = (k, ds, cot) => h('div', { class: 'tq-muc', style: `--cot:${cot}` }, ds.map((m, j) => {
    const v = k === 'ket_luan' ? m : j + 1;
    return h('label', null,
      h('input', { type: 'radio', name: 'tq-' + k, value: String(v), checked: (k === 'ket_luan' ? gt.ket_luan : gt.diem[k]) === v,
        onchange: () => { if (k === 'ket_luan') gt.ket_luan = v; else gt.diem[k] = v; boThieu(k); luuNhap(); } }),
      h('span', null, m));
  }));
  const hangDiem = (k, nhan, batBuoc = true) => h('fieldset', { class: 'tq-hang', 'data-k': k },
    h('legend', null, nhan, batBuoc ? null : h('button', { class: 'nut-chu tq-bo', type: 'button', onclick: (e) => {
      delete gt.diem[k]; luuNhap();
      e.target.closest('fieldset').querySelectorAll('input').forEach(x => { x.checked = false; });
    } }, 'Bỏ chọn')),
    oChonMuc(k, MUC, 5));
  const oNha = oChon('Bạn là thành viên thuộc nhà', [['', 'Chọn…'], ...NHA_FORM], gt.thuoc_nha, { onchange: (e) => { gt.thuoc_nha = e.target.value; boThieu('thuoc_nha'); luuNhap(); } });
  oNha.dataset.k = 'thuoc_nha';
  const oNX = (k, nhan) => {
    const o = h('label', { class: 'o', 'data-k': k }, h('span', null, nhan), h('textarea', { rows: 3, value: gt[k], oninput: (e) => { gt[k] = e.target.value; boThieu(k); luuNhap(); } }));
    return o;
  };
  const phieu = h('div');
  const boThieu = (k) => { const el = phieu.querySelector(`[data-k="${k}"]`); if (el) el.classList.remove('thieu'); };
  const nutGui = h('button', { class: 'nut day', type: 'button', onclick: () => gui() }, cua ? 'Cập nhật đánh giá' : 'Gửi đánh giá');
  async function gui() {
    const thieu = [];
    if (!gt.thuoc_nha) thieu.push(['thuoc_nha', 'nhà của bạn']);
    [...MUC_A, ...MUC_B].forEach(([k, n]) => { if (!gt.diem[k]) thieu.push([k, n]); });
    if (!gt.nhan_xet_tt.trim()) thieu.push(['nhan_xet_tt', 'nhận xét phần thuyết trình']);
    if (!gt.nhan_xet_tp.trim()) thieu.push(['nhan_xet_tp', 'nhận xét tác phong, phẩm chất']);
    if (!gt.ket_luan) thieu.push(['ket_luan', 'mức phù hợp với CLB']);
    phieu.querySelectorAll('.thieu').forEach(x => x.classList.remove('thieu'));
    if (thieu.length) {
      thieu.forEach(([k]) => { const el = phieu.querySelector(`[data-k="${k}"]`); if (el) el.classList.add('thieu'); });
      const dau = phieu.querySelector(`[data-k="${thieu[0][0]}"]`);
      if (dau) dau.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return toast(thieu.length === 1 ? 'Còn thiếu: ' + thieu[0][1] : `Còn thiếu ${thieu.length} mục, bắt đầu từ: ${thieu[0][1]}`, true);
    }
    nutGui.disabled = true;
    const r = await thu(() => S.db.luuDanhGiaTQ(t.id, gt), cua ? 'Đã cập nhật đánh giá' : 'Đã gửi đánh giá');
    nutGui.disabled = false;
    if (r) { xoaNhap(); await manThiSinh(vung, ma); }
  }

  dat(phieu,
    h('div', { class: 'nhan-nhom' }, h('span', null, 'Phiếu đánh giá'), cua ? h('span', { style: 'font-weight:400' }, 'Đã gửi ' + gio(cua.sua_luc) + ' ' + ngay(cua.sua_luc)) : null),
    nhap && nhap.diem ? h('div', { class: 'tq-bao' }, h('span', null, cua ? 'Có chỉnh sửa chưa gửi trên máy này.' : 'Bản đang soạn, chưa gửi.'),
      cua ? h('button', { class: 'nut-chu', type: 'button', onclick: () => { xoaNhap(); manThiSinh(vung, ma); } }, 'Bỏ chỉnh sửa') : null) : null,
    h('div', { class: 'nhom' },
      dong({ tieu: S.toi.ho_ten, phu: 'Người đánh giá · lấy từ tài khoản của bạn' }),
      oNha),
    h('div', { class: 'nhan-nhom' }, 'Phần A · Đánh giá về phần thuyết trình'),
    h('div', { class: 'nhom' }, MUC_A.map(([k, n]) => hangDiem(k, n)), hangDiem(MUC_A_PHU[0], MUC_A_PHU[1], false)),
    h('div', { class: 'nhan-nhom' }, 'Phần B · Đánh giá về tác phong & phẩm chất'),
    h('div', { class: 'nhom' }, MUC_B.map(([k, n]) => hangDiem(k, n))),
    h('div', { class: 'nhan-nhom' }, 'Phần C · Nhận xét và kết luận'),
    h('div', { class: 'nhom' },
      oNX('nhan_xet_tt', 'Nhận xét của anh/chị về phần thuyết trình của thí sinh'),
      oNX('nhan_xet_tp', 'Nhận xét của anh/chị về phần tác phong và phẩm chất của thí sinh'),
      h('fieldset', { class: 'tq-hang', 'data-k': 'ket_luan' }, h('legend', null, 'Anh/Chị nghĩ thí sinh có phù hợp với CLB không?'), oChonMuc('ket_luan', KET_LUAN, 3))),
    nutGui);

  const cuaHD = xemKetQuaTQ() ? dg.filter(d => d.thi_sinh_id === t.id) : [];
  const nutChuyen = (x, chieu) => x ? h('a', { class: 'nut phu nho', href: '#tuyen-quan/' + encodeURIComponent(x.ma_ts), 'aria-label': (chieu < 0 ? 'Thí sinh trước: ' : 'Thí sinh sau: ') + x.ho_ten, style: 'text-decoration:none' }, chieu < 0 ? '‹ Trước' : 'Sau ›') : h('span');
  dat(vung,
    thanhNho('Danh sách', '#tuyen-quan', 'Thí sinh ' + (t.stt ?? '')),
    h('div', { class: 'tq-dau' },
      h('h2', null, t.ho_ten),
      h('p', null, [t.ma_ts ? 'Mã thí sinh ' + t.ma_ts : null, t.lop, t.nam ? 'Năm ' + t.nam : null].filter(Boolean).join(' · ')),
      h('div', { class: 'tq-chuyen' }, nutChuyen(truoc, -1), nutChuyen(sau, 1))),
    h('div', { class: 'nhan-nhom' }, h('span', null, 'Ghi chú chuẩn bị'), h('span', { style: 'font-weight:400' }, 'Chỉ mình bạn đọc')),
    h('div', { class: 'nhom' }, h('label', { class: 'o' }, h('span', { class: 'an-chu' }, 'Ghi chú chuẩn bị'), oGhi), h('div', { class: 'tq-tt' }, ttGhi)),
    phieu,
    xemKetQuaTQ() ? [
      h('div', { class: 'nhan-nhom', style: 'margin-top:26px' }, h('span', null, 'Phiếu của hội đồng'), h('span', { style: 'font-weight:400' }, cuaHD.length + ' phiếu')),
      cuaHD.length ? h('div', { class: 'nhom' },
        dong({ tieu: `Phần A ${soVN(tb(cuaHD.map(diemA)), 2)} · Phần B ${soVN(tb(cuaHD.map(diemB)), 2)}`, phu: tomKL(cuaHD) + ' · thang 1 (Rất tệ) đến 5 (Rất tốt)' }),
        cuaHD.map(d => dong({ tieu: d.nguoi_ten, phu: `${d.thuoc_nha} · A ${soVN(diemA(d), 1)} · B ${soVN(diemB(d), 1)}`, sau: nhanKL(d.ket_luan), onclick: () => xemPhieu(d, t) })))
        : rong('Chưa có phiếu nào cho thí sinh này.')
    ] : null);
}

function xemPhieu(d, t) {
  const hang = (n, v) => dong({ tieu: n, sau: v === null || v === undefined ? '–' : MUC[v - 1] + ' (' + v + ')' });
  moSheet({
    tieuDe: d.nguoi_ten,
    noiDung: h('div', null,
      h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:14px' }, `${d.thuoc_nha} · đánh giá ${t.ho_ten} · ${gio(d.sua_luc)} ${ngay(d.sua_luc)}`),
      nhom('Phần A · Thuyết trình', MUC_A.map(([k, n]) => hang(n, d.diem[k])), hang(MUC_A_PHU[1], d.diem[MUC_A_PHU[0]])),
      nhom('Phần B · Tác phong & phẩm chất', MUC_B.map(([k, n]) => hang(n, d.diem[k]))),
      nhom('Phần C', dong({ tieu: d.nhan_xet_tt, phu: 'Nhận xét phần thuyết trình' }), dong({ tieu: d.nhan_xet_tp, phu: 'Nhận xét tác phong và phẩm chất' }),
        dong({ tieu: 'Phù hợp với CLB', sau: nhanKL(d.ket_luan) })))
  });
}

/* ---------- Tổng hợp ---------- */
const SAP = { cach: 'stt' };
async function manTongHop(vung) {
  const [ts, dg] = await tai();
  const theoTS = new Map(ts.map(t => [t.id, []]));
  dg.forEach(d => { if (theoTS.has(d.thi_sinh_id)) theoTS.get(d.thi_sinh_id).push(d); });
  const dong1 = ts.map(t => {
    const ds = theoTS.get(t.id), o = demKL(ds);
    const a = tb(ds.map(diemA)), b = tb(ds.map(diemB));
    return { t, ds, a, b, chung: a === null ? null : (a + b) / 2, ph: o['Phù hợp'] || 0, cn: o['Cân nhắc'] || 0, kph: o['Không phù hợp'] || 0 };
  });
  const vungDS = h('div');
  const CACH = [['stt', 'Thứ tự'], ['diem', 'Điểm trung bình'], ['ph', 'Số phiếu Phù hợp'], ['it', 'Ít phiếu nhất']];
  const nut = CACH.map(([k, c]) => h('button', { class: 'vien', type: 'button', 'aria-pressed': String(SAP.cach === k), onclick: () => { SAP.cach = k; nut.forEach((n, i) => n.setAttribute('aria-pressed', String(CACH[i][0] === k))); ve(); } }, c));
  const ve = () => {
    const ds = dong1.slice().sort((x, y) => SAP.cach === 'diem' ? (y.chung ?? -1) - (x.chung ?? -1)
      : SAP.cach === 'ph' ? (y.ph - x.ph) || (y.chung ?? -1) - (x.chung ?? -1)
        : SAP.cach === 'it' ? x.ds.length - y.ds.length || (x.t.stt - y.t.stt) : (x.t.stt - y.t.stt));
    dat(vungDS, nhom(null, ds.map(r => dong({
      truoc: h('div', { class: 'tq-stt' }, r.t.stt ?? ''),
      tieu: r.t.ho_ten,
      phu: r.ds.length ? `${r.ds.length} phiếu · A ${soVN(r.a, 2)} · B ${soVN(r.b, 2)}` : 'Chưa có phiếu',
      sau: r.ds.length ? h('div', { class: 'tq-nhan' }, r.ph ? h('span', { class: 'the-nhan dung' }, 'Phù hợp ' + r.ph) : null, r.cn ? h('span', { class: 'the-nhan tre' }, 'Cân nhắc ' + r.cn) : null, r.kph ? h('span', { class: 'the-nhan vang' }, 'Không ' + r.kph) : null) : null,
      href: '#tuyen-quan/' + encodeURIComponent(r.t.ma_ts)
    }))));
  };
  ve();
  const coPhieu = dong1.filter(r => r.ds.length).length;
  const tenTS = new Map(ts.map(t => [t.id, t]));
  const csvPhieu = () => {
    const dau = ['Dấu thời gian', 'Họ tên của bạn', 'Bạn là thành viên thuộc nhà', 'Họ tên thí sinh', 'Mã thí sinh',
      ...MUC_A.map(m => `Đánh giá về phần thuyết trình [${m[1]}]`), MUC_A_PHU[1], ...MUC_B.map(m => `Đánh giá về tác phong & phẩm chất [${m[1]}]`),
      'Nhận xét của anh/chị về phần thuyết trình của thí sinh', 'Nhận xét của anh/chị về phần tác phong và phẩm chất của thí sinh', 'Anh/Chị nghĩ thí sinh có phù hợp với CLB không?',
      'Điểm TB phần A (1-5)', 'Điểm TB phần B (1-5)'];
    const chu = (v) => v ? MUC[v - 1] : '';
    const hang = dg.slice().sort((a, b) => (tenTS.get(a.thi_sinh_id)?.stt ?? 0) - (tenTS.get(b.thi_sinh_id)?.stt ?? 0) || new Date(a.gui_luc) - new Date(b.gui_luc)).map(d => {
      const t = tenTS.get(d.thi_sinh_id) || {};
      return [`${ngay(d.sua_luc)} ${gio(d.sua_luc)}`, d.nguoi_ten, d.thuoc_nha, t.ho_ten, t.ma_ts,
        ...MUC_A.map(m => chu(d.diem[m[0]])), chu(d.diem[MUC_A_PHU[0]]), ...MUC_B.map(m => chu(d.diem[m[0]])),
        d.nhan_xet_tt, d.nhan_xet_tp, d.ket_luan, soVN(diemA(d), 2), soVN(diemB(d), 2)];
    });
    taiCSV('TQ2026_phieu_danh_gia_vong_3.csv', [dau, ...hang]);
  };
  const csvTong = () => taiCSV('TQ2026_tong_hop_theo_thi_sinh.csv', [
    ['STT', 'Mã thí sinh', 'Họ tên', 'Lớp', 'Số phiếu', 'TB phần A', 'TB phần B', 'Phù hợp', 'Cân nhắc', 'Không phù hợp'],
    ...dong1.map(r => [r.t.stt, r.t.ma_ts, r.t.ho_ten, r.t.lop, r.ds.length, soVN(r.a, 2), soVN(r.b, 2), r.ph, r.cn, r.kph])]);
  dat(vung,
    thanhNho('Tuyển quân', '#tuyen-quan', 'Tổng hợp'),
    soLieu([{ so: dg.length, ten: 'Phiếu' }, { so: new Set(dg.map(d => d.thanh_vien_id)).size, ten: 'Người đánh giá' }, { so: `${coPhieu}/${ts.length}`, ten: 'Thí sinh có phiếu' }]),
    h('div', { class: 'chon-ngang', role: 'group', 'aria-label': 'Sắp xếp' }, nut),
    vungDS,
    h('p', { class: 'chu-nho', style: 'padding:0 16px;margin:-10px 0 16px' }, 'Điểm theo thang 1 (Rất tệ) đến 5 (Rất tốt). Phần A gồm cả Xử lý sự cố nếu người chấm có chọn. Thứ tự theo điểm là trung bình của phần A và phần B; chỉ để tham khảo, không thay cho thảo luận của hội đồng.'),
    h('div', { class: 'hang-nut', style: 'margin-bottom:22px' },
      h('button', { class: 'nut phu', type: 'button', onclick: csvPhieu, disabled: !dg.length }, 'Tải từng phiếu (CSV)'),
      h('button', { class: 'nut phu', type: 'button', onclick: csvTong }, 'Tải bảng tổng hợp (CSV)')));
}
