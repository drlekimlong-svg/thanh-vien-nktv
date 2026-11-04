// Post-test phía thành viên: danh sách, làm bài có đồng hồ và lưu tự động, xem kết quả.
import { S, khiRoi } from './state.js';
import { h, dat, dong, nhom, thu, toast, ngay, ngayGio, soVN, rong, xacNhan, rungThanhCong, rungLoi, hinhCau } from './ui.js';

const CHU = 'ABCDEFGH';
const khoaNhap = (lam) => 'nktv-bai-' + lam;

function trangThaiBai(b) {
  const nay = new Date();
  if (b.dang_lam_den) return { chu: 'Đang làm dở', lop: 'cho', lam: true };
  const daDong = b.dong_luc && new Date(b.dong_luc) <= nay;
  const chuaMo = b.mo_luc && new Date(b.mo_luc) > nay;
  if (chuaMo) return { chu: 'Mở ' + ngayGio(b.mo_luc), lop: '' };
  if (b.da_gui > 0) return { chu: 'Điểm ' + soVN(b.diem), lop: 'dat', xem: true, lam: !daDong && b.da_gui < b.so_lan && b.da_diem_danh };
  if (daDong) return { chu: 'Đã đóng', lop: 'vang' };
  if (!b.da_diem_danh) return { chu: 'Chờ điểm danh', lop: 'cho', khoa: true };
  return { chu: 'Đang mở', lop: 'dung', lam: true };
}

/** Bài test đầu giờ: chỉ mở khi đã điểm danh buổi gắn với bài. */
export const laDauGio = (b) => !!b.buoi_id;
export const baoChoDiemDanh = (b) => toast(`Bài này mở sau khi bạn điểm danh buổi ${ngay(b.buoi_bat_dau)}. Điểm danh xong, mở lại trang Post-test.`);

export async function manPostTest(vung) {
  const ds = await S.db.baiCuaToi();
  dat(vung,
    h('h1', { class: 'tieu-de-lon' }, 'Post-test'),
    ds.length ? nhom(null, ds.map(b => {
      const tt = trangThaiBai(b);
      return dong({
        tieu: b.tieu_de,
        phu: (laDauGio(b) ? `Test đầu giờ buổi ${ngay(b.buoi_bat_dau)} · ` : '') + `${b.so_cau} câu · ${b.thoi_gian_phut} phút` + (b.dong_luc ? ' · Hạn ' + ngayGio(b.dong_luc) : ''),
        sau: h('span', { class: 'the-nhan ' + tt.lop }, tt.chu),
        onclick: tt.lam || tt.xem ? () => moBai(b, tt) : tt.khoa ? () => baoChoDiemDanh(b) : null, muiTen: !!(tt.lam || tt.xem)
      });
    })) : rong('Chưa có bài post-test nào.'));
}

function moBai(b, tt) {
  if (tt.xem && !tt.lam) { location.hash = 'post-test/ket-qua/' + b.id; return; }
  if (tt.chu === 'Đang làm dở' || b.da_gui === 0) {
    xacNhan({
      tieuDe: b.tieu_de,
      chu: tt.chu === 'Đang làm dở' ? 'Tiếp tục bài đang làm. Đồng hồ vẫn chạy kể cả khi đã thoát ra.' : `${b.so_cau} câu, ${b.thoi_gian_phut} phút. Đồng hồ chạy ngay khi bắt đầu và không dừng khi thoát ra. Làm bài bằng chính sức mình: liêm chính và thực chất.`,
      nut: tt.chu === 'Đang làm dở' ? 'Tiếp tục' : 'Bắt đầu làm bài'
    }).then(ok => { if (ok) location.hash = 'post-test/lam/' + b.id; });
  } else location.hash = 'post-test/ket-qua/' + b.id;
}

