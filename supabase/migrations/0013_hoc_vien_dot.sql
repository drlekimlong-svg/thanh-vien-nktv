-- Phần A của việc gộp app Học viên vào app Thành viên (bản thiết kế 17/11/2026).
-- Thêm học viên các đợt tập huấn vào cùng bảng thanh_vien, phân biệt bằng cột loai.
-- Không đụng tới dữ liệu thành viên CLB: mọi hàm liệt kê thành viên được trỏ sang khung nhìn noi_bo.thanh_vien_clb.
--
-- Anh Long duyệt 17/11/2026, đã áp dụng cùng ngày.
--
-- Đã chạy thử ngày 17/11/2026 trên chính cơ sở dữ liệu thật, trong giao dịch rồi hoàn tác;
-- kiểm lại sau đó: không còn cột loai, khung nhìn, bảng mới, hàm mới nào; thanh_vien vẫn đúng 232 dòng.
-- Kết quả:
--   * Cả migration biên dịch và chạy trọn, không lỗi.
--   * Nạp danh sách 4 dòng: 2 mới, 2 lỗi (một thiếu email, một trùng email trong tệp) — đúng như mong đợi.
--   * Tên "nguyễn thị   ngọc ánh" thành "Nguyễn Thị Ngọc Ánh"; "TRẦN MINH KHOA" thành "Trần Minh Khoa";
--     email viết hoa thành viết thường; mã HV00001, HV00002 và mã kích hoạt sinh đúng.
--   * Nạp lại cùng email lần hai: báo "da_trong_dot", không tạo tài khoản trùng.
--   * ds_hoc_vien_dot trả đúng 2 học viên cho Ban tổ chức.
--   * Quan trọng nhất — phần thành viên CLB không đổi: với 2 học viên trong bảng,
--     tinh_trang_kich_hoat() vẫn đếm 232 (bản cũ đếm 234), và cap_ma_kich_hoat() nhận
--     một id thành viên cộng một id học viên thì chỉ cấp mã cho 1 người, bỏ qua học viên.
--   * diem_nhom() chạy bình thường.
--   * Trình duyệt không đọc được khung nhìn noi_bo.thanh_vien_clb (thử bằng vai authenticated: bị từ chối).
--
-- Kiểm lại sau khi áp dụng thật (17/11/2026):
--   * 232 dòng thành viên đều mang loai = 'thanh_vien'; khung nhìn trả đúng 232; năm bảng mới bật RLS; 14 hàm mới có mặt.
--   * Quản trị đăng nhập: toi_la_ai trả loai = 'thanh_vien', tinh_trang_kich_hoat() 232 dòng, diem_nhom() chạy.
--   * Thành viên thường: vẫn chỉ đọc được dòng của chính mình, xem_duoc_ten = false, không thấy đợt nào.
--   * Chạy trọn một vòng trên các hàm đã áp dụng rồi hoàn tác: tạo đợt, xem trước, ghi thật (2 mới),
--     nạp lại (1 "đã trong đợt"), cấp mã cho 2 học viên, ds_hoc_vien_dot trả 2, nhật ký ghi một dòng đúng chữ;
--     thanh_vien lên 234 dòng nhưng tinh_trang_kich_hoat() vẫn 232 và cap_ma_kich_hoat() bỏ qua id học viên.
--   * dot_hoc_vien, hv_ho_so, dot_nhat_ky không có policy nào nên trình duyệt không đọc được
--     (Supabase linter báo "RLS enabled no policy" mức INFO — cố ý, giống kich_hoat và khoa_dong đang có).
--   * Sau khi chạy thử, sequence hv_so đã đặt lại về 1 để học viên thật đầu tiên là HV00001.

/* ============================================================ 1. Phân loại người */

alter table public.thanh_vien add column loai text not null default 'thanh_vien'
  check (loai in ('thanh_vien', 'hoc_vien'));
create index on public.thanh_vien (loai);

-- Khung nhìn chỉ gồm thành viên CLB. Không cấp quyền đọc cho trình duyệt;
-- chỉ các hàm security definer bên dưới dùng, nên phần thành viên giữ nguyên hành vi cũ.
-- Lưu ý khi bảo trì: "select *" chốt danh sách cột ngay lúc tạo khung nhìn.
-- Lần sau thêm cột vào thanh_vien thì phải chạy lại create or replace view này, không thì cột mới không có ở đây.
create view noi_bo.thanh_vien_clb as select * from public.thanh_vien where loai = 'thanh_vien';

/* ============================================================ 2. Tiện ích chuẩn hóa */

