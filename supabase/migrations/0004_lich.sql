-- Kho lịch sinh hoạt: mỗi lịch giữ nguyên dữ liệu để vẽ lại ảnh, và tách từng mục để thống kê về sau.
create table public.lich (
  id uuid primary key default gen_random_uuid(),
  buoi_id uuid unique references public.buoi(id) on delete set null,
  loai text not null check (loai in ('tuan','dacbiet')),
  nhom text not null check (nhom in ('seiryu','suzaku','byakko','genbu','kirin','koi')),
  ngay date,
  ten text,
  trang_thai text not null default 'nhap' check (trang_thai in ('nhap','da_gui')),
  du_lieu jsonb not null,
  tao_buoi boolean not null default false,
  nguoi_tao uuid references public.thanh_vien(id) on delete set null,
  nguoi_tao_ten text,
  tao_luc timestamptz not null default now(),
  nguoi_sua_ten text,
  sua_luc timestamptz not null default now(),
  gui_luc timestamptz
);
create index on public.lich (ngay desc);
create index on public.lich (nguoi_tao);

create table public.lich_muc (
  id uuid primary key default gen_random_uuid(),
  lich_id uuid not null references public.lich(id) on delete cascade,
  thu_tu int not null,
  gio_bd text,
  gio_kt text,
  noi_dung text,
  nguoi text,
  thuoc text
);
create index on public.lich_muc (lich_id);

-- Nhóm trực soạn lịch: người tạo, thành viên cùng nhà và người phụ trách đều sửa được.
create function noi_bo.ten_nha(p_khoa text) returns text language sql immutable set search_path = '' as $$
  select case p_khoa when 'seiryu' then 'Seiryu' when 'suzaku' then 'Suzaku' when 'byakko' then 'Byakko'
    when 'genbu' then 'Genbu' when 'kirin' then 'Kirin' when 'koi' then 'YinYang Kois' end
$$;
create function noi_bo.sua_duoc_lich(p_nguoi_tao uuid, p_nhom text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.thanh_vien t where t.user_id = auth.uid()
    and (t.vai_tro in ('quan_tri','diem_danh') or t.id = p_nguoi_tao or t.nha = noi_bo.ten_nha(p_nhom)))
$$;

alter table public.lich enable row level security;
alter table public.lich_muc enable row level security;
revoke all on public.lich, public.lich_muc from anon;
grant select on public.lich, public.lich_muc to authenticated;
create policy doc on public.lich for select to authenticated
  using ((trang_thai = 'da_gui' and (select noi_bo.toi()) is not null) or noi_bo.sua_duoc_lich(nguoi_tao, nhom));
create policy doc on public.lich_muc for select to authenticated
  using (exists (select 1 from public.lich l where l.id = lich_id));

/* Tạo hoặc cập nhật buổi tương ứng, để lịch hiện ở tab Lịch và dùng được cho điểm danh. */
create function noi_bo.dong_bo_lich(p_id uuid) returns void
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
      case when nullif(concat_ws(' – ', nullif(m.nguoi, ''), nullif(m.thuoc, '')), '') is not null then '(' || concat_ws(' – ', nullif(m.nguoi, ''), nullif(m.thuoc, '')) || ')' end), E'\n' order by m.thu_tu)
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

create function public.luu_lich(p_id uuid, p_du_lieu jsonb, p_gui boolean) returns json
language plpgsql security definer set search_path = '' as $$
declare
  t uuid := noi_bo.toi(); v_nguoi text; l public.lich; v_loai text; v_nhom text; v_ngay date; v_ten text; lan_dau boolean;
