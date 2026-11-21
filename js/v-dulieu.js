// Dữ liệu cá nhân (migration 0020): thông báo xử lý dữ liệu, ô đồng ý khi kích hoạt, màn hỏi lại,
// mục "Dữ liệu của tôi" trong Hồ sơ, và màn quản trị theo dõi lời đồng ý, yêu cầu.
//
// Căn cứ: Luật 91/2025/QH15 Điều 4, 9; Nghị định 356/2025/NĐ-CP Điều 5, 6 (rà soát của agent, cần pháp chế xác nhận).
// Anh Long chốt 21/11/2026: bên kiểm soát và đầu mối là Ban chủ nhiệm CLB; giữ dữ liệu 6 tháng.
// Người không đồng ý: agent đề xuất vẫn là thành viên, không dùng app, Ban chủ nhiệm liên hệ trong 2 ngày làm việc.
//
// Đổi nội dung thông báo thì tăng PHIEN_BAN: mọi người được hỏi lại ở lần mở app sau.
import { S } from './state.js';
import { h, dat, dong, nhom, moSheet, thu, bieuTuong, mui, ngay, ngayGio, oNhap, oChon, oBat, xacNhan, rong } from './ui.js';

export const PHIEN_BAN = '1.0';
export const AP_DUNG_TU = '21/11/2026';

