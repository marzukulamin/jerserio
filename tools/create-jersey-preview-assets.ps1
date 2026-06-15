Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$textureDir = Join-Path $root 'public/textures'
$outDir = Join-Path $textureDir 'generated-3d'
$editedDir = Join-Path $outDir 'edited-png'
$atlasDir = Join-Path $outDir 'texture-atlas'
$modelDir = Join-Path $outDir 'models'

New-Item -ItemType Directory -Force -Path $editedDir, $atlasDir, $modelDir | Out-Null

function Open-Bitmap($path) {
  $img = [System.Drawing.Image]::FromFile($path)
  $pixelFormat = [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  $bmp = New-Object System.Drawing.Bitmap $img.Width, $img.Height, $pixelFormat
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $g.DrawImage($img, 0, 0, $img.Width, $img.Height)
  $g.Dispose()
  $img.Dispose()
  return $bmp
}

function Save-Png($bmp, $path) {
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Fill-Rect($bmp, $x, $y, $w, $h, $hex) {
  $fill = [System.Drawing.ColorTranslator]::FromHtml($hex)
  $maxX = [Math]::Min($bmp.Width, $x + $w)
  $maxY = [Math]::Min($bmp.Height, $y + $h)
  $minX = [Math]::Max(0, $x)
  $minY = [Math]::Max(0, $y)
  for ($py = $minY; $py -lt $maxY; $py++) {
    for ($px = $minX; $px -lt $maxX; $px++) {
      $current = $bmp.GetPixel($px, $py)
      if ($current.A -gt 25) {
        $bmp.SetPixel($px, $py, [System.Drawing.Color]::FromArgb($current.A, $fill.R, $fill.G, $fill.B))
      }
    }
  }
}

function Draw-Outlined-Text($g, $text, $x, $y, $w, $h, $fillHex, $strokeHex, $strokeWidth, $fontSize, $angle = 0) {
  $state = $g.Save()
  $g.TranslateTransform($x + ($w / 2), $y + ($h / 2))
  if ($angle -ne 0) {
    $g.RotateTransform($angle)
  }
  $g.TranslateTransform(-($w / 2), -($h / 2))

  $family = New-Object System.Drawing.FontFamily 'Arial Black'
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $rect = New-Object System.Drawing.RectangleF 0, 0, $w, $h
  $style = [System.Drawing.FontStyle]::Bold
  $path.AddString($text, $family, [int]$style, $fontSize, $rect, $format)

  $pen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml($strokeHex)), $strokeWidth
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($fillHex))
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.DrawPath($pen, $path)
  $g.FillPath($brush, $path)

  $brush.Dispose()
  $pen.Dispose()
  $path.Dispose()
  $format.Dispose()
  $family.Dispose()
  $g.Restore($state)
}

function Edit-Image($sourceName, $outName, $ops) {
  $source = Join-Path $textureDir $sourceName
  $out = Join-Path $editedDir $outName
  $bmp = Open-Bitmap $source
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  foreach ($op in $ops) {
    if ($op.kind -eq 'fill') {
      Fill-Rect $bmp $op.x $op.y $op.w $op.h $op.color
    }
    elseif ($op.kind -eq 'text') {
      Draw-Outlined-Text $g $op.text $op.x $op.y $op.w $op.h $op.fill $op.stroke $op.strokeWidth $op.fontSize $op.angle
    }
  }

  $g.Dispose()
  Save-Png $bmp $out
  $bmp.Dispose()
  return $out
}

