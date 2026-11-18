// Việc trong giờ học, dùng chung cho Ban tổ chức và học viên: câu hỏi trong giờ, checklist.
// Checklist chỉ tick trong trình duyệt, không gửi gì về máy chủ (bản thiết kế 17/11/2026, mục 4.6).
import { S } from './state.js';
import { h, dat, dong, nhom, moSheet, thu, toast, bieuTuong, gio, ngayGio, rong, oNhap, oBat, xacNhan } from './ui.js';

const thanh = (tieu, href, nhan, phai = null) =>
  h('div', { class: 'thanh-nho' }, h('div', { class: 'khoang' }, h('a', { class: 'nut-lui', href, style: 'text-decoration:none' }, '‹ ' + nhan)),
    h('h1', null, tieu), h('div', { class: 'khoang phai' }, phai));

/* ============================================================ Câu hỏi trong giờ
   o = { buoi, quanLy, guiDuoc, lui, luiNhan, lai }
   quanLy: trả lời và ẩn được câu hỏi. guiDuoc: gửi được câu hỏi mới. */
export async function manCauHoi(vung, o) {
  const b = o.buoi;
  let ds = await S.db.dsCauHoiBuoi(b.id);
  const lai = async () => { ds = await S.db.dsCauHoiBuoi(b.id); ve(); };
  const vungDs = h('div');

  const traLoi = (q) => {
    const f = h('form', { onsubmit: async (e) => {
      e.preventDefault();
      if (await thu(() => S.db.traLoiCauHoiBuoi(q.id, f.elements.tl.value.trim() || null), 'Đã lưu câu trả lời')) { s.dong(); lai(); }
    } },
      h('p', { class: 'chu-nho', style: 'margin-bottom:12px' }, q.noi_dung),
      h('div', { class: 'nhom' }, oNhap('Câu trả lời', { the: 'textarea', name: 'tl', value: q.tra_loi || '', rows: 5 })),
      h('button', { class: 'nut day', type: 'submit' }, 'Lưu'),
      h('p', { class: 'chu-nho', style: 'margin-top:10px' }, 'Để trống rồi lưu là bỏ câu trả lời, câu hỏi về lại trạng thái chưa trả lời.'));
    const s = moSheet({ tieuDe: 'Trả lời', noiDung: f });
  };

  const hang = (q) => {
    const cua = q.an_ten ? 'Ẩn tên' : (q.ho_ten || 'Không rõ');
    const nutQT = h('button', { class: 'vien', type: 'button', 'aria-pressed': q.toi_quan_tam ? 'true' : 'false',
      onclick: async (e) => {
        const bat = !q.toi_quan_tam;
        const n = await thu(() => S.db.quanTamCauHoi(q.id, bat));
        if (n === false) return;
        q.toi_quan_tam = bat; q.so_quan_tam = typeof n === 'number' ? n : q.so_quan_tam + (bat ? 1 : -1);
        e.currentTarget.setAttribute('aria-pressed', bat ? 'true' : 'false');
        e.currentTarget.textContent = `Quan tâm ${q.so_quan_tam}`;
      } }, `Quan tâm ${q.so_quan_tam}`);
    return h('div', { class: 'the-cau-hoi' + (q.trang_thai === 'an' ? ' an' : '') },
      h('p', { class: 'noi-dung' }, q.noi_dung),
      h('p', { class: 'chu-nho' }, [cua, gio(q.luc), q.trang_thai === 'an' ? 'Đã ẩn' : null, q.la_cua_toi ? 'Của bạn' : null].filter(Boolean).join(' · ')),
      q.tra_loi ? h('div', { class: 'tra-loi' }, h('b', null, 'Trả lời: '), q.tra_loi) : null,
      h('div', { class: 'hang-nut nho' }, nutQT,
        o.quanLy ? h('button', { class: 'vien', type: 'button', onclick: () => traLoi(q) }, q.tra_loi ? 'Sửa trả lời' : 'Trả lời') : null,
        o.quanLy || q.la_cua_toi ? h('button', { class: 'vien', type: 'button', onclick: async () => {
          const an = q.trang_thai !== 'an';
          if (an && !await xacNhan({ tieuDe: 'Ẩn câu hỏi này?', chu: 'Ẩn rồi thì chỉ người gửi và Ban tổ chức còn thấy.', nut: 'Ẩn' })) return;
          if (await thu(() => S.db.anCauHoiBuoi(q.id, an), an ? 'Đã ẩn' : 'Đã hiện lại')) lai();
        } }, q.trang_thai === 'an' ? 'Hiện lại' : 'Ẩn') : null));
  };

  const guiMoi = () => {
    const f = h('form', { onsubmit: async (e) => {
      e.preventDefault();
      const nd = f.elements.nd.value.trim();
      if (!nd) return toast('Câu hỏi còn trống.', true);
      if (await thu(() => S.db.guiCauHoiBuoi(b.id, nd, f.elements.an.checked), 'Đã gửi câu hỏi')) { s.dong(); lai(); }
    } },
      h('div', { class: 'nhom' },
        oNhap('Câu hỏi', { the: 'textarea', name: 'nd', rows: 5, maxlength: 2000, required: true }),
        oBat('Ẩn tên trên màn hình', { name: 'an' })),
      h('p', { class: 'chu-nho', style: 'margin-bottom:14px' }, 'Chọn ẩn tên thì tên bạn không hiện với ai, kể cả Ban tổ chức. Nhưng dòng lưu trong cơ sở dữ liệu vẫn ghi ai gửi, để còn xử lý được nếu có người viết xấu.'),
      h('button', { class: 'nut day', type: 'submit' }, 'Gửi câu hỏi'));
    const s = moSheet({ tieuDe: 'Gửi câu hỏi', noiDung: f });
  };

  const ve = () => {
    const hien = ds.filter(q => q.trang_thai !== 'an');
    const an = ds.filter(q => q.trang_thai === 'an');
    dat(vungDs,
      hien.length ? h('div', { class: 'cot-cau-hoi' }, hien.map(hang)) : rong(o.guiDuoc ? 'Chưa có câu hỏi nào. Bạn gửi câu đầu tiên đi.' : 'Chưa có câu hỏi nào.'),
      an.length ? [h('div', { class: 'nhan-nhom' }, 'Đã ẩn'), h('div', { class: 'cot-cau-hoi' }, an.map(hang))] : null);
  };

  dat(vung,
    thanh('Câu hỏi trong giờ', o.lui, o.luiNhan),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-bottom:14px' }, b.ten, ' · ', ngayGio(b.bat_dau)),
    o.guiDuoc && !b.dong ? h('button', { class: 'nut day', type: 'button', style: 'margin-bottom:18px', onclick: guiMoi }, 'Gửi câu hỏi') : null,
    b.dong ? h('div', { class: 'bang-tin' }, 'Buổi đã đóng nên không gửi thêm câu hỏi được.') : null,
    h('p', { class: 'chu-nho', style: 'margin-bottom:12px' }, 'Câu nhiều người quan tâm nằm trên.'),
    vungDs);
  ve();
}

