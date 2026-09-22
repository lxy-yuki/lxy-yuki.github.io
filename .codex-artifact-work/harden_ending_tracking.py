from pathlib import Path
import re

ROOT=Path(r"F:\first!!!")
for path in ROOT.glob("*.html"):
    text=path.read_text(encoding="utf-8",errors="replace")
    new=re.sub(
        r'<script src="ending-state\.js" data-clue="([^"]+)"></script>',
        lambda m: '<script src="ending-state.js"></script><script>EndingState.markClue("'+m.group(1)+'");</script>',
        text,
    )
    new=re.sub(
        r'<script src="ending-state\.js" data-account="([^"]+)"></script>',
        lambda m: '<script src="ending-state.js"></script><script>EndingState.markAccount("'+m.group(1)+'");</script>',
        new,
    )
    if new!=text:
        path.write_text(new,encoding="utf-8")
        print(path.name)
