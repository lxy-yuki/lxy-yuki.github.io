from pathlib import Path
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

OUT = Path(r"F:\first!!!\outputs\陈树杏仁网账号文案与投放位置.docx")
OUT.parent.mkdir(parents=True, exist_ok=True)

doc = Document()
sec = doc.sections[0]
sec.page_width, sec.page_height = Cm(21), Cm(29.7)
sec.top_margin = Cm(1.9)
sec.bottom_margin = Cm(1.7)
sec.left_margin = sec.right_margin = Cm(2.2)
sec.header_distance = Cm(0.8)
sec.footer_distance = Cm(0.8)

def set_font(run, name='Microsoft YaHei', size=10.5, bold=False, color=None):
    run.font.name = name
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = RGBColor(*color) if color else RGBColor(0, 0, 0)
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.rFonts
    if rfonts is None:
        rfonts = OxmlElement('w:rFonts')
        rpr.insert(0, rfonts)
    rfonts.set(qn('w:eastAsia'), name)

normal = doc.styles['Normal']
normal.font.name = 'Microsoft YaHei'
normal.font.size = Pt(10)
normal.font.color.rgb = RGBColor(0, 0, 0)
normal.paragraph_format.space_after = Pt(5)
normal.paragraph_format.line_spacing = 1.28

for name, size, before, after in [('Title', 22, 0, 10), ('Heading 1', 16, 12, 7), ('Heading 2', 12.5, 10, 4), ('Heading 3', 11, 8, 3)]:
    s = doc.styles[name]
    s.font.name = 'Microsoft YaHei'
    s.font.size = Pt(size)
    s.font.bold = name != 'Title'
    s.font.color.rgb = RGBColor(0, 0, 0)
    s.paragraph_format.space_before = Pt(before)
    s.paragraph_format.space_after = Pt(after)
    s.paragraph_format.keep_with_next = True
    s.paragraph_format.line_spacing = 1.2

# Word's built-in Title style may carry a blue bottom rule through the theme.
for border in doc.styles['Title']._element.xpath('./w:pPr/w:pBdr'):
    border.getparent().remove(border)

meta_style = doc.styles.add_style('Placement', WD_STYLE_TYPE.PARAGRAPH)
meta_style.base_style = normal
meta_style.font.size = Pt(9)
meta_style.font.color.rgb = RGBColor(80, 86, 91)
meta_style.paragraph_format.space_after = Pt(5)
meta_style.paragraph_format.keep_with_next = True

note_style = doc.styles.add_style('Editor Note', WD_STYLE_TYPE.PARAGRAPH)
note_style.base_style = normal
note_style.font.size = Pt(9)
note_style.font.color.rgb = RGBColor(88, 95, 100)
note_style.paragraph_format.space_before = Pt(3)
note_style.paragraph_format.space_after = Pt(9)

def p(text, style=None):
    par = doc.add_paragraph(style=style)
    set_font(par.add_run(text), size=8.8 if style in ('Placement','Editor Note') else 10, color=(80,86,91) if style in ('Placement','Editor Note') else None)
    return par

def labelled(label, content, style=None):
    par = doc.add_paragraph(style=style)
    set_font(par.add_run(label), size=8.8 if style in ('Placement','Editor Note') else 10, bold=True, color=(80,86,91) if style in ('Placement','Editor Note') else None)
    set_font(par.add_run(content), size=8.8 if style in ('Placement','Editor Note') else 10, color=(80,86,91) if style in ('Placement','Editor Note') else None)
    return par

def heading(text, level=1):
    return doc.add_heading(text, level=level)

def entry(title, location, timing, copy, art=None, comments=None, editor=None):
    heading(title, 3)
    labelled('投放位置  ', location, 'Placement')
    labelled('可见时机  ', timing, 'Placement')
    labelled('玩家可见文案  ', copy)
    if art:
        labelled('配图文案  ', art, 'Editor Note')
    if comments:
        labelled('评论区  ', comments, 'Editor Note')
    if editor:
        labelled('制作标注  ', editor, 'Editor Note')

