-- Junior chưa xếp nhà (anh Long nêu 20/11/2026): 26 bạn Junior Gen12 (NKTV-233..258) vào CLB từ buổi 22/11/2026,
-- chỉ chọn về sáu nhà sau Tết Nguyên đán; trong lúc chờ vẫn tính điểm danh cá nhân và làm bài test cá nhân.
-- Rà soát 20/11/2026 cho thấy phần chạy hằng tuần đã đúng (người chưa có nhà được điểm danh, được làm test đầu giờ,
-- không lọt vào điểm nhóm); migration này sửa ba chỗ còn lại (agent đề xuất, anh Long duyệt và cho áp dụng 23/11/2026):
--   1. Điểm nhóm lấy nhà HIỆN TẠI của thành viên, nên ngày xếp Junior về nhà sau Tết, mọi buổi đã đóng từ 22/11
--      sẽ tính lại cho nhà mới. Thêm cột vao_nha_tu (tự ghi hôm nay khi một người chưa từng có nhà được xếp nhà;
--      quản trị sửa được ở form Thành viên) và diem_nhom chỉ tính một người cho nhà ở các buổi từ ngày đó.
--      Giao diện đọc cột này (api.js dsThanhVien), nên phải áp migration TRƯỚC khi đưa giao diện lên.
--   2. Màn Post-test của người mới hiện cả bài của các buổi trước ngày vào CLB, gắn nhãn "Đã đóng".
--   3. Thêm thành viên mà để trống ngày tính chuyên cần thì bị ghi vắng mọi buổi đã đóng từ đầu năm học.
-- Chưa xử lý (để việc sau): đổi nhà từ nhà này sang nhà khác, lên Ban cố vấn, hay tắt "Còn hoạt động" giữa năm
-- vẫn làm điểm nhóm và chuyên cần các buổi cũ tính lại, vì chưa có lịch sử nhà theo ngày.

/* ---------- 1. Ngày vào nhà ---------- */
alter table public.thanh_vien add column vao_nha_tu date;
comment on column public.thanh_vien.vao_nha_tu is
  'Ngày bắt đầu tính cho nhà trong điểm nhóm. NULL hoặc -infinity: tính cho nhà mọi buổi. Tự ghi hôm nay khi một người chưa từng có nhà được xếp nhà lần đầu; quản trị sửa được ở form Thành viên.';

-- Ghi ngày vào nhà khi xếp nhà LẦN ĐẦU (nha từ NULL sang có giá trị và vao_nha_tu đang NULL), trừ khi chính lệnh sửa
-- đã ghi ngày khác. Người đã có nhà từ trước mà bị bỏ nhà (lỡ tay chọn "Chưa có") thì đánh dấu -infinity, để lần chọn
-- lại không bị đóng dấu hôm nay và điểm nhóm các buổi cũ của nhà không đổi.
create function noi_bo.ghi_ngay_vao_nha() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.vao_nha_tu is distinct from old.vao_nha_tu then
    return new;
  end if;
  if old.nha is not null and new.nha is null and old.vao_nha_tu is null then
    new.vao_nha_tu := '-infinity';
  elsif old.nha is null and new.nha is not null and old.vao_nha_tu is null then
    new.vao_nha_tu := noi_bo.hom_nay();
  end if;
  return new;
end $$;
create trigger ghi_ngay_vao_nha before update of nha on public.thanh_vien
  for each row execute function noi_bo.ghi_ngay_vao_nha();

-- Theo quy ước của 0013: thêm cột vào thanh_vien thì dựng lại khung nhìn (cột mới nằm cuối).
create or replace view noi_bo.thanh_vien_clb as select * from public.thanh_vien where loai = 'thanh_vien';