function New-Atlas($name, $frontPath, $backPath) {
  $atlasPath = Join-Path $atlasDir "$name-atlas.png"
  $pixelFormat = [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  $atlas = New-Object System.Drawing.Bitmap 2048, 2048, $pixelFormat
  $g = [System.Drawing.Graphics]::FromImage($atlas)
  $g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $front = [System.Drawing.Image]::FromFile($frontPath)
  $back = [System.Drawing.Image]::FromFile($backPath)
  $g.DrawImage($front, 0, 0, 1024, 2048)
  $g.DrawImage($back, 1024, 0, 1024, 2048)
  $front.Dispose()
  $back.Dispose()
  $g.Dispose()
  Save-Png $atlas $atlasPath
  $atlas.Dispose()
  return $atlasPath
}

$jerseys = @(
  @{
    slug = 'black-canarinho'
    frontSource = 'Black Canarinho(front).png'
    backSource = 'Black Canarinho(Back).png'
    frontOut = 'black-canarinho-front-10.png'
    backOut = 'black-canarinho-back-10.png'
    frontOps = @(
      @{ kind='fill'; x=4; y=222; w=108; h=82; color='#f0c511' },
      @{ kind='text'; text='10'; x=8; y=229; w=96; h=60; fill='#0c4c1c'; stroke='#fff3b0'; strokeWidth=3; fontSize=45; angle=7 },
      @{ kind='fill'; x=574; y=222; w=107; h=82; color='#f0c511' },
      @{ kind='text'; text='10'; x=580; y=229; w=94; h=60; fill='#0c4c1c'; stroke='#fff3b0'; strokeWidth=3; fontSize=45; angle=-7 }
    )
    backOps = @(
      @{ kind='fill'; x=207; y=108; w=235; h=74; color='#0b0b0b' },
      @{ kind='fill'; x=136; y=170; w=370; h=274; color='#090909' },
      @{ kind='text'; text='10'; x=166; y=165; w=320; h=230; fill='#0c4c1c'; stroke='#fff3b0'; strokeWidth=6; fontSize=165; angle=0 },
      @{ kind='fill'; x=2; y=225; w=106; h=80; color='#f0c511' },
      @{ kind='text'; text='10'; x=8; y=231; w=94; h=58; fill='#0c4c1c'; stroke='#fff3b0'; strokeWidth=3; fontSize=44; angle=8 },
      @{ kind='fill'; x=541; y=225; w=106; h=80; color='#f0c511' },
      @{ kind='text'; text='10'; x=548; y=231; w=93; h=58; fill='#0c4c1c'; stroke='#fff3b0'; strokeWidth=3; fontSize=44; angle=-8 }
    )
  },
  @{
    slug = 'golden-albiceleste'
    frontSource = 'Golden Albiceleste(front).png'
    backSource = 'Golden Albiceleste(back).png'
    frontOut = 'golden-albiceleste-front-10.png'
    backOut = 'golden-albiceleste-back-10.png'
    frontOps = @()
    backOps = @(
      @{ kind='fill'; x=220; y=135; w=285; h=72; color='#f1f2f4' }
    )
  },
  @{
    slug = 'le-phantom'
    frontSource = 'Le Phantom(Front).png'
    backSource = 'Le Phantom(Back).png'
    frontOut = 'le-phantom-front-10.png'
    backOut = 'le-phantom-back-10.png'
    frontOps = @()
    backOps = @(
      @{ kind='fill'; x=182; y=126; w=245; h=74; color='#0e1b31' }
    )
  },
  @{
    slug = 'lusitano-prime'
    frontSource = 'Lusitano Prime(front).png'
    backSource = 'Lusitano Prime(back).png'
    frontOut = 'lusitano-prime-front-07.png'
    backOut = 'lusitano-prime-back-07.png'
    frontOps = @(
      @{ kind='fill'; x=0; y=240; w=108; h=92; color='#15523f' },
      @{ kind='text'; text='07'; x=-6; y=249; w=108; h=66; fill='#f0f0ec'; stroke='#b99025'; strokeWidth=3; fontSize=47; angle=8 },
      @{ kind='fill'; x=573; y=240; w=108; h=92; color='#15523f' },
      @{ kind='text'; text='07'; x=578; y=249; w=108; h=66; fill='#f0f0ec'; stroke='#b99025'; strokeWidth=3; fontSize=47; angle=-8 }
    )
    backOps = @(
      @{ kind='fill'; x=210; y=126; w=260; h=98; color='#c81c17' },
      @{ kind='fill'; x=142; y=210; w=392; h=270; color='#c71917' },
      @{ kind='text'; text='07'; x=165; y=208; w=342; h=235; fill='#f0f0ec'; stroke='#b99025'; strokeWidth=7; fontSize=165; angle=0 },
      @{ kind='fill'; x=0; y=249; w=112; h=88; color='#15523f' },
      @{ kind='text'; text='07'; x=-4; y=253; w=110; h=66; fill='#f0f0ec'; stroke='#b99025'; strokeWidth=3; fontSize=47; angle=8 },
      @{ kind='fill'; x=562; y=250; w=110; h=88; color='#15523f' },
      @{ kind='text'; text='07'; x=566; y=253; w=108; h=66; fill='#f0f0ec'; stroke='#b99025'; strokeWidth=3; fontSize=47; angle=-8 }
    )
  }
)

$manifest = @()
foreach ($jersey in $jerseys) {
  $frontPath = Edit-Image $jersey.frontSource $jersey.frontOut $jersey.frontOps
  $backPath = Edit-Image $jersey.backSource $jersey.backOut $jersey.backOps
  $atlasPath = New-Atlas $jersey.slug $frontPath $backPath
  $modelPath = Join-Path $modelDir "$($jersey.slug).glb"
  Copy-Item (Join-Path $textureDir 't_shirt.glb') $modelPath -Force
  $manifest += [pscustomobject]@{
    id = $jersey.slug
    model = $modelPath.Substring($root.Length + 1).Replace('\', '/')
    atlas = $atlasPath.Substring($root.Length + 1).Replace('\', '/')
    front = $frontPath.Substring($root.Length + 1).Replace('\', '/')
    back = $backPath.Substring($root.Length + 1).Replace('\', '/')
  }
}

$manifestPath = Join-Path $outDir 'manifest.json'
$manifest | ConvertTo-Json -Depth 4 | Set-Content -Path $manifestPath -Encoding UTF8

Write-Host "Generated jersey preview assets:"
$manifest | Format-Table id, model, atlas, front, back -AutoSize
