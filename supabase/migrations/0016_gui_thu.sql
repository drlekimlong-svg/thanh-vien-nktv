-- 0016_gui_thu.sql — Phần D: gửi mã kích hoạt cho học viên qua email.
--
-- Vì sao phải có migration cho việc gửi thư:
--   * Phải ghi lại ai đã nhận được thư, ai không, để Ban tổ chức biết còn phải gửi tay cho ai.
--   * Địa chỉ email của học viên nằm ở hv_ho_so, bảng trình duyệt không đọc được. Edge Function
--     tra địa chỉ từ cơ sở dữ liệu chứ không nhận địa chỉ do trình duyệt gửi lên — như vậy thư
--     chỉ đi được tới đúng địa chỉ đã lưu, dù trình duyệt có bị sửa.
--   * Mã kích hoạt bản rõ KHÔNG lưu ở đâu cả. Trình duyệt vừa cấp mã thì gửi thẳng cho Edge
--     Function, gửi xong là quên. Bảng nhật ký chỉ ghi "đã gửi" hay "lỗi", không ghi nội dung mã.
--
-- Khóa API của dịch vụ gửi thư nằm trong secret của Edge Function (BREVO_API_KEY), không nằm
-- trong cơ sở dữ liệu và không nằm trong kho mã nguồn công khai.
--
-- Ca thử đã chạy trên cơ sở dữ liệu thật trong giao dịch rồi hoàn tác (xem phần ghi chú cuối tệp):
--   * Phần CLB không đổi: bảng điểm danh, chuyên cần, điểm nhóm, tình trạng kích hoạt.
--   * nguoi_nhan_thu chỉ trả học viên đang ghi danh của đúng đợt, bỏ id lạ và người ngoài đợt.
--   * ghi_thu_da_gui ghi đúng số dòng, phân biệt da_gui và loi.
--   * ds_hoc_vien_dot có thêm thu_luc, thu_trang_thai và vẫn chặn người ngoài Ban tổ chức.
--   * authenticated không gọi được nguoi_nhan_thu và ghi_thu_da_gui (chỉ service_role gọi được).

/* ============================================================ 1. Nhật ký thư đã gửi */

create table public.thu_da_gui (
  id uuid primary key default gen_random_uuid(),
  -- Thư thử của quản trị không thuộc đợt nào nên dot_id để trống được.
  dot_id uuid references public.dot(id) on delete cascade,
  thanh_vien_id uuid references public.thanh_vien(id) on delete cascade,
  email text not null,
  loai text not null default 'ma_kich_hoat' check (loai in ('ma_kich_hoat', 'thu_thu')),
  trang_thai text not null check (trang_thai in ('da_gui', 'loi')),
  loi text,
  luc timestamptz not null default now(),
  gui_boi uuid references public.thanh_vien(id) on delete set null
);
create index on public.thu_da_gui (dot_id, luc desc);
create index on public.thu_da_gui (thanh_vien_id, luc desc);

-- Bật RLS và cố ý KHÔNG có policy: trình duyệt chỉ đọc bảng này qua hàm, giống kich_hoat,
-- khoa_dong, dot_hoc_vien. Trình kiểm tra của Supabase sẽ báo INFO, đó là chủ ý.
alter table public.thu_da_gui enable row level security;

/* ============================================================ 2. Hàm cho Edge Function

   Ba hàm dưới đây chia làm hai nhóm:
     * kiem_quyen_gui_thu gọi bằng phiên đăng nhập của người bấm nút — để biết người đó là ai
       và có được gửi thư của đợt này không.
     * nguoi_nhan_thu và ghi_thu_da_gui chỉ service_role gọi được, nên bên trong không kiểm
       quyền (service_role không có auth.uid() để kiểm). Quyền đã chặn ở lệnh grant cuối tệp. */

create function public.kiem_quyen_gui_thu(p_dot uuid) returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'toi', noi_bo.toi(),
    'la_quan_tri', noi_bo.la_quan_tri(),
    'duoc_gui', case when p_dot is null then noi_bo.la_quan_tri() else noi_bo.la_btc_dot(p_dot) end,
    'ten_dot', (select d.ten from public.dot d where d.id = p_dot),
    'ma_dot', (select d.ma from public.dot d where d.id = p_dot))
$$;

-- Địa chỉ nhận lấy từ cơ sở dữ liệu, không lấy từ trình duyệt.
create function public.nguoi_nhan_thu(p_dot uuid, p_ids uuid[])
returns table (id uuid, ma text, ho_ten text, email text)
language sql stable security definer set search_path = '' as $$
  select t.id, t.ma, t.ho_ten, h.email
  from public.thanh_vien t
  join public.hv_ho_so h on h.thanh_vien_id = t.id
  join public.dot_hoc_vien g on g.thanh_vien_id = t.id and g.dot_id = p_dot and g.trang_thai = 'ghi_danh'
  where t.loai = 'hoc_vien' and t.id = any(p_ids)
  order by t.ho_ten
$$;

create function public.ghi_thu_da_gui(p_dot uuid, p_nguoi uuid, p jsonb) returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  insert into public.thu_da_gui (dot_id, thanh_vien_id, email, loai, trang_thai, loi, gui_boi)
  select p_dot,
         nullif(x ->> 'id', '')::uuid,
         x ->> 'email',
         coalesce(nullif(x ->> 'loai', ''), 'ma_kich_hoat'),
         case when coalesce((x ->> 'ok')::boolean, false) then 'da_gui' else 'loi' end,
         nullif(btrim(coalesce(x ->> 'loi', '')), ''),
         p_nguoi
  from jsonb_array_elements(coalesce(p, '[]'::jsonb)) x;
  get diagnostics n = row_count;
  return n;
