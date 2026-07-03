# Rhema Studio Pro - Feature Guide

Welcome to the feature documentation for Rhema Studio Pro. This guide covers all the powerful, industry-standard capabilities available to you for live worship presentation.

---

## 🎵 Lyrics & Setlist Engine

Rhema's Lyrics engine is built to be fast, reliable, and entirely keyboard-driven during a live service.

### Setlist Builder
- **Queue System**: Easily queue up multiple songs, verses, and media items for your Sunday service.
- **Mix & Match**: Interleave Bible verses and song lyrics in the same Setlist.
- **Worship Control Grid**: When a song is selected, the editor transforms into a non-linear control grid. Click any section (Verse 1, Chorus, Bridge) to instantly project it.

### Smart Lyrics Import (Hybrid Search)
- **Instant Search**: Type in a song name, and the Apple iTunes API will provide instant, lightning-fast autocomplete results.
- **One-Click Import**: Click an iTunes result, and Rhema will silently reach out to LRCLIB to download the exact lyrics, pre-filling the title, artist, and content into your editor.
- **Save & Queue**: Hit "Import & Save" to instantly save the song to your local library and clear the search.

### ✨ Auto-Formatting (The Magic Wand)
Pasting massive walls of unformatted lyrics is a thing of the past.
- **Smart Chunking**: Click the `✨ Auto-Format` button to intelligently break up large blocks of text (e.g., 8+ lines) into clean, readable 4-line slides.
- **Tag Recognition**: Automatically detects headers like `Chorus:` or `Verse 1` and perfectly converts them to standardized `[Chorus]` tags.
- **Whitespace Cleanup**: Automatically normalizes spacing, ensuring the final output looks stunning.

---

## ⌨️ Live Keyboard Hotkeys

When a song is live, the presentation is entirely non-linear. You can follow the worship leader anywhere they go instantly using your keyboard. 

*(Note: Hotkeys safely disable themselves when you are typing in a search bar or text editor).*

| Action | Shortcut Key | Description |
| :--- | :--- | :--- |
| **Next Slide** | `Right Arrow` or `Space` | Advance to the next sequential slide. |
| **Previous Slide** | `Left Arrow` | Go back to the previous sequential slide. |
| **Jump to Chorus** | `C` | Instantly jump to the `[Chorus]`. Press again to cycle to the next Chorus. |
| **Jump to Verse** | `V` | Instantly jump to the `[Verse]`. Press again to cycle from Verse 1 to Verse 2. |
| **Jump to Bridge** | `B` | Instantly jump to the `[Bridge]`. |
| **Jump to Pre-Chorus**| `P` | Instantly jump to the `[Pre-Chorus]`. |
| **Jump to Tag** | `T` | Instantly jump to the `[Tag]`. |
| **Jump to Intro** | `I` | Instantly jump to the `[Intro]`. |
| **Jump to Ending** | `E` | Instantly jump to the `[Ending]` or `[Outro]`. |

---

## 📖 Bible & AI Integration

- **Semantic AI Search**: Ask natural language questions like *"What does the Bible say about peace?"* to instantly find matching verses using local ONNX embeddings.
- **Deepgram Voice Detection**: Rhema can listen to the pastor speaking and automatically project the verse they are reading (AI Auto-Projection).

---

## 🖼️ Media & Image Library

- **Drag & Drop**: Drop images straight into the app to add them to your local Image Library.
- **Instant Projection**: Click an image to instantly override the live background with the selected image. Click again to clear it.
- **Media Modes**: Support for Cover, Contain, and custom blur/brightness adjustments.
