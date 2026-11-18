// Màn của học viên các đợt tập huấn (không phải thành viên CLB).
// Phần A: đợt của tôi, trạng thái tài khoản, hồ sơ.
// Phần B: việc cần làm bây giờ, mã điểm danh, lịch học, chọn ca, tài liệu, checklist, câu hỏi, thông báo.
import { S } from './state.js';
import {
  h, dat, dong, nhom, moSheet, thu, toast, bieuTuong, gio, ngay, ngayGio, rong, oNhap, xacNhan, soLieu, dauNgay
} from './ui.js';
import { moMaCuaToi, moThongBao } from './v-homnay.js';
import { manCauHoi, moChecklist, soMucChecklist, hangTaiLieu } from './v-tronggio.js';
import { PHAN } from './v-dot.js';

const TRANG_THAI = { soan: 'Chưa mở', mo: 'Đang mở', ket_thuc: 'Đã kết thúc' };
const LOP_TT = { soan: 'cho', mo: 'dung', ket_thuc: '' };
const ngayVN = (d) => d ? ngay(d + 'T12:00:00+07:00') : null;
const khoang = (d) => [ngayVN(d.bat_dau), ngayVN(d.ket_thuc)].filter(Boolean).join(' – ') || 'Chưa ghi ngày';
const dotMo = () => (S.toi.dot || []).filter(d => d.trang_thai === 'mo');
const icon = (t) => h('div', { class: 'bieu-tuong' }, bieuTuong(t));
const thanh = (tieu, href, nhan) =>
  h('div', { class: 'thanh-nho' }, h('div', { class: 'khoang' }, h('a', { class: 'nut-lui', href, style: 'text-decoration:none' }, '‹ ' + nhan)),
    h('h1', null, tieu), h('div', { class: 'khoang phai' }));

export async function tuyenHocVien(vung, tab, con = []) {
  if (tab === 'hom-nay' && con[0] === 'cau-hoi') return manHVCauHoi(vung, con[1], con[2]);
  if (tab === 'lich') return manHVLich(vung);
  if (tab === 'tai-lieu') return manHVTaiLieu(vung);
  if (tab === 'ho-so') return manHVHoSo(vung);
  return manHVHomNay(vung);
}

