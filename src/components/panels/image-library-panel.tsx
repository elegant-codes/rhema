import { useState, useEffect, useCallback, useRef } from "react"
import { open } from "@tauri-apps/plugin-dialog"
import { readFile, stat } from "@tauri-apps/plugin-fs"
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow"
import { useBroadcastStore } from "@/stores"
import { Button } from "@/components/ui/button"
import { PlusIcon, TrashIcon, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

function getMimeType(path: string) {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'bmp': return 'image/bmp';
    case 'avif': return 'image/avif';
    case 'mp4': return 'video/mp4';
    case 'webm': return 'video/webm';
    default: return 'application/octet-stream';
  }
}

const isVideo = (path: string) => /\.(mp4|webm)$/i.test(path);

function LocalMedia({ path, ...props }: { path: string } & React.HTMLAttributes<HTMLElement>) {
  const [src, setSrc] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    readFile(path).then((bytes) => {
      if (!active) return;
      if (bytes.length > 50 * 1024 * 1024) {
        console.warn(`File is too large (${Math.round(bytes.length / 1024 / 1024)}MB): ${path}`)
        return;
      }
      const blob = new Blob([bytes], { type: getMimeType(path) });
      objectUrl = URL.createObjectURL(blob);
      setSrc(objectUrl);
    }).catch((err) => {
      console.warn("Failed to load local media:", err)
    });
    
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  if (!src) return <div className="h-full w-full bg-muted animate-pulse" />;
  
  if (isVideo(path)) {
    return <video src={src} autoPlay muted loop playsInline {...props as React.VideoHTMLAttributes<HTMLVideoElement>} />;
  }
  return <img src={src} {...props as React.ImgHTMLAttributes<HTMLImageElement>} />;
}

export function ImageLibraryPanel() {
  const imageLibrary = useBroadcastStore((s) => s.imageLibrary)
  const liveImage = useBroadcastStore((s) => s.liveImage)
  const addImageToLibrary = useBroadcastStore((s) => s.addImageToLibrary)
  const removeImageFromLibrary = useBroadcastStore((s) => s.removeImageFromLibrary)
  const setLiveImage = useBroadcastStore((s) => s.setLiveImage)
  const liveImageFit = useBroadcastStore((s) => s.liveImageFit)
  const setLiveImageFit = useBroadcastStore((s) => s.setLiveImageFit)
  const showVerseOnMedia = useBroadcastStore((s) => s.showVerseOnMedia)
  const setShowVerseOnMedia = useBroadcastStore((s) => s.setShowVerseOnMedia)
  
  const [isDragging, setIsDragging] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Listen for Tauri drop events
  useEffect(() => {
    let unlisten: () => void
    const setupListener = async () => {
      unlisten = await getCurrentWebviewWindow().onDragDropEvent(async (event) => {
        if (event.payload.type === 'drop') {
          setIsDragging(false)
          const paths = event.payload.paths.filter((p) =>
            /\.(png|jpe?g|webp|gif|bmp|avif|mp4|webm)$/i.test(p)
          )
          
          if (paths.length > 0) {
            const validPaths: string[] = []
            for (const p of paths) {
              try {
                const info = await stat(p)
                if (info.size <= 50 * 1024 * 1024) {
                  validPaths.push(p)
                } else {
                  console.warn(`File skipped (over 50MB): ${p}`)
                }
              } catch (e) {
                console.warn("Failed to stat file, skipping size check:", e)
                validPaths.push(p)
              }
            }
            if (validPaths.length > 0) {
              addImageToLibrary(validPaths)
            }
          }
        } else if (event.payload.type === 'enter' || event.payload.type === 'over') {
          setIsDragging(true)
        } else if (event.payload.type === 'leave') {
          setIsDragging(false)
        }
      })
    }
    setupListener()

    return () => {
      if (unlisten) unlisten()
    }
  }, [addImageToLibrary])

  const handleOpenDialog = useCallback(async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Media",
            extensions: ["png", "jpeg", "jpg", "webp", "gif", "bmp", "avif", "mp4", "webm"],
          },
        ],
      })

      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected]
        const validPaths: string[] = []
        for (const p of paths) {
          try {
            const info = await stat(p)
            if (info.size <= 50 * 1024 * 1024) {
              validPaths.push(p)
            } else {
              console.warn(`File skipped (over 50MB): ${p}`)
            }
          } catch (e) {
            console.warn("Failed to stat file, skipping size check:", e)
            validPaths.push(p)
          }
        }
        if (validPaths.length > 0) addImageToLibrary(validPaths)
      }
    } catch (err) {
      console.error("Failed to open file dialog", err)
    }
  }, [addImageToLibrary])

  return (
    <div
      ref={panelRef}
      className={cn(
        "flex h-full min-h-0 flex-1 flex-col overflow-hidden transition-colors",
        isDragging && "bg-muted/50 border-emerald-500 border-2 border-dashed"
      )}
    >
      <div className="flex shrink-0 items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ImageIcon className="size-4" />
          Media Library
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2 border-r border-border pr-2">
            <Switch
              id="show-verse-overlay"
              checked={showVerseOnMedia}
              onCheckedChange={setShowVerseOnMedia}
            />
            <label htmlFor="show-verse-overlay" className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap cursor-pointer">
              Verse Overlay
            </label>
          </div>
          <Select value={liveImageFit} onValueChange={(val: any) => setLiveImageFit(val)}>
            <SelectTrigger className="h-8 w[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">Fill</SelectItem>
              <SelectItem value="contain">Fit</SelectItem>
              <SelectItem value="stretch">Stretch</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleOpenDialog} className="h-8 text-xs">
            <PlusIcon className="mr-1.5 size-3.5" />
            Add Media
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {imageLibrary.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border rounded-lg">
            <ImageIcon className="size-8 text-muted-foreground mb-3 opacity-50" />
            <h4 className="text-sm font-medium">No media added</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Drag and drop media here, or click "Add Media" to browse your files. Limit: 50MB per file.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 auto-rows-max">
            {imageLibrary.map((path) => {
              const isLive = liveImage === path
              return (
                <div
                  key={path}
                  onClick={() => {
                    if (isLive) {
                      setLiveImage(null)
                    } else {
                      setLiveImage(path)
                    }
                  }}
                  className={cn(
                    "group relative aspect-video cursor-pointer overflow-hidden rounded-md border-2 bg-muted transition-all",
                    isLive ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-transparent hover:border-muted-foreground/30"
                  )}
                >
                  <LocalMedia
                    path={path}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  
                  {isLive && (
                    <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">
                        Live
                      </span>
                    </div>
                  )}

                  <div className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon-xs"
                            className="size-6 shadow-md"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeImageFromLibrary(path)
                            }}
                          >
                            <TrashIcon className="size-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">Remove image</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Filename banner */}
                  <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-1 text-[10px] truncate px-2 border-t border-border/50">
                    {path.split(/[/\\]/).pop()}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
