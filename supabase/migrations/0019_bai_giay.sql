-- Phiếu trả lời cho bài làm trên giấy (anh Long yêu cầu 21/11/2026; dùng lần đầu cho pretest thống kê y sinh 22/11/2026).
-- Thành viên làm bài trên giấy. Hết giờ, quản trị đọc mật khẩu; người đã điểm danh buổi gắn với phiếu nhập mật khẩu
-- để mở phiếu trên app rồi chọn lại đáp án đã ghi trên giấy. App chỉ hiện "Câu n: A B C D E", không hiện nội dung câu.
-- Mục đích: quản trị khỏi chấm tay. Không tính điểm.
--
-- Thiết kế (agent đề xuất):
--   * Tách hẳn khỏi bai_test/lam_bai: không vào điểm nhóm, post-test hay hồ sơ năng lực; không sửa hàm nào đang chạy
--     hằng tuần. Không phụ thuộc 0018 (đang chờ duyệt): áp trước hay sau đều được.
--   * Ba bảng bật RLS mà không có policy: trình duyệt chỉ đi qua các hàm bên dưới.
--   * Đáp án và mật khẩu (băm bcrypt) nằm ở bai_giay_khoa; không hàm nào trả hai thứ này cho người làm bài.
--     Kho mã công khai không chứa đáp án: đáp án nhập trên app hoặc bằng SQL, không ghi vào tệp nào trong kho.
--   * Phương án "chưa hiểu" (cột chua_hieu, ví dụ E = 4) chấm là sai nhưng được đếm riêng từng câu.
--   * Quyền: người làm bài là thành viên CLB đã điểm danh buổi của phiếu; ai chưa kích hoạt tài khoản thì coi như vắng,
--     không có đường nhập hộ (anh Long chốt 21/11/2026). Người làm xem được số câu đúng của mình sau khi gửi (cột
--     hien_diem, mặc định bật theo ý anh). Ban cố vấn chỉ xem tiến độ (ai đã gửi). Sửa phiếu chép nhầm, xóa phiếu để gửi
--     lại, đáp án, mật khẩu, mở đóng và kết quả chỉ quản trị (vai_tro quan_tri), vì Ban cố vấn cũng làm bài.

/* ---------- Bảng ---------- */
create table public.bai_giay (
  id uuid primary key default gen_random_uuid(),
  ten text not null check (length(trim(ten)) between 1 and 120),
  buoi_id uuid not null references public.buoi(id) on delete cascade,
  so_cau int not null check (so_cau between 1 and 100),
  so_lua_chon int not null default 5 check (so_lua_chon between 2 and 8),
  chua_hieu int,
  chu_thich text check (length(chu_thich) <= 300),
  phan jsonb not null default '[]' check (jsonb_typeof(phan) = 'array'),
  mo boolean not null default false,
  hien_diem boolean not null default true,
  tao_boi uuid references public.thanh_vien(id) on delete set null,
  tao_luc timestamptz not null default now(),
  check (chua_hieu is null or (chua_hieu >= 0 and chua_hieu < so_lua_chon))
);
create index on public.bai_giay (buoi_id);
comment on table public.bai_giay is 'Phiếu trả lời cho bài làm trên giấy: thành viên chọn lại đáp án trên app để quản trị khỏi chấm tay. Không tính điểm.';
comment on column public.bai_giay.chua_hieu is 'Chỉ số phương án "chưa hiểu" (0 = A). Chấm là sai, đếm riêng từng câu.';
comment on column public.bai_giay.phan is 'Các phần của bài để tính điểm phần: [{"ten": "Nền", "tu": 1, "den": 7}, ...]';

-- Không có quyền đọc ghi từ trình duyệt.
create table public.bai_giay_khoa (
  bai_id uuid primary key references public.bai_giay(id) on delete cascade,
  dap_an int[],
  mat_khau_bam text
);

