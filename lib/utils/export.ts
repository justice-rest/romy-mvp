import jsPDF from 'jspdf'

/** -------- Settings -------- */

const LOGO_PATH = '/images/image.png' // change if needed

// App theme colors (matching your app's design)
const COLORS = {
  primary: [139, 92, 246] as [number, number, number],    // Purple/violet
  text: [15, 23, 42] as [number, number, number],         // Dark slate
  textMuted: [100, 116, 139] as [number, number, number], // Muted slate
  background: [255, 255, 255] as [number, number, number],// White
  accent: [245, 245, 250] as [number, number, number],    // Very light gray
  border: [226, 232, 240] as [number, number, number],    // Light border
  codeBackground: [248, 250, 252] as [number, number, number], // Light code bg
  linkColor: [99, 102, 241] as [number, number, number]   // Indigo for links
}

/** -------- Markdown Export (unchanged) -------- */

export async function exportAsMarkdown(
  content: string,
  filename?: string
): Promise<void> {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `chat-export-${new Date().toISOString().split('T')[0]}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** -------- Types -------- */

interface TextChunk {
  text: string
  fontSize: number
  fontStyle: 'normal' | 'bold' | 'italic'
  color?: [number, number, number]
  /** If present, this chunk is rendered as a clickable link */
  url?: string
}

interface ContentBlock {
  type: 'line' | 'table' | 'codeblock'
  chunks?: TextChunk[]
  table?: { headers: string[], rows: string[][] }
  code?: string
  spacing?: number
}

/** -------- Utilities -------- */

/** Clean text of special characters that don't render well in PDFs */
function cleanText(text: string): string {
  return text
    .replace(/[\u2011\u2012\u2013\u2014\u2015]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/[\u00A0]/g, ' ')
}

/** Load image and return base64 + natural dimensions */
async function loadImageMeta(imagePath: string): Promise<{ base64: string; w: number; h: number } | null> {
  try {
    const response = await fetch(encodeURI(imagePath)) // handles spaces in path
    const blob = await response.blob()
    const base64: string = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
      img.onerror = reject
      img.src = base64
    })
    return { base64, ...dims }
  } catch (error) {
    console.error('Failed to load image:', error)
    return null
  }
}

/** -------- Inline Markdown -------- */

function processInlineMarkdown(line: string): TextChunk[] {
  line = cleanText(line)

  interface InlineElement {
    start: number
    end: number
    type: 'code' | 'bold' | 'italic' | 'link'
    content: string
    displayText?: string
  }

  const elements: InlineElement[] = []
  let match: RegExpExecArray | null

  // Links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  while ((match = linkRegex.exec(line)) !== null) {
    elements.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'link',
      content: match[2],
      displayText: match[1]
    })
  }

  // Inline code
  const codeRegex = /`([^`]+)`/g
  while ((match = codeRegex.exec(line)) !== null) {
    const isInLink = elements.some(e => e.type === 'link' && e.start <= match!.index && e.end > match!.index)
    if (!isInLink) {
      elements.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'code',
        content: match[1]
      })
    }
  }

  // Bold
  const boldRegex = /\*\*(.+?)\*\*/g
  while ((match = boldRegex.exec(line)) !== null) {
    const isInOther = elements.some(e => e.start <= match!.index && e.end > match!.index)
    if (!isInOther) {
      elements.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'bold',
        content: match[1]
      })
    }
  }

  // Italic
  const italicRegex = /\*(.+?)\*/g
  while ((match = italicRegex.exec(line)) !== null) {
    const isInOther = elements.some(e => e.start <= match!.index && e.end > match!.index)
    if (!isInOther) {
      elements.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'italic',
        content: match[1]
      })
    }
  }

  elements.sort((a, b) => a.start - b.start)

  const chunks: TextChunk[] = []
  let lastEnd = 0

  for (const element of elements) {
    if (element.start > lastEnd) {
      const text = line.substring(lastEnd, element.start)
      if (text.length > 0) {
        chunks.push({
          text,
          fontSize: 10,
          fontStyle: 'normal',
          color: COLORS.text
        })
      }
    }

    switch (element.type) {
      case 'bold':
        chunks.push({
          text: element.content,
          fontSize: 10,
          fontStyle: 'bold',
          color: COLORS.text
        })
        break
      case 'italic':
        chunks.push({
          text: element.content,
          fontSize: 10,
          fontStyle: 'italic',
          color: COLORS.text
        })
        break
      case 'code':
        chunks.push({
          text: element.content,
          fontSize: 9,
          fontStyle: 'normal',
          color: COLORS.primary
        })
        break
      case 'link':
        chunks.push({
          text: element.displayText || element.content,
          fontSize: 10,
          fontStyle: 'normal',
          color: COLORS.linkColor,
          url: element.content
        })
        break
    }

    lastEnd = element.end
  }

  if (lastEnd < line.length) {
    const text = line.substring(lastEnd)
    if (text.length > 0) {
      chunks.push({
        text,
        fontSize: 10,
        fontStyle: 'normal',
        color: COLORS.text
      })
    }
  }

  return chunks
}

