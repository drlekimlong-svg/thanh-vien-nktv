/* ============================================================================
   Migration 0015 — Phần C: sau buổi
   Anh Long duyệt 18/11/2026, đã áp dụng cùng ngày (tên migration trên Supabase: sau_buoi).
   Kiểm sau khi áp dụng: 25 hàm trong tệp này khớp md5(prosrc) trên máy chủ; phần CLB không đổi
   (bảng điểm danh 94 dòng, chuyên cần 94 dòng, điểm nhóm 12 dòng tổng 519,6, kích hoạt 232 dòng);
   hai nhánh xét hoan_thanh và chua_hoan_thanh chạy đúng; sequence hv_so đặt lại về 1.

   Phần C của việc gộp app Học viên vào app Thành viên (bản thiết kế 17/11/2026, mục 4.6):
   phản hồi và thắc mắc, phiếu đánh giá cuối đợt, nhập điểm thi, tiêu chí hoàn thành,
   giấy chứng nhận và trang tra cứu công khai.

   Ba điều đã chốt từ trước, mã này giữ đúng:
   - Phản hồi, thắc mắc **chỉ nhận chữ, không đính tệp**. Rà soát pháp lý 09/11/2026 chỉ ra
     ô lý do kèm minh chứng là chỗ dễ lọt dữ liệu sức khỏe.
   - Phiếu đánh giá ẩn danh thì **dòng trả lời không gắn với người gửi**: ai đã gửi ghi ở bảng
     dot_phieu_da_gui, nội dung trả lời ghi ở dot_phieu_tra_loi với nguoi = null và giờ làm
     tròn theo ngày. Máy chủ biết bạn đã gửi, không biết bạn trả lời gì. Giao diện phải nói
     đúng như vậy, không được hứa nhiều hơn.
   - Thi không làm trên app (anh Long chốt 09/11 và 12/11). App chỉ **nhập điểm** từ máy thi.

   Mức hoàn thành tính theo tiêu chí cốt lõi và bổ sung:
     xuất sắc           - đủ cốt lõi, đủ bổ sung, điểm tổng >= ngưỡng xuất sắc của đợt
     hoàn thành         - đủ cốt lõi, đủ bổ sung
     hoàn thành có ghi chú - đủ cốt lõi, thiếu bổ sung; phần thiếu in lên giấy
     tham dự            - thiếu cốt lõi nhưng có mặt ít nhất một buổi
     chưa hoàn thành    - không có mặt buổi nào
   ============================================================================ */

/* ============================================================ 1. Phản hồi và thắc mắc */

create table public.dot_yeu_cau (
  id uuid primary key default gen_random_uuid(),
  dot_id uuid not null references public.dot(id) on delete cascade,
  nguoi uuid references public.thanh_vien(id) on delete set null,
  loai text not null check (loai in ('thac_mac', 'phan_hoi', 'van_de')),
  noi_dung text not null,
  luc timestamptz not null default now(),
  trang_thai text not null default 'moi' check (trang_thai in ('moi', 'dang_xem', 'xong')),
  tra_loi text,
  tra_loi_boi uuid references public.thanh_vien(id) on delete set null,
  tra_loi_luc timestamptz
);
create index on public.dot_yeu_cau (dot_id, luc desc);
comment on table public.dot_yeu_cau is 'Chỉ nhận chữ. Không có cột tệp đính kèm, theo rà soát pháp lý 09/11/2026.';

/* ============================================================ 2. Bài thi và điểm
   Thi trên máy của CLB; app chỉ giữ điểm do Ban tổ chức nhập vào. */

create table public.dot_bai_thi (
  id uuid primary key default gen_random_uuid(),
  dot_id uuid not null references public.dot(id) on delete cascade,
  ma text not null,
  ten text not null,
  thang numeric not null default 10 check (thang > 0),
  trong_so numeric not null default 1 check (trong_so > 0),
  thu_tu int not null default 0,
  unique (dot_id, ma)
);

create table public.dot_diem (
  bai_id uuid not null references public.dot_bai_thi(id) on delete cascade,
  thanh_vien_id uuid not null references public.thanh_vien(id) on delete cascade,
  diem numeric not null check (diem >= 0),
  ghi_chu text,
  nhap_boi uuid references public.thanh_vien(id) on delete set null,
  nhap_luc timestamptz not null default now(),
  primary key (bai_id, thanh_vien_id)
);
create index on public.dot_diem (thanh_vien_id);

/* ============================================================ 3. Phiếu đánh giá cuối đợt */

create table public.dot_phieu (
  id uuid primary key default gen_random_uuid(),
  dot_id uuid not null references public.dot(id) on delete cascade,
  ten text not null,
  mo_ta text,
  an_danh boolean not null default true,
  mo boolean not null default false,
  han timestamptz,
  tao_boi uuid references public.thanh_vien(id) on delete set null,
  tao_luc timestamptz not null default now()
);
create index on public.dot_phieu (dot_id);

create table public.dot_phieu_cau (
  id uuid primary key default gen_random_uuid(),
  phieu_id uuid not null references public.dot_phieu(id) on delete cascade,
  thu_tu int not null default 0,
  noi_dung text not null,
  loai text not null check (loai in ('thang5', 'chon', 'chu')),
  lua_chon jsonb,
  bat_buoc boolean not null default true
);
create index on public.dot_phieu_cau (phieu_id, thu_tu);

-- Câu trả lời. Phiếu ẩn danh thì nguoi = null và luc đã làm tròn về đầu ngày.
create table public.dot_phieu_tra_loi (
  id uuid primary key default gen_random_uuid(),
  phieu_id uuid not null references public.dot_phieu(id) on delete cascade,
  nguoi uuid references public.thanh_vien(id) on delete set null,
  tra_loi jsonb not null,
  luc timestamptz not null default now()
);
create index on public.dot_phieu_tra_loi (phieu_id);

-- Ai đã gửi phiếu. Tách khỏi bảng trả lời để phiếu ẩn danh vẫn tính được tiêu chí.
create table public.dot_phieu_da_gui (
  phieu_id uuid not null references public.dot_phieu(id) on delete cascade,
  thanh_vien_id uuid not null references public.thanh_vien(id) on delete cascade,
  luc timestamptz not null default now(),
  primary key (phieu_id, thanh_vien_id)
);

