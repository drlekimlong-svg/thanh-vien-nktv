// Gửi thư cho học viên (phần D). Ba việc:
//   { viec: 'kiem' }                                           quản trị xem đã nối dịch vụ chưa
//   { viec: 'thu', email }                                     quản trị gửi một thư thử
//   { viec: 'ma_kich_hoat', dot_id, ds: [{ id, ma_kich_hoat }] } Ban tổ chức gửi mã cho học viên
//
// Hai điều quan trọng về an toàn:
//   * Địa chỉ nhận KHÔNG lấy từ trình duyệt. Trình duyệt chỉ gửi lên id học viên và mã vừa cấp;
//     hàm này tra địa chỉ trong cơ sở dữ liệu. Thư vì vậy chỉ đi tới đúng địa chỉ đã lưu.
//   * Mã kích hoạt bản rõ không lưu ở đâu cả — gửi xong là quên. Nhật ký chỉ ghi được hay lỗi.
//
// Khóa API nằm ở secret của dự án Supabase, không nằm trong kho mã nguồn:
//   Mailjet: MAILJET_API_KEY + MAILJET_SECRET_KEY  (đủ cả hai thì dùng Mailjet)
//   Brevo:   BREVO_API_KEY                         (dự phòng)
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const tra = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const MOI_LAN = 60;        // mỗi lượt gọi nhận tối đa chừng này người
const CUNG_LUC = 4;        // số thư gửi song song
const MAILJET = "https://api.mailjet.com/v3.1/send";
const BREVO = "https://api.brevo.com/v3/smtp/email";

type Nguoi = { id: string; ma: string; ho_ten: string; email: string };
type KetQua = { id: string | null; email: string; ok: boolean; loi?: string; loai?: string };
type Zalo = { link: string | null; qr: string | null };
type DinhKem = { ten: string; loai: string; noiDung: string };
type DichVu = { ten: "mailjet" | "brevo"; dau: string };

/** Dịch vụ nào đang nối: đủ cặp khóa Mailjet thì dùng Mailjet, không thì Brevo, không nữa là chưa nối. */
function chonDichVu(): DichVu | null {
  const k = (Deno.env.get("MAILJET_API_KEY") ?? "").trim();
  const s = (Deno.env.get("MAILJET_SECRET_KEY") ?? "").trim();
  if (k && s) return { ten: "mailjet", dau: "Basic " + btoa(`${k}:${s}`) };
  const b = (Deno.env.get("BREVO_API_KEY") ?? "").trim();
  if (b) return { ten: "brevo", dau: b };
  return null;
}

/** Tách data URL "data:image/png;base64,AAA" thành tệp đính kèm. Không phải data URL thì bỏ. */
function dinhKemTuAnh(ten: string, data: string | null): DinhKem | null {
  if (!data) return null;
  const m = /^data:image\/([a-z0-9.+-]+);base64,(.+)$/i.exec(data.trim());
  if (!m) return null;
  const loai = m[1].toLowerCase();
  const duoi = loai === "jpeg" ? "jpg" : loai;
  return { ten: `${ten}.${duoi}`, loai: `image/${loai}`, noiDung: m[2] };
}

const thoat = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ---------- Nội dung thư ---------- */

