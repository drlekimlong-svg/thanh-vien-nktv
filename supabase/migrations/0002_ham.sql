-- Các thao tác cần kiểm tra ở máy chủ: thẻ công khai, kích hoạt, điểm danh, xin nghỉ, hồ sơ, post-test.

/* ---------- Thẻ thành viên khi quét bằng camera thường ---------- */
create function public.the_thanh_vien(p_khoa text) returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object('ho_ten', ho_ten, 'gen', gen, 'nha', nha, 'cap', cap, 'hoat_dong', hoat_dong)
  from public.thanh_vien where khoa_qr = p_khoa
$$;

/* ---------- Kích hoạt tài khoản ---------- */
create function public.cap_ma_kich_hoat(p_ids uuid[])
returns table (id uuid, ma text, ho_ten text, ma_kich_hoat text)
language plpgsql security definer set search_path = '' as $$
declare
  bang constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  t record; m text; b bytea;
begin
  if not noi_bo.la_quan_tri() then raise exception 'Chỉ quản trị được cấp mã kích hoạt'; end if;
  for t in select x.id, x.ma, x.ho_ten from public.thanh_vien x where x.id = any(p_ids) order by x.ma loop
    b := extensions.gen_random_bytes(8); m := '';
    for i in 0..7 loop m := m || substr(bang, 1 + (get_byte(b, i) % length(bang)), 1); end loop;
    insert into public.kich_hoat (thanh_vien_id, ma_bam, het_han, tao_boi)
    values (t.id, extensions.crypt(m, extensions.gen_salt('bf', 8)), now() + interval '30 days', noi_bo.toi())
    on conflict (thanh_vien_id) do update set ma_bam = excluded.ma_bam, het_han = excluded.het_han, lan_sai = 0, khoa_den = null, tao_boi = excluded.tao_boi, tao_luc = now();
    id := t.id; ma := t.ma; ho_ten := t.ho_ten; ma_kich_hoat := m;
    return next;
  end loop;
end $$;

-- Chỉ hàm kich-hoat ở máy chủ gọi được. Sai 5 lần thì khóa mã 15 phút.
create function public.kiem_tra_kich_hoat(p_ma text, p_code text)
returns json language plpgsql security definer set search_path = '' as $$
declare t public.thanh_vien; k public.kich_hoat;
begin
  select * into t from public.thanh_vien where ma = upper(trim(p_ma));
  if t.id is null then return json_build_object('ok', false, 'loi', 'Mã thành viên hoặc mã kích hoạt không đúng.'); end if;
  select * into k from public.kich_hoat where thanh_vien_id = t.id;
  if k.thanh_vien_id is null then return json_build_object('ok', false, 'loi', 'Mã thành viên hoặc mã kích hoạt không đúng.'); end if;
  if k.khoa_den is not null and k.khoa_den > now() then return json_build_object('ok', false, 'loi', 'Sai quá nhiều lần. Thử lại sau 15 phút.'); end if;
  if k.het_han < now() then return json_build_object('ok', false, 'loi', 'Mã kích hoạt đã hết hạn. Xin Ban nhân sự cấp mã mới.'); end if;
  if k.ma_bam <> extensions.crypt(upper(trim(p_code)), k.ma_bam) then
    update public.kich_hoat set lan_sai = case when lan_sai >= 4 then 0 else lan_sai + 1 end,
      khoa_den = case when lan_sai >= 4 then now() + interval '15 minutes' else null end
    where thanh_vien_id = t.id;
    return json_build_object('ok', false, 'loi', 'Mã thành viên hoặc mã kích hoạt không đúng.');
  end if;
  return json_build_object('ok', true, 'id', t.id, 'ma', t.ma, 'user_id', t.user_id);
end $$;

create function public.hoan_tat_kich_hoat(p_id uuid, p_user uuid) returns void
language sql security definer set search_path = '' as $$
  update public.thanh_vien set user_id = p_user where id = p_id;
  delete from public.kich_hoat where thanh_vien_id = p_id;
$$;

