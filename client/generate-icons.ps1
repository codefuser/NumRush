Add-Type -AssemblyName System.Drawing

function Draw-NumRushLogo {
    param(
        [System.Drawing.Graphics]$g,
        [float]$cx,
        [float]$cy,
        [float]$radius
    )

    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Hexagon points
    $points = @()
    for ($i = 0; $i -lt 6; $i++) {
        $angle = ($i * 60 - 30) * [Math]::PI / 180
        $px = $cx + $radius * [Math]::Cos($angle)
        $py = $cy + $radius * [Math]::Sin($angle)
        $points += [System.Drawing.PointF]::new($px, $py)
    }

    # Fill Hexagon
    $hexBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 17, 24, 39))
    $g.FillPolygon($hexBrush, $points)

    # Gradient Hexagon Border
    $rect = [System.Drawing.RectangleF]::new($cx - $radius, $cy - $radius, $radius * 2, $radius * 2)
    $gradBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 0, 240, 255),
        [System.Drawing.Color]::FromArgb(255, 139, 92, 246),
        45.0
    )
    $borderPen = [System.Drawing.Pen]::new($gradBrush, [Math]::Max(2.0, $radius * 0.08))
    $g.DrawPolygon($borderPen, $points)

    # Inner Dotted Target Ring
    $innerR = $radius * 0.65
    $innerPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(180, 0, 240, 255), [Math]::Max(1.0, $radius * 0.04))
    $innerPen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
    $g.DrawEllipse($innerPen, $cx - $innerR, $cy - $innerR, $innerR * 2, $innerR * 2)

    # Stylized "N" Letter
    $fontScale = $radius * 0.7
    $font = [System.Drawing.Font]::new("Arial", $fontScale, [System.Drawing.FontStyle]::Bold)
    $textBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
    $sf = [System.Drawing.StringFormat]::new()
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    
    $textRect = [System.Drawing.RectangleF]::new($cx - $radius, $cy - $radius, $radius * 2, $radius * 2)
    $g.DrawString("N", $font, $textBrush, $textRect, $sf)

    # Gold Accent Sparkle / Badge
    $badgeR = $radius * 0.28
    $badgeX = $cx + $radius * 0.55
    $badgeY = $cy - $radius * 0.55
    $badgeBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 245, 158, 11))
    $g.FillEllipse($badgeBrush, $badgeX - $badgeR, $badgeY - $badgeR, $badgeR * 2, $badgeR * 2)
    
    $badgeFont = [System.Drawing.Font]::new("Arial", $badgeR * 1.1, [System.Drawing.FontStyle]::Bold)
    $badgeTextBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::Black)
    $bRect = [System.Drawing.RectangleF]::new($badgeX - $badgeR, $badgeY - $badgeR, $badgeR * 2, $badgeR * 2)
    $g.DrawString("1", $badgeFont, $badgeTextBrush, $bRect, $sf)
}

function Generate-AppIcon {
    param(
        [int]$size,
        [string]$outPath,
        [bool]$isRound = $false,
        [bool]$isForeground = $false
    )

    $bmp = [System.Drawing.Bitmap]::new($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    if (-not $isForeground) {
        # Background
        $bgBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 11, 15, 25))
        if ($isRound) {
            $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
            $path.AddEllipse(0, 0, $size, $size)
            $g.SetClip($path)
            $g.FillRectangle($bgBrush, 0, 0, $size, $size)
        } else {
            $g.FillRectangle($bgBrush, 0, 0, $size, $size)
        }
    }

    $cx = $size / 2.0
    $cy = $size / 2.0
    $radius = if ($isForeground) { $size * 0.32 } else { $size * 0.42 }

    Draw-NumRushLogo -g $g -cx $cx -cy $cy -radius $radius

    $dir = [System.IO.Path]::GetDirectoryName($outPath)
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

