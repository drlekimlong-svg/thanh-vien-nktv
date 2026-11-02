-- App thành viên CLB Ngoại khoa Trưng Vương: bảng, quyền đọc ghi.
-- Không chứa dữ liệu thành viên. Danh sách nhập riêng bằng tools/nhap_thanh_vien.py.

create schema if not exists noi_bo;
grant usage on schema noi_bo to authenticated, service_role;

create table public.thanh_vien (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique,
  ho_ten text not null,
  gen int,
  nha text check (nha in ('Seiryu','Suzaku','Byakko','Genbu','Kirin','YinYang Kois')),
  cap text check (cap in ('Junior','Senior','Ban cố vấn')),
  hoat_dong boolean not null default true,
  ghi_chu text,
  khoa_qr text not null unique default encode(extensions.gen_random_bytes(8), 'hex'),
  vai_tro text not null default 'thanh_vien' check (vai_tro in ('thanh_vien','diem_danh','quan_tri')),
  tham_gia_tu date,
  user_id uuid unique references auth.users(id) on delete set null,
  tao_luc timestamptz not null default now()
);

-- Không có quyền đọc ghi từ trình duyệt; chỉ các hàm bên dưới chạm vào bảng này.
create table public.kich_hoat (
  thanh_vien_id uuid primary key references public.thanh_vien(id) on delete cascade,
  ma_bam text not null,
  het_han timestamptz not null,
  lan_sai int not null default 0,
  khoa_den timestamptz,
  tao_boi uuid references public.thanh_vien(id) on delete set null,
  tao_luc timestamptz not null default now()
);

create table public.cai_dat (
  khoa text primary key,
  gia_tri jsonb not null
);

create table public.buoi (
  id uuid primary key default gen_random_uuid(),
  ten text not null,
  bat_dau timestamptz not null,
  ket_thuc timestamptz,
  dia_diem text,
  noi_dung text,
  nhom_truc text,
  chu_tri text,
  tre_sau_phut int not null default 10 check (tre_sau_phut >= 0),
  tinh_chuyen_can boolean not null default true,
  dong boolean not null default false,
  tao_boi uuid references public.thanh_vien(id) on delete set null,
  tao_luc timestamptz not null default now()
);
create index on public.buoi (bat_dau);

create table public.diem_danh (
  buoi_id uuid not null references public.buoi(id) on delete cascade,
  thanh_vien_id uuid not null references public.thanh_vien(id) on delete cascade,
  luc timestamptz not null,
  cach text not null default 'qr' check (cach in ('qr','anh','tay','bo_sung')),
  ghi_boi uuid references public.thanh_vien(id) on delete set null,
  primary key (buoi_id, thanh_vien_id)
);
create index on public.diem_danh (thanh_vien_id);

create table public.xin_nghi (
  id uuid primary key default gen_random_uuid(),
  buoi_id uuid not null references public.buoi(id) on delete cascade,
  thanh_vien_id uuid not null references public.thanh_vien(id) on delete cascade,
  ly_do text not null,
  trang_thai text not null default 'cho' check (trang_thai in ('cho','duyet','tu_choi')),
  gui_luc timestamptz not null default now(),
  xu_ly_boi uuid references public.thanh_vien(id) on delete set null,
  xu_ly_luc timestamptz,
  phan_hoi text,
  unique (buoi_id, thanh_vien_id)
);
create index on public.xin_nghi (thanh_vien_id);
create index on public.xin_nghi (trang_thai);

create table public.thong_bao (
  id uuid primary key default gen_random_uuid(),
  tieu_de text not null,
  noi_dung text,
  ghim boolean not null default false,
  dang_luc timestamptz not null default now(),
  tac_gia uuid references public.thanh_vien(id) on delete set null
);
create index on public.thong_bao (dang_luc desc);

create table public.thong_bao_da_doc (
  thong_bao_id uuid not null references public.thong_bao(id) on delete cascade,
  thanh_vien_id uuid not null references public.thanh_vien(id) on delete cascade,
  luc timestamptz not null default now(),
  primary key (thong_bao_id, thanh_vien_id)
);

create table public.nang_luc (
  id uuid primary key default gen_random_uuid(),
  nhom text not null check (nhom in ('A','B')),
  ten text not null,
  mo_ta text,
  thu_tu int not null default 0,
  dang_dung boolean not null default true
);

create table public.nang_luc_ghi_nhan (
  id uuid primary key default gen_random_uuid(),
  thanh_vien_id uuid not null references public.thanh_vien(id) on delete cascade,
  nang_luc_id uuid not null references public.nang_luc(id) on delete cascade,
  bac int not null check (bac between 1 and 3),
  trang_thai text not null check (trang_thai in ('dang_ren','cho','dat','tu_choi')),
  minh_chung text,
  lien_ket text,
  ngay_dat date,
  gui_luc timestamptz not null default now(),
  xu_ly_boi uuid references public.thanh_vien(id) on delete set null,
  xu_ly_luc timestamptz,
  phan_hoi text,
  unique (thanh_vien_id, nang_luc_id, bac)
);
create index on public.nang_luc_ghi_nhan (trang_thai);

