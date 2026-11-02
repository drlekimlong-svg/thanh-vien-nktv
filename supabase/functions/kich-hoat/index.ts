// Kích hoạt tài khoản: thành viên gửi mã thành viên, mã kích hoạt và mật khẩu tự đặt.
// Cũng dùng khi quên mật khẩu: quản trị cấp mã mới, chạy lại đúng các bước này.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const tra = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return tra({ ok: false, loi: "Sai phương thức" }, 405);

  let body: { ma?: string; ma_kich_hoat?: string; mat_khau?: string; mien?: string };
  try { body = await req.json(); } catch { return tra({ ok: false, loi: "Dữ liệu không hợp lệ" }, 400); }
  const ma = String(body.ma ?? "").trim().toUpperCase();
  const code = String(body.ma_kich_hoat ?? "").trim().toUpperCase();
  const matKhau = String(body.mat_khau ?? "");
  if (!ma || !code) return tra({ ok: false, loi: "Cần nhập đủ mã thành viên và mã kích hoạt." }, 400);
  if (matKhau.length < 8) return tra({ ok: false, loi: "Mật khẩu cần ít nhất 8 ký tự." }, 400);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: kt, error: e1 } = await sb.rpc("kiem_tra_kich_hoat", { p_ma: ma, p_code: code });
  if (e1) { console.error(e1); return tra({ ok: false, loi: "Máy chủ đang lỗi. Thử lại sau." }, 500); }
  if (!kt.ok) return tra({ ok: false, loi: kt.loi }, 400);

  let userId: string = kt.user_id;
  if (userId) {
    const { error } = await sb.auth.admin.updateUserById(userId, { password: matKhau });
    if (error) { console.error(error); return tra({ ok: false, loi: "Không đặt được mật khẩu. Thử mật khẩu khác." }, 400); }
  } else {
    // Tài khoản không có hộp thư thật; địa chỉ này chỉ là tên đăng nhập, không thư nào được gửi tới.
    const email = `${ma.toLowerCase()}@${Deno.env.get("MIEN_TAI_KHOAN") ?? "drlekimlong-svg.github.io"}`;
    const { data, error } = await sb.auth.admin.createUser({ email, password: matKhau, email_confirm: true });
    if (error || !data.user) { console.error(error); return tra({ ok: false, loi: "Không tạo được tài khoản. Báo lại cho quản trị." }, 500); }
    userId = data.user.id;
  }

  const { error: e2 } = await sb.rpc("hoan_tat_kich_hoat", { p_id: kt.id, p_user: userId });
  if (e2) { console.error(e2); return tra({ ok: false, loi: "Máy chủ đang lỗi. Thử lại sau." }, 500); }
  return tra({ ok: true });
});
