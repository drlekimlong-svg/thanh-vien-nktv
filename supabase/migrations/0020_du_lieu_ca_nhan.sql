-- Dữ liệu cá nhân: lưu lời đồng ý theo phiên bản thông báo, và yêu cầu của người dùng về dữ liệu của mình
-- (anh Long yêu cầu 21/11/2026, cùng đợt đổi giao diện theo bộ nhận diện).
--
-- Căn cứ (rà soát của agent, cần người làm pháp chế xác nhận):
--   * Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15, Điều 9: đồng ý phải rõ cho từng mục đích; im lặng hay không phản hồi
--     không phải là đồng ý. Điều 4: quyền được biết, rút đồng ý, xem, sửa, xin xóa, hạn chế xử lý.
--   * Nghị định 356/2025/NĐ-CP, Điều 6: lời đồng ý phải kiểm chứng được và được lưu; Điều 5: thời hạn đáp ứng yêu cầu.
--
-- Anh Long chốt 21/11/2026: bên kiểm soát dữ liệu và đầu mối liên hệ là Ban chủ nhiệm CLB; giữ dữ liệu 6 tháng
-- (sau khi rời CLB, với học viên là sau khi đợt kết thúc). Hồ sơ chuyển dữ liệu ra nước ngoài (máy chủ Singapore)
-- CLB xử lý sau, ngoài app.
--
-- Thiết kế (agent đề xuất):
--   * dong_y_du_lieu là sổ ghi nối tiếp: mỗi lần đồng ý, từ chối, đổi ý về ảnh là một dòng mới, không sửa dòng cũ.
--     Dòng mới nhất của một người là trạng thái hiện tại. Nhờ vậy CLB chứng minh được ai đồng ý phiên bản nào, lúc nào.
--   * Hai mục đích tách riêng: dong_y (mục đích chính, bắt buộc để dùng app) và dang_anh (đăng ảnh, video sinh hoạt
--     lên fanpage CLB, không bắt buộc).
--   * Người từ chối vẫn được ghi một dòng dong_y = false: đó là cách Ban chủ nhiệm biết để liên hệ trong 2 ngày làm việc.
--   * Phiên bản thông báo là hằng số trong giao diện (js/v-dulieu.js). Đổi nội dung thì tăng phiên bản; app hỏi lại
--     mọi người ở lần mở sau vì dòng mới nhất của họ mang phiên bản cũ.
--   * yeu_cau_du_lieu: người dùng gửi yêu cầu xem, sửa, xóa, hạn chế xử lý; quản trị (vai_tro quan_tri) đánh dấu đã xử lý.
--     Người gửi bị xóa thì yêu cầu vẫn còn (thanh_vien_id thành null) để giữ dấu vết đã đáp ứng.
--   * Hai bảng bật RLS mà không có policy: trình duyệt chỉ đi qua các hàm bên dưới. Không sửa hàm nào đang chạy.

/* ---------- Bảng ---------- */
create table public.dong_y_du_lieu (
  id bigint generated always as identity primary key,
  thanh_vien_id uuid not null references public.thanh_vien(id) on delete cascade,
  phien_ban text not null check (char_length(phien_ban) between 1 and 20),
  dong_y boolean not null,
  dang_anh boolean not null default false,
  nguon text not null check (nguon in ('kich_hoat', 'hoi_lai', 'du_lieu_cua_toi')),
  luc timestamptz not null default now()
);
create index on public.dong_y_du_lieu (thanh_vien_id, luc desc, id desc);

create table public.yeu_cau_du_lieu (
  id bigint generated always as identity primary key,
  thanh_vien_id uuid references public.thanh_vien(id) on delete set null,
  loai text not null check (loai in ('xem', 'sua', 'xoa', 'han_che', 'khac')),
  noi_dung text check (char_length(noi_dung) <= 2000),
  gui_luc timestamptz not null default now(),
  trang_thai text not null default 'moi' check (trang_thai in ('moi', 'dang_xu_ly', 'xong', 'tu_choi')),
  phan_hoi text check (char_length(phan_hoi) <= 2000),
  xu_ly_luc timestamptz,
  nguoi_xu_ly uuid references public.thanh_vien(id) on delete set null
);
create index on public.yeu_cau_du_lieu (thanh_vien_id);

alter table public.dong_y_du_lieu enable row level security;
alter table public.yeu_cau_du_lieu enable row level security;
revoke all on public.dong_y_du_lieu, public.yeu_cau_du_lieu from anon, authenticated;

/* ---------- Người dùng ---------- */
-- Trạng thái hiện tại của chính mình: dòng mới nhất, hoặc null nếu chưa từng trả lời.
create function public.dong_y_cua_toi() returns json
language sql stable security definer set search_path = '' as $$
  select row_to_json(x) from (
    select d.phien_ban, d.dong_y, d.dang_anh, d.nguon, d.luc
    from public.dong_y_du_lieu d
    where d.thanh_vien_id = noi_bo.toi()
    order by d.luc desc, d.id desc limit 1
  ) x $$;