const MUC = [
  {
    id: 'ai', icon: 'khien', tieu: 'Ai giữ dữ liệu của bạn', tom: 'Ban chủ nhiệm CLB Ngoại khoa Trưng Vương.',
    chi: [
      'Ban chủ nhiệm CLB Ngoại khoa Trưng Vương là bên kiểm soát dữ liệu cá nhân của bạn trong app này, đồng thời là đầu mối nhận mọi câu hỏi và yêu cầu về dữ liệu.',
      'Gửi yêu cầu ngay trong app: Hồ sơ › Dữ liệu của tôi. Bạn cũng có thể gặp trực tiếp Ban chủ nhiệm ở buổi sinh hoạt.'
    ]
  },
  {
    id: 'thu', icon: 'the', tieu: 'App thu những gì', tom: 'Thông tin thành viên, điểm danh, bài làm, hồ sơ năng lực.',
    chi: [
      'Thành viên CLB: họ tên, mã NKTV, gen, nhà, cấp, chức vụ, còn sinh hoạt hay không.',
      'Học viên tập huấn: họ tên, lớp, MSSV, email và đợt đã ghi danh.',
      'Sinh hoạt: điểm danh (buổi, giờ, cách điểm danh), đơn xin nghỉ và lý do, ca đã đăng ký.',
      'Học tập: bài test và điểm, phiếu trả lời bài giấy, câu hỏi gửi trong giờ, phiếu góp ý, kết quả và giấy chứng nhận của đợt.',
      'Hồ sơ năng lực: hoạt động, minh chứng và liên kết do bạn tự ghi.',
      'Lời đồng ý của bạn (phiên bản, thời điểm) và các yêu cầu bạn gửi về dữ liệu.',
      'App không thu dữ liệu sức khỏe. Khi xin nghỉ, chỉ cần ghi lý do ngắn gọn, đừng ghi chi tiết bệnh.'
    ]
  },
  {
    id: 'de', icon: 'sao', tieu: 'Dùng để làm gì', tom: 'Tổ chức sinh hoạt và tập huấn. Không quảng cáo, không bán.',
    chi: [
      'Xếp lịch, điểm danh, tính chuyên cần và điểm nhóm.',
      'Giao bài, chấm bài, theo dõi hồ sơ năng lực.',
      'Gửi thông báo. Với học viên: gửi mã kích hoạt qua email, cấp và tra cứu giấy chứng nhận.',
      'Đăng ảnh, video sinh hoạt có bạn lên fanpage CLB chỉ khi bạn chọn ô đồng ý riêng, không bắt buộc.',
      'CLB không dùng dữ liệu của bạn để quảng cáo, không bán, không đưa cho ai ngoài các dịch vụ ở mục “Lưu ở đâu”.'
    ]
  },
  {
    id: 'luu', icon: 'may', tieu: 'Lưu ở đâu', tom: 'Máy chủ Supabase tại Singapore.',
    chi: [
      'Cơ sở dữ liệu và tài khoản đăng nhập nằm trên dịch vụ Supabase, máy chủ đặt tại Singapore, tức là ngoài Việt Nam.',
      'Giao diện app phát từ GitHub Pages; nơi này không chứa dữ liệu của thành viên hay học viên.',
      'Thư gửi mã kích hoạt cho học viên đi qua dịch vụ gửi thư Mailjet, chỉ gồm tên, email, mã kích hoạt và thông tin đợt.',
      'Dữ liệu đi trên đường truyền mã hóa (HTTPS). Trình duyệt trên điện thoại giữ phiên đăng nhập, khóa tạo mã điểm danh và vài lựa chọn hiển thị; app không dùng cookie quảng cáo hay công cụ theo dõi.'
    ]
  },
  {
    id: 'xem', icon: 'mat', tieu: 'Ai được xem', tom: 'Người được phân quyền, trong phạm vi việc được giao.',
    chi: [
      'Quản trị, Ban cố vấn và người được giao điểm danh xem được danh sách thành viên và điểm danh. Nhóm trưởng, nhóm phó soạn lịch cho nhà mình. Ban tổ chức đợt xem dữ liệu học viên của đợt theo vai trò.',
      'Thành viên khác không xem được hồ sơ của bạn.',
      'Ai quét mã trên thẻ thành viên chỉ thấy họ tên, gen, nhà, cấp và còn sinh hoạt hay không. Ai có mã in trên giấy chứng nhận chỉ thấy họ tên, tên đợt, mức và ngày cấp.'
    ]
  },
  {
    id: 'han', icon: 'cat', tieu: 'Lưu bao lâu', tom: 'Trong thời gian sinh hoạt và 6 tháng sau đó.',
    chi: [
      'Thành viên CLB: suốt thời gian bạn sinh hoạt, và 6 tháng sau khi bạn rời CLB.',
      'Học viên tập huấn: 6 tháng sau khi đợt kết thúc.',
      'Hết hạn, dữ liệu được xóa hoặc ẩn danh (không còn biết là của ai) để làm thống kê.',
      'Riêng thông tin in trên giấy chứng nhận (mã giấy, họ tên, tên đợt, mức, ngày cấp) được giữ để người khác tra cứu được giấy là thật.'
    ]
  },
  {
    id: 'quyen', icon: 'tay', tieu: 'Quyền của bạn', tom: 'Xem, sửa, rút đồng ý, xin xóa.',
    chi: [
      'Được biết dữ liệu nào của mình đang được xử lý và để làm gì.',
      'Đồng ý, hoặc rút lại đồng ý bất cứ lúc nào.',
      'Xem, xin bản sao, xin sửa dữ liệu của mình.',
      'Xin xóa, hạn chế xử lý, hoặc phản đối việc xử lý.',
      'Khiếu nại.',
      'Cách làm: Hồ sơ › Dữ liệu của tôi › Gửi yêu cầu. Ban chủ nhiệm phản hồi trong 2 ngày làm việc và thực hiện trong thời hạn Nghị định 356/2025/NĐ-CP quy định.'
    ]
  },
  {
    id: 'khong', icon: 'nguoi', tieu: 'Nếu bạn không đồng ý', tom: 'Bạn vẫn là thành viên, chỉ không dùng app.',
    chi: [
      'Đồng ý ở mục chính là điều kiện để dùng app. Bạn chọn “Chưa đồng ý” thì app ghi lại lựa chọn đó cùng thời điểm rồi đăng xuất.',
      'Bạn vẫn là thành viên CLB (hoặc học viên của đợt). Ban chủ nhiệm (với học viên: Ban tổ chức đợt) liên hệ bạn trong 2 ngày làm việc để trả lời thắc mắc và thống nhất cách bạn sinh hoạt khi không dùng app, ví dụ điểm danh và làm bài trên giấy.',
      'Đổi ý lúc nào cũng được: đăng nhập lại và chọn Đồng ý.',
      'Ô đăng ảnh lên fanpage không bắt buộc; không chọn cũng không ảnh hưởng gì.'
    ]
  },
  {
    id: 'bao-ve', icon: 'khoa', tieu: 'Bảo vệ dữ liệu', tom: 'Mật khẩu băm, phân quyền theo từng dòng dữ liệu.',
    chi: [
      'Mật khẩu và mã kích hoạt chỉ lưu ở dạng băm; không ai đọc được mã gốc.',
      'Mỗi bảng dữ liệu đều khóa theo quyền: trình duyệt chỉ lấy được phần mà người đang đăng nhập được phép xem.',
      'Khi có sự cố lộ dữ liệu, Ban chủ nhiệm báo cơ quan có thẩm quyền và báo bạn theo quy định.'
    ]
  },
  {
    id: 'doi', icon: 'chuong', tieu: 'Khi thông báo thay đổi', tom: 'App hỏi lại bạn.',
    chi: ['Mỗi lần nội dung thay đổi, số phiên bản tăng lên và app hỏi lại sự đồng ý của bạn ở lần mở tiếp theo.']
  }
];

