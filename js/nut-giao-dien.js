// Lucian UX/UI Prompt #219 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#219
// Nút sáng/tối: giao diện mới lan ra theo hình tròn từ chính nút (View Transitions API), mặt trời quay sang mặt trăng.
// Lựa chọn lưu trên máy; chưa chọn thì theo cài đặt sáng/tối của điện thoại như trước.
// Trình duyệt chưa có View Transitions, hoặc bật giảm chuyển động: đổi ngay, không có vòng tròn.
import { h } from './ui.js';

const KHOA = 'nktv-giao-dien';
const goc = document.documentElement;
const heToi = matchMedia('(prefers-color-scheme: dark)');
const dangToi = () => goc.dataset.theme ? goc.dataset.theme === 'dark' : heToi.matches;

const SUN = '<svg class="u219-sun" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3" fill="currentColor"/><g stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 1.5v1.4M8 13.1v1.4M1.5 8h1.4M13.1 8h1.4M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1"/></g></svg>';
const MOON = '<svg class="u219-moon" viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 9.8A5.6 5.6 0 0 1 6.2 2.5a5.6 5.6 0 1 0 7.3 7.3z" fill="currentColor"/></svg>';

function nhan(b) {
  const toi = dangToi();
  b.classList.toggle('is-dark', toi);
  b.setAttribute('aria-label', toi ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối');
  b.setAttribute('aria-pressed', String(toi));
}
function capNhat() {
  const toi = dangToi();
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.content = toi ? '#12171C' : '#F5F6F4'; });
  document.querySelectorAll('.u219-tg').forEach(nhan);
}
heToi.addEventListener('change', capNhat);

/** Áp lựa chọn đã lưu khi vào app (thay cho việc luôn theo điện thoại). */
export function apGiaoDienDaLuu() {
  let t = null;
  try { t = localStorage.getItem(KHOA); } catch (_) {}
  if (t === 'light' || t === 'dark') goc.dataset.theme = t; else delete goc.dataset.theme;
  capNhat();
}

export function nutGiaoDien(lop = '') {
  const b = h('button', { class: 'u219-tg ' + lop, type: 'button' });
  b.innerHTML = SUN + MOON;
  b.addEventListener('click', () => {
    const moi = dangToi() ? 'light' : 'dark';
    const doi = () => { goc.dataset.theme = moi; try { localStorage.setItem(KHOA, moi); } catch (_) {} capNhat(); };
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) { doi(); return; }
    const r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const ban = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    goc.classList.add('u219-dang');
    const vt = document.startViewTransition(doi);
    vt.ready.then(() => goc.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${ban}px at ${x}px ${y}px)`] },
      { duration: 700, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' }
    )).catch(() => {});
    vt.finished.finally(() => goc.classList.remove('u219-dang'));
  });
  nhan(b);
  return b;
}
