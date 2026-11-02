-- Mỗi ngày chỉ một lịch tuần đã gửi, tránh hai người cùng gửi rồi sinh hai buổi điểm danh. Chương trình đặc biệt không bị giới hạn.
create function noi_bo.chan_lich_trung() returns trigger language plpgsql set search_path = '' as $$
declare ten_cu text;
begin
  if new.trang_thai = 'da_gui' and new.loai = 'tuan' and new.ngay is not null then
    select coalesce(x.nguoi_tao_ten, 'một thành viên') into ten_cu from public.lich x
    where x.trang_thai = 'da_gui' and x.loai = 'tuan' and x.ngay = new.ngay and x.id <> new.id limit 1;
    if found then raise exception 'Ngày % đã có lịch tuần do % gửi. Mở lịch đó trong Kho lịch để sửa, không gửi thêm lịch mới.', to_char(new.ngay, 'DD/MM/YYYY'), ten_cu; end if;
  end if;
  return new;
end $$;
create trigger chan_lich_trung before insert or update on public.lich for each row execute function noi_bo.chan_lich_trung();
