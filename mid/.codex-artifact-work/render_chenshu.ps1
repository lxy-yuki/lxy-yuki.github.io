$ErrorActionPreference = 'Stop'
$docxPath = 'F:\first!!!\outputs\陈树杏仁网账号文案与投放位置.docx'
$pdfPath = 'F:\first!!!\.codex-artifact-work\chenshu-render\chenshu.pdf'
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $pdfPath) | Out-Null
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$document = $null
try {
    $document = $word.Documents.Open($docxPath, $false, $true)
    $document.ExportAsFixedFormat($pdfPath, 17)
    Write-Output $pdfPath
}
finally {
    if ($null -ne $document) { $document.Close($false) }
    $word.Quit()
}