-- Gộp khoảng trắng thừa rồi viết hoa đầu mỗi chữ: "nguyễn thị   ngọc ánh" -> "Nguyễn Thị Ngọc Ánh".
create function noi_bo.chuan_ten(p text) returns text language sql immutable set search_path = '' as
$$ select nullif(initcap(lower(btrim(regexp_replace(coalesce(p, ''), '\s+', ' ', 'g')))), '') $$;

-- Bỏ ký tự không phải số, đưa +84 và 84 về 0, giữ nguyên nếu không nhận ra.
create function noi_bo.chuan_sdt(p text) returns text language plpgsql immutable set search_path = '' as $$
declare s text;
begin
  s := regexp_replace(coalesce(p, ''), '[^0-9+]', '', 'g');
  if s = '' then return null; end if;
  if s like '+84%' then s := '0' || substr(s, 4);
  elsif s like '84%' and length(s) >= 11 then s := '0' || substr(s, 3);
  elsif s not like '0%' and length(s) between 9 and 10 then s := '0' || s;
  end if;
  return regexp_replace(s, '[^0-9]', '', 'g');
end $$;

create function noi_bo.email_hop_le(p text) returns boolean language sql immutable set search_path = '' as
$$ select coalesce(lower(btrim(p)) ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$', false) $$;

/* ============================================================ 3. Đợt tập huấn */

create table public.dot (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  ten text not null,
  nam_hoc text,
  mo_ta text,
  bat_dau date,
  ket_thuc date,
  trang_thai text not null default 'soan' check (trang_thai in ('soan', 'mo', 'ket_thuc')),
  cai_dat jsonb not null default '{}'::jsonb,
  tao_boi uuid references public.thanh_vien(id) on delete set null,
  tao_luc timestamptz not null default now()
);

-- Ban tổ chức của đợt. Thành viên CLB giữ vai trong một đợt cụ thể, không đụng tới vai_tro trong CLB.
create table public.dot_ban_to_chuc (
  dot_id uuid not null references public.dot(id) on delete cascade,
  thanh_vien_id uuid not null references public.thanh_vien(id) on delete cascade,
  vai text not null check (vai in ('truong_ban', 'thu_ky', 'giang_vien', 'diem_danh')),
  primary key (dot_id, thanh_vien_id, vai)
);
create index on public.dot_ban_to_chuc (thanh_vien_id);

create table public.dot_hoc_vien (
  dot_id uuid not null references public.dot(id) on delete cascade,
  thanh_vien_id uuid not null references public.thanh_vien(id) on delete cascade,
  trang_thai text not null default 'ghi_danh' check (trang_thai in ('ghi_danh', 'huy')),
  ghi_danh_luc timestamptz not null default now(),
  ghi_chu text,
  primary key (dot_id, thanh_vien_id)
);
create index on public.dot_hoc_vien (thanh_vien_id);

-- Hồ sơ riêng của học viên. Thành viên CLB không có dòng ở bảng này.
-- Email là khóa ghép người học qua nhiều đợt: cùng email thì dùng lại tài khoản cũ.
create table public.hv_ho_so (
  thanh_vien_id uuid primary key references public.thanh_vien(id) on delete cascade,
  email text not null unique,
  sdt text,
  ngay_sinh date,
  gioi_tinh text,
  truong text,
  nganh text,
  nam_hoc text,
  mssv text,
  lop text,
  cap_nhat_luc timestamptz not null default now()
);

create sequence public.hv_so;

-- Nhật ký của đợt. Đặt trước phần nạp danh sách vì hàm nạp có ghi nhật ký.
create table public.dot_nhat_ky (
  id uuid primary key default gen_random_uuid(),
  dot_id uuid not null references public.dot(id) on delete cascade,
  luc timestamptz not null default now(),
  nguoi uuid references public.thanh_vien(id) on delete set null,
  hanh_dong text not null,
  chi_tiet text
);
create index on public.dot_nhat_ky (dot_id, luc desc);

/* ============================================================ 4. Ai được làm gì */

create function noi_bo.la_btc_dot(p_dot uuid) returns boolean language sql stable security definer set search_path = '' as
$$ select noi_bo.la_quan_tri() or exists (
     select 1 from public.dot_ban_to_chuc b
     where b.dot_id = p_dot and b.thanh_vien_id = noi_bo.toi() and b.vai in ('truong_ban', 'thu_ky')) $$;

-- Dùng cho quy tắc đọc dòng học viên: quản trị, hoặc bất kỳ ai đang giữ vai Ban tổ chức của một đợt nào đó.
create function noi_bo.xem_duoc_hoc_vien() returns boolean language sql stable security definer set search_path = '' as
$$ select noi_bo.la_quan_tri() or exists (
     select 1 from public.dot_ban_to_chuc b where b.thanh_vien_id = noi_bo.toi()) $$;

create function noi_bo.la_hoc_vien() returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.thanh_vien where user_id = auth.uid() and loai = 'hoc_vien') $$;

