/* ============================================================================
   Migration 0014 — Phần B: buổi của đợt tập huấn
   Anh Long duyệt 18/11/2026, đã áp dụng cùng ngày (tên migration trên Supabase: buoi_dot).
   Kiểm sau khi áp dụng: 36 hàm trong tệp này khớp md5(prosrc) trên máy chủ; phần CLB không
   đổi (bảng điểm danh 94 dòng, số tổng 94/vắng 93, chuyên cần 94 dòng, điểm nhóm 12 dòng
   tổng 519,6, tình trạng kích hoạt 232 dòng — y như trước khi áp dụng); sequence hv_so vẫn ở 1.

   Phần B của việc gộp app Học viên vào app Thành viên (bản thiết kế 17/11/2026, mục 4.6):
   điểm danh vào và ra, lịch học, đăng ký chỗ, thông báo theo đợt, câu hỏi trong giờ,
   tài liệu, checklist.

   SỬA MỘT LỖI CỦA 0013 — mục 4 bên dưới.
   noi_bo.dong_diem_danh ghép mọi dòng trong public.thanh_vien với mọi buổi, nên khi đợt
   thật có học viên thì mỗi học viên hiện "vắng" trong mọi buổi sinh hoạt CLB: sai bảng
   điểm danh, sai số tổng, sai báo cáo chuyên cần. Ca thử trên cơ sở dữ liệu thật ngày
   18/11/2026 (trong giao dịch rồi hoàn tác): thêm một học viên thì bảng điểm danh buổi
   gần nhất tăng từ 94 lên 95 dòng, số vắng từ 93 lên 94. Hiện chưa có học viên thật nên
   chưa ai thấy sai, nhưng migration này phải áp dụng trước khi nạp đợt thật đầu tiên.
   Điểm nhóm không bị ảnh hưởng vì hàm diem_nhom đã lọc t.nha is not null.

   Nguyên tắc giữ nguyên từ các lần trước:
   - Trình duyệt chỉ đọc qua hàm security definer hoặc qua policy hẹp; bảng nào không cần
     cho trình duyệt thì bật RLS mà không có policy.
   - Buổi của CLB (dot_id is null) phải không đổi hành vi một li nào.
   ============================================================================ */

/* ============================================================ 1. Cột và bảng mới */

alter table public.buoi
  add column dot_id uuid references public.dot(id) on delete cascade,
  add column phan text check (phan in ('ly_thuyet', 'thuc_hanh', 'luong_gia', 'khac')),
  add column nhom_chon text,
  add column can_dang_ky boolean not null default false,
  add column suc_chua int check (suc_chua is null or suc_chua > 0),
  add column mo_dang_ky_tu timestamptz,
  add column han_dang_ky timestamptz,
  add column ra_sau_phut int check (ra_sau_phut is null or ra_sau_phut >= 0);

create index on public.buoi (dot_id, bat_dau);

comment on column public.buoi.dot_id is 'Null: buổi sinh hoạt của CLB. Có giá trị: buổi của đợt tập huấn.';
comment on column public.buoi.nhom_chon is 'Các buổi cùng một nhom_chon trong một đợt là các ca để học viên chọn lấy một.';
comment on column public.buoi.can_dang_ky is 'True: danh sách của buổi là người đã đăng ký, không phải cả đợt.';
comment on column public.buoi.ra_sau_phut is 'Null: buổi không điểm danh ra. Có số: quét lại sau bấy nhiêu phút thì tính là giờ ra.';

alter table public.diem_danh add column ra_luc timestamptz;
comment on column public.diem_danh.ra_luc is 'Giờ ra. Null nghĩa là chưa điểm danh ra hoặc buổi không tính giờ ra.';

alter table public.thong_bao add column dot_id uuid references public.dot(id) on delete cascade;
create index on public.thong_bao (dot_id, dang_luc desc);
comment on column public.thong_bao.dot_id is 'Null: thông báo của CLB. Có giá trị: thông báo chỉ gửi học viên và Ban tổ chức của đợt đó.';

-- Đăng ký chỗ cho ca thực hành, ca lượng giá. Ghi theo thứ tự bấm.
create table public.dang_ky_buoi (
  buoi_id uuid not null references public.buoi(id) on delete cascade,
  thanh_vien_id uuid not null references public.thanh_vien(id) on delete cascade,
  luc timestamptz not null default now(),
  primary key (buoi_id, thanh_vien_id)
);
create index on public.dang_ky_buoi (thanh_vien_id);

-- Tài liệu học: chỉ giữ đường dẫn (Drive), không giữ tệp. Mở theo giờ hoặc sau khi điểm danh.
create table public.dot_tai_lieu (
  id uuid primary key default gen_random_uuid(),
  dot_id uuid not null references public.dot(id) on delete cascade,
  buoi_id uuid references public.buoi(id) on delete set null,
  ten text not null,
  mo_ta text,
  lien_ket text not null,
  thu_tu int not null default 0,
  mo_tu timestamptz,
  can_diem_danh boolean not null default false,
  tao_boi uuid references public.thanh_vien(id) on delete set null,
  tao_luc timestamptz not null default now()
);
create index on public.dot_tai_lieu (dot_id, thu_tu);

-- Checklist để học viên tick trong giờ. Máy chủ chỉ giữ bản mẫu; cái học viên tick không gửi về.
create table public.dot_checklist (
  id uuid primary key default gen_random_uuid(),
  dot_id uuid not null references public.dot(id) on delete cascade,
  buoi_id uuid references public.buoi(id) on delete set null,
  ten text not null,
  mo_ta text,
  muc jsonb not null default '[]'::jsonb,
  thu_tu int not null default 0,
  tao_boi uuid references public.thanh_vien(id) on delete set null,
  tao_luc timestamptz not null default now()
);
create index on public.dot_checklist (dot_id, thu_tu);
comment on column public.dot_checklist.muc is 'Mảng nhóm: [{"ten": "Chuẩn bị", "muc": ["Rửa tay", "Mặc áo"]}].';

-- Câu hỏi gửi trong giờ học.
create table public.cau_hoi_buoi (
  id uuid primary key default gen_random_uuid(),
  buoi_id uuid not null references public.buoi(id) on delete cascade,
  nguoi uuid references public.thanh_vien(id) on delete set null,
  an_ten boolean not null default false,
  noi_dung text not null,
  luc timestamptz not null default now(),
  trang_thai text not null default 'moi' check (trang_thai in ('moi', 'da_tra_loi', 'an')),
  tra_loi text,
  tra_loi_boi uuid references public.thanh_vien(id) on delete set null,
  tra_loi_luc timestamptz
);
create index on public.cau_hoi_buoi (buoi_id, luc desc);
comment on column public.cau_hoi_buoi.an_ten is 'True: tên người gửi không hiện trên màn hình với bất kỳ ai. Dòng vẫn ghi nguoi để còn xử lý được khi có người viết xấu.';

create table public.cau_hoi_quan_tam (
  cau_hoi_id uuid not null references public.cau_hoi_buoi(id) on delete cascade,
  thanh_vien_id uuid not null references public.thanh_vien(id) on delete cascade,
  primary key (cau_hoi_id, thanh_vien_id)
);

alter table public.dang_ky_buoi enable row level security;
alter table public.dot_tai_lieu enable row level security;
alter table public.dot_checklist enable row level security;
alter table public.cau_hoi_buoi enable row level security;
alter table public.cau_hoi_quan_tam enable row level security;
-- Bốn bảng này không mở cho trình duyệt: chỉ các hàm bên dưới chạm vào. Linter báo INFO là đúng ý.
revoke all on public.dang_ky_buoi from anon, authenticated;
revoke all on public.dot_tai_lieu from anon, authenticated;
revoke all on public.dot_checklist from anon, authenticated;
revoke all on public.cau_hoi_buoi from anon, authenticated;
revoke all on public.cau_hoi_quan_tam from anon, authenticated;

/* ============================================================ 2. Ai được làm gì trong đợt

   la_btc_dot (đã có ở 0013) = quản lý đợt: quản trị, trưởng ban, thư ký.
   co_vai_dot = có một trong các vai được liệt kê, kể cả giảng viên và người điểm danh.
   o_trong_dot = học viên có tên trong đợt.
   thay_duoc_dot = một trong hai nhóm trên: được thấy lịch, tài liệu, thông báo của đợt. */