/* Biểu tượng riêng của phần này; các biểu tượng chung lấy từ ui.js. */
const SVG_RIENG = {
  khien: '<path d="M12 2.8 4.5 5.6v5.6c0 4.8 3.2 8.6 7.5 10 4.3-1.4 7.5-5.2 7.5-10V5.6Z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="m8.6 12 2.4 2.4 4.4-4.6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  the: '<rect x="3" y="5" width="18" height="14" rx="2.6" fill="currentColor"/><path d="M7 10h6M7 14h4" stroke="var(--be-mat, #fff)" stroke-width="1.8" stroke-linecap="round"/><circle cx="16.5" cy="12" r="1.8" fill="var(--be-mat, #fff)"/>',
  may: '<path d="M7.5 18.5h9.8a4.2 4.2 0 0 0 .5-8.4 5.8 5.8 0 0 0-11.2 1.3A3.6 3.6 0 0 0 7.5 18.5Z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>',
  mat: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
  cat: '<path d="M6.5 3.5h11M6.5 20.5h11M7.5 3.5c0 4.5 4.5 5.5 4.5 8.5s-4.5 4-4.5 8.5M16.5 3.5c0 4.5-4.5 5.5-4.5 8.5s4.5 4 4.5 8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>',
  tay: '<path d="M5 12.5 9.5 17 19 7.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
};
export function bieuTuongDL(ten) {
  if (!SVG_RIENG[ten]) return bieuTuong(ten);
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
  s.innerHTML = SVG_RIENG[ten];
  return s;
}
const icon = (t) => h('div', { class: 'bieu-tuong' }, bieuTuongDL(t));

/** Toàn văn thông báo: mỗi mục một dòng tóm tắt, chạm vào mới mở chi tiết. */
export function noiDungThongBao(moSan = 'thu') {
  return h('div', { class: 'thong-bao-dl' },
    h('p', { class: 'chu-nho', style: 'margin-bottom:14px' },
      'Thông báo về xử lý dữ liệu cá nhân · phiên bản ', PHIEN_BAN, ' · áp dụng từ ', AP_DUNG_TU),
    h('div', { class: 'nhom' }, MUC.map(m => h('details', { class: 'muc-dl', open: m.id === moSan },
      h('summary', { class: 'dong' }, icon(m.icon),
        h('div', { class: 'giua' }, h('div', { class: 'chinh' }, m.tieu), h('div', { class: 'phu' }, m.tom)),
        h('span', { class: 'mo-dl', 'aria-hidden': 'true' }, mui())),
      h('ul', { class: 'chi-dl' }, m.chi.map(c => h('li', null, c)))))),
    h('p', { class: 'chu-nho giua-chu', style: 'margin-top:4px' }, 'Ban chủ nhiệm CLB Ngoại khoa Trưng Vương'));
}
export const moThongBao = (moSan) => moSheet({ tieuDe: 'Dữ liệu cá nhân', noiDung: noiDungThongBao(moSan) });

