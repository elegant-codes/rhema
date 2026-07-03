import { PanelHeader } from "@/components/ui/panel-header"
import { CanvasVerse } from "@/components/ui/canvas-verse"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBroadcastStore, useBibleStore } from "@/stores"
import { bibleActions } from "@/hooks/use-bible"
import { toVerseRenderData } from "@/hooks/use-broadcast"

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

  const isBibleVerseActive = isLive && activeSongId === null && liveVerse?.rawVerses && liveVerse.rawVerses.length > 0
  
  const handleNavigateVerse = async (direction: -1 | 1) => {
    if (!liveVerse?.rawVerses || !liveVerse.translationId) return
    const targetVerseNumber = direction === 1
      ? liveVerse.rawVerses[liveVerse.rawVerses.length - 1].verse + 1
      : liveVerse.rawVerses[0].verse - 1

    const currentFirstVerse = liveVerse.rawVerses[0]
    const chapterVerses = await bibleActions.loadChapter(currentFirstVerse.book_number, currentFirstVerse.chapter, liveVerse.translationId)
    const targetVerse = chapterVerses.find((v) => v.verse === targetVerseNumber)
    
    if (targetVerse) {
      bibleActions.selectVerses([targetVerse])
      
      const bibleStore = useBibleStore.getState()
      const translation = bibleStore.translations.find((t) => t.id === liveVerse.translationId)?.abbreviation ?? "KJV"
      const newRenderData = toVerseRenderData([targetVerse], translation)
      useBroadcastStore.getState().setLiveVerse(newRenderData)
      
      import("@/stores").then(({ useHistoryStore }) => {
        useHistoryStore.getState().addItem([targetVerse], liveVerse.translationId!)
      })
      
      // Auto-scroll the preview panel if possible
      document
        .getElementById(`verse-${targetVerse.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" })
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
        <div className="flex items-center gap-4">
          {isBibleVerseActive && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-6 h-6 w-6 rounded-md"
                onClick={() => handleNavigateVerse(-1)}
                title="Previous Verse"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-6 h-6 w-6 rounded-md"
                onClick={() => handleNavigateVerse(1)}
                title="Next Verse"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          )}
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
        </div>
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