/* ---------- Việc cần làm bây giờ ---------- */
export async function manHVHomNay(vung) {
  const ds = S.toi.dot || [];
  const mo = dotMo();
  const xong = ds.filter(d => d.trang_thai === 'ket_thuc');
  const tc = mo.length ? await S.db.hvTrangChu().catch(() => null) : null;
  const nay = tc && tc.bay_gio ? new Date(tc.bay_gio).getTime() : Date.now() + (S.lech || 0);
  const buoiGan = (tc && tc.buoi_gan) || [];
  const canChon = (tc && tc.can_chon) || [];
  const lai = () => manHVHomNay(vung);

  // Mỗi buổi gần giờ này: nói đúng một việc đang cần làm, không hiện việc chưa tới giờ.
  const theBuoi = (b) => {
    const bd = new Date(b.bat_dau).getTime();
    const kt = b.ket_thuc ? new Date(b.ket_thuc).getTime() : bd + 4 * 3600e3;
    const dangTrongBuoi = nay >= bd - 30 * 60e3 && nay <= kt + 60 * 60e3;
    const coRa = b.ra_sau_phut !== null && b.ra_sau_phut !== undefined;
    const viec = !b.toi_vao ? 'Chưa điểm danh vào'
      : coRa && !b.toi_ra ? `Đã vào ${gio(b.toi_vao)} · chưa điểm danh ra`
      : coRa ? `Đã vào ${gio(b.toi_vao)}, ra ${gio(b.toi_ra)}`
      : `Đã điểm danh ${gio(b.toi_vao)}`;
    return h('div', { class: 'the-buoi' },
      h('div', { class: 'nhan' }, nay < bd ? 'Buổi sắp bắt đầu' : dangTrongBuoi ? 'Buổi đang diễn ra' : 'Buổi vừa xong'),
      h('h2', null, b.ten),
      h('div', { class: 'chi-tiet' }, [ngayGio(b.bat_dau), b.phan ? PHAN[b.phan] : null, b.dia_diem].filter(Boolean).join(' · ')),
      h('div', { class: 'chi-tiet', style: 'margin-top:4px;font-weight:600;color:var(--chu)' }, viec),
      h('div', { class: 'hang-nut' },
        // Dấu cách không ngắt giữa "điểm" và "danh" để nút xuống hàng không tách từ ghép.
        dangTrongBuoi && !b.dong ? h('button', { class: 'nut', type: 'button', onclick: moMaCuaToi }, bieuTuong('qr'), 'Mã điểm danh') : null,
        !b.dong ? h('a', { class: 'nut phu', href: `#hom-nay/cau-hoi/${b.dot_id}/${b.id}`, style: 'text-decoration:none;text-align:center' }, 'Gửi câu hỏi') : null));
  };

  const hangChon = (b) => dong({
    tieu: b.ten,
    phu: [ngayGio(b.bat_dau), b.phan ? PHAN[b.phan] : null,
      b.suc_chua ? (b.con_lai > 0 ? `còn ${b.con_lai}/${b.suc_chua} chỗ` : `đã đủ ${b.suc_chua} chỗ`) : null,
      b.han_dang_ky ? 'hạn chọn ' + ngayGio(b.han_dang_ky) : null].filter(Boolean).join(' · '),
    sau: h('span', { class: 'the-nhan ' + (b.suc_chua && b.con_lai <= 0 ? 'vang' : 'dung') }, b.suc_chua && b.con_lai <= 0 ? 'Hết chỗ' : 'Chọn'),
    onclick: async () => {
      const kq = await thu(() => S.db.chonBuoi(b.id));
      if (!kq) return;
      if (kq.ok === false) return toast(kq.loi || 'Không chọn được ca này.', true);
      toast(kq.da_co ? 'Bạn đã chọn ca này rồi.' : 'Đã chọn ca ' + b.ten);
      lai();
    }
  });

  dat(vung,
    h('h1', { class: 'tieu-de-lon' }, 'Chào ', S.toi.ho_ten ? S.toi.ho_ten.trim().split(/\s+/).pop() : 'bạn'),

    !ds.length ? h('div', { class: 'bang-tin' }, 'Tài khoản đã kích hoạt nhưng chưa có đợt tập huấn nào. Ban tổ chức sẽ thêm bạn vào đợt khi danh sách được nạp.') : null,

    buoiGan.map(theBuoi),

    canChon.length ? nhom('Cần chọn ca', canChon.map(hangChon)) : null,

    mo.length && !buoiGan.length && !canChon.length
      ? h('div', { class: 'bang-tin xanh' }, 'Bây giờ không có việc gì cần làm. Tới giờ buổi học, nút điểm danh sẽ hiện ngay ở đây. Lịch cả đợt nằm ở tab Lịch.')
      : null,

    tc && tc.thong_bao_moi ? nhom(null, dong({
      tieu: `${tc.thong_bao_moi} thông báo chưa đọc`, phu: 'Thông báo của đợt bạn đang học',
      truoc: icon('chuong'), onclick: () => moThongBaoHV(lai)
    })) : null,

    mo.length ? nhom('Đợt đang học', mo.map(d => dong({
      tieu: d.ten, phu: `${d.ma} · ${khoang(d)}`,
      sau: h('span', { class: 'the-nhan dung' }, 'Đang mở'), muiTen: false
    }))) : null,

    S.toi.chi_doc && ds.length ? h('div', { class: 'bang-tin' },
      'Các đợt của bạn đã kết thúc nên tài khoản đang ở chế độ chỉ xem. Khi bạn đăng ký đợt mới và Ban tổ chức nạp danh sách, tài khoản mở lại bằng chính mật khẩu này.') : null,

    ds.filter(d => d.trang_thai === 'soan').length ? nhom('Đợt sắp tới', ds.filter(d => d.trang_thai === 'soan').map(d => dong({
      tieu: d.ten, phu: `${d.ma} · ${khoang(d)}`,
      sau: h('span', { class: 'the-nhan cho' }, 'Chưa mở'), muiTen: false
    }))) : null,

    xong.length ? nhom('Đã học xong', xong.map(d => dong({
      tieu: d.ten, phu: `${d.ma} · ${khoang(d)}`,
      sau: h('span', { class: 'the-nhan' }, 'Đã kết thúc'), muiTen: false
    }))) : null,

    xong.length ? h('p', { class: 'chu-nho', style: 'margin-bottom:22px' }, 'Kết quả và giấy chứng nhận của các đợt đã xong sẽ hiện ở mục này khi Ban tổ chức nhập điểm và duyệt.') : null,

    nhom(null, dong({ tieu: 'Mã điểm danh của tôi', truoc: icon('qr'), onclick: moMaCuaToi })),

    h('p', { class: 'chu-nho giua-chu' }, 'CLB Ngoại Khoa Trưng Vương · Đón Nhận – Trưởng thành – Trao lại'));
}