create function noi_bo.ghi_nhat_ky_dot(p_dot uuid, p_hanh_dong text, p_chi_tiet text) returns void
language sql security definer set search_path = '' as $$
  insert into public.dot_nhat_ky (dot_id, nguoi, hanh_dong, chi_tiet) values (p_dot, noi_bo.toi(), p_hanh_dong, p_chi_tiet)
$$;

-- Các đợt đang mở mà người đang đăng nhập có tên. Rỗng nghĩa là tài khoản học viên ở chế độ chỉ đọc.
create function noi_bo.dot_mo_cua_toi() returns setof uuid language sql stable security definer set search_path = '' as
$$ select h.dot_id from public.dot_hoc_vien h join public.dot d on d.id = h.dot_id
   where h.thanh_vien_id = noi_bo.toi() and h.trang_thai = 'ghi_danh' and d.trang_thai = 'mo' $$;

/* ============================================================ 5. Trỏ các hàm cũ sang khung nhìn
   Chỉ sửa những chỗ liệt kê cả tập thành viên. Các chỗ tra đúng một người theo user_id, mã,
   khóa QR giữ nguyên vì học viên cũng là người hợp lệ ở đó. */

-- Giữ ít nhất một quản trị: chỉ đếm trong thành viên CLB.
create or replace function noi_bo.giu_quan_tri() returns trigger language plpgsql set search_path = '' as $$
begin
  if old.vai_tro = 'quan_tri' and old.user_id is not null
     and (tg_op = 'DELETE' or new.vai_tro <> 'quan_tri' or new.user_id is null)
     and not exists (select 1 from noi_bo.thanh_vien_clb x where x.vai_tro = 'quan_tri' and x.user_id is not null and x.id <> old.id) then
    raise exception 'Cần giữ ít nhất một tài khoản quản trị đã kích hoạt';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;

-- Bảng tình trạng kích hoạt của Ban nhân sự: chỉ thành viên CLB.
create or replace function public.tinh_trang_kich_hoat()
returns table (thanh_vien_id uuid, da_kich_hoat boolean, ma_con_han boolean)
language sql stable security definer set search_path = '' as $$
  select t.id, t.user_id is not null, coalesce(k.het_han > now(), false)
  from noi_bo.thanh_vien_clb t left join public.kich_hoat k on k.thanh_vien_id = t.id
  where noi_bo.xem_duoc_ten()
$$;

-- Cấp mã kích hoạt cho thành viên CLB: chặn luôn trường hợp lỡ truyền id học viên vào.
create or replace function public.cap_ma_kich_hoat(p_ids uuid[])
returns table (id uuid, ma text, ho_ten text, ma_kich_hoat text)
language plpgsql security definer set search_path = '' as $$
declare
  bang constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  t record; m text; b bytea;
begin
  if not noi_bo.la_admin() then raise exception 'Chỉ quản trị được cấp mã kích hoạt'; end if;
  for t in select x.id, x.ma, x.ho_ten from noi_bo.thanh_vien_clb x where x.id = any(p_ids) order by x.ma loop
    b := extensions.gen_random_bytes(8); m := '';
    for i in 0..7 loop m := m || substr(bang, 1 + (get_byte(b, i) % length(bang)), 1); end loop;
    insert into public.kich_hoat (thanh_vien_id, ma_bam, het_han, tao_boi)
    values (t.id, extensions.crypt(m, extensions.gen_salt('bf', 8)), now() + interval '30 days', noi_bo.toi())
    on conflict (thanh_vien_id) do update set ma_bam = excluded.ma_bam, het_han = excluded.het_han, lan_sai = 0, khoa_den = null, tao_boi = excluded.tao_boi, tao_luc = now();
    id := t.id; ma := t.ma; ho_ten := t.ho_ten; ma_kich_hoat := m;
    return next;
  end loop;
end $$;

/* Thống kê bài test: khi bài không gắn buổi, đối tượng là thành viên CLB đang hoạt động.
   Giữ nguyên phần còn lại của hàm 0008. */
