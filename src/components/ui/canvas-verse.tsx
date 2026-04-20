import { useRef, useEffect, useState, memo } from "react"
import { renderVerse } from "@/lib/verse-renderer"
import type { BroadcastTheme, VerseRenderData } from "@/types"
import { cn } from "@/lib/utils"

interface CanvasVerseProps {
  theme: BroadcastTheme
  verse: VerseRenderData | null
  className?: string
}

export const CanvasVerse = memo(function CanvasVerse({
  theme,
  verse,
  className,
}: CanvasVerseProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  
  const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map())
  const [imageLoaded, setImageLoaded] = useState(0)

  // Measure container width with ResizeObserver
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      if (w > 0) setContainerWidth(w)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Load background image if needed
  useEffect(() => {
    const bg = theme.background
    if (bg.type !== "image" || !bg.image?.url) return
    const url = bg.image.url
    if (imageCache.has(url)) return

    const img = new Image()
    img.onload = () => {
      setImageCache((prev) => {
        const next = new Map(prev)
        next.set(url, img)
        return next
      })
      setImageLoaded((n) => n + 1)
    }

    if (url.startsWith("/") || url.match(/^[a-zA-Z]:\\/)) {
      import("@tauri-apps/plugin-fs").then(({ readFile }) => {
        readFile(url).then((bytes) => {
          let type = "application/octet-stream";
          const ext = url.split('.').pop()?.toLowerCase();
          if (ext === 'png') type = 'image/png';
          else if (ext === 'jpg' || ext === 'jpeg') type = 'image/jpeg';
          else if (ext === 'webp') type = 'image/webp';
          else if (ext === 'gif') type = 'image/gif';
          const blob = new Blob([bytes], { type });
          img.src = URL.createObjectURL(blob);
        }).catch(() => { img.src = url })
      })
    } else {
      img.src = url
    }
  }, [theme.background, imageCache])

  // Render to canvas at display size
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || containerWidth === 0) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const aspectRatio = theme.resolution.width / theme.resolution.height
    const displayW = containerWidth
    const displayH = displayW / aspectRatio

    canvas.width = displayW * dpr
    canvas.height = displayH * dpr
    canvas.style.width = `${displayW}px`
    canvas.style.height = `${displayH}px`

    ctx.scale(dpr, dpr)
    const scale = displayW / theme.resolution.width
    renderVerse(ctx, theme, verse, { scale, imageCache })
  }, [theme, verse, containerWidth, imageCache, imageLoaded])

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      <canvas ref={canvasRef} className="w-full rounded-md" />
    </div>
  )
})
