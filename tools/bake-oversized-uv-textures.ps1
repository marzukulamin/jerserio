Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Web.Extensions

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$textureDir = Join-Path $root 'public/textures'
$finalDir = Join-Path $textureDir 'final-3d'
$modelDir = Join-Path $finalDir 'models'
$bakedDir = Join-Path $finalDir 'baked'
$templateDir = Join-Path $finalDir 'templates'
$geometryPath = Join-Path $modelDir 'oversized_t-shirt-geometry.json'
$templatePath = Join-Path $templateDir 'oversized-uv-template.png'

New-Item -ItemType Directory -Force -Path $bakedDir, $templateDir, $modelDir | Out-Null

$node = 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$oversizedModel = Join-Path $modelDir 'oversized_t-shirt.glb'

if (!(Test-Path $oversizedModel)) {
  throw "Missing oversized model at $oversizedModel"
}

& $node (Join-Path $root 'tools\export-oversized-geometry.mjs') $oversizedModel $geometryPath

$csharp = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Web.Script.Serialization;

public class GeometryBounds {
  public float minX;
  public float maxX;
  public float minY;
  public float maxY;
}

public class GeometryData {
  public GeometryBounds bounds;
  public float[] positions;
  public float[] normals;
  public float[] uvs;
  public int[] indices;
}

public class ImageBounds {
  public int MinX;
  public int MinY;
  public int MaxX;
  public int MaxY;
}

public class ProjectionRect {
  public double offsetX;
  public double offsetY;
  public double scaleX;
  public double scaleY;
}

public static class UvBakeTool {
  private sealed class FastBitmap : IDisposable {
    private readonly Bitmap _bitmap;
    private readonly BitmapData _data;
    private readonly byte[] _pixels;
    private readonly int _stride;
    public int Width;
    public int Height;

    public FastBitmap(Bitmap bitmap, bool writable) {
      _bitmap = bitmap;
      Width = bitmap.Width;
      Height = bitmap.Height;
      var rect = new Rectangle(0, 0, Width, Height);
      _data = bitmap.LockBits(rect, writable ? ImageLockMode.ReadWrite : ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
      _stride = _data.Stride;
      _pixels = new byte[Math.Abs(_stride) * Height];
      System.Runtime.InteropServices.Marshal.Copy(_data.Scan0, _pixels, 0, _pixels.Length);
    }

    public void Dispose() {
      System.Runtime.InteropServices.Marshal.Copy(_pixels, 0, _data.Scan0, _pixels.Length);
      _bitmap.UnlockBits(_data);
      _bitmap.Dispose();
    }

    public void SetPixel(int x, int y, byte r, byte g, byte b, byte a) {
      if (x < 0 || y < 0 || x >= Width || y >= Height) return;
      int offset = y * _stride + x * 4;
      _pixels[offset] = b;
      _pixels[offset + 1] = g;
      _pixels[offset + 2] = r;
      _pixels[offset + 3] = a;
    }

    public void Sample(double x, double y, out byte r, out byte g, out byte b, out byte a) {
      x = Math.Max(0, Math.Min(Width - 1, x));
      y = Math.Max(0, Math.Min(Height - 1, y));

      int x0 = (int)Math.Floor(x);
      int y0 = (int)Math.Floor(y);
      int x1 = Math.Min(Width - 1, x0 + 1);
      int y1 = Math.Min(Height - 1, y0 + 1);
      double tx = x - x0;
      double ty = y - y0;

      byte r00, g00, b00, a00;
      byte r10, g10, b10, a10;
      byte r01, g01, b01, a01;
      byte r11, g11, b11, a11;
      Pixel(x0, y0, out r00, out g00, out b00, out a00);
      Pixel(x1, y0, out r10, out g10, out b10, out a10);
      Pixel(x0, y1, out r01, out g01, out b01, out a01);
      Pixel(x1, y1, out r11, out g11, out b11, out a11);

      r = Blend(Blend(r00, r10, tx), Blend(r01, r11, tx), ty);
      g = Blend(Blend(g00, g10, tx), Blend(g01, g11, tx), ty);
      b = Blend(Blend(b00, b10, tx), Blend(b01, b11, tx), ty);
      a = Blend(Blend(a00, a10, tx), Blend(a01, a11, tx), ty);
    }

    private static byte Blend(byte a, byte b, double t) {
      return (byte)Math.Max(0, Math.Min(255, (int)Math.Round(a + (b - a) * t)));
    }

    private void Pixel(int x, int y, out byte r, out byte g, out byte b, out byte a) {
      int offset = y * _stride + x * 4;
      b = _pixels[offset];
      g = _pixels[offset + 1];
      r = _pixels[offset + 2];
      a = _pixels[offset + 3];
    }
  }