create table public.bai_giay_lam (
  bai_id uuid not null references public.bai_giay(id) on delete cascade,
  thanh_vien_id uuid not null references public.thanh_vien(id) on delete cascade,
  mo_luc timestamptz,
  lan_sai int not null default 0,
  sai_luc timestamptz,
  tra_loi int[],
  gui_luc timestamptz,
  nhap_ho_boi uuid references public.thanh_vien(id) on delete set null,
  primary key (bai_id, thanh_vien_id)
);
create index on public.bai_giay_lam (thanh_vien_id);

alter table public.bai_giay enable row level security;
alter table public.bai_giay_khoa enable row level security;
alter table public.bai_giay_lam enable row level security;
revoke all on public.bai_giay, public.bai_giay_khoa, public.bai_giay_lam from anon, authenticated;

/* ---------- Hàm phụ ---------- */
-- Mật khẩu được đọc to rồi gõ trên điện thoại: bỏ mọi khoảng trắng, không phân biệt hoa thường.
create function noi_bo.chuan_mat_khau(p text) returns text language sql immutable set search_path = '' as
$$ select lower(regexp_replace(coalesce(p, ''), '\s+', '', 'g')) $$;

-- Đọc mảng câu trả lời từ trình duyệt: đúng p_so_cau phần tử, mỗi phần tử là null (bỏ trống) hoặc số nguyên 0..p_so_lc-1.
create function noi_bo.doc_tra_loi(p jsonb, p_so_cau int, p_so_lc int) returns int[]
language plpgsql immutable set search_path = '' as $$
declare kq int[] := '{}'; e jsonb; so numeric;
begin
  if p is null or jsonb_typeof(p) <> 'array' or jsonb_array_length(p) <> p_so_cau then
    raise exception 'Phiếu cần đủ % câu.', p_so_cau;
  end if;
  for e in select x from jsonb_array_elements(p) with ordinality as t(x, i) order by i loop
    if jsonb_typeof(e) = 'null' then
      kq := array_append(kq, null::int);
    elsif jsonb_typeof(e) = 'number' then
      so := (e #>> '{}')::numeric;
      if so <> floor(so) or so < 0 or so > p_so_lc - 1 then raise exception 'Câu trả lời không hợp lệ.'; end if;
      kq := array_append(kq, so::int);
    else
      raise exception 'Câu trả lời không hợp lệ.';
    end if;
  end loop;
  return kq;
end $$;

create function noi_bo.so_cau_dung(p_tra_loi int[], p_dap_an int[]) returns int language sql immutable set search_path = '' as
$$ select count(*)::int from generate_subscripts(p_dap_an, 1) as i where p_dap_an[i] is not null and p_tra_loi[i] = p_dap_an[i] $$;

/* ---------- Người làm bài ---------- */
-- Phiếu hiện ở tab Post-test khi đang mở, hoặc khi mình đã gửi.
create function public.bai_giay_cua_toi() returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(x order by x.buoi_bat_dau desc, x.ten), '[]'::json) from (
    select g.id, g.ten, g.so_cau, g.mo, b.bat_dau as buoi_bat_dau,
      exists (select 1 from public.diem_danh d where d.buoi_id = g.buoi_id and d.thanh_vien_id = noi_bo.toi()) as da_diem_danh,
      l.mo_luc is not null as da_mo, l.gui_luc
    from public.bai_giay g
    join public.buoi b on b.id = g.buoi_id
    left join public.bai_giay_lam l on l.bai_id = g.id and l.thanh_vien_id = noi_bo.toi()
    where noi_bo.toi() is not null and not noi_bo.la_hoc_vien() and (g.mo or l.gui_luc is not null)
  ) x $$;