title = doc.add_paragraph(style='Title')
set_font(title.add_run('陈树杏仁网账号文案与投放位置'), size=22, bold=False)
p('供网页文案与关卡实现使用。每段均标明页面位置、玩家可见时机及是否属于制作说明；“玩家可见文案”可直接上屏，其余标注不进入游戏界面。')
p('本稿按账号页面默认的倒序动态编排。陈树本人撰写的内容止于 2025 年 7 月 16 日；末尾新增动态须在后期调查触发，发布者是会使用母亲账号的苹苹。')

heading('一 投放总览')
tbl = doc.add_table(rows=1, cols=3)
tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
tbl.style = 'Table Grid'
tbl.autofit = False
for cell, label in zip(tbl.rows[0].cells, ['入口或页面', '内容模块', '开放时机']):
    cell.text = label
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd'); shd.set(qn('w:fill'), 'E8EDF0'); tcPr.append(shd)
for row in [
    ('杏仁网搜“陈树”；基金会搜“陈树1999”', '账号简介与生前动态', '首次进入'),
    ('socialaccount1.html 的“我的文件”', '画作、便签、图卡及两处加密文件', '随账号开放；加密文件需线索'),
    ('劳而得员工页回接陈树账号', '工作合同与工作备忘', '取得工号后'),
    ('再次访问陈树账号', '“刚刚”发布的苹苹动态', '贾案落网后，玩家得知闭馆后仍有案件'),
]:
    cells = tbl.add_row().cells
    for c, value in zip(cells, row):
        c.text = value
        c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
for row in tbl.rows:
    for cell in row.cells:
        for par in cell.paragraphs:
            par.paragraph_format.space_after = Pt(2)
            for r in par.runs:
                set_font(r, size=9.2, bold=(row == tbl.rows[0]))
p('口径说明：陈树能听见，但不能说话；论坛里“聋哑保洁员”的说法是旁人的误认。苹苹出生于 2018 年 6 月 8 日。现有页面里的 2026 年母亲动态、2026 年病历日期及与主线无关的占位文件应由本稿替换。', 'Editor Note')
p('叙事边界：苹苹的沟通困难与就诊经历用于塑造人物及线索，不将疾病写成伤害行为的原因。后期事件由创伤、孤立与错误模仿推动，具体责任留给结局处理。', 'Editor Note')

heading('二 账号简介与首次可见动态')
entry('账号资料', 'socialaccount1.html 左侧资料栏与 #home 标题', '首次进入',
      '昵称：苹果树\n性别：女｜出生年份：1976\n简介：苹苹平安，其他都慢慢来。我听得见，只是说不出话。有事请给我发文字。',
      editor='账号搜索仍使用“陈树”；“陈树1999”仅属于基金会搜索框，不改成杏仁网用户名。')

