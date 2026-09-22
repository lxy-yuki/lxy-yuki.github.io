from html.parser import HTMLParser
from pathlib import Path
import subprocess, tempfile

ROOT = Path(r"F:\first!!!")
NODE = r"C:\Users\施昊lty\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

class Scripts(HTMLParser):
    def __init__(self):
        super().__init__(); self.items=[]; self.current=None
    def handle_starttag(self, tag, attrs):
        if tag == "script" and not dict(attrs).get("src"):
            self.current=[]
    def handle_data(self, data):
        if self.current is not None: self.current.append(data)
    def handle_endtag(self, tag):
        if tag == "script" and self.current is not None:
            self.items.append("".join(self.current)); self.current=None

pages = [
    "maiyingfoundation.html", "ending-chat.html", "socialaccount1.html", "labor zhou.html",
    "ending-a.html", "ending-b.html", "ending-c.html", "ending-d.html", "ending-e.html",
]

for filename in pages:
    path=ROOT/filename
    assert path.exists(), filename
    parser=Scripts(); parser.feed(path.read_text(encoding="utf-8"))
    for i, code in enumerate(parser.items):
        with tempfile.NamedTemporaryFile("w",suffix=".js",delete=False,encoding="utf-8") as f:
            f.write(code); temp=f.name
        result=subprocess.run([NODE,"--check",temp],capture_output=True,text=True,encoding="utf-8")
        if result.returncode:
            raise AssertionError(f"{filename} script {i}: {result.stderr}")
    print("syntax",filename,len(parser.items))

clues = ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","19","20","21","22"]
combined="\n".join(p.read_text(encoding="utf-8",errors="replace") for p in ROOT.glob("*.html"))
for clue in clues:
    assert f'data-clue="{clue}"' in combined, clue
for account in ["chenshu","liyuan","liuzhen","zhaoyuhong","zhangzhi","qianweidong","zhouwei"]:
    assert f'data-account="{account}"' in combined, account
assert 'data-clue="18"' not in combined

state=(ROOT/"ending-state.js").read_text(encoding="utf-8")
assert all(f'"{x}"' in state for x in clues)
assert "hasEndingAccess" in state
assert "B市滨海路88号" in (ROOT/"labor zhou.html").read_text(encoding="utf-8")
print("verification passed")