create function noi_bo.co_vai_dot(p_dot uuid, p_vai text[]) returns boolean
language sql stable security definer set search_path = '' as
$$ select p_dot is not null and (noi_bo.la_quan_tri() or exists (
     select 1 from public.dot_ban_to_chuc b
     where b.dot_id = p_dot and b.thanh_vien_id = noi_bo.toi() and b.vai = any(p_vai))) $$;

create function noi_bo.o_trong_dot(p_dot uuid) returns boolean
language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.dot_hoc_vien g
     where g.dot_id = p_dot and g.thanh_vien_id = noi_bo.toi() and g.trang_thai = 'ghi_danh') $$;

create function noi_bo.thay_duoc_dot(p_dot uuid) returns boolean
language sql stable security definer set search_path = '' as
$$ select noi_bo.co_vai_dot(p_dot, array['truong_ban', 'thu_ky', 'giang_vien', 'diem_danh'])
     or noi_bo.o_trong_dot(p_dot) $$;

-- Buổi của CLB: thành viên nào cũng thuộc. Buổi của đợt: người của đợt đó.
create function noi_bo.thuoc_buoi(p_buoi uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select case when b.dot_id is null then noi_bo.toi() is not null and not noi_bo.la_hoc_vien()
              else noi_bo.thay_duoc_dot(b.dot_id) end
  from public.buoi b where b.id = p_buoi
$$;

-- Đợt đang mở thì học viên mới gửi được gì lên; đợt kết thúc là chỉ đọc.
create function noi_bo.dot_dang_mo(p_dot uuid) returns boolean
language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.dot d where d.id = p_dot and d.trang_thai = 'mo') $$;