/** Hai ô đồng ý, không đánh dấu sẵn. khiDoi nhận true khi ô bắt buộc đã được chọn. */
export function oDongY(khiDoi) {
  const chinh = h('input', { type: 'checkbox', name: 'dy', onchange: () => khiDoi && khiDoi(chinh.checked) });
  const anh = h('input', { type: 'checkbox', name: 'da' });
  const link = h('button', { class: 'nut-chu lien-ket', type: 'button', onclick: () => moThongBao() }, 'Thông báo về xử lý dữ liệu cá nhân');
  const el = h('div', { class: 'dong-y' },
    h('label', { class: 'chon' }, chinh, h('span', null, 'Tôi đã đọc ', link, ` (phiên bản ${PHIEN_BAN}) và đồng ý cho các mục đích trong đó.`, h('span', { class: 'tag bb' }, 'Bắt buộc'))),
    h('label', { class: 'chon' }, anh, h('span', null, 'Đồng ý để CLB đăng ảnh, video sinh hoạt có tôi lên fanpage CLB.', h('span', { class: 'tag kbb' }, 'Không bắt buộc'))));
  return { el, giaTri: () => ({ dong_y: chinh.checked, dang_anh: anh.checked }) };
}

/** Còn phải hỏi không: chưa trả lời, từ chối, hoặc đã đồng ý một phiên bản cũ. undefined = không đọc được (chưa có migration). */
export async function canHoi() {
  let dy;
  try { dy = await S.db.dongYCuaToi(); } catch (e) { console.warn('Chưa đọc được lời đồng ý:', e.message); return { can: false }; }
  return { can: !dy || !dy.dong_y || dy.phien_ban !== PHIEN_BAN, dy };
}

/** Phần thân của màn hỏi lại. tiepTuc() khi đồng ý, tuChoi() sau khi đã ghi lời từ chối. */
export function noiDungHoiLai(dy, { tiepTuc, tuChoi }) {
  const nut = h('button', { class: 'nut day', type: 'button', disabled: true }, 'Đồng ý và tiếp tục');
  const o = oDongY((ok) => { nut.disabled = !ok; });
  const ghi = async (dongY) => {
    const v = o.giaTri();
    nut.disabled = true;
    const kq = await thu(() => S.db.ghiDongY(PHIEN_BAN, dongY, v.dang_anh, 'hoi_lai'));
    if (!kq) { nut.disabled = !v.dong_y; return; }
    if (dongY) tiepTuc(); else tuChoi();
  };
  nut.addEventListener('click', () => ghi(true));
  const lanTruoc = dy && !dy.dong_y ? 'Lần trước (' + ngay(dy.luc) + ') bạn chọn chưa đồng ý. ' : dy && dy.phien_ban !== PHIEN_BAN ? 'Thông báo vừa đổi sang phiên bản ' + PHIEN_BAN + '. ' : '';
  return h('div', { class: 'hoi-lai' },
    h('div', { class: 'kicker' }, 'Dữ liệu cá nhân · phiên bản ', PHIEN_BAN),
    h('h1', { class: 'tieu-de-serif' }, 'Trước khi tiếp tục'),
    h('p', { class: 'chu-nho', style: 'margin-bottom:14px;font-size:0.9375rem' }, lanTruoc,
      'CLB ban hành Thông báo về xử lý dữ liệu cá nhân cho app. Bạn đọc và xác nhận một lần; khi thông báo đổi phiên bản, app sẽ hỏi lại.'),
    h('div', { class: 'tom-dl' },
      h('div', null, bieuTuongDL('the'), h('span', null, h('b', null, 'Thu gì: '), 'họ tên, mã, nhà, điểm danh, đơn xin nghỉ, bài làm, hồ sơ năng lực.')),
      h('div', null, bieuTuongDL('may'), h('span', null, h('b', null, 'Lưu ở đâu: '), 'máy chủ Supabase đặt tại Singapore.')),
      h('div', null, bieuTuongDL('cat'), h('span', null, h('b', null, 'Bao lâu: '), 'khi còn sinh hoạt và 6 tháng sau đó.')),
      h('div', null, bieuTuongDL('khien'), h('span', null, h('b', null, 'Quyền của bạn: '), 'xem, sửa, rút đồng ý, xin xóa tại Hồ sơ › Dữ liệu của tôi.'))),
    h('button', { class: 'nut-chu', type: 'button', style: 'margin:0 0 12px -6px', onclick: () => moThongBao() }, 'Đọc toàn văn thông báo ›'),
    o.el, nut,
    h('button', { class: 'nut-chu day-chu', type: 'button', onclick: async () => {
      if (await xacNhan({ tieuDe: 'Chưa đồng ý?', chu: 'App sẽ ghi lại lựa chọn này rồi đăng xuất. Bạn vẫn là thành viên; Ban chủ nhiệm liên hệ bạn trong 2 ngày làm việc. Đổi ý thì đăng nhập lại.', nut: 'Chưa đồng ý và đăng xuất', nguy: true })) ghi(false);
    } }, 'Chưa đồng ý · đăng xuất'));
}

