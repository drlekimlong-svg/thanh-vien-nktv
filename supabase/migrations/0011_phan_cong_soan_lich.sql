-- Phân công soạn lịch (anh Long yêu cầu 10/11/2026): ngoài nhóm trưởng, nhóm phó, Ban cố vấn và người phụ trách điểm danh,
-- quản trị hoặc Ban cố vấn phân công thêm người soạn và gửi lịch cho từng nhà. Phân công có thể kèm ngày hết hạn;
-- để trống là tới khi gỡ (agent đề xuất cách làm, anh duyệt và áp dụng 10/11/2026).

create table public.phan_cong_lich (
  thanh_vien_id uuid not null references public.thanh_vien(id) on delete cascade,
  nha text not null check (nha in ('Seiryu','Suzaku','Byakko','Genbu','Kirin','Yin-Yang Kois')),
  den_ngay date,
  giao_boi uuid references public.thanh_vien(id) on delete set null,
  giao_luc timestamptz not null default now(),
  primary key (thanh_vien_id, nha)
);
create index on public.phan_cong_lich (nha);
alter table public.phan_cong_lich enable row level security;
revoke all on public.phan_cong_lich from anon;
revoke insert, update, delete on public.phan_cong_lich from authenticated;
grant select on public.phan_cong_lich to authenticated;
create policy doc on public.phan_cong_lich for select to authenticated
  using (thanh_vien_id = (select noi_bo.toi()) or (select noi_bo.xem_duoc_ten()));

-- Ngày theo giờ Việt Nam, để phân công "đến hết ngày 15/11" còn hiệu lực tới nửa đêm 15/11.
create function noi_bo.hom_nay() returns date language sql stable set search_path = '' as
$$ select (now() at time zone 'Asia/Ho_Chi_Minh')::date $$;

create or replace function noi_bo.tao_duoc_lich(p_nhom text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.thanh_vien t where t.user_id = auth.uid()
    and (t.vai_tro in ('quan_tri', 'diem_danh') or t.cap = 'Ban cố vấn' or (t.chuc_vu is not null and t.nha = noi_bo.ten_nha(p_nhom))
      or exists (select 1 from public.phan_cong_lich p where p.thanh_vien_id = t.id and p.nha = noi_bo.ten_nha(p_nhom)
        and (p.den_ngay is null or p.den_ngay >= noi_bo.hom_nay()))))
$$;

-- Đặt lại danh sách người được phân công của một nhà; người bỏ chọn bị gỡ, người chọn nhận chung một ngày hết hạn.
create function public.dat_phan_cong_lich(p_nha text, p_ids uuid[], p_den_ngay date) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not noi_bo.la_quan_tri() then raise exception 'Chỉ quản trị và Ban cố vấn được phân công soạn lịch'; end if;
  if p_nha is null or p_nha not in ('Seiryu','Suzaku','Byakko','Genbu','Kirin','Yin-Yang Kois') then raise exception 'Chưa chọn nhà'; end if;
  if p_den_ngay is not null and p_den_ngay < noi_bo.hom_nay() then raise exception 'Ngày hết hạn đã qua'; end if;
  delete from public.phan_cong_lich where nha = p_nha and not (thanh_vien_id = any(coalesce(p_ids, '{}')));
  insert into public.phan_cong_lich (thanh_vien_id, nha, den_ngay, giao_boi)
  select t.id, p_nha, p_den_ngay, noi_bo.toi() from public.thanh_vien t where t.id = any(coalesce(p_ids, '{}')) and t.user_id is not null
  on conflict (thanh_vien_id, nha) do update set den_ngay = excluded.den_ngay, giao_boi = excluded.giao_boi, giao_luc = now();
end $$;

-- Giữ nguyên luu_lich của 0009, chỉ đổi câu báo khi không có quyền.
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
    raise exception 'Bạn chưa được soạn lịch cho nhà %. Nhóm trưởng, nhóm phó của nhà, người được phân công, Ban cố vấn và người phụ trách soạn được.', noi_bo.ten_nha(v_nhom);
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
  select json_build_object('id', t.id, 'ma', t.ma, 'ho_ten', t.ho_ten, 'gen', t.gen, 'nha', t.nha, 'cap', t.cap, 'hoat_dong', t.hoat_dong,
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
    'bay_gio', now())
  from public.thanh_vien t where t.user_id = auth.uid()
$$;

revoke all on function public.dat_phan_cong_lich(text, uuid[], date) from public, anon;
grant execute on function public.dat_phan_cong_lich(text, uuid[], date) to authenticated;
revoke all on all functions in schema noi_bo from public, anon;
grant execute on all functions in schema noi_bo to authenticated, service_role;