-- Người được điểm danh: buổi CLB giữ nguyên nếp cũ; buổi của đợt thì theo vai trong đợt.
create or replace function noi_bo.duoc_diem_danh(p_buoi uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select case when b.dot_id is null then
      noi_bo.la_phu_trach() or exists (select 1 from public.buoi_diem_danh g
        where g.buoi_id = b.id and g.thanh_vien_id = noi_bo.toi() and not b.dong)
    else
      noi_bo.la_quan_tri()
      or (not b.dong and noi_bo.co_vai_dot(b.dot_id, array['truong_ban', 'thu_ky', 'diem_danh']))
    end
  from public.buoi b where b.id = p_buoi
$$;

/* ============================================================ 3. Thẻ quét bằng camera thường
   Học viên cũng có khoa_qr. Thẻ in là thẻ của CLB nên chỉ tra trong thành viên CLB. */

create or replace function public.the_thanh_vien(p_khoa text) returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object('ho_ten', ho_ten, 'gen', gen, 'nha', nha, 'cap', cap, 'hoat_dong', hoat_dong)
  from public.thanh_vien where khoa_qr = p_khoa and loai = 'thanh_vien'
$$;

/* ============================================================ 4. SỬA LỖI: danh sách của một buổi

   Trước: cross join public.thanh_vien — mọi người trong bảng, kể cả học viên.
   Sau, theo loại buổi:
     buổi CLB (dot_id is null)        -> thành viên CLB đang hoạt động
     buổi đợt, can_dang_ky = false    -> học viên ghi danh trong đợt
     buổi đợt, can_dang_ky = true     -> học viên đã đăng ký đúng ca đó
   Thêm cột ra_luc nên phải drop rồi create, không create or replace được. */

drop function noi_bo.dong_diem_danh(timestamptz, timestamptz);
create function noi_bo.dong_diem_danh(p_tu timestamptz, p_den timestamptz)
returns table (buoi_id uuid, thanh_vien_id uuid, trang_thai text, luc timestamptz, tre_phut int,
               cach text, ly_do text, ra_luc timestamptz)
language sql stable security definer set search_path = '' as $$
  select b.id, t.id,
    case when d.thanh_vien_id is null then case when x.id is not null then 'phep' else 'vang' end
         when d.cach = 'bo_sung' or d.luc <= b.bat_dau + make_interval(mins => b.tre_sau_phut) then 'dung'
         else 'tre' end,
    d.luc,
    case when d.thanh_vien_id is not null and d.cach <> 'bo_sung' and d.luc > b.bat_dau + make_interval(mins => b.tre_sau_phut)
         then ceil(extract(epoch from d.luc - b.bat_dau) / 60)::int end,
    d.cach,
    x.ly_do,
    d.ra_luc
  from public.buoi b
  join public.thanh_vien t on case
    when b.dot_id is null then t.loai = 'thanh_vien'
    when b.can_dang_ky then exists (select 1 from public.dang_ky_buoi k
      where k.buoi_id = b.id and k.thanh_vien_id = t.id)
    else exists (select 1 from public.dot_hoc_vien g
      where g.dot_id = b.dot_id and g.thanh_vien_id = t.id and g.trang_thai = 'ghi_danh')
    end
  left join public.diem_danh d on d.buoi_id = b.id and d.thanh_vien_id = t.id
  left join public.xin_nghi x on x.buoi_id = b.id and x.thanh_vien_id = t.id and x.trang_thai = 'duyet'
  where b.bat_dau >= p_tu and b.bat_dau <= p_den
    and (d.thanh_vien_id is not null
      or (t.hoat_dong and (t.tham_gia_tu is null or t.tham_gia_tu <= (b.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date)))
$$;

-- Báo cáo chuyên cần và điểm nhóm là việc của CLB: chỉ tính buổi CLB.
create or replace function public.bao_cao_chuyen_can(p_tu timestamptz, p_den timestamptz)
returns table (ma text, ho_ten text, gen int, nha text, cap text, tong bigint, dung bigint, tre bigint, phep bigint, vang bigint)
language sql stable security definer set search_path = '' as $$
  select t.ma, t.ho_ten, t.gen, t.nha, t.cap, count(*),
    count(*) filter (where d.trang_thai = 'dung'), count(*) filter (where d.trang_thai = 'tre'),
    count(*) filter (where d.trang_thai = 'phep'), count(*) filter (where d.trang_thai = 'vang')
  from noi_bo.dong_diem_danh(p_tu, least(p_den, now())) d
  join public.buoi b on b.id = d.buoi_id and b.tinh_chuyen_can and b.dong and b.dot_id is null
  join public.thanh_vien t on t.id = d.thanh_vien_id
  where noi_bo.xem_duoc_ten()
  group by t.id order by t.nha nulls last, t.ho_ten
$$;

create or replace function public.diem_nhom(p_tu timestamptz, p_den timestamptz)
returns table (buoi_id uuid, bat_dau timestamptz, nha text, so_nguoi int, dung int, tre int, phep int, vang int, co_test boolean, so_lam int, tb_test numeric, diem_cc numeric, diem_test numeric, tong numeric)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if noi_bo.toi() is null then raise exception 'Chưa đăng nhập'; end if;
  perform noi_bo.cham_qua_han(null);
  return query
  with b as (
    select x.id, x.bat_dau from public.buoi x
    where x.tinh_chuyen_can and x.dong and x.dot_id is null and x.bat_dau >= p_tu and x.bat_dau <= least(p_den, now())
  ), dd as (
    select d.buoi_id, d.thanh_vien_id, d.trang_thai, t.nha
    from noi_bo.dong_diem_danh(p_tu, least(p_den, now())) d
    join b on b.id = d.buoi_id
    join public.thanh_vien t on t.id = d.thanh_vien_id
    where t.nha is not null and t.cap is distinct from 'Ban cố vấn'
  ), bt as (
    select x.id, x.buoi_id from public.bai_test x join b on b.id = x.buoi_id where x.trang_thai = 'mo'
  ), dt as (
    select dd.buoi_id, dd.thanh_vien_id, avg(coalesce(l.diem, 0)) diem, bool_or(l.diem is not null) co_lam
    from dd join bt on bt.buoi_id = dd.buoi_id
    left join lateral (select max(y.diem) diem from public.lam_bai y where y.bai_id = bt.id and y.thanh_vien_id = dd.thanh_vien_id and y.nop_luc is not null) l on true
    where dd.trang_thai in ('dung', 'tre')
    group by dd.buoi_id, dd.thanh_vien_id
  ), g as (
    select dd.buoi_id, dd.nha, count(*)::int so_nguoi,
      count(*) filter (where dd.trang_thai = 'dung')::int dung, count(*) filter (where dd.trang_thai = 'tre')::int tre,
      count(*) filter (where dd.trang_thai = 'phep')::int phep, count(*) filter (where dd.trang_thai = 'vang')::int vang,
      count(*) filter (where dt.co_lam)::int so_lam, avg(dt.diem) tb
    from dd left join dt on dt.buoi_id = dd.buoi_id and dt.thanh_vien_id = dd.thanh_vien_id
    group by dd.buoi_id, dd.nha
  )
  select g.buoi_id, b.bat_dau, g.nha, g.so_nguoi, g.dung, g.tre, g.phep, g.vang, k.co, g.so_lam, round(g.tb, 2),
    round(cc.v, 1), round(ts.v, 1),
    round(case when cc.v is null then null when k.co then cc.v + ts.v else cc.v * 100 / 60 end, 1)
  from g join b on b.id = g.buoi_id
  cross join lateral (select exists (select 1 from bt where bt.buoi_id = g.buoi_id) co) k
  cross join lateral (select case when g.so_nguoi - g.phep > 0 then 60.0 * (g.dung + 0.5 * g.tre) / (g.so_nguoi - g.phep) end v) cc
  cross join lateral (select case when k.co then 40.0 * coalesce(g.tb, 0) / 10 end v) ts
  order by b.bat_dau, g.nha;
end $$;

-- Số tổng của buổi: buổi CLB cho thành viên, buổi đợt cho người của đợt.
create or replace function public.so_tong_buoi(p_buoi uuid) returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'tong', count(*),
    'dung', count(*) filter (where d.trang_thai = 'dung'),
    'tre', count(*) filter (where d.trang_thai = 'tre'),
    'phep', count(*) filter (where d.trang_thai = 'phep'),
    'vang', count(*) filter (where d.trang_thai = 'vang'),
    'da_ra', count(*) filter (where d.ra_luc is not null))
  from public.buoi b
  cross join lateral noi_bo.dong_diem_danh(b.bat_dau, b.bat_dau) d
  where b.id = p_buoi and d.buoi_id = p_buoi and noi_bo.thuoc_buoi(p_buoi)
$$;

-- Chuyên cần của một người: học viên thì chỉ Ban tổ chức đợt xem được.
create or replace function public.chuyen_can(p_tv uuid, p_tu timestamptz, p_den timestamptz) returns json
language plpgsql stable security definer set search_path = '' as $$
declare kq json; la_hv boolean;
begin
  select loai = 'hoc_vien' into la_hv from public.thanh_vien where id = p_tv;
  if p_tv is distinct from noi_bo.toi() then
    if coalesce(la_hv, false) then
      if not noi_bo.xem_duoc_hoc_vien() then raise exception 'Không có quyền xem chuyên cần của người này'; end if;
    elsif not noi_bo.xem_duoc_ten() then raise exception 'Không có quyền xem chuyên cần của người này'; end if;
  end if;
  select json_build_object(
    'tong', count(*), 'dung', count(*) filter (where d.trang_thai = 'dung'), 'tre', count(*) filter (where d.trang_thai = 'tre'),
    'phep', count(*) filter (where d.trang_thai = 'phep'), 'vang', count(*) filter (where d.trang_thai = 'vang'))
  into kq
  from noi_bo.dong_diem_danh(p_tu, least(p_den, now())) d
  join public.buoi b on b.id = d.buoi_id
  where d.thanh_vien_id = p_tv and b.tinh_chuyen_can and b.dong;
  return kq;
end $$;

-- Bảng điểm danh: thêm giờ ra; buổi của đợt thì mọi vai trong Ban tổ chức đợt xem được.
drop function public.bang_diem_danh(uuid);
create function public.bang_diem_danh(p_buoi uuid)
returns table (thanh_vien_id uuid, ma text, ho_ten text, gen int, nha text, cap text, trang_thai text,
               luc timestamptz, tre_phut int, cach text, ly_do text, ra_luc timestamptz)
language sql stable security definer set search_path = '' as $$
  select t.id, t.ma, t.ho_ten, t.gen, t.nha, t.cap, d.trang_thai, d.luc, d.tre_phut, d.cach, d.ly_do, d.ra_luc
  from public.buoi b
  cross join lateral noi_bo.dong_diem_danh(b.bat_dau, b.bat_dau) d
  join public.thanh_vien t on t.id = d.thanh_vien_id
  where b.id = p_buoi and d.buoi_id = p_buoi
    and case when b.dot_id is null then noi_bo.xem_duoc_ten() or noi_bo.duoc_diem_danh(p_buoi)
             else noi_bo.co_vai_dot(b.dot_id, array['truong_ban', 'thu_ky', 'giang_vien', 'diem_danh']) end
  order by t.ho_ten
$$;

/* ============================================================ 5. Quy tắc đọc buổi, điểm danh, thông báo */

drop policy doc on public.buoi;
create policy doc on public.buoi for select to authenticated
  using (case when dot_id is null then (select noi_bo.toi()) is not null and not (select noi_bo.la_hoc_vien())
              else (select noi_bo.thay_duoc_dot(dot_id)) end);

-- Buổi của đợt không sửa trực tiếp từ trình duyệt, chỉ qua luu_buoi_dot.
drop policy them on public.buoi;
drop policy sua on public.buoi;
drop policy xoa on public.buoi;
create policy them on public.buoi for insert to authenticated
  with check (dot_id is null and (select noi_bo.la_phu_trach()));
create policy sua on public.buoi for update to authenticated
  using (dot_id is null and (select noi_bo.la_phu_trach()))
  with check (dot_id is null and (select noi_bo.la_phu_trach()));
create policy xoa on public.buoi for delete to authenticated
  using (dot_id is null and (select noi_bo.la_quan_tri()));

drop policy doc on public.diem_danh;
create policy doc on public.diem_danh for select to authenticated
  using (thanh_vien_id = (select noi_bo.toi())
    or exists (select 1 from public.buoi b where b.id = buoi_id
      and case when b.dot_id is null then (select noi_bo.xem_duoc_ten())
               else (select noi_bo.co_vai_dot(b.dot_id, array['truong_ban', 'thu_ky', 'giang_vien', 'diem_danh'])) end));

drop policy doc on public.thong_bao;
drop policy them on public.thong_bao;
drop policy sua on public.thong_bao;
drop policy xoa on public.thong_bao;
create policy doc on public.thong_bao for select to authenticated
  using (case when dot_id is null then (select noi_bo.toi()) is not null and not (select noi_bo.la_hoc_vien())
              else (select noi_bo.thay_duoc_dot(dot_id)) end);
create policy them on public.thong_bao for insert to authenticated
  with check (dot_id is null and (select noi_bo.la_quan_tri()));
create policy sua on public.thong_bao for update to authenticated
  using (dot_id is null and (select noi_bo.la_quan_tri()))
  with check (dot_id is null and (select noi_bo.la_quan_tri()));
create policy xoa on public.thong_bao for delete to authenticated
  using (dot_id is null and (select noi_bo.la_quan_tri()));

/* ============================================================ 6. Buổi của đợt

   luu_buoi_dot nhận cả object, không ghép với giá trị cũ, để Ban tổ chức xóa được
   sức chứa hay hạn đăng ký đã đặt. Giao diện luôn gửi đủ các ô. */

create function public.luu_buoi_dot(p_id uuid, p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := p_id; v_dot uuid; v_ten text := btrim(coalesce(p ->> 'ten', ''));
begin
  if v_ten = '' then raise exception 'Buổi phải có tên'; end if;
  if nullif(btrim(coalesce(p ->> 'bat_dau', '')), '') is null then raise exception 'Buổi phải có giờ bắt đầu'; end if;
  if v_id is null then
    v_dot := nullif(btrim(coalesce(p ->> 'dot_id', '')), '')::uuid;
  else
    select dot_id into v_dot from public.buoi where id = v_id;
    if v_dot is null then raise exception 'Buổi này không thuộc đợt tập huấn nào'; end if;
  end if;
  if not noi_bo.la_btc_dot(v_dot) then raise exception 'Chỉ trưởng ban, thư ký của đợt và quản trị được sửa buổi'; end if;

  if v_id is null then
    insert into public.buoi (dot_id, ten, bat_dau, ket_thuc, dia_diem, noi_dung, phan, nhom_chon,
      can_dang_ky, suc_chua, mo_dang_ky_tu, han_dang_ky, tre_sau_phut, ra_sau_phut, tinh_chuyen_can, tao_boi)
    values (v_dot, v_ten,
      (p ->> 'bat_dau')::timestamptz,
      nullif(btrim(coalesce(p ->> 'ket_thuc', '')), '')::timestamptz,
      nullif(btrim(coalesce(p ->> 'dia_diem', '')), ''),
      nullif(btrim(coalesce(p ->> 'noi_dung', '')), ''),
      nullif(btrim(coalesce(p ->> 'phan', '')), ''),
      nullif(btrim(coalesce(p ->> 'nhom_chon', '')), ''),
      coalesce((p ->> 'can_dang_ky')::boolean, false),
      nullif(btrim(coalesce(p ->> 'suc_chua', '')), '')::int,
      nullif(btrim(coalesce(p ->> 'mo_dang_ky_tu', '')), '')::timestamptz,
      nullif(btrim(coalesce(p ->> 'han_dang_ky', '')), '')::timestamptz,
      coalesce(nullif(btrim(coalesce(p ->> 'tre_sau_phut', '')), '')::int, 10),
      nullif(btrim(coalesce(p ->> 'ra_sau_phut', '')), '')::int,
      coalesce((p ->> 'tinh_chuyen_can')::boolean, true),
      noi_bo.toi())
    returning id into v_id;
  else
    update public.buoi set
      ten = v_ten,
      bat_dau = (p ->> 'bat_dau')::timestamptz,
      ket_thuc = nullif(btrim(coalesce(p ->> 'ket_thuc', '')), '')::timestamptz,
      dia_diem = nullif(btrim(coalesce(p ->> 'dia_diem', '')), ''),
      noi_dung = nullif(btrim(coalesce(p ->> 'noi_dung', '')), ''),
      phan = nullif(btrim(coalesce(p ->> 'phan', '')), ''),
      nhom_chon = nullif(btrim(coalesce(p ->> 'nhom_chon', '')), ''),
      can_dang_ky = coalesce((p ->> 'can_dang_ky')::boolean, false),
      suc_chua = nullif(btrim(coalesce(p ->> 'suc_chua', '')), '')::int,
      mo_dang_ky_tu = nullif(btrim(coalesce(p ->> 'mo_dang_ky_tu', '')), '')::timestamptz,
      han_dang_ky = nullif(btrim(coalesce(p ->> 'han_dang_ky', '')), '')::timestamptz,
      tre_sau_phut = coalesce(nullif(btrim(coalesce(p ->> 'tre_sau_phut', '')), '')::int, 10),
      ra_sau_phut = nullif(btrim(coalesce(p ->> 'ra_sau_phut', '')), '')::int,
      tinh_chuyen_can = coalesce((p ->> 'tinh_chuyen_can')::boolean, true),
      dong = coalesce((p ->> 'dong')::boolean, dong)
    where id = v_id;
  end if;
  perform noi_bo.ghi_nhat_ky_dot(v_dot, case when p_id is null then 'Thêm buổi' else 'Sửa buổi' end, v_ten);
  return v_id;
end $$;

create function public.xoa_buoi_dot(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_dot uuid; v_ten text;
begin
  select dot_id, ten into v_dot, v_ten from public.buoi where id = p_id;
  if v_dot is null then raise exception 'Buổi này không thuộc đợt tập huấn nào'; end if;
  if not noi_bo.la_btc_dot(v_dot) then raise exception 'Chỉ trưởng ban, thư ký của đợt và quản trị được xóa buổi'; end if;
  if exists (select 1 from public.diem_danh where buoi_id = p_id) then
    raise exception 'Buổi này đã có điểm danh. Đóng buổi thay vì xóa, để giữ lại dữ liệu.';
  end if;
  delete from public.buoi where id = p_id;
  perform noi_bo.ghi_nhat_ky_dot(v_dot, 'Xóa buổi', v_ten);
end $$;

create function public.ds_buoi_dot(p_dot uuid) returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object(
    'id', b.id, 'ten', b.ten, 'bat_dau', b.bat_dau, 'ket_thuc', b.ket_thuc,
    'dia_diem', b.dia_diem, 'noi_dung', b.noi_dung, 'phan', b.phan, 'nhom_chon', b.nhom_chon,
    'can_dang_ky', b.can_dang_ky, 'suc_chua', b.suc_chua,
    'mo_dang_ky_tu', b.mo_dang_ky_tu, 'han_dang_ky', b.han_dang_ky,
    'tre_sau_phut', b.tre_sau_phut, 'ra_sau_phut', b.ra_sau_phut,
    'tinh_chuyen_can', b.tinh_chuyen_can, 'dong', b.dong,
    'so_dang_ky', (select count(*) from public.dang_ky_buoi k where k.buoi_id = b.id),
    'so_diem_danh', (select count(*) from public.diem_danh d where d.buoi_id = b.id),
    'toi_dang_ky', exists (select 1 from public.dang_ky_buoi k where k.buoi_id = b.id and k.thanh_vien_id = noi_bo.toi()),
    'toi_vao', (select d.luc from public.diem_danh d where d.buoi_id = b.id and d.thanh_vien_id = noi_bo.toi()),
    'toi_ra', (select d.ra_luc from public.diem_danh d where d.buoi_id = b.id and d.thanh_vien_id = noi_bo.toi())
    ) order by b.bat_dau), '[]')
  from public.buoi b where b.dot_id = p_dot and noi_bo.thay_duoc_dot(p_dot)
$$;

/* ============================================================ 7. Đăng ký chỗ

   Khóa dòng buổi bằng for update: hai người bấm cùng giây thì người sau phải chờ người
   trước ghi xong mới đếm lại, nên không có chuyện hai người cùng lấy chỗ cuối. */

create function public.chon_buoi(p_buoi uuid) returns json
language plpgsql security definer set search_path = '' as $$
declare b public.buoi; me uuid := noi_bo.toi(); v_dem int; v_khac text;
begin
  if me is null then raise exception 'Chưa đăng nhập'; end if;
  select * into b from public.buoi where id = p_buoi for update;
  if b.id is null then raise exception 'Không tìm thấy buổi'; end if;
  if b.dot_id is null then raise exception 'Buổi này không thuộc đợt tập huấn'; end if;
  if not noi_bo.o_trong_dot(b.dot_id) then raise exception 'Bạn không có tên trong đợt này'; end if;
  if not noi_bo.dot_dang_mo(b.dot_id) then raise exception 'Đợt chưa mở hoặc đã kết thúc'; end if;
  if not b.can_dang_ky then raise exception 'Buổi này không cần đăng ký'; end if;
  if b.mo_dang_ky_tu is not null and now() < b.mo_dang_ky_tu then
    return json_build_object('ok', false, 'loi', 'Chưa tới giờ mở đăng ký.'); end if;
  if b.han_dang_ky is not null and now() > b.han_dang_ky then
    return json_build_object('ok', false, 'loi', 'Đã quá hạn đăng ký.'); end if;

  select count(*) into v_dem from public.dang_ky_buoi k where k.buoi_id = b.id;
  if exists (select 1 from public.dang_ky_buoi k where k.buoi_id = b.id and k.thanh_vien_id = me) then
    return json_build_object('ok', true, 'da_co', true,
      'con_lai', case when b.suc_chua is not null then b.suc_chua - v_dem end);
  end if;
  if b.nhom_chon is not null then
    select x.ten into v_khac from public.dang_ky_buoi k join public.buoi x on x.id = k.buoi_id
    where k.thanh_vien_id = me and x.dot_id = b.dot_id and x.nhom_chon = b.nhom_chon and x.id <> b.id limit 1;
    if v_khac is not null then
      return json_build_object('ok', false, 'loi', 'Bạn đã chọn ca ' || v_khac || '. Bỏ ca đó trước rồi chọn lại.');
    end if;
  end if;
  if b.suc_chua is not null and v_dem >= b.suc_chua then
    return json_build_object('ok', false, 'het_cho', true, 'loi', 'Ca này đã đủ ' || b.suc_chua || ' chỗ.');
  end if;
  insert into public.dang_ky_buoi (buoi_id, thanh_vien_id) values (b.id, me);
  return json_build_object('ok', true, 'con_lai', case when b.suc_chua is not null then b.suc_chua - v_dem - 1 end);
end $$;

create function public.bo_chon_buoi(p_buoi uuid) returns json
language plpgsql security definer set search_path = '' as $$
declare b public.buoi; me uuid := noi_bo.toi();
begin
  if me is null then raise exception 'Chưa đăng nhập'; end if;
  select * into b from public.buoi where id = p_buoi;
  if b.id is null or b.dot_id is null then raise exception 'Không tìm thấy buổi'; end if;
  if not noi_bo.dot_dang_mo(b.dot_id) then raise exception 'Đợt chưa mở hoặc đã kết thúc'; end if;
  if b.han_dang_ky is not null and now() > b.han_dang_ky then
    return json_build_object('ok', false, 'loi', 'Đã quá hạn đăng ký, không bỏ ca được nữa. Nhắn Ban tổ chức nếu cần đổi.');
  end if;
  if exists (select 1 from public.diem_danh d where d.buoi_id = b.id and d.thanh_vien_id = me) then
    return json_build_object('ok', false, 'loi', 'Bạn đã điểm danh buổi này nên không bỏ được.');
  end if;
  delete from public.dang_ky_buoi where buoi_id = b.id and thanh_vien_id = me;
  return json_build_object('ok', true);
end $$;

create function public.ds_dang_ky_buoi(p_buoi uuid) returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object(
    'thanh_vien_id', t.id, 'ma', t.ma, 'ho_ten', t.ho_ten, 'luc', k.luc) order by k.luc), '[]')
  from public.dang_ky_buoi k
  join public.thanh_vien t on t.id = k.thanh_vien_id
  join public.buoi b on b.id = k.buoi_id
  where k.buoi_id = p_buoi
    and case when b.dot_id is null then noi_bo.xem_duoc_ten()
             else noi_bo.co_vai_dot(b.dot_id, array['truong_ban', 'thu_ky', 'giang_vien', 'diem_danh']) end
