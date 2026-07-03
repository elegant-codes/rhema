import { useRef, useEffect, useState, memo } from "react"
import { renderVerse, renderAlert } from "@/lib/verse-renderer"
import type { BroadcastTheme, VerseRenderData } from "@/types"
import { cn } from "@/lib/utils"

interface CanvasVerseProps {
  theme: BroadcastTheme
  verse: VerseRenderData | null
  alert?: string | null
  className?: string
}

export const CanvasVerse = memo(function CanvasVerse({
  theme,
  verse,
  alert,
  className,
}: CanvasVerseProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  
  const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement | HTMLVideoElement>>(new Map())
  const [imageLoaded, setImageLoaded] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

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
    if (bg.type !== "image" || !bg.image?.url) {
      setIsVideoPlaying(false)
      return
    }
    const url = bg.image.url
    const isVideo = /\.(mp4|webm)$/i.test(url)
    
    if (imageCache.has(url)) {
      if (isVideo) setIsVideoPlaying(true)
      return
    }

    const loadMedia = (srcUrl: string) => {
      if (isVideo) {
        const vid = document.createElement('video')
        vid.muted = true
        vid.loop = true
        vid.playsInline = true
        vid.onloadeddata = () => {
          setImageCache((prev) => {
            const next = new Map(prev)
            next.set(url, vid)
            return next
          })
          setIsVideoPlaying(true)
          vid.play().catch(console.error)
          setImageLoaded((n) => n + 1)
        }
        vid.onerror = () => console.warn("Failed to load video", srcUrl)
        vid.src = srcUrl
        vid.load()
      } else {
        const img = new Image()
        img.onload = () => {
          setImageCache((prev) => {
            const next = new Map(prev)
            next.set(url, img)
            return next
          })
          setImageLoaded((n) => n + 1)
        }
        img.onerror = () => console.warn("Failed to load image", srcUrl)
        img.src = srcUrl
      }
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
          else if (ext === 'mp4') type = 'video/mp4';
          else if (ext === 'webm') type = 'video/webm';
          const blob = new Blob([bytes], { type });
          loadMedia(URL.createObjectURL(blob))
        }).catch(() => loadMedia(url))
      })
    } else {
      loadMedia(url)
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
    
    let animationFrameId: number;

    const render = (time: number = performance.now()) => {
      renderVerse(ctx, theme, verse, { scale, imageCache })
      if (alert) {
        renderAlert(ctx, displayW, displayH, alert, time)
      }
      if (isVideoPlaying || alert) {
        animationFrameId = requestAnimationFrame(render)
      }
    }

    render()

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [theme, verse, alert, containerWidth, imageCache, imageLoaded, isVideoPlaying])

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      <canvas ref={canvasRef} className="w-full rounded-md" />
    </div>
  )
})
