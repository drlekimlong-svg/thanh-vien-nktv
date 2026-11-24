-- Học viên các đợt tập huấn dùng được phiếu trả lời bài giấy (đường 1, đặc tả app thi XQ2627 mục 15.1; anh Long chọn 24/11/2026).
-- Anh Long duyệt 24/11/2026 ("Áp và đẩy"), áp dụng cùng ngày. Đã thử trước đó trong giao dịch tự hoàn tác, kết quả ở cuối tệp.
--
-- 0019 chặn học viên ở các hàm người làm bài (noi_bo.la_hoc_vien()), nhập hộ chỉ nhận thành viên CLB,
-- danh sách tiến độ chỉ liệt kê thành viên CLB. Migration này thay thân sáu hàm của 0019 bằng create or replace:
-- không đổi bảng, không đổi quyền gọi hàm (create or replace giữ nguyên ACL), không mở thêm gì cho anon.
--
--   * Học viên làm được phiếu khi đang ghi danh (dot_hoc_vien.trang_thai = 'ghi_danh') đợt có buổi gắn phiếu.
--     Mở và gửi cần thêm đợt đang mở (0014: đợt kết thúc là chỉ đọc); xem lại phiếu đã gửi thì không cần.
--     Giữ nguyên các điều kiện còn lại: phiếu đang mở, đã điểm danh buổi, mật khẩu, gửi một lần.
--   * Danh sách phiếu (bai_giay_cua_toi) chỉ hiện phiếu của buổi thuộc đợt khi người xem đã điểm danh buổi đó hoặc đã gửi,
--     để học viên không thấy phiếu của bảy nhóm khác, và 230 thành viên CLB không thấy 16 dòng "Chờ điểm danh" của buổi lượng giá.
--   * Thành viên CLB: phiếu của buổi CLB (dot_id null, như pretest 22/11) giữ nguyên từng chữ; noi_bo.duoc_phieu trả true cho
--     mọi người không phải học viên. Chỉ phiếu của buổi thuộc đợt, loại chưa từng có trước 0025, bị ẩn khi chưa điểm danh.
--   * Học viên không bao giờ đọc được đáp án hay mật khẩu: bai_giay_khoa vẫn chỉ nằm sau các hàm quản trị;
--     người làm chỉ nhận so_dung của chính mình khi phiếu bật hien_diem.
--   * Lời báo lỗi nói "giám thị" thay "Ban cố vấn" khi người làm là học viên.
--   * ds_bai_giay, ket_qua_bai_giay, luu_bai_giay, dat_mat_khau_bai_giay, xoa_bai_giay_lam không đổi
--     (nối public.thanh_vien, không lọc loại).

/* ---------- Hàm phụ ---------- */
-- Người đang đăng nhập có được vào phiếu của buổi này không. Không phải học viên: có tài khoản là được (như 0019).
-- Học viên: buổi thuộc một đợt mà người đó đang ghi danh. p_ghi = true (mở, gửi): đợt còn phải đang mở.
create function noi_bo.duoc_phieu(p_buoi uuid, p_ghi boolean) returns boolean
language sql stable security definer set search_path = '' as $$
  select noi_bo.toi() is not null and (not noi_bo.la_hoc_vien() or exists (
    select 1 from public.buoi b
    where b.id = p_buoi and b.dot_id is not null and noi_bo.o_trong_dot(b.dot_id)
      and (not p_ghi or noi_bo.dot_dang_mo(b.dot_id))))
$$;
revoke all on function noi_bo.duoc_phieu(uuid, boolean) from public, anon, authenticated;

/* ---------- Người làm bài ---------- */
create or replace function public.bai_giay_cua_toi() returns json
language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(x order by x.buoi_bat_dau desc, x.ten), '[]'::json) from (
    select g.id, g.ten, g.so_cau, g.mo, b.bat_dau as buoi_bat_dau,
      exists (select 1 from public.diem_danh d where d.buoi_id = g.buoi_id and d.thanh_vien_id = noi_bo.toi()) as da_diem_danh,
      l.mo_luc is not null as da_mo, l.gui_luc
    from public.bai_giay g
    join public.buoi b on b.id = g.buoi_id
    left join public.bai_giay_lam l on l.bai_id = g.id and l.thanh_vien_id = noi_bo.toi()
    where noi_bo.toi() is not null and (g.mo or l.gui_luc is not null) and noi_bo.duoc_phieu(g.buoi_id, false)
      -- Phiếu của buổi CLB: thành viên thấy như cũ. Phiếu của buổi thuộc đợt (kể cả học viên): chỉ khi đã điểm danh buổi đó hoặc đã gửi.
      and ((b.dot_id is null and not noi_bo.la_hoc_vien())
        or exists (select 1 from public.diem_danh d2 where d2.buoi_id = g.buoi_id and d2.thanh_vien_id = noi_bo.toi())
        or l.gui_luc is not null)
  ) x