$$;

-- Ban tổ chức xếp người vào ca khi học viên không tự chọn được.
create function public.dat_dang_ky_buoi(p_buoi uuid, p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare v_dot uuid;
begin
  select dot_id into v_dot from public.buoi where id = p_buoi;
  if v_dot is null then raise exception 'Buổi này không thuộc đợt tập huấn nào'; end if;
  if not noi_bo.la_btc_dot(v_dot) then raise exception 'Chỉ trưởng ban, thư ký của đợt và quản trị được xếp ca'; end if;
  delete from public.dang_ky_buoi k where k.buoi_id = p_buoi
    and not (k.thanh_vien_id = any(coalesce(p_ids, '{}')))
    and not exists (select 1 from public.diem_danh d where d.buoi_id = p_buoi and d.thanh_vien_id = k.thanh_vien_id);
  insert into public.dang_ky_buoi (buoi_id, thanh_vien_id)
  select p_buoi, g.thanh_vien_id from public.dot_hoc_vien g
  where g.dot_id = v_dot and g.trang_thai = 'ghi_danh' and g.thanh_vien_id = any(coalesce(p_ids, '{}'))
  on conflict do nothing;
  perform noi_bo.ghi_nhat_ky_dot(v_dot, 'Xếp ca', coalesce(array_length(p_ids, 1), 0) || ' học viên');
end $$;

/* ============================================================ 8. Điểm danh vào và ra

   Quét lần đầu là vào. Quét lại sau ra_sau_phut phút là ra. Buổi để ra_sau_phut trống
   thì không có giờ ra, y như mọi buổi sinh hoạt CLB từ trước tới nay. */

create or replace function public.ghi_diem_danh(p_buoi uuid, p_khoa text, p_tv uuid, p_luc timestamptz, p_cach text)
returns json language plpgsql security definer set search_path = '' as $$
declare b public.buoi; t public.thanh_vien; c text := coalesce(p_cach, 'qr'); l timestamptz := coalesce(p_luc, now());
  cu public.diem_danh; moi boolean; la_ra boolean := false; con_phut int; trong_ds boolean;
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

  -- Người quét phải thuộc danh sách của đúng buổi này.
  if b.dot_id is null then
    trong_ds := t.loai = 'thanh_vien';
    if not trong_ds then
      return json_build_object('ok', false, 'id', t.id, 'ho_ten', t.ho_ten,
        'loi', 'Đây là mã của học viên tập huấn, không thuộc buổi sinh hoạt CLB.');
    end if;
  else
    trong_ds := exists (select 1 from public.dot_hoc_vien g
      where g.dot_id = b.dot_id and g.thanh_vien_id = t.id and g.trang_thai = 'ghi_danh');
    if trong_ds and b.can_dang_ky then
      trong_ds := exists (select 1 from public.dang_ky_buoi k where k.buoi_id = b.id and k.thanh_vien_id = t.id);
      if not trong_ds then
        return json_build_object('ok', false, 'id', t.id, 'ho_ten', t.ho_ten,
          'loi', t.ho_ten || ' chưa đăng ký ca này. Xếp vào ca rồi điểm danh lại.');
      end if;
    end if;
    if not trong_ds then
      return json_build_object('ok', false, 'id', t.id, 'ho_ten', t.ho_ten,
        'loi', 'Người này không có tên trong đợt tập huấn này.');
    end if;
  end if;

  -- Ghi tay sau buổi hơn 8 giờ thì không lấy giờ bấm làm giờ đến.
  if c = 'tay' and l > b.bat_dau + interval '8 hours' then c := 'bo_sung'; l := b.bat_dau; end if;
  select * into cu from public.diem_danh where buoi_id = b.id and thanh_vien_id = t.id;
  moi := cu.buoi_id is null;
  if moi then
    insert into public.diem_danh (buoi_id, thanh_vien_id, luc, cach, ghi_boi) values (b.id, t.id, l, c, noi_bo.toi())
    on conflict (buoi_id, thanh_vien_id) do update set luc = least(public.diem_danh.luc, excluded.luc)
    returning * into cu;
  elsif b.ra_sau_phut is null then
    update public.diem_danh set luc = least(luc, l) where buoi_id = b.id and thanh_vien_id = t.id returning * into cu;
  elsif cu.ra_luc is not null then
    la_ra := true;
  elsif l >= cu.luc + make_interval(mins => b.ra_sau_phut) then
    update public.diem_danh set ra_luc = l where buoi_id = b.id and thanh_vien_id = t.id returning * into cu;
    la_ra := true;
  else
    con_phut := greatest(ceil(extract(epoch from cu.luc + make_interval(mins => b.ra_sau_phut) - l) / 60)::int, 1);
  end if;

  return json_build_object('ok', true, 'moi', moi, 'ra', la_ra, 'con_phut', con_phut,
    'id', t.id, 'ma', t.ma, 'ho_ten', t.ho_ten, 'gen', t.gen, 'nha', t.nha, 'cap', t.cap, 'loai', t.loai,
    'hoat_dong', t.hoat_dong, 'luc', cu.luc, 'ra_luc', cu.ra_luc, 'cach', cu.cach,
    'tre_phut', case when cu.cach <> 'bo_sung' and cu.luc > b.bat_dau + make_interval(mins => b.tre_sau_phut) then ceil(extract(epoch from cu.luc - b.bat_dau) / 60)::int end);
end $$;

-- Đặt hoặc xóa giờ ra bằng tay.
create function public.dat_gio_ra(p_buoi uuid, p_tv uuid, p_luc timestamptz) returns json
language plpgsql security definer set search_path = '' as $$
declare cu public.diem_danh; l timestamptz := coalesce(p_luc, now());
begin
  if not noi_bo.duoc_diem_danh(p_buoi) then raise exception 'Bạn chưa được giao điểm danh buổi này'; end if;
  if (select dong from public.buoi where id = p_buoi) and not noi_bo.la_quan_tri() then
    raise exception 'Buổi đã đóng. Nhờ quản trị mở lại nếu cần sửa.'; end if;
  select * into cu from public.diem_danh where buoi_id = p_buoi and thanh_vien_id = p_tv;
  if cu.buoi_id is null then return json_build_object('ok', false, 'loi', 'Người này chưa điểm danh vào.'); end if;
  if p_luc is not null and l < cu.luc then return json_build_object('ok', false, 'loi', 'Giờ ra không thể trước giờ vào.'); end if;
  update public.diem_danh set ra_luc = p_luc where buoi_id = p_buoi and thanh_vien_id = p_tv returning * into cu;
  return json_build_object('ok', true, 'luc', cu.luc, 'ra_luc', cu.ra_luc);
end $$;

/* ============================================================ 9. Tài liệu học */

create function public.luu_tai_lieu_dot(p_id uuid, p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := p_id; v_dot uuid; v_ten text := btrim(coalesce(p ->> 'ten', ''));
  v_lk text := btrim(coalesce(p ->> 'lien_ket', ''));
begin
  if v_ten = '' then raise exception 'Tài liệu phải có tên'; end if;
  if v_lk !~* '^https?://' then raise exception 'Đường dẫn phải bắt đầu bằng http:// hoặc https://'; end if;
  if v_id is null then v_dot := nullif(btrim(coalesce(p ->> 'dot_id', '')), '')::uuid;
  else select dot_id into v_dot from public.dot_tai_lieu where id = v_id; end if;
  if not noi_bo.co_vai_dot(v_dot, array['truong_ban', 'thu_ky', 'giang_vien']) then
    raise exception 'Chỉ Ban tổ chức của đợt được thêm tài liệu'; end if;
  if v_id is null then
    insert into public.dot_tai_lieu (dot_id, buoi_id, ten, mo_ta, lien_ket, thu_tu, mo_tu, can_diem_danh, tao_boi)
    values (v_dot, nullif(btrim(coalesce(p ->> 'buoi_id', '')), '')::uuid, v_ten,
      nullif(btrim(coalesce(p ->> 'mo_ta', '')), ''), v_lk,
      coalesce(nullif(btrim(coalesce(p ->> 'thu_tu', '')), '')::int, 0),
      nullif(btrim(coalesce(p ->> 'mo_tu', '')), '')::timestamptz,
      coalesce((p ->> 'can_diem_danh')::boolean, false), noi_bo.toi())
    returning id into v_id;
  else
    update public.dot_tai_lieu set
      buoi_id = nullif(btrim(coalesce(p ->> 'buoi_id', '')), '')::uuid,
      ten = v_ten, mo_ta = nullif(btrim(coalesce(p ->> 'mo_ta', '')), ''), lien_ket = v_lk,
      thu_tu = coalesce(nullif(btrim(coalesce(p ->> 'thu_tu', '')), '')::int, 0),
      mo_tu = nullif(btrim(coalesce(p ->> 'mo_tu', '')), '')::timestamptz,
      can_diem_danh = coalesce((p ->> 'can_diem_danh')::boolean, false)
    where id = v_id;
  end if;
  perform noi_bo.ghi_nhat_ky_dot(v_dot, case when p_id is null then 'Thêm tài liệu' else 'Sửa tài liệu' end, v_ten);
  return v_id;
end $$;

create function public.xoa_tai_lieu_dot(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_dot uuid; v_ten text;
begin
  select dot_id, ten into v_dot, v_ten from public.dot_tai_lieu where id = p_id;
  if v_dot is null then raise exception 'Không tìm thấy tài liệu'; end if;
  if not noi_bo.co_vai_dot(v_dot, array['truong_ban', 'thu_ky', 'giang_vien']) then
    raise exception 'Chỉ Ban tổ chức của đợt được xóa tài liệu'; end if;
  delete from public.dot_tai_lieu where id = p_id;
  perform noi_bo.ghi_nhat_ky_dot(v_dot, 'Xóa tài liệu', v_ten);
end $$;

-- Ban tổ chức thấy hết. Học viên chỉ thấy đường dẫn khi đã tới giờ mở và đã điểm danh nếu buổi yêu cầu.
create function public.ds_tai_lieu_dot(p_dot uuid) returns json
language sql stable security definer set search_path = '' as $$
  with ql as (select noi_bo.co_vai_dot(p_dot, array['truong_ban', 'thu_ky', 'giang_vien', 'diem_danh']) as co)
  select coalesce(json_agg(json_build_object(
    'id', x.id, 'buoi_id', x.buoi_id, 'buoi_ten', b.ten, 'buoi_bat_dau', b.bat_dau,
    'ten', x.ten, 'mo_ta', x.mo_ta, 'thu_tu', x.thu_tu,
    'mo_tu', x.mo_tu, 'can_diem_danh', x.can_diem_danh,
    'mo', v.mo, 'vuong', v.vuong,
    'lien_ket', case when v.mo then x.lien_ket end) order by x.thu_tu, b.bat_dau nulls first, x.ten), '[]')
  from public.dot_tai_lieu x
  left join public.buoi b on b.id = x.buoi_id
  cross join ql
  cross join lateral (
    -- can_diem_danh chỉ có nghĩa khi tài liệu gắn với một buổi; không gắn buổi thì mở luôn.
    select case when ql.co then true
                when x.mo_tu is not null and now() < x.mo_tu then false
                when x.can_diem_danh and x.buoi_id is not null and not exists (select 1 from public.diem_danh d
                  where d.buoi_id = x.buoi_id and d.thanh_vien_id = noi_bo.toi()) then false
                else true end as mo,
           case when ql.co then null
                when x.mo_tu is not null and now() < x.mo_tu then 'chua_den_gio'
                when x.can_diem_danh and x.buoi_id is not null and not exists (select 1 from public.diem_danh d
                  where d.buoi_id = x.buoi_id and d.thanh_vien_id = noi_bo.toi()) then 'can_diem_danh'
                end as vuong) v
  where x.dot_id = p_dot and noi_bo.thay_duoc_dot(p_dot)
$$;

/* ============================================================ 10. Checklist

   Máy chủ chỉ giữ bản mẫu. Học viên tick trong trình duyệt, không gửi gì về máy chủ,
   nên không có bảng ghi cái đã tick. In ra PDF bằng chức năng in của trình duyệt. */

create function public.luu_checklist_dot(p_id uuid, p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := p_id; v_dot uuid; v_ten text := btrim(coalesce(p ->> 'ten', ''));
begin
  if v_ten = '' then raise exception 'Checklist phải có tên'; end if;
  if jsonb_typeof(coalesce(p -> 'muc', '[]'::jsonb)) <> 'array' then raise exception 'Mục phải là một mảng'; end if;
  if v_id is null then v_dot := nullif(btrim(coalesce(p ->> 'dot_id', '')), '')::uuid;
  else select dot_id into v_dot from public.dot_checklist where id = v_id; end if;
  if not noi_bo.co_vai_dot(v_dot, array['truong_ban', 'thu_ky', 'giang_vien']) then
    raise exception 'Chỉ Ban tổ chức của đợt được soạn checklist'; end if;
  if v_id is null then
    insert into public.dot_checklist (dot_id, buoi_id, ten, mo_ta, muc, thu_tu, tao_boi)
    values (v_dot, nullif(btrim(coalesce(p ->> 'buoi_id', '')), '')::uuid, v_ten,
      nullif(btrim(coalesce(p ->> 'mo_ta', '')), ''), coalesce(p -> 'muc', '[]'::jsonb),
      coalesce(nullif(btrim(coalesce(p ->> 'thu_tu', '')), '')::int, 0), noi_bo.toi())
    returning id into v_id;
  else
    update public.dot_checklist set
      buoi_id = nullif(btrim(coalesce(p ->> 'buoi_id', '')), '')::uuid,
      ten = v_ten, mo_ta = nullif(btrim(coalesce(p ->> 'mo_ta', '')), ''),
      muc = coalesce(p -> 'muc', '[]'::jsonb),
      thu_tu = coalesce(nullif(btrim(coalesce(p ->> 'thu_tu', '')), '')::int, 0)
    where id = v_id;
  end if;
  perform noi_bo.ghi_nhat_ky_dot(v_dot, case when p_id is null then 'Thêm checklist' else 'Sửa checklist' end, v_ten);
  return v_id;
end $$;

create function public.xoa_checklist_dot(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_dot uuid; v_ten text;
begin
  select dot_id, ten into v_dot, v_ten from public.dot_checklist where id = p_id;
  if v_dot is null then raise exception 'Không tìm thấy checklist'; end if;
  if not noi_bo.co_vai_dot(v_dot, array['truong_ban', 'thu_ky', 'giang_vien']) then
    raise exception 'Chỉ Ban tổ chức của đợt được xóa checklist'; end if;
  delete from public.dot_checklist where id = p_id;
  perform noi_bo.ghi_nhat_ky_dot(v_dot, 'Xóa checklist', v_ten);
end $$;

create function public.ds_checklist_dot(p_dot uuid) returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object(
    'id', x.id, 'buoi_id', x.buoi_id, 'buoi_ten', b.ten, 'ten', x.ten, 'mo_ta', x.mo_ta,
    'muc', x.muc, 'thu_tu', x.thu_tu) order by x.thu_tu, x.ten), '[]')
  from public.dot_checklist x
  left join public.buoi b on b.id = x.buoi_id
  where x.dot_id = p_dot and noi_bo.thay_duoc_dot(p_dot)
$$;

/* ============================================================ 11. Câu hỏi trong giờ

   Ẩn tên nghĩa là tên không hiện trên màn hình với bất kỳ ai, kể cả Ban tổ chức.
   Dòng vẫn ghi người gửi để còn xử lý được khi có người viết xấu — giao diện phải nói đúng
   như vậy, không được hứa là máy chủ không biết ai gửi. */

create function public.gui_cau_hoi_buoi(p_buoi uuid, p_noi_dung text, p_an_ten boolean) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_dot uuid; v_dong boolean; nd text := btrim(coalesce(p_noi_dung, ''));
begin
  if noi_bo.toi() is null then raise exception 'Chưa đăng nhập'; end if;
  if nd = '' then raise exception 'Câu hỏi còn trống'; end if;
  if length(nd) > 2000 then raise exception 'Câu hỏi dài quá 2000 chữ'; end if;
  select b.dot_id, b.dong into v_dot, v_dong from public.buoi b where b.id = p_buoi;
  if not found then raise exception 'Không tìm thấy buổi'; end if;
  if not coalesce(noi_bo.thuoc_buoi(p_buoi), false) then raise exception 'Bạn không thuộc buổi này'; end if;
  if v_dot is not null and not noi_bo.dot_dang_mo(v_dot) and noi_bo.la_hoc_vien() then
    raise exception 'Đợt đã kết thúc, không gửi câu hỏi được nữa'; end if;
  if v_dong then raise exception 'Buổi đã đóng'; end if;
  insert into public.cau_hoi_buoi (buoi_id, nguoi, an_ten, noi_dung)
  values (p_buoi, noi_bo.toi(), coalesce(p_an_ten, false), nd)
  returning id into v_id;
  return v_id;
end $$;

create function public.ds_cau_hoi_buoi(p_buoi uuid) returns json
language sql stable security definer set search_path = '' as $$
  with ql as (select coalesce(noi_bo.co_vai_dot((select dot_id from public.buoi where id = p_buoi),
      array['truong_ban', 'thu_ky', 'giang_vien']), false) or noi_bo.xem_duoc_ten() as co)
  select coalesce(json_agg(json_build_object(
    'id', q.id, 'noi_dung', q.noi_dung, 'luc', q.luc, 'an_ten', q.an_ten,
    'ho_ten', case when q.an_ten then null else t.ho_ten end,
    'la_cua_toi', q.nguoi = noi_bo.toi(),
    'trang_thai', q.trang_thai, 'tra_loi', q.tra_loi, 'tra_loi_luc', q.tra_loi_luc,
    'so_quan_tam', (select count(*) from public.cau_hoi_quan_tam z where z.cau_hoi_id = q.id),
    'toi_quan_tam', exists (select 1 from public.cau_hoi_quan_tam z where z.cau_hoi_id = q.id and z.thanh_vien_id = noi_bo.toi()))
    order by (select count(*) from public.cau_hoi_quan_tam z where z.cau_hoi_id = q.id) desc, q.luc desc), '[]')
  from public.cau_hoi_buoi q
  left join public.thanh_vien t on t.id = q.nguoi
  cross join ql
  where q.buoi_id = p_buoi and noi_bo.thuoc_buoi(p_buoi)
    and (q.trang_thai <> 'an' or ql.co or q.nguoi = noi_bo.toi())
$$;

create function public.quan_tam_cau_hoi(p_id uuid, p_bat boolean) returns int
language plpgsql security definer set search_path = '' as $$
declare v_buoi uuid;
begin
  select buoi_id into v_buoi from public.cau_hoi_buoi where id = p_id;
  if v_buoi is null then raise exception 'Không tìm thấy câu hỏi'; end if;
  if not noi_bo.thuoc_buoi(v_buoi) then raise exception 'Bạn không thuộc buổi này'; end if;
  if coalesce(p_bat, true) then
    insert into public.cau_hoi_quan_tam (cau_hoi_id, thanh_vien_id) values (p_id, noi_bo.toi()) on conflict do nothing;
  else
    delete from public.cau_hoi_quan_tam where cau_hoi_id = p_id and thanh_vien_id = noi_bo.toi();
  end if;
  return (select count(*)::int from public.cau_hoi_quan_tam where cau_hoi_id = p_id);
end $$;

create function public.tra_loi_cau_hoi_buoi(p_id uuid, p_tra_loi text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_buoi uuid; v_dot uuid;
begin
  select q.buoi_id, b.dot_id into v_buoi, v_dot from public.cau_hoi_buoi q join public.buoi b on b.id = q.buoi_id where q.id = p_id;
  if v_buoi is null then raise exception 'Không tìm thấy câu hỏi'; end if;
  if not (case when v_dot is null then noi_bo.xem_duoc_ten()
               else noi_bo.co_vai_dot(v_dot, array['truong_ban', 'thu_ky', 'giang_vien']) end)
  then raise exception 'Chỉ Ban tổ chức và giảng viên được trả lời'; end if;
  update public.cau_hoi_buoi set
    tra_loi = nullif(btrim(coalesce(p_tra_loi, '')), ''),
    tra_loi_boi = noi_bo.toi(),
    tra_loi_luc = case when nullif(btrim(coalesce(p_tra_loi, '')), '') is null then null else now() end,
    trang_thai = case when nullif(btrim(coalesce(p_tra_loi, '')), '') is null then 'moi' else 'da_tra_loi' end
  where id = p_id;
end $$;

create function public.an_cau_hoi_buoi(p_id uuid, p_an boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare v_buoi uuid; v_dot uuid; v_nguoi uuid;
begin
  select q.buoi_id, b.dot_id, q.nguoi into v_buoi, v_dot, v_nguoi
  from public.cau_hoi_buoi q join public.buoi b on b.id = q.buoi_id where q.id = p_id;
  if v_buoi is null then raise exception 'Không tìm thấy câu hỏi'; end if;
  if v_nguoi is distinct from noi_bo.toi()
     and not (case when v_dot is null then noi_bo.xem_duoc_ten()
                   else noi_bo.co_vai_dot(v_dot, array['truong_ban', 'thu_ky', 'giang_vien']) end)
  then raise exception 'Chỉ người gửi, Ban tổ chức và giảng viên được ẩn câu hỏi'; end if;
  update public.cau_hoi_buoi set trang_thai = case when coalesce(p_an, true) then 'an'
    when tra_loi is not null then 'da_tra_loi' else 'moi' end where id = p_id;
end $$;

/* ============================================================ 12. Thông báo theo đợt */

create function public.luu_thong_bao_dot(p_id uuid, p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := p_id; v_dot uuid; v_td text := btrim(coalesce(p ->> 'tieu_de', ''));
begin
  if v_td = '' then raise exception 'Thông báo phải có tiêu đề'; end if;
  if v_id is null then v_dot := nullif(btrim(coalesce(p ->> 'dot_id', '')), '')::uuid;
  else select dot_id into v_dot from public.thong_bao where id = v_id; end if;
  if v_dot is null then raise exception 'Thông báo này không thuộc đợt tập huấn nào'; end if;
  if not noi_bo.la_btc_dot(v_dot) then raise exception 'Chỉ trưởng ban, thư ký của đợt và quản trị được đăng thông báo'; end if;
  if v_id is null then
    insert into public.thong_bao (dot_id, tieu_de, noi_dung, ghim, tac_gia)
    values (v_dot, v_td, nullif(btrim(coalesce(p ->> 'noi_dung', '')), ''),
      coalesce((p ->> 'ghim')::boolean, false), noi_bo.toi())
    returning id into v_id;
  else
    update public.thong_bao set tieu_de = v_td, noi_dung = nullif(btrim(coalesce(p ->> 'noi_dung', '')), ''),
      ghim = coalesce((p ->> 'ghim')::boolean, false) where id = v_id;
  end if;
  perform noi_bo.ghi_nhat_ky_dot(v_dot, case when p_id is null then 'Đăng thông báo' else 'Sửa thông báo' end, v_td);
  return v_id;
end $$;

create function public.xoa_thong_bao_dot(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_dot uuid; v_td text;
begin
  select dot_id, tieu_de into v_dot, v_td from public.thong_bao where id = p_id;
  if v_dot is null then raise exception 'Thông báo này không thuộc đợt tập huấn nào'; end if;
  if not noi_bo.la_btc_dot(v_dot) then raise exception 'Chỉ trưởng ban, thư ký của đợt và quản trị được xóa thông báo'; end if;
  delete from public.thong_bao where id = p_id;
  perform noi_bo.ghi_nhat_ky_dot(v_dot, 'Xóa thông báo', v_td);
end $$;

/* ============================================================ 13. Trang chủ học viên

   Khối "Việc cần làm bây giờ": chỉ những việc đúng giờ thật, không hiện trước.
   buoi_gan  - buổi của đợt đang mở, từ 6 giờ trước tới 30 giờ sau
   can_chon  - ca đang mở đăng ký mà chưa chọn
   Giao diện tự viết câu theo các mốc giờ này, máy chủ không soạn câu. */

create function public.hv_trang_chu() returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'bay_gio', now(),
    'buoi_gan', coalesce((
      select json_agg(json_build_object(
        'id', b.id, 'dot_id', b.dot_id, 'dot_ma', d.ma, 'ten', b.ten,
        'bat_dau', b.bat_dau, 'ket_thuc', b.ket_thuc, 'dia_diem', b.dia_diem,
        'phan', b.phan, 'ra_sau_phut', b.ra_sau_phut, 'dong', b.dong,
        'can_dang_ky', b.can_dang_ky,
        'toi_dang_ky', exists (select 1 from public.dang_ky_buoi k where k.buoi_id = b.id and k.thanh_vien_id = noi_bo.toi()),
        'toi_vao', (select x.luc from public.diem_danh x where x.buoi_id = b.id and x.thanh_vien_id = noi_bo.toi()),
        'toi_ra', (select x.ra_luc from public.diem_danh x where x.buoi_id = b.id and x.thanh_vien_id = noi_bo.toi())
        ) order by b.bat_dau)
      from public.buoi b join public.dot d on d.id = b.dot_id
      where b.dot_id in (select noi_bo.dot_mo_cua_toi())
        and b.bat_dau between now() - interval '6 hours' and now() + interval '30 hours'), '[]'),
    'can_chon', coalesce((
      select json_agg(json_build_object(
        'id', b.id, 'dot_id', b.dot_id, 'dot_ma', d.ma, 'ten', b.ten, 'bat_dau', b.bat_dau,
        'phan', b.phan, 'nhom_chon', b.nhom_chon, 'han_dang_ky', b.han_dang_ky,
        'suc_chua', b.suc_chua,
        'con_lai', case when b.suc_chua is not null then
          b.suc_chua - (select count(*) from public.dang_ky_buoi k where k.buoi_id = b.id) end
        ) order by b.han_dang_ky nulls last, b.bat_dau)
      from public.buoi b join public.dot d on d.id = b.dot_id
      where b.dot_id in (select noi_bo.dot_mo_cua_toi())
        and b.can_dang_ky and not b.dong
        and (b.mo_dang_ky_tu is null or now() >= b.mo_dang_ky_tu)
        and (b.han_dang_ky is null or now() <= b.han_dang_ky)
        and not exists (select 1 from public.dang_ky_buoi k where k.buoi_id = b.id and k.thanh_vien_id = noi_bo.toi())
        and not exists (select 1 from public.dang_ky_buoi k join public.buoi x on x.id = k.buoi_id
          where k.thanh_vien_id = noi_bo.toi() and b.nhom_chon is not null
            and x.dot_id = b.dot_id and x.nhom_chon = b.nhom_chon)), '[]'),
    'thong_bao_moi', (
      select count(*) from public.thong_bao n
      where n.dot_id in (select g.dot_id from public.dot_hoc_vien g where g.thanh_vien_id = noi_bo.toi() and g.trang_thai = 'ghi_danh')
        and not exists (select 1 from public.thong_bao_da_doc z where z.thong_bao_id = n.id and z.thanh_vien_id = noi_bo.toi()))
  )
  where noi_bo.toi() is not null
$$;

/* ============================================================ 14. Quyền gọi hàm */

revoke all on function public.luu_buoi_dot(uuid, jsonb) from public, anon;
revoke all on function public.xoa_buoi_dot(uuid) from public, anon;
revoke all on function public.ds_buoi_dot(uuid) from public, anon;
revoke all on function public.chon_buoi(uuid) from public, anon;
revoke all on function public.bo_chon_buoi(uuid) from public, anon;
revoke all on function public.ds_dang_ky_buoi(uuid) from public, anon;
revoke all on function public.dat_dang_ky_buoi(uuid, uuid[]) from public, anon;
revoke all on function public.dat_gio_ra(uuid, uuid, timestamptz) from public, anon;
revoke all on function public.luu_tai_lieu_dot(uuid, jsonb) from public, anon;
revoke all on function public.xoa_tai_lieu_dot(uuid) from public, anon;
revoke all on function public.ds_tai_lieu_dot(uuid) from public, anon;
revoke all on function public.luu_checklist_dot(uuid, jsonb) from public, anon;
revoke all on function public.xoa_checklist_dot(uuid) from public, anon;
revoke all on function public.ds_checklist_dot(uuid) from public, anon;
revoke all on function public.gui_cau_hoi_buoi(uuid, text, boolean) from public, anon;
revoke all on function public.ds_cau_hoi_buoi(uuid) from public, anon;
revoke all on function public.quan_tam_cau_hoi(uuid, boolean) from public, anon;
revoke all on function public.tra_loi_cau_hoi_buoi(uuid, text) from public, anon;
revoke all on function public.an_cau_hoi_buoi(uuid, boolean) from public, anon;
revoke all on function public.luu_thong_bao_dot(uuid, jsonb) from public, anon;
revoke all on function public.xoa_thong_bao_dot(uuid) from public, anon;
revoke all on function public.hv_trang_chu() from public, anon;

grant execute on function public.luu_buoi_dot(uuid, jsonb) to authenticated;
grant execute on function public.xoa_buoi_dot(uuid) to authenticated;
grant execute on function public.ds_buoi_dot(uuid) to authenticated;
grant execute on function public.chon_buoi(uuid) to authenticated;
grant execute on function public.bo_chon_buoi(uuid) to authenticated;
grant execute on function public.ds_dang_ky_buoi(uuid) to authenticated;
grant execute on function public.dat_dang_ky_buoi(uuid, uuid[]) to authenticated;
grant execute on function public.dat_gio_ra(uuid, uuid, timestamptz) to authenticated;
grant execute on function public.luu_tai_lieu_dot(uuid, jsonb) to authenticated;
grant execute on function public.xoa_tai_lieu_dot(uuid) to authenticated;
grant execute on function public.ds_tai_lieu_dot(uuid) to authenticated;
grant execute on function public.luu_checklist_dot(uuid, jsonb) to authenticated;
grant execute on function public.xoa_checklist_dot(uuid) to authenticated;
grant execute on function public.ds_checklist_dot(uuid) to authenticated;
grant execute on function public.gui_cau_hoi_buoi(uuid, text, boolean) to authenticated;
grant execute on function public.ds_cau_hoi_buoi(uuid) to authenticated;
grant execute on function public.quan_tam_cau_hoi(uuid, boolean) to authenticated;
grant execute on function public.tra_loi_cau_hoi_buoi(uuid, text) to authenticated;
grant execute on function public.an_cau_hoi_buoi(uuid, boolean) to authenticated;
grant execute on function public.luu_thong_bao_dot(uuid, jsonb) to authenticated;
grant execute on function public.xoa_thong_bao_dot(uuid) to authenticated;
grant execute on function public.hv_trang_chu() to authenticated;

-- bang_diem_danh và dong_diem_danh bị drop rồi create lại nên phải cấp quyền lại.
revoke all on function public.bang_diem_danh(uuid) from public, anon;
grant execute on function public.bang_diem_danh(uuid) to authenticated;
revoke all on all functions in schema noi_bo from public, anon;
grant execute on all functions in schema noi_bo to authenticated, service_role;

notify pgrst, 'reload schema';
