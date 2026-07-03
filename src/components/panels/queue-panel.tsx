import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  PlayIcon,
  XIcon,
  GripVerticalIcon,
  HistoryIcon,
  ListIcon,
} from "lucide-react"
import { useQueueStore, useBroadcastStore, useBibleStore, useHistoryStore } from "@/stores"
import { toVerseRenderData } from "@/hooks/use-broadcast"
import { bibleActions } from "@/hooks/use-bible"
import type { QueueItem } from "@/types"
import type { HistoryItem } from "@/stores/history-store"

function QueueItemRow({
  item,
  index,
  isActive,
  isHighlighted,
}: {
  item: QueueItem
  index: number
  isActive: boolean
  isHighlighted: boolean
}) {
  const handlePresent = () => {
    useQueueStore.getState().setActive(index)
    bibleActions.selectVerse(item.verse)
    const translationId = useBibleStore.getState().activeTranslationId
    const translation = useBibleStore.getState().translations
      .find(t => t.id === translationId)?.abbreviation ?? "KJV"
    useBroadcastStore.getState().setLiveVerse(toVerseRenderData(item.verse, translation))
    useBroadcastStore.getState().setLive(true)
    useHistoryStore.getState().addItem(item.verse, translationId)
  }

  const handleRemove = () => {
    useQueueStore.getState().removeItem(item.id)
  }

  const sourceBadge =
    item.source === "manual" ? (
      <Badge variant="outline" className="shrink-0 text-[0.5rem]">
        Manual
      </Badge>
    ) : (
      <Badge
        variant="default"
        className="shrink-0 bg-ai-direct/15 text-[0.5rem] text-ai-direct hover:bg-ai-direct/15"
      >
        AI
      </Badge>
    )

  return (
    <div
      data-queue-idx={index}
      className={cn(
        "group flex h-10 items-center gap-2 rounded-md px-2.5 transition-colors",
        isHighlighted
          ? "animate-pulse border border-amber-500/40 bg-amber-500/15"
          : isActive
            ? "border border-primary/30 bg-primary/10"
            : "hover:bg-muted/50"
      )}
    >
      <GripVerticalIcon
        className="size-3 shrink-0 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100"
      />

      <span className="flex-1 truncate text-sm font-medium text-foreground">
        {item.reference}
      </span>

      {sourceBadge}

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon-xs" onClick={handlePresent}>
          <PlayIcon className="size-2.5" />
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={handleRemove}>
          <XIcon className="size-2.5" />
        </Button>
      </div>
    </div>
  )
}

function HistoryItemRow({ item }: { item: HistoryItem }) {
  const translations = useBibleStore((s) => s.translations)
  const translationAbbrev = translations.find(t => t.id === item.translationId)?.abbreviation ?? "KJV"
  const reference = `${item.verse.book_name} ${item.verse.chapter}:${item.verse.verse} (${translationAbbrev})`

  const handlePreview = () => {
    bibleActions.selectVerse(item.verse)
  }

  const handlePresent = (e: React.MouseEvent) => {
    e.stopPropagation()
    bibleActions.selectVerse(item.verse)
    useBroadcastStore.getState().setLiveVerse(toVerseRenderData(item.verse, translationAbbrev))
    useBroadcastStore.getState().setLive(true)
    // No need to add it to history again if it's the exact same item, 
    // but doing so will bump it to the top anyway which is expected behavior.
    useHistoryStore.getState().addItem(item.verse, item.translationId)
  }

  const timeAgo = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const diffInMinutes = Math.round((item.timestamp - Date.now()) / 60000)
  const timeString = diffInMinutes === 0 ? 'just now' : timeAgo.format(diffInMinutes, 'minute')

  return (
    <div
      onClick={handlePreview}
      onDoubleClick={handlePresent}
      className="group flex h-10 cursor-pointer items-center gap-2 rounded-md px-2.5 transition-colors hover:bg-muted/50"
    >
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <span className="truncate text-sm font-medium text-foreground">
          {reference}
        </span>
      </div>

      <span className="shrink-0 text-[0.65rem] text-muted-foreground mr-1">
        {timeString}
      </span>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon-xs" onClick={handlePresent}>
          <PlayIcon className="size-2.5" />
        </Button>
      </div>
    </div>
  )
}

export function QueuePanel() {
  const [activeTab, setActiveTab] = useState<"queue" | "history">("queue")

  const items = useQueueStore((s) => s.items)
  const activeIndex = useQueueStore((s) => s.activeIndex)
  const highlightedId = useQueueStore((s) => s.highlightedId)

  const historyItems = useHistoryStore((s) => s.items)

  return (
    <div
      data-slot="queue-panel"
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-card"
    >
      {/* Custom Tabs Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/20 px-1 py-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("queue")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === "queue"
                ? "bg-background text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <ListIcon className="size-3.5" />
            Queue
            {items.length > 0 && activeTab !== "queue" && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[0.6rem]">{items.length}</Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === "history"
                ? "bg-background text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <HistoryIcon className="size-3.5" />
            History
          </button>
        </div>

        <div className="px-2">
          {activeTab === "queue" ? (
            <button
              onClick={() => useQueueStore.getState().clearQueue()}
              className="text-[0.625rem] text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear queue
            </button>
          ) : (
            <button
              onClick={() => useHistoryStore.getState().clearHistory()}
              className="text-[0.625rem] text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear history
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-0.5 p-1.5">
          {activeTab === "queue" && (
            <>
              {items.length === 0 && (
                <p className="p-4 text-center text-xs text-muted-foreground mt-4">
                  Verses will appear here when detected or queued
                </p>
              )}
              {items.map((item, idx) => (
                <QueueItemRow
                  key={item.id}
                  item={item}
                  index={idx}
                  isActive={idx === activeIndex}
                  isHighlighted={item.id === highlightedId}
                />
              ))}
            </>
          )}

          {activeTab === "history" && (
            <>
              {historyItems.length === 0 && (
                <p className="p-4 text-center text-xs text-muted-foreground mt-4">
                  No recently projected verses
                </p>
              )}
              {historyItems.map((item) => (
                <HistoryItemRow key={item.id} item={item} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
