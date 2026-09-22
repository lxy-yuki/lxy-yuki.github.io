from pathlib import Path

ROOT = Path(r"F:\first!!!")

clues = {
    "nightcord-1.html": "1",
    "police1.html": "2",
    "B-daily-1.html": "3",
    "Aquarium.html": "4",
    "ikari economy-1.html": "5",
    "ikari economy-2.html": "6",
    "B-daily-2.html": "7",
    "B-daily-3.html": "8",
    "B-daily-4.html": "9",
    "earthnews-1.html": "10",
    "entertainment-1.html": "11",
    "B-daily-5.html": "12",
    "ikari economy-3.html": "13",
    "xingrenwang.html": "14",
    "talk.html": "15",
    "bluemedia-1.html": "16",
    "B-daily-6.html": "17",
    "labor company-1.html": "19",
    "B-daily-8.html": "20",
    "B2025-JD-0718.html": "21",
    "B2025-JD-0717.html": "22",
}

accounts = {
    "socialaccount1.html": "chenshu",
    "socialaccount-yuan.html": "liyuan",
    "socialaccount-lz.html": "liuzhen",
    "socialaccount2.html": "zhaoyuhong",
    "socialaccount-zhangz.html": "zhangzhi",
    "socialaccount3.html": "qianweidong",
    "socialaccount-zw.html": "zhouwei",
}

def inject(filename: str, marker: str):
    path = ROOT / filename
    text = path.read_text(encoding="utf-8")
    if "ending-state.js" in text:
        print("exists", filename)
        return
    idx = text.lower().rfind("</body>")
    if idx < 0:
        raise RuntimeError(f"No </body> in {filename}")
    text = text[:idx] + marker + "\n" + text[idx:]
    path.write_text(text, encoding="utf-8")
    print("injected", filename)

for filename, clue_id in clues.items():
    inject(filename, f'<script src="ending-state.js" data-clue="{clue_id}"></script>')

for filename, account_id in accounts.items():
    inject(filename, f'<script src="ending-state.js" data-account="{account_id}"></script>')
