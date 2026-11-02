// Đọc đề post-test từ PDF hoặc chữ dán vào, theo dạng "Câu 1. …" và "A. … B. …". Kết quả luôn cho quản trị xem và sửa trước khi đăng.
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';

let napPdf = null;
const taiPdfJs = () => {
  if (window.pdfjsLib) return Promise.resolve();
  napPdf = napPdf || new Promise((rs, rj) => {
    const s = document.createElement('script');
    s.src = PDFJS + 'pdf.min.js';
    s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; rs(); };
    s.onerror = () => rj(new Error('Chưa tải được bộ đọc PDF. Kiểm tra mạng rồi thử lại.'));
    document.head.append(s);
  });
  return napPdf;
};

/** Chữ của PDF theo từng dòng. Chỉ số trên, chỉ số dưới được gộp vào dòng chính. */
export async function chuTuPdf(boDem) {
  await taiPdfJs();
  const pdf = await window.pdfjsLib.getDocument({ data: boDem }).promise;
  const dong = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const trang = await pdf.getPage(p);
    const nd = await trang.getTextContent();
    const muc = nd.items.filter(i => i.str && i.str.trim()).map(i => ({ s: i.str, x: i.transform[4], y: i.transform[5], w: i.width, c: Math.abs(i.transform[3]) || i.height }));
    muc.sort((a, b) => b.y - a.y || a.x - b.x);
    const nhom = [];
    for (const m of muc) {
      const g = nhom.find(n => Math.abs(n.y - m.y) <= Math.max(n.c, m.c) * 0.42);
      if (g) { g.ds.push(m); if (m.c > g.c) { g.c = m.c; g.y = m.y; } } else nhom.push({ y: m.y, c: m.c, ds: [m] });
    }
    nhom.sort((a, b) => b.y - a.y);
    for (const n of nhom) {
      n.ds.sort((a, b) => a.x - b.x);
      let chu = '', cuoi = null;
      for (const m of n.ds) {
        const khe = cuoi === null ? 0 : m.x - cuoi;
        if (cuoi !== null && khe > m.c * 0.16 && !/\s$/.test(chu) && !/^\s/.test(m.s)) chu += ' ';
        chu += m.s; cuoi = m.x + m.w;
      }
      dong.push(chu.replace(/\s+/g, ' ').trim());
    }
  }
  return dong.join('\n');
}

const LA_RAC = /^(Trang \d+\/\d+|—\s*HẾT\s*—|-+\s*HẾT\s*-+)$/i;

export function phanTichDe(chu) {
  const dong = String(chu).split(/\r?\n/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const kq = { tieu_de: '', thoi_gian_phut: null, cau: [] };
  let phan = null, c = null, oLua = -1, trongDapAn = false;
  const dapAn = {};
  const iHoTen = dong.findIndex(d => /^Họ và tên\s*:/i.test(d));
  if (iHoTen > 0) kq.tieu_de = dong[iHoTen - 1];
  for (const d of dong) {
    const tg = d.match(/Thời gian làm bài\s*:?\s*(\d+)\s*phút/i);
    if (tg && kq.thoi_gian_phut === null) kq.thoi_gian_phut = Number(tg[1]);
    if (LA_RAC.test(d)) continue;
    if (/^(BẢNG\s+)?ĐÁP ÁN\b/.test(d) || (/^Đáp án\s*:/i.test(d))) { trongDapAn = true; }
    if (trongDapAn) {
      for (const m of d.matchAll(/(\d{1,3})\s*[.:\-–)]?\s*([A-H])(?![A-Za-zÀ-ỹ])/g)) dapAn[Number(m[1])] = m[2].charCodeAt(0) - 65;
      continue;
    }
    const mPhan = d.match(/^PHẦN\s+[A-Z0-9]+\s*[.:]\s*(.+)$/i);
    if (mPhan && d === d.toUpperCase().replace(/CÂU/g, 'câu') || (mPhan && /^PHẦN/.test(d))) { phan = d; c = null; continue; }
    const mCau = d.match(/^Câu\s+(\d+)\s*[.:]\s*(.*)$/i);
    if (mCau) {
      c = { so: Number(mCau[1]), phan, noi_dung: mCau[2], lua_chon: [], dung: null };
      kq.cau.push(c); oLua = -1;
      continue;
    }
    if (!c) continue;
    const manh = d.split(/(?:^|\s)(?=[A-H]\.\s)/).filter(Boolean);
    const cuaChon = manh.filter(m => /^[A-H]\.\s/.test(m));
    const mongDoi = String.fromCharCode(65 + c.lua_chon.length);
    if (cuaChon.length && manh[0].startsWith(mongDoi + '.')) {
      for (const m of cuaChon) { c.lua_chon.push(m.replace(/^[A-H]\.\s*/, '').trim()); oLua = c.lua_chon.length - 1; }
      continue;
    }
    if (oLua >= 0) c.lua_chon[oLua] += ' ' + d;
    else c.noi_dung += (c.noi_dung ? ' ' : '') + d;
  }
  kq.cau.forEach(x => { if (dapAn[x.so] !== undefined && dapAn[x.so] < x.lua_chon.length) x.dung = dapAn[x.so]; });
  kq.co_dap_an = Object.keys(dapAn).length > 0;
  return kq;
}