create or replace function public.thong_ke_bai(p_bai uuid) returns json
language plpgsql security definer set search_path = '' as $$
declare kq json; v_buoi uuid;
begin
  if not noi_bo.la_quan_tri() then raise exception 'Không có quyền'; end if;
  select buoi_id into v_buoi from public.bai_test where id = p_bai;
  perform noi_bo.cham_qua_han(p_bai);
  with tot as (
    select distinct on (l.thanh_vien_id) l.* from public.lam_bai l where l.bai_id = p_bai and l.nop_luc is not null
    order by l.thanh_vien_id, l.diem desc nulls last, l.lan desc
  ), dt as (
    select t.id from noi_bo.thanh_vien_clb t
    where case when v_buoi is null then t.hoat_dong else exists (select 1 from public.diem_danh d where d.buoi_id = v_buoi and d.thanh_vien_id = t.id) end
  )
  select json_build_object(
    'buoi_id', v_buoi,
    'doi_tuong', (select count(*) from dt),
    'da_gui', (select count(*) from tot),
    'tb', (select round(avg(diem), 2) from tot), 'cao', (select max(diem) from tot), 'thap', (select min(diem) from tot),
    'ds', (select coalesce(json_agg(json_build_object('ma', t.ma, 'ho_ten', t.ho_ten, 'gen', t.gen, 'nha', t.nha, 'diem', k.diem, 'so_dung', k.so_dung, 'tong', k.tong, 'nop_luc', k.nop_luc, 'tu_dong', k.tu_dong) order by k.diem desc nulls last, t.ho_ten), '[]')
      from public.thanh_vien t left join tot k on k.thanh_vien_id = t.id where t.id in (select id from dt) or k.id is not null),
    'cau', (select coalesce(json_agg(json_build_object('thu_tu', c.thu_tu, 'noi_dung', c.noi_dung, 'lua_chon', c.lua_chon, 'hinh', c.hinh, 'dung', a.dung,
        'dem', (select coalesce(jsonb_object_agg(v.chon, v.n), '{}') from (select k.tra_loi ->> c.id::text chon, count(*) n from tot k where k.tra_loi ? c.id::text group by 1) v)) order by c.thu_tu), '[]')
      from public.cau_hoi c left join public.dap_an a on a.cau_hoi_id = c.id where c.bai_id = p_bai)
  ) into kq;
  return kq;
end $$;

