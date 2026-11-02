// Hồ sơ năng lực: bản đồ ba bậc Đón Nhận – Trưởng thành – Trao lại, hoạt động, chuyên cần, điểm post-test.
import { S } from './state.js';
import { h, dat, dong, nhom, moSheet, thu, toast, NHA, moTaTV, namHoc, soLieu, soVN, ngay, oNhap, oChon, giaTriNgay, xacNhan } from './ui.js';
import { moMaCuaToi } from './v-homnay.js';

export const BAC = ['Đón Nhận', 'Trưởng thành', 'Trao lại'];
const TT_NL = { dat: 'Đã đạt', dang_ren: 'Đang rèn luyện', cho: 'Chờ xác nhận', tu_choi: 'Chưa được xác nhận' };
export const LOAI_HD = { chuyen_de: 'Chuyên đề đã trình bày', chuong_trinh: 'Chương trình đã tổ chức', trao_lai: 'Giờ dạy và mentor', khac: 'Hoạt động khác' };
const TT_HD = { cho: 'Chờ xác nhận', dat: 'Đã xác nhận', tu_choi: 'Không xác nhận' };

export const BANG_MINH_HOA = () => S.caiDat.danh_muc_da_duyet === true ? null
  : h('div', { class: 'bang-tin' }, 'Danh mục năng lực đang là bản minh họa, chờ Ban chủ nhiệm duyệt Danh mục năng lực v1.');

function suaBac(nl, bac, gn, sauKhi) {
  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const x = f.elements, tt = e.submitter && e.submitter.value === 'cho' ? 'cho' : 'dang_ren';
      if (tt === 'cho' && !x.mc.value.trim()) { toast('Cần ghi minh chứng khi xin xác nhận.', true); return; }
      const ok = await thu(() => S.db.guiNangLuc({ p_nang_luc: nl.id, p_bac: bac, p_trang_thai: tt, p_minh_chung: x.mc.value, p_lien_ket: x.lk.value }), tt === 'cho' ? 'Đã gửi xin xác nhận' : 'Đã ghi đang rèn luyện');
      if (ok) { s.dong(); sauKhi(); }
    }
  },
    gn && gn.phan_hoi ? h('div', { class: 'bang-tin' }, 'Phản hồi: ' + gn.phan_hoi) : null,
    h('div', { class: 'nhom' },
      oNhap('Minh chứng', { the: 'textarea', name: 'mc', rows: 3, placeholder: 'Đã làm gì, ở chương trình nào, ai chứng kiến', value: gn ? gn.minh_chung : '' }),
      oNhap('Liên kết minh chứng (nếu có)', { name: 'lk', type: 'url', placeholder: 'https://', value: gn ? gn.lien_ket : '' })),
    h('div', { class: 'hang-nut' },
      h('button', { class: 'nut phu', type: 'submit', value: 'dang_ren' }, 'Đang rèn luyện'),
      h('button', { class: 'nut', type: 'submit', value: 'cho' }, 'Xin xác nhận')));
  const s = moSheet({ tieuDe: `${nl.ten} · ${BAC[bac - 1]}`, noiDung: f });
}

function themHoatDong(sauKhi) {
  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const x = f.elements;
      if (!x.ten.value.trim() || !x.ngay.value) { toast('Cần ghi tên và ngày.', true); return; }
      const ok = await thu(() => S.db.guiHoatDong({ p_loai: x.loai.value, p_ten: x.ten.value, p_ngay: x.ngay.value, p_so_gio: x.gio.value ? Number(x.gio.value) : null, p_lien_ket: x.lk.value }), 'Đã gửi xin xác nhận');
      if (ok) { s.dong(); sauKhi(); }
    }
  },
    h('div', { class: 'nhom' },
      oChon('Loại', Object.entries(LOAI_HD), 'chuyen_de', { name: 'loai' }),
      oNhap('Tên hoạt động', { name: 'ten', required: true }),
      oNhap('Ngày', { name: 'ngay', type: 'date', value: giaTriNgay(Date.now()), required: true }),
      oNhap('Số giờ (nếu có)', { name: 'gio', type: 'number', min: 0, step: 0.5, inputmode: 'decimal' }),
      oNhap('Liên kết minh chứng (nếu có)', { name: 'lk', type: 'url', placeholder: 'https://' })),
    h('button', { class: 'nut day', type: 'submit' }, 'Gửi xin xác nhận'));
  const s = moSheet({ tieuDe: 'Thêm hoạt động', noiDung: f });
}