$$;

create or replace function public.xem_bai_giay(p_bai uuid) returns json
language plpgsql stable security definer set search_path = '' as $$
declare t uuid := noi_bo.toi(); g public.bai_giay; l public.bai_giay_lam; b public.buoi;
begin
  if t is null then raise exception 'Phiếu này dành cho thành viên CLB.'; end if;
  select * into g from public.bai_giay where id = p_bai;
  if not found then raise exception 'Không có phiếu này.'; end if;
  if not noi_bo.duoc_phieu(g.buoi_id, false) then raise exception 'Phiếu này không thuộc khóa học của bạn.'; end if;
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

create or replace function public.mo_bai_giay(p_bai uuid, p_mat_khau text) returns json
language plpgsql security definer set search_path = '' as $$
declare t uuid := noi_bo.toi(); g public.bai_giay; l public.bai_giay_lam; k public.bai_giay_khoa;
  ai text := case when noi_bo.la_hoc_vien() then 'giám thị' else 'Ban cố vấn' end;
begin
  if t is null then raise exception 'Phiếu này dành cho thành viên CLB.'; end if;
  select * into g from public.bai_giay where id = p_bai;
  if not found or not g.mo then raise exception 'Phiếu này chưa mở hoặc đã đóng.'; end if;
  if not noi_bo.duoc_phieu(g.buoi_id, true) then raise exception 'Phiếu này không thuộc khóa học đang mở của bạn.'; end if;
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
  if k.mat_khau_bam is null then raise exception 'Phiếu chưa có mật khẩu. Báo lại cho %.', ai; end if;
  if k.mat_khau_bam <> extensions.crypt(noi_bo.chuan_mat_khau(p_mat_khau), k.mat_khau_bam) then
    update public.bai_giay_lam set lan_sai = lan_sai + 1, sai_luc = now() where bai_id = p_bai and thanh_vien_id = t;
    return json_build_object('ok', false, 'loi', 'Mật khẩu chưa đúng.');
  end if;
  update public.bai_giay_lam set mo_luc = now(), lan_sai = 0, sai_luc = null where bai_id = p_bai and thanh_vien_id = t;
  return json_build_object('ok', true);
end $$;

create or replace function public.gui_bai_giay(p_bai uuid, p_tra_loi jsonb) returns json
language plpgsql security definer set search_path = '' as $$
declare t uuid := noi_bo.toi(); g public.bai_giay; l public.bai_giay_lam; tl int[];
  ai text := case when noi_bo.la_hoc_vien() then 'giám thị' else 'Ban cố vấn' end;
begin
  if t is null then raise exception 'Phiếu này dành cho thành viên CLB.'; end if;
  select * into g from public.bai_giay where id = p_bai;
  if not found or not g.mo then raise exception 'Phiếu đã đóng. Chưa kịp gửi thì báo %.', ai; end if;
  if not noi_bo.duoc_phieu(g.buoi_id, true) then raise exception 'Phiếu này không thuộc khóa học đang mở của bạn.'; end if;
  select * into l from public.bai_giay_lam where bai_id = p_bai and thanh_vien_id = t for update;
  if not found or l.mo_luc is null then raise exception 'Cần nhập mật khẩu để mở phiếu trước.'; end if;
  if l.gui_luc is not null then raise exception 'Bạn đã gửi phiếu này rồi. Cần sửa thì báo %.', ai; end if;
  tl := noi_bo.doc_tra_loi(p_tra_loi, g.so_cau, g.so_lua_chon);
  update public.bai_giay_lam set tra_loi = tl, gui_luc = now() where bai_id = p_bai and thanh_vien_id = t;
  return public.xem_bai_giay(p_bai);
end $$;

/* ---------- Quản trị và Ban cố vấn ---------- */
-- Tiến độ: buổi CLB giữ nguyên (thành viên CLB còn hoạt động hoặc đã gửi). Buổi của đợt: học viên ghi danh trong đợt
-- (hoặc đã đăng ký ca, nếu buổi can_dang_ky), cộng bất kỳ ai đã điểm danh hay đã gửi. Không có đáp án, không có điểm.
create or replace function public.tien_do_bai_giay(p_bai uuid) returns json
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
      from public.thanh_vien v
      left join public.bai_giay_lam l on l.bai_id = g.id and l.thanh_vien_id = v.id
      where case when b.dot_id is null
          then v.loai = 'thanh_vien' and (v.hoat_dong or l.gui_luc is not null)
          else l.gui_luc is not null
            or exists (select 1 from public.diem_danh d where d.buoi_id = g.buoi_id and d.thanh_vien_id = v.id)
            or case when b.can_dang_ky
                 then exists (select 1 from public.dang_ky_buoi r where r.buoi_id = b.id and r.thanh_vien_id = v.id)
                 else exists (select 1 from public.dot_hoc_vien h
                   where h.dot_id = b.dot_id and h.thanh_vien_id = v.id and h.trang_thai = 'ghi_danh') end
          end) x));