create table public.hoat_dong_ghi_nhan (
  id uuid primary key default gen_random_uuid(),
  thanh_vien_id uuid not null references public.thanh_vien(id) on delete cascade,
  loai text not null check (loai in ('chuyen_de','chuong_trinh','trao_lai','khac')),
  ten text not null,
  ngay date not null,
  so_gio numeric(5,1),
  lien_ket text,
  trang_thai text not null default 'cho' check (trang_thai in ('cho','dat','tu_choi')),
  gui_luc timestamptz not null default now(),
  xu_ly_boi uuid references public.thanh_vien(id) on delete set null,
  xu_ly_luc timestamptz,
  phan_hoi text
);
create index on public.hoat_dong_ghi_nhan (thanh_vien_id);
create index on public.hoat_dong_ghi_nhan (trang_thai);

create table public.bai_test (
  id uuid primary key default gen_random_uuid(),
  tieu_de text not null,
  mo_ta text,
  thoi_gian_phut int not null default 30 check (thoi_gian_phut > 0),
  mo_luc timestamptz,
  dong_luc timestamptz,
  so_lan int not null default 1 check (so_lan > 0),
  hien_dap_an text not null default 'sau_dong' check (hien_dap_an in ('sau_gui','sau_dong','khong')),
  trang_thai text not null default 'nhap' check (trang_thai in ('nhap','mo')),
  nguon_tep text,
  tao_boi uuid references public.thanh_vien(id) on delete set null,
  tao_luc timestamptz not null default now()
);

create table public.cau_hoi (
  id uuid primary key default gen_random_uuid(),
  bai_id uuid not null references public.bai_test(id) on delete cascade,
  thu_tu int not null,
  phan text,
  noi_dung text not null,
  lua_chon jsonb not null
);
create index on public.cau_hoi (bai_id, thu_tu);

-- Tách riêng để đáp án không bao giờ đi kèm câu hỏi về máy người làm bài.
create table public.dap_an (
  cau_hoi_id uuid primary key references public.cau_hoi(id) on delete cascade,
  dung int not null
);

create table public.lam_bai (
  id uuid primary key default gen_random_uuid(),
  bai_id uuid not null references public.bai_test(id) on delete cascade,
  thanh_vien_id uuid not null references public.thanh_vien(id) on delete cascade,
  lan int not null,
  bat_dau_luc timestamptz not null default now(),
  han_luc timestamptz not null,
  nop_luc timestamptz,
  tu_dong boolean not null default false,
  tra_loi jsonb not null default '{}',
  so_dung int,
  tong int,
  diem numeric(4,2),
  unique (bai_id, thanh_vien_id, lan)
);
create index on public.lam_bai (thanh_vien_id);

/* ---------- Nhận diện người đang đăng nhập ---------- */
create function noi_bo.toi() returns uuid language sql stable security definer set search_path = '' as
$$ select id from public.thanh_vien where user_id = auth.uid() $$;

create function noi_bo.la_quan_tri() returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.thanh_vien where user_id = auth.uid() and vai_tro = 'quan_tri') $$;

create function noi_bo.la_phu_trach() returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.thanh_vien where user_id = auth.uid() and vai_tro in ('quan_tri','diem_danh')) $$;

-- Theo quyết định 09/10/2026: danh sách có tên chỉ dành cho người phụ trách và Ban cố vấn.
create function noi_bo.xem_duoc_ten() returns boolean language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.thanh_vien where user_id = auth.uid() and (vai_tro in ('quan_tri','diem_danh') or cap = 'Ban cố vấn')) $$;

grant execute on all functions in schema noi_bo to authenticated, service_role;

/* ---------- Quyền đọc ghi ---------- */
alter table public.thanh_vien enable row level security;
alter table public.kich_hoat enable row level security;
alter table public.cai_dat enable row level security;
alter table public.buoi enable row level security;
alter table public.diem_danh enable row level security;
alter table public.xin_nghi enable row level security;
alter table public.thong_bao enable row level security;
alter table public.thong_bao_da_doc enable row level security;
alter table public.nang_luc enable row level security;
alter table public.nang_luc_ghi_nhan enable row level security;
alter table public.hoat_dong_ghi_nhan enable row level security;
alter table public.bai_test enable row level security;
alter table public.cau_hoi enable row level security;
alter table public.dap_an enable row level security;
alter table public.lam_bai enable row level security;

revoke all on all tables in schema public from anon;
revoke all on public.kich_hoat from authenticated;
grant select on public.thanh_vien, public.cai_dat, public.buoi, public.diem_danh, public.xin_nghi,
  public.thong_bao, public.thong_bao_da_doc, public.nang_luc, public.nang_luc_ghi_nhan,
  public.hoat_dong_ghi_nhan, public.bai_test, public.cau_hoi, public.dap_an, public.lam_bai to authenticated;
grant insert, update, delete on public.thanh_vien, public.cai_dat, public.buoi, public.thong_bao, public.nang_luc, public.bai_test to authenticated;
grant insert on public.thong_bao_da_doc to authenticated;

