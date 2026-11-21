$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$outDir = (Get-Location).Path
$s1440 = "$outDir\screenshots\overview-1440.png"
$s1024 = "$outDir\screenshots\overview-1024.png"
$s768  = "$outDir\screenshots\overview-768.png"
$s390  = "$outDir\screenshots\overview-390.png"
$sFeed1440 = "$outDir\screenshots\feed-1440.png"
$sFeed390  = "$outDir\screenshots\feed-390.png"
$sDetail1440 = "$outDir\screenshots\details-1440.png"
$sDetail390  = "$outDir\screenshots\details-390.png"

if (!(Test-Path "$outDir\screenshots")) {
    New-Item -ItemType Directory -Force -Path "$outDir\screenshots" | Out-Null
}

Write-Host "Capturing overview-1440..."
Start-Process -FilePath $chrome -ArgumentList @('--headless=new', '--disable-gpu', '--virtual-time-budget=3000', '--window-size=1440,900', "--screenshot=$s1440", 'http://localhost:5173/dashboard') -Wait

Write-Host "Capturing overview-1024..."
Start-Process -FilePath $chrome -ArgumentList @('--headless=new', '--disable-gpu', '--virtual-time-budget=3000', '--window-size=1024,800', "--screenshot=$s1024", 'http://localhost:5173/dashboard') -Wait

Write-Host "Capturing overview-768..."
Start-Process -FilePath $chrome -ArgumentList @('--headless=new', '--disable-gpu', '--virtual-time-budget=3000', '--window-size=768,1024', "--screenshot=$s768", 'http://localhost:5173/dashboard') -Wait

Write-Host "Capturing overview-390..."
Start-Process -FilePath $chrome -ArgumentList @('--headless=new', '--disable-gpu', '--virtual-time-budget=3000', '--window-size=390,844', '--hide-scrollbars', "--screenshot=$s390", 'http://localhost:5173/dashboard') -Wait

Write-Host "Capturing feed-1440..."
Start-Process -FilePath $chrome -ArgumentList @('--headless=new', '--disable-gpu', '--virtual-time-budget=3000', '--window-size=1440,900', "--screenshot=$sFeed1440", 'http://localhost:5173/dashboard/feed') -Wait

Write-Host "Capturing feed-390..."
Start-Process -FilePath $chrome -ArgumentList @('--headless=new', '--disable-gpu', '--virtual-time-budget=3000', '--window-size=390,844', '--hide-scrollbars', "--screenshot=$sFeed390", 'http://localhost:5173/dashboard/feed') -Wait

Write-Host "Capturing details-1440..."
Start-Process -FilePath $chrome -ArgumentList @('--headless=new', '--disable-gpu', '--virtual-time-budget=3000', '--window-size=1440,900', "--screenshot=$sDetail1440", 'http://localhost:5173/dashboard/threats/THR-1999-0095') -Wait

Write-Host "Capturing details-390..."
Start-Process -FilePath $chrome -ArgumentList @('--headless=new', '--disable-gpu', '--virtual-time-budget=3000', '--window-size=390,844', '--hide-scrollbars', "--screenshot=$sDetail390", 'http://localhost:5173/dashboard/threats/THR-1999-0095') -Wait

Get-ChildItem "$outDir\screenshots" | Select-Object Name, Length
