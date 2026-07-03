import { useEffect } from "react"
import { useBroadcastStore } from "@/stores"

export function useLyricsHotkeys() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if user is typing in an input or textarea
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return
      }

      const store = useBroadcastStore.getState()
      const { activeSongId, activeSlideIndex, songs, setLiveSongSlide } = store
      
      if (!activeSongId) return

      const activeSong = songs.find(s => s.id === activeSongId)
      if (!activeSong || activeSong.slides.length === 0) return

      const slides = activeSong.slides
      const currentIdx = activeSlideIndex ?? -1

      // Helper to jump to the first occurrence of a specific tag type
      // or cycle to the next occurrence if already on one.
      const jumpToTag = (tagPrefixes: string[]) => {
        // Find all slides matching any of the prefixes
        const matchingIndices = slides
          .map((s, i) => {
            const labelLower = s.label.toLowerCase()
            const match = tagPrefixes.some(prefix => labelLower.includes(prefix.toLowerCase()))
            return match ? i : -1
          })
          .filter(i => i !== -1)

        if (matchingIndices.length === 0) return

        // If we are currently on a matching slide, jump to the NEXT matching slide (cycling)
        const currentMatchIdx = matchingIndices.indexOf(currentIdx)
        if (currentMatchIdx !== -1) {
          const nextMatchIdx = (currentMatchIdx + 1) % matchingIndices.length
          setLiveSongSlide(activeSongId, matchingIndices[nextMatchIdx])
        } else {
          // Jump to the first matching slide
          setLiveSongSlide(activeSongId, matchingIndices[0])
        }
      }

      switch (e.key.toLowerCase()) {
        case "c":
          jumpToTag(["chorus"])
          break
        case "v":
          jumpToTag(["verse"])
          break
        case "b":
          jumpToTag(["bridge"])
          break
        case "p":
          jumpToTag(["pre-chorus", "prechorus"])
          break
        case "t":
          jumpToTag(["tag"])
          break
        case "e":
          jumpToTag(["ending", "outro"])
          break
        case "i":
          jumpToTag(["intro"])
          break
        case "arrowright":
        case " ":
          e.preventDefault() // prevent page scroll
          if (currentIdx < slides.length - 1) {
            setLiveSongSlide(activeSongId, currentIdx + 1)
          }
          break
        case "arrowleft":
          e.preventDefault()
          if (currentIdx > 0) {
            setLiveSongSlide(activeSongId, currentIdx - 1)
          } else if (currentIdx === 0) {
             setLiveSongSlide(null, null) // clear screen
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])
}