create policy doc on public.thanh_vien for select to authenticated
  using (user_id = (select auth.uid()) or (select noi_bo.xem_duoc_ten()));
create policy them on public.thanh_vien for insert to authenticated with check ((select noi_bo.la_quan_tri()));
create policy sua on public.thanh_vien for update to authenticated using ((select noi_bo.la_quan_tri())) with check ((select noi_bo.la_quan_tri()));
create policy xoa on public.thanh_vien for delete to authenticated using ((select noi_bo.la_quan_tri()));

create policy doc on public.cai_dat for select to authenticated using ((select noi_bo.toi()) is not null);
create policy them on public.cai_dat for insert to authenticated with check ((select noi_bo.la_quan_tri()));
create policy sua on public.cai_dat for update to authenticated using ((select noi_bo.la_quan_tri())) with check ((select noi_bo.la_quan_tri()));

create policy doc on public.buoi for select to authenticated using ((select noi_bo.toi()) is not null);
create policy them on public.buoi for insert to authenticated with check ((select noi_bo.la_phu_trach()));
create policy sua on public.buoi for update to authenticated using ((select noi_bo.la_phu_trach())) with check ((select noi_bo.la_phu_trach()));
create policy xoa on public.buoi for delete to authenticated using ((select noi_bo.la_quan_tri()));

create policy doc on public.diem_danh for select to authenticated
  using (thanh_vien_id = (select noi_bo.toi()) or (select noi_bo.xem_duoc_ten()));

create policy doc on public.xin_nghi for select to authenticated
  using (thanh_vien_id = (select noi_bo.toi()) or (select noi_bo.xem_duoc_ten()));

create policy doc on public.thong_bao for select to authenticated using ((select noi_bo.toi()) is not null);
create policy them on public.thong_bao for insert to authenticated with check ((select noi_bo.la_quan_tri()));
create policy sua on public.thong_bao for update to authenticated using ((select noi_bo.la_quan_tri())) with check ((select noi_bo.la_quan_tri()));
create policy xoa on public.thong_bao for delete to authenticated using ((select noi_bo.la_quan_tri()));

create policy doc on public.thong_bao_da_doc for select to authenticated using (thanh_vien_id = (select noi_bo.toi()));
create policy them on public.thong_bao_da_doc for insert to authenticated with check (thanh_vien_id = (select noi_bo.toi()));

create policy doc on public.nang_luc for select to authenticated using ((select noi_bo.toi()) is not null);
create policy them on public.nang_luc for insert to authenticated with check ((select noi_bo.la_quan_tri()));
create policy sua on public.nang_luc for update to authenticated using ((select noi_bo.la_quan_tri())) with check ((select noi_bo.la_quan_tri()));
create policy xoa on public.nang_luc for delete to authenticated using ((select noi_bo.la_quan_tri()));

-- Hồ sơ năng lực: chỉ chủ hồ sơ và quản trị, vì quy định ai xem hồ sơ của ai chưa được chốt.
create policy doc on public.nang_luc_ghi_nhan for select to authenticated
  using (thanh_vien_id = (select noi_bo.toi()) or (select noi_bo.la_quan_tri()));
create policy doc on public.hoat_dong_ghi_nhan for select to authenticated
  using (thanh_vien_id = (select noi_bo.toi()) or (select noi_bo.la_quan_tri()));

create policy doc on public.bai_test for select to authenticated
  using ((select noi_bo.la_quan_tri()) or (trang_thai = 'mo' and (select noi_bo.toi()) is not null));
create policy them on public.bai_test for insert to authenticated with check ((select noi_bo.la_quan_tri()));
create policy sua on public.bai_test for update to authenticated using ((select noi_bo.la_quan_tri())) with check ((select noi_bo.la_quan_tri()));
create policy xoa on public.bai_test for delete to authenticated using ((select noi_bo.la_quan_tri()));

create policy doc on public.cau_hoi for select to authenticated using ((select noi_bo.la_quan_tri()));
create policy doc on public.dap_an for select to authenticated using ((select noi_bo.la_quan_tri()));
create policy doc on public.lam_bai for select to authenticated
  using (thanh_vien_id = (select noi_bo.toi()) or (select noi_bo.la_quan_tri()));

/* ---------- Dữ liệu khởi đầu ---------- */
insert into public.cai_dat (khoa, gia_tri) values ('danh_muc_da_duyet', 'false');

-- Danh sách lấy từ mẫu Hồ sơ năng lực (dữ liệu minh họa), chờ Danh mục năng lực v1 của BCN.
insert into public.nang_luc (nhom, ten, thu_tu) values
  ('A', 'Lãnh đạo', 1), ('A', 'Tổ chức sự kiện', 2), ('A', 'Làm việc nhóm', 3),
  ('B', 'Khâu cơ bản', 4), ('B', 'Đọc CT-scan bụng', 5), ('B', 'Đọc X-quang bụng', 6),
  ('B', 'Trình bày trước đám đông', 7), ('B', 'Thuyết trình học thuật', 8),
  ('B', 'Soạn slide trình chiếu', 9), ('B', 'Mentor (dẫn dắt đàn em)', 10);