/** -------- Markdown → Blocks -------- */

function parseTable(lines: string[], startIndex: number): { table: { headers: string[], rows: string[][] }, endIndex: number } | null {
  const headerLine = lines[startIndex]
  const separatorLine = lines[startIndex + 1]
  if (!headerLine || !separatorLine) return null
  if (!separatorLine.includes('---')) return null

  const headers = headerLine
    .split('|')
    .map(h => h.trim())
    .filter(h => h.length > 0)

  if (headers.length === 0) return null

  const rows: string[][] = []
  let i = startIndex + 2

  while (i < lines.length) {
    const line = lines[i]
    if (!line.includes('|')) break
    const cells = line
      .split('|')
      .map(c => c.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1 || arr.length === headers.length)

    if (cells.length > 0) rows.push(cells.slice(0, headers.length))
    i++
  }

  return { table: { headers, rows }, endIndex: i }
}

function parseMarkdownToBlocks(content: string): ContentBlock[] {
  const lines = content.split('\n')
  const blocks: ContentBlock[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code blocks
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      blocks.push({ type: 'codeblock', code: codeLines.join('\n') })
      i++
      continue
    }

    // Tables
    if (line.includes('|') && lines[i + 1]?.includes('---')) {
      const tableResult = parseTable(lines, i)
      if (tableResult) {
        blocks.push({ type: 'table', table: tableResult.table })
        i = tableResult.endIndex
        continue
      }
    }

    // Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headerMatch) {
      const level = headerMatch[1].length
      const text = headerMatch[2]
      const fontSize = Math.max(16, 24 - level * 2)
      blocks.push({
        type: 'line',
        chunks: [{
          text: cleanText(text),
          fontSize,
          fontStyle: 'bold',
          color: COLORS.primary
        }],
        spacing: level === 1 ? 6 : 4
      })
      i++
      continue
    }

    // Lists
    if (line.match(/^(\s*)[-*+]\s+(.+)$/)) {
      const match = line.match(/^(\s*)[-*+]\s+(.+)$/)!
      const indent = match[1].length
      const text = match[2]
      const prefix = '  '.repeat(Math.floor(indent / 2)) + '• '
      const listChunks = processInlineMarkdown(text)
      if (listChunks.length > 0) listChunks[0].text = prefix + listChunks[0].text
      blocks.push({ type: 'line', chunks: listChunks })
      i++
      continue
    }

    // Blockquotes
    if (line.match(/^>\s+(.+)$/)) {
      const text = line.replace(/^>\s+/, '')
      const quoteChunks = processInlineMarkdown(text)
      quoteChunks.forEach((chunk, idx) => {
        if (idx === 0) chunk.text = '  ' + chunk.text
        chunk.fontStyle = 'italic'
        chunk.color = COLORS.textMuted
      })
      blocks.push({ type: 'line', chunks: quoteChunks })
      i++
      continue
    }

    // Empty line
    if (line.trim() === '') {
      blocks.push({ type: 'line', chunks: [], spacing: 4 })
      i++
      continue
    }

    // Regular text
    const regularChunks = processInlineMarkdown(line)
    blocks.push({ type: 'line', chunks: regularChunks })
    i++
  }

  return blocks
}