/* ============================================================ 4. Tiêu chí hoàn thành */

create table public.dot_tieu_chi (
  id uuid primary key default gen_random_uuid(),
  dot_id uuid not null references public.dot(id) on delete cascade,
  ten text not null,
  loai text not null check (loai in ('co_mat_buoi', 'co_mat_phan', 'diem_tong', 'gui_phieu')),
  buoi_id uuid references public.buoi(id) on delete cascade,
  phan text check (phan in ('ly_thuyet', 'thuc_hanh', 'luong_gia', 'khac')),
  so_buoi int check (so_buoi is null or so_buoi > 0),
  nguong numeric,
  phieu_id uuid references public.dot_phieu(id) on delete cascade,
  cot_loi boolean not null default true,
  thu_tu int not null default 0
);
create index on public.dot_tieu_chi (dot_id, thu_tu);

/* ============================================================ 5. Giấy chứng nhận */

create table public.chung_nhan (
  id uuid primary key default gen_random_uuid(),
  dot_id uuid not null references public.dot(id) on delete cascade,
  thanh_vien_id uuid not null references public.thanh_vien(id) on delete cascade,
  ma text not null unique,
  muc text not null check (muc in ('xuat_sac', 'hoan_thanh', 'hoan_thanh_ghi_chu', 'tham_du', 'chua_hoan_thanh')),
  ghi_chu text,
  diem_tong numeric,
  cap_luc timestamptz not null default now(),
  cap_boi uuid references public.thanh_vien(id) on delete set null,
  thu_hoi_luc timestamptz,
  unique (dot_id, thanh_vien_id)
);
comment on column public.chung_nhan.ma is 'Mã tra cứu công khai. Ai có mã thì xem được họ tên, đợt và mức của giấy này.';

alter table public.dot_yeu_cau enable row level security;
alter table public.dot_bai_thi enable row level security;
alter table public.dot_diem enable row level security;
alter table public.dot_phieu enable row level security;
alter table public.dot_phieu_cau enable row level security;
alter table public.dot_phieu_tra_loi enable row level security;
alter table public.dot_phieu_da_gui enable row level security;
alter table public.dot_tieu_chi enable row level security;
alter table public.chung_nhan enable row level security;
-- Không bảng nào mở cho trình duyệt: chỉ các hàm bên dưới chạm vào. Linter báo INFO là đúng ý.
revoke all on public.dot_yeu_cau from anon, authenticated;
revoke all on public.dot_bai_thi from anon, authenticated;
revoke all on public.dot_diem from anon, authenticated;
revoke all on public.dot_phieu from anon, authenticated;
revoke all on public.dot_phieu_cau from anon, authenticated;
revoke all on public.dot_phieu_tra_loi from anon, authenticated;
revoke all on public.dot_phieu_da_gui from anon, authenticated;
revoke all on public.dot_tieu_chi from anon, authenticated;
revoke all on public.chung_nhan from anon, authenticated;

/* ============================================================ 6. Phản hồi và thắc mắc: hàm */

