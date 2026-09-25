from pathlib import Path
import re

root = Path(r"F:\first!!!")
source = (root / "foundation-letter.html").read_text(encoding="utf-8")

replacements = {
    "麦英基金会泊然海洋馆资产调查委托": "麦英基金会调查感谢信",
    "调查委托｜麦英基金会": "基金会感谢信｜麦英基金会",
    "FOUNDATION CORRESPONDENCE": "FOUNDATION APPRECIATION LETTER",
    "您收到一封基金会来信": "您收到一封基金会感谢信",
    "请点击信封中央的基金会标志开启委托文件": "请点击信封中央的基金会标志查看感谢信",
    "打开麦英基金会来信": "打开麦英基金会感谢信",
    "调查员委任函": "调查致谢函",
    "<span>CONFIDENTIAL</span>": "<span>APPRECIATION</span>",
    "点击信封开启调查委托": "点击信封查看感谢信",
    "麦英基金会 · 调查员专用入口 · 未经授权请勿转发": "麦英基金会 · 调查感谢信",
}
for old, new in replacements.items():
    source = source.replace(old, new)

letter_copy = '''<div class="letter-copy">
          <p class="salutation">致调查员：</p>
          <p>感谢您为泊然海洋馆调查工作付出的时间与努力，正式感谢信内容将在此补充。</p>
          <div class="signature">
            <strong>麦英基金会资产调查组</strong>
            <small>项目资金与伦理风险审查办公室</small>
          </div>
        </div>
        <div class="letter-actions">'''

source, count = re.subn(
    r'<div class="letter-copy">.*?<div class="letter-actions">',
    letter_copy,
    source,
    count=1,
    flags=re.S,
)
if count != 1:
    raise RuntimeError("Could not replace letter content")

(root / "foundation-thanks.html").write_text(source, encoding="utf-8")
print(root / "foundation-thanks.html")
