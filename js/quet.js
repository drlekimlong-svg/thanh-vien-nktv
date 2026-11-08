// Máy quét mã QR: camera, đọc mã, hàng chờ khi mất mạng. Phần đọc khung hình kế thừa app điểm danh bản 0.2.
import { khiRoi } from './state.js';

let daNapJsQR = null;
const napJsQR = () => {
  if (window.jsQR) return Promise.resolve();
  daNapJsQR = daNapJsQR || new Promise((rs, rj) => {
    const s = document.createElement('script');
    s.src = 'lib/jsQR.js'; s.onload = rs; s.onerror = () => rj(new Error('Chưa tải được bộ đọc mã QR. Tải lại trang.'));
    document.head.append(s);
  });
  return daNapJsQR;
};

const cv = document.createElement('canvas');
function docKhung(nguon, w, h, toiDa) {
  if (!window.jsQR || !w || !h) return '';
  const k = Math.min(1, toiDa / Math.max(w, h));
  cv.width = Math.round(w * k); cv.height = Math.round(h * k);
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.drawImage(nguon, 0, 0, cv.width, cv.height);
  const d = c.getImageData(0, 0, cv.width, cv.height);
  const r = window.jsQR(d.data, d.width, d.height, { inversionAttempts: 'dontInvert' });
  return r ? r.data : '';
}

export async function docAnh(tep) {
  await napJsQR();
  return new Promise((rs) => {
    const img = new Image();
    img.onload = () => { const c = docKhung(img, img.naturalWidth, img.naturalHeight, 1400); URL.revokeObjectURL(img.src); rs(c); };
    img.onerror = () => rs('');
    img.src = URL.createObjectURL(tep);
  });
}

/** Bật camera và gọi khiCoMa(chuoi) mỗi khi đọc được mã. Trả về hàm tắt. */
export async function batMayQuet(video, khiCoMa) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Trình duyệt này không mở được camera. Mở trang bằng Chrome hoặc Safari (không mở trong Zalo, Messenger). Vẫn có thể dùng “Chụp ảnh mã” hoặc điểm danh tay.');
  }
  let stream, hen = 0, khoa = null, detector = null, tat = false;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
  } catch (e) {
    throw new Error(e && e.name === 'NotAllowedError' ? 'Chưa được cấp quyền camera. Cho phép camera trong cài đặt trang của trình duyệt rồi bấm lại.' : 'Không mở được camera' + (e && e.message ? ': ' + e.message : '') + '.');
  }
  video.srcObject = stream; video.setAttribute('playsinline', ''); video.muted = true;
  try { await video.play(); } catch (_) {}
  if ('BarcodeDetector' in window) {
    try { const f = await window.BarcodeDetector.getSupportedFormats(); if (f.includes('qr_code')) detector = new window.BarcodeDetector({ formats: ['qr_code'] }); } catch (_) {}
  }
  if (!detector) await napJsQR();
  try { if (navigator.wakeLock) khoa = await navigator.wakeLock.request('screen'); } catch (_) {}
  const vong = async () => {
    if (tat) return;
    if (video.readyState >= 2 && video.videoWidth) {
      let chu = '';
      if (detector) { try { const r = await detector.detect(video); if (r.length) chu = r[0].rawValue; } catch (_) { detector = null; await napJsQR(); } }
      else chu = docKhung(video, video.videoWidth, video.videoHeight, 800);
      if (chu) khiCoMa(chu);
    }
    if (!tat) hen = setTimeout(vong, 120);
  };
  hen = setTimeout(vong, 150);
  const tatMay = () => {
    tat = true; clearTimeout(hen);
    stream.getTracks().forEach(t => t.stop());
    if (khoa) { try { khoa.release(); } catch (_) {} }
    video.srcObject = null;
  };
  khiRoi(tatMay);
  return tatMay;
}

/* ---------- Tiếng, giọng nói và hàng chờ ---------- */
let actx = null;
/** Gọi ngay trong lần bấm “Bật máy quét”: iPhone chỉ cho phát tiếng và giọng nói sau một thao tác của người dùng. */
export const moAmThanh = () => {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume();
    const s = actx.createBufferSource(); s.buffer = actx.createBuffer(1, 1, 22050); s.connect(actx.destination); s.start(0);
  } catch (_) {}
  try { if (window.speechSynthesis) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch (_) {}
};
// Hai nốt cho mỗi loại: đi lên là được, đi xuống là lỗi. Đủ to để nghe giữa phòng ồn.
const NOT = { ok: [784, 1175], tre: [784, 988], roi: [659, 659], loi: [330, 233] };
const RUNG = { ok: 70, tre: [70, 60, 70], roi: 40, loi: [120, 80, 120] };
export function kieu(loai) {
  try { if (navigator.vibrate && RUNG[loai]) navigator.vibrate(RUNG[loai]); } catch (_) {}
  if (!actx || !NOT[loai]) return;
  try {
    NOT[loai].forEach((tan, i) => {
      const o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime + i * 0.13;
      o.type = loai === 'loi' ? 'square' : 'sine'; o.frequency.value = tan;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(loai === 'loi' ? 0.12 : 0.3, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + 0.17);
    });
  } catch (_) {}
}

const KHOA_GIONG = 'nktv-giong-noi';
let giong = null;
const layGiong = () => {
  if (!window.speechSynthesis) return null;
  if (!giong) giong = speechSynthesis.getVoices().find(v => /^vi/i.test(v.lang)) || null;
  return giong;
};
try { if (window.speechSynthesis) { speechSynthesis.getVoices(); speechSynthesis.addEventListener('voiceschanged', () => { giong = null; layGiong(); }); } } catch (_) {}
export const coGiongViet = () => !!layGiong();
export const batGiong = () => { try { return localStorage.getItem(KHOA_GIONG) !== '0'; } catch (_) { return true; } };
export const datGiong = (bat) => { try { localStorage.setItem(KHOA_GIONG, bat ? '1' : '0'); } catch (_) {} };
/** Đọc to câu ngắn bằng giọng tiếng Việt của máy. Máy không có giọng tiếng Việt thì chỉ còn tiếng bíp. */
export function noi(chu) {
  const v = layGiong();
  if (!chu || !v || !batGiong()) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(chu); u.voice = v; u.lang = v.lang; u.rate = 1.1; speechSynthesis.speak(u); } catch (_) {}
}

const KHOA_CHO = 'nktv-hang-cho-v1';
export const hangCho = {
  doc() { try { return JSON.parse(localStorage.getItem(KHOA_CHO)) || []; } catch (_) { return []; } },
  ghi(ds) { try { localStorage.setItem(KHOA_CHO, JSON.stringify(ds)); } catch (_) {} },
  them(l) { const d = this.doc(); d.push(l); this.ghi(d); },
  async day(db) {
    let d = this.doc(), xong = 0;
    while (d.length) {
      try { await db.ghiDiemDanh(d[0]); } catch (e) { if (/mạng|máy chủ đang/i.test(e.message)) break; }
      d.shift(); this.ghi(d); xong++;
    }
    return xong;
  }
};
