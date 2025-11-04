import jsPDF from 'jspdf'

/**
 * Export text content as Markdown file
 */
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

interface TextChunk {
  text: string
  fontSize: number
  fontStyle: 'normal' | 'bold' | 'italic'
  color?: [number, number, number]
}

interface ContentBlock {
  type: 'line' | 'table' | 'codeblock'
  chunks?: TextChunk[]
  table?: { headers: string[], rows: string[][] }
  code?: string
  spacing?: number
}

/**
 * Clean text of special characters that don't render well in PDFs
 */
function cleanText(text: string): string {
  return text
    .replace(/[\u2011\u2012\u2013\u2014\u2015]/g, '-') // Non-breaking hyphens, en-dash, em-dash to regular hyphen
    .replace(/[\u2018\u2019]/g, "'") // Smart quotes to regular quotes
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes to regular quotes
    .replace(/\u2026/g, '...') // Ellipsis to three dots
    .replace(/[\u00A0]/g, ' ') // Non-breaking space to regular space
}

/**
 * Process inline markdown elements in a line of text
 */
function processInlineMarkdown(line: string): TextChunk[] {
  // Clean the line first
  line = cleanText(line)

  interface InlineElement {
    start: number
    end: number
    type: 'code' | 'bold' | 'italic' | 'link'
    content: string
    displayText?: string
  }

  const elements: InlineElement[] = []
  
  // Find links first (they can contain other markdown)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  let match: RegExpExecArray | null
  while ((match = linkRegex.exec(line)) !== null) {
    elements.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'link',
      content: match[2], // URL
      displayText: match[1] // Link text
    })
  }

  // Find inline code (but not in links)
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

  // Find bold (**text**)
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

  // Find italic (*text* but not **text**)
  const italicRegex = /(?<!\*)\*([^*]+?)\*(?!\*)/g
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

  // Sort elements by position
  elements.sort((a, b) => a.start - b.start)

  // Build chunks from the line
  const chunks: TextChunk[] = []
  
  if (elements.length === 0) {
    chunks.push({
      text: line,
      fontSize: 11,
      fontStyle: 'normal'
    })
    return chunks
  }

  let lastPos = 0
  for (const element of elements) {
    // Add text before element
    if (element.start > lastPos) {
      const beforeText = line.substring(lastPos, element.start)
      if (beforeText) {
        chunks.push({
          text: beforeText,
          fontSize: 11,
          fontStyle: 'normal'
        })
      }
    }

    // Add formatted element
    if (element.type === 'code') {
      chunks.push({
        text: element.content,
        fontSize: 9,
        fontStyle: 'normal',
        color: [80, 80, 80]
      })
    } else if (element.type === 'bold') {
      chunks.push({
        text: element.content,
        fontSize: 11,
        fontStyle: 'bold'
      })
    } else if (element.type === 'italic') {
      chunks.push({
        text: element.content,
        fontSize: 11,
        fontStyle: 'italic'
      })
    } else if (element.type === 'link') {
      chunks.push({
        text: element.displayText || element.content,
        fontSize: 9,
        fontStyle: 'normal',
        color: [0, 0, 200]
      })
    }

    lastPos = element.end
  }

  // Add remaining text after last element
  if (lastPos < line.length) {
    const remainingText = line.substring(lastPos)
    if (remainingText) {
      chunks.push({
        text: remainingText,
        fontSize: 11,
        fontStyle: 'normal'
      })
    }
  }

  return chunks
}

/**
 * Detect and parse markdown tables
 */
function parseTable(lines: string[], startIndex: number): { table: { headers: string[], rows: string[][] }, endIndex: number } | null {
  if (startIndex >= lines.length) return null
  
  const headerLine = lines[startIndex]
  if (!headerLine.includes('|')) return null
  
  // Check if next line is separator
  if (startIndex + 1 >= lines.length) return null
  const separatorLine = lines[startIndex + 1]
  if (!separatorLine.match(/^\|?[\s:|-]+\|/)) return null
  
  // Parse headers - clean markdown from headers
  const headers = headerLine
    .split('|')
    .map(h => {
      let cleaned = h.trim()
      // Remove markdown from headers
      cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
      cleaned = cleaned.replace(/`(.+?)`/g, '$1') // Remove code
      cleaned = cleanText(cleaned)
      return cleaned
    })
    .filter(h => h.length > 0)
  
  if (headers.length === 0) return null
  
  // Parse rows
  const rows: string[][] = []
  let i = startIndex + 2
  
  while (i < lines.length) {
    const line = lines[i]
    if (!line.includes('|')) break
    
    const cells = line
      .split('|')
      .map(c => {
        let cleaned = c.trim()
        // Remove markdown from cells
        cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
        cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
        cleaned = cleaned.replace(/`(.+?)`/g, '$1') // Remove code
        cleaned = cleanText(cleaned)
        return cleaned
      })
      .filter((c, idx, arr) => {
        // Filter out empty cells at start/end (from leading/trailing |)
        if (idx === 0 && c === '') return false
        if (idx === arr.length - 1 && c === '') return false
        return true
      })
    
    if (cells.length > 0) {
      // Pad cells to match header count
      while (cells.length < headers.length) {
        cells.push('')
      }
      rows.push(cells.slice(0, headers.length))
    }
    i++
  }
  
  return {
    table: { headers, rows },
    endIndex: i - 1
  }
}

