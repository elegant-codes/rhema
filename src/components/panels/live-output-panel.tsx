import { PanelHeader } from "@/components/ui/panel-header"
import { CanvasVerse } from "@/components/ui/canvas-verse"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useBroadcastStore } from "@/stores"

export function LiveOutputPanel() {
  const isLive = useBroadcastStore((s) => s.isLive)
  const themes = useBroadcastStore((s) => s.themes)
  const activeThemeId = useBroadcastStore((s) => s.activeThemeId)
  const liveImage = useBroadcastStore((s) => s.liveImage)
  const liveImageFit = useBroadcastStore((s) => s.liveImageFit)
  const showVerseOnMedia = useBroadcastStore((s) => s.showVerseOnMedia)
  const songs = useBroadcastStore((s) => s.songs)
  const activeSongId = useBroadcastStore((s) => s.activeSongId)
  const activeSlideIndex = useBroadcastStore((s) => s.activeSlideIndex)

  const liveVerse = useBroadcastStore((s) => s.liveVerse)

  let activeTheme = themes.find((t) => t.id === activeThemeId) ?? themes[0]
  if (isLive && liveImage) {
    activeTheme = {
      ...activeTheme,
      background: {
        type: "image",
        image: { url: liveImage, fit: liveImageFit, blur: 0, brightness: 100, tint: null },
        color: "#000000",
        gradient: null,
      },
    }
  }

  let verseData = isLive ? liveVerse : null

  // If media is live and overlay is disabled, hide the verse text in the preview
  if (isLive && liveImage && !showVerseOnMedia) {
    verseData = null
  }

  // Handle active song slide
  if (isLive && activeSongId !== null && activeSlideIndex !== null) {
    const song = songs.find((sg) => sg.id === activeSongId)
    const slide = song?.slides[activeSlideIndex]
    if (slide) {
      verseData = {
        reference: song?.title || "",
        segments: [{ text: slide, verseNumber: 0 }],
      }
    }
  }

  return (
    <div
      data-slot="live-output-panel"
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card",
        isLive && "shadow-[inset_0_2px_0_0_rgba(16,185,129,0.3)]"
      )}
    >
      <PanelHeader title="Live display">
        <label className="flex items-center gap-2">
          <span
            className={cn(
              "text-[0.625rem] font-medium uppercase tracking-wider transition-colors",
              isLive ? "text-emerald-400" : "text-muted-foreground"
            )}
          >
            {isLive ? "Live" : "Go live"}
          </span>
          <Switch
            checked={isLive}
            onCheckedChange={(checked) =>
              useBroadcastStore.getState().setLive(checked)
            }
            className="data-[state=checked]:bg-emerald-500"
          />
        </label>
      </PanelHeader>

      <div
        className={cn(
          "flex min-h-0 flex-1 items-center justify-center p-3 transition-opacity",
          !isLive && "opacity-40"
        )}
      >
        <CanvasVerse theme={activeTheme} verse={verseData} />
      </div>
    </div>
  )
}