begin
  if t is null then raise exception 'Chưa đăng nhập'; end if;
  if octet_length(p_du_lieu::text) > 30000 then raise exception 'Lịch quá dài'; end if;
  v_nhom := p_du_lieu ->> 'nhom';
  if v_nhom is null or noi_bo.ten_nha(v_nhom) is null then raise exception 'Chưa chọn nhóm trực'; end if;
  v_loai := case when p_du_lieu ->> 'mau' = 'dacbiet' then 'dacbiet' else 'tuan' end;
  if p_du_lieu ->> 'ngay' ~ '^\d{4}-\d{2}-\d{2}$' then v_ngay := (p_du_lieu ->> 'ngay')::date; end if;
  v_ten := case when v_loai = 'dacbiet' then nullif(trim(p_du_lieu ->> 'tenCT'), '') else 'Lịch sinh hoạt tuần' end;
  if p_gui and v_ngay is null then raise exception 'Chưa chọn ngày sinh hoạt'; end if;
  if p_gui and v_ten is null then raise exception 'Chưa có tên chương trình'; end if;
  select ho_ten into v_nguoi from public.thanh_vien where id = t;
  if p_id is null then
    insert into public.lich (loai, nhom, ngay, ten, du_lieu, nguoi_tao, nguoi_tao_ten, nguoi_sua_ten)
    values (v_loai, v_nhom, v_ngay, v_ten, p_du_lieu, t, v_nguoi, v_nguoi) returning * into l;
  else
    select * into l from public.lich where id = p_id;
    if l.id is null then raise exception 'Không tìm thấy lịch này'; end if;
    if not noi_bo.sua_duoc_lich(l.nguoi_tao, l.nhom) then raise exception 'Không có quyền sửa lịch này'; end if;
    update public.lich set loai = v_loai, nhom = v_nhom, ngay = v_ngay, ten = v_ten, du_lieu = p_du_lieu, nguoi_sua_ten = v_nguoi, sua_luc = now() where id = p_id returning * into l;
  end if;
  delete from public.lich_muc where lich_id = l.id;
  insert into public.lich_muc (lich_id, thu_tu, gio_bd, gio_kt, noi_dung, nguoi, thuoc)
  select l.id, r.n, r.v ->> 't1', r.v ->> 't2', left(r.v ->> 'title', 200), left(r.v ->> 'who', 80), r.v ->> 'org'
  from jsonb_array_elements(case when jsonb_typeof(p_du_lieu -> 'rows') = 'array' then p_du_lieu -> 'rows' else '[]'::jsonb end) with ordinality r(v, n)
  where r.n <= 12 and (coalesce(trim(r.v ->> 'title'), '') <> '' or coalesce(r.v ->> 't1', '') <> '');
  lan_dau := p_gui and l.gui_luc is null;
  if p_gui then update public.lich set trang_thai = 'da_gui', gui_luc = coalesce(gui_luc, now()) where id = l.id returning * into l; end if;
  if l.trang_thai = 'da_gui' then
    perform noi_bo.dong_bo_lich(l.id);
    select * into l from public.lich where id = l.id;
  end if;
  if lan_dau then
    insert into public.thong_bao (tieu_de, noi_dung, tac_gia)
    select case when v_loai = 'tuan' then 'Lịch sinh hoạt tuần ' || to_char(v_ngay, 'DD/MM/YYYY') else v_ten end,
      concat_ws(E'\n', to_char(b.bat_dau at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI DD/MM/YYYY'), 'Địa điểm: ' || b.dia_diem, 'Nhóm trực: ' || b.nhom_truc, 'Chủ trì: ' || b.chu_tri, E'\n' || b.noi_dung), t
    from public.buoi b where b.id = l.buoi_id;
  end if;
  return json_build_object('id', l.id, 'buoi_id', l.buoi_id, 'trang_thai', l.trang_thai);
end $$;

create function public.xoa_lich(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare l public.lich;
begin
  select * into l from public.lich where id = p_id;
  if l.id is null then raise exception 'Không tìm thấy lịch này'; end if;
  if not noi_bo.sua_duoc_lich(l.nguoi_tao, l.nhom) then raise exception 'Không có quyền xóa lịch này'; end if;
  delete from public.lich where id = p_id;
  -- Chỉ xóa buổi do chính lịch này tạo và chưa có điểm danh hay đơn xin nghỉ.
  if l.tao_buoi and l.buoi_id is not null
    and not exists (select 1 from public.diem_danh d where d.buoi_id = l.buoi_id)
    and not exists (select 1 from public.xin_nghi x where x.buoi_id = l.buoi_id) then
    delete from public.buoi where id = l.buoi_id;
  end if;
end $$;

revoke all on function public.luu_lich(uuid, jsonb, boolean), public.xoa_lich(uuid) from public, anon;
grant execute on function public.luu_lich(uuid, jsonb, boolean), public.xoa_lich(uuid) to authenticated;
revoke all on function noi_bo.ten_nha(text), noi_bo.sua_duoc_lich(uuid, text), noi_bo.dong_bo_lich(uuid) from public, anon;
grant execute on function noi_bo.ten_nha(text), noi_bo.sua_duoc_lich(uuid, text), noi_bo.dong_bo_lich(uuid) to authenticated, service_role;
