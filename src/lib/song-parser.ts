import { autoFormatLyrics } from "./lyrics-utils"

export type ParsedSongResult = {
  title: string
  artist: string
  formContent: string
}

export function parseTxt(filename: string, content: string): ParsedSongResult {
  // Try to remove extension and common suffixes for the title
  let title = filename.replace(/\.(txt|md)$/i, "")
  let artist = ""
  
  // If filename is "Artist - Title", try to split it
  if (title.includes(" - ")) {
    const parts = title.split(" - ")
    artist = parts[0].trim()
    title = parts.slice(1).join(" - ").trim()
  }

  return {
    title,
    artist,
    formContent: autoFormatLyrics(content)
  }
}

export function parsePro6(content: string): ParsedSongResult {
  const parser = new DOMParser()
  const xml = parser.parseFromString(content, "text/xml")
  
  const root = xml.querySelector("RVPresentationDocument")
  let title = root?.getAttribute("CCLISongTitle") || root?.getAttribute("name") || "Unknown Song"
  let artist = root?.getAttribute("CCLIAuthor") || ""
  
  const formattedLines: string[] = []
  
  // Find all groups (Chorus, Verse 1, etc.)
  const groups = xml.querySelectorAll("RVSlideGrouping")
  groups.forEach(group => {
    const groupName = group.getAttribute("name") || ""
    if (groupName && groupName.trim() !== "") {
      formattedLines.push(`[${groupName}]`)
    }
    
    // Find all slides in this group
    const slides = group.querySelectorAll("RVDisplaySlide")
    slides.forEach(slide => {
      // Find the text elements
      const rtfElements = slide.querySelectorAll("NSString")
      rtfElements.forEach(rtf => {
        const textContent = rtf.textContent
        if (textContent) {
          // Pro6 stores Base64 encoded RTF or plain text in NSString
          // Actually, it usually stores raw RTF or Base64 encoded RTF.
          // Let's try to extract plain text from RTF if it's base64 encoded.
          let decodedText = ""
          try {
            decodedText = atob(textContent)
            // Primitive RTF strip (removes {\rtf1...} and formatting tags)
            decodedText = decodedText.replace(/\\[a-z]+\d*\s?/g, "")
                                     .replace(/[{}]/g, "")
                                     .trim()
          } catch (e) {
            decodedText = textContent // Not base64
          }
          
          if (decodedText.trim() !== "") {
             formattedLines.push(decodedText.trim())
          }
        }
      })
      formattedLines.push("") // Blank line between slides
    })
  })
  
  return {
    title,
    artist,
    formContent: autoFormatLyrics(formattedLines.join("\n"))
  }
}

export function parseOpenLyrics(content: string): ParsedSongResult {
  const parser = new DOMParser()
  const xml = parser.parseFromString(content, "text/xml")
  
  const titleNode = xml.querySelector("properties > titles > title")
  const title = titleNode?.textContent || "Unknown Song"
  
  const authorNode = xml.querySelector("properties > authors > author")
  const artist = authorNode?.textContent || ""
  
  const formattedLines: string[] = []
  
  const verses = xml.querySelectorAll("lyrics > verse")
  verses.forEach(verse => {
    const name = verse.getAttribute("name")
    if (name) {
      // Typically v1, c1, b1, etc. Convert to [Verse 1], [Chorus 1]
      const typeMap: Record<string, string> = {
        "v": "Verse",
        "c": "Chorus",
        "b": "Bridge",
        "p": "Pre-Chorus",
        "t": "Tag",
        "e": "Ending",
        "i": "Intro"
      }
      const match = name.match(/^([a-z])(\d*)$/i)
      if (match) {
        const type = typeMap[match[1].toLowerCase()] || match[1]
        const num = match[2] ? ` ${match[2]}` : ""
        formattedLines.push(`[${type}${num}]`)
      } else {
        formattedLines.push(`[${name}]`)
      }
    }
    
    const lines = verse.querySelectorAll("lines")
    lines.forEach(line => {
      // <lines> can contain <br/> tags
      const htmlContent = line.innerHTML || ""
      const plainText = htmlContent.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "")
      formattedLines.push(plainText.trim())
    })
    formattedLines.push("")
  })
  
  return {
    title,
    artist,
    formContent: autoFormatLyrics(formattedLines.join("\n"))
  }
}