/** Màn sau khi từ chối hoặc rút lại đồng ý. */
export const noiDungTuChoi = () => h('div', { class: 'hoi-lai' },
  h('div', { class: 'kicker' }, 'Dữ liệu cá nhân'),
  h('h1', { class: 'tieu-de-serif' }, 'Đã ghi lại lựa chọn của bạn'),
  h('div', { class: 'nhom', style: 'margin-top:14px' },
    dong({ truoc: icon('nguoi'), tieu: 'Bạn vẫn là thành viên', phu: 'Chỉ là không dùng app trong lúc chưa đồng ý.' }),
    dong({ truoc: icon('chuong'), tieu: 'Ban chủ nhiệm sẽ liên hệ', phu: 'Trong 2 ngày làm việc, để trả lời thắc mắc và thống nhất cách sinh hoạt không qua app (với học viên: Ban tổ chức đợt).' }),
    dong({ truoc: icon('tay'), tieu: 'Đổi ý lúc nào cũng được', phu: 'Đăng nhập lại và chọn Đồng ý.' })));

/* ---------- Hồ sơ › Dữ liệu của tôi ---------- */
const LOAI_YC = [['xem', 'Xem, xin bản sao dữ liệu của tôi'], ['sua', 'Sửa dữ liệu sai'], ['xoa', 'Xóa dữ liệu'], ['han_che', 'Hạn chế xử lý, phản đối'], ['khac', 'Khác']];
const TT_YC = { moi: ['Mới gửi', 'cho'], dang_xu_ly: ['Đang xử lý', 'phep'], xong: ['Đã xử lý', 'dung'], tu_choi: ['Không thực hiện', 'vang'] };
const tenLoai = (k) => (LOAI_YC.find(x => x[0] === k) || [k, k])[1];

function guiYeuCau(sauKhi) {
  const f = h('form', {
    onsubmit: async (e) => {
      e.preventDefault();
      const x = f.elements;
      const ok = await thu(() => S.db.guiYeuCauDuLieu(x.loai.value, x.nd.value), 'Đã gửi yêu cầu. Ban chủ nhiệm phản hồi trong 2 ngày làm việc.');
      if (ok) { s.dong(); sauKhi(); }
    }
  },
    h('div', { class: 'nhom' },
      oChon('Bạn muốn', LOAI_YC, 'xem', { name: 'loai' }),
      oNhap('Nói rõ hơn (nếu cần)', { the: 'textarea', name: 'nd', rows: 4, maxlength: 2000, placeholder: 'Ví dụ: tên tôi bị ghi sai dấu' })),
    h('button', { class: 'nut day', type: 'submit' }, 'Gửi yêu cầu'));
  const s = moSheet({ tieuDe: 'Gửi yêu cầu về dữ liệu', noiDung: f });
}