-- Giao người điểm danh một buổi: chỉ chọn trong thành viên CLB.
create or replace function public.dat_nguoi_diem_danh(p_buoi uuid, p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not noi_bo.la_phu_trach() then raise exception 'Không có quyền'; end if;
  delete from public.buoi_diem_danh where buoi_id = p_buoi;
  insert into public.buoi_diem_danh (buoi_id, thanh_vien_id, giao_boi)
  select p_buoi, t.id, noi_bo.toi() from noi_bo.thanh_vien_clb t where t.id = any(p_ids);
end $$;

/* ============================================================ 6. Quy tắc đọc dòng người

   Trước: thành viên thấy dòng của chính mình, người xem được tên thấy tất cả.
   Sau: thêm hai nhánh — người xem được tên chỉ thấy thành viên CLB, Ban tổ chức đợt thấy học viên. */

drop policy doc on public.thanh_vien;
create policy doc on public.thanh_vien for select to authenticated
  using (
    user_id = (select auth.uid())
    or (loai = 'thanh_vien' and (select noi_bo.xem_duoc_ten()))
    or (loai = 'hoc_vien' and (select noi_bo.xem_duoc_hoc_vien()))
  );

/* ============================================================ 7. Quyền trên bảng mới */

alter table public.dot enable row level security;
alter table public.dot_ban_to_chuc enable row level security;
alter table public.dot_hoc_vien enable row level security;
alter table public.hv_ho_so enable row level security;
alter table public.dot_nhat_ky enable row level security;

-- Tên và ngày của đợt không phải dữ liệu cá nhân: ai đăng nhập cũng đọc được.
grant select on public.dot to authenticated;
create policy doc on public.dot for select to authenticated using ((select noi_bo.toi()) is not null);

grant select on public.dot_ban_to_chuc to authenticated;
create policy doc on public.dot_ban_to_chuc for select to authenticated using ((select noi_bo.toi()) is not null);

-- dot_hoc_vien và hv_ho_so không mở cho trình duyệt: chỉ các hàm bên dưới chạm vào.

/* ============================================================ 8. Nạp danh sách học viên

   Gọi hai lần: lần đầu p_ghi = false để xem trước, lần sau p_ghi = true để ghi thật.
   p_ds là mảng json, mỗi phần tử một dòng của bảng thư ký dán vào:
     { dong, ho_ten, email, sdt, ngay_sinh, gioi_tinh, truong, nganh, nam_hoc, mssv, lop }
   Trả về từng dòng kèm tình trạng:
     moi             - chưa có tài khoản, sẽ tạo (khi ghi thật thì kèm mã học viên và mã kích hoạt)
     da_co_tai_khoan - đã học đợt trước, chỉ thêm vào đợt này, giữ nguyên mã và mật khẩu cũ
     da_trong_dot    - đã có tên trong đợt này rồi, không làm gì
     loi             - thiếu hoặc sai email, thiếu họ tên, trùng email trong chính tệp này */

create function public.nap_danh_sach_hv(p_dot uuid, p_ds jsonb, p_ghi boolean default false)
returns json language plpgsql security definer set search_path = '' as $$
declare
  bang constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  -- Tên biến có tiền tố v_ để không trùng cột email, ho_ten trong các câu truy vấn bên dưới.
  r jsonb; i int := 0; v_email text; v_ten text; tt text; ly_do text;
  tv public.thanh_vien; ma_moi text; ma_kh text; b bytea;
  da_gap jsonb := '{}'::jsonb;
  ket jsonb := '[]'::jsonb;
  dem_moi int := 0; dem_cu int := 0; dem_trong int := 0; dem_loi int := 0;
begin
  if not noi_bo.la_btc_dot(p_dot) then raise exception 'Chỉ Ban tổ chức của đợt được nạp danh sách'; end if;
  if jsonb_typeof(p_ds) <> 'array' then raise exception 'Danh sách phải là một mảng'; end if;
  if jsonb_array_length(p_ds) > 1000 then raise exception 'Mỗi lần nạp tối đa 1000 dòng'; end if;

  for r in select * from jsonb_array_elements(p_ds) loop
    i := i + 1;
    v_email := lower(btrim(coalesce(r ->> 'email', '')));
    v_ten := noi_bo.chuan_ten(r ->> 'ho_ten');
    tt := null; ly_do := null; ma_moi := null; ma_kh := null; tv := null;

    if not noi_bo.email_hop_le(v_email) then
      tt := 'loi'; ly_do := case when v_email = '' then 'Thiếu email' else 'Email không đúng: ' || v_email end;
    elsif da_gap ? v_email then
      tt := 'loi'; ly_do := 'Trùng email với dòng ' || (da_gap ->> v_email) || ' trong chính tệp này';
    else
      da_gap := da_gap || jsonb_build_object(v_email, coalesce(r ->> 'dong', i::text));
      select t.* into tv from public.thanh_vien t join public.hv_ho_so h on h.thanh_vien_id = t.id where h.email = v_email;
      if tv.id is null and v_ten is null then
        tt := 'loi'; ly_do := 'Thiếu họ tên';
      elsif tv.id is not null and exists (select 1 from public.dot_hoc_vien x where x.dot_id = p_dot and x.thanh_vien_id = tv.id and x.trang_thai = 'ghi_danh') then
        tt := 'da_trong_dot';
      elsif tv.id is not null then
        tt := 'da_co_tai_khoan';
      else
        tt := 'moi';
      end if;
    end if;

    if p_ghi and tt in ('moi', 'da_co_tai_khoan') then
      if tt = 'moi' then
        ma_moi := 'HV' || lpad(nextval('public.hv_so')::text, 5, '0');
        insert into public.thanh_vien (ma, ho_ten, loai, hoat_dong)
        values (ma_moi, v_ten, 'hoc_vien', true)
        returning * into tv;
        insert into public.hv_ho_so (thanh_vien_id, email, sdt, ngay_sinh, gioi_tinh, truong, nganh, nam_hoc, mssv, lop)
        values (tv.id, v_email, noi_bo.chuan_sdt(r ->> 'sdt'),
          case when btrim(coalesce(r ->> 'ngay_sinh', '')) = '' then null else (r ->> 'ngay_sinh')::date end,
          nullif(btrim(coalesce(r ->> 'gioi_tinh', '')), ''), nullif(btrim(coalesce(r ->> 'truong', '')), ''),
          nullif(btrim(coalesce(r ->> 'nganh', '')), ''), nullif(btrim(coalesce(r ->> 'nam_hoc', '')), ''),
          nullif(btrim(coalesce(r ->> 'mssv', '')), ''), nullif(btrim(coalesce(r ->> 'lop', '')), ''));
        b := extensions.gen_random_bytes(8); ma_kh := '';
        for k in 0..7 loop ma_kh := ma_kh || substr(bang, 1 + (get_byte(b, k) % length(bang)), 1); end loop;
        insert into public.kich_hoat (thanh_vien_id, ma_bam, het_han, tao_boi)
        values (tv.id, extensions.crypt(ma_kh, extensions.gen_salt('bf', 8)), now() + interval '90 days', noi_bo.toi());
      else
        ma_moi := tv.ma;
        -- Bổ sung những ô còn trống trong hồ sơ cũ, không ghi đè thông tin người học đã tự sửa.
        update public.hv_ho_so h set
          sdt = coalesce(h.sdt, noi_bo.chuan_sdt(r ->> 'sdt')),
          truong = coalesce(h.truong, nullif(btrim(coalesce(r ->> 'truong', '')), '')),
          nganh = coalesce(h.nganh, nullif(btrim(coalesce(r ->> 'nganh', '')), '')),
          nam_hoc = coalesce(h.nam_hoc, nullif(btrim(coalesce(r ->> 'nam_hoc', '')), '')),
          mssv = coalesce(h.mssv, nullif(btrim(coalesce(r ->> 'mssv', '')), '')),
          lop = coalesce(h.lop, nullif(btrim(coalesce(r ->> 'lop', '')), '')),
          cap_nhat_luc = now()
        where h.thanh_vien_id = tv.id;
      end if;
      insert into public.dot_hoc_vien (dot_id, thanh_vien_id)
      values (p_dot, tv.id)
      on conflict (dot_id, thanh_vien_id) do update set trang_thai = 'ghi_danh';
    end if;

    if tt = 'moi' then dem_moi := dem_moi + 1;
    elsif tt = 'da_co_tai_khoan' then dem_cu := dem_cu + 1;
    elsif tt = 'da_trong_dot' then dem_trong := dem_trong + 1;
    else dem_loi := dem_loi + 1; end if;

    ket := ket || jsonb_build_object(
      'dong', coalesce(r ->> 'dong', i::text), 'ho_ten', coalesce(v_ten, r ->> 'ho_ten'), 'email', v_email,
      'tinh_trang', tt, 'ly_do', ly_do, 'ma', ma_moi, 'ma_kich_hoat', ma_kh);
  end loop;

  if p_ghi then
    perform noi_bo.ghi_nhat_ky_dot(p_dot, 'Nạp danh sách', dem_moi || ' mới, ' || dem_cu || ' đã có tài khoản, ' || dem_trong || ' đã trong đợt, ' || dem_loi || ' lỗi');
  end if;

  return json_build_object('da_ghi', p_ghi,
    'dem', json_build_object('moi', dem_moi, 'da_co_tai_khoan', dem_cu, 'da_trong_dot', dem_trong, 'loi', dem_loi),
    'ds', ket);
end $$;

/* ============================================================ 9. Cấp lại mã kích hoạt cho học viên */

create function public.cap_ma_kich_hoat_hv(p_dot uuid, p_ids uuid[])
returns table (id uuid, ma text, ho_ten text, email text, ma_kich_hoat text)
language plpgsql security definer set search_path = '' as $$
declare
  bang constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  t record; m text; b bytea;
begin
  if not noi_bo.la_btc_dot(p_dot) then raise exception 'Chỉ Ban tổ chức của đợt được cấp mã'; end if;
  for t in
    select x.id, x.ma, x.ho_ten, h.email
    from public.thanh_vien x
    join public.hv_ho_so h on h.thanh_vien_id = x.id
    join public.dot_hoc_vien g on g.thanh_vien_id = x.id and g.dot_id = p_dot and g.trang_thai = 'ghi_danh'
    where x.loai = 'hoc_vien' and x.id = any(p_ids) order by x.ma
  loop
    b := extensions.gen_random_bytes(8); m := '';
    for i in 0..7 loop m := m || substr(bang, 1 + (get_byte(b, i) % length(bang)), 1); end loop;
    insert into public.kich_hoat (thanh_vien_id, ma_bam, het_han, tao_boi)
    values (t.id, extensions.crypt(m, extensions.gen_salt('bf', 8)), now() + interval '90 days', noi_bo.toi())
    on conflict (thanh_vien_id) do update set ma_bam = excluded.ma_bam, het_han = excluded.het_han, lan_sai = 0, khoa_den = null, tao_boi = excluded.tao_boi, tao_luc = now();
    id := t.id; ma := t.ma; ho_ten := t.ho_ten; email := t.email; ma_kich_hoat := m;
    return next;
  end loop;
end $$;

/* ============================================================ 10. Danh sách học viên của đợt */

create function public.ds_hoc_vien_dot(p_dot uuid) returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object(
    'id', t.id, 'ma', t.ma, 'ho_ten', t.ho_ten, 'email', h.email, 'sdt', h.sdt,
    'truong', h.truong, 'nganh', h.nganh, 'nam_hoc', h.nam_hoc, 'mssv', h.mssv, 'lop', h.lop,
    'da_kich_hoat', t.user_id is not null,
    'ma_con_han', coalesce(k.het_han > now(), false),
    'trang_thai', g.trang_thai, 'ghi_danh_luc', g.ghi_danh_luc) order by t.ho_ten), '[]')
  from public.dot_hoc_vien g
  join public.thanh_vien t on t.id = g.thanh_vien_id
  join public.hv_ho_so h on h.thanh_vien_id = t.id
  left join public.kich_hoat k on k.thanh_vien_id = t.id
  where g.dot_id = p_dot and noi_bo.la_btc_dot(p_dot)
