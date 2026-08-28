import { useState, useEffect } from "react"
import { PanelHeader } from "@/components/ui/panel-header"
import { ConfidenceDot } from "@/components/ui/confidence-dot"
import { Button } from "@/components/ui/button"
import { PlayIcon, PlusIcon } from "lucide-react"
import { useDetection, detectionActions } from "@/hooks/use-detection"
import { bibleActions } from "@/hooks/use-bible"
import { useQueueStore, useBroadcastStore, useBibleStore, useDetectionStore } from "@/stores"
import { toVerseRenderData } from "@/hooks/use-broadcast"
import type { DetectionResult, Verse } from "@/types"

const SOURCE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  direct: { bg: "bg-green-500/15", text: "text-green-600", label: "Direct" },
  semantic: { bg: "bg-indigo-500/15", text: "text-indigo-300", label: "Semantic" },
}

function SourceBadge({ source }: { source: string }) {
  const style = SOURCE_COLORS[source] ?? { bg: "bg-muted", text: "text-muted-foreground", label: source }
  return (
    <span className={`rounded px-1.5 py-0.5 text-[0.5625rem] font-medium uppercase tracking-wider ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
}

function DetectionCard({ detection }: { detection: DetectionResult }) {
  const [localText, setLocalText] = useState(detection.verse_text)
  const activeTranslationId = useBibleStore((s) => s.activeTranslationId)

  useEffect(() => {
    if (detection.verse_text) {
      setLocalText(detection.verse_text)
      return
    }
    if (detection.book_number > 0 && detection.chapter > 0 && detection.verse > 0) {
      bibleActions.fetchVerse(detection.book_number, detection.chapter, detection.verse, activeTranslationId)
        .then((v) => {
          if (v?.text) {
            setLocalText(v.text)
            useDetectionStore.getState().updateDetectionText(detection.verse_ref, v.text)
          }
        })
        .catch(() => {})
    }
  }, [detection.verse_ref, detection.verse_text, detection.book_number, detection.chapter, detection.verse, activeTranslationId])

  const handlePresent = async () => {
    let verseText = localText || detection.verse_text
    let verseObj: Verse | null = null

    if (detection.book_number > 0 && detection.chapter > 0 && detection.verse > 0) {
      verseObj = await bibleActions.fetchVerse(
        detection.book_number,
        detection.chapter,
        detection.verse,
        activeTranslationId
      )
      if (verseObj?.text) {
        verseText = verseObj.text
      }
      bibleActions.navigateToVerse(
        detection.book_number,
        detection.chapter,
        detection.verse
      )
    }

    const finalVerse: Verse = verseObj ?? {
      id: 0,
      translation_id: activeTranslationId,
      book_number: detection.book_number,
      book_name: detection.book_name,
      book_abbreviation: "",
      chapter: detection.chapter,
      verse: detection.verse,
      text: verseText,
    }

    bibleActions.selectVerses([finalVerse])

    const translation = useBibleStore.getState().translations
      .find((t) => t.id === activeTranslationId)?.abbreviation ?? "KJV"
    useBroadcastStore.getState().setLiveVerse(
      toVerseRenderData([finalVerse], translation)
    )
    useBroadcastStore.getState().setLive(true)
    import("@/stores").then(({ useHistoryStore }) => {
      useHistoryStore.getState().addItem([finalVerse], activeTranslationId)
    })
  }

  const handleQueue = async () => {
    let verseText = localText || detection.verse_text
    let verseObj: Verse | null = null

    if (detection.book_number > 0 && detection.chapter > 0 && detection.verse > 0) {
      verseObj = await bibleActions.fetchVerse(
        detection.book_number,
        detection.chapter,
        detection.verse,
        activeTranslationId
      )
      if (verseObj?.text) {
        verseText = verseObj.text
      }
    }

    const finalVerse: Verse = verseObj ?? {
      id: 0,
      translation_id: activeTranslationId,
      book_number: detection.book_number,
      book_name: detection.book_name,
      book_abbreviation: "",
      chapter: detection.chapter,
      verse: detection.verse,
      text: verseText,
    }

    useQueueStore.getState().addItem({
      id: crypto.randomUUID(),
      type: "verse",
      verses: [finalVerse],
      reference: detection.verse_ref,
      confidence: detection.confidence,
      source: detection.source === "direct" ? "ai-direct" : "ai-semantic",
      added_at: Date.now(),
    })
  }

  const textToDisplay = localText || detection.verse_text

  return (
    <div className="border-b border-border p-3 last:border-0">
      <div className="flex items-center gap-2">
        <ConfidenceDot confidence={detection.confidence} />
        <SourceBadge source={detection.source} />
        <span className="text-sm font-semibold text-foreground">
          {detection.verse_ref}
        </span>
      </div>

      {textToDisplay ? (
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {textToDisplay}
        </p>
      ) : null}

      <div className="mt-2 flex gap-2">
        <Button size="sm" className="gap-1" onClick={handlePresent}>
          <PlayIcon className="size-3" />
          Present
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={handleQueue}
        >
          <PlusIcon className="size-3" />
          Queue
        </Button>
      </div>
    </div>
  )
}

export function DetectionsPanel() {
  const { detections } = useDetection()

  return (
    <div
      data-slot="detections-panel"
      className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card"
    >
      <PanelHeader title="Recent detections">
        <button
          onClick={() => detectionActions.clearDetections()}
          className="text-[0.625rem] text-muted-foreground transition-colors hover:text-foreground"
        >
          Clear all
        </button>
      </PanelHeader>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-0">
          {detections.length === 0 && (
            <p className="p-4 text-center text-xs text-muted-foreground">
              Verse detections will appear here during transcription
            </p>
          )}
          {detections.map((detection, i) => (
            <DetectionCard key={`${detection.verse_ref}-${i}`} detection={detection} />
          ))}
        </div>
      </div>
    </div>
  )
}