/* ---------- Thông báo của các đợt ---------- */
async function moThongBaoHV(sauKhi) {
  const dot = S.toi.dot || [];
  const ds = [];
  for (const d of dot) {
    const tb = await S.db.thongBaoDot(d.id).catch(() => []);
    tb.forEach(x => ds.push(Object.assign({ dot_ma: d.ma }, x)));
  }
  const doc = new Set(await S.db.daDoc(S.toi.id).catch(() => []));
  const than = h('div');
  const ve = () => dat(than, ds.length ? nhom(null, ds.map(x => dong({
    tieu: x.tieu_de, phu: [x.dot_ma, ngay(x.dang_luc), x.ghim ? 'Đã ghim' : null].filter(Boolean).join(' · '),
    truoc: h('div', { class: 'bieu-tuong', style: doc.has(x.id) ? 'opacity:.45' : null }, bieuTuong('chuong')),
    onclick: () => moThongBao(x, () => { doc.add(x.id); ve(); if (sauKhi) sauKhi(); })
  }))) : rong('Chưa có thông báo nào.'));
  ve();
  moSheet({ tieuDe: 'Thông báo', noiDung: than });
}

/* ---------- Lịch học của đợt ---------- */
async function manHVLich(vung) {
  const dot = S.toi.dot || [];
  if (!dot.length) return dat(vung, h('h1', { class: 'tieu-de-lon' }, 'Lịch học'), rong('Bạn chưa có đợt tập huấn nào.'));
  const lai = () => manHVLich(vung);
  const nay = Date.now() + (S.lech || 0);
  const theoDot = [];
  for (const d of dot) theoDot.push({ d, buoi: await S.db.dsBuoiDot(d.id).catch(() => []) });

  // Ca khác trong cùng nhóm mà học viên đang giữ: nói rõ tên ca đó thay vì mời bấm rồi báo lỗi.
  const caKhac = (buoi, b) => b.nhom_chon
    ? buoi.find(x => x.id !== b.id && x.nhom_chon === b.nhom_chon && x.toi_dang_ky) : null;

  const moBuoi = (d, b, buoiCuaDot) => {
    const coRa = b.ra_sau_phut !== null && b.ra_sau_phut !== undefined;
    const khac = caKhac(buoiCuaDot, b);
    const moDK = (!b.mo_dang_ky_tu || nay >= new Date(b.mo_dang_ky_tu).getTime())
      && (!b.han_dang_ky || nay <= new Date(b.han_dang_ky).getTime()) && !b.dong && d.trang_thai === 'mo';
    const s = moSheet({
      tieuDe: b.ten,
      noiDung: h('div', null,
        h('div', { class: 'nhom' },
          dong({ tieu: 'Giờ', sau: ngayGio(b.bat_dau) + (b.ket_thuc ? ' – ' + gio(b.ket_thuc) : ''), muiTen: false }),
          b.phan ? dong({ tieu: 'Phần', sau: PHAN[b.phan], muiTen: false }) : null,
          b.dia_diem ? dong({ tieu: 'Địa điểm', sau: b.dia_diem, muiTen: false }) : null,
          dong({ tieu: 'Điểm danh của bạn', muiTen: false,
            sau: b.toi_vao ? (coRa ? `vào ${gio(b.toi_vao)}${b.toi_ra ? ', ra ' + gio(b.toi_ra) : ', chưa ra'}` : gio(b.toi_vao)) : 'Chưa có' }),
          b.can_dang_ky ? dong({ tieu: 'Ca phải đăng ký', muiTen: false,
            sau: b.toi_dang_ky ? 'Bạn đã chọn' : (b.suc_chua ? `còn ${Math.max(b.suc_chua - b.so_dang_ky, 0)}/${b.suc_chua} chỗ` : 'chưa chọn') }) : null,
          b.han_dang_ky ? dong({ tieu: 'Hạn đăng ký', sau: ngayGio(b.han_dang_ky), muiTen: false }) : null),
        b.noi_dung ? h('div', { class: 'noi-dung-tb', style: 'margin-bottom:16px' }, b.noi_dung) : null,
        h('div', { class: 'hang-nut', style: 'flex-direction:column' },
          b.can_dang_ky && moDK && !b.toi_dang_ky && khac ? h('p', { class: 'bang-tin' },
            'Bạn đang giữ ca ', khac.ten, '. Bỏ ca đó trước rồi mới chọn được ca này.') : null,
          b.can_dang_ky && moDK && !b.toi_dang_ky && !khac ? h('button', { class: 'nut day', type: 'button', onclick: async () => {
            const kq = await thu(() => S.db.chonBuoi(b.id));
            if (!kq) return;
            if (kq.ok === false) return toast(kq.loi || 'Không chọn được ca này.', true);
            toast(kq.da_co ? 'Bạn đã chọn ca này rồi.' : 'Đã chọn ca'); s.dong(); lai();
          } }, 'Chọn ca này') : null,
          b.can_dang_ky && moDK && b.toi_dang_ky ? h('button', { class: 'nut phu', type: 'button', onclick: async () => {
            if (!await xacNhan({ tieuDe: 'Bỏ ca này?', chu: 'Bỏ rồi thì chỗ của bạn mở lại cho người khác.', nut: 'Bỏ ca' })) return;
            const kq = await thu(() => S.db.boChonBuoi(b.id));
            if (!kq) return;
            if (kq.ok === false) return toast(kq.loi, true);
            toast('Đã bỏ ca'); s.dong(); lai();
          } }, 'Bỏ ca này') : null,
          !b.dong ? h('a', { class: 'nut phu', href: `#hom-nay/cau-hoi/${d.id}/${b.id}`, style: 'text-decoration:none;text-align:center', onclick: () => s.dong() }, 'Câu hỏi trong giờ') : null),
        b.can_dang_ky && !moDK ? h('p', { class: 'chu-nho', style: 'margin-top:12px' }, 'Ngoài giờ đăng ký. Cần đổi ca thì nhắn Ban tổ chức.') : null)
    });
  };

  const hang = (d, b, buoiCuaDot) => {
    const coRa = b.ra_sau_phut !== null && b.ra_sau_phut !== undefined;
    const trong = nay >= new Date(b.bat_dau).getTime() - 30 * 60e3;
    const khac = caKhac(buoiCuaDot, b);
    const trangThai = b.toi_vao
      ? (coRa && !b.toi_ra ? 'đã vào ' + gio(b.toi_vao) : coRa ? `vào ${gio(b.toi_vao)}, ra ${gio(b.toi_ra)}` : 'đã điểm danh')
      : trong ? 'chưa điểm danh' : null;
    const con = b.suc_chua ? Math.max(b.suc_chua - b.so_dang_ky, 0) : null;
    return dong({
      truoc: dauNgay(b.bat_dau),
      tieu: b.ten,
      phu: [gio(b.bat_dau), b.phan ? PHAN[b.phan] : null, b.dia_diem,
        b.can_dang_ky ? (b.toi_dang_ky ? 'bạn đã chọn ca' : khac ? 'bạn đang giữ ca ' + khac.ten
          : con === null ? 'chưa chọn ca' : con > 0 ? `chưa chọn · còn ${con} chỗ` : 'đã đủ chỗ') : null,
        trangThai].filter(Boolean).join(' · '),
      sau: b.can_dang_ky && !b.toi_dang_ky && !khac ? h('span', { class: 'the-nhan ' + (con === 0 ? 'vang' : 'tre') }, con === 0 ? 'Hết chỗ' : 'Chọn ca') : null,
      onclick: () => moBuoi(d, b, buoiCuaDot)
    });
  };

  dat(vung,
    h('h1', { class: 'tieu-de-lon' }, 'Lịch học'),
    theoDot.map(({ d, buoi }) => {
      const sap = buoi.filter(b => new Date(b.bat_dau).getTime() >= nay - 12 * 3600e3);
      const qua = buoi.filter(b => new Date(b.bat_dau).getTime() < nay - 12 * 3600e3).reverse();
      return [
        h('div', { class: 'nhan-nhom' }, `${d.ma} · ${TRANG_THAI[d.trang_thai]}`),
        buoi.length ? null : rong('Đợt này chưa có buổi nào. Ban tổ chức sẽ thêm lịch sau.'),
        sap.length ? nhom('Sắp tới', sap.map(b => hang(d, b, buoi))) : null,
        qua.length ? nhom('Đã qua', qua.map(b => hang(d, b, buoi))) : null
      ];
    }),
    h('p', { class: 'chu-nho', style: 'margin-bottom:22px' }, 'Chạm vào một buổi để xem chi tiết, chọn ca hoặc gửi câu hỏi. Ca ghi "Chọn ca" là ca phải đăng ký; hết chỗ thì app báo ngay khi bạn bấm.'));
}

