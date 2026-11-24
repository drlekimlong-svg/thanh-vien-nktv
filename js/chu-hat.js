// Lucian UX/UI Prompt #378 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#378
// Chữ hạt: hạt sáng nằm rải rác rồi bật về ghép thành chữ; rê chuột hoặc chạm thì hạt dạt ra, bấm thì bay sang chữ kế tiếp.
// Dùng cho tên CLB ở dải xanh màn hình Hôm nay. Giảm chuyển động: hạt đứng sẵn đúng vị trí chữ, bấm vẫn đổi chữ.
import { h } from './ui.js';

const PHONG = '"Be Vietnam Pro", system-ui, sans-serif';
const BUOC = 2, CO = 2, R = 36;   // khung nhỏ hơn mẫu (52px so với 320px) nên lưới lấy mẫu, cỡ hạt và vùng đẩy thu theo

export function chuHat(cac, cao = 52) {
  const cv = h('canvas', { class: 'u378-cv' });
  const nut = h('button', { class: 'u378', type: 'button', 'aria-label': cac[0].replace('\n', ' ') + '. Bấm để đổi chữ' }, cv);
  const cx = cv.getContext('2d');
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(2, devicePixelRatio || 1), H = cao;
  let W = 0, wi = 0, ptr = null, P = [], TG = [], sanSang = false, vis = true, raf = 0, last = 0;

  function targets(chu) {
    const o = document.createElement('canvas'); o.width = W; o.height = H;
    const c = o.getContext('2d'), dong = chu.split('\n');
    let size = Math.floor(H / dong.length * 0.8);
    c.font = `700 ${size}px ${PHONG}`;
    const rong = Math.max(...dong.map(d => c.measureText(d).width));
    if (rong > W - 4) { size = Math.floor(size * (W - 4) / rong); c.font = `700 ${size}px ${PHONG}`; }
    c.fillStyle = '#fff'; c.textBaseline = 'middle';
    dong.forEach((d, i) => c.fillText(d, 2, H / dong.length * (i + 0.5) + 1));
    const d = c.getImageData(0, 0, W, H).data, pts = [];
    for (let y = 0; y < H; y += BUOC) for (let x = 0; x < W; x += BUOC) if (d[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
    for (let k = pts.length - 1; k > 0; k--) { const j = (Math.random() * (k + 1)) | 0; [pts[k], pts[j]] = [pts[j], pts[k]]; }
    return pts;
  }
  function assign() {
    const pts = TG[wi];
    P.forEach((p, i) => {
      if (i < pts.length) { p.tx = pts[i][0] + (Math.random() - 0.5) * 0.75; p.ty = pts[i][1] + (Math.random() - 0.5) * 0.75; p.on = true; }
      else { const a = Math.random() * 6.28, r = W * 0.5 + Math.random() * 60; p.tx = W / 2 + Math.cos(a) * r; p.ty = H / 2 + Math.sin(a) * r; p.on = false; }
    });
  }
  function draw() {
    cx.clearRect(0, 0, W, H);
    cx.globalCompositeOperation = 'lighter';
    for (const p of P) {
      const sp = Math.min(1, Math.hypot(p.vx, p.vy) / 300);   // đứng yên: trắng; bay nhanh: ánh xanh mạ
      cx.fillStyle = `rgba(${Math.round(255 - sp * 96)},255,${Math.round(255 - sp * 64)},${p.on ? 0.9 : 0.18})`;
      cx.fillRect(p.x - CO / 2, p.y - CO / 2, CO, CO);
    }
    cx.globalCompositeOperation = 'source-over';
  }
  function frame(now) {
    raf = 0;
    if (!nut.isConnected || !vis) return;
    const dt = Math.min(0.033, Math.max(0, (now - last) / 1000)); last = now;
    let conDong = !!ptr;
    for (const p of P) {
      let ax = (p.tx - p.x) * 38 - p.vx * 7.5, ay = (p.ty - p.y) * 38 - p.vy * 7.5;
      if (ptr) { const dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy; if (d2 < R * R) { const f = (1 - d2 / (R * R)) * 9000 / (Math.sqrt(d2) + 6); ax += dx * f / 40; ay += dy * f / 40; } }
      p.vx += ax * dt; p.vy += ay * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (Math.abs(p.vx) + Math.abs(p.vy) > 2 || Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y) > 0.3) conDong = true;
    }
    draw();
    // Hạt đã đứng yên thì dừng vòng vẽ cho đỡ tốn pin; rê chuột hoặc bấm sẽ chạy lại.
    if (conDong) raf = requestAnimationFrame(frame);
  }
  function run() {
    if (rm) { P.forEach(p => { p.x = p.tx; p.y = p.ty; }); draw(); return; }
    if (!raf && vis) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function dungLai() {
    const w = Math.round(cv.clientWidth);
    if (!sanSang || !w || w === W) return;
    W = w; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    TG = cac.map(targets);
    const n = Math.max(...TG.map(t => t.length));
    while (P.length < n) P.push({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, tx: W / 2, ty: H / 2, on: true });
    assign(); run();
  }
  // Chờ phông Be Vietnam Pro trước khi lấy mẫu chữ, để dấu tiếng Việt đúng nét.
  document.fonts.load(`700 20px ${PHONG}`, 'ĐƯỢ').catch(() => {}).finally(() => { sanSang = true; dungLai(); });
  new ResizeObserver(dungLai).observe(cv);
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { vis = es[0].isIntersecting; run(); }).observe(nut);
  const loc = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  cv.addEventListener('pointermove', e => { ptr = loc(e); run(); });
  cv.addEventListener('pointerleave', () => { ptr = null; });
  nut.addEventListener('click', () => {
    if (!TG.length) return;
    wi = (wi + 1) % cac.length; assign();
    nut.setAttribute('aria-label', cac[wi].replace('\n', ' ') + '. Bấm để đổi chữ');
    P.forEach(p => { p.vx += (Math.random() - 0.5) * 260; p.vy += (Math.random() - 0.5) * 260; });
    run();
  });
  return nut;
}
