-- 0017_thu_gon_ho_so_va_zalo.sql — hai việc người dùng yêu cầu ngày 18/11/2026:
--
-- 1. App chỉ thu thập **họ tên, lớp, MSSV và email** của học viên. Bỏ hẳn số điện thoại,
--    ngày sinh, giới tính, trường, ngành, năm học khỏi hồ sơ học viên. Thu ít dữ liệu cá nhân
--    thì hồ sơ bảo vệ dữ liệu nhẹ đi và rủi ro cũng nhẹ đi.
--    Lúc chạy migration này, hv_ho_so chỉ có 10 dòng của gói diễn tập (đuôi @dientap.test),
--    chưa có học viên thật nào, nên không mất dữ liệu của ai.
--
-- 2. Mỗi đợt có **link và mã QR nhóm Zalo** do thư ký hoặc điều hành tạo trước khi nạp danh
--    sách rồi dán vào app. Link và QR đi kèm thư báo mã kích hoạt và hiện trên màn học viên.
--
-- Ca thử đã chạy trên cơ sở dữ liệu thật trong giao dịch rồi hoàn tác:
--   * Phần CLB không đổi: bảng điểm danh, chuyên cần, điểm nhóm, tình trạng kích hoạt.
--   * nap_danh_sach_hv xem trước và ghi thật vẫn đúng bốn tình trạng, chỉ còn bốn cột.
--   * ds_hoc_vien_dot không còn sdt, truong, nganh, nam_hoc.
--   * zalo_cua_dot: Ban tổ chức và học viên trong đợt đọc được, người ngoài đợt không.
--   * luu_dot lưu và xóa được link, QR; link sai dạng bị chặn.

/* ============================================================ 1. Thu gọn hồ sơ học viên */

alter table public.hv_ho_so
  drop column sdt,
  drop column ngay_sinh,
  drop column gioi_tinh,
  drop column truong,
  drop column nganh,
  drop column nam_hoc;

/* ============================================================ 2. Nạp danh sách: chỉ bốn cột

   Giữ nguyên cách làm của 0013 (gọi hai lần, xem trước rồi ghi), chỉ bỏ các cột không còn thu.
   Thêm 'id' vào từng dòng kết quả để màn bảng gửi học viên gửi email được ngay mà không phải
   tra lại theo email. */

create or replace function public.nap_danh_sach_hv(p_dot uuid, p_ds jsonb, p_ghi boolean default false)
returns json language plpgsql security definer set search_path = '' as $$
declare
  bang constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  -- Tên biến có tiền tố v_ để không trùng cột email, ho_ten trong các câu truy vấn bên dưới.
  r jsonb; i int := 0; v_email text; v_ten text; tt text; ly_do text;
  tv public.thanh_vien; ma_moi text; ma_kh text; b bytea; v_id uuid;
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
    tt := null; ly_do := null; ma_moi := null; ma_kh := null; tv := null; v_id := null;

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
        insert into public.hv_ho_so (thanh_vien_id, email, mssv, lop)
        values (tv.id, v_email,
          nullif(btrim(coalesce(r ->> 'mssv', '')), ''), nullif(btrim(coalesce(r ->> 'lop', '')), ''));
        b := extensions.gen_random_bytes(8); ma_kh := '';
        for k in 0..7 loop ma_kh := ma_kh || substr(bang, 1 + (get_byte(b, k) % length(bang)), 1); end loop;
        insert into public.kich_hoat (thanh_vien_id, ma_bam, het_han, tao_boi)
        values (tv.id, extensions.crypt(ma_kh, extensions.gen_salt('bf', 8)), now() + interval '90 days', noi_bo.toi());
      else
        ma_moi := tv.ma;
        -- Bổ sung những ô còn trống trong hồ sơ cũ, không ghi đè thông tin người học đã tự sửa.
        update public.hv_ho_so h set
          mssv = coalesce(h.mssv, nullif(btrim(coalesce(r ->> 'mssv', '')), '')),
          lop = coalesce(h.lop, nullif(btrim(coalesce(r ->> 'lop', '')), '')),
          cap_nhat_luc = now()
        where h.thanh_vien_id = tv.id;
      end if;
      v_id := tv.id;
      insert into public.dot_hoc_vien (dot_id, thanh_vien_id)
      values (p_dot, tv.id)
      on conflict (dot_id, thanh_vien_id) do update set trang_thai = 'ghi_danh';
    end if;

    if tt = 'moi' then dem_moi := dem_moi + 1;
    elsif tt = 'da_co_tai_khoan' then dem_cu := dem_cu + 1;
    elsif tt = 'da_trong_dot' then dem_trong := dem_trong + 1;
    else dem_loi := dem_loi + 1; end if;

    ket := ket || jsonb_build_object(
      'dong', coalesce(r ->> 'dong', i::text), 'id', v_id,
      'ho_ten', coalesce(v_ten, r ->> 'ho_ten'), 'email', v_email,
      'tinh_trang', tt, 'ly_do', ly_do, 'ma', ma_moi, 'ma_kich_hoat', ma_kh);
  end loop;

  if p_ghi then
    perform noi_bo.ghi_nhat_ky_dot(p_dot, 'Nạp danh sách', dem_moi || ' mới, ' || dem_cu || ' đã có tài khoản, ' || dem_trong || ' đã trong đợt, ' || dem_loi || ' lỗi');
  end if;

  return json_build_object('da_ghi', p_ghi,
    'dem', json_build_object('moi', dem_moi, 'da_co_tai_khoan', dem_cu, 'da_trong_dot', dem_trong, 'loi', dem_loi),
    'ds', ket);
