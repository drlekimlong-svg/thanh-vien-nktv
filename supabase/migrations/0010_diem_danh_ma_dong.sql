-- Điểm danh (anh Long yêu cầu 08/11/2026):
-- 1. Quyền điểm danh theo từng buổi: quản trị hoặc Ban cố vấn giao cho ai thì người đó quét và ghi tay được buổi đó, tới khi buổi đóng.
-- 2. Mã điểm danh động: mã trên app đổi sau mỗi 20 giây, ký bằng khóa riêng của từng người, nên ảnh chụp gửi cho bạn không dùng được lâu.
--    Cài đặt chi_nhan_ma_dong (mặc định bật): mã cố định trên thẻ in hoặc ảnh chụp không còn dùng để quét; ghi tay vẫn được.

/* ---------- Người được giao điểm danh từng buổi ---------- */
create table public.buoi_diem_danh (
  buoi_id uuid not null references public.buoi(id) on delete cascade,
  thanh_vien_id uuid not null references public.thanh_vien(id) on delete cascade,
  giao_boi uuid references public.thanh_vien(id) on delete set null,
  giao_luc timestamptz not null default now(),
  primary key (buoi_id, thanh_vien_id)
);
create index on public.buoi_diem_danh (thanh_vien_id);
alter table public.buoi_diem_danh enable row level security;
revoke all on public.buoi_diem_danh from anon;
grant select on public.buoi_diem_danh to authenticated;
create policy doc on public.buoi_diem_danh for select to authenticated
  using (thanh_vien_id = (select noi_bo.toi()) or (select noi_bo.xem_duoc_ten()));