create function public.tinh_trang_kich_hoat()
returns table (thanh_vien_id uuid, da_kich_hoat boolean, ma_con_han boolean)
language sql stable security definer set search_path = '' as $$
  select t.id, t.user_id is not null, coalesce(k.het_han > now(), false)
  from public.thanh_vien t left join public.kich_hoat k on k.thanh_vien_id = t.id
  where noi_bo.xem_duoc_ten()
$$;

/* ---------- Điểm danh ---------- */
create function noi_bo.dong_diem_danh(p_tu timestamptz, p_den timestamptz)
returns table (buoi_id uuid, thanh_vien_id uuid, trang_thai text, luc timestamptz, tre_phut int, cach text, ly_do text)
language sql stable security definer set search_path = '' as $$
  select b.id, t.id,
    case when d.thanh_vien_id is null then case when x.id is not null then 'phep' else 'vang' end
         when d.cach = 'bo_sung' or d.luc <= b.bat_dau + make_interval(mins => b.tre_sau_phut) then 'dung'
         else 'tre' end,
    d.luc,
    case when d.thanh_vien_id is not null and d.cach <> 'bo_sung' and d.luc > b.bat_dau + make_interval(mins => b.tre_sau_phut)
         then ceil(extract(epoch from d.luc - b.bat_dau) / 60)::int end,
    d.cach,
    x.ly_do
  from public.buoi b
  cross join public.thanh_vien t
  left join public.diem_danh d on d.buoi_id = b.id and d.thanh_vien_id = t.id
  left join public.xin_nghi x on x.buoi_id = b.id and x.thanh_vien_id = t.id and x.trang_thai = 'duyet'
  where b.bat_dau >= p_tu and b.bat_dau <= p_den
    and (d.thanh_vien_id is not null
      or (t.hoat_dong and (t.tham_gia_tu is null or t.tham_gia_tu <= (b.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date)))
$$;

create function public.ghi_diem_danh(p_buoi uuid, p_khoa text, p_tv uuid, p_luc timestamptz, p_cach text)
returns json language plpgsql security definer set search_path = '' as $$
declare b public.buoi; t public.thanh_vien; c text := coalesce(p_cach, 'qr'); l timestamptz := coalesce(p_luc, now()); cu public.diem_danh; moi boolean;
begin
  if not noi_bo.la_phu_trach() then raise exception 'Chỉ người phụ trách được ghi điểm danh'; end if;
  select * into b from public.buoi where id = p_buoi;
  if b.id is null then raise exception 'Không tìm thấy buổi'; end if;
  if b.dong and not noi_bo.la_quan_tri() then raise exception 'Buổi đã đóng. Nhờ quản trị mở lại nếu cần sửa.'; end if;
  if p_khoa is not null then select * into t from public.thanh_vien where khoa_qr = p_khoa;
  else select * into t from public.thanh_vien where id = p_tv; end if;
  if t.id is null then return json_build_object('ok', false, 'loi', 'Mã này không thuộc thành viên nào.'); end if;
  if l > now() + interval '5 minutes' then l := now(); end if;
  -- Ghi tay sau buổi hơn 8 giờ thì không lấy giờ bấm làm giờ đến.
  if c = 'tay' and l > b.bat_dau + interval '8 hours' then c := 'bo_sung'; l := b.bat_dau; end if;
  select * into cu from public.diem_danh where buoi_id = b.id and thanh_vien_id = t.id;
  moi := cu.buoi_id is null;
  insert into public.diem_danh (buoi_id, thanh_vien_id, luc, cach, ghi_boi) values (b.id, t.id, l, c, noi_bo.toi())
  on conflict (buoi_id, thanh_vien_id) do update set luc = least(public.diem_danh.luc, excluded.luc)
  returning * into cu;
  return json_build_object('ok', true, 'moi', moi, 'id', t.id, 'ma', t.ma, 'ho_ten', t.ho_ten, 'gen', t.gen, 'nha', t.nha, 'cap', t.cap,
    'hoat_dong', t.hoat_dong, 'luc', cu.luc, 'cach', cu.cach,
    'tre_phut', case when cu.cach <> 'bo_sung' and cu.luc > b.bat_dau + make_interval(mins => b.tre_sau_phut) then ceil(extract(epoch from cu.luc - b.bat_dau) / 60)::int end);
end $$;

create function public.xoa_diem_danh(p_buoi uuid, p_tv uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not noi_bo.la_phu_trach() then raise exception 'Chỉ người phụ trách được sửa điểm danh'; end if;
  if (select dong from public.buoi where id = p_buoi) and not noi_bo.la_quan_tri() then raise exception 'Buổi đã đóng. Nhờ quản trị mở lại nếu cần sửa.'; end if;
  delete from public.diem_danh where buoi_id = p_buoi and thanh_vien_id = p_tv;
end $$;

create function public.bang_diem_danh(p_buoi uuid)
returns table (thanh_vien_id uuid, ma text, ho_ten text, gen int, nha text, cap text, trang_thai text, luc timestamptz, tre_phut int, cach text, ly_do text)
language sql stable security definer set search_path = '' as $$
  select t.id, t.ma, t.ho_ten, t.gen, t.nha, t.cap, d.trang_thai, d.luc, d.tre_phut, d.cach, d.ly_do
  from public.buoi b
  cross join lateral noi_bo.dong_diem_danh(b.bat_dau, b.bat_dau) d
  join public.thanh_vien t on t.id = d.thanh_vien_id
  where b.id = p_buoi and d.buoi_id = p_buoi and noi_bo.xem_duoc_ten()
  order by t.ho_ten
$$;

-- Số tổng không kèm tên: mọi thành viên đã đăng nhập đều xem được.
create function public.so_tong_buoi(p_buoi uuid) returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'tong', count(*),
    'dung', count(*) filter (where d.trang_thai = 'dung'),
    'tre', count(*) filter (where d.trang_thai = 'tre'),
    'phep', count(*) filter (where d.trang_thai = 'phep'),
    'vang', count(*) filter (where d.trang_thai = 'vang'))
  from public.buoi b
  cross join lateral noi_bo.dong_diem_danh(b.bat_dau, b.bat_dau) d
  where b.id = p_buoi and d.buoi_id = p_buoi and noi_bo.toi() is not null
$$;

create function public.chuyen_can(p_tv uuid, p_tu timestamptz, p_den timestamptz) returns json
language plpgsql stable security definer set search_path = '' as $$
declare kq json;
begin
  if p_tv is distinct from noi_bo.toi() and not noi_bo.xem_duoc_ten() then raise exception 'Không có quyền xem chuyên cần của người này'; end if;
  select json_build_object(
    'tong', count(*), 'dung', count(*) filter (where d.trang_thai = 'dung'), 'tre', count(*) filter (where d.trang_thai = 'tre'),
    'phep', count(*) filter (where d.trang_thai = 'phep'), 'vang', count(*) filter (where d.trang_thai = 'vang'))
  into kq
  from noi_bo.dong_diem_danh(p_tu, least(p_den, now())) d
  join public.buoi b on b.id = d.buoi_id
  where d.thanh_vien_id = p_tv and b.tinh_chuyen_can and b.dong;
  return kq;
end $$;

create function public.lich_su_cua_toi(p_tu timestamptz, p_den timestamptz)
returns table (buoi_id uuid, trang_thai text, luc timestamptz, tre_phut int)
language sql stable security definer set search_path = '' as $$
  select d.buoi_id, d.trang_thai, d.luc, d.tre_phut
  from noi_bo.dong_diem_danh(p_tu, p_den) d where d.thanh_vien_id = noi_bo.toi()
$$;

create function public.bao_cao_chuyen_can(p_tu timestamptz, p_den timestamptz)
returns table (ma text, ho_ten text, gen int, nha text, cap text, tong bigint, dung bigint, tre bigint, phep bigint, vang bigint)
language sql stable security definer set search_path = '' as $$
  select t.ma, t.ho_ten, t.gen, t.nha, t.cap, count(*),
    count(*) filter (where d.trang_thai = 'dung'), count(*) filter (where d.trang_thai = 'tre'),
    count(*) filter (where d.trang_thai = 'phep'), count(*) filter (where d.trang_thai = 'vang')
  from noi_bo.dong_diem_danh(p_tu, least(p_den, now())) d
  join public.buoi b on b.id = d.buoi_id and b.tinh_chuyen_can and b.dong
  join public.thanh_vien t on t.id = d.thanh_vien_id
  where noi_bo.xem_duoc_ten()
  group by t.id order by t.nha nulls last, t.ho_ten
$$;

/* ---------- Xin nghỉ ---------- */
create function public.gui_xin_nghi(p_buoi uuid, p_ly_do text) returns void
language plpgsql security definer set search_path = '' as $$
declare t uuid := noi_bo.toi();
begin
  if t is null then raise exception 'Chưa đăng nhập'; end if;
  if coalesce(trim(p_ly_do), '') = '' then raise exception 'Cần ghi lý do'; end if;
  if exists (select 1 from public.xin_nghi where buoi_id = p_buoi and thanh_vien_id = t and trang_thai = 'duyet') then raise exception 'Đơn này đã được duyệt'; end if;
  insert into public.xin_nghi (buoi_id, thanh_vien_id, ly_do) values (p_buoi, t, trim(p_ly_do))
  on conflict (buoi_id, thanh_vien_id) do update set ly_do = excluded.ly_do, trang_thai = 'cho', gui_luc = now(), xu_ly_boi = null, xu_ly_luc = null, phan_hoi = null;
end $$;

create function public.huy_xin_nghi(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.xin_nghi where id = p_id and thanh_vien_id = noi_bo.toi() and trang_thai <> 'duyet';
  if not found then raise exception 'Đơn đã được duyệt hoặc không còn tồn tại'; end if;
end $$;

create function public.xu_ly_xin_nghi(p_id uuid, p_duyet boolean, p_phan_hoi text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not noi_bo.la_phu_trach() then raise exception 'Chỉ người phụ trách được xử lý đơn'; end if;
  update public.xin_nghi set trang_thai = case when p_duyet then 'duyet' else 'tu_choi' end, xu_ly_boi = noi_bo.toi(), xu_ly_luc = now(), phan_hoi = nullif(trim(coalesce(p_phan_hoi, '')), '') where id = p_id;
end $$;

-- Người phụ trách ghi hộ khi thành viên báo qua kênh khác; duyệt luôn.
create function public.ghi_vang_phep(p_buoi uuid, p_tv uuid, p_ly_do text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not noi_bo.la_phu_trach() then raise exception 'Chỉ người phụ trách được ghi vắng có phép'; end if;
  insert into public.xin_nghi (buoi_id, thanh_vien_id, ly_do, trang_thai, xu_ly_boi, xu_ly_luc) values (p_buoi, p_tv, coalesce(nullif(trim(p_ly_do), ''), 'Ghi hộ'), 'duyet', noi_bo.toi(), now())
  on conflict (buoi_id, thanh_vien_id) do update set ly_do = excluded.ly_do, trang_thai = 'duyet', xu_ly_boi = excluded.xu_ly_boi, xu_ly_luc = now();
end $$;

/* ---------- Hồ sơ năng lực ---------- */
create function public.gui_nang_luc(p_nang_luc uuid, p_bac int, p_trang_thai text, p_minh_chung text, p_lien_ket text) returns void
language plpgsql security definer set search_path = '' as $$
declare t uuid := noi_bo.toi();
begin
  if t is null then raise exception 'Chưa đăng nhập'; end if;
  if p_trang_thai not in ('dang_ren','cho') then raise exception 'Trạng thái không hợp lệ'; end if;
  if p_trang_thai = 'cho' and coalesce(trim(p_minh_chung), '') = '' then raise exception 'Cần ghi minh chứng khi xin xác nhận'; end if;
  if exists (select 1 from public.nang_luc_ghi_nhan where thanh_vien_id = t and nang_luc_id = p_nang_luc and bac = p_bac and trang_thai = 'dat') then raise exception 'Bậc này đã được xác nhận'; end if;
  insert into public.nang_luc_ghi_nhan (thanh_vien_id, nang_luc_id, bac, trang_thai, minh_chung, lien_ket) values (t, p_nang_luc, p_bac, p_trang_thai, nullif(trim(p_minh_chung), ''), nullif(trim(p_lien_ket), ''))
  on conflict (thanh_vien_id, nang_luc_id, bac) do update set trang_thai = excluded.trang_thai, minh_chung = excluded.minh_chung, lien_ket = excluded.lien_ket, gui_luc = now(), phan_hoi = null, xu_ly_boi = null, xu_ly_luc = null;
end $$;

create function public.xu_ly_nang_luc(p_id uuid, p_duyet boolean, p_ngay date, p_phan_hoi text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not noi_bo.la_quan_tri() then raise exception 'Chỉ quản trị được xác nhận năng lực'; end if;
  update public.nang_luc_ghi_nhan set trang_thai = case when p_duyet then 'dat' else 'tu_choi' end,
    ngay_dat = case when p_duyet then coalesce(p_ngay, current_date) end,
    xu_ly_boi = noi_bo.toi(), xu_ly_luc = now(), phan_hoi = nullif(trim(coalesce(p_phan_hoi, '')), '') where id = p_id;
end $$;

create function public.gui_hoat_dong(p_loai text, p_ten text, p_ngay date, p_so_gio numeric, p_lien_ket text) returns void
language plpgsql security definer set search_path = '' as $$
declare t uuid := noi_bo.toi();
begin
  if t is null then raise exception 'Chưa đăng nhập'; end if;
  if coalesce(trim(p_ten), '') = '' or p_ngay is null then raise exception 'Cần ghi tên và ngày của hoạt động'; end if;
  insert into public.hoat_dong_ghi_nhan (thanh_vien_id, loai, ten, ngay, so_gio, lien_ket) values (t, p_loai, trim(p_ten), p_ngay, p_so_gio, nullif(trim(p_lien_ket), ''));
end $$;

create function public.xu_ly_hoat_dong(p_id uuid, p_duyet boolean, p_phan_hoi text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not noi_bo.la_quan_tri() then raise exception 'Chỉ quản trị được xác nhận hoạt động'; end if;
  update public.hoat_dong_ghi_nhan set trang_thai = case when p_duyet then 'dat' else 'tu_choi' end, xu_ly_boi = noi_bo.toi(), xu_ly_luc = now(), phan_hoi = nullif(trim(coalesce(p_phan_hoi, '')), '') where id = p_id;
end $$;

/* ---------- Post-test ---------- */
create function noi_bo.cham(p_lam uuid, p_tra_loi jsonb, p_luc timestamptz, p_tu_dong boolean) returns public.lam_bai
language plpgsql security definer set search_path = '' as $$
declare l public.lam_bai; d int; n int;
begin
  select count(*), count(*) filter (where (p_tra_loi ->> c.id::text)::int = a.dung) into n, d
  from public.lam_bai x join public.cau_hoi c on c.bai_id = x.bai_id left join public.dap_an a on a.cau_hoi_id = c.id where x.id = p_lam;
  update public.lam_bai set tra_loi = p_tra_loi, nop_luc = p_luc, tu_dong = p_tu_dong, so_dung = d, tong = n,
    diem = case when n > 0 then round(d * 10.0 / n, 2) end where id = p_lam returning * into l;
  return l;
end $$;

-- Bài quá hạn 2 phút mà chưa gửi được thì chấm theo phần đã lưu tự động.
create function noi_bo.cham_qua_han(p_bai uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in select id, tra_loi, han_luc from public.lam_bai where nop_luc is null and han_luc + interval '2 minutes' < now() and (p_bai is null or bai_id = p_bai) loop
    perform noi_bo.cham(r.id, r.tra_loi, r.han_luc, true);
  end loop;
end $$;

create function public.luu_bai_test(p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := nullif(p ->> 'id', '')::uuid; c jsonb; co_lam boolean; so int; r record; v_cau uuid;
begin
  if not noi_bo.la_quan_tri() then raise exception 'Chỉ quản trị được soạn bài'; end if;
  if coalesce(trim(p ->> 'tieu_de'), '') = '' then raise exception 'Cần có tên bài'; end if;
  if p ->> 'trang_thai' = 'mo' then
    so := 0;
    for c in select * from jsonb_array_elements(p -> 'cau') loop
      so := so + 1;
      if jsonb_array_length(c -> 'lua_chon') < 2 then raise exception 'Câu % cần ít nhất 2 lựa chọn', so; end if;
      if (c ->> 'dung') is null or (c ->> 'dung')::int >= jsonb_array_length(c -> 'lua_chon') then raise exception 'Câu % chưa có đáp án đúng', so; end if;
    end loop;
    if so = 0 then raise exception 'Bài chưa có câu hỏi'; end if;
  end if;
  if v_id is null then
    insert into public.bai_test (tieu_de, mo_ta, thoi_gian_phut, mo_luc, dong_luc, so_lan, hien_dap_an, trang_thai, nguon_tep, tao_boi)
    values (p ->> 'tieu_de', p ->> 'mo_ta', (p ->> 'thoi_gian_phut')::int, (p ->> 'mo_luc')::timestamptz, (p ->> 'dong_luc')::timestamptz, (p ->> 'so_lan')::int, p ->> 'hien_dap_an', p ->> 'trang_thai', p ->> 'nguon_tep', noi_bo.toi())
    returning id into v_id;
  else
    update public.bai_test set tieu_de = p ->> 'tieu_de', mo_ta = p ->> 'mo_ta', thoi_gian_phut = (p ->> 'thoi_gian_phut')::int, mo_luc = (p ->> 'mo_luc')::timestamptz, dong_luc = (p ->> 'dong_luc')::timestamptz,
      so_lan = (p ->> 'so_lan')::int, hien_dap_an = p ->> 'hien_dap_an', trang_thai = p ->> 'trang_thai', nguon_tep = coalesce(p ->> 'nguon_tep', nguon_tep) where id = v_id;
  end if;
  co_lam := exists (select 1 from public.lam_bai where bai_id = v_id);
  if co_lam then
    -- Đã có người làm: giữ nguyên số câu, chỉ sửa chữ và đáp án, rồi chấm lại.
    if jsonb_array_length(p -> 'cau') <> (select count(*) from public.cau_hoi where bai_id = v_id) then raise exception 'Bài đã có người làm nên không thêm hoặc bớt câu được'; end if;
    for c in select * from jsonb_array_elements(p -> 'cau') loop
      update public.cau_hoi set phan = c ->> 'phan', noi_dung = c ->> 'noi_dung', lua_chon = c -> 'lua_chon' where id = (c ->> 'id')::uuid and bai_id = v_id;
      if (c ->> 'dung') is not null then
        insert into public.dap_an (cau_hoi_id, dung) values ((c ->> 'id')::uuid, (c ->> 'dung')::int) on conflict (cau_hoi_id) do update set dung = excluded.dung;
      end if;
    end loop;
    for r in select id, tra_loi, nop_luc, tu_dong from public.lam_bai where bai_id = v_id and nop_luc is not null loop
      perform noi_bo.cham(r.id, r.tra_loi, r.nop_luc, r.tu_dong);
    end loop;
  else
    delete from public.cau_hoi where bai_id = v_id;
    so := 0;
    for c in select * from jsonb_array_elements(p -> 'cau') loop
      so := so + 1;
      insert into public.cau_hoi (bai_id, thu_tu, phan, noi_dung, lua_chon) values (v_id, so, c ->> 'phan', c ->> 'noi_dung', c -> 'lua_chon') returning id into v_cau;
      if (c ->> 'dung') is not null then insert into public.dap_an (cau_hoi_id, dung) values (v_cau, (c ->> 'dung')::int); end if;
    end loop;
  end if;
  return v_id;
end $$;

create function public.bai_cua_toi() returns json
language plpgsql security definer set search_path = '' as $$
declare t uuid := noi_bo.toi(); kq json;
begin
  if t is null then raise exception 'Chưa đăng nhập'; end if;
  perform noi_bo.cham_qua_han(null);
  select coalesce(json_agg(x order by x.sap_xep desc), '[]') into kq from (
    select b.id, b.tieu_de, b.mo_ta, b.thoi_gian_phut, b.mo_luc, b.dong_luc, b.so_lan, b.hien_dap_an, coalesce(b.mo_luc, b.tao_luc) sap_xep,
      (select count(*) from public.cau_hoi c where c.bai_id = b.id) so_cau,
      (select count(*) from public.lam_bai l where l.bai_id = b.id and l.thanh_vien_id = t and l.nop_luc is not null) da_gui,
      (select max(l.diem) from public.lam_bai l where l.bai_id = b.id and l.thanh_vien_id = t) diem,
      (select l.han_luc from public.lam_bai l where l.bai_id = b.id and l.thanh_vien_id = t and l.nop_luc is null order by l.lan desc limit 1) dang_lam_den
    from public.bai_test b where b.trang_thai = 'mo') x;
  return kq;
end $$;

create function public.bat_dau_bai(p_bai uuid) returns json
language plpgsql security definer set search_path = '' as $$
declare t uuid := noi_bo.toi(); b public.bai_test; l public.lam_bai; n int;
begin
  if t is null then raise exception 'Chưa đăng nhập'; end if;
  select * into b from public.bai_test where id = p_bai and trang_thai = 'mo';
  if b.id is null then raise exception 'Bài chưa mở'; end if;
  perform noi_bo.cham_qua_han(p_bai);
  select * into l from public.lam_bai where bai_id = p_bai and thanh_vien_id = t and nop_luc is null order by lan desc limit 1;
  if l.id is null then
    if b.mo_luc is not null and b.mo_luc > now() then raise exception 'Bài chưa đến giờ mở'; end if;
    if b.dong_luc is not null and b.dong_luc <= now() then raise exception 'Bài đã đóng'; end if;
    select count(*) into n from public.lam_bai where bai_id = p_bai and thanh_vien_id = t;
    if n >= b.so_lan then raise exception 'Đã hết số lần làm bài'; end if;
    insert into public.lam_bai (bai_id, thanh_vien_id, lan, han_luc)
    values (p_bai, t, n + 1, least(now() + make_interval(mins => b.thoi_gian_phut), coalesce(b.dong_luc, 'infinity'::timestamptz)))
    returning * into l;
  end if;
  return json_build_object('lam_id', l.id, 'han_luc', l.han_luc, 'bay_gio', now(), 'tra_loi', l.tra_loi, 'tieu_de', b.tieu_de, 'cau',
    (select json_agg(json_build_object('id', c.id, 'thu_tu', c.thu_tu, 'phan', c.phan, 'noi_dung', c.noi_dung, 'lua_chon', c.lua_chon) order by c.thu_tu) from public.cau_hoi c where c.bai_id = p_bai));
end $$;

create function public.luu_tam_bai(p_lam uuid, p_tra_loi jsonb) returns void
language sql security definer set search_path = '' as $$
  update public.lam_bai set tra_loi = p_tra_loi
  where id = p_lam and thanh_vien_id = noi_bo.toi() and nop_luc is null and now() <= han_luc + interval '2 minutes'
$$;

create function public.gui_bai(p_lam uuid, p_tra_loi jsonb) returns json
language plpgsql security definer set search_path = '' as $$
declare l public.lam_bai;
begin
  select * into l from public.lam_bai where id = p_lam and thanh_vien_id = noi_bo.toi();
  if l.id is null then raise exception 'Không tìm thấy bài làm'; end if;
  if l.nop_luc is null then
    if now() <= l.han_luc + interval '2 minutes' then l := noi_bo.cham(p_lam, coalesce(p_tra_loi, l.tra_loi), now(), false);
    else l := noi_bo.cham(p_lam, l.tra_loi, l.han_luc, true); end if;
  end if;
  return json_build_object('so_dung', l.so_dung, 'tong', l.tong, 'diem', l.diem, 'tu_dong', l.tu_dong);
end $$;

create function public.xem_lai_bai(p_bai uuid) returns json
language plpgsql security definer set search_path = '' as $$
declare t uuid := noi_bo.toi(); b public.bai_test; l public.lam_bai; duoc boolean;
begin
  select * into b from public.bai_test where id = p_bai and trang_thai = 'mo';
  if b.id is null or t is null then raise exception 'Không xem được bài này'; end if;
  perform noi_bo.cham_qua_han(p_bai);
  select * into l from public.lam_bai where bai_id = p_bai and thanh_vien_id = t and nop_luc is not null order by diem desc nulls last, lan desc limit 1;
  if l.id is null then raise exception 'Chưa có bài đã gửi'; end if;
  duoc := b.hien_dap_an = 'sau_gui' or (b.hien_dap_an = 'sau_dong' and b.dong_luc is not null and b.dong_luc <= now());
  return json_build_object('tieu_de', b.tieu_de, 'so_dung', l.so_dung, 'tong', l.tong, 'diem', l.diem, 'nop_luc', l.nop_luc, 'tu_dong', l.tu_dong, 'hien_dap_an', duoc, 'hien_dap_an_kieu', b.hien_dap_an, 'dong_luc', b.dong_luc,
    'cau', case when duoc then (select json_agg(json_build_object('thu_tu', c.thu_tu, 'phan', c.phan, 'noi_dung', c.noi_dung, 'lua_chon', c.lua_chon, 'chon', (l.tra_loi ->> c.id::text)::int, 'dung', a.dung) order by c.thu_tu)
      from public.cau_hoi c left join public.dap_an a on a.cau_hoi_id = c.id where c.bai_id = p_bai) end);
end $$;

create function public.thong_ke_bai(p_bai uuid) returns json
language plpgsql security definer set search_path = '' as $$
declare kq json;
begin
  if not noi_bo.la_quan_tri() then raise exception 'Chỉ quản trị xem được thống kê'; end if;
  perform noi_bo.cham_qua_han(p_bai);
  with tot as (
    select distinct on (l.thanh_vien_id) l.* from public.lam_bai l where l.bai_id = p_bai and l.nop_luc is not null
    order by l.thanh_vien_id, l.diem desc nulls last, l.lan desc
  )
  select json_build_object(
    'doi_tuong', (select count(*) from public.thanh_vien where hoat_dong),
    'da_gui', (select count(*) from tot),
    'tb', (select round(avg(diem), 2) from tot), 'cao', (select max(diem) from tot), 'thap', (select min(diem) from tot),
    'ds', (select coalesce(json_agg(json_build_object('ma', t.ma, 'ho_ten', t.ho_ten, 'gen', t.gen, 'nha', t.nha, 'diem', k.diem, 'so_dung', k.so_dung, 'tong', k.tong, 'nop_luc', k.nop_luc, 'tu_dong', k.tu_dong) order by k.diem desc nulls last, t.ho_ten), '[]')
      from public.thanh_vien t left join tot k on k.thanh_vien_id = t.id where t.hoat_dong or k.id is not null),
    'cau', (select coalesce(json_agg(json_build_object('thu_tu', c.thu_tu, 'noi_dung', c.noi_dung, 'lua_chon', c.lua_chon, 'dung', a.dung,
        'dem', (select coalesce(jsonb_object_agg(v.chon, v.n), '{}') from (select k.tra_loi ->> c.id::text chon, count(*) n from tot k where k.tra_loi ? c.id::text group by 1) v)) order by c.thu_tu), '[]')
      from public.cau_hoi c left join public.dap_an a on a.cau_hoi_id = c.id where c.bai_id = p_bai)
  ) into kq;
  return kq;
end $$;

/* ---------- Ai gọi được hàm nào ---------- */
do $$
declare f record;
begin
  for f in select p.oid::regprocedure sig, p.proname from pg_proc p where p.pronamespace = 'public'::regnamespace loop
    execute format('revoke all on function %s from public, anon', f.sig);
    if f.proname in ('kiem_tra_kich_hoat', 'hoan_tat_kich_hoat') then
      execute format('revoke all on function %s from authenticated', f.sig);
      execute format('grant execute on function %s to service_role', f.sig);
    else
      execute format('grant execute on function %s to authenticated', f.sig);
    end if;
  end loop;
end $$;
grant execute on function public.the_thanh_vien(text) to anon;
revoke all on all functions in schema noi_bo from public, anon;
grant execute on all functions in schema noi_bo to authenticated, service_role;