create function public.ghi_dong_y(p_phien_ban text, p_dong_y boolean, p_dang_anh boolean, p_nguon text) returns json
language plpgsql security definer set search_path = '' as $$
declare t uuid := noi_bo.toi();
begin
  if t is null then raise exception 'Chưa đăng nhập'; end if;
  if p_dong_y is null then raise exception 'Cần chọn đồng ý hoặc không.'; end if;
  if coalesce(p_nguon, '') not in ('kich_hoat', 'hoi_lai', 'du_lieu_cua_toi') then raise exception 'Nguồn không hợp lệ.'; end if;
  if coalesce(trim(p_phien_ban), '') = '' or char_length(p_phien_ban) > 20 then raise exception 'Thiếu phiên bản thông báo.'; end if;
  insert into public.dong_y_du_lieu (thanh_vien_id, phien_ban, dong_y, dang_anh, nguon)
  values (t, trim(p_phien_ban), p_dong_y, coalesce(p_dang_anh, false), p_nguon);
  return public.dong_y_cua_toi();
end $$;

create function public.gui_yeu_cau_du_lieu(p_loai text, p_noi_dung text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare t uuid := noi_bo.toi(); kq bigint;
begin
  if t is null then raise exception 'Chưa đăng nhập'; end if;
  if coalesce(p_loai, '') not in ('xem', 'sua', 'xoa', 'han_che', 'khac') then raise exception 'Loại yêu cầu không hợp lệ.'; end if;
  if char_length(coalesce(p_noi_dung, '')) > 2000 then raise exception 'Nội dung dài quá 2000 ký tự.'; end if;
  if (select count(*) from public.yeu_cau_du_lieu where thanh_vien_id = t and trang_thai in ('moi', 'dang_xu_ly')) >= 5 then
    raise exception 'Bạn đang có 5 yêu cầu chưa xử lý xong. Chờ Ban chủ nhiệm trả lời rồi gửi tiếp.';
  end if;
  insert into public.yeu_cau_du_lieu (thanh_vien_id, loai, noi_dung) values (t, p_loai, nullif(trim(p_noi_dung), ''))
  returning id into kq;
  return kq;
end $$;

create function public.yeu_cau_cua_toi() returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(x order by x.gui_luc desc), '[]'::json) from (
    select y.id, y.loai, y.noi_dung, y.gui_luc, y.trang_thai, y.phan_hoi, y.xu_ly_luc
    from public.yeu_cau_du_lieu y
    where y.thanh_vien_id = noi_bo.toi()
  ) x $$;

/* ---------- Quản trị ---------- */
-- Trạng thái của mọi tài khoản (thành viên CLB và học viên): đồng ý, từ chối, hay chưa trả lời.
create function public.ds_dong_y_du_lieu() returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  if not noi_bo.la_admin() then raise exception 'Chỉ quản trị xem được.'; end if;
  return (select coalesce(json_agg(x order by x.loai, x.ma), '[]'::json) from (
    select t.id, t.ma, t.ho_ten, t.loai, t.hoat_dong, t.user_id is not null as da_kich_hoat,
      d.phien_ban, d.dong_y, d.dang_anh, d.luc
    from public.thanh_vien t
    left join lateral (
      select dd.phien_ban, dd.dong_y, dd.dang_anh, dd.luc from public.dong_y_du_lieu dd
      where dd.thanh_vien_id = t.id order by dd.luc desc, dd.id desc limit 1
    ) d on true
  ) x);
end $$;

create function public.ds_yeu_cau_du_lieu() returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  if not noi_bo.la_admin() then raise exception 'Chỉ quản trị xem được.'; end if;
  return (select coalesce(json_agg(x order by (x.trang_thai in ('moi', 'dang_xu_ly')) desc, x.gui_luc desc), '[]'::json) from (
    select y.id, y.loai, y.noi_dung, y.gui_luc, y.trang_thai, y.phan_hoi, y.xu_ly_luc,
      t.ma, t.ho_ten, t.loai as loai_tk
    from public.yeu_cau_du_lieu y
    left join public.thanh_vien t on t.id = y.thanh_vien_id
  ) x);
end $$;

create function public.xu_ly_yeu_cau_du_lieu(p_id bigint, p_trang_thai text, p_phan_hoi text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not noi_bo.la_admin() then raise exception 'Chỉ quản trị xử lý được.'; end if;
  if coalesce(p_trang_thai, '') not in ('moi', 'dang_xu_ly', 'xong', 'tu_choi') then raise exception 'Trạng thái không hợp lệ.'; end if;
  if char_length(coalesce(p_phan_hoi, '')) > 2000 then raise exception 'Phản hồi dài quá 2000 ký tự.'; end if;
  update public.yeu_cau_du_lieu
     set trang_thai = p_trang_thai, phan_hoi = nullif(trim(p_phan_hoi), ''),
         xu_ly_luc = case when p_trang_thai in ('xong', 'tu_choi') then now() else null end,
         nguoi_xu_ly = noi_bo.toi()
   where id = p_id;
  if not found then raise exception 'Không có yêu cầu này.'; end if;
end $$;

/* ---------- Quyền gọi hàm ---------- */
revoke all on function public.dong_y_cua_toi(), public.ghi_dong_y(text, boolean, boolean, text),
  public.gui_yeu_cau_du_lieu(text, text), public.yeu_cau_cua_toi(),
  public.ds_dong_y_du_lieu(), public.ds_yeu_cau_du_lieu(), public.xu_ly_yeu_cau_du_lieu(bigint, text, text)
  from public, anon;
grant execute on function public.dong_y_cua_toi(), public.ghi_dong_y(text, boolean, boolean, text),
  public.gui_yeu_cau_du_lieu(text, text), public.yeu_cau_cua_toi(),
  public.ds_dong_y_du_lieu(), public.ds_yeu_cau_du_lieu(), public.xu_ly_yeu_cau_du_lieu(bigint, text, text)
  to authenticated;
