Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$textureDir = Join-Path $root 'public/textures'
$outDir = Join-Path $textureDir 'final-3d'
$atlasDir = Join-Path $outDir 'texture-atlas'
$modelDir = Join-Path $outDir 'models'

New-Item -ItemType Directory -Force -Path $outDir, $atlasDir, $modelDir | Out-Null

function Save-Png($bitmap, $path) {
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function New-Atlas($slug, $frontName, $backName) {
  $frontPath = Join-Path $textureDir $frontName
  $backPath = Join-Path $textureDir $backName
  $atlasPath = Join-Path $atlasDir "$slug-atlas.png"

  if (!(Test-Path $frontPath)) {
    throw "Missing front image: $frontPath"
  }
  if (!(Test-Path $backPath)) {
    throw "Missing back image: $backPath"
  }

  $pixelFormat = [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  $atlas = New-Object System.Drawing.Bitmap 2048, 2048, $pixelFormat
  $g = [System.Drawing.Graphics]::FromImage($atlas)
  $g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

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
    id = 'black-canarinho'
    front = 'Black Canarinho(front).png'
    back = 'Black Canarinho(Back).png'
  },
  @{
    id = 'golden-albiceleste'
    front = 'Golden Albiceleste(front).png'
    back = 'Golden Albiceleste(back).png'
  },
  @{
    id = 'le-phantom'
    front = 'Le Phantom(Front).png'
    back = 'Le Phantom(Back).png'
  },
  @{
    id = 'lusitano-prime'
    front = 'Lusitano Prime(front).png'
    back = 'Lusitano Prime(back).png'
  }
)

$baseModel = Join-Path $textureDir 't_shirt.glb'
if (!(Test-Path $baseModel)) {
  throw "Missing base model: $baseModel"
}

$manifest = @()
foreach ($jersey in $jerseys) {
  $atlasPath = New-Atlas $jersey.id $jersey.front $jersey.back
  $modelPath = Join-Path $modelDir "$($jersey.id).glb"
  Copy-Item $baseModel $modelPath -Force

  $manifest += [pscustomobject]@{
    id = $jersey.id
    name = ($jersey.id -split '-' | ForEach-Object {
      $_.Substring(0, 1).ToUpperInvariant() + $_.Substring(1)
    }) -join ' '
    model = $modelPath.Substring($root.Length + 1).Replace('\', '/')
    atlas = $atlasPath.Substring($root.Length + 1).Replace('\', '/')
    front = (Join-Path $textureDir $jersey.front).Substring($root.Length + 1).Replace('\', '/')
    back = (Join-Path $textureDir $jersey.back).Substring($root.Length + 1).Replace('\', '/')
  }
}

$manifestPath = Join-Path $outDir 'manifest.json'
$manifest | ConvertTo-Json -Depth 4 | Set-Content -Path $manifestPath -Encoding UTF8

Write-Host "Generated final 3D jersey assets:"
$manifest | Format-Table id, model, atlas -AutoSize
