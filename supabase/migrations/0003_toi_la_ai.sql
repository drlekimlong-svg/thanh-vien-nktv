-- Thông tin và quyền của người đang đăng nhập, dùng để dựng giao diện. Quyền thật vẫn do các quy tắc ở bảng và hàm quyết định.
create function public.toi_la_ai() returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object('id', id, 'ma', ma, 'ho_ten', ho_ten, 'gen', gen, 'nha', nha, 'cap', cap, 'hoat_dong', hoat_dong,
    'khoa_qr', khoa_qr, 'vai_tro', vai_tro,
    'la_quan_tri', vai_tro = 'quan_tri', 'la_phu_trach', vai_tro in ('quan_tri','diem_danh'),
    'xem_duoc_ten', vai_tro in ('quan_tri','diem_danh') or cap = 'Ban cố vấn')
  from public.thanh_vien where user_id = auth.uid()
$$;
revoke all on function public.toi_la_ai() from public, anon;
grant execute on function public.toi_la_ai() to authenticated;
