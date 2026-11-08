// Mã điểm danh động: mã trên app đổi sau mỗi 20 giây, ký bằng khóa riêng của từng người (HMAC-SHA256).
// Máy chủ kiểm lại chữ ký và giờ quét (hàm ghi_diem_danh), nên ảnh chụp mã chỉ dùng được trong khoảng một phút.
export const BUOC = 20;
const hex = (buf) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

/** Mã của khung 20 giây chứa thời điểm gioMs (giờ đã chỉnh theo máy chủ). */
export async function taoMa(ma, biMat, gioMs) {
  const w = Math.floor(gioMs / 1000 / BUOC);
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(biMat), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const ky = hex(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(`${ma}.${w}`))).slice(0, 12).toUpperCase();
  return { chu: `NKTV1.${ma}.${w}.${ky}`, w };
}

/** Đọc chuỗi trong mã QR: mã động trên app, hoặc mã cố định trên thẻ in. */
export function docMa(chu) {
  const s = String(chu || '').trim();
  const m = s.match(/^NKTV1\.(NKTV-\d+)\.(\d{1,12})\.([0-9A-F]{12})$/i);
  if (m) return { loai: 'dong', chu: s, ma: m[1].toUpperCase(), w: Number(m[2]) };
  const k = s.match(/[?&]the=([0-9a-zA-Z_-]+)/);
  if (k) return { loai: 'tinh', khoa: k[1] };
  return /^[0-9a-f]{16}$/i.test(s) ? { loai: 'tinh', khoa: s } : null;
}

/** Cùng ngưỡng với máy chủ: từ 30 giây trước tới 60 giây sau khung của mã. */
export const conHan = (w, gioMs) => { const lech = gioMs / 1000 - w * BUOC; return lech >= -30 && lech <= 60; };
