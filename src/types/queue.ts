import type { Verse } from "./bible"

export interface BaseQueueItem {
  id: string
  added_at: number
  source: "manual" | "ai-direct" | "ai-semantic" | "ai-cloud"
}

export interface VerseQueueItem extends BaseQueueItem {
  type: "verse"
  verses: Verse[]
  verse?: Verse // Legacy fallback
  reference: string
  confidence: number
  /** True when queued from a chapter-only detection (verse defaults to 1, may be refined). */
  is_chapter_only?: boolean
}

export interface SongQueueItem extends BaseQueueItem {
  type: "song"
  songId: string
  reference: string // Used for display, e.g. "Song Name"
}

export type QueueItem = VerseQueueItem | SongQueueItem
