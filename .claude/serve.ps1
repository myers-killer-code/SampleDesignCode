# Tiny local web server for previewing the site on Windows (no Python needed).
param([int]$Port = 8000)

$root = Split-Path $PSScriptRoot -Parent
$types = @{
  ".html" = "text/html"; ".css" = "text/css"; ".js" = "text/javascript"; ".json" = "application/json"
  ".jpg" = "image/jpeg"; ".jpeg" = "image/jpeg"; ".png" = "image/png"; ".gif" = "image/gif"
  ".webp" = "image/webp"; ".svg" = "image/svg+xml"; ".mp4" = "video/mp4"; ".webm" = "video/webm"; ".mov" = "video/quicktime"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart("/"))
  if ($path -eq "") { $path = "index.html" }
  $file = [IO.Path]::GetFullPath((Join-Path $root $path))
  try {
    if ($file.StartsWith($root) -and (Test-Path $file -PathType Leaf)) {
      $bytes = [IO.File]::ReadAllBytes($file)
      $ext = [IO.Path]::GetExtension($file).ToLower()
      $ctx.Response.ContentType = if ($types[$ext]) { $types[$ext] } else { "application/octet-stream" }
      $ctx.Response.Headers.Add("Cache-Control", "no-store")
      $ctx.Response.Headers.Add("Accept-Ranges", "bytes")
      # Range requests let the browser seek inside videos
      $start, $end = 0, ($bytes.Length - 1)
      $range = $ctx.Request.Headers["Range"]
      if ($range -match "bytes=(\d*)-(\d*)") {
        if ($matches[1]) {
          $start = [int64]$matches[1]
          if ($matches[2]) { $end = [Math]::Min([int64]$matches[2], $bytes.Length - 1) }
        } elseif ($matches[2]) {
          $start = [Math]::Max(0, $bytes.Length - [int64]$matches[2])
        }
        $ctx.Response.StatusCode = 206
        $ctx.Response.Headers.Add("Content-Range", "bytes $start-$end/$($bytes.Length)")
      }
      $ctx.Response.ContentLength64 = $end - $start + 1
      $ctx.Response.OutputStream.Write($bytes, $start, $end - $start + 1)
    } else {
      $ctx.Response.StatusCode = 404
    }
  } catch {} finally { $ctx.Response.Close() }
}