  public static void Bake(
    string geometryPath,
    string frontPath,
    string backPath,
    string outputPath,
    string templatePath,
    int textureSize,
    int frontSign,
    ProjectionRect frontRect,
    ProjectionRect backRect
  ) {
    var serializer = new JavaScriptSerializer();
    serializer.MaxJsonLength = int.MaxValue;
    var geometry = serializer.Deserialize<GeometryData>(File.ReadAllText(geometryPath));

    using (var frontBitmap = new Bitmap(frontPath))
    using (var backBitmap = new Bitmap(backPath))
    using (var front = new FastBitmap(new Bitmap(frontBitmap), false))
    using (var back = new FastBitmap(new Bitmap(backBitmap), false))
    using (var targetBitmap = new Bitmap(textureSize, textureSize, PixelFormat.Format32bppArgb))
    using (var target = new FastBitmap(targetBitmap, true)) {
      var frontBounds = FindOpaqueBounds(frontBitmap);
      var backBounds = FindOpaqueBounds(backBitmap);

      Fill(target, 16, 16, 16, 255);

      var pos = geometry.positions;
      var norm = geometry.normals;
      var uv = geometry.uvs;
      var idx = geometry.indices;
      double xRange = Math.Max(geometry.bounds.maxX - geometry.bounds.minX, 0.0001);
      double yRange = Math.Max(geometry.bounds.maxY - geometry.bounds.minY, 0.0001);

      for (int tri = 0; tri < idx.Length; tri += 3) {
        int i0 = idx[tri];
        int i1 = idx[tri + 1];
        int i2 = idx[tri + 2];

        double u0 = uv[i0 * 2];
        double v0 = uv[i0 * 2 + 1];
        double u1 = uv[i1 * 2];
        double v1 = uv[i1 * 2 + 1];
        double u2 = uv[i2 * 2];
        double v2 = uv[i2 * 2 + 1];

        double x0 = u0 * (textureSize - 1);
        double y0 = (1.0 - v0) * (textureSize - 1);
        double x1 = u1 * (textureSize - 1);
        double y1 = (1.0 - v1) * (textureSize - 1);
        double x2 = u2 * (textureSize - 1);
        double y2 = (1.0 - v2) * (textureSize - 1);

        int minX = Math.Max(0, (int)Math.Floor(Math.Min(x0, Math.Min(x1, x2))));
        int maxX = Math.Min(textureSize - 1, (int)Math.Ceiling(Math.Max(x0, Math.Max(x1, x2))));
        int minY = Math.Max(0, (int)Math.Floor(Math.Min(y0, Math.Min(y1, y2))));
        int maxY = Math.Min(textureSize - 1, (int)Math.Ceiling(Math.Max(y0, Math.Max(y1, y2))));

        double denom = ((y1 - y2) * (x0 - x2)) + ((x2 - x1) * (y0 - y2));
        if (Math.Abs(denom) < 0.0000001) continue;

        for (int py = minY; py <= maxY; py++) {
          double sampleY = py + 0.5;
          for (int px = minX; px <= maxX; px++) {
            double sampleX = px + 0.5;

            double w0 = (((y1 - y2) * (sampleX - x2)) + ((x2 - x1) * (sampleY - y2))) / denom;
            double w1 = (((y2 - y0) * (sampleX - x2)) + ((x0 - x2) * (sampleY - y2))) / denom;
            double w2 = 1.0 - w0 - w1;

            if (w0 < -0.0001 || w1 < -0.0001 || w2 < -0.0001) continue;

            double pxModel = (pos[i0 * 3] * w0) + (pos[i1 * 3] * w1) + (pos[i2 * 3] * w2);
            double pyModel = (pos[i0 * 3 + 1] * w0) + (pos[i1 * 3 + 1] * w1) + (pos[i2 * 3 + 1] * w2);
            double nz = (norm[i0 * 3 + 2] * w0) + (norm[i1 * 3 + 2] * w1) + (norm[i2 * 3 + 2] * w2);

            bool isFront = nz * frontSign >= 0.0;
            var rect = isFront ? frontRect : backRect;
            var source = isFront ? front : back;
            var sourceBounds = isFront ? frontBounds : backBounds;

            double normalizedX = Clamp01((pxModel - geometry.bounds.minX) / xRange);
            double normalizedY = Clamp01(1.0 - ((pyModel - geometry.bounds.minY) / yRange));

            double sampleU = Clamp01(rect.offsetX + normalizedX * rect.scaleX);
            double sampleV = Clamp01(rect.offsetY + normalizedY * rect.scaleY);

            double sourceX = sourceBounds.MinX + sampleU * Math.Max(1, sourceBounds.MaxX - sourceBounds.MinX);
            double sourceY = sourceBounds.MinY + sampleV * Math.Max(1, sourceBounds.MaxY - sourceBounds.MinY);

            byte r, g, b, a;
            source.Sample(sourceX, sourceY, out r, out g, out b, out a);

            if (a < 8) {
              a = 255;
            }

            target.SetPixel(px, py, r, g, b, a);
          }
        }
      }

      targetBitmap.Save(outputPath, ImageFormat.Png);
      if (!File.Exists(templatePath)) {
        SaveTemplate(templatePath, geometry, textureSize);
      }
    }
  }

