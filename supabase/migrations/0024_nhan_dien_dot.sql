-- 0024: ảnh nhận diện của đợt (thẻ khóa, ảnh đầu trang, biểu tượng, vé điểm danh, con mộc, màu nhấn)
-- và hai ô lớp, MSSV trên vé điểm danh của học viên. Ảnh là ảnh trang trí, công khai; không chứa dữ liệu cá nhân.
--   * dot.nhan_dien jsonb: null = chưa có ảnh. Khóa ảnh là đường dẫn trong kho "anh-dot", bắt đầu bằng id của chính đợt.
--   * Kho Supabase Storage "anh-dot": công khai để đọc, tối đa 600 KB một tệp, chỉ webp/png/jpeg. Chỉ quản trị, Ban cố vấn,
--     trưởng ban và thư ký của đợt được ghi, sửa, xóa trong thư mục mang id đợt đó.
--   * luu_nhan_dien_dot: lưu cột nhan_dien. Tệp ảnh mới luôn mang tên mới (đuôi phiên bản) nên CDN không giữ ảnh cũ;
--     trình duyệt xóa tệp cũ (quá 15 phút, không còn được nhắc tới) sau khi lưu; hàm từ chối khóa trỏ tới tệp không có trong kho.
--   * Chỉ người có quyền ghi liệt kê được tệp trong kho; ảnh vẫn tải công khai qua /object/public/.
--   * ds_dot và toi_la_ai chỉ thêm trường nhan_dien; toi_la_ai của học viên thêm lop, mssv. Thân hàm lấy từ bản đang chạy
--     trên máy chủ ngày 23/11/2026, không bớt trường nào.

alter table public.dot add column nhan_dien jsonb;

