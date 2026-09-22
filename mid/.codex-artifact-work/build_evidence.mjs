import fs from 'node:fs/promises';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const source = String.raw`C:\Users\施昊lty\Desktop\文案\海洋馆募捐调查委托_杏仁网加密文件已填入.xlsx`;
const outputDir = String.raw`F:\first!!!\outputs\钱蔚东线`;
const outputPath = `${outputDir}\\海洋馆募捐调查委托_钱蔚东证据重写.xlsx`;

const content = `【调查备份｜钱蔚东｜最后保存：2025.1.3 22:06】
我原本替贾剑明签合作文件，以为只是绕开正常采购流程。12月14日看见对账邮件后，才知道自己签下的东西有多脏。以下是我从本人经手的合同、海洋馆财务邮件和后场登记中留出的副本；原始文件我没有拿走。

① 合同。编号 BR-CG-241127，签订日 2024.11.27。甲方“泊然海洋馆运营管理有限公司”，乙方“B市蓝鲸贸易有限公司”，名目“低温饵料配送及后场设备维保”，总价 ¥1,860,000。合同附件写明分三批验收，每笔款项须对应称重单和冷链车入馆记录。乙方联系人一栏是空的，签收处却提前盖好了海洋馆的章。

② 海洋馆付款回单（付款户尾号 3186 → 蓝鲸贸易收款户尾号 7429）：2024.11.28  ¥780,000，流水尾号 0831；12.05  ¥460,000，尾号 2194；12.16  ¥620,000，尾号 6047。三笔合计 ¥1,860,000，备注均为 BR-CG-241127。回单截图来自我抄送的财务对账邮件。

③ 蓝鲸发来的对账附件中，另有三笔“品牌渠道服务费”付款：11.29  ¥742,000；12.06  ¥437,000；12.17  ¥589,000，收款方均为“明通文旅管理有限公司”（户尾号 1062），合计 ¥1,768,000。每笔均紧挨着海洋馆付款日期，去向接近总款的 95%。我拿不到蓝鲸的银行原始回单，这部分只能算对方自报的对账记录。

④ 我拍下的后场核对页：上述三次“验收”的日期，冷链车入馆登记均无相应车牌或过磅重量；三张验收单的经办签名笔迹相同，单据却写了三个不同班次。这里只能说明货物交付记录与合同不合，不能单凭它断言钱最终被谁拿走。

12月20日我告诉贾不再替他签字；1月2日，他坚持让我来海洋馆当面拿合作终止文件。今晚我在办公室等了快一个小时，他说再等十分钟。我把这份备份设成只有看过那段聊天的人才会打开。

后续核对入口：在麦英基金会搜索引擎输入【蓝鲸贸易】。请把公开资料里的付款方、收款方、金额、合同编号与上面逐项比对。别只看贾的名字。`;

const input = await FileBlob.load(source);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem('杏仁网加密文件总表');
sheet.getRange('B4:E4').values = [[
  '调查贾剑明：对账备份',
  '最后一次约见的日期',
  '20250103',
  '赵雨虹“存档”内，2025.1.3 21:48 的聊天记录',
]];
sheet.getRange('F4').values = [[content]];
sheet.getRange('B1').format.columnWidth = 30;
sheet.getRange('C1').format.columnWidth = 24;
sheet.getRange('E1').format.columnWidth = 30;
sheet.getRange('F1').format.columnWidth = 78;
sheet.getRange('F4').format.verticalAlignment = 'top';
workbook.worksheets.getItem('杏仁网社交账号').getRange('E43').values = [[
  '加密文件夹：调查贾剑明的对账备份；密码提示为赵雨虹“存档”里最后一次约见的日期（20250103）',
]];
await workbook.recalculate();
try {
  const preview = await workbook.render({ sheetName: '杏仁网加密文件总表', range: 'A1:F4', scale: 1, format: 'png' });
  await fs.writeFile(String.raw`F:\first!!!\.codex-artifact-work\preview.png`, new Uint8Array(await preview.arrayBuffer()));
  console.log('Preview rendered');
} catch (error) {
  console.log(`Preview render unavailable: ${error.message}`);
}
const check = await workbook.inspect({ kind: 'region', sheetId: '杏仁网加密文件总表', range: 'A4:F4', maxChars: 2200, tableMaxCellChars: 1200 });
console.log(check.ndjson);
await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);
