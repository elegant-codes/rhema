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

export function autoFormatLyrics(rawText: string): string {
  if (!rawText) return ""

  // 1. Normalize line endings and trim
  let lines = rawText.replace(/\r\n/g, "\n").split("\n")
  
  const formattedLines: string[] = []
  const headerRegex = /^(Chorus|Verse\s*\d*|Bridge\s*\d*|Pre-?Chorus|Tag|Ending|Intro|Outro|Hook|Vamp|Interlude)[\s:]*$/i
  let currentBlock: string[] = []

  const flushBlock = () => {
    if (currentBlock.length > 0) {
      // Chunk large blocks into max 4 lines
      for (let i = 0; i < currentBlock.length; i += 4) {
        if (i > 0) formattedLines.push("") // Add blank line between chunks
        formattedLines.push(...currentBlock.slice(i, i + 4))
      }
      currentBlock = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (!line) {
      if (currentBlock.length > 0) {
        flushBlock()
        formattedLines.push("") // Preserve natural block separation
      }
      continue
    }

    // Check if it's a header
    const headerMatch = line.match(headerRegex)
    if (headerMatch) {
      flushBlock()
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== "") {
        formattedLines.push("") // Ensure blank line before header
      }
      // Capitalize first letter of each word (e.g., "pre chorus" -> "Pre Chorus")
      const formattedHeader = headerMatch[1].replace(/\b\w/g, c => c.toUpperCase())
      formattedLines.push(`[${formattedHeader}]`)
      continue
    }

    // Also preserve existing bracketed headers
    if (line.match(/^\[(.*?)\]$/)) {
      flushBlock()
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== "") {
        formattedLines.push("")
      }
      formattedLines.push(line)
      continue
    }

    currentBlock.push(line)
  }

  flushBlock()

  // Clean up excessive blank lines (more than 2)
  return formattedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}