create function public.xem_bai_giay(p_bai uuid) returns json
language plpgsql stable security definer set search_path = '' as $$
declare t uuid := noi_bo.toi(); g public.bai_giay; l public.bai_giay_lam; b public.buoi;
begin
  if t is null or noi_bo.la_hoc_vien() then raise exception 'Phiếu này dành cho thành viên CLB.'; end if;
  select * into g from public.bai_giay where id = p_bai;
  if not found then raise exception 'Không có phiếu này.'; end if;
  select * into l from public.bai_giay_lam where bai_id = p_bai and thanh_vien_id = t;
  if not g.mo and l.gui_luc is null then raise exception 'Phiếu này chưa mở hoặc đã đóng.'; end if;
  select * into b from public.buoi where id = g.buoi_id;
  return json_build_object(
    'id', g.id, 'ten', g.ten, 'so_cau', g.so_cau, 'so_lua_chon', g.so_lua_chon, 'chua_hieu', g.chua_hieu, 'chu_thich', g.chu_thich,
    'mo', g.mo, 'buoi_ten', b.ten, 'buoi_bat_dau', b.bat_dau,
    'da_diem_danh', exists (select 1 from public.diem_danh where buoi_id = g.buoi_id and thanh_vien_id = t),
    'da_mo', l.mo_luc is not null, 'gui_luc', l.gui_luc, 'nhap_ho', l.nhap_ho_boi is not null,
    'tra_loi', case when l.mo_luc is not null then l.tra_loi end,
    'so_dung', case when g.hien_diem and l.gui_luc is not null then
      (select noi_bo.so_cau_dung(l.tra_loi, k.dap_an) from public.bai_giay_khoa k where k.bai_id = g.id and k.dap_an is not null) end);
end $$;

-- Sai trả về {ok:false} thay vì báo lỗi, để lần sai được ghi lại (báo lỗi thì giao dịch hoàn tác cả lần đếm).
-- Sai 5 lần thì chờ 1 phút giữa các lần thử.
create function public.mo_bai_giay(p_bai uuid, p_mat_khau text) returns json
language plpgsql security definer set search_path = '' as $$
declare t uuid := noi_bo.toi(); g public.bai_giay; l public.bai_giay_lam; k public.bai_giay_khoa;
begin
  if t is null or noi_bo.la_hoc_vien() then raise exception 'Phiếu này dành cho thành viên CLB.'; end if;
  select * into g from public.bai_giay where id = p_bai;
  if not found or not g.mo then raise exception 'Phiếu này chưa mở hoặc đã đóng.'; end if;
  if not exists (select 1 from public.diem_danh where buoi_id = g.buoi_id and thanh_vien_id = t) then
    raise exception 'Phiếu chỉ mở cho người đã điểm danh buổi này. Nhờ người điểm danh quét mã của bạn rồi thử lại.';
  end if;
  insert into public.bai_giay_lam (bai_id, thanh_vien_id) values (p_bai, t) on conflict do nothing;
  select * into l from public.bai_giay_lam where bai_id = p_bai and thanh_vien_id = t for update;
  if l.mo_luc is not null then return json_build_object('ok', true); end if;
  if l.lan_sai >= 5 and l.sai_luc > now() - interval '1 minute' then
    return json_build_object('ok', false, 'loi', 'Sai mật khẩu nhiều lần. Chờ một phút rồi thử lại.');
  end if;
  select * into k from public.bai_giay_khoa where bai_id = p_bai;
  if k.mat_khau_bam is null then raise exception 'Phiếu chưa có mật khẩu. Báo lại cho Ban cố vấn.'; end if;
  if k.mat_khau_bam <> extensions.crypt(noi_bo.chuan_mat_khau(p_mat_khau), k.mat_khau_bam) then
    update public.bai_giay_lam set lan_sai = lan_sai + 1, sai_luc = now() where bai_id = p_bai and thanh_vien_id = t;
    return json_build_object('ok', false, 'loi', 'Mật khẩu chưa đúng.');
  end if;
  update public.bai_giay_lam set mo_luc = now(), lan_sai = 0, sai_luc = null where bai_id = p_bai and thanh_vien_id = t;
  return json_build_object('ok', true);
end $$;