$$;

/* ============================================================ 11. Quản lý đợt */

create function public.luu_dot(p_id uuid, p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := p_id;
begin
  if v_id is null then
    if not noi_bo.la_quan_tri() then raise exception 'Chỉ quản trị và Ban cố vấn được tạo đợt'; end if;
    insert into public.dot (ma, ten, nam_hoc, mo_ta, bat_dau, ket_thuc, tao_boi)
    values (upper(btrim(p ->> 'ma')), btrim(p ->> 'ten'), nullif(btrim(coalesce(p ->> 'nam_hoc', '')), ''),
      nullif(btrim(coalesce(p ->> 'mo_ta', '')), ''),
      nullif(btrim(coalesce(p ->> 'bat_dau', '')), '')::date, nullif(btrim(coalesce(p ->> 'ket_thuc', '')), '')::date,
      noi_bo.toi())
    returning id into v_id;
  else
    if not noi_bo.la_btc_dot(v_id) then raise exception 'Chỉ Ban tổ chức của đợt được sửa đợt'; end if;
    update public.dot set
      ten = coalesce(nullif(btrim(coalesce(p ->> 'ten', '')), ''), ten),
      nam_hoc = coalesce(nullif(btrim(coalesce(p ->> 'nam_hoc', '')), ''), nam_hoc),
      mo_ta = coalesce(nullif(btrim(coalesce(p ->> 'mo_ta', '')), ''), mo_ta),
      bat_dau = coalesce(nullif(btrim(coalesce(p ->> 'bat_dau', '')), '')::date, bat_dau),
      ket_thuc = coalesce(nullif(btrim(coalesce(p ->> 'ket_thuc', '')), '')::date, ket_thuc),
      trang_thai = coalesce(nullif(btrim(coalesce(p ->> 'trang_thai', '')), ''), trang_thai)
    where id = v_id;
  end if;
  return v_id;
end $$;

create function public.dat_btc_dot(p_dot uuid, p jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not noi_bo.la_quan_tri() and not exists (
      select 1 from public.dot_ban_to_chuc b where b.dot_id = p_dot and b.thanh_vien_id = noi_bo.toi() and b.vai = 'truong_ban')
  then raise exception 'Chỉ quản trị hoặc trưởng ban của đợt được phân vai'; end if;
  delete from public.dot_ban_to_chuc where dot_id = p_dot;
  insert into public.dot_ban_to_chuc (dot_id, thanh_vien_id, vai)
  select p_dot, (x ->> 'thanh_vien_id')::uuid, x ->> 'vai'
  from jsonb_array_elements(p) x
  where exists (select 1 from noi_bo.thanh_vien_clb t where t.id = (x ->> 'thanh_vien_id')::uuid)
  on conflict do nothing;
end $$;

create function public.ds_dot() returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object(
    'id', d.id, 'ma', d.ma, 'ten', d.ten, 'nam_hoc', d.nam_hoc, 'mo_ta', d.mo_ta,
    'bat_dau', d.bat_dau, 'ket_thuc', d.ket_thuc, 'trang_thai', d.trang_thai,
    'so_hoc_vien', (select count(*) from public.dot_hoc_vien g where g.dot_id = d.id and g.trang_thai = 'ghi_danh'),
    'so_kich_hoat', (select count(*) from public.dot_hoc_vien g join public.thanh_vien t on t.id = g.thanh_vien_id
       where g.dot_id = d.id and g.trang_thai = 'ghi_danh' and t.user_id is not null),
    'la_btc', noi_bo.la_btc_dot(d.id)) order by d.bat_dau desc nulls last, d.tao_luc desc), '[]')
  from public.dot d where noi_bo.la_quan_tri() or noi_bo.xem_duoc_hoc_vien()