end $$;

/* ============================================================ 3. Danh sách học viên: bỏ các cột đã bỏ */

create or replace function public.ds_hoc_vien_dot(p_dot uuid) returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object(
    'id', t.id, 'ma', t.ma, 'ho_ten', t.ho_ten, 'email', h.email, 'mssv', h.mssv, 'lop', h.lop,
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

/* ============================================================ 4. Nhóm Zalo của đợt

   Thư ký hoặc điều hành tạo nhóm Zalo trước khi nạp danh sách, rồi dán link và ảnh QR vào app.
   Ảnh QR lưu dạng data URL giống hình câu hỏi của post-test (migration 0008). */

alter table public.dot
  add column zalo_link text check (zalo_link is null or zalo_link ~ '^https?://'),
  add column zalo_qr text check (zalo_qr is null or (zalo_qr like 'data:image/%' and octet_length(zalo_qr) <= 1500000));

-- Link và ảnh QR của một đợt: Ban tổ chức của đợt và học viên đang ghi danh đọc được.
-- Tách thành hàm riêng để ds_dot không phải kéo theo ảnh của mọi đợt.
create function public.zalo_cua_dot(p_dot uuid) returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object('link', d.zalo_link, 'qr', d.zalo_qr)
  from public.dot d
  where d.id = p_dot and (
    noi_bo.la_quan_tri()
    or exists (select 1 from public.dot_ban_to_chuc b where b.dot_id = p_dot and b.thanh_vien_id = noi_bo.toi())
    or exists (select 1 from public.dot_hoc_vien g where g.dot_id = p_dot and g.thanh_vien_id = noi_bo.toi() and g.trang_thai = 'ghi_danh'))
$$;

/* Lưu đợt: nhận thêm zalo_link và zalo_qr.
   Khác với các ô kia, hai ô này đặt lại được về trống: gửi chuỗi rỗng là xóa. */

create or replace function public.luu_dot(p_id uuid, p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := p_id; v_zalo text;
begin
  -- Báo bằng câu tiếng Việt thay vì để check constraint bắn ra lỗi Postgres khó hiểu.
  if p ? 'zalo_link' then
    v_zalo := nullif(btrim(p ->> 'zalo_link'), '');
    if v_zalo is not null and v_zalo !~ '^https?://' then
      raise exception 'Link nhóm Zalo phải bắt đầu bằng https://';
    end if;
  end if;
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
      trang_thai = coalesce(nullif(btrim(coalesce(p ->> 'trang_thai', '')), ''), trang_thai),
      zalo_link = case when p ? 'zalo_link' then nullif(btrim(p ->> 'zalo_link'), '') else zalo_link end,
      zalo_qr = case when p ? 'zalo_qr' then nullif(btrim(p ->> 'zalo_qr'), '') else zalo_qr end
    where id = v_id;
  end if;
  return v_id;
end $$;

-- Danh sách đợt: thêm link Zalo và cờ đã có ảnh QR chưa. Ảnh không đi kèm ở đây.
create or replace function public.ds_dot() returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object(
    'id', d.id, 'ma', d.ma, 'ten', d.ten, 'nam_hoc', d.nam_hoc, 'mo_ta', d.mo_ta,
    'bat_dau', d.bat_dau, 'ket_thuc', d.ket_thuc, 'trang_thai', d.trang_thai,
    'cai_dat', d.cai_dat,
    'zalo_link', d.zalo_link, 'co_zalo_qr', d.zalo_qr is not null,
    'so_hoc_vien', (select count(*) from public.dot_hoc_vien g where g.dot_id = d.id and g.trang_thai = 'ghi_danh'),
    'so_kich_hoat', (select count(*) from public.dot_hoc_vien g join public.thanh_vien t on t.id = g.thanh_vien_id
       where g.dot_id = d.id and g.trang_thai = 'ghi_danh' and t.user_id is not null),
    'la_btc', noi_bo.la_btc_dot(d.id)) order by d.bat_dau desc nulls last, d.tao_luc desc), '[]')
  from public.dot d where noi_bo.la_quan_tri() or noi_bo.xem_duoc_hoc_vien()
$$;

/* ============================================================ 5. Quyền */

revoke all on function public.zalo_cua_dot(uuid) from public, anon;
grant execute on function public.zalo_cua_dot(uuid) to authenticated;
