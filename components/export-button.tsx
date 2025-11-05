'use client'

import { useState } from 'react'

import { Download01Icon, Pdf01Icon, TextIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { exportAsMarkdown, exportAsPDF } from '@/lib/utils/export'

import { Button } from './ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from './ui/dropdown-menu'

interface ExportButtonProps {
  content: string
  className?: string
}

export function ExportButton({ content, className }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportMarkdown = async () => {
    if (!content) {
      toast.error('No content to export')
      return
    }

    setIsExporting(true)
    try {
      await exportAsMarkdown(content)
      toast.success('Exported as Markdown')
    } catch (error) {
      console.error('Error exporting markdown:', error)
      toast.error('Failed to export Markdown')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = async () => {
    if (!content) {
      toast.error('No content to export')
      return
    }

    setIsExporting(true)
    try {
      await exportAsPDF(content)
      toast.success('Exported as PDF')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Failed to export PDF')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          disabled={isExporting}
          className={cn(
            'h-8 px-3 rounded-full gap-1.5 font-small text-xs uppercase',
            'bg-secondary text-secondary-foreground shadow-xs',
            'hover:bg-secondary/80 transition-all duration-200',
            className
          )}
        >
          {isExporting ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <>
              <HugeiconsIcon icon={Download01Icon} size={16} color="currentColor" strokeWidth={2} />
              <span>Export</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        sideOffset={4}
        side="bottom"
        alignOffset={0}
      >
        <DropdownMenuItem
          onClick={handleExportMarkdown}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <div className="w-full flex items-center gap-2">
            <HugeiconsIcon icon={TextIcon} size={16} color="currentColor" strokeWidth={2} />
            <span>Export as Markdown</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleExportPDF}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <div className="w-full flex items-center gap-2">
            <HugeiconsIcon icon={Pdf01Icon} size={16} color="currentColor" strokeWidth={2} />
            <span>Export as PDF</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