function thuMaKichHoat(n: Nguoi, ma_kich_hoat: string, tenDot: string, appUrl: string, zalo: Zalo) {
  const tieuDe = `Mã kích hoạt app · ${tenDot}`;
  const dongZalo = zalo.link
    ? [``, `Nhóm Zalo của lớp: ${zalo.link}`, zalo.qr ? `(mã QR của nhóm đính kèm thư này)` : ``].filter(Boolean)
    : [];
  const chu = [
    `Chào ${n.ho_ten},`,
    ``,
    `Bạn đã có tài khoản trên app của CLB Ngoại Khoa Trưng Vương để theo dõi lớp "${tenDot}".`,
    ``,
    `Mã học viên: ${n.ma}`,
    `Mã kích hoạt: ${ma_kich_hoat}`,
    ``,
    `Cách dùng:`,
    `1. Mở ${appUrl}`,
    `2. Chọn "Học viên tập huấn", rồi chọn "Kích hoạt bằng mã"`,
    `3. Điền hai mã ở trên, rồi tự đặt mật khẩu từ 8 ký tự`,
    ...dongZalo,
    ``,
    `Mã kích hoạt dùng một lần và hết hạn sau 90 ngày. Mật khẩu do bạn tự đặt, không ai tra lại được;`,
    `quên thì xin Ban tổ chức cấp mã mới.`,
    ``,
    `Thư này gửi tự động, bạn không cần trả lời.`,
    `CLB Ngoại Khoa Trưng Vương`,
  ].join("\n");

  const html = `<div style="font:16px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1b2a22;max-width:520px">
<p>Chào <b>${thoat(n.ho_ten)}</b>,</p>
<p>Bạn đã có tài khoản trên app của CLB Ngoại Khoa Trưng Vương để theo dõi lớp <b>${thoat(tenDot)}</b>.</p>
<table style="border-collapse:collapse;margin:18px 0"><tbody>
<tr><td style="padding:6px 16px 6px 0;color:#5a6b61">Mã học viên</td><td style="padding:6px 0;font:600 17px ui-monospace,Menlo,Consolas,monospace;letter-spacing:.04em">${thoat(n.ma)}</td></tr>
<tr><td style="padding:6px 16px 6px 0;color:#5a6b61">Mã kích hoạt</td><td style="padding:6px 0;font:600 17px ui-monospace,Menlo,Consolas,monospace;letter-spacing:.04em">${thoat(ma_kich_hoat)}</td></tr>
</tbody></table>
<ol style="padding-left:20px">
<li>Mở <a href="${thoat(appUrl)}" style="color:#1f6b45">${thoat(appUrl)}</a></li>
<li>Chọn <b>Học viên tập huấn</b>, rồi chọn <b>Kích hoạt bằng mã</b></li>
<li>Điền hai mã ở trên, rồi tự đặt mật khẩu từ 8 ký tự</li>
</ol>
${zalo.link ? `<p><b>Nhóm Zalo của lớp:</b> <a href="${thoat(zalo.link)}" style="color:#1f6b45">${thoat(zalo.link)}</a>${zalo.qr ? '<br><span style="color:#5a6b61;font-size:14px">Mã QR của nhóm đính kèm thư này.</span>' : ''}</p>` : ""}
<p style="color:#5a6b61;font-size:14px">Mã kích hoạt dùng một lần và hết hạn sau 90 ngày. Mật khẩu do bạn tự đặt, không ai tra lại được; quên thì xin Ban tổ chức cấp mã mới.</p>
<p style="color:#5a6b61;font-size:14px">Thư này gửi tự động, bạn không cần trả lời.<br>CLB Ngoại Khoa Trưng Vương</p>
</div>`;
  return { tieuDe, chu, html };
}

function thuThu(appUrl: string) {
  const tieuDe = "Thư thử · app CLB Ngoại Khoa Trưng Vương";
  const chu = [
    "Đây là thư thử của app CLB Ngoại Khoa Trưng Vương.",
    "",
    "Nhận được thư này nghĩa là đã nối xong dịch vụ gửi thư: địa chỉ người gửi hợp lệ và khóa API chạy được.",
    "",
    `App: ${appUrl}`,
  ].join("\n");
  const html = `<div style="font:16px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1b2a22;max-width:520px">
<p>Đây là <b>thư thử</b> của app CLB Ngoại Khoa Trưng Vương.</p>
<p>Nhận được thư này nghĩa là đã nối xong dịch vụ gửi thư: địa chỉ người gửi hợp lệ và khóa API chạy được.</p>
<p style="color:#5a6b61;font-size:14px">App: <a href="${thoat(appUrl)}" style="color:#1f6b45">${thoat(appUrl)}</a></p>
</div>`;
  return { tieuDe, chu, html };
}

/* ---------- Gửi một thư ---------- */

async function guiMot(
  dv: DichVu,
  nguoiGui: { name: string; email: string },
  traLoi: string,
  den: { email: string; name?: string },
  thu: { tieuDe: string; chu: string; html: string },
  dinhKem?: DinhKem | null,
): Promise<{ ok: boolean; loi?: string }> {
  // Ảnh gửi kèm chứ không nhúng thẳng vào thân thư: phần lớn hộp thư chặn ảnh data: URL.
  const mailjet = dv.ten === "mailjet";
  const dia = mailjet ? MAILJET : BREVO;
  const dau: Record<string, string> = mailjet
    ? { authorization: dv.dau, "content-type": "application/json" }
    : { "api-key": dv.dau, "content-type": "application/json", accept: "application/json" };

  let than: Record<string, unknown>;
  if (mailjet) {
    const m: Record<string, unknown> = {
      From: { Email: nguoiGui.email, Name: nguoiGui.name },
      To: [den.name ? { Email: den.email, Name: den.name } : { Email: den.email }],
      Subject: thu.tieuDe,
      TextPart: thu.chu,
      HTMLPart: thu.html,
    };
    if (traLoi) m.ReplyTo = { Email: traLoi };
    if (dinhKem) m.Attachments = [{ ContentType: dinhKem.loai, Filename: dinhKem.ten, Base64Content: dinhKem.noiDung }];
    than = { Messages: [m] };
  } else {
    than = { sender: nguoiGui, to: [den], subject: thu.tieuDe, textContent: thu.chu, htmlContent: thu.html };
    if (traLoi) than.replyTo = { email: traLoi };
    if (dinhKem) than.attachment = [{ name: dinhKem.ten, content: dinhKem.noiDung }];
  }

  try {
    const r = await fetch(dia, { method: "POST", headers: dau, body: JSON.stringify(than) });
    const t = (await r.text()).slice(0, 2000);
    // deno-lint-ignore no-explicit-any
    let j: any = null;
    try { j = JSON.parse(t); } catch (_) { /* không phải JSON thì đọc thẳng chữ */ }

    if (mailjet) {
      // Mailjet trả 200 cả khi một thư trong lô hỏng, nên phải đọc Status của từng thư.
      const m0 = j?.Messages?.[0];
      if (r.ok && m0?.Status === "success") return { ok: true };
      const tu = (m0?.Errors ?? [])
        // deno-lint-ignore no-explicit-any
        .map((e: any) => String(e?.ErrorMessage ?? e?.ErrorCode ?? "")).filter(Boolean).join("; ");
      const loi = tu || String(j?.ErrorMessage ?? "") || t.slice(0, 300);
      return { ok: false, loi: `${r.status} · ${loi}`.slice(0, 300) };
    }

    if (r.ok) return { ok: true };
    const loi = String(j?.message ?? j?.code ?? "") || t.slice(0, 300);
    return { ok: false, loi: `${r.status} · ${loi}`.slice(0, 300) };
  } catch (e) {
    return { ok: false, loi: String((e as Error)?.message ?? e).slice(0, 200) };
  }
}

