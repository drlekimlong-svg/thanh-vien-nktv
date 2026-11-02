-- Nội dung buổi tạo từ lịch ghi "Nhóm Kirin", "Cố vấn" thay vì mã nội bộ.
create function noi_bo.nhan_thuoc(p text) returns text language sql immutable set search_path = '' as $$
  select case when p = 'bcv' then 'Cố vấn' when p = 'khach' then 'Khách mời' when p = 'koi' then 'Nhóm Yin-Yang Kois'
    when noi_bo.ten_nha(p) is not null then 'Nhóm ' || noi_bo.ten_nha(p) else nullif(p, '') end
$$;
create or replace function noi_bo.dong_bo_lich(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  l public.lich; d jsonb; gio text; bd timestamptz; kt timestamptz; v_ten text; dd text; nd text; b public.buoi; so int; moi boolean := false;
begin
  select * into l from public.lich where id = p_id;
  d := l.du_lieu;
  gio := case when d ->> 'gioBD' ~ '^\d{1,2}:\d{2}$' then d ->> 'gioBD' else '14:00' end;
  bd := ((l.ngay::text || ' ' || gio)::timestamp) at time zone 'Asia/Ho_Chi_Minh';
  kt := case when d ->> 'gioKT' ~ '^\d{1,2}:\d{2}$' then ((l.ngay::text || ' ' || (d ->> 'gioKT'))::timestamp) at time zone 'Asia/Ho_Chi_Minh' end;
  v_ten := case when l.loai = 'tuan' then 'Sinh hoạt hằng tuần' else coalesce(nullif(trim(l.ten), ''), 'Chương trình đặc biệt') end;
  dd := nullif(concat_ws(', ', nullif(trim(d ->> 'dd1'), ''), nullif(trim(d ->> 'dd2'), '')), '');
  select string_agg(concat_ws(' ', nullif(concat_ws('–', nullif(m.gio_bd, ''), nullif(m.gio_kt, '')), ''), m.noi_dung,
      case when nullif(concat_ws(' – ', nullif(m.nguoi, ''), noi_bo.nhan_thuoc(m.thuoc)), '') is not null then '(' || concat_ws(' – ', nullif(m.nguoi, ''), noi_bo.nhan_thuoc(m.thuoc)) || ')' end), E'\n' order by m.thu_tu)
    into nd from public.lich_muc m where m.lich_id = p_id;
  if l.loai = 'dacbiet' and nullif(trim(d ->> 'moTa'), '') is not null then nd := trim(d ->> 'moTa') || coalesce(E'\n\n' || nd, ''); end if;

  if l.buoi_id is not null then select * into b from public.buoi where id = l.buoi_id; end if;
  if b.id is null then
    -- Người phụ trách đã tạo sẵn buổi cho ngày này thì gắn vào, không tạo buổi trùng.
    if l.loai = 'tuan' then
      select count(*) into so from public.buoi x where (x.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date = l.ngay and not exists (select 1 from public.lich y where y.buoi_id = x.id);
      if so = 1 then select x.* into b from public.buoi x where (x.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date = l.ngay and not exists (select 1 from public.lich y where y.buoi_id = x.id); end if;
    else
      select x.* into b from public.buoi x where x.bat_dau = bd and not exists (select 1 from public.lich y where y.buoi_id = x.id) limit 1;
    end if;
  end if;
  if b.id is null then
    insert into public.buoi (ten, bat_dau, ket_thuc, dia_diem, noi_dung, nhom_truc, chu_tri, tinh_chuyen_can, tao_boi)
    values (v_ten, bd, kt, dd, nd, noi_bo.ten_nha(l.nhom), nullif(trim(d ->> 'chuTri'), ''), l.loai = 'tuan', l.nguoi_tao) returning * into b;
    moi := true;
  elsif b.dong then
    -- Buổi đã đóng: giữ nguyên giờ để không làm đổi kết quả điểm danh.
    update public.buoi set noi_dung = nd, dia_diem = dd, nhom_truc = noi_bo.ten_nha(l.nhom), chu_tri = nullif(trim(d ->> 'chuTri'), '') where id = b.id;
  else
    update public.buoi set ten = v_ten, bat_dau = bd, ket_thuc = kt, dia_diem = dd, noi_dung = nd, nhom_truc = noi_bo.ten_nha(l.nhom), chu_tri = nullif(trim(d ->> 'chuTri'), '') where id = b.id;
  end if;
  update public.lich set buoi_id = b.id, tao_buoi = case when l.buoi_id = b.id then tao_buoi else moi end where id = p_id;
end $$;
revoke all on function noi_bo.nhan_thuoc(text), noi_bo.dong_bo_lich(uuid) from public, anon;
grant execute on function noi_bo.nhan_thuoc(text), noi_bo.dong_bo_lich(uuid) to authenticated, service_role;