posts = [
('动态 01 2025年7月16日 21时14分', '苹苹把我的工作牌藏进枕头底下，觉得这样我就不用上夜班了。我找了半天，她看着我笑。我写给她看：妈妈去把地擦干净就回来。她点了头，又把工作牌还给我。等这阵子忙完，带她去看看真正的大海。', '苹苹从床边探出半张脸，手里攥着一张反光的工作牌；不要露出工号。', None, '这是陈树本人最后一条公开动态。不要写任何晚于 2025 年 7 月 17 日的“母亲口吻”帖子。'),
('动态 02 2025年6月8日 19时06分', '苹苹七岁了。七支蜡烛，她吹到第三次才吹完，怪我买了太大的蛋糕。她说希望馆里的鱼每天都有饭吃。我希望她先好好吃饭、好好睡觉。生日快乐，我的小苹。', '七支蜡烛和手画的小丑鱼；生日年份可由“七岁”与日期推得。', None, '为“苹苹资料”文件夹密码 20180608 提供公平线索。'),
('动态 03 2025年5月20日 18时43分', '苹苹看见工作人员把小鱼倒进饵料桶，问我小鱼是不是很疼。我在手机上写：鱼有时候会吃鱼，馆里的大鱼也得吃饭。她想了好久，回去画了两条大鱼和一条小鱼。小鱼被她涂得特别亮。', '儿童蜡笔画：两条大鱼、一条亮黄色的小鱼。', None, '这句“鱼会吃鱼”须保留普通母亲安慰孩子的语气，后期才显出被误解的可怕。'),
('动态 04 2025年5月4日 16时20分', '鱼鱼有家吗。妈妈说它们住在这里。(^_^)', None, '苹果树回复：苹苹趁我洗衣服拿手机发的，错字就不改了，给她留着。', '明确播下苹苹能使用账号的线索，避免后期更新像凭空出现。'),
('动态 05 2025年4月2日 20时31分', '苹苹把赵姐姐送的海兔发卡摆在门口，问她什么时候再来。我不知道该怎么写给她看，只能说赵姐姐今天来不了。她把发卡收回盒子里，晚饭也没吃多少。', '一枚海兔形状的发卡放在小纸盒里。', None, '发生在赵雨虹 3 月 29 日死亡之后，只表达失去，不解释死因。'),
('动态 06 2025年3月25日 22时08分', '小赵下班后又来看苹苹，画了一张美人鱼贴在墙上。苹苹开心了一整晚。她走的时候脸色不好，我给她发消息，叫她早点回去睡。明天还有演出呢。', '墙上是孩子涂色的美人鱼，人物表情不清晰。', '雨后彩虹rainbow：等忙完这几天，我再陪苹苹画水母。', '赵的承诺在后来的新闻中形成回响。真正的倾诉内容放入工作备忘，避免首页过早揭底。'),
('动态 07 2025年2月14日 19时25分', '苹苹今天非要穿着橙白色救生衣吃饭，说自己是小丑鱼。我写给她看：小丑鱼住在海里，你住在妈妈身边。她把筷子摆成两根小触角，说那我也是妈妈的小鱼。', '只拍救生衣和餐盘，不出现清晰正脸。', None, '橙白救生衣是终局辨认画中视角的视觉锚点。'),
('动态 08 2024年12月8日 20时02分', '苹苹翻海洋生物百科，认得小丑鱼，不认得我写的“陈”字。她把书带去睡觉，还给鱼画了两只脚。我问为什么，她说这样鱼就能来找妈妈。', '海洋生物百科摊开在“小丑鱼”页，旁边是长脚的鱼。', None, '轻微呈现人与鱼在画中的混合，但不在文字里解释为病症或危险。'),
('动态 09 2024年10月17日 18时56分', '拿到在 B 市上班后的第一笔工资，昨天带苹苹去医院复诊。医生让我继续用画和文字跟她说清楚事情，别着急等她一下子懂。她回程在车上睡着了，手里还攥着画笔。', '孩子攥着画笔的手与折起的挂号单，诊断内容不可见。', None, '与 2024 年 10 月 16 日大医院复诊对应；具体资料放在加密文件夹。'),
('动态 10 2024年9月24日 21时11分', '到 B 市了。新工作在泊然海洋馆，做清洁，地方大得走一天腿都酸。好在能住下来，离给苹苹看病的医院也近些。等我把路线认熟，带她看鱼。', '从员工通道远处拍到的展缸灯光，不出现孩子住宿的房间。', None, '公开动态只写“能住下来”，孩子住在员工宿舍的实情留在文件夹。'),
]
for title_, copy, art, comments, editor in posts:
    entry(title_, 'socialaccount1.html > #home > #postList；页面默认倒序', '首次进入', copy, art, comments, editor)