$$;

/* ============================================================ 12. toi_la_ai: thêm phần học viên

   Thành viên CLB: y như bản 0011, thêm 'loai'.
   Học viên: chỉ các ô cần cho giao diện học viên, cộng danh sách đợt đang mở.
   'chi_doc' = true nghĩa là không còn đợt nào đang mở: app chuyển sang xem kết quả và chứng nhận. */

create or replace function public.toi_la_ai() returns json
language sql stable security definer set search_path = '' as $$
  select case when t.loai = 'hoc_vien' then
    json_build_object('id', t.id, 'ma', t.ma, 'ho_ten', t.ho_ten, 'loai', 'hoc_vien',
      'hoat_dong', t.hoat_dong, 'khoa_qr', t.khoa_qr, 'email', h.email,
      'dot', coalesce((select json_agg(json_build_object('id', d.id, 'ma', d.ma, 'ten', d.ten,
          'bat_dau', d.bat_dau, 'ket_thuc', d.ket_thuc, 'trang_thai', d.trang_thai) order by d.bat_dau desc nulls last)
        from public.dot_hoc_vien g join public.dot d on d.id = g.dot_id
        where g.thanh_vien_id = t.id and g.trang_thai = 'ghi_danh'), '[]'),
      'chi_doc', not exists (select 1 from noi_bo.dot_mo_cua_toi()),
      'bay_gio', now())
  else
    json_build_object('id', t.id, 'ma', t.ma, 'ho_ten', t.ho_ten, 'loai', 'thanh_vien',
      'gen', t.gen, 'nha', t.nha, 'cap', t.cap, 'hoat_dong', t.hoat_dong,
      'khoa_qr', t.khoa_qr, 'vai_tro', t.vai_tro, 'chuc_vu', t.chuc_vu,
      'la_admin', t.vai_tro = 'quan_tri',
      'la_quan_tri', t.vai_tro = 'quan_tri' or t.cap = 'Ban cố vấn',
      'la_phu_trach', t.vai_tro in ('quan_tri', 'diem_danh') or t.cap = 'Ban cố vấn',
      'xem_duoc_ten', t.vai_tro in ('quan_tri', 'diem_danh') or t.cap = 'Ban cố vấn',
      'lich_moi_nha', t.vai_tro in ('quan_tri', 'diem_danh') or t.cap = 'Ban cố vấn',
      'lich_nha', case when t.chuc_vu is not null then t.nha end,
      'lich_duoc_giao', coalesce((select json_agg(json_build_object('nha', p.nha, 'den_ngay', p.den_ngay) order by p.nha) from public.phan_cong_lich p
        where p.thanh_vien_id = t.id and (p.den_ngay is null or p.den_ngay >= noi_bo.hom_nay())), '[]'),
      'buoi_diem_danh', coalesce((select json_agg(g.buoi_id) from public.buoi_diem_danh g join public.buoi b on b.id = g.buoi_id where g.thanh_vien_id = t.id and not b.dong), '[]'),
      'btc_dot', coalesce((select json_agg(json_build_object('dot_id', b.dot_id, 'vai', b.vai)) from public.dot_ban_to_chuc b where b.thanh_vien_id = t.id), '[]'),
      'bay_gio', now())
  end
  from public.thanh_vien t left join public.hv_ho_so h on h.thanh_vien_id = t.id
  where t.user_id = auth.uid()
$$;

/* ============================================================ 13. Quyền gọi hàm */

revoke all on function public.nap_danh_sach_hv(uuid, jsonb, boolean) from public, anon;
revoke all on function public.cap_ma_kich_hoat_hv(uuid, uuid[]) from public, anon;
revoke all on function public.ds_hoc_vien_dot(uuid) from public, anon;
revoke all on function public.luu_dot(uuid, jsonb) from public, anon;
revoke all on function public.dat_btc_dot(uuid, jsonb) from public, anon;
revoke all on function public.ds_dot() from public, anon;
grant execute on function public.nap_danh_sach_hv(uuid, jsonb, boolean) to authenticated;
grant execute on function public.cap_ma_kich_hoat_hv(uuid, uuid[]) to authenticated;
grant execute on function public.ds_hoc_vien_dot(uuid) to authenticated;
grant execute on function public.luu_dot(uuid, jsonb) to authenticated;
grant execute on function public.dat_btc_dot(uuid, jsonb) to authenticated;
grant execute on function public.ds_dot() to authenticated;

revoke all on all functions in schema noi_bo from public, anon;
grant execute on all functions in schema noi_bo to authenticated, service_role;
