-- Đánh giá ứng viên tuyển quân (anh Long yêu cầu 14/11/2026).
-- Phiếu theo form Google "[TQ2026] ĐÁNH GIÁ VÒNG 3"; tên người đánh giá lấy từ tài khoản đăng nhập. Mỗi người một phiếu cho mỗi thí sinh, sửa được.
-- Ghi chú chuẩn bị phỏng vấn: riêng từng người, chỉ người viết đọc được.
-- Thí sinh không phải thành viên CLB: chỉ giữ mã thí sinh, họ tên, lớp, năm học. Không lưu SĐT, email, ngày sinh, MSSV.
-- Danh sách thí sinh nhập riêng (chứa họ tên nên không nằm trong kho).

create table public.tq_thi_sinh (
  id uuid primary key default gen_random_uuid(),
  dot text not null default 'TQ2026',
  ma_ts text not null,
  stt int,
  ho_ten text not null,
  lop text,
  nam int,
  tao_luc timestamptz not null default now(),
  unique (dot, ma_ts)
);

create table public.tq_danh_gia (
  id uuid primary key default gen_random_uuid(),
  thi_sinh_id uuid not null references public.tq_thi_sinh(id) on delete cascade,
  thanh_vien_id uuid not null references public.thanh_vien(id) on delete cascade,
  nguoi_ten text not null,
  thuoc_nha text not null check (thuoc_nha in ('Anh/Chị Ban Cố vấn', 'Y7+', 'Byakko', 'Genbu', 'Kirin', 'Suzaku', 'Seiryu', 'Yin Yang Kois')),
  diem jsonb not null,
  nhan_xet_tt text not null,
  nhan_xet_tp text not null,
  ket_luan text not null check (ket_luan in ('Phù hợp', 'Không phù hợp', 'Cân nhắc')),
  gui_luc timestamptz not null default now(),
  sua_luc timestamptz not null default now(),
  unique (thi_sinh_id, thanh_vien_id)
);
create index tq_danh_gia_tv on public.tq_danh_gia (thanh_vien_id);

create table public.tq_ghi_chu (
  thi_sinh_id uuid not null references public.tq_thi_sinh(id) on delete cascade,
  thanh_vien_id uuid not null default noi_bo.toi() references public.thanh_vien(id) on delete cascade,
  noi_dung text not null default '' check (length(noi_dung) <= 5000),
  sua_luc timestamptz not null default now(),
  primary key (thi_sinh_id, thanh_vien_id)
);
create index tq_ghi_chu_tv on public.tq_ghi_chu (thanh_vien_id);

-- Ai xem được phiếu của người khác: quản trị, Ban cố vấn, và người có tên trong cai_dat.tq_xem_ket_qua (mảng id thành viên).
create function noi_bo.xem_ket_qua_tq() returns boolean language sql stable security definer set search_path = '' as $$
  select noi_bo.la_quan_tri() or exists (
    select 1 from public.cai_dat c
    where c.khoa = 'tq_xem_ket_qua' and jsonb_typeof(c.gia_tri) = 'array' and c.gia_tri ? (noi_bo.toi())::text)
$$;

alter table public.tq_thi_sinh enable row level security;
alter table public.tq_danh_gia enable row level security;
alter table public.tq_ghi_chu enable row level security;

grant select, insert, update, delete on public.tq_thi_sinh to authenticated;
grant select, delete on public.tq_danh_gia to authenticated;
grant select, insert, update, delete on public.tq_ghi_chu to authenticated;

create policy doc on public.tq_thi_sinh for select to authenticated using ((select noi_bo.toi()) is not null);
create policy them on public.tq_thi_sinh for insert to authenticated with check ((select noi_bo.la_quan_tri()));
create policy sua on public.tq_thi_sinh for update to authenticated using ((select noi_bo.la_quan_tri())) with check ((select noi_bo.la_quan_tri()));
create policy xoa on public.tq_thi_sinh for delete to authenticated using ((select noi_bo.la_quan_tri()));

-- Phiếu: ghi qua hàm luu_danh_gia_tq; đọc phiếu của mình, hoặc mọi phiếu nếu được xem kết quả.
create policy doc on public.tq_danh_gia for select to authenticated
  using (thanh_vien_id = (select noi_bo.toi()) or (select noi_bo.xem_ket_qua_tq()));