/* ============================================================ Checklist
   muc: [{ ten: 'Chuẩn bị', muc: ['Rửa tay', 'Mặc áo'] }] */
export const docMucChecklist = (chu) => {
  const ra = []; let cur = null;
  String(chu || '').split('\n').forEach(l => {
    const t = l.trim();
    if (!t) return;
    if (t.startsWith('#')) { cur = { ten: t.replace(/^#+\s*/, ''), muc: [] }; ra.push(cur); }
    else { if (!cur) { cur = { ten: '', muc: [] }; ra.push(cur); } cur.muc.push(t.replace(/^[-*•]\s*/, '')); }
  });
  return ra.filter(n => n.ten || n.muc.length);
};
export const vietMucChecklist = (muc) => (Array.isArray(muc) ? muc : [])
  .map(n => [n.ten ? '# ' + n.ten : null, ...(Array.isArray(n.muc) ? n.muc : [])].filter(Boolean).join('\n')).join('\n\n');
const demMuc = (x) => (Array.isArray(x.muc) ? x.muc : []).reduce((s, n) => s + (Array.isArray(n.muc) ? n.muc.length : 0), 0);
export const soMucChecklist = demMuc;

/** Bản in: ô vuông để tích bằng bút, in ra PDF bằng chức năng in của trình duyệt. */
export function inChecklist(x, tenDot) {
  const the = h('div', { class: 'trang-in' }, h('div', { class: 'in-ck' },
    h('h2', null, x.ten),
    h('p', null, [tenDot, x.buoi_ten].filter(Boolean).join(' · ')),
    x.mo_ta ? h('p', null, x.mo_ta) : null,
    (Array.isArray(x.muc) ? x.muc : []).map(n => [
      n.ten ? h('h3', null, n.ten) : null,
      h('ul', null, (Array.isArray(n.muc) ? n.muc : []).map(m => h('li', null, m)))
    ]),
    h('p', { style: 'margin-top:6mm' }, 'Họ và tên: ................................................   Ngày: ................')));
  document.body.append(the);
  window.print();
  setTimeout(() => the.remove(), 500);
}

/** Bản tick trên máy: chỉ nằm trong trình duyệt, không gửi gì về máy chủ, tải lại là mất. */
export function veChecklist(x, tenDot) {
  const tong = demMuc(x);
  const demDa = h('b', null, '0');
  const hop = [];
  const dem = () => { demDa.textContent = String(hop.filter(c => c.checked).length); };
  const than = h('div', null,
    x.mo_ta ? h('p', { class: 'chu-nho', style: 'margin-bottom:12px' }, x.mo_ta) : null,
    h('p', { class: 'chu-nho', style: 'margin-bottom:12px' }, 'Đã tick ', demDa, ' / ' + tong + ' mục. App không lưu cái bạn tick: tải lại trang là về trắng.'),
    (Array.isArray(x.muc) ? x.muc : []).map(n => {
      const o = (Array.isArray(n.muc) ? n.muc : []).map(m => {
        const el = oBat(m, { onchange: dem });
        hop.push(el.querySelector('input'));
        return el;
      });
      return nhom(n.ten || null, o.length ? o : rong('Nhóm này chưa có mục nào.'));
    }),
    h('div', { class: 'hang-nut', style: 'margin-top:4px' },
      h('button', { class: 'nut phu', type: 'button', onclick: () => { hop.forEach(c => { c.checked = false; }); dem(); } }, 'Bỏ hết tick'),
      h('button', { class: 'nut phu', type: 'button', onclick: () => inChecklist(x, tenDot) }, 'In hoặc lưu PDF')));
  return than;
}

export const moChecklist = (x, tenDot) => moSheet({ tieuDe: x.ten, noiDung: veChecklist(x, tenDot) });

/* ============================================================ Tài liệu: một dòng dùng chung */
export const VUONG = { chua_den_gio: 'Chưa tới giờ mở', can_diem_danh: 'Cần điểm danh buổi này trước' };
export const hangTaiLieu = (x, { quanLy, sua } = {}) => dong({
  tieu: x.ten,
  phu: [x.buoi_ten, x.mo_ta, x.mo ? null : VUONG[x.vuong] || 'Chưa mở',
    x.mo_tu && !quanLy ? null : x.mo_tu ? 'Mở từ ' + ngayGio(x.mo_tu) : null,
    quanLy && x.can_diem_danh ? 'Cần điểm danh trước' : null].filter(Boolean).join(' · '),
  truoc: h('div', { class: 'bieu-tuong' }, bieuTuong(x.mo ? 'test' : 'khoa')),
  href: x.mo && x.lien_ket && !sua ? x.lien_ket : undefined,
  target: x.mo && x.lien_ket && !sua ? '_blank' : undefined,
  onclick: sua ? () => sua(x) : undefined,
  muiTen: !!(sua || (x.mo && x.lien_ket))
});