create function public.gui_yeu_cau_dot(p_dot uuid, p_loai text, p_noi_dung text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; nd text := btrim(coalesce(p_noi_dung, ''));
begin
  if noi_bo.toi() is null then raise exception 'Chưa đăng nhập'; end if;
  if nd = '' then raise exception 'Nội dung còn trống'; end if;
  if length(nd) > 4000 then raise exception 'Nội dung dài quá 4000 chữ'; end if;
  if coalesce(p_loai, '') not in ('thac_mac', 'phan_hoi', 'van_de') then raise exception 'Loại không hợp lệ'; end if;
  if not noi_bo.thay_duoc_dot(p_dot) then raise exception 'Bạn không thuộc đợt này'; end if;
  insert into public.dot_yeu_cau (dot_id, nguoi, loai, noi_dung) values (p_dot, noi_bo.toi(), p_loai, nd)
  returning id into v_id;
  return v_id;
end $$;

-- Ban tổ chức quản lý thấy hết; người khác chỉ thấy cái mình gửi.
create function public.ds_yeu_cau_dot(p_dot uuid) returns json
language sql stable security definer set search_path = '' as $$
  with ql as (select noi_bo.la_btc_dot(p_dot) as co)
  select coalesce(json_agg(json_build_object(
    'id', y.id, 'loai', y.loai, 'noi_dung', y.noi_dung, 'luc', y.luc,
    'trang_thai', y.trang_thai, 'tra_loi', y.tra_loi, 'tra_loi_luc', y.tra_loi_luc,
    'la_cua_toi', y.nguoi = noi_bo.toi(),
    'ho_ten', case when ql.co then t.ho_ten end, 'ma', case when ql.co then t.ma end)
    order by y.luc desc), '[]')
  from public.dot_yeu_cau y
  left join public.thanh_vien t on t.id = y.nguoi
  cross join ql
  where y.dot_id = p_dot and noi_bo.thay_duoc_dot(p_dot)
    and (ql.co or y.nguoi = noi_bo.toi())
$$;

create function public.xu_ly_yeu_cau_dot(p_id uuid, p_trang_thai text, p_tra_loi text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_dot uuid;
begin
  select dot_id into v_dot from public.dot_yeu_cau where id = p_id;
  if v_dot is null then raise exception 'Không tìm thấy yêu cầu'; end if;
  if not noi_bo.la_btc_dot(v_dot) then raise exception 'Chỉ trưởng ban, thư ký của đợt và quản trị được xử lý'; end if;
  if coalesce(p_trang_thai, '') not in ('moi', 'dang_xem', 'xong') then raise exception 'Trạng thái không hợp lệ'; end if;
  update public.dot_yeu_cau set
    trang_thai = p_trang_thai,
    tra_loi = nullif(btrim(coalesce(p_tra_loi, '')), ''),
    tra_loi_boi = case when nullif(btrim(coalesce(p_tra_loi, '')), '') is null then null else noi_bo.toi() end,
    tra_loi_luc = case when nullif(btrim(coalesce(p_tra_loi, '')), '') is null then null else now() end
  where id = p_id;
end $$;

/* ============================================================ 7. Bài thi và nhập điểm */

create function public.luu_bai_thi_dot(p_id uuid, p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := p_id; v_dot uuid; v_ma text := upper(btrim(coalesce(p ->> 'ma', '')));
  v_ten text := btrim(coalesce(p ->> 'ten', ''));
begin
  if v_ma = '' or v_ten = '' then raise exception 'Bài thi phải có mã và tên'; end if;
  if v_id is null then v_dot := nullif(btrim(coalesce(p ->> 'dot_id', '')), '')::uuid;
  else select dot_id into v_dot from public.dot_bai_thi where id = v_id; end if;
  if not noi_bo.la_btc_dot(v_dot) then raise exception 'Chỉ trưởng ban, thư ký của đợt và quản trị được sửa bài thi'; end if;
  if v_id is null then
    insert into public.dot_bai_thi (dot_id, ma, ten, thang, trong_so, thu_tu)
    values (v_dot, v_ma, v_ten,
      coalesce(nullif(btrim(coalesce(p ->> 'thang', '')), '')::numeric, 10),
      coalesce(nullif(btrim(coalesce(p ->> 'trong_so', '')), '')::numeric, 1),
      coalesce(nullif(btrim(coalesce(p ->> 'thu_tu', '')), '')::int, 0))
    returning id into v_id;
  else
    update public.dot_bai_thi set ma = v_ma, ten = v_ten,
      thang = coalesce(nullif(btrim(coalesce(p ->> 'thang', '')), '')::numeric, 10),
      trong_so = coalesce(nullif(btrim(coalesce(p ->> 'trong_so', '')), '')::numeric, 1),
      thu_tu = coalesce(nullif(btrim(coalesce(p ->> 'thu_tu', '')), '')::int, 0)
    where id = v_id;
  end if;
  perform noi_bo.ghi_nhat_ky_dot(v_dot, case when p_id is null then 'Thêm bài thi' else 'Sửa bài thi' end, v_ten);
  return v_id;
end $$;

create function public.xoa_bai_thi_dot(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_dot uuid; v_ten text;
begin
  select dot_id, ten into v_dot, v_ten from public.dot_bai_thi where id = p_id;
  if v_dot is null then raise exception 'Không tìm thấy bài thi'; end if;
  if not noi_bo.la_btc_dot(v_dot) then raise exception 'Chỉ trưởng ban, thư ký của đợt và quản trị được xóa bài thi'; end if;
  delete from public.dot_bai_thi where id = p_id;
  perform noi_bo.ghi_nhat_ky_dot(v_dot, 'Xóa bài thi', v_ten);
end $$;

create function public.ds_bai_thi_dot(p_dot uuid) returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object(
    'id', b.id, 'ma', b.ma, 'ten', b.ten, 'thang', b.thang, 'trong_so', b.trong_so, 'thu_tu', b.thu_tu,
    'so_diem', (select count(*) from public.dot_diem d where d.bai_id = b.id)) order by b.thu_tu, b.ma), '[]')
  from public.dot_bai_thi b where b.dot_id = p_dot and noi_bo.thay_duoc_dot(p_dot)
$$;

/* Nhập điểm: gọi hai lần, lần đầu p_ghi = false để xem trước.
   p_ds là mảng json, mỗi phần tử { dong, ma, diem, ghi_chu }. ma là mã học viên hoặc email.
   Tình trạng mỗi dòng: ok, sua (đã có điểm, sẽ ghi đè), khong_thay, ngoai_dot, loi. */
create function public.nhap_diem_dot(p_bai uuid, p_ds jsonb, p_ghi boolean default false) returns json
language plpgsql security definer set search_path = '' as $$
declare
  v_dot uuid; v_thang numeric; r jsonb; i int := 0;
  v_ma text; v_diem numeric; tt text; ly_do text; tv public.thanh_vien;
  da_gap jsonb := '{}'::jsonb; ket jsonb := '[]'::jsonb;
  dem_ok int := 0; dem_sua int := 0; dem_loi int := 0;
begin
  select b.dot_id, b.thang into v_dot, v_thang from public.dot_bai_thi b where b.id = p_bai;
  if v_dot is null then raise exception 'Không tìm thấy bài thi'; end if;
  if not noi_bo.la_btc_dot(v_dot) then raise exception 'Chỉ trưởng ban, thư ký của đợt và quản trị được nhập điểm'; end if;
  if jsonb_typeof(p_ds) <> 'array' then raise exception 'Danh sách phải là một mảng'; end if;
  if jsonb_array_length(p_ds) > 1000 then raise exception 'Mỗi lần nhập tối đa 1000 dòng'; end if;

  for r in select * from jsonb_array_elements(p_ds) loop
    i := i + 1;
    v_ma := upper(btrim(coalesce(r ->> 'ma', '')));
    tt := null; ly_do := null; tv := null; v_diem := null;

    begin v_diem := nullif(btrim(replace(coalesce(r ->> 'diem', ''), ',', '.')), '')::numeric;
    exception when others then v_diem := null; end;

    if v_ma = '' then tt := 'loi'; ly_do := 'Thiếu mã học viên';
    elsif v_diem is null then tt := 'loi'; ly_do := 'Điểm không đọc được';
    elsif v_diem < 0 or v_diem > v_thang then tt := 'loi'; ly_do := 'Điểm ngoài thang 0 đến ' || v_thang;
    elsif da_gap ? v_ma then tt := 'loi'; ly_do := 'Trùng mã với dòng ' || (da_gap ->> v_ma) || ' trong chính bảng này';
    else
      da_gap := da_gap || jsonb_build_object(v_ma, coalesce(r ->> 'dong', i::text));
      select t.* into tv from public.thanh_vien t where t.ma = v_ma;
      if tv.id is null then
        select t.* into tv from public.thanh_vien t join public.hv_ho_so h on h.thanh_vien_id = t.id
        where h.email = lower(btrim(coalesce(r ->> 'ma', '')));
      end if;
      if tv.id is null then tt := 'khong_thay'; ly_do := 'Không có ai mang mã này';
      elsif not exists (select 1 from public.dot_hoc_vien g
        where g.dot_id = v_dot and g.thanh_vien_id = tv.id and g.trang_thai = 'ghi_danh')
      then tt := 'ngoai_dot'; ly_do := 'Không có tên trong đợt này';
      elsif exists (select 1 from public.dot_diem d where d.bai_id = p_bai and d.thanh_vien_id = tv.id)
      then tt := 'sua';
      else tt := 'ok'; end if;
    end if;

    if p_ghi and tt in ('ok', 'sua') then
      insert into public.dot_diem (bai_id, thanh_vien_id, diem, ghi_chu, nhap_boi)
      values (p_bai, tv.id, v_diem, nullif(btrim(coalesce(r ->> 'ghi_chu', '')), ''), noi_bo.toi())
      on conflict (bai_id, thanh_vien_id) do update
        set diem = excluded.diem, ghi_chu = excluded.ghi_chu, nhap_boi = excluded.nhap_boi, nhap_luc = now();
    end if;

    if tt = 'ok' then dem_ok := dem_ok + 1;
    elsif tt = 'sua' then dem_sua := dem_sua + 1;
    else dem_loi := dem_loi + 1; end if;

    ket := ket || jsonb_build_object('dong', coalesce(r ->> 'dong', i::text), 'ma', v_ma,
      'ho_ten', tv.ho_ten, 'diem', v_diem, 'tinh_trang', tt, 'ly_do', ly_do);
  end loop;

  if p_ghi then
    perform noi_bo.ghi_nhat_ky_dot(v_dot, 'Nhập điểm',
      (select ten from public.dot_bai_thi where id = p_bai) || ': ' || dem_ok || ' mới, ' || dem_sua || ' sửa, ' || dem_loi || ' lỗi');
  end if;
  return json_build_object('da_ghi', p_ghi,
    'dem', json_build_object('ok', dem_ok, 'sua', dem_sua, 'loi', dem_loi), 'ds', ket);
end $$;

create function public.xoa_diem_dot(p_bai uuid, p_tv uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_dot uuid;
begin
  select dot_id into v_dot from public.dot_bai_thi where id = p_bai;
  if v_dot is null then raise exception 'Không tìm thấy bài thi'; end if;
  if not noi_bo.la_btc_dot(v_dot) then raise exception 'Chỉ trưởng ban, thư ký của đợt và quản trị được xóa điểm'; end if;
  delete from public.dot_diem where bai_id = p_bai and thanh_vien_id = p_tv;
end $$;

/* ============================================================ 8. Phiếu đánh giá: hàm */

create function public.luu_phieu_dot(p_id uuid, p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := p_id; v_dot uuid; v_ten text := btrim(coalesce(p ->> 'ten', '')); c jsonb; i int := 0;
begin
  if v_ten = '' then raise exception 'Phiếu phải có tên'; end if;
  if v_id is null then v_dot := nullif(btrim(coalesce(p ->> 'dot_id', '')), '')::uuid;
  else select dot_id into v_dot from public.dot_phieu where id = v_id; end if;
  if not noi_bo.la_btc_dot(v_dot) then raise exception 'Chỉ trưởng ban, thư ký của đợt và quản trị được soạn phiếu'; end if;
  if v_id is null then
    insert into public.dot_phieu (dot_id, ten, mo_ta, an_danh, mo, han, tao_boi)
    values (v_dot, v_ten, nullif(btrim(coalesce(p ->> 'mo_ta', '')), ''),
      coalesce((p ->> 'an_danh')::boolean, true), coalesce((p ->> 'mo')::boolean, false),
      nullif(btrim(coalesce(p ->> 'han', '')), '')::timestamptz, noi_bo.toi())
    returning id into v_id;
  else
    -- Đã có người gửi thì không đổi được chế độ ẩn danh nữa, vì các dòng cũ đã ghi theo chế độ cũ.
    if exists (select 1 from public.dot_phieu_tra_loi where phieu_id = v_id)
       and coalesce((p ->> 'an_danh')::boolean, (select an_danh from public.dot_phieu where id = v_id))
           is distinct from (select an_danh from public.dot_phieu where id = v_id)
    then raise exception 'Phiếu đã có người gửi nên không đổi được chế độ ẩn danh'; end if;
    update public.dot_phieu set ten = v_ten, mo_ta = nullif(btrim(coalesce(p ->> 'mo_ta', '')), ''),
      an_danh = coalesce((p ->> 'an_danh')::boolean, an_danh),
      mo = coalesce((p ->> 'mo')::boolean, false),
      han = nullif(btrim(coalesce(p ->> 'han', '')), '')::timestamptz
    where id = v_id;
  end if;

  if p ? 'cau' then
    if jsonb_typeof(p -> 'cau') <> 'array' then raise exception 'Danh sách câu phải là một mảng'; end if;
    if exists (select 1 from public.dot_phieu_tra_loi where phieu_id = v_id)
    then raise exception 'Phiếu đã có người gửi nên không sửa được câu hỏi'; end if;
    delete from public.dot_phieu_cau where phieu_id = v_id;
    for c in select * from jsonb_array_elements(p -> 'cau') loop
      i := i + 1;
      if btrim(coalesce(c ->> 'noi_dung', '')) = '' then continue; end if;
      insert into public.dot_phieu_cau (phieu_id, thu_tu, noi_dung, loai, lua_chon, bat_buoc)
      values (v_id, i, btrim(c ->> 'noi_dung'),
        coalesce(nullif(btrim(coalesce(c ->> 'loai', '')), ''), 'thang5'),
        case when jsonb_typeof(c -> 'lua_chon') = 'array' then c -> 'lua_chon' end,
        coalesce((c ->> 'bat_buoc')::boolean, true));
    end loop;
  end if;
  perform noi_bo.ghi_nhat_ky_dot(v_dot, case when p_id is null then 'Thêm phiếu' else 'Sửa phiếu' end, v_ten);
  return v_id;
end $$;

create function public.xoa_phieu_dot(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_dot uuid; v_ten text;
begin
  select dot_id, ten into v_dot, v_ten from public.dot_phieu where id = p_id;
  if v_dot is null then raise exception 'Không tìm thấy phiếu'; end if;
  if not noi_bo.la_btc_dot(v_dot) then raise exception 'Chỉ trưởng ban, thư ký của đợt và quản trị được xóa phiếu'; end if;
  delete from public.dot_phieu where id = p_id;
  perform noi_bo.ghi_nhat_ky_dot(v_dot, 'Xóa phiếu', v_ten);
end $$;

create function public.ds_phieu_dot(p_dot uuid) returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object(
    'id', f.id, 'ten', f.ten, 'mo_ta', f.mo_ta, 'an_danh', f.an_danh, 'mo', f.mo, 'han', f.han,
    'so_cau', (select count(*) from public.dot_phieu_cau c where c.phieu_id = f.id),
    'so_gui', (select count(*) from public.dot_phieu_da_gui g where g.phieu_id = f.id),
    'toi_da_gui', exists (select 1 from public.dot_phieu_da_gui g where g.phieu_id = f.id and g.thanh_vien_id = noi_bo.toi()),
    'cau', coalesce((select json_agg(json_build_object('id', c.id, 'thu_tu', c.thu_tu, 'noi_dung', c.noi_dung,
        'loai', c.loai, 'lua_chon', c.lua_chon, 'bat_buoc', c.bat_buoc) order by c.thu_tu)
      from public.dot_phieu_cau c where c.phieu_id = f.id), '[]')
    ) order by f.tao_luc), '[]')
  from public.dot_phieu f where f.dot_id = p_dot and noi_bo.thay_duoc_dot(p_dot)
$$;

/* Gửi phiếu. Ghi hai dòng trong cùng một giao dịch: một dòng "đã gửi" có tên, một dòng trả lời
   không tên nếu phiếu ẩn danh. Hai dòng không nối được với nhau. */
create function public.gui_phieu_dot(p_phieu uuid, p_tra_loi jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare f public.dot_phieu; me uuid := noi_bo.toi();
begin
  if me is null then raise exception 'Chưa đăng nhập'; end if;
  select * into f from public.dot_phieu where id = p_phieu;
  if f.id is null then raise exception 'Không tìm thấy phiếu'; end if;
  if not noi_bo.o_trong_dot(f.dot_id) then raise exception 'Bạn không có tên trong đợt này'; end if;
  if not f.mo then raise exception 'Phiếu chưa mở'; end if;
  if f.han is not null and now() > f.han then raise exception 'Phiếu đã hết hạn'; end if;
  if exists (select 1 from public.dot_phieu_da_gui g where g.phieu_id = p_phieu and g.thanh_vien_id = me)
  then raise exception 'Bạn đã gửi phiếu này rồi'; end if;
  if jsonb_typeof(coalesce(p_tra_loi, 'null'::jsonb)) <> 'object' then raise exception 'Câu trả lời không hợp lệ'; end if;
  if exists (select 1 from public.dot_phieu_cau c where c.phieu_id = p_phieu and c.bat_buoc
    and coalesce(btrim(p_tra_loi ->> c.id::text), '') = '')
  then raise exception 'Còn câu bắt buộc chưa trả lời'; end if;

  insert into public.dot_phieu_da_gui (phieu_id, thanh_vien_id) values (p_phieu, me);
  insert into public.dot_phieu_tra_loi (phieu_id, nguoi, tra_loi, luc)
  values (p_phieu, case when f.an_danh then null else me end, p_tra_loi,
    case when f.an_danh then date_trunc('day', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh' else now() end);
end $$;

/* Tổng hợp cho Ban tổ chức. Phiếu ẩn danh chỉ có phần gộp theo câu, không có 'ds',
   vì dòng trả lời không gắn với ai. Phiếu không ẩn danh thì có thêm 'ds' kèm tên. */
create function public.tong_hop_phieu_dot(p_phieu uuid) returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'so_gui', (select count(*) from public.dot_phieu_da_gui g where g.phieu_id = p_phieu),
    'an_danh', f.an_danh,
    'cau', coalesce((select json_agg(json_build_object(
        'id', c.id, 'noi_dung', c.noi_dung, 'loai', c.loai, 'lua_chon', c.lua_chon,
        'tra_loi', coalesce((select json_agg(x.tra_loi ->> c.id::text)
          from public.dot_phieu_tra_loi x where x.phieu_id = p_phieu and coalesce(btrim(x.tra_loi ->> c.id::text), '') <> ''), '[]')
      ) order by c.thu_tu) from public.dot_phieu_cau c where c.phieu_id = p_phieu), '[]'),
    'ds', case when f.an_danh then null else coalesce((
      select json_agg(json_build_object('ho_ten', t.ho_ten, 'ma', t.ma, 'luc', x.luc, 'tra_loi', x.tra_loi) order by x.luc)
      from public.dot_phieu_tra_loi x left join public.thanh_vien t on t.id = x.nguoi
      where x.phieu_id = p_phieu), '[]') end)
  from public.dot_phieu f
  where f.id = p_phieu and noi_bo.la_btc_dot(f.dot_id)
$$;

/* ============================================================ 9. Tiêu chí hoàn thành */

create function public.luu_tieu_chi_dot(p_dot uuid, p jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare x jsonb; i int := 0;
begin
  if not noi_bo.la_btc_dot(p_dot) then raise exception 'Chỉ trưởng ban, thư ký của đợt và quản trị được đặt tiêu chí'; end if;
  if jsonb_typeof(p) <> 'array' then raise exception 'Danh sách tiêu chí phải là một mảng'; end if;
  delete from public.dot_tieu_chi where dot_id = p_dot;
  for x in select * from jsonb_array_elements(p) loop
    i := i + 1;
    if btrim(coalesce(x ->> 'ten', '')) = '' then continue; end if;
    insert into public.dot_tieu_chi (dot_id, ten, loai, buoi_id, phan, so_buoi, nguong, phieu_id, cot_loi, thu_tu)
    values (p_dot, btrim(x ->> 'ten'), x ->> 'loai',
      nullif(btrim(coalesce(x ->> 'buoi_id', '')), '')::uuid,
      nullif(btrim(coalesce(x ->> 'phan', '')), ''),
      nullif(btrim(coalesce(x ->> 'so_buoi', '')), '')::int,
      nullif(btrim(coalesce(x ->> 'nguong', '')), '')::numeric,
      nullif(btrim(coalesce(x ->> 'phieu_id', '')), '')::uuid,
      coalesce((x ->> 'cot_loi')::boolean, true), i);
  end loop;
  perform noi_bo.ghi_nhat_ky_dot(p_dot, 'Đặt tiêu chí', i || ' tiêu chí');
end $$;

-- Cài đặt riêng của đợt, hiện chỉ dùng cho nguong_xuat_sac. Gộp vào dot.cai_dat, không ghi đè cả cục.
create function public.dat_cai_dat_dot(p_dot uuid, p jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not noi_bo.la_btc_dot(p_dot) then raise exception 'Chỉ trưởng ban, thư ký của đợt và quản trị được đổi cài đặt'; end if;
  if jsonb_typeof(coalesce(p, 'null'::jsonb)) <> 'object' then raise exception 'Cài đặt phải là một object'; end if;
  update public.dot set cai_dat = coalesce(cai_dat, '{}'::jsonb) || p where id = p_dot;
end $$;

create function public.ds_tieu_chi_dot(p_dot uuid) returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object(
    'id', x.id, 'ten', x.ten, 'loai', x.loai, 'buoi_id', x.buoi_id, 'buoi_ten', b.ten,
    'phan', x.phan, 'so_buoi', x.so_buoi, 'nguong', x.nguong, 'phieu_id', x.phieu_id,
    'phieu_ten', f.ten, 'cot_loi', x.cot_loi, 'thu_tu', x.thu_tu) order by x.thu_tu), '[]')
  from public.dot_tieu_chi x
  left join public.buoi b on b.id = x.buoi_id
  left join public.dot_phieu f on f.id = x.phieu_id
  where x.dot_id = p_dot and noi_bo.thay_duoc_dot(p_dot)
$$;

/* ============================================================ 10. Xét kết quả

   diem_tong_hv: trung bình có trọng số, quy về thang 10. Bài chưa có điểm tính là 0,
   vì không thi thì không có điểm; giao diện hiện rõ bài nào còn trống.
   dat_tieu_chi: một tiêu chí với một người.
   xet_mot_hv: mức và phần còn thiếu của một người. */

create function noi_bo.diem_tong_hv(p_dot uuid, p_tv uuid) returns numeric
language sql stable security definer set search_path = '' as $$
  select case when sum(b.trong_so) > 0
    then round(sum(coalesce(d.diem, 0) / b.thang * 10 * b.trong_so) / sum(b.trong_so), 2) end
  from public.dot_bai_thi b
  left join public.dot_diem d on d.bai_id = b.id and d.thanh_vien_id = p_tv
  where b.dot_id = p_dot
$$;

create function noi_bo.dat_tieu_chi(p_tc public.dot_tieu_chi, p_tv uuid, p_diem numeric) returns boolean
language sql stable security definer set search_path = '' as $$
  select case p_tc.loai
    when 'co_mat_buoi' then exists (select 1 from public.diem_danh d
      where d.buoi_id = p_tc.buoi_id and d.thanh_vien_id = p_tv)
    when 'co_mat_phan' then (select count(distinct d.buoi_id) from public.diem_danh d
      join public.buoi b on b.id = d.buoi_id
      where b.dot_id = p_tc.dot_id and b.phan = p_tc.phan and d.thanh_vien_id = p_tv) >= coalesce(p_tc.so_buoi, 1)
    when 'diem_tong' then p_diem is not null and p_diem >= coalesce(p_tc.nguong, 0)
    when 'gui_phieu' then exists (select 1 from public.dot_phieu_da_gui g
      where g.phieu_id = p_tc.phieu_id and g.thanh_vien_id = p_tv)
    else false end
$$;

create function noi_bo.xet_mot_hv(p_dot uuid, p_tv uuid) returns json
language plpgsql stable security definer set search_path = '' as $$
declare tc public.dot_tieu_chi; v_diem numeric; thieu_cot text[] := '{}'; thieu_bo text[] := '{}';
  v_muc text; v_so_buoi int; v_nguong numeric;
begin
  v_diem := noi_bo.diem_tong_hv(p_dot, p_tv);
  for tc in select * from public.dot_tieu_chi where dot_id = p_dot order by thu_tu loop
    if not noi_bo.dat_tieu_chi(tc, p_tv, v_diem) then
      if tc.cot_loi then thieu_cot := thieu_cot || tc.ten; else thieu_bo := thieu_bo || tc.ten; end if;
    end if;
  end loop;
  select count(distinct d.buoi_id) into v_so_buoi from public.diem_danh d
  join public.buoi b on b.id = d.buoi_id where b.dot_id = p_dot and d.thanh_vien_id = p_tv;
  select nullif(btrim(coalesce(cai_dat ->> 'nguong_xuat_sac', '')), '')::numeric into v_nguong
  from public.dot where id = p_dot;

  if array_length(thieu_cot, 1) is not null then
    v_muc := case when v_so_buoi > 0 then 'tham_du' else 'chua_hoan_thanh' end;
  elsif array_length(thieu_bo, 1) is not null then
    v_muc := 'hoan_thanh_ghi_chu';
  elsif v_nguong is not null and v_diem is not null and v_diem >= v_nguong then
    v_muc := 'xuat_sac';
  else
    v_muc := 'hoan_thanh';
  end if;

  return json_build_object('muc', v_muc, 'diem_tong', v_diem, 'so_buoi_co_mat', v_so_buoi,
    'thieu_cot_loi', to_json(thieu_cot), 'thieu_bo_sung', to_json(thieu_bo),
    'ghi_chu', case when array_length(thieu_bo, 1) is not null and array_length(thieu_cot, 1) is null
      then 'Chưa có: ' || array_to_string(thieu_bo, ', ') end);
end $$;

create function public.xet_ket_qua_dot(p_dot uuid) returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object(
    'thanh_vien_id', t.id, 'ma', t.ma, 'ho_ten', t.ho_ten,
    'xet', noi_bo.xet_mot_hv(p_dot, t.id),
    'diem', coalesce((select json_agg(json_build_object('bai_id', b.id, 'ma', b.ma, 'ten', b.ten, 'diem', d.diem) order by b.thu_tu, b.ma)
      from public.dot_bai_thi b left join public.dot_diem d on d.bai_id = b.id and d.thanh_vien_id = t.id
      where b.dot_id = p_dot), '[]'),
    'chung_nhan', (select json_build_object('ma', c.ma, 'muc', c.muc, 'cap_luc', c.cap_luc, 'thu_hoi_luc', c.thu_hoi_luc)
      from public.chung_nhan c where c.dot_id = p_dot and c.thanh_vien_id = t.id)
    ) order by t.ho_ten), '[]')
  from public.dot_hoc_vien g
  join public.thanh_vien t on t.id = g.thanh_vien_id
  where g.dot_id = p_dot and g.trang_thai = 'ghi_danh' and noi_bo.la_btc_dot(p_dot)
$$;

/* ============================================================ 11. Cấp và tra giấy chứng nhận */

create function public.cap_chung_nhan_dot(p_dot uuid, p_ids uuid[]) returns json
language plpgsql security definer set search_path = '' as $$
declare
  bang constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_ma_dot text; x uuid; kq jsonb := '[]'::jsonb; xet json; v_ma text; b bytea; k int; n int;
begin
  if not noi_bo.la_btc_dot(p_dot) then raise exception 'Chỉ trưởng ban, thư ký của đợt và quản trị được cấp chứng nhận'; end if;
  select ma into v_ma_dot from public.dot where id = p_dot;
  if v_ma_dot is null then raise exception 'Không tìm thấy đợt'; end if;
  foreach x in array coalesce(p_ids, '{}') loop
    if not exists (select 1 from public.dot_hoc_vien g where g.dot_id = p_dot and g.thanh_vien_id = x and g.trang_thai = 'ghi_danh')
    then continue; end if;
    xet := noi_bo.xet_mot_hv(p_dot, x);
    select c.ma into v_ma from public.chung_nhan c where c.dot_id = p_dot and c.thanh_vien_id = x;
    if v_ma is null then
      select count(*) + 1 into n from public.chung_nhan where dot_id = p_dot;
      b := extensions.gen_random_bytes(4); v_ma := '';
      for k in 0..3 loop v_ma := v_ma || substr(bang, 1 + (get_byte(b, k) % length(bang)), 1); end loop;
      v_ma := v_ma_dot || '-' || lpad(n::text, 4, '0') || '-' || v_ma;
    end if;
    insert into public.chung_nhan (dot_id, thanh_vien_id, ma, muc, ghi_chu, diem_tong, cap_boi)
    values (p_dot, x, v_ma, xet ->> 'muc', xet ->> 'ghi_chu', (xet ->> 'diem_tong')::numeric, noi_bo.toi())
    on conflict (dot_id, thanh_vien_id) do update
      set muc = excluded.muc, ghi_chu = excluded.ghi_chu, diem_tong = excluded.diem_tong,
          cap_luc = now(), cap_boi = excluded.cap_boi, thu_hoi_luc = null;
    kq := kq || jsonb_build_object('thanh_vien_id', x, 'ma', v_ma, 'muc', xet ->> 'muc');
    v_ma := null;
  end loop;
  perform noi_bo.ghi_nhat_ky_dot(p_dot, 'Cấp chứng nhận', jsonb_array_length(kq) || ' giấy');
  return json_build_object('ds', kq);
end $$;

create function public.thu_hoi_chung_nhan(p_dot uuid, p_tv uuid, p_thu_hoi boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not noi_bo.la_btc_dot(p_dot) then raise exception 'Chỉ trưởng ban, thư ký của đợt và quản trị được thu hồi chứng nhận'; end if;
  update public.chung_nhan set thu_hoi_luc = case when coalesce(p_thu_hoi, true) then now() end
  where dot_id = p_dot and thanh_vien_id = p_tv;
  perform noi_bo.ghi_nhat_ky_dot(p_dot, case when coalesce(p_thu_hoi, true) then 'Thu hồi chứng nhận' else 'Bỏ thu hồi chứng nhận' end,
    (select ma from public.thanh_vien where id = p_tv));
end $$;

/* Trang tra cứu công khai: ai có mã thì xem được họ tên, đợt và mức của đúng giấy đó.
   Không trả về email, số điện thoại, trường, điểm từng bài. */
create function public.tra_chung_nhan(p_ma text) returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'ma', c.ma, 'ho_ten', t.ho_ten, 'dot_ma', d.ma, 'dot_ten', d.ten,
    'bat_dau', d.bat_dau, 'ket_thuc', d.ket_thuc,
    'muc', c.muc, 'ghi_chu', c.ghi_chu, 'cap_luc', c.cap_luc,
    'con_hieu_luc', c.thu_hoi_luc is null)
  from public.chung_nhan c
  join public.thanh_vien t on t.id = c.thanh_vien_id
  join public.dot d on d.id = c.dot_id
  where c.ma = upper(btrim(p_ma))
$$;

/* ============================================================ 12. Màn kết quả của học viên */

create function public.ket_qua_cua_toi() returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object(
    'dot_id', d.id, 'dot_ma', d.ma, 'dot_ten', d.ten, 'trang_thai', d.trang_thai,
    'diem', coalesce((select json_agg(json_build_object('ten', b.ten, 'diem', x.diem, 'thang', b.thang) order by b.thu_tu, b.ma)
      from public.dot_bai_thi b left join public.dot_diem x on x.bai_id = b.id and x.thanh_vien_id = noi_bo.toi()
      where b.dot_id = d.id), '[]'),
    'diem_tong', noi_bo.diem_tong_hv(d.id, noi_bo.toi()),
    'tieu_chi', coalesce((select json_agg(json_build_object('ten', tc.ten, 'cot_loi', tc.cot_loi,
        'dat', noi_bo.dat_tieu_chi(tc, noi_bo.toi(), noi_bo.diem_tong_hv(d.id, noi_bo.toi()))) order by tc.thu_tu)
      from public.dot_tieu_chi tc where tc.dot_id = d.id), '[]'),
    'chung_nhan', (select json_build_object('ma', c.ma, 'muc', c.muc, 'ghi_chu', c.ghi_chu,
        'cap_luc', c.cap_luc, 'con_hieu_luc', c.thu_hoi_luc is null)
      from public.chung_nhan c where c.dot_id = d.id and c.thanh_vien_id = noi_bo.toi())
    ) order by d.bat_dau desc nulls last), '[]')
  from public.dot_hoc_vien g join public.dot d on d.id = g.dot_id
  where g.thanh_vien_id = noi_bo.toi() and g.trang_thai = 'ghi_danh'
$$;

/* ============================================================ 13. ds_dot thêm cai_dat
   Màn tiêu chí cần đọc ngưỡng xuất sắc trong dot.cai_dat. Phần còn lại y như bản 0013. */

create or replace function public.ds_dot() returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object(
    'id', d.id, 'ma', d.ma, 'ten', d.ten, 'nam_hoc', d.nam_hoc, 'mo_ta', d.mo_ta,
    'bat_dau', d.bat_dau, 'ket_thuc', d.ket_thuc, 'trang_thai', d.trang_thai,
    'cai_dat', d.cai_dat,
    'so_hoc_vien', (select count(*) from public.dot_hoc_vien g where g.dot_id = d.id and g.trang_thai = 'ghi_danh'),
    'so_kich_hoat', (select count(*) from public.dot_hoc_vien g join public.thanh_vien t on t.id = g.thanh_vien_id
       where g.dot_id = d.id and g.trang_thai = 'ghi_danh' and t.user_id is not null),
    'la_btc', noi_bo.la_btc_dot(d.id)) order by d.bat_dau desc nulls last, d.tao_luc desc), '[]')
  from public.dot d where noi_bo.la_quan_tri() or noi_bo.xem_duoc_hoc_vien()
