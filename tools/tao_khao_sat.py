# -*- coding: utf-8 -*-
"""Tạo lệnh SQL nạp một khảo sát (migration 0021) từ tệp JSON trong supabase/du_lieu/.

    python tools/tao_khao_sat.py supabase/du_lieu/khao_sat_bm01_qltg.json > khao_sat.sql.local

Lệnh tạo ra chỉ thêm khảo sát mới; mã khảo sát đã có thì dừng (ràng buộc unique), không ghi đè câu trả lời cũ.
Kiểm trước khi tạo: điều kiện chỉ trỏ về câu đứng trước, câu chọn có ít nhất hai ý, ý của điều kiện có trong câu được trỏ.
"""
import io
import json
import sys

LOAI = {"chon", "nhieu", "thang5", "chu", "doan"}


def kiem(d):
    cau = d["cau"]
    assert cau, "Khảo sát chưa có câu nào"
    for i, c in enumerate(cau, 1):
        assert c["loai"] in LOAI, (i, c["loai"])
        if c["loai"] in ("chon", "nhieu"):
            assert len(c.get("lua_chon") or []) >= 2, (i, "cần ít nhất hai ý")
            assert len(set(c["lua_chon"])) == len(c["lua_chon"]), (i, "ý bị trùng")
        dk = c.get("dieu_kien")
        if dk:
            assert 1 <= dk["cau"] < i, (i, "điều kiện phải trỏ về câu đứng trước")
            goc = cau[dk["cau"] - 1]
            if "trong" in dk:
                assert goc["loai"] == "chon", (i, "điều kiện 'trong' chỉ dùng với câu chọn một ý")
                assert set(dk["trong"]) <= set(goc["lua_chon"]), (i, "ý của điều kiện không có trong câu được trỏ")
            else:
                assert dk.get("co") is True, (i, "điều kiện cần 'trong' hoặc 'co': true")


def lit(v):
    """Chuỗi SQL dùng dollar quoting, không phải thoát dấu nháy."""
    if v is None:
        return "null"
    s = v if isinstance(v, str) else json.dumps(v, ensure_ascii=False)
    assert "$ks$" not in s
    return "$ks$" + s + "$ks$"


def sql(d):
    kiem(d)
    dong = []
    for i, c in enumerate(d["cau"], 1):
        dong.append("(%d, %s, %s, %s, %s, %s::jsonb, %s, %s::jsonb, %s, %s::jsonb)" % (
            i, lit(c.get("phan")), lit(c["noi_dung"]), lit(c.get("ghi_chu")), lit(c["loai"]),
            lit(c.get("lua_chon")), c.get("toi_da") or "null", lit(c.get("nhan_thang")),
            "true" if c.get("bat_buoc", True) else "false", lit(c.get("dieu_kien"))))
    return (
        "with k as (\n"
        "  insert into public.khao_sat (ma, ten, mo_ta, loi_ket, an_danh, mo, han, doi_tuong)\n"
        "  values (%s, %s, %s, %s, %s, %s, %s, %s::text[])\n"
        "  returning id\n"
        ")\n"
        "insert into public.khao_sat_cau (khao_sat_id, thu_tu, phan, noi_dung, ghi_chu, loai, lua_chon, toi_da, nhan_thang, bat_buoc, dieu_kien)\n"
        "select k.id, c.* from k, (values\n  %s\n) as c (thu_tu, phan, noi_dung, ghi_chu, loai, lua_chon, toi_da, nhan_thang, bat_buoc, dieu_kien);\n"
    ) % (lit(d["ma"]), lit(d["ten"]), lit(d.get("mo_ta")), lit(d.get("loi_ket")),
         "true" if d.get("an_danh", True) else "false", "true" if d.get("mo") else "false",
         (lit(d["han"]) + "::timestamptz") if d.get("han") else "null",
         lit("{" + ",".join('"%s"' % x for x in d.get("doi_tuong", ["Junior", "Senior"])) + "}"),
         ",\n  ".join(dong))


if __name__ == "__main__":
    du_lieu = json.load(io.open(sys.argv[1], encoding="utf-8"))
    sys.stdout.reconfigure(encoding="utf-8")
    print(sql(du_lieu))