end $$;

-- Quản trị sửa phiếu một người chép nhầm, hoặc ghi phiếu cho người không vào được app. Ghi lại ai đã sửa.
-- Nhận thành viên CLB như cũ, và học viên đang ghi danh đợt có buổi của phiếu.
create or replace function public.nhap_ho_bai_giay(p_bai uuid, p_tv uuid, p_tra_loi jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare g public.bai_giay; tl int[];
begin
  if not noi_bo.la_admin() then raise exception 'Chỉ quản trị được sửa phiếu của người khác.'; end if;
  select * into g from public.bai_giay where id = p_bai;
  if not found then raise exception 'Không có phiếu này.'; end if;
  if not exists (select 1 from public.thanh_vien v where v.id = p_tv and (v.loai = 'thanh_vien' or exists (
      select 1 from public.buoi b join public.dot_hoc_vien h on h.dot_id = b.dot_id
      where b.id = g.buoi_id and h.thanh_vien_id = v.id and h.trang_thai = 'ghi_danh'))) then
    raise exception 'Không có người này trong danh sách của phiếu.';
  end if;
  tl := noi_bo.doc_tra_loi(p_tra_loi, g.so_cau, g.so_lua_chon);
  insert into public.bai_giay_lam (bai_id, thanh_vien_id, mo_luc, tra_loi, gui_luc, nhap_ho_boi)
    values (p_bai, p_tv, now(), tl, now(), noi_bo.toi())
  on conflict (bai_id, thanh_vien_id) do update set tra_loi = excluded.tra_loi, gui_luc = excluded.gui_luc,
    mo_luc = coalesce(public.bai_giay_lam.mo_luc, excluded.mo_luc), nhap_ho_boi = excluded.nhap_ho_boi;
end $$;

/* ---------- Kết quả thử (24/11/2026) ----------
   Thử trên cơ sở dữ liệu thật trong giao dịch tự hoàn tác (begin; rồi khối do có raise exception ở cuối), tài khoản đợt DIENTAP
   (HV90001–HV90010) cùng người giả tạo ngay trong giao dịch (auth.users giả, mã ZZ…). Sau mỗi lượt kiểm lại: không còn dòng
   thử, noi_bo.duoc_phieu không tồn tại, thân sáu hàm vẫn là bản 0019, hv_so vẫn 1, DIENTAP vẫn đang mở.
   Hai lượt, mỗi lượt 57 phép. Mỗi lượt hỏng đúng một phép do vế kiểm viết sai chứ không do migration: lượt 1 phép BCV1
   (so_dap_an chứa chữ dap_an), lượt 2 phép TV6 (ds_bai_giay không nằm trong migration, mo của hai phiếu đợt vừa đổi);
   vế kiểm đúng của từng phép đã đạt ở lượt kia. Còn lại đạt:
   * Thành viên CLB giữ nguyên: danh sách phiếu, xem, mở, gửi, gửi lần hai (vẫn nói Ban cố vấn), tiến độ phiếu buổi CLB
     và phiếu pretest thật 181a0665-…, kết quả, Ban cố vấn xem tiến độ — y hệt từng ký tự so với trước migration.
   * Thành viên chưa điểm danh buổi của đợt không thấy phiếu đợt; đã điểm danh thì thấy.
   * Học viên đã điểm danh: thấy đúng một phiếu của buổi mình; xem không lộ đáp án, mật khẩu; sai mật khẩu ok=false; mật khẩu đúng
     (hoa thường, khoảng trắng) mở được; gửi sai số câu bị từ chối; gửi được; gửi lần hai bị từ chối, nói giám thị;
     hien_diem tắt thì không có số câu đúng, bật thì thấy đúng số.
   * Không mở được: ghi danh chưa điểm danh, đã hủy ghi danh (dù từng điểm danh), học viên đợt khác (dù đã điểm danh buổi này),
     phiếu của buổi CLB. Đợt kết thúc: không mở được nữa nhưng xem lại bài đã gửi.
   * Học viên không đọc thẳng được bai_giay_khoa, bai_giay_lam; bảy hàm quản trị đều từ chối học viên.
   * Quản trị: tiến độ phiếu đợt đúng người; nhập hộ được cho học viên ghi danh (kể cả chưa điểm danh) và thành viên CLB;
     từ chối học viên đã hủy, đợt khác, phiếu buổi CLB; xóa để gửi lại rồi học viên gửi không cần mật khẩu. Ban cố vấn xem
     được tiến độ, không xem được kết quả, không nhập hộ.
   * Quyền gọi hàm: ACL sáu hàm không đổi; anon không gọi được hàm nào của phiếu; noi_bo.duoc_phieu không mở cho authenticated.
   Chưa thử: 50 người gửi cùng lúc (DIENTAP chỉ có 10 tài khoản giả). */