  private static void SaveTemplate(string path, GeometryData geometry, int size) {
    using (var bitmap = new Bitmap(size, size, PixelFormat.Format32bppArgb))
    using (var graphics = Graphics.FromImage(bitmap))
    using (var pen = new Pen(Color.FromArgb(160, 0, 212, 170), 1f)) {
      graphics.Clear(Color.Transparent);
      var idx = geometry.indices;
      var uv = geometry.uvs;
      for (int tri = 0; tri < idx.Length; tri += 3) {
        int i0 = idx[tri];
        int i1 = idx[tri + 1];
        int i2 = idx[tri + 2];
        PointF p0 = new PointF((float)(uv[i0 * 2] * (size - 1)), (float)((1.0 - uv[i0 * 2 + 1]) * (size - 1)));
        PointF p1 = new PointF((float)(uv[i1 * 2] * (size - 1)), (float)((1.0 - uv[i1 * 2 + 1]) * (size - 1)));
        PointF p2 = new PointF((float)(uv[i2 * 2] * (size - 1)), (float)((1.0 - uv[i2 * 2 + 1]) * (size - 1)));
        graphics.DrawLine(pen, p0, p1);
        graphics.DrawLine(pen, p1, p2);
        graphics.DrawLine(pen, p2, p0);
      }
      bitmap.Save(path, ImageFormat.Png);
    }
  }

  private static void Fill(FastBitmap bitmap, byte r, byte g, byte b, byte a) {
    for (int y = 0; y < bitmap.Height; y++) {
      for (int x = 0; x < bitmap.Width; x++) {
        bitmap.SetPixel(x, y, r, g, b, a);
      }
    }
  }

  private static double Clamp01(double value) {
    return Math.Max(0.0, Math.Min(1.0, value));
  }