// Gửi cả danh sách, mỗi lúc vài thư một, giữ nguyên thứ tự kết quả.
async function guiNhieu<T>(ds: T[], lam: (x: T) => Promise<KetQua>): Promise<KetQua[]> {
  const ra: KetQua[] = new Array(ds.length);
  let i = 0;
  const chay = async () => {
    while (true) {
      const k = i++;
      if (k >= ds.length) return;
      ra[k] = await lam(ds[k]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CUNG_LUC, ds.length) }, chay));
  return ra;
}

/* ---------- Thân hàm ---------- */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return tra({ ok: false, loi: "Sai phương thức" }, 405);

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.toLowerCase().startsWith("bearer ")) return tra({ ok: false, loi: "Chưa đăng nhập." }, 401);

  let body: { viec?: string; dot_id?: string; email?: string; ds?: { id: string; ma_kich_hoat: string }[] };
  try { body = await req.json(); } catch { return tra({ ok: false, loi: "Dữ liệu không hợp lệ" }, 400); }
  const viec = String(body.viec ?? "");
  if (!["kiem", "thu", "ma_kich_hoat"].includes(viec)) return tra({ ok: false, loi: "Không rõ việc cần làm" }, 400);

  const url = Deno.env.get("SUPABASE_URL")!;
  // Khóa công khai: lấy từ biến môi trường, không có thì dùng chính khóa trình duyệt đã gửi lên.
  const khoaCongKhai = Deno.env.get("SUPABASE_ANON_KEY") ?? req.headers.get("apikey") ?? "";
  const nguoiDung = createClient(url, khoaCongKhai, {
    global: { headers: { Authorization: auth } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const quanTri = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Ai đang bấm, và có được gửi thư của đợt này không.
  const dotId = viec === "ma_kich_hoat" ? String(body.dot_id ?? "") : null;
  if (viec === "ma_kich_hoat" && !dotId) return tra({ ok: false, loi: "Thiếu đợt" }, 400);
  const { data: quyen, error: eQ } = await nguoiDung.rpc("kiem_quyen_gui_thu", { p_dot: dotId });
  if (eQ) { console.error(eQ); return tra({ ok: false, loi: "Máy chủ đang lỗi. Thử lại sau." }, 500); }
  if (!quyen || !quyen.toi) return tra({ ok: false, loi: "Chưa đăng nhập." }, 401);
  if (!quyen.duoc_gui) {
    return tra({ ok: false, loi: dotId ? "Chỉ trưởng ban, thư ký của đợt và quản trị được gửi thư." : "Chỉ quản trị làm được việc này." }, 403);
  }

  // Dịch vụ gửi thư và cài đặt người gửi.
  const dv = chonDichVu();
  const { data: cd } = await quanTri.from("cai_dat").select("gia_tri").eq("khoa", "thu").maybeSingle();
  const c = (cd?.gia_tri ?? {}) as Record<string, unknown>;
  const nguoiGui = {
    name: String(c.ten_nguoi_gui ?? "CLB Ngoại Khoa Trưng Vương"),
    email: String(c.dia_chi_gui ?? "").trim(),
  };
  const traLoi = String(c.tra_loi_toi ?? "").trim();
  const appUrl = String(c.app_url ?? "https://drlekimlong-svg.github.io/thanh-vien-nktv/");

  if (viec === "kiem") {
    return tra({
      ok: true,
      co_khoa: !!dv,
      dich_vu: dv?.ten ?? "",
      co_dia_chi: !!nguoiGui.email,
      bat: c.bat === true,
      ten_nguoi_gui: nguoiGui.name,
      dia_chi_gui: nguoiGui.email,
      tra_loi_toi: traLoi,
      app_url: appUrl,
    });
  }

  if (!dv) return tra({ ok: false, loi: "Chưa nối dịch vụ gửi thư. Quản trị cần đặt MAILJET_API_KEY và MAILJET_SECRET_KEY cho dự án." }, 503);
  if (!nguoiGui.email) return tra({ ok: false, loi: "Chưa có địa chỉ người gửi. Vào Quản lý › Gửi thư để điền." }, 400);

  /* ----- Thư thử ----- */
  if (viec === "thu") {
    const den = String(body.email ?? "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(den)) return tra({ ok: false, loi: "Địa chỉ nhận không hợp lệ." }, 400);
    const r = await guiMot(dv, nguoiGui, traLoi, { email: den }, thuThu(appUrl));
    await quanTri.rpc("ghi_thu_da_gui", {
      p_dot: null, p_nguoi: quyen.toi,
      p: [{ id: null, email: den, ok: r.ok, loi: r.loi ?? "", loai: "thu_thu" }],
    });
    return tra(r.ok ? { ok: true } : { ok: false, loi: r.loi }, r.ok ? 200 : 502);
  }

  /* ----- Gửi mã kích hoạt ----- */
  if (c.bat !== true) return tra({ ok: false, loi: "Gửi thư đang tắt. Quản trị bật ở Quản lý › Gửi thư." }, 400);

  const xin = (body.ds ?? []).filter((x) => x && x.id && x.ma_kich_hoat);
  if (!xin.length) return tra({ ok: false, loi: "Không có ai để gửi." }, 400);
  if (xin.length > MOI_LAN) return tra({ ok: false, loi: `Mỗi lượt gửi tối đa ${MOI_LAN} người.` }, 400);

  // Địa chỉ nhận lấy từ cơ sở dữ liệu, không lấy từ trình duyệt.
  const { data: ds, error: eN } = await quanTri.rpc("nguoi_nhan_thu", { p_dot: dotId, p_ids: xin.map((x) => x.id) });
  if (eN) { console.error(eN); return tra({ ok: false, loi: "Máy chủ đang lỗi. Thử lại sau." }, 500); }
  const theoId = new Map<string, Nguoi>(((ds ?? []) as Nguoi[]).map((n) => [n.id, n]));
  const tenDot = String(quyen.ten_dot ?? "Lớp tập huấn");

  // Nhóm Zalo của đợt: thư ký dán link và ảnh QR vào app trước khi nạp danh sách.
  const { data: dotRow } = await quanTri.from("dot").select("zalo_link, zalo_qr").eq("id", dotId).maybeSingle();
  const zalo: Zalo = { link: dotRow?.zalo_link ?? null, qr: dotRow?.zalo_qr ?? null };
  const qrDinhKem = zalo.link ? dinhKemTuAnh("nhom-zalo", zalo.qr) : null;

  const ketQua = await guiNhieu(xin, async (x): Promise<KetQua> => {
    const n = theoId.get(x.id);
    if (!n) return { id: x.id, email: "", ok: false, loi: "Không có tên trong đợt này" };
    if (!n.email) return { id: n.id, email: "", ok: false, loi: "Chưa có email" };
    // Tài khoản diễn tập: không gửi thật, để khỏi tốn hạn mức và khỏi bị trả thư.
    if (/@dientap\.test$/i.test(n.email)) return { id: n.id, email: n.email, ok: false, loi: "Địa chỉ diễn tập, không gửi thật" };
    const r = await guiMot(dv, nguoiGui, traLoi, { email: n.email, name: n.ho_ten },
      thuMaKichHoat(n, x.ma_kich_hoat, tenDot, appUrl, zalo), qrDinhKem);
    return { id: n.id, email: n.email, ok: r.ok, loi: r.loi };
  });

  const { error: eG } = await quanTri.rpc("ghi_thu_da_gui", {
    p_dot: dotId, p_nguoi: quyen.toi,
    p: ketQua.map((r) => ({ id: r.id, email: r.email, ok: r.ok, loi: r.loi ?? "", loai: "ma_kich_hoat" })),
  });
  if (eG) console.error(eG);   // gửi rồi thì vẫn báo cho người dùng, chỉ nhật ký là thiếu

  return tra({
    ok: true,
    da_gui: ketQua.filter((r) => r.ok).length,
    loi: ketQua.filter((r) => !r.ok).length,
    ds: ketQua,
  });
});