heading('三 我的文件总览与子页面')
p('以下文件夹名称和正文可替换 socialaccount1.html 中现有的占位内容。正常文件可首访打开；两处加密文件分别从生日与劳而得员工页取得密码。')
entry('文件总览', 'socialaccount1.html > #file > #file-main', '首次进入',
      '文件夹：苹苹的画｜苹苹资料（加密）｜日常便签｜图卡练习｜写给苹苹｜工作文件（加密）｜小鱼贴纸本',
      editor='按现有七张文件卡顺序对应 album、medical、daily、rehab、note、contract、game；无需为文案新增页面结构。')

entry('苹苹的画', 'socialaccount1.html > #file-album', '首次进入',
      '相册说明：她把在海洋馆见过的人和鱼都画在这里。我不太舍得删。\n2024.10.19《新家》：两个人站在小小的房间里，窗外有一条鱼。\n2024.12.08《会走路的小丑鱼》：橙白色的鱼长了两条腿。\n2025.03.25《赵姐姐和我》：三个人并排站在展缸前，最小的人穿橙白色。\n2025.05.20《吃饭》：两条大鱼围着一条涂得很亮的小鱼。',
      editor='相册开放四张缩略图即可；不要出现尸体、凶器或训练池全貌。')

entry('苹苹资料', 'socialaccount1.html > #file-medical；密码弹窗 medical', '生日线索出现后即可解锁',
      '文件夹提示：苹苹出生的年月日，八位数字。\n密码：20180608\n文件 1《2021年10月21日门诊记录摘页》：初步诊断为孤独症谱系障碍；建议持续随访，家长可用图片和短句帮助她表达需要。\n文件 2《2024年10月16日 B 市复诊记录摘页》：建议继续使用图卡与日常记录，遇到她把人和海洋动物画在一起时先询问画的意思，不急于替她解释。\n妈妈附言：我先学会听懂她的画，再盼她学会说出自己的话。',
      editor='以上为故事道具摘要，不写病历编号、具体药物或“疾病导致暴力”的因果。')

entry('日常便签', 'socialaccount1.html > #file-daily', '首次进入',
      '2024.09.26：宿舍只有一张单人床。我把行李收在床底，苹苹睡里面，夜班前给她留水和图卡。别让她一个人去后场。\n2025.02.21：晚班换到员工通道，回房间时看见她的鞋摆在门口。她又自己出去过。明天要把门上的卡扣换好。\n2025.07.15：训练池旁那段临时接线还没收，地又总是湿。我在值班纸上记了两次；清洁车不能从那儿推。',
      editor='第三条只做环境风险预告，不在这里直说陈树的死亡方式。')

entry('图卡练习', 'socialaccount1.html > #file-rehab', '首次进入',
      '这一周练习的字：人、鱼、家、吃饭。\n苹苹把“鱼”放在“家”旁边，说鱼的家就是池子；把“妈妈”放在岸上，说妈妈怕水。我问她自己在哪里，她拿了小丑鱼那张卡，放到我旁边。',
      editor='这是母女间的沟通记录，不将图卡练习写成医学诊断。')

entry('写给苹苹', 'socialaccount1.html > #file-note', '首次进入',
      '2025.04.03：赵姐姐不会再来了。妈妈不知道怎么把这件事写给你，先让你留着她画的那条美人鱼。你想她的时候，我们就一起看看。\n2025.07.10：等妈妈攒够钱，我们搬去窗户能看见树的地方。你不必总待在小房间，也不必穿着救生衣吃饭。',
      editor='母亲的承诺与最终无法离开海洋馆的结局形成反差。')