/* ---------- Tài liệu và checklist ---------- */
async function manHVTaiLieu(vung) {
  const dot = S.toi.dot || [];
  if (!dot.length) return dat(vung, h('h1', { class: 'tieu-de-lon' }, 'Tài liệu'), rong('Bạn chưa có đợt tập huấn nào.'));
  const theoDot = [];
  for (const d of dot) {
    const [tl, ck] = await Promise.all([S.db.dsTaiLieuDot(d.id).catch(() => []), S.db.dsChecklistDot(d.id).catch(() => [])]);
    theoDot.push({ d, tl, ck });
  }
  dat(vung,
    h('h1', { class: 'tieu-de-lon' }, 'Tài liệu'),
    theoDot.map(({ d, tl, ck }) => [
      h('div', { class: 'nhan-nhom' }, d.ma),
      tl.length ? nhom('Tài liệu', tl.map(x => hangTaiLieu(x))) : null,
      ck.length ? nhom('Checklist', ck.map(x => dong({
        tieu: x.ten, phu: [x.buoi_ten, soMucChecklist(x) + ' mục'].filter(Boolean).join(' · '),
        truoc: icon('phieu'), onclick: () => moChecklist(x, d.ten)
      }))) : null,
      !tl.length && !ck.length ? rong('Đợt này chưa có tài liệu nào.') : null
    ]),
    h('p', { class: 'chu-nho', style: 'margin-bottom:22px' }, 'Tài liệu mở ra là đường dẫn trên Drive của Ban tổ chức. Checklist tick ngay trên máy bạn, app không lưu và có thể in ra để tích bằng bút.'));
}

