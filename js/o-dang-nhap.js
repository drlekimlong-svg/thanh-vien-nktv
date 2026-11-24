// Lucian UX/UI Prompt #403 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#403
// Ô nhập ở giao diện đăng nhập: nhãn nổi lên khi bấm vào, mắt nhắm mở để hiện mật khẩu,
// sai thì ô rung và gạch đỏ chạy ngang, đúng thì nút co lại thành vòng tròn có dấu tích.
import { h } from './ui.js';

let dem = 0;
const MAT = '<svg viewBox="0 0 20 20" aria-hidden="true"><g class="lid"><path d="M2 10s3-5.2 8-5.2S18 10 18 10s-3 5.2-8 5.2S2 10 2 10z"/><circle cx="10" cy="10" r="2.4"/></g><g class="lash"><path d="M3 10.4c2 2.4 4.4 3.4 7 3.4s5-1 7-3.4M6 13l-1 1.6M10 14v1.8M14 13l1 1.6"/></g></svg>';

/** Một ô nhập có nhãn nổi. matKhau = true thì có nút mắt. */
export function oNoi(nhan, tt, matKhau = false) {
  const id = 'u403-o' + (++dem);
  const inp = h('input', Object.assign({ class: 'u403-in', id }, tt));
  const f = h('div', { class: 'u403-f' + (matKhau ? ' u403-pw' : '') }, inp, h('label', { for: id }, nhan));
  const sync = () => f.classList.toggle('is-up', f.classList.contains('is-f') || !!inp.value);
  inp.addEventListener('focus', () => { f.classList.add('is-f'); sync(); });
  inp.addEventListener('blur', () => { f.classList.remove('is-f'); sync(); });
  inp.addEventListener('input', () => { if (f.classList.contains('is-err')) boLoi(f); sync(); });
  if (matKhau) {
    const mat = h('button', { class: 'u403-eye', type: 'button', 'aria-label': 'Hiện mật khẩu', 'aria-pressed': 'false' });
    mat.innerHTML = MAT;
    mat.addEventListener('click', () => {
      const hien = mat.getAttribute('aria-pressed') !== 'true';
      mat.setAttribute('aria-pressed', String(hien)); mat.setAttribute('aria-label', hien ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
      inp.type = hien ? 'text' : 'password';
    });
    f.append(mat);
  }
  return f;
}

/** Dòng báo lỗi dưới các ô. */
export const dongLoi = (chu = '') => { const p = h('p', { class: 'u403-msg' + (chu ? ' is-on' : ''), id: 'u403-m' + (++dem), 'aria-live': 'polite' }, chu); return p; };

/** Báo sai: ô f (có thể null) rung, gạch đỏ chạy ngang, con trỏ về ô đó. */
export function baoLoi(f, msg, chu) {
  msg.textContent = chu; msg.classList.add('is-on');
  if (!f) return;
  const i = f.querySelector('input');
  f.classList.remove('is-shake'); void f.offsetWidth; f.classList.add('is-err', 'is-shake');
  i.setAttribute('aria-invalid', 'true'); i.setAttribute('aria-describedby', msg.id);
  i.focus({ preventScroll: true });
}
function boLoi(f) {
  const i = f.querySelector('input'), m = document.getElementById(i.getAttribute('aria-describedby') || '');
  f.classList.remove('is-err'); i.removeAttribute('aria-invalid');
  if (m) m.classList.remove('is-on');
}

/** Nút gửi: chữ → vòng quay khi đang kiểm → dấu tích khi đúng. */
export function nutGo(chu, tt) {
  const b = h('button', Object.assign({ class: 'u403-go', type: 'submit' }, tt), h('span', null, chu), h('i', { 'aria-hidden': 'true' }));
  b.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 22 22" aria-hidden="true"><path d="M5.5 11.5l4 4L17 7.5"/></svg>');
  return b;
}
export const dangKiem = (b, bat) => { b.classList.toggle('is-busy', bat); if (bat) b.setAttribute('aria-busy', 'true'); else b.removeAttribute('aria-busy'); };
