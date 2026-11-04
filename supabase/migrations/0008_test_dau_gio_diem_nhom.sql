-- Bài test đầu giờ (anh Long yêu cầu 03/11/2026): bài gắn với một buổi, chỉ người đã điểm danh buổi đó mới mở được.
-- Câu hỏi có thể kèm một hình (data URL). Hình chỉ đi cùng câu hỏi khi người làm đã được mở bài, giống chữ của câu.
-- Điểm nhóm theo buổi: cách tính do agent đề xuất, chờ anh Long xác nhận.
alter table public.bai_test add column buoi_id uuid references public.buoi(id) on delete set null;
create index on public.bai_test (buoi_id);
alter table public.cau_hoi add column hinh text check (hinh is null or (hinh like 'data:image/%' and octet_length(hinh) <= 1500000));

-- Gửi thiếu khóa buoi_id hoặc hinh (bản giao diện cũ) thì giữ nguyên giá trị đang có.
create or replace function public.luu_bai_test(p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := nullif(p ->> 'id', '')::uuid; v_buoi uuid := nullif(p ->> 'buoi_id', '')::uuid; c jsonb; co_lam boolean; so int; r record; v_cau uuid; cu jsonb; v_hinh text;
begin
  if not noi_bo.la_quan_tri() then raise exception 'Chỉ quản trị được soạn bài'; end if;
  if coalesce(trim(p ->> 'tieu_de'), '') = '' then raise exception 'Cần có tên bài'; end if;
  if v_buoi is not null and not exists (select 1 from public.buoi where id = v_buoi) then raise exception 'Không tìm thấy buổi sinh hoạt đã chọn'; end if;
  if p ->> 'trang_thai' = 'mo' then
    so := 0;
    for c in select * from jsonb_array_elements(p -> 'cau') loop
      so := so + 1;
      if jsonb_array_length(c -> 'lua_chon') < 2 then raise exception 'Câu % cần ít nhất 2 lựa chọn', so; end if;
      if (c ->> 'dung') is null or (c ->> 'dung')::int >= jsonb_array_length(c -> 'lua_chon') then raise exception 'Câu % chưa có đáp án đúng', so; end if;
    end loop;
    if so = 0 then raise exception 'Bài chưa có câu hỏi'; end if;
  end if;
  if v_id is null then
    insert into public.bai_test (tieu_de, mo_ta, thoi_gian_phut, mo_luc, dong_luc, so_lan, hien_dap_an, trang_thai, nguon_tep, buoi_id, tao_boi)
    values (p ->> 'tieu_de', p ->> 'mo_ta', (p ->> 'thoi_gian_phut')::int, (p ->> 'mo_luc')::timestamptz, (p ->> 'dong_luc')::timestamptz, (p ->> 'so_lan')::int, p ->> 'hien_dap_an', p ->> 'trang_thai', p ->> 'nguon_tep', v_buoi, noi_bo.toi())
    returning id into v_id;
  else
    update public.bai_test set tieu_de = p ->> 'tieu_de', mo_ta = p ->> 'mo_ta', thoi_gian_phut = (p ->> 'thoi_gian_phut')::int, mo_luc = (p ->> 'mo_luc')::timestamptz, dong_luc = (p ->> 'dong_luc')::timestamptz,
      so_lan = (p ->> 'so_lan')::int, hien_dap_an = p ->> 'hien_dap_an', trang_thai = p ->> 'trang_thai', nguon_tep = coalesce(p ->> 'nguon_tep', nguon_tep),
      buoi_id = case when p ? 'buoi_id' then v_buoi else buoi_id end where id = v_id;
  end if;
  co_lam := exists (select 1 from public.lam_bai where bai_id = v_id);
  if co_lam then
    -- Đã có người làm: giữ nguyên số câu, chỉ sửa chữ, hình và đáp án, rồi chấm lại.
    if jsonb_array_length(p -> 'cau') <> (select count(*) from public.cau_hoi where bai_id = v_id) then raise exception 'Bài đã có người làm nên không thêm hoặc bớt câu được'; end if;
    for c in select * from jsonb_array_elements(p -> 'cau') loop
      update public.cau_hoi set phan = c ->> 'phan', noi_dung = c ->> 'noi_dung', lua_chon = c -> 'lua_chon',
        hinh = case when c ? 'hinh' then nullif(c ->> 'hinh', '') else hinh end
      where id = (c ->> 'id')::uuid and bai_id = v_id;
      if (c ->> 'dung') is not null then
        insert into public.dap_an (cau_hoi_id, dung) values ((c ->> 'id')::uuid, (c ->> 'dung')::int) on conflict (cau_hoi_id) do update set dung = excluded.dung;
      end if;
    end loop;
    for r in select id, tra_loi, nop_luc, tu_dong from public.lam_bai where bai_id = v_id and nop_luc is not null loop
      perform noi_bo.cham(r.id, r.tra_loi, r.nop_luc, r.tu_dong);
    end loop;
  else
    select jsonb_object_agg(id::text, hinh) into cu from public.cau_hoi where bai_id = v_id and hinh is not null;
    delete from public.cau_hoi where bai_id = v_id;
    so := 0;
    for c in select * from jsonb_array_elements(p -> 'cau') loop
      so := so + 1;
      v_hinh := case when c ? 'hinh' then nullif(c ->> 'hinh', '') else cu ->> (c ->> 'id') end;
      insert into public.cau_hoi (bai_id, thu_tu, phan, noi_dung, lua_chon, hinh) values (v_id, so, c ->> 'phan', c ->> 'noi_dung', c -> 'lua_chon', v_hinh) returning id into v_cau;
      if (c ->> 'dung') is not null then insert into public.dap_an (cau_hoi_id, dung) values (v_cau, (c ->> 'dung')::int); end if;
    end loop;
  end if;
  return v_id;
end $$;

create or replace function public.bai_cua_toi() returns json
language plpgsql security definer set search_path = '' as $$
declare t uuid := noi_bo.toi(); kq json;
begin
  if t is null then raise exception 'Chưa đăng nhập'; end if;
  perform noi_bo.cham_qua_han(null);
  select coalesce(json_agg(x order by x.sap_xep desc), '[]') into kq from (
    select b.id, b.tieu_de, b.mo_ta, b.thoi_gian_phut, b.mo_luc, b.dong_luc, b.so_lan, b.hien_dap_an, coalesce(b.mo_luc, u.bat_dau, b.tao_luc) sap_xep,
      b.buoi_id, u.ten buoi_ten, u.bat_dau buoi_bat_dau,
      b.buoi_id is null or exists (select 1 from public.diem_danh d where d.buoi_id = b.buoi_id and d.thanh_vien_id = t) da_diem_danh,
      (select count(*) from public.cau_hoi c where c.bai_id = b.id) so_cau,
      (select count(*) from public.lam_bai l where l.bai_id = b.id and l.thanh_vien_id = t and l.nop_luc is not null) da_gui,
      (select max(l.diem) from public.lam_bai l where l.bai_id = b.id and l.thanh_vien_id = t) diem,
      (select l.han_luc from public.lam_bai l where l.bai_id = b.id and l.thanh_vien_id = t and l.nop_luc is null order by l.lan desc limit 1) dang_lam_den
    from public.bai_test b left join public.buoi u on u.id = b.buoi_id where b.trang_thai = 'mo') x;
  return kq;
end $$;

create or replace function public.bat_dau_bai(p_bai uuid) returns json
language plpgsql security definer set search_path = '' as $$
declare t uuid := noi_bo.toi(); b public.bai_test; l public.lam_bai; n int; u public.buoi;
begin
  if t is null then raise exception 'Chưa đăng nhập'; end if;
  select * into b from public.bai_test where id = p_bai and trang_thai = 'mo';
  if b.id is null then raise exception 'Bài chưa mở'; end if;
  perform noi_bo.cham_qua_han(p_bai);
  select * into l from public.lam_bai where bai_id = p_bai and thanh_vien_id = t and nop_luc is null order by lan desc limit 1;
  if l.id is null then
    if b.buoi_id is not null and not exists (select 1 from public.diem_danh d where d.buoi_id = b.buoi_id and d.thanh_vien_id = t) then
      select * into u from public.buoi where id = b.buoi_id;
      raise exception 'Bài test đầu giờ chỉ mở sau khi bạn đã điểm danh buổi %.', to_char(u.bat_dau at time zone 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY');
    end if;
    if b.mo_luc is not null and b.mo_luc > now() then raise exception 'Bài chưa đến giờ mở'; end if;
    if b.dong_luc is not null and b.dong_luc <= now() then raise exception 'Bài đã đóng'; end if;
    select count(*) into n from public.lam_bai where bai_id = p_bai and thanh_vien_id = t;
    if n >= b.so_lan then raise exception 'Đã hết số lần làm bài'; end if;
    insert into public.lam_bai (bai_id, thanh_vien_id, lan, han_luc)
    values (p_bai, t, n + 1, least(now() + make_interval(mins => b.thoi_gian_phut), coalesce(b.dong_luc, 'infinity'::timestamptz)))
    returning * into l;
  end if;
  return json_build_object('lam_id', l.id, 'han_luc', l.han_luc, 'bay_gio', now(), 'tra_loi', l.tra_loi, 'tieu_de', b.tieu_de, 'mo_ta', b.mo_ta, 'cau',
    (select json_agg(json_build_object('id', c.id, 'thu_tu', c.thu_tu, 'phan', c.phan, 'noi_dung', c.noi_dung, 'lua_chon', c.lua_chon, 'hinh', c.hinh) order by c.thu_tu) from public.cau_hoi c where c.bai_id = p_bai));
end $$;

create or replace function public.xem_lai_bai(p_bai uuid) returns json
language plpgsql security definer set search_path = '' as $$
declare t uuid := noi_bo.toi(); b public.bai_test; l public.lam_bai; duoc boolean;
begin
  select * into b from public.bai_test where id = p_bai and trang_thai = 'mo';
  if b.id is null or t is null then raise exception 'Không xem được bài này'; end if;
  perform noi_bo.cham_qua_han(p_bai);
  select * into l from public.lam_bai where bai_id = p_bai and thanh_vien_id = t and nop_luc is not null order by diem desc nulls last, lan desc limit 1;
  if l.id is null then raise exception 'Chưa có bài đã gửi'; end if;
  duoc := b.hien_dap_an = 'sau_gui' or (b.hien_dap_an = 'sau_dong' and b.dong_luc is not null and b.dong_luc <= now());
  return json_build_object('tieu_de', b.tieu_de, 'so_dung', l.so_dung, 'tong', l.tong, 'diem', l.diem, 'nop_luc', l.nop_luc, 'tu_dong', l.tu_dong, 'hien_dap_an', duoc, 'hien_dap_an_kieu', b.hien_dap_an, 'dong_luc', b.dong_luc,
    'cau', case when duoc then (select json_agg(json_build_object('thu_tu', c.thu_tu, 'phan', c.phan, 'noi_dung', c.noi_dung, 'lua_chon', c.lua_chon, 'hinh', c.hinh, 'chon', (l.tra_loi ->> c.id::text)::int, 'dung', a.dung) order by c.thu_tu)
      from public.cau_hoi c left join public.dap_an a on a.cau_hoi_id = c.id where c.bai_id = p_bai) end);
end $$;

-- Bài gắn với buổi: đối tượng là những người đã điểm danh buổi đó, không phải toàn bộ thành viên.
create or replace function public.thong_ke_bai(p_bai uuid) returns json
language plpgsql security definer set search_path = '' as $$
declare kq json; v_buoi uuid;
begin
  if not noi_bo.la_quan_tri() then raise exception 'Chỉ quản trị xem được thống kê'; end if;
  perform noi_bo.cham_qua_han(p_bai);
  select buoi_id into v_buoi from public.bai_test where id = p_bai;
  with tot as (
    select distinct on (l.thanh_vien_id) l.* from public.lam_bai l where l.bai_id = p_bai and l.nop_luc is not null
    order by l.thanh_vien_id, l.diem desc nulls last, l.lan desc
  ), dt as (
    select t.id from public.thanh_vien t
    where case when v_buoi is null then t.hoat_dong else exists (select 1 from public.diem_danh d where d.buoi_id = v_buoi and d.thanh_vien_id = t.id) end
  )
  select json_build_object(
    'buoi_id', v_buoi,
    'doi_tuong', (select count(*) from dt),
    'da_gui', (select count(*) from tot),
    'tb', (select round(avg(diem), 2) from tot), 'cao', (select max(diem) from tot), 'thap', (select min(diem) from tot),
    'ds', (select coalesce(json_agg(json_build_object('ma', t.ma, 'ho_ten', t.ho_ten, 'gen', t.gen, 'nha', t.nha, 'diem', k.diem, 'so_dung', k.so_dung, 'tong', k.tong, 'nop_luc', k.nop_luc, 'tu_dong', k.tu_dong) order by k.diem desc nulls last, t.ho_ten), '[]')
      from public.thanh_vien t left join tot k on k.thanh_vien_id = t.id where t.id in (select id from dt) or k.id is not null),
    'cau', (select coalesce(json_agg(json_build_object('thu_tu', c.thu_tu, 'noi_dung', c.noi_dung, 'lua_chon', c.lua_chon, 'hinh', c.hinh, 'dung', a.dung,
        'dem', (select coalesce(jsonb_object_agg(v.chon, v.n), '{}') from (select k.tra_loi ->> c.id::text chon, count(*) n from tot k where k.tra_loi ? c.id::text group by 1) v)) order by c.thu_tu), '[]')
      from public.cau_hoi c left join public.dap_an a on a.cau_hoi_id = c.id where c.bai_id = p_bai)
  ) into kq;
  return kq;
end $$;

/* ---------- Điểm nhóm theo buổi ----------
   Chỉ tính buổi đã đóng và tính chuyên cần. Mỗi nhà tính trên thành viên Junior, Senior và chưa ghi cấp; Ban cố vấn không tính.
   Chuyên cần 60 điểm: đúng giờ 1, trễ 0,5, vắng 0; vắng có phép không tính vào mẫu số.
   Test đầu giờ 40 điểm: điểm trung bình (thang 10) của người có mặt; có mặt mà không làm tính 0.
   Buổi không có test đầu giờ: điểm chuyên cần quy về thang 100. */
create function public.diem_nhom(p_tu timestamptz, p_den timestamptz)
returns table (buoi_id uuid, bat_dau timestamptz, nha text, so_nguoi int, dung int, tre int, phep int, vang int, co_test boolean, so_lam int, tb_test numeric, diem_cc numeric, diem_test numeric, tong numeric)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if noi_bo.toi() is null then raise exception 'Chưa đăng nhập'; end if;
  perform noi_bo.cham_qua_han(null);
  return query
  with b as (
    select x.id, x.bat_dau from public.buoi x
    where x.tinh_chuyen_can and x.dong and x.bat_dau >= p_tu and x.bat_dau <= least(p_den, now())
  ), dd as (
    select d.buoi_id, d.thanh_vien_id, d.trang_thai, t.nha
    from noi_bo.dong_diem_danh(p_tu, least(p_den, now())) d
    join b on b.id = d.buoi_id
    join public.thanh_vien t on t.id = d.thanh_vien_id
    where t.nha is not null and t.cap is distinct from 'Ban cố vấn'
  ), bt as (
    select x.id, x.buoi_id from public.bai_test x join b on b.id = x.buoi_id where x.trang_thai = 'mo'
  ), dt as (
    -- Mỗi người có mặt: lần làm cao nhất của từng bài đầu giờ trong buổi, rồi lấy trung bình.
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
revoke all on function public.diem_nhom(timestamptz, timestamptz) from public, anon;
grant execute on function public.diem_nhom(timestamptz, timestamptz) to authenticated;