export async function manLamBai(vung, baiId) {
  const d = await S.db.batDauBai(baiId);
  const lech = new Date(d.bay_gio).getTime() - Date.now();
  const han = new Date(d.han_luc).getTime();
  let traLoi = {};
  try { traLoi = JSON.parse(localStorage.getItem(khoaNhap(d.lam_id))) || {}; } catch (_) {}
  traLoi = Object.assign({}, d.tra_loi, traLoi);

  const dongHo = h('div', { class: 'dong-ho' }, '');
  const vach = h('i', { style: 'transform:scaleX(0)' });
  const demDaLam = () => d.cau.filter(c => traLoi[c.id] !== undefined).length;
  const capNhatTien = () => { vach.style.transform = `scaleX(${demDaLam() / d.cau.length})`; nutGui.textContent = `Gửi bài (${demDaLam()}/${d.cau.length})`; };

  let henLuu = 0, daGui = false;
  const luuMay = () => { try { localStorage.setItem(khoaNhap(d.lam_id), JSON.stringify(traLoi)); } catch (_) {} };
  const luuNgay = () => S.db.luuTamBai(d.lam_id, traLoi).catch(() => {});
  const chon = (c, i, nhomNut) => {
    traLoi[c.id] = i;
    nhomNut.forEach((n, j) => n.setAttribute('aria-pressed', j === i ? 'true' : 'false'));
    rungThanhCong();
    capNhatTien(); luuMay();
    clearTimeout(henLuu); henLuu = setTimeout(luuNgay, 1200);
  };

  const gui = async () => {
    if (daGui) return;
    daGui = true; clearInterval(hen); clearTimeout(henLuu);
    const kq = await thu(() => S.db.guiBai(d.lam_id, traLoi));
    if (!kq) { daGui = false; hen = setInterval(chay, 1000); return; }
    try { localStorage.removeItem(khoaNhap(d.lam_id)); } catch (_) {}
    location.hash = 'post-test/ket-qua/' + baiId;
  };
  const nutGui = h('button', {
    class: 'nut day', type: 'button',
    onclick: async () => {
      const thieu = d.cau.length - demDaLam();
      const ok = await xacNhan({ tieuDe: 'Gửi bài?', chu: thieu ? `Còn ${thieu} câu chưa chọn. Sau khi gửi không sửa được nữa.` : 'Sau khi gửi không sửa được nữa.', nut: 'Gửi bài' });
      if (ok) gui();
    }
  }, 'Gửi bài');

  const chay = () => {
    const con = Math.max(0, han - (Date.now() + lech));
    const s = Math.ceil(con / 1000);
    dongHo.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    dongHo.classList.toggle('gap', s <= 60);
    if (con <= 0) { rungLoi(); toast('Hết giờ. Đang gửi bài.'); gui(); }
  };
  let hen = setInterval(chay, 1000);
  khiRoi(() => { clearInterval(hen); clearTimeout(henLuu); if (!daGui) luuNgay(); });
  const khiAn = () => { if (document.hidden && !daGui) luuNgay(); };
  document.addEventListener('visibilitychange', khiAn);
  khiRoi(() => document.removeEventListener('visibilitychange', khiAn));

  let phanCu = null;
  vung.className = 'noi-dung';
  dat(vung,
    h('div', { class: 'lam-bai-dau' }, dongHo, h('div', { class: 'tien-do' }, vach)),
    h('h1', { style: 'font-size:1.375rem;font-weight:700;letter-spacing:-0.018em;line-height:1.2;margin:4px 0 18px' }, d.tieu_de),
    d.mo_ta ? h('p', { class: 'mo-ta-bai' }, d.mo_ta) : null,
    d.cau.map((c, n) => {
      const hienPhan = c.phan && c.phan !== phanCu; phanCu = c.phan;
      const nutChon = [];
      c.lua_chon.forEach((t, i) => nutChon.push(h('button', {
        class: 'lua-chon', type: 'button', 'aria-pressed': traLoi[c.id] === i ? 'true' : 'false', onclick: () => chon(c, i, nutChon)
      }, h('span', { class: 'chu' }, CHU[i]), h('span', null, t))));
      return h('section', { class: 'cau' }, hienPhan ? h('div', { class: 'phan' }, c.phan) : null,
        h('p', { class: 'de' }, h('b', null, `Câu ${n + 1}. `), c.noi_dung), c.hinh ? hinhCau(c.hinh, `Hình câu ${n + 1}`) : null, nutChon);
    }),
    nutGui,
    h('p', { class: 'chu-nho giua-chu', style: 'margin-top:12px' }, 'Bài được lưu tự động sau mỗi lần chọn. Hết giờ, bài tự gửi.'));
  capNhatTien(); chay();
}

export async function manKetQua(vung, baiId) {
  const k = await S.db.xemLaiBai(baiId);
  const lyDoAn = k.hien_dap_an_kieu === 'sau_dong' ? (k.dong_luc ? 'Đáp án hiện sau khi bài đóng lúc ' + ngayGio(k.dong_luc) + '.' : 'Đáp án hiện sau khi bài đóng.') : 'Bài này không công bố đáp án.';
  dat(vung,
    h('div', { class: 'thanh-nho' }, h('div', { class: 'khoang' }, h('a', { class: 'nut-lui', href: '#post-test', style: 'text-decoration:none' }, '‹ Post-test')), h('h1', null, 'Kết quả'), h('div', { class: 'khoang phai' })),
    h('div', { class: 'nhom diem-lon' },
      h('div', { class: 'so' }, soVN(k.diem)),
      h('div', { class: 'phu' }, `${k.so_dung}/${k.tong} câu đúng · thang 10`),
      h('p', { class: 'chu-nho', style: 'margin-top:10px' }, k.tieu_de, h('br'), 'Gửi ' + ngayGio(k.nop_luc), k.tu_dong ? ' · Tự gửi khi hết giờ' : '')),
    k.hien_dap_an && k.cau ? k.cau.map((c, n) => h('section', { class: 'cau' },
      h('p', { class: 'de' }, h('b', null, `Câu ${n + 1}. `), c.noi_dung),
      c.hinh ? hinhCau(c.hinh, `Hình câu ${n + 1}`) : null,
      c.lua_chon.map((t, i) => h('button', {
        class: 'lua-chon' + (i === c.dung ? ' dung-roi' : i === c.chon ? ' sai-roi' : ''), type: 'button', disabled: true
      }, h('span', { class: 'chu' }, CHU[i]), h('span', null, t))),
      c.chon === null || c.chon === undefined ? h('p', { class: 'chu-nho' }, 'Không chọn câu này.') : null))
      : h('div', { class: 'bang-tin xanh' }, lyDoAn));
}
