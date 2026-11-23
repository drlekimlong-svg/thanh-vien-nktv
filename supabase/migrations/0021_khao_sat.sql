-- Khảo sát cho thành viên CLB (anh Long yêu cầu 23/11/2026: đưa BM01, phiếu khảo sát trước workshop Quản lý thời gian,
-- lên app thành viên và thêm câu "có tham gia buổi workshop thứ Tư không" để ước số tài liệu cần in).
-- Đã áp dụng ngày 23/11/2026 (tên trên Supabase: 0021_khao_sat), rồi nạp BM01 từ supabase/du_lieu/khao_sat_bm01_qltg.json.
-- Kiểm cùng ngày trong một giao dịch đã hoàn tác: chặn câu bắt buộc còn thiếu, ý không có trong danh sách, quá số ý tối đa,
-- ý trùng, mức ngoài 1–5, gửi lần hai; người chọn "Không tham gia" chỉ lưu câu 1; Junior không đọc được kết quả;
-- Ban cố vấn đọc được kết quả nhưng không gửi được. Không còn dòng thử nào trong cơ sở dữ liệu.
--
-- Thiết kế (agent đề xuất):
--   * Tách hẳn khỏi phiếu của đợt tập huấn (dot_phieu chỉ dành cho học viên trong đợt) và khỏi bài test: không sửa bảng
--     hay hàm nào đang chạy. Không phụ thuộc 0018 (đang chờ duyệt): áp trước hay sau đều được.
--   * Bốn bảng bật RLS mà không có policy: trình duyệt chỉ đi qua các hàm bên dưới.
--   * Đối tượng: thành viên CLB còn hoạt động, có cấp nằm trong khao_sat.doi_tuong. Quản trị và Ban cố vấn xem trước
--     phiếu, mở đóng, đặt hạn và xem kết quả; chỉ người thuộc đối tượng mới gửi được.
--   * Ẩn danh (mặc định): ai đã gửi ghi ở khao_sat_da_gui; câu trả lời ghi ở khao_sat_tra_loi với nguoi = null và giờ
--     làm tròn về đầu ngày. Kết quả trả dòng trả lời theo thứ tự id ngẫu nhiên và danh sách người đã gửi không kèm giờ,
--     để không ghép được người với dòng trả lời. Máy chủ biết bạn đã gửi, không biết bạn trả lời gì.
--   * Câu trả lời đánh khóa theo số thứ tự câu ("1", "2"…). Câu có dieu_kien chỉ hiện khi câu được tham chiếu đã trả lời
--     đúng điều kiện; máy chủ bỏ phần trả lời của câu không hiện và chỉ đòi các câu bắt buộc đang hiện.
--       {"cau": 1, "trong": ["Có", "Chưa chắc"]}  hiện khi câu 1 chọn một trong các ý này
--       {"cau": 24, "co": true}                   hiện khi câu 24 có trả lời
--   * Nội dung phiếu nạp bằng SQL (tools/tao_khao_sat.py đọc tệp JSON trong supabase/du_lieu/); chưa có màn soạn phiếu.

/* ---------- Bảng ---------- */
create table public.khao_sat (
  id uuid primary key default gen_random_uuid(),
  ma text not null unique check (ma ~ '^[A-Z0-9-]{2,40}$'),
  ten text not null check (length(btrim(ten)) between 1 and 160),
  mo_ta text check (length(mo_ta) <= 3000),
  loi_ket text check (length(loi_ket) <= 1000),
  an_danh boolean not null default true,
  mo boolean not null default false,
  han timestamptz,
  doi_tuong text[] not null default '{Junior,Senior}' check (cardinality(doi_tuong) between 1 and 3),
  tao_boi uuid references public.thanh_vien(id) on delete set null,
  tao_luc timestamptz not null default now()
);
comment on table public.khao_sat is 'Khảo sát cho thành viên CLB. doi_tuong: các cấp được hỏi (Junior, Senior, Ban cố vấn).';