  private static ImageBounds FindOpaqueBounds(Bitmap bitmap) {
    int minX = bitmap.Width - 1;
    int minY = bitmap.Height - 1;
    int maxX = 0;
    int maxY = 0;

    for (int y = 0; y < bitmap.Height; y++) {
      for (int x = 0; x < bitmap.Width; x++) {
        if (bitmap.GetPixel(x, y).A < 10) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    return new ImageBounds {
      MinX = minX,
      MinY = minY,
      MaxX = maxX,
      MaxY = maxY
    };
  }
}
"@

Add-Type -TypeDefinition $csharp -ReferencedAssemblies 'System.Drawing', 'System.Web.Extensions'

function New-RectF([double]$x, [double]$y, [double]$w, [double]$h) {
  return New-Object System.Drawing.RectangleF([float]$x, [float]$y, [float]$w, [float]$h)
}

function Get-SourceRect($image, $spec) {
  return New-RectF `
    ($image.Width * $spec.x) `
    ($image.Height * $spec.y) `
    ($image.Width * $spec.w) `
    ($image.Height * $spec.h)
}

function Draw-ImageToRectRotated($graphics, $image, $destRect, $sourceRect, [double]$angleDegrees = 0.0) {
  $state = $graphics.Save()
  $centerX = $destRect.X + ($destRect.Width / 2)
  $centerY = $destRect.Y + ($destRect.Height / 2)

  $graphics.TranslateTransform([float]$centerX, [float]$centerY)
  if ([math]::Abs($angleDegrees) -gt 0.001) {
    $graphics.RotateTransform([float]$angleDegrees)
  }

  $drawRect = New-RectF (-$destRect.Width / 2) (-$destRect.Height / 2) $destRect.Width $destRect.Height
  $graphics.DrawImage($image, $drawRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
  $graphics.Restore($state)
}

function Draw-HalfComposite($graphics, $frontImage, $backImage, $targetRect, $frontSpec, $backSpec, [bool]$frontOnLeft, [double]$frontRatio = 0.68, [double]$rotationDegrees = 0.0) {
  $frontWidth = $targetRect.Width * $frontRatio
  $backWidth = $targetRect.Width - $frontWidth
  $leftRect = if ($frontOnLeft) {
    New-RectF $targetRect.X $targetRect.Y $frontWidth $targetRect.Height
  } else {
    New-RectF $targetRect.X $targetRect.Y $backWidth $targetRect.Height
  }
  $rightRect = if ($frontOnLeft) {
    New-RectF ($targetRect.X + $frontWidth) $targetRect.Y $backWidth $targetRect.Height
  } else {
    New-RectF ($targetRect.X + $backWidth) $targetRect.Y $frontWidth $targetRect.Height
  }

  $frontSourceRect = Get-SourceRect $frontImage $frontSpec
  $backSourceRect = Get-SourceRect $backImage $backSpec

  if ($frontOnLeft) {
    Draw-ImageToRectRotated $graphics $frontImage $leftRect $frontSourceRect $rotationDegrees
    Draw-ImageToRectRotated $graphics $backImage $rightRect $backSourceRect $rotationDegrees
  } else {
    Draw-ImageToRectRotated $graphics $backImage $leftRect $backSourceRect $rotationDegrees
    Draw-ImageToRectRotated $graphics $frontImage $rightRect $frontSourceRect $rotationDegrees
  }
}

function Draw-StructuredSleeve($graphics, $image, $targetRect, $numberSpec) {
  $blackBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 16, 16, 16))
  $yellowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 228, 185, 26))

  $graphics.FillRectangle($blackBrush, $targetRect)

  $bandRect = New-RectF `
    $targetRect.X `
    ($targetRect.Y + ($targetRect.Height * 0.30)) `
    $targetRect.Width `
    ($targetRect.Height * 0.54)

  $graphics.FillRectangle($yellowBrush, $bandRect)