export function moDuLieuCuaToi() {
  moSheet({
    tieuDe: 'Dữ liệu của tôi',
    noiDung: async (than, dongSheet) => {
      const ve = async () => {
        dat(than, h('div', { class: 'dang-tai' }, 'Đang tải…'));
        let dy = null, yc = [];
        try { [dy, yc] = await Promise.all([S.db.dongYCuaToi(), S.db.yeuCauCuaToi()]); }
        catch (e) { dat(than, rong('Chưa đọc được dữ liệu: ' + e.message)); return; }
        const anh = oBat('Cho CLB đăng ảnh, video sinh hoạt có tôi lên fanpage', { checked: !!(dy && dy.dang_anh) });
        anh.querySelector('input').addEventListener('change', async (e) => {
          const v = e.target.checked;
          const ok = await thu(() => S.db.ghiDongY(PHIEN_BAN, true, v, 'du_lieu_cua_toi'), v ? 'Đã ghi: đồng ý đăng ảnh' : 'Đã ghi: không đăng ảnh');
          if (!ok) e.target.checked = !v;
        });
        dat(than,
          h('div', { class: 'bang-tin xanh' }, dy && dy.dong_y
            ? `Bạn đã đồng ý Thông báo phiên bản ${dy.phien_ban} lúc ${ngayGio(dy.luc)}.`
            : 'Bạn chưa đồng ý Thông báo về xử lý dữ liệu cá nhân.'),
          nhom(null,
            dong({ truoc: icon('khien'), tieu: 'Đọc Thông báo về xử lý dữ liệu cá nhân', phu: 'Phiên bản ' + PHIEN_BAN, onclick: () => moThongBao() })),
          nhom('Không bắt buộc', anh),
          h('p', { class: 'chu-nhom' }, 'Đổi lúc nào cũng được. App ghi lại mỗi lần bạn đổi.'),
          nhom(h('span', { style: 'display:contents' }, 'Yêu cầu của tôi', h('button', { class: 'nut-chu', type: 'button', onclick: () => guiYeuCau(ve) }, 'Gửi yêu cầu')),
            yc.length ? yc.map(y => dong({
              tieu: tenLoai(y.loai), phu: 'Gửi ' + ngayGio(y.gui_luc) + (y.phan_hoi ? ' · Ban chủ nhiệm: ' + y.phan_hoi : ''),
              sau: h('span', { class: 'the-nhan ' + TT_YC[y.trang_thai][1] }, TT_YC[y.trang_thai][0]), muiTen: false
            })) : dong({ tieu: 'Chưa gửi yêu cầu nào', phu: 'Xem, xin bản sao, sửa, xóa dữ liệu của mình: bấm Gửi yêu cầu.', muiTen: false })),
          h('p', { class: 'chu-nhom' }, 'Ban chủ nhiệm phản hồi trong 2 ngày làm việc.'),
          nhom(null, h('button', {
            class: 'dong', type: 'button', style: 'color:var(--vang);font-weight:500',
            onclick: async () => {
              if (!await xacNhan({ tieuDe: 'Rút lại đồng ý?', chu: 'App ghi lại lựa chọn này rồi đăng xuất, và bạn không dùng app được cho tới khi đồng ý lại. Bạn vẫn là thành viên; Ban chủ nhiệm liên hệ bạn trong 2 ngày làm việc. Dữ liệu đã có không tự xóa: muốn xóa thì gửi yêu cầu Xóa trước khi rút.', nut: 'Rút lại và đăng xuất', nguy: true })) return;
              const ok = await thu(() => S.db.ghiDongY(PHIEN_BAN, false, false, 'du_lieu_cua_toi'));
              if (!ok) return;
              dongSheet();
              window.dispatchEvent(new CustomEvent('nktv-tu-choi'));
            }
          }, 'Rút lại đồng ý')));
      };
      ve();
    }
  });
}