function Generate-SplashScreen {
    param(
        [int]$width,
        [int]$height,
        [string]$outPath
    )

    $bmp = [System.Drawing.Bitmap]::new($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Dark Cyber Background
    $bgBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 8, 13, 26))
    $g.FillRectangle($bgBrush, 0, 0, $width, $height)

    # Radial ambient glow
    $glowR = [Math]::Min($width, $height) * 0.45
    $glowRect = [System.Drawing.RectangleF]::new(($width/2) - $glowR, ($height * 0.42) - $glowR, $glowR * 2, $glowR * 2)
    $pather = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $pather.AddEllipse($glowRect)
    $pgb = [System.Drawing.Drawing2D.PathGradientBrush]::new($pather)
    $pgb.CenterColor = [System.Drawing.Color]::FromArgb(40, 0, 240, 255)
    $pgb.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 8, 13, 26))
    $g.FillEllipse($pgb, $glowRect)

    # Logo Center
    $logoR = [Math]::Min($width, $height) * 0.18
    $cx = $width / 2.0
    $cy = $height * 0.42
    Draw-NumRushLogo -g $g -cx $cx -cy $cy -radius $logoR

    # NUMRUSH title
    $titleFont = [System.Drawing.Font]::new("Arial", $logoR * 0.45, [System.Drawing.FontStyle]::Bold)
    $titleBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 0, 240, 255))
    $sf = [System.Drawing.StringFormat]::new()
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $titleRect = [System.Drawing.RectangleF]::new(0, $cy + $logoR * 1.35, $width, $logoR * 0.6)
    $g.DrawString("NUMRUSH", $titleFont, $titleBrush, $titleRect, $sf)

    # Subtitle: SPOT. STRIKE FIRST.
    $subFont = [System.Drawing.Font]::new("Arial", $logoR * 0.18, [System.Drawing.FontStyle]::Bold)
    $subBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(200, 245, 158, 11))
    $subRect = [System.Drawing.RectangleF]::new(0, $cy + $logoR * 1.95, $width, $logoR * 0.35)
    $g.DrawString("SPOT. STRIKE FIRST.", $subFont, $subBrush, $subRect, $sf)

    $dir = [System.IO.Path]::GetDirectoryName($outPath)
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

$resDir = "d:\Projects\NumHunt\client\android\app\src\main\res"

Write-Host "Generating Mipmap Icons..."
$densities = @(
    @{ name="mipmap-mdpi"; size=48; fgSize=108 },
    @{ name="mipmap-hdpi"; size=72; fgSize=162 },
    @{ name="mipmap-xhdpi"; size=96; fgSize=216 },
    @{ name="mipmap-xxhdpi"; size=144; fgSize=324 },
    @{ name="mipmap-xxxhdpi"; size=192; fgSize=432 }
)

foreach ($d in $densities) {
    $folder = Join-Path $resDir $d.name
    Generate-AppIcon -size $d.size -outPath (Join-Path $folder "ic_launcher.png") -isRound $false
    Generate-AppIcon -size $d.size -outPath (Join-Path $folder "ic_launcher_round.png") -isRound $true
    Generate-AppIcon -size $d.fgSize -outPath (Join-Path $folder "ic_launcher_foreground.png") -isForeground $true
    Write-Host "Generated $($d.name)"
}

Write-Host "Generating Splash Screens..."
$splashes = @(
    @{ folder="drawable"; w=480; h=800 },
    @{ folder="drawable-port-mdpi"; w=320; h=480 },
    @{ folder="drawable-port-hdpi"; w=480; h=800 },
    @{ folder="drawable-port-xhdpi"; w=720; h=1280 },
    @{ folder="drawable-port-xxhdpi"; w=960; h=1600 },
    @{ folder="drawable-port-xxxhdpi"; w=1280; h=1920 }
)

foreach ($s in $splashes) {
    $dest = Join-Path (Join-Path $resDir $s.folder) "splash.png"
    Generate-SplashScreen -width $s.w -height $s.h -outPath $dest
    Write-Host "Generated $($s.folder)/splash.png ($($s.w)x$($s.h))"
}

Write-Host "All icons & splash screens generated successfully!"