/* ---------- Câu hỏi trong giờ ---------- */
async function manHVCauHoi(vung, dotId, buoiId) {
  const d = (S.toi.dot || []).find(x => x.id === dotId);
  if (!d) return dat(vung, thanh('Câu hỏi', '#hom-nay', 'Hôm nay'), rong('Bạn không có tên trong đợt này.'));
  const ds = await S.db.dsBuoiDot(dotId);
  const b = ds.find(x => x.id === buoiId);
  if (!b) return dat(vung, thanh('Câu hỏi', '#lich', 'Lịch học'), rong('Không tìm thấy buổi này.'));
  return manCauHoi(vung, {
    buoi: b, quanLy: false, guiDuoc: d.trang_thai === 'mo',
    lui: '#lich', luiNhan: 'Lịch học',
    lai: () => manHVCauHoi(vung, dotId, buoiId)
  });
}

/* ---------- Hồ sơ ---------- */
function doiMatKhau() {
  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const m = f.elements.mk.value;
      if (m.length < 8) return;
      if (await thu(() => S.db.doiMatKhau(m), 'Đã đổi mật khẩu')) s.dong();
    }
  },
    h('div', { class: 'nhom' }, oNhap('Mật khẩu mới (ít nhất 8 ký tự)', { name: 'mk', type: 'password', autocomplete: 'new-password', required: true, minlength: 8 })),
    h('button', { class: 'nut day', type: 'submit' }, 'Đổi mật khẩu'));
  const s = moSheet({ tieuDe: 'Đổi mật khẩu', noiDung: f });
}