/* ---------- Quản lý › Dữ liệu cá nhân (chỉ quản trị) ---------- */
export async function manQlDuLieu(vung, thanhNho) {
  const [ds, yc] = await Promise.all([S.db.dsDongYDuLieu(), S.db.dsYeuCauDuLieu()]);
  const laTV = (x) => x.loai !== 'hoc_vien';
  const nhomTT = (x) => !x.phien_ban ? (x.da_kich_hoat ? 'chua' : 'chua_kh') : !x.dong_y ? 'tu_choi' : x.phien_ban !== PHIEN_BAN ? 'cu' : 'dong_y';
  let loc = 'thanh_vien';
  const khung = h('div');
  const ve = () => {
    const dsLoc = ds.filter(x => loc === 'thanh_vien' ? laTV(x) && x.hoat_dong : !laTV(x));
    const dem = { dong_y: 0, cu: 0, tu_choi: 0, chua: 0, chua_kh: 0, anh: 0 };
    dsLoc.forEach(x => { dem[nhomTT(x)]++; if (x.dong_y && x.dang_anh) dem.anh++; });
    const tuChoi = dsLoc.filter(x => nhomTT(x) === 'tu_choi').sort((a, b) => new Date(b.luc) - new Date(a.luc));
    const chua = dsLoc.filter(x => ['chua', 'cu'].includes(nhomTT(x)));
    const moYc = yc.filter(y => y.trang_thai === 'moi' || y.trang_thai === 'dang_xu_ly');
    dat(khung,
      h('div', { class: 'chon-ngang' },
        [['thanh_vien', 'Thành viên CLB'], ['hoc_vien', 'Học viên']].map(([k, t]) => h('button', { class: 'vien', type: 'button', 'aria-pressed': String(loc === k), onclick: () => { loc = k; ve(); } }, t))),
      h('div', { class: 'so-lieu' },
        [['dong_y', 'Đã đồng ý', 'dung'], ['tu_choi', 'Chưa đồng ý', 'vang'], ['chua', 'Chưa trả lời', 'tre'], ['chua_kh', 'Chưa kích hoạt', '']].map(([k, t, l]) =>
          h('div', { class: 'o-so ' + l }, h('div', { class: 'so' }, dem[k] + (k === 'chua' ? dem.cu : 0)), h('div', { class: 'ten' }, t)))),
      h('p', { class: 'chu-nhom', style: 'margin-top:-12px' }, `Phiên bản hiện hành ${PHIEN_BAN}. ${dem.anh} người đồng ý đăng ảnh lên fanpage.`),
      nhom(`Yêu cầu về dữ liệu · ${moYc.length} chưa xong`,
        yc.length ? yc.map(y => dong({
          tieu: (y.ho_ten || 'Tài khoản đã xóa') + ' · ' + tenLoai(y.loai),
          phu: [y.ma, 'gửi ' + ngayGio(y.gui_luc), y.noi_dung].filter(Boolean).join(' · '),
          sau: h('span', { class: 'the-nhan ' + TT_YC[y.trang_thai][1] }, TT_YC[y.trang_thai][0]),
          onclick: () => xuLy(y)
        })) : dong({ tieu: 'Chưa có yêu cầu nào.', muiTen: false })),
      h('p', { class: 'chu-nhom' }, 'Phản hồi trong 2 ngày làm việc; thời hạn thực hiện theo Nghị định 356/2025/NĐ-CP, Điều 5.'),
      nhom('Chưa đồng ý · cần liên hệ trong 2 ngày làm việc',
        tuChoi.length ? tuChoi.map(x => dong({ tieu: x.ho_ten, phu: `${x.ma} · chọn chưa đồng ý ${ngayGio(x.luc)}`, muiTen: false }))
          : dong({ tieu: 'Không có ai.', muiTen: false })),
      chua.length ? nhom(`Đã kích hoạt, chưa trả lời · ${chua.length}`, chua.slice(0, 80).map(x => dong({ tieu: x.ho_ten, phu: x.ma + (x.phien_ban ? ' · đồng ý phiên bản cũ ' + x.phien_ban : ''), muiTen: false }))) : null,
      h('p', { class: 'chu-nhom' }, 'Người đã kích hoạt mà chưa trả lời sẽ gặp màn hỏi ở lần mở app tiếp theo. Người chưa kích hoạt được hỏi lúc kích hoạt.'));
  };
  const xuLy = (y) => {
    const f = h('form', {
      onsubmit: async (e) => {
        e.preventDefault();
        const x = f.elements;
        const ok = await thu(() => S.db.xuLyYeuCauDuLieu(y.id, x.tt.value, x.ph.value), 'Đã lưu');
        if (ok) { y.trang_thai = x.tt.value; y.phan_hoi = x.ph.value.trim() || null; s.dong(); ve(); }
      }
    },
      h('div', { class: 'bang-tin' }, (y.ho_ten || 'Tài khoản đã xóa') + (y.ma ? ' · ' + y.ma : ''), ' · ', tenLoai(y.loai), y.noi_dung ? h('div', { class: 'noi-dung-tb', style: 'margin-top:6px' }, y.noi_dung) : null),
      h('div', { class: 'nhom' },
        oChon('Trạng thái', Object.entries(TT_YC).map(([k, v]) => [k, v[0]]), y.trang_thai, { name: 'tt' }),
        oNhap('Phản hồi cho người gửi', { the: 'textarea', name: 'ph', rows: 4, maxlength: 2000, value: y.phan_hoi || '' })),
      h('button', { class: 'nut day', type: 'submit' }, 'Lưu'));
    const s = moSheet({ tieuDe: 'Yêu cầu về dữ liệu', noiDung: f });
  };
  ve();
  dat(vung, thanhNho('Dữ liệu cá nhân'), khung,
    nhom(null, dong({ truoc: icon('khien'), tieu: 'Xem Thông báo đang áp dụng', phu: 'Phiên bản ' + PHIEN_BAN + ' · từ ' + AP_DUNG_TU, onclick: () => moThongBao() })));
}
