// Trạng thái dùng chung: nguồn dữ liệu (Supabase thật hoặc bản chạy thử) và người đang đăng nhập.
export const S = { db: null, toi: null, caiDat: {}, demo: false, huy: [], lech: 0 };

/** Việc cần dọn khi rời màn hình: tắt camera, dừng đồng hồ. */
export const khiRoi = (fn) => S.huy.push(fn);
export const donDep = () => { S.huy.splice(0).forEach(f => { try { f(); } catch (e) { console.error(e); } }); };