$$;

/* ============================================================ 14. Quyền gọi hàm */

revoke all on function public.gui_yeu_cau_dot(uuid, text, text) from public, anon;
revoke all on function public.ds_yeu_cau_dot(uuid) from public, anon;
revoke all on function public.xu_ly_yeu_cau_dot(uuid, text, text) from public, anon;
revoke all on function public.luu_bai_thi_dot(uuid, jsonb) from public, anon;
revoke all on function public.xoa_bai_thi_dot(uuid) from public, anon;
revoke all on function public.ds_bai_thi_dot(uuid) from public, anon;
revoke all on function public.nhap_diem_dot(uuid, jsonb, boolean) from public, anon;
revoke all on function public.xoa_diem_dot(uuid, uuid) from public, anon;
revoke all on function public.luu_phieu_dot(uuid, jsonb) from public, anon;
revoke all on function public.xoa_phieu_dot(uuid) from public, anon;
revoke all on function public.ds_phieu_dot(uuid) from public, anon;
revoke all on function public.gui_phieu_dot(uuid, jsonb) from public, anon;
revoke all on function public.tong_hop_phieu_dot(uuid) from public, anon;
revoke all on function public.dat_cai_dat_dot(uuid, jsonb) from public, anon;
revoke all on function public.luu_tieu_chi_dot(uuid, jsonb) from public, anon;
revoke all on function public.ds_tieu_chi_dot(uuid) from public, anon;
revoke all on function public.xet_ket_qua_dot(uuid) from public, anon;
revoke all on function public.cap_chung_nhan_dot(uuid, uuid[]) from public, anon;
revoke all on function public.thu_hoi_chung_nhan(uuid, uuid, boolean) from public, anon;
revoke all on function public.ket_qua_cua_toi() from public, anon;

