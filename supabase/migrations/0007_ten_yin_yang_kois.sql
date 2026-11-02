-- Anh Long chốt 02/11/2026: tên nhà viết thống nhất là Yin-Yang Kois.
alter table public.thanh_vien drop constraint thanh_vien_nha_check;
update public.thanh_vien set nha = 'Yin-Yang Kois' where nha = 'YinYang Kois';
update public.buoi set nhom_truc = 'Yin-Yang Kois' where nhom_truc = 'YinYang Kois';
alter table public.thanh_vien add constraint thanh_vien_nha_check check (nha in ('Seiryu','Suzaku','Byakko','Genbu','Kirin','Yin-Yang Kois'));
create or replace function noi_bo.ten_nha(p_khoa text) returns text language sql immutable set search_path = '' as $$
  select case p_khoa when 'seiryu' then 'Seiryu' when 'suzaku' then 'Suzaku' when 'byakko' then 'Byakko'
    when 'genbu' then 'Genbu' when 'kirin' then 'Kirin' when 'koi' then 'Yin-Yang Kois' end
$$;
create or replace function noi_bo.nhan_thuoc(p text) returns text language sql immutable set search_path = '' as $$
  select case when p = 'bcv' then 'Cố vấn' when p = 'khach' then 'Khách mời'
    when noi_bo.ten_nha(p) is not null then 'Nhóm ' || noi_bo.ten_nha(p) else nullif(p, '') end
$$;