create table public.khao_sat_cau (
  id uuid primary key default gen_random_uuid(),
  khao_sat_id uuid not null references public.khao_sat(id) on delete cascade,
  thu_tu int not null check (thu_tu between 1 and 200),
  phan text check (length(phan) <= 160),
  noi_dung text not null check (length(btrim(noi_dung)) between 1 and 600),
  ghi_chu text check (length(ghi_chu) <= 600),
  loai text not null check (loai in ('chon', 'nhieu', 'thang5', 'chu', 'doan')),
  lua_chon jsonb check (lua_chon is null or jsonb_typeof(lua_chon) = 'array'),
  toi_da int check (toi_da is null or toi_da >= 1),
  nhan_thang jsonb check (nhan_thang is null or (jsonb_typeof(nhan_thang) = 'array' and jsonb_array_length(nhan_thang) = 2)),
  bat_buoc boolean not null default true,
  dieu_kien jsonb check (dieu_kien is null or (jsonb_typeof(dieu_kien) = 'object' and dieu_kien ? 'cau')),
  unique (khao_sat_id, thu_tu),
  check (loai not in ('chon', 'nhieu') or (lua_chon is not null and jsonb_array_length(lua_chon) >= 2))
);
comment on column public.khao_sat_cau.dieu_kien is
  'Câu chỉ hiện khi câu số "cau" đã trả lời thuộc "trong" (mảng), hoặc khi có trả lời ("co": true). NULL: luôn hiện.';

-- Câu trả lời. Khảo sát ẩn danh thì nguoi = null và luc đã làm tròn về đầu ngày.
create table public.khao_sat_tra_loi (
  id uuid primary key default gen_random_uuid(),
  khao_sat_id uuid not null references public.khao_sat(id) on delete cascade,
  nguoi uuid references public.thanh_vien(id) on delete set null,
  tra_loi jsonb not null check (jsonb_typeof(tra_loi) = 'object'),
  luc timestamptz not null default now()
);
create index on public.khao_sat_tra_loi (khao_sat_id);

-- Ai đã gửi. Tách khỏi bảng trả lời để khảo sát ẩn danh vẫn biết ai chưa gửi.
create table public.khao_sat_da_gui (
  khao_sat_id uuid not null references public.khao_sat(id) on delete cascade,
  thanh_vien_id uuid not null references public.thanh_vien(id) on delete cascade,
  luc timestamptz not null default now(),
  primary key (khao_sat_id, thanh_vien_id)
);

alter table public.khao_sat enable row level security;
alter table public.khao_sat_cau enable row level security;
alter table public.khao_sat_tra_loi enable row level security;
alter table public.khao_sat_da_gui enable row level security;
-- Không bảng nào mở cho trình duyệt: chỉ các hàm bên dưới chạm vào. Linter báo INFO là đúng ý.
revoke all on public.khao_sat, public.khao_sat_cau, public.khao_sat_tra_loi, public.khao_sat_da_gui from anon, authenticated;

/* ---------- Ai được làm gì ---------- */
-- Người đang đăng nhập là thành viên CLB còn hoạt động và có cấp nằm trong đối tượng của khảo sát.
create function noi_bo.thuoc_doi_tuong_ks(p_doi_tuong text[]) returns boolean
language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.thanh_vien t where t.user_id = auth.uid() and t.loai = 'thanh_vien'
     and t.hoat_dong and t.cap = any (p_doi_tuong)) $$;

create function noi_bo.cau_khao_sat(p_ks uuid) returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object('thu_tu', c.thu_tu, 'phan', c.phan, 'noi_dung', c.noi_dung, 'ghi_chu', c.ghi_chu,
      'loai', c.loai, 'lua_chon', c.lua_chon, 'toi_da', c.toi_da, 'nhan_thang', c.nhan_thang, 'bat_buoc', c.bat_buoc,
      'dieu_kien', c.dieu_kien) order by c.thu_tu), '[]')
  from public.khao_sat_cau c where c.khao_sat_id = p_ks
$$;

/* ---------- Thành viên ---------- */
-- Khảo sát đang mở dành cho mình, kèm đã gửi hay chưa. Màn Hôm nay dùng hàm này.
create function public.khao_sat_cua_toi() returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object('id', k.id, 'ma', k.ma, 'ten', k.ten, 'han', k.han, 'an_danh', k.an_danh,
      'so_cau', (select count(*) from public.khao_sat_cau c where c.khao_sat_id = k.id),
      'da_gui', exists (select 1 from public.khao_sat_da_gui g where g.khao_sat_id = k.id and g.thanh_vien_id = noi_bo.toi()))
    order by k.tao_luc desc), '[]')
  from public.khao_sat k
  where k.mo and (k.han is null or k.han > now()) and noi_bo.thuoc_doi_tuong_ks(k.doi_tuong)
$$;

