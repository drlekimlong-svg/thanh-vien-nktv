-- Phân quyền (anh Long yêu cầu 03/11/2026). Áp dụng cùng lúc với bản giao diện có màn Phân quyền.
-- Ban cố vấn: gần đủ quyền quản trị. Chỉ quản trị giữ ba việc: phân quyền, sửa danh sách thành viên, cấp mã kích hoạt (agent đề xuất).
-- Junior, Senior: chưa có quyền riêng. Nhóm trưởng, nhóm phó: soạn và gửi lịch cho nhà mình.
alter table public.thanh_vien add column chuc_vu text check (chuc_vu in ('nhom_truong', 'nhom_pho'));
alter table public.thanh_vien add constraint thanh_vien_chuc_vu_nha check (chuc_vu is null or nha is not null);

create function noi_bo.la_admin() returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.thanh_vien where user_id = auth.uid() and vai_tro = 'quan_tri') $$;
create or replace function noi_bo.la_quan_tri() returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.thanh_vien where user_id = auth.uid() and (vai_tro = 'quan_tri' or cap = 'Ban cố vấn')) $$;
create or replace function noi_bo.la_phu_trach() returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.thanh_vien where user_id = auth.uid() and (vai_tro in ('quan_tri', 'diem_danh') or cap = 'Ban cố vấn')) $$;

drop policy them on public.thanh_vien;
drop policy sua on public.thanh_vien;
drop policy xoa on public.thanh_vien;
create policy them on public.thanh_vien for insert to authenticated with check ((select noi_bo.la_admin()));
create policy sua on public.thanh_vien for update to authenticated using ((select noi_bo.la_admin())) with check ((select noi_bo.la_admin()));
create policy xoa on public.thanh_vien for delete to authenticated using ((select noi_bo.la_admin()));

-- Luôn còn ít nhất một quản trị đã kích hoạt, để không ai tự khóa mình khỏi màn Phân quyền.
create function noi_bo.giu_quan_tri() returns trigger language plpgsql set search_path = '' as $$
begin
  if old.vai_tro = 'quan_tri' and old.user_id is not null
     and (tg_op = 'DELETE' or new.vai_tro <> 'quan_tri' or new.user_id is null)
     and not exists (select 1 from public.thanh_vien x where x.vai_tro = 'quan_tri' and x.user_id is not null and x.id <> old.id) then
    raise exception 'Cần giữ ít nhất một tài khoản quản trị đã kích hoạt';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;
create trigger giu_quan_tri before update or delete on public.thanh_vien for each row execute function noi_bo.giu_quan_tri();

create or replace function public.cap_ma_kich_hoat(p_ids uuid[])
returns table (id uuid, ma text, ho_ten text, ma_kich_hoat text)
language plpgsql security definer set search_path = '' as $$
declare
  bang constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  t record; m text; b bytea;
begin
  if not noi_bo.la_admin() then raise exception 'Chỉ quản trị được cấp mã kích hoạt'; end if;
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

/* ---------- Ai soạn lịch được ---------- */
create function noi_bo.tao_duoc_lich(p_nhom text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.thanh_vien t where t.user_id = auth.uid()
    and (t.vai_tro in ('quan_tri', 'diem_danh') or t.cap = 'Ban cố vấn' or (t.chuc_vu is not null and t.nha = noi_bo.ten_nha(p_nhom))))
$$;
-- Sửa, xóa, xem bản nháp: cùng quyền với soạn lịch cho nhà đó.
create or replace function noi_bo.sua_duoc_lich(p_nguoi_tao uuid, p_nhom text) returns boolean
language sql stable security definer set search_path = '' as $$
  select noi_bo.tao_duoc_lich(p_nhom)
$$;

create or replace function public.luu_lich(p_id uuid, p_du_lieu jsonb, p_gui boolean) returns json
language plpgsql security definer set search_path = '' as $$
declare
  t uuid := noi_bo.toi(); v_nguoi text; l public.lich; v_loai text; v_nhom text; v_ngay date; v_ten text; lan_dau boolean;
begin
  if t is null then raise exception 'Chưa đăng nhập'; end if;
  if octet_length(p_du_lieu::text) > 30000 then raise exception 'Lịch quá dài'; end if;
  v_nhom := p_du_lieu ->> 'nhom';
  if v_nhom is null or noi_bo.ten_nha(v_nhom) is null then raise exception 'Chưa chọn nhóm trực'; end if;
  if not noi_bo.tao_duoc_lich(v_nhom) then
    raise exception 'Chỉ nhóm trưởng, nhóm phó nhà %, Ban cố vấn và người phụ trách được soạn lịch cho nhà này.', noi_bo.ten_nha(v_nhom);
  end if;
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

create or replace function public.toi_la_ai() returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object('id', id, 'ma', ma, 'ho_ten', ho_ten, 'gen', gen, 'nha', nha, 'cap', cap, 'hoat_dong', hoat_dong,
    'khoa_qr', khoa_qr, 'vai_tro', vai_tro, 'chuc_vu', chuc_vu,
    'la_admin', vai_tro = 'quan_tri',
    'la_quan_tri', vai_tro = 'quan_tri' or cap = 'Ban cố vấn',
    'la_phu_trach', vai_tro in ('quan_tri', 'diem_danh') or cap = 'Ban cố vấn',
    'xem_duoc_ten', vai_tro in ('quan_tri', 'diem_danh') or cap = 'Ban cố vấn',
    'lich_moi_nha', vai_tro in ('quan_tri', 'diem_danh') or cap = 'Ban cố vấn',
    'lich_nha', case when chuc_vu is not null then nha end)
  from public.thanh_vien where user_id = auth.uid()
$$;

revoke all on all functions in schema noi_bo from public, anon;
grant execute on all functions in schema noi_bo to authenticated, service_role;