create function noi_bo.duoc_diem_danh(p_buoi uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select noi_bo.la_phu_trach() or exists (select 1 from public.buoi_diem_danh g join public.buoi b on b.id = g.buoi_id
    where g.buoi_id = p_buoi and g.thanh_vien_id = noi_bo.toi() and not b.dong)
$$;

create function public.dat_nguoi_diem_danh(p_buoi uuid, p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not noi_bo.la_quan_tri() then raise exception 'Chỉ quản trị và Ban cố vấn được giao quyền điểm danh'; end if;
  if not exists (select 1 from public.buoi where id = p_buoi) then raise exception 'Không tìm thấy buổi'; end if;
  delete from public.buoi_diem_danh where buoi_id = p_buoi and not (thanh_vien_id = any(coalesce(p_ids, '{}')));
  insert into public.buoi_diem_danh (buoi_id, thanh_vien_id, giao_boi)
  select p_buoi, t.id, noi_bo.toi() from public.thanh_vien t where t.id = any(coalesce(p_ids, '{}')) and t.user_id is not null
  on conflict do nothing;
end $$;

/* ---------- Khóa riêng cho mã động ---------- */
-- Không ai đọc thẳng bảng này; mỗi người lấy khóa của chính mình qua ma_dong_cua_toi.
create table public.khoa_dong (
  thanh_vien_id uuid primary key references public.thanh_vien(id) on delete cascade,
  bi_mat text not null default encode(extensions.gen_random_bytes(20), 'hex'),
  tao_luc timestamptz not null default now()
);
alter table public.khoa_dong enable row level security;
revoke all on public.khoa_dong from anon, authenticated;

create function public.ma_dong_cua_toi() returns json
language plpgsql security definer set search_path = '' as $$
declare t public.thanh_vien; bm text;
begin
  select * into t from public.thanh_vien where user_id = auth.uid();
  if t.id is null then raise exception 'Chưa đăng nhập'; end if;
  insert into public.khoa_dong (thanh_vien_id) values (t.id) on conflict do nothing;
  select bi_mat into bm from public.khoa_dong where thanh_vien_id = t.id;
  return json_build_object('ma', t.ma, 'bi_mat', bm, 'bay_gio', now());
end $$;

alter table public.diem_danh drop constraint diem_danh_cach_check;
alter table public.diem_danh add constraint diem_danh_cach_check check (cach in ('qr', 'anh', 'tay', 'bo_sung', 'ma_dong'));
insert into public.cai_dat (khoa, gia_tri) values ('chi_nhan_ma_dong', 'true') on conflict (khoa) do nothing;

/* ---------- Ghi điểm danh ----------
   Mã động: NKTV1.<mã thành viên>.<số khung 20 giây>.<12 ký tự đầu của HMAC-SHA256>.
   Giờ quét (giờ máy người quét, đã chỉnh theo giờ máy chủ) phải nằm trong khoảng 30 giây trước tới 60 giây sau khung của mã. */
create or replace function public.ghi_diem_danh(p_buoi uuid, p_khoa text, p_tv uuid, p_luc timestamptz, p_cach text)
returns json language plpgsql security definer set search_path = '' as $$
declare b public.buoi; t public.thanh_vien; c text := coalesce(p_cach, 'qr'); l timestamptz := coalesce(p_luc, now()); cu public.diem_danh; moi boolean;
  phan text[]; bm text; lech numeric;
begin
  select * into b from public.buoi where id = p_buoi;
  if b.id is null then raise exception 'Không tìm thấy buổi'; end if;
  if not noi_bo.duoc_diem_danh(p_buoi) then raise exception 'Bạn chưa được giao điểm danh buổi này'; end if;
  if b.dong and not noi_bo.la_quan_tri() then raise exception 'Buổi đã đóng. Nhờ quản trị mở lại nếu cần sửa.'; end if;
  if l > now() + interval '5 minutes' then l := now(); end if;
  if p_khoa like 'NKTV1.%' then
    phan := string_to_array(p_khoa, '.');
    if coalesce(array_length(phan, 1), 0) <> 4 or phan[3] !~ '^\d{1,12}$' then return json_build_object('ok', false, 'loi', 'Mã không đọc được. Thử quét lại.'); end if;
    select * into t from public.thanh_vien where ma = phan[2];
    select k.bi_mat into bm from public.khoa_dong k where k.thanh_vien_id = t.id;
    if t.id is null or bm is null or lower(phan[4]) <> left(encode(extensions.hmac(phan[2] || '.' || phan[3], bm, 'sha256'), 'hex'), 12) then
      return json_build_object('ok', false, 'loi', 'Mã không hợp lệ.');
    end if;
    lech := extract(epoch from l) - phan[3]::numeric * 20;
    if lech < -30 or lech > 60 then
      return json_build_object('ok', false, 'het_han', true, 'id', t.id, 'ho_ten', t.ho_ten, 'loi', 'Mã đã hết hạn, có thể là ảnh chụp. Nhờ bạn mở lại mã trên app.');
    end if;
    c := 'ma_dong';
  elsif p_khoa is not null then
    select * into t from public.thanh_vien where khoa_qr = p_khoa;
    if t.id is not null and c in ('qr', 'anh') and coalesce((select gia_tri = 'true'::jsonb from public.cai_dat where khoa = 'chi_nhan_ma_dong'), false) then
      return json_build_object('ok', false, 'ma_cu', true, 'id', t.id, 'ho_ten', t.ho_ten, 'loi', 'Mã cố định trên thẻ hoặc ảnh chụp không dùng để điểm danh. Nhờ bạn mở app → Mã điểm danh của tôi.');
    end if;
  else
    select * into t from public.thanh_vien where id = p_tv;
  end if;
  if t.id is null then return json_build_object('ok', false, 'loi', 'Mã này không thuộc thành viên nào.'); end if;
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

create or replace function public.xoa_diem_danh(p_buoi uuid, p_tv uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not noi_bo.duoc_diem_danh(p_buoi) then raise exception 'Bạn chưa được giao điểm danh buổi này'; end if;
  if (select dong from public.buoi where id = p_buoi) and not noi_bo.la_quan_tri() then raise exception 'Buổi đã đóng. Nhờ quản trị mở lại nếu cần sửa.'; end if;
  delete from public.diem_danh where buoi_id = p_buoi and thanh_vien_id = p_tv;
end $$;

-- Người được giao điểm danh xem được danh sách của đúng buổi đó.
create or replace function public.bang_diem_danh(p_buoi uuid)
returns table (thanh_vien_id uuid, ma text, ho_ten text, gen int, nha text, cap text, trang_thai text, luc timestamptz, tre_phut int, cach text, ly_do text)
language sql stable security definer set search_path = '' as $$
  select t.id, t.ma, t.ho_ten, t.gen, t.nha, t.cap, d.trang_thai, d.luc, d.tre_phut, d.cach, d.ly_do
  from public.buoi b
  cross join lateral noi_bo.dong_diem_danh(b.bat_dau, b.bat_dau) d
  join public.thanh_vien t on t.id = d.thanh_vien_id
  where b.id = p_buoi and d.buoi_id = p_buoi and (noi_bo.xem_duoc_ten() or noi_bo.duoc_diem_danh(p_buoi))
  order by t.ho_ten
$$;

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
    'buoi_diem_danh', coalesce((select json_agg(g.buoi_id) from public.buoi_diem_danh g join public.buoi b on b.id = g.buoi_id where g.thanh_vien_id = t.id and not b.dong), '[]'),
    'bay_gio', now())
  from public.thanh_vien t where t.user_id = auth.uid()
$$;

revoke all on function public.dat_nguoi_diem_danh(uuid, uuid[]), public.ma_dong_cua_toi() from public, anon;
grant execute on function public.dat_nguoi_diem_danh(uuid, uuid[]), public.ma_dong_cua_toi() to authenticated;
revoke all on all functions in schema noi_bo from public, anon;
grant execute on all functions in schema noi_bo to authenticated, service_role;
