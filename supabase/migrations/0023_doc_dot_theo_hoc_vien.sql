-- 0023: học viên chỉ đọc được dòng đợt mình học (anh Long 24/11/2026: "chỉ học viên học khóa nào mới thấy").
-- Trước đây ai đăng nhập cũng đọc thẳng được mọi cột của mọi đợt qua REST, gồm zalo_link, zalo_qr, cai_dat của đợt khác.
-- Thành viên CLB giữ nguyên như cũ. App không đọc thẳng bảng này (đi qua ds_dot, toi_la_ai là security definer),
-- nên không màn nào đổi. Cùng cách với quy tắc đọc của buoi và thong_bao (noi_bo.thay_duoc_dot).
drop policy doc on public.dot;
create policy doc on public.dot for select to authenticated using (
  (select noi_bo.toi()) is not null and (not (select noi_bo.la_hoc_vien()) or noi_bo.thay_duoc_dot(id)));
