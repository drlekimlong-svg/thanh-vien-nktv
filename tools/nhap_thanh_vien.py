"""Tạo câu lệnh SQL nhập danh sách thành viên từ tệp CSV của Ban nhân sự.

Dùng: python -I tools/nhap_thanh_vien.py <tep.csv> <tep_ra.sql>
Mã thành viên cấp theo thứ tự dòng trong tệp (NKTV-001, NKTV-002…). Mã QR do cơ sở dữ liệu tự sinh.
Chạy lại an toàn: người đã có mã giữ nguyên Mã QR và tài khoản. Tệp SQL chứa họ tên nên không đưa lên kho.
"""
import csv
import sys

NHA = {'Seiryu', 'Suzaku', 'Byakko', 'Genbu', 'Kirin', 'YinYang Kois'}
CAP = {'Junior', 'Senior', 'Ban cố vấn'}


def sql(v):
    return 'null' if v in (None, '') else "'" + str(v).replace("'", "''") + "'"


def doc(duong_dan):
    with open(duong_dan, encoding='utf-8-sig', newline='') as f:
        dong = list(csv.reader(f))
    dau = next(i for i, r in enumerate(dong) if len(r) > 1 and r[1].strip() == 'Họ và tên')
    ra = []
    for r in dong[dau + 1:]:
        r = (r + [''] * 8)[:8]
        ten = ' '.join(r[1].split())
        if not ten:
            continue
        nha, cap, hd = r[3].strip(), r[4].strip(), r[5].strip()
        if nha and nha not in NHA:
            raise SystemExit(f'Nhà lạ ở dòng của {ten}: {nha}')
        if cap and cap not in CAP:
            raise SystemExit(f'Cấp lạ ở dòng của {ten}: {cap}')
        if hd not in ('Có', 'Không'):
            raise SystemExit(f'Cột Còn hoạt động lạ ở dòng của {ten}: {hd}')
        ra.append(dict(ten=ten, gen=r[2].strip(), nha=nha, cap=cap, hd=hd == 'Có', ghi=r[6].strip()))
    return ra


def main():
    ds = doc(sys.argv[1])
    gia_tri = [
        f"('NKTV-{i:03d}',{sql(t['ten'])},{t['gen'] or 'null'},{sql(t['nha'])},{sql(t['cap'])},{str(t['hd']).lower()},{sql(t['ghi'])})"
        for i, t in enumerate(ds, 1)
    ]
    with open(sys.argv[2], 'w', encoding='utf-8') as f:
        f.write('insert into public.thanh_vien (ma, ho_ten, gen, nha, cap, hoat_dong, ghi_chu) values\n')
        f.write(',\n'.join(gia_tri))
        f.write('\non conflict (ma) do update set ho_ten = excluded.ho_ten, gen = excluded.gen, nha = excluded.nha, '
                'cap = excluded.cap, hoat_dong = excluded.hoat_dong, ghi_chu = excluded.ghi_chu;\n')
    print(len(ds), 'thành viên,', sum(t['hd'] for t in ds), 'còn hoạt động')


if __name__ == '__main__':
    main()