-- Một khảo sát và các câu. Thành viên thuộc đối tượng mở được khi khảo sát đang mở; quản trị, Ban cố vấn luôn xem được.
create function public.xem_khao_sat(p_id uuid) returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object('id', k.id, 'ma', k.ma, 'ten', k.ten, 'mo_ta', k.mo_ta, 'loi_ket', k.loi_ket, 'an_danh', k.an_danh,
    'mo', k.mo, 'han', k.han, 'doi_tuong', k.doi_tuong,
    'gui_duoc', k.mo and (k.han is null or k.han > now()) and noi_bo.thuoc_doi_tuong_ks(k.doi_tuong),
    'da_gui', exists (select 1 from public.khao_sat_da_gui g where g.khao_sat_id = k.id and g.thanh_vien_id = noi_bo.toi()),
    'cau', noi_bo.cau_khao_sat(k.id))
  from public.khao_sat k
  where k.id = p_id and (noi_bo.la_quan_tri() or (k.mo and noi_bo.thuoc_doi_tuong_ks(k.doi_tuong)))
$$;

/* Gửi khảo sát. Máy chủ duyệt từng câu theo thứ tự, bỏ câu không hiện, kiểm kiểu và lựa chọn, rồi ghi hai dòng trong
   cùng một giao dịch: một dòng "đã gửi" có tên, một dòng trả lời không tên nếu khảo sát ẩn danh. */