  $numberRect = New-RectF `
    ($bandRect.X + ($bandRect.Width * 0.10)) `
    ($bandRect.Y + ($bandRect.Height * 0.06)) `
    ($bandRect.Width * 0.80) `
    ($bandRect.Height * 0.78)

  Draw-ImageToRectRotated $graphics $image $numberRect (Get-SourceRect $image $numberSpec) 0

  $yellowBrush.Dispose()
  $blackBrush.Dispose()
}

function Compose-UvTexture(
  $frontPath,
  $backPath,
  $outputPath,
  $frontNudgeX = 0.0,
  $jerseyId = '',
  $config = $null
) {
  $targetRects = @{
    frontSleeveLeft  = (New-RectF 320 142 582 320)
    frontSleeveRight = (New-RectF 1146 142 582 320)
    cuffLeft         = (New-RectF 214 430 736 100)
    cuffRight        = (New-RectF 1098 430 736 100)
    collar           = (New-RectF 532 595 1057 60)
    frontTorso       = (New-RectF 154 772 850 1145)
    backTorso        = (New-RectF 1044 772 850 1145)
    hemLeft          = (New-RectF 114 1935 910 77)
    hemRight         = (New-RectF 1024 1935 910 77)
  }

  $sleeveFrontRatio = 0.9
  $cuffFrontRatio = 0.88
  $sleeveRotationLeft = 0.0
  $sleeveRotationRight = 0.0
  $cuffRotationLeft = 0.0
  $cuffRotationRight = 0.0
  $structuredSleeves = $false
  $structuredSleeveLeft = $null
  $structuredSleeveRight = $null
  $singleFrontSleeves = $false

  $frontSource = @{
    torso       = @{ x = 0.18 + $frontNudgeX; y = 0.06; w = 0.64; h = 0.88 }
    sleeveLeft  = @{ x = 0.03; y = 0.18; w = 0.29; h = 0.47 }
    sleeveRight = @{ x = 0.68; y = 0.18; w = 0.29; h = 0.47 }
    cuffLeft    = @{ x = 0.02; y = 0.58; w = 0.32; h = 0.11 }
    cuffRight   = @{ x = 0.66; y = 0.58; w = 0.32; h = 0.11 }
    collar      = @{ x = 0.30; y = 0.00; w = 0.40; h = 0.16 }
    hem         = @{ x = 0.16; y = 0.86; w = 0.68; h = 0.10 }
  }

  $backSource = @{
    torso       = @{ x = 0.18; y = 0.06; w = 0.64; h = 0.88 }
    sleeveLeft  = @{ x = 0.03; y = 0.18; w = 0.29; h = 0.47 }
    sleeveRight = @{ x = 0.68; y = 0.18; w = 0.29; h = 0.47 }
    cuffLeft    = @{ x = 0.02; y = 0.58; w = 0.32; h = 0.11 }
    cuffRight   = @{ x = 0.66; y = 0.58; w = 0.32; h = 0.11 }
    hem         = @{ x = 0.16; y = 0.86; w = 0.68; h = 0.10 }
  }

  if ($config) {
    if ($config.targetRects) {
      foreach ($key in $config.targetRects.Keys) {
        $rect = $config.targetRects[$key]
        $targetRects[$key] = (New-RectF $rect.x $rect.y $rect.w $rect.h)
      }
    }
    if ($config.frontSource) {
      foreach ($key in $config.frontSource.Keys) {
        $frontSource[$key] = $config.frontSource[$key]
      }
    }
    if ($config.backSource) {
      foreach ($key in $config.backSource.Keys) {
        $backSource[$key] = $config.backSource[$key]
      }
    }
    if ($config.sleeveFrontRatio) { $sleeveFrontRatio = $config.sleeveFrontRatio }
    if ($config.cuffFrontRatio) { $cuffFrontRatio = $config.cuffFrontRatio }
    if ($config.sleeveRotationLeft -ne $null) { $sleeveRotationLeft = $config.sleeveRotationLeft }
    if ($config.sleeveRotationRight -ne $null) { $sleeveRotationRight = $config.sleeveRotationRight }
    if ($config.cuffRotationLeft -ne $null) { $cuffRotationLeft = $config.cuffRotationLeft }
    if ($config.cuffRotationRight -ne $null) { $cuffRotationRight = $config.cuffRotationRight }
    if ($config.structuredSleeves) { $structuredSleeves = $true }
    if ($config.structuredSleeveLeft) { $structuredSleeveLeft = $config.structuredSleeveLeft }
    if ($config.structuredSleeveRight) { $structuredSleeveRight = $config.structuredSleeveRight }
    if ($config.singleFrontSleeves) { $singleFrontSleeves = $true }
  }

  $canvas = New-Object System.Drawing.Bitmap 2048, 2048, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  $graphics.Clear([System.Drawing.Color]::FromArgb(255, 16, 16, 16))
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  $front = [System.Drawing.Image]::FromFile($frontPath)
  $back = [System.Drawing.Image]::FromFile($backPath)

  $graphics.DrawImage($front, $targetRects.frontTorso, (Get-SourceRect $front $frontSource.torso), [System.Drawing.GraphicsUnit]::Pixel)
  $graphics.DrawImage($back, $targetRects.backTorso, (Get-SourceRect $back $backSource.torso), [System.Drawing.GraphicsUnit]::Pixel)

  if ($structuredSleeves -and $structuredSleeveLeft -and $structuredSleeveRight) {
    Draw-StructuredSleeve $graphics $front $targetRects.frontSleeveLeft $structuredSleeveLeft
    Draw-StructuredSleeve $graphics $front $targetRects.frontSleeveRight $structuredSleeveRight
  } elseif ($singleFrontSleeves) {
    Draw-ImageToRectRotated $graphics $front $targetRects.frontSleeveLeft (Get-SourceRect $front $frontSource.sleeveLeft) $sleeveRotationLeft
    Draw-ImageToRectRotated $graphics $front $targetRects.frontSleeveRight (Get-SourceRect $front $frontSource.sleeveRight) $sleeveRotationRight
  } else {
    Draw-HalfComposite $graphics $front $back $targetRects.frontSleeveLeft $frontSource.sleeveLeft $backSource.sleeveLeft $true $sleeveFrontRatio $sleeveRotationLeft
    Draw-HalfComposite $graphics $front $back $targetRects.frontSleeveRight $frontSource.sleeveRight $backSource.sleeveRight $false $sleeveFrontRatio $sleeveRotationRight
  }
  Draw-HalfComposite $graphics $front $back $targetRects.cuffLeft $frontSource.cuffLeft $backSource.cuffLeft $true $cuffFrontRatio $cuffRotationLeft
  Draw-HalfComposite $graphics $front $back $targetRects.cuffRight $frontSource.cuffRight $backSource.cuffRight $false $cuffFrontRatio $cuffRotationRight
  $graphics.DrawImage($front, $targetRects.collar, (Get-SourceRect $front $frontSource.collar), [System.Drawing.GraphicsUnit]::Pixel)

  $graphics.DrawImage($front, $targetRects.hemLeft, (Get-SourceRect $front $frontSource.hem), [System.Drawing.GraphicsUnit]::Pixel)
  $graphics.DrawImage($back, $targetRects.hemRight, (Get-SourceRect $back $backSource.hem), [System.Drawing.GraphicsUnit]::Pixel)

  $front.Dispose()
  $back.Dispose()
  $graphics.Dispose()
  $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Dispose()
}