grant execute on function public.gui_yeu_cau_dot(uuid, text, text) to authenticated;
grant execute on function public.ds_yeu_cau_dot(uuid) to authenticated;
grant execute on function public.xu_ly_yeu_cau_dot(uuid, text, text) to authenticated;
grant execute on function public.luu_bai_thi_dot(uuid, jsonb) to authenticated;
grant execute on function public.xoa_bai_thi_dot(uuid) to authenticated;
grant execute on function public.ds_bai_thi_dot(uuid) to authenticated;
grant execute on function public.nhap_diem_dot(uuid, jsonb, boolean) to authenticated;
grant execute on function public.xoa_diem_dot(uuid, uuid) to authenticated;
grant execute on function public.luu_phieu_dot(uuid, jsonb) to authenticated;
grant execute on function public.xoa_phieu_dot(uuid) to authenticated;
grant execute on function public.ds_phieu_dot(uuid) to authenticated;
grant execute on function public.gui_phieu_dot(uuid, jsonb) to authenticated;
grant execute on function public.tong_hop_phieu_dot(uuid) to authenticated;
grant execute on function public.dat_cai_dat_dot(uuid, jsonb) to authenticated;
grant execute on function public.luu_tieu_chi_dot(uuid, jsonb) to authenticated;
grant execute on function public.ds_tieu_chi_dot(uuid) to authenticated;
grant execute on function public.xet_ket_qua_dot(uuid) to authenticated;
grant execute on function public.cap_chung_nhan_dot(uuid, uuid[]) to authenticated;
grant execute on function public.thu_hoi_chung_nhan(uuid, uuid, boolean) to authenticated;
grant execute on function public.ket_qua_cua_toi() to authenticated;

-- Trang tra cứu công khai: mở cho người chưa đăng nhập, y như thẻ thành viên.
revoke all on function public.tra_chung_nhan(text) from public;
grant execute on function public.tra_chung_nhan(text) to anon, authenticated;

revoke all on all functions in schema noi_bo from public, anon;
grant execute on all functions in schema noi_bo to authenticated, service_role;

notify pgrst, 'reload schema';