-- Sửa lỗi có từ 0013 (lộ ra khi chạy thử 0018 ngày 20/11/2026): trigger giu_quan_tri chạy theo quyền người sửa
-- (vai authenticated) mà đọc khung nhìn noi_bo.thanh_vien_clb, vốn cố ý không cấp cho authenticated. Mấy lần sửa
-- đầu trong một kết nối không sao (Postgres lập kế hoạch riêng, bỏ qua câu con), nhưng từ lần thứ sáu nó dùng kế
-- hoạch chung, đụng khung nhìn và báo "permission denied for view thanh_vien_clb": quản trị không lưu được thành
-- viên, ví dụ lúc xếp nhà cho 26 Junior sau Tết. Cho hàm chạy theo quyền chủ sở hữu; hàm chỉ kiểm rồi báo lỗi, không ghi gì.
alter function noi_bo.giu_quan_tri() security definer;

-- Giữ nguyên diem_nhom của 0014, chỉ thêm điều kiện ngày vào nhà trong dd.
create or replace function public.diem_nhom(p_tu timestamptz, p_den timestamptz)
returns table (buoi_id uuid, bat_dau timestamptz, nha text, so_nguoi int, dung int, tre int, phep int, vang int,
  co_test boolean, so_lam int, tb_test numeric, diem_cc numeric, diem_test numeric, tong numeric)
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
      and (t.vao_nha_tu is null or t.vao_nha_tu <= (b.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date)
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

/* ---------- 2. Bài của tôi: bỏ bài thuộc buổi trước ngày vào CLB ---------- */
-- Giữ nguyên bai_cua_toi đang chạy, chỉ thêm điều kiện cuối. Bài người đó đã làm thì luôn giữ.
create or replace function public.bai_cua_toi() returns json
language plpgsql security definer set search_path = '' as $$
declare t uuid := noi_bo.toi(); kq json; v_tg date;
begin
  if t is null then raise exception 'Chưa đăng nhập'; end if;
  perform noi_bo.cham_qua_han(null);
  select x.tham_gia_tu into v_tg from public.thanh_vien x where x.id = t;
  select coalesce(json_agg(x order by x.sap_xep desc), '[]') into kq from (
    select b.id, b.tieu_de, b.mo_ta, b.thoi_gian_phut, b.mo_luc, b.dong_luc, b.so_lan, b.hien_dap_an, coalesce(b.mo_luc, u.bat_dau, b.tao_luc) sap_xep,
      b.buoi_id, u.ten buoi_ten, u.bat_dau buoi_bat_dau,
      b.buoi_id is null or exists (select 1 from public.diem_danh d where d.buoi_id = b.buoi_id and d.thanh_vien_id = t) da_diem_danh,
      (select count(*) from public.cau_hoi c where c.bai_id = b.id) so_cau,
      (select count(*) from public.lam_bai l where l.bai_id = b.id and l.thanh_vien_id = t and l.nop_luc is not null) da_gui,
      (select max(l.diem) from public.lam_bai l where l.bai_id = b.id and l.thanh_vien_id = t) diem,
      (select l.han_luc from public.lam_bai l where l.bai_id = b.id and l.thanh_vien_id = t and l.nop_luc is null order by l.lan desc limit 1) dang_lam_den
    from public.bai_test b left join public.buoi u on u.id = b.buoi_id
    where b.trang_thai = 'mo'
      and (v_tg is null
        or exists (select 1 from public.lam_bai l where l.bai_id = b.id and l.thanh_vien_id = t)
        or case when u.id is not null then (u.bat_dau at time zone 'Asia/Ho_Chi_Minh')::date >= v_tg
                else b.dong_luc is null or (b.dong_luc at time zone 'Asia/Ho_Chi_Minh')::date >= v_tg end)) x;
  return kq;
end $$;

/* ---------- 3. Người mới mặc định tính chuyên cần từ hôm nay ---------- */
create function noi_bo.mac_dinh_tham_gia() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.loai = 'thanh_vien' and new.tham_gia_tu is null then
    new.tham_gia_tu := noi_bo.hom_nay();
  end if;
  return new;
end $$;
create trigger mac_dinh_tham_gia before insert on public.thanh_vien
  for each row execute function noi_bo.mac_dinh_tham_gia();

revoke all on function noi_bo.ghi_ngay_vao_nha(), noi_bo.mac_dinh_tham_gia() from public, anon, authenticated;