entry('工作文件', 'socialaccount1.html > #file-contract；密码弹窗 contract', '找到劳而得陈树员工页后解锁',
      '文件夹提示：我的劳而得工号，字母和数字都要输。\n密码：LD2025012\n《劳务派遣协议摘录》：派遣公司为劳而得，接收单位为泊然海洋馆；岗位为后勤保洁，2024 年 9 月 23 日起到岗。安排员工单间宿舍，联系人为邓仁。附注写“宿舍原则上不安排家属长期居住”。\n《2025年3月25日未发出的便签》：小赵今天在苹苹面前说了很多，以为我听不见。她提到钱蔚东、饵料房里的一条链子，还问我有没有见过贾总带人走后场。我想打字问她，门外有人走过。那截旧工装的袖口，我后来一直想不起来是谁的。\n《2025年7月17日20时41分草稿》：听见安副馆长说可能要停馆。我要等他忙完问问，宿舍什么时候清。苹苹还在房里，不能今晚就赶我们走。',
      editor='3 月便签不直接宣布安永德听到了谈话；7 月草稿发生在陈树死亡前，玩家可据此回接遗书和案卷。')

entry('小鱼贴纸本', 'socialaccount1.html > #file-game', '首次进入',
      '苹苹留在手机里的三张贴纸：\n小丑鱼：我穿橙色和白色。\n大鱼：今天也要吃饭。\n妈妈：妈妈在岸上等我。',
      editor='字句保持儿童口吻；这里只建立她会用手机、把自己视作小丑鱼的事实。')

heading('四 后期回访才出现的动态')
entry('新增动态 刚刚', 'socialaccount1.html > #home > #postList 顶部；旧动态不删',
      '玩家已查到贾案落网，且知道闭馆后仍有人在海洋馆遇害；再次访问账号时才显示',
      '这下鱼鱼们不用饿肚子啦。(^▽^)',
      '儿童画必须从画者视角表现后场训练池：画面下方是橙白色救生衣边缘；池边一双小鞋；池水里有一个被画成“给鱼吃饭”的人形；远处保留海洋馆后场可辨认的蓝色设备与黄黑警示线。不要写实血腥，也不要直接给画作标注“凶案现场”。',
      editor='这是苹苹借母亲账号发布，不是陈树死后复活。发布时间只显示“刚刚”，与初访时的 2025.07.16 最后动态形成异常。点击画可放大，让玩家先自行比对救生衣、图卡和“鱼会吃鱼”的旧帖，再进入结局选择。')

heading('五 玩家线索与文案校验')
for lead, body in [
    ('初访能知道的事', '陈树是能听不能说的保洁员；苹苹是她的女儿；母女住得离海洋馆很近；苹苹喜欢小丑鱼，能用母亲手机发帖。'),
    ('解锁后才能知道的事', '苹苹实际住在员工宿舍；邓仁是劳务联系人；赵雨虹向陈树倾诉过钱蔚东和饵料房的事；陈树在 7 月 17 日晚得知停馆消息后想问清宿舍安排。'),
    ('后期才允许玩家推断的事', '7 月 16 日后账号长期停更，后期突然出现儿童口吻与训练池画作；玩家把这条更新和旧帖、工作便签、后续案件合在一起，才能意识到发布者与新的危险。'),
    ('保持悬念的边界', '首页不写陈树确切死因，不让苹苹提前说出杀人方法，不把赵雨虹的倾诉写成公开爆料，也不让加密文件的密码只能从文件内部取得。'),
]:
    labelled(lead + '  ', body)

p('核对依据：工作簿“剧情线索对应-时间顺序”“杏仁网社交账号”，以及现有 socialaccount1.html、xingrenwang.html、labor chen.html、labor deng.html、基金会搜索引擎关键词逻辑链.html。网页中的 2026 年占位动态与主线时间冲突，本稿未沿用。', 'Editor Note')

footer = sec.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
set_font(footer.add_run('陈树杏仁网账号文案'), size=8.5, color=(95,95,95))
set_font(footer.add_run('  ·  '), size=8.5, color=(95,95,95))
field = OxmlElement('w:fldSimple'); field.set(qn('w:instr'), 'PAGE'); footer._p.append(field)

doc.save(OUT)
print(OUT)