-- Gửi một lần. Cần sửa thì quản trị sửa hộ hoặc xóa bài để người làm gửi lại.
create function public.gui_bai_giay(p_bai uuid, p_tra_loi jsonb) returns json
language plpgsql security definer set search_path = '' as $$
declare t uuid := noi_bo.toi(); g public.bai_giay; l public.bai_giay_lam; tl int[];
begin
  if t is null or noi_bo.la_hoc_vien() then raise exception 'Phiếu này dành cho thành viên CLB.'; end if;
  select * into g from public.bai_giay where id = p_bai;
  if not found or not g.mo then raise exception 'Phiếu đã đóng. Chưa kịp gửi thì báo Ban cố vấn.'; end if;
  select * into l from public.bai_giay_lam where bai_id = p_bai and thanh_vien_id = t for update;
  if not found or l.mo_luc is null then raise exception 'Cần nhập mật khẩu để mở phiếu trước.'; end if;
  if l.gui_luc is not null then raise exception 'Bạn đã gửi phiếu này rồi. Cần sửa thì báo Ban cố vấn.'; end if;
  tl := noi_bo.doc_tra_loi(p_tra_loi, g.so_cau, g.so_lua_chon);
  update public.bai_giay_lam set tra_loi = tl, gui_luc = now() where bai_id = p_bai and thanh_vien_id = t;
  return public.xem_bai_giay(p_bai);
end $$;

/* ---------- Quản trị và Ban cố vấn ---------- */
create function public.ds_bai_giay() returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  if not noi_bo.la_quan_tri() then raise exception 'Chỉ quản trị và Ban cố vấn.'; end if;
  return (select coalesce(json_agg(x order by x.buoi_bat_dau desc, x.ten), '[]'::json) from (
    select g.id, g.ten, g.so_cau, g.mo, b.bat_dau as buoi_bat_dau, b.ten as buoi_ten,
      (select count(*) from public.bai_giay_lam l where l.bai_id = g.id and l.gui_luc is not null) as da_gui,
      (select count(*) from public.diem_danh d where d.buoi_id = g.buoi_id) as da_diem_danh
    from public.bai_giay g join public.buoi b on b.id = g.buoi_id) x);
end $$;

-- Tiến độ: thành viên CLB còn hoạt động, ai đã điểm danh, ai đã gửi. Không có đáp án, không có điểm.
create function public.tien_do_bai_giay(p_bai uuid) returns json
language plpgsql stable security definer set search_path = '' as $$
declare g public.bai_giay; b public.buoi;
begin
  if not noi_bo.la_quan_tri() then raise exception 'Chỉ quản trị và Ban cố vấn.'; end if;
  select * into g from public.bai_giay where id = p_bai;
  if not found then raise exception 'Không có phiếu này.'; end if;
  select * into b from public.buoi where id = g.buoi_id;
  return json_build_object(
    'bai', to_jsonb(g) || jsonb_build_object('buoi_ten', b.ten, 'buoi_bat_dau', b.bat_dau,
      'co_mat_khau', exists (select 1 from public.bai_giay_khoa k where k.bai_id = g.id and k.mat_khau_bam is not null),
      'so_dap_an', (select count(x) from public.bai_giay_khoa k, unnest(k.dap_an) as x where k.bai_id = g.id)),
    'nguoi', (select coalesce(json_agg(x order by x.ma), '[]'::json) from (
      select v.id, v.ma, v.ho_ten, v.gen, v.nha, v.cap,
        exists (select 1 from public.diem_danh d where d.buoi_id = g.buoi_id and d.thanh_vien_id = v.id) as da_diem_danh,
        l.gui_luc, l.nhap_ho_boi is not null as nhap_ho
      from noi_bo.thanh_vien_clb v
      left join public.bai_giay_lam l on l.bai_id = g.id and l.thanh_vien_id = v.id
      where v.hoat_dong or l.gui_luc is not null) x));
end $$;