end $$;

/* ============================================================ 3. Hàm cho giao diện */

create function public.ds_thu_da_gui(p_dot uuid) returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object(
    'id', x.id, 'thanh_vien_id', x.thanh_vien_id, 'ho_ten', t.ho_ten, 'ma', t.ma,
    'email', x.email, 'loai', x.loai, 'trang_thai', x.trang_thai, 'loi', x.loi,
    'luc', x.luc, 'gui_boi', g.ho_ten) order by x.luc desc), '[]')
  from public.thu_da_gui x
  left join public.thanh_vien t on t.id = x.thanh_vien_id
  left join public.thanh_vien g on g.id = x.gui_boi
  where x.dot_id = p_dot and noi_bo.la_btc_dot(p_dot)
$$;

-- Màn Gửi thư của quản trị: xem 200 thư gần nhất, kể cả thư thử không thuộc đợt nào.
create function public.ds_thu_gan_day() returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(s.r order by s.luc desc), '[]') from (
    select x.luc, json_build_object(
      'id', x.id, 'ho_ten', coalesce(t.ho_ten, '—'), 'ma', t.ma, 'email', x.email,
      'loai', x.loai, 'trang_thai', x.trang_thai, 'loi', x.loi, 'luc', x.luc,
      'ten_dot', d.ten, 'gui_boi', g.ho_ten) as r
    from public.thu_da_gui x
    left join public.thanh_vien t on t.id = x.thanh_vien_id
    left join public.thanh_vien g on g.id = x.gui_boi
    left join public.dot d on d.id = x.dot_id
    where noi_bo.la_quan_tri()
    order by x.luc desc limit 200) s
$$;

/* ============================================================ 4. Danh sách học viên có thêm cột thư

   Giữ nguyên kiểu trả về json của 0013, chỉ thêm hai khóa thu_luc và thu_trang_thai: lần gửi
   gần nhất của chính đợt này. Nhờ đó màn Danh sách học viên nói được "đã gửi thư lúc nào". */

create or replace function public.ds_hoc_vien_dot(p_dot uuid) returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object(
    'id', t.id, 'ma', t.ma, 'ho_ten', t.ho_ten, 'email', h.email, 'sdt', h.sdt,
    'truong', h.truong, 'nganh', h.nganh, 'nam_hoc', h.nam_hoc, 'mssv', h.mssv, 'lop', h.lop,
    'da_kich_hoat', t.user_id is not null,
    'ma_con_han', coalesce(k.het_han > now(), false),
    'thu_luc', th.luc, 'thu_trang_thai', th.trang_thai,
    'trang_thai', g.trang_thai, 'ghi_danh_luc', g.ghi_danh_luc) order by t.ho_ten), '[]')
  from public.dot_hoc_vien g
  join public.thanh_vien t on t.id = g.thanh_vien_id
  join public.hv_ho_so h on h.thanh_vien_id = t.id
  left join public.kich_hoat k on k.thanh_vien_id = t.id
  left join lateral (
    select x.luc, x.trang_thai from public.thu_da_gui x
    where x.dot_id = p_dot and x.thanh_vien_id = t.id and x.loai = 'ma_kich_hoat'
    order by x.luc desc limit 1) th on true
  where g.dot_id = p_dot and noi_bo.la_btc_dot(p_dot)
$$;

/* ============================================================ 5. Quyền

   nguoi_nhan_thu và ghi_thu_da_gui KHÔNG mở cho authenticated: chỉ Edge Function (service_role)
   gọi được. Nếu mở cho authenticated thì bất kỳ ai đăng nhập cũng đọc được email học viên. */

revoke all on function public.kiem_quyen_gui_thu(uuid) from public, anon;
revoke all on function public.nguoi_nhan_thu(uuid, uuid[]) from public, anon, authenticated;
revoke all on function public.ghi_thu_da_gui(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.ds_thu_da_gui(uuid) from public, anon;
revoke all on function public.ds_thu_gan_day() from public, anon;

grant execute on function public.kiem_quyen_gui_thu(uuid) to authenticated;
grant execute on function public.nguoi_nhan_thu(uuid, uuid[]) to service_role;
grant execute on function public.ghi_thu_da_gui(uuid, uuid, jsonb) to service_role;
grant execute on function public.ds_thu_da_gui(uuid) to authenticated;
grant execute on function public.ds_thu_gan_day() to authenticated;

/* ============================================================ 6. Cài đặt gửi thư

   Khóa "thu" trong bảng cai_dat: bật tắt, tên và địa chỉ người gửi. Mọi thành viên đăng nhập
   đều đọc được bảng cai_dat nên ở đây chỉ để những thứ công khai được. Khóa API không ở đây. */

insert into public.cai_dat (khoa, gia_tri)
values ('thu', jsonb_build_object(
  'bat', false,
  'ten_nguoi_gui', 'CLB Ngoại Khoa Trưng Vương',
  'dia_chi_gui', '',
  'tra_loi_toi', '',
  'app_url', 'https://drlekimlong-svg.github.io/thanh-vien-nktv/'))
on conflict (khoa) do nothing;