create policy xoa on public.tq_danh_gia for delete to authenticated
  using (thanh_vien_id = (select noi_bo.toi()) or (select noi_bo.la_quan_tri()));

create policy rieng on public.tq_ghi_chu for all to authenticated
  using (thanh_vien_id = (select noi_bo.toi())) with check (thanh_vien_id = (select noi_bo.toi()));

create function public.luu_danh_gia_tq(p_ts uuid, p jsonb) returns json
language plpgsql security definer set search_path = '' as $$
declare
  t uuid := noi_bo.toi();
  muc constant jsonb := '{"phong_thai":"Phong thái","eye_contact":"Eye-contact","giong_noi":"Giọng nói","mach_y":"Mạch ý & Nội dung",
    "tac_phong":"Tác phong & Trang phục","thai_do":"Thái độ","giao_tiep":"Giao tiếp","hoa_dong":"Hòa đồng","thich_nghi":"Khả năng thích nghi",
    "to_chuc":"Tính tổ chức & quản lý thời gian","ap_luc":"Khả năng xử lý áp lực","trach_nhiem":"Tinh thần trách nhiệm","chia_se":"Khả năng chia sẻ",
    "cau_tien":"Tinh thần cầu tiến"}';
  k text; v text; d jsonb := '{}'; r public.tq_danh_gia;
  v_ten text; v_nha text := p ->> 'thuoc_nha'; v_tt text := btrim(p ->> 'nhan_xet_tt'); v_tp text := btrim(p ->> 'nhan_xet_tp'); v_kl text := p ->> 'ket_luan';
begin
  if t is null then raise exception 'Chưa đăng nhập'; end if;
  if not exists (select 1 from public.tq_thi_sinh where id = p_ts) then raise exception 'Không tìm thấy thí sinh này'; end if;
  for k in select jsonb_object_keys(muc) loop
    v := p -> 'diem' ->> k;
    if v is null or v !~ '^[1-5]$' then raise exception 'Chưa chấm mục %', muc ->> k; end if;
    d := d || jsonb_build_object(k, v::int);
  end loop;
  v := p -> 'diem' ->> 'xu_ly_su_co';
  if v is not null then
    if v !~ '^[1-5]$' then raise exception 'Mục Xử lý sự cố không hợp lệ'; end if;
    d := d || jsonb_build_object('xu_ly_su_co', v::int);
  end if;
  if v_nha is null or v_nha not in ('Anh/Chị Ban Cố vấn', 'Y7+', 'Byakko', 'Genbu', 'Kirin', 'Suzaku', 'Seiryu', 'Yin Yang Kois') then raise exception 'Chưa chọn nhà của bạn'; end if;
  if coalesce(v_tt, '') = '' then raise exception 'Chưa nhận xét phần thuyết trình'; end if;
  if coalesce(v_tp, '') = '' then raise exception 'Chưa nhận xét phần tác phong và phẩm chất'; end if;
  if length(v_tt) > 4000 or length(v_tp) > 4000 then raise exception 'Nhận xét quá dài'; end if;
  if v_kl is null or v_kl not in ('Phù hợp', 'Không phù hợp', 'Cân nhắc') then raise exception 'Chưa chọn mức phù hợp với CLB'; end if;
  select ho_ten into v_ten from public.thanh_vien where id = t;
  insert into public.tq_danh_gia (thi_sinh_id, thanh_vien_id, nguoi_ten, thuoc_nha, diem, nhan_xet_tt, nhan_xet_tp, ket_luan)
  values (p_ts, t, v_ten, v_nha, d, v_tt, v_tp, v_kl)
  on conflict (thi_sinh_id, thanh_vien_id) do update set nguoi_ten = excluded.nguoi_ten, thuoc_nha = excluded.thuoc_nha, diem = excluded.diem,
    nhan_xet_tt = excluded.nhan_xet_tt, nhan_xet_tp = excluded.nhan_xet_tp, ket_luan = excluded.ket_luan, sua_luc = now()
  returning * into r;
  return row_to_json(r);
end $$;
revoke execute on function public.luu_danh_gia_tq(uuid, jsonb) from public, anon;
grant execute on function public.luu_danh_gia_tq(uuid, jsonb) to authenticated;
