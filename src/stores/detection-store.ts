import { create } from "zustand"
import type { DetectionResult } from "@/types"

interface DetectionState {
  detections: DetectionResult[]
  autoMode: boolean
  confidenceThreshold: number

  addDetection: (detection: DetectionResult) => void
  addDetections: (detections: DetectionResult[]) => void
  setDetections: (detections: DetectionResult[]) => void
  updateDetectionText: (verseRef: string, text: string) => void
  removeDetection: (verseRef: string) => void
  clearDetections: () => void
  setAutoMode: (auto: boolean) => void
  setConfidenceThreshold: (threshold: number) => void
}

export const useDetectionStore = create<DetectionState>((set) => ({
  detections: [],
  autoMode: false,
  confidenceThreshold: 0.8,

  addDetection: (detection) =>
    set((state) => {
      const existing = state.detections.find((d) => d.verse_ref === detection.verse_ref)
      const mergedDetection: DetectionResult = {
        ...detection,
        verse_text: detection.verse_text || existing?.verse_text || "",
      }
      // Deduplicate: if same verse_ref exists, keep higher confidence at top
      const filtered = state.detections.filter(
        (d) => d.verse_ref !== detection.verse_ref || d.confidence > detection.confidence,
      )
      // If we filtered one out, the new one has higher (or equal) confidence
      if (filtered.length < state.detections.length) {
        return { detections: [mergedDetection, ...filtered].slice(0, 50) }
      }
      // Check if it was already there with higher confidence
      if (existing) {
        // If existing had higher confidence but was missing text, update text
        if (!existing.verse_text && mergedDetection.verse_text) {
          return {
            detections: state.detections.map((d) =>
              d.verse_ref === detection.verse_ref ? { ...d, verse_text: mergedDetection.verse_text } : d
            ),
          }
        }
        return state
      }
      return { detections: [mergedDetection, ...state.detections].slice(0, 50) }
    }),
  addDetections: (incoming) =>
    set((state) => {
      const map = new Map<string, DetectionResult>()
      // Existing first
      for (const d of state.detections) {
        map.set(d.verse_ref, d)
      }
      // Incoming overwrite or merge text
      for (const d of incoming) {
        const existing = map.get(d.verse_ref)
        if (!existing || d.confidence >= existing.confidence) {
          map.set(d.verse_ref, {
            ...d,
            verse_text: d.verse_text || existing?.verse_text || "",
          })
        } else if (!existing.verse_text && d.verse_text) {
          map.set(d.verse_ref, {
            ...existing,
            verse_text: d.verse_text,
          })
        }
      }
      // Sort by confidence so high-confidence direct detections appear above semantic
      return {
        detections: [...map.values()]
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 50),
      }
    }),
  updateDetectionText: (verseRef, text) =>
    set((state) => ({
      detections: state.detections.map((d) =>
        d.verse_ref === verseRef ? { ...d, verse_text: text } : d
      ),
    })),
  setDetections: (detections) => set({ detections }),
  removeDetection: (verseRef) =>
    set((state) => ({
      detections: state.detections.filter((d) => d.verse_ref !== verseRef),
    })),
  clearDetections: () => set({ detections: [] }),
  setAutoMode: (autoMode) => set({ autoMode }),
  setConfidenceThreshold: (confidenceThreshold) =>
    set({ confidenceThreshold }),
}))