-- Quản trị sửa phiếu một người chép nhầm (hoặc ghi phiếu cho một người, nếu cần). Ghi lại ai đã sửa.
create function public.nhap_ho_bai_giay(p_bai uuid, p_tv uuid, p_tra_loi jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare g public.bai_giay; tl int[];
begin
  if not noi_bo.la_admin() then raise exception 'Chỉ quản trị được sửa phiếu của người khác.'; end if;
  select * into g from public.bai_giay where id = p_bai;
  if not found then raise exception 'Không có phiếu này.'; end if;
  if not exists (select 1 from public.thanh_vien where id = p_tv and loai = 'thanh_vien') then raise exception 'Không có thành viên này.'; end if;
  tl := noi_bo.doc_tra_loi(p_tra_loi, g.so_cau, g.so_lua_chon);
  insert into public.bai_giay_lam (bai_id, thanh_vien_id, mo_luc, tra_loi, gui_luc, nhap_ho_boi)
    values (p_bai, p_tv, now(), tl, now(), noi_bo.toi())
  on conflict (bai_id, thanh_vien_id) do update set tra_loi = excluded.tra_loi, gui_luc = excluded.gui_luc,
    mo_luc = coalesce(public.bai_giay_lam.mo_luc, excluded.mo_luc), nhap_ho_boi = excluded.nhap_ho_boi;
end $$;

-- Xóa phần đã gửi nhưng giữ trạng thái đã mở, để người làm chọn lại và gửi mà không cần mật khẩu lần nữa.
create function public.xoa_bai_giay_lam(p_bai uuid, p_tv uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not noi_bo.la_admin() then raise exception 'Chỉ quản trị được xóa bài đã gửi.'; end if;
  update public.bai_giay_lam set tra_loi = null, gui_luc = null, nhap_ho_boi = null where bai_id = p_bai and thanh_vien_id = p_tv;
end $$;

create function public.ket_qua_bai_giay(p_bai uuid) returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  if not noi_bo.la_admin() then raise exception 'Chỉ quản trị xem được kết quả và đáp án.'; end if;
  if not exists (select 1 from public.bai_giay where id = p_bai) then raise exception 'Không có phiếu này.'; end if;
  return json_build_object(
    'dap_an', (select k.dap_an from public.bai_giay_khoa k where k.bai_id = p_bai),
    'bai_lam', (select coalesce(json_agg(x order by x.ma), '[]'::json) from (
      select v.id, v.ma, v.ho_ten, v.gen, v.nha, v.cap, l.tra_loi, l.gui_luc, l.nhap_ho_boi is not null as nhap_ho
      from public.bai_giay_lam l join public.thanh_vien v on v.id = l.thanh_vien_id
      where l.bai_id = p_bai and l.gui_luc is not null) x));
end $$;

-- Tạo hoặc sửa phiếu. Khi sửa, chỉ đổi những khóa có trong p. Đáp án gửi kèm khóa dap_an (mảng chỉ số, 0 = A).
create function public.luu_bai_giay(p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := nullif(p->>'id', '')::uuid; g public.bai_giay; da_co_bai boolean;
begin
  if not noi_bo.la_admin() then raise exception 'Chỉ quản trị được tạo và sửa phiếu.'; end if;
  if v_id is null then
    insert into public.bai_giay (ten, buoi_id, so_cau, so_lua_chon, chua_hieu, chu_thich, phan, tao_boi)
    values (trim(p->>'ten'), (p->>'buoi_id')::uuid, coalesce((p->>'so_cau')::int, 20), coalesce((p->>'so_lua_chon')::int, 5),
      (p->>'chua_hieu')::int, nullif(trim(p->>'chu_thich'), ''), coalesce(nullif(p->'phan', 'null'::jsonb), '[]'::jsonb), noi_bo.toi())
    returning * into g;
    insert into public.bai_giay_khoa (bai_id) values (g.id);
  else
    select * into g from public.bai_giay where id = v_id for update;
    if not found then raise exception 'Không có phiếu này.'; end if;
    da_co_bai := exists (select 1 from public.bai_giay_lam where bai_id = v_id and tra_loi is not null);
    if da_co_bai and ((p ? 'so_cau' and (p->>'so_cau')::int <> g.so_cau) or (p ? 'so_lua_chon' and (p->>'so_lua_chon')::int <> g.so_lua_chon)) then
      raise exception 'Đã có người gửi phiếu nên không đổi được số câu hay số phương án.';
    end if;
    update public.bai_giay set
      ten = case when p ? 'ten' then trim(p->>'ten') else ten end,
      buoi_id = case when p ? 'buoi_id' then (p->>'buoi_id')::uuid else buoi_id end,
      so_cau = case when p ? 'so_cau' then (p->>'so_cau')::int else so_cau end,
      so_lua_chon = case when p ? 'so_lua_chon' then (p->>'so_lua_chon')::int else so_lua_chon end,
      chua_hieu = case when p ? 'chua_hieu' then (p->>'chua_hieu')::int else chua_hieu end,
      chu_thich = case when p ? 'chu_thich' then nullif(trim(p->>'chu_thich'), '') else chu_thich end,
      phan = case when p ? 'phan' then coalesce(nullif(p->'phan', 'null'::jsonb), '[]'::jsonb) else phan end,
      mo = case when p ? 'mo' then (p->>'mo')::boolean else mo end,
      hien_diem = case when p ? 'hien_diem' then (p->>'hien_diem')::boolean else hien_diem end
    where id = v_id returning * into g;
  end if;
  if p ? 'dap_an' then
    update public.bai_giay_khoa set dap_an = noi_bo.doc_tra_loi(p->'dap_an', g.so_cau, g.so_lua_chon) where bai_id = g.id;
  else
    -- Đổi số câu hay số phương án thì đáp án cũ không còn khớp: bỏ để nhập lại.
    update public.bai_giay_khoa set dap_an = null
    where bai_id = g.id and dap_an is not null
      and (cardinality(dap_an) <> g.so_cau or exists (select 1 from unnest(dap_an) as x where x >= g.so_lua_chon));
  end if;
  if g.mo and not exists (select 1 from public.bai_giay_khoa where bai_id = g.id and mat_khau_bam is not null) then
    raise exception 'Đặt mật khẩu trước khi mở phiếu.';
  end if;
  return g.id;
end $$;

create function public.dat_mat_khau_bai_giay(p_bai uuid, p_mat_khau text) returns void
language plpgsql security definer set search_path = '' as $$
declare m text := noi_bo.chuan_mat_khau(p_mat_khau);
begin
  if not noi_bo.la_admin() then raise exception 'Chỉ quản trị được đặt mật khẩu.'; end if;
  if length(m) < 4 then raise exception 'Mật khẩu cần ít nhất 4 ký tự, không tính khoảng trắng.'; end if;
  update public.bai_giay_khoa set mat_khau_bam = extensions.crypt(m, extensions.gen_salt('bf', 8)) where bai_id = p_bai;
  if not found then raise exception 'Không có phiếu này.'; end if;
end $$;

/* ---------- Quyền gọi hàm ---------- */
revoke all on function noi_bo.chuan_mat_khau(text), noi_bo.doc_tra_loi(jsonb, int, int), noi_bo.so_cau_dung(int[], int[])
  from public, anon, authenticated;
revoke all on function public.bai_giay_cua_toi(), public.xem_bai_giay(uuid), public.mo_bai_giay(uuid, text), public.gui_bai_giay(uuid, jsonb),
  public.ds_bai_giay(), public.tien_do_bai_giay(uuid), public.nhap_ho_bai_giay(uuid, uuid, jsonb), public.xoa_bai_giay_lam(uuid, uuid),
  public.ket_qua_bai_giay(uuid), public.luu_bai_giay(jsonb), public.dat_mat_khau_bai_giay(uuid, text)
  from public, anon;
grant execute on function public.bai_giay_cua_toi(), public.xem_bai_giay(uuid), public.mo_bai_giay(uuid, text), public.gui_bai_giay(uuid, jsonb),
  public.ds_bai_giay(), public.tien_do_bai_giay(uuid), public.nhap_ho_bai_giay(uuid, uuid, jsonb), public.xoa_bai_giay_lam(uuid, uuid),
  public.ket_qua_bai_giay(uuid), public.luu_bai_giay(jsonb), public.dat_mat_khau_bai_giay(uuid, text)
  to authenticated;
