import type { SongSlide } from "@/types/broadcast"

export function splitSongIntoSlides(content: string): SongSlide[] {
  if (!content) return []

  const lines = content.split(/\r?\n/)
  const slides: SongSlide[] = []
  
  let currentLabel = "Slide"
  let currentBlock: string[] = []
  let verseCounter = 1

  const flushBlock = () => {
    if (currentBlock.length > 0) {
      const text = currentBlock.join("\n").trim()
      if (text) {
        slides.push({
          id: crypto.randomUUID(),
          label: currentLabel === "Slide" ? `Verse ${verseCounter++}` : currentLabel,
          text,
        })
      }
      currentBlock = []
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()
    
    // Check for section header like [Chorus] or Chorus:
    const headerMatch = trimmed.match(/^\[(.*?)\]$|^([^:\n]+):$/)
    if (headerMatch) {
      flushBlock() // Flush whatever we had before the new header
      const tag = (headerMatch[1] || headerMatch[2]).trim()
      // Title case it nicely if we want, but let's just use what they typed
      currentLabel = tag
      continue
    }

    if (trimmed === "") {
      // Empty line means end of a slide block
      flushBlock()
    } else {
      currentBlock.push(line) // keep original leading spaces if any
    }
  }

  flushBlock()

  return slides
}
