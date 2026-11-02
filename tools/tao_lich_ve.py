"""Tạo js/lich-ve.js bằng cách trích nguyên văn bộ vẽ ảnh từ app soạn lịch cũ, để ảnh lịch giữ đúng mẫu đã duyệt.

Dùng: python -I tools/tao_lich_ve.py <đường dẫn src/index.html của app soạn lịch> js/lich-ve.js
Không sửa tay js/lich-ve.js. Muốn đổi mẫu ảnh thì sửa nguồn rồi chạy lại.
"""
import sys

# Các đoạn lấy từ nguồn, tính theo dòng bắt đầu và dòng kết thúc (không gồm dòng kết thúc).
MOC = [
    ('/*! QR Code Generator', '  /* ---------- Constants'),
    ('  /* ---------- Constants', '  /* ---------- Small helpers'),
    ('  /* ---------- Small helpers', '  /* ---------- State ----------'),
    ('  var LIMITS = {', '  function serial() {'),
    ('  /* ---------- Images and fonts', '  window.__lichChecks'),
    ("  var XLSX_MIME =", '  /* --- what goes into the file'),
    ('  /* --- what goes into the file', '  /* plain-text body of the e-mail */'),
]
DUOI = """
const LINK_CHU = 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,600;1,8..60,400&display=swap';
let daNap = null;
/** Nạp phông chữ của ảnh và các hình mascot, chỉ khi mở tới phần lịch. */
function napTaiNguyen() {
  if (daNap) return daNap;
  if (!document.querySelector('link[data-chu-lich]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = LINK_CHU; l.setAttribute('data-chu-lich', '');
    document.head.append(l);
  }
  daNap = Promise.all([loadFonts(), loadImg('logo', 'img/logo.webp')].concat(GROUPS.map(function (g) { return loadImg(g, 'img/' + g + '.webp'); })))
    .then(function () { inkCache = {}; });
  return daNap;
}
function tenTep(st) {
  var d = st.ngay || 'chua-co-ngay', name = slug(THEMES[st.nhom].name) || st.nhom;
  var head = st.mau === 'dacbiet' ? (slug(st.tenCT) || 'Chuong-trinh-dac-biet') : 'Lich-sinh-hoat-tuan';
  return head + '_' + d + '_' + name + (st.kho === 'story' ? '_story' : '');
}
function duLieu(st) {
  return { v: 1, mau: st.mau, kho: st.kho, tenCT: st.tenCT, phuCT: st.phuCT, moTa: st.moTa, qrLink: st.qrLink, qrNote: st.qrNote,
    nhom: st.nhom, ngay: st.ngay, gioBD: st.gioBD, gioKT: st.gioKT, dd1: st.dd1, dd2: st.dd2, chuTri: st.chuTri, dieuHanh: st.dieuHanh,
    rows: st.rows.map(function (r) { return { t1: r.t1, t2: r.t2, title: r.title, who: r.who, org: r.org }; }) };
}
export { GROUPS, THEMES, ORGS, normalize, drawPoster, checks, fmt, weekday, dmy, toMin, parseWho, orgText, rid, nextSunday, sortRowsOf, itemsOf, summaryOf, buildXlsx, napTaiNguyen, tenTep, duLieu };
function sortRowsOf(rows) { rows.sort(function (p, q) { var x = toMin(p.t1), y = toMin(q.t1); if (x === null) return 1; if (y === null) return -1; return x - y; }); }
"""


def main():
    with open(sys.argv[1], encoding='utf-8') as f:
        dong = f.read().split('\n')

    def tim(dau, tu=0):
        for i in range(tu, len(dong)):
            if dong[i].startswith(dau) or dong[i].lstrip().startswith(dau.strip()) and dau.startswith('/*!'):
                return i
        raise SystemExit('Không thấy mốc: ' + dau)

    ra = ['// Sinh tự động bởi tools/tao_lich_ve.py từ app soạn lịch sinh hoạt. Không sửa tay.']
    for dau, cuoi in MOC:
        a = tim(dau)
        b = tim(cuoi, a + 1)
        ra.extend(x for x in dong[a:b] if not x.startswith('  function $(id)'))
    chu = '\n'.join(ra)
    cu = "['Người làm lịch (email)', email]"
    if cu not in chu:
        raise SystemExit('Không thấy dòng người làm lịch trong bảng Excel')
    chu = chu.replace(cu, "['Người làm lịch', email]")
    with open(sys.argv[2], 'w', encoding='utf-8', newline='\n') as f:
        f.write(chu + '\n' + DUOI)
    print(len(chu), 'ký tự')


if __name__ == '__main__':
    main()