create function noi_bo.nhan_dien_hop_le(p_dot uuid, p jsonb) returns boolean language sql immutable set search_path = '' as
$$ select p is null or (jsonb_typeof(p) = 'object' and not exists (
     select 1 from jsonb_each(p) e where case
       when e.key = 'mau' then jsonb_typeof(e.value) <> 'string' or (e.value #>> '{}') !~ '^#[0-9a-fA-F]{6}$'
       when e.key in ('the', 'dau', 'bieu_tuong', 've', 'moc') then jsonb_typeof(e.value) <> 'string'
         or (e.value #>> '{}') !~ ('^' || p_dot::text || '/' || e.key || '-[0-9a-z]{4,12}\.(webp|png|jpg)$')
       else true end)) $$;

alter table public.dot add constraint dot_nhan_dien_hop_le check (noi_bo.nhan_dien_hop_le(id, nhan_dien));

/* ---------- Kho ảnh */

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('anh-dot', 'anh-dot', true, 614400, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;

-- Tên tệp phải có dạng <id đợt>/<ô>-<phiên bản>.<đuôi> và người ghi phải là Ban tổ chức của đợt đó.
create function noi_bo.ghi_duoc_anh_dot(p_ten text) returns boolean language sql stable set search_path = '' as
$$ select case when p_ten ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(the|dau|bieu_tuong|ve|moc)-[0-9a-z]{4,12}\.(webp|png|jpg)$'
     then noi_bo.la_btc_dot(split_part(p_ten, '/', 1)::uuid) else false end $$;
revoke all on function noi_bo.ghi_duoc_anh_dot(text), noi_bo.nhan_dien_hop_le(uuid, jsonb) from public, anon;
-- service_role cũng ghi bảng dot (ràng buộc CHECK chạy dưới quyền người ghi), như 0021 đã làm với hàm của nó.
grant execute on function noi_bo.ghi_duoc_anh_dot(text), noi_bo.nhan_dien_hop_le(uuid, jsonb) to authenticated, service_role;

-- Ảnh tải qua /object/public/ không cần quy tắc đọc; quy tắc này chỉ để người có quyền ghi liệt kê và dọn tệp của đợt mình.
create policy anh_dot_doc on storage.objects for select to authenticated
  using (bucket_id = 'anh-dot' and noi_bo.ghi_duoc_anh_dot(name));
create policy anh_dot_them on storage.objects for insert to authenticated
  with check (bucket_id = 'anh-dot' and noi_bo.ghi_duoc_anh_dot(name));
create policy anh_dot_sua on storage.objects for update to authenticated
  using (bucket_id = 'anh-dot' and noi_bo.ghi_duoc_anh_dot(name))
  with check (bucket_id = 'anh-dot' and noi_bo.ghi_duoc_anh_dot(name));
create policy anh_dot_xoa on storage.objects for delete to authenticated
  using (bucket_id = 'anh-dot' and noi_bo.ghi_duoc_anh_dot(name));

/* ---------- Lưu */

create function public.luu_nhan_dien_dot(p_dot uuid, p jsonb) returns json language plpgsql security definer set search_path = '' as $$
declare v jsonb;
begin
  if noi_bo.toi() is null then raise exception 'Chưa đăng nhập'; end if;
  if not noi_bo.la_btc_dot(p_dot) then raise exception 'Chỉ quản trị, Ban cố vấn, trưởng ban và thư ký của đợt được đặt ảnh nhận diện'; end if;
  if p is not null and jsonb_typeof(p) not in ('object', 'null') then raise exception 'Dữ liệu ảnh nhận diện không hợp lệ'; end if;
  v := case when jsonb_typeof(p) = 'object' then nullif(p, '{}'::jsonb) end;
  if not noi_bo.nhan_dien_hop_le(p_dot, v) then raise exception 'Ảnh hoặc màu không hợp lệ: chỉ nhận ảnh trong kho của đợt này và màu dạng #RRGGBB'; end if;
  -- Hàm chạy quyền chủ hàm nên đọc được storage.objects. Ảnh đã bị người khác thay và dọn khỏi kho thì không cho lưu tham chiếu treo.
  if exists (select 1 from jsonb_each_text(v) e where e.key <> 'mau'
      and not exists (select 1 from storage.objects o where o.bucket_id = 'anh-dot' and o.name = e.value)) then
    raise exception 'Có ảnh không còn trong kho, tải lại trang rồi lưu lại';
  end if;
  update public.dot set nhan_dien = v where id = p_dot;
  if not found then raise exception 'Không tìm thấy đợt'; end if;
  insert into public.dot_nhat_ky (dot_id, nguoi, hanh_dong, chi_tiet) values (p_dot, noi_bo.toi(), 'Đặt ảnh nhận diện', null);
  return json_build_object('nhan_dien', v);
end $$;
revoke all on function public.luu_nhan_dien_dot(uuid, jsonb) from public, anon;
grant execute on function public.luu_nhan_dien_dot(uuid, jsonb) to authenticated;

/* ---------- Trả nhan_dien ra (bản đang chạy + trường mới) */

create or replace function public.ds_dot()
 returns json
 language sql
 stable security definer
 set search_path to ''
as $function$
  select coalesce(json_agg(json_build_object(
    'id', d.id, 'ma', d.ma, 'ten', d.ten, 'nam_hoc', d.nam_hoc, 'mo_ta', d.mo_ta,
    'bat_dau', d.bat_dau, 'ket_thuc', d.ket_thuc, 'trang_thai', d.trang_thai,
    'cai_dat', d.cai_dat,
    'zalo_link', d.zalo_link, 'co_zalo_qr', d.zalo_qr is not null,
    'so_hoc_vien', (select count(*) from public.dot_hoc_vien g where g.dot_id = d.id and g.trang_thai = 'ghi_danh'),
    'so_kich_hoat', (select count(*) from public.dot_hoc_vien g join public.thanh_vien t on t.id = g.thanh_vien_id
       where g.dot_id = d.id and g.trang_thai = 'ghi_danh' and t.user_id is not null),
    'nhan_dien', d.nhan_dien,
    'la_btc', noi_bo.la_btc_dot(d.id)) order by d.bat_dau desc nulls last, d.tao_luc desc), '[]')
  from public.dot d where noi_bo.la_quan_tri() or noi_bo.xem_duoc_hoc_vien()
$function$;

create or replace function public.toi_la_ai()
 returns json
 language sql
 stable security definer
 set search_path to ''
as $function$
  select case when t.loai = 'hoc_vien' then
    json_build_object('id', t.id, 'ma', t.ma, 'ho_ten', t.ho_ten, 'loai', 'hoc_vien',
      'hoat_dong', t.hoat_dong, 'khoa_qr', t.khoa_qr, 'email', h.email,
      'lop', h.lop, 'mssv', h.mssv,
      'dot', coalesce((select json_agg(json_build_object('id', d.id, 'ma', d.ma, 'ten', d.ten,
          'bat_dau', d.bat_dau, 'ket_thuc', d.ket_thuc, 'trang_thai', d.trang_thai, 'nhan_dien', d.nhan_dien) order by d.bat_dau desc nulls last)
        from public.dot_hoc_vien g join public.dot d on d.id = g.dot_id
        where g.thanh_vien_id = t.id and g.trang_thai = 'ghi_danh'), '[]'),
      'chi_doc', not exists (select 1 from noi_bo.dot_mo_cua_toi()),
      'bay_gio', now())
  else
    json_build_object('id', t.id, 'ma', t.ma, 'ho_ten', t.ho_ten, 'loai', 'thanh_vien',
      'gen', t.gen, 'nha', t.nha, 'cap', t.cap, 'hoat_dong', t.hoat_dong,
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
      'btc_dot', coalesce((select json_agg(json_build_object('dot_id', b.dot_id, 'vai', b.vai)) from public.dot_ban_to_chuc b where b.thanh_vien_id = t.id), '[]'),
      'bay_gio', now())
  end
  from public.thanh_vien t left join public.hv_ho_so h on h.thanh_vien_id = t.id
  where t.user_id = auth.uid()
$function$;