$jerseys = @(
  @{
    id = 'black-canarinho'
    front = 'Black Canarinho(front).png'
    back = 'Black Canarinho(Back).png'
    frontRect = @{ offsetX = -0.02; offsetY = 0.0; scaleX = 1.0; scaleY = 1.0 }
    backRect = @{ offsetX = 0.0; offsetY = 0.0; scaleX = 1.0; scaleY = 1.0 }
    frontSign = 1
    config = @{
      targetRects = @{
        frontSleeveLeft  = @{ x = 326; y = 154; w = 570; h = 292 }
        frontSleeveRight = @{ x = 1152; y = 154; w = 570; h = 292 }
        cuffLeft         = @{ x = 208; y = 404; w = 744; h = 140 }
        cuffRight        = @{ x = 1096; y = 404; w = 744; h = 140 }
      }
      frontSource = @{
        torso     = @{ x = 0.24; y = 0.06; w = 0.52; h = 0.88 }
        sleeveLeft  = @{ x = 0.02; y = 0.20; w = 0.30; h = 0.40 }
        sleeveRight = @{ x = 0.68; y = 0.20; w = 0.30; h = 0.40 }
        cuffLeft  = @{ x = 0.00; y = 0.64; w = 0.24; h = 0.16 }
        cuffRight = @{ x = 0.76; y = 0.64; w = 0.24; h = 0.16 }
      }
      backSource = @{
        torso     = @{ x = 0.24; y = 0.06; w = 0.52; h = 0.88 }
        sleeveLeft  = @{ x = 0.02; y = 0.20; w = 0.30; h = 0.40 }
        sleeveRight = @{ x = 0.68; y = 0.20; w = 0.30; h = 0.40 }
        cuffLeft  = @{ x = 0.00; y = 0.64; w = 0.24; h = 0.16 }
        cuffRight = @{ x = 0.76; y = 0.64; w = 0.24; h = 0.16 }
      }
      sleeveFrontRatio = 0.96
      cuffFrontRatio = 0.96
      sleeveRotationLeft = 0
      sleeveRotationRight = 0
      cuffRotationLeft = 0
      cuffRotationRight = 0
      singleFrontSleeves = $true
    }
  },
  @{
    id = 'golden-albiceleste'
    front = 'Golden Albiceleste(front).png'
    back = 'Golden Albiceleste(back).png'
    frontRect = @{ offsetX = 0.0; offsetY = 0.0; scaleX = 1.0; scaleY = 1.0 }
    backRect = @{ offsetX = 0.0; offsetY = 0.0; scaleX = 1.0; scaleY = 1.0 }
    frontSign = 1
  },
  @{
    id = 'le-phantom'
    front = 'Le Phantom(Front).png'
    back = 'Le Phantom(Back).png'
    frontRect = @{ offsetX = 0.0; offsetY = 0.0; scaleX = 1.0; scaleY = 1.0 }
    backRect = @{ offsetX = 0.0; offsetY = 0.0; scaleX = 1.0; scaleY = 1.0 }
    frontSign = 1
  },
  @{
    id = 'lusitano-prime'
    front = 'Lusitano Prime(front).png'
    back = 'Lusitano Prime(back).png'
    frontRect = @{ offsetX = 0.0; offsetY = 0.0; scaleX = 1.0; scaleY = 1.0 }
    backRect = @{ offsetX = 0.0; offsetY = 0.0; scaleX = 1.0; scaleY = 1.0 }
    frontSign = 1
  }
)

foreach ($jersey in $jerseys) {
  $frontPath = Join-Path $textureDir $jersey.front
  $backPath = Join-Path $textureDir $jersey.back
  $outputPath = Join-Path $bakedDir "$($jersey.id)-baked.png"
  Compose-UvTexture $frontPath $backPath $outputPath $jersey.frontRect.offsetX $jersey.id $jersey.config
}

$manifestPath = Join-Path $finalDir 'manifest.json'
$manifest = Get-Content $manifestPath | ConvertFrom-Json
foreach ($item in $manifest) {
  $item | Add-Member -NotePropertyName bakedTexture -NotePropertyValue ("public/textures/final-3d/baked/{0}-baked.png" -f $item.id) -Force
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -Path $manifestPath -Encoding UTF8

Write-Host "Baked oversized UV textures into $bakedDir"
