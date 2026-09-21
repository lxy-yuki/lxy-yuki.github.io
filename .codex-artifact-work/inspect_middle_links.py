from html.parser import HTMLParser
from pathlib import Path

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]; self.current=None
    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            href=dict(attrs).get('href','')
            self.current=[href,[]]
    def handle_data(self, data):
        if self.current is not None: self.current[1].append(data)
    def handle_endtag(self, tag):
        if tag=='a' and self.current is not None:
            href=' '.join(self.current[0].split())
            label=' '.join(''.join(self.current[1]).split())
            self.links.append((href,label)); self.current=None

root=Path(r'F:\first!!!\mid')
for p in sorted(root.glob('middle*.html')):
    pa=Parser(); pa.feed(p.read_text(encoding='utf-8',errors='replace'))
    useful=[x for x in pa.links if x[1] and '返回主页' not in x[1]]
    if useful: print(p.name, useful)