/**
 * Parse markdown and convert to content blocks
 */
function parseMarkdownToBlocks(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  const lines = content.split('\n')
  let i = 0
  let inCodeBlock = false
  let codeBlockContent: string[] = []

  while (i < lines.length) {
    const line = lines[i]

    // Handle code blocks
    if (line.match(/^```/)) {
      if (inCodeBlock) {
        // End of code block
        blocks.push({
          type: 'codeblock',
          code: codeBlockContent.join('\n')
        })
        codeBlockContent = []
        inCodeBlock = false
      } else {
        // Start of code block
        inCodeBlock = true
      }
      i++
      continue
    }

    if (inCodeBlock) {
      codeBlockContent.push(line)
      i++
      continue
    }

    // Try to parse table
    const tableResult = parseTable(lines, i)
    if (tableResult) {
      blocks.push({
        type: 'table',
        table: tableResult.table
      })
      i = tableResult.endIndex + 1
      continue
    }

    // Handle headers
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headerMatch) {
      const level = headerMatch[1].length
      const text = headerMatch[2]
      const fontSize = level === 1 ? 18 : level === 2 ? 16 : level === 3 ? 14 : 12
      
      // Add spacing before header
      if (blocks.length > 0) {
        blocks.push({ type: 'line', chunks: [], spacing: 3 })
      }
      
      const headerChunks = processInlineMarkdown(text)
      headerChunks.forEach(chunk => {
        chunk.fontSize = fontSize
        chunk.fontStyle = 'bold'
      })
      blocks.push({ type: 'line', chunks: headerChunks })
      blocks.push({ type: 'line', chunks: [], spacing: 2 })
      i++
      continue
    }

    // Handle horizontal rules
    if (line.match(/^[-*_]{3,}$/)) {
      blocks.push({ type: 'line', chunks: [], spacing: 2 })
      i++
      continue
    }

    // Handle list items
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/)
    if (listMatch) {
      const indent = listMatch[1].length
      const text = listMatch[3]
      const prefix = '  '.repeat(Math.floor(indent / 2)) + '• '
      
      const listChunks = processInlineMarkdown(text)
      if (listChunks.length > 0) {
        listChunks[0].text = prefix + listChunks[0].text
      }
      blocks.push({ type: 'line', chunks: listChunks })
      i++
      continue
    }

    // Handle blockquotes
    if (line.match(/^>\s+(.+)$/)) {
      const text = line.replace(/^>\s+/, '')
      const quoteChunks = processInlineMarkdown(text)
      quoteChunks.forEach((chunk, idx) => {
        if (idx === 0) {
          chunk.text = '  ' + chunk.text
        }
        chunk.fontStyle = 'italic'
        if (!chunk.color) {
          chunk.color = [100, 100, 100]
        }
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

/**
 * Export content as PDF with proper formatting
 */
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
    let y = margin

    const blocks = parseMarkdownToBlocks(content)

    const addNewPage = () => {
      pdf.addPage()
      y = margin
    }

    const checkPageOverflow = (requiredHeight: number) => {
      if (y + requiredHeight > pageHeight - margin) {
        addNewPage()
        return true
      }
      return false
    }

    const renderLine = (chunks: TextChunk[], spacing?: number) => {
      if (spacing) {
        y += spacing
        return
      }

      if (!chunks || chunks.length === 0) {
        y += 4
        return
      }

      const maxFontSize = Math.max(...chunks.map(c => c.fontSize))
      const lineHeight = maxFontSize * 0.352778 // Convert points to mm

      checkPageOverflow(lineHeight)

      let x = margin

      for (const chunk of chunks) {
        pdf.setFontSize(chunk.fontSize)
        const fontStyle = chunk.fontStyle === 'bold' ? 'bold' : 
                         chunk.fontStyle === 'italic' ? 'italic' : 'normal'
        pdf.setFont('helvetica', fontStyle)

        if (chunk.color) {
          pdf.setTextColor(chunk.color[0], chunk.color[1], chunk.color[2])
        } else {
          pdf.setTextColor(0, 0, 0)
        }

        // Split text into words for wrapping
        const words = chunk.text.split(' ')
        
        for (let i = 0; i < words.length; i++) {
          const word = words[i]
          const isLastWord = i === words.length - 1
          const textToAdd = isLastWord ? word : word + ' '
          const textWidth = pdf.getTextWidth(textToAdd)
          const remainingWidth = pageWidth - x - margin

          // Check if word fits on current line
          if (textWidth <= remainingWidth) {
            pdf.text(textToAdd, x, y + lineHeight * 0.85)
            x += textWidth
          } else {
            // Word doesn't fit, move to next line
            if (x > margin) {
              // We're mid-line, go to next line
              y += lineHeight
              checkPageOverflow(lineHeight)
              x = margin
            }
            
            // Now try to render the word
            if (textWidth <= maxWidth) {
              // Word fits on new line
              pdf.text(textToAdd, x, y + lineHeight * 0.85)
              x += textWidth
            } else {
              // Word is too long, need to break it
              let remainingWord = textToAdd
              while (remainingWord.length > 0) {
                let fitLength = remainingWord.length
                while (fitLength > 0 && pdf.getTextWidth(remainingWord.substring(0, fitLength)) > maxWidth) {
                  fitLength--
                }
                
                if (fitLength === 0) fitLength = 1 // Always make progress
                
                const part = remainingWord.substring(0, fitLength)
                pdf.text(part, x, y + lineHeight * 0.85)
                remainingWord = remainingWord.substring(fitLength)
                
                if (remainingWord.length > 0) {
                  y += lineHeight
                  checkPageOverflow(lineHeight)
                  x = margin
                } else {
                  x += pdf.getTextWidth(part)
                }
              }
            }
          }
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

      // Calculate row heights dynamically based on content
      const headerHeight = 9
      
      // Calculate heights for each row
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

      // Calculate total table height
      const tableHeight = headerHeight + rowHeights.reduce((sum, h) => sum + h, 0)
      checkPageOverflow(tableHeight)

      const startY = y

      // Draw header background
      pdf.setFillColor(230, 230, 230)
      pdf.rect(margin, y, maxWidth, headerHeight, 'F')
      
      // Draw header text
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      
      for (let i = 0; i < table.headers.length; i++) {
        const x = margin + (i * colWidth) + padding
        const headerText = table.headers[i]
        const wrappedText = pdf.splitTextToSize(headerText, maxCellWidth)
        const displayText = wrappedText[0] // Just show first line for headers
        pdf.text(displayText, x, y + headerHeight * 0.65)
      }
      
      y += headerHeight

      // Draw rows
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      
      for (let rowIdx = 0; rowIdx < table.rows.length; rowIdx++) {
        const row = table.rows[rowIdx]
        const rowHeight = rowHeights[rowIdx]
        
        // Alternate row colors
        if (rowIdx % 2 === 0) {
          pdf.setFillColor(248, 248, 248)
          pdf.rect(margin, y, maxWidth, rowHeight, 'F')
        }
        
        for (let colIdx = 0; colIdx < colCount; colIdx++) {
          const x = margin + (colIdx * colWidth) + padding
          const cellText = row[colIdx] || ''
          
          // Wrap text to fit in cell
          const wrappedLines = pdf.splitTextToSize(cellText, maxCellWidth)
          
          // Draw each line of wrapped text
          let lineY = y + 4
          for (const line of wrappedLines) {
            pdf.text(line, x, lineY)
            lineY += 4
          }
        }
        
        y += rowHeight
      }

      // Draw table borders
      pdf.setDrawColor(180, 180, 180)
      pdf.setLineWidth(0.1)
      
      // Outer border
      pdf.rect(margin, startY, maxWidth, tableHeight)
      
      // Vertical lines between columns
      for (let i = 1; i < colCount; i++) {
        const x = margin + (i * colWidth)
        pdf.line(x, startY, x, startY + tableHeight)
      }
      
      // Horizontal line after header
      pdf.line(margin, startY + headerHeight, margin + maxWidth, startY + headerHeight)
      
      // Horizontal lines between rows
      let currentY = startY + headerHeight
      for (const rowHeight of rowHeights) {
        currentY += rowHeight
        if (currentY < startY + tableHeight) {
          pdf.line(margin, currentY, margin + maxWidth, currentY)
        }
      }
      
      y += 5 // Add spacing after table
    }

    const renderCodeBlock = (code: string) => {
      const lines = code.split('\n')
      const lineHeight = 4.5
      const padding = 3
      
      const blockHeight = (lines.length * lineHeight) + (padding * 2)
      checkPageOverflow(blockHeight)
      
      // Background
      pdf.setFillColor(245, 245, 245)
      pdf.rect(margin, y, maxWidth, blockHeight, 'F')
      
      // Border
      pdf.setDrawColor(220, 220, 220)
      pdf.setLineWidth(0.1)
      pdf.rect(margin, y, maxWidth, blockHeight)
      
      // Code text
      pdf.setFontSize(9)
      pdf.setFont('courier', 'normal')
      pdf.setTextColor(50, 50, 50)
      
      let codeY = y + padding + 3
      for (const line of lines) {
        const cleanedLine = cleanText(line)
        pdf.text(cleanedLine, margin + padding, codeY)
        codeY += lineHeight
      }
      
      y += blockHeight + 4
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

    pdf.save(filename || `chat-export-${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (error) {
    console.error('Error exporting PDF:', error)
    throw new Error('Failed to export PDF')
  }
}