"""Chuyển CSV 24 câu lịch Giáng sinh sang JSON cho app.

Cách dùng:
  python -I lich_24_o.py [đường_dẫn_csv]
  python -I lich_24_o.py --kiem     (tự kiểm, không đụng tệp thật)
"""
import csv
import json
import os
import shutil
import sys
import tempfile

CSV_MAC_DINH = (r"K:\CLB NGOẠI KHOA\KẾ HOẠCH NĂM 2026\KẾ HOẠCH NỘI BỘ"
                r"\TAI_LIEU_APP_THANH_VIEN\GIAO_DIEN_GIANG_SINH_2026-11-25"
                r"\LICH_24_O\MAU_24_CAU.csv")
JSON_RA = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                       "..", "du-lieu", "lich-24-o.json")
COT = ["o_ngay", "van_de_128", "cau_hoi", "a", "b", "c", "d", "dap_an",
       "giai_thich", "nguon", "nguoi_soan", "nguoi_duyet"]


def doc_csv(duong_dan):
    # utf-8-sig để bỏ BOM mà Excel thêm vào
    with open(duong_dan, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def kiem_tra(rows):
    """Trả về (danh sách câu, lỗi, cảnh báo). Số dòng là dòng Excel (tiêu đề là dòng 1)."""
    cau, loi, canh = [], [], []
    da_co = {}
    for so_dong, dong in enumerate(rows, start=2):
        r = {(k or "").strip(): (v or "").strip() for k, v in dong.items() if k}
        if not r.get("cau_hoi"):
            continue  # dòng chưa có câu hỏi: bỏ qua
        loi_dong = []
        o_txt = r.get("o_ngay", "")
        o = None
        try:
            o = int(o_txt)
            if not 1 <= o <= 24:
                loi_dong.append(f"o_ngay {o} ngoài 1..24")
            elif o in da_co:
                loi_dong.append(f"o_ngay {o} trùng với dòng {da_co[o]}")
        except ValueError:
            loi_dong.append(f"o_ngay '{o_txt}' không phải số nguyên")
        for k in "abcd":
            if not r.get(k):
                loi_dong.append(f"thiếu đáp án {k}")
        dap = r.get("dap_an", "").lower()
        if dap not in ("a", "b", "c", "d"):
            loi_dong.append(f"dap_an '{r.get('dap_an', '')}' phải là a, b, c hoặc d")
        if not r.get("giai_thich"):
            loi_dong.append("thiếu giai_thich")
        if loi_dong:
            loi += [f"dòng {so_dong}: {x}" for x in loi_dong]
            continue
        da_co[o] = so_dong
        if len(r["cau_hoi"].split()) > 45:
            canh.append(f"dòng {so_dong}: cau_hoi trên 45 từ")
        if len(r["giai_thich"].split()) > 60:
            canh.append(f"dòng {so_dong}: giai_thich trên 60 từ")
        cau.append({
            "o": o,
            "cau_hoi": r["cau_hoi"],
            "lua_chon": [r["a"], r["b"], r["c"], r["d"]],
            "dung": "abcd".index(dap),
            "giai_thich": r["giai_thich"],
            "nguon": r.get("nguon", ""),
        })
    cau.sort(key=lambda c: c["o"])
    return cau, loi, canh


def chuyen(duong_csv, duong_json):
    """Trả về mã thoát: 0 nếu xong hoặc không có câu, 1 nếu có lỗi (không ghi gì)."""
    try:
        rows = doc_csv(duong_csv)
    except FileNotFoundError:
        print(f"Không tìm thấy tệp: {duong_csv}")
        return 1
    cau, loi, canh = kiem_tra(rows)
    for x in canh:
        print("CẢNH BÁO:", x)
    if loi:
        for x in loi:
            print("LỖI:", x)
        print(f"Có {len(loi)} lỗi. Không ghi tệp nào.")
        return 1
    if not cau:
        print("Chưa có câu hỏi nào (cột cau_hoi đang trống). Không ghi tệp nào.")
        return 0
    os.makedirs(os.path.dirname(os.path.abspath(duong_json)), exist_ok=True)
    with open(duong_json, "w", encoding="utf-8") as f:
        json.dump({"cau": cau}, f, ensure_ascii=False, indent=1)
    print(f"Đã ghi {len(cau)} câu vào {duong_json}")
    return 0


def kiem():
    """Tự kiểm: dùng thư mục tạm, không đụng tệp thật."""
    tmp = tempfile.mkdtemp()
    try:
        def viet_csv(ten, dong):
            p = os.path.join(tmp, ten)
            with open(p, "w", encoding="utf-8-sig", newline="") as f:
                w = csv.writer(f)
                w.writerow(COT)
                for d in dong:
                    w.writerow(d)
            return p

        tot = ["1", "NB-01", "Câu một?", "x1", "x2", "x3", "x4", " B ", "Giải thích 1", "Nguồn 1", "", ""]
        tot2 = ["2", "", "Câu hai?", "y1", "y2", "y3", "y4", "d", "Giải thích 2", "", "", ""]
        trong = ["3", "", "", "", "", "", "", "", "", "", "", ""]
        json_ra = os.path.join(tmp, "out.json")

        p = viet_csv("ok.csv", [tot2, trong, tot])
        assert chuyen(p, json_ra) == 0
        with open(json_ra, encoding="utf-8") as f:
            du = json.load(f)
        assert [c["o"] for c in du["cau"]] == [1, 2], du
        assert du["cau"][0]["dung"] == 1 and du["cau"][1]["dung"] == 3
        assert du["cau"][0]["lua_chon"] == ["x1", "x2", "x3", "x4"]
        assert set(du["cau"][0]) == {"o", "cau_hoi", "lua_chon", "dung", "giai_thich", "nguon"}

        # đáp án sai phải bị từ chối, không ghi JSON
        json_loi = os.path.join(tmp, "loi.json")
        bad = ["5", "", "Câu sai?", "a", "b", "c", "d", "e", "Giải thích", "", "", ""]
        p2 = viet_csv("loi.csv", [bad])
        assert chuyen(p2, json_loi) == 1
        assert not os.path.exists(json_loi)

        # không có câu hỏi nào: không tạo JSON rỗng
        json_trong = os.path.join(tmp, "trong.json")
        p3 = viet_csv("trong.csv", [trong])
        assert chuyen(p3, json_trong) == 0
        assert not os.path.exists(json_trong)
        print("KIỂM OK")
        return 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--kiem":
        sys.exit(kiem())
    duong = sys.argv[1] if len(sys.argv) > 1 else CSV_MAC_DINH
    sys.exit(chuyen(duong, JSON_RA))