export async function manHVHoSo(vung) {
  const t = S.toi;
  const ds = t.dot || [];
  const cc = await S.db.chuyenCan(t.id, '2000-01-01T00:00:00+07:00', new Date().toISOString()).catch(() => null);
  dat(vung,
    h('h1', { class: 'tieu-de-lon' }, 'Hồ sơ'),
    h('div', { class: 'dau-ho-so' },
      h('div', { class: 'nhan' }, 'Học viên'),
      h('div', { class: 'ten' }, t.ho_ten),
      h('div', { class: 'phu' }, t.ma)),
    cc && cc.tong ? soLieu([
      { so: cc.dung + cc.tre, ten: `Có mặt / ${cc.tong} buổi đã đóng`, lop: 'dung' },
      { so: cc.tre, ten: 'Trễ', lop: 'tre' },
      { so: cc.vang, ten: 'Vắng', lop: cc.vang ? 'vang' : '' }
    ]) : null,
    nhom('Thông tin',
      dong({ tieu: 'Mã học viên', sau: t.ma, muiTen: false }),
      dong({ tieu: 'Email', sau: t.email || '–', muiTen: false }),
      dong({ tieu: 'Tài khoản', sau: t.chi_doc ? 'Chỉ xem' : 'Đang dùng được', muiTen: false })),
    ds.length ? nhom('Đợt đã đăng ký', ds.map(d => dong({
      tieu: d.ten, phu: `${d.ma} · ${khoang(d)}`,
      sau: h('span', { class: 'the-nhan ' + LOP_TT[d.trang_thai] }, TRANG_THAI[d.trang_thai]), muiTen: false
    }))) : rong('Chưa có đợt nào.'),
    h('p', { class: 'chu-nho', style: 'margin-bottom:22px' }, 'Sai thông tin thì nhắn Ban tổ chức đợt sửa, vì danh sách do Ban tổ chức nạp. Chuyên cần chỉ tính các buổi Ban tổ chức đã đóng.'),
    nhom('Tài khoản',
      dong({ tieu: 'Đổi mật khẩu', onclick: doiMatKhau }),
      h('button', {
        class: 'dong', type: 'button', style: 'color:var(--vang);font-weight:500',
        onclick: async () => { if (await xacNhan({ tieuDe: 'Đăng xuất?', nut: 'Đăng xuất', nguy: true })) { await S.db.dangXuat(); location.hash = ''; location.reload(); } }
      }, 'Đăng xuất')),
    h('p', { class: 'chu-nho giua-chu' }, 'Thông tin cá nhân chỉ Ban tổ chức đợt và quản trị app xem được.'));
}