/** -------- PDF Export -------- */

function addBrandHeader(
  pdf: jsPDF,
  pageWidth: number,
  margin: number,
  logo: { base64: string; w: number; h: number } | null,
  opts?: { logoHeightMm?: number; gapMm?: number }
) {
  const logoHeightMm = opts?.logoHeightMm ?? 12
  const gapMm = opts?.gapMm ?? 4

  let headerHeight = 0

  if (logo) {
    const ratio = logo.w / logo.h
    const logoW = logoHeightMm * ratio
    const x = margin
    const y = margin
    pdf.addImage(logo.base64, 'PNG', x, y, logoW, logoHeightMm)
    headerHeight = Math.max(headerHeight, logoHeightMm)
  }

  return headerHeight + gapMm + 2
}

export async function exportAsPDF(
  content: string,
  filename?: string
): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const margin = 20
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const maxWidth = pageWidth - 2 * margin

    // Load logo once
    const logoMeta = await loadImageMeta(LOGO_PATH)

    // Header on page 1
    let y = margin + addBrandHeader(pdf, pageWidth, margin, logoMeta, { logoHeightMm: 12 })

    const blocks = parseMarkdownToBlocks(content)

    const addNewPage = () => {
      pdf.addPage()
      y = margin + addBrandHeader(pdf, pageWidth, margin, logoMeta, { logoHeightMm: 10 })
    }

    const checkPageOverflow = (requiredHeight: number) => {
      if (y + requiredHeight > pageHeight - margin) {
        addNewPage()
        return true
      }
      return false
    }

    const renderLine = (chunks: TextChunk[], spacing?: number) => {
      if (spacing) { y += spacing; return }
      if (!chunks || chunks.length === 0) { y += 4; return }

      const maxFontSize = Math.max(...chunks.map(c => c.fontSize))
      const lineHeight = maxFontSize * 0.352778
      checkPageOverflow(lineHeight)

      let x = margin

      for (const chunk of chunks) {
        const fontStyle = chunk.fontStyle === 'bold' ? 'bold'
                        : chunk.fontStyle === 'italic' ? 'italic' : 'normal'
        pdf.setFont('helvetica', fontStyle)
        pdf.setFontSize(chunk.fontSize)
        pdf.setTextColor(...(chunk.color ?? COLORS.text))

        const words = chunk.text.split(' ')
        for (let i = 0; i < words.length; i++) {
          const isLastWord = i === words.length - 1
          const token = isLastWord ? words[i] : words[i] + ' '
          const tokenWidth = pdf.getTextWidth(token)
          const remaining = pageWidth - x - margin

          // wrap if needed
          if (tokenWidth > remaining && x > margin) {
            y += lineHeight
            checkPageOverflow(lineHeight)
            x = margin
          }

          const baselineY = y + lineHeight * 0.85

          // clickable link if url present (ts cast for jspdf typings)
          if (chunk.url) {
            ;(pdf as any).textWithLink
              ? (pdf as any).textWithLink(token, x, baselineY, { url: chunk.url })
              : pdf.text(token, x, baselineY) // graceful fallback
          } else {
            pdf.text(token, x, baselineY)
          }

          x += tokenWidth
        }
      }

      y += lineHeight
    }

    const renderTable = (table: { headers: string[], rows: string[][] }) => {
      const colCount = table.headers.length
      const colWidth = maxWidth / colCount
      const padding = 2
      const cellPadding = 1
      const maxCellWidth = colWidth - (padding * 2)

      const headerHeight = 10

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')

      const rowHeights: number[] = []
      for (const row of table.rows) {
        let maxLines = 1
        for (let colIdx = 0; colIdx < colCount; colIdx++) {
          const cellText = row[colIdx] || ''
          const wrappedLines = pdf.splitTextToSize(cellText, maxCellWidth)
          maxLines = Math.max(maxLines, wrappedLines.length)
        }
        const rowHeight = Math.max(8, maxLines * 4 + cellPadding * 2)
        rowHeights.push(rowHeight)
      }

      const tableHeight = headerHeight + rowHeights.reduce((sum, h) => sum + h, 0)
      checkPageOverflow(tableHeight)

      // Header with brand color
      pdf.setFillColor(...COLORS.primary)
      pdf.rect(margin, y, maxWidth, headerHeight, 'F')

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)

      for (let i = 0; i < table.headers.length; i++) {
        const x = margin + (i * colWidth) + padding
        const headerText = table.headers[i]
        const wrappedText = pdf.splitTextToSize(headerText, maxCellWidth)
        const displayText = wrappedText[0]
        pdf.text(displayText, x, y + headerHeight * 0.65)
      }

      y += headerHeight

      // Rows
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor(...COLORS.text)

      for (let rowIdx = 0; rowIdx < table.rows.length; rowIdx++) {
        const row = table.rows[rowIdx]
        const rowHeight = rowHeights[rowIdx]

        // zebra
        if (rowIdx % 2 === 0) {
          pdf.setFillColor(...COLORS.accent)
          pdf.rect(margin, y, maxWidth, rowHeight, 'F')
        }

        for (let colIdx = 0; colIdx < colCount; colIdx++) {
          const x = margin + (colIdx * colWidth) + padding
          const cellText = row[colIdx] || ''
          const wrappedLines = pdf.splitTextToSize(cellText, maxCellWidth)
          let lineY = y + 4
          for (const line of wrappedLines) {
            pdf.text(line, x, lineY)
            lineY += 4
          }
        }

        y += rowHeight
      }

      // Border lines
      pdf.setDrawColor(...COLORS.border)
      pdf.setLineWidth(0.2)

      // Horizontal
      let currentY = y - rowHeights.reduce((sum, h) => sum + h, 0) - headerHeight
      pdf.line(margin, currentY, margin + maxWidth, currentY)
      currentY += headerHeight
      pdf.line(margin, currentY, margin + maxWidth, currentY)
      for (const h of rowHeights) {
        currentY += h
        pdf.line(margin, currentY, margin + maxWidth, currentY)
      }

      // Vertical
      for (let i = 0; i <= colCount; i++) {
        const x = margin + i * colWidth
        const startY = y - rowHeights.reduce((sum, h) => sum + h, 0) - headerHeight
        pdf.line(x, startY, x, y)
      }

      y += 5
    }

    const renderCodeBlock = (code: string) => {
      const codeLines = code.split('\n')
      const lineHeight = 4
      const padding = 3
      const totalHeight = codeLines.length * lineHeight + padding * 2

      checkPageOverflow(totalHeight)

      // Background panel
      pdf.setFillColor(...COLORS.codeBackground)
      ;(pdf as any).roundedRect
        ? (pdf as any).roundedRect(margin, y, maxWidth, totalHeight, 2, 2, 'F')
        : pdf.rect(margin, y, maxWidth, totalHeight, 'F')

      pdf.setFontSize(9)
      pdf.setFont('courier', 'normal')
      pdf.setTextColor(...COLORS.text)

      let codeY = y + padding + 3
      for (const line of codeLines) {
        const cleanLine = cleanText(line)
        pdf.text(cleanLine, margin + padding, codeY)
        codeY += lineHeight
      }

      y += totalHeight + 3
    }

    // Render all blocks
    for (const block of blocks) {
      if (block.type === 'line') {
        renderLine(block.chunks || [], block.spacing)
      } else if (block.type === 'table' && block.table) {
        renderTable(block.table)
      } else if (block.type === 'codeblock' && block.code) {
        renderCodeBlock(block.code)
      }
    }

    // Footer with page numbers
    const pageCount = (pdf as any).internal?.pages?.length ? (pdf as any).internal.pages.length - 1 : 1
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(...COLORS.textMuted)
      const pageText = `Page ${i} of ${pageCount}`
      const textWidth = pdf.getTextWidth(pageText)
      pdf.text(pageText, (pageWidth - textWidth) / 2, pageHeight - 10)
    }

    const pdfFilename = filename || `romy-export-${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(pdfFilename)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}
