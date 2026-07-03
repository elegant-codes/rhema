import { useEffect } from "react"
import { PanelHeader } from "@/components/ui/panel-header"
import { CanvasVerse } from "@/components/ui/canvas-verse"
import { useBibleStore, useBroadcastStore } from "@/stores"
import { bibleActions } from "@/hooks/use-bible"
import { toVerseRenderData } from "@/hooks/use-broadcast"

import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

export function PreviewPanel() {
  const selectedVerses = useBibleStore((s) => s.selectedVerses)
  const translations = useBibleStore((s) => s.translations)
  const activeTranslationId = useBibleStore((s) => s.activeTranslationId)

  // When translation changes, re-fetch the selected verses in the new translation
  useEffect(() => {
    const verses = useBibleStore.getState().selectedVerses
    if (verses.length > 0) {
      Promise.all(verses.map(v => 
        bibleActions.fetchVerse(v.book_number, v.chapter, v.verse)
      )).then(results => {
        const validVerses = results.filter((v): v is NonNullable<typeof v> => v !== null)
        if (validVerses.length > 0) bibleActions.selectVerses(validVerses)
      }).catch(() => {})
    }
  }, [activeTranslationId])
  const themes = useBroadcastStore((s) => s.themes)
  const activeThemeId = useBroadcastStore((s) => s.activeThemeId)

  const activeTheme = themes.find((t) => t.id === activeThemeId) ?? themes[0]
  const translation = translations.find((t) => t.id === activeTranslationId)?.abbreviation ?? "KJV"

  const verseData = selectedVerses.length > 0 ? toVerseRenderData(selectedVerses, translation) : null

  return (
    <div
      data-slot="preview-panel"
      className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card"
    >
      <PanelHeader title="Program preview">
        <Button
          size="sm"
          className="h-7 gap-1.5 text-[0.6875rem] font-medium"
          disabled={!verseData}
          onClick={() => {
            useBroadcastStore.getState().setLiveVerse(verseData)
            useBroadcastStore.getState().setLive(true)
            if (selectedVerses.length > 0) {
              import("@/stores").then(({ useHistoryStore }) => {
                useHistoryStore.getState().addItem(selectedVerses, activeTranslationId)
              })
            }
          }}
        >
          <Send className="size-3" />
          Send to live
        </Button>
      </PanelHeader>
      <div className="flex min-h-0 flex-1 items-center justify-center p-3">
        <CanvasVerse theme={activeTheme} verse={verseData} />
      </div>
    </div>
  )
}
