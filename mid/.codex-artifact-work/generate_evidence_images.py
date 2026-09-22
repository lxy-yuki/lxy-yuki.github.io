"""Render four deterministic, fictional in-game evidence sheets as PNG files."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = Path(r"F:\first!!!\images2\evidence")
OUT.mkdir(parents=True, exist_ok=True)
W, H = 1600, 2100
PAPER = (252, 251, 247)
INK = (35, 48, 58)
MUTED = (94, 109, 118)
LINE = (194, 204, 207)
PALE = (237, 243, 243)
RED = (165, 55, 51)
TEAL = (33, 93, 103)
FONT = r"C:\Windows\Fonts\msyh.ttc"
BOLD = r"C:\Windows\Fonts\msyhbd.ttc"
KAI = r"C:\Windows\Fonts\simkai.ttf"

def font(size, bold=False, kai=False):
    return ImageFont.truetype(KAI if kai else BOLD if bold else FONT, size)

F_TITLE = font(51, True)
F_H2 = font(34, True)
F_BODY = font(28)
F_BODY_B = font(28, True)
F_SMALL = font(23)
F_TINY = font(20)
F_MONO = font(25)

def text(draw, xy, value, f=F_BODY, fill=INK, anchor=None):
    draw.text(xy, value, font=f, fill=fill, anchor=anchor)

def line(draw, xy, fill=LINE, width=2):
    draw.line(xy, fill=fill, width=width)

def paragraph(draw, value, x, y, max_width, f=F_BODY, leading=46, fill=INK):
    for explicit in value.split("\n"):
        current = ""
        for ch in explicit:
            if current and draw.textlength(current + ch, font=f) > max_width:
                text(draw, (x, y), current, f, fill)
                y += leading
                current = ch
            else:
                current += ch
        if current:
            text(draw, (x, y), current, f, fill)
            y += leading
        elif not explicit:
            y += leading
    return y

def base(tag, title, sub, document_id):
    background = Image.new("RGB", (W, H), (226, 231, 231))
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((84, 85, 1530, 2064), radius=16, fill=(22, 33, 42, 62))
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    background = Image.alpha_composite(background.convert("RGBA"), shadow)
    d = ImageDraw.Draw(background)
    d.rounded_rectangle((70, 55, 1530, 2035), radius=12, fill=PAPER, outline=(215, 218, 214), width=2)
    d.rectangle((70, 55, 1530, 68), fill=TEAL)
    text(d, (160, 112), tag, F_SMALL, TEAL)
    text(d, (1440, 112), document_id, F_SMALL, MUTED, anchor="ra")
    text(d, (160, 177), title, F_TITLE)
    text(d, (160, 254), sub, F_SMALL, MUTED)
    line(d, (160, 318, 1440, 318), TEAL, 4)
    text(d, (160, 1946), "资料留存影印件｜相关账户仅显示末四位｜B市海洋馆案件资料", F_TINY, MUTED)
    text(d, (1440, 1946), document_id, F_TINY, MUTED, anchor="ra")
    return background, d

def box(d, bounds, fill=(255, 255, 255), outline=LINE, radius=10):
    d.rounded_rectangle(bounds, radius=radius, fill=fill, outline=outline, width=2)

def label_value(d, x, y, label, value, value_font=F_BODY_B):
    text(d, (x, y), label, F_SMALL, MUTED)
    text(d, (x, y + 36), value, value_font, INK)

def red_marker(d, bounds):
    d.rounded_rectangle(bounds, radius=8, outline=RED, width=5)

def save(img, filename):
    img.convert("RGB").save(OUT / filename, "PNG", optimize=True)
    print(OUT / filename)

# 01 — contract and premature acceptance stamp.
img, d = base("附件 01 / 合同影印", "低温饵料配送及后场设备维保合同", "泊然海洋馆运营管理有限公司 · 财务档案扫描页", "BR-CG-241127")
box(d, (160, 365, 1440, 680), PALE)
label_value(d, 200, 397, "合同编号", "BR-CG-241127")
label_value(d, 805, 397, "签订日期", "2024 年 11 月 27 日")
label_value(d, 200, 525, "甲方", "泊然海洋馆运营管理有限公司")
label_value(d, 805, 525, "乙方", "B 市蓝鲸贸易有限公司")
text(d, (160, 730), "一、项目与金额", F_H2)
paragraph(d, "甲方向乙方采购低温饵料配送及后场设备维保服务。合同总价人民币壹佰捌拾陆万元整（¥1,860,000.00），分三批验收并付款。", 160, 796, 1275)
text(d, (160, 930), "二、验收与付款条件", F_H2)
paragraph(d, "每批验收应附对应的冷链车辆入馆登记和称重单；验收经办人核对数量、签字并填写验收日期后，财务部门方可付款。", 160, 996, 1275)
box(d, (160, 1130, 1440, 1675), (255, 255, 255))
text(d, (194, 1162), "附件 A-3｜分批验收栏（影印件）", F_BODY_B, TEAL)
line(d, (194, 1222, 1406, 1222))
label_value(d, 198, 1260, "乙方联系人", "________________")
label_value(d, 800, 1260, "联系电话", "________________")
label_value(d, 198, 1390, "验收批次", "________________")
label_value(d, 800, 1390, "验收日期", "________________")
label_value(d, 198, 1520, "经办签名", "________________")
d.ellipse((1110, 1455, 1360, 1660), outline=(180, 74, 65), width=7)
text(d, (1235, 1510), "泊然海洋馆", font(24, True), (180, 74, 65), anchor="ma")
text(d, (1235, 1550), "验 收 专 用", font(22, True), (180, 74, 65), anchor="ma")
red_marker(d, (188, 1248, 723, 1357))
red_marker(d, (1080, 1426, 1392, 1680))
text(d, (160, 1746), "附注：影印页中的联系人、验收批次和验收日期均未填写。", F_SMALL, MUTED)
save(img, "evidence-01-contract.png")

# 02 — three payment receipts from the same payer and contract.
img, d = base("附件 02 / 网银回单", "泊然海洋馆企业网银付款回单", "财务对账邮件所附导出件 · 金额单位：人民币元", "BANK-EXTRACT-03")
receipts = [
    ("01 / 03", "2024.11.28  10:42", "780,000.00", "0831"),
    ("02 / 03", "2024.12.05  14:18", "460,000.00", "2194"),
    ("03 / 03", "2024.12.16  09:30", "620,000.00", "6047"),
]
for idx, (n, date, amount, tail) in enumerate(receipts):
    y = 375 + idx * 455
    box(d, (160, y, 1440, y + 405))
    d.rectangle((160, y, 1440, y + 58), fill=(230, 239, 239))
    text(d, (190, y + 13), "B 市商业银行 · 企业网银电子回单", F_SMALL, TEAL)
    text(d, (1410, y + 13), n, F_SMALL, MUTED, anchor="ra")
    label_value(d, 190, y + 88, "交易时间", date)
    label_value(d, 790, y + 88, "金额", "¥" + amount, font(36, True))
    line(d, (190, y + 192, 1410, y + 192))
    label_value(d, 190, y + 215, "付款账户", "泊然海洋馆运营管理有限公司  ****3186")
    label_value(d, 190, y + 305, "收款账户", "B 市蓝鲸贸易有限公司  ****7429")
    text(d, (790, y + 317), "用途：BR-CG-241127", F_SMALL, INK)
    text(d, (1410, y + 365), "流水号末四位：" + tail, F_TINY, MUTED, anchor="ra")
box(d, (160, 1770, 1440, 1905), (232, 241, 239), TEAL)
text(d, (198, 1804), "本组回单三笔合计", F_BODY, MUTED)
text(d, (1400, 1798), "¥1,860,000.00", font(43, True), TEAL, anchor="ra")
text(d, (198, 1862), "三笔回单用途均指向同一合同编号 BR-CG-241127。", F_SMALL, INK)
save(img, "evidence-02-bank-receipts.png")

# 03 — supplier's self-reported reconciliation attachment.
img, d = base("附件 03 / 对账邮件", "蓝鲸贸易项目往来对账附件", "邮件导出预览 · 对账期间：2024 年 11—12 月", "LJ-FIN-241218")
box(d, (160, 360, 1440, 656), (245, 248, 248))
label_value(d, 190, 392, "发件人", "蓝鲸贸易 · 项目结算组")
label_value(d, 820, 392, "抄送", "钱蔚东 · 合作项目")
label_value(d, 190, 502, "主题", "【对账】BR-CG-241127 项目往来款确认")
text(d, (190, 608), "发送时间：2024.12.18 18:26", F_SMALL, MUTED)
text(d, (160, 706), "附件：资金往来明细（蓝鲸贸易自行出具）", F_H2)
xs = [160, 376, 588, 802, 1014, 1440]
ys = [775, 859, 1040, 1221, 1402]
d.rectangle((160, ys[0], 1440, ys[1]), fill=(227, 238, 238), outline=LINE, width=2)
headers = ["海洋馆付款日", "蓝鲸入账", "蓝鲸转款日", "转出金额", "转款收款方 / 摘要"]
for i, head in enumerate(headers):
    text(d, (xs[i] + 12, 795), head, F_SMALL, TEAL)
for i in range(1, len(xs) - 1):
    line(d, (xs[i], ys[0], xs[i], ys[-1]))
rows = [
    ("2024.11.28", "¥780,000", "2024.11.29", "¥742,000", "明通文旅管理有限公司 · 1062\n品牌渠道服务费"),
    ("2024.12.05", "¥460,000", "2024.12.06", "¥437,000", "明通文旅管理有限公司 · 1062\n品牌渠道服务费"),
    ("2024.12.16", "¥620,000", "2024.12.17", "¥589,000", "明通文旅管理有限公司 · 1062\n品牌渠道服务费"),
]
for ridx, row in enumerate(rows):
    top = ys[1] + ridx * 181
    d.rectangle((160, top, 1440, top + 181), outline=LINE, width=2)
    for cidx, value in enumerate(row):
        for j, part in enumerate(value.split("\n")):
            text(d, (xs[cidx] + 12, top + 31 + j * 46), part, F_SMALL if cidx == 4 else F_MONO, INK)
box(d, (160, 1460, 1440, 1615), PALE)
text(d, (190, 1492), "海洋馆付款合计", F_SMALL, MUTED)
text(d, (190, 1534), "¥1,860,000", F_BODY_B)
text(d, (642, 1492), "向明通转款合计", F_SMALL, MUTED)
text(d, (642, 1534), "¥1,768,000", F_BODY_B)
text(d, (1084, 1492), "比例", F_SMALL, MUTED)
text(d, (1084, 1534), "约 95.1%", F_BODY_B, RED)
text(d, (160, 1674), "附件说明", F_H2)
paragraph(d, "本附件仅为蓝鲸贸易发出的对账记录，不等同于银行原始回单。款项去向及用途须与银行调取记录和合同原件复核。", 160, 1736, 1260, F_SMALL, 42, MUTED)
save(img, "evidence-03-reconciliation.png")

# 04 — gate log and acceptance sheets with repeated signatures.
img, d = base("附件 04 / 后场登记", "冷链车入馆与分批验收核对页", "钱蔚东拍摄的后场登记摘页 · 原始门禁记录待核", "BR-OPS-241218")
text(d, (160, 367), "A. 冷链车入馆登记查询", F_H2)
box(d, (160, 426, 1440, 846))
cols = [160, 462, 766, 1100, 1440]
d.rectangle((160, 426, 1440, 507), fill=PALE, outline=LINE, width=2)
for i, h in enumerate(["合同验收日期", "车辆牌号", "入馆时间", "过磅重量"]):
    text(d, (cols[i] + 17, 450), h, F_SMALL, TEAL)
for i in range(1, 4):
    line(d, (cols[i], 426, cols[i], 846))
for ridx, date in enumerate(["2024.11.28", "2024.12.05", "2024.12.16"]):
    y = 507 + ridx * 113
    line(d, (160, y, 1440, y))
    text(d, (177, y + 33), date, F_BODY)
    for c in range(1, 4):
        text(d, (cols[c] + 17, y + 33), "未查询到", F_BODY, MUTED)
red_marker(d, (476, 520, 1422, 837))
text(d, (160, 905), "B. 三张验收单的字段摘录", F_H2)
box(d, (160, 964, 1440, 1604))
cols = [160, 415, 610, 840, 1070, 1440]
d.rectangle((160, 964, 1440, 1045), fill=PALE, outline=LINE, width=2)
for i, h in enumerate(["验收日期", "班次", "车牌号", "称重数", "经办签名"]):
    text(d, (cols[i] + 14, 988), h, F_SMALL, TEAL)
for i in range(1, 5):
    line(d, (cols[i], 964, cols[i], 1604))
for ridx, (date, shift) in enumerate([("2024.11.28", "早班"), ("2024.12.05", "中班"), ("2024.12.16", "夜班")]):
    y = 1045 + ridx * 186
    line(d, (160, y, 1440, y))
    text(d, (174, y + 61), date, F_BODY)
    text(d, (429, y + 61), shift, F_BODY)
    text(d, (654, y + 61), "—", F_BODY, MUTED)
    text(d, (889, y + 61), "—", F_BODY, MUTED)
    # Deliberately repeat the exact same pen stroke in each different shift.
    pts = [(1108, 112), (1145, 88), (1137, 133), (1189, 101), (1197, 136), (1246, 92), (1291, 119), (1328, 91)]
    d.line([(x, y + offset) for x, offset in pts], fill=(51, 72, 112), width=5, joint="curve")
red_marker(d, (620, 1062, 1060, 1588))
red_marker(d, (1084, 1062, 1420, 1588))
box(d, (160, 1653, 1440, 1840), (245, 248, 248))
text(d, (190, 1684), "核对备注", F_BODY_B, TEAL)
paragraph(d, "三张验收单分别写早、中、夜班，却没有车牌和称重数据；经办签名的笔迹形态完全相同。门岗是否存在手工补登，仍需查原始记录。", 190, 1730, 1190, F_SMALL, 42)
save(img, "evidence-04-gate-acceptance.png")