create function public.gui_khao_sat(p_id uuid, p_tra_loi jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  k public.khao_sat; c public.khao_sat_cau; me uuid := noi_bo.toi();
  sach jsonb := '{}'; v jsonb; tr jsonb; hien boolean; khoa text;
begin
  if me is null then raise exception 'Chưa đăng nhập'; end if;
  select * into k from public.khao_sat where id = p_id;
  if k.id is null then raise exception 'Không tìm thấy khảo sát'; end if;
  if not noi_bo.thuoc_doi_tuong_ks(k.doi_tuong) then raise exception 'Khảo sát này không dành cho tài khoản của bạn'; end if;
  if not k.mo then raise exception 'Khảo sát chưa mở hoặc đã đóng'; end if;
  if k.han is not null and now() > k.han then raise exception 'Khảo sát đã hết hạn'; end if;
  if exists (select 1 from public.khao_sat_da_gui g where g.khao_sat_id = p_id and g.thanh_vien_id = me)
  then raise exception 'Bạn đã gửi khảo sát này rồi'; end if;
  if jsonb_typeof(coalesce(p_tra_loi, 'null'::jsonb)) <> 'object' then raise exception 'Câu trả lời không hợp lệ'; end if;

  for c in select * from public.khao_sat_cau where khao_sat_id = p_id order by thu_tu loop
    khoa := c.thu_tu::text;
    hien := true;
    if c.dieu_kien is not null then
      tr := sach -> (c.dieu_kien ->> 'cau');
      if c.dieu_kien ? 'trong' then
        hien := tr is not null and jsonb_typeof(tr) = 'string' and (c.dieu_kien -> 'trong') ? (tr #>> '{}');
      else
        hien := tr is not null;
      end if;
    end if;
    continue when not hien;

    v := p_tra_loi -> khoa;
    if v is null or jsonb_typeof(v) = 'null'
       or (jsonb_typeof(v) = 'string' and btrim(v #>> '{}') = '')
       or (jsonb_typeof(v) = 'array' and jsonb_array_length(v) = 0) then
      if c.bat_buoc then raise exception 'Câu % chưa trả lời', c.thu_tu; end if;
      continue;
    end if;

    if c.loai = 'chon' then
      if jsonb_typeof(v) <> 'string' or not (c.lua_chon ? (v #>> '{}')) then raise exception 'Câu %: lựa chọn không hợp lệ', c.thu_tu; end if;
    elsif c.loai = 'nhieu' then
      if jsonb_typeof(v) <> 'array'
         or exists (select 1 from jsonb_array_elements(v) x where jsonb_typeof(x) <> 'string' or not (c.lua_chon ? (x #>> '{}')))
         or (select count(distinct x) from jsonb_array_elements(v) x) <> jsonb_array_length(v)
      then raise exception 'Câu %: lựa chọn không hợp lệ', c.thu_tu; end if;
      if c.toi_da is not null and jsonb_array_length(v) > c.toi_da then raise exception 'Câu %: chọn tối đa % ý', c.thu_tu, c.toi_da; end if;
    elsif c.loai = 'thang5' then
      if jsonb_typeof(v) <> 'number' or (v #>> '{}') not in ('1', '2', '3', '4', '5') then raise exception 'Câu %: chọn một mức từ 1 đến 5', c.thu_tu; end if;
    else
      if jsonb_typeof(v) <> 'string' then raise exception 'Câu %: câu trả lời không hợp lệ', c.thu_tu; end if;
      v := to_jsonb(left(btrim(v #>> '{}'), case when c.loai = 'chu' then 300 else 2000 end));
    end if;
    sach := sach || jsonb_build_object(khoa, v);
  end loop;

  insert into public.khao_sat_da_gui (khao_sat_id, thanh_vien_id) values (p_id, me);
  insert into public.khao_sat_tra_loi (khao_sat_id, nguoi, tra_loi, luc)
  values (p_id, case when k.an_danh then null else me end, sach,
    case when k.an_danh then date_trunc('day', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh' else now() end);
end $$;

/* ---------- Quản trị và Ban cố vấn ---------- */
create function public.ds_khao_sat() returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(json_build_object('id', k.id, 'ma', k.ma, 'ten', k.ten, 'mo', k.mo, 'han', k.han,
      'an_danh', k.an_danh, 'doi_tuong', k.doi_tuong,
      'so_gui', (select count(*) from public.khao_sat_da_gui g where g.khao_sat_id = k.id),
      'so_doi_tuong', (select count(*) from public.thanh_vien t where t.loai = 'thanh_vien' and t.hoat_dong and t.cap = any (k.doi_tuong)))
    order by k.tao_luc desc), '[]')
  from public.khao_sat k
  where noi_bo.la_quan_tri()
$$;

-- Kết quả: các câu, mọi dòng trả lời (ẩn danh thì không có tên, xếp theo id ngẫu nhiên), và danh sách đối tượng
-- kèm đã gửi hay chưa, đã kích hoạt app hay chưa. Danh sách này không kèm giờ gửi.
create function public.tong_hop_khao_sat(p_id uuid) returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object('id', k.id, 'ma', k.ma, 'ten', k.ten, 'mo', k.mo, 'han', k.han, 'an_danh', k.an_danh,
    'doi_tuong', k.doi_tuong, 'cau', noi_bo.cau_khao_sat(k.id),
    'tra_loi', coalesce((select json_agg(case when k.an_danh then json_build_object('luc', x.luc, 'tra_loi', x.tra_loi)
          else json_build_object('luc', x.luc, 'tra_loi', x.tra_loi, 'ma', t.ma, 'ho_ten', t.ho_ten) end order by x.id)
      from public.khao_sat_tra_loi x left join public.thanh_vien t on t.id = x.nguoi
      where x.khao_sat_id = k.id), '[]'),
    'nguoi', coalesce((select json_agg(json_build_object('ma', t.ma, 'ho_ten', t.ho_ten, 'cap', t.cap, 'gen', t.gen, 'nha', t.nha,
          'da_gui', g.thanh_vien_id is not null, 'da_kich_hoat', t.user_id is not null) order by t.ma)
      from public.thanh_vien t left join public.khao_sat_da_gui g on g.khao_sat_id = k.id and g.thanh_vien_id = t.id
      where t.loai = 'thanh_vien' and ((t.hoat_dong and t.cap = any (k.doi_tuong)) or g.thanh_vien_id is not null)), '[]'))
  from public.khao_sat k
  where k.id = p_id and noi_bo.la_quan_tri()
$$;

-- Mở, đóng và đặt hạn. p_han = null là bỏ hạn.
create function public.dat_khao_sat(p_id uuid, p_mo boolean, p_han timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not noi_bo.la_quan_tri() then raise exception 'Chỉ quản trị và Ban cố vấn được mở, đóng khảo sát'; end if;
  update public.khao_sat set mo = coalesce(p_mo, mo), han = p_han where id = p_id;
  if not found then raise exception 'Không tìm thấy khảo sát'; end if;
end $$;

/* ---------- Quyền gọi hàm ---------- */
revoke all on function noi_bo.thuoc_doi_tuong_ks(text[]), noi_bo.cau_khao_sat(uuid) from public, anon;
grant execute on function noi_bo.thuoc_doi_tuong_ks(text[]), noi_bo.cau_khao_sat(uuid) to authenticated, service_role;
revoke all on function public.khao_sat_cua_toi(), public.xem_khao_sat(uuid), public.gui_khao_sat(uuid, jsonb),
  public.ds_khao_sat(), public.tong_hop_khao_sat(uuid), public.dat_khao_sat(uuid, boolean, timestamptz)
  from public, anon;
grant execute on function public.khao_sat_cua_toi(), public.xem_khao_sat(uuid), public.gui_khao_sat(uuid, jsonb),
  public.ds_khao_sat(), public.tong_hop_khao_sat(uuid), public.dat_khao_sat(uuid, boolean, timestamptz)
  to authenticated;