function doiMatKhau() {
  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const m = f.elements.mk.value;
      if (m.length < 8) { toast('Mật khẩu cần ít nhất 8 ký tự.', true); return; }
      const ok = await thu(() => S.db.doiMatKhau(m), 'Đã đổi mật khẩu');
      if (ok) s.dong();
    }
  },
    h('div', { class: 'nhom' }, oNhap('Mật khẩu mới (ít nhất 8 ký tự)', { name: 'mk', type: 'password', autocomplete: 'new-password', required: true })),
    h('button', { class: 'nut day', type: 'submit' }, 'Đổi mật khẩu'));
  const s = moSheet({ tieuDe: 'Đổi mật khẩu', noiDung: f });
}

export async function manHoSo(vung, idKhac) {
  const nam = namHoc();
  const laToi = !idKhac || idKhac === S.toi.id;
  let tv = S.toi;
  if (!laToi) {
    const ds = await S.db.dsThanhVien();
    tv = ds.find(x => x.id === idKhac);
    if (!tv) throw new Error('Không tìm thấy thành viên này.');
  }
  const [nl, gn, hd, cc, diem] = await Promise.all([
    S.db.dsNangLuc(), S.db.ghiNhanCua(tv.id), S.db.hoatDongCua(tv.id), S.db.chuyenCan(tv.id, nam.tu, nam.den), S.db.diemTestCua(tv.id)
  ]);
  const lai = () => manHoSo(vung, idKhac);
  const nha = tv.nha && NHA[tv.nha];
  const dang = nl.filter(x => x.dang_dung);
  const gnMap = new Map(gn.map(g => [g.nang_luc_id + ':' + g.bac, g]));
  const soDat = gn.filter(g => g.trang_thai === 'dat').length;
  const tinh = (l) => hd.filter(x => x.loai === l && x.trang_thai === 'dat');
  const gioTraoLai = tinh('trao_lai').reduce((s, x) => s + Number(x.so_gio || 0), 0);
  const diemTB = diem.length ? diem.reduce((s, x) => s + Number(x.diem || 0), 0) / diem.length : null;

  const hang = (x) => h('div', { class: 'nl-hang' },
    h('div', { class: 'nl-ten' }, x.ten),
    h('div', { class: 'nl-bac' }, [1, 2, 3].map(b => {
      const g = gnMap.get(x.id + ':' + b);
      const nhan = `${x.ten}, bậc ${BAC[b - 1]}: ${g ? TT_NL[g.trang_thai] : 'Chưa bắt đầu'}`;
      return h('button', {
        class: 'nl-cham ' + (g ? g.trang_thai : ''), type: 'button', 'aria-label': nhan, title: nhan + (g && g.ngay_dat ? ' · ' + ngay(g.ngay_dat) : ''),
        onclick: () => {
          if (g && g.trang_thai === 'dat') { moSheet({ tieuDe: `${x.ten} · ${BAC[b - 1]}`, noiDung: h('div', null, nhom(null, dong({ tieu: 'Đã đạt ' + ngay(g.ngay_dat) }), g.minh_chung ? dong({ tieu: g.minh_chung, phu: 'Minh chứng' }) : null, g.lien_ket ? dong({ tieu: 'Mở minh chứng', href: g.lien_ket, target: '_blank' }) : null)) }); return; }
          if (laToi) suaBac(x, b, g, lai); else toast('Chỉ chủ hồ sơ mới gửi được minh chứng.');
        }
      }, h('i'));
    })));
  const banDo = (ma, ten) => {
    const ds = dang.filter(x => x.nhom === ma);
    return ds.length ? [h('div', { class: 'nhan-nhom' }, ten), h('div', { class: 'nhom ban-do' },
      h('div', { class: 'nl-dau' }, h('span', null, 'Năng lực'), h('div', { class: 'cot' }, BAC.map(b => h('span', null, b)))),
      ds.map(hang))] : null;
  };

  dat(vung,
    laToi ? h('h1', { class: 'tieu-de-lon' }, 'Hồ sơ') : h('div', { class: 'thanh-nho' }, h('div', { class: 'khoang' }, h('a', { class: 'nut-lui', href: '#quan-ly/thanh-vien', style: 'text-decoration:none' }, '‹ Thành viên')), h('h1', null, 'Hồ sơ năng lực'), h('div', { class: 'khoang phai' })),
    h('div', { class: 'dau-ho-so' + (nha ? ' co-nha' : ''), style: nha ? `--nha-goc:${nha.mau}` : null },
      nha ? h('img', { class: 'mascot', src: `img/${nha.anh}.webp`, alt: '' }) : null,
      h('div', { class: 'nhan' }, nha ? `Nhà ${tv.nha} · ${nha.ten}` : 'Chưa có nhà'),
      h('div', { class: 'ten' }, tv.ho_ten),
      h('div', { class: 'phu' }, tv.ma, moTaTV(tv) ? ' · ' + moTaTV(tv) : '')),
    soLieu([
      { so: cc && cc.tong ? Math.round((cc.dung + cc.tre) / cc.tong * 100) + '%' : '–', ten: cc && cc.tong ? `Chuyên cần ${nam.nhan}: ${cc.dung + cc.tre}/${cc.tong} buổi` : `Chuyên cần ${nam.nhan}` },
      { so: tinh('chuyen_de').length, ten: 'Chuyên đề đã trình bày' },
      { so: tinh('chuong_trinh').length, ten: 'Chương trình đã tổ chức' },
      { so: soVN(gioTraoLai, 1), ten: 'Giờ dạy và mentor' },
      { so: diemTB === null ? '–' : soVN(diemTB), ten: `Điểm post-test trung bình (${diem.length} bài)` }
    ]),
    BANG_MINH_HOA(),
    h('div', { class: 'nhan-nhom', style: 'font-size:1.25rem;color:var(--chu);font-weight:700;letter-spacing:-0.015em;padding-bottom:12px' }, `Bản đồ năng lực`, h('span', { style: 'font-size:0.875rem;font-weight:500;color:var(--chu-2);letter-spacing:0' }, `${soDat}/${dang.length * 3} bậc đã đạt`)),
    banDo('A', 'A · Năng lực cốt lõi'), banDo('B', 'B · Kỹ năng chuyên môn CLB'),
    laToi ? h('p', { class: 'chu-giai' }, 'Chạm vào một bậc để ghi đang rèn luyện hoặc gửi minh chứng xin xác nhận.') : null,
    nhom(h('span', { style: 'display:contents' }, 'Hành trình hoạt động', laToi ? h('button', { class: 'nut-chu', type: 'button', onclick: () => themHoatDong(lai) }, 'Thêm') : null),
      hd.length ? hd.map(x => dong({
        tieu: x.ten, phu: `${LOAI_HD[x.loai]} · ${ngay(x.ngay)}` + (x.so_gio ? ` · ${soVN(x.so_gio, 1)} giờ` : '') + (x.phan_hoi ? ' · Phản hồi: ' + x.phan_hoi : ''),
        sau: h('span', { class: 'the-nhan ' + x.trang_thai }, TT_HD[x.trang_thai]), href: x.lien_ket || null, target: x.lien_ket ? '_blank' : null, muiTen: false
      })) : dong({ tieu: 'Chưa có hoạt động nào được ghi.' })),
    diem.length ? nhom('Post-test đã làm', diem.slice(0, 12).map(x => dong({ tieu: x.bai_test ? x.bai_test.tieu_de : 'Bài post-test', phu: ngay(x.nop_luc), sau: soVN(x.diem) }))) : null,
    laToi ? nhom('Tài khoản',
      dong({ tieu: 'Mã điểm danh của tôi', onclick: moMaCuaToi }),
      dong({ tieu: 'Đổi mật khẩu', onclick: doiMatKhau }),
      h('button', {
        class: 'dong', type: 'button', style: 'color:var(--vang);font-weight:500',
        onclick: async () => { if (await xacNhan({ tieuDe: 'Đăng xuất?', nut: 'Đăng xuất', nguy: true })) { await S.db.dangXuat(); location.hash = ''; location.reload(); } }
      }, 'Đăng xuất')) : null,
    h('p', { class: 'chu-nho giua-chu' }, 'Liêm chính và thực chất · Tài liệu nội bộ, chỉ chủ hồ sơ và quản trị xem được.'));
}
